# SPEC-BUILD-PATHS — two ways the work gets built, one way the loop closes

> _Written 2026-08-26 by MAIN from the founder's ruling the same day, which settles the one question
> [`../docs/strategy/layer-2-build-question-2026-08.md`](../docs/strategy/layer-2-build-question-2026-08.md)
> left open._
>
> **Founder:** *"I think we need to do both. What if a user does not have their own coding agent? Then
> it needs to be done within our platform, and we charge on credits. Whoever wants to hand off to
> their own coding agent, we leave that open, like ChatPRD does — take the spec to v0, Replit,
> Lovable, Claude Code. And once the part is done, how do we take those insights back, combine, and
> close the loop? That also we need to consider."*

---

## 1 · The ruling

**Both paths ship. Neither is the default in a way that blocks the other.**

| | **Bring your own builder** | **Build it here** |
| --- | --- | --- |
| Who it is for | Anyone already in Cursor, Claude Code, Lovable, v0, Replit, Codex — which is most of our buyers | Anyone with no coding agent, or no repo yet, or who does not want to leave |
| What we hand over | The spec, the decision, the acceptance criteria and the forecast, in the form that builder wants | Nothing — it happens in place |
| What it costs | Nothing. We do not meter someone else's compute | **Metered on credits.** It is a real cost and a real revenue line |
| Our job | **Get the outcome back.** §3 | Run it, show it, get the outcome back the same way |

**Why both, in one sentence:** the builder is a supplier, and a product that supports exactly one
supplier is worse than one that supports any — including itself.

**And the load-bearing insight, which is why bring-your-own does not break the loop:**

> **The verdict is measured against the forecast, not against the code.** We do not need to know
> *how* a change was built in order to say whether it did what we said it would. We need two facts
> back: **it shipped**, and **what happened**. Both are obtainable without owning the builder.

That is why the moat survives either path. The forecast is written at Decide, before any builder is
chosen, and it is graded at Learn against an outcome that lives in the customer's own telemetry.
**Owning build was never what closed the loop.**

---

## 2 · The sandbox, thought through across the whole platform

> _Founder, after the first draft of this section named only Design and Build: "think holistically
> from the entire platform perspective. There might be a scenario beyond the design and build path.
> There might be sandbox access required for other paths as well — you decide, but consider every
> aspect."_
>
> **He was right that the first draft was too narrow. Five of the seven stations have a genuine case,
> and two of them are worth more than the Design prototype for closing the loop.**

### 2.1 · What a sandbox actually is here, so we build one thing and not six

**An isolated execution environment where something runs, so a person can judge it before anything is
committed.** That is one primitive with a scope-limited capability set, rendered in one frame in the
right pane. **The station decides what runs inside it.** Building it as one service with six callers
is a fraction of the cost of six previews, and it is the only version that stays consistent.

**The law, and it is an enterprise requirement as much as a safety one: a sandbox never touches
production.** Read-only probes, ephemeral environments, no write to any customer system, credentials
scoped to the single question being asked, and a hard expiry. **That is also what makes it safe to run
unattended**, which is the whole point.

### 2.2 · The test for whether a station needs one

**Does something have to RUN for the person to judge it?** If the answer is no, the right pane renders
the artifact and that is enough. If yes, the artifact is not the thing — the *behaviour* is.

### 2.3 · Station by station, with the honest value ranking

