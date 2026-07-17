# Workflow & pipeline builders

> An editable node-and-connector canvas where a person assembles a sequence of steps (triggers, actions, conditions, agent work) and watches real run status travel through it.
> Extension — base: Geist `Card` (node shell, `border`+`shadow` pairing, `secondary` for groups), `Badge` (status/type chips, color-to-meaning map), `Grid` (guide-mesh concept, reinterpreted as a canvas dot-grid), `Context Menu`, `Menu`/Dots Menu, `Loading Dots`, `Banner`, plus the color/typography/materials/spacing token layer and the `property-panels.md` extension (side-panel editing) and `tables-data-grids.md` extension (status color law, mobile card-collapse precedent) · inspiration: Figma's canvas conventions (dot-grid ground, marquee-select, pinch-to-zoom), n8n/Linear-style restraint (quiet chrome, status color earns its keep, one signature moment per surface) — principles only, re-expressed in Tempo's own vocabulary, never copied.

## Anatomy

A workflow builder is one `WorkflowCanvas` region (the pannable/zoomable 2D surface) plus one `PropertyPanel` (from `property-panels.md`, unmodified) that opens when something on the canvas is selected. The canvas itself is not a new elevation: it is page chrome, like the docked property-rail, not a floating material. Everything that floats above it (context menu, validation tooltip, the toolbar pill) picks its material from the existing presets.

```
┌─ WorkflowCanvas ────────────────────────────────────────────────────────┐
│ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·│  ← dot-grid ground, gray-400 dots
│ · · ╭─ ○ New PR opened ─╮ · · · · · · · · · · · · · · · · · · · · · · ·│  ← trigger node (pill shell)
│ · · ╰─────────┬─────────╯ · · · · · · · · · · · · · · · · · · · · · · ·│
│ · · · · · · · │ · · · · · · · · · · · · · · · · · · · · · · · · · · · ·│  ← connector (edge), gray-600 idle
│ · · · ┌───────▼────────────┐ · · · · · · · · · · · · · · · · · · · · · │
│ · · · │ ⋯  Run checks   ⋯  │ · · · · · · · · · · · · · · · · · · · · · │  ← step node, SELECTED (ember ring)
│ · · · │ ● Running · 0:12    │ · · · · · · · · · · · · · · · · · · · · · │     footer strip: Status Dot + duration
│ · · · └───────┬────────────┘ · · · · · · · · · · · · · · · · · · · · · │
│ · · · · · · · ◇│ · · · · · · · · · · · · · · · · · · · · · · · · · · · │  ← decision node marker (diamond glyph)
│ · · ┌──────────▼───────────┐ · · · · · · · · · · · · · · · · · · · · · │
│ · · │ Checks passed?       │ · · · · · · · · · · · · · · · · · · · · · │
│ · · └──────┬─────────┬─────┘ · · · · · · · · · · · · · · · · · · · · · │
│ · · · · yes│         │no · · · · · · · · · · · · · · · · · · · · · · · │  ← branch labels on connectors
│ · ·        ▼         ▼ · · · · · · · · · · · · · · · · · · · · · · · · │
│                                                                          │
│  [－  100%  ＋]  [⊡ Fit]  [+ Add step]              ⊟ Minimap  (2 issues)│  ← floating toolbar + validation summary
└──────────────────────────────────────────────────────────────────────────┘
                                            ┌─ PropertyPanel (docked) ────┐
                                            │ ‹ Back      STEP        ⋯  │
                                            │             Run checks     │
                                            ├────────────────────────────┤
                                            │ Overview                   │
                                            │  Tool          ▾  GitHub   │
                                            │  Timeout          10 min   │
                                            └────────────────────────────┘
```

**Named parts:**

