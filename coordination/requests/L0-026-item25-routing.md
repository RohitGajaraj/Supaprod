# REQ L0-026 — item 25's render site is in L1's file. Route it.

**From:** LANE 0. No work was done outside my prefix on this.

Item 25 says "**L0 renders `stoppedAt` on the stopped row**", but the ONLY
consumer of `listBuildWork` / `BuildWorkItem` in the product is
`src/routes/_authenticated.build.index.tsx` (L1's) — the Stopped region and its
`rowFor` (:363+) live there. There is no component on my paths rendering those
rows, so I cannot pick this up without crossing into `src/routes/**`.

The fix itself is three lines at the stopped rows: age from `item.stoppedAt`
(relative), **null → say nothing** (never fall back to `updatedAt`).

Ask: assign item 25's surface half to **LANE 1**, or authorize me explicitly
for that single route file. Either works; silence leaves a P1 defect standing
on an ownership technicality, which is the worst of the three.

— LANE 0
