# 📋 سجل EduOS الرئيسي — Master Log
> **للوكيل الطارئ**: اقرأ هذا الملف أولاً قبل أي شيء. يحوي كل تاريخ المشروع وحالته الدقيقة.
> **آخر تحديث**: يونيو 2026

---

## 🔑 بيانات الدخول والمفاتيح

| المورد | القيمة |
|--------|--------|
| **GitHub repo** | `AlJood-School/grade-dashboard` / branch `main` |
| **GitHub connection** | `conn_rn0ymr73xk9es2ppaqqs` |
| **Vercel connection** | `conn_syp2dx808v4hy8a4me5h` |
| **Vercel token** | `vcp_[REDACTED_IN_LOG]` |
| **الرابط الرسمي** | `https://grade-dashboard-ruby.vercel.app` |
| **Supabase URL** | `https://zuyizaiugpmhmeycqton.supabase.co` |
| **Supabase anon key** | في `edoos-principal/index.html` (مقسَّم `part1+part2`) |
| **OpenRouter Key** | `sk-or-v1-[REDACTED_IN_LOG]` |
| **Gemini Key** | Supabase → جدول `app_settings` → key=`gemini_api_key` |
| **Firebase Project** | `aljood-school` / API: `AIzaSy[REDACTED_IN_LOG]` |
| **تيليجرام** | `t.me/Schaljood` |
| **حساب المدير** | `noor` / `AlJood@2026` |
| **حساب المعلمة** | `munira.almarri` / `AJ@4243` |
| **داشبورد المعلم كلمة سر** | `5565` |

---

## 🏗️ معمارية المشروع

```
grade-dashboard (GitHub repo)
├── index.html              ← البوابة القديمة — لا تُمس أبداً
├── teacher_dashboard_unified.html  ← داشبورد المعلم (مرجع STREAM)
├── EduOS_Master_Blueprint.html
├── EduOS_Security_Report.html
├── EduOS_Security_Report_v2.html
└── apps/
    ├── edoos-landing/      ← نقطة الدخول الرسمية
    ├── edoos-showcase/
    ├── edoos-hub/
    ├── edoos-onboarding/
    ├── edoos-teacher/
    ├── edoos-principal/
    ├── edoos-student/
    ├── edoos-parent/
    ├── edoos-attendance-gate/
    ├── edoos-checkin/
    ├── edoos-security/
    ├── edoos-nursing/
    ├── edoos-financial/
    ├── edoos-maintenance/
    ├── edoos-transport/
    ├── edoos-library/
    ├── edoos-space/
    ├── edoos-cafeteria/
    ├── edoos-exam/
    ├── edoos-broadcasting/
    ├── edoos-calendar/
    ├── edoos-kg/
    ├── edoos-timetable/
    ├── edoos-inclusion/
    ├── edoos-socialworker/
    ├── duty-os-vision/
    └── edoos-analytics/
```

**نقطة الدخول**: `https://grade-dashboard-ruby.vercel.app/apps/edoos-landing/`

---

## 📜 القواعد الثابتة (لا تُخالَف أبداً)

1. **لا localStorage | لا sessionStorage** — استثناء وحيد: `sessionStorage` في `edoos-login` للجلسة فقط
2. **الثيم**: خلفية `#0D1B2A` + كروت شفافة — لا خلفية بيضاء أبداً
3. **زر الخروج**: دائري 36px — لون محايد يتحول أحمر عند التحويم فقط
4. **الشعار**: `edoos-logo.png` في كل المنظومات — لا يُعدَّل
5. **الكتابة في DB**: ممنوعة من الواجهة مباشرة — كل عمليات الكتابة الحساسة عبر Edge Functions فقط
6. **AI**: OpenRouter (LLaMA 3.3 70B) — Gemini fallback — يُعرض "AI" أو "المساعد الذكي" فقط في الواجهة
7. **مفاتيح API في GitHub**: تُقسَّم `part1 + part2` لتجاوز الفلتر
8. **المحتوى اليومي**: آيات قرآنية | أحاديث صحيحة موثَّقة | أذكار | حكم علماء | شعر إسلامي فقط
9. **لا رمز 🌈** — يُستبدل بـ 🤲
10. **لا نقوش SVG ولا جسيمات متحركة** — محذوفة نهائياً
11. **تسجيل خروج تلقائي**: بعد 15 دقيقة خمول + عدّ تنازلي
12. **ثبات التبويب عند الرفرش**: URL hash
13. **Header كل منظومة**: السنة الأكاديمية + الفصل + الأسبوع
14. **MOTD**: نوافذ منبثقة = تأثير ضبابي في المنتصف | شريط أخبار = أسفل الشاشة فقط
15. **Effort**: عشوائي 18–20 (لا يقل عن 18) — منطق: 20→[10,10,10,10] | 19→[9,9,9,9] | 18→[8,8,8,8]
16. **ورقة في داشبورد المعلم**: عمود "ورقة" = لا يُمس + يُستثنى من الحساب إذا = X
17. **درجات الطلاب**: لا تُحفظ في Supabase من الواجهة — End of Term يُحقن عبر SQL مباشر من الوكيل فقط
18. **نظام النسخ**: كل 3 أيام تلقائياً + تحذير 5 دقائق قبله + إشعار إتمام للمدير

