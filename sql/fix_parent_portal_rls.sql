-- ============================================================
-- إصلاح RLS لبوابة ولي الأمر
-- السماح للـ anon key بقراءة inclusion_plans (للبحث برقم الهوية)
-- ============================================================

-- إضافة policy للقراءة العامة (anon)
CREATE POLICY "inc_select_anon" ON inclusion_plans
  FOR SELECT TO anon
  USING (true);

-- التحقق
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE tablename = 'inclusion_plans';
