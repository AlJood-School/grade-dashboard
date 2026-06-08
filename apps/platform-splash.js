/**
 * platform-splash.js — EduOS Falcon Splash Screen v1
 * شاشة البداية: الشعار ينبثق كبيراً متوهجاً في المنتصف ثم يطير لمكانه
 */
(function () {
  // إنشاء الـ styles
  const style = document.createElement('style');
  style.textContent = `
    #edoos-splash {
      position: fixed; inset: 0;
      z-index: 999999;
      background: radial-gradient(ellipse at 50% 50%, #0d1b35 0%, #050810 70%, #000 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      overflow: hidden;
      transition: opacity 0.7s ease;
    }
    #edoos-splash.splash-fade-out {
      opacity: 0;
      pointer-events: none;
    }

    /* ========= دوائر النبض ========= */
    .spl-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      animation: splRing 2.4s ease-out infinite;
    }
    .spl-ring:nth-child(1) { width: 280px; height: 280px; border-color: rgba(246,201,14,0.6);  animation-delay: 0s; }
    .spl-ring:nth-child(2) { width: 380px; height: 380px; border-color: rgba(0,180,216,0.4);   animation-delay: 0.6s; }
    .spl-ring:nth-child(3) { width: 480px; height: 480px; border-color: rgba(246,201,14,0.2);  animation-delay: 1.2s; }
    .spl-ring:nth-child(4) { width: 580px; height: 580px; border-color: rgba(0,180,216,0.12);  animation-delay: 1.8s; }
    @keyframes splRing {
      0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    }

    /* ========= الشعار الرئيسي ========= */
    .spl-logo-wrap {
      position: relative;
      z-index: 10;
      animation: splLogoIn 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      transition: all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    @keyframes splLogoIn {
      from { transform: scale(0.1) rotate(-25deg); opacity: 0; }
      to   { transform: scale(1)   rotate(0deg);   opacity: 1; }
    }
    .spl-logo-wrap.fly-out {
      transform: scale(0.18) translate(var(--fx), var(--fy)) !important;
      opacity: 0;
    }

    .spl-logo-img {
      width: 200px; height: 200px;
      object-fit: contain;
      border-radius: 36px;
      filter:
        drop-shadow(0 0 30px rgba(246,201,14,0.9))
        drop-shadow(0 0 70px rgba(246,201,14,0.5))
        drop-shadow(0 0 120px rgba(0,180,216,0.4));
      animation: splLogoPulse 1.8s ease-in-out infinite;
    }
    @keyframes splLogoPulse {
      0%, 100% {
        filter: drop-shadow(0 0 25px rgba(246,201,14,0.8)) drop-shadow(0 0 60px rgba(246,201,14,0.4)) drop-shadow(0 0 100px rgba(0,180,216,0.3));
      }
      50% {
        filter: drop-shadow(0 0 50px rgba(246,201,14,1)) drop-shadow(0 0 100px rgba(246,201,14,0.7)) drop-shadow(0 0 160px rgba(0,180,216,0.6));
      }
    }

    /* ========= النص ========= */
    .spl-title {
      color: #f6c90e;
      font-size: 42px; font-weight: 900;
      font-family: 'Cairo', 'Tajawal', sans-serif;
      letter-spacing: 6px;
      text-shadow: 0 0 40px rgba(246,201,14,0.9), 0 0 80px rgba(246,201,14,0.4);
      margin-top: 28px;
      animation: splTextIn 0.7s 0.5s both;
      z-index: 10; position: relative;
    }
    .spl-subtitle {
      color: rgba(0,180,216,0.85);
      font-size: 15px;
      font-family: 'Cairo', 'Tajawal', sans-serif;
      letter-spacing: 3px;
      margin-top: 8px;
      text-shadow: 0 0 20px rgba(0,180,216,0.6);
      animation: splTextIn 0.7s 0.8s both;
      z-index: 10; position: relative;
    }
    @keyframes splTextIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .spl-title.fade-out, .spl-subtitle.fade-out {
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    /* ========= جسيمات عائمة ========= */
    .spl-particle {
      position: absolute;
      border-radius: 50%;
      animation: splFloat linear infinite;
      pointer-events: none;
    }
    @keyframes splFloat {
      0%   { transform: translateY(0) scale(1);   opacity: var(--op); }
      50%  { transform: translateY(-40px) scale(1.4); opacity: calc(var(--op)*0.5); }
      100% { transform: translateY(0) scale(1);   opacity: var(--op); }
    }
  `;
  document.head.appendChild(style);

  /* ======= رسم SVG الدوائر الإلكترونية ======= */
  const svg = `
  <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="splGlow">
        <feGaussianBlur stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="splGlowS">
        <feGaussianBlur stdDeviation="1.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- خطوط أفقية يسار -->
    <line x1="0" y1="200" x2="280" y2="200" stroke="#00b4d8" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.55;0.08" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="280;320;280" dur="3s" repeatCount="indefinite"/>
    </line>
    <line x1="0" y1="240" x2="200" y2="240" stroke="#f6c90e" stroke-width="1">
      <animate attributeName="opacity" values="0.05;0.4;0.05" dur="4s" repeatCount="indefinite" begin="1s"/>
    </line>
    <line x1="0" y1="430" x2="250" y2="430" stroke="#00b4d8" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.5;0.08" dur="3.5s" repeatCount="indefinite" begin="0.5s"/>
    </line>
    <line x1="0" y1="470" x2="180" y2="470" stroke="#f6c90e" stroke-width="1">
      <animate attributeName="opacity" values="0.05;0.35;0.05" dur="2.8s" repeatCount="indefinite" begin="1.5s"/>
    </line>

    <!-- خطوط أفقية يمين -->
    <line x1="620" y1="200" x2="900" y2="200" stroke="#f6c90e" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.55;0.08" dur="3.2s" repeatCount="indefinite" begin="0.3s"/>
    </line>
    <line x1="700" y1="240" x2="900" y2="240" stroke="#00b4d8" stroke-width="1">
      <animate attributeName="opacity" values="0.05;0.4;0.05" dur="2.5s" repeatCount="indefinite" begin="1.2s"/>
    </line>
    <line x1="650" y1="430" x2="900" y2="430" stroke="#00b4d8" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.5;0.08" dur="4s" repeatCount="indefinite" begin="0.8s"/>
    </line>
    <line x1="720" y1="470" x2="900" y2="470" stroke="#f6c90e" stroke-width="1">
      <animate attributeName="opacity" values="0.05;0.35;0.05" dur="3s" repeatCount="indefinite" begin="2s"/>
    </line>

    <!-- خطوط عمودية أعلى -->
    <line x1="200" y1="0" x2="200" y2="270" stroke="#f6c90e" stroke-width="1">
      <animate attributeName="opacity" values="0.08;0.45;0.08" dur="3.8s" repeatCount="indefinite" begin="0.4s"/>
    </line>
    <line x1="240" y1="0" x2="240" y2="220" stroke="#00b4d8" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.5;0.08" dur="2.9s" repeatCount="indefinite" begin="1.1s"/>
    </line>
    <line x1="660" y1="0" x2="660" y2="255" stroke="#00b4d8" stroke-width="1">
      <animate attributeName="opacity" values="0.08;0.45;0.08" dur="3.2s" repeatCount="indefinite" begin="0.7s"/>
    </line>
    <line x1="700" y1="0" x2="700" y2="210" stroke="#f6c90e" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.5;0.08" dur="2.6s" repeatCount="indefinite" begin="1.4s"/>
    </line>

    <!-- خطوط عمودية أسفل -->
    <line x1="200" y1="390" x2="200" y2="650" stroke="#00b4d8" stroke-width="1">
      <animate attributeName="opacity" values="0.08;0.45;0.08" dur="3.5s" repeatCount="indefinite" begin="0.6s"/>
    </line>
    <line x1="240" y1="420" x2="240" y2="650" stroke="#f6c90e" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.4;0.08" dur="4.2s" repeatCount="indefinite" begin="1.3s"/>
    </line>
    <line x1="660" y1="405" x2="660" y2="650" stroke="#f6c90e" stroke-width="1">
      <animate attributeName="opacity" values="0.08;0.45;0.08" dur="3.1s" repeatCount="indefinite" begin="0.9s"/>
    </line>
    <line x1="700" y1="440" x2="700" y2="650" stroke="#00b4d8" stroke-width="1" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.08;0.4;0.08" dur="2.7s" repeatCount="indefinite" begin="1.6s"/>
    </line>

    <!-- مسارات الزوايا (أنماط دوائر) -->
    <path d="M60,0 L60,100 L140,100" stroke="#00b4d8" stroke-width="1.5" fill="none" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.5s" repeatCount="indefinite"/>
    </path>
    <path d="M840,0 L840,100 L760,100" stroke="#f6c90e" stroke-width="1.5" fill="none" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
    </path>
    <path d="M60,650 L60,550 L140,550" stroke="#f6c90e" stroke-width="1.5" fill="none" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.2s" repeatCount="indefinite" begin="1s"/>
    </path>
    <path d="M840,650 L840,550 L760,550" stroke="#00b4d8" stroke-width="1.5" fill="none" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" begin="1.5s"/>
    </path>

    <!-- IC Chips مصغّرة -->
    <rect x="110" y="85" width="50" height="30" rx="4" stroke="#00b4d8" stroke-width="1" fill="rgba(0,180,216,0.05)" filter="url(#splGlowS)">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
    </rect>
    <line x1="118" y1="85" x2="118" y2="78" stroke="#00b4d8" stroke-width="1"/>
    <line x1="128" y1="85" x2="128" y2="78" stroke="#00b4d8" stroke-width="1"/>
    <line x1="138" y1="85" x2="138" y2="78" stroke="#00b4d8" stroke-width="1"/>
    <line x1="118" y1="115" x2="118" y2="122" stroke="#00b4d8" stroke-width="1"/>
    <line x1="128" y1="115" x2="128" y2="122" stroke="#00b4d8" stroke-width="1"/>
    <line x1="138" y1="115" x2="138" y2="122" stroke="#00b4d8" stroke-width="1"/>

    <rect x="740" y="85" width="50" height="30" rx="4" stroke="#f6c90e" stroke-width="1" fill="rgba(246,201,14,0.05)" filter="url(#splGlowS)">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="2.3s" repeatCount="indefinite" begin="0.4s"/>
    </rect>
    <line x1="748" y1="85" x2="748" y2="78" stroke="#f6c90e" stroke-width="1"/>
    <line x1="758" y1="85" x2="758" y2="78" stroke="#f6c90e" stroke-width="1"/>
    <line x1="768" y1="85" x2="768" y2="78" stroke="#f6c90e" stroke-width="1"/>
    <line x1="748" y1="115" x2="748" y2="122" stroke="#f6c90e" stroke-width="1"/>
    <line x1="758" y1="115" x2="758" y2="122" stroke="#f6c90e" stroke-width="1"/>
    <line x1="768" y1="115" x2="768" y2="122" stroke="#f6c90e" stroke-width="1"/>

    <!-- حزم بيانات متحركة -->
    <circle r="3.5" fill="#00b4d8" filter="url(#splGlow)">
      <animateMotion dur="2.2s" repeatCount="indefinite" begin="0s">
        <mpath xlink:href="#path1"/>
      </animateMotion>
      <animate attributeName="opacity" values="0;1;1;0" dur="2.2s" repeatCount="indefinite"/>
    </circle>
    <path id="path1" d="M0,200 L280,200" fill="none"/>

    <circle r="3" fill="#f6c90e" filter="url(#splGlow)">
      <animateMotion dur="2.8s" repeatCount="indefinite" begin="0.8s">
        <mpath xlink:href="#path2"/>
      </animateMotion>
      <animate attributeName="opacity" values="0;1;1;0" dur="2.8s" repeatCount="indefinite" begin="0.8s"/>
    </circle>
    <path id="path2" d="M900,430 L650,430" fill="none"/>

    <circle r="3" fill="#00b4d8" filter="url(#splGlow)">
      <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.2s">
        <mpath xlink:href="#path3"/>
      </animateMotion>
      <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" begin="1.2s"/>
    </circle>
    <path id="path3" d="M240,0 L240,220" fill="none"/>

    <circle r="3" fill="#f6c90e" filter="url(#splGlow)">
      <animateMotion dur="3s" repeatCount="indefinite" begin="0.3s">
        <mpath xlink:href="#path4"/>
      </animateMotion>
      <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" begin="0.3s"/>
    </circle>
    <path id="path4" d="M660,650 L660,405" fill="none"/>

    <!-- نقاط تقاطع متوهجة -->
    <circle cx="200" cy="200" r="4" fill="#f6c90e" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="240" cy="240" r="3.5" fill="#00b4d8" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite" begin="0.4s"/>
      <animate attributeName="r" values="2.5;4.5;2.5" dur="1.6s" repeatCount="indefinite" begin="0.4s"/>
    </circle>
    <circle cx="660" cy="200" r="4" fill="#00b4d8" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" begin="0.7s"/>
      <animate attributeName="r" values="3;5;3" dur="2.2s" repeatCount="indefinite" begin="0.7s"/>
    </circle>
    <circle cx="700" cy="240" r="3.5" fill="#f6c90e" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" begin="1s"/>
      <animate attributeName="r" values="2.5;4.5;2.5" dur="1.8s" repeatCount="indefinite" begin="1s"/>
    </circle>
    <circle cx="200" cy="430" r="4" fill="#00b4d8" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" begin="0.5s"/>
    </circle>
    <circle cx="660" cy="430" r="4" fill="#f6c90e" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1.3s"/>
    </circle>
    <circle cx="60" cy="100" r="4" fill="#00b4d8" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="140" cy="100" r="4" fill="#00b4d8" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.9s" repeatCount="indefinite" begin="0.3s"/>
    </circle>
    <circle cx="840" cy="100" r="4" fill="#f6c90e" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.7s" repeatCount="indefinite" begin="0.6s"/>
    </circle>
    <circle cx="760" cy="100" r="4" fill="#f6c90e" filter="url(#splGlow)">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2.1s" repeatCount="indefinite" begin="0.9s"/>
    </circle>
  </svg>`;

  /* ======= جسيمات عائمة ======= */
  const particleData = [
    { x: 10, y: 20, s: 4, c: '#f6c90e', d: 3.2, op: 0.6 },
    { x: 88, y: 15, s: 3, c: '#00b4d8', d: 2.8, op: 0.5 },
    { x: 5,  y: 70, s: 5, c: '#f6c90e', d: 4.0, op: 0.4 },
    { x: 92, y: 65, s: 4, c: '#00b4d8', d: 3.5, op: 0.55 },
    { x: 20, y: 88, s: 3, c: '#f6c90e', d: 2.5, op: 0.45 },
    { x: 78, y: 82, s: 5, c: '#00b4d8', d: 3.8, op: 0.5 },
    { x: 50, y: 5,  s: 3, c: '#f6c90e', d: 3.0, op: 0.35 },
    { x: 50, y: 93, s: 4, c: '#00b4d8', d: 4.2, op: 0.4 },
    { x: 33, y: 12, s: 3, c: '#00b4d8', d: 2.6, op: 0.5 },
    { x: 67, y: 10, s: 4, c: '#f6c90e', d: 3.3, op: 0.45 },
    { x: 15, y: 45, s: 3, c: '#00b4d8', d: 3.7, op: 0.4 },
    { x: 85, y: 40, s: 4, c: '#f6c90e', d: 2.9, op: 0.55 },
  ];
  const particles = particleData.map((p, i) =>
    `<div class="spl-particle" style="left:${p.x}%;top:${p.y}%;width:${p.s}px;height:${p.s}px;background:${p.c};--op:${p.op};animation-duration:${p.d}s;animation-delay:${(i * 0.27).toFixed(2)}s;box-shadow:0 0 ${p.s * 3}px ${p.c}"></div>`
  ).join('');

  /* ======= بناء عنصر الـ splash ======= */
  const splash = document.createElement('div');
  splash.id = 'edoos-splash';
  splash.innerHTML = `
    ${svg}
    ${particles}
    <div class="spl-ring"></div>
    <div class="spl-ring"></div>
    <div class="spl-ring"></div>
    <div class="spl-ring"></div>
    <div class="spl-logo-wrap" id="splLogoWrap">
      <img src="/apps/edoos-logo.png" class="spl-logo-img" alt="EduOS" draggable="false">
    </div>
    <div class="spl-title" id="splTitle">EduOS</div>
    <div class="spl-subtitle" id="splSubtitle">نظام الإدارة المدرسية الذكي</div>
  `;
  document.body.prepend(splash);

  /* ======= تسلسل الخروج ======= */
  // بعد 2.6 ثانية: النص يختفي + الشعار يطير لأعلى
  setTimeout(() => {
    const title    = document.getElementById('splTitle');
    const subtitle = document.getElementById('splSubtitle');
    const logoWrap = document.getElementById('splLogoWrap');

    // إخفاء النص
    if (title)    title.classList.add('fade-out');
    if (subtitle) subtitle.classList.add('fade-out');

    // الشعار يطير للأعلى ثم يختفي مع الـ overlay
    if (logoWrap) {
      logoWrap.style.transition = 'all 0.85s cubic-bezier(0.55, 0, 1, 0.45)';
      logoWrap.style.transform  = 'scale(0.2) translateY(-600px)';
      logoWrap.style.opacity    = '0';
    }

    // بعد 0.5 ثانية: الـ overlay يختفي
    setTimeout(() => {
      splash.classList.add('splash-fade-out');
      setTimeout(() => { try { splash.remove(); } catch(e) {} }, 700);
    }, 500);

  }, 2600);

})();
