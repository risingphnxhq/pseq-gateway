import {initializePBSFirebase} from './firebase-entry.mjs';
import config from './pbs-firebase-config.mjs';
import {mountFirebaseAccount} from './firebase-account-controller.mjs';
mountFirebaseAccount({document,window,account:initializePBSFirebase(config,undefined,window.PBSAccountSystem||null),action:window.PBSFirebaseAction});

