/** Isolated synthetic unit fixtures. No real accounts, school data or network. */
import { describe, it, expect } from 'bun:test';
import { createIdentityAuthorizer, createSupabaseVerifier, IdentityError } from './identity';
import type { DeploymentBinding, Membership, ServerResolvers, StudentScope } from './identity';

const time = 1800000000000;
const subjectId = crypto.randomUUID(), tenantId = crypto.randomUUID(), sessionId = crypto.randomUUID();
const otherSubject = crypto.randomUUID(), otherTenant = crypto.randomUUID();
const deployment: DeploymentBinding = {
  authBaseUrl: 'https://identitytest.supabase.co', tenantId,
  dataEnvironment: 'test', allowedOrigins: ['https://school.example'],
};
const encode = (v: any) => Buffer.from(JSON.stringify(v)).toString('base64url');
function token(changes: any = {}, header: any = { alg: 'HS256', typ: 'JWT' }) {
  return [encode(header), encode({
    sub: subjectId, session_id: sessionId, iss: deployment.authBaseUrl + '/auth/v1',
    aud: 'authenticated', role: 'authenticated', iat: time / 1000 - 10, exp: time / 1000 + 100,
    ...changes,
  }), 'syntheticSignature'].join('.');
}
function member(changes: Partial<Membership> = {}): Membership {
  return {
    subjectId, authBaseUrl: deployment.authBaseUrl, tenantId, dataEnvironment: 'test',
    kind: 'parent', role: 'parent', active: true, version: 1,
    validFrom: time - 1000, validUntil: time + 100000,
    actions: ['portal.session.read', 'student.records.read'],
    studentLinks: [{ studentId: '1', kind: 'guardian', active: true, validFrom: time - 1000, validUntil: time + 100000 }],
    ...changes,
  };
}
function scope(changes: Partial<StudentScope> = {}): StudentScope {
  return { studentId: '1', authBaseUrl: deployment.authBaseUrl, tenantId, dataEnvironment: 'test', ...changes };
}
function request(authorization = 'Bearer ' + token(), origin: string | null = 'https://school.example') {
  const headers: any = { authorization };
  if (origin !== null) headers.origin = origin;
  return new Request('https://school.example/api/isolated-test', { headers });
}
function setup(changes: Partial<ServerResolvers> = {}, binding = deployment) {
  const calls = { verify: 0, membership: 0, scope: 0 };
  const resolvers: ServerResolvers = {
    verifyToken: async () => { calls.verify++; return { subjectId, expiresAt: time + 100000 }; },
    loadMembership: async (id, d) => { calls.membership++; expect(id).toBe(subjectId); expect(d).toEqual(binding); return member(); },
    loadStudentScope: async () => { calls.scope++; return scope(); },
    now: () => time, ...changes,
  };
  return { authorize: createIdentityAuthorizer(binding, resolvers), calls };
}
async function denied(promise: Promise<unknown>, status: number, code?: string) {
  let error: any;
  try { await promise; } catch (e) { error = e; }
  expect(error).toBeInstanceOf(IdentityError);
  expect(error.status).toBe(status);
  if (code) expect(error.code).toBe(code);
}

