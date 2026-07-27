# The demo video — one bet, all the way through

> **Created 2026-07-27, on the founder's ruling: "take one journey and showcase across all the verticals, a
> continuing journey, so the user gets connected."** This is the PRIMARY cut. The eleven-step tour in
> [`video-scripts.md`](./video-scripts.md) is retained as the verified fallback — shoot that one only if a
> beat below fails to render on the night.
>
> **Data verified 2026-07-27 by querying production** (service-role, and again as `harbor@` through RLS).
> **Rendering NOT yet verified.** The tour script was written by eye against the running site; this one was
> built from the database up. Walk it once end to end before you roll, and drop any beat that does not paint
> the way it reads here.

---

## Why this cut exists

The tour hops. Step 5 kills the crypto bet, Step 7 builds the address bet, Step 8 gates an SSO mission on a
different product, Step 11 lands on an annual-pricing memory. Four narratives in four consecutive beats. A
viewer never gets to care about anything, because nothing survives from one frame to the next.

There is a better option, and the data already supports it: **one theme carries the entire video.**

```
THEME  Checkout and notification friction in the homeowner app   (18 signals, 8 sources)
  ├── OPPTY  One-tap crypto checkout for add-ons      ICE 4.0  killed_by ──┐
  └── OPPTY  Skip the address re-confirm              ICE 8.0  ←superseded_by
         └── DECISION  the diagnosis (critic)
               └── DECISION  the fix (strategist)   informed_by the diagnosis
                     └── PRD   Simplify checkout in the homeowner app
                           └── MISSION  Ship the checkout and notification pass
                                 └── CHANGESET  4 files, PR #1
                                       └── DEPLOYMENT  7bd0e14 → production
                                             ├── LEARNING  59 → 78 percent   validated_by the decision
                                             └── LEARNING  the tablet gap    CONTRADICTED_BY the decision
                                                   └── informed_by → reopens the original bet
```

That last edge is the whole product. **The loop closes in the data, not in the narration.**

---

# PART A — before you roll

Everything in [`video-scripts.md`](./video-scripts.md) Part A still applies without change: 1920x1080 (not
1440), clean Chrome profile, Slack and Mail quit, sign in as `harbor@supaprod.ai` / `Supaprod!Harbor2026`,
confirm the avatar reads **Maya Ruiz**, dismiss both banners, reload, confirm they stay gone.

The three laws in Part B still apply too: **navigate by URL only, never press a number key** (`1` approves a
real run on camera), compose room shots from the Canvas leftward, and never click Approve / Reject /
Roll back / Send to Build / Challenge / Delete.

**One addition for this cut:** walk all eight beats once, silently, and confirm each one paints. This script
is data-verified but not eye-verified. Harbor holds **4,790 credits**, so rehearsals cost nothing that matters.

---

# PART B — the eight beats

Runtime target **2:30**. Ceiling 3:00.

---

## BEAT 1 — the question · 0:00 to 0:22

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay`
**DO** Let it sit four seconds. Then let the **PRODUCT MEMORY** line hold: `25 signals · 6 meetings ·
23 decisions · 5 learnings`. Then click the ask box and type, exactly:

> `Why did we decide to simplify the checkout in the homeowner app?`

Let the answer render. **Do not hover the citation markers** — they are 9px and inert.

**SAY**
> "This is Maya. She runs a consumer app. Last month her VP asked her why they built the thing they shipped in
> March, and she spent a morning digging and still could not really answer. So watch what that costs here.
> One question, and it reads the whole record to answer it: the signals, the decisions, the outcomes.
> Everything you are about to see is what sits behind that answer."

**WHY** The tour opened on a queue. This opens on the *question the whole video then answers*. The viewer now
has a reason to watch the next two minutes: they have been promised a chain, and every beat pays it off.

**TRAPS** Counts verified today: signals 25, meetings 6, decisions 23, learnings 5. Say twenty-three, never
twenty-seven. Do not read the briefing's receipt list aloud — it repeats itself and contradicts its own
"nothing running" line.

---

## BEAT 2 — 01 Discover · 0:22 to 0:42

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=discover`
**DO** Hold on the theme **"Checkout and notification friction in the homeowner app"**. Do not click into it.

**ON SCREEN** The theme, severity 4, frequency 9. Underneath it the signals that built it.

**SAY**
> "It starts here, and she did not do this part. Eighteen pieces of evidence, from eight different places:
> support tickets, App Store reviews, NPS, sales calls, two interviews, a funnel report. One of them says the
> funnel drops thirty-four percent at the checkout confirmation step. One is an NPS detractor whose entire
> comment is: it asked me my address twice. None of those is conclusive on its own. Together they are a theme,
> and it was waiting for her on Monday."