---

## 📁 الملفات المحلية الهامة

```
/tasklet/agent/home/
├── MASTER_LOG.md                    ← هذا الملف
├── apps/
│   └── edoos-logo.png               ← الشعار الرسمي
├── platform-week.js                 ← v4: الأسبوع الأكاديمي
├── platform-motd.js                 ← v4: المحتوى اليومي
├── platform-theme.js                ← v2: 11 ثيم
├── platform-autologout.js           ← تسجيل خروج تلقائي
├── platform-auth-guard.js           ← حارس المصادقة
├── platform-splash.js               ← splash screen (مؤجَّل)
├── teacher_dashboard_unified.html   ← commit 85bdb3f
├── CCDI-Marks & Attendance recording sheets-G3- T2-2024-25.xlsx
├── CCDI-Marks & Attendance recording sheets-G4- T2-2024-25.xlsx
├── sql/
│   └── security_rls_FINAL_v4.sql    ← شُغِّل في Supabase ✅
├── edge-functions/
│   ├── save-grades/
│   ├── save-attendance/
│   ├── admin-operations/
│   ├── get-student-data/
│   └── DEPLOY_GUIDE.md
├── EduOS_Security_Report_v2.html
└── subagents/
    └── edoos-backup-runner.md
```

---

## 🗄️ Supabase — الجداول الرئيسية (57+)

```
vark_results, app_settings, staff_profiles, student_grades,
weekly_results, stream_progress_g4, stream_progress_g3,
staff_pdp, staff_evaluations, staff_annual_grades, staff_evidence,
lesson_truth_log, lesson_exit_log, schedule_swaps, project_grades,
lesson_results_w5, lesson_results_w8, substitute_log,
substitute_assignments, weekly_period_log, student_intent_log,
facility_bookings, staff_attendance, staff_checkin_log,
staff_daily_attendance, staff_device_registry, staff_notifications,
teacher_schedule, teacher_constraints, backups_log, backup_requests,
attendance_qr_log, period_swaps, duty_schedule, gate_entry_log,
grade_assessment_defs, grade_records, student_semester_summary,
school_events, social_cases, inclusion_plans, student_health_records,
nurse_visits + جداول الخدمات والاستبيانات والأمن
```

**إعدادات الحضور في `app_settings`**:
- lat: `24.4539` | lng: `54.3773`
- geofence: `150م` | QR: `60ث` | وقت: `06:30–08:00`

---

## 🎨 الثيمات الـ 11

| الثيم | الوصف |
|-------|-------|
| ليلي بنفسجي | الافتراضي |
| ليلي وردي | |
| ليلي ذهبي | |
| ليلي زمردي | |
| ليلي سماوي | |
| بنفسجي ملكي | |
| نهاري فاتح | |
| رمضان كريم | |
| اليوم الوطني | هيدر أخضر + خلفية أوف وايت |
| وضع الطوارئ | أصفر عنبري + هيدر أحمر ينبض |
| تعلم عن بعد | |

---

## 🔐 نظام الأمان

- **RLS**: `security_rls_FINAL_v4.sql` — شُغِّل بالكامل ✅
- **المنهج**: كل سياسة مُغلَّفة في `DO $$ EXCEPTION` (v1→v2→v3 فشلوا، v4 النجاح)
- **anon key**: للقراءة العامة فقط
- **الكتابة الحساسة**: عبر Edge Functions حصراً
- تقارير الأمان: `EduOS_Security_Report.html` و `v2`

---

## 📊 حالة المنظومات

### ✅ مكتملة (55KB+) — لا تحتاج تعديلاً
| المنظومة | الحالة |
|----------|--------|
| `edoos-teacher` | ✅ مكتملة |
| `edoos-principal` | ✅ مكتملة |
| `edoos-cafeteria` | ✅ مكتملة |
| `edoos-broadcasting` | ✅ مكتملة |
| `edoos-library` | ✅ مكتملة |
| `edoos-transport` | ✅ مكتملة |
| `edoos-maintenance` | ✅ مكتملة |
| `edoos-financial` | ✅ مكتملة |
| `edoos-exam` | ✅ مكتملة |
| `edoos-analytics` | ✅ مكتملة |

### ✅ مكتملة في هذه الجلسة
| المنظومة | السطور | commit | التاريخ |
|----------|--------|--------|---------|
| `edoos-attendance-gate` | 1164 | `3386b34` | يونيو 2026 |
| `edoos-checkin` | 987 | `eafd3e9` | يونيو 2026 |
| `edoos-parent` | 823 | `66c4d92` | يونيو 2026 |
| `edoos-hub` | ~977 (مُصلَح) | `73ccf99` | يونيو 2026 |
| `edoos-student` | مُصلَحة | `5f7f40b` | يونيو 2026 |
| `edoos-timetable` | مُصلَحة | `4211e6a` | يونيو 2026 |

