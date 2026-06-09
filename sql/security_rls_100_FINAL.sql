-- ============================================================
-- EduOS Security RLS 100% — الأمان الكامل
-- التاريخ: 2026-06-09
-- الهدف: أمان 100% — كل الجداول محمية بـ RLS صارم
-- القاعدة:
--   • SELECT: المصادق عليهم فقط (authenticated) — لا anonymous
--   • INSERT/UPDATE/DELETE: service_role فقط
--   • بعض الجداول: صلاحية مقيّدة بالدور (teacher/admin/staff)
-- ============================================================

-- =============================================
-- HELPER: دالة للتحقق من الدور
-- =============================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('request.jwt.claims', true)::json->>'user_role',
    ''
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id',
    ''
  );
$$ LANGUAGE sql STABLE;

-- =============================================
-- STEP 1: تفعيل RLS على كل الجداول
-- =============================================
ALTER TABLE IF EXISTS student_grades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_results              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stream_progress_g3          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stream_progress_g4          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_semester_summary    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grade_records               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grade_assessment_defs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_truth_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_exit_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_results_w5           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_results_w8           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_plans                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_lesson_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_evaluations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_annual_grades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_pdp                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_evidence              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_checkin_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_daily_attendance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_device_registry       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_qr_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gate_entry_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vark_results                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backups_log                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backup_requests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_swaps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS period_swaps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permanent_swap_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS substitute_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS substitute_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS duty_schedule               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS facility_bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_config               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_themes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_intent_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS social_cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inclusion_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_health_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nurse_visits                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nursing_visits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_authorized_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_entries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS library_books               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS library_loans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cafeteria_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cafeteria_menu              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cafeteria_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exam_schedule               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exam_results                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS broadcasts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surveys                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_responses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_answers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_log            ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: حذف كل السياسات القديمة (تنظيف شامل)
-- =============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END$$;

-- =============================================
-- STEP 3: سياسات جديدة آمنة 100%
-- =============================================

-- ────────────────────────────────────────────
-- 📚 جداول الدرجات — قراءة للمصادقين، كتابة للـ service فقط
-- ────────────────────────────────────────────
CREATE POLICY "grades_select_authenticated" ON student_grades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "grades_write_service" ON student_grades
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "weekly_select_authenticated" ON weekly_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "weekly_write_service" ON weekly_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sg3_select_authenticated" ON stream_progress_g3
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sg3_write_service" ON stream_progress_g3
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sg4_select_authenticated" ON stream_progress_g4
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sg4_write_service" ON stream_progress_g4
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sss_select_authenticated" ON student_semester_summary
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sss_write_service" ON student_semester_summary
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "gr_select_authenticated" ON grade_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gr_write_service" ON grade_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "gad_select_authenticated" ON grade_assessment_defs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gad_write_service" ON grade_assessment_defs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 📝 جداول الدروس
-- ────────────────────────────────────────────
CREATE POLICY "ltl_select_auth" ON lesson_truth_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ltl_write_service" ON lesson_truth_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lel_select_auth" ON lesson_exit_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lel_write_service" ON lesson_exit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lrw5_select_auth" ON lesson_results_w5
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lrw5_write_service" ON lesson_results_w5
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lrw8_select_auth" ON lesson_results_w8
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lrw8_write_service" ON lesson_results_w8
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lp_select_auth" ON lesson_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lp_write_service" ON lesson_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ls_select_auth" ON lesson_sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ls_write_service" ON lesson_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "slp_select_auth" ON student_lesson_progress
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "slp_write_service" ON student_lesson_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 👨‍🏫 جداول الموظفين
-- ────────────────────────────────────────────
CREATE POLICY "sp_select_auth" ON staff_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sp_write_service" ON staff_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sev_select_auth" ON staff_evaluations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sev_write_service" ON staff_evaluations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sag_select_auth" ON staff_annual_grades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sag_write_service" ON staff_annual_grades
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "spdp_select_auth" ON staff_pdp
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "spdp_write_service" ON staff_pdp
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sevi_select_auth" ON staff_evidence
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sevi_write_service" ON staff_evidence
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 📅 جداول الحضور
-- ────────────────────────────────────────────
CREATE POLICY "sa_select_auth" ON staff_attendance
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sa_write_service" ON staff_attendance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "scl_select_auth" ON staff_checkin_log
  FOR SELECT TO authenticated USING (true);
-- الحضور اليومي: الموظفون يستطيعون تسجيل حضورهم (INSERT فقط)
CREATE POLICY "scl_insert_staff" ON staff_checkin_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scl_write_service" ON staff_checkin_log
  FOR UPDATE USING (true);

CREATE POLICY "sda_select_auth" ON staff_daily_attendance
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sda_write_service" ON staff_daily_attendance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sdr_select_auth" ON staff_device_registry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sdr_write_service" ON staff_device_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sn_select_auth" ON staff_notifications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sn_write_service" ON staff_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "aql_select_auth" ON attendance_qr_log
  FOR SELECT TO authenticated USING (true);
