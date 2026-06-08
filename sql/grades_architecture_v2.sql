-- ============================================================
-- EduOS — نظام الدرجات v2 | Multi-Semester + Historical
-- لا localStorage — كل البيانات في Supabase
-- ============================================================

-- 1. تعريفات التقييمات (الأعمدة الديناميكية لكل فصل)
-- مثل: مشروع الوحدة | اختبار 1 | واجب — لكل فصل دراسي
CREATE TABLE IF NOT EXISTS grade_assessment_defs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,                        -- 'مشروع الوحدة', 'اختبار 1', 'واجب'
  type          TEXT NOT NULL DEFAULT 'exam',         -- exam | hw | project | quiz | activity | other
  max_score     NUMERIC(5,2) NOT NULL DEFAULT 100,
  weight        NUMERIC(5,2) NOT NULL DEFAULT 100,    -- وزن هذا التقييم في المعدل
  semester      INTEGER NOT NULL DEFAULT 1,           -- 1 | 2 | 3
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  subject       TEXT NOT NULL DEFAULT 'CCDI',
  teacher_id    TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grade_assessment_defs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_grade_assessment_defs"
  ON grade_assessment_defs FOR ALL USING (true) WITH CHECK (true);

-- 2. سجل الدرجات المطبَّعة (درجة لكل طالب لكل تقييم)
CREATE TABLE IF NOT EXISTS grade_records (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT NOT NULL,                        -- '3A', '3B', '4A' ...
  grade_level    TEXT,                                 -- 'G3' | 'G4'
  assessment_id  UUID REFERENCES grade_assessment_defs(id) ON DELETE CASCADE,
  score          NUMERIC(5,2),
  semester       INTEGER NOT NULL DEFAULT 1,
  academic_year  TEXT NOT NULL DEFAULT '2025-2026',
  subject        TEXT NOT NULL DEFAULT 'CCDI',
  teacher_id     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_name, class_name, assessment_id)
);

ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_grade_records"
  ON grade_records FOR ALL USING (true) WITH CHECK (true);

-- 3. خلاصة الفصل الدراسي (للتاريخ والمقارنة عبر السنوات)
-- تُعبَّأ تلقائياً عند إغلاق الفصل أو يدوياً
CREATE TABLE IF NOT EXISTS student_semester_summary (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT NOT NULL,
  grade_level    TEXT,
  semester       INTEGER NOT NULL,                     -- 1 | 2 | 3
  academic_year  TEXT NOT NULL,                        -- '2025-2026', '2024-2025' ...
  subject        TEXT NOT NULL DEFAULT 'CCDI',
  final_average  NUMERIC(5,2),                         -- المعدل النهائي للفصل
  grade_letter   TEXT,                                 -- A+ | A | B+ | B | C | D | F
  teacher_id     TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_name, class_name, academic_year, semester, subject)
);

ALTER TABLE student_semester_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_student_semester_summary"
  ON student_semester_summary FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- بيانات افتراضية — تعريفات تقييمات الفصل الأول 2025-2026
-- ─────────────────────────────────────────────────────────────
INSERT INTO grade_assessment_defs
  (name, type, max_score, weight, semester, academic_year, subject, sort_order)
VALUES
  ('مشروع الوحدة', 'project', 100, 60, 1, '2025-2026', 'CCDI', 1),
  ('اختبار 1',     'exam',    100, 40, 1, '2025-2026', 'CCDI', 2),
  ('واجب',         'hw',      100,  0, 1, '2025-2026', 'CCDI', 3)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- ملاحظات المعمارية:
-- • grade_assessment_defs = تعريف الأعمدة (ما يظهر كـ chips في الـ UI)
-- • grade_records = الدرجات الفعلية (صف لكل طالب لكل تقييم)
-- • student_semester_summary = الخلاصة السنوية (للتاريخ والمقارنة)
--
-- كيف تعمل الفصول الثلاثة؟
--   semester=1 → ف1 (سبتمبر–ديسمبر 2025)
--   semester=2 → ف2 (يناير–مارس 2026)
--   semester=3 → ف3 (أبريل–يوليو 2026)
--
-- كيف تعمل السنوات الماضية؟
--   academic_year='2024-2025' → السنة الماضية
--   academic_year='2025-2026' → السنة الحالية
--   في student_semester_summary يمكن مقارنة نفس الطالب عبر سنوات متعددة
--
-- الربط بالسنوات الماضية:
--   JOIN على student_name + subject → نرى مسيرة الطالب كاملة
--   مثال: SELECT * FROM student_semester_summary
--         WHERE student_name = 'نورة السعيدي'
--         ORDER BY academic_year, semester
-- ─────────────────────────────────────────────────────────────
