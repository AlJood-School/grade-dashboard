// eduos-login-verify — Staff & Parent authentication via SHA-256 password hash
// EduOS · NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
// v2: supports staff_profiles + parent_credentials

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

    // ── Step 1: Try staff_profiles ──
    const staffRes = await fetch(
      `${supabaseUrl}/rest/v1/staff_profiles?username=eq.${encodeURIComponent(username)}&password_hash=eq.${hashHex}&select=role_key,name_ar,name_en,staff_db_id,is_active`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );

    if (staffRes.ok) {
      const rows = await staffRes.json();
      if (rows && rows.length > 0) {
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
      }
    }

    // ── Step 2: Try parent_credentials ──
    const parRes = await fetch(
      `${supabaseUrl}/rest/v1/parent_credentials?national_id=eq.${encodeURIComponent(username)}&password_hash=eq.${hashHex}&select=id,national_id,student_ids`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );

    if (parRes.ok) {
      const parRows = await parRes.json();
      if (parRows && parRows.length > 0) {
        const par = parRows[0];
        // Fetch parent name from parents table
        let name_ar = '', name_en = '';
        const nameRes = await fetch(
          `${supabaseUrl}/rest/v1/parents?national_id=eq.${encodeURIComponent(username)}&select=name_ar,name_en`,
          {
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
            },
          }
        );
        if (nameRes.ok) {
          const nameData = await nameRes.json();
          if (nameData && nameData.length > 0) {
            name_ar = nameData[0].name_ar || '';
            name_en = nameData[0].name_en || '';
          }
        }
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

    // ── Step 3: Try students (by student_number — no password required) ──
    // Student numbers are purely numeric (5+ digits)
    if (/^\d{5,}$/.test(username)) {
      const stuRes = await fetch(
        `${supabaseUrl}/rest/v1/students?student_number=eq.${encodeURIComponent(username)}&select=name,class_name,student_number,grade_level,student_id&limit=1`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
        }
      );
      if (stuRes.ok) {
        const stuRows = await stuRes.json();
        if (stuRows && stuRows.length > 0) {
          const stu = stuRows[0];
          return new Response(
            JSON.stringify({
              ok: true,
              role_key: 'student',
              name_ar: stu.name,
              name_en: stu.name_en || stu.name,
              student_number: stu.student_number,
              class_name: stu.class_name,
              grade_level: stu.grade || '',
              student_id: String(stu.id),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Not found in any table
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
