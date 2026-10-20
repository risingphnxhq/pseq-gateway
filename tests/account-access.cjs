const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');let checks=0;const ok=x=>{assert.ok(x);checks++;};
const source=fs.readFileSync('account-access.js','utf8');
function setup(callback={},overrides={}){
 const {window}=parseHTML(fs.readFileSync('account.html','utf8')),d=window.document,calls=[];
 window.PBSAccountCallback=callback;
 const auth={signUp:async x=>{calls.push(['signup',x]);return {data:{session:{}}};},resetPasswordForEmail:async(...x)=>{calls.push(['reset',...x]);return {};},verifyOtp:async x=>{calls.push(['otp',x]);return {data:{session:{}}};},setSession:async x=>{calls.push(['session',x]);return {data:{session:{}}};},getUser:async()=>({data:{user:{id:'user-a',email:'fictional@example.invalid'}}}),updateUser:async x=>{calls.push(['update',x]);return {};},signOut:async x=>{calls.push(['signout',x]);return {};}};
 Object.assign(auth,overrides);window.PBSAccountClient={auth};vm.runInNewContext(source,{window,document:d});
 const submit=async id=>d.getElementById(id).onsubmit({preventDefault(){}}),set=(id,v)=>d.getElementById(id).value=v,msg=()=>d.getElementById('account-message').textContent;
 return {window,d,calls,auth,submit,set,msg};
}
(async()=>{
 const history=[],w={location:{hash:'#access_token=fictional-access&refresh_token=fictional-refresh&type=recovery',search:'?next=https://untrusted.invalid/',pathname:'/account.html'},history:{replaceState:(...x)=>history.push(x)}};
 vm.runInNewContext(fs.readFileSync('account-callback.js','utf8'),{window:w,URLSearchParams});ok(history[0][2]==='/account.html');ok(w.PBSAccountCallback.access_token==='fictional-access');
 let x=setup();ok(x.window.PBSAccountCallback===undefined);
 x.set('signup-email','fictional@example.invalid');x.set('signup-password','long-fictional-password');x.set('signup-confirm','different-password');await x.submit('signup-form');ok(!x.calls.length);ok(x.d.getElementById('signup-password').value==='');
 x.set('signup-password','long-fictional-password');x.set('signup-confirm','long-fictional-password');await x.submit('signup-form');ok(x.calls[0][0]==='signup');ok(x.calls[0][1].options.emailRedirectTo==='https://pseq.risingphoenixhq.com/account.html');ok(x.calls.some(c=>c[0]==='signout'));ok(!x.calls[0][1].options.data);
 x.set('reset-email','fictional@example.invalid');await x.submit('reset-request-form');ok(x.calls.some(c=>c[0]==='reset'&&c[2].redirectTo==='https://pseq.risingphoenixhq.com/account.html'));ok(x.msg().includes('Delivery has not been confirmed'));
 const callback={type:'recovery',token_hash:'fictional-hash'};x=setup(callback);ok(x.calls.length===0);ok(x.d.getElementById('account-create').hidden);
 await x.d.getElementById('verify-account-link').onclick();ok(x.calls[0][0]==='otp');ok(callback.token_hash===null);ok(!x.d.getElementById('account-new-password').hidden);ok(x.d.getElementById('recovery-identity').textContent.includes('fictional@example.invalid'));
 x.set('new-password','new-long-fictional-password');x.set('new-password-confirm','new-long-fictional-password');await x.submit('new-password-form');ok(!x.calls.some(c=>c[0]==='update'));ok(x.d.getElementById('new-password').value==='');
 x.d.getElementById('recovery-account-confirm').checked=true;x.set('new-password','new-long-fictional-password');x.set('new-password-confirm','new-long-fictional-password');await x.submit('new-password-form');ok(x.calls.some(c=>c[0]==='update'));ok(x.calls.some(c=>c[0]==='signout'&&c[1].scope==='global'));ok(x.d.getElementById('account-new-password').hidden);ok(x.msg().includes('Password updated'));
 x=setup({type:'recovery',access_token:'fictional-a',refresh_token:'fictional-r'});await x.d.getElementById('verify-account-link').onclick();ok(x.calls[0][0]==='session');
 x.auth.getUser=async()=>({data:{user:{id:'other-user',email:'other@example.invalid'}}});x.d.getElementById('recovery-account-confirm').checked=true;x.set('new-password','new-long-fictional-password');x.set('new-password-confirm','new-long-fictional-password');await x.submit('new-password-form');ok(!x.calls.some(c=>c[0]==='update'));ok(x.msg().includes('no longer available'));
 x=setup({type:'recovery',token_hash:'expired'},{verifyOtp:async()=>({error:{message:'expired'}})});await x.d.getElementById('verify-account-link').onclick();ok(x.d.getElementById('account-new-password').hidden);ok(!x.d.getElementById('account-reset-request').hidden);ok(x.msg().includes('no password was changed'));
 x=setup({type:'email',token_hash:'fictional'});await x.d.getElementById('verify-account-link').onclick();ok(x.d.getElementById('account-new-password').hidden);ok(x.calls.some(c=>c[0]==='signout'));
 x=setup({type:'recovery',error:true,access_token:'fictional'});await x.d.getElementById('verify-account-link').onclick();ok(!x.calls.some(c=>c[0]==='session'));ok(!x.d.getElementById('account-reset-request').hidden);
 ok(/persistSession:false/.test(fs.readFileSync('account-entry.js','utf8'))&&/detectSessionInUrl:false/.test(fs.readFileSync('account-entry.js','utf8')));
 console.log(checks+' account setup and recovery checks passed (synthetic DOM/authentication; no delivered email or real recovery-token acceptance).');
})().catch(e=>{console.error(e);process.exitCode=1;});
