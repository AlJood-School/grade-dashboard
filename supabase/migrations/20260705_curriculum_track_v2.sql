-- ============================================================
-- EduOS Curriculum Track v2 — Smart Planning System
-- 2026-07-05
-- ============================================================

-- 1. Semester plans: lesson sequence
ALTER TABLE semester_plans
  ADD COLUMN IF NOT EXISTS lessons_sequence  JSONB   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS assessments_sched JSONB   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS total_lessons     INTEGER DEFAULT 0;

-- 2. Weekly track: approval + lock
ALTER TABLE weekly_track
  ADD COLUMN IF NOT EXISTS all_approved      BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS all_approved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS week_start_date   DATE,
  ADD COLUMN IF NOT EXISTS week_end_date     DATE,
  ADD COLUMN IF NOT EXISTS is_locked         BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at         TIMESTAMPTZ;

-- 3. Weekly track items: strikethrough + auto-gen
ALTER TABLE weekly_track_items
  ADD COLUMN IF NOT EXISTS is_strikethrough  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_content  JSONB,
  ADD COLUMN IF NOT EXISTS change_notified   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lesson_number     INTEGER,
  ADD COLUMN IF NOT EXISTS auto_generated    BOOLEAN DEFAULT false;

-- 4. Teacher approvals per week
CREATE TABLE IF NOT EXISTS weekly_track_approvals (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id     UUID        REFERENCES weekly_track(id) ON DELETE CASCADE,
  teacher_id   TEXT        NOT NULL,
  teacher_name TEXT,
  subject      TEXT,
  grade        TEXT,
  status       TEXT        DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  approved_at  TIMESTAMPTZ,
  school_id    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(track_id, teacher_id)
);
ALTER TABLE weekly_track_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wta_select" ON weekly_track_approvals;
DROP POLICY IF EXISTS "wta_insert" ON weekly_track_approvals;
DROP POLICY IF EXISTS "wta_update" ON weekly_track_approvals;
CREATE POLICY "wta_select" ON weekly_track_approvals FOR SELECT USING (true);
CREATE POLICY "wta_insert" ON weekly_track_approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "wta_update" ON weekly_track_approvals FOR UPDATE USING (true);

-- 5. Coordination requests between teachers
CREATE TABLE IF NOT EXISTS track_coordination_requests (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id              UUID        REFERENCES weekly_track(id) ON DELETE CASCADE,
  item_id               UUID,
  requester_teacher_id  TEXT        NOT NULL,
  requester_name        TEXT,
  target_teacher_id     TEXT        NOT NULL,
  target_name           TEXT,
  class_id              TEXT        NOT NULL,
  subject               TEXT,
  request_message       TEXT        NOT NULL,
  proposed_day          INTEGER     CHECK (proposed_day BETWEEN 1 AND 5),
  status                TEXT        DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','counter_proposed')),
  response_message      TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  responded_at          TIMESTAMPTZ,
  school_id             TEXT
);
ALTER TABLE track_coordination_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tcr_select" ON track_coordination_requests;
DROP POLICY IF EXISTS "tcr_insert" ON track_coordination_requests;
DROP POLICY IF EXISTS "tcr_update" ON track_coordination_requests;
CREATE POLICY "tcr_select" ON track_coordination_requests FOR SELECT USING (true);
CREATE POLICY "tcr_insert" ON track_coordination_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "tcr_update" ON track_coordination_requests FOR UPDATE USING (true);

-- 6. Curriculum map (built from semester plans, per teacher/subject/grade)
CREATE TABLE IF NOT EXISTS curriculum_map (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  subject             TEXT        NOT NULL,
  grade               TEXT        NOT NULL,
  term                INTEGER     DEFAULT 1,
  unit_number         INTEGER     NOT NULL,
  unit_name           TEXT        NOT NULL,
  lesson_number       INTEGER     NOT NULL,
  lesson_title        TEXT        NOT NULL,
  lesson_title_en     TEXT,
  item_type           TEXT        DEFAULT 'lesson'
                        CHECK (item_type IN ('lesson','quiz','exam','project','activity','review')),
  triggers_assessment BOOLEAN     DEFAULT false,
  assessment_type     TEXT,
  assessment_note     TEXT,
  estimated_periods   INTEGER     DEFAULT 1,
  teacher_id          TEXT,
  school_id           TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE curriculum_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cm_select" ON curriculum_map;
DROP POLICY IF EXISTS "cm_insert" ON curriculum_map;
DROP POLICY IF EXISTS "cm_update" ON curriculum_map;
DROP POLICY IF EXISTS "cm_delete" ON curriculum_map;
CREATE POLICY "cm_select" ON curriculum_map FOR SELECT USING (true);
CREATE POLICY "cm_insert" ON curriculum_map FOR INSERT WITH CHECK (true);
CREATE POLICY "cm_update" ON curriculum_map FOR UPDATE USING (true);
CREATE POLICY "cm_delete" ON curriculum_map FOR DELETE USING (true);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_curriculum_map_lookup
  ON curriculum_map(subject, grade, term, teacher_id);
CREATE INDEX IF NOT EXISTS idx_weekly_track_approvals_track
  ON weekly_track_approvals(track_id);
CREATE INDEX IF NOT EXISTS idx_coord_requests_target
  ON track_coordination_requests(target_teacher_id, status);
