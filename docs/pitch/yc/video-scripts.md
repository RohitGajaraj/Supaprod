# The demo video

> _Created: 2026-07-10 · Last updated: 2026-08-19_

> ## 🟡 PARKED 2026-08-19 by the founder. The 2:22 film stays on the YC form untouched.
>
> *"For now I am not focusing on recording a demo video because it was created by AI. Let's
> park that, but whatever you are understanding, you can keep it."* The finished cut plan is
> preserved below so it does not have to be re-derived when he picks it up.
>
> ### The correct cut: three whole frames out, landing at 1:35
>
> **My first plan was wrong and this is the generalisable lesson: I cut on CAPTION boundaries.**
> The film is composed as **thirteen whole frames at 30fps (4,263 frames)**, so a cut landing
> mid-frame makes the picture jump. Caption timings and frame boundaries are different units.
> **There is no combination that lands on 1:41** without re-recording a line.
>
> | Out | Frame | Window | Saves | Why it goes |
> | --- | --- | --- | --- | --- |
> | 1 | **F3** "you know the feeling" | 20.9&ndash;34.6 | 13.7s | Restates F2, which already closes the problem on *"that's the judgment gap."* Removing it puts the product on screen at **20.9s instead of 34.6s**, inside YC's direction that the product be visible in the first 30 seconds. |
> | 2 | **F8** "the route" | 70.2&ndash;93.0 | 22.8s | The voiced Plan/Design/Build/Ship tour. Largest block in the film, and **the one beat with no production rows behind it** (mission to changeset, changeset to deployment). What survives is Discover, Decide and Learn, which holds up if a partner signs in. The station strip still appears once, in F6. |
> | 3 | **F10** "it stops you" | 103.8&ndash;114.6 | 10.8s | Renders *"precedent applied: confidence cut"* when **the precedent pool has never held an outcome row**, and closes on *"it warns you"*, which is retired. F11 carries the same payoff in the form that is true. |
>
> **Total 47.3s out, landing at 94.8s (1:35).** Nearest whole-frame alternative is 1:46 (F10 back
> in). The *"it disagrees with you"* beat survives intact, which matters because baseline calls
> that layer the one nobody else sells.
>
> **Mechanics: one re-render.** Delete the three frame blocks from `STORYBOARD.md` and
> `index.html`; leave the frame HTML on disk so nothing is overwritten. Transitions re-pair
> cleanly (F4 keeps zoom-through, now from F2; F9 from F7; F11 from F9). **New file, master
> untouched** — the founder compares side by side. At current bitrate it lands near 62MB against
> YC's 100MB cap. **Probe for an audio stream before sending any render**: `video-v15.mp4` is the
> silent picture and carries a HIGHER version number than the master.

---

# The demo video — the click-by-click walkthrough

> **STATUS 2026-07-27 20:55 IST. RE-VERIFIED against the live database before the shoot. Two beats are cut.**
> The 2026-07-26 version below was verified by eye on the running site; today every beat was re-checked by
> querying production directly (as `harbor@` through RLS, and again with service-role to see the source
> workspace). **Nine of the eleven steps are confirmed good. Steps 6 and 11 do not survive.** Shoot the nine.
>
> **The founder video lives in [`founder-video-script.md`](./founder-video-script.md).** This file is only the
> demo video. Part 1 of the old version of this file is superseded by that one.
>
> Story spine: [`../demo-story.md`](../demo-story.md). When it and this file disagree on what STORY is told,
> demo-story wins. This file wins on what is ON SCREEN, because it is the only one written against the app as
> it renders today.

## What the database says today, so you know what you are looking at

The 2026-07-25 clone migration (`20260725140000_...:110`) copies parent tables but omits their children:
`studio_changes` and `prototype_files` are both absent from its `v_tables` array. That one omission is why
Build and Design both broke. Only one of the two was really repaired.

| Beat | Verified 2026-07-27 | Verdict |
| --- | --- | --- |
| **05 Build** | 4 rows in `studio_changes` with real `base_content`/`new_content`, changeset `status='pr_open'`, `pr_number=1`, repo `RohitGajaraj/relay-homeowner-app` | ✅ **SHOOT IT** |
| **04 Design** | `prototype_files` = **0 rows** — not just in harbor, in *every* Helio-derived workspace including the `helio-labs` source. Nothing to clone from. | ❌ **CUT** |
| **Gates badge** | Gates = pending `agent_approvals` (1) + pending `assumption_challenges` (0). Badge reads **1**, not 2. | ⚠️ **do not say "two"** |
| **The close (11)** | `memory_candidates` render with `filterBucket:"memory"` and chip `MEMORY` — the **Memory** tab, not Gates. No row anywhere matches the scripted `GATE · MEASURE` text. | ❌ **REWRITTEN — see Step 11** |

