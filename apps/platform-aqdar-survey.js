/**
 * platform-aqdar-survey.js — v1.0
 * يظهر زراً عائماً لكل موظف لم يُكمل استطلاع الجاهزية الرقمية 2026-2027
 * لا localStorage — كل شيء من Supabase
 */
(function() {
  'use strict';

  var AQ_YEAR = '2026-2027';
  var SURVEY_QUESTIONS = [
    {
      id: 'attendance_method',
      label: 'كيف تسجّل الحضور حالياً؟',
      type: 'select',
      options: ['ورقياً', 'بجدول Excel', 'بتطبيق رقمي', 'EduOS']
    },
    {
      id: 'progress_tracking',
      label: 'كيف تتابع تقدم الطلاب؟',
      type: 'select',
      options: ['ورقياً', 'بجدول Excel', 'بتطبيق رقمي', 'EduOS']
    },
    {
      id: 'documentation_hours',
      label: 'كم ساعة أسبوعياً تقضي في التوثيق الورقي؟',
      type: 'select',
      options: ['أقل من ساعة', '1-3 ساعات', '3-6 ساعات', 'أكثر من 6 ساعات']
    },
    {
      id: 'daily_challenges',
      label: 'أكبر تحدي يومي تواجهه؟',
      type: 'select',
      options: ['الوثائق والتقارير', 'التواصل مع الأولياء', 'تتبع الطلاب', 'الجداول والمواعيد']
    },
    {
      id: 'tech_comfort',
      label: 'مستوى راحتك مع التقنية (1 = منخفض، 5 = عالٍ جداً)',
      type: 'range',
      min: 1,
      max: 5
    },
    {
      id: 'available_devices',
      label: 'الأجهزة المتاحة لك في المدرسة؟',
      type: 'select',
      options: ['لابتوب فقط', 'تابلت فقط', 'لابتوب وتابلت', 'لابتوب وهاتف', 'جميعها']
    },
    {
      id: 'wants_notifications',
      label: 'هل تريد إشعارات فورية عن غياب الطلاب؟',
      type: 'select',
      options: ['نعم بالتأكيد', 'ربما', 'لا حاجة لذلك']
    },
    {
      id: 'wants_auto_reports',
      label: 'هل تريد تقارير تلقائية أسبوعية؟',
      type: 'select',
      options: ['نعم', 'أحياناً', 'لا']
    },
    {
      id: 'ready_for_digital',
      label: 'هل أنت مستعد/ة للتحول الكامل للعمل الرقمي؟',
      type: 'select',
      options: ['نعم — مستعد/ة تماماً', 'نعم — مع تدريب', 'تدريجياً', 'أفضّل الورق حالياً']
    },
    {
      id: 'open_feedback',
      label: 'ما الميزة التي تتمنى وجودها في EduOS؟',
      type: 'text',
      placeholder: 'اكتب اقتراحك هنا...'
    }
  ];

  function getSB() {
    return {
      url: window.EduOS ? window.EduOS.SB_URL : '',
      key: window.EduOS ? window.EduOS.SB_KEY : ''
    };
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem('edoos_user') || '{}'); } catch(e) { return {}; }
  }

  async function checkCompleted(nameAr, staffDbId) {
    var sb = getSB();
    if (!sb.url || !sb.key) return true;
    var url = sb.url + '/rest/v1/survey_digital_readiness?academic_year=eq.' + AQ_YEAR +
      '&limit=1&select=id';
    if (staffDbId) url += '&staff_db_id=eq.' + encodeURIComponent(staffDbId);
    else if (nameAr) url += '&respondent_name=ilike.' + encodeURIComponent(nameAr.split(' ')[0] + '%');
    try {
      var r = await fetch(url, { headers: { 'apikey': sb.key, 'Authorization': 'Bearer ' + sb.key } });
      var data = r.ok ? await r.json() : [];
      return data.length > 0;
    } catch(e) { return true; }
  }

  async function submitSurvey(sess) {
    var sb = getSB();
    var payload = { academic_year: AQ_YEAR };
    if (sess.staff_db_id) payload.staff_db_id = sess.staff_db_id;
    payload.respondent_name = sess.name_ar || sess.name || '';
    payload.role = sess.role_key || sess.role || '';
    payload.submitted_at = new Date().toISOString();

    SURVEY_QUESTIONS.forEach(function(q) {
      if (q.type === 'range') {
        var el = document.getElementById('aqq_' + q.id);
        payload[q.id] = el ? parseInt(el.value) : 3;
      } else {
        var el = document.getElementById('aqq_' + q.id);
        payload[q.id] = el ? el.value.trim() : '';
      }
    });

    try {
      var res = await fetch(sb.url + '/rest/v1/survey_digital_readiness', {
        method: 'POST',
        headers: {
          'apikey': sb.key, 'Authorization': 'Bearer ' + sb.key,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
      return res.ok || res.status === 201;
    } catch(e) { return false; }
  }

  function buildModal(sess) {
    var overlay = document.createElement('div');
    overlay.id = 'aqSurveyOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998;display:flex;align-items:center;justify-content:center;direction:rtl;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:20px;padding:28px 32px;max-width:560px;width:92%;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.18);font-family:Tajawal,Arial,sans-serif;';

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<div style="font-size:1.25rem;font-weight:900;color:#1E293B">🛡️ استطلاع الجاهزية الرقمية</div>' +
      '<button id="aqSurveyClose" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748B">&#x2715;</button>' +
    '</div>' +
    '<p style="font-size:13px;color:#64748B;margin-bottom:20px">العام الدراسي ' + AQ_YEAR + ' · مدرسة الجود الذكية · EduOS</p>';

    SURVEY_QUESTIONS.forEach(function(q, i) {
      html += '<div style="margin-bottom:16px">';
      html += '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:6px">' + (i + 1) + '. ' + q.label + '</label>';
      if (q.type === 'select') {
        html += '<select id="aqq_' + q.id + '" style="width:100%;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-family:Tajawal,Arial,sans-serif;font-size:14px;background:#fff">';
        html += '<option value="">— اختر —</option>';
        q.options.forEach(function(o) { html += '<option value="' + o + '">' + o + '</option>'; });
        html += '</select>';
      } else if (q.type === 'range') {
        html += '<div style="display:flex;align-items:center;gap:12px">';
        html += '<span style="font-size:12px;color:#94A3B8">1</span>';
        html += '<input type="range" id="aqq_' + q.id + '" min="' + q.min + '" max="' + q.max + '" value="3" ' +
          'style="flex:1;accent-color:#6C3DD6" oninput="document.getElementById(\'aqq_' + q.id + '_val\').textContent=this.value">';
        html += '<span style="font-size:12px;color:#94A3B8">' + q.max + '</span>';
        html += '<span id="aqq_' + q.id + '_val" style="font-size:16px;font-weight:900;color:#6C3DD6;min-width:24px;text-align:center">3</span>';
        html += '</div>';
      } else if (q.type === 'text') {
        html += '<textarea id="aqq_' + q.id + '" placeholder="' + (q.placeholder || '') + '" rows="3" ' +
          'style="width:100%;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-family:Tajawal,Arial,sans-serif;font-size:14px;resize:vertical"></textarea>';
      }
      html += '</div>';
    });

    html += '<div id="aqSurveyAlert" style="display:none;background:#FEE2E2;border-radius:8px;padding:10px 14px;font-size:13px;color:#991B1B;font-weight:600;margin-bottom:12px"></div>';
    html += '<button id="aqSurveySubmit" style="width:100%;background:linear-gradient(135deg,#6C3DD6,#22D3EE);color:#fff;border:none;border-radius:12px;padding:14px;font-family:Tajawal,Arial,sans-serif;font-size:15px;font-weight:700;cursor:pointer;margin-top:8px">📤 إرسال الاستطلاع</button>';
    html += '<p style="text-align:center;font-size:12px;color:#94A3B8;margin-top:10px">بياناتك سرية وتُستخدم لتطوير المنصة فقط</p>';

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('aqSurveyClose').addEventListener('click', function() {
      overlay.remove();
    });

    document.getElementById('aqSurveySubmit').addEventListener('click', async function() {
      var btn = this;
      var alertEl = document.getElementById('aqSurveyAlert');

      // Validate selects
      var missing = SURVEY_QUESTIONS.filter(function(q) {
        if (q.type !== 'select') return false;
        var el = document.getElementById('aqq_' + q.id);
        return !el || !el.value;
      });
      if (missing.length) {
        alertEl.textContent = 'يرجى الإجابة على جميع الأسئلة (متبقٍ ' + missing.length + ' سؤال)';
        alertEl.style.display = 'block';
        return;
      }
      alertEl.style.display = 'none';

      btn.disabled = true;
      btn.textContent = '⏳ جاري الإرسال...';
      var ok = await submitSurvey(sess);
      if (ok) {
        modal.innerHTML = '<div style="text-align:center;padding:40px 20px">' +
          '<div style="font-size:56px;margin-bottom:16px">✅</div>' +
          '<div style="font-size:1.2rem;font-weight:800;color:#065F46;margin-bottom:8px">شكراً لمشاركتك!</div>' +
          '<div style="font-size:14px;color:#64748B">تم حفظ إجاباتك بنجاح. مشاركتك تساعد في تطوير EduOS.</div>' +
        '</div>';
        setTimeout(function() { overlay.remove(); }, 3000);
      } else {
        btn.disabled = false;
        btn.textContent = '📤 إرسال الاستطلاع';
        alertEl.textContent = 'حدث خطأ في الإرسال. حاول مرة أخرى.';
        alertEl.style.display = 'block';
      }
    });
  }

  function buildFloatingBtn() {
    var btn = document.createElement('button');
    btn.id = 'aqFloatingBtn';
    btn.innerHTML = '🛡️ أقدر';
    btn.title = 'استطلاع الجاهزية الرقمية — ارجو الإكمال';
    btn.style.cssText = 'position:fixed;bottom:90px;left:20px;z-index:9997;' +
      'background:linear-gradient(135deg,#6C3DD6,#22D3EE);color:#fff;border:none;border-radius:50px;' +
      'padding:10px 18px;font-family:Tajawal,Arial,sans-serif;font-size:14px;font-weight:700;' +
      'cursor:pointer;box-shadow:0 4px 16px rgba(108,61,214,0.35);animation:aqPulse 2s infinite;';
    document.head.insertAdjacentHTML('beforeend',
      '<style>@keyframes aqPulse{0%,100%{box-shadow:0 4px 16px rgba(108,61,214,0.35)}50%{box-shadow:0 4px 24px rgba(108,61,214,0.7)}}</style>'
    );
    document.body.appendChild(btn);

    var sess = getSession();
    btn.addEventListener('click', function() { buildModal(sess); });
  }

  async function init() {
    // انتظار تحميل الصفحة ثم Supabase config
    if (!window.EduOS || !window.EduOS.SB_URL) return;

    var sess = getSession();
    if (!sess || !sess.role_key) return;

    // ولي الأمر والطالب لا يُظهر لهم الاستطلاع
    if (sess.role_key === 'parent' || sess.role_key === 'student') return;

    var nameAr = sess.name_ar || sess.name || '';
    var staffDbId = sess.staff_db_id || sess.id || '';

    var completed = await checkCompleted(nameAr, staffDbId);
    if (!completed) buildFloatingBtn();
  }

  // تأجير التشغيل حتى تحميل كل شيء
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 1500); });
  } else {
    setTimeout(init, 1500);
  }
})();
