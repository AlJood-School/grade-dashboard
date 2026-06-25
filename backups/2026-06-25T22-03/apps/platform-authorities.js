/**
 * platform-authorities.js v1.0
 * EduOS — NAFAS FOR ARTIFICIAL INTELLIGENCE
 * قاموس الجهات التعليمية الرسمية في الإمارات
 * يحدد تلقائياً الجهة المعنية + قنوات التواصل حسب نوع المدرسة والإمارة
 */

const EDUCATION_AUTHORITIES = {

  // ══════════════════════════════════════
  // أبوظبي — حكومي
  // ══════════════════════════════════════
  'government_abudhabi': {
    id: 'adek_gov',
    name_ar: 'هيئة أبوظبي للتعليم والمعرفة',
    name_en: 'Abu Dhabi Department of Education and Knowledge (ADEK)',
    short_ar: 'ADEK',
    logo_color: '#006C35',
    channels: {
      email_general:      'info@adek.gov.ae',
      email_staffing:     'schoolstaffing@adek.gov.ae',
      email_supply:       'supplyteachers@adek.gov.ae',
      email_vacancies:    'vacancies@adek.gov.ae',
      phone:              '800 2335',
      portal:             'https://adek.gov.ae',
      eservices:          'https://eservices.adek.gov.ae',
      staffing_request:   'https://eservices.adek.gov.ae/staffing',
      supply_teachers:    'https://eservices.adek.gov.ae/supply-teachers',
      nafis_coordination: null, // حكومي — لا يشمله Nafis
    },
    request_types: {
      permanent_hire: {
        label_ar: 'طلب تعيين كادر دائم',
        channel: 'eservices',
        form_url: 'https://eservices.adek.gov.ae/staffing/new-appointment',
        required_docs: ['نموذج الطلب الرسمي', 'السيرة الذاتية', 'المؤهلات', 'رخصة التعليم'],
        sla_days: 15,
        note_ar: 'تُرسل الطلبات عبر البوابة الإلكترونية — التعيين حصراً من ADEK لمدارسها',
      },
      supply_teacher: {
        label_ar: 'طلب معلم احتياط',
        channel: 'email_supply',
        required_docs: ['نموذج الطلب', 'سبب الغياب', 'التواريخ المطلوبة', 'المادة والمرحلة'],
        sla_days: 2,
        note_ar: 'للطوارئ: أرسل بريداً وأتبعه بمكالمة هاتفية على 800 2335',
      },
      vacancy_report: {
        label_ar: 'إبلاغ عن منصب شاغر',
        channel: 'email_vacancies',
        required_docs: ['اسم المنصب', 'المادة', 'المرحلة', 'تاريخ الشغور', 'سبب الشغور'],
        sla_days: 7,
        note_ar: 'يجب الإبلاغ خلال 5 أيام عمل من تاريخ الشغور',
      },
      staff_license: {
        label_ar: 'طلب ترخيص موظف جديد',
        channel: 'eservices',
        form_url: 'https://eservices.adek.gov.ae/teaching-license',
        required_docs: ['جواز السفر', 'الشهادة العلمية', 'شهادة التدريس', 'فحص أمني'],
        sla_days: 21,
      },
      staff_transfer: {
        label_ar: 'طلب نقل موظف',
        channel: 'eservices',
        required_docs: ['نموذج النقل', 'موافقة المدرستين', 'مبرر النقل'],
        sla_days: 10,
      },
    },
    emiratization: {
      target_pct: 30,
      responsible: 'ADEK — قسم التوطين',
      email: 'emiratization@adek.gov.ae',
      note_ar: 'التعيينات الجديدة من قِبل ADEK — المدرسة ترفع طلب رسمياً',
      fine_applicable: false,
    }
  },

  // ══════════════════════════════════════
  // أبوظبي — خاص
  // ══════════════════════════════════════
  'private_abudhabi': {
    id: 'adek_private',
    name_ar: 'هيئة أبوظبي للتعليم والمعرفة — قسم المدارس الخاصة',
    name_en: 'ADEK — Private Schools Division',
    short_ar: 'ADEK (خاص)',
    logo_color: '#006C35',
    channels: {
      email_general:      'privateschools@adek.gov.ae',
      email_staffing:     'ps.staffing@adek.gov.ae',
      email_supply:       'ps.supply@adek.gov.ae',
      email_vacancies:    'ps.vacancies@adek.gov.ae',
      phone:              '800 2335',
      portal:             'https://adek.gov.ae',
      eservices:          'https://eservices.adek.gov.ae/private-schools',
      nafis_portal:       'https://nafis.gov.ae',
      nafis_email:        'info@nafis.gov.ae',
    },
    request_types: {
      permanent_hire: {
        label_ar: 'طلب تعيين كادر دائم',
        channel: 'eservices',
        required_docs: ['نموذج ADEK', 'السيرة الذاتية', 'رخصة التعليم', 'اعتماد الدرجة العلمية'],
        sla_days: 14,
        note_ar: 'يجب الحصول على موافقة ADEK قبل التعيين الرسمي',
      },
      supply_teacher: {
        label_ar: 'طلب معلم احتياط',
        channel: 'email_supply',
        required_docs: ['نموذج الطلب', 'سبب الغياب', 'التواريخ', 'المادة والمرحلة'],
        sla_days: 2,
        note_ar: 'المدارس الخاصة قد تستعين بمعلمين مستقلين مرخّصين من ADEK',
      },
      nafis_registration: {
        label_ar: 'تسجيل موظف إماراتي في Nafis',
        channel: 'nafis_portal',
        required_docs: ['هوية إماراتية', 'عقد العمل', 'بيانات الراتب'],
        sla_days: 5,
        note_ar: 'الدعم يصل إلى 7,000 درهم/شهر — للقطاع الخاص فقط',
      },
      emiratization_report: {
        label_ar: 'تقرير التوطين الدوري',
        channel: 'email_general',
        required_docs: ['نموذج التقرير الربعي', 'قائمة الموظفين الإماراتيين'],
        sla_days: null,
        note_ar: 'يُرسَل كل ربع سنة — مطلوب قانونياً',
      },
    },
    emiratization: {
      target_pct: 10,
      responsible: 'ADEK + وزارة الموارد البشرية (Nafis)',
      email: 'emiratization@adek.gov.ae',
      note_ar: 'غرامة 9,000 درهم/شهر عن كل منصب لم يُملأ بإماراتي',
      fine_applicable: true,
      fine_amount: 9000,
      fine_currency: 'AED',
      deadline: '2026-06-30',
    }
  },

  // ══════════════════════════════════════
  // دبي — خاص
  // ══════════════════════════════════════
  'private_dubai': {
    id: 'khda',
    name_ar: 'هيئة المعرفة والتنمية البشرية',
    name_en: 'Knowledge and Human Development Authority (KHDA)',
    short_ar: 'KHDA',
    logo_color: '#E63946',
    channels: {
      email_general:   'info@khda.gov.ae',
      email_staffing:  'schools@khda.gov.ae',
      phone:           '04 364 0000',
      portal:          'https://khda.gov.ae',
      eservices:       'https://connect.khda.gov.ae',
      nafis_portal:    'https://nafis.gov.ae',
    },
    request_types: {
      permanent_hire: {
        label_ar: 'طلب تعيين — ترخيص معلم',
        channel: 'eservices',
        required_docs: ['طلب ترخيص KHDA', 'رخصة التعليم الدولية', 'السيرة الذاتية'],
        sla_days: 20,
        note_ar: 'كل معلم في مدارس دبي الخاصة يحتاج ترخيص KHDA مستقل',
      },
      supply_teacher: {
        label_ar: 'طلب معلم احتياط',
        channel: 'email_staffing',
        required_docs: ['نموذج الطلب', 'التواريخ', 'المادة'],
        sla_days: 3,
      },
      nafis_registration: {
        label_ar: 'تسجيل في Nafis',
        channel: 'nafis_portal',
        required_docs: ['هوية إماراتية', 'عقد العمل'],
        sla_days: 5,
        note_ar: 'برنامج Nafis متاح للقطاع الخاص في دبي',
      },
    },
    emiratization: {
      target_pct: 10,
      responsible: 'KHDA + Nafis',
      fine_applicable: true,
      fine_amount: 9000,
      fine_currency: 'AED',
      deadline: '2026-06-30',
    }
  },

  // ══════════════════════════════════════
  // دبي — حكومي (مؤسسة دبي للمدارس)
  // ══════════════════════════════════════
  'government_dubai': {
    id: 'dsf',
    name_ar: 'مؤسسة دبي للمدارس',
    name_en: 'Dubai Schools Foundation (DSF)',
    short_ar: 'DSF',
    logo_color: '#1B4F72',
    channels: {
      email_general:  'info@dsf.ae',
      email_staffing: 'hr@dsf.ae',
      phone:          '04 448 8500',
      portal:         'https://dsf.ae',
      eservices:      'https://eservices.dsf.ae',
    },
    request_types: {
      permanent_hire: {
        label_ar: 'طلب تعيين',
        channel: 'eservices',
        required_docs: ['نموذج الطلب', 'المؤهلات', 'رخصة التعليم'],
        sla_days: 20,
        note_ar: 'التعيين حصراً من مؤسسة دبي للمدارس',
      },
      supply_teacher: {
        label_ar: 'طلب معلم احتياط',
        channel: 'email_staffing',
        required_docs: ['نموذج الطلب', 'التواريخ', 'المادة'],
        sla_days: 2,
      },
    },
    emiratization: {
      target_pct: 30,
      responsible: 'DSF',
      fine_applicable: false,
    }
  },

  // ══════════════════════════════════════
  // الشارقة — خاص
  // ══════════════════════════════════════
  'private_sharjah': {
    id: 'spea',
    name_ar: 'هيئة الشارقة للتعليم الخاص',
    name_en: 'Sharjah Private Education Authority (SPEA)',
    short_ar: 'SPEA',
    logo_color: '#5C3A9E',
    channels: {
      email_general:  'info@spea.gov.ae',
      email_staffing: 'staffing@spea.gov.ae',
      phone:          '06 598 5555',
      portal:         'https://spea.gov.ae',
      eservices:      'https://eservices.spea.gov.ae',
      nafis_portal:   'https://nafis.gov.ae',
    },
    request_types: {
      permanent_hire: {
        label_ar: 'طلب تعيين',
        channel: 'eservices',
        required_docs: ['نموذج SPEA', 'المؤهلات', 'رخصة التعليم'],
        sla_days: 14,
      },
      supply_teacher: {
        label_ar: 'طلب معلم احتياط',
        channel: 'email_staffing',
        required_docs: ['نموذج الطلب', 'التواريخ', 'المادة'],
        sla_days: 2,
      },
    },
    emiratization: {
      target_pct: 10,
      responsible: 'SPEA + Nafis',
      fine_applicable: true,
      fine_amount: 9000,
      fine_currency: 'AED',
      deadline: '2026-06-30',
    }
  },

  // ══════════════════════════════════════
  // المناطق الشمالية + عجمان + أم القيوين + الفجيرة + رأس الخيمة
  // ══════════════════════════════════════
  'private_northern': {
    id: 'moe_private',
    name_ar: 'وزارة التربية والتعليم — المدارس الخاصة',
    name_en: 'Ministry of Education — Private Schools',
    short_ar: 'MoE (خاص)',
    logo_color: '#1A5276',
    channels: {
      email_general:  'privateschools@moe.gov.ae',
      email_staffing: 'staffing@moe.gov.ae',
      phone:          '800 66363',
      portal:         'https://moe.gov.ae',
      eservices:      'https://eservices.moe.gov.ae',
      nafis_portal:   'https://nafis.gov.ae',
    },
    request_types: {
      permanent_hire: {
        label_ar: 'طلب تعيين',
        channel: 'eservices',
        required_docs: ['نموذج وزارة التربية', 'المؤهلات', 'رخصة التعليم', 'الشهادة الصحية'],
        sla_days: 21,
      },
      supply_teacher: {
        label_ar: 'طلب معلم احتياط',
        channel: 'email_staffing',
        required_docs: ['نموذج الطلب', 'التواريخ', 'المادة', 'مستوى الصف'],
        sla_days: 3,
      },
    },
    emiratization: {
      target_pct: 10,
      responsible: 'MoE + Nafis',
      fine_applicable: true,
      fine_amount: 9000,
      fine_currency: 'AED',
      deadline: '2026-06-30',
    }
  },

  'government_northern': {
    id: 'moe_gov',
    name_ar: 'وزارة التربية والتعليم',
    name_en: 'Ministry of Education (Federal)',
    short_ar: 'وزارة التربية',
    logo_color: '#1A5276',
    channels: {
      email_general:  'info@moe.gov.ae',
      email_staffing: 'staffing@moe.gov.ae',
      email_supply:   'supply.teachers@moe.gov.ae',
      email_vacancies:'vacancies@moe.gov.ae',
      phone:          '800 66363',
      portal:         'https://moe.gov.ae',
      eservices:      'https://eservices.moe.gov.ae',
      nafis_coordination: null,
    },
    request_types: {
      permanent_hire: {
        label_ar: 'طلب تعيين كادر دائم',
        channel: 'eservices',
        required_docs: ['نموذج وزارة التربية', 'المؤهلات', 'رخصة التعليم'],
        sla_days: 21,
        note_ar: 'التعيين عبر المنظومة الاتحادية للوزارة',
      },
      supply_teacher: {
        label_ar: 'طلب معلم احتياط',
        channel: 'email_supply',
        required_docs: ['نموذج الطلب', 'التواريخ', 'المادة'],
        sla_days: 3,
      },
      vacancy_report: {
        label_ar: 'إبلاغ عن نقص في الكادر',
        channel: 'email_vacancies',
        required_docs: ['تفاصيل المنصب', 'تاريخ الشغور'],
        sla_days: 7,
      },
    },
    emiratization: {
      target_pct: 30,
      responsible: 'وزارة التربية والتعليم',
      fine_applicable: false,
      note_ar: 'المدارس الحكومية الاتحادية — التوطين عبر آلية الوزارة',
    }
  },

};

