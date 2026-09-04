# Lang B: microcopy and state copy

> _Created: 2026-07-28 · Last updated: 2026-07-28_

> _Rebuild 2026-07. Angle B of three. Written 2026-07-28 under the founder's full-rename mandate._
> _Scope: the sentences the user reads. Button grammar, the state copy system, toasts and confirmations, and the rules for numbers, dates, times, durations and counts._

---

## 0. What this file owns, and what it does not

| Owned here (binding) | Owned elsewhere (I bind to it) |
| --- | --- |
| Every button, link and menu-item label | Nav labels and route names (Lang A / IA) |
| Every state block: empty, zero, filtered, loading, partial, error, blocked, denied, over-quota, capability gap, upstream-waiting | Which surfaces exist and what each owns (IA) |
| Confirm dialogs, toasts, banners, notifications | Component anatomy, spacing, color, type scale (Lang C / Tempo) |
| Helper text under a control, disabled-state explanations | Agent names and personalities (Lang A) |
| All number, date, time, duration and count rendering | Marketing and landing copy (out of scope, app only) |
| The sentence-level noun for every concept (§2) | The nav-level noun for the same concept (Lang A / IA) |

**Handoff contract.** §2 fixes one word per concept for use inside sentences. If Lang A lands on a different nav word for the same concept, the sentence word changes with it in the same commit. There is never a nav word and a sentence word for the same thing. That is the exact failure this rebuild exists to end.

### Where I override the existing conventions

| Existing rule | File | Override |
| --- | --- | --- |
| "Button label: max 3 words" | `docs/conventions/ui-voice.md` | Replaced by the three-tier ladder in §3.2. Primary CTAs get 4 words, quiet link-tier gets a short clause. A flat 3 forced the `Save · chat and agent runs use it` workaround, which is worse. |
| "Toast: max 12 words" | `ui-voice.md` | Tightened to 10, and split: 6 words for the state line, 4 more only if a consequence survives the act. |
| "Empty-state copy: max 2 sentences" | `ui-voice.md` | Replaced by the four-part state block anatomy in §4.1. Two sentences is the ceiling for the prose part; the meta line and action are separate slots and do not count against it. |
| "Lightly playful in empty states" | `ui-voice.md` | Kept, narrowed. Playfulness is allowed only in the **zero** state (§4.4), never in **empty**, **error**, **denied**, **over-quota** or **capability gap**. A first-run user is not in on the joke yet. |
| Em dash / en dash / invisible character ban | `docs/conventions/humanized-output.md` | Kept verbatim, extended: the ellipsis character `...` is also banned from UI strings (§3.5). It exists in this codebase in 30+ pending labels and it is a machine tell. |
| Runtime sanitizer at the AI chokepoint | `humanized-output.md` | Kept verbatim. Nothing here changes generated output; this file is authored UI strings only. |

---

## 1. The register in one paragraph

Supaprod talks like a sharp colleague who runs the machine and has nothing to hide. It states what is true, then what happens next, then stops. It never sells inside the app. It never apologises. It never hedges. When it cannot do something it says so before you ask, in the same breath as what it can do. When it did something on your behalf it hands you the receipt without being asked. Contractions on. Active voice. Sentence case. One idea per sentence.

**The cold-read test, applied to every string in this file:** a stranger reads it with no context and knows (a) what is true, (b) what happens next, (c) who moves. If they cannot answer all three, the string is not done.

---

## 2. The sentence-level lexicon

The measured collisions are real: one concept currently has three words in three places, so a user cannot say a sentence about it. This table fixes the word used **inside sentences**. One row, one word, no synonyms.

| Concept | The word (in sentences) | Banned synonyms, everywhere in user-facing copy |
| --- | --- | --- |
| The unit of work the agents run | **a build** (lowercase), plural **builds** | mission, run, session, changeset, job, task, pass |
| The stage that owns builds | **Build** (capitalised, stage only) | Studio, Builder, the Build surface |
| A step inside a build | **a step** | phase, stage (stage is reserved for the seven), node |
| The thing a human answers | **a call** | approval, gate, request, ask, item, pending item |
| The place calls collect | **your queue** | inbox, approvals list, the pull point |
| The three verdicts | **approve · send back · decline** | reject, deny, dismiss, kill, veto, refuse |
| Deferring a call | **later** (verb: set aside) | snooze, defer, postpone, remind me |
| Everything the workspace knows | **the Brain** | memory, knowledge, knowledge base, the store, the substrate |
| One thing in the Brain | name its type: **a decision, a learning, a document, a signal** | memory, memory item, artifact, entry, record (as a noun) |
| The place finished work lands | **the Library** | Artifacts, outputs, deliverables |
| One thing in the Library | name its type: **a spec, a mockup, a release note** | artifact, asset, doc (use document), deliverable |
| The tamper-evident audit trail | **the record** (in prose), **the ledger** (only when its tamper-evidence is the point) | audit log, trail, receipts store, provenance |
| One entry in the record | **a receipt** | log line, event, trace, entry |
| The machinery surface | **the engine room** | Pulse, the cockpit, vitals, ops, the console |
| A ranked idea awaiting judgment | **a bet** | opportunity, idea, candidate, hypothesis |
| The written contract for a build | **a spec** | PRD, doc, requirements, brief (brief is the daily one) |
| The daily digest on Today | **your brief** | daily brief digest, standup, summary |
| A connected external tool | **a source** (read) / **a connection** (auth) | integration, connector, provider, binding |
| The AI spend unit | **credits** | tokens, units, points, spend (spend is money) |

### Three renames I am asking Lang A and IA to ratify

1. **"Pulse" dies. The destination is the engine room.** "Pulse" is exactly the vague category word the founder bans: a pulse of what? "Engine room" is concrete, is already the route, is already the doctrine name, and a user can say it out loud. Nav label `Engine room`, route `/engine-room`, sentence noun "the engine room". Rename `pulseSentence()` in `_authenticated.today.tsx:94` while we are in there.
2. **"Artifacts" dies. The destination is the Library.** "Artifact" is engineering jargon that no PM says. The prior founder ruling already named the concept Library ("what we made, promotion not accumulation"). Route `/library`.
3. **"Mission" dies. The object is a build.** This is the biggest string churn in the app (`Mission title (optional)`, `Delete this mission?`, `Mission archived.`, `Mission running.`) and it is the noun a user is most likely to say wrong, because the nav says Build and the object says mission. The Build stage contains builds. DB names (`missions`, `mission_steps`) stay per the standing rename convention.

Settings currently has a section literally named **Memory** while `/brain` is the destination. Rename the Settings section to **Retention** (it only holds how long things are kept). That kills the third home for one concept without moving any renderer.

---

## 3. Button grammar

### 3.1 The seven laws