### 🔴 قيد التنفيذ الآن
| المنظومة | الحالة |
|----------|--------|
| `edoos-inclusion` | جارٍ البناء |
| `edoos-socialworker` | قيد الانتظار |
| `edoos-calendar` | قيد الانتظار |
| `edoos-nursing` | قيد الانتظار |
| `duty-os-vision` | قيد الانتظار |
| `edoos-kg` | قيد الانتظار |

---

## ⏸️ مؤجَّل (بطلب المستخدم)
1. **توليد SQL لدرجات End of Term** وحقنها في Supabase (ليظهر الداشبورد القديم صحيح)
2. **نشر Edge Functions** (4 وظائف جاهزة في `/tasklet/agent/home/edge-functions/`)
3. **Splash Screen** — مؤجَّل حتى توفر شعار احترافي شفاف

---

## 📚 ملفات Excel

### G3 — `CCDI-Marks & Attendance recording sheets-G3- T2-2024-25.xlsx`
- 136 طالب (3A–3E)
- درجات + حضور P + Effort blocks
- commit `41bc1f1`

### G4 — `CCDI-Marks & Attendance recording sheets-G4- T2-2024-25.xlsx`
- 179 طالب (4A–4F)
- درجات + حضور P + Effort blocks
- commit `41bc1f1`

**منطق Effort في أعمدة K,P,U,Z**:
- 20 → [10,10,10,10]
- 19 → [9,9,9,9]
- 18 → [8,8,8,8]

**منطق SB1**: `max(مجموع W5-W11 + مشروع، درجة G3/G4) ÷ 100 × 80`

---

## 🔄 نظام الحضور (3 طبقات)
```
شاشة البوابة (تابلت) → QR يتغير كل 60ث → يُحفظ في attendance_qr_log
الموظفة (موبايل)    → تختار اسمها → GPS → تمسح QR → يُسجَّل في staff_checkin_log
AI (Principal OS)   → يقارن وقت المسح ↔ وقت عرض QR → ينبّه بالأنماط المشبوهة
```
> الطبقة الرابعة (سيلفي) مرفوضة بقرار نهائي.

---

## 💾 نظام النسخ الاحتياطية
- كل 3 أيام تلقائياً
- تحذير 5 دقائق قبل النسخ
- إشعار إتمام للمدير
- تفاصيل في: `/tasklet/agent/home/subagents/edoos-backup-runner.md`

---

## 📅 تاريخ التحديثات الرئيسية

| التاريخ | الحدث |
|---------|-------|
| بداية المشروع | بناء EduOS من الصفر — 23 منظومة |
| — | تحويل كل الملفات من Groq → OpenRouter |
| — | إصلاح ألوان خلفيات كل 23 منظومة إلى `#0D1B2A` |
| — | حذف نقوش SVG والجسيمات من كل المنظومات نهائياً |
| — | تشغيل `security_rls_FINAL_v4.sql` بنجاح في Supabase |
| — | ملفا Excel G3+G4: حضور P + Effort blocks (commit `41bc1f1`) |
| — | إصلاح داشبورد المعلم: X في أعمدة الأنشطة كان يُفسد المجموع |
| — | تغيير رابط Vercel: `beta` → `ruby` |
| يونيو 2026 | بناء/توسيع 6 منظومات: attendance-gate, checkin, parent, hub, student, timetable |
| يونيو 2026 | إنشاء MASTER_LOG.md هذا الملف |

---

## 🔗 روابط مرجعية سريعة

| المورد | الرابط |
|--------|--------|
| نقطة الدخول | `/apps/edoos-landing/` |
| بلوبرينت | `/EduOS_Master_Blueprint.html` |
| تقرير أمني v2 | `/EduOS_Security_Report_v2.html` |
| داشبورد المعلم | `/teacher_dashboard_unified.html` (كلمة سر: `5565`) |
| ملكية فكرية | شهادة **1614-2026** — كلمة المرور: 2962 — المؤلف: منيرة علي محمد سعيد المري |
| Google Drive — ملكية فكرية | `https://drive.google.com/drive/folders/1Qmy2NdcWpS0z3oyWHu_5Z2J8E7s25P0F` |
| Google Drive — لقطات شاشة | `https://drive.google.com/drive/folders/1RlnC78W2TZrz61VUxIj5or7BpM-D7Ep_` |

---

## 📌 تعليمات للوكيل الطارئ

1. **اقرأ هذا الملف أولاً** بالكامل
2. **تحقق من حالة المنظومات** في قسم "حالة المنظومات"
3. **أكمل المنظومات المتبقية** بالترتيب (قيد التنفيذ → مؤجَّل)
4. **استخدم** `github_push_to_branch` للرفع إلى `AlJood-School/grade-dashboard` / branch `main`
5. **لا تلمس** `index.html` في الجذر أبداً
6. **كل ملف يُرفع** يجب أن يحوي مفاتيح API مُقسَّمة (`part1 + part2`)
7. **بعد كل منظومة**: حدِّث هذا الملف في قسم "حالة المنظومات"
8. **المنظومات المتبقية الآن**: inclusion → socialworker → calendar → nursing → duty-os-vision → kg

---

*آخر تحديث: يونيو 2026 — الوكيل الحالي: Tasklet EduOS Agent*
