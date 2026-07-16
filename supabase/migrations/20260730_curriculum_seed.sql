-- =====================================================
-- EduOS — Seed curriculum_period_rules
-- بيانات الحصص الرسمية من المصادر المعتمدة
-- آخر تحديث: 2026-07-16 — إضافة G9-G12 MOE + توحيد مادة الذكاء الاصطناعي والتكنولوجيا
-- المصدر: الخطة الدراسية للمدارس الحكومية والخاصة 2026/2027 — وزارة التربية والتعليم الإمارات
-- =====================================================

TRUNCATE curriculum_period_rules RESTART IDENTITY;

INSERT INTO curriculum_period_rules
  (system, source_document, grade_from, grade_to, stage_label_ar, stage_label_en,
   subject_ar, subject_en, min_periods, max_periods, is_mandatory,
   double_period_required, double_period_type, notes, last_verified)
VALUES

-- ════════════════════════════════════════════════════
-- MOE (وزارة التربية والتعليم) — الخطة الدراسية 2026-27
-- ملاحظة: "الذكاء الاصطناعي والتكنولوجيا" = المسمى الجديد لمادة CCDI+AI المدمجتين
-- ════════════════════════════════════════════════════

-- KG — رياض الأطفال (24 حصة/أسبوع)
('MOE','الخطة الدراسية 2026-27',0,0,'رياض الأطفال','KG','التربية الإسلامية','Islamic Studies',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',0,0,'رياض الأطفال','KG','اللغة العربية','Arabic Language',7,7,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',0,0,'رياض الأطفال','KG','الرياضيات','Mathematics',5,5,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',0,0,'رياض الأطفال','KG','اللغة الإنجليزية','English Language',4,4,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',0,0,'رياض الأطفال','KG','العلوم','Science',4,4,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',0,0,'رياض الأطفال','KG','التربية البدنية والصحية','Physical Education',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',0,0,'رياض الأطفال','KG','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',0,0,false,false,null,'مدمجة في المواد الأخرى - ليست مستقلة في رياض الأطفال','2026-07-30'),

-- G1-G2 — الحلقة الأولى (32 حصة/أسبوع)
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','التربية الإسلامية','Islamic Studies',3,3,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','اللغة العربية','Arabic Language',9,9,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','الدراسات الاجتماعية والتربية الأخلاقية','Social Studies & Moral Ed.',3,3,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','الرياضيات','Mathematics',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','اللغة الإنجليزية','English Language',5,5,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','العلوم','Science',4,4,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',1,1,true,false,null,'حصة واحدة/أسبوع - المسمى الجديد لمادة CCDI+AI المدمجتين خطة وزارة 2026/2027','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','الفنون (بصرية وموسيقية)','Arts (Visual & Music)',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',1,2,'الحلقة الأولى (1-2)','Primary G1-G2','التربية البدنية والصحية','Physical Education',1,1,true,false,null,null,'2026-07-30'),

-- G3-G4 — الحلقة الأولى (32 حصة/أسبوع)
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','التربية الإسلامية','Islamic Studies',3,3,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','اللغة العربية','Arabic Language',7,7,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','الدراسات الاجتماعية والتربية الأخلاقية','Social Studies & Moral Ed.',3,3,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','الرياضيات','Mathematics',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','اللغة الإنجليزية','English Language',5,5,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','العلوم','Science',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',2,2,true,true,'preferred','حصتان/أسبوع - يفضل متتاليتين','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','الفنون (بصرية وموسيقية)','Arts (Visual & Music)',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','التربية البدنية والصحية','Physical Education',1,1,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',3,4,'الحلقة الأولى (3-4)','Primary G3-G4','التربية الدرامية / المسرح','Drama / Theatre',1,1,true,false,null,null,'2026-07-30'),

