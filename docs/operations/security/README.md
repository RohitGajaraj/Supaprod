# Security

> **Publishing blocked by a security scan? Read [`lovable-scanner-false-positives.md`](./lovable-scanner-false-positives.md) first.** Lovable refuses to publish while a critical is unresolved. The two criticals standing on 2026-08-22 are **false positives** — the scanner reads RLS policies statically and cannot see the `BEFORE UPDATE` triggers that enforce both rules. Verified against production. The action is Ignore, not a migration.


> _Created: 2026-08-03 · Last updated: 2026-08-03_

Audit findings, remediation state, and the one implementation guide. For the architectural contract (RLS, tenancy, the server boundary), read [`../../architecture/security.md`](../../../architecture/security.md). For the rules a change must satisfy, [`../../AGENTS.md`](../../archive/agent-operating-manual.md) §3.

---

## Live

| File | What it is |
| --- | --- |
| [`remediation-roadmap.md`](./remediation-roadmap.md) | What is still open, and in what order. **Start here.** |
| [`remediation-log.md`](./remediation-log.md) | What has been fixed, dated. |
| [`xss-prevention-guide.md`](./xss-prevention-guide.md) | The implementation guide. Durable, not a snapshot. |
| [`audit-remediation.md`](./audit-remediation.md) | The narrative report behind the roadmap. |
| [`cookie-and-storage-policy.md`](./cookie-and-storage-policy.md) | Every key the app writes into a browser, with the file that writes it, and why no consent banner is required. **Read it before adding any storage write, analytics vendor or third-party script.** |

## The two live-browser audits, and why both are kept

Both JSON files audit the same target: the Impeccable live-mode browser injection scripts under `.kiro/skills/impeccable/scripts/`.

| File | Findings | Character |
| --- | --- | --- |
| [`audit-live-browser-review.json`](./audit-live-browser-review.json) | 6 | Dated 2026-07-22, carries `scope`, `riskSummary`, `detailedFindings` and `testingNotes`. A considered review. |
| [`audit-live-browser-scan.json`](./audit-live-browser-scan.json) | 10 | No date or scope field. Reads as an automated scan. |

**Neither is a subset of the other**, which is the reason both survive. They were compared finding by finding on 2026-08-03: the scan reports 10 issues the review does not list, and the review reports 6 the scan does not, and they cite **different line numbers in the same files** for what is arguably the same defect. Deleting either would lose real findings.

They agree on the substance, and the substance is the point: **`validateTokenSignature()` in `live-browser.js` is stubbed.** It reads as HMAC validation and validates nothing beyond a regex shape, with the token also exposed on `window`. Both passes rank that high. Whichever file you open, that is the finding to act on.

The disagreement is itself informative: two audits of one 60-line file produced two different counts and two different line maps. Treat any single audit's finding count as a floor, never a total.

## Standing rules

- **Secrets are local-first.** Values live in the git-ignored `.env` and as wrangler secrets, under the client/server split in [`../../AGENTS.md`](../../archive/agent-operating-manual.md) §3. Never add a `VITE_` prefix to a secret; that publishes it in the browser bundle.
- **RLS on every user table, scoped by membership.** No client-trusted role checks.
- **The service-role client is never imported from client code.**
- Advisor output and live logs come from the Lovable MCP, not from a doc.
