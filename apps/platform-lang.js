/**
 * platform-lang.js v1.0
 * EduOS Bilingual Engine — Arabic / English
 * NAFAS FOR ARTIFICIAL INTELLIGENCE © 2026
 * 
 * Usage:
 *   <script src="../platform-lang.js"></script>
 *   <span data-i18n="key"></span>
 *   or in JS: t('key')
 *
 * Language detection: URL param ?lang=ar|en → browser language → default AR
 * Language toggle: EduLang.setLang('en') | EduLang.setLang('ar')
 */

(function () {
  'use strict';

  // ─── Dictionary ───────────────────────────────────────────────────────────
  const DICT = {

    // ── Common ──────────────────────────────────────────────────────────────
    'app.name':            { ar: 'الجود', en: 'AlJood' },
    'app.subtitle':        { ar: 'منصة الإدارة التعليمية الذكية', en: 'Smart Educational Management Platform' },
    'btn.logout':          { ar: 'خروج', en: 'Logout' },
    'btn.back':            { ar: 'رجوع', en: 'Back' },
    'btn.save':            { ar: 'حفظ', en: 'Save' },
    'btn.cancel':          { ar: 'إلغاء', en: 'Cancel' },
    'btn.export':          { ar: 'تصدير', en: 'Export' },
    'btn.export.pdf':      { ar: '📄 تصدير PDF', en: '📄 Export PDF' },
    'btn.print':           { ar: '🖨️ طباعة', en: '🖨️ Print' },
    'btn.refresh':         { ar: '🔄 تحديث', en: '🔄 Refresh' },
    'btn.search':          { ar: 'بحث', en: 'Search' },
    'btn.add':             { ar: 'إضافة', en: 'Add' },
    'btn.edit':            { ar: 'تعديل', en: 'Edit' },
    'btn.delete':          { ar: 'حذف', en: 'Delete' },
    'btn.view':            { ar: 'عرض', en: 'View' },
    'btn.close':           { ar: 'إغلاق', en: 'Close' },
    'btn.confirm':         { ar: 'تأكيد', en: 'Confirm' },
    'btn.details':         { ar: 'تفاصيل', en: 'Details' },
    'lbl.loading':         { ar: 'جارٍ التحميل...', en: 'Loading...' },
    'lbl.nodata':          { ar: 'لا توجد بيانات', en: 'No data available' },
    'lbl.error':           { ar: 'خطأ في التحميل', en: 'Loading error' },
    'lbl.success':         { ar: '✅ تم بنجاح', en: '✅ Done successfully' },
    'lbl.total':           { ar: 'المجموع', en: 'Total' },
    'lbl.average':         { ar: 'المتوسط', en: 'Average' },
    'lbl.name':            { ar: 'الاسم', en: 'Name' },
    'lbl.grade':           { ar: 'الصف', en: 'Grade' },
    'lbl.class':           { ar: 'الفصل', en: 'Class' },
    'lbl.score':           { ar: 'الدرجة', en: 'Score' },
    'lbl.status':          { ar: 'الحالة', en: 'Status' },
    'lbl.date':            { ar: 'التاريخ', en: 'Date' },
    'lbl.time':            { ar: 'الوقت', en: 'Time' },
    'lbl.notes':           { ar: 'ملاحظات', en: 'Notes' },
    'lbl.phone':           { ar: 'رقم الهاتف', en: 'Phone Number' },
    'lbl.email':           { ar: 'البريد الإلكتروني', en: 'Email' },
    'lbl.gender':          { ar: 'الجنس', en: 'Gender' },
    'lbl.male':            { ar: 'ذكر', en: 'Male' },
    'lbl.female':          { ar: 'أنثى', en: 'Female' },
    'lbl.yes':             { ar: 'نعم', en: 'Yes' },
    'lbl.no':              { ar: 'لا', en: 'No' },
    'lbl.all':             { ar: 'الكل', en: 'All' },
    'lbl.week':            { ar: 'الأسبوع', en: 'Week' },
    'lbl.semester':        { ar: 'الفصل', en: 'Semester' },
    'lbl.year':            { ar: 'العام الدراسي', en: 'Academic Year' },
    'lbl.present':         { ar: 'حاضر', en: 'Present' },
    'lbl.absent':          { ar: 'غائب', en: 'Absent' },
    'lbl.late':            { ar: 'متأخر', en: 'Late' },
    'lbl.students':        { ar: 'الطلاب', en: 'Students' },
    'lbl.teachers':        { ar: 'المعلمون', en: 'Teachers' },
    'lbl.staff':           { ar: 'الموظفون', en: 'Staff' },
    'lbl.principal':       { ar: 'المدير', en: 'Principal' },
    'lbl.parent':          { ar: 'ولي الأمر', en: 'Parent/Guardian' },
    'lbl.subject':         { ar: 'المادة', en: 'Subject' },
    'lbl.pass':            { ar: 'ناجح', en: 'Pass' },
    'lbl.fail':            { ar: 'راسب', en: 'Fail' },
    'lbl.excellent':       { ar: 'ممتاز', en: 'Excellent' },
    'lbl.good':            { ar: 'جيد', en: 'Good' },
    'lbl.satisfactory':    { ar: 'مقبول', en: 'Satisfactory' },
    'lbl.ai':              { ar: '🤲 المساعد الذكي', en: '🤲 AI Assistant' },
    'lbl.school.name':     { ar: 'مدرسة الجود', en: 'AlJood School' },
    'lbl.school.id':       { ar: 'الرقم الرسمي', en: 'Official ID' },
    'lbl.student.no':      { ar: 'رقم الطالب', en: 'Student No.' },
    'lbl.national.id':     { ar: 'الرقم الوطني', en: 'National ID' },

    // ── Navigation / Modules ────────────────────────────────────────────────
    'nav.hub':             { ar: 'الرئيسية', en: 'Home' },
    'nav.principal':       { ar: 'داشبورد الإدارة', en: 'Principal Dashboard' },
    'nav.teacher':         { ar: 'داشبورد المعلم', en: 'Teacher Dashboard' },
    'nav.student':         { ar: 'بوابة الطالب', en: 'Student Portal' },
    'nav.parent':          { ar: 'بوابة ولي الأمر', en: 'Parent Portal' },
    'nav.inspection':      { ar: 'بوابة التفتيش', en: 'Inspection Portal' },
    'nav.analytics':       { ar: 'التحليلات', en: 'Analytics' },
    'nav.timetable':       { ar: 'الجدول الدراسي', en: 'Timetable' },
    'nav.attendance':      { ar: 'الحضور والغياب', en: 'Attendance' },
    'nav.achievements':    { ar: 'الإنجازات', en: 'Achievements' },
    'nav.inclusion':       { ar: 'الدمج والتربية الخاصة', en: 'Inclusion & Special Ed.' },
    'nav.library':         { ar: 'المكتبة', en: 'Library' },
    'nav.cafeteria':       { ar: 'الكافيتيريا', en: 'Cafeteria' },
    'nav.transport':       { ar: 'النقل المدرسي', en: 'Transport' },
    'nav.maintenance':     { ar: 'الصيانة', en: 'Maintenance' },
    'nav.financial':       { ar: 'الشؤون المالية', en: 'Financial' },
    'nav.events':          { ar: 'الفعاليات', en: 'Events' },
    'nav.exam':            { ar: 'الاختبارات', en: 'Exams' },
    'nav.leaves':          { ar: 'الإجازات', en: 'Leaves' },
    'nav.settings':        { ar: 'الإعدادات', en: 'Settings' },
    'nav.security':        { ar: 'الأمن والسلامة', en: 'Security' },
    'nav.nurse':           { ar: 'التمريض', en: 'Nurse' },
    'nav.social':          { ar: 'الخدمة الاجتماعية', en: 'Social Work' },
    'nav.broadcasting':    { ar: 'الإذاعة المدرسية', en: 'Broadcasting' },
    'nav.kg':              { ar: 'رياض الأطفال', en: 'Kindergarten' },
    'nav.lab':             { ar: 'المختبر الذكي', en: 'Smart Lab' },
    'nav.exit.ticket':     { ar: 'بطاقة الخروج', en: 'Exit Ticket' },

    // ── Inspection Portal ────────────────────────────────────────────────────
    'insp.title':          { ar: '🔍 بوابة التفتيش المدرسي', en: '🔍 School Inspection Portal' },
    'insp.subtitle':       { ar: 'بيانات شاملة جاهزة لأي تفتيش وزاري', en: 'Comprehensive data ready for any ministerial inspection' },
    'insp.prepared':       { ar: 'مُعَدَّة بواسطة', en: 'Prepared by' },
    'insp.date':           { ar: 'تاريخ التقرير', en: 'Report Date' },
    'insp.card.academic':  { ar: '📊 الأداء الأكاديمي', en: '📊 Academic Performance' },
    'insp.card.attend':    { ar: '📋 الحضور والانضباط', en: '📋 Attendance & Discipline' },
    'insp.card.inclusion': { ar: '♿ الدمج والتربية الخاصة', en: '♿ Inclusion & Special Ed.' },
    'insp.card.staff':     { ar: '👩‍🏫 الكوادر التعليمية', en: '👩‍🏫 Teaching Staff' },
    'insp.card.welfare':   { ar: '❤️ الرعاية والسلامة', en: '❤️ Welfare & Safety' },
    'insp.card.schedule':  { ar: '🗓️ الجدول الدراسي', en: '🗓️ Schedule & Curriculum' },
    'insp.card.dev':       { ar: '📈 التطوير المهني', en: '📈 Professional Development' },
    'insp.card.profile':   { ar: '🏫 هوية المدرسة', en: '🏫 School Profile' },
    'insp.export.all':     { ar: '📄 تصدير تقرير التفتيش الكامل', en: '📄 Export Full Inspection Report' },
    'insp.students.total': { ar: 'إجمالي الطلاب', en: 'Total Students' },
    'insp.staff.total':    { ar: 'إجمالي الكوادر', en: 'Total Staff' },
    'insp.pass.rate':      { ar: 'نسبة النجاح', en: 'Pass Rate' },
    'insp.attend.rate':    { ar: 'نسبة الحضور', en: 'Attendance Rate' },
    'insp.inclusion.plans':{ ar: 'خطط الدمج النشطة', en: 'Active Inclusion Plans' },
    'insp.pdp.active':     { ar: 'خطط تطوير نشطة', en: 'Active PDP Plans' },
    'insp.nurse.visits':   { ar: 'زيارات التمريض (هذا الشهر)', en: 'Nurse Visits (This Month)' },
    'insp.social.cases':   { ar: 'الحالات الاجتماعية النشطة', en: 'Active Social Cases' },
    'insp.grade.dist':     { ar: 'توزيع الدرجات حسب المادة', en: 'Grade Distribution by Subject' },
    'insp.attend.trend':   { ar: 'مسار الحضور الأسبوعي', en: 'Weekly Attendance Trend' },
    'insp.framework':      { ar: 'إطار التقييم', en: 'Assessment Framework' },
    'insp.section.school': { ar: '🏫 بيانات المدرسة', en: '🏫 School Information' },
    'insp.section.acad':   { ar: '📊 البيانات الأكاديمية', en: '📊 Academic Data' },
    'insp.section.safe':   { ar: '🛡️ السلامة والرفاهية', en: '🛡️ Safety & Wellbeing' },
    'insp.section.staff':  { ar: '👩‍🏫 بيانات الكوادر', en: '👩‍🏫 Staff Data' },
    'insp.ready':          { ar: '✅ جاهز للتفتيش', en: '✅ Ready for Inspection' },
    'insp.level':          { ar: 'المرحلة الدراسية', en: 'School Level' },
    'insp.gender':         { ar: 'الجنس', en: 'Gender' },
    'insp.city':           { ar: 'المدينة', en: 'City' },
    'insp.region':         { ar: 'المنطقة التعليمية', en: 'Education Region' },

    // ── Teacher Dashboard ────────────────────────────────────────────────────
    'tchr.title':          { ar: 'داشبورد المعلم', en: 'Teacher Dashboard' },
    'tchr.welcome':        { ar: 'أهلاً بك', en: 'Welcome' },
    'tchr.myclass':        { ar: 'صفوفي', en: 'My Classes' },
    'tchr.grades':         { ar: 'الدرجات', en: 'Grades' },
    'tchr.attendance':     { ar: 'الحضور', en: 'Attendance' },
    'tchr.assignments':    { ar: 'الواجبات', en: 'Assignments' },
    'tchr.reports':        { ar: 'التقارير', en: 'Reports' },
    'tchr.resources':      { ar: 'الموارد التعليمية', en: 'Teaching Resources' },
    'tchr.smart.lesson':   { ar: 'الحصة الذكية', en: 'Smart Lesson' },
    'tchr.effort':         { ar: 'الجهد', en: 'Effort' },
    'tchr.worksheet':      { ar: 'ورقة العمل', en: 'Worksheet' },
    'tchr.project':        { ar: 'المشروع', en: 'Project' },
    'tchr.g3':             { ar: 'G3', en: 'G3' },
    'tchr.g4':             { ar: 'G4', en: 'G4' },
    'tchr.sb1':            { ar: 'SB1', en: 'SB1' },
    'tchr.students.count': { ar: 'عدد الطلاب', en: 'Students Count' },
    'tchr.class.avg':      { ar: 'متوسط الصف', en: 'Class Average' },

    // ── Parent Portal ────────────────────────────────────────────────────────
    'prnt.title':          { ar: 'بوابة ولي الأمر', en: 'Parent Portal' },
    'prnt.welcome':        { ar: 'أهلاً بك في بوابة ولي الأمر', en: 'Welcome to the Parent Portal' },
    'prnt.child':          { ar: 'نجل / نجلة', en: 'Child' },
    'prnt.children':       { ar: 'الأبناء', en: 'Children' },
    'prnt.academic':       { ar: 'الأداء الأكاديمي', en: 'Academic Performance' },
    'prnt.attendance':     { ar: 'سجل الحضور', en: 'Attendance Record' },
    'prnt.messages':       { ar: 'الرسائل', en: 'Messages' },
    'prnt.schedule':       { ar: 'الجدول الدراسي', en: 'Class Schedule' },
    'prnt.events':         { ar: 'الفعاليات القادمة', en: 'Upcoming Events' },
    'prnt.login.title':    { ar: 'تسجيل الدخول — ولي الأمر', en: 'Login — Parent/Guardian' },
    'prnt.login.id':       { ar: 'الرقم الوطني', en: 'National ID' },
    'prnt.login.phone':    { ar: 'رقم الهاتف (كلمة المرور)', en: 'Phone Number (Password)' },
    'prnt.login.btn':      { ar: 'دخول', en: 'Sign In' },
    'prnt.grades.term1':   { ar: 'الفصل الأول', en: 'Semester 1' },
    'prnt.grades.term2':   { ar: 'الفصل الثاني', en: 'Semester 2' },
    'prnt.grades.final':   { ar: 'النهائي', en: 'Final' },
    'prnt.child.switch':   { ar: 'تبديل الابن/البنت', en: 'Switch Child' },

    // ── Principal Dashboard ──────────────────────────────────────────────────
    'prin.title':          { ar: 'داشبورد الإدارة', en: 'Principal Dashboard' },
    'prin.overview':       { ar: 'نظرة عامة', en: 'Overview' },
    'prin.daily':          { ar: 'اليوم الدراسي', en: 'School Day' },
    'prin.alerts':         { ar: 'التنبيهات', en: 'Alerts' },
    'prin.quick':          { ar: 'الإجراءات السريعة', en: 'Quick Actions' },
    'prin.staff.attend':   { ar: 'حضور الموظفين', en: 'Staff Attendance' },
    'prin.student.attend': { ar: 'حضور الطلاب', en: 'Student Attendance' },
    'prin.today.absent':   { ar: 'غائبون اليوم', en: "Today's Absentees" },
    'prin.maintenance':    { ar: 'طلبات الصيانة', en: 'Maintenance Requests' },
    'prin.visitors':       { ar: 'الزوار', en: 'Visitors' },

    // ── Student Portal ───────────────────────────────────────────────────────
    'stud.title':          { ar: 'بوابة الطالب', en: 'Student Portal' },
    'stud.welcome':        { ar: 'أهلاً بك', en: 'Welcome' },
    'stud.mygrades':       { ar: 'درجاتي', en: 'My Grades' },
    'stud.myattend':       { ar: 'حضوري', en: 'My Attendance' },
    'stud.myschedule':     { ar: 'جدولي', en: 'My Schedule' },
    'stud.myportfolio':    { ar: 'ملفي الإنجازي', en: 'My Portfolio' },
    'stud.ai.tutor':       { ar: '🤲 المعلم الذكي', en: '🤲 AI Tutor' },
    'stud.login.title':    { ar: 'تسجيل الدخول — الطالب', en: 'Student Login' },
    'stud.login.id':       { ar: 'رقم الطالب', en: 'Student Number' },
    'stud.login.pass':     { ar: 'كلمة المرور', en: 'Password' },
    'stud.login.btn':      { ar: 'دخول', en: 'Sign In' },

    // ── Analytics ────────────────────────────────────────────────────────────
    'anlx.title':          { ar: 'التحليلات والتقارير', en: 'Analytics & Reports' },
    'anlx.performance':    { ar: 'أداء المدرسة', en: 'School Performance' },
    'anlx.compare':        { ar: 'مقارنة بالأسابيع', en: 'Weekly Comparison' },
    'anlx.top':            { ar: 'الأوائل', en: 'Top Performers' },
    'anlx.risk':           { ar: 'الطلاب في خطر', en: 'At-Risk Students' },
    'anlx.subjects':       { ar: 'أداء المواد', en: 'Subject Performance' },
    'anlx.trend':          { ar: 'المسار العام', en: 'Overall Trend' },
    'anlx.export':         { ar: 'تصدير التقرير', en: 'Export Report' },

    // ── Attendance ───────────────────────────────────────────────────────────
    'att.gate.title':      { ar: 'بوابة الحضور الذكية', en: 'Smart Attendance Gate' },
    'att.qr.scan':         { ar: 'امسح الرمز للتحقق', en: 'Scan QR to Verify' },
    'att.qr.refresh':      { ar: 'يتجدد كل 60 ثانية', en: 'Refreshes every 60 seconds' },
    'att.checkin':         { ar: 'تسجيل الحضور', en: 'Check In' },
    'att.checkout':        { ar: 'تسجيل الانصراف', en: 'Check Out' },
    'att.location':        { ar: 'التحقق من الموقع', en: 'Location Verification' },
    'att.success':         { ar: '✅ تم تسجيل الحضور', en: '✅ Attendance Recorded' },

    // ── Inclusion ────────────────────────────────────────────────────────────
    'incl.title':          { ar: 'الدمج والتربية الخاصة', en: 'Inclusion & Special Education' },
    'incl.plans':          { ar: 'الخطط الفردية', en: 'Individual Plans' },
    'incl.students':       { ar: 'طلاب الهمم', en: 'Students of Determination' },
    'incl.support':        { ar: 'مستوى الدعم', en: 'Support Level' },
    'incl.goals':          { ar: 'الأهداف', en: 'Goals' },
    'incl.progress':       { ar: 'التقدم', en: 'Progress' },
    'incl.category':       { ar: 'الفئة', en: 'Category' },

    // ── School Settings ──────────────────────────────────────────────────────
    'set.title':           { ar: 'إعدادات المدرسة', en: 'School Settings' },
    'set.general':         { ar: 'الإعدادات العامة', en: 'General Settings' },
    'set.academic':        { ar: 'الإعدادات الأكاديمية', en: 'Academic Settings' },
    'set.security':        { ar: 'الأمان', en: 'Security' },
    'set.backup':          { ar: '💾 تحميل نسخة احتياطية', en: '💾 Download Backup' },
    'set.widgets':         { ar: 'الأقسام المخصصة', en: 'Custom Widgets' },
    'set.notifications':   { ar: 'الإشعارات', en: 'Notifications' },
    'set.integrations':    { ar: 'التكاملات', en: 'Integrations' },
    'set.logo':            { ar: 'شعار المدرسة', en: 'School Logo' },
    'set.theme':           { ar: 'المظهر', en: 'Theme' },
    'set.language':        { ar: 'اللغة', en: 'Language' },
    'set.timezone':        { ar: 'المنطقة الزمنية', en: 'Timezone' },
    'set.attendance.geo':  { ar: 'نطاق الجغرافي (متر)', en: 'Geofence Radius (m)' },
    'set.qr.interval':     { ar: 'تجديد QR (ثانية)', en: 'QR Refresh (seconds)' },

    // ── Events / Calendar ────────────────────────────────────────────────────
    'evt.title':           { ar: 'الفعاليات والتقويم', en: 'Events & Calendar' },
    'evt.add':             { ar: 'إضافة فعالية', en: 'Add Event' },
    'evt.type':            { ar: 'نوع الفعالية', en: 'Event Type' },
    'evt.location':        { ar: 'المكان', en: 'Location' },
    'evt.audience':        { ar: 'الجمهور المستهدف', en: 'Target Audience' },
    'evt.holiday':         { ar: 'إجازة', en: 'Holiday' },
    'evt.exam':            { ar: 'اختبار', en: 'Exam' },
    'evt.activity':        { ar: 'نشاط', en: 'Activity' },
    'evt.meeting':         { ar: 'اجتماع', en: 'Meeting' },

    // ── Library ──────────────────────────────────────────────────────────────
    'lib.title':           { ar: 'المكتبة المدرسية', en: 'School Library' },
    'lib.resources':       { ar: 'الموارد', en: 'Resources' },
    'lib.loans':           { ar: 'الاستعارات', en: 'Loans' },
    'lib.available':       { ar: 'متاح', en: 'Available' },
    'lib.borrowed':        { ar: 'مُعار', en: 'Borrowed' },
    'lib.return.date':     { ar: 'تاريخ الإعادة', en: 'Return Date' },
    'lib.category':        { ar: 'الفئة', en: 'Category' },

    // ── Cafeteria ────────────────────────────────────────────────────────────
    'caf.title':           { ar: 'الكافيتيريا', en: 'Cafeteria' },
    'caf.menu':            { ar: 'قائمة اليوم', en: "Today's Menu" },
    'caf.order':           { ar: 'الطلبات', en: 'Orders' },
    'caf.price':           { ar: 'السعر', en: 'Price' },
    'caf.calories':        { ar: 'السعرات', en: 'Calories' },
    'caf.available':       { ar: 'متاح', en: 'Available' },

    // ── Transport ────────────────────────────────────────────────────────────
    'trn.title':           { ar: 'النقل المدرسي', en: 'School Transport' },
    'trn.routes':          { ar: 'المسارات', en: 'Routes' },
    'trn.assignments':     { ar: 'التوزيعات', en: 'Assignments' },
    'trn.driver':          { ar: 'السائق', en: 'Driver' },
    'trn.bus':             { ar: 'الحافلة', en: 'Bus' },
    'trn.stop':            { ar: 'المحطة', en: 'Stop' },
    'trn.time':            { ar: 'الوقت', en: 'Time' },

    // ── Nurse ────────────────────────────────────────────────────────────────
    'nur.title':           { ar: 'عيادة المدرسة', en: 'School Clinic' },
    'nur.visits':          { ar: 'الزيارات', en: 'Visits' },
    'nur.complaint':       { ar: 'الشكوى', en: 'Complaint' },
    'nur.treatment':       { ar: 'العلاج', en: 'Treatment' },
    'nur.referred':        { ar: 'تمت الإحالة', en: 'Referred' },
    'nur.chronic':         { ar: 'حالة مزمنة', en: 'Chronic Condition' },

    // ── Social Work ──────────────────────────────────────────────────────────
    'soc.title':           { ar: 'الخدمة الاجتماعية', en: 'Social Work' },
    'soc.cases':           { ar: 'الحالات', en: 'Cases' },
    'soc.case.type':       { ar: 'نوع الحالة', en: 'Case Type' },
    'soc.follow.up':       { ar: 'المتابعة', en: 'Follow-up' },
    'soc.intervention':    { ar: 'التدخل', en: 'Intervention' },
    'soc.confidential':    { ar: '🔒 سري', en: '🔒 Confidential' },

    // ── Security ────────────────────────────────────────────────────────────
    'sec.title':           { ar: 'الأمن والسلامة', en: 'Security & Safety' },
    'sec.visitors':        { ar: 'سجل الزوار', en: 'Visitor Log' },
    'sec.incidents':       { ar: 'الحوادث', en: 'Incidents' },
    'sec.visitor.name':    { ar: 'اسم الزائر', en: 'Visitor Name' },
    'sec.purpose':         { ar: 'الغرض', en: 'Purpose' },
    'sec.entry':           { ar: 'وقت الدخول', en: 'Entry Time' },
    'sec.exit':            { ar: 'وقت الخروج', en: 'Exit Time' },
    'sec.badge':           { ar: 'رقم الشارة', en: 'Badge No.' },

    // ── Financial ────────────────────────────────────────────────────────────
    'fin.title':           { ar: 'الشؤون المالية', en: 'Financial Affairs' },
    'fin.budget':          { ar: 'الميزانية', en: 'Budget' },
    'fin.items':           { ar: 'البنود', en: 'Items' },
    'fin.spent':           { ar: 'المُنفَق', en: 'Spent' },
    'fin.remaining':       { ar: 'المتبقي', en: 'Remaining' },
    'fin.category':        { ar: 'الفئة', en: 'Category' },
    'fin.approved':        { ar: 'مُعتمد', en: 'Approved' },
    'fin.pending':         { ar: 'بانتظار الاعتماد', en: 'Pending Approval' },

    // ── Maintenance ──────────────────────────────────────────────────────────
    'mnt.title':           { ar: 'طلبات الصيانة', en: 'Maintenance Requests' },
    'mnt.new':             { ar: 'طلب جديد', en: 'New Request' },
    'mnt.location':        { ar: 'الموقع', en: 'Location' },
    'mnt.priority':        { ar: 'الأولوية', en: 'Priority' },
    'mnt.urgent':          { ar: 'عاجل', en: 'Urgent' },
    'mnt.normal':          { ar: 'عادي', en: 'Normal' },
    'mnt.open':            { ar: 'مفتوح', en: 'Open' },
    'mnt.closed':          { ar: 'مُغلق', en: 'Closed' },
    'mnt.inprogress':      { ar: 'قيد التنفيذ', en: 'In Progress' },

    // ── Login ────────────────────────────────────────────────────────────────
    'login.username':      { ar: 'اسم المستخدم', en: 'Username' },
    'login.password':      { ar: 'كلمة المرور', en: 'Password' },
    'login.btn':           { ar: 'تسجيل الدخول', en: 'Sign In' },
    'login.error':         { ar: 'بيانات غير صحيحة', en: 'Invalid credentials' },
    'login.loading':       { ar: 'جارٍ التحقق...', en: 'Verifying...' },
    'login.welcome':       { ar: 'مرحباً بك في EduOS', en: 'Welcome to EduOS' },
    'login.subtitle':      { ar: 'منصة الإدارة التعليمية الذكية', en: 'Smart Educational Management Platform' },

    // ── Timetable ────────────────────────────────────────────────────────────
    'tt.title':            { ar: 'الجدول الدراسي', en: 'Timetable' },
    'tt.period':           { ar: 'الحصة', en: 'Period' },
    'tt.day':              { ar: 'اليوم', en: 'Day' },
    'tt.room':             { ar: 'الغرفة', en: 'Room' },
    'tt.sun':              { ar: 'الأحد', en: 'Sunday' },
    'tt.mon':              { ar: 'الاثنين', en: 'Monday' },
    'tt.tue':              { ar: 'الثلاثاء', en: 'Tuesday' },
    'tt.wed':              { ar: 'الأربعاء', en: 'Wednesday' },
    'tt.thu':              { ar: 'الخميس', en: 'Thursday' },

    // ── Achievements ─────────────────────────────────────────────────────────
    'ach.title':           { ar: 'الإنجازات والجوائز', en: 'Achievements & Awards' },
    'ach.award':           { ar: 'الجائزة', en: 'Award' },
    'ach.level':           { ar: 'المستوى', en: 'Level' },
    'ach.national':        { ar: 'وطني', en: 'National' },
    'ach.local':           { ar: 'محلي', en: 'Local' },
    'ach.school':          { ar: 'مدرسي', en: 'School' },
    'ach.winner':          { ar: 'الفائز', en: 'Winner' },

    // ── Staff Leaves ─────────────────────────────────────────────────────────
    'lv.title':            { ar: 'إجازات الموظفين', en: 'Staff Leaves' },
    'lv.request':          { ar: 'طلب إجازة', en: 'Leave Request' },
    'lv.type':             { ar: 'نوع الإجازة', en: 'Leave Type' },
    'lv.from':             { ar: 'من', en: 'From' },
    'lv.to':               { ar: 'إلى', en: 'To' },
    'lv.days':             { ar: 'الأيام', en: 'Days' },
    'lv.approved':         { ar: 'مُعتمدة', en: 'Approved' },
    'lv.pending':          { ar: 'بانتظار الموافقة', en: 'Pending' },
    'lv.rejected':         { ar: 'مرفوضة', en: 'Rejected' },
    'lv.annual':           { ar: 'سنوية', en: 'Annual' },
    'lv.sick':             { ar: 'مرضية', en: 'Sick' },
    'lv.emergency':        { ar: 'طارئة', en: 'Emergency' },

    // ── Hub ──────────────────────────────────────────────────────────────────
    'hub.title':           { ar: 'مركز إدارة EduOS', en: 'EduOS Management Hub' },
    'hub.subtitle':        { ar: 'اختر المنظومة التي تريد الوصول إليها', en: 'Select the module you want to access' },
    'hub.academic.week':   { ar: 'الأسبوع الأكاديمي', en: 'Academic Week' },
    'hub.good.morning':    { ar: 'صباح الخير', en: 'Good Morning' },
    'hub.good.afternoon':  { ar: 'مساء الخير', en: 'Good Afternoon' },

    // ── Autologout ───────────────────────────────────────────────────────────
    'auto.warning':        { ar: 'سيتم تسجيل خروجك تلقائياً بعد', en: 'You will be logged out in' },
    'auto.seconds':        { ar: 'ثانية', en: 'seconds' },
    'auto.stay':           { ar: 'استمرار', en: 'Stay Logged In' },
    'auto.logout':         { ar: 'خروج الآن', en: 'Logout Now' },

    // ── AI Assistant ─────────────────────────────────────────────────────────
    'ai.ask':              { ar: 'اسألني أي سؤال...', en: 'Ask me anything...' },
    'ai.thinking':         { ar: '🤲 يفكر...', en: '🤲 Thinking...' },
    'ai.error':            { ar: 'خطأ في الاتصال بالمساعد الذكي', en: 'AI assistant connection error' },
    'ai.send':             { ar: 'إرسال', en: 'Send' },

    // ── MOTD ─────────────────────────────────────────────────────────────────
    'motd.quran':          { ar: '📖 آية اليوم', en: '📖 Verse of the Day' },
    'motd.hadith':         { ar: '🌙 حديث اليوم', en: '🌙 Hadith of the Day' },
    'motd.dua':            { ar: '🤲 دعاء اليوم', en: '🤲 Dua of the Day' },
    'motd.wisdom':         { ar: '💡 حكمة اليوم', en: '💡 Wisdom of the Day' },
    'motd.close':          { ar: 'إغلاق', en: 'Close' },

    // ── Tour ─────────────────────────────────────────────────────────────────
    'tour.next':           { ar: 'التالي', en: 'Next' },
    'tour.prev':           { ar: 'السابق', en: 'Previous' },
    'tour.skip':           { ar: 'تخطي الجولة', en: 'Skip Tour' },
    'tour.finish':         { ar: 'إنهاء', en: 'Finish' },
    'tour.welcome':        { ar: 'مرحباً! دعنا نُريك كيف يعمل النظام', en: "Welcome! Let us show you how the system works" },

    // ── Onboarding ───────────────────────────────────────────────────────────
    'onb.title':           { ar: 'إعداد مدرستك على EduOS', en: 'Set Up Your School on EduOS' },
    'onb.step1':           { ar: 'بيانات المدرسة', en: 'School Information' },
    'onb.step2':           { ar: 'الإعدادات الأكاديمية', en: 'Academic Settings' },
    'onb.step3':           { ar: 'الكوادر الأولية', en: 'Initial Staff' },
    'onb.step4':           { ar: 'مراجعة وتأكيد', en: 'Review & Confirm' },
    'onb.official.id':     { ar: 'الرقم الرسمي للمدرسة (eSIS)', en: 'Official School Number (eSIS)' },
    'onb.finish':          { ar: 'إطلاق المنصة', en: 'Launch Platform' },

    // ── Grades / SB1 ─────────────────────────────────────────────────────────
    'gr.w5':               { ar: 'W5', en: 'W5' },
    'gr.w6':               { ar: 'W6', en: 'W6' },
    'gr.w7':               { ar: 'W7', en: 'W7' },
    'gr.w8':               { ar: 'W8', en: 'W8' },
    'gr.w9':               { ar: 'W9', en: 'W9' },
    'gr.w10':              { ar: 'W10', en: 'W10' },
    'gr.w11':              { ar: 'W11', en: 'W11' },
    'gr.project':          { ar: 'مشروع', en: 'Project' },
    'gr.sb1':              { ar: 'SB1 / 80', en: 'SB1 / 80' },
    'gr.endofterm':        { ar: 'نهاية الفصل / 20', en: 'End of Term / 20' },
    'gr.final':            { ar: 'النهائي / 100', en: 'Final / 100' },
    'gr.below.pass':       { ar: 'دون المستوى', en: 'Below Pass' },

    // ── KG ───────────────────────────────────────────────────────────────────
    'kg.title':            { ar: 'رياض الأطفال', en: 'Kindergarten' },
    'kg.activities':       { ar: 'الأنشطة', en: 'Activities' },
    'kg.progress':         { ar: 'التقدم', en: 'Progress' },
    'kg.skills':           { ar: 'المهارات', en: 'Skills' },

    // ── Broadcasting ─────────────────────────────────────────────────────────
    'brd.title':           { ar: 'الإذاعة المدرسية', en: 'School Broadcasting' },
    'brd.message':         { ar: 'الرسالة', en: 'Message' },
    'brd.audience':        { ar: 'المستلمون', en: 'Recipients' },
    'brd.send':            { ar: 'إرسال الإشعار', en: 'Send Notification' },
    'brd.all':             { ar: 'الجميع', en: 'Everyone' },
    'brd.teachers.only':   { ar: 'المعلمون فقط', en: 'Teachers Only' },
    'brd.parents.only':    { ar: 'أولياء الأمور فقط', en: 'Parents Only' },
    'brd.students.only':   { ar: 'الطلاب فقط', en: 'Students Only' },

    // ── Exit Ticket ──────────────────────────────────────────────────────────
    'et.title':            { ar: 'بطاقة الخروج', en: 'Exit Ticket' },
    'et.lesson':           { ar: 'ماذا تعلمت اليوم؟', en: 'What did you learn today?' },
    'et.question':         { ar: 'ما الذي لم يتضح بعد؟', en: "What's still unclear?" },
    'et.submit':           { ar: 'إرسال', en: 'Submit' },
    'et.thanks':           { ar: 'شكراً! استمر في التميز 🌟', en: 'Thank you! Keep excelling 🌟' },

    // ── Lab ──────────────────────────────────────────────────────────────────
    'lab.title':           { ar: 'المختبر الذكي', en: 'Smart Lab' },
    'lab.booking':         { ar: 'حجز المختبر', en: 'Lab Booking' },
    'lab.equipment':       { ar: 'المعدات', en: 'Equipment' },
    'lab.available':       { ar: 'متاح', en: 'Available' },
    'lab.booked':          { ar: 'محجوز', en: 'Booked' },

    // ── Exam ─────────────────────────────────────────────────────────────────
    'exm.title':           { ar: 'جدول الاختبارات', en: 'Exam Schedule' },
    'exm.date':            { ar: 'تاريخ الاختبار', en: 'Exam Date' },
    'exm.duration':        { ar: 'المدة', en: 'Duration' },
    'exm.room':            { ar: 'القاعة', en: 'Hall' },
    'exm.supervisor':      { ar: 'المراقب', en: 'Supervisor' },
    'exm.type':            { ar: 'نوع الاختبار', en: 'Exam Type' },

    // ── Smart Import ─────────────────────────────────────────────────────────
    'imp.title':           { ar: 'الاستيراد الذكي', en: 'Smart Import' },
    'imp.upload':          { ar: 'رفع الملف', en: 'Upload File' },
    'imp.preview':         { ar: 'معاينة البيانات', en: 'Data Preview' },
    'imp.confirm':         { ar: 'تأكيد الاستيراد', en: 'Confirm Import' },
    'imp.success':         { ar: '✅ تم الاستيراد بنجاح', en: '✅ Import successful' },
    'imp.error':           { ar: '❌ خطأ في الاستيراد', en: '❌ Import error' },

    // ── Splash ───────────────────────────────────────────────────────────────
    'spl.loading':         { ar: 'جارٍ التحميل...', en: 'Loading...' },
    'spl.welcome':         { ar: 'أهلاً بك في EduOS', en: 'Welcome to EduOS' },

    // ── Days ─────────────────────────────────────────────────────────────────
    'day.sun':             { ar: 'الأحد', en: 'Sunday' },
    'day.mon':             { ar: 'الاثنين', en: 'Monday' },
    'day.tue':             { ar: 'الثلاثاء', en: 'Tuesday' },
    'day.wed':             { ar: 'الأربعاء', en: 'Wednesday' },
    'day.thu':             { ar: 'الخميس', en: 'Thursday' },
    'day.fri':             { ar: 'الجمعة', en: 'Friday' },
    'day.sat':             { ar: 'السبت', en: 'Saturday' },

    // ── Months ───────────────────────────────────────────────────────────────
    'month.1':             { ar: 'يناير', en: 'January' },
    'month.2':             { ar: 'فبراير', en: 'February' },
    'month.3':             { ar: 'مارس', en: 'March' },
    'month.4':             { ar: 'أبريل', en: 'April' },
    'month.5':             { ar: 'مايو', en: 'May' },
    'month.6':             { ar: 'يونيو', en: 'June' },
    'month.7':             { ar: 'يوليو', en: 'July' },
    'month.8':             { ar: 'أغسطس', en: 'August' },
    'month.9':             { ar: 'سبتمبر', en: 'September' },
    'month.10':            { ar: 'أكتوبر', en: 'October' },
    'month.11':            { ar: 'نوفمبر', en: 'November' },
    'month.12':            { ar: 'ديسمبر', en: 'December' },

    // ── Themes ───────────────────────────────────────────────────────────────
    'theme.national.day':  { ar: 'اليوم الوطني', en: 'National Day' },
    'theme.emergency':     { ar: '⚠️ وضع الطوارئ', en: '⚠️ Emergency Mode' },

    // ── Intellectual Property ────────────────────────────────────────────────
    'footer.rights':       { ar: '© 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — جميع الحقوق محفوظة', en: '© 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — All Rights Reserved' },
    'footer.license':      { ar: 'رخصة تجارية CN-6573712 — أبوظبي، الإمارات', en: 'Commercial License CN-6573712 — Abu Dhabi, UAE' },
  };

  // ─── Language Detection ───────────────────────────────────────────────────
  function detectLang() {
    // 1. URL param ?lang=en|ar
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang');
    if (paramLang === 'en' || paramLang === 'ar') return paramLang;

    // 2. URL hash param #lang=en (alternative)
    const hash = window.location.hash;
    const hashMatch = hash.match(/lang=(en|ar)/);
    if (hashMatch) return hashMatch[1];

    // 3. Browser language
    const browserLang = (navigator.language || navigator.userLanguage || 'ar').toLowerCase();
    if (browserLang.startsWith('en')) return 'en';

    // 4. Default: Arabic
    return 'ar';
  }

  // ─── Core Engine ─────────────────────────────────────────────────────────
  const EduLang = {
    current: detectLang(),

    // Translate a key
    t(key, fallback) {
      const entry = DICT[key];
      if (!entry) return fallback || key;
      return entry[this.current] || entry['ar'] || fallback || key;
    },

    // Switch language
    setLang(lang) {
      if (lang !== 'ar' && lang !== 'en') return;
      this.current = lang;

      // Update URL param without reload
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());

      // Apply direction
      this._applyDir();

      // Re-translate all elements
      this._applyAll();

      // Dispatch event for custom handlers
      window.dispatchEvent(new CustomEvent('eduos:langchange', { detail: { lang } }));
    },

    // Apply RTL/LTR
    _applyDir() {
      const isAr = this.current === 'ar';
      document.documentElement.setAttribute('lang', this.current);
      document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
      document.body.style.fontFamily = "'Tajawal', sans-serif";
      // Flip text-align for body
      document.body.style.textAlign = isAr ? 'right' : 'left';
    },

    // Apply translations to all data-i18n elements
    _applyAll() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr'); // e.g., "placeholder"
        const text = this.t(key);
        if (attr) {
          el.setAttribute(attr, text);
        } else {
          el.textContent = text;
        }
      });

      // HTML attributes
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        el.innerHTML = this.t(key);
      });
    },

    // Inject language toggle button into a container
    injectToggle(containerId, classes = '') {
      const container = document.getElementById(containerId);
      if (!container) return;

      const btn = document.createElement('button');
      btn.id = 'eduos-lang-toggle';
      btn.className = classes || 'eduos-lang-btn';
      btn.innerHTML = this.current === 'ar' ? '🌐 EN' : '🌐 ع';
      btn.setAttribute('title', this.current === 'ar' ? 'Switch to English' : 'التبديل للعربية');
      btn.setAttribute('aria-label', 'Language toggle');

      btn.addEventListener('click', () => {
        const newLang = this.current === 'ar' ? 'en' : 'ar';
        this.setLang(newLang);
        btn.innerHTML = this.current === 'ar' ? '🌐 EN' : '🌐 ع';
        btn.setAttribute('title', this.current === 'ar' ? 'Switch to English' : 'التبديل للعربية');
      });

      container.appendChild(btn);
    },

    // Auto-inject toggle into header if it has id="eduos-header-actions"
    autoInjectToggle() {
      // Try known header containers first
      const targets = ['eduos-header-actions', 'eduos-lang-container', 'header-actions'];
      for (const id of targets) {
        const el = document.getElementById(id);
        if (el) {
          this.injectToggle(id);
          return;
        }
      }

      // Fallback: inject a floating fixed button (top-left corner, above everything)
      if (document.getElementById('eduos-lang-float')) return;
      const btn = document.createElement('button');
      btn.id = 'eduos-lang-float';
      btn.innerHTML = this.current === 'ar' ? '🌐 EN' : '🌐 ع';
      btn.setAttribute('title', this.current === 'ar' ? 'Switch to English' : 'التبديل للعربية');
      btn.setAttribute('aria-label', 'Language toggle');
      btn.addEventListener('click', () => {
        const newLang = this.current === 'ar' ? 'en' : 'ar';
        this.setLang(newLang);
        btn.innerHTML = this.current === 'ar' ? '🌐 EN' : '🌐 ع';
        btn.setAttribute('title', this.current === 'ar' ? 'Switch to English' : 'التبديل للعربية');
      });
      document.body.appendChild(btn);
    },

    // Initialize
    init() {
      this.current = detectLang();
      this._applyDir();

      // Wait for DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this._applyAll();
          this.autoInjectToggle();
        });
      } else {
        this._applyAll();
        this.autoInjectToggle();
      }
    }
  };

  // ─── Global API ──────────────────────────────────────────────────────────
  window.EduLang = EduLang;
  window.t = (key, fallback) => EduLang.t(key, fallback);

  // ─── Default CSS for toggle button ───────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .eduos-lang-btn {
      background: rgba(108, 61, 214, 0.25);
      color: #fff;
      border: 1px solid rgba(108, 61, 214, 0.5);
      border-radius: 8px;
      padding: 6px 14px;
      font-family: 'Tajawal', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.5px;
    }
    .eduos-lang-btn:hover {
      background: rgba(108, 61, 214, 0.5);
      border-color: #6C3DD6;
      transform: translateY(-1px);
    }
    [dir="ltr"] .eduos-lang-btn {
      direction: ltr;
    }
    /* Floating fallback button */
    #eduos-lang-float {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 99999;
      background: rgba(13, 27, 42, 0.85);
      color: #fff;
      border: 1px solid rgba(108, 61, 214, 0.6);
      border-radius: 20px;
      padding: 5px 14px;
      font-family: 'Tajawal', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 12px rgba(108,61,214,0.3);
    }
    #eduos-lang-float:hover {
      background: rgba(108, 61, 214, 0.7);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(108,61,214,0.5);
    }
    [dir="ltr"] #eduos-lang-float {
      left: auto;
      right: 12px;
    }
  `;
  document.head.appendChild(style);

  // Auto-initialize
  EduLang.init();

})();
