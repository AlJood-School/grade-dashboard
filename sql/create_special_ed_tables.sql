-- ============================================================
-- جداول منظومة التربية الخاصة — special_ed_dashboard
-- تاريخ الإنشاء: 26 مايو 2026
-- ============================================================

-- ============================================================
-- 1. جدول بيانات الطلاب (أصحاب الهمم)
-- special_ed_students
-- ============================================================
CREATE TABLE IF NOT EXISTS public.special_ed_students (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- بيانات الطالب
  student_id        TEXT UNIQUE NOT NULL,    -- رقم الطالب
  name_ar           TEXT NOT NULL,
  name_en           TEXT,
  gender            TEXT CHECK (gender IN ('male','female')),
  grade             TEXT,                    -- KG1, KG2, G1..G9
  class_section     TEXT,                    -- 1A, 2B...
  academic_year     TEXT DEFAULT '2025-2026',

  -- بيانات الإعاقة
  disability_type   TEXT,                    -- نوع الإعاقة
  disability_code   TEXT,                    -- رمز وزارة التعليم
  support_level     TEXT CHECK (support_level IN ('1','2','3')),

  -- نوع الدمج
  inclusion_type    TEXT CHECK (inclusion_type IN (
    'full_inclusion',     -- مدمج كلياً
    'partial_inclusion',  -- مدمج جزئياً
    'resource_room',      -- غرفة مصادر
    'special_class',      -- فصل خاص
    'in_class_support'    -- دعم في الصف
  )),

  -- المعلمة والمرافق
  teacher_id        TEXT,                    -- معلمة التربية الخاصة
  companion_id      TEXT,                    -- المرافق الفردي
  homeroom_teacher  TEXT,                    -- معلمة الصف العادي

  -- VARK
  vark_style        TEXT,
  vark_assigned_by  TEXT DEFAULT 'teacher',

  -- حالة القيد
  is_active         BOOLEAN DEFAULT TRUE,
  notes             TEXT,
  school_id         TEXT DEFAULT 'aljood'    -- للتوسع SaaS
);

CREATE INDEX IF NOT EXISTS idx_sped_student_id ON public.special_ed_students(student_id);
CREATE INDEX IF NOT EXISTS idx_sped_grade ON public.special_ed_students(grade);
CREATE INDEX IF NOT EXISTS idx_sped_teacher ON public.special_ed_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sped_school ON public.special_ed_students(school_id);

ALTER TABLE public.special_ed_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sped_students_select" ON public.special_ed_students FOR SELECT USING (true);
CREATE POLICY "sped_students_insert" ON public.special_ed_students FOR INSERT WITH CHECK (true);
CREATE POLICY "sped_students_update" ON public.special_ed_students FOR UPDATE USING (true);

-- ============================================================
-- 2. جدول سجل الحضور اليومي
-- special_ed_attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.special_ed_attendance (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  student_id      TEXT NOT NULL REFERENCES public.special_ed_students(student_id),
  date            DATE NOT NULL,
  period          TEXT,                      -- رقم الحصة
  status          TEXT CHECK (status IN ('present','absent','late','excused')),
  noted_by        TEXT,                      -- ID المعلمة
  note            TEXT,
  school_id       TEXT DEFAULT 'aljood'
);

CREATE INDEX IF NOT EXISTS idx_sped_att_student ON public.special_ed_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_sped_att_date ON public.special_ed_attendance(date);

ALTER TABLE public.special_ed_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sped_att_select" ON public.special_ed_attendance FOR SELECT USING (true);
CREATE POLICY "sped_att_insert" ON public.special_ed_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "sped_att_update" ON public.special_ed_attendance FOR UPDATE USING (true);

-- ============================================================
-- 3. جدول أهداف IEP وتتبع التحقق
-- special_ed_iep_goals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.special_ed_iep_goals (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  student_id      TEXT NOT NULL REFERENCES public.special_ed_students(student_id),
  academic_year   TEXT DEFAULT '2025-2026',
  term            TEXT CHECK (term IN ('T1','T2','T3')),

  -- الهدف
  goal_text       TEXT NOT NULL,
  subject_area    TEXT,                      -- المجال (أكاديمي، اجتماعي، حركي...)
  target_date     DATE,

  -- التقدم
  progress_pct    INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  status          TEXT CHECK (status IN ('not_started','in_progress','achieved','discontinued')),
  last_assessed   DATE,
  assessed_by     TEXT,

  notes           TEXT,
  school_id       TEXT DEFAULT 'aljood'
);

CREATE INDEX IF NOT EXISTS idx_iep_student ON public.special_ed_iep_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_iep_year ON public.special_ed_iep_goals(academic_year);
CREATE INDEX IF NOT EXISTS idx_iep_status ON public.special_ed_iep_goals(status);

