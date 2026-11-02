const {parseHTML}=require('linkedom'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;const ok=x=>{assert.ok(x);checks++};
function setup(script){const {window}=parseHTML(fs.readFileSync('consultation.html','utf8')),d=window.document;window.confirm=()=>true;const select=d.getElementById('business-select');Object.defineProperty(select,'value',{get(){return this.getAttribute('data-value')||''},set(v){this.setAttribute('data-value',v)}});select.value='business-a';let resolve;window.PBSAccountClient={rpc:()=>new Promise(r=>resolve=r)};vm.runInNewContext(fs.readFileSync(script,'utf8'),{window,document:d,Blob,URL,setTimeout,crypto});return {window,d,select,finish:data=>resolve({data,error:null})};}
(async()=>{
// An A → B → A transition must invalidate the first A's pending response.
for(const script of ['case-client.js','execution-client.js']){
 const x=setup(script),isCase=script.startsWith('case'),button=x.d.getElementById(isCase?'case-find':'execution-list');
 const request=button.onclick();x.select.value='business-b';x.select.dispatchEvent(new x.window.Event('change'));x.select.value='business-a';x.select.dispatchEvent(new x.window.Event('change'));
 x.finish(isCase?[{case_id:'old-case'}]:[{consultation_id:'old-consultation',goal:'Old response',month:'2026-10-01'}]);await request;
 ok(x.d.getElementById(isCase?'case-history':'execution-list-results').children.length===0);
 ok(x.d.getElementById(isCase?'case-status':'execution-message').textContent==='');
 if(isCase)ok(x.d.getElementById('case-dialogue').hidden);
}
// Sign-out during a pending request must keep private history cleared.
for(const script of ['case-client.js','execution-client.js']){
 const x=setup(script),isCase=script.startsWith('case');const request=x.d.getElementById(isCase?'case-find':'execution-list').onclick();
 x.d.dispatchEvent(new x.window.CustomEvent('pbs-account-signed-out'));
 x.finish(isCase?[{case_id:'old-case'}]:[{consultation_id:'old-consultation',goal:'Old response',month:'2026-10-01'}]);await request;
 ok(x.d.getElementById(isCase?'case-history':'execution-list-results').children.length===0);
 ok(x.d.getElementById(isCase?'case-status':'execution-message').textContent==='');
}
console.log(checks+' delayed-response separation checks passed (mocked transport).');
})().catch(e=>{console.error(e);process.exitCode=1;});
