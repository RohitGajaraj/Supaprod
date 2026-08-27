# S4-112 · The Meridian ratchet is bypassed by one level of indirection, in 46 files

> _S4, 2026-08-27. S3 found the class and handed me the probe. This is it measured across the tree
> and shipped as a check._

## The guard, and what it actually matches

`CLAUDE.md` states the ratchet as enforced rather than requested: `bun test` fails if a **new** file
carries a retired token, and fails if an **existing** file grows its count.

`meridian-ratchet-scan.ts:200` lists what it matches, and **every entry is a literal string**:

```
--sp-   --ds-   --text-   --hairline   --madder   --glacier   --font-pixel   --raised   data-obsidian
```

## The bypass

`src/styles.css` defines **59 other names** as `var(--ds-…)`:

```
--canvas   --rose   --amber   --agent   --card   --ink   --emerald   --coral   --saffron
--action-blue   --surface-1   --hero-bg   --deep-green   --soft-stone   --destructive   …
```

**A component writing `var(--canvas)` is drawing from the retired v3 palette, and the ratchet counts
zero.**

**46 files use at least one.** Worst first:

| file | aliases used |
| --- | --- |
| `supaprod/MissionGraph.tsx` | `--agent`, `--rose`, `--action-blue`, `--surface-1`, `--emerald`, `--hero-bg` |
| `supaprod/Primitives.tsx` | `--agent`, `--rose`, `--action-blue`, `--coral`, `--saffron`, `--emerald` |
| `billing/BillingBanner.tsx` | `--rose` ×6, `--destructive` ×2 |
| `system/BackendHealthBanner.tsx` | `--canvas` ×2, `--ink`, `--amber` ×3 |
| `chat/MessageMeta.tsx` | `--rose`, `--deep-green`, `--action-blue`, `--emerald` ×2 |

## Why this is worse than a file with no guard at all

**The ratchet's whole design is that debt cannot grow.** Through an alias, debt is invisible to it:
**a brand new file can be written entirely in the retired system today and pass green.**

The guard is not weakened, it is **bypassed**, and nothing in its output says so. That is the same
shape as three other things tonight — my `curl` warming that warmed nothing, S1's `Gate` printing a
status nobody had set, S0's `FILE_IT` rewrite that reached no seat. **A guard that reports success
while the thing it guards is happening is worse than no guard**, because it is quoted as evidence.

## Shipped

`bun run e2e/helpers/retired-system-through-an-alias.mjs` — no server, one command. Aliases that are
themselves ratchet markers are excluded, because counting them would overstate the blind spot;
`--glacier` is one of those.

## What I am not claiming

- **These 46 files are not new violations.** Most predate the ratchet and would be in its baseline if
  it could see them. The finding is that the ceiling does not hold, not that these authors broke it.
- **I did not verify that every alias still resolves to `--ds-`** at runtime; the reading is textual,
  from `styles.css`'s own definitions.
- **The fix is not mine to choose.** Adding the aliases to `RETIRED_MARKERS` would fail the build on
  46 files at once, which is a call for whoever owns the ratchet, and the baseline mechanism exists
  precisely so that debt can be frozen rather than fixed in one night.
