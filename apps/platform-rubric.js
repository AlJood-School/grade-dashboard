/**
 * platform-rubric.js — سلم التقدير المعتمد (EduOS)
 * المستوى: متقدم(4) · متقن(3) · قيد التطور(2) · ناشئ(1)
 * الاستخدامات: تقرير ولي/ة الأمر · زيارة صفية · بطاقة الطالب · التقرير الأسبوعي · المعلمة
 */
(function () {

  var LEVELS = [
    { level: 4, min: 90, label: 'متقدم',        labelEn: 'Advanced',    color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', icon: '🟢' },
    { level: 3, min: 75, label: 'متقن',          labelEn: 'Proficient',  color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD', icon: '🔵' },
    { level: 2, min: 60, label: 'قيد التطور',   labelEn: 'Developing',  color: '#B45309', bg: '#FEF3C7', border: '#FCD34D', icon: '🟡' },
    { level: 1, min: 0,  label: 'ناشئ',          labelEn: 'Emerging',    color: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5', icon: '🔴' }
  ];

  window.EduRubric = {

    /** إرجاع بيانات المستوى من نسبة مئوية (0-100) */
    fromPct: function (pct) {
      for (var i = 0; i < LEVELS.length; i++) {
        if (pct >= LEVELS[i].min) return LEVELS[i];
      }
      return LEVELS[3];
    },

    /** إرجاع بيانات المستوى من درجة ونهايتها */
    fromScore: function (score, maxScore) {
      var pct = (maxScore > 0) ? Math.round((score / maxScore) * 100) : 0;
      return this.fromPct(pct);
    },

    /** إرجاع بادج HTML */
    badge: function (score, maxScore, opts) {
      opts = opts || {};
      var r = (maxScore !== undefined) ? this.fromScore(score, maxScore) : this.fromPct(score);
      var showNum = opts.showNum !== false;
      var bilingual = opts.bilingual || false;
      var label = bilingual ? (r.label + ' | ' + r.labelEn) : r.label;
      var num = showNum ? (' (' + r.level + ')') : '';
      return '<span class="rubric-badge" style="'
        + 'background:' + r.bg + ';'
        + 'color:' + r.color + ';'
        + 'border:1px solid ' + r.border + ';'
        + 'padding:4px 12px;border-radius:20px;'
        + 'font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:5px;'
        + '">' + r.icon + ' ' + label + num + '</span>';
    },

    /** شريط تقدم مرئي */
    progressBar: function (pct) {
      var r = this.fromPct(pct);
      return '<div style="background:#F1F5F9;border-radius:6px;height:8px;overflow:hidden;margin-top:4px;">'
        + '<div style="width:' + Math.min(pct, 100) + '%;height:100%;background:' + r.color + ';border-radius:6px;transition:width .8s;"></div>'
        + '</div>';
    },

    /** مربع ملخص (للبطاقات) */
    card: function (pct, opts) {
      opts = opts || {};
      var r = this.fromPct(pct);
      return '<div style="'
        + 'background:' + r.bg + ';border:1.5px solid ' + r.border + ';'
        + 'border-radius:10px;padding:10px 14px;display:inline-block;text-align:center;">'
        + '<div style="font-size:22px;">' + r.icon + '</div>'
        + '<div style="font-size:14px;font-weight:900;color:' + r.color + ';margin-top:2px;">' + r.label + '</div>'
        + '<div style="font-size:11px;color:#94A3B8;">المستوى ' + r.level + ' من 4</div>'
        + (opts.showPct ? '<div style="font-size:13px;font-weight:700;color:' + r.color + ';">' + pct + '%</div>' : '')
        + '</div>';
    },

    /** إضافة CSS مرة واحدة */
    injectCSS: function () {
      if (document.getElementById('rubric-css')) return;
      var s = document.createElement('style');
      s.id = 'rubric-css';
      s.textContent = '.rubric-badge{white-space:nowrap;}.rubric-scale{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;}'
        + '.rubric-scale-item{padding:4px 10px;border-radius:16px;font-size:12px;font-weight:700;border:1px solid;}'
        + LEVELS.map(function(l){
            return '.rubric-l'+l.level+'{background:'+l.bg+';color:'+l.color+';border-color:'+l.border+';}';
          }).join('');
      document.head.appendChild(s);
    },

    /** عرض السلم كاملاً للمرجع */
    scaleHTML: function () {
      return '<div class="rubric-scale">'
        + LEVELS.map(function(l){
            return '<span class="rubric-scale-item rubric-l'+l.level+'">'
              + l.icon + ' ' + l.label + ' ('+l.level+')</span>';
          }).join('')
        + '</div>';
    },

    LEVELS: LEVELS
  };

  // حقن CSS تلقائياً
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.EduRubric.injectCSS(); });
  } else {
    window.EduRubric.injectCSS();
  }

})();
