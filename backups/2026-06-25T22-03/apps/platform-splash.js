/**
 * platform-splash.js v2.0
 * EduOS Splash Screen — شاشة البداية
 * الشعار الرسمي: مربع بنفسجي متدرج #6C3DD6→#22D3EE + أيقونة 🎓
 * ثنائية اللغة: AR / EN
 * خط: Tajawal
 * تسلسل: ظهور → نبض → شريط تحميل → اختفاء
 * NAFAS FOR ARTIFICIAL INTELLIGENCE — الجود EduOS
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════
     الثنائية
  ═══════════════════════════════════════ */
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  const storedLang = urlLang ||
    (navigator.language && navigator.language.startsWith('ar') ? 'ar' : 'en');
  const isAr = storedLang !== 'en';

  const T = {
    ar: {
      subtitle: 'نظام إدارة التعليم الذكي',
      company: 'نفس للذكاء الاصطناعي',
      loading: 'جارٍ التحميل…',
    },
    en: {
      subtitle: 'Smart Education Management System',
      company: 'NAFAS FOR ARTIFICIAL INTELLIGENCE',
      loading: 'Loading…',
    }
  };
  const txt = isAr ? T.ar : T.en;

  /* ═══════════════════════════════════════
     الأنماط
  ═══════════════════════════════════════ */
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');

    #eduos-splash {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: #0D1B2A;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Tajawal', sans-serif;
      overflow: hidden;
      direction: ${isAr ? 'rtl' : 'ltr'};
      opacity: 1;
      transition: opacity 0.6s ease;
    }
    #eduos-splash.spl-fade-out {
      opacity: 0;
      pointer-events: none;
    }

    /* ── هالة خلفية ── */
    #spl-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(
        circle,
        rgba(108,61,214,0.18) 0%,
        rgba(34,211,238,0.10) 40%,
        transparent 70%
      );
      border-radius: 50%;
      animation: glowPulse 3s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes glowPulse {
      0%, 100% { transform: scale(1);   opacity: 0.7; }
      50%       { transform: scale(1.2); opacity: 1;   }
    }

    /* ── حاوية الشعار ── */
    #spl-logo-wrap {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      opacity: 0;
      transform: translateY(30px) scale(0.85);
      transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.3,0.64,1);
    }
    #spl-logo-wrap.spl-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    /* ── المربع البنفسجي ── */
    #spl-icon {
      width: 96px;
      height: 96px;
      border-radius: 24px;
      background: linear-gradient(135deg, #6C3DD6 0%, #22D3EE 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      line-height: 1;
      box-shadow:
        0 0 0 0 rgba(108,61,214,0.6),
        0 8px 40px rgba(108,61,214,0.5),
        0 4px 20px rgba(34,211,238,0.3);
      animation: iconPulse 2.5s ease-in-out infinite 0.8s;
      flex-shrink: 0;
    }
    @keyframes iconPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(108,61,214,0.5), 0 8px 40px rgba(108,61,214,0.5), 0 4px 20px rgba(34,211,238,0.3); }
      50%       { box-shadow: 0 0 0 18px rgba(108,61,214,0), 0 8px 50px rgba(108,61,214,0.7), 0 4px 30px rgba(34,211,238,0.5); }
    }

    /* ── نصوص ── */
    #spl-title {
      font-size: 2.4rem;
      font-weight: 800;
      background: linear-gradient(135deg, #a78bfa 0%, #22D3EE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: ${isAr ? '0' : '2px'};
      margin: 0;
      line-height: 1.2;
      text-align: center;
    }
    #spl-subtitle {
      font-size: 1rem;
      font-weight: 400;
      color: rgba(255,255,255,0.6);
      margin: 0;
      text-align: center;
      letter-spacing: ${isAr ? '0' : '0.5px'};
    }

    /* ── خط فاصل ── */
    #spl-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, #6C3DD6, #22D3EE);
      border-radius: 2px;
      margin: 4px 0;
      opacity: 0.7;
    }

    /* ── شريط التحميل ── */
    #spl-loader-wrap {
      position: relative;
      z-index: 10;
      margin-top: 52px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transition: opacity 0.5s ease 0.4s;
    }
    #spl-loader-wrap.spl-visible {
      opacity: 1;
    }
    #spl-progress-track {
      width: 200px;
      height: 3px;
      background: rgba(255,255,255,0.1);
      border-radius: 99px;
      overflow: hidden;
    }
    #spl-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #6C3DD6, #22D3EE);
      border-radius: 99px;
      transition: width 0.12s linear;
      box-shadow: 0 0 10px rgba(108,61,214,0.8);
    }
    #spl-loading-text {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.35);
      font-weight: 300;
      letter-spacing: 1px;
      text-align: center;
    }

    /* ── شعار الشركة ── */
    #spl-company {
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.68rem;
      color: rgba(255,255,255,0.2);
      white-space: nowrap;
      font-weight: 300;
      letter-spacing: 1px;
      z-index: 10;
    }

    /* ── حلقات نبض عند الإغلاق ── */
    .spl-ring {
      position: absolute;
      left: 50%;
      top: 42%;
      transform: translate(-50%, -50%) scale(0);
      border-radius: 50%;
      border: 1.5px solid;
      pointer-events: none;
      opacity: 0;
    }
    .spl-ring-1 { width: 160px; height: 160px; border-color: rgba(108,61,214,0.7); }
    .spl-ring-2 { width: 300px; height: 300px; border-color: rgba(34,211,238,0.5); }
    .spl-ring-3 { width: 500px; height: 500px; border-color: rgba(108,61,214,0.3); }
    @keyframes spl-ring-out {
      0%   { transform: translate(-50%,-50%) scale(0.1); opacity: 0.9; }
      100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  /* ═══════════════════════════════════════
     بناء DOM
  ═══════════════════════════════════════ */
  const splash = document.createElement('div');
  splash.id = 'eduos-splash';

  // هالة
  const glow = document.createElement('div');
  glow.id = 'spl-glow';
  splash.appendChild(glow);

  // حلقات النبض
  [1,2,3].forEach(n => {
    const r = document.createElement('div');
    r.className = `spl-ring spl-ring-${n}`;
    r.id = `spl-ring-${n}`;
    splash.appendChild(r);
  });

  // حاوية الشعار
  const logoWrap = document.createElement('div');
  logoWrap.id = 'spl-logo-wrap';

  // المربع البنفسجي + 🎓
  const icon = document.createElement('div');
  icon.id = 'spl-icon';
  icon.textContent = '🎓';

  // النصوص
  const title = document.createElement('p');
  title.id = 'spl-title';
  title.textContent = 'EduOS';

  const divider = document.createElement('div');
  divider.id = 'spl-divider';

  const subtitle = document.createElement('p');
  subtitle.id = 'spl-subtitle';
  subtitle.textContent = txt.subtitle;

  logoWrap.appendChild(icon);
  logoWrap.appendChild(title);
  logoWrap.appendChild(divider);
  logoWrap.appendChild(subtitle);
  splash.appendChild(logoWrap);

  // شريط التحميل
  const loaderWrap = document.createElement('div');
  loaderWrap.id = 'spl-loader-wrap';

  const track = document.createElement('div');
  track.id = 'spl-progress-track';

  const bar = document.createElement('div');
  bar.id = 'spl-progress-bar';
  track.appendChild(bar);

  const loadingText = document.createElement('div');
  loadingText.id = 'spl-loading-text';
  loadingText.textContent = txt.loading;

  loaderWrap.appendChild(track);
  loaderWrap.appendChild(loadingText);
  splash.appendChild(loaderWrap);

  // شعار الشركة
  const company = document.createElement('div');
  company.id = 'spl-company';
  company.textContent = txt.company;
  splash.appendChild(company);

  document.body.prepend(splash);

  /* ═══════════════════════════════════════
     تسلسل الحركة
     0ms      → يُضاف للـ DOM
     100ms    → ظهور الشعار (opacity + translateY)
     500ms    → ظهور شريط التحميل
     600ms    → بدء شريط التحميل 0%→100% (1800ms)
     2400ms   → اكتمل الشريط
     2600ms   → حلقات نبض
     2800ms   → اختفاء تدريجي
     3400ms   → إزالة من DOM
  ═══════════════════════════════════════ */

  // ظهور الشعار
  setTimeout(() => {
    logoWrap.classList.add('spl-visible');
    loaderWrap.classList.add('spl-visible');
  }, 100);

  // شريط التحميل
  let progress = 0;
  const totalDuration = 1800; // ms
  const steps = 60;
  const stepTime = totalDuration / steps;

  // منحنى تقدم غير خطي — يبدأ سريع ثم يتباطأ ثم يتسارع
  function easeProgress(t) {
    // t من 0 إلى 1
    if (t < 0.7) return t * 1.1;
    if (t < 0.9) return 0.77 + (t - 0.7) * 0.8;
    return 0.93 + (t - 0.9) * 0.7;
  }

  let step = 0;
  const progressInterval = setInterval(() => {
    step++;
    const t = Math.min(step / steps, 1);
    progress = Math.min(easeProgress(t) * 100, 100);
    bar.style.width = progress + '%';
    if (step >= steps) clearInterval(progressInterval);
  }, stepTime);

  setTimeout(() => {
    bar.style.width = '100%';
  }, 600 + totalDuration);

  // حلقات النبض عند الإغلاق
  setTimeout(() => {
    [1,2,3].forEach((n, i) => {
      const ring = document.getElementById(`spl-ring-${n}`);
      if (ring) {
        setTimeout(() => {
          ring.style.animation = `spl-ring-out 1s ease-out forwards`;
        }, i * 150);
      }
    });
  }, 2600);

  // اختفاء
  setTimeout(() => {
    splash.classList.add('spl-fade-out');
  }, 2800);

  // إزالة من DOM
  setTimeout(() => {
    try { splash.remove(); } catch(e) {}
  }, 3500);

  /* ═══════════════════════════════════════
     API عام
  ═══════════════════════════════════════ */
  window.EduSplash = {
    dismiss: function(delay) {
      setTimeout(() => {
        splash.classList.add('spl-fade-out');
        setTimeout(() => { try { splash.remove(); } catch(e) {} }, 700);
      }, delay || 0);
    }
  };

})();
