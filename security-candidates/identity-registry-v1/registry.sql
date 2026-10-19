-- EduOS: inactive server-only registry candidate; NOT a production migration.
-- NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712 · © 2026.
-- Requires auth.users and a dedicated NOLOGIN/NOBYPASSRLS eduos_identity_reader.
-- Application routes and existing school tables are intentionally unchanged.
BEGIN;
CREATE SCHEMA eduos_identity;
REVOKE ALL ON SCHEMA eduos_identity FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA eduos_identity TO eduos_identity_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA eduos_identity REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

CREATE TABLE eduos_identity.bindings (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  auth_base_url text NOT NULL CHECK (auth_base_url ~ '^https://[a-z0-9]+[.]supabase[.]co$'),
  data_environment text NOT NULL CHECK (data_environment IN ('real','demo','test')),
  active boolean NOT NULL DEFAULT false,
  UNIQUE (tenant_id, auth_base_url, data_environment)
);
-- Only references: no names, emails, phone numbers, passwords or browser claims.
-- entity_id must come from an approved source adapter; this table does NOT prove
-- that the referenced live person exists. Production adapters remain a rollout gate.
CREATE TABLE eduos_identity.entities (
  binding_id uuid NOT NULL REFERENCES eduos_identity.bindings(id),
  kind text NOT NULL CHECK (kind IN ('staff','student','parent')),
  entity_id text NOT NULL CHECK (length(entity_id) BETWEEN 1 AND 128 AND entity_id = btrim(entity_id)),
  active boolean NOT NULL DEFAULT false,
  PRIMARY KEY (binding_id, kind, entity_id),
  CHECK (kind <> 'student' OR (entity_id ~ '^[1-9][0-9]{0,15}$' AND entity_id::numeric <= 9007199254740991))
);
CREATE TABLE eduos_identity.approvals (
  id uuid PRIMARY KEY,
  binding_id uuid NOT NULL REFERENCES eduos_identity.bindings(id),
  reference text NOT NULL CHECK (length(reference) BETWEEN 1 AND 256),
  approved_by uuid NOT NULL,
  approved_at timestamptz NOT NULL,
  valid_until timestamptz NOT NULL CHECK (valid_until > approved_at),
  active boolean NOT NULL DEFAULT false,
  UNIQUE (id, binding_id)
);
CREATE TABLE eduos_identity.memberships (
  id uuid PRIMARY KEY,
  binding_id uuid NOT NULL REFERENCES eduos_identity.bindings(id),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id),
  kind text NOT NULL CHECK (kind IN ('staff','student','parent')),
  entity_id text NOT NULL,
  role text NOT NULL CHECK (role ~ '^[a-z][a-z0-9_]{0,63}$'),
  approval_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT false,
  version bigint NOT NULL DEFAULT 1 CHECK (version BETWEEN 1 AND 9007199254740991),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL CHECK (valid_until > valid_from),
  FOREIGN KEY (binding_id,kind,entity_id) REFERENCES eduos_identity.entities(binding_id,kind,entity_id),
  FOREIGN KEY (approval_id,binding_id) REFERENCES eduos_identity.approvals(id,binding_id),
  UNIQUE (binding_id, auth_user_id),
  UNIQUE (binding_id, kind, entity_id),
  UNIQUE (id,binding_id,kind,entity_id),
  CHECK ((kind='student' AND role='student') OR (kind='parent' AND role='parent') OR
         (kind='staff' AND role NOT IN ('student','parent')))
);
CREATE TABLE eduos_identity.permissions (
  membership_id uuid NOT NULL REFERENCES eduos_identity.memberships(id),
  action text NOT NULL CHECK (action IN ('portal.session.read','student.records.read')),
  PRIMARY KEY (membership_id,action)
);
CREATE TABLE eduos_identity.student_links (
  membership_id uuid NOT NULL,
  binding_id uuid NOT NULL,
  member_kind text NOT NULL,
  member_entity_id text NOT NULL,
  student_kind text NOT NULL DEFAULT 'student' CHECK (student_kind='student'),
  student_id text NOT NULL,
  link_kind text NOT NULL CHECK (link_kind IN ('self','guardian','staff_assignment')),
  approval_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT false,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL CHECK (valid_until > valid_from),
  PRIMARY KEY (membership_id,student_id),
  FOREIGN KEY (membership_id,binding_id,member_kind,member_entity_id)
    REFERENCES eduos_identity.memberships(id,binding_id,kind,entity_id),
  FOREIGN KEY (binding_id,student_kind,student_id)
    REFERENCES eduos_identity.entities(binding_id,kind,entity_id),
  FOREIGN KEY (approval_id,binding_id) REFERENCES eduos_identity.approvals(id,binding_id),
  CHECK ((member_kind='student' AND link_kind='self' AND member_entity_id=student_id) OR
         (member_kind='parent' AND link_kind='guardian') OR
         (member_kind='staff' AND link_kind='staff_assignment'))
);

-- Default-deny for browser roles, and no browser path for approving or linking.
DO $security$
DECLARE tab text;
BEGIN
  FOREACH tab IN ARRAY ARRAY['bindings','entities','approvals','memberships','permissions','student_links'] LOOP
    EXECUTE format('ALTER TABLE eduos_identity.%I ENABLE ROW LEVEL SECURITY',tab);
    EXECUTE format('ALTER TABLE eduos_identity.%I FORCE ROW LEVEL SECURITY',tab);
    EXECUTE format('REVOKE ALL ON eduos_identity.%I FROM PUBLIC, anon, authenticated, eduos_identity_reader',tab);
    EXECUTE format('GRANT SELECT ON eduos_identity.%I TO eduos_identity_reader',tab);
    EXECUTE format('CREATE POLICY backend_read ON eduos_identity.%I FOR SELECT TO eduos_identity_reader USING (true)',tab);
  END LOOP;
END $security$;
COMMIT;