-- G5-G6 — الحلقة الثانية (36 حصة/أسبوع)
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','التربية الإسلامية','Islamic Studies',3,3,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','اللغة العربية','Arabic Language',5,5,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','الدراسات الاجتماعية والتربية الأخلاقية','Social Studies & Moral Ed.',3,3,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','اللغة الإنجليزية','English Language',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','الرياضيات','Mathematics',7,7,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','العلوم','Science',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',2,2,true,true,'preferred','حصتان/أسبوع - يفضل متتاليتين','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','التربية البدنية والصحية','Physical Education',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',5,6,'الحلقة الثانية (5-6)','Middle G5-G6','الفنون (بصرية وموسيقية ومسرح)','Arts (Visual, Music & Theatre)',2,2,true,true,'mandatory','الفنون حصص مزدوجة إلزامية من الصف 5 فأعلى','2026-07-30'),

-- G7-G8 — الحلقة الثانية (36 حصة/أسبوع)
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','التربية الإسلامية','Islamic Studies',3,3,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','اللغة العربية','Arabic Language',5,5,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','الدراسات الاجتماعية والتربية الأخلاقية','Social Studies & Moral Ed.',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','اللغة الإنجليزية','English Language',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','الرياضيات','Mathematics',7,7,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','العلوم','Science',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',2,2,true,true,'preferred','حصتان/أسبوع - يفضل متتاليتين','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','التربية البدنية والصحية','Physical Education',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',7,8,'الحلقة الثانية (7-8)','Middle G7-G8','الفنون (بصرية وموسيقية ومسرح)','Arts (Visual, Music & Theatre)',2,2,true,true,'mandatory','الفنون حصص مزدوجة إلزامية من الصف 5 فأعلى','2026-07-30'),

-- G9-G10 — الحلقة الثالثة (36 حصة/أسبوع) — المسار العام والمتقدم
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','التربية الإسلامية','Islamic Studies',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','اللغة العربية','Arabic Language',5,5,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','الدراسات الاجتماعية والتربية الأخلاقية','Social Studies & Moral Ed.',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','اللغة الإنجليزية','English Language',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','الرياضيات','Mathematics',7,7,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','العلوم','Science',6,6,true,false,null,'G9 المسار العام - G10 المسار المتقدم يستبدل بمواد متخصصة','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',3,3,true,true,'preferred','3 حصص/أسبوع - يفضل حصتان متتاليتان + واحدة منفصلة','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','التربية البدنية والصحية','Physical Education',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',9,10,'الحلقة الثالثة (9-10)','Secondary G9-G10','الفنون (بصرية وموسيقية ومسرح)','Arts (Visual, Music & Theatre)',1,2,false,false,null,'اختياري','2026-07-30'),

-- G11-G12 — الحلقة الثالثة — المسار العام (36 حصة/أسبوع)
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','التربية الإسلامية','Islamic Studies',2,2,true,false,null,'إلزامي جميع المسارات','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','اللغة العربية','Arabic Language',5,5,true,false,null,'إلزامي جميع المسارات','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','الدراسات الاجتماعية والتربية الأخلاقية','Social Studies & Moral Ed.',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','اللغة الإنجليزية','English Language',6,6,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','الرياضيات','Mathematics',7,7,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','التربية البدنية والصحية','Physical Education',2,2,true,false,null,null,'2026-07-30'),
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',0,3,false,false,null,'اختياري G11-G12 - ضمن المواد الاختيارية','2026-07-30'),
('MOE','الخطة الدراسية 2026-27',11,12,'الحلقة الثالثة (11-12) المسار العام','Secondary G11-G12 General','مواد علمية (فيزياء/كيمياء/أحياء)','Science Subjects (Elective)',3,6,false,false,null,'اختياري حسب السيناريو','2026-07-30'),

-- ════════════════════════════════════════════════════
-- CBSE — المنهج الهندي (2026-27 + NEP 2020)
-- ════════════════════════════════════════════════════

