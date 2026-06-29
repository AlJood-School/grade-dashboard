/**
 * EduOS — Teacher/Specialist Portal Light Theme Init
 * يُشغَّل فوراً بعد platform-theme.js لتجاوز الثيم الداكن الافتراضي
 * المعلمة/المختصة: الثيم الفاتح افتراضياً مع خيار الداكن
 */
(function () {
  'use strict';

  const r = document.documentElement;
  const STORAGE_KEY = 'eduos_teacher_theme';

  // قرأ تفضيل محفوظ — إذا لم يوجد → فاتح افتراضياً
  const saved = sessionStorage.getItem(STORAGE_KEY);
  const useDark = saved === 'dark';

  if (useDark) {
    r.classList.add('dark-mode');
    return; // platform-theme.js يتولى الثيم الداكن
  }

  // ── تطبيق الثيم الفاتح فوراً (يتجاوز platform-theme.js) ──
  r.classList.remove('dark-mode');

  const lightVars = {
    /* متغيرات عامة */
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
    '--text':         '#1E293B',
    '--text2':        '#334155',
    '--text3':        '#475569',
    '--muted':        '#64748B',
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
    /* مدخلات */
    '--input-bg':     '#F8FAFF',
    '--input-border': 'rgba(108,61,214,0.2)',
    /* ظلال */
    '--shadow':       '0 2px 12px rgba(0,0,0,0.06)',
    '--shadow2':      '0 4px 20px rgba(0,0,0,0.08)',
    '--glow-indigo':  'rgba(108,61,214,0.06)',
    '--header-bg':    'linear-gradient(135deg,#6C3DD6,#22D3EE)',
    /* indigo (platform-theme.js naming) */
    '--indigo':       '#6C3DD6',
    '--indigo2':      '#7C3AED',
    '--emerald':      '#059669',
    '--emerald2':     '#10B981',
    '--gold':         '#D97706',
  };

  Object.entries(lightVars).forEach(([k, v]) => r.style.setProperty(k, v));

  // اضبط body مباشرة كذلك للتأكيد
  document.addEventListener('DOMContentLoaded', function () {
    document.body.style.background = '#F4F6FB';
    document.body.style.color = '#1E293B';
  });
})();
