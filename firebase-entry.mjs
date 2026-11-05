// Construction entry only; deliberately not loaded by the paused account page.
import {initializeApp} from 'firebase/app';
import {initializeAuth,inMemoryPersistence,createUserWithEmailAndPassword,sendEmailVerification,signInWithEmailAndPassword,reload,sendPasswordResetEmail,verifyPasswordResetCode,confirmPasswordReset,applyActionCode,getIdTokenResult,signOut} from 'firebase/auth';
import {createFirebaseAccount} from './pbs-firebase-auth.mjs';
export function initializePBSFirebase(config,onCleared,system=null){return createFirebaseAccount({config,onCleared,system,sdk:{initializeApp,initializeAuth,inMemoryPersistence,createUserWithEmailAndPassword,sendEmailVerification,signInWithEmailAndPassword, reload,sendPasswordResetEmail,verifyPasswordResetCode,confirmPasswordReset,applyActionCode,getIdTokenResult,signOut}});}

