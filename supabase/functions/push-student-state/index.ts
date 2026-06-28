// ============================================================
// Edge Function: push-student-state (الجود → NAFAS)
// © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
// الغرض: يستقبل أحداث الطالب/ة من الجود ويدفعها لـ NAFAS student_state
// القرار المعتمد: 28 يونيو 2026
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── NAFAS Supabase (المستقبِل) ──
const NAFAS_URL = Deno.env.get("NAFAS_SUPABASE_URL") ?? "";
const NAFAS_SERVICE_KEY = Deno.env.get("NAFAS_SUPABASE_SERVICE_KEY") ?? "";

// ── الأحداث المسموح بإرسالها من الجود ──
const ALLOWED_EVENT_TYPES = new Set([
  "academic_decline",
  "attendance_alert",
  "grade_below_average",
  "exam_failed",
  "consistent_absence",
  "subject_weakness",
]);

// ── CORS Headers ──
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── التحقق من المصدر (الجود فقط) ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── قراءة الطلب ──
    const body = await req.json();
    const {
      student_id,
      school_id,
      event_type,
      severity = 1,
      payload = {},
    } = body;

    // ── التحقق من البيانات ──
    if (!student_id || typeof student_id !== "string") {
      return new Response(JSON.stringify({ error: "student_id required (text)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!event_type || !ALLOWED_EVENT_TYPES.has(event_type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid event_type",
          allowed: [...ALLOWED_EVENT_TYPES],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (![1, 2, 3].includes(Number(severity))) {
      return new Response(JSON.stringify({ error: "severity must be 1, 2, or 3" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── الاتصال بـ NAFAS Supabase ──
    if (!NAFAS_URL || !NAFAS_SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: "NAFAS Supabase credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const nafas = createClient(NAFAS_URL, NAFAS_SERVICE_KEY);

    // ── دفع الحدث إلى student_state ──
    const { data, error } = await nafas
      .from("student_state")
      .insert({
        student_id,
        school_id: school_id ?? null,
        source: "jood",
        event_type,
        namespace: `jood.${event_type}`,
        severity: Number(severity),
        payload: {
          ...payload,
          pushed_from: "aljood-portal",
          pushed_at: new Date().toISOString(),
        },
        data_freshness: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("NAFAS insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── تحديث push_count في student_state_sources ──
    await nafas.rpc("increment_source_push_count", { p_source: "jood" }).maybeSingle();

    // ── للأحداث الحرجة (severity=3): إشعار فوري ──
    if (Number(severity) === 3) {
      console.log(`🚨 CRITICAL EVENT: student=${student_id} event=${event_type}`);
      // TODO: هنا يمكن إضافة Edge Function لإشعار المرشد/ة الاجتماعي
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: data?.id,
        source: "jood",
        event_type,
        severity,
        nafas_recorded_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// للاستدعاء من الجود:
//
// const response = await supabase.functions.invoke('push-student-state', {
//   body: {
//     student_id: "12345",        // text
//     school_id: "uuid-here",     // optional
//     event_type: "academic_decline",
//     severity: 2,                // 1=ملاحظة 2=تنبيه 3=عاجل
//     payload: {
//       subject: "رياضيات",
//       grade: 42,
//       average: 65,
//       term: "T1"
//     }
//   }
// });
// ============================================================