describe('fixed Auth endpoint with mocked network, not cryptographic/live verification', () => {
  function verifyWith(fetcher: any, key = 'sb_publishable_synthetic_test_only') {
    return createSupabaseVerifier(deployment, key, fetcher, () => time);
  }
  const accepted = async () => Response.json({ id: subjectId });
  it('calls only the configured Auth endpoint, with redirects forbidden and no cache', async () => {
    const t = token();
    const verify = verifyWith(async (url: string, options: any) => {
      expect(url).toBe(deployment.authBaseUrl + '/auth/v1/user');
      expect(options.redirect).toBe('error'); expect(options.cache).toBe('no-store');
      expect(options.method).toBe('GET'); expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(options.headers.Authorization).toBe('Bearer ' + t);
      return Response.json({ id: subjectId, user_metadata: { role: 'admin', children: ['999'] } });
    });
    expect(await verify(t)).toEqual({ subjectId, expiresAt: time + 100000 });
  });
  it('rejects decoded but remotely rejected token', async () => {
    await denied(verifyWith(async () => new Response('', { status: 401 }))(token()), 401);
  });
  it('rejects a different remote subject', async () => {
    await denied(verifyWith(async () => Response.json({ id: otherSubject }))(token()), 401);
  });
  it('rejects anonymous Auth accounts', async () => {
    await denied(verifyWith(async () => Response.json({ id: subjectId, is_anonymous: true }))(token()), 401);
  });
  it('rejects a token that expires while waiting for Auth', async () => {
    let current = time;
    const verify = createSupabaseVerifier(deployment, 'sb_publishable_synthetic_test_only', (async () => {
      current += 100000; return Response.json({ id: subjectId });
    }) as any, () => current);
    await denied(verify(token()), 401);
  });
  for (const status of [403, 429, 500, 503]) it('fails closed on Auth response ' + status, async () => {
    await denied(verifyWith(async () => new Response('', { status }))(token()), status === 403 ? 401 : 503);
  });
  it('fails closed on malformed Auth response', async () => {
    await denied(verifyWith(async () => new Response('not json'))(token()), 503);
  });
  it('fails closed on network error without copying error details', async () => {
    await denied(verifyWith(async () => { throw new Error('PRIVATE_DETAIL'); })(token()), 503, 'identity_service_unavailable');
  });
  const claimCases: [string, any][] = [
    ['foreign issuer', { iss: 'https://foreign.supabase.co/auth/v1' }],
    ['wrong audience', { aud: 'service_role' }], ['wrong audience array', { aud: ['authenticated'] }],
    ['service role token', { role: 'service_role' }], ['anon role token', { role: 'anon' }],
    ['expired', { exp: time / 1000 }], ['missing expiry', { exp: undefined }],
    ['text expiry', { exp: String(time / 1000 + 100) }],
    ['future issue date', { iat: time / 1000 + 60 }], ['missing issue date', { iat: undefined }],
    ['negative issue date', { iat: -1 }], ['invalid time order', { iat: time / 1000 + 20, exp: time / 1000 + 10 }],
    ['not yet valid', { nbf: time / 1000 + 1 }], ['invalid not-before', { nbf: 'tomorrow' }],
    ['missing subject', { sub: undefined }], ['non-uuid subject', { sub: 'admin' }],
    ['missing session', { session_id: undefined }], ['non-uuid session', { session_id: 'legacy' }],
  ];
  for (const [name, changes] of claimCases) it('rejects ' + name + ' before a network call', async () => {
    let calls = 0;
    await denied(verifyWith(async () => { calls++; return accepted(); })(token(changes)), 401);
    expect(calls).toBe(0);
  });
  it('rejects algorithm none', async () => { await denied(verifyWith(accepted)(token({}, { alg: 'none' })), 401); });
  for (const malformed of ['random-session', 'a.b.c', 'a.b.c.d', '', 'x'.repeat(8193)]) {
    it('rejects malformed bearer payload of length ' + malformed.length, async () => {
      await denied(verifyWith(accepted)(malformed), 401);
    });
  }
  it('refuses service key configuration', () => {
    expect(() => verifyWith(accepted, 'sb_secret_test')).toThrow(IdentityError);
    expect(() => verifyWith(accepted, [encode({ alg: 'HS256' }), encode({ role: 'service_role' }), 'x'].join('.'))).toThrow(IdentityError);
  });
  it('accepts legacy public key shape only as anon', async () => {
    const key = [encode({ alg: 'HS256' }), encode({ role: 'anon' }), 'x'].join('.');
    expect(await verifyWith(accepted, key)(token())).toEqual({ subjectId, expiresAt: time + 100000 });
  });
});