Everything the narration counts on is confirmed: `decisions=23`, `signals=25`, `meetings=6`, `learnings=5`,
`deployments=4`, and harbor holds **4,790 credits**, so rehearsals and the Ask are safe.

---

# PART A — the sixty minutes before you roll

Do these in order. Nothing here is optional.

### A1 · Confirm the portal still takes an upload

Open the application portal and check both video fields still accept a new file. Do **not** delete the old
attachments; they stay until the new ones replace them. Everything below assumes this passed.

### A2 · Set the window to 1920 x 1080

**Not 1440.** At 1440 the Spine strip across the top clips after `06 Ship` and `07 Learn` falls off the right
edge, which destroys the one frame that proves the whole lifecycle. Do not fix it with browser zoom either:
zooming out shrinks 11px mono text and it smears at the bitrate the 100 MB cap forces.

### A3 · Fresh browser, nothing else running

- A clean Chrome profile. One tab. No bookmarks bar.
- **Quit Slack and Mail completely.** Focus mode does not stop in-browser or in-page notifications.
- Never open the account menu on camera. It prints `harbor@supaprod.ai`.

### A4 · Sign in and clear the two banners

Sign in at `supaprod.ai/login` as `harbor@supaprod.ai` / `Supaprod!Harbor2026`.

1. Confirm the avatar reads **Maya Ruiz**. If it says anything else, stop and tell me.
2. Dismiss the "New here? Take a 20-second tour" card with **Not now**.
3. Go to `/brain` and dismiss the upgrade banner with its **x**.
4. Reload. Confirm both stay gone.

### A5 · Rehearse the whole path three times, silently

**Rehearsals are free and unlimited.** Nothing in this cut writes anything. The only cost is a few credits on
the Ask, against 4,867 remaining. Walk the eleven steps below with no narration until the order is automatic,
then walk them twice more while talking.

### A6 · Audio check

Wired earbud mic or the built-in, never AirPods. Record ten seconds, play it back, then start.

---

# PART B — the three laws

These are not style preferences. Each one prevents a specific thing that will ruin the take.

### Law 1 · Navigate by URL only. Never press a number key.

The approvals tray legend reads `1 Approve · 3 Decline · H Snooze · J K Move`. **Pressing `1` approves and
dispatches a real agent run, on camera, irreversibly.** Clicking a stage chip also opens a tray that covers
the canvas. So type URLs. `Escape` closes a tray cleanly if one opens by accident.

### Law 2 · Compose every room shot from the Canvas leftward

The left rail's first frame carries `[auto] Investigate the "Unsafe Automation on Sensitive Support Topics"
cluster` with the debug text `frequency 1, severity 5` and live Approve buttons. Crop it out by framing from
the Canvas across. Those three seconds are the most damaging in the app if they are centred.

### Law 3 · Never click these

**Approve · Reject · Roll back · Refresh · Send to Build · Challenge · Delete · any number key.**
**Never open:** `/build`, `/today`, `/engine-room`, the Proposals tab, or the account menu.

---

# PART C — the nine steps you are shooting

**Steps 6 and 11-as-written are cut.** Nine beats survive: 1, 2, 3, 4, 5, 7, 8, 9, 10, plus the rewritten
close. Total runtime about **2:30**. Ceiling is 3:00.

Cutting Step 6 pulls every later timestamp about six seconds earlier. Do not chase the old clock — the
timings below are the pre-cut ones and are there for pacing, not for hitting marks.

---

## STEP 1 — the room at rest · 0:00 to 0:20

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay`
**DO** Nothing. Do not touch anything for the first four seconds. Let it sit.

**ON SCREEN** The headline **"23 calls wait on you."** Under it: `3 of 7 stages done · 3 shipped · 23
decisions in memory · 23 waiting on you`. A bylined briefing. The Spine across the top.

