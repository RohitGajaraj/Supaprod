/**
 * ADMIN / PRICING. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the six answers. The
 * parent /admin route draws the Surface, the h1 and the tab strip, so this
 * file renders bare content and never a second head.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    Whoever sets what Supaprod costs, here to change ONE number, usually
 *    because a bundle is priced wrong or a new one has to exist before a
 *    campaign starts. They are not auditing the catalog. They have a number in
 *    their head and they want it live.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE.
 *    Changing what a customer is charged, without a deploy. That is the whole
 *    of it, and it is the reason the surface can be honest about itself: only
 *    the top-up shelf is actually wired that way today, so only the top-up
 *    shelf gets to claim it. See WHAT IS ACTUALLY LIVE below, which decided
 *    most of the verdicts.
 *
 * 3. KEEP / MOVE / KILL, every element that was on the page.
 *    KEEP the top-up editor, and PROMOTE it to the top. It is the only thing
 *      on this page a customer ever sees: credits and price_cents render the
 *      shelf in Settings / Credits, and active decides whether a bundle can be
 *      bought at all.
 *    KEEP the subscription ladder per tier, with its claim corrected. Its
 *      credits and active columns are read by the launch readiness check
 *      (payments/go-live.functions.ts), which refuses to pass if a bundle's
 *      credit volume cannot round-trip through its lookup key. That is a real
 *      job, so the section stays, and it now says which job it is.
 *    KEEP every validation, every confirmation and every query key.
 *    KILL all three Stripe price id fields. They are the one genuinely
 *      dangerous thing that was on this page. NOTHING in this repo reads
 *      stripe_price_id_monthly, stripe_price_id_yearly or stripe_price_id:
 *      the subscription checkout builds its key with lookupKeyFor
 *      (PlanPicker.tsx:450) and the top-up checkout derives topup_Nk, so a
 *      live price id pasted here would look configured, change nothing, and be
 *      discovered on the day it matters. The page's own paragraph told people
 *      to leave them blank "to use the built-in naming pattern"; the naming
 *      pattern is the only pattern. Whatever is already stored is passed
 *      through untouched on every save, so no existing value is destroyed by
 *      the field going away.
 *    KILL the horizontally scrolling seven-column editor grid at minWidth 680.
 *      Six live inputs per row, four rows per tier, four tiers: forty-eight
 *      text boxes on arrival, on a money surface, inside a sideways scroll.
 *      Sideways scrolling was named a pain point twice. The ladder is a list
 *      of prices now, and the editor belongs to the ONE bundle you clicked.
 *    KILL the permanently blank "add" row at the bottom of every section. Five
 *      empty forms nobody asked for, all reading as unsaved work. Adding is a
 *      deliberate act with a door of its own now.
 *    KILL the hardcoded TIER_LABELS map. pricing_plans.display_name is the
 *      stored name and this map could drift from it silently. The catalog read
 *      already returns plans and the page threw them away.
 *    KILL the hardcoded ["pro","max","team"] tier list, which made any bundle
 *      stored against a fourth tier invisible here and uneditable while still
 *      live in the catalog. The known three lead, and any other tier that
 *      actually has rows gets its own section.
 *    KILL the local inputStyle(), cardStyle(), sectionTitleStyle() and
 *      focusRingClass. Every one is a primitive now, and real inputs take the
 *      app-wide focus ring without being told.
 *    KILL the shimmer skeleton. A read in flight is its own fact and says so
 *      in words.
 *    KILL every success toast. See THE COMMIT below.
 *    MOVED IN, from /admin/people: Vouchers. A voucher is a discount on the
 *      ladder this page owns, not a fact about a person, and it only sat under
 *      People because it shipped in the same sprint as Invitations. It is
 *      REPORTED AS UNPORTED: VouchersPanel is outside this lane's file set, so
 *      it arrives carrying its old chrome and its own slide-over. The verdict
 *      is recorded here; the port is somebody's next job.
 *    NOT DRAWN, deliberately: a Recommended toggle. pricing_bundles.recommended
 *      is written by the RPC and read by nothing. PlanTable picks its
 *      highlighted card with nextTierFor(currentTier). A control labelled
 *      Recommended would promise a highlight the picker does not honour, which
 *      is the overclaim R12 bans. The stored flag is passed through on save.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    A ladder row is the credit volume and its price, which is the whole of
 *    what you scan for. Every input belongs to the one bundle in focus, and
 *    only one editor is open at a time anywhere on the page, because you
 *    change one price at a time and two open forms is two things you might
 *    have half-saved.
 *
 * 5. DELIGHT, AND CONFUSION.
 *    The moment is a page that tells you which of its own numbers a customer
 *    will actually see. Confusion is what was here before: five identical
 *    editor blocks, four of them inert, and a sentence promising that all of
 *    it goes live in Settings. Also not drawn: an error rendered as an empty
 *    catalog, which on a money surface invites an admin to "fix" the blank by
 *    recreating bundles that already exist.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Nowhere, and it should not. A price is a commercial decision with no
 *    oracle, which the governance canon names as one of the four floors no
 *    boundary may lower: genuine judgment with no oracle stays with a human.
 *    No agent writes pricing_bundles, no agent may, and an AgentMark here
 *    would claim otherwise. The honest crew fact is stated in words where it
 *    is true: credits are what the crew spends, so a bundle is a budget for
 *    the crew, and the top-up section says exactly that.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Saving a price used to fire
 * toast.success("Saved.") with no mention of what was saved, so the record of a
 * change to what customers pay lasted four seconds and named nothing. Every
 * write leaves a receipt carrying the credit volume and the price it now
 * carries, and a failed write leaves a failed receipt rather than silence. No
 * handoff arrow anywhere: nothing picks up a price change.
 *
 * WHAT IS ACTUALLY LIVE, traced rather than assumed, and the reason this page
 * reads the way it does:
 *   pricing_topup_bundles.credits      the shelf, the buy key, the checkout
 *   pricing_topup_bundles.price_cents  the price a customer reads and pays
 *   pricing_topup_bundles.active       whether it can be bought at all
 *   pricing_bundles.credits, .active   the launch readiness check
 *   everything else on both tables      written here, read by nothing in src/
 * The subscription prices a customer sees come from planPresentation and
 * priceForCredits in entitlements.ts, which are code, not catalog. That is a
 * real gap and it is reported, not papered over.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";

import { useConfirm } from "@/hooks/use-confirm";
import { VouchersPanel } from "@/components/admin/VouchersPanel";
import { Actions, Block, Button, Checkbox, Empty, Failed, Field, Input, Line, Loading, Receipt, Row } from "@/components/shell/primitives";
import {
  getPricingCatalog,
  adminUpsertBundle,
  adminDeleteBundle,
  adminUpsertTopup,
  adminDeleteTopup,
  type PricingBundle,
  type TopupBundle,
} from "@/lib/pricing.functions";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: AdminPricing,
});

/** The three tiers that have always carried bundles. Any other tier with rows
 *  gets a section too, so a bundle can never be live and invisible here. */