1. **The first word is a verb, in the imperative, base form.** `Approve`, `Connect a source`, `Draft the spec`. Never a gerund (`Connecting`), never a noun alone (`Settings` is nav, not a button), never a question.
2. **Sentence case. Always.** `Send back`, not `Send Back`. Product and stage names keep their capital: `Dispatch to Build`.
3. **No terminal punctuation.** No period, no ellipsis, no exclamation mark, no `?`.
4. **The label names the outcome, not the mechanism.** §3.3.
5. **One primary per screen.** Everything else is secondary, quiet, or link tier. If two things feel equally primary, the screen has two jobs and IA has a problem, not copy.
6. **The label is stable across states.** The word does not change on hover, on focus, or after success. Only the pending form differs (§3.5), and it is the same verb.
7. **A disabled control always says why.** §3.7. A dim button with no explanation is a bug, not a state.

### 3.2 The three tiers (this supersedes the flat 3-word budget)

| Tier | Use | Budget | Article? | Real examples, current and fixed |
| --- | --- | --- | --- | --- |
| **Primary** | The one act the screen exists for. Solid ember. Max one visible at a time. | 1 to 4 words | Yes, when it reads as spoken English | `Start` -> **`Start the build`** (`build.index.tsx:571`); `Approve` stays |
| **Secondary** | Real alternatives to the primary act. Outlined. | 1 to 3 words | Prefer no | `Send back`, `Later`, `Show archived`, `Manage billing` |
| **Quiet / link** | Reversible, low-stakes, or navigational. Text only. | Up to a 5-word clause | Yes | `Read the full brief`, `Connect a source`, `Try again` |

**Icon-only buttons** carry an `aria-label` that is the full label from the table above, never an abbreviation. Icon plus label is preferred everywhere except a dense row-level overflow.

### 3.3 Outcome versus mechanism

**The rule.** The label names the state the user will be in one second after the click. It never names the subsystem, the storage, the vendor, the format, or the internal step that gets them there.

**The one exception:** naming **our own agent** is naming the actor, not the mechanism, and it is desirable, because the crew is the product. `Draft with Historian` is correct. `Draft with the LLM` is not.

Real strings in the repo today, and their replacements:

| Now | Where | Why it fails | Ship this |
| --- | --- | --- | --- |
| `Save · chat and agent runs use it` | `settings.tsx:1981` | A button carrying a consequence clause with a separator. That is helper text wearing a button. | `Save` + helper below: `Chat and agent runs use this model.` |
| `Add key · stored encrypted` | `settings.tsx:2264` | Same shape. Also, "stored encrypted" is a reassurance, which belongs next to the field, not on the button. | `Add key` + helper: `Stored encrypted. Only this workspace can use it.` |
| `Fork new draft · copies this version` | `PromptsPanel.tsx:416` | "Fork" is git jargon. The separator clause again. | `Start a new draft` + helper: `Copies this version.` |
| `Save draft · not yet live` | `PromptsPanel.tsx:501` | Status wearing a button. | `Save draft` + a status chip on the version row: `Not live` |
| `Draft contract from this spec` | `OutcomeContractPanel.tsx:303` | Names the input, not the outcome. | `Draft the contract` |
| `Set up ingest` | `ColdStartOnramp.tsx:97` | "Ingest" is pipeline vocabulary. | `Get signals flowing` |
| `Test failed` (toast) / `Key works (150ms)` | `settings.tsx:2109` | Latency in a success sentence is machinery. | `Key works.` with `150ms` in the mono meta line |
| `Confirm rotate?` / `Confirm revoke?` | `sync.tsx:761,777` | "Confirm" is the mechanism of confirming. | `Rotate this token?` / `Revoke this token?` |
| `OK` | `admin.observability.tsx:352` | Says nothing. | The verb of the act it confirms |
| `Show fewer` | `build.index.tsx:947` | Comparative with no referent. | `Show less` |
| `No repo to build in` (dialog title) | `RepoGateDialog.tsx:61` | A title that is a state, so the button has to carry the verb alone. | Title `Connect a repo first`, button `Connect a repo` |

### 3.4 The verdict verbs (the highest-stakes labels in the product)

The human's whole job is judgment at gates. Today the same act is called **Send back** on Today and **Rejected** in the Approvals toast (`approvals.tsx:41`), and the deferral is called **Later** on the button (`today.tsx:812`) but **Set aside** in its toast (`today.tsx:647`). Fix, permanently:

| Verdict | Button label | Toast (past tense) | Meaning | Reversible? |
| --- | --- | --- | --- | --- |
| Approve | `Approve` | `Approved. <what unblocks>` | Yes, proceed. The agent is unblocked. | No (the act runs) |
| Send back | `Send back` | `Sent back. <where it went>` | Not as written. Return it for revision. The thing survives. | Yes |
| Decline | `Decline` | `Declined. <what stands instead>` | No, and it does not come back. | No |
| Later | `Later` | `Set aside. It returns in 24 hours.` | Not now. Not a verdict. Removed from the queue, returns on its own. | Yes, automatically |

**Rules.** `Reject` is banned everywhere in the product, string and identifier. `Decline` and `Send back` are not interchangeable: send back means revise, decline means never. Every call must offer exactly `Approve`, exactly one of `Send back` or `Decline`, and optionally `Later`. Three visible buttons maximum on a call card.

Keyboard, unchanged and now consistent with the labels: `a` approves, `s` sends back, `d` declines, `l` sets aside. The current Today hint reads `A approves · S sends back` (`today.tsx:235`); `d` and `l` join it.

### 3.5 Pending, in-flight, and the ellipsis ban

**Decision: pending labels are the present participle of the same verb, with no punctuation.**

`Saving`, not `Saving...` and not `Saving...`. The button is visibly busy (spinner, shimmer, or `aria-busy`), so the punctuation is redundant, and the codebase currently mixes the real ellipsis character `...` (`settings.tsx:837`, `build.index.tsx:571`, 30+ sites) with three ASCII periods (`BillingBanner.tsx:131` `Opening...`, `checkout.return.tsx:36` `Confirming...`). One is an invisible-adjacent machine tell, the other is worse. Kill both.

| Verb | Idle | Pending | Done (toast) |
| --- | --- | --- | --- |
| Save | `Save` | `Saving` | `Saved.` |
| Start the build | `Start the build` | `Starting` | `Build started.` |
| Delete build | `Delete build` | `Deleting` | `Build deleted. <what survives>` |
| Connect a source | `Connect a source` | `Connecting` | `<Source> connected.` |
| Approve | `Approve` | `Approving` | `Approved. <what unblocks>` |

A pending button keeps its width (reserve the wider of the two labels) so the row does not reflow mid-click.

**Never disable a control because a mutation is in flight.** Use the pending label plus `aria-busy="true"` plus `pointer-events: none`. Disabling drops the accessible name from some screen reader modes and loses the focus ring. `settings.tsx:834,846,854,1978` all do this today; convert them.

### 3.6 Destructive phrasing

**Every destructive verb means exactly one thing. No overlap.**

