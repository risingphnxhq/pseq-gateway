const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom'),E=require('../pbs-diagnostic-engine'),B=require('../pbs-assessment-continuity');
let n=0;const ok=x=>{assert.ok(x);n++;},tick=()=>new Promise(r=>setImmediate(r));
const {window}=parseHTML(fs.readFileSync('consultation.html','utf8')),d=window.document;window.confirm=()=>true;
function selectValue(el){Object.defineProperty(el,'value',{get(){return this.getAttribute('data-value')||this.querySelector('option')?.value||'';},set(v){this.setAttribute('data-value',v);},configurable:true});}
for(const el of d.querySelectorAll('select'))selectValue(el);const create=d.createElement.bind(d);d.createElement=tag=>{const e=create(tag);if(tag==='select')selectValue(e);return e;};
d.getElementById('business-select').value='business-a';window.PBSDiagnostic=E;window.PBSAssessmentContinuity=B;
let calls=0,delayed=false,release,error=null;
const data={business_id:'business-a',report_id:'report-a',created_at:'2026-10-20',duplicate:true,report:{record_type:'CALCULATED_ASSESSMENT_REPORT',source_snapshot_id:'snapshot-a',calculated:{method_version:E.VERSION,calculation_version:'PBS-SERVER-ASSESSMENT-1.0.0',status:'UNKNOWN',reason:'No answers',coverage:0,risk_coverage:0,areas:[],limits:'Customer declarations only'}}};
window.PBSAccountClient={rpc:async(name,args)=>{calls++;if(name==='pbs_save_assessment_draft_v1')return {data:{snapshot_id:'snapshot-a'}};assert.equal(name,'pbs_assessment_report_v1');assert.equal(args.p_snapshot_id,'snapshot-a');if(delayed)await new Promise(r=>release=r);return {data,error};}};
vm.runInNewContext(fs.readFileSync('assessment-client.js','utf8'),{window,document:d,crypto,structuredClone,Blob,URL,setTimeout});
const click=text=>{const b=[...d.querySelectorAll('#saved-assessment button')].find(b=>b.textContent===text);assert.ok(b,text);return b.onclick();},label='Save or recover my calculated report';
(async()=>{
 await click(label);ok(calls===0);ok(d.getElementById('assessment-status').textContent.includes('Save these current answers'));
 await click('Save these answers privately');await click(label);ok(d.getElementById('assessment-saved-report').textContent.includes('UNKNOWN'));ok(d.getElementById('assessment-status').textContent.includes('No duplicate'));
 const hours=d.getElementById('assessment-hours');hours.value='1';hours.dispatchEvent(new window.Event('input',{bubbles:true}));ok(d.getElementById('assessment-saved-report').textContent.includes('UNKNOWN'));const capacityCalls=calls;await click(label);ok(calls===capacityCalls+1);
 const goal=d.getElementById('assessment-goal');goal.value='Changed goal';goal.dispatchEvent(new window.Event('input',{bubbles:true}));ok(d.getElementById('assessment-saved-report').children.length===0);const before=calls;await click(label);ok(calls===before);
 await click('Save these answers privately');delayed=true;const pending=click(label);await tick();goal.value='Edited while waiting';goal.dispatchEvent(new window.Event('input',{bubbles:true}));release();await pending;ok(d.getElementById('assessment-saved-report').children.length===0);ok(d.getElementById('assessment-status').textContent.includes('changed while'));
 delayed=false;await click('Save these answers privately');delayed=true;const old=click(label);await tick();d.dispatchEvent(new window.CustomEvent('pbs-account-signed-out'));release();await old;ok(d.getElementById('assessment-saved-report').children.length===0);ok(d.getElementById('assessment-status').textContent==='');
 delayed=false;await click('Save these answers privately');error={code:'PT409'};await click(label);ok(d.getElementById('assessment-status').textContent.includes('source changed'));
 console.log(n+' saved report screen checks passed (synthetic DOM and mocked RPC).');
})().catch(e=>{console.error(e);process.exitCode=1;});
