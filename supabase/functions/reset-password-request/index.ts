// ============================================================
// EduOS Edge Function: reset-password-request v2
// الهدف: إرسال رابط إعادة تعيين كلمة المرور الحقيقي (Supabase Recovery)
//        للبريد الرسمي للموظفة (@moe.sch.ae)
// v2: يستخدم auth.admin.generateLink بدلاً من UUID مخصص
// ============================================================
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

    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'missing_username' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ابحث عن الموظف في staff_profiles
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('id, name_ar, email, username, is_active')
      .eq('username', username.trim())
      .single()

    // لا نكشف إذا كان المستخدم موجوداً أم لا (أمان)
    if (!staff || !staff.is_active || !staff.email) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://aljood.eduos.ae'
    const redirectTo = `${siteUrl}/apps/eduos-set-password/`
    const authEmail = `${username.trim()}@aljood.eduos.ae`
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!

    let resetLink: string

    // أنشئ رابط استرداد Supabase الحقيقي
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: authEmail,
      options: { redirectTo }
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink error:', linkError)
      // fallback: UUID مخصص
      const token = crypto.randomUUID()
      await supabase.from('staff_profiles').update({
        invite_token: token,
        invite_sent_at: new Date().toISOString(),
        must_change_password: true
      }).eq('id', staff.id)
      resetLink = `${siteUrl}/apps/eduos-set-password/?token=${token}&type=reset`
    } else {
      resetLink = linkData.properties.action_link
    }

    // أرسل الإيميل عبر Resend للبريد الرسمي
    const name = staff.name_ar || staff.username
    const emailHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px; margin:0;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6C3DD6, #22D3EE); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 30px; line-height:1;">🎓</div>
      <h2 style="margin: 12px 0 4px; color: #1a1a2e; font-size:20px;">بوابة الجود الذكية</h2>
      <p style="margin:0; color:#6b7280; font-size:13px;">Powered by EduOS · NAFAS AI</p>
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
      الرابط صالح لمدة ساعة واحدة فقط.<br>
      إذا لم تطلبي هذا الإجراء، تجاهلي هذا الإيميل.
    </p>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
    <p style="font-size: 11px; color: #bbb; text-align: center;">
      NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712 · أبوظبي<br>
      © 2026 جميع الحقوق محفوظة
    </p>
  </div>
</body>
</html>`

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

    if (!emailRes.ok) {
      const emailErr = await emailRes.json()
      console.error('Resend error:', emailErr)
      throw new Error('email_send_failed')
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
