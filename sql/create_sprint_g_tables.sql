-- ═══════════════════════════════════════════════════
-- Sprint G — EduOS Tables
-- تاريخ: يونيو 2026
-- ═══════════════════════════════════════════════════

-- 1. جدول سجل حصص الاحتياط
CREATE TABLE IF NOT EXISTS substitute_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  period_number INT,
  grade VARCHAR(10),
  section VARCHAR(5),
  class_key VARCHAR(20),
  subject VARCHAR(100),
  original_teacher_id VARCHAR(100) NOT NULL,
  original_teacher_name VARCHAR(200),
  absence_reason VARCHAR(50) NOT NULL,
  -- القيم: 'sick' | 'admin_release' | 'external_activity' | 'other'
  absence_detail TEXT,
  substitute_teacher_id VARCHAR(100) NOT NULL,
  substitute_teacher_name VARCHAR(200),
  substitute_type VARCHAR(20) DEFAULT 'citizen',
  -- القيم: 'citizen' | 'expat' | 'daily'
  status VARCHAR(20) DEFAULT 'assigned',
  -- القيم: 'assigned' | 'confirmed' | 'completed'
  lesson_summary TEXT,
  topics_covered TEXT,
  homework_assigned TEXT,
  evidence_captured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE substitute_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_log_open" ON substitute_log FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────

-- 2. جدول النصاب الأسبوعي للمعلمات
CREATE TABLE IF NOT EXISTS weekly_period_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id VARCHAR(100) NOT NULL,
  teacher_name VARCHAR(200),
  teacher_type VARCHAR(20) NOT NULL,
  -- القيم: 'citizen' | 'expat' | 'daily'
  week_start DATE NOT NULL,
  regular_periods INT DEFAULT 0,
  substitute_periods INT DEFAULT 0,
  max_allowed INT NOT NULL,
  -- مواطنة: 24 | وافدة: 30 | أجر يومي: 999
  is_at_capacity BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, week_start)
);

ALTER TABLE weekly_period_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "period_log_open" ON weekly_period_log FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────

-- 3. جدول نية الطالب التراكمية (ملف الطالب - كشف النية)
CREATE TABLE IF NOT EXISTS student_intent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  class_key VARCHAR(20) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(200),
  tab_exits INT DEFAULT 0,
  suspicious_timing_count INT DEFAULT 0,
  unanswered_questions INT DEFAULT 0,
  intent_score INT DEFAULT 100,
  -- يبدأ بـ 100 وينخفض عند كل حدث سلبي
  teacher_confirmed_flags INT DEFAULT 0,
  teacher_dismissed_flags INT DEFAULT 0,
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

ALTER TABLE student_intent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intent_log_open" ON student_intent_log FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────

-- 4. جدول حجز المرافق (المختبر والمكتبة)
-- يُستخدم للتحقق من تعارض الاحتياط مع حجوزات موظفي المختبر/المكتبة
CREATE TABLE IF NOT EXISTS facility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_type VARCHAR(20) NOT NULL,
  -- القيم: 'lab' | 'library'
  facility_name VARCHAR(100),
  booked_by_teacher_id VARCHAR(100) NOT NULL,
  booked_by_teacher_name VARCHAR(200),
  class_key VARCHAR(20),
  grade VARCHAR(10),
  section VARCHAR(5),
  booking_date DATE NOT NULL,
  period_number INT NOT NULL,
  purpose TEXT,
  status VARCHAR(20) DEFAULT 'confirmed',
  -- القيم: 'confirmed' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE facility_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facility_open" ON facility_bookings FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────

-- 5. فهارس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_sub_log_date ON substitute_log(session_date);
CREATE INDEX IF NOT EXISTS idx_sub_log_orig ON substitute_log(original_teacher_id);
CREATE INDEX IF NOT EXISTS idx_sub_log_sub ON substitute_log(substitute_teacher_id);
CREATE INDEX IF NOT EXISTS idx_period_log_teacher ON weekly_period_log(teacher_id, week_start);
CREATE INDEX IF NOT EXISTS idx_intent_log_session ON student_intent_log(session_id);
CREATE INDEX IF NOT EXISTS idx_intent_log_class ON student_intent_log(class_key);
CREATE INDEX IF NOT EXISTS idx_facility_date ON facility_bookings(booking_date, period_number);

-- ═══════════════════════════════════════════════════
-- انتهى Sprint G SQL — شغّليه في Supabase SQL Editor
-- ═══════════════════════════════════════════════════
