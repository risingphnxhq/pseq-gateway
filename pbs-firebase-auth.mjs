// Firebase account lifecycle only. Database ownership and paid access remain server decisions.
export const PBS_FIREBASE_PROJECT='rpe-phoenix-business-system';
export const PBS_ACCOUNT_URL='https://pseq.risingphoenixhq.com/account.html';
export function validateFirebaseConfig(config){
 if(config?.projectId!==PBS_FIREBASE_PROJECT||config.authDomain!==PBS_FIREBASE_PROJECT+'.firebaseapp.com'||!/^AIza[\w-]{35}$/.test(config.apiKey)||!/^1:703846445166:web:[a-f0-9]+$/.test(config.appId))throw Error('PBS Firebase configuration is not verified.');
 return {...config};
}
export async function createFirebaseAccount({config,sdk,onCleared=()=>{}}){
 validateFirebaseConfig(config);
 const app=sdk.initializeApp(config,'pbs-customer-auth'),auth=sdk.initializeAuth(app,{persistence:sdk.inMemoryPersistence});
 await auth.authStateReady();
 let generation=0,closed=false,busy=false;
 const actionSettings={url:PBS_ACCOUNT_URL,handleCodeInApp:false};
 function current(g){if(closed||g!==generation)throw Error('This account page changed. Reopen it before continuing.');}
 async function operation(fn){if(closed)throw Error('This account page is closed.');if(busy)throw Error('Wait for the current account request to finish.');busy=true;const g=generation;try{const result=await fn(g);current(g);return result;}finally{busy=false;}}
 function identity(user){return user?{id:user.uid,email:user.email,email_verified:user.emailVerified===true}:null;}
 function password(value){if(typeof value!=='string'||value.length<12||value.length>256)throw Error('Use a password with 12–256 characters.');return value;}
 return {
  async signUp({email,password:value}){return operation(async g=>{let user;try{user=(await sdk.createUserWithEmailAndPassword(auth,email,password(value))).user;current(g);await sdk.sendEmailVerification(user,actionSettings);current(g);return {user:identity(user),verification_requested:true,delivery_confirmed:false};}finally{await sdk.signOut(auth);onCleared();}});},
  async signIn({email,password:value}){return operation(async g=>{try{const result=await sdk.signInWithEmailAndPassword(auth,email,value);current(g);await sdk.reload(result.user);current(g);return identity(result.user);}catch(e){await sdk.signOut(auth);onCleared();throw e;}});},
  async requestVerification({email,password:value}){return operation(async g=>{try{const user=(await sdk.signInWithEmailAndPassword(auth,email,value)).user;current(g);await sdk.reload(user);current(g);if(!user.emailVerified)await sdk.sendEmailVerification(user,actionSettings);current(g);return {requested:true,delivery_confirmed:false};}finally{await sdk.signOut(auth);onCleared();}});},
  async requestReset(email){return operation(async()=>{try{await sdk.sendPasswordResetEmail(auth,email,actionSettings);}catch(e){if(e.code!=='auth/user-not-found')throw e;}return {requested:true,delivery_confirmed:false};});},
  async inspectReset(code){return operation(async()=>{if(typeof code!=='string'||!code||code.length>2048)throw Error('Use the newest password recovery link.');return {email:await sdk.verifyPasswordResetCode(auth,code)};});},
  async confirmReset(code,value){return operation(async()=>{await sdk.verifyPasswordResetCode(auth,code);await sdk.confirmPasswordReset(auth,code,password(value));await sdk.signOut(auth);onCleared();return {password_changed:true,other_sessions_revoked:false};});},
  async verifyEmail(code){return operation(async()=>{await sdk.applyActionCode(auth,code);return {email_verified:true};});},
  async backendToken(){return operation(async g=>{const user=auth.currentUser;if(!user)throw Error('Sign in to your PBS account.');await sdk.reload(user);current(g);if(!user.emailVerified)throw Error('Verify your PBS email address first.');const result=await sdk.getIdTokenResult(user,true);current(g);const c=result.claims;if(c.iss!=='https://securetoken.google.com/'+PBS_FIREBASE_PROJECT||c.aud!==PBS_FIREBASE_PROJECT||c.sub!==user.uid||c.role!=='authenticated'||c.email_verified!==true)throw Error('PBS saved-work access is not enabled for this account.');return result.token;});},
  async workspaceToken(){return operation(async g=>{const user=auth.currentUser;if(!user)throw Error('Sign in to your PBS account.');await sdk.reload(user);current(g);if(!user.emailVerified)throw Error('Verify your PBS email address first.');const result=await sdk.getIdTokenResult(user,true);current(g);const c=result.claims;if(c.iss!=='https://securetoken.google.com/'+PBS_FIREBASE_PROJECT||c.aud!==PBS_FIREBASE_PROJECT||c.sub!==user.uid||c.email_verified!==true)throw Error('PBS saved-work access is not enabled for this account.');return result.token;});},
  user(){return closed?null:identity(auth.currentUser);},
  async signOut(){generation++;onCleared();await sdk.signOut(auth);},
  async close(){closed=true;generation++;onCleared();await sdk.signOut(auth);}
 };
}
