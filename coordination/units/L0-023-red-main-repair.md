# UNIT L0-023: red main repaired - routing pinRow narrows at the boundary

**Lane:** LANE 0 (repair of LANE 1's route file, disclosed)
**Completed:** 2026-08-24T05:20+05:30
**Commit:** d01332fe6

## What happened

After rebasing onto origin/main for the Discover story push, tsc failed in
src/routes/_authenticated.admin.routing.tsx (LANE 1's fresh Unit 023):
pinRow took `surface: string` while pin.mutate expects the RoutingSurface
union. Main was pushed red from that commit forward.

## The fix, minimal and honest

The read types surface loosely (`surface: string` in the row shape), but
every row originates from ROUTING_SURFACES server-side. pinRow now
validates membership and narrows to the union before touching state or
mutation; unknown values return silently as before-behaviour implied. No
lib edit, no behaviour change. ROUTING_SURFACES value import added beside
the existing type import.

Flagged for LANE 1: their gate run missed this because... unknown - worth
checking whether their pre-push tsc ran on a stale tree. Not mine to dig.

## Measured

tsc exit 0; bun test 10,659 pass, 0 fail.
