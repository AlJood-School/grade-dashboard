/**
 * staff-card.js — بطاقة المعلمة الذكية
 * بوابة الجود — نظام EduOS
 * المؤلف: منيرة علي محمد سعيد المري
 *
 * الاستخدام: أضف data-staff-id="AJ001" على أي عنصر يحمل اسم المعلمة
 * مثال: <span data-staff-id="AJ001">حليمة المعمري</span>
 */

(function () {
  const SUPABASE_URL = 'https://zuyizaiugpmhmeycqton.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0.FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI';

  const cardCache = {};

  // ─── إنشاء عنصر البطاقة ───
  const card = document.createElement('div');
  card.id = 'staffHoverCard';
  card.innerHTML = '<div class="sfc-inner"><div class="sfc-loading">⏳ جاري التحميل...</div></div>';
  document.body.appendChild(card);

  // ─── CSS ───
  const style = document.createElement('style');
  style.textContent = `
    #staffHoverCard {
      position: fixed;
      z-index: 99998;
      display: none;
      pointer-events: none;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.18));
      transition: opacity 0.15s ease;
    }
    #staffHoverCard.sfc-visible {
      display: block;
      pointer-events: auto;
    }
    .sfc-inner {
      background: #fff;
      border-radius: 16px;
      width: 310px;
      overflow: hidden;
      border: 1px solid #e8eaf0;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
    }
    .sfc-header {
      padding: 14px 16px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
    }
    .sfc-header.role-teacher    { background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%); }
    .sfc-header.role-admin      { background: linear-gradient(135deg, #b71c1c 0%, #e53935 100%); }
    .sfc-header.role-specialist { background: linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%); }
    .sfc-header.role-default    { background: linear-gradient(135deg, #1565c0 0%, #1e88e5 100%); }
    .sfc-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.5);
    }
    .sfc-name  { font-size: 15px; font-weight: 700; line-height: 1.3; }
    .sfc-title { font-size: 12px; opacity: 0.9; margin-top: 2px; }
    .sfc-status-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-left: 5px;
      vertical-align: middle;
    }
    .sfc-status-dot.online  { background: #00e676; box-shadow: 0 0 5px #00e676; }
    .sfc-status-dot.offline { background: #bdbdbd; }
    .sfc-status-dot.absent  { background: #ff1744; box-shadow: 0 0 5px #ff1744; }
    .sfc-body { padding: 12px 14px; }
    .sfc-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 5px 0;
      border-bottom: 1px solid #f0f2f7;
      font-size: 13px;
      color: #333;
    }
    .sfc-row:last-child { border-bottom: none; }
    .sfc-icon  { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; margin-top: 1px; }
    .sfc-label { color: #888; font-size: 11px; min-width: 72px; flex-shrink: 0; padding-top: 1px; }
    .sfc-val   { font-weight: 600; color: #222; flex: 1; line-height: 1.4; }
    .sfc-rating {
      display: inline-flex;
      gap: 2px;
    }
    .sfc-star { color: #fdd835; font-size: 13px; }
    .sfc-star.empty { color: #ddd; }
    .sfc-exp-badge {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      background: #e3f2fd;
      color: #1565c0;
    }
    .sfc-perf {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .sfc-perf-ex   { background: #e8f5e9; color: #2e7d32; }
    .sfc-perf-good { background: #e3f2fd; color: #1565c0; }
    .sfc-perf-avg  { background: #fff3e0; color: #e65100; }
    .sfc-footer {
      background: #f7f9fc;
      padding: 8px 14px;
      font-size: 11px;
      color: #aaa;
      text-align: center;
      border-top: 1px solid #eee;
    }
    .sfc-loading { padding: 20px; text-align: center; color: #888; font-size: 13px; }
    .sfc-error   { padding: 16px; text-align: center; color: #c62828; font-size: 13px; }
    .sfc-divider { height: 1px; background: #f0f2f7; margin: 4px 0; }
  `;
  document.head.appendChild(style);

  // ─── جلب البيانات ───
  async function fetchStaffData(staffId) {
    if (cardCache[staffId]) return cardCache[staffId];

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    };

    const [profRes, attendRes] = await Promise.allSettled([
      fetch(`${SUPABASE_URL}/rest/v1/staff_profiles?staff_id=eq.${encodeURIComponent(staffId)}&select=*&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/staff_attendance?staff_id=eq.${encodeURIComponent(staffId)}&select=status,date&order=date.desc&limit=1`, { headers })
    ]);

    let profile = null, todayAttend = null;

    if (profRes.status === 'fulfilled' && profRes.value.ok) {
      const arr = await profRes.value.json();
      profile = arr[0] || null;
    }

    if (attendRes.status === 'fulfilled' && attendRes.value.ok) {
      const arr = await attendRes.value.json();
      todayAttend = arr[0] || null;
    }

    const data = { profile, todayAttend };
    cardCache[staffId] = data;
    return data;
  }

  // ─── نوع الدور ───
  function roleClass(role) {
    if (!role) return 'role-default';
    const r = role.toLowerCase();
    if (r.includes('معلم') || r.includes('teacher')) return 'role-teacher';
    if (r.includes('مدير') || r.includes('principal') || r.includes('admin')) return 'role-admin';
    if (r.includes('أخصائي') || r.includes('specialist') || r.includes('counselor')) return 'role-specialist';
    return 'role-default';
  }

  // ─── أيقونة الدور ───
  function roleIcon(role) {
    if (!role) return '👤';
    const r = role.toLowerCase();
    if (r.includes('معلم') || r.includes('teacher')) return '👩‍🏫';
    if (r.includes('مدير') || r.includes('principal')) return '👩‍💼';
    if (r.includes('أخصائي') || r.includes('specialist')) return '🩺';
    if (r.includes('إداري') || r.includes('admin')) return '🗂️';
    return '👤';
  }

  // ─── حالة الحضور ───
  function statusHTML(profile, todayAttend) {
    // الأولوية: online_status الحي (من Supabase Realtime لو متوفر)
    const online = profile && profile.is_online;
    if (online) return `<span class="sfc-status-dot online"></span> <span style="color:#2e7d32;font-weight:600">متاحة الآن 🟢</span>`;

    if (todayAttend) {
      if (todayAttend.status === 'absent') return `<span class="sfc-status-dot absent"></span> <span style="color:#c62828;font-weight:600">غائبة اليوم 🔴</span>`;
      if (todayAttend.status === 'present') return `<span class="sfc-status-dot offline"></span> <span style="color:#555">حاضرة / أوفلاين ⚫</span>`;
    }
    return `<span class="sfc-status-dot offline"></span> <span style="color:#999">أوفلاين ⚫</span>`;
  }

  // ─── نجوم التقييم ───
  function starsHTML(rating) {
    if (!rating) return '<span style="color:#aaa">—</span>';
    const full = Math.round(rating);
    let html = '<span class="sfc-rating">';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="sfc-star${i <= full ? '' : ' empty'}">★</span>`;
    }
    return html + '</span>';
  }

  // ─── تقييم أدائي ───
  function perfBadge(perf) {
    if (!perf) return '<span style="color:#aaa">—</span>';
    if (perf === 'ممتاز')    return `<span class="sfc-perf sfc-perf-ex">ممتاز ⭐</span>`;
    if (perf === 'جيد جداً') return `<span class="sfc-perf sfc-perf-good">جيد جداً ✅</span>`;
    if (perf === 'جيد')      return `<span class="sfc-perf sfc-perf-avg">جيد</span>`;
    return `<span class="sfc-perf sfc-perf-avg">${perf}</span>`;
  }

  // ─── رسم البطاقة ───
  function renderCard(data, nameFromEl) {
    const { profile, todayAttend } = data;

    if (!profile) {
      return `<div class="sfc-inner">
        <div class="sfc-error">❌ لا توجد بيانات لهذه المعلمة</div>
      </div>`;
    }

    const rc = roleClass(profile.role_title_ar);
    const icon = roleIcon(profile.role_title_ar);

    return `
    <div class="sfc-inner">
      <div class="sfc-header ${rc}">
        <div class="sfc-avatar">${icon}</div>
        <div>
          <div class="sfc-name">${profile.name_ar || nameFromEl}</div>
          <div class="sfc-title">${profile.role_title_ar || '—'}</div>
        </div>
      </div>
      <div class="sfc-body">
        <div class="sfc-row">
          <span class="sfc-icon">🟢</span>
          <span class="sfc-label">الحالة</span>
          <span class="sfc-val">${statusHTML(profile, todayAttend)}</span>
        </div>
        ${profile.employee_number ? `
        <div class="sfc-row">
          <span class="sfc-icon">🪪</span>
          <span class="sfc-label">الرقم الوظيفي</span>
          <span class="sfc-val">${profile.employee_number}</span>
        </div>` : ''}
        ${profile.email ? `
        <div class="sfc-row">
          <span class="sfc-icon">📧</span>
          <span class="sfc-label">الإيميل</span>
          <span class="sfc-val" style="font-size:11px;word-break:break-all">${profile.email}</span>
        </div>` : ''}
        ${profile.subject_ar ? `
        <div class="sfc-row">
          <span class="sfc-icon">📚</span>
          <span class="sfc-label">المادة</span>
          <span class="sfc-val">${profile.subject_ar}</span>
        </div>` : ''}
        ${profile.grades_taught ? `
        <div class="sfc-row">
          <span class="sfc-icon">🏫</span>
          <span class="sfc-label">الصفوف</span>
          <span class="sfc-val">${profile.grades_taught}</span>
        </div>` : ''}
        ${profile.years_experience !== undefined && profile.years_experience !== null ? `
        <div class="sfc-row">
          <span class="sfc-icon">📆</span>
          <span class="sfc-label">الخبرة</span>
          <span class="sfc-val"><span class="sfc-exp-badge">${profile.years_experience} سنة</span></span>
        </div>` : ''}
        ${profile.last_performance_review ? `
        <div class="sfc-row">
          <span class="sfc-icon">📊</span>
          <span class="sfc-label">التقييم ${profile.review_year ? profile.review_year : ''}</span>
          <span class="sfc-val">${perfBadge(profile.last_performance_review)}</span>
        </div>` : ''}
      </div>
      <div class="sfc-footer">🏫 بوابة الجود — بيانات حية</div>
    </div>`;
  }

  // ─── منطق hover ───
  let hideTimeout = null;
  let currentTarget = null;

  async function showCard(el, staffId) {
    clearTimeout(hideTimeout);
    currentTarget = el;

    const rect = el.getBoundingClientRect();
    let top  = rect.bottom + window.scrollY + 6;
    let left = rect.left + window.scrollX;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 325;
    if (left < 5) left = 5;

    card.style.top  = top + 'px';
    card.style.left = left + 'px';
    card.classList.add('sfc-visible');
    card.innerHTML = '<div class="sfc-inner"><div class="sfc-loading">⏳ جاري التحميل...</div></div>';

    try {
      const data = await fetchStaffData(staffId);
      if (currentTarget === el) {
        card.innerHTML = renderCard(data, el.textContent.trim());
      }
    } catch (e) {
      if (currentTarget === el) {
        card.innerHTML = '<div class="sfc-inner"><div class="sfc-error">❌ خطأ في تحميل البيانات</div></div>';
      }
    }
  }

  function hideCard() {
    hideTimeout = setTimeout(() => {
      card.classList.remove('sfc-visible');
      currentTarget = null;
    }, 200);
  }

  card.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
  card.addEventListener('mouseleave', hideCard);

  // ─── تفعيل على كل العناصر ───
  function attachListeners() {
    document.querySelectorAll('[data-staff-id]:not([data-sfc-attached])').forEach(el => {
      el.setAttribute('data-sfc-attached', '1');
      el.style.cursor = 'pointer';
      el.style.borderBottom = '1px dashed #43a047';

      el.addEventListener('mouseenter', () => showCard(el, el.getAttribute('data-staff-id')));
      el.addEventListener('mouseleave', hideCard);

      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showCard(el, el.getAttribute('data-staff-id'));
      }, { passive: false });
    });
  }

  attachListeners();
  const observer = new MutationObserver(attachListeners);
  observer.observe(document.body, { childList: true, subtree: true });

})();
