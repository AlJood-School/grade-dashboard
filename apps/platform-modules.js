/**
 * platform-modules.js — v1.0
 * محرك الوحدات المشتركة (منتجات NAFAS)
 * 
 * ما يفعله:
 * 1. يقرأ إعدادات الوحدات من app_settings.modules
 * 2. يُعرِّف window.EDUOS_MODULES = { nafas, midad, umq }
 * 3. يعرض/يخفي بطاقات الوحدات في Hub تلقائياً
 * 4. يتولى الانتقال الآمن (SSO) عند الضغط على وحدة مُفعَّلة
 * 5. يعرض رسالة "ترقية" عند الضغط على وحدة غير مُفعَّلة
 * 
 * القاعدة: مشتراة من NAFAS → تفعيل من NAFAS → المدير يرى الزر فقط
 */

(function () {
  'use strict';

  // ── إعدادات المنتجات ──
  const NAFAS_MODULES = {
    nafas: {
      id: 'nafas',
      name: 'نفَس',
      nameEn: 'Nafas',
      icon: '🧘',
      color: '#0EA5E9',   // أزرق نفَس
      gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
      desc: 'منصة الصحة النفسية — رصد الرفاه العاطفي للطلاب بالذكاء الاصطناعي',
      descEn: 'Mental health platform — AI-powered student wellbeing monitoring',
      domain: 'https://nafas-app.com',
      entryPath: '/?eduos_sso=',
      whoSees: ['principal', 'social_worker', 'admin'],  // من يرى الزر
      badge: 'صحة نفسية',
    },
    midad: {
      id: 'midad',
      name: 'مداد',
      nameEn: 'Midad',
      icon: '✏️',
      color: '#F59E0B',   // ذهبي مداد
      gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
      desc: 'منصة المحتوى الرقمي — دروس تفاعلية ومكتبة محتوى متوافقة مع المنهج',
      descEn: 'Digital content platform — Interactive lessons aligned with curriculum',
      domain: 'https://midad.ae',
      entryPath: '/?eduos_sso=',
      whoSees: ['principal', 'teacher', 'admin'],
      badge: 'محتوى رقمي',
    },
    umq: {
      id: 'umq',
      name: 'عمق',
      nameEn: 'Umq',
      icon: '🔬',
      color: '#8B5CF6',   // بنفسجي عمق
      gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
      desc: 'منصة البحث والتعمق — أدوات البحث العلمي والمشاريع المتعمقة',
      descEn: 'Research & depth platform — Scientific research tools & deep projects',
      domain: 'https://umq.ae',
      entryPath: '/?eduos_sso=',
      whoSees: ['principal', 'teacher', 'admin'],
      badge: 'بحث علمي',
    },
  };

  // ── تهيئة ──
  window.EDUOS_MODULES = { nafas: false, midad: false, umq: false };
  window.NAFAS_MODULE_DEFS = NAFAS_MODULES;

  // ── قراءة إعدادات الوحدات من Supabase ──
  async function loadModules() {
    try {
      const cfg = window.PLATFORM_CONFIG || {};
      const url = cfg.supabaseUrl || 'https://zuyizaiugpmhmeycqton.supabase.co';
      const _k1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const _k2 = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0';
      const _k3 = 'FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI';
      const key = [_k1, _k2, _k3].join('.');

      const res = await fetch(`${url}/rest/v1/app_settings?select=modules&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });

      if (!res.ok) throw new Error('fetch failed');
      const rows = await res.json();

      if (Array.isArray(rows) && rows.length > 0 && rows[0].modules) {
        const mods = rows[0].modules;
        window.EDUOS_MODULES = {
          nafas: !!mods.nafas,
          midad: !!mods.midad,
          umq:   !!mods.umq,
        };
      }
    } catch (e) {
      console.warn('[platform-modules] could not load modules config:', e);
    }

    // إرسال حدث "الوحدات جاهزة"
    window.dispatchEvent(new CustomEvent('eduos-modules-ready', {
      detail: window.EDUOS_MODULES
    }));
  }

  // ── حفظ إعدادات الوحدات (للمدير فقط — عبر Edge Function) ──
  window.saveModuleSettings = async function (settings) {
    try {
      const session = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
      if (!['principal', 'admin'].includes(session.role)) {
        throw new Error('unauthorized');
      }

      const cfg = window.PLATFORM_CONFIG || {};
      const url = cfg.supabaseUrl || 'https://zuyizaiugpmhmeycqton.supabase.co';

      const res = await fetch(`${url}/functions/v1/admin-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('edoos_user') || ''}`,
          'apikey': window._SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          action: 'update_modules',
          modules: settings
        })
      });

      if (!res.ok) throw new Error(await res.text());
      window.EDUOS_MODULES = settings;
      window.dispatchEvent(new CustomEvent('eduos-modules-ready', { detail: settings }));
      return { ok: true };
    } catch (e) {
      console.error('[platform-modules] saveModuleSettings:', e);
      return { ok: false, error: String(e) };
    }
  };

  // ── الانتقال الآمن (SSO) لمنتج مُفعَّل ──
  window.openNafasModule = async function (moduleId) {
    const mod = NAFAS_MODULES[moduleId];
    if (!mod) return;

    const isEnabled = window.EDUOS_MODULES[moduleId];

    if (!isEnabled) {
      // عرض رسالة الترقية
      showUpgradeModal(mod);
      return;
    }

    // فتح المنتج — في المرحلة الحالية: رابط مباشر
    // (SSO سيُفعَّل عند إعداد المنتج لقبول الرمز)
    try {
      // محاولة توليد رمز SSO
      const cfg = window.PLATFORM_CONFIG || {};
      const url = cfg.supabaseUrl || 'https://zuyizaiugpmhmeycqton.supabase.co';
      const session = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');

      const res = await fetch(`${url}/functions/v1/module-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.stringify(session)}`,
        },
        body: JSON.stringify({ module: moduleId })
      });

      if (res.ok) {
        const { redirect_url } = await res.json();
        window.open(redirect_url, '_blank');
      } else {
        // إذا لم تعمل Edge Function بعد — فتح مباشر
        window.open(mod.domain, '_blank');
      }
    } catch {
      window.open(mod.domain, '_blank');
    }
  };

  // ── نافذة "ترقية الباقة" ──
  function showUpgradeModal(mod) {
    // إزالة أي نافذة سابقة
    const old = document.getElementById('nafas-upgrade-modal');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'nafas-upgrade-modal';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(13,27,42,0.92);
      z-index:10000;display:flex;align-items:center;justify-content:center;
      backdrop-filter:blur(8px);direction:rtl;
    `;

    overlay.innerHTML = `
      <div style="
        background:linear-gradient(135deg,#112240,#1a2f4a);
        border:1px solid rgba(108,61,214,0.4);
        border-radius:20px;padding:36px;max-width:440px;width:90%;
        text-align:center;font-family:'Tajawal',sans-serif;
        box-shadow:0 20px 60px rgba(0,0,0,0.5);
      ">
        <div style="font-size:3rem;margin-bottom:12px;">${mod.icon}</div>
        <div style="
          font-size:1.6rem;font-weight:900;margin-bottom:6px;
          background:${mod.gradient};-webkit-background-clip:text;-webkit-text-fill-color:transparent;
        ">${mod.name}</div>
        <div style="font-size:0.85rem;color:#94A3B8;margin-bottom:20px;line-height:1.6;">
          ${mod.desc}
        </div>
        <div style="
          background:rgba(108,61,214,0.12);border:1px solid rgba(108,61,214,0.25);
          border-radius:12px;padding:14px 18px;margin-bottom:24px;
        ">
          <div style="font-size:0.8rem;color:#C4B5FD;font-weight:700;margin-bottom:6px;">
            🔒 هذه الوحدة غير مُفعَّلة في مدرستك
          </div>
          <div style="font-size:0.75rem;color:#64748B;line-height:1.5;">
            للتفعيل، تواصل مع فريق NAFAS للحصول على ترخيص الوحدة
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <a href="mailto:info@nafas-app.com?subject=طلب تفعيل ${mod.name}&body=مدرسة الجود تطلب تفعيل وحدة ${mod.name}"
             style="
               padding:10px 22px;border-radius:10px;font-family:'Tajawal',sans-serif;
               font-size:0.85rem;font-weight:700;cursor:pointer;text-decoration:none;
               background:linear-gradient(135deg,#6C3DD6,#22D3EE);color:white;
             ">
            📧 طلب التفعيل
          </a>
          <button onclick="document.getElementById('nafas-upgrade-modal').remove()"
             style="
               padding:10px 22px;border-radius:10px;font-family:'Tajawal',sans-serif;
               font-size:0.85rem;font-weight:700;cursor:pointer;
               background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
               color:#94A3B8;
             ">
            إغلاق
          </button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  // ── تشغيل ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadModules);
  } else {
    loadModules();
  }

})();
