// ============================================================
// EduOS Edge Function: admin-operations
// الهدف: عمليات المدير الحساسة — تغيير إعدادات، حذف بيانات، نسخ احتياطية
// المسار: /functions/v1/admin-operations
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://grade-dashboard-ruby.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // المدير والنائب فقط
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    const adminRoles = ["principal", "admin", "super_admin"];

    if (!adminRoles.includes(userRole)) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, payload } = await req.json();

    let result: Record<string, unknown> = {};

    switch (action) {
      case "update_settings":
        // تحديث إعداد واحد فقط
        if (!payload.key || payload.value === undefined) {
          return new Response(JSON.stringify({ error: "key and value required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: settErr } = await serviceClient
          .from("app_settings")
          .update({ value: payload.value, updated_at: new Date().toISOString() })
          .eq("key", payload.key);
        result = { updated: !settErr, key: payload.key };
        break;

      case "trigger_backup":
        // طلب نسخة احتياطية
        const { error: backErr } = await serviceClient
          .from("backup_requests")
          .insert({
            requested_by: user.email,
            requested_by_role: userRole,
            status: "pending",
            created_at: new Date().toISOString(),
          });
        result = { backup_requested: !backErr };
        break;

      case "get_audit_log":
        // قراءة سجل التدقيق
        const { data: logs } = await serviceClient
          .from("notification_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        result = { logs: logs || [] };
        break;

      case "reset_student_grades":
        // حذف درجات طالب (للمدير فقط)
        if (!payload.student_id) {
          return new Response(JSON.stringify({ error: "student_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // تسجيل أولاً
        await serviceClient.from("notification_log").insert({
          type: "grade_reset",
          actor: user.email,
          actor_role: userRole,
          action: "reset_student_grades",
          target: payload.student_id,
          created_at: new Date().toISOString(),
        });
        const { error: delErr } = await serviceClient
          .from("weekly_results")
          .delete()
          .eq("student_id", payload.student_id);
        result = { reset: !delErr, student_id: payload.student_id };
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // تسجيل كل عملية
    await serviceClient.from("notification_log").insert({
      type: "admin_operation",
      actor: user.email,
      actor_role: userRole,
      action,
      created_at: new Date().toISOString(),
    }).maybeSingle();

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Admin edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
