(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./pbs-diagnostic-engine.js'));else root.PBSPlan=factory(root.PBSDiagnostic);})(typeof globalThis!=='undefined'?globalThis:this,function(E){'use strict';
const VERSION='PBS-PLAN-2.0.0',STATES=['PENDING','WORKING','SUBMITTED','ACKNOWLEDGED'];
const uid=()=>crypto.randomUUID();
const text=(v,max=600)=>typeof v==='string'?v.trim().slice(0,max):'';
const day=(base,n)=>{let d=new Date(base+'T12:00:00Z');if(!Number.isFinite(d.valueOf()))throw Error('Choose a valid start date.');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
function requireText(v,label,max=600){const s=text(v,max);if(s.length<3)throw Error(label+' needs at least three characters.');return s;}
function checkDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||day(v,0)!==v)throw Error('Choose a valid date.');return v;}
function diagnostic(raw){
 if(!raw||raw.version!==E.VERSION||raw.mode!=='full'||!Array.isArray(raw.areas))throw Error('Choose a saved full PBRS assessment from the current version. A QuickScore or older report cannot be used here.');
 const answers={},references={},known=new Set(E.questions('full').map(q=>q.id));
 for(const a of raw.areas){if(!Array.isArray(a.questions))throw Error('Assessment questions missing.');for(const q of a.questions){if(!known.has(q.id)||Object.hasOwn(answers,q.id))throw Error('Unexpected or duplicate question.');answers[q.id]=q.answer;references[q.id]=text(q.reference,240);}}
 if(Object.keys(answers).length!==known.size)throw Error('Assessment record is incomplete.');
 const risks={};for(const r of E.RISKS)risks[r.id]='unknown';
 // Version 2 reports store current risk answers explicitly. Earlier exports preserve Yes answers only;
 // absent No answers stay unknown and must be clarified rather than assumed safe.
 if(raw.risk_answers)for(const r of E.RISKS){if(['yes','no','unknown'].includes(raw.risk_answers[r.id]))risks[r.id]=raw.risk_answers[r.id];}
 else for(const r of raw.urgent||[])if(E.RISKS.some(x=>x.id===r.id))risks[r.id]='yes';
 return E.evaluate({mode:'full',stage:raw.stage,business:text(raw.business,120),goal:text(raw.goal),answers,references,risks});
}
function priorities(r){
 const all=r.areas.flatMap(a=>a.questions.filter(q=>q.answer!==null&&q.answer<3).map(q=>({...q,area:a.name,domain:a.id,severity:3-q.answer}))).sort((a,b)=>b.severity-a.severity||a.id.localeCompare(b.id));
 const chosen=[],seen=new Set();for(const q of all){if(!seen.has(q.domain)){chosen.push({title:q.area,why:'Your answer: '+q.choices[q.answer],action:q.action,record:q.proof,measure:q.metric,source_question:q.id});seen.add(q.domain);}if(chosen.length===3)break;}
 if(r.urgent.length){const u=r.urgent[0];chosen.unshift({title:'Immediate risk response',why:'You reported: '+u.label,action:u.action,record:'Dated containment or qualified-advisor action record',measure:'Affected commitments and unresolved risk reviewed with the responsible specialist',source_question:u.id,urgent:true});}
 if(r.coverage<100||r.risk_coverage<100){chosen.unshift({title:'Clarify assessment gaps',why:'Business questions answered '+r.coverage+'; current risks answered '+r.risk_coverage+'%. Missing answers limit what this review can tell you.',action:'Clarify unknown current risks first, then consult the missing records and update your assessment. Avoid committing resources on an assumed Green result.',record:'Completed current-risk review and corrected assessment',measure:'Unknown risks and unanswered practice questions remaining',source_question:'information-gaps'});}
 if(r.urgent.length){chosen.sort((a,b)=>Number(!!b.urgent)-Number(!!a.urgent));}
 if(!chosen.length)chosen.push({title:'Test your next commitment',why:'Your practices you report appear strong. No corrective package is required by this assessment.',action:'Choose a small, reversible test of your stated objective. Record assumptions and the conditions for stopping or expanding.',record:'Pilot plan and actual results',measure:'Outcome against your chosen baseline and target',source_question:'maintain'});
 return chosen.slice(0,3);
}
function makePlan({business,stage,goal,owner,start,priorities:ps,origin}){
 checkDate(start);if(!['prelaunch','operating','expanding'].includes(stage))throw Error('Choose a business stage.');
 owner=requireText(owner,'Responsible person',120);goal=requireText(goal,'Business goal');
 if(!Array.isArray(ps)||ps.length<1||ps.length>3)throw Error('Choose one to three priorities.');
 const id=uid(),tasks=[];
 ps.forEach((p,i)=>{const title=requireText(p.title,'Priority title',120),action=requireText(p.action,'Action',2000),measure=requireText(p.measure,'Outcome measure'),record=requireText(p.record,'Record or evidence needed'),why=requireText(p.why,'Reason');
 const steps=[{title:'Establish baseline · '+title,action:'Review '+record+'. Record the current baseline, the target and constraints before changing the process.',acceptance:'A dated baseline, target, responsible owner and agreed scope are recorded.'},{title:'Implement · '+title,action,acceptance:'The agreed change is in place and a work sample or other completion reference is recorded.'},{title:'Check results · '+title,action:'Compare '+measure+' with the baseline and target. Record other influences and any adverse effects; do not assume the change caused the result.',acceptance:'Actual observations, comparison to baseline and unresolved exceptions are recorded.'},{title:'Review and decide · '+title,action:'Review what helped, what did not and what remains uncertain. Decide to keep, revise, stop or seek specialist support.',acceptance:'A dated decision, its rationale and the next accountable owner are recorded.'}];
 steps.forEach((s,j)=>tasks.push({id:uid(),phase:i+1,week:i*4+j+1,priority:title,reason:why,...s,measure,record,owner,due_date:day(start,p.urgent&&j===0?0:(i*4+j+1)*7),status:'PENDING',submission:null,acknowledgment:null,history:[]}));});
 return {version:VERSION,plan_id:id,created_at:new Date().toISOString(),business:text(business,120)||'Your business',stage,goal,owner,start,origin,active_phase:1,priorities:ps.map(p=>({title:text(p.title,120),why:text(p.why),source_question:text(p.source_question,80)})),tasks,closure_records:[],limits:'Plan maintained by you. Completion confirmations record what was reported. They do not prove that work was independently checked, payment was made, funding was approved or the business improved. This does not create a subscription or paid access.'};
}
function fromDiagnostic(raw,options){const r=diagnostic(raw);return makePlan({...options,business:r.business,stage:r.stage,goal:options.goal||r.goal,priorities:priorities(r),origin:{kind:'PBRS_DECLARED_ASSESSMENT',method:r.version,generated_at:r.generated_at,diagnostic_status:r.status,verification:'UNVERIFIED',urgent_risks:r.urgent.map(x=>x.id)}});}
function validatePlan(raw){
 if(!raw||raw.version!==VERSION||typeof raw.plan_id!=='string'||!Array.isArray(raw.tasks)||raw.tasks.length<4||raw.tasks.length>12||raw.tasks.length%4!==0)throw Error('Load a saved PBS plan with 4, 8 or 12 tasks.');
 const p=JSON.parse(JSON.stringify(raw)),ids=new Set();requireText(p.goal,'Goal');checkDate(p.start);if(!['prelaunch','operating','expanding'].includes(p.stage))throw Error('Invalid stage.');
 if(!Number.isInteger(p.active_phase)||p.active_phase<1||p.active_phase>p.tasks.length/4)throw Error('The current task set could not be read.');
 const closure=new Set();if(!Array.isArray(p.closure_records))throw Error('The saved completion notes are missing.');
 for(const c of p.closure_records){if(!c.id||closure.has(c.task_id))throw Error('A completion note is incomplete or appears more than once.');closure.add(c.task_id);}
 p.tasks.forEach((t,i)=>{if(!t.id||ids.has(t.id)||t.phase!==Math.floor(i/4)+1||t.week!==i+1||!STATES.includes(t.status))throw Error('A task is missing information or appears more than once.');ids.add(t.id);for(const k of ['title','action','acceptance','owner','measure','record'])requireText(t[k],k,2500);checkDate(t.due_date);if(!Array.isArray(t.history))throw Error('The saved task history is missing.');if(t.status==='SUBMITTED'||t.status==='ACKNOWLEDGED'){if(!t.submission?.reference||!t.submission?.note)throw Error('A submitted task is missing its work description or supporting reference.');}if(t.status==='ACKNOWLEDGED'){if(!t.acknowledgment?.by||!closure.has(t.id))throw Error('The completion confirmation is missing.');}if(t.phase>p.active_phase&&t.status!=='PENDING')throw Error('Start the next set of tasks before recording work in it.');});
 for(let phase=1;phase<p.active_phase;phase++)if(p.tasks.some(t=>t.phase===phase&&t.status!=='ACKNOWLEDGED'))throw Error('Confirm reported completion for the earlier set of tasks first.');
 // Imported records remain untrusted customer claims; preserve only known fields at rendering/export boundaries.
 p.limits='Plan maintained by you. Information, names and completion statements in loaded files have not been independently checked. No payment or business improvement is established.';return p;
}
function transition(raw,id,operation,payload={}){
 const p=validatePlan(raw),t=p.tasks.find(t=>t.id===id);if(!t||t.phase!==p.active_phase)throw Error('This task is not in the current set of tasks.');const now=new Date().toISOString();
 if(operation==='START'){if(t.status!=='PENDING')throw Error('Only pending work can start.');t.status='WORKING';}
 else if(operation==='SUBMIT'){if(t.status!=='WORKING')throw Error('Start this task before submitting your work.');t.submission={reference:requireText(payload.reference,'Completion reference',500),note:requireText(payload.note,'What was done and observed',2000),at:now};t.status='SUBMITTED';}
 else if(operation==='ACKNOWLEDGE'){if(t.status!=='SUBMITTED'||t.acknowledgment)throw Error('Reported completion can be confirmed only once for each submitted task.');if(payload.confirm!==true)throw Error('Confirm that you are recording what was reported, rather than an independent check.');const ack={id:uid(),task_id:t.id,by:requireText(payload.by,'Person confirming reported completion',120),at:now,basis:'CLIENT_DECLARED_COMPLETION_NOT_INDEPENDENTLY_VERIFIED'};t.acknowledgment=ack;p.closure_records.push(ack);t.status='ACKNOWLEDGED';}
 else if(operation==='RETURN'){if(t.status!=='SUBMITTED')throw Error('Only submitted work can be returned.');requireText(payload.note,'Reason for return');t.status='WORKING';t.submission=null;}
 else throw Error('That action is not available.');
 t.history.push({operation,at:now,note:text(payload.note,2000)});p.updated_at=now;return p;
}
function advance(raw){const p=validatePlan(raw);if(p.tasks.some(t=>t.phase===p.active_phase&&t.status!=='ACKNOWLEDGED'))throw Error('Confirm reported completion for all four tasks in the current set first.');if(p.active_phase>=p.tasks.length/4)throw Error('You have reached the end of this plan. Review the results before creating more tasks.');p.active_phase++;p.updated_at=new Date().toISOString();return p;}
return {VERSION,diagnostic,priorities,makePlan,fromDiagnostic,validatePlan,transition,advance};
});