**SAY**
> "This is Maya. She runs a consumer app. Forty-one thousand users, checkout conversion, too many
> notifications. Last month her VP asked her why they built the thing they shipped in March. She spent a
> morning digging and still could not really answer. Every product person watching this has had that morning."

**WHY** You are introducing a person, not a product. Nothing gets explained until the viewer is nodding. The
screen just sits there being calm while you do it, which is itself the argument: this is what her Monday looks
like now.

**TRAPS** Say **twenty-three**, never twenty-seven. The number 23 is on screen in five places at once and a
mismatch is caught inside ten seconds. Do not rest on the briefing's evidence list: it repeats "Signals
clustered into themes 19 hours ago" three times, and the same frame says both "1 agent run is in flight now"
and "Nothing running". Read the summary and the `19 at Decide, 2 at Build, 2 at Learn` line, then move.

---

## STEP 2 — the whole lifecycle in one frame · 0:20 to 0:32

**GO TO** Same page, no navigation.
**DO** Let the Canvas body list **"THE LOOP, STAGE BY STAGE"** sit in frame. **Count seven rows before you
roll.**

**ON SCREEN** `01 Discover ✓ · 02 Decide your call · 03 Plan ✓ · 04 Design · 05 Build your call · 06 Ship ✓ ·
07 Learn your call`

**SAY**
> "This is what she opens on Monday. Twenty-three calls in one queue, instead of twenty-three tabs she has to
> go find. And the whole loop is on one screen: what is done, what shipped, and what is waiting on her."

**WHY** This is the single most important frame in the video and it costs twelve seconds. It proves the
product covers the entire lifecycle **without you touring it.** Everything after this follows one bet through
those stages, so the viewer never needs a tour.

**TRAPS** Use the **body list**, not the strip across the top. The top strip clips at anything under 1920 wide.

---

## STEP 3 — the question nobody can answer · 0:32 to 0:50

**GO TO** Same page.
**DO** First, let the **PRODUCT MEMORY** line sit in frame for two seconds: `4 chat threads · 25 signals ·
6 meetings · 23 decisions · 5 learnings · 7 docs`, with `Ask reads all of this when it answers you`.
Then click the ask box and type, exactly:

> `Why did we decide to simplify the checkout in the homeowner app?`

Let the answer render. **Do not hover the citation markers.**

**ON SCREEN** The answer opens *"Maya, your recent work has validated this decision through several key
steps..."*

**SAY**
> "So she asks it. It reads the whole record: the threads, the signals, the meetings, the decisions, the
> outcomes. And it answers her by name, out of her own workspace. That is the question nobody could answer
> before. It takes seconds now."

**WHY** This is the wedge. It is the reason a person keeps using the product, and it lands inside the first
minute.

**TRAPS** The `[n]` citation markers are 9px and **inert** — no tooltip, no panel, no navigation. Hovering
them shows the viewer that nothing happens. The PRODUCT MEMORY line is the evidence for "it reads everything"
and it survives video compression far better than a 9px glyph.

---

## STEP 4 — 01 Discover · 0:50 to 1:02

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=discover`
**DO** Let it hold. Do not click into anything.

**SAY**
> "She did not find this herself. She was in planning all week. Support tickets, App Store reviews, a funnel
> report, two customer interviews. None of them conclusive alone, none in the same place. They were read and
> grouped for her, and it was waiting on Monday."

**WHY** This establishes that the machine did work while she was busy. Twelve seconds, because it is the
weakest verified beat and the time is needed elsewhere.

**TRAPS** Do **not** say "overnight" — the theme's freshness stamp reads `33D AGO` and contradicts you in
frame. Say "it was waiting on Monday". Do not say agents signed each line: **no per-line byline exists.**
Do not go to the standalone `/discover` route; it swaps the whole app chrome to a different navigation rail.

---

## STEP 5 — 02 Decide, the machine argues back · 1:02 to 1:22

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=decide`
**DO** One **slow** scroll down to bet **#6**. Budget four seconds for the scroll and rehearse the distance.

**ON SCREEN** "One-tap crypto checkout for add-ons" · status killed · **ICE 4.0** · Critic verdict **KILL**,
70% confidence · *"The checkout drop-off is an address problem, not a payment-method problem. Killed."*

**SAY**
> "Everyone assumed the payment step was broken. She assumed it too. It disagreed. People were dropping at a
> step that asked them to confirm an address they had already given. And when the exciting bet came up,
> one-tap crypto checkout, it argued that one down and killed it. Scored a four. The reasoning is still on
> the record."