| Station | Does something need to run? | What runs in the sandbox | Value |
| --- | --- | --- | --- |
| **Discover** | **Yes** — a **connector dry-run.** "Connect this source" must show what it would actually pull before it pulls anything | A read-only probe against the source, results shown, nothing written to the workspace | **High.** `scout_targets` is 0 in 21 of 21 workspaces and `scout_snapshots` is 0 rows ever, partly because nobody could see what connecting would do. A dry-run also makes the paid-crawl decision inspectable before money is spent |
| **Decide** | **Yes, and this is the most important one in the product** — can the metric this forecast names actually be READ on the horizon date? | A scoped query against the customer's telemetry proving the observable exists, is readable, and returns a number today | **Highest, for the moat.** A forecast written against a metric nobody can read is a verdict that can never land. `forecast_resolution` is never written and the grader has processed **zero workspaces in its life** (F-51). **This probe is the fix, and it is cheap** |
| **Plan** | **Partly** — can the acceptance criteria be CHECKED? | A dry-run of the check the criteria imply: the query, the test, the assertion, shown with its result | Medium. A spec whose acceptance cannot be checked cannot produce a verdict, and nothing catches that today |
| **Design** | **Yes** — an interactive prototype the person clicks | A running prototype in a frame. Not a link, not an image | **Highest, for product value.** See 2.4 |
| **Build** | **Yes, when the build is ours** | The diff, then the checks, each with its own state and clock | High. When it is the customer's builder, the pane shows their PR and its checks instead — the sandbox is not needed |
| **Ship** | **Yes** — the pre-flight | A **preview deploy**, shown working, before anything is promoted | **High, and it unblocks the acceptance.** R-27 gates the production deploy by *proof, not a click* — **the preview deploy IS that proof.** `release.publish` already requires a `deployments` row with `status='success'`, and the loop can produce neither today (F-36). This is the missing mechanism, not a nice-to-have |
| **Learn** | **Yes** — re-run the metric and watch the number arrive | The forecast's own query, executed live, with the query visible beside the result | Medium-high. *A number without its query is not evidence* is a rule this repo learned the hard way; showing both is the honest form of a verdict |

**So the build order, by value rather than by station order:** ① Decide's metric probe (makes the moat
mechanically sound) · ② Design's prototype (highest product value) · ③ Ship's preview deploy (unblocks
the acceptance) · ④ Discover's connector dry-run · ⑤ Learn's live verdict query · ⑥ Build, ours only ·
⑦ Plan's checkability probe.

**Note what that ordering says:** three of the top four are not about building code at all. **The
sandbox is a preview and verification surface first; a build environment last.**

### 2.4 · Why Design's prototype is worth more than a build preview in an enterprise product

Lovable and Replit show a live preview because their product **is** the app. Ours is not. Our preview
belongs one station earlier.

**The expensive mistake in an enterprise product is not a bad implementation. It is building the wrong
thing correctly.** A clickable prototype at Design catches that while it still costs a prompt. A
running app at Build catches it after engineering has been spent. **Their preview saves rework; ours
prevents it.** And for the buyer we sell to — the person accountable for output they did not write —
seeing the thing before it is built is the difference between approving and hoping.

### 2.5 · The three uses that are not stations at all

1. **The first sixty seconds.** A stranger must watch a full loop with nothing connected. That requires
   a sandboxed workspace with data that is **labelled as an example, never dressed as theirs** — a
   brain wearing seeded memories fails on day two, and 133 of 133 `learnings` rows being seed is
   already a finding against us (F-70).
2. **The acceptance run.** The proof that `entry_station='sense'` reaches `learn` with nothing waived
   needs an environment where every station can complete without a customer's repo. **All five walls
   that ever stopped a real run sat at a handoff to somebody else's world.**
3. **Any station retrying after it failed its own check.** Gap #1 gives every station a self-check
   before it may hand on; where that check needs something to run, it runs here. **Devin's loop — read
   the error, reason, fix, rerun — needs somewhere to rerun.**

### 2.6 · What the right pane holds when nothing needs to run

Five stations spend most of their time with no sandbox at all, and those panes must be as good.
Discover shows real signal cards visibly grouping into themes as clustering runs. Decide shows the
call, what it rests on, what was weighed, and the forecast as a live editable field. Plan shows the
spec section by section as written, non-goals with equal weight. Ship shows deploy steps with a live
clock and then what went out and where. Learn shows predicted beside actual. **A sandbox is never a
substitute for a designed pane** — and a pane that only tells is a status panel and does not ship
(R-03).

## 3 · The handback — how the loop closes when somebody else built it

**This is the real engineering in this spec and the part nobody else has done.** Four mechanisms,
cheapest first. **Ship them in this order; each one alone closes the loop for some customer.**

### 3.1 Paste it back — works on day one, zero integration

The person pastes a PR URL, a commit sha or a deploy URL into the run. We read what is public, attach
it to the track, and move the station. **No app to install, no permission to grant, no procurement.**
This is the floor and it must exist before anything fancier, because it is the only mechanism that
works for a customer who will not connect anything.

### 3.2 The repository app — the strong one, and standard

A GitHub (then GitLab) app that tells us four things and nothing more: **a PR opened**, **its checks**,
**it merged**, **it deployed**. That is the whole payload. Those four events are exactly what Build and
Ship need in order to advance honestly, and today `ship` has never written a track-member row while
`deployments` holds 42 successful ones — **the bridge is one write, not a redesign.**

