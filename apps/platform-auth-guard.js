/**
 * EduOS Auth Guard v4.1 — JWT Verification + Authenticated Supabase Client
 * =========================================================================
 * يُحمَّل بدون defer مباشرةً بعد supabase-js في كل بوابة.
 *
 * يعمل على مرحلتين:
 *  [SYNC]  1. يُخفي الصفحة فوراً
 *          2. يقرأ الجلسة من sessionStorage
 *          3. يُعدِّل window.supabase.createClient ليحقن JWT تلقائياً
 *          4. يُنشئ window.EduOS_SB (authenticated client جاهز)
 *  [ASYNC] 5. يتحقق من JWT مع Supabase (server-side)
 *          6. يُظهر الصفحة (أو يعيد توجيه لصفحة تسجيل الدخول)
 *
 * v4.1 — 2026-07-17
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     الجزء المتزامن — يجب أن يكتمل قبل أي سكريبت آخر
     ══════════════════════════════════════════════════════ */

  // 1. إخفاء الصفحة فوراً حتى يكتمل التحقق
  document.documentElement.style.visibility = 'hidden';

  // 2. قراءة الجلسة
  let session = null;
  try {
    const raw = sessionStorage.getItem('edoos_user');
    if (raw) session = JSON.parse(raw);
  } catch (e) { session = null; }

  // 3. تحضير بيانات الخادم
  const SB_URL = (window.EduOS && window.EduOS.SB_URL) ? window.EduOS.SB_URL : '';
  const SB_KEY = (window.EduOS && window.EduOS.SB_KEY) ? window.EduOS.SB_KEY : '';

  // 4. Monkey-patch supabase.createClient لحقن JWT في كل client ينشئه البرنامج
  //    يعمل فقط إذا كان supabase-js محمَّلاً قبل هذا الملف
  if (window.supabase && window.supabase.createClient && session && session.token) {
    const _origCreate = window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient = function (url, key, opts) {
      const client = _origCreate(url, key, opts || {});
      // حقن الجلسة fire-and-forget (لا تنتظر)
      if (session.token) {
        client.auth.setSession({
          access_token:  session.token,
          refresh_token: session.refresh_token || ''
        }).catch(function () { /* صامت */ });
      }
      return client;
    };
  }

  // 5. إنشاء window.EduOS_SB (client موثَّق جاهز للاستخدام الفوري)
  if (window.supabase && SB_URL && SB_KEY && session && session.token) {
    try {
      const _raw = (window.EduOS_SB_orig || window.supabase.createClient);
      // استخدم createClient الأصلي لتجنب التكرار
      window.EduOS_SB = (typeof _raw === 'function')
        ? _raw(SB_URL, SB_KEY)
        : null;
    } catch (e) { window.EduOS_SB = null; }
  }

  /* ══════════════════════════════════════════════════════
     حقن platform-lang.js تلقائياً في كل صفحة
     ══════════════════════════════════════════════════════ */
  if (!document.getElementById('eduos-lang-script')) {
    const guardScript = document.querySelector('script[src*="platform-auth-guard"]');
    let base = '../';
    if (guardScript) {
      const src = guardScript.getAttribute('src') || '';
      if (src.startsWith('/apps/')) base = '/apps/';
    }
    const ls = document.createElement('script');
    ls.id  = 'eduos-lang-script';
    ls.src = base + 'platform-lang.js?v=44';
    ls.defer = true;
    document.head.appendChild(ls);
  }

  /* ══════════════════════════════════════════════════════
     الجزء الغير متزامن — التحقق الحقيقي من JWT
     ══════════════════════════════════════════════════════ */

  let redirected = false;
  function redirectTo(url) {
    if (redirected) return;
    redirected = true;
    window.location.replace(url);
  }

  // الصفحات العامة — بدون حماية
  const PUBLIC_PAGES = [
    '/apps/eduos-landing/',
    '/apps/eduos-login/',
    '/apps/eduos-showcase/',
    '/apps/eduos-attendance-gate/',
    '/apps/eduos-change-password/',
    '/apps/eduos-school-request/',
    '/apps/eduos-demo-join/',
    '/apps/eduos-welcome/',
    '/apps/eduos-welcome-link/',
  ];
  const currentPath = window.location.pathname;
  const isPublic = PUBLIC_PAGES.some(function (p) { return currentPath.includes(p); });

  if (isPublic) {
    document.documentElement.style.visibility = 'visible';
    return; // لا تفعل شيئاً إضافياً
  }

  // خريطة الأدوار المسموح بها لكل بوابة
  const ROLE_MAP = {
    'eduos-teacher':              ['teacher', 'sub_teacher'],
    'eduos-teacher-dashboard':    ['teacher', 'sub_teacher'],
    'eduos-principal':            ['principal'],
    'eduos-vice-principal':       ['vice_principal'],
    'eduos-admin':                ['admin'],
    'eduos-specialist':           ['specialist', 'social_worker'],
    'eduos-nurse':                ['nurse'],
    'eduos-nursing':              ['nurse'],
    'eduos-security':             ['security'],
    'eduos-technician':           ['technician'],
    'eduos-secretary':            ['secretary'],
    'eduos-coach':                ['coach'],
    'eduos-parent':               ['parent'],
    'eduos-parent-portal':        ['parent'],
    'eduos-student':              ['student'],
    'eduos-student-portal':       ['student'],
    'eduos-observer':             ['observer'],
    'eduos-observer-manager':     ['observer', 'principal', 'vice_principal', 'admin'],
    'eduos-hub':                  ['teacher','sub_teacher','principal','vice_principal','admin','specialist','nurse','security','technician','secretary','coach','observer','social_worker'],
    'eduos-analytics':            ['principal', 'vice_principal', 'admin'],
    'eduos-appraisal':            ['teacher','sub_teacher','principal','vice_principal','admin','specialist','nurse','security','technician','secretary','coach','social_worker'],
    'eduos-timetable':            ['teacher','sub_teacher','principal','vice_principal','admin','secretary'],
    'eduos-timetable-gen':        ['principal', 'vice_principal', 'admin'],
    'eduos-timetable-pdf':        ['principal', 'vice_principal', 'admin', 'secretary', 'teacher', 'sub_teacher'],
    'eduos-timetable-builder':    ['principal', 'vice_principal', 'admin'],
    'eduos-schedule-settings':    ['admin', 'principal'],
    'eduos-elective-admin':       ['admin', 'principal', 'vice_principal', 'secretary'],
    'eduos-staff-management':     ['admin'],
    'eduos-staff-leaves':         ['admin', 'principal'],
    'eduos-sub-teacher':          ['admin', 'principal'],
    'eduos-substitute-builder':   ['admin', 'principal', 'vice_principal'],
    'eduos-attendance':           ['teacher', 'sub_teacher', 'admin', 'principal', 'vice_principal', 'secretary'],
    'eduos-attendance-gate':      [],
    'eduos-class-session':        ['teacher', 'sub_teacher'],
    'eduos-exit-ticket':          ['teacher', 'sub_teacher', 'student'],
    'eduos-behavioral':           ['teacher', 'sub_teacher', 'principal', 'vice_principal', 'specialist', 'social_worker'],
    'eduos-reinforcement':        ['teacher', 'sub_teacher', 'principal', 'vice_principal'],
    'eduos-exam':                 ['teacher', 'sub_teacher', 'principal', 'vice_principal', 'admin'],
    'eduos-exam-calendar':        ['teacher', 'sub_teacher', 'principal', 'vice_principal', 'admin', 'secretary'],
    'eduos-semester-plan':        ['teacher', 'sub_teacher', 'principal', 'vice_principal'],
    'eduos-weekly-track':         ['teacher', 'sub_teacher', 'principal', 'vice_principal'],
    'eduos-observation':          ['principal', 'vice_principal', 'specialist'],
    'eduos-pdp':                  ['teacher','sub_teacher','principal','vice_principal','admin','specialist','nurse','security','technician','secretary','coach','social_worker'],
    'eduos-regulatory-dashboard': ['admin', 'principal'],
    'eduos-inspection':           ['principal', 'vice_principal', 'admin'],
    'eduos-inclusion':            ['specialist', 'social_worker', 'principal', 'vice_principal', 'admin'],
    'eduos-inclusion-smart':      ['specialist', 'social_worker', 'principal', 'vice_principal', 'admin'],
    'eduos-social-worker':        ['specialist', 'social_worker'],
    'eduos-socialworker':         ['specialist', 'social_worker'],
    'eduos-kg':                   ['teacher', 'sub_teacher', 'principal', 'vice_principal'],
    'eduos-library':              ['technician', 'teacher', 'principal', 'admin', 'secretary'],
    'eduos-cafeteria':            ['admin', 'principal', 'secretary'],
    'eduos-financial':            ['admin', 'principal'],
    'eduos-maintenance':          ['technician', 'admin', 'principal'],
    'eduos-transport':            ['admin', 'principal', 'secretary'],
    'eduos-forms':                ['teacher','sub_teacher','principal','vice_principal','admin','specialist','nurse','secretary'],
    'eduos-meetings':             ['teacher','sub_teacher','principal','vice_principal','admin','specialist'],
    'eduos-broadcasting':         ['principal', 'vice_principal', 'admin'],
    'eduos-news':                 ['admin', 'principal', 'vice_principal', 'secretary'],
    'eduos-calendar':             ['teacher','sub_teacher','principal','vice_principal','admin','specialist','secretary'],
    'eduos-certificates':         ['admin', 'principal', 'secretary'],
    'eduos-achievements':         ['student', 'parent', 'teacher', 'sub_teacher', 'principal'],
    'eduos-vark':                 ['student'],
    'eduos-survey':               ['teacher', 'sub_teacher', 'principal', 'admin'],
    'eduos-digital-readiness':    ['admin', 'principal'],
    'eduos-emiratization':        ['admin', 'principal', 'vice_principal'],
    'eduos-school-settings':      ['admin', 'principal'],
    'eduos-school-manager':       ['admin'],
    'eduos-onboarding':           ['admin'],
    'eduos-smart-entry':          ['admin', 'principal'],
    'eduos-smart-import':         ['admin'],
    'eduos-atheer':               ['teacher', 'sub_teacher', 'specialist', 'social_worker', 'principal', 'vice_principal'],
    'eduos-portfolio':            ['student', 'teacher', 'sub_teacher', 'parent'],
    'eduos-student-profile':      ['teacher','sub_teacher','principal','vice_principal','admin','specialist','social_worker'],
    'eduos-student-card':         ['admin', 'secretary', 'principal'],
    'eduos-students':             ['admin', 'principal', 'vice_principal', 'secretary'],
    'eduos-messaging':            ['teacher','sub_teacher','principal','vice_principal','admin','specialist','nurse','security','technician','secretary','coach'],
    'eduos-drive':                ['teacher','sub_teacher','principal','vice_principal','admin','specialist'],
    'eduos-space':                ['teacher','sub_teacher','principal','vice_principal','admin'],
    'eduos-lab':                  ['teacher', 'sub_teacher', 'technician'],
    'eduos-swap-builder':         ['principal', 'vice_principal', 'admin'],
    'eduos-agent-control':        ['admin'],
    'eduos-control-plane':        [],
    'eduos-school-wizard':        [],
  };

  // استخراج اسم البوابة من المسار
  function getPortalName() {
    const m = currentPath.match(/\/apps\/(eduos-[^/]+)/);
    return m ? m[1] : null;
  }

  (async function () {

    // التحقق من وجود جلسة
    if (!session) {
      redirectTo('/apps/eduos-login/?redirect=' + encodeURIComponent(currentPath));
      return;
    }

    const roleKey = session.role_key || session.role || '';

    // ─── فحص الدور للبوابة الحالية ───────────────────────
    const portalName = getPortalName();
    if (portalName && ROLE_MAP[portalName] !== undefined) {
      const allowed = ROLE_MAP[portalName];
      if (allowed.length > 0 && !allowed.includes(roleKey)) {
        redirectTo('/apps/eduos-login/?err=access_denied&role=' + encodeURIComponent(roleKey));
        return;
      }
    }

    // ─── التحقق من JWT مع الخادم (C-02 fix) ──────────────
    // الطلاب والوالدين قد يكون لديهم token أو لا
    const token = session.token || '';

    if (!token) {
      // طالب أو مستخدم بدون JWT (قديم) — تحقق بسيط من وجود الجلسة
      if (session.role_key === 'student' || session.role_key === 'parent') {
        document.documentElement.style.visibility = 'visible';
        return;
      }
      // موظف بدون JWT = مشبوه
      redirectTo('/apps/eduos-login/?err=no_token');
      return;
    }

    // التحقق من الـ JWT مع Supabase
    try {
      const res = await fetch(SB_URL + '/auth/v1/user', {
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + token
        }
      });

      if (res.status === 401) {
        // JWT منتهٍ أو مزوَّر
        sessionStorage.removeItem('edoos_user');
        redirectTo('/apps/eduos-login/?err=session_expired');
        return;
      }

      if (res.ok) {
        const userData = await res.json();
        // تأكد أن الـ email يطابق المستخدم (إضافية)
        const expectedEmail = (session.username || '') + '@' + (window.EduOS?.school?.domain || 'eduos.ae');
        if (userData.email && userData.email !== expectedEmail) {
          // email لا يطابق — JWT مزوَّر أو جلسة خاطئة
          sessionStorage.removeItem('edoos_user');
          redirectTo('/apps/eduos-login/?err=identity_mismatch');
          return;
        }

        // ─── كل شيء صحيح — حقن JWT في EduOS_SB ────────────
        if (window.EduOS_SB) {
          try {
            await window.EduOS_SB.auth.setSession({
              access_token:  token,
              refresh_token: session.refresh_token || ''
            });
          } catch (e) { /* صامت */ }
        }

        // تحديث loginTime للتأكيد
        try {
          const s2 = JSON.parse(sessionStorage.getItem('edoos_user') || '{}');
          if (!s2.loginTime) {
            s2.loginTime = Date.now();
            sessionStorage.setItem('edoos_user', JSON.stringify(s2));
          }
        } catch (e) { /* صامت */ }
      }
      // res.status غير 200 وغير 401 (مثل 503) — شبكة — نسمح بالدخول gracefully
    } catch (netErr) {
      // شبكة معطلة — نسمح بالدخول ولا نعاقب المستخدم
      console.warn('[EduOS Guard] Network error — allowing gracefully', netErr);
    }

    // إظهار الصفحة بعد اكتمال الفحص
    if (!redirected) {
      document.documentElement.style.visibility = 'visible';
    }

  })();

})();
