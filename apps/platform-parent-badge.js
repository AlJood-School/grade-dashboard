/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS Platform Parent Badge  v1.0  (2026-09-21)
 *  ─────────────────────────────────────────────────────────────
 *  يعرض بادج صغير جانب اسم كل طالبة يُظهر حالة تفعيل ولي الأمر
 *  المطابقة: parent_phone في students = phone في parent_credentials
 *  الاستخدام:
 *    <script src="/apps/platform-parent-badge.js"></script>
 *    data-parent-phone="..." على عنصر اسم الطالبة
 *    window.ParentBadge.inject() بعد رندر الجدول
 * ═══════════════════════════════════════════════════════════════
 */
window.ParentBadge = (function () {

  // cache: phone → { activated: bool, phone_masked: string }
  var _cache = null;
  var _loading = false;
  var _callbacks = [];

  /* ── نصوص ── */
  var LABELS = {
    activated:   { ar: 'مُفعَّل',              en: 'Activated',    color: '#16A34A', bg: '#DCFCE7' },
    pending:     { ar: 'في انتظار التفعيل',    en: 'Pending',      color: '#D97706', bg: '#FEF3C7' },
    unlinked:    { ar: 'غير مرتبط',            en: 'Not Linked',   color: '#94A3B8', bg: '#F1F5F9' }
  };

  function _lang() {
    return (window.EduLang && window.EduLang.getLang && window.EduLang.getLang()) || 'ar';
  }

  function _label(key) {
    var l = LABELS[key] || LABELS.unlinked;
    return { text: _lang() === 'en' ? l.en : l.ar, color: l.color, bg: l.bg };
  }

  /* ── تقنيع رقم الجوال ── */
  function _maskPhone(p) {
    if (!p) return '—';
    var s = String(p).replace(/\s/g, '');
    if (s.length <= 4) return '****';
    return '****' + s.slice(-4);
  }

  /* ── جلب parent_credentials من DB (مرة واحدة) ── */
  async function _load() {
    if (_cache) return _cache;
    if (_loading) {
      return new Promise(function (res) { _callbacks.push(res); });
    }
    _loading = true;
    try {
      var sbUrl  = window.EduOS && window.EduOS.SB_URL;
      var sbKey  = window.EduOS && window.EduOS.SB_KEY;
      if (!sbUrl || !sbKey) { _cache = {}; return _cache; }

      var jwt = (window.eduosGetJWT && window.eduosGetJWT()) || sbKey;
      var url = sbUrl + '/rest/v1/parent_credentials?select=phone,activated&limit=2000';
      var r = await fetch(url, {
        headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + jwt, 'Accept': 'application/json' }
      });
      var data = r.ok ? await r.json() : [];
      _cache = {};
      if (Array.isArray(data)) {
        data.forEach(function (row) {
          if (row.phone) {
            var key = row.phone.replace(/\s/g, '');
            _cache[key] = { activated: !!row.activated, masked: _maskPhone(row.phone) };
          }
        });
      }
    } catch (e) {
      _cache = {};
    }
    _loading = false;
    _callbacks.forEach(function (cb) { cb(_cache); });
    _callbacks = [];
    return _cache;
  }

  /* ── HTML البادج ── */
  function _badgeHTML(phone) {
    if (!_cache) return '';
    var key = (phone || '').replace(/\s/g, '');
    var entry = _cache[key];
    var statusKey = !entry ? 'unlinked' : entry.activated ? 'activated' : 'pending';
    var lbl = _label(statusKey);
    var dotColor = statusKey === 'activated' ? '#16A34A' : statusKey === 'pending' ? '#D97706' : '#CBD5E1';
    var tooltip = !entry
      ? (_lang() === 'en' ? 'No parent account found' : 'لا يوجد حساب ولي أمر مرتبط')
      : (_lang() === 'en' ? 'Mobile: ' : 'الجوال: ') + (entry.masked);

    return '<span class="pb-badge" data-phone="' + key + '" title="' + tooltip + '" '
      + 'style="display:inline-flex;align-items:center;gap:4px;margin-right:6px;margin-inline-start:6px;'
      + 'background:' + lbl.bg + ';color:' + lbl.color + ';border-radius:20px;'
      + 'padding:2px 8px;font-size:11px;font-weight:700;cursor:default;vertical-align:middle;'
      + 'border:1px solid ' + lbl.color + '33;white-space:nowrap;font-family:Tajawal,Arial,sans-serif">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:' + dotColor + ';display:inline-block;flex-shrink:0"></span>'
      + lbl.text
      + '</span>';
  }

  /* ── حقن البوادج في الصفحة ── */
  async function inject(containerSelector) {
    await _load();
    var roots = containerSelector
      ? Array.from(document.querySelectorAll(containerSelector))
      : [document.body];

    roots.forEach(function (root) {
      // عناصر لها data-parent-phone
      root.querySelectorAll('[data-parent-phone]').forEach(function (el) {
        // لا تُضاعَف
        if (el.querySelector('.pb-badge')) return;
        var phone = el.getAttribute('data-parent-phone');
        var badge = document.createElement('span');
        badge.innerHTML = _badgeHTML(phone);
        // أضف البادج قبل أو بعد النص حسب الاتجاه
        el.appendChild(badge);
      });
    });
  }

  /* ── تحديث بادج طالبة واحدة ── */
  function update(phone, activated) {
    if (_cache) {
      var key = (phone || '').replace(/\s/g, '');
      if (_cache[key]) _cache[key].activated = activated;
    }
    document.querySelectorAll('.pb-badge[data-phone="' + (phone || '').replace(/\s/g, '') + '"]').forEach(function (el) {
      var statusKey = activated ? 'activated' : 'pending';
      var lbl = _label(statusKey);
      el.style.background = lbl.bg;
      el.style.color = lbl.color;
      el.querySelector('span').style.background = activated ? '#16A34A' : '#D97706';
      el.childNodes[el.childNodes.length - 1].textContent = lbl.text;
    });
  }

  /* ── واجهة عامة ── */
  return { inject: inject, update: update, load: _load, badgeHTML: _badgeHTML };

})();
