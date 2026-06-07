/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS · platform-motd.js  v3.0
 *  ─────────────────────────────────────────────────────────────
 *  نظامان منفصلان:
 *  1) POPUP  — أذكار · أحاديث · حكم · شعر → منبثق يظهر/يختفي
 *  2) TICKER — أخبار الوزارة / الدولة / إداري مدرسي
 *
 *  ⚠️  قانون صارم: لا يُدرج حديث أو ذكر إلا مِن مصدر صحيح
 *      ثابت في كتب الصحاح أو المصادر المعتمدة.
 * ═══════════════════════════════════════════════════════════════
 */

/* ═══════════════════════════════════════════════════════════════
   1 ▸ المحتوى الإسلامي المحقَّق
   ─────────────────────────────────────────────────────────────
   كل مدخل: { type, text, source }
   type: 'dhikr' | 'hadith' | 'quran' | 'wisdom' | 'poem' | 'quote'
══════════════════════════════════════════════════════════════ */
const EDOOS_CONTENT = [

  // ── أذكار الصباح (ثابتة بالسنة) ─────────────────────────────
  {
    type: 'dhikr',
    label: '🤲 ذكر الصباح',
    text: '«أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ»',
    source: 'صحيح مسلم'
  },
  {
    type: 'dhikr',
    label: '🤲 ذكر الصباح',
    text: '«اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ»',
    source: 'سنن أبي داود — حسن'
  },
  {
    type: 'dhikr',
    label: '🤲 ذكر',
    text: '«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ»',
    source: 'متفق عليه — كلمتان خفيفتان على اللسان ثقيلتان في الميزان'
  },
  {
    type: 'dhikr',
    label: '🤲 دعاء',
    text: '«اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعِلْمَ النَّافِعَ، وَالرِّزْقَ الطَّيِّبَ، وَالْعَمَلَ الْمُتَقَبَّلَ»',
    source: 'سنن ابن ماجه — صحيح'
  },
  {
    type: 'dhikr',
    label: '🤲 ذكر',
    text: '«حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ» — سبعاً',
    source: 'سنن أبي داود — صحيح الإسناد'
  },

  // ── آيات قرآنية ──────────────────────────────────────────────
  {
    type: 'quran',
    label: '📖 آية كريمة',
    text: '﴿وَقُل رَّبِّ زِدۡنِي عِلۡمٗا﴾',
    source: 'سورة طه — الآية 114'
  },
  {
    type: 'quran',
    label: '📖 آية كريمة',
    text: '﴿يَرۡفَعِ ٱللَّهُ ٱلَّذِينَ ءَامَنُواْ مِنكُمۡ وَٱلَّذِينَ أُوتُواْ ٱلۡعِلۡمَ دَرَجَٰتٖۚ﴾',
    source: 'سورة المجادلة — الآية 11'
  },
  {
    type: 'quran',
    label: '📖 آية كريمة',
    text: '﴿وَعَلَّمَكَ مَا لَمۡ تَكُن تَعۡلَمُۚ وَكَانَ فَضۡلُ ٱللَّهِ عَلَيۡكَ عَظِيمٗا﴾',
    source: 'سورة النساء — الآية 113'
  },
  {
    type: 'quran',
    label: '📖 آية كريمة',
    text: '﴿فَإِذَا عَزَمۡتَ فَتَوَكَّلۡ عَلَى ٱللَّهِۚ إِنَّ ٱللَّهَ يُحِبُّ ٱلۡمُتَوَكِّلِينَ﴾',
    source: 'سورة آل عمران — الآية 159'
  },
  {
    type: 'quran',
    label: '📖 آية كريمة',
    text: '﴿إِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرٗا﴾',
    source: 'سورة الشرح — الآية 6'
  },

  // ── أحاديث نبوية شريفة (صحيحة) ─────────────────────────────
  {
    type: 'hadith',
    label: '🕌 حديث شريف',
    text: '«مَنْ سَلَكَ طَرِيقاً يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»',
    source: 'صحيح مسلم — عن أبي هريرة رضي الله عنه'
  },
  {
    type: 'hadith',
    label: '🕌 حديث شريف',
    text: '«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»',
    source: 'صحيح البخاري — عن عثمان رضي الله عنه'
  },
  {
    type: 'hadith',
    label: '🕌 حديث شريف',
    text: '«إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ»',
    source: 'صحيح الجامع — الألباني — عن عائشة رضي الله عنها'
  },
  {
    type: 'hadith',
    label: '🕌 حديث شريف',
    text: '«الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ»',
    source: 'صحيح مسلم — عن أبي هريرة رضي الله عنه'
  },
  {
    type: 'hadith',
    label: '🕌 حديث شريف',
    text: '«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»',
    source: 'متفق عليه — عن عمر بن الخطاب رضي الله عنه'
  },
  {
    type: 'hadith',
    label: '🕌 حديث شريف',
    text: '«أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ»',
    source: 'متفق عليه — عن عائشة رضي الله عنها'
  },
  {
    type: 'hadith',
    label: '🕌 حديث شريف',
    text: '«الدِّينُ النَّصِيحَةُ» قِيلَ: لِمَنْ يَا رَسُولَ اللَّهِ؟ قَالَ: «لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ»',
    source: 'صحيح مسلم — عن تميم الداري رضي الله عنه'
  },

  // ── حكم العلماء والأئمة ─────────────────────────────────────
  {
    type: 'wisdom',
    label: '💡 حكمة',
    text: '«الوَقْتُ كَالسَّيْفِ إِنْ لَمْ تَقْطَعْهُ قَطَعَكَ»',
    source: 'الإمام الشافعي رحمه الله'
  },
  {
    type: 'wisdom',
    label: '💡 حكمة',
    text: '«تَعَلَّمُوا الْعِلْمَ فَإِنَّ تَعَلُّمَهُ لِلَّهِ خَشْيَةٌ، وَطَلَبَهُ عِبَادَةٌ، وَمُذَاكَرَتَهُ تَسْبِيحٌ، وَالْبَحْثَ عَنْهُ جِهَادٌ»',
    source: 'معاذ بن جبل رضي الله عنه'
  },
  {
    type: 'wisdom',
    label: '💡 حكمة',
    text: '«إِنَّكَ لَنْ تَتْرُكَ شَيْئًا لِلَّهِ عَزَّ وَجَلَّ إِلَّا أَبْدَلَكَ اللَّهُ بِهِ مَا هُوَ خَيْرٌ لَكَ مِنْهُ»',
    source: 'الإمام أحمد بن حنبل رحمه الله'
  },
  {
    type: 'wisdom',
    label: '💡 حكمة',
    text: '«مَنْ عَرَفَ نَفْسَهُ أَشْغَلَهُ ذَلِكَ عَنْ عَيْبِ غَيْرِهِ»',
    source: 'الإمام ابن القيم الجوزية رحمه الله — مدارج السالكين'
  },
  {
    type: 'wisdom',
    label: '💡 حكمة',
    text: '«اجْعَلْ عَمَلَكَ كُلَّهُ لِلَّهِ، وَلَا تَطْلُبْ مِنَ النَّاسِ الْجَزَاءَ فَإِنَّهُمْ لَا يَمْلِكُونَهُ»',
    source: 'الإمام ابن تيمية رحمه الله'
  },
  {
    type: 'wisdom',
    label: '💡 حكمة',
    text: '«الْعِلْمُ نُورٌ، وَنُورُ اللَّهِ لَا يُهْدَى لِعَاصٍ»',
    source: 'الإمام الشافعي رحمه الله — منسوب إليه في مناقبه'
  },
  {
    type: 'wisdom',
    label: '💡 حكمة',
    text: '«التَّعْلِيمُ فِي الصِّغَرِ كَالنَّقْشِ عَلَى الْحَجَرِ»',
    source: 'الحسن البصري رحمه الله'
  },

  // ── أقوال حكام وعلماء المسلمين ──────────────────────────────
  {
    type: 'quote',
    label: '👑 قول مأثور',
    text: '«دَوَاءُ الْجَهْلِ السُّؤَالُ»',
    source: 'الإمام علي بن أبي طالب رضي الله عنه'
  },
  {
    type: 'quote',
    label: '👑 قول مأثور',
    text: '«اعْقِلْهَا وَتَوَكَّلْ»',
    source: 'النبي ﷺ — سنن الترمذي — حسن'
  },
  {
    type: 'quote',
    label: '👑 قول مأثور',
    text: '«كَلِمَةُ الْحِكْمَةِ ضَالَّةُ الْمُؤْمِنِ فَحَيْثُ وَجَدَهَا فَهُوَ أَحَقُّ بِهَا»',
    source: 'سنن الترمذي — عن أبي هريرة رضي الله عنه'
  },
  {
    type: 'quote',
    label: '👑 قول مأثور',
    text: '«مَنْ أَرَادَ الدُّنْيَا فَعَلَيْهِ بِالْعِلْمِ، وَمَنْ أَرَادَ الآخِرَةَ فَعَلَيْهِ بِالْعِلْمِ»',
    source: 'الإمام الشافعي رحمه الله'
  },

  // ── شعر عربي إسلامي ─────────────────────────────────────────
  {
    type: 'poem',
    label: '📜 بيت شعر',
    text: 'أَلَا إِنَّ العِلْمَ حَيَاةُ الْقُلُوبِ\nكَمَا يُحْيِي الْغَيْثُ الأَرْضَ الجَدِيبَهْ',
    source: 'أبو العتاهية — شاعر إسلامي'
  },
  {
    type: 'poem',
    label: '📜 بيت شعر',
    text: 'وَفِي الجَهْلِ قَبْلَ الْمَوْتِ مَوْتٌ لِأَهْلِهِ\nوَأَجْسَادُهُمْ قَبْلَ الْقُبُورِ قُبُورُ',
    source: 'أبو الطيب المتنبي'
  },
  {
    type: 'poem',
    label: '📜 بيت شعر',
    text: 'وَإِذَا كَانَتِ النُّفُوسُ كِبَاراً\nتَعِبَتْ فِي مُرَادِهَا الأَجْسَامُ',
    source: 'أبو الطيب المتنبي'
  },
  {
    type: 'poem',
    label: '📜 بيت شعر',
    text: 'وَمَا الْمَرْءُ إِلَّا بِأَصْغَرَيْهِ قَلْبِهِ\nوَلِسَانِهِ فَانْظُرْ بِمَ تَنْطِقُ وَتَفْعَلُ',
    source: 'الإمام علي رضي الله عنه — منسوب إليه في الأدب الإسلامي'
  }
];

