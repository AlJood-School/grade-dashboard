/**
 * platform-shield.js — EduOS Shield v1.1
 * منظومة الجودة الذاتية — رصد تلقائي صامت (بدون زر في الهيدر)
 * NAFAS FOR ARTIFICIAL INTELLIGENCE © 2026
 */

/* ── تحميل platform-lang.js تلقائياً لكل صفحة ── */
(function () {
  if (window.EduLang) return;
  const s = document.createElement('script');
  const shieldScript = document.querySelector('script[src*="platform-shield"]');
  let base = '../';
  if (shieldScript) {
    const src = shieldScript.getAttribute('src');
    if (src.startsWith('../')) base = '../';
    else if (src.includes('/apps/platform-shield')) {
      base = src.replace('platform-shield.js', '');
    }
  }
  s.src = base + 'platform-lang.js';
  s.defer = true;
  document.head.appendChild(s);
})();

(function () {
  "use strict";

  const SHIELD_VERSION = "1.1.1";
  const _sbUrl = window.EduOS?.SB_URL || '';
  const REPORT_ENDPOINT = _sbUrl ? _sbUrl + "/functions/v1/report-bug" : '';
  const ANON_KEY = window.EduOS?.SB_KEY || '';
  const SLOW_PAGE_THRESHOLD = 3000;

  let _reportTimestamps = [];
  function _isRateLimited() {
    const now = Date.now();
    _reportTimestamps = _reportTimestamps.filter(t => now - t < 5 * 60 * 1000);
    if (_reportTimestamps.length >= 3) return true;
    _reportTimestamps.push(now);
    return false;
  }

  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem("edoos_user");
      if (!raw) return { id: "unknown", role: "unknown" };
      const u = JSON.parse(raw);
      return { id: u.username || u.id || "unknown", role: u.role || "unknown" };
    } catch { return { id: "unknown", role: "unknown" }; }
  }

  // Diagnostics must not retain URL queries/fragments (login/recovery state).
  function diagnosticUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol !== "https:" && url.protocol !== "http:") return "[url omitted]";
      return url.origin + url.pathname;
    } catch { return "[url omitted]"; }
  }

  function diagnosticValue(value, depth = 0) {
    if (depth > 6) return "[details omitted]";
    if (typeof value === "string") {
      return value
        .replace(/(?:https?:)?\/\/[^\s<>]+/gi, url => diagnosticUrl(url))
        // Also remove query/fragment suffixes from relative or quoted references.
        .replace(/[?#][^\s<>]*/g, "");
    }
    if (Array.isArray(value)) return value.map(item => diagnosticValue(item, depth + 1));
    if (value && typeof value === "object") {
      const clean = Object.create(null);
      for (const [key, item] of Object.entries(value)) clean[key] = diagnosticValue(item, depth + 1);
      return clean;
    }
    return value;
  }

  async function sendReport(data) {
    if (_isRateLimited()) return;
    try {
      const user = getCurrentUser();
      const payload = {
        page_name: document.title || window.location.pathname,
        user_role: user.role,
        user_id: user.id,
        ...diagnosticValue(data),
        // Apply after caller data so page_url cannot override the safe location.
        page_url: diagnosticUrl(window.location.href),
      };
      if (!REPORT_ENDPOINT) return;
      await fetch(REPORT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
        body: JSON.stringify(payload),
      });
    } catch (e) { /* صامت */ }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // الطبقة 1: رصد أخطاء JS تلقائياً — صامت
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let errorCount = 0;
  window.addEventListener("error", (e) => {
    errorCount++;
    if (errorCount > 3) return;
    if (!e.filename || e.filename.includes("extension")) return;
    sendReport({
      report_type: "auto_js_error",
      description: `خطأ JS تلقائي: ${e.message}`,
      error_details: { message: e.message, filename: diagnosticUrl(e.filename), line: e.lineno, col: e.colno },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    if (errorCount > 3) return;
    errorCount++;
    sendReport({
      report_type: "auto_js_error",
      description: `Promise rejection: ${e.reason?.message || String(e.reason)}`,
      error_details: { reason: String(e.reason) },
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // الطبقة 2: رصد الصفحات البطيئة — صامت
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pageStart = performance.now();
  window.addEventListener("load", () => {
    const loadTime = performance.now() - pageStart;
    if (loadTime > SLOW_PAGE_THRESHOLD) {
      sendReport({
        report_type: "slow_page",
        description: `الصفحة بطيئة: ${Math.round(loadTime)}ms`,
        error_details: { load_time_ms: Math.round(loadTime) },
      });
    }
  });

  // تصدير للاستخدام الخارجي
  window.EduOSShield = { version: SHIELD_VERSION, sendReport };

  // Shield v1.1 active — silent mode (no header button)
})();