// ══════════════════════════════════════
// دوال المساعدة
// ══════════════════════════════════════

/**
 * احصل على الجهة المعنية بناءً على نوع المدرسة والإمارة
 * @param {string} schoolType - 'government' | 'private'
 * @param {string} emirate    - 'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Northern'
 */
function getAuthority(schoolType = 'government', emirate = 'Abu Dhabi') {
  const emirateMap = {
    'Abu Dhabi':    { government: 'government_abudhabi', private: 'private_abudhabi' },
    'Dubai':        { government: 'government_dubai',    private: 'private_dubai'    },
    'Sharjah':      { government: 'government_northern', private: 'private_sharjah'  },
    'Ajman':        { government: 'government_northern', private: 'private_northern' },
    'Ras Al Khaimah':{ government:'government_northern', private: 'private_northern' },
    'Fujairah':     { government: 'government_northern', private: 'private_northern' },
    'Umm Al Quwain':{ government: 'government_northern', private: 'private_northern' },
  };
  const key = emirateMap[emirate]?.[schoolType] || 'government_abudhabi';
  return EDUCATION_AUTHORITIES[key];
}

/**
 * أنشئ مسودة بريد إلكتروني رسمي
 * @param {object} authority - نتيجة getAuthority()
 * @param {string} requestType - نوع الطلب
 * @param {object} schoolInfo - { name, id_number, principal, phone }
 * @param {object} requestData - بيانات الطلب
 */
