// استيراد خط Tajawal الموحَّد
(function(){
  if(!document.querySelector('link[href*="Tajawal"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap';
    document.head.appendChild(l);
  }
})();

/**
 * platform-tour.js — EduOS Guided Tour Engine v1.0
 * محرك الجولة التعريفية التلقائية لجميع منظومات EduOS
 *
 * الاستخدام: أضف السطر التالي قبل </body> في أي صفحة:
 *   <script src="../platform-tour.js"></script>
 *
 * لوصف مخصص لأي عنصر:
 *   <button data-tour="هذا الزر يحفظ البيانات تلقائياً">حفظ</button>
 *   <div data-tour-title="عنوان مختصر" data-tour="وصف تفصيلي">...</div>
 *
 * لاستثناء عنصر من الجولة:
 *   <button data-tour-ignore>زر مخفي</button>
 *
 * تعمل الجولة تلقائياً على أي عناصر جديدة دون أي تعديل في الكود.
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — EduOS
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════
     الإعدادات
  ═══════════════════════════════════════════════ */
  const CFG = {
    maxSteps: 25,
    btnBottom: 56,    // px from bottom (above news ticker)
    btnLeft: 20,
    highlightColor: '#6366f1',
    animMs: 300,
  };

  const LABELS = {
    tour:     '🎯 جولة',
    prev:     '→ السابق',
    next:     'التالي ←',
    finish:   '🎉 انتهت الجولة',
    skip:     '✕ تخطى',
    step:     'خطوة',
    of:       'من',
    done:     'أحسنت! انتهت الجولة التعريفية ✨',
    empty:    'لا توجد عناصر محددة في هذه الصفحة',
    intro:    'الجولة التعريفية',
    introSub: 'سنتعرف معاً على أهم عناصر هذه الصفحة',
  };

  /* ═══════════════════════════════════════════════
     الحالة
  ═══════════════════════════════════════════════ */
  let _active  = false;
  let _step    = 0;
  let _els     = [];
  let _overlay = null;
  let _tip     = null;
  let _saved   = [];   // stores { el, boxShadow, zIndex, position }

  /* ═══════════════════════════════════════════════
     الزر العائم
  ═══════════════════════════════════════════════ */
  function buildBtn() {
    if (document.getElementById('_edoosTourBtn')) return;
    const btn = document.createElement('button');
    btn.id = '_edoosTourBtn';
    btn.setAttribute('data-tour-ignore', '');
    btn.innerHTML = LABELS.tour;
    Object.assign(btn.style, {
      position:     'fixed',
      bottom:       CFG.btnBottom + 'px',
      left:         CFG.btnLeft + 'px',
      zIndex:       '9980',
      background:   'linear-gradient(135deg,#6366f1,#8b5cf6)',
      color:        '#fff',
      border:       'none',
      borderRadius: '24px',
      padding:      '9px 18px',
      fontSize:     '13px',
      fontFamily:   '"Tajawal",sans-serif',
      fontWeight:   '600',
      cursor:       'pointer',
      boxShadow:    '0 4px 20px rgba(99,102,241,.45)',
      transition:   'all .2s',
      direction:    'rtl',
      whiteSpace:   'nowrap',
    });
    btn.onmouseenter = () => { btn.style.transform = 'scale(1.07)'; btn.style.boxShadow = '0 6px 28px rgba(99,102,241,.65)'; };
    btn.onmouseleave = () => { btn.style.transform = 'scale(1)';    btn.style.boxShadow = '0 4px 20px rgba(99,102,241,.45)'; };
    btn.addEventListener('click', startTour);
    document.body.appendChild(btn);
  }

  /* ═══════════════════════════════════════════════
     جمع العناصر من الـ DOM تلقائياً
  ═══════════════════════════════════════════════ */
  function collectEls() {
    const result = [];
    const seen   = new WeakSet();

    // الترتيب يعكس الأولوية: data-tour أولاً ثم باقي العناصر
    const selectors = [
      // 1. ما تحدده المطوّرة صراحةً
      '[data-tour]',
      // 2. شريط التبويبات
      'nav a[href]:not([data-tour-ignore]), nav button:not([data-tour-ignore])',
      '.tab-btn:not([data-tour-ignore]), [role="tab"]:not([data-tour-ignore])',
      // 3. أزرار الفلتر / الفئات
      '.filter-btn:not([data-tour-ignore]), .cat-btn:not([data-tour-ignore])',
      // 4. بطاقات المنظومات / الأقسام
      '.system-card:not([data-tour-ignore]), .app-card:not([data-tour-ignore]), .stat-card:not([data-tour-ignore])',
      // 5. حقل البحث
      'input[type="search"], input[placeholder*="بحث"], input[placeholder*="ابحث"]',
      // 6. الأزرار الرئيسية
      'button[type="submit"]:not([data-tour-ignore]), .btn-primary:not([data-tour-ignore])',
      // 7. روابط الوصول السريع في الفوتر
      'footer a:not([data-tour-ignore]), .quick-links a:not([data-tour-ignore])',
    ];

    selectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (seen.has(el)) return;
          if (!isVisible(el))  return;
          if (shouldIgnore(el)) return;
          seen.add(el);
          result.push(el);
        });
      } catch (_) {}
    });

    return result.slice(0, CFG.maxSteps);
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = window.getComputedStyle(el);
    return r.width > 8 && r.height > 8 &&
           s.display    !== 'none' &&
           s.visibility !== 'hidden' &&
           s.opacity    !== '0';
  }

  function shouldIgnore(el) {
    if (el.hasAttribute('data-tour-ignore')) return true;
    if (el.closest('[data-tour-ignore]'))    return true;
    if (el.id === '_edoosTourBtn')           return true;
    // تجاهل أزرار الخروج
    if (el.classList.contains('exit-btn'))   return true;
    if (el.id === 'logoutBtn')               return true;
    // تجاهل ما هو داخل الـ tooltip
    if (el.closest('#_edoosTourTip'))        return true;
    return false;
  }

  /* ═══════════════════════════════════════════════
     استخراج وصف العنصر
  ═══════════════════════════════════════════════ */
  function getTitle(el) {
    if (el.dataset.tourTitle) return el.dataset.tourTitle;
    // عنوان داخل العنصر
    const h = el.querySelector('h1,h2,h3,h4,h5,strong,.card-title,.section-title');
    if (h) return h.innerText.trim().slice(0, 50);
    // aria
    const aria = el.getAttribute('aria-label');
    if (aria) return aria.slice(0, 50);
    return '';
  }

  function getDesc(el) {
    // 1. data-tour (الأعلى أولوية)
    if (el.dataset.tour && el.dataset.tour.length > 2) return el.dataset.tour;
    // 2. data-tour-desc
    if (el.dataset.tourDesc) return el.dataset.tourDesc;
    // 3. title attribute
    if (el.title) return el.title;
    // 4. aria-label
    const aria = el.getAttribute('aria-label');
    if (aria) return aria;
    // 5. النص الداخلي + فقرات داخل العنصر
    const sub = el.querySelector('p, .desc, .subtitle, .card-sub');
    if (sub) return sub.innerText.trim().slice(0, 120);
    // 6. النص الكامل للعنصر
    const txt = (el.innerText || el.textContent || '').trim();
    return txt.slice(0, 100) || 'انقر للاستكشاف';
  }

  /* ═══════════════════════════════════════════════
     بدء الجولة
  ═══════════════════════════════════════════════ */
  function startTour() {
    if (_active) return;
    _els  = collectEls();
    if (_els.length === 0) { showToast(LABELS.empty); return; }
    _step  = 0;
    _active = true;
    buildOverlay();
    showStep(0);
  }

  /* ═══════════════════════════════════════════════
     الـ Overlay والـ Tooltip
  ═══════════════════════════════════════════════ */
  function buildOverlay() {
    // طبقة التعتيم
    _overlay = document.createElement('div');
    _overlay.id = '_edoosTourOverlay';
    Object.assign(_overlay.style, {
      position:       'fixed',
      inset:          '0',
      background:     'rgba(0,0,0,0)',
      zIndex:         '9985',
      transition:     `background ${CFG.animMs}ms ease`,
      pointerEvents:  'none',
    });
    document.body.appendChild(_overlay);
    requestAnimationFrame(() => { _overlay.style.background = 'rgba(0,0,0,.62)'; });

    // البطاقة التوضيحية
    _tip = document.createElement('div');
    _tip.id = '_edoosTourTip';
    Object.assign(_tip.style, {
      position:     'fixed',
      zIndex:       '9999',
      minWidth:     '270px',
      maxWidth:     '330px',
      background:   'linear-gradient(145deg,#1e293b,#0f172a)',
      border:       '1px solid rgba(99,102,241,.4)',
      borderRadius: '18px',
      padding:      '20px',
      boxShadow:    '0 24px 64px rgba(0,0,0,.65),0 0 0 1px rgba(99,102,241,.15)',
      direction:    'rtl',
      fontFamily:   '"Tajawal",sans-serif',
      color:        '#e2e8f0',
      pointerEvents:'all',
      opacity:      '0',
      transform:    'translateY(12px)',
      transition:   `all ${CFG.animMs}ms ease`,
    });
    document.body.appendChild(_tip);
  }

  /* ═══════════════════════════════════════════════
     عرض خطوة
  ═══════════════════════════════════════════════ */
  function showStep(i) {
    _step = i;
    const el = _els[i];

    // إزالة تظليل سابق
    _saved.forEach(({ el: e, boxShadow, zIndex, position }) => {
      e.style.boxShadow = boxShadow;
      e.style.zIndex    = zIndex;
      e.style.position  = position;
      e.style.borderRadius = '';
      e.removeAttribute('data-tour-active');
    });
    _saved = [];

    // تظليل العنصر الحالي
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    const cs = window.getComputedStyle(el);
    _saved.push({
      el,
      boxShadow: cs.boxShadow,
      zIndex:    cs.zIndex,
      position:  cs.position,
    });
    if (cs.position === 'static') el.style.position = 'relative';
    el.style.zIndex     = '9990';
    el.style.boxShadow  = `0 0 0 3px ${CFG.highlightColor}, 0 0 0 7px rgba(99,102,241,.28), 0 0 40px rgba(99,102,241,.35)`;
    el.style.borderRadius = cs.borderRadius !== '0px' ? cs.borderRadius : '8px';
    el.setAttribute('data-tour-active', '');

    // رسم الـ tooltip بعد الـ scroll
    setTimeout(() => renderTip(el, i), CFG.animMs + 50);
  }

  function renderTip(el, i) {
    const title  = getTitle(el);
    const desc   = getDesc(el);
    const isLast = i === _els.length - 1;

    _tip.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <span style="font-size:11px;color:${CFG.highlightColor};background:rgba(99,102,241,.14);padding:3px 11px;border-radius:20px;font-weight:600;">
          ${LABELS.step} ${i + 1} ${LABELS.of} ${_els.length}
        </span>
        <button onclick="window._edoosTourEnd()"
          style="background:none;border:none;color:#64748b;cursor:pointer;font-size:19px;line-height:1;padding:0 2px;transition:color .15s;"
          onmouseenter="this.style.color='#ef4444'"
          onmouseleave="this.style.color='#64748b'">${LABELS.skip}</button>
      </div>
      ${title ? `<div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:6px;line-height:1.4">${title}</div>` : ''}
      <div style="font-size:12.5px;color:#94a3b8;line-height:1.65;margin-bottom:16px">${desc}</div>
      <div style="display:flex;gap:8px">
        ${i > 0
          ? `<button onclick="window._edoosTourPrev()"
               style="flex:1;padding:9px 6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
                      border-radius:10px;color:#94a3b8;cursor:pointer;font-size:12px;font-family:Tajawal,sans-serif;transition:all .15s"
               onmouseenter="this.style.background='rgba(255,255,255,.1)'"
               onmouseleave="this.style.background='rgba(255,255,255,.05)'">${LABELS.prev}</button>`
          : '<div style="flex:1"></div>'}
        <button onclick="${isLast ? 'window._edoosTourEnd()' : 'window._edoosTourNext()'}"
          style="flex:1.4;padding:9px 6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;
                 border-radius:10px;color:#fff;cursor:pointer;font-size:13px;font-weight:700;
                 font-family:Tajawal,sans-serif;transition:all .15s;box-shadow:0 4px 14px rgba(99,102,241,.4)"
          onmouseenter="this.style.transform='scale(1.03)'"
          onmouseleave="this.style.transform='scale(1)'">
          ${isLast ? LABELS.finish : LABELS.next}
        </button>
      </div>
    `;

    // تحديد موضع الـ tooltip بذكاء
    positionTip(el);
    _tip.style.opacity   = '1';
    _tip.style.transform = 'translateY(0)';
  }

  function positionTip(el) {
    const r  = el.getBoundingClientRect();
    const tw = 330, th = 200;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top, left;

    // أولوية: أسفل العنصر → فوقه → جانبه → وسط الشاشة
    if (r.bottom + th + 16 < vh) {
      top  = r.bottom + 12;
      left = r.left + r.width / 2 - tw / 2;
    } else if (r.top - th - 16 > 0) {
      top  = r.top - th - 12;
      left = r.left + r.width / 2 - tw / 2;
    } else if (r.right + tw + 16 < vw) {
      top  = r.top + r.height / 2 - th / 2;
      left = r.right + 12;
    } else {
      top  = vh / 2 - th / 2;
      left = vw / 2 - tw / 2;
    }

    // تأكد من البقاء داخل حدود الشاشة
    left = Math.max(10, Math.min(left, vw - tw - 10));
    top  = Math.max(10, Math.min(top,  vh - th - 10));

    _tip.style.top  = top  + 'px';
    _tip.style.left = left + 'px';
  }

  /* ═══════════════════════════════════════════════
     تحكم عالمي (يُستدعى من الـ HTML inline)
  ═══════════════════════════════════════════════ */
  window._edoosTourNext = () => {
    if (_step < _els.length - 1) showStep(_step + 1);
    else endTour();
  };
  window._edoosTourPrev = () => {
    if (_step > 0) showStep(_step - 1);
  };
  window._edoosTourEnd = endTour;

  /* ═══════════════════════════════════════════════
     إنهاء الجولة
  ═══════════════════════════════════════════════ */
  function endTour() {
    _active = false;

    // إزالة التظليل
    _saved.forEach(({ el, boxShadow, zIndex, position }) => {
      el.style.boxShadow  = boxShadow;
      el.style.zIndex     = zIndex;
      el.style.position   = position;
      el.style.borderRadius = '';
      el.removeAttribute('data-tour-active');
    });
    _saved = [];

    // إزالة العناصر المرئية
    if (_overlay) { _overlay.style.background = 'rgba(0,0,0,0)'; setTimeout(() => { _overlay?.remove(); _overlay = null; }, CFG.animMs); }
    if (_tip)     { _tip.style.opacity = '0'; _tip.style.transform = 'translateY(12px)'; setTimeout(() => { _tip?.remove(); _tip = null; }, CFG.animMs); }

    showToast(LABELS.done);
  }

  /* ═══════════════════════════════════════════════
     إشعار خفيف
  ═══════════════════════════════════════════════ */
  function showToast(msg) {
    const t = document.createElement('div');
    Object.assign(t.style, {
      position:     'fixed',
      bottom:       '90px',
      left:         '50%',
      transform:    'translateX(-50%) translateY(20px)',
      background:   '#1e293b',
      color:        '#e2e8f0',
      padding:      '10px 22px',
      borderRadius: '14px',
      fontFamily:   '"Tajawal",sans-serif',
      fontSize:     '13px',
      zIndex:       '99999',
      border:       '1px solid rgba(99,102,241,.3)',
      boxShadow:    '0 10px 30px rgba(0,0,0,.35)',
      transition:   'all .3s ease',
      opacity:      '0',
      whiteSpace:   'nowrap',
    });
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(-10px)'; setTimeout(() => t.remove(), 400); }, 3200);
  }

  /* ═══════════════════════════════════════════════
     تهيئة
  ═══════════════════════════════════════════════ */
  function init() {
    // لا تضيف زر الجولة في صفحة الدخول
    if (location.pathname.includes('eduos-login')) return;
    buildBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500); // انتظر قليلاً بعد تحميل الصفحة
  }

})();
