/** Local PostgreSQL integration, no live school, no real authentication.
 * EduOS · © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712.
 */
import { Client } from 'pg';
import { readFile } from 'node:fs/promises';
import { randomUUID, randomInt } from 'node:crypto';
import assert from 'node:assert/strict';
import { createIdentityAuthorizer, IdentityError, type DeploymentBinding } from './identity';
import { createRegistryResolvers } from './registry';
if (process.env.EDUOS_IDENTITY_LOCAL_ONLY !== '1' || !process.env.PGHOST?.startsWith('/tmp/eduos-identity-test.') ||
    process.env.PGPORT !== '55491' || process.env.PGDATABASE !== 'postgres') throw new Error('LOCAL_ONLY');
const owner = new Client(), reader = new Client(), browser = new Client();
let passed=0, failed=0;
async function test(name: string, body: () => Promise<unknown>) {
  try { await body(); passed++; console.log(`PASS ${name}`); }
  catch(e) { failed++; console.log(`FAIL ${name}: ${e instanceof Error ? e.message : 'error'}`); }
}
async function constraint(sql:string, values:unknown[], code:string) {
  await assert.rejects(owner.query(sql,values), (e:any)=>e.code===code);
}
async function denied(fn:()=>Promise<unknown>,code='access_denied') {
  await assert.rejects(fn(),(e:any)=>e instanceof IdentityError && e.code===code);
}
try {
  await Promise.all([owner.connect(),reader.connect(),browser.connect()]);
  await owner.query(await readFile(new URL('./local-bootstrap.sql',import.meta.url),'utf8'));
  await owner.query(await readFile(new URL('./registry.sql',import.meta.url),'utf8'));
  await reader.query('SET ROLE eduos_identity_reader');
  await browser.query('SET ROLE authenticated');
  const bindA=randomUUID(),bindB=randomUUID(),bindDemo=randomUUID(),tenantA=randomUUID(),tenantB=randomUUID();
  const a:DeploymentBinding={tenantId:tenantA,authBaseUrl:'https://syntheticidentity.supabase.co',dataEnvironment:'test',allowedOrigins:['https://synthetic.invalid']};
  const b={...a,tenantId:tenantB},demo:DeploymentBinding={...a,dataEnvironment:'demo'};
  for (const [id,d] of [[bindA,a],[bindB,b],[bindDemo,demo]] as const)
    await owner.query('INSERT INTO eduos_identity.bindings VALUES ($1,$2,$3,$4,true)',[id,d.tenantId,d.authBaseUrl,d.dataEnvironment]);
  const studentA=String(randomInt(1000000,2000000)),studentOther=String(randomInt(2000000,3000000));
  const staffEntity=randomUUID(),parentEntity=randomUUID();
  for (const id of [bindA,bindB,bindDemo]) for (const student of [studentA,studentOther])
    await owner.query('INSERT INTO eduos_identity.entities VALUES ($1,$2,$3,true)',[id,'student',student]);
  for (const [kind,id] of [['staff',staffEntity],['parent',parentEntity]])
    await owner.query('INSERT INTO eduos_identity.entities VALUES ($1,$2,$3,true)',[bindA,kind,id]);
  const approvalA=randomUUID(),approvalB=randomUUID(),linkApprovalA=randomUUID();
  for (const [id,bind] of [[approvalA,bindA],[approvalB,bindB],[linkApprovalA,bindA]])
    await owner.query("INSERT INTO eduos_identity.approvals VALUES ($1,$2,'SYNTHETIC-ONLY',$3,now()-interval '1 hour',now()+interval '1 hour',true)",[id,bind,randomUUID()]);
  const subjects={staff:randomUUID(),student:randomUUID(),parent:randomUUID()};
  const members={staff:randomUUID(),student:randomUUID(),parent:randomUUID()};
  const entity={staff:staffEntity,student:studentA,parent:parentEntity};
  for (const kind of ['staff','student','parent'] as const) {
    await owner.query('INSERT INTO auth.users VALUES ($1)',[subjects[kind]]);
    await owner.query(`INSERT INTO eduos_identity.memberships
      (id,binding_id,auth_user_id,kind,entity_id,role,approval_id,active,valid_from,valid_until)
      VALUES ($1,$2,$3,$4,$5,$6,$7,true,now()-interval '30 minutes',now()+interval '30 minutes')`,
      [members[kind],bindA,subjects[kind],kind,entity[kind],kind==='staff'?'teacher':kind,approvalA]);
    for (const action of ['portal.session.read','student.records.read'])
      await owner.query('INSERT INTO eduos_identity.permissions VALUES ($1,$2)',[members[kind],action]);
    await owner.query(`INSERT INTO eduos_identity.student_links
      (membership_id,binding_id,member_kind,member_entity_id,student_id,link_kind,approval_id,active,valid_from,valid_until)
      VALUES ($1,$2,$3,$4,$5,$6,$7,true,now()-interval '20 minutes',now()+interval '20 minutes')`,
      [members[kind],bindA,kind,entity[kind],studentA,kind==='staff'?'staff_assignment':kind==='student'?'self':'guardian',linkApprovalA]);
  }
  const database={query:async <T>(sql:string,values:readonly unknown[])=>({rows:(await reader.query(sql,[...values])).rows as T[]})};
  const r=createRegistryResolvers(a,database);
  const req=new Request('https://synthetic.invalid/api/isolated-test',{headers:{authorization:'Bearer synthetic.payload.signature'}});
  const auth=(kind:keyof typeof subjects,overrides:any={})=>createIdentityAuthorizer(a,{
    ...r,verifyToken:async()=>({subjectId:subjects[kind],expiresAt:Date.now()+60000}),...overrides});
  await test('local PostgreSQL uses no TCP listener',async()=>assert.equal((await owner.query('SHOW listen_addresses')).rows[0].listen_addresses,''));
  await test('registry tables all enable and force RLS',async()=>{
    const x=await owner.query("SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='eduos_identity' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity");
    assert.equal(x.rows[0].n,6);
  });
  await test('anonymous schema access denied',async()=>{
    await browser.query('SET ROLE anon');
    await assert.rejects(browser.query('SELECT * FROM eduos_identity.memberships'),(e:any)=>e.code==='42501');
    await browser.query('SET ROLE authenticated');
  });
  await test('authenticated registry access denied',async()=>assert.rejects(browser.query('SELECT * FROM eduos_identity.memberships'),(e:any)=>e.code==='42501'));
  await test('RLS independently denies SELECT even if browser table grants are added',async()=>{
    await owner.query('BEGIN');
    try {
    await owner.query('GRANT USAGE ON SCHEMA eduos_identity TO authenticated');
    await owner.query('GRANT SELECT ON eduos_identity.memberships TO authenticated');
    // Grants in this transaction are visible only on its own connection.
    await owner.query('SET LOCAL ROLE authenticated');
    assert.equal((await owner.query('SELECT count(*)::int AS n FROM eduos_identity.memberships')).rows[0].n,0);
    } finally { await owner.query('ROLLBACK'); }
  });
  await test('RLS independently denies mutation even with UPDATE grant',async()=>{
    await owner.query('BEGIN');
    try {
    await owner.query('GRANT USAGE ON SCHEMA eduos_identity TO authenticated');
    await owner.query('GRANT SELECT,UPDATE ON eduos_identity.memberships TO authenticated');
    await owner.query('SET LOCAL ROLE authenticated');
    assert.equal((await owner.query('UPDATE eduos_identity.memberships SET role=role')).rowCount,0);
    } finally { await owner.query('ROLLBACK'); }
  });
  await test('RLS independently denies INSERT even with browser INSERT grant',async()=>{
    await owner.query('BEGIN');
    try {
      await owner.query('GRANT USAGE ON SCHEMA eduos_identity TO authenticated');
      await owner.query('GRANT INSERT ON eduos_identity.bindings TO authenticated');
      await owner.query('SET LOCAL ROLE authenticated');
      await assert.rejects(owner.query('INSERT INTO eduos_identity.bindings VALUES ($1,$2,$3,$4,true)',
        [randomUUID(),randomUUID(),a.authBaseUrl,'test']),(e:any)=>e.code==='42501');
    } finally { await owner.query('ROLLBACK'); }
  });
  await test('backend reader is not a login, superuser or RLS bypass role',async()=>{
    const x=await owner.query("SELECT rolcanlogin,rolsuper,rolbypassrls FROM pg_roles WHERE rolname='eduos_identity_reader'");
    assert.deepEqual(x.rows,[{rolcanlogin:false,rolsuper:false,rolbypassrls:false}]);
  });
  await test('backend reader cannot change roles',async()=>assert.rejects(reader.query("UPDATE eduos_identity.memberships SET role='admin'"),(e:any)=>e.code==='42501'));
  await test('backend reader cannot create memberships',async()=>assert.rejects(reader.query('INSERT INTO eduos_identity.memberships DEFAULT VALUES'),(e:any)=>e.code==='42501'));
  for (const kind of ['staff','student','parent'] as const) {
    await test(`${kind} session uses real local registry query`,async()=>assert.equal((await auth(kind)(req,'portal.session.read')).role,kind==='staff'?'teacher':kind));
    await test(`${kind} explicitly linked student allowed`,async()=>assert.equal((await auth(kind)(req,'student.records.read',studentA)).studentId,studentA));
    await test(`${kind} unrelated student denied`,()=>denied(()=>auth(kind)(req,'student.records.read',studentOther)));
  }
  await test('no implicit administrator access to unrelated student',async()=>{
    await owner.query("UPDATE eduos_identity.memberships SET role='admin' WHERE id=$1",[members.staff]);
    try { await denied(()=>auth('staff')(req,'student.records.read',studentOther)); }
    finally { await owner.query("UPDATE eduos_identity.memberships SET role='teacher' WHERE id=$1",[members.staff]); }
  });
  await test('unknown Auth subject has no membership',async()=>assert.equal(await r.loadMembership(randomUUID(),a),null));
  await test('client cannot override bound tenant',async()=>assert.rejects(r.loadMembership(subjects.parent,b),/registry_scope_mismatch/));
  await test('client cannot override bound environment',async()=>assert.rejects(r.loadMembership(subjects.parent,demo),/registry_scope_mismatch/));
  await test('same Auth subject in another tenant has no inherited permission',async()=>assert.equal(await createRegistryResolvers(b,database).loadMembership(subjects.parent,b),null));
  await test('same Auth subject in demo has no inherited permission',async()=>assert.equal(await createRegistryResolvers(demo,database).loadMembership(subjects.parent,demo),null));
  await test('student scope derives from bound database entity',async()=>assert.equal((await r.loadStudentScope(studentA,a))?.tenantId,tenantA));
  await test('malformed resource rejected before query',async()=>assert.equal(await r.loadStudentScope("1' OR true--",a),null));
  await test('membership cannot point at nonexistent Auth account',async()=>constraint('UPDATE eduos_identity.memberships SET auth_user_id=$1 WHERE id=$2',[randomUUID(),members.parent],'23503'));
  await test('membership cannot point at nonexistent person',async()=>constraint('UPDATE eduos_identity.memberships SET entity_id=$1 WHERE id=$2',[randomUUID(),members.parent],'23503'));
  await test('same account cannot be assigned twice in one scope',async()=>constraint('UPDATE eduos_identity.memberships SET auth_user_id=$1 WHERE id=$2',[subjects.staff,members.parent],'23505'));
  await test('same person cannot be assigned to two accounts in one scope',async()=>{
    const secondAccount=randomUUID();
    await owner.query('INSERT INTO auth.users VALUES ($1)',[secondAccount]);
    await constraint(`INSERT INTO eduos_identity.memberships
      (id,binding_id,auth_user_id,kind,entity_id,role,approval_id,active,valid_from,valid_until)
      VALUES ($1,$2,$3,'parent',$4,'parent',$5,true,now(),now()+interval '10 minutes')`,
      [randomUUID(),bindA,secondAccount,parentEntity,approvalA],'23505');
  });
  await test('student role cannot become administrator',async()=>constraint("UPDATE eduos_identity.memberships SET role='admin' WHERE id=$1",[members.student],'23514'));
  await test('staff role cannot impersonate parent kind',async()=>constraint("UPDATE eduos_identity.memberships SET role='parent' WHERE id=$1",[members.staff],'23514'));
  await test('guardian link cannot use staff membership',async()=>constraint("UPDATE eduos_identity.student_links SET link_kind='guardian' WHERE membership_id=$1",[members.staff],'23514'));
  await test('self link cannot target a different student',async()=>constraint('UPDATE eduos_identity.student_links SET student_id=$1 WHERE membership_id=$2',[studentOther,members.student],'23514'));
  await test('cross-school link cannot borrow membership',async()=>constraint('UPDATE eduos_identity.student_links SET binding_id=$1,approval_id=$2 WHERE membership_id=$3',[bindB,approvalB,members.parent],'23503'));
  await test('cross-school approval cannot authorize membership',async()=>constraint('UPDATE eduos_identity.memberships SET approval_id=$1 WHERE id=$2',[approvalB,members.parent],'23503'));
  await test('membership time range must be valid',async()=>constraint('UPDATE eduos_identity.memberships SET valid_until=valid_from WHERE id=$1',[members.parent],'23514'));
  await test('unknown permission action rejected',async()=>constraint("INSERT INTO eduos_identity.permissions VALUES ($1,'everything')",[members.parent],'23514'));
  async function toggle(name:string,table:string,key:string,id:string,column:string,value:unknown,restore:unknown,action:'portal.session.read'|'student.records.read') {
    await test(name,async()=>{
      await owner.query(`UPDATE eduos_identity.${table} SET ${column}=$1 WHERE ${key}=$2`,[value,id]);
      try { await denied(()=>auth('parent')(req,action,action==='student.records.read'?studentA:undefined)); }
      finally { await owner.query(`UPDATE eduos_identity.${table} SET ${column}=$1 WHERE ${key}=$2`,[restore,id]); }
    });
  }
  await toggle('membership revocation takes effect next request','memberships','id',members.parent,'active',false,true,'portal.session.read');
  await toggle('binding revocation takes effect next request','bindings','id',bindA,'active',false,true,'portal.session.read');
  await toggle('approval revocation denies session','approvals','id',approvalA,'active',false,true,'portal.session.read');
  await toggle('independent guardian approval revocation denies child access','approvals','id',linkApprovalA,'active',false,true,'student.records.read');
  await test('guardian approval revocation does not revoke unrelated session permission',async()=>{
    await owner.query('UPDATE eduos_identity.approvals SET active=false WHERE id=$1',[linkApprovalA]);
    try { assert.equal((await auth('parent')(req,'portal.session.read')).role,'parent'); }
    finally { await owner.query('UPDATE eduos_identity.approvals SET active=true WHERE id=$1',[linkApprovalA]); }
  });
  await toggle('guardian revocation denies child access','student_links','membership_id',members.parent,'active',false,true,'student.records.read');
  await test('inactive authoritative entity denies session',async()=>{
    await owner.query("UPDATE eduos_identity.entities SET active=false WHERE binding_id=$1 AND kind='parent'",[bindA]);
    try {await denied(()=>auth('parent')(req,'portal.session.read'));}
    finally {await owner.query("UPDATE eduos_identity.entities SET active=true WHERE binding_id=$1 AND kind='parent'",[bindA]);}
  });
  await test('inactive student resource denies records',async()=>{
    await owner.query("UPDATE eduos_identity.entities SET active=false WHERE binding_id=$1 AND kind='student' AND entity_id=$2",[bindA,studentA]);
    try {await denied(()=>auth('parent')(req,'student.records.read',studentA));}
    finally {await owner.query("UPDATE eduos_identity.entities SET active=true WHERE binding_id=$1 AND kind='student' AND entity_id=$2",[bindA,studentA]);}
  });
  await test('expired approval denies current membership',async()=>{
    await owner.query("UPDATE eduos_identity.approvals SET valid_until=now()-interval '1 minute' WHERE id=$1",[approvalA]);
    try {await denied(()=>auth('parent')(req,'portal.session.read'));}
    finally {await owner.query("UPDATE eduos_identity.approvals SET valid_until=now()+interval '1 hour' WHERE id=$1",[approvalA]);}
  });
  await test('future approval not yet effective',async()=>{
    await owner.query("UPDATE eduos_identity.approvals SET approved_at=now()+interval '1 minute' WHERE id=$1",[approvalA]);
    try {await denied(()=>auth('parent')(req,'portal.session.read'));}
    finally {await owner.query("UPDATE eduos_identity.approvals SET approved_at=now()-interval '1 hour' WHERE id=$1",[approvalA]);}
  });
  await test('expired guardian approval denies child access independently',async()=>{
    await owner.query("UPDATE eduos_identity.approvals SET valid_until=now()-interval '1 minute' WHERE id=$1",[linkApprovalA]);
    try { await denied(()=>auth('parent')(req,'student.records.read',studentA)); }
    finally { await owner.query("UPDATE eduos_identity.approvals SET valid_until=now()+interval '1 hour' WHERE id=$1",[linkApprovalA]); }
  });
  await test('future guardian approval denies child access independently',async()=>{
    await owner.query("UPDATE eduos_identity.approvals SET approved_at=now()+interval '1 minute' WHERE id=$1",[linkApprovalA]);
    try { await denied(()=>auth('parent')(req,'student.records.read',studentA)); }
    finally { await owner.query("UPDATE eduos_identity.approvals SET approved_at=now()-interval '1 hour' WHERE id=$1",[linkApprovalA]); }
  });
  await test('permission removal denies otherwise linked student',async()=>{
    await owner.query("DELETE FROM eduos_identity.permissions WHERE membership_id=$1 AND action='student.records.read'",[members.parent]);
    try {await denied(()=>auth('parent')(req,'student.records.read',studentA));}
    finally {await owner.query("INSERT INTO eduos_identity.permissions VALUES ($1,'student.records.read')",[members.parent]);}
  });
  await test('database failure denies instead of fallback',async()=>{
    const broken=createRegistryResolvers(a,{query:async()=>{throw new Error('synthetic outage');}});
    await denied(()=>auth('parent',broken)(req,'portal.session.read'),'identity_registry_unavailable');
  });
  await test('duplicate membership result fails closed',async()=>{
    const loaded=await r.loadMembership(subjects.parent,a);
    assert(loaded);
    const dup=createRegistryResolvers(a,{query:async<T>()=>({rows:[loaded,loaded] as T[]})});
    assert.equal(await dup.loadMembership(subjects.parent,a),null);
  });
  await test('configuration remains frozen after caller mutation',async()=>{
    const mutable={...a};const fixed=createRegistryResolvers(mutable,database);mutable.tenantId=tenantB;
    assert.equal((await fixed.loadMembership(subjects.parent,a))?.tenantId,tenantA);
  });
  await test('malformed UUID deployment fails before registry queries',async()=>{
    let calls=0;
    assert.throws(()=>createRegistryResolvers({...a,tenantId:'-'.repeat(36)},
      {query:async<T>()=>{calls++;return {rows:[] as T[]};}}),/registry_configuration_unavailable/);
    assert.equal(calls,0);
  });
  const result={passed,failed,localPostgres:true,tcpListener:false,syntheticAuth:true,liveAuthVerified:false,liveSchoolDataRead:false,productionMutated:false};
  console.log('RESULT '+JSON.stringify(result));
  if (failed) process.exitCode=1;
} finally { await Promise.allSettled([owner.end(),reader.end(),browser.end()]); }
