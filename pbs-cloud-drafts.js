/* Session supplied by the existing account integration. Never accepts a pasted token in UI. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PBSCloudDrafts=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function create({projectUrl,publishableKey,getSession,fetcher=globalThis.fetch}){
 if(projectUrl!=='https://oyjmpbuxvfxusmbouldi.supabase.co'||typeof publishableKey!=='string'||!publishableKey||typeof getSession!=='function')throw Error('Verified PBS account configuration required.');
 const pending=new Map();
 const definite=message=>Object.assign(new Error(message),{definitive:true});
 async function rpc(name,body){const session=await getSession();if(!session?.access_token)throw definite('Sign in to your PBS account before using cloud records.');let response;try{response=await fetcher(projectUrl+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});}catch{throw Error('Connection interrupted. Retry the same save; keep your local record.');}
 let result;try{result=await response.json();}catch{throw Error('Unexpected save response. Keep your local record and retry.');}
 if(!response.ok){if(result.code==='40001')throw definite('Another session changed this record. Load its current revision before merging your work.');if(response.status===401||response.status===403||result.code==='42501')throw definite('Your session cannot access this business record. Sign in with the owning account.');throw definite('The record could not be saved or loaded. Keep your local record.');}return result;}
 return {
 async save({businessId,state,expectedRevision}){const key=businessId+':'+state.id,serialized=JSON.stringify(state),old=pending.get(key);if(old&&(old.serialized!==serialized||old.expectedRevision!==expectedRevision))throw Error('Resolve the interrupted save before sending a different revision.');const op=old||{requestId:crypto.randomUUID(),serialized,expectedRevision};pending.set(key,op);let result;try{result=await rpc('pbs_save_consultation_draft_v1',{p_business_id:businessId,p_draft_id:state.id,p_request_id:op.requestId,p_expected_revision:op.expectedRevision,p_payload:JSON.parse(op.serialized)});}catch(e){if(e.definitive)pending.delete(key);throw e;}pending.delete(key);return result;},
 load:({businessId,draftId,revision=null})=>rpc('pbs_load_consultation_draft_v1',{p_business_id:businessId,p_draft_id:draftId,p_revision:revision}),
 list:({businessId})=>rpc('pbs_list_consultation_drafts_v1',{p_business_id:businessId})
 };
}
return {create};});
