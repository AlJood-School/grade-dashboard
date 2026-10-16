/**
 * EduOS — staged server-only identity boundary, not wired to live routes.
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712.
 * No accounts, school registry, credentials, default tenant or example records.
 */

export type DataEnvironment = 'real' | 'demo' | 'test';
export type Action = 'portal.session.read' | 'student.records.read';
type IdentityKind = 'staff' | 'student' | 'parent';
type LinkKind = 'staff_assignment' | 'self' | 'guardian';

export interface DeploymentBinding {
  authBaseUrl: string;
  tenantId: string;
  dataEnvironment: DataEnvironment;
  allowedOrigins: readonly string[];
}

/** Only a trusted server-side resolver may supply these records. */
export interface Membership {
  subjectId: string;
  authBaseUrl: string;
  tenantId: string;
  dataEnvironment: DataEnvironment;
  kind: IdentityKind;
  role: string;
  active: boolean;
  version: number;
  validFrom: number;
  validUntil: number;
  actions: readonly Action[];
  studentLinks: readonly {
    studentId: string;
    kind: LinkKind;
    active: boolean;
    validFrom: number;
    validUntil: number;
  }[];
}

export interface StudentScope {
  studentId: string;
  authBaseUrl: string;
  tenantId: string;
  dataEnvironment: DataEnvironment;
}

export interface ServerResolvers {
  /** Must verify with the fixed deployment's Auth service, never the request URL. */
  verifyToken: (token: string) => Promise<{ subjectId: string; expiresAt: number }>;
  /** No matching by username/email/metadata; null means not provisioned. */
  loadMembership: (subjectId: string, deployment: Readonly<DeploymentBinding>) => Promise<Membership | null>;
  /** Read the real row's scope; never copy tenant/environment from the request. */
  loadStudentScope: (studentId: string, deployment: Readonly<DeploymentBinding>) => Promise<StudentScope | null>;
  now?: () => number;
}

export class IdentityError extends Error {
  constructor(readonly status: 400 | 401 | 403 | 503, readonly code: string) {
    super(code);
    this.name = 'IdentityError';
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const environments = new Set(['real', 'demo', 'test']);
const actions = new Set(['portal.session.read', 'student.records.read']);
function fail(status: 400 | 401 | 403 | 503, code: string): never {
  throw new IdentityError(status, code);
}

function authBase(value: unknown): string {
  // Hosted Supabase only in this stage; support for other hosts needs explicit review.
  if (typeof value !== 'string' || !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(value)) {
    fail(503, 'identity_configuration_unavailable');
  }
  return value;
}

function binding(input: DeploymentBinding): Readonly<DeploymentBinding> {
  if (!input || !uuid.test(input.tenantId) || !environments.has(input.dataEnvironment) ||
      !Array.isArray(input.allowedOrigins) || input.allowedOrigins.length === 0) {
    fail(503, 'identity_configuration_unavailable');
  }
  const origins = input.allowedOrigins.map(origin => {
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw new Error();
      return origin;
    } catch { return fail(503, 'identity_configuration_unavailable'); }
  });
  return Object.freeze({
    authBaseUrl: authBase(input.authBaseUrl), tenantId: input.tenantId,
    dataEnvironment: input.dataEnvironment, allowedOrigins: Object.freeze([...origins]),
  });
}

function bearer(request: Request): string {
  const header = request.headers.get('authorization');
  const match = header && /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(header);
  if (!match || header.length > 8192) fail(401, 'authentication_required');
  return match[1];
}

function decodePart(part: string): Record<string, unknown> {
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')), c => c.charCodeAt(0));
    const result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!result || Array.isArray(result) || typeof result !== 'object') throw new Error();
    return result;
  } catch { return fail(401, 'invalid_authentication'); }
}

/**
 * Decoding is NOT signature verification. Auth /user must independently accept
 * the token. Never deploy with a mock verifier or substitute decoded claims.
 */
