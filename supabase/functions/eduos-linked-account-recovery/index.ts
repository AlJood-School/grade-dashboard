import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {createRecoveryHandler} from './recovery-handler.ts';
import config from './deployment-config.json' with {type:'json'};
const projectUrl=Deno.env.get('SUPABASE_URL')||'';
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const resendKey=Deno.env.get('RESEND_API_KEY')||'';
if(new URL(projectUrl).hostname.split('.')[0]!==config.project_ref)throw Error('recovery_project_mismatch');
const supabase=createClient(projectUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createRecoveryHandler({supabase,siteUrl:config.site_url,projectUrl,resendKey,
 sendEmail:(body:any,options:{idempotencyKey:string})=>fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resendKey,'Content-Type':'application/json','Idempotency-Key':options.idempotencyKey},body:JSON.stringify(body)})}));
