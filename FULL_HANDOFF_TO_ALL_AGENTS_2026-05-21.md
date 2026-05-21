# 📋 ملف التسليم الشامل — بوابة الجود الذكية
## تاريخ الإنشاء: 21 مايو 2026 — نهاية جلسات Agent #1

> **⚠️ هذا الملف هو المرجع الوحيد الكامل للمشروع.**
> يُلغي ويستبدل جميع ملفات HANDOFF السابقة.
> آخر تحديث: 21/05/2026 الساعة 14:37 GST

---

## 1. هوية المشروع

| البيان | القيمة |
|--------|--------|
| **اسم البوابة الرسمي** | بوابة الجود الذكية لإدارة **المعلومات** المدرسية |
| **صاحبة المشروع** | منيرة علي محمد سعيد الغرينيق المري |
| **المسمى الوظيفي** | معلمة CCDI & AI |
| **المدرسة** | روضة ومدرسة الجود / Al Jood — مدينة العين، إمارة أبوظبي |
| **الإيميل الوزاري** | `munira.almarri@moe.sch.ae` |
| **حقوق النشر** | © منيرة علي المري 2026 |
| **GitHub Repo** | `AlJood-School/grade-dashboard` — branch: main |
| **الموقع الحي** | `https://grade-dashboard-beta.vercel.app` |

---

## 2. البنية التقنية المُعتمدة

```
Frontend:  HTML/CSS/JS — ملفات ثابتة في GitHub
Backend:   Vercel (API Routes + Cron Jobs)
Database:  Supabase (PostgreSQL) — المصدر الوحيد للبيانات
Auth:      Vercel API /api/check_staff_auth.js (service_role key)
Firebase:  مخصص للـ Changelog فقط (changelog_shared collection)
```

### ⚠️ قواعد معمارية حرجة:
- **Firebase ممنوع** عدا `changelog_shared` — كل شيء Supabase
- **localStorage ممنوع** — كل شيء sessionStorage أو Supabase
- **index.html لا يُرفع مستقلاً** — يُنسَّق مع الـ Agent الآخر
- **data/staff.json يحتوي hash قديمة** — لا تُستخدم للمصادقة
- **بعد كل PR يُعدِّل index.html** → تحقق من JavaScript: `node -e` قبل الدمج

---

## 3. Workflow الصحيح للملفات

### teacher_dashboard_unified.html:
```
1. curl من GitHub → /tmp/
2. التعديل على /tmp/
3. نسخ → /agent/home/td_upload.html
4. الرفع من /agent/home/td_upload.html
5. التحقق عبر GitHub API (وليس curl)
```

### index.html:
- تُنسَّق مع الـ Agent الآخر دائماً
- النسخة الأخيرة المرفوعة: بعد PR #35

---

## 4. تقسيم العمل بين الـ Agents

| الملف | المسؤول |
|-------|---------|
| `stream_lesson_g3.html` | ✋ Agent الآخر (Agent 2) |
| `stream_lesson_g4.html` | ✋ Agent الآخر (Agent 2) |
| `observer.html` | ✋ Agent الآخر (Agent 2) |
| `observer_entry.html` | ✋ Agent الآخر (Agent 2) |
| `index.html` | 🤝 تنسيق مشترك |
| `teacher_dashboard_unified.html` | ✅ Agent 1 |
| `lesson_observation.html` | ✅ Agent 1 |
| `weekly_lessons.html` | ✅ Agent 1 |
| `worksheet.html` | ✅ Agent 1 |

---

## 5. بيانات الدخول

| الدور | Username | كلمة المرور | ملاحظة |
|-------|---------|-------------|--------|
| مديرة النظام — منيرة | `noor` | `AlJood@2026` | must_change_password=false |
| معلمة CCDI&AI — منيرة | `munira.almarri` | `AJ@4243` | |
| مديرة (حليمة حسن) | `halima.almaamari` | `AJ@9458` | |
| نائبة (فاطمة العبيدلي) | `fatima-ya.alobaidli` | `AJ@2612` | role: vice_principal |
| معلمة (ابتسام القاسمي) | `ibtesam.alqasemi` | `AJ@3076` | T036 |
| أخصائية (نورة الأحبابي) | `noura-aa.alahbabi` | `AJ@1604` | role: admin_staff |
| مسؤولة مالية (مزنة) | `mezna-jm.alahbabi` | `AJ@3376` | |
| ولي الأمر | رقم بطاقة ولي الأمر | أول رقم هاتف | من parent_credentials |

