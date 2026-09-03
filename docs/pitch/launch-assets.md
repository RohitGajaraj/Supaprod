# The listing — launch assets (Show HN, Product Hunt, build-in-public)

> _Created: 2026-07-10 (Lane D, PC-14). Status: **drafts ready, founder publishes nothing until the sequence's own prerequisites clear.** Every claim below is tagged [PROVEN] / [WIRING] / [ROADMAP] per [`one-pager.md`](./one-pager.md); nothing WIRING gets spoken as present tense on publish day. Citation rule (research §12.4, binding): artifacts and named companies only, never gurus._

## The sequence this kit assumes (v13 §2, PC-14's own acceptance)

**Beta usage stories first → Show HN → Product Hunt the same week → Lenny-ecosystem + PM communities.** Two blocking dependencies as of 2026-07-10, honestly flagged, not worked around:

1. **PC-04 (try-without-signup demo) is still ⬜ open.** The Show HN post below assumes a no-signup demo link exists per the demo-script.md doctrine ("Show HN: a no-signup demo link (PC-04)"). Until PC-04 ships, the post cannot go out — the `[DEMO-LINK]` slot stays a slot, not a placeholder to fill with something else.
2. **Beta usage stories don't exist yet — zero external users as of 2026-07-10** (one-pager.md's own honest state). The post's "who's using it" beat needs at least a handful of real design-partner stories (PC-13) before it is truthful. This kit's story section is a template with the exact shape to fill, not filled-in copy.

**What this kit IS today:** every asset fully drafted and ready — titles, body copy, gallery shot lists, the honest-limitations list, the failure-path GIF brief — so that the moment PC-04 ships and the first 2-3 beta stories land, publishing is a fill-in-the-blanks job, not a from-scratch write. That is the actual leverage of doing this now.

## 1. Show HN post (the centerpiece — evidence-first, per demo-script.md's Show HN variant)

**Title (Beat 0 as the promise, per the demo doctrine):**

```
Show HN: Supaprod – an AI product team with a track record that proves what worked
```

