// ============================================================
// EduOS Edge Function: parent-login v1.0
// الهدف: تسجيل دخول ولي الأمر بأمان تام
// المدخلات: national_id + password (= رقم الهاتف)
// التحقق: SHA256(password) === parents.password_hash
// المخرجات: session_token + بيانات الأبناء + درجاتهم
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** SHA-256 نصي → hex */
async function sha256hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { national_id, password } = await req.json();

    if (!national_id?.trim() || !password?.trim()) {
      return json({ error: "أدخل رقم الهوية وكلمة المرور" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. جلب ولي الأمر بالرقم الوطني
    const { data: parentRows, error: parentErr } = await supabase
      .from("parents")
      .select("id, national_id, name_ar, name_en, phone, relationship, password_hash")
      .eq("national_id", national_id.trim())
      .limit(1);

    if (parentErr || !parentRows || parentRows.length === 0) {
      return json({ error: "رقم الهوية غير موجود في النظام" }, 401);
    }

    const parent = parentRows[0];

    // ── 2. التحقق من كلمة المرور (SHA256)
    const inputHash = await sha256hex(password.trim());
    if (inputHash !== parent.password_hash) {
      return json({ error: "كلمة المرور غير صحيحة — أدخل رقم هاتفك المسجّل في المدرسة" }, 401);
    }

    // ── 3. جلب الأبناء
    const { data: children, error: childErr } = await supabase
      .from("students")
      .select("id, name, grade, class_name, student_number, vark_style")
      .eq("parent_national_id", national_id.trim())
      .order("grade");

    if (childErr || !children || children.length === 0) {
      return json({ error: "لا يوجد طلاب مرتبطون بهذا الحساب" }, 404);
    }

    // ── 4. جلب درجات الأبناء من dash_grades
    const studentNos = children.map((c: any) => c.student_number).filter(Boolean);

    const { data: grades } = await supabase
      .from("dash_grades")
      .select("student_no, student_name, grade, section, sb1, effort, total_school, end_of_term")
      .in("student_no", studentNos);

    // ── 5. دمج الدرجات مع كل طفل
    const childrenWithGrades = children.map((child: any) => ({
      ...child,
      grades: (grades || []).filter((g: any) => g.student_no === child.student_number),
    }));

    // ── 6. تسجيل الجلسة في portal_sessions
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase.from("portal_sessions").insert({
      session_token: token,
      user_type: "parent",
      parent_national_id: national_id.trim(),
      expires_at: expiresAt,
    });

    // ── 7. الرد النهائي
    return json({
      success: true,
      session_token: token,
      expires_at: expiresAt,
      parent: {
        name_ar: parent.name_ar || "ولي الأمر",
        name_en: parent.name_en || "",
        relationship: parent.relationship || "ولي أمر",
        national_id: national_id.trim(),
      },
      children: childrenWithGrades,
    });
  } catch (e: any) {
    return json({ error: e.message || "خطأ داخلي في الخادم" }, 500);
  }
});