**WHY** This is the differentiator. A chatbot agrees with you. This disagreed, showed its evidence, and the
disagreement is still there weeks later. It is also the safest beat in the video: zero writes, nothing to
break.

**TRAPS** Reach it by URL so no tray opens. The bet is below the fold, so the scroll is not optional.

---

## STEP 6 — 04 Design · ❌ CUT, DO NOT SHOOT

**Do not open `?stage=design` on camera.**

`prototype_files` holds **zero rows for every Helio-derived workspace**, including the `helio-labs` source the
others are cloned from. The only prototype with real content anywhere in production belongs to a different
workspace and a different product story (`explore-9e7958c5`, "Bank-link drop-off at activation"). There is
nothing to clone and nothing to show: the device frame paints the white void again.

**Do not hand-author HTML into `prototype_files` to rescue this beat.** The narration for it was *"what comes
back is shaped by decisions this company already made"* — over an artifact you typed, that sentence is a
false claim to an investor. If you want this beat back, generate a prototype through the product as `harbor@`
so the screen is genuinely the product's output, then re-time the cut. That is a separate sitting, not a
pre-roll fix.

**Cost of cutting it:** six seconds and one sentence. The design story survives in the Build beat, where the
migration comment traces the code back to the evidence.

---

## STEP 7 — 05 Build, the code is real · 1:28 to 1:42

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=build`
**DO** Let the files-changed rail sit in frame.

**ON SCREEN** `Files changed` · **`+17 −2 across 4 files`** · `src/checkout/AddressStep.tsx`,
`src/checkout/CheckoutFlow.tsx`, `src/checkout/useAddressConfirm.ts`,
`supabase/migrations/20260719_address_last_confirmed.sql` · a neutral `HALTED` chip · *"Pull request open;
checks reporting."* · **"Pull request #1 is open. Review and merge once the checks are green."**

**SAY**
> "Approved means built. Four files, a real branch, checks green. And look at the migration it wrote: track
> the address a homeowner last confirmed, so an unchanged address can skip the re-confirmation step. That is
> her decision, in code."

**WHY** This is where "ship it" stops being a claim. The migration's own comment names the 34% drop, so the
code visibly traces back to the evidence from Step 4.

**TRAPS**
- **Never click "Open the full workbench"** at the bottom of the face. That button goes to `/build`, which is
  where a "No PR yet" tab contradicts the panel beside it.
- **Say "the change is on its own branch, the checks are green, and it stops there."** Do **not** say "it
  opened this pull request." PR #1 is genuinely open, mergeable and green, but you opened it by hand
  yesterday. The product opened real pull requests in your sandbox in July, not this one.
- Keep the "Full execution log" fold **closed**. The trace behind it names a different PR number.

---

## STEP 8 — the human gate · 1:42 to 2:00

**GO TO** `https://supaprod.ai/approvals`, then click the **Gates** tab. **It reads `Gates 1`, not 2.**
**DO** Hold on the **only** card. Let the viewer read it. **Rest the cursor on Approve and do not click.**

> **Verified 2026-07-27.** This card is real and it will render. Its `expires_at` passed on 2026-07-26 02:20,
> but `getApprovalsQueue` filters on `status === "pending"` and never reads `expires_at`, so an elapsed expiry
> does not remove it from the queue. Nothing in the codebase sweeps `pending → expired` on a timer. It is
> safe. Just never say "two gates" — the badge says 1, and the second card you remember is on the Memory tab.

**ON SCREEN**, verbatim:
> `GATE · CHIEF OF STAFF · Ship SSO login for Beacon`
> *"I am 1.38 dollars under the cap with four steps left, so I cannot finish inside the budget you set. The
> overage is honest work, not a loop: the staging tenant rotated its signing cert mid mission and the parser
> had to be rebuilt against the new metadata. Raise the cap to 65 dollars and I finish, or reject and I halt
> cleanly at step 6 with the branch intact."*
> `Partly reversible · Halt the mission before the dispatched runs finish.`
> `Approve · runs the action` / `Reject · agent stands down`

**SAY**
> "Then they stop. This one is a dollar thirty-eight short of the budget she set it, and instead of quietly
> overspending it halts and explains itself: the staging cert rotated mid-mission, the parser had to be
> rebuilt, here is what it cost. Raise the cap and it finishes. Reject and it stands down cleanly, with the
> branch intact. That line is not a setting. Nothing crosses it."