_Alt, if the above reads too close to "AI product tool" (v13's own ban list) — pick on submit day by reading both aloud:_

```
Show HN: I built the thing this year's top r/ProductManagement post describes,
as a real product
```

**Body (structure only — every bracket fills at submit time from live data, never estimated):**

```
Ask your team "why did we decide X" about anything you shipped last quarter.
That excavation — hours of Slack archaeology — is the job today, even with
AI tools everywhere. [PROVEN — the community's own words, cited: a 480-point
r/ProductManagement thread on PRDs converges on the exact same line.]

Supaprod is an agent fleet that runs the product loop end to end — reads
signals, ranks the bets, red-teams them, writes the spec, builds to a PR,
records what happened — plus the thing engineering never needed: an outcome
track record, because code has a compiler and product judgment doesn't.

What's real today [PROVEN, live DB as of publish date]:
- A pg_cron engine advances missions every minute through Sense→Decide→
  Define→Build→Ship→Learn. [N] missions, [N] agent runs, [N] decisions,
  [N] learnings, [N] AI events through one governed chokepoint.
- Outcomes move the ranking — recorded decision outcomes re-rank the next
  bets (the reinforcement seam, RF-01..08).
- Agents graduate permissions by track record; merge/revert/delegate are
  always human-gated, never overridable.
- A real PR merged through the product's own gated path — this thing built
  part of itself.

Try it with no signup: [DEMO-LINK — PC-04, not live yet]. Or watch the
2-minute video: [VIDEO-LINK — PC-27/video-scripts.md].

The honest limitations (we'd rather you hear it from us):
- [LIST — filled from the real gap list at publish time; candidates already
  known: zero external users before this post; the self-improvement loop
  is designed but not yet claimed publicly (RPT-50 gates that claim);
  connector breadth is still growing]

I'll be in the comments all day. Happy to show the failure path live too —
it's rehearsed on purpose (see the GIF): a wrong AI-drafted call, reverted
in one key, recorded in the track record as its own evidence.
```

**The failure-path GIF (per demo-script.md Beat 4 — the single highest-trust moment the research identifies):** record the wrong-ranking → revert → track record-evidence sequence on a real (dogfood or demo) account. This is not a nice-to-have; the research is explicit that skeptics judge the error path, not the win path. Brief: 15-20 seconds, the revert keystroke visible, the track record entry landing visible immediately after.

**Comment-thread posture (founder, live, all day):** answer technical questions plainly, cite the repo/register when asked "is this real," never argue with skeptics — the community's own top threads (research §12.4) call out defensive posturing as a tell. If someone asks about the self-improvement claim, the honest answer is "designed, not yet running publicly — we don't claim it until it demonstrably does" (the WIRING discipline, in public, live).

## 2. Product Hunt listing

**Updated 2026-09-03 (P-46, `the-first-run/A-QUEUE.md`): the tagline/description/first-comment
below replace the originals, which used vocabulary the canon has since retired on marketing
surfaces ("track record", "audit trail" — see [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md)
§5) and led with volume rather than the mechanism. The centerpiece is now the honest-run
finding: full copy, the proof table and why it is the strongest thing to lead with are in
[`launch-page.md`](./launch-page.md) §3 and §6 — draft there first, promoted here so this file
stays the one place the actual submission copy lives.**

**Tagline (60 chars):**

```
The AI product team that caught its own bad evidence
```

**Description (short, PH-native, no adjectives doing a number's job):**

```
Supaprod runs product work end to end with an agent fleet — signal to
decision to spec to shipped PR. It also checks its own work: a recent
audit found 62% of its evidence was the loop's own notes miscounted as
customer signal, and the fix is now a database rule, not a promise. Try
it without signing up: [DEMO-LINK].
```

**First comment (founder, posted immediately at launch — PH's own convention):**

```
Hey PH — built this because I hit the wall myself: the more agent work I
delegated, the more I had to answer for with nothing to answer FROM. A
few days before this listing, an audit of our own database found the
loop had been quietly grading its own homework — most of what it called
"evidence" was its own notes. We didn't paper over it; we removed the
agents' ability to write evidence at all and required a real source on
every row. That's the kind of catch I want this product doing for your
team's decisions too. Ask me anything, including what's NOT built yet.
```

**Gallery shot list (5 assets, in this order — evidence before claims, per the doctrine):**

1. The Today judgment lane — the ≤3 calls needing a human, byline + evidence link visible.
2. The teardown (Critic red-teaming a real bet) — evidence chain visible, not a chat bubble.
3. A real merged PR with CI green, opened by the mission, under the merge gate.
4. The revert moment — the failure path, captioned "we rehearse being wrong on purpose."
5. The calibration surface — "Supaprod called N of the last M," the published miss record.

**Topics/categories:** Productivity, Artificial Intelligence, SaaS. Avoid "AI Assistant" / "No-Code" categories — the v13 ban on "AI PM tool" framing applies to category selection too, not just copy.

## 3. Teardown share links (the evidence artifact people actually forward)

**Mechanism ([PROVEN], verified live 2026-07-10):** every Critic teardown gets a public, read-only share link at `/t/$slug` (`src/routes/t.$slug.tsx`, `getPublicTeardown` in `src/lib/opportunities-share.functions.ts`) — the idea, the verdict (Ship/Revise/Kill), and the three honest sections (risks, what would kill it, what you cannot prove yet), no login required. Same shape as `/d/$slug` (decisions) and the new `/proof` Track record (`trust-ledger-launch-plan.md`) — this repo now has three public evidence surfaces sharing one pattern. This is the artifact the Show HN post and PH listing both point to as proof, and the natural thing a beta partner forwards to a colleague ("look what it found in 90 seconds") — organic distribution that isn't astroturfing, because the partner is sharing their own real result.

**Copy for the share-link landing (what a stranger sees clicking a shared teardown):**

```
This is a real teardown Supaprod ran on [workspace]'s actual bet — evidence,
precedent, and the call, all with the evidence. No login needed to read it.
[Try it on your own bet → DEMO-LINK]
```

## 4. Build-in-public arc (routes to the brand repo, not authored here)

Per [`CLAUDE.md`](../../CLAUDE.md) §1.65: the build-in-public brand system lives in a **separate private repo**, not this one. This repo's job is the one-way insight feed: when a genuinely postable build insight surfaces during the launch sprint (high bar — not a build log, something a real social post would use), it goes into [`../growth/brand-feed.md`](../growth/brand-feed.md) with a capture cue (the screenshot/video/link that would strengthen the post). The brand repo's engine drafts in the founder's voice and stages Buffer drafts for his review; it never publishes on its own. **Nothing from Supaprod work publishes to the founder's accounts without his explicit approval** — this kit does not draft social posts directly; it feeds the one channel that's designed to.

**Launch-week candidates worth capturing to brand-feed.md when they happen for real (not written yet — these are the shape, not drafted posts):** the day PC-04's demo goes live; the first real design-partner "aha" moment (with the partner's permission); the Show HN thread hitting front-page-of-day, if it does; the first paying-customer evidence.

## 5. The Google-OAuth "request access" guard (the launch trap, guarded)

**Rule (binding, v13 §2 PC-14, plan §4):** if Google verification hasn't cleared by listing day, every Google-OAuth connector tile (Gmail, Google Calendar, etc.) on the connect surface must read **"Request access"** instead of offering the live OAuth flow — never a broken or unverified consent screen shown to a stranger on launch day. This is a UI-state check, not a copy-only fix — confirm at publish time whether verification (PC-03's dependency) has cleared; if not, the connect-surface build (Lane B territory, not this row) needs the gated state wired before listing. Flagging here so PC-14's publish-day checklist catches it even if it's a different lane's file.

**Copy for the gated tile state:**

```
Google Workspace — Request access
Verification in progress. Tell us you're interested and we'll notify you
the moment it's live. [Request access →]
```

## The publish-day checklist (do not skip any row)

- [ ] PC-04 (no-signup demo) is live — the `[DEMO-LINK]` slot has a real URL
- [ ] ≥2-3 real beta-partner stories exist (PC-13 onboarding) to fill the "who's using it" beat honestly
- [ ] Google-OAuth tiles checked: live flow if verification cleared, "Request access" gate if not
- [ ] Failure-path GIF recorded on a real account, not staged data
- [ ] Every `[N]` number pulled from the live DB the morning of publish, never estimated
- [ ] Founder has read every asset aloud once (the AI-cadence/jargon check, per the YC application's own pre-submit discipline — the same bar applies here)
- [ ] Founder explicit go-ahead on each individual post — Show HN, PH, and every brand-feed-routed social post are separate approvals, not one blanket yes

## Acceptance tracking (PC-14)

- [ ] Listed publicly by the **mid-September 2026** launch date (this item previously carried the 2026-07-10 campaign's own deadline, which lapsed when that campaign was archived) — **blocked on PC-04 + beta stories, not on this kit**
- [ ] Day-1/week-1 funnel reviewed (depends on PC-06 instrumentation)
- **This session's deliverable:** every asset in this file is draft-complete and gap-flagged. Nothing here has been sent, posted, or published. The row stays partial until the blocking dependencies (PC-04, beta stories) clear and the founder approves each send.