**Scope discipline matters here commercially:** we ask for the narrowest permission that answers those
four questions. A product that asks for a customer's whole codebase to tell them whether their bet
worked has mispriced the trade.

### 3.3 The outcome signal — what the forecast actually needs

The verdict is not "did it merge", it is "did the number move". So the handback that closes the moat is
the customer's own telemetry: the metric named at Decide, read on the horizon date. Analytics, a
warehouse, an existing dashboard — read narrowly, one metric per forecast, named in advance.

**This is the one integration that is not optional**, because without it the verdict is a person typing
in an answer, and a self-reported verdict is not a track record.

### 3.4 The builder handoff, in the builder's own idiom

Going *out* is as designed as coming back. ChatPRD proved the shape: after the spec exists, take it to
your agent. **The handoff is a formatted brief, not a link** — the spec, the acceptance criteria, the
non-goals, and the forecast, written the way that builder reads best. One control per destination,
**and the forecast travels with it**, so whatever builds the change knows what it is expected to
achieve.

---

## 4 · What we do NOT do, restated so the hybrid is not read as a licence

**We are still not competing on code generation** (canon §5N). Every reason holds: the market is over
$48B, the pain moved to review rather than generation, and neutrality is what makes every builder a
supplier rather than a rival.

**The first-party build path is a fallback and a preview surface. It is not a product line.**

- It is **never** the default when the customer has a builder.
- It is **never** marketed as "build anything here". A person who arrives wanting that is in the wrong
  product and we should say so rather than take the credit revenue.
- It exists for: **the Design prototype** (its main job), a customer with no builder or no repo, the
  first sixty seconds where a stranger must see a full loop with nothing connected, and the proof run
  that satisfies the acceptance.
- **Metered on credits, and the meter is honest** — an unset ceiling is the default, never "unlimited"
  (R-22), and *"was it worth it"* is one of the six things a teammate must be able to answer (§11 of
  the operating model), so the cost of a build shows up in the value audit.

---

## 5 · Ownership and order

| Piece | Owner | Order |
| --- | --- | --- |
| **The right pane, live, per station** — the frame, the states, the actions on the artifact | **S1** | First. It is the surface the whole product is judged on and it needs no sandbox for five of seven stations |
| **The sandbox primitive** — one isolated-execution service, scope-limited, ephemeral, never touching production | **S0** | Second. One service, six callers. Building six previews instead is the expensive mistake |
| **Decide's metric probe** — prove the forecast's observable is readable today | **S0** the probe, **S1** the surface | Second, with the primitive. It is what makes the verdict mechanically possible |
| **The Design prototype** — running, clickable, in the frame | **S0** runtime, **S1** surface | Third, and it is the highest-value one for the buyer |
| **Ship's preview deploy** — the proof R-27 gates production on | **S0** | Third. It is the missing mechanism behind F-36, not a nice-to-have |
| **Discover's connector dry-run** · **Learn's live verdict query** · **Plan's checkability probe** | **S0** probe, **S1** surface | Fourth, in that order |
| **Paste-it-back** (§3.1) | **S1** surface, **S0** the read | Second. Cheapest thing that closes a loop |
| **The builder handoff out** (§3.4) — one control per destination, forecast travels with it | **S1** surface, **S0** the brief format | Third |
| **The repository app** (§3.2) — four events, narrowest scope | **S0** | Third. Unblocks Build and Ship advancing honestly |
| **The outcome signal** (§3.3) — one metric per forecast, read on the horizon date | **S0** | Fourth, and it is the one that closes the moat |
| **Connections surface** — reached at the moment of need, never a shelf | **S3** | Alongside §3.2 |
| **Credit metering and its display** | **S3** surface, **S0** the meter | With the build path |
| **Proving no station advances on an unverified handback** | **S4** | Standing |

---

## 6 · What would prove this wrong

**If the handback proves unobtainable at scale.** If, after §3.1 and §3.2 exist, real customers still
cannot get an outcome back into the product more often than not, then the hybrid has failed and owning
build stops being a fallback. **That is measurable and the instrument is the five findings that already
name this seam** — a repo the product stopped recognising, a merge gate no station approached,
dependencies a customer's repo cannot install, a CI gate the builder disabled, and billing.

**And the inverse:** if the Design prototype turns out to be what people actually come for, then the
priority in §5 is right and the Build sandbox may never be needed at all.