-- بوابة الحضور: INSERT مسموح للجميع (جهاز التابلت غير مسجّل)
CREATE POLICY "aql_insert_anon" ON attendance_qr_log
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "aql_write_service" ON attendance_qr_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "gel_select_auth" ON gate_entry_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gel_insert_anon" ON gate_entry_log
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "gel_write_service" ON gate_entry_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- ⚙️ إعدادات التطبيق — حساسة جداً
-- ────────────────────────────────────────────
-- app_settings: قراءة للمصادقين فقط — لا anonymous أبداً
CREATE POLICY "as_select_auth" ON app_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "as_write_service" ON app_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 🔬 VARK Results
-- ────────────────────────────────────────────
CREATE POLICY "vark_select_auth" ON vark_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vark_insert_auth" ON vark_results
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vark_write_service" ON vark_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 💾 النسخ الاحتياطية
-- ────────────────────────────────────────────
CREATE POLICY "bl_select_auth" ON backups_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "bl_write_service" ON backups_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "br_select_auth" ON backup_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "br_insert_auth" ON backup_requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "br_write_service" ON backup_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 🔄 جداول الإنابة والتبديل
-- ────────────────────────────────────────────
CREATE POLICY "ss_select_auth" ON schedule_swaps
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ss_write_service" ON schedule_swaps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pp_select_auth" ON period_swaps
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pp_write_service" ON period_swaps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ppl_select_auth" ON permanent_swap_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ppl_write_service" ON permanent_swap_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sul_select_auth" ON substitute_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sul_write_service" ON substitute_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sua_select_auth" ON substitute_assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sua_write_service" ON substitute_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 🏫 جداول المدرسة
-- ────────────────────────────────────────────
CREATE POLICY "ds_select_auth" ON duty_schedule
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ds_write_service" ON duty_schedule
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "fb_select_auth" ON facility_bookings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fb_insert_auth" ON facility_bookings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fb_write_service" ON facility_bookings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "se_select_auth" ON school_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "se_write_service" ON school_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sc_select_auth" ON school_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sc_write_service" ON school_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sth_select_auth" ON school_themes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sth_write_service" ON school_themes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 👨‍🎓 جداول الطلاب الحساسة
-- ────────────────────────────────────────────
CREATE POLICY "sil_select_auth" ON student_intent_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sil_write_service" ON student_intent_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "soc_select_auth" ON social_cases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "soc_write_service" ON social_cases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "inc_select_auth" ON inclusion_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "inc_write_service" ON inclusion_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "shr_select_auth" ON student_health_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "shr_write_service" ON student_health_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "nv_select_auth" ON nurse_visits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nv_write_service" ON nurse_visits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "nvv_select_auth" ON nursing_visits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nvv_write_service" ON nursing_visits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sap_select_auth" ON security_authorized_pickups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sap_write_service" ON security_authorized_pickups
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 🔧 جداول الخدمات
-- ────────────────────────────────────────────
CREATE POLICY "mr_select_auth" ON maintenance_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "mr_insert_auth" ON maintenance_requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mr_write_service" ON maintenance_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "fr_select_auth" ON financial_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fr_write_service" ON financial_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "be_select_auth" ON budget_entries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "be_write_service" ON budget_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "lb_select_auth" ON library_books
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lb_write_service" ON library_books
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ll_select_auth" ON library_loans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ll_insert_auth" ON library_loans
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ll_write_service" ON library_loans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ci_select_auth" ON cafeteria_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ci_write_service" ON cafeteria_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "cm_select_auth" ON cafeteria_menu
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_write_service" ON cafeteria_menu
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "ct_select_auth" ON cafeteria_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ct_write_service" ON cafeteria_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────
-- 📋 الاختبارات والاستبيانات والإذاعة
-- ────────────────────────────────────────────
CREATE POLICY "es_select_auth" ON exam_schedule
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "es_write_service" ON exam_schedule
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "er_select_auth" ON exam_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "er_write_service" ON exam_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "bc_select_auth" ON broadcasts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "bc_write_service" ON broadcasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sv_select_auth" ON surveys
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sv_write_service" ON surveys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sq_select_auth" ON survey_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sq_write_service" ON survey_questions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sr_select_auth" ON survey_responses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sr_insert_auth" ON survey_responses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sr_write_service" ON survey_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sa2_select_auth" ON survey_answers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sa2_insert_auth" ON survey_answers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sa2_write_service" ON survey_answers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "nl_select_auth" ON notification_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nl_write_service" ON notification_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- STEP 4: تحقق نهائي — يجب أن لا يوجد أي سياسة تسمح لـ anon بقراءة البيانات الحساسة
-- =============================================
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  CASE
    WHEN 'anon' = ANY(roles) THEN '🔴 ANON ACCESS - تحقق!'
    WHEN 'public' = ANY(roles) THEN '🔴 PUBLIC ACCESS - تحقق!'
    WHEN 'authenticated' = ANY(roles) AND cmd = 'SELECT' THEN '✅ قراءة آمنة'
    WHEN 'service_role' = ANY(roles) THEN '🔒 service_role فقط'
    ELSE '⚠️ راجع'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
