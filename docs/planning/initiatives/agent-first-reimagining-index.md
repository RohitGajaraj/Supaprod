# The agent-first reimagining: one door to all of it

> _Created: 2026-08-22_

**Start here.** The work spans ten documents, 49 commits and five migrations across one session, and
nobody can see its shape from any single file. This maps the founder's ten required sections to what was
actually delivered, so the next reader can go straight to the part they need and skip the rest.

**The one-line finding, because it reframes everything below:**
**the design did not need reimagining, it needed activating.** A complete platform design already existed
and was referenced from no entry point. The machinery was built and unreachable. The session's real value
was turning it on and discovering what that revealed.

---

## The ten sections, and where each one lives

| # | Required | Delivered | Lines |
| --- | --- | --- | --- |
| 1 | Current state, prior work | [`initiatives/README.md`](./README.md) — "is my question already answered?" | 83 |
| 2 | Agent-first model | [`agent-first-platform.md`](./agent-first-platform.md) §2 — Question → Bet → Run → Verdict | 1,091 |
| 3 | Lifecycle + entire platform | [`non-station-surfaces-2026-08.md`](../../design/non-station-surfaces-2026-08.md) — Brain, Engine Room, Settings, navigation, notifications, integrations | 819 |
| 4 | Dual user/agent journeys | [`station-journeys.md`](../../../architecture/station-journeys.md) — every station walked twice | 359 |
| 5 | Station / signal / agent / backend / handoffs | `agent-first-platform.md` §5 | — |
| 6 | Headless / MCP / agent-to-agent | [`agent-to-agent.md`](../../../architecture/agent-to-agent.md) — three machine doors | 246 |
| 7 | Meridian + extensions | [`MERIDIAN-INVENTORY.md`](../../design/MERIDIAN-INVENTORY.md) + [`premium-pass-2026-08.md`](../../design/premium-pass-2026-08.md) | 104 + 387 |
| 8 | Gaps | `agent-first-platform.md` §8, plus [`adversarial-review-2026-08.md`](./adversarial-review-2026-08.md) | 816 |
| 9 | Implementation sequence | `agent-first-platform.md` §9, re-baselined in its 2026-08-22 addendum | — |
| 10 | Validation | `agent-first-platform.md` §10 — **read its correction first** | — |

Adjacent and load-bearing: [`lovable-scanner-false-positives.md`](../../operations/security/lovable-scanner-false-positives.md)
(222) and [`deepseek-harness-read-2026-08.md`](./deepseek-harness-read-2026-08.md) (182).

---

## The five things a new reader gets wrong

**1. Most of §10's numbers were measuring the demo tenants.** Three lanes hit this independently in one
day. Forecasts read 146 of 290 and are **0 of 60** in real workspaces. Pending approvals read 38 and
**not one** is on a real workspace. **Split every criterion on `workspaces.is_sample` or it means
nothing** — the demo tenants were seeded to look like a working product, so they always report the
product working.

**2. §7.1 is superseded and its claims were falsified by measurement.** Body weight 450 is wrong: the
reference computes **400**, measured twice on two days by two readers. `meridian.css` carries a note
saying that claim must not return a third time. It returned on 2026-08-22 and was refused.
**Take Meridian's numbers from `src/styles/meridian.css`, never from a document about it.**

**3. The gallery-only components are a PORT programme, not a MOUNT programme.** Each target surface
already does that job in retired vocabulary, and ratchet law 1 forbids a lossy swap. Two were mounted;
**four were deliberately left with their reasons recorded, and that is finished work, not a gap.**

**4. The loop ran on real data for the first time on 2026-08-22, and the economics did not survive it.**
Four tracks, 16 runs, one across into Decide — and the whole monthly grant gone in **80 minutes**. The
bar that let it start was cleared by **13 restatements of two sentences**. The cold-start flag is **off
everywhere** and stays off until the sink can tell a restatement from a signal.

**5. Reading someone else's code found four defects in ours.** The DeepSeek harness read produced **zero**
copyable files and **two severe live defects**: a shell injection carrying a write-scoped token, and a
scheduler dead five weeks while reporting `ok` 144 times a day. Budget that kind of exercise for what it
shows you about your own code.

---

## What is genuinely still open

| Item | Needs |
| --- | --- |
| **The product has no external input** | 12 signals have *ever* arrived from a connected tool, newest 2026-07-09. `ingest_tokens` has **zero rows**. **This is the binding constraint** — the loop feeding itself is its symptom |
| **Credit economics** | The free grant is 14–25% of one loop; Pro's whole monthly inclusion is at or below one loop. Arithmetic is in the review; **the numbers are a founder call** |
| **Every governed MCP write audits a refusal as success** | Six non-throwing quarantine returns, and `withIdempotency` caches the lie |
| **The loosest door onto `decisions` is now the person's** | Both agent doors require the full bet; `createDecision` still takes a bare title |
| **Meridian law 5** | Browser access is profile-dependent. One lane reached `/today`, another could not. Do not assume either way |

## The rules this session paid to learn

- **A gate run against a tree other lanes are writing produces false failures.** `docs-doctor` also had a
  real race, fixed 2026-08-22.
- **Assert on the value, never on whether a statement threw.** The billing guards revert silently; a probe
  that watches only for an exception reports the opposite of the truth.
- **A number without its query is not evidence, and the population is part of the query.**
- **Brief a lane with the claim AND "verify this first."** Several briefs were wrong; every lane caught
  its own. The corrections were worth more than the tasks.