describe('trusted membership and real resource scope using synthetic resolvers', () => {
  it('permits a provisioned parent only for the linked record', async () => {
    const { authorize, calls } = setup();
    const principal = await authorize(request(), 'student.records.read', 1);
    expect(principal).toEqual({ subjectId, tenantId, dataEnvironment: 'test', role: 'parent', action: 'student.records.read', studentId: '1', membershipVersion: 1, checkedAt: time });
    expect(Object.isFrozen(principal)).toBe(true);
    expect(calls).toEqual({ verify: 1, membership: 1, scope: 1 });
    expect(JSON.stringify(principal)).not.toContain('syntheticSignature');
  });
  it('reads session without a student lookup', async () => {
    const { authorize, calls } = setup();
    expect((await authorize(request(), 'portal.session.read')).role).toBe('parent');
    expect(calls.scope).toBe(0);
  });
  for (const kind of ['student', 'staff'] as const) it('permits explicit ' + kind + ' scoped link, not role alone', async () => {
    const m = member({ kind, role: kind === 'student' ? 'student' : 'teacher' });
    m.studentLinks = [{ ...m.studentLinks[0], kind: kind === 'student' ? 'self' : 'staff_assignment' }];
    expect((await setup({ loadMembership: async () => m }).authorize(request(), 'student.records.read', '1')).studentId).toBe('1');
  });
  it('does not read membership without a token', async () => {
    const { authorize, calls } = setup();
    await denied(authorize(request(''), 'portal.session.read'), 401); expect(calls.membership).toBe(0);
  });
  it('does not use an arbitrary parent session token', async () => {
    await denied(setup().authorize(request('Bearer ' + crypto.randomUUID()), 'portal.session.read'), 401);
  });
  it('does not allow omitted Origin to bypass authentication', async () => {
    await denied(setup().authorize(request('', null), 'portal.session.read'), 401);
  });
  it('does allow server-to-server calls without Origin when authenticated and entitled', async () => {
    expect((await setup().authorize(request(undefined, null), 'portal.session.read')).subjectId).toBe(subjectId);
  });
  for (const origin of ['https://school.example.evil', 'https://other.example', 'null']) it('rejects foreign or opaque origin ' + origin, async () => {
    const { authorize, calls } = setup(); await denied(authorize(request(undefined, origin), 'portal.session.read'), 403);
    expect(calls.verify).toBe(0);
  });
  it('rejects unsupported writes', async () => {
    await denied(setup().authorize(request(), 'student.records.write' as any, '1'), 403);
  });
  it('preserves failure of real token verification', async () => {
    const { authorize, calls } = setup({ verifyToken: async () => { throw new IdentityError(401, 'invalid_authentication'); } });
    await denied(authorize(request(), 'portal.session.read'), 401); expect(calls.membership).toBe(0);
  });
  it('sanitizes unexpected verifier failure', async () => {
    await denied(setup({ verifyToken: async () => { throw new Error('private'); } }).authorize(request(), 'portal.session.read'), 503, 'identity_service_unavailable');
  });
  it('rejects a non-UUID verifier result', async () => {
    await denied(setup({ verifyToken: async () => ({ subjectId: 'admin', expiresAt: time + 100000 }) }).authorize(request(), 'portal.session.read'), 401);
  });
  it('rejects missing expiry from verifier contract', async () => {
    await denied(setup({ verifyToken: async () => ({ subjectId } as any) }).authorize(request(), 'portal.session.read'), 401);
  });
  it('rejects token expiry during resource lookup', async () => {
    let current = time;
    const { authorize } = setup({ now: () => current, loadStudentScope: async () => { current += 100000; return scope(); } });
    await denied(authorize(request(), 'student.records.read', '1'), 401);
  });
  it('rejects membership expiry during resource lookup', async () => {
    let current = time;
    const { authorize } = setup({ now: () => current, loadMembership: async () => member({ validUntil: time + 500 }), loadStudentScope: async () => { current += 500; return scope(); } });
    await denied(authorize(request(), 'student.records.read', '1'), 403);
  });
  it('rejects link expiry during resource lookup', async () => {
    let current = time;
    const m = member(); m.studentLinks = [{ ...m.studentLinks[0], validUntil: time + 500 }];
    const { authorize } = setup({ now: () => current, loadMembership: async () => m, loadStudentScope: async () => { current += 500; return scope(); } });
    await denied(authorize(request(), 'student.records.read', '1'), 403);
  });
  const memberCases: [string, Partial<Membership> | null][] = [
    ['no registry record', null], ['wrong subject', { subjectId: otherSubject }], ['other school', { tenantId: otherTenant }],
    ['other Auth project', { authBaseUrl: 'https://foreign.supabase.co' }],
    ['real data in test deployment', { dataEnvironment: 'real' }], ['demo data in test deployment', { dataEnvironment: 'demo' }],
    ['inactive', { active: false }], ['not yet effective', { validFrom: time + 1 }],
    ['expired', { validUntil: time }], ['unbounded expiry', { validUntil: Infinity }],
    ['invalid version', { version: 0 }], ['missing action', { actions: [] }],
    ['unknown kind', { kind: 'admin' as any }], ['parent promoted role', { role: 'admin' }],
    ['staff posing as student', { kind: 'staff', role: 'student' }], ['empty role', { role: '' }],
  ];
  for (const [name, changes] of memberCases) it('rejects membership: ' + name, async () => {
    const { authorize, calls } = setup({ loadMembership: async () => changes === null ? null : member(changes) });
    await denied(authorize(request(), 'student.records.read', '1'), 403); expect(calls.scope).toBe(0);
  });
  it('rejects membership service outage without legacy fallback', async () => {
    await denied(setup({ loadMembership: async () => { throw new Error('database private details'); } }).authorize(request(), 'portal.session.read'), 503, 'identity_registry_unavailable');
  });
  it('reflects revocation on next request; no membership cache', async () => {
    let active = true;
    const { authorize } = setup({ loadMembership: async () => member({ active }) });
    await authorize(request(), 'portal.session.read'); active = false;
    await denied(authorize(request(), 'portal.session.read'), 403);
  });
  it('ignores forged browser role, school and child headers', async () => {
    const req = request(); req.headers.set('x-role', 'admin'); req.headers.set('x-school-id', otherTenant); req.headers.set('x-child-id', '2');
    await denied(setup().authorize(req, 'student.records.read', '2'), 403);
  });
  it('an admin role alone grants no cross-student access', async () => {
    await denied(setup({ loadMembership: async () => member({ kind: 'staff', role: 'admin', studentLinks: [] }) }).authorize(request(), 'student.records.read', '1'), 403);
  });
  for (const linkChange of [{ active: false }, { kind: 'self' }, { studentId: '2' }, { validUntil: time }, { validFrom: time + 1 }]) {
    it('rejects an invalid guardian link ' + JSON.stringify(linkChange), async () => {
      const m = member(); m.studentLinks = [{ ...m.studentLinks[0], ...linkChange } as any];
      const { authorize, calls } = setup({ loadMembership: async () => m });
      await denied(authorize(request(), 'student.records.read', '1'), 403); expect(calls.scope).toBe(0);
    });
  }
  const scopes: [string, Partial<StudentScope> | null][] = [
    ['missing record', null], ['wrong record', { studentId: '2' }], ['other school', { tenantId: otherTenant }],
    ['other project', { authBaseUrl: 'https://foreign.supabase.co' }],
    ['real record', { dataEnvironment: 'real' }], ['demo record', { dataEnvironment: 'demo' }],
  ];
  for (const [name, changes] of scopes) it('rejects actual resource scope: ' + name, async () => {
    await denied(setup({ loadStudentScope: async () => changes === null ? null : scope(changes) }).authorize(request(), 'student.records.read', '1'), 403);
  });
  it('fails closed when resource lookup is unavailable', async () => {
    await denied(setup({ loadStudentScope: async () => { throw new Error('private'); } }).authorize(request(), 'student.records.read', '1'), 503);
  });
  for (const id of [undefined, null, 0, -1, 1.5, '01', '1 OR true', '', {}, Number.MAX_SAFE_INTEGER + 1]) {
    it('rejects noncanonical student id ' + String(id), async () => {
      await denied(setup().authorize(request(), 'student.records.read', id), 400);
    });
  }
  it('rejects unexpected student target on session action', async () => {
    await denied(setup().authorize(request(), 'portal.session.read', '1'), 400);
  });
  it('freezes a defensive copy of deployment settings', async () => {
    const mutable = { ...deployment, allowedOrigins: [...deployment.allowedOrigins] };
    const { authorize } = setup({}, mutable);
    mutable.tenantId = otherTenant; mutable.allowedOrigins.push('https://evil.example');
    await denied(authorize(request(undefined, 'https://evil.example'), 'portal.session.read'), 403);
  });
  for (const changes of [
    { authBaseUrl: '' }, { authBaseUrl: 'https://identitytest.supabase.co/evil' },
    { authBaseUrl: 'https://identitytest.supabase.co@evil.example' }, { tenantId: '' },
    { dataEnvironment: 'unknown' }, { allowedOrigins: [] }, { allowedOrigins: ['http://school.example'] },
    { allowedOrigins: ['https://school.example/path'] },
  ]) it('refuses incomplete or ambiguous deployment ' + JSON.stringify(changes), () => {
    expect(() => setup({}, { ...deployment, ...changes } as any)).toThrow(IdentityError);
  });
});
