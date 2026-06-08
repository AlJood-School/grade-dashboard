/**
 * platform-splash.js — EduOS Falcon Splash v3
 * الشعار يبدأ صغيراً → يكبر يكبر يكبر → يصغر ويطير لمكانه في اليمين
 * mix-blend-mode: screen لإخفاء الإطار المربع الداكن للـ PNG
 */
(function () {

  const style = document.createElement('style');
  style.textContent = `
    #edoos-splash {
      position: fixed; inset: 0;
      z-index: 999999;
      background: radial-gradient(ellipse at 50% 40%, #050d1e 0%, #020610 60%, #000 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: opacity 0.7s ease;
    }
    #edoos-splash.spl-out {
      opacity: 0;
      pointer-events: none;
    }

    /* ── الشعار الرئيسي ── */
    #spl-logo {
      position: relative;
      z-index: 20;
      transform: scale(0.03);
      opacity: 0;
      will-change: transform, opacity, filter;
    }
    #spl-logo img {
      display: block;
      width: 280px;
      height: 280px;
      object-fit: contain;
      background: transparent !important;
      /* mix-blend-mode: screen يجعل الخلفية الداكنة للـ PNG شفافة */
      mix-blend-mode: screen;
      /* توهج الأجنحة */
      filter:
        drop-shadow(0 0 0px rgba(246,201,14,0))
        drop-shadow(0 0 0px rgba(0,180,216,0));
    }

    /* ── حلقات نبض ── */
    .spl-ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid;
      transform: translate(-50%, -50%) scale(0);
      left: 50%; top: 50%;
      pointer-events: none;
      opacity: 0;
    }
    .spl-ring-1 { width: 380px; height: 380px; border-color: rgba(246,201,14,0.6); }
    .spl-ring-2 { width: 560px; height: 560px; border-color: rgba(0,180,216,0.45); }
    .spl-ring-3 { width: 740px; height: 740px; border-color: rgba(246,201,14,0.25); }
    .spl-ring-4 { width: 920px; height: 920px; border-color: rgba(0,180,216,0.15); }

    @keyframes ringPulse {
      0%   { transform: translate(-50%,-50%) scale(0.15); opacity: 0.9; }
      100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
    }

    /* ── جسيمات الشرر ── */
    .spl-spark {
      position: absolute;
      width: 4px; height: 4px;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
    }
    @keyframes sparkFly {
      0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }
      50%  { opacity: 1; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
    }

    /* ── جسيمات خلفية عائمة ── */
    .spl-dot {
      position: absolute;
      border-radius: 50%;
      opacity: 0;
      animation: dotFloat var(--d) var(--delay) ease-in-out infinite;
    }
    @keyframes dotFloat {
      0%,100% { opacity:0; transform: translateY(0) scale(1); }
      30%     { opacity: var(--op); }
      70%     { opacity: var(--op); transform: translateY(-40px) scale(1.4); }
    }

    /* ── وميض الذروة ── */
    @keyframes peakFlash {
      0%   { opacity: 0; }
      15%  { opacity: 0.18; }
      100% { opacity: 0; }
    }
    #spl-flash {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 50%, rgba(246,201,14,0.4) 0%, rgba(0,180,216,0.2) 40%, transparent 70%);
      pointer-events: none;
      opacity: 0;
    }
  `;
  document.head.appendChild(style);

  /* ── جسيمات خلفية ── */
  const splash = document.createElement('div');
  splash.id = 'edoos-splash';

  for (let i = 0; i < 20; i++) {
    const d = document.createElement('div');
    d.className = 'spl-dot';
    const sz = 2 + Math.random() * 5;
    const c = Math.random() > 0.5 ? '#f6c90e' : '#00b4d8';
    d.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;
      width:${sz}px;height:${sz}px;
      background:${c};box-shadow:0 0 ${sz*4}px ${c};
      --d:${2+Math.random()*3}s;
      --delay:${Math.random()*3}s;
      --op:${0.25+Math.random()*0.5}`;
    splash.appendChild(d);
  }

  /* ── وميض الذروة ── */
  const flash = document.createElement('div');
  flash.id = 'spl-flash';
  splash.appendChild(flash);

  /* ── حلقات نبض ── */
  const rings = [1,2,3,4].map(n => {
    const r = document.createElement('div');
    r.className = `spl-ring spl-ring-${n}`;
    splash.appendChild(r);
    return r;
  });

  /* ── الشعار ── */
  const logoWrap = document.createElement('div');
  logoWrap.id = 'spl-logo';
  const img = document.createElement('img');
  img.src = '/apps/edoos-logo.png';
  img.alt = 'EduOS';
  img.draggable = false;
  logoWrap.appendChild(img);
  splash.appendChild(logoWrap);

  document.body.prepend(splash);

  /* ════════════════════════════════════
     تسلسل الحركة — v3
     0ms       : يظهر من نقطة ضئيلة جداً scale(0.03)
     0→500ms   : يكبر سريع → scale(0.6)
     500→1200ms: يكبر ببطء جميل → scale(1.5)
     1200→2200ms: يكبر يكبر يكبر → scale(5) — الذروة الكاملة
     2200ms    : حلقات نبض + شرر + وميض
     2200ms    (hold لـ 400ms عند الذروة)
     2600→3300ms: يصغر ويطير لأعلى اليمين
     3400ms    : overlay يختفي
  ════════════════════════════════════ */

  const logo = document.getElementById('spl-logo');
  const logoImg = logo.querySelector('img');

  // المرحلة ١: من نقطة → متوسط
  requestAnimationFrame(() => {
    logo.style.transition = 'transform 0.5s cubic-bezier(0.34,1.3,0.64,1), opacity 0.3s ease';
    logo.style.transform = 'scale(0.6)';
    logo.style.opacity = '1';
    logoImg.style.transition = 'filter 0.5s ease';
    logoImg.style.filter = `
      drop-shadow(0 0 10px rgba(246,201,14,0.6))
      drop-shadow(0 0 25px rgba(246,201,14,0.3))`;
  });

  // المرحلة ٢: نمو جميل هادئ
  setTimeout(() => {
    logo.style.transition = 'transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)';
    logo.style.transform = 'scale(1.5)';
    logoImg.style.transition = 'filter 0.8s ease';
    logoImg.style.filter = `
      drop-shadow(0 0 25px rgba(246,201,14,0.9))
      drop-shadow(0 0 55px rgba(246,201,14,0.6))
      drop-shadow(0 0 90px rgba(0,180,216,0.4))`;
  }, 500);

  // المرحلة ٣: يكبر يكبر يكبر → الذروة الكاملة
  setTimeout(() => {
    logo.style.transition = 'transform 1.1s cubic-bezier(0.22,1,0.36,1)';
    logo.style.transform = 'scale(5)';
    logoImg.style.transition = 'filter 1.1s ease';
    // توهج الأجنحة في الذروة — قوي جداً
    logoImg.style.filter = `
      drop-shadow(0 0 40px rgba(246,201,14,1))
      drop-shadow(0 0 80px rgba(246,201,14,0.9))
      drop-shadow(0 0 140px rgba(0,180,216,0.7))
      drop-shadow(0 0 200px rgba(246,201,14,0.5))
      brightness(1.2)
      contrast(1.1)`;
  }, 1200);

  // المرحلة ٣.٥: وميض + حلقات النبض + شرر عند الذروة
  setTimeout(() => {
    // وميض ذهبي
    flash.style.animation = 'peakFlash 0.8s ease-out forwards';

    // حلقات النبض
    const delays = [0, 180, 380, 580];
    rings.forEach((r, i) => {
      setTimeout(() => {
        r.style.animation = `ringPulse 1.4s ease-out forwards`;
      }, delays[i]);
    });

    // شرر الأجنحة
    const sparkColors = ['#f6c90e','#00b4d8','#ffffff','#f6c90e','#00b4d8','#ffd700'];
    for (let i = 0; i < 28; i++) {
      const spark = document.createElement('div');
      spark.className = 'spl-spark';
      const angle = (Math.PI * 2 * i) / 28;
      const dist = 150 + Math.random() * 250;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const c = sparkColors[i % sparkColors.length];
      const sz = 3 + Math.random() * 4;
      spark.style.cssText = `
        left:50%; top:50%;
        width:${sz}px; height:${sz}px;
        background:${c};
        box-shadow:0 0 8px ${c}, 0 0 16px ${c};
        --tx:${tx}px; --ty:${ty}px;
        animation: sparkFly ${0.7+Math.random()*0.5}s ${Math.random()*0.3}s ease-out forwards;
      `;
      splash.appendChild(spark);
    }
  }, 2200);

  // المرحلة ٤: يصغر ويطير لأعلى اليمين (بعد hold عند الذروة)
  setTimeout(() => {
    // حاول تحديد موضع الشعار في الـ nav
    const navLogo = document.querySelector(
      '.nav-logo img, .nav-brand img, header img[src*="edoos-logo"], .logo img, nav img'
    );
    let targetX = '44vw', targetY = '-46vh';

    if (navLogo) {
      const rect = navLogo.getBoundingClientRect();
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (rect.left + rect.width / 2 - cx) + 'px';
      targetY = (rect.top + rect.height / 2 - cy) + 'px';
    }

    logo.style.transition = 'transform 0.75s cubic-bezier(0.55,0,1,0.45), opacity 0.6s ease';
    logo.style.transform = `scale(0.07) translate(${targetX}, ${targetY})`;
    logo.style.opacity = '0';

    logoImg.style.transition = 'filter 0.5s ease';
    logoImg.style.filter = `
      drop-shadow(0 0 6px rgba(246,201,14,0.5))
      drop-shadow(0 0 14px rgba(0,180,216,0.3))`;
  }, 2600);

  // المرحلة ٥: إخفاء الـ overlay
  setTimeout(() => {
    splash.classList.add('spl-out');
    setTimeout(() => { try { splash.remove(); } catch(e){} }, 750);
  }, 3300);

})();
