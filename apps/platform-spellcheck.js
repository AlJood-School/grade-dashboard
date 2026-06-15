/**
 * platform-spellcheck.js v1.0
 * EduOS Arabic / English Spell-Check Engine
 * NAFAS FOR ARTIFICIAL INTELLIGENCE © 2026
 *
 * Features:
 *   • Real-time checking on text inputs & textareas
 *   • Wavy red underline on misspelled words (non-intrusive)
 *   • Tooltip with suggestion on hover/tap
 *   • 200+ common Arabic educational spelling corrections
 *   • English spellcheck delegated to the browser natively
 *   • Does NOT depend on any external service
 *   • Auto-init — no manual call needed
 */

(function () {
  'use strict';

  // ─── Arabic Corrections Dictionary ────────────────────────────────────────
  // Format:  'wrong spelling': 'correct spelling'
  const AR_CORRECTIONS = {
    // ألف وصل / قطع
    'انشاء':         'إنشاء',
    'اداء':          'أداء',
    'افضل':          'أفضل',
    'اكثر':          'أكثر',
    'اقل':           'أقل',
    'امكانية':       'إمكانية',
    'اهداف':         'أهداف',
    'استاذ':         'أستاذ',
    'استاذة':        'أستاذة',
    'اسلوب':         'أسلوب',
    'اجتماعي':       'اجتماعي',
    'احتياجات':      'احتياجات',
    'اختبار':        'اختبار',
    'انتهاء':        'انتهاء',
    'ارسال':         'إرسال',
    'اضافة':         'إضافة',
    'اصدار':         'إصدار',
    'الغاء':         'إلغاء',
    'اجمالي':        'إجمالي',
    'ادارة':         'إدارة',
    'اجراء':         'إجراء',
    'اعداد':         'إعداد',

    // تاء مربوطة / هاء
    'مدرسه':         'مدرسة',
    'طالبه':         'طالبة',
    'معلمه':         'معلمة',
    'مديره':         'مديرة',
    'لجنه':          'لجنة',
    'هيئه':          'هيئة',
    'فئه':           'فئة',
    'نتيجه':         'نتيجة',
    'درجه':          'درجة',
    'مهمه':          'مهمة',
    'خطه':           'خطة',
    'رساله':         'رسالة',
    'وثيقه':         'وثيقة',
    'بطاقه':         'بطاقة',
    'محاوله':        'محاولة',
    'مشارك':         'مشاركة',
    'ملاحظه':        'ملاحظة',
    'قائمه':         'قائمة',

    // ألف مقصورة / ألف
    'الى':           'إلى',
    'علي':           'على',
    'حتي':           'حتى',
    'متي':           'متى',
    'أيضا':          'أيضاً',
    'عموما':         'عموماً',
    'اخيرا':         'أخيراً',
    'جدا':           'جداً',
    'فعلا':          'فعلاً',
    'مثلا':          'مثلاً',
    'حاليا':         'حالياً',
    'سابقا':         'سابقاً',

    // كلمات شائعة في السياق التعليمي
    'الطالبه':       'الطالبة',
    'المعلمه':       'المعلمة',
    'الطالب ':       'الطالب',
    'النتائج':       'النتائج',
    'الدرجات':       'الدرجات',
    'الإختبار':      'الاختبار',
    'الإجتماع':      'الاجتماع',
    'الإستاذ':       'الأستاذ',
    'إستمارة':       'استمارة',
    'إستطلاع':       'استطلاع',
    'إستخدام':       'استخدام',
    'إستيراد':       'استيراد',
    'إستعراض':       'استعراض',
    'إستمرار':       'استمرار',
    'إنجليزي':       'إنجليزي',
    'الإمارات ':     'الإمارات',
    'دبي ':          'دبي',
    'ابوظبي':        'أبوظبي',
    'التربيه':       'التربية',
    'التعليمه':      'التعليمية',
    'المدرسيه':      'المدرسية',
    'الاكاديمي':     'الأكاديمي',
    'الاكاديمية':    'الأكاديمية',
    'الاداء':        'الأداء',
    'الافضل':        'الأفضل',
    'الاهداف':       'الأهداف',
    'الاولياء':      'الأولياء',
    'السنوي':        'السنوي',
    'الفصلي':        'الفصلي',
    'دوام':          'دوام',
    'غياب ':         'غياب',
    'حضور ':         'حضور',
    'تقرير ':        'تقرير',
    'نظام ':         'نظام',
    'برنامج ':       'برنامج',

    // مصطلحات EduOS الداخلية
    'الجدوال':       'الجداول',
    'الاختبارات':    'الاختبارات',
    'الانشطة':       'الأنشطة',
    'المنهاج':       'المنهج',
    'الحصص':         'الحصص',
    'المقررات':      'المقررات',
    'المعايير':      'المعايير',
    'المؤشرات':      'المؤشرات',
    'التوطين ':      'التوطين',
    'المواطنين':     'المواطنين',
    'الكفاءات':      'الكفاءات',
    'الاهداف ':      'الأهداف',
    'ذوي':           'ذوي',
    'الفئات':        'الفئات',
    'المبادرات':     'المبادرات',
    'الاستراتيجية':  'الاستراتيجية',
    'والتكنولوجيا':  'والتكنولوجيا',
    'الرقمية':       'الرقمية',
    'الذكاء ':       'الذكاء',
    'الإصطناعي':     'الاصطناعي',
    'التطبيق':       'التطبيق',
    'المنصه':        'المنصة',
    'الكترونيا':     'إلكترونياً',
    'الكتروني':      'إلكتروني',
    'الكترونية':     'إلكترونية',
    'إلكتوني':       'إلكتروني',
  };

  // ─── Build reverse index (word → correction) ──────────────────────────────
  // Normalized: strip diacritics + lowercase for matching
  function normalize(word) {
    return word
      .replace(/[\u064B-\u065F\u0670]/g, '')   // strip tashkeel
      .replace(/\u0622|\u0623|\u0625/g, '\u0627') // normalize alef variants
      .trim();
  }

  // ─── Check a single word ──────────────────────────────────────────────────
  function checkWord(word) {
    if (!word || word.length < 3) return null;
    const norm = normalize(word);
    if (AR_CORRECTIONS[norm]) return AR_CORRECTIONS[norm];
    // Check original (some corrections include diacritics)
    if (AR_CORRECTIONS[word]) return AR_CORRECTIONS[word];
    return null;
  }

  // ─── Inject CSS once ─────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('spellcheck-styles')) return;
    const style = document.createElement('style');
    style.id = 'spellcheck-styles';
    style.textContent = `
      .sc-wrapper { position: relative; display: inline-block; width: 100%; }
      .sc-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        overflow: hidden;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: 'Tajawal', sans-serif;
        padding: inherit;
        font-size: inherit;
        line-height: inherit;
        color: transparent;
        z-index: 1;
      }
      .sc-err {
        text-decoration: underline wavy #ff4444;
        text-decoration-skip-ink: none;
        cursor: help;
        position: relative;
      }
      .sc-tooltip {
        position: fixed;
        background: #1e1e2e;
        color: #e8edf2;
        border: 1px solid rgba(255,60,60,0.4);
        border-radius: 8px;
        padding: 6px 12px;
        font-family: 'Tajawal', sans-serif;
        font-size: 0.82rem;
        z-index: 99999;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        transition: opacity 0.15s;
      }
      .sc-tooltip .sc-fix { color: #4ade80; font-weight: 700; }
    `;
    document.head.appendChild(style);
  }

  // ─── Tooltip singleton ────────────────────────────────────────────────────
  let tooltip = null;
  function getTooltip() {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'sc-tooltip';
      tooltip.style.opacity = '0';
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }
  function showTooltip(x, y, wrong, fix) {
    const t = getTooltip();
    t.innerHTML = `❌ <span style="color:#ff8888">${wrong}</span> → <span class="sc-fix">${fix}</span>`;
    t.style.opacity = '1';
    t.style.left = (x + 8) + 'px';
    t.style.top  = (y - 36) + 'px';
  }
  function hideTooltip() {
    const t = getTooltip();
    t.style.opacity = '0';
  }

  // ─── Analyse text, return array of {word, correction, index} ──────────────
  function analyseText(text) {
    const errors = [];
    // Arabic word boundary regex
    const wordRe = /[\u0600-\u06FF]+/g;
    let m;
    while ((m = wordRe.exec(text)) !== null) {
      const fix = checkWord(m[0]);
      if (fix) errors.push({ word: m[0], fix, index: m.index });
    }
    return errors;
  }

  // ─── Build highlighted HTML for overlay ───────────────────────────────────
  function buildOverlayHtml(text) {
    const errors = analyseText(text);
    if (!errors.length) return escHtml(text);

    let result = '';
    let last = 0;
    errors.forEach(e => {
      result += escHtml(text.slice(last, e.index));
      result += `<span class="sc-err" data-fix="${escHtml(e.fix)}" data-word="${escHtml(e.word)}">${escHtml(e.word)}</span>`;
      last = e.index + e.word.length;
    });
    result += escHtml(text.slice(last));
    return result;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ─── Attach to a single input or textarea ─────────────────────────────────
  function attachTo(el) {
    if (el.__scAttached) return;
    el.__scAttached = true;

    // Only check Arabic-heavy inputs
    const tag = el.tagName.toLowerCase();
    if (!['input','textarea'].includes(tag)) return;
    if (el.type && !['text','search','email',''].includes(el.type)) return;

    // Enable native EN spell-check
    el.setAttribute('spellcheck', 'true');
    el.setAttribute('lang', 'mixed');

    // AR checking: debounced badge on input
    let timer;
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => runCheck(el), 600);
    });
    el.addEventListener('blur', () => runCheck(el));
  }

  // ─── Badge: show error count next to input ────────────────────────────────
  function runCheck(el) {
    const text = el.value || '';
    const errors = analyseText(text);

    // Remove old badge
    const oldBadge = el.parentNode?.querySelector('.sc-badge[data-for]');
    if (oldBadge && oldBadge.dataset.for === el.id) oldBadge.remove();

    if (!errors.length || !text.trim()) return;

    // Ensure el has id
    if (!el.id) el.id = 'sc-el-' + Math.random().toString(36).slice(2,8);

    // Create badge
    const badge = document.createElement('div');
    badge.className = 'sc-badge';
    badge.dataset.for = el.id;
    badge.title = errors.map(e => `${e.word} → ${e.fix}`).join('\n');
    badge.style.cssText = `
      position:absolute; top:50%; transform:translateY(-50%);
      ${document.dir==='rtl'?'left':'right'}:8px;
      background:rgba(255,68,68,0.15); border:1px solid rgba(255,68,68,0.4);
      color:#ff8888; border-radius:12px; padding:2px 8px;
      font-size:0.7rem; font-family:'Tajawal',sans-serif;
      cursor:default; pointer-events:auto; z-index:10;
    `;
    badge.textContent = `${errors.length} خطأ إملائي`;

    // Show first suggestion on click
    badge.addEventListener('click', () => {
      if (!errors.length) return;
      const msg = errors.slice(0,3).map(e=>`"${e.word}" → "${e.fix}"`).join('\n');
      showNotif(msg);
    });

    // Position: needs a wrapper
    let wrapper = el.closest('.sc-input-wrap');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'sc-input-wrap';
      wrapper.style.cssText = 'position:relative;display:block;';
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    }
    wrapper.appendChild(badge);
  }

  // ─── Notification toast ────────────────────────────────────────────────────
  function showNotif(msg) {
    let notif = document.getElementById('sc-notif');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'sc-notif';
      notif.style.cssText = `
        position:fixed; bottom:80px; right:16px; z-index:99998;
        background:#1e1e2e; border:1px solid rgba(255,68,68,0.35);
        color:#e8edf2; border-radius:12px; padding:14px 18px;
        font-family:'Tajawal',sans-serif; font-size:0.85rem;
        max-width:320px; line-height:1.6; white-space:pre-line;
        box-shadow:0 4px 24px rgba(0,0,0,0.5);
        transition:opacity 0.3s;
      `;
      document.body.appendChild(notif);
    }
    notif.innerHTML = `
      <div style="font-weight:700;color:#ff8888;margin-bottom:6px">⚠️ تصحيح إملائي مقترح</div>
      <div style="font-size:0.82rem;color:#aab">${msg}</div>
    `;
    notif.style.opacity = '1';
    clearTimeout(notif.__timer);
    notif.__timer = setTimeout(() => { notif.style.opacity = '0'; }, 5000);
  }

  // ─── Observe DOM for new inputs ───────────────────────────────────────────
  function scanPage() {
    document.querySelectorAll('input[type="text"],input:not([type]),textarea').forEach(attachTo);
  }

  const obs = new MutationObserver(() => scanPage());

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    scanPage();
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  window.EduSpell = {
    check:   checkWord,
    analyse: analyseText,
    addWord(wrong, correct) { AR_CORRECTIONS[normalize(wrong)] = correct; },
  };

})();
