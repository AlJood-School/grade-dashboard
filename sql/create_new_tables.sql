-- جداول جديدة: exit_tickets + portfolio_items

CREATE TABLE IF NOT EXISTS exit_tickets (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  grade TEXT, class_section TEXT, subject TEXT,
  lesson_date DATE DEFAULT CURRENT_DATE,
  understanding TEXT, feeling TEXT, want_more TEXT,
  student_name TEXT, school_id TEXT DEFAULT 'aljood'
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  student_id TEXT,
  item_type TEXT, title TEXT NOT NULL,
  description TEXT, date DATE, grade_level TEXT,
  image_url TEXT, added_by TEXT,
  school_id TEXT DEFAULT 'aljood'
);

ALTER TABLE exit_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS et_sel ON exit_tickets FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS et_ins ON exit_tickets FOR INSERT WITH CHECK (true);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS pi_sel ON portfolio_items FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS pi_ins ON portfolio_items FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS pi_upd ON portfolio_items FOR UPDATE USING (true);
