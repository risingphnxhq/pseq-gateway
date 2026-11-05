import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createFirebaseAccount,PBS_ACCOUNT_URL} from '../pbs-firebase-auth.mjs';
import config from '../pbs-firebase-config.mjs';
const source=fs.readFileSync(new URL('../firebase-account-callback.js',import.meta.url),'utf8');
function page(search){const window={};let cleaned=false;vm.runInNewContext(source,{window,URL,URLSearchParams,location:{search,hash:'',pathname:'/account.html'},history:{replaceState(){cleaned=true}}});return {window,cleaned};}
for(const system of ['pqs','pbrs','pbb','pseq']){
 let settings;const sdk={inMemoryPersistence:{},initializeApp:()=>({}),initializeAuth:()=>({authStateReady:async()=>{}}),sendPasswordResetEmail:async(a,e,s)=>settings=s};
 const account=await createFirebaseAccount({config,sdk,system});await account.requestReset('synthetic@example.invalid');
 assert.equal(settings.url,PBS_ACCOUNT_URL+'?use='+system);assert.equal(settings.handleCodeInApp,false);
 for(const search of ['?use='+system,'?mode=resetPassword&oobCode=synthetic&continueUrl='+encodeURIComponent(settings.url)]){
  const p=page(search);assert.equal(p.window.PBSAccountSystem,system);assert.equal(p.window.PBSAccountDestination,system+'.html#account-panel');assert.equal(p.window.PBSFirebaseAction.invalid,false);assert.equal(p.cleaned,true);
 }
}
for(const url of ['https://stats-core.com/account.html?use=pqs','https://pseq.risingphoenixhq.com.evil.test/account.html?use=pqs','https://pseq.risingphoenixhq.com/other?use=pqs']){
 const p=page('?mode=resetPassword&oobCode=synthetic&continueUrl='+encodeURIComponent(url));assert.equal(p.window.PBSFirebaseAction.invalid,true);assert.equal(p.window.PBSFirebaseAction.code,null);
}
assert.equal(page('?use=pqs&continueUrl='+encodeURIComponent(PBS_ACCOUNT_URL+'?use=pbb')).window.PBSFirebaseAction.invalid,true);
assert.equal(page('?use=pqs&use=pbb').window.PBSAccountSystem,null);
await assert.rejects(()=>createFirebaseAccount({config,system:'https://stats-core.com',sdk:{initializeApp:()=>({}),initializeAuth:()=>({authStateReady:async()=>{}})}}));
console.log('PASS: all four PBS recovery destinations retained; foreign origins, mismatches and arbitrary destinations rejected.');
