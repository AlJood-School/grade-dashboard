-- ============================================================
-- EduOS — جداول Supabase المطلوبة
-- تاريخ الإنشاء: 2026-06-01
-- ============================================================

-- ============================================================
-- 1. school_config — إعدادات المدرسة (من Smart Onboarding Wizard)
-- ============================================================
CREATE TABLE IF NOT EXISTS school_config (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name             text NOT NULL,
  logo_url                text,
  emirate                 text,
  region                  text,
  school_type             text,          -- حكومية | خاصة | دولية
  curriculum              text,          -- MOE | British | American | IB | CBSE | ICSE | French | ...
  authority               text,          -- MOE | KHDA | SPEA | ADEK
  authority_url           text,
  grading_system          text,
  language                text DEFAULT 'ar',
  gender_policy           text,          -- girls | boys | mixed | mixed_then_separate
  gender_separate_from_grade int,
  cycles                  text[],        -- ['KG','أولى','ثانية','ثالثة']
  academic_track          text,          -- general | advanced
  has_kg                  boolean DEFAULT false,
  has_special_ed          boolean DEFAULT false,
  special_ed_types        text[],
  special_ed_count        int DEFAULT 0,
  special_ed_inclusion_type text,        -- full | partial | separate_class | special_school
  subjects                text[],
  special_ed_subjects     text[],
  device_policy           jsonb,         -- {grade: device_type}
  news_sources            text[] DEFAULT ARRAY['moe.gov.ae'],
  total_students          int,
  total_teachers          int,
  total_staff             int,
  total_parents           int,
  total_classes           text,
  roles_config            jsonb,         -- {role: count}
  modules_enabled         text[],        -- ['Teacher OS','SpecialEd OS','Student OS','Parent OS']
  setup_complete          boolean DEFAULT false,
  academic_year           text DEFAULT '2025-2026',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE school_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_authenticated" ON school_config
  FOR ALL USING (true);

-- ============================================================
-- 2. lesson_plans — حصص ذكية مُولَّدة بـ Gemini
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade             text NOT NULL,
  section_label     text,
  subject           text NOT NULL,
  topic             text NOT NULL,
  duration_minutes  int,
  student_count     int,
  model             text,               -- 5E | UbD | Bloom | Direct
  plan_json         jsonb NOT NULL,     -- الخطة كاملة بتنسيق JSON من Gemini
  created_by        text DEFAULT 'teacher',
  status            text DEFAULT 'draft', -- draft | active | completed | archived
  school_id         uuid REFERENCES school_config(id),
  academic_year     text DEFAULT '2025-2026',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade ON lesson_plans(grade);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject ON lesson_plans(subject);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_created ON lesson_plans(created_at DESC);

-- RLS
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_authenticated" ON lesson_plans
  FOR ALL USING (true);

-- ============================================================
-- 3. lesson_sessions — الحصص الحية (Sprint B)
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id  uuid REFERENCES lesson_plans(id),
  session_code    text UNIQUE NOT NULL,  -- رمز الدخول للطلاب (4-6 أحرف)
  grade           text,
  section_label   text,
  subject         text,
  status          text DEFAULT 'waiting', -- waiting | active | paused | ended
  current_phase   int DEFAULT 0,
  teacher_id      text,
  started_at      timestamptz,
  ended_at        timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE lesson_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_authenticated" ON lesson_sessions
  FOR ALL USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lesson_sessions;

-- ============================================================
-- 4. student_lesson_progress — تقدم الطالب داخل الحصة (Sprint D)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid REFERENCES lesson_sessions(id),
  student_name    text NOT NULL,
  student_id      text,
  current_phase   int DEFAULT 0,
  phases_done     int[] DEFAULT '{}',
  answers         jsonb DEFAULT '{}',
  self_assessment int,                   -- 1-5
  peer_assessment jsonb,
  exit_ticket     text,
  completed       boolean DEFAULT false,
  last_active     timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_authenticated" ON student_lesson_progress
  FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE student_lesson_progress;

-- ============================================================
-- Done ✅
-- ============================================================
