/**
 * platform-live-clock.js — EduOS Live Clock Component v1.0
 * مكوّن الساعة الحية المشترك — يُضاف لأي صفحة بسطر واحد
 * Usage: <div data-live-clock></div> OR EduOSClock.inject('#myEl')
 */
(function () {
  'use strict';

  const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function getLang() {
    return document.documentElement.lang === 'en' || localStorage.getItem('eduos_lang') === 'en' ? 'en' : 'ar';
  }

  function formatTime(d, lang) {
    const h = d.getHours(), min = String(d.getMinutes()).padStart(2, '0');
    if (lang === 'en') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = String(h % 12 || 12).padStart(2, '0');
      return `${h12}:${min} ${ampm}`;
    }
    const ampm = h >= 12 ? 'م' : 'ص';
    const h12 = String(h % 12 || 12).padStart(2, '0');
    return `${h12}:${min} ${ampm}`;
  }

  function formatDate(d, lang) {
    if (lang === 'en') {
      return `${DAYS_EN[d.getDay()]}, ${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `${DAYS_AR[d.getDay()]}، ${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
  }

  function buildText(d, mode, lang) {
    const time = formatTime(d, lang);
    const date = formatDate(d, lang);
    if (mode === 'time') return `🕐 ${time}`;
    if (mode === 'date') return `📅 ${date}`;
    return `📅 ${date} · 🕐 ${time}`;
  }

  // Inject clock into a DOM element
  function inject(selector, opts = {}) {
    const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!target) return null;

    const span = document.createElement('span');
    span.className = 'eduos-live-clock';
    span.style.cssText = opts.style || 'font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;direction:rtl;';
    target.appendChild(span);

    const mode = opts.mode || 'both'; // 'time' | 'date' | 'both'
    let langCache = getLang();

    function tick() {
      const now = new Date();
      const lang = getLang();
      if (lang !== langCache) langCache = lang;
      span.textContent = buildText(now, mode, langCache);
    }

    tick();
    const timer = setInterval(tick, 1000);
    span._stopClock = () => clearInterval(timer);
    return span;
  }

  // Auto-inject into any element with data-live-clock attribute
  function autoInject() {
    document.querySelectorAll('[data-live-clock]').forEach(el => {
      if (el.querySelector('.eduos-live-clock')) return; // already injected
      const mode = el.dataset.liveClock || 'both';
      inject(el, { mode, style: el.dataset.clockStyle || '' });
    });
  }

  // ── Public API ──
  window.EduOSClock = { inject, autoInject, formatTime, formatDate };

  // Auto-run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInject);
  } else {
    autoInject();
  }
})();
