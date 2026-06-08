-- ═══════════════════════════════════════════════════════════════
-- EduOS — نظام الحضور الذكي (Smart Attendance System)
-- الجود للتعليم — v1.0
-- ═══════════════════════════════════════════════════════════════

-- 1. QR Gate Log — كل QR عُرض على شاشة البوابة
CREATE TABLE IF NOT EXISTS attendance_qr_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code       TEXT NOT NULL UNIQUE,
  qr_sequence   BIGINT NOT NULL,
  valid_from    TIMESTAMPTZ NOT NULL,
  valid_until   TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  date          DATE DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS idx_qr_seq ON attendance_qr_log(qr_sequence);
CREATE INDEX IF NOT EXISTS idx_qr_date ON attendance_qr_log(date);

-- 2. Staff Check-in Log — كل عملية مسح QR من الموظفة
CREATE TABLE IF NOT EXISTS staff_checkin_log (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id            TEXT NOT NULL,
  staff_name          TEXT,
  qr_code             TEXT NOT NULL,
  qr_sequence         BIGINT,
  scanned_at          TIMESTAMPTZ DEFAULT now(),
  device_fingerprint  TEXT,
  gps_lat             NUMERIC(10,7),
  gps_lng             NUMERIC(10,7),
  gps_accuracy        NUMERIC,
  within_geofence     BOOLEAN DEFAULT false,
  date                DATE DEFAULT CURRENT_DATE,
  status              TEXT DEFAULT 'pending',  -- valid | late | suspicious | invalid
  anomaly_flags       JSONB DEFAULT '[]'::jsonb,
  qr_time_delta_sec   INTEGER   -- الفرق بالثواني بين وقت المسح ووقت عرض QR
);
CREATE INDEX IF NOT EXISTS idx_checkin_staff ON staff_checkin_log(staff_id, date);

-- 3. Staff Daily Attendance — السجل النهائي اليومي
CREATE TABLE IF NOT EXISTS staff_daily_attendance (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id                 TEXT NOT NULL,
  staff_name               TEXT,
  date                     DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_time             TIMESTAMPTZ,
  checkout_time            TIMESTAMPTZ,
  status                   TEXT DEFAULT 'absent',  -- present | late | absent | on_leave | suspicious
  is_online                BOOLEAN DEFAULT false,
  last_activity            TIMESTAMPTZ,
  edoos_first_login        TIMESTAMPTZ,
  session_duration_minutes INTEGER DEFAULT 0,
  anomaly_score            INTEGER DEFAULT 0,      -- 0-100: درجة الشك
  anomaly_details          JSONB DEFAULT '[]'::jsonb,
  ai_analysis              TEXT,
  UNIQUE(staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_date ON staff_daily_attendance(date);
CREATE INDEX IF NOT EXISTS idx_daily_staff ON staff_daily_attendance(staff_id);

-- 4. Staff Device Registry — الأجهزة المسجّلة لكل موظف
CREATE TABLE IF NOT EXISTS staff_device_registry (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id            TEXT NOT NULL,
  device_fingerprint  TEXT NOT NULL,
  device_label        TEXT,    -- مثل: "iPhone منيرة"
  registered_at       TIMESTAMPTZ DEFAULT now(),
  registered_by       TEXT DEFAULT 'self',  -- self | admin
  last_used           TIMESTAMPTZ,
  is_active           BOOLEAN DEFAULT true,
  UNIQUE(staff_id, device_fingerprint)
);

-- ═══════════════ RLS ═══════════════
ALTER TABLE attendance_qr_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_checkin_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_device_registry  ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بالقراءة والكتابة (نظام داخلي مؤمَّن بالكود)
CREATE POLICY "anon_all_qr"      ON attendance_qr_log      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_checkin" ON staff_checkin_log      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_daily"   ON staff_daily_attendance FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_device"  ON staff_device_registry  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ═══════════════ إعدادات المدرسة في app_settings ═══════════════
-- تشغيل هذا بعد إنشاء الجداول:
INSERT INTO app_settings (key, value) VALUES
  ('school_gps_lat',  '24.4539'),
  ('school_gps_lng',  '54.3773'),
  ('geofence_radius', '150'),
  ('qr_interval_sec', '60'),
  ('attendance_start', '06:30'),
  ('attendance_end',  '08:00')
ON CONFLICT (key) DO NOTHING;
