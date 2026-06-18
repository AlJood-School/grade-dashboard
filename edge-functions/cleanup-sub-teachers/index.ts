/**
 * EduOS Edge Function: cleanup-sub-teachers
 * يُستدعى يومياً — يحذف حسابات المعلمين البدلاء بعد 7 أيام من انتهاء عقودهم
 * يُشغَّل من Supabase Cron أو Trigger خارجي
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // التحقق من المفتاح السري (يُمرَّر من cron أو المدير فقط)
  const authHeader = req.headers.get('Authorization') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  // السماح فقط لـ service_role
  if (!authHeader.includes(serviceKey) && authHeader !== `Bearer ${serviceKey}`) {
    return new Response(
      JSON.stringify({ error: 'غير مصرّح' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // استدعاء دالة الحذف
    const { error } = await supabase.rpc('cleanup_expired_sub_teachers');

    if (error) throw error;

    // جلب من بقي (لم يُحذف بعد — في فترة الـ 7 أيام)
    const { data: remaining } = await supabase
      .from('staff_profiles')
      .select('id, full_name, contract_end_date')
      .eq('is_sub_teacher', true)
      .order('contract_end_date');

    // إيجاد من سينتهي عقده خلال 3 أيام (تنبيه للمدير)
    const today = new Date();
    const soon = remaining?.filter(r => {
      if (!r.contract_end_date) return false;
      const end = new Date(r.contract_end_date);
      const diff = (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    }) || [];

    // إنشاء إشعار للمدير إن وُجد من ينتهي قريباً
    if (soon.length > 0) {
      const names = soon.map(s => s.full_name).join('، ');
      await supabase.from('broadcasts').insert({
        title: '⚠️ عقود معلمين بدلاء تنتهي قريباً',
        body: `ينتهي عقد هؤلاء المعلمين خلال 3 أيام: ${names}`,
        target_roles: ['principal', 'admin'],
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم تنفيذ التنظيف بنجاح',
        expiring_soon: soon.length,
        names: soon.map(s => s.full_name),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