-- G3-G5 (30-35 حصة/أسبوع)
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',3,5,'Preparatory Stage','Preparatory G3-G5','اللغات (R1+R2)','Languages (R1+R2)',8,10,true,false,null,'لغتان على الأقل إلزاميتان خارج الهند','2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',3,5,'Preparatory Stage','Preparatory G3-G5','الرياضيات','Mathematics',6,8,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',3,5,'Preparatory Stage','Preparatory G3-G5','العلوم','Science',4,6,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',3,5,'Preparatory Stage','Preparatory G3-G5','الفنون','Arts',2,3,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',3,5,'Preparatory Stage','Preparatory G3-G5','التربية البدنية','Physical Education',3,4,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',3,5,'Preparatory Stage','Preparatory G3-G5','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',1,2,true,false,null,'مدمج في المواد الحالية','2026-07-30'),

-- G6-G8 (40-45 حصة/أسبوع)
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',6,8,'Middle Stage','Middle G6-G8','اللغات (R1+R2)','Languages (R1+R2)',12,14,true,false,null,'لغتان إلزاميتان خارج الهند','2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',6,8,'Middle Stage','Middle G6-G8','الرياضيات','Mathematics',6,7,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',6,8,'Middle Stage','Middle G6-G8','العلوم','Science',5,6,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',6,8,'Middle Stage','Middle G6-G8','الدراسات الاجتماعية','Social Studies',5,6,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',6,8,'Middle Stage','Middle G6-G8','الفنون','Arts',2,2,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',6,8,'Middle Stage','Middle G6-G8','التربية البدنية','Physical Education',3,3,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',6,8,'Middle Stage','Middle G6-G8','المهني / Vocational','Vocational Education',2,2,false,false,null,'اختياري — موصى به','2026-07-30'),

-- G9-G10 (40-45 حصة/أسبوع)
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',9,10,'Secondary Stage','Secondary G9-G10','اللغات (R1+R2)','Languages (R1+R2)',8,10,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',9,10,'Secondary Stage','Secondary G9-G10','الرياضيات','Mathematics',6,7,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',9,10,'Secondary Stage','Secondary G9-G10','العلوم (بيولوجيا/كيمياء/فيزياء)','Science (Bio/Chem/Phy)',7,8,true,true,'mandatory','المختبر إلزامي — حصص مزدوجة للمختبر','2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',9,10,'Secondary Stage','Secondary G9-G10','الدراسات الاجتماعية','Social Studies',6,7,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',9,10,'Secondary Stage','Secondary G9-G10','الذكاء الاصطناعي والتكنولوجيا','AI & Technology',2,3,true,false,null,'مادة مستقلة من 2027-28','2026-07-30'),

-- G11-G12 (35-40 حصة/أسبوع)
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',11,12,'Senior Secondary','Senior Secondary G11-G12','اللغات','Languages',6,8,true,false,null,null,'2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',11,12,'Senior Secondary','Senior Secondary G11-G12','المواد الرئيسية (4)','Core Subjects (4)',6,8,true,false,null,'4 مواد رئيسية + لغة + اختياري','2026-07-30'),
('CBSE','CBSE Academic Curriculum 2026-27 + NEP 2020',11,12,'Senior Secondary','Senior Secondary G11-G12','التربية البدنية','Physical Education',5,6,false,false,null,'اختياري — شائع في مدارس UAE','2026-07-30'),

-- ════════════════════════════════════════════════════
-- IB — البكالوريا الدولية
-- ════════════════════════════════════════════════════

-- PYP (KG-G5)
('IB_PYP','IBO Programme Standards & Practices 2020',0,5,'PYP','Primary Years Programme','جميع المجالات (تكاملي)','All Subject Areas (Integrated)',null,null,false,false,null,'PYP: لا ساعات محددة — تعلّم تكاملي عابر للمواد. المدرسة تقرر التوزيع.','2026-07-30'),

