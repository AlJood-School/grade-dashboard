/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS — محرك الثيمات الذكي v2
 *  المؤلف: منيرة المري — شهادة حق المؤلف 1614-2026
 *  القاعدة: لا localStorage أبداً — يُستخدم sessionStorage فقط
 *  11 ثيم: 6 ليلية + فاتح محسَّن + 4 سياقية ذكية
 * ═══════════════════════════════════════════════════════════════
 */

const EduTheme = (function(){

  // ── تعريف الثيمات ────────────────────────────────────────────
  const THEMES = [

    /* ── ١. الثيمات الليلية الأساسية ── */
    {
      id: 'default',
      name: 'ليلي بنفسجي',
      icon: '🌌',
      category: 'night',
      vars: {
        '--bg':           '#0a0e1a',
        '--surface':      '#111827',
        '--surface2':     '#1a2235',
        '--surface3':     '#1f2d44',
        '--indigo':       '#6366f1',
        '--indigo2':      '#818cf8',
        '--emerald':      '#10b981',
        '--emerald2':     '#34d399',
        '--gold':         '#f6c90e',
        '--rose':         '#f43f5e',
        '--sky':          '#0ea5e9',
        '--violet':       '#8b5cf6',
        '--text':         '#f1f5f9',
        '--text2':        'rgba(241,245,249,0.65)',
        '--text3':        'rgba(241,245,249,0.35)',
        '--border':       'rgba(255,255,255,0.07)',
        '--glow-indigo':  'rgba(99,102,241,0.15)',
        '--glow-emerald': 'rgba(16,185,129,0.15)',
        '--header-bg':    'rgba(10,14,26,0.95)',
        '--card-shadow':  '0 4px 20px rgba(0,0,0,0.4)',
        '--input-bg':     '#1a2235',
      }
    },
    {
      id: 'emerald',
      name: 'ليلي زمردي',
      icon: '💚',
      category: 'night',
      vars: {
        '--bg':           '#030f0a',
        '--surface':      '#0a1f14',
        '--surface2':     '#122b1e',
        '--surface3':     '#1a3828',
        '--indigo':       '#10b981',
        '--indigo2':      '#34d399',
        '--emerald':      '#06b6d4',
        '--emerald2':     '#22d3ee',
        '--gold':         '#f6c90e',
        '--rose':         '#f43f5e',
        '--sky':          '#38bdf8',
        '--violet':       '#a3e635',
        '--text':         '#f0fdf4',
        '--text2':        'rgba(240,253,244,0.65)',
        '--text3':        'rgba(240,253,244,0.35)',
        '--border':       'rgba(16,185,129,0.12)',
        '--glow-indigo':  'rgba(16,185,129,0.15)',
        '--glow-emerald': 'rgba(6,182,212,0.15)',
        '--header-bg':    'rgba(3,15,10,0.95)',
        '--card-shadow':  '0 4px 20px rgba(0,0,0,0.5)',
        '--input-bg':     '#122b1e',
      }
    },
    {
      id: 'gold',
      name: 'ليلي ذهبي',
      icon: '🌟',
      category: 'night',
      vars: {
        '--bg':           '#0f0a00',
        '--surface':      '#1c1400',
        '--surface2':     '#2a1f00',
        '--surface3':     '#382a00',
        '--indigo':       '#f6c90e',
        '--indigo2':      '#fde68a',
        '--emerald':      '#f59e0b',
        '--emerald2':     '#fbbf24',
        '--gold':         '#f6c90e',
        '--rose':         '#f43f5e',
        '--sky':          '#0ea5e9',
        '--violet':       '#fb923c',
        '--text':         '#fefce8',
        '--text2':        'rgba(254,252,232,0.65)',
        '--text3':        'rgba(254,252,232,0.35)',
        '--border':       'rgba(246,200,14,0.1)',
        '--glow-indigo':  'rgba(246,200,14,0.15)',
        '--glow-emerald': 'rgba(245,158,11,0.15)',
        '--header-bg':    'rgba(15,10,0,0.95)',
        '--card-shadow':  '0 4px 20px rgba(0,0,0,0.5)',
        '--input-bg':     '#2a1f00',
      }
    },
    {
      id: 'rose',
      name: 'ليلي وردي',
      icon: '🌹',
      category: 'night',
      vars: {
        '--bg':           '#0f0008',
        '--surface':      '#1a0012',
        '--surface2':     '#25001c',
        '--surface3':     '#300026',
        '--indigo':       '#f43f5e',
        '--indigo2':      '#fb7185',
        '--emerald':      '#ec4899',
        '--emerald2':     '#f472b6',
        '--gold':         '#f6c90e',
        '--rose':         '#f43f5e',
        '--sky':          '#0ea5e9',
        '--violet':       '#e879f9',
        '--text':         '#fff1f2',
        '--text2':        'rgba(255,241,242,0.65)',
        '--text3':        'rgba(255,241,242,0.35)',
        '--border':       'rgba(244,63,94,0.1)',
        '--glow-indigo':  'rgba(244,63,94,0.15)',
        '--glow-emerald': 'rgba(236,72,153,0.15)',
        '--header-bg':    'rgba(15,0,8,0.95)',
        '--card-shadow':  '0 4px 20px rgba(0,0,0,0.5)',
        '--input-bg':     '#25001c',
      }
    },
    {
      id: 'sky',
      name: 'ليلي سماوي',
      icon: '🌊',
      category: 'night',
      vars: {
        '--bg':           '#00080f',
        '--surface':      '#001220',
        '--surface2':     '#001a2e',
        '--surface3':     '#00243d',
        '--indigo':       '#0ea5e9',
        '--indigo2':      '#38bdf8',
        '--emerald':      '#06b6d4',
        '--emerald2':     '#22d3ee',
        '--gold':         '#f6c90e',
        '--rose':         '#f43f5e',
        '--sky':          '#0ea5e9',
        '--violet':       '#818cf8',
        '--text':         '#f0f9ff',
        '--text2':        'rgba(240,249,255,0.65)',
        '--text3':        'rgba(240,249,255,0.35)',
        '--border':       'rgba(14,165,233,0.1)',
        '--glow-indigo':  'rgba(14,165,233,0.15)',
        '--glow-emerald': 'rgba(6,182,212,0.15)',
        '--header-bg':    'rgba(0,8,15,0.95)',
        '--card-shadow':  '0 4px 20px rgba(0,0,0,0.5)',
        '--input-bg':     '#001a2e',
      }
    },
    {
      id: 'violet',
      name: 'بنفسجي ملكي',
      icon: '👑',
      category: 'night',
      vars: {
        '--bg':           '#08000f',
        '--surface':      '#120020',
        '--surface2':     '#1a002e',
        '--surface3':     '#22003d',
        '--indigo':       '#8b5cf6',
        '--indigo2':      '#a78bfa',
        '--emerald':      '#c026d3',
        '--emerald2':     '#d946ef',
        '--gold':         '#f6c90e',
        '--rose':         '#f43f5e',
        '--sky':          '#0ea5e9',
        '--violet':       '#8b5cf6',
        '--text':         '#faf5ff',
        '--text2':        'rgba(250,245,255,0.65)',
        '--text3':        'rgba(250,245,255,0.35)',
        '--border':       'rgba(139,92,246,0.12)',
        '--glow-indigo':  'rgba(139,92,246,0.15)',
        '--glow-emerald': 'rgba(192,38,211,0.15)',
        '--header-bg':    'rgba(8,0,15,0.95)',
        '--card-shadow':  '0 4px 20px rgba(0,0,0,0.5)',
        '--input-bg':     '#1a002e',
      }
    },

    /* ── ٢. الثيم الفاتح المحسَّن ── */
    {
      id: 'light',
      name: 'نهاري فاتح',
      icon: '☀️',
      category: 'light',
      vars: {
        '--bg':           '#eef2f7',        /* رمادي-أزرق فاتح جداً */
        '--surface':      '#ffffff',
        '--surface2':     '#f5f7fa',        /* كريمي فاتح */
        '--surface3':     '#e8edf3',
        '--indigo':       '#4338ca',        /* بنفسجي-أزرق عميق */
        '--indigo2':      '#6366f1',
        '--emerald':      '#047857',
        '--emerald2':     '#059669',
        '--gold':         '#b45309',
        '--rose':         '#be123c',
        '--sky':          '#0369a1',
        '--violet':       '#6d28d9',
        '--text':         '#1e293b',        /* كحلي داكن */
        '--text2':        'rgba(30,41,59,0.7)',
        '--text3':        'rgba(30,41,59,0.45)',
        '--border':       'rgba(30,41,59,0.12)',
        '--glow-indigo':  'rgba(67,56,202,0.08)',
        '--glow-emerald': 'rgba(4,120,87,0.08)',
        '--header-bg':    '#ffffff',        /* هيدر أبيض نظيف */
        '--card-shadow':  '0 2px 12px rgba(30,41,59,0.08)',
        '--input-bg':     '#f5f7fa',
      }
    },

    /* ── ٣. الثيمات السياقية الذكية ── */
    {
      id: 'ramadan',
      name: 'رمضان كريم',
      icon: '🌙',
      category: 'contextual',
      vars: {
        '--bg':           '#0d0a1e',        /* ليل رمضاني عميق */
        '--surface':      '#16122e',
        '--surface2':     '#1e1840',
        '--surface3':     '#261f52',
        '--indigo':       '#c9a227',        /* ذهب رمضاني */
        '--indigo2':      '#e2c05e',
        '--emerald':      '#10b981',
        '--emerald2':     '#34d399',
        '--gold':         '#c9a227',
        '--rose':         '#f43f5e',
        '--sky':          '#60a5fa',
        '--violet':       '#a78bfa',
        '--text':         '#fdf6e3',        /* كريم دافئ */
        '--text2':        'rgba(253,246,227,0.7)',
        '--text3':        'rgba(253,246,227,0.4)',
        '--border':       'rgba(201,162,39,0.15)',
        '--glow-indigo':  'rgba(201,162,39,0.2)',
        '--glow-emerald': 'rgba(16,185,129,0.15)',
        '--header-bg':    'rgba(13,10,30,0.97)',
        '--card-shadow':  '0 4px 24px rgba(201,162,39,0.12)',
        '--input-bg':     '#1e1840',
      }
    },
    {
      id: 'emergency',
      name: 'وضع الطوارئ',
      icon: '🚨',
      category: 'contextual',
      vars: {
        '--bg':           '#fff8e1',        /* أصفر عنبري ساطع — يوجع العين */
        '--surface':      '#ffecb3',        /* عنبر فاتح مقلق */
        '--surface2':     '#ffe082',        /* عنبر أعمق */
        '--surface3':     '#ffd54f',        /* عنبر صارخ */
        '--indigo':       '#d50000',        /* أحمر صارخ جداً */
        '--indigo2':      '#ff1744',        /* أحمر أكثر وضوحاً */
        '--emerald':      '#e65100',        /* برتقالي تحذير حاد */
        '--emerald2':     '#ff6d00',
        '--gold':         '#e65100',
        '--rose':         '#d50000',
        '--sky':          '#b71c1c',
        '--violet':       '#c62828',
        '--text':         '#1a0000',        /* أسود-أحمر — تباين مؤلم */
        '--text2':        'rgba(26,0,0,0.75)',
        '--text3':        'rgba(26,0,0,0.5)',
        '--border':       'rgba(213,0,0,0.4)',
        '--glow-indigo':  'rgba(213,0,0,0.25)',
        '--glow-emerald': 'rgba(230,81,0,0.2)',
        '--header-bg':    '#d50000',        /* هيدر أحمر صارخ — لا يُنسى */
        '--card-shadow':  '0 4px 20px rgba(213,0,0,0.3)',
        '--input-bg':     '#ffe082',
      }
    },
    {
      id: 'remote',
      name: 'تعلم عن بعد',
      icon: '🏠',
      category: 'contextual',
      vars: {
        '--bg':           '#f0f7ff',        /* أزرق فاتح جداً — مريح للشاشة الطويلة */
        '--surface':      '#ffffff',
        '--surface2':     '#e8f4fd',
        '--surface3':     '#d1eaf8',
        '--indigo':       '#1d6fa4',        /* أزرق اتصال */
        '--indigo2':      '#2e88c4',
        '--emerald':      '#0d7a5f',
        '--emerald2':     '#10a37f',
        '--gold':         '#b07d00',
        '--rose':         '#c0392b',
        '--sky':          '#1d6fa4',
        '--violet':       '#5b3fa6',
        '--text':         '#0c2340',
        '--text2':        'rgba(12,35,64,0.68)',
        '--text3':        'rgba(12,35,64,0.42)',
        '--border':       'rgba(29,111,164,0.15)',
        '--glow-indigo':  'rgba(29,111,164,0.1)',
        '--glow-emerald': 'rgba(13,122,95,0.1)',
        '--header-bg':    '#1d6fa4',        /* هيدر أزرق مميز */
        '--card-shadow':  '0 2px 12px rgba(29,111,164,0.1)',
        '--input-bg':     '#e8f4fd',
      }
    },
    {
      id: 'national',
      name: 'اليوم الوطني',
      icon: '🇦🇪',
      category: 'contextual',
      vars: {
        '--bg':           '#f5faf5',        /* أوف وايت مع لمسة خضراء ناعمة */
        '--surface':      '#ffffff',        /* أبيض نقي */
        '--surface2':     '#edf7ed',        /* أخضر فاتح جداً */
        '--surface3':     '#e0f2e0',        /* أخضر فاتح */
        '--indigo':       '#2e7d32',        /* أخضر الإمارات المحترم */
        '--indigo2':      '#43a047',        /* أخضر أفتح */
        '--emerald':      '#1b5e20',        /* أخضر داكن */
        '--emerald2':     '#388e3c',
        '--gold':         '#c62828',        /* أحمر علم الإمارات — للتوازن */
        '--rose':         '#b71c1c',
        '--sky':          '#1565c0',
        '--violet':       '#2e7d32',
        '--text':         '#1a2e1a',        /* أخضر-أسود — واضح جداً */
        '--text2':        'rgba(26,46,26,0.68)',
        '--text3':        'rgba(26,46,26,0.42)',
        '--border':       'rgba(46,125,50,0.18)',
        '--glow-indigo':  'rgba(46,125,50,0.1)',
        '--glow-emerald': 'rgba(27,94,32,0.1)',
        '--header-bg':    '#2e7d32',        /* هيدر أخضر فاتح واضح */
        '--card-shadow':  '0 2px 12px rgba(46,125,50,0.12)',
        '--input-bg':     '#edf7ed',
      }
    },
  ];

  // ── تصنيف الثيمات ────────────────────────────────────────────
  const CATEGORIES = {
    night:       { label: '🌙 ليلية', themes: [] },
    light:       { label: '☀️ فاتح',  themes: [] },
    contextual:  { label: '✨ سياقية ذكية', themes: [] },
  };
  THEMES.forEach(t => CATEGORIES[t.category]?.themes.push(t));

  // ── [النقوش أُلغيت بناءً على طلب الإدارة] ───────────────────
  const PATTERNS_DISABLED = {

    /* 🌌 بنفسجي — نجمة إسلامية ثمانية الرؤوس + نجوم صغيرة */
    default: { size:'140px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <g fill="white" fill-opacity="0.065">
          <polygon points="70,20 78,51 105,35 89,62 120,70 89,78 105,105 78,89 70,120 62,89 35,105 51,78 20,70 51,62 35,35 62,51"/>
          <circle cx="20" cy="20" r="2.5"/>
          <circle cx="120" cy="20" r="2.5"/>
          <circle cx="20" cy="120" r="2.5"/>
          <circle cx="120" cy="120" r="2.5"/>
          <circle cx="70" cy="70" r="3"/>
        </g>
      </svg>` },

    /* 💚 زمردي — نقش هندسي إسلامي (مربعات متداخلة + دوائر) */
    emerald: { size:'100px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <g fill="none" stroke="white" stroke-width="0.75" opacity="0.12">
          <rect x="12" y="12" width="76" height="76"/>
          <rect x="12" y="12" width="76" height="76" transform="rotate(45 50 50)"/>
          <circle cx="50" cy="50" r="9"/>
          <circle cx="50" cy="50" r="24"/>
        </g>
        <g fill="white" fill-opacity="0.08">
          <circle cx="50" cy="50" r="3"/>
        </g>
      </svg>` },

    /* 🌟 ذهبي — أرابيسك بتلات مع نقاط مزهرة */
    gold: { size:'130px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130">
        <g fill="white" fill-opacity="0.07">
          <path d="M65,25 C82,36 84,56 65,65 C46,56 48,36 65,25 Z"/>
          <path d="M65,105 C48,94 46,74 65,65 C84,74 82,94 65,105 Z"/>
          <path d="M25,65 C36,48 56,46 65,65 C56,84 36,82 25,65 Z"/>
          <path d="M105,65 C94,82 74,84 65,65 C74,46 94,48 105,65 Z"/>
          <path d="M36,36 C46,25 59,33 53,44 C47,55 30,49 36,36 Z"/>
          <path d="M94,36 C100,49 83,55 77,44 C71,33 84,25 94,36 Z"/>
          <path d="M36,94 C30,81 47,75 53,86 C59,97 46,105 36,94 Z"/>
          <path d="M94,94 C84,105 71,97 77,86 C83,75 100,81 94,94 Z"/>
          <circle cx="65" cy="65" r="5"/>
          <circle cx="65" cy="25" r="2.5"/>
          <circle cx="65" cy="105" r="2.5"/>
          <circle cx="25" cy="65" r="2.5"/>
          <circle cx="105" cy="65" r="2.5"/>
        </g>
      </svg>` },

    /* 🌹 وردي — وردة ست بتلات متكررة */
    rose: { size:'110px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110">
        <g fill="white" fill-opacity="0.07">
          <ellipse cx="55" cy="30" rx="9" ry="20" transform="rotate(0 55 55)"/>
          <ellipse cx="55" cy="30" rx="9" ry="20" transform="rotate(60 55 55)"/>
          <ellipse cx="55" cy="30" rx="9" ry="20" transform="rotate(120 55 55)"/>
          <ellipse cx="55" cy="30" rx="9" ry="20" transform="rotate(180 55 55)"/>
          <ellipse cx="55" cy="30" rx="9" ry="20" transform="rotate(240 55 55)"/>
          <ellipse cx="55" cy="30" rx="9" ry="20" transform="rotate(300 55 55)"/>
          <circle cx="55" cy="55" r="7"/>
          <circle cx="55" cy="55" r="3"/>
        </g>
      </svg>` },

    /* 🌊 سماوي — أمواج بحرية متدفقة */
    sky: { size:'200px 70px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="70">
        <g fill="none" stroke="white" stroke-width="1.2" opacity="0.09">
          <path d="M-10,15 C15,5 40,25 65,15 S115,5 140,15 S165,25 210,15"/>
          <path d="M-10,35 C15,25 40,45 65,35 S115,25 140,35 S165,45 210,35"/>
          <path d="M-10,55 C15,45 40,65 65,55 S115,45 140,55 S165,65 210,55"/>
        </g>
      </svg>` },

    /* 👑 ملكي — ماسة مزدوجة الإطار مع نقاط */
    royal: { size:'90px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90">
        <g fill="none" stroke="white" stroke-width="0.8" opacity="0.12">
          <polygon points="45,4 86,45 45,86 4,45"/>
          <polygon points="45,18 72,45 45,72 18,45"/>
          <circle cx="45" cy="45" r="6"/>
        </g>
        <g fill="white" fill-opacity="0.09">
          <circle cx="45" cy="4"  r="2.5"/>
          <circle cx="86" cy="45" r="2.5"/>
          <circle cx="45" cy="86" r="2.5"/>
          <circle cx="4"  cy="45" r="2.5"/>
          <circle cx="45" cy="45" r="2.5"/>
        </g>
      </svg>` },

    /* 🌙 رمضان — هلال كريم + نجوم متناثرة */
    ramadan: { size:'170px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="170">
        <g fill="white" fill-opacity="0.07">
          <path d="M85,22 C108,22 125,43 125,70 C125,97 108,118 85,118 C101,107 111,90 111,70 C111,50 101,33 85,22 Z"/>
          <polygon points="132,26 134,34 142,34 136,39 138,47 132,42 126,47 128,39 122,34 130,34"/>
          <polygon points="30,84 32,90 38,90 33,94 35,100 30,96 25,100 27,94 22,90 28,90"/>
          <polygon points="142,97 143.5,102 149,102 144.5,105.5 146,111 142,108 138,111 139.5,105.5 135,102 140.5,102"/>
          <circle cx="44" cy="28"  r="2.5"/>
          <circle cx="150" cy="58" r="2"/>
          <circle cx="58"  cy="138" r="1.8"/>
          <circle cx="155" cy="130" r="1.5"/>
        </g>
      </svg>` },

    /* 🇦🇪 وطني — نجمة خماسية خضراء خفيفة */
    national: { size:'150px', svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150">
        <g fill="#2e7d32" fill-opacity="0.08">
          <polygon points="75,22 80,66 120,66 87,89 100,130 75,106 50,130 63,89 30,66 70,66"/>
          <circle cx="20" cy="20"   r="3"/>
          <circle cx="130" cy="130" r="3"/>
          <circle cx="130" cy="20"  r="2.5"/>
          <circle cx="20" cy="130"  r="2.5"/>
          <circle cx="75" cy="75"   r="2"/>
        </g>
      </svg>` },

    /* ☀️ فاتح — بلا نقش */
    light:     null,
    /* 🚨 طوارئ — له نقشه الخاص في CSS الصفحة */
    emergency: null,
    /* 🏠 تعلم عن بعد — خلفية فاتحة بلا نقش */
    remote:    null,
  };

  let currentTheme = 'default';

  // ── تطبيق الثيم ──────────────────────────────────────────────
  function apply(id){
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

    // class على body للتمييز بين الليلي والفاتح
    document.body.classList.remove('theme-dark','theme-light','theme-contextual');
    document.body.classList.add('theme-' + theme.category);
    document.body.dataset.theme = id;

    currentTheme = id;
    try { sessionStorage.setItem('eduos_theme', id); } catch(e){}

    // تحديث زر الثيم
    const btn = document.getElementById('theme-toggle-btn');
    if(btn) btn.textContent = theme.icon;

    // تحديث الـ active في picker إن كان مفتوحاً
    document.querySelectorAll('.edu-theme-card').forEach(c => {
      const active = c.dataset.theme === id;
      c.style.borderColor = active ? 'var(--indigo)' : 'var(--border)';
      c.style.background  = active ? 'var(--glow-indigo)' : 'var(--surface2)';
      const badge = c.querySelector('.edu-theme-active');
      if(badge) badge.style.display = active ? 'block' : 'none';
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
      background:rgba(0,0,0,0.6); backdrop-filter:blur(6px);
      display:flex; align-items:center; justify-content:center;
      font-family:'Tajawal',sans-serif; direction:rtl; padding:16px;
    `;

    // بناء الأقسام
    const sectionsHTML = Object.entries(CATEGORIES).map(([catId, cat]) => {
      if(!cat.themes.length) return '';
      const cards = cat.themes.map(t => `
        <div class="edu-theme-card" data-theme="${t.id}"
          onclick="EduTheme.apply('${t.id}')"
          style="
            background:${t.id===currentTheme?'var(--glow-indigo)':'var(--surface2)'};
            border:2px solid ${t.id===currentTheme?'var(--indigo)':'var(--border)'};
            border-radius:14px; padding:14px 10px; cursor:pointer;
            text-align:center; transition:all .25s;
          "
          onmouseover="if(this.dataset.theme!=='${currentTheme}') this.style.borderColor='var(--indigo2)'"
          onmouseout="if(this.dataset.theme!=='${currentTheme}') this.style.borderColor='var(--border)'"
        >
          <div style="font-size:26px;margin-bottom:6px">${t.icon}</div>
          <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.3">${t.name}</div>
          <div class="edu-theme-active" style="display:${t.id===currentTheme?'block':'none'};font-size:10px;color:var(--indigo2);margin-top:5px;font-weight:600">✓ نشط</div>
        </div>
      `).join('');
      return `
        <div style="margin-bottom:18px">
          <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:10px;padding-right:2px">${cat.label}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">${cards}</div>
        </div>
      `;
    }).join('');

    overlay.innerHTML = `
      <div style="
        background:var(--surface);
        border:1px solid var(--border);
        border-radius:20px; padding:24px;
        width:100%; max-width:560px;
        max-height:88vh; overflow-y:auto;
        box-shadow:0 24px 64px rgba(0,0,0,0.5);
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div style="font-size:17px;font-weight:800;color:var(--text)">🎨 اختاري الثيم</div>
          <button onclick="document.getElementById('edu-theme-picker').remove()"
            style="
              width:32px;height:32px;border-radius:50%;
              background:var(--surface2);border:1px solid var(--border);
              color:var(--text2);font-size:16px;cursor:pointer;
              display:flex;align-items:center;justify-content:center;
              transition:all .2s; font-family:'Tajawal',sans-serif;
            "
            onmouseover="this.style.background='#ef4444';this.style.color='#fff'"
            onmouseout="this.style.background='var(--surface2)';this.style.color='var(--text2)'">✕</button>
        </div>
        ${sectionsHTML}
        <div style="
          padding-top:14px;border-top:1px solid var(--border);
          font-size:11px;color:var(--text3);text-align:center;
        ">
          الثيم يُطبَّق فوراً ويُحفظ للجلسة الحالية فقط
        </div>
      </div>
    `;

    overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ── حقن platform-design-system.css تلقائياً ────────────────
  function injectDesignSystem(){
    const dsId = 'eduos-design-system-css';
    if(document.getElementById(dsId)) return; // لا تُحقن مرتين
    // الرابط النسبي: platform-theme.js → ../platform-design-system.css
    const link = document.createElement('link');
    link.id = dsId;
    link.rel = 'stylesheet';
    // نحدد المسار بناءً على موقع الـ script الحالي
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const themeScript = scripts.find(s => s.src && s.src.includes('platform-theme'));
    let base = '../'; // افتراضي: الصفحة في apps/eduos-xxx/
    if(themeScript){
      const scriptPath = new URL(themeScript.src);
      base = scriptPath.href.replace('platform-theme.js', '');
    }
    link.href = base + 'platform-design-system.css';
    document.head.appendChild(link);
  }

  // ── تهيئة عند التحميل ───────────────────────────────────────
  function init(){
    injectDesignSystem();
    let saved = 'default';
    try { saved = sessionStorage.getItem('eduos_theme') || 'default'; } catch(e){}
    apply(saved);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { apply, openPicker, THEMES, CATEGORIES };

})();
