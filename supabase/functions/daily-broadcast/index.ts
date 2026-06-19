// ============================================================
// EduOS Edge Function: daily-broadcast v1.0
// الهدف: نشر محتوى يومي تلقائياً (إسلامي + أخبار تعليمية)
// يُستدعى بـ pg_cron كل يوم الساعة 6:30 صباحاً
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

// محتوى إسلامي ثابت — يتنقل بشكل دوري
const ISLAMIC_CONTENT = [
  { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", source: "سورة الطلاق — آية 3", type: "quran" },
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح — آية 6", type: "quran" },
  { text: "وَقُل رَّبِّ زِدْنِي عِلْمًا", source: "سورة طه — آية 114", type: "quran" },
  { text: "فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ", source: "سورة آل عمران — آية 159", type: "quran" },
  { text: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَى", source: "سورة النجم — آية 39", type: "quran" },
  { text: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", source: "سورة طه — آيتان 25-26", type: "quran" },
  { text: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ", source: "سورة المائدة — آية 2", type: "quran" },
  { text: "مَن سلَكَ طريقاً يلتمسُ فيه عِلماً، سهَّلَ اللهُ له طريقاً إلى الجنة", source: "رواه مسلم", type: "hadith" },
  { text: "خيركم من تعلَّم القرآن وعلَّمه", source: "رواه البخاري", type: "hadith" },
  { text: "العِلمُ نورٌ يهدي صاحبه، والجهلُ ظلامٌ يُضلُّ أهلَه", source: "الإمام ابن القيم", type: "wisdom" },
  { text: "أدِّبْ نفسَك بالعِلمِ، وزيِّنها بالحِلمِ", source: "الإمام الشافعي", type: "wisdom" },
  { text: "طلبُ العِلمِ فريضةٌ على كلِّ مسلمٍ", source: "رواه ابن ماجه — صحيح", type: "hadith" },
  { text: "اللهم لا سهل إلا ما جعلته سهلاً، وأنت تجعل الحزن إذا شئت سهلاً", source: "دعاء مأثور", type: "dua" },
  { text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", source: "سورة البقرة — آية 201", type: "dua" },
  { text: "اللهمَّ انفعني بما علَّمتني، وعلِّمني ما ينفعني، وزدني علماً", source: "دعاء طالب العلم", type: "dua" },
];

// دالة لاختيار محتوى اليوم بناءً على تاريخه (ثابت لكل يوم)
function getTodayContent(dateStr: string) {
  const seed = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ISLAMIC_CONTENT[seed % ISLAMIC_CONTENT.length];
}

Deno.serve(async (req) => {
  // السماح بالاستدعاء من pg_cron أو المدير فقط
  const authHeader = req.headers.get("Authorization") || "";
  const cronSecret = Deno.env.get("CRON_SECRET") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  // التحقق من صحة المصدر
  const isCron = authHeader === `Bearer ${cronSecret}`;
  const isService = authHeader === `Bearer ${serviceKey}`;
  if (!isCron && !isService) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const dayOfWeek = today.getDay(); // 0=أحد، 5=جمعة، 6=سبت

  // لا إرسال أيام الجمعة والسبت (إجازة)
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return new Response(JSON.stringify({ skipped: true, reason: "weekend" }), { status: 200 });
  }

  // التحقق: هل نُشر محتوى اليوم مسبقاً؟
  const { data: existing } = await supabase
    .from("broadcasts")
    .select("id")
    .eq("type", "daily_motd")
    .gte("created_at", `${dateStr}T00:00:00`)
    .limit(1);

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ skipped: true, reason: "already_published" }), { status: 200 });
  }

  // اختيار محتوى اليوم
  const content = getTodayContent(dateStr);
  const typeLabel = {
    quran: "📖 آية قرآنية",
    hadith: "🌙 حديث شريف",
    wisdom: "💡 حكمة",
    dua: "🤲 دعاء"
  }[content.type] || "📿 محتوى إسلامي";

  // نشر المحتوى اليومي
  const { error } = await supabase
    .from("broadcasts")
    .insert({
      title: `${typeLabel} — ${new Date().toLocaleDateString('ar-AE', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      body: `«${content.text}» — ${content.source}`,
      type: "daily_motd",
      created_by: "system_auto",
      is_active: true
    });

  if (error) {
    console.error("Broadcast insert error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // تنظيف المحتوى القديم (الأقدم من 30 يوماً)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await supabase
    .from("broadcasts")
    .delete()
    .eq("type", "daily_motd")
    .lt("created_at", cutoff.toISOString());

  return new Response(JSON.stringify({
    success: true,
    published: content.text.substring(0, 50) + "...",
    date: dateStr
  }), { status: 200 });
});
