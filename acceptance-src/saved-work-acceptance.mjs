export function mountSavedWorkTest({document:d,client,engine,storage,uuid=()=>crypto.randomUUID()}){
 const out=d.getElementById('work-status'),key='pbs-acceptance-reference-v1';let busy=false;
 const tell=x=>out.textContent=x;
 async function identity(){const r=await client.auth.getUser();if(r.error||!r.data?.user?.id)throw Error('Sign in and confirm your PBS identity first.');return r.data.user.id;}
 async function rpc(name,args){const r=await client.rpc(name,args);if(r.error)throw Error(r.error.message);return r.data;}
 async function run(fn){if(busy)return;busy=true;for(const b of d.querySelectorAll('[data-work-test]'))b.disabled=true;try{tell('Checking…');await fn();}catch(e){tell('Not confirmed: '+e.message);}finally{busy=false;for(const b of d.querySelectorAll('[data-work-test]'))b.disabled=false;}}
 function reference(){let r;try{r=JSON.parse(storage.getItem(key));}catch{}if(!r?.owner||!r?.business||!r?.snapshot)throw Error('No complete test reference is stored in this browser. Create the fictional test first.');return r;}
 d.getElementById('create-test').onclick=()=>run(async()=>{
 const owner=await identity();let pending;try{pending=JSON.parse(storage.getItem(key));}catch{}if(pending&&pending.owner!==owner)throw Error('The stored test belongs to a different account.');if(pending?.snapshot)throw Error('A complete test already exists. Use Recover.');
 const name='Fictional PBS account acceptance';if(!pending){pending={owner,createRequest:uuid(),saveRequest:uuid()};storage.setItem(key,JSON.stringify(pending));}const business=pending.business?{business_id:pending.business}:await rpc('pbs_create_business_v1',{p_name:name,p_request_id:pending.createRequest});
 if(!business.business_id)throw Error('The server did not return a business identity.');pending.business=business.business_id;storage.setItem(key,JSON.stringify(pending));
 const input={mode:'PBRS',context:{business:name,stage:'operating',goal:'Test saved-work continuity; fictional data only'},answers:Object.fromEntries(engine.questions('full').map(q=>[q.id,2])),risks:Object.fromEntries(engine.RISKS.map(r=>[r.id,false])),references:{}};input.answers.goal=null;
 const draft=await rpc('pbs_save_assessment_draft_v1',{p_business_id:business.business_id,p_request_id:pending.saveRequest,p_draft:input});
 if(!draft.snapshot_id)throw Error('The assessment save returned no snapshot identity.');
 const ref={owner,business:business.business_id,snapshot:draft.snapshot_id};storage.setItem(key,JSON.stringify(ref));
 tell('Fictional assessment saved. Reference: '+ref.business+'. Next: recover the saved assessment and report.');
 });
 d.getElementById('recover-test').onclick=()=>run(async()=>{
 const owner=await identity(),ref=reference();if(owner!==ref.owner)throw Error('This is a different account. Use the separation check instead.');
 const rows=await client.from('pbs_prs_snapshots').select('id,created_at,engine_version,prs_payload').eq('entity_id',ref.business).eq('engine_version','PBS-DRAFT-1.0.0').order('created_at',{ascending:false}).limit(100);
 if(rows.error)throw Error(rows.error.message);const saved=rows.data?.find(x=>x.id===ref.snapshot);if(!saved)throw Error('The saved assessment was not recovered.');
 const report=await rpc('pbs_assessment_report_v1',{p_business_id:ref.business,p_snapshot_id:ref.snapshot});
 if(report.report?.source_snapshot_id!==ref.snapshot||report.report?.input?.answers?.goal!==null||!report.report_id)throw Error('The report did not match the saved assessment.');
 tell('PASS: owned assessment recovered and server report matched the saved source, including its unanswered item. Refresh this page, sign in again and repeat Recover to test session recovery. This does not prove plan/monthly-work recovery or customer separation.');
 });
 d.getElementById('separation-test').onclick=()=>run(async()=>{
 const owner=await identity(),ref=reference();if(owner===ref.owner)throw Error('Sign out and use a different verified account for this check.');
 const r=await client.rpc('pbs_assessment_report_v1',{p_business_id:ref.business,p_snapshot_id:ref.snapshot});
 if(r.error?.code!=='42501')throw Error('Expected explicit ownership denial was not observed. No separation pass is recorded.');
 tell('PASS: a different verified account was denied the first account’s saved assessment report. This checks this report route only; other saved-work routes still need acceptance.');
 });
}
