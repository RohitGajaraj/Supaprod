/**
 * The ceiling on your spend.
 *
 * PORTED 2026-07-29 onto src/components/shell/primitives.tsx. This is a
 * governance surface, so the shape follows the canon
 * (docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md): policy is set in
 * advance and does not block. A cap is exactly that, so every cap on this
 * surface is a `Line`, a sentence with a control at the end of it, never a card
 * demanding attention.
 *
 * WAS: six `bento` cards in a two-column grid, each with its own border, its
 * own padding and its own inline form. Six bordered containers in one region,
 * where the standard allows one (anti-slop.md ban 5). The burn number sat over
 * a 5px progress bar that switched between two hues at 80%, which is colour
 * carrying a threshold the number beside it already stated.
 *
 * IS: one `sp-subtitle` stating what is actually in force, then three `Block`s
 * of `Line`s. The bar is gone; the burn is a `Value` whose tone IS the
 * threshold, and the threshold is `alert_at_pct`, which is the same number the
 * runtime warns at rather than a hard-coded 80 in the view.
 *
 * THREE THINGS THIS PASS CHANGED BEYOND STYLING, each recorded because a
 * governance surface that overclaims is worse than one that looks dated.
 *
 * 1. THE TOKEN CAPS ARE GONE. `daily_token_cap` and `monthly_token_cap` are
 *    written by `updateGlobalBudget` and read by NOTHING: `checkBudget`
 *    (runtime.server.ts:820) selects only the two USD caps, and no other call
 *    path reads either column. Drawing a control that sets an inert number is
 *    the exact defect the Crew surface refused, "a control that draws a setting
 *    the runtime would silently override". The stored values are passed through
 *    untouched on every write, so nothing is destroyed and the controls can
 *    come back the day the runtime reads them.
 *
 * 2. THE EXPLAINER NO LONGER PROMISES PER-MISSION CAPS. `checkMissionCaps`
 *    really does halt a run on `mission_spend_cap_usd`, but every writer on the
 *    main path passes `?? null` (handoff.server.ts:419, loop.server.ts:491), so
 *    only a fan-out child is ever given one. Telling a person their missions
 *    are individually capped would be describing a ceiling that does not exist.
 *
 * 3. THE BURN IS WINDOW-AWARE. `checkBudget` only enforces while
 *    `day_window === today`, and `incrementBudget` zeroes the counter when the
 *    window rolls. Reading `daily_usd_used` without checking the window renders
 *    yesterday's total as today's, which is a wrong number on a spend screen.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingYet,
  Num,
  Picker,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { SPEND_TONE, spendState } from "@/components/meridian/Spend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "@/lib/notify";
import {
  getBudgetOverview,
  updateGlobalBudget,
  upsertSurfaceBudget,
  deleteSurfaceBudget,
  acknowledgeAlert,
} from "@/lib/budgets.functions";
import { humanWriteError } from "@/lib/roles.functions";
import { useGovernedWrite } from "@/hooks/use-workspace-role";
import { GovernedWriteNote } from "./GovernedWriteNote";
import { fmtUsd } from "@/components/product/format";
import { Receipt } from "@/components/meridian/Receipt";
import { useConfirm } from "@/hooks/use-confirm";

const SURFACES = [
  "agent",
  "chat",
  "copilot",
  "prd",
  "discovery",
  "studio",
  "brief",
  "eval",
  "judge",
  "embed",
  "scheduler",
];

type GlobalBudget = {
  daily_usd_cap: number | string | null;
  monthly_usd_cap: number | string | null;
  daily_token_cap: number | string | null;
  monthly_token_cap: number | string | null;
  alert_at_pct: number | null;
  daily_usd_used?: number | string | null;
  monthly_usd_used?: number | string | null;
  /** The window the counters belong to. Stale means the counters are last
   *  window's and the runtime is treating them as zero. */
  day_window?: string | null;
  month_window?: string | null;
};

type SurfaceRow = {
  surface: string;
  daily_usd_cap: number | string | null;
  monthly_usd_cap: number | string | null;
  enabled: boolean;
  daily_usd_used: number | string;
  monthly_usd_used: number | string;
  day_window?: string | null;
  month_window?: string | null;
};