export function createSupabaseVerifier(
  input: DeploymentBinding,
  publishableKey: string,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  const deployment = binding(input);
  if (typeof publishableKey !== 'string' || !publishableKey.trim()) fail(503, 'identity_configuration_unavailable');
  // This key is sent only to the fixed Auth endpoint. Service keys are forbidden.
  if (publishableKey.startsWith('sb_secret_')) fail(503, 'identity_configuration_unavailable');
  if (!publishableKey.startsWith('sb_publishable_')) {
    const parts = publishableKey.split('.');
    if (parts.length !== 3) fail(503, 'identity_configuration_unavailable');
    let claims: Record<string, unknown>;
    try { claims = decodePart(parts[1]); } catch { return fail(503, 'identity_configuration_unavailable'); }
    if (claims.role !== 'anon') fail(503, 'identity_configuration_unavailable');
  }
  return async (token: string): Promise<{ subjectId: string; expiresAt: number }> => {
    if (typeof token !== 'string' || token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      fail(401, 'invalid_authentication');
    }
    const [headerPart, payloadPart] = token.split('.');
    const header = decodePart(headerPart), claims = decodePart(payloadPart);
    const seconds = now() / 1000;
    if (!Number.isFinite(seconds) || !['ES256', 'RS256', 'HS256'].includes(String(header.alg)) ||
        claims.iss !== deployment.authBaseUrl + '/auth/v1' || claims.aud !== 'authenticated' ||
        claims.role !== 'authenticated' || typeof claims.sub !== 'string' || !uuid.test(claims.sub) ||
        typeof claims.session_id !== 'string' || !uuid.test(claims.session_id) ||
        typeof claims.exp !== 'number' || !Number.isSafeInteger(claims.exp) || claims.exp <= seconds ||
        typeof claims.iat !== 'number' || !Number.isSafeInteger(claims.iat) || claims.iat > seconds + 30 || claims.iat < 0 ||
        claims.exp <= claims.iat ||
        (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || !Number.isSafeInteger(claims.nbf) || claims.nbf > seconds))) {
      fail(401, 'invalid_authentication');
    }
    let response: Response;
    try {
      response = await fetcher(deployment.authBaseUrl + '/auth/v1/user', {
        method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000),
        headers: { apikey: publishableKey, Authorization: 'Bearer ' + token },
      });
    } catch { return fail(503, 'identity_service_unavailable'); }
    if (response.status === 401 || response.status === 403) fail(401, 'invalid_authentication');
    if (!response.ok) fail(503, 'identity_service_unavailable');
    let user: any;
    try { user = await response.json(); } catch { return fail(503, 'identity_service_unavailable'); }
    if (!user || user.id !== claims.sub || user.is_anonymous === true) fail(401, 'invalid_authentication');
    // Neither user_metadata nor app_metadata authorizes a role or a child here.
    const checkedAt = now();
    if (!Number.isFinite(checkedAt)) fail(503, 'identity_service_unavailable');
    if (claims.exp * 1000 <= checkedAt) fail(401, 'invalid_authentication');
    return Object.freeze({ subjectId: user.id, expiresAt: claims.exp * 1000 });
  };
}

function canonicalStudentId(value: unknown): string {
  const id = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value;
  if (typeof id !== 'string' || !/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    fail(400, 'invalid_resource');
  }
  return id;
}

function within(from: unknown, until: unknown, now: number): boolean {
  return typeof from === 'number' && Number.isFinite(from) && typeof until === 'number' &&
    Number.isFinite(until) && from <= now && now < until && from < until;
}

function sameScope(value: { authBaseUrl: string; tenantId: string; dataEnvironment: DataEnvironment }, d: Readonly<DeploymentBinding>) {
  return value.authBaseUrl === d.authBaseUrl && value.tenantId === d.tenantId && value.dataEnvironment === d.dataEnvironment;
}