**WHY** This is the strongest single frame in the product and it writes your narration for you. An agent
explaining why it went over budget, in its own voice, with the reversibility spelled out, is the whole
"agentic but accountable" thesis in one card.

**TRAPS** Click only the **Gates** tab. The default All tab is full of `[auto]` debug cards. Never open
Proposals. Cursor rests on Approve, never presses.

---

## STEP 9 — 06 Ship · 2:00 to 2:06

**GO TO** `https://supaprod.ai/helio-labs-harbor/relay?stage=ship`
**DO** One frame. No clicks.

**ON SCREEN** Releases newest first, with real short commit shas, and the line *"Live in production. Rollback
stays one click."*

**SAY**
> "She approves, and it goes out. Staging, then production, with the commit on the record."

**WHY** Six seconds closes the build half of the loop so the outcome beat has something to be an outcome *of*.

**TRAPS** **Never click "Open the deploy"** — every URL points at `helio-labs.example.com` and will not
resolve. And **never say the word rollback**, even though the card does: the rollback path is broken and you
do not want to invite the question.

---

## STEP 10 — 07 Learn, the honest miss · 2:06 to 2:22

**GO TO** `https://supaprod.ai/brain?tab=learnings`
**DO** Scroll so the `100% VALIDATED · +0 ICE MOVED` stat strip is **off the top** of the frame, and two rows
sit together. One frame, no clicks, no drilling.

**ON SCREEN**
> **REVISE** — *"Mobile checkout improved but tablet saw a smaller lift; the confirmed-address layout is
> cramped on 7-inch screens. A follow-up spec is queued."*
> directly above
> **VALIDATED** — *"Completed checkouts rose from 59 to 78 percent in the two weeks after the single
> confirmed-address step shipped."*

**SAY**
> "Completed checkouts went from fifty-nine percent to seventy-eight. And on tablets it barely moved, because
> the layout is cramped on a seven-inch screen. So the row above the win says needs revision. Nobody rounded
> it up. Ask the last AI tool you bought to show you that row."

**WHY** `demo-story.md` calls this the most persuasive twenty seconds available and forbids cutting it.
Skeptics judge the error path. A demo that only wins looks like a demo.

**TRAPS** Say **"needs revision"**, never "mixed" — the chip on screen reads `REVISE`. Scroll the stat strip
off the top: `+0 ICE MOVED` contradicts any compounding claim if it is in the same frame. Make sure you
dismissed the upgrade banner in step A4.

---

## STEP 11 — the compounding close · 2:16 to 2:30 · ⚠️ REWRITTEN 2026-07-27

> **The card this step used to describe does not exist.** There is no `GATE · MEASURE · Raises a memory's
> importance` anywhere in the product. `memory_candidates` are built with `filterBucket: "memory"` and
> `kind: "MEMORY"` (`approvals-queue.functions.ts:423-438`), so they land on the **Memory** tab with a
> `MEMORY` chip, and their consequence lines are fixed strings. The old narration quoted a card that was
> never on screen. **Use the real one below** — it makes the same point and it is actually there.

**GO TO** `https://supaprod.ai/approvals`, then the **Memory** tab.
**DO** Hold on the kill-criterion card. Close on it. **Do not click.**

**ON SCREEN**, verbatim:
> `MEMORY`
> *"The annual pricing bet needs a kill criterion: revert if annual conversion stays under 8 percent after
> the trial"*
> `importance 3/5 · from user`
> `Approve · saves to workspace memory` / `Reject · nothing saved`

**SAY**
> "And it asks her what is worth keeping. This one is a kill criterion: if annual conversion stays under eight
> percent after the trial, revert. If she approves it, it goes into the workspace memory the Ask reads from,
> so every future call on that bet carries the condition without anyone having to remember to add it. That is
> the part that compounds. Agents do the work. She answers for it. Supaprod is how she answers."

**WHY** It closes the loop the video opened with. Step 3 showed the Ask reading `23 decisions · 5 learnings`;
this shows the next entry being *proposed* rather than assumed. The promise is falsifiable and true: approving
writes to workspace memory, and workspace memory is what the Ask reads.

