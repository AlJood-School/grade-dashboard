/**
 * ═══════════════════════════════════════════════════════════
 *  platform-autologout.js  —  EduOS v1.0
 *  تسجيل خروج تلقائي بعد خمول + تذكير التنفس والحركة
 * ═══════════════════════════════════════════════════════════
 *
 *  الاستخدام:
 *    <script src="../platform-autologout.js"></script>
 *    أو
 *    <script src="../../platform-autologout.js"></script>
 *
 *  الإعدادات (قبل تحميل السكريبت):
 *    window.EDOOS_AUTOLOGOUT_CONFIG = {
 *      idleMinutes: 15,           // وقت الخمول قبل الخروج (افتراضي: 15)
 *      warnMinutes: 2,            // تحذير قبل كذا دقيقة (افتراضي: 2)
 *      loginUrl: '../eduos-login/', // رابط صفحة الدخول
 *      userName: 'المستخدم',       // اسم المستخدم للعرض
 *      role: 'موظف',               // الدور
 *      breathingMinutes: 45,       // تذكير التنفس كل كذا دقيقة (0=معطّل)
 *      movementMinutes: 60,        // تذكير الحركة كل كذا دقيقة (0=معطّل)
 *    };
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ── الإعدادات ─────────────────────────────────────────── */
  const cfg = Object.assign({
    idleMinutes: 15,
    warnMinutes: 2,
    loginUrl: '',
    userName: 'المستخدم',
    role: 'موظف',
    breathingMinutes: 45,
    movementMinutes: 60,
  }, window.EDOOS_AUTOLOGOUT_CONFIG || {});

  const IDLE_MS  = cfg.idleMinutes  * 60 * 1000;
  const WARN_MS  = cfg.warnMinutes  * 60 * 1000;
  const BREATH_MS = cfg.breathingMinutes > 0 ? cfg.breathingMinutes * 60 * 1000 : 0;
  const MOVE_MS   = cfg.movementMinutes  > 0 ? cfg.movementMinutes  * 60 * 1000 : 0;

  /* ── حالة داخلية ──────────────────────────────────────── */
  let lastActivity = Date.now();
  let sessionStart = Date.now();
  let clickCount   = 0;
  let warnShown    = false;
  let mainTimer    = null;
  let countdownEl  = null;

  /* ── تتبع النشاط ──────────────────────────────────────── */
  function resetIdle() {
    lastActivity = Date.now();
    clickCount++;
    if (warnShown) hideWarning();
  }

  ['mousemove','mousedown','keypress','touchstart','scroll','click'].forEach(ev =>
    document.addEventListener(ev, resetIdle, { passive: true })
  );

  /* ── إدراج CSS ────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    #eal-overlay {
      position: fixed; inset: 0; z-index: 99998;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Tajawal', sans-serif; direction: rtl;
    }
    #eal-card {
      background: var(--surface, #1e1b4b);
      border: 2px solid rgba(239,68,68,0.5);
      border-radius: 24px;
      padding: 36px 32px;
      max-width: 380px; width: 90%;
      text-align: center;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      animation: ealBounce .4s ease;
    }
    @keyframes ealBounce {
      from { transform: scale(.85); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    #eal-icon  { font-size: 48px; margin-bottom: 12px; }
    #eal-title { font-size: 18px; font-weight: 900; color: #fca5a5; margin-bottom: 8px; }
    #eal-sub   { font-size: 13px; color: var(--text2,#94a3b8); margin-bottom: 20px; line-height: 1.7; }
    #eal-count { font-size: 36px; font-weight: 900; color: #ef4444; margin: 12px 0; }
    #eal-keep  {
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff; border: none; border-radius: 50px;
      padding: 12px 32px; font-family: 'Tajawal',sans-serif;
      font-size: 14px; font-weight: 700; cursor: pointer;
      transition: transform .2s; width: 100%;
    }
    #eal-keep:hover { transform: scale(1.04); }
    #eal-logout-btn {
      background: transparent; color: #f87171;
      border: 1px solid rgba(248,113,113,0.4);
      border-radius: 50px; padding: 8px 24px;
      font-family: 'Tajawal',sans-serif; font-size: 13px;
      cursor: pointer; margin-top: 10px; width: 100%;
      transition: all .2s;
    }
    #eal-logout-btn:hover { background: rgba(248,113,113,0.1); }

    /* ── wellness ── */
    #eal-wellness {
      position: fixed; bottom: 80px; right: 20px;
      z-index: 9990; max-width: 320px;
      font-family: 'Tajawal', sans-serif; direction: rtl;
    }
    .eal-wcard {
      background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.1));
      border: 1px solid rgba(16,185,129,0.35);
      border-radius: 18px; padding: 16px 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.35);
      margin-bottom: 12px;
      animation: ealSlideIn .5s ease;
    }
    @keyframes ealSlideIn {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .eal-wcard-out { animation: ealSlideOut .6s ease forwards; }
    @keyframes ealSlideOut {
      to { transform: translateX(130%); opacity: 0; }
    }
    .eal-w-title { font-size: 14px; font-weight: 800; color: #6ee7b7; margin-bottom: 6px; }
    .eal-w-body  { font-size: 12px; color: var(--text2,#94a3b8); line-height: 1.7; }
    .eal-w-close {
      position: absolute; top: 10px; left: 12px;
      background: none; border: none; color: var(--text3,#64748b);
      cursor: pointer; font-size: 16px; line-height: 1;
    }

    /* ── شريط الجلسة ── */
    #eal-session-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      height: 3px; background: rgba(99,102,241,0.15);
      z-index: 9980;
    }
    #eal-session-fill {
      height: 100%;
      background: linear-gradient(90deg,#6366f1,#10b981);
      transition: width 30s linear;
    }
  `;
  document.head.appendChild(style);

  /* ── شريط تقدم الجلسة ─────────────────────────────────── */
  function createSessionBar() {
    const bar  = document.createElement('div'); bar.id = 'eal-session-bar';
    const fill = document.createElement('div'); fill.id = 'eal-session-fill';
    fill.style.width = '0%';
    bar.appendChild(fill);
    document.body.appendChild(bar);
    // تحديث كل 30 ثانية
    setInterval(() => {
      const elapsed = (Date.now() - sessionStart) / IDLE_MS * 100;
      fill.style.width = Math.min(elapsed, 100) + '%';
      if (elapsed >= 85) fill.style.background = '#ef4444';
    }, 30000);
  }

  /* ── تحذير الخروج ─────────────────────────────────────── */
  function showWarning(secsLeft) {
    if (document.getElementById('eal-overlay')) return;
    warnShown = true;

    const overlay = document.createElement('div'); overlay.id = 'eal-overlay';
    overlay.innerHTML = `
      <div id="eal-card">
        <div id="eal-icon">⏰</div>
        <div id="eal-title">ستنتهي جلستك قريباً</div>
        <div id="eal-sub">لم يُرصد أي نشاط منذ فترة.<br>سيتم تسجيل خروجك تلقائياً بعد:</div>
        <div id="eal-count">${secsLeft}</div>
        <div style="font-size:11px;color:var(--text3,#64748b);margin-bottom:18px">ثانية</div>
        <button id="eal-keep" onclick="window.EduAutoLogout.stayIn()">✋ أنا هنا — تمديد الجلسة</button>
        <button id="eal-logout-btn" onclick="window.EduAutoLogout.logout()">🚪 تسجيل الخروج الآن</button>
      </div>`;
    document.body.appendChild(overlay);
    countdownEl = document.getElementById('eal-count');
  }

  function hideWarning() {
    warnShown = false;
    const el = document.getElementById('eal-overlay');
    if (el) el.remove();
    countdownEl = null;
  }

  /* ── تنفيذ الخروج ─────────────────────────────────────── */
  function doLogout() {
    hideWarning();
    const loginUrl = cfg.loginUrl || (
      location.pathname.includes('/apps/')
        ? location.pathname.replace(/\/apps\/[^/]+\/.*$/, '/apps/eduos-login/')
        : '/apps/eduos-login/'
    );
    // تسجيل وقت آخر خروج (session flag فقط — لا localStorage)
    try { sessionStorage.setItem('eal_logged_out', '1'); } catch(e) {}
    window.location.href = loginUrl + '?timeout=1';
  }

  /* ── الحلقة الرئيسية ─────────────────────────────────── */
  function tick() {
    const idle = Date.now() - lastActivity;
    const remaining = IDLE_MS - idle;

    if (remaining <= 0) {
      doLogout();
      return;
    }

    if (remaining <= WARN_MS) {
      const secs = Math.ceil(remaining / 1000);
      if (!warnShown) showWarning(secs);
      else if (countdownEl) countdownEl.textContent = secs;
    } else {
      if (warnShown) hideWarning();
    }

    mainTimer = setTimeout(tick, 1000);
  }

  /* ── تذكير العافية ───────────────────────────────────── */
  const wellnessDiv = document.createElement('div');
  wellnessDiv.id = 'eal-wellness';
  document.body.appendChild(wellnessDiv);

  const breathingTips = [
    { icon: '🌬️', title: 'تنفّس معي ٤-٧-٨', body: 'استنشقي ٤ ثوانٍ · احبسي ٧ · أخرجي ببطء ٨ ثوانٍ.<br>هذا الإيقاع يهدئ الجهاز العصبي ويجدد تركيزكِ.' },
    { icon: '💨', title: 'لحظة هدوء', body: 'خذي نفساً عميقاً الآن.<br>ثلاث مرات — وعودي أكثر حضوراً مع طالباتكِ.' },
    { icon: '🫁', title: 'تنفس صندوقي', body: 'استنشقي ٤ · احبسي ٤ · أخرجي ٤ · احبسي ٤.<br>أثبت علمياً أنه يخفض التوتر في دقيقتين.' },
  ];

  const movementTips = [
    { icon: '🚶‍♀️', title: 'وقت الحركة!', body: 'لقد مضى وقت على جلوسكِ.<br>قومي ودوري في الفصل أو المدرسة دقيقتين — جسمكِ يشكركِ.' },
    { icon: '🧘‍♀️', title: 'تمدد بسيط', body: 'أديري رقبتكِ ببطء يميناً ويساراً.<br>ثم شدي كتفيكِ للأعلى وأرخيهما — ثلاث مرات.' },
    { icon: '👁️', title: 'راحة العينين', body: 'قاعدة ٢٠-٢٠-٢٠:<br>كل ٢٠ دقيقة انظري ٢٠ ثانية إلى شيء على بُعد ٢٠ قدم.' },
    { icon: '💧', title: 'هل شربتِ ماء؟', body: 'الجسم المرهق يحتاج ترطيباً.<br>اشربي كأس ماء الآن — يحسّن التركيز ويقلل التعب.' },
  ];

  function showWellnessCard(tips) {
    const tip = tips[Math.floor(Math.random() * tips.length)];
    const card = document.createElement('div');
    card.className = 'eal-wcard';
    card.style.position = 'relative';
    card.innerHTML = `
      <button class="eal-w-close" onclick="this.closest('.eal-wcard').remove()">×</button>
      <div class="eal-w-title">${tip.icon} ${tip.title}</div>
      <div class="eal-w-body">${tip.body}</div>`;
    wellnessDiv.appendChild(card);
    setTimeout(() => {
      card.classList.add('eal-wcard-out');
      setTimeout(() => card.remove(), 600);
    }, 12000);
  }

  if (BREATH_MS) setInterval(() => showWellnessCard(breathingTips), BREATH_MS);
  if (MOVE_MS)   setInterval(() => showWellnessCard(movementTips),  MOVE_MS);

  /* ── الـ API العام ────────────────────────────────────── */
  window.EduAutoLogout = {
    stayIn() {
      resetIdle();
      hideWarning();
    },
    logout: doLogout,
    getSessionInfo() {
      const mins = Math.floor((Date.now() - sessionStart) / 60000);
      return { minutes: mins, clicks: clickCount };
    },
  };

  /* ── زر تسجيل الخروج العائم ─────────────────────────── */
  function injectLogoutBtn() {
    // إذا كان هناك زر موجود بالفعل، لا تضيف آخر
    if (document.getElementById('eal-header-logout')) return;
    // ابحث عن الـ header-user
    const headerUser = document.querySelector('.header-user');
    if (!headerUser) return;

    const btn = document.createElement('button');
    btn.id = 'eal-header-logout';
    btn.title = 'تسجيل الخروج من EduOS';
    btn.onclick = () => {
      if (confirm('هل تريدين تسجيل الخروج من EduOS؟')) doLogout();
    };
    /* نفس أسلوب زر الثيم تماماً — دائري 36px */
    btn.style.cssText = [
      'width:36px', 'height:36px', 'border-radius:50%',
      'background:var(--surface2,rgba(255,255,255,0.06))',
      'border:1px solid var(--border,rgba(255,255,255,0.12))',
      'cursor:pointer', 'display:flex', 'align-items:center', 'justify-content:center',
      'font-size:15px', 'transition:all .2s',
      'color:var(--text2,#94a3b8)', 'flex-shrink:0',
    ].join(';');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(239,68,68,0.12)';
      btn.style.borderColor = 'rgba(239,68,68,0.4)';
      btn.style.color = '#f87171';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'var(--surface2,rgba(255,255,255,0.06))';
      btn.style.borderColor = 'var(--border,rgba(255,255,255,0.12))';
      btn.style.color = 'var(--text2,#94a3b8)';
    });

    // أدرج قبل الـ avatar أو في النهاية
    const avatar = headerUser.querySelector('.user-avatar');
    if (avatar) headerUser.insertBefore(btn, avatar);
    else headerUser.appendChild(btn);
  }

  /* ── تشغيل ──────────────────────────────────────────── */
  function init() {
    createSessionBar();
    tick();
    injectLogoutBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // تأخير صغير لضمان تحميل الـ DOM كاملاً
    setTimeout(init, 300);
  }

})();
