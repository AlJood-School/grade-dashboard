/**
 * platform-duties.js — منظومة المناوبات الذكية v2.0
 * EduOS — 2026-09-16
 * يقرأ من duty_weekly_schedule (JSONB) لا من جدول duties الفارغ
 */
(function () {
  'use strict';

  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('edoos_user') || 'null'); } catch (e) {}
  if (!user || !user.id) return;

  var ADMIN_ROLES = ['admin', 'principal', 'vice_principal'];
  var isAdmin = ADMIN_ROLES.indexOf(user.role_key) !== -1;
  var DAYS = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  var SHIFT_LABELS = {
    morning_cars_c1:    'صباحي · سيارات م١',
    morning_cars_c2:    'صباحي · سيارات م٢',
    morning_buses_c1:   'صباحي · حافلات م١',
    morning_buses_c2:   'صباحي · حافلات م٢',
    afternoon_cars_c1:  'مسائي · سيارات م١',
    afternoon_cars_c2:  'مسائي · سيارات م٢',
    afternoon_buses_c1: 'مسائي · حافلات م١',
    afternoon_buses_c2: 'مسائي · حافلات م٢',
  };

  var state = {
    schedule: null,
    note: '',
    loaded: false,
    open: false,
    tab: 'week',
    retries: 0
  };

  /* ──────────────────────────────────────
     مطابقة الأسماء (كاملة أو جزئية)
  ────────────────────────────────────── */
  function nameMatch(sessionName, listName) {
    if (!sessionName || !listName) return false;
    var n1 = (sessionName + '').trim();
    var n2 = (listName + '').trim();
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;
    if (n1.indexOf(n2) !== -1 || n2.indexOf(n1) !== -1) return true;
    var p1 = n1.split(' '), p2 = n2.split(' ');
    return p1[0] === p2[0] && p1[p1.length - 1] === p2[p2.length - 1];
  }

  function getMyDuties() {
    if (!state.schedule) return [];
    var myName = user.name || user.name_ar || '';
    var results = [];
    DAYS.forEach(function (day) {
      var dayData = state.schedule[day] || {};
      Object.keys(SHIFT_LABELS).forEach(function (key) {
        var list = dayData[key] || [];
        list.forEach(function (name) {
          if (nameMatch(myName, name)) {
            results.push({ day: day, type: SHIFT_LABELS[key], name: name });
          }
        });
      });
    });
    return results;
  }

  /* ──────────────────────────────────────
     انتظار EduOS_SB
  ────────────────────────────────────── */
  function waitForSB(cb) {
    if (window.EduOS_SB) { cb(); return; }
    if (state.retries++ > 30) return;
    setTimeout(function () { waitForSB(cb); }, 300);
  }

  /* ──────────────────────────────────────
     CSS
  ────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('duties-sys-style')) return;
    var s = document.createElement('style');
    s.id = 'duties-sys-style';
    s.textContent = [
      '#duty-panel{position:fixed;bottom:70px;left:24px;z-index:8999;',
        'width:min(820px,96vw);max-height:85vh;',
        'background:#fff;border-radius:18px;',
        'border:1px solid #E2E8F0;',
        'box-shadow:0 16px 48px rgba(0,0,0,0.18);',
        'display:none;flex-direction:column;overflow:hidden;',
        'font-family:Tajawal,Arial,sans-serif;direction:rtl;}',
      '#duty-panel.open{display:flex}',
      '#duty-header{background:linear-gradient(135deg,#f59e0b,#d97706);',
        'padding:14px 18px;display:flex;align-items:center;gap:10px;',
        'justify-content:space-between;flex-shrink:0;}',
      '#duty-header h3{margin:0;color:#fff;font-size:16px;font-weight:700}',
      '#duty-close{background:rgba(255,255,255,.2);border:none;color:#fff;',
        'width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:18px;',
        'display:flex;align-items:center;justify-content:center;}',
      '#duty-tabs{display:flex;background:#FFFBEB;border-bottom:2px solid #FDE68A;flex-shrink:0;}',
      '.duty-tab{flex:1;padding:11px 6px;background:none;border:none;cursor:pointer;',
        'color:#92400E;font-size:13px;font-family:Tajawal,Arial,sans-serif;',
        'transition:all .2s;border-bottom:3px solid transparent;font-weight:600;}',
      '.duty-tab.active{color:#d97706;border-bottom-color:#d97706;background:#fff;font-weight:800}',
      '#duty-body{flex:1;overflow-y:auto;padding:18px;background:#F9FAFB;}',
      '#duty-body::-webkit-scrollbar{width:5px}',
      '#duty-body::-webkit-scrollbar-thumb{background:#f59e0b55;border-radius:3px}',

      /* بطاقة اليوم */
      '.duty-day-card{background:#fff;border-radius:14px;border:1px solid #E2E8F0;',
        'margin-bottom:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);}',
      '.duty-day-title{background:linear-gradient(90deg,#f59e0b11,#fff);',
        'padding:10px 16px;font-size:15px;font-weight:800;color:#92400E;',
        'border-bottom:1px solid #FDE68A;display:flex;align-items:center;gap:8px;}',
      '.duty-shifts{display:grid;grid-template-columns:1fr 1fr;gap:0;}',
      '.duty-shift-section{padding:12px 16px;border-left:1px solid #F3F4F6;}',
      '.duty-shift-section:last-child{border-left:none;}',
      '.duty-shift-title{font-size:12px;font-weight:800;color:#6B7280;',
        'margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;}',
      '.duty-shift-row{display:flex;gap:6px;margin-bottom:5px;flex-wrap:wrap;}',
      '.duty-shift-label{font-size:11px;color:#9CA3AF;min-width:90px;font-weight:600;}',
      '.duty-name-pill{display:inline-block;background:#F3F4F6;color:#374151;',
        'border-radius:8px;padding:2px 8px;font-size:12px;margin:1px;cursor:default;}',
      '.duty-name-pill.mine{background:#FEF3C7;color:#92400E;font-weight:700;',
        'border:1.5px solid #FCD34D;}',

      /* بطاقة مناوباتي */
      '.my-duty-card{background:#fff;border:1.5px solid #FCD34D;border-radius:14px;',
        'padding:14px 18px;margin-bottom:12px;box-shadow:0 2px 8px rgba(245,158,11,0.1);}',
      '.my-duty-day{font-size:15px;font-weight:800;color:#92400E;margin-bottom:6px;}',
      '.my-duty-type{display:inline-block;background:#FFFBEB;color:#d97706;',
        'border-radius:8px;padding:4px 12px;font-size:13px;font-weight:700;}',

      /* ملاحظة */
      '.duty-note{background:#FEF9C3;border:1px solid #FDE68A;border-radius:10px;',
        'padding:10px 14px;margin-bottom:14px;font-size:13px;color:#78350F;',
        'display:flex;align-items:flex-start;gap:8px;}',

      '.duty-empty{text-align:center;color:#9CA3AF;padding:40px 20px;font-size:14px;}',
      '.duty-loading{text-align:center;color:#9CA3AF;padding:30px;font-size:14px;}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ──────────────────────────────────────
     DOM
  ────────────────────────────────────── */
  function buildDOM() {
    /* زر الهيدر أو عائم */
    var headerTools = document.getElementById('header-tools');
    var btn = document.createElement('button');
    btn.id = 'duty-header-icon';
    btn.title = 'جدول المناوبات';

    if (headerTools) {
      /* أيقونة ساعة — مناسبة للمناوبات */
      btn.innerHTML = [
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
          '<circle cx="12" cy="12" r="10"/>',
          '<polyline points="12 6 12 12 16 14"/>',
        '</svg>',
        '<span style="font-size:11px;font-weight:700">المناوبة</span>',
      ].join('');
      btn.style.cssText = 'position:relative;background:rgba(245,158,11,0.12);border:1.5px solid rgba(245,158,11,0.4);cursor:pointer;padding:7px 11px;border-radius:12px;display:flex;align-items:center;gap:5px;color:#d97706;transition:all 0.2s;font-family:Tajawal,Arial,sans-serif;font-size:12px;';
      btn.addEventListener('click', togglePanel);
      headerTools.appendChild(btn);
    } else {
      btn.innerHTML = '🕐<span id="duty-badge"></span>';
      btn.style.cssText = 'width:50px;height:50px;border-radius:50%;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(245,158,11,0.4);position:fixed;bottom:80px;left:24px;z-index:9000;';
      btn.addEventListener('click', togglePanel);
      document.body.appendChild(btn);
    }

    /* اللوحة */
    var panel = document.createElement('div');
    panel.id = 'duty-panel';
    panel.innerHTML = [
      '<div id="duty-header">',
        '<div style="display:flex;align-items:center;gap:10px">',
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
          '<h3>جدول المناوبات</h3>',
        '</div>',
        '<button id="duty-close" title="إغلاق">✕</button>',
      '</div>',
      '<div id="duty-tabs">',
        '<button class="duty-tab active" data-tab="week">📅 جدول الأسبوع</button>',
        '<button class="duty-tab" data-tab="mine">⭐ مناوباتي</button>',
      '</div>',
      '<div id="duty-body"><div class="duty-loading">⏳ جارٍ تحميل المناوبات...</div></div>',
    ].join('');
    document.body.appendChild(panel);

    document.getElementById('duty-close').addEventListener('click', togglePanel);
    document.querySelectorAll('.duty-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.tab = this.dataset.tab;
        document.querySelectorAll('.duty-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        renderBody();
      });
    });
  }

  function togglePanel() {
    state.open = !state.open;
    var panel = document.getElementById('duty-panel');
    if (panel) panel.classList.toggle('open', state.open);
    if (state.open && !state.loaded) {
      waitForSB(loadDuties);
    }
  }

  /* ──────────────────────────────────────
     تحميل البيانات
  ────────────────────────────────────── */
  function loadDuties() {
    window.EduOS_SB
      .from('duty_weekly_schedule')
      .select('week_key,schedule')
      .order('id', { ascending: false })
      .limit(1)
      .then(function (res) {
        if (res.error || !res.data || res.data.length === 0) {
          state.schedule = null;
          state.note = '';
        } else {
          var sched = res.data[0].schedule || {};
          state.note = sched['ملاحظة'] || '';
          state.schedule = sched;
        }
        state.loaded = true;
        renderBody();
        updateBadge();
      })
      .catch(function () {
        state.loaded = true;
        renderBody();
      });
  }

  function updateBadge() {
    var myDuties = getMyDuties();
    var badge = document.getElementById('duty-badge');
    if (badge && myDuties.length > 0) {
      badge.textContent = myDuties.length;
      badge.style.display = 'flex';
    }
  }

  /* ──────────────────────────────────────
     العرض
  ────────────────────────────────────── */
  function renderBody() {
    var body = document.getElementById('duty-body');
    if (!body) return;
    if (!state.loaded) { body.innerHTML = '<div class="duty-loading">⏳ جارٍ التحميل...</div>'; return; }
    if (state.tab === 'week') body.innerHTML = renderWeekTab();
    else body.innerHTML = renderMineTab();
  }

  function renderWeekTab() {
    if (!state.schedule) return '<div class="duty-empty">📋 لا توجد بيانات مناوبات</div>';

    var html = '';

    /* ملاحظة */
    if (state.note) {
      html += '<div class="duty-note"><span>📌</span><span>' + esc(state.note) + '</span></div>';
    }

    var myName = user.name || user.name_ar || '';

    DAYS.forEach(function (day) {
      var dayData = state.schedule[day] || {};
      if (Object.keys(dayData).length === 0) return;

      var morning = {
        cars_c1:  dayData.morning_cars_c1  || [],
        cars_c2:  dayData.morning_cars_c2  || [],
        buses_c1: dayData.morning_buses_c1 || [],
        buses_c2: dayData.morning_buses_c2 || [],
      };
      var afternoon = {
        cars_c1:  dayData.afternoon_cars_c1  || [],
        cars_c2:  dayData.afternoon_cars_c2  || [],
        buses_c1: dayData.afternoon_buses_c1 || [],
        buses_c2: dayData.afternoon_buses_c2 || [],
      };

      function pillList(list) {
        if (!list.length) return '<span style="color:#D1D5DB;font-size:12px">—</span>';
        return list.map(function (n) {
          var isMine = nameMatch(myName, n);
          return '<span class="duty-name-pill' + (isMine ? ' mine' : '') + '">' + esc(n) + '</span>';
        }).join('');
      }

      function shiftRows(data) {
        return [
          '<div class="duty-shift-row"><span class="duty-shift-label">🚗 سيارات م١</span>' + pillList(data.cars_c1) + '</div>',
          '<div class="duty-shift-row"><span class="duty-shift-label">🚗 سيارات م٢</span>' + pillList(data.cars_c2) + '</div>',
          '<div class="duty-shift-row"><span class="duty-shift-label">🚌 حافلات م١</span>' + pillList(data.buses_c1) + '</div>',
          '<div class="duty-shift-row"><span class="duty-shift-label">🚌 حافلات م٢</span>' + pillList(data.buses_c2) + '</div>',
        ].join('');
      }

      html += [
        '<div class="duty-day-card">',
          '<div class="duty-day-title">📅 ' + esc(day) + '</div>',
          '<div class="duty-shifts">',
            '<div class="duty-shift-section">',
              '<div class="duty-shift-title">☀️ صباحي</div>',
              shiftRows(morning),
            '</div>',
            '<div class="duty-shift-section">',
              '<div class="duty-shift-title">🌙 مسائي</div>',
              shiftRows(afternoon),
            '</div>',
          '</div>',
        '</div>',
      ].join('');
    });

    return html || '<div class="duty-empty">📋 لا بيانات</div>';
  }

  function renderMineTab() {
    var myDuties = getMyDuties();
    if (myDuties.length === 0) {
      return '<div class="duty-empty">🎉 لا مناوبات مسجّلة باسمك هذا الفصل</div>';
    }
    return myDuties.map(function (d) {
      return [
        '<div class="my-duty-card">',
          '<div class="my-duty-day">📅 ' + esc(d.day) + '</div>',
          '<span class="my-duty-type">' + esc(d.type) + '</span>',
        '</div>',
      ].join('');
    }).join('');
  }

  /* ──────────────────────────────────────
     مساعدات
  ────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ──────────────────────────────────────
     تشغيل
  ────────────────────────────────────── */
  function init() {
    injectStyles();
    buildDOM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
