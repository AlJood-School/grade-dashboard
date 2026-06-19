// ============================================================
// EduOS Edge Function: change-password v1.0
// الهدف: تغيير كلمة مرور الموظف بأمان — يُعيد force_password_change = false
// المسار: /functions/v1/change-password
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://eduos.ae",
  "https://aljood.eduos.ae",
  "https://grade-dashboard-ruby.vercel.app",
];

function getCors(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const cors = getCors(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { username, old_password, new_password } = await req.json();

    if (!username || !old_password || !new_password) {
      return new Response(JSON.stringify({ error: "بيانات ناقصة" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // التحقق من قوة كلمة المرور الجديدة
    if (new_password.length < 8) {
      return new Response(JSON.stringify({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!/[A-Z]/.test(new_password)) {
      return new Response(JSON.stringify({ error: "يجب أن تحتوي على حرف كبير واحد على الأقل" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!/[0-9]/.test(new_password)) {
      return new Response(JSON.stringify({ error: "يجب أن تحتوي على رقم واحد على الأقل" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (new_password === old_password) {
      return new Response(JSON.stringify({ error: "كلمة المرور الجديدة يجب أن تختلف عن القديمة" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // استخدام Service Role للعمليات الحساسة
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // التحقق من كلمة المرور القديمة
    const { data: verifyData, error: verifyError } = await supabase.rpc("verify_password", {
      p_username: username,
      p_password: old_password,
    });

    if (verifyError || !verifyData) {
      return new Response(JSON.stringify({ error: "كلمة المرور القديمة غير صحيحة" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // تحديث كلمة المرور وإلغاء إجبار التغيير
    const { error: updateError } = await supabase.rpc("update_staff_password", {
      p_username: username,
      p_new_password: new_password,
    });

    if (updateError) {
      console.error("update error:", updateError);
      return new Response(JSON.stringify({ error: "فشل تحديث كلمة المرور" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "تم تغيير كلمة المرور بنجاح" }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "خطأ داخلي" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
