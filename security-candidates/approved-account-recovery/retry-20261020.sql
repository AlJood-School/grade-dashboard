-- 🎓 EduOS — no person data. © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712.
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
  -- A second attempt requires a short, server-issued authorization for this failed reservation.
  -- The immutable previous-attempt record prevents a third attempt even if another ticket is added.
  IF u.raw_app_meta_data ? 'eduos_recovery_request_id' THEN
    IF u.raw_app_meta_data ? 'eduos_recovery_previous_attempt'
       OR u.raw_app_meta_data ? 'eduos_password_completed_operation'
       OR u.raw_app_meta_data->>'eduos_recovery_delivery' IS DISTINCT FROM 'failed'
       OR u.raw_app_meta_data->'eduos_recovery_retry_authorization'->>'prior_request_id' IS DISTINCT FROM u.raw_app_meta_data->>'eduos_recovery_request_id'
       OR u.raw_app_meta_data->'eduos_recovery_retry_authorization'->>'approval_reference' IS DISTINCT FROM 'member_continue_20261020_1219'
       OR COALESCE(u.raw_app_meta_data->'eduos_recovery_retry_authorization'->>'expires_at','')=''
       OR (u.raw_app_meta_data->'eduos_recovery_retry_authorization'->>'expires_at')::timestamptz <= clock_timestamp()
       OR (u.raw_app_meta_data->'eduos_recovery_retry_authorization'->>'expires_at')::timestamptz > clock_timestamp()+interval '30 minutes'
    THEN RETURN NULL; END IF;
    UPDATE auth.users SET raw_app_meta_data=raw_app_meta_data||jsonb_build_object('eduos_recovery_previous_attempt',
      jsonb_build_object('request_id',u.raw_app_meta_data->>'eduos_recovery_request_id',
        'requested_at',u.raw_app_meta_data->'eduos_recovery_requested_at',
        'delivery',u.raw_app_meta_data->>'eduos_recovery_delivery',
        'failure_stage',u.raw_app_meta_data->>'eduos_recovery_failure_stage',
        'retry_approval_reference','member_continue_20261020_1219')) WHERE id=u.id;
  END IF;
  request_id := gen_random_uuid();
  UPDATE auth.users SET raw_app_meta_data=raw_app_meta_data||jsonb_build_object('eduos_recovery_requested_at',clock_timestamp(),'eduos_recovery_request_id',request_id,'eduos_recovery_delivery','reserved') WHERE id=u.id;
  RETURN jsonb_build_object('auth_user_id',u.id,'auth_email',u.email,'destination',link->>'recovery_email','request_id',request_id);
EXCEPTION WHEN no_data_found OR too_many_rows OR invalid_text_representation OR invalid_datetime_format OR datetime_field_overflow THEN RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.eduos_reserve_linked_recovery(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eduos_reserve_linked_recovery(text) TO service_role;

CREATE OR REPLACE FUNCTION public.eduos_finish_linked_recovery(p_auth_id uuid,p_request_id uuid,p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE changed integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR p_status NOT IN('sent','failed','link_generation_failed','link_validation_failed','provider_rejected','provider_unknown') OR p_status IS NULL THEN RAISE EXCEPTION 'recovery_not_authorized'; END IF;
  UPDATE auth.users SET raw_app_meta_data=(raw_app_meta_data-'eduos_recovery_failure_stage')||jsonb_build_object('eduos_recovery_delivery',CASE WHEN p_status='sent' THEN 'sent' ELSE 'failed' END,'eduos_recovery_failure_stage',CASE WHEN p_status IN('sent','failed') THEN NULL ELSE p_status END)
  WHERE id=p_auth_id AND raw_app_meta_data->>'eduos_recovery_request_id'=p_request_id::text
    AND raw_app_meta_data->>'eduos_recovery_delivery'='reserved';
  GET DIAGNOSTICS changed=ROW_COUNT; RETURN changed=1;
END; $$;
REVOKE ALL ON FUNCTION public.eduos_finish_linked_recovery(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eduos_finish_linked_recovery(uuid,uuid,text) TO service_role;
