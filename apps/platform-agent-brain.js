// ============================================================
// platform-agent-brain.js  v2.0
// EduOS — بوابة صلاحيات A-D المركزية
// NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
// Updated: 29 June 2026
//
// المستويات المعتمدة (اتفاق 27 يونيو 2026):
//   A — يلاحظ + يخبر فقط   (أمان مطلق — لا ينفذ أبداً)
//   B — يقترح + ينتظر موافقة (قرارات تمس الإنسان مباشرة)
//   C — ينفذ + يبلغ         (حساس لكن لا يحتمل التأخير)
//   D — مستقل كامل + يتعلم  (روتيني آمن)
//
// قاعدة ثابتة: أي قرار يمس إنساناً مباشرة = B أو C حداً أقصى
// auto_upgrade = false: لا ترقية بدون موافقة صريحة من نور
// ============================================================

(function(window) {
  'use strict';

  const BRAIN_URL    = 'https://zuyizaiugpmhmeycqton.supabase.co/functions/v1/agent-brain';
  const SB_URL       = 'https://zuyizaiugpmhmeycqton.supabase.co';
  const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTI3MDgsImV4cCI6MjA5NjU4ODcwOH0.jP8VGZ-K8VjjA7dqxAEPgmXH7KLMhyT4N-NXZV1iDyA';

  // ── خريطة المهام الثابتة (مصدر الحقيقة: agent_config في DB) ─────────────
  const LEVEL_MAP = {
    // A — يخبر فقط
    A: ['account_creation','account_deletion','financial_decision',
        'official_report','permission_change','policy_change'],
    // B — ينتظر موافقة
    B: ['at_risk_flag','class_reassignment','kg_activity_recommendation',
        'student_plan_edit','teacher_evaluation_suggestion','timetable_change'],
    // C — ينفذ + يبلغ
    C: ['exit_ticket_analysis','parent_notification','reinforcement_application',
        'specialist_alert','substitute_scheduling','timetable_conflict_fix','vark_update'],
    // D — مستقل كامل
    D: ['analytics_refresh','attendance_analysis','backup_verification',
        'daily_motd','grade_analysis','health_check','learning_fingerprint_update',
        'news_monitor','shield_monitoring','weekly_report_generation']
  };

  // ── مساعد: اجلب بيانات المستخدم/ة من الجلسة ────────────────────────────
  function _getUser() {
    try { return JSON.parse(sessionStorage.getItem('edoos_user') || '{}'); }
    catch { return {}; }
  }

  // ── المساعد الأساسي: اتصل بالدماغ ──────────────────────────────────────
  async function _callBrain(task_type, context = {}) {
    const user = _getUser();
    const school_id = user.school_id || context.school_id || 'aljood-001';
    try {
      const r = await fetch(BRAIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          task_type,
          context: { ...context, school_id },
          school_id,
          requested_by: user.name || 'portal'
        })
      });
      if (!r.ok) return { success: false, error: await r.text(), status: r.status };
      return await r.json();
    } catch(e) {
      return { success: false, error: String(e) };
    }
  }

  // ════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════

  // ── الدالة الرئيسية: نفّذ مهمة مع احترام مستواها ───────────────────────
  // الاستخدام: AgentBrain.run('grade_analysis', { ... })
  // يعيد: { level, status, action_taken, decision_id, needsApproval }
  async function run(task_type, context = {}) {
    const result = await _callBrain(task_type, context);
    if (!result.success && result.status !== undefined) {
      console.warn('[AgentBrain] Error:', result.error);
    }
    return result;
  }

  // ── جلب قرارات تنتظر الموافقة (مستوى B) ────────────────────────────────
  async function getPendingApprovals(limit = 20) {
    const user = _getUser();
    const school_id = user.school_id || 'aljood-001';
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/agent_decisions?school_id=eq.${school_id}&status=eq.pending&order=created_at.desc&limit=${limit}`,
        { headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY } }
      );
      return r.ok ? await r.json() : [];
    } catch { return []; }
  }

  // ── موافقة على قرار B معلّق ─────────────────────────────────────────────
  async function approveDecision(decision_id) {
    const user = _getUser();
    try {
      const r = await fetch(`${SB_URL}/rest/v1/agent_decisions?id=eq.${decision_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'approved',
          approved_by: user.name || 'principal',
          approved_at: new Date().toISOString()
        })
      });
      return r.ok;
    } catch { return false; }
  }

  // ── رفض قرار B معلّق ────────────────────────────────────────────────────
  async function rejectDecision(decision_id, reason = '') {
    const user = _getUser();
    try {
      const r = await fetch(`${SB_URL}/rest/v1/agent_decisions?id=eq.${decision_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: user.name || 'principal',
          approved_at: new Date().toISOString()
        })
      });
      return r.ok;
    } catch { return false; }
  }

  // ── جلب سجل القرارات ────────────────────────────────────────────────────
  async function getDecisions(limit = 50, statusFilter = 'all') {
    const user = _getUser();
    const school_id = user.school_id || 'aljood-001';
    try {
      let url = `${SB_URL}/rest/v1/agent_decisions?school_id=eq.${school_id}&order=created_at.desc&limit=${limit}`;
      if (statusFilter !== 'all') url += `&status=eq.${statusFilter}`;
      const r = await fetch(url, {
        headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY }
      });
      return r.ok ? await r.json() : [];
    } catch { return []; }
  }

  // ── جلب الأنماط التي تعلّمها الدماغ ────────────────────────────────────
  async function getPatterns(limit = 20) {
    const user = _getUser();
    const school_id = user.school_id || 'aljood-001';
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/agent_patterns?school_id=eq.${school_id}&order=confidence.desc&limit=${limit}`,
        { headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY } }
      );
      return r.ok ? await r.json() : [];
    } catch { return []; }
  }

  // ── جلب إحصاءات الدماغ ──────────────────────────────────────────────────
  async function getBrainStats() {
    const user = _getUser();
    const school_id = user.school_id || 'aljood-001';
    try {
      const [decisions, patterns] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/agent_decisions?school_id=eq.${school_id}&select=status`, {
          headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY }
        }).then(r => r.ok ? r.json() : []),
        fetch(`${SB_URL}/rest/v1/agent_patterns?school_id=eq.${school_id}&select=confidence`, {
          headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY }
        }).then(r => r.ok ? r.json() : [])
      ]);

      const total     = decisions.length;
      const pending   = decisions.filter(d => d.status === 'pending').length;
      const executed  = decisions.filter(d => d.status === 'executed' || d.status === 'approved').length;
      const rejected  = decisions.filter(d => d.status === 'rejected').length;
      const informed  = decisions.filter(d => d.status === 'informed').length;
      const successRate = total > 0 ? Math.round((executed / total) * 100) : 0;
      const avgConf   = patterns.length > 0
        ? Math.round(patterns.reduce((s,p) => s + (p.confidence||0), 0) / patterns.length * 100)
        : 0;

      return { total, pending, executed, rejected, informed, successRate, avgConf,
               patternsLearned: patterns.length };
    } catch { return { total:0, pending:0, executed:0, rejected:0, informed:0,
                        successRate:0, avgConf:0, patternsLearned:0 }; }
  }

  // ── جلب إعدادات المهام من agent_config ──────────────────────────────────
  async function getTaskConfig() {
    const user = _getUser();
    const school_id = user.school_id || 'aljood-001';
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/agent_config?school_id=eq.${school_id}&order=level,task_type`,
        { headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY } }
      );
      return r.ok ? await r.json() : [];
    } catch { return []; }
  }

  // ── تحديث مستوى مهمة (المدير/ة فقط — لا ترقية تلقائية) ─────────────────
  async function updateTaskLevel(task_type, new_level, school_id) {
    const user = _getUser();
    const sid = school_id || user.school_id || 'aljood-001';

    // منع الترقية التلقائية — يجب أن يكون الطلب من مستخدم/ة حقيقية
    if (!user.name) {
      console.warn('[AgentBrain] updateTaskLevel: يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/agent_config?task_type=eq.${task_type}&school_id=eq.${sid}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ level: new_level, updated_by: user.name })
        }
      );
      return r.ok;
    } catch { return false; }
  }

  // ── مساعد UI: أضف شارة "قرارات تنتظر" لأي عنصر ─────────────────────────
  async function attachPendingBadge(selectorOrElement) {
    const pending = await getPendingApprovals(1);
    if (!pending.length) return;

    const count = pending.length;
    const el = typeof selectorOrElement === 'string'
      ? document.querySelector(selectorOrElement)
      : selectorOrElement;
    if (!el) return;

    const badge = document.createElement('span');
    badge.style.cssText = `
      display:inline-flex;align-items:center;justify-content:center;
      background:#E53E3E;color:#fff;border-radius:50%;
      width:20px;height:20px;font-size:11px;font-weight:700;
      position:absolute;top:-6px;right:-6px;z-index:10;
    `;
    badge.textContent = count > 9 ? '9+' : count;
    el.style.position = 'relative';
    el.appendChild(badge);
  }

  // ── مساعد UI: عرض modal موافقة لقرار B ──────────────────────────────────
  function showApprovalModal(decision, onApprove, onReject) {
    const existing = document.getElementById('ab-approval-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'ab-approval-modal';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;
      display:flex;align-items:center;justify-content:center;font-family:Tajawal,Arial,sans-serif;
    `;
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:90%;
                  box-shadow:0 20px 60px rgba(0,0,0,.3);direction:rtl;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <div style="width:48px;height:48px;border-radius:12px;background:#FFF3CD;
                      display:flex;align-items:center;justify-content:center;font-size:24px;">🤖</div>
          <div>
            <div style="font-size:18px;font-weight:700;color:#1A202C;">قرار يحتاج موافقتك</div>
            <div style="font-size:13px;color:#718096;">مستوى B — يمس إنساناً مباشرة</div>
          </div>
        </div>
        <div style="background:#F7FAFC;border-radius:12px;padding:16px;margin-bottom:20px;">
          <div style="font-size:15px;color:#2D3748;font-weight:600;margin-bottom:8px;">
            ${decision.action_taken || decision.task_type}
          </div>
          ${decision.context_summary ? `<div style="font-size:13px;color:#718096;">${decision.context_summary}</div>` : ''}
          <div style="font-size:12px;color:#A0AEC0;margin-top:8px;">
            ${new Date(decision.created_at).toLocaleString('ar-AE')}
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <button id="ab-approve-btn" style="flex:1;padding:12px;background:#38A169;color:#fff;
                  border:none;border-radius:10px;font-size:15px;font-family:Tajawal,Arial;
                  font-weight:700;cursor:pointer;">✅ موافق</button>
          <button id="ab-reject-btn" style="flex:1;padding:12px;background:#E53E3E;color:#fff;
                  border:none;border-radius:10px;font-size:15px;font-family:Tajawal,Arial;
                  font-weight:700;cursor:pointer;">❌ رفض</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('ab-approve-btn').onclick = async () => {
      await approveDecision(decision.id);
      modal.remove();
      if (onApprove) onApprove(decision);
    };
    document.getElementById('ab-reject-btn').onclick = async () => {
      const reason = prompt('سبب الرفض (اختياري):') || '';
      await rejectDecision(decision.id, reason);
      modal.remove();
      if (onReject) onReject(decision);
    };

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  // ── تصدير API العام ──────────────────────────────────────────────────────
  window.AgentBrain = {
    run,
    getPendingApprovals,
    approveDecision,
    rejectDecision,
    getDecisions,
    getPatterns,
    getBrainStats,
    getTaskConfig,
    updateTaskLevel,
    attachPendingBadge,
    showApprovalModal,
    LEVEL_MAP
  };

  // ── تشغيل تلقائي: فحص القرارات المعلقة عند تحميل الصفحة ────────────────
  // (فقط لصفحات المدير/ة والمسؤولين)
  document.addEventListener('DOMContentLoaded', async () => {
    const user = _getUser();
    if (!['principal','admin','official'].includes(user.role)) return;

    const pending = await getPendingApprovals();
    if (!pending.length) return;

    // عرض مؤشر في الهيدر إن وجد
    const headerIndicator = document.querySelector('[data-pending-approvals]');
    if (headerIndicator) {
      headerIndicator.textContent = pending.length;
      headerIndicator.style.display = 'inline-flex';
    }

    // إشعار بسيط في أسفل الشاشة
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:#2D3748;color:#fff;padding:12px 24px;border-radius:12px;
      font-family:Tajawal,Arial;font-size:14px;z-index:9990;
      box-shadow:0 4px 20px rgba(0,0,0,.3);cursor:pointer;
      display:flex;align-items:center;gap:8px;
    `;
    toast.innerHTML = `
      <span style="background:#E53E3E;color:#fff;border-radius:50%;
                   width:22px;height:22px;display:inline-flex;align-items:center;
                   justify-content:center;font-size:12px;font-weight:700;">
        ${pending.length}
      </span>
      قرار${pending.length > 1 ? 'ات' : ''} تنتظر موافقتك — انقر للمراجعة
    `;
    toast.onclick = () => {
      window.location.href = '/apps/eduos-agent-control/';
    };
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  });

})(window);
