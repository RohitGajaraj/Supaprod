# Why no journey has ever finished — traced to the line, 2026-08-25

> _Every claim here carries its query or its `file:line`. Two of my own earlier conclusions in this
> folder are corrected below; the corrections are marked and the wrong version is left visible._

---

## The short version

**A tool that the product's own policy says should never need a human was gated 90 times, and that
tool is how station one gets out.** The gating is now fixed in code. **Nine tracks are still frozen
pointing at gates raised under the old behaviour, waiting for someone to answer a question the system
would no longer ask.** Nothing clears them, so they wait forever.

## 1. The tool

`cluster.trigger` groups a workspace's signals into themes. It is how `sense` files what it found —
the exit condition for the first station.

**Four independent sources in this repo say it must not be gated:**

| Source | Says |
| --- | --- |
| `src/lib/ai/tools/defaults.ts:121` | `{ mode: "auto", enabled: true }` |
| `tool-consequences.ts:495`, under the header *"Writes that can be run again, which is why they are not gated"* | `reversible: "reversible"` · *"re-clustering is the undo"* |
| `toolRisk("cluster.trigger")` (run, not read) | `"low"` |
| `resolveApprovalPolicy({tool:"cluster.trigger"})` (run, not read) | `"never-ask"` — *"Nothing this does leaves the workspace and all of it can be undone, so the crew runs it without asking"* |

**And production raised 90 approval requests for it:**

```sql
SELECT tool_name, status, count(*) FROM agent_approvals
WHERE tool_name='cluster.trigger' GROUP BY 1,2;
```

| status | n | window |
| --- | --- | --- |
| cancelled | 42 | 2026-08-01 → 08-19 |
| expired | 38 | 2026-07-08 → 08-12 |
| pending | 10 | 2026-08-19 → 08-20 |

**Executed, ever: 1** (2026-08-02). Ninety asks, one execution, and **not one human approval**.

## 2. What actually gated it, and why it no longer does

`resolveToolMode` (`src/lib/ai/loop.server.ts:170`) composes seeded mode → arc dial → risk floors.
The arc dial (`trust.server.ts:225`) ends:

```ts
case "observing":
default:
  // Every action visible: even auto tools queue a review.
  return "review";
```

`"review"` is the one value that escapes every auto-clear branch below it, because all of them are
guarded on `mode === "confirm"`.

**Run against the real function today:**

```
arc=trusted   -> auto        arc=proving   -> auto
arc=ambient   -> auto        arc=observing -> review
```

And every autonomy row in production is `trusted` (92 of 92). `loadAgentArc` also defaults to
`trusted` per the founder ruling of 2026-07-08. **So the gate is closed: this tool is not gated today.**

## 3. The damage that outlived the fix

The 9 tracks held `waiting-on-a-person` each carry exactly one `pending_gates` entry, and **every one
of those approvals was genuinely still `pending`** — raised 2026-08-19/20, under the old behaviour.
The driver correctly refuses to act while a gate is open, so each has sat at `sense` since
2026-08-21 with `attempts` 0.

**A fix that changes behaviour going forward does not move work that was already stopped.** Nothing
in this product sweeps for gates that can no longer be answered.

**Recovery is designed for and was never run.** `20260801170000_spine_track_pending_gates.sql`:
*"A gate that is rejected, expired, failed, or whose row has vanished is dropped rather than carried
forever."* So cancelling a stale gate is enough — the next drive drops it and the hold clears.

**Proven on one track, 2026-08-25:** gate `591bc97f` cancelled with its reason recorded; track
`3a652670` ("Checkout and notification friction in the homeowner app") released.

## 4. Two corrections to my own earlier claims in this folder

1. **"The approval policy says never-ask and nothing calls it, therefore that is why tracks are
   stuck."** The first half is true and worth fixing — `resolveApprovalPolicy` has **zero callers**
   and is dead code, a second policy engine competing with the wired one. **The second half was
   wrong.** The wired resolver reaches the same answer by a different route, so the dead module is
   not what stranded these tracks.
2. **"The 17 `needs-evidence` tracks are thrashing on a precondition they cannot satisfy."** That is
   what `STATION_NEEDS.sense` documents, and the escalation to a person is the designed response and
   it works. The failure is downstream: the ask reaches nobody.

## 5. What this says about the platform, which is the part that matters

Three defects, one shape, all found in one night:

- `TrackActivity` and `TrackChain` — built 2026-08-01 to a founder ruling, **0 importers** until tonight.
- `resolveApprovalPolicy` — built, tested, **0 callers**.
- `driveTrackOnce` — **1 caller**, a cron, so no person could ever move their own work.

**Nothing here was missing. Everything here was unwired.** The product's failure mode is not that it
cannot build; it is that it does not verify what it built is reachable, so the same thing gets asked
for, built, forgotten, and asked for again. **That is the three months.**

**The rule this earns:** a unit is not done when the function exists. It is done when something calls
it and a person can reach it. Anything else is inventory.
