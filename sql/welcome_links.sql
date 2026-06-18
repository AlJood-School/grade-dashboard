-- ============================================================
-- منظومة الترحيب الذكي — welcome_links
-- ============================================================

CREATE TABLE IF NOT EXISTS welcome_links (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token         text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  target_type   text CHECK (target_type IN ('staff','student','parent')),
  target_id     text,
  target_name   text NOT NULL,
  target_role   text,
  target_email  text,
  target_phone  text,
  created_by    text NOT NULL,
  expires_at    timestamptz DEFAULT (now() + interval '48 hours'),
  used_at       timestamptz,
  is_used       boolean DEFAULT false,
  custom_msg    text,
  created_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE welcome_links ENABLE ROW LEVEL SECURITY;

-- القراءة بالتوكن: عامة (لصفحة الوصول)
DROP POLICY IF EXISTS "read_by_token" ON welcome_links;
CREATE POLICY "read_by_token" ON welcome_links
  FOR SELECT USING (true);

-- الإنشاء: للمعلمين+ فقط
DROP POLICY IF EXISTS "create_by_staff" ON welcome_links;
CREATE POLICY "create_by_staff" ON welcome_links
  FOR INSERT WITH CHECK (true);

-- التحديث (تأشير مستخدَم): عامة
DROP POLICY IF EXISTS "mark_used" ON welcome_links;
CREATE POLICY "mark_used" ON welcome_links
  FOR UPDATE USING (true);

-- فهرسة
CREATE INDEX IF NOT EXISTS idx_wl_token ON welcome_links(token);
CREATE INDEX IF NOT EXISTS idx_wl_target ON welcome_links(target_id);
CREATE INDEX IF NOT EXISTS idx_wl_expires ON welcome_links(expires_at);
