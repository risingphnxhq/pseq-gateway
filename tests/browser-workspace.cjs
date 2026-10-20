// Real Chromium smoke checks of local construction source with fictional data only.
// No external PBS preview navigation, account creation, model calls or deployment.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
let checks=0,chrome,server,ws;const pending=new Map(),errors=[];let seq=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms)),ok=(label,v)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
async function cdp(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw Error('Browser condition timed out: '+expression+'; '+JSON.stringify(await evaluate("({message:document.getElementById('message')?.textContent,active:document.activeElement?.id,sampleClicks:window._sampleClicks,errors:"+JSON.stringify(errors)+"})")));}
(async()=>{try{
 const root=process.cwd();server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end();}const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const bin=execFileSync('which',['google-chrome'],{encoding:'utf8'}).trim();
 chrome=spawn(bin,['--headless=new','--no-first-run','--disable-dev-shm-usage','--no-sandbox','--disable-gpu','--remote-debugging-port=9222','--user-data-dir='+process.env.RUNNER_TEMP+'/pbs-chrome','about:blank'],{stdio:'ignore'});
 let target;for(let i=0;i<300;i++){try{target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();break;}catch{await pause(100);}}if(!target)throw Error('Chrome did not start');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 await cdp('Runtime.enable');await cdp('Page.enable');
 for(const width of [1280,390]){
 await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:'http://127.0.0.1:8765/consultation.html'});
 await until("document.readyState==='complete' && !!document.getElementById('saved-assessment') && !!document.getElementById('working-plan-builder')");
 ok('scripts initialize at '+width,await evaluate("!!window.PBSAccountClient && !!window.PBSAssessmentContinuity && !!window.PBSWorkspace"));
 await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 ok('keyboard reaches skip link at '+width,await evaluate("document.activeElement.classList.contains('skip')"));
 await evaluate("window._sampleClicks=0;document.getElementById('sample').addEventListener('click',()=>window._sampleClicks++);document.getElementById('sample').focus()");
 await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await until("!document.getElementById('workspace').hidden");
 ok('keyboard opens fictional plan at '+width,await evaluate("document.querySelectorAll('#tasks article').length===4"));
 ok('no horizontal page overflow at '+width,await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"));
 ok('form controls have names at '+width,await evaluate("[...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(e=>e.getClientRects().length).every(e=>e.labels?.length||e.getAttribute('aria-label')||e.getAttribute('aria-labelledby'))"));
 const pdf=await cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});
 ok('browser produces nonempty print PDF at '+width,typeof pdf.data==='string'&&pdf.data.length>1000);
 ok('print completion clears temporary view at '+width,await evaluate("!document.getElementById('pbs-print-view')"));
 }
 ok('no unhandled browser script exceptions',errors.length===0);
 console.log(JSON.stringify({type:'REAL_HEADLESS_CHROMIUM_LOCAL_SOURCE_SMOKE',checks,passed:checks,viewports:[1280,390],fictional_only:true,authenticated_browser_journey:false,visual_screenshot_review:false,external_sites_visited:false,errors}));
 }catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();chrome?.kill();server?.close();}
})();
