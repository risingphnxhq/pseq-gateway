const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom'),R=require('../pbs-owned-recovery.js');
let checks=0;const equal=(a,b)=>{assert.deepEqual(a,b);checks++;};
const draft={id:'plan-a'},state={business_id:'business-a',consultation_id:'month-a',tasks:[{id:'task-a',submissions:[{token:'receipt-a'}]}]};
function fixture(){let user='owner-a',failure=null,wait=null,calls=[];
 const client={auth:{getUser:async()=>({data:{user:user?{id:user}:null}})},from(table){const args={};return {select(){return this;},eq(k,v){args[k]=v;return this;},order(){return this;},limit(){calls.push({table,args});return Promise.resolve(failure?{error:{code:failure}}:{data:table==='pbs_entities'?(user==='owner-a'?[{id:'business-a',legal_name:'Example'}]:[]):[{id:'assessment-a',prs_payload:{answers:{unknown:null}}}]});}};},async rpc(name,args){calls.push({name,args});if(wait){const f=wait;wait=null;await f;}if(failure)return {error:{code:failure}};return {data:name==='pbs_list_consultation_drafts_v1'?[{draft_id:'plan-a',revision:2}]:name==='pbs_load_consultation_draft_v1'?{payload:draft,revision:2,current_revision:2}:args.p_consultation_id?state:[{consultation_id:'month-a',goal:'Example',month:'2026-10-01'}]};}};
 return {client,calls,setUser:x=>user=x,fail:x=>failure=x,wait:x=>wait=x};
}
(async()=>{
 const f=fixture(),r=R.create({client:f.client});
 equal((await r.businesses())[0].id,'business-a');
 const found=await r.discover('business-a');equal(found.plans[0].draft_id,'plan-a');equal(found.monthly[0].consultation_id,'month-a');equal(found.assessments[0].prs_payload.answers.unknown,null);
 equal((await r.plan('business-a','plan-a')).payload.id,'plan-a');const monthly=await r.monthly('business-a','month-a');equal(monthly.tasks[0].id,'task-a');equal(monthly.tasks[0].submissions[0].token,'receipt-a');
 equal(f.calls.filter(x=>x.name).every(x=>/list|read|load/.test(x.name)),true);
 const fresh=R.create({client:f.client});equal((await fresh.discover('business-a')).plans[0].draft_id,'plan-a');
 await assert.rejects(()=>fresh.plan('business-a','other-plan'),/not available/);checks++;
 f.setUser('owner-b');equal(await fresh.businesses(),[]);const before=f.calls.filter(x=>x.name).length;await assert.rejects(()=>fresh.discover('business-a'),/not available/);checks++;equal(f.calls.filter(x=>x.name).length,before);
 f.setUser(null);await assert.rejects(()=>fresh.businesses(),/Sign in/);checks++;
 f.setUser('owner-a');f.fail('42501');await assert.rejects(()=>fresh.discover('business-a'),/could not be confirmed/);checks++;f.fail(null);
 let release;f.wait(new Promise(x=>release=x));const pending=fresh.discover('business-a');await new Promise(x=>setImmediate(x));fresh.clear();release();await assert.rejects(()=>pending,/changed/);checks++;
 const {window}=parseHTML(fs.readFileSync('consultation.html','utf8')),d=window.document,ui=fixture();window.PBSAccountClient=ui.client;window.PBSOwnedRecovery=R;
 vm.runInNewContext(fs.readFileSync('recovery-client.js','utf8'),{window,document:d});
 const select=d.getElementById('business-select');let selected='';Object.defineProperty(select,'value',{get:()=>selected,set:x=>selected=x});
 const panel=d.getElementById('owned-recovery'),buttons=panel.querySelectorAll('button');await buttons[0].onclick();d.getElementById('business-select').value='business-a';await buttons[1].onclick();equal(d.getElementById('recovery-results').querySelectorAll('button').length,3);
 let recovered;d.addEventListener('pbs-recover-monthly',e=>recovered=e.detail);await d.getElementById('recovery-results').querySelectorAll('button')[2].onclick();equal(recovered.saved.tasks[0].submissions[0].token,'receipt-a');
 d.dispatchEvent(new window.CustomEvent('pbs-account-signed-out'));equal(d.getElementById('recovery-results').textContent,'');equal(d.getElementById('recovery-status').textContent,'');
 equal(fs.readFileSync('pbs-owned-recovery.js','utf8').includes('localStorage'),false);equal(fs.readFileSync('recovery-client.js','utf8').includes('localStorage'),false);
 console.log(checks+' owned-discovery/recovery checks passed (mocked services and synthetic DOM; no live acceptance).');
})().catch(e=>{console.error(e);process.exitCode=1;});