| Verb | What it means | Reversible | Needs a confirm dialog | Never use for |
| --- | --- | --- | --- | --- |
| `Delete` | The object is gone. | No | Yes, always | Anything recoverable |
| `Archive` | Hidden from the default list. Restorable. | Yes | No, use an Undo toast | Anything that actually deletes |
| `Remove` | Detached from this place. Re-addable. Exists elsewhere. | Yes | No, use an Undo toast | A permanent delete (`settings.tsx:2348` `Remove` on an API key is wrong, that key is gone: use `Delete key`) |
| `Disconnect` | Auth revoked. Data already pulled stays. | Yes, by reconnecting | Yes, when data will stop flowing | A delete of the data |
| `Revoke` | A credential stops working, now, for everyone. | No | Yes, typed confirm | A soft disable |
| `Clear` | A list is emptied. Contents gone. | No | Yes, when count > 1 | Removing one item |
| `Dismiss` | This banner or nudge, this once. | n/a | No | Anything that changes stored state |
| `Decline` | A verdict, recorded on the record. | No | Only when it closes a thread | A delete |

**The destructive label always names the object.** `Delete build`, not `Delete`. `Revoke token`, not `Revoke`. The one exception is inside a confirm dialog whose title already names the object and the count, where the button may shorten to the verb plus the object type.

### 3.7 The disabled-control contract

**Law: a disabled control always carries a sentence naming what the user must do to enable it.** Not what is missing. What they do.

The existing `build.index.tsx:543` is the correct precedent and becomes the standard:

```
title={ selectedPrd ? "Describe the work in a few words, or pick an approved spec"
                   : "Describe the goal in a few words" }
```

Placement rules:

| Control | Where the reason lives |
| --- | --- |
| Primary CTA | Visible helper line directly beneath the button. Never tooltip-only (touch has no hover). |
| Secondary / quiet | `title` plus `aria-describedby` pointing at a visually hidden span |
| A row of choices (plan tiers, credit bundles) | On the disabled choice itself, as a short inline note |

Three reasons, three templates:

| Reason | Template | Two real examples |
| --- | --- | --- |
| **Precondition unmet** | `<Do the thing> to <get the outcome>.` | `Describe the goal in a few words.` (Start the build) · `Approve a bet in Decide to draft a spec here.` (Plan) |
| **Permission** | `Only <role> can <verb> <object>. Ask <who> in Settings.` | `Only an owner can change the plan. Ask your workspace owner.` · `Only an admin can revoke a token.` |
| **Quota / limit** | `<What is exhausted>. <The one move that fixes it>.` | `This bundle exceeds your per-cycle top-up limit. Pick a smaller one.` (fixes `settings.tsx:976` `Exceeds your per-cycle top-up limit.`, which names the limit but not the move) · `No credits left. Top up to run this.` |

Never disable when the reason is "you have not scrolled to it", "we are loading", or "you have not read the thing above". Loading uses the loading state (§4.5), not a dead button.

---

## 4. The state copy system

### 4.1 One anatomy for every state

Every state in the product renders the same four slots. Slots 1 and 3 are the only required ones for actionable states; slot 1 alone is legal for terminal states.

```
[1] STATE LINE     required.  What is true right now. Sentence case, ends in a period.
                              Max 6 words. Never a question. Never an apology.
[2] CAUSE + NEXT   optional.  One sentence: why, and who moves next. Max 16 words.
[3] ACTION         0 or 1.    The single control that changes this state. Never two.
[4] META           optional.  Mono, no period. A count, a receipt ref, or a timestamp.
```

**The component.** One primitive, `StateBlock`, with a `state` discriminant. It replaces the ad hoc empty states in `faces.tsx`, the inline error `div`s in `approvals.tsx` and `today.tsx`, and absorbs `WarmSlot`'s own-work / sample / line selection as a `sample` prop. `WarmSlot`'s core rule survives verbatim and becomes law for all eleven states: **there is no empty render path.** A `StateBlock` always renders something.

```ts
type StateKind =
  | "empty"        // never used
  | "zero"         // used, currently nothing
  | "upstream"     // waiting on an earlier stage
  | "filtered"     // a filter or search hid everything
  | "loading"      // first load
  | "refreshing"   // has data, fetching more
  | "partial"      // some arrived, some did not
  | "error"        // the request failed
  | "blocked"      // a connection is missing
  | "denied"       // permission
  | "quota"        // over limit
  | "ceiling";     // the honest capability gap
```

### 4.2 How to pick the state (the decision order engineers follow)

```
1. Can this user see this at all?              no  -> denied
2. Is a required connection missing?           yes -> blocked
3. Is the account over a hard limit?           yes -> quota
4. Did the request fail?                       yes -> error
5. Did part of it fail or is part still in?    yes -> partial
6. Is this the first load?                     yes -> loading
7. Is a filter or query active?                yes -> filtered
8. Has this workspace ever had one of these?   no  -> empty
9. Does an earlier stage owe this one input?   yes -> upstream
10.                                                -> zero
```

`ceiling` is not in this order. It is not a state of a list; it is a permanent line that sits next to a control, in every state, forever (§4.13).

### 4.3 Empty (never used yet)

**Template**
```
[1] <Nothing of this type> yet.
[2] <What creates the first one, naming who acts.>
[3] <The verb that creates it>
```

The empty state is the product's first sentence to a stranger. It teaches the loop. It is never playful, never apologetic, never a shrug, and it never says "no results".

| Surface | Now | Ship this |
| --- | --- | --- |
| Build, first visit | `Nothing building. Approve a spec and Engineer writes the change on an isolated branch.` (`faces.tsx:2142`) | **`No builds yet.`** / `Approve a spec in Plan and Engineer writes the change on its own branch.` / `[Start the build]` |
| Brain, first visit | `No outcomes recorded yet` (`CompoundingPanel.test.tsx:290`) | **`The Brain is empty.`** / `It fills as you decide, ship, and record what happened. Nothing to set up.` / no action |

