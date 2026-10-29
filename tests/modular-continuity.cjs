const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
function setup(layer){
 const {window}=parseHTML('<html><body><main><div class="hero"></div><select id="business-select"><option value="owner-A">Business A</option></select><select id="assessment-mode"><option value="PQS">PQS</option><option value="PBRS">PBRS</option></select><form id="sign-in"></form><button id="sign-out"></button>'+['saved-assessment','working-plan-builder','plan-import-panel','workspace','server-execution','consultative-case','advisor-panel','assessment-plan-options'].map(id=>'<section id="'+id+'"></section>').join('')+'</main></body></html>');
 const d=window.document;for(const [id,initial]of [['business-select','owner-A'],['assessment-mode','PBRS']]){let v=initial;Object.defineProperty(d.getElementById(id),'value',{get:()=>v,set:x=>v=x,configurable:true});}window.location={href:'https://pseq.risingphoenixhq.com/consultation.html?use='+layer.toLowerCase()};window.history={replaceState(){}};window.PBSAccountClient={};let deny=false,pending=null;
 const snapshot={id:'a',prs_payload:{input:{mode:'PBRS'}}};
 window.PBSOwnedRecovery={create:()=>({clear(){},async discover(){if(deny)throw Error('Access denied');return {assessments:[{...snapshot,created_at:'today'}],plans:[{draft_id:'p',updated_at:'today',revision:2}],monthly:[{consultation_id:'m',goal:'Grow',month:'2026-10'}]}},async assessment(){if(pending)await pending;return snapshot},async plan(){return {payload:{id:'p'}}},async monthly(){return {consultation_id:'m',business_id:'owner-A'}}})};
 const context=vm.createContext({window,document:d,URL,console});for(const name of ['recovery-client.js','pbs-entry.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+name,'utf8'),context);
 const button=text=>[...d.querySelectorAll('button')].find(x=>x.textContent.startsWith(text));
 return {window,d,button,setDenied:()=>deny=true,setPending:p=>pending=p};
}
for(const layer of ['PQS','PBRS','PBB','PSEQ','ALL'])test(layer+' preserves optional access to every saved system',async()=>{
 const x=setup(layer);assert.equal(x.window.PBSEntry.current(),layer);await x.button('Find saved work').onclick();
 for(const label of ['Continue in PBRS','Continue in PBB','Continue in PSEQ'])assert.ok(x.button(label));
 for(const [label,destination,event]of [['Continue in PBRS','PBRS','pbs-recover-assessment'],['Continue in PBB','PBB','pbs-recover-plan'],['Continue in PSEQ','PSEQ','pbs-recover-monthly']]){
  await x.button('Find saved work').onclick();let got=null;const listener=e=>{got=e.detail;e.detail.onOpened?.();};x.d.addEventListener(event,listener);await x.button(label).onclick();x.d.removeEventListener(event,listener);
  assert.equal(x.window.PBSEntry.current(),destination);assert.equal(got.business_id,'owner-A');
 }
 x.window.PBSEntry.select('ALL');assert.equal(x.window.PBSEntry.current(),'ALL');assert.equal(x.d.getElementById('business-select').value,'owner-A');
});
test('business switch rejects an in-flight handoff',async()=>{
 const x=setup('PQS');await x.button('Find saved work').onclick();let release; x.setPending(new Promise(r=>release=r));let calls=0;x.d.addEventListener('pbs-recover-assessment',()=>calls++);
 const job=x.button('Continue in PBRS').onclick();x.d.getElementById('business-select').dispatchEvent(new x.window.Event('change'));release();await job;assert.equal(calls,0);
});
test('denied discovery cannot expose records',async()=>{
 const x=setup('PSEQ');x.setDenied();await x.button('Find saved work').onclick();assert.equal(x.d.getElementById('recovery-results').children.length,0);assert.equal(x.button('Continue in PBB'),undefined);
});
