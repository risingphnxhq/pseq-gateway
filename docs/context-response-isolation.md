# Delayed response isolation — October 20, 2026

Case and execution clients now invalidate pending responses whenever the account or business context is cleared. Returning to the same business does not revive a response from before that transition. Signing out leaves private history cleared even if an earlier request completes afterward. Server ownership checks remain separate and unchanged.

Nine deferred-transport checks cover A → B → A and sign-out races in both screens. The full local suite passes 236 checks. These are synthetic DOM and mocked transport checks, not observed browser acceptance or new authenticated server acceptance.

Cloudflare account listing initially succeeded with HTTP 200. The next read-only API-schema request failed with oauth_token_invalid_grant. No Cloudflare resources were changed. Cloudflare browser checks remain blocked; the successful account check does not establish lasting access.

Actual actor: Codex, operating in the Corporate Chad conversation. No independent officer acceptance is claimed. The construction branch remains unreleased; payment deployment and quality-publication holds are unchanged.
