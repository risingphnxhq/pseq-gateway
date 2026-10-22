# PBS Firebase workspace connection — construction

The consultation branch now uses Firebase email/password identity and a PBS-only server endpoint for its existing business, assessment, report, saved-plan, monthly-work and case services. The unreleased account-construction.html screen provides signup, replacement verification, explicit email-link confirmation and password recovery. Public main and its paused account page are unchanged. This branch remains unmerged and unreleased.

The account bundle initializes only Firebase app/auth, pinned to 13.1.0, with in-memory sessions. No Analytics, Firestore, Firebase Hosting or Cloud Functions are initialized. The PBS authorized domain was saved and observed in Firebase settings. Public web configuration is not an administrative credential.

The endpoint independently verifies Google's signature, the fixed PBS issuer/audience, email verification and current account status. A private identity binding creates an internal UUID without linking records by email or importing legacy ownership. Product access defaults closed. Firebase is not registered as a project-wide trusted issuer in the shared Supabase project, and a generic authenticated role claim is not required by this endpoint. The unused backendToken method retains the stricter role check for the earlier direct-integration proposal; workspaceToken is the method used here.

firebase-workspace-client.mjs limits transport to the dedicated endpoint and a fixed set of PBS commands. Existing cloud-draft saves use the same transport. Browser credentials never go directly to the shared Data API. The server derives the owner from the verified token, reuses existing ledgers, preserves versions and receipts, and rejects customer-selected actor fields. Sign-out invalidates pending response display. No client can grant itself access or publish a quality decision.

Local verification: 448 checks including 33 mocked Firebase lifecycle checks, 21 mocked workspace transport checks and 54 synthetic account-screen checks. Server tests and rollback SQL fixtures are separate evidence. No mocked test proves delivered verification/reset emails, real verified-email customer access or two-customer browser acceptance.

Release gates: normal signup and delivered email verification; reset with newest, expired and reused codes; two verified customers using their own accounts; saved assessment/report/plan/monthly work with refresh recovery; denied cross-customer requests; access revocation; mobile/keyboard/print acceptance. Public account access stays paused until these pass. Ordinary AI processing and quality publication remain off. No pricing or paid production approval is implied.

Official references:
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/web/manage-users
- https://supabase.com/docs/guides/functions/auth

Run npm test and npm run build:account. No account creation, email sending or provider model call occurs in these local checks.
