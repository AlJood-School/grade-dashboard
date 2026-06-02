/**
 * platform-theme.js — بوابة الجود
 * نظام الهوية البصرية الذكية
 * المؤلف: منيرة المري — شهادة حق المؤلف 1614-2026
 *
 * الاستخدام:
 *   <link rel="stylesheet" href="/platform-theme.css">
 *   <script src="/platform-theme.js"></script>
 *   <!-- تُستدعى init تلقائياً عند تحميل الصفحة -->
 */

const PlatformTheme = (() => {

  const SUPABASE_URL = 'https://zuyizaiugpmhmeycqton.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0.FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI';

  // ============================================================
  // البيانات الثابتة
  // ============================================================
  const THEMES = {
    // ثيمات ألوان (شخصية)
    sky:      { label: 'سماء العين',    icon: '🌤️', color: '#0ea5e9', personal: true  },
    palm:     { label: 'نخيل',          icon: '🌴', color: '#16a34a', personal: true  },
    rose:     { label: 'فجر وردي',      icon: '🌸', color: '#e11d48', personal: true  },
    gold:     { label: 'ذهب الصحراء',   icon: '🏆', color: '#d97706', personal: true  },
    dark:     { label: 'ليلي',          icon: '🌙', color: '#818cf8', personal: true  },
    classic:  { label: 'كلاسيك',        icon: '🔵', color: '#1d4ed8', personal: true  },
    // ثيمات خاصة (من المديرة فقط)
    ramadan:  { label: 'رمضان كريم',    icon: '🌙✨', color: '#7c3aed', personal: false, special: true },
    remote:   { label: 'تعلم عن بُعد',  icon: '🏠',  color: '#0369a1', personal: false, special: true },
    emergency:{ label: 'وضع طوارئ',     icon: '🚨',  color: '#dc2626', personal: false, special: true },
    health:   { label: 'وضع صحي',       icon: '💧',  color: '#059669', personal: false, special: true },
  };

  // المحتوى الديني للنوافذ المنبثقة
  // 🔴 قاعدة صارمة: صحيح البخاري أو مسلم فقط مع رقم الحديث
  const SPECIAL_POPUPS = {
    ramadan: {
      icon: '🌙',
      title: 'رمضان كريم 🌙✨',
      items: [
        { type: 'quran',   text: '﴿شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ﴾',       ref: 'سورة البقرة: 185' },
        { type: 'hadith',  text: '«مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ»', ref: 'صحيح البخاري: 38' },
        { type: 'thikr',   text: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',                ref: 'حصن المسلم — دعاء ليلة القدر' },
      ]
    },
    remote: {
      icon: '🏠',
      title: 'وضع التعلم عن بُعد',
      items: [
        { type: 'info', text: 'تأكدي من الاتصال بالإنترنت وأن الكاميرا تعمل قبل بدء الحصة.' },
        { type: 'info', text: 'ذكّري طالباتك بقواعد السلامة الرقمية.' },
        { type: 'info', text: 'المنصة تعمل بشكل كامل عن بُعد — كل البيانات محفوظة.' },
      ]
    },
    emergency: {
      icon: '🚨',
      title: '⚠️ وضع الطوارئ مُفعَّل',
      items: [
        { type: 'warning', text: 'تم تبسيط الواجهة لتسهيل الوصول السريع.' },
        { type: 'warning', text: 'تأكدي من سلامة جميع الطالبات.' },
        { type: 'warning', text: 'تواصلي مع الإدارة فور حدوث أي طارئ.' },
      ]
    },
    health: {
      icon: '💧',
      title: '💧 وضع الاحتياطات الصحية',
      items: [
        { type: 'info', text: 'التباعد الاجتماعي مُفعَّل — يُرجى الالتزام.' },
        { type: 'info', text: 'تذكير: النظافة اليدوية كل 30 دقيقة.' },
        { type: 'info', text: 'عند ظهور أي أعراض — أبلغي الإدارة فوراً.' },
      ]
    },
  };

  // ============================================================
  // المتغيرات
  // ============================================================
  let currentTheme = 'classic';
  let schoolTheme  = 'classic';  // الثيم الافتراضي من المديرة
  let specialTheme = null;        // طوارئ / رمضان / صحي / بُعد
  let userId       = null;

  // ============================================================
  // جلب البيانات من Supabase
  // ============================================================
  async function fetchJSON(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  'application/json',
      }
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function postJSON(path, body, method = 'POST') {
    await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(body),
    });
  }

  // ============================================================
  // تحميل الثيمات من Supabase
  // ============================================================
  async function loadThemes() {
    try {
      // 1️⃣ ثيم المدرسة الافتراضي
      const schoolRows = await fetchJSON('school_themes?select=theme_key,is_active&order=created_at.desc&limit=10');
      if (schoolRows && schoolRows.length > 0) {
        const special = schoolRows.find(r => r.is_active && THEMES[r.theme_key]?.special);
        const def     = schoolRows.find(r => r.is_active && !THEMES[r.theme_key]?.special);
        if (special) specialTheme = special.theme_key;
        if (def)     schoolTheme  = def.theme_key;
      }

      // 2️⃣ الثيم الشخصي للمستخدم
      userId = getUserId();
      let personalTheme = null;
      if (userId) {
        const prefRows = await fetchJSON(`user_preferences?user_id=eq.${userId}&select=theme_key&limit=1`);
        if (prefRows && prefRows.length > 0) personalTheme = prefRows[0].theme_key;
      }

      // 3️⃣ الأولوية: خاص > شخصي > مدرسة
      currentTheme = specialTheme || personalTheme || schoolTheme;
    } catch (e) {
      currentTheme = 'classic';
    }
  }

  // ============================================================
  // تطبيق الثيم
  // ============================================================
  function hexToRgb(hex) {
    hex = hex.trim().replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return isNaN(r) ? null : {r,g,b};
  }

  function syncDerivedVars() {
    // بعد تطبيق الثيم، نحدّث المتغيرات المشتقة (--gold, --gold-light, --border, --primary-rgb)
    // حتى تتجاوب الصفحات التي تستخدم rgba() محلية
    requestAnimationFrame(() => {
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      const rgb = hexToRgb(primary);
      if (!rgb) return;
      const root = document.documentElement.style;
      root.setProperty('--primary-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
      root.setProperty('--gold',         primary);
      root.setProperty('--gold-light',   `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`);
      root.setProperty('--border',       `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`);
      root.setProperty('--shadow-gold',  `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`);
    });
  }

  function applyTheme(key) {
    if (!THEMES[key]) key = 'classic';
    document.documentElement.setAttribute('data-theme', key);
    currentTheme = key;
    highlightActiveSwatch(key);
    syncDerivedVars();
  }

  function highlightActiveSwatch(key) {
    document.querySelectorAll('.theme-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.themeKey === key);
    });
  }

  // ============================================================
  // بناء واجهة منتقي الثيم
  // ============================================================
  function buildPicker() {
    // لا تُضاف منتقي الثيم إذا كان الثيم الخاص مُفعَّلاً
    if (specialTheme) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'theme-picker';

    const toggle = document.createElement('button');
    toggle.id = 'theme-picker-toggle';
    toggle.title = 'تغيير الثيم';
    toggle.innerHTML = '🎨';
    toggle.onclick = () => panel.classList.toggle('open');

    const panel = document.createElement('div');
    panel.id = 'theme-picker-panel';

    const h4 = document.createElement('h4');
    h4.textContent = 'اختاري ثيمك الشخصي';
    panel.appendChild(h4);

    const grid = document.createElement('div');
    grid.className = 'theme-swatch-grid';

    Object.entries(THEMES).forEach(([key, info]) => {
      if (!info.personal) return; // الثيمات الخاصة لا تُعرض هنا
      const sw = document.createElement('div');
      sw.className = 'theme-swatch';
      sw.dataset.themeKey = key;
      sw.style.background = info.color;
      sw.innerHTML = `${info.icon}<span>${info.label}</span>`;
      sw.onclick = () => selectPersonalTheme(key);
      grid.appendChild(sw);
    });

    panel.appendChild(grid);
    wrapper.appendChild(toggle);
    wrapper.appendChild(panel);
    document.body.appendChild(wrapper);

    // إغلاق عند النقر خارجه
    document.addEventListener('click', e => {
      if (!wrapper.contains(e.target)) panel.classList.remove('open');
    });

    highlightActiveSwatch(currentTheme);
  }

  // ============================================================
  // حفظ الثيم الشخصي
  // ============================================================
  async function selectPersonalTheme(key) {
    applyTheme(key);
    document.getElementById('theme-picker-panel')?.classList.remove('open');
    if (!userId) return;
    try {
      // UPSERT الثيم الشخصي
      await postJSON('user_preferences', { user_id: userId, theme_key: key, updated_at: new Date().toISOString() }, 'POST');
    } catch (e) { /* silent */ }
  }

  // ============================================================
  // النافذة المنبثقة للثيمات الخاصة
  // ============================================================
  function buildPopupContainer() {
    const overlay = document.createElement('div');
    overlay.id = 'theme-popup-overlay';
    overlay.innerHTML = `
      <div id="theme-popup-box">
        <span id="theme-popup-icon"></span>
        <div id="theme-popup-title"></div>
        <div id="theme-popup-text"></div>
        <button id="theme-popup-close" onclick="PlatformTheme.closePopup()">حسناً ✓</button>
      </div>`;
    document.body.appendChild(overlay);
  }

  function showSpecialPopup(themeKey) {
    const data = SPECIAL_POPUPS[themeKey];
    if (!data) return;

    // تحقق: هل رأت المستخدمة هذا الإشعار اليوم؟
    const seenKey = `theme_popup_seen_${themeKey}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(seenKey)) return;
    sessionStorage.setItem(seenKey, '1');

    const icon   = document.getElementById('theme-popup-icon');
    const title  = document.getElementById('theme-popup-title');
    const text   = document.getElementById('theme-popup-text');
    const overlay= document.getElementById('theme-popup-overlay');

    if (!overlay) return;

    icon.textContent = data.icon;
    title.textContent = data.title;

    let html = '';
    data.items.forEach(item => {
      const color = item.type === 'quran'   ? '#7c3aed'
                  : item.type === 'hadith'  ? '#0369a1'
                  : item.type === 'thikr'   ? '#059669'
                  : item.type === 'warning' ? '#dc2626'
                  : '#1e293b';
      html += `<p style="margin:8px 0; color:${color}; font-size:0.95rem; line-height:1.7;">
                 ${item.text}
                 ${item.ref ? `<br><small style="color:#94a3b8; font-size:0.78rem;">${item.ref}</small>` : ''}
               </p>`;
    });
    text.innerHTML = html;
    overlay.classList.add('show');
  }

  function closePopup() {
    const overlay = document.getElementById('theme-popup-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  // ============================================================
  // شريط الثيم العلوي
  // ============================================================
  function buildBanner() {
    const banner = document.createElement('div');
    banner.id = 'theme-banner';
    const info = THEMES[specialTheme];
    if (info) banner.textContent = `${info.icon} ${info.label}`;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ============================================================
  // مساعدة: جلب معرف المستخدم
  // ============================================================
  function getUserId() {
    // يقرأ من meta tag أو window.currentUser
    const meta = document.querySelector('meta[name="user-id"]');
    if (meta) return meta.content;
    if (window.currentUser?.id) return window.currentUser.id;
    return null;
  }

  // ============================================================
  // تهيئة رئيسية
  // ============================================================
  async function init() {
    await loadThemes();
    applyTheme(currentTheme);
    buildBanner();
    buildPopupContainer();
    buildPicker();
    if (specialTheme) showSpecialPopup(specialTheme);
  }

  // ============================================================
  // API العام
  // ============================================================
  return {
    init,
    applyTheme,
    closePopup,
    getCurrentTheme: () => currentTheme,
    getSpecialTheme: () => specialTheme,
    THEMES,
  };

})();

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => PlatformTheme.init());
