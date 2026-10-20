/* Bounded fictional regression run. Normal signup only; no administrative auth,
 * secrets, model retries, quality publication, pricing or external commitments. */
const {createClient}=require('@supabase/supabase-js'),crypto=require('node:crypto');
if(process.env.PBS_RUN_LIVE_ADVICE!=='yes')throw Error('Explicit opt-in required');
const url='https://oyjmpbuxvfxusmbouldi.supabase.co',key='sb_publishable_rwTE4QRlQkzr0R0f5t5ylA_a9zuj0eE',label='PBS advice acceptance 20261020 1305';
const clients=[],evidence={date:new Date().toISOString(),actor:'Codex',type:'LIVE_FICTIONAL_V12_AND_BOUND_REVIEW_NOT_INDEPENDENT_ACCEPTANCE',subjects:[],cases:[],requests:[],checks:[],cleanup:[],quality_policy_changed:false};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const check=(label,v)=>{evidence.checks.push({label,passed:!!v});if(!v)throw Error(label);console.log('PASS '+label);};
async function rpc(c,name,args){const r=await c.rpc(name,args);if(r.error)throw Error(name+': '+r.error.code);return r.data;}
async function read(c,x){return rpc(c,'pbs_case_read_v1',{p_business_id:x.business_id,p_case_id:x.case_id});}
async function make(c,i,name,profile,anchor=false){const b=await rpc(c,'pbs_create_business_v1',{p_name:anchor?label+' '+(i?'B':'A'):label+' '+name,p_request_id:crypto.randomUUID()}),x=await rpc(c,'pbs_case_create_v1',{p_business_id:b.business_id,p_request_id:crypto.randomUUID(),p_profile:profile});const item={subject_index:i,name,business_id:b.business_id,case_id:x.case_id};evidence.cases.push(item);return item;}
const profile=(decision,hours=1)=>({stage:'operating',business_model:'Fictional small business selling agreed services to business customers',decision,goal:'Choose feasible work and compare actual results with a stated baseline',weekly_hours:hours,experiment_budget:0,constraints:'Fictional data only; no new purchase, hiring, borrowing or binding commitments'});
const turn=(mode,message,evidenceItems=[],submission_id)=>({mode,message,evidence:evidenceItems.map((observation,i)=>({id:'E'+(i+1),observation,source:'CUSTOMER_DECLARED'})),work:null,consent_version:'PBS-CUSTOMER-AI-1.0.0',consent_accepted:true,...(submission_id?{submission_id}:{})});
async function consult(c,x,name,t){
 const state=await read(c,x),session=(await c.auth.getSession()).data.session,body={operation:'CONSULT',business_id:x.business_id,case_id:x.case_id,request_id:crypto.randomUUID(),expected_revision:state.revision,turn:t};
 const r=await fetch(url+'/functions/v1/pbs-consultation',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(115000)});
 const data=await r.json(),record={name,subject_index:x.subject_index,business_id:x.business_id,case_id:x.case_id,http_status:r.status,response:data};evidence.requests.push(record);
 const recovered=await read(c,x),stored=recovered.turns.find(v=>v.run_id===data.run_id);record.saved_response_matches=!!stored&&JSON.stringify(stored.result)===JSON.stringify(data.result);record.stored_state=stored?.state;
 console.log('REQUEST '+name+' '+r.status+' '+(data.state||data.error));return {body,data,record};
}
(async()=>{let anchors=[];
try{
 for(let i=0;i<2;i++){const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});clients.push(c);const email='pbs-advice-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(32).toString('base64url'),r=await c.auth.signUp({email,password});if(r.error||!r.data.session)throw Error('Normal signup did not provide a session; no administrative bypass');const user=await c.auth.getUser();if(user.error)throw Error('Normal account verification failed');evidence.subjects.push(user.data.user.id);}
 const [a,b]=clients;
 const dana=await make(a,0,'Dana',profile('Reduce delays between finished work and invoice release'),true);
 const imani=await make(b,1,'Imani',profile('Continue using capital after a fictional funding milestone'),true);anchors=[dana,imani];
 const andre=await make(a,0,'Andre',profile('Check submitted work against its three agreed documentation requirements'));
 const luis=await make(a,0,'Luis',profile('Make customer handoffs reliable with thirty minutes a week',0.5));
 const grace=await make(b,1,'Grace',profile('Check contribution and break-even before increasing sales'));
 const priya=await make(b,1,'Priya',profile('Choose the next action with no available time and uncertain commitments',0));
 const sam=await make(b,1,'Sam',profile('Decide whether an additional tool purchase is justified'));
 console.log('ACCOUNTS_READY '+JSON.stringify({subjects:evidence.subjects,anchors}));
 let activated=false;
 for(let i=0;i<120;i++){if((await read(a,dana)).processing_enabled&&(await read(b,imani)).processing_enabled){activated=true;break;}await pause(3000);}
 if(!activated)throw Error('Temporary test access not activated within bounded wait');
 const cross=await b.rpc('pbs_case_read_v1',{p_business_id:dana.business_id,p_case_id:dana.case_id});check('second customer cannot read first case',cross.error?.code==='42501');
 const first=await consult(a,dana,'Dana usable invoice-release procedure',turn('BUILD','Draft the invoice-release procedure we should use next week from the supplied facts. Give me the actual usable procedure, rather than only questions or an investigation checklist.',['Twenty completed jobs waited three days before invoicing because the final work notes were not released internally. Customer payment terms are thirty days after invoice.','The owner approves completed-work notes. A bookkeeper can prepare invoices after approval. The owner has one hour weekly for improvements; no new software budget.']));
 // Exact replay must not spend another provider attempt.
 const session=(await a.auth.getSession()).data.session,replayResponse=await fetch(url+'/functions/v1/pbs-consultation',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(first.body),signal:AbortSignal.timeout(20000)}),replay=await replayResponse.json();
 check('saved model response replays without replacement',replay.duplicate===true&&replay.run_id===first.data.run_id&&JSON.stringify(replay.result)===JSON.stringify(first.data.result));
 const tasks=Array.from({length:4},(_,i)=>({title:i?'Fictional supporting task '+i:'Dated baseline brief',action:'Write the bounded work brief and identify missing evidence before acting',reason:'Documentation is needed before making a new commitment',owner:'Business owner',acceptance:i?'State a bounded action and the evidence still needed.':'Include a named responsible role, a numerical baseline with its observation date, and a next review date.',measure:'Compare subsequent observed results with the stated baseline; do not infer improvement from a receipt',record:'Fictional dated work brief'}));
 const ex=await rpc(a,'pbs_execution_command_v1',{p_business_id:andre.business_id,p_request_id:crypto.randomUUID(),p_command:'START',p_arguments:{goal:'Prepare a dated baseline brief without claiming business improvement',stage:'operating',tasks}});
 let state=await rpc(a,'pbs_execution_read_v1',{p_business_id:andre.business_id,p_consultation_id:ex.consultation_id});
 const tid=state.tasks[0].id;
 async function submit(note,reference){const result=await rpc(a,'pbs_execution_command_v1',{p_business_id:andre.business_id,p_request_id:crypto.randomUUID(),p_command:'SUBMIT',p_arguments:{consultation_id:ex.consultation_id,expected_revision:state.revision,task_id:tid,reference,note,acknowledged:true,declared_complete:true,disclosure_version:state.disclosure.version}});state=await rpc(a,'pbs_execution_read_v1',{p_business_id:andre.business_id,p_consultation_id:ex.consultation_id});return {receipt:result,sub:state.tasks.find(t=>t.id===tid).submissions.at(-1)};}
 const poor=await submit('We discussed the situation and will keep watching it. No responsible role, numerical dated baseline or review date is recorded.','Fictional incomplete baseline brief');
 const poorReview=await consult(a,andre,'Bound inadequate submission',turn('REVIEW','Review the selected saved submission against its agreed requirements. Identify specific omissions. A receipt is not proof of acceptable work.',[],poor.sub.id));
 const corrected=await submit('Responsible role: business owner. Observation date: 2026-10-20. Numerical baseline: 12 of 20 fictional deliveries were on time. Next review date: 2026-10-27. These are fictional declared values; no actual business improvement or independent verification is claimed.','Fictional revised baseline brief');
 const correctedReview=await consult(a,andre,'Bound revised submission',turn('REVIEW','Review the latest selected stored submission against the same agreed requirements. Distinguish meeting the documentation requirements from real business improvement.',[],corrected.sub.id));
 state=await rpc(a,'pbs_execution_read_v1',{p_business_id:andre.business_id,p_consultation_id:ex.consultation_id});
 const actualTask=state.tasks.find(t=>t.id===tid);
 check('revised task keeps both original receipts',actualTask.submissions.length===2&&actualTask.submissions[0].token===poor.receipt.token&&actualTask.submissions[1].token===corrected.receipt.token);
 check('disabled publication grants no work acceptance or credit',actualTask.status!=='ACCEPTED'&&actualTask.submissions.every(s=>!s.quality_assessment));
 evidence.bound={business_id:andre.business_id,consultation_id:ex.consultation_id,task_id:tid,first_submission_id:poor.sub.id,revised_submission_id:corrected.sub.id,first_token:poor.receipt.token,revised_token:corrected.receipt.token};
 const finishDenied=await a.rpc('pbs_case_finish_v1',{p_run_id:poorReview.data.run_id,p_state:'COMPLETED',p_result:{}});check('customer cannot finish or publish service review',!!finishDenied.error);
 await consult(a,luis,'Luis thirty-minute procedure',turn('BUILD','Write the short customer-handoff procedure I can actually use within thirty minutes per week. Do not require an additional purchase.',['One owner handles sales and delivery. Two handoffs last month lacked agreed completion dates. Existing shared notes can hold the handoff checklist.']));
 await consult(b,imani,'Imani post-funding commercial wording',turn('REASSESS','We received a fictional capital contribution and want to keep improving through PSEQ. Do we need to buy another tool to continue? Explain the next consultation direction and what remains uncertain.',['The next goal is to improve reliable delivery before expansion. No repayment obligation is asserted by this fictional capital contribution.','We have one hour weekly and existing notes, a cash worksheet and delivery records. Ongoing PBS commercial terms have not been supplied.']));
 await consult(b,grace,'Grace contribution and break-even',turn('BUILD','Produce the calculations and explain what each means: scenario A price 80 dollars and variable cost 95 dollars; scenario B price 120 dollars and variable cost 70 dollars. Each has monthly fixed costs of 1500 dollars. Do not invent demand or recommend taking debt.',['All amounts are fictional assumptions. No other costs or demand measurements were supplied.']));
 await consult(b,priya,'Priya zero-time pause',turn('REASSESS','I have zero hours available for improvement work this month. What should I do next?',['I have not provided the promises made to existing customers or whether any current commitment is in trouble. Do not assume those commitments can be canceled.']));
 await consult(b,sam,'Sam no identified purchase need',turn('DISCOVER','Should I buy another tool before doing the next improvement?',['Existing notes, spreadsheets and calendar already support the proposed delivery review. There is no identified missing function or approved new purchase budget.']));
 console.log('RESPONSES_FINISHED');
 // Wait for operator removal of temporary access, then prove fail-closed processing.
 let removed=false;for(let i=0;i<120;i++){if(!(await read(a,dana)).processing_enabled){removed=true;break;}await pause(3000);}
 check('temporary processing access removed',removed);
 const blocked=await consult(a,dana,'Processing blocked after test access removal',turn('BUILD','Prepare a fresh procedure only if processing is authorized. This request should be blocked after test removal.'));
 check('removed access blocks a fresh model request',blocked.data.state==='NOT_ACTIVATED'&&blocked.data.external_processing_attempted===false);
 evidence.state=evidence.requests.slice(0,8).every(x=>x.response.state==='COMPLETED'&&x.saved_response_matches)?'RESPONSES_COMPLETED_MANUAL_QUALITY_REVIEW_REQUIRED':'INCOMPLETE';if(evidence.state==='INCOMPLETE')process.exitCode=1;
}catch(e){evidence.state='INCOMPLETE';evidence.failure=e.message;process.exitCode=1;}
finally{for(const c of clients){const r=await c.auth.signOut({scope:'global'});evidence.cleanup.push({global_signout_requested:!r.error});c.auth.stopAutoRefresh();}console.log(JSON.stringify(evidence));}
})();