export function createIdentityAuthorizer(input: DeploymentBinding, resolvers: ServerResolvers) {
  const deployment = binding(input);
  if (typeof resolvers?.verifyToken !== 'function' || typeof resolvers.loadMembership !== 'function' ||
      typeof resolvers.loadStudentScope !== 'function') fail(503, 'identity_configuration_unavailable');
  const now = resolvers.now || Date.now;

  return async function authorize(request: Request, action: Action, studentId?: unknown) {
    if (!actions.has(action)) fail(403, 'access_denied');
    const origin = request.headers.get('origin');
    // CORS is an extra restriction, never evidence of identity or school membership.
    if (origin !== null && !deployment.allowedOrigins.includes(origin)) fail(403, 'access_denied');
    const token = bearer(request);
    let subject: { subjectId: string; expiresAt: number };
    try { subject = await resolvers.verifyToken(token); }
    catch (error) { if (error instanceof IdentityError) throw error; return fail(503, 'identity_service_unavailable'); }
    if (!subject || typeof subject.subjectId !== 'string' || !uuid.test(subject.subjectId)) fail(401, 'invalid_authentication');
    let member: Membership | null;
    try { member = await resolvers.loadMembership(subject.subjectId, deployment); }
    catch { return fail(503, 'identity_registry_unavailable'); }
    const time = now();
    if (!Number.isFinite(time)) fail(503, 'identity_service_unavailable');
    if (!Number.isFinite(subject.expiresAt) || subject.expiresAt <= time) fail(401, 'invalid_authentication');
    if (!member || member.subjectId !== subject.subjectId || !sameScope(member, deployment) || member.active !== true ||
        !['staff', 'student', 'parent'].includes(member.kind) || !/^[a-z][a-z0-9_]{0,63}$/.test(member.role) ||
        !Number.isSafeInteger(member.version) || member.version < 1 || !within(member.validFrom, member.validUntil, time) ||
        !Array.isArray(member.actions) || !member.actions.includes(action)) fail(403, 'access_denied');
    if ((member.kind === 'student' && member.role !== 'student') || (member.kind === 'parent' && member.role !== 'parent') ||
        (member.kind === 'staff' && ['student', 'parent'].includes(member.role))) fail(403, 'access_denied');

    let authorizedStudentId: string | undefined;
    let selectedLink: Membership['studentLinks'][number] | undefined;
    if (action === 'student.records.read') {
      const id = canonicalStudentId(studentId);
      const linkKind = member.kind === 'student' ? 'self' : member.kind === 'parent' ? 'guardian' : 'staff_assignment';
      if (!Array.isArray(member.studentLinks)) fail(403, 'access_denied');
      selectedLink = member.studentLinks.find(link => link && link.studentId === id &&
          link.kind === linkKind && link.active === true && within(link.validFrom, link.validUntil, time));
      if (!selectedLink) fail(403, 'access_denied');
      let scope: StudentScope | null;
      try { scope = await resolvers.loadStudentScope(id, deployment); }
      catch { return fail(503, 'identity_registry_unavailable'); }
      if (!scope || scope.studentId !== id || !sameScope(scope, deployment)) fail(403, 'access_denied');
      authorizedStudentId = id;
    } else if (studentId !== undefined) fail(400, 'invalid_resource');

    // Recheck deadlines after the awaited resolvers, not only at request start.
    const checkedAt = now();
    if (!Number.isFinite(checkedAt)) fail(503, 'identity_service_unavailable');
    if (subject.expiresAt <= checkedAt) fail(401, 'invalid_authentication');
    if (!within(member.validFrom, member.validUntil, checkedAt) ||
        (selectedLink && !within(selectedLink.validFrom, selectedLink.validUntil, checkedAt))) fail(403, 'access_denied');
    // No raw token, family identifier, browser claims or mutable metadata returned.
    return Object.freeze({
      subjectId: subject.subjectId, tenantId: deployment.tenantId, dataEnvironment: deployment.dataEnvironment,
      role: member.role, action, studentId: authorizedStudentId, membershipVersion: member.version, checkedAt,
    });
  };
}
