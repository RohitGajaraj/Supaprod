# SPEC-PRESENCE — the character, and how agency becomes visible

> _Written 2026-08-25 by MAIN (Fable), from the founder's direction the same day: "We need to
> create a character, like Claude as a character… make the journey more enjoyable, more
> interactive, more intuitive. Only then would the user stick with it."_
>
> **Governs the new presence items in [`BUILD-QUEUE.md`](./BUILD-QUEUE.md).** Reference screens
> are cited inline from Mobbin (600k-screen library, MAIN-only access); lanes get the mechanics
> in words here, which is what R-20 requires anyway — port mechanics, never screenshots.

> **AMENDED 2026-08-26 by [`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md).** The
> one-character ruling below stands for **one piece of work with one teammate acting**. When more than
> one teammate is genuinely working at once, each is drawn — same body, its own colour and name, with
> a live cursor at the object its newest `tool_calls` row targeted. The character is a species, not an
> individual. The roster is still never browsable.

## The ruling

**The crew becomes ONE character.** Fifteen seat slugs (`discovery-scout`, `strategist`,
`builder`…) are an org chart. The user meets a single named worker; the seats are its hands. It
speaks in first person, works in front of you, asks in place, and hands you the result. Every
frontier reference does this — one Claude, not a roster of subagents, even though subagents exist.

**Working name: `Supa` — a placeholder the founder can replace in one file.** Alternates
considered: `Miri` (from Meridian), `Otto`. The name lives in ONE exported constant
(`src/lib/presence/character.ts`, `CHARACTER_NAME`), so the founder's choice is a one-line change.
Outward use of the name (site, pitch) needs founder approval per standing rule; in-product it
ships as the placeholder until he rules.

## The iron law: presence is read, never staged

This repo already failed a branch for a timer advancing step labels — *"theatre by the repo's own
definition"* (`no-fabricated-agent-steps`). The character is bound by the same law:

- **Every visible state derives from a row that exists**: `agent_runs` in flight, the newest
  `tool_calls` row, `spine_tracks.last_hold`, `driveTrackNow`'s step stream. No timers, no
  scripted sequences, no invented verbs.
- A state the data cannot prove is a state the character does not show. If the reads fail, the
  character says it is out of touch — it never smiles on a dead feed (the F-38/F-39 lesson:
  optimistic health signals hid a month of failure).

## The states, each mapped to its source of truth

| State | Fires when | The character | Source |
| --- | --- | --- | --- |
| **Awake** | track open, no run in flight | still, present, offers the next move | `spine_tracks` row, no active run |
| **Thinking** | run in flight, no tool call yet | subtle motion + first-person line ("Reading what the workspace holds…") | `agent_runs.status` in flight |
| **Working** | tool call in flight/just landed | names the act in plain words: "Searching your signals", "Writing the spec", "Opening a pull request" | newest `tool_calls` row → verb map |
| **Asking** | `waiting-on-a-person` / pending gate | turns to face you; the consent card (L0-043, shipped) is its voice | `pending_gates`, hold |
| **Blocked** | `tools-refused` | says the door is locked and which one, no retry theatre | hold + tool name (R-26) |
| **Resting** | `out-of-window` between legs | breath, not spinner — "taking the next step…" while auto-continue fires | `DriveNowResult.stopped` |
| **Done** | route finished | hands over the verdict: what was believed, what happened | track + Learn card (L0-045) |

**Voice**: first person, plain, the founder's no-drama register. Gemini's handoff line is the
model: *"I'm on it — you can leave this page in the meantime."* Personality micro-copy (Lindy
ships lines like "Pondering the meaning of it all") is allowed ONLY as flavor on a state the data
proves, never as a substitute for the honest line, and never during Asking/Blocked.

## Anatomy — three mounts, one character

1. **In the run** (`/track/:id`): the character sits at the top of the transcript pane; its verb
   line IS the live status. The transcript stays (R-13: the transcript replaced the station
   widget — presence does not resurrect a station map, and station names stay off-surface, R-01).
   A quiet "3 of 7" count is permitted; a seven-row diagram is not.
2. **In the rail** (every surface): a miniature of the same character with its state — one click
   to the run (queue item 10 folds into this). When nothing runs, it is the door to `/start`.
3. **At the door** (`/start`, first 60 seconds): the character introduces itself in one line and
   is already working by the time the first paint settles (Ferndesk names its agent "Fern" on the
   first screen; Gemini starts the research before the modal closes). One sentence in → the
   character visibly picks it up. No tour, no tooltips.

## Reference mechanics (Mobbin, MAIN pulled 2026-08-25)

| Pattern | Source | What we take |
| --- | --- | --- |
| First-person pickup + "you can leave" | Google Gemini deep-research | the voice, and permission to leave |
| Step N of M + nested live tool calls | Rox | verb line grammar under a step count |
| Personality micro-copy over real steps | Lindy | flavor lines, bounded as above |
| Named agent on first screen | Ferndesk ("Fern") | the introduction moment |
| Avatar personalization | Notion AI ("Clopie") | LATER — not v1; one character first |
| Checklist with per-step elapsed clock | Emergent | the resting/working clock (useElapsed exists) |

## Ownership and order

| Piece | Owner | Notes |
| --- | --- | --- |
| `src/lib/presence/character.ts` — name, state derivation from run/tool/hold rows, verb map for every tool slug | **MAIN** | pure functions + tests; the verb map keys on TOOL slugs so a renamed tool fails loudly, not silently (renamed-export lesson) |
| Character component: avatar + states + motion on Meridian tokens (`--mrd-ease`, `--mrd-d-*`) | **L0** | ember stays in the logo — the character uses Meridian accent tokens, never the brand ember (standing rule) |
| Rail mount + `/start` introduction moment | **L1** | shell is L1's path |
| Live read model if polling proves too coarse (`getLiveRun`: current run + newest tool call) | **MAIN** | only if TrackRun's existing poll cannot carry the verb line |

**v1 needs no new tables and no new writes.** Everything above reads rows that already exist.

## Embodiment — format, motion, and themes (ruled by Session A, founder questions of 2026-08-25 15:5x)

**In-product format: layered SVG animated by CSS/Motion on Meridian tokens — never GIF or video.**
Three reasons, each sufficient: (1) a GIF cannot flip with the theme, and this character's whole
color story is that the line takes the theme's ink while the ember stays constant — exactly how
`favicon-adaptive.svg` already behaves; (2) a GIF loops whether or not anything is true, which is
this product's one unforgivable regression — theatre — while SVG driven by `character.ts` can
only show a state the data proved; (3) SVG is crisp from 16px to full-bleed at a few KB, and it
respects `prefers-reduced-motion` through the same inline-animation rule the rest of Meridian
uses. **GIF/video renders of the art are for marketing surfaces only** (site, socials, the film),
where a fixed ground is honest.

**The theme rule, stated once:** line = the surface's ink family (white/azure-iridescent on dark,
deep ink/azure-violet on light), ember core = constant, eyes = `currentColor` inside the core.
The v2 light sheet is the visual proof; the adaptive favicon is the precedent.

**Motion vocabulary** (Meridian `--mrd-ease*`/`--mrd-d-*`/`mrd-attention` only, cadences from
`marks.tsx`): Awake = still with an occasional idle blink and one loop toe-tap (flavor on a
proven idle state — allowed, it claims nothing about work); Thinking = eyes up, two or three
evidence-motes orbiting; Working = happy focus, motes flowing into the work; Asking = turns to
face, quicker pulse; Celebrating = the jitter plus motes thrown as confetti; Ta-da = the handover
flourish when a route finishes. **Every state still derives from `character.ts`; the fun is in
HOW a true state is drawn, never in drawing an untrue one.**

**Where it appears, in priority order:** (1) the run header — full character, the live verb line
(shipped); (2) the rail miniature — 24px mark, one glance = is it working (queue 54, L1);
(3) `/start` — the introduction moment; (4) empty states — the character explains what would
fill the space, which converts a dead end into an invitation; (5) route-finished — the Ta-da;
(6) loading boundaries — Thinking, honestly, because something IS being fetched. The PNG art
directs a production **vector redraw pinned to the real seven-loop path** — that pass is the
bridge from Higgsfield concept to shippable SVG and is queued as the presence track's next item.

## What would prove it wrong

If a user watches a full walk and cannot say afterwards *who* did the work and *what it is
waiting for*, the character failed. If any state ever shows that the data did not prove,
the feature is deleted before it is fixed — theatre is the one regression this product
cannot afford.