function generateOfficialEmail(authority, requestType, schoolInfo, requestData = {}) {
  const rt = authority.request_types[requestType];
  if (!rt) return null;

  const today = new Date().toLocaleDateString('ar-AE', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const subjectMap = {
    permanent_hire:      `طلب تعيين — ${requestData.position || 'منصب تعليمي'}`,
    supply_teacher:      `طلب معلم احتياط — ${requestData.subject || 'مادة'} — ${requestData.dates || ''}`,
    vacancy_report:      `إبلاغ عن منصب شاغر — ${requestData.position || ''}`,
    staff_license:       `طلب ترخيص موظف — ${requestData.name || ''}`,
    staff_transfer:      `طلب نقل موظف — ${requestData.name || ''}`,
    nafis_registration:  `طلب تسجيل في برنامج Nafis — ${requestData.name || ''}`,
    emiratization_report:`تقرير التوطين — ${requestData.period || 'الربع الأول 2026'}`,
  };

  const docsFormatted = rt.required_docs
    .map((doc, i) => `${i + 1}. ${doc}`)
    .join('\n');

  return {
    to: authority.channels[
      rt.channel === 'eservices' ? 'email_staffing' :
      rt.channel === 'nafis_portal' ? 'nafis_email' :
      rt.channel
    ] || authority.channels.email_general,
    subject: subjectMap[requestType] || rt.label_ar,
    body: `السادة / ${authority.name_ar}
المحترمين

تحية طيبة وبعد،

يتقدم مدير ${schoolInfo.name || 'المدرسة'} (رقم eSIS: ${schoolInfo.id_number || '----'}) بطلب رسمي للـ${rt.label_ar}، وذلك وفق التفاصيل الواردة أدناه:

${requestData.details || '[ يرجى إضافة تفاصيل الطلب ]'}

المستندات المرفقة:
${docsFormatted}

${rt.note_ar ? `ملاحظة: ${rt.note_ar}\n` : ''}
نأمل التكرم بالنظر في هذا الطلب والرد في أقرب وقت ممكن.

مع التقدير،
${requestData.principal_name || schoolInfo.principal || 'المدير / المديرة'}
${schoolInfo.name || 'المدرسة'}
هاتف: ${requestData.phone || schoolInfo.phone || ''}
البريد: ${requestData.email || ''}
التاريخ: ${today}`,
    portal_url: authority.channels.eservices || authority.channels.portal,
    sla_note: rt.sla_days ? `المدة المتوقعة للرد: ${rt.sla_days} يوم عمل` : '',
  };
}

/**
 * احصل على قائمة أنواع الطلبات المتاحة
 */
function getAvailableRequestTypes(authority) {
  return Object.entries(authority.request_types).map(([key, val]) => ({
    key,
    label: val.label_ar,
    sla: val.sla_days,
    urgent: val.sla_days <= 2,
  }));
}

// تصدير للاستخدام في الصفحات
if (typeof window !== 'undefined') {
  window.EDUCATION_AUTHORITIES = EDUCATION_AUTHORITIES;
  window.getAuthority = getAuthority;
  window.generateOfficialEmail = generateOfficialEmail;
  window.getAvailableRequestTypes = getAvailableRequestTypes;
}
