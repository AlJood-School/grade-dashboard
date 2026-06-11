/**
 * EduOS Auth Guard v1.0
 * يُضمَّن في كل منظومة — يمنع الوصول بدون جلسة صحيحة
 * لا localStorage | sessionStorage للجلسة فقط (مسموح)
 */
(function() {
  'use strict';

  // صفحات مُعفاة من الحماية (عامة بطبيعتها)
  const PUBLIC_PAGES = [
    '/apps/eduos-landing/',
    '/apps/eduos-login/',
    '/apps/eduos-showcase/',
    '/apps/eduos-attendance-gate/', // شاشة تابلت عامة
  ];

  const currentPath = window.location.pathname;
  const isPublic = PUBLIC_PAGES.some(p => currentPath.includes(p));

  if (isPublic) return; // صفحة عامة — لا حاجة للحماية

  // قراءة بيانات الجلسة
  let session = null;
  try {
    const raw = sessionStorage.getItem('edoos_user');
    if (raw) session = JSON.parse(raw);
  } catch(e) {
    session = null;
  }

  if (!session || !session.role || !session.username) {
    // لا جلسة — إعادة توجيه لصفحة الدخول
    const loginUrl = '/apps/eduos-login/?redirect=' + encodeURIComponent(window.location.pathname);
    window.location.replace(loginUrl);
    return;
  }

  // -------- التحقق من الدور --------
  // خريطة: كل منظومة ← الأدوار المسموح لها
  const ROLE_MAP = {
    'eduos-principal':   ['admin','principal'],
    'eduos-analytics':   ['admin','principal'],
    'eduos-financial':   ['admin','principal','accountant'],
    'eduos-teacher':     ['admin','principal','teacher'],
    'eduos-student':     ['admin','principal','teacher','student'],
    'eduos-parent':      ['admin','principal','parent'],
    'eduos-nursing':     ['admin','principal','nurse','support'],
    'eduos-security':    ['admin','principal','security'],
    'eduos-maintenance': ['admin','principal','maintenance'],
    'eduos-transport':   ['admin','principal','driver','transport'],
    'eduos-library':     ['admin','principal','librarian','teacher'],
    'eduos-lab':         ['admin','principal','teacher'],
    'eduos-space':       ['admin','principal','teacher'],
    'eduos-cafeteria':   ['admin','principal','cafeteria'],
    'eduos-exam':        ['admin','principal','teacher'],
    'eduos-broadcasting':['admin','principal','media'],
    'eduos-calendar':    ['admin','principal','teacher'],
    'eduos-kg':          ['admin','principal','teacher','kg'],
    'eduos-timetable':   ['admin','principal','teacher'],
    'eduos-inclusion':   ['admin','principal','special_ed','support'],
    'eduos-socialworker':['admin','principal','social_worker'],
    'eduos-checkin':     ['admin','principal','security','support'],
    'eduos-hub':         ['admin','principal','teacher','support','special_ed','security','nurse','librarian'],
    'eduos-onboarding':  ['admin','principal'],
    'duty-os-vision':    ['admin','principal'],
  };

  // تحديد المنظومة الحالية
  const systemKey = Object.keys(ROLE_MAP).find(k => currentPath.includes(k));

  if (systemKey) {
    const allowed = ROLE_MAP[systemKey];
    const userRole = session.role || '';
    if (!allowed.includes(userRole)) {
      // غير مصرّح له — إعادة للـ Hub
      window.location.replace('/apps/eduos-hub/?err=unauthorized');
      return;
    }
  }

  // ✅ الجلسة صحيحة والدور مسموح — متابعة تحميل الصفحة
  // تصدير بيانات المستخدم عالمياً للاستخدام في المنظومات
  window.EDOOS_USER = session;

})();
