// dim 17 (design-anatomy §3): a Trust Ledger receipt is a first-class,
// auditable object, so a single click opens its full backing record in the
// shared DetailKit anatomy, exactly like the Decide opportunity sheet and the
// Today CallDetailSheet. It reads only real TrustReceipt columns (assembled in
// trust-ledger.functions); an absent value renders nothing, never a fabricated
// field. The receipt carries its registered trace prefix (DEC / ACT),
// timestamps via relTimeCaps, a status pill, the outcome (standing / superseded)
// with its supersede link, provenance that links back up the loop, and, for a
// decision, the same public-share control the card offers.
import { useState, type ReactNode } from "react";
import { Copy, ExternalLink, Share2, Check, History } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { MonoLabel } from "@/components/obsidian";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import { DetailHeader, DetailSection, StatCell, StatStrip } from "@/components/discover/DetailKit";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { setDecisionShared } from "@/lib/decisions-share.functions";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/supaprod/AutoChip";
import type { ReceiptEdge, TrustReceipt } from "@/lib/trust-ledger.functions";
import { RECEIPT_PREFIX, receiptStatusTone, receiptStatusLabel, RECEIPT_TONE_VAR } from "./format";

/**
 * TRUST-SHARE: publish a decision's receipt as a public provenance artifact.
 * The publish act is USER-INITIATED (a click), per the v11 ruling that sharing
 * is outward-facing, nothing auto-publishes. On success it surfaces the public
 * `/d/<slug>` link to copy (what a PM forwards to their VP). Shared by the
 * ledger card and this detail so the control behaves identically in both.
 */
