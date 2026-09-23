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
    btn.setAttribute('data-tooltip', 'تغيير لغة الواجهة');
    // كشف ثيم الصفحة: داكن أم فاتح؟
    function detectDark() {
      const bg = getComputedStyle(document.body).backgroundColor || '';
      // استخرج RGB
      const m = bg.match(/\d+/g);
      if (m && m.length >= 3) {
        const lum = (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]);
        return lum < 128;
      }
      // fallback: تحقق من متغير CSS أو data-theme
      const theme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || '';
      return !theme.includes('light');
    }
    function applyBtnTheme() {
      const dark = detectDark();
      const txtColor = dark ? '#fff' : '#1E293B';
      const borderColor = dark ? 'rgba(255,255,255,0.65)' : 'rgba(30,41,59,0.4)';
      btn.style.color = txtColor;
      btn.style.borderColor = borderColor;
    }
    applyBtnTheme();

    btn.style.cssText = `
      font-family: 'Tajawal', Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1.5px solid rgba(255,255,255,0.65);
      background: transparent;
      color: #fff;
      cursor: pointer;
      transition: all .2s;
      letter-spacing: .3px;
      white-space: nowrap;
      margin: 0 4px;
    `;
    // طبّق اللون الصحيح بعد تعيين cssText (يُعيد الضبط)
    applyBtnTheme();
    btn.onmouseover = () => { const dark = detectDark(); btn.style.background = dark ? 'rgba(255,255,255,0.18)' : 'rgba(30,41,59,0.08)'; };
    btn.onmouseout  = () => { btn.style.background = 'transparent'; applyBtnTheme(); };
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
  /* ─────────────────────────────────────────────────────────────
   * نظام Tooltip الشامل — يُطبَّق على كل عنصر بـ data-tooltip
   * يعمل تلقائياً على الأيقونات القادمة من platform-*.js
   * ──────────────────────────────────────────────────────────── */
  function injectTooltipSystem() {
    if (document.getElementById('eduos-tooltip-style')) return;
    const s = document.createElement('style');
    s.id = 'eduos-tooltip-style';
    s.textContent = `
      .eduos-has-tooltip { position: relative !important; }
      .eduos-has-tooltip .eduos-tip {
        display: none;
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15,23,42,0.92);
        color: #fff;
        padding: 5px 11px;
        border-radius: 8px;
        font-size: 12px;
        font-family: 'Tajawal', Arial, sans-serif;
        white-space: nowrap;
        pointer-events: none;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        direction: rtl;
      }
      .eduos-has-tooltip .eduos-tip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: rgba(15,23,42,0.92);
      }
      .eduos-has-tooltip:hover .eduos-tip { display: block !important; }
    `;
    document.head.appendChild(s);

    // ربط الـ tooltip بكل عناصر data-tooltip في الصفحة
    function bindTooltips() {
      document.querySelectorAll('[data-tooltip]').forEach(function(el) {
        if (el.dataset.tooltipBound) return;
        el.dataset.tooltipBound = '1';
        el.classList.add('eduos-has-tooltip');
        const tip = document.createElement('span');
        tip.className = 'eduos-tip';
        tip.textContent = el.getAttribute('data-tooltip');
        el.appendChild(tip);
      });
    }

    bindTooltips();
    // مراقب: يُضيف الـ tooltip تلقائياً لأي عنصر جديد
    var tipObserver = new MutationObserver(function() {
      clearTimeout(window._tipRebindTimer);
      window._tipRebindTimer = setTimeout(bindTooltips, 200);
    });
    tipObserver.observe(document.body, { childList: true, subtree: true });
  }


  /* ─────────────────────────────────────────────────────────────
   * injectHeaderTools — يضيف اسم المستخدم و header-tools تلقائياً
   * يعمل على كل صفحة تحمّل platform-lang.js بدون تعديل الصفحة
   * ──────────────────────────────────────────────────────────── */
  function injectHeaderTools() {
    var path = window.location.pathname;
    var skip = ['login','set-password','forgot','landing','pitch','welcome','demo','offline','showcase','change-password'];
    if (skip.some(function(s){return path.includes(s);})) return;
    var hdr = document.querySelector('header, .hdr');
    if (!hdr) return;

    // 1. عرض badge المستخدم
    if (!hdr.querySelector('[data-user-display]')) {
      try {
        var u = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
        var name = u.username || u.name || '';
        var rk = u.role_key || u.role || '';
        var roleMap = {teacher:'معلم/ة',principal:'مدير/ة',vice_principal:'نائب/ة مدير/ة',admin:'مسؤول/ة',coach:'مدرب/ة',counselor:'مرشد/ة',specialist:'أخصائي/ة',nurse:'ممرض/ة',security:'أمن',secretary:'سكرتير/ة',technician:'تقني/ة',registrar:'مسجّلة',financial_coordinator:'منسق/ة مالية',coordinator:'منسق/ة'};
        var roleLabel = roleMap[rk] || rk;
        if (name) {
          var badge = document.createElement('div');
          badge.setAttribute('data-user-display','1');
          badge.style.cssText = 'display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.15);border-radius:20px;padding:4px 10px 4px 6px;margin:0 4px;flex-shrink:0;cursor:default;';
          var initial = (name[0]||'م').toUpperCase();
          badge.innerHTML = '<div style="width:28px;height:28px;background:rgba(255,255,255,0.25);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.82rem;flex-shrink:0;">'+initial+'</div><div style="line-height:1.2;"><div style="color:#fff;font-size:0.78rem;font-weight:700;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+name+'</div><div style="color:rgba(255,255,255,0.75);font-size:0.63rem;">'+roleLabel+'</div></div>';
          hdr.insertBefore(badge, hdr.firstChild);
        }
      } catch(e) {}
    }

    // 2. إنشاء header-tools
    if (!document.getElementById('header-tools')) {
      var tools = document.createElement('div');
      tools.id = 'header-tools';
      tools.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var langBtn = hdr.querySelector('[data-lang-toggle]');
      var btns = Array.from(hdr.querySelectorAll('button'));
      var logoutBtn = btns.find(function(b){return b.textContent.includes('خروج')||b.textContent.includes('Logout')||(b.getAttribute('onclick')||'').includes('ogout');});
      var insertBefore = langBtn || logoutBtn || null;
      if (insertBefore) hdr.insertBefore(tools, insertBefore);
      else hdr.appendChild(tools);
    }

    // 2b. زر تغيير كلمة المرور — retry loop حتى يتأكد من وجود #header-tools
    (function tryAddPwdBtn(attempts) {
      attempts = attempts || 0;
      if (attempts > 12) return; // max 6 seconds
      var ht = document.getElementById('header-tools');
      if (!ht) { setTimeout(function(){ tryAddPwdBtn(attempts+1); }, 500); return; }
      if (ht.querySelector('[data-change-pwd]')) return;
      try {
        var su = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
        if (!su.username) { setTimeout(function(){ tryAddPwdBtn(attempts+1); }, 500); return; }
      } catch(e) { return; }
      var cpBtn = document.createElement('button');
      cpBtn.setAttribute('data-change-pwd', '1');
      cpBtn.title = 'تغيير كلمة المرور';
      cpBtn.innerHTML = '🔐';
      cpBtn.style.cssText = 'width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.12);color:#fff;cursor:pointer;font-size:14px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s;';
      cpBtn.onmouseover = function(){this.style.background='rgba(255,255,255,0.22)';};
      cpBtn.onmouseout = function(){this.style.background='rgba(255,255,255,0.12)';};
      cpBtn.onclick = function() { window.location.href = '../eduos-change-password/'; };
      ht.appendChild(cpBtn);
    })(0);

    // 3. فقاعة الأسبوع + الوقت الحي في المنتصف
    if (!hdr.querySelector('[data-center-info]')) {
      // CSS animation للنبضة
      if (!document.getElementById('_eduos_hdr_anim')) {
        var s = document.createElement('style');
        s.id = '_eduos_hdr_anim';
        s.textContent = '@keyframes _eduosPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.82)}}';
        document.head.appendChild(s);
      }
      // الهيدر يحتاج position:relative
      if (getComputedStyle(hdr).position === 'static') hdr.style.position = 'relative';

      var center = document.createElement('div');
      center.setAttribute('data-center-info','1');
      center.style.cssText = 'display:flex;align-items:center;gap:8px;position:absolute;left:50%;transform:translateX(-50%);top:50%;margin-top:-16px;pointer-events:none;z-index:2;';

      // فقاعة الأسبوع
      var wb = document.createElement('div');
      wb.setAttribute('data-week-badge','1');
      wb.style.cssText = 'background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:20px;padding:5px 14px;display:flex;align-items:center;gap:6px;pointer-events:auto;';
      var dot = document.createElement('div');
      dot.style.cssText = 'width:8px;height:8px;background:#4ade80;border-radius:50%;box-shadow:0 0 6px #4ade80;flex-shrink:0;animation:_eduosPulse 2s infinite;';
      var wl = document.createElement('span');
      wl.setAttribute('data-week-label','1');
      wl.style.cssText = 'color:#fff;font-size:13px;font-weight:600;font-family:Tajawal,Arial,sans-serif;white-space:nowrap;';
      wl.textContent = '...';
      wb.appendChild(dot); wb.appendChild(wl);

      // الوقت الحي
      var tb = document.createElement('div');
      tb.style.cssText = 'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:10px;padding:4px 10px;display:flex;align-items:center;gap:5px;pointer-events:auto;';
      var tspan = document.createElement('span');
      tspan.setAttribute('data-live-time','1');
      tspan.style.cssText = 'color:#fff;font-size:13px;font-weight:700;font-family:Tajawal,Arial,sans-serif;font-variant-numeric:tabular-nums;';
      tspan.textContent = '--:--';
      tb.innerHTML = '<span style="font-size:13px;">&#128336;</span>';
      tb.appendChild(tspan);

      center.appendChild(wb); center.appendChild(tb);
      hdr.appendChild(center);

      // تحديث الوقت كل ثانية
      (function tickTime() {
        var el = hdr.querySelector('[data-live-time]');
        if (!el) return;
        var n = new Date();
        el.textContent = String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
        setTimeout(tickTime, 1000);
      })();

      // تحديث الأسبوع من platform-week.js
      (function updateWeek() {
        var lbl = hdr.querySelector('[data-week-label]');
        if (!lbl) return;
        if (window.EduWeek && window.EduWeek.current) {
          var w = window.EduWeek.current;
          lbl.textContent = 'الأسبوع '+(w.week_number||w.weekNumber||'')+' · الفصل '+(w.term||'1');
          return;
        }
        var existing = document.querySelector('[data-week-display],[data-week-num],#weekInfo,#weekDisplay,.week-badge-text');
        if (existing && existing.textContent.trim()) { lbl.textContent = existing.textContent.trim(); return; }
        setTimeout(updateWeek, 2000);
      })();
    }

    // 4. أزرار الرجوع — دائرية حمراء
    hdr.querySelectorAll('a,button').forEach(function(btn) {
      if (btn.getAttribute('data-back-styled')) return;
      var txt = (btn.textContent||'').trim();
      var oc  = btn.getAttribute('onclick') || '';
      var hr  = btn.getAttribute('href') || '';
      var isBack = txt==='رجوع'||txt==='Back'||txt==='←'||txt==='→'||txt==='‹'||
                   oc.includes('history.back')||hr==='#back'||
                   (btn.getAttribute('title')||'').includes('رجوع');
      if (!isBack) return;
      btn.setAttribute('data-back-styled','1');
      btn.style.cssText = 'width:34px!important;height:34px!important;min-width:34px!important;background:rgba(239,68,68,0.85)!important;border:1px solid rgba(255,255,255,0.3)!important;border-radius:50%!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font-size:16px!important;color:#fff!important;text-decoration:none!important;flex-shrink:0!important;padding:0!important;transition:background .2s,transform .15s!important;';
      btn.addEventListener('mouseover', function(){this.style.background='rgba(239,68,68,1)';this.style.transform='scale(1.08)';});
      btn.addEventListener('mouseout',  function(){this.style.background='rgba(239,68,68,0.85)';this.style.transform='scale(1)';});
    });
  }

  function init() {
    injectHeaderTools();
    injectLangBtn();
    injectTooltipSystem();
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

/* ═══════════════════════════════════════════════════════════════
 * نظام تسجيل الخروج التلقائي بعد 15 دقيقة خمول
 * يعمل في جميع البوابات التي تحمّل platform-lang.js
 * ══════════════════════════════════════════════════════════════ */
(function() {
  var IDLE_LIMIT = 15 * 60 * 1000; // 15 دقيقة
  var idleTimer = null;
  var warningTimer = null;
  var warningShown = false;
  var WARNING_BEFORE = 60 * 1000; // تحذير قبل دقيقة واحدة

  function doAutoLogout() {
    if (sessionStorage.getItem('edoos_user')) {
      // أظهر toast قبل الخروج
      var toast = document.createElement('div');
      toast.textContent = '⏱ انتهت مدة الجلسة — جارٍ تسجيل الخروج...';
      toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1E293B;color:#fff;padding:16px 28px;border-radius:14px;font-size:16px;font-family:Tajawal,Arial,sans-serif;z-index:99999;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.4);direction:rtl;';
      document.body.appendChild(toast);
      setTimeout(function() {
        if (typeof window.eduosLogout === 'function') {
          window.eduosLogout();
        } else {
          sessionStorage.removeItem('edoos_user');
          window.location.href = '../eduos-login/index.html?bye=idle';
        }
      }, 1500);
    }
  }

  function showWarning() {
    if (warningShown) return;
    warningShown = true;
    var warn = document.createElement('div');
    warn.id = 'idle-warning-toast';
    warn.innerHTML = '⚠️ ستنتهي جلستك خلال دقيقة &nbsp;<button onclick="document.getElementById(\'idle-warning-toast\').remove();resetIdleTimer();" style="background:#6C3DD6;color:#fff;border:none;padding:4px 12px;border-radius:8px;cursor:pointer;font-family:Tajawal,Arial,sans-serif;font-size:13px;">تجديد الجلسة</button>';
    warn.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#92400E;color:#fff;padding:14px 20px;border-radius:12px;font-size:14px;font-family:Tajawal,Arial,sans-serif;z-index:99998;direction:rtl;box-shadow:0 4px 20px rgba(0,0,0,0.3);display:flex;align-items:center;gap:12px;';
    document.body.appendChild(warn);
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    clearTimeout(warningTimer);
    warningShown = false;
    var existing = document.getElementById('idle-warning-toast');
    if (existing) existing.remove();
    if (!sessionStorage.getItem('edoos_user')) return;
    warningTimer = setTimeout(showWarning, IDLE_LIMIT - WARNING_BEFORE);
    idleTimer = setTimeout(doAutoLogout, IDLE_LIMIT);
  }

  // جعل resetIdleTimer متاحة عالمياً لزر "تجديد الجلسة"
  window.resetIdleTimer = resetIdleTimer;

  // استمع لأي نشاط من المستخدم
  var events = ['mousemove', 'keydown', 'mousedown', 'click', 'scroll', 'touchstart', 'touchmove'];
  events.forEach(function(evt) {
    document.addEventListener(evt, resetIdleTimer, { passive: true, capture: true });
  });

  // ابدأ العداد عند تحميل الصفحة إذا هناك جلسة
  function startIfLoggedIn() {
    if (sessionStorage.getItem('edoos_user')) {
      resetIdleTimer();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startIfLoggedIn);
  } else {
    setTimeout(startIfLoggedIn, 500);
  }
})();

/* ═══════════════════════════════════════════════════════════════
 * eduosGetJWT + eduosRefreshToken
 * دوال موحَّدة للحصول على JWT صالح في جميع البوابات
 * إذا انتهت صلاحية الـ JWT → يُجدَّد تلقائياً بـ refresh_token
 * إذا فشل التجديد → يُعاد anon key (للقراءة فقط)
 * ══════════════════════════════════════════════════════════════ */
window.eduosRefreshToken = async function() {
  try {
    var s = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
    var rt = s.refresh_token;
    if (!rt || !window.EduOS) return false;
    var r = await fetch(window.EduOS.SB_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': window.EduOS.SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt })
    });
    if (r.ok) {
      var data = await r.json();
      s.token = data.access_token;
      s.access_token = data.access_token;
      if (data.refresh_token) s.refresh_token = data.refresh_token;
      sessionStorage.setItem('edoos_user', JSON.stringify(s));
      return true;
    }
  } catch(e) {}
  return false;
};

window.eduosGetJWT = function() {
  var s = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
  var tk = s.access_token || s.token;
  if (tk) {
    try {
      var parts = tk.split('.');
      if (parts.length === 3) {
        var payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
        if (payload.exp && payload.exp > Date.now() / 1000 + 30) {
          return tk; // صالح (هامش 30 ثانية)
        }
      }
    } catch(e) {}
  }
  // انتهى أو غير موجود → anon key للقراءة
  return window.EduOS ? window.EduOS.SB_KEY : '';
};

// عند تحميل أي صفحة → تحقق من الـ token وجدده إذا سينتهي خلال 5 دق
(function() {
  setTimeout(async function() {
    var s = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
    var tk = s.access_token || s.token;
    if (!tk) return;
    try {
      var parts = tk.split('.');
      if (parts.length !== 3) return;
      var payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
      if (payload.exp && payload.exp < Date.now() / 1000 + 300) {
        // ينتهي خلال 5 دقائق → جدّد
        await window.eduosRefreshToken();
      }
    } catch(e) {}
  }, 1500);
})();
