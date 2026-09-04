# The demo video — one bet, all the way through

> _Created: 2026-07-27 · Last updated: 2026-08-11_

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

**TRAPS**
- ⚠️ **The headline reads "21 calls wait on you", not 23** (read off the live room 2026-07-27: 18 at Decide,
  1 at Build, 2 at Learn). Say **twenty-one**. The separate "23 decisions in memory" stat IS still 23, so both
  numbers are on screen at once and mixing them up is the easiest mistake in the video.
- Counts verified today: signals 25, meetings 6, decisions 23, learnings 5.
- Do not read the briefing's evidence list aloud — it repeats itself and contradicts its own "nothing running"
  line.
- **The Ask answer renders in the LEFT RAIL, not the canvas.** As of the 2026-07-27 fix it scrolls itself into
  view on send; you do not need to touch the scroll wheel. If you are ever on an older build, scroll the left
  rail down or the answer is invisible.

---

## BEAT 2 — 01 Discover · 0:22 to 0:42

> ⚠️ **REWRITTEN TWICE on 2026-07-27, founder ruling: use the evidence desk.** The first draft described a
> theme view that does not exist on `?stage=discover` (that face is `01 Discover · Evidence`, a flat feed with
> no theme, no severity, no frequency, and unclickable rows). The desk at **`/discover`** is the surface that
> actually tells this story, and it was crashing on every cold load until tonight's `SignalFeed` fix. It is
> now live and verified. **This is the one beat that uses a different app shell** (its own left nav, `THE LOOP
> 1-7`); every other beat is in the Mission Control room. That seam is the price of showing the clustering,
> and the founder judged it worth paying.

**GO TO** `https://supaprod.ai/discover`
**DO** Three moves, slowly. **First** hold on the headline. **Second** let one or two signal cards sit in
frame so their citation line shows. **Third** scroll to **"Clustered into bets"** and land on rank **#4**.

**ON SCREEN**, verified live 2026-07-27:
> **"Raw signal in, ranked bets out."**
> *"The evidence desk: every opportunity ranked and cited back to the signals behind it. The reasoning engine
> clusters raw signals into ranked, cited bets, so you decide what matters instead of sifting noise."*
>
> Signal cards, each with its source chip, freshness, the verbatim quote, then a citation line reading
> `→ THEME NAME · N SIGNALS` and a trace id like `SIG·DC47C1`. Under the list:
> **"Every quote is verbatim and keeps its source. Nothing here is a summary."**
>
> Then **"Clustered into bets"** · `8 CLUSTERED` · source chips `GITHUB 3 · SALES-CALL 2 · ANALYTICS 1 ·
> APP-STORE 1 · CHURN-SURVEY 1 · INTERVIEW 1 · NPS 1 · SLACK 1 · SUPPORT 1` · the ranked list:
> `#1` Support answers the same three homeowner questions every week · 40 signals
> `#2` Homeowners cannot tell a real outage from a firmware reboot · 31 signals
> `#3` Meter firmware drift shows yesterday production as today · 12 signals
> `#4` **Checkout and notification friction in the homeowner app · 9 signals · 8 sources**

**SAY**
> "It starts here, and she did not do this part. Raw signal in, ranked bets out. Every one of these is a
> verbatim quote that keeps its source, and each one carries the line showing which theme it rolled into. It
> reads them continuously and clusters them by corroboration. And this is the one she is going to act on:
> checkout and notification friction, nine signals behind it, from eight different sources. Support tickets,
> an App Store review, NPS, a sales call, an interview, Slack, a funnel report. Not one of them is conclusive
> alone. Together they are a bet, and it was waiting for her on Monday."

**WHY** This is the root of the tree and the only frame that shows the machine doing the clustering rather
than a person doing it. "Nine signals, eight sources" is the corroboration claim in the product's own numbers,
and it is what makes the funnel figure in Beat 4's assumption and the address column in Beat 5 land as
consequences rather than assertions.

