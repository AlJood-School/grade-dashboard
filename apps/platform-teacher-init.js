/**
 * EduOS — Teacher/Specialist Portal Light Theme Init v2
 * إصلاح: platform-theme.js يُسجَّل DOMContentLoaded ويُعيد تطبيق الثيم الداكن.
 * الحل: نُسجَّل DOMContentLoaded بعده — فيُشغَّل handler التعليم بعد handler الثيم.
 * + setTimeout كطبقة أمان إضافية.
 */
(function () {
  'use strict';

  const r = document.documentElement;
  const STORAGE_KEY = 'eduos_teacher_theme';

  function shouldUseDark() {
    try { return sessionStorage.getItem(STORAGE_KEY) === 'dark'; } catch(e) { return false; }
  }

  const lightVars = {
    /* خلفيات */
    '--bg':           '#F4F6FB',
    '--bg2':          '#FFFFFF',
    '--bg3':          '#F0F2FA',
    '--surface':      '#FFFFFF',
    '--surface2':     '#F0F2FA',
    '--surface3':     '#E8EBF5',
    '--sidebar-bg':   '#FFFFFF',
    '--card':         '#FFFFFF',
    '--card2':        '#F9FAFF',
    '--card-hover':   '#F0F4FF',
    /* نصوص */
    '--text':         '#1E293B',
    '--text2':        '#334155',
    '--text3':        '#475569',
    '--muted':        '#64748B',
    /* حدود */
    '--border':       'rgba(0,0,0,0.08)',
    '--divider':      'rgba(0,0,0,0.06)',
    /* ألوان العلامة التجارية */
    '--primary':      '#6C3DD6',
    '--primary2':     '#22D3EE',
    '--accent':       '#0EA5E9',
    '--violet':       '#7C3AED',
    '--blue':         '#2563EB',
    '--teal':         '#0D9488',
    '--green':        '#059669',
    '--red':          '#DC2626',
    '--yellow':       '#D97706',
    '--amber':        '#D97706',
    '--purple':       '#7C3AED',
    '--orange':       '#EA580C',
    '--pink':         '#DB2777',
    /* indigo/emerald (naming من platform-theme.js) */
    '--indigo':       '#6C3DD6',
    '--indigo2':      '#7C3AED',
    '--emerald':      '#059669',
    '--emerald2':     '#10B981',
    '--gold':         '#D97706',
    '--rose':         '#DC2626',
    '--sky':          '#0EA5E9',
    /* مدخلات */
    '--input-bg':     '#F8FAFF',
    '--input-border': 'rgba(108,61,214,0.2)',
    /* ظلال */
    '--shadow':       '0 2px 12px rgba(0,0,0,0.06)',
    '--shadow2':      '0 4px 20px rgba(0,0,0,0.08)',
    '--glow-indigo':  'rgba(108,61,214,0.06)',
    '--glow-emerald': 'rgba(5,150,105,0.06)',
    /* header */
    '--header-bg':    'linear-gradient(135deg,#6C3DD6,#22D3EE)',
    '--card-shadow':  '0 2px 12px rgba(0,0,0,0.06)',
  };

  function applyLight() {
    if (shouldUseDark()) {
      r.classList.add('dark-mode');
      return;
    }
    r.classList.remove('dark-mode');
    Object.entries(lightVars).forEach(([k, v]) => r.style.setProperty(k, v));
    if (document.body) {
      document.body.style.background = '#F4F6FB';
      document.body.style.color      = '#1E293B';
    }
    window.__teacherThemeApplied = true;
  }

  // ① تطبيق فوري (قبل DOMContentLoaded)
  applyLight();

  // ② بعد DOMContentLoaded — يُشغَّل بعد platform-theme.js لأنه سُجِّل لاحقاً
  document.addEventListener('DOMContentLoaded', applyLight);

  // ③ طبقة أمان: بعد 150ms لتجاوز أي async init
  setTimeout(applyLight, 150);
  setTimeout(applyLight, 600);

})();
