// ============================================================
// platform-agent-brain.js
// EduOS — عميل الدماغ المركزي للـ Agentic AI
// NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
// Version: 1.0 — 28 June 2026
// ============================================================

(function(window) {
  'use strict';

  const AGENT_BRAIN_URL = 'https://zuyizaiugpmhmeycqton.supabase.co/functions/v1/agent-brain';
  const SUPABASE_URL    = 'https://zuyizaiugpmhmeycqton.supabase.co';
  const ANON_KEY        = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTI3MDgsImV4cCI6MjA5NjU4ODcwOH0.jP8VGZ-K8VjjA7dqxAEPgmXH7KLMhyT4N-NXZV1iDyA';

  // ============================================================
  // callAgentBrain — الدالة الرئيسية
  // task_type: string — نوع المهمة (من agent_config)
  // context:   object — السياق (school_id, student_name, ...)
  // ============================================================
  async function callAgentBrain(task_type, context = {}) {
    try {
      const user = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
      const school_id = user.school_id || context.school_id || 'aljood-001';

      const resp = await fetch(AGENT_BRAIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey':        ANON_KEY
        },
        body: JSON.stringify({
          task_type,
          context: { ...context, school_id },
          school_id,
          requested_by: user.name || 'portal'
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.warn('[AgentBrain] HTTP Error:', resp.status, err);
        return { success: false, error: err, status: resp.status };
      }

      return await resp.json();

    } catch (err) {
      console.warn('[AgentBrain] Network Error:', err);
      return { success: false, error: String(err) };
    }
  }

  // ============================================================
  // getAgentDecisions — اجلب آخر قرارات الدماغ من Supabase
  // limit: عدد القرارات المطلوبة (افتراضي 10)
  // statusFilter: 'all' | 'pending' | 'executed' | 'informed'
  // ============================================================
  async function getAgentDecisions(limit = 10, statusFilter = 'all') {
    try {
      const user = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
      const school_id = user.school_id || 'aljood-001';

      let url = `${SUPABASE_URL}/rest/v1/agent_decisions?school_id=eq.${school_id}&order=created_at.desc&limit=${limit}`;
      if (statusFilter !== 'all') url += `&status=eq.${statusFilter}`;

      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey':        ANON_KEY,
          'Accept':        'application/json'
        }
      });

      if (!resp.ok) return [];
      return await resp.json();

    } catch (err) {
      console.warn('[AgentBrain] getDecisions error:', err);
      return [];
    }
  }

  // ============================================================
  // getAgentConfig — اجلب إعدادات المهام النشطة
  // ============================================================
  async function getAgentConfig() {
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/agent_config?is_active=eq.true&order=task_type`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey':        ANON_KEY,
          'Accept':        'application/json'
        }
      });
      if (!resp.ok) return [];
      return await resp.json();
    } catch (err) {
      return [];
    }
  }

  // ============================================================
  // renderDecisionsPanel — يرسم لوحة القرارات في عنصر HTML
  // containerId: id العنصر الذي سيُرسم فيه
  // options: { limit, statusFilter, autoRefresh, refreshInterval }
  // ============================================================
  async function renderDecisionsPanel(containerId, options = {}) {
    const {
      limit          = 8,
      statusFilter   = 'all',
      autoRefresh    = true,
      refreshInterval = 60000
    } = options;

    const container = document.getElementById(containerId);
    if (!container) return;

    async function render() {
      const decisions = await getAgentDecisions(limit, statusFilter);

      const statusColors = {
        executed: '#22c55e',
        pending:  '#f59e0b',
        informed: '#60a5fa',
        error:    '#ef4444'
      };

      const statusLabels = {
        executed: 'منفَّذ ✅',
        pending:  'معلَّق ⏳',
        informed: 'إبلاغ فقط ℹ️',
        error:    'خطأ ❌'
      };

      const levelBadges = {
        A: { color: '#60a5fa', label: 'A — إبلاغ' },
        B: { color: '#f59e0b', label: 'B — موافقة' },
        C: { color: '#a78bfa', label: 'C — ينفذ+يُبلغ' },
        D: { color: '#22c55e', label: 'D — مستقل' }
      };

      if (!decisions || decisions.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;color:#94a3b8;padding:24px 0;font-family:Tajawal,Arial,sans-serif;">
            <div style="font-size:32px;margin-bottom:8px;">🤖</div>
            <div>لا قرارات مسجّلة بعد</div>
            <div style="font-size:12px;margin-top:4px;">الدماغ الذكي سيبدأ العمل عند أول استدعاء</div>
          </div>`;
        return;
      }

      let html = `<div style="display:flex;flex-direction:column;gap:8px;">`;
      for (const d of decisions) {
        const sc = statusColors[d.status] || '#94a3b8';
        const sl = statusLabels[d.status] || d.status;
        const lb = levelBadges[d.level_used] || { color:'#94a3b8', label: d.level_used };
        const date = d.created_at ? new Date(d.created_at).toLocaleString('ar-AE', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';

        html += `
          <div style="background:#1e2d3d;border-radius:10px;padding:12px 14px;border-right:3px solid ${sc};font-family:Tajawal,Arial,sans-serif;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="color:#e2e8f0;font-size:13px;font-weight:600;">${d.task_type || ''}</span>
              <div style="display:flex;gap:6px;align-items:center;">
                <span style="background:${lb.color}22;color:${lb.color};border-radius:4px;padding:2px 6px;font-size:11px;">${lb.label}</span>
                <span style="background:${sc}22;color:${sc};border-radius:4px;padding:2px 6px;font-size:11px;">${sl}</span>
              </div>
            </div>
            <div style="color:#94a3b8;font-size:12px;line-height:1.5;">${d.action_taken || d.action_proposed || '—'}</div>
            <div style="color:#475569;font-size:11px;margin-top:4px;text-align:left;">${date}</div>
          </div>`;
      }
      html += `</div>`;
      container.innerHTML = html;
    }

    await render();
    if (autoRefresh) {
      setInterval(render, refreshInterval);
    }
  }

  // ============================================================
  // triggerOnEvent — استدعاء agent-brain تلقائياً عند حدث معين
  // eventName: 'attendance_recorded' | 'grade_saved' | 'exit_ticket_submitted'
  // context: بيانات الحدث
  // ============================================================
  async function triggerOnEvent(eventName, context = {}) {
    const eventMap = {
      'attendance_recorded':    'attendance_analysis',
      'grade_saved':            'grade_analysis',
      'exit_ticket_submitted':  'exit_ticket_analysis',
      'vark_completed':         'learning_fingerprint_update',
      'reinforcement_applied':  'reinforcement_application',
      'teacher_absent':         'substitute_scheduling'
    };

    const task_type = eventMap[eventName];
    if (!task_type) return;

    const result = await callAgentBrain(task_type, context);
    if (result?.success) {
      console.info(`[AgentBrain] ✅ ${task_type} → ${result.status}: ${result.action}`);
    }
    return result;
  }

  // ============================================================
  // تصدير للـ window
  // ============================================================
  window.AgentBrain = {
    call:                callAgentBrain,
    getDecisions:        getAgentDecisions,
    getConfig:           getAgentConfig,
    renderDecisionsPanel: renderDecisionsPanel,
    triggerOnEvent:      triggerOnEvent
  };

  console.info('[AgentBrain] 🤖 EduOS Agentic AI Client v1.0 — جاهز');

})(window);
