// ============================================================
// EduOS Edge Function: save-grades
// الهدف: حفظ درجات الطلاب بشكل آمن — service_role داخلي فقط
// المسار: /functions/v1/save-grades
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://grade-dashboard-ruby.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GradePayload {
  action: "upsert_weekly" | "upsert_semester" | "upsert_stream";
  data: Record<string, unknown>[];
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. التحقق من المصادقة
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // 2. التحقق من صحة الـ JWT مع Supabase
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. التحقق من الدور — المعلم أو المدير فقط
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    const allowedRoles = ["teacher", "principal", "admin", "vice_principal"];

    if (!allowedRoles.includes(userRole)) {
      return new Response(JSON.stringify({ error: "Forbidden: insufficient role" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. قراءة البيانات
    const payload: GradePayload = await req.json();

    if (!payload.action || !Array.isArray(payload.data) || payload.data.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. الكتابة بـ service_role — آمن تماماً (المفتاح سري في السيرفر)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (payload.action) {
      case "upsert_weekly":
        result = await serviceClient
          .from("weekly_results")
          .upsert(payload.data, { onConflict: "student_id,week_number,grade" });
        break;

      case "upsert_semester":
        result = await serviceClient
          .from("student_semester_summary")
          .upsert(payload.data, { onConflict: "student_id,semester,academic_year" });
        break;

      case "upsert_stream":
        // تحديد الجدول حسب الصف
        const grade = payload.data[0]?.grade_level as string;
        const table = grade === "G4" ? "stream_progress_g4" : "stream_progress_g3";
        result = await serviceClient
          .from(table)
          .upsert(payload.data, { onConflict: "student_id" });
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      console.error("DB Error:", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. تسجيل العملية في audit log
    await serviceClient.from("notification_log").insert({
      type: "grade_save",
      actor: user.email,
      actor_role: userRole,
      action: payload.action,
      records_count: payload.data.length,
      created_at: new Date().toISOString(),
    }).maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        action: payload.action,
        records: payload.data.length,
        saved_by: user.email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
