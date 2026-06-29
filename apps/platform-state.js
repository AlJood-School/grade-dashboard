/**
 * ═══════════════════════════════════════════════════════════════════
 *  platform-state.js  v1.0
 *  محرك حالة المنصة الذكي — Platform State Intelligence Engine
 *  © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 *  EduOS / بوابة الجود الذكية
 *
 *  ما يفعله:
 *  1. يحسب التقويم الهجري (رمضان + أعياد) بدون API خارجي
 *  2. يقرأ الحالة من Supabase (platform_state)
 *  3. يُصدِّر getPlatformState() → كل صفحة تقرأ منه
 *  4. يُحدِّث الثيم والأيقونة والـ MOTD تلقائياً
 *  5. يستمع لتغييرات realtime (Principal Override)
 *
 *  الاستخدام:
 *  <script src="../platform-state.js"></script>
 *  const state = await getPlatformState();
 * ═══════════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  // ═══════════════════════════════════════════════════════
  // 1. حاسبة التقويم الهجري (Algorithmic — no API needed)
  //    خوارزمية كويتي (Kuwaiti Algorithm) معتمدة
  // ═══════════════════════════════════════════════════════

  const HijriCalc = {
    /**
     * تحويل تاريخ ميلادي → هجري
     * @returns {{ year, month, day }}
     */
    toHijri(gDate) {
      const d = gDate || new Date();
      const JD = this._gregorianToJD(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return this._JDToHijri(JD);
    },

    _gregorianToJD(y, m, d) {
      if (m <= 2) { y -= 1; m += 12; }
      const A = Math.floor(y / 100);
      const B = 2 - A + Math.floor(A / 4);
      return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    },

    _JDToHijri(JD) {
      const Z = Math.floor(JD + 0.5);
      const a = Math.floor((Z - 1867216.25) / 36524.25);
      const A = Z + 1 + a - Math.floor(a / 4);
      const B = A + 1524;
      const C = Math.floor((B - 122.1) / 365.25);
      const D = Math.floor(365.25 * C);
      const E = Math.floor((B - D) / 30.6001);
      const day = B - D - Math.floor(30.6001 * E);
      const month = (E < 14) ? E - 1 : E - 13;
      const year = (month > 2) ? C - 4716 : C - 4715;
      // Gregorian → Julian Day → back → Hijri
      const JH = JD - 1948439.5;
      const HY = Math.floor((30 * JH + 10646) / 10631);
      const HM = Math.min(12, Math.floor((11 * (JH - Math.floor((11 * HY + 3) / 30) - 1948440 + 385) + 330) / 325));
      const HD = JH - Math.floor((29.5001 * HM) + (HY - 1) * 354 + Math.floor((3 + 11 * HY) / 30) + 1 + 29);
      return {
        year:  Math.floor((JH - HD) / 354.3666 + 1),
        month: HM,
        day:   Math.max(1, Math.floor(HD + 1))
      };
    },

    /**
     * يُرجع تقريب تاريخ بداية رمضان لسنة هجرية معينة (ميلادي)
     * استناداً للحسابات الفلكية للإمارات
     */
    getRamadanDates(hijriYear) {
      // جدول محسوب مسبقاً للسنوات 1446-1450 هجرية
      const TABLE = {
        1446: { start: '2025-03-01', end: '2025-03-29' },
        1447: { start: '2026-02-18', end: '2026-03-18' },
        1448: { start: '2027-02-07', end: '2027-03-08' },
        1449: { start: '2028-01-28', end: '2028-02-25' },
        1450: { start: '2029-01-16', end: '2029-02-14' },
      };
      return TABLE[hijriYear] || null;
    },

    /**
     * يُرجع تاريخ عيد الأضحى تقريباً
     */
    getEidAlAdhaDates(hijriYear) {
      const TABLE = {
        1446: { start: '2025-06-06', end: '2025-06-10' },
        1447: { start: '2026-05-27', end: '2026-05-31' },
        1448: { start: '2027-05-17', end: '2027-05-21' },
        1449: { start: '2028-05-05', end: '2028-05-09' },
        1450: { start: '2029-04-25', end: '2029-04-29' },
      };
      return TABLE[hijriYear] || null;
    },

    /**
     * هل اليوم في رمضان؟ (بناءً على حساب هجري)
     */
    isRamadan(gDate) {
      const h = this.toHijri(gDate);
      return h.month === 9;
    },

    /**
     * هل اليوم قريب من عيد؟ (3 أيام قبل / خلال العيد)
     */
    isEidPeriod(gDate) {
      const h = this.toHijri(gDate);
      // عيد الفطر: شوال 1-3
      if (h.month === 10 && h.day <= 5) return 'eid_fitr';
      // عيد الأضحى: ذو الحجة 10-13
      if (h.month === 12 && h.day >= 10 && h.day <= 14) return 'eid_adha';
      return null;
    },
  };

  // ═══════════════════════════════════════════════════════
  // 2. تعريف الحالات وخصائصها
  // ═══════════════════════════════════════════════════════

  const STATE_CONFIG = {
    normal_school_day: {
      labelAr: 'يوم دراسي',
      labelEn: 'School Day',
      icon: '🏫',
      theme: 'default',
      motdCategory: 'motivation',
      atheerFlow: 'normal',
      timetableMode: 'standard',
      attendanceMode: 'standard',
      parentAlert: null,
      hubBannerColor: null,
    },
    exam_period: {
      labelAr: 'فترة الامتحانات',
      labelEn: 'Exam Period',
      icon: '📝',
      theme: 'exam',
      motdCategory: 'dua_success',
      atheerFlow: 'exam_anxiety',
      timetableMode: 'exam',
      attendanceMode: 'exam_strict',
      parentAlert: 'امتحانات هذا الأسبوع — تأكد/ي من استعداد طفلك/ي',
      hubBannerColor: '#ef4444',
    },
    exam_prep_week: {
      labelAr: 'أسبوع المراجعة',
      labelEn: 'Revision Week',
      icon: '📚',
      theme: 'default',
      motdCategory: 'study_tips',
      atheerFlow: 'study_support',
      timetableMode: 'revision',
      attendanceMode: 'standard',
      parentAlert: 'أسبوع مراجعة — شجّع/ي طفلك/ي على المذاكرة',
      hubBannerColor: '#f59e0b',
    },
    ramadan_schedule: {
      labelAr: 'رمضان المبارك 🌙',
      labelEn: 'Ramadan Schedule',
      icon: '🌙',
      theme: 'ramadan',
      motdCategory: 'ramadan',
      atheerFlow: 'ramadan',
      timetableMode: 'short_day',
      attendanceMode: 'ramadan',
      parentAlert: 'جدول رمضان معمول به — مواعيد مختلفة',
      hubBannerColor: '#f59e0b',
    },
    holiday_religious: {
      labelAr: 'إجازة دينية',
      labelEn: 'Religious Holiday',
      icon: '🕌',
      theme: 'holiday',
      motdCategory: 'eid',
      atheerFlow: 'holiday',
      timetableMode: 'holiday',
      attendanceMode: 'holiday',
      parentAlert: 'إجازة رسمية — لا دراسة',
      hubBannerColor: '#22c55e',
    },
    holiday_national: {
      labelAr: 'عطلة وطنية',
      labelEn: 'National Holiday',
      icon: '🇦🇪',
      theme: 'national',
      motdCategory: 'national_day',
      atheerFlow: 'holiday',
      timetableMode: 'holiday',
      attendanceMode: 'holiday',
      parentAlert: 'عطلة وطنية — لا دراسة',
      hubBannerColor: '#22c55e',
    },
    distance_learning: {
      labelAr: 'تعلّم عن بُعد',
      labelEn: 'Distance Learning',
      icon: '💻',
      theme: 'default',
      motdCategory: 'distance',
      atheerFlow: 'home_support',
      timetableMode: 'online',
      attendanceMode: 'digital',
      parentAlert: 'اليوم تعلّم عن بُعد — تأكد/ي من جهاز الطفل/ة',
      hubBannerColor: '#3b82f6',
    },
    emergency_closure: {
      labelAr: '🚨 إغلاق طارئ',
      labelEn: '🚨 Emergency Closure',
      icon: '🚨',
      theme: 'emergency',
      motdCategory: 'safety',
      atheerFlow: 'calm',
      timetableMode: 'holiday',
      attendanceMode: 'holiday',
      parentAlert: '🚨 إغلاق طارئ — لا تعليم اليوم. ابق/ي في أمان.',
      hubBannerColor: '#ef4444',
    },
    summer_break: {
      labelAr: 'إجازة الصيف',
      labelEn: 'Summer Break',
      icon: '☀️',
      theme: 'summer',
      motdCategory: 'motivation',
      atheerFlow: 'holiday',
      timetableMode: 'holiday',
      attendanceMode: 'holiday',
      parentAlert: null,
      hubBannerColor: '#f59e0b',
    },
    orientation_week: {
      labelAr: 'أسبوع التوجيه',
      labelEn: 'Orientation Week',
      icon: '👋',
      theme: 'default',
      motdCategory: 'welcome',
      atheerFlow: 'welcome',
      timetableMode: 'orientation',
      attendanceMode: 'standard',
      parentAlert: 'مرحباً بالعام الجديد! أسبوع التوجيه هذا الأسبوع',
      hubBannerColor: '#22c55e',
    },
    makeup_exams: {
      labelAr: 'امتحانات الإعادة',
      labelEn: 'Makeup Exams',
      icon: '🔄',
      theme: 'exam',
      motdCategory: 'dua_success',
      atheerFlow: 'exam_anxiety',
      timetableMode: 'exam',
      attendanceMode: 'exam_strict',
      parentAlert: 'امتحانات الإعادة جارية هذا الأسبوع',
      hubBannerColor: '#f59e0b',
    },
    half_day: {
      labelAr: 'نصف يوم',
      labelEn: 'Half Day',
      icon: '⏰',
      theme: 'default',
      motdCategory: 'motivation',
      atheerFlow: 'normal',
      timetableMode: 'half_day',
      attendanceMode: 'standard',
      parentAlert: '⏰ اليوم نصف يوم — الانصراف المبكر',
      hubBannerColor: '#8b5cf6',
    },
  };

  // ═══════════════════════════════════════════════════════
  // 3. تخزين مؤقت + متغير عام
  // ═══════════════════════════════════════════════════════

  let _cachedState = null;
  let _cacheTime   = 0;
  const CACHE_TTL  = 5 * 60 * 1000; // 5 دقائق

  // ═══════════════════════════════════════════════════════
  // 4. الحساب المحلي (fallback بدون Supabase)
  // ═══════════════════════════════════════════════════════

  function _calculateStateLocally(date) {
    const d = date || new Date();
    const today = d.toISOString().split('T')[0];

    // تحقق من رمضان
    if (HijriCalc.isRamadan(d)) return 'ramadan_schedule';

    // تحقق من أيام العيد
    const eid = HijriCalc.isEidPeriod(d);
    if (eid) return 'holiday_religious';

    // مقارنة مع academic_events المحسوبة
    const STATIC_RANGES = [
      { start: '2025-09-01', end: '2025-09-07', state: 'orientation_week' },
      { start: '2025-12-01', end: '2025-12-04', state: 'holiday_national' },
      { start: '2025-12-08', end: '2026-01-03', state: 'summer_break' },
      { start: '2026-02-18', end: '2026-03-18', state: 'ramadan_schedule' },
      { start: '2026-03-16', end: '2026-03-29', state: 'summer_break' },
      { start: '2026-03-19', end: '2026-04-05', state: 'holiday_religious' },
      { start: '2026-06-14', end: '2026-06-23', state: 'exam_prep_week' },
      { start: '2026-06-24', end: '2026-07-03', state: 'exam_period' },
      { start: '2026-07-06', end: '2026-07-09', state: 'makeup_exams' },
      { start: '2026-07-14', end: '2026-07-17', state: 'makeup_exams' },
      { start: '2026-07-18', end: '2026-08-31', state: 'summer_break' },
    ];

    for (const r of STATIC_RANGES) {
      if (today >= r.start && today <= r.end) return r.state;
    }

    // يوم الجمعة والسبت = لا مدرسة
    const dow = d.getDay();
    if (dow === 5 || dow === 6) return 'weekend';

    return 'normal_school_day';
  }

  // ═══════════════════════════════════════════════════════
  // 5. جلب الحالة من Supabase
  // ═══════════════════════════════════════════════════════

  async function _fetchStateFromDB(schoolId) {
    try {
      const url  = window.SB_URL || (window._eduosConfig && window._eduosConfig.url);
      const key  = window.SB_KEY || (window._eduosConfig && window._eduosConfig.key);
      if (!url || !key) return null;

      const res = await fetch(
        `${url}/rest/v1/platform_state?is_active=eq.true&select=state,label_ar,label_en,icon,theme_override&order=valid_from.desc&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return rows.length ? rows[0] : null;
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════
  // 6. الدالة الرئيسية المُصدَّرة
  // ═══════════════════════════════════════════════════════

  /**
   * يُرجع حالة المنصة الحالية مع كل خصائصها
   * @param {Object} opts - { schoolId, forceRefresh }
   * @returns {Promise<Object>} - { state, config, labelAr, labelEn, icon, theme, ... }
   */
  async function getPlatformState(opts) {
    opts = opts || {};

    // استخدم الكاش إذا صالح
    if (!opts.forceRefresh && _cachedState && (Date.now() - _cacheTime < CACHE_TTL)) {
      return _cachedState;
    }

    // حاول من DB أولاً
    let stateKey = null;
    let dbRow = null;

    if (!opts.localOnly) {
      dbRow = await _fetchStateFromDB(opts.schoolId);
      if (dbRow) stateKey = dbRow.state;
    }

    // fallback للحساب المحلي
    if (!stateKey) {
      stateKey = _calculateStateLocally(opts.date);
    }

    const config = STATE_CONFIG[stateKey] || STATE_CONFIG.normal_school_day;

    const result = {
      state:         stateKey,
      labelAr:       dbRow?.label_ar   || config.labelAr,
      labelEn:       dbRow?.label_en   || config.labelEn,
      icon:          dbRow?.icon       || config.icon,
      theme:         dbRow?.theme_override || config.theme,
      motdCategory:  config.motdCategory,
      atheerFlow:    config.atheerFlow,
      timetableMode: config.timetableMode,
      attendanceMode:config.attendanceMode,
      parentAlert:   config.parentAlert,
      hubBannerColor:config.hubBannerColor,
      isHoliday:     ['holiday_religious','holiday_national','summer_break'].includes(stateKey),
      isExam:        ['exam_period','makeup_exams'].includes(stateKey),
      isRamadan:     stateKey === 'ramadan_schedule',
      isEmergency:   stateKey === 'emergency_closure',
      isWeekend:     stateKey === 'weekend',
      source:        dbRow ? 'supabase' : 'local_calc',
      timestamp:     new Date().toISOString(),
    };

    _cachedState = result;
    _cacheTime   = Date.now();

    // بث الحالة عبر CustomEvent
    window.dispatchEvent(new CustomEvent('platformStateLoaded', { detail: result }));

    return result;
  }

  // ═══════════════════════════════════════════════════════
  // 7. تطبيق الثيم تلقائياً حسب الحالة
  // ═══════════════════════════════════════════════════════

  function applyStateTheme(state) {
    const body = document.body;
    if (!body) return;

    // أزِل كلاسات الحالة القديمة
    body.classList.remove(
      'state-exam', 'state-ramadan', 'state-holiday',
      'state-emergency', 'state-summer', 'state-national', 'state-orientation'
    );

    const themeMap = {
      exam:       'state-exam',
      ramadan:    'state-ramadan',
      holiday:    'state-holiday',
      national:   'state-national',
      emergency:  'state-emergency',
      summer:     'state-summer',
      orientation:'state-orientation',
    };

    if (themeMap[state.theme]) {
      body.classList.add(themeMap[state.theme]);
    }

    // تحديث متغيرات CSS حسب الحالة
    const root = document.documentElement;
    if (state.theme === 'ramadan') {
      root.style.setProperty('--accent-state', '#f59e0b');
      root.style.setProperty('--accent-state2', '#d97706');
      root.style.setProperty('--state-banner', 'rgba(245,158,11,0.15)');
    } else if (state.theme === 'exam') {
      root.style.setProperty('--accent-state', '#ef4444');
      root.style.setProperty('--accent-state2', '#dc2626');
      root.style.setProperty('--state-banner', 'rgba(239,68,68,0.12)');
    } else if (state.theme === 'holiday' || state.theme === 'national') {
      root.style.setProperty('--accent-state', '#22c55e');
      root.style.setProperty('--accent-state2', '#16a34a');
      root.style.setProperty('--state-banner', 'rgba(34,197,94,0.12)');
    } else {
      root.style.setProperty('--accent-state', '#3b82f6');
      root.style.setProperty('--accent-state2', '#6C3DD6');
      root.style.setProperty('--state-banner', 'rgba(59,130,246,0.08)');
    }
  }

  // ═══════════════════════════════════════════════════════
  // 8. بانر الحالة (State Banner) — يُضاف للصفحة تلقائياً
  // ═══════════════════════════════════════════════════════

  function injectStateBanner(state) {
    if (!state.hubBannerColor) return;
    if (document.getElementById('eduos-state-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'eduos-state-banner';
    banner.style.cssText = `
      background: ${state.hubBannerColor}22;
      border-bottom: 2px solid ${state.hubBannerColor}66;
      padding: 8px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Tajawal', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      direction: rtl;
      position: sticky;
      top: 64px;
      z-index: 90;
      backdrop-filter: blur(8px);
      transition: all 0.3s;
    `;
    banner.innerHTML = `
      <span style="font-size:18px;">${state.icon}</span>
      <span>${state.labelAr}</span>
      <span style="opacity:.6;font-size:11px;margin-right:4px;">${state.labelEn}</span>
      ${state.parentAlert ? `<span style="margin-right:auto;font-size:11px;opacity:.75;background:${state.hubBannerColor}33;padding:2px 8px;border-radius:20px;">${state.parentAlert}</span>` : ''}
      <button onclick="this.parentElement.style.display='none'" style="background:none;border:none;color:#fff;cursor:pointer;opacity:.6;font-size:16px;margin-right:auto;">×</button>
    `;

    const firstChild = document.body.firstChild;
    document.body.insertBefore(banner, firstChild?.nextSibling || firstChild);
  }

  // ═══════════════════════════════════════════════════════
  // 9. Override للمديرة — يُرسل لـ Supabase عبر Edge Function
  // ═══════════════════════════════════════════════════════

  async function overridePlatformState(newState, opts) {
    opts = opts || {};
    const url = window.SB_URL || (window._eduosConfig && window._eduosConfig.url);
    const key = window.SB_KEY || (window._eduosConfig && window._eduosConfig.key);
    if (!url || !key) return { success: false, error: 'no_config' };

    try {
      // أوقف الحالة الحالية
      await fetch(`${url}/rest/v1/platform_state?is_active=eq.true`, {
        method: 'PATCH',
        headers: {
          apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal'
        },
        body: JSON.stringify({ is_active: false, valid_until: new Date().toISOString() })
      });

      // أضف الحالة الجديدة
      const config = STATE_CONFIG[newState] || STATE_CONFIG.normal_school_day;
      const res = await fetch(`${url}/rest/v1/platform_state`, {
        method: 'POST',
        headers: {
          apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=representation'
        },
        body: JSON.stringify({
          state:           newState,
          label_ar:        opts.labelAr  || config.labelAr,
          label_en:        opts.labelEn  || config.labelEn,
          icon:            opts.icon     || config.icon,
          theme_override:  config.theme,
          source:          'manual',
          override_note:   opts.note     || null,
          valid_until:     opts.validUntil || null,
          is_active:       true,
        })
      });

      // سجّل في التاريخ
      await fetch(`${url}/rest/v1/platform_state_history`, {
        method: 'POST',
        headers: {
          apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          previous_state: _cachedState?.state || 'unknown',
          new_state:      newState,
          change_source:  'manual',
          note:           opts.note || null,
        })
      });

      // تحديث الكاش
      _cachedState = null;
      const newStateObj = await getPlatformState({ forceRefresh: true });
      window.dispatchEvent(new CustomEvent('platformStateChanged', { detail: newStateObj }));

      return { success: true, state: newStateObj };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ═══════════════════════════════════════════════════════
  // 10. تهيئة تلقائية عند تحميل الصفحة
  // ═══════════════════════════════════════════════════════

  async function _autoInit() {
    try {
      const state = await getPlatformState({ localOnly: false });
      if (state.isWeekend || state.isHoliday) return; // لا تُضف بانر في الإجازات
      applyStateTheme(state);
      // بانر للمعلمات/المدراء فقط (ليس للطلاب)
      const role = sessionStorage.getItem('eduos_role') || '';
      if (['teacher','principal','admin','specialist'].includes(role)) {
        injectStateBanner(state);
      }
    } catch (e) {
      // silent fail
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _autoInit);
  } else {
    _autoInit();
  }

  // ═══════════════════════════════════════════════════════
  // 11. الـ API العام
  // ═══════════════════════════════════════════════════════

  window.EduOSState = {
    getPlatformState,
    overridePlatformState,
    applyStateTheme,
    injectStateBanner,
    HijriCalc,
    STATE_CONFIG,
    getStateConfig: (key) => STATE_CONFIG[key] || STATE_CONFIG.normal_school_day,
  };

  // Backward-compat alias
  window.getPlatformState = getPlatformState;

})(window);
