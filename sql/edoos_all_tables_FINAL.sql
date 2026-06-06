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

-- ════════════════════════════════════
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

-- ════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════
-- EduOS — نظام تبديل الحصص الذكي
-- يغطي 3 سيناريوهات: دائم / مؤقت بطلب / مؤقت من النائبة
-- تاريخ: يونيو 2026
-- ═══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- جدول 1: طلبات التبديل (الأساسي)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- النوع والوقت
  swap_type       TEXT NOT NULL CHECK (swap_type IN ('permanent', 'temporary')),
  swap_date       DATE,              -- للمؤقت: اليوم المحدد — للدائم: تاريخ التفعيل
  is_recurring    BOOLEAN DEFAULT FALSE, -- للدائم فقط

  -- من بدأ الطلب
  initiator_type  TEXT NOT NULL CHECK (initiator_type IN (
    'admin',          -- النائبة/المديرة تبدأ مباشرة
    'teacher_solo',   -- معلمة تطلب وحدها وتنتظر الموافقة
    'teacher_mutual'  -- اتفاق بين معلمتين ثم يُبلَّغ الإدارة
  )),
  requested_by    TEXT,  -- user_id من بدأ الطلب
  request_reason  TEXT,  -- السبب (إجازة / استئذان / ترتيب إداري / ...)

  -- المعلمة الأولى (أ) — تتنازل عن حصتها
  teacher_a_id    TEXT NOT NULL,
  teacher_a_name  TEXT NOT NULL,
  teacher_a_class TEXT NOT NULL,   -- مثال: 3أ
  teacher_a_period INTEGER NOT NULL, -- رقم الحصة
  teacher_a_subject TEXT,
  teacher_a_day   TEXT,            -- للدائم: السبت / الأحد ...

  -- المعلمة الثانية (ب) — تأخذ حصة أ (وفي حال التبديل المتبادل تتنازل هي أيضاً)
  teacher_b_id    TEXT NOT NULL,
  teacher_b_name  TEXT NOT NULL,
  teacher_b_class TEXT,            -- فارغ إذا لم يكن تبديلاً متبادلاً
  teacher_b_period INTEGER,        -- فارغ إذا لم يكن تبديلاً متبادلاً
  teacher_b_subject TEXT,
  teacher_b_day   TEXT,

  -- هل التبديل متبادل (كلتاهما تأخذ حصة الأخرى) أم أحادي (ب فقط تغطي أ)
  is_mutual       BOOLEAN DEFAULT TRUE,

  -- موافقة النائبة
  status          TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- ينتظر موافقة النائبة
    'approved',   -- مقبول
    'rejected',   -- مرفوض
    'cancelled',  -- ملغى
    'completed'   -- منفَّذ (للمؤقت بعد انتهاء اليوم)
  )),
  reviewed_by     TEXT,  -- user_id النائبة/المديرة
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,  -- ملاحظة الرفض إن وجدت

  -- موافقة المعلمة ب (في حال بدأت أ الطلب)
  teacher_b_approval TEXT DEFAULT 'pending' CHECK (teacher_b_approval IN ('pending','accepted','rejected')),
  teacher_b_responded_at TIMESTAMPTZ,

  -- توثيق
  school_id       TEXT DEFAULT 'aljood',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- جدول 2: الجدول المؤقت اليومي (overlay)
-- عند الموافقة على تبديل مؤقت يُنشأ سجل هنا — لا يُعدَّل الجدول الأساسي
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS temporary_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES schedule_swaps(id) ON DELETE CASCADE,

  override_date   DATE NOT NULL,
  class_key       TEXT NOT NULL,    -- مثال: 3أ
  period_number   INTEGER NOT NULL,

  -- من سيُدرَّس فعلياً في هذه الحصة هذا اليوم
  actual_teacher_id   TEXT NOT NULL,
  actual_teacher_name TEXT NOT NULL,
  actual_subject      TEXT,

  -- من كان المقرر أصلاً (من الجدول الأساسي)
  original_teacher_id   TEXT NOT NULL,
  original_teacher_name TEXT NOT NULL,

  reason          TEXT,
  swap_type_label TEXT, -- 'تبديل مؤقت' / 'استئذان' / 'ترتيب إداري'

  school_id       TEXT DEFAULT 'aljood',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- جدول 3: تاريخ التبديلات الدائمة (audit trail)
-- عند الموافقة على دائم يُسجَّل هنا قبل تعديل الجدول الأساسي
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permanent_swap_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES schedule_swaps(id) ON DELETE SET NULL,

  effective_date  DATE NOT NULL,
  class_key       TEXT NOT NULL,
  period_number   INTEGER NOT NULL,
  day_of_week     TEXT,

  previous_teacher_id   TEXT,
  previous_teacher_name TEXT,
  new_teacher_id        TEXT,
  new_teacher_name      TEXT,

  changed_by      TEXT,  -- user_id النائبة
  reason          TEXT,

  school_id       TEXT DEFAULT 'aljood',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_swaps_date    ON schedule_swaps(swap_date);
CREATE INDEX IF NOT EXISTS idx_swaps_status  ON schedule_swaps(status);
CREATE INDEX IF NOT EXISTS idx_swaps_type    ON schedule_swaps(swap_type);
CREATE INDEX IF NOT EXISTS idx_swaps_teacher_a ON schedule_swaps(teacher_a_id);
CREATE INDEX IF NOT EXISTS idx_swaps_teacher_b ON schedule_swaps(teacher_b_id);
CREATE INDEX IF NOT EXISTS idx_overrides_date  ON temporary_schedule_overrides(override_date);
CREATE INDEX IF NOT EXISTS idx_overrides_class ON temporary_schedule_overrides(class_key);

-- ────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────
ALTER TABLE schedule_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE permanent_swap_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_swaps"     ON schedule_swaps                USING (true) WITH CHECK (true);
CREATE POLICY "open_overrides" ON temporary_schedule_overrides  USING (true) WITH CHECK (true);
CREATE POLICY "open_perm_log"  ON permanent_swap_log            USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════
-- جداول نتائج الأسابيع 5 و 8 (كانت في Firebase — تنقل لـ Supabase)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lesson_results_w5 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  grade TEXT,
  cls TEXT,
  date TEXT,
  diag INT DEFAULT 0,
  act INT DEFAULT 0,
  ws INT DEFAULT 0,
  exit_score INT DEFAULT 0,
  total INT DEFAULT 0,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lesson_results_w5 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_w5" ON lesson_results_w5 FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_w5_grade ON lesson_results_w5(grade);
CREATE INDEX IF NOT EXISTS idx_w5_created ON lesson_results_w5(created_at);

CREATE TABLE IF NOT EXISTS lesson_results_w8 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  grade TEXT,
  class_id TEXT,
  date TEXT,
  diag INT DEFAULT 0,
  act INT DEFAULT 0,
  ws INT DEFAULT 0,
  exit_score INT DEFAULT 0,
  total INT DEFAULT 0,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lesson_results_w8 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_w8" ON lesson_results_w8 FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_w8_grade ON lesson_results_w8(grade);
CREATE INDEX IF NOT EXISTS idx_w8_created ON lesson_results_w8(created_at);

