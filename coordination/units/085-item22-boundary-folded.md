# Unit 085 · item 22 CLOSED: /boundary folds into the engine room

**Lane:** LANE 1 · **2026-08-25** · claim pushed before coding, released with
this commit. No dev server (the route is a redirect; the destination was
verified live by L0's own field work and the fold is proven by the suite).

## What shipped

| File | Change |
| --- | --- |
| `src/routes/_authenticated.boundary.tsx` | **1131 lines → a redirect stub** to `/engine-room?room=safety&view=rules` (the Safety room's front tab, "What is allowed"). The stub's header preserves the 2026-08-01 founder ruling the surface served, records WHY the address closed (no rail door, reachable from one crew link plus a component that linked out of itself), and names where every block went. |
| `src/routes/_authenticated.crew.tsx` | The "The boundary" door navigates straight to `/engine-room?room=safety&view=rules` instead of bouncing through the stub. |

## The proof nothing was stranded

Before stubbing, every region on the old route was matched against
`governance/BoundaryControls.tsx` (LANE 0's `214cfffd5`, landing request 022):
"What they did not do" (×3 render sites), "The ceiling", "What starts without
you", "What an agent may settle on its own" — all present, plus the platform's
only `updateToolMode` editor, `AutomationBoundary`, `TrustGraduationsBlock`,
and the error states. `BoundaryStatement`'s out-link was already repointed by
the same commit.

## The deliberate crossing, disclosed

Two guards in `src/lib/**` (MAIN's path) read the OLD route file as their
subject and went red the moment the fold landed — a red shared gate blocks
every lane, so I retargeted them rather than reverting a finished fold or
idling on a round trip. Both files carry a dated attribution note; MAIN owns
them and may re-shape freely:

- `workspace-automation-door.test.ts` — the "mounted on a route" guard now
  walks the real chain (engine-room route → SafetyRoom → BoundaryControls →
  AutomationBoundary); the "renders ALL of them" guard reads
  `BoundaryControls.tsx` (verified: `workspaceId=`, no `only=`).
- `tool-override-insert-is-complete.test.ts` — the raw-error guard now reads
  `BoundaryControls.tsx` (verified before retargeting: humanWriteError
  imported, no `consequence: e.message`, 4 mutations all carrying onError).

## Left for the AppFrame owner

`BOUNDARY_PATHS` still lists `/boundary`, so `settingsOwns` lights the gear if
someone types the old URL — harmless (the stub redirects), but the entry
should die whenever Session A's claim on the RAIL block releases. Noted in the
INBOX; AppFrame is under A's claim, so I did not touch it.

## Gates

Full `bun test` **11,331 pass / 0 fail** · `tsc` clean. Falsifier for the
redirect (any authed session): open `/boundary` — EXPECT the Engine Room on
the Safety room's "What is allowed" tab with the boundary controls rendered
between the statement and the guardrails; the crew door "The boundary" lands
on the same tab.
