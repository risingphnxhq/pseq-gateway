const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
const A=require('../pbs-access-control');let checks=0;const ok=x=>{assert.ok(x);checks++;};const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function fixture(){let permitted=true,failure=false,signouts=0,clears=0,operation=async()=>({data:{saved:true},error:null}),calls=[];const client={rpc:async(name,args)=>{calls.push(name);if(name==='pbs_check_access_v1')return failure?{error:{code:'NETWORK'}}:permitted?{data:true,error:null}:{error:{code:'42501',message:'PBS_ACCESS_NOT_ENABLED'}};return operation(name,args);},auth:{signOut:async()=>{signouts++;return {};}}};const gate=A.create({client,onDenied:()=>clears++});return {client,gate,calls,permit:v=>permitted=v,fail:v=>failure=v,operation:v=>operation=v,signouts:()=>signouts,clears:()=>clears};}
(async()=>{
 let f=fixture();await f.client.rpc('pbs_create_business_v1',{});ok(f.calls.join(',')==='pbs_check_access_v1,pbs_create_business_v1');
 f.permit(false);await assert.rejects(()=>f.client.rpc('pbs_create_business_v1',{}),/PBS access is not enabled/);checks++;ok(f.signouts()===1);ok(f.clears()===1);ok(f.calls.filter(x=>x==='pbs_create_business_v1').length===1);
 await assert.rejects(()=>f.gate.check(),/PBS access is not enabled/);checks++;ok(f.clears()===1);
 f.permit(true);f.gate.reset();await f.gate.check();ok(f.calls.at(-1)==='pbs_check_access_v1');
 f=fixture();f.fail(true);await assert.rejects(()=>f.client.rpc('pbs_save_consultation_draft_v1',{}),/could not be checked/);checks++;ok(f.clears()===0);ok(f.signouts()===0);ok(f.calls.length===1);
 f=fixture();f.operation(async()=>({error:{code:'42501',message:'PBS_BUSINESS_NOT_AVAILABLE'}}));const wrong=await f.client.rpc('pbs_case_read_v1',{});ok(wrong.error.message==='PBS_BUSINESS_NOT_AVAILABLE');ok(f.signouts()===0);ok(f.clears()===0);
 f=fixture();f.operation(async()=>({error:{code:'42501',message:'PBS_ACCESS_NOT_ENABLED'}}));await assert.rejects(()=>f.client.rpc('pbs_case_read_v1',{}),/PBS access is not enabled/);checks++;ok(f.clears()===1);ok(f.signouts()===1);
 f=fixture();const wait=deferred();f.operation(()=>wait.promise);const request=f.client.rpc('pbs_case_read_v1',{});await new Promise(r=>setImmediate(r));await f.gate.reject();wait.resolve({data:{private:'old account'}});await assert.rejects(()=>request,/access changed/);checks++;ok(f.clears()===1);
 f=fixture();await f.gate.check();f.permit(false);await f.gate.recheck();ok(f.clears()===1);ok(f.signouts()===1);
 ok(A.denied({status:401}));ok(!A.denied({error:{code:'22023',message:'PBS_INVALID_CASE_PROFILE'}}));
 // Exercise the real workspace clear handler after a loaded plan loses permission.
 const {window}=parseHTML(fs.readFileSync('consultation.html','utf8')),d=window.document;
 window.PBSConsultation=require('../pbs-consultation-engine');window.PBSPlan=require('../pbs-plan-engine');window.confirm=()=>true;
 f=fixture();window.PBSAccountClient=f.client;window.PBSAccess=A.create({client:f.client,onDenied:()=>{d.dispatchEvent(new window.CustomEvent('pbs-account-signed-out'));d.dispatchEvent(new window.CustomEvent('pbs-access-denied'));}});window.PBSCloudDrafts={create:()=>({})};
 vm.runInNewContext(fs.readFileSync('consultation.js','utf8'),{window,document:d,crypto,Blob,URL,setTimeout});
 d.getElementById('sample').click();ok(!d.getElementById('workspace').hidden);ok(d.getElementById('tasks').children.length===4);
 d.getElementById('cloud-records').textContent='Previously loaded private draft';d.getElementById('business-select').append(d.createElement('option'));d.getElementById('account-controls').hidden=false;d.getElementById('sign-in').hidden=true;
 await window.PBSAccess.reject();ok(d.getElementById('workspace').hidden);ok(d.getElementById('tasks').children.length===0);ok(d.getElementById('cloud-records').children.length===0);ok(d.getElementById('business-select').children.length===0);ok(d.getElementById('account-controls').hidden);ok(!d.getElementById('sign-in').hidden);ok(d.getElementById('cloud-message').textContent.includes('saved records remain unchanged'));ok(window.PBSWorkspace.getCurrentDraft()===null);
 const paused=fs.readFileSync('account.html','utf8');ok(paused.includes('account access is temporarily paused'));ok(!paused.includes('<form'));ok(!paused.includes('vendor/pbs-account.js'));
 console.log(checks+' access-loss and account-pause checks passed (mocked transport and synthetic DOM; not recovery acceptance).');
})().catch(e=>{console.error(e);process.exitCode=1;});
