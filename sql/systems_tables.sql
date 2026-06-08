-- ============================================================
-- EduOS — جداول المنظومات الشاملة
-- يُشغَّل في Supabase SQL Editor
-- ============================================================

-- ─── 1. نظام الأمن — التفويضات ─────────────────────────────
CREATE TABLE IF NOT EXISTS security_authorized_pickups (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  authorized_name TEXT NOT NULL,       -- اسم الشخص المفوّض
  id_number      TEXT NOT NULL,        -- رقم هويته
  relation       TEXT DEFAULT 'ولي أمر',  -- ولي أمر | أخ/أخت | قريب | سائق
  phone          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  notes          TEXT,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE security_authorized_pickups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_security_auth" ON security_authorized_pickups FOR ALL USING (true) WITH CHECK (true);

-- ─── 2. نظام التمريض — الزيارات ────────────────────────────
CREATE TABLE IF NOT EXISTS nurse_visits (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  grade_level    TEXT,
  visit_date     DATE DEFAULT CURRENT_DATE,
  visit_time     TIME DEFAULT CURRENT_TIME,
  symptoms       TEXT,
  action_taken   TEXT,     -- راحة | علاج | اتصال ولي | إرسال للمنزل | نقل للمستشفى | أخرى
  outcome        TEXT DEFAULT 'راحة',
  medicine_given TEXT,
  notes          TEXT,
  nurse_name     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE nurse_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_nurse_visits" ON nurse_visits FOR ALL USING (true) WITH CHECK (true);

-- ─── 3. نظام التمريض — الحساسيات والأدوية ──────────────────
CREATE TABLE IF NOT EXISTS student_health_records (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  allergies      TEXT,          -- قائمة الحساسيات
  chronic_conditions TEXT,      -- الأمراض المزمنة
  medications    TEXT,          -- الأدوية المنتظمة
  emergency_contact TEXT,       -- رقم الطوارئ
  blood_type     TEXT,
  notes          TEXT,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE student_health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_health_records" ON student_health_records FOR ALL USING (true) WITH CHECK (true);

-- ─── 4. نظام الصيانة — طلبات الصيانة ──────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT NOT NULL,
  location       TEXT NOT NULL,    -- القاعة | المرفق | الدور
  category       TEXT DEFAULT 'كهرباء',  -- كهرباء | سباكة | نجارة | تكييف | أخرى
  priority       TEXT DEFAULT 'عادي',    -- عاجل | عالي | عادي | منخفض
  status         TEXT DEFAULT 'مفتوح',   -- مفتوح | قيد التنفيذ | مكتمل | مؤجل
  description    TEXT,
  reported_by    TEXT,
  assigned_to    TEXT,
  estimated_hours NUMERIC(5,1),
  completed_at   TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_maintenance" ON maintenance_requests FOR ALL USING (true) WITH CHECK (true);

-- ─── 5. نظام النقل — الباصات والطلبات ─────────────────────
CREATE TABLE IF NOT EXISTS transport_routes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_name     TEXT NOT NULL,    -- خط شمال | خط جنوب | خط مركز
  driver_name    TEXT,
  bus_number     TEXT,
  capacity       INTEGER DEFAULT 40,
  current_count  INTEGER DEFAULT 0,
  status         TEXT DEFAULT 'نشط',  -- نشط | متوقف | تأخر
  departure_time TIME,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_transport" ON transport_routes FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS transport_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  route_id       UUID REFERENCES transport_routes(id),
  request_type   TEXT DEFAULT 'اشتراك',  -- اشتراك | إلغاء | تغيير خط | طارئ
  status         TEXT DEFAULT 'معلق',    -- معلق | موافق | مرفوض | منجز
  notes          TEXT,
  requested_by   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_transport_req" ON transport_requests FOR ALL USING (true) WITH CHECK (true);

-- ─── 6. نظام المقصف — المعاملات ────────────────────────────
CREATE TABLE IF NOT EXISTS cafeteria_transactions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT,
  staff_name     TEXT,
  item_name      TEXT NOT NULL,
  quantity       INTEGER DEFAULT 1,
  unit_price     NUMERIC(6,2) NOT NULL,
  total_price    NUMERIC(8,2) NOT NULL,
  payment_method TEXT DEFAULT 'نقد',   -- نقد | بطاقة | رصيد
  transaction_date DATE DEFAULT CURRENT_DATE,
  transaction_time TIME DEFAULT CURRENT_TIME,
  cashier_name   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cafeteria_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_cafeteria" ON cafeteria_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cafeteria_menu (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT DEFAULT 'وجبة رئيسية',  -- وجبة رئيسية | مشروب | وجبة خفيفة | حلوى
  price          NUMERIC(6,2) NOT NULL,
  is_available   BOOLEAN DEFAULT TRUE,
  calories       INTEGER,
  is_healthy     BOOLEAN DEFAULT FALSE,
  image_emoji    TEXT DEFAULT '🍽️',
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cafeteria_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_cafeteria_menu" ON cafeteria_menu FOR ALL USING (true) WITH CHECK (true);

-- ─── 7. نظام الشؤون المالية ────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_records (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type           TEXT NOT NULL,   -- إيراد | مصروف
  category       TEXT NOT NULL,   -- مقصف | صيانة | رواتب | أنشطة | مستلزمات | أخرى
  amount         NUMERIC(10,2) NOT NULL,
  description    TEXT,
  reference_no   TEXT,
  payment_method TEXT DEFAULT 'تحويل بنكي',
  date           DATE DEFAULT CURRENT_DATE,
  approved_by    TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_financial" ON financial_records FOR ALL USING (true) WITH CHECK (true);

-- ─── 8. نظام الأخصائية الاجتماعية — الحالات ───────────────
CREATE TABLE IF NOT EXISTS social_cases (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  case_type      TEXT NOT NULL,   -- سلوكي | أسري | أكاديمي | عاطفي | اجتماعي
  priority       TEXT DEFAULT 'متوسط',  -- عاجل | عالي | متوسط | منخفض
  status         TEXT DEFAULT 'مفتوح',  -- مفتوح | قيد المتابعة | مغلق | محوَّل
  description    TEXT,
  interventions  TEXT,    -- الإجراءات المتخذة
  parent_contacted BOOLEAN DEFAULT FALSE,
  next_followup  DATE,
  closed_at      TIMESTAMPTZ,
  worker_name    TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE social_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_social" ON social_cases FOR ALL USING (true) WITH CHECK (true);

-- ─── 9. نظام الدمج والتعليم الخاص ─────────────────────────
CREATE TABLE IF NOT EXISTS inclusion_plans (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  disability_type TEXT,   -- صعوبات تعلم | تأخر نمائي | توحد | إعاقة حركية | أخرى
  support_level   TEXT DEFAULT 'متوسط',  -- بسيط | متوسط | مكثف
  plan_goals     TEXT,
  accommodations TEXT,   -- التسهيلات المطلوبة
  progress_notes TEXT,
  next_review    DATE,
  specialist_name TEXT,
  status         TEXT DEFAULT 'نشط',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inclusion_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_inclusion" ON inclusion_plans FOR ALL USING (true) WITH CHECK (true);

-- ─── 10. جدول الاختبارات ───────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_schedule (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_name      TEXT NOT NULL,
  subject        TEXT NOT NULL,
  grade_level    TEXT NOT NULL,  -- G3 | G4 | KG1 | KG2 | الكل
  class_name     TEXT,
  exam_date      DATE NOT NULL,
  start_time     TIME,
  duration_min   INTEGER DEFAULT 60,
  location       TEXT DEFAULT 'القاعة الرئيسية',
  supervisor     TEXT,
  exam_type      TEXT DEFAULT 'نهائي',  -- نهائي | منتصف | مستمر | دخول
  max_score      NUMERIC(5,2) DEFAULT 100,
  notes          TEXT,
  status         TEXT DEFAULT 'مجدول',  -- مجدول | جارٍ | منتهٍ | ملغى
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE exam_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_exam_schedule" ON exam_schedule FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS exam_results (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id        UUID REFERENCES exam_schedule(id) ON DELETE CASCADE,
  student_name   TEXT NOT NULL,
  class_name     TEXT,
  score          NUMERIC(5,2),
  grade_letter   TEXT,
  is_absent      BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_name)
);
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_exam_results" ON exam_results FOR ALL USING (true) WITH CHECK (true);

-- ─── 11. جدول مداخل البوابة ────────────────────────────────
CREATE TABLE IF NOT EXISTS gate_entry_log (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name    TEXT NOT NULL,
  person_type    TEXT NOT NULL,  -- طالبة | موظفة | زائر | مورد
  id_number      TEXT,
  badge_number   TEXT,
  entry_time     TIMESTAMPTZ DEFAULT NOW(),
  exit_time      TIMESTAMPTZ,
  purpose        TEXT DEFAULT 'دوام',
  authorized_by  TEXT,
  vehicle_plate  TEXT,
  notes          TEXT
);
ALTER TABLE gate_entry_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_gate_entry" ON gate_entry_log FOR ALL USING (true) WITH CHECK (true);

-- ─── 12. جدول مناوبات الواجب ───────────────────────────────
CREATE TABLE IF NOT EXISTS duty_schedule (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_name     TEXT NOT NULL,
  duty_date      DATE NOT NULL,
  duty_type      TEXT NOT NULL,  -- صباحي | فسحة | مساء | بوابة | ممر | مقصف
  location       TEXT,
  start_time     TIME,
  end_time       TIME,
  week_number    INTEGER,
  academic_year  TEXT DEFAULT '2025-2026',
  is_completed   BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_name, duty_date, duty_type)
);
ALTER TABLE duty_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_duty_schedule" ON duty_schedule FOR ALL USING (true) WITH CHECK (true);

-- ─── 13. جدول درجات الدرجات ────────────────────────────────
CREATE TABLE IF NOT EXISTS grade_assessment_defs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'exam',
  max_score     NUMERIC(5,2) NOT NULL DEFAULT 100,
  weight        NUMERIC(5,2) NOT NULL DEFAULT 100,
  semester      INTEGER NOT NULL DEFAULT 1,
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  subject       TEXT NOT NULL DEFAULT 'CCDI',
  teacher_id    TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE grade_assessment_defs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_grade_assessment_defs"
  ON grade_assessment_defs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS grade_records (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT NOT NULL,
  grade_level    TEXT,
  assessment_id  UUID REFERENCES grade_assessment_defs(id) ON DELETE CASCADE,
  score          NUMERIC(5,2),
  semester       INTEGER NOT NULL DEFAULT 1,
  academic_year  TEXT NOT NULL DEFAULT '2025-2026',
  subject        TEXT NOT NULL DEFAULT 'CCDI',
  teacher_id     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_name, class_name, assessment_id)
);
ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_grade_records"
  ON grade_records FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS student_semester_summary (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name   TEXT NOT NULL,
  class_name     TEXT NOT NULL,
  grade_level    TEXT,
  semester       INTEGER NOT NULL,
  academic_year  TEXT NOT NULL,
  subject        TEXT NOT NULL DEFAULT 'CCDI',
  final_average  NUMERIC(5,2),
  grade_letter   TEXT,
  teacher_id     TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_name, class_name, academic_year, semester, subject)
);
ALTER TABLE student_semester_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_student_semester_summary"
  ON student_semester_summary FOR ALL USING (true) WITH CHECK (true);

-- ─── بيانات أولية — assessment defs ───────────────────────
INSERT INTO grade_assessment_defs (name, type, max_score, weight, semester, academic_year, subject, sort_order)
VALUES
  ('مشروع الوحدة', 'project', 100, 60, 1, '2025-2026', 'CCDI', 1),
  ('اختبار 1',     'exam',    100, 40, 1, '2025-2026', 'CCDI', 2),
  ('واجب',         'hw',      100,  0, 1, '2025-2026', 'CCDI', 3)
ON CONFLICT DO NOTHING;

-- ─── بيانات أولية — قائمة المقصف ──────────────────────────
INSERT INTO cafeteria_menu (name, category, price, is_healthy, image_emoji, sort_order) VALUES
  ('شاورما دجاج',     'وجبة رئيسية', 8.00, false, '🌯', 1),
  ('سلطة خضراء',      'وجبة رئيسية', 5.00, true,  '🥗', 2),
  ('عصير طازج',       'مشروب',       4.00, true,  '🥤', 3),
  ('ماء معدني',       'مشروب',       1.00, true,  '💧', 4),
  ('تفاحة',           'وجبة خفيفة',  2.00, true,  '🍎', 5),
  ('كيك',             'حلوى',        3.00, false, '🧁', 6),
  ('ساندويش جبنة',    'وجبة خفيفة',  4.50, false, '🥪', 7),
  ('يوغرت بالفواكه',  'وجبة خفيفة',  3.50, true,  '🍓', 8)
ON CONFLICT DO NOTHING;

-- ─── بيانات أولية — خطوط النقل ────────────────────────────
INSERT INTO transport_routes (route_name, driver_name, bus_number, capacity, status, departure_time) VALUES
  ('خط الشمال',   'محمد العامري',  'B-101', 45, 'نشط',    '14:00'),
  ('خط الجنوب',   'علي الزهراني',  'B-102', 40, 'نشط',    '14:05'),
  ('خط الشرق',    'خالد المنصوري', 'B-103', 45, 'نشط',    '14:10'),
  ('خط المركز',   'سعيد الحارثي',  'B-104', 50, 'تأخر',   '14:15'),
  ('خط الغرب',    'عمر الشهري',    'B-105', 40, 'نشط',    '14:20')
ON CONFLICT DO NOTHING;

-- ─── بيانات أولية — جدول الواجب الأسبوعي ─────────────────
-- (سيتم الإدخال من خلال Duty OS لاحقاً)

-- ─── ملاحظة ────────────────────────────────────────────────
-- هذا الملف يُشغَّل مرة واحدة في Supabase SQL Editor
-- كل الجداول تستخدم IF NOT EXISTS للأمان
-- ============================================================
