# design-reference/ — the design of record

This folder holds the **frozen, runnable reference designs** for Supaprod. Nothing
here is production code and none of it is imported by the app; it exists so
humans and AI builders can see precisely how every screen should look and
behave before implementing it in `src/`.

> [!CAUTION]
>
> ## CURRENT: Meridian. Everything in this folder is retired.
>
> **This callout used to declare the v5 "Tempo" system CURRENT and name an archived file as "the law". That was wrong from 2026-08-14 and was corrected on 2026-08-19.** It is the most dangerous kind of stale doc: a retired system claiming authority in the folder AI builders are pointed at, which is how a feature gets built on a dead vocabulary without anyone noticing.
>
> **The design system is Meridian, and there is no other one.**
> Tokens: [`../src/styles/meridian.css`](../src/styles/meridian.css) · Components: [`../src/components/meridian/`](../src/components/meridian/) · **Contract: [`../docs/design/DESIGN-SYSTEM.md`](../docs/design/DESIGN-SYSTEM.md)**
>
> **The visual reference is [beautifui.dev](https://www.beautifului.dev/)**, ported from its real source rather than from screenshots, because a screenshot loses the easing, the reveal order, the overflow behaviour and the focus model. All 19 of its components are ported; the map is [`../docs/design/MERIDIAN-REFERENCE-PARITY.md`](../docs/design/MERIDIAN-REFERENCE-PARITY.md).
>
> **Retired, permanently: v1 Ember, v3 Obsidian, v4 Loom, v5 Tempo, Cadence/ink.** Every file in this folder belongs to one of them. They are kept as history. **History is not authority.** When anything here disagrees with Meridian, Meridian wins and the file here is wrong.
>
> ### If Meridian has no component for what you need
>
> **Do not fall back to anything in this folder.** In order:
>
> 1. **Check [beautifui.dev](https://www.beautifului.dev/)** — the reference standard, and the parity doc says which of its 19 components are already ported.
> 2. **Research the best proven product in that category** and lift its information model and verbs, per the standing rule from 2026-08-01. Append the research to [`../docs/design/REFERENCE-PATTERNS.md`](../docs/design/REFERENCE-PATTERNS.md) in the same session so nobody pays for it twice.
> 3. **Build it into Meridian**, expressed in `--mrd-*` and composed from `src/components/meridian/`. A token earns its place on the second caller, is named for meaning rather than appearance, is measured in both grounds, and carries its argument in the file.
>
> **A missing Meridian component is a gap in Meridian, and the answer is to close it — never to reach past it.** Reaching back into a retired system because the value already exists there is the single move this whole migration exists to stop.
## Rule for builders (human or AI)

When implementing a screen that exists in a CURRENT reference: **port it**.
Match layout, positioning, hierarchy, spacing, copy, and interaction. Do not
redesign. For app surfaces the tokens are the Obsidian `tokens/*.css` custom
properties (copy verbatim; see the v3 package). For the legacy parchment
material below, tokens come from the repo root `supaprod/tokens.css` (the copy
in `design-reference/supaprod/tokens.css` is a snapshot so this folder runs
standalone — treat the root one as the live source).

## Running it

The prototype loads its scripts via fetch, so open it through a local server,
not file://

```bash
cd design-reference
npx serve .            # or: python3 -m http.server
# open http://localhost:3000/Supaprod%20Prototype.html
```

## Contents

| File                             | What it is                                                               |
| -------------------------------- | ------------------------------------------------------------------------ |
| `Supaprod Prototype.html`        | Entry point — the full app mockup                                        |
| `Platform Design Blueprint.html` | The signed design contract (v2)                                          |
| `supaprod/tokens.css`            | Token snapshot (live copy is at repo root)                               |
| `supaprod/data.js`               | All mock data, incl. drill-down payloads                                 |
| `supaprod/app.jsx`               | Routing, shared state, approvals/missions logic                          |
| `supaprod/shell.jsx`             | Sidebar, topbar, cooking banner, construction pill                       |
| `supaprod/home.jsx`              | Today screen — hero ritual, calls queue                                  |
| `supaprod/chat.jsx`              | Chat + Mission Cockpit + auto-title rule                                 |
| `supaprod/missions.jsx`          | Mission list, detail, graph view                                         |
| `supaprod/loop.jsx`              | Product / Knowledge / Govern / Settings screens                          |
| `supaprod/loop-detail.jsx`       | Drill-downs: signal, opportunity, release, decision, learning, connector |
| `supaprod/govern-detail.jsx`     | Drill-downs: eval suite, agent analytics, trace replay, drift            |
| `supaprod/onboard.jsx`           | Login + onboarding first-run flow                                        |
| `supaprod/icons.jsx`             | Icon set + the Butterfly mark                                            |
| `supaprod/tweaks-panel.jsx`      | Design-review tweaks panel (ignore for production)                       |

Screen → source map: find any screen's code by its `data-screen-label`
attribute in the jsx files.

## Public landing page (v11)

`landing-page-v11/` holds the **design reference, ideology, decision log, and the founder's
inspiration images** for the public marketing page (`src/routes/index.tsx`) — Perplexity-style
liveliness, the pixel-font accent, the warm Ember spine, the three-voice type system, and what
to keep / enhance in a future revamp. **Start at
[`landing-page-v11/README.md`](./landing-page-v11/README.md)** before changing or revamping the
landing page. (Unlike the app prototype above, this is a reference + handoff doc, not a runnable
mockup.)
