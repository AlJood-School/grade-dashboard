-- ============================================================
-- جداول نظام الثيمات — بوابة الجود
-- ============================================================

-- 1. ثيم المدرسة الافتراضي + الثيمات الخاصة
CREATE TABLE IF NOT EXISTS school_themes (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id    TEXT    NOT NULL DEFAULT 'aljood',
  theme_key    TEXT    NOT NULL,           -- 'classic' / 'ramadan' / 'emergency' ...
  is_active    BOOLEAN NOT NULL DEFAULT true,
  is_special   BOOLEAN NOT NULL DEFAULT false,  -- الثيمات الخاصة (طوارئ/رمضان/صحي/بُعد)
  label_ar     TEXT,
  activated_by TEXT,                       -- معرف المديرة التي فعّلتها
  note         TEXT,                       -- سبب تفعيل الثيم الخاص
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس
CREATE INDEX IF NOT EXISTS idx_school_themes_school ON school_themes(school_id, is_active);

-- RLS
ALTER TABLE school_themes ENABLE ROW LEVEL SECURITY;

-- السياسة: القراءة للجميع — الكتابة لـ principal فقط (عبر service role)
CREATE POLICY "school_themes_read" ON school_themes
  FOR SELECT USING (true);

CREATE POLICY "school_themes_write" ON school_themes
  FOR ALL USING (true);  -- يُضيَّق لاحقاً مع نظام Auth

-- القيمة الافتراضية: ثيم كلاسيك
INSERT INTO school_themes (school_id, theme_key, is_active, is_special, label_ar, activated_by)
VALUES ('aljood', 'classic', true, false, 'كلاسيك', 'system')
ON CONFLICT DO NOTHING;


-- 2. الثيم الشخصي لكل مستخدم
CREATE TABLE IF NOT EXISTS user_preferences (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    TEXT    NOT NULL UNIQUE,      -- معرف المستخدم (username أو UUID)
  theme_key  TEXT    NOT NULL DEFAULT 'classic',
  font_size  TEXT    DEFAULT 'medium',     -- small / medium / large
  lang       TEXT    DEFAULT 'ar',         -- ar / en
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_prefs_all" ON user_preferences
  FOR ALL USING (true);  -- يُضيَّق لاحقاً مع Auth

-- Trigger: تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_school_themes_updated
  BEFORE UPDATE ON school_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_prefs_updated
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
