// EduOS · © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712.
let client=null,userId=null,busy=false,finished=false;
const form=document.getElementById('recoveryForm'),notice=document.getElementById('notice'),button=document.getElementById('submit');
function show(text,type='notice'){notice.textContent=text;notice.className='notice '+type;}
async function verifiedStatus(){
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user?.id||(userId&&data.user.id!==userId))throw Error('session_invalid');
 const {data:status,error:statusError}=await client.rpc('eduos_linked_recovery_status');
 if(statusError||status?.verified!==true)throw Error('link_unverified');
 return {user:data.user,status};
}
async function start(){
 const params=new URLSearchParams(location.hash.slice(1));
 const type=params.get('type'),access=params.get('access_token'),refresh=params.get('refresh_token');
 history.replaceState(null,'',location.pathname);
 if(type!=='recovery'||!access||!refresh)throw Error('link_invalid');
 for(let i=0;i<30&&(!window.EduOS?.SB_URL||!window.EduOS?.SB_KEY);i++)await new Promise(resolve=>setTimeout(resolve,100));
 if(!window.EduOS?.SB_URL||!window.EduOS?.SB_KEY)throw Error('configuration_missing');
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 client=createClient(window.EduOS.SB_URL,window.EduOS.SB_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {error}=await client.auth.setSession({access_token:access,refresh_token:refresh});
 if(error)throw Error('session_invalid');
 userId=(await verifiedStatus()).user.id;
 form.hidden=false;show('تم التحقق من الحساب المرتبط. اختر كلمة مرور جديدة، ولا ترسلها في المحادثة.');
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||finished||!client)return;
 const input=document.getElementById('password'),confirmation=document.getElementById('confirmation');
 let password=input.value;
 if(password.length<12||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password)||!(/[^A-Za-z0-9\s]/.test(password))||password!==confirmation.value){show('تحقق من تطابق الكلمتين واستيفاء المتطلبات.','error');return;}
 busy=true;button.disabled=true;let accepted=false;
 try{
  const before=(await verifiedStatus()).status.password_changed_at;
  const {data:operation,error:armError}=await client.rpc('eduos_arm_linked_password_update');
  if(armError||typeof operation!=='string'||!operation)throw Error('update_not_armed');
  const {data,error}=await client.auth.updateUser({password});
  password='';input.value='';confirmation.value='';
  if(error||data?.user?.id!==userId)throw Error('update_failed');
  accepted=true;finished=true;form.hidden=true;
  const {status}=await verifiedStatus();
  if(status.change_required!==false||!status.password_changed_at||status.password_changed_at===before||status.completed_operation!==operation)throw Error('confirmation_failed');
  await client.auth.signOut({scope:'local'});
  sessionStorage.removeItem('edoos_pending_change');sessionStorage.removeItem('edoos_user');
  show('تم تعيين كلمة المرور وتحديث حالة الحساب. يمكنك الآن العودة إلى الدخول.','success');
 }catch{
  input.value='';confirmation.value='';password='';
  if(accepted){finished=true;form.hidden=true;show('قُبل تغيير كلمة المرور، لكن تعذر تأكيد النتيجة عبر الاتصال. لا تكرر التغيير؛ أعد فتح صفحة الدخول.','error');}
  else show('لم يُؤكَّد تغيير كلمة المرور. قد يكون الرابط منتهياً أو الاتصال متعذراً.','error');
 }finally{busy=false;button.disabled=finished;}
});
start().catch(async()=>{form.hidden=true;show('الرابط غير صالح أو منتهٍ، أو لم يُثبت ربط الحساب. لم تُغيَّر كلمة المرور.','error');if(client)try{await client.auth.signOut({scope:'local'});}catch{}});
