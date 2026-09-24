/*
 * platform-gender.js — نظام اللغة المحايدة / المؤنثة / المذكرة
 * يقرأ إعداد staff_gender من app_settings ويطبق اللغة المناسبة
 *
 * القيم: 'f'=مؤنث | 'm'=مذكر | 'n'=محايد (افتراضي)
 */
(function() {
  // القيم الافتراضية (محايد)
  window.GENDER = 'n';
  window.gText = function(f, m, n) {
    var g = window.GENDER;
    return g === 'f' ? f : g === 'm' ? m : n;
  };

  window.GENDER_ROLE_LABELS = {
    teacher:     { f: 'معلمة',          m: 'معلم',         n: 'معلم/ة' },
    principal:   { f: 'المديرة',        m: 'المدير',       n: 'المدير/ة' },
    vp:          { f: 'نائبة المديرة',  m: 'نائب المدير',  n: 'نائب/ة المدير/ة' },
    coordinator: { f: 'منسقة',          m: 'منسق',         n: 'منسق/ة' },
    counselor:   { f: 'مرشدة',          m: 'مرشد',         n: 'مرشد/ة' },
    specialist:  { f: 'أخصائية',        m: 'أخصائي',       n: 'أخصائي/ة' },
    admin:       { f: 'مدير/ة النظام',  m: 'مدير النظام',  n: 'مدير/ة النظام' },
    nurse:       { f: 'ممرضة',          m: 'ممرض',         n: 'ممرض/ة' },
    technician:  { f: 'فنية',           m: 'فني',          n: 'فني/ة' },
    staff:       { f: 'عضو الكادر',     m: 'عضو الكادر',   n: 'عضو الكادر' },
  };

  function getLabel(role) {
    var map = window.GENDER_ROLE_LABELS[role];
    if (!map) return role;
    var g = window.GENDER;
    return map[g] || map['n'];
  }
  window.getGenderLabel = getLabel;

  // تحميل الإعداد من Supabase
  function loadGenderSetting() {
    var SB_URL = window.SUPABASE_URL || '';
    var SB_KEY = window.SUPABASE_ANON_KEY || '';
    if (!SB_URL || !SB_KEY) return;

    fetch(SB_URL + '/rest/v1/app_settings?key=eq.staff_gender&select=value', {
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY
      }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data[0] && data[0].value) {
        window.GENDER = data[0].value;
      }
      // بث حدث للصفحات التي تنتظر
      document.dispatchEvent(new CustomEvent('genderLoaded', { detail: { gender: window.GENDER } }));
    })
    .catch(function() {
      document.dispatchEvent(new CustomEvent('genderLoaded', { detail: { gender: 'n' } }));
    });
  }

  // انتظر تحميل Supabase config ثم اقرأ الإعداد
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGenderSetting);
  } else {
    loadGenderSetting();
  }
})();
