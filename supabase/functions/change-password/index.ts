// ============================================================
// EduOS Edge Function: change-password v2
// الهدف: تغيير كلمة مرور الموظف بأمان
//   - يتحقق من كلمة المرور القديمة عبر Supabase Auth
//   - يُغيّر كلمة مرور Supabase Auth الفعلية عبر Admin API
//   - يُحدّث staff_profiles: password_changed_at + change_source='self'
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://eduos.ae',
  'https://aljood.eduos.ae',
  'https://grade-dashboard-ruby.vercel.app',
]

function getCors(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const cors = getCors(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const { username, old_password, new_password } = await req.json()

    if (!username || !old_password || !new_password) {
      return new Response(JSON.stringify({ error: 'بيانات ناقصة' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // فحص قوة كلمة المرور الجديدة
    if (new_password.length < 8) {
      return new Response(JSON.stringify({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (!/[A-Z]/.test(new_password)) {
      return new Response(JSON.stringify({ error: 'يجب أن تحتوي على حرف كبير واحد على الأقل' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (!/[0-9]/.test(new_password)) {
      return new Response(JSON.stringify({ error: 'يجب أن تحتوي على رقم واحد على الأقل' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (new_password === old_password) {
      return new Response(JSON.stringify({ error: 'كلمة المرور الجديدة يجب أن تختلف عن القديمة' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // تحقق من كلمة المرور القديمة عبر Supabase Auth
    const authEmail = `${username.trim()}@aljood.eduos.ae`
    const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
      email: authEmail,
      password: old_password,
    })

    if (signInErr || !signInData?.user) {
      return new Response(JSON.stringify({ error: 'كلمة المرور الحالية غير صحيحة' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const authUserId = signInData.user.id

    // حدِّث كلمة مرور Supabase Auth الفعلية
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: new_password,
    })

    if (updateErr) {
      console.error('updateUserById error:', updateErr)
      return new Response(JSON.stringify({ error: 'فشل تحديث كلمة المرور — حاولي مرة أخرى' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // حدِّث staff_profiles
    await supabaseAdmin
      .from('staff_profiles')
      .update({
        password_changed_at: new Date().toISOString(),
        change_source: 'self',
        must_change_password: false,
        force_password_change: false,
      })
      .eq('username', username.trim())

    // سجِّل في audit log
    await supabaseAdmin.from('staff_points_log').insert({
      staff_db_id: username,
      action: 'password_self_changed',
      points: 0,
      note: 'تغيير كلمة المرور الذاتي',
      created_at: new Date().toISOString(),
    }).select()

    return new Response(JSON.stringify({ success: true, message: 'تم تغيير كلمة المرور بنجاح' }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'خطأ داخلي في الخادم' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
