// ============================================================
// ATHEER — Agentic AI Engine
// © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
//
// The brain of Atheer. Receives signals in real-time,
// decides whether to observe, adapt, or intervene.
//
// Loop: OBSERVE → THINK → DECIDE → ACT → LOG
//
// POST /api/atheer/agent
// Body: { student_id, signal_type, signal_data, context }
//
// Returns: { action, params, reasoning }
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zuyizaiugpmhmeycqton.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0.FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI';

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const ALLOWED_ORIGINS = [
  'https://aljood.eduos.ae',
  'https://eduos-core.vercel.app',
  'https://www.eduos.ae',
  'https://eduos.ae'
];

// ── Supabase helpers ──────────────────────────────────────
async function sbFetch(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function sbUpsert(table, data, onConflict) {
  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
    if (onConflict) headers['Prefer'] = `return=minimal,resolution=merge-duplicates`;
    
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${onConflict ? '?on_conflict=' + onConflict : ''}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return r.ok;
  } catch { return false; }
}

async function sbUpdate(table, match, data) {
  try {
    const params = Object.entries(match).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    return r.ok;
  } catch { return false; }
}

// ── Agent State Management ────────────────────────────────
async function getStudentState(studentId) {
  const state = await sbFetch(`atheer_agent_state?student_id=eq.${encodeURIComponent(studentId)}&limit=1`);
  return state?.[0] || null;
}

async function getActiveGoals(studentId) {
  return await sbFetch(`atheer_agent_goals?student_id=eq.${encodeURIComponent(studentId)}&status=eq.active&order=created_at.desc&limit=5`) || [];
}

async function getRecentActions(studentId, limit = 5) {
  return await sbFetch(`atheer_agent_actions?student_id=eq.${encodeURIComponent(studentId)}&order=created_at.desc&limit=${limit}`) || [];
}

async function getRecentSignals(studentId, limit = 10) {
  return await sbFetch(`atheer_signals?student_id=eq.${encodeURIComponent(studentId)}&order=created_at.desc&limit=${limit}`) || [];
}

// ── Fast Decision Engine (rule-based, no LLM needed) ──────
function fastDecide(signal, state, recentSignals) {
  const { signal_type, signal_data, sentiment, severity } = signal;
  
  // ── CRITICAL: High severity → immediate alert ──
  if (severity >= 3) {
    return {
      action: 'alert_teacher',
      params: {
        urgency: 'high',
        reason: `إشارة عالية الخطورة (${severity}) من ${signal_type}`,
        signal_summary: signal_data
      },
      reasoning: 'إشارة بمستوى خطورة عالٍ تستدعي تنبيه المعلم فوراً'
    };
  }

  // ── Count recent negative signals (DB + state streak) ──
  const dbNegative = recentSignals.filter(s => 
    s.sentiment === 'concern' || s.severity >= 2
  ).length;
  // Use the HIGHER of DB count or state streak (handles race conditions)
  const recentNegative = Math.max(dbNegative, state?.streak_negative || 0);

  // ── PATTERN: Repeated struggle ──
  if (recentNegative >= 3) {
    // Check if we already intervened recently
    const lastIntervention = state?.last_intervention;
    const timeSinceLast = lastIntervention?.created_at 
      ? (Date.now() - new Date(lastIntervention.created_at).getTime()) / 60000 
      : Infinity;

    if (timeSinceLast < 10) {
      // Already intervened within 10 min → observe
      return {
        action: 'observe',
        params: { note: 'تدخل حديث — مراقبة النتائج' },
        reasoning: 'تم التدخل قبل أقل من 10 دقائق — ننتظر ونراقب'
      };
    }

    return {
      action: 'adapt_difficulty',
      params: {
        direction: 'easier',
        strategy: state?.active_strategy || 'visual',
        confidence: Math.min(recentNegative / 5, 1.0)
      },
      reasoning: `${recentNegative} إشارات سلبية في الفترة الأخيرة — تبسيط المحتوى`
    };
  }

  // ── PATTERN: Disengagement (login only, no interaction) ──
  if (signal_type === 'session_end') {
    const sessionDuration = signal_data?.duration_seconds || 0;
    const interactionCount = signal_data?.interactions || 0;
    
    if (sessionDuration > 120 && interactionCount < 2) {
      return {
        action: 'suggest_activity',
        params: {
          type: 'interactive',
          reason: 'engagement_low',
          suggestion: 'جرّب نشاطاً تفاعلياً — ربما طريقة مختلفة تناسبك أكثر'
        },
        reasoning: 'جلسة طويلة بدون تفاعل حقيقي — يحتاج نشاط محفّز'
      };
    }
  }

  // ── PATTERN: Positive streak → increase challenge ──
  const dbPositive = recentSignals.filter(s => 
    s.sentiment === 'positive' || (s.signal_data?.understanding >= 4)
  ).length;
  const recentPositive = Math.max(dbPositive, state?.streak_positive || 0);

  if (recentPositive >= 3 && recentNegative === 0) {
    return {
      action: 'adapt_difficulty',
      params: {
        direction: 'harder',
        confidence: Math.min(recentPositive / 5, 1.0)
      },
      reasoning: `${recentPositive} إشارات إيجابية متتالية — رفع مستوى التحدي`
    };
  }

  // ── SINGLE concern signal → note but don't overreact ──
  if (sentiment === 'concern' || severity >= 2) {
    return {
      action: 'observe',
      params: { 
        note: 'إشارة قلق واحدة — نراقب',
        mood_shift: 'struggling' 
      },
      reasoning: 'إشارة سلبية واحدة — لا نتسرع في التدخل'
    };
  }

  // ── DEFAULT: Observe ──
  return {
    action: 'observe',
    params: { note: 'إشارة طبيعية' },
    reasoning: 'لا يوجد نمط يستدعي تدخلاً'
  };
}

