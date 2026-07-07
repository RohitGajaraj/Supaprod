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
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { setDecisionShared } from "@/lib/decisions-share.functions";
import { stripAutoPrefix } from "@/components/plan/format";
import type { TrustReceipt } from "@/lib/trust-ledger.functions";
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
}

/**
 * One receipt in full, on the shared DetailKit anatomy so it reads as one
 * language with every other object detail. It leads with the outcome (still
 * standing, or superseded), then the glanceable stat strip, then the supporting
 * sections (why, where it came from, when, and the supersession link).
 */
export function ReceiptDetailSheet({ open, onOpenChange, receipt }: ReceiptDetailSheetProps) {
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

  // Provenance link target: a spec opens the spec; a mission opens Build.
  const provenance = (() => {
    if (r.source.kind === "prd" && r.source.id) {
      return {
        label: "Open the spec",
        go: () => navigate({ to: "/prds/$id", params: { id: r.source.id! } }),
      };
    }
    if (r.source.kind === "mission" && r.source.id) {
      return { label: "Open in Build", go: () => navigate({ to: "/build" }) };
    }
    return null;
  })();

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

          {/* Outcome band: calm glacier tint (never amber), the record's state
              in plain words. */}
          <div
            style={{
              display: "grid",
              gap: "8px",
              background: "color-mix(in srgb, var(--glacier) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--glacier) 22%, transparent)",
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
                  fontFamily: "var(--font-ui)",
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
              tone={r.evidenceCount > 0 ? "glacier" : "muted"}
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

          <DetailSection
            heading="Where it came from"
            action={
              provenance ? (
                <button
                  type="button"
                  onClick={provenance.go}
                  className="loom-press flex items-center hover:[color:var(--text-primary)]"
                  style={{
                    gap: "6px",
                    fontSize: "12px",
                    color: "var(--glacier)",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {provenance.label}
                </button>
              ) : null
            }
          >
            <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
              {r.source.label
                ? `${r.source.kind ? `${r.source.kind}: ` : ""}${r.source.label}`
                : r.kind === "decision"
                  ? "Recorded directly, with no upstream artifact linked."
                  : "An autonomous action, decided at its approval gate."}
            </span>
          </DetailSection>

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

          {superseded && r.supersededBy ? (
            <DetailSection heading="Superseded by">
              <span
                className="flex items-center"
                style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
              >
                <History size={13} strokeWidth={1.8} color="var(--text-muted)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                  {r.supersededBy.slice(0, 8)}
                </span>
              </span>
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
