# S4-003 · The connector wiring number is stale on main — three different counts for one file

> _Verified 2026-08-26 by S4 on `lane/proof` at `27338f062`. Trigger: a routine spot-check of
> S0-004's audit found grep counting 4 `stubAdapter` mentions where the audit said 6. Followed the
> rules of evidence — suspect the instrument first, count by reading, and check the claim against
> the sha it was measured at before calling anything false._

## The claim as made

S0-004 (commit `51732f187`, log entry "the connector audit job 1c"): **"20 declared in registry.ts;
`providers/index.server.ts:38` maps 14 to real adapters and 6 to `stubAdapter`; 4 hold a live
connection in production."** SPEC-CONNECTORS.md §1 carries it forward as "**14 real** … **6
`stubAdapter`** … the honest headline is 14 of 20 wired", including the line "`gmail` is a
`stubAdapter` even though `pull-ingestors.server.ts:48` runs `ingestGmailSignals`".

## What I did

Counted the dispatch map at HEAD by reading it (`src/lib/connectors/providers/index.server.ts:43-75`),
counted the `ProviderId` union (registry.ts:60-85 = exactly 20 members), then ran the same read at
the audit's own sha, and checked whether the mail family is real at HEAD.

## What happened

**S0's number was true at its own sha.** At `51732f187` the map holds exactly 6 stubs:
google_calendar, google_tasks, microsoft_outlook, gmail, microsoft_mail, firecrawl. 14 real. The
audit is not false — it is correctly dated by its commit.

**It is stale one commit later.** F-81 (`27338f062`) landed hours afterwards and made the mail
family real. At HEAD the map reads:

- **17 real** — github, intercom, stripe, slack, zendesk, hubspot, salesforce, canny,
  productboard, linear, notion, google_docs, microsoft_outlook, gmail, microsoft_mail, figma, jira
  (adapters verified exported: `mail-family.server.ts:85,141,150`)
- **3 stubs** — google_calendar, google_tasks, firecrawl

**Three counts now travel at once**, and a lane reading any of them gets a different answer:

| Source | Says | True at |
| --- | --- | --- |
| `index.server.ts:3` header comment | "TWELVE ARE REAL AND EIGHT ARE STILL STUBS"; line 9 names figma+jira as among the remaining stubs | **No** — its own inline comments at :53 and :70 say figma/jira went real 2026-08-15 |
| SPEC-CONNECTORS.md §1 + S0-004 log | 14 real / 6 stubs; "gmail is a stubAdapter" | Only at `51732f187`; F-81 same day made it 17/3 |
| The map itself at HEAD | 17 real / 3 stubs | Yes |

The sharpest instance is SPEC-CONNECTORS line 41: *"gmail is a `stubAdapter` even though
pull-ingestors…"* is now wrong in both halves — gmail has a real adapter, and that mismatch was
precisely what F-81 fixed.

## Why it matters

SPEC-CONNECTORS §1 is the document gating four weeks of connector work ("build those four before
the sixteenth evidence adapter"). A lane scoping from it today would re-wire providers that are
already wired and skip the three that are not. This is F-80's shape exactly — *a measurement with
no date is a claim* — one layer up: here the measurement HAD a sha, but the prose that carries it
does not, so it rots silently while reading perfectly confidently.

## Verdict

**FALSE at HEAD / TRUE at its own sha** — the audit was honest when written; the spec text and the
file header now disagree with the code they describe. Not theatre (no surface lies to a user in
this finding), but a truth-of-the-record defect with scheduling consequences.

**Fix belongs to S0** (`docs/**` and `src/lib/connectors/**` are outside my prefix). Ask filed:
`coordination/requests/S4/connector-counts-stale.md`. Narrowest reproduction: read
`src/lib/connectors/providers/index.server.ts:43-75` at `27338f062` and compare with
`the-first-run/SPEC-CONNECTORS.md` §1 blockquote.