/* ═══════════════════════════════════════════════════════════════
   2 ▸ جدول الاختبارات الرسمية (الفصل الثالث 2026)
══════════════════════════════════════════════════════════════ */
const EXAM_SCHEDULE = [
  { date: '2026-06-14', name: 'اختبار الفصل الثالث — المواد الأساسية', grade: 'كل المراحل' },
  { date: '2026-06-21', name: 'اختبار الفصل الثالث — المواد المساندة', grade: 'كل المراحل' },
  { date: '2026-06-28', name: 'اختبار التحصيلي الختامي — الفصل الثالث', grade: 'كل المراحل' },
  { date: '2026-07-03', name: 'آخر يوم دراسي — حفل التخرج', grade: 'كل المراحل' }
];

/* ═══════════════════════════════════════════════════════════════
   3 ▸ شريط الأخبار (Ticker)
   ─────────────────────────────────────────────────────────────
   type: 'ministry' | 'state' | 'school'
   from / to: نطاق العرض بالتاريخ (YYYY-MM-DD) — فارغ = دائم
   duration: ثواني مكوث في الشريط لهذا الخبر (افتراضي 8)
══════════════════════════════════════════════════════════════ */
const NEWS_TICKER = [
  {
    type: 'ministry',
    icon: '📋',
    text: 'وزارة التعليم: بدء الفصل الدراسي الثالث — 30 مارس 2026',
    from: '2026-03-30', to: '2026-04-10',
    duration: 8
  },
  {
    type: 'school',
    icon: '🏫',
    text: 'إداري: الاجتماع الدوري للمعلمات — الأحد القادم الساعة 12:00',
    from: '2026-06-06', to: '2026-06-12',
    duration: 10
  },
  {
    type: 'state',
    icon: '🇸🇦',
    text: 'إجازة عيد الأضحى المبارك: 25 – 29 مايو 2026',
    from: '2026-05-18', to: '2026-05-25',
    duration: 8
  }
];

