// EduOS · © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712.
export function createRecoveryHandler(deps:any){
 const {supabase,siteUrl,projectUrl,resendKey,sendEmail}=deps;
 const origin=new URL(siteUrl).origin;
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const result=(status=200)=>new Response(JSON.stringify({accepted:status===200}),{status,headers});
 return async(req:Request)=>{
  if(req.headers.get('origin')!==origin)return result(403);
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return result(405);
  if(!resendKey||!siteUrl.startsWith('https://')||!projectUrl.startsWith('https://'))return result(503);
  let body:any;try{if(Number(req.headers.get('content-length')||0)>2048)return result(400);body=await req.json();}catch{return result(400);}
  if(typeof body.username!=='string'||body.username.length>120||!body.username.trim())return result(400);
  const {data:target,error}=await supabase.rpc('eduos_reserve_linked_recovery',{p_username:body.username.trim()});
  if(error)return result(503);
  if(!target)return result();
  let state='failed';
  try{
   state='link_generation_failed';
   const {data:generated,error:linkError}=await supabase.auth.admin.generateLink({type:'recovery',email:target.auth_email,options:{redirectTo:origin+'/apps/eduos-account-recovery/'}});
   if(linkError||generated?.user?.id!==target.auth_user_id)throw Error('recovery_link_failed');
   state='link_validation_failed';
   const link=new URL(generated.properties.action_link);
   if(link.origin!==new URL(projectUrl).origin||link.pathname!=='/auth/v1/verify'||link.searchParams.get('type')!=='recovery'||link.searchParams.get('redirect_to')!==origin+'/apps/eduos-account-recovery/')throw Error('recovery_link_invalid');
   const safeLink=link.href.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
   state='provider_unknown';
   const sent=await sendEmail({from:'بوابة الجود <noreply@'+new URL(siteUrl).hostname+'>',to:[target.destination],subject:'استعادة الدخول إلى بوابة الجود الذكية',html:'<div dir="rtl" style="font-family:Arial,sans-serif"><h2>🎓 بوابة الجود الذكية</h2><p>ورد طلب استعادة الحساب المعتمد. اختر كلمة مرور جديدة عبر الرابط الرسمي الآتي. لا ترسل كلمة المرور في المحادثة.</p><p><a href="'+safeLink+'">تعيين كلمة مرور جديدة</a></p><p>إذا لم تطلب الاستعادة فتجاهل الرسالة.</p><hr><p dir="ltr">NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712</p><p>© 2026 جميع الحقوق محفوظة.</p></div>'},{idempotencyKey:'eduos-recovery/'+target.request_id});
   if(!sent.ok){state='provider_rejected';console.warn('eduos_recovery_provider_rejected',Number(sent.status)||0);throw Error('delivery_failed');}
   state='sent';
  }catch{/* Never return/log a link, destination, password, or token. */}
  await supabase.rpc('eduos_finish_linked_recovery',{p_auth_id:target.auth_user_id,p_request_id:target.request_id,p_status:state});
  return result();
 };
}
