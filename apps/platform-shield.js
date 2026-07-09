/**
 * platform-shield.js — EduOS Shield v1.0
 * منظومة الجودة الذاتية — رصد + تبليغ + إشعار فوري
 * NAFAS FOR ARTIFICIAL INTELLIGENCE © 2026
 */

/* ── تحميل platform-lang.js تلقائياً لكل صفحة ── */
(function () {
  if (window.EduLang) return; // محمَّل مسبقاً
  const s = document.createElement('script');
  // نحدد المسار بناءً على موقع platform-shield.js
  const shieldScript = document.querySelector('script[src*="platform-shield"]');
  let base = '../'; // افتراضي: الصفحة في apps/eduos-xxx/
  if (shieldScript) {
    const src = shieldScript.getAttribute('src');
    // إذا كان المسار نسبياً مثل ../platform-shield.js
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

  const SHIELD_VERSION = "1.0.0";
  const _sbUrl = window.EduOS?.SB_URL || '';
  const REPORT_ENDPOINT = _sbUrl ? _sbUrl + "/functions/v1/report-bug" : '';
  const ANON_KEY = window.EduOS?.SB_KEY || '';
  const SLOW_PAGE_THRESHOLD = 3000; // 3 ثوانٍ

  // بيانات المستخدم الحالي من sessionStorage
  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem("edoos_user");
      if (!raw) return { id: "unknown", role: "unknown" };
      const u = JSON.parse(raw);
      return { id: u.username || u.id || "unknown", role: u.role || "unknown" };
    } catch { return { id: "unknown", role: "unknown" }; }
  }

  // إرسال البلاغ للـ Edge Function
  async function sendReport(data) {
    try {
      const user = getCurrentUser();
      const payload = {
        page_url: window.location.href,
        page_name: document.title || window.location.pathname,
        user_role: user.role,
        user_id: user.id,
        ...data,
      };
      await fetch(REPORT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("[Shield] Failed to send report:", e);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // الطبقة 1: زر التبليغ اليدوي 🚩
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function injectReportButton() {
    // لا تُضف في صفحة login
    if (window.location.pathname.includes("login") || window.location.pathname === "/") return;

    const btn = document.createElement("button");
    btn.id = "shield-report-btn";
    btn.innerHTML = "🚩";
    btn.title = "أبلغ عن مشكلة";
    btn.setAttribute("aria-label", "أبلغ عن مشكلة تقنية");
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(220,38,38,0.15);
      border: 1.5px solid rgba(220,38,38,0.4);
      color: #ef4444;
      font-size: 18px;
      cursor: pointer;
      z-index: 9997;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      backdrop-filter: blur(8px);
    `;
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "rgba(220,38,38,0.3)";
      btn.style.transform = "scale(1.1)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "rgba(220,38,38,0.15)";
      btn.style.transform = "scale(1)";
    });
    btn.addEventListener("click", openReportModal);
    document.body.appendChild(btn);
  }

  // نافذة التبليغ
  function openReportModal() {
    if (document.getElementById("shield-modal")) return;

    const overlay = document.createElement("div");
    overlay.id = "shield-modal";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Tajawal', sans-serif;
      direction: rtl;
    `;

    overlay.innerHTML = `
      <div style="
        background: #0D1B2A;
        border: 1px solid rgba(108,61,214,0.4);
        border-radius: 16px;
        padding: 28px;
        width: 380px;
        max-width: 90vw;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      ">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
          <span style="font-size:24px;">🚩</span>
          <h3 style="color:#fff; margin:0; font-size:18px;">أبلغ عن مشكلة</h3>
          <button id="shield-close" style="margin-right:auto; background:none; border:none; color:#666; font-size:20px; cursor:pointer;">✕</button>
        </div>

        <div style="margin-bottom:14px;">
          <label style="color:#94a3b8; font-size:13px; display:block; margin-bottom:6px;">نوع المشكلة</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${[
              ["broken_link","🔗 رابط لا يعمل"],
              ["ui_issue","🎨 مشكلة في الواجهة"],
              ["data_error","📊 بيانات خاطئة"],
              ["other","💬 أخرى"],
            ].map(([val, label]) => `
              <label style="
                display:flex; align-items:center; gap:8px;
                background:rgba(255,255,255,0.05);
                border:1px solid rgba(255,255,255,0.1);
                border-radius:8px; padding:10px;
                cursor:pointer; color:#cbd5e1; font-size:13px;
              ">
                <input type="radio" name="bug-type" value="${val}" style="accent-color:#6C3DD6;">
                ${label}
              </label>
            `).join("")}
          </div>
        </div>

        <div style="margin-bottom:18px;">
          <label style="color:#94a3b8; font-size:13px; display:block; margin-bottom:6px;">وصف المشكلة (اختياري)</label>
          <textarea id="shield-desc" rows="3" placeholder="اكتب ما حدث..." style="
            width:100%; background:rgba(255,255,255,0.05);
            border:1px solid rgba(255,255,255,0.1);
            border-radius:8px; padding:10px; color:#fff;
            font-family:'Tajawal',sans-serif; font-size:14px;
            resize:none; box-sizing:border-box;
          "></textarea>
        </div>

        <button id="shield-submit" style="
          width:100%; padding:12px;
          background: linear-gradient(135deg,#6C3DD6,#22D3EE);
          border:none; border-radius:10px;
          color:#fff; font-family:'Tajawal',sans-serif;
          font-size:15px; font-weight:700; cursor:pointer;
        ">إرسال البلاغ</button>

        <p id="shield-feedback" style="text-align:center; color:#22D3EE; margin-top:12px; font-size:13px; display:none;"></p>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("shield-close").onclick = () => overlay.remove();
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById("shield-submit").onclick = async () => {
      const typeEl = document.querySelector('input[name="bug-type"]:checked');
      const desc = document.getElementById("shield-desc").value.trim();
      const fb = document.getElementById("shield-feedback");
      const btn = document.getElementById("shield-submit");

      if (!typeEl) { fb.style.display = "block"; fb.style.color = "#ef4444"; fb.textContent = "يرجى اختيار نوع المشكلة"; return; }

      btn.textContent = "⏳ جارٍ الإرسال...";
      btn.disabled = true;

      await sendReport({
        report_type: typeEl.value,
        description: desc || `بلاغ يدوي: ${typeEl.value}`,
      });

      fb.style.display = "block";
      fb.style.color = "#22D3EE";
      fb.textContent = "✅ وصل البلاغ — سيُعالج في أقرب وقت";
      setTimeout(() => overlay.remove(), 2000);
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // الطبقة 2: رصد أخطاء JS تلقائياً
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let errorCount = 0;
  window.addEventListener("error", (e) => {
    errorCount++;
    // لا نُرسل كل خطأ بسيط — فقط الأخطاء الحقيقية وبحد 3 في الجلسة
    if (errorCount > 3) return;
    if (!e.filename || e.filename.includes("extension")) return;
    sendReport({
      report_type: "auto_js_error",
      description: `خطأ JS تلقائي: ${e.message}`,
      error_details: {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        col: e.colno,
      },
    });
  });

  // رصد الـ unhandled promise rejections
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
  // الطبقة 3: رصد الصفحات البطيئة
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // الطبقة 4: رصد الروابط المكسورة (404)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function checkLinks() {
    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (href.startsWith("javascript:")) return;

      link.addEventListener("click", async (e) => {
        // نفحص الروابط الداخلية فقط
        if (href.startsWith("/") || href.includes(window.location.hostname)) {
          try {
            const res = await fetch(href, { method: "HEAD" });
            if (res.status === 404) {
              e.preventDefault();
              sendReport({
                report_type: "broken_link",
                description: `رابط مكسور: ${href}`,
                error_details: { href, status: 404 },
              });
              showToast("⚠️ هذا الرابط لا يعمل حالياً — تم إبلاغ الفريق التقني");
            }
          } catch { /* شبكة — تجاهل */ }
        }
      });
    });
  }

  // إشعار خفيف (toast)
  function showToast(message, duration = 4000) {
    const existing = document.getElementById("shield-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "shield-toast";
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 130px;
      left: 16px;
      background: rgba(13,27,42,0.95);
      border: 1px solid rgba(34,211,238,0.4);
      color: #22D3EE;
      padding: 10px 16px;
      border-radius: 10px;
      font-family: 'Tajawal', sans-serif;
      font-size: 13px;
      z-index: 9998;
      direction: rtl;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      animation: shieldFadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  // أضف CSS animation
  const style = document.createElement("style");
  style.textContent = `@keyframes shieldFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`;
  document.head.appendChild(style);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // التهيئة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function init() {
    injectReportButton();
    setTimeout(checkLinks, 1500); // بعد تحميل الروابط
    console.log(`[EduOS Shield v${SHIELD_VERSION}] منظومة الجودة الذاتية تعمل ✅`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // تصدير للاستخدام الخارجي
  window.EduOSShield = { version: SHIELD_VERSION, sendReport, showToast };
})();