type AlertRow = {
  id: string;
  kind: string;
  scope: string;
  surface: string | null;
  window_kind: string;
  pct: number | string;
  usd_used: number | string;
  usd_cap: number | string;
  created_at: string;
  acknowledged: boolean;
};

/** What a judgment left behind, kept per region so a receipt sits under the
 *  thing it changed rather than at the bottom of the page. */
type Done = { verb: string; consequence: ReactNode; at: string };

/** The same window arithmetic the runtime does, so the screen and the enforcer
 *  cannot disagree about what today is. */
function windowKeys() {
  const today = new Date().toISOString().slice(0, 10);
  return { today, thisMonth: `${today.slice(0, 7)}-01` };
}

/** Spend in the CURRENT window. A counter from a window that has rolled is not
 *  this window's spend, and the runtime already treats it as zero. */
function burnIn(
  used: number | string | null | undefined,
  stored: string | null | undefined,
  live: string,
) {
  if (stored !== live) return 0;
  return Number(used ?? 0);
}

/** Plain-words relative time, the same vocabulary the Crew surface uses. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * How a burn reads against its own ceiling, resolved by the Meridian primitive
 * rather than here.
 *
 * THIS USED TO BE A SECOND RESOLVER AND IT IS DELETED. `burnTone(burn, cap,
 * alertPct)` lived here and `spendState(spent, cap, alertAt)` lives in
 * `meridian/Spend.tsx`, both answering "how close is this to its ceiling", and
 * nothing made them agree. Two surfaces could call one workspace nearly-spent and
 * not-nearly-spent on identical numbers. They disagreed about three things
 * already: a cap of 0 read as no ceiling here and now reads as a ceiling nothing
 * may be spent under, which is what the runtime enforces; a threshold of 0 wore a
 * permanent amber; and a burn under the threshold painted `pass`, which Meridian
 * reserves for an outcome that happened.
 *
 * The threshold is still `alert_at_pct`, the same number `incrementBudget` writes
 * its alert at, so the colour on screen still changes at the moment the record
 * says it does. It is divided by 100 because the primitive takes a fraction and
 * the column stores a percentage.
 */
function burnTone(burn: number, cap: number | null, alertPct: number) {
  return SPEND_TONE[spendState(burn, cap, alertPct / 100)];
}

/** Full payload for updateGlobalBudget with one field replaced. The server
    schema wants every cap on each write, and the token caps ride through
    untouched: nothing reads them today, and nothing should destroy them. */
function globalPayload(g: GlobalBudget | null, patch: Partial<Record<string, number | null>>) {
  return {
    daily_usd_cap: g?.daily_usd_cap != null ? Number(g.daily_usd_cap) : null,
    monthly_usd_cap: g?.monthly_usd_cap != null ? Number(g.monthly_usd_cap) : null,
    daily_token_cap: g?.daily_token_cap != null ? Number(g.daily_token_cap) : null,
    monthly_token_cap: g?.monthly_token_cap != null ? Number(g.monthly_token_cap) : null,
    alert_at_pct: g?.alert_at_pct ?? 80,
    ...patch,
  };
}

/** Shown when a ceiling write failed for a reason the database wrote. */
const CAP_WRITE_FAILED = "That ceiling did not save. Your spend is bounded as it was before.";