**TRAPS**
- ⛔ **Never click the `⋯` "Theme actions" menu.** It holds promote, draft spec, and frame-the-bet, and all
  three dispatch real work. Same for **"Ask Supaprod to investigate"** on a signal card: it starts a mission.
  This beat is look-only.
- **Our theme is ranked #4, not #1.** Ranks 1 to 3 are bigger themes on other products (40, 31 and 12
  signals). **Do not call this the top theme or the biggest one.** Say "this is the one she is going to act
  on". If a viewer sees you claim #1 while `#4` is on screen, the whole video loses its footing.
- **Ranks 1 to 3 read `0 sources`** while ours reads `8 sources`. Do not point at the others or invite the
  comparison; frame so #4 leads.
- **Keep "Market watch" out of frame.** It sits directly below the themes and is completely empty
  (`WEEKLY BRIEFS 0`, `TRACKED ENTITIES 0`). End the scroll on #4.
- **This beat has different chrome.** Cut into it and back out cleanly; do not pan around its left nav.
- Do **not** say "overnight" — freshness stamps read in days. Say "it was waiting on Monday".
- Do not claim per-line agent bylines; none exist.
- The top signal cards are `github`-sourced and off-story (Tier-1 routing, bank-link drop-off). They are
  fine as texture while you talk about verbatim quotes and citations, but **do not read them aloud**.

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
**DO** ⚠️ **The page opens on the WRONG spec.** Two tabs sit above the spec body and the *notification digest*
one is selected by default. **Click the second tab, "Simplify checkout in the homeowner app."** Then hold.

**ON SCREEN**, verified live 2026-07-27:
> `03 Plan · Spec · ✓ Approved` · `SPEC · approved`
> **Requirements (4)** — R1 skip the confirmation when the address matches the last order … R4 *"Every skipped
> confirmation stays reversible: the homeowner can edit the address inline."*
> **Assumptions on watch (3)** — A1 *"The 34 percent drop is the redundant confirm, not the price. Watching
> checkout completion."*
> **Outcome contract** — *"Landed means: within 30 days of ship, checkout completion rises from 66 percent to
> 75 percent or better. Check-by date: August 20."*
> **Task graph** — T1..T5

**SAY**
> "The call becomes a spec, and she did not sit down and write it. Look at what it carries. The assumption is
> written down as something to watch: the thirty-four percent drop is the redundant confirm, not the price.
> And it commits to a number before anybody builds anything: completion goes to seventy-five percent or
> better, checked by August the twentieth. That is a spec you can be wrong against."

**WHY** This is the beat the tour skipped entirely, and it turns out to be the strongest frame in the video.
The outcome contract is the thing no competitor films: the spec names a falsifiable bar and a date **before**
the code exists, which is what makes the outcome in Beat 7 mean anything. Discover → Decide → Build with no
Plan in between is also where a viewer stops believing it is one system.

**TRAPS**
- **The tab click is mandatory.** Default is the digest spec, which is a different bet and breaks the thread.
- **Do not read both baselines aloud.** The contract says completion rises "from 66 percent", and Beat 7's
  learning says it "rose from 59 to 78 percent". Two different baselines for the same metric, and reading them
  in the same breath invites the question. Say the **target** here ("seventy-five or better") and the
  **result** in Beat 7 ("seventy-eight"). Both are true, and 78 clears 75.
- Do not click "Design this" or "Build this feature" at the bottom of the spec. Both dispatch real work.

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
**DO** Two moves, verified live 2026-07-27. **First** let the 3D constellation settle for about three seconds
(it is genuinely striking, and it is the only frame that shows the whole workspace at once). **Then click the
`LIST` tab** in the "Graph view" toggle and close on that. **Do not click a node.**

**ON SCREEN** in LIST, verbatim:
> `16 nodes · 8 depth · 1.7 avg branching`
> **DECISION** — One confirmed address step lifts completed checkouts
> **LEARNING** — *"The ruling predicted a lift from removing the second address step. Completed checkouts went
> from 59 to 78 percent, so the ruling holds."*
> **LEARNING** — *"The ruling assumed the address step hurt every device the same way. Tablet checkouts moved
> 4 points against 21 on phones, so the ruling is only partly right and the record says so."*
> **PRD** — Simplify checkout in the homeowner app · *"The approved ruling was written up as the checkout PRD.
> Every requirement in it traces back to the one confirmed address step."*

