// platform-curriculum.js v1
// مكتبة الخطة الفصلية المشتركة — تُحمَّل في كل صفحة تحتاج سياق المنهج الأسبوعي
// النسخة: 1.0 — 29 سبتمبر 2026
(function () {
  'use strict';
  window.EduOS = window.EduOS || {};

  // ——— getWeekContext: يُعيد بيانات أسبوع محدد من الخطة الفصلية ———
  async function getWeekContext(subject, grade, weekNum, term, year) {
    const SB_URL = window.EduOS && window.EduOS.SB_URL || '';
    const SB_KEY = window.EduOS && window.EduOS.SB_KEY || '';
    if (!SB_URL || !subject || !weekNum) return null;
    term = term || 1;
    year = year || '2026-2027';

    try {
      // Step 1: find matching plan(s) for this subject+grade+term+year
      let planUrl = SB_URL + '/rest/v1/curriculum_plans'
        + '?is_active=eq.true&term=eq.' + term + '&academic_year=eq.' + encodeURIComponent(year)
        + '&subject=ilike.' + encodeURIComponent('*' + subject.split(' ')[0] + '*')
        + '&select=id,subject,grade,cycle'
        + '&limit=10';
      const planRes = await fetch(planUrl, {
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
      });
      const plans = await planRes.json();
      if (!plans || !plans.length) return null;

      // Prefer grade-specific plan; fall back to 'all' plan
      const exact = plans.find(function (p) { return p.grade === grade; });
      const allGrades = plans.find(function (p) { return p.grade === 'all' || !p.grade; });
      const plan = exact || allGrades || plans[0];
      if (!plan) return null;

      // Step 2: get week data
      const weekRes = await fetch(
        SB_URL + '/rest/v1/curriculum_plan_weeks?plan_id=eq.' + plan.id + '&week_number=eq.' + weekNum + '&limit=1',
        { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } }
      );
      const weeks = await weekRes.json();
      if (!weeks || !weeks.length) return null;
      return Object.assign({}, weeks[0], { plan_subject: plan.subject, plan_grade: plan.grade });
    } catch (e) {
      return null;
    }
  }

  // ——— getCurrentWeekNum: يُعيد رقم الأسبوع الحالي من platform-week.js ———
  function getCurrentWeekNum() {
    return window.CURRENT_WEEK_NUM || window.EDUOS_WEEK_NUM || window.PLATFORM_WEEK || 1;
  }

  // ——— renderCurriculumBanner: يُضيف شريط الخطة الفصلية في عنصر HTML ———
  async function renderCurriculumBanner(containerId, subject, grade, term, year) {
    if (!containerId || !subject) return;
    const container = document.getElementById(containerId);
    if (!container) return;
    const weekNum = getCurrentWeekNum();
    const ctx = await getWeekContext(subject, grade, weekNum, term, year);
    if (!ctx) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    container.innerHTML = '<div style="background:linear-gradient(135deg,#ede9fd,#e0f2fe);border:1px solid #c4b5fd;border-radius:12px;padding:12px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;">'
      + '<span style="font-size:14px;font-weight:800;color:#6C3DD6;flex-shrink:0;">📚 الخطة الفصلية</span>'
      + (ctx.unit_number ? '<span style="font-size:14px;color:#374151;font-weight:600;">وحدة ' + ctx.unit_number + ': ' + (ctx.unit_name || '') + '</span><span style="color:#d1d5db;">|</span>' : '')
      + '<span style="font-size:14px;font-weight:800;color:#1e293b;">' + ctx.topic + '</span>'
      + (ctx.keywords && ctx.keywords.length ? '<span style="color:#d1d5db;">|</span><span style="font-size:13px;color:#64748b;">الكلمات: ' + ctx.keywords.join('، ') + '</span>' : '')
      + (ctx.bloom_focus && ctx.bloom_focus.length ? '<span style="color:#d1d5db;">|</span><span style="font-size:13px;color:#6C3DD6;">بلوم: ' + ctx.bloom_focus.join('، ') + '</span>' : '')
      + '<a href="/apps/eduos-curriculum-plan/" style="margin-right:auto;font-size:13px;color:#6C3DD6;text-decoration:none;font-weight:700;white-space:nowrap;">عرض الخطة ←</a>'
      + '</div>';
  }

  // ——— getPlanSummary: ملخص الخطة لصفحة ولي الأمر / التقارير ———
  async function getPlanSummary(subject, grade, term, year) {
    const SB_URL = window.EduOS && window.EduOS.SB_URL || '';
    const SB_KEY = window.EduOS && window.EduOS.SB_KEY || '';
    if (!SB_URL || !subject) return null;
    term = term || 1; year = year || '2026-2027';
    try {
      const r = await fetch(SB_URL + '/rest/v1/curriculum_plans?is_active=eq.true&term=eq.' + term
        + '&academic_year=eq.' + encodeURIComponent(year)
        + '&subject=ilike.' + encodeURIComponent('*' + subject.split(' ')[0] + '*')
        + '&select=id,subject,grade,cycle,curriculum_plan_weeks(week_number,unit_name,topic)&limit=5',
        { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } });
      const data = await r.json();
      return data && data.length ? data[0] : null;
    } catch (e) { return null; }
  }

  window.EduOS.curriculum = {
    getWeekContext: getWeekContext,
    renderCurriculumBanner: renderCurriculumBanner,
    getPlanSummary: getPlanSummary,
    getCurrentWeekNum: getCurrentWeekNum
  };
})();