### تجاوز شاشة الصيانة في المتصفح:
```js
document.getElementById('maintenanceScreen').remove();
document.getElementById('loginScreen').style.display = 'flex';
document.getElementById('usernameInput').value = 'noor';
document.getElementById('passwordInput').value = 'AlJood@2026';
doLogin();
```
> ⚠️ `doLogin()` تقرأ من DOM مباشرة — يجب ضبط الحقلين قبل الاستدعاء

---

## 6. Supabase

| البيان | القيمة |
|--------|--------|
| **Project URL** | `https://zuyizaiugpmhmeycqton.supabase.co` |
| **anon key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODgyNDAsImV4cCI6MjA5NDY2NDI0MH0.FqOUqiR7GfttAEI8NY3bbOwFPnupxBsHMgYJCNT68PI` |
| **service_role key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA4ODI0MCwiZXhwIjoyMDk0NjY0MjQwfQ.DHOqgrkexBLuywBObBi89XazMnaZxbtv3XIxQwAe-_o` |
| **DB Password** | `AlJoodAdmin2026` |

### جداول Supabase الحالية وحالتها:

| الجدول | السجلات | ملاحظة |
|--------|---------|--------|
| `staff` | 103 | + job_title column |
| `staff_passwords` | 104 | |
| `students` | 1,047 | + vark_style + vark_secondary |
| `parent_credentials` | 1,033 | |
| `schedules` | 1,286 | |
| `worksheets` | 31 | |
| `settings` | 5 | |
| `worksheet_templates` | 0 | طبيعي |
| `worksheet_responses` | 0 | طبيعي |
| `sw_cases` | 0 | طبيعي |
| `parent_confirmations` | 0 | طبيعي |
| `leaves` | 0 | بيانات حية ستتراكم |
| `duties` | 0 | بيانات حية ستتراكم |
| باقي الجداول 25+ | 0 | طبيعي |

### ⚠️ RLS Policies — مُضافة بالكامل (21/05/2026):
الجداول التالية لديها anon SELECT policy:
`staff`, `staff_passwords`, `students`, `schedules`, `worksheets`, `worksheet_responses`, `worksheet_templates`, `settings`, `parent_credentials`, `parent_confirmations`, `sw_cases`, `leaves`, `duties`, `notifications`, `login_logs`, `parent_messages`, `meeting_requests`, `parent_notifications`

**قاعدة للمستقبل:** أي جدول جديد → أضف RLS SELECT policy فوراً.

---

## 7. Firebase (Changelog فقط)

| البيان | القيمة |
|--------|--------|
| **Project** | `aljood-school` |
| **Collection** | `changelog_shared` |
| **API Key** | `AIzaSyAShS1jFceLd0jr-fbfz2hEvTFLiwfWloE` |

---

## 8. Vercel

| البيان | القيمة |
|--------|--------|
| **Project** | `grade-dashboard-beta` |
| **URL** | `https://grade-dashboard-beta.vercel.app` |
| **ENV VARS** | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |

