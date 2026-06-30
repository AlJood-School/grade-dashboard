/**
 * ══════════════════════════════════════════════════════════════════
 *  smart-news-engine  Edge Function  v2.0
 *  محرك الأخبار + الإعلانات + التتبع الأسبوعي — A-D Framework
 *  © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
 *
 *  Actions:
 *    crawl           → جلب أخبار رسمية من مصادر حكومية + تصنيف Gemini
 *    fetch           → أخبار مُصفَّاة حسب الدور + إعلانات الصف
 *    post            → نشر خبر داخلي (principal/admin) — Level B
 *    post_class_ann  → نشر إعلان للصف (teacher) — Level B
 *    fetch_class_ann → جلب إعلانات صف معين
 *    acknowledge     → تأكيد استلام خبر/إعلان
 *    get_ack_status  → من استلم ومن لم يستلم
 *    ai_semester_plan → اقتراح خطة فصل ذكية
 *    ai_conflict_check → فحص تعارضات المسار الأسبوعي
 * ══════════════════════════════════════════════════════════════════
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SB_URL     = Deno.env.get('SUPABASE_URL')!;
const SB_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!;
const sb         = createClient(SB_URL, SB_KEY);

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

// ── Country → Official Sources ─────────────────────────────────
const COUNTRY_SOURCES: Record<string, Array<{
  name: string; url: string; lang: 'ar' | 'en'; categories: string[];
}>> = {
  UAE: [
    { name: 'وزارة التربية والتعليم الإماراتية', url: 'https://moe.gov.ae/ar/latest-news', lang: 'ar',
      categories: ['decision','curriculum','calendar','exam','teacher_dev','academic','emergency','competition'] },
    { name: 'دائرة التعليم والمعرفة — أبوظبي (ADEK)', url: 'https://www.adek.gov.ae/ar/news', lang: 'ar',
      categories: ['decision','calendar','exam','curriculum','competition'] },
    { name: 'هيئة المعرفة والتنمية البشرية — دبي (KHDA)', url: 'https://www.khda.gov.ae/ar/news', lang: 'ar',
      categories: ['decision','academic','competition'] },
    { name: 'الهيئة الوطنية لإدارة الطوارئ (NCEMA)', url: 'https://ncema.gov.ae/ar/home', lang: 'ar',
      categories: ['emergency'] },
    { name: 'وكالة أنباء الإمارات — تعليم (WAM)', url: 'https://wam.ae/ar/thematics/education', lang: 'ar',
      categories: ['academic','competition','decision'] },
  ],
  KSA: [
    { name: 'وزارة التعليم السعودية', url: 'https://www.moe.gov.sa/ar/news/pages/default.aspx', lang: 'ar',
      categories: ['decision','curriculum','calendar','exam','teacher_dev','academic'] },
  ],
  Kuwait: [
    { name: 'وزارة التربية الكويتية', url: 'https://www.moe.edu.kw/ar/news', lang: 'ar',
      categories: ['decision','curriculum','calendar','exam','teacher_dev'] },
  ],
};

const CATEGORY_PATTERNS: Record<string, string[]> = {
  emergency:   ['طوارئ','إغلاق','تعليق الدراسة','إنذار','تحذير','emergency','closure','suspend'],
  decision:    ['قرار','توجيه','تعميم','لائحة','decision','directive','circular','regulation'],
  curriculum:  ['منهج','مقرر','كتاب مدرسي','وحدة دراسية','curriculum','textbook','syllabus'],
  calendar:    ['تقويم','إجازة','موعد','جدول','عطلة','calendar','holiday','schedule','term'],
  exam:        ['اختبار','امتحان','تقييم','نتائج','درجات','exam','assessment','test','grade'],
  teacher_dev: ['معلم','تدريب','تطوير مهني','ورشة','كادر','teacher','training','workshop'],
  academic:    ['أكاديمي','تعليم','بحث','دراسة','academic','education','research'],
  competition: ['مسابقة','جائزة','أولمبياد','فعالية','competition','award','olympiad'],
};

const DEFAULT_AUDIENCE: Record<string, string[]> = {
  emergency: ['all'], decision: ['all'], curriculum: ['all'],
  calendar: ['all'], exam: ['all'], teacher_dev: ['staff'],
  academic: ['all'], competition: ['all'],
};

// Role → audience tags it can see
const ROLE_AUDIENCE: Record<string, string[]> = {
  principal:    ['all','staff','principal','teacher','secretary','security','nurse','technician'],
  admin:        ['all','staff','principal','teacher','secretary','security','nurse','technician'],
  teacher:      ['all','staff','teacher'],
  specialist:   ['all','staff','teacher'],
  social_worker:['all','staff'],
  security:     ['all','staff','security'],
  nurse:        ['all','staff','nurse'],
  technician:   ['all','staff','technician'],
  secretary:    ['all','staff','secretary'],
  observer:     ['all','staff','principal'],
  parent:       ['all','parent'],
  student:      ['all','student'],
};

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_PATTERNS)) {
    if (kws.some(kw => lower.includes(kw.toLowerCase()))) return cat;
  }
  return 'academic';
}

async function fetchSource(src: typeof COUNTRY_SOURCES['UAE'][0]): Promise<string> {
  try {
    const resp = await fetch(src.url, {
      headers: { 'User-Agent': 'EduOS-NewsBot/2.0 (nafas-ai.github.io)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) return '';
    const html = await resp.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 8000);
  } catch { return ''; }
}

async function geminiClassify(rawText: string, sourceName: string, countryId: string) {
  if (!GEMINI_KEY) return [];
  const prompt = `
أنت محلل أخبار تربوي متخصص. المصدر: "${sourceName}" | الدولة: ${countryId}

استخرج كل خبر مستقل من النص وأعطِ لكل خبر:
1. الفئة: emergency|decision|curriculum|calendar|exam|teacher_dev|academic|competition
2. الجمهور: ['all'] إذا يمس الطالب/ة | ['staff'] إذا إداري بحت
3. الخطورة: high للطوارئ | medium للقرارات المهمة | normal للعادي
4. ملخص لكل دور (principal, teacher, parent, student, security, nurse, secretary)

أجب بـ JSON array فقط:
[{
  "title_ar": "...",
  "title_en": "...",
  "body_ar": "...",
  "category": "...",
  "audience": ["all"],
  "severity": "normal",
  "content_principal": "...",
  "content_teacher": "...",
  "content_parent": "...",
  "content_student": "...",
  "content_security": "...",
  "content_nurse": "...",
  "content_secretary": "..."
}]

النص: ${rawText}`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
        }),
      }
    );
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return [];
    return JSON.parse(m[0]);
  } catch { return []; }
}

// ── ACTION: crawl ─────────────────────────────────────────────
async function doCrawl(schoolId?: string) {
  let countryId = 'UAE';
  if (schoolId) {
    const { data: school } = await sb.from('schools').select('country_id').eq('id', schoolId).single();
    if (school?.country_id) countryId = school.country_id;
  }
  const sources = COUNTRY_SOURCES[countryId] || COUNTRY_SOURCES['UAE'];
  let totalStored = 0;
  const results: any[] = [];

  for (const src of sources) {
    const rawText = await fetchSource(src);
    if (!rawText || rawText.length < 100) { results.push({ source: src.name, status: 'empty' }); continue; }
    const items = await geminiClassify(rawText, src.name, countryId);
    for (const item of items) {
      const { data: existing } = await sb.from('education_news')
        .select('id').eq('country_id', countryId).eq('title_ar', item.title_ar)
        .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString()).limit(1);
      if (existing?.length) continue;
      const category = item.category || detectCategory(item.title_ar + ' ' + item.body_ar);
      const audience = item.audience?.length ? item.audience : DEFAULT_AUDIENCE[category] || ['all'];
      const { error } = await sb.from('education_news').insert({
        country_id: countryId, school_id: schoolId || null,
        source_type: 'official', category, audience,
        severity: item.severity || 'normal',
        title_ar: item.title_ar?.substring(0, 200),
        title_en: item.title_en?.substring(0, 200),
        body_ar: item.body_ar?.substring(0, 1000),
        source_name: src.name, source_url: src.url,
        content_principal: item.content_principal?.substring(0, 500),
        content_teacher:   item.content_teacher?.substring(0, 500),
        content_parent:    item.content_parent?.substring(0, 500),
        content_student:   item.content_student?.substring(0, 500),
        content_security:  item.content_security?.substring(0, 300),
        content_nurse:     item.content_nurse?.substring(0, 300),
        content_secretary: item.content_secretary?.substring(0, 300),
        publisher_role: 'system', is_active: true,
      });
      if (!error) totalStored++;
    }
    results.push({ source: src.name, items: items.length });
  }

  // Auto-expire official news older than 30 days
  await sb.from('education_news')
    .update({ is_active: false })
    .lt('published_at', new Date(Date.now() - 30 * 24 * 3600_000).toISOString())
    .eq('source_type', 'official');

  return { ok: true, country: countryId, total_stored: totalStored, results };
}

// ── ACTION: fetch — role-filtered news + class announcements ──
async function doFetch(role: string, schoolId?: string, classId?: string, limit = 20) {
  let countryId = 'UAE';
  if (schoolId) {
    const { data: school } = await sb.from('schools').select('country_id').eq('id', schoolId).single();
    if (school?.country_id) countryId = school.country_id;
  }

  const allowed = ROLE_AUDIENCE[role] || ['all'];
  const { data: news } = await sb.from('education_news')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_archived', false)
    .or(allowed.map(a => `audience.cs.{"${a}"}`).join(','))
    .order('is_pinned', { ascending: false })
    .order('severity', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  // Map content per role
  const contentField: Record<string, string> = {
    principal: 'content_principal', admin: 'content_principal',
    teacher: 'content_teacher', specialist: 'content_teacher',
    social_worker: 'content_teacher', observer: 'content_principal',
    parent: 'content_parent', student: 'content_student',
    security: 'content_security', nurse: 'content_nurse',
    secretary: 'content_secretary', technician: 'content_secretary',
  };
  const cf = contentField[role] || 'body_ar';

  const mappedNews = (news || []).map(item => ({
    id: item.id, type: 'news',
    category: item.category, severity: item.severity,
    source_type: item.source_type, source_name: item.source_name, source_url: item.source_url,
    title: item.title_ar, title_en: item.title_en, body: item.body_ar,
    content: (item[cf] || item.body_ar || item.title_ar),
    is_pinned: item.is_pinned, published_at: item.published_at,
    vibration_level: item.vibration_level, requires_ack: item.requires_ack,
    ack_count: item.ack_count,
  }));

  // Class announcements (for teacher, parent, student)
  let classAnns: any[] = [];
  if (classId && ['teacher','parent','student'].includes(role)) {
    const audienceFilter = role === 'teacher' ? ['students','parents','both'] : ['both', role === 'parent' ? 'parents' : 'students'];
    const { data: anns } = await sb.from('class_announcements')
      .select('*')
      .contains('class_ids', [classId])
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(10);
    classAnns = (anns || []).map(a => ({
      id: a.id, type: 'class_ann',
      category: a.ann_type, severity: a.severity,
      source_type: 'class', source_name: a.teacher_name || 'معلم/ة',
      title: a.title_ar, body: a.body_ar,
      content: a.body_ar,
      unit_name: a.unit_name, lesson_title: a.lesson_title,
      pages_from: a.pages_from, pages_to: a.pages_to,
      keywords: a.keywords, due_date: a.due_date,
      vibration_level: a.vibration_level, requires_ack: a.requires_ack,
      published_at: a.published_at,
    }));
  }

  return {
    ok: true, role, country: countryId,
    news: [...mappedNews, ...classAnns],
    news_count: mappedNews.length,
    class_ann_count: classAnns.length,
  };
}

// ── ACTION: post — internal school news (principal/admin) ────
async function doPost(body: any, schoolId: string, publisherId: string, publisherRole: string) {
  // A-D check: Level B — principal/admin only for school-wide
  if (!['principal','admin'].includes(publisherRole)) {
    return { ok: false, error: 'غير مصرح — نشر الأخبار المدرسية للمدير/ة والإدارة فقط', ad_level: 'B' };
  }
  const { title_ar, body_ar, category, audience, severity, vibration_level,
          content_teacher, content_parent, content_student, content_security,
          content_nurse, content_secretary, class_ids, is_pinned, scheduled_at,
          expires_at, sms_fallback, requires_ack } = body;

  if (!title_ar || !category) return { ok: false, error: 'title_ar و category مطلوبان' };

  const { data, error } = await sb.from('education_news').insert({
    country_id: 'UAE', school_id: schoolId,
    source_type: 'internal', category: category || 'academic',
    audience: audience || ['staff'],
    severity: severity || 'normal',
    title_ar: title_ar.substring(0, 200),
    body_ar: body_ar?.substring(0, 1000),
    source_name: 'إدارة المدرسة',
    publisher_role: publisherRole, publisher_id: publisherId,
    class_ids: class_ids || null,
    is_pinned: is_pinned || false,
    scheduled_at: scheduled_at || null,
    expires_at: expires_at || null,
    sms_fallback: sms_fallback || false,
    requires_ack: requires_ack || false,
    vibration_level: vibration_level || 'none',
    content_principal: body_ar, content_teacher, content_parent,
    content_student, content_security, content_nurse, content_secretary,
    is_active: !scheduled_at, // draft if scheduled
  }).select('id').single();

  if (error) return { ok: false, error: error.message };

  // Audit log
  await sb.from('news_audit_log').insert({
    news_id: data.id, event_type: 'published',
    actor_id: publisherId, actor_role: publisherRole,
    payload: { title_ar, category, audience, severity },
  });

  return { ok: true, news_id: data.id, message: 'تم النشر بنجاح' };
}

// ── ACTION: post_class_ann — teacher announcement ────────────
async function doPostClassAnn(body: any, teacherId: string, teacherName: string) {
  // A-D Level B: teacher can post to their own classes only
  const { title_ar, body_ar, class_ids, ann_type, subject_name,
          unit_name, lesson_title, pages_from, pages_to,
          keywords, exam_method, survey_url, due_date,
          audience, severity, school_id, expires_at } = body;

  if (!title_ar || !class_ids?.length || !ann_type) {
    return { ok: false, error: 'title_ar, class_ids, ann_type مطلوبة' };
  }

  // Validate teacher teaches these classes (check timetable)
  // For now: trust the session (Edge Function caller validates JWT)

  // Gemini: enhance content for student vs parent view
  let content_enhanced: any = {};
  if (GEMINI_KEY && body_ar) {
    try {
      const prompt = `
أنت مساعد تعليمي. المعلم/ة نشر الإعلان التالي للصف ${class_ids[0]}:
النوع: ${ann_type} | المادة: ${subject_name} | ${body_ar}

اكتب نسختين:
1. للطالب/ة: مختصرة وواضحة، يفهم/تفهم فوراً ماذا يجب أن يفعل/تفعل
2. لولي/ة الأمر: محترفة وتتضمن التفاصيل الكاملة

أجب JSON: {"student":"...","parent":"..."}`;
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.3, maxOutputTokens:500} }) }
      );
      const d = await r.json();
      const t = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const m = t.match(/\{[\s\S]*\}/);
      if (m) content_enhanced = JSON.parse(m[0]);
    } catch { /* use body_ar for both */ }
  }

  const { data, error } = await sb.from('class_announcements').insert({
    school_id: school_id || null,
    teacher_id: teacherId, teacher_name: teacherName,
    subject_name, class_ids, ann_type,
    title_ar: title_ar.substring(0, 200), body_ar: body_ar?.substring(0, 1000),
    unit_name, lesson_title, pages_from, pages_to,
    keywords: keywords || [], exam_method: exam_method || null,
    survey_url: survey_url || null, due_date: due_date || null,
    audience: audience || 'both', severity: severity || 'normal',
    requires_ack: severity === 'high',
    expires_at: expires_at || null, is_active: true,
  }).select('id').single();

  if (error) return { ok: false, error: error.message };

  // Audit log
  await sb.from('news_audit_log').insert({
    ann_id: data.id, event_type: 'published',
    actor_id: teacherId, actor_role: 'teacher',
    payload: { ann_type, class_ids, title_ar },
  });

  return {
    ok: true, ann_id: data.id,
    content_enhanced,
    message: 'تم نشر الإعلان للصف بنجاح',
  };
}

