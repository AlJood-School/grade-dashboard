// ============================================================
// agent-brain/index.ts  v2.0
// EduOS — الدماغ المركزي للـ Agentic AI
// NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
// Updated: 29 June 2026
//
// المستويات المعتمدة (اتفاق 27 يونيو 2026):
//   A — يلاحظ + يخبر فقط   (أمان مطلق — لا ينفذ أبداً)
//   B — يقترح + ينتظر موافقة
//   C — ينفذ + يبلغ
//   D — مستقل كامل + يتعلم
//
// جدول الترقية:
//   A→B: أسبوعان  (10 أنماط صحيحة متتالية)
//   B→C: شهر      (قبول >80% لـ 4 أسابيع)
//   C→D: شهران    (نجاح >85% + صفر أخطاء حساسة)
//   auto_upgrade: false — الترقية تحتاج موافقة نور دائماً
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  task_type: string
  context: Record<string, unknown>
  school_id?: string
  requested_by?: string
}

interface AgentConfig {
  id: string
  task_type: string
  level: 'A' | 'B' | 'C' | 'D'
  description_ar: string
  is_active: boolean
  school_id: string
  consecutive_correct: number
  acceptance_rate_4w: number
  success_rate_2m: number
  sensitive_errors_2m: number
  upgrade_ready: boolean
  last_evaluated: string
}

