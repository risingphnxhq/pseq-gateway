(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./pbs-plan-engine'),require('./pbs-consultation-engine'));else root.PBSWorkingPlan=factory(root.PBSPlan,root.PBSConsultation);})(typeof globalThis!=='undefined'?globalThis:this,function(P,C){'use strict';
function text(v,label,max=2000){if(typeof v!=='string'||v.trim().length<3||v.length>max)throw Error(label+' needs 3–'+max+' characters.');return v.trim();}
function capacity(hours,budget){if(typeof hours!=='number'||!Number.isFinite(hours)||hours<0||hours>80||typeof budget!=='number'||!Number.isFinite(budget)||budget<0||budget>1e9)throw Error('Enter valid available hours and budget. Unknown amounts need clarification before planning.');if(hours===0)throw Error('No time is available for new work. Identify an available responsible person or free capacity first. Existing tasks and urgent risks still need attention.');}
function direct({business,stage,goal,owner,start,title,reason,action,record,measure,hours,budget,constraints}){
 capacity(hours,budget);
 const context={weekly_hours:hours,experiment_budget:budget,constraints:text(constraints,'Constraints'),provenance:'CUSTOMER_DECLARED_NOT_VERIFIED',capacity_estimate:true};
 return P.makePlan({business:text(business,'Business name',200),stage,goal,owner,start,priorities:[{title,why:reason,action,record,measure}],origin:{kind:'OPERATOR_AUTHORED',verification:'UNVERIFIED',resource_context:context}});
}
function edit(raw,id,fields){
 const s=C.restore(raw),t=s.tasks.find(t=>t.id===id);
 if(!t||t.status!=='UNSUBMITTED'||t.submissions.length||t.quality.length||t.credit)throw Error('Submitted or reviewed work keeps its original requirements. Use the correction and review process for that task.');
 const keys=['title','action','reason','owner','acceptance','measure','record'];
 if(!fields||Object.keys(fields).sort().join('|')!==keys.slice().sort().join('|'))throw Error('Provide the complete task requirements.');
 const before=Object.fromEntries(keys.map(k=>[k,t[k]])),after=Object.fromEntries(keys.map(k=>[k,text(fields[k],k,k==='title'||k==='owner'?200:2000)]));
 if(JSON.stringify(before)===JSON.stringify(after))return s;
 Object.assign(t,after);
 s.history.push({id:crypto.randomUUID(),at:new Date().toISOString(),type:'WORKING_TASK_REQUIREMENTS_REVISED',task_id:id,before,after,provenance:'CUSTOMER_EDIT_NOT_REGISTERED_TASK_CHANGE'});
 return C.restore(s);
}
return {direct,edit,capacity};
});
