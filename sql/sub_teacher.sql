-- ============================================================
-- EduOS: دور المعلم البديل (sub_teacher)
-- تاريخ: 2026-06-18
-- ============================================================

-- 1. إضافة حقل تاريخ انتهاء العقد في staff_profiles
ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS is_sub_teacher BOOLEAN DEFAULT FALSE;

-- 2. فهرس للحذف التلقائي السريع
CREATE INDEX IF NOT EXISTS idx_staff_contract_end
  ON staff_profiles(contract_end_date)
  WHERE is_sub_teacher = TRUE;

-- 3. دالة الحذف التلقائي بعد 7 أيام من انتهاء العقد
CREATE OR REPLACE FUNCTION cleanup_expired_sub_teachers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  -- حذف المعلمين البدلاء الذين انتهى عقدهم منذ أكثر من 7 أيام
  DELETE FROM staff_profiles
  WHERE is_sub_teacher = TRUE
    AND contract_end_date IS NOT NULL
    AND contract_end_date < CURRENT_DATE - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- تسجيل في import_logs للمراجعة
  IF deleted_count > 0 THEN
    INSERT INTO import_logs(created_at, status, notes)
    VALUES (
      NOW(),
      'cleanup',
      'حُذف ' || deleted_count || ' معلم بديل منتهي العقد تلقائياً'
    );
  END IF;
END;
$$;

-- 4. منح الصلاحيات للـ anon role (تستدعيها Edge Function)
GRANT EXECUTE ON FUNCTION cleanup_expired_sub_teachers() TO service_role;

-- 5. RLS: المعلم البديل يرى بياناته فقط في staff_profiles
-- (يُطبَّق من خلال platform-auth-guard.js + Edge Function)

-- تحقق: عرض المعلمين البدلاء الحاليين
-- SELECT id, full_name, contract_end_date,
--   contract_end_date - CURRENT_DATE AS days_remaining
-- FROM staff_profiles
-- WHERE is_sub_teacher = TRUE
-- ORDER BY contract_end_date;
