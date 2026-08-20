/**
 * ADMIN / PEOPLE. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the six answers. The
 * parent /admin route is already ported and draws the Surface, the h1 and the
 * tab strip, so this file renders bare content and never a second head.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    Whoever answers the support address, with ONE person's email in front of
 *    them, because that person cannot sign in, was billed wrong, or ran out of
 *    credits mid-run. They came to change that one account and leave. Nobody
 *    has ever opened this page to read a directory.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE.
 *    Changing one person's standing: what they may spend, which plan they are
 *    on, and whether they may sign in at all. Every other surface in the
 *    product changes your own work; this changes someone else's, and there is
 *    nowhere else in Supaprod that can reach a user who is not in your
 *    workspace.
 *
 * 3. KEEP / MOVE / KILL, every element that was on the page.
 *    KEEP the search. It is the door to the one person, and it is the only
 *      thing on the surface before you have found them.
 *    KEEP all five writes: grant credits, reset the monthly cycle, override
 *      the plan, clear the override, block or allow sign-in. Each is a
 *      decision genuinely made here and nowhere else.
 *    KEEP Invitations. Who is allowed IN is the same job as who is in.
 *    KEEP the audit history, and it now says what actually changed. It was
 *      rendering the raw action string and throwing the payload away, so
 *      "grant_credits" was on screen and "500 credits, balance became 1,200"
 *      was not. Same read, same rows, the useful half stopped being discarded.
 *    MOVE Vouchers to /admin/pricing. A voucher is a priced instrument, a
 *      discount on the ladder that page owns. It only lived under People
 *      because it shipped in the same sprint as Invitations. Nothing deep
 *      links to it: the sub tab was local state with no address, so no saved
 *      link breaks.
 *    KILL the Sheet drawer. A slide-over carrying identity, plan, credits,
 *      workspaces, an audit trail and five mutations is exactly the modal
 *      abuse anti-slop ban 11 exists to stop, and primitives.tsx names the
 *      pane as deliberately absent with its reasons. The person in focus is
 *      rendered IN PLACE now, which is what every other ported surface does.
 *    KILL the seven-column table. Scanning a directory is one question, "is
 *      this the right email", and the table answered six more beside it while
 *      scrolling sideways to do it. A row is two lines now.
 *    KILL the "Suspended: no" column. Repeating "no" on every row is not
 *      information. A blocked account says so; a working one says nothing.
 *    KILL the row count "50 users". The query asks for 50 and the label
 *      printed whatever came back, so a workspace with four hundred users read
 *      as fifty. That is a fabricated number. It asks for 51 now and says
 *      "more than 50" honestly when the extra one arrives.
 *    KILL the two hand-rolled twenty-line "native submit button" copies. They
 *      existed because the old Button hardcoded type="button" and could not
 *      submit a form. The rebuild's Button spreads its props after the type,
 *      so type="submit" works and both copies go.
 *    KILL the local th(), td(), fieldStyle and FOCUS_RING constants, and the
 *      hand-built pill tab group. Every one of them is a primitive now, and
 *      real buttons and inputs take the app-wide focus ring without being
 *      told.
 *    KILL the standing sentence "Manage who can use Supaprod, grant credits,
 *      run promo campaigns". It listed the tabs directly underneath it in
 *      different words (hard ban 10).
 *    KILL every success toast. See THE COMMIT below.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    A list row is the email and one different fact, their plan and balance.
 *    The plan override, the per account credit breakdown, the workspaces they
 *    belong to and everything an admin has already done to them belong to the
 *    one person in focus, which is one click. The grant field and the override
 *    field are one click further still, because reading an account is common
 *    and changing it is not.
 *
 * 5. DELIGHT, AND CONFUSION.
 *    The moment is opening a person and reading what was already done to them
 *    before you do it again: "Credits granted. 500, balance became 1,200",
 *    dated. Support work is repeated work, and the account remembering its own
 *    history is the thing that stops two admins granting the same goodwill
 *    twice. What would confuse, and is therefore not drawn: a failed search
 *    reading as "no users match", a blank account form after a failed read
 *    whose save would overwrite the real thing, and a control with no server
 *    function behind it.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Nowhere, and that is the correct answer here rather than a gap. This
 *    surface governs HUMANS. No agent grants credits, overrides a plan or
 *    blocks a sign-in; every row in admin_audit_log with target_kind 'user'
 *    was written by a person, and the table records actor_user_id as a bare
 *    uuid with no email to join against, so even the human actor cannot be
 *    named honestly and is therefore not claimed. An AgentMark here would be
 *    decoration, and the presence doctrine's test is whether the crew's
 *    presence PROVES something, not whether it is visible. The one true crew
 *    fact is stated in words on the credits line: the balance set here is what
 *    the crew spends on this person's behalf.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Every write used to end in
 * a toast, so the record of what you did to someone else's account lasted four
 * seconds. A toast confirms that your click registered; a receipt renders what
 * your click CAUSED. All five writes leave a receipt on the surface carrying
 * the real consequence returned by the server (the new balance, the tier, the
 * expiry), and a failed write leaves a failed receipt rather than silence. No
 * handoff arrow is drawn on any of them, because nothing in the product picks
 * up a credit grant, and an arrow to nowhere is worse than no arrow.
 *
 * UNCHANGED: every query key, every server function, every confirmation on a
 * destructive action, and the in-band {error} handling that keeps a failed
 * read from wearing an empty state's clothes.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingHere,
  Num,
  Picker,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { Receipt } from "@/components/meridian/Receipt";
import { Tabs, TabPanel } from "@/components/meridian/Tabs";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useConfirm } from "@/hooks/use-confirm";
import { inBandError, useDebouncedValue } from "@/components/admin/admin-ui";
import { InvitationsPanel } from "@/components/admin/InvitationsPanel";
import {
  adminSearchUsers,
  adminGetUserDetail,
  adminGrantCredits,
  adminResetCreditCycle,
  adminOverrideUserPlan,
  adminClearUserPlanOverride,
  adminSuspendUser,
  type AdminUserRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/people")({
  component: AdminPeople,
});

/** One screen of results. The search asks for one more than this so the
 *  surface can say "more than 50" without inventing a total it was never
 *  given. */
