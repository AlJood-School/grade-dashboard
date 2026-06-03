-- ═══════════════════════════════════════════════════════════════════
-- Sprint F — محرك التوثيق الصامت
-- الجداول: staff_evidence | lesson_truth_log | lesson_exit_log
-- تاريخ الإنشاء: يونيو 2026 | EduOS — منيرة علي المري
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. جدول الأدلة الصامتة للمعلمة
-- كل تصرف مهني تقوم به المعلمة يُوثَّق تلقائياً
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_evidence (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id       text        NOT NULL,
  session_id       text,
  class_key        text,
  subject          text,
  evidence_type    text        NOT NULL,
  -- القيم المسموحة:
  -- activity_change    ← غيّرت النشاط أثناء الحصة
  -- student_observation← ملاحظة على طالب بعينه
  -- voice_memo_text    ← ملاحظة صوتية (مُحوَّلة لنص)
  -- vark_override      ← تغيير تصنيف VARK لطالب
  -- lesson_summary     ← ملخص نهاية الحصة (مخطط vs منفذ)
  -- phase_deviation    ← انحراف عن خطة المراحل
  action_data      jsonb       DEFAULT '{}',
  mapped_goal      text,         -- الهدف التطويري من PDP
  mapped_criteria  text,         -- معيار التقييم الوظيفي
  auto_narrative   text,         -- السرد التلقائي (AI أو قالب)
  teacher_confirmed boolean     DEFAULT false,
  created_at       timestamptz  DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. جدول سجل الحقيقة — كل حدث في الحصة
-- يُسجَّل تلقائياً دون تدخل المعلمة
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_truth_log (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id       text        NOT NULL,
  class_key        text,
  event_type       text        NOT NULL,
  -- القيم المسموحة:
  -- session_start | session_end
  -- phase_start | phase_change
  -- broadcast_msg | assessment_launched | poll_launched
  -- activity_changed | student_observation | vark_override
  event_data       jsonb       DEFAULT '{}',
  teacher_id       text,
  elapsed_seconds  int,         -- الثانية من بدء الحصة
  created_at       timestamptz  DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 3. جدول تسجيل خروج الطلاب من الحصة
-- البنية جاهزة لـ Sprint G — الرصد اللحظي
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_exit_log (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id       text        NOT NULL,
  student_id       text        NOT NULL,
  student_name     text,
  class_key        text,
  exit_timestamps  jsonb       DEFAULT '[]', -- مصفوفة أوقات الخروج
  total_exits      int         DEFAULT 0,
  teacher_confirmed boolean    DEFAULT false, -- المعلمة أكدت: الخروج حقيقي لا تقني
  created_at       timestamptz  DEFAULT now(),
  updated_at       timestamptz  DEFAULT now()
);

-- ─────────────────────────────────────────────
-- RLS Policies — مفتوحة للتطوير
-- ─────────────────────────────────────────────
ALTER TABLE staff_evidence    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_truth_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_exit_log   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_staff_evidence"
  ON staff_evidence FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "open_truth_log"
  ON lesson_truth_log FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "open_exit_log"
  ON lesson_exit_log FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- Indexes — أداء الاستعلام
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_evidence_teacher
  ON staff_evidence(teacher_id);
CREATE INDEX IF NOT EXISTS idx_evidence_session
  ON staff_evidence(session_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type
  ON staff_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_truth_session
  ON lesson_truth_log(session_id);
CREATE INDEX IF NOT EXISTS idx_truth_type
  ON lesson_truth_log(event_type);
CREATE INDEX IF NOT EXISTS idx_exit_session
  ON lesson_exit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_exit_student
  ON lesson_exit_log(student_id, class_key);
