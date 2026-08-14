# The seven stations, from the user's side

> _Audit pass, 2026-08-14. Raw output, saved as it finished. Judged mainly on the empty state, because in production almost every workspace is empty and 39 of 43 work items are stuck at the first station._

## The three worst problems

**1. Ship's day-one primary invites you to announce a product with nothing shipped.** Empty workspace, the headline says *"Nothing is waiting to go out."*, and directly beneath it the Gate asks **"Write the first announcement?"** with a primary that opens a customer-facing post composer. Nothing has been built, merged or deployed. On the profile that dominates production this is the loudest control on the station, and no honest user should press it. Every other station's day-one Gate asks a question the user can answer now; Ship's asks for output that requires every station before it. **Fixed in `72417655`**: with nothing shipped the Gate now states why there is nothing to announce instead of inviting one.

**2. Build tells a brand-new user "Nothing needs you" and hands them a spend-cap input as the only control.** The headline reads as an all-clear on a station the user has never reached. `ReadyToBuild` returns null with no approved spec, the live/gated/stopped blocks are all count-gated, so what remains is a headline, one empty state, and a governance number. **Build is where the product's money is spent and it is the only station with no question on it.** Its one instruction, *"Hand work over on Runs"*, renders the route name as dead text while the identical word is a live `<Link>` seventy lines above.

**3. The spec page and the Build station disagree about whether approval gates a build — and the spec page's own tooltip takes Build's side.** This is a correctness bug rather than a composition problem, and it sits on the handoff the lifecycle depends on most. Detail below.

## Station by station

### Discover — the best articulation of the thesis
Capture by hand, cluster, promote to a bet, decline, merge into an existing bet, draft a spec, flip unattended sensing. One Gate at a time; the merge picker *replaces* the Gate rather than sitting beside it. "The boundary" block is a literal switch reading *"Read new signals without asking"* with a second line reporting what unattended sensing has actually been doing — the thesis drawn as a control. Empty state is strong and honest: it offers a connector, says plainly that a connector is not the only way in, and offers a sample workspace.

**P2** — four blocks on a brand-new desk, and Discover is the only empty station carrying a mock row. Defensible, but the one place a demanding user could feel talked down to.

### Decide — states the cost before the press
Keep a bet (writes spec, body and outcome contract across three model runs), Challenge, Drop, name a bet from scratch. One keyed Gate, four buttons, keyboard `a`/`c`/`d`. **The Gate states the cost before the press** — *"three model runs… It asks once before it spends"* — which is the right disclosure and almost nowhere else in the product.

**P2** — sample bets seeded by onboarding are labelled honestly *inside* the Gate and not in the ranking list below, so a user scanning rows cannot tell fiction from their own record until they open one.

### Plan — the index is careful; the spec page is the worst-structured surface of the seven

The index carries forty lines explaining why react-query v5's `isLoading` is not a guard, and sweeps the "an empty read is not an empty workspace" class deliberately. Its moved-views table hands three legacy params a named door each, and all three destinations are real.

**P1 on the spec page — the page contradicts itself about whether approval gates a build.** The Approve tooltip says *"Save these edits and approve the spec, **so Build can pick it up**"*. Three hundred pixels below, "Where this spec goes next" dispatches straight to Build with a primary whose only blocker is the **design** gate — there is no `prd.status` test anywhere in that path. Meanwhile `ReadyToBuild` lists **only** approved specs. So a user can send a draft to Build from the spec page, walk to Build, and not find it in the ready list. Two incompatible doctrines, and the spec page's own tooltip asserts Build's version.

**P2** — re-opening an approved design is not offered, and the file says so in its own words. **P2** — four primary-ish actions in one row, plus a second primary further down: two primaries on one document.

### Design — one Gate, and it holds
Ten mutations, and the file states its own rule: *"ONE Gate. The pending rule owns it."* Day-one Gate is honest and carries two doors. Exactly one agent mark may blink at a time.

**P2** — ten mutations share a `busy` flag, so a user who ran the Critic finds Approve greyed with no indicator saying why unless that specific pulse is mounted.

### Build — the weakest empty state
Covered above. **Genuinely excellent, though:** its four sub-read failures each get their own named failure state under the rows they would have filled. That is the most honest failure reporting in the product, and it distinguishes "zero" from "we could not count".

### Ship — the wall of panels
**P1** — five empty panels stack on a new workspace, each explaining a different negative in a different sentence. Brain solved exactly this and says so: *"This single region stands in for the four that used to stack here."* Ship never got that pass.

**P1** — "Where it is live" and "Live releases" are two blocks answering the same question. The file argues they are "two different questions asked in two different moods", which is a defensible *authoring* distinction and an indefensible *reading* one.

**P2** — five queries are `enabled: !!wid`. The file knows the trap and handles it with `stillWaiting` plus a fifteen-line comment, which is correct, but it means five queries hang with no error if the workspace never resolves.

Promote and rollback, the two acts with real customer consequence, are pure-human and read as such. That is right.

### Learn and Brain
**P1 — an empty Learn has zero controls.** The forecast desk renders nothing, the settle panel returns null with no rows, the support-notes door is count-gated, the take-the-record block is gated on a ledger. What is left is one headline and one empty state with **no button and no link**. It is the only station with no way forward at all; Design, Discover, Decide and Brain all hand a new user a door.

**P2** — the strongest autonomy claim in the product, *"Measure settled the last outcome on its own"*, is unsigned prose: `learn.tsx` mounts zero agent marks. The attribution lives one layer down inside the settle panel.

**Brain has the best empty state in the product.** It collapses four former regions into one, carries a worked example end to end, and explicitly refuses to render zero-count tiles: *"NO TILE READS ZERO. A '0' tells nobody to do anything."* The populated path is still a dashboard.

## Verified clean

No broken links. Every navigate and link target checked resolves to a real surface, and the redirect stubs hit were deliberate. Agent-versus-human marking is genuinely strong on Discover, Decide, Plan and Design — each names the *work* rather than guessing a step.
