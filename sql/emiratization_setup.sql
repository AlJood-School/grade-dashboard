-- ═══════════════════════════════════════════════════════════════
-- EduOS — Emiratization Module SQL Setup
-- المرحلة 1: إضافة حقول التوطين
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1) إضافة حقول التوطين إلى staff_profiles
-- ──────────────────────────────────────────────────────────────
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS is_emirati            boolean DEFAULT false;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS nafis_registered       boolean DEFAULT false;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS nafis_id               text;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS covers_national_edu    boolean DEFAULT false;  -- التربية الوطنية / الاجتماعيات
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS covers_kg              boolean DEFAULT false;  -- رياض الأطفال
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS covers_sen             boolean DEFAULT false;  -- ذوو الاحتياجات الخاصة
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS training_hours_ytd     integer DEFAULT 0;     -- ساعات تدريب هذا العام
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS nafis_subsidy_amount   numeric DEFAULT 0;     -- مبلغ الدعم الشهري
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS subject_specialization text;                  -- التخصص الدراسي
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS department             text;                  -- القسم / الدائرة
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS employment_start_date  date;                  -- تاريخ التعيين

-- ──────────────────────────────────────────────────────────────
-- 2) جدول طلبات التوطين الموجهة لـ ADEK
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emiratization_requests (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_date      date DEFAULT CURRENT_DATE,
  academic_year     text DEFAULT '2025-2026',
  request_type      text CHECK (request_type IN ('new_hire','training','nafis','equipment')),
  positions_needed  integer DEFAULT 1,
  department        text,
  subject           text,
  priority          text DEFAULT 'medium' CHECK (priority IN ('urgent','high','medium','low')),
  notes             text,
  status            text DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged','fulfilled')),
  submitted_at      timestamptz,
  response_notes    text,
  created_by        text,  -- اسم المدير
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE emiratization_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emirati_req_read"  ON emiratization_requests FOR SELECT USING (true);
CREATE POLICY "emirati_req_write" ON emiratization_requests FOR ALL   USING (true);

-- ──────────────────────────────────────────────────────────────
-- 3) جدول الأنشطة الوطنية
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS national_activities (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_name      text NOT NULL,
  activity_name_en   text,
  activity_date      date NOT NULL,
  activity_type      text CHECK (activity_type IN ('national_day','cultural','language','sports','religious','community')),
  participants_count integer DEFAULT 0,
  emirati_led        boolean DEFAULT false,
  grade_levels       text,  -- 'KG,G1,G2' أو 'All'
  notes              text,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE national_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nat_act_read"  ON national_activities FOR SELECT USING (true);
CREATE POLICY "nat_act_write" ON national_activities FOR ALL   USING (true);

-- ──────────────────────────────────────────────────────────────
-- 4) إدراج الأنشطة الوطنية القادمة 2026-2027
-- ──────────────────────────────────────────────────────────────
INSERT INTO national_activities (activity_name, activity_name_en, activity_date, activity_type, emirati_led, grade_levels) VALUES
  ('يوم اللغة العربية العالمي',    'World Arabic Language Day',     '2026-12-18', 'language',    true,  'All'),
  ('يوم الشهيد',                   'Commemoration Day',             '2026-11-30', 'national_day',true,  'All'),
  ('اليوم الوطني الـ55',            'National Day 55',               '2026-12-02', 'national_day',true,  'All'),
  ('يوم المرأة الإماراتية',         'Emirati Women''s Day',          '2026-08-28', 'cultural',    true,  'All'),
  ('يوم المعلم',                    'Teachers'' Day',                '2026-09-05', 'cultural',    false, 'All'),
  ('أسبوع القراءة الوطني',          'National Reading Week',         '2026-04-17', 'language',    false, 'All'),
  ('يوم التسامح',                   'Tolerance Day',                 '2026-11-16', 'cultural',    false, 'All'),
  ('مسابقة الفصاحة للعربية',        'Arabic Eloquence Competition',  '2027-01-15', 'language',    true,  'G7,G8,G9,G10,G11,G12')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 5) إعدادات التوطين في app_settings
-- ──────────────────────────────────────────────────────────────
INSERT INTO app_settings (key, value, description) VALUES
  ('emiratization_target_pct',      '30',    'النسبة المستهدفة للتوطين في الكادر التعليمي (%)'),
  ('nafis_subsidy_standard',        '5000',  'دعم Nafis القياسي بالدرهم شهرياً'),
  ('nafis_subsidy_premium',         '7000',  'دعم Nafis المتميز للتخصصات الحرجة بالدرهم شهرياً'),
  ('national_edu_emirati_required', 'true',  'هل يُشترط تدريس التربية الوطنية بمواطنين فقط'),
  ('emiratization_academic_year',   '2025-2026', 'السنة الأكاديمية الحالية للتقارير'),
  ('school_type',                   'government','نوع المدرسة: government (ADEK) أو private (Nafis)')
ON CONFLICT (key) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- تم — شغّل هذا في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