-- MYP (G6-G10)
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','اللغة والأدب','Language & Literature',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة لكل مجموعة مادة','2026-07-30'),
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','اكتساب اللغة','Language Acquisition',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة','2026-07-30'),
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','الأفراد والمجتمعات','Individuals & Societies',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة','2026-07-30'),
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','العلوم','Sciences',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة','2026-07-30'),
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','الرياضيات','Mathematics',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة','2026-07-30'),
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','الفنون','Arts',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة','2026-07-30'),
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','التصميم','Design',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة','2026-07-30'),
('IB_MYP','IBO MYP Curriculum Documents 2023',6,10,'MYP','Middle Years Programme','التربية البدنية والصحية','PHE',2,null,true,false,null,'الحد الأدنى 50 ساعة/سنة','2026-07-30'),

-- DP (G11-G12)
('IB_DP','IBO Diploma Programme 2023',11,12,'DP','Diploma Programme','المواد SL (3 مواد)','SL Subjects (3)',3,null,true,false,null,'150 ساعة إجمالي/سنة/مادة SL','2026-07-30'),
('IB_DP','IBO Diploma Programme 2023',11,12,'DP','Diploma Programme','المواد HL (3 مواد)','HL Subjects (3)',5,null,true,false,null,'240 ساعة إجمالي على سنتين/مادة HL','2026-07-30'),

-- ════════════════════════════════════════════════════
-- Cambridge / British
-- ════════════════════════════════════════════════════

('Cambridge','Cambridge International — School Support Hub 2024',0,9,'Primary & Lower Secondary','Primary & Lower Secondary','جميع المواد (مرن)','All Subjects (Flexible)',null,null,false,false,null,'Cambridge Primary + Lower Secondary: لا ساعات إجمالية إلزامية. المدرسة تقرر بحرية كاملة.','2026-07-30'),
('Cambridge','Cambridge International — IGCSE Syllabus 2026',10,11,'IGCSE','IGCSE','كل مادة IGCSE','Each IGCSE Subject',2,3,true,false,null,'130 ساعة إجمالي لكل مادة IGCSE على سنتين. الممارسة الفعلية في UAE: 2-3 حصص/أسبوع.','2026-07-30'),
('Cambridge','Cambridge International — AS Level 2026',12,12,'AS Level','AS Level','كل مادة AS Level','Each AS Level Subject',5,5,true,false,null,'180 ساعة/سنة لكل مادة AS Level ≈ 5 حصص/أسبوع','2026-07-30'),

-- ════════════════════════════════════════════════════
-- KHDA — المتطلبات الإلزامية فوق كل نظام (دبي)
-- ════════════════════════════════════════════════════

('KHDA_Mandatory','KHDA Mandatory Curriculum Requirements 2025-26',1,12,'جميع المراحل (دبي)','All Grades (Dubai)','التربية الإسلامية (للمسلمين)','Islamic Studies (Muslims)',null,null,true,false,null,'KHDA: إلزامي لكل الطلاب المسلمين G1-G12 في جميع مدارس دبي بغض النظر عن النظام.','2026-07-30'),
('KHDA_Mandatory','KHDA Mandatory Curriculum Requirements 2025-26',1,12,'جميع المراحل (دبي)','All Grades (Dubai)','اللغة العربية (طلاب عرب — أولى)','Arabic Language (Arab Students — First)',null,null,true,false,null,'KHDA: إلزامي G1-G12 للطلاب العرب.','2026-07-30'),
('KHDA_Mandatory','KHDA Mandatory Curriculum Requirements 2025-26',1,9,'G1-G9 (دبي)','G1-G9 (Dubai)','اللغة العربية (طلاب غير عرب — إضافية)','Arabic Language (Non-Arab Students)',null,null,true,false,null,'KHDA: إلزامي G1-G9 على الأقل للطلاب غير العرب.','2026-07-30'),
('KHDA_Mandatory','KHDA Mandatory Curriculum Requirements 2025-26',1,9,'G1-G9 (دبي)','G1-G9 (Dubai)','الدراسات الاجتماعية / الأخلاق والثقافة','Social Studies / Moral & Cultural',null,null,true,false,null,'KHDA: إلزامي G1-G9. G10-G12 يُدمج في MSCS.','2026-07-30');