**WHY** This is the root of the tree, and naming the count and the sources is what makes the rest credible.
Every later beat traces back to this one frame.

**TRAPS** Do **not** say "overnight" — the freshness stamp reads `33D AGO`. Say "it was waiting on Monday".
Do not claim per-line agent bylines; none exist. Do not open the standalone `/discover` route, which swaps the
whole app chrome.

---

## BEAT 3 — 02 Decide, where it argues back · 0:42 to 1:08

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=decide`
**DO** One **slow** scroll to the killed bet. Rehearse the distance — budget four seconds.

**ON SCREEN** "One-tap crypto checkout for add-ons" · **killed** · **ICE 4.0** · Critic verdict **KILL**, 70%
confidence. Then the surviving bet: "Skip the address re-confirm when nothing changed" · **ICE 8.0**.

**SAY**
> "Same theme, two bets. The exciting one was one-tap crypto checkout, and everybody assumed the payment step
> was the problem. She assumed it too. It disagreed. It said the drop-off is an address problem, not a
> payment-method problem, scored it a four, and killed it. And it promoted the boring one instead: stop asking
> for the address when nothing changed. Scored an eight. The reasoning is still on the record weeks later."

**WHY** This is the differentiator and it now lands *inside the story* instead of beside it. Both bets come off
the same theme, so killing one and promoting the other is a single argument, not two features. A chatbot
agrees with you. This disagreed, showed evidence, and the disagreement is still there.

**TRAPS** Reach it by URL so no tray opens. The killed bet is below the fold; the scroll is not optional.
Never press a number key. Verified today: crypto = `killed`, ICE 4.0; address = `now`, ICE 8.0, same theme.

---

## BEAT 4 — 03 Plan · 1:08 to 1:22

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=plan`
**DO** Hold on the spec **"Simplify checkout in the homeowner app"** (status approved).

**SAY**
> "The call becomes a spec, and the spec is not something she sat down and wrote. It is generated off the
> ruling, which came off the bet, which came off the eighteen signals. Nobody retyped anything, and nothing
> got lost between the evidence and the plan."

**WHY** This is the beat the tour skipped entirely, and it is the joint that makes the chain feel unbroken.
Discover → Decide → Build with no Plan in between is where a viewer stops believing it is one system.

**TRAPS** ⚠️ **Least-verified beat in this cut.** The PRD and its lineage edge (`opportunity → prd`,
`derived_from`) are confirmed in the database, but I have not seen `?stage=plan` render. **Walk this one
first.** If it does not paint cleanly, cut it and go straight to Build — the story survives, it just loses a
sentence.

---

## BEAT 5 — 05 Build · 1:22 to 1:42

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=build`
**DO** Let the files-changed rail sit in frame.

**ON SCREEN** `+17 −2 across 4 files` · `src/checkout/AddressStep.tsx`, `src/checkout/CheckoutFlow.tsx`,
`src/checkout/useAddressConfirm.ts`, `supabase/migrations/20260719_address_last_confirmed.sql` · a neutral
`HALTED` chip · "Pull request #1 is open."

**SAY**
> "Approved means built. Four files on their own branch. And look at the migration it wrote: track the address
> a homeowner last confirmed, so an unchanged address can skip the re-confirmation step. That is the NPS
> comment from two minutes ago, turned into a column. The change is on its own branch, the checks are green,
> and it stops there."

**WHY** The migration is the payoff for Beat 2. A viewer who heard "it asked me my address twice" now watches
that exact sentence become a database column. Nothing else in the video ties evidence to code that tightly.

**TRAPS**
- **Never click "Open the full workbench"** — it goes to `/build`, where a "No PR yet" tab contradicts the
  panel beside it.
- **Do not say "it opened this pull request."** PR #1 is real, open and green, but you opened it by hand.
  Say "the change is on its own branch, the checks are green, and it stops there."
- Keep the "Full execution log" fold **closed** — the trace behind it names a different PR number.
- **04 Design is cut.** `prototype_files` is empty in every workspace including the source. Do not open
  `?stage=design`, and do not hand-author HTML to rescue it: the line "shaped by decisions this company
  already made" over an artifact you typed is a false claim to an investor.

---

## BEAT 6 — 06 Ship · 1:42 to 1:52

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=ship`
**DO** One frame. No clicks.

