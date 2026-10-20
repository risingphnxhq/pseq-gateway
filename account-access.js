(function(){'use strict';
const account=window.PBSAccountClient,$=id=>document.getElementById(id),callback=window.PBSAccountCallback||{},redirect='https://pseq.risingphoenixhq.com/account.html';
delete window.PBSAccountCallback;
let busy=false,recoveryUser=null,link=callback;
const hasLink=!!(callback.access_token||callback.refresh_token||callback.token_hash||callback.type||callback.error);
function message(text){$('account-message').textContent=text;}
function clearPasswords(){for(const id of ['signup-password','signup-confirm','new-password','new-password-confirm'])$(id).value='';}
function password(value,confirm){if(value.length<12||value.length>256)throw Error('Use a password with 12–256 characters.');if(value!==confirm)throw Error('The passwords do not match.');return value;}
async function run(fn){if(busy)return;busy=true;for(const b of document.querySelectorAll('button'))b.disabled=true;try{message('Working…');await fn();}catch(e){message(e.message||'The account request was not confirmed. Try again.');}finally{busy=false;for(const b of document.querySelectorAll('button'))b.disabled=false;}}
async function localSignout(){try{await account.auth.signOut({scope:'local'});}catch{}recoveryUser=null;}
if(hasLink){$('account-create').hidden=true;$('account-reset-request').hidden=true;$('account-link').hidden=false;}
if(!account){message('Account access is unavailable here. Return to sign-in or contact support.');for(const b of document.querySelectorAll('button'))b.disabled=true;return;}
$('signup-form').onsubmit=e=>{e.preventDefault();const a=$('signup-password').value,b=$('signup-confirm').value;clearPasswords();return run(async()=>{const value=password(a,b),email=$('signup-email').value.trim();const {data,error}=await account.auth.signUp({email,password:value,options:{emailRedirectTo:redirect}});if(error)throw Error('Account setup was not confirmed. Try signing in or requesting password recovery.');if(data?.session)await localSignout();message(data?.session?'Your account was created. Return to sign-in to continue. This does not activate a paid service.':'If account confirmation can be sent, check your email and follow the newest link. Email delivery is not confirmed by this page.');});};
$('reset-request-form').onsubmit=e=>{e.preventDefault();return run(async()=>{const {error}=await account.auth.resetPasswordForEmail($('reset-email').value.trim(),{redirectTo:redirect});if(error)throw Error('The reset request was not confirmed. Wait before trying again, or contact support.');message('If this account is eligible for recovery, a reset email has been requested. Check your inbox and follow the newest link. Delivery has not been confirmed here.');});};
$('verify-account-link').onclick=()=>run(async()=>{const value=link;link=null;$('account-link').hidden=true;if(!value||value.error||!['recovery','signup','email'].includes(value.type)){if(value){value.access_token=null;value.refresh_token=null;value.token_hash=null;}$('account-reset-request').hidden=false;throw Error('This link is unsupported, invalid or expired. Request a new email from the account page.');}
try{
 let response;
 if(value.token_hash)response=await account.auth.verifyOtp({token_hash:value.token_hash,type:value.type==='signup'?'email':value.type});
 else if(value.access_token&&value.refresh_token)response=await account.auth.setSession({access_token:value.access_token,refresh_token:value.refresh_token});
 else throw Error('Missing link credentials');
 if(response.error||!response.data?.session)throw Error('Link verification failed');
 const {data,error}=await account.auth.getUser();if(error||!data?.user?.id||!data.user.email)throw Error('Account verification failed');
 if(value.type==='recovery'){recoveryUser=data.user.id;$('recovery-identity').textContent='Recovering: '+data.user.email;$('account-new-password').hidden=false;message('Account verified. Confirm the email shown above before choosing a new password.');}
 else{await localSignout();message('Your confirmation link was verified. Return to PBS sign-in to continue.');}
}catch{await localSignout();$('account-reset-request').hidden=false;throw Error('This email link could not be verified. Request a new one; no password was changed.');}
finally{value.access_token=null;value.refresh_token=null;value.token_hash=null;}
});
$('new-password-form').onsubmit=e=>{e.preventDefault();const a=$('new-password').value,b=$('new-password-confirm').value;clearPasswords();return run(async()=>{
 if(!recoveryUser||!$('recovery-account-confirm').checked)throw Error('Verify your recovery link and confirm the account shown before changing its password.');
 const value=password(a,b),verified=await account.auth.getUser();if(verified.error||verified.data?.user?.id!==recoveryUser){await localSignout();$('account-new-password').hidden=true;throw Error('Your recovery session is no longer available. Request a new email link.');}
 const {error}=await account.auth.updateUser({password:value});if(error)throw Error('Your new password was not confirmed. The link may have expired or the password may not meet account requirements.');
 const signedOut=await account.auth.signOut({scope:'global'});await localSignout();$('account-new-password').hidden=true;$('recovery-account-confirm').checked=false;
 message(signedOut.error?'Password updated. Sign-out did not finish. Close this page and return to sign-in.':'Password updated. Return to PBS and sign in with the new password to recover your saved work.');
 });};
window.addEventListener('pagehide',()=>{clearPasswords();link=null;recoveryUser=null;});
})();
