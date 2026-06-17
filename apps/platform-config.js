/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          EduOS — platform-config.js  (AlJood Edition)       ║
 * ║   ملف إعدادات المدرسة — هذا الملف الوحيد الذي يختلف        ║
 * ║   بين كل مدرسة ومدرسة في منظومة EduOS                      ║
 * ║                                                              ║
 * ║  THIS IS THE ONLY FILE THAT DIFFERS BETWEEN SCHOOLS         ║
 * ║  Change this one file → entire system adapts automatically  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 * شهادة الملكية الفكرية: 1614-2026
 */

window.EduOS = {

  // ═══════════════════════════════════════
  // 🏫 هوية المدرسة
  // ═══════════════════════════════════════
  school: {
    id:           'aljood',
    nameAr:       'روضة ومدرسة الجود',
    nameEn:       'AlJood Kindergarten & School',
    shortNameAr:  'الجود',
    shortNameEn:  'AlJood',
    number:       '1705',             // رقم eSIS الرسمي
    type:         'moe_public',       // moe_public | moe_private | adek | mohed | private | higher
    authority:    'MOE',              // الجهة التعليمية المسؤولة
    emirate:      'abu_dhabi',        // الإمارة
    city:         'العين',
    region:       'مدينة العين',
    domain:       'aljood.eduos.ae',
    telegram:     'https://t.me/Schaljood',
    logo:         '/apps/eduos-logo-transparent.png',
    logoColored:  '/apps/eduos-logo.png',
    levels:       'KG — الصف 12',
    levelsEn:     'KG — Grade 12',
    gender:       'mixed',            // mixed | female | male
    isDemo:       false,

    // إحداثيات الجغرافيا لبوابة الحضور
    geo: {
      lat:    24.4539,
      lng:    54.3773,
      radius: 150                     // geofence بالمتر
    },

    // إعدادات نظام الحضور
    attendance: {
      startTime:   '06:30',
      endTime:     '08:00',
      qrRotation:  60                 // دوران QR بالثواني
    }
  },

  // ═══════════════════════════════════════
  // 🗄️ Supabase — مقسَّم 3 أجزاء (قانون الأمان)
  // ═══════════════════════════════════════
  supabase: {
    url: 'https://zuyizaiugpmhmeycqton.supabase.co',
    _k1: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    _k2: 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0',
    _k3: 'FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI',
    getKey() { return [this._k1, this._k2, this._k3].join('.'); }
  },

  // ═══════════════════════════════════════
  // 🤖 الذكاء الاصطناعي
  // ═══════════════════════════════════════
  ai: {
    provider:  'gemini',
    edgeFn:    'ai-assistant',
    label:     'المساعد الذكي',
    icon:      '🤲'
  },

  // ═══════════════════════════════════════
  // 📚 التقويم الدراسي
  // ═══════════════════════════════════════
  calendar: {
    year:          '2025–2026',
    sem1Start:     '2025-09-01',
    sem1End:       '2026-01-31',
    sem2Start:     '2026-02-01',
    sem2End:       '2026-06-30',
    currentSem:    2,
    weekStartDay:  0               // 0=الأحد، 1=الاثنين
  },

  // ═══════════════════════════════════════
  // 🔗 دوال مساعدة مختصرة
  // ═══════════════════════════════════════
  get SB_URL() { return this.supabase.url; },
  get SB_KEY()  { return this.supabase.getKey(); },
  get AI_FN()   { return `${this.supabase.url}/functions/v1/${this.ai.edgeFn}`; },
  get SCHOOL()  { return this.school; },

  // ═══════════════════════════════════════
  // 🏷️ بيانات المنصة الثابتة
  // ═══════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
// 🔔 تسجيل تحميل الإعداد في Console (debug فقط)
// ════════════════════════════════════════════════════════════════
if (typeof console !== 'undefined') {
  console.log(
    '%c⚙️ EduOS Config Loaded',
    'color:#6C3DD6;font-weight:bold;font-size:12px',
    '→', window.EduOS.school.nameAr,
    '|', window.EduOS.school.domain
  );
}
