-- ============================================================
-- curriculum_rules_migration.sql
-- Multi-Curriculum Grade Rules Architecture
-- NAFAS FOR ARTIFICIAL INTELLIGENCE — AlJood EduOS
-- Created: 2026-06-28
-- ============================================================

-- 1) أضف curriculum_type لجدول app_settings (إذا لم يوجد)
INSERT INTO app_settings (key, value)
VALUES ('curriculum_type', 'MOE')
ON CONFLICT (key) DO NOTHING;

-- 2) أضف curriculum_type لجدول schools إذا لم يوجد
ALTER TABLE schools ADD COLUMN IF NOT EXISTS curriculum_type text DEFAULT 'MOE';

-- 3) أنشئ جدول curriculum_rules
CREATE TABLE IF NOT EXISTS curriculum_rules (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_type  text NOT NULL,
  grade_group      text NOT NULL,       -- 'K-3', 'G4-8', 'G9-12', 'ALL', 'K-5', 'G6-12', etc.
  pass_score       numeric NOT NULL DEFAULT 50,
  danger_threshold numeric NOT NULL DEFAULT 60,  -- عتبة الخطر (أعلى من pass_score)
  grade_a          numeric DEFAULT 90,
  grade_b          numeric DEFAULT 80,
  grade_c          numeric DEFAULT 70,
  grade_d          numeric,             -- يُحدَّد بـ pass_score إذا null
  retention_allowed boolean DEFAULT true,
  core_subjects    text[] DEFAULT ARRAY['Arabic','English','Math','Science','Islamic','Social Studies'],
  notes_ar         text,
  notes_en              text,
  language_policy_note  text,   -- ملاحظة سياسة اللغات (إعفاءات، قرارات رسمية)
  created_at            timestamptz DEFAULT now(),
  UNIQUE(curriculum_type, grade_group)
);

-- 4) أدخل قواعد المناهج المعتمدة
INSERT INTO curriculum_rules
  (curriculum_type, grade_group, pass_score, danger_threshold, grade_a, grade_b, grade_c, grade_d, retention_allowed, notes_ar, notes_en)
VALUES
  -- UAE MOE
  ('MOE','K-3',   50, 60, 90, 80, 70, 50, false,
   'لا إعادة للصفوف KG-3 — ترقية تلقائية',
   'No retention K-3 — automatic promotion'),
  ('MOE','G4-8',  50, 60, 90, 80, 70, 50, true,
   'رسوب: أقل من 50% أو رسوب في مادة أساسية واحدة',
   'Fail if <50% overall or fail 1 core subject'),
  ('MOE','G9-12', 60, 70, 90, 80, 70, 60, true,
   'رسوب: أقل من 60% أو رسوب في مادة أساسية واحدة — الإعادة تحسب 60%',
   'Fail if <60% or fail 1 core subject — resit capped at 60%'),

  -- ADEK
  ('ADEK','K-5',  50, 60, 90, 80, 70, 50, false,
   'ترقية إجبارية للصفوف KG-5',
   'Mandatory promotion K-5'),
  ('ADEK','G6-12',50, 60, 90, 80, 70, 50, true,
   'إعادة فقط بعد تدخل وموافقة ADEK الرسمية',
   'Retention only after intervention + ADEK approval'),

  -- KHDA (Dubai)
  ('KHDA','ALL',  60, 70, 90, 80, 70, 60, true,
   'رسوب عند أقل من 60% — رسوب مادة أو مادتين = إعادة فقط — 3+ = إعادة السنة',
   'Fail <60% — fail 1-2 subjects = resit only; fail 3+ = repeat year'),

  -- CBSE
  ('CBSE','ALL',  33, 50, 90, 80, 70, 33, true,
   'رسوب عند أقل من 33% — رسوب مادة واحدة = إعادة مادة — أكثر = إعادة السنة',
   'Fail <33% — fail 1 = compartment; fail more = repeat year'),

  -- British
  ('British','Y1-9', 50, 60, 90, 80, 70, 50, false,
   'لا إعادة للصفوف Y1-9',
   'No retention Y1-9'),
  ('British','GCSE',  50, 60, 90, 80, 70, 50, true,
   'الحد الأدنى تقدير E في GCSE',
   'Minimum grade E in GCSE'),
  ('British','A-Level',50,60, 90, 80, 70, 50, true,
   '5 مواد بتقدير 4+ للحصول على الشهادة',
   '5 subjects grade 4+ for diploma'),

  -- American
  ('American','ALL',  60, 70, 90, 80, 70, 60, true,
   'رسوب: F = أقل من 60% — معدل تراكمي GPA أدنى 1.5–2.0',
   'F < 60%; GPA minimum 1.5–2.0; school-policy driven'),

  -- IB
  ('IB','ALL',  50, 60, 90, 80, 70, 50, true,
   'الحد الأدنى 24/45 نقطة — درجة 2 لكل مادة كحد أدنى',
   'Min 24/45 pts; min grade 2 per subject; fail >2 at grade 2 = no diploma')

ON CONFLICT (curriculum_type, grade_group) DO NOTHING;

-- 4b) تحديث language_policy_note للمناهج التي تملك سياسات لغوية خاصة
UPDATE curriculum_rules
SET language_policy_note =
  'UAE/Gulf CBSE schools are EXEMPT from CBSE Three-Language Policy (Circular Acad-33/2026, effective July 1 2026). ' ||
  'Students already in Grades 7-9 retain current language combinations through Grade 10. ' ||
  'New rule applies prospectively from Grade 6 only. ' ||
  'No student barred from Grade 10 exams for language reasons. ' ||
  'Source: CBSE + Union Minister Pradhan clarification, June 26 2026.'
WHERE curriculum_type = 'CBSE';

-- 5) RLS
ALTER TABLE curriculum_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_curriculum_rules" ON curriculum_rules;
CREATE POLICY "anon_read_curriculum_rules"
  ON curriculum_rules FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auth_write_curriculum_rules" ON curriculum_rules;
CREATE POLICY "auth_write_curriculum_rules"
  ON curriculum_rules FOR ALL TO authenticated USING (true);

-- 6) فهرس
CREATE INDEX IF NOT EXISTS idx_curriculum_rules_type ON curriculum_rules(curriculum_type);
