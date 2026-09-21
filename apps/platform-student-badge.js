/**
 * platform-student-badge.js
 * EduOS — مكوّن بادج + Tooltip الطالب
 * يُضمَّن في أي بوابة تعرض أسماء الطلاب
 */

(function(window) {
  'use strict';

  const VARK_AR = { V: 'بصري', A: 'سمعي', R: 'قرائي', K: 'حسّي' };
  const VARK_ICON = { V: '👁', A: '👂', R: '📖', K: '✋' };
  const ACTION_AR = { verbal: 'شفهي', written: 'كتابي', parent_summon: 'استدعاء' };
  const CAT_AR = { uniform: 'زي', book: 'كتاب', equipment: 'أدوات', behavior: 'سلوك', other: 'أخرى' };
  const DEG_AR = { 1: 'خفيف', 2: 'متوسط', 3: 'شديد' };

  const _cache = {};

  async function _fetch(sb, studentId, studentMeta) {
    if (_cache[studentId]) return _cache[studentId];
    // VARK: يُبحث بـ student_name لأن vark_results لا يحتوي student_id
    const studentName = studentMeta?.name || studentMeta?.student_name || (window._studentNameMap && window._studentNameMap[studentId]) || String(studentId);
    const studentClass = studentMeta?.class_name || studentMeta?.class || (window._studentClassMap && window._studentClassMap[studentId]) || '';
    const [beh, vark, homeroom] = await Promise.all([
      sb.from('behavior_incidents').select('action_type,violation_category,degree,created_at').eq('student_db_id', studentId).order('created_at', { ascending: false }).limit(5).then(r => r).catch(() => ({data:[]})),
      sb.from('vark_results').select('dominant_style,v_score,a_score,r_score,k_score').eq('student_name', studentName).eq('is_latest', true).limit(1).then(r => r).catch(() => ({data:[]})),
      sb.from('teacher_assignments').select('teacher_name_ar').eq('class_name', studentClass).eq('is_homeroom', true).limit(1).then(r => r).catch(() => ({data:[]}))
    ]);
    const varkRow = vark.data?.[0] || null;
    const data = {
      incidents: beh.data || [],
      vark: varkRow?.dominant_style || null,
      vark_scores: varkRow ? {V: varkRow.v_score, A: varkRow.a_score, R: varkRow.r_score, K: varkRow.k_score} : null,
      homeroom: homeroom.data?.[0]?.teacher_name_ar || null
    };
    _cache[studentId] = data;
    return data;
  }

  function _badgeHtml(data, student) {
    const count = data.incidents.length;
    const vark = data.vark;
    const hm = data.homeroom;
    const cls = student.class_name || student.class || '';
    let html = '<div class="eduos-student-badges" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">';
    if (count > 0) {
      const last = data.incidents[0];
      const deg = DEG_AR[last?.degree] || '';
      html += `<span class="eduos-badge-chip danger" title="آخر مخالفة: ${CAT_AR[last?.violation_category]||''} — ${ACTION_AR[last?.action_type]||''} (${deg})">⚠️ ${count} مخالفة</span>`;
    } else {
      html += '<span class="eduos-badge-chip success">✅ لا مخالفات</span>';
    }
    if (vark) html += `<span class="eduos-badge-chip info">${VARK_ICON[vark]||'📚'} ${VARK_AR[vark]||vark}</span>`;
    if (cls)  html += `<span class="eduos-badge-chip neutral">🏫 ${cls}</span>`;
    if (hm)   html += `<span class="eduos-badge-chip neutral">👩‍🏫 ${hm}</span>`;
    html += '</div>';
    return html;
  }

  function _tooltipHtml(data, student) {
    const count = data.incidents.length;
    let rows = '';
    data.incidents.slice(0,3).forEach(i => {
      rows += `<div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:4px;margin-top:4px;font-size:12px;">
        🔸 ${CAT_AR[i.violation_category]||i.violation_category||'—'} — ${ACTION_AR[i.action_type]||i.action_type||'—'} (${DEG_AR[i.degree]||'—'}) · ${(i.created_at||'').slice(0,10)}
      </div>`;
    });
    return `
      <div style="font-weight:700;margin-bottom:6px;font-size:14px;">${student.name || student.student_name || ''}</div>
      <div style="font-size:13px;">🏫 ${student.class_name||''} &nbsp;|&nbsp; 👩‍🏫 ${data.homeroom||'—'}</div>
      ${data.vark ? `<div style="font-size:13px;margin-top:4px;">${VARK_ICON[data.vark]||''} نمط التعلم: ${VARK_AR[data.vark]||data.vark}${data.vark_scores ? ' ('+['V','A','R','K'].map(x=>x+':'+data.vark_scores[x]).join(' / ')+')' : ''}</div>` : ''}
      <div style="font-size:13px;margin-top:4px;">⚠️ المخالفات: ${count}</div>
      ${rows}
    `;
  }

  // ── CSS ──
  function _injectCss() {
    if (document.getElementById('eduos-badge-css')) return;
    const s = document.createElement('style');
    s.id = 'eduos-badge-css';
    s.textContent = `
      .eduos-badge-chip { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:12px;font-family:'Tajawal',Arial,sans-serif;font-weight:700;white-space:nowrap; }
      .eduos-badge-chip.danger  { background:#FEE2E2;color:#991B1B; }
      .eduos-badge-chip.success { background:#D1FAE5;color:#065F46; }
      .eduos-badge-chip.info    { background:#DBEAFE;color:#1E40AF; }
      .eduos-badge-chip.neutral { background:#F1F5F9;color:#475569; }
      .eduos-tooltip-box {
        position:fixed;z-index:99999;background:rgba(15,23,42,0.97);color:#fff;
        padding:12px 16px;border-radius:12px;max-width:280px;min-width:200px;
        font-family:'Tajawal',Arial,sans-serif;line-height:1.6;
        box-shadow:0 8px 32px rgba(0,0,0,0.4);pointer-events:none;
        direction:rtl;text-align:right;transition:opacity .15s;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Tooltip singleton ──
  let _tip = null;
  function _getTooltip() {
    if (!_tip) {
      _tip = document.createElement('div');
      _tip.className = 'eduos-tooltip-box';
      _tip.style.opacity = '0';
      _tip.style.display = 'none';
      document.body.appendChild(_tip);
    }
    return _tip;
  }

  function _showTip(html, e) {
    const t = _getTooltip();
    t.innerHTML = html;
    t.style.display = 'block';
    setTimeout(() => { t.style.opacity = '1'; }, 10);
    _moveTip(e);
  }

  function _moveTip(e) {
    const t = _getTooltip();
    const x = e.clientX, y = e.clientY;
    const w = t.offsetWidth, h = t.offsetHeight;
    t.style.left = (x + 12 + w > window.innerWidth ? x - w - 12 : x + 12) + 'px';
    t.style.top  = (y + 12 + h > window.innerHeight ? y - h - 12 : y + 12) + 'px';
  }

  function _hideTip() {
    const t = _getTooltip();
    t.style.opacity = '0';
    setTimeout(() => { t.style.display = 'none'; }, 150);
  }

  // ── Public API ──

  /**
   * addBadgesToElement(el, student, sb)
   * يضيف بادجات تحت العنصر el ويضيف Tooltip عند hover
   * student: { id, name, class_name }
   * sb: supabase client
   */
  async function addBadgesToElement(el, student, sb) {
    _injectCss();
    const data = await _fetch(sb, student.id || student.student_id, student);
    const badgeEl = document.createElement('div');
    badgeEl.innerHTML = _badgeHtml(data, student);
    el.appendChild(badgeEl);
    const tipHtml = _tooltipHtml(data, student);
    el.style.cursor = 'pointer';
    el.addEventListener('mouseenter', e => _showTip(tipHtml, e));
    el.addEventListener('mousemove', _moveTip);
    el.addEventListener('mouseleave', _hideTip);
  }

  /**
   * initStudentTooltips(containerSelector, sb)
   * يُفعَّل على أي حاوية تحتوي على [data-student-id]
   */
  function initStudentTooltips(containerSelector, sb) {
    _injectCss();
    const els = document.querySelectorAll(containerSelector + ' [data-student-id]');
    els.forEach(async el => {
      const id = el.dataset.studentId;
      const name = el.dataset.studentName || el.textContent.trim();
      const cls  = el.dataset.className || '';
      const data = await _fetch(sb, id, {name, class_name: cls});
      const student = { id, name, class_name: cls };
      el.style.cursor = 'pointer';
      const tipHtml = _tooltipHtml(data, student);
      el.addEventListener('mouseenter', e => _showTip(tipHtml, e));
      el.addEventListener('mousemove', _moveTip);
      el.addEventListener('mouseleave', _hideTip);
    });
  }

  window.EduStudentBadge = { addBadgesToElement, initStudentTooltips };
})(window);
