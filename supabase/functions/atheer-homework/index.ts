import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);

    // ── GET: جلب واجبات الطالب ──────────────────────────────────
    if (req.method === 'GET') {
      const studentUUID = url.searchParams.get('student_uuid');
      const subject = url.searchParams.get('subject'); // اختياري — فلتر بالمادة
      const status = url.searchParams.get('status');   // اختياري — فلتر بالحالة

      if (!studentUUID) {
        return new Response(
          JSON.stringify({ error: 'student_uuid مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase
        .from('homework')
        .select('*')
        .eq('student_id', studentUUID)
        .order('due_date', { ascending: true });

      if (subject) query = query.eq('subject', subject);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;

      if (error) throw error;

      // تحديث الواجبات المتأخرة تلقائياً
      const now = new Date();
      const updated = (data || []).map((hw: any) => {
        if (hw.status === 'pending' && hw.due_date && new Date(hw.due_date) < now) {
          return { ...hw, status: 'overdue' };
        }
        return hw;
      });

      return new Response(
        JSON.stringify({ homework: updated, count: updated.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── POST: إرسال إجابة / تحديث حالة ────────────────────────────
    if (req.method === 'POST') {
      const body = await req.json();
      const { action, homework_id, student_uuid, answers, notes } = body;

      if (!homework_id || !student_uuid) {
        return new Response(
          JSON.stringify({ error: 'homework_id و student_uuid مطلوبان' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // تأكد أن الواجب يخص هذا الطالب
      const { data: hw, error: hwErr } = await supabase
        .from('homework')
        .select('id, questions, status')
        .eq('id', homework_id)
        .eq('student_id', student_uuid)
        .single();

      if (hwErr || !hw) {
        return new Response(
          JSON.stringify({ error: 'الواجب غير موجود أو لا يخص هذا الطالب' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'start') {
        // بدء العمل على الواجب
        await supabase
          .from('homework')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', homework_id);

        return new Response(
          JSON.stringify({ success: true, message: 'بدأ الطالب العمل على الواجب' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'submit') {
        // حساب نتيجة الإجابات التلقائية (MCQ, true/false, fill_blank)
        let score = 0;
        let total = 0;
        const questions = hw.questions || [];

        const gradedAnswers = questions.map((q: any, i: number) => {
          const studentAnswer = answers?.[i]?.answer ?? answers?.[q.id]?.answer;
          const isAutoGrade = ['multiple_choice', 'true_false', 'fill_blank'].includes(q.type);

          if (isAutoGrade && q.correctAnswer !== undefined) {
            total++;
            const isCorrect = String(studentAnswer).trim().toLowerCase() === 
                             String(q.correctAnswer).trim().toLowerCase();
            if (isCorrect) score++;
            return { ...q, studentAnswer, isCorrect, graded: true };
          }
          return { ...q, studentAnswer, graded: false };
        });

        const percentage = total > 0 ? Math.round((score / total) * 100) : null;

        await supabase
          .from('homework')
          .update({
            status: 'completed',
            submitted_at: new Date().toISOString(),
            student_answers: gradedAnswers,
            auto_score: percentage,
            student_notes: notes || null,
          })
          .eq('id', homework_id);

        return new Response(
          JSON.stringify({
            success: true,
            score: percentage !== null ? `${score}/${total}` : 'يحتاج تصحيح يدوي',
            percentage,
            message: percentage !== null 
              ? `أحسنت! حصلت على ${percentage}%` 
              : 'تم إرسال الواجب — سيصحّحه معلمك قريباً',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'action غير معروف — استخدم: start أو submit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
