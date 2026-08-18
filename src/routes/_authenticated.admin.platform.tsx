/**
 * ADMIN / PLATFORM. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The operator who needs to change something for EVERYONE at once: turn a
 *    feature on, put a notice in front of every user, or find out who changed
 *    what and when. One switch, then out.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Setting a boundary that applies to the whole platform, and being able to
 *    prove afterwards who set it. The switch and the ledger belong together:
 *    without the ledger a platform-wide switch is an unattributable act, and the
 *    governance canon pays for autonomy with evidence.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    KEEP  the feature flags, the system banner, the audit log and the deploy
 *          trigger. Each is a real server function and each is the only way to
 *          do its job.
 *    KEEP  the memory-expiry toggle, promoted from its own card to one line
 *          beside the flags, because it is the same KIND of thing: a switch that
 *          applies to everyone. The governance canon is explicit that a boundary
 *          is a sentence with a control at the end of it, not a panel.
 *    ADD   a confirmation on the deploy. It was one unguarded click that ships to
 *          production, on a page otherwise full of reversible toggles, and the
 *          governance canon names "anything irreversible from inside the product,
 *          a production deploy" as one of the four floors no boundary may lower.
 *          It is the only Gate on this surface for that reason.
 *    ADD   the audit payload, on click. It was rendered as raw JSON in a fifth
 *          table column on every row at 10px, which is unreadable as chrome and
 *          is the actual evidence. It now opens under the row it belongs to.
 *    KILL  the hosting proof-of-concept panel entirely. It described itself as
 *          "Not user-facing", it deployed a "minimal static shell" to Deno Deploy
 *          from an abandoned lane, and the master-inventory verdict already said
 *          remove or gate it. Gating it was the interim; it also meant two extra
 *          queries ran on every Platform load to decide whether to render nothing.
 *          This pass removes it.
 *    KILL  the page's lead paragraph, which listed the four sections directly
 *          beneath it. The same defect the engine-room pass removed.
 *    KILL  two `overflow-x: auto` tables (five columns each) and the six bordered
 *          cards holding them (one bordered container per region, ban 5).
 *    KILL  the local cardStyle / sectionTitleStyle / bodyTextStyle / codeStyle /
 *          input / th / td style helpers. Seven private copies of a system that
 *          now exists.
 *    KILL  the "Enabled / on / off" text label beside every flag. A switch that
 *          is on already says so, and the word beside it was a second reading of
 *          the same fact (ban 10).
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    The audit payload, which opens in place under its own row. Nothing else is
 *    hidden, because everything else here is a boundary, and a boundary you
 *    cannot see is a boundary you did not set.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The moment is the notice block's title, which says in words that something
 *    is on every user's screen right now. A stale "we are down" banner nobody
 *    remembers publishing is a classic operator failure, and this page now says
 *    it before you have to look.
 *    The confusion this surface must refuse: a failed read presented as an empty
 *    list. "No flags yet" and "we could not read the flags" lead to opposite
 *    actions, so each read carries its own Failed state with a retry, and the
 *    free-text JSON field is still validated before it can reach the server.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    In the ledger, as the actor on every line, and nowhere else. Every audit row
 *    names WHO acted, which is the presence doctrine's first requirement: an
 *    unattributed row is a surface pretending the work did itself. No AgentMark
 *    is drawn, because every actor this ledger records is a human admin: the
 *    admin RPCs are gated to `has_role('admin')` and stamp the calling user, so a
 *    mark here would attribute a human's act to an agent. This surface governs
 *    what agents are ALLOWED to do, which is why it is a page of switches rather
 *    than a page of work.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Row, Line, Who } from "@/components/meridian/rows";
import { Actions } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { triggerDeploy, type DeployResult } from "@/lib/build.functions";
import {
  adminListFlags,
  adminUpsertFlag,
  adminDeleteFlag,
  getActiveBanner,
  adminSetBanner,
  adminClearBanner,
  adminListAuditLog,
  type FeatureFlag,
  type SystemBanner,
  type AuditRow,
} from "@/lib/admin-platform.functions";
import { getMemoryExpiryEnabled, adminSetMemoryExpiryEnabled } from "@/lib/pricing.functions";
import { inBandError } from "@/components/admin/admin-ui";
import { Block, Button, Checkbox, Empty, Failed, Field, Gate, Input, Loading, Pre, Select, Switch, Value } from "@/components/shell/primitives";

export const Route = createFileRoute("/_authenticated/admin/platform")({
  component: AdminPlatform,
});

function AdminPlatform() {
  return (
    <>
      <SwitchesBlock />
      <NoticeBlock />
      <AuditBlock />
      <DeployGate />
    </>
  );
}

/* ================================================================== *
 * What is turned on for everyone
 * ================================================================== */

