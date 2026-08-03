# Repo linking instructions · DESIGN-OBSIDIAN.md

Commit `docs/design/archive/obsidian-v3.md` to the repo root, next to DESIGN.md. Then make
these exact edits so every agent finds it first. One commit, message:
`docs: adopt Obsidian design contract (v3) as the product design source of truth`

## 1. DESIGN.md · add at the very top, above the frontmatter

> **SUPERSEDED for the product app (2026-07-02).** The authenticated app now
> follows [`docs/design/archive/obsidian-v3.md`](./DESIGN-OBSIDIAN.md) (v3 "Obsidian": jet-black
> canvas, Ember & Glacier roles, restraint budget, standing instructions).
> This file remains the contract for the public landing page only, plus the
> historical record. Do not apply parchment styles to any app surface.

## 2. CLAUDE.md · add to the read-order / design section

> Design contract: read [`docs/design/archive/obsidian-v3.md`](./DESIGN-OBSIDIAN.md) BEFORE
> designing, redesigning, or building any UI. Its 9 standing instructions are
> mandatory. DESIGN.md now covers the public landing page only.

## 3. AGENTS.md · add to section 0 (standing rules)

> UI standing rule: every surface change follows
> [`docs/design/archive/obsidian-v3.md`](./DESIGN-OBSIDIAN.md), the v3 design contract
> (placement algorithm, role colors, restraint budget, grayscale test,
> humanized-output law). No feature ships that violates its standing
> instructions 1 to 9.

## 4. GEMINI.md · add the same pointer as CLAUDE.md

## 5. README.md · update the doc map row

> | Design / UI / motion | [`docs/design/archive/obsidian-v3.md`](./DESIGN-OBSIDIAN.md) (app, CURRENT) · [`docs/design/archive/ember-editorial-landing.md`](../../docs/design/archive/ember-editorial-landing.md) (landing page + history) |

## 6. Optional but recommended

- Commit the visual specimen too: export "Cadence Design Strategy.dc.html"
  into `design-reference/obsidian-specimen.html` and link it from
  DESIGN-OBSIDIAN.md's frontmatter.
- Add a lint/CI note: grep new UI strings for em/en dashes and banned words
  (the humanized-output law) as a PR check.
