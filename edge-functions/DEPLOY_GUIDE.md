# 🚀 دليل نشر Edge Functions في Supabase

## الخطوات (مرة واحدة فقط):

### 1️⃣ تثبيت Supabase CLI
```bash
npm install -g supabase
```

### 2️⃣ تسجيل الدخول
```bash
supabase login
```

### 3️⃣ ربط المشروع
```bash
supabase link --project-ref zuyizaiugpmhmeycqton
```

### 4️⃣ نشر كل الـ Functions
```bash
supabase functions deploy save-grades
supabase functions deploy save-attendance
supabase functions deploy admin-operations
supabase functions deploy get-student-data
```

### 5️⃣ إضافة الـ Secrets (مرة واحدة)
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## روابط الـ Functions بعد النشر:
- `https://zuyizaiugpmhmeycqton.supabase.co/functions/v1/save-grades`
- `https://zuyizaiugpmhmeycqton.supabase.co/functions/v1/save-attendance`
- `https://zuyizaiugpmhmeycqton.supabase.co/functions/v1/admin-operations`
- `https://zuyizaiugpmhmeycqton.supabase.co/functions/v1/get-student-data`

## كيف تستخدمها في الكود:
```javascript
// بدلاً من:
supabase.from('student_grades').insert(data)

// استخدم:
fetch('https://zuyizaiugpmhmeycqton.supabase.co/functions/v1/save-grades', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`, // JWT الطالب/المعلم
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ action: 'upsert_weekly', data: gradesArray })
})
```
