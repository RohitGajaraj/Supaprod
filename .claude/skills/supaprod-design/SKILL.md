---
name: supaprod-design
description: DEPRECATED, do not use. The Obsidian v3 and Loom v4 contracts this loaded are retired, and so is the Tempo v5 skill it used to redirect to. For any design, UI, UX, styling or component work, read docs/design/DESIGN-SYSTEM.md and the live code.
user-invocable: false
---

# DEPRECATED

This skill loaded Obsidian v3 and Loom v4. Both are retired.

It previously redirected to `supaprod-tempo`. **That skill is now deprecated too**: Tempo v5
was rejected on 2026-07-28 when the founder rebuilt the app from zero and revoked every
design constraint. A chain of deprecation stubs pointing at each other is how a session ends
up three hops from anything true, so this one stops here and names the real source.

## The design system

**Contract:** [`docs/design/DESIGN-SYSTEM.md`](../../../docs/design/DESIGN-SYSTEM.md)

**Baseline, which is code and not a document:**

- `src/styles/ink.css`, the `--sp-*` tokens, the only namespace to write
- `src/components/shell/primitives.tsx`, the primitives to compose from
- `src/styles/shell.css` and `src/styles/primitives.css`

The four retired contracts are history in
[`docs/design/archive/`](../../../docs/design/archive/README.md). Never build from them.
