# Design direction — the workbench, ruled

> _MAIN LANE, 2026-08-25. This is a ruling, not a proposal. LANE 0 and LANE 1 build against it._
> _**The reference images are committed to [`../design-reference/mobbin-2026-08/`](../design-reference/mobbin-2026-08/)
> because LANE 0 and LANE 1 have no Mobbin access.** Open the files; do not work from prose alone._

## The ruling in one paragraph

**Supaprod is one composer and one workbench, and the workbench always has a live preview pane.**
A person types one sentence. A run opens. On the left, what the agent is doing right now, as steps
with state and a clock. On the right, **the thing being made, previewed live and acted on in place**.
When the run needs a person, it asks **in the run**, inline, with the consequence named. Everything
else in this product is Settings.

**What we are rejecting, and why.** The 2026-08-24 artifact *"Supaprod, Reimagined"* designed a
morning briefing: regions titled *Needs you · At risk · What to build next · What got recorded ·
Nothing is running*, one of which reads **"The crew is idle, and that is fine."** It is a beautiful
read-only status board for a machine you cannot touch. The founder's objection is correct and it is
the whole point: **it shows you the state of the machine instead of letting you drive it.** A surface
whose best moment is telling you nothing is happening has the product backwards.

---

## 1. The preview pane. This is the non-negotiable part.

**Founder ruling, 2026-08-25:** *"whatever happens in this platform, there has to be some sort of
preview pane... whatever decision or activity is being made with Plan, Builder, Ship, everything is
live previewed... real-life preview and inline action needs to be taken, and that's how the user
could actually feel they're getting value."*

**So every station previews its own output, and every preview accepts an action in place.**

| Station | What previews on the right | The inline action |
| --- | --- | --- |
| sense | the signals as they land, grouping into themes as they cluster | keep / discard a signal; rename a theme |
| decide | **the decision as it is written, with the forecast as a live editable field** | edit the claim, the observable, the date; accept |
| define | the spec, section by section, as it is written | edit a section; ask for one to be redone |
| design | the PRD / the surface brief | same |
| build | the diff and the checks as they run, with per-step state | approve the PR; send one instruction back |
| ship | the deploy steps with a live clock | hold; roll back |
| learn | **predicted X · actually Y · what we now believe** | agree / disagree with the grade |

**The rule that keeps it honest:** the pane renders a row the run actually wrote. It never renders an
optimistic guess. A station that has produced nothing yet says so plainly.

## 2. The references. Open these.

****Emergent** — `design-reference/mobbin-2026-08/emergent-live-steps.webp`** — take the right pane
almost exactly. A live checklist: `✓ Environment Ready` · `⟳ Building Package… 04:29` · `○ Migrate
Database` · `○ Deploy`. Per-step state, a running clock on the active one, everything ahead visibly
pending. **That is our seven stations, correctly drawn**, and it is what `RunMap` in `live` mode
should look like. Left pane: tool results as cards (`Created /app/auth_testing.md`), and the honest
line *"Agent has been paused"* rendered as a step rather than hidden.

****Cofounder** — `design-reference/mobbin-2026-08/cofounder-inline-question.webp`** — **the single most
important reference in this document.** The transcript shows `Ran 3 actions` → `Running Tool: Ask
User Question` → `Waited for the user's answer`, and then the question appears **inline in the run**:
*"How would you like to proceed with the LinkedIn adaptation?"* with named options, one marked
`Recommended`, a free-text "Something else", and three controls: **`Decide all` · `Decide this one` ·
`Submit`**.

**`Decide all` vs `Decide this one` is the detail to steal.** Our 90 dead `cluster.trigger` gates were
90 instances of the same question. A person answering one should be able to answer the class. That
one control is worth more to us than any layout.

****Lindy** — `design-reference/mobbin-2026-08/lindy-steps-and-tabs.webp`** — the completed-steps
checklist inside the transcript with `Processing…` on the live one, and a right pane that switches
`Browser | Terminal`. Take the tabbed right pane: our preview needs the same, because a station's
output is sometimes a document and sometimes a diff.

****Fabric** — `design-reference/mobbin-2026-08/fabric-artifact-primary.webp`** — artifact primary, agent
secondary in a right rail with `Comments · Info · Ask`, an AI summary card, and quick-action chips.
**Take the inversion when the run is finished**: while it runs, the transcript leads; once it settles,
the artifact leads and the agent becomes a rail you ask things of.

