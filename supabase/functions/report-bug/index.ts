import { serve } from "npm:@supabase/supabase-js@2";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      page_url,
      page_name,
      user_role,
      user_id,
      report_type = "user_report",
      description,
      error_details = {},
    } = body;

    // تحديد الخطورة تلقائياً
    let severity = "medium";
    if (report_type === "auto_js_error") severity = "high";
    if (report_type === "slow_page") severity = "low";
    if (report_type === "broken_link") severity = "medium";
    if (report_type === "user_report") severity = "medium";
    if (description?.includes("لا يعمل") || description?.includes("خطأ")) severity = "high";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // حفظ البلاغ
    const { data: report, error } = await supabase
      .from("bug_reports")
      .insert({
        page_url,
        page_name,
        user_role,
        user_id,
        report_type,
        severity,
        description,
        error_details,
        status: "new",
      })
      .select()
      .single();

    if (error) throw error;

    // إرسال إشعار فوري في broadcasts للمدير
    if (severity === "high" || report_type === "auto_js_error") {
      await supabase.from("broadcasts").insert({
        content: `🚨 بلاغ تقني جديد | الصفحة: ${page_name || page_url} | النوع: ${report_type} | ${description?.slice(0, 100) || "خطأ تلقائي"}`,
        broadcast_type: "alert",
      });
    }

    return new Response(JSON.stringify({ success: true, id: report.id, severity }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
