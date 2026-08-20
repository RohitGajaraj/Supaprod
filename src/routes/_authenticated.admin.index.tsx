/**
 * ADMIN / OVERVIEW. The front door of the operator console, and the surface
 * that sets the tone for the eight tabs beside it. Redesigned, not re-skinned
 * (SURFACE-JUSTIFICATION.md).
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    Whoever runs this workspace, arriving because they think something needs
 *    them. Not to browse the console: nobody has ever opened an admin console to
 *    look at things. They came to find out whether anything is wrong, fix the one
 *    thing that is, and leave.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Answering "does anything need me right now" without opening eight tabs.
 *    A tab bar offers doors; it cannot say which door has something behind it.
 *    That is the whole job here, and it is why every read on this page is
 *    justified only if its absence would let the page claim "nothing needs you"
 *    while something did.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    KEEP  the charging flip. It is the single money decision in the product, it
 *          starts debiting real people, and it exists nowhere else.
 *    KEEP  the admin list and the add-by-email form. "Someone needs access" is
 *          the second reason anyone opens this console.
 *    MERGE the go-live checklist INTO the charging flip. They were two cards a
 *          scroll apart, so an operator could turn charging on while a check two
 *          cards below said three accounts would be blocked the moment they did.
 *          The evidence is the argument for the button, so it is now the button's
 *          own detail, and a failing check is named inside the confirmation.
 *    ADD   the attention block: what is showing to every user right now, and
 *          whether anything has stopped running. Both are real reads, both are
 *          shared query keys with the tabs that own them, and without them the
 *          verdict at the top of this page would be a lie by omission.
 *    KILL  the three bordered cards and the local cardStyle / sectionTitleStyle
 *          helpers. One bordered container per region (anti-slop ban 5).
 *    KILL  the paragraph explaining what charging does, which restated the
 *          heading beside it in longer words (ban 10). What charging does is now
 *          the gate's own detail lines, said once, from real data.
 *    KILL  the "Charging is ON / OFF" heading. It was a label for a control that
 *          already says which way it goes.
 *    KILL  the coloured status dot beside each check. The word already carries
 *          the verdict, and a dot that means "pass" next to text that says
 *          "Live keys present" is colour doing a second job badly.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    Everything the tabs own. The attention rows are one line each and open the
 *    tab that holds the detail: the failing jobs on Health, the live notice on
 *    Platform. No number that another tab renders in full is repeated here.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The moment is the first line of the block, which is a verdict rather than a
 *    heading: "Nothing else needs you" is earned from two real reads, and its
 *    opposite names the job that stopped and how long ago.
 *    The confusion this surface must keep refusing: a failed read wearing a clear
 *    verdict's clothes. Each read carries its own state, a read that failed says
 *    so on its own line and offers a retry, and the charging gate refuses to draw
 *    at all if it does not know which way the switch currently sits, because a
 *    gate asking the wrong question is worse than no gate.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Almost nowhere, and that is the correct answer here rather than a gap. This
 *    surface governs HUMANS: who holds a role, and whether real people get
 *    charged real money. Putting agent marks on a page about human access would
 *    be decoration, and the agentic-first test asks whether the crew's presence
 *    PROVES something, not whether it is visible. The one place the crew does
 *    appear is where it genuinely acted: the attention line reports agent
 *    failures, because a crew that broke is a crew that was working. Where the
 *    crew spends, it is named and marked, one tab across on Spend.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Row } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingHere,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { inBandError } from "@/components/admin/admin-ui";
import { Field, Input } from "@/components/meridian/forms";
import { Gate } from "@/components/meridian/Gate";
import {
  getPricingCatalog,
  adminSetCreditsEnabled,
  adminListAdmins,
  adminAddAdminByEmail,
  adminRemoveAdmin,
} from "@/lib/pricing.functions";
import { getBillingGoLiveReadiness, type GoLiveCheck } from "@/lib/payments/go-live.functions";
import { getObservabilityStatus } from "@/lib/observability.functions";
import { getActiveBanner } from "@/lib/admin-platform.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

/**
 * THE TONE A FAILING CHECK SPEAKS IN, and it used to be a CLASS NAME.
 *
 * This was `checkClass`, and it returned the literal strings `"sp-fail"` and
 * `"sp-warn"`. A helper that hands back a retired class name is worse than a
 * hard-coded one written at a call site: the retired vocabulary is COMPUTED, so
 * every caller inherits it and the strings do not appear anywhere a reader is
 * looking at markup. Six of this file's class occurrences were `sp-*` status
 * words, and two of them lived in here.
 *
 * ── `warn` BECOMES `hold`, AND IT IS A DECISION RATHER THAN A RENAME ─────
 * `GoLiveCheck["status"]` has a `warn`. Meridian's tone union does not, on
 * purpose: it carries five status words and amber among them is `hold`, which
 * means WAITING ON A CONDITION. That is exactly what every warning check here
 * is -- a key that is not live yet, a bundle whose volume has not been proved
 * round-trippable. Orchid (`you`) would be the reflex and it is wrong, because
 * it promises a control on this screen that moves the thing. `Value` has no
 * `you` tone for the same reason.
 *
 * ── THE RETURN TYPE IS TAKEN FROM `Value` ITSELF ────────────────────────
 * Not a hand-written union, and not `string`. `shell/primitives` also exports a
 * `Value`, and THAT one has a `warn` tone, so a port that reached for it would
 * compile, change nothing, and defeat the whole item. Reading the type off the
 * Meridian component means the compiler enforces the mapping: a sixth status
 * word cannot be invented here without failing the typecheck.
 *
 * Only a problem wears colour. Five green lines would be colour carrying the
 * hierarchy, which the greyscale test exists to catch; the words already say
 * which check passed. So a passing check returns nothing and renders as plain
 * body text.
 */