****StackAI** — `design-reference/mobbin-2026-08/stackai-version-history.webp`** — version history as a
first-class panel, `v0…v5`, each stamped, one marked `Live`, one `Draft`. **We version a decision, not
a document**, so this is where our forecast lives: the claim, its horizon, and later its verdict, as
versions of one call.

****Framer** — `design-reference/mobbin-2026-08/framer-canvas-agent.webp`** and
****Mistral** — `design-reference/mobbin-2026-08/mistral-live-preview.webp`** — both put the live
preview where the eye lands and the controls at the edge. Confirms the ratio: **preview gets the
larger share of the screen, not the chat.**

## 2b. Illustration: the register, and what we refuse

`sentry-restrained-illustration.webp` is our register — loose line-art objects, small, beside the
content rather than performing at it. **Duolingo, Hootsuite and Homerun mascots are rejected on
purpose.** Our buyer is a tech lead accountable for merging output they did not write; a cartoon
greeting that person while an agent edits their repo reads as the product being pleased with itself,
and costs exactly the trust we need most. **The distinctiveness budget goes into the run moving** — a
step changing state, a timer ticking, a question appearing where the work is. Reasoning in
[`../design-reference/mobbin-2026-08/README.md`](../design-reference/mobbin-2026-08/README.md).

## 2c. The Mistral set — structure, not styling

`design-reference/mobbin-2026-08/mistral-*.webp`, five screens, and it answers three things we were
still guessing at. Full notes in that folder's README.

- **The preview pane is always present and labelled, even when empty** (*"Preview your agent here"*).
  It never collapses. Our right pane does the same: a station that has produced nothing shows the
  pane with an honest line, never a hole.
- **The empty state IS the input.** `Add guardrails` and `Adjust tone` are dotted-underline
  placeholders you click to fill. **This is the answer for the four stations where "produced nothing"
  is the common case** — the empty state becomes the invitation to supply what was missing, instead
  of an apology.
- **Versioning is present before anyone asks** — `v2 · Latest`, `Save` / `Reset` / `Restore this
  version`, a green `Saved`. **That is the chrome for our forecast card**, where the versioned thing
  is a decision rather than a document, which is the one version history a competitor cannot copy.
- **And the rail is grouped by VERB** — Create · Improve · Context · Code — not by object. Ours is
  Today · Approvals · Runs · Brain · Threads · Guardrails, which is our object model shown to a
  customer: the same mistake as the station menu R-01 killed. **This is how 84 routes become nine.**

## 3. What this means against Meridian and beautifui.dev

- **Meridian is the only system and it is not negotiable.** Tokens only: `--mrd-*`. No raw colour, no
  retired token. If the preview pane needs a primitive Meridian lacks — a step row with a live timer,
  a version chip, an inline question card — **file a request. That is a real Meridian gap and MAIN
  will build it in `src/components/meridian/`.** Never widen the baseline to pass.
- **The bar is beautifui.dev exactly, and it is a floor, not an inspiration.** Port mechanics from
  real source, never from a screenshot.
- **Restraint on colour stands.** One colour for the fact the person came for — what is live now.
  Everything settled is quiet. The brand ember stays in the logo and never in an interaction state.
- **Motion:** enter instantly, exit gently. A step going pending → running → done must read as
  movement, not a repaint. Use Meridian's existing `--ease` / `--d-*` tokens; a raw duration is a bug.

## 4. What LANE 1 and LANE 0 each own here

**LANE 0** builds the panes: the step list (Emergent), the inline question card (Cofounder), the
preview surface and its tabs (Lindy), the version/forecast chip (StackAI). All in
`src/components/track/**` and `src/components/**` outside `meridian/` and `shell/`.

**LANE 1** builds the frame: the two-pane layout and its responsive collapse, the route, the composer
that starts a run and lands the person on it, and the rail reduction. `src/routes/**`,
`src/components/shell/**`, `src/styles/**` except `meridian.css`.

**MAIN** rules, and builds any missing Meridian primitive when a lane files for one.

## 5. The test every screen must pass

**Can the person do something here, or are they only being told something?** If a surface only tells,
it is a panel on the briefing dashboard we just rejected, and it does not ship.
