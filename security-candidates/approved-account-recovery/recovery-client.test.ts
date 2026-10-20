import{test,expect}from'bun:test';
import{readFile}from'node:fs/promises';
import vm from'node:vm';
const source=await readFile(new URL('./recovery-client.js',import.meta.url),'utf8');
async function run(mode='ok'){
 const elements:any={};for(const id of['recoveryForm','notice','submit','password','confirmation'])elements[id]={value:'',hidden:true,disabled:false,textContent:'',className:'',addEventListener:(event:string,handler:any)=>{elements[id][event]=handler;}};
 const state={updates:0,statusCalls:0,localWrites:0,cleared:0,replace:0,getUser:0};
 const client={auth:{setSession:async()=>({error:mode==='expired'?{}:null}),getUser:async()=>{state.getUser++;return{data:{user:{id:mode==='switched'&&state.getUser>1?'different':'fictional'}},error:null};},updateUser:async()=>{state.updates++;await new Promise(r=>setTimeout(r,5));return{data:{user:{id:'fictional'}},error:mode==='update-failed'?{}:null};},signOut:async()=>({error:null})},rpc:async(name:string)=>{state.statusCalls++;if(name==='eduos_arm_linked_password_update')return{data:'fictional-operation',error:null};return{data:{verified:true,change_required:state.updates===0,password_changed_at:state.updates?'after':'before',completed_operation:state.updates?'fictional-operation':null},error:mode==='unlinked'||(mode==='confirmation-failed'&&state.updates>0)?{}:null};}};
 const context=vm.createContext({URLSearchParams,setTimeout,Error,Promise,console,location:{hash:mode==='no-link'?'':'#type=recovery&access_token=synthetic&refresh_token=synthetic',pathname:'/apps/eduos-account-recovery/'},history:{replaceState:()=>state.replace++},window:{EduOS:{SB_URL:'https://example.invalid',SB_KEY:'synthetic'}},document:{getElementById:(id:string)=>elements[id]},sessionStorage:{removeItem:()=>state.cleared++},createClient:()=>client});
 const code=source.replace("const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');",'');
 new vm.Script(code).runInContext(context);await new Promise(r=>setTimeout(r,10));
 return{elements,state,submit:async()=>{elements.password.value='Synthetic-Only123!';elements.confirmation.value='Synthetic-Only123!';await elements.recoveryForm.submit({preventDefault(){}});}};
}
test('valid flow verifies then changes and clears fields',async()=>{const r=await run();expect(r.elements.recoveryForm.hidden).toBe(false);await r.submit();expect(r.state.updates).toBe(1);expect(r.state.cleared).toBe(2);expect(r.elements.password.value).toBe('');expect(r.elements.notice.textContent).toContain('تم تعيين');});
for(const mode of['no-link','expired','unlinked'])test('initial refusal '+mode,async()=>{const r=await run(mode);expect(r.elements.recoveryForm.hidden).toBe(true);expect(r.state.updates).toBe(0);expect(r.elements.notice.textContent).toContain('لم تُغيَّر');});
test('changed identity blocked before password',async()=>{const r=await run('switched');await r.submit();expect(r.state.updates).toBe(0);});
test('update failure is not success',async()=>{const r=await run('update-failed');await r.submit();expect(r.elements.notice.textContent).toContain('لم يُؤكَّد');expect(r.state.cleared).toBe(0);});
test('confirmation failure never repeats accepted update',async()=>{const r=await run('confirmation-failed');await r.submit();await r.submit();expect(r.state.updates).toBe(1);expect(r.elements.recoveryForm.hidden).toBe(true);expect(r.elements.notice.textContent).toContain('قُبل تغيير');});
test('duplicate submits produce one update',async()=>{const r=await run();await Promise.all([r.submit(),r.submit()]);expect(r.state.updates).toBe(1);});
