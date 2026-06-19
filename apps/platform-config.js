/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║      EduOS — platform-config.js  (Multi-Tenant Master)      ║
 * ║   ملف الإعدادات الموحَّد لجميع المدارس                      ║
 * ║                                                              ║
 * ║  يكتشف اسم النطاق تلقائياً ويحمّل إعدادات المدرسة الصحيحة  ║
 * ║  Auto-detects hostname → loads correct school config         ║
 * ║                                                              ║
 * ║  لإضافة مدرسة جديدة: أضف كتلة واحدة في SCHOOL_REGISTRY      ║
 * ║  To add a school: add one block in SCHOOL_REGISTRY below     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 * شهادة الملكية الفكرية: 1614-2026
 * المؤلف: منيرة علي محمد سعيد المري
 */

(function () {

  // ══════════════════════════════════════════════════════════════
  // 🏫 سجل المدارس — أضف مدرستك هنا فقط
  //    School Registry — add your school here only
  // ══════════════════════════════════════════════════════════════
  const SCHOOL_REGISTRY = {

    // ────────────────────────────────────────
    // 🟢 مدرسة الجود — Production
    // ────────────────────────────────────────
    'aljood.eduos.ae': {
      school: {
        id:           'aljood',
        nameAr:       'روضة ومدرسة الجود',
        nameEn:       'AlJood Kindergarten & School',
        shortNameAr:  'الجود',
        shortNameEn:  'AlJood',
        number:       '1705',
        type:         'moe_public',
        authority:    'MOE',
        emirate:      'abu_dhabi',
        city:         'العين',
        region:       'مدينة العين',
        domain:       'aljood.eduos.ae',
        telegram:     'https://t.me/Schaljood',
        logo:         '/apps/eduos-logo-transparent.png',
        logoColored:  '/apps/eduos-logo.png',
        levels:       'KG — الصف 12',
        levelsEn:     'KG — Grade 12',
        gender:       'mixed',
        isDemo:       false,
        geo: { lat: 24.4539, lng: 54.3773, radius: 150 },
        attendance: { startTime: '06:30', endTime: '08:00', qrRotation: 60 }
      },
      supabase: {
        url: 'https://zuyizaiugpmhmeycqton.supabase.co',
        _k1: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        _k2: 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0',
        _k3: 'FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI'
      }
    },

    // ────────────────────────────────────────
    // 🟡 مدرسة النور النموذجية — Demo
    // ────────────────────────────────────────
    'demo.eduos.ae': {
      school: {
        id:           'demo',
        nameAr:       'مدرسة النور النموذجية',
        nameEn:       'Al Noor Model School',
        shortNameAr:  'النور',
        shortNameEn:  'AlNoor',
        number:       '0000',
        type:         'moe_public',
        authority:    'MOE',
        emirate:      'dubai',
        city:         'دبي',
        region:       'إمارة دبي',
        domain:       'demo.eduos.ae',
        telegram:     '',
        logo:         '/apps/eduos-logo-transparent.png',
        logoColored:  '/apps/eduos-logo.png',
        levels:       'KG — الصف 12',
        levelsEn:     'KG — Grade 12',
        gender:       'mixed',
        isDemo:       true,
        geo: { lat: 25.2048, lng: 55.2708, radius: 150 },
        attendance: { startTime: '07:00', endTime: '08:30', qrRotation: 60 }
      },
      supabase: {
        url: 'https://xdkiktwuuwghvzcukvew.supabase.co',
        _k1: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        _k2: 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhka2lrdHd1dXdnaHZ6Y3VrdmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzQ2NzksImV4cCI6MjA5Njc1MDY3OX0',
        _k3: '3vL9Xi0wW9xDyDKtCsX7lYgwCvRDnNOUDbCHLiJmfgU'
      }
    }

    // ────────────────────────────────────────
    // ➕ مدرسة جديدة — انسخ الكتلة أدناه
    // ────────────────────────────────────────
    // 'school3.eduos.ae': {
    //   school: {
    //     id:       'school3',
    //     nameAr:   'اسم المدرسة',
    //     nameEn:   'School Name',
    //     ...
    //   },
    //   supabase: {
    //     url: 'https://YOUR_PROJECT.supabase.co',
    //     _k1: 'eyJ...',
    //     _k2: '...',
    //     _k3: '...'
    //   }
    // }

  };

  // ══════════════════════════════════════════════════════════════
  // 🔍 اكتشاف النطاق التلقائي
  // ══════════════════════════════════════════════════════════════
  const hostname = window.location.hostname;

  // ابحث عن تطابق مباشر أولاً، ثم جزئي، ثم افتراضي Demo
  let matchedConfig = SCHOOL_REGISTRY[hostname];

  if (!matchedConfig) {
    // تطابق جزئي: aljood → aljood.eduos.ae
    const key = Object.keys(SCHOOL_REGISTRY).find(k => hostname.includes(k.split('.')[0]));
    matchedConfig = key ? SCHOOL_REGISTRY[key] : null;
  }

  // fallback للـ Demo إذا لم يُوجد تطابق (localhost / تطوير)
  const cfg = matchedConfig || SCHOOL_REGISTRY['demo.eduos.ae'];

  // ══════════════════════════════════════════════════════════════
  // 🔑 بناء الكائن العام window.EduOS
  // ══════════════════════════════════════════════════════════════
  window.EduOS = {

    ...cfg,

    // دوال الـ key — مُجزَّأة 3 أجزاء (قانون الأمان)
    supabase: {
      ...cfg.supabase,
      getKey() { return [this._k1, this._k2, this._k3].join('.'); }
    },

    // إعدادات الذكاء الاصطناعي
    ai: {
      provider: 'gemini',
      edgeFn:   'ai-assistant',
      label:    'المساعد الذكي',
      icon:     '🤲'
    },

    // التقويم الدراسي
    calendar: {
      year:         '2025–2026',
      sem1Start:    '2025-09-01',
      sem1End:      '2026-01-31',
      sem2Start:    '2026-02-01',
      sem2End:      '2026-06-30',
      currentSem:   2,
      weekStartDay: 0
    },

    // دوال مختصرة
    get SB_URL() { return this.supabase.url; },
    get SB_KEY()  { return this.supabase.getKey(); },
    get AI_FN()   { return `${this.supabase.url}/functions/v1/${this.ai.edgeFn}`; },
    get SCHOOL()  { return this.school; },

    // بيانات المنصة الثابتة
    platform: {
      name:       'EduOS',
      nameAr:     'بوابة الجود الذكية',
      version:    '3.0',
      developer:  'NAFAS FOR ARTIFICIAL INTELLIGENCE',
      devLicense: 'CN-6573712',
      license:    '1614-2026',
      copyright:  '© 2026 منيرة علي محمد المري'
    },

    // ══════════════════════════════════════
    // 🏫 دالة إضافة مدرسة جديدة ديناميكياً
    // ══════════════════════════════════════
    registerSchool(domain, config) {
      SCHOOL_REGISTRY[domain] = config;
      console.log(`%c✅ EduOS: مدرسة جديدة مُسجَّلة → ${domain}`, 'color:#22D3EE;font-weight:bold');
    }

  };

  // ══════════════════════════════════════════════════════════════
  // 🔔 تسجيل تحميل الإعداد
  // ══════════════════════════════════════════════════════════════
  if (typeof console !== 'undefined') {
    const isDemo = window.EduOS.school.isDemo;
    console.log(
      `%c⚙️ EduOS Config Loaded ${isDemo ? '[DEMO]' : '[PROD]'}`,
      `color:${isDemo ? '#F59E0B' : '#6C3DD6'};font-weight:bold;font-size:12px`,
      '→', window.EduOS.school.nameAr,
      '| domain:', hostname,
      '| matched:', window.EduOS.school.domain
    );
  }

})();
