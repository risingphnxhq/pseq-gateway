/* Explicit adapter for existing unscored PBS draft snapshots. No legacy score is trusted. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./pbs-diagnostic-engine'),require('./pbs-plan-engine'),require('./pbs-advisor-engine'));else root.PBSAssessmentContinuity=factory(root.PBSDiagnostic,root.PBSPlan,root.PBSAdvisor);})(typeof globalThis!=='undefined'?globalThis:this,function(E,P,A){'use strict';
function validate(input){
 if(!input||!['PQS','PBRS'].includes(input.mode))throw Error('Choose a current quick check or readiness assessment.');
 const mode=input.mode==='PQS'?'quick':'full',keys=new Set(E.questions(mode).map(q=>q.id)),riskKeys=new Set(E.RISKS.map(r=>r.id));
 if(!input.answers||!input.risks||Object.keys(input.answers).some(k=>!keys.has(k))||Object.keys(input.risks).some(k=>!riskKeys.has(k)))throw Error('These answers do not match this assessment version.');
 if(Object.values(input.risks).some(v=>v!==null&&typeof v!=='boolean'))throw Error('Use Yes, No or Unknown for current risks.');
 const context=input.context||{};
 return E.evaluate({mode,stage:context.stage,business:context.business,goal:context.goal,answers:input.answers,references:input.references||{},risks:Object.fromEntries(E.RISKS.map(r=>[r.id,input.risks[r.id]===true?'yes':input.risks[r.id]===false?'no':'unknown']))});
}
function fromReport(raw){
 if(!raw||raw.version!==E.VERSION||!['quick','full'].includes(raw.mode)||!Array.isArray(raw.areas))throw Error('Use a current PBS assessment file.');
 const answers={},references={};for(const a of raw.areas)for(const q of a.questions||[]){if(Object.hasOwn(answers,q.id))throw Error('An answer appears more than once.');answers[q.id]=q.answer;references[q.id]=q.reference||'';}
 const input={mode:raw.mode==='quick'?'PQS':'PBRS',answers,references,risks:Object.fromEntries(E.RISKS.map(r=>[r.id,raw.risk_answers?.[r.id]==='yes'?true:raw.risk_answers?.[r.id]==='no'?false:(raw.urgent||[]).some(x=>x.id===r.id)?true:null])),context:{stage:raw.stage,business:raw.business,goal:raw.goal}};
 validate(input);return input;
}
function fromSnapshot(snapshot){const p=snapshot?.prs_payload;if(snapshot?.engine_version!=='PBS-DRAFT-1.0.0'||p?.record_type!=='ASSESSMENT_DRAFT'||p.method_version!==E.VERSION||p.scored!==false)throw Error('This is a different kind of saved record. It cannot be combined with the current assessment.');validate(p.input);return structuredClone(p.input);}
function plan(input,{owner,hours,budget,start,snapshotId=null}){
 const r=validate(input);if(r.mode!=='full')throw Error('Complete the deeper readiness assessment before creating an assessment-based plan. You may also start directly with a known problem.');
 const advice=A.consult({assessment:r,hours_per_week:hours,budget_available:budget});
 if(advice.planning_paused)throw Error('Pause new monthly work until time or an available responsible person is identified. Urgent-risk guidance and existing work history remain available.');
 const focus=P.priorities(r)[0],p=P.makePlan({business:r.business,stage:r.stage,goal:r.goal,owner,start,priorities:[focus],origin:{kind:'PBRS_DECLARED_ASSESSMENT',method:r.version,snapshot_id:snapshotId,verification:'UNVERIFIED'}});
 p.tasks=p.tasks.map((t,i)=>({...t,title:advice.cycle[i].title,action:advice.cycle[i].action,acceptance:advice.cycle[i].acceptance,reason:focus.why,record:focus.record,measure:focus.measure}));
 return P.validatePlan(p);
}
return {validate,fromReport,fromSnapshot,plan};
});
