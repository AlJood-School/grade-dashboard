/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS — حاسبة الأسبوع الدراسي الرسمية
 *  المصدر: التقويم الرسمي لوزارة التعليم 2025-2026
 *  القاعدة: كل منظومة تستخدم هذا الملف — لا يُحسب الأسبوع يدوياً
 * ═══════════════════════════════════════════════════════════════
 */

const EDOOS_ACADEMIC_CALENDAR = {
  year: '2025-2026',

  // ── الفصول الدراسية ──────────────────────────────────────────
  semesters: [
    { num: 1, name: 'الفصل الأول',  start: '2025-09-01', end: '2025-12-07', weeks: 14 },
    { num: 2, name: 'الفصل الثاني', start: '2026-01-04', end: '2026-03-15', weeks: 11 },
    { num: 3, name: 'الفصل الثالث', start: '2026-03-30', end: '2026-07-02', weeks: 12 },
  ],

  // ── الإجازات الرسمية (لا تُحتسب كأسابيع دراسية) ─────────────
  holidays: [
    { name: 'إجازة الشتاء',    start: '2025-12-08', end: '2026-01-03' },
    { name: 'إجازة الربيع',    start: '2026-03-16', end: '2026-03-29' },
    { name: 'عيد الأضحى',     start: '2026-05-25', end: '2026-05-29' },
    { name: 'نهاية العام',     start: '2026-07-03', end: '2026-08-31' },
  ],

  // ── عطلة نهاية الأسبوع: الأحد والسبت ──────────────────────────────────────
  // 🇦🇪 معيار الإمارات الرسمي: جميع المدارس والدوائر — الدوام الاثنين إلى الجمعة
  weekendDays: [0, 6], // 0=Sunday, 6=Saturday (JS: 0=Sun..6=Sat) — UAE Standard: Mon–Fri
};

/**
 * يُرجع معلومات الأسبوع الدراسي لتاريخ معيّن
 * @param {Date} [date] - التاريخ (افتراضي: اليوم)
 * @returns {{
 *   weekNum: number,       // رقم الأسبوع في الفصل
 *   totalWeeks: number,    // إجمالي أسابيع الفصل
 *   semesterNum: number,   // رقم الفصل (1/2/3)
 *   semesterName: string,  // اسم الفصل
 *   label: string,         // "الأسبوع 10 · الفصل الثالث"
 *   shortLabel: string,    // "10 / 12 · ف3"
 *   isHoliday: boolean,    // هل اليوم إجازة؟
 *   holidayName: string,   // اسم الإجازة إن وُجدت
 *   isWeekend: boolean,    // هل نهاية الأسبوع؟
 * }}
 */
function getEduOSWeekInfo(date) {
  const cal = EDOOS_ACADEMIC_CALENDAR;
  const d = date || new Date();
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // بدون وقت

  // ── تحقق من الإجازات ────────────────────────────────────────
  let isHoliday = false;
  let holidayName = '';
  for (const h of cal.holidays) {
    const hs = new Date(h.start), he = new Date(h.end);
    if (today >= hs && today <= he) {
      isHoliday = true;
      holidayName = h.name;
      break;
    }
  }

  const isWeekend = cal.weekendDays.includes(today.getDay());

  // ── تحديد الفصل الحالي ──────────────────────────────────────
  let currentSemester = null;
  for (const sem of cal.semesters) {
    const ss = new Date(sem.start), se = new Date(sem.end);
    if (today >= ss && today <= se) {
      currentSemester = sem;
      break;
    }
  }

  // إذا كان قبل بداية العام أو بعد نهايته
  if (!currentSemester) {
    // ابحث عن أقرب فصل
    const firstSem = cal.semesters[0];
    const lastSem = cal.semesters[cal.semesters.length - 1];
    if (today < new Date(firstSem.start)) {
      return {
        weekNum: 0, totalWeeks: firstSem.weeks, semesterNum: 1,
        semesterName: firstSem.name,
        label: `قبل بداية العام الدراسي`,
        shortLabel: `—`,
        isHoliday: true, holidayName: 'قبل بداية العام', isWeekend
      };
    } else {
      // إجازة بين فصلين أو بعد نهاية العام
      const label = isHoliday ? holidayName : 'إجازة';
      return {
        weekNum: 0, totalWeeks: lastSem.weeks, semesterNum: lastSem.num,
        semesterName: lastSem.name,
        label, shortLabel: `—`,
        isHoliday: true, holidayName: label, isWeekend
      };
    }
  }

  // ── حساب الأسبوع داخل الفصل (يستثني الإجازات ونهاية الأسبوع) ─
  const semStart = new Date(currentSemester.start);
  let schoolDays = 0;
  let cursor = new Date(semStart);

  while (cursor < today) {
    const dayOfWeek = cursor.getDay();
    const isW = cal.weekendDays.includes(dayOfWeek);
    let isH = false;
    for (const h of cal.holidays) {
      if (cursor >= new Date(h.start) && cursor <= new Date(h.end)) {
        isH = true; break;
      }
    }
    if (!isW && !isH) schoolDays++;
    cursor.setDate(cursor.getDate() + 1);
  }

  const weekNum = Math.floor(schoolDays / 5) + 1;
  const clampedWeek = Math.min(weekNum, currentSemester.weeks);

  return {
    weekNum: clampedWeek,
    totalWeeks: currentSemester.weeks,
    semesterNum: currentSemester.num,
    semesterName: currentSemester.name,
    label: `الأسبوع ${clampedWeek} · ${currentSemester.name}`,
    shortLabel: `${clampedWeek} / ${currentSemester.weeks} · ف${currentSemester.num}`,
    isHoliday,
    holidayName,
    isWeekend,
  };
}