| Part                           | Built from                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canvas ground                  | New (no Geist primitive)                                  | Full-bleed `--ds-background-100` (or `--ds-background-200` when the surface wants subtle separation from a docked rail beside it) with a repeating dot pattern in `--ds-gray-400` at a `--geist-gap` (24px) pitch, scaling with zoom. Reinterprets Geist Grid's guide-mesh idea: Grid renders a _line_ mesh because it is a layout-visualization primitive; a flow canvas already has its own lines (the connectors), so a dot mesh reads as ground texture without competing for the eye's attention. Purely decorative: `aria-hidden="true"`. |
| Node card (step)               | `Card` (`border` + `shadow`, always paired per `card.md`) | `material-small` shell (6px radius), fixed width (240 to 280px), variable height. Header row: type icon chip, editable title (`text-label-14`, `gray-1000`), trailing Dots Menu. Body: one to two lines of config summary (`text-copy-13`, `gray-900`). Optional footer strip: Status Dot + relative duration, mono, once the node has run at least once.                                                                                                                                                                                       |
| Node card (trigger / terminal) | Same `Card` base, `rounded-full` shell                    | Pill-shaped instead of the rectangular step shell, so entry points and end states read at a glance without a label.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Node card (decision)           | Same `Card` base as step                                  | Keeps the rectangular shell for text legibility (a rotated diamond card would clip its own label); a small diamond glyph (`Diamond`, 14px, `gray-900`) sits before the title instead, and its two or more outgoing connectors carry short branch labels ("yes" / "no", or the matched condition).                                                                                                                                                                                                                                               |
| Group / frame                  | `Card` (`secondary` variant)                              | A muted, dashed-border region behind a cluster of nodes, non-interactive except its own header label and a collapse toggle. Sits at a lower stacking position than any node or connector it contains.                                                                                                                                                                                                                                                                                                                                           |
| Ports                          | New (no Geist primitive)                                  | Small circular attachment points on a node's edges (left/right for horizontal flows, top/bottom for vertical ones): `1px solid gray-600` ring, `background-100` fill, `8px` diameter. A connectable port under drag-hover gets the shared `--ds-focus-ring-outline` treatment (it is already ember-hued by token, so this needs no new color decision) rather than inventing a second "connectable" affordance.                                                                                                                                 |
| Connector (edge)               | New (no Geist primitive)                                  | An SVG path between two ports, arrowhead at the terminal end. Idle: `2px`, `gray-600`. See States for the full state set (hover, selected, drawing, executing, blocked, error).                                                                                                                                                                                                                                                                                                                                                                 |
| Validation badge               | `Badge` (`red`/`amber`, `contrast="low"`)                 | A small chip anchored to a node's top-right corner, overlapping the card edge slightly (notification-dot placement). Opens a `Tooltip` (`material-tooltip`) naming the specific problem on hover/focus.                                                                                                                                                                                                                                                                                                                                         |
| Canvas toolbar                 | New composition, `material-menu` shell                    | Floating pill, bottom-center or bottom-left: zoom out / zoom level (`text-tabular`) / zoom in / fit-to-view, then the primary "+ Add step" action. Controls snap to `--ds-size-small` (32px) icon buttons in a row, `--ds-popover-padding` (6px) internal padding, matching the shared popover anatomy.                                                                                                                                                                                                                                         |
| Validation summary             | `Banner`-derived composition                              | A compact "N issues" chip or thin banner at the toolbar's trailing edge; clicking it pans/zooms to and selects the first flagged node rather than only describing the count.                                                                                                                                                                                                                                                                                                                                                                    |
| Minimap (optional)             | New, `material-small` shell                               | Bottom-right corner, a scaled bird's-eye view of the whole canvas with a viewport rectangle; toggled by a small icon button in the toolbar.                                                                                                                                                                                                                                                                                                                                                                                                     |
| Side panel                     | `PropertyPanel` (`property-panels.md`, unmodified)        | Opens docked (desktop), overlay drawer (tablet), or full-screen sheet (mobile) exactly per that pattern's own Variants section. This pattern supplies node-typed fields into `PropertySection`/`PropertyRow`; it does not re-implement the shell.                                                                                                                                                                                                                                                                                               |

## Variants

