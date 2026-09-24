// supabase/functions/track-failed-login/index.ts
// EduOS — تتبع محاولات الدخول الفاشلة + إيقاف تلقائي بعد 5 محاولات
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

const MAX_ATTEMPTS = 5;
const MANAGER_ROLES = ['admin', 'principal', 'vice_principal'];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function sendManagerEmails(
  managers: { name_ar?: string; email?: string }[],
  subject: string,
  htmlBody: string,
): Promise<void> {
  if (!RESEND_API_KEY || !managers || !managers.length) return;
  const jobs = managers
    .filter((m) => !!m.email)
    .map((m) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'EduOS <noreply@eduos.ae>',
          to: [m.email],
          subject,
          html: htmlBody,
        }),
      }).catch(() => null),
    );
  await Promise.all(jobs);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const username = String(body.username || '').trim();
    if (!username) {
      return jsonResponse({ error: 'invalid_input' }, 400);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('staff_profiles')
      .select('staff_db_id, name_ar, is_active, failed_login_count')
      .eq('username', username)
      .maybeSingle();

    // لا نكشف عن وجود الحساب من عدمه لمستخدم غير موثَّق
    if (fetchErr || !profile) {
      return jsonResponse({ locked: false, count: 0 });
    }

    // إذا كان الحساب موقوفاً أصلاً، لا داعي لزيادة العداد
    if (profile.is_active === false) {
      return jsonResponse({ locked: true, count: profile.failed_login_count || 0 });
    }

    const newCount = (profile.failed_login_count || 0) + 1;
    const willLock = newCount >= MAX_ATTEMPTS;

    const updatePayload: Record<string, unknown> = {
      failed_login_count: newCount,
      last_failed_login: new Date().toISOString(),
    };

    if (willLock) {
      updatePayload.is_active = false;
      updatePayload.suspension_reason = 'تجاوز محاولات الدخول (5 محاولات فاشلة)';
      updatePayload.suspended_at = new Date().toISOString();
      updatePayload.suspended_by = 'النظام تلقائياً';
    }

    await supabaseAdmin
      .from('staff_profiles')
      .update(updatePayload)
      .eq('username', username);

    if (willLock) {
      const { data: managers } = await supabaseAdmin
        .from('staff_profiles')
        .select('name_ar, email')
        .in('role_key', MANAGER_ROLES)
        .eq('is_active', true);

      const dateStr = new Date().toLocaleDateString('ar', { day: '2-digit', month: 'long', year: 'numeric' });
      const htmlBody =
        '<div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;font-size:15px;color:#1e293b">' +
        '<h2 style="color:#EF4444">إيقاف تلقائي لحساب</h2>' +
        '<p>تم إيقاف حساب: <strong>' + (profile.name_ar || username) + '</strong> تلقائياً بسبب تجاوز عدد محاولات الدخول (5 محاولات فاشلة).</p>' +
        '<p><strong>التاريخ:</strong> ' + dateStr + '</p>' +
        '<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">' +
        '<p style="font-size:12px;color:#94a3b8">هذا إشعار تلقائي من نظام EduOS — لا داعي للرد على هذا البريد.</p>' +
        '</div>';

      await sendManagerEmails(managers || [], 'إيقاف تلقائي لحساب موظفة', htmlBody);
    }

    return jsonResponse({ locked: willLock, count: newCount });
  } catch (e) {
    return jsonResponse({ error: 'server_error', details: String(e) }, 500);
  }
});
