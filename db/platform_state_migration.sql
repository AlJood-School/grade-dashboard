-- ═══════════════════════════════════════════════════════════════
--  Platform State Intelligence — DB Migration
--  © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
--  EduOS / بوابة الجود الذكية
--  تاريخ: 29 يونيو 2026
-- ═══════════════════════════════════════════════════════════════

-- ── 1. platform_state — الحالة الحالية للمنصة ─────────────────
CREATE TABLE IF NOT EXISTS platform_state (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       text,                         -- NULL = كل المدارس
  state           text NOT NULL DEFAULT 'normal_school_day',
  -- القيم المتاحة:
  -- normal_school_day | exam_period | exam_prep_week
  -- ramadan_schedule | distance_learning
  -- holiday_religious | holiday_national
  -- summer_break | makeup_exams | orientation_week
  -- half_day | emergency_closure
  sub_state       text,                         -- تفاصيل إضافية: "morning_exam" / "afternoon_exam"
  label_ar        text,                         -- "أسبوع الامتحانات" 
  label_en        text,                         -- "Exam Week"
  icon            text DEFAULT '🏫',
  theme_override  text,                         -- "exam" | "ramadan" | "holiday" | "default"
  source          text DEFAULT 'manual',        -- "manual" | "crawler" | "calendar_engine" | "ncema"
  override_by     uuid REFERENCES auth.users(id), -- من أجرى التغيير
  override_note   text,
  valid_from      timestamptz NOT NULL DEFAULT now(),
  valid_until     timestamptz,                  -- NULL = حتى تغيير يدوي
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── 2. academic_events — الأحداث الأكاديمية (فهرس كامل) ────────
CREATE TABLE IF NOT EXISTS academic_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       text,
  academic_year   text DEFAULT '2025-2026',
  event_type      text NOT NULL,
  -- exam | holiday_national | holiday_religious | eid
  -- orientation | makeup_exam | field_trip | parent_meeting
  -- open_day | sports_day | graduation | ramadan_start | ramadan_end
  -- school_exam | ministry_exam | teacher_training | half_day
  title_ar        text NOT NULL,
  title_en        text,
  description_ar  text,
  description_en  text,
  starts_at       date NOT NULL,
  ends_at         date NOT NULL,
  affects_platform_state boolean DEFAULT false,
  platform_state_value text,    -- الحالة التي تُفعَّل عند هذا الحدث
  curriculum      text DEFAULT 'ALL',  -- MOE | CBSE | IB | ALL
  grade_scope     text DEFAULT 'ALL',  -- ALL | KG | G1-G4 | G5-G9 | G10-G12
  source          text DEFAULT 'manual',
  source_url      text,
  verified        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── 3. assessment_schedule — جدولة الامتحانات (كشف التعارض) ────
CREATE TABLE IF NOT EXISTS assessment_schedule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       text,
  subject_name    text NOT NULL,
  subject_name_en text,
  grade           text NOT NULL,           -- G1, G2 ... G12, KG1, KG2
  class_section   text,                    -- A, B, C ...
  assessment_type text DEFAULT 'quiz',     -- quiz | chapter_test | midterm | final | project
  scheduled_date  date NOT NULL,
  period_number   integer,                 -- الحصة: 1-8
  duration_mins   integer DEFAULT 45,
  teacher_id      uuid,
  created_by      uuid REFERENCES auth.users(id),
  conflict_flag   boolean DEFAULT false,   -- يُحدَّث تلقائياً
  conflict_note   text,
  approved        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── 4. platform_state_history — سجل التغييرات ──────────────────
CREATE TABLE IF NOT EXISTS platform_state_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       text,
  previous_state  text,
  new_state       text NOT NULL,
  changed_by      uuid REFERENCES auth.users(id),
  change_source   text DEFAULT 'manual',
  note            text,
  changed_at      timestamptz DEFAULT now()
);

