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

  try {
    const url = new URL(req.url);
    const studentIdParam = url.searchParams.get('student_id'); // رقم الهوية الإماراتية
    const studentUUID = url.searchParams.get('uuid'); // UUID من جدول students

    if (!studentIdParam && !studentUUID) {
      return new Response(
        JSON.stringify({ error: 'يجب توفير student_id أو uuid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // جلب بيانات الطالب
    let studentQuery = supabase
      .from('students')
      .select('id, name, grade, class_name, student_id');

    if (studentUUID) {
      studentQuery = studentQuery.eq('id', studentUUID);
    } else {
      studentQuery = studentQuery.eq('student_id', studentIdParam);
    }

    const { data: student, error: studentError } = await studentQuery.single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'الطالب غير موجود' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // جلب مواد الطالب من timetable_slots (distinct subjects لنفس الصف)
    const gradeNum = student.grade; // رقم الصف
    const { data: slots } = await supabase
      .from('timetable_slots')
      .select('subject_name')
      .eq('grade', gradeNum)
      .not('subject_name', 'is', null);

    // استخراج المواد الفريدة مع ألوانها
    const subjectColors: Record<string, string> = {
      'اللغة العربية': '#22C55E',
      'الرياضيات': '#3B82F6',
      'اللغة الإنجليزية': '#F59E0B',
      'العلوم': '#10B981',
      'الدراسات الاجتماعية': '#8B5CF6',
      'التربية الإسلامية': '#EF4444',
      'التربية البدنية': '#F97316',
      'الفنون': '#EC4899',
      'الحاسوب': '#6366F1',
      'default': '#6C3DD6',
    };

    const uniqueSubjects = [...new Set((slots || []).map((s: any) => s.subject_name))]
      .filter(Boolean)
      .map((name: string) => ({
        id: name.replace(/\s+/g, '_').toLowerCase(),
        name,
        color: subjectColors[name] || subjectColors['default'],
      }));

    // خريطة الصفوف
    const gradeNames: Record<number, string> = {
      0: 'KG1', 1: 'KG2', 2: 'الصف الأول', 3: 'الصف الثاني',
      4: 'الصف الثالث', 5: 'الصف الرابع', 6: 'الصف الخامس',
      7: 'الصف السادس', 8: 'الصف السابع', 9: 'الصف الثامن',
    };

    const response = {
      student: {
        uuid: student.id,
        student_id: student.student_id,
        name: student.name,
        firstName: student.name?.split(' ')[0] || student.name,
        grade: student.grade,
        gradeName: gradeNames[student.grade] || `الصف ${student.grade}`,
        className: student.class_name,
        school: 'مدرسة الجود النموذجية',
      },
      subjects: uniqueSubjects,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
