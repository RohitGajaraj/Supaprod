/**
 * ONE RECEIPT IN FULL: what was decided, why, what backs it, who decided, and
 * whether it still stands.
 *
 * PORTED 2026-07-29, and this file is the founder's complaint stated exactly:
 *
 *   "If something I click that opens up, let's say PRD it opens up, approval pin
 *    it opens up or something of similar sort, that also needs to be of same
 *    theme. It should not render in the legacy theme because it is of
 *    inconsistency."
 *
 * The Receipts panel that mounts this was ported. This was not, so clicking a
 * row on a ported surface slid a retired-theme sheet over it.
 *
 * IT IS NOT A SHEET ANY MORE. There is no pane, slide-over or drawer primitive
 * and that absence is deliberate (see the header of `shell/primitives.tsx`): a
 * slide-over is one step softer than the modal abuse the standard bans, and a
 * pane is a focus trap, a scroll lock, an Escape handler and an inert page
 * behind it, half of which is an accessibility regression wearing a primitive's
 * name. A receipt is a detail view with an identity of its own, so it renders
 * IN PLACE, the pattern `_authenticated.crew.tsx` and `_authenticated.admin.people.tsx`
 * both use.
 *
 * The exported name and props are unchanged on purpose: `engine-room/rooms/ReceiptsPanel.tsx`
 * mounts this and belongs to another lane tonight. `ReceiptDetail` is exported
 * beside it so that lane can hoist the detail to REPLACE the list when it gets
 * there, which is the stronger shape; today it renders under the list and the
 * surface scrolls to it, which is the same information without the overlay.
 *
 * WHAT WAS CUT, and why each was redundant rather than lost:
 *   · The three-cell stat strip (Outcome / Kind / Evidence). Outcome is what the
 *     record band directly above it says in a sentence; Kind is in the subtitle;
 *     Evidence was a count sitting on top of the list that IS the count. Label,
 *     sublabel and helper all saying one thing is hard ban 10.
 *   · The status pills and the mono-caps chrome. A receipt's state is a fact, so
 *     it reads as a word in a sentence, not as a bordered capsule.
 *   · Every icon. They sat at the size of a heading beside labels they repeated.
 *   · The "Trace id copied" toast. Copying is not a write and has nothing to
 *     report, so the control says so itself and settles back.
 *
 * It reads only real `TrustReceipt` columns (assembled in trust-ledger.functions).
 * An absent value renders nothing, never a fabricated field.
 */

import * as React from "react";
import { Row, Line } from "@/components/meridian/rows";
import { Action, Num, Actions, ReadFailedLine } from "@/components/meridian/surface-parts";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Record as RecordSays, Value } from "@/components/shell/primitives";
import { Region } from "@/components/meridian/surface-parts";
import { Prose } from "@/components/meridian/Prose";
import { traceRef } from "@/components/discover/format";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { artifactWord, relationWord } from "@/lib/artifact-words";
import { setDecisionShared } from "@/lib/decisions-share.functions";
import { getStageEvents } from "@/lib/stage-events.functions";
import type { ReceiptEdge, TrustReceipt } from "@/lib/trust-ledger.functions";
import {
  RECEIPT_PREFIX,
  receiptStatusTone,
  receiptStatusLabel,
  RECEIPT_VALUE_TONE,
} from "./format";

/** Plain-words relative time, the same idiom the ported surfaces use. Mono is
 *  applied by the row, never here. */
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
 * TRUST-SHARE: publish a decision's receipt as a public provenance artifact.
 * The publish act is USER-INITIATED (a click), per the v11 ruling that sharing
 * is outward-facing and nothing auto-publishes. On success it surfaces the
 * public `/d/<slug>` link to copy, which is what a product lead forwards to
 * their VP. Shared by the ledger card and this detail so the control behaves
 * identically in both.
 */
