-- ============================================================
-- جداول النماذج الرقمية — eduos-forms
-- ============================================================

-- جدول احتياطي لأي نموذج بدون جدول خاص
CREATE TABLE IF NOT EXISTS form_submissions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type    text NOT NULL,
  form_title   text,
  data         jsonb,
  status       text DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','closed')),
  reviewed_by  text,
  reviewed_at  timestamptz,
  notes        text,
  submitted_at timestamptz DEFAULT now()
);
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all_access_forms" ON form_submissions;
CREATE POLICY "all_access_forms" ON form_submissions FOR ALL USING(true) WITH CHECK(true);

-- إذن خروج الطالب
CREATE TABLE IF NOT EXISTS student_exit_requests (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name  text,
  student_class text,
  parent_name   text,
  parent_phone  text,
  exit_time     time,
  reason        text,
  notes         text,
  status        text DEFAULT 'pending',
  approved_by   text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE student_exit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exit_all" ON student_exit_requests FOR ALL USING(true) WITH CHECK(true);

-- طلبات الوثائق
CREATE TABLE IF NOT EXISTS document_requests (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name text,
  student_name   text,
  doc_type       text,
  purpose        text,
  copies         integer DEFAULT 1,
  urgency        text DEFAULT 'عادي',
  status         text DEFAULT 'pending',
  completed_at   timestamptz,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_all" ON document_requests FOR ALL USING(true) WITH CHECK(true);

-- زيارات أولياء الأمور
CREATE TABLE IF NOT EXISTS parent_visits (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_name         text,
  parent_phone        text,
  student_name        text,
  student_class       text,
  visit_date          date,
  visit_time          time,
  purpose             text,
  notes               text,
  actual_arrival_time time,
  status              text DEFAULT 'pending',
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE parent_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visit_all" ON parent_visits FOR ALL USING(true) WITH CHECK(true);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_forms_type    ON form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_forms_status  ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exits_date    ON student_exit_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_date   ON parent_visits(visit_date);
