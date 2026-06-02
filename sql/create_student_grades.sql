-- جدول درجات الطلاب
CREATE TABLE IF NOT EXISTS student_grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id TEXT DEFAULT 'aljood',
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  student_name TEXT NOT NULL,
  term INTEGER NOT NULL,
  formative NUMERIC(5,2),
  summative NUMERIC(5,2),
  term1_total NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, grade, section, student_name, term)
);

-- تفعيل RLS
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة والكتابة
CREATE POLICY "allow_all_student_grades" ON student_grades
  FOR ALL USING (true) WITH CHECK (true);
