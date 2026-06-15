/**
 * platform-schools-db.js — v2.0
 * قاعدة بيانات المدارس الإماراتية الشاملة
 * EduOS — NAFAS FOR ARTIFICIAL INTELLIGENCE © 2026
 *
 * نظام الترميز الداخلي:
 *   [إمارة]-[نوع]-[رقم ثلاثي]
 *   إمارة: AUH=أبوظبي مدينة | AIN=العين | DHF=الظفرة
 *          DXB=دبي | SHJ=الشارقة | AJM=عجمان
 *          UAQ=أم القيوين | RAK=رأس الخيمة | FUJ=الفجيرة
 *   نوع:   G=حكومية | P=خاصة | I=دولية | R=دينية خاصة
 *
 * الحقول:
 *   code         — الكود الداخلي الفريد لـ EduOS
 *   official_id  — الرقم الرسمي الصادر من الجهة التعليمية (eSIS/MOE/ADEK/KHDA)
 *                  اختياري — يُملأ فقط للمدارس الموثّقة رسمياً
 *   name_ar      — الاسم بالعربية
 *   name_en      — الاسم بالإنجليزية
 *   emirate      — الإمارة
 *   region       — المنطقة/المنطقة التعليمية
 *   type         — حكومية | خاصة | دولية | خاصة-دينية
 *   authority    — ADEK | MOE | KHDA | SPEA | RAK_ED | FUJ_ED | AJM_ED | UAQ_ED
 *   authority_url
 *   stages       — مصفوفة: KG | ابتدائي | متوسط | ثانوي
 *   gender       — بنين | بنات | مختلط
 *   curriculum   — MOE | IB | British | American | French | Indian | Pakistani | MOE+IB
 *   language     — عربي | إنجليزي | ثنائي
 *   area         — الحي / المنطقة الجغرافية
 *
 * ملاحظة: official_id موجود فقط للمدارس التي تم توثيق رقمها الرسمي.
 *          المدارس بدون official_id ستطلب من المدير إدخاله عند الإعداد.
 */

