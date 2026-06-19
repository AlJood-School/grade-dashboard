/**
 * platform-lang.js v4.0
 * EduOS Bilingual Engine — Arabic / English — COMPLETE COVERAGE
 * NAFAS FOR ARTIFICIAL INTELLIGENCE © 2026
 *
 * Four translation layers:
 *   1. data-i18n="key"    →  dictionary lookup
 *   2. data-ar / data-en  →  inline text pairs
 *   3. DOM text scan      →  phrase dictionary (static)
 *   4. PATTERNS           →  regex replacements (dynamic text)
 *
 * Button position: floating bottom-left corner
 */

(function () {
  'use strict';

  // ─── Language Detection ────────────────────────────────────────────────
  function detectLang() {
    const p = new URLSearchParams(window.location.search).get('lang');
    if (p === 'en' || p === 'ar') return p;
    return 'ar';
  }

  // ─── Key Dictionary (data-i18n) ────────────────────────────────────────
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
    'sys.hub':             { ar: 'مركز المنظومات',                 en: 'System Hub' },
    'sys.login':           { ar: 'تسجيل الدخول',                  en: 'Login' },
    'sys.logout.confirm':  { ar: 'هل تريد تسجيل الخروج؟',         en: 'Are you sure you want to logout?' },
  };

  // ─── Phrase Dictionary (DOM text scan) ────────────────────────────────
  // Sorted by length descending for correct partial matching
  const PHRASES_RAW = {

    // ══ Hub Sections ══
    'مركز المنظومات المدرسية':                    'School System Hub',
    'الإدارة والتخطيط':                            'Administration & Planning',
    'الأكاديمي والتعليم':                          'Academic & Education',
    'الموارد البشرية والتطوير المهني':              'HR & Professional Development',
    'الخدمات والمرافق':                            'Services & Facilities',
    'الطالبة وولي الأمر':                          'Student & Parent',
    'الطالب وولي الأمر':                           'Student & Parent',
    'أدوات التعلم والتواصل':                       'Learning & Communication Tools',
    'الشؤون الإدارية والتوطين':                    'Administrative Affairs & Emiratisation',
    'الحضور الذكي':                                'Smart Attendance',
    'الإنجازات والمكافآت':                         'Achievements & Rewards',
    'وصول سريع':                                   'Quick Access',
    'أثير — الرصد الذكي الصامت':                  'Atheer — Silent Smart Monitoring',

    // ══ Hub Stats ══
    'منظومة نشطة':                                 'Active Module',
    'منظومتان':                                    '2 Modules',
    'موظفة حضرت اليوم':                            'Staff Present Today',
    'موظف حضر اليوم':                              'Staff Present Today',
    'طالبة مسجّلة':                                'Enrolled Student',
    'طالب مسجّل':                                  'Enrolled Student',
    'طلب معلّق':                                   'Pending Request',
    'تنبيه نشط':                                   'Active Alert',

    // ══ Hub App Descriptions ══
    'لوحة المدير العامة والتحليلات':               'Principal Dashboard & Analytics',
    'مركز التحليلات والذكاء الاصطناعي':            'Analytics & AI Center',
    'إدارة الميزانية والمصروفات':                  'Budget & Expenses Management',
    'التقويم والفعاليات المدرسية':                 'Calendar & School Events',
    'الجدول الأسبوعي وتوزيع الحصص':               'Weekly Timetable & Period Distribution',
    'خارطة التحول الرقمي — 6 ركائز + KPIs + خارطة الطريق': 'Digital Transformation Roadmap — 6 Pillars + KPIs + Roadmap',
    'إعدادات المدرسة والنظام والنسخ الاحتياطية':  'School, System & Backup Settings',
    'لوحة المعلمة والدرجات والحصص':               'Teacher Dashboard — Grades & Periods',
    'لوحة المعلم والدرجات والحصص':                'Teacher Dashboard — Grades & Periods',
    'رئيسية المعلمة — طالباتي، جدول، مهام، AI':   'Teacher Home — My Students, Schedule, Tasks, AI',
    'رئيسية المعلم — طلابي، جدول، مهام، AI':      'Teacher Home — My Students, Schedule, Tasks, AI',
    'جدول الاختبارات وتوزيع القاعات':             'Exam Schedule & Hall Distribution',
    'المكتبة والمختبر والموارد':                   'Library, Lab & Resources',
    'رياض الأطفال وأنشطة الأطفال':                'Kindergarten & Children\'s Activities',
    'ذوو الاحتياجات الخاصة والدمج':               'Special Needs & Inclusion',
    'الإذاعة المدرسية والمحتوى':                   'School Broadcasting & Content',
    'طلبات الصيانة والمرافق':                      'Maintenance & Facilities Requests',
    'الحافلات والطرق والمسارات':                   'Buses, Routes & Paths',
    'قائمة الطعام والطلبات اليومية':               'Cafeteria Menu & Daily Orders',
    'حجز الفضاءات والمرافق':                       'Space & Facility Booking',
    'الأمن والسلامة والحوادث':                     'Security, Safety & Incidents',
    'العيادة المدرسية والصحة':                     'School Clinic & Health',
    'جداول الواجب والإشراف':                       'Duty & Supervision Schedules',
    'بوابة الطالبة والدرجات والحضور':             'Student Portal — Grades & Attendance',
    'بوابة الطالب والدرجات والحضور':              'Student Portal — Grades & Attendance',
    'متابعة الأداء الأكاديمي والسلوك':            'Tracking Academic Performance & Behaviour',
    'درجات، حضور، رسائل، IEP، المساعد الذكي':     'Grades, Attendance, Messages, IEP, AI Assistant',
    'الأخصائية الاجتماعية والحالات':              'Social Worker & Cases',
    'الأخصائي الاجتماعي والحالات':               'Social Worker & Cases',
    'الملف الشامل للطالبة — درجات، حضور، IEP':   'Full Student Profile — Grades, Attendance, IEP',
    'الملف الشامل للطالب — درجات، حضور، IEP':    'Full Student Profile — Grades, Attendance, IEP',
    'بطاقة الطالبة الرقمية QR — طباعة وتصدير':   'Student Digital QR Card — Print & Export',
    'بطاقة الطالب الرقمي QR — طباعة وتصدير':     'Student Digital QR Card — Print & Export',
    'محفظة الإنجاز KG→G12 — الأعمال والشهادات':  'Achievement Portfolio KG→G12 — Works & Certificates',
    'بطاقة الخروج الرقمية — تقييم فهم الدرس':    'Digital Exit Ticket — Lesson Comprehension',
    'الرسائل الداخلية — كادر المدرسة':            'Internal Messages — School Staff',
    'إعدادات المدرسة — الأمان والنسخ والثيم':     'School Settings — Security, Backup & Theme',
    'الملاحظة الصفية وتحليل الحصص بالذكاء الاصطناعي': 'Classroom Observation & AI Lesson Analysis',
    'خطة التطوير المهني — أهداف وتقدم ومتابعة':  'Professional Development Plan — Goals, Progress & Follow-up',
    'مستودع الوثائق المدرسي المشترك — خطط ومصادر وتقارير': 'Shared School Document Repository — Plans, Resources & Reports',
    'التقييم الوظيفي السنوي — 6 معايير MOE':      'Annual Staff Appraisal — 6 MOE Criteria',
    'إنشاء اجتماعات — تأكيد / اعتذار / تجاهل + تذكير ذكي': 'Create Meetings — Confirm / Decline / Ignore + Smart Reminder',
    'تحديد أسلوب التعلم — للطلاب والموظفين + تحليل AI': 'Learning Style Assessment — Students & Staff + AI Analysis',
    'الجاهزية الرقمية — معلمين + فريق الدعم والتربية الخاصة': 'Digital Readiness — Teachers + Support Team & Special Ed',
    'النماذج الرقمية المدرسية — طلبات، إذنيات، استئذانات': 'School Digital Forms — Requests, Permits & Permissions',
    'إجازات الكادر — رصيد MOE، حاسبة ذكية، شهادة طبية': 'Staff Leaves — MOE Balance, Smart Calculator, Medical Certificate',
    'إدارة التوطين — ملفات الكادر وطلبات التصاريح': 'Emiratisation Management — Staff Files & Permit Requests',
    'استيراد بيانات الطلاب من Excel — AI تحقق ذكي': 'Import Student Data from Excel — AI Smart Verification',
    'إعداد المدرسة للتفتيش — تقرير شامل بـ AI':   'School Inspection Preparation — Comprehensive AI Report',
    'إدارة المعلمين البدلاء — عقود مؤقتة + حذف تلقائي بعد انتهاء العقد': 'Sub Teacher Management — Temporary Contracts + Auto-Delete After Expiry',
    'رابط ترحيب ذكي للموظف الجديد — واتساب / نسخ / QR': 'Smart Welcome Link for New Staff — WhatsApp / Copy / QR',
    'شاشة البوابة — رمز QR يتجدد كل 60 ثانية':   'Gate Screen — QR Code Refreshes Every 60 Seconds',
    'تسجيل حضور الموظفين — GPS + مسح QR من الموبايل': 'Staff Attendance Registration — GPS + Mobile QR Scan',
    'شاشة التابلت — رمز QR يفتح رحلة الزائر مباشرة': 'Tablet Screen — QR Opens Visitor Journey Directly',
    'بوابة الزائر — تسجيل ذاتي + تعيين مسمى وظيفي + دخول': 'Visitor Portal — Self Registration + Role Assignment + Entry',
    'رصد سلوكي صامت — إشارات تلقائية — الطالب لا يعلم أبداً': 'Silent Behavioural Monitoring — Automatic Signals — Student Never Knows',
    'جاهزية استقبال المفتش — تقرير شامل بـ AI — للمدير والمفتش': 'Inspector Readiness — Comprehensive AI Report — For Principal & Inspector',
    'إنجازات الطلاب والموظفين — شهادات بالذكاء الاصطناعي': 'Student & Staff Achievements — AI-Generated Certificates',
    '6 أنواع — PDF مولَّد + ختم + QR للتحقق + سجل رقمي': '6 Types — Generated PDF + Stamp + Verification QR + Digital Record',
    '107 طالبة أصحاب همم | IEP حي | AI':          '107 Students of Determination | Live IEP | AI',

    // ══ Hub Quick Access ══
    'بوابة الحضور':                                'Attendance Gate',
    'الاستقبال':                                   'Onboarding',
    'المخطط الذكي':                               'Smart Blueprint',
    'قناة تيليجرام':                               'Telegram Channel',
    'رابط مخصص':                                  'Custom Link',

    // ══ Idle Overlay ══
    'ستُسجَّل خارجاً تلقائياً بسبب عدم النشاط':  'You will be logged out automatically due to inactivity',
    'سيُسجَّل خارجاً تلقائياً بسبب عدم النشاط':  'You will be logged out automatically due to inactivity',
    'أنا هنا — تابع':                             'I\'m here — Continue',

    // ══ School Identity Banner ══
    'هوية المدرسة:':                               'School Identity:',
    'هوية المدرسة':                                'School Identity',

    // ══ Footer ══
    'منظومة الجود التعليمية الذكية':               'AlJood Smart Educational System',
    'جميع الحقوق محفوظة':                         'All rights reserved',
    'شهادة ملكية فكرية رقم':                       'Intellectual Property Certificate No.',

    // ══ Badges ══
    '🔒 مدير + أخصائي':                           '🔒 Principal + Specialist',
    'معسكر':                                       'Bootcamp',

    // ══ Navigation & Common ══
    'الكل':                   'All',
    'إدارة':                  'Admin',
    'أكاديمي':                'Academic',
    'خدمات':                  'Services',
    'الطالب':                 'Student',
    'مركز المنظومات':          'System Hub',
    'ابحث عن منظومة...':      'Search for a module...',
    'نشط':                    'Active',
    'جديد':                   'New',

    // ══ Roles ══
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
    'نائب المدير':            'Vice Principal',
    'مفتش':                   'Inspector',
    'ممرض':                   'Nurse',
    'ممرضة':                  'Nurse',
    'حارس أمن':               'Security Guard',
    'معلم بديل':              'Substitute Teacher',
    'معلمة بديلة':            'Substitute Teacher',

    // ══ Common Actions ══
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
    'تسجيل وصولي':            'Check In',
    'حضور الطلاب':            'Student Attendance',
    'بدء الحصة الحية':        'Start Live Lesson',
    'إرسال ملخص':             'Send Summary',
    'اسأل AI':                'Ask AI',
    'جولة':                   'Tour',
    'دخول ذكي':               'Smart Login',
    'مرحباً':                 'Welcome',
    'إنشاء طلب':              'Create Request',
    'تحديث البيانات':          'Refresh Data',
    'فلترة':                  'Filter',
    'تصفية':                  'Filter',
    'عرض التفاصيل':           'View Details',
    'إغلاق التفاصيل':         'Close Details',
    'تصدير إلى Excel':        'Export to Excel',
    'تصدير إلى PDF':          'Export to PDF',
    'تصدير PDF':              'Export PDF',

    // ══ Status ══
    'جارٍ التحميل...':        'Loading...',
    'جارٍ التحميل':           'Loading…',
    'لا توجد بيانات':         'No data available',
    'لا يوجد بيانات':         'No data available',
    'تم بنجاح':               'Done successfully',
    'خطأ':                    'Error',
    'تنبيه':                  'Alert',
    'تحذير':                  'Warning',
    'حاضر':                   'Present',
    'غائب':                   'Absent',
    'متأخر':                  'Late',
    'مُعفى':                  'Excused',
    'مقبول':                  'Accepted',
    'مرفوض':                  'Rejected',
    'قيد المراجعة':           'Under Review',
    'مكتمل':                  'Completed',
    'منتهي':                  'Expired',
    'نشطة':                   'Active',
    'موافق':                  'Approved',
    'ممتاز':                  'Excellent',
    'جيد جداً':               'Very Good',
    'جيد':                    'Good',
    'ضعيف':                   'Weak',

    // ══ Time ══
    'اليوم':                  'Today',
    'أمس':                    'Yesterday',
    'الآن':                   'Now',
    'الأسبوع الأول':          'Week 1',
    'الأسبوع الثاني':         'Week 2',
    'الأسبوع الثالث':         'Week 3',
    'الأسبوع الرابع':         'Week 4',
    'الأسبوع الخامس':         'Week 5',
    'الفصل الأول':            'Semester 1',
    'الفصل الثاني':           'Semester 2',
    'الفصل الثالث':           'Semester 3',
    'الأحد':                  'Sunday',
    'الاثنين':                'Monday',
    'الثلاثاء':               'Tuesday',
    'الأربعاء':               'Wednesday',
    'الخميس':                 'Thursday',
    'الجمعة':                 'Friday',
    'السبت':                  'Saturday',
    'صباحاً':                 'AM',
    'مساءً':                  'PM',

    // ══ Academics ══
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
    'إجمالي':                 'Total',
    'المجموع الكلي':          'Grand Total',
    'النسبة المئوية':         'Percentage',
    'معدل':                   'Average',
    'أعلى':                   'Highest',
    'أدنى':                   'Lowest',
    'مقارنة':                 'Comparison',
    'نمو':                    'Growth',
    'تراجع':                  'Decline',
    'ثابت':                   'Stable',
    'بحسب الصف':              'by Grade',
    'بحسب المادة':            'by Subject',
    'بحسب المعلمة':           'by Teacher',
    'بحسب المعلم':            'by Teacher',
    'منذ الأسبوع الماضي':     'since last week',
    'منذ الفصل الماضي':       'since last semester',
    'مقارنةً بالعام الماضي':  'vs. last year',

    // ══ Modules ══
    'لوحة المعلم':            'Teacher Dashboard',
    'لوحة المعلمة':           'Teacher Dashboard',
    'لوحة المدير':            'Principal Dashboard',
    'بوابة ولي الأمر':        'Parent Portal',
    'بوابة الطالب':           'Student Portal',
    'بوابة الطالبة':          'Student Portal',
    'نظام الحضور':            'Attendance System',
    'الجدول الدراسي':         'Timetable',
    'الميزانية':              'Budget',
    'المكتبة':                'Library',
    'رياض الأطفال':           'Kindergarten',
    'الدمج':                  'Inclusion',
    'الدمج الذكي':            'Smart Inclusion',
    'التفتيش':                'Inspection',
    'الإذاعة':                'Broadcasting',
    'المنظومات':              'Modules',
    'المنظومة':               'Module',
    'بوابة التفتيش المدرسي':  'School Inspection Portal',
    'بوابة التفتيش':          'Inspection Portal',
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

    // ══ Staff & People ══
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
    'النوع':                  'Type',
    'الجنس':                  'Gender',
    'الهاتف':                 'Phone',
    'البريد الإلكتروني':      'Email',

    // ══ School Info ══
    'روضة ومدرسة الجود':      'AlJood School',
    'مدرسة الجود':            'AlJood School',
    'أبوظبي':                 'Abu Dhabi',
    'الإمارات':               'UAE',

    // ══ Attendance ══
    'تسجيل الحضور':           'Attendance Registration',
    'سجل الحضور':             'Attendance Record',
    'الحضور والغياب':         'Attendance & Absence',
    'الكوادر التعليمية':      'Teaching Staff',
    'طلبات الإجازة':          'Leave Requests',
    'إجازة اعتيادية':         'Annual Leave',
    'إجازة مرضية':            'Sick Leave',
    'غياب بعذر':              'Excused Absence',
    'غياب بدون عذر':          'Unexcused Absence',

    // ══ Parent Portal ══
    'بيانات الابن':           'Child Information',
    'بيانات الطالب':          'Student Information',
    'بيانات الطالبة':         'Student Information',
    'نتائج الطالب':           'Student Results',
    'نتائج الطالبة':          'Student Results',
    'التقرير الأكاديمي':      'Academic Report',
    'تواصل مع المدرسة':       'Contact School',

    // ══ Emiratisation ══
    'نسبة التوطين الفعلية':    'Actual Emiratisation Rate',
    'الكادر المواطن':          'National Staff',
    'الكادر غير المواطن':      'Non-National Staff',
    'الكادر الكلي':            'Total Staff',
    'نسبة التوطين':            'Emiratisation Rate',
    'عدد المواطنين':           'National Count',
    'التوطين':                 'Emiratisation',
    'طلب تعيين كادر':          'Staff Appointment Request',
    'طلب إعفاء من التوطين':    'Emiratisation Exemption Request',
    'تقرير التوطين':           'Emiratisation Report',
    'حاسبة Nafis':             'Nafis Calculator',
    'الطاقة القصوى':           'Maximum Capacity',
    'الهدف السنوي':            'Annual Target',
    'المدفوع فعلياً':          'Actually Paid',
    'الغرامة الشهرية':         'Monthly Penalty',
    'الغرامة السنوية المتوقعة': 'Expected Annual Penalty',
    'التواصل الرسمي':          'Official Communication',
    'بريد رسمي':               'Official Email',
    'تاريخ الطلب':             'Request Date',
    'حالة الطلب':              'Request Status',
    'الجهة المعنية':           'Relevant Authority',
    'الجهة المستلمة':          'Receiving Authority',

    // ══ Smart Import ══
    'استيراد ذكي':             'Smart Import',
    'استيراد البيانات':        'Data Import',
    'تحميل ملف':               'Upload File',
    'معاينة البيانات':         'Data Preview',
    'تأكيد الاستيراد':         'Confirm Import',
    'خطأ في الاستيراد':        'Import Error',
    'تم الاستيراد بنجاح':      'Import Successful',

    // ══ Common UI ══
    'السنة الأكاديمية':        'Academic Year',
    'الفصل الدراسي':           'Semester',
    'الأسبوع الدراسي':         'Academic Week',
    'فلتر':                    'Filter',
    'إجمالي':                  'Total',
    'تحديث البيانات':          'Refresh Data',
    'نعم':                     'Yes',
    'لا':                      'No',

    // ══ News/Broadcasts ══
    'أخبار EduOS':             'EduOS News',
    'إعلان':                   'Announcement',
    'تذكير':                   'Reminder',
    'رسالة':                   'Message',
    'إشعار':                   'Notification',

    // ══ With definite article ══
    'الأكاديمي':               'Academic',
    'الأكاديمية':              'Academic',
    'الإدارة':                 'Administration',
    'المدير':                  'Principal',
    'المديرة':                 'Principal',
    'المعلم':                  'Teacher',
    'المعلمة':                 'Teacher',
    'الطالب':                  'Student',
    'الطالبة':                 'Student',
    'الطلاب':                  'Students',
    'الطلبة':                  'Students',
    'المنظومة':                'Module',
    'المنظومات':               'Modules',
    'منظومات':                 'Modules',
    'منظومة':                  'Module',
    'الأسبوع':                 'Week',
    'المهام':                  'Tasks',
    'الاختبارات':              'Exams',
    'الميزانية':               'Budget',
    'المكتبة':                 'Library',
    'الإذاعة':                 'Broadcasting',

    // ══ Principal OS ══
    'ملخص اليوم':              'Day Summary',
    'حالات حرجة':              'Critical Cases',
    'طلبات معلقة':             'Pending Requests',
    'نسبة الحضور':             'Attendance Rate',
    'متوسط الدرجات':           'Grades Average',
    'تقرير يومي':              'Daily Report',
    'تقرير أسبوعي':            'Weekly Report',
    'تقرير شهري':              'Monthly Report',
    'تنبيهات ذكية':            'Smart Alerts',
    'رؤية المدرسة':            'School Vision',
    'خطة التحسين':             'Improvement Plan',
    'مؤشرات الأداء':           'Performance Indicators',

    // ══ Teacher OS ══
    'طالباتي':                 'My Students',
    'طلابي':                   'My Students',
    'حصصي':                   'My Periods',
    'جدولي':                   'My Schedule',
    'رصد الدرجات':             'Grade Entry',
    'تحضير الطلاب':            'Student Attendance',
    'بطاقات الخروج':           'Exit Tickets',
    'أسلوب التعلم':            'Learning Style',
    'الحصة الذكية':            'Smart Lesson',
    'الذكاء الاصطناعي':        'Artificial Intelligence',
    'مساعد AI':               'AI Assistant',
    'المساعد الذكي':           'AI Assistant',
    'تحليل AI':               'AI Analysis',

    // ══ Student OS ══
    'درجاتي':                  'My Grades',
    'حضوري':                   'My Attendance',
    'جدولي':                   'My Schedule',
    'إنجازاتي':                'My Achievements',
    'رسائلي':                  'My Messages',
    'محفظتي':                  'My Portfolio',

    // ══ Social Worker OS ══
    'الحالات الاجتماعية':      'Social Cases',
    'حالة جديدة':              'New Case',
    'متابعة الحالات':          'Case Follow-up',
    'تقرير الحالة':            'Case Report',
    'خطة التدخل':              'Intervention Plan',

    // ══ Messages ══
    'إرسال رسالة':             'Send Message',
    'رسائل واردة':             'Inbox',
    'رسائل صادرة':             'Sent',
    'مسودات':                  'Drafts',
    'أولوية عالية':            'High Priority',
    'أولوية عادية':            'Normal Priority',
    'غير مقروءة':              'Unread',

    // ══ Settings ══
    'إعدادات عامة':            'General Settings',
    'الأمان':                  'Security',
    'النسخ الاحتياطي':         'Backup',
    'تغيير كلمة المرور':       'Change Password',
    'كلمة المرور الحالية':     'Current Password',
    'كلمة المرور الجديدة':     'New Password',
    'تأكيد كلمة المرور':       'Confirm Password',
    'الثيم':                   'Theme',
    'اللغة':                   'Language',
    'الإشعارات':               'Notifications',
    'حفظ الإعدادات':           'Save Settings',

    // ══ Inspection ══
    'تقرير التفتيش':           'Inspection Report',
    'درجة المؤشر':             'Indicator Score',
    'مستوى الأداء':            'Performance Level',
    'جاهزية المدرسة':          'School Readiness',
    'ملاحظات المفتش':          'Inspector Notes',

    // ══ Financial ══
    'الميزانية الكلية':        'Total Budget',
    'المصروفات':               'Expenses',
    'الرصيد المتبقي':          'Remaining Balance',
    'فئة المصروف':             'Expense Category',
    'تقرير مالي':              'Financial Report',
    'إضافة مصروف':             'Add Expense',

    // ══ Atheer ══
    'أثير':                    'Atheer',
    'إشارات سلوكية':           'Behavioural Signals',
    'نمط سلوكي':               'Behavioural Pattern',
    'خطر منخفض':               'Low Risk',
    'خطر متوسط':               'Medium Risk',
    'خطر مرتفع':               'High Risk',
    'يحتاج متابعة':            'Needs Follow-up',

    // ══ Demo / Bootcamp ══
    'تجربة الزائر':            'Visitor Experience',
    'مسمى وظيفي':              'Job Title',
    'تسجيل ذاتي':              'Self Registration',
    'تفاعلي':                  'Interactive',
    'معسكر صندوق خليفة':       'Khalifa Fund Bootcamp',
    'بوابة الزائر':            'Visitor Portal',

    // ══ Sub Teacher ══
    'معلم بديل':               'Substitute Teacher',
    'تاريخ بداية العقد':       'Contract Start Date',
    'تاريخ نهاية العقد':       'Contract End Date',
    'تمديد العقد':             'Extend Contract',
    'إنشاء حساب':              'Create Account',
    'رابط الترحيب':            'Welcome Link',

    // ══ General Misc ══
    'تربية وطنية':             'National Education',
    'نعم':                     'Yes',
    'لا':                      'No',
    'منذ':                     'since',
    'حتى':                     'until',
    'من':                      'from',
    'إلى':                     'to',
    'في':                      'in',
    'خلال':                    'during',
    'بواسطة':                  'by',
    'مع':                      'with',
    'بدون':                    'without',
    'كل':                      'all',
    'هذا':                     'this',
    'هذه':                     'this',
    'الكل':                    'All',
    'المزيد':                  'More',
    'تعلم المزيد':             'Learn More',
  };

  // ─── Regex Patterns for dynamic text ──────────────────────────────────
  // Each: { pattern: RegExp, replace: string | function }
  const PATTERNS = [
    // "الأسبوع 3" → "Week 3"
    { pattern: /الأسبوع\s+(\d+)/g, replace: (m, n) => `Week ${n}` },
    // "الفصل الأول/الثاني/الثالث" handled in PHRASES above
    // "X منظومة" / "X منظومات"
    { pattern: /(\d+)\s+منظومات/g, replace: (m, n) => `${n} Modules` },
    { pattern: /(\d+)\s+منظومة/g,  replace: (m, n) => `${n} Module` },
    // "منظومتان"
    { pattern: /منظومتان/g, replace: '2 Modules' },
    // "X طالبة/طالب"
    { pattern: /(\d+)\s+طالبة/g, replace: (m, n) => `${n} Students` },
    { pattern: /(\d+)\s+طالب/g,  replace: (m, n) => `${n} Students` },
    // "X موظف/موظفة"
    { pattern: /(\d+)\s+موظفة/g, replace: (m, n) => `${n} Staff` },
    { pattern: /(\d+)\s+موظف/g,  replace: (m, n) => `${n} Staff` },
    // "X تنبيه/تنبيهات"
    { pattern: /(\d+)\s+تنبيهات/g, replace: (m, n) => `${n} Alerts` },
    { pattern: /(\d+)\s+تنبيه/g,   replace: (m, n) => `${n} Alert` },
    // "العام الدراسي 2025-2026" → "Academic Year 2025-2026"
    { pattern: /العام الدراسي\s+([\d\-\/]+)/g, replace: (m, y) => `Academic Year ${y}` },
    // "الفصل X — YYYY-YYYY"
    { pattern: /الفصل\s+(الأول|الثاني|الثالث)\s*[—–-]\s*([\d\-\/]+)/g,
      replace: (m, s, y) => {
        const sm = {الأول:'1', الثاني:'2', الثالث:'3'};
        return `Semester ${sm[s]||s} — ${y}`;
      }
    },
    // "الأسبوع X" in header badge
    { pattern: /الأسبوع\s+([\u0660-\u0669\d]+)/g, replace: (m, n) => `Week ${n}` },
  ];

  // ─── Store originals ────────────────────────────────────────────────────
  const _originals = new WeakMap();
  const _attrOriginals = new WeakMap();

  // ─── Core Engine ───────────────────────────────────────────────────────
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

      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());

      document.documentElement.lang = lang;
      document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
      this._applyDictKeys();
      this._applyDataPairs();
      this._applyPhrases();
      this._applyAttrs();
      this._updateToggleBtn();

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

    // Layer 3+4: phrase scan + regex patterns
    _applyPhrases() {
      if (this.current === 'ar') {
        this._restoreOriginals();
        return;
      }
      // Sort phrases by length descending (longest first = more specific)
      this._phrasesSorted = this._phrasesSorted ||
        Object.keys(PHRASES_RAW).sort((a, b) => b.length - a.length);
      this._scanAndReplace(document.body);
    },

    _scanAndReplace(root) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const tag = node.parentElement && node.parentElement.tagName;
            if (!tag) return NodeFilter.FILTER_REJECT;
            if (['SCRIPT','STYLE','NOSCRIPT'].includes(tag)) return NodeFilter.FILTER_REJECT;
            if (node.parentElement && node.parentElement.closest(
              '#eduos-lang-toggle,#eduos-lang-float,#eduos-lang-btn'
            )) return NodeFilter.FILTER_REJECT;
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

        // Step 1: exact match (fastest)
        if (PHRASES_RAW[trimmed]) {
          if (!_originals.has(node)) _originals.set(node, orig);
          node.textContent = PHRASES_RAW[trimmed];
          return;
        }

        let replaced = orig;
        let changed = false;

        // Step 2: phrase partial match — longest first, simple indexOf
        for (const ar of this._phrasesSorted) {
          if (!replaced.includes(ar)) continue;
          // Replace all occurrences of this phrase
          let pos = 0;
          let out = '';
          let found = false;
          while (true) {
            const idx = replaced.indexOf(ar, pos);
            if (idx === -1) { out += replaced.slice(pos); break; }
            out += replaced.slice(pos, idx) + PHRASES_RAW[ar];
            pos = idx + ar.length;
            found = true;
          }
          if (found) { replaced = out; changed = true; }
        }

        // Step 3: regex patterns for dynamic text
        for (const p of PATTERNS) {
          p.pattern.lastIndex = 0;
          const next = replaced.replace(p.pattern, p.replace);
          if (next !== replaced) { replaced = next; changed = true; }
        }

        if (changed) {
          if (!_originals.has(node)) _originals.set(node, orig);
          node.textContent = replaced;
        }
      });
    },

    _restoreOriginals() {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (_originals.has(n)) n.textContent = _originals.get(n);
      }
    },

    // Translate placeholder / title / alt / aria-label
    _applyAttrs() {
      const attrMap = {
        'ابحث عن منظومة...':                   'Search for a module...',
        'اسم المستخدم أو البريد الإلكتروني':   'Username or email',
        'كلمة المرور':                          'Password',
        'بحث...':                               'Search...',
        'أدخل ملاحظاتك...':                    'Enter your notes...',
        'أدخل...':                              'Enter...',
        'تسجيل الخروج':                         'Logout',
        'أضف تعليقاً...':                       'Add a comment...',
        'اكتب رسالتك...':                       'Write your message...',
        'ابحث...':                              'Search...',
        'اختر...':                              'Select...',
        'أدخل اسم المستخدم':                    'Enter username',
        'أدخل كلمة المرور':                     'Enter password',
        'ابحث عن طالب...':                      'Search for a student...',
        'ابحث عن موظف...':                      'Search for a staff member...',
        'اكتب هنا...':                          'Write here...',
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

    // ─── Toggle Button ────────────────────────────────────────────────────
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

    // ─── Update all internal links to preserve ?lang=en ──────────────────
    _patchLink(a) {
      const host = window.location.hostname;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.hostname !== host && url.hostname !== '') return;
        if (!url.searchParams.has('lang')) {
          url.searchParams.set('lang', 'en');
          a.setAttribute('href', url.pathname + '?' + url.searchParams.toString() + (url.hash || ''));
        }
      } catch(e) {}
    },

    _updateLinks() {
      if (this.current !== 'en') return;
      document.querySelectorAll('a[href]').forEach(a => this._patchLink(a));
    },

    _startLinkObserver() {
      if (this.current !== 'en') return;
      if (this._linkObserver) return; // already running
      this._linkObserver = new MutationObserver(mutations => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'A') this._patchLink(node);
            node.querySelectorAll && node.querySelectorAll('a[href]').forEach(a => this._patchLink(a));
          });
        });
      });
      this._linkObserver.observe(document.body, { childList: true, subtree: true });
    },

    autoInjectToggle() {
      if (document.getElementById('eduos-lang-float') || document.getElementById('eduos-lang-toggle')) {
        this._updateToggleBtn();
        return;
      }
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
      const btn = this._createToggleBtn();
      btn.id = 'eduos-lang-float';
      document.body.appendChild(btn);
    },

    init() {
      this._injectStyles();
      this.current = detectLang();
      document.documentElement.lang = this.current;
      document.documentElement.dir  = this.current === 'ar' ? 'rtl' : 'ltr';

      const run = () => {
        this._applyDictKeys();
        this._applyDataPairs();
        if (this.current === 'en') {
          this._applyPhrases();
          this._applyAttrs();
          this._updateLinks();
        }
        this.autoInjectToggle();
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
      } else {
        run();
      }

      // Re-apply after dynamic content loads (Supabase data, etc.)
      if (this.current === 'en') {
        setTimeout(() => {
          if (this.current === 'en') { this._applyPhrases(); this._updateLinks(); }
        }, 1500);
        setTimeout(() => {
          if (this.current === 'en') { this._applyPhrases(); this._updateLinks(); }
        }, 3500);
      }
    },

    _injectStyles() {
      if (document.getElementById('eduos-lang-styles')) return;
      const style = document.createElement('style');
      style.id = 'eduos-lang-styles';
      style.textContent = `
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
        [dir="ltr"] #eduos-lang-float {
          left: auto;
          right: 16px;
        }
      `;
      document.head.appendChild(style);
    }
  };

  window.EduLang = EduLang;
  window.t = (key, fallback) => EduLang.t(key, fallback);

  EduLang.init();

})();
