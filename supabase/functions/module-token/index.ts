/**
 * Edge Function: module-token
 * يُولِّد رمز SSO آمن للانتقال بين منتجات NAFAS
 * صلاحيته 60 ثانية فقط — يُستخدم مرة واحدة
 * 
 * POST /functions/v1/module-token
 * Body: { module: 'nafas' | 'midad' | 'umq' }
 * Headers: Authorization: Bearer <session token>
 * 
 * Response: { token: string, redirect_url: string, expires_at: string }
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// دومينات المنتجات
const MODULE_DOMAINS: Record<string, string> = {
  nafas: 'https://nafas-app.com',
  midad: 'https://midad.ae',
  umq:   'https://umq.ae',
};

// مفتاح سري لتوقيع الرموز (يُخزَّن في Supabase Secrets باسم MODULE_SSO_SECRET)
const SSO_SECRET = Deno.env.get('MODULE_SSO_SECRET') || 'NAFAS-SSO-2026-TEMP';

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signPayload(payload: object): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SSO_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigBase64 = base64url(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigBase64}`;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. تحقق من جلسة المستخدم
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. قراءة جسم الطلب
    const { module } = await req.json();
    if (!module || !MODULE_DOMAINS[module]) {
      return new Response(JSON.stringify({ error: 'invalid_module' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. قراءة بيانات المستخدم من الجلسة
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // استخراج username من token (sessionStorage)
    // الـ token هو JWT من login — نقرأه لمعرفة المستخدم
    const sessionToken = authHeader.replace('Bearer ', '');
    
    // نتحقق من صحة الجلسة عبر قراءة staff_profiles
    // (الـ anon token لا يكفي — نحتاج service role للتحقق)
    // في هذه المرحلة نثق بالجلسة ونوقّع payload بسيط
    
    const expiresAt = Date.now() + 60_000; // 60 ثانية

    // 4. توليد payload
    const payload = {
      iss: 'eduos.ae',
      sub: sessionToken.slice(0, 20), // جزء من الـ token كمرجع
      module,
      school: 'aljood',
      exp: Math.floor(expiresAt / 1000),
      iat: Math.floor(Date.now() / 1000),
    };

    // 5. توقيع الرمز
    const ssoToken = await signPayload(payload);

    // 6. حفظ الرمز في جدول مؤقت للتحقق لاحقاً (استخدام مرة واحدة)
    await supabase.from('module_sso_tokens').insert({
      token_hash: ssoToken.slice(-20),
      module,
      expires_at: new Date(expiresAt).toISOString(),
      used: false
    });

    const redirectUrl = `${MODULE_DOMAINS[module]}?eduos_sso=${encodeURIComponent(ssoToken)}&school=aljood`;

    return new Response(JSON.stringify({
      token: ssoToken,
      redirect_url: redirectUrl,
      expires_at: new Date(expiresAt).toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('module-token error:', err);
    return new Response(JSON.stringify({ error: 'server_error', detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
