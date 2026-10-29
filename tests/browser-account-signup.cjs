// Real Chromium smoke checks of local construction source with fictional data only.
// No external PBS preview navigation, account creation, model calls or deployment.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
let checks=0,chrome,server,ws;const pending=new Map(),errors=[];let seq=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms)),ok=(label,v)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
async function cdp(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw Error('Browser condition timed out: '+expression+'; '+JSON.stringify(await evaluate("({message:document.getElementById('message')?.textContent,active:document.activeElement?.id,sampleClicks:window._sampleClicks,errors:"+JSON.stringify(errors)+"})")));}
async function browserSignup({email,password}){const result={type:'REAL_CHROME_ACCOUNT_CREATION',checks:[]};const record=(label,v)=>{ok(label,v);result.checks.push({label,passed:!!v});};try{
 const root=process.cwd();server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const bin=execFileSync('which',['google-chrome'],{encoding:'utf8'}).trim();
 chrome=spawn(bin,['--headless=new','--no-first-run','--disable-dev-shm-usage','--no-sandbox','--disable-gpu','--remote-debugging-port=9222','--user-data-dir='+process.env.RUNNER_TEMP+'/pbs-chrome','about:blank'],{stdio:'ignore'});
 let target;for(let i=0;i<300;i++){try{target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();break;}catch{await pause(100);}}if(!target)throw Error('Chrome did not start');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 await cdp('Runtime.enable');await cdp('Page.enable');
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://127.0.0.1:8765/account.html'});
 await until("document.readyState==='complete'&&!!window.PBSAccountClient");
 const fill=values=>evaluate("Object.entries("+JSON.stringify(values)+").forEach(([id,v])=>document.getElementById(id).value=v)");
 await fill({'signup-email':email,'signup-password':password,'signup-confirm':password});
 await evaluate("document.getElementById('signup-form').requestSubmit()");
 await until("document.getElementById('account-message').textContent.includes('Your account was created')||document.getElementById('account-message').textContent.includes('If account confirmation')");
 record('browser account creation confirmed by current service',await evaluate("document.getElementById('account-message').textContent.includes('Your account was created')"));
 record('signup password fields cleared',await evaluate("document.getElementById('signup-password').value===''&&document.getElementById('signup-confirm').value===''"));
 record('signup does not leave a hidden signed-in session',await evaluate("(async()=>!(await window.PBSAccountClient.auth.getSession()).data.session)()"));
 await cdp('Page.navigate',{url:'http://127.0.0.1:8765/consultation.html#account-panel'});
 await until("document.readyState==='complete'&&!!document.getElementById('saved-assessment')");
 const signin=async()=>{await fill({email,password});await evaluate("document.getElementById('sign-in').requestSubmit()");await until("!document.getElementById('account-controls').hidden&&(document.getElementById('cloud-message').textContent.includes('Choose your business')||document.getElementById('cloud-message').textContent.includes('No owned business'))");};
 await signin();
 const identity=await evaluate("(async()=>{const r=await window.PBSAccountClient.auth.getUser();return r.error?null:r.data.user.id;})()");
 record('new account signs in and verifies through server',!!identity);
 record('new account sees no other customer businesses',await evaluate("document.getElementById('business-select').options.length===0"));
 await fill({'new-business':'Fictional PBS browser signup business'});
 await evaluate("document.getElementById('create-business').onclick()");
 await until("document.getElementById('business-select').value.length===36");
 const businessId=await evaluate("document.getElementById('business-select').value");record('new owner creates existing private business record',!!businessId);
 await evaluate("document.getElementById('sign-out').onclick()");
 record('new owner sign-out clears business selector',await evaluate("document.getElementById('business-select').options.length===0"));
 await cdp('Page.reload');await until("document.readyState==='complete'&&!!document.getElementById('saved-assessment')");
 await signin();record('new account recovers same owned business after refresh',await evaluate("document.getElementById('business-select').value")==businessId);
 await evaluate("document.getElementById('sign-out').onclick()");
 record('signup journey has no unhandled browser exceptions',errors.length===0);
 result.subject=identity;result.business_id=businessId;result.email_confirmed_by_test=false;return result;
}catch(e){e.browser_evidence=result;throw e;}finally{ws?.close();chrome?.kill();server?.close();}
}
const {createClient}=require('@supabase/supabase-js'),crypto=require('node:crypto');
if(process.env.PBS_RUN_ACCOUNT_SIGNUP_TEST!=='yes')throw Error('Explicit signup-test opt-in required.');
(async()=>{const email='pbs-signup-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(32).toString('base64url'),evidence={date:new Date().toISOString(),actor:'Codex',type:'LIVE_NORMAL_UI_SIGNUP_NOT_EMAIL_RECOVERY_ACCEPTANCE',ai_requests:0,policy_changes:0};let c;
try{evidence.browser=await browserSignup({email,password});evidence.state='PASS';}catch(e){evidence.browser=e.browser_evidence;evidence.state='INCOMPLETE';evidence.failure=e.message;process.exitCode=1;}
finally{
 c=createClient('https://oyjmpbuxvfxusmbouldi.supabase.co','sb_publishable_rwTE4QRlQkzr0R0f5t5ylA_a9zuj0eE',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const login=await c.auth.signInWithPassword({email,password});evidence.cleanup={normal_signin_for_global_signout:!login.error,global_signout_requested:false};
 if(!login.error)evidence.cleanup.global_signout_requested=!(await c.auth.signOut({scope:'global'})).error;
 c.auth.stopAutoRefresh();console.log(JSON.stringify(evidence));
}})();