/* ═══════════════════════════════════════════════════════════════
   4 ▸ منطق الإدارة الزمنية
══════════════════════════════════════════════════════════════ */
const EduMOTD = (() => {
  let _popupTimer   = null;
  let _tickerIndex  = 0;
  let _tickerTimer  = null;
  let _contentIndex = 0;
  let _popupDelay   = 60000; // الفترة بين النوافذ (60 ثانية)

  /* ── اختر محتوى اليوم بشكل منتظم ────────────────────────── */
  function _getDailyContent() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    return EDOOS_CONTENT[dayOfYear % EDOOS_CONTENT.length];
  }

  /* ── إنشاء نافذة منبثقة ──────────────────────────────────── */
  function _buildPopup(item, isExam = false) {
    const el = document.createElement('div');
    el.id = 'edumotd-popup';

    const typeColors = {
      dhikr:  { bg: '#0d4f3c', border: '#10b981', accent: '#6ee7b7' },
      quran:  { bg: '#1e3a5f', border: '#3b82f6', accent: '#93c5fd' },
      hadith: { bg: '#3b1f5e', border: '#8b5cf6', accent: '#c4b5fd' },
      wisdom: { bg: '#7c2d12', border: '#f97316', accent: '#fdba74' },
      poem:   { bg: '#134e4a', border: '#14b8a6', accent: '#99f6e4' },
      quote:  { bg: '#1e3a2b', border: '#22c55e', accent: '#86efac' },
      exam:   { bg: '#7f1d1d', border: '#ef4444', accent: '#fca5a5' }
    };

    const c = isExam ? typeColors.exam : (typeColors[item.type] || typeColors.wisdom);

    el.style.cssText = `
      position: fixed;
      bottom: 52px;
      right: 28px;
      z-index: 99999;
      max-width: 400px;
      min-width: 300px;
      background: ${c.bg};
      border: 2px solid ${c.border};
      border-radius: 16px;
      padding: 20px 22px;
      box-shadow: 0 8px 40px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06);
      direction: rtl;
      font-family: 'Tajawal', 'Cairo', sans-serif;
      opacity: 0;
      transform: translateY(20px) scale(.97);
      transition: opacity .45s cubic-bezier(.4,0,.2,1),
                  transform .45s cubic-bezier(.4,0,.2,1);
      cursor: pointer;
    `;

    const labelHtml = isExam
      ? `<div style="font-size:11px;color:#fca5a5;letter-spacing:.5px;margin-bottom:8px;font-weight:700">⏰ تنبيه اختبار</div>`
      : `<div style="font-size:11px;color:${c.accent};letter-spacing:.5px;margin-bottom:8px;font-weight:700">${item.label}</div>`;

    const bodyText = (item.text || '').replace(/\n/g, '<br>');

    el.innerHTML = `
      ${labelHtml}
      <div style="font-size:15.5px;color:#f8fafc;line-height:1.85;font-weight:500">${bodyText}</div>
      <div style="font-size:11.5px;color:${c.accent};margin-top:10px;opacity:.85">— ${item.source}</div>
      <div style="position:absolute;top:10px;left:12px;font-size:11px;color:rgba(255,255,255,.35);cursor:pointer"
           onclick="EduMOTD.closePopup()">✕</div>
      <div id="edumotd-progress" style="
        position:absolute;bottom:0;left:0;height:3px;
        background:${c.border};border-radius:0 0 14px 14px;
        width:100%;transition:width linear;
      "></div>
    `;

    el.addEventListener('click', () => EduMOTD.closePopup());
    return el;
  }

  /* ── اختبارات قادمة? ─────────────────────────────────────── */
  function _getUpcomingExam() {
    const now = new Date();
    for (const ex of EXAM_SCHEDULE) {
      const d = new Date(ex.date);
      const diff = Math.ceil((d - now) / 86400000);
      if (diff >= 0 && diff <= 3) {
        return {
          type: 'exam',
          label: '⏰ تنبيه اختبار',
          text: diff === 0
            ? `🔴 اليوم: ${ex.name} — ${ex.grade}`
            : `بعد ${diff} ${diff === 1 ? 'يوم' : 'أيام'}: ${ex.name}`,
          source: ex.grade
        };
      }
    }
    return null;
  }

  /* ── عرض نافذة ───────────────────────────────────────────── */
  function showPopup() {
    if (!document.body) return;
    EduMOTD.closePopup(true); // أغلق القديمة فوراً

    const examItem = _getUpcomingExam();
    const isExam   = !!examItem;
    const item     = isExam ? examItem : EDOOS_CONTENT[_contentIndex % EDOOS_CONTENT.length];
    _contentIndex++;

    const popup = _buildPopup(item, isExam);
    document.body.appendChild(popup);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0) scale(1)';
      });
    });

    // Progress bar
    const dur = isExam ? 9000 : 8000; // 8–9 ثانية
    const bar = popup.querySelector('#edumotd-progress');
    if (bar) {
      bar.style.transition = `width ${dur}ms linear`;
      requestAnimationFrame(() => { bar.style.width = '0%'; });
    }

    // Auto close
    _popupTimer = setTimeout(() => EduMOTD.closePopup(), dur);
  }

  /* ── إغلاق النافذة ───────────────────────────────────────── */
  function closePopup(instant = false) {
    clearTimeout(_popupTimer);
    const el = document.getElementById('edumotd-popup');
    if (!el) return;
    if (instant) {
      el.remove();
      return;
    }
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px) scale(.97)';
    setTimeout(() => el && el.remove(), 480);
  }

  /* ── شريط الأخبار ────────────────────────────────────────── */
  function _buildTicker() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const active = NEWS_TICKER.filter(n => {
      const fromOk = !n.from || n.from <= dateStr;
      const toOk   = !n.to   || n.to   >= dateStr;
      return fromOk && toOk;
    });

    if (active.length === 0) return;

    const tickerEl = document.getElementById('edumotd-ticker');
    if (!tickerEl) return;

    const typeStyle = {
      ministry: { bg: 'linear-gradient(90deg,#1e3a5f,#1e40af)', badge: '#3b82f6', label: 'وزارة' },
      state:    { bg: 'linear-gradient(90deg,#1a2e1a,#166534)', badge: '#22c55e', label: 'رسمي' },
      school:   { bg: 'linear-gradient(90deg,#3b1f0a,#92400e)', badge: '#f59e0b', label: 'إداري' }
    };

    function showNext() {
      const n = active[_tickerIndex % active.length];
      const s = typeStyle[n.type] || typeStyle.school;
      tickerEl.style.background = s.bg;

      tickerEl.innerHTML = `
        <span style="background:${s.badge};color:#fff;font-size:10px;padding:2px 8px;
              border-radius:20px;margin-left:10px;font-weight:700;letter-spacing:.5px">${s.badge === '#22c55e' ? '🇸🇦' : n.icon} ${s.label}</span>
        <span style="font-size:13.5px;font-weight:500;color:#f1f5f9">${n.text}</span>
      `;
      tickerEl.style.opacity = '1';
      tickerEl.style.transform = 'translateY(0)';

      const dur = (n.duration || 8) * 1000;
      _tickerTimer = setTimeout(() => {
        tickerEl.style.opacity = '0';
        tickerEl.style.transform = 'translateY(8px)';
        setTimeout(() => {
          _tickerIndex++;
          showNext();
        }, 400);
      }, dur);
    }

    tickerEl.style.opacity = '0';
    tickerEl.style.transform = 'translateY(8px)';
    tickerEl.style.transition = 'opacity .4s, transform .4s';
    showNext();
  }

  /* ── تهيئة شريط الأخبار في DOM ──────────────────────────── */
  function _injectTickerDOM() {
    if (document.getElementById('edumotd-ticker')) return;

    const ticker = document.createElement('div');
    ticker.id = 'edumotd-ticker';
    ticker.style.cssText = `
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 99998;
      padding: 7px 24px;
      display: flex;
      align-items: center;
      direction: rtl;
      font-family: 'Tajawal','Cairo',sans-serif;
      min-height: 42px;
      background: linear-gradient(90deg,#0f172a,#1e3a5f);
      box-shadow: 0 -2px 12px rgba(0,0,0,.35);
    `;
    document.body.appendChild(ticker);
    _buildTicker();
  }

  /* ── init ────────────────────────────────────────────────── */
  function init(opts = {}) {
    const delay   = opts.firstDelay  ?? 8000;   // أول نافذة بعد 8 ثوان
    const between = opts.betweenDelay ?? 60000; // كل دقيقة
    _popupDelay = between;

    function scheduleNext() {
      showPopup();
      _popupTimer = setTimeout(scheduleNext, between);
    }

    setTimeout(scheduleNext, delay);
    _injectTickerDOM();
  }

  /* ── API عامة ─────────────────────────────────────────────── */
  function addNews(item) {
    NEWS_TICKER.push(item);
  }

  return { init, showPopup, closePopup, addNews };
})();

/* ═══════════════════════════════════════════════════════════════
   5 ▸ تشغيل تلقائي عند تحميل الصفحة
══════════════════════════════════════════════════════════════ */
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EduMOTD.init());
  } else {
    EduMOTD.init();
  }
}
