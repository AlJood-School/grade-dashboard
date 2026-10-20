-- EduOS linked-account recovery. Template parameter: __PROJECT_REF__.
-- No personal data. Official Auth remains the only password writer.
-- © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712.
CREATE OR REPLACE FUNCTION public.eduos_linked_recovery_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog AS $$
DECLARE u auth.users%ROWTYPE; p record; link jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'recovery_not_authorized'; END IF;
  IF to_regclass('public.staff_profiles') IS NULL THEN RAISE EXCEPTION 'recovery_link_not_verified'; END IF;
  SELECT * INTO STRICT u FROM auth.users WHERE id=auth.uid();
  link := u.raw_app_meta_data->'eduos_staff_link';
  IF link IS NULL OR link->>'version' IS DISTINCT FROM '1' OR link->>'approval_source' IS DISTINCT FROM 'member_confirmed'
     OR link->>'project_ref' IS DISTINCT FROM '__PROJECT_REF__' OR COALESCE(link->>'school_id','')=''
     OR COALESCE(link->>'profile_id','')='' OR COALESCE(link->>'role_key','')='' THEN
    RAISE EXCEPTION 'recovery_link_not_verified';
  END IF;
  SELECT id,is_active,school_id,role_key,must_change_password,force_password_change,password_changed_at
    INTO STRICT p FROM public.staff_profiles WHERE id=(link->>'profile_id')::uuid;
  IF p.is_active IS NOT TRUE OR p.school_id IS DISTINCT FROM link->>'school_id'
     OR p.role_key IS DISTINCT FROM link->>'role_key' THEN RAISE EXCEPTION 'recovery_link_not_verified'; END IF;
  RETURN jsonb_build_object('verified',true,'password_changed_at',p.password_changed_at,'completed_operation',u.raw_app_meta_data->>'eduos_password_completed_operation',
    'change_required',p.must_change_password IS DISTINCT FROM false OR p.force_password_change IS DISTINCT FROM false);
END; $$;
REVOKE ALL ON FUNCTION public.eduos_linked_recovery_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.eduos_linked_recovery_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.eduos_arm_linked_password_update()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE operation uuid;
BEGIN
  PERFORM public.eduos_linked_recovery_status();
  operation:=gen_random_uuid();
  UPDATE auth.users SET raw_app_meta_data=raw_app_meta_data||jsonb_build_object('eduos_password_update_operation',operation,'eduos_password_update_armed_at',clock_timestamp()) WHERE id=auth.uid();
  RETURN operation;
END; $$;
REVOKE ALL ON FUNCTION public.eduos_arm_linked_password_update() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.eduos_arm_linked_password_update() TO authenticated;

