/**
 * platform-tasks.js — نظام المهام الإدارية
 * EduOS — 2026
 * يعمل في بوابات: المعلمة / المديرة / نائبة المدير / المنسقة
 * يعتمد على: window.EduOS_SB + sessionStorage('edoos_user')
 */
(function () {

  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('edoos_user') || '{}'); } catch (e) { user = {}; }
  if (!user || !user.id) return;

  var ROLE = user.role_key || user.role || '';
  var STAFF_ID = user.staff_db_id || user.id;
  var ADMIN_ROLES = ['principal', 'vice_principal', 'coordinator'];
  var IS_TEACHER = ROLE === 'teacher';
  var IS_ADMIN = ADMIN_ROLES.indexOf(ROLE) !== -1;
  var IS_PRINCIPAL = ROLE === 'principal';

  if (!IS_TEACHER && !IS_ADMIN) return; // هذا النظام لا يظهر لأدوار أخرى

  var STATE = {
    open: false,
    tab: IS_TEACHER ? 'mine' : 'issued',
    tasks: [],
    mySubs: [],
    adminTasks: [],
    adminSubs: [],
    reviewExtra: [], // تسليمات مرفوضة من مفوّض بانتظار تجاوز المديرة
    staffList: [],
    delegateList: [],
    loaded: false,
    createOpen: false,
    assignSel: [], // للإنشاء: القيم المختارة (all/teachers/staffId)
  };

  var TYPE_LABELS = {
    confirm: 'تأكيد إنجاز',
    text: 'نص',
    file_url: 'رابط ملف',
    portal_link: 'رابط داخل البوابة'
  };

  var STATUS_LABELS = {
    no_sub: '⬜ لم تُسلَّم',
    pending: '🕐 في الانتظار',
    approved: '✅ معتمدة',
    rejected: '❌ مرفوضة',
    override_approved: '✅ تجاوز واعتماد'
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

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso).slice(0, 10);
      return d.toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return String(iso).slice(0, 10); }
  }

  function isOverdue(dueDate) {
    if (!dueDate) return false;
    var d = new Date(dueDate);
    if (isNaN(d.getTime())) return false;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return d < today;
  }

  function toast(msg, isErr) {
    var t = document.getElementById('tasks-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tasks-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;background:#1E293B;color:#fff;padding:12px 20px;border-radius:10px;font-family:Tajawal,Arial,sans-serif;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.25);opacity:0;transition:opacity .25s;max-width:320px';
      document.body.appendChild(t);
    }
    t.style.background = isErr ? '#DC2626' : '#1E293B';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.opacity = '0'; }, 2800);
  }

  function assignedToArr(val) {
    if (Array.isArray(val)) return val.map(String);
    if (val == null) return [];
    if (typeof val === 'string') {
      try { var p = JSON.parse(val); if (Array.isArray(p)) return p.map(String); } catch (e) {}
      return val.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    return [String(val)];
  }

  function taskAppliesToMe(task) {
    var arr = assignedToArr(task.assigned_to);
    if (arr.indexOf('all') !== -1) return true;
    if (arr.indexOf('teachers') !== -1 && IS_TEACHER) return true;
    if (arr.indexOf(String(STAFF_ID)) !== -1) return true;
    return false;
  }

  /* ─────────────────────── CSS ─────────────────────── */
  function injectStyle() {
    if (document.getElementById('eos-tasks-style')) return;
    var s = document.createElement('style');
    s.id = 'eos-tasks-style';
    s.textContent = [
      '#eos-tasks-btn{position:relative;background:rgba(108,61,214,0.10);border:1.5px solid rgba(108,61,214,0.35);cursor:pointer;padding:7px 12px;border-radius:12px;display:flex;align-items:center;gap:6px;color:#6C3DD6;transition:all .2s;font-family:Tajawal,Arial,sans-serif;font-size:13px;font-weight:700}',
      '#eos-tasks-btn:hover{background:rgba(108,61,214,0.18)}',
      '#eos-tasks-badge{background:#E11D48;color:#fff;font-size:11px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}',
      '#eos-tasks-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:9600;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto}',
      '#eos-tasks-backdrop.open{display:flex}',
      '#eos-tasks-card{background:#fff;border-radius:18px;width:min(760px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Tajawal,Arial,sans-serif;direction:rtl;color:#1E293B}',
      '#eos-tasks-head{background:linear-gradient(135deg,#6C3DD6,#22D3EE);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
      '#eos-tasks-head h3{margin:0;color:#fff;font-size:17px;font-weight:800}',
      '.eos-t-close{background:rgba(255,255,255,.22);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '#eos-tasks-tabs{display:flex;background:#F8FAFB;border-bottom:2px solid #EEF2FF;flex-shrink:0}',
      '.eos-t-tab{flex:1;padding:12px 6px;background:none;border:none;cursor:pointer;color:#475569;font-size:13px;font-family:Tajawal,Arial,sans-serif;font-weight:700;border-bottom:3px solid transparent}',
      '.eos-t-tab.active{color:#6C3DD6;border-bottom-color:#6C3DD6;background:#fff}',
      '#eos-tasks-body{flex:1;overflow-y:auto;padding:18px 20px;background:#F8FAFB}',
      '.eos-progress-wrap{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;margin-bottom:16px}',
      '.eos-progress-bar{height:10px;border-radius:6px;background:#EEF2FF;overflow:hidden;margin-top:8px}',
      '.eos-progress-fill{height:100%;background:linear-gradient(90deg,#6C3DD6,#22D3EE);border-radius:6px;transition:width .3s}',
      '.eos-task-card{background:#fff;border:1.5px solid #E2E8F0;border-radius:14px;padding:14px 16px;margin-bottom:12px}',
      '.eos-task-card.overdue{border-color:#FCA5A5;background:#FFF5F5}',
      '.eos-task-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px}',
      '.eos-task-title{font-size:15px;font-weight:800;color:#1E293B}',
      '.eos-task-desc{font-size:13px;color:#475569;margin:4px 0 8px;line-height:1.6}',
      '.eos-task-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#64748B;margin-bottom:10px}',
      '.eos-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#F1F5F9;color:#475569}',
      '.eos-chip-pts{background:rgba(34,211,238,0.15);color:#0369A1}',
      '.eos-btn{font-family:Tajawal,Arial,sans-serif;border:none;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer}',
      '.eos-btn-brand{background:linear-gradient(135deg,#6C3DD6,#22D3EE);color:#fff}',
      '.eos-btn-green{background:#059669;color:#fff}',
      '.eos-btn-red{background:#E11D48;color:#fff}',
      '.eos-btn-amber{background:#D97706;color:#fff}',
      '.eos-btn-ghost{background:#F1F5F9;color:#334155}',
      '.eos-empty{text-align:center;color:#94A3B8;padding:40px 20px;font-size:14px}',
      '.eos-loading{text-align:center;color:#94A3B8;padding:30px;font-size:14px}',
      '.eos-create-fab{width:100%;margin-bottom:14px}',
      '.eos-input,.eos-select,.eos-textarea{width:100%;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:9px;font-family:Tajawal,Arial,sans-serif;font-size:14px;color:#1E293B;background:#fff;box-sizing:border-box}',
      '.eos-field{margin-bottom:14px}',
      '.eos-field label{display:block;font-size:13px;font-weight:700;margin-bottom:6px;color:#334155}',
      '.eos-assign-chip{display:inline-block;padding:5px 12px;border-radius:18px;font-size:12px;font-weight:700;border:1.5px solid #E2E8F0;background:#fff;color:#475569;cursor:pointer;margin:3px}',
      '.eos-assign-chip.sel{background:#6C3DD6;color:#fff;border-color:#6C3DD6}',
      '#eos-create-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:9700;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto}',
      '#eos-create-backdrop.open{display:flex}',
      '#eos-create-card{background:#fff;border-radius:18px;width:min(560px,100%);max-height:88vh;overflow-y:auto;padding:22px;font-family:Tajawal,Arial,sans-serif;direction:rtl}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ─────────────────────── بناء DOM ─────────────────────── */
  function buildHeaderButton() {
    var host = document.getElementById('header-tools');
    if (!host || document.getElementById('eos-tasks-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'eos-tasks-btn';
    btn.title = 'المهام';
    btn.innerHTML = '📋 <span id="eos-tasks-badge" style="display:none">0</span>';
    btn.addEventListener('click', openPanel);
    host.appendChild(btn);
  }

  function buildOverlay() {
    if (document.getElementById('eos-tasks-backdrop')) return;
    var bd = document.createElement('div');
    bd.id = 'eos-tasks-backdrop';
    bd.innerHTML =
      '<div id="eos-tasks-card">' +
        '<div id="eos-tasks-head"><h3>📋 المهام</h3><button class="eos-t-close" id="eos-tasks-x">✕</button></div>' +
        (IS_ADMIN ?
          '<div id="eos-tasks-tabs">' +
            '<button class="eos-t-tab active" data-tab="issued">مهامي الصادرة</button>' +
            '<button class="eos-t-tab" data-tab="pending">التسليمات المعلقة</button>' +
          '</div>' : '') +
        '<div id="eos-tasks-body"><div class="eos-loading">⏳ جارٍ التحميل…</div></div>' +
      '</div>';
    document.body.appendChild(bd);
    bd.addEventListener('mousedown', function (e) { if (e.target === bd) closePanel(); });
    document.getElementById('eos-tasks-x').addEventListener('click', closePanel);
    if (IS_ADMIN) {
      Array.prototype.forEach.call(document.querySelectorAll('.eos-t-tab'), function (t) {
        t.addEventListener('click', function () {
          STATE.tab = this.getAttribute('data-tab');
          Array.prototype.forEach.call(document.querySelectorAll('.eos-t-tab'), function (x) { x.classList.remove('active'); });
          this.classList.add('active');
          render();
        });
      });
    }

    var cbd = document.createElement('div');
    cbd.id = 'eos-create-backdrop';
    cbd.innerHTML = '<div id="eos-create-card"></div>';
    document.body.appendChild(cbd);
    cbd.addEventListener('mousedown', function (e) { if (e.target === cbd) closeCreateModal(); });
  }

  function openPanel() {
    buildOverlay();
    document.getElementById('eos-tasks-backdrop').classList.add('open');
    STATE.open = true;
    if (!STATE.loaded) { waitForSB(loadData); } else { render(); }
  }
  function closePanel() {
    var bd = document.getElementById('eos-tasks-backdrop');
    if (bd) bd.classList.remove('open');
    STATE.open = false;
  }

  function openCreateModal() {
    STATE.assignSel = [];
    var card = document.getElementById('eos-create-card');
    card.innerHTML = renderCreateForm();
    document.getElementById('eos-create-backdrop').classList.add('open');
    bindCreateForm();
    loadStaffLists();
  }
  function closeCreateModal() {
    var bd = document.getElementById('eos-create-backdrop');
    if (bd) bd.classList.remove('open');
  }

  /* ─────────────────────── تحميل البيانات ─────────────────────── */
  function loadData() {
    if (IS_TEACHER) loadTeacherData();
    else loadAdminData();
  }

  function loadTeacherData() {
    var sb = window.EduOS_SB;
    Promise.all([
      sb.from('staff_tasks').select('*').eq('is_active', true).then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('staff_task_submissions').select('*').eq('staff_db_id', STAFF_ID).then(function (r) { return r.data || []; }).catch(function () { return []; })
    ]).then(function (res) {
      var allTasks = res[0], subs = res[1];
      STATE.tasks = allTasks.filter(taskAppliesToMe);
      STATE.mySubs = subs;
      STATE.loaded = true;
      updateBadge();
      render();
    });
  }

  function loadAdminData() {
    var sb = window.EduOS_SB;
    Promise.all([
      sb.from('staff_tasks').select('*').or('assigned_by_id.eq.' + STAFF_ID + ',delegated_approval_to.eq.' + STAFF_ID)
        .then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('staff_task_submissions').select('*').eq('status', 'pending')
        .then(function (r) { return r.data || []; }).catch(function () { return []; }),
      IS_PRINCIPAL ? sb.from('staff_task_submissions').select('*').eq('status', 'rejected')
        .then(function (r) { return r.data || []; }).catch(function () { return []; }) : Promise.resolve([])
    ]).then(function (res) {
      var tasks = res[0];
      var taskIds = tasks.map(function (t) { return t.id; });
      STATE.adminTasks = tasks;
      STATE.adminSubs = (res[1] || []).filter(function (s) { return taskIds.indexOf(s.task_id) !== -1; });
      // تسليمات رُفضت من مفوَّض، والمديرة يمكنها التجاوز
      if (IS_PRINCIPAL) {
        STATE.reviewExtra = (res[2] || []).filter(function (s) {
          var t = tasks.find(function (tt) { return tt.id === s.task_id; });
          return t && t.assigned_by_id == STAFF_ID && t.delegated_approval_to && t.delegated_approval_to != STAFF_ID;
        });
      } else {
        STATE.reviewExtra = [];
      }
      STATE.loaded = true;
      updateBadge();
      render();
    });
  }

  function loadStaffLists() {
    var sb = window.EduOS_SB;
    sb.from('staff_profiles').select('staff_db_id,name_ar,role_key').eq('is_active', true).then(function (r) {
      STATE.staffList = r.data || [];
      var wrap = document.getElementById('eos-assign-wrap');
      if (wrap) wrap.innerHTML = renderAssignChips();
      bindAssignChips();
      if (IS_PRINCIPAL) {
        STATE.delegateList = STATE.staffList.filter(function (p) { return ['vice_principal', 'coordinator'].indexOf(p.role_key) !== -1; });
        var dsel = document.getElementById('eos-delegate-sel');
        if (dsel) {
          dsel.innerHTML = '<option value="">— بدون تفويض —</option>' + STATE.delegateList.map(function (p) {
            return '<option value="' + escH(p.staff_db_id) + '">' + escH(p.name_ar || '—') + '</option>';
          }).join('');
        }
      }
    }).catch(function () {});
  }

  function updateBadge() {
    var badge = document.getElementById('eos-tasks-badge');
    if (!badge) return;
    var n = 0;
    if (IS_TEACHER) {
      n = STATE.tasks.filter(function (t) {
        var sub = STATE.mySubs.find(function (s) { return s.task_id === t.id; });
        var st = sub ? sub.status : 'pending';
        return st === 'pending' || st === 'rejected';
      }).length;
    } else {
      n = STATE.adminSubs.length + STATE.reviewExtra.length;
    }
    if (n > 0) { badge.textContent = n; badge.style.display = 'inline-flex'; }
    else { badge.style.display = 'none'; }
  }

  /* ─────────────────────── العرض ─────────────────────── */
  function render() {
    var body = document.getElementById('eos-tasks-body');
    if (!body) return;
    if (!STATE.loaded) { body.innerHTML = '<div class="eos-loading">⏳ جارٍ التحميل…</div>'; return; }
    if (IS_TEACHER) { body.innerHTML = renderTeacherBody(); bindTeacherEvents(); return; }
    if (STATE.tab === 'issued') { body.innerHTML = renderIssuedBody(); bindIssuedEvents(); }
    else { body.innerHTML = renderPendingBody(); bindPendingEvents(); }
  }

  function getMyTaskStatus(task) {
    var sub = STATE.mySubs.find(function (s) { return s.task_id === task.id; });
    return { sub: sub, status: sub ? sub.status : 'pending' };
  }

  function renderTeacherBody() {
    if (!STATE.tasks.length) return '<div class="eos-empty">🎉 لا توجد مهام حالياً</div>';
    var done = 0;
    STATE.tasks.forEach(function (t) {
      var st = getMyTaskStatus(t).status;
      if (st === 'approved' || st === 'override_approved') done++;
    });
    var pct = STATE.tasks.length ? Math.round((done / STATE.tasks.length) * 100) : 0;
    var html = '<div class="eos-progress-wrap">' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#334155">' +
      '<span>' + done + ' / ' + STATE.tasks.length + ' مهمة مكتملة</span><span>' + pct + '%</span></div>' +
      '<div class="eos-progress-bar"><div class="eos-progress-fill" style="width:' + pct + '%"></div></div></div>';

    html += STATE.tasks.map(function (t) {
      var info = getMyTaskStatus(t);
      var overdue = isOverdue(t.due_date) && info.status !== 'approved' && info.status !== 'override_approved';
      var actionHtml = '';
      if (info.status === 'no_sub' || info.status === 'pending' || info.status === 'rejected') {
        actionHtml = '<button class="eos-btn eos-btn-brand eos-submit-btn" data-id="' + t.id + '" data-type="' + escH(t.submission_type) + '">📤 تسليم</button>';
      }
      return '<div class="eos-task-card' + (overdue ? ' overdue' : '') + '">' +
        '<div class="eos-task-top"><div class="eos-task-title">' + escH(t.title) + '</div>' +
        '<span class="eos-chip">' + (STATUS_LABELS[info.status] || info.status) + '</span></div>' +
        (t.description ? '<div class="eos-task-desc">' + escH(t.description) + '</div>' : '') +
        '<div class="eos-task-meta">' +
          '<span class="eos-chip eos-chip-pts">⭐ ' + (t.points || 0) + ' نقطة</span>' +
          '<span class="eos-chip">📅 ' + fmtDate(t.due_date) + (overdue ? ' — متأخرة' : '') + '</span>' +
          '<span class="eos-chip">📎 ' + (TYPE_LABELS[t.submission_type] || t.submission_type || '—') + '</span>' +
        '</div>' + actionHtml +
      '</div>';
    }).join('');
    return html;
  }

  function bindTeacherEvents() {
    Array.prototype.forEach.call(document.querySelectorAll('.eos-submit-btn'), function (b) {
      b.addEventListener('click', function () { handleSubmit(this.getAttribute('data-id'), this.getAttribute('data-type')); });
    });
  }

  function handleSubmit(taskId, type) {
    var task = STATE.tasks.find(function (t) { return String(t.id) === String(taskId); });
    if (!task) return;
    var payload = null;
    if (type === 'confirm') {
      if (!confirm('تأكيد تسليم مهمة: ' + task.title + '؟')) return;
      payload = { done: true };
    } else if (type === 'text') {
      var txt = prompt('اكتبي نص التسليم:');
      if (txt == null || !txt.trim()) return;
      payload = { text: txt.trim() };
    } else if (type === 'file_url' || type === 'portal_link') {
      var url = prompt(type === 'file_url' ? 'ألصقي رابط الملف:' : 'ألصقي رابط داخل البوابة:');
      if (url == null || !url.trim()) return;
      payload = { url: url.trim() };
    } else {
      payload = {};
    }
    var sb = window.EduOS_SB;
    var existing = STATE.mySubs.find(function (s) { return s.task_id === task.id; });
    var uName = (window.__eduUser && (window.__eduUser.name_ar || window.__eduUser.username)) || (typeof user !== 'undefined' && (user.name_ar || user.username)) || ''; var row = { task_id: task.id, staff_db_id: STAFF_ID, staff_name: uName, status: 'pending', submission_data: payload, submitted_at: new Date().toISOString() };
    var q = existing ? sb.from('staff_task_submissions').update(row).eq('id', existing.id) : sb.from('staff_task_submissions').insert(row);
    q.then(function (r) {
      if (r.error) { toast('تعذّر التسليم: ' + r.error.message, true); return; }
      toast('✅ تم التسليم بنجاح');
      loadTeacherData();
    }).catch(function (e) { toast('تعذّر التسليم', true); });
  }

  /* ── إدارة: مهامي الصادرة ── */
  function renderIssuedBody() {
    var html = '<button class="eos-btn eos-btn-brand eos-create-fab" id="eos-open-create">➕ إنشاء مهمة</button>';
    if (!STATE.adminTasks.length) { html += '<div class="eos-empty">لا توجد مهام صادرة بعد</div>'; return html; }
    html += STATE.adminTasks.map(function (t) {
      var subsCount = 0, approvedCount = 0;
      // نحسب لاحقاً عند الحاجة عبر استعلام منفصل إن رغبنا؛ هنا نعرض معلومات أساسية
      return '<div class="eos-task-card">' +
        '<div class="eos-task-top"><div class="eos-task-title">' + escH(t.title) + '</div>' +
        (t.delegated_approval_to ? '<span class="eos-chip">🔗 مفوَّضة</span>' : '') + '</div>' +
        (t.description ? '<div class="eos-task-desc">' + escH(t.description) + '</div>' : '') +
        '<div class="eos-task-meta">' +
          '<span class="eos-chip eos-chip-pts">⭐ ' + (t.points || 0) + ' نقطة</span>' +
          '<span class="eos-chip">📅 ' + fmtDate(t.due_date) + '</span>' +
          '<span class="eos-chip">📎 ' + (TYPE_LABELS[t.submission_type] || t.submission_type || '—') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
    return html;
  }
  function bindIssuedEvents() {
    var b = document.getElementById('eos-open-create');
    if (b) b.addEventListener('click', openCreateModal);
  }

  /* ── إدارة: التسليمات المعلقة ── */
  function renderPendingBody() {
    var all = STATE.adminSubs.map(function (s) { return { sub: s, mode: 'review' }; })
      .concat(STATE.reviewExtra.map(function (s) { return { sub: s, mode: 'override' }; }));
    if (!all.length) return '<div class="eos-empty">🎉 لا توجد تسليمات بانتظار المراجعة</div>';
    return all.map(function (item) {
      var s = item.sub;
      var task = STATE.adminTasks.find(function (t) { return t.id === s.task_id; });
      var title = task ? task.title : ('مهمة #' + s.task_id);
      var dataStr = '';
      try {
        var d = typeof s.submission_data === 'string' ? JSON.parse(s.submission_data) : s.submission_data;
        if (d) dataStr = d.text || d.url || (d.done ? 'تم التأكيد ✔️' : '');
      } catch (e) {}
      var actions = '';
      if (item.mode === 'review') {
        actions = '<button class="eos-btn eos-btn-green eos-approve-btn" data-id="' + s.id + '">✅ اعتماد</button> ' +
                  '<button class="eos-btn eos-btn-red eos-reject-btn" data-id="' + s.id + '">❌ رفض</button>';
      } else {
        actions = '<div class="eos-chip" style="background:#FEF2F2;color:#BE123C;margin-bottom:8px">❌ رُفضت من الجهة المفوَّضة</div>' +
                  '<button class="eos-btn eos-btn-amber eos-override-btn" data-id="' + s.id + '">🔓 تجاوز واعتماد</button>';
      }
      return '<div class="eos-task-card">' +
        '<div class="eos-task-top"><div class="eos-task-title">' + escH(title) + '</div>' +
        '<span class="eos-chip">موظفة #' + escH(s.staff_db_id) + '</span></div>' +
        (dataStr ? '<div class="eos-task-desc">📝 ' + escH(dataStr) + '</div>' : '') +
        '<div style="margin-top:8px">' + actions + '</div>' +
      '</div>';
    }).join('');
  }

  function bindPendingEvents() {
    Array.prototype.forEach.call(document.querySelectorAll('.eos-approve-btn'), function (b) {
      b.addEventListener('click', function () { decideSubmission(this.getAttribute('data-id'), 'approved'); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.eos-reject-btn'), function (b) {
      b.addEventListener('click', function () { decideSubmission(this.getAttribute('data-id'), 'rejected'); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.eos-override-btn'), function (b) {
      b.addEventListener('click', function () { decideSubmission(this.getAttribute('data-id'), 'override_approved'); });
    });
  }

  function decideSubmission(subId, newStatus) {
    var sb = window.EduOS_SB;
    var sub = STATE.adminSubs.concat(STATE.reviewExtra).find(function (s) { return String(s.id) === String(subId); });
    if (!sub) return;
    var task = STATE.adminTasks.find(function (t) { return t.id === sub.task_id; });
    var doApprove = function(resolvedTask) {
      sb.from('staff_task_submissions').update({ status: newStatus, reviewed_by: STAFF_ID, reviewed_at: new Date().toISOString() }).eq('id', sub.id)
      .then(function (r) {
        if (r.error) {
          // إن فشل بسبب أعمدة غير موجودة، حاول بالحد الأدنى
          return sb.from('staff_task_submissions').update({ status: newStatus }).eq('id', sub.id);
        }
        return r;
      }).then(function (r2) {
        if (r2 && r2.error) { toast('تعذّر تنفيذ الإجراء: ' + r2.error.message, true); return; }
        if ((newStatus === 'approved' || newStatus === 'override_approved') && resolvedTask) {
          sb.from('staff_points_log').insert({
            staff_db_id: sub.staff_db_id, points: resolvedTask.points || 0, source: 'task',
            source_id: resolvedTask.id, note: resolvedTask.title, created_at: new Date().toISOString()
          }).catch(function () {});
          sb.from('staff_task_submissions').update({ points_awarded: resolvedTask.points || 0 }).eq('id', sub.id).catch(function () {});
        }
        toast('تم تحديث حالة التسليم');
        loadAdminData();
      }).catch(function () { toast('تعذّر تنفيذ الإجراء', true); });
    };
    if (!task && sub.task_id) {
      sb.from('staff_tasks').select('*').eq('id', sub.task_id).single().then(function(r) {
        doApprove(r.data || null);
      }).catch(function() { doApprove(null); });
    } else { doApprove(task); }
  }

  /* ─────────────────────── إنشاء مهمة جديدة ─────────────────────── */
  function renderAssignChips() {
    var chips = [
      { v: 'all', l: '👥 كل الموظفين' },
      { v: 'teachers', l: '🍎 كل المعلمات' }
    ].concat(STATE.staffList.map(function (p) { return { v: String(p.staff_db_id), l: p.name_ar || ('#' + p.staff_db_id) }; }));
    return chips.map(function (c) {
      return '<span class="eos-assign-chip" data-v="' + escH(c.v) + '">' + escH(c.l) + '</span>';
    }).join('');
  }

  function renderCreateForm() {
    return '' +
      '<div style="font-size:17px;font-weight:800;margin-bottom:16px">➕ إنشاء مهمة جديدة</div>' +
      '<div class="eos-field"><label>العنوان</label><input class="eos-input" id="eos-f-title" placeholder="عنوان المهمة"></div>' +
      '<div class="eos-field"><label>الوصف</label><textarea class="eos-textarea" id="eos-f-desc" rows="3" placeholder="تفاصيل المهمة"></textarea></div>' +
      '<div class="eos-field"><label>نوع التسليم</label><select class="eos-select" id="eos-f-type">' +
        '<option value="confirm">تأكيد إنجاز</option><option value="text">نص</option>' +
        '<option value="file_url">رابط ملف</option><option value="portal_link">رابط داخل البوابة</option>' +
      '</select></div>' +
      '<div class="eos-field"><label>الموعد النهائي</label><input class="eos-input" type="date" id="eos-f-due"></div>' +
      '<div class="eos-field"><label>النقاط</label><input class="eos-input" type="number" min="0" id="eos-f-points" value="1"></div>' +
      '<div class="eos-field"><label>إسناد إلى</label><div id="eos-assign-wrap">' + renderAssignChips() + '</div></div>' +
      (IS_PRINCIPAL ? '<div class="eos-field"><label>تفويض الاعتماد (اختياري)</label><select class="eos-select" id="eos-delegate-sel"><option value="">— بدون تفويض —</option></select></div>' : '') +
      '<div style="display:flex;gap:10px;margin-top:8px">' +
        '<button class="eos-btn eos-btn-brand" id="eos-save-task" style="flex:1">💾 حفظ المهمة</button>' +
        '<button class="eos-btn eos-btn-ghost" id="eos-cancel-task">إلغاء</button>' +
      '</div>';
  }

  function bindCreateForm() {
    bindAssignChips();
    document.getElementById('eos-cancel-task').addEventListener('click', closeCreateModal);
    document.getElementById('eos-save-task').addEventListener('click', saveNewTask);
  }
  function bindAssignChips() {
    Array.prototype.forEach.call(document.querySelectorAll('.eos-assign-chip'), function (c) {
      c.addEventListener('click', function () {
        var v = this.getAttribute('data-v');
        var idx = STATE.assignSel.indexOf(v);
        if (idx === -1) { STATE.assignSel.push(v); this.classList.add('sel'); }
        else { STATE.assignSel.splice(idx, 1); this.classList.remove('sel'); }
      });
    });
  }

  function saveNewTask() {
    var title = document.getElementById('eos-f-title').value.trim();
    if (!title) { toast('العنوان مطلوب', true); return; }
    if (!STATE.assignSel.length) { toast('اختاري جهة الإسناد', true); return; }
    var delSel = document.getElementById('eos-delegate-sel');
    var row = {
      title: title,
      description: document.getElementById('eos-f-desc').value.trim(),
      submission_type: document.getElementById('eos-f-type').value,
      due_date: document.getElementById('eos-f-due').value || null,
      points: parseInt(document.getElementById('eos-f-points').value, 10) || 0,
      assigned_to: STATE.assignSel,
      assigned_by_id: STAFF_ID,
      delegated_approval_to: (delSel && delSel.value) ? delSel.value : null,
      is_active: true,
      created_at: new Date().toISOString()
    };
    window.EduOS_SB.from('staff_tasks').insert(row).then(function (r) {
      if (r.error) { toast('تعذّر حفظ المهمة: ' + r.error.message, true); return; }
      toast('✅ تم إنشاء المهمة');
      closeCreateModal();
      loadAdminData();
    }).catch(function () { toast('تعذّر حفظ المهمة', true); });
  }

  /* ─────────────────────── تشغيل ─────────────────────── */
  function init() {
    injectStyle();
    buildHeaderButton();
    waitForSB(loadData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
