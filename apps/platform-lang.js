/**
 * platform-lang.js v3.0
 * EduOS Bilingual Engine — Arabic / English
 * NAFAS FOR ARTIFICIAL INTELLIGENCE © 2026
 *
 * Three translation layers:
 *   1. data-i18n="key"  →  dictionary lookup (structured pages)
 *   2. data-ar / data-en →  inline text pairs  (semi-structured)
 *   3. DOM text scan    →  phrase dictionary   (any page, zero HTML changes)
 *
 * Button position: bottom-right corner — never overlaps header/logo
 */

(function () {
  'use strict';

  // ─── Language Detection ──────────────────────────────────────────────────
  function detectLang() {
    const p = new URLSearchParams(window.location.search).get('lang');
    if (p === 'en' || p === 'ar') return p;
    const stored = window.__eduLangCurrent; // set by previous page if needed
    if (stored) return stored;
    return 'ar'; // default Arabic
  }

  // ─── Key Dictionary (data-i18n) ──────────────────────────────────────────
  const DICT = {
    'app.name':            { ar: 'الجود',                         en: 'AlJood' },
    'app.subtitle':        { ar: 'منصة الإدارة التعليمية الذكية', en: 'Smart Educational Management Platform' },
    'btn.logout':          { ar: 'خروج',                          en: 'Logout' },
    'btn.back':            { ar: 'رجوع',                          en: 'Back' },
    'btn.save':            { ar: 'حفظ',                           en: 'Save' },
    'btn.cancel':          { ar: 'إلغاء',                         en: 'Cancel' },
    'btn.export':          { ar: 'تصدير',                         en: 'Export' },
    'btn.export.pdf':      { ar: '📄 تصدير PDF',                  en: '📄 Export PDF' },
    'btn.print':           { ar: '🖨️ طباعة',                     en: '🖨️ Print' },
    'btn.refresh':         { ar: '🔄 تحديث',                      en: '🔄 Refresh' },
    'btn.search':          { ar: 'بحث',                           en: 'Search' },
    'btn.add':             { ar: 'إضافة',                         en: 'Add' },
    'btn.edit':            { ar: 'تعديل',                         en: 'Edit' },
    'btn.delete':          { ar: 'حذف',                           en: 'Delete' },
    'btn.view':            { ar: 'عرض',                           en: 'View' },
    'btn.close':           { ar: 'إغلاق',                         en: 'Close' },
    'btn.confirm':         { ar: 'تأكيد',                         en: 'Confirm' },
    'btn.details':         { ar: 'تفاصيل',                        en: 'Details' },
    'lbl.loading':         { ar: 'جارٍ التحميل...',               en: 'Loading...' },
    'lbl.nodata':          { ar: 'لا توجد بيانات',                en: 'No data available' },
    'lbl.error':           { ar: 'خطأ في التحميل',                en: 'Loading error' },
    'lbl.success':         { ar: '✅ تم بنجاح',                   en: '✅ Done successfully' },
    'lbl.total':           { ar: 'المجموع',                       en: 'Total' },
    'lbl.average':         { ar: 'المتوسط',                       en: 'Average' },
    'lbl.name':            { ar: 'الاسم',                         en: 'Name' },
    'lbl.grade':           { ar: 'الصف',                          en: 'Grade' },
    'lbl.class':           { ar: 'الفصل',                         en: 'Class' },
    'lbl.score':           { ar: 'الدرجة',                        en: 'Score' },
    'lbl.status':          { ar: 'الحالة',                        en: 'Status' },
    'lbl.date':            { ar: 'التاريخ',                       en: 'Date' },
    'lbl.time':            { ar: 'الوقت',                         en: 'Time' },
    'lbl.notes':           { ar: 'ملاحظات',                       en: 'Notes' },
    'lbl.actions':         { ar: 'الإجراءات',                     en: 'Actions' },
    'lbl.type':            { ar: 'النوع',                         en: 'Type' },
    'lbl.gender':          { ar: 'الجنس',                         en: 'Gender' },
    'lbl.nationality':     { ar: 'الجنسية',                       en: 'Nationality' },
    'lbl.phone':           { ar: 'الهاتف',                        en: 'Phone' },
    'lbl.email':           { ar: 'البريد الإلكتروني',             en: 'Email' },
    'lbl.all':             { ar: 'الكل',                          en: 'All' },
    'lbl.yes':             { ar: 'نعم',                           en: 'Yes' },
    'lbl.no':              { ar: 'لا',                            en: 'No' },
    'lbl.week':            { ar: 'الأسبوع',                       en: 'Week' },
    'lbl.semester':        { ar: 'الفصل',                         en: 'Semester' },
    'lbl.year':            { ar: 'العام الدراسي',                  en: 'Academic Year' },
    'lbl.school':          { ar: 'المدرسة',                       en: 'School' },
    'lbl.student':         { ar: 'الطالب',                        en: 'Student' },
    'lbl.students':        { ar: 'الطلاب',                        en: 'Students' },
    'lbl.teacher':         { ar: 'المعلم',                        en: 'Teacher' },
    'lbl.teachers':        { ar: 'المعلمون',                      en: 'Teachers' },
    'lbl.principal':       { ar: 'المدير',                        en: 'Principal' },
    'lbl.parent':          { ar: 'ولي الأمر',                     en: 'Parent' },
    'lbl.present':         { ar: 'حاضر',                          en: 'Present' },
    'lbl.absent':          { ar: 'غائب',                          en: 'Absent' },
    'lbl.late':            { ar: 'متأخر',                         en: 'Late' },
    'nav.dashboard':       { ar: 'لوحة التحكم',                   en: 'Dashboard' },
    'nav.attendance':      { ar: 'الحضور',                        en: 'Attendance' },
    'nav.grades':          { ar: 'الدرجات',                       en: 'Grades' },
    'nav.reports':         { ar: 'التقارير',                      en: 'Reports' },
    'nav.settings':        { ar: 'الإعدادات',                     en: 'Settings' },
    'nav.messages':        { ar: 'الرسائل',                       en: 'Messages' },
    'nav.schedule':        { ar: 'الجدول',                        en: 'Schedule' },
    'nav.analytics':       { ar: 'التحليلات',                     en: 'Analytics' },
    'sys.eduos':           { ar: 'منظومة التعليم الذكي',           en: 'Smart Education System' },
    'sys.hub':             { ar: 'مركز المنظومات',                 en: 'System Hub' },
    'sys.login':           { ar: 'تسجيل الدخول',                  en: 'Login' },
    'sys.logout.confirm':  { ar: 'هل تريد تسجيل الخروج؟',         en: 'Are you sure you want to logout?' },
    'insp.title':          { ar: 'بوابة التفتيش المدرسي',          en: 'School Inspection Portal' },
    'insp.school_info':    { ar: 'بطاقة المدرسة',                  en: 'School Card' },
    'insp.academic':       { ar: 'الأداء الأكاديمي',               en: 'Academic Performance' },
    'insp.attendance':     { ar: 'الحضور والانتظام',               en: 'Attendance & Regularity' },
    'insp.inclusion':      { ar: 'الدمج وذوو الاحتياجات',          en: 'Inclusion & Special Needs' },
    'insp.pdp':            { ar: 'التطوير المهني',                 en: 'Professional Development' },
    'insp.safety':         { ar: 'السلامة والبيئة',               en: 'Safety & Environment' },
    'insp.schedule':       { ar: 'الجدول الدراسي',                 en: 'Timetable' },
    'insp.export':         { ar: 'تصدير التقرير',                  en: 'Export Report' },
    'insp.generated':      { ar: 'تم إنشاء التقرير',               en: 'Report Generated' },
    'insp.inspector':      { ar: 'المفتش',                         en: 'Inspector' },
    'insp.visit_date':     { ar: 'تاريخ الزيارة',                  en: 'Visit Date' },
    'insp.school_name':    { ar: 'اسم المدرسة',                    en: 'School Name' },
    'insp.adek_no':        { ar: 'رقم eSIS',                       en: 'eSIS Number' },
    'insp.level':          { ar: 'المراحل',                        en: 'Levels' },
    'insp.students_count': { ar: 'عدد الطلاب',                     en: 'Student Count' },
    'insp.staff_count':    { ar: 'عدد الكوادر',                    en: 'Staff Count' },
    'insp.overall':        { ar: 'التقييم الإجمالي',               en: 'Overall Rating' },
  };

  // ─── Phrase Dictionary (DOM text scan — Layer 3) ──────────────────────────
  // Maps exact Arabic UI phrases to English. Only visible text nodes are scanned.
  // Keys are trimmed Arabic strings. Add more as needed.
  const PHRASES = {
    // Navigation & Hub
    'الكل':                   'All',
    'إدارة':                  'Admin',
    'أكاديمي':                'Academic',
    'خدمات':                  'Services',
    'الطالب':                 'Student',
    'مركز المنظومات':          'System Hub',
    'ابحث عن منظومة...':      'Search for a module...',
    'نشط':                    'Active',
    'مدير':                   'Principal',
    'جديد':                   'New',
    // Roles
    'معلم':                   'Teacher',
    'معلمة':                  'Teacher',
    'طالب':                   'Student',
    'طالبة':                  'Student',
    'مدير':                   'Principal',
    'مديرة':                  'Principal',
    'أخصائي':                 'Specialist',
    'أخصائية':                'Specialist',
    'ولي الأمر':              'Parent',
    'موظف':                   'Staff',
    'موظفة':                  'Staff',
    'مراقب':                  'Supervisor',
    // Common actions
    'دخول المنصة':            'Enter Platform',
    'تسجيل الدخول':           'Login',
    'تسجيل الخروج':           'Logout',
    'خروج':                   'Logout',
    'رجوع':                   'Back',
    'حفظ':                    'Save',
    'إلغاء':                  'Cancel',
    'تصدير':                  'Export',
    'طباعة':                  'Print',
    'تحديث':                  'Refresh',
    'بحث':                    'Search',
    'إضافة':                  'Add',
    'تعديل':                  'Edit',
    'حذف':                    'Delete',
    'عرض':                    'View',
    'إغلاق':                  'Close',
    'تأكيد':                  'Confirm',
    'تفاصيل':                 'Details',
    'إرسال':                  'Send',
    'تحميل':                  'Download',
    'رفع':                    'Upload',
    // Status
    'جارٍ التحميل...':        'Loading...',
    'لا توجد بيانات':         'No data available',
    'تم بنجاح':               'Done successfully',
    'خطأ':                    'Error',
    'تنبيه':                  'Alert',
    'تحذير':                  'Warning',
    'حاضر':                   'Present',
    'غائب':                   'Absent',
    'متأخر':                  'Late',
    'مُعفى':                  'Excused',
    // Time
    'اليوم':                  'Today',
    'أمس':                    'Yesterday',
    'الآن':                   'Now',
    'الأسبوع الأول':          'Week 1',
    'الأسبوع الثاني':         'Week 2',
    'الأسبوع الثالث':         'Week 3',
    'الفصل الأول':            'Semester 1',
    'الفصل الثاني':           'Semester 2',
    'الفصل الثالث':           'Semester 3',
    // Academics
    'الدرجات':                'Grades',
    'الحضور':                 'Attendance',
    'الجدول':                 'Schedule',
    'التقارير':               'Reports',
    'الإعدادات':              'Settings',
    'الرسائل':                'Messages',
    'التحليلات':              'Analytics',
    'لوحة التحكم':            'Dashboard',
    'المهام':                 'Tasks',
    'الأنشطة':                'Activities',
    'المشاريع':               'Projects',
    'الاختبارات':             'Exams',
    'الواجبات':               'Homework',
    'الدرجة':                 'Grade',
    'المتوسط':                'Average',
    'المجموع':                'Total',
    'الحد الأقصى':            'Maximum',
    'الحد الأدنى':            'Minimum',
    'ممتاز':                  'Excellent',
    'جيد جداً':               'Very Good',
    'جيد':                    'Good',
    'مقبول':                  'Acceptable',
    'ضعيف':                   'Weak',
    // Modules
    'لوحة المعلم':            'Teacher Dashboard',
    'لوحة المدير':            'Principal Dashboard',
    'بوابة ولي الأمر':        'Parent Portal',
    'بوابة الطالب':           'Student Portal',
    'نظام الحضور':            'Attendance System',
    'الجدول الدراسي':         'Timetable',
    'الميزانية':              'Budget',
    'المكتبة':                'Library',
    'رياض الأطفال':           'Kindergarten',
    'الدمج':                  'Inclusion',
    'التفتيش':                'Inspection',
    'الإذاعة':                'Broadcasting',
    'المنظومات':              'Modules',
    'المنظومة':               'Module',
    // Inspection specific
    'بوابة التفتيش المدرسي':  'School Inspection Portal',
    'بطاقة المدرسة':          'School Card',
    'الأداء الأكاديمي':       'Academic Performance',
    'الحضور والانتظام':       'Attendance & Regularity',
    'الدمج وذوو الاحتياجات':  'Inclusion & Special Needs',
    'التطوير المهني':         'Professional Development',
    'السلامة والبيئة':        'Safety & Environment',
    'تصدير التقرير':          'Export Report',
    'المفتش':                 'Inspector',
    'تاريخ الزيارة':          'Visit Date',
    'اسم المدرسة':            'School Name',
    'عدد الطلاب':             'Student Count',
    'عدد الكوادر':            'Staff Count',
    'التقييم الإجمالي':       'Overall Rating',
    // Staff & People
    'الاسم':                  'Name',
    'رقم الهوية':             'ID Number',
    'الجنسية':                'Nationality',
    'التخصص':                 'Specialization',
    'المؤهل':                 'Qualification',
    'الخبرة':                 'Experience',
    'الحالة':                 'Status',
    'التاريخ':                'Date',
    'الوقت':                  'Time',
    'ملاحظات':                'Notes',
    'الإجراءات':              'Actions',
    // School info
    'روضة ومدرسة الجود':      'AlJood School',
    'مدرسة الجود':            'AlJood School',
    'أبوظبي':                 'Abu Dhabi',
    'مدينة العين':            'Al Ain',
    'الإمارات':               'UAE',
    // Buttons with icons (trim emoji, match text part)
    'تسجيل وصولي':            'Check In',
    'حضور الطلاب':            'Student Attendance',
    'بدء الحصة الحية':        'Start Live Lesson',
    'إرسال ملخص':             'Send Summary',
    'اسأل AI':                'Ask AI',
    'المزيد من AI':           'More AI',
    'جولة':                   'Tour',
    'دخول ذكي':               'Smart Login',
    'مرحباً':                 'Welcome',
    // Footer
    'جميع الحقوق محفوظة':     'All rights reserved',
    'منيرة علي محمد سعيد المري': 'Munira Ali Mohamed Al Marri',
    'حقوق التأليف':           'Copyright',
    // Parent portal
    'بيانات الابن':           'Child Information',
    'بيانات الطالب':          'Student Information',
    'نتائج الطالب':           'Student Results',
    'التقرير الأكاديمي':      'Academic Report',
    'تواصل مع المدرسة':       'Contact School',
    // With definite article 'ال' — common in descriptions
    'الأكاديمي':              'Academic',
    'الأكاديمية':             'Academic',
    'الإدارة':                'Administration',
    'المدير':                 'Principal',
    'المديرة':                'Principal',
    'المعلم':                 'Teacher',
    'المعلمة':                'Teacher',
    'الطالب':                 'Student',
    'الطالبة':                'Student',
    'الطلاب':                 'Students',
    'الطلبة':                 'Students',
    'الحضور':                 'Attendance',
    'الدرجات':                'Grades',
    'الجدول':                 'Schedule',
    'التحليلات':              'Analytics',
    'التقارير':               'Reports',
    'الميزانية':              'Budget',
    'المكتبة':                'Library',
    'الإذاعة':                'Broadcasting',
    'المنظومة':               'Module',
    'المنظومات':              'Modules',
    'المهام':                 'Tasks',
    'الاختبارات':             'Exams',
    'الرسائل':                'Messages',
    'الإعدادات':              'Settings',
    // Misc
    'نعم':                    'Yes',
    'لا':                     'No',
    // News ticker / broadcasts
    'أخبار EduOS':            'EduOS News',
    'إعلان':                  'Announcement',
    'تذكير':                  'Reminder',
  };

  // ─── Store original text nodes for restoration ───────────────────────────
  const _originals = new WeakMap();   // node → original textContent
  const _attrOriginals = new WeakMap(); // element → {attr: original}

  // ─── Core Engine ─────────────────────────────────────────────────────────
  const EduLang = {
    current: 'ar',

    t(key, fallback) {
      const entry = DICT[key];
      if (!entry) return fallback || key;
      return entry[this.current] || entry.ar || fallback || key;
    },

    setLang(lang) {
      if (lang !== 'ar' && lang !== 'en') return;
      this.current = lang;

      // Update URL param without reload
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());

      // Apply
      document.documentElement.lang = lang;
      document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
      this._applyDictKeys();
      this._applyDataPairs();
      this._applyPhrases();
      this._applyAttrs();
      this._updateToggleBtn();

      // Dispatch event for app-specific handlers
      window.dispatchEvent(new CustomEvent('eduos-lang-change', { detail: { lang } }));
    },

    // Layer 1: data-i18n="key"
    _applyDictKeys() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = this.t(key);
        if (val) el.textContent = val;
      });
    },

    // Layer 2: data-ar="..." data-en="..."
    _applyDataPairs() {
      document.querySelectorAll('[data-ar][data-en]').forEach(el => {
        el.textContent = this.current === 'en'
          ? el.getAttribute('data-en')
          : el.getAttribute('data-ar');
      });
    },

    // Layer 3: phrase scan — replaces text nodes containing known Arabic phrases
    _applyPhrases() {
      if (this.current === 'ar') {
        this._restoreOriginals();
        return;
      }
      this._scanAndReplace(document.body);
    },

    _scanAndReplace(root) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            // Skip script, style, noscript
            const tag = node.parentElement && node.parentElement.tagName;
            if (!tag) return NodeFilter.FILTER_REJECT;
            if (['SCRIPT','STYLE','NOSCRIPT'].includes(tag)) return NodeFilter.FILTER_REJECT;
            // Skip nodes in the lang button itself
            if (node.parentElement && node.parentElement.closest('#eduos-lang-toggle,#eduos-lang-float,#eduos-lang-btn')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);

      nodes.forEach(node => {
        const orig = node.textContent;
        const trimmed = orig.trim();
        if (!trimmed) return;

        // Exact match
        if (PHRASES[trimmed]) {
          if (!_originals.has(node)) _originals.set(node, orig);
          node.textContent = orig.replace(trimmed, PHRASES[trimmed]);
          return;
        }

        // Partial match — space-boundary aware replacement
        // Only replaces phrases that are whole words (surrounded by whitespace or string edges)
        let replaced = orig;
        let changed = false;
        const sortedKeys = Object.keys(PHRASES).sort((a,b) => b.length - a.length);
        for (const ar of sortedKeys) {
          if (!replaced.includes(ar)) continue;
          const escaped = ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Boundary = whitespace, punctuation, Arabic punctuation, or string edge
          const B = '(^|[\\s،؛؟!.·|—\\-\\/\\(\\)\\[\\]:])';
          const E = '($|[\\s،؛؟!.·|—\\-\\/\\(\\)\\[\\]:])';
          try {
            const regex = new RegExp(B + escaped + E, 'g');
            const next = replaced.replace(regex, (m, pre, post) => {
              if (post === undefined) return (pre || '') + PHRASES[ar];
              return (pre || '') + PHRASES[ar] + (post || '');
            });
            if (next !== replaced) { replaced = next; changed = true; }
          } catch(e) {}
        }
        if (changed) {
          if (!_originals.has(node)) _originals.set(node, orig);
          node.textContent = replaced;
        }
      });
    },

    _restoreOriginals() {
      // Walk all text nodes and restore saved originals
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (_originals.has(n)) {
          n.textContent = _originals.get(n);
        }
      }
    },

    // Translate placeholder / title / alt / aria-label attributes
    _applyAttrs() {
      const attrMap = {
        'ابحث عن منظومة...':              'Search for a module...',
        'اسم المستخدم أو البريد الإلكتروني': 'Username or email',
        'كلمة المرور':                    'Password',
        'بحث...':                         'Search...',
        'أدخل ملاحظاتك...':               'Enter your notes...',
        'أدخل...':                        'Enter...',
      };

      ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
        document.querySelectorAll(`[${attr}]`).forEach(el => {
          const val = el.getAttribute(attr);
          if (!val) return;
          if (this.current === 'en' && attrMap[val]) {
            if (!_attrOriginals.has(el)) {
              const m = _attrOriginals.get(el) || {};
              m[attr] = val;
              _attrOriginals.set(el, m);
            }
            el.setAttribute(attr, attrMap[val]);
          } else if (this.current === 'ar') {
            const saved = _attrOriginals.get(el);
            if (saved && saved[attr]) el.setAttribute(attr, saved[attr]);
          }
        });
      });
    },

    // ─── Toggle Button ──────────────────────────────────────────────────────
    _updateToggleBtn() {
      const btn = document.getElementById('eduos-lang-float') ||
                  document.getElementById('eduos-lang-toggle');
      if (!btn) return;
      btn.textContent = this.current === 'ar' ? 'EN' : 'ع';
      btn.title = this.current === 'ar' ? 'Switch to English' : 'التبديل للعربية';
      btn.setAttribute('aria-label', 'Language toggle');
    },

    _createToggleBtn() {
      const btn = document.createElement('button');
      btn.id = 'eduos-lang-float';
      btn.textContent = this.current === 'ar' ? 'EN' : 'ع';
      btn.title = this.current === 'ar' ? 'Switch to English' : 'التبديل للعربية';
      btn.setAttribute('aria-label', 'Language toggle');
      btn.addEventListener('click', () => {
        const next = EduLang.current === 'ar' ? 'en' : 'ar';
        EduLang.setLang(next);
      });
      return btn;
    },

    // Inject into known header slot OR floating bottom-left corner
    autoInjectToggle() {
      // Already exists? Just update text
      if (document.getElementById('eduos-lang-float') || document.getElementById('eduos-lang-toggle')) {
        this._updateToggleBtn();
        return;
      }

      // Try header slot first
      const slots = ['eduos-header-actions', 'eduos-lang-container', 'header-actions', 'header-right'];
      for (const id of slots) {
        const el = document.getElementById(id);
        if (el) {
          const btn = this._createToggleBtn();
          btn.id = 'eduos-lang-toggle';
          btn.className = 'eduos-lang-btn';
          el.appendChild(btn);
          return;
        }
      }

      // Fallback: floating button — bottom-left (won't overlap logo/header)
      const btn = this._createToggleBtn();
      btn.id = 'eduos-lang-float';
      document.body.appendChild(btn);
    },

    // Initialize
    init() {
      this._injectStyles();
      this.current = detectLang();
      document.documentElement.lang = this.current;
      document.documentElement.dir  = this.current === 'ar' ? 'rtl' : 'ltr';

      const run = () => {
        this._applyDictKeys();
        this._applyDataPairs();
        if (this.current === 'en') this._applyPhrases();
        if (this.current === 'en') this._applyAttrs();
        this.autoInjectToggle();
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
      } else {
        run();
      }
    },

    // ─── Styles ─────────────────────────────────────────────────────────────
    _injectStyles() {
      if (document.getElementById('eduos-lang-styles')) return;
      const style = document.createElement('style');
      style.id = 'eduos-lang-styles';
      style.textContent = `
        /* ── Inline header button ─────────────────────────────── */
        .eduos-lang-btn {
          background: rgba(108,61,214,0.18);
          color: #e2d9ff;
          border: 1.5px solid rgba(108,61,214,0.5);
          border-radius: 8px;
          padding: 4px 12px;
          font-family: 'Tajawal', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .eduos-lang-btn:hover {
          background: rgba(108,61,214,0.40);
          border-color: #6C3DD6;
          color: #fff;
        }

        /* ── Floating button — bottom-left corner ─────────────── */
        #eduos-lang-float {
          position: fixed;
          bottom: 72px;
          left: 16px;
          z-index: 99999;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(13,27,42,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 2px solid rgba(108,61,214,0.6);
          color: #c4b5fd;
          font-family: 'Tajawal', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(108,61,214,0.3);
          transition: all 0.2s;
        }
        #eduos-lang-float:hover {
          background: rgba(108,61,214,0.5);
          border-color: #7c4ee5;
          color: #fff;
          transform: scale(1.08);
        }

        /* LTR override — move float to bottom-right */
        [dir="ltr"] #eduos-lang-float {
          left: auto;
          right: 16px;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // ─── Global API ───────────────────────────────────────────────────────────
  window.EduLang = EduLang;
  window.t = (key, fallback) => EduLang.t(key, fallback);

  // Auto-start
  EduLang.init();

})();