**SAY**
> "And this is the part that compounds. Everything you just watched is one chain, and the product kept it:
> the evidence, the bet it killed, the bet it shipped, the code, the release, and both results including the
> one that went against it. That last line runs backwards, from the tablet miss into the bet that started it,
> because the miss reopened it. Next time somebody asks why we built this, that is the answer, and nobody has
> to go digging for it. Agents do the work. She answers for it. Supaprod is how she answers."

**WHY** This is the only frame in either cut where the entire thesis is visible at once, and it is the product
drawing it, not a slide. It closes the loop the Ask opened in Beat 1.

**TRAPS**
- **Close on LIST, not on the 3D universe.** The constellation is WebGL and its labels are drawn into the
  canvas, so at the 3.3 Mbps the 100 MB cap forces they smear into noise. The LIST text is what carries the
  argument, and it survives compression. Use the 3D purely as a three-second establishing shot.
- **The learnings show a title of `Untitled`** in this view. Do not point at or read the titles; read the
  bodies, which are the good part.
- **Dismiss the upgrade banner first.** It is back on `/brain` ("On Star, your decision memory fades after 30
  days"), and it sits directly above this panel. A4 covers it; confirm it is gone after a reload.
- `+0 ICE MOVED` and `100% VALIDATED` sit in the Brain header above the panel. Frame the LIST panel so the
  stat strip is off the top, and never claim bets re-ranked automatically.
- Focus only on `theme` / `opportunity` / `decision` / `prd` / `mission`. `changeset`, `deployment` and
  `learning` edges exist in the data but are **not** in the `ARTIFACT_KINDS` enum, so focusing on them may
  fail validation.
- Alternate focus if the decision node is a poor center:
  `?tab=graph&focusKind=theme&focusId=60000000-0002-4000-8000-000000000001`

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
evidence hover on the Ask · any live build run on camera · the `GATE · MEASURE` memory card (it never existed
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

Re-verified end to end on the live site as `harbor@` on 2026-07-27 at 22:10 IST.

| # | Check | Status |
| --- | --- | --- |
| 1 | Avatar reads **Maya Ruiz** | ✅ verified in `profiles` |
| 2 | The Ask answers AND scrolls itself into view | ✅ **fixed and verified live tonight** |
| 3 | Headline reads **21 calls**, memory stat reads **23 decisions** | ✅ read off the live room |
| 3b | `/discover` loads (was crashing) and shows `#4 · 9 signals · 8 sources` | ✅ **fixed, published and verified tonight** |
| 4 | `?stage=decide` shows crypto killed ICE 4.0 + address ICE 8.0 | ✅ data verified |
| 5 | `?stage=plan` → **click the checkout tab** → contract + assumptions | ✅ **verified rendering tonight** |
| 6 | `?stage=build` shows PR #1 and four paths | ✅ data verified |
| 7 | `?stage=ship` shows `7bd0e14` to production | ✅ data verified |
| 8 | `/brain?tab=learnings` shows REVISE above VALIDATED | ✅ data verified |
| 9 | Graph LIST view shows the 16-node chain | ✅ **verified rendering tonight** |
| 10 | Both banners gone after a reload | ⚠️ **do this by hand — the `/brain` one is back** |

Only #10 is unverified, because it is browser-local state no query can see. Do A4 and confirm it yourself.

**Any beat that disagrees with this file on the night: drop it and keep going.** The thread survives losing
Plan or the graph. It does not survive a frame that contradicts what you are saying over it.

---

## Related

- [`video-scripts.md`](./video-scripts.md) — the eleven-step tour, the verified fallback cut
- [`founder-video-script.md`](./founder-video-script.md) — the founder video (shot and uploaded 2026-07-26)
- [`../demo-story.md`](../demo-story.md) — the story spine
- [`../../operations/demo-credentials.md`](../../operations/demo-credentials.md) — `harbor@` and the investor logins
