-- جدول مركز الرسائل الداخلية — بوابة الجود
-- © 2026 منيرة علي محمد المري

CREATE TABLE IF NOT EXISTS internal_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id text NOT NULL DEFAULT 'aljood',
  thread_id text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  recipient text NOT NULL DEFAULT 'all',
  -- القيم: all, admin, teachers, special_ed, support_team
  message_type text NOT NULL DEFAULT 'direct',
  -- القيم: direct, announcement, group, reply
  priority text NOT NULL DEFAULT 'normal',
  -- القيم: normal, urgent
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة والكتابة
CREATE POLICY "allow_read_messages" ON internal_messages
  FOR SELECT USING (school_id = 'aljood');

CREATE POLICY "allow_insert_messages" ON internal_messages
  FOR INSERT WITH CHECK (school_id = 'aljood');

CREATE POLICY "allow_update_messages" ON internal_messages
  FOR UPDATE USING (school_id = 'aljood');

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_internal_messages_thread ON internal_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_school ON internal_messages(school_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_created ON internal_messages(created_at DESC);

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
