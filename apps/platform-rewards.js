/**
 * platform-rewards.js — نظام التحفيز والمكافآت
 * EduOS — 2026
 * يعمل في بوابات: المعلمة / المديرة / نائبة المدير
 * يعتمد على: window.EduOS_SB + sessionStorage('edoos_user')
 */
(function () {

  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('edoos_user') || '{}'); } catch (e) { user = {}; }
  if (!user || !user.id) return;

  var ROLE = user.role_key || user.role || '';
  var STAFF_ID = user.staff_db_id || user.id;
  var NAME = user.name_ar || user.name || 'الموظفة';
  var IS_PRINCIPAL = ROLE === 'principal';

  var STATE = {
    open: false,
    tab: 'my', // my | settings | requests
    loaded: false,
    total: 0,
    breakdown: { checkins: 0, plans: 0, reflections: 0, tasks: 0, manual: 0 },
    config: [],
    logRows: [],
    pendingRequests: [],
    leaderboard: []
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

  function toast(msg, isErr) {
    var t = document.getElementById('rwd-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'rwd-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;background:#1E293B;color:#fff;padding:12px 20px;border-radius:10px;font-family:Tajawal,Arial,sans-serif;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.25);opacity:0;transition:opacity .25s;max-width:320px';
      document.body.appendChild(t);
    }
    t.style.background = isErr ? '#DC2626' : '#1E293B';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.opacity = '0'; }, 2800);
  }

  var SOURCE_LABELS = {
    task: '📋 مهمة معتمدة',
    manual_add: '➕ إضافة يدوية',
    manual_deduct: '➖ خصم يدوي',
    reward_redeem: '🏆 استبدال مكافأة',
    checkin: '🕐 مناوبة',
    planning: '📝 خطة أسبوعية',
    lesson_reflection: '✍️ تأمل ذاتي'
  };

  /* ─────────────────────── CSS ─────────────────────── */
  function injectStyle() {
    if (document.getElementById('eos-rwd-style')) return;
    var s = document.createElement('style');
    s.id = 'eos-rwd-style';
    s.textContent = [
      '#eos-rwd-btn{position:relative;background:rgba(217,119,6,0.10);border:1.5px solid rgba(217,119,6,0.35);cursor:pointer;padding:7px 12px;border-radius:12px;display:flex;align-items:center;gap:6px;color:#D97706;transition:all .2s;font-family:Tajawal,Arial,sans-serif;font-size:13px;font-weight:700}',
      '#eos-rwd-btn:hover{background:rgba(217,119,6,0.18)}',
      '#eos-rwd-dot{position:absolute;top:2px;left:2px;width:9px;height:9px;border-radius:50%;background:#E11D48;display:none}',
      '#eos-rwd-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:9600;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto}',
      '#eos-rwd-backdrop.open{display:flex}',
      '#eos-rwd-card{background:#fff;border-radius:18px;width:min(760px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Tajawal,Arial,sans-serif;direction:rtl;color:#1E293B}',
      '#eos-rwd-head{background:linear-gradient(135deg,#D97706,#F59E0B);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
      '#eos-rwd-head h3{margin:0;color:#fff;font-size:17px;font-weight:800}',
      '.eos-r-close{background:rgba(255,255,255,.22);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '#eos-rwd-tabs{display:flex;background:#FFFBEB;border-bottom:2px solid #FDE68A;flex-shrink:0}',
      '.eos-r-tab{flex:1;padding:12px 6px;background:none;border:none;cursor:pointer;color:#92400E;font-size:13px;font-family:Tajawal,Arial,sans-serif;font-weight:700;border-bottom:3px solid transparent}',
      '.eos-r-tab.active{color:#D97706;border-bottom-color:#D97706;background:#fff}',
      '#eos-rwd-body{flex:1;overflow-y:auto;padding:18px 20px;background:#F8FAFB}',
      '.eos-r-balance{background:linear-gradient(135deg,#D97706,#F59E0B);border-radius:16px;padding:20px;color:#fff;text-align:center;margin-bottom:16px}',
      '.eos-r-balance .num{font-size:38px;font-weight:900}',
      '.eos-r-balance .lbl{font-size:13px;opacity:.9;font-weight:700}',
      '.eos-r-breakdown{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}',
      '.eos-r-bd-chip{flex:1;min-width:90px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:8px 10px;text-align:center}',
      '.eos-r-bd-chip .v{font-size:16px;font-weight:800;color:#1E293B}',
      '.eos-r-bd-chip .l{font-size:10px;color:#64748B;font-weight:700}',
      '.eos-r-card{background:#fff;border:1.5px solid #E2E8F0;border-radius:14px;padding:14px 16px;margin-bottom:12px}',
      '.eos-r-card-title{font-size:15px;font-weight:800;color:#1E293B;margin-bottom:6px}',
      '.eos-r-card-sub{font-size:13px;color:#475569;margin-bottom:10px}',
      '.eos-r-bar{height:10px;border-radius:6px;background:#F1F5F9;overflow:hidden;margin-bottom:10px}',
      '.eos-r-bar-fill{height:100%;background:linear-gradient(90deg,#D97706,#F59E0B);border-radius:6px}',
      '.eos-btn{font-family:Tajawal,Arial,sans-serif;border:none;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer}',
      '.eos-btn-amber{background:linear-gradient(135deg,#D97706,#F59E0B);color:#fff}',
      '.eos-btn-green{background:#059669;color:#fff}',
      '.eos-btn-red{background:#E11D48;color:#fff}',
      '.eos-btn-ghost{background:#F1F5F9;color:#334155}',
      '.eos-r-log-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px}',
      '.eos-r-log-row:last-child{border-bottom:none}',
      '.eos-empty{text-align:center;color:#94A3B8;padding:40px 20px;font-size:14px}',
      '.eos-loading{text-align:center;color:#94A3B8;padding:30px;font-size:14px}',
      '.eos-r-settings-row{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:10px;margin-bottom:8px;flex-wrap:wrap}',
      '.eos-r-settings-row input[type=text],.eos-r-settings-row input[type=number]{width:90px;padding:6px 8px;border:1px solid #E2E8F0;border-radius:7px;font-family:Tajawal,Arial,sans-serif}',
      '.eos-r-lb-row{display:flex;justify-content:space-between;padding:8px 12px;background:#fff;border:1px solid #E2E8F0;border-radius:9px;margin-bottom:6px;font-size:13px;font-weight:700}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ─────────────────────── DOM ─────────────────────── */
  function buildHeaderButton() {
    var host = document.getElementById('header-tools');
    if (!host || document.getElementById('eos-rwd-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'eos-rwd-btn';
    btn.title = 'نظام التحفيز';
    btn.innerHTML = '<span id="eos-rwd-dot"></span>🏆 <span id="eos-rwd-count">—</span> نقطة';
    btn.addEventListener('click', openPanel);
    host.appendChild(btn);
  }

  function buildOverlay() {
    if (document.getElementById('eos-rwd-backdrop')) return;
    var tabs = '<button class="eos-r-tab active" data-tab="my">🏆 مكافآتي</button>';
    if (IS_PRINCIPAL) {
      tabs += '<button class="eos-r-tab" data-tab="requests">📥 طلبات معلقة</button>';
      tabs += '<button class="eos-r-tab" data-tab="settings">⚙️ الإعدادات</button>';
    }
    var bd = document.createElement('div');
    bd.id = 'eos-rwd-backdrop';
    bd.innerHTML =
      '<div id="eos-rwd-card">' +
        '<div id="eos-rwd-head"><h3>🏆 نظام التحفيز</h3><button class="eos-r-close" id="eos-rwd-x">✕</button></div>' +
        '<div id="eos-rwd-tabs">' + tabs + '</div>' +
        '<div id="eos-rwd-body"><div class="eos-loading">⏳ جارٍ التحميل…</div></div>' +
      '</div>';
    document.body.appendChild(bd);
    bd.addEventListener('mousedown', function (e) { if (e.target === bd) closePanel(); });
    document.getElementById('eos-rwd-x').addEventListener('click', closePanel);
    Array.prototype.forEach.call(document.querySelectorAll('.eos-r-tab'), function (t) {
      t.addEventListener('click', function () {
        STATE.tab = this.getAttribute('data-tab');
        Array.prototype.forEach.call(document.querySelectorAll('.eos-r-tab'), function (x) { x.classList.remove('active'); });
        this.classList.add('active');
        renderTab();
      });
    });
  }

  function openPanel() {
    buildOverlay();
    document.getElementById('eos-rwd-backdrop').classList.add('open');
    STATE.open = true;
    waitForSB(loadAll);
  }
  function closePanel() {
    var bd = document.getElementById('eos-rwd-backdrop');
    if (bd) bd.classList.remove('open');
    STATE.open = false;
  }

  /* ─────────────────────── حساب النقاط ─────────────────────── */
  function computeMyBalance(staffId, cb) {
    var sb = window.EduOS_SB;
    var monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    var pCheckins = sb.from('staff_checkin_log').select('id', { count: 'exact', head: true })
      .eq('staff_db_id', staffId).eq('within_geofence', true)
      .then(function (r) { return r.count || 0; }).catch(function () { return 0; });

    var pPlans = sb.from('planning_records').select('*').eq('staff_db_id', staffId).eq('status', 'submitted')
      .then(function (r) {
        var rows = r.data || [];
        return rows.filter(function (row) {
          var d = row.submitted_at || row.created_at || row.week_start_date;
          if (!d) return false;
          var dd = new Date(d);
          return !isNaN(dd.getTime()) && dd >= monthStart;
        }).length;
      }).catch(function () { return 0; });

    var pReflect = sb.from('lesson_sessions').select('id', { count: 'exact', head: true })
      .eq('teacher_id', staffId).not('post_lesson_data', 'is', null)
      .then(function (r) { return r.count || 0; }).catch(function () { return 0; });

    var pTasks = sb.from('staff_task_submissions').select('points_awarded,status').eq('staff_db_id', staffId)
      .then(function (r) {
        var rows = r.data || [];
        return rows.filter(function (x) { return x.status === 'approved' || x.status === 'override_approved'; })
          .reduce(function (sum, x) { return sum + (x.points_awarded || 0); }, 0);
      }).catch(function () { return 0; });

    var pLog = sb.from('staff_points_log').select('*').eq('staff_db_id', staffId).order('created_at', { ascending: false })
      .then(function (r) { return r.data || []; }).catch(function () { return []; });

    Promise.all([pCheckins, pPlans, pReflect, pTasks, pLog]).then(function (res) {
      var checkins = res[0], plans = res[1], reflect = res[2], tasksPts = res[3], logRows = res[4];
      var manualNet = 0;
      logRows.forEach(function (r) {
        if (r.source === 'manual_add') manualNet += (r.points || 0);
        else if (r.source === 'manual_deduct') manualNet -= Math.abs(r.points || 0);
        else if (r.source === 'reward_redeem') manualNet -= Math.abs(r.points || 0);
      });
      var total = checkins + plans + reflect + tasksPts + manualNet;
      cb({
        total: total,
        breakdown: { checkins: checkins, plans: plans, reflections: reflect, tasks: tasksPts, manual: manualNet },
        logRows: logRows
      });
    });
  }

  /* ─────────────────────── تحميل عام ─────────────────────── */
  function loadAll() {
    computeMyBalance(STAFF_ID, function (res) {
      STATE.total = res.total;
      STATE.breakdown = res.breakdown;
      STATE.logRows = res.logRows;
      updateHeaderCount();
      loadConfig(function () {
        STATE.loaded = true;
        if (IS_PRINCIPAL) { loadPendingRequests(); }
        renderTab();
      });
    });
  }

  function loadConfig(cb) {
    window.EduOS_SB.from('staff_rewards_config').select('*').order('required_points', { ascending: true }).then(function (r) {
      STATE.config = r.data || [];
      cb && cb();
    }).catch(function () { STATE.config = []; cb && cb(); });
  }

  function loadPendingRequests() {
    var sb = window.EduOS_SB;
    sb.from('staff_rewards_log').select('*').eq('status', 'pending').then(function (r) {
      STATE.pendingRequests = r.data || [];
      var dot = document.getElementById('eos-rwd-dot');
      if (dot) dot.style.display = STATE.pendingRequests.length ? 'block' : 'none';
      if (STATE.tab === 'requests') renderTab();
    }).catch(function () { STATE.pendingRequests = []; });
  }

  function loadLeaderboard(cb) {
    var sb = window.EduOS_SB;
    var monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    Promise.all([
      sb.from('staff_profiles').select('staff_db_id,name_ar').eq('is_active', true).then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('staff_checkin_log').select('staff_db_id').eq('within_geofence', true).then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('planning_records').select('staff_db_id,submitted_at,created_at,week_start_date,status').eq('status', 'submitted').then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('lesson_sessions').select('teacher_id,post_lesson_data').not('post_lesson_data', 'is', null).then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('staff_task_submissions').select('staff_db_id,status,points_awarded').then(function (r) { return r.data || []; }).catch(function () { return []; }),
      sb.from('staff_points_log').select('staff_db_id,points,source').then(function (r) { return r.data || []; }).catch(function () { return []; })
    ]).then(function (res) {
      var staff = res[0], checkins = res[1], plans = res[2], sessions = res[3], subs = res[4], logs = res[5];
      var map = {};
      staff.forEach(function (s) { map[s.staff_db_id] = { name: s.name_ar || ('#' + s.staff_db_id), total: 0 }; });
      function add(id, n) { if (map[id]) map[id].total += n; }
      checkins.forEach(function (r) { add(r.staff_db_id, 1); });
      plans.forEach(function (r) {
        var d = r.submitted_at || r.created_at || r.week_start_date;
        if (d && new Date(d) >= monthStart) add(r.staff_db_id, 1);
      });
      sessions.forEach(function (r) { add(r.teacher_id, 1); });
      subs.forEach(function (r) { if (r.status === 'approved' || r.status === 'override_approved') add(r.staff_db_id, r.points_awarded || 0); });
      logs.forEach(function (r) {
        if (r.source === 'manual_add') add(r.staff_db_id, r.points || 0);
        else if (r.source === 'manual_deduct') add(r.staff_db_id, -Math.abs(r.points || 0));
        else if (r.source === 'reward_redeem') add(r.staff_db_id, -Math.abs(r.points || 0));
      });
      STATE.leaderboard = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 15);
      cb && cb();
    });
  }

  function updateHeaderCount() {
    var el = document.getElementById('eos-rwd-count');
    if (el) el.textContent = STATE.total;
  }

  /* ─────────────────────── العرض ─────────────────────── */
  function renderTab() {
    var body = document.getElementById('eos-rwd-body');
    if (!body) return;
    if (!STATE.loaded) { body.innerHTML = '<div class="eos-loading">⏳ جارٍ التحميل…</div>'; return; }
    if (STATE.tab === 'my') { body.innerHTML = renderMyTab(); bindMyTab(); }
    else if (STATE.tab === 'requests') { body.innerHTML = renderRequestsTab(); bindRequestsTab(); }
    else if (STATE.tab === 'settings') {
      body.innerHTML = '<div class="eos-loading">⏳ جارٍ تحميل لوحة الترتيب…</div>';
      loadLeaderboard(function () { body.innerHTML = renderSettingsTab(); bindSettingsTab(); });
    }
  }

  function renderMyTab() {
    var bd = STATE.breakdown;
    var html = '<div class="eos-r-balance"><div class="num">' + STATE.total + '</div><div class="lbl">رصيد النقاط الحالي</div></div>';
    html += '<div class="eos-r-breakdown">' +
      '<div class="eos-r-bd-chip"><div class="v">' + bd.checkins + '</div><div class="l">🕐 مناوبات</div></div>' +
      '<div class="eos-r-bd-chip"><div class="v">' + bd.plans + '</div><div class="l">📝 خطط</div></div>' +
      '<div class="eos-r-bd-chip"><div class="v">' + bd.reflections + '</div><div class="l">✍️ تأملات</div></div>' +
      '<div class="eos-r-bd-chip"><div class="v">' + bd.tasks + '</div><div class="l">📋 مهام</div></div>' +
      '<div class="eos-r-bd-chip"><div class="v">' + bd.manual + '</div><div class="l">⚙️ يدوي</div></div>' +
    '</div>';

    if (!STATE.config.length) {
      html += '<div class="eos-empty">لا توجد مكافآت مُعرَّفة بعد</div>';
    } else {
      html += STATE.config.map(function (c) {
        var req = c.required_points || 0;
        var pct = req > 0 ? Math.min(100, Math.round((STATE.total / req) * 100)) : 100;
        var remaining = Math.max(0, req - STATE.total);
        var canRequest = STATE.total >= req && c.is_active !== false && !c.blackout_active;
        var note = c.blackout_active ? '<div class="eos-r-card-sub" style="color:#E11D48">⛔ الفترة الحرجة مفعّلة — لا يمكن الطلب حالياً</div>' : '';
        return '<div class="eos-r-card">' +
          '<div class="eos-r-card-title">' + escH(c.title || c.name || 'مكافأة') + ' — تحتاجين ' + req + ' نقطة</div>' +
          '<div class="eos-r-card-sub">رصيدك: ' + STATE.total + ' نقطة | يتبقى: ' + remaining + ' نقطة' +
            (c.monthly_limit_hours ? ' | الحد الشهري: ' + c.monthly_limit_hours + ' ساعة' : '') + '</div>' +
          '<div class="eos-r-bar"><div class="eos-r-bar-fill" style="width:' + pct + '%"></div></div>' +
          note +
          (canRequest ? '<button class="eos-btn eos-btn-amber eos-req-btn" data-id="' + c.id + '" data-req="' + req + '">🏆 طلب مكافأة</button>' : '') +
        '</div>';
      }).join('');
    }

    html += '<div class="eos-r-card"><div class="eos-r-card-title">📜 سجل الحركات</div>';
    if (!STATE.logRows.length) {
      html += '<div class="eos-empty" style="padding:16px">لا توجد حركات مسجّلة بعد</div>';
    } else {
      html += STATE.logRows.slice(0, 30).map(function (r) {
        var sign = (r.points || 0) >= 0 ? '+' : '';
        return '<div class="eos-r-log-row"><span>' + (SOURCE_LABELS[r.source] || r.source || '—') + (r.note ? ' — ' + escH(r.note) : '') + '</span>' +
          '<span>' + sign + (r.points || 0) + ' · ' + fmtDate(r.created_at) + '</span></div>';
      }).join('');
    }
    html += '</div>';
    return html;
  }

  function bindMyTab() {
    Array.prototype.forEach.call(document.querySelectorAll('.eos-req-btn'), function (b) {
      b.addEventListener('click', function () { requestReward(this.getAttribute('data-id'), this.getAttribute('data-req')); });
    });
  }

  function requestReward(cfgId, req) {
    var cfg = STATE.config.find(function (c) { return String(c.id) === String(cfgId); });
    if (!cfg) return;
    if (!confirm('تأكيد طلب مكافأة: ' + (cfg.title || cfg.name) + '؟')) return;
    window.EduOS_SB.from('staff_rewards_log').insert({
      staff_db_id: STAFF_ID, reward_id: cfg.id, status: 'pending',
      points_spent: parseInt(req, 10) || 0, requested_at: new Date().toISOString()
    }).then(function (r) {
      if (r.error) { toast('تعذّر إرسال الطلب: ' + r.error.message, true); return; }
      toast('✅ تم إرسال طلب المكافأة، بانتظار اعتماد المديرة');
    }).catch(function () { toast('تعذّر إرسال الطلب', true); });
  }

  /* ── طلبات معلقة (مديرة) ── */
  function renderRequestsTab() {
    if (!STATE.pendingRequests.length) return '<div class="eos-empty">🎉 لا توجد طلبات معلقة</div>';
    return STATE.pendingRequests.map(function (r) {
      var cfg = STATE.config.find(function (c) { return c.id === r.reward_id; });
      return '<div class="eos-r-card">' +
        '<div class="eos-r-card-title">' + escH(cfg ? (cfg.title || cfg.name) : ('مكافأة #' + r.reward_id)) + '</div>' +
        '<div class="eos-r-card-sub">موظفة #' + escH(r.staff_db_id) + ' — ' + (r.points_spent || 0) + ' نقطة — ' + fmtDate(r.requested_at) + '</div>' +
        '<button class="eos-btn eos-btn-green eos-appr-req" data-id="' + r.id + '" data-staff="' + escH(r.staff_db_id) + '" data-pts="' + (r.points_spent || 0) + '">✅ اعتماد</button> ' +
        '<button class="eos-btn eos-btn-red eos-rej-req" data-id="' + r.id + '">❌ رفض</button>' +
      '</div>';
    }).join('');
  }
  function bindRequestsTab() {
    Array.prototype.forEach.call(document.querySelectorAll('.eos-appr-req'), function (b) {
      b.addEventListener('click', function () { decideRequest(this.getAttribute('data-id'), 'approved', this.getAttribute('data-staff'), this.getAttribute('data-pts')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.eos-rej-req'), function (b) {
      b.addEventListener('click', function () { decideRequest(this.getAttribute('data-id'), 'rejected'); });
    });
  }
  function decideRequest(logId, status, staffId, pts) {
    var sb = window.EduOS_SB;
    sb.from('staff_rewards_log').update({ status: status, reviewed_by: STAFF_ID, reviewed_at: new Date().toISOString() }).eq('id', logId)
      .then(function (r) {
        if (r.error) return sb.from('staff_rewards_log').update({ status: status }).eq('id', logId);
        return r;
      }).then(function (r2) {
        if (r2 && r2.error) { toast('تعذّر التنفيذ: ' + r2.error.message, true); return; }
        if (status === 'approved' && staffId) {
          sb.from('staff_points_log').insert({
            staff_db_id: staffId, points: parseInt(pts, 10) || 0, source: 'reward_redeem',
            note: 'استبدال مكافأة', created_at: new Date().toISOString()
          }).catch(function () {});
        }
        toast('تم تحديث الطلب');
        loadPendingRequests();
      }).catch(function () { toast('تعذّر التنفيذ', true); });
  }

  /* ── الإعدادات (مديرة) ── */
  function renderSettingsTab() {
    var html = '<div class="eos-r-card"><div class="eos-r-card-title">⚙️ إعدادات المكافآت</div>';
    html += '<button class="eos-btn eos-btn-amber" id="eos-toggle-blackout" style="margin-bottom:12px">⛔ تفعيل/تعطيل الفترة الحرجة</button>';
    if (!STATE.config.length) {
      html += '<div class="eos-empty">لا توجد مكافآت بعد</div>';
    } else {
      html += STATE.config.map(function (c) {
        return '<div class="eos-r-settings-row" data-id="' + c.id + '">' +
          '<span style="min-width:120px;font-weight:700">' + escH(c.title || c.name || '—') + '</span>' +
          'نقاط مطلوبة <input type="number" class="cfg-req" value="' + (c.required_points || 0) + '">' +
          'حد شهري(س) <input type="number" class="cfg-hours" value="' + (c.monthly_limit_hours || 0) + '">' +
          '<label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="cfg-active" ' + (c.is_active !== false ? 'checked' : '') + '> مفعّلة</label>' +
          '<button class="eos-btn eos-btn-ghost cfg-save">💾 حفظ</button>' +
        '</div>';
      }).join('');
    }
    html += '</div>';
    html += '<div class="eos-r-card"><div class="eos-r-card-title">🏅 لوحة ترتيب الالتزام</div>';
    if (!STATE.leaderboard.length) html += '<div class="eos-empty">لا بيانات</div>';
    else html += STATE.leaderboard.map(function (l, i) {
      return '<div class="eos-r-lb-row"><span>' + (i + 1) + '. ' + escH(l.name) + '</span><span>' + l.total + ' نقطة</span></div>';
    }).join('');
    html += '</div>';
    return html;
  }
  function bindSettingsTab() {
    var bb = document.getElementById('eos-toggle-blackout');
    if (bb) bb.addEventListener('click', toggleBlackout);
    Array.prototype.forEach.call(document.querySelectorAll('.cfg-save'), function (b) {
      b.addEventListener('click', function () {
        var row = this.closest('.eos-r-settings-row');
        var id = row.getAttribute('data-id');
        var reqV = parseInt(row.querySelector('.cfg-req').value, 10) || 0;
        var hrsV = parseInt(row.querySelector('.cfg-hours').value, 10) || 0;
        var actV = row.querySelector('.cfg-active').checked;
        window.EduOS_SB.from('staff_rewards_config').update({ required_points: reqV, monthly_limit_hours: hrsV, is_active: actV }).eq('id', id)
          .then(function (r) {
            if (r.error) { toast('تعذّر الحفظ: ' + r.error.message, true); return; }
            toast('✅ تم الحفظ');
            loadConfig();
          }).catch(function () { toast('تعذّر الحفظ', true); });
      });
    });
  }
  function toggleBlackout() {
    if (!STATE.config.length) return;
    var newVal = !STATE.config.every(function (c) { return c.blackout_active; });
    var ids = STATE.config.map(function (c) { return c.id; });
    window.EduOS_SB.from('staff_rewards_config').update({ blackout_active: newVal }).in('id', ids).then(function (r) {
      if (r.error) { toast('تعذّر التحديث: ' + r.error.message, true); return; }
      toast(newVal ? '⛔ تم تفعيل الفترة الحرجة' : '✅ تم تعطيل الفترة الحرجة');
      loadConfig(function () { renderTab(); });
    }).catch(function () { toast('تعذّر التحديث', true); });
  }

  /* ─────────────────────── تشغيل ─────────────────────── */
  function init() {
    injectStyle();
    buildHeaderButton();
    waitForSB(function () {
      computeMyBalance(STAFF_ID, function (res) {
        STATE.total = res.total;
        STATE.breakdown = res.breakdown;
        STATE.logRows = res.logRows;
        updateHeaderCount();
      });
      if (IS_PRINCIPAL) loadPendingRequests();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