CREATE OR REPLACE FUNCTION public.eduos_sync_linked_password_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog AS $$
DECLARE link jsonb; changed integer; armed timestamptz; operation uuid; u auth.users%ROWTYPE;
BEGIN
  IF NEW.payload->>'action' IS DISTINCT FROM 'user_updated_password' THEN RETURN NEW; END IF;
  SELECT * INTO u FROM auth.users WHERE id=(NEW.payload->>'actor_id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;
  link := u.raw_app_meta_data->'eduos_staff_link';
  IF link IS NULL THEN RETURN NEW; END IF;
  IF link->>'version' IS DISTINCT FROM '1' OR link->>'approval_source' IS DISTINCT FROM 'member_confirmed'
     OR link->>'project_ref' IS DISTINCT FROM '__PROJECT_REF__' OR COALESCE(link->>'school_id','')=''
     OR COALESCE(link->>'profile_id','')='' OR COALESCE(link->>'role_key','')=''
     OR COALESCE(u.encrypted_password,'')='' THEN RAISE EXCEPTION 'recovery_link_not_verified'; END IF;
  -- Only the official explicit password-update audit event may consume an armed operation.
  armed:=(u.raw_app_meta_data->>'eduos_password_update_armed_at')::timestamptz;
  operation:=(u.raw_app_meta_data->>'eduos_password_update_operation')::uuid;
  IF armed IS NULL OR operation IS NULL OR armed<clock_timestamp()-interval '2 minutes' OR armed>clock_timestamp() THEN RETURN NEW; END IF;
  UPDATE public.staff_profiles SET must_change_password=false,force_password_change=false,
    password_changed_at=clock_timestamp(),updated_at=clock_timestamp()
  WHERE id=(link->>'profile_id')::uuid AND is_active IS TRUE
    AND school_id=link->>'school_id' AND role_key=link->>'role_key';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION 'recovery_profile_not_updated'; END IF;
  UPDATE auth.users SET raw_app_meta_data=(raw_app_meta_data-'eduos_password_update_operation'-'eduos_password_update_armed_at')||jsonb_build_object('eduos_password_completed_operation',operation) WHERE id=u.id;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.eduos_sync_linked_password_change() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS eduos_linked_password_audit ON auth.audit_log_entries;
CREATE TRIGGER eduos_linked_password_audit AFTER INSERT ON auth.audit_log_entries
  FOR EACH ROW EXECUTE FUNCTION public.eduos_sync_linked_password_change();

CREATE OR REPLACE FUNCTION public.eduos_require_linked_password_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE link jsonb;armed timestamptz;operation text;completed text;
BEGIN
  link:=OLD.raw_app_meta_data->'eduos_staff_link';
  IF link IS NULL THEN RETURN NEW;END IF;
  IF NEW.raw_app_meta_data->'eduos_staff_link' IS DISTINCT FROM link
    OR link->>'version' IS DISTINCT FROM '1' OR link->>'approval_source' IS DISTINCT FROM 'member_confirmed'
    OR link->>'project_ref' IS DISTINCT FROM '__PROJECT_REF__' THEN RAISE EXCEPTION 'recovery_link_not_verified';END IF;
  armed:=(OLD.raw_app_meta_data->>'eduos_password_update_armed_at')::timestamptz;
  operation:=OLD.raw_app_meta_data->>'eduos_password_update_operation';
  IF armed IS NULL AND operation IS NULL THEN RETURN NEW;END IF;
  IF armed IS NULL OR operation IS NULL OR armed<clock_timestamp()-interval '2 minutes' OR armed>clock_timestamp() THEN RAISE EXCEPTION 'recovery_password_operation_expired';END IF;
  SELECT raw_app_meta_data->>'eduos_password_completed_operation' INTO completed FROM auth.users WHERE id=NEW.id;
  IF completed IS DISTINCT FROM operation THEN RAISE EXCEPTION 'recovery_password_event_missing';END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.eduos_require_linked_password_audit() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS eduos_linked_password_change ON auth.users;
CREATE CONSTRAINT TRIGGER eduos_linked_password_change AFTER UPDATE ON auth.users
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
  EXECUTE FUNCTION public.eduos_require_linked_password_audit();

CREATE OR REPLACE FUNCTION public.eduos_reserve_linked_recovery(p_username text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog AS $$
DECLARE u auth.users%ROWTYPE; p record; link jsonb; request_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'recovery_not_authorized'; END IF;
  IF to_regclass('public.staff_profiles') IS NULL THEN RETURN NULL; END IF;
  IF length(p_username)>120 OR COALESCE(btrim(p_username),'')='' THEN RETURN NULL; END IF;
  SELECT a.* INTO STRICT u FROM auth.users a JOIN public.staff_profiles s
    ON s.id::text=a.raw_app_meta_data->'eduos_staff_link'->>'profile_id'
    WHERE s.username=btrim(p_username) FOR UPDATE OF a;
  link := u.raw_app_meta_data->'eduos_staff_link';
  IF link->>'version' IS DISTINCT FROM '1' OR link->>'approval_source' IS DISTINCT FROM 'member_confirmed'
     OR link->>'project_ref' IS DISTINCT FROM '__PROJECT_REF__' OR COALESCE(link->>'school_id','')=''
     OR COALESCE(link->>'role_key','')='' OR link->>'recovery_destination_source' IS DISTINCT FROM 'verified_agent_member'
     OR COALESCE(link->>'approval_reference','')='' THEN RETURN NULL; END IF;
  SELECT username,is_active,school_id,role_key INTO STRICT p FROM public.staff_profiles
    WHERE id=(link->>'profile_id')::uuid;
  IF p.is_active IS NOT TRUE OR p.school_id IS DISTINCT FROM link->>'school_id'
     OR p.role_key IS DISTINCT FROM link->>'role_key'
     OR COALESCE(link->>'recovery_email','')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR COALESCE(u.email,'')='' THEN RETURN NULL; END IF;
  -- A member-approved exception permits one delivery reservation only, including failed sends.
  IF u.raw_app_meta_data ? 'eduos_recovery_request_id' THEN RETURN NULL; END IF;
  request_id := gen_random_uuid();
  UPDATE auth.users SET raw_app_meta_data=raw_app_meta_data||jsonb_build_object('eduos_recovery_requested_at',clock_timestamp(),'eduos_recovery_request_id',request_id,'eduos_recovery_delivery','reserved') WHERE id=u.id;
  RETURN jsonb_build_object('auth_user_id',u.id,'auth_email',u.email,'destination',link->>'recovery_email','request_id',request_id);
EXCEPTION WHEN no_data_found OR too_many_rows OR invalid_text_representation THEN RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.eduos_reserve_linked_recovery(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eduos_reserve_linked_recovery(text) TO service_role;

CREATE OR REPLACE FUNCTION public.eduos_finish_linked_recovery(p_auth_id uuid,p_request_id uuid,p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE changed integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR p_status NOT IN('sent','failed') OR p_status IS NULL THEN RAISE EXCEPTION 'recovery_not_authorized'; END IF;
  UPDATE auth.users SET raw_app_meta_data=raw_app_meta_data||jsonb_build_object('eduos_recovery_delivery',p_status)
  WHERE id=p_auth_id AND raw_app_meta_data->>'eduos_recovery_request_id'=p_request_id::text
    AND raw_app_meta_data->>'eduos_recovery_delivery'='reserved';
  GET DIAGNOSTICS changed=ROW_COUNT; RETURN changed=1;
END; $$;
REVOKE ALL ON FUNCTION public.eduos_finish_linked_recovery(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eduos_finish_linked_recovery(uuid,uuid,text) TO service_role;
