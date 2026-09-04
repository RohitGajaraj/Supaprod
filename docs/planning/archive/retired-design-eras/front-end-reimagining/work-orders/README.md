# Work orders — the dispatch pack (Round 3, 2026-07-23)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Written by the Fable planning session (founder-approved plan). These packets carry the thinking; the executing agent carries it out EXACTLY. If a packet and your own judgment disagree on scope, the packet wins — flag the disagreement in your final report instead of improvising.

## What this folder is

One packet per lane. Each packet is self-sufficient: WHY (the intent, so you make the right micro-decisions), exact files, the mockup floor to match, numbered steps, an out-of-scope fence, the acceptance checklist, and the verification gate. A lower-intelligence agent must be able to execute a packet with zero founder nudging.

## The parallel-dispatch branch protocol (non-negotiable)

Multiple agents (HyperAgent, Conductor workspaces, this repo's own sessions) run concurrently. The protocol that prevents lost work:

1. **Nobody commits directly to `main`.** Every packet names its branch: `wo/<id>-<slug>` (e.g. `wo/ember-restraint-sweep`). First step of every packet: `git pull origin main`, then create your branch from that fresh main.
2. **File ownership is exclusive.** Each packet declares the files it owns. You may not edit a file outside your ownership list — if you believe you must, STOP and report instead.
3. **Sequenced packets wait.** Where two packets need the same file (`_authenticated.tsx`, `MissionShell.tsx`), the later packet says "start only after WO-x merges". Respect it.
4. **Merging:** push your branch (`git push origin wo/<id>-<slug>`), state the WHY in every commit message, and report done. The integration gate (WO-F) merges branches to main in dependency order and runs the full gate. Do not merge your own branch to main unless your packet explicitly says you are the integration agent.
5. **Verification is per-packet AND at the gate.** Your packet's checks must pass on YOUR branch before you report done: `bunx tsc --noEmit && bun run build && bun test` plus the packet's named browser clicks (`bun run dev`).

## Dependency graph

```
wave 1 (dispatch NOW, parallel, disjoint):
  WO-A account menu · WO-B strangler wrap · WO-BE-A seam · WO-BE-B board
  WO-FID-1..7 (per-surface, disjoint) · WO-LAND (public landing) · WO-E demo ops (ops only)
wave 2 (each starts when its blocker MERGES to main):
  WO-C landing moment (after WO-B) · WO-D rest beat (after WO-A) · WO-BE-C face (after WO-A)
  WO-EMBER (after WO-A + WO-B — it audits the merged shell)
  WO-NEW-1..8 (after the Round-3 mockups are committed to main; new-settings also after fid-settings)
finally:
  WO-F integration gate (one agent, merges everything in this order, runs the full gate)
```

> ALL lanes are founder-dispatched (founder ruling 2026-07-24: the planning session authors mockups + packets only; execution runs on the founder's sub-agents per this protocol).

## Packet index

| Packet | File | Size | Branch | Status |
| --- | --- | --- | --- | --- |
| WO-A Account menu + sign-out | [WO-A-account-menu.md](./WO-A-account-menu.md) | S/M | `wo/a-account-menu` | dispatchable NOW (first) |
| WO-B Strangler chrome-wrap | [WO-B-strangler-wrap.md](./WO-B-strangler-wrap.md) | M | `wo/b-strangler-wrap` | dispatchable NOW (parallel w/ A) |
| WO-C Landing moment /start | [WO-C-landing-moment.md](./WO-C-landing-moment.md) | M | `wo/c-landing-moment` | after WO-B merges |
| WO-D Rest beat | [WO-D-rest-beat.md](./WO-D-rest-beat.md) | S | `wo/d-rest-beat` | after WO-A merges |
| WO-BE Build-engine lanes A/B/C | [WO-BE-build-lanes.md](./WO-BE-build-lanes.md) | S+S/M+M | `wo/be-a-seam`, `wo/be-b-board`, `wo/be-c-face` | A+B dispatchable NOW; C after WO-A merges |
| WO-EMBER Restraint sweep | [WO-EMBER-restraint-sweep.md](./WO-EMBER-restraint-sweep.md) | M | `wo/ember-restraint-sweep` | dispatchable after A+B |
| WO-FID Functional fidelity (7 packets) | [WO-FID-functional-fidelity.md](./WO-FID-functional-fidelity.md) | M each | `wo/fid-<surface>` | dispatchable |
| WO-NEW Implement screens 10–19 (8 packets) | [WO-NEW-implement-round3.md](./WO-NEW-implement-round3.md) | M/L each | `wo/new-<surface>` | after mockups land on main |
| WO-LAND Public landing sweep | [WO-LAND-public-landing.md](./WO-LAND-public-landing.md) | M | `wo/land-public-landing` | dispatchable |
| WO-E Demo ops | [WO-E-demo-ops.md](./WO-E-demo-ops.md) | M (ops) | n/a (no app code) | Fable session + founder steps |
| WO-F Integration gate | [WO-F-integration-gate.md](./WO-F-integration-gate.md) | S | n/a | last |
| PC-35 Build-engine premium rung | [PC-35-claude-agent-driver.md](./PC-35-claude-agent-driver.md) | phased | post-YC | founder-gated |

## The design law every packet inherits

- The mockups in `../mockups/` are the FLOOR (founder ruling; love-gate). `_round3-brief.md` is the Round-3 law: one ember locus per screen, slate chips, Vellum memory, TopBar v2, lineage doors, focus model, cost-quiet, honest GAP states, humanized copy (no em dashes, no AI-tells).
- Functionality over cosmetics: a control that does nothing may not ship. Wire it or render the honest gap state ("drafts only; nothing sends itself").
- BUILD-ONLY MODE: no doc ceremony beyond flipping the feature-dashboard row + a one-line note when a lane lands.
