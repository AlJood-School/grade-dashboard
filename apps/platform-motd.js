/**
 * ═══════════════════════════════════════════════════════════
 *  EduOS Platform MOTD  v5  — Bilingual (AR/EN)
 *  ─────────────────────────────────────────────────────────
 *  ① أذكار / آيات / أحاديث → تظهر في مركز الشاشة
 *     بتأثير ضبابي هادئ (backdrop blur + fade) — 8 ثوانٍ
 *  ② شريط أخبار إداري/وزاري → أسفل الشاشة مثل التلفاز
 *  ③ تذكير التنفس والحركة → بعد 30 دقيقة نشاط
 *
 *  ترجمات القرآن: Saheeh International (معتمدة دولياً)
 *  ترجمات الأحاديث: sunnah.com (موثَّقة)
 *  النص العربي الأصلي يظهر دائماً — الترجمة للفهم فقط
 * ═══════════════════════════════════════════════════════════
 */

/* ── محتوى إسلامي محقَّق — ثنائي اللغة ────────────────── */
const MOTD_ITEMS = [
  {
    type:'quran',
    text:'﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾',
    ref:'سورة طه: ١١٤',
    textEn:'"And say: My Lord, increase me in knowledge."',
    refEn:'Surah Ta-Ha (20:114) — Saheeh International'
  },
  {
    type:'quran',
    text:'﴿ إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ ﴾',
    ref:'سورة التوبة: ١٢٠',
    textEn:'"Indeed, Allah does not allow to be lost the reward of the doers of good."',
    refEn:'Surah At-Tawbah (9:120) — Saheeh International'
  },
  {
    type:'quran',
    text:'﴿ وَعَلَّمَكَ مَا لَمْ تَكُن تَعْلَمُ ۚ وَكَانَ فَضْلُ اللَّهِ عَلَيْكَ عَظِيمًا ﴾',
    ref:'سورة النساء: ١١٣',
    textEn:'"And He taught you that which you did not know. And ever has the favor of Allah upon you been great."',
    refEn:'Surah An-Nisa (4:113) — Saheeh International'
  },
  {
    type:'quran',
    text:'﴿ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۞ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾',
    ref:'سورة الشرح: ٥–٦',
    textEn:'"For indeed, with hardship will be ease. Indeed, with hardship will be ease."',
    refEn:'Surah Ash-Sharh (94:5–6) — Saheeh International'
  },
  {
    type:'quran',
    text:'﴿ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ ﴾',
    ref:'سورة العصر: ٣',
    textEn:'"And advised each other to truth and advised each other to patience."',
    refEn:'Surah Al-\'Asr (103:3) — Saheeh International'
  },
  {
    type:'hadith',
    text:'« مَن سَلَكَ طريقًا يلتمسُ فيه علمًا سهَّلَ اللهُ له طريقًا إلى الجنَّة »',
    ref:'رواه مسلم',
    textEn:'"Whoever travels a path seeking knowledge, Allah will make easy for him a path to Paradise."',
    refEn:'Narrated by Muslim (2699)'
  },
  {
    type:'hadith',
    text:'« خيركم مَن تعلَّم القرآنَ وعلَّمه »',
    ref:'رواه البخاري',
    textEn:'"The best of you are those who learn the Quran and teach it."',
    refEn:'Narrated by Al-Bukhari (5027)'
  },
  {
    type:'hadith',
    text:'« المؤمن القويُّ خيرٌ وأحبُّ إلى اللهِ من المؤمن الضعيف، وفي كلٍّ خير »',
    ref:'رواه مسلم',
    textEn:'"The strong believer is better and more beloved to Allah than the weak believer, though there is good in both."',
    refEn:'Narrated by Muslim (2664)'
  },
  {
    type:'hadith',
    text:'« إنَّ اللهَ يُحبُّ إذا عَمِلَ أحدُكم عملاً أن يُتقِنَه »',
    ref:'رواه الطبراني — حسن',
    textEn:'"Indeed, Allah loves that when one of you performs a deed, they do it with excellence."',
    refEn:'Al-Tabarani — Hasan (authenticated)'
  },
  {
    type:'dhikr',
    text:'سبحانَ اللهِ وبحمدِه، سبحانَ اللهِ العظيم',
    ref:'ذكر صباحي ومسائي',
    textEn:'"Glory be to Allah and His praise; Glory be to Allah the Magnificent."\n(Meaning of the morning & evening remembrance)',
    refEn:'Morning & Evening Remembrance — Al-Bukhari & Muslim'
  },
  {
    type:'dhikr',
    text:'اللَّهمَّ إنِّي أسألُكَ علمًا نافعًا، ورزقًا طيِّبًا، وعملاً مُتقبَّلاً',
    ref:'دعاء صباح',
    textEn:'"O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds."\n(Morning supplication)',
    refEn:'Narrated by Ibn Majah (925) — Authenticated'
  },
  {
    type:'dhikr',
    text:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    ref:'سورة طه: ٢٥–٢٦',
    textEn:'"My Lord, expand for me my breast and ease for me my task."',
    refEn:'Surah Ta-Ha (20:25–26) — Saheeh International'
  },
  {
    type:'wisdom',
    text:'العلمُ نورٌ يهدي صاحبَه، والجهلُ ظلامٌ يُضلُّ مَن وقعَ فيه',
    ref:'الإمام الشافعي',
    textEn:'"Knowledge is a light that guides its bearer; ignorance is a darkness that leads astray those who fall into it."',
    refEn:'Imam Al-Shafi\'i (767–820 CE)'
  },
  {
    type:'wisdom',
    text:'لن ترتقيَ الأممُ إلَّا بتربيةِ أبنائها تربيةً صالحة',
    ref:'الشيخ محمد الغزالي',
    textEn:'"Nations cannot rise except through the righteous upbringing of their children."',
    refEn:'Sheikh Muhammad Al-Ghazali (1917–1996)'
  },
  {
    type:'wisdom',
    text:'المعلِّمُ الحقيقيُّ مَن يُشعلُ في قلبِ الطالبِ شوقًا لا ينطفئ',
    ref:'حكمة تربوية',
    textEn:'"The true teacher is one who ignites in the student\'s heart a longing that never extinguishes."',
    refEn:'Educational Wisdom'
  },
  {
    type:'poetry',
    text:'إنَّ المعلِّمَ والطبيبَ كلاهُما\nلا ينصحانِ إذا هُمَا لم يُكرَما',
    ref:'أحمد شوقي',
    textEn:'"The teacher and the doctor alike —\nneither shall give sincere counsel if they are not honored."',
    refEn:'Ahmad Shawqi — Prince of Poets (1868–1932)'
  },
  {
    type:'poetry',
    text:'قُم للمعلِّمِ وَفِّهِ التبجيلا\nكادَ المعلِّمُ أن يكونَ رسولا',
    ref:'أحمد شوقي',
    textEn:'"Rise and honor the teacher with full reverence —\nfor the teacher is nearly a messenger."',
    refEn:'Ahmad Shawqi — Prince of Poets (1868–1932)'
  },
];

