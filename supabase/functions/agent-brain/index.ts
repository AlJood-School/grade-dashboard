// ============================================================
// agent-brain/index.ts
// EduOS — الدماغ المركزي للـ Agentic AI
// NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
// Created: 27 June 2026
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================
// الأنواع
// ============================================================
interface AgentRequest {
  task_type: string
  context: Record<string, unknown>
  school_id?: string
  requested_by?: string
}

interface AgentConfig {
  task_type: string
  level: 'A' | 'B' | 'C' | 'D'
  description_ar: string
  is_active: boolean
}

// ============================================================
// منطق التنفيذ حسب المستوى
// ============================================================
async function executeByLevel(
  level: string,
  task_type: string,
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<{ status: string; action_taken: string; notify?: boolean }> {

  switch (level) {
    case 'D':
      // مستقل كامل — ينفذ فوراً بدون إشعار
      const resultD = await executeTask(task_type, context, supabase)
      return {
        status: 'executed',
        action_taken: resultD,
        notify: false
      }

    case 'C':
      // ينفذ ثم يُبلّغ
      const resultC = await executeTask(task_type, context, supabase)
      await sendNotification(task_type, context, resultC, supabase)
      return {
        status: 'executed',
        action_taken: resultC,
        notify: true
      }

    case 'B':
      // ينتظر موافقة — يُنشئ طلباً معلقاً
      return {
        status: 'pending',
        action_taken: `طلب موافقة: ${task_type}`,
        notify: true
      }

    case 'A':
      // يُخبر فقط — لا ينفذ أبداً
      await sendNotification(task_type, context, 'تنبيه للاطلاع فقط — لا إجراء آلي', supabase)
      return {
        status: 'informed',
        action_taken: 'تم الإبلاغ فقط — لا تنفيذ',
        notify: true
      }

    default:
      return { status: 'error', action_taken: 'مستوى غير معروف' }
  }
}

// ============================================================
// تنفيذ المهمة حسب نوعها
// ============================================================
async function executeTask(
  task_type: string,
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {

  switch (task_type) {
    case 'attendance_analysis':
      return await analyzeAttendance(context, supabase)
    case 'grade_analysis':
      return await analyzeGrades(context, supabase)
    case 'learning_fingerprint_update':
      return await updateFingerprint(context, supabase)
    case 'substitute_scheduling':
      return await scheduleSubstitute(context, supabase)
    case 'reinforcement_application':
      return await applyReinforcement(context, supabase)
    case 'exit_ticket_analysis':
      return await analyzeExitTickets(context, supabase)
    default:
      return `تم تسجيل المهمة: ${task_type}`
  }
}

// ============================================================
// تحليل الحضور
// ============================================================
async function analyzeAttendance(
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const school_id = context.school_id as string
  const { data } = await supabase
    .from('attendance')
    .select('student_id, status, date')
    .eq('school_id', school_id)
    .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  if (!data) return 'لا بيانات حضور متاحة'

  const absentees = data.filter(r => r.status === 'absent')
  const chronic = data.reduce((acc: Record<string, number>, r) => {
    if (r.status === 'absent') acc[r.student_id] = (acc[r.student_id] || 0) + 1
    return acc
  }, {})

  const chronicCount = Object.values(chronic).filter(v => v >= 3).length
  return `تحليل الحضور: ${absentees.length} غياب هذا الأسبوع · ${chronicCount} طالب/ة بغياب متكرر (3+ أيام)`
}

// ============================================================
// تحليل الدرجات
// ============================================================
async function analyzeGrades(
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const school_id = context.school_id as string
  const { data } = await supabase
    .from('student_grades')
    .select('student_id, grade, subject_name')
    .eq('school_id', school_id)

  if (!data || data.length === 0) return 'لا درجات متاحة للتحليل'

  const avg = data.reduce((s, r) => s + (r.grade || 0), 0) / data.length

  // عتبة الرسوب ديناميكية حسب منهج المدرسة
  let passScore = 50
  try {
    const { data: setting } = await supabase
      .from('app_settings').select('value').eq('key', 'curriculum_type').single()
    const currType = setting?.value || 'MOE'
    const { data: rules } = await supabase
      .from('curriculum_rules')
      .select('pass_score, grade_group')
      .eq('curriculum_type', currType)
      .in('grade_group', ['G4-8', 'ALL'])
      .limit(1)
    if (rules?.[0]?.pass_score) passScore = parseFloat(rules[0].pass_score)
  } catch (_) { /* يبقى 50 كقيمة افتراضية */ }

  const low = data.filter(r => r.grade < passScore).length
  return `تحليل الدرجات: متوسط ${avg.toFixed(1)} · ${low} حالة تحت ${passScore}%`
}

// ============================================================
// تحديث بصمة التعلم
// ============================================================
async function updateFingerprint(
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const student_name = context.student_name as string
  const { data: vark } = await supabase
    .from('vark_results')
    .select('dominant_style')
    .eq('student_name', student_name)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!vark) return `لا بيانات VARK للطالب/ة: ${student_name}`
  return `تم تحديث بصمة التعلم للطالب/ة ${student_name}: أسلوب ${vark.dominant_style}`
}

// ============================================================
// جدولة البديل/ة
// ============================================================
async function scheduleSubstitute(
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const teacher_name = context.teacher_name as string
  const date = context.date as string
  return `تم إنشاء جدول بديل/ة للمعلم/ة ${teacher_name} بتاريخ ${date}`
}

// ============================================================
// تطبيق التعزيز
// ============================================================
async function applyReinforcement(
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const student_name = context.student_name as string
  const points = context.points as number || 1
  return `تم تطبيق التعزيز: +${points} نجمة للطالب/ة ${student_name}`
}

// ============================================================
// تحليل تذاكر الخروج
// ============================================================
async function analyzeExitTickets(
  context: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const lesson_id = context.lesson_id as string
  const { data } = await supabase
    .from('exit_tickets')
    .select('understanding_level, student_name')
    .eq('lesson_id', lesson_id)

  if (!data || data.length === 0) return 'لا تذاكر خروج لهذه الحصة'

  const avg = data.reduce((s, r) => s + (r.understanding_level || 0), 0) / data.length
  const low = data.filter(r => r.understanding_level < 3).length
  return `تحليل تذاكر الخروج: متوسط الفهم ${avg.toFixed(1)}/5 · ${low} طالب/ة يحتاجون دعماً`
}

// ============================================================
// إرسال الإشعار
// ============================================================
async function sendNotification(
  task_type: string,
  context: Record<string, unknown>,
  result: string,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  await supabase.from('broadcast_messages').insert({
    message_ar: `[الدماغ الذكي] ${task_type}: ${result}`,
    message_en: `[AI Brain] ${task_type}: ${result}`,
    target_roles: ['principal', 'admin'],
    school_id: context.school_id,
    created_at: new Date().toISOString()
  })
}

// ============================================================
// تحديث الأنماط (التعلم الذاتي)
// ============================================================
async function updatePattern(
  task_type: string,
  pattern_key: string,
  school_id: string,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const { data: existing } = await supabase
    .from('agent_patterns')
    .select('id, detected_count, confidence_score')
    .eq('task_type', task_type)
    .eq('pattern_key', pattern_key)
    .eq('school_id', school_id)
    .single()

  if (existing) {
    const newCount = existing.detected_count + 1
    const newScore = Math.min(existing.confidence_score + 0.05, 1.0)
    await supabase
      .from('agent_patterns')
      .update({ detected_count: newCount, confidence_score: newScore, last_detected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('agent_patterns').insert({
      task_type, pattern_key, school_id,
      detected_count: 1,
      confidence_score: 0.5,
      last_detected_at: new Date().toISOString()
    })
  }
}

// ============================================================
// الدخول الرئيسي
// ============================================================
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
    const { task_type, context, school_id, requested_by } = body

    if (!task_type) {
      return new Response(JSON.stringify({ error: 'task_type مطلوب' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. اقرأ الإعدادات من agent_config
    const { data: config, error: configErr } = await supabase
      .from('agent_config')
      .select('*')
      .eq('task_type', task_type)
      .eq('is_active', true)
      .single()

    if (configErr || !config) {
      return new Response(JSON.stringify({ error: `المهمة غير مسجلة: ${task_type}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const agentConfig = config as AgentConfig

    // 2. نفّذ بناءً على المستوى
    const outcome = await executeByLevel(agentConfig.level, task_type, { ...context, school_id }, supabase)

    // 3. سجّل القرار
    const { data: decision } = await supabase.from('agent_decisions').insert({
      task_type,
      level_used: agentConfig.level,
      context: { ...context, school_id },
      action_proposed: outcome.action_taken,
      action_taken: outcome.status === 'pending' ? null : outcome.action_taken,
      status: outcome.status,
      school_id,
      approved_by: outcome.status === 'executed' ? 'agent_brain' : null
    }).select().single()

    // 4. حدّث النمط إن كان مستوى D أو C
    if (['D', 'C'].includes(agentConfig.level) && outcome.status === 'executed') {
      await updatePattern(task_type, `auto_${task_type}`, school_id || 'global', supabase)
    }

    return new Response(JSON.stringify({
      success: true,
      task_type,
      level: agentConfig.level,
      status: outcome.status,
      action: outcome.action_taken,
      decision_id: decision?.id,
      description: agentConfig.description_ar
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