const KNOWN_TIERS = ["pro", "max", "team"];

type Confirm = ReturnType<typeof useConfirm>;
type Commit = (verb: string, consequence: string, failed?: boolean) => void;
type Settled = { id: string; verb: string; consequence: string; failed?: boolean; at: string };

/** Which single editor is open, anywhere on the page. One at a time on
 *  purpose: you change one price at a time, and two open forms is two things
 *  you might have half saved. */
type EditKey = string;
const bundleKey = (id: string) => `bundle:${id}`;
const newBundleKey = (tier: string) => `bundle:new:${tier}`;
const topupKey = (id: string) => `topup:${id}`;
const NEW_TOPUP = "topup:new";

const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ================================================================== *
 * Page
 * ================================================================== */

function AdminPricing() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fGetCatalog = useServerFn(getPricingCatalog);
  const catalog = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fGetCatalog() });

  const [editing, setEditing] = useState<EditKey | null>(null);
  const [settled, setSettled] = useState<Settled[]>([]);
  const commit: Commit = (verb, consequence, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed, at: nowStamp() },
      ...prev,
    ]);

  const onSaved = () => {
    setEditing(null);
    void qc.invalidateQueries({ queryKey: ["pricing-catalog"] });
  };

  const bundlesByTier = useMemo(() => {
    const map: Record<string, PricingBundle[]> = {};
    for (const b of catalog.data?.bundles ?? []) (map[b.tier] ||= []).push(b);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.credits - b.credits);
    return map;
  }, [catalog.data]);

  const planName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of catalog.data?.plans ?? []) m.set(p.tier, p.display_name);
    return m;
  }, [catalog.data]);

  // A money surface must never render a failed read as an empty catalog: an
  // admin could "fix" the blank by recreating bundles that already exist.
  if (catalog.isLoading) return <Loading>Reading the catalog.</Loading>;
  if (catalog.isError) {
    return (
      <Failed onRetry={() => void catalog.refetch()}>
        The catalog did not load, so this page is not a picture of what anything costs.{" "}
        {(catalog.error as Error)?.message ?? "The read failed."}
      </Failed>
    );
  }

  const topups = [...(catalog.data?.topups ?? [])].sort((a, b) => a.credits - b.credits);
  const extraTiers = Object.keys(bundlesByTier)
    .filter((t) => !KNOWN_TIERS.includes(t))
    .sort();

  return (
    <>
      <TopupSection
        rows={topups}
        editing={editing}
        setEditing={setEditing}
        onSaved={onSaved}
        commit={commit}
        confirm={confirm}
      />

      {[...KNOWN_TIERS, ...extraTiers].map((tier) => (
        <TierSection
          key={tier}
          tier={tier}
          title={planName.get(tier) ?? tier}
          known={KNOWN_TIERS.includes(tier)}
          rows={bundlesByTier[tier] ?? []}
          editing={editing}
          setEditing={setEditing}
          onSaved={onSaved}
          commit={commit}
          confirm={confirm}
        />
      ))}

      <Block
        title="Vouchers"
        sub="Codes that hand out credits. Moved here from People: a voucher is a discount on the ladder above, not a fact about a person. The panel below still carries its old chrome and is queued for the same treatment as the rest of this page."
      >
        <VouchersPanel />
      </Block>

      {settled.length > 0 ? (
        <Block title="What you changed">
          {settled.map((s) => (
            <Receipt
              key={s.id}
              verb={s.verb}
              consequence={s.consequence}
              failed={s.failed}
              time={s.at}
            />
          ))}
        </Block>
      ) : null}
    </>
  );
}