### Vercel API Endpoints (مُنشأة):
- `/api/check_staff_auth.js` — التحقق من كلمات المرور بـ service_role (PR #36) ✅
- `/api/cron_*.js` — 4 وظائف Cron (PR #23) ⚠️ لم يُتحقق من عملها فعلياً

---

## 9. سجل جميع الـ PRs المُدمَجة

| PR | التصنيف | ما تم |
|----|---------|-------|
| #13 | auth | نظام دوال dm* (18 دالة) |
| #14 | db | Dual-write لـ absence_followups |
| #15 | auth | نظام كلمات المرور الشامل + SHA-256 |
| #16 | migration | ترحيل Firebase → Supabase (lesson_observation) |
| #17 | bugfix | إصلاح currentRole + setRole |
| #18 | docs | الأدلة v5 الأولى |
| #19 | docs | إصلاح روابط Drive في الأدلة |
| #20 | docs | الأدلة v5 النهائية (4 أدلة) |
| #21 | feature | منشئ أوراق العمل الذكي |
| #22 | feature | صفحة الطالبة student_worksheet.html |
| #23 | automation | Vercel Cron Jobs (4 وظائف) |
| #24 | feature | بوابة ولي الأمر الكاملة داخل index.html |
| #25 | bugfix | إصلاح نص "من لم يسلِّم" |
| #26 | maintenance | تحديث 38 رابط في index.html |
| #27 | feature | "من لم يسلِّموا بعد" في داشبورد المعلمة |
| #28 | feature | صفحة المنظومات SYSTEM 10 و11 |
| #29 | feature | إصلاح نظام الأخصائية + بوابة ولي الأمر |
| #30 | bugfix | إصلاح خطأ JS حرج (syntax error in parent_requests) |
| #31 | feature | تمييز أصحاب الهمم 💙 في داشبورد المعلمة |
| #32 | feature | نظام أصحاب الهمم الشامل — KG→8 — إزالة Firebase |
| #33 | migration | ترحيل localStorage → sessionStorage/Supabase (weekly_lessons + VARK) |
| #34 | migration | ترحيل localStorage → sessionStorage/Supabase في index.html |
| #35 | bugfix | إضافة vice_principal إلى TAB_ROLE_MAP |
| #36 | security | Vercel API server-side auth — حل جذري لمشكلة RLS |

---

## 10. القرارات المُحسَومة نهائياً

### بوابة ولي الأمر:
- مدمجة داخل `index.html` كدور مستقل
- Username: رقم بطاقة ولي الأمر
- Password: أول رقم هاتف مسجل (SHA-256) — من `parent_credentials`
- `parent_portal.html` المنفصلة = **مهجورة**
- دعم أكثر من طالب تحت نفس الرقم ✅

### أصحاب الهمم:
- المصدر: `specialNeeds: true` في `data/students.json` + Supabase `students`
- يظهر في teacher_dashboard_unified.html لجميع الصفوف KG→8 تلقائياً
- **لا Firebase — لا special_needs_students منفصل**

### كلمات المرور:
- نظام SHA-256 الكامل (PR #15)
- التحقق يتم server-side عبر `/api/check_staff_auth.js` (PR #36)
- **لا تستخدم data/staff.json للمصادقة** — يحتوي hash قديمة

### نوع الجدول الثالث:
- الوضع الثالث = "التعلم عن بعد"

### نظام التنبيهات:
- 9 أحداث تولِّد تنبيهاً

### مدة قفل الدخول:
- 3 دقائق / 3 محاولات فاشلة

### الشعار:
- شعار "تربية وتعليم" يظهر في جميع المواضع عدا:
  - login page
  - رأس sidebar
  - وثيقة 06

### البانر الذكي:
- 3 أوضاع: عادي / رمضان / تعلم عن بعد — فوق Hero Card

### رسالة الخروج:
- "بحفظ الرحمن [اسمك]! 👋"

### منيرة المري — حسابان منفصلان:
- مديرة: `noor` (role: admin)
- معلمة: `munira.almarri` (role: teacher)

### فريق الدعم التقني العشرة:
- مستثنون كلياً من الاحتياط

### فصول الطلاب:
- تُكتب بالإنجليزية: A, B (وليس أ، ب)

---

## 11. تحذير حرج للـ Agent الآخر (Agent 2)

⚠️ منذ PR #33 و#34:
- `aljood_role` و`aljood_homeroom` انتقلا من `localStorage` → `sessionStorage`
- إذا كان `observer.html` أو `observer_entry.html` يقرأ منهما:
  → **يجب تغيير `localStorage.getItem` إلى `sessionStorage.getItem`**

---

## 12. ما تبقّى من عمل (لم يُنجَز)

| # | المهمة | الأولوية |
|---|--------|---------|
| 1 | ترحيل `leavesData` → جدول `leaves` في Supabase | متوسطة |
| 2 | ترحيل `duty_history_v2` / `weekly_duty_schedule` → جدول `duties` | متوسطة |
| 3 | التحقق من عمل Vercel Cron Jobs فعلياً (PR #23) | متوسطة |

---

## 13. الملفات المهمة في /agent/home/

| الملف | الوصف |
|-------|-------|
| `index_ls_upload.html` | آخر نسخة جاهزة للرفع من index.html |
| `td_upload.html` | staging file لـ teacher_dashboard_unified.html |
| `api_check_staff_auth.js` | Vercel API endpoint المُنشأ (PR #36) |
| `supabase_config.json` | إعدادات Supabase |
| `staff_initial_passwords.json` | 103 موظفة بكلمات المرور |
| `admin_guide_v5.pdf` | دليل المديرة |
| `teacher_guide_v5.pdf` | دليل المعلمة |
| `principal_guide_v5.pdf` | دليل المديرة التنفيذية |
| `admin_staff_guide_v5.pdf` | دليل الإدارة |
| `backup_index_PR34_*.html` | نسخة احتياطية index.html (قبل PR #34) |
| `backup_td_PR33_*.html` | نسخة احتياطية teacher_dashboard (قبل PR #33) |
| `UPDATE_FOR_AGENT1_PR33_PR34.md` | رسالة تحذير للـ Agent الآخر |

---

## 14. الموارد الخارجية

| المورد | القيمة |
|--------|--------|
| Google Drive (عام) | `1wMZs_Ak5YS8ZhxJPJRpfdJYW0yp1T2CF` |
| Google Drive (خاص) | `1zLdcVj9_bs_DboblrIYO3Gt0b4AyIuLe` |
| Google Sheets (علامات) | `1ojilNfDg2XWTrlcRMmaoBNe8M0xE-YCnaMdVOC-LlsE` |
| وثيقة التسليم Drive | `1ZjuFprrQLru9t_pmviqGtI0j_8sZOopG1SfuYhz1vLo` |
| ملف كلمات المرور Drive | `1d_CFCmlW_-19uXhHcKaJVLJGQ` — كلمة فتح: `AlJoodAdmin2026` |
| شعار تربية وتعليم | `/agent/uploads/شعار تربيه وتعليم.jpeg` |
| بيانات أولياء الأمور | `/agent/uploads/بيانات اولياء الامور (1).xlsx` |

### روابط البوابة الحية:
- **الداشبورد الرئيسي:** `https://grade-dashboard-beta.vercel.app`
- **داشبورد المعلمة:** `https://grade-dashboard-beta.vercel.app/teacher_dashboard_unified.html`
- **بطاقة كلمات المرور:** `https://grade-dashboard-beta.vercel.app/passwords_card.html`
- **ورقة العمل للطالبة:** `https://grade-dashboard-beta.vercel.app/student_worksheet.html?code=XXXXXXX`
- **صفحة المنظومات:** `https://grade-dashboard-beta.vercel.app/project_systems_cards.html`
- **بوابة ولي الأمر (مهجورة):** `https://grade-dashboard-beta.vercel.app/parent_portal.html`

---

## 15. Connection IDs في Tasklet

| الاتصال | المعرف |
|---------|--------|
| Google Drive | `conn_merk23qtw8br233y1hq0` |
| GitHub | `conn_rn0ymr73xk9es2ppaqqs` |
| Computer Use | `conn_g9sdqkjzcp5cr0pebnfh` |
| ⚠️ معطّل | `conn_9ge5j6p075gpaj1ccdrb` |

---

## 16. SQL Database (Tasklet Local)

| الجدول | السجلات | الوصف |
|--------|---------|-------|
| `changelog_entries` | 24 | سجل التحديثات — يُزامَن مع Firebase يومياً 8 ص |
| `students` | 1,047 | نسخة محلية |
| `staff` | 102 | نسخة محلية |
| `teachers` | 47 | معلمات |
| `school_settings` | 1 | |
| `parent_confirmations` | 1 | |
| `teacher_ack_log` | 4 | |

---

## 17. أصحاب الهمم — البيانات الرسمية

| الشعبة | العدد |
|--------|-------|
| 3A | 1 |
| 3B | 2 |
| 3C | 2 |
| 3D | 3 |
| 3E | 1 |
| 4A | 4 |
| 4B | 4 |
| 4C | 8 |
| 4D | 6 |
| 4E | 6 |
| 4F | 3 |
| **الإجمالي** | **40 طالب** |

المصدر: `specialNeeds: true` في `data/students.json` + Supabase

---

## 18. Trigger النشط

| # | العنوان | التوقيت |
|---|---------|---------|
| 1 | مزامنة Changelog → Firebase | يومياً 8 صباحاً (توقيت دبي) |

---

## 19. تعليمات صريحة من صاحبة المشروع

1. **لا تأجيل أي شيء "لاحقاً"** — كل مشكلة تُصلَح فوراً في نفس الجلسة
2. **استورد جميع البيانات لكل الجداول** كي لا تتكرر الأخطاء في مواقع أخرى
3. **تحقق من بيانات الموظفة من Supabase مباشرةً** قبل السؤال
4. **استخدم النسخة الأحدث دائماً** — اسحب من GitHub قبل أي تعديل
5. **لا تترك أي شيء في localStorage** — كل شيء Supabase أو sessionStorage
6. **البوابة مستقلة كلياً** — الهدف النهائي: نشر على App Store
7. **المعمارية المُعتمدة:** Vercel + Supabase — لا Twilio — كل شيء مجاني

---

*آخر تحديث: 21 مايو 2026 — Agent 1*
