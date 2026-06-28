/**
 * platform-curriculum-rules.js  — v1.0
 * مساعد قواعد المناهج الديناميكي
 * NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712 · أبوظبي
 *
 * الاستخدام:
 *   await loadCurriculumRules(gradeNum?)   // حمّل مرة واحدة عند بدء الصفحة
 *   getPassScore(gradeNum?)               // 50 لـ MOE G4-8، 60 لـ G9-12، إلخ
 *   getDangerThreshold(gradeNum?)         // عتبة الخطر (أعلى من pass_score)
 *   getGradeBands(gradeNum?)              // { A:90, B:80, C:70, D:50 }
 *   getCurriculumType()                   // 'MOE' | 'ADEK' | 'KHDA' | ...
 *   isRetentionAllowed(gradeNum?)         // هل يُسمح بإعادة السنة؟
 *
 * يعتمد على: SB_URL + SB_ANON (مُعرَّفان في الصفحة الحاملة)
 */

(function(global) {
  'use strict';

  const _CACHE_KEY = 'eduos_curr_rules_v1';
  const _CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

  let _rules       = null;
  let _currType    = 'MOE';
  let _loadPromise = null;

  // ── تحويل رقم الصف إلى grade_group (يعتمد على المنهج الحالي) ────
  function _groupForGrade(gradeNum) {
    if (!gradeNum && gradeNum !== 0) return 'G4-8';
    const s = String(gradeNum).trim().toUpperCase();

    // أنماط خاصة
    if (s.includes('GCSE'))                             return 'GCSE';
    if (s.includes('A-LEVEL') || s.includes('ALEVEL')) return 'A-Level';
    if (s.includes('IBDP'))                             return 'ALL';

    // KG/Foundation
    if (s.includes('KG') || s === 'K' || s === 'KS1' || s === 'FOUNDATION') {
      return _currType === 'ADEK' ? 'K-5' : 'K-3';
    }

    const n = parseInt(s.replace(/[^0-9]/g, '')) || 0;
    if (n === 0) return _currType === 'ADEK' ? 'K-5' : 'K-3';

    // ADEK: K-5 / G6-12
    if (_currType === 'ADEK') {
      return n <= 5 ? 'K-5' : 'G6-12';
    }

    // British: Y1-9 / GCSE / A-Level
    if (_currType === 'British') {
      if (n <= 9)  return 'Y1-9';
      if (n <= 11) return 'GCSE';
      return 'A-Level';
    }

    // MOE / KHDA / CBSE / American / IB — استخدام المجموعات الأربع العامة
    if (n <= 3)  return 'K-3';
    if (n <= 8)  return 'G4-8';
    return 'G9-12';
  }

  function _bestRule(gradeNum) {
    if (!_rules || !_rules.length) return null;
    const group = _groupForGrade(gradeNum);
    return (
      _rules.find(r => r.grade_group === group) ||
      _rules.find(r => r.grade_group === 'ALL') ||
      _rules[0]
    );
  }

  // ── الدوال العامة ─────────────────────────────────────────────────
  function getPassScore(gradeNum) {
    const r = _bestRule(gradeNum);
    return r ? (parseFloat(r.pass_score) || 50) : 50;
  }

  function getDangerThreshold(gradeNum) {
    const r = _bestRule(gradeNum);
    return r ? (parseFloat(r.danger_threshold) || 60) : 60;
  }

  function getGradeBands(gradeNum) {
    const r = _bestRule(gradeNum);
    if (!r) return { A: 90, B: 80, C: 70, D: 50 };
    return {
      A: parseFloat(r.grade_a) || 90,
      B: parseFloat(r.grade_b) || 80,
      C: parseFloat(r.grade_c) || 70,
      D: r.grade_d != null ? parseFloat(r.grade_d) : (parseFloat(r.pass_score) || 50)
    };
  }

  function getCurriculumType()          { return _currType; }
  function isRetentionAllowed(gradeNum) {
    const r = _bestRule(gradeNum);
    return r ? !!r.retention_allowed : true;
  }

  // ── تحميل القواعد من Supabase ─────────────────────────────────────
  async function loadCurriculumRules(gradeNum) {
    // إذا تم التحميل بالفعل — اختياري gradeNum للسياق فقط
    if (_rules) return _rules;

    // منع طلبات متعددة متزامنة
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      // 1) حاول الكاش
      try {
        const cached = sessionStorage.getItem(_CACHE_KEY);
        if (cached) {
          const obj = JSON.parse(cached);
          if (Date.now() - obj.ts < _CACHE_TTL) {
            _rules    = obj.rules;
            _currType = obj.type || 'MOE';
            return _rules;
          }
        }
      } catch(e) {}

      const url  = (typeof SB_URL  !== 'undefined') ? SB_URL  : '';
      const anon = (typeof SB_ANON !== 'undefined') ? SB_ANON : '';
      if (!url || !anon) {
        _rules = _defaults();
        return _rules;
      }

      // 2) اجلب curriculum_type من app_settings
      try {
        const sRes = await fetch(
          `${url}/rest/v1/app_settings?key=eq.curriculum_type&select=value&limit=1`,
          { headers: { 'apikey': anon, 'Authorization': `Bearer ${anon}` } }
        );
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData?.[0]?.value) _currType = sData[0].value;
        }
      } catch(e) {}

      // 3) اجلب قواعد المنهج
      try {
        const rRes = await fetch(
          `${url}/rest/v1/curriculum_rules?curriculum_type=eq.${encodeURIComponent(_currType)}&select=*`,
          { headers: { 'apikey': anon, 'Authorization': `Bearer ${anon}` } }
        );
        if (rRes.ok) {
          const rData = await rRes.json();
          if (Array.isArray(rData) && rData.length) {
            _rules = rData;
            try {
              sessionStorage.setItem(_CACHE_KEY, JSON.stringify({
                rules: rData, type: _currType, ts: Date.now()
              }));
            } catch(e) {}
            return _rules;
          }
        }
      } catch(e) {}

      // 4) قيم افتراضية (MOE G4-8)
      _rules = _defaults();
      return _rules;
    })();

    return _loadPromise;
  }

  function _defaults() {
    return [
      { curriculum_type:'MOE', grade_group:'K-3',   pass_score:50, danger_threshold:60, grade_a:90, grade_b:80, grade_c:70, grade_d:50, retention_allowed:false },
      { curriculum_type:'MOE', grade_group:'G4-8',  pass_score:50, danger_threshold:60, grade_a:90, grade_b:80, grade_c:70, grade_d:50, retention_allowed:true  },
      { curriculum_type:'MOE', grade_group:'G9-12', pass_score:60, danger_threshold:70, grade_a:90, grade_b:80, grade_c:70, grade_d:60, retention_allowed:true  }
    ];
  }

  // ── تصدير ─────────────────────────────────────────────────────────
  global.loadCurriculumRules  = loadCurriculumRules;
  global.getPassScore         = getPassScore;
  global.getDangerThreshold   = getDangerThreshold;
  global.getGradeBands        = getGradeBands;
  global.getCurriculumType    = getCurriculumType;
  global.isRetentionAllowed   = isRetentionAllowed;

  // تحميل تلقائي إذا كانت بيانات Supabase متاحة
  if (typeof SB_URL !== 'undefined' && typeof SB_ANON !== 'undefined') {
    loadCurriculumRules().catch(() => {});
  }

})(typeof window !== 'undefined' ? window : globalThis);