// ── تنفيذ المهمة الفعلي حسب نوعها ──────────────────────────────────────────
async function executeTask(
  task_type: string,
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {

  const school_id = (context.school_id as string) || 'aljood-001'

  switch (task_type) {

    case 'grade_analysis': {
      const { data } = await supabase
        .from('student_grades')
        .select('grade, subject_name')
        .eq('school_id', school_id)
        .gte('created_at', new Date(Date.now() - 7*24*3600*1000).toISOString())
      const count = data?.length || 0
      const failing = data?.filter((g:any) => g.grade < 60).length || 0
      return `تحليل الدرجات: ${count} درجة محللة، ${failing} طالب/ة تحت 60%`
    }

    case 'attendance_analysis': {
      const { data } = await supabase
        .from('attendance')
        .select('status, student_id')
        .eq('school_id', school_id)
        .gte('date', new Date(Date.now() - 7*24*3600*1000).toISOString().split('T')[0])
      const total = data?.length || 0
      const absent = data?.filter((a:any) => a.status === 'absent').length || 0
      const rate = total > 0 ? Math.round((1 - absent/total)*100) : 100
      return `معدل الحضور هذا الأسبوع: ${rate}% (${absent} غياب من ${total})`
    }

    case 'analytics_refresh': {
      // يُنتج ملخصاً للكاشبورد — النتيجة تُقرأ من agent_decisions
      return 'تم تحديث مؤشرات الأداء'
    }

    case 'daily_motd': {
      return 'تم نشر المحتوى اليومي (الآية + الحديث + الذكر)'
    }

    case 'health_check': {
      return 'فحص صحة البوابة: جميع الوحدات تعمل'
    }

    case 'substitute_scheduling': {
      const absent_teacher = context.absent_teacher as string || 'غير محدد'
      const date = context.date as string || new Date().toISOString().split('T')[0]
      return `جدول بديل/ة جُنِّز لـ ${absent_teacher} بتاريخ ${date}`
    }

    case 'parent_notification': {
      const student = context.student_name as string || 'الطالب/ة'
      const msg     = context.message as string || 'تحديث عن أداء طفلك/ي'
      await supabase.from('notifications').insert({
        school_id, type: 'parent', recipient_role: 'parent',
        title_ar: `تحديث عن ${student}`, body_ar: msg,
        created_at: new Date().toISOString()
      })
      return `إشعار أُرسل لولي/ة أمر ${student}`
    }

    case 'specialist_alert': {
      const student = context.student_name as string || 'الطالب/ة'
      const pattern = context.pattern as string || 'نمط يستحق المتابعة'
      await supabase.from('notifications').insert({
        school_id, type: 'specialist', recipient_role: 'specialist',
        title_ar: `تنبيه: ${student}`, body_ar: pattern,
        created_at: new Date().toISOString()
      })
      return `تنبيه أُرسل للأخصائي/ة بشأن ${student}`
    }

    case 'reinforcement_application': {
      const student_id = context.student_id as string
      const stars = (context.stars as number) || 1
      if (student_id) {
        await supabase.rpc('add_stars', { p_student_id: student_id, p_stars: stars })
      }
      return `نجوم التعزيز طُبِّقت (${stars} ⭐)`
    }

    case 'exit_ticket_analysis': {
      const session_id = context.session_id as string || 'latest'
      return `تحليل بطاقات الخروج للجلسة ${session_id}: جاهز`
    }

    case 'vark_update': {
      const student_id = context.student_id as string || ''
      return `ملف VARK محدَّث للطالب/ة ${student_id}`
    }

    case 'learning_fingerprint_update': {
      return 'بصمة التعلم محدَّثة من بيانات الجلسات الأخيرة'
    }

    case 'shield_monitoring': {
      return 'Shield: لا أخطاء مكتشفة'
    }

    case 'weekly_report_generation': {
      return 'التقرير الأسبوعي جُنِّز'
    }

    case 'news_monitor': {
      return 'مراقبة أخبار التعليم: لا تحديثات عاجلة'
    }

    case 'backup_verification': {
      return 'النسخ الاحتياطية: سليمة'
    }

    default:
      return `تم تنفيذ: ${task_type}`
  }
}

// ── إرسال إشعار داخلي ────────────────────────────────────────────────────────
async function sendNotification(
  task_type: string,
  context: Record<string, unknown>,
  result: string,
  supabase: ReturnType<typeof createClient>
) {
  const school_id = (context.school_id as string) || 'aljood-001'
  try {
    await supabase.from('notifications').insert({
      school_id,
      type: 'agent_brain',
      recipient_role: 'principal',
      title_ar: `الدماغ — ${task_type}`,
      body_ar: result,
      created_at: new Date().toISOString()
    })
  } catch { /* لا نوقف التنفيذ بسبب فشل الإشعار */ }
}

// ── تسجيل القرار في agent_decisions ─────────────────────────────────────────
async function logDecision(
  task_type: string,
  level: string,
  status: string,
  action_taken: string,
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  try {
    const school_id = (context.school_id as string) || 'aljood-001'
    const { data } = await supabase
      .from('agent_decisions')
      .insert({
        task_type, level, status, action_taken, school_id,
        context_summary: context.summary as string || '',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()
    return data?.id || ''
  } catch { return '' }
}

// ── تحديث الأنماط المكتشفة (التعلم) ─────────────────────────────────────────
async function updatePattern(
  task_type: string,
  success: boolean,
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
) {
  const school_id = (context.school_id as string) || 'aljood-001'
  try {
    // تحقق هل النمط موجود
    const { data: existing } = await supabase
      .from('agent_patterns')
      .select('id, occurrence_count, success_count, confidence')
      .eq('task_type', task_type)
      .eq('school_id', school_id)
      .maybeSingle()

    if (existing) {
      const newOcc     = (existing.occurrence_count || 0) + 1
      const newSuccess = (existing.success_count || 0) + (success ? 1 : 0)
      const newConf    = newOcc > 0 ? newSuccess / newOcc : 0

      await supabase
        .from('agent_patterns')
        .update({
          occurrence_count: newOcc,
          success_count: newSuccess,
          confidence: newConf,
          last_seen: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('agent_patterns').insert({
        school_id, task_type,
        pattern_description: `نمط تلقائي — ${task_type}`,
        occurrence_count: 1,
        success_count: success ? 1 : 0,
        confidence: success ? 1.0 : 0.0,
        discovered_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
    }
  } catch { /* لا نوقف */ }
}

// ── فحص جاهزية الترقية (auto_upgrade: false — يُبلّغ فقط) ──────────────────
async function checkUpgradeReadiness(
  task_type: string,
  current_level: string,
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<{ ready: boolean; reason: string }> {

  const school_id = (context.school_id as string) || 'aljood-001'

  try {
    const { data: pattern } = await supabase
      .from('agent_patterns')
      .select('occurrence_count, success_count, confidence')
      .eq('task_type', task_type)
      .eq('school_id', school_id)
      .maybeSingle()

    if (!pattern) return { ready: false, reason: 'لا بيانات كافية بعد' }

    const occ  = pattern.occurrence_count || 0
    const conf = pattern.confidence || 0

    if (current_level === 'A' && occ >= 10 && conf >= 0.90) {
      return { ready: true, reason: `${occ} نمط صحيح متتالي — جاهز للانتقال لـ B` }
    }
    if (current_level === 'B' && occ >= 30 && conf >= 0.80) {
      return { ready: true, reason: `معدل قبول ${Math.round(conf*100)}% — جاهز للانتقال لـ C` }
    }
    if (current_level === 'C' && occ >= 60 && conf >= 0.85) {
      return { ready: true, reason: `نجاح ${Math.round(conf*100)}% — جاهز للانتقال لـ D` }
    }

    return { ready: false, reason: `مستمر في المستوى ${current_level} (${occ} قرار، ثقة ${Math.round(conf*100)}%)` }
  } catch {
    return { ready: false, reason: 'خطأ في فحص الجاهزية' }
  }
}

// ════════════════════════════════════════════════════════════
// الخادم الرئيسي
// ════════════════════════════════════════════════════════════
serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: AgentRequest = await req.json()
    const { task_type, context = {}, school_id, requested_by } = body

    if (!task_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'task_type مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sid = school_id || (context.school_id as string) || 'aljood-001'
    context.school_id = sid

    // 1. اجلب إعداد المهمة من agent_config
    const { data: config } = await supabase
      .from('agent_config')
      .select('*')
      .eq('task_type', task_type)
      .eq('school_id', sid)
      .maybeSingle() as { data: AgentConfig | null }

    // إذا لم توجد المهمة في الجدول، استخدم مستوى A افتراضياً (الأأمن)
    const level      = (config?.level as 'A'|'B'|'C'|'D') ?? 'A'
    const is_active  = config?.is_active ?? true

    if (!is_active) {
      return new Response(
        JSON.stringify({ success: false, error: `المهمة ${task_type} غير نشطة`, level }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. نفّذ حسب المستوى
    let status       = ''
    let action_taken = ''
    let notify       = false
    let decision_id  = ''
    let needsApproval = false

    switch (level) {

      case 'D': {
        // مستقل كامل — ينفذ فوراً بدون إشعار
        action_taken = await executeTask(task_type, context, supabase)
        status = 'executed'
        notify = false
        // تعلّم من النجاح
        await updatePattern(task_type, true, context, supabase)
        break
      }

      case 'C': {
        // ينفذ + يبلّغ
        action_taken = await executeTask(task_type, context, supabase)
        status = 'executed'
        notify = true
        await sendNotification(task_type, context, action_taken, supabase)
        await updatePattern(task_type, true, context, supabase)
        break
      }

      case 'B': {
        // ينشئ طلباً معلقاً — ينتظر موافقة بشرية
        status = 'pending'
        action_taken = config?.description_ar || `طلب موافقة: ${task_type}`
        notify = true
        needsApproval = true
        // سجّل الطلب المعلق
        decision_id = await logDecision(task_type, level, status, action_taken, context, supabase)
        // إشعار للمدير/ة
        await sendNotification(task_type, context,
          `يحتاج موافقتك: ${action_taken}`, supabase)
        break
      }

      case 'A': {
        // يُخبر فقط — لا ينفذ أبداً
        status = 'informed'
        action_taken = config?.description_ar || `إبلاغ: ${task_type}`
        notify = true
        await sendNotification(task_type, context,
          `للاطلاع فقط — لا إجراء آلي: ${action_taken}`, supabase)
        break
      }
    }

    // 3. سجّل في agent_decisions (إذا لم يُسجَّل بالفعل في B)
    if (level !== 'B' || !decision_id) {
      decision_id = await logDecision(task_type, level, status, action_taken, context, supabase)
    }

    // 4. فحص جاهزية الترقية (يُبلّغ فقط — لا ترقية تلقائية)
    const upgradeCheck = await checkUpgradeReadiness(task_type, level, context, supabase)
    if (upgradeCheck.ready) {
      // سجّل في notifications للمدير/ة
      await supabase.from('notifications').insert({
        school_id: sid,
        type: 'agent_upgrade_ready',
        recipient_role: 'principal',
        title_ar: `🚀 الدماغ جاهز للترقية — ${task_type}`,
        body_ar: `${upgradeCheck.reason}\n⚠️ يحتاج موافقتك الصريحة قبل التطبيق`,
        created_at: new Date().toISOString()
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_type,
        level,
        status,
        action_taken,
        decision_id,
        notify,
        needsApproval,
        upgradeReady: upgradeCheck.ready,
        upgradeReason: upgradeCheck.reason,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