// ── ACTION: acknowledge ───────────────────────────────────────
async function doAcknowledge(body: any, userId: string) {
  const { news_id, ann_id, user_role, user_name, school_id } = body;
  if (!news_id && !ann_id) return { ok: false, error: 'news_id أو ann_id مطلوب' };

  if (news_id) {
    const { error } = await sb.from('news_acknowledgments').upsert(
      { news_id, user_id: userId, user_role, user_name, school_id },
      { onConflict: 'news_id,user_id' }
    );
    if (error) return { ok: false, error: error.message };
    await sb.from('news_audit_log').insert({
      news_id, event_type: 'acknowledged',
      actor_id: userId, actor_role: user_role, actor_name: user_name,
    });
  }

  if (ann_id) {
    const { error } = await sb.from('class_ann_acknowledgments').upsert(
      { ann_id, user_id: userId, user_role, user_name },
      { onConflict: 'ann_id,user_id' }
    );
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true, message: 'تم تسجيل الاستلام' };
}

// ── ACTION: get_ack_status ────────────────────────────────────
async function doGetAckStatus(newsId: string) {
  const { data: acks } = await sb.from('news_acknowledgments')
    .select('user_id, user_role, user_name, acked_at')
    .eq('news_id', newsId)
    .order('acked_at');

  const { data: news } = await sb.from('education_news')
    .select('ack_count, audience, requires_ack, title_ar')
    .eq('id', newsId).single();

  return { ok: true, news_id: newsId, news_title: news?.title_ar,
    ack_count: news?.ack_count || 0, acknowledgments: acks || [] };
}