const PAGE = 50;

/** How many history rows before the surface has a bottom. */
const AUDIT_CAP = 6;

type Panel = "people" | "invitations";

const PANEL_TABS = "admin-people";

const PANELS: ReadonlyArray<{ id: Panel; label: string }> = [
  { id: "people", label: "People" },
  { id: "invitations", label: "Invitations" },
];

function AdminPeople() {
  const [panel, setPanel] = useState<Panel>("people");
  return (
    <div>
      {/* The row used to be two hand-written buttons carrying `role="tablist"`
          and `role="tab"` and none of the keyboard that role promises: every
          tab was its own tab stop and an arrow key moved nothing. `Tabs` holds
          one tab stop for the row, moves focus on ArrowLeft, ArrowRight, Home
          and End, and the panel below names the tab it belongs to. */}
      <Tabs
        group={PANEL_TABS}
        label="Who can use Supaprod"
        tabs={PANELS}
        active={panel}
        onSelect={setPanel}
      />
      <TabPanel group={PANEL_TABS} active={panel}>
        {panel === "people" ? <PeoplePanel /> : <InvitationsPanel />}
      </TabPanel>
    </div>
  );
}

/* ================================================================== *
 * The record of what you just did
 * ================================================================== */

type Settled = { id: string; verb: string; consequence: string; failed?: boolean; at: string };

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ================================================================== *
 * The directory, and the person in focus
 * ================================================================== */

