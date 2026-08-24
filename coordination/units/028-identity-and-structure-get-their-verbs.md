Unit 028: the identity and structure layer gets its verbs

The founder pointed at the fundamentals - profile, creating and managing
workspaces, creating projects - saying gaps live there. Two audits proved
the shape of it: the backends are largely BUILT and IDLE. Rename, delete
and leave workspace; product update and move-to-workspace;
ensureDefaultProduct - all defined in lib with zero doors, stranded when
the old shell died. This unit wired the doors that sit on my paths.

Landed in settings.tsx, a new This workspace region at the top of the
existing workspace section (so ScopeMenu's Manage promise finally lands
somewhere that manages):

- Rename: inline field seeded from the active name, Save through the idle
  renameWorkspace fn, dirty-guarded, cache refreshed.
- Leave: visible only to non-owners (membership selfRole), confirm states
  the consequence honestly, wires leaveWorkspace, provider resolves the
  rest.
- Delete danger zone: recessed, typed-confirm on the workspace name, copy
  stating plainly that this is permanent and everything goes - because the
  underlying fn is a hard delete, and softening the words would lie about
  the code. Aftermath handles both branches: switch to a remaining
  workspace, or sign out to login when none remain.
- Create another workspace: inline naming, client insert per the proven
  onboarding shape plus owner membership upsert, ensureDefaultProduct
  revived as its companion (first caller since AppShell died), then switch.
  Plan-cap refusal surfaces as calm guidance with a door to Billing rather
  than raw Postgres.

ScopeMenu (shell, mine): the account menu now says who you are - chosen
mark or initials fallback, name, email - and gains Sign out of every
device behind confirm, calling signOut global. The avatar choice finally
has its second consumer, exactly the follow-up settings' own comment named.

Profile: password change while signed in exists at last - current-password
re-authentication then updateUser, wrong-current surfaced honestly,
mismatch and length guarded inline. Timezone became a datalist-seeded
picker (17 zones, free typing kept). The Products pane stopped claiming
missions attach to products; they are workspace-wide and now say so.

Guards did real work this cycle: the working-control scanner caught four
new Actions disabling on bare pending flags (busy added alongside), the
ratchet caught two fresh sp-menu-rule separators growing a frozen file
(replaced with inline mrd-styled rules, count now below baseline), and one
busy landed on an Input by mistake before moving to the Save action where
it means something. Ratchet re-frozen at 2,211.

Filed not built: requests/015 asks for components/settings/** ownership
on the R009 logic (MembersCard, TeamCard, ProductsTab mount only from my
route) and one createWorkspace lib function so plan-cap handling lives
server-side. Product rename/north-star and move-product doors wait on that
ruling - updateProject and moveProduct stay idle until the cards change
hands.

Verification honesty: the dev session expired mid-check for the third time
tonight (settings rendered, then redirected on a query refetch), so live
drive-through is partial; everything stands on tsc 0 and the full suite,
10749 pass / 0 fail, ratchet re-frozen downward.

Still open in this area, routed or noted: product rename/move doors
(REQ-015), delete-account and email-change (MAIN LANE backend),
avatar_url storage path, mission-product attachment migration, the
product_id/project_id dual-column reconciliation.