// ── ACTION: ai_semester_plan ──────────────────────────────────
async function doAiSemesterPlan(body: any) {
  if (!GEMINI_KEY) return { ok: false, error: 'Gemini API key missing' };

  const { subject_name, class_id, term, total_weeks, teaching_weeks,
          periods_per_week, units_input, country_id, holidays } = body;

  const prompt = `
أنت مخطط مناهج تربوي خبير. المعلم/ة تريد توزيع منهج "${subject_name}" للصف ${class_id}، الفصل ${term}.

المعطيات:
- إجمالي الأسابيع: ${total_weeks}
- أسابيع التدريس الفعلية (بعد الإجازات والاختبارات): ${teaching_weeks || (total_weeks - 3)}
- الحصص في الأسبوع: ${periods_per_week || 4}
- الوحدات المُدخَلة: ${JSON.stringify(units_input || [])}
${holidays ? `- الإجازات والأسابيع المحجوزة: ${JSON.stringify(holidays)}` : ''}

وزّع المنهج بشكل متوازن ومدروس. لكل وحدة حدّد:
- أسبوع البداية وأسبوع النهاية
- عدد الأسابيع المخصصة
- عدد الدروس المتوقعة
- ملاحظة تعليمية مختصرة

ثم اقترح 3 أسابيع لمراجعة ومراجعة الاختبارات.

أجب JSON:
{
  "total_teaching_weeks": ${teaching_weeks || (total_weeks - 3)},
  "units": [
    {
      "unit_num": 1,
      "unit_name": "...",
      "week_start": 1,
      "week_end": 3,
      "weeks_allocated": 3,
      "lessons_count": 12,
      "pages_from": 1,
      "pages_to": 40,
      "note": "...",
      "color": "#6C3DD6"
    }
  ],
  "review_weeks": [8, 12, 15],
  "ai_notes": "..."
}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.3, maxOutputTokens:2000} }) }
    );
    const d = await r.json();
    const t = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return { ok: false, error: 'لم يُنتج Gemini خطة قابلة للقراءة' };
    return { ok: true, plan: JSON.parse(m[0]) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── ACTION: ai_conflict_check ─────────────────────────────────
async function doAiConflictCheck(body: any) {
  const { track_id, class_id, week_number } = body;

  // Get all items for this week
  const { data: items } = await sb.from('weekly_track_items')
    .select('*')
    .eq('track_id', track_id)
    .order('day_of_week').order('position');

  if (!items?.length) return { ok: true, conflicts: [], load_scores: {} };

  // Group by day
  const byDay: Record<number, any[]> = {};
  for (const item of items) {
    if (!byDay[item.day_of_week]) byDay[item.day_of_week] = [];
    byDay[item.day_of_week].push(item);
  }

  const conflicts: any[] = [];
  const load_scores: Record<number, number> = {};
  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];

  for (const [dayStr, dayItems] of Object.entries(byDay)) {
    const day = Number(dayStr);
    const exams = dayItems.filter(i => i.item_type === 'exam' || i.item_type === 'quiz');
    const load = Math.min(10, dayItems.reduce((acc, i) => {
      const weights: Record<string, number> = { exam: 4, quiz: 3, homework: 2, project: 3, activity: 1, lesson: 1, other: 1 };
      return acc + (weights[i.item_type] || 1);
    }, 0));
    load_scores[day] = load;

    if (exams.length >= 2) {
      conflicts.push({
        day, day_name: dayNames[day],
        type: 'multi_exam',
        message: `يوم ${dayNames[day]}: ${exams.length} اختبارات في نفس اليوم — يُنصح بتوزيعها`,
        items: exams.map(e => ({ id: e.id, subject: e.subject_name, title: e.title_ar })),
        severity: exams.length >= 3 ? 'high' : 'medium',
      });
    }

    if (load >= 8) {
      conflicts.push({
        day, day_name: dayNames[day],
        type: 'overload',
        message: `يوم ${dayNames[day]}: حمل ثقيل على الطلاب/ات (${load}/10) — قد يؤثر على الأداء`,
        severity: load >= 9 ? 'high' : 'medium',
      });
    }
  }

  // Update conflict flags in DB
  for (const conflict of conflicts) {
    for (const item of (conflict.items || [])) {
      await sb.from('weekly_track_items')
        .update({ ai_conflict_flag: true, ai_conflict_note: conflict.message, ai_load_score: load_scores[conflict.day] })
        .eq('id', item.id);
    }
  }

  return { ok: true, conflicts, load_scores, week_number, class_id };
}

// ── Main Handler ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const body      = req.method === 'POST' ? await req.json() : {};
    const action    = body.action || 'fetch';
    const role      = body.role || 'principal';
    const schoolId  = body.school_id;
    const classId   = body.class_id;
    const limit     = Number(body.limit) || 20;

    // Extract user from JWT if present
    let userId = body.user_id || null;
    let userName = body.user_name || null;
    const authHeader = req.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ') && !userId) {
      try {
        const { data: { user } } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id || null;
      } catch { /* anon */ }
    }

    let result: any;

    switch (action) {
      case 'crawl':
        result = await doCrawl(schoolId);
        break;
      case 'fetch':
        result = await doFetch(role, schoolId, classId, limit);
        break;
      case 'post':
        if (!schoolId) return new Response(JSON.stringify({ ok: false, error: 'school_id مطلوب' }), { headers: CORS, status: 400 });
        result = await doPost(body, schoolId, userId, role);
        break;
      case 'post_class_ann':
        if (!userId) return new Response(JSON.stringify({ ok: false, error: 'يجب تسجيل الدخول' }), { headers: CORS, status: 401 });
        result = await doPostClassAnn(body, userId, userName || 'معلم/ة');
        break;
      case 'acknowledge':
        if (!userId) return new Response(JSON.stringify({ ok: false, error: 'يجب تسجيل الدخول' }), { headers: CORS, status: 401 });
        result = await doAcknowledge(body, userId);
        break;
      case 'get_ack_status':
        result = await doGetAckStatus(body.news_id);
        break;
      case 'ai_semester_plan':
        result = await doAiSemesterPlan(body);
        break;
      case 'ai_conflict_check':
        result = await doAiConflictCheck(body);
        break;
      default:
        result = { ok: false, error: `Action unknown: ${action}` };
    }

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    console.error('[smart-news-engine v2]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { headers: CORS, status: 500 });
  }
});
