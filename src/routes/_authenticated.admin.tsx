/**
 * Admin. The operator's door, ported onto the rebuild primitives (step 4).
 *
 * 1. WHO IS HERE, AND WHY. Not a product lead. Whoever runs this workspace,
 *    arriving because someone needs access, a bill looks wrong, or something
 *    is down. They came to change one thing for other people and leave.
 *
 * 2. THE ONE THING IT EXISTS FOR. To change what OTHER people can do and what
 *    the workspace costs. That is the whole of it, and it is why this is a
 *    role-gated door and not a rail row: every other surface in the product
 *    changes your own work, and this one changes someone else's.
 *
 * 3. KEEP / MOVE / KILL.
 *    KEEP  the ten sub-pages and the role gate. Each answers a different
 *          question an operator arrives with, and none is answerable elsewhere.
 *    KEEP  the bootstrap claim path. A workspace with zero admins is
 *          unadministrable, and this is the only way out of it.
 *    KILL  the TopBar. It was the LAST duplicate header in the product: this
 *          route renders inside AppFrame, which already draws the brand, the
 *          workspace scope, the live line and Ask.
 *    KILL  the styled <p> at weight 460 that carried the page question. It did
 *          an h1's job without being one, so screen readers and the type scale
 *          both lost. It is a PageHeading now.
 *
 * 4. ONE CLICK AWAY. The ten bodies. The layout answers "which question are
 *    you here with" and nothing more; every number lives one tab in.
 *
 * 5. DELIGHT AND CONFUSION. What would confuse: an operator cannot tell a
 *    failed permission CHECK from a "you are not an admin" VERDICT. That
 *    distinction is already honoured below (register D-11) and must stay:
 *    an error must never wear another state's clothes.
 *
 * 6. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Deliberately almost nowhere,
 *    and that is the correct answer here rather than a gap. This surface
 *    governs HUMANS: who has a role, what a seat costs, which workspace is
 *    over its cap. The crew appears only where it genuinely spends, under
 *    Spend, which reads real per-agent cost. Putting agent marks on a page
 *    about human access would be decoration, and the agentic-first test asks
 *    whether the crew's presence PROVES something, not whether it is visible.
 *
 * The sub-page bodies keep their data and logic unchanged; only this layout's
 * chrome changes. Engine-Room Test on the labels: Observability -> Health, AI
 * Costs -> Spend, and the landing funnel -> Launch, because nobody arrives here
 * asking about "landing events".
 */
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Surface } from "@/components/meridian/Surface";
import { Action, PageHeading } from "@/components/meridian/surface-parts";
import { Tabs, TabPanel } from "@/components/meridian/Tabs";
import { AdminErrorCard, AdminSkeleton } from "@/components/admin/admin-ui";
import { amIAdmin, bootstrapSelfAdmin } from "@/lib/pricing.functions";
import { toast } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin · Supaprod" }] }),
});

const TABS = [
  { id: "/admin", label: "Overview" },
  { id: "/admin/pricing", label: "Pricing" },
  { id: "/admin/people", label: "People" },
  { id: "/admin/workspaces", label: "Workspaces" },
  { id: "/admin/platform", label: "Platform" },
  { id: "/admin/routing", label: "Routing" },
  { id: "/admin/observability", label: "Health" },
  { id: "/admin/ai-costs", label: "Spend" },
  { id: "/admin/proof", label: "Proof" },
  // Launch reads landing_events and waitlist_signups, which were written by the
  // public page and read by no surface at all. A tab is the whole reason it is
  // reachable: the admin nav is the only door this console has, so a sub-page
  // absent from this list is a sub-page nobody finds.
  { id: "/admin/landing", label: "Launch" },
  // Invites arrived with the door. Signup closed on 2026-08-07 (private beta,
  // entry by code), and a closed door whose keys can only be cut at a psql
  // prompt is not a private beta, it is an outage with a story. Same reason
  // Launch is on this list: the admin nav is this console's only door, so a
  // sub-page missing from here is a sub-page nobody finds.
  { id: "/admin/invites", label: "Invites" },
] as const;

