// PBS-only transport. Firebase credentials never go to the shared project's Data API.
const ROOT='https://oyjmpbuxvfxusmbouldi.supabase.co';
const ENDPOINT=ROOT+'/functions/v1/pbs-firebase-workspace';
const RPC=new Set(['pbs_check_access_v1','pbs_create_business_v1','pbs_save_assessment_draft_v1','pbs_assessment_report_v1','pbs_list_consultation_drafts_v1','pbs_load_consultation_draft_v1','pbs_save_consultation_draft_v1','pbs_execution_command_v1','pbs_execution_read_v1','pbs_case_create_v1','pbs_case_read_v1','pbs_case_update_v1']);
export function createWorkspaceClient({account,fetcher=fetch}){
 let generation=0;
 const failure=(message,status=400,code='22023')=>({data:null,error:{message,code},status});
 async function send(operation,args={}){
  const g=generation;
  try{const a=await account;if(!a.user()?.email_verified)return failure('PBS_AUTH_REQUIRED',401,'42501');const token=await a.workspaceToken();if(g!==generation)return failure('PBS_AUTH_REQUIRED',401,'42501');
   const response=await fetcher(ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({operation,arguments:args}),cache:'no-store',signal:AbortSignal.timeout(105000)});
   const data=await response.json();if(g!==generation)return failure('PBS_AUTH_REQUIRED',401,'42501');
   return response.ok?{data,error:null,status:response.status}:failure(data.error||'PBS_REQUEST_REJECTED',response.status,data.code||(response.status===401?'42501':'22023'));
  }catch{return failure('PBS sign-in or connection could not be confirmed.',503,'CONNECTION_UNCONFIRMED');}
 }
 const client={
  rpc(name,args={}){return RPC.has(name)?send(name,args):Promise.resolve(failure('PBS operation is unavailable.'));},
  auth:{
   async signInWithPassword(credentials){generation++;try{return {data:{user:await (await account).signIn(credentials)},error:null};}catch{return failure('Sign-in was unsuccessful.',401,'42501');}},
   async getUser(){const a=await account,u=a.user();if(!u)return {data:{user:null},error:null};const result=await send('IDENTITY');return result.error?result:{data:{user:{...u,id:result.data.subject_id}},error:null};},
   async getSession(){try{return {data:{session:{access_token:await (await account).workspaceToken()}},error:null};}catch{return failure('PBS_AUTH_REQUIRED',401,'42501');}},
   async signOut(){generation++;await (await account).signOut();return {error:null};}
  },
  functions:{invoke(name,{body}={}){return name==='pbs-consultation'?send('CONSULTATION',body):Promise.resolve(failure('PBS service is unavailable.'));}},
  from(table){
   const fields={},valid=table==='pbs_entities'||table==='pbs_prs_snapshots';let invalid=!valid;
   const chain={select(columns){const expected=table==='pbs_entities'?'id,legal_name':'id,created_at,engine_version,prs_payload';if(columns!==expected)invalid=true;return chain;},eq(key,value){if(!['entity_id','engine_version'].includes(key)||Object.hasOwn(fields,key))invalid=true;fields[key]=value;return chain;},order(key,options){if(key!=='created_at'||options?.ascending!==false)invalid=true;return chain;},limit(value){if(value!==100)invalid=true;return chain;},then(resolve,reject){let p;if(invalid||table==='pbs_entities'&&Object.keys(fields).length||table==='pbs_prs_snapshots'&&(!fields.entity_id||fields.engine_version!=='PBS-DRAFT-1.0.0'))p=Promise.resolve(failure('PBS query is unavailable.'));else p=send(table==='pbs_entities'?'BUSINESSES':'ASSESSMENTS',table==='pbs_entities'?{}:{p_business_id:fields.entity_id});return p.then(resolve,reject);}};
   return chain;
  },
  async workspaceFetch(url,options={}){
   const prefix=ROOT+'/rest/v1/rpc/',name=typeof url==='string'&&url.startsWith(prefix)?url.slice(prefix.length):'';
   if(options.method!=='POST'||!RPC.has(name))throw Error('PBS route is unavailable.');
   const result=await send(name,JSON.parse(options.body));return Response.json(result.error?{...result.error,error:result.error.message}:result.data,{status:result.status});
  }
 };
 return client;
}
