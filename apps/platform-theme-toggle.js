/* ═══════════════════════════════════════════════════════════
   EduOS — Theme Toggle (Light ↔ Dark)
   للمعلم/ة والمختص/ة — الافتراضي فاتح، مع خيار داكن
   ═══════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // in-memory only (no localStorage per platform policy)
  let isDark = false;

  function applyTheme() {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      if (btn) btn.textContent = '☀️';
      if (btn) btn.title = 'تبديل للثيم الفاتح | Switch to Light';
    } else {
      document.documentElement.classList.remove('dark-mode');
      if (btn) btn.textContent = '🌙';
      if (btn) btn.title = 'تبديل للثيم الداكن | Switch to Dark';
    }
  }

  // إنشاء الزر
  let btn = null;

  function injectButton() {
    if (document.getElementById('theme-toggle-btn')) return;
    btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.textContent = '🌙';
    btn.title = 'تبديل للثيم الداكن | Switch to Dark';
    btn.setAttribute('aria-label', 'تبديل الثيم');
    btn.onclick = function() {
      isDark = !isDark;
      applyTheme();
    };
    document.body.appendChild(btn);
    applyTheme();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