**ON SCREEN** Releases newest first, real short commit shas. The checkout release is **`7bd0e14`**, production,
2026-07-11.

**SAY**
> "She approves, and it goes out. Production, with the commit on the record."

**WHY** Ten seconds. It exists to give the outcome beat something to be an outcome *of*.

**TRAPS** **Never click "Open the deploy"** — every URL points at `helio-labs.example.com` and will not
resolve. **Never say the word rollback**, even though the card does: that path is broken and you do not want
the follow-up question.

---

## BEAT 7 — 07 Learn, including the miss · 1:52 to 2:16

**GO TO** `https://supaprod.ai/brain?tab=learnings`
**DO** Scroll so the `100% VALIDATED · +0 ICE MOVED` stat strip is **off the top** of frame, and the two
checkout learnings sit together.

**ON SCREEN**
> **REVISE** — *"Mobile checkout improved but tablet saw a smaller lift; the confirmed-address layout is
> cramped on 7-inch screens."*
> directly above
> **VALIDATED** — *"Completed checkouts rose from 59 to 78 percent in the two weeks after the single
> confirmed-address step shipped."*

**SAY**
> "Completed checkouts went from fifty-nine percent to seventy-eight. That is the bet paying off. And directly
> above it, the same release on tablets barely moved, because the layout is cramped on a seven-inch screen.
> So the row above the win says needs revision. Nobody rounded it up. And here is the part I would not have
> believed: the tablet gap was already sitting in those eighteen signals at the start. Ask the last AI tool
> you bought to show you the row where it was wrong."

**WHY** Skeptics judge the error path. A demo that only wins looks like a demo. And in this cut the miss is
not a bolted-on humility beat — it is the same release, measured honestly, on the thread the viewer has been
following for two minutes.

**TRAPS**
- Say **"needs revision"**, never "mixed" — the chip reads `REVISE` (the DB verdict is `mixed`; confirm the
  chip on screen during your walk-through before you narrate this).
- Scroll the stat strip off the top: `+0 ICE MOVED` contradicts any compounding claim in the same frame.
- The tablet line is honest: `Funnel split by device: tablet lags phone by 11 points` is genuinely in the
  original signal set. **Say it was in the signals. Do not say the system flagged it or predicted it** — it
  did not, and that claim is not defensible.

---

## BEAT 8 — the loop closes · 2:16 to 2:36

**GO TO** `https://supaprod.ai/brain?tab=graph&focusKind=decision&focusId=60000000-0a00-4000-8000-000000000002`
**DO** Let the graph settle. Close on it. **Do not click a node.**

**ON SCREEN** The whole thread as one picture: theme → the two bets → the two rulings → the spec → the mission
→ the changeset → the release → both learnings, with the edge running back from the tablet learning into the
original bet.

**SAY**
> "And this is the part that compounds. Everything you just watched is one chain, and the product kept it:
> the evidence, the bet it killed, the bet it shipped, the code, the release, and both results including the
> one that went against it. That last line runs backwards, from the tablet miss into the bet that started it,
> because the miss reopened it. Next time somebody asks why we built this, that is the answer, and nobody has
> to go digging for it. Agents do the work. She answers for it. Supaprod is how she answers."

**WHY** This is the only frame in either cut where the entire thesis is visible at once, and it is the product
drawing it, not a slide. It closes the loop the Ask opened in Beat 1.

**TRAPS**
- ⚠️ **Verify this renders before you commit to it.** The graph is real and the edges are in the database,
  but I have not seen this canvas paint. If it is slow, noisy, or unreadable at video bitrate, switch the
  view toggle to **list** (the tree view), which shows the same chain as text and survives compression better.
- Focus only on `theme` / `opportunity` / `decision` / `prd` / `mission`. `changeset`, `deployment` and
  `learning` edges exist in the data but are **not** in the `ARTIFACT_KINDS` enum, so focusing on them may
  fail validation.
- Alternate focus if the decision node is a poor center:
  `?tab=graph&focusKind=theme&focusId=60000000-0002-4000-8000-000000000001`
- Do not claim bets re-ranked automatically. The Brain's own stats read `+0 ICE MOVED` and
  `0 RE-RANKED A PRIORITY`.

---

# PART C — the optional coda · +12 seconds

**Only if you want the budget-gate card, and only here, after the loop has closed.**

**GO TO** `https://supaprod.ai/approvals`, **Gates** tab (badge reads **1**, not 2).
**DO** Hold on the only card. **Rest the cursor on Approve and do not click.**