/** Names the tab row, and every element id in it is derived from this. */
const SECTION_TABS = "admin-sections";

function activeTabId(pathname: string): (typeof TABS)[number]["id"] {
  const match = TABS.find((t) => t.id !== "/admin" && pathname.startsWith(t.id));
  return match?.id ?? "/admin";
}

function AdminLayout() {
  const fAmI = useServerFn(amIAdmin);
  const me = useQuery({ queryKey: ["am-i-admin"], queryFn: () => fAmI() });
  const loc = useLocation();
  const navigate = useNavigate();
  const active = activeTabId(loc.pathname);

  return (
    // The app shell already draws the brand, the workspace scope, the live line
    // and Ask, so this surface does not draw a second header. /admin was the
    // last TopBar mount site in the product.
    <Surface wide>
      <PageHeading
        title="Who runs this workspace, and what is it costing?"
        sub="Members, plans and spend. Everything here changes what other people can do."
      />
      <div>
        {me.isLoading ? (
          <AdminSkeleton rows={3} height={40} />
        ) : me.isError ? (
          // An access-check failure is an error, never a "you are not an
          // admin" verdict (register D-11: errors must not wear another
          // state's clothes).
          <AdminErrorCard
            what="your admin access"
            message={me.error instanceof Error ? me.error.message : undefined}
            onRetry={() => me.refetch()}
          />
        ) : me.data?.isAdmin ? (
          <>
            {/* ELEVEN HAND-DRAWN TABS BECOME ONE `Tabs`. The strip was a row of
                plain buttons wearing a 2px border and an uppercase mono label,
                with no `role="tablist"` at all: eleven separate tab stops, and
                Tab walked a keyboard reader through every console they had
                already passed on. `Tabs` holds one stop for the row and moves
                focus on ArrowLeft, ArrowRight, Home and End, and the panel below
                names the tab it belongs to. Selection still follows a real click
                or Enter, never an arrow, which matters here because each door is
                an address and arrowing along the row would otherwise write
                eleven history entries. */}
            <Tabs
              group={SECTION_TABS}
              label="Which part of the console"
              tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
              active={active}
              onSelect={(id) => navigate({ to: id })}
            />
            <TabPanel group={SECTION_TABS} active={active}>
              <Outlet />
            </TabPanel>
          </>
        ) : (
          <NoAccessCard anyAdminExists={!!me.data?.anyAdminExists} />
        )}
      </div>
    </Surface>
  );
}

function NoAccessCard({ anyAdminExists }: { anyAdminExists: boolean }) {
  const qc = useQueryClient();
  const fBootstrap = useServerFn(bootstrapSelfAdmin);
  const claim = useMutation({
    mutationFn: () => fBootstrap(),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("You are now an admin.");
      qc.invalidateQueries({ queryKey: ["am-i-admin"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--mrd-line)",
        borderRadius: "var(--radius-card)",
        padding: "20px 22px",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, color: "var(--mrd-ink)" }}>
        Admin access required
      </div>
      <p style={{ fontSize: 13, color: "var(--mrd-body)", margin: 0, maxWidth: 520 }}>
        The admin console manages members, roles, audit, and workspace billing. Ask a current admin
        to grant you access.
      </p>
      {!anyAdminExists ? (
        <div className="flex items-center" style={{ gap: 10 }}>
          {/* The screen's one primary CTA, on `Action` so it carries Meridian's
              control shape, focus ring and press feedback. `primary` is what
              obsidian called `accent`, and the in-flight state is now the
              `disabled` the mutation already knows about: obsidian's `loading`
              additionally set `aria-busy`, which `Action` cannot express, so that
              announcement is lost and recorded as a Meridian gap rather than
              patched into a component this item does not own. */}
          <Action
            variant="primary"
            disabled={claim.isPending}
            onClick={() => claim.mutate()}
          >
            {claim.isPending ? "Claiming…" : "Claim admin · one-time setup"}
          </Action>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--mrd-mute)" }}
          >
            No admin exists yet. Whoever claims first becomes the first admin.
          </span>
        </div>
      ) : null}
    </div>
  );
}