type CheckTone = NonNullable<React.ComponentProps<typeof Value>["tone"]>;

function checkTone(status: GoLiveCheck["status"]): CheckTone | undefined {
  if (status === "fail") return "fail";
  if (status === "warn") return "hold";
  return undefined;
}

function AdminOverview() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const fGetCatalog = useServerFn(getPricingCatalog);
  const fSetFlag = useServerFn(adminSetCreditsEnabled);
  const fListAdmins = useServerFn(adminListAdmins);
  const fAddAdmin = useServerFn(adminAddAdminByEmail);
  const fRemoveAdmin = useServerFn(adminRemoveAdmin);
  const fReadiness = useServerFn(getBillingGoLiveReadiness);
  const fHealth = useServerFn(getObservabilityStatus);
  const fBanner = useServerFn(getActiveBanner);

  const catalog = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fGetCatalog() });
  const admins = useQuery({ queryKey: ["admin-list"], queryFn: () => fListAdmins() });
  const readiness = useQuery({
    queryKey: ["billing-go-live-readiness"],
    queryFn: () => fReadiness(),
  });
  // Both share the query key of the tab that owns them, so opening that tab is
  // instant and this page never fetches the same fact twice.
  const health = useQuery({
    queryKey: ["observability-status"],
    queryFn: () => fHealth(),
    staleTime: 60_000,
  });
  const banner = useQuery({ queryKey: ["admin-banner"], queryFn: () => fBanner() });

  const [email, setEmail] = useState("");

  const setFlag = useMutation({
    mutationFn: (enabled: boolean) => fSetFlag({ data: { enabled } }),
    onSuccess: (res, enabled) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(enabled ? "AI use is now charged." : "AI use is no longer charged.");
      qc.invalidateQueries({ queryKey: ["pricing-catalog"] });
      qc.invalidateQueries({ queryKey: ["billing-go-live-readiness"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the setting."),
  });

  const addAdmin = useMutation({
    mutationFn: () => fAddAdmin({ data: { email } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`${email} can now change this workspace.`);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add the admin."),
  });

  const removeAdmin = useMutation({
    mutationFn: (user_id: string) => fRemoveAdmin({ data: { user_id } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Admin removed.");
      qc.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove the admin."),
  });

  const charging = catalog.data?.creditsEnabled ?? false;
  const checks: GoLiveCheck[] =
    readiness.data && !("error" in readiness.data) ? readiness.data.checks : [];
  const failing = checks.filter((c) => c.status === "fail");

  const adminsError = admins.isError
    ? admins.error instanceof Error
      ? admins.error.message
      : "Request failed."
    : inBandError(admins.data);
  const adminList = Array.isArray(admins.data) ? admins.data : [];

  async function onFlip() {
    const next = !charging;
    const ok = await confirm({
      title: next ? "Start charging for AI use?" : "Stop charging for AI use?",
      body: next
        ? failing.length > 0
          ? `${failing.length} check${failing.length === 1 ? " is" : "s are"} still failing: ${failing
              .map((c) => c.label)
              .join(
                ", ",
              )}. Turning charging on now debits every user's balance immediately, and anyone with a zero balance is blocked.`
          : "Every AI call starts debiting credits from each user's monthly grant and top-up balance, from the moment you confirm."
        : "AI calls stop debiting credits. Top-ups keep being recorded, and nobody is blocked for a zero balance.",
      confirmLabel: next ? "Turn on charging" : "Turn off charging",
      destructive: true,
    });
    if (ok) setFlag.mutate(next);
  }

  async function onRemove(user_id: string, adminEmail: string) {
    const ok = await confirm({
      title: `Remove ${adminEmail} as an admin?`,
      body: "They lose access to this console immediately, including billing and member roles.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) removeAdmin.mutate(user_id);
  }

  // ---- What else needs you -------------------------------------------------
  const activeBanner = banner.data ?? null;
  const bannerFailed = banner.isError;
  const healthData = health.data && !("error" in health.data) ? health.data : undefined;

  const staleJobs = healthData?.cronHealth.filter((c) => c.stale).length ?? 0;
  const agentFailures = healthData?.failureBreakdown.reduce((sum, f) => sum + f.count, 0) ?? 0;

  // Every true clause is reported, never only the loudest one: a page that says
  // "one thing needs you" while two things are wrong is under-reporting, which
  // is the same defect as over-claiming pointed the other way.
  function healthState(): { text: React.ReactNode; needsYou: boolean } {
    if (health.isLoading) return { text: "Reading.", needsYou: false };
    if (!healthData) {
      return { text: <Value tone="fail">This read did not load.</Value>, needsYou: true };
    }
    const clauses: React.ReactNode[] = [];
    if (staleJobs > 0) {
      clauses.push(
        <Value tone="fail" key="stale">
          {staleJobs} scheduled job{staleJobs === 1 ? " has" : "s have"} stopped running
        </Value>,
      );
    }
    if (agentFailures > 0) {
      clauses.push(
        <span key="agents">
          {agentFailures} agent failure{agentFailures === 1 ? "" : "s"} in the last 7 days
        </span>,
      );
    }
    if (!healthData.gateEnabled) {
      clauses.push(<span key="gate">health tracking is off, so nothing is being watched</span>);
    }
    if (clauses.length === 0) {
      return {
        text: "Everything scheduled is running and nothing failed this week.",
        needsYou: false,
      };
    }
    return {
      text: (
        <>
          {clauses.map((c, i) => (
            <span key={i}>
              {i > 0 ? " · " : ""}
              {c}
            </span>
          ))}
          .
        </>
      ),
      needsYou: true,
    };
  }
  const healthLine = healthState();

  const bannerLine: { text: React.ReactNode; needsYou: boolean } = banner.isLoading
    ? { text: "Reading.", needsYou: false }
    : bannerFailed
      ? { text: <Value tone="fail">This read did not load.</Value>, needsYou: true }
      : activeBanner
        ? { text: `Showing now: ${activeBanner.message}`, needsYou: true }
        : { text: "No notice is showing.", needsYou: false };

  const attention = [healthLine, bannerLine].filter((l) => l.needsYou).length;
  const attentionTitle =
    health.isLoading || banner.isLoading
      ? "Checking what needs you"
      : attention === 0
        ? "Nothing else needs you"
        : attention === 1
          ? "One thing needs you"
          : `${attention} things need you`;

  const adminTitle = adminsError
    ? "The admin list did not load"
    : admins.isLoading
      ? "Reading who holds the keys"
      : adminList.length === 0
        ? "Nobody can change this workspace"
        : adminList.length === 1
          ? "One person can change this workspace"
          : `${adminList.length} people can change this workspace`;

  return (
    // THE RHYTHM BETWEEN REGIONS, STATED HERE. The retired `Block` carried its
    // own top margin and a rule above every section, so this page's spacing lived
    // in a stylesheet. `Region` draws neither, so the surface owns it, and
    // `gap-mrd-6` is the step every ported surface uses between regions. The
    // between-region hairlines do not come back.
    <div className="flex flex-col gap-mrd-6">
      <Region
        title={attentionTitle}
        sub="Two reads that no tab label can carry: whether anything scheduled has stopped, and what every user is seeing right now. Each line opens the tab that holds the detail."
      >
        <Row
          tight
          lead="Health"
          sub={healthLine.text}
          onClick={() => void navigate({ to: "/admin/observability" })}
        />
        <Row
          tight
          lead="Notice to everyone"
          sub={bannerLine.text}
          onClick={() => void navigate({ to: "/admin/platform" })}
        />
      </Region>

      {catalog.isLoading ? (
        <Reading>Reading whether AI use is charged.</Reading>
      ) : catalog.isError ? (
        // Without knowing which way the switch sits, the gate would ask the
        // wrong question, and a gate asking the wrong question is worse than
        // none. So it does not draw.
        <ReadFailedLine onRetry={() => void catalog.refetch()}>
          Could not read whether AI use is being charged, so the flip is not safe to offer.{" "}
          {catalog.error instanceof Error ? catalog.error.message : "The read failed."}
        </ReadFailedLine>
      ) : (
        <Gate
          question={charging ? "Stop charging for AI use?" : "Start charging for AI use?"}
          lines={
            readiness.isLoading
              ? ["Checking what the flip would do."]
              : checks.length === 0
                ? [
                    <Value tone="fail" key="failed">
                      The pre-flight checks did not load, so nothing here says what the flip would
                      do.
                    </Value>,
                  ]
                : checks.map((c) => {
                    const tone = checkTone(c.status);
                    return (
                      <span key={c.id}>
                        <b>{c.label}</b> {tone ? <Value tone={tone}>{c.detail}</Value> : c.detail}
                      </span>
                    );
                  })
          }
        >
          <Action variant="primary" disabled={setFlag.isPending} onClick={() => void onFlip()}>
            {setFlag.isPending ? "Saving" : charging ? "Turn off charging" : "Turn on charging"}
          </Action>
          {readiness.isError || (readiness.data && "error" in readiness.data) ? (
            <Action variant="quiet" onClick={() => void readiness.refetch()}>
              Retry the checks
            </Action>
          ) : null}
        </Gate>
      )}

      <Region
        title={adminTitle}
        sub="An admin can change billing, roles and platform switches for everyone in this workspace. The last admin cannot be removed, because a workspace with none cannot be administered at all."
      >
        {admins.isLoading ? (
          <Reading>Reading the admin list.</Reading>
        ) : adminsError ? (
          <ReadFailedLine onRetry={() => void admins.refetch()}>
            The admin list did not load, so this is not the full set. {adminsError}
          </ReadFailedLine>
        ) : adminList.length === 0 ? (
          <NothingHere>
            No account holds the admin role. Add one by email below, or nobody can change billing,
            roles or platform switches again.
          </NothingHere>
        ) : (
          adminList.map((a) => (
            <Row
              key={a.user_id}
              tight
              lead={a.email}
              sub={`Admin since ${a.created_at.slice(0, 10)}`}
              action={
                <Action
                  variant="quiet"
                  disabled={removeAdmin.isPending || adminList.length <= 1}
                  title={
                    adminList.length <= 1
                      ? "The last admin cannot be removed."
                      : `Remove ${a.email}`
                  }
                  onClick={() => void onRemove(a.user_id, a.email)}
                >
                  Remove
                </Action>
              }
            />
          ))
        )}

        {/* `Region` sets no spacing between its children and `Actions` sets no
            outer margin, both on purpose, so the composition says where the form
            sits rather than a stylesheet deciding for it. */}
        <form
          className="mt-mrd-5 flex flex-col gap-mrd-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) addAdmin.mutate();
          }}
        >
          <Field label="Add an admin by email" htmlFor="admin-add-email">
            <Input
              id="admin-add-email"
              type="email"
              placeholder="name@example.com"
              style={{ maxWidth: 320 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Actions>
            <Action type="submit" disabled={addAdmin.isPending || !email.trim()}>
              {addAdmin.isPending ? "Adding" : "Add admin"}
            </Action>
          </Actions>
        </form>
      </Region>
    </div>
  );
}