export function BudgetsPanel({
  /**
   * DRAW THE CEILINGS AND NOT WHAT THEY HAVE SAID.
   *
   * This panel holds three regions and two of them set something: the global
   * cap, and the per-thing ceilings. The third, "What the ceilings have said",
   * is a log of windows that crossed a warning point.
   *
   * A SPEND CAP IS A PERMISSION, which is why the controls belong on the pane
   * titled "What they may do without asking" -- how much a crew may spend
   * without asking is the same question as which tools it may use without
   * asking, and answering half of it on one screen and half on another is the
   * split the founder objected to. The log is not that question; it is what
   * already happened, and it stays in the Engine Room with the rest of the
   * record.
   *
   * Same shape as ControlsPanel's `controlsOnly` (U-038): the flag decides
   * where a region is DRAWN and never whether it exists. The Engine Room
   * passes nothing and gets the whole panel.
   */
  controlsOnly = false,
}: { controlsOnly?: boolean } = {}) {
  /**
   * A spend cap is money, so a read-only role does not set one. A member does:
   * ai_budgets and ai_surface_budgets are the NOT-A-VIEWER tier, not the
   * governance tier, and taking a self-limit away from a member would be
   * tightening the product past what the database asks for.
   *
   * Acknowledging an alert is deliberately NOT gated. It writes ai_budget_alerts,
   * which the migration left open on purpose: an alert is a record that a soft
   * cap was crossed, and silencing it for the person who crossed it is the
   * opposite of the point.
   */
  const capWrite = useGovernedWrite("spend_caps");
  const qc = useQueryClient();
  const fetchFn = useServerFn(getBudgetOverview);
  const saveGlobal = useServerFn(updateGlobalBudget);
  const upsertSurface = useServerFn(upsertSurfaceBudget);
  const delSurface = useServerFn(deleteSurfaceBudget);
  const ackFn = useServerFn(acknowledgeAlert);

  const overview = useQuery({ queryKey: ["budget_overview"], queryFn: () => fetchFn() });

  /**
   * What a failed write SAYS. Never the database's own words: a person who set a
   * ceiling and was refused needs to know their ceiling did not move, not the
   * name of the policy that refused it or the table it lives in.
   */
  const capWriteFailed = (e: Error) => toast.error(humanWriteError(e, CAP_WRITE_FAILED));

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["budget_overview"] });
    qc.invalidateQueries({ queryKey: ["budget_summary"] });
  };

  const [editCap, setEditCap] = useState<"daily" | "monthly" | null>(null);
  const [capDraft, setCapDraft] = useState("");
  const [pctDraft, setPctDraft] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSurface, setNewSurface] = useState({ surface: "chat", daily: "", monthly: "" });
  const [capDone, setCapDone] = useState<Done[]>([]);
  const [surfaceDone, setSurfaceDone] = useState<Done[]>([]);

  const g = (overview.data?.global as GlobalBudget | null) ?? null;

  const setCapMut = useMutation({
    mutationFn: (v: { key: "daily" | "monthly"; value: number }) =>
      saveGlobal({
        data: globalPayload(
          g,
          v.key === "daily" ? { daily_usd_cap: v.value } : { monthly_usd_cap: v.value },
        ),
      }),
    onSuccess: (_d, v) => {
      // THE COMMIT. A toast confirms that the click registered; this says what
      // the click will actually stop.
      setCapDone((d) => [
        ...d,
        {
          verb: "You set the ceiling",
          consequence: (
            <>
              A call is refused once {v.key === "daily" ? "today's" : "this month's"} spend reaches{" "}
              <Num>{fmtUsd(v.value)}</Num>.
            </>
          ),
          at: new Date().toISOString(),
        },
      ]);
      inv();
    },
    onError: capWriteFailed,
  });

  const setPctMut = useMutation({
    mutationFn: (pct: number) => saveGlobal({ data: globalPayload(g, { alert_at_pct: pct }) }),
    onSuccess: (_d, pct) => {
      setPctDraft(null);
      setCapDone((d) => [
        ...d,
        {
          verb: "You moved the warning",
          consequence: (
            <>
              A note lands on the record when a window crosses <Num>{pct}%</Num> of its ceiling.
              Nothing is stopped at that point.
            </>
          ),
          at: new Date().toISOString(),
        },
      ]);
      inv();
    },
    onError: capWriteFailed,
  });

  const addSurfaceMut = useMutation({
    mutationFn: () =>
      upsertSurface({
        data: {
          surface: newSurface.surface,
          daily_usd_cap: newSurface.daily.trim() ? Number(newSurface.daily) : null,
          monthly_usd_cap: newSurface.monthly.trim() ? Number(newSurface.monthly) : null,
          enabled: true,
        },
      }),
    onSuccess: () => {
      const { surface, daily, monthly } = newSurface;
      setSurfaceDone((d) => [
        ...d,
        {
          verb: "You capped it",
          consequence: (
            <>
              {surface} is refused{" "}
              {daily.trim() ? (
                <>
                  past <Num>{fmtUsd(Number(daily))}</Num> in a day
                </>
              ) : null}
              {daily.trim() && monthly.trim() ? " and " : null}
              {monthly.trim() ? (
                <>
                  past <Num>{fmtUsd(Number(monthly))}</Num> in a month
                </>
              ) : null}
              {!daily.trim() && !monthly.trim()
                ? "by nothing: you set no amount, so the row is on but empty"
                : null}
              .
            </>
          ),
          at: new Date().toISOString(),
        },
      ]);
      setNewSurface({ surface: "chat", daily: "", monthly: "" });
      setAdding(false);
      inv();
    },
    onError: capWriteFailed,
  });

  const toggleSurfaceMut = useMutation({
    mutationFn: (row: SurfaceRow) =>
      upsertSurface({
        data: {
          surface: row.surface,
          daily_usd_cap: row.daily_usd_cap == null ? null : Number(row.daily_usd_cap),
          monthly_usd_cap: row.monthly_usd_cap == null ? null : Number(row.monthly_usd_cap),
          enabled: !row.enabled,
        },
      }),
    onSuccess: (_d, row) => {
      setSurfaceDone((d) => [
        ...d,
        {
          verb: row.enabled ? "You lifted it" : "You put it back",
          consequence: row.enabled ? (
            <>Nothing stops {row.surface} now except the account ceiling.</>
          ) : (
            <>{row.surface} is held to its own amount again.</>
          ),
          at: new Date().toISOString(),
        },
      ]);
      inv();
    },
    onError: capWriteFailed,
  });

  const removeSurfaceMut = useMutation({
    mutationFn: (surface: string) => delSurface({ data: { surface } }),
    onSuccess: (_d, surface) => {
      setSurfaceDone((d) => [
        ...d,
        {
          verb: "You removed it",
          consequence: <>{surface} has no ceiling of its own now.</>,
          at: new Date().toISOString(),
        },
      ]);
      inv();
    },
    onError: capWriteFailed,
  });

  /*
   * ── REMOVING A CEILING WAS CHEAPER THAN SETTING ONE ──────────────────────
   *
   * Adding a surface budget takes a form and an amount; `deleteSurfaceBudget`
   * fired straight off the button. So the act that WIDENS what may be spent
   * cost one click and the act that narrows it cost a form, on the panel whose
   * whole job is saying what the system is allowed to do.
   *
   * The same inversion is recorded twice already: `MembersCard` ("taking away
   * somebody's access was cheaper than promoting them") says /boundary found it
   * on its own mode controls too. `useConfirm` is the established destructive
   * question on 32 surfaces and `MembersCard` sets the wording rule, so this
   * follows it rather than inventing a shape: name WHICH surface, speak in
   * second person, and put what cannot be walked back last.
   *
   * The row's own success note already says "<surface> has no ceiling of its
   * own now", which is the consequence stated AFTER the fact. This is the same
   * sentence moved to before it, where a person can still act on it.
   */
  const confirm = useConfirm();
  const askThenRemoveSurface = async (surface: string) => {
    const ok = await confirm({
      title: `Remove the ceiling on ${surface}?`,
      body: `${surface} has its own limit today. Removing it stops nothing that is running and spends nothing, but this row will no longer hold anything back, and ${surface} falls to whatever the workspace allows. Setting it again means entering the amount and the window from scratch.`,
      confirmLabel: "Remove the ceiling",
      destructive: true,
    });
    if (ok) removeSurfaceMut.mutate(surface);
  };

  const ackMut = useMutation({
    mutationFn: (id: string) => ackFn({ data: { id } }),
    onSuccess: () => inv(),
    // A different failure from a ceiling that would not move, so it says a
    // different thing. The note is still on the record either way.
    onError: (e: Error) =>
      toast.error(humanWriteError(e, "That note was not cleared, so it is still on the record.")),
  });

  if (overview.isLoading) return <Reading>Reading what you have spent.</Reading>;

  // A read that FAILED is not an empty state. "No cap is set" and "we could not
  // find out" are different facts, and one of them is dangerous to guess at on
  // a spend screen.
  if (overview.isError) {
    return (
      <ReadFailed error={overview.error} onRetry={() => void overview.refetch()}>
        Your budgets did not load, so nothing here would be the real ceiling.
      </ReadFailed>
    );
  }

  const surfaces = (overview.data?.surfaces ?? []) as SurfaceRow[];
  const alerts = (overview.data?.alerts ?? []) as AlertRow[];
  const { today, thisMonth } = windowKeys();
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long" });
  const alertPct = g?.alert_at_pct ?? 80;
  const pctIsDefault = g?.alert_at_pct == null;

  const windows: {
    key: "daily" | "monthly";
    label: string;
    burn: number;
    cap: number | null;
    note: string;
  }[] = [
    {
      key: "daily",
      label: "Today",
      burn: burnIn(g?.daily_usd_used, g?.day_window, today),
      cap: g?.daily_usd_cap != null ? Number(g.daily_usd_cap) : null,
      note: "Starts again at midnight, UTC.",
    },
    {
      key: "monthly",
      label: monthLabel,
      burn: burnIn(g?.monthly_usd_used, g?.month_window, thisMonth),
      cap: g?.monthly_usd_cap != null ? Number(g.monthly_usd_cap) : null,
      note: "Starts again on the first.",
    },
  ];

  const capped = windows.filter((w) => w.cap != null);

  return (
    <>
      <p className="sp-subtitle">
        {capped.length === 0 ? (
          "No ceiling is set, so nothing stops a call on how much it costs."
        ) : (
          <>
            {windows.map((w, i) => (
              <span key={w.key}>
                {i > 0 ? " " : null}
                {w.label}, <Num>{fmtUsd(w.burn)}</Num>
                {w.cap != null ? (
                  <>
                    {" "}
                    of <Num>{fmtUsd(w.cap)}</Num>.
                  </>
                ) : (
                  " and no ceiling."
                )}
              </span>
            ))}
          </>
        )}
      </p>

      {/* Said once, above every ceiling it explains, and nothing at all for a
          role that may set one. */}
      <GovernedWriteNote reason={capWrite.reason} />

      {/*
       * "THERE IS NO SEPARATE CEILING ON ANY ONE MISSION" WAS FALSE, and it was
       * being said one pane away from the control that sets one.
       *
       * `workspaces.default_mission_spend_cap_usd` carries $10.00 on every one
       * of the 21 workspaces (measured 2026-08-27), the boundary panel on this
       * same settings page edits it, and `mission_cap_state` checks it before
       * every model call. Three surfaces used to give three answers about the
       * per-goal ceiling and the reassuring one was wrong -- the same defect
       * engine-room-glance.ts records itself closing in 2026-08-03, reopened
       * here in the opposite direction: a surface UNDERSTATING its own controls
       * teaches a person to distrust it just as fast as one overstating them.
       *
       * The line now says what this ceiling's scope actually is, which is the
       * fact that made the old sentence tempting: these windows are the whole
       * workspace over time, and the per-goal one is somewhere else.
       */}
      <Region
        title="What you will not spend past"
        sub="Checked before every call. Past the ceiling the call is refused and the run stops with the reason on the record. This one covers the whole workspace over a window; what any single goal may spend is a separate ceiling, set with the rest of the boundary."
      >
        {windows.map((w) => {
          const editing = editCap === w.key;
          return (
            <Line
              key={w.key}
              label={w.label}
              // The different fact: when the counter resets, not the number the
              // control already shows.
              sub={w.note}
            >
              {editing ? (
                <form
                  style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s3)" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = parseFloat(capDraft);
                    if (v > 0) setCapMut.mutate({ key: w.key, value: v });
                    setEditCap(null);
                  }}
                >
                  <Input
                    autoFocus
                    value={capDraft}
                    onChange={(e) => setCapDraft(e.target.value)}
                    inputMode="decimal"
                    aria-label={`${w.label} ceiling in dollars`}
                    // Wide enough for $99999.99 and no wider: the field should
                    // not imply a number nobody would type.
                    style={{ width: 108 }}
                  />
                  <Action variant="primary" type="submit" busy={setCapMut.isPending}>
                    Set it
                  </Action>
                  <Action variant="quiet" onClick={() => setEditCap(null)}>
                    Leave it
                  </Action>
                </form>
              ) : (
                <>
                  <Value tone={burnTone(w.burn, w.cap, alertPct)}>
                    <Num>{fmtUsd(w.burn)}</Num>
                    {w.cap != null ? (
                      <>
                        {" "}
                        of <Num>{fmtUsd(w.cap)}</Num>
                      </>
                    ) : (
                      " spent, no ceiling"
                    )}
                  </Value>
                  <Action
                    variant="quiet"
                    disabled={!capWrite.allowed}
                    title={capWrite.reason ?? undefined}
                    onClick={() => {
                      setEditCap(w.key);
                      setCapDraft(w.cap != null ? String(w.cap) : "");
                    }}
                  >
                    {w.cap != null ? "Change it" : "Set one"}
                  </Action>
                </>
              )}
            </Line>
          );
        })}

        <Line
          label="Warn me before that"
          htmlFor={pctDraft == null ? undefined : "budget-alert-pct"}
          // A default nobody set is our choice, not their policy, so it says so
          // and it is theirs to change.
          sub={
            pctIsDefault
              ? "Nobody set this. It is our default, and it is yours to change. Nothing is stopped at this point, a note just lands on the record."
              : "Nothing is stopped at this point. A note lands on the record so the ceiling is not the first you hear of it."
          }
        >
          {pctDraft == null ? (
            <>
              <Value>
                <Num>{alertPct}%</Num> of the ceiling
              </Value>
              <Action
                variant="quiet"
                disabled={!capWrite.allowed}
                title={capWrite.reason ?? undefined}
                onClick={() => setPctDraft(String(alertPct))}
              >
                Change it
              </Action>
            </>
          ) : (
            <form
              style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s3)" }}
              onSubmit={(e) => {
                e.preventDefault();
                const v = Math.round(Number(pctDraft));
                if (v >= 1 && v <= 100) setPctMut.mutate(v);
              }}
            >
              <Input
                id="budget-alert-pct"
                autoFocus
                value={pctDraft}
                onChange={(e) => setPctDraft(e.target.value)}
                inputMode="numeric"
                // Three digits and a percent sign, nothing more.
                style={{ width: 76 }}
              />
              <Action variant="primary" type="submit" busy={setPctMut.isPending}>
                Set it
              </Action>
              <Action variant="quiet" onClick={() => setPctDraft(null)}>
                Leave it
              </Action>
            </form>
          )}
        </Line>

        {setCapMut.error || setPctMut.error ? (
          <ReadFailedLine>
            {humanWriteError(setCapMut.error ?? setPctMut.error, CAP_WRITE_FAILED)}
          </ReadFailedLine>
        ) : null}

        {capDone.map((d, i) => (
          <Receipt
            key={`${d.at}-${i}`}
            verb={d.verb}
            consequence={d.consequence}
            time={ago(d.at)}
          />
        ))}
      </Region>

      <Region
        title="Ceilings on one thing at a time"
        sub="A surface with its own amount is held to it as well as to the account ceiling. Switched off, the row stays but stops applying."
      >
        {surfaces.length === 0 ? (
          <NothingYet
            action={
              adding ? undefined : (
                <Action
                  variant="quiet"
                  disabled={!capWrite.allowed}
                  title={capWrite.reason ?? undefined}
                  onClick={() => setAdding(true)}
                >
                  Cap one
                </Action>
              )
            }
          >
            Nothing is capped on its own. Every call is held only to the account ceiling above.
          </NothingYet>
        ) : (
          surfaces.map((row) => {
            const dCap = row.daily_usd_cap == null ? null : Number(row.daily_usd_cap);
            const mCap = row.monthly_usd_cap == null ? null : Number(row.monthly_usd_cap);
            const dBurn = burnIn(row.daily_usd_used, row.day_window, today);
            const mBurn = burnIn(row.monthly_usd_used, row.month_window, thisMonth);
            return (
              <Line
                key={row.surface}
                label={row.surface}
                sub={
                  row.enabled ? (
                    <>
                      Today <Num>{fmtUsd(dBurn)}</Num>
                      {dCap != null ? (
                        <>
                          {" "}
                          of <Num>{fmtUsd(dCap)}</Num>
                        </>
                      ) : (
                        ", no daily amount"
                      )}
                      . This month <Num>{fmtUsd(mBurn)}</Num>
                      {mCap != null ? (
                        <>
                          {" "}
                          of <Num>{fmtUsd(mCap)}</Num>
                        </>
                      ) : (
                        ", no monthly amount"
                      )}
                      .
                    </>
                  ) : (
                    "Switched off. Nothing here is stopped by this row, whatever it says."
                  )
                }
              >
                <Action
                  variant="quiet"
                  disabled={removeSurfaceMut.isPending || !capWrite.allowed}
                  title={capWrite.reason ?? undefined}
                  onClick={() => void askThenRemoveSurface(row.surface)}
                >
                  Remove
                </Action>
                <Toggle
                  checked={row.enabled}
                  disabled={toggleSurfaceMut.isPending || !capWrite.allowed}
                  label={`The ${row.surface} ceiling is in force`}
                  onChange={() => toggleSurfaceMut.mutate(row)}
                />
              </Line>
            );
          })
        )}

        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSurfaceMut.mutate();
            }}
          >
            <Field label="Which one" htmlFor="new-surface">
              <Picker
                id="new-surface"
                value={newSurface.surface}
                onChange={(e) => setNewSurface({ ...newSurface, surface: e.target.value })}
              >
                {SURFACES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Picker>
            </Field>
            <Field label="In a day" htmlFor="new-surface-daily">
              <Input
                id="new-surface-daily"
                value={newSurface.daily}
                onChange={(e) => setNewSurface({ ...newSurface, daily: e.target.value })}
                placeholder="Leave it empty for no daily amount"
                inputMode="decimal"
              />
            </Field>
            <Field label="In a month" htmlFor="new-surface-monthly">
              <Input
                id="new-surface-monthly"
                value={newSurface.monthly}
                onChange={(e) => setNewSurface({ ...newSurface, monthly: e.target.value })}
                placeholder="Leave it empty for no monthly amount"
                inputMode="decimal"
              />
            </Field>
            <Actions>
              <Action
                variant="primary"
                type="submit"
                disabled={addSurfaceMut.isPending || !capWrite.allowed}
                title={capWrite.reason ?? undefined}
              >
                Cap it
              </Action>
              <Action variant="quiet" onClick={() => setAdding(false)}>
                Leave it
              </Action>
            </Actions>
          </form>
        ) : surfaces.length > 0 ? (
          <Actions>
            <Action
              variant="quiet"
              disabled={!capWrite.allowed}
              title={capWrite.reason ?? undefined}
              onClick={() => setAdding(true)}
            >
              Cap another
            </Action>
          </Actions>
        ) : null}

        {addSurfaceMut.error || toggleSurfaceMut.error || removeSurfaceMut.error ? (
          <ReadFailedLine>
            {humanWriteError(
              addSurfaceMut.error ?? toggleSurfaceMut.error ?? removeSurfaceMut.error,
              CAP_WRITE_FAILED,
            )}
          </ReadFailedLine>
        ) : null}

        {surfaceDone.map((d, i) => (
          <Receipt
            key={`${d.at}-${i}`}
            verb={d.verb}
            consequence={d.consequence}
            time={ago(d.at)}
          />
        ))}
      </Region>

      {!controlsOnly ? (
        <Region
          title="What the ceilings have said"
          sub="Written when a window crossed the warning point. Acknowledging one clears it from here and changes nothing about the ceiling."
        >
          {alerts.length === 0 ? (
            <NothingYet>
              Nothing yet. The first note lands the moment a window crosses <Num>{alertPct}%</Num>{" "}
              of its ceiling.
            </NothingYet>
          ) : (
            alerts.map((a) => (
              <Row
                key={a.id}
                lead={
                  <>
                    {a.scope === "global"
                      ? "Account spend"
                      : `Spend on ${a.surface ?? "a surface"}`}{" "}
                    reached <Num>{Number(a.pct).toFixed(0)}%</Num> of the{" "}
                    {a.window_kind === "month" ? "monthly" : "daily"} ceiling
                  </>
                }
                sub={
                  <>
                    {a.kind === "block" ? (
                      <>
                        <Value tone="fail">Refused</Value>{" "}
                      </>
                    ) : null}
                    <Num>{fmtUsd(a.usd_used)}</Num> of <Num>{fmtUsd(a.usd_cap)}</Num>
                  </>
                }
                time={ago(a.created_at)}
                tight
                action={
                  a.acknowledged ? (
                    <Value>Acknowledged</Value>
                  ) : (
                    <Action
                      variant="quiet"
                      disabled={ackMut.isPending && ackMut.variables === a.id}
                      onClick={() => ackMut.mutate(a.id)}
                    >
                      Acknowledge
                    </Action>
                  )
                }
              />
            ))
          )}
        </Region>
      ) : null}
    </>
  );
}
