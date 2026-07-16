/**
 * EduOS Auth Guard v1.1
 * يُضمَّن في كل منظومة — يمنع الوصول بدون جلسة صحيحة
 * لا localStorage | sessionStorage للجلسة فقط (مسموح)
 * v1.1 — يُحقن platform-lang.js تلقائياً في كل صفحة
 */
(function() {
  'use strict';

  // صفحات مُعفاة من الحماية (عامة بطبيعتها)
  const PUBLIC_PAGES = [
    '/apps/eduos-landing/',
    '/apps/eduos-login/',
    '/apps/eduos-showcase/',
    '/apps/eduos-attendance-gate/', // شاشة تابلت عامة
    '/apps/eduos-change-password/', // تغيير كلمة المرور الإجباري
  ];

  const currentPath = window.location.pathname;
  const isPublic = PUBLIC_PAGES.some(p => currentPath.includes(p));

  // ── Auto-inject platform-lang.js في كل صفحة (عامة أو محمية) ──
  if (!document.getElementById('eduos-lang-script')) {
    const langScript = document.createElement('script');
    langScript.id = 'eduos-lang-script';
    langScript.src = '/apps/platform-lang.js?v=44';
    document.head.appendChild(langScript);
  }

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

  // تغيير كلمة المرور الإجباري — يُحوَّل قبل أي تحقق آخر
  if (session.force_password_change === true) {
    window.location.replace('/apps/eduos-change-password/');
    return;
  }

  // -------- التحقق من الدور --------
  // خريطة: كل منظومة ← الأدوار المسموح لها
  // الأدوار الكاملة — مطابقة لـ session.role من login page
  const ALL_STAFF = ['admin','principal','vice_principal','teacher','sub_teacher','coach','nurse','specialist','social_worker','technician','secretary','librarian','security','observer'];
  const MGMT = ['admin','principal','vice_principal'];

  const ROLE_MAP = {
    'eduos-principal':   ['admin','principal'],
    'eduos-vice-principal': ['admin','principal','vice_principal'],
    'eduos-analytics':   [...MGMT,'teacher'],
    'eduos-financial':   ['admin','principal','accountant'],
    'eduos-teacher':     ['admin','principal','vice_principal','teacher','sub_teacher','coach'],
    'eduos-student':     ['admin','principal','vice_principal','teacher','student','specialist','social_worker'],
    'eduos-parent':      ['admin','principal','parent'],
    'eduos-nurse':       ['admin','principal','vice_principal','nurse'],
    'eduos-nursing':     ['admin','principal','vice_principal','nurse'],
    'eduos-security':    ['admin','principal','vice_principal','security'],
    'eduos-maintenance': ['admin','principal','vice_principal','maintenance','technician'],
    'eduos-transport':   ['admin','principal','vice_principal','driver','transport'],
    'eduos-library':     ['admin','principal','vice_principal','librarian','teacher'],
    'eduos-lab':         ['admin','principal','vice_principal','teacher'],
    'eduos-space':       ['admin','principal','vice_principal','teacher'],
    'eduos-cafeteria':   ['admin','principal','vice_principal','cafeteria'],
    'eduos-exam':        ['admin','principal','vice_principal','teacher','secretary'],
    'eduos-broadcasting':['admin','principal','vice_principal','media'],
    'eduos-calendar':    [...ALL_STAFF,'student'],
    'eduos-kg':          ['admin','principal','vice_principal','teacher','kg'],
    'eduos-timetable-gen': ['admin','principal','vice_principal'],
    'eduos-timetable-pdf': [...ALL_STAFF,'student','parent'],
    'eduos-timetable':   [...ALL_STAFF,'student','parent'],
    'eduos-inclusion':   ['admin','principal','vice_principal','special_ed','specialist','social_worker'],
    'eduos-socialworker':['admin','principal','vice_principal','social_worker','specialist'],
    'eduos-checkin':     ['admin','principal','vice_principal','security'],
    'eduos-coach':       ['admin','principal','vice_principal','coach'],
    'eduos-specialist':  ['admin','principal','vice_principal','specialist','social_worker'],
    'eduos-secretary':   ['admin','principal','vice_principal','secretary'],
    'eduos-technician':  ['admin','principal','vice_principal','technician'],
    'eduos-observer':    ['admin','principal','vice_principal','observer'],
    'eduos-admin':       ['admin'],
    'eduos-hub':         [...ALL_STAFF,'student','parent'],
    'eduos-onboarding':  ['admin','principal'],
    'duty-os-vision':          ['admin','principal'],
    'smart-school-blueprint':  ['admin','principal'],
    'eduos-links':             ['admin','principal','teacher','support','special_ed','security','nurse','librarian','social_worker'],
    'eduos-demo-portal':       ['admin','principal','teacher','support','special_ed','security','nurse'],
    'eduos-drive':             ['admin','principal','teacher'],
    'eduos-achievements':      ['admin','principal','teacher'],
    'eduos-emiratization':     ['admin','principal'],
    'eduos-exit-ticket':       ['admin','principal','teacher','sub_teacher'],
    'eduos-teacher-dashboard': ['admin','principal','teacher','sub_teacher'],

    // ── إضافات الفحص الأمني 24 يونيو 2026 ──
    'eduos-appraisal':             ['admin','principal'],
    'eduos-regulatory-dashboard':  ['admin','principal'],
    'eduos-elective-admin':        ['admin','principal','vice_principal','secretary'],
    'eduos-broadcasting':  ['admin','principal','media'],
    'eduos-calendar':      ['admin','principal','teacher','sub_teacher','support'],
    'eduos-news':          ['admin','principal','media','teacher'],
    'eduos-observation':   ['admin','principal','teacher'],
    'eduos-certificates':  ['admin','principal','teacher'],
    'eduos-class-session': ['admin','principal','teacher','sub_teacher'],
    'eduos-store':         ['admin','principal','teacher','student','parent'],
    'eduos-student-portal':['admin','principal','student','parent'],
    'eduos-vark':          ['admin','principal','teacher','student'],
    'eduos-survey':        ['admin','principal','teacher'],
    'eduos-timetable-gen': ['admin','principal','vice_principal'],
    'eduos-inspection':    ['admin','principal','vice_principal'],
    'eduos-welcome':       ['admin','principal'],
    'eduos-atheer':        ['admin','principal','teacher','social_worker','support','special_ed'],
    'eduos-pdp':           ['admin','principal','teacher','support','special_ed'],
    'eduos-meetings':      ['admin','principal','teacher'],
    'eduos-forms':         ['admin','principal','teacher','support'],
    'eduos-staff-leaves':  ['admin','principal','teacher','support','special_ed','security','nurse','librarian'],
    'eduos-portfolio':     ['admin','principal','teacher','student'],
    'eduos-student-profile':['admin','principal','teacher'],
  };

  // ── تحقق إضافي: المعلم البديل — منع الوصول لصفحات حساسة ──
  const SUB_TEACHER_BLOCKED = [
    'eduos-grades','eduos-financial','eduos-analytics',
    'eduos-principal','eduos-socialworker','eduos-inclusion',
    'eduos-reports','eduos-staff','eduos-settings',
    'eduos-welcome-link','eduos-inspection','eduos-emiratization',
  ];
  if (session.role === 'sub_teacher') {
    const isBlocked = SUB_TEACHER_BLOCKED.some(b => currentPath.includes(b));
    if (isBlocked) {
      window.location.replace('/apps/eduos-hub/?err=unauthorized');
      return;
    }
    // تحقق من انتهاء العقد (contract_end_date مخزَّن في الجلسة)
    if (session.contract_end_date) {
      const endDate = new Date(session.contract_end_date);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (endDate < today) {
        // العقد انتهى — إخراج فوري
        sessionStorage.removeItem('edoos_user');
        window.location.replace('/apps/eduos-login/?err=contract_expired');
        return;
      }
    }
  }

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

  // 🛡️ تحميل EduOS Shield تلقائياً في كل صفحة محمية
  if (!document.querySelector('script[src*="platform-shield"]')) {
    const shieldScript = document.createElement('script');
    // حساب المسار النسبي بناءً على عمق المسار الحالي
    const depth = (window.location.pathname.match(/\//g) || []).length - 1;
    const prefix = depth <= 2 ? '../' : '../../';
    shieldScript.src = prefix + 'platform-shield.js';
    shieldScript.defer = true;
    document.head.appendChild(shieldScript);
  }

})();
