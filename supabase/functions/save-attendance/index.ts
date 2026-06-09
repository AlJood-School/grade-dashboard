// ============================================================
// EduOS Edge Function: save-attendance
// الهدف: تسجيل الحضور بشكل آمن مع التحقق من GPS + QR
// المسار: /functions/v1/save-attendance
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://grade-dashboard-ruby.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCHOOL_LAT = 24.4539;
const SCHOOL_LNG = 54.3773;
const GEOFENCE_METERS = 150;
const QR_VALID_SECONDS = 60;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { staff_name, qr_token, latitude, longitude, device_id } = body;

    // 1. التحقق من وجود البيانات الأساسية
    if (!staff_name || !qr_token || !latitude || !longitude) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. التحقق من الموقع الجغرافي
    const distance = haversineDistance(latitude, longitude, SCHOOL_LAT, SCHOOL_LNG);
    if (distance > GEOFENCE_METERS) {
      // تسجيل محاولة مشبوهة
      await serviceClient.from("gate_entry_log").insert({
        staff_name,
        event: "suspicious_location",
        latitude,
        longitude,
        distance_meters: Math.round(distance),
        device_id,
        created_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({
        error: "Location outside school geofence",
        distance: Math.round(distance),
        allowed: GEOFENCE_METERS,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. التحقق من QR Token — يجب أن يكون موجوداً في attendance_qr_log
    const { data: qrRecord } = await serviceClient
      .from("attendance_qr_log")
      .select("*")
      .eq("token", qr_token)
      .gte("created_at", new Date(Date.now() - QR_VALID_SECONDS * 1000).toISOString())
      .single();

    if (!qrRecord) {
      await serviceClient.from("gate_entry_log").insert({
        staff_name,
        event: "invalid_qr",
        qr_token: qr_token.substring(0, 10) + "...",
        device_id,
        created_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ error: "Invalid or expired QR code" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. التحقق من عدم تكرار الحضور لنفس الموظف اليوم
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await serviceClient
      .from("staff_checkin_log")
      .select("id")
      .eq("staff_name", staff_name)
      .gte("created_at", `${today}T00:00:00`)
      .single();

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        message: "Already checked in today",
        staff_name,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 5. تسجيل الحضور
    const now = new Date();
    const checkInTime = now.toTimeString().split(" ")[0];
    const isLate = now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 45);

    await serviceClient.from("staff_checkin_log").insert({
      staff_name,
      qr_token,
      latitude,
      longitude,
      device_id,
      check_in_time: checkInTime,
      is_late: isLate,
      created_at: now.toISOString(),
    });

    // 6. تحديث QR ليظهر أنه استُخدم
    await serviceClient
      .from("attendance_qr_log")
      .update({ used_count: (qrRecord.used_count || 0) + 1 })
      .eq("id", qrRecord.id);

    return new Response(JSON.stringify({
      success: true,
      staff_name,
      check_in_time: checkInTime,
      is_late: isLate,
      message: isLate ? "تم التسجيل — متأخر" : "تم التسجيل بنجاح ✅",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
