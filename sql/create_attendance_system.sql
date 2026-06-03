-- ═══════════════════════════════════════════════════════════════
-- منظومة الحضور والاحتياط وتبديل الحصص — EduOS Sprint G v2
-- ═══════════════════════════════════════════════════════════════

-- 1. حضور الموظفات اليومي
CREATE TABLE IF NOT EXISTS staff_attendance (
  id BIGSERIAL PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_role TEXT DEFAULT 'teacher',
  check_in_time TIMESTAMPTZ,
  status TEXT DEFAULT 'absent' CHECK (status IN ('on_time','late','absent','excused')),
  absence_reason TEXT,  -- sick, emergency, annual_leave, other
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by TEXT DEFAULT 'system', -- system | manager_id
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- 2. تكليفات الاحتياط
CREATE TABLE IF NOT EXISTS substitute_assignments (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 8),
  period_time TEXT, -- مثال: "07:20 - 08:00"
  absent_teacher_id TEXT NOT NULL,
  absent_teacher_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT,
  substitute_teacher_id TEXT,
  substitute_teacher_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','notified','acknowledged','declined','reassigned','covered','cancelled')),
  absence_reason TEXT,
  auto_generated BOOLEAN DEFAULT TRUE,
  created_by TEXT DEFAULT 'system',
  acknowledged_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  covered_at TIMESTAMPTZ,
  notification_sent_at TIMESTAMPTZ,
  notes TEXT,
  -- نصاب المعلمة البديلة هذا الأسبوع (يُحسب لحظياً)
  substitute_weekly_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. سجل تبديل الحصص
CREATE TABLE IF NOT EXISTS period_swaps (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- المعلمة الطالبة
  requester_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_period INT NOT NULL CHECK (requester_period BETWEEN 1 AND 8),
  requester_class TEXT NOT NULL,
  requester_subject TEXT,
  -- المعلمة المُبدَّل معها
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_period INT NOT NULL CHECK (recipient_period BETWEEN 1 AND 8),
  recipient_class TEXT NOT NULL,
  recipient_subject TEXT,
  -- الحالة
  status TEXT DEFAULT 'pending_recipient' CHECK (status IN (
    'pending_recipient','recipient_accepted','recipient_declined',
    'pending_approval','approved','rejected','cancelled'
  )),
  -- القرارات
  recipient_responded_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  -- فحص الشروط
  condition_same_class BOOLEAN DEFAULT FALSE,
  condition_no_conflict BOOLEAN DEFAULT FALSE,
  condition_workload_ok BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. الإشعارات داخل التطبيق
CREATE TABLE IF NOT EXISTS staff_notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('substitute','swap','reminder','alert','info')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent','normal','low')),
  is_read BOOLEAN DEFAULT FALSE,
  action_required BOOLEAN DEFAULT FALSE,
  action_type TEXT CHECK (action_type IN ('acknowledge','approve_swap','respond_swap', NULL)),
  action_taken TEXT, -- acknowledged | declined | approved | rejected
  action_taken_at TIMESTAMPTZ,
  reference_id BIGINT,
  reference_table TEXT,
  deep_link TEXT, -- رابط مباشر للصفحة
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. سجل الإشعارات الخارجية (Telegram/SMS)
CREATE TABLE IF NOT EXISTS notification_log (
  id BIGSERIAL PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app','telegram','sms','email')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','failed','pending')),
  reference_id BIGINT,
  reference_table TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

-- 6. جدول حصص المعلمات (الجدول الأسبوعي الرسمي)
CREATE TABLE IF NOT EXISTS teacher_schedule (
  id BIGSERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 4), -- 0=أحد...4=خميس
  period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 8),
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  room TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  academic_year TEXT DEFAULT '2025-2026',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, day_of_week, period_number, academic_year)
);

-- 7. قيود الجدول الخاصة لكل معلمة
CREATE TABLE IF NOT EXISTS teacher_schedule_constraints (
  id BIGSERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  constraint_type TEXT NOT NULL CHECK (constraint_type IN (
    'breastfeeding',     -- ساعتا رضاعة
    'medical_report',    -- تقرير طبي
    'no_last_period',    -- لا حصص أخيرة
    'max_consecutive',   -- حد أقصى للحصص المتتالية
    'break_required',    -- فترة راحة بعد X حصص
    'late_start',        -- لا حصص في الفترة الأولى
    'early_end'          -- تنتهي قبل وقت معين
  )),
  -- بيانات الرضاعة
  breastfeeding_start DATE,
  breastfeeding_end DATE,    -- تاريخ الولادة + 6 أشهر
  breastfeeding_hours INT DEFAULT 2, -- عدد ساعات الرضاعة
  -- القيود الزمنية
  no_periods_after TEXT,     -- مثال: "12:00" أو "13:00"
  max_consecutive_periods INT DEFAULT 4,
  break_after_periods INT DEFAULT 3,
  -- التقرير الطبي
  medical_report_file TEXT,
  medical_report_expiry DATE,
  medical_notes TEXT,
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_sub_assignments_date ON substitute_assignments(date);
CREATE INDEX IF NOT EXISTS idx_sub_assignments_status ON substitute_assignments(status);
CREATE INDEX IF NOT EXISTS idx_period_swaps_date ON period_swaps(date);
CREATE INDEX IF NOT EXISTS idx_period_swaps_status ON period_swaps(status);
CREATE INDEX IF NOT EXISTS idx_staff_notif_recipient ON staff_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_staff_notif_unread ON staff_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_teacher_schedule_teacher ON teacher_schedule(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedule_day ON teacher_schedule(day_of_week, period_number);

-- ── RLS Policies ──
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_attendance_open" ON staff_attendance FOR ALL USING (true);

ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "substitute_assignments_open" ON substitute_assignments FOR ALL USING (true);

ALTER TABLE period_swaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "period_swaps_open" ON period_swaps FOR ALL USING (true);

ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_notifications_open" ON staff_notifications FOR ALL USING (true);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_log_open" ON notification_log FOR ALL USING (true);

ALTER TABLE teacher_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_schedule_open" ON teacher_schedule FOR ALL USING (true);

ALTER TABLE teacher_schedule_constraints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_schedule_constraints_open" ON teacher_schedule_constraints FOR ALL USING (true);

-- ── إضافة telegram_chat_id لجدول staff_profiles ──
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS nationality TEXT CHECK (nationality IN ('uae','expat')); -- مواطنة 24 | وافدة 30
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS weekly_max_periods INT DEFAULT 30;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS is_lab_staff BOOLEAN DEFAULT FALSE;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS is_library_staff BOOLEAN DEFAULT FALSE;

-- ── إعدادات Telegram Bot ──
INSERT INTO app_settings (key, value) VALUES
  ('telegram_bot_token', ''),
  ('telegram_channel_id', ''),
  ('attendance_cutoff_time', '07:10'),
  ('substitute_generate_time', '07:15'),
  ('school_periods', '[
    {"number":1,"start":"07:20","end":"08:00"},
    {"number":2,"start":"08:00","end":"08:40"},
    {"number":3,"start":"08:40","end":"09:20"},
    {"number":4,"start":"09:35","end":"10:15"},
    {"number":5,"start":"10:15","end":"10:55"},
    {"number":6,"start":"10:55","end":"11:35"},
    {"number":7,"start":"11:50","end":"12:30"},
    {"number":8,"start":"12:30","end":"13:10"}
  ]')
ON CONFLICT (key) DO NOTHING;
