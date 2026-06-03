-- =============================================
-- Sprint E: منظومة التقييم الوظيفي الذكي
-- EduOS — AlJood School
-- =============================================

-- 1. جدول الخطط المهنية
CREATE TABLE IF NOT EXISTS staff_pdp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id TEXT DEFAULT 'aljood',
  staff_name TEXT NOT NULL,
  staff_role TEXT NOT NULL,
  school_year TEXT NOT NULL DEFAULT '2025-2026',
  -- الأهداف الذكية SMART (مصفوفة JSON)
  goals JSONB DEFAULT '[]',
  -- ارتباط بأهداف المدرسة
  school_goals_alignment TEXT,
  -- اقتراحات الذكاء الاصطناعي
  ai_suggestions JSONB DEFAULT '[]',
  -- الحالة
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','revision_requested')),
  submitted_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  revision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_name, school_year)
);

-- 2. جدول التقييمات الفصلية
CREATE TABLE IF NOT EXISTS staff_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id TEXT DEFAULT 'aljood',
  staff_name TEXT NOT NULL,
  staff_role TEXT NOT NULL,
  school_year TEXT NOT NULL DEFAULT '2025-2026',
  term INTEGER NOT NULL CHECK (term IN (1, 2)),
  -- التقييم الذاتي
  self_criteria JSONB DEFAULT '{}',
  self_score NUMERIC(5,2),
  self_strengths TEXT,
  self_improvement TEXT,
  self_completed_at TIMESTAMPTZ,
  -- تقييم المديرة
  manager_criteria JSONB DEFAULT '{}',
  manager_score NUMERIC(5,2),
  manager_strengths TEXT,
  manager_improvement TEXT,
  manager_goals TEXT,
  evaluator_name TEXT,
  manager_completed_at TIMESTAMPTZ,
  -- الدرجة النهائية للفصل
  final_score NUMERIC(5,2),
  -- الحالة
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','self_done','manager_done','finalized')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_name, school_year, term)
);

-- 3. جدول الدرجات السنوية النهائية
CREATE TABLE IF NOT EXISTS staff_annual_grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id TEXT DEFAULT 'aljood',
  staff_name TEXT NOT NULL,
  staff_role TEXT NOT NULL,
  school_year TEXT NOT NULL DEFAULT '2025-2026',
  term1_score NUMERIC(5,2),
  term2_score NUMERIC(5,2),
  pdp_completion_score NUMERIC(5,2), -- نسبة تنفيذ الخطة المهنية
  annual_grade NUMERIC(5,2),         -- الدرجة النهائية /100
  grade_label TEXT,                  -- ممتاز / جيد جداً / جيد / مقبول / ضعيف
  principal_notes TEXT,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_name, school_year)
);

-- RLS: مفتوح للقراءة والكتابة (يُقيّد لاحقاً بعد إضافة Auth)
ALTER TABLE staff_pdp ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_annual_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_pdp" ON staff_pdp FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_evaluations" ON staff_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_annual_grades" ON staff_annual_grades FOR ALL USING (true) WITH CHECK (true);

-- Trigger: تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pdp_updated_at BEFORE UPDATE ON staff_pdp FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER eval_updated_at BEFORE UPDATE ON staff_evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
