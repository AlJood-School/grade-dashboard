/**
 * platform-duties.js — منظومة المناوبات الذكية
 * EduOS v1.0 — 2026-09-04
 * يُضاف بـ defer في بوابات: المديرة، الوكيلة، المعلمة، مدير النظام
 * لا localStorage — بيانات من Supabase فقط
 */
(function () {
  'use strict';

  /* ══════════════════════════════════
     1. قراءة الجلسة
     ══════════════════════════════════ */
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('edoos_user') || 'null'); } catch (e) {}
  if (!user || !user.id) return;

  var ADMIN_ROLES = ['admin', 'principal', 'vice_principal'];
  var isAdmin = ADMIN_ROLES.indexOf(user.role_key) !== -1;

  /* أيام الأسبوع الإماراتي */
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  /* حساب بداية الأسبوع الحالي (الأحد) */
  function getWeekStart(offsetWeeks) {
    var d = new Date();
    var day = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - day + (offsetWeeks || 0) * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function fmt(d) {
    return d.toISOString().split('T')[0];
  }

  function fmtAr(dateStr) {
    var d = new Date(dateStr);
    return d.toLocaleDateString('ar-AE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ══════════════════════════════════
     2. الحالة
     ══════════════════════════════════ */
  var state = {
    duties: [],
    staffList: [],
    weekStart: getWeekStart(0),
    loaded: false,
    open: false,
    tab: 'week',   // week | mine | manage
    retries: 0
  };

  /* ══════════════════════════════════
     3. انتظار EduOS_SB
     ══════════════════════════════════ */
  function waitForSB(cb) {
    if (window.EduOS_SB) { cb(); return; }
    if (state.retries++ > 30) return;
    setTimeout(function () { waitForSB(cb); }, 300);
  }

  /* ══════════════════════════════════
     4. CSS
     ══════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('duties-sys-style')) return;
    var s = document.createElement('style');
    s.id = 'duties-sys-style';
    s.textContent = [
      /* زر عائم */
      '#duty-float-btn{',
        'position:fixed;bottom:24px;left:90px;z-index:9000;',
        'width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;',
        'background:linear-gradient(135deg,#f59e0b,#d97706);',
        'color:#fff;font-size:22px;box-shadow:0 4px 16px rgba(245,158,11,.45);',
        'display:flex;align-items:center;justify-content:center;',
        'transition:transform .2s;',
      '}',
      '#duty-float-btn:hover{transform:scale(1.1)}',
      '#duty-badge{',
        'position:absolute;top:-4px;right:-4px;',
        'background:#ef4444;color:#fff;border-radius:50%;',
        'width:18px;height:18px;font-size:11px;',
        'display:flex;align-items:center;justify-content:center;',
        'font-weight:700;display:none;',
      '}',

      /* اللوحة */
      '#duty-panel{',
        'position:fixed;bottom:90px;left:24px;z-index:8999;',
        'width:min(780px,95vw);max-height:82vh;',
        'background:#1a2332;border-radius:16px;',
        'border:1px solid rgba(245,158,11,.25);',
        'box-shadow:0 16px 48px rgba(0,0,0,.55);',
        'display:none;flex-direction:column;overflow:hidden;',
        'font-family:Tajawal,Arial,sans-serif;direction:rtl;',
      '}',
      '#duty-panel.open{display:flex}',

      /* الهيدر */
      '#duty-header{',
        'background:linear-gradient(135deg,#f59e0b,#d97706);',
        'padding:14px 18px;display:flex;align-items:center;gap:10px;',
        'justify-content:space-between;flex-shrink:0;',
      '}',
      '#duty-header h3{margin:0;color:#fff;font-size:16px;font-weight:700}',
      '#duty-close{background:rgba(255,255,255,.2);border:none;color:#fff;',
        'width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;',
        'display:flex;align-items:center;justify-content:center;}',

      /* التبويبات */
      '#duty-tabs{',
        'display:flex;background:#162132;border-bottom:1px solid rgba(255,255,255,.08);',
        'flex-shrink:0;',
      '}',
      '.duty-tab{',
        'flex:1;padding:10px 6px;background:none;border:none;cursor:pointer;',
        'color:rgba(255,255,255,.5);font-size:13px;font-family:Tajawal,Arial,sans-serif;',
        'transition:all .2s;border-bottom:2px solid transparent;',
      '}',
      '.duty-tab.active{color:#f59e0b;border-bottom-color:#f59e0b;font-weight:700}',

      /* المحتوى */
      '#duty-body{flex:1;overflow-y:auto;padding:16px}',
      '#duty-body::-webkit-scrollbar{width:5px}',
      '#duty-body::-webkit-scrollbar-thumb{background:#f59e0b55;border-radius:3px}',

      /* جدول المناوبات */
      '.duty-table{width:100%;border-collapse:collapse;font-size:13px;color:#e2e8f0}',
      '.duty-table th{',
        'background:#f59e0b22;color:#f59e0b;padding:8px 10px;',
        'text-align:right;font-weight:700;font-size:12px;',
        'border-bottom:1px solid rgba(245,158,11,.2);',
      '}',
      '.duty-table td{',
        'padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06);',
        'vertical-align:middle;',
      '}',
      '.duty-table tr:hover td{background:rgba(245,158,11,.06)}',
      '.duty-table tr.mine td{background:rgba(245,158,11,.12);font-weight:700}',

      /* بادج النوبة */
      '.shift-badge{',
        'display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;',
      '}',
      '.shift-badge.morning{background:#f59e0b22;color:#f59e0b}',
      '.shift-badge.supervision{background:#3b82f622;color:#60a5fa}',

      /* مؤشر الأسبوع */
      '.week-nav{display:flex;align-items:center;justify-content:space-between;',
        'margin-bottom:14px;background:#162132;border-radius:10px;padding:10px 14px}',
      '.week-nav button{background:#f59e0b22;border:1px solid #f59e0b44;color:#f59e0b;',
        'padding:4px 12px;border-radius:6px;cursor:pointer;font-family:Tajawal,Arial,sans-serif;}',
      '.week-nav span{color:#e2e8f0;font-size:13px;font-weight:700}',

      /* بطاقة مناوبتي */
      '.my-duty-card{',
        'background:#f59e0b11;border:1px solid #f59e0b33;border-radius:12px;',
        'padding:14px;margin-bottom:10px;',
      '}',
      '.my-duty-card h4{margin:0 0 8px;color:#f59e0b;font-size:14px}',
      '.my-duty-info{display:flex;gap:16px;flex-wrap:wrap}',
      '.my-duty-info span{color:#94a3b8;font-size:13px}',
      '.my-duty-info strong{color:#e2e8f0}',

      /* إدارة */
      '.manage-section{margin-bottom:20px}',
      '.manage-section h4{color:#f59e0b;margin:0 0 10px;font-size:14px;font-weight:700}',
      '.btn-generate{',
        'background:linear-gradient(135deg,#f59e0b,#d97706);border:none;',
        'color:#fff;padding:10px 20px;border-radius:8px;cursor:pointer;',
        'font-family:Tajawal,Arial,sans-serif;font-size:14px;font-weight:700;',
        'width:100%;transition:opacity .2s;',
      '}',
      '.btn-generate:hover{opacity:.9}',
      '.btn-generate:disabled{opacity:.5;cursor:not-allowed}',

      '.add-duty-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
      '.add-duty-form select,.add-duty-form input{',
        'background:#162132;border:1px solid rgba(255,255,255,.12);',
        'color:#e2e8f0;padding:8px 10px;border-radius:8px;',
        'font-family:Tajawal,Arial,sans-serif;font-size:13px;',
      '}',
      '.add-duty-form select option{background:#1a2332;color:#e2e8f0}',
      '.btn-add-duty{',
        'grid-column:span 2;background:#3b82f6;border:none;color:#fff;',
        'padding:9px;border-radius:8px;cursor:pointer;',
        'font-family:Tajawal,Arial,sans-serif;font-size:13px;font-weight:700;',
      '}',

      '.empty-state{text-align:center;color:#64748b;padding:40px 20px;font-size:14px}',
      '.duty-toast{',
        'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);',
        'background:#1e293b;color:#f59e0b;padding:10px 20px;border-radius:10px;',
        'border:1px solid #f59e0b44;font-family:Tajawal,Arial,sans-serif;font-size:13px;',
        'z-index:10000;opacity:0;transition:opacity .3s;pointer-events:none;',
      '}',
      '.duty-toast.show{opacity:1}',

      '.loading-duties{text-align:center;color:#64748b;padding:30px;font-size:14px}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════
     5. DOM
     ══════════════════════════════════ */
  function buildDOM() {
    /* زر عائم */
    var btn = document.createElement('button');
    btn.id = 'duty-float-btn';
    btn.title = 'المناوبات';
    btn.innerHTML = '<span>📋</span><span id="duty-badge"></span>';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);

    /* اللوحة */
    var panel = document.createElement('div');
    panel.id = 'duty-panel';
    panel.innerHTML = [
      '<div id="duty-header">',
        '<div style="display:flex;align-items:center;gap:8px">',
          '<span style="font-size:20px">📋</span>',
          '<h3>نظام المناوبات</h3>',
        '</div>',
        '<button id="duty-close" title="إغلاق">✕</button>',
      '</div>',
      '<div id="duty-tabs">',
        '<button class="duty-tab active" data-tab="week">📅 جدول الأسبوع</button>',
        '<button class="duty-tab" data-tab="mine">⭐ مناوباتي</button>',
        isAdmin ? '<button class="duty-tab" data-tab="manage">⚙️ إدارة</button>' : '',
      '</div>',
      '<div id="duty-body">',
        '<div class="loading-duties">جارٍ تحميل المناوبات...</div>',
      '</div>',
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

    /* toast */
    var toast = document.createElement('div');
    toast.id = 'duty-toast';
    toast.className = 'duty-toast';
    document.body.appendChild(toast);
  }

  function togglePanel() {
    state.open = !state.open;
    var panel = document.getElementById('duty-panel');
    if (panel) panel.classList.toggle('open', state.open);
    if (state.open && !state.loaded) loadDuties();
  }

  /* ══════════════════════════════════
     6. تحميل البيانات
     ══════════════════════════════════ */
  function loadDuties() {
    var weekStr = fmt(state.weekStart);
    Promise.all([
      window.EduOS_SB
        .from('duties')
        .select('*')
        .eq('week_start', weekStr)
        .order('day')
        .order('shift'),
      window.EduOS_SB
        .from('staff_profiles')
        .select('staff_db_id,name_ar,role_key')
        .limit(200)
    ]).then(function (results) {
      var dutiesRes = results[0];
      var staffRes = results[1];
      if (!dutiesRes.error) state.duties = dutiesRes.data || [];
      if (!staffRes.error) state.staffList = staffRes.data || [];
      state.loaded = true;
      updateBadge();
      renderBody();
    }).catch(function () {
      state.duties = [];
      state.loaded = true;
      renderBody();
    });
  }

  function reloadDuties() {
    state.loaded = false;
    loadDuties();
  }

  function updateBadge() {
    var myDuties = state.duties.filter(function (d) {
      return d.teacher_id === user.id;
    });
    var badge = document.getElementById('duty-badge');
    if (badge) {
      badge.textContent = myDuties.length;
      badge.style.display = myDuties.length > 0 ? 'flex' : 'none';
    }
  }

  /* ══════════════════════════════════
     7. العرض
     ══════════════════════════════════ */
  function renderBody() {
    var body = document.getElementById('duty-body');
    if (!body) return;
    if (state.tab === 'week') body.innerHTML = renderWeekTab();
    else if (state.tab === 'mine') body.innerHTML = renderMineTab();
    else if (state.tab === 'manage') body.innerHTML = renderManageTab();
    bindBodyEvents();
  }

  /* -- تبويب الأسبوع -- */
  function renderWeekTab() {
    var weekEnd = new Date(state.weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);

    var html = [
      '<div class="week-nav">',
        '<button id="duty-prev-week">&#8249; الأسبوع السابق</button>',
        '<span>',
          fmtAr(fmt(state.weekStart)),
          ' &mdash; ',
          fmtAr(fmt(weekEnd)),
        '</span>',
        '<button id="duty-next-week">الأسبوع التالي &#8250;</button>',
      '</div>',
    ].join('');

    if (state.duties.length === 0) {
      return html + '<div class="empty-state">📋 لا توجد مناوبات مسجّلة لهذا الأسبوع</div>';
    }

    /* تجميع حسب اليوم */
    var byDay = {};
    DAYS.forEach(function (d) { byDay[d] = []; });
    state.duties.forEach(function (d) {
      if (byDay[d.day]) byDay[d.day].push(d);
    });

    html += [
      '<table class="duty-table">',
        '<thead><tr>',
          '<th>اليوم</th>',
          '<th>الموظفة</th>',
          '<th>الموقع</th>',
          '<th>النوبة</th>',
        '</tr></thead>',
        '<tbody>',
    ].join('');

    DAYS.forEach(function (day) {
      var entries = byDay[day];
      if (entries.length === 0) {
        html += '<tr><td style="color:#64748b">' + day + '</td><td colspan="3" style="color:#64748b;font-size:12px">لا مناوبة</td></tr>';
        return;
      }
      entries.forEach(function (e, i) {
        var isMe = e.teacher_id === user.id;
        var shiftClass = e.shift === 'صباحي' ? 'morning' : 'supervision';
        html += '<tr class="' + (isMe ? 'mine' : '') + '">' +
          '<td>' + (i === 0 ? day : '') + '</td>' +
          '<td>' + esc(e.teacher_name) + (isMe ? ' <span style="color:#f59e0b">★</span>' : '') + '</td>' +
          '<td>' + esc(e.location) + '</td>' +
          '<td><span class="shift-badge ' + shiftClass + '">' + esc(e.shift) + '</span></td>' +
          '</tr>';
      });
    });

    html += '</tbody></table>';
    return html;
  }

  /* -- تبويب مناوباتي -- */
  function renderMineTab() {
    var myDuties = state.duties.filter(function (d) {
      return d.teacher_id === user.id;
    });

    var weekEnd = new Date(state.weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);

    var html = [
      '<div class="week-nav">',
        '<button id="duty-prev-week">&#8249; الأسبوع السابق</button>',
        '<span>' + fmtAr(fmt(state.weekStart)) + ' &mdash; ' + fmtAr(fmt(weekEnd)) + '</span>',
        '<button id="duty-next-week">الأسبوع التالي &#8250;</button>',
      '</div>',
    ].join('');

    if (myDuties.length === 0) {
      return html + '<div class="empty-state">🎉 لا مناوبات عليك هذا الأسبوع</div>';
    }

    myDuties.forEach(function (d) {
      var shiftClass = d.shift === 'صباحي' ? 'morning' : 'supervision';
      html += [
        '<div class="my-duty-card">',
          '<h4>📅 ' + esc(d.day) + '</h4>',
          '<div class="my-duty-info">',
            '<span>📍 الموقع: <strong>' + esc(d.location) + '</strong></span>',
            '<span>🕐 النوبة: <strong><span class="shift-badge ' + shiftClass + '">' + esc(d.shift) + '</span></strong></span>',
          '</div>',
        '</div>',
      ].join('');
    });

    return html;
  }

  /* -- تبويب الإدارة -- */
  function renderManageTab() {
    var locations = [
      'مدخل المدرسة', 'الممر الأول', 'الممر الثاني',
      'الساحة الجنوبية', 'ملعب الطالبات',
      'المقصف', 'الممر الثالث', 'باحة الروضة', 'المصلى', 'المكتبة'
    ];
    var shifts = ['صباحي', 'اشراف حصص'];

    var staffOptions = state.staffList.map(function (s) {
      return '<option value="' + esc(s.staff_db_id) + '|' + esc(s.name_ar) + '">' + esc(s.name_ar) + '</option>';
    }).join('');

    var dayOptions = DAYS.map(function (d) {
      return '<option value="' + d + '">' + d + '</option>';
    }).join('');

    var locOptions = locations.map(function (l) {
      return '<option value="' + l + '">' + l + '</option>';
    }).join('');

    var shiftOptions = shifts.map(function (s) {
      return '<option value="' + s + '">' + s + '</option>';
    }).join('');

    return [
      '<div class="manage-section">',
        '<h4>⚡ توليد جدول تلقائي</h4>',
        '<p style="color:#94a3b8;font-size:12px;margin:0 0 10px">',
          'يوزّع المناوبات تلقائياً على جميع الموظفات بالتناوب',
        '</p>',
        '<button class="btn-generate" id="duty-auto-gen">',
          '🔄 توليد جدول الأسبوع الحالي',
        '</button>',
      '</div>',

      '<div class="manage-section">',
        '<h4>➕ إضافة مناوبة يدوية</h4>',
        '<div class="add-duty-form">',
          '<select id="duty-staff">' + staffOptions + '</select>',
          '<select id="duty-day">' + dayOptions + '</select>',
          '<select id="duty-loc">' + locOptions + '</select>',
          '<select id="duty-shift">' + shiftOptions + '</select>',
          '<button class="btn-add-duty" id="duty-add-btn">إضافة مناوبة</button>',
        '</div>',
      '</div>',

      state.duties.length > 0 ? [
        '<div class="manage-section">',
          '<h4>🗑️ مسح جدول الأسبوع</h4>',
          '<button class="btn-generate" id="duty-clear-btn" style="background:linear-gradient(135deg,#ef4444,#b91c1c)">',
            '🗑️ مسح كل مناوبات هذا الأسبوع',
          '</button>',
        '</div>',
      ].join('') : '',
    ].join('');
  }

  /* ══════════════════════════════════
     8. ربط الأحداث في body
     ══════════════════════════════════ */
  function bindBodyEvents() {
    var prevBtn = document.getElementById('duty-prev-week');
    var nextBtn = document.getElementById('duty-next-week');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      state.weekStart = getWeekStart(-1);
      state.weekStart.setDate(state.weekStart.getDate());
      // حساب يدوي للأسبوع السابق
      state.weekStart = new Date(state.weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      state.loaded = false;
      reloadDuties();
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      state.weekStart = new Date(state.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      state.loaded = false;
      reloadDuties();
    });

    var genBtn = document.getElementById('duty-auto-gen');
    if (genBtn) genBtn.addEventListener('click', autoGenerate);

    var addBtn = document.getElementById('duty-add-btn');
    if (addBtn) addBtn.addEventListener('click', addManualDuty);

    var clearBtn = document.getElementById('duty-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearWeek);
  }

  /* ══════════════════════════════════
     9. التوليد التلقائي
     ══════════════════════════════════ */
  function autoGenerate() {
    var btn = document.getElementById('duty-auto-gen');
    if (btn) { btn.disabled = true; btn.textContent = 'جارٍ التوليد...'; }

    var locations = [
      'مدخل المدرسة', 'الممر الأول', 'الممر الثاني',
      'الساحة الجنوبية', 'ملعب الطالبات'
    ];
    var shifts = ['صباحي', 'اشراف حصص'];

    /* تصفية الموظفات فقط (لا مدراء) */
    var teachers = state.staffList.filter(function (s) {
      return s.role_key === 'teacher' || s.role_key === 'kg_teacher';
    });

    if (teachers.length === 0) {
      showToast('لا يوجد موظفات للتوزيع');
      if (btn) { btn.disabled = false; btn.textContent = '🔄 توليد جدول الأسبوع الحالي'; }
      return;
    }

    /* بناء قائمة المناوبات المطلوبة */
    var toInsert = [];
    var teacherIdx = 0;
    DAYS.forEach(function (day) {
      locations.forEach(function (loc) {
        shifts.forEach(function (shift) {
          var t = teachers[teacherIdx % teachers.length];
          teacherIdx++;
          toInsert.push({
            week_start: fmt(state.weekStart),
            teacher_id: t.staff_db_id,
            teacher_name: t.name_ar,
            day: day,
            location: loc,
            shift: shift
          });
        });
      });
    });

    /* مسح القديم ثم إدراج الجديد */
    window.EduOS_SB
      .from('duties')
      .delete()
      .eq('week_start', fmt(state.weekStart))
      .then(function () {
        return window.EduOS_SB.from('duties').insert(toInsert);
      })
      .then(function (res) {
        if (res.error) {
          showToast('خطأ: ' + res.error.message);
        } else {
          showToast('✅ تم توليد ' + toInsert.length + ' مناوبة بنجاح');
          state.loaded = false;
          reloadDuties();
        }
        if (btn) { btn.disabled = false; btn.textContent = '🔄 توليد جدول الأسبوع الحالي'; }
      });
  }

  /* ══════════════════════════════════
     10. إضافة يدوية
     ══════════════════════════════════ */
  function addManualDuty() {
    var staffSel = document.getElementById('duty-staff');
    var daySel = document.getElementById('duty-day');
    var locSel = document.getElementById('duty-loc');
    var shiftSel = document.getElementById('duty-shift');

    if (!staffSel || !staffSel.value) { showToast('اختاري الموظفة'); return; }
    var parts = staffSel.value.split('|');
    var teacherId = parts[0];
    var teacherName = parts[1];

    window.EduOS_SB.from('duties').insert([{
      week_start: fmt(state.weekStart),
      teacher_id: teacherId,
      teacher_name: teacherName,
      day: daySel.value,
      location: locSel.value,
      shift: shiftSel.value
    }]).then(function (res) {
      if (res.error) {
        showToast('خطأ: ' + res.error.message);
      } else {
        showToast('✅ تمت إضافة المناوبة');
        state.loaded = false;
        reloadDuties();
      }
    });
  }

  /* ══════════════════════════════════
     11. مسح الأسبوع
     ══════════════════════════════════ */
  function clearWeek() {
    if (!confirm('هل تريدين مسح جميع مناوبات هذا الأسبوع؟')) return;
    window.EduOS_SB.from('duties').delete().eq('week_start', fmt(state.weekStart))
      .then(function (res) {
        if (res.error) {
          showToast('خطأ: ' + res.error.message);
        } else {
          showToast('✅ تم مسح المناوبات');
          state.duties = [];
          renderBody();
        }
      });
  }

  /* ══════════════════════════════════
     12. مساعدات
     ══════════════════════════════════ */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    var t = document.getElementById('duty-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  /* ══════════════════════════════════
     13. التشغيل
     ══════════════════════════════════ */
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
