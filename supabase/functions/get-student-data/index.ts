// ============================================================
// EduOS Edge Function: get-student-data v2
// الهدف: قراءة بيانات الطالب بأمان — كل مستخدم يرى ما يخصه فقط
// المسار: /functions/v1/get-student-data
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    const { student_id } = await req.json();

    // ولي الأمر: أبناءه فقط
    if (userRole === "parent") {
      const allowedStudents = user.user_metadata?.children || [];
      if (!allowedStudents.includes(student_id)) {
        return new Response(JSON.stringify({ error: "Access denied to this student" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // الطالب: نفسه فقط
    if (userRole === "student") {
      const myId = user.user_metadata?.student_id;
      if (myId !== student_id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const [gradesRes, weeklyRes, summaryRes] = await Promise.all([
      serviceClient.from("student_grades").select("*").eq("student_id", student_id),
      serviceClient.from("weekly_results").select("*").eq("student_id", student_id).order("week_number"),
      serviceClient.from("student_semester_summary").select("*").eq("student_id", student_id),
    ]);

    return new Response(JSON.stringify({
      success: true, student_id,
      grades: gradesRes.data || [],
      weekly: weeklyRes.data || [],
      summary: summaryRes.data || [],
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("get-student-data error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...getCors(""), "Content-Type": "application/json" },
    });
  }
});