function PeoplePanel() {
  const fSearch = useServerFn(adminSearchUsers);
  const [q, setQ] = useState("");
  // One query per pause, not per keystroke.
  const debouncedQ = useDebouncedValue(q);
  const [selected, setSelected] = useState<string | null>(null);

  const search = useQuery({
    queryKey: ["admin-users", debouncedQ],
    queryFn: () => fSearch({ data: { q: debouncedQ, limit: PAGE + 1, offset: 0 } }),
  });

  // A failed search must never wear the empty state's clothes: the server fn
  // returns errors in band, so both the thrown and the in-band shape are
  // checked before anything decides "nobody matches".
  const searchError = search.isError
    ? search.error instanceof Error
      ? search.error.message
      : "The request failed."
    : inBandError(search.data);

  const found = useMemo<AdminUserRow[]>(() => {
    const d = search.data;
    if (!d || "error" in (d as object)) return [];
    return d as AdminUserRow[];
  }, [search.data]);

  const capped = found.length > PAGE;
  const rows = capped ? found.slice(0, PAGE) : found;

  return (
    // THE RHYTHM BETWEEN REGIONS, STATED HERE. The retired `Block` carried its
    // own top margin, top padding and a rule above every section, so a page's
    // spacing lived in a stylesheet. `Region` draws no frame and no margin, so
    // the surface owns it, and `gap-mrd-6` is the step every ported surface uses
    // between regions.
    <div className="flex flex-col gap-mrd-6">
      <Region
        title="Find a person"
        sub={
          capped
            ? `More than ${PAGE} people match. Only the first ${PAGE} were read, so narrow the search rather than scrolling.`
            : "Search the whole platform by email or display name, not just this workspace."
        }
      >
        <Field label="Email or display name" htmlFor="admin-people-find">
          <Input
            id="admin-people-find"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="jane@example.com"
          />
        </Field>

        {search.isLoading ? (
          <Reading>Reading the directory.</Reading>
        ) : searchError ? (
          <ReadFailedLine onRetry={() => void search.refetch()}>
            The directory did not load, so this is not a claim that nobody matches. {searchError}
          </ReadFailedLine>
        ) : rows.length === 0 ? (
          <NothingHere>
            {q.trim()
              ? "Nobody matches that. Try the email they signed up with."
              : "Type an email or a name. Nothing is listed until you ask for someone."}
          </NothingHere>
        ) : (
          rows.map((r) => (
            <Row
              key={r.user_id}
              tight
              focused={selected === r.user_id}
              lead={r.email}
              // The DIFFERENT fact, not more of the email. A blocked account
              // says so; a working one stays quiet.
              sub={
                <>
                  {r.suspended ? <Value tone="fail">sign-in blocked</Value> : r.plan_tier}
                  {" · "}
                  <Num>{r.balance_credits.toLocaleString()}</Num> credits
                </>
              }
              time={new Date(r.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              onClick={() => setSelected(selected === r.user_id ? null : r.user_id)}
            />
          ))
        )}
      </Region>

      {/* Keyed by the person, so every local state in there resets when the
          subject changes. Without it the receipts from the last account stay
          on screen under the next one's name, which is a lie about what you
          did and to whom. */}
      {selected ? <PersonInFocus key={selected} userId={selected} /> : null}
    </div>
  );
}

/* ================================================================== *
 * One person
 * ================================================================== */

type UserDetail = {
  user?: { id: string; email: string; created_at: string; last_sign_in_at: string | null };
  profile?: { suspended?: boolean; display_name?: string | null };
  accounts?: Array<{
    id: string;
    plan_tier: string;
    balance_credits: number;
    monthly_grant_credits: number;
    topup_credits: number;
  }>;
  workspaces?: Array<{ id: string; name: string; role: string }>;
  subscription?: {
    plan_tier?: string | null;
    plan_override_tier?: string | null;
    plan_override_expires_at?: string | null;
    plan_override_reason?: string | null;
  };
  audit?: Array<{
    id: string;
    action: string;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
};

const PLAN_TIERS = ["free", "pro", "max", "team", "enterprise"] as const;

/** Plain words for the action strings admin_audit writes. An action this map
 *  does not know prints raw rather than being guessed at. */
const ACTION_WORDS: Record<string, string> = {
  grant_credits: "Credits changed",
  reset_credit_cycle: "Monthly cycle reset",
  override_plan: "Plan overridden",
  clear_plan_override: "Plan override cleared",
  suspend: "Sign-in blocked",
  unsuspend: "Sign-in allowed",
};

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** What the stored payload actually says, in words. Returns null where the
 *  payload holds nothing, which is honest: some actions carry no detail. */
function auditDetail(action: string, payload: Record<string, unknown>): string | null {
  const parts: string[] = [];
  const delta = num(payload.delta);
  const balance = num(payload.new_balance);
  if (delta !== null) {
    parts.push(`${delta > 0 ? "+" : ""}${delta.toLocaleString()} credits`);
  }
  if (balance !== null) parts.push(`balance became ${balance.toLocaleString()}`);
  const tier = str(payload.tier);
  if (tier) parts.push(`on ${tier}`);
  const expires = str(payload.expires_at);
  if (expires) parts.push(`until ${expires.slice(0, 10)}`);
  else if (action === "override_plan" && "expires_at" in payload && payload.expires_at === null) {
    parts.push("with no expiry");
  }
  const reason = str(payload.reason);
  if (reason) parts.push(reason);
  return parts.length ? parts.join(" · ") : null;
}

function PersonInFocus({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fDetail = useServerFn(adminGetUserDetail);
  const fGrant = useServerFn(adminGrantCredits);
  const fReset = useServerFn(adminResetCreditCycle);
  const fOverride = useServerFn(adminOverrideUserPlan);
  const fClear = useServerFn(adminClearUserPlanOverride);
  const fSuspend = useServerFn(adminSuspendUser);

  const detail = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      const r = await fDetail({ data: { userId } });
      if ("error" in r) throw new Error(r.error);
      return JSON.parse(r.json) as UserDetail;
    },
  });

  // THE COMMIT. Session local on purpose: the durable record is the audit
  // trail below, and a second copy of it here would be a second source of one
  // truth.
  const [settled, setSettled] = useState<Settled[]>([]);
  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed, at: nowStamp() },
      ...prev,
    ]);

  const [openCredits, setOpenCredits] = useState(false);
  const [openPlan, setOpenPlan] = useState(false);
  const [openAudit, setOpenAudit] = useState(false);

  const [delta, setDelta] = useState(100);
  const [grantReason, setGrantReason] = useState("Support goodwill");
  const [tier, setTier] = useState<string>("max");
  const [days, setDays] = useState(7);
  const [planReason, setPlanReason] = useState("");

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
    void qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const grant = useMutation({
    mutationFn: (vars: { delta: number; reason: string }) =>
      fGrant({ data: { userId, delta: vars.delta, reason: vars.reason } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return commit("You tried to change the balance", r.error, true);
      commit(
        vars.delta >= 0 ? "You granted credits" : "You took credits back",
        `${Math.abs(vars.delta).toLocaleString()} credits, balance is now ${r.balance.toLocaleString()}`,
      );
      invalidate();
    },
    onError: (e) =>
      commit(
        "You tried to change the balance",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const reset = useMutation({
    mutationFn: () => fReset({ data: { userId } }),
    onSuccess: (r) => {
      if ("error" in r) return commit("You tried to reset the cycle", r.error, true);
      commit(
        "You reset the monthly cycle",
        "This month's grant counter is back to zero. Top-ups were left alone.",
      );
      invalidate();
    },
    onError: (e) =>
      commit(
        "You tried to reset the cycle",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const override = useMutation({
    mutationFn: (vars: { planTier: string; expiresAt: string | null; reason: string }) =>
      fOverride({ data: { userId, ...vars } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return commit("You tried to change the plan", r.error, true);
      commit(
        "You put them on a different plan",
        `${vars.planTier}${vars.expiresAt ? `, until ${vars.expiresAt.slice(0, 10)}` : ", with no expiry"}`,
      );
      invalidate();
    },
    onError: (e) =>
      commit(
        "You tried to change the plan",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const clearOverride = useMutation({
    mutationFn: () => fClear({ data: { userId } }),
    onSuccess: (r) => {
      if ("error" in r) return commit("You tried to clear the override", r.error, true);
      commit("You cleared the override", "They are back on the plan they actually pay for.");
      invalidate();
    },
    onError: (e) =>
      commit(
        "You tried to clear the override",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const suspend = useMutation({
    mutationFn: (vars: { suspend: boolean; reason: string }) =>
      fSuspend({ data: { userId, ...vars } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return commit("You tried to change sign-in", r.error, true);
      commit(
        vars.suspend ? "You blocked sign-in" : "You allowed sign-in",
        vars.suspend
          ? "They cannot start a new session. Sessions already open run until they expire."
          : "They can sign in again from the next attempt.",
      );
      invalidate();
    },
    onError: (e) =>
      commit(
        "You tried to change sign-in",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  if (detail.isLoading) {
    return (
      <Region title="The person you picked">
        <Reading>Reading the account.</Reading>
      </Region>
    );
  }

  // A failed read must not render an account form whose save would act on
  // assumptions about a row nobody actually saw.
  if (detail.isError) {
    return (
      <Region title="The person you picked">
        <ReadFailedLine onRetry={() => void detail.refetch()}>
          The account did not load, so nothing here is safe to change yet.{" "}
          {(detail.error as Error)?.message ?? "The read failed."}
        </ReadFailedLine>
      </Region>
    );
  }

  const d = detail.data;
  if (!d) return null;

  const account = d.accounts?.[0] ?? null;
  const blocked = d.profile?.suspended === true;
  const sub = d.subscription;
  const overrideTier = sub?.plan_override_tier ?? null;
  const overrideExpiry = sub?.plan_override_expires_at ?? null;
  const workspaces = d.workspaces ?? [];
  const audit = d.audit ?? [];
  const shownAudit = openAudit ? audit : audit.slice(0, AUDIT_CAP);
  const busy =
    grant.isPending ||
    reset.isPending ||
    override.isPending ||
    clearOverride.isPending ||
    suspend.isPending;

  const workspaceLine =
    workspaces.length === 0
      ? "In no workspaces, so nothing they own is at stake here."
      : workspaces
          .slice(0, 3)
          .map((w) => `${w.name} (${w.role})`)
          .join(", ") + (workspaces.length > 3 ? `, and ${workspaces.length - 3} more` : "");

  return (
    <div className="flex flex-col gap-mrd-6">
      <Region
        title={d.user?.email ?? "The person you picked"}
        sub={[
          d.profile?.display_name || null,
          d.user?.created_at ? `joined ${d.user.created_at.slice(0, 10)}` : null,
          d.user?.last_sign_in_at
            ? `last signed in ${d.user.last_sign_in_at.slice(0, 10)}`
            : "never signed in",
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        <Line
          label="Sign-in"
          sub={
            blocked
              ? "Blocked. Sessions already open run until they expire on their own."
              : "Allowed. This is the only switch that stops an account outright."
          }
        >
          <Value tone={blocked ? "fail" : "pass"}>{blocked ? "blocked" : "allowed"}</Value>
          <Action
            disabled={busy}
            onClick={() => {
              void (async () => {
                const ok = await confirm({
                  title: blocked ? "Allow sign-in again?" : "Block sign-in?",
                  body: blocked
                    ? "They can sign in from the next attempt."
                    : "They cannot start a new session. Sessions already open run until they expire.",
                  confirmLabel: blocked ? "Allow sign-in" : "Block sign-in",
                  destructive: !blocked,
                });
                if (ok) suspend.mutate({ suspend: !blocked, reason: "" });
              })();
            }}
          >
            {blocked ? "Allow" : "Block"}
          </Action>
        </Line>

        <Line
          label="Plan"
          sub={
            overrideTier
              ? `Overridden to ${overrideTier}${overrideExpiry ? `, expires ${overrideExpiry.slice(0, 10)}` : ", with no expiry"}${sub?.plan_override_reason ? ` · ${sub.plan_override_reason}` : ""}`
              : sub
                ? "What they pay for. No override in force."
                : "No subscription row, so they are on the free floor."
          }
        >
          {/* `hold` rather than the retired `warn`: an override is a plan
              waiting on a condition, either the expiry it carries or an admin
              clearing it. Meridian's amber says exactly that, and orchid would
              promise a person is required, which this is not. */}
          <Value tone={overrideTier ? "hold" : "quiet"}>
            {overrideTier ?? sub?.plan_tier ?? account?.plan_tier ?? "free"}
          </Value>
          <Action
            variant="quiet"
            aria-expanded={openPlan}
            disabled={busy}
            onClick={() => setOpenPlan((v) => !v)}
          >
            Change
          </Action>
        </Line>

        {openPlan ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              override.mutate({
                planTier: tier,
                expiresAt: days > 0 ? new Date(Date.now() + days * 86400_000).toISOString() : null,
                reason: planReason,
              });
            }}
          >
            <Field label="Put them on" htmlFor="admin-plan-tier">
              <Picker id="admin-plan-tier" value={tier} onChange={(e) => setTier(e.target.value)}>
                {PLAN_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Picker>
            </Field>
            <Field label="For how many days" htmlFor="admin-plan-days">
              <Input
                id="admin-plan-days"
                type="number"
                min={0}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </Field>
            <Field label="Why" htmlFor="admin-plan-reason">
              <Input
                id="admin-plan-reason"
                value={planReason}
                onChange={(e) => setPlanReason(e.target.value)}
                placeholder="Recorded on the account. Zero days means it never expires."
              />
            </Field>
            <Actions
              trailing={
                overrideTier ? (
                  <Action
                    variant="quiet"
                    disabled={busy}
                    onClick={() => clearOverride.mutate()}
                    type="button"
                  >
                    Clear the override
                  </Action>
                ) : undefined
              }
            >
              <Action variant="primary" type="submit" disabled={busy}>
                {override.isPending ? "Saving" : "Save the plan"}
              </Action>
            </Actions>
          </form>
        ) : null}

        <Line
          label="Credits"
          sub={
            account
              ? `${account.monthly_grant_credits.toLocaleString()} from this cycle, ${account.topup_credits.toLocaleString()} bought. This is what the crew spends on their behalf.`
              : "No account row, so there is nothing to spend from and a grant will fail."
          }
        >
          <Value>
            <Num>{(account?.balance_credits ?? 0).toLocaleString()}</Num>
          </Value>
          <Action
            variant="quiet"
            aria-expanded={openCredits}
            disabled={busy || !account}
            onClick={() => setOpenCredits((v) => !v)}
          >
            Adjust
          </Action>
        </Line>

        {openCredits && account ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!Number.isFinite(delta) || delta === 0) return;
              grant.mutate({ delta: Math.trunc(delta), reason: grantReason || "Admin grant" });
            }}
          >
            <Field label="Add or take away" htmlFor="admin-credit-delta">
              <Input
                id="admin-credit-delta"
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
              />
            </Field>
            <Field label="Why" htmlFor="admin-credit-reason">
              <Input
                id="admin-credit-reason"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Recorded on the account and in the audit trail."
              />
            </Field>
            <Actions
              trailing={
                <Action
                  variant="quiet"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      const ok = await confirm({
                        title: "Reset the monthly cycle?",
                        body: "This month's grant counter goes back to zero. Credits they bought are left alone.",
                        confirmLabel: "Reset the cycle",
                      });
                      if (ok) reset.mutate();
                    })();
                  }}
                >
                  Reset the monthly cycle
                </Action>
              }
            >
              <Action
                variant="primary"
                type="submit"
                disabled={busy || !Number.isFinite(delta) || delta === 0}
              >
                {grant.isPending
                  ? "Saving"
                  : delta >= 0
                    ? `Add ${Math.trunc(delta).toLocaleString()}`
                    : `Take back ${Math.abs(Math.trunc(delta)).toLocaleString()}`}
              </Action>
            </Actions>
          </form>
        ) : null}

        <Line label="Workspaces" sub={workspaceLine}>
          <Value>
            <Num>{workspaces.length}</Num>
          </Value>
        </Line>
      </Region>

      {settled.length > 0 ? (
        <Region title="What you changed">
          {settled.map((s) => (
            <Receipt
              key={s.id}
              verb={s.verb}
              consequence={s.consequence}
              failed={s.failed}
              time={s.at}
            />
          ))}
        </Region>
      ) : null}

      {/* `toggle` and not `goTo`: this control reveals the rest of the history
          in place. `Region` split the retired `more` slot by what the control
          does, and the half `more` could never emit is `aria-expanded`, which
          this one owed from the day it started swapping its own label. */}
      <Region
        title="What was already done here"
        sub="Every admin write against this account, newest first. Read it before repeating one."
        toggle={
          audit.length > AUDIT_CAP
            ? openAudit
              ? "Show fewer"
              : `Show all ${audit.length}`
            : undefined
        }
        toggled={openAudit}
        onToggle={() => setOpenAudit((v) => !v)}
      >
        {audit.length === 0 ? (
          <NothingHere>Nothing has been done to this account yet. You would be the first.</NothingHere>
        ) : (
          shownAudit.map((r) => (
            <Row
              key={r.id}
              tight
              lead={ACTION_WORDS[r.action] ?? r.action}
              // The payload, which the old list read and threw away. Where it
              // holds nothing the row says so rather than inventing detail.
              sub={auditDetail(r.action, r.payload ?? {}) ?? "No detail recorded."}
              time={r.created_at.slice(0, 16).replace("T", " ")}
            />
          ))
        )}
      </Region>
    </div>
  );
}
