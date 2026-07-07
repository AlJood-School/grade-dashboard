/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS Platform Language Engine  v2.0  (2026-07-03)
 *  ─────────────────────────────────────────────────────────────
 *  • يُغيِّر كل حرف وكل كلمة وكل جملة — بلا استثناء
 *  • خوارزمية v2: لا استبدال جزئي — لا تلف في الكلمات
 *  • طبقات الترجمة بالترتيب:
 *     1. data-ar / data-en attributes
 *     2. مطابقة نص كاملة من القاموس (EXACT)
 *     3. فصل نمط "عربي / English" — يبقى الجزء الإنجليزي فقط
 *     4. استبدال بحدود الكلمة (lookbehind/lookahead regex)
 *  • يُطلق حدث eduos-lang-change عند كل تغيير
 * ═══════════════════════════════════════════════════════════════
 */

window.EduLang = (function () {

  const STORAGE_KEY = 'eduos_lang';

  /* ─────────────────────────────────────────────────────────────
   * القاموس — نصوص ثابتة (فقط للمطابقة الكاملة أو الكلمات المستقلة)
   * ──────────────────────────────────────────────────────────── */
  const DICT = {
    /* ── هوية المنصة ── */
    'بوابة الجود الذكية'               : 'Al-Jood Smart Portal',
    'منصة EduOS'                        : 'EduOS Platform',
    'EduOS — منصة التعليم الذكية'      : 'EduOS — Smart Education Platform',
    'NAFAS FOR ARTIFICIAL INTELLIGENCE' : 'NAFAS FOR ARTIFICIAL INTELLIGENCE',
    'جميع الحقوق محفوظة'               : 'All rights reserved',
    'رخصة'                             : 'License',

    /* ── هيدر ── */
    'جارٍ التحميل...'                  : 'Loading...',
    'جارٍ التحميل'                     : 'Loading',
    'خروج'                             : 'Logout',
    'الإشعارات'                        : 'Notifications',
    'أبلغ عن مشكلة تقنية'             : 'Report Technical Issue',

    /* ── أدوار ── */
    'معلم/ة'                    : 'Teacher',
    'مدير/ة'                    : 'Principal',
    'طالب/ة'                    : 'Student',
    'ولي/ة الأمر'               : 'Parent',
    'أخصائي/ة'                  : 'Specialist',
    'أمن'                       : 'Security',
    'ممرض/ة'                    : 'Nurse',
    'مساعد/ة'                   : 'Substitute Teacher',
    'مدرب/ة رياضي/ة'            : 'Sports Coach',
    'مراقب/ة'                   : 'Observer',
    'سكرتير/ة'                  : 'Secretary',
    'تقني/ة'                    : 'Technician',
    'مسؤول/ة'                   : 'Official',

    /* ── تاب بار ── */
    'الرئيسية'       : 'Home',
    'الدرجات'        : 'Grades',
    'الحضور'         : 'Attendance',
    'الجدول'         : 'Schedule',
    'الطلاب'         : 'Students',
    'التقارير'       : 'Reports',
    'الإعدادات'      : 'Settings',
    'التحليلات'      : 'Analytics',
    'الرسائل'        : 'Messages',
    'المهام'         : 'Tasks',
    'الموارد'        : 'Resources',
    'الفعاليات'      : 'Events',
    'الشارات'        : 'Badges',
    'الاستبيانات'    : 'Surveys',
    'الأنشطة'        : 'Activities',
    'الملف الشخصي'   : 'Profile',
    'الدعم'          : 'Support',
    'الامتحانات'     : 'Exams',
    'المقررات'       : 'Curriculum',
    'التقويم'        : 'Calendar',
    'المكتبة'        : 'Library',
    'الصحة'          : 'Health',
    'المالية'        : 'Finance',

    /* ── أزرار ── */
    'حفظ'            : 'Save',
    'إلغاء'          : 'Cancel',
    'تأكيد'          : 'Confirm',
    'حذف'            : 'Delete',
    'تعديل'          : 'Edit',
    'إضافة'          : 'Add',
    'بحث'            : 'Search',
    'تصفية'          : 'Filter',
    'تصدير'          : 'Export',
    'استيراد'        : 'Import',
    'طباعة'          : 'Print',
    'رفع'            : 'Upload',
    'تحميل'          : 'Download',
    'تحديث'          : 'Refresh',
    'عرض الكل'       : 'View All',
    'التالي'         : 'Next',
    'السابق'         : 'Previous',
    'إغلاق'          : 'Close',
    'موافق'          : 'OK',
    'إرسال'          : 'Submit',
    'استمر'          : 'Continue',
    'رجوع'           : 'Back',

    /* ── حالات ── */
    'حاضر/ة'         : 'Present',
    'غائب/ة'         : 'Absent',
    'متأخر/ة'        : 'Late',
    'مبرر'           : 'Excused',
    'غير مبرر'       : 'Unexcused',
    'نشط/ة'          : 'Active',
    'غير نشط/ة'      : 'Inactive',
    'مكتمل'          : 'Completed',
    'معلق'           : 'Pending',
    'مرفوض'          : 'Rejected',
    'موافق عليه'     : 'Approved',
    'ناجح/ة'         : 'Pass',
    'راسب/ة'         : 'Fail',
    'ممتاز'          : 'Excellent',
    'جيد جداً'       : 'Very Good',
    'جيد'            : 'Good',
    'مقبول'          : 'Acceptable',
    'ضعيف'           : 'Weak',

    /* ── فصول / زمن ── */
    'الفصل الأول'    : 'Term 1',
    'الفصل الثاني'   : 'Term 2',
    'الفصل الثالث'   : 'Term 3',
    'العام الدراسي'  : 'Academic Year',
    'الأسبوع'        : 'Week',
    'اليوم'          : 'Today',
    'أمس'            : 'Yesterday',
    'غداً'           : 'Tomorrow',
    'الأحد'          : 'Sunday',
    'الاثنين'        : 'Monday',
    'الثلاثاء'       : 'Tuesday',
    'الأربعاء'       : 'Wednesday',
    'الخميس'         : 'Thursday',
    'الجمعة'         : 'Friday',
    'السبت'          : 'Saturday',
    'يناير'          : 'January',
    'فبراير'         : 'February',
    'مارس'           : 'March',
    'أبريل'          : 'April',
    'مايو'           : 'May',
    'يونيو'          : 'June',
    'يوليو'          : 'July',
    'أغسطس'          : 'August',
    'سبتمبر'         : 'September',
    'أكتوبر'         : 'October',
    'نوفمبر'         : 'November',
    'ديسمبر'         : 'December',

    /* ── رسائل نظام ── */
    'لا توجد بيانات'           : 'No data available',
    'لا بيانات'                : 'No data',
    'خطأ في التحميل'           : 'Loading error',
    'تم الحفظ بنجاح'           : 'Saved successfully',
    'حدث خطأ'                  : 'An error occurred',
    'جلسة منتهية'              : 'Session expired',
    'كلمة المرور'              : 'Password',
    'اسم المستخدم'             : 'Username',
    'البريد الإلكتروني'        : 'Email',
    'كل شيء بخير'              : 'All good',

    /* ── تقارير ── */
    'تقرير الحضور'             : 'Attendance Report',
    'تقرير الدرجات'            : 'Grades Report',
    'تقرير السلوك'             : 'Behavior Report',
    'تقرير الطالب'             : 'Student Report',
    'تقرير المعلم'             : 'Teacher Report',
    'تقرير المدرسة'            : 'School Report',
    'تقرير الأداء'             : 'Performance Report',
    'تقرير أسبوعي'             : 'Weekly Report',
    'تقرير شهري'               : 'Monthly Report',
    'توليد تقرير'              : 'Generate Report',
    'تقرير'                    : 'Report',
    'النسبة% / %'              : '%',
    'النسبة%'                  : 'Att%',
    'نسبة الحضور'              : 'Attendance Rate',
    'نسبة'                     : 'Rate',
    'سجّل/ت'                   : 'Registered',
    'سجّل'                     : 'Registered',
    'جارٍ توليد تقرير'         : 'Generating report',
    'انتقل لصفحة التقارير'     : 'Go to reports page',
    'تم توليد التقرير'         : 'Report generated',

    /* ── Quick Actions ── */
    'تسجيل اليوم'              : 'Record Today',
    'ابدأ الآن'                : 'Start Now',
    'تقييم فوري'               : 'Quick Assessment',
    'نقاط وجوائز'              : 'Points & Rewards',
    'تواصل مع الأهل'           : 'Contact Parents',
    'جدول ومتابعة'             : 'Schedule & Track',
    'تطويري المهني'            : 'My Professional Dev',
    'جدول اللقاءات'            : 'Meeting Schedule',
    'إجراءات سريعة'            : 'Quick Actions',
    'جدولي اليوم'              : 'My Schedule Today',
    'لا حصص اليوم'             : 'No classes today',
    'لا حصص'                   : 'No classes',
    'متطلبات معلّقة'           : 'Pending Tasks',
    'تنبيهات الطلاب'           : 'Student Alerts',
    'الحضور اليوم'             : 'Today\'s Attendance',
    'إجمالي الطلاب'            : 'Total Students',

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
    'تعليم عن بُعد'            : 'Remote learning',
    'تعليم عن بُعد 🏠'         : 'Remote Learning 🏠',
    'يوم تعليم عن بُعد 🏠'     : 'Remote Learning Day 🏠',
    'طوارئ'                    : 'Emergency',
    'حاضر من البيت'            : 'Present from home',
    'تفعيل يوم تعليم عن بُعد' : 'Activate remote learning day',
    'إلغاء يوم البُعد'         : 'Cancel remote day',

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
    'مساء الخير'               : 'Good Afternoon',
    'صباح الخير'               : 'Good Morning',
    'مساء النور'               : 'Good Evening',
    'يوم موفق'                 : 'Have a great day',
    'يوم موفق إن شاء الله'    : 'Have a great day, God willing',

    /* ── VARK ── */
    'لم تُكمل/ي استبيان VARK بعد — اعرف/ي أسلوبك في التعلم واحصل/ي على توصيات مخصصة!'
      : 'You haven\'t completed the VARK survey yet — discover your learning style and get personalized recommendations!',

    /* ── وقت ── */
    'اليوم / Today'           : 'Today',
    'أسبوع'                   : 'Week',
    'شهر'                     : 'Month',
    'سنة'                     : 'Year',
    'العام'                   : 'Year',
    'الفصل الدراسي'           : 'Term',
    'الفصل'                   : 'Term',
    'الحصة الحالية'           : 'Current Period',
    'الحصة'                   : 'Period',
    'الفترة'                   : 'Period',
  };

  /* ─────────────────────────────────────────────────────────────
   * ترتيب القاموس: الأطول أولاً (يمنع الاستبدال الجزئي)
   * ──────────────────────────────────────────────────────────── */
  const SORTED_DICT = Object.entries(DICT).sort((a, b) => b[0].length - a[0].length);

  /* ─────────────────────────────────────────────────────────────
   * الحالة الداخلية
   * ──────────────────────────────────────────────────────────── */
  let _lang = 'ar';
  try { _lang = sessionStorage.getItem(STORAGE_KEY) || 'ar'; } catch (e) {}

  /* ─────────────────────────────────────────────────────────────
   * data-ar / data-en attributes
   * ──────────────────────────────────────────────────────────── */
  function applyAttributes(lang) {
    const isEn = lang === 'en';
    document.querySelectorAll('[data-ar]').forEach(el => {
      const ar = el.getAttribute('data-ar');
      const en = el.getAttribute('data-en') || ar;
      el.textContent = isEn ? en : ar;
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
   * STEP 1 — مطابقة نص كاملة من القاموس
   * إذا كان محتوى الـ node كاملاً = مدخل في القاموس → استبدل
   * ──────────────────────────────────────────────────────────── */
  function matchExact(text) {
    const t = text.trim();
    if (DICT[t]) return text.replace(t, DICT[t]);
    return null; // لا مطابقة
  }

  /* ─────────────────────────────────────────────────────────────
   * STEP 2 — فصل نمط "عربي / English"
   * "بطاقة الخروج / Exit Ticket" → "Exit Ticket"
   * "مساء الخير 🌤️ / Good Afternoon" → "Good Afternoon"
   * ──────────────────────────────────────────────────────────── */
  function extractEnFromBilingual(text) {
    // يشترط وجود عربي AND " / " AND إنجليزي
    if (!/[\u0600-\u06FF]/.test(text)) return null;
    if (!text.includes(' / ')) return null;

    const parts = text.split(' / ');
    if (parts.length < 2) return null;

    // نبحث من اليمين عن آخر تقسيم بحيث الجانب الأيسر يحتوي عربي والأيمن يحتوي لاتيني
    for (let i = parts.length - 1; i >= 1; i--) {
      const leftSide  = parts.slice(0, i).join(' / ');
      const rightSide = parts.slice(i).join(' / ');
      if (/[\u0600-\u06FF]/.test(leftSide) && /[a-zA-Z]/.test(rightSide)) {
        return rightSide.trim();
      }
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────
   * STEP 3 — استبدال بحدود الكلمة (آمن — لا تلف)
   * يستخدم lookbehind/lookahead لمنع الاستبدال داخل الكلمات
   * ──────────────────────────────────────────────────────────── */
  // هل المتصفح يدعم lookbehind؟
  let _supportsLookbehind = false;
  try { new RegExp('(?<![\\u0600-\\u06FF])x'); _supportsLookbehind = true; } catch (e) {}

  function applyWordBoundary(text) {
    if (!/[\u0600-\u06FF]/.test(text)) return text; // لا عربي
    let val = text;
    for (const [ar, en] of SORTED_DICT) {
      if (!val.includes(ar)) continue;
      try {
        if (_supportsLookbehind) {
          const escaped = ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // الكلمة يجب أن لا تكون مسبوقة أو متبوعة بحرف عربي
          const rex = new RegExp(
            '(?<![\\u0600-\\u06FF\\u0660-\\u0669])' + escaped +
            '(?![\\u0600-\\u06FF\\u0660-\\u0669])', 'g'
          );
          val = val.replace(rex, en);
        } else {
          // Fallback: استبدال كامل النص فقط إذا كانت الكلمة هي كل النص
          const t = val.trim();
          if (t === ar) { val = val.replace(ar, en); }
        }
      } catch (e) { /* تجاهل الخطأ */ }
      if (!/[\u0600-\u06FF]/.test(val)) break;
    }
    return val;
  }

  /* ─────────────────────────────────────────────────────────────
   * المحرك الرئيسي: يُطبِّق الطبقات الثلاث على TextNode
   * ──────────────────────────────────────────────────────────── */
  function translateTextNode(text) {
    if (!/[\u0600-\u06FF]/.test(text)) return text; // لا عربي = لا تغيير

    // 1. مطابقة كاملة
    const exact = matchExact(text);
    if (exact !== null) return exact;

    // 2. فصل "AR / EN"
    const bilingualEn = extractEnFromBilingual(text);
    if (bilingualEn !== null) return bilingualEn;

    // 3. استبدال بحدود الكلمة
    return applyWordBoundary(text);
  }

  /* ─────────────────────────────────────────────────────────────
   * جمع TextNodes التي تحتوي عربي
   * ──────────────────────────────────────────────────────────── */
  const _originals = new WeakMap();

  function snapshotTextNodes(root) {
    const walker = document.createTreeWalker(
      root || document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = p.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'PRE')
            return NodeFilter.FILTER_REJECT;
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

  /* ─────────────────────────────────────────────────────────────
   * تطبيق القاموس
   * ──────────────────────────────────────────────────────────── */
  function applyDictionary(lang) {
    if (lang === 'ar') {
      _originals.forEach((orig, node) => {
        if (node.parentNode) node.nodeValue = orig;
      });
      return;
    }
    const nodes = snapshotTextNodes(document.body);
    nodes.forEach(node => {
      if (!_originals.has(node)) _originals.set(node, node.nodeValue);
      const translated = translateTextNode(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * اتجاه الصفحة
   * ──────────────────────────────────────────────────────────── */
  function applyDocumentLang(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'ar';
  }

  /* ─────────────────────────────────────────────────────────────
   * تحديث أزرار اللغة
   * ──────────────────────────────────────────────────────────── */
  function updateLangBtns(lang) {
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.textContent = lang === 'en' ? '🌐 العربية' : '🌐 English';
      btn.title = lang === 'en' ? 'تغيير إلى العربية' : 'Switch to English';
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * حقن زر اللغة في الهيدر
   * ──────────────────────────────────────────────────────────── */
  function injectLangBtn() {
    if (document.querySelector('[data-lang-toggle]')) return;

    const target =
      document.querySelector('.header-right') ||
      document.querySelector('.header-actions') ||
      document.querySelector('#headerRight') ||
      document.querySelector('.top-actions') ||
      document.querySelector('header');

    if (!target) return;

    const btn = document.createElement('button');
    btn.setAttribute('data-lang-toggle', '1');
    btn.title = _lang === 'en' ? 'تغيير إلى العربية' : 'Switch to English';
    btn.textContent = _lang === 'en' ? '🌐 العربية' : '🌐 English';
    btn.className = 'edu-lang-btn';
    btn.style.cssText = `
      font-family: 'Tajawal', Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1.5px solid var(--brand, #6C3DD6);
      background: transparent;
      color: var(--brand, #6C3DD6);
      cursor: pointer;
      transition: all .2s;
      letter-spacing: .3px;
      white-space: nowrap;
      margin: 0 4px;
    `;
    btn.onmouseover = () => { btn.style.background = 'var(--brand,#6C3DD6)'; btn.style.color = '#fff'; };
    btn.onmouseout  = () => { btn.style.background = 'transparent'; btn.style.color = 'var(--brand,#6C3DD6)'; };
    btn.onclick = () => toggle();

    const logoutBtn = target.querySelector(
      '.logout-btn, [onclick*="Logout"], [onclick*="doLogout"], [data-logout]'
    );
    if (logoutBtn) target.insertBefore(btn, logoutBtn);
    else           target.appendChild(btn);
  }

  /* ─────────────────────────────────────────────────────────────
   * setLang — الوظيفة الرئيسية
   * ──────────────────────────────────────────────────────────── */
  function setLang(lang) {
    _lang = lang;
    try { sessionStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyDocumentLang(lang);
    applyAttributes(lang);
    applyDictionary(lang);
    updateLangBtns(lang);
    window.dispatchEvent(new CustomEvent('eduos-lang-change', { detail: { lang } }));
  }

  function toggle() { setLang(_lang === 'ar' ? 'en' : 'ar'); }

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
      }, 150);
    }
  });

  /* ─────────────────────────────────────────────────────────────
   * تهيئة
   * ──────────────────────────────────────────────────────────── */
  function init() {
    injectLangBtn();
    observer.observe(document.body, { childList: true, subtree: true });
    if (_lang === 'en') setLang('en');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM جاهز — ننتظر لحظة لتحميل بقية السكريبتات
    setTimeout(init, 50);
  }

  return { setLang, toggle, getLang: () => _lang };

})();

/* ═══════════════════════════════════════════════════════════════
 * eduosLogout — دالة الخروج الموحّدة لكل الصفحات
 * الاستخدام: eduosLogout() من أي صفحة
 * ══════════════════════════════════════════════════════════════ */
window.eduosLogout = function() {
  sessionStorage.removeItem('edoos_user');
  // Find login page relative to current location
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  const prefix = depth > 1 ? '../'.repeat(depth - 1) : './';
  // Try common paths
  const candidates = [
    prefix + 'eduos-login/index.html?bye=manual',
    '../eduos-login/index.html?bye=manual',
    '/apps/eduos-login/index.html?bye=manual',
    'index.html?bye=manual'
  ];
  // Navigate to first candidate (always use relative path)
  window.location.href = '../eduos-login/index.html?bye=manual';
};
