// supabase/functions/suspend-account/index.ts
// EduOS — إيقاف / إعادة تفعيل حساب موظفة
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

const ALLOWED_ACTOR_ROLES = ['admin', 'principal', 'vice_principal'];
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
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    // ── تحقق من هوية المستخدم عبر JWT ──
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    const actorEmail = userRes.user.email ?? '';
    const actorUsername = actorEmail.split('@')[0];
    if (!actorUsername) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── تحقق من دور المُنفِّذ (actor) ──
    const { data: actorProfile, error: actorErr } = await supabaseAdmin
      .from('staff_profiles')
      .select('role_key, name_ar, is_active')
      .eq('username', actorUsername)
      .maybeSingle();

    if (actorErr || !actorProfile) {
      return jsonResponse({ error: 'actor_not_found' }, 403);
    }
    if (actorProfile.is_active === false) {
      return jsonResponse({ error: 'actor_suspended' }, 403);
    }
    if (!ALLOWED_ACTOR_ROLES.includes(actorProfile.role_key)) {
      return jsonResponse({ error: 'forbidden' }, 403);
    }

    // ── قراءة المُدخلات ──
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const targetStaffDbId = String(body.target_staff_db_id || '').trim();
    const action = String(body.action || '').trim();
    const reason = body.reason ? String(body.reason).trim() : null;
    const actorName = String(body.actor_name || actorProfile.name_ar || actorUsername).trim();

    if (!targetStaffDbId || !['suspend', 'reactivate'].includes(action)) {
      return jsonResponse({ error: 'invalid_input' }, 400);
    }

    // ── بناء التحديث ──
    let updatePayload: Record<string, unknown>;
    if (action === 'suspend') {
      updatePayload = {
        is_active: false,
        suspension_reason: reason || 'إيقاف إداري',
        suspended_at: new Date().toISOString(),
        suspended_by: actorName,
        failed_login_count: 0,
      };
    } else {
      updatePayload = {
        is_active: true,
        suspension_reason: null,
        suspended_at: null,
        suspended_by: null,
        failed_login_count: 0,
      };
    }

    const { data: targetRows, error: updateErr } = await supabaseAdmin
      .from('staff_profiles')
      .update(updatePayload)
      .eq('staff_db_id', targetStaffDbId)
      .select('name_ar, staff_db_id')
      .limit(1);

    if (updateErr) {
      return jsonResponse({ error: 'update_failed', details: updateErr.message }, 500);
    }
    if (!targetRows || targetRows.length === 0) {
      return jsonResponse({ error: 'target_not_found' }, 404);
    }

    const targetName = targetRows[0].name_ar || 'موظفة';

    // ── إشعار الإدارة عبر البريد ──
    const { data: managers } = await supabaseAdmin
      .from('staff_profiles')
      .select('name_ar, email')
      .in('role_key', MANAGER_ROLES)
      .eq('is_active', true);

    const subject = action === 'suspend' ? 'إيقاف حساب موظفة' : 'إعادة تفعيل حساب موظفة';
    const actionLabel = action === 'suspend' ? 'تم إيقاف' : 'تمت إعادة تفعيل';
    const dateStr = new Date().toLocaleDateString('ar', { day: '2-digit', month: 'long', year: 'numeric' });
    const reasonLine = action === 'suspend'
      ? '<p><strong>السبب:</strong> ' + (reason || 'إيقاف إداري') + '</p>'
      : '';
    const htmlBody =
      '<div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;font-size:15px;color:#1e293b">' +
      '<h2 style="color:#6C3DD6">' + subject + '</h2>' +
      '<p>' + actionLabel + ' حساب: <strong>' + targetName + '</strong></p>' +
      reasonLine +
      '<p><strong>بواسطة:</strong> ' + actorName + '</p>' +
      '<p><strong>التاريخ:</strong> ' + dateStr + '</p>' +
      '<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">' +
      '<p style="font-size:12px;color:#94a3b8">هذا إشعار تلقائي من نظام EduOS — لا داعي للرد على هذا البريد.</p>' +
      '</div>';

    await sendManagerEmails(managers || [], subject, htmlBody);

    return jsonResponse({ success: true, action, target: targetName });
  } catch (e) {
    return jsonResponse({ error: 'server_error', details: String(e) }, 500);
  }
});
