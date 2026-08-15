# Retired design contracts

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Nothing in this folder is authority.** These are the four design systems Supaprod shipped and then retired, plus one stale handoff. They are kept because they record real decisions and because salvageable ideas live in them, not because any of them still governs.

**The current contract is [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md).** Build from that, and from the live code it points at.

| File | Was | Retired |
| --- | --- | --- |
| [`ember-editorial-landing.md`](./ember-editorial-landing.md) | `DESIGN.md`, the Ember Editorial landing system | 2026-07-10, superseded by Tempo v5 |
| [`obsidian-v3.md`](./obsidian-v3.md) | `DESIGN-OBSIDIAN.md`, Obsidian v3 | 2026-07-10, superseded by Tempo v5 |
| [`loom-v4.md`](./loom-v4.md) | `DESIGN-LOOM.md`, Loom v4 | 2026-07-10, superseded by Tempo v5 |
| [`tempo-v5.md`](./tempo-v5.md) | `DESIGN-TEMPO.md`, Tempo v5, the Geist-derived system | 2026-07-28, rejected in the rebuild-from-zero ruling |
| [`ui-revamp-handoff.md`](./ui-revamp-handoff.md) | `UI-REVAMP-HANDOFF.md`, the live UI pickup list | 2026-07-28, describes an app shape that no longer exists |
| [`DESIGN-SYSTEM-2026-08-03-to-08-14.md`](./DESIGN-SYSTEM-2026-08-03-to-08-14.md) | `DESIGN-SYSTEM.md`, the Cadence/ink contract built on `--sp-*` | **2026-08-15, superseded by Meridian.** Its judgement rulings survive and were carried into the new contract in Meridian's vocabulary; the token layer it teaches is now enforced against by `src/__tests__/meridian-ratchet.test.ts`, so building from it fails the suite |
| [`website-v3-enterprise-2026-08.md`](./website-v3-enterprise-2026-08.md) | A from-scratch enterprise marketing site on `site/v3-enterprise` | **2026-08-12, rejected on sight.** It used a banned category claim in its hero, made the station diagram the front door against an explicit ruling, and was pushed with two failing tests. **Do not merge that branch.** Its audit of the LIVE site, and the claims audit it produced, are the parts worth keeping |

## Why all four went

On 2026-07-28 the founder ruled the authenticated app rebuilt from zero and revoked every design constraint. The problem was structural rather than aesthetic: the build ran **two complete app shells at once**, selected by a hardcoded pathname allowlist, over five design systems, four Buttons and three copies of the loop model.

On 2026-07-29 he reviewed four fresh replacement directions and rejected all four as *"assembled, not designed from a user lens"*.

The reasoning, with his verbatim quotes, is in [`../../planning/rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md`](../../planning/rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md) and summarised in [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md).

## What is still worth reading here

- **Tempo v5** documents the `--ds-*` token layer that still runs under `src/components/ui/`. If you need to understand why a shadcn primitive looks the way it does, the answer is there.
- **Obsidian v3** carries the original information-architecture argument, parts of which survived into the current rail.
- The **Ember** file holds the public-landing lineage.
