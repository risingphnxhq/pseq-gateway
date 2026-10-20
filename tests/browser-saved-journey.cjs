// Real Chromium smoke checks of local construction source with fictional data only.
// No external PBS preview navigation, account creation, model calls or deployment.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
let checks=0,chrome,server,ws;const pending=new Map(),errors=[];let seq=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms)),ok=(label,v)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
async function cdp(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw Error('Browser condition timed out: '+expression+'; '+JSON.stringify(await evaluate("({message:document.getElementById('message')?.textContent,active:document.activeElement?.id,sampleClicks:window._sampleClicks,errors:"+JSON.stringify(errors)+"})")));}
module.exports=async function({email,password,businessId}){const result={type:'REAL_CHROME_AUTHENTICATED_SAVED_JOURNEY',checks:[]};const record=(label,v)=>{ok(label,v);result.checks.push({label,passed:!!v});};try{
 const root=process.cwd();server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const bin=execFileSync('which',['google-chrome'],{encoding:'utf8'}).trim();
 chrome=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9222','--user-data-dir='+process.env.RUNNER_TEMP+'/pbs-chrome','about:blank'],{stdio:'ignore'});
 let target;for(let i=0;i<100;i++){try{target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();break;}catch{await pause(100);}}if(!target)throw Error('Chrome did not start');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 await cdp('Runtime.enable');await cdp('Page.enable');
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Page.javascriptDialogOpening')cdp('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});});
 const go=async()=>{await cdp('Page.navigate',{url:'http://127.0.0.1:8765/consultation.html'});await until("document.readyState==='complete'&&!!document.getElementById('saved-assessment')");};
 const click=async text=>evaluate("([...document.querySelectorAll('button')].find(e=>e.textContent==="+JSON.stringify(text)+").onclick())");
 const fill=async values=>evaluate("Object.entries("+JSON.stringify(values)+").forEach(([id,value])=>{const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));})");
 const signin=async()=>{await fill({email,password});await evaluate("document.getElementById('sign-in').requestSubmit()");await until("!document.getElementById('account-controls').hidden&&document.getElementById('business-select').value==="+JSON.stringify(businessId));};
 await go();await signin();record('browser verifies normal sign-in and owned business',await evaluate("document.getElementById('password').value===''"));
 await evaluate("document.getElementById('assessment-goal').value='Fictional browser delivery goal';for(const e of document.querySelectorAll('[id^=assessment-answer-]'))e.value='2';for(const e of document.querySelectorAll('[id^=assessment-risk-]'))e.value='no';document.getElementById('assessment-goal').dispatchEvent(new Event('input',{bubbles:true}))");
 await click('Save these answers privately');record('browser saves assessment answers',await evaluate("document.getElementById('assessment-status').textContent.includes('answers are saved')"));
 await click('Save or recover my calculated report');const reportText=await evaluate("document.getElementById('assessment-saved-report').textContent");
 const reportId=reportText.match(/report ([0-9a-f-]{36})/)?.[1];record('browser receives saved calculated report',!!reportId&&reportText.includes('YELLOW'));
 await click('Use this assessment to prepare my business discussion');
 await fill({'case-business-model':'Fictional project service paid for agreed deliveries','case-constraints':'One owner, no extra spending; fictional test records only','case-hours':'1','case-budget':'0'});
 await evaluate("document.getElementById('case-profile-form').requestSubmit()");
 await until("document.getElementById('case-status').textContent.includes('information is saved')");
 record('browser saves case context from the same assessment',await evaluate("document.getElementById('case-goal').value==='Fictional browser delivery goal'&&!document.getElementById('case-dialogue').hidden"));
 await fill({'assessment-owner':'Fictional browser owner','assessment-hours':'1','assessment-budget':'0','assessment-start':new Date().toISOString().slice(0,10)});
 await click('Prepare my four-task working plan');record('browser prepares four working tasks',await evaluate("!document.getElementById('workspace').hidden&&document.querySelectorAll('#tasks article').length===4"));
 result.assessment_snapshot_id=await evaluate("window.PBSWorkspace.getCurrentDraft().legacy_plan_record.origin.snapshot_id");record('plan retains the saved assessment after capacity inputs',typeof result.assessment_snapshot_id==='string'&&/^[0-9a-f-]{36}$/.test(result.assessment_snapshot_id));
 await click('Save current consultation draft');record('browser saves consultation draft',await evaluate("document.getElementById('cloud-message').textContent.includes('Saved draft version 1')"));
 await click('Register current four tasks');record('browser registers four tasks',await evaluate("document.querySelectorAll('#execution-record article').length===4"));
 record('browser displays required submission disclosure',await evaluate("document.querySelector('#execution-record .checkline label').textContent.includes('inadequate')"));
 await evaluate("(()=>{const f=document.querySelector('#execution-record article form');f.querySelector('input:not([type=checkbox])').value='Fictional browser worksheet';f.querySelector('textarea').value='Incomplete fictional work: baseline date still missing; no improvement claimed.';f.querySelector('input[type=checkbox]').checked=true;f.requestSubmit()})()");
 await until("document.getElementById('execution-message').textContent.includes('Online submission receipt')");
 const receiptText=await evaluate("(()=>{const r=document.querySelector('#execution-record .receipt').cloneNode(true);r.querySelectorAll('button').forEach(b=>b.remove());return r.textContent})()");record('browser receives receipt without quality approval',receiptText.includes('Quality unassessed'));
 await evaluate("(()=>{const f=document.querySelector('#execution-record article form');f.querySelector('input:not([type=checkbox])').value='Fictional revised worksheet';f.querySelector('textarea').value='Revised fictional work adds a dated baseline; quality and real improvement remain unverified.';f.querySelector('input[type=checkbox]').checked=true;f.requestSubmit()})()");
 await until("document.querySelectorAll('#execution-record .receipt').length===2");
 record('revised work preserves earlier receipt on same task',await evaluate("(()=>{const r=document.querySelector('#execution-record .receipt').cloneNode(true);r.querySelectorAll('button').forEach(b=>b.remove());return r.textContent})()")==receiptText);
 record('revised submission still has no quality approval',await evaluate("[...document.querySelectorAll('#execution-record .receipt')].every(e=>e.textContent.includes('Quality unassessed'))"));
 await go();record('refresh requires new sign-in',await evaluate("!document.getElementById('sign-in').hidden&&document.getElementById('account-controls').hidden"));
 await signin();await click('Find saved drafts');await evaluate("document.querySelector('#cloud-records button').click()");await until("!document.getElementById('workspace').hidden");
 record('browser recovers saved plan after refresh',await evaluate("document.querySelectorAll('#tasks article').length===4"));
 await click('Find registered consultations');await evaluate("document.querySelector('#execution-list-results button').click()");await until("!!document.querySelector('#execution-record .receipt')");
 record('browser recovers exact receipt after refresh',await evaluate("(()=>{const r=document.querySelector('#execution-record .receipt').cloneNode(true);r.querySelectorAll('button').forEach(b=>b.remove());return r.textContent})()")==receiptText);
 await click('Recover my case');record('browser recovers same business case after refresh',await evaluate("document.getElementById('case-goal').value==='Fictional browser delivery goal'&&document.getElementById('case-status').textContent.includes('recovered')"));
 record('browser retains both submission attempts after refresh',await evaluate("document.querySelectorAll('#execution-record .receipt').length===2"));
 await click('Find my saved assessments');await evaluate("[...document.querySelectorAll('#saved-assessment button')].find(e=>e.textContent.startsWith('Load assessment ·')).click()");await until("document.getElementById('assessment-status').textContent.includes('recovered')");
 await click('Save or recover my calculated report');record('browser recovers same saved report',await evaluate("document.getElementById('assessment-saved-report').textContent.includes("+JSON.stringify(reportId)+")"));
 await click('Sign out');record('browser sign-out clears plan tasks and report',await evaluate("document.getElementById('workspace').hidden&&!document.querySelector('#execution-record .receipt')&&document.getElementById('assessment-saved-report').children.length===0"));
 record('authenticated browser has no unhandled script exceptions',errors.length===0);
 result.report_id=reportId;result.business_id=businessId;return result;
 }catch(e){e.browser_evidence=result;throw e;}finally{ws?.close();chrome?.kill();server?.close();}
};
