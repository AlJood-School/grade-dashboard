-- جدول حفظ تقدم الطلاب في حصة G4
CREATE TABLE IF NOT EXISTS stream_progress_g4 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name text NOT NULL,
  section text NOT NULL,
  grade integer DEFAULT 4,
  phase integer DEFAULT 1,
  progress_json jsonb DEFAULT '{}',
  total_score numeric,
  status text DEFAULT 'in_progress',
  school_year text DEFAULT '2025-2026',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- unique per student per year
CREATE UNIQUE INDEX IF NOT EXISTS stream_progress_g4_unique
ON stream_progress_g4(student_name, section, school_year);

-- RLS
ALTER TABLE stream_progress_g4 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_stream_progress_g4" ON stream_progress_g4
  FOR ALL USING (true) WITH CHECK (true);