const SCHOOLS_DB = [

  /* ═══════════════════════════════════════════════
     أبوظبي — المدينة — حكومية (ADEK)
  ═══════════════════════════════════════════════ */
  { code:'AUH-G-001', name_ar:'مدرسة أبوظبي للتعليم الأساسي للبنين',      name_en:'Abu Dhabi Basic Education School for Boys',       emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'شارع المطار' },
  { code:'AUH-G-002', name_ar:'مدرسة أبوظبي للتعليم الأساسي للبنات',      name_en:'Abu Dhabi Basic Education School for Girls',      emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'شارع المطار' },
  { code:'AUH-G-003', name_ar:'ثانوية زايد للبنين',                        name_en:'Zayed Secondary School for Boys',                  emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AUH-G-004', name_ar:'ثانوية زايد للبنات',                        name_en:'Zayed Secondary School for Girls',                 emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AUH-G-005', name_ar:'مدرسة الشامخة للتعليم الأساسي',            name_en:'Al Shamkha Basic Education School',                emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الشامخة' },
  { code:'AUH-G-006', name_ar:'ثانوية الشامخة',                            name_en:'Al Shamkha Secondary School',                      emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'الشامخة' },
  { code:'AUH-G-007', name_ar:'مدرسة مدينة خليفة للتعليم الأساسي',       name_en:'Khalifa City Basic Education School',              emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'مدينة خليفة' },
  { code:'AUH-G-008', name_ar:'ثانوية مدينة محمد بن زايد',                name_en:'Mohamed Bin Zayed City Secondary School',          emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'MBZ City' },
  { code:'AUH-G-009', name_ar:'مدرسة بني ياس للتعليم الأساسي',           name_en:'Bani Yas Basic Education School',                  emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'بني ياس' },
  { code:'AUH-G-010', name_ar:'ثانوية بني ياس',                           name_en:'Bani Yas Secondary School',                        emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'بني ياس' },
  { code:'AUH-G-011', name_ar:'مدرسة الريف للتعليم الأساسي',              name_en:'Al Reef Basic Education School',                   emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الريف' },
  { code:'AUH-G-012', name_ar:'مدرسة الوحدة للتعليم الأساسي',            name_en:'Al Wahda Basic Education School',                  emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'الوحدة' },
  { code:'AUH-G-013', name_ar:'مدرسة الكرامة للتعليم الأساسي',           name_en:'Al Karama Basic Education School',                 emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'الكرامة' },
  { code:'AUH-G-014', name_ar:'مدرسة الظهر للتعليم الأساسي',             name_en:'Al Dhaher Basic Education School',                 emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الظهر' },
  { code:'AUH-G-015', name_ar:'ثانوية هزاع بن زايد',                     name_en:'Hazza Bin Zayed Secondary School',                 emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AUH-G-016', name_ar:'ثانوية أبوظبي للبنات',                    name_en:'Abu Dhabi Secondary School for Girls',             emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AUH-G-017', name_ar:'مدرسة شخبوط للتعليم الأساسي',             name_en:'Shakhbout Basic Education School',                 emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'شخبوط' },
  { code:'AUH-G-018', name_ar:'مدرسة الزعاب للتعليم الأساسي',            name_en:'Al Zaab Basic Education School',                   emirate:'أبوظبي', region:'أبوظبي المدينة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'الزعاب' },

  /* ═══════════════════════════════════════════════
     العين — حكومية (ADEK)
  ═══════════════════════════════════════════════ */
  { code:'AIN-G-001', name_ar:'مدرسة العين للتعليم الأساسي للبنين',       name_en:'Al Ain Basic Education School for Boys',           emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'هيلي' },
  { code:'AIN-G-002', name_ar:'مدرسة العين للتعليم الأساسي للبنات',       name_en:'Al Ain Basic Education School for Girls',          emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'هيلي' },
  { code:'AIN-G-003', name_ar:'مدرسة الجيمي للتعليم الأساسي',            name_en:'Al Jimi Basic Education School',                   emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الجيمي' },
  { code:'AIN-G-004', name_ar:'ثانوية العين للبنين',                      name_en:'Al Ain Secondary School for Boys',                 emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AIN-G-005', name_ar:'ثانوية العين للبنات',                      name_en:'Al Ain Secondary School for Girls',                emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AIN-G-006', name_ar:'مدرسة جبل حفيت للتعليم الأساسي',         name_en:'Jebel Hafeet Basic Education School',              emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'جبل حفيت' },
  { code:'AIN-G-007', name_ar:'مدرسة المساعيد للتعليم الأساسي',          name_en:'Al Masaeed Basic Education School',                emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'المساعيد' },
  { code:'AIN-G-008', name_ar:'مدرسة الخبيسي للتعليم الأساسي',           name_en:'Al Khabeesi Basic Education School',               emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الخبيسي' },
  { code:'AIN-G-009', name_ar:'مدرسة الوقيبة للتعليم الأساسي',           name_en:'Al Waqeeba Basic Education School',                emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الوقيبة' },
  { code:'AIN-G-010', name_ar:'مدرسة الشويب للتعليم الأساسي',            name_en:'Al Shuwaib Basic Education School',                emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الشويب' },
  { code:'AIN-G-011', name_ar:'مدرسة القطارة للتعليم الأساسي',           name_en:'Al Qattara Basic Education School',                emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'القطارة' },
  { code:'AIN-G-012', name_ar:'مدرسة الزاهر للتعليم الأساسي',            name_en:'Al Zaher Basic Education School',                  emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'الزاهر' },
  { code:'AIN-G-013', name_ar:'مدرسة الملقطة للتعليم الأساسي',           name_en:'Al Malaqa Basic Education School',                 emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الملقطة' },
  { code:'AIN-G-014', name_ar:'مدرسة المطارة للتعليم الأساسي',           name_en:'Al Mutarad Basic Education School',                emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'المطارة' },
  { code:'AIN-G-015', name_ar:'مدرسة الجود للتعليم الأساسي',              name_en:'Al Jood Basic Education School',                   official_id:1705, emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'هيلي' },
  { code:'AIN-G-016', name_ar:'ثانوية الجود للبنات',                      name_en:'Al Jood Secondary School for Girls',               emirate:'أبوظبي', region:'العين', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'هيلي' },

  /* ═══════════════════════════════════════════════
     الظفرة — حكومية (ADEK)
  ═══════════════════════════════════════════════ */
  { code:'DHF-G-001', name_ar:'مدرسة مدينة زايد للتعليم الأساسي',        name_en:'Madinat Zayed Basic Education School',             emirate:'أبوظبي', region:'الظفرة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'مدينة زايد' },
  { code:'DHF-G-002', name_ar:'ثانوية مدينة زايد',                        name_en:'Madinat Zayed Secondary School',                   emirate:'أبوظبي', region:'الظفرة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'مدينة زايد' },
  { code:'DHF-G-003', name_ar:'مدرسة الرويس للتعليم الأساسي',            name_en:'Al Ruwais Basic Education School',                 emirate:'أبوظبي', region:'الظفرة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الرويس' },
  { code:'DHF-G-004', name_ar:'مدرسة ليوا للتعليم الأساسي',              name_en:'Liwa Basic Education School',                     emirate:'أبوظبي', region:'الظفرة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'ليوا' },
  { code:'DHF-G-005', name_ar:'مدرسة السلع للتعليم الأساسي',             name_en:'Al Sila Basic Education School',                   emirate:'أبوظبي', region:'الظفرة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'السلع' },
  { code:'DHF-G-006', name_ar:'مدرسة غياثي للتعليم الأساسي',             name_en:'Ghayathi Basic Education School',                  emirate:'أبوظبي', region:'الظفرة', type:'حكومية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'غياثي' },

  /* ═══════════════════════════════════════════════
     أبوظبي — خاصة (ADEK)
  ═══════════════════════════════════════════════ */
  { code:'AUH-P-001', name_ar:'مدرسة أبوظبي الدولية',                    name_en:'Abu Dhabi International School',                   emirate:'أبوظبي', region:'أبوظبي المدينة', type:'خاصة', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'American', language:'إنجليزي', area:'المركز' },
  { code:'AUH-P-002', name_ar:'مدرسة ماربر الخاصة',                      name_en:'Maabar Private School',                           emirate:'أبوظبي', region:'أبوظبي المدينة', type:'خاصة', authority:'ADEK', authority_url:'adek.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'الوحدة' },
  { code:'AUH-P-003', name_ar:'مدرسة الإمارات الوطنية',                  name_en:'Emirates National School',                        emirate:'أبوظبي', region:'أبوظبي المدينة', type:'خاصة', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'American', language:'إنجليزي', area:'الكورنيش' },
  { code:'AUH-P-004', name_ar:'مدرسة بريتيش إنترناشيونال',              name_en:'British International School Abu Dhabi',           emirate:'أبوظبي', region:'أبوظبي المدينة', type:'دولية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'جزيرة السعديات' },
  { code:'AUH-P-005', name_ar:'أكاديمية الوطنية',                        name_en:'The National Academy',                            emirate:'أبوظبي', region:'أبوظبي المدينة', type:'خاصة', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'مدينة خليفة' },
  { code:'AUH-P-006', name_ar:'مدرسة الغد الخاصة',                       name_en:'Al Ghad Private School',                          emirate:'أبوظبي', region:'أبوظبي المدينة', type:'خاصة', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الشامخة' },
  { code:'AUH-P-007', name_ar:'مدرسة نيو إنجلش',                         name_en:'New English School Abu Dhabi',                    emirate:'أبوظبي', region:'أبوظبي المدينة', type:'خاصة', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'المركز' },
  { code:'AUH-P-008', name_ar:'مدرسة إيتون هاوس',                        name_en:'Eton House School',                               emirate:'أبوظبي', region:'أبوظبي المدينة', type:'دولية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'السعديات' },
  { code:'AUH-P-009', name_ar:'مدرسة دبليو إس إس أبوظبي',               name_en:'WSS Abu Dhabi',                                  emirate:'أبوظبي', region:'أبوظبي المدينة', type:'دولية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'IB', language:'إنجليزي', area:'بين الجسرين' },
  { code:'AUH-P-010', name_ar:'مدرسة فيرغرين الخاصة',                   name_en:'Fairgreen International School',                   emirate:'أبوظبي', region:'أبوظبي المدينة', type:'دولية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'IB', language:'إنجليزي', area:'مصفح' },
  { code:'AIN-P-001', name_ar:'مدرسة العين الدولية',                      name_en:'Al Ain International School',                     emirate:'أبوظبي', region:'العين', type:'دولية', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'مركز العين' },
  { code:'AIN-P-002', name_ar:'أكاديمية الجيل الرائد',                   name_en:'Al Jeel Al Raed Academy',                         emirate:'أبوظبي', region:'العين', type:'خاصة', authority:'ADEK', authority_url:'adek.gov.ae', stages:['KG','ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'هيلي' },

  /* ═══════════════════════════════════════════════
     دبي — حكومية (MOE)
  ═══════════════════════════════════════════════ */
  { code:'DXB-G-001', name_ar:'مدرسة دبي للتعليم الأساسي',               name_en:'Dubai Basic Education School',                    emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'ديرة' },
  { code:'DXB-G-002', name_ar:'مدرسة الاتحاد للتعليم الأساسي',           name_en:'Al Ittihad Basic Education School',                emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'القصيص' },
  { code:'DXB-G-003', name_ar:'مدرسة القرهود للتعليم الأساسي',           name_en:'Al Garhoud Basic Education School',                emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'القرهود' },
  { code:'DXB-G-004', name_ar:'مدرسة جميرا للتعليم الأساسي',             name_en:'Jumeirah Basic Education School',                  emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'جميرا' },
  { code:'DXB-G-005', name_ar:'ثانوية دبي للبنين',                        name_en:'Dubai Secondary School for Boys',                  emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'بر دبي' },
  { code:'DXB-G-006', name_ar:'ثانوية دبي للبنات',                        name_en:'Dubai Secondary School for Girls',                 emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'بر دبي' },
  { code:'DXB-G-007', name_ar:'مدرسة مردف للتعليم الأساسي',              name_en:'Mirdif Basic Education School',                   emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'مردف' },
  { code:'DXB-G-008', name_ar:'ثانوية الرشيد',                            name_en:'Al Rasheed Secondary School',                      emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'القصيص' },
  { code:'DXB-G-009', name_ar:'مدرسة الخوانيج للتعليم الأساسي',         name_en:'Al Khawaneej Basic Education School',              emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الخوانيج' },
  { code:'DXB-G-010', name_ar:'مدرسة الورقاء للتعليم الأساسي',           name_en:'Al Warqa Basic Education School',                  emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الورقاء' },
  { code:'DXB-G-011', name_ar:'مدرسة البرشاء للتعليم الأساسي',           name_en:'Al Barsha Basic Education School',                 emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'البرشاء' },
  { code:'DXB-G-012', name_ar:'مدرسة هور العنز للتعليم الأساسي',         name_en:'Hor Al Anz Basic Education School',                emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'هور العنز' },
  { code:'DXB-G-013', name_ar:'مدرسة الراشدية للتعليم الأساسي',          name_en:'Al Rashidiya Basic Education School',              emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الراشدية' },
  { code:'DXB-G-014', name_ar:'مدرسة القوز للتعليم الأساسي',             name_en:'Al Quoz Basic Education School',                   emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'القوز' },
  { code:'DXB-G-015', name_ar:'ثانوية الوحدة دبي',                        name_en:'Al Wahda Secondary School Dubai',                  emirate:'دبي', region:'دبي', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'ديرة' },

  /* ═══════════════════════════════════════════════
     دبي — خاصة (KHDA)
  ═══════════════════════════════════════════════ */
  { code:'DXB-P-001', name_ar:'مدرسة جميرا الإنجليزية',                  name_en:'Jumeirah English Speaking School',                 emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'جميرا' },
  { code:'DXB-P-002', name_ar:'مدرسة دبي الأمريكية',                     name_en:'American School of Dubai',                        emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'American', language:'إنجليزي', area:'الروضة' },
  { code:'DXB-P-003', name_ar:'مدرسة دبي الكولدج',                       name_en:'Dubai College',                                   emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['متوسط','ثانوي'],        gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'البراحة' },
  { code:'DXB-P-004', name_ar:'مدرسة ويلينغتون الدولية',                 name_en:'Wellington International School',                  emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'القوز' },
  { code:'DXB-P-005', name_ar:'مدرسة ريبتون',                            name_en:'Repton School Dubai',                             emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'ند الحمر' },
  { code:'DXB-P-006', name_ar:'مدرسة الإمارات الدولية',                  name_en:'Emirates International School',                   emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'IB', language:'إنجليزي', area:'جميرا' },
  { code:'DXB-P-007', name_ar:'مدرسة إيبس دبي',                          name_en:'GEMS World Academy Dubai',                        emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'IB', language:'إنجليزي', area:'التلال' },
  { code:'DXB-P-008', name_ar:'جيمس ويلينغتون دبي',                     name_en:'GEMS Wellington Primary School',                   emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي'],          gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'موتور سيتي' },
  { code:'DXB-P-009', name_ar:'مدرسة الأكاديمية العربية',                name_en:'Arab Unity School',                               emirate:'دبي', region:'دبي', type:'خاصة', authority:'KHDA', authority_url:'khda.gov.ae', stages:['ابتدائي','متوسط','ثانوي'],  gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'ديرة' },
  { code:'DXB-P-010', name_ar:'مدرسة نيو إنديان',                        name_en:'New Indian Model School',                         emirate:'دبي', region:'دبي', type:'خاصة', authority:'KHDA', authority_url:'khda.gov.ae', stages:['ابتدائي','متوسط','ثانوي'],  gender:'مختلط',curriculum:'Indian', language:'إنجليزي', area:'بر دبي' },
  { code:'DXB-P-011', name_ar:'أكاديمية دبي الأمريكية',                  name_en:'Dubai American Academy',                          emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'American', language:'إنجليزي', area:'السفاري' },
  { code:'DXB-P-012', name_ar:'مدرسة الإمارات الوطنية دبي',             name_en:'Emirates National School Dubai',                   emirate:'دبي', region:'دبي', type:'خاصة', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'MOE+IB', language:'ثنائي', area:'محيصنة' },
  { code:'DXB-P-013', name_ar:'مدرسة دوبيز الخاصة',                     name_en:'DUBS Private School',                             emirate:'دبي', region:'دبي', type:'خاصة', authority:'KHDA', authority_url:'khda.gov.ae', stages:['ابتدائي','متوسط','ثانوي'],  gender:'مختلط',curriculum:'MOE', language:'عربي', area:'مردف' },
  { code:'DXB-P-014', name_ar:'مدرسة رانشوس دبي',                       name_en:'Ranches Primary School',                          emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي'],          gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'المرابع العربية' },
  { code:'DXB-P-015', name_ar:'مدرسة سيتيز للتميز',                     name_en:'GEMS FirstPoint School',                          emirate:'دبي', region:'دبي', type:'دولية', authority:'KHDA', authority_url:'khda.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'فيلا نوفا' },

  /* ═══════════════════════════════════════════════
     الشارقة — حكومية (MOE)
  ═══════════════════════════════════════════════ */
  { code:'SHJ-G-001', name_ar:'مدرسة الشارقة للتعليم الأساسي للبنين',    name_en:'Sharjah Basic Education School for Boys',          emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'SHJ-G-002', name_ar:'مدرسة الشارقة للتعليم الأساسي للبنات',    name_en:'Sharjah Basic Education School for Girls',         emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'SHJ-G-003', name_ar:'ثانوية الشارقة للبنين',                   name_en:'Sharjah Secondary School for Boys',                emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'SHJ-G-004', name_ar:'ثانوية الشارقة للبنات',                   name_en:'Sharjah Secondary School for Girls',               emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'SHJ-G-005', name_ar:'مدرسة خور فكان للتعليم الأساسي',         name_en:'Khor Fakkan Basic Education School',               emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'خور فكان' },
  { code:'SHJ-G-006', name_ar:'ثانوية خور فكان',                         name_en:'Khor Fakkan Secondary School',                     emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'خور فكان' },
  { code:'SHJ-G-007', name_ar:'مدرسة كلباء للتعليم الأساسي',             name_en:'Kalba Basic Education School',                    emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'كلباء' },
  { code:'SHJ-G-008', name_ar:'مدرسة ضباء للتعليم الأساسي',              name_en:'Dibba Al Hisn Basic Education School',             emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'ضباء' },
  { code:'SHJ-G-009', name_ar:'مدرسة القصيص الشارقة للتعليم الأساسي',   name_en:'Al Qasimiah Basic Education School',               emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'القاسمية' },
  { code:'SHJ-G-010', name_ar:'ثانوية الحمرية',                           name_en:'Al Hamriyah Secondary School',                     emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'الحمرية' },
  { code:'SHJ-G-011', name_ar:'مدرسة المجاز للتعليم الأساسي',            name_en:'Al Majaz Basic Education School',                  emirate:'الشارقة', region:'الشارقة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المجاز' },

  /* ═══════════════════════════════════════════════
     الشارقة — خاصة (SPEA)
  ═══════════════════════════════════════════════ */
  { code:'SHJ-P-001', name_ar:'مدرسة الشارقة الدولية',                   name_en:'Sharjah International School',                    emirate:'الشارقة', region:'الشارقة', type:'دولية', authority:'SPEA', authority_url:'spea.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'الخان' },
  { code:'SHJ-P-002', name_ar:'مدرسة الإمارات النموذجية الشارقة',       name_en:'Emirates Model School Sharjah',                   emirate:'الشارقة', region:'الشارقة', type:'خاصة', authority:'SPEA', authority_url:'spea.gov.ae', stages:['ابتدائي','متوسط','ثانوي'],  gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'الزاهية' },
  { code:'SHJ-P-003', name_ar:'Our Own High School Sharjah',              name_en:'Our Own High School Sharjah',                     emirate:'الشارقة', region:'الشارقة', type:'خاصة', authority:'SPEA', authority_url:'spea.gov.ae', stages:['ابتدائي','متوسط','ثانوي'],  gender:'مختلط',curriculum:'Indian', language:'إنجليزي', area:'الشارقة' },
  { code:'SHJ-P-004', name_ar:'أكاديمية صباح الخير',                     name_en:'Sabah Al Khair Academy',                          emirate:'الشارقة', region:'الشارقة', type:'خاصة', authority:'SPEA', authority_url:'spea.gov.ae', stages:['KG','ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'النهدة' },
  { code:'SHJ-P-005', name_ar:'مدرسة الرفاعة الخاصة',                   name_en:'Al Refaah Private School',                        emirate:'الشارقة', region:'الشارقة', type:'خاصة', authority:'SPEA', authority_url:'spea.gov.ae', stages:['ابتدائي','متوسط'],        gender:'بنات', curriculum:'MOE', language:'عربي', area:'الرفاعة' },
  { code:'SHJ-P-006', name_ar:'مدرسة الأفق الخاصة',                     name_en:'Al Ufuq Private School',                          emirate:'الشارقة', region:'الشارقة', type:'خاصة', authority:'SPEA', authority_url:'spea.gov.ae', stages:['KG','ابتدائي'],          gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الحمرية' },

  /* ═══════════════════════════════════════════════
     عجمان — حكومية (MOE)
  ═══════════════════════════════════════════════ */
  { code:'AJM-G-001', name_ar:'مدرسة عجمان للتعليم الأساسي للبنين',      name_en:'Ajman Basic Education School for Boys',            emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AJM-G-002', name_ar:'مدرسة عجمان للتعليم الأساسي للبنات',      name_en:'Ajman Basic Education School for Girls',           emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AJM-G-003', name_ar:'ثانوية عجمان للبنين',                      name_en:'Ajman Secondary School for Boys',                  emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AJM-G-004', name_ar:'ثانوية عجمان للبنات',                      name_en:'Ajman Secondary School for Girls',                 emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'AJM-G-005', name_ar:'مدرسة الرميلة للتعليم الأساسي',           name_en:'Al Rumaila Basic Education School',                emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الرميلة' },
  { code:'AJM-G-006', name_ar:'مدرسة الجرف للتعليم الأساسي',             name_en:'Al Jurf Basic Education School',                   emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الجرف' },
  { code:'AJM-G-007', name_ar:'مدرسة مصفوت للتعليم الأساسي',             name_en:'Masfout Basic Education School',                   emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'مصفوت' },
  { code:'AJM-G-008', name_ar:'ثانوية منامة عجمان',                       name_en:'Manama Secondary School Ajman',                    emirate:'عجمان', region:'عجمان', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'منامة' },

  /* ═══════════════════════════════════════════════
     عجمان — خاصة
  ═══════════════════════════════════════════════ */
  { code:'AJM-P-001', name_ar:'مدرسة عجمان الإنجليزية الخاصة',          name_en:'Ajman English Private School',                    emirate:'عجمان', region:'عجمان', type:'خاصة', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'Indian', language:'إنجليزي', area:'عجمان' },
  { code:'AJM-P-002', name_ar:'أكاديمية عجمان الخاصة',                   name_en:'Ajman Academy',                                   emirate:'عجمان', region:'عجمان', type:'خاصة', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'النعيمية' },
  { code:'AJM-P-003', name_ar:'مدرسة دار الفكر الخاصة',                  name_en:'Dar Al Fikr Private School',                      emirate:'عجمان', region:'عجمان', type:'خاصة', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط'],        gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الجرف' },

  /* ═══════════════════════════════════════════════
     أم القيوين — حكومية (MOE)
  ═══════════════════════════════════════════════ */
  { code:'UAQ-G-001', name_ar:'مدرسة أم القيوين للتعليم الأساسي للبنين', name_en:'UAQ Basic Education School for Boys',              emirate:'أم القيوين', region:'أم القيوين', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'UAQ-G-002', name_ar:'مدرسة أم القيوين للتعليم الأساسي للبنات', name_en:'UAQ Basic Education School for Girls',             emirate:'أم القيوين', region:'أم القيوين', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'UAQ-G-003', name_ar:'ثانوية أم القيوين للبنين',                 name_en:'UAQ Secondary School for Boys',                   emirate:'أم القيوين', region:'أم القيوين', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'UAQ-G-004', name_ar:'ثانوية أم القيوين للبنات',                 name_en:'UAQ Secondary School for Girls',                  emirate:'أم القيوين', region:'أم القيوين', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'UAQ-G-005', name_ar:'مدرسة فلج المعلا للتعليم الأساسي',        name_en:'Falaj Al Mualla Basic Education School',           emirate:'أم القيوين', region:'أم القيوين', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'فلج المعلا' },

  /* ═══════════════════════════════════════════════
     أم القيوين — خاصة
  ═══════════════════════════════════════════════ */
  { code:'UAQ-P-001', name_ar:'مدرسة الإمارات الخاصة أم القيوين',        name_en:'Emirates Private School UAQ',                     emirate:'أم القيوين', region:'أم القيوين', type:'خاصة', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'ثنائي', area:'المركز' },

  /* ═══════════════════════════════════════════════
     رأس الخيمة — حكومية (MOE)
  ═══════════════════════════════════════════════ */
  { code:'RAK-G-001', name_ar:'مدرسة رأس الخيمة للتعليم الأساسي للبنين', name_en:'RAK Basic Education School for Boys',             emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'RAK-G-002', name_ar:'مدرسة رأس الخيمة للتعليم الأساسي للبنات', name_en:'RAK Basic Education School for Girls',            emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'RAK-G-003', name_ar:'ثانوية رأس الخيمة للبنين',                name_en:'RAK Secondary School for Boys',                   emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'RAK-G-004', name_ar:'ثانوية رأس الخيمة للبنات',                name_en:'RAK Secondary School for Girls',                  emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'RAK-G-005', name_ar:'مدرسة خزام رأس الخيمة للتعليم الأساسي',  name_en:'Khuzam Basic Education School',                   emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'خزام' },
  { code:'RAK-G-006', name_ar:'مدرسة الجزيرة الحمراء للتعليم الأساسي',  name_en:'Al Jazira Al Hamra Basic Education School',        emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الجزيرة الحمراء' },
  { code:'RAK-G-007', name_ar:'مدرسة رأس الخيمة النموذجية',              name_en:'RAK Model School',                                emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'المعيريض' },
  { code:'RAK-G-008', name_ar:'مدرسة شعم للتعليم الأساسي',               name_en:'Sha\'am Basic Education School',                   emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'شعم' },
  { code:'RAK-G-009', name_ar:'ثانوية الغيل رأس الخيمة',                 name_en:'Al Ghail Secondary School RAK',                   emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'الغيل' },
  { code:'RAK-G-010', name_ar:'مدرسة خت للتعليم الأساسي',                name_en:'Khatt Basic Education School',                    emirate:'رأس الخيمة', region:'رأس الخيمة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'خت' },

  /* ═══════════════════════════════════════════════
     رأس الخيمة — خاصة
  ═══════════════════════════════════════════════ */
  { code:'RAK-P-001', name_ar:'أكاديمية رأس الخيمة الإنجليزية',         name_en:'RAK Academy',                                     emirate:'رأس الخيمة', region:'رأس الخيمة', type:'دولية', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'المعيريض' },
  { code:'RAK-P-002', name_ar:'مدرسة الإمارات الوطنية رأس الخيمة',      name_en:'Emirates National School RAK',                    emirate:'رأس الخيمة', region:'رأس الخيمة', type:'خاصة', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'American', language:'إنجليزي', area:'المعيريض' },
  { code:'RAK-P-003', name_ar:'مدرسة إيجلس الخاصة',                     name_en:'GEMS Cambridge International School RAK',          emirate:'رأس الخيمة', region:'رأس الخيمة', type:'دولية', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'رأس الخيمة' },

  /* ═══════════════════════════════════════════════
     الفجيرة — حكومية (MOE)
  ═══════════════════════════════════════════════ */
  { code:'FUJ-G-001', name_ar:'مدرسة الفجيرة للتعليم الأساسي للبنين',   name_en:'Fujairah Basic Education School for Boys',         emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'FUJ-G-002', name_ar:'مدرسة الفجيرة للتعليم الأساسي للبنات',   name_en:'Fujairah Basic Education School for Girls',        emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'FUJ-G-003', name_ar:'ثانوية الفجيرة للبنين',                   name_en:'Fujairah Secondary School for Boys',               emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'FUJ-G-004', name_ar:'ثانوية الفجيرة للبنات',                   name_en:'Fujairah Secondary School for Girls',              emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'المركز' },
  { code:'FUJ-G-005', name_ar:'مدرسة دبا الفجيرة للتعليم الأساسي',      name_en:'Dibba Fujairah Basic Education School',            emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'دبا الفجيرة' },
  { code:'FUJ-G-006', name_ar:'ثانوية دبا الفجيرة',                      name_en:'Dibba Fujairah Secondary School',                  emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنين',  curriculum:'MOE', language:'عربي', area:'دبا الفجيرة' },
  { code:'FUJ-G-007', name_ar:'مدرسة مضرب للتعليم الأساسي',             name_en:'Mudrib Basic Education School',                   emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'مضرب' },
  { code:'FUJ-G-008', name_ar:'مدرسة الحيل الفجيرة للتعليم الأساسي',    name_en:'Al Hail Fujairah Basic Education School',          emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ابتدائي','متوسط'], gender:'مختلط',curriculum:'MOE', language:'عربي', area:'الحيل' },
  { code:'FUJ-G-009', name_ar:'ثانوية الحيل الفجيرة',                    name_en:'Al Hail Secondary School Fujairah',                emirate:'الفجيرة', region:'الفجيرة', type:'حكومية', authority:'MOE', authority_url:'moe.gov.ae', stages:['ثانوي'],              gender:'بنات', curriculum:'MOE', language:'عربي', area:'الحيل' },

  /* ═══════════════════════════════════════════════
     الفجيرة — خاصة
  ═══════════════════════════════════════════════ */
  { code:'FUJ-P-001', name_ar:'مدرسة الفجيرة الخاصة',                   name_en:'Fujairah Private School',                         emirate:'الفجيرة', region:'الفجيرة', type:'خاصة', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'Indian', language:'إنجليزي', area:'الفجيرة' },
  { code:'FUJ-P-002', name_ar:'أكاديمية الفجيرة الدولية',               name_en:'Fujairah International Academy',                   emirate:'الفجيرة', region:'الفجيرة', type:'دولية', authority:'MOE', authority_url:'moe.gov.ae', stages:['KG','ابتدائي','متوسط','ثانوي'], gender:'مختلط',curriculum:'British', language:'إنجليزي', area:'الفجيرة' },

];

/* ─────────────────────────────────────────────────
   دوال المساعدة
───────────────────────────────────────────────── */

/** جلب مدارس حسب الإمارة والنوع */
function getSchoolsByEmirateAndType(emirate, type) {
  return SCHOOLS_DB.filter(s =>
    (!emirate || s.emirate === emirate || s.region === emirate) &&
    (!type    || s.type === type)
  );
}

/** بحث بالنص أو الكود الداخلي أو الرقم الرسمي */
function searchSchools(query) {
  const q = query.trim().toLowerCase();
  const numQ = parseInt(query.trim(), 10);
  return SCHOOLS_DB.filter(s =>
    s.code.toLowerCase().includes(q) ||
    s.name_ar.includes(query) ||
    s.name_en.toLowerCase().includes(q) ||
    s.area.includes(query) ||
    (!isNaN(numQ) && s.official_id === numQ)
  );
}

/** جلب مدرسة بكودها الداخلي */
function getSchoolByCode(code) {
  return SCHOOLS_DB.find(s => s.code === code) || null;
}

/**
 * جلب مدرسة برقمها الرسمي (eSIS / MOE / ADEK / KHDA)
 * @param {number|string} id — الرقم الرسمي
 * @returns {object|null}
 */
function getSchoolByOfficialId(id) {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return null;
  return SCHOOLS_DB.find(s => s.official_id === numId) || null;
}

/**
 * التحقق من صحة الرقم الرسمي (3–5 أرقام فقط)
 * @param {string|number} id
 * @returns {boolean}
 */
function isValidOfficialId(id) {
  const s = String(id).trim();
  return /^\d{3,5}$/.test(s);
}

/** إحصائيات */
const SCHOOLS_STATS = {
  total:       SCHOOLS_DB.length,
  government:  SCHOOLS_DB.filter(s => s.type === 'حكومية').length,
  private:     SCHOOLS_DB.filter(s => s.type === 'خاصة').length,
  intl:        SCHOOLS_DB.filter(s => s.type === 'دولية').length,
  emirates:    [...new Set(SCHOOLS_DB.map(s => s.emirate))].length,
};

console.log(`📚 Schools DB loaded: ${SCHOOLS_STATS.total} schools | Gov: ${SCHOOLS_STATS.government} | Private: ${SCHOOLS_STATS.private} | Intl: ${SCHOOLS_STATS.intl}`);
