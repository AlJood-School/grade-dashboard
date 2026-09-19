import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { username } = await req.json()

    if (!username) {
      return new Response(JSON.stringify({ error: 'missing_username' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ابحث عن الموظف في staff_profiles
    const { data: staff, error: fetchErr } = await supabase
      .from('staff_profiles')
      .select('id, name_ar, email, username, is_active')
      .eq('username', username.trim())
      .single()

    if (fetchErr || !staff) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!staff.is_active) {
      return new Response(JSON.stringify({ error: 'inactive_account' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!staff.email) {
      return new Response(JSON.stringify({ error: 'no_email', message: 'لا يوجد بريد إلكتروني — تواصلي مع مدير النظام' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // أنشئ token جديد
    const token = crypto.randomUUID()

    // حدّث DB
    await supabase
      .from('staff_profiles')
      .update({
        invite_token: token,
        invite_sent_at: new Date().toISOString(),
        must_change_password: true
      })
      .eq('id', staff.id)

    // اقرأ RESEND_API_KEY
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_KEY) throw new Error('RESEND_API_KEY missing')

    // رابط إعادة التعيين
    const siteUrl = Deno.env.get('SITE_URL') || 'https://aljood.eduos.ae'
    const resetLink = `${siteUrl}/apps/eduos-set-password/?token=${token}&type=reset`

    // نص الإيميل
    const name = staff.name_ar || staff.username

    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #6C3DD6, #22D3EE); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">🎓</div>
      <h2 style="margin: 12px 0 4px; color: #1a1a2e;">بوابة الجود الذكية</h2>
    </div>
    <p style="font-size: 16px; color: #333; margin-bottom: 8px;">مرحباً <strong>${name}</strong>،</p>
    <p style="font-size: 15px; color: #555; line-height: 1.7; margin-bottom: 24px;">
      تلقينا طلب إعادة تعيين كلمة مرور حسابك في بوابة الجود.<br>
      اضغطي على الزر أدناه لتعيين كلمة مرور جديدة.
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6C3DD6, #22D3EE); color: #fff; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: bold;">
        تعيين كلمة مرور جديدة
      </a>
    </div>
    <p style="font-size: 13px; color: #999; text-align: center;">
      الرابط صالح لمدة 48 ساعة فقط.<br>
      إذا لم تطلبي هذا الإجراء، تجاهلي هذا الإيميل.
    </p>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
    <p style="font-size: 11px; color: #bbb; text-align: center;">
      NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712 · أبوظبي
    </p>
  </div>
</body>
</html>`

    // أرسل الإيميل عبر Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'بوابة الجود <noreply@aljood.eduos.ae>',
        to: [staff.email],
        subject: '🔑 إعادة تعيين كلمة مرور بوابة الجود',
        html: emailHtml
      })
    })

    const emailData = await emailRes.json()

    if (!emailRes.ok) {
      console.error('Resend error:', emailData)
      // fallback: أرسل للبريد الافتراضي إذا فشل الوزاري
      throw new Error('email_send_failed: ' + JSON.stringify(emailData))
    }

    return new Response(JSON.stringify({ success: true, email: staff.email }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'server_error', message: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
