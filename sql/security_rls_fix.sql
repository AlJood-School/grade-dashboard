-- ============================================================
-- EduOS Security RLS Fix — تصليح Row Level Security
-- تاريخ: 2026-06-09
-- الهدف: منع القراءة/الكتابة على الجداول الحساسة بمفتاح anon
-- ============================================================

-- ============================================================
-- 1. student_grades — حماية الدرجات (كانت مكشوفة للجميع!)
-- ============================================================
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وُجدت
DROP POLICY IF EXISTS "anon_read_grades" ON student_grades;
DROP POLICY IF EXISTS "service_role_all" ON student_grades;
DROP POLICY IF EXISTS "grades_select" ON student_grades;
DROP POLICY IF EXISTS "grades_insert" ON student_grades;
DROP POLICY IF EXISTS "grades_update" ON student_grades;
DROP POLICY IF EXISTS "grades_delete" ON student_grades;

-- service_role فقط يملك صلاحيات كاملة
CREATE POLICY "service_role_full_grades"
  ON student_grades
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- anon: لا قراءة، لا كتابة
-- (عدم وجود policy = رفض تلقائي بعد تفعيل RLS)

-- ============================================================
-- 2. app_settings — حماية الإعدادات (Gemini key مكشوف!)
-- ============================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_settings" ON app_settings;
DROP POLICY IF EXISTS "service_role_settings" ON app_settings;
DROP POLICY IF EXISTS "settings_select" ON app_settings;

-- service_role فقط
CREATE POLICY "service_role_full_settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. weekly_results — حماية نتائج الأسابيع
-- ============================================================
ALTER TABLE weekly_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_weekly" ON weekly_results;
CREATE POLICY "service_role_full_weekly"
  ON weekly_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 4. vark_results — نتائج التقييم
-- ============================================================
ALTER TABLE vark_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_vark" ON vark_results;
CREATE POLICY "service_role_full_vark"
  ON vark_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 5. staff_evaluations — تقييمات الموظفين
-- ============================================================
ALTER TABLE staff_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_eval" ON staff_evaluations;
CREATE POLICY "service_role_full_eval"
  ON staff_evaluations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 6. staff_annual_grades — الدرجات السنوية
-- ============================================================
ALTER TABLE staff_annual_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_annual" ON staff_annual_grades;
CREATE POLICY "service_role_full_annual"
  ON staff_annual_grades FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 7. lesson_truth_log — سجل الدروس
-- ============================================================
ALTER TABLE lesson_truth_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_lesson" ON lesson_truth_log;
CREATE POLICY "service_role_full_lesson"
  ON lesson_truth_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 8. attendance_qr_log — سجل QR الحضور
-- ============================================================
ALTER TABLE attendance_qr_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_qr" ON attendance_qr_log;
CREATE POLICY "service_role_full_qr"
  ON attendance_qr_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 9. gate_entry_log — سجل دخول البوابة
-- ============================================================
ALTER TABLE gate_entry_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_gate" ON gate_entry_log;
CREATE POLICY "service_role_full_gate"
  ON gate_entry_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 10. backups_log — سجل النسخ الاحتياطية
-- ============================================================
ALTER TABLE backups_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_backup" ON backups_log;
CREATE POLICY "service_role_full_backup"
  ON backups_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 11. grade_records — سجلات الدرجات
-- ============================================================
ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_grade_rec" ON grade_records;
CREATE POLICY "service_role_full_grade_rec"
  ON grade_records FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 12. student_semester_summary — ملخص الفصل
-- ============================================================
ALTER TABLE student_semester_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_semester" ON student_semester_summary;
CREATE POLICY "service_role_full_semester"
  ON student_semester_summary FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 13. staff_attendance / staff_checkin_log / staff_daily_attendance
-- ============================================================
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_sattn" ON staff_attendance;
CREATE POLICY "service_role_full_sattn"
  ON staff_attendance FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- تحقق ختامي — عرض حالة RLS على كل الجداول
-- ============================================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
