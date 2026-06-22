// ═══════════════════════════════════════════════════════════════
// platform-deeplink.js v1.0 — EduOS Ecosystem Hub
// نظام الربط العميق: الجود ↔ مِداد ↔ عُمق ↔ نَفَس
// © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE (CN-6573712)
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── خريطة الصفوف EduOS → مِداد ───────────────────────────────
  const GRADE_MAP = {
    'KG1': 'KG1', 'KG2': 'KG2',
    '1': 'الصف الأول', '2': 'الصف الثاني', '3': 'الصف الثالث',
    '4': 'الصف الرابع', '5': 'الصف الخامس', '6': 'الصف السادس',
    '7': 'الصف السابع', '8': 'الصف الثامن', '9': 'الصف التاسع',
    '10': 'الصف العاشر', '11': 'الصف الحادي عشر', '12': 'الصف الثاني عشر'
  };

  // ── أدوار تظهر لها بوابة مِداد ───────────────────────────────
  const MIDAD_ROLES = ['teacher', 'vice_principal', 'principal', 'curriculum_coordinator'];

  // ── أدوار تظهر لها بوابة عُمق (كل الموظفين) ─────────────────
  const UMQ_ROLES   = ['teacher', 'vice_principal', 'principal', 'social_worker',
                       'nurse', 'counselor', 'admin_staff', 'sub_teacher',
                       'curriculum_coordinator', 'inspector'];

  // ── الصفحات المستثناة ─────────────────────────────────────────
  const EXCLUDED_PATHS = ['eduos-login', 'eduos-landing'];

  // ─────────────────────────────────────────────────────────────
  function init() {
    const path = window.location.pathname;
    if (EXCLUDED_PATHS.some(p => path.includes(p))) return;

    // انتظر حتى يجهز auth guard
    const tryCreate = () => {
      if (window._eduosUser) {
        createHub();
      } else {
        setTimeout(tryCreate, 600);
      }
    };
    setTimeout(tryCreate, 800);
  }

  // ── بناء context من المستخدم ─────────────────────────────────
  function getCtx() {
    const u = window._eduosUser || {};
    const gradeRaw = String(u.grade || '');
    return {
      role:    u.role    || '',
      name:    u.full_name || u.username || '',
      grade:   GRADE_MAP[gradeRaw] || gradeRaw,
      subject: u.subject  || '',
      school: 'مدرسة الجود'
    };
  }

  // ── روابط المنتجات ───────────────────────────────────────────
  function midadURL(ctx) {
    const p = new URLSearchParams({ from: 'aljood' });
    if (ctx.grade)   p.set('grade',   ctx.grade);
    if (ctx.subject) p.set('subject', ctx.subject);
    return `https://midad.ae/app.html?${p}`;
  }

  function umqURL(ctx) {
    const roleLabel = ctx.role === 'teacher' ? 'معلمة' :
                      ctx.role === 'principal' ? 'مدير/ة' :
                      ctx.role === 'vice_principal' ? 'وكيل/ة' :
                      ctx.role === 'social_worker' ? 'أخصائية اجتماعية' : 'موظف';
    const prompt = `أنا ${roleLabel} في ${ctx.school}، أحتاج مساعدة مهنية في عملي`;
    const p = new URLSearchParams({ from: 'aljood', persona: 'teacher', prompt });
    return `https://umq.ae/consultant.html?${p}`;
  }

  // ── إنشاء الـ Hub ─────────────────────────────────────────────
  function createHub() {
    const ctx = getCtx();
    if (!ctx.role) return;

    const showMidad = MIDAD_ROLES.includes(ctx.role);
    const showUmq   = UMQ_ROLES.includes(ctx.role);
    if (!showMidad && !showUmq) return;

    // Container
    const hub = document.createElement('div');
    hub.id = 'nafas-deeplink-hub';
    hub.setAttribute('data-tour', 'منتجات NAFAS المرتبطة بالجود — افتح مِداد لبناء مناهجك أو عُمق للاستشارة أو نَفَس للدعم النفسي');
    Object.assign(hub.style, {
      position: 'fixed', bottom: '24px', left: '24px', zIndex: '8000',
      display: 'flex', flexDirection: 'column-reverse', gap: '8px',
      fontFamily: "'Tajawal', sans-serif", alignItems: 'flex-start'
    });

    // ── زر الفتح/الإغلاق ─────────────────────────────────────
    const toggle = document.createElement('button');
    toggle.title = 'منتجات NAFAS';
    toggle.innerHTML = '<span id="nafas-hub-icon">🔗</span>';
    Object.assign(toggle.style, {
      width: '44px', height: '44px', borderRadius: '50%',
      background: 'linear-gradient(135deg,#6C3DD6,#22D3EE)',
      border: 'none', cursor: 'pointer', fontSize: '20px',
      boxShadow: '0 4px 20px rgba(108,61,214,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.25s'
    });

    // ── Panel ─────────────────────────────────────────────────
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      display: 'none', flexDirection: 'column', gap: '6px',
      background: 'rgba(10,14,26,0.97)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
      padding: '14px', backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '190px'
    });

    // Header
    const header = document.createElement('div');
    header.style.cssText = `font-size:10px;color:rgba(255,255,255,0.35);
      letter-spacing:1.5px;text-align:center;margin-bottom:6px;text-transform:uppercase`;
    header.textContent = 'منظومة NAFAS';
    panel.appendChild(header);

    // Buttons
    if (showMidad) {
      panel.appendChild(mkBtn('✏️', 'مِداد', 'بناء المناهج الذكية', '#C7AE6A', midadURL(ctx)));
    }
    if (showUmq) {
      panel.appendChild(mkBtn('🧠', 'عُمق', 'المستشار المهني الذكي', '#8b5cf6', umqURL(ctx)));
    }
    panel.appendChild(mkBtn('🫁', 'نَفَس', 'الدعم النفسي والعاطفي', '#22D3EE', 'https://nafas-app.com'));

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.2);text-align:center;margin-top:6px;border-top:1px solid rgba(255,255,255,0.07);padding-top:8px';
    footer.textContent = 'NAFAS FOR ARTIFICIAL INTELLIGENCE';
    panel.appendChild(footer);

    // Toggle logic
    let open = false;
    toggle.addEventListener('click', () => {
      open = !open;
      panel.style.display  = open ? 'flex' : 'none';
      toggle.style.transform = open ? 'rotate(45deg)' : 'rotate(0)';
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (open && !hub.contains(e.target)) {
        open = false;
        panel.style.display  = 'none';
        toggle.style.transform = 'rotate(0)';
      }
    });

    hub.appendChild(panel);
    hub.appendChild(toggle);
    document.body.appendChild(hub);
  }

  // ── صانع زر المنتج ───────────────────────────────────────────
  function mkBtn(emoji, name, sub, color, url) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    Object.assign(a.style, {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', textDecoration: 'none',
      transition: 'all 0.2s', cursor: 'pointer'
    });

    const icon = document.createElement('div');
    icon.style.cssText = `width:32px;height:32px;border-radius:8px;
      background:${color}22;display:flex;align-items:center;
      justify-content:center;font-size:16px;flex-shrink:0`;
    icon.textContent = emoji;

    const txt = document.createElement('div');
    txt.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:#fff">${name}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:1px">${sub}</div>
    `;

    const arrow = document.createElement('span');
    arrow.style.cssText = `margin-right:auto;color:${color};font-size:14px;flex-shrink:0;transition:transform 0.2s`;
    arrow.textContent = '←';

    a.append(icon, txt, arrow);

    a.addEventListener('mouseenter', () => {
      a.style.background   = hexAlpha(color, 0.1);
      a.style.borderColor  = hexAlpha(color, 0.3);
      arrow.style.transform = 'translateX(-3px)';
    });
    a.addEventListener('mouseleave', () => {
      a.style.background   = 'rgba(255,255,255,0.04)';
      a.style.borderColor  = 'rgba(255,255,255,0.08)';
      arrow.style.transform = 'translateX(0)';
    });

    return a;
  }

  function hexAlpha(hex, alpha) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) return `rgba(255,255,255,${alpha})`;
    return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`;
  }

  // ── Start ─────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
