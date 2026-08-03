---
name: supaprod-tempo
description: DEPRECATED, do not use. Tempo v5 was rejected on 2026-07-28 when the app was rebuilt from zero. For any design, UI, UX, styling, component or visual work on a Supaprod surface, read docs/design/DESIGN-SYSTEM.md and the live code instead.
---

# DEPRECATED: Tempo v5 is not the design system

**Do not follow this skill. It loaded a contract the founder rejected.**

On **2026-07-28** the Supaprod authenticated app was rebuilt from zero and every existing
design constraint was revoked, Tempo v5 included. On **2026-07-29** four freshly authored
replacement directions were all rejected as *"assembled, not designed from a user lens."*

This skill's own description advertised Tempo as current for six weeks after that. Any
session that invoked it was pulled backwards into the system that had been thrown out. That
is the failure mode this stub exists to stop.

## What to read instead

**The contract:** [`docs/design/DESIGN-SYSTEM.md`](../../../docs/design/DESIGN-SYSTEM.md)

**The baseline is the shipped code, not a document:**

| Layer | File |
| --- | --- |
| Tokens, the only namespace to write | `src/styles/ink.css`, the `--sp-*` set |
| Primitives to compose from | `src/components/shell/primitives.tsx` |
| Shell, rail, panes, sheets | `src/styles/shell.css`, `src/styles/primitives.css` |

## The rulings that replaced Tempo's laws

- **Monochrome by default:** black, grey, white, slate, silver on a dark ground.
- **Ember is rare**, and explicitly not the default for approvals, actions or tasks.
- **Blue means agents running. Green and red mean status.**
- **Geist Pixel is retired**, including from hero moments. Geist Sans for UI, Geist Mono for
  technical content.
- **The ratchet:** today's design is the floor. "Tighten this" asks for a better surface,
  never a smaller one.

## Where Tempo still exists, and why

`src/styles.css` holds 633 `--ds-*` tokens from the Tempo era, consumed by the 49 shadcn
files in `src/components/ui/`. **It still runs, so do not rip it out**, but never add a
`--ds-*` token and never style a new surface from it.

The retired contracts are kept as history in
[`docs/design/archive/`](../../../docs/design/archive/README.md). Read them to understand why
a shadcn primitive looks the way it does, never as authority.
