import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // التحقق من المستدعي
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    // التحقق من الدور
    const { data: callerProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('role_key')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !['admin', 'principal'].includes(callerProfile.role_key)) {
      return new Response(JSON.stringify({ error: 'مخصص للأدمن والمديرة فقط' }), { status: 403, headers: corsHeaders })
    }

    const body = await req.json()
    const { staff_db_id, send_all } = body
    const domain = Deno.env.get('SCHOOL_DOMAIN') || 'aljood.eduos.ae'
    const redirectTo = `https://${domain}/apps/eduos-set-password/`

    if (send_all) {
      // إرسال لجميع الموظفين النشطين
      const { data: allStaff } = await supabaseAdmin
        .from('staff_profiles')
        .select('id, username, name_ar')
        .eq('is_active', true)
        .not('username', 'is', null)

      const results: { username: string; ok: boolean; error?: string }[] = []

      for (const staff of (allStaff || [])) {
        const email = `${staff.username}@${domain}`
        const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo })
        if (!resetErr) {
          await supabaseAdmin.from('staff_profiles').update({
            invite_sent_at: new Date().toISOString(),
            must_change_password: true,
          }).eq('id', staff.id)
          results.push({ username: staff.username, ok: true })
        } else {
          results.push({ username: staff.username, ok: false, error: resetErr.message })
        }
        // تأخير قصير لتجنب rate limit
        await new Promise(r => setTimeout(r, 100))
      }

      const sent = results.filter(r => r.ok).length
      const failed = results.filter(r => !r.ok).length
      return new Response(JSON.stringify({ ok: true, sent, failed, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      // إرسال لموظف واحد
      if (!staff_db_id) return new Response(JSON.stringify({ error: 'staff_db_id مطلوب' }), { status: 400, headers: corsHeaders })

      const { data: staff } = await supabaseAdmin
        .from('staff_profiles')
        .select('id, username, name_ar')
        .eq('id', staff_db_id)
        .single()

      if (!staff) return new Response(JSON.stringify({ error: 'الموظف/ة غير موجود' }), { status: 404, headers: corsHeaders })

      const email = `${staff.username}@${domain}`
      const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetErr) return new Response(JSON.stringify({ error: resetErr.message }), { status: 400, headers: corsHeaders })

      await supabaseAdmin.from('staff_profiles').update({
        invite_sent_at: new Date().toISOString(),
        must_change_password: true,
      }).eq('id', staff_db_id)

      return new Response(JSON.stringify({ ok: true, email, name: staff.name_ar }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
})
