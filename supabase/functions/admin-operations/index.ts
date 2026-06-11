// ============================================================
// EduOS Edge Function: admin-operations v2
// الهدف: عمليات المدير الحساسة — تغيير إعدادات، حذف بيانات، نسخ احتياطية
// المسار: /functions/v1/admin-operations
// تحديث: npm: بدلاً من esm.sh | CORS متعدد الدومينات
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
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
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    const adminRoles = ["principal", "admin", "super_admin"];

    if (!adminRoles.includes(userRole)) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, payload } = await req.json();
    let result: Record<string, unknown> = {};

    switch (action) {
      case "update_settings": {
        if (!payload.key || payload.value === undefined) {
          return new Response(JSON.stringify({ error: "key and value required" }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        const { error: settErr } = await serviceClient
          .from("app_settings")
          .update({ value: payload.value, updated_at: new Date().toISOString() })
          .eq("key", payload.key);
        result = { updated: !settErr, key: payload.key };
        break;
      }
      case "trigger_backup": {
        const { error: backErr } = await serviceClient
          .from("backup_requests")
          .insert({
            requested_by: user.email, requested_by_role: userRole,
            status: "pending", created_at: new Date().toISOString(),
          });
        result = { backup_requested: !backErr };
        break;
      }
      case "get_audit_log": {
        const { data: logs } = await serviceClient
          .from("notification_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        result = { logs: logs || [] };
        break;
      }
      case "reset_student_grades": {
        if (!payload.student_id) {
          return new Response(JSON.stringify({ error: "student_id required" }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        await serviceClient.from("notification_log").insert({
          type: "grade_reset", actor: user.email, actor_role: userRole,
          action: "reset_student_grades", target: payload.student_id,
          created_at: new Date().toISOString(),
        });
        const { error: delErr } = await serviceClient
          .from("weekly_results").delete().eq("student_id", payload.student_id);
        result = { reset: !delErr, student_id: payload.student_id };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Admin edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...getCors(""), "Content-Type": "application/json" },
    });
  }
});
