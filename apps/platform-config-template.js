/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║        EduOS — platform-config.js  (TEMPLATE)               ║
 * ║   قالب إعداد مدرسة جديدة — انسخ هذا الملف وعدِّله         ║
 * ║                                                              ║
 * ║  ⏱️ تستغرق إضافة مدرسة جديدة أقل من 10 دقائق              ║
 * ║  📋 عدِّل الحقول المميزة بـ ← فقط                          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * خطوات إضافة مدرسة جديدة:
 * 1. انسخ هذا الملف
 * 2. عدِّل الحقول المميزة أدناه
 * 3. أنشئ مشروع Supabase جديد
 * 4. افتح Vercel → New Project → أضف الدومين
 * 5. ✅ المدرسة الجديدة جاهزة!
 *
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 */

window.EduOS = {

  school: {
    id:           'SCHOOL_ID',         // ← معرف فريد (بالإنجليزية، بدون مسافات)
    nameAr:       'اسم المدرسة',       // ← الاسم الرسمي بالعربية
    nameEn:       'School Name',       // ← الاسم بالإنجليزية
    shortNameAr:  'اختصار',           // ← اختصار للعرض
    shortNameEn:  'Short',
    number:       '0000',             // ← رقم eSIS الرسمي
    type:         'moe_public',        // ← moe_public | moe_private | adek | mohed | private
    authority:    'MOE',              // ← MOE | ADEK | KHDA | SPEA | ACTVET | MOHED | Private
    emirate:      'abu_dhabi',         // ← abu_dhabi | dubai | sharjah | ajman | uaq | rak | fujairah
    city:         'أبوظبي',           // ← مدينة المدرسة
    region:       'إمارة أبوظبي',
    domain:       'school.eduos.ae',  // ← دومين المدرسة
    telegram:     '',                 // ← رابط القناة (اختياري)
    logo:         '/apps/eduos-logo-transparent.png',
    logoColored:  '/apps/eduos-logo.png',
    levels:       'KG — الصف 12',
    levelsEn:     'KG — Grade 12',
    gender:       'mixed',            // ← mixed | female | male
    isDemo:       false,

    geo: {
      lat:    24.4539,               // ← خط عرض المدرسة
      lng:    54.3773,               // ← خط طول المدرسة
      radius: 150
    },

    attendance: {
      startTime:   '07:00',          // ← وقت بداية الحضور
      endTime:     '08:30',
      qrRotation:  60
    }
  },

  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',  // ← رابط Supabase الجديد
    _k1: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    _k2: 'YOUR_ANON_KEY_PART_2',              // ← الجزء الثاني من anon key
    _k3: 'YOUR_ANON_KEY_PART_3',              // ← الجزء الثالث
    getKey() { return [this._k1, this._k2, this._k3].join('.'); }
  },

  ai: {
    provider:  'gemini',
    edgeFn:    'ai-assistant',
    label:     'المساعد الذكي',
    icon:      '🤲'
  },

  calendar: {
    year:          '2025–2026',
    sem1Start:     '2025-09-01',
    sem1End:       '2026-01-31',
    sem2Start:     '2026-02-01',
    sem2End:       '2026-06-30',
    currentSem:    2,
    weekStartDay:  0
  },

  get SB_URL() { return this.supabase.url; },
  get SB_KEY()  { return this.supabase.getKey(); },
  get AI_FN()   { return `${this.supabase.url}/functions/v1/${this.ai.edgeFn}`; },
  get SCHOOL()  { return this.school; },

  platform: {
    name:       'EduOS',
    nameAr:     'بوابة الجود الذكية',
    version:    '3.0',
    developer:  'NAFAS FOR ARTIFICIAL INTELLIGENCE',
    devLicense: 'CN-6573712',
    license:    '1614-2026',
    copyright:  '© 2026 منيرة علي محمد المري'
  }

};
