/**
 * platform-splash.js — EduOS Falcon Splash v2
 * الشعار يبدأ صغيراً → يكبر كبيراً جداً → يصغر ويطير لمكانه في اليمين
 * التوهج يكون في تفاصيل الأجنحة — لا إطار مربع
 */
(function () {

  const style = document.createElement('style');
  style.textContent = `
    #edoos-splash {
      position: fixed; inset: 0;
      z-index: 999999;
      background: radial-gradient(ellipse at 50% 40%, #0a1628 0%, #04080f 65%, #000 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    #edoos-splash.spl-out {
      opacity: 0;
      transition: opacity 0.6s ease;
      pointer-events: none;
    }

    /* ── الشعار الرئيسي ── */
    #spl-logo {
      position: relative;
      z-index: 20;
      /* يبدأ صغيراً جداً */
      transform: scale(0.04);
      opacity: 0;
      will-change: transform, opacity, filter;
    }
    #spl-logo img {
      /* بدون خلفية ولا إطار مربع — الصقر فقط */
      display: block;
      width: 260px;
      height: 260px;
      object-fit: contain;
      background: transparent;
      /* توهج الأجنحة الأساسي */
      filter:
        drop-shadow(0 0 0px rgba(246,201,14,0))
        drop-shadow(0 0 0px rgba(0,180,216,0));
    }

    /* ── حلقات نبض حول الشعار ── */
    .spl-ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid;
      transform: translate(-50%, -50%) scale(0);
      left: 50%; top: 50%;
      pointer-events: none;
    }
    .spl-ring-1 { width: 320px; height: 320px; border-color: rgba(246,201,14,0.5); }
    .spl-ring-2 { width: 460px; height: 460px; border-color: rgba(0,180,216,0.35); }
    .spl-ring-3 { width: 600px; height: 600px; border-color: rgba(246,201,14,0.2); }
    .spl-ring-4 { width: 740px; height: 740px; border-color: rgba(0,180,216,0.12); }

    @keyframes ringPulse {
      0%   { transform: translate(-50%,-50%) scale(0.2); opacity: 0.8; }
      100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
    }

    /* ── جسيمات الأجنحة (تتناثر عند الذروة) ── */
    .spl-spark {
      position: absolute;
      width: 3px; height: 3px;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
    }
    @keyframes sparkFly {
      0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }
      60%  { opacity: 0.9; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
    }

    /* ── خلفية جزيئات ── */
    .spl-dot {
      position: absolute;
      border-radius: 50%;
      opacity: 0;
      animation: dotFloat var(--d) var(--delay) ease-in-out infinite;
    }
    @keyframes dotFloat {
      0%,100% { opacity:0; transform: translateY(0) scale(1); }
      30%     { opacity: var(--op); }
      70%     { opacity: var(--op); transform: translateY(-30px) scale(1.3); }
    }
  `;
  document.head.appendChild(style);

  /* ── جسيمات خلفية ── */
  const dots = Array.from({length: 16}, (_, i) => {
    const d = document.createElement('div');
    d.className = 'spl-dot';
    const x = Math.random()*100, y = Math.random()*100;
    const sz = 2 + Math.random()*4;
    const c = Math.random() > 0.5 ? '#f6c90e' : '#00b4d8';
    d.style.cssText = `left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;
      background:${c};box-shadow:0 0 ${sz*3}px ${c};
      --d:${2.5+Math.random()*2.5}s;
      --delay:${Math.random()*2}s;
      --op:${0.3+Math.random()*0.5}`;
    return d;
  });

  /* ── حلقات النبض ── */
  const rings = [1,2,3,4].map(n => {
    const r = document.createElement('div');
    r.className = `spl-ring spl-ring-${n}`;
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

  /* ── بناء الـ overlay ── */
  const splash = document.createElement('div');
  splash.id = 'edoos-splash';
  dots.forEach(d => splash.appendChild(d));
  rings.forEach(r => splash.appendChild(r));
  splash.appendChild(logoWrap);
  document.body.prepend(splash);

  /* ════════════════════════════════════
     تسلسل الحركة
     0ms      : يظهر (opacity 0→1) صغير جداً scale(0.04)
     0→400ms  : يكبر بسرعة إلى scale(0.5)
     400→900ms: يكبر ببطء جميل إلى scale(1)
     900→1500ms: يكبر أكثر إلى scale(2.4) — الذروة الكبيرة
     1500ms   : حلقات النبض + جسيمات الأجنحة
     1600→2200ms: يصغر ويتحرك لأعلى اليمين
     2200ms   : overlay يختفي
  ════════════════════════════════════ */

  const logo = document.getElementById('spl-logo');
  const logoImg = logo.querySelector('img');

  // المرحلة ١: ظهور سريع من نقطة
  requestAnimationFrame(() => {
    logo.style.transition = 'transform 0.4s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease';
    logo.style.transform = 'scale(0.5)';
    logo.style.opacity = '1';
    logoImg.style.transition = 'filter 0.4s ease';
    logoImg.style.filter = `
      drop-shadow(0 0 8px rgba(246,201,14,0.5))
      drop-shadow(0 0 20px rgba(246,201,14,0.3))`;
  });

  // المرحلة ٢: نمو جميل إلى حجم طبيعي
  setTimeout(() => {
    logo.style.transition = 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease';
    logo.style.transform = 'scale(1)';
    logoImg.style.transition = 'filter 0.6s ease';
    logoImg.style.filter = `
      drop-shadow(0 0 20px rgba(246,201,14,0.8))
      drop-shadow(0 0 50px rgba(246,201,14,0.5))
      drop-shadow(0 0 80px rgba(0,180,216,0.3))`;
  }, 400);

  // المرحلة ٣: يكبر كبيراً — الذروة
  setTimeout(() => {
    logo.style.transition = 'transform 0.7s cubic-bezier(0.34,1.0,0.64,1)';
    logo.style.transform = 'scale(2.6)';
    logoImg.style.transition = 'filter 0.7s ease';
    // توهج الأجنحة في الذروة
    logoImg.style.filter = `
      drop-shadow(0 0 35px rgba(246,201,14,1))
      drop-shadow(0 0 70px rgba(246,201,14,0.8))
      drop-shadow(0 0 120px rgba(0,180,216,0.6))
      drop-shadow(0 0 160px rgba(246,201,14,0.4))
      brightness(1.15)`;
  }, 900);

  // المرحلة ٣.٥: حلقات النبض عند الذروة
  setTimeout(() => {
    const delays = [0, 200, 400, 600];
    rings.forEach((r, i) => {
      setTimeout(() => {
        r.style.animation = `ringPulse 1.2s ease-out forwards`;
      }, delays[i]);
    });

    // جسيمات شرر الأجنحة
    const sparkColors = ['#f6c90e','#00b4d8','#fff','#f6c90e','#00b4d8'];
    for (let i = 0; i < 20; i++) {
      const spark = document.createElement('div');
      spark.className = 'spl-spark';
      const angle = (Math.PI * 2 * i) / 20;
      const dist = 120 + Math.random() * 200;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const c = sparkColors[i % sparkColors.length];
      spark.style.cssText = `
        left:50%; top:50%;
        background:${c};
        box-shadow:0 0 6px ${c};
        --tx:${tx}px; --ty:${ty}px;
        animation: sparkFly ${0.6 + Math.random()*0.4}s ${Math.random()*0.2}s ease-out forwards;
      `;
      splash.appendChild(spark);
    }
  }, 1500);

  // المرحلة ٤: يصغر ويطير لأعلى اليمين
  setTimeout(() => {
    // احسب موضع شعار الـ nav (أعلى يمين الصفحة)
    const navLogo = document.querySelector('.nav-logo img, .nav-logo, header .logo, .logo-img, img[src*="edoos-logo"]');
    let targetX = '42vw', targetY = '-44vh';

    if (navLogo) {
      const rect = navLogo.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetX = (rect.left + rect.width/2 - centerX) + 'px';
      targetY = (rect.top + rect.height/2 - centerY) + 'px';
    }

    logo.style.transition = 'transform 0.7s cubic-bezier(0.55,0,1,0.45), opacity 0.5s ease';
    logo.style.transform = `scale(0.08) translate(${targetX}, ${targetY})`;
    logo.style.opacity = '0.2';

    logoImg.style.transition = 'filter 0.5s ease';
    logoImg.style.filter = `
      drop-shadow(0 0 8px rgba(246,201,14,0.6))
      drop-shadow(0 0 20px rgba(0,180,216,0.4))`;

  }, 1700);

  // المرحلة ٥: إخفاء الـ overlay
  setTimeout(() => {
    splash.classList.add('spl-out');
    setTimeout(() => { try { splash.remove(); } catch(e){} }, 650);
  }, 2200);

})();
