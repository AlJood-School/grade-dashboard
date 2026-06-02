-- ============================================================
-- جدول staff_profiles — بيانات المعلمات والموظفين
-- بوابة الجود — EduOS
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_profiles (
  id                      UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id                TEXT    NOT NULL UNIQUE,       -- AJ001, AJ002...
  name_ar                 TEXT    NOT NULL,
  name_en                 TEXT,
  employee_number         TEXT,                          -- الرقم الوظيفي الرسمي
  email                   TEXT,
  phone                   TEXT,
  role_title_ar           TEXT,                          -- معلمة / أخصائية / إدارية...
  role_key                TEXT,                          -- teacher / specialist / admin...
  subject_ar              TEXT,                          -- المادة التي تدرسها (للمعلمات)
  grades_taught           TEXT,                          -- "الصفوف 3-4" أو "KG"
  years_experience        INTEGER DEFAULT 0,
  school_id               TEXT DEFAULT 'aljood',
  is_online               BOOLEAN DEFAULT false,         -- يُحدَّث عند دخول/خروج من المنصة
  last_seen               TIMESTAMPTZ,
  last_performance_review TEXT,                          -- ممتاز / جيد جداً / جيد
  review_year             TEXT,                          -- "2024-2025"
  is_active               BOOLEAN DEFAULT true,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_staff_profiles_school    ON staff_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_online    ON staff_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_id  ON staff_profiles(staff_id);

-- RLS
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_profiles_read"   ON staff_profiles FOR SELECT USING (true);
CREATE POLICY "staff_profiles_update" ON staff_profiles FOR UPDATE USING (true);

-- Trigger: تحديث updated_at
CREATE TRIGGER trg_staff_profiles_updated
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- جدول staff_attendance — حضور الموظفين اليومي
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_attendance (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id   TEXT    NOT NULL REFERENCES staff_profiles(staff_id) ON DELETE CASCADE,
  school_id  TEXT    DEFAULT 'aljood',
  date       DATE    NOT NULL DEFAULT CURRENT_DATE,
  status     TEXT    NOT NULL DEFAULT 'present',   -- present / absent / late / excused
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_staff_attend_date     ON staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_staff_attend_staff_id ON staff_attendance(staff_id);

ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_attend_all" ON staff_attendance FOR ALL USING (true);
