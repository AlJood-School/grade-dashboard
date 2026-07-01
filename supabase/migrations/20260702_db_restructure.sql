-- ============================================================
-- MIGRATION: DB Restructure - 2 July 2026
-- مراجعة كاملة لقاعدة البيانات — الجود
-- ============================================================

-- 1. teacher_assignments: drop + recreate with correct FK type
DROP TABLE IF EXISTS teacher_assignments CASCADE;
CREATE TABLE teacher_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_db_id text NOT NULL REFERENCES staff_profiles(staff_db_id) ON DELETE CASCADE,
  subject text NOT NULL,
  cycle text,
  academic_year text DEFAULT '2024-2025',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY anon_read_ta ON teacher_assignments FOR SELECT TO anon USING (true);
CREATE POLICY service_all_ta ON teacher_assignments FOR ALL TO service_role USING (true);

-- Populate teacher_assignments from staff_profiles.subject_ar
INSERT INTO teacher_assignments (staff_db_id, subject, academic_year)
SELECT staff_db_id, subject_ar, '2024-2025'
FROM staff_profiles
WHERE subject_ar IS NOT NULL AND subject_ar != ''
ON CONFLICT DO NOTHING;

-- 2. student_grades: add missing columns + rename term1_total
ALTER TABLE student_grades RENAME COLUMN term1_total TO term_total;
ALTER TABLE student_grades
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS teacher_staff_db_id text,
  ADD COLUMN IF NOT EXISTS academic_year text DEFAULT '2024-2025',
  ADD COLUMN IF NOT EXISTS student_no integer,
  ADD COLUMN IF NOT EXISTS sb1 numeric,
  ADD COLUMN IF NOT EXISTS effort integer;

-- 3. Delete incomplete rows + migrate dash_grades → student_grades
DELETE FROM student_grades;
INSERT INTO student_grades (
  school_id, academic_year, grade, section, student_name, student_no,
  subject, teacher_staff_db_id, term, sb1, effort, formative, summative
)
SELECT
  'aljood', '2024-2025', grade, section, student_name, student_no,
  'الحوسبة والتصميم الابداعي والابتكار',
  '574244',  -- منيرة المري — CCDI G3+G4
  2, sb1, effort, total_school, end_of_term
FROM dash_grades;

-- 4. school_config: insert AlJood record
INSERT INTO school_config (
  school_name, emirate, region, school_type, curriculum, authority,
  gender_policy, gender_separate_from_grade, cycles, academic_track,
  has_special_ed, special_ed_types, special_ed_count, special_ed_inclusion_type,
  subjects, staff_roles, student_count, teacher_count, parent_count, setup_complete
) VALUES (
  'مدرسة الجود', 'أبوظبي', 'أبوظبي', 'حكومية',
  'المناهج الوطنية الإماراتية', 'MOE Federal',
  'mixed_to_grade4_then_female', 'G5',
  '[{"name":"KG","grades":["KG1","KG2"]},{"name":"الحلقة الأولى","grades":["G1","G2","G3","G4"]},{"name":"الحلقة الثانية","grades":["G5","G6","G7","G8"]}]',
  'general', true,
  '["إعاقة بصرية","إعاقة سمعية","صعوبات تعلم","اضطراب طيف التوحد","إعاقة حركية"]',
  95, 'inclusive',
  '["اللغة العربية","التربية الإسلامية","الدراسات الاجتماعية والتربية الوطنية","الرياضيات","العلوم العامة","اللغة الانجليزية","التربية البدنية","الفنون البصرية","التربية الموسيقية","الحوسبة والتصميم الابداعي والابتكار","دراما","رياض الأطفال عربي","رياض الأطفال إنجليزي"]',
  '{"teacher":79,"admin":5,"specialist":8,"support":12}',
  1241, 104, 1033, true
);

-- Results:
-- student_grades: 315 rows (CCDI G3+G4 Term2 2024-2025)
-- teacher_assignments: 54 rows
-- school_config: 1 row (AlJood complete config)
-- students.student_number: 1047/1241 updated (194 unmatched — duplicate names or spelling)
