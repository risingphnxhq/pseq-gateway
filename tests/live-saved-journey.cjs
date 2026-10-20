/* Explicit opt-in integration test. Creates at most two synthetic accounts through normal
 * signup, never requests AI or changes policy, and retains only non-secret evidence.
 * Credentials and sessions stay in process memory. No admin auth or impersonation. */
const {createClient}=require('@supabase/supabase-js'),crypto=require('node:crypto'),fs=require('node:fs'),E=require('../pbs-diagnostic-engine'),B=require('../pbs-assessment-continuity'),C=require('../pbs-consultation-engine'),W=require('../pbs-working-plan');
if(process.env.PBS_RUN_NORMAL_ACCOUNT_TEST!=='yes')throw Error('Set PBS_RUN_NORMAL_ACCOUNT_TEST=yes to run the authorized synthetic-account test.');
const url='https://oyjmpbuxvfxusmbouldi.supabase.co',key='sb_publishable_rwTE4QRlQkzr0R0f5t5ylA_a9zuj0eE',clients=[],credentials=[],evidence={date:new Date().toISOString(),actor:'Codex',type:'LIVE_NORMAL_AUTH_API_NOT_BROWSER_OR_INDEPENDENT_ACCEPTANCE',ai_requests:0,policy_changes:0,checks:[],records:[],cleanup:[]};
function check(label,value){evidence.checks.push({label,passed:!!value});if(!value)throw Error(label);console.log('PASS '+label);}
async function rpc(c,name,args){const r=await c.rpc(name,args);if(r.error)throw Error(name+': '+r.error.code+' '+r.error.message);return r.data;}
// The optional Python transport respects the host's configured HTTP proxy.
// Request credentials travel over stdin, never command arguments or log output.
async function transport(u,o){
 if(process.env.PBS_TEST_HTTP_TRANSPORT!=='python')return fetch(u,{...o,signal:AbortSignal.timeout(20000)});
 const {spawn}=require('node:child_process');
 const program=`import json,sys,urllib.request,urllib.error
v=json.load(sys.stdin)
r=urllib.request.Request(v['url'],data=v.get('body','').encode() if v.get('body') is not None else None,headers=v['headers'],method=v['method'])
try:
 with urllib.request.urlopen(r,timeout=20) as x: print(json.dumps({'status':x.status,'headers':dict(x.headers),'body':x.read().decode()}))
except urllib.error.HTTPError as x: print(json.dumps({'status':x.code,'headers':dict(x.headers),'body':x.read().decode()}))
except Exception as e: print(json.dumps({'transport_error':type(e).__name__}))
`
 const value=await new Promise((resolve,reject)=>{const p=spawn('python3',['-c',program],{stdio:['pipe','pipe','pipe']}),chunks=[];const timer=setTimeout(()=>{p.kill();reject(Error('HTTP test transport timed out'));},25000);p.stdout.on('data',c=>chunks.push(c));p.stderr.resume();p.on('error',()=>{clearTimeout(timer);reject(Error('HTTP test transport unavailable'));});p.on('close',code=>{clearTimeout(timer);if(code!==0)return reject(Error('HTTP test transport failed'));try{resolve(JSON.parse(Buffer.concat(chunks).toString()));}catch{reject(Error('HTTP test transport response unreadable'));}});p.stdin.end(JSON.stringify({url:String(u),method:o?.method||'GET',headers:Object.fromEntries(new Headers(o?.headers).entries()),body:o?.body??null}));});
 if(value.transport_error)throw Error('HTTP test transport: '+value.transport_error);
 return new Response([204,205,304].includes(value.status)?null:value.body,{status:value.status,headers:value.headers});
}
const newClient=()=>{const c=createClient(url,key,{global:{fetch:transport},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});clients.push(c);return c;};
(async()=>{try{
 for(let i=0;i<2;i++){
  const c=newClient(),email='pbs-continuity-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(32).toString('base64url');credentials.push({email,password});
  const r=await c.auth.signUp({email,password});
  if(r.error)throw Error('NORMAL_SIGNUP_BLOCKED: '+r.error.code);
  if(!r.data.session)throw Error('NORMAL_SIGNUP_REQUIRES_EMAIL_CONFIRMATION: no session; no administrative confirmation attempted');
  check('normal signup '+(i+1)+' verified',!!(await c.auth.getUser()).data.user);
 }
 const [a,b]=clients,ids=[];
 for(let i=0;i<2;i++){const c=clients[i],r=await rpc(c,'pbs_create_business_v1',{p_name:'Fictional PBS continuity '+(i+1),p_request_id:crypto.randomUUID()});ids.push(r.business_id);evidence.records.push({subject:(await c.auth.getUser()).data.user.id,business_id:r.business_id});}
 const input={mode:'PBRS',context:{business:'Fictional PBS continuity 1',stage:'operating',goal:'Improve delivery reliability'},answers:Object.fromEntries(E.questions('full').map(q=>[q.id,2])),risks:Object.fromEntries(E.RISKS.map(r=>[r.id,false])),references:{}};
 input.answers.goal=null;const req=crypto.randomUUID(),saved=await rpc(a,'pbs_save_assessment_draft_v1',{p_business_id:ids[0],p_request_id:req,p_draft:input});
 check('assessment save returns identity',!!saved.snapshot_id);const replay=await rpc(a,'pbs_save_assessment_draft_v1',{p_business_id:ids[0],p_request_id:req,p_draft:input});check('assessment retry has same identity',saved.snapshot_id===replay.snapshot_id&&replay.duplicate===true);
 const changed=structuredClone(input);changed.answers.goal=3;const conflict=await a.rpc('pbs_save_assessment_draft_v1',{p_business_id:ids[0],p_request_id:req,p_draft:changed});check('changed assessment retry rejected',!!conflict.error);
 const read=await a.from('pbs_prs_snapshots').select('engine_version,prs_payload').eq('entity_id',ids[0]).eq('id',saved.snapshot_id).single();check('owner recovers assessment',!read.error);const restored=B.fromSnapshot(read.data);check('unknown answer retained',restored.answers.goal===null);check('declared report recalculates without Green invention',B.validate(restored).status==='YELLOW');
 const denied=await b.from('pbs_prs_snapshots').select('id').eq('entity_id',ids[0]);check('other customer cannot read assessment',!denied.error&&denied.data.length===0);
 const denySave=await b.rpc('pbs_save_assessment_draft_v1',{p_business_id:ids[0],p_request_id:crypto.randomUUID(),p_draft:input});check('other customer cannot save assessment',denySave.error?.code==='42501');
 const reportArgs={p_business_id:ids[0],p_snapshot_id:saved.snapshot_id},serverReport=await rpc(a,'pbs_assessment_report_v1',reportArgs);
 evidence.records[0].assessment_snapshot_id=saved.snapshot_id;evidence.records[0].assessment_report_id=serverReport.report_id;
 check('server report bound to stored answers',serverReport.report.source_snapshot_id===saved.snapshot_id&&serverReport.report.input.answers.goal===null&&serverReport.report.calculated.status==='YELLOW');
 check('server report matches current scoring method',serverReport.report.calculated.method_version===E.VERSION&&serverReport.report.calculated.coverage===B.validate(restored).coverage&&serverReport.report.calculated.independent_verifications===0);
 const reportReplay=await rpc(a,'pbs_assessment_report_v1',reportArgs);check('server report retry returns same saved report',reportReplay.report_id===serverReport.report_id&&reportReplay.duplicate===true);
 const otherReport=await b.rpc('pbs_assessment_report_v1',reportArgs);check('other customer report denied',otherReport.error?.code==='42501');
 const wrongBusinessReport=await b.rpc('pbs_assessment_report_v1',{p_business_id:ids[1],p_snapshot_id:saved.snapshot_id});check('owned business cannot import another business source',wrongBusinessReport.error?.code==='42501');
 const directReport=await a.from('pbs_prs_snapshots').update({prs_payload:{status:'GREEN'}}).eq('id',serverReport.report_id);check('customer cannot rewrite server report',directReport.error?.code==='42501');
 const p=B.plan(restored,{owner:'Fictional business owner',hours:1,budget:0,start:new Date().toISOString().slice(0,10),snapshotId:saved.snapshot_id}),month=new Date().toLocaleDateString('en-CA',{timeZone:'America/Chicago'}).slice(0,7);
 // Explicit month independent of locale formatting differences.
 const parts=new Intl.DateTimeFormat('en',{timeZone:'America/Chicago',year:'numeric',month:'2-digit'}).formatToParts(new Date()),period=parts.find(x=>x.type==='year').value+'-'+parts.find(x=>x.type==='month').value;
 let draft=C.create(p,period);draft=W.edit(draft,draft.tasks[0].id,{...Object.fromEntries(['title','action','reason','owner','acceptance','measure','record'].map(k=>[k,draft.tasks[0][k]])),acceptance:'Dated baseline, named owner and source of on-time delivery measure recorded.'});
 const dargs={p_business_id:ids[0],p_draft_id:draft.id,p_request_id:crypto.randomUUID(),p_expected_revision:0,p_payload:draft},d=await rpc(a,'pbs_save_consultation_draft_v1',dargs);check('adapted consultation saved',d.revision===1);
 const dd=await rpc(a,'pbs_save_consultation_draft_v1',dargs);check('draft replay single version',dd.revision===1);
 const dl=await rpc(a,'pbs_load_consultation_draft_v1',{p_business_id:ids[0],p_draft_id:draft.id,p_revision:null});check('adapted requirements recovered',dl.payload.tasks[0].acceptance===draft.tasks[0].acceptance);
 const stale=await a.rpc('pbs_save_consultation_draft_v1',{...dargs,p_request_id:crypto.randomUUID()});evidence.stale_response={status:stale.status,code:stale.error?.code,message:stale.error?.message};const staleOK=!!stale.error&&(['40001','PT409'].includes(stale.error.code)||stale.error.message?.includes('PBS_REVISION_CONFLICT'));evidence.checks.push({label:'stale save rejected',passed:staleOK});console.log(staleOK?'PASS stale save rejected':'UNCONFIRMED stale-save HTTP response');
 const tasks=draft.tasks.map(t=>Object.fromEntries(['title','action','reason','owner','acceptance','measure','record'].map(k=>[k,t[k]]))),startArgs={p_business_id:ids[0],p_request_id:crypto.randomUUID(),p_command:'START',p_arguments:{goal:draft.goal,stage:draft.stage,tasks}},execution=await rpc(a,'pbs_execution_command_v1',startArgs),cid=execution.consultation_id;
 evidence.records[0].consultation_id=cid;const state=await rpc(a,'pbs_execution_read_v1',{p_business_id:ids[0],p_consultation_id:cid});check('four actual registered tasks',state.tasks.length===4);check('no imported acceptance credit',state.tasks.every(t=>t.status!=='ACCEPTED'));
 const sub={consultation_id:cid,expected_revision:state.revision,task_id:state.tasks[0].id,reference:'Fictional baseline worksheet',note:'Incomplete draft: baseline source date is missing. This deliberately inadequate work does not prove improvement.',acknowledged:false,declared_complete:true,disclosure_version:state.disclosure.version};
 const noack=await a.rpc('pbs_execution_command_v1',{p_business_id:ids[0],p_request_id:crypto.randomUUID(),p_command:'SUBMIT',p_arguments:sub});check('submission without acknowledgment rejected',!!noack.error);
 sub.acknowledged=true;const subargs={p_business_id:ids[0],p_request_id:crypto.randomUUID(),p_command:'SUBMIT',p_arguments:sub},receipt=await rpc(a,'pbs_execution_command_v1',subargs),receiptReplay=await rpc(a,'pbs_execution_command_v1',subargs);check('inadequate submission gets stable receipt',!!receipt.token&&receiptReplay.token===receipt.token);
 const after=await rpc(a,'pbs_execution_read_v1',{p_business_id:ids[0],p_consultation_id:cid});check('one submission and no quality approval',after.tasks[0].submissions.length===1&&!after.tasks[0].submissions[0].quality_assessment&&after.tasks[0].status!=='ACCEPTED');
 const cross=await b.rpc('pbs_execution_read_v1',{p_business_id:ids[0],p_consultation_id:cid});check('other customer execution denied',cross.error?.code==='42501');
 const profile={stage:'operating',business_model:'Fictional service business with project fees',decision:'Improve reliable handoffs before taking new work',goal:draft.goal,weekly_hours:1,experiment_budget:0,constraints:'One owner; no new spending; evidence incomplete'};
 const caseSaved=await rpc(a,'pbs_case_create_v1',{p_business_id:ids[0],p_request_id:crypto.randomUUID(),p_profile:profile});evidence.records[0].case_id=caseSaved.case_id;
 const caseDenied=await b.rpc('pbs_case_read_v1',{p_business_id:ids[0],p_case_id:caseSaved.case_id});check('other customer case denied',caseDenied.error?.code==='42501');
 const extra=newClient(),login=await extra.auth.signInWithPassword(credentials[0]);check('fresh session ordinary sign-in',!login.error&&!!login.data.session);
 const recovered=await rpc(extra,'pbs_execution_read_v1',{p_business_id:ids[0],p_consultation_id:cid});check('new session recovers same receipt',recovered.tasks[0].submissions[0].token===receipt.token);
 const recoveredCase=await rpc(extra,'pbs_case_read_v1',{p_business_id:ids[0],p_case_id:caseSaved.case_id});check('new session recovers business context',recoveredCase.profile.goal===profile.goal);
 const recoveredDraft=await rpc(extra,'pbs_load_consultation_draft_v1',{p_business_id:ids[0],p_draft_id:draft.id,p_revision:null});check('new session recovers unchanged draft',recoveredDraft.payload.id===draft.id);
 const freshReport=await rpc(extra,'pbs_assessment_report_v1',reportArgs);check('fresh session recovers same calculated report',freshReport.report_id===serverReport.report_id&&freshReport.duplicate===true);
 evidence.state=evidence.checks.every(c=>c.passed)?'PASS':'INCOMPLETE';if(evidence.state!=='PASS')process.exitCode=1;
}catch(e){evidence.state='INCOMPLETE';evidence.failure=e.message;process.exitCode=1;}
finally{for(const c of clients){const {error}=await c.auth.signOut({scope:'global'});evidence.cleanup.push({global_signout_requested:!error});c.auth.stopAutoRefresh();}credentials.length=0;fs.writeFileSync(process.env.PBS_EVIDENCE_PATH||'pbs-live-continuity-evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));}
})();