/* ================================================================== *
 * Top-ups: the only prices on this page a customer reads
 * ================================================================== */

function TopupSection({
  rows,
  editing,
  setEditing,
  onSaved,
  commit,
  confirm,
}: {
  rows: TopupBundle[];
  editing: EditKey | null;
  setEditing: (k: EditKey | null) => void;
  onSaved: () => void;
  commit: Commit;
  confirm: Confirm;
}) {
  const fUpsert = useServerFn(adminUpsertTopup);
  const fDelete = useServerFn(adminDeleteTopup);

  const upsert = useMutation({
    mutationFn: (input: {
      id?: string | null;
      credits: number;
      price_cents: number;
      stripe_price_id?: string | null;
      active?: boolean;
      sort_order?: number;
    }) => fUpsert({ data: input }),
    onSuccess: (res, input) => {
      if ("error" in res) return commit("You tried to save a top-up", res.error, true);
      commit(
        input.id ? "You changed a top-up" : "You added a top-up",
        `${input.credits.toLocaleString()} credits at ${dollars(input.price_cents)}${input.active === false ? ", switched off so nobody can buy it" : ", on sale now"}`,
      );
      onSaved();
    },
    onError: (e) =>
      commit(
        "You tried to save a top-up",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const del = useMutation({
    mutationFn: (vars: { id: string; credits: number }) => fDelete({ data: { id: vars.id } }),
    onSuccess: (res, vars) => {
      if ("error" in res) return commit("You tried to remove a top-up", res.error, true);
      commit(
        "You removed a top-up",
        `${vars.credits.toLocaleString()} credits is off the shelf and cannot be bought.`,
      );
      onSaved();
    },
    onError: (e) =>
      commit(
        "You tried to remove a top-up",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const busy = upsert.isPending || del.isPending;
  const adding = editing === NEW_TOPUP;
  const live = rows.filter((r) => r.active).length;

  return (
    <Block
      title="Top-ups"
      sub={`The only prices on this page a customer ever reads: these are the shelf in Settings, Credits, and the credits are what the crew spends. ${live} of ${rows.length} are on sale.`}
      more={adding ? "Close" : "Add a top-up"}
      onMore={() => setEditing(adding ? null : NEW_TOPUP)}
    >
      {rows.length === 0 && !adding ? (
        <Empty action={<Button onClick={() => setEditing(NEW_TOPUP)}>Add the first top-up</Button>}>
          Nothing is on the shelf, so nobody can buy credits at all. The Credits page in Settings is
          empty until a bundle exists here.
        </Empty>
      ) : null}

      {adding ? (
        <TopupEditor
          key={NEW_TOPUP}
          row={null}
          busy={busy}
          onSubmit={(input) => upsert.mutate(input)}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {rows.map((r) => {
        const open = editing === topupKey(r.id);
        return (
          <Fragment key={r.id}>
            <Row
              tight
              focused={open}
              lead={
                <>
                  <Num>{r.credits.toLocaleString()}</Num> credits
                </>
              }
              sub={
                r.active ? (
                  <>{dollars(r.price_cents)} · on sale</>
                ) : (
                  <>
                    {dollars(r.price_cents)} · <span className="sp-fail">switched off</span>
                  </>
                )
              }
              onClick={() => setEditing(open ? null : topupKey(r.id))}
            />
            {open ? (
              <TopupEditor
                key={topupKey(r.id)}
                row={r}
                busy={busy}
                onSubmit={(input) => upsert.mutate(input)}
                onCancel={() => setEditing(null)}
                onDelete={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: `Remove the ${r.credits.toLocaleString()} credit top-up?`,
                      body: "It stops appearing on the Credits page and cannot be bought. Purchases already made are untouched.",
                      confirmLabel: "Remove it",
                      destructive: true,
                    });
                    if (ok) del.mutate({ id: r.id, credits: r.credits });
                  })();
                }}
              />
            ) : null}
          </Fragment>
        );
      })}
    </Block>
  );
}

function TopupEditor({
  row,
  busy,
  onSubmit,
  onCancel,
  onDelete,
}: {
  row: TopupBundle | null;
  busy: boolean;
  onSubmit: (input: {
    id?: string | null;
    credits: number;
    price_cents: number;
    stripe_price_id?: string | null;
    active?: boolean;
    sort_order?: number;
  }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [credits, setCredits] = useState(row?.credits ?? 0);
  const [price, setPrice] = useState(row ? row.price_cents / 100 : 0);
  const [active, setActive] = useState(row?.active ?? true);
  const [problem, setProblem] = useState<string | null>(null);

  const idFor = (name: string) => `topup-${row?.id ?? "new"}-${name}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!Number.isFinite(credits) || credits < 1) {
          setProblem("Credits has to be a whole number of at least 1.");
          return;
        }
        if (!Number.isFinite(price) || price < 0) {
          setProblem("A price cannot be negative.");
          return;
        }
        setProblem(null);
        onSubmit({
          id: row?.id ?? null,
          credits: Math.trunc(credits),
          price_cents: Math.round(price * 100),
          // Written by nothing and read by nothing, but preserved rather than
          // wiped: the field is gone from the surface, the stored value is not.
          stripe_price_id: row?.stripe_price_id ?? null,
          active,
          sort_order: row?.sort_order ?? 99,
        });
      }}
    >
      <Field label="Credits" htmlFor={idFor("credits")}>
        <Input
          id={idFor("credits")}
          type="number"
          min={1}
          value={credits}
          onChange={(e) => {
            setCredits(Number(e.target.value));
            setProblem(null);
          }}
        />
      </Field>
      <Field label="Price in dollars" htmlFor={idFor("price")}>
        <Input
          id={idFor("price")}
          type="number"
          step="0.01"
          min={0}
          value={price}
          onChange={(e) => {
            setPrice(Number(e.target.value));
            setProblem(null);
          }}
        />
      </Field>
      <Line
        label="On sale"
        sub="Switched off, it disappears from the Credits page and the checkout refuses it."
        htmlFor={idFor("active")}
      >
        <Checkbox id={idFor("active")} label="On sale" checked={active} onChange={setActive} />
      </Line>

      {problem ? <Failed>{problem}</Failed> : null}

      <Actions
        trailing={
          onDelete ? (
            <Button variant="ghost" type="button" disabled={busy} onClick={onDelete}>
              Remove it
            </Button>
          ) : undefined
        }
      >
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Saving" : row ? "Save this top-up" : "Add this top-up"}
        </Button>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </Actions>
    </form>
  );
}

/* ================================================================== *
 * The subscription ladder, per tier
 * ================================================================== */

function TierSection({
  tier,
  title,
  known,
  rows,
  editing,
  setEditing,
  onSaved,
  commit,
  confirm,
}: {
  tier: string;
  title: string;
  known: boolean;
  rows: PricingBundle[];
  editing: EditKey | null;
  setEditing: (k: EditKey | null) => void;
  onSaved: () => void;
  commit: Commit;
  confirm: Confirm;
}) {
  const fUpsert = useServerFn(adminUpsertBundle);
  const fDelete = useServerFn(adminDeleteBundle);

  const upsert = useMutation({
    mutationFn: (input: {
      id?: string | null;
      tier: string;
      credits: number;
      monthly_cents: number;
      yearly_cents: number;
      stripe_price_id_monthly?: string | null;
      stripe_price_id_yearly?: string | null;
      recommended?: boolean;
      active?: boolean;
      sort_order?: number;
    }) => fUpsert({ data: input }),
    onSuccess: (res, input) => {
      if ("error" in res) return commit("You tried to save a bundle", res.error, true);
      commit(
        input.id ? `You changed a ${title} bundle` : `You added a ${title} bundle`,
        `${input.credits.toLocaleString()} credits, ${dollars(input.monthly_cents)} a month and ${dollars(input.yearly_cents)} a year${input.active === false ? ", switched off" : ""}`,
      );
      onSaved();
    },
    onError: (e) =>
      commit(
        "You tried to save a bundle",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const del = useMutation({
    mutationFn: (vars: { id: string; credits: number }) => fDelete({ data: { id: vars.id } }),
    onSuccess: (res, vars) => {
      if ("error" in res) return commit("You tried to remove a bundle", res.error, true);
      commit(
        `You removed a ${title} bundle`,
        `${vars.credits.toLocaleString()} credits is out of the ladder and out of the readiness check.`,
      );
      onSaved();
    },
    onError: (e) =>
      commit(
        "You tried to remove a bundle",
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const busy = upsert.isPending || del.isPending;
  const adding = editing === newBundleKey(tier);
  const live = rows.filter((r) => r.active).length;

  return (
    <Block
      title={title}
      sub={
        known
          ? `${live} of ${rows.length} switched on. The launch readiness check reads these credit volumes; the prices a customer is quoted still come from the code ladder in entitlements.ts, not from here.`
          : `${live} of ${rows.length} switched on. This tier has bundles but no section of its own in the old editor, so they were live and invisible. Check whether it should exist at all.`
      }
      more={adding ? "Close" : "Add a bundle"}
      onMore={() => setEditing(adding ? null : newBundleKey(tier))}
    >
      {rows.length === 0 && !adding ? (
        <Empty>No bundles on this tier. Nothing breaks; the ladder is simply empty here.</Empty>
      ) : null}

      {adding ? (
        <BundleEditor
          key={newBundleKey(tier)}
          tier={tier}
          row={null}
          busy={busy}
          onSubmit={(input) => upsert.mutate(input)}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {rows.map((r) => {
        const open = editing === bundleKey(r.id);
        return (
          <Fragment key={r.id}>
            <Row
              tight
              focused={open}
              lead={
                <>
                  <Num>{r.credits.toLocaleString()}</Num> credits
                </>
              }
              sub={
                r.active ? (
                  <>
                    {dollars(r.monthly_cents)} a month · {dollars(r.yearly_cents)} a year
                  </>
                ) : (
                  <>
                    {dollars(r.monthly_cents)} a month · {dollars(r.yearly_cents)} a year ·{" "}
                    <span className="sp-fail">switched off</span>
                  </>
                )
              }
              onClick={() => setEditing(open ? null : bundleKey(r.id))}
            />
            {open ? (
              <BundleEditor
                key={bundleKey(r.id)}
                tier={tier}
                row={r}
                busy={busy}
                onSubmit={(input) => upsert.mutate(input)}
                onCancel={() => setEditing(null)}
                onDelete={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: `Remove the ${r.credits.toLocaleString()} credit bundle?`,
                      body: "It leaves the ladder and the launch readiness check stops testing its key.",
                      confirmLabel: "Remove it",
                      destructive: true,
                    });
                    if (ok) del.mutate({ id: r.id, credits: r.credits });
                  })();
                }}
              />
            ) : null}
          </Fragment>
        );
      })}
    </Block>
  );
}

function BundleEditor({
  tier,
  row,
  busy,
  onSubmit,
  onCancel,
  onDelete,
}: {
  tier: string;
  row: PricingBundle | null;
  busy: boolean;
  onSubmit: (input: {
    id?: string | null;
    tier: string;
    credits: number;
    monthly_cents: number;
    yearly_cents: number;
    stripe_price_id_monthly?: string | null;
    stripe_price_id_yearly?: string | null;
    recommended?: boolean;
    active?: boolean;
    sort_order?: number;
  }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [credits, setCredits] = useState(row?.credits ?? 0);
  const [monthly, setMonthly] = useState(row ? row.monthly_cents / 100 : 0);
  const [yearly, setYearly] = useState(row ? row.yearly_cents / 100 : 0);
  const [active, setActive] = useState(row?.active ?? true);
  const [problem, setProblem] = useState<string | null>(null);

  const idFor = (name: string) => `bundle-${row?.id ?? `new-${tier}`}-${name}`;
  const clear = () => setProblem(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!Number.isFinite(credits) || credits < 1) {
          setProblem("Credits has to be a whole number of at least 1.");
          return;
        }
        if (!Number.isFinite(monthly) || monthly < 0 || !Number.isFinite(yearly) || yearly < 0) {
          setProblem("A price cannot be negative.");
          return;
        }
        setProblem(null);
        onSubmit({
          id: row?.id ?? null,
          tier,
          credits: Math.trunc(credits),
          monthly_cents: Math.round(monthly * 100),
          yearly_cents: Math.round(yearly * 100),
          // Both fields are gone from the surface because nothing reads them.
          // The stored values are preserved rather than wiped.
          stripe_price_id_monthly: row?.stripe_price_id_monthly ?? null,
          stripe_price_id_yearly: row?.stripe_price_id_yearly ?? null,
          // Not drawn: the picker highlights by nextTierFor, not by this flag.
          recommended: row?.recommended ?? false,
          active,
          sort_order: row?.sort_order ?? 99,
        });
      }}
    >
      <Field label="Credits a month" htmlFor={idFor("credits")}>
        <Input
          id={idFor("credits")}
          type="number"
          min={1}
          value={credits}
          onChange={(e) => {
            setCredits(Number(e.target.value));
            clear();
          }}
        />
      </Field>
      <Field label="Monthly price in dollars" htmlFor={idFor("monthly")}>
        <Input
          id={idFor("monthly")}
          type="number"
          step="0.01"
          min={0}
          value={monthly}
          onChange={(e) => {
            setMonthly(Number(e.target.value));
            clear();
          }}
        />
      </Field>
      <Field label="Yearly price in dollars" htmlFor={idFor("yearly")}>
        <Input
          id={idFor("yearly")}
          type="number"
          step="0.01"
          min={0}
          value={yearly}
          onChange={(e) => {
            setYearly(Number(e.target.value));
            clear();
          }}
        />
      </Field>
      <Line
        label="Switched on"
        sub="Off, the launch readiness check stops testing whether this volume can be granted."
        htmlFor={idFor("active")}
      >
        <Checkbox id={idFor("active")} label="Switched on" checked={active} onChange={setActive} />
      </Line>

      {problem ? <Failed>{problem}</Failed> : null}

      <Actions
        trailing={
          onDelete ? (
            <Button variant="ghost" type="button" disabled={busy} onClick={onDelete}>
              Remove it
            </Button>
          ) : undefined
        }
      >
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Saving" : row ? "Save this bundle" : "Add this bundle"}
        </Button>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </Actions>
    </form>
  );
}
