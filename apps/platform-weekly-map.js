/**
 * platform-weekly-map.js — خريطة أسبوعي للمعلمة
 * EduOS — 2026
 * يعمل فقط في بوابة المعلمة (role_key === 'teacher')
 * يعتمد على: window.EduOS_SB + sessionStorage('edoos_user') + window.getPlatformWeek (اختياري)
 */
(function () {

  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('edoos_user') || '{}'); } catch (e) { user = {}; }
  if (!user || !user.id) return;

  var ROLE = user.role_key || user.role || '';
  if (ROLE !== 'teacher') return; // للمعلمة فقط

  var STAFF_ID = user.staff_db_id || user.id;
  var DAY_NAMES = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  var STATE = {
    offset: (function(){ var d = new Date().getDay(); return (d === 0 || d === 6) ? -1 : 0; }()), // 0=الأسبوع الحالي، موجب=سابق، -1=قادم
    classes: [], // [{className, subject, label}]
    sessions: [],
    plan: null,
    leaves: [],
    weekInfo: null,
    weekStart: null,
    weekEnd: null,
    loaded: false,
    ready: false
  };

  /* ─────────────────────── أدوات مساعدة ─────────────────────── */
  function escH(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function waitForSB(fn) {
    if (window.EduOS_SB) { fn(); return; }
    var tries = 0;
    var iv = setInterval(function () {
      if (window.EduOS_SB || ++tries > 30) { clearInterval(iv); if (window.EduOS_SB) fn(); }
    }, 300);
  }

  function toast(msg, isErr) {
    var t = document.getElementById('wm-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'wm-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;background:#1E293B;color:#fff;padding:12px 20px;border-radius:10px;font-family:Tajawal,Arial,sans-serif;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.25);opacity:0;transition:opacity .25s;max-width:320px';
      document.body.appendChild(t);
    }
    t.style.background = isErr ? '#DC2626' : '#1E293B';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.opacity = '0'; }, 2800);
  }

  function mondayOf(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    var diff = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
    d.setDate(d.getDate() - diff);
    return d;
  }
  function addDays(date, n) { var d = new Date(date); d.setDate(d.getDate() + n); return d; }
  function toISODate(d) { return d.toISOString().slice(0, 10); }
  function fmtShort(d) { return d.toLocaleDateString('ar-AE', { day: 'numeric', month: 'short' }); }

  function getWeekInfoFor(date) {
    try {
      if (window.EduWeek && window.EduWeek.weekNumber) return { weekNum: window.EduWeek.weekNumber, label: window.EduWeek.label || '' };
      if (window.getPlatformWeek) { var w = window.getPlatformWeek(date); return { weekNum: w.weekNum || w.week || 1, label: w.label || '' }; }
    } catch (e) {}
    return { weekNum: 1, label: '' };
  }

  /* ─────────────────────── CSS ─────────────────────── */
  function injectStyle() {
    if (document.getElementById('eos-wm-style')) return;
    var s = document.createElement('style');
    s.id = 'eos-wm-style';
    s.textContent = [
      '#plan-panel-weekly-map{font-family:Tajawal,Arial,sans-serif;direction:rtl}',
      '.wm-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:12px 18px;margin-bottom:16px;flex-wrap:wrap}',
      '.wm-nav-title{font-size:16px;font-weight:800;color:#1E293B}',
      '.wm-nav-btn{font-family:Tajawal,Arial,sans-serif;border:1.5px solid #E2E8F0;background:#F8FAFB;color:#334155;border-radius:9px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer}',
      '.wm-nav-btn:disabled{opacity:.4;cursor:not-allowed}',
      '.wm-health{background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:14px 18px;margin-bottom:16px}',
      '.wm-health-bar{height:12px;border-radius:7px;background:#F1F5F9;overflow:hidden;margin-top:8px}',
      '.wm-health-fill{height:100%;border-radius:7px;background:linear-gradient(90deg,#6C3DD6,#22D3EE)}',
      '.wm-plan-strip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#F8FAFB;border:1px solid #E2E8F0;border-radius:12px;padding:10px 16px;margin-bottom:16px;flex-wrap:wrap}',
      '.wm-table-wrap{overflow-x:auto;background:#fff;border:1px solid #E2E8F0;border-radius:14px}',
      '.wm-table{width:100%;border-collapse:collapse;min-width:640px}',
      '.wm-table th{background:#F8FAFB;color:#475569;font-size:13px;font-weight:800;padding:10px;border-bottom:2px solid #E2E8F0;text-align:center}',
      '.wm-table th:first-child,.wm-table td:first-child{text-align:right;padding-right:14px;min-width:140px}',
      '.wm-table td{padding:10px;border-bottom:1px solid #F1F5F9;text-align:center;font-size:18px;cursor:pointer;transition:background .15s}',
      '.wm-table td:hover{background:#F8FAFB}',
      '.wm-row-label{font-size:13px;font-weight:700;color:#1E293B}',
      '.wm-empty{text-align:center;color:#94A3B8;padding:40px 20px;font-size:14px}',
      '#eos-wm-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:9650;display:none;align-items:center;justify-content:center;padding:20px}',
      '#eos-wm-modal-backdrop.open{display:flex}',
      '#eos-wm-modal{background:#fff;border-radius:16px;width:min(440px,100%);max-height:80vh;overflow-y:auto;padding:20px;font-family:Tajawal,Arial,sans-serif;direction:rtl;color:#1E293B}',
      '.wm-modal-title{font-size:16px;font-weight:800;margin-bottom:12px}',
      '.wm-modal-sess{background:#F8FAFB;border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;margin-bottom:8px;font-size:13px}',
      '.wm-btn{font-family:Tajawal,Arial,sans-serif;border:none;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;margin-top:6px;margin-inline-end:6px}',
      '.wm-btn-brand{background:linear-gradient(135deg,#6C3DD6,#22D3EE);color:#fff}',
      '.wm-btn-ghost{background:#F1F5F9;color:#334155}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ─────────────────────── إضافة الزر والـ sub-panel ─────────────────────── */
  function buildNavButton() {
    if (document.getElementById('plan-btn-weekly-map')) return false;
    var refBtn = document.getElementById('plan-btn-lessons');
    if (!refBtn || !refBtn.parentNode) return false;
    var btn = document.createElement('button');
    btn.className = 'sub-nav-btn';
    btn.id = 'plan-btn-weekly-map';
    btn.innerHTML = '🗓️ خريطة أسبوعي / Weekly Map';
    btn.addEventListener('click', activateTab);
    refBtn.parentNode.insertBefore(btn, refBtn.nextSibling);
    return true;
  }

  function buildPanel() {
    if (document.getElementById('plan-panel-weekly-map')) return false;
    var refPanel = document.getElementById('plan-panel-lessons');
    var host = refPanel ? refPanel.parentNode : document.getElementById('panel-planning');
    if (!host) return false;
    var panel = document.createElement('div');
    panel.className = 'sub-panel';
    panel.id = 'plan-panel-weekly-map';
    panel.innerHTML = '<div class="eos-loading" style="text-align:center;color:#94A3B8;padding:30px">⏳ جارٍ التحميل…</div>';
    if (refPanel && refPanel.nextSibling) host.insertBefore(panel, refPanel.nextSibling);
    else host.appendChild(panel);

    var mbd = document.createElement('div');
    mbd.id = 'eos-wm-modal-backdrop';
    mbd.innerHTML = '<div id="eos-wm-modal"></div>';
    document.body.appendChild(mbd);
    mbd.addEventListener('mousedown', function (e) { if (e.target === mbd) closeModal(); });
    document.body.appendChild(mbd);
    return true;
  }

  function activateTab() {
    Array.prototype.forEach.call(document.querySelectorAll('[id^="plan-panel-"]'), function (p) { p.classList.remove('active'); });
    Array.prototype.forEach.call(document.querySelectorAll('[id^="plan-btn-"]'), function (b) { b.classList.remove('active'); });
    var panel = document.getElementById('plan-panel-weekly-map');
    var btn = document.getElementById('plan-btn-weekly-map');
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
    if (!STATE.ready) { waitForSB(loadEverything); }
  }

  function closeModal() {
    var bd = document.getElementById('eos-wm-modal-backdrop');
    if (bd) bd.classList.remove('open');
  }

  /* ─────────────────────── تحميل البيانات ─────────────────────── */
  function loadEverything() {
    var panel = document.getElementById('plan-panel-weekly-map');
    if (panel) panel.innerHTML = '<div class="eos-loading" style="text-align:center;color:#94A3B8;padding:30px">⏳ جارٍ التحميل…</div>';

    var monday = addDays(mondayOf(new Date()), -7 * STATE.offset);
    var friday = addDays(monday, 4);
    STATE.weekStart = monday;
    STATE.weekEnd = friday;
    STATE.weekInfo = getWeekInfoFor(monday);

    var sb = window.EduOS_SB;
    var wStartISO = monday.toISOString();
    var wEndISO = addDays(friday, 1).toISOString(); // نهاية اليوم

    Promise.all([
      sb.from('teacher_assignments').select('class_name,subject').eq('staff_db_id', STAFF_ID)
        .then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('lesson_sessions').select('*').eq('teacher_id', STAFF_ID).gte('created_at', wStartISO).lte('created_at', wEndISO)
        .then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('planning_records').select('*').eq('staff_db_id', STAFF_ID).eq('week_number', STATE.weekInfo.weekNum)
        .then(function (r) { return (r.data && r.data[0]) || null; }).catch(function () { return null; }),
      sb.from('leave_requests').select('*').eq('staff_db_id', STAFF_ID).gte('request_date', toISODate(monday)).lte('request_date', toISODate(friday))
        .then(function (r) { return r.data || []; }).catch(function () { return []; })
    ]).then(function (res) {
      var rawClasses = res[0];
      var seen = {}; var classes = [];
      rawClasses.forEach(function (r) {
        var key = (r.class_name || '') + '|' + (r.subject || '');
        if (seen[key] || !r.class_name) return;
        seen[key] = true;
        classes.push({ className: r.class_name, subject: r.subject || '', label: r.class_name + (r.subject ? ' ' + r.subject : '') });
      });
      STATE.classes = classes;
      STATE.sessions = res[1];
      STATE.plan = res[2];
      STATE.leaves = res[3];
      STATE.loaded = true;
      STATE.ready = true;
      render();
    }).catch(function () {
      var p = document.getElementById('plan-panel-weekly-map');
      if (p) p.innerHTML = '<div class="wm-empty">تعذّر تحميل بيانات الخريطة</div>';
    });
  }

  /* ─────────────────────── حسابات الخلايا ─────────────────────── */
  function sessionsFor(className, dayIdx) {
    var dayDate = addDays(STATE.weekStart, dayIdx);
    var dayStr = toISODate(dayDate);
    return STATE.sessions.filter(function (s) {
      if (!s.created_at) return false;
      var sameDay = s.created_at.slice(0, 10) === dayStr;
      if (!sameDay) return false;
      if (!className) return true;
      var cls = s.class_name || s.class || '';
      return cls === className || !cls;
    });
  }

  function leaveFor(dayIdx) {
    var dayDate = addDays(STATE.weekStart, dayIdx);
    var dayStr = toISODate(dayDate);
    return STATE.leaves.some(function (l) { return (l.request_date || '').slice(0, 10) === dayStr; });
  }

  function dutyFor(dayIdx) {
    try {
      if (window.EduDuty && typeof window.EduDuty.hasDutyOn === 'function') {
        var dayDate = addDays(STATE.weekStart, dayIdx);
        return !!window.EduDuty.hasDutyOn(dayDate);
      }
    } catch (e) {}
    return false;
  }

  function cellIcons(className, dayIdx) {
    var dayDate = addDays(STATE.weekStart, dayIdx);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var isFuture = dayDate > today;
    var sessions = sessionsFor(className, dayIdx);
    var icons = '';
    if (leaveFor(dayIdx)) icons += '🔴';
    if (dutyFor(dayIdx)) icons += '🕐';
    if (sessions.length) {
      icons += '📝';
      var hasReflect = sessions.some(function (s) { return !!s.post_lesson_data; });
      icons += hasReflect ? '✍️' : '⚪';
    } else if (!icons) {
      icons = isFuture ? '─' : '❌';
    }
    return icons;
  }

  function planStatusInfo() {
    if (!STATE.plan) return { icon: '❌', label: 'لا توجد خطة لهذا الأسبوع' };
    if (STATE.plan.status === 'submitted') return { icon: '✅', label: 'الخطة مُسلَّمة' };
    if (STATE.plan.status === 'draft') return { icon: '⚠️', label: 'الخطة مسودة (لم تُسلَّم بعد)' };
    return { icon: '⚠️', label: 'حالة الخطة: ' + (STATE.plan.status || '—') };
  }

  function computeHealth() {
    var planScore = STATE.plan ? (STATE.plan.status === 'submitted' ? 30 : 15) : 0;
    var totalCells = STATE.classes.length * 5;
    var doneCells = 0;
    STATE.classes.forEach(function (c) {
      for (var d = 0; d < 5; d++) {
        var s = sessionsFor(c.className, d);
        if (s.length) doneCells++;
      }
    });
    var activityScore = totalCells ? Math.round((doneCells / totalCells) * 70) : 0;
    return Math.min(100, planScore + activityScore);
  }

  /* ─────────────────────── العرض ─────────────────────── */
  function render() {
    var panel = document.getElementById('plan-panel-weekly-map');
    if (!panel) return;
    var wi = STATE.weekInfo;
    var rangeLabel = fmtShort(STATE.weekStart) + ' - ' + fmtShort(STATE.weekEnd);
    var health = computeHealth();
    var ps = planStatusInfo();

    var html = '<div class="wm-nav">' +
      '<button class="wm-nav-btn" id="wm-prev">◀ السابق</button>' +
      '<div class="wm-nav-title">الأسبوع ' + (wi.weekNum || '—') + ' (' + rangeLabel + ')</div>' +
      '<button class="wm-nav-btn" id="wm-next"' + (STATE.offset <= -1 ? ' disabled' : '') + '>التالي ▶</button>' +
    '</div>';

    html += '<div class="wm-health"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#334155">' +
      '<span>صحة الأسبوع</span><span>' + health + '%</span></div>' +
      '<div class="wm-health-bar"><div class="wm-health-fill" style="width:' + health + '%"></div></div></div>';

    html += '<div class="wm-plan-strip"><span>' + ps.icon + ' ' + escH(ps.label) + '</span>' +
      '<button class="wm-btn wm-btn-brand" id="wm-open-plan">' + (STATE.plan ? '📖 فتح الخطة' : '➕ إنشاء خطة') + '</button></div>';

    if (!STATE.classes.length) {
      html += '<div class="wm-empty">لا توجد صفوف مسندة إليك بعد</div>';
    } else {
      html += '<div class="wm-table-wrap"><table class="wm-table"><thead><tr><th></th>';
      DAY_NAMES.forEach(function (d) { html += '<th>' + d + '</th>'; });
      html += '</tr></thead><tbody>';
      STATE.classes.forEach(function (c) {
        html += '<tr><td class="wm-row-label">' + escH(c.label) + '</td>';
        for (var d = 0; d < 5; d++) {
          html += '<td class="wm-cell" data-class="' + escH(c.className) + '" data-label="' + escH(c.label) + '" data-day="' + d + '">' + cellIcons(c.className, d) + '</td>';
        }
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    }

    panel.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    var prev = document.getElementById('wm-prev');
    var next = document.getElementById('wm-next');
    if (prev) prev.addEventListener('click', function () { STATE.offset += 1; loadEverything(); });
    if (next) next.addEventListener('click', function () { if (STATE.offset > -1) { STATE.offset -= 1; loadEverything(); } });
    var openPlan = document.getElementById('wm-open-plan');
    if (openPlan) openPlan.addEventListener('click', function () {
      var lessonsBtn = document.getElementById('plan-btn-lessons');
      if (lessonsBtn) lessonsBtn.click();
      else if (typeof window.openNewWeeklyPlan === 'function') window.openNewWeeklyPlan();
    });
    Array.prototype.forEach.call(document.querySelectorAll('.wm-cell'), function (td) {
      td.addEventListener('click', function () {
        openCellModal(this.getAttribute('data-class'), this.getAttribute('data-label'), parseInt(this.getAttribute('data-day'), 10));
      });
    });
  }

  function openCellModal(className, label, dayIdx) {
    var sessions = sessionsFor(className, dayIdx);
    var ps = planStatusInfo();
    var m = document.getElementById('eos-wm-modal');
    var html = '<div class="wm-modal-title">' + escH(label) + ' — ' + DAY_NAMES[dayIdx] + '</div>';
    html += '<div style="margin-bottom:12px;font-size:13px;color:#475569">' + ps.icon + ' ' + escH(ps.label) + '</div>';
    html += '<button class="wm-btn wm-btn-brand" id="wm-modal-plan">' + (STATE.plan ? '📖 فتح الخطة' : '➕ إنشاء خطة') + '</button>';
    html += '<div style="margin-top:14px;font-size:14px;font-weight:800">📝 الحصص المسجّلة</div>';
    if (!sessions.length) {
      html += '<div class="wm-empty" style="padding:16px">لا توجد حصص مسجّلة لهذا اليوم</div>';
    } else {
      sessions.forEach(function (s) {
        var hasReflect = !!s.post_lesson_data;
        html += '<div class="wm-modal-sess"><div>📚 ' + escH(s.topic || s.lesson_topic || 'حصة') + '</div>' +
          '<div style="color:#64748B;margin-top:3px">' + (hasReflect ? '✍️ تم كتابة التأمل' : '⚪ لم يُكتب التأمل بعد') + '</div>' +
          (!hasReflect ? '<button class="wm-btn wm-btn-ghost wm-reflect-btn" data-sid="' + escH(s.id) + '">✍️ كتابة تأمل ذاتي</button>' : '') +
        '</div>';
      });
    }
    m.innerHTML = html;
    document.getElementById('eos-wm-modal-backdrop').classList.add('open');
    var pb = document.getElementById('wm-modal-plan');
    if (pb) pb.addEventListener('click', function () { closeModal(); var lb = document.getElementById('plan-btn-lessons'); if (lb) lb.click(); });
    Array.prototype.forEach.call(document.querySelectorAll('.wm-reflect-btn'), function (b) {
      b.addEventListener('click', function () {
        var sid = this.getAttribute('data-sid');
        if (typeof window.openPostLessonReflection === 'function') { closeModal(); window.openPostLessonReflection(sid); }
        else toast('افتحي الحصة من تبويب الحصص لإكمال التأمل ✍️');
      });
    });
  }

  /* ─────────────────────── تشغيل ─────────────────────── */
  function tryInit() {
    injectStyle();
    var okBtn = buildNavButton();
    var okPanel = buildPanel();
    if (!okBtn || !okPanel) {
      // العناصر المرجعية غير جاهزة بعد — أعد المحاولة
      setTimeout(tryInit, 400);
    }
  }

  function init() {
    var tries = 0;
    var iv = setInterval(function () {
      var refBtn = document.getElementById('plan-btn-lessons');
      if (refBtn || ++tries > 40) {
        clearInterval(iv);
        if (refBtn) tryInit();
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
