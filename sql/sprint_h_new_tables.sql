-- ============================================================
-- EduOS Sprint H — جداول المنظومات الجديدة (9 منظومات)
-- لا localStorage — كل البيانات تُحفظ هنا فقط
-- ============================================================

-- 1. التقويم الذكي (Calendar OS)
CREATE TABLE IF NOT EXISTS school_events (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  event_date   DATE NOT NULL,
  event_type   TEXT DEFAULT 'school', -- school | holiday | meeting | exam | activity | moe
  description  TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_school_events" ON school_events FOR ALL USING (true) WITH CHECK (true);

-- 2. Broadcasting OS
CREATE TABLE IF NOT EXISTS broadcasts (
  id             BIGSERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  broadcast_type TEXT DEFAULT 'all', -- all | teachers | parents | students
  priority       TEXT DEFAULT 'normal', -- normal | urgent | info
  channels       TEXT[] DEFAULT ARRAY['app'],
  is_sent        BOOLEAN DEFAULT FALSE,
  sent_at        TIMESTAMPTZ,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_broadcasts" ON broadcasts FOR ALL USING (true) WITH CHECK (true);

-- 3. المسؤول المالي (Finance OS)
CREATE TABLE IF NOT EXISTS budget_entries (
  id          BIGSERIAL PRIMARY KEY,
  category    TEXT NOT NULL, -- hospitality | reception | gifts | maintenance | internal_change | resources
  entry_type  TEXT NOT NULL, -- income | expense
  amount      NUMERIC(10,2) NOT NULL,
  entry_date  DATE NOT NULL,
  description TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_budget_entries" ON budget_entries FOR ALL USING (true) WITH CHECK (true);

-- 4. Library OS — الكتب
CREATE TABLE IF NOT EXISTS library_books (
  id               BIGSERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  author           TEXT,
  category         TEXT DEFAULT 'story', -- arabic | islamic | science | story | reference
  grade_level      TEXT DEFAULT 'all',
  total_copies     INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_library_books" ON library_books FOR ALL USING (true) WITH CHECK (true);

-- 5. Library OS — الإعارات
CREATE TABLE IF NOT EXISTS library_loans (
  id            BIGSERIAL PRIMARY KEY,
  book_id       BIGINT REFERENCES library_books(id) ON DELETE SET NULL,
  student_name  TEXT NOT NULL,
  class_name    TEXT,
  borrowed_date DATE DEFAULT CURRENT_DATE,
  due_date      DATE NOT NULL,
  returned_date DATE,
  status        TEXT DEFAULT 'borrowed', -- borrowed | returned | lost
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE library_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_library_loans" ON library_loans FOR ALL USING (true) WITH CHECK (true);

-- 6. Transportation OS
CREATE TABLE IF NOT EXISTS transport_routes (
  id               BIGSERIAL PRIMARY KEY,
  route_name       TEXT NOT NULL,
  bus_number       TEXT,
  driver_name      TEXT,
  driver_phone     TEXT,
  supervisor_name  TEXT,
  supervisor_phone TEXT,
  total_students   INTEGER DEFAULT 0,
  morning_time     TEXT,
  afternoon_time   TEXT,
  areas            TEXT[], -- المناطق المغطاة
  status           TEXT DEFAULT 'active', -- active | maintenance | cancelled
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_transport_routes" ON transport_routes FOR ALL USING (true) WITH CHECK (true);

-- 7. Nursing OS
CREATE TABLE IF NOT EXISTS nursing_visits (
  id               BIGSERIAL PRIMARY KEY,
  student_name     TEXT NOT NULL,
  class_name       TEXT,
  visit_date       DATE DEFAULT CURRENT_DATE,
  visit_time       TIME DEFAULT CURRENT_TIME,
  complaint        TEXT, -- headache | stomachache | injury | fever | allergy | fatigue | other
  action_taken     TEXT, -- treated | rest | sent_home | parent_called | first_aid
  is_special_needs BOOLEAN DEFAULT FALSE,
  parent_notified  BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE nursing_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_nursing_visits" ON nursing_visits FOR ALL USING (true) WITH CHECK (true);

-- 8. Cafeteria OS
CREATE TABLE IF NOT EXISTS cafeteria_items (
  id           BIGSERIAL PRIMARY KEY,
  item_name    TEXT NOT NULL,
  category     TEXT DEFAULT 'snack', -- meal | snack | drink | healthy | candy
  price        NUMERIC(6,2) NOT NULL,
  is_healthy   BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  day_of_week  TEXT[] DEFAULT ARRAY['sun','mon','tue','wed','thu'],
  calories     INTEGER,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cafeteria_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_cafeteria_items" ON cafeteria_items FOR ALL USING (true) WITH CHECK (true);

-- ─── بيانات أولية للعرض التجريبي ───────────────────────────

-- أحداث التقويم
INSERT INTO school_events (title, event_date, event_type, description) VALUES
  ('اليوم الوطني الإماراتي', '2026-12-02', 'holiday', 'عطلة رسمية'),
  ('اجتماع أولياء الأمور الأول', '2026-10-15', 'meeting', 'الساعة 6 مساءً في القاعة الكبرى'),
  ('تقييم منتصف الفصل — G3', '2026-11-03', 'exam', 'مادة اللغة العربية'),
  ('يوم القراءة العربي', '2026-04-20', 'activity', 'فعالية مدرسية شاملة')
ON CONFLICT DO NOTHING;

-- قائمة الكافيتيريا
INSERT INTO cafeteria_items (item_name, category, price, is_healthy) VALUES
  ('ساندويتش جبن وزعتر',    'snack',  3.00, true),
  ('عصير برتقال طازج',       'drink',  4.00, true),
  ('وجبة أرز ودجاج',         'meal',   8.00, true),
  ('عصب لبنة خضار',          'snack',  4.00, true),
  ('بسكويت شوكولاتة',        'candy',  2.00, false),
  ('ماء معدني',               'drink',  1.00, true),
  ('بيتزا صغيرة',             'snack',  5.00, false)
ON CONFLICT DO NOTHING;
