# Saved customer journey evidence — October 20, 2026

The existing workspace now connects saved assessment answers, a server-calculated report, case context, a resource-aware four-task plan, registered monthly tasks, acknowledged submissions, retained receipts and fresh-sign-in recovery. Entering plan resources preserves the link to the saved assessment; changes to assessment answers clear it.

Observed at source revision 6a881ca1389c3a2bd9e8d8137aac625a5fcf0e4e:
- 249 engine, synthetic DOM and mocked transport checks passed.
- 300 backend scoring comparisons matched the pinned browser method; nine malformed/manipulated inputs were rejected and unauthenticated report access was denied.
- 53 real API and authenticated headless Chrome checks passed in https://github.com/risingphnxhq/pseq-gateway/actions/runs/39466050653 (live-saved-journey job). They include two-customer ownership denial, unchanged retry identities, stale-save HTTP409, report protection, case save/recovery, four registered tasks, disclosure acknowledgment, revised submissions retaining both receipts, and refresh/new-sign-in recovery of plan, case, report and receipts.
- A separate real Chrome smoke run passed 15 checks at widths 1280 and 390, covering keyboard entry/example activation, visible control names, no horizontal overflow, PDF generation and print cleanup. See https://github.com/risingphnxhq/pseq-gateway/actions/runs/39464838473 .

These are actual headless browser observations, not physical mobile-device testing, screenshot/printed-page visual review, an exhaustive accessibility audit or independent business acceptance. None of the external public preview sites was navigated in these browser runs.

Earlier attempts remain in the GitHub logs and private PSC evidence. Test issues included an incomplete Enter key event, repeated evaluation variable declarations, comparison of a changing review button as if it were a receipt field, and two cold Chrome startups exceeding a ten-second allowance. The startup allowance is now thirty seconds. These failed attempts are not relabeled as passes.

Six pairs of normal synthetic accounts/businesses were created across the bounded non-AI runs in this increment. Credentials stayed in process memory. Each run's final two synthetic subjects received successful global sign-out requests; the additional fresh SDK session reported failure after those global sign-outs. Previously issued access tokens are not claimed to expire instantly. No temporary AI test access was enabled, provider requests made, daily limits changed, prices approved or live charges attempted.

## Remaining acceptance

Customer account onboarding and actual password-recovery/email delivery; authorized stored-work quality/correction assessment; remaining live advice messages and direct Dana/v12 commercial-language retests; payment entitlement and report notification/opening/acceptance within the exact PBB rollout hold; human/physical-device/print visual and independent practitioner acceptance; verified RPE ownership and Corporate office responsibility before PCC presents an active internal case.

Customer AI and quality publication remain off. The dedicated service stays v12. Public main is unchanged; construction PR #2 stays draft, unmerged and unreleased. Cloudflare remains with New Mason, and PMF/marketing/distribution engine work remains separate. No Cloudflare access or changes were attempted here.

Actual actor: Codex in Corporate Chad/RPE Services (3). No independent Corporate officer action is claimed.
