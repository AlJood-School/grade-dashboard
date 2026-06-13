import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { login_type, username, password, parent_national_id, student_name } = await req.json();
    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SB_URL, SB_SERVICE);

    if (login_type === "student") {
      // تحقق من بيانات الطالبة
      if (!username || !password) return new Response(JSON.stringify({error:"بيانات ناقصة"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});

      const { data: authRow } = await supabase
        .from("students_auth")
        .select("id,student_id,student_name,password_hash,is_active")
        .eq("username", username.trim())
        .eq("is_active", true)
        .single();

      if (!authRow) return new Response(JSON.stringify({error:"اسم المستخدم غير موجود"}),{status:401,headers:{...corsHeaders,"Content-Type":"application/json"}});

      // التحقق من كلمة المرور
      const { data: pwCheck } = await supabase.rpc("verify_password", {
        input_password: password,
        stored_hash: authRow.password_hash,
      });

      if (!pwCheck) return new Response(JSON.stringify({error:"كلمة المرور غير صحيحة"}),{status:401,headers:{...corsHeaders,"Content-Type":"application/json"}});

      // جلب بيانات الطالبة
      const { data: student } = await supabase
        .from("students")
        .select("id,name,grade,class_name,student_number,parent_phone")
        .eq("id", authRow.student_id)
        .single();

      // تحديث آخر دخول
      await supabase.from("students_auth").update({last_login: new Date().toISOString()}).eq("id", authRow.id);

      return new Response(JSON.stringify({
        success: true,
        user_type: "student",
        student_id: authRow.student_id,
        student_name: student?.name || authRow.student_name,
        grade: student?.grade || "",
        class_name: student?.class_name || "",
        student_number: student?.student_number || username,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (login_type === "parent") {
      // تحقق من ولي الأمر عبر الرقم الوطني + اسم الطالبة
      if (!parent_national_id || !student_name) return new Response(JSON.stringify({error:"أدخل رقمك الوطني واسم طالبتك"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});

      const { data: students } = await supabase
        .from("students")
        .select("id,name,grade,class_name,student_number,parent_phone,parent_national_id")
        .ilike("name", `%${student_name.trim()}%`)
        .eq("parent_national_id", parent_national_id.trim());

      if (!students || students.length === 0) {
        // محاولة بدون تطابق دقيق للرقم الوطني (أول 15 خانة)
        const { data: students2 } = await supabase
          .from("students")
          .select("id,name,grade,class_name,student_number,parent_phone")
          .ilike("name", `%${student_name.trim()}%`);

        if (!students2 || students2.length === 0)
          return new Response(JSON.stringify({error:"لم نجد طالبة بهذا الاسم. تأكد من الكتابة بالعربي"}),{status:401,headers:{...corsHeaders,"Content-Type":"application/json"}});
        
        // تحقق جزئي — الرقم الوطني يطابق آخر 6 أرقام
        const partial = students2.find(s => s.parent_national_id && s.parent_national_id.replace(/-/g,'').endsWith(parent_national_id.replace(/-/g,'').slice(-6)));
        if (!partial) return new Response(JSON.stringify({error:"الرقم الوطني لا يتطابق مع بيانات الطالبة"}),{status:401,headers:{...corsHeaders,"Content-Type":"application/json"}});
        
        return new Response(JSON.stringify({
          success: true, user_type: "parent",
          student_id: partial.id, student_name: partial.name,
          grade: partial.grade, class_name: partial.class_name,
          student_number: partial.student_number,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const s = students[0];
      return new Response(JSON.stringify({
        success: true, user_type: "parent",
        student_id: s.id, student_name: s.name,
        grade: s.grade, class_name: s.class_name,
        student_number: s.student_number,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({error:"نوع الدخول غير معروف"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