/* ── ألوان النوع — ثنائي اللغة ──────────────────────────── */
const TYPE_META = {
  quran:   { icon:'📖', label:'آية كريمة',  labelEn:'Quranic Verse',        color:'#10b981', glow:'rgba(16,185,129,0.25)' },
  hadith:  { icon:'🕌', label:'حديث شريف', labelEn:'Noble Hadith',          color:'#6366f1', glow:'rgba(99,102,241,0.25)' },
  dhikr:   { icon:'🤲', label:'ذكر ودعاء', labelEn:'Remembrance & Prayer',  color:'#f59e0b', glow:'rgba(245,158,11,0.25)' },
  wisdom:  { icon:'💡', label:'حكمة',       labelEn:'Wisdom',                color:'#0ea5e9', glow:'rgba(14,165,233,0.25)' },
  poetry:  { icon:'✨', label:'شعر',         labelEn:'Poetry',               color:'#ec4899', glow:'rgba(236,72,153,0.25)' },
};

/* ── نوافذ أذكار مركزية ──────────────────────────────────── */
(function initMOTDPopups() {
  let idx = Math.floor(Math.random() * MOTD_ITEMS.length);
  let overlay = null;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'edu-motd-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:88000;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0);
      backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);
      transition:background .5s ease,backdrop-filter .5s ease,-webkit-backdrop-filter .5s ease;
      pointer-events:none;
    `;
    document.body.appendChild(overlay);
  }

  function getCurrentLang() {
    // يكتشف اللغة الحالية من EduLang أو URL
    if (window.EduLang && window.EduLang.current) return window.EduLang.current;
    return new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ar';
  }

  function showNext() {
    const item = MOTD_ITEMS[idx % MOTD_ITEMS.length];
    idx++;
    const meta = TYPE_META[item.type] || TYPE_META.wisdom;
    const lang = getCurrentLang();
    const isEn = lang === 'en';

    if (!overlay) createOverlay();

    const card = document.createElement('div');
    card.style.cssText = `
      background:rgba(15,15,30,0.85);
      border:1px solid ${meta.color}44;
      border-radius:24px;
      padding:36px 44px;
      max-width:580px;
      width:90%;
      text-align:center;
      direction:${isEn ? 'ltr' : 'rtl'};
      font-family:'Tajawal',sans-serif;
      box-shadow:0 0 80px ${meta.glow},0 24px 64px rgba(0,0,0,.5);
      transform:scale(.88) translateY(16px);
      opacity:0;
      transition:transform .55s cubic-bezier(.34,1.56,.64,1),opacity .55s ease;
      pointer-events:none;
    `;

    if (isEn && item.textEn) {
      // وضع إنجليزي — إنجليزي فقط، لا حرف عربي واحد
      card.innerHTML = `
        <div style="font-size:42px;margin-bottom:12px;filter:drop-shadow(0 0 12px ${meta.color})">${meta.icon}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${meta.color};opacity:.9;margin-bottom:18px;text-transform:uppercase;direction:ltr">${meta.labelEn}</div>
        <div style="font-size:20px;font-weight:700;color:#fff;line-height:1.75;margin-bottom:16px;text-shadow:0 2px 12px rgba(0,0,0,.6);font-style:italic;direction:ltr">${(item.textEn||'').replace(/\n/g,'<br>')}</div>
        <div style="font-size:12px;color:${meta.color};opacity:.85;direction:ltr">${item.refEn || ''}</div>
      `;
    } else {
      // وضع عربي: العرض الكلاسيكي
      card.innerHTML = `
        <div style="font-size:42px;margin-bottom:12px;filter:drop-shadow(0 0 12px ${meta.color})">${meta.icon}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:${meta.color};opacity:.9;margin-bottom:14px;text-transform:uppercase">${meta.label}</div>
        <div style="font-size:20px;font-weight:700;color:#fff;line-height:1.75;margin-bottom:14px;text-shadow:0 2px 12px rgba(0,0,0,.6)">${item.text.replace(/\n/g,'<br>')}</div>
        <div style="font-size:12px;color:${meta.color};opacity:.8;font-style:italic">${item.ref}</div>
      `;
    }

    overlay.innerHTML = '';
    overlay.appendChild(card);
    overlay.style.background = 'rgba(0,0,0,0.45)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.webkitBackdropFilter = 'blur(12px)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'scale(1) translateY(0)';
      });
    });

    // اختفاء بعد 8.5 ثانية
    setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'scale(.94) translateY(-10px)';
      card.style.transition = 'opacity .7s ease,transform .7s ease';
      overlay.style.background = 'rgba(0,0,0,0)';
      overlay.style.backdropFilter = 'blur(0px)';
      overlay.style.webkitBackdropFilter = 'blur(0px)';
      setTimeout(() => { overlay.innerHTML = ''; }, 750);
    }, 8500);
  }

  // أول ظهور بعد 5 ثوانٍ، ثم كل دقيقتين
  setTimeout(showNext, 5000);
  setInterval(showNext, 120000);

  window.EduMOTD = window.EduMOTD || {};
  window.EduMOTD.showNow = showNext;
})();

/* ── شريط الأخبار (أسفل الشاشة) ─────────────────────────── */
(function initNewsBar() {
  // ── آخر تحديث: 16 يونيو 2026 (06:00 GMT+4) ──
  const NEWS = [
    { type:'ministry', icon:'🔴', text:'حضور مرن للطلاب 16–23 يونيو — وزارة التربية والتعليم',                           textEn:'Flexible attendance for students Jun 16–23 — Ministry of Education' },
    { type:'ministry', icon:'🔵', text:'جدول الامتحانات النهائية للصفوف 5–12 معتمد رسمياً',                               textEn:'Final exam schedule for Grades 5–12 officially approved' },
    { type:'official', icon:'🟢', text:'نهاية العام الدراسي 2025–2026: 3 يوليو 2026',                                      textEn:'End of Academic Year 2025–2026: July 3, 2026' },
    { type:'ministry', icon:'🔵', text:'التقويم الأكاديمي 2026–2027 — بداية العام الجامعي: 31 أغسطس 2026',                textEn:'Academic Calendar 2026–2027 — New year starts: August 31, 2026' },
    { type:'ai',       icon:'🤖', text:'سوق الذكاء الاصطناعي في التعليم يرتفع إلى 57 مليار دولار بحلول 2033',            textEn:'AI in Education market projected to reach $57B by 2033' },
    { type:'official', icon:'🟢', text:'الإمارات تتصدر دمج الذكاء الاصطناعي في التعليم على مستوى المنطقة',               textEn:'UAE leads AI integration in education across the region' },
    { type:'admin',    icon:'🟡', text:'تذكير: مراجعة بيانات الحضور قبل نهاية الفصل الدراسي',                            textEn:'Reminder: Review attendance records before end of term' },
    { type:'ministry', icon:'🔵', text:'برنامج تطوير المعلم المهني — التسجيل مفتوح حتى نهاية الشهر',                     textEn:'Professional Teacher Development Program — Registration open until end of month' },
  ];

  const bar = document.createElement('div');
  bar.id = 'edu-news-bar';
  bar.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:87000;
    height:36px;
    background:linear-gradient(90deg,rgba(10,10,20,.97),rgba(15,15,35,.97));
    border-top:1px solid rgba(99,102,241,.25);
    display:flex;align-items:center;overflow:hidden;
    font-family:'Tajawal',sans-serif;direction:rtl;
  `;

  const newsLang = () => (window.EduLang?.current) || (new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ar');

  const label = document.createElement('div');
  label.style.cssText = `
    flex-shrink:0;padding:0 14px;font-size:11px;font-weight:800;
    color:#6366f1;letter-spacing:1px;border-left:1px solid rgba(99,102,241,.3);
    height:100%;display:flex;align-items:center;gap:6px;white-space:nowrap;
  `;
  label.innerHTML = '📡 <span id="edu-news-label">أخبار EduOS</span>';

  const track = document.createElement('div');
  track.style.cssText = `
    flex:1;overflow:hidden;display:flex;align-items:center;height:100%;
  `;

  const ticker = document.createElement('div');
  ticker.id = 'edu-news-ticker';
  ticker.style.cssText = `
    display:flex;align-items:center;gap:48px;
    white-space:nowrap;
    animation:eduNewsTicker 45s linear infinite;
  `;

  function buildTicker(lang) {
    const isEn = lang === 'en';
    const allNews = [...NEWS, ...NEWS]; // loop
    ticker.style.direction = isEn ? 'ltr' : 'rtl';
    document.getElementById('edu-news-label') && (document.getElementById('edu-news-label').textContent = isEn ? 'EduOS News' : 'أخبار EduOS');
    ticker.innerHTML = allNews.map(n =>
      `<span style="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,.85)">
        <span>${n.icon}</span>
        <span>${isEn && n.textEn ? n.textEn : n.text}</span>
        <span style="color:rgba(99,102,241,.4);margin:0 16px">◆</span>
      </span>`
    ).join('');
  }

  buildTicker(newsLang());

  // تحديث شريط الأخبار عند تغيير اللغة
  window.addEventListener('eduos-lang-change', (e) => {
    buildTicker(e.detail?.lang || newsLang());
  });

  track.appendChild(ticker);
  bar.appendChild(label);
  bar.appendChild(track);
  document.body.appendChild(bar);

  // CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes eduNewsTicker {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
  `;
  document.head.appendChild(style);

  window.EduMOTD = window.EduMOTD || {};
  window.EduMOTD.addNews = function(item) {
    const span = document.createElement('span');
    span.style.cssText = 'display:inline-flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,.85)';
    span.innerHTML = `<span>${item.icon||'📌'}</span><span>${item.text}</span><span style="color:rgba(99,102,241,.4);margin:0 16px">◆</span>`;
    ticker.appendChild(span);
  };
})();

/* ── تذكير التنفس والحركة ────────────────────────────────── */
(function initWellnessReminder() {
  const WORK_LIMIT = 30 * 60 * 1000;   // 30 دقيقة
  const CHECK_INT  = 60 * 1000;         // فحص كل دقيقة
  const BREATHE_DURATION = 16;          // ثانية (4 دورات)

  let lastActivity = Date.now();
  let totalActive  = 0;
  let lastCheck    = Date.now();
  let breatheShown = false;

  // تتبّع النشاط
  ['mousemove','mousedown','keydown','touchstart','scroll'].forEach(ev => {
    document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive:true });
  });

  // إنشاء نافذة التذكير
  const reminderEl = document.createElement('div');
  reminderEl.id = 'edu-wellness-reminder';
  reminderEl.style.cssText = `
    position:fixed;inset:0;z-index:95000;
    display:none;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.6);backdrop-filter:blur(16px);
    font-family:'Tajawal',sans-serif;direction:rtl;
  `;
  reminderEl.innerHTML = `
    <div style="
      background:linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.15));
      border:1px solid rgba(16,185,129,0.4);
      border-radius:28px;padding:44px 52px;max-width:480px;width:92%;
      text-align:center;box-shadow:0 0 80px rgba(16,185,129,0.2),0 32px 64px rgba(0,0,0,.5);
    ">
      <div id="wellness-emoji" style="font-size:56px;margin-bottom:8px">🤸</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px">
        وقتُ الراحة والتجدد 🌿
      </div>
      <div style="font-size:14px;color:rgba(255,255,255,.7);margin-bottom:28px;line-height:1.7">
        مضى وقتٌ جيد على عملك — ذكاء جسدك يحتاج لحظة تجديد
        <br>
        <span style="font-size:12px;color:rgba(16,185,129,.8)">
          « إنَّ لجسدِكَ عليكَ حقًّا » — رواه البخاري
        </span>
      </div>

      <!-- دائرة التنفس -->
      <div id="breathe-circle" style="
        width:120px;height:120px;border-radius:50%;margin:0 auto 20px;
        background:radial-gradient(circle,rgba(16,185,129,0.5),rgba(16,185,129,0.1));
        border:2px solid rgba(16,185,129,0.6);
        display:flex;align-items:center;justify-content:center;
        font-size:15px;font-weight:700;color:#10b981;
        transition:transform 4s ease-in-out, box-shadow 4s ease-in-out;
      ">استنشق</div>
      <div id="breathe-text" style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:24px;height:20px"></div>

      <!-- أزرار الحركة -->
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:20px">
        <button onclick="EduWellness.dismiss()" style="
          background:linear-gradient(135deg,#10b981,#059669);
          border:none;border-radius:12px;padding:10px 24px;
          color:#fff;font-family:'Tajawal',sans-serif;font-size:14px;font-weight:700;cursor:pointer;
        ">✅ شكراً — متجددة!</button>
        <button onclick="EduWellness.snooze()" style="
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:10px 20px;
          color:rgba(255,255,255,.7);font-family:'Tajawal',sans-serif;font-size:13px;cursor:pointer;
        ">⏰ بعد 10 دقائق</button>
      </div>

      <div style="font-size:11px;color:rgba(255,255,255,.3)">
        تذكير ذكي يحسب نشاطك الفعلي — لجودة حياتك وطلابك 🤲
      </div>
    </div>
  `;
  document.body.appendChild(reminderEl);

  // دورة التنفس (4-4-4-4)
  const breathePhases = [
    { text:'استنشق...', duration:4, scale:1.35, shadow:'0 0 40px rgba(16,185,129,0.6)' },
    { text:'احبس...', duration:4, scale:1.35, shadow:'0 0 50px rgba(6,182,212,0.7)' },
    { text:'أخرج...', duration:4, scale:0.85, shadow:'0 0 20px rgba(16,185,129,0.2)' },
    { text:'راحة...', duration:4, scale:0.85, shadow:'0 0 15px rgba(16,185,129,0.1)' },
  ];
  let breatheInterval = null;
  let breathePhaseIdx = 0;
  let breatheCount = 0;

  function startBreathing() {
    const circle = document.getElementById('breathe-circle');
    const text   = document.getElementById('breathe-text');
    breathePhaseIdx = 0; breatheCount = 0;

    function nextPhase() {
      if (breatheCount >= BREATHE_DURATION) {
        if (circle) circle.textContent = '✅';
        if (text) text.textContent = 'أحسنت! تنفّست بشكل مثالي';
        clearInterval(breatheInterval);
        return;
      }
      const p = breathePhases[breathePhaseIdx % breathePhases.length];
      if (circle) {
        circle.textContent = p.text;
        circle.style.transform = `scale(${p.scale})`;
        circle.style.boxShadow = p.shadow;
      }
      breathePhaseIdx++;
      breatheCount += p.duration;
    }

    nextPhase();
    breatheInterval = setInterval(nextPhase, 4000);
  }

  function showReminder() {
    breatheShown = true;
    reminderEl.style.display = 'flex';
    reminderEl.style.opacity = '0';
    requestAnimationFrame(() => {
      reminderEl.style.transition = 'opacity .5s ease';
      reminderEl.style.opacity = '1';
    });
    startBreathing();
  }

  function hideReminder() {
    reminderEl.style.opacity = '0';
    setTimeout(() => { reminderEl.style.display = 'none'; }, 500);
    if (breatheInterval) clearInterval(breatheInterval);
    totalActive = 0;
    breatheShown = false;
    lastActivity = Date.now();
  }

  // فحص كل دقيقة
  setInterval(() => {
    const now = Date.now();
    const idle = now - lastActivity;
    // إذا المستخدم نشط (لم يتجاوز الخمول 2 دقيقة) → أضف للوقت الفعّال
    if (idle < 120000) {
      totalActive += now - lastCheck;
    }
    lastCheck = now;
    if (!breatheShown && totalActive >= WORK_LIMIT) {
      showReminder();
    }
  }, CHECK_INT);

  window.EduWellness = {
    dismiss: hideReminder,
    snooze: () => { hideReminder(); totalActive = -10 * 60 * 1000; /* تأخير 10 دق */ },
    getActiveTime: () => Math.round(totalActive / 60000) + ' دقيقة',
  };
})();
