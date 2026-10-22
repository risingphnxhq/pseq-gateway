import {initializePBSFirebase} from './firebase-entry.mjs';
import PBS_FIREBASE_CONFIG from './pbs-firebase-config.mjs';
import {createWorkspaceClient} from './firebase-workspace-client.mjs';
window.PBSAccountClient=createWorkspaceClient({account:initializePBSFirebase(PBS_FIREBASE_CONFIG)});