- **Connector routing** — `bezier` (smooth curve, the default; reads calmest on dense canvases), `orthogonal` (right-angle elbow routing, useful when a pipeline's branch structure needs to look like a flowchart rather than a loose diagram), `straight` (only for very small, low-branching canvases). Pick one per surface and keep it consistent; never mix routing styles on the same canvas.
- **Node density** — `compact` (icon + title only, for dense pipelines with many steps), `standard` (icon + title + one-line config summary, the default), `expanded` (adds a short inline preview of the last run's output or a config snippet). Each density keeps the same card padding rhythm (`--geist-space-3x`/`4x`); expanded only grows the body, never the header.
- **Node type (semantic, not a visual skin)** — `trigger` (pill shell, canvas entry point, at most one per canvas unless the surface explicitly supports multiple entry conditions), `step`/`action` (the default rectangular card), `decision`/`condition` (rectangular card + diamond glyph + labeled branches), `terminal`/`end` (pill shell, no outgoing connector). A canvas mixes types freely; the shell shape is what tells them apart, not color.
- **Grouping** — plain canvas (no groups, the default for short pipelines) vs. grouped canvas (one or more `secondary`-Card frames clustering related nodes, collapsible to a single summary card when a group is closed).
- **Canvas chrome** — with/without minimap (off by default below a node-count threshold where a bird's-eye view adds little), with/without the background dot-grid (a "focus mode" that hides the dots for a presentation-style screenshot or review pass, ground fill only).
- **Selection scope** — single-node selection (the default, opens `PropertyPanel` in single-entity mode), marquee/multi-select (drag a rectangle over empty canvas, opens `PropertyPanel` in bulk mode per that pattern's own Mixed-value contract), and edge selection (clicking a connector selects it instead of a node, opening a lighter-weight panel scoped to that connector's own settings, e.g. a condition expression).

## States

| Part / state                                     | Trigger                                                | Tokens                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node, idle/draft                                 | default, never run                                     | Border `--ds-gray-400`, fill `--ds-background-100`, title `--ds-gray-1000`, body `--ds-gray-900`                                                                                                                                                                                       |
| Node, hover                                      | pointer over node, not selected                        | Border brightens to `--ds-gray-500`; Dots Menu fades from `opacity: 0` to `opacity: 1`                                                                                                                                                                                                 |
| Node, dragging                                   | pointer-down + move                                    | Border unchanged; a `--ds-shadow-medium` lift is added for the drag duration only (removed on drop) so the dragged card visibly separates from the ground plane                                                                                                                        |
| Node, selected                                   | click, or reached via keyboard and activated           | 2px ring `--ds-ember-600` (`box-shadow`, not a border swap, so content never reflows) plus a subtle `--ds-ember-100` fill replacing `--ds-background-100` on the card, mirroring the selected-row treatment in `tables-data-grids.md`                                                  |
| Node, focus-visible (keyboard, not yet selected) | roving-tabindex focus lands on the node                | `--ds-focus-ring` layered outside whatever selection ring is already present, exactly as a table row layers hover-over-selected                                                                                                                                                        |
| Node, running                                    | an execution has reached this node and not yet left it | Border `--ds-blue-400` (informational, in-progress); footer Status Dot `--ds-blue-600` with a gentle opacity pulse gated on `prefers-reduced-motion` (falls back to a static solid dot)                                                                                                |
| Node, completed                                  | the run passed through and finished cleanly            | Border reverts to `--ds-gray-400` (no lingering chrome); footer Status Dot `--ds-green-600`, no checkmark glyph layered on top (color + label already carry the meaning, per `badge.md`'s no-redundant-iconography rule)                                                               |
| Node, failed                                     | the run errored at this node                           | Border `--ds-red-400` (this is the one status that keeps a colored border, since a failed step is exactly the thing an operator must not miss); footer Status Dot `--ds-red-600`; validation-style Badge chip optional if the failure needs a specific message beyond the status label |
| Node, waiting on approval                        | an HITL gate is paused at this node                    | Footer Status Dot `--ds-amber-600`; border stays neutral `--ds-gray-400` (a pending gate is a request for attention, not yet a warning)                                                                                                                                                |
| Node, skipped/blocked                            | upstream branch not taken, or upstream failed          | Card at reduced opacity (`~0.5`), Status Dot `--ds-gray-600`, no interactive hover lift                                                                                                                                                                                                |
| Node, disabled (viewer lacks edit permission)    | read-only mode                                         | No hover/drag affordance at all; Dots Menu shows only non-mutating actions ("View config"), paired with a `Tooltip` naming the reason, per the disabled-control-explaining-Tooltip contract                                                                                            |
| Node, validation error                           | a required field is missing or invalid                 | Small `red`/`amber` `Badge` (`contrast="low"`) anchored top-right of the card; hover/focus opens a `Tooltip` (`material-tooltip`) with the specific message                                                                                                                            |
| Port, idle                                       | default                                                | `1px solid gray-600` ring, `background-100` fill                                                                                                                                                                                                                                       |
| Port, hover/connectable target                   | dragging a connector toward it                         | `--ds-focus-ring-outline` (2px, ember-hued by the existing focus token, not a new color decision)                                                                                                                                                                                      |
| Port, connected                                  | at least one edge attached                             | Fill switches to `--ds-gray-900` so an occupied port is visually denser than an empty one                                                                                                                                                                                              |
| Connector, idle                                  | default, not yet part of any run                       | `2px`, `--ds-gray-600`                                                                                                                                                                                                                                                                 |
| Connector, hover                                 | pointer over the path                                  | `--ds-gray-900`, cursor `pointer`                                                                                                                                                                                                                                                      |
| Connector, selected                              | clicked                                                | Same ring treatment as a selected node (`--ds-ember-600`), thickened to `3px`                                                                                                                                                                                                          |
| Connector, being drawn                           | dragging from a port, not yet dropped                  | Dashed, `--ds-focus-color` (ember-hued), follows the pointer with no easing (1:1 tracking, not animated)                                                                                                                                                                               |
| Connector, executing                             | live run currently traversing this edge                | `--ds-blue-600`, animated dash offset (marching flow) or a single traveling dot, gated on `prefers-reduced-motion` (falls back to a static solid `--ds-blue-600` stroke, no motion)                                                                                                    |
| Connector, already traversed                     | the run has passed through and moved on                | `--ds-gray-900` (a shade denser than idle, so a glance shows "this path already fired")                                                                                                                                                                                                |
| Connector, blocked                               | downstream of a skipped/failed branch                  | Dashed, `--ds-gray-600` at reduced opacity, matching the skipped node it feeds                                                                                                                                                                                                         |
| Connector, error                                 | a condition/edge itself is misconfigured               | `--ds-red-600`, dashed, paired with the same Tooltip contract as a node validation error                                                                                                                                                                                               |
| Toolbar control, default/hover/active/focus      | standard icon-button states                            | Same as the button/icon-button contract: `--ds-gray-900` icon at rest, `--ds-gray-100` hover fill, `--ds-gray-200` active fill, `--ds-focus-ring` on keyboard focus                                                                                                                    |
| Canvas, loading                                  | canvas data is being fetched                           | Ground and toolbar render immediately; nodes/edges are replaced by 3 to 5 skeleton cards at representative positions, `--ds-gray-200` fill, pulse gated on `prefers-reduced-motion`                                                                                                    |
| Canvas, empty (no steps yet)                     | a brand-new pipeline                                   | Centered instruction copy ("Add a trigger to start this pipeline.") plus the toolbar's "+ Add step" action; at most one small geometric composition above the copy, per the identity layer's empty-state budget                                                                        |
| Canvas, error                                    | the pipeline failed to load                            | The actual `Error` composition (title, message, mono request id, "Try again") replaces the canvas body entirely; the toolbar stays visible so "+ Add step" still reads as reachable once the retry succeeds                                                                            |

## Interaction model

**Pointer**

- Drag a node to reposition it; drop snaps to the nearest `--geist-space` (4px) increment so cards stay grid-aligned without a rigid, visible snap grid forcing the position.
- Drag from a port to start a connector; drop on a compatible port to complete it, drop on empty canvas to open a quick-add menu offering to create and connect a new node in one action.
- Click empty canvas to deselect everything and close the side panel (docked variant just shows its empty state again; overlay/sheet variants close, matching `property-panels.md`'s own "closes by deselecting" docked behavior).
- Click-drag on empty canvas draws a marquee rectangle; every node fully inside it becomes the multi-selection.
- Right-click a node or the empty canvas opens a `Context Menu` mirroring the same action set already reachable through the Dots Menu (duplicate, delete, disconnect) or, on empty canvas, the same "+ Add step" the toolbar offers — never a context-menu-only action, per `context-menu.md`'s own best-practice rule.
- Scroll wheel zooms, centered on the cursor position; trackpad pinch zooms the same way; two-finger trackpad pan (or a plain click-drag on empty canvas) pans.
- Space held + drag temporarily switches to a pan-only "hand" cursor even while a tool that would otherwise drag-create is active (a discoverable escape hatch, not the only way to pan).
- Middle-mouse-button drag pans, for anyone whose habit comes from other canvas tools.

**Keyboard** (full key map)

| Key                               | Context                                   | Effect                                                                                                                                                                                                               |
| --------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab`               | Anywhere on the surface                   | Enters/leaves the canvas as one stop (roving `tabindex`, same model as `tables-data-grids.md`'s data-grid pattern), then moves through the toolbar controls, then into the side panel if one is open.                |
| `Arrow keys`                      | A node has roving focus                   | Moves focus to the next connected node in graph order (following outgoing connectors first, then siblings) — not raw visual proximity, so keyboard traversal follows the pipeline's actual logic.                    |
| `Shift+Arrow keys`                | A node has focus                          | Nudges the focused node's position by one `--geist-space` (4px) increment, for keyboard-only fine placement.                                                                                                         |
| `Enter` / `Space`                 | A node has focus                          | Selects it and opens `PropertyPanel`, exactly as clicking would.                                                                                                                                                     |
| `F2`                              | A node is selected                        | Enters inline title-edit mode on the node's header label.                                                                                                                                                            |
| `Delete` / `Backspace`            | One or more nodes or a connector selected | Deletes the selection (a destructive action; per the contract's destructive-action rule this pairs with a confirming `Toast` offering Undo rather than a blocking dialog, since it is reversible for a few seconds). |
| `Cmd/Ctrl+D`                      | A node selected                           | Duplicates it, placed with a small position offset so the copy is immediately visible and re-draggable.                                                                                                              |
| `Cmd/Ctrl+A`                      | Canvas focused                            | Selects every node (not connectors), opening `PropertyPanel` in bulk mode.                                                                                                                                           |
| `Cmd/Ctrl+C` / `Cmd/Ctrl+V`       | Node(s) selected / canvas focused         | Copies and pastes nodes, including their internal config, excluding connectors to nodes outside the copied set.                                                                                                      |
| `Escape`                          | Any selection or open panel               | Clears the current selection; if the side panel is an overlay/sheet, closes it and returns focus to the canvas per `property-panels.md`'s own Escape contract.                                                       |
| `+` / `-` (or `Cmd/Ctrl` `+`/`-`) | Canvas focused                            | Zooms in/out by one step.                                                                                                                                                                                            |
| `Cmd/Ctrl+0`                      | Canvas focused                            | Resets zoom to 100%.                                                                                                                                                                                                 |
| `Shift+1`                         | Canvas focused                            | Fit-to-view (frames every node in the current viewport).                                                                                                                                                             |

**Screen reader**

A free-form 2D drag canvas has no standardized accessible pattern; rather than inventing one, this pattern keeps the canvas itself lightly instrumented and ships a genuinely accessible parallel: every canvas surface also exposes a **"List view"** toggle that renders the same nodes as an ordered `tables-data-grids.md`-style list (one row per node: title, type, status, a Dots Menu with the identical action set). List view is not a downgrade — it is reachable, orderable by the graph's own topology, and every action available on the canvas is available there too, so a screen-reader or keyboard-only user is never routed to a second-class experience. Concretely:

- The canvas container carries `role="group"` with an `aria-label` naming the pipeline, not `role="application"` — that role would opt the whole region out of the screen reader's normal virtual-cursor navigation, which is too large a cost for a decorative dot ground and a set of already-individually-focusable node cards.
- Each node is a real, individually focusable element (`tabindex` managed by the roving-focus scheme above) with an accessible name combining its type and title ("Step, Run checks") and its current status ("Running").
- Connectors themselves are not separately announced in canvas mode (they are implied by graph-order Arrow-key traversal); the List view surfaces the same "leads to" relationship as plain text ("Then: Checks passed?") for anyone who wants it spelled out.
- The validation summary count and any live run-status change are announced via a visually-hidden `aria-live="polite"` region, matching the bulk-selection-count pattern in `tables-data-grids.md`.

**Motion**

- All transitions use `--ds-motion-timing-swift`.
- Node drag follows the pointer 1:1, no easing; the drop-to-grid settle animates over roughly 150ms on the swift easing (a small, functional correction, not a decorative bounce).
- Discrete, button-triggered viewport changes (zoom in/out, fit-to-view) animate scale/pan over `--ds-motion-popover-duration` (200ms) — these are fast, discrete jumps, closer in feel to a popover opening than a floating overlay entrance.
- Connector-drawing preview follows the pointer with no easing; on successful drop, the completed path settles into its final curve over ~150ms swift.
- The executing-connector dash-flow or traveling-dot animation loops continuously while a run is live and is the only sanctioned continuous/looping motion on the canvas; it must not be combined with a second moving indicator on the same edge, mirroring `loading-dots.md`'s "don't stack two animated cues" rule. It is this pattern's one personality touch — do not add a second one (for example, an additional glow or bounce on node arrival).
- The docked-to-overlay `PropertyPanel` swap and the mobile full-screen sheet inherit their own timing unmodified from `property-panels.md` (`--ds-motion-overlay-duration`/`--ds-motion-overlay-scale` for the drawer/sheet, `--ds-motion-popover-duration` for section expand/collapse inside it).
- Every animation above degrades under `prefers-reduced-motion`: drag/drop-settle and zoom transitions snap instantly to their end state, the connector-drawing preview and completed-path settle skip their transition entirely, and the executing-connector animation becomes a static solid `--ds-blue-600` stroke with no dash motion or traveling dot.

## Responsive behavior

- **Desktop (roughly ≥1024px).** The primary target. Full drag-and-connect canvas, docked `PropertyPanel` rail beside it, optional minimap, all pointer and keyboard interactions above available.
- **Tablet (roughly 768 to 1023px).** Touch drag replaces mouse drag for repositioning nodes and drawing connectors; long-press replaces right-click for the Context Menu; pinch replaces scroll-wheel zoom; two-finger drag pans. `PropertyPanel` switches to the overlay-drawer variant (per `property-panels.md`) so the canvas keeps its full width rather than permanently losing a rail's worth of space to a docked panel.
- **Mobile (below roughly 768px).** Free-form 2D drag-and-connect editing is not a mobile-appropriate interaction (small hit targets, no natural pinch-and-drag-simultaneously gesture for rewiring). The canvas is replaced by a **read-only, ordered list of Cards**, one per node, following the exact mobile card-collapse shape `tables-data-grids.md` already documents (primary text as the card heading, status as a Badge in the corner, a single Dots Menu for available actions). Tapping a card opens `PropertyPanel` as a full-screen sheet in read-only or limited-edit mode depending on permissions. Any control that would start a rewiring gesture (dragging a new connector) instead surfaces a plain instruction ("Switch to a larger screen to rewire this pipeline") rather than attempting a degraded touch version of drag-to-connect.

## Accessibility

- The canvas is `role="group"` with a descriptive `aria-label`, never `role="application"` — see the Screen reader section above for why, and never ship the canvas as the _only_ way to reach a pipeline's actions; the List view toggle is mandatory, not optional polish, matching the contract's standing rule that no interaction is reachable through exactly one gesture-only path.
- Focus order: toolbar (zoom, fit, add-step) → List-view toggle → canvas nodes in graph order (roving `tabindex`) → side panel, when open, per `property-panels.md`'s own internal order.
- Every status signal (node border, Status Dot, connector color) ships with a paired text label somewhere in the accessible tree — the footer duration string, the node's accessible name, or the List view's status column — never color alone, per `badge.md`'s standing rule.
- Contrast: node title text stays `--ds-gray-1000`; body/description text stays `--ds-gray-900` at minimum; a failed node's `--ds-red-400` border and a running node's `--ds-blue-400` border are both drawn from the border-role step (400 to 600), never the text-role steps, so they read as chrome rather than being mistaken for body copy.
- `prefers-reduced-motion` removes every canvas-native animation's motion component (see Motion) without removing any information — nothing on this canvas is comprehensible only via animation.
- Disabled/read-only nodes always pair with a `Tooltip` (or a panel-level lock glyph in fully locked mode) naming the reason, exactly per `property-panels.md`'s own disabled-row rule.

## Tokens used

| Token / class                                                      | Used for                                                                                                                                     |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                              | Canvas ground fill; node/port default fill                                                                                                   |
| `--ds-background-200`                                              | Optional subtle canvas-vs-rail differentiation                                                                                               |
| `--ds-gray-100`                                                    | Toolbar control hover fill                                                                                                                   |
| `--ds-gray-200`                                                    | Toolbar control active fill; loading-skeleton node fill                                                                                      |
| `--ds-gray-400`                                                    | Dot-grid ground dots; idle node border; idle port ring                                                                                       |
| `--ds-gray-500`                                                    | Node border on hover                                                                                                                         |
| `--ds-gray-600`                                                    | Idle connector stroke; skipped-node Status Dot; idle port ring alternate step                                                                |
| `--ds-gray-900`                                                    | Node body/description text; hovered/selected connector stroke; connected-port fill; already-traversed connector stroke; toolbar icon default |
| `--ds-gray-1000`                                                   | Node title text                                                                                                                              |
| `--ds-focus-color` / `--ds-focus-ring` / `--ds-focus-ring-outline` | Keyboard focus on nodes, ports, toolbar controls; connectable-port drag-hover highlight; connector-being-drawn stroke                        |
| `--ds-ember-100`                                                   | Selected-node fill wash                                                                                                                      |
| `--ds-ember-600`                                                   | Selected-node ring; selected-connector stroke                                                                                                |
| `--ds-blue-400`                                                    | Running-node border                                                                                                                          |
| `--ds-blue-600`                                                    | Running-node Status Dot; executing-connector stroke                                                                                          |
| `--ds-green-600`                                                   | Completed-node Status Dot                                                                                                                    |
| `--ds-amber-600`                                                   | Waiting-on-approval Status Dot                                                                                                               |
| `--ds-red-400`                                                     | Failed-node border; error-connector stroke's paired node border                                                                              |
| `--ds-red-600`                                                     | Failed-node Status Dot; error-connector stroke                                                                                               |
| `text-label-14`                                                    | Node title                                                                                                                                   |
| `text-copy-13`                                                     | Node config-summary body text                                                                                                                |
| `text-label-13-mono` / `text-label-12-mono`                        | Node duration/id, toolbar zoom-percentage readout                                                                                            |
| `text-button-14`                                                   | Toolbar buttons, "+ Add step" action                                                                                                         |
| `text-tabular`                                                     | Zoom-percentage number, running-node duration                                                                                                |
| `material-small`                                                   | Node card shell; minimap shell                                                                                                               |
| `material-menu`                                                    | Canvas toolbar pill; Context Menu / Dots Menu popover                                                                                        |
| `material-tooltip`                                                 | Validation-error and disabled-control explainer tooltips                                                                                     |
| `material-modal` / `material-fullscreen`                           | Inherited unmodified for the `PropertyPanel` overlay/sheet variants                                                                          |
| `--ds-radius-small`                                                | Node card, toolbar pill, minimap corner radius                                                                                               |
| `--ds-size-small`                                                  | Toolbar icon-button height; port hit target                                                                                                  |
| `--ds-size-medium`                                                 | Inline node-title edit input                                                                                                                 |
| `--geist-space` (4px)                                              | Node drag-drop grid-alignment increment                                                                                                      |
| `--geist-space-3x` / `--geist-space-4x`                            | Node internal padding                                                                                                                        |
| `--geist-gap` (24px)                                               | Dot-grid pitch; canvas-to-panel gutter                                                                                                       |
| `--geist-gap-quarter`                                              | Toolbar internal control spacing                                                                                                             |
| `--ds-motion-timing-swift`                                         | Every transition in this pattern                                                                                                             |
| `--ds-motion-popover-duration`                                     | Zoom/fit-to-view transitions; connector-completion settle                                                                                    |
| `--ds-motion-overlay-duration` / `--ds-motion-overlay-scale`       | Inherited for the `PropertyPanel` drawer/sheet variants                                                                                      |
| `--ds-z-menu`                                                      | Context Menu / Dots Menu stacking                                                                                                            |
| `--ds-z-drawer`                                                    | Inherited for the tablet overlay `PropertyPanel`                                                                                             |
| `--ds-z-tooltip`                                                   | Validation tooltip stacking                                                                                                                  |

## Implementation guidance

**Radix primitive mapping**

- Node overflow actions → `@radix-ui/react-dropdown-menu` via the existing `src/components/ui/dropdown-menu.tsx` (same Dots Menu retheme as `tables-data-grids.md` documents).
- Right-click node/canvas actions → `@radix-ui/react-context-menu` via `src/components/ui/context-menu.tsx`, mirroring the Dots Menu's action set exactly, never introducing an action that only exists there.
- Validation tooltip → `src/components/ui/tooltip.tsx` (Radix `Tooltip`), `material-tooltip`.
- Side panel → `PropertyPanel`/`PropertySection`/`PropertyRow` exactly as specified in `property-panels.md`'s own Implementation guidance — this pattern is a consumer of that component set, not a second implementation of it.
- Node card shell → build on the existing `src/components/ui/card.tsx` (retheme to the Geist `Card` boolean-prop shape — `border`, `shadow`, `hoverable`, `secondary` — described in `research/card.md`) rather than a bespoke `<div>`.

**New shared primitives to build** (none of these exist yet)

- `src/components/workflow/WorkflowCanvas.tsx` — the pannable/zoomable surface: viewport transform state, dot-grid background, marquee-select, keyboard roving-focus/graph-traversal.
- `src/components/workflow/NodeCard.tsx` — the step/trigger/decision/terminal card, composing `card.tsx` + the node-type shape variants above.
- `src/components/workflow/ConnectorLayer.tsx` — the SVG edge-rendering layer: idle/hover/selected/drawing/executing/blocked/error stroke states, arrowheads, branch labels.
- `src/components/workflow/CanvasToolbar.tsx` — the floating zoom/fit/add-step/minimap-toggle pill, `material-menu`.
- `src/components/workflow/NodeList.tsx` — the mandatory accessible/mobile parallel view, built directly on the existing `src/components/ui/table.tsx` (Table/TableRow/TableCell) card-collapse pattern from `tables-data-grids.md`, not a divergent list implementation.

**Rendering-engine decision (flagged, not resolved by this doc)**

No canvas/graph-layout library is currently a project dependency (`package.json` has no `@xyflow/react`/`reactflow`, `dagre`, or `elkjs`; the installed `d3-force`/`d3-force-3d` pair backs the unrelated 3D universe graph, not a 2D flow canvas). This pattern specifies the **design** contract only — anatomy, states, tokens, interaction model — deliberately independent of whether the eventual build hand-rolls SVG + CSS transforms or adopts a dedicated React flow-canvas library. Adding a new runtime dependency for this crosses the `bunfig.toml` 24-hour supply-chain guard and is an engineering/founder call, not a design one; flag it before starting the build rather than silently picking a library mid-implementation.

**Composition with existing Supaprod code**

- `src/components/product/FlowDiagram.tsx` is the closest existing surface today: a read-only, PRD-derived step/decision/state timeline. It already uses the exact `step` / `decision` / `state` shape vocabulary this pattern's node-type variant reuses (`KIND_SHAPE`/`KIND_LABEL` in that file), but it predates Tempo (legacy `rounded-lg`/`hairline`/`mono-label` classes, a plain vertical list, no drag/connect/zoom) and its scope (summarizing a spec's narrative flow) is narrower than an editable pipeline canvas. Don't extend it in place for this pattern; when a true editable canvas is built, treat `FlowDiagram.tsx`'s typed-node vocabulary as prior art to port forward, not code to inherit directly.
- `src/components/supaprod/Primitives.tsx`'s `StepDot` and the mission-stage rail in `src/routes/_authenticated.build.$missionId.tsx` are the closest existing real run-state precedent (`queued` / `running` / `waiting_approval` / `failed` / `halted` / `completed` / `planned`), which is exactly the status vocabulary this pattern's node/connector States tables map onto Tempo's blue/green/amber/red/gray roles. Reuse that same status vocabulary when wiring a workflow canvas to real mission data instead of inventing a second status enum.
- Node/edge position and selection state has no existing store in this codebase; keep it local component state (or a small dedicated canvas store) scoped to the one `WorkflowCanvas` instance, following the same "local state unless a cross-surface need appears" default `tables-data-grids.md` already applies to sort/page/selection.

## Usage examples

**1. Build mission pipeline — the actual `/build/$missionId` step graph, agent-run status flowing through**

```tsx
<WorkflowCanvas aria-label="Mission pipeline: Ship the billing v2 refactor">
  <NodeCard type="trigger" title="Mission started" />
  <NodeCard
    type="step"
    title="Plan"
    status={stepStatus(mission, "plan")}
    durationMs={mission.planDurationMs}
  />
  <NodeCard
    type="step"
    title="Code"
    status={stepStatus(mission, "code")}
    durationMs={mission.codeDurationMs}
    selected={selectedNodeId === "code"}
  />
  <NodeCard type="decision" title="Checks passed?" branches={["yes", "no"]} />
  <NodeCard type="step" title="Ship" status={stepStatus(mission, "ship")} />
  <NodeCard type="terminal" title="Mission complete" />

  <ConnectorLayer edges={mission.edges} activeEdgeId={mission.currentEdgeId} />
  <CanvasToolbar
    zoom={zoom}
    onZoomChange={setZoom}
    onFitToView={fitToView}
    onAddStep={openAddStepMenu}
  />
</WorkflowCanvas>;

{
  selectedNodeId && (
    <PropertyPanel placement="docked" entity={{ type: "Step", name: selectedNode.title }}>
      <PropertySection title="Overview" static>
        <PropertyRow
          label="Tool"
          value={selectedNode.tool}
          control={{ kind: "select", options: TOOL_OPTIONS }}
        />
        <PropertyRow
          label="Timeout"
          value={selectedNode.timeoutLabel}
          control={{ kind: "select", options: TIMEOUT_OPTIONS }}
        />
      </PropertySection>
    </PropertyPanel>
  );
}
```

**2. Automations builder — a BYO-source trigger/action pipeline with a misconfigured step**

```tsx
<WorkflowCanvas aria-label="Automation: New PR to Slack notification">
  <NodeCard type="trigger" title="New PR opened" tool="GitHub" />
  <NodeCard
    type="step"
    title="Post to Slack"
    validation={{ severity: "error", message: "Missing required field: channel" }}
  />
  <ConnectorLayer edges={automation.edges} />
  <ValidationSummary issues={automation.issues} onSelectFirstIssue={selectFirstFlaggedNode} />
  <CanvasToolbar
    zoom={zoom}
    onZoomChange={setZoom}
    onFitToView={fitToView}
    onAddStep={openAddStepMenu}
  />
</WorkflowCanvas>
```

**3. Guardrail evaluation pipeline — read-only List view fallback (mobile / screen reader)**

```tsx
<NodeList aria-label="Guardrail pipeline steps, list view">
  <Table>
    <TableBody>
      {pipeline.nodes.map((node) => (
        <TableRow key={node.id}>
          <TableCell className="text-label-14 text-[var(--ds-gray-1000)]">{node.title}</TableCell>
          <TableCell>
            <StatusBadge status={node.status} />
          </TableCell>
          <TableCell className="text-right">
            <DotsMenu
              items={[
                { label: "View config" },
                { label: "Duplicate step" },
                { label: "Delete step" },
              ]}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</NodeList>
```

## Do / Don't

**Do**

- Do keep gray as the resting color for every node and connector; reserve ember for selection and the single "+ Add step" primary CTA, blue for in-progress, green for success, amber for a pending gate, red for failure — status color goes on actual status, never decoration.
- Do pair every status signal (node border, Status Dot, connector color) with a text label somewhere in the accessible tree, never color alone.
- Do ship the List view as a first-class, fully-actionable parallel to the canvas, not a stripped-down afterthought — it is the mandatory accessible and mobile path, not optional polish.
- Do reuse `PropertyPanel`/`PropertySection`/`PropertyRow` unmodified for the side panel; this pattern only supplies node-typed fields into it.
- Do gate the executing-connector animation, the drag-drop settle, and every zoom transition on `prefers-reduced-motion`, with a static equivalent that loses no information.
- Do keep every action reachable through the right-click Context Menu also reachable through the visible Dots Menu, per `context-menu.md`'s own rule.
- Do snap node drag-drop to the 4px grid quietly; don't force a visibly gridded canvas that fights the dot-grid ground.

**Don't**

- Don't use ember for the running-state highlight. Running is informational (blue); ember is reserved for selection and the one primary CTA per view.
- Don't rotate a decision node's whole card to make a diamond shape — it clips the label. Use the diamond glyph instead.
- Don't set the canvas container to `role="application"` — it opts the whole region out of normal screen-reader navigation for the sake of a decorative dot ground and a handful of already-focusable cards.
- Don't stack a second material or a hand-rolled extra shadow/border on the node card, the toolbar pill, or the minimap. One preset each, per the materials law.
- Don't let the canvas be the only way to reach an action, a config field, or a validation message — the List view and the side panel must carry the same information and the same controls.
- Don't invent a second continuous animation on top of the executing-connector flow (no extra glow, no bouncing node) — one signature moment per surface is the identity-layer budget, and this is already spent.
- Don't add a checkmark or an X glyph on top of a status-colored Status Dot; the color plus its paired text label already carry the meaning, per `badge.md`'s no-redundant-iconography rule.
- Don't attempt a degraded touch version of drag-to-connect on mobile; state plainly that rewiring needs a larger screen and route editing to the desktop/tablet canvas instead.
