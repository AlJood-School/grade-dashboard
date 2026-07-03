/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS Platform Language Engine  v1.0
 *  ─────────────────────────────────────────────────────────────
 *  • يُغيِّر كل حرف وكل كلمة وكل جملة — بلا استثناء
 *  • يشمل: الأذكار، الأقوال، الأحاديث، شريط الأخبار، الهيدر،
 *    أسماء الأزرار، العناوين، النصوص الديناميكية
 *  • يحقن زر اللغة تلقائياً في كل صفحة
 *  • يستخدم sessionStorage (لا localStorage)
 *  • يُطلق حدث eduos-lang-change عند كل تغيير
 * ═══════════════════════════════════════════════════════════════
 */

window.EduLang = (function () {

  const STORAGE_KEY = 'eduos_lang';

  /* ─────────────────────────────────────────────────────────────
   * قاموس الترجمة الكامل — كل نص ثابت في المنصة
   * ──────────────────────────────────────────────────────────── */
  const DICT = {
    /* ── الهوية ── */
    'بوابة الجود الذكية'          : 'Al-Jood Smart Portal',
    'Powered by EduOS'             : 'Powered by EduOS',
    'منصة EduOS'                   : 'EduOS Platform',
    'EduOS — منصة التعليم الذكية' : 'EduOS — Smart Education Platform',
    'NAFAS FOR ARTIFICIAL INTELLIGENCE' : 'NAFAS FOR ARTIFICIAL INTELLIGENCE',

    /* ── هيدر / نافبار ── */
    'جارٍ التحميل...'             : 'Loading...',
    'جارٍ التحميل'                : 'Loading',
    'خروج / Logout'               : 'Logout',
    'خروج'                        : 'Logout',
    'الإشعارات / Notifications'   : 'Notifications',
    'الإشعارات'                   : 'Notifications',

    /* ── أدوار ── */
    'معلم/ة · Teacher'            : 'Teacher',
    'معلم/ة'                      : 'Teacher',
    'مدير/ة · Principal'          : 'Principal',
    'مدير/ة'                      : 'Principal',
    'طالب/ة · Student'            : 'Student',
    'طالب/ة'                      : 'Student',
    'ولي/ة الأمر · Parent'        : 'Parent',
    'ولي/ة الأمر'                 : 'Parent',
    'أخصائي/ة · Specialist'       : 'Specialist',
    'أخصائي/ة'                    : 'Specialist',
    'أمن · Security'              : 'Security',
    'أمن'                         : 'Security',
    'ممرض/ة · Nurse'              : 'Nurse',
    'ممرض/ة'                      : 'Nurse',
    'مساعد/ة · Sub Teacher'       : 'Substitute Teacher',
    'مدرب/ة رياضي/ة · Coach'      : 'Sports Coach',
    'مراقب/ة · Observer'          : 'Observer',
    'سكرتير/ة · Secretary'        : 'Secretary',
    'تقني/ة · Technician'         : 'Technician',

    /* ── تاب بار شائعة ── */
    'الرئيسية'         : 'Home',
    'الدرجات'          : 'Grades',
    'الحضور'           : 'Attendance',
    'الجدول'           : 'Schedule',
    'الطلاب'           : 'Students',
    'التقارير'         : 'Reports',
    'الإشعارات'        : 'Notifications',
    'الإعدادات'        : 'Settings',
    'التحليلات'        : 'Analytics',
    'الرسائل'          : 'Messages',
    'المهام'           : 'Tasks',
    'الموارد'          : 'Resources',
    'الفعاليات'        : 'Events',
    'الشارات'          : 'Badges',
    'الاستبيانات'      : 'Surveys',
    'الأنشطة'          : 'Activities',
    'الملف الشخصي'     : 'Profile',
    'الدعم'            : 'Support',
    'الامتحانات'       : 'Exams',
    'المقررات'         : 'Curriculum',
    'التقويم'          : 'Calendar',
    'المكتبة'          : 'Library',
    'الصحة'            : 'Health',
    'المالية'          : 'Finance',

    /* ── أزرار شائعة ── */
    'حفظ'              : 'Save',
    'إلغاء'            : 'Cancel',
    'تأكيد'            : 'Confirm',
    'حذف'              : 'Delete',
    'تعديل'            : 'Edit',
    'إضافة'            : 'Add',
    'بحث'              : 'Search',
    'تصفية'            : 'Filter',
    'تصدير'            : 'Export',
    'استيراد'          : 'Import',
    'طباعة'            : 'Print',
    'رفع'              : 'Upload',
    'تحميل'            : 'Download',
    'تحديث'            : 'Refresh',
    'مزيد'             : 'More',
    'عرض الكل'         : 'View All',
    'التالي'           : 'Next',
    'السابق'           : 'Previous',
    'إغلاق'            : 'Close',
    'موافق'            : 'OK',
    'إرسال'            : 'Submit',
    'استمر'            : 'Continue',
    'رجوع'             : 'Back',
    'نعم'              : 'Yes',
    'لا'               : 'No',

    /* ── حالات / تسميات ── */
    'حاضر/ة'           : 'Present',
    'غائب/ة'           : 'Absent',
    'متأخر/ة'          : 'Late',
    'مبرر'             : 'Excused',
    'غير مبرر'         : 'Unexcused',
    'نشط/ة'            : 'Active',
    'غير نشط/ة'        : 'Inactive',
    'مكتمل'            : 'Completed',
    'معلق'             : 'Pending',
    'مرفوض'            : 'Rejected',
    'موافق عليه'       : 'Approved',
    'ناجح/ة'           : 'Pass',
    'راسب/ة'           : 'Fail',
    'ممتاز'            : 'Excellent',
    'جيد جداً'         : 'Very Good',
    'جيد'              : 'Good',
    'مقبول'            : 'Acceptable',
    'ضعيف'             : 'Weak',

    /* ── فصول / أوقات ── */
    'الفصل الأول'      : 'Term 1',
    'الفصل الثاني'     : 'Term 2',
    'الفصل الثالث'     : 'Term 3',
    'العام الدراسي'    : 'Academic Year',
    'الأسبوع'          : 'Week',
    'اليوم'            : 'Today',
    'أمس'              : 'Yesterday',
    'غداً'             : 'Tomorrow',
    'الأحد'            : 'Sunday',
    'الاثنين'          : 'Monday',
    'الثلاثاء'         : 'Tuesday',
    'الأربعاء'         : 'Wednesday',
    'الخميس'           : 'Thursday',
    'الجمعة'           : 'Friday',
    'السبت'            : 'Saturday',
    'يناير'            : 'January',
    'فبراير'           : 'February',
    'مارس'             : 'March',
    'أبريل'            : 'April',
    'مايو'             : 'May',
    'يونيو'            : 'June',
    'يوليو'            : 'July',
    'أغسطس'            : 'August',
    'سبتمبر'           : 'September',
    'أكتوبر'           : 'October',
    'نوفمبر'           : 'November',
    'ديسمبر'           : 'December',

    /* ── رسائل نظام ── */
    'لا توجد بيانات'           : 'No data available',
    'لا بيانات'                : 'No data',
    'جارٍ التحميل...'          : 'Loading...',
    'خطأ في التحميل'           : 'Loading error',
    'تم الحفظ بنجاح'           : 'Saved successfully',
    'حدث خطأ'                  : 'An error occurred',
    'جلسة منتهية'              : 'Session expired',
    'تسجيل دخول'               : 'Sign in',
    'تسجيل خروج'               : 'Sign out',
    'كلمة المرور'              : 'Password',
    'اسم المستخدم'             : 'Username',
    'البريد الإلكتروني'        : 'Email',

    /* ── منصة - MOTD ── */
    'آية كريمة'                : 'Quranic Verse',
    'حديث شريف'                : 'Noble Hadith',
    'ذكر ودعاء'                : 'Remembrance & Prayer',
    'حكمة'                     : 'Wisdom',
    'شعر'                      : 'Poetry',
    'أخبار EduOS'              : 'EduOS News',

    /* ── حالة المنصة ── */
    'يوم دراسي عادي'           : 'Normal school day',
    'فترة امتحانات'            : 'Exam period',
    'إجازة رسمية'              : 'Official holiday',
    'حدث خاص'                  : 'Special event',
    'تعليم عن بُعد'            : 'Remote learning day',
    'طوارئ'                    : 'Emergency',
    'تفعيل يوم تعليم عن بُعد' : 'Activate remote learning day',
    'إلغاء يوم البُعد'         : 'Cancel remote day',
    'حاضر من البيت'            : 'Present from home',
    'يوم تعليم عن بُعد 🏠'     : 'Remote Learning Day 🏠',

    /* ── شريط أخبار ── */
    'حضور مرن للطلاب 16–23 يونيو — وزارة التربية والتعليم'
      : 'Flexible attendance Jun 16–23 — Ministry of Education',
    'جدول الامتحانات النهائية للصفوف 5–12 معتمد رسمياً'
      : 'Final exam schedule Grades 5–12 officially approved',
    'نهاية العام الدراسي 2025–2026: 3 يوليو 2026'
      : 'End of Academic Year 2025–2026: July 3, 2026',
    'التقويم الأكاديمي 2026–2027 — بداية العام الجامعي: 31 أغسطس 2026'
      : 'Academic Calendar 2026–2027 — New year starts: Aug 31, 2026',
    'سوق الذكاء الاصطناعي في التعليم يرتفع إلى 57 مليار دولار بحلول 2033'
      : 'AI in Education market projected to reach $57B by 2033',
    'الإمارات تتصدر دمج الذكاء الاصطناعي في التعليم على مستوى المنطقة'
      : 'UAE leads AI integration in education across the region',
    'تذكير: مراجعة بيانات الحضور قبل نهاية الفصل الدراسي'
      : 'Reminder: Review attendance records before end of term',
    'برنامج تطوير المعلم المهني — التسجيل مفتوح حتى نهاية الشهر'
      : 'Professional Teacher Development — Registration open until month end',

    /* ── VARK بانر ── */
    'لم تُكمل/ي استبيان VARK بعد — اعرف/ي أسلوبك في التعلم واحصل/ي على توصيات مخصصة!'
      : 'You haven\'t completed the VARK survey yet — discover your learning style and get personalized recommendations!',
    'أكمل/ي الاستبيان الآن ← Complete VARK Survey'
      : 'Complete the survey now → Complete VARK Survey',
  };

  /* ─────────────────────────────────────────────────────────────
   * الحالة الداخلية
   * ──────────────────────────────────────────────────────────── */
  let _lang = 'ar';
  try { _lang = sessionStorage.getItem(STORAGE_KEY) || 'ar'; } catch (e) {}

  /* ─────────────────────────────────────────────────────────────
   * تطبيق اللغة على عناصر data-ar / data-en
   * ──────────────────────────────────────────────────────────── */
  function applyAttributes(lang) {
    const isEn = lang === 'en';
    document.querySelectorAll('[data-ar]').forEach(el => {
      const ar = el.getAttribute('data-ar');
      const en = el.getAttribute('data-en') || ar;
      el.textContent = isEn ? en : ar;
      if (el.tagName !== 'BUTTON') {
        el.style.direction = isEn ? 'ltr' : 'rtl';
      }
    });
    document.querySelectorAll('[data-ar-html]').forEach(el => {
      const ar = el.getAttribute('data-ar-html');
      const en = el.getAttribute('data-en-html') || ar;
      el.innerHTML = isEn ? en : ar;
    });
    document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
      el.placeholder = isEn
        ? (el.getAttribute('data-en-placeholder') || el.getAttribute('data-ar-placeholder'))
        : el.getAttribute('data-ar-placeholder');
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * ترجمة نصوص ثابتة عبر القاموس (text nodes scan)
   * يعمل مع الإعلانات الثابتة التي لم تُحوَّل لـ data-ar بعد
   * ──────────────────────────────────────────────────────────── */
  // نحفظ النصوص الأصلية عند أول تشغيل
  const _originals = new WeakMap();

  function snapshotTextNodes(root) {
    const walker = document.createTreeWalker(
      root || document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          // تجاهل السكريبت والستايل والتعليقات
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = p.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'PRE')
            return NodeFilter.FILTER_REJECT;
          // فقط النصوص التي تحتوي على حروف عربية
          if (/[\u0600-\u06FF]/.test(node.nodeValue)) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function applyDictionary(lang) {
    if (lang === 'ar') {
      // استعادة النصوص الأصلية
      _originals.forEach((orig, node) => {
        if (node.parentNode) node.nodeValue = orig;
      });
      return;
    }
    // ترجمة EN — نفحص النصوص الحالية
    const nodes = snapshotTextNodes(document.body);
    nodes.forEach(node => {
      if (!_originals.has(node)) _originals.set(node, node.nodeValue);
      let val = node.nodeValue;
      // نبحث عن كل مدخل في القاموس ونستبدله
      Object.entries(DICT).forEach(([ar, en]) => {
        if (val.includes(ar)) {
          val = val.split(ar).join(en);
        }
      });
      node.nodeValue = val;
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * تحديث اتجاه الصفحة ورقم اللغة
   * ──────────────────────────────────────────────────────────── */
  function applyDocumentLang(lang) {
    const isEn = lang === 'en';
    document.documentElement.lang = isEn ? 'en' : 'ar';
    // لا نُغيِّر dir للصفحة كلها — كل عنصر يُدار بنفسه
    // (لأن بعض الصفحات تعتمد على dir:rtl في CSS)
  }

  /* ─────────────────────────────────────────────────────────────
   * تحديث زر اللغة في كل الصفحات
   * ──────────────────────────────────────────────────────────── */
  function updateLangBtns(lang) {
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.textContent = lang === 'en' ? '🌐 العربية' : '🌐 English';
      btn.title = lang === 'en' ? 'تغيير إلى العربية' : 'Switch to English';
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * حقن زر اللغة في الهيدر تلقائياً
   * ──────────────────────────────────────────────────────────── */
  function injectLangBtn() {
    // تجنب التكرار
    if (document.querySelector('[data-lang-toggle]')) return;

    const target =
      document.querySelector('.header-right') ||
      document.querySelector('.header-actions') ||
      document.querySelector('#headerRight') ||
      document.querySelector('header');

    if (!target) return;

    const btn = document.createElement('button');
    btn.setAttribute('data-lang-toggle', '1');
    btn.title = _lang === 'en' ? 'تغيير إلى العربية' : 'Switch to English';
    btn.textContent = _lang === 'en' ? '🌐 العربية' : '🌐 English';
    btn.style.cssText = `
      font-family: 'Tajawal', Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1.5px solid var(--indigo, #6366f1);
      background: transparent;
      color: var(--indigo, #6366f1);
      cursor: pointer;
      transition: all .2s;
      letter-spacing: .3px;
      white-space: nowrap;
    `;
    btn.onmouseover = () => {
      btn.style.background = 'var(--indigo, #6366f1)';
      btn.style.color = '#fff';
    };
    btn.onmouseout = () => {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--indigo, #6366f1)';
    };
    btn.onclick = () => toggle();

    // نُدرج الزر قبل زر الخروج إن وُجد
    const logoutBtn = target.querySelector('.logout-btn, [onclick*="Logout"], [onclick*="doLogout"]');
    if (logoutBtn) {
      target.insertBefore(btn, logoutBtn);
    } else {
      target.appendChild(btn);
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * وظيفة setLang الرئيسية — تُغيِّر كل شيء
   * ──────────────────────────────────────────────────────────── */
  function setLang(lang) {
    _lang = lang;
    try { sessionStorage.setItem(STORAGE_KEY, lang); } catch (e) {}

    applyDocumentLang(lang);
    applyAttributes(lang);
    applyDictionary(lang);
    updateLangBtns(lang);

    // أطلق الحدث لكل المكونات الديناميكية (MOTD, news ticker, إلخ)
    window.dispatchEvent(new CustomEvent('eduos-lang-change', { detail: { lang } }));
  }

  function toggle() {
    setLang(_lang === 'ar' ? 'en' : 'ar');
  }

  /* ─────────────────────────────────────────────────────────────
   * MutationObserver — يُطبِّق الترجمة على المحتوى الديناميكي
   * ──────────────────────────────────────────────────────────── */
  let _mutationTimer = null;
  const observer = new MutationObserver(() => {
    if (_lang === 'en') {
      clearTimeout(_mutationTimer);
      _mutationTimer = setTimeout(() => {
        applyAttributes('en');
        applyDictionary('en');
      }, 120);
    }
  });

  /* ─────────────────────────────────────────────────────────────
   * تهيئة عند تحميل DOM
   * ──────────────────────────────────────────────────────────── */
  function init() {
    injectLangBtn();
    observer.observe(document.body, { childList: true, subtree: true });
    if (_lang === 'en') {
      setLang('en'); // طبِّق الترجمة المحفوظة
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ─────────────────────────────────────────────────────────────
   * الواجهة العامة
   * ──────────────────────────────────────────────────────────── */
  return {
    get current() { return _lang; },
    setLang,
    toggle,
    t(ar, en) { return _lang === 'en' ? en : ar; },
    isEn() { return _lang === 'en'; },
    addToDict(ar, en) { DICT[ar] = en; },
  };

})();
