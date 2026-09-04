/**
 * platform-messages.js — نظام الرسائل الداخلية الفورية
 * EduOS v1.0 — 2026-09-04
 * يُضاف بـ defer في كل بوابة موظف
 * لا localStorage — بيانات من Supabase فقط
 */
(function () {
  'use strict';

  /* ══════════════════════════════════
     1. قراءة الجلسة — بدون جلسة لا شيء
     ══════════════════════════════════ */
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('edoos_user') || 'null'); } catch (e) {}
  if (!user || !user.id) return;

  /* ══════════════════════════════════
     2. الحالة — كلها في الذاكرة فقط
     ══════════════════════════════════ */
  var state = {
    msgs: [],
    unread: 0,
    open: false,
    tab: 'inbox',       // inbox | compose | detail
    staffList: [],
    activeMsg: null,
    channel: null,
    loaded: false,
    retries: 0
  };

  /* ══════════════════════════════════
     3. انتظار EduOS_SB (auth client)
     ══════════════════════════════════ */
  function waitForSB(cb) {
    if (window.EduOS_SB) { cb(); return; }
    if (state.retries++ > 30) return;
    setTimeout(function () { waitForSB(cb); }, 300);
  }

  /* ══════════════════════════════════
     4. CSS — لا يؤثر على تصميم البوابة
     ══════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('msg-sys-style')) return;
    var s = document.createElement('style');
    s.id = 'msg-sys-style';
    s.textContent = [
      '#msg-float-btn{',
        'position:fixed;bottom:24px;left:24px;z-index:9000;',
        'width:56px;height:56px;border-radius:50%;border:none;',
        'background:linear-gradient(135deg,#6C3DD6,#22D3EE);',
        'color:#fff;font-size:22px;cursor:pointer;',
        'display:flex;align-items:center;justify-content:center;',
        'box-shadow:0 4px 18px rgba(108,61,214,0.5);',
        'transition:transform 0.2s,box-shadow 0.2s;',
      '}',
      '#msg-float-btn:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(108,61,214,0.7);}',
      '#msg-badge{',
        'position:absolute;top:6px;right:6px;',
        'background:#EF4444;color:#fff;',
        'width:18px;height:18px;border-radius:50%;',
        'font-size:10px;font-weight:900;',
        'display:flex;align-items:center;justify-content:center;',
        'border:2px solid #fff;',
      '}',
      '#msg-overlay{',
        'position:fixed;inset:0;z-index:8999;background:rgba(0,0,0,0.4);',
        'opacity:0;pointer-events:none;transition:opacity 0.25s;',
      '}',
      '#msg-overlay.open{opacity:1;pointer-events:all;}',
      '#msg-panel{',
        'position:fixed;top:0;left:0;bottom:0;width:380px;max-width:100vw;',
        'z-index:9001;background:#0d1b2a;color:#fff;',
        'display:flex;flex-direction:column;direction:rtl;',
        'font-family:Tajawal,Arial,sans-serif;',
        'transform:translateX(-100%);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);',
        'box-shadow:4px 0 32px rgba(0,0,0,0.6);',
      '}',
      '#msg-panel.open{transform:translateX(0);}',
      '.msg-panel-header{',
        'display:flex;align-items:center;gap:10px;',
        'padding:16px 18px;',
        'background:linear-gradient(135deg,#1a0940,#162132);',
        'border-bottom:1px solid rgba(255,255,255,0.08);',
        'flex-shrink:0;',
      '}',
      '.msg-panel-title{flex:1;font-size:17px;font-weight:900;color:#fff;}',
      '.msg-panel-sub{font-size:11px;color:rgba(255,255,255,0.5);}',
      '.msg-panel-close{',
        'width:34px;height:34px;border-radius:8px;border:none;',
        'background:rgba(255,255,255,0.1);color:#fff;font-size:16px;',
        'cursor:pointer;display:flex;align-items:center;justify-content:center;',
      '}',
      '.msg-tabs{',
        'display:flex;flex-shrink:0;',
        'border-bottom:1px solid rgba(255,255,255,0.08);',
      '}',
      '.msg-tab{',
        'flex:1;padding:12px;text-align:center;font-size:13px;font-weight:700;',
        'color:rgba(255,255,255,0.5);cursor:pointer;border:none;background:none;',
        'font-family:Tajawal,Arial,sans-serif;',
        'border-bottom:2px solid transparent;transition:all 0.2s;',
      '}',
      '.msg-tab.active{color:#22D3EE;border-bottom-color:#22D3EE;}',
      '.msg-tab:hover:not(.active){color:rgba(255,255,255,0.8);}',
      '.msg-body{flex:1;overflow-y:auto;padding:12px;}',
      '.msg-body::-webkit-scrollbar{width:4px;}',
      '.msg-body::-webkit-scrollbar-track{background:transparent;}',
      '.msg-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px;}',
      '.msg-card{',
        'background:#162132;border:1px solid rgba(255,255,255,0.06);',
        'border-radius:12px;padding:14px;margin-bottom:10px;',
        'cursor:pointer;transition:background 0.2s;position:relative;',
      '}',
      '.msg-card:hover{background:#1e2d40;}',
      '.msg-card.unread{border-right:3px solid #6C3DD6;}',
      '.msg-card-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;}',
      '.msg-sender{font-size:13px;font-weight:700;color:#D4A84B;flex:1;}',
      '.msg-time{font-size:11px;color:rgba(255,255,255,0.4);}',
      '.msg-subject{font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;}',
      '.msg-preview{font-size:12px;color:rgba(255,255,255,0.5);',
        'overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}',
      '.msg-priority{',
        'display:inline-block;padding:2px 8px;border-radius:6px;',
        'font-size:10px;font-weight:700;margin-top:6px;',
      '}',
      '.msg-priority.urgent{background:#7f1d1d;color:#fca5a5;}',
      '.msg-priority.important{background:#78350f;color:#fcd34d;}',
      '.msg-priority.normal{background:#1e3a5f;color:#7dd3fc;}',
      '.msg-unread-dot{',
        'width:8px;height:8px;border-radius:50%;',
        'background:#6C3DD6;flex-shrink:0;',
      '}',
      '.msg-empty{',
        'text-align:center;padding:48px 20px;color:rgba(255,255,255,0.3);',
        'font-size:14px;',
      '}',
      '.msg-empty-icon{font-size:48px;margin-bottom:12px;}',
      '.msg-detail{padding:16px;}',
      '.msg-detail-back{',
        'display:flex;align-items:center;gap:6px;',
        'color:#22D3EE;font-size:13px;cursor:pointer;',
        'margin-bottom:16px;font-weight:700;',
      '}',
      '.msg-detail-subject{font-size:18px;font-weight:900;color:#fff;margin-bottom:8px;}',
      '.msg-detail-meta{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:16px;}',
      '.msg-detail-body{',
        'font-size:14px;color:rgba(255,255,255,0.85);',
        'line-height:1.8;background:#162132;',
        'border-radius:10px;padding:16px;',
        'white-space:pre-wrap;',
      '}',
      '.compose-form{padding:16px;display:flex;flex-direction:column;gap:14px;}',
      '.compose-label{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px;display:block;}',
      '.compose-input,.compose-select,.compose-textarea{',
        'width:100%;padding:10px 12px;',
        'background:#162132;border:1px solid rgba(255,255,255,0.12);',
        'border-radius:10px;color:#fff;font-family:Tajawal,Arial,sans-serif;',
        'font-size:14px;outline:none;',
        'transition:border-color 0.2s;direction:rtl;',
      '}',
      '.compose-input:focus,.compose-select:focus,.compose-textarea:focus{',
        'border-color:#6C3DD6;',
      '}',
      '.compose-select option{background:#162132;}',
      '.compose-textarea{min-height:120px;resize:vertical;}',
      '.compose-send{',
        'padding:12px;border:none;border-radius:10px;',
        'background:linear-gradient(135deg,#6C3DD6,#22D3EE);',
        'color:#fff;font-family:Tajawal,Arial,sans-serif;',
        'font-size:15px;font-weight:900;cursor:pointer;',
        'transition:opacity 0.2s;',
      '}',
      '.compose-send:hover{opacity:0.9;}',
      '.compose-send:disabled{opacity:0.5;cursor:not-allowed;}',
      '.msg-sending{',
        'text-align:center;padding:12px;',
        'color:#22D3EE;font-size:13px;',
      '}',
      '.msg-success{',
        'text-align:center;padding:20px;color:#10B981;',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════
     5. بناء عناصر الواجهة
     ══════════════════════════════════ */
  function buildUI() {
    injectStyles();

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'msg-overlay';
    overlay.setAttribute('role', 'presentation');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closePanel);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'msg-panel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'نظام الرسائل');

    // Header
    var header = document.createElement('div');
    header.className = 'msg-panel-header';
    var titleWrap = document.createElement('div');
    titleWrap.style.flex = '1';
    var title = document.createElement('div');
    title.className = 'msg-panel-title';
    title.textContent = 'الرسائل الداخلية';
    var sub = document.createElement('div');
    sub.className = 'msg-panel-sub';
    sub.id = 'msg-panel-sub';
    sub.textContent = 'جارٍ التحميل...';
    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);
    var closeBtn = document.createElement('button');
    closeBtn.className = 'msg-panel-close';
    closeBtn.setAttribute('aria-label', 'إغلاق');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', closePanel);
    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    // Tabs
    var tabs = document.createElement('div');
    tabs.className = 'msg-tabs';
    var tabInbox = document.createElement('button');
    tabInbox.className = 'msg-tab active';
    tabInbox.setAttribute('data-tab', 'inbox');
    tabInbox.textContent = 'صندوق الوارد';
    var tabCompose = document.createElement('button');
    tabCompose.className = 'msg-tab';
    tabCompose.setAttribute('data-tab', 'compose');
    tabCompose.textContent = '✏ رسالة جديدة';
    tabs.appendChild(tabInbox);
    tabs.appendChild(tabCompose);
    tabInbox.addEventListener('click', function () { switchTab('inbox'); });
    tabCompose.addEventListener('click', function () { switchTab('compose'); });

    // Body
    var body = document.createElement('div');
    body.className = 'msg-body';
    body.id = 'msg-panel-body';
    body.innerHTML = '<div class="msg-empty"><div class="msg-empty-icon">📬</div>جارٍ التحميل...</div>';

    panel.appendChild(header);
    panel.appendChild(tabs);
    panel.appendChild(body);
    document.body.appendChild(panel);

    // Floating button
    var btn = document.createElement('button');
    btn.id = 'msg-float-btn';
    btn.setAttribute('aria-label', 'الرسائل الداخلية');
    btn.setAttribute('title', 'الرسائل الداخلية');
    btn.textContent = '✉';
    var badge = document.createElement('span');
    badge.id = 'msg-badge';
    badge.style.display = 'none';
    badge.textContent = '0';
    btn.appendChild(badge);
    document.body.appendChild(btn);
    btn.addEventListener('click', togglePanel);
  }

  /* ══════════════════════════════════
     6. فتح / إغلاق اللوحة
     ══════════════════════════════════ */
  function togglePanel() {
    if (state.open) closePanel();
    else openPanel();
  }

  function openPanel() {
    state.open = true;
    document.getElementById('msg-panel').classList.add('open');
    document.getElementById('msg-overlay').classList.add('open');
    if (!state.loaded) loadMessages();
    else renderCurrentTab();
  }

  function closePanel() {
    state.open = false;
    document.getElementById('msg-panel').classList.remove('open');
    document.getElementById('msg-overlay').classList.remove('open');
  }

  /* ══════════════════════════════════
     7. تبديل التبويب
     ══════════════════════════════════ */
  function switchTab(tab) {
    state.tab = tab;
    state.activeMsg = null;
    document.querySelectorAll('.msg-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-tab') === tab);
    });
    renderCurrentTab();
    if (tab === 'compose' && state.staffList.length === 0) loadStaff();
  }

  function renderCurrentTab() {
    if (state.tab === 'inbox') renderInbox();
    else if (state.tab === 'compose') renderCompose();
    else if (state.tab === 'detail' && state.activeMsg) renderDetail(state.activeMsg);
  }

  /* ══════════════════════════════════
     8. تحميل الرسائل من DB
     ══════════════════════════════════ */
  function loadMessages() {
    var sb = window.EduOS_SB;
    if (!sb) return;
    sb.from('internal_messages')
      .select('id,subject,body,sender_name,sender_role,recipient,priority,is_read,created_at,sender_id')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function (res) {
        if (res.error) { console.warn('[Messages]', res.error.message); return; }
        state.msgs = res.data || [];
        state.loaded = true;
        // حساب غير المقروءة
        state.unread = state.msgs.filter(function (m) {
          return !m.is_read && m.sender_id !== user.id;
        }).length;
        updateBadge();
        updateSubtitle();
        if (state.open) renderInbox();
      });
  }

  /* ══════════════════════════════════
     9. Real-time subscription
     ══════════════════════════════════ */
  function subscribeRealtime() {
    var sb = window.EduOS_SB;
    if (!sb || state.channel) return;
    try {
      state.channel = sb.channel('internal_messages_feed')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages'
        }, function (payload) {
          var msg = payload.new;
          // أضفها في البداية
          state.msgs.unshift(msg);
          if (!msg.is_read && msg.sender_id !== user.id) {
            state.unread++;
            updateBadge();
            showToast(msg.sender_name, msg.subject);
          }
          if (state.open && state.tab === 'inbox') renderInbox();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_messages'
        }, function (payload) {
          var updated = payload.new;
          state.msgs = state.msgs.map(function (m) {
            return m.id === updated.id ? updated : m;
          });
          state.unread = state.msgs.filter(function (m) {
            return !m.is_read && m.sender_id !== user.id;
          }).length;
          updateBadge();
          if (state.open && state.tab === 'inbox') renderInbox();
        })
        .subscribe();
    } catch (e) {
      console.warn('[Messages Realtime]', e);
    }
  }

  /* ══════════════════════════════════
     10. تحديث الشارة
     ══════════════════════════════════ */
  function updateBadge() {
    var badge = document.getElementById('msg-badge');
    if (!badge) return;
    if (state.unread > 0) {
      badge.textContent = state.unread > 99 ? '99+' : state.unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function updateSubtitle() {
    var sub = document.getElementById('msg-panel-sub');
    if (!sub) return;
    if (state.unread > 0) {
      sub.textContent = state.unread + ' رسالة غير مقروءة';
      sub.style.color = '#22D3EE';
    } else {
      sub.textContent = 'صندوق بريدك الداخلي';
      sub.style.color = 'rgba(255,255,255,0.5)';
    }
  }

  /* ══════════════════════════════════
     11. عرض قائمة الرسائل
     ══════════════════════════════════ */
  function renderInbox() {
    var body = document.getElementById('msg-panel-body');
    if (!body) return;
    if (!state.loaded) {
      body.innerHTML = '<div class="msg-empty"><div class="msg-empty-icon">⏳</div>جارٍ التحميل...</div>';
      return;
    }
    if (state.msgs.length === 0) {
      body.innerHTML = '<div class="msg-empty"><div class="msg-empty-icon">📭</div>لا توجد رسائل بعد</div>';
      return;
    }
    var html = '';
    state.msgs.forEach(function (m) {
      var isUnread = !m.is_read && m.sender_id !== user.id;
      var pClass = m.priority === 'urgent' ? 'urgent' : m.priority === 'important' ? 'important' : 'normal';
      var pLabel = m.priority === 'urgent' ? 'عاجل' : m.priority === 'important' ? 'مهم' : 'عادي';
      var timeStr = fmtTime(m.created_at);
      html += '<div class="msg-card' + (isUnread ? ' unread' : '') + '" data-msgid="' + m.id + '">';
      html += '<div class="msg-card-top">';
      if (isUnread) html += '<div class="msg-unread-dot"></div>';
      html += '<span class="msg-sender">' + (m.sender_name || 'غير معروف') + '</span>';
      html += '<span class="msg-time">' + timeStr + '</span>';
      html += '</div>';
      html += '<div class="msg-subject">' + escHtml(m.subject || '') + '</div>';
      html += '<div class="msg-preview">' + escHtml(m.body || '') + '</div>';
      html += '<span class="msg-priority ' + pClass + '">' + pLabel + '</span>';
      html += '</div>';
    });
    body.innerHTML = html;
    body.querySelectorAll('.msg-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = this.getAttribute('data-msgid');
        var msg = state.msgs.find(function (m) { return m.id === id; });
        if (msg) openDetail(msg);
      });
    });
  }

  /* ══════════════════════════════════
     12. عرض رسالة كاملة
     ══════════════════════════════════ */
  function openDetail(msg) {
    state.tab = 'detail';
    state.activeMsg = msg;
    renderDetail(msg);
    // تحديث التبويب بصرياً
    document.querySelectorAll('.msg-tab').forEach(function (el) {
      el.classList.remove('active');
    });
    // تحديد الرسالة كمقروءة
    if (!msg.is_read && msg.sender_id !== user.id) markRead(msg.id);
  }

  function renderDetail(msg) {
    var body = document.getElementById('msg-panel-body');
    if (!body) return;
    var pLabel = msg.priority === 'urgent' ? 'عاجل 🔴' : msg.priority === 'important' ? 'مهم 🟡' : 'عادي';
    var timeStr = new Date(msg.created_at).toLocaleString('ar-AE', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    var html = '';
    html += '<div class="msg-detail">';
    html += '<div class="msg-detail-back" id="msg-back-btn">&#x2190; العودة للرسائل</div>';
    html += '<div class="msg-detail-subject">' + escHtml(msg.subject || '') + '</div>';
    html += '<div class="msg-detail-meta">من: ' + escHtml(msg.sender_name || '') + ' &bull; ' + timeStr + ' &bull; ' + pLabel + '</div>';
    html += '<div class="msg-detail-body">' + escHtml(msg.body || '') + '</div>';
    html += '</div>';
    body.innerHTML = html;
    body.querySelector('#msg-back-btn').addEventListener('click', function () {
      state.tab = 'inbox';
      state.activeMsg = null;
      document.querySelectorAll('.msg-tab').forEach(function (el) {
        el.classList.toggle('active', el.getAttribute('data-tab') === 'inbox');
      });
      renderInbox();
    });
  }

  /* ══════════════════════════════════
     13. تحديد كمقروءة
     ══════════════════════════════════ */
  function markRead(msgId) {
    var sb = window.EduOS_SB;
    if (!sb) return;
    sb.from('internal_messages')
      .update({ is_read: true })
      .eq('id', msgId)
      .then(function () {
        state.msgs = state.msgs.map(function (m) {
          if (m.id === msgId) return Object.assign({}, m, { is_read: true });
          return m;
        });
        state.unread = Math.max(0, state.unread - 1);
        updateBadge();
        updateSubtitle();
      });
  }

  /* ══════════════════════════════════
     14. تحميل قائمة الموظفين (للإرسال)
     ══════════════════════════════════ */
  function loadStaff() {
    var sb = window.EduOS_SB;
    if (!sb) return;
    sb.from('staff_profiles')
      .select('staff_db_id,name_ar,role_key,role_title_ar')
      .neq('staff_db_id', user.id)
      .eq('is_active', true)
      .order('name_ar')
      .limit(150)
      .then(function (res) {
        if (!res.error) {
          state.staffList = res.data || [];
          // إعادة رسم نموذج الإرسال إن كان مفتوحاً
          if (state.tab === 'compose') renderCompose();
        }
      });
  }

  /* ══════════════════════════════════
     15. نموذج الإرسال
     ══════════════════════════════════ */
  function renderCompose() {
    var body = document.getElementById('msg-panel-body');
    if (!body) return;

    // خيارات المستلم بناءً على الدور
    var rk = user.role_key || user.role || '';
    var isManager = ['principal', 'vice_principal', 'admin'].indexOf(rk) !== -1;

    var groupOptions = '';
    if (isManager) {
      groupOptions += '<option value="all">👥 جميع الموظفين</option>';
      groupOptions += '<option value="teachers">👩‍🏫 جميع المعلمات</option>';
    }
    groupOptions += '<option value="management">👔 الإدارة</option>';

    var staffOptions = '';
    state.staffList.forEach(function (s) {
      staffOptions += '<option value="' + escAttr(s.staff_db_id) + '">' + escHtml(s.name_ar || s.staff_db_id) + '</option>';
    });

    var container = document.createElement('div');
    container.className = 'compose-form';

    // إلى
    var lblTo = document.createElement('div');
    var toLabel = document.createElement('span');
    toLabel.className = 'compose-label';
    toLabel.textContent = 'إلى *';
    var toSel = document.createElement('select');
    toSel.id = 'msg-to';
    toSel.className = 'compose-select';
    toSel.innerHTML = '<option value="">اختر المستلم...</option>' + groupOptions +
      (staffOptions ? '<optgroup label="── أفراد الكادر ──">' + staffOptions + '</optgroup>' : '');
    lblTo.appendChild(toLabel);
    lblTo.appendChild(toSel);

    // الموضوع
    var lblSubj = document.createElement('div');
    var subjLabel = document.createElement('span');
    subjLabel.className = 'compose-label';
    subjLabel.textContent = 'الموضوع *';
    var subjInput = document.createElement('input');
    subjInput.id = 'msg-subj';
    subjInput.type = 'text';
    subjInput.className = 'compose-input';
    subjInput.placeholder = 'موضوع الرسالة';
    lblSubj.appendChild(subjLabel);
    lblSubj.appendChild(subjInput);

    // الأولوية
    var lblPri = document.createElement('div');
    var priLabel = document.createElement('span');
    priLabel.className = 'compose-label';
    priLabel.textContent = 'الأولوية';
    var priSel = document.createElement('select');
    priSel.id = 'msg-pri';
    priSel.className = 'compose-select';
    priSel.innerHTML = '<option value="normal">عادي</option><option value="important">مهم</option><option value="urgent">عاجل</option>';
    lblPri.appendChild(priLabel);
    lblPri.appendChild(priSel);

    // نص الرسالة
    var lblBody = document.createElement('div');
    var bodyLabel = document.createElement('span');
    bodyLabel.className = 'compose-label';
    bodyLabel.textContent = 'نص الرسالة *';
    var bodyArea = document.createElement('textarea');
    bodyArea.id = 'msg-body-txt';
    bodyArea.className = 'compose-textarea';
    bodyArea.placeholder = 'اكتب رسالتك هنا...';
    lblBody.appendChild(bodyLabel);
    lblBody.appendChild(bodyArea);

    // زر الإرسال
    var sendBtn = document.createElement('button');
    sendBtn.id = 'msg-send-btn';
    sendBtn.className = 'compose-send';
    sendBtn.textContent = '📤 إرسال الرسالة';
    sendBtn.addEventListener('click', doSend);

    container.appendChild(lblTo);
    container.appendChild(lblSubj);
    container.appendChild(lblPri);
    container.appendChild(lblBody);
    container.appendChild(sendBtn);

    body.innerHTML = '';
    body.appendChild(container);
  }

  /* ══════════════════════════════════
     16. إرسال رسالة
     ══════════════════════════════════ */
  function doSend() {
    var to = document.getElementById('msg-to');
    var subj = document.getElementById('msg-subj');
    var pri = document.getElementById('msg-pri');
    var bodyTxt = document.getElementById('msg-body-txt');
    var sendBtn = document.getElementById('msg-send-btn');

    if (!to || !to.value) { alert('يرجى اختيار المستلم'); return; }
    if (!subj || !subj.value.trim()) { alert('يرجى كتابة الموضوع'); return; }
    if (!bodyTxt || !bodyTxt.value.trim()) { alert('يرجى كتابة نص الرسالة'); return; }

    var sb = window.EduOS_SB;
    if (!sb) return;

    sendBtn.disabled = true;
    sendBtn.textContent = 'جارٍ الإرسال...';

    var rec = to.value;
    var subjVal = subj.value.trim();
    var bodyVal = bodyTxt.value.trim();
    var priVal = pri ? pri.value : 'normal';

    // thread_id فريد
    var threadId = 'th_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    sb.auth.getUser().then(function (authRes) {
      var uid = authRes && authRes.data && authRes.data.user ? authRes.data.user.id : null;
      if (!uid) { alert('انتهت جلستك — يرجى تسجيل الدخول من جديد'); return; }

      sb.from('internal_messages').insert({
        school_id: 'aljood',
        thread_id: threadId,
        subject: subjVal,
        body: bodyVal,
        sender_name: user.name_ar || user.name || 'غير معروف',
        sender_role: user.role_key || user.role || '',
        sender_id: uid,
        recipient: rec,
        message_type: 'direct',
        priority: priVal,
        is_read: false,
        created_at: new Date().toISOString()
      }).then(function (res) {
        if (res.error) {
          alert('خطأ في الإرسال: ' + res.error.message);
          sendBtn.disabled = false;
          sendBtn.textContent = '📤 إرسال الرسالة';
          return;
        }
        // نجح الإرسال
        var body = document.getElementById('msg-panel-body');
        if (body) {
          body.innerHTML = '<div class="msg-success">✅ تم إرسال الرسالة بنجاح!</div>';
          setTimeout(function () {
            switchTab('inbox');
            loadMessages();
          }, 1800);
        }
      });
    });
  }

  /* ══════════════════════════════════
     17. توست للرسائل الجديدة
     ══════════════════════════════════ */
  function showToast(sender, subject) {
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed;bottom:90px;left:24px;z-index:9500;',
      'background:linear-gradient(135deg,#1a0940,#162132);',
      'border:1px solid rgba(108,61,214,0.5);',
      'border-radius:12px;padding:12px 16px;',
      'color:#fff;font-family:Tajawal,Arial,sans-serif;',
      'font-size:13px;direction:rtl;',
      'box-shadow:0 4px 20px rgba(0,0,0,0.5);',
      'animation:msg-slide-in 0.3s ease;',
      'max-width:280px;cursor:pointer;',
    ].join('');
    toast.innerHTML = '<div style="color:#D4A84B;font-weight:700;margin-bottom:4px;">رسالة جديدة من ' + escHtml(sender || '') + '</div>' +
      '<div style="color:rgba(255,255,255,0.7);">' + escHtml(subject || '') + '</div>';
    document.body.appendChild(toast);
    toast.addEventListener('click', function () {
      document.body.removeChild(toast);
      openPanel();
    });
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 5000);
  }

  /* ══════════════════════════════════
     18. مساعدات
     ══════════════════════════════════ */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return 'الآن';
    if (diff < 60) return diff + ' دقيقة';
    if (diff < 1440) return Math.floor(diff / 60) + ' ساعة';
    if (diff < 10080) return Math.floor(diff / 1440) + ' يوم';
    return d.toLocaleDateString('ar-AE', { month: 'short', day: 'numeric' });
  }

  /* ══════════════════════════════════
     19. تهيئة عند الجاهزية
     ══════════════════════════════════ */
  function init() {
    buildUI();
    loadMessages();
    subscribeRealtime();
  }

  waitForSB(init);

})();
