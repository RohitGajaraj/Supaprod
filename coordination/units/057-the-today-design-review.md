# Unit 057 · design review: Today (backlog item 12, R-12)

LANE 1 · 2026-08-25 · **no code changed in this unit.** Item 12 orders the five
questions answered BEFORE anything changes, and R-15 freezes
`_authenticated.today.tsx` until the founder compares it against `/start`
(unit 055) and promotes. This review therefore governs the replacement and the
promotion-time edits; every verdict below names when it executes.

Surface reviewed: `src/routes/_authenticated.today.tsx` (1,732 lines), the
post-auth landing (`login.tsx:26`, five inbound redirects, AppFrame rail row 1,
onboarding exit).

## The five questions

### 1. Who is here, and what did they come to do?

The operator opening their laptop in the morning, asking **"what needs me, what
moved while I was away, and where do I start?"** If the answer needs more than
one sentence, it is two surfaces — and today it is three: a triage inbox
(decide what waits on you), a briefing board (read what happened), and an entry
point (start something). The review's whole finding is that these separate.

### 2. The ONE thing this surface exists for

As built: **settling what waits on you.** Every other region is that thing's
evidence or a door out. After promotion the landing's one thing becomes *start
work and watch it* — which `/start` now is. Today survives only if its one thing
(settle) gets a home; that home is `/approvals`, which already renders the queue
(SPEC-ONRAMP §1.2 named this move before I measured it — confirmed against the
source).

### 3. Keep / move / kill, region by region

| # | Region (line) | Job, in one line | Meridian used | Verdict |
|---|---|---|---|---|
| 1 | Greeting (`.today-greeting`) | none — performs warmth | plain `p` | **KILL at promotion.** No fact, no action; R-20 §8 density. |
| 2 | PageHeading + state `headline` (:1276) | say the page's window; count days on record | `PageHeading`, `Door`, `Num` | **KILL the state headline; MOVE the "days on the record" door → /brain**, which already renders that record. The subtitle restated the hero band's job. |
| 3 | No-workspace arm (:1344-1366) | gate: a run needs somewhere to belong | `Region`, `NeedsSetup`, `Action`, `ReadFailedLine` | **KEEP verbatim** (SPEC-ONRAMP §2.5); `/start` ships its own equivalent. |
| 4 | CriticBrief (:351, :1405) | hand the Ask result into a decision | bespoke; `Action`s | **MOVE → the Ask flow.** Its job belongs beside the conversation that produced it, not on a landing. Executes whenever LANE 0 touches ask/, else dies with the page at promotion. |
| 5 | Hero: `FocusNext` "Director's read" (:1419) | what to build next, with evidence | bespoke + `ReadFailed`, `Num`, `Action` | **MOVE → /brain** (item 14's review places it exactly). Checked first: `RecordSpeaks` — wrong shape, it reports a settled fact, this proposes one. |
| 6 | Calibration line (:1434-1447) | did predictions hold | `WorkGlyph`, `RecordSpeaks`, `Door` | **KEEP the idea, MOVE → /brain** beside forecast history. Renders zero times today (0 graded forecasts, EVIDENCE §4) — correct behaviour, never show a zero. |
| 7 | Feed "What needs you" (:1448-1601) | settle calls; see run states | `Region`, `DecisionQueue`, `Receipt`, `Reading`, `ReadFailedLine`, `Door`, `RunState`/`ShippedState` (L0) | **KEEP as the core — MOVE whole → /approvals**, one piece including walk mode, bulk verbs, `SendBackSheet`. The runs sub-feed's Reply/Stop exist nowhere else, so they travel with it until /runs adopts them (MAIN's call; flagged, not decided by me). |
| 8 | `QuietMorning` (:1604) | teach the shape with a declared example | bespoke example card | **KILL at promotion.** By design it offers nothing to do (R-03 fail) and narrates emptiness — the exact sentence DESIGN-DIRECTION rejects. `/start`'s four cards ARE the empty state. Component stays unmounted (rule 8), LANE 0's file. |
| 9 | `PushedInsights` (:1606) | act on what the brain pushed | `Action`, `Num`, `ReadFailedLine` | **MOVE → /brain.** Real job, real verbs; wrong surface. |
| 10 | Learning block (:1611-1695) | the last thing learned | `Region`, `RecordSpeaks`, `Door`, `Num` | **MOVE → /brain** — its own door already lands there. |
| 11 | Composer block (:1699-1706) | start something | `AskComposer` (L0) + my `.today-composer` CSS | **KILL at promotion.** It invites "give the crew its next outcome" then files a chat MISSION no run can see — item 16's defect wearing a friendly label. `/start`'s composer starts a track instead. `data-page-composer` goes with it; the dock yields-rule then stands down and Cmd+K remains the ask door. |
| 12 | `useSpineStrip(null)` (:570) | station chips as nav | run-strip `mode:"nav"` | **KILL at promotion** (R-01: stations are never navigation). Spec §4.2's step 1; step 2 (AppFrame stops mounting WorkspaceSpine) is mine and follows separately. |

### 4. Which Meridian component, per region — and what was checked first

Named in the table. Two bespoke shapes were evaluated for adoption and kept
bespoke with reasons: the runs feed rows (carry an inline `Action` per row;
Meridian's `Row.action` slot could serve and is the candidate to adopt when the
feed re-homes — recorded so the fourth view of a run does not get invented);
`FocusNext`'s proposal card (checked `RecordSpeaks` first — rejected because a
recommendation is not yet a fact).

### 5. Can a person DO something here?

Yes everywhere except the two regions killed for it (#1 greeting, #8
QuietMorning). The feed — the surviving core — is all action: decide, snooze,
send back, reply, stop, open. That is why it survives as a surface when the
briefing around it does not.

## What this review decides for the promotion

When the founder promotes `/start` (one redirect in `_authenticated.tsx`
beforeLoad), the same change executes: #1, #2-headline, #8, #11, #12 killed;
#4/#5/#6/#9/#10 re-homed (Brain items 14 governs where); #7+#12-sheet moved to
/approvals as one unit. Until his word, nothing here touches the file.

## Gates

None owed — no code changed. Dev server not started.
