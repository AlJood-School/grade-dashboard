// eduos-login-verify — Staff authentication via SHA-256 password hash
// EduOS · NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ ok: false, error: 'missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute SHA-256 of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Query staff_profiles
    const res = await fetch(
      `${supabaseUrl}/rest/v1/staff_profiles?username=eq.${encodeURIComponent(username)}&password_hash=eq.${hashHex}&select=role_key,name_ar,name_en,staff_db_id,is_active`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'db error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = await res.json();

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ ok: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staff = rows[0];

    if (staff.is_active === false) {
      return new Response(JSON.stringify({ ok: false, error: 'account_inactive' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last_login
    await fetch(
      `${supabaseUrl}/rest/v1/staff_profiles?username=eq.${encodeURIComponent(username)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ last_login: new Date().toISOString() }),
      }
    );

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

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
