# AI interfaces

> The surface where a person and an agent do work together: ask, watch it think and act,
> step in when it needs a decision, and check its receipts afterward. Every part here earns
> trust by being legible, not by being decorated.
>
> Extension — base: Geist `Button`, `Badge` (+ its `Status Dot`/Pill guidance), `Code Block`,
> `Loading Dots`, `Combobox`, `Entity`/`EntityList`, `Description`, `Context Card`, `Error`,
> `Error Card`, `Collapse`/`CollapseGroup`, `Drawer`, `Avatar`, `Empty State`, `Copy Button`,
> the `material-*` presets and `--ds-*` color/typography tokens · inspiration: Anthropic
> Claude's interface restraint (paraphrased principle: the assistant's own words are the
> content, so they render as plain text with no bubble or card fighting for attention;
> chrome is reserved for the user's own turn and for machinery the person must act on),
> Perplexity's citation/receipt presentation (paraphrased principle: a claim and its source
> are never more than one click apart, and the source is named before it is trusted),
> Vercel AI SDK UI primitives (paraphrased principle: a growing stream of text is its own
> progress indicator — don't lay a second spinner over text that is visibly still arriving).

This pattern covers eight parts that recur across every agentic surface in Cadence: the
**Ask surface** (composer + message list), **streaming output** (text / code / artifacts),
the **agent run timeline**, the **HITL gate card** (Approve / Send back / Challenge), **receipts
& trust evidence**, **model & tool pickers**, **error & retry**, and **cost & time
indicators**. They are documented together because they share one anatomy grammar, one
color law, and one motion system, and because a real screen usually composes four or five
of them at once (see Usage examples).

## Anatomy

### 1. Ask surface — composer + message list

```
┌ message list (scrollable, flex column, gap 24px) ───────────────────────────┐
│                                                                              │
│                                    ┌─ user turn ─────────────────────────┐  │
│                                    │ Draft the onboarding email for the  │  │
│                                    │ new workspace flow.                 │  │
│                                    └──────────────────────────────────────┘  │
│  ⬡ Cadence · 09:41                                                          │
│  Here is a draft. I pulled tone from your last three                       │
│  announcements. [1]                                                        │
│                                                                              │
│  ┌ code block ───────────────────────────────────────────────────────────┐  │
│  │ email.md                                                    [Copy]    │  │
│  │ 1  Subject: Your workspace is ready                                   │  │
│  │ 2  ...                                                                │  │
│  └────────────────────────────────────────────────────────────────────── ┘  │
│                                                                              │
│  Sources  [1 · design-anatomy.md]  [2 · #announcements]                    │
│  Cadence 4.0 mini · gateway   1.4s   1.1k in / 340 out   $0.0021           │
│  [👍][👎]  View trace  Replay with…                                        │
└──────────────────────────────────────────────────────────────────────────── ┘
┌ composer (sticky bottom, material-medium) ──────────────────────────────────┐
│  [ chip: email.md ✕ ]                                                      │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Ask Cadence…                                                       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│  [ ⌘ model: Cadence 4.0 mini ▾ ]   [ tools: 3 connected ▾ ]      [ Send ]  │
└──────────────────────────────────────────────────────────────────────────── ┘
```

- **User turn** — a contained surface: `--ds-gray-100` fill, `--ds-radius-medium`, right-leaning
  max-width (~70% of the column), no avatar. This is the one bubble in the whole surface;
  it exists so a scanning eye can find "what did I ask" without reading every line.
- **Assistant turn** — plain text directly on `--ds-background-100`, no card, no border, no
  fill. Leads with a role marker: the pixel "C" monogram or a 16px lucide icon in
  `--ds-gray-900`, the label "Cadence" (`text-label-13`, `--ds-gray-900`), and a mono
  timestamp trailing (`text-label-12-mono`, `--ds-gray-700`). This is the restraint law in
  practice: the answer is the content, so nothing competes with it for weight.
- **Meta footer** — one row per assistant turn: sources chips (if any), then a mono-figures
  strip (model · route, latency, tokens in/out, cost), then feedback thumbs, "View trace,"
  and "Replay with…" (see Cost & time indicators and Model & tool pickers below). Always the
  last thing in a turn, never interleaved with the answer body.
- **Composer** — pinned to the bottom of the surface, `material-medium`, sits above the
  message list with no gap so it reads as one continuous input tray. Top-to-bottom: an
  optional attachment/context-chip row (Pill-composed, removable), the auto-growing textarea
  (1 to 8 lines, then internal scroll), and a control row with the model picker on the left,
  the tool/connector picker beside it, and Send (or Stop, while streaming) on the right.
- **Empty state** — before the first turn, the message list renders an `EmptyState`
  (`research/empty-state.md`'s "Guide" framing): one small geometric composition (identity
  layer budget), a title ("Ask Cadence anything"), a description naming what it can do for
  _this_ workspace specifically, and up to four suggestion chips (secondary `Button`s) that
  fill the composer on click rather than sending immediately.

### 2. Streaming output — text, code, artifacts

```
Here is the plan. I'll touch three files and open one PR.

┌ code block (research/code-block.md anatomy) ────────────────────────────┐
│ src/lib/onboarding.functions.ts                              [Copy]     │
│ 12  export async function sendWelcomeEmail(...                          │
│ 13    ...                                                               │
└──────────────────────────────────────────────────────────────────────── ┘

┌ artifact card (inline, collapsed) ───────────────────────────────────────┐
│ [doc icon]  Onboarding email spec                                       │
│             3 sections · updated just now                    Open  →   │
└──────────────────────────────────────────────────────────────────────── ┘
```

- **Text stream** — tokens append to the current paragraph as they arrive; no cursor glyph,
  no shimmer laid over the growing text (the Vercel AI SDK UI principle: the stream itself
  is the progress signal). Before the first token, show `LoadingDots` (`size="sm"`) wrapping
  the label appropriate to the phase, e.g. "Thinking" or "Searching" — swap the label as the
  phase changes, never leave a stale one running (per `research/loading-dots.md`'s own
  behavior rule).
- **Code block** — identical anatomy to `research/code-block.md`: header (filename + copy
  button) when the block targets a real file, gutter line numbers, syntax highlighting.
  While a fenced block is still streaming (the closing ``` has not arrived), suppress the
  copy button and the filename header — both need the complete, valid content to be useful,
  and showing them early invites copying a truncated file.
- **Artifact card** — a long-form deliverable (a document, a full file, a diagram, a dataset
  preview) graduates out of the conversational stream into its own card: type icon, title,
  a one-line freshness/size note, and an "Open" affordance. This is the point where the
  chat stops being the place to _read_ the deliverable and becomes the log of how it was
  made. Below a size threshold it can render its content inline (a short table, a small
  diagram); above it, "Open" is the only way in.
- **Inline citation** — a small numbered chip (see Receipts & trust evidence) sits inline
  in the flowing text at the point of the claim it supports, never grouped only at the end
  of the message.

### 3. Agent run timeline

```
┌ run summary (Description trio) ─────────────────────────────────────────┐
│  Steps: 6        Time: 38s        Cost: $0.42                          │
└──────────────────────────────────────────────────────────────────────── ┘

│●  Read repository structure                              2.1s   ⌄       │
│   ┌ tool call ──────────────────────────────────────────────────────┐   │
│   │ fs.read({ path: "src/lib/onboarding.functions.ts" })            │   │
│   │ → 142 lines                                              0.3s   │   │
│   └──────────────────────────────────────────────────────────────── ┘   │
│                                                                          │
│●  Draft the change                                        11.4s  ⌄      │
│                                                                          │
│◐  Run the test suite                                       …            │   <- running
│                                                                          │
│○  Open pull request                                     pending         │   <- pending
│                                                                          │
│▲  Deploy to staging — paused for guardrail review              ⌄        │   <- blocked
```

- **Step row** — a vertical list, each row: status dot, step title (`text-label-14`,
  `--ds-gray-1000`), duration (`text-label-12-mono`, tabular, right-aligned) or a phase
  label while running/pending, and a chevron if the step has tool-call children. A thin
  `--ds-gray-400` connector line runs down the left edge, threading through every dot,
  broken only where the list itself ends.
- **Tool-call sub-row** (nested, indented one `--geist-gap-quarter` step under its parent
  step): the call itself rendered as a single-line invocation (`tool.name({ args })`,
  `text-label-13-mono`), its result summary on the line under it (`→ 142 lines`, `→ 3 files
changed`), and its own duration. A tool call whose input or output is long (a diff, a full
  file, a JSON payload) renders that payload inside a `Code Block` rather than inline text.
- **Run summary** — a three-item `Description` row (`<dl>`) above the list: total steps,
  total wall time, total cost. Hovering the cost figure opens a `ContextCardTrigger` with
  the per-step cost breakdown (see Cost & time indicators).

### 4. HITL gate card

```
┌ gate card (material-medium, lifted off the stream) ─────────────────────┐
│  Needs your approval                                             [⋯]    │
│  studio.pr.merge                                                        │
│  Merges "Onboarding email flow" into main. 4 files changed.             │
│                                                                          │
│  ┌ diff preview (Code Block, added/removed lines) ───────────────────┐  │
│  │ ...                                                                │  │
│  └────────────────────────────────────────────────────────────────── ┘  │
│                                                                          │
│  [ Approve ]  [ Send back ]  [ Challenge ]                              │
│  Merges now. This cannot be undone once it starts.                     │
└──────────────────────────────────────────────────────────────────────── ┘
```

- **Header** — a small neutral icon (shield or hand, `--ds-gray-900`, never ember — see
  Do/Don't) plus the label "Needs your approval" (`text-label-14` strong, `--ds-gray-1000`).
  A trailing `DotsMenu` carries the one uncommon secondary action ("Decline entirely," which
  ends the gate with no revision path) — never a fourth primary button.
- **Body** — the tool/action identifier in mono (`text-label-13-mono`, `--ds-gray-900`), one
  plain-words sentence naming exactly what will happen if approved, and — only when the
  action changes files, config, or external state — a diff/preview area built on
  `research/code-block.md`'s added/removed-line anatomy.
- **Actions** — exactly three, always in this order and always this wording:
  1. **Approve** — primary `Button` (`variant="default"`, ember fill — the one CTA this
     card is allowed).
  2. **Send back** — secondary `Button`; opens an inline textarea for the human's note, then
     resends the step to the agent for revision. The gate stays open until the revised
     attempt lands.
  3. **Challenge** — tertiary `Button`; opens an inline textarea for a specific question or
     objection; the agent must reply with a justification or a revised plan before the human
     acts again. Nothing executes while a challenge is outstanding.
- **Consequence helper text** — one line under the action row, always visible (not a
  tooltip), keyed to the action's real reversibility (mirroring `toolRisk()` /
  `resolveApprovalMode()` in `src/lib/ai/loop.server.ts`): irreversible actions get
  "This cannot be undone once it starts"; reversible ones get "You can undo this from the
  run timeline afterward."

### 5. Receipts & trust evidence

```
Inline citation:  ...pulled tone from your last three announcements. [1]
                                          ⌄ (hover/focus, ~150ms delay)
                  ┌ context card ──────────────────────────────────┐
                  │ #announcements — Slack                         │
                  │ Workspace channel                               │
                  │ Retrieved:     just now                         │
                  │ Confidence:    high                             │
                  │ Type:          internal, workspace              │
                  │                                    Open source →│
                  └──────────────────────────────────────────────── ┘

Full receipt (Trust Ledger entry):
┌ Entity row ──────────────────────────────────────────────────────────┐
│ [icon]  Merged "Onboarding email flow"           Standing            │
│         Action · studio.pr.merge · 2m ago                            │
└──────────────────────────────────────────────────────────────────── ┘
```

- **Inline citation chip** — a small numbered token at the point of the claim
  (`text-label-12-mono`, `--ds-gray-900` on `--ds-gray-100`), identical in spirit to a
  footnote marker. Hover or focus opens a `ContextCardTrigger` (`research/context-card.md`):
  entity name as a Title Case heading, one identifying subline, 2 to 4 `Label: value` rows
  (Retrieved, Confidence, Type), one primary action ("Open source"). Unknown values render
  as an em dash per Context Card's own convention — that convention lives in the metadata
  row, never in generated prose (see the humanized-output law).
- **Sources row** — the compact strip under a message body: one chip per cited source,
  numbered to match its inline citation, carrying a kind icon (web page, PRD, meeting,
  decision, mission, workspace finding) and a short label. Clicking scrolls to and briefly
  highlights the matching inline citation (and vice versa) — the two are one bidirectional
  reference, not two separate features.
- **Trust Ledger entry** — the durable receipt this run leaves behind (the workspace's
  `trust-ledger` route): an `Entity` row per decision or action, left icon by kind, center
  `EntityContent` (title + "{kind} · {tool or source} · {relative time}" description), right
  slot an outcome `Badge` (`standing` = gray, `proven` = green, `superseded` = amber-subtle,
  per Badge's own color-to-meaning mapping). Opens into the full receipt (existing
  `ReceiptDetailSheet`), which is the destination every inline citation and "View trace"
  link ultimately points to.

### 6. Model & tool pickers

```
Model picker (trigger, closed):        Tool picker (trigger, closed):
┌────────────────────────────┐         ┌──────────────────────────┐
│ ⬡ Cadence 4.0 mini      ▾  │         │ 🔧 3 connected         ▾  │
└────────────────────────────┘         └──────────────────────────┘

Model picker (open, Combobox):
┌ search models… ──────────────────────────────────────────────────┐
│ ⬡ Cadence 4.0 mini      fast · gateway                            │
│ ⬡ Cadence 4.0           balanced · gateway                        │
│ ◆ Claude (BYOK)         reasoning · needs key                     │
│ ◆ o-series (BYOK)       reasoning · needs key                     │
└──────────────────────────────────────────────────────────────────┘

Tool picker (open, Entity + Checkbox list):
┌────────────────────────────────────────────────────────────────┐
│ ☑ Web search              Search the open web           Connected│
│ ☑ Workspace search         Search this workspace's brain  Connected│
│ ☐ GitHub                   Read and write repo files       Needs auth│
└────────────────────────────────────────────────────────────────┘
```

- **Model picker** — a `Combobox` (`research/combobox.md`) whose closed trigger renders as a
  compact chip (provider glyph + model label, not raw placeholder text) rather than an
  empty search field, since a model is always selected. Opening it reveals the full,
  filterable catalog (`src/lib/ai/models.ts`'s `Model` list: `id`, `label`, `provider`,
  `tier`, `contextK`, `live`). Each `ComboboxOption` carries a `prefix` (provider glyph) and
  a trailing tier `Badge` (`variant="gray" contrast="low"`) plus, for a not-yet-connected BYOK
  provider, a small "needs key" suffix note instead of a tier.
- **Tool/connector picker** — not a Combobox (the list is short and every item's state
  matters, not just its name): an `EntityList` of `Entity as="button"` rows, `Checkbox` in
  the `left` slot, `EntityContent` for the tool's name and one-line capability, and a
  connection-status `Badge` in the `right` slot ("Connected" green-subtle, "Needs auth"
  amber-subtle) — directly the "Entity with List and Checkbox" composition from
  `research/entity.md`.
- **Replay-with** — a lightweight variant of the model picker scoped to one already-sent
  turn: a small popover listing only `live` models, each entry re-asking the same question
  with that model in the same thread. This is the picker at its narrowest — no search, no
  provider grouping, just the short live list.
- A global command palette (`research/command-menu.md`, once specced) is a legitimate second
  entry point onto the same two actions ("Switch model to…", "Enable tool…") for
  keyboard-first users — it dispatches the same underlying state change, never a parallel
  one.

### 7. Error & retry

```
Turn-level failure (replaces the would-be assistant turn):
┌ Error ─────────────────────────────────────────────────────────────┐
│ Couldn't reach the model                                           │
│ The gateway timed out after 30s.                     [ Try again ] │
│ ▸ Details (request id: req_8f2a…)                                  │
└──────────────────────────────────────────────────────────────────── ┘

Step-level failure (inside the run timeline):
│✕  Run the test suite                                       4.8s  ⌄ │
│   3 tests failed.                          [ Retry this step ]     │
│   Retrying automatically in 12s…                                    │

Guardrail block (amber, not red — a pause, not a failure):
│▲  Deploy to staging                                                │
│   Paused: this step needs your approval before it can continue.    │
│   [ same three-action gate card, inline ]                          │
```

- **Turn-level error** — an `Error` block (`research/error.md`) in place of the assistant
  turn: a short label naming the failed resource ("Couldn't reach the model," "Couldn't load
  workspace context" — never "Something went wrong"), one sentence of what happened, a
  "Try again" action when safely retryable, and a stable request/trace id tucked inside a
  closed `<details>` disclosure. Copy follows `research/error.md`'s verb rule exactly:
  "Couldn't"/"Can't" for the human's own state, "Failed to" for infra failures — "Unable to"
  is banned system-wide.
- **Step-level error** — the run timeline row itself turns red (`--ds-red-900` status dot),
  gains a one-line failure summary and a "Retry this step" tertiary action. When the system
  itself has scheduled an automatic backoff retry (`src/lib/ai/retry.ts`'s
  `shouldRetryStep`/`backoffMs`), show the countdown ("Retrying automatically in 12s…")
  instead of the manual button — never show both at once.
- **Guardrail block** — distinct from an error: the step's status dot is amber
  (`--ds-amber-900`, warning, not failure), its label reads "Paused," and it opens directly
  into the same three-action HITL gate card described above — a block is a pause for a
  decision, not a dead end.
- **Composer-level disruption** (a dropped connection mid-stream) — an inline `Note` above
  the composer (`patterns/notifications-inbox.md`'s Inline note surface), starting Neutral
  ("Reconnecting…" with `LoadingDots`) and escalating to Error tone with a "Retry" action
  only if reconnection genuinely fails.

### 8. Cost & time indicators

```
Per-message meta strip:
Cadence 4.0 mini · gateway   1.4s (620ms ttft)   1.1k in / 340 out   $0.0021

Run-level summary (Description trio, see Agent run timeline):
Steps: 6        Time: 38s        Cost: $0.42

Budget meter (only once a run approaches a cap):
Spend this run                                              $0.42 of $1.00
▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░
```

- **Per-message strip** — the existing `MessageMetaFooter` contract, unchanged in substance:
  model + route (`gateway`/`byo`), latency (plus time-to-first-token when the reply
  streamed live), tokens in/out, cost — all in monospace tabular figures so a column of
  messages lines up. This row is metadata, not a caption: it never carries the model's own
  words.
- **Run-level summary** — the three-item `Description` trio at the head of a run timeline
  (steps, time, cost). Hovering the cost value opens a `ContextCardTrigger` breaking it down
  per step, each row `Label: value` (`Draft the change: $0.31`), so the total is always
  one hover away from being explained, never just asserted.
- **Budget meter** — reuses the `Meter` treatment from `patterns/dashboards-stat-cards.md`
  (track + fill, `--ds-gray-*` healthy through `--ds-amber-700` warning to `--ds-red-700`
  over cap). Renders only once a run or a workspace period is genuinely nearing a real cap
  — never as permanent chrome on every run, which would make cost feel like the point of
  every interaction instead of an occasional guardrail.

## Variants

| Area               | Variant                        | When to use                                                                                                                                                                                                       |
| ------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ask surface        | Full-page Ask                  | The dedicated `/chat` (or Ask) route — primary surface, full message history, full composer.                                                                                                                      |
| Ask surface        | Docked panel                   | An Ask entry point surfaced from within another screen (a PRD, a mission) — narrower column, same anatomy, opens as a `Sheet`/`Drawer` rather than a route.                                                       |
| Ask surface        | Suggested-prompt empty state   | First visit to a surface with no history yet — up to four chips, each a real question relevant to _this_ workspace's actual data, never generic filler.                                                           |
| Streaming          | Plain text                     | The default — most replies.                                                                                                                                                                                       |
| Streaming          | Code-forward                   | The reply is primarily a diff/file/snippet — lead with the `Code Block`, keep prose to the minimum framing sentence before and after it.                                                                          |
| Streaming          | Artifact-forward               | The deliverable is long-form (a spec, a full document) — the artifact card appears early and the surrounding prose stays to one or two sentences of framing, never a restated copy of the artifact's own content. |
| Agent run timeline | Compact (inline in chat)       | A short run (2 to 4 steps) shown directly under the turn that triggered it — no separate summary trio, just the step list.                                                                                        |
| Agent run timeline | Full (dedicated trace view)    | A longer or historical run — the full anatomy above, including the run summary trio, at `/traces/$traceId`.                                                                                                       |
| HITL gate card     | Standard gate                  | The default — Approve / Send back / Challenge, as specified above.                                                                                                                                                |
| HITL gate card     | Diff-bearing gate              | Adds the Code Block diff/preview area when the action changes files or config.                                                                                                                                    |
| HITL gate card     | Handoff gate                   | The action delegates to an external agent/tool (e.g. sending a build task to an outside coding agent) — body copy states plainly that the hand-off cannot be recalled once sent; otherwise identical anatomy.     |
| Receipts           | Inline citation                | A single claim inside flowing text — numbered chip + Context Card.                                                                                                                                                |
| Receipts           | Sources row                    | The aggregate list under a whole message — one chip per distinct source used in that turn.                                                                                                                        |
| Receipts           | Trust Ledger entry             | The durable, workspace-level record — `Entity` row in the ledger list, opening the full `ReceiptDetailSheet`.                                                                                                     |
| Model picker       | Full catalog (Combobox)        | Starting a new thread, or deliberately switching models mid-thread.                                                                                                                                               |
| Model picker       | Replay-with (scoped popover)   | Re-running one already-sent turn with a different model, without leaving the thread.                                                                                                                              |
| Tool picker        | Panel (Entity + Checkbox list) | Composer's own "tools" trigger — the default.                                                                                                                                                                     |
| Tool picker        | Settings-level                 | The exhaustive, account-wide connector list belongs in Settings → Connected accounts, not this picker — this picker only ever shows tools already available to _this_ workspace.                                  |
| Error & retry      | Turn-level Error               | The whole reply failed to generate.                                                                                                                                                                               |
| Error & retry      | Step-level failure             | One step inside a multi-step run failed; the rest of the run's state is preserved.                                                                                                                                |
| Error & retry      | Guardrail block                | The system paused deliberately (not a failure) and needs a human decision to continue.                                                                                                                            |
| Cost & time        | Per-message strip              | Every assistant turn.                                                                                                                                                                                             |
| Cost & time        | Run-level summary              | Every agent run with more than one step.                                                                                                                                                                          |
| Cost & time        | Budget meter                   | Only when a run or period is genuinely approaching a real spend cap.                                                                                                                                              |

## States

| State                          | Applies to                                                                                                                                         | Tokens                                                                                                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default (assistant turn)       | Message body                                                                                                                                       | Plain text on `--ds-background-100`; body `text-copy-14`, `--ds-gray-1000`; role label `text-label-13`, `--ds-gray-900`.                                                                                                                                                                   |
| Default (user turn)            | Message body                                                                                                                                       | Fill `--ds-gray-100`; `--ds-radius-medium`; text `text-copy-14`, `--ds-gray-1000`.                                                                                                                                                                                                         |
| Hover                          | Inline citation chip, sources chip, artifact card, timeline step (expandable), picker option                                                       | Background steps `--ds-gray-100` → `--ds-gray-200` (or, for a chip already on `--ds-gray-100`, straight to `--ds-gray-200`); border (where present) `--ds-gray-400` → `--ds-gray-500`.                                                                                                     |
| Active (pressed)               | Any of the above when clicked                                                                                                                      | Background `--ds-gray-300` (or the next step up from its hover value); border `--ds-gray-600`.                                                                                                                                                                                             |
| Focus                          | Every interactive element across all eight areas (chips, action buttons, picker triggers/options, timeline rows, gate-card actions, retry buttons) | `--ds-focus-ring`, never removed, never swapped for a color-only outline.                                                                                                                                                                                                                  |
| Disabled                       | Send button (empty composer or streaming in progress — replaced by Stop, not disabled-and-hidden), gate-card actions mid-decision                  | Standard `Button` disabled treatment (`research/button.md`); paired with a `Tooltip` only when the reason genuinely isn't obvious from context (an empty composer's disabled Send needs none).                                                                                             |
| Loading — pre-stream           | Message body before the first token                                                                                                                | `LoadingDots` (`size="sm"`) wrapping a phase label ("Thinking," "Searching workspace," "Reading files") — swapped as the phase changes, never left stale.                                                                                                                                  |
| Loading — mid-stream           | Message body, code block, artifact card while content is still arriving                                                                            | No overlay, no skeleton — the growing text/code IS the loading state. A streaming code block suppresses its copy button and filename header until the fence closes.                                                                                                                        |
| Loading — step running         | Agent run timeline row                                                                                                                             | `LoadingDots` (`size="sm"`) in place of a static status dot, next to the step label.                                                                                                                                                                                                       |
| Loading — reconnecting         | Composer-level Note                                                                                                                                | Neutral tone, `LoadingDots`, "Reconnecting…" — escalates to Error tone only on genuine failure.                                                                                                                                                                                            |
| Empty                          | Message list (no turns yet)                                                                                                                        | `EmptyState` composition (icon + title + description + up to 4 suggestion chips), per Anatomy §1.                                                                                                                                                                                          |
| Empty                          | Tool picker (no connectors on this workspace)                                                                                                      | `EmptyState`, compact variant, one CTA ("Connect a source") routing to Settings — never a bare blank list.                                                                                                                                                                                 |
| Empty                          | Receipts row (no sources used)                                                                                                                     | The sources row does not render at all — an empty row is worse than no row.                                                                                                                                                                                                                |
| Error — turn-level             | Message body                                                                                                                                       | `Error` block (`--ds-red-900` label icon, `text-label-14` heading, `text-copy-14` body), per `research/error.md`.                                                                                                                                                                          |
| Error — step-level             | Agent run timeline row                                                                                                                             | `--ds-red-900` status dot; failure summary in `text-copy-13`, `--ds-gray-900`; "Retry this step" tertiary action.                                                                                                                                                                          |
| Error — connector              | Tool picker row                                                                                                                                    | `Badge` reads "Needs auth" (amber-subtle); row stays checked-off (unchecked), clicking it routes to the connector's auth flow instead of toggling.                                                                                                                                         |
| Blocked (guardrail)            | Agent run timeline row                                                                                                                             | `--ds-amber-900` status dot; label suffix "Paused"; expands into the HITL gate card in place.                                                                                                                                                                                              |
| Standing / Proven / Superseded | Trust Ledger entry (outcome)                                                                                                                       | `Badge`: `standing` = plain `--ds-gray-200`/`--ds-gray-1000` (neutral, gray = no judgment yet); `proven` = `--ds-green-200`/`--ds-green-900` (subtle); `superseded` = `--ds-amber-200`/`--ds-amber-900` (subtle) — never red; being superseded is a normal lifecycle event, not a failure. |

## Interaction model

**Pointer**

- **Composer**: clicking anywhere in the textarea focuses it; the control row's model/tool
  pickers and Send never require a click-through to "activate" the composer first.
- **Streaming**: no pointer interaction is required to watch a reply arrive; hovering a code
  block reveals its copy button (opacity 0 → 100, per `research/code-block.md`'s own
  cross-fade); hovering an artifact card lifts it (`--ds-gray-100` → `--ds-gray-200`) as a
  drill-in affordance.
- **Timeline**: clicking a step's chevron (or anywhere on the row) expands/collapses its
  tool-call children; clicking a tool call's own row expands its full input/output payload
  in place, it does not navigate away.
- **HITL gate card**: the three actions are independent buttons, not a single-hit-target
  card — a person must deliberately choose one. Clicking "Send back" or "Challenge" reveals
  an inline textarea directly below the action row (no modal); submitting collapses it back
  to the action row with the new state (revision requested / challenge sent).
- **Receipts**: hovering or focusing an inline citation opens its Context Card after
  ~150ms (matching `research/context-card.md`'s own anti-flash delay); clicking a sources
  chip scrolls to and briefly rings the matching inline citation, and vice versa.
- **Pickers**: the model Combobox opens on click and filters as the user types; the tool
  picker's rows toggle their checkbox on click anywhere in the row (matching
  `research/entity.md`'s "Entity with List and Checkbox" click-toggles-the-row pattern), not
  only on the checkbox hitbox itself.
- **Error & retry**: "Try again"/"Retry this step" re-issues the same request; clicking the
  collapsed `<details>` request-id disclosure expands it in place, no navigation.

**Keyboard** (full map)

| Key                 | Where                                                                           | Effect                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Enter`             | Composer textarea                                                               | Sends the message.                                                                                                                                                                                               |
| `Shift+Enter`       | Composer textarea                                                               | Inserts a newline without sending.                                                                                                                                                                               |
| `Escape`            | Composer textarea (mid-stream)                                                  | Nothing by default — use the Stop button; Escape is reserved for closing overlays, not interrupting a stream, so a person doesn't lose a reply by reaching for a familiar key.                                   |
| `Tab` / `Shift+Tab` | Ask surface                                                                     | Moves: message list's interactive elements (citations, artifact "Open," feedback thumbs, "View trace," "Replay with…") in document order → attachment chips → textarea → model picker → tool picker → Send/Stop. |
| `Enter` / `Space`   | Model/tool picker trigger, timeline row chevron, gate-card action, retry button | Activates it.                                                                                                                                                                                                    |
| `↑` / `↓`           | Open model Combobox                                                             | Moves through filtered options.                                                                                                                                                                                  |
| `Enter`             | Open model Combobox (option highlighted)                                        | Selects it; does not submit the composer even if the picker is nested inside the same form.                                                                                                                      |
| `Escape`            | Open picker, open Context Card, open gate-card inline textarea                  | Closes it, focus returns to its trigger.                                                                                                                                                                         |
| `→`                 | Agent run timeline row (focused, has children)                                  | Expands its tool-call children (mirrors `Collapse`'s own toggle contract).                                                                                                                                       |
| `Tab`               | Inside an expanded timeline row                                                 | Moves into that row's own controls (e.g. "Retry this step"), not to the next row — arrow keys own row-to-row movement, Tab drills into one row.                                                                  |

**Screen-reader behavior**

- The message list's live region is `aria-live="polite"` for streaming assistant text (so
  screen readers announce growing content without interrupting), switching to
  `aria-live="assertive"` only for a turn-level `Error` (per `research/error.md`'s own
  accessibility guidance).
- Each message turn carries a real accessible name pairing role and content ("Cadence
  replied:", "You asked:") — never relying on visual position (left/right, plain-vs-bubble)
  alone to convey who is speaking.
- The HITL gate card announces as a region with an `aria-label` naming what needs approval
  ("Approval needed: merge Onboarding email flow"); its three actions are ordinary buttons
  in tab order, never a modal that traps focus (this is a card in the flow, not a dialog).
- The agent run timeline's status dots are `aria-hidden`; the meaning they carry (pending,
  running, done, failed, blocked) is exposed via each row's accessible name instead ("Draft
  the change, completed in 11.4 seconds"; "Deploy to staging, paused, needs your approval").
- Inline citations are real, focusable elements (`<button>`), each with an accessible name
  identifying the source ("Source 1: #announcements"), not a bare superscript number.

**Motion**

- Streaming text/code has no entrance animation beyond the browser's own text reflow — see
  States, Loading (mid-stream).
- `LoadingDots` uses its own built-in loop (per `research/loading-dots.md`); gate on
  `prefers-reduced-motion` and never pair it with a second moving indicator on the same line.
- Artifact card hover-lift and timeline row expand/collapse use `--ds-motion-timing-swift`;
  the expand/collapse itself is always animated, matching `Collapse`'s own "never an instant
  jump-cut" rule (`research/collapse.md`).
- The HITL gate card's inline textarea (for Send back / Challenge) slides/fades open over
  `--ds-motion-popover-duration` (0.2s) — it is a popover-weight reveal, not an overlay.
- Context Card open honors its documented ~150ms hover delay before appearing; closes
  immediately on cursor exit/blur.
- `prefers-reduced-motion`: every transform above becomes an instant state change; text
  streaming is unaffected (it carries no motion to begin with), and `LoadingDots` falls back
  per its own accessibility guidance.

## Responsive behavior

- **Desktop**: Ask surface at up to `--ds-page-width`, message column capped narrower than
  the full width for readability (matching the composer's own width). Artifact cards that
  exceed the inline threshold open into a resizable split pane beside the chat, not a modal.
  The agent run timeline renders full anatomy (summary trio + full step list) either inline
  or at its own route. Pickers are Combobox/popover-anchored.
- **Tablet**: Same structure; the artifact split pane loses its resize handle and settles at
  a fixed ~55/45 split. The tool picker's row text may drop its capability description down
  to a single truncating line if width is tight, but the connection-status Badge never
  disappears.
- **Mobile**: The artifact split pane is replaced by a full-screen `Drawer` (per
  `research/drawer.md` — "reserve Drawer for small viewports"), opened by the artifact
  card's "Open" tap and dismissed by swipe-down/Escape/back-gesture, returning focus to the
  card. The model and tool pickers swap their popover for the same `Drawer` pattern rather
  than a cramped anchored popover. The HITL gate card's inline textarea for Send back /
  Challenge takes the full composer-equivalent width. The agent run timeline collapses to
  showing only the current/most-recent step by default, with a "Show all steps" disclosure
  for the rest, since a long vertical list with a connector line reads poorly on a narrow
  viewport with limited vertical room to scan.

## Accessibility

- **Roles**: the message list is a `log`-equivalent region (each turn a list item in reading
  order); the composer's textarea is a real `<textarea>`, never a `contenteditable` div
  standing in for one, so native undo, spellcheck, and IME composition all keep working.
  The HITL gate card is `role="region"` with a naming `aria-label`, never `role="dialog"` —
  it never traps focus. The agent run timeline's step list is a real ordered list (`<ol>`),
  since sequence is meaningful.
- **Focus order**: composer → message list happens once per navigation (focus lands in the
  textarea on entering the Ask surface); within a turn, focus order follows the visual
  anatomy top to bottom (body text's citations, then the meta footer's actions, in that
  order) — never jump straight to the meta footer before the content it describes.
- **Contrast**: assistant body text (`--ds-gray-1000` on `--ds-background-100`) and the meta
  strip (`--ds-gray-900`/`--ds-gray-700`) are the system's own pre-validated text-role steps.
  Status dot colors (green/red/amber/gray) are never the sole signal — every dot's meaning
  is also in the row's accessible name (see Interaction model, Screen-reader behavior).
- **Reduced motion**: every rule in Motion above degrades to an instant state change; nothing
  in this pattern depends on motion to convey which state a message, step, or gate is in.
- **Focus and long-running work**: a run that takes minutes never steals focus back to itself
  repeatedly as it updates — updates land in the DOM and are exposed via `aria-live`, but
  focus stays wherever the person put it (typing a new message, reading a different turn).

## Tokens used

| Token / class                                          | Role in this pattern                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `--ds-background-100`                                  | Page fill; assistant-turn background (i.e., no fill of its own).                                                         |
| `--ds-gray-100` / `-200` / `-300`                      | User-turn bubble fill; interactive chip/row default/hover/active; HITL gate card lift-off fill.                          |
| `--ds-gray-400` / `-500` / `-600`                      | Borders: default / hover / active, across chips, cards, and the timeline's connector line.                               |
| `--ds-gray-700`                                        | Timestamps, digest-style secondary labels, disabled-state text.                                                          |
| `--ds-gray-900`                                        | Role labels ("Cadence"), citation chip text, meta-strip figures, status-dot accessible-name-carrying icons.              |
| `--ds-gray-1000`                                       | Primary body text (assistant and user turns), step titles, gate-card heading.                                            |
| `--ds-gray-alpha-100`…`-500`                           | Layering washes over unknown backgrounds (e.g. artifact card hover lift on top of arbitrary content preview colors).     |
| `--ds-ember-600`/`700`/`800`                           | Approve button fill only — the single ember moment this whole pattern is allowed per view (contract §2, §10).            |
| `--ds-blue-900`                                        | Informational-only inline links inside message bodies and Context Card content; never a status dot.                      |
| `--ds-green-900` / `--ds-green-200`                    | Success status dot; "proven" Trust Ledger outcome badge (subtle).                                                        |
| `--ds-amber-900` / `--ds-amber-200`                    | Warning/blocked status dot; guardrail-paused label; "superseded" outcome badge (subtle); budget meter's warning zone.    |
| `--ds-red-900` / `--ds-red-700`                        | Error status dot and text; budget meter's over-cap zone.                                                                 |
| `--ds-focus-ring`                                      | Focus state on every interactive element in all eight areas.                                                             |
| `--ds-shadow-border-small` / `.material-small`         | Chips, sources row, code-block chrome.                                                                                   |
| `--ds-shadow-border-medium` / `.material-medium`       | Composer surface; HITL gate card.                                                                                        |
| `--ds-shadow-menu` / `.material-menu`                  | Model/tool picker popovers; Context Card surface.                                                                        |
| `--ds-shadow-tooltip` / `.material-tooltip`            | Any single-line info tooltip nested inside this pattern (e.g. a disabled Send's reason).                                 |
| `--ds-radius-small`                                    | Chips, code-block container, citation badge.                                                                             |
| `--ds-radius-medium`                                   | User-turn bubble, composer, HITL gate card, artifact card.                                                               |
| `--ds-motion-timing-swift`                             | Every transition in this pattern: hover lifts, expand/collapse, gate-card inline textarea reveal.                        |
| `--ds-motion-popover-duration` (0.2s)                  | Picker popovers, Context Card, gate-card inline textarea.                                                                |
| `--ds-motion-overlay-duration` / `-scale`              | Mobile Drawer fallback for artifact panel and pickers.                                                                   |
| `--ds-z-menu`                                          | Model/tool picker popover stacking context.                                                                              |
| `--ds-z-drawer`                                        | Mobile artifact/picker Drawer stacking context.                                                                          |
| `--ds-size-medium` (36px)                              | Composer control row (model/tool picker triggers, Send/Stop), gate-card actions, retry buttons.                          |
| `--ds-popover-padding` / `-row-height` / `-row-radius` | Model Combobox list rhythm, tool picker's Entity rows.                                                                   |
| `text-heading-14` / `text-label-14` (strong)           | Gate-card header, chart-adjacent section titles reused inside a run summary.                                             |
| `text-label-13`                                        | Role label ("Cadence"), step titles, receipt entity titles.                                                              |
| `text-label-13-mono` / `text-label-12-mono`            | Tool-call invocation lines, timestamps, durations, cost/token figures — all tabular.                                     |
| `text-copy-14` / `-13`                                 | Message body text, gate-card body sentence, error body copy.                                                             |
| `text-button-14` / `-12`                               | Gate-card and inline-note action labels; citation chip label.                                                            |
| `.text-tabular`                                        | Every changing numeral in the meta strip and run summary (cost, tokens, duration) — never the flowing prose around them. |
| `--geist-gap` (24px)                                   | Vertical rhythm between message turns.                                                                                   |
| `--geist-gap-half` (12px)                              | Vertical rhythm inside a turn (body → meta footer; step → its tool-call children).                                       |
| `--geist-gap-quarter` (8px)                            | Icon-to-label gaps throughout (status dot to step title, kind icon to entity title).                                     |
| `--ds-page-width` (1400px)                             | Outer bound the whole Ask surface sits inside on desktop.                                                                |

## Implementation guidance

**Ask surface (composer + message list)**

- Extend, don't replace: `src/components/obsidian/AskPanel.tsx` and `ask-canvas.tsx` already
  own the docked-panel variant; `src/routes/_authenticated.chat.tsx` (paired with
  `src/routes/api/chat.ts`'s SSE handler) owns the full-page variant. Both need their inline
  styling remapped onto Tempo's `--ds-*` tokens and the `material-*` presets — the streaming
  contract, SSE meta shape, and citation wiring in `src/routes/api/chat.ts` and
  `src/components/chat/MessageMeta.tsx` are already correct and should not be re-architected.
- New shared primitives belong in `src/components/ui/`: a `Composer` wrapper (textarea +
  control row, reusing `src/components/ui/textarea.tsx`), and a `MessageTurn` component
  distinguishing the user-bubble and assistant-plain-text treatments described in Anatomy §1.

**Streaming output (text / code / artifacts)**

- `src/components/chat/ChatMarkdown.tsx` already implements the citation-badge transform and
  a `CodeBlock` wrapper with a hover copy button — restyle its Tailwind utility classes
  (`bg-secondary/70`, `border hairline`, etc.) onto `material-small` and the `--ds-gray-*`
  ramp rather than rewriting the citation/markdown logic.
  Add the streaming-safe suppression rule (no copy button, no filename header until the
  fence closes) as a small guard in `CodeBlock`'s own render, keyed off whether the parent
  stream is still active.
- New: `src/components/ui/artifact-card.tsx` (inline collapsed card) plus a
  `src/components/chat/artifact-panel.tsx` for the desktop split pane (`resizable.tsx` is
  already available) and mobile `Drawer` fallback.

**Agent run timeline**

- `src/routes/_authenticated.traces.$traceId.tsx` already renders the hop table this pattern
  formalizes (status via `EVENT_DOT`, `ok`/`error`/`blocked`, latency in mono tabular
  figures) — restyle its ad hoc `dot`/`dot-failed` CSS classes onto the status-dot color
  mapping in States above (add the missing amber "blocked" treatment explicitly; today's
  `statusColor` branch already distinguishes `blocked` from `error`, it just needs the
  amber token, not a bespoke color). Add the compact inline variant
  (Variants table) as a smaller sibling component, e.g. `src/components/chat/run-timeline-compact.tsx`,
  sharing the same step-row primitive as the full trace view rather than duplicating markup.

**HITL gate card**

- `src/components/studio/ApprovalCard.tsx` is today's binary Approve/Reject gate, styled
  with the pre-Tempo `--ember-tint`/`--ember-line` "needs-a-human" wash. Under Tempo this
  needs two changes, not a rewrite: (1) drop the ember card-chrome tint — ember is CTA-only
  now, so restyle the card to the neutral `--ds-gray-100` lift-off fill and move ember to
  the Approve button alone; (2) extend the two-button footer to the three-action contract
  (Approve / Send back / Challenge) described in Anatomy §4, wiring "Send back" and
  "Challenge" through `decideApproval` (`src/lib/agent_loop.functions.ts`) with a new
  `note`/`challenge` payload alongside the existing `approve`/`reject` decisions — "Decline
  entirely" (today's `reject`) moves into the header's `DotsMenu` as the uncommon path.
  `src/components/governance/ApprovalsPanel.tsx` and `src/components/today/PendingApprovalsBar.tsx`
  consume the same card and get the update for free.

**Receipts & trust evidence**

- The inline-citation ↔ sources-chip bidirectional highlight already exists
  (`src/components/chat/ChatMarkdown.tsx`'s `CitationBadge`, `src/components/chat/MessageMeta.tsx`'s
  `SourceChip`/`data-source-n`) — restyle onto tokens, keep the scroll-and-ring behavior.
  Add the `ContextCardTrigger`-style hover preview (`@radix-ui/react-hover-card`, matching
  `research/context-card.md`'s own primitive) as a new wrapper around `SourceChip` rather
  than a parallel tooltip system.
- The Trust Ledger is real and already shipped: `src/routes/_authenticated.trust-ledger.tsx`,
  `src/lib/trust-ledger.functions.ts` (`TrustReceipt`, `kind`/`outcome`/`status`/`source`),
  and `src/components/trust/ReceiptDetailSheet.tsx`. Restyle the ledger's list rows onto the
  `Entity`/`EntityList` composition in Anatomy §5 and remap `receiptStatusTone`/
  `RECEIPT_TONE_VAR` (`src/components/trust/format.tsx`) onto the Badge outcome-color
  mapping in States above — this is a token swap on an already-correct data model, not a
  new feature.

**Model & tool pickers**

- New: `src/components/ui/model-picker.tsx` on `@radix-ui/react-popover` + an internal
  `Combobox`-shaped listbox, reading `src/lib/ai/models.ts`'s `MODELS` catalog
  (`id`/`label`/`provider`/`tier`/`contextK`/`live`) directly — group by `provider`, badge by
  `tier`, gray out (with a "needs key" suffix) any entry where `live` is false and no BYOK
  key is configured for that provider.
- The "Replay with…" scoped variant already exists inside
  `src/components/chat/MessageMeta.tsx`'s `MessageMetaFooter` (a `Popover` filtering
  `MODELS.filter(m => m.live)`) — restyle it onto the same tokens as the full picker rather
  than maintaining two visual languages for one underlying list.
- New: `src/components/ui/tool-picker.tsx`, composing `Checkbox` + the `Entity`/`EntityList`
  pattern, reading enabled connectors from the existing connector registry
  (`src/lib/connectors/`) via a small `src/lib/tools-picker.functions.ts` server function
  rather than duplicating connector-status logic already owned by Settings → Connected
  accounts.

**Error & retry**

- Restyle `src/components/ui/alert.tsx` (already the base for `patterns/notifications-inbox.md`'s
  Inline Note) for the composer-level disruption note — no new component needed.
- New: `src/components/ui/error-block.tsx` implementing `research/error.md`'s `label` /
  `children` / structured `error={{message, action, link}}` API, for the turn-level failure
  case, and `src/components/chat/error-card.tsx` for the block-level empty/error composite
  where a whole panel (not just one turn) fails to load, per `research/error-card.md`.
- Step-level retry composes directly with `src/lib/ai/retry.ts`'s existing
  `shouldRetryStep`/`backoffMs`/`nextRetryAtIso` — the UI's countdown label is a thin
  presentation layer over a value the backend already computes; do not re-derive backoff
  timing in the client.

**Cost & time indicators**

- `src/components/chat/MessageMeta.tsx`'s `MessageMetaFooter` is the reference
  implementation — its inline `style={{ color: "var(--ink-faint)" }}` etc. needs remapping
  onto `--ds-gray-900`/`--ds-gray-700` and `text-label-12-mono`, but its data contract
  (`ChatMeta`: `model`, `via`, `latency_ms`, `tokens_in/out`, `cost_usd`, `sources`) is
  already exactly right and should not change shape.
- The run-level summary trio and its cost-breakdown Context Card are new
  (`src/components/chat/run-summary.tsx`), built on `Description` for the trio and
  `@radix-ui/react-hover-card` for the breakdown, fed by the same per-step cost figures the
  trace view already has.
- The budget meter reuses `src/components/ui/progress.tsx` exactly as specified in
  `patterns/dashboards-stat-cards.md`'s Meter guidance — do not build a second progress
  component for this pattern.

## Usage examples

**1. A turn that streams code, cites a workspace source, and needs approval to finish**

```tsx
import { MessageTurn } from "@/components/chat/message-turn";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { MessageMetaFooter } from "@/components/chat/MessageMeta";
import { ApprovalCard } from "@/components/studio/ApprovalCard";

function AssistantReply({ turn, pendingApproval, onDecided }: AssistantReplyProps) {
  return (
    <MessageTurn role="assistant" streaming={turn.streaming}>
      <ChatMarkdown content={turn.content} citations={turn.meta?.sources.map((s) => s.n)} />
      {pendingApproval && <ApprovalCard approval={pendingApproval} onDecided={onDecided} />}
      {turn.meta && <MessageMetaFooter meta={turn.meta} feedbackId={turn.id} />}
    </MessageTurn>
  );
}
```

**2. An agent run timeline, compact variant, inline under the turn that started it**

```tsx
import { RunTimelineCompact } from "@/components/chat/run-timeline-compact";

function InlineRun({ run }: { run: AgentRun }) {
  return (
    <RunTimelineCompact
      steps={run.steps}
      summary={{ steps: run.steps.length, timeMs: run.totalMs, costUsd: run.totalCost }}
    />
  );
}

// Each step renders a status dot from the shared mapping:
// pending -> gray ring, running -> LoadingDots, success -> green dot,
// error -> red dot, blocked -> amber dot (opens the ApprovalCard in place).
```

**3. The composer with a model picker, a tool picker, and an attachment chip**

```tsx
import { Composer } from "@/components/chat/composer";
import { ModelPicker } from "@/components/ui/model-picker";
import { ToolPicker } from "@/components/ui/tool-picker";

function AskComposer({ value, onChange, onSend, model, onModelChange, tools }: AskComposerProps) {
  return (
    <Composer
      value={value}
      onChange={onChange}
      onSend={onSend}
      attachments={[{ id: "email.md", label: "email.md" }]}
      controls={
        <>
          <ModelPicker value={model} onChange={onModelChange} />
          <ToolPicker enabled={tools} />
        </>
      }
    />
  );
}
```

## Do / Don't

- Do render the assistant's own words as plain text with no card or bubble; spend the one
  bubble treatment on the user's turn, where it helps a scanning eye find "what did I ask."
- Do let a growing stream of text or code be its own progress indicator; only show
  `LoadingDots` before the first token, never layered on top of text already visibly
  arriving.
- Do keep the HITL gate card to exactly three actions in this order: Approve, Send back,
  Challenge — a fourth action (a full decline) belongs in the header's `DotsMenu`, not a
  fourth primary button.
- Do put the consequence in visible helper text under the gate card's actions, keyed to the
  action's real reversibility — never bury it in a tooltip a person might not open before
  clicking Approve.
- Do treat every claim's citation and its Trust Ledger receipt as one bidirectional
  reference (inline chip ↔ sources row ↔ full receipt), not three separate features that
  happen to point at the same data.
- Do reuse the existing `MessageMetaFooter`/`ChatMeta` contract, `trust-ledger.functions.ts`
  data model, and `retry.ts` backoff logic — this pattern is a token and anatomy pass over
  real, already-correct Cadence code, not a rewrite.
- Don't tint the HITL gate card in ember to signal "needs a human," the way the pre-Tempo
  contract did. Tempo reserves ember for the brand/CTA role only (contract §2, §10); the
  card's chrome stays neutral (`--ds-gray-100`), and ember appears exactly once, on Approve.
- Don't use red for a "blocked"/guardrail-paused step. A guardrail pause is a decision point
  (amber, warning-level), not a failure (red, error-level) — collapsing the two into one
  color teaches people to fear a routine pause.
- Don't stack a spinner or a second `LoadingDots` on the same line as streaming text — the
  text's own arrival already communicates progress, and a second cue is noise, not clarity.
- Don't let an inline citation exist without its Context Card, or a sources chip without a
  working scroll-and-highlight link back to its citation — a receipt that doesn't resolve
  to evidence is worse than no receipt.
- Don't put a permanent budget meter on every message or every run; render it only when a
  real cap is genuinely close, or cost becomes the visual point of every reply instead of an
  occasional guardrail.
- Don't build a second toast/note/error system for this pattern — turn-level failures use
  `Error`, block-level ones use `Error Card`, transient composer disruptions use the Inline
  Note from `patterns/notifications-inbox.md`. Three sanctioned shapes, not a fourth.
- Don't write any generated or example copy in this pattern with an em dash or en dash — the
  humanized-output law applies to every string an agent or the product produces, including
  gate-card body sentences, error messages, and suggestion-chip labels.

## The AI-presence signature: the shimmering working word (founder ruling 2026-07-11, refined same day)

The platform-wide marker that an agent is present and working is ONE word (Working,
Thinking, or the agent's name) set in Geist Pixel Square with the AI-presence blue
flowing shimmer gradient clipped to the text. It is a single sanctioned utility, not a
recipe:

- Class: `.ai-working-word` in `src/styles.css` (Pixel face + the `--shimmer-gradient`
  token, `background-clip: text`). Consume the class; never re-implement the gradient
  inline, and never define a second shimmer. The gradient token itself lives with the
  color tokens and is owned there, not by any surface.
- Hue: the recalibrated blue role (`--ds-blue-*`, hue roughly 210 to 225), deliberately
  richer and more luminous on black than the earlier chalky glacier verbatim; `--glacier`
  is now an alias into that same blue role. **Purple/violet is retired from AI
  treatments entirely** — no violet stop may appear in the shimmer gradient or any other
  AI-presence styling. This refined doctrine supersedes the earlier glacier-verbatim
  wording of the same-day ruling.
- Motion: always gated. Under `prefers-reduced-motion` (or `data-motion="off"`) the word
  falls back to static blue text (`--glacier`); the Pixel face alone still signals the
  AI moment.
- Budget: at most ONE shimmer per screen, and it counts as the screen's Pixel brand
  moment while visible. A streaming reply pairs it with the sanctioned `.stream-caret`,
  never an ad-hoc spinner or a second `LoadingDots`.
- Role split: blue shimmer = the machine is working. Ember stays reserved for
  waiting-on-human moments (the approve CTA, a pending call), never for busy states.
- Consumer note: `/chat` is a redirect stub into Today (OBS-12 folded chat into the Ask
  panel), so the chat/AI hero moment lives in `AskPanel`. Its thinking line
  (`ShimmerStatus`) still wears a mono-face inline shimmer and should migrate to
  `.ai-working-word` when that surface is next touched; the top-bar `AiPulse` mark and
  text sweeps are the other sanctioned shimmer consumers.

## Pixel brand-moment inventory (U7, 2026-07-11)

The §3/§8 budget is at most ONE Geist Pixel element per screen. Persistent chrome
lockups — the rail's pixel "C" monogram in `AppShell` and the top-bar `AiPulse` pixel
"C" mark — are logo usage, not brand moments, and do not consume a screen's budget.
The audited in-canvas inventory:

| Screen / surface        | The one Pixel element                                                              | Component                                            |
| ----------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Today (populated)       | Hero lead phrase (`One call`, `12 calls`, `All clear.`) in ember/moss               | `src/components/obsidian/today/Hero.tsx`             |
| Today (cold workspace)  | Cold-start headline "Give your agents something to read." (replaces the hero)       | `src/components/today/ColdStartOnramp.tsx`           |
| Command palette (⌘K)    | No-results headline "Nothing by that name" (overlay surface; header stays Sans)     | `src/components/cadence/CommandPalette.tsx`          |
| Discover (empty)        | Empty-state headline "Nothing sensed yet"                                           | `src/components/discover/DiscoverSurface.tsx`        |
| Build mission detail    | Compounding-count numeral                                                           | `src/components/missions/MissionOrchestratorDetail.tsx` |
| Build index             | Stat numeral                                                                        | `src/routes/_authenticated.build.index.tsx`          |
| Brain                   | Stat-trio numerals (one trio, one moment)                                           | `src/components/knowledge/BrainStatTrio.tsx`         |
| Engine Room metrics     | Gauntlet score numeral                                                              | `src/components/observe/GauntletMetricsPanel.tsx`    |
| Login / auth            | Auth scaffold display line                                                          | `src/components/cadence/AuthScaffold.tsx`            |
| Onboarding              | Welcome display line                                                                | `src/components/onboarding/ObsidianOnboarding.tsx`   |
| 404 / error boundary    | The 404 numeral                                                                     | `src/routes/__root.tsx`                              |
| Any empty screen        | `EmptyState` headline (default Pixel; hosts already carrying a Pixel element pass `pixel={false}`) | `src/components/cadence/Primitives.tsx` |
| Any screen, while an agent runs | The `.ai-working-word` shimmer word (counts as that screen's moment while visible) | `src/styles.css` utility                     |

Rules the inventory enforces: never body copy, never dense UI, never inside tables,
menus, or popover rows; a surface adding a new Pixel element must first remove or opt
out the one it already has.
