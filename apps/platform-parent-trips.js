/**
 * platform-parent-trips.js
 * EduOS — يُحقن في بوابة ولي/ة الأمر
 * يضيف تبويبين: الرحلات + إذن التصوير
 * يقرأ البيانات من Supabase مباشرة — لا ذاكرة محلية
 */
(function () {
  'use strict';

  // ── CSS مدمج ──
  var style = document.createElement('style');
  style.textContent = [
    '.pt-card{background:#fff;border-radius:14px;border:1.5px solid #E2E8F0;padding:18px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.04)}',
    '.pt-title{font-size:1rem;font-weight:800;color:#0F172A;margin-bottom:14px;display:flex;align-items:center;gap:8px}',
    '.pt-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:.78rem;font-weight:700}',
    '.pt-pending{background:#FEF9C3;color:#A16207}',
    '.pt-approved{background:#D1FAE5;color:#065F46}',
    '.pt-rejected{background:#FEE2E2;color:#991B1B}',
    '.pt-completed{background:#F1F5F9;color:#475569}',
    '.pt-meta{font-size:.85rem;color:#64748B;margin-bottom:10px;display:flex;flex-wrap:wrap;gap:10px}',
    '.pt-meta span{display:flex;align-items:center;gap:4px}',
    '.pt-btn{padding:10px 20px;border-radius:10px;border:none;cursor:pointer;font-size:.9rem;font-weight:700;font-family:inherit;transition:.15s}',
    '.pt-btn-green{background:#16A34A;color:#fff}.pt-btn-green:hover{background:#15803D}',
    '.pt-btn-red{background:#EF4444;color:#fff}.pt-btn-red:hover{background:#DC2626}',
    '.pt-btn-gray{background:#F1F5F9;color:#475569}.pt-btn-gray:hover{background:#E2E8F0}',
    '.pt-empty{text-align:center;padding:36px;color:#94A3B8;font-size:.95rem}',
    '.pt-perm-row{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border:1.5px solid #E2E8F0;border-radius:12px;margin-bottom:10px}',
    '.pt-toggle{position:relative;width:52px;height:28px;cursor:pointer}',
    '.pt-toggle input{opacity:0;width:0;height:0}',
    '.pt-slider{position:absolute;inset:0;background:#CBD5E1;border-radius:20px;transition:.3s}',
    '.pt-slider:before{content:"";position:absolute;width:22px;height:22px;bottom:3px;right:3px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.2)}',
    '.pt-toggle input:checked + .pt-slider{background:#16A34A}',
    '.pt-toggle input:checked + .pt-slider:before{transform:translateX(-24px)}'
  ].join('\n');
  document.head.appendChild(style);

  // ── انتظر تحميل الصفحة ──
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // إضافة تبويبي الناف الجانبي
    injectNavItems();
    // إضافة لوحات المحتوى
    injectPanels();
    // تحميل البيانات عند النقر
  });

  // ────────────────────────
  // حقن الناف الجانبي
  // ────────────────────────
  function injectNavItems() {
    // نبحث عن آخر .sb-item لنضيف بعده
    var sbItems = document.querySelectorAll('.sb-item');
    if (!sbItems.length) return;
    var lastItem = sbItems[sbItems.length - 1];
    var parent = lastItem.parentNode;

    var tripsNav = document.createElement('div');
    tripsNav.className = 'sb-item';
    tripsNav.setAttribute('data-tab', 'trips');
    tripsNav.setAttribute('onclick', "switchTab('trips',this)");
    tripsNav.innerHTML = '<span>🚌</span><span>الرحلات المدرسية</span>';

    var mediaNav = document.createElement('div');
    mediaNav.className = 'sb-item';
    mediaNav.setAttribute('data-tab', 'media');
    mediaNav.setAttribute('onclick', "switchTab('media',this)");
    mediaNav.innerHTML = '<span>📸</span><span>إذن التصوير</span>';

    parent.appendChild(tripsNav);
    parent.appendChild(mediaNav);
  }

  // ────────────────────────
  // حقن لوحات المحتوى
  // ────────────────────────
  function injectPanels() {
    var mainContent = document.querySelector('.main-content, #mainContent, main, .content-area');
    if (!mainContent) {
      // محاولة ثانية
      var tabs = document.querySelectorAll('.tab-content');
      if (tabs.length) mainContent = tabs[0].parentNode;
    }
    if (!mainContent) return;

    // لوحة الرحلات
    var tripsPanel = document.createElement('div');
    tripsPanel.id = 'tab-trips';
    tripsPanel.className = 'tab-content';
    tripsPanel.innerHTML = buildTripsPanel();
    mainContent.appendChild(tripsPanel);

    // لوحة التصوير
    var mediaPanel = document.createElement('div');
    mediaPanel.id = 'tab-media';
    mediaPanel.className = 'tab-content';
    mediaPanel.innerHTML = buildMediaPanel();
    mainContent.appendChild(mediaPanel);

    // ربط الأحداث
    bindEvents();
  }

  // ────────────────────────
  // HTML لوحة الرحلات
  // ────────────────────────
  function buildTripsPanel() {
    return '<div style="max-width:800px">'
      + '<div class="pt-card">'
      + '<div class="pt-title">🚌 الرحلات القادمة — طلب الموافقة</div>'
      + '<div id="ptUpcoming"><div class="pt-empty">جاري التحميل...</div></div>'
      + '</div>'
      + '<div class="pt-card">'
      + '<div class="pt-title">📅 الرحلات السابقة</div>'
      + '<div id="ptPast"><div class="pt-empty">جاري التحميل...</div></div>'
      + '</div>'
      + '</div>';
  }

  // ────────────────────────
  // HTML لوحة التصوير
  // ────────────────────────
  function buildMediaPanel() {
    return '<div style="max-width:640px">'
      + '<div class="pt-card">'
      + '<div class="pt-title">📸 الإذن الإعلامي للطالب/ة</div>'
      + '<div style="font-size:.88rem;color:#64748B;margin-bottom:20px;line-height:1.7">'
      + 'تتيح لنا موافقتكم نشر صور أو مقاطع مدرسية موافَق عليها في القنوات الإعلامية الرسمية للمدرسة فقط، مع الالتزام بالخصوصية التامة.'
      + '</div>'
      + '<div id="ptMediaStatus"><div class="pt-empty">جاري التحميل...</div></div>'
      + '<div id="ptMediaForm" style="display:none;margin-top:16px">'
      + '<div style="font-weight:700;font-size:.9rem;color:#374151;margin-bottom:12px">المنصات المسموح بها:</div>'
      + '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">'
      + buildPlatformToggle('instagram', '📸 انستغرام المدرسة')
      + buildPlatformToggle('telegram', '💬 تيليغرام المدرسة')
      + buildPlatformToggle('website', '🌐 الموقع الإلكتروني')
      + '</div>'
      + '<div style="display:flex;gap:10px">'
      + '<button class="pt-btn pt-btn-green" onclick="ptSaveMedia(true)" style="flex:1">✓ أوافق على التصوير</button>'
      + '<button class="pt-btn pt-btn-red" onclick="ptSaveMedia(false)" style="flex:1">✗ أرفض التصوير</button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function buildPlatformToggle(val, label) {
    return '<div class="pt-perm-row">'
      + '<span style="font-weight:600">' + label + '</span>'
      + '<label class="pt-toggle"><input type="checkbox" id="mp_' + val + '" value="' + val + '">'
      + '<span class="pt-slider"></span></label>'
      + '</div>';
  }

  // ────────────────────────
  // ربط الأحداث
  // ────────────────────────
  function bindEvents() {
    // عند النقر على تبويب الرحلات
    var tripsNav = document.querySelector('[data-tab="trips"]');
    if (tripsNav) tripsNav.addEventListener('click', function () { loadTrips(); });
    // عند النقر على تبويب التصوير
    var mediaNav = document.querySelector('[data-tab="media"]');
    if (mediaNav) mediaNav.addEventListener('click', function () { loadMedia(); });
  }

  // ────────────────────────
  // Supabase
  // ────────────────────────
  function getSB() {
    var cfg = (typeof window.getSupabaseConfig === 'function') ? window.getSupabaseConfig()
      : { url: (window.EduOS && window.EduOS.SB_URL) || '', key: (window.EduOS && window.EduOS.SB_KEY) || '' };
    return cfg;
  }

  function getH() {
    var cfg = getSB();
    return { 'Content-Type': 'application/json', 'apikey': cfg.key, 'Authorization': 'Bearer ' + cfg.key };
  }

  function getParentSession() {
    try { return JSON.parse(sessionStorage.getItem('edoos_user') || '{}'); } catch (_) { return {}; }
  }

  // ────────────────────────
  // تحميل رحلات الطالب
  // ────────────────────────
  var ptLoaded = false;

  async function loadTrips() {
    if (ptLoaded) return;
    ptLoaded = true;

    var session = getParentSession();
    var natId = session.national_id || session.id || '';
    var cfg = getSB();

    // اجلب بيانات الطالب من parent_credentials
    var today = new Date().toISOString().slice(0, 10);
    var upcomingEl = document.getElementById('ptUpcoming');
    var pastEl = document.getElementById('ptPast');

    // اجلب المشاركات المرتبطة بهوية ولي الأمر
    try {
      var r = await fetch(cfg.url + '/rest/v1/field_trip_participants?national_id=eq.' + encodeURIComponent(natId) + '&select=*,field_trips(*)', { headers: getH() });
      var parts = r.ok ? await r.json() : [];

      var upcoming = parts.filter(function (p) { return p.field_trips && p.field_trips.trip_date >= today && p.field_trips.status !== 'rejected'; });
      var past = parts.filter(function (p) { return p.field_trips && p.field_trips.trip_date < today; });

      renderUpcoming(upcoming, upcomingEl, natId);
      renderPast(past, pastEl);
    } catch (_) {
      upcomingEl.innerHTML = '<div class="pt-empty">حدث خطأ في التحميل</div>';
      pastEl.innerHTML = '';
    }
  }

  function renderUpcoming(parts, el, natId) {
    if (!parts.length) { el.innerHTML = '<div class="pt-empty">لا توجد رحلات قادمة تحتاج موافقتك</div>'; return; }
    el.innerHTML = parts.map(function (p) {
      var t = p.field_trips || {};
      var d = t.trip_date ? new Date(t.trip_date).toLocaleDateString('ar-AE', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) : '—';
      var statusHtml = p.parent_approval === 'approved'
        ? '<span class="pt-badge pt-approved">✓ وافقت</span>'
        : (p.parent_approval === 'rejected' ? '<span class="pt-badge pt-rejected">✗ رفضت</span>'
          : '<span class="pt-badge pt-pending">⏳ بانتظار موافقتك</span>');
      var btns = p.parent_approval === 'approved' || p.parent_approval === 'rejected' ? ''
        : '<div style="display:flex;gap:8px;margin-top:12px">'
        + '<button class="pt-btn pt-btn-green" onclick="ptApproveTrip(\'' + p.id + '\',true)">✓ أوافق على مشاركة ابن/ابنتي</button>'
        + '<button class="pt-btn pt-btn-red" onclick="ptApproveTrip(\'' + p.id + '\',false)">✗ أرفض</button>'
        + '</div>';
      return '<div class="pt-card">'
        + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px">'
        + '<div style="font-size:1rem;font-weight:800;color:#0F172A">' + esc(t.title || '—') + '</div>'
        + statusHtml + '</div>'
        + '<div class="pt-meta">'
        + '<span>📍 ' + esc(t.destination || '—') + '</span>'
        + '<span>📅 ' + d + '</span>'
        + '<span>⏰ ' + (t.departure_time || '—') + ' → ' + (t.return_time || '—') + '</span>'
        + '<span>🏫 ' + esc(p.class_name || '—') + '</span>'
        + '</div>'
        + (t.notes ? '<div style="font-size:.85rem;color:#64748B;background:#F8FAFC;border-radius:8px;padding:8px 12px">' + esc(t.notes) + '</div>' : '')
        + btns + '</div>';
    }).join('');
  }

  function renderPast(parts, el) {
    if (!parts.length) { el.innerHTML = '<div class="pt-empty">لا توجد رحلات سابقة</div>'; return; }
    el.innerHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.88rem">'
      + '<thead><tr style="background:#F8FAFC">'
      + '<th style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #E2E8F0">العنوان</th>'
      + '<th style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #E2E8F0">الوجهة</th>'
      + '<th style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #E2E8F0">التاريخ</th>'
      + '<th style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:2px solid #E2E8F0">المشاركة</th>'
      + '</tr></thead><tbody>'
      + parts.map(function (p) {
        var t = p.field_trips || {};
        var d = t.trip_date ? new Date(t.trip_date).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        var att = p.attendance_status === 'present' ? '<span style="color:#16A34A;font-weight:700">✓ حضر</span>'
          : (p.attendance_status === 'absent' ? '<span style="color:#DC2626;font-weight:700">✗ غاب</span>' : '<span style="color:#94A3B8">—</span>');
        return '<tr style="border-bottom:1px solid #F1F5F9">'
          + '<td style="padding:10px 14px;font-weight:700">' + esc(t.title || '—') + '</td>'
          + '<td style="padding:10px 14px">' + esc(t.destination || '—') + '</td>'
          + '<td style="padding:10px 14px">' + d + '</td>'
          + '<td style="padding:10px 14px">' + att + '</td>'
          + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  // ── موافقة على الرحلة ──
  window.ptApproveTrip = async function (partId, approved) {
    var cfg = getSB();
    var val = approved ? 'approved' : 'rejected';
    var r = await fetch(cfg.url + '/rest/v1/field_trip_participants?id=eq.' + partId, {
      method: 'PATCH',
      headers: Object.assign({}, getH(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify({ parent_approval: val, parent_approval_at: new Date().toISOString() })
    });
    if (r.ok) {
      ptLoaded = false;
      await loadTrips();
      showPtToast(approved ? '✓ تم تسجيل موافقتك' : '✓ تم تسجيل رفضك', approved ? 'green' : 'red');
    } else {
      showPtToast('حدث خطأ، حاول مجدداً', 'red');
    }
  };

  // ────────────────────────
  // تحميل إذن التصوير
  // ────────────────────────
  var ptMediaLoaded = false;
  var ptMediaRecord = null;

  async function loadMedia() {
    if (ptMediaLoaded) return;
    ptMediaLoaded = true;

    var session = getParentSession();
    var natId = session.national_id || session.id || '';
    var cfg = getSB();
    var statusEl = document.getElementById('ptMediaStatus');
    var formEl = document.getElementById('ptMediaForm');

    try {
      var r = await fetch(cfg.url + '/rest/v1/media_permission?national_id=eq.' + encodeURIComponent(natId) + '&limit=1', { headers: getH() });
      var data = r.ok ? await r.json() : [];
      ptMediaRecord = data[0] || null;
    } catch (_) { ptMediaRecord = null; }

    if (ptMediaRecord) {
      var allowed = ptMediaRecord.parent_allowed;
      var platforms = ptMediaRecord.allowed_platforms || [];
      statusEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:12px;background:' + (allowed ? '#F0FDF4' : '#FFF1F2') + ';margin-bottom:14px">'
        + '<span style="font-size:1.5rem">' + (allowed ? '✅' : '❌') + '</span>'
        + '<div><div style="font-weight:800;color:' + (allowed ? '#15803D' : '#BE123C') + '">' + (allowed ? 'الإذن ممنوح' : 'الإذن مرفوض') + '</div>'
        + '<div style="font-size:.82rem;color:#64748B">' + (allowed && platforms.length ? 'المنصات: ' + platforms.join('، ') : (allowed ? 'جميع المنصات' : 'لا يسمح بالنشر')) + '</div></div>'
        + '<button class="pt-btn pt-btn-gray" onclick="ptEditMedia()" style="margin-right:auto">✎ تعديل</button></div>';
      // ضبط التوغلات
      platforms.forEach(function (p) { var el = document.getElementById('mp_' + p); if (el) el.checked = true; });
    } else {
      statusEl.innerHTML = '<div style="color:#94A3B8;font-size:.9rem;margin-bottom:14px">لم يُحدَّد إذن بعد — يرجى تحديد موقفك</div>';
      formEl.style.display = 'block';
    }
  }

  window.ptEditMedia = function () {
    document.getElementById('ptMediaForm').style.display = 'block';
  };

  window.ptSaveMedia = async function (allowed) {
    var cfg = getSB();
    var session = getParentSession();
    var natId = session.national_id || session.id || '';
    var platforms = [];
    ['instagram', 'telegram', 'website'].forEach(function (p) {
      var el = document.getElementById('mp_' + p);
      if (el && el.checked) platforms.push(p);
    });

    var payload = {
      national_id: natId,
      parent_allowed: allowed,
      allowed_platforms: allowed ? platforms : [],
      updated_at: new Date().toISOString(),
      updated_by: natId,
      school_id: (window.EduOS && window.EduOS.school && window.EduOS.school.id) || 'aljood',
      academic_year: '2026-2027'
    };

    var method = 'POST', url = cfg.url + '/rest/v1/media_permission';
    if (ptMediaRecord) { method = 'PATCH'; url += '?id=eq.' + ptMediaRecord.id; }
    else payload.id = undefined;

    var r = await fetch(url, {
      method: method,
      headers: Object.assign({}, getH(), { 'Prefer': 'return=representation' }),
      body: JSON.stringify(ptMediaRecord ? payload : [payload])
    });

    if (r.ok) {
      ptMediaLoaded = false;
      ptMediaRecord = null;
      document.getElementById('ptMediaForm').style.display = 'none';
      await loadMedia();
      showPtToast(allowed ? '✅ تم حفظ الموافقة على التصوير' : '✅ تم حفظ الرفض', allowed ? 'green' : 'red');
    } else {
      showPtToast('حدث خطأ في الحفظ', 'red');
    }
  };

  // ────────────────────────
  // إشعار
  // ────────────────────────
  function showPtToast(msg, color) {
    var el = document.getElementById('ptToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ptToast';
      el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:12px;font-size:.9rem;font-weight:700;z-index:99999;opacity:0;transition:.3s;font-family:inherit;white-space:nowrap';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = color === 'green' ? '#16A34A' : '#DC2626';
    el.style.color = '#fff';
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; }, 3500);
  }

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

})();
