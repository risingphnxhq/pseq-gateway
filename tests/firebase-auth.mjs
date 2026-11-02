import assert from 'node:assert/strict';
import {createFirebaseAccount,validateFirebaseConfig,PBS_ACCOUNT_URL} from '../pbs-firebase-auth.mjs';
import config from '../pbs-firebase-config.mjs';
let checks=0;const ok=x=>{assert.ok(x);checks++;};const bad=async(fn,text)=>{await assert.rejects(fn,new RegExp(text));checks++;};
function fixture(){let calls=[],claims={iss:'https://securetoken.google.com/'+config.projectId,aud:config.projectId,sub:'firebase-not-a-uuid',role:'authenticated',email_verified:true},wait=null,clears=0;
 const user={uid:claims.sub,email:'fictional@example.invalid',emailVerified:true},auth={currentUser:null,authStateReady:async()=>{}};
 const sdk={inMemoryPersistence:{},initializeApp:(c,name)=>{calls.push(['app',c.projectId,name]);return {};},initializeAuth:(a,options)=>{calls.push(['persistence',options.persistence]);return auth;},createUserWithEmailAndPassword:async()=>{auth.currentUser=user;return {user};},sendEmailVerification:async(u,s)=>calls.push(['verify',s]),signInWithEmailAndPassword:async()=>{if(wait)await wait;auth.currentUser=user;return {user};},reload:async()=>{},sendPasswordResetEmail:async(a,email,s)=>calls.push(['reset',s]),verifyPasswordResetCode:async(a,code)=>{if(code!=='valid')throw Error('INVALID_ACTION_CODE');return user.email;},confirmPasswordReset:async(a,c,p)=>calls.push(['confirmed',p.length]),applyActionCode:async(a,c)=>{if(c!=='valid')throw Error('INVALID_ACTION_CODE');},getIdTokenResult:async()=>({claims,token:'FAKE_TOKEN'}),signOut:async()=>{auth.currentUser=null;calls.push(['signout']);}};
 return {sdk,auth,user,calls,clear:()=>clears++,clears:()=>clears,claims:(patch)=>claims={...claims,...patch},wait:p=>wait=p};
}
ok(validateFirebaseConfig(config).projectId===config.projectId);
assert.throws(()=>validateFirebaseConfig({...config,projectId:'stats-core'}));checks++;
let f=fixture(),a=await createFirebaseAccount({config,sdk:f.sdk,onCleared:f.clear});ok(f.calls[1][1]===f.sdk.inMemoryPersistence);
await bad(()=>a.signUp({email:'fake',password:'short'}),'12');ok(!a.user());
const signup=await a.signUp({email:'fictional@example.invalid',password:'fictional-password-123'});ok(signup.verification_requested&&!signup.delivery_confirmed);ok(!a.user());ok(f.calls.find(x=>x[0]==='verify')[1].url===PBS_ACCOUNT_URL);
f.user.emailVerified=false;await a.requestVerification({email:'fictional@example.invalid',password:'fictional-password-123'});ok(!a.user());ok(f.calls.filter(c=>c[0]==='verify').length===2);f.user.emailVerified=true;
await a.requestReset('fictional@example.invalid');ok(f.calls.find(x=>x[0]==='reset')[1].url===PBS_ACCOUNT_URL);
f.sdk.sendPasswordResetEmail=async()=>{throw Object.assign(Error('unknown'),{code:'auth/user-not-found'});};ok((await a.requestReset('missing@example.invalid')).requested);
await bad(()=>a.inspectReset('invalid'),'INVALID_ACTION_CODE');ok((await a.inspectReset('valid')).email===f.user.email);
await a.signIn({email:'fictional@example.invalid',password:'fictional-password-123'});ok(a.user().id==='firebase-not-a-uuid');ok(await a.backendToken()==='FAKE_TOKEN');
for(const patch of [{iss:'https://securetoken.google.com/stats-core'},{aud:'wrong'},{sub:'another-user'},{role:'service_role'},{email_verified:false}]){f.claims(patch);await bad(()=>a.backendToken(),'not enabled');f.claims({iss:'https://securetoken.google.com/'+config.projectId,aud:config.projectId,sub:f.user.uid,role:'authenticated',email_verified:true});}
f.claims({role:undefined});ok(await a.workspaceToken()==='FAKE_TOKEN');f.claims({role:'authenticated'});
f.user.emailVerified=false;await bad(()=>a.backendToken(),'Verify');f.user.emailVerified=true;
await bad(()=>a.confirmReset('invalid','fictional-password-123'),'INVALID_ACTION_CODE');
ok((await a.confirmReset('valid','fictional-password-123')).other_sessions_revoked===false);ok(!a.user());
ok((await a.verifyEmail('valid')).email_verified);await bad(()=>a.verifyEmail('invalid'),'INVALID_ACTION_CODE');
await a.close();ok(a.user()===null);await bad(()=>a.signIn({}),'closed');
f=fixture();a=await createFirebaseAccount({config,sdk:f.sdk,onCleared:f.clear});let release;f.wait(new Promise(r=>release=r));const pending=a.signIn({email:'fictional@example.invalid',password:'fictional-password-123'});await a.close();release();await bad(()=>pending,'page changed');ok(!f.auth.currentUser);ok(f.clears()>0);
// A recovery check may finish after the page closes or the account signs out.
// Neither case may initiate a password change after that cancellation.
for(const cancel of ['close','signOut']){
 f=fixture();a=await createFirebaseAccount({config,sdk:f.sdk,onCleared:f.clear});
 let finishCheck;f.sdk.verifyPasswordResetCode=()=>new Promise(r=>finishCheck=r);
 const reset=a.confirmReset('valid','fictional-password-123');
 await new Promise(r=>setImmediate(r));await a[cancel]();finishCheck(f.user.email);
 await bad(()=>reset,'page changed');ok(!f.calls.some(c=>c[0]==='confirmed'));
}
console.log(checks+' Firebase adapter checks passed (mocked SDK; not live signup/email/recovery acceptance).');
