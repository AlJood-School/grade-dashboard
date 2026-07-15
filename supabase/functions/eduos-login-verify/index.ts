// eduos-login-verify — Staff, Parent & Student authentication
// EduOS · NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
// v4: + Rate Limiting + Brute-Force Protection + Security Headers + CORS Restriction
// الحماية: 5 محاولات خاطئة → قفل 30 دقيقة | تسجيل كل محاولة

// ── CORS: نسمح فقط لنطاقاتنا الرسمية ──
const ALLOWED_ORIGINS = [
  'https://aljood.eduos.ae',
  'https://demo.eduos.ae',
  'https://control.eduos.ae',
  'https://eduos.ae',
  'http://localhost:3000',  // للتطوير المحلي فقط
  'http://localhost:5173',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

// ── Rate Limiting ──
const MAX_ATTEMPTS = 5;          // محاولات قبل القفل
const LOCK_DURATION_MIN = 30;    // مدة القفل بالدقائق
const WINDOW_MIN = 15;           // نافذة العد بالدقائق

async function checkRateLimit(
  supabaseUrl: string,
  serviceKey: string,
  identifier: string,
  ip: string
): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil: string | null }> {
  const windowStart = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();

  // هل هناك قفل نشط؟
  const lockRes = await fetch(
    `${supabaseUrl}/rest/v1/login_rate_limits?identifier=eq.${encodeURIComponent(identifier)}&locked_until=gt.${new Date().toISOString()}&select=locked_until&limit=1`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
  );
  if (lockRes.ok) {
    const locks = await lockRes.json();
    if (locks && locks.length > 0) {
      return { allowed: false, remainingAttempts: 0, lockedUntil: locks[0].locked_until };
    }
  }

  // عدّ المحاولات الفاشلة في النافذة الزمنية
  const attRes = await fetch(
    `${supabaseUrl}/rest/v1/login_rate_limits?identifier=eq.${encodeURIComponent(identifier)}&attempt_time=gte.${windowStart}&success=eq.false&select=id`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
  );

  let failCount = 0;
  if (attRes.ok) {
    const atts = await attRes.json();
    failCount = atts ? atts.length : 0;
  }

  if (failCount >= MAX_ATTEMPTS) {
    // تفعيل القفل
    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MIN * 60 * 1000).toISOString();
    await fetch(`${supabaseUrl}/rest/v1/login_rate_limits`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ identifier, ip_address: ip, success: false, locked_until: lockedUntil }),
    });
    return { allowed: false, remainingAttempts: 0, lockedUntil };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - failCount, lockedUntil: null };
}

