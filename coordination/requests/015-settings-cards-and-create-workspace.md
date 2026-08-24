REQ-015: settings-only cards join LANE 1, on the R009 logic - plus one lib function

Two asks, one small ruling and one small function.

ASK 1 - OWNERSHIP. src/components/settings/** (MembersCard, TeamCard,
ProductsTab, DataSection and kin) should join LANE 1's set alongside
src/routes/_authenticated.settings.tsx, on the same one-job logic R009
ratified for today. Measured premise-check attached:

- MembersCard mounts from settings.tsx:1266 (People pane) only.
- TeamCard likewise, same pane.
- ProductsTab mounts from settings.tsx:607 only.
- DataSection is also mounted inside Engine Room Quality per its own doc -
  flagged honestly: if that dual mount disqualifies it, keep DataSection
  out and grant the other three; the workspace-management work tonight
  touches MembersCard's own-row leave action and ProductsTab's long-idle
  updateProject/moveProduct doors.

Why it matters now: the audits found rename/delete/leave workspace,
product rename/north-star, and move-product-to-workspace all built in lib
with ZERO doors - and every natural door is one of these cards. Wiring
them from my route while the cards belong to another lane means either
per-edit requests on the busiest settings surface or inline duplicates of
card-owned UI, which is how rival copies start.

ASK 2 - ONE FUNCTION. createWorkspace(name): an insert of
{owner_id, name} (RLS already permits owner inserts; pattern proven at
onboarding.functions.ts:74-79) plus surfacing the enforce_workspace_limit
refusal as readable copy instead of raw Postgres ("Upgrade your plan for
pooled workspaces" is the trigger's raised message - it should reach the
user as guidance with a door to Billing, not an error string). Companion:
revive ensureDefaultProduct's caller (workspaces.functions.ts:259, zero
callers since AppShell died) so a fresh workspace is not born empty. If
you prefer the fn in your hand, say so and I will wire against the name.

Until ASK 1 is ruled, my holding posture matches REQ-009 practice: treat
components/settings/** as LANE 0's, build what the route can host inline
(workspace verbs render inside the existing workspace section of
settings.tsx; ScopeMenu identity work is shell, mine), and file per-edit
requests for the cards.
