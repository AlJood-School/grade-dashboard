/**
 * student-card.js — بطاقة الطالب الذكية
 * بوابة الجود — نظام EduOS
 * المؤلف: منيرة علي محمد سعيد المري
 * 
 * الاستخدام: أضف هذا الملف لأي صفحة
 * وأضف data-student-id="XXX" على أي عنصر يحمل اسم الطالب
 * مثال: <span data-student-id="ST001" class="student-name">نورة</span>
 */

(function () {
  const SUPABASE_URL = 'https://zuyizaiugpmhmeycqton.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0.FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI';

  // ─── الـ Cache لتجنب طلبات متكررة ───
  const cardCache = {};

  // ─── إنشاء عنصر البطاقة ───
  const card = document.createElement('div');
  card.id = 'studentHoverCard';
  card.innerHTML = '<div class="shc-inner"><div class="shc-loading">⏳ جاري التحميل...</div></div>';
  document.body.appendChild(card);

  // ─── CSS ───
  const style = document.createElement('style');
  style.textContent = `
    #studentHoverCard {
      position: fixed;
      z-index: 99999;
      display: none;
      pointer-events: none;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.18));
      transition: opacity 0.15s ease;
    }
    #studentHoverCard.shc-visible {
      display: block;
      pointer-events: auto;
    }
    .shc-inner {
      background: #fff;
      border-radius: 16px;
      width: 300px;
      overflow: hidden;
      border: 1px solid #e8eaf0;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
    }
    .shc-header {
      background: linear-gradient(135deg, #1e4799 0%, #2e7bcf 100%);
      color: white;
      padding: 14px 16px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .shc-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.5);
    }
    .shc-name {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.3;
    }
    .shc-grade {
      font-size: 12px;
      opacity: 0.85;
      margin-top: 2px;
    }
    .shc-hmma {
      background: #ff6b35;
      color: white;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 10px;
      margin-top: 3px;
      display: inline-block;
    }
    .shc-body {
      padding: 12px 14px;
    }
    .shc-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 0;
      border-bottom: 1px solid #f0f2f7;
      font-size: 13px;
      color: #333;
    }
    .shc-row:last-child { border-bottom: none; }
    .shc-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }
    .shc-label { color: #888; font-size: 11px; min-width: 60px; }
    .shc-val { font-weight: 600; color: #222; flex: 1; }
    .shc-vark {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .shc-vark.V { background: #e3f2fd; color: #1565c0; }
    .shc-vark.A { background: #f3e5f5; color: #6a1b9a; }
    .shc-vark.R { background: #e8f5e9; color: #2e7d32; }
    .shc-vark.K { background: #fff3e0; color: #e65100; }
    .shc-absent-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .shc-absent-ok   { background: #e8f5e9; color: #2e7d32; }
    .shc-absent-warn { background: #fff3e0; color: #e65100; }
    .shc-absent-high { background: #ffebee; color: #c62828; }
    .shc-level {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .shc-level-A { background: #e8f5e9; color: #2e7d32; }
    .shc-level-B { background: #e3f2fd; color: #1565c0; }
    .shc-level-C { background: #fff3e0; color: #e65100; }
    .shc-level-D { background: #ffebee; color: #c62828; }
    .shc-footer {
      background: #f7f9fc;
      padding: 8px 14px;
      font-size: 11px;
      color: #aaa;
      text-align: center;
      border-top: 1px solid #eee;
    }
    .shc-loading {
      padding: 20px;
      text-align: center;
      color: #888;
      font-size: 13px;
    }
    .shc-error {
      padding: 16px;
      text-align: center;
      color: #c62828;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  // ─── جلب بيانات الطالب ───
  async function fetchStudentData(studentId) {
    if (cardCache[studentId]) return cardCache[studentId];

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    };

    // جلب بيانات الطالب من special_ed_students
    const [seRes, varkRes, attendRes] = await Promise.allSettled([
      fetch(`${SUPABASE_URL}/rest/v1/special_ed_students?student_id=eq.${encodeURIComponent(studentId)}&select=*&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/vark_results?student_name=eq.${encodeURIComponent(studentId)}&select=dominant_style,grade,section&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/special_ed_attendance?student_id=eq.${encodeURIComponent(studentId)}&select=status&order=date.desc&limit=30`, { headers })
    ]);

    let student = null, vark = null, absentDays = 0;

    if (seRes.status === 'fulfilled' && seRes.value.ok) {
      const arr = await seRes.value.json();
      student = arr[0] || null;
    }

    if (varkRes.status === 'fulfilled' && varkRes.value.ok) {
      const arr = await varkRes.value.json();
      vark = arr[0] || null;
    }

    if (attendRes.status === 'fulfilled' && attendRes.value.ok) {
      const arr = await attendRes.value.json();
      absentDays = arr.filter(r => r.status === 'absent').length;
    }

    const data = { student, vark, absentDays };
    cardCache[studentId] = data;
    return data;
  }

  // ─── VARK اسم نمط ───
  function varkLabel(style) {
    const labels = { V: 'بصري 👁️', A: 'سمعي 👂', R: 'قرائي 📖', K: 'حركي 🤸' };
    return labels[style] || style || '—';
  }

  // ─── شارة الغياب ───
  function absentBadge(days) {
    if (days <= 3)  return `<span class="shc-absent-badge shc-absent-ok">${days} أيام ✅</span>`;
    if (days <= 8)  return `<span class="shc-absent-badge shc-absent-warn">${days} أيام ⚠️</span>`;
    return `<span class="shc-absent-badge shc-absent-high">${days} أيام 🔴</span>`;
  }

  // ─── مستوى الطالب ───
  function levelBadge(level) {
    if (!level) return '<span style="color:#aaa">—</span>';
    const cls = `shc-level-${level.toUpperCase()}`;
    return `<span class="shc-level ${cls}">${level}</span>`;
  }

  // ─── رسم البطاقة ───
  function renderCard(data, nameFromEl) {
    const { student, vark, absentDays } = data;

    if (!student) {
      return `<div class="shc-inner">
        <div class="shc-error">❌ لا توجد بيانات لهذا الطالب</div>
      </div>`;
    }

    const isHmma = student.disability_type && student.disability_type !== 'none';
    const varkStyle = vark ? vark.dominant_style : null;
    const grade = student.grade || '—';
    const section = student.class_section || '';

    return `
    <div class="shc-inner">
      <div class="shc-header">
        <div class="shc-avatar">${isHmma ? '♿' : '👩‍🎓'}</div>
        <div>
          <div class="shc-name">${student.name_ar || nameFromEl}</div>
          <div class="shc-grade">الصف ${grade}${section ? ' — شعبة ' + section : ''}</div>
          ${isHmma ? `<span class="shc-hmma">♿ صاحبة همة</span>` : ''}
        </div>
      </div>
      <div class="shc-body">
        <div class="shc-row">
          <span class="shc-icon">🧠</span>
          <span class="shc-label">نمط VARK</span>
          <span class="shc-val">
            ${varkStyle
              ? `<span class="shc-vark ${varkStyle}">${varkLabel(varkStyle)}</span>`
              : '<span style="color:#aaa">لم يُقيَّم</span>'}
          </span>
        </div>
        <div class="shc-row">
          <span class="shc-icon">📅</span>
          <span class="shc-label">الغياب</span>
          <span class="shc-val">${absentBadge(absentDays)}</span>
        </div>
        ${student.inclusion_type ? `
        <div class="shc-row">
          <span class="shc-icon">📋</span>
          <span class="shc-label">نوع الدمج</span>
          <span class="shc-val">${student.inclusion_type}</span>
        </div>` : ''}
        ${student.teacher_id ? `
        <div class="shc-row">
          <span class="shc-icon">👩‍🏫</span>
          <span class="shc-label">المربية</span>
          <span class="shc-val">${student.teacher_id}</span>
        </div>` : ''}
        ${isHmma ? `
        <div class="shc-row">
          <span class="shc-icon">♿</span>
          <span class="shc-label">الإعاقة</span>
          <span class="shc-val" style="color:#c62828">${student.disability_type}</span>
        </div>` : ''}
      </div>
      <div class="shc-footer">🏫 بوابة الجود — بيانات حية</div>
    </div>`;
  }

  // ─── منطق الـ hover ───
  let hideTimeout = null;
  let currentTarget = null;

  async function showCard(el, studentId) {
    clearTimeout(hideTimeout);
    currentTarget = el;

    // تحديد موضع البطاقة
    const rect = el.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 6;
    let left = rect.left + window.scrollX;

    // تأكد لا تخرج من الشاشة
    if (left + 310 > window.innerWidth) left = window.innerWidth - 315;
    if (left < 5) left = 5;

    card.style.top = top + 'px';
    card.style.left = left + 'px';
    card.classList.add('shc-visible');
    card.querySelector('.shc-inner').innerHTML = '<div class="shc-loading">⏳ جاري التحميل...</div>';

    try {
      const data = await fetchStudentData(studentId);
      if (currentTarget === el) {
        card.querySelector('.shc-inner').outerHTML; // refresh ref
        card.innerHTML = renderCard(data, el.textContent.trim());
      }
    } catch (e) {
      if (currentTarget === el) {
        card.innerHTML = '<div class="shc-inner"><div class="shc-error">❌ خطأ في تحميل البيانات</div></div>';
      }
    }
  }

  function hideCard() {
    hideTimeout = setTimeout(() => {
      card.classList.remove('shc-visible');
      currentTarget = null;
    }, 200);
  }

  card.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
  card.addEventListener('mouseleave', hideCard);

  // ─── تفعيل على كل العناصر التي تحمل data-student-id ───
  function attachListeners() {
    document.querySelectorAll('[data-student-id]:not([data-shc-attached])').forEach(el => {
      el.setAttribute('data-shc-attached', '1');
      el.style.cursor = 'pointer';
      el.style.borderBottom = '1px dashed #2e7bcf';

      el.addEventListener('mouseenter', () => showCard(el, el.getAttribute('data-student-id')));
      el.addEventListener('mouseleave', hideCard);

      // دعم اللمس للأجهزة اللوحية
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showCard(el, el.getAttribute('data-student-id'));
      }, { passive: false });
    });
  }

  // تفعيل فوري + مراقبة التغييرات الديناميكية
  attachListeners();
  const observer = new MutationObserver(attachListeners);
  observer.observe(document.body, { childList: true, subtree: true });

})();