ALTER TABLE public.special_ed_iep_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iep_goals_select" ON public.special_ed_iep_goals FOR SELECT USING (true);
CREATE POLICY "iep_goals_insert" ON public.special_ed_iep_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "iep_goals_update" ON public.special_ed_iep_goals FOR UPDATE USING (true);

-- ============================================================
-- 4. جدول الملاحظات اليومية والتقارير
-- special_ed_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.special_ed_notes (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  student_id      TEXT NOT NULL REFERENCES public.special_ed_students(student_id),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  note_type       TEXT CHECK (note_type IN (
    'daily_obs',      -- ملاحظة يومية
    'behavior',       -- سلوكي
    'academic',       -- أكاديمي
    'iep_progress',   -- تقدم IEP
    'parent_comm',    -- تواصل مع الأهل
    'incident'        -- حادثة
  )),
  content         TEXT NOT NULL,
  noted_by        TEXT,
  is_shared       BOOLEAN DEFAULT FALSE,    -- مشاركة مع أولياء الأمور؟
  school_id       TEXT DEFAULT 'aljood'
);

CREATE INDEX IF NOT EXISTS idx_notes_student ON public.special_ed_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_date ON public.special_ed_notes(date);
CREATE INDEX IF NOT EXISTS idx_notes_type ON public.special_ed_notes(note_type);

ALTER TABLE public.special_ed_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sped_notes_select" ON public.special_ed_notes FOR SELECT USING (true);
CREATE POLICY "sped_notes_insert" ON public.special_ed_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "sped_notes_update" ON public.special_ed_notes FOR UPDATE USING (true);

-- ============================================================
-- 5. جدول التقارير الرسمية (تقرير ADEK / وزارة)
-- special_ed_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.special_ed_reports (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  student_id      TEXT NOT NULL REFERENCES public.special_ed_students(student_id),
  report_type     TEXT CHECK (report_type IN ('weekly','monthly','term','annual','moe')),
  period_start    DATE,
  period_end      DATE,
  academic_year   TEXT DEFAULT '2025-2026',

  -- محتوى التقرير
  summary         TEXT,
  achievements    TEXT,
  challenges      TEXT,
  recommendations TEXT,
  next_goals      TEXT,

  -- حالة التقرير
  status          TEXT CHECK (status IN ('draft','ready','submitted')) DEFAULT 'draft',
  prepared_by     TEXT,
  submitted_at    TIMESTAMPTZ,

  -- الملف (رابط أو base64)
  file_url        TEXT,
  school_id       TEXT DEFAULT 'aljood'
);

CREATE INDEX IF NOT EXISTS idx_reports_student ON public.special_ed_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.special_ed_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_year ON public.special_ed_reports(academic_year);

ALTER TABLE public.special_ed_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sped_reports_select" ON public.special_ed_reports FOR SELECT USING (true);
CREATE POLICY "sped_reports_insert" ON public.special_ed_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "sped_reports_update" ON public.special_ed_reports FOR UPDATE USING (true);

-- ============================================================
-- 6. جدول جدول حصص الطلاب (ربط طالب × حصة × معلمة)
-- special_ed_schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.special_ed_schedules (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  student_id      TEXT NOT NULL REFERENCES public.special_ed_students(student_id),
  teacher_id      TEXT NOT NULL,
  schedule_type   TEXT CHECK (schedule_type IN ('ramadan','regular')) DEFAULT 'regular',
  academic_year   TEXT DEFAULT '2025-2026',

  -- الجدول (JSON مرن)
  schedule_data   JSONB,    -- {"sunday":["h1","h2"],"monday":["h3"],...}
  location        TEXT,     -- غرفة مصادر / فصل خاص / الصف العادي

  is_active       BOOLEAN DEFAULT TRUE,
  effective_from  DATE,
  effective_to    DATE,
  school_id       TEXT DEFAULT 'aljood'
);

CREATE INDEX IF NOT EXISTS idx_sped_sched_student ON public.special_ed_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_sped_sched_teacher ON public.special_ed_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sped_sched_type ON public.special_ed_schedules(schedule_type);

ALTER TABLE public.special_ed_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sped_sched_select" ON public.special_ed_schedules FOR SELECT USING (true);
CREATE POLICY "sped_sched_insert" ON public.special_ed_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "sped_sched_update" ON public.special_ed_schedules FOR UPDATE USING (true);

-- ============================================================
-- دالة: تحديث updated_at تلقائياً
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sped_students_updated
  BEFORE UPDATE ON public.special_ed_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_iep_goals_updated
  BEFORE UPDATE ON public.special_ed_iep_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