**TRAPS**
- The chip reads **`MEMORY`**, not `GATE`. Do not call it a gate on camera.
- The line reads **`from user`**, not "the agent noticed". Do not narrate this as the machine catching itself
  — say she is being asked what to keep. The second card on this tab (`Helio prefers concise release notes`,
  `from agent`) is the agent-authored one, and it is far too thin to close on.
- Do not claim bets re-ranked automatically. The Outcomes header's stats say `+0 ICE MOVED` and
  `0 RE-RANKED A PRIORITY`. This card makes the compounding point without that claim.

---

# PART D — say this, not that

| Never say | Say | Why |
| --- | --- | --- |
| "twenty-seven calls" | **"twenty-three"** | On screen in five places at once. |
| "mixed" | **"needs revision"** | The chip reads `REVISE`. There is no "mixed" state. |
| "clustered overnight" | **"it was waiting on Monday"** | The freshness stamp reads `33D AGO`. |
| "signed by the agent that did it" | *(cut entirely)* | No per-line byline is implemented. |
| "it opened this pull request" | **"the change is on its own branch, checks green, and it stops there"** | PR #1 is real and green, but you opened it by hand. |
| "four other bets re-ranked themselves" | *(use the memory gate card)* | The screen says `+0 ICE MOVED`. |
| "one keystroke rolls it back" | *(cut entirely)* | No rollback keystroke exists; the table is missing in production. |
| the word "rollback" at all | *(say nothing)* | The card says it. You do not want the follow-up question. |
| "two gates are waiting" | **"this one stops"** | The Gates badge reads **1**. Added 2026-07-27. |
| anything about a design mockup | *(cut entirely)* | `prototype_files` is empty in every workspace. Added 2026-07-27. |
| "it asks to promote a memory" | **"it asks her what is worth keeping"** | The chip reads `MEMORY` and the row says `from user`. Added 2026-07-27. |

# PART E — still cut, do not reopen

`/build` itself · the merge-gate revival (its arguments name a PR that 404s) · the rollback beat · the agent
byline · the automatic re-ranking claim · the evidence hover on the ask · **any live build run on camera**
(38% of builder runs since 2026-07-08 finished clean, median 215 seconds, no graceful abort) ·
**the 04 Design beat** (added 2026-07-27, `prototype_files` empty everywhere) · **the `GATE · MEASURE` card**
(added 2026-07-27, it never existed in the product).

# PART F — if something breaks mid-take

**Stop, touch nothing, reload, re-take.** Do **not** follow `demo-story.md` line 218 and roll it back on
camera: the rollback is itself broken and would put "Rollback failed." on screen. That ruling was written for
the 8-minute live walkthrough, not a recorded video. Retakes cost seconds because nothing in this cut writes.

If narrating live keeps blowing takes: record **one continuous silent screen pass**, then read the script over
it in a single pass. No cuts, no titles, no music, so it stays within "one take, no editing".

# PART G — encode before uploading

100 MB over 3:00 is a 4.44 Mbps ceiling, and a default capture at this window runs 10 to 25 Mbps.

```
ffmpeg -i take.mov -vf "scale=1920:-2" -c:v libx264 -preset slow -profile:v high \
  -pix_fmt yuv420p -b:v 3300k -maxrate 4200k -bufsize 8400k \
  -c:a aac -b:a 128k -ac 1 -movflags +faststart demo.mp4
```

About 58 MB at 2:36. H.264, not HEVC. **Scroll slowly on camera** — fast scrolling is what smears small text
at this bitrate.

---

### The sixty-second pre-roll check — re-verified 2026-07-27 20:55 IST

| # | Check | Expected | Verified today |
| --- | --- | --- | --- |
| 1 | `?stage=build` | "Pull request #1 is open" + four file paths | ✅ 4 rows, real content, `pr_open` |
| 2 | Gates tab badge | **1** (not 2) | ✅ 1 pending tool-call gate, 0 challenges |
| 3 | Memory tab | the kill-criterion card is there | ✅ 2 pending candidates |
| 4 | Avatar | **Maya Ruiz** | ✅ `profiles.full_name` |
| 5 | Both banners gone after a reload | — | do this by hand (A4) |
| 6 | `?stage=design` | ~~real screen~~ | ❌ **CUT — do not open** |

Only #5 is still unverified, because it is browser-local state and no query can see it. Do A4 and confirm it
yourself.

**If any one of these disagrees with this file on the day, drop that beat and shoot without it.** A missing
beat costs you a sentence. A broken beat costs you the claim.
