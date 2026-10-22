# Firebase account integration under construction

The separate Firebase account adapter supports email/password signup, email verification, sign-in, password recovery, verification of action codes and in-memory sessions. It does not grant business ownership, paid access, quality approval or funding readiness.

`firebase-entry.mjs` imports only Firebase app/auth. Firebase is pinned to 13.1.0 in the lockfile. `pbs-firebase-config.mjs` contains public web configuration. No Analytics, Firestore, Firebase Hosting or Cloud Functions are initialized by this adapter.

The adapter is deliberately not loaded by `account.html` or `consultation.html`. The public account page stays paused. Existing account scripts and saved-work ownership are unchanged. The adapter is not a drop-in replacement for the current account client: Firebase users require verified identity mapping and server authorization before they can use saved records.

Local verification: 30 mocked-SDK checks exercise lifecycle requests, the fixed PBS callback, memory persistence, denial of wrong issuer/audience/subject/role, email-verification checks and late sign-in after page closure. A real Firebase SDK bundle compiles. These checks do not prove delivered emails, action-code acceptance or two-customer database access.

The public provider-configuration read confirmed Firebase project number 703846445166. Returned authorized domains were localhost and the two project Firebase default domains. Add pseq.risingphoenixhq.com through Firebase Authentication settings before testing PBS account email links. A successful provider read does not grant administrative Firebase access.

Before release: configure the authorized PBS domain and email-action handling; implement issuer-bound ownership mapping and authorized role-claim assignment without enabling paid services; verify the Supabase integration and model-service authentication; test normal signup, verification, sign-in, reset, expired/reused codes, two-customer access, refresh recovery and revocation. Never link historical ownership by email alone. Password reset completion is not reported as proof that every previously issued session was revoked.

Official references:
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/web/manage-users
- https://supabase.com/docs/guides/auth/third-party/firebase-auth

Run `npm test` and `npm run check:firebase-build`. No provider account creation or email sending occurs in these tests.
