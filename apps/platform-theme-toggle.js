/* ═══════════════════════════════════════════════════════════
   EduOS — Theme Toggle (Light ↔ Dark) v2
   للمعلم/ة والمختص/ة — الافتراضي فاتح، مع خيار داكن
   الإصلاح: يُعيد تعيين CSS variables عند التبديل للفاتح
   ═══════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  const STORAGE_KEY = 'eduos_teacher_theme';
  let isDark = sessionStorage.getItem(STORAGE_KEY) === 'dark';

  const LIGHT_VARS = {
    '--bg':           '#F4F6FB',
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
    '--primary':      '#6C3DD6',
    '--primary2':     '#22D3EE',
    '--accent':       '#0EA5E9',
    '--green':        '#059669',
    '--red':          '#DC2626',
    '--yellow':       '#D97706',
    '--purple':       '#7C3AED',
    '--orange':       '#EA580C',
    '--input-bg':     '#F8FAFF',
    '--input-border': 'rgba(108,61,214,0.2)',
    '--shadow':       '0 2px 12px rgba(0,0,0,0.06)',
    '--shadow2':      '0 4px 20px rgba(0,0,0,0.08)',
    '--glow-indigo':  'rgba(108,61,214,0.06)',
  };

  const DARK_VARS = {
    '--bg':           '#0D1B2A',
    '--surface':      '#111827',
    '--surface2':     '#1a2235',
    '--surface3':     '#1f2d44',
    '--sidebar-bg':   'rgba(13,27,42,0.95)',
    '--card':         'rgba(255,255,255,0.04)',
    '--card2':        'rgba(255,255,255,0.06)',
    '--card-hover':   'rgba(255,255,255,0.08)',
    '--text':         '#E2E8F0',
    '--text2':        '#CBD5E1',
    '--text3':        '#94A3B8',
    '--muted':        '#94A3B8',
    '--border':       'rgba(255,255,255,0.08)',
    '--divider':      'rgba(255,255,255,0.06)',
    '--primary':      '#818CF8',
    '--primary2':     '#22D3EE',
    '--accent':       '#38BDF8',
    '--green':        '#34D399',
    '--red':          '#F87171',
    '--yellow':       '#FCD34D',
    '--purple':       '#A78BFA',
    '--orange':       '#FB923C',
    '--input-bg':     'rgba(255,255,255,0.05)',
    '--input-border': 'rgba(255,255,255,0.12)',
    '--shadow':       '0 2px 12px rgba(0,0,0,0.4)',
    '--shadow2':      '0 4px 20px rgba(0,0,0,0.5)',
    '--glow-indigo':  'rgba(99,102,241,0.12)',
  };

  function applyVars(vars) {
    const r = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => r.style.setProperty(k, v));
  }

  function applyTheme() {
    const r = document.documentElement;
    if (isDark) {
      r.classList.add('dark-mode');
      applyVars(DARK_VARS);
      document.body && (document.body.style.background = '#0D1B2A');
      document.body && (document.body.style.color = '#E2E8F0');
      if (btn) { btn.textContent = '☀️'; btn.title = 'الثيم الفاتح | Light Mode'; }
      sessionStorage.setItem(STORAGE_KEY, 'dark');
    } else {
      r.classList.remove('dark-mode');
      applyVars(LIGHT_VARS);
      document.body && (document.body.style.background = '#F4F6FB');
      document.body && (document.body.style.color = '#1E293B');
      if (btn) { btn.textContent = '🌙'; btn.title = 'الثيم الداكن | Dark Mode'; }
      sessionStorage.setItem(STORAGE_KEY, 'light');
    }
  }

  // تطبيق فوري قبل DOMContentLoaded لتجنب الوميض
  applyVars(isDark ? DARK_VARS : LIGHT_VARS);
  if (isDark) document.documentElement.classList.add('dark-mode');
  else document.documentElement.classList.remove('dark-mode');

  let btn = null;

  function injectButton() {
    if (document.getElementById('theme-toggle-btn')) return;
    btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'الثيم الفاتح | Light Mode' : 'الثيم الداكن | Dark Mode';
    btn.setAttribute('aria-label', 'تبديل الثيم');
    btn.onclick = function() {
      isDark = !isDark;
      applyTheme();
    };
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectButton();
      applyTheme(); // تأكيد تطبيق body styles
    });
  } else {
    injectButton();
    applyTheme();
  }
})();
