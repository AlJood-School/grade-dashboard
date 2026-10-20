import {test,expect} from 'bun:test';
import {createRecoveryHandler} from './recovery-handler';
const origin='https://school.example.invalid',project='https://isolated.example.invalid';
function setup(mode='ok'){
 const calls:any[]=[];const target={auth_user_id:'fictional-auth',auth_email:'auth@example.invalid',destination:'registered@example.invalid',request_id:'fictional-request'};
 const supabase={rpc:async(name:string,args:any)=>{calls.push([name,args]);if(name==='eduos_reserve_linked_recovery')return mode==='missing'?{data:null,error:null}:mode==='db-fail'?{error:{message:'synthetic'}}:{data:target,error:null};return {data:true,error:null};},auth:{admin:{generateLink:async()=>{calls.push(['generateLink']);if(mode==='generate-fail')return {error:{message:'synthetic'}};return {data:{user:{id:mode==='wrong-user'?'other':target.auth_user_id},properties:{action_link:(mode==='wrong-origin'?'https://wrong.example.invalid':project)+'/auth/v1/verify?type=recovery&redirect_to='+encodeURIComponent(origin+'/apps/eduos-account-recovery/')+'&token=synthetic-never-real'}}};}}}};
 const handler=createRecoveryHandler({supabase,siteUrl:origin,projectUrl:project,resendKey:'synthetic',sendEmail:async(body:any)=>{calls.push(['sendEmail',body]);return{ok:mode!=='delivery-fail'};}});
 const request=(data:any={username:'fictional_user'},method='POST',requestOrigin=origin)=>new Request(origin+'/request',{method,headers:{origin:requestOrigin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(data)}:{})});
 return {handler,calls,request};
}
test('successful delivery only to server target; response contains no link or destination',async()=>{const s=setup();const r=await s.handler(s.request());expect(r.status).toBe(200);expect(await r.text()).toBe('{"accepted":true}');expect(s.calls.find(c=>c[0]==='sendEmail')[1].to).toEqual(['registered@example.invalid']);expect(s.calls.at(-1)[1].p_status).toBe('sent');});
for(const mode of['missing','generate-fail','wrong-user','wrong-origin','delivery-fail'])test('fail safely '+mode,async()=>{const s=setup(mode);const r=await s.handler(s.request());expect(r.status).toBe(200);expect(await r.text()).toBe('{"accepted":true}');if(mode!=='delivery-fail')expect(s.calls.some(c=>c[0]==='sendEmail')).toBe(false);if(mode!=='missing')expect(s.calls.at(-1)[1].p_status).toBe('failed');});
test('database failure does not generate a link',async()=>{const s=setup('db-fail');expect((await s.handler(s.request())).status).toBe(503);expect(s.calls.some(c=>c[0]==='generateLink')).toBe(false);});
test('wrong origin rejected before database',async()=>{const s=setup();expect((await s.handler(s.request({},'POST','https://wrong.invalid'))).status).toBe(403);expect(s.calls).toHaveLength(0);});
test('invalid body rejected',async()=>{const s=setup();expect((await s.handler(s.request({username:9}))).status).toBe(400);expect(s.calls).toHaveLength(0);});
test('GET rejected',async()=>{const s=setup();expect((await s.handler(s.request({},'GET'))).status).toBe(405);expect(s.calls).toHaveLength(0);});