export function ShareControl({ decisionId }: { decisionId: string }) {
  const fShare = useServerFn(setDecisionShared);
  const [copied, setCopied] = React.useState(false);
  const m = useMutation({ mutationFn: () => fShare({ data: { id: decisionId, isPublic: true } }) });

  const slug = m.data?.share_slug ?? null;
  const link =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/d/${slug}`
      : slug
        ? `/d/${slug}`
        : null;

  if (link) {
    return (
      /* TIER: clause 3, copies to the clipboard; nothing in the record changes. */
      <button
        type="button"
        className="rounded-mrd-chip border border-mrd-line bg-mrd-lift px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-lift-hover hover:text-mrd-ink"
        title={link}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked, the link is in the title for manual copy */
          }
        }}
      >
        {copied ? "Link copied" : "Copy the public link"}
      </button>
    );
  }
  if (m.data && m.data.available === false) {
    return <Value tone="quiet">Sharing lands on the next deploy.</Value>;
  }
  return (
    <>
      {/* TIER: Action, default face - the click writes the decision public
          through setDecisionShared, and publishing is this control's whole job. */}
      <Action busy={m.isPending} onClick={() => m.mutate()}>
        {m.isPending ? "Publishing" : m.isError ? "Try publishing again" : "Publish it"}
      </Action>
      {m.isError ? <ReadFailedLine>{(m.error as Error).message}</ReadFailedLine> : null}
    </>
  );
}

export interface ReceiptDetailSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  receipt: TrustReceipt | null;
  /** Opens another receipt already in the loaded ledger list (the supersession
   * link and decision evidence rows walk the chain without leaving the ledger). */
  onOpenReceipt?: (id: string) => void;
}

/* ------------------------------------------------------------------ *
 * The detail
 * ------------------------------------------------------------------ */

export function ReceiptDetail({
  receipt: r,
  onOpenReceipt,
  onClose,
}: {
  receipt: TrustReceipt;
  onOpenReceipt?: (id: string) => void;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const superseded = r.outcome === "superseded";
  const decidedBy = r.humanDecided ? "You" : (r.actor ?? "An agent");
  const kindLabel = r.kind === "decision" ? "Decision" : "Autonomous action";
  const sources = r.sources ?? [];
  const edges = r.edges ?? [];

  // Provenance link per source ref: the kind derives from WHICH id column the
  // ref came from (never the stored source_kind, which can disagree). A spec
  // opens the spec editor; a mission opens ITS Build page, not the Build root.
  const sourceGo = (s: { kind: string; id: string }): (() => void) | null => {
    if (s.kind === "prd") return () => navigate({ to: "/plan/spec/$id", params: { id: s.id } });
    if (s.kind === "mission")
      return () => navigate({ to: "/build/$missionId", params: { missionId: s.id } });
    return null;
  };

  // Evidence rows link into the artifact on the other end where a route exists;
  // a decision opens its own receipt in the ledger, a learning stays a plain row.
  const edgeGo = (e: ReceiptEdge): (() => void) | null => {
    if (!e.id) return null;
    if (e.kind === "decision" && onOpenReceipt) return () => onOpenReceipt(e.id);
    if (e.kind === "prd") return () => navigate({ to: "/plan/spec/$id", params: { id: e.id } });
    if (e.kind === "mission")
      return () => navigate({ to: "/build/$missionId", params: { missionId: e.id } });
    if (e.kind === "opportunity")
      return () => navigate({ to: "/discover", search: { tab: "queue" } as never });
    return null;
  };

  const when = ago(r.occurredAt);

  return (
    <>
      <Region
        title={stripAutoPrefix(r.title)}
        sub={
          <>
            {kindLabel}, decided by {decidedBy}
            {when ? `, ${when} ago` : ""}.{" "}
            <Value tone={RECEIPT_VALUE_TONE[receiptStatusTone(r.status)]}>
              {receiptStatusLabel(r.status)}
            </Value>
            {isAutoTitle(r.title) ? <> Raised automatically by the loop.</> : null}
          </>
        }
        // TIER: goTo. Closing the sheet is the way OUT of this region - it
        // names no destination but also reveals nothing and runs nothing, so
        // it takes the plain-button slot (answers/RL0-005).
        goTo={onClose ? "Close" : undefined}
        onGoTo={onClose}
      >{/* THE RECORD SPEAKING. A receipt either still governs or it has been
            replaced, and that is a claim about the workspace rather than a
            status column, so it takes the one lit surface in the product. */}
        <RecordSays
          evidence={
            <>
              {RECEIPT_PREFIX[r.kind]}
              {"·"}
              {traceRef(r.id)}
            </>
          }
        >
          {superseded
            ? "A later decision replaced this one. It stays on the record for the audit trail, but do not act on it."
            : r.outcome === "proven"
              ? "This is the current record, and a recorded outcome has since proven it right."
              : "This is the current record. No later call has superseded it."}
        </RecordSays>

        {superseded && r.supersededBy ? (
          onOpenReceipt ? (
            <Row
              lead="Open the record that replaced it"
              sub={<Num>{r.supersededBy.slice(0, 8)}</Num>}
              tight
              onClick={() => onOpenReceipt(r.supersededBy as string)}
            />
          ) : (
            <Line label="Replaced by">
              <Num>{r.supersededBy.slice(0, 8)}</Num>
            </Line>
          )
        ) : null}
      </Region>

      <Region title="Why">
        {r.rationale ? (
          <Prose>{r.rationale}</Prose>
        ) : (
          <Prose>No reasoning was recorded with this one.</Prose>
        )}
        {r.outcome === "proven" && r.provenBy ? (
          <Prose>{r.provenBy.summary ?? "Proven by a learning with no summary on it."}</Prose>
        ) : null}
      </Region>

      {edges.length ? (
        <Region title="What backs it">
          {edges.map((e) => {
            const go = edgeGo(e);
            return (
              <Row
                key={`${e.kind}-${e.id}-${e.relation}`}
                lead={stripAutoPrefix(e.label)}
                sub={[e.kind ? artifactWord(e.kind) : null, relationWord(e.relation)]
                  .filter(Boolean)
                  .join(", ")}
                tight
                onClick={go ?? undefined}
              />
            );
          })}
        </Region>
      ) : null}

      <Region title="Where it came from">
        {sources.length ? (
          sources.map((s) => {
            const go = sourceGo(s);
            return (
              <Row
                key={`${s.kind}-${s.id}`}
                lead={s.label ?? `Untitled ${artifactWord(s.kind)}`}
                sub={artifactWord(s.kind)}
                tight
                onClick={go ?? undefined}
              />
            );
          })
        ) : (
          <Prose>
            {r.source.label
              ? `${r.source.kind ? `${artifactWord(r.source.kind)}: ` : ""}${r.source.label}`
              : r.kind === "decision"
                ? "Recorded directly, with nothing upstream linked to it."
                : "An autonomous action, decided at its own approval gate."}
          </Prose>
        )}
      </Region>

      {r.build ? (
        <Region title="What it built">
          {r.build.branch ? (
            <Line label="Branch">
              <Num>{r.build.branch}</Num>
            </Line>
          ) : null}
          {r.build.prUrl ? (
            <Line label="Pull request">
              <a href={r.build.prUrl} target="_blank" rel="noreferrer">
                {r.build.prNumber != null ? <Num>#{r.build.prNumber}</Num> : "Open it on GitHub"}
              </a>
            </Line>
          ) : r.build.prNumber != null ? (
            <Line label="Pull request">
              <Num>#{r.build.prNumber}</Num>
            </Line>
          ) : null}
          <Line label="Status">
            <Value>{r.build.status}</Value>
          </Line>
          <Line
            label="Fix attempts used"
            sub="Each one is a retry the engine spent before it came back to you."
          >
            <Num>{r.build.fixAttempts}</Num>
          </Line>
        </Region>
      ) : null}

      {r.deploys?.length ? (
        <Region title="Where it landed">
          {r.deploys.map((d, i) => (
            <Row
              key={`${d.environment}-${d.commitSha}-${i}`}
              lead={d.environment}
              sub={d.url ?? "No URL was recorded."}
              time={ago(d.deployedAt)}
              tight
              action={
                d.url ? (
                  <a href={d.url} target="_blank" rel="noreferrer" className="sp-block-more">
                    Open it
                  </a>
                ) : undefined
              }
            />
          ))}
        </Region>
      ) : null}

      {/* Stage history from the real stage_events rows: the receipt's own (a
          decision is a staged entity), plus its source spec or mission. Each
          block is honest-empty, so absent history renders nothing. */}
      {r.kind === "decision" ? (
        <StageHistory entityType="decision" entityId={r.id} title="How it moved" />
      ) : null}
      {sources.map((s) =>
        s.kind === "prd" ? (
          <StageHistory
            key={`stage-${s.id}`}
            entityType="spec"
            entityId={s.id}
            title="How the spec moved"
          />
        ) : s.kind === "mission" ? (
          <StageHistory
            key={`stage-${s.id}`}
            entityType="mission"
            entityId={s.id}
            title="How the mission moved"
          />
        ) : null,
      )}

      <Region>
        <Actions
          trailing={
            onClose ? (
              /* TIER: clause 3, closes the detail; nothing is written. */
              <button
                type="button"
                className="rounded-mrd-chip px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
                onClick={onClose}
              >
                Back to the record
              </button>
            ) : undefined
          }
        >
          {/* TIER: clause 3, copies the trace id to the clipboard; nothing in
              the record changes. */}
          <button
            type="button"
            className="rounded-mrd-chip border border-mrd-line bg-mrd-lift px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-lift-hover hover:text-mrd-ink"
            title="Copy the full trace id"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(r.id);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* clipboard blocked; the id is on the record above */
              }
            }}
          >
            {copied ? "Trace id copied" : "Copy the trace id"}
          </button>
          {r.kind === "decision" ? <ShareControl decisionId={r.id} /> : null}
        </Actions>
      </Region>
    </>
  );
}

/** One entity's stage transitions, read from the real `stage_events` rows.
 *
 *  This used to be `shared/StageTimeline`, which is still written against the
 *  retired system (DetailSection, MonoLabel, the shouty relTimeCaps). Reading
 *  the same server function under the same query key costs no extra round trip
 *  when both are mounted, and keeps this detail on one theme. */
function StageHistory({
  entityType,
  entityId,
  title,
}: {
  entityType: "spec" | "mission" | "decision";
  entityId: string;
  title: string;
}) {
  const fEvents = useServerFn(getStageEvents);
  const q = useQuery({
    queryKey: ["stage-events", entityType, entityId],
    queryFn: () => fEvents({ data: { entityType, entityId } }),
  });

  // Honest-empty: history accrues from the day the seam landed, with no
  // backfill, so an entity older than that legitimately has none. A read that
  // FAILED is a different fact and says so.
  if (q.isError) {
    return (
      <Region title={title}>
        <ReadFailedLine onRetry={() => q.refetch()}>Its history did not load.</ReadFailedLine>
      </Region>
    );
  }
  const events = q.data?.events ?? [];
  if (events.length === 0) return null;

  return (
    <Region title={title}>
      {events.map((e) => (
        <Row
          key={e.id}
          lead={e.from_stage ? `${e.from_stage} to ${e.to_stage}` : e.to_stage}
          sub={e.actor}
          time={ago(e.at)}
          tight
        />
      ))}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * The in-place wrapper
 * ------------------------------------------------------------------ */

/**
 * Kept under its old name and its old props so the panel that mounts it does
 * not have to change tonight. It no longer overlays anything: when a receipt is
 * open the detail renders where it stands and the surface scrolls to it, which
 * is the click confirmed rather than the page taken away.
 */
export function ReceiptDetailSheet({
  open,
  onOpenChange,
  receipt,
  onOpenReceipt,
}: ReceiptDetailSheetProps) {
  const anchor = React.useRef<HTMLDivElement>(null);
  const id = receipt?.id ?? null;

  React.useEffect(() => {
    if (!open || !id) return;
    // Motion confirms: it says the click landed and where it landed. It obeys
    // the reader's own setting rather than deciding for them.
    const still =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    anchor.current?.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
  }, [open, id]);

  if (!open || !receipt) return null;

  return (
    <div ref={anchor}>
      <ReceiptDetail
        receipt={receipt}
        onOpenReceipt={onOpenReceipt}
        onClose={() => onOpenChange(false)}
      />
    </div>
  );
}
