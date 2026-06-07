/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS — محرك الثيمات الذكي
 *  المؤلف: منيرة المري — شهادة حق المؤلف 1614-2026
 *  القاعدة: لا localStorage أبداً — يُستخدم sessionStorage فقط
 * ═══════════════════════════════════════════════════════════════
 */

const EduTheme = (function(){

  // ── تعريف الثيمات ────────────────────────────────────────────
  const THEMES = [
    {
      id: 'default',
      name: 'ليلي بنفسجي',
      icon: '🌌',
      vars: {
        '--bg':          '#0a0e1a',
        '--surface':     '#111827',
        '--surface2':    '#1a2235',
        '--surface3':    '#1f2d44',
        '--indigo':      '#6366f1',
        '--indigo2':     '#818cf8',
        '--emerald':     '#10b981',
        '--emerald2':    '#34d399',
        '--gold':        '#f6c90e',
        '--rose':        '#f43f5e',
        '--sky':         '#0ea5e9',
        '--violet':      '#8b5cf6',
        '--text':        '#f1f5f9',
        '--text2':       'rgba(241,245,249,0.65)',
        '--text3':       'rgba(241,245,249,0.35)',
        '--border':      'rgba(255,255,255,0.07)',
        '--glow-indigo': 'rgba(99,102,241,0.15)',
        '--glow-emerald':'rgba(16,185,129,0.15)',
      }
    },
    {
      id: 'emerald',
      name: 'ليلي زمردي',
      icon: '💚',
      vars: {
        '--bg':          '#030f0a',
        '--surface':     '#0a1f14',
        '--surface2':    '#122b1e',
        '--surface3':    '#1a3828',
        '--indigo':      '#10b981',
        '--indigo2':     '#34d399',
        '--emerald':     '#06b6d4',
        '--emerald2':    '#22d3ee',
        '--gold':        '#f6c90e',
        '--rose':        '#f43f5e',
        '--sky':         '#38bdf8',
        '--violet':      '#a3e635',
        '--text':        '#f0fdf4',
        '--text2':       'rgba(240,253,244,0.65)',
        '--text3':       'rgba(240,253,244,0.35)',
        '--border':      'rgba(16,185,129,0.12)',
        '--glow-indigo': 'rgba(16,185,129,0.15)',
        '--glow-emerald':'rgba(6,182,212,0.15)',
      }
    },
    {
      id: 'gold',
      name: 'ليلي ذهبي',
      icon: '🌟',
      vars: {
        '--bg':          '#0f0a00',
        '--surface':     '#1c1400',
        '--surface2':    '#2a1f00',
        '--surface3':    '#382a00',
        '--indigo':      '#f6c90e',
        '--indigo2':     '#fde68a',
        '--emerald':     '#f59e0b',
        '--emerald2':    '#fbbf24',
        '--gold':        '#f6c90e',
        '--rose':        '#f43f5e',
        '--sky':         '#0ea5e9',
        '--violet':      '#fb923c',
        '--text':        '#fefce8',
        '--text2':       'rgba(254,252,232,0.65)',
        '--text3':       'rgba(254,252,232,0.35)',
        '--border':      'rgba(246,200,14,0.1)',
        '--glow-indigo': 'rgba(246,200,14,0.15)',
        '--glow-emerald':'rgba(245,158,11,0.15)',
      }
    },
    {
      id: 'rose',
      name: 'ليلي وردي',
      icon: '🌹',
      vars: {
        '--bg':          '#0f0008',
        '--surface':     '#1a0012',
        '--surface2':    '#25001c',
        '--surface3':    '#300026',
        '--indigo':      '#f43f5e',
        '--indigo2':     '#fb7185',
        '--emerald':     '#ec4899',
        '--emerald2':    '#f472b6',
        '--gold':        '#f6c90e',
        '--rose':        '#f43f5e',
        '--sky':         '#0ea5e9',
        '--violet':      '#e879f9',
        '--text':        '#fff1f2',
        '--text2':       'rgba(255,241,242,0.65)',
        '--text3':       'rgba(255,241,242,0.35)',
        '--border':      'rgba(244,63,94,0.1)',
        '--glow-indigo': 'rgba(244,63,94,0.15)',
        '--glow-emerald':'rgba(236,72,153,0.15)',
      }
    },
    {
      id: 'sky',
      name: 'ليلي سماوي',
      icon: '🌊',
      vars: {
        '--bg':          '#00080f',
        '--surface':     '#001220',
        '--surface2':    '#001a2e',
        '--surface3':    '#00243d',
        '--indigo':      '#0ea5e9',
        '--indigo2':     '#38bdf8',
        '--emerald':     '#06b6d4',
        '--emerald2':    '#22d3ee',
        '--gold':        '#f6c90e',
        '--rose':        '#f43f5e',
        '--sky':         '#0ea5e9',
        '--violet':      '#818cf8',
        '--text':        '#f0f9ff',
        '--text2':       'rgba(240,249,255,0.65)',
        '--text3':       'rgba(240,249,255,0.35)',
        '--border':      'rgba(14,165,233,0.1)',
        '--glow-indigo': 'rgba(14,165,233,0.15)',
        '--glow-emerald':'rgba(6,182,212,0.15)',
      }
    },
    {
      id: 'violet',
      name: 'بنفسجي ملكي',
      icon: '👑',
      vars: {
        '--bg':          '#08000f',
        '--surface':     '#120020',
        '--surface2':    '#1a002e',
        '--surface3':    '#22003d',
        '--indigo':      '#8b5cf6',
        '--indigo2':     '#a78bfa',
        '--emerald':     '#c026d3',
        '--emerald2':    '#d946ef',
        '--gold':        '#f6c90e',
        '--rose':        '#f43f5e',
        '--sky':         '#0ea5e9',
        '--violet':      '#8b5cf6',
        '--text':        '#faf5ff',
        '--text2':       'rgba(250,245,255,0.65)',
        '--text3':       'rgba(250,245,255,0.35)',
        '--border':      'rgba(139,92,246,0.12)',
        '--glow-indigo': 'rgba(139,92,246,0.15)',
        '--glow-emerald':'rgba(192,38,211,0.15)',
      }
    },
    {
      id: 'light',
      name: 'نهاري فاتح',
      icon: '☀️',
      vars: {
        '--bg':          '#f1f5f9',
        '--surface':     '#ffffff',
        '--surface2':    '#f8fafc',
        '--surface3':    '#e2e8f0',
        '--indigo':      '#4f46e5',
        '--indigo2':     '#6366f1',
        '--emerald':     '#059669',
        '--emerald2':    '#10b981',
        '--gold':        '#d97706',
        '--rose':        '#e11d48',
        '--sky':         '#0284c7',
        '--violet':      '#7c3aed',
        '--text':        '#0f172a',
        '--text2':       'rgba(15,23,42,0.65)',
        '--text3':       'rgba(15,23,42,0.45)',
        '--border':      'rgba(15,23,42,0.1)',
        '--glow-indigo': 'rgba(79,70,229,0.1)',
        '--glow-emerald':'rgba(5,150,105,0.1)',
      }
    }
  ];

  let currentTheme = 'default';

  // ── تطبيق الثيم ──────────────────────────────────────────────
  function apply(id){
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    currentTheme = id;
    try { sessionStorage.setItem('eduos_theme', id); } catch(e){}
    // تحديث شكل زر الثيم
    const btn = document.getElementById('theme-toggle-btn');
    if(btn) btn.textContent = theme.icon;
    // تحديث الـ active في picker إن كان مفتوحاً
    document.querySelectorAll('.edu-theme-card').forEach(c => {
      c.style.borderColor = c.dataset.theme === id ? 'var(--indigo)' : 'rgba(255,255,255,0.08)';
      c.style.background = c.dataset.theme === id ? 'rgba(99,102,241,0.15)' : 'var(--surface2)';
    });
  }

  // ── واجهة اختيار الثيم ───────────────────────────────────────
  function openPicker(){
    let overlay = document.getElementById('edu-theme-picker');
    if(overlay){ overlay.remove(); return; }

    overlay = document.createElement('div');
    overlay.id = 'edu-theme-picker';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:99998;
      background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center;
      font-family:'Tajawal',sans-serif; direction:rtl;
    `;
    overlay.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,0.5)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div style="font-size:17px;font-weight:800;color:var(--text)">🎨 اختاري الثيم</div>
          <button onclick="document.getElementById('edu-theme-picker').remove()"
            style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 14px;color:var(--text2);font-family:'Tajawal',sans-serif;cursor:pointer;font-size:13px">✕ إغلاق</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px">
          ${THEMES.map(t => `
            <div class="edu-theme-card" data-theme="${t.id}"
              onclick="EduTheme.apply('${t.id}')"
              style="background:var(--surface2);border:2px solid ${t.id===currentTheme?'var(--indigo)':'rgba(255,255,255,0.08)'};
                     border-radius:14px;padding:14px;cursor:pointer;text-align:center;transition:all .2s;
                     ${t.id===currentTheme?'background:rgba(99,102,241,0.15)':''}">
              <div style="font-size:28px;margin-bottom:8px">${t.icon}</div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">${t.name}</div>
              ${t.id===currentTheme?'<div style="font-size:10px;color:var(--indigo2);margin-top:4px">✓ نشط</div>':''}
            </div>
          `).join('')}
        </div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:11px;color:var(--text3);text-align:center">
          الثيم يُطبَّق فوراً — يُحفظ للجلسة الحالية
        </div>
      </div>
    `;
    overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ── تهيئة عند التحميل ───────────────────────────────────────
  function init(){
    let saved = 'default';
    try { saved = sessionStorage.getItem('eduos_theme') || 'default'; } catch(e){}
    apply(saved);
  }

  // تشغيل عند جاهزية DOM
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { apply, openPicker, THEMES };

})();
