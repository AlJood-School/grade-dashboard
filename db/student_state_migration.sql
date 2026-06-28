-- ============================================================
-- NAFAS Unified student_state Table
-- © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
-- القرار المعتمد: 28 يونيو 2026 — إجماع 5/5 وكلاء
-- الغرض: السجل الموحد لحالة الطالب/ة عبر كل منتجات NAFAS
-- ============================================================

-- ── الجدول الرئيسي ──
CREATE TABLE IF NOT EXISTS student_state (
  id              BIGSERIAL PRIMARY KEY,
  student_id      TEXT NOT NULL,               -- text (not uuid) — logical join only
  school_id       UUID,                         -- nullable — NAFAS architecture
  source          TEXT NOT NULL CHECK (source IN ('jood', 'atheer', 'nafas', 'midad', 'umq')),
  event_type      TEXT NOT NULL,               -- academic_decline | silence_alert | writing_stopped | ...
  namespace       TEXT NOT NULL,               -- jood.* | nafas.* | atheer.* | midad.* | umq.*
  severity        SMALLINT NOT NULL DEFAULT 1  -- 1=ملاحظة  2=تنبيه  3=تدخل عاجل
                  CHECK (severity BETWEEN 1 AND 3),
  payload         JSONB NOT NULL DEFAULT '{}', -- بيانات الحدث (تختلف حسب المنتج)
  data_freshness  TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- اقتراح وكيل عُمق: يُحدَّث مع كل دفع
  resolved        BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_ss_student    ON student_state(student_id);
CREATE INDEX IF NOT EXISTS idx_ss_school     ON student_state(school_id);
CREATE INDEX IF NOT EXISTS idx_ss_source     ON student_state(source);
CREATE INDEX IF NOT EXISTS idx_ss_severity   ON student_state(severity);
CREATE INDEX IF NOT EXISTS idx_ss_created    ON student_state(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ss_unresolved ON student_state(student_id, resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_ss_freshness  ON student_state(source, data_freshness);

-- ── جدول المنتجات المُصرَّح لها بالكتابة ──
CREATE TABLE IF NOT EXISTS student_state_sources (
  source       TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  allowed_event_types TEXT[] NOT NULL,
  last_push    TIMESTAMPTZ,
  push_count   BIGINT DEFAULT 0
);

INSERT INTO student_state_sources (source, display_name, allowed_event_types) VALUES
  ('jood',   'بوابة الجود الذكية', ARRAY[
    'academic_decline', 'attendance_alert', 'grade_below_average',
    'exam_failed', 'consistent_absence', 'subject_weakness'
  ]),
  ('atheer', 'أثير',              ARRAY[
    'learning_style_shift', 'engagement_drop', 'interaction_stopped',
    'vark_update', 'exit_ticket_concern'
  ]),
  ('nafas',  'نَفَس',             ARRAY[
    'emotional_alert', 'silence_detected', 'protection_level_3',
    'session_distress', 'crisis_flag'
  ]),
  ('midad',  'مداد',             ARRAY[
    'writing_stopped', 'tone_shift', 'emotional_flag',
    'creativity_drop', 'language_regression'
  ]),
  ('umq',    'عُمق',             ARRAY[
    'science_decline', 'experiment_disengagement', 'curiosity_drop',
    'recurring_errors', 'skill_gap'
  ])
ON CONFLICT (source) DO NOTHING;

-- ── Data Freshness View (اقتراح وكيل عُمق) ──
CREATE OR REPLACE VIEW student_state_freshness AS
  SELECT
    source,
    display_name,
    MAX(data_freshness)                          AS last_event_at,
    COUNT(*)                                     AS total_events,
    COUNT(*) FILTER (WHERE resolved = FALSE)     AS open_events,
    COUNT(*) FILTER (WHERE severity = 3)         AS critical_events,
    CASE
      WHEN MAX(data_freshness) < NOW() - INTERVAL '14 days' THEN 'stale'
      WHEN MAX(data_freshness) < NOW() - INTERVAL '7 days'  THEN 'aging'
      ELSE 'fresh'
    END AS freshness_status
  FROM student_state ss
  JOIN student_state_sources sss USING (source)
  GROUP BY source, display_name;

-- ── RLS ──
ALTER TABLE student_state         ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_state_sources ENABLE ROW LEVEL SECURITY;

-- كل منتج يكتب في namespace مجاله فقط عبر Edge Function (service_role)
-- anon لا يقرأ ولا يكتب مباشرة — كل العمليات عبر Edge Functions
CREATE POLICY "no_anon_access"
  ON student_state FOR ALL TO anon USING (FALSE);

CREATE POLICY "no_anon_sources"
  ON student_state_sources FOR ALL TO anon USING (FALSE);

-- service_role (Edge Function) — وصول كامل
CREATE POLICY "service_full_access"
  ON student_state FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_sources_access"
  ON student_state_sources FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- ملاحظات أمنية:
-- ✅ anon: لا وصول مطلقاً
-- ✅ service_role (Edge Functions فقط): وصول كامل
-- ✅ كل منتج يرسل عبر Edge Function موثوقة فقط
-- ✅ emotional_flags من مداد → تصل للمرشد/ة فقط (عبر Edge Function منفصلة)
-- ✅ school_id nullable — RLS تمنع الإدارة من رؤية بيانات فردية
-- ============================================================
