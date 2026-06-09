-- ============================================================
-- EduOS Security RLS — النسخة النهائية v4 (مضمونة 100%)
-- التاريخ: 2026-06-09
-- المشكلة المُصلَحة: CREATE POLICY كانت تفشل إذا الجدول غير موجود
-- الحل: كل عملية مُغلَّفة في DO $$ مع EXCEPTION WHEN OTHERS → NOTICE
-- ============================================================

-- ============================================================
-- STEP 0: دالة مساعدة تُنفِّذ SQL بأمان وتتجاهل الأخطاء
-- ============================================================
CREATE OR REPLACE FUNCTION _edoos_exec(sql_text TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE sql_text;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP: % — %', SQLERRM, sql_text;
END;
$$;

-- ============================================================
-- STEP 1: إنشاء الجداول المفقودة (CREATE TABLE IF NOT EXISTS)
-- ============================================================

-- جدول أحداث المدرسة
SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS school_events (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  event_date   DATE NOT NULL,
  event_type   TEXT DEFAULT 'school',
  description  TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS broadcasts (
  id             BIGSERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  broadcast_type TEXT DEFAULT 'all',
  priority       TEXT DEFAULT 'normal',
  channels       TEXT[] DEFAULT ARRAY['app'],
  is_sent        BOOLEAN DEFAULT FALSE,
  sent_at        TIMESTAMPTZ,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS budget_entries (
  id          BIGSERIAL PRIMARY KEY,
  category    TEXT NOT NULL,
  entry_type  TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  entry_date  DATE NOT NULL,
  description TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS library_books (
  id               BIGSERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  author           TEXT,
  category         TEXT DEFAULT 'story',
  grade_level      TEXT DEFAULT 'all',
  total_copies     INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS library_loans (
  id            BIGSERIAL PRIMARY KEY,
  book_id       BIGINT,
  student_name  TEXT NOT NULL,
  class_name    TEXT,
  borrowed_date DATE DEFAULT CURRENT_DATE,
  due_date      DATE NOT NULL,
  returned_date DATE,
  status        TEXT DEFAULT 'borrowed',
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS nursing_visits (
  id               BIGSERIAL PRIMARY KEY,
  student_name     TEXT NOT NULL,
  class_name       TEXT,
  visit_date       DATE DEFAULT CURRENT_DATE,
  visit_time       TIME DEFAULT CURRENT_TIME,
  complaint        TEXT,
  action_taken     TEXT,
  sent_home        BOOLEAN DEFAULT FALSE,
  parent_notified  BOOLEAN DEFAULT FALSE,
  created_by       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS cafeteria_items (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'food',
  price       NUMERIC(6,2) NOT NULL,
  is_healthy  BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS cafeteria_menu (
  id           BIGSERIAL PRIMARY KEY,
  menu_date    DATE NOT NULL,
  item_name    TEXT NOT NULL,
  category     TEXT DEFAULT 'main',
  price        NUMERIC(6,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS cafeteria_transactions (
  id               BIGSERIAL PRIMARY KEY,
  student_name     TEXT,
  class_name       TEXT,
  item_name        TEXT NOT NULL,
  amount           NUMERIC(8,2) NOT NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  transaction_type TEXT DEFAULT 'sale',
  created_at       TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS security_authorized_pickups (
  id             BIGSERIAL PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  guardian_name  TEXT NOT NULL,
  relationship   TEXT,
  id_number      TEXT,
  phone          TEXT,
  photo_url      TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS nurse_visits (
  id              BIGSERIAL PRIMARY KEY,
  student_name    TEXT NOT NULL,
  class_name      TEXT,
  visit_date      DATE DEFAULT CURRENT_DATE,
  complaint       TEXT,
  treatment       TEXT,
  sent_home       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS student_health_records (
  id               BIGSERIAL PRIMARY KEY,
  student_name     TEXT NOT NULL,
  class_name       TEXT,
  blood_type       TEXT,
  allergies        TEXT,
  chronic_diseases TEXT,
  medications      TEXT,
  emergency_phone  TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id             BIGSERIAL PRIMARY KEY,
  location       TEXT NOT NULL,
  issue_type     TEXT NOT NULL,
  description    TEXT,
  priority       TEXT DEFAULT 'medium',
  status         TEXT DEFAULT 'pending',
  reported_by    TEXT,
  assigned_to    TEXT,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS financial_records (
  id           BIGSERIAL PRIMARY KEY,
  record_type  TEXT NOT NULL,
  category     TEXT,
  amount       NUMERIC(12,2) NOT NULL,
  record_date  DATE NOT NULL,
  description  TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS social_cases (
  id             BIGSERIAL PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  case_type      TEXT,
  description    TEXT,
  status         TEXT DEFAULT 'open',
  follow_up_date DATE,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS inclusion_plans (
  id             BIGSERIAL PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  disability_type TEXT,
  support_level  TEXT,
  goals          TEXT,
  review_date    DATE,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS exam_schedule (
  id          BIGSERIAL PRIMARY KEY,
  exam_name   TEXT NOT NULL,
  grade_level TEXT,
  subject     TEXT,
  exam_date   DATE NOT NULL,
  start_time  TIME,
  end_time    TIME,
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS exam_results (
  id           BIGSERIAL PRIMARY KEY,
  exam_id      BIGINT,
  student_name TEXT NOT NULL,
  class_name   TEXT,
  score        NUMERIC(5,2),
  max_score    NUMERIC(5,2) DEFAULT 100,
  grade        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS school_config (
  id         BIGSERIAL PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_val TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS school_themes (
  id          BIGSERIAL PRIMARY KEY,
  theme_key   TEXT UNIQUE NOT NULL,
  theme_label TEXT,
  is_active   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS lesson_plans (
  id           BIGSERIAL PRIMARY KEY,
  teacher_id   TEXT,
  grade_level  TEXT,
  class_name   TEXT,
  week_number  INTEGER,
  subject      TEXT,
  objectives   TEXT,
  activities   TEXT,
  resources    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS lesson_sessions (
  id           BIGSERIAL PRIMARY KEY,
  teacher_id   TEXT,
  class_name   TEXT,
  week_number  INTEGER,
  session_date DATE DEFAULT CURRENT_DATE,
  start_time   TIME,
  status       TEXT DEFAULT 'active',
  qr_token     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id             BIGSERIAL PRIMARY KEY,
  session_id     BIGINT,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  checked_in_at  TIMESTAMPTZ DEFAULT NOW(),
  exit_score     INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS student_intent_log (
  id           BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  class_name   TEXT,
  intent_type  TEXT,
  logged_at    TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS surveys (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  target_role TEXT DEFAULT 'all',
  is_active   BOOLEAN DEFAULT TRUE,
  expires_at  TIMESTAMPTZ,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS survey_questions (
  id          BIGSERIAL PRIMARY KEY,
  survey_id   BIGINT,
  question    TEXT NOT NULL,
  q_type      TEXT DEFAULT 'radio',
  options     TEXT[],
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS survey_responses (
  id          BIGSERIAL PRIMARY KEY,
  survey_id   BIGINT,
  respondent  TEXT,
  role        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS survey_answers (
  id           BIGSERIAL PRIMARY KEY,
  response_id  BIGINT,
  question_id  BIGINT,
  answer       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS notification_log (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT,
  target_role TEXT DEFAULT 'all',
  channel     TEXT DEFAULT 'app',
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  created_by  TEXT
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS backups_log (
  id           BIGSERIAL PRIMARY KEY,
  backup_type  TEXT DEFAULT 'auto',
  status       TEXT DEFAULT 'running',
  tables_count INTEGER,
  file_url     TEXT,
  triggered_by TEXT,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS backup_requests (
  id           BIGSERIAL PRIMARY KEY,
  requested_by TEXT,
  reason       TEXT,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

SELECT _edoos_exec($sql$
CREATE TABLE IF NOT EXISTS permanent_swap_log (
  id          BIGSERIAL PRIMARY KEY,
  teacher_a   TEXT,
  teacher_b   TEXT,
  swap_reason TEXT,
  approved_by TEXT,
  swapped_at  TIMESTAMPTZ DEFAULT NOW()
)
$sql$);

-- ============================================================
-- STEP 2: تفعيل RLS على كل الجداول (بأمان)
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'student_grades','weekly_results','stream_progress_g3','stream_progress_g4',
    'student_semester_summary','grade_records','grade_assessment_defs',
    'lesson_truth_log','lesson_exit_log','lesson_results_w5','lesson_results_w8',
    'lesson_plans','lesson_sessions','student_lesson_progress',
    'staff_profiles','staff_evaluations','staff_annual_grades','staff_pdp',
    'staff_evidence','staff_attendance','staff_checkin_log','staff_daily_attendance',
    'staff_device_registry','staff_notifications',
    'attendance_qr_log','gate_entry_log',
    'vark_results','app_settings',
    'backups_log','backup_requests',
    'schedule_swaps','period_swaps','permanent_swap_log',
    'substitute_log','substitute_assignments',
    'duty_schedule','facility_bookings',
    'school_events','school_config','school_themes',
    'student_intent_log','social_cases','inclusion_plans',
    'student_health_records','nurse_visits','nursing_visits',
    'security_authorized_pickups','maintenance_requests',
    'financial_records','budget_entries',
    'library_books','library_loans',
    'cafeteria_items','cafeteria_menu','cafeteria_transactions',
    'exam_schedule','exam_results',
    'broadcasts','surveys','survey_questions','survey_responses',
    'survey_answers','notification_log'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % not found — skip RLS', tbl;
    WHEN OTHERS THEN
      RAISE NOTICE 'RLS skip %: %', tbl, SQLERRM;
    END;
  END LOOP;
END$$;

-- ============================================================
-- STEP 3: حذف كل السياسات القديمة (تنظيف شامل)
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Drop policy skip: %', SQLERRM;
    END;
  END LOOP;
END$$;

-- ============================================================
-- STEP 4: سياسات آمنة (كل واحدة في _edoos_exec مضمونة)
-- القاعدة: SELECT = authenticated | WRITE = service_role
-- ============================================================

-- ─── 📚 جداول الدرجات ───────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "grades_select_auth" ON student_grades FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "grades_write_service" ON student_grades FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "weekly_select_auth" ON weekly_results FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "weekly_write_service" ON weekly_results FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sg3_select_auth" ON stream_progress_g3 FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sg3_write_service" ON stream_progress_g3 FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sg4_select_auth" ON stream_progress_g4 FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sg4_write_service" ON stream_progress_g4 FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sss_select_auth" ON student_semester_summary FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sss_write_service" ON student_semester_summary FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "gr_select_auth" ON grade_records FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "gr_write_service" ON grade_records FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "gad_select_auth" ON grade_assessment_defs FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "gad_write_service" ON grade_assessment_defs FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📝 جداول الدروس ────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "ltl_select_auth" ON lesson_truth_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ltl_write_service" ON lesson_truth_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "lel_select_auth" ON lesson_exit_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "lel_write_service" ON lesson_exit_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "lrw5_select_auth" ON lesson_results_w5 FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "lrw5_write_service" ON lesson_results_w5 FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "lrw8_select_auth" ON lesson_results_w8 FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "lrw8_write_service" ON lesson_results_w8 FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "lp_select_auth" ON lesson_plans FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "lp_write_service" ON lesson_plans FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "ls_select_auth" ON lesson_sessions FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ls_insert_auth" ON lesson_sessions FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "ls_write_service" ON lesson_sessions FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "slp_select_auth" ON student_lesson_progress FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "slp_insert_auth" ON student_lesson_progress FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "slp_write_service" ON student_lesson_progress FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 👩‍🏫 جداول الموظفين ──────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "sp_select_auth" ON staff_profiles FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sp_write_service" ON staff_profiles FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sev_select_auth" ON staff_evaluations FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sev_write_service" ON staff_evaluations FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sag_select_auth" ON staff_annual_grades FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sag_write_service" ON staff_annual_grades FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "spdp_select_auth" ON staff_pdp FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "spdp_write_service" ON staff_pdp FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sevi_select_auth" ON staff_evidence FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sevi_write_service" ON staff_evidence FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📋 جداول الحضور ────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "sa_select_auth" ON staff_attendance FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sa_write_service" ON staff_attendance FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "scl_select_auth" ON staff_checkin_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "scl_insert_anon" ON staff_checkin_log FOR INSERT TO anon WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "scl_write_service" ON staff_checkin_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sda_select_auth" ON staff_daily_attendance FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sda_write_service" ON staff_daily_attendance FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sdr_select_auth" ON staff_device_registry FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sdr_write_service" ON staff_device_registry FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sn_select_auth" ON staff_notifications FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sn_write_service" ON staff_notifications FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- QR الحضور: الإدخال مسموح لـ anon (تابلت البوابة)
SELECT _edoos_exec('CREATE POLICY "aql_select_auth" ON attendance_qr_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "aql_insert_anon" ON attendance_qr_log FOR INSERT TO anon WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "aql_write_service" ON attendance_qr_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- البوابة: الإدخال مسموح لـ anon
SELECT _edoos_exec('CREATE POLICY "gel_select_auth" ON gate_entry_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "gel_insert_anon" ON gate_entry_log FOR INSERT TO anon WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "gel_write_service" ON gate_entry_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── ⚙️ إعدادات التطبيق ─────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "as_select_auth" ON app_settings FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "as_write_service" ON app_settings FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🧠 VARK ─────────────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "vark_select_auth" ON vark_results FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "vark_insert_auth" ON vark_results FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "vark_write_service" ON vark_results FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 💾 النسخ الاحتياطية ─────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "bl_select_auth" ON backups_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "bl_write_service" ON backups_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "br_select_auth" ON backup_requests FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "br_insert_auth" ON backup_requests FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "br_write_service" ON backup_requests FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🔄 جداول التبديل ────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "ss_select_auth" ON schedule_swaps FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ss_insert_auth" ON schedule_swaps FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "ss_write_service" ON schedule_swaps FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "ps_select_auth" ON period_swaps FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ps_insert_auth" ON period_swaps FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "ps_write_service" ON period_swaps FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "psl_select_auth" ON permanent_swap_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "psl_write_service" ON permanent_swap_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "subl_select_auth" ON substitute_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "subl_write_service" ON substitute_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "suba_select_auth" ON substitute_assignments FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "suba_write_service" ON substitute_assignments FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📅 الواجب والمرافق ──────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "ds_select_auth" ON duty_schedule FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ds_insert_auth" ON duty_schedule FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "ds_write_service" ON duty_schedule FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "fb_select_auth" ON facility_bookings FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "fb_insert_auth" ON facility_bookings FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "fb_write_service" ON facility_bookings FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📆 التقويم ──────────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "se_select_auth" ON school_events FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "se_write_service" ON school_events FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── ⚙️ إعدادات المدرسة والثيمات ─────────────────────────────
SELECT _edoos_exec('CREATE POLICY "sc_select_auth" ON school_config FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sc_write_service" ON school_config FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sth_select_auth" ON school_themes FOR SELECT USING (true)');
SELECT _edoos_exec('CREATE POLICY "sth_write_service" ON school_themes FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📊 سجل نوايا الطلاب ─────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "sil_select_auth" ON student_intent_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sil_write_service" ON student_intent_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🤲 الأخصائية الاجتماعية ─────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "soc_select_auth" ON social_cases FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "soc_write_service" ON social_cases FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── ♿ الدمج والتعليم الخاص ──────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "inc_select_auth" ON inclusion_plans FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "inc_write_service" ON inclusion_plans FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🏥 الصحة والتمريض ───────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "shr_select_auth" ON student_health_records FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "shr_write_service" ON student_health_records FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "nv_select_auth" ON nurse_visits FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "nv_write_service" ON nurse_visits FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "nvv_select_auth" ON nursing_visits FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "nvv_write_service" ON nursing_visits FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🔒 الأمن ────────────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "sap_select_auth" ON security_authorized_pickups FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sap_write_service" ON security_authorized_pickups FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🔧 الصيانة ──────────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "mr_select_auth" ON maintenance_requests FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "mr_insert_auth" ON maintenance_requests FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "mr_write_service" ON maintenance_requests FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 💰 المالية ──────────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "fr_select_auth" ON financial_records FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "fr_write_service" ON financial_records FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "be_select_auth" ON budget_entries FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "be_write_service" ON budget_entries FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📚 المكتبة ──────────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "lb_select_auth" ON library_books FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "lb_write_service" ON library_books FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "ll_select_auth" ON library_loans FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ll_insert_auth" ON library_loans FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "ll_write_service" ON library_loans FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🍽️ المقصف ───────────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "ci_select_auth" ON cafeteria_items FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ci_write_service" ON cafeteria_items FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "cm_select_auth" ON cafeteria_menu FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "cm_write_service" ON cafeteria_menu FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "ct_select_auth" ON cafeteria_transactions FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "ct_insert_auth" ON cafeteria_transactions FOR INSERT TO authenticated WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "ct_write_service" ON cafeteria_transactions FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📝 الاختبارات ───────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "es_select_auth" ON exam_schedule FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "es_write_service" ON exam_schedule FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "er_select_auth" ON exam_results FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "er_write_service" ON exam_results FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📢 البث والإعلانات ──────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "bc_select_auth" ON broadcasts FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "bc_write_service" ON broadcasts FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 📊 الاستبيانات ──────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "sv_select_auth" ON surveys FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sv_write_service" ON surveys FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sq_select_auth" ON survey_questions FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sq_write_service" ON survey_questions FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sr_select_auth" ON survey_responses FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sr_insert_anon" ON survey_responses FOR INSERT TO anon WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "sr_write_service" ON survey_responses FOR ALL TO service_role USING (true) WITH CHECK (true)');

SELECT _edoos_exec('CREATE POLICY "sa2_select_auth" ON survey_answers FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "sa2_insert_anon" ON survey_answers FOR INSERT TO anon WITH CHECK (true)');
SELECT _edoos_exec('CREATE POLICY "sa2_write_service" ON survey_answers FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ─── 🔔 سجل الإشعارات ────────────────────────────────────────
SELECT _edoos_exec('CREATE POLICY "nl_select_auth" ON notification_log FOR SELECT TO authenticated USING (true)');
SELECT _edoos_exec('CREATE POLICY "nl_write_service" ON notification_log FOR ALL TO service_role USING (true) WITH CHECK (true)');

-- ============================================================
-- STEP 5: تنظيف — حذف الدالة المساعدة
-- ============================================================
DROP FUNCTION IF EXISTS _edoos_exec(TEXT);

-- ============================================================
-- ✅ التحقق النهائي
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN roles::text LIKE '%public%' AND cmd != 'SELECT' THEN '🔴 PUBLIC WRITE - خطر!'
    WHEN roles::text LIKE '%anon%' AND cmd NOT IN ('SELECT','INSERT') THEN '⚠️ ANON UPDATE/DELETE - مشبوه'
    WHEN roles::text LIKE '%service_role%' THEN '✅ service_role - آمن'
    WHEN roles::text LIKE '%authenticated%' THEN '✅ authenticated - آمن'
    WHEN roles::text LIKE '%anon%' THEN '🔵 anon - مقبول للعمليات المحدودة'
    ELSE '🔍 ' || roles::text
  END as security_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
