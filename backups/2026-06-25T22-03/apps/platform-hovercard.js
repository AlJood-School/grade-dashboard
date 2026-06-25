// platform-hovercard.js v1.0
// EduOS — بطاقات التحويم للطلاب والموظفين
// NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712

(function () {
  'use strict';

  /* ── CSS ──────────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .edu-hc {
      position: fixed; z-index: 99999;
      background: rgba(13, 22, 40, 0.97);
      border: 1px solid rgba(108,61,214,0.45);
      border-radius: 16px; padding: 16px;
      width: 290px;
      backdrop-filter: blur(24px);
      box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,61,214,0.18);
      pointer-events: none;
      opacity: 0; transform: translateY(10px) scale(0.96);
      transition: opacity 0.17s ease, transform 0.17s ease;
      font-family: 'Tajawal', sans-serif; color: #F0F4FF;
      direction: rtl;
    }
    .edu-hc.hc-show { opacity: 1; transform: translateY(0) scale(1); }

    .hc-head {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 13px; padding-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .hc-av {
      width: 46px; height: 46px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 19px; font-weight: 800; flex-shrink: 0;
    }
    .hc-nm { font-size: 14px; font-weight: 800; line-height: 1.3; }
    .hc-sb { font-size: 11px; color: rgba(240,244,255,0.55); margin-top: 3px; }
    .hc-tag {
      display: inline-block; margin-top: 5px;
      padding: 2px 9px; border-radius: 20px;
      font-size: 10px; font-weight: 700;
    }
    .hc-rows { display: flex; flex-direction: column; gap: 7px; }
    .hc-r {
      display: flex; align-items: flex-start; gap: 7px;
      font-size: 12px;
    }
    .hc-ri { width: 18px; text-align: center; font-size: 13px; flex-shrink: 0; }
    .hc-rl { color: rgba(240,244,255,0.5); min-width: 68px; flex-shrink: 0; }
    .hc-rv { font-weight: 600; flex: 1; word-break: break-word; }
    .hc-bar-t {
      margin-top: 11px;
      background: rgba(255,255,255,0.06);
      border-radius: 6px; height: 7px; overflow: hidden;
    }
    .hc-bar-f { height: 100%; border-radius: 6px; transition: width 0.5s ease; }
    .hc-ft {
      margin-top: 11px; padding-top: 9px;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 10px; color: rgba(240,244,255,0.35);
      text-align: center; letter-spacing: 0.3px;
    }
    [data-hc-student], [data-hc-staff] { cursor: pointer; }
    [data-hc-student]:hover, [data-hc-staff]:hover { text-decoration: underline dotted rgba(108,61,214,0.6); }
  `;
  document.head.appendChild(style);

  const card = document.createElement('div');
  card.className = 'edu-hc';
  card.id = '_edu_hc_';
  document.body.appendChild(card);

  let _hideTimer = null;

  function _pos(e) {
    const mx = e.clientX, my = e.clientY;
    const cx = mx + 18, cy = my + 18;
    card.style.left = Math.min(cx, window.innerWidth - 308) + 'px';
    card.style.top  = Math.min(cy, window.innerHeight - 340) + 'px';
  }

  function _show(html, e) {
    clearTimeout(_hideTimer);
    card.innerHTML = html;
    _pos(e);
    card.classList.add('hc-show');
  }

  function _hide() {
    _hideTimer = setTimeout(() => card.classList.remove('hc-show'), 220);
  }

  const _COLORS = ['#6366f1','#10b981','#f43f5e','#0ea5e9','#8b5cf6','#f6c90e','#ec4899','#14b8a6','#f97316'];
  function _color(name) {
    let h = 0;
    for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return _COLORS[Math.abs(h) % _COLORS.length];
  }

  const _VARK = {
    V:{ ar:'بصري',   en:'Visual',      c:'#6366f1' },
    A:{ ar:'سمعي',   en:'Auditory',    c:'#10b981' },
    R:{ ar:'قرائي',  en:'Reading',     c:'#f59e0b' },
    K:{ ar:'حركي',   en:'Kinesthetic', c:'#ec4899' }
  };

  function _studentHTML(d) {
    const vark  = _VARK[d.vark] || { ar: d.vark||'—', en: d.vark||'—', c:'#6C3DD6' };
    const col   = d.color || _color(d.name);
    const att   = d.attendance != null ? +d.attendance : null;
    const grade = d.grade    != null ? +d.grade     : null;
    const attC  = att  == null ? '#94a3b8' : att  >= 90 ? '#10b981' : att  >= 75 ? '#f59e0b' : '#ef4444';
    const grC   = grade == null ? '#94a3b8' : grade >= 80 ? '#10b981' : grade >= 60 ? '#6C3DD6' : '#ef4444';
    const init  = (d.name||'؟').charAt(0);
    return `
      <div class="hc-head">
        <div class="hc-av" style="background:${col}1a;color:${col};border:2px solid ${col}">${init}</div>
        <div>
          <div class="hc-nm">${d.name||'—'}</div>
          <div class="hc-sb">الصف ${d.cls||'—'}${d.grade_level?' — السنة '+d.grade_level:''}</div>
          <span class="hc-tag" style="background:${vark.c}1a;color:${vark.c}">${vark.ar}</span>
        </div>
      </div>
      <div class="hc-rows">
        ${d.student_id||d.id ? `<div class="hc-r"><span class="hc-ri">🪪</span><span class="hc-rl">الرقم</span><span class="hc-rv">${d.student_id||d.id}</span></div>`:''}
        ${grade != null ? `<div class="hc-r"><span class="hc-ri">📊</span><span class="hc-rl">المعدل</span><span class="hc-rv" style="color:${grC}">${grade}%</span></div>`:''}
        ${att  != null ? `<div class="hc-r"><span class="hc-ri">📅</span><span class="hc-rl">الحضور</span><span class="hc-rv" style="color:${attC}">${att}%</span></div>`:''}
        ${d.inclusion ? `<div class="hc-r"><span class="hc-ri">♿</span><span class="hc-rl">الدعم</span><span class="hc-rv" style="color:#f59e0b">${d.inclusion}</span></div>`:''}
        ${d.notes     ? `<div class="hc-r"><span class="hc-ri">📝</span><span class="hc-rl">ملاحظة</span><span class="hc-rv" style="color:rgba(240,244,255,0.7)">${d.notes}</span></div>`:''}
        ${d.guardian  ? `<div class="hc-r"><span class="hc-ri">👨‍👩‍👧</span><span class="hc-rl">ولي الأمر</span><span class="hc-rv">${d.guardian}</span></div>`:''}
      </div>
      ${att != null ? `<div class="hc-bar-t"><div class="hc-bar-f" style="width:${att}%;background:${attC}"></div></div>`:''}
      <div class="hc-ft">🖱️ انقر للملف الكامل</div>
    `;
  }

  const _ROLES = {
    teacher:        { ar:'معلم',           ic:'👩‍🏫', c:'#6366f1' },
    principal:      { ar:'مدير',           ic:'🏫',  c:'#6C3DD6' },
    vice_principal: { ar:'وكيل',           ic:'🏫',  c:'#8b5cf6' },
    social_worker:  { ar:'أخصائي اجتماعي', ic:'🤝',  c:'#10b981' },
    nurse:          { ar:'ممرض',           ic:'🏥',  c:'#ef4444' },
    counselor:      { ar:'مرشد',           ic:'💬',  c:'#f59e0b' },
    admin:          { ar:'إداري',          ic:'⚙️',  c:'#94a3b8' },
    security:       { ar:'أمن',            ic:'🔐',  c:'#64748b' },
  };

  function _staffHTML(d) {
    const role = _ROLES[d.role] || { ar: d.role||'—', ic:'👤', c:'#6C3DD6' };
    const name = d.full_name || d.name || '—';
    const isUAE = d.nationality === 'UAE' || d.is_emirati === true || d.is_emirati === 'true';
    return `
      <div class="hc-head">
        <div class="hc-av" style="background:${role.c}1a;color:${role.c};border:2px solid ${role.c};font-size:22px">${role.ic}</div>
        <div>
          <div class="hc-nm">${name}</div>
          <div class="hc-sb">${role.ar}${d.subject?' — '+d.subject:''}</div>
          ${isUAE ? `<span class="hc-tag" style="background:rgba(16,185,129,0.15);color:#10b981">🇦🇪 مواطن</span>` : ''}
        </div>
      </div>
      <div class="hc-rows">
        ${d.qualification    ? `<div class="hc-r"><span class="hc-ri">🎓</span><span class="hc-rl">المؤهل</span><span class="hc-rv">${d.qualification}</span></div>`:''}
        ${d.years_experience ? `<div class="hc-r"><span class="hc-ri">📆</span><span class="hc-rl">الخبرة</span><span class="hc-rv">${d.years_experience} سنة</span></div>`:''}
        ${d.email            ? `<div class="hc-r"><span class="hc-ri">📧</span><span class="hc-rl">البريد</span><span class="hc-rv" style="font-size:11px">${d.email}</span></div>`:''}
        ${d.phone            ? `<div class="hc-r"><span class="hc-ri">📞</span><span class="hc-rl">الجوال</span><span class="hc-rv">${d.phone}</span></div>`:''}
        ${d.pdp_status       ? `<div class="hc-r"><span class="hc-ri">📈</span><span class="hc-rl">خطة التطوير</span><span class="hc-rv" style="color:${d.pdp_status==='active'?'#10b981':'#f59e0b'}">${d.pdp_status==='active'?'✅ نشطة':'⏳ قيد الإعداد'}</span></div>`:''}
        ${d.appraisal_score  ? `<div class="hc-r"><span class="hc-ri">⭐</span><span class="hc-rl">تقييم الأداء</span><span class="hc-rv" style="color:#f6c90e">${d.appraisal_score}/6</span></div>`:''}
      </div>
      <div class="hc-ft">🖱️ انقر لملف الموظف</div>
    `;
  }

  function attachStudent(el, data) {
    el.addEventListener('mouseenter', e => _show(_studentHTML(data), e));
    el.addEventListener('mousemove',  e => _pos(e));
    el.addEventListener('mouseleave', _hide);
  }

  function attachStaff(el, data) {
    el.addEventListener('mouseenter', e => _show(_staffHTML(data), e));
    el.addEventListener('mousemove',  e => _pos(e));
    el.addEventListener('mouseleave', _hide);
  }

  function _scan() {
    document.querySelectorAll('[data-hc-student]:not([data-hcr])').forEach(el => {
      try { attachStudent(el, JSON.parse(decodeURIComponent(el.dataset.hcStudent))); el.setAttribute('data-hcr','1'); } catch(e) {}
    });
    document.querySelectorAll('[data-hc-staff]:not([data-hcr])').forEach(el => {
      try { attachStaff(el, JSON.parse(decodeURIComponent(el.dataset.hcStaff))); el.setAttribute('data-hcr','1'); } catch(e) {}
    });
  }

  window.EduHoverCard = { attachStudent, attachStaff, scan: _scan, colorFor: _color };

  const _obs = new MutationObserver(_scan);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _scan(); _obs.observe(document.body, { childList: true, subtree: true }); });
  } else {
    _scan();
    _obs.observe(document.body, { childList: true, subtree: true });
  }
})();