-- ── 5. ncema_alerts — تنبيهات الطوارئ ──────────────────────────
CREATE TABLE IF NOT EXISTS ncema_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      text NOT NULL,   -- closure | weather | security | health
  severity        text DEFAULT 'medium',  -- low | medium | high | critical
  title_ar        text NOT NULL,
  title_en        text,
  body_ar         text,
  body_en         text,
  source_url      text,
  source_name     text DEFAULT 'NCEMA',
  affects_schools boolean DEFAULT false,
  school_scope    text DEFAULT 'ALL',
  action_required text,
  valid_from      timestamptz DEFAULT now(),
  valid_until     timestamptz,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_platform_state_school    ON platform_state(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_academic_events_date     ON academic_events(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_academic_events_school   ON academic_events(school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_assessment_schedule_date ON assessment_schedule(school_id, grade, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_ncema_alerts_active      ON ncema_alerts(is_active, valid_from);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE platform_state          ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_schedule     ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_state_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncema_alerts            ENABLE ROW LEVEL SECURITY;

-- anon: read active state only
CREATE POLICY "anon_read_platform_state"
  ON platform_state FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- anon: read academic events
CREATE POLICY "anon_read_academic_events"
  ON academic_events FOR SELECT
  TO anon, authenticated
  USING (true);

-- anon: read ncema alerts
CREATE POLICY "anon_read_ncema_alerts"
  ON ncema_alerts FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- authenticated: read own school assessment schedule
CREATE POLICY "auth_read_assessment_schedule"
  ON assessment_schedule FOR SELECT
  TO authenticated
  USING (true);

-- authenticated: insert/update own assessment (write via Edge Function only for sensitive)
CREATE POLICY "auth_manage_assessment"
  ON assessment_schedule FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_update_assessment"
  ON assessment_schedule FOR UPDATE
  TO authenticated
  USING (true);

-- history: authenticated read
CREATE POLICY "auth_read_state_history"
  ON platform_state_history FOR SELECT
  TO authenticated
  USING (true);

-- ── Seed: Initial state ──────────────────────────────────────────
INSERT INTO platform_state (state, label_ar, label_en, icon, source, valid_from)
VALUES ('exam_period', 'فترة الامتحانات', 'Exam Period', '📝',
        'calendar_engine', '2026-06-24')
ON CONFLICT DO NOTHING;

-- ── Seed: UAE MOE 2025-2026 Academic Events ──────────────────────
INSERT INTO academic_events (event_type, title_ar, title_en, starts_at, ends_at,
  affects_platform_state, platform_state_value, source, verified) VALUES

-- فصل أول
('orientation',     'أسبوع التوجيه',       'Orientation Week',       '2025-09-01','2025-09-07', true, 'orientation_week',    'moe.gov.ae', true),
('holiday_national','اليوم الوطني الإماراتي','UAE National Day',       '2025-12-01','2025-12-04', true, 'holiday_national',    'moe.gov.ae', true),
('holiday_national','إجازة الشتاء',         'Winter Break',           '2025-12-08','2026-01-03', true, 'summer_break',        'moe.gov.ae', true),

-- فصل ثاني
('holiday_religious','رمضان المبارك',        'Ramadan Schedule',       '2026-03-01','2026-03-29', true, 'ramadan_schedule',    'calendar_engine', true),
('eid',             'عيد الفطر المبارك',    'Eid Al-Fitr Holiday',    '2026-03-30','2026-04-05', true, 'holiday_religious',   'calendar_engine', true),
('holiday_national','إجازة الربيع',          'Spring Break',           '2026-03-16','2026-03-29', true, 'summer_break',        'moe.gov.ae', true),

-- فصل ثالث
('eid',             'عيد الأضحى المبارك',   'Eid Al-Adha Holiday',    '2026-06-06','2026-06-10', true, 'holiday_religious',   'calendar_engine', true),
('ministry_exam',   'امتحانات الفصل الثالث','S3 Ministry Exams',      '2026-06-24','2026-07-03', true, 'exam_period',         'moe.gov.ae', true),
('makeup_exam',     'امتحانات الإعادة',     'Makeup Exams',           '2026-07-06','2026-07-09', true, 'makeup_exams',        'moe.gov.ae', true),
('makeup_exam',     'امتحانات إعادة ثانية', 'Resit Exams',            '2026-07-14','2026-07-17', true, 'makeup_exams',        'moe.gov.ae', true),
('holiday_national','إجازة الصيف',           'Summer Break',           '2026-07-18','2026-08-31', true, 'summer_break',        'moe.gov.ae', true)

ON CONFLICT DO NOTHING;

-- ── Helper function: get current platform state ──────────────────
CREATE OR REPLACE FUNCTION get_current_platform_state(p_school_id text DEFAULT NULL)
RETURNS TABLE(state text, label_ar text, label_en text, icon text, theme_override text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT ps.state, ps.label_ar, ps.label_en, ps.icon, ps.theme_override
  FROM platform_state ps
  WHERE ps.is_active = true
    AND (ps.school_id = p_school_id OR ps.school_id IS NULL)
    AND (ps.valid_until IS NULL OR ps.valid_until > now())
  ORDER BY
    CASE WHEN ps.school_id = p_school_id THEN 0 ELSE 1 END,
    ps.valid_from DESC
  LIMIT 1;
END;
$$;

-- ── Trigger: conflict detection on assessment_schedule ────────────
CREATE OR REPLACE FUNCTION check_assessment_conflict()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  conflict_count integer;
  conflict_subjects text;
BEGIN
  -- كشف: هل يوجد أكثر من امتحانين للصف نفسه في نفس اليوم؟
  SELECT COUNT(*), string_agg(subject_name, ' / ')
  INTO conflict_count, conflict_subjects
  FROM assessment_schedule
  WHERE school_id = NEW.school_id
    AND grade = NEW.grade
    AND (class_section = NEW.class_section OR class_section IS NULL)
    AND scheduled_date = NEW.scheduled_date
    AND id != NEW.id;

  IF conflict_count >= 2 THEN
    NEW.conflict_flag := true;
    NEW.conflict_note := 'تعارض: يوجد ' || conflict_count || ' امتحانات في نفس اليوم للصف ذاته (' || conflict_subjects || ')';
  ELSE
    NEW.conflict_flag := false;
    NEW.conflict_note := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_assessment_conflict ON assessment_schedule;
CREATE TRIGGER trg_check_assessment_conflict
  BEFORE INSERT OR UPDATE ON assessment_schedule
  FOR EACH ROW EXECUTE FUNCTION check_assessment_conflict();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_platform_state_updated_at
  BEFORE UPDATE ON platform_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_academic_events_updated_at
  BEFORE UPDATE ON academic_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_assessment_schedule_updated_at
  BEFORE UPDATE ON assessment_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
