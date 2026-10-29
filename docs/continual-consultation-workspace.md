# PBS continuing consultation workspace — initial construction increment

Update: The later persistence/account increment is documented in [draft-persistence.md](draft-persistence.md). Statements below about missing account storage/import describe the initial d8e0b716 increment; the later branch adds versioned server drafts, an existing-account pilot and file recovery. Production authority and acceptance remain pending.

Actor: Codex in Corporate Chad's conversation, October 17, 2026. No independently authenticated officer or CATE action is claimed.

Baseline: pseq-gateway main 24e8f53db90eaddd13db6f29f2e39e5b04a4526f, physically fetched. Corporate PSC 024, 025 and 031 payloads retrieved; hashes verified.

Adds consultation.html and an isolated continuing-consultation preview to the existing repository. Existing pages and diagnostic/plan engines are preserved. Uses their current PBB validation and plan content. Black, ivory and gold presentation; mobile styles, keyboard focus, text-based status and print styles. Real-browser/accessibility acceptance remains outstanding.

Four tasks belong to one monthly cycle, normally one per week. Unsubmitted, awaiting-review and deficient tasks carry forward with stable IDs. No fresh tasks are added while any current tasks remain unresolved. Deficient submissions retain receipts and require correction under the same task; each new correction has its own submission receipt but task acceptance credit remains at most one. An identical request retries without another receipt; conflicting retries fail. Submission requires explicit acknowledgment of the stored disclosure version and full text.

Quality simulation is exposed under a clearly labeled self-review control. It does not impersonate an authenticated provider, independent practitioner or deployed executive. ACCEPTED_IN_PREVIEW is not a real provider authorization decision. Receipt strings begin PREVIEW-. No financial entitlement or funding approval is inferred. Prior legacy plan declarations are retained in legacy_plan_record and never silently translated into new acceptance credit.

After current work is resolved, a recorded reassessment must precede opening the next planned four tasks. This is a bounded adapter over the existing 4/8/12 milestone PBB plan, not the final adaptive task-generation service. At plan exhaustion it requires a newly tailored plan rather than fabricating endless work. A funding milestone does not terminate consultation. Reassessment records observation and changed direction separately from submissions and quality.

Guidance is explicit deterministic task/status guidance, not a deployed language-model consultation service. No network calls, account, payment, central persistence or browser storage are introduced. Export is evidence-only; consultation-export resume/import remains pending and the UI states this. Refresh loses page memory. Personal or sensitive data should not be used in the preview.

Production dependencies: bind server ownership to existing PBS customer entities; persist cycles, stable tasks, versioned submissions/disclosures/quality/reassessment and events atomically; provider review permissions separate from customer declarations; authenticated API idempotency; server-generated receipts; authoritative scoring and consultation; verified test-mode payment/delivery; recovery across devices; full browser/mobile/keyboard/print and independent practitioner/CATE acceptance. Existing Worker payment/delivery defects remain unresolved by this increment. No DIBANA integration, prices or live charges.

Tests: node tests/consultation.cjs and node tests/consultation-dom.cjs. The latter uses pinned linkedom; it is synthetic DOM testing, not browser or accessibility certification.