async function logAttempt(
  supabaseUrl: string,
  serviceKey: string,
  identifier: string,
  ip: string,
  success: boolean
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/login_rate_limits`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ identifier, ip_address: ip, success }),
  });

  // نظّف السجلات القديمة (أقدم من 24 ساعة) لتوفير مساحة
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  fetch(`${supabaseUrl}/rest/v1/login_rate_limits?attempt_time=lt.${cutoff}&locked_until=is.null`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal',
    },
  }).catch(() => {});
}

// ── تنظيف المدخلات ──
function sanitize(input: string): string {
  return input.trim().replace(/[<>"'%;()&+]/g, '').substring(0, 100);
}

// ── الدالة الرئيسية ──
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // استخراج IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  try {
    const body = await req.json();
    const rawUsername: string = body.username || '';
    const rawPassword: string = body.password || '';

    // تنظيف المدخلات
    const username = sanitize(rawUsername);
    const password = rawPassword.substring(0, 128); // حد أقصى لكلمة المرور

    if (!username) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ── Rate Limit Check ──
    const rateCheck = await checkRateLimit(supabaseUrl, serviceKey, username, ip);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'too_many_attempts',
          lockedUntil: rateCheck.lockedUntil,
          message: `الحساب مقفل مؤقتاً حتى ${new Date(rateCheck.lockedUntil!).toLocaleTimeString('ar-AE')}. حاول مرة أخرى لاحقاً.`,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '1800',
          },
        }
      );
    }

    // ── Step 1: طالب (رقم المقعد بدون كلمة مرور) ──
    if (/^\d{5,}$/.test(username)) {
      const stuRes = await fetch(
        `${supabaseUrl}/rest/v1/students?student_number=eq.${encodeURIComponent(username)}&select=id,name,name_en,class_name,student_number,grade,grade_level&limit=1`,
        { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
      );
      if (stuRes.ok) {
        const stuRows = await stuRes.json();
        if (stuRows && stuRows.length > 0) {
          const stu = stuRows[0];
          await logAttempt(supabaseUrl, serviceKey, username, ip, true);
          return new Response(
            JSON.stringify({
              ok: true,
              role_key: 'student',
              name_ar: stu.name || '',
              name_en: stu.name_en || stu.name || '',
              student_number: stu.student_number,
              class_name: stu.class_name || '',
              grade_level: stu.grade || stu.grade_level || '',
              student_id: String(stu.id),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // ── تشفير كلمة المرور ──
    if (!password) {
      await logAttempt(supabaseUrl, serviceKey, username, ip, false);
      return new Response(JSON.stringify({ ok: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // ── Step 2: موظف (staff_profiles) ──
    const staffRes = await fetch(
      `${supabaseUrl}/rest/v1/staff_profiles?username=eq.${encodeURIComponent(username)}&password_hash=eq.${hashHex}&select=role_key,name_ar,name_en,staff_db_id,is_active`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    );

    if (staffRes.ok) {
      const rows = await staffRes.json();
      if (rows && rows.length > 0) {
        const staff = rows[0];
        if (staff.is_active === false) {
          await logAttempt(supabaseUrl, serviceKey, username, ip, false);
          return new Response(JSON.stringify({ ok: false, error: 'account_inactive' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // تحديث آخر دخول
        fetch(`${supabaseUrl}/rest/v1/staff_profiles?username=eq.${encodeURIComponent(username)}`, {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ last_login: new Date().toISOString() }),
        }).catch(() => {});

        await logAttempt(supabaseUrl, serviceKey, username, ip, true);
        return new Response(
          JSON.stringify({
            ok: true,
            role_key: staff.role_key,
            name_ar: staff.name_ar,
            name_en: staff.name_en,
            staff_db_id: staff.staff_db_id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Step 3: ولي أمر (parent_credentials) ──
    const parRes = await fetch(
      `${supabaseUrl}/rest/v1/parent_credentials?national_id=eq.${encodeURIComponent(username)}&password_hash=eq.${hashHex}&select=id,national_id,student_ids`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    );

    if (parRes.ok) {
      const parRows = await parRes.json();
      if (parRows && parRows.length > 0) {
        const par = parRows[0];
        let name_ar = '', name_en = '';
        const nameRes = await fetch(
          `${supabaseUrl}/rest/v1/parents?national_id=eq.${encodeURIComponent(username)}&select=name_ar,name_en`,
          { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
        );
        if (nameRes.ok) {
          const nameData = await nameRes.json();
          if (nameData && nameData.length > 0) {
            name_ar = nameData[0].name_ar || '';
            name_en = nameData[0].name_en || '';
          }
        }
        await logAttempt(supabaseUrl, serviceKey, username, ip, true);
        return new Response(
          JSON.stringify({
            ok: true,
            role_key: 'parent',
            name_ar,
            name_en,
            parent_id: par.id,
            national_id: par.national_id,
            student_ids: par.student_ids || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── فشل تسجيل الدخول ──
    await logAttempt(supabaseUrl, serviceKey, username, ip, false);
    return new Response(
      JSON.stringify({
        ok: false,
        remainingAttempts: rateCheck.remainingAttempts - 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'server_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
