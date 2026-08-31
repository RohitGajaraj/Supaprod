# RANKED BACKLOG — 29 gaps, ranked and distributed across five lanes

> _Created: 2026-08-31 · Last updated: 2026-08-31_
>
> **Written by S0 at the founder's instruction: *"re-rank based on the priorities what needs to be
> built first, and distribute between all five lanes so they can pick it up."***
>
> **This ranks; it does not re-specify.** Every gap's detail stays where it was written —
> [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) §0.6 and §0.8,
> [`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md),
> [`SPEC-STATION-MODEL-AND-ARTIFACTS.md`](./SPEC-STATION-MODEL-AND-ARTIFACTS.md).
> **`docs/lanes/QUEUE-S*.md` stays the thing a lane takes work from.** This is the order those queues
> are filled in.

---

## The ranking rule, and why Tier 0 is only S0

**§0.7's list decides ties: a station doing its job without a person comes before everything.** And
the acceptance has never once been met in three months — 73 tracks, 71 entered at `sense`, zero
walked it clean.

**So Tier 0 is the set of things without which the loop physically cannot complete, and all of it is
S0's**, because it is all `src/lib/spine/**`. **That is not a bottleneck to route around; it is the
correct shape.** S1, S2, S3 and S4 run Tier 1 in parallel against it, and none of Tier 1 waits on
Tier 0 landing.

**The guard, and it is the likeliest way this goes wrong:** ten new gaps arrived from a playbook this
week. **A session that opens with artifact emitters instead of Tier 0 is re-architecting instead of
shipping**, which is this repository's signature failure.

---

## ⚠ TIER 0 WAS RE-SCOPED 2026-08-31 AFTER AN 11-AGENT AUDIT. THE OLD ONE WAS WRONG.

**F-36 is stale and was the wrong target.** It said `studio.commit` appears 0 times in `driver.ts` and
Build is briefed on one step of six. **Measured 2026-08-31: `studio.commit` appears 8 times, all six
chain steps are briefed across three places, a test guards it, the GitHub App mints installation
tokens today, `supaprod.json` is present on both target repos, GitHub Actions runs (F-64's billing
block is over), and `resolveToolMode` releases both merge and publish to `auto` on a trusted arc.**

**Three real blockers were found instead. All three are FIXED and pushed. Do not rebuild them.**

| | What it was | State |
| --- | --- | --- |
| **F-149** | **The loop HTML-escaped every tool result before the model read it.** `loop.server.ts:2043` ran `xmlEscape(JSON.stringify(result))` then `.slice(0, 2000)`, so a builder reading a file back saw `=&gt;` where the file says `=>` — and `studio.stage` requires *"the FULL new file text"*, so it committed the corruption. Two open PRs carried 41 and 22 HTML entities against 0 on main; the loop's own repair commit is titled *"unescape => ... to restore TS parse validity"*. **The self-correct fired and could not win, because the damage was upstream of it.** | **FIXED** `188a1efb5` |
| **F-151** | **"Park the mission once, honestly" ran 4,320 times per mission.** The park guard's inline literal omitted `completed_with_failures` — 40% of every run ever recorded — so three missions oscillated on a ~40-second cadence since 2026-08-25, writing ~12,960 stage events in 48 hours **while `agent_runs` and `tool_calls` sat empty for 48 hours.** In series with F-149: those are the same three changesets. | **FIXED** `8f7f7dcae` |
| **F-147** | **Four finished review tools briefed at zero stations**, including `studio.review`, whose own description names the exact seam the Build checking seat already walks. That seat was reading files by hand. | **FIXED** `f9ff9e347` |

**AND THE COUNTS IN EVERY DOCUMENT ARE STALE.** *"73 tracks, 71 entered at `sense`"* was measured
2026-08-26. **Today it is 106 tracks, 103 entered at `sense`, and 81 still sitting there.** The honest
acceptance query still returns **0**. **Re-measure before quoting a number; do not copy one forward.**

---

## TIER 0 · The acceptance. S0 only. Re-scoped 2026-08-31.

| Order | Item | Why it is here |
| --- | --- | --- |
| **0.1** | **Deploy `main`, then drive ONE track and watch it.** | Everything above is inert until it reaches production, and supaprod.ai is served through Lovable's pipeline. **Verify by fetching the changed asset and comparing bytes, not by trusting a deployment id** — publish status has lied three times in one night. Then drive a track: merge runs inline at a trusted arc, `ci-poll-tick` builds the Deno preview within two minutes because `supaprod.json` is present, and `release.publish` resolves to `auto` with all five preconditions satisfiable. **Nothing after this is unknown; it has simply never been run with a working read path.** |
| **0.2** | **Unblock the three parked changesets.** | All three have spent `fix_attempts` against `CI_FIX_BUDGET = 3`. After 0.1 deploys, set `fix_attempts = 0` on the changesets behind PRs #2 and #3 so `ci-poll-tick` dispatches one more repair run, which will now read the file correctly. **Close PR #1 rather than retrying it** — its test imports `@testing-library/react`, which `package.json` does not carry and F-56 forbids adding. |
| **0.3** | **#15 · the forecast band and its tiered response** | We record one number and grade it once at horizon, which is why the grader has processed **zero workspaces in its life**. Needs Decide's metric probe. |
| **0.4** | **#4 · the return edge fires** | A missed forecast becomes a **normal, refusable** piece of work at Discover. Learn starves until it runs. |
| **0.5** | **The Test gate (F-148), which is NOT an eighth station** | `verifyStationOutput` compiles nothing and runs nothing; **at Build it requires artifact kind `mission`, which the driver writes itself before any seat runs, so it cannot fail.** The fix is `studio.checks.run` briefed as **required** rather than suggested, its verdict recorded, and the Build→Ship advance refused on red. Plus gap #21's hook the agent cannot edit around. |

**DO NOT REBUILD Tier 0.2 as it was written.** The old text ranked "the sandbox primitive and Ship's
preview deploy probe" second and called the preview deploy missing. **It is not missing:**
`captureDeploymentsCore` and `deployChangesetApp` are built and called on a schedule, `E2B_API_KEY` is
set, and `studio.checks.run` is implemented and already briefed at `driver.ts:375`. **And drop the
credential work implied by F-39, F-101, F-106 and F-107 from the critical path** — tokens were minted
against both installations on 2026-08-31.

---

## THE STATION QUESTION IS SETTLED — three judges, zero votes to merge

The founder asked whether Discover and Decide should club into one station, reasoning that adopting
the SDLC would widen the station count. **An adversarial panel of three independent lenses returned
KEEP_SEPARATE (0.87), THIRD_OPTION (0.88) and THIRD_OPTION (0.78). None voted to merge.** Each found
something the others did not:

1. **The premise is false.** Adopting the playbook adds **zero** stations — two of ours collapse into
   their Plan, two into their Design, and one of ours covers two of theirs. **There is nothing to
   offset.**
2. **`decide → sense` is the busiest backward edge in the whole spine — 20 events across 13 distinct
   tracks, against 14 backward events on every other edge in the loop combined.** Only 28 tracks have
   ever reached Decide, so **46% of them were sent back to Discover at least once.** That transition
   is a specific sentence: *the call could not be made on the evidence available.* **Merge the
   stations and that sentence becomes unsayable, because a station cannot transition to itself.**
3. **The merge would make the acceptance test start passing falsely, in the week the real one is one
   track away.** `route.ts:187-215`: the `existing-feature` shape has `entry: "decide"` and waives
   exactly one station, `sense`. Collapse the two into the `sense` slug — the cheapest correct merge —
   **and a route shape built to SKIP discovery enters at `sense` with `waived='[]'` and satisfies the
   query that has measured "zero clean walks in three months."**

**And the count the founder actually wants reduced is the one on screen, not the one in the spine.**
Two judges converged there independently:

- **Group the display (S1).** Add a `group` field to `AGENT_STATIONS` and an ordered `STATION_GROUPS`
  — Discover {sense, decide} · Design {define, design} · Build · Ship · Learn. **Visible count 7 → 5,
  zero rows touched, no spine consumer changed.** Step lists render groups; dispatchers render
  stations.
- **Better still, take it to ZERO (S2).** Delete stations as navigation — the `Stations` rail door,
  the `Guardrails` door, and `STATION_ROUTE` at `run-strip.tsx:204`, the map turning each slug into a
  browsable door. **This is not new design; it is four unexecuted rulings** (R-01, R-13, SURFACE-MAP's
  seven `FOLD → run` rows, and F-145/F-146).

**RULING: the spine keeps seven. The screen loses them.** F-144/145/146 is S2's Tier 1, and the
display grouping is S1's to add if the fold leaves anything visible.

---

## THE `sense` / `discover` QUESTION IS SETTLED — do not rename (F-150)

The founder's complaint is real and it is **one dead file, not a slug problem.**
`src/components/track/RunTimeline.tsx:17-20` renders the raw slugs `"Sense"` and `"Define"` **and
carries a `discover:` key as a sibling of `sense:` — both names in one object.** Its own test asserts
**both** appear, so `bun test` is green while the defect sits there, and the vocabulary guard misses it
because it only reads `AGENT_STATIONS` and `STAGE_LABEL`. **Nothing imports the component but its own
test**; the live one is `src/components/meridian/RunTimeline.tsx`.

**Decisively against a rename: that map is typed `Record<string, string>`, not
`Record<AgentStation, string>`, so renaming the union raises ZERO type errors there and would leave
the founder's exact complaint on disk. The rename cannot fix the complaint it was proposed to fix.**

Also measured, and each would have been paid for by a sweep: **`sense` is two unrelated vocabularies**
— `CallSurface` at `runtime.server.ts:372` has its own `sense` member for spend accounting, 13 sites —
and **63 hardcoded copies of `entry_station = 'sense'` across 39 files**, two of them in `CLAUDE.md`.

**FIX (S1): delete `RunTimeline.tsx` and its test, and in the same commit widen the vocabulary guard to
fail on any station-slug key rendering as a display name anywhere in `src/`.** Deleting the file
without widening the guard fixes today's instance and lets the next one land silently, which is
exactly how this one survived.

---

## THE ARTIFACT QUESTION IS SETTLED — build no management surface

`ArtifactPane` already exists: **2,415 lines, mounted, reached from six call sites**, ten kind-specific
renderers, four derived states, 500ms polling during a run, and an arrival animation that fires only
for member keys absent on the previous poll. **The founder's instinct was right and the repo already
agreed with him.**

- **Add exactly one control:** a **"Take this"** action in `ArtifactPane`'s `Region` header
  (`:2352-2355`), scoped to the station tab shown, handing over that station's file. The `Action`
  primitive is already imported at `:73-82` and the `download()` shape is already proven at
  `DataSection.tsx:91`.
- **NOT a settings page** — settings answers *where does my data live, how do I take it out, who else
  touches it*. Four artifacts are not a setting; nothing about them is configurable.
- **NOT a per-station route** — R-01: stations are a progress display inside one run, never a menu.
- **NOT a global list** — that surface was built, orphaned, audited and redirected away on 2026-07-30.
  Rebuilding it is the repo's signature defect.

---

## TIER 1 · Runs in parallel with Tier 0. One item per lane, starting now.

### T1-S2 comes first, and it is the founder's own report — F-144 · F-145 · F-146

**Founder, 2026-08-31:** *"On the left sidebar, 'Today' — psychologically people would think this is
where we are supposed to land. The user journey is still confusing: where to go, what to do, where to
look."*

**He is describing a mechanism, not a preference, and it is confirmed in the code.** `SIGNED_IN_HOME`
flipped to `/start` on 2026-08-25 because an audit found `/today` opens an empty workspace with **five
negations in the first viewport**. **The rail was never flipped with it.** `AppFrame.tsx:339` puts
**Today** first; the surface you land on is **Work**, third, at `:365`. **A person lands, reads the
top door as home, clicks it, and arrives at the surface the flip existed to escape.**

**And four of seven doors contradict a ruling that already exists** — `Stations` (R-01: stations are
never navigation), `Guardrails` (§12's rename map), and `Today` and `Approvals` (both ruled FOLD into
S2's single board, whose filters S2 has already moved there in U-050). **The rail is advertising the
pre-fold world.**

#### The ruling: the rail carries ONE primary door, and the board folds into it

Not a rename. **A rename leaves two doors and moves the confusion.**

1. **One primary door, which is the home you already land on.** It is first because it is the only
   one. `/today`, `/approvals`, `/runs`, `/observe`, `/missions`, `/cockpit`, `/fleet`, `/swarm` fold
   into the board — **and the board folds into the home**, so landing shows the composer *and* what is
   in flight, on one surface. **Then there is nothing left to confuse it with**, which is the only fix
   that cannot regress.
2. **No station ever appears in the rail.** R-01, unchanged. Stations are the step list inside one
   run and nowhere else. The `Stations` door goes with the fold.
3. **`Guardrails` becomes "What it's allowed to do", secondary.** §12's map, and it is **S3's** door,
   not S2's — coordinate, do not both edit it.
4. **Every remaining door states what you DO there, never when.** *Today* is a time word; it tells a
   person nothing about what happens when they click.

**The one thing that is the founder's call, and it is the label.** Once the board folds into the home,
that surface genuinely *is* "here is today, and here is where you start" — so **"Today" becomes an
honest name for it**, which is what he proposed. The alternative is a name about the act (*Work*,
*Start*). **The fold is ruled either way; only the word is open.** Ask in
`coordination/requests/S2/rail-home-label.md` and keep building — the fold does not wait on it.

**Acceptance:** a person signs in and there is exactly one primary door, it is the one they are
standing on, and no door in the rail names a station or a word from §12's map. **Every folded route
redirects in the same commit** — a fold without its callers redirected is a 404 in production. Then
**drive it**: sign in cold and try to predict what each click does before making it.

**Owner: S2** (`src/components/shell/**`), with **S3** for the Guardrails door and **S1** for the run
surface's half of F-146. **This outranks #8 for S2** — the cursor layer draws teammates onto surfaces
a person cannot navigate confidently yet.

---

## TIER 1 · Runs in parallel with Tier 0. One item per lane, starting now.

| Lane | Gap | The one sentence |
| --- | --- | --- |
| **S1** | **F-150 first (twenty minutes), then #16 + #29** | **F-150:** delete `src/components/track/RunTimeline.tsx` and its test, and **widen the vocabulary guard in the same commit** so any station slug rendering as a display name fails anywhere in `src/`. Then **#16** the five-field intent shape and **#29** open questions answered in place — an empty `Open questions` is a **defect, not a clean bill**, and the five fields are a shape a person READS, never a form a person fills. `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.1 and §4.3 |
| **S2** | **F-144 · F-145 · F-146 (above), THEN #8** | One primary door, the board folded into the home, no station in the rail. **Then** the cursor layer — and a cursor whose position cannot be traced to a row is theatre, which ends a feature rather than fixing it |
| **S3** | **#2 · The verdict reaches a person who left the page** | S1 already ships *"you can leave this page"* on screen and **that sentence is untrue until this lands.** One channel, email, verified by receiving one. **Then the layer-02 vocabulary sweep below** |
| **S4** | **Adversarially verify Tier 0**, then **#24 · the golden set** | S0 cannot sign off its own spine work (R-11). Build the golden set **from real graded runs** — one built from a broken pipeline encodes the breakage |

---

## TIER 2 · The playbook artifact spine. Starts when Tier 0 is done or S0 is blocked waiting.

| Gap | Owner | Note |
| --- | --- | --- |
| **#20 · Emit `intent.md` · `spec.md` · `plan.md`, named their names** | S0 emitters · S1 the hand-out control | **The compatibility play.** A team on the playbook drops our output into their repo with no adapter |
| **#25 · Engine-neutral emission and the pointer adapter** | S0 | `AGENTS.md` carries the substance; `CLAUDE.md` · `GEMINI.md` · `QWEN.md` · `.cursorrules` · `.github/copilot-instructions.md` are generated pointers. **No engine name in any artifact body** — that law is the "your builder is substitutable" position kept honest at file level |
| **#27 · `verdict.md` at Learn**, carrying its forecast verbatim | S0 emitter · S1 surface | **Their pipeline has no artifact at Stage 6**, so nothing is being copied. The grade is the product; it must be a document |
| **#28 · The artifact card** | S1 | What a station produced, as one readable sentence. **No frontmatter, no filename, no section heading on screen** |
| **#22 · The self-check becomes visible and counted** | S0 the count · S1 the surface | Their Test stage, adopted as substance without an eighth station |
| **#26 · The SDLC vocabulary as a display translation** | S1 the map · S2 the shell | R-01 already decoupled slug from display. **One vocabulary at a time; never both on screen** |

---

## TIER 3 · What a company needs before it puts real work through this. Mostly S3.

| Gap | Owner |
| --- | --- |
| **#18 · What counts as DONE** — the customer's `REVIEW.md`, on the boundary page | S3 |
| **#19 · A declared gate above the inferred policy, and a named approver** (`decided_by` NULL on 18 of 176) | S3 surface · S0 engine |
| **#17 · Value audit** — the measures are gaps between artifact timestamps we already store | S1 surface · S0 numbers |
| **#21 · A hook the agent cannot edit around during a fix** | S0 |

---

## TIER 4 · Legibility and reach.

| Gap | Owner |
| --- | --- |
| **#14 · Teammates address each other and you.** Challenge is the highest-value type and nobody ships it | S0 model · S1 transcript · S2 claim and collision · S3 Slack consent · S4 the budget guard |
| **#13 · The four integrations that carry the loop.** ~20 providers already exist — **a wiring job, not a building job** | S0 · S2 inbound column · S3 the connect control |
| **#5 · Steer without restarting** · **#6 · Take a step by hand and hand it back** | S1 |
| **#12 · The handback** — four mechanisms, cheapest first | S0 · S1 paste-back · S3 connections |

---

## TIER 5 · Layer 03. Gated, and the gate is not negotiable.

| Gap | Owner | The gate |
| --- | --- | --- |
| **#23 · Station briefs become versioned skills, then the improver** | S0 | **BLOCKED until 0.4 and 0.5 are producing graded forecasts.** An improver with nothing graded to read is a machine that learns from nothing — which is what produced **133 of 133 seed `learnings` rows.** Warp's improver learns from a thumbs-down; **ours learns from a graded forecast, which is calibration rather than preference-fitting**, and that difference is the whole layer |

---

## TIER 6 · Deferred, and each for a stated reason.

| Gap | Why it waits |
| --- | --- |
| **#9 · Evidence ingestion** (`scout_snapshots` is **0 rows ever**) | **Turning it on starts paid crawling against real sites.** S0 proposes with the cost; **the founder confirms the key. That one is money and money stays his** |
| **#10 · Search and export** (S3) | Table stakes, and nothing upstream is blocked on it |
| **The public and marketing surface** | **Frozen** (§0.7) |

---

## THE FOUR STALLS — the pain the playbook names and does not clear, and who clears which

**Founder, 2026-08-31:** *"Agentic coding has taken care of building. The same approval gates,
reviews, handoffs and policies are still stalling the gains. How does Supaprod solve this for the rest
of the lifecycle? That is the real problem we want to be solving."*

**Every lane is clearing one of four stalls. Know which one you are on** — it is the *why* behind
your queue, and a unit that does not clear one of these is probably the wrong unit. Full argument:
[`../docs/strategy/ai-native-sdlc-rewiring-2026-08.md`](../docs/strategy/ai-native-sdlc-rewiring-2026-08.md)
§3.5.

**The reframe that makes the four tractable: a gate is a question, and only ONE of the four is about
code.** *Is it correct and safe?* is answered by reading a diff, and agentic coding plus AI review
already answers it. **The other three are answered by evidence the code does not contain** — which is
why the pain moved without moving to generation, and why speeding the review up does not clear it.

| Stall | The question underneath | Cleared by | Lanes |
| --- | --- | --- | --- |
| **Approval gates** | *Will this do what we wanted?* | **The forecast answers it, not the diff.** A change arrives carrying what was predicted, by when, in what band, and how often this team has landed in band at this station | **S0** engine · **S1** surface |
| **Reviews** | *Is it correct and safe?* | **The change proves itself before a person sees it.** `REVIEW.md` says what counts as done; the self-check proves it and **shows the proof.** Human review becomes an exception with a named reason | **S3** the declaration · **S0** the proof · **S1** showing it |
| **Handoffs** | *Does the next person know what I decided, and what I was unsure about?* | **The artifact IS the handoff.** The stall was never the meeting; it is the ambiguity nobody resolved. **Naming the open questions is what removes the meeting** | **S1** the shape · **S0** the emitters |
| **Policies** | *Are we allowed to do this, and who says so?* | **Declared once, bound automatically, widened by class.** `delegate.openhands` was refused **7 of 7** and the queue kept asking — a policy that does not learn from its own answers is a committee with a database | **S3** surface · **S0** engine |

### The one new item this produces, and it is small and it is ours alone

**#30 · `trust-ramp.ts` promotes on CALIBRATION, not on a count of successful runs.** How often this
team's forecasts at this station landed **in band**. Right eight times in ten earns a wider band
before a human is asked; confidently wrong narrows it, automatically, with the reason visible.
**Nothing in the playbook can do this, because nothing in the playbook records a forecast.** It is the
trust ramp the rest of the industry cannot build. **Blocked behind Tier 0.4 and 0.5** like everything
else that reads a graded forecast — **do not build it against a count and call it calibration.**
— *S0, with S3 for how it reads on the boundary page.*

### And the layer split, because it changes how a lane argues for its own work

**01 SELLS · 02 RETAINS · 03 DEFENDS.** A buyer arrives wanting *tell me what to build*; they stay
because the gates, reviews, handoffs and policies stopped being the bottleneck; they cannot leave
because of what compounds from the forecast. **The four stalls above are 02's case, and 02 did not
have one before today** — which is why so much queued work looked like a list rather than an argument.

---

## THE LAYER-02 VOCABULARY SWEEP — S3, and it is 10 named locations, never a find-and-replace

**Founder ruled 2026-08-31 that layer 02 is described as the loop doing the whole SDLC**, and
separately that **we build it here** rather than handing out. The live product surfaces and every root
file were swept in commits `15deb527a` and earlier. **What is still stale is outward-facing:**

| Location | What is wrong |
| --- | --- |
| `docs/pitch/investor-deck/supaprod-pre-seed-investor-deck.html:456-457` | Still reads *"02 · The operating system / It runs the whole lifecycle."* **And it has drifted 77 lines from `public/brief.html`, which its own README requires it to stay byte-identical to** (md5 `881cefe…` vs `c54c225…`) |
| `docs/pitch/shareables/Supaprod-Hub71-Deck.src.html:459-460` | **Generated** from the deck by `scripts/build-hub71-deck.py:37`. One fix and a re-run, not two edits |
| `docs/growth/press-kit.md:55, :59, :95, :138` | The journalist-facing boilerplate, including the paste-ready paragraph |
| `docs/pitch/applications/answer-bank.md:291` · `positioning-doctrine.md:107` | **The reusable source every accelerator answer is drafted from** |
| `docs/pitch/one-pager.md:13, :72` · `founder-story.md:166` · `README.md:303-309` | README's own *"outward-facing work starts here"* section is the stalest of all |

**NEVER run a corpus-wide replace on this string.** 34 files carry the phrase family and **8 of them
quote it in order to BAN it** — `CLAUDE.md:13`, `AGENTS.md:52`, the canon at
`positioning-locked-2026-08.md:320`, `three-layers-and-why-not-a-builder.md:88`,
`ThreeLayers.tsx:100-102`, `brief-parent-is-readable.test.ts:39/49`, and the rewiring doc. **A sweep
would delete the rule along with the violations, and that has already happened here twice** — the
guard test's own comment block records three successive corrections and concludes *"a guard written to
protect indexability spent a day enforcing a phrase a founder ruling had outlawed."*

**And one collision the founder needs to know about:** `OPERATING-MODEL-5-SESSIONS.md:970` bans
*agentic · autonomous · **AI-native** · orchestration · intelligence* in product copy. **So "AI-native
SDLC" is the internal framework name and can never be the customer sentence.** The customer sentence
is the one now in every root file: *decides what is worth building, builds it, ships it, and checks
what actually happened.*

---

## Per-lane, so a session reads one column

**S0 · CONDUCTOR.** **Deploy first, then drive one track and watch it** — that is Tier 0.1 and nothing else is knowable until it runs. Then 0.2 to 0.5 in order. Then #20, #25, #27, #22, #21,
the #19 engine, the #14 model, #13. **#23 is blocked and stays blocked.** Standing: answer every
`coordination/requests/*/` within one unit, keep four queues at two items or more, run all four gates,
and the **monthly forecast watch** (§0.8).

**S1 · THE RUN.** **F-150 first** (delete the dead `track/RunTimeline.tsx` and widen the guard in the same commit), then #16 + #29. Then #28, the #22 surface, the #26 map, the #20 hand-out control,
#27's surface, #17, #5, #6, the #14 transcript. **Everything on this list lands in the run; none of it
adds a destination.**

**S2 · MISSION CONTROL.** **F-144/145/146 first** — one primary door, the board folded into the home, no station in the rail, every folded route redirecting in the same commit. Then #8. Then the #26 shell switch, #14's claim and collision, #13's inbound
column, and the fold that takes the route count down. **Do not build a code-review board, a
vulnerability-triage screen or a scan-results surface** — the vendor ships those and consuming them
*is* following the playbook.

**S3 · THE PLATFORM.** #2 now, and it is job 1 because S1's promise depends on it. **Then the layer-02 vocabulary sweep** — 10 named locations, never a find-and-replace. Then #18, #19,
#13's connect control, #14's consent rule, the sad paths, then #10. **The public surface is frozen and
the sixty seconds is measured signed in.**

**S4 · THE PROVING GROUND.** Adversarially verify Tier 0 as it lands — S0 cannot sign its own spine
work. Then #24. Standing: the four questions in order, the #14 message budget over two cycles, and the
two drift checks — **an unargued departure from the playbook, and any lane rebuilding what the vendor
gives away.**
