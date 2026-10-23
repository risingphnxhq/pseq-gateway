/* PBS-BCR-PRODUCTION-RECOVERY-000001: read-only, authenticated discovery. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PBSOwnedRecovery=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function create({client}){
 let generation=0;
 const clear=()=>{generation++;};
 async function start(){const g=generation,r=await client.auth.getUser();check(g);if(r.error||!r.data?.user?.id)throw Error('Sign in to recover your saved work.');return g;}
 function check(g){if(g!==generation)throw Error('Account or business changed. Find your saved work again.');}
 async function result(request,g){const r=await request;check(g);if(r.error)throw Error('Saved work could not be confirmed. Check your access and try again.');return r.data;}
 async function rpc(name,args,g){return result(client.rpc(name,args),g);}
 async function owned(b,g){const rows=await result(client.from('pbs_entities').select('id,legal_name').order('created_at',{ascending:false}).limit(100),g);if(!Array.isArray(rows)||!rows.some(x=>x.id===b))throw Error('This business is not available to this account.');}
 return {clear,
  async businesses(){const g=await start(),rows=await result(client.from('pbs_entities').select('id,legal_name').order('created_at',{ascending:false}).limit(100),g);if(!Array.isArray(rows))throw Error('Business discovery was not confirmed.');return rows;},
  async discover(b){const g=await start();await owned(b,g);
   const [assessments,plans,monthly]=await Promise.all([
    result(client.from('pbs_prs_snapshots').select('id,created_at,engine_version,prs_payload').eq('entity_id',b).eq('engine_version','PBS-DRAFT-1.0.0').order('created_at',{ascending:false}).limit(100),g),
    rpc('pbs_list_consultation_drafts_v1',{p_business_id:b},g),
    rpc('pbs_execution_read_v1',{p_business_id:b,p_consultation_id:null},g)]);
   check(g);if(![assessments,plans,monthly].every(Array.isArray))throw Error('Saved work discovery was incomplete.');
   return {business:b,assessments,plans,monthly};
  },
  async assessment(b,id){const g=await start();await owned(b,g);const rows=await result(client.from('pbs_prs_snapshots').select('id,created_at,engine_version,prs_payload').eq('entity_id',b).eq('engine_version','PBS-DRAFT-1.0.0').order('created_at',{ascending:false}).limit(100),g);const saved=Array.isArray(rows)&&rows.find(x=>x.id===id);if(!saved)throw Error('This saved assessment is not available.');return saved;},
  async plan(b,id){const g=await start();await owned(b,g);const rows=await rpc('pbs_list_consultation_drafts_v1',{p_business_id:b},g);if(!Array.isArray(rows)||!rows.some(x=>x.draft_id===id))throw Error('This saved plan is not available.');const saved=await rpc('pbs_load_consultation_draft_v1',{p_business_id:b,p_draft_id:id,p_revision:null},g);if(saved?.payload?.id!==id)throw Error('The saved plan identity did not match.');return saved;},
  async monthly(b,id){const g=await start();await owned(b,g);const r=await rpc('pbs_execution_read_v1',{p_business_id:b,p_consultation_id:id},g);if(r?.business_id!==b||r?.consultation_id!==id)throw Error('The monthly record identity did not match.');return r;}
 };
}
return {create};
});