/**
 * اختصار سريع — يُرجع النص المُنسَّق مباشرة
 * مثال: "الأسبوع 10 · الفصل الثالث"
 */
function getSchoolWeekLabel(date) {
  return getEduOSWeekInfo(date).label;
}

/**
 * للاستخدام في الـ badge — مثال: "10 / 12 · ف3"
 */
function getSchoolWeekShort(date) {
  return getEduOSWeekInfo(date).shortLabel;
}

// ── تصدير للاستخدام في Node.js إن لزم ───────────────────────

/**
 * getPlatformWeek() — اختصار موحَّد لجميع الصفحات
 * يُرجع: { week, term, weekNum, termNum, termName, label, shortLabel, isHoliday, holidayName }
 */
function getPlatformWeek(date) {
  const info = getEduOSWeekInfo(date);
  return {
    week:       info.isHoliday ? (info.holidayName || 'إجازة') : info.weekNum,
    term:       info.semesterName || ('الفصل ' + info.semesterNum),
    weekNum:    info.weekNum,
    totalWeeks: info.totalWeeks,
    termNum:    info.semesterNum,
    termName:   info.semesterName,
    label:      info.label,
    shortLabel: info.shortLabel,
    isHoliday:  info.isHoliday,
    holidayName: info.holidayName,
  };
}
if (typeof window !== 'undefined') window.getPlatformWeek = getPlatformWeek;
if (typeof module !== 'undefined') {
  module.exports.getPlatformWeek = getPlatformWeek;
}

if (typeof module !== 'undefined') {
  module.exports = { EDOOS_ACADEMIC_CALENDAR, getEduOSWeekInfo, getSchoolWeekLabel, getSchoolWeekShort };
}

// ══════════════════════════════════════════════════════════════════
//  loadCalendarFromDB — يقرأ التقويم الأكاديمي من جدول academic_calendar
//  ويُحدِّث EDOOS_ACADEMIC_CALENDAR تلقائياً
//  الاستخدام:  await window.loadCalendarFromDB(supabaseClient)
//  بعدها:      window.getPlatformWeek() يعمل بالبيانات الحقيقية للمدرسة
// ══════════════════════════════════════════════════════════════════
async function loadCalendarFromDB(sb) {
  if (!sb) return false;
  try {
    const { data, error } = await sb
      .from('academic_calendar')
      .select('*')
      .order('academic_year', { ascending: false })
      .order('term_number');

    if (error || !data || data.length === 0) return false;

    // أحدث سنة دراسية في الجدول
    const latestYear = data[0].academic_year;
    const terms = data.filter(r => r.academic_year === latestYear);

    // تحويل إلى صيغة EDOOS_ACADEMIC_CALENDAR
    const semesters = terms.map(t => {
      const startD = new Date(t.start_date);
      const endD   = new Date(t.end_date);
      const diffMs = endD - startD;
      const weeks  = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
      return {
        num:   t.term_number,
        name:  t.term_name_ar || ('الفصل ' + t.term_number),
        nameEn: t.term_name_en || ('Term ' + t.term_number),
        start: t.start_date,
        end:   t.end_date,
        weeks
      };
    });

    // تحديث الكالندر الحالي
    EDOOS_ACADEMIC_CALENDAR.year      = latestYear;
    EDOOS_ACADEMIC_CALENDAR.semesters = semesters;

    // حفظ كل السنوات لعرضها في dropdown
    const allYears = [...new Set(data.map(r => r.academic_year))];
    EDOOS_ACADEMIC_CALENDAR.allYears = allYears;
    EDOOS_ACADEMIC_CALENDAR.allTerms = data;

    return true;
  } catch(e) {
    console.warn('[EduOS Week] DB load failed, using fallback calendar:', e.message);
    return false;
  }
}

if (typeof window !== 'undefined') window.loadCalendarFromDB = loadCalendarFromDB;