**Rules.** State line ends in `yet.` only when more will genuinely arrive. `The Brain is empty.` has no `yet` because the sentence after it does the work. Never seed a fake row; if a sample is shown, it carries the `Sample` badge and a note naming its origin (`WarmSlot`'s existing contract, kept).

### 4.4 Zero (used before, currently nothing)

This is the state the founder will look at most, because it is the steady state of a healthy loop. It is the **only** state where warmth is allowed.

**Template**
```
[1] <Nothing needs you> / <All clear>.
[2] <What the machine is doing meanwhile, or when the next one arrives.>
[4] <the receipt that proves the emptiness is earned>
```

| Surface | Now | Ship this |
| --- | --- | --- |
| Approvals, queue clear | `Nothing needs you.` + `Agents are working; we will bring you the next decision.` (`approvals.tsx:225,187`) | Keep the first line verbatim, it is correct. Second line: **`Four agents are working. The next call comes to you.`** Meta: `LAST CALL ANSWERED 2H AGO` |
| Today spotlight, all quiet | `All clear` + `Nothing needs your judgment right now.` (`today.tsx:251`) | **`All clear.`** / `Nothing needs your judgment. The loop is running itself.` / meta `12 MOVES SINCE MIDNIGHT` |

**The honesty rule that makes zero states trustworthy:** a zero state must never contradict a lane below it that is showing items. `today.tsx:245` already handles this (the `insightCount > 0` branch). Generalise it: `StateBlock` in `zero` refuses to render if any sibling in the same region has content, and logs a dev warning.

**Never** say "You're all caught up!" (trailing exclamation, banned), "Nothing to see here" (dismissive), or "Enjoy your day" (filler).

### 4.5 Upstream (waiting on an earlier stage)

This state is unique to Supaprod and is the most common empty in the app. Seven stages feed each other, so most emptiness is not absence, it is sequence. Naming it correctly is what makes the loop legible.

**Template**
```
[1] Nothing here yet.
[2] <Stage N> owes this stage <the object>. <What to do in Stage N>.
[3] <Go to Stage N>   (link tier, never primary)
```

| Surface | Now | Ship this |
| --- | --- | --- |
| Plan, no approved bets | `No spec yet. Approve a bet and Draft turns it into a cited spec, or ask for one straight away.` (`faces.tsx:818`) | **`No specs yet.`** / `Decide owes Plan an approved bet. Approve one and Draft writes the spec.` / `[Open Decide]` plus quiet `[Just write the spec]` |
| Ship, nothing green | `Nothing shipped yet. When a build is green, Ship stages the release and drafts the launch kit for your review.` (`faces.tsx:2227`) | **`Nothing shipped yet.`** / `Ship stages a release the moment a build goes green, and drafts the launch note for you.` / `[Open Build]` |

**Rule.** The upstream state always names the stage by its exact nav label, capitalised, and never says "earlier in the loop" or "upstream". A user should be able to click the word.

### 4.6 Filtered-empty (and search-no-match)

**Template**
```
[1] Nothing in this filter.        /  No match for "<query>".
[2] <The total that exists behind the filter>.
[3] Clear the filter               /  Clear search
```

| Surface | Now | Ship this |
| --- | --- | --- |
| Approvals, filter on | `Nothing in this filter.` (`approvals.tsx:225`) | Keep the line. Add [2] **`8 calls are waiting under other filters.`** and [3] `Clear the filter` |
| Admin people, search | `no users match` (`admin.people.tsx:142`) | **`No match for "raj".`** / `142 people in this workspace.` / `Clear search` |

**Rules.** The query is echoed back in straight double quotes, truncated at 24 characters with a trailing character-count-safe cut. Filtered-empty **never** offers the create action; the user is looking, not making. It always shows the count behind the filter, because that number is the whole reason the state is confusing.

### 4.7 Loading and refreshing

| State | What renders | Copy |
| --- | --- | --- |
| **loading** (first load) | Skeletons shaped like the real rows. Never a spinner, never a centered pulse blob. | **No copy at all.** A skeleton that says "Loading" is a skeleton that failed. |
| **loading past 6 seconds** | Skeletons stay, one mono line appears below | `Still fetching.` after 6s. `Still fetching. This is slower than usual.` after 15s. |
| **refreshing** (has data) | Data stays fully visible and interactive. A 2px indeterminate bar at the region's top edge. | No copy. Never dim the content, never swap to skeletons, never block the buttons. |
| **streaming** (a model is writing) | The shimmer treatment already in `today.tsx:301` | Present participle naming the actor and the artifact: `Drafting your brief`. Not `Drafting today's brief...` (ellipsis banned, and "today's" duplicates the surface name). |

**Screen readers.** `loading` sets `aria-busy` on the region; the 6-second line is `role="status"`. Never `role="alert"` for a load.

**Hard rule from the audit:** a hung server function must reach the error state, never sit on a permanent skeleton. `withTimeout` in `src/components/discover/format.ts` already does this at 15s and its message (`The server took too long to answer. Retry in a moment.`) is the canonical timeout string. Move it into the format module (§6.1) and use it everywhere.

### 4.8 Partial

The state nobody writes and everybody needs: four of five panels loaded, one connector timed out, three of nine agents reported.

**Template**
```
[1] <What did arrive, as a number.>
[2] <What did not, named, and whether it is coming.>
[3] Retry the rest        (only when a retry is scoped to the failed part)
[4] <the failure ref>
```

| Surface | Now | Ship this |
| --- | --- | --- |
| Today lanes, one lane failed | Whole region shows `The request failed.` (`today.tsx:1446`) | **`3 of 4 lanes loaded.`** / `Watch did not answer. Everything else is current.` / `[Retry Watch]` / meta `ERR 4F2A91` |
| Composite review, one angle silent | `No response from this angle.` (`CompositeReviewCard.tsx:75`) | **`2 of 3 angles reported.`** / `Risks did not come back in time. The draft and eval paths below are complete.` / `[Retry risks]` |

**Rules.** Partial never hides what arrived. Partial always names the missing piece by its user-facing name, never by an endpoint or a query key. If the missing piece would change the reader's conclusion (a spend total, a pass rate, a count), the number is suppressed entirely rather than shown incomplete, and [1] says so: `Spend is incomplete. One source did not report.`

### 4.9 Error

**Template**
```
[1] <Could not | Nothing was> <verb the user attempted>.
[2] <What is still true. What to do.>
[3] Try again
[4] <error ref, mono>
```

**The four error laws.**

1. **Say what did not happen, in the user's verb.** `Could not load the queue.` (`approvals.tsx:213`) is right. `Unknown error` (`build.index.tsx:95`) and `Forbidden` (`proof-surface.functions.ts:65`, `routing-console.functions.ts:125`, `observability.functions.ts:83,177,240`, `onboarding.functions.ts:40`) are raw server strings leaking to a human and must never reach the UI. Map every server error code to a UI sentence at the boundary.
2. **State what survived.** A failed write says so: `Nothing was changed.` (`admin.pricing.tsx:210` already does this, correctly).
3. **Never apologise, never blame.** No "Sorry", no "Oops", no "Something went wrong" (says nothing), no "Please try again" ("please" is filler).
4. **An error tied to a visible control renders inline next to that control, not as a toast.** §5.3.

| Surface | Now | Ship this |
| --- | --- | --- |
| Approvals load failure | `Could not load the queue.` + `Try again` | Keep [1] and [3]. Add [2] **`Your calls are safe. Nothing was answered.`** and meta `ERR 7C31A0` |
| Build detail load failure | `Unknown error` (`build.index.tsx:95`) | **`Could not open this build.`** / `The build is still running. Its steps will be here when the page loads.` / `Try again` / `ERR 2B9F04` |

**The error ref.** Every error state renders a six-character mono ref derived from the real correlation id, using the existing `traceRef()` helper (`format.ts`). It is the only machine string allowed in an error block, and it exists so a user can quote it in support without us exposing a UUID.

### 4.10 Blocked by a missing connection

Distinct from `empty`, because the user did nothing wrong and creating an item will not help. This is the highest-conversion state in the product and it is currently written five different ways (`repo: not connected`, `Not connected`, `not connected`, `coming soon`, `No repo to build in`).

**Template**
```
[1] <Stage> needs <a source | a repo> first.
[2] <What flows once connected.> <How long it takes.>
[3] Connect <the thing>
```

| Surface | Now | Ship this |
| --- | --- | --- |
| Build, no repo | `repo: not connected` (`build.index.tsx:524`) + dialog title `No repo to build in` | **`Build needs a repo first.`** / `Connect one and agents open pull requests against it. One click, no keys to paste.` / `[Connect a repo]` |
| Discover, no sources | `Connect a source and give it ten minutes.` (`DiscoverSurface.tsx:337`) | **`Discover needs a source first.`** / `Connect one and signals arrive on the next sweep, about ten minutes.` / `[Connect a source]` |

**Rules.** Never render the string `not connected` on its own; it is a status word, not a state. Never use `coming soon` (`ConnectionRow.tsx:168`) without naming the gate; if there is no gate, the honest string is `not built yet`. The connect action is always the single primary in this block, because it is the only thing that helps.

### 4.11 Permission denied

**Template**
```
[1] <Role> access only.
[2] <Who can grant it, and where.>
[3] <a request action, only if one really exists>
```

Never show a denied state where a hidden element would be kinder: if the user can **never** get access in this workspace, hide the surface entirely (IA's call). Render `denied` only when access is obtainable.

| Surface | Now | Ship this |
| --- | --- | --- |
| Admin console for a member | `Forbidden` (raw) | **`Admin access only.`** / `A workspace owner can make you an admin in Settings, People.` / no action |
| Revoke a token as a member | disabled with no reason | **`Admin access only.`** as the disabled reason on the control, per §3.7 |

**Never** say "You don't have permission to perform this action" (passive, 8 words of nothing), "Access denied" (security-theatre register), or "Contact your administrator" (which administrator, where).

### 4.12 Over quota

**Template**
```
[1] <What ran out>, exactly.
[2] <What still works.> <What resumes it.>
[3] <The one move that restores it>
```

The current banner (`BillingBanner.tsx:145`) reads `Running low: 12 AI credits left. Top up or upgrade so the loop keeps running.` That is close to right, and it becomes the pattern. Three thresholds, three registers:

| Threshold | Line | Placement |
| --- | --- | --- |
| Low (under 15% of the cycle) | `12 credits left.` / `Enough for about one more build. Top up when you want.` / `[Add credits]` | Dismissible strip, once per session |
| Out | `No credits left.` / `Reading and answering calls still work. Agents resume the moment you top up.` / `[Add credits]` | Persistent strip, not dismissible |
| Payment failed | `Your last renewal payment failed.` / `Your plan stays active for 7 days. Update your card to keep it.` / `[Update card]` | Persistent strip |

**Rules.** Never say "upgrade" as the only move when a top-up is available; the user picks the ladder rung, not us. Never quantify what a credit buys in a fixed number unless it is measured ("about one more build" is honest only if the median build cost supports it; if it does not, drop the sentence rather than invent it). Never nag: one strip, one dismiss, and it does not come back that session.

### 4.13 The honest capability gap (the ceiling)

The founder's rule: marketing may omit, never invent. Inside the app the bar is higher, because the user is about to rely on it. **State the ceiling before the user reaches it, next to the control that would otherwise imply the capability.**

**Template**
```
<What it does>. <What it does not do, in the same breath, naming who does it.>
```

Two sentences, second one short. Placed as helper text under the control. Never in a tooltip. Never in a modal that can be skipped. Never after the fact.

| Where | Ship this |
| --- | --- |
| Launch note, after Ship stages a release | `Ship drafts the launch note. You post it. Supaprod holds no publishing keys.` |
| Stakeholder update | `Drafted and ready to send. Nothing sends itself, ever.` |
| Build, on the PR | `Agents open the pull request. A human merges it.` |
| Any agent with `draft-to-you` posture (`ControlsPanel.tsx:44`) | `<Agent> drafts. You send.` |

**Anti-patterns, banned.** `Coming soon` without a named gate. `Beta` as an excuse. `Not yet supported` (passive, and "yet" without a date is a promise we did not make). `Currently unavailable`. `We're working on it`.

**Positive form.** The ceiling sentence is never an apology. It is a boundary the user should want: `Nothing sends itself, ever.` is a feature.

### 4.14 The state matrix at a glance

| State | State line ends in | Action allowed | Warmth allowed | Meta line | `aria-live` |
| --- | --- | --- | --- | --- | --- |
| empty | `yet.` or a period | Yes, the create verb | No | No | off |
| zero | period | No | **Yes** | Yes, a receipt | polite |
| upstream | `yet.` | Yes, link tier to the stage | No | No | off |
| filtered | period | Yes, `Clear the filter` | No | The count behind the filter | polite |
| loading | no copy | No | n/a | No | busy |
| partial | period | Yes, scoped retry | No | Error ref | polite |
| error | period | Yes, `Try again` | No | Error ref | assertive |
| blocked | `first.` | Yes, connect | No | No | polite |
| denied | `only.` | Rarely | No | No | polite |
| quota | period | Yes, restore | No | Balance | assertive |
| ceiling | period | No (it is helper text) | No | No | off |

---

## 5. Notifications, toasts, and confirmations

### 5.1 Which channel

| The message is... | Channel | Persists |
| --- | --- | --- |
| The result of something the user just clicked, and the screen does not already show it | **Toast** | 4s |
| The result of something the user just clicked, and the screen **does** show it changing | **Nothing.** The change is the feedback. | n/a |
| A failure of a specific control | **Inline, next to that control** | Until resolved |
| A condition affecting the whole workspace (quota, payment, incident) | **Strip banner** under the top bar | Until resolved |
| Something that needs a decision before proceeding | **Confirm dialog** | Modal |
| Something that happened while the user was away | **Today's brief + the receipts strip** | Until read |
| Something that needs them back in the app | **Out-of-app notification** | Per their settings |

**Ban:** info toasts that carry no action and no undo. If it is worth interrupting for, it is worth a banner; if not, it is worth nothing. `toast("Drafting the spec. Lands in Plan when ready.")` (`OpportunityQueue.tsx:291`) is the correct exception, because it names a destination the user cannot see.

### 5.2 Toast grammar

**Template:** `<Object> <past-tense verb>. <One consequence worth knowing.>`

| Rule | Detail |
| --- | --- |
| Tense | Past. The act is done. `Saved.` never `Saving complete`. |
| Length | 10 words total. 6 in the state sentence, 4 in the consequence. |
| Subject | The object, not the system. `Build deleted.` not `We deleted the build.` |
| Consequence | Only when something non-obvious survives or unblocks. `Its decisions stay on the record.` `The agent is unblocked.` |
| Punctuation | Full stops. No exclamation. No ellipsis. |
| Count | One toast per user action. Batch operations toast once, with the count. |
| Dedupe | Same message inside 2s collapses; the toast shows `x2`. |
| Duration | 4s plain, 8s with an action, errors persist until dismissed. |

Current toasts, audited:

| Now | Verdict |
| --- | --- |
| `Approved. The agent is unblocked.` (`today.tsx:615`) | **Keep.** This is the model for the whole product. |
| `Sent back. Nothing runs without you.` (`today.tsx:616`) | **Keep.** |
| `Set aside. It returns in 24 hours.` (`today.tsx:647`) | Keep the sentence, but the button must become `Later` -> toast `Set aside.` is a verb mismatch. Fix: button `Later`, toast **`Later. It returns in 24 hours.`** |
| `Rejected. Noted for next time.` (`approvals.tsx:41`) | **Kill.** `Reject` is banned (§3.4). Becomes `Sent back. Nothing runs without you.` or `Declined. The original decision stands.` |
| `Saved to workspace memory.` (`approvals.tsx:32`) | **Rewrite.** "memory" is a banned noun. `Saved to the Brain.` |
| `Mission deleted. Its decisions stay in Memory.` (`build.index.tsx:645`) | **Rewrite.** `Build deleted. Its decisions stay on the record.` |
| `Balance now 1,234` (`admin.people.tsx:362`) | **Rewrite.** No verb, no period, and it is a number not a sentence. `Credits granted. Balance is 1,234.` |
| `Saved.` / `Key saved` / `Removed` / `Profile saved` / `Default model saved` | **Normalise.** All become `<Object> saved.` with a period. `Removed` becomes `Key deleted.` (it is not reversible, §3.6). |
| `Payment received. Your plan will reflect within a minute.` (`settings.tsx:561`) | **Rewrite.** "will reflect" is corporate. `Payment received. Your plan updates within a minute.` |
| `Brief saved, next mission uses the new context` (`settings.tsx:3016`) | **Rewrite.** Comma splice, no period, banned noun. `Brief saved. The next build uses it.` |
| `Check your email for the reset link` (`forgot-password.tsx:46`) | **Rewrite.** `Reset link sent. Check your email.` |

### 5.3 The success-toast-for-an-error bug

`approvals.tsx:148` calls `toast.success(e.message)` inside `onError`. A failed decision renders as a green success toast carrying a raw server message. This is a real defect in the highest-stakes flow in the product. Fix at the same time as the copy:

```
onError: (e, vars, ctx) => {
  if (ctx?.prev) qc.setQueryData(queueKey, ctx.prev);
  toast.error("Could not record that call. It is still in your queue.");
}
```

The raw `e.message` never reaches a toast. Map it at the boundary or drop it into the error ref.

### 5.4 Undo instead of confirm

**Law: if the action is reversible server-side within 10 seconds, do it and offer Undo. Do not ask first.**

Confirm dialogs are a tax. They exist only for irreversible acts and wide blast radius. Everything archivable, detachable, dismissible, or draft-level gets the Undo path.

| Undo toast | Duration | Action label |
| --- | --- | --- |
| `Build archived.` | 8s | `Undo` |
| `Signal dismissed.` | 8s | `Undo` |
| `3 calls set aside.` | 8s | `Undo` |

Undo restores exactly and silently. It never toasts back ("Restored." is noise; the row reappearing is the feedback).

### 5.5 The confirm dialog pattern

**Anatomy, fixed.**

```
TITLE    A question. Names the verb, the object, and the count. Max 8 words.
BODY     One sentence. What the act destroys, and what survives. Max 20 words.
CANCEL   Always the word "Cancel". Never "Nevermind", "Go back", "Keep it".
CONFIRM  The destructive verb plus the object. Never "Confirm", "Yes", "OK", "Delete" alone.
```

| Now | Ship this |
| --- | --- |
| `Delete this mission?` (`build.index.tsx:965`) / no body / `Delete mission` | Title **`Delete this build?`** · Body **`The build and its steps are gone. Its decisions stay on the record.`** · `Cancel` · `Delete build` |
| `Dismiss this proposed playbook?` / `This dismisses the proposal for good. The same lesson will not be proposed again.` / `Dismiss for good` (`today.tsx:741`) | Title **`Decline this playbook?`** · Body **`It will not be proposed again. The learnings behind it stay on the record.`** · `Cancel` · `Decline playbook` (aligns to the verdict verbs, §3.4) |
| `Confirm rotate?` (`sync.tsx:761`) | Title **`Rotate this token?`** · Body **`The old token stops working immediately. Anything using it will fail until you paste the new one.`** · `Cancel` · `Rotate token` |
| `Revert to the previous version?` (`RewindButton.tsx:65`) | Title is correct. Add body: **`The current version stays on the record. You can roll forward again.`** Confirm: `Revert version` |

**Typed confirmation** is required, and only required, when the act (a) deletes a workspace, (b) revokes a credential other people depend on, or (c) destroys more than 10 objects at once. The user types the **object's own name**, never the word `DELETE`. The existing `typedConfirm` prop in `use-confirm.tsx` already supports this; its label becomes `Type <name> to confirm` (it already is, keep it).

**Never** put a checkbox ("I understand this cannot be undone") in a confirm dialog. If the body sentence is not enough, the body sentence is wrong.

### 5.6 Out-of-app notification grammar

Subject lines follow: `<Who> <did what>. <What it needs from you.>`

| Kind | Subject | Body first line |
| --- | --- | --- |
| A call needs judgment | `Engineer needs your call on checkout retries.` | `Approve, send back, or set it aside.` |
| A build finished | `Build finished: guest checkout.` | `12 files changed. The pull request is open.` |
| A build failed | `Build stopped: guest checkout.` | `Tests failed on the second step. Nothing merged.` |
| Digest | `3 calls waiting, 1 build shipped.` | `The rest ran itself.` |

No notification ever begins with the product name. No notification uses "Reminder:". No notification is sent for something the user did themselves.

---

## 6. Numbers, dates, times, durations, counts

The founder treats timestamps as copy and checks them for plausibility. That makes this section a correctness surface, not a formatting preference.

### 6.1 One module, and the eleven implementations it kills

There is no shared formatter today. There are at least eleven independent implementations of "how long ago", each with different thresholds, rounding, and casing:

`relTimeCaps` (`components/discover/format.ts:17`) · `shortTime` (`components/ink/ApprovalCard.tsx:34`) · `expiryLabel` and `expiredAgo` (`components/today/triage.ts:49,68`) · `StageTimeline.tsx:32` · `MissionOrchestratorDetail.tsx:122` · `build.$missionId.tsx:145` · `ask-blocks.tsx:64` · `MembersCard.tsx:52` · `SessionTimeline.tsx:32` · `DecisionCard.tsx:393` · `MeetingsRow.tsx:22` · plus 14 bare `toLocaleDateString()` call sites. Two files even define their own `const plural = (n) => (n === 1 ? "" : "s")` (`ThemeRow.tsx:28`, `ThemeDetail.tsx:53`).

**Ship `src/lib/format/` with exactly these exports. Nothing else formats a number or a date.**

```ts
relTime(iso, now?)        // "just now" | "12m ago" | "4h ago" | "3d ago" | "Jul 21"
until(iso, now?)          // "in a moment" | "in 12m" | "in 4h" | "in 3d" | "on Jul 21"
absDate(iso, opts?)       // "Jul 21" | "Jul 21, 2025" | "Jul 21, 14:20"
duration(ms, opts?)       // "48s" | "12m" | "1h 20m" | "2d 4h"
elapsed(startIso, now?)   // "running 12m"
count(n, one, many?)      // "1 spec" | "3 specs"
list(parts)               // "a, b, and c"
money(usd)                // "$0" | "<$0.01" | "$4.20" | "$1,240"
credits(n)                // "1,240 credits"
pct(num, den)             // "42%" | "3 of 4" when den < 5 | null when den === 0
ms(n)                     // "150ms" | "1.2s"
traceRef(id)              // existing, moves here unchanged
```

**The mono caps chip form is CSS, not a second function.** `relTimeCaps` is deleted; the chip applies `text-transform: uppercase` to `relTime()`'s output. That single change removes a whole class of "the chip says 12M AGO and the row says 11m ago" drift.

### 6.2 Relative time

| Delta from now | Output | Notes |
| --- | --- | --- |
| Future by more than 2 minutes | `until()` forms below | A "created" field in the future is clock skew, not the future |
| Future by up to 2 minutes, on a past-event field | `just now` | Never render a negative, never `in 1m` for something that already happened |
| 0 to 44 seconds | `just now` | **Seconds are never shown in a relative time.** No `12s ago`. |
| 45s to 59m | `12m ago` | Floor, minimum 1. Never `0m ago`. |
| 1h to 23h | `4h ago` | Floor, not round. `1h 59m` reads `1h ago`, never `2h ago`. |
| 24h to 6d | `3d ago` | Floor |
| 7d and beyond, same calendar year | `Jul 21` | Relative stops. Nobody counts 34 days. |
| 7d and beyond, prior year | `Jul 21, 2025` | Year appears only when it differs from now |
| Invalid, missing, or unparseable | **render nothing, and collapse the slot** | Never `Invalid Date`, never the raw ISO, never `-` |

`shortTime` in `ApprovalCard.tsx` currently **rounds** (`Math.round`), so a 31-minute-old call reads `1h ago`. `relTimeCaps` **floors**. Floor wins everywhere: overstating age makes a fresh call look stale, which is a judgment error, not a cosmetic one.

**Future forms** (`until`): `in a moment` (under 60s) · `in 12m` · `in 4h` · `in 3d` · `on Jul 21` (7d+).

**Live updating.** Any relative time visible for more than 60 seconds re-renders on a shared 30-second tick. A frozen `12m ago` that is actually three hours old is a lie the founder will catch. If a surface cannot tick, it uses `absDate` instead.

### 6.3 Absolute dates and clocks

| Case | Format | Example |
| --- | --- | --- |
| Date, current year | `MMM d` | `Jul 21` |
| Date, other year | `MMM d, yyyy` | `Jul 21, 2025` |
| Date with time | `MMM d, HH:mm` | `Jul 21, 14:20` |
| Time only, today | `HH:mm` | `14:20` |
| A day header in a schedule | `EEEE, MMM d` | `Tuesday, Jul 21` |

**24-hour clock everywhere.** The codebase currently mixes `hour12: false` (`build.$missionId.tsx:145`, `StageTimeline.tsx:32`) with 12-hour (`AskPanel.tsx:115`, `MeetingsRow.tsx:22`, `DecisionCard.tsx:393`). Pick 24: it is unambiguous for a distributed team, it is fixed-width in tabular numerals, and it matches the console register.

**Timezone.** Everything renders in the viewer's local zone. Any surface where the zone is load-bearing (a schedule, a meeting, a cron, a cycle anchor) appends the zone abbreviation once per region, not per row: `All times in IST`. Never render an unlabelled UTC timestamp to a human.

**No weekday names** outside schedule day headers. No `Today` / `Yesterday` words mixed into a list that also uses dates; pick one form per column.

### 6.4 Durations

| Length | Format | Example |
| --- | --- | --- |
| Under 60s | `<n>s` | `48s` |
| 1m to 59m | `<n>m` | `12m` |
| 1h to 23h | `<n>h <n>m`, second unit dropped when zero | `1h 20m`, `2h` |
| 24h and over | `<n>d <n>h`, second unit dropped when zero | `2d 4h`, `3d` |
| Still running | `running <duration>` | `running 12m` |

**Never** three units (`1h 20m 14s`). **Never** a decimal duration (`1.5h`). **Never** a bare number for a running span; a span with a start and no end is `running`, or it is nothing.

**The plausibility gate.** The founder's standing example: a 3-minute build "makes no logical sense". A duration that reads implausible destroys trust in every other number on the screen. Rule: each object type carries a display floor. Below the floor, render the **phase name**, not the number.

| Object | Floor | Below the floor, render |
| --- | --- | --- |
| A build (dispatch to PR open) | 8m | `starting` |
| A spec draft | 40s | `drafting` |
| A research sweep | 30s | `sweeping` |
| A single agent step | 5s | `running` |

These floors are display honesty, not fake padding: we never inflate a number, we withhold one that would misrepresent the work. Tune the floors against real p10 data before launch and record the measured values next to this table. If real data says builds genuinely finish in 3 minutes, the floor drops and the number ships. Withholding is allowed; inventing is not.

### 6.5 Counts, singular, plural, zero

**One helper: `count(n, one, many?)`.** Regular plurals derive by appending `s`; irregulars pass the second form explicitly (`count(n, "opportunity", "opportunities")`). The 25-plus inline ternaries and the two local `plural` consts all go.

| n | Output | Rule |
| --- | --- | --- |
| 0 | **A sentence, not a number.** | Zero is a state, and the state block owns it (§4.4). Never `0 specs`, never `No specs (0)`. |
| 1 | `1 spec` | Digit, not the word "one", in any string that also shows other counts. |
| 1, standing alone in prose | `One call is waiting.` | The word, when it is the only number in the sentence and the sentence is prose. |
| 2+ | `3 specs` | |
| 1,000+ | `1,240 specs` | Locale grouping via `Intl.NumberFormat`. Tabular numerals in any column. |
| 10,000+, in a stat tile or chart axis only | `12.4K` | **Never compact form inside a sentence.** |

**Numeric zero is allowed in exactly two places:** a metric tile where the axis is the point (`$0`, `0 failures`), and a filter chip count (`Gates 0`). Everywhere else zero is prose.

**Counts are exact or absent.** Never round a count, never approximate one, never say "about 40 signals". Rounding is for measures (money, latency, percentages), never for things you could have counted.

**Truncated lists:** `+3 more`. Never `and 3 others`, never `...`.

**Verb agreement** ships with the count, from the same helper call site, because it is the same decision: `count(n, "call waits", "calls wait")`. `faces.tsx:2496` already does this correctly; make it the only pattern.

### 6.6 Money, credits, percentages, latency

**Money.** `$0` at exactly zero · `<$0.01` below a cent · two decimals under $1,000 (`$4.20`) · whole dollars at $1,000 and above (`$1,240`, never `$1,240.00`). The existing `fmtUsd` (`today.tsx:115`) is right for the first three; add the fourth and move it into the format module.

**Credits are counts, not money.** `1,240 credits`. Never a `$` on a credit. Never a decimal credit. The two live side by side in Settings and the distinction has to be visible at a glance.

**Estimates** carry a mono `est.` prefix in the meta line: `est. $0.40`. Never a tilde in prose. An estimate never appears in a success sentence.

**Percentages.** Integer by default. One decimal only below 10% and only when the extra digit changes a decision. **A percentage on a denominator under 5 is banned**; render the fraction: `3 of 4`, not `75%`. `0%` and `100%` are written as prose in any human-facing sentence, per the founder's recorded taste (`every reviewed bet held up` beats `100.0% validated`); the digits survive only in a chart or a stat tile where the axis carries the meaning.

**Latency and token counts** are mono meta, never prose: `150ms`, `1.2s`, `4.1K tokens`. They never appear in a toast (§3.3, the `Key works (150ms)` fix).

### 6.7 The plausibility checklist (run before shipping any surface with numbers)

1. Does every relative time floor rather than round?
2. Does any timestamp render in the future for a past event?
3. Does any duration fall below its object's floor?
4. Does any count render as `0`?
5. Does any percentage sit on a denominator under 5?
6. Does any number update on a tick, or is one frozen at first paint?
7. If a source failed, is any total still showing as if complete? (§4.8)
8. Does a mono chip and its adjacent prose ever disagree about the same instant?

---

## 7. Ban list and lint

### 7.1 Strings banned outright in the authenticated app

| Banned | Why | Use instead |
| --- | --- | --- |
| `Reject` / `Rejected` | Not one of the three verdicts | `Send back` or `Decline` |
| `mission` / `run` / `session` / `changeset` (user-facing) | Five nouns for one object | `build` |
| `memory` / `knowledge base` (as the store) | Three homes for one concept | `the Brain` |
| `artifact` | Engineering jargon | name the type, or `the Library` |
| `Pulse` (as a destination) | Vague category word | `the engine room` |
| `Cadence` (as the product) | Retired 2026-07-17 | `Supaprod` |
| `PostHog`, `Sentry`, `Stripe`, `Notion`, `Linear`, `Jira`, `Lovable`, `OpenAI`, `Anthropic` in body copy | Founder rule: no vendor names, including as analogies | Name the outcome. `No data yet. Refresh to pull the latest.` fixes `ProductAnalyticsPanel.tsx:210`. Provider names survive only as a connector's own row label and in admin-only credential fields. |
| `operating system`, `chatbot`, `copilot`, bare `AI`, bare `agents` | Vague category words | Qualify: `agents that ship real code` |
| `Something went wrong` / `Unknown error` / `Forbidden` / `Oops` / `Sorry` | Says nothing, or leaks a server string | §4.9 |
| `Are you sure?` | Hedge, no information | Name the act (§5.5) |
| `Confirm` / `OK` / `Yes` as a button | Names the mechanism | The verb of the act |
| `Please` | Filler | Drop it |
| `Coming soon` without a named gate | An invented promise | `not built yet`, or name the gate |
| `Loading...` / `Please wait` | Skeletons say it better | No copy (§4.7) |
| Em dash, en dash, `...`, `...`, invisible Unicode | Machine fingerprints | Period, comma, colon, parentheses, line break |
| Trailing `!` | Banned | Period |
| Title Case On Buttons | Banned | Sentence case |

### 7.2 Lint rules to wire (extends `scripts/check-humanized.sh`)

| Rule | Check |
| --- | --- |
| `no-banned-nouns` | grep the §7.1 nouns in JSX text and string literals under `src/components`, `src/routes` |
| `no-ellipsis` | any `...` or `\.\.\.` in a UI string |
| `no-raw-date-format` | any `toLocaleDateString` / `toLocaleTimeString` / `Intl.DateTimeFormat` outside `src/lib/format/` |
| `no-inline-plural` | any `=== 1 ? "" : "s"` outside `src/lib/format/` |
| `no-title-case-button` | two or more capitalised words in a `<Button>` child, excluding known proper nouns |
| `disabled-needs-reason` | a `disabled={...}` on a `<Button>` with no `title` and no `aria-describedby` |
| `no-toast-success-in-onerror` | `toast.success` inside an `onError` callback |
| `no-vendor-in-copy` | the §7.1 vendor list in JSX text, allowlisted per connector row |

The first four are mechanical and should block. The rest warn.

---

## 8. Engineering handoff

### 8.1 New files

| Path | Contents |
| --- | --- |
| `src/lib/format/index.ts` | The twelve exports in §6.1. Pure, no React, unit-tested against the tables in §6.2 to §6.6. |
| `src/lib/copy/verdicts.ts` | The four verdict rows (§3.4) as the single source for labels, toasts, and keyboard hints. |
| `src/lib/copy/states.ts` | Per-surface state copy keyed by `(surface, StateKind)`, so a state's four slots live in one place and can be reviewed as a set. |
| `src/components/state/StateBlock.tsx` | The one state primitive (§4.1). Absorbs `WarmSlot`. |

### 8.2 Deletions and rewrites

| Delete | Replaced by |
| --- | --- |
| `relTimeCaps` (`discover/format.ts:17`) | `relTime()` plus CSS uppercase |
| `shortTime` (`ink/ApprovalCard.tsx:34`) | `relTime()` |
| `expiryLabel`, `expiredAgo` (`today/triage.ts`) | `until()`, `relTime()` |
| the local `plural` consts (`ThemeRow.tsx:28`, `ThemeDetail.tsx:53`) | `count()` |
| the 14 bare `toLocaleDateString()` sites | `absDate()` |
| `WarmSlot` | `StateBlock` with `sample` |
| `TOAST_APPROVE` / `TOAST_REJECT` (`approvals.tsx:29,41`) | `src/lib/copy/verdicts.ts` |

### 8.3 The five defects this sweep also fixes

1. `approvals.tsx:148` renders a failure as a success toast with a raw server message (§5.3).
2. `Forbidden` reaches the UI from six server modules with no mapping (§4.9).
3. The Later button and its toast use different verbs, so the user cannot describe what they did (§3.4, §5.2).
4. `shortTime` rounds and `relTimeCaps` floors, so the same instant reads two ages on one screen (§6.2).
5. `ProductAnalyticsPanel.tsx:210` names a vendor in user copy, against a standing founder rule (§7.1).

### 8.4 Definition of done for a rebuilt surface

- [ ] Every button label appears in §3 or follows §3.2 and §3.3.
- [ ] Every disabled control carries a reason from §3.7.
- [ ] All eleven applicable states render through `StateBlock`, and each was viewed in the running app.
- [ ] The zero state and the empty state are different strings.
- [ ] The upstream state names its stage by the exact nav label.
- [ ] No date, time, duration, count, money, or percentage is formatted outside `src/lib/format/`.
- [ ] The plausibility checklist (§6.7) passes.
- [ ] `rg " - | - |...|\.\.\."` over the changed files returns zero.
- [ ] No noun from the §7.1 ban list survives.
- [ ] The cold-read test (§1) passes on every state line.
