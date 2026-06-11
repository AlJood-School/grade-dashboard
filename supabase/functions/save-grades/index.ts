// ============================================================
// EduOS Edge Function: save-grades v2
// الهدف: حفظ درجات الطلاب بشكل آمن — service_role داخلي فقط
// المسار: /functions/v1/save-grades
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

interface GradePayload {
  action: "upsert_weekly" | "upsert_semester" | "upsert_stream";
  data: Record<string, unknown>[];
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
    const allowedRoles = ["teacher", "principal", "admin", "vice_principal"];
    if (!allowedRoles.includes(userRole)) {
      return new Response(JSON.stringify({ error: "Forbidden: insufficient role" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const payload: GradePayload = await req.json();
    if (!payload.action || !Array.isArray(payload.data) || payload.data.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

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
      case "upsert_stream": {
        const grade = payload.data[0]?.grade_level as string;
        const table = grade === "G4" ? "stream_progress_g4" : "stream_progress_g3";
        result = await serviceClient
          .from(table)
          .upsert(payload.data, { onConflict: "student_id" });
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, action: payload.action, records: payload.data.length }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...getCors(""), "Content-Type": "application/json" },
    });
  }
});
