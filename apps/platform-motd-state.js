/**
 * ═══════════════════════════════════════════════════════════════
 *  platform-motd-state.js  v1.0
 *  تمديد platform-motd.js — محتوى مشروط حسب حالة المنصة
 *  © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 *
 *  يُضاف بعد platform-motd.js + platform-state.js
 *  يُحدِّث محتوى MOTD تلقائياً حسب الحالة
 * ═══════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  // ── محتوى مخصص لكل حالة ────────────────────────────────────

  const STATE_MOTD = {

    ramadan: [
      { type:'quran', text:'﴿ شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ ﴾',
        ref:'سورة البقرة: ١٨٥',
        textEn:'"Ramadan is the month in which the Quran was revealed as guidance for mankind."',
        refEn:'Surah Al-Baqarah (2:185) — Saheeh International' },
      { type:'dhikr', text:'اللهمَّ إنَّكَ عفوٌّ تحبُّ العفوَ فاعفُ عنِّي',
        ref:'دعاء رمضان المأثور',
        textEn:'"O Allah, You are the Pardoner and You love pardoning, so pardon me."',
        refEn:'Narrated by At-Tirmidhi (3513) — Authenticated' },
      { type:'hadith', text:'« مَن صامَ رمضانَ إيمانًا واحتسابًا غُفِرَ له ما تقدَّم من ذنبه »',
        ref:'رواه البخاري ومسلم',
        textEn:'"Whoever fasts Ramadan with faith and seeking reward, his past sins are forgiven."',
        refEn:'Al-Bukhari (38) & Muslim (760)' },
      { type:'dhikr', text:'سبحانَ اللهِ وبحمدِه سبحانَ اللهِ العظيم — تسبيحة رمضان',
        ref:'ذكر اليوم',
        textEn:'"Glory be to Allah and His praise; Glory be to Allah the Magnificent."',
        refEn:'Morning & Evening remembrance — Al-Bukhari' },
      { type:'wisdom', text:'رمضانُ مدرسةُ الروح، من تعلَّمَ فيها أفادَ طولَ العام',
        ref:'حكمة إسلامية',
        textEn:'"Ramadan is the school of the soul — whoever learns in it benefits the whole year."',
        refEn:'Islamic Wisdom' },
    ],

    exam_period: [
      { type:'quran', text:'﴿ وَعَلَّمَكَ مَا لَمْم تَكُن تَعْلَمُ ۚ وَكَانَ فَضْلُ اللَّهِ عَلَيْكَ عَظِيمًا ﴾',
        ref:'سورة النساء: ١١٣',
        textEn:'"And He taught you what you did not know. And ever has the favor of Allah upon you been great."',
        refEn:'Surah An-Nisa (4:113) — Saheeh International' },
      { type:'dhikr', text:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي',
        ref:'سورة طه: ٢٥–٢٨',
        textEn:'"My Lord, expand my breast, ease my task, untie my tongue so they may understand my speech."',
        refEn:'Surah Ta-Ha (20:25–28) — Saheeh International' },
      { type:'hadith', text:'« ما أصابَ المسلمَ من نصَبٍ ولا وصَبٍ ولا همٍّ ولا حزنٍ ولا أذى ولا غمٍّ، حتى الشوكةِ يُشاكُها، إلا كفَّرَ اللهُ بها من خطاياه »',
        ref:'رواه البخاري ومسلم',
        textEn:'"No fatigue, illness, worry, grief, harm or sadness befalls a Muslim, even a thorn — but Allah expiates some of his sins thereby."',
        refEn:'Al-Bukhari (5641) & Muslim (2573)' },
      { type:'dhikr', text:'اللهمَّ لا سهلَ إلا ما جعلتَه سهلًا، وأنتَ تجعلُ الحزنَ إذا شئتَ سهلًا',
        ref:'دعاء التيسير',
        textEn:'"O Allah, nothing is easy except what You make easy, and You make difficulty easy when You will."',
        refEn:'Ibn Hibban — Authenticated' },
      { type:'wisdom', text:'الامتحانُ ليسَ نهايةَ الطريق، بل هو خطوةٌ في الرحلة. استعن بالله وتوكَّل عليه.',
        ref:'تذكير تربوي',
        textEn:'"An exam is not the end of the road, but a step in the journey. Seek Allah\'s help and trust in Him."',
        refEn:'Educational Reminder' },
    ],

    holiday_religious: [
      { type:'quran', text:'﴿ وَلِتُكْمِلُوا الْعِدَّةَ وَلِتُكَبِّرُوا اللَّهَ عَلَىٰ مَا هَدَاكُمْ وَلَعَلَّكُمْ تَشْكُرُونَ ﴾',
        ref:'سورة البقرة: ١٨٥',
        textEn:'"So that you complete the period and magnify Allah for having guided you, that you may be grateful."',
        refEn:'Surah Al-Baqarah (2:185) — Saheeh International' },
      { type:'dhikr', text:'اللهُ أكبرُ اللهُ أكبر، لا إلهَ إلا الله، اللهُ أكبرُ اللهُ أكبر، وللهِ الحمد',
        ref:'تكبيرات العيد',
        textEn:'"Allah is the Greatest, Allah is the Greatest. There is no god but Allah. Allah is the Greatest, Allah is the Greatest, and all praise is for Allah."',
        refEn:'Eid Takbeer — Established Sunnah' },
      { type:'wisdom', text:'العيدُ فرحةٌ بإتمامِ العبادة، لا بمجرَّدِ الراحة. كلُّ من أتقنَ عملَه استحقَّ فرحتَه.',
        ref:'حكمة إسلامية',
        textEn:'"Eid is joy at completing worship, not merely rest. Whoever excels in their work deserves their joy."',
        refEn:'Islamic Wisdom' },
    ],

    emergency_closure: [
      { type:'quran', text:'﴿ وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ﴾',
        ref:'سورة الطلاق: ٢',
        textEn:'"And whoever fears Allah — He will make for him a way out."',
        refEn:'Surah At-Talaq (65:2) — Saheeh International' },
      { type:'dhikr', text:'حسبُنا اللهُ ونعمَ الوكيل',
        ref:'دعاء عند الشدة',
        textEn:'"Allah is sufficient for us, and He is the best Disposer of affairs."',
        refEn:'Surah Al-Imran (3:173) — Supplication in difficulty' },
      { type:'wisdom', text:'السلامةُ أولاً. المنصةُ هنا لمساعدتك في التعلم عن بُعد عند الحاجة.',
        ref:'تنبيه إداري',
        textEn:'"Safety first. The platform is here to support remote learning when needed."',
        refEn:'Administrative Notice' },
    ],

    orientation_week: [
      { type:'quran', text:'﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾',
        ref:'سورة طه: ١١٤',
        textEn:'"And say: My Lord, increase me in knowledge."',
        refEn:'Surah Ta-Ha (20:114) — Saheeh International' },
      { type:'wisdom', text:'بدايةُ العامِ الدراسيِّ فرصةٌ ذهبية — ابدأ بنيَّةٍ صادقة ونظامٍ صارم وسيأتي النجاح.',
        ref:'حكمة تربوية',
        textEn:'"The start of the school year is a golden opportunity — begin with sincere intention, firm discipline, and success will follow."',
        refEn:'Educational Wisdom' },
      { type:'dhikr', text:'اللهمَّ بارك لنا في علمنا وعلِّمنا ما ينفعنا وانفعنا بما علَّمتنا',
        ref:'دعاء بداية العام الدراسي',
        textEn:'"O Allah, bless our knowledge, teach us what benefits us, and benefit us with what You have taught us."',
        refEn:'Supplication for the Start of the Academic Year' },
    ],

    distance_learning: [
      { type:'quran', text:'﴿ يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ﴾',
        ref:'سورة المجادلة: ١١',
        textEn:'"Allah will raise those who have believed among you and those who were given knowledge, by degrees."',
        refEn:'Surah Al-Mujadila (58:11) — Saheeh International' },
      { type:'wisdom', text:'التعلُّمُ لا يتوقَّفُ بأيِّ ظرف. المنصةُ في يدك — تعلَّم من حيثُ أنت.',
        ref:'تذكير',
        textEn:'"Learning does not stop under any circumstance. The platform is in your hands — learn from where you are."',
        refEn:'Platform Reminder' },
    ],

  };

  // ── تحديث MOTD بناءً على الحالة ─────────────────────────────

  function injectStateMotd(state) {
    // اختر المحتوى المناسب
    const category = state.motdCategory;
    let items = null;

    if (state.isRamadan) items = STATE_MOTD.ramadan;
    else if (state.isExam) items = STATE_MOTD.exam_period;
    else if (state.theme === 'holiday') items = STATE_MOTD.holiday_religious;
    else if (state.isEmergency) items = STATE_MOTD.emergency_closure;
    else if (state.state === 'orientation_week') items = STATE_MOTD.orientation_week;
    else if (state.state === 'distance_learning') items = STATE_MOTD.distance_learning;

    if (!items) return; // استخدم MOTD الافتراضي

    // أضف للمصفوفة الأصلية في البداية (أولوية عالية)
    if (window.MOTD_ITEMS && Array.isArray(window.MOTD_ITEMS)) {
      window.MOTD_ITEMS.unshift(...items);
    }

    // تحديث الشريط السفلي
    updateNewsTickerForState(state);
  }

  function updateNewsTickerForState(state) {
    const tickers = document.querySelectorAll('.news-ticker, .motd-ticker, #news-ticker-content');
    tickers.forEach(el => {
      if (el.dataset.stateUpdated) return;
      el.dataset.stateUpdated = 'true';
      const stateMsg = `${state.icon} ${state.labelAr} | ${state.labelEn}`;
      el.prepend(Object.assign(document.createElement('span'), {
        textContent: stateMsg,
        style: `color:${state.hubBannerColor || '#f59e0b'};font-weight:700;margin-left:40px;`,
      }));
    });
  }

  // ── استمع لحالة المنصة ────────────────────────────────────────
  window.addEventListener('platformStateLoaded', (e) => {
    injectStateMotd(e.detail);
  });

  // إذا الحالة محملة مسبقاً
  if (window._currentPlatformState) {
    injectStateMotd(window._currentPlatformState);
  }

  window.EduOSMotdState = { STATE_MOTD, injectStateMotd };

})(window);
