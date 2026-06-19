// ============================================================
// EduOS Edge Function: admin-operations v3
// الهدف: عمليات المدير الحساسة — تغيير إعدادات، حذف بيانات، نسخ احتياطية، معلمون بدلاء
// المسار: /functions/v1/admin-operations
// تحديث: npm: بدلاً من esm.sh | CORS متعدد الدومينات | add_sub_teacher
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://eduos.ae",
  "https://aljood.eduos.ae",
  "https://grade-dashboard-ruby.vercel.app",
  "https://demo.eduos.ae",
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

      // ─── إعدادات النظام ───
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

      // ─── نسخة احتياطية ───
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

      // ─── سجل التدقيق ───
      case "get_audit_log": {
        const { data: logs } = await serviceClient
          .from("notification_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        result = { logs: logs || [] };
        break;
      }

      // ─── إعادة ضبط درجات طالب ───
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

      // ─── إضافة معلم بديل ───
      case "add_sub_teacher": {
        const { full_name, username, subject, class_name, contract_start_date, contract_end_date } = payload || {};
        if (!full_name || !username || !contract_start_date || !contract_end_date) {
          return new Response(JSON.stringify({ error: "full_name, username, contract_start_date, contract_end_date مطلوبة" }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        // إنشاء حساب Auth
        const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
          email: `${username}@aljood.edu.ae`,
          password: "AlJood@2026",
          email_confirm: true,
          user_metadata: { role: "sub_teacher", full_name, username },
        });
        if (authErr) {
          return new Response(JSON.stringify({ error: authErr.message }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        // إضافة في staff_profiles
        const { error: profErr } = await serviceClient.from("staff_profiles").insert({
          id: authData.user.id,
          full_name,
          username,
          email: `${username}@aljood.edu.ae`,
          role: "sub_teacher",
          subject: subject || null,
          class_name: class_name || null,
          is_sub_teacher: true,
          contract_start_date,
          contract_end_date,
          force_password_change: true,
          created_at: new Date().toISOString(),
        });
        if (profErr) {
          // حذف حساب Auth إذا فشل الإدخال
          await serviceClient.auth.admin.deleteUser(authData.user.id);
          return new Response(JSON.stringify({ error: profErr.message }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        // تسجيل في notification_log
        await serviceClient.from("notification_log").insert({
          type: "sub_teacher_added", actor: user.email, actor_role: userRole,
          action: "add_sub_teacher", target: username,
          created_at: new Date().toISOString(),
        });
        result = { added: true, user_id: authData.user.id, username, temp_password: "AlJood@2026" };
        break;
      }

      // ─── تمديد عقد معلم بديل ───
      case "extend_sub_teacher": {
        const { staff_id, new_end_date } = payload || {};
        if (!staff_id || !new_end_date) {
          return new Response(JSON.stringify({ error: "staff_id و new_end_date مطلوبان" }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        const { error: extErr } = await serviceClient
          .from("staff_profiles")
          .update({ contract_end_date: new_end_date })
          .eq("id", staff_id)
          .eq("is_sub_teacher", true);
        result = { extended: !extErr, staff_id, new_end_date };
        break;
      }

      // ─── حذف معلم بديل ───
      case "delete_sub_teacher": {
        const { staff_id } = payload || {};
        if (!staff_id) {
          return new Response(JSON.stringify({ error: "staff_id مطلوب" }), {
            status: 400, headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        // حذف من staff_profiles أولاً
        const { error: delProfErr } = await serviceClient
          .from("staff_profiles").delete()
          .eq("id", staff_id).eq("is_sub_teacher", true);
        // حذف من Auth
        const { error: delAuthErr } = await serviceClient.auth.admin.deleteUser(staff_id);
        result = { deleted: !delProfErr && !delAuthErr, staff_id };
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