**SAY**
> "One more thing, and it is not about this bet. It is about all of them. This is an agent a dollar thirty-eight
> short of the budget it was given, and instead of quietly overspending it stopped and explained itself. Raise
> the cap and it finishes. Reject and it stands down with the branch intact. That line is not a setting."

**WHY** This is the strongest single frame in the product, but it belongs to the **SSO mission on Beacon**, a
different product from everything else in this video. Placed inside the thread it breaks the story. Placed
here, after the loop closes, it reads as the standing law rather than a detour — which is what it actually is.

**Cut it without hesitation if the video is running long.** The thread is the point; this is a bonus.

> Verified 2026-07-27: this gate's `expires_at` passed on 2026-07-26, but `getApprovalsQueue` filters on
> `status === "pending"` and never reads `expires_at`, and nothing sweeps pending → expired on a timer. It
> will render. Just never say "two gates."

---

# PART D — say this, not that

| Never say | Say | Why |
| --- | --- | --- |
| "twenty-seven" | **"twenty-three"** | 23 decisions, on screen in several places. |
| "mixed" | **"needs revision"** | The chip reads `REVISE`. |
| "clustered overnight" | **"it was waiting on Monday"** | The stamp reads `33D AGO`. |
| "it opened this pull request" | **"the change is on its own branch, checks green, and it stops there"** | PR #1 is real, but you opened it by hand. |
| "it predicted the tablet miss" | **"the tablet gap was already in the signals"** | True and checkable. The stronger claim is not. |
| "two gates are waiting" | **"this one stops"** | The badge reads 1. |
| "four bets re-ranked themselves" | *(say nothing)* | The Brain reads `+0 ICE MOVED`. |
| the word "rollback" | *(say nothing)* | That path is broken. |
| anything about a design mockup | *(cut entirely)* | `prototype_files` is empty everywhere. |

# PART E — cut, do not reopen

`04 Design` · `/build` itself · the rollback beat · the agent byline · the automatic re-ranking claim · the
receipt hover on the Ask · any live build run on camera · the `GATE · MEASURE` memory card (it never existed
in the product).

# PART F — if something breaks mid-take

**Stop, touch nothing, reload, re-take.** Nothing in this cut writes, so retakes cost only seconds. Do not
roll anything back on camera — that path is broken and would put "Rollback failed." on screen.

If narrating live keeps blowing takes: record **one continuous silent screen pass**, then read the script over
it in a single pass. No cuts, no titles, no music, so it stays within "one take, no editing."

# PART G — encode before uploading

100 MB over 3:00 is a 4.44 Mbps ceiling; a default capture at this window runs 10 to 25 Mbps.

```bash
ffmpeg -i take.mov -vf "scale=1920:-2" -c:v libx264 -preset slow -profile:v high \
  -pix_fmt yuv420p -b:v 3300k -maxrate 4200k -bufsize 8400k \
  -c:a aac -b:a 128k -ac 1 -movflags +faststart demo.mp4
```

About 55 MB at 2:30. H.264, not HEVC. **Scroll slowly on camera** — fast scrolling is what smears small text
at this bitrate.

---

### The pre-roll check for this cut

| # | Check | Status |
| --- | --- | --- |
| 1 | Avatar reads **Maya Ruiz** | ✅ verified in `profiles` |
| 2 | Both banners gone after reload | do by hand |
| 3 | `?stage=discover` shows the checkout theme | ✅ data verified · **confirm it renders** |
| 4 | `?stage=decide` shows crypto killed ICE 4.0 + address ICE 8.0 | ✅ data verified |
| 5 | `?stage=plan` shows the approved checkout spec | ⚠️ **least verified — walk this first** |
| 6 | `?stage=build` shows PR #1 and four paths | ✅ data verified |
| 7 | `?stage=ship` shows `7bd0e14` to production | ✅ data verified |
| 8 | `/brain?tab=learnings` shows REVISE above VALIDATED | ✅ data verified |
| 9 | The graph paints and is readable | ⚠️ **unverified — have the list view ready** |

**Any beat that disagrees with this file on the night: drop it and keep going.** The thread survives losing
Plan or the graph. It does not survive a frame that contradicts what you are saying over it.

---

## Related

- [`video-scripts.md`](./video-scripts.md) — the eleven-step tour, the verified fallback cut
- [`founder-video-script.md`](./founder-video-script.md) — the founder video (shot and uploaded 2026-07-26)
- [`../demo-story.md`](../demo-story.md) — the story spine
- [`../../operations/demo-credentials.md`](../../operations/demo-credentials.md) — `harbor@` and the investor logins
