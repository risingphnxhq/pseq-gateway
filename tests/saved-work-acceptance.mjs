import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import fs from 'node:fs';
import {mountSavedWorkTest} from '../acceptance-src/saved-work-acceptance.mjs';
let owner='owner-a',businesses=0,snapshotCalls=0,reportFailure=false;
const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const engine={questions:()=>[{id:'goal'},{id:'cash'}],RISKS:[{id:'risk'}]};
const client={auth:{getUser:async()=>({data:{user:{id:owner}}})},rpc:async(name)=>{
 if(name==='pbs_create_business_v1'){businesses++;return {data:{business_id:'business-a'}};}
 if(name==='pbs_save_assessment_draft_v1'){snapshotCalls++;return {data:{snapshot_id:'snapshot-a'}};}
 if(reportFailure)return {error:{code:'503',message:'Unavailable'}};
 if(owner!=='owner-a')return {error:{code:'42501',message:'Denied'}};
 return {data:{report_id:'report-a',report:{source_snapshot_id:'snapshot-a',input:{answers:{goal:null}}}}};
},from:()=>{const q={select:()=>q,eq:()=>q,order:()=>q,limit:async()=>({data:[{id:'snapshot-a'}]})};return q;}};
function page(){const {document}=parseHTML(fs.readFileSync('account-acceptance.html','utf8'));mountSavedWorkTest({document,client,engine,storage,uuid:()=> 'request-fixture'});return document;}
let d=page();const click=async id=>d.getElementById(id).onclick();const message=()=>d.getElementById('work-status').textContent;
await click('create-test');assert.equal(businesses,1);assert.equal(snapshotCalls,1);
await click('create-test');assert.equal(businesses,1);assert.match(message(),/complete test already exists/);
await click('recover-test');assert.match(message(),/^PASS: owned/);
d=page();await click('recover-test');assert.match(message(),/^PASS: owned/);
await click('separation-test');assert.match(message(),/different verified account/);
owner='owner-b';await click('recover-test');assert.match(message(),/different account/);
await click('separation-test');assert.match(message(),/^PASS: a different/);
reportFailure=true;await click('separation-test');assert.match(message(),/^Not confirmed:/);
console.log('9 saved-work acceptance controller checks passed (mocked server; no live recovery/isolation acceptance).');
