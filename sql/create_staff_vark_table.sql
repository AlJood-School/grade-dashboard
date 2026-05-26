-- ============================================================
-- جدول نتائج VARK للموظفين
-- staff_vark_results
-- تاريخ الإنشاء: 26 مايو 2026
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff_vark_results (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- بيانات الموظف
  staff_id        TEXT NOT NULL,          -- من staff.json
  staff_name      TEXT NOT NULL,
  staff_role      TEXT,                   -- دور الموظف
  staff_subject   TEXT,                   -- المادة (للمعلمات)

  -- نتيجة VARK
  vark_scores     JSONB NOT NULL,         -- {"V":3,"A":5,"R":2,"K":2}
  dominant_style  TEXT NOT NULL,          -- V / A / R / K / Multimodal
  all_styles      TEXT[],                 -- مصفوفة الأنماط المتعددة
  level_used      TEXT DEFAULT 'adult',   -- مستوى الاستبيان

  -- metadata
  academic_year   TEXT DEFAULT '2025-2026',
  is_latest       BOOLEAN DEFAULT TRUE,
  session_note    TEXT,                   -- ملاحظة اختيارية

  -- للتخصيص اليدوي (أصحاب الهمم)
  assigned_by     TEXT DEFAULT 'self',    -- 'self' / 'teacher'
  assigned_by_id  TEXT                    -- ID المعلمة المخصِّصة
);

-- ============================================================
-- فهارس الأداء
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_staff_vark_staff_id ON public.staff_vark_results(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_vark_is_latest ON public.staff_vark_results(is_latest);
CREATE INDEX IF NOT EXISTS idx_staff_vark_academic_year ON public.staff_vark_results(academic_year);
CREATE INDEX IF NOT EXISTS idx_staff_vark_dominant ON public.staff_vark_results(dominant_style);

-- ============================================================
-- RLS — Row Level Security
-- ============================================================
ALTER TABLE public.staff_vark_results ENABLE ROW LEVEL SECURITY;

-- القراءة: كل الأدوار المصرح بها
CREATE POLICY "staff_vark_select"
  ON public.staff_vark_results FOR SELECT
  USING (true);

-- الإدراج: anon يستطيع الإدراج (الاستبيان لا يحتاج login)
CREATE POLICY "staff_vark_insert"
  ON public.staff_vark_results FOR INSERT
  WITH CHECK (true);

-- التحديث: service_role فقط (لتحديث is_latest)
CREATE POLICY "staff_vark_update"
  ON public.staff_vark_results FOR UPDATE
  USING (true);

-- ============================================================
-- دالة: تحديث is_latest تلقائياً عند إدراج نتيجة جديدة
-- يضع is_latest=false على كل النتائج القديمة لنفس الموظف
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_staff_vark_latest()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.staff_vark_results
  SET is_latest = FALSE
  WHERE staff_id = NEW.staff_id
    AND id != NEW.id
    AND academic_year = NEW.academic_year;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_staff_vark_latest
  AFTER INSERT ON public.staff_vark_results
  FOR EACH ROW EXECUTE FUNCTION public.update_staff_vark_latest();