// ── Deep Decision Engine (Gemini for complex cases) ───────
async function deepDecide(signal, state, goals, recentSignals) {
  if (!GEMINI_KEY) return null;

  const prompt = `أنت وكيل تعليمي ذكي اسمه "أثير". مهمتك تحليل إشارة طالب واتخاذ قرار.

## حالة الطالب الحالية:
- المزاج: ${state?.current_mood || 'غير محدد'}
- مستوى التفاعل: ${state?.engagement_level || 0.5}
- الاستراتيجية الحالية: ${state?.active_strategy || 'لا يوجد'}
- سلسلة إيجابية: ${state?.streak_positive || 0}
- سلسلة سلبية: ${state?.streak_negative || 0}

## أهداف نشطة:
${goals.map(g => `- ${g.goal_type}: ${g.description} (${g.status})`).join('\n') || 'لا أهداف'}

## آخر 5 إشارات:
${recentSignals.slice(0, 5).map(s => `- ${s.signal_type}: ${s.sentiment} (خطورة ${s.severity})`).join('\n')}

## الإشارة الجديدة:
- النوع: ${signal.signal_type}
- المشاعر: ${signal.sentiment}
- الخطورة: ${signal.severity}
- البيانات: ${JSON.stringify(signal.signal_data || {}).slice(0, 300)}

## قرر واحداً من:
1. observe — راقب بدون تدخل
2. adapt_difficulty — غيّر الصعوبة (easier/harder)
3. suggest_activity — اقترح نشاط بديل
4. encourage — شجّع الطالب
5. alert_teacher — نبّه المعلم
6. create_goal — أنشئ هدف تعلّم جديد
7. adjust_goal — عدّل هدف قائم

أجب بـ JSON فقط:
{"action": "...", "params": {...}, "reasoning": "...", "new_goal": null | {"goal_type": "...", "description": "...", "target_metric": {...}}}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            responseMimeType: 'application/json'
          }
        })
      }
    );
    
    if (!r.ok) return null;
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ── Update Agent State ───────────────────────────────────
async function updateState(studentId, signal, decision) {
  const currentState = await getStudentState(studentId) || {};
  
  // Summarize signal (no raw text — per Noor's architecture decision)
  const signalSummary = {
    type: signal.signal_type,
    sentiment: signal.sentiment,
    severity: signal.severity,
    time: new Date().toISOString()
  };
  
  // Keep last 5 signals only
  const recentSignals = [signalSummary, ...(currentState.recent_signals || [])].slice(0, 5);
  
  // Update streaks
  let streakPos = currentState.streak_positive || 0;
  let streakNeg = currentState.streak_negative || 0;
  
  if (signal.sentiment === 'positive') {
    streakPos++;
    streakNeg = 0;
  } else if (signal.sentiment === 'concern') {
    streakNeg++;
    streakPos = 0;
  }

  // Calculate mood
  let mood = 'neutral';
  if (streakPos >= 3) mood = 'confident';
  else if (streakNeg >= 3) mood = 'struggling';
  else if (streakNeg >= 2) mood = 'anxious';
  else if (signal.sentiment === 'positive') mood = 'neutral';
  
  // Calculate engagement
  const engagement = Math.max(0, Math.min(1, 
    0.5 + (streakPos * 0.1) - (streakNeg * 0.15)
  ));

  const stateUpdate = {
    student_id: studentId,
    current_mood: mood,
    engagement_level: engagement,
    active_strategy: decision.params?.strategy || currentState.active_strategy || null,
    difficulty_level: decision.action === 'adapt_difficulty' 
      ? (decision.params?.direction === 'easier' ? 'easier' : 'harder')
      : (currentState.difficulty_level || 'auto'),
    recent_signals: recentSignals,
    intervention_count: (currentState.intervention_count || 0) + (decision.action !== 'observe' ? 1 : 0),
    last_intervention: decision.action !== 'observe' 
      ? { action: decision.action, created_at: new Date().toISOString() }
      : currentState.last_intervention,
    streak_positive: streakPos,
    streak_negative: streakNeg,
    updated_at: new Date().toISOString()
  };

  await sbUpsert('atheer_agent_state', stateUpdate, 'student_id');
  return stateUpdate;
}

// ── Log Agent Action ─────────────────────────────────────
async function logAction(studentId, decision, goalId = null) {
  if (decision.action === 'observe') return; // Don't log observations
  
  await sbUpsert('atheer_agent_actions', {
    student_id: studentId,
    goal_id: goalId,
    action_type: decision.action,
    action_data: decision.params || {},
    reasoning: decision.reasoning || ''
  });
}

// ── Create Goal (if Gemini suggests one) ──────────────────
async function createGoal(studentId, goalData) {
  if (!goalData) return;
  
  await sbUpsert('atheer_agent_goals', {
    student_id: studentId,
    goal_type: goalData.goal_type,
    description: goalData.description,
    target_metric: goalData.target_metric || {},
    current_value: {},
    status: 'active',
    strategy: goalData.strategy || null
  });
}

// ── Main Handler ─────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { student_id, signal_type, signal_data, sentiment, severity } = req.body || {};
  
  if (!student_id || !signal_type) {
    return res.status(400).json({ error: 'student_id and signal_type required' });
  }

  try {
    const signal = {
      signal_type,
      signal_data: signal_data || {},
      sentiment: sentiment || 'neutral',
      severity: severity || 0
    };

    // ── SAVE: Record the signal (backup — platform-atheer.js also saves) ──
    sbUpsert('atheer_signals', {
      student_id,
      signal_type,
      signal_source: 'agent-direct',
      signal_data: signal_data || {},
      sentiment: sentiment || 'neutral',
      severity: severity || 0,
      student_name: req.body.student_name || '',
      grade_level: req.body.grade_level || '',
      class_name: req.body.class_name || ''
    }).catch(() => {}); // fire-and-forget

    // ── OBSERVE: Gather context ──
    const [state, goals, recentSignals] = await Promise.all([
      getStudentState(student_id),
      getActiveGoals(student_id),
      getRecentSignals(student_id, 10)
    ]);

    // ── THINK + DECIDE: Fast path first ──
    let decision = fastDecide(signal, state, recentSignals);

    // ── DEEP THINK: Use Gemini for complex cases ──
    const isComplex = (
      severity >= 2 ||
      (state?.streak_negative || 0) >= 2 ||
      goals.length > 0 ||
      decision.action !== 'observe'
    );

    if (isComplex && GEMINI_KEY) {
      const deepResult = await deepDecide(signal, state, goals, recentSignals);
      if (deepResult) {
        decision = {
          action: deepResult.action || decision.action,
          params: deepResult.params || decision.params,
          reasoning: deepResult.reasoning || decision.reasoning
        };
        // Create goal if suggested
        if (deepResult.new_goal) {
          await createGoal(student_id, deepResult.new_goal);
        }
      }
    }

    // ── ACT: Update state + log action ──
    const [newState] = await Promise.all([
      updateState(student_id, signal, decision),
      logAction(student_id, decision, goals[0]?.id)
    ]);

    return res.status(200).json({
      ok: true,
      decision: {
        action: decision.action,
        params: decision.params,
        reasoning: decision.reasoning
      },
      state: {
        mood: newState.current_mood,
        engagement: newState.engagement_level,
        difficulty: newState.difficulty_level,
        strategy: newState.active_strategy,
        streak: {
          positive: newState.streak_positive,
          negative: newState.streak_negative
        }
      }
    });

  } catch (err) {
    console.error('[ATHEER-AGENT] Error:', err.message);
    return res.status(500).json({ error: 'Agent error', details: err.message });
  }
}
