# PBS account creation and recovery — October 20, 2026

Account creation is implemented in the existing construction branch at account.html, linked from the workspace sign-in panel. It uses the existing Supabase Auth account and owned pbs_entities records. It creates no replacement registry and grants no paid access, staff office or funding authority.

Actual normal browser test at revision 9317229345dc7d0c7a493c6b8799551ba33780a1 passed nine checks: account creation through the form, password clearing, no hidden retained signup session, ordinary server-verified sign-in, no other customer's businesses, creation of an owned business, sign-out clearing, recovery of that same business after refresh, and no unhandled script exceptions. Evidence: https://github.com/risingphnxhq/pseq-gateway/actions/runs/39467828214 (account-signup job). One normal synthetic account/business was created; its credentials remained in process memory and its global sign-out succeeded. No email verification, delivery, password-reset-token acceptance or AI request was performed.

The public authentication settings check observed email signup enabled, signup not disabled, and mailer_autoconfirm=true. Current settings do not require email confirmation. This was observed, not changed. No SMTP credentials, service-role keys, admin-auth APIs or unrelated project records were read.

Recovery implementation:
- Capture supported email callback data in memory and remove query/fragment data from the address before loading the account SDK.
- Wait for an explicit customer action before exchanging the callback. Ignore arbitrary redirect destinations and use the fixed PBS account callback.
- Verify the session through getUser, display the account email, require explicit account confirmation, and recheck the same user before updateUser.
- Clear password controls before requests, request global sign-out after a confirmed password update, and return to ordinary PBS sign-in. Page exit clears callback data/identity and stops refresh.
- Keep invalid, expired and unsupported links out of password changes. A reset-request acknowledgment does not assert inbox delivery.

Account tests use mocked authentication for callback exchange, expired links, changed-user denial, confirmation, password updates and cleanup. They are not live recovery-token acceptance. Current account email/callback setup remains a launch gate: publish the approved account callback and verify its Supabase redirect allowlist; establish approved sender/SMTP and controlled-inbox delivery; test a real confirmation/reset link, expiry/replay, new-password sign-in and saved-work recovery. Shared project Auth configuration was not altered.

The fixed intended callback is https://pseq.risingphoenixhq.com/account.html . The construction page remains unreleased. Cloudflare remains with New Mason. No Cloudflare operation, new executive assignment, held bridge, AI processing change, payment activation or final price was introduced.

Actual actor: Codex in Corporate Chad/RPE Services (3); no independently authenticated office acceptance.
