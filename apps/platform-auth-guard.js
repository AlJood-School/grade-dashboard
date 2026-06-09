/**
 * EduOS Auth Guard v1.0
 * يُضمَّن في كل منظومة — يمنع الوصول بدون جلسة صحيحة
 * لا localStorage | sessionStorage للجلسة فقط (مسموح)
 */
(function() {
  'use strict';

  // صفحات مُعفاة من الحماية (عامة بطبيعتها)
  const PUBLIC_PAGES = [
    '/apps/edoos-landing/',
    '/apps/edoos-login/',
    '/apps/edoos-showcase/',
    '/apps/edoos-attendance-gate/', // شاشة تابلت عامة
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
    const loginUrl = '/apps/edoos-login/?redirect=' + encodeURIComponent(window.location.pathname);
    window.location.replace(loginUrl);
    return;
  }

  // -------- التحقق من الدور --------
  // خريطة: كل منظومة ← الأدوار المسموح لها
  const ROLE_MAP = {
    'edoos-principal':   ['admin','principal'],
    'edoos-analytics':   ['admin','principal'],
    'edoos-financial':   ['admin','principal','accountant'],
    'edoos-teacher':     ['admin','principal','teacher'],
    'edoos-student':     ['admin','principal','teacher','student'],
    'edoos-parent':      ['admin','principal','parent'],
    'edoos-nursing':     ['admin','principal','nurse','support'],
    'edoos-security':    ['admin','principal','security'],
    'edoos-maintenance': ['admin','principal','maintenance'],
    'edoos-transport':   ['admin','principal','driver','transport'],
    'edoos-library':     ['admin','principal','librarian','teacher'],
    'edoos-lab':         ['admin','principal','teacher'],
    'edoos-space':       ['admin','principal','teacher'],
    'edoos-cafeteria':   ['admin','principal','cafeteria'],
    'edoos-exam':        ['admin','principal','teacher'],
    'edoos-broadcasting':['admin','principal','media'],
    'edoos-calendar':    ['admin','principal','teacher'],
    'edoos-kg':          ['admin','principal','teacher','kg'],
    'edoos-timetable':   ['admin','principal','teacher'],
    'edoos-inclusion':   ['admin','principal','special_ed','support'],
    'edoos-socialworker':['admin','principal','social_worker'],
    'edoos-checkin':     ['admin','principal','security','support'],
    'edoos-hub':         ['admin','principal','teacher','support','special_ed','security','nurse','librarian'],
    'edoos-onboarding':  ['admin','principal'],
    'duty-os-vision':    ['admin','principal'],
  };

  // تحديد المنظومة الحالية
  const systemKey = Object.keys(ROLE_MAP).find(k => currentPath.includes(k));

  if (systemKey) {
    const allowed = ROLE_MAP[systemKey];
    const userRole = session.role || '';
    if (!allowed.includes(userRole)) {
      // غير مصرّح له — إعادة للـ Hub
      window.location.replace('/apps/edoos-hub/?err=unauthorized');
      return;
    }
  }

  // ✅ الجلسة صحيحة والدور مسموح — متابعة تحميل الصفحة
  // تصدير بيانات المستخدم عالمياً للاستخدام في المنظومات
  window.EDOOS_USER = session;

})();