function SwitchesBlock() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  const fList = useServerFn(adminListFlags);
  const fUpsert = useServerFn(adminUpsertFlag);
  const fDelete = useServerFn(adminDeleteFlag);
  const fGetExpiry = useServerFn(getMemoryExpiryEnabled);
  const fSetExpiry = useServerFn(adminSetMemoryExpiryEnabled);

  const list = useQuery({ queryKey: ["admin-flags"], queryFn: () => fList() });
  const expiry = useQuery({ queryKey: ["admin-memory-expiry"], queryFn: () => fGetExpiry() });

  const listError = list.isError
    ? list.error instanceof Error
      ? list.error.message
      : "Request failed."
    : inBandError(list.data);
  const flags: FeatureFlag[] = Array.isArray(list.data) ? (list.data as FeatureFlag[]) : [];

  const expiryError = expiry.isError
    ? expiry.error instanceof Error
      ? expiry.error.message
      : "Request failed."
    : inBandError(expiry.data);
  const expiryOn =
    expiry.data && !("error" in expiry.data)
      ? (expiry.data as { enabled: boolean }).enabled
      : false;

  const [key, setKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [payload, setPayload] = useState("{}");

  const upsert = useMutation({
    mutationFn: (vars: { key: string; enabled: boolean; payloadJson: string }) =>
      fUpsert({ data: vars }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Saved. It applies to everyone from now.");
      setKey("");
      setPayload("{}");
      setEnabled(false);
      qc.invalidateQueries({ queryKey: ["admin-flags"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. The switch did not move."),
  });

  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Flag deleted.");
      qc.invalidateQueries({ queryKey: ["admin-flags"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Delete failed. The flag is still set."),
  });

  const toggleExpiry = useMutation({
    mutationFn: (next: boolean) => fSetExpiry({ data: { enabled: next } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error((r as { error: string }).error);
      toast.success(
        (r as { enabled: boolean }).enabled
          ? "New free-tier memories will expire after 14 days."
          : "Free-tier memories no longer expire.",
      );
      qc.invalidateQueries({ queryKey: ["admin-memory-expiry"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. The setting did not change."),
  });

  /** The payload field is free text. Bad JSON is caught here rather than after
   *  a round trip, because the server rejects it with a message a person did
   *  not write. */
  function saveFlag(vars: { key: string; enabled: boolean; payloadJson: string }) {
    try {
      JSON.parse(vars.payloadJson || "{}");
    } catch {
      toast.error('Details must be valid JSON, for example {"rolloutPct":10}.');
      return;
    }
    upsert.mutate(vars);
  }

  async function onExpiryToggle(next: boolean) {
    if (next) {
      const ok = await confirm({
        title: "Expire free-tier memories after 14 days?",
        body: "Memories the machine writes for free-tier users from now on start expiring 14 days later, and expired ones are cleaned up nightly. Memories that already exist are untouched. Once users rely on this, turning it back off does not bring anything back.",
        confirmLabel: "Turn it on",
        destructive: true,
      });
      if (!ok) return;
    }
    toggleExpiry.mutate(next);
  }

  const on = flags.filter((f) => f.enabled).length;
  const title = listError
    ? "The switches did not load"
    : list.isLoading
      ? "Reading what is turned on"
      : flags.length === 0
        ? "No feature flags are set"
        : `${on} of ${flags.length} feature flag${flags.length === 1 ? " is" : "s are"} on`;

  return (
    <Block
      title={title}
      sub="The first line is a built-in boundary. The rest are feature flags added by key, and each one goes live for every user the moment it moves."
    >
      {expiryError ? (
        <Failed onRetry={() => void expiry.refetch()}>
          Could not read whether free-tier memories expire, so this switch is not safe to move.{" "}
          {expiryError}
        </Failed>
      ) : (
        <Line
          label="Free-tier memories expire after 14 days"
          sub={
            expiryOn
              ? "On. New memories for free-tier users expire 14 days after they are written; existing ones are kept."
              : "Off. Nothing the machine learns for a free-tier user ever fades."
          }
        >
          <Switch
            checked={expiryOn}
            disabled={expiry.isLoading || toggleExpiry.isPending}
            label="Free-tier memories expire after 14 days"
            onChange={(next) => void onExpiryToggle(next)}
          />
        </Line>
      )}

      {list.isLoading ? (
        <Loading>Reading the feature flags.</Loading>
      ) : listError ? (
        <Failed onRetry={() => void list.refetch()}>
          The feature flags did not load, so this is not the full set. {listError}
        </Failed>
      ) : flags.length === 0 ? (
        <Empty>
          No feature flags are set. Add one below to turn something on for everyone without shipping
          a new build.
        </Empty>
      ) : (
        flags.map((f) => (
          <Line
            key={f.id}
            label={<span style={{ fontFamily: "var(--sp-font-mono)" }}>{f.key}</span>}
            sub={
              f.payload && f.payload !== "{}"
                ? `${f.payload} · last changed ${f.updated_at.slice(0, 10)}`
                : `No details set · last changed ${f.updated_at.slice(0, 10)}`
            }
          >
            <Switch
              checked={f.enabled}
              disabled={upsert.isPending}
              label={f.key}
              onChange={(next) => saveFlag({ key: f.key, enabled: next, payloadJson: f.payload })}
            />
            <Button
              variant="ghost"
              disabled={del.isPending}
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete ${f.key}?`,
                  body: "Anything reading this flag falls back to its built-in default immediately.",
                  confirmLabel: "Delete",
                  destructive: true,
                });
                if (ok) del.mutate(f.id);
              }}
            >
              Delete
            </Button>
          </Line>
        ))
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) saveFlag({ key: key.trim(), enabled, payloadJson: payload });
        }}
      >
        <Field label="New flag key" htmlFor="flag-key">
          <Input
            id="flag-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="experimental.x"
            style={{ maxWidth: 320 }}
          />
        </Field>
        <Field label="Details, as JSON" htmlFor="flag-payload">
          <Input
            id="flag-payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{"rolloutPct":10}'
            style={{ maxWidth: 320 }}
          />
        </Field>
        <Line label="Turn it on as soon as it is saved" htmlFor="flag-enabled">
          <Checkbox
            id="flag-enabled"
            checked={enabled}
            label="Turn it on as soon as it is saved"
            onChange={setEnabled}
          />
        </Line>
        <Actions>
          <Button type="submit" disabled={!key.trim() || upsert.isPending}>
            {upsert.isPending ? "Saving" : "Save flag"}
          </Button>
        </Actions>
      </form>
    </Block>
  );
}

/* ================================================================== *
 * The notice every user sees
 * ================================================================== */

const LEVEL_WORD: Record<SystemBanner["level"], string> = {
  info: "Information",
  warn: "Warning",
  alert: "Alert",
};

function NoticeBlock() {
  const qc = useQueryClient();
  const fGet = useServerFn(getActiveBanner);
  const fSet = useServerFn(adminSetBanner);
  const fClear = useServerFn(adminClearBanner);

  const cur = useQuery({ queryKey: ["admin-banner"], queryFn: () => fGet() });
  const banner = (cur.data as SystemBanner | null) ?? null;

  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<SystemBanner["level"]>("info");
  const [days, setDays] = useState<number | "">(1);

  const publish = useMutation({
    mutationFn: () => {
      const expiresAt =
        days && Number(days) > 0
          ? new Date(Date.now() + Number(days) * 86400_000).toISOString()
          : null;
      return fSet({ data: { message, level, active: true, expiresAt } });
    },
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Everyone sees it now.");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["admin-banner"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Publishing failed. No notice went out."),
  });

  const clear = useMutation({
    mutationFn: () => fClear(),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("The notice is down.");
      qc.invalidateQueries({ queryKey: ["admin-banner"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Clearing failed. The notice is still up."),
  });

  const title = cur.isError
    ? "Could not tell whether a notice is showing"
    : cur.isLoading
      ? "Checking whether a notice is showing"
      : banner
        ? "A notice is showing to everyone"
        : "No notice is showing";

  return (
    <Block
      title={title}
      sub="A notice sits above every screen for every signed-in person until it expires or you take it down."
    >
      {cur.isLoading ? (
        <Loading>Reading the current notice.</Loading>
      ) : cur.isError ? (
        <Failed onRetry={() => void cur.refetch()}>
          The current notice did not load, so publishing now could replace one you cannot see.{" "}
          {cur.error instanceof Error ? cur.error.message : "The read failed."}
        </Failed>
      ) : banner ? (
        <Line
          label={banner.message}
          sub={
            banner.expires_at
              ? `${LEVEL_WORD[banner.level]} · comes down ${banner.expires_at.slice(0, 16).replace("T", " ")}`
              : `${LEVEL_WORD[banner.level]} · stays up until you take it down`
          }
        >
          <Button variant="ghost" disabled={clear.isPending} onClick={() => clear.mutate()}>
            {clear.isPending ? "Taking it down" : "Take it down"}
          </Button>
        </Line>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim()) publish.mutate();
        }}
      >
        <Field
          label={banner ? "Replace it with" : "What everyone should read"}
          htmlFor="notice-msg"
        >
          <Input
            id="notice-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scheduled maintenance on Saturday from 09:00 UTC."
            style={{ width: "100%", maxWidth: 480 }}
          />
        </Field>
        <Line label="How loudly it reads" htmlFor="notice-level">
          <Select
            id="notice-level"
            value={level}
            onChange={(e) => setLevel(e.target.value as SystemBanner["level"])}
          >
            <option value="info">Information</option>
            <option value="warn">Warning</option>
            <option value="alert">Alert</option>
          </Select>
        </Line>
        <Line
          label="Take it down by itself"
          sub="Days from now. Leave it empty and it stays up until you take it down."
          htmlFor="notice-days"
        >
          <Input
            id="notice-days"
            type="number"
            min={0}
            value={days}
            onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 90 }}
          />
        </Line>
        <Actions>
          <Button type="submit" disabled={!message.trim() || publish.isPending}>
            {publish.isPending
              ? "Publishing"
              : banner
                ? "Replace the notice"
                : "Show it to everyone"}
          </Button>
        </Actions>
      </form>
    </Block>
  );
}

/* ================================================================== *
 * Who changed what
 * ================================================================== */

const TARGET_KINDS = [
  { value: "", label: "Everything" },
  { value: "user", label: "People" },
  { value: "workspace", label: "Workspaces" },
  { value: "voucher", label: "Vouchers" },
  { value: "invitation", label: "Invitations" },
  { value: "flag", label: "Feature flags" },
  { value: "banner", label: "Notices" },
  { value: "subscription", label: "Subscriptions" },
  { value: "domain", label: "Domains" },
  { value: "signup_approval", label: "Signup approvals" },
];

/** The payload as a person can read it. Falls back to the raw string rather
 *  than hiding evidence we failed to parse. */
function readable(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

function AuditBlock() {
  const fList = useServerFn(adminListAuditLog);
  const [targetKind, setTargetKind] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-audit", targetKind],
    queryFn: () =>
      fList({ data: { targetKind: targetKind || null, targetId: null, limit: 200, offset: 0 } }),
  });
  const listError = list.isError
    ? list.error instanceof Error
      ? list.error.message
      : "Request failed."
    : inBandError(list.data);
  const rows: AuditRow[] = Array.isArray(list.data) ? (list.data as AuditRow[]) : [];

  const title = listError
    ? "The record did not load"
    : list.isLoading
      ? "Reading the record"
      : rows.length === 0
        ? "Nothing has been changed here yet"
        : `${rows.length} change${rows.length === 1 ? "" : "s"} on the record`;

  return (
    <Block
      title={title}
      sub="Every admin action, newest first, with who did it. Open a line to read exactly what was sent."
    >
      <Line label="Show" htmlFor="audit-kind">
        <Select
          id="audit-kind"
          value={targetKind}
          onChange={(e) => {
            setTargetKind(e.target.value);
            setOpen(null);
          }}
        >
          {TARGET_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
      </Line>

      {list.isLoading ? (
        <Loading>Reading the record.</Loading>
      ) : listError ? (
        <Failed onRetry={() => void list.refetch()}>
          The record did not load, so this is not the full history. {listError}
        </Failed>
      ) : rows.length === 0 ? (
        <Empty>
          No admin change matches this filter. Every switch, role and billing change lands here as
          it happens.
        </Empty>
      ) : (
        rows.map((r) => (
          <div key={r.id}>
            <Row
              tight
              lead={
                <>
                  <Who>{r.actor_email ?? r.actor_user_id?.slice(0, 8) ?? "Unknown"}</Who> ·{" "}
                  {r.action.replaceAll("_", " ")}
                </>
              }
              sub={
                <>
                  {r.target_kind}
                  {r.target_id ? ` · ${r.target_id.slice(0, 8)}` : ""}
                </>
              }
              time={r.created_at.slice(0, 16).replace("T", " ")}
              onClick={() => setOpen(open === r.id ? null : r.id)}
            />
            {open === r.id ? <Pre>{readable(r.payload)}</Pre> : null}
          </div>
        ))
      )}
    </Block>
  );
}

/* ================================================================== *
 * Deploy: the one irreversible thing on this page
 * ================================================================== */

function DeployGate() {
  const confirm = useConfirm();
  const fDeploy = useServerFn(triggerDeploy);
  const [reason, setReason] = useState("");
  const [last, setLast] = useState<string | null>(null);

  const deploy = useMutation({
    mutationFn: () =>
      fDeploy({ data: { reason: reason.trim() || "Manual deploy from the admin console" } }),
    onSuccess: (result: DeployResult) => {
      if (result.ok) {
        setLast(
          `Sent to ${result.provider} at ${new Date(result.triggered_at).toLocaleTimeString()}.`,
        );
        setReason("");
        toast.success("The build is running at the hosting provider.");
      } else if (result.reason === "no_hook_configured") {
        toast.error("No deploy hook is connected. An engineer sets one in the hosting settings.");
      } else {
        toast.error(result.message);
      }
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "The request failed. Nothing shipped."),
  });

  async function onDeploy() {
    const ok = await confirm({
      title: "Ship the current build to production?",
      body: "This calls the hosting provider's deploy hook straight away. Everyone is on the new build as soon as the provider finishes, and there is no undo from here: rolling back is done at the provider.",
      confirmLabel: "Ship it",
      destructive: true,
    });
    if (ok) deploy.mutate();
  }

  return (
    <Gate
      question="Ship the current build to production?"
      lines={[
        "Calls the hosting provider's deploy hook, which rebuilds and publishes the app.",
        "Everyone is on the new build as soon as the provider finishes.",
        "There is no undo from here. Rolling back is done at the hosting provider.",
        "It only works once an engineer has connected a deploy hook in the hosting settings.",
      ]}
    >
      {/* A definite width, not 100%: this Field is a flex item inside the gate's
          action row, where a percentage has nothing to resolve against. */}
      <Field label="Why, for the build log" htmlFor="deploy-reason">
        <Input
          id="deploy-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Hotfix for the approvals queue"
          style={{ width: 340 }}
        />
      </Field>
      <Actions>
        <Button variant="primary" disabled={deploy.isPending} onClick={() => void onDeploy()}>
          {deploy.isPending ? "Sending" : "Ship it"}
        </Button>
        {last ? <Value>{last}</Value> : null}
      </Actions>
    </Gate>
  );
}
