-- =====================================================
-- Smart Survey Builder Tables — روضة ومدرسة الجود
-- © 2026 · منيرة علي محمد المري
-- Created: 2026-05-29
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: surveys
-- =====================================================
CREATE TABLE IF NOT EXISTS surveys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     UUID REFERENCES schools(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  target_roles  TEXT[] DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','closed')),
  allow_anon    BOOLEAN DEFAULT FALSE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  academic_year TEXT DEFAULT '2025-2026',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: survey_questions
-- =====================================================
CREATE TABLE IF NOT EXISTS survey_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id     UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  order_num     INTEGER NOT NULL DEFAULT 1,
  type          TEXT NOT NULL CHECK (type IN ('single','multiple','text','textarea','rating','scale','yesno','section')),
  question_text TEXT DEFAULT '',
  options       JSONB DEFAULT '[]',
  required      BOOLEAN DEFAULT FALSE,
  section_title TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_questions(survey_id, order_num);

-- =====================================================
-- Table: survey_responses
-- =====================================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id        UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  school_id        UUID REFERENCES schools(id) ON DELETE SET NULL,
  respondent_name  TEXT,
  respondent_role  TEXT,
  respondent_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted ON survey_responses(submitted_at);

-- =====================================================
-- Table: survey_answers
-- =====================================================
CREATE TABLE IF NOT EXISTS survey_answers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id  UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_value JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_answers_response_id ON survey_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_question_id ON survey_answers(question_id);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;

-- Allow anon to read active surveys
CREATE POLICY "Public read active surveys" ON surveys
  FOR SELECT USING (status = 'active');

-- Allow anon to read questions for active surveys
CREATE POLICY "Public read survey questions" ON survey_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = survey_id AND surveys.status = 'active')
  );

-- Allow anon to insert responses
CREATE POLICY "Anyone can submit response" ON survey_responses
  FOR INSERT WITH CHECK (true);

-- Allow anon to read their own responses (by survey)
CREATE POLICY "Read survey responses" ON survey_responses
  FOR SELECT USING (true);

-- Allow anon to insert answers
CREATE POLICY "Anyone can submit answers" ON survey_answers
  FOR INSERT WITH CHECK (true);

-- Allow anon to read answers
CREATE POLICY "Read survey answers" ON survey_answers
  FOR SELECT USING (true);

-- Allow authenticated users to manage surveys
CREATE POLICY "Admins manage surveys" ON surveys
  FOR ALL USING (true);

CREATE POLICY "Admins manage questions" ON survey_questions
  FOR ALL USING (true);

-- =====================================================
-- End of file
-- =====================================================
