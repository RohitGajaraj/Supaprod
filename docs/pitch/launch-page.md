# The launch page, copy draft

> _Created: 2026-09-03. Draft only. Nothing here ships without the founder's explicit approval: not the page, not the Product Hunt listing, not one sentence of it. Register and vocabulary follow [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md), the current canon; where this draft and an older pitch file disagree, the newer canon wins and the older file is stale, not this one. Every claim is tagged **PROVEN** (live and verifiable today), **WIRING** (built, not yet demonstrably run, never said present-tense) or **ROADMAP** (said as future). Every number below carries the query that reproduces it, re-run 2026-09-03; re-run again before publish, per [`verified-numbers.md`](./verified-numbers.md)'s own rule: a number without a query does not go outward. Corrected 2026-09-03 (A1's return, four claims): §3's centerpiece now says exactly what the query proved, the write-path fix is described as the refusal it actually is, §4 no longer claims Supaprod built itself, and the commit/migration counts came off the visible copy into the proof table only, since the canon bans leading with volume._

**Founder approval, 2026-09-03:** the founder gave explicit approval in chat to proceed on this draft, after A1's 18:20 IST verification (three proof rows checked against the database and the repo, no dash in the prose, `docs:check` clean). This satisfies Scope's own acceptance line ("the founder reads it and says yes or no"). It does not, on its own, satisfy the separate sequence gate below: PC-04 and the beta-partner stories are unrelated blockers this approval does not touch.

**Sequence dependency, unchanged from [`launch-assets.md`](./launch-assets.md):** this page assumes the no-signup demo (PC-04) is live before it publishes. The copy below is written so the moment that clears, the `[DEMO-LINK]` slots are the only fill-in-the-blank left.

---

## 1. The hero

**Headline:**

```
When building is cheap, the wrong call gets expensive.
```

**Subhead:**

```
Supaprod is an agent fleet that runs product work end to end: reads
signals, ranks the bets, red-teams them, writes the spec, ships it, and
records what your team believed before it knew the outcome. Not a chat
box. A team that answers for its own calls.
```

_Why this headline and not a faster/throughput one: the positioning canon's own survey evidence (§2) says 82% of the audience already report AI makes them measurably more productive, so nobody in the target segment needs to hear "faster." The judgment gap ("PMs got faster at shipping but didn't get better at defending why," Community Wisdom 189, quoted in `positioning-locked-2026-08.md` §3) is the unclaimed, unaddressed pain. Selling relief, not throughput, per the canon's own operating rule._

**CTA:** `Try it, no signup: [DEMO-LINK, PC-04]` · secondary: `Watch the 2-minute video: [VIDEO-LINK]`

---

## 2. The mechanism, in prose

_No station diagram: refused by the canon, §5. A staged lifecycle diagram is SAFe's visual signature and this buyer is removing it._

```
Supaprod's agents read what customers and your own team are actually
saying, rank what's worth building against your own decision history,
argue the case for and against it before you spend a sprint on it, write
the spec, build it to a pull request, ship it, and check what actually
happened. Then that feeds the next call. Every step is a real agent run
you can open and read, not a status update. Every gate a person has to
clear, merge, revert, delegate, stays a person's to clear.
```

**PROVEN, live 2026-09-03:** the loop is real and autonomous. A scheduled engine advances work through this route on its own, unattended, and every step is a row a person can open. `select count(*) from cron.job` on production lists 37 scheduled ticks, `admin-expiry-tick` through `uptime-tick`, each posting to the product's own hooks with an explicit timeout (`supabase/migrations/20260806031833_7ca287c2-a543-46de-9fb4-7859cd8ff8a0.sql`, already applied). A second migration this session wrote would keep that true after a full database replay, since every job's original migration still hardcodes the old preview host; it is not yet applied, pending founder approval (P-38 in the queue). **No usage volume is claimed here, deliberately.** See §5, below, for why.

---

## 3. The centerpiece: the morning the loop caught itself

**This is the honest-run story, in one paragraph, and it is the strongest thing on the page precisely because we found it ourselves and fixed it before anyone outside the company did:**

```
On 2026-09-03, a routine audit found that 943 of the 1,512 evidence rows
in our own database, 62 percent, carried the loop itself as their
source rather than a real one. Two of those rows had already changed a
real decision. We didn't fix it by asking the agents to be more careful:
a seat can no longer write a signal that names no source outside the
workspace, and every reader that counts evidence now excludes a row with
no real source, automatically, a rule enforced once where the write
happens, not a patch on the two rows we found. The two original rows are
still in the database, marked, not deleted: the honest record of the day
the system caught itself.
```

**Why this is the proof point and not a liability to bury:** the positioning canon's own refusal list (§5) forbids claiming a track record cannot be gamed or backfilled, because everything can be, after the fact, by a person or a model with the transcripts. What cannot be faked after the fact is a system that had a real blind spot in production, found it, and closed it at the mechanism rather than the symptom, with the evidence of both states still on the record. **This is the self-correction the plain-and-unsold rule (CLAUDE.md) asks for: lead with the mechanism and the correction, never with volume.**

**PROVEN, exact numbers, live 2026-09-03** (`select count(*), count(*) filter (where source = 'agent') from signals;`): **943 of 1,512** signals database-wide carried `source = 'agent'` before the fix. Today every one of them is excluded from every evidence count by a database rule (`source` required and validated at the write layer, no default), not a per-row patch. The two rows that changed a real decision are marked `source_kind = 'loop_authored'` and kept, not deleted.

---

## 4. What else is real today

**(PROVEN only; WIRING and ROADMAP separated below. Volume figures, commit and migration counts, are deliberately not in this section: the canon bans leading with them. See the proof table for the numbers and their queries.)**

- **PROVEN.** Every schema change the loop has ever needed is a file in this repo, not a console edit; the count and how to reproduce it are in the proof table.
- **PROVEN.** A real pull request opened and merged on a bound repo through the product's own gated build path, the same human-approval gate every user's own build goes through.
- **WIRING, said as WIRING.** The forecast captured at decision time: what a team believed before the outcome was known, which the canon calls the actual moat (`../strategy/positioning-locked-2026-08.md` §4). The write path exists and enforces immutability once a forecast is set (`enforce_forecast_immutable`, live since 2026-08-10; the grader that reads it back against a settled outcome is this session's own P-04/P-42 work), and capture began 2026-08-10. **It has no history yet and the page must not imply one.** Say: "the mechanism exists and is enforced; it starts accruing the day a real team's first bet resolves."
- **The honest state, said plainly, because the canon requires it (§4, §5D):** organic external usage today is zero. We built the loop before opening the doors. The demo login is the evidence a reader can run themselves and cannot argue with, which is the point of leading with it instead of a number.

---

## 5. Why no usage-volume claim appears on this page

`select count(*) from spine_tracks;` returns **113** rows total and **0** in a production (founder-or-real-account) workspace: every one of those 113 runs sits in a demo or seeded workspace. Quoting that number as proof of anything but the mechanism working would be exactly the falsified-number pattern `verified-numbers.md` exists to prevent (three numbers in the YC application turned out to be seed data). **This page's proof is the mechanism (§2, §3) and the demo login, not a count.**

---

## 6. Product Hunt

**The tagline, description and first comment are now in [`launch-assets.md`](./launch-assets.md) §2, promoted there in the same pass this file was drafted, so the submission copy has exactly one live version rather than two ("Update in place. Never fork a parallel copy," `README.md`'s own standing rule). This page's job is the landing page (§1 to §5); §2 there carries the same honest-run story adapted to PH's own register.**

---

## Proof table (Scope requirement: every claim, a file or row that proves it)

| Claim | Proof |
| --- | --- |
| 943 of 1,512 signals carried `source = 'agent'` | `select count(*), count(*) filter (where source = 'agent') from signals;`, re-run live 2026-09-03, matches `the-first-run/A-QUEUE.md` P-41/A2's 15:26 IST entry |
| The two rows that changed a real decision are marked, not deleted | `select id, source_kind from signals where source_kind = 'loop_authored';`; migration `20260909030000_a_row_the_loop_wrote_can_say_so.sql` |
| A seat can no longer write a signal naming no source outside the workspace, and every evidence reader excludes one that has no source, from one shared rule | `src/lib/sources/the-loop-does-not-count-its-own-writing.ts` (`excludeLoopAuthored`), consumed by `src/lib/discovery.functions.ts` and `src/lib/brain/what-the-grader-read.ts`; guard test named after its own sentence, per P-41's acceptance box in `the-first-run/A-QUEUE.md` |
| A scheduled engine advances the loop unattended, 37 jobs, each with an explicit timeout | `select count(*) from cron.job;` on production, live 2026-09-03; timeouts set by the already-applied `supabase/migrations/20260806031833_7ca287c2-a543-46de-9fb4-7859cd8ff8a0.sql` |
| A migration exists to keep that true after a full database replay (today's per-job migrations still hardcode the preview host) | `supabase/migrations/20260909050000_the_cron_jobs_are_defined_where_a_replay_would_find_them.sql`, written, not yet applied, pending founder approval, see P-38 in the queue |
| 8,859+ commits, 13 weeks | `git rev-list --count HEAD`; `git log --reverse --format=%ad --date=short \| head -5`, re-run at publish time, the count grows daily |
| 605 migrations | `ls supabase/migrations/*.sql \| wc -l`, re-run at publish time |
| A real PR opened and merged on the bound test repo through the product's own gated build path | PR #4 on `Supaprod/relay-homeowner-app` (the bound test repo, not Supaprod's own codebase); `docs/pitch/verified-numbers.md` §2/§3; founder to confirm the exact PR link at publish time |
| `spine_tracks`: 113 total, 0 in a production workspace | `select count(*) from spine_tracks;`; `select count(*) from spine_tracks where workspace_id in (select production_workspace_ids());`, both live 2026-09-03 |
| Forecast capture exists, enforced, no history yet | `enforce_forecast_immutable()` trigger, `supabase/migrations/20260810160431_788887fc-9b19-492a-a718-8722c1d01f4d.sql`; `docs/strategy/positioning-locked-2026-08.md` §5D |

---

## What did not go in this draft, and why

- **No "N missions / N decisions / N learnings" summary block.** Every such figure in the repo today is either seeded, near-zero for production, or both (`verified-numbers.md` §2 to §3), including this session's own finding above that `spine_tracks` has zero production rows. A number-heavy proof section would read as the volume claim the canon explicitly forbids (§5: "throughput features as the headline... speed is the disease").
- **No receipts/ledger/audit-trail/track-record vocabulary.** Retired from marketing surfaces by the canon (§5); this draft says "evidence," "decision," "the record," never those specific nouns, on this page.
- **No station-by-station diagram.** Refused outright (§5); described in one paragraph of prose instead (§2).
- **No claim the manufactured-evidence fix was found by a customer, an investor, or anyone outside the team.** It was found in a routine internal audit. Saying otherwise, or leaving it ambiguous, would be exactly the kind of overclaim this whole page exists to avoid making.
- **No claim Supaprod built part of itself.** Corrected on A1's return: PR #4 is on the bound test repo, `relay-homeowner-app`, not on Supaprod's own code. §4 now says exactly that.
- **No commit or migration count in the visible copy.** They lived in §4 as bullet points until A1's return flagged them as volume; they now sit in the proof table only, where a number belongs when it is not the claim itself.

## Open before this can publish

- [x] Founder approval: given in chat, 2026-09-03. The draft was not read aloud line by line, so if the exact phrasing of §3 still needs a pass before it goes on the live site, that is a separate, smaller check than the yes/no this satisfies.
- [x] `8,859`, `13`, `605` refreshed 2026-09-03. Re-run again immediately before the actual publish, since the count grows daily and this approval does not freeze it.
- [ ] PC-04 (no-signup demo) ships; `[DEMO-LINK]` is still a slot. Unrelated to the founder's approval above; still open.
- [ ] Beta-partner stories exist (`launch-assets.md`'s own sequence gate). Also unrelated to the approval above; still open.
