/** EduOS · NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712 · © 2026.
 * Inactive server adapter. Never import in browser bundles or public API proxies.
 */
import type { DeploymentBinding, Membership, StudentScope } from './identity';

export interface RegistryDatabase {
  query<T = Record<string, unknown>>(text: string, values: readonly unknown[]): Promise<{ rows: T[] }>;
}

// Scope always comes from frozen SERVER deployment configuration, not a request.
export function createRegistryResolvers(input: DeploymentBinding, db: RegistryDatabase) {
  if (!input || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(input.tenantId) ||
      !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(input.authBaseUrl) ||
      !['real','demo','test'].includes(input.dataEnvironment) || typeof db?.query !== 'function') {
    throw new Error('registry_configuration_unavailable');
  }
  const d = Object.freeze({ tenantId: input.tenantId, authBaseUrl: input.authBaseUrl, dataEnvironment: input.dataEnvironment });
  const scopeValues = [d.tenantId,d.authBaseUrl,d.dataEnvironment] as const;
  function same(other: Readonly<DeploymentBinding>) {
    if (other.tenantId !== d.tenantId || other.authBaseUrl !== d.authBaseUrl || other.dataEnvironment !== d.dataEnvironment) {
      throw new Error('registry_scope_mismatch');
    }
  }
  return {
    async loadMembership(subjectId: string, requested: Readonly<DeploymentBinding>): Promise<Membership | null> {
      same(requested);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(subjectId)) return null;
      // One statement provides a consistent registry snapshot. Expiry is checked
      // again by the authorizer after awaited work. No email/name/metadata joins.
      const result = await db.query<any>(`
        SELECT m.auth_user_id AS "subjectId", b.tenant_id AS "tenantId",
          b.auth_base_url AS "authBaseUrl", b.data_environment AS "dataEnvironment",
          m.kind, m.role, m.active, m.version::float8 AS version,
          extract(epoch FROM greatest(m.valid_from,a.approved_at))*1000 AS "validFrom",
          extract(epoch FROM least(m.valid_until,a.valid_until))*1000 AS "validUntil",
          COALESCE((SELECT jsonb_agg(p.action ORDER BY p.action) FROM eduos_identity.permissions p
                    WHERE p.membership_id=m.id),'[]'::jsonb) AS actions,
          COALESCE((SELECT jsonb_agg(jsonb_build_object('studentId',l.student_id,'kind',l.link_kind,
                      'active',l.active,
                      'validFrom',extract(epoch FROM greatest(l.valid_from,la.approved_at))*1000,
                      'validUntil',extract(epoch FROM least(l.valid_until,la.valid_until))*1000))
                    FROM eduos_identity.student_links l
                    JOIN eduos_identity.approvals la ON la.id=l.approval_id AND la.binding_id=l.binding_id AND la.active
                    JOIN eduos_identity.entities se ON se.binding_id=l.binding_id AND se.kind='student'
                      AND se.entity_id=l.student_id AND se.active
                    WHERE l.membership_id=m.id AND l.binding_id=b.id AND l.active),'[]'::jsonb) AS "studentLinks"
        FROM eduos_identity.bindings b
        JOIN eduos_identity.memberships m ON m.binding_id=b.id
        JOIN eduos_identity.entities e ON e.binding_id=b.id AND e.kind=m.kind AND e.entity_id=m.entity_id AND e.active
        JOIN eduos_identity.approvals a ON a.id=m.approval_id AND a.binding_id=b.id AND a.active
        WHERE b.tenant_id=$1 AND b.auth_base_url=$2 AND b.data_environment=$3
          AND b.active AND m.auth_user_id=$4 AND m.active`, [...scopeValues,subjectId]);
      if (result.rows.length !== 1) return null;
      const row = result.rows[0];
      return { ...row, validFrom: Number(row.validFrom), validUntil: Number(row.validUntil),
        studentLinks: row.studentLinks.map((l: any) => ({...l,validFrom:Number(l.validFrom),validUntil:Number(l.validUntil)})) };
    },
    async loadStudentScope(studentId: string, requested: Readonly<DeploymentBinding>): Promise<StudentScope | null> {
      same(requested);
      if (!/^[1-9][0-9]*$/.test(studentId) || !Number.isSafeInteger(Number(studentId))) return null;
      const result = await db.query<StudentScope>(`
        SELECT e.entity_id AS "studentId", b.tenant_id AS "tenantId", b.auth_base_url AS "authBaseUrl",
          b.data_environment AS "dataEnvironment"
        FROM eduos_identity.bindings b JOIN eduos_identity.entities e ON e.binding_id=b.id
        WHERE b.tenant_id=$1 AND b.auth_base_url=$2 AND b.data_environment=$3
          AND b.active AND e.kind='student' AND e.active AND e.entity_id=$4`, [...scopeValues,studentId]);
      return result.rows.length === 1 ? result.rows[0] : null;
    },
  };
}