export function ShareControl({ decisionId }: { decisionId: string }) {
  const fShare = useServerFn(setDecisionShared);
  const [copied, setCopied] = useState(false);
  const m = useMutation({ mutationFn: () => fShare({ data: { id: decisionId, isPublic: true } }) });

  const slug = m.data?.share_slug ?? null;
  const link =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/d/${slug}`
      : slug
        ? `/d/${slug}`
        : null;

  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-subtle)",
    background: "transparent",
    border: "1px solid var(--hairline)",
    borderRadius: 99,
    padding: "3px 9px",
    cursor: "pointer",
  };

  if (link) {
    return (
      <button
        type="button"
        title={link}
        onClick={async (e) => {
          e.stopPropagation();
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked, the link is in the title for manual copy */
          }
        }}
        style={chip}
      >
        {copied ? <Check size={11} strokeWidth={2} /> : <Copy size={11} strokeWidth={1.8} />}
        {copied ? "Link copied" : "Copy public link"}
      </button>
    );
  }
  if (m.data && m.data.available === false) {
    return (
      <span
        style={{ ...chip, cursor: "default", color: "var(--text-faint)" }}
        title="Sharing lands on the next deploy"
      >
        Sharing not available yet
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        m.mutate();
      }}
      disabled={m.isPending}
      style={{ ...chip, opacity: m.isPending ? 0.6 : 1 }}
    >
      <Share2 size={11} strokeWidth={1.8} />
      {m.isPending ? "Sharing" : m.isError ? "Retry share" : "Share"}
    </button>
  );
}

/** A quiet mono-caps status pill, so the object's state reads without a menu. */
function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: tone,
        border: "1px solid var(--hairline)",
        borderRadius: "999px",
        padding: "2px 8px",
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
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

/** The quiet inline link button every walkable row in this sheet uses. Text
 * stays neutral (Tempo v5 §2 narrows glacier to literal status chips and
 * `<a>`/`<Link>` hyperlinks; this is a button, not a link element) and
 * brightens to full-contrast on hover, matching the "Superseded by" row. */
const LINK_BUTTON: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  marginLeft: "auto",
  fontSize: "12px",
  color: "var(--text-body)",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/**
 * One receipt in full, on the shared DetailKit anatomy so it reads as one
 * language with every other object detail. It leads with the outcome (still
 * standing, or superseded), then the glanceable stat strip, then the supporting
 * sections (why, where it came from, when, and the supersession link).
 */
export function ReceiptDetailSheet({
  open,
  onOpenChange,
  receipt,
  onOpenReceipt,
}: ReceiptDetailSheetProps) {
  const navigate = useNavigate();
  if (!receipt) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto" />
      </Sheet>
    );
  }

  const r = receipt;
  const superseded = r.outcome === "superseded";
  const statusTone = RECEIPT_TONE_VAR[receiptStatusTone(r.status)];
  const decidedLabel = r.humanDecided ? "You" : r.actor ? r.actor : "Agent";
  const kindLabel = r.kind === "decision" ? "Decision" : "Action";
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

  const copyId = () => {
    void navigator.clipboard?.writeText(r.id);
    toast("Trace id copied");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{stripAutoPrefix(r.title)}</SheetTitle>
          <SheetDescription>
            One receipt in full: what changed, why, the evidence, who decided, and whether it still
            stands.
          </SheetDescription>
        </SheetHeader>

        <div style={{ display: "grid", gap: "16px", marginTop: "2px" }}>
          <DetailHeader
            title={stripAutoPrefix(r.title)}
            chips={
              <>
                <StatusPill label={receiptStatusLabel(r.status)} tone={statusTone} />
                <StatusPill
                  label={superseded ? "Superseded" : r.outcome === "proven" ? "Proven" : "Standing"}
                  tone={superseded ? "var(--text-muted)" : "var(--moss)"}
                />
                {isAutoTitle(r.title) ? <AutoChip /> : null}
              </>
            }
            time={
              r.occurredAt ? (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9.5px",
                    letterSpacing: "0.06em",
                    color: "var(--text-subtle)",
                  }}
                >
                  {relTimeCaps(r.occurredAt)}
                </span>
              ) : null
            }
            traceRef={
              <button
                type="button"
                onClick={copyId}
                aria-label="Copy trace id"
                title="Copy the full trace id"
                className="loom-press flex items-center hover:[color:var(--text-subtle)]"
                style={{
                  gap: "6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: "var(--text-faint)",
                  background: "transparent",
                  border: "none",
                  padding: "3px 2px",
                  cursor: "pointer",
                }}
              >
                {RECEIPT_PREFIX[r.kind]}
                {"\u00b7"}
                {traceRef(r.id)}
                <Copy className="h-3 w-3" />
              </button>
            }
          />

          {/* Outcome band: a calm neutral fill (never amber, never a chromatic
              accent - Tempo v5 §2 narrows glacier to literal status chips and
              links), the record's state in plain words. */}
          <div
            style={{
              display: "grid",
              gap: "8px",
              background: "var(--raised)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-card)",
              padding: "13px 15px",
            }}
          >
            <div className="flex flex-wrap items-baseline" style={{ gap: "8px" }}>
              <MonoLabel
                style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
              >
                {superseded ? "Superseded" : "Still stands"}
              </MonoLabel>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  fontWeight: 550,
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                }}
              >
                {superseded
                  ? "A later decision replaced this one. It stays on the record for the audit trail."
                  : "This is the current record. It has not been superseded by a later call."}
              </span>
            </div>
          </div>

          <StatStrip>
            <StatCell
              label="Outcome"
              value={superseded ? "Superseded" : "Standing"}
              tone={superseded ? "muted" : "moss"}
            />
            <StatCell label="Kind" value={kindLabel} tone="neutral" />
            <StatCell
              label="Evidence"
              value={String(r.evidenceCount)}
              tone={r.evidenceCount > 0 ? "neutral" : "muted"}
            />
          </StatStrip>

          <DetailSection heading="Why">
            {r.rationale ? (
              <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)" }}>
                {r.rationale}
              </span>
            ) : (
              <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic" }}>
                No rationale recorded.
              </span>
            )}
          </DetailSection>

          {edges.length ? (
            <DetailSection heading="Evidence">
              <div style={{ display: "grid", gap: "8px" }}>
                {edges.map((e) => {
                  const go = edgeGo(e);
                  const body = (
                    <>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9.5px",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--text-subtle)",
                          flexShrink: 0,
                        }}
                      >
                        {e.relation ?? "linked"}
                      </span>
                      <span
                        style={{
                          fontSize: "12.5px",
                          color: "var(--text-body)",
                          textAlign: "left",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {e.kind ? `${e.kind}: ` : ""}
                        {stripAutoPrefix(e.label)}
                      </span>
                    </>
                  );
                  return go ? (
                    <button
                      key={`${e.kind}-${e.id}-${e.relation}`}
                      type="button"
                      onClick={go}
                      className="loom-press flex items-center hover:[color:var(--text-primary)]"
                      style={{
                        gap: "8px",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      {body}
                      <ExternalLink
                        className="h-3 w-3"
                        style={{ marginLeft: "auto", color: "var(--text-subtle)", flexShrink: 0 }}
                      />
                    </button>
                  ) : (
                    <div
                      key={`${e.kind}-${e.id}-${e.relation}`}
                      className="flex items-center"
                      style={{ gap: "8px" }}
                    >
                      {body}
                    </div>
                  );
                })}
              </div>
            </DetailSection>
          ) : null}

          {r.outcome === "proven" && r.provenBy ? (
            <DetailSection heading="Proven by a recorded outcome">
              <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)" }}>
                {r.provenBy.summary ?? `Learning ${r.provenBy.id.slice(0, 8)}`}
              </span>
            </DetailSection>
          ) : null}

          <DetailSection heading="Where it came from">
            {sources.length ? (
              <div style={{ display: "grid", gap: "8px" }}>
                {sources.map((s) => {
                  const go = sourceGo(s);
                  return (
                    <div
                      key={`${s.kind}-${s.id}`}
                      className="flex items-center"
                      style={{ gap: "8px" }}
                    >
                      <span
                        style={{
                          fontSize: "12.5px",
                          color: "var(--text-body)",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {s.kind}: {s.label ?? s.id.slice(0, 8)}
                      </span>
                      {go ? (
                        <button
                          type="button"
                          onClick={go}
                          className="loom-press flex items-center hover:[color:var(--text-primary)]"
                          style={LINK_BUTTON}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {s.kind === "prd" ? "Open the spec" : "Open in Build"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                {r.source.label
                  ? `${r.source.kind ? `${r.source.kind}: ` : ""}${r.source.label}`
                  : r.kind === "decision"
                    ? "Recorded directly, with no upstream artifact linked."
                    : "An autonomous action, decided at its approval gate."}
              </span>
            )}
          </DetailSection>

          {r.build ? (
            <DetailSection heading="The build">
              <div style={{ display: "grid", gap: "10px" }}>
                {r.build.branch ? (
                  <div style={{ display: "grid", gap: "3px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Branch</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11.5px",
                        color: "var(--text-body)",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {r.build.branch}
                    </span>
                  </div>
                ) : null}
                {r.build.prUrl || r.build.prNumber != null ? (
                  <div style={{ display: "grid", gap: "3px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>PR</span>
                    {r.build.prUrl ? (
                      <a
                        href={r.build.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="loom-press flex items-center hover:[color:var(--text-primary)]"
                        style={{ gap: "6px", fontSize: "12.5px", color: "var(--glacier)" }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {r.build.prNumber != null ? `#${r.build.prNumber}` : "Open the PR"}
                      </a>
                    ) : (
                      <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                        #{r.build.prNumber}
                      </span>
                    )}
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Status</span>
                  <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                    {r.build.status}
                  </span>
                </div>
                <div style={{ display: "grid", gap: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>
                    Fix attempts consumed
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ fontSize: "12.5px", color: "var(--text-body)" }}
                  >
                    {r.build.fixAttempts}
                  </span>
                </div>
              </div>
            </DetailSection>
          ) : null}

          {r.deploys?.length ? (
            <DetailSection heading="Deployed">
              <div style={{ display: "grid", gap: "8px" }}>
                {r.deploys.map((d, i) => (
                  <div
                    key={`${d.environment}-${d.commitSha}-${i}`}
                    className="flex items-baseline"
                    style={{ gap: "8px" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.5px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--text-subtle)",
                        flexShrink: 0,
                      }}
                    >
                      {d.environment}
                    </span>
                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:[color:var(--text-primary)]"
                        style={{
                          fontSize: "12.5px",
                          color: "var(--glacier)",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {d.url}
                      </a>
                    ) : (
                      <span style={{ fontSize: "12.5px", color: "var(--text-subtle)" }}>
                        No URL recorded
                      </span>
                    )}
                    {d.deployedAt ? (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontFamily: "var(--font-mono)",
                          fontSize: "9.5px",
                          letterSpacing: "0.06em",
                          color: "var(--text-faint)",
                          flexShrink: 0,
                        }}
                      >
                        {relTimeCaps(d.deployedAt)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </DetailSection>
          ) : null}

          <DetailSection heading="Decided">
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "grid", gap: "3px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>By</span>
                <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                  {decidedLabel}
                </span>
              </div>
              {r.occurredAt ? (
                <div style={{ display: "grid", gap: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>When</span>
                  <span
                    className="flex items-baseline"
                    style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
                  >
                    <span>{new Date(r.occurredAt).toLocaleString()}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.5px",
                        letterSpacing: "0.06em",
                        color: "var(--text-faint)",
                      }}
                    >
                      {relTimeCaps(r.occurredAt)}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          </DetailSection>

          {/* Stage history from the real stage_events rows: the receipt's own
              (a decision is a staged entity), plus its source spec/mission.
              StageTimeline is honest-empty, so absent history renders nothing. */}
          {r.kind === "decision" ? (
            <StageTimeline entityType="decision" entityId={r.id} variant="detailkit" />
          ) : null}
          {sources.map((s) =>
            s.kind === "prd" ? (
              <StageTimeline
                key={`timeline-${s.id}`}
                entityType="spec"
                entityId={s.id}
                variant="detailkit"
              />
            ) : s.kind === "mission" ? (
              <StageTimeline
                key={`timeline-${s.id}`}
                entityType="mission"
                entityId={s.id}
                variant="detailkit"
              />
            ) : null,
          )}

          {superseded && r.supersededBy ? (
            <DetailSection heading="Superseded by">
              {onOpenReceipt ? (
                <button
                  type="button"
                  onClick={() => onOpenReceipt(r.supersededBy!)}
                  className="loom-press flex items-center hover:[color:var(--text-primary)]"
                  style={{
                    gap: "8px",
                    fontSize: "12.5px",
                    color: "var(--text-body)",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <History size={13} strokeWidth={1.8} color="var(--text-muted)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                    {r.supersededBy.slice(0, 8)}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-body)" }}>
                    Open the superseding record
                  </span>
                </button>
              ) : (
                <span
                  className="flex items-center"
                  style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
                >
                  <History size={13} strokeWidth={1.8} color="var(--text-muted)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                    {r.supersededBy.slice(0, 8)}
                  </span>
                </span>
              )}
            </DetailSection>
          ) : null}

          {r.kind === "decision" ? (
            <div
              className="flex flex-wrap items-center"
              style={{ gap: "10px", paddingTop: "15px", borderTop: "1px solid var(--hairline)" }}
            >
              <ShareControl decisionId={r.id} />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
