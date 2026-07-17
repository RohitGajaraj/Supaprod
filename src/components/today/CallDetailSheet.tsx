// Loom dim 17 (design-anatomy §3): every Today Call is a first-class,
// auditable object, so a single click opens its full backing record in the
// shared DetailKit anatomy, exactly like the Decide opportunity sheet. The
// four call families (Ship it? / Worth building? spec / Worth building?
// opportunity / Worth re-examining?) each read from real getNeedsYou columns
// only, carry their registered trace prefix (MIS / PRD / OPP / ASM),
// timestamps, a status pill, provenance that links back up the loop, and the
// same Approve/Send-back actions as the card so the operator can decide in
// place after inspecting the receipts. No fabricated fields: an absent value
// renders nothing.
import { type ReactNode } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button, MonoLabel, VerdictChip } from "@/components/obsidian";
import { AuditTag } from "@/components/cadence/AuditTag";
import type { AuditKind } from "@/lib/audit-id";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import {
  DetailHeader,
  DetailSection,
  StatCell,
  StatStrip,
  type StatTone,
} from "@/components/discover/DetailKit";
import { relTimeCaps, traceRef, verdictFor, type VerdictWord } from "@/components/discover/format";
import type { CriticReview } from "@/lib/discovery.functions";
import {
  toolConsequence,
  toolRisk,
  isExternalTool,
  REVERSIBILITY_LABEL,
  RISK_LABEL,
} from "@/lib/tool-consequences";
import { agentBlurb, agentDisplayName, agentStation, AGENT_STATIONS } from "@/lib/agent-vocabulary";

/** The shared fields every call detail carries. The action handlers are the
 * same mutations the card wired, so deciding from the sheet behaves identically
 * to deciding from the card. */
interface CallDetailBase {
  id: string;
  title: string;
  okLabel: string;
  noLabel: string;
  onOk: () => void;
  onNo: () => void;
}

/** A Today call, in full. A discriminated union over the five families; each
 * member holds only real getNeedsYou columns. */
export type CallDetail =
  | (CallDetailBase & {
      kind: "ship";
      agentSlug: string;
      toolName: string;
      rationale: string | null;
      escalationState: string;
      expiresAt: string | null;
      createdAt: string;
      model: string | null;
      estCostUsd: number | null;
      /** The mission behind the gate; provenance opens it specifically. */
      missionId: string | null;
    })
  | (CallDetailBase & {
      kind: "spec";
      status: string;
      critic: CriticReview | null;
      updatedAt: string;
    })
  | (CallDetailBase & {
      kind: "opportunity";
      critic: CriticReview | null;
      createdAt: string;
    })
  | (CallDetailBase & {
      kind: "assumption";
      decisionTitle: string;
      assumptionStatement: string;
      rationale: string;
      evidenceText: string | null;
      createdAt: string;
    })
  | (CallDetailBase & {
      /** SW-3 (mission 3.8b): a compounding-pass playbook proposal. */
      kind: "playbook";
      body: string;
      sourceCount: number;
      createdAt: string;
    });

/** The registered trace prefix per family (dim 17 registry). */
const PREFIX: Record<CallDetail["kind"], string> = {
  ship: "MIS",
  spec: "PRD",
  opportunity: "OPP",
  assumption: "ASM",
  playbook: "PBP",
};

// Which call-detail kinds resolve to a standalone traceable audit entity. A
// "ship" item is a mission; assumption/playbook have no audit id of their own,
// so those keep the plain copy chip.
const CALL_AUDIT_KIND: Record<string, AuditKind> = {
  ship: "mission",
  spec: "spec",
  opportunity: "opportunity",
};

function fmtUsd(n: number): string {
  if (n <= 0) return "$0";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

/** A quiet mono-caps status pill, so the object's stage reads without a menu. */
function StatusPill({ label, tone = "var(--text-subtle)" }: { label: string; tone?: string }) {
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

/** Family-specific status pill text + tone. */
function statusMeta(detail: CallDetail): { label: string; tone: string } {
  switch (detail.kind) {
    case "ship": {
      const escalated = detail.escalationState === "escalated";
      return {
        label: escalated ? "Escalated" : "Awaiting you",
        tone: escalated ? "var(--amber)" : "var(--text-muted)",
      };
    }
    case "spec":
      return { label: "In review", tone: "var(--text-muted)" };
    case "opportunity":
      return { label: "Backlog", tone: "var(--text-muted)" };
    case "assumption":
      return { label: "Open challenge", tone: "var(--amber)" };
    case "playbook":
      return { label: "Proposed method", tone: "var(--text-muted)" };
  }
}

/** An absolute date plus a quiet relative caption. */
function TimeLine({ iso }: { iso: string }) {
  return (
    <span
      className="flex items-baseline"
      style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
    >
      <span>{new Date(iso).toLocaleString()}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          letterSpacing: "0.06em",
          color: "var(--text-faint)",
        }}
      >
        {relTimeCaps(iso)}
      </span>
    </span>
  );
}

/** The Critic's take, honest when absent. Shared by the spec + opportunity
 * details. */
function CriticBody({ critic, verdict }: { critic: CriticReview | null; verdict: VerdictWord }) {
  return (
    <div style={{ display: "grid", gap: "9px" }}>
      <VerdictChip tone={verdict} style={{ justifySelf: "start" }} />
      {critic?.summary ? (
        <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)", margin: 0 }}>
          {critic.summary}
        </p>
      ) : (
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-subtle)",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          No Critic review yet. Approving blind, with no evidence, is not a real call.
        </p>
      )}
      {critic && critic.risks.length > 0 ? (
        <div style={{ display: "grid", gap: "4px" }}>
          <MonoLabel style={{ fontSize: "9px", color: "var(--madder)" }}>Top risk</MonoLabel>
          <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>{critic.risks[0]}</span>
        </div>
      ) : null}
      {critic && critic.missing_evidence.length > 0 ? (
        <div style={{ display: "grid", gap: "4px" }}>
          <MonoLabel style={{ fontSize: "9px" }}>Missing</MonoLabel>
          <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
            {critic.missing_evidence[0]}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** A "where it came from" section with a click-back-up-the-loop link. */
function ProvenanceSection({
  body,
  linkLabel,
  onOpen,
}: {
  body: string;
  linkLabel: string;
  onOpen: () => void;
}) {
  return (
    <DetailSection
      heading="Where it came from"
      action={
        <button
          type="button"
          onClick={onOpen}
          className="loom-press flex items-center transition-colors [color:var(--link)] hover:underline"
          style={{
            gap: "6px",
            fontSize: "12px",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {linkLabel}
        </button>
      }
    >
      <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>{body}</span>
    </DetailSection>
  );
}

const REVERSIBILITY_TONE: Record<string, StatTone> = {
  reversible: "moss",
  irreversible: "madder",
  partial: "amber",
};
const REVERSIBILITY_SHORT: Record<string, string> = {
  reversible: "Reversible",
  irreversible: "One-way",
  partial: "Partial",
};
const RISK_TONE: Record<string, StatTone> = { low: "moss", medium: "amber", high: "madder" };
const RISK_SHORT: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

export interface CallDetailSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  detail: CallDetail | null;
  /** A decision is in flight (any of the queue mutations); the footer waits. */
  deciding?: boolean;
}

/**
 * One Today call in full, on the shared DetailKit anatomy so it reads as one
 * language with the Decide opportunity sheet and every other object detail. It
 * leads with the state and the recommendation (the priority band), then the
 * glanceable stat strip, then the supporting sections (the Critic or the
 * catalogued consequence, provenance, activity), and closes with the same
 * actions as the card. Acting from here runs the same mutation and closes the
 * sheet; the queue advances underneath.
 */
export function CallDetailSheet({ open, onOpenChange, detail, deciding }: CallDetailSheetProps) {
  const navigate = useNavigate();
  if (!detail) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto" />
      </Sheet>
    );
  }

  const status = statusMeta(detail);
  const timeIso = detail.kind === "spec" ? detail.updatedAt : detail.createdAt;
  const timeVerb = detail.kind === "spec" ? "UPDATED" : "RAISED";

  const copyId = () => {
    void navigator.clipboard?.writeText(detail.id);
    toast("Trace id copied");
  };

  const act = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  // The recommendation band (calm neutral surface, never amber) + the sections
  // are family-specific but assembled in the DetailKit order.
  let band: { recommended: string; rationale: string | null };
  let strip: ReactNode = null;
  let sections: ReactNode = null;

  if (detail.kind === "ship") {
    const c = toolConsequence(detail.toolName);
    const risk = toolRisk(detail.toolName);
    const who = agentDisplayName(detail.agentSlug);
    const stationId = agentStation(detail.agentSlug);
    const stationName = stationId ? AGENT_STATIONS[stationId].name : null;
    band = {
      recommended: `Approve to let ${who} continue. ${REVERSIBILITY_LABEL[c.reversible]}.`,
      rationale: c.effect,
    };
    strip = (
      <StatStrip>
        <StatCell label="Blast radius" value={RISK_SHORT[risk]} tone={RISK_TONE[risk]} />
        <StatCell
          label="Undo"
          value={REVERSIBILITY_SHORT[c.reversible]}
          tone={REVERSIBILITY_TONE[c.reversible]}
        />
        {detail.estCostUsd != null ? (
          <StatCell label="Spend so far" value={fmtUsd(detail.estCostUsd)} tone="neutral" />
        ) : null}
      </StatStrip>
    );
    sections = (
      <>
        <DetailSection heading="What happens if you approve">
          <div style={{ display: "grid", gap: "8px" }}>
            <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)" }}>
              {c.effect}
            </span>
            <div className="flex flex-wrap items-center" style={{ gap: "6px" }}>
              <StatusPill
                label={REVERSIBILITY_LABEL[c.reversible]}
                tone={
                  c.reversible === "irreversible"
                    ? "var(--madder)"
                    : c.reversible === "partial"
                      ? "var(--amber)"
                      : "var(--moss)"
                }
              />
              <StatusPill
                label={RISK_LABEL[risk]}
                tone={
                  RISK_TONE[risk] === "madder"
                    ? "var(--madder)"
                    : RISK_TONE[risk] === "amber"
                      ? "var(--amber)"
                      : "var(--moss)"
                }
              />
              {isExternalTool(detail.toolName) ? (
                <StatusPill label="Leaves the workspace" tone="var(--amber)" />
              ) : null}
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-subtle)", lineHeight: 1.55 }}>
              {c.undo}
            </span>
          </div>
        </DetailSection>
        {detail.rationale ? (
          <DetailSection heading="Why the agent asked">
            <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)" }}>
              {detail.rationale}
            </span>
          </DetailSection>
        ) : null}
        <ProvenanceSection
          body={`${who}${stationName ? ` at the ${stationName} station` : ""}. ${
            agentBlurb(detail.agentSlug) ?? "Raised this gate mid-mission."
          } Ran ${detail.toolName}${detail.model ? ` on ${detail.model}` : ""}.`}
          linkLabel="Open in Build"
          onOpen={() =>
            detail.missionId
              ? navigate({ to: "/build/$missionId", params: { missionId: detail.missionId } })
              : navigate({ to: "/build" })
          }
        />
        <DetailSection heading="Activity">
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "grid", gap: "3px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Raised</span>
              <TimeLine iso={detail.createdAt} />
            </div>
            {detail.expiresAt ? (
              <div style={{ display: "grid", gap: "3px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Expires</span>
                <TimeLine iso={detail.expiresAt} />
              </div>
            ) : null}
          </div>
        </DetailSection>
      </>
    );
  } else if (detail.kind === "spec") {
    const verdict = verdictFor({ status: detail.status, critic_review: detail.critic });
    band = {
      recommended: "Approve to log the decision and unblock the build, or send it back to draft.",
      rationale: detail.critic?.summary ?? "A drafted spec is waiting on your call.",
    };
    strip = (
      <StatStrip>
        <StatCell label="Stage" value="Review" tone="muted" />
        <StatCell label="Critic" value={verdict} tone={verdictTone(verdict)} />
      </StatStrip>
    );
    sections = (
      <>
        <DetailSection heading="Critic">
          <CriticBody critic={detail.critic} verdict={verdict} />
        </DetailSection>
        <ProvenanceSection
          body="A drafted spec awaiting your approval before it becomes a committed decision."
          linkLabel="Open the spec"
          onOpen={() => navigate({ to: "/prds/$id", params: { id: detail.id } })}
        />
        <DetailSection heading="Activity">
          <div style={{ display: "grid", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Last updated</span>
            <TimeLine iso={detail.updatedAt} />
          </div>
        </DetailSection>
      </>
    );
  } else if (detail.kind === "opportunity") {
    const verdict = verdictFor({ status: "backlog", critic_review: detail.critic });
    band = {
      recommended: "Keep it to move it to Now on the roadmap, or drop it from the backlog.",
      rationale:
        detail.critic?.summary ?? "The Critic flagged this bet. Your call moves it out of backlog.",
    };
    strip = (
      <StatStrip>
        <StatCell label="Stage" value="Backlog" tone="muted" />
        <StatCell label="Critic" value={verdict} tone={verdictTone(verdict)} />
      </StatStrip>
    );
    sections = (
      <>
        <DetailSection heading="Critic">
          <CriticBody critic={detail.critic} verdict={verdict} />
        </DetailSection>
        <ProvenanceSection
          body="A backlog opportunity the Critic red-teamed. It lives in your Decide queue."
          linkLabel="Open in Discover"
          onOpen={() => navigate({ to: "/discover" })}
        />
        <DetailSection heading="Activity">
          <div style={{ display: "grid", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Framed</span>
            <TimeLine iso={detail.createdAt} />
          </div>
        </DetailSection>
      </>
    );
  } else if (detail.kind === "assumption") {
    band = {
      recommended: "Re-examine reopens the decision for review. Nothing changes without you.",
      rationale: detail.rationale,
    };
    sections = (
      <>
        <DetailSection heading="The assumption under review">
          <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)" }}>
            {detail.assumptionStatement}
          </span>
        </DetailSection>
        {detail.evidenceText ? (
          <DetailSection heading="What contradicts it">
            <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)" }}>
              {detail.evidenceText}
            </span>
          </DetailSection>
        ) : null}
        <ProvenanceSection
          body={`Stands under: ${detail.decisionTitle}.`}
          linkLabel="Open in Brain"
          onOpen={() => navigate({ to: "/brain", search: { tab: "decisions" } as never })}
        />
        <DetailSection heading="Activity">
          <div style={{ display: "grid", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Challenged</span>
            <TimeLine iso={detail.createdAt} />
          </div>
        </DetailSection>
      </>
    );
  } else {
    // SW-3 (mission 3.8b): a compounding-pass playbook proposal. Adopt keeps
    // the method on the record; Dismiss retires it for good (the sweep never
    // re-proposes a dismissed group), so the card's Dismiss is confirm-gated.
    band = {
      recommended:
        "Adopt keeps the method on the record with its source learnings. Dismiss retires it for good.",
      rationale: null,
    };
    sections = (
      <>
        <DetailSection heading="The proposed method">
          <span
            style={{
              fontSize: "12.5px",
              lineHeight: 1.6,
              color: "var(--text-body)",
              whiteSpace: "pre-wrap",
            }}
          >
            {detail.body}
          </span>
        </DetailSection>
        <ProvenanceSection
          body={`Compounded from ${detail.sourceCount} same-shaped learning${detail.sourceCount === 1 ? "" : "s"} in this workspace.`}
          linkLabel="Open in Brain"
          onOpen={() => navigate({ to: "/brain", search: { tab: "learnings" } as never })}
        />
        <DetailSection heading="Activity">
          <div style={{ display: "grid", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Proposed</span>
            <TimeLine iso={detail.createdAt} />
          </div>
        </DetailSection>
      </>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{detail.title}</SheetTitle>
          <SheetDescription>
            One call in full: what it is, where it came from, and what happens if you decide.
          </SheetDescription>
        </SheetHeader>

        <div style={{ display: "grid", gap: "16px", marginTop: "2px" }}>
          <DetailHeader
            title={detail.title}
            chips={<StatusPill label={status.label} tone={status.tone} />}
            time={
              timeIso ? (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9.5px",
                    letterSpacing: "0.06em",
                    color: "var(--text-subtle)",
                  }}
                >
                  {timeVerb} {relTimeCaps(timeIso)}
                </span>
              ) : null
            }
            traceRef={
              CALL_AUDIT_KIND[detail.kind] ? (
                <AuditTag kind={CALL_AUDIT_KIND[detail.kind]} id={detail.id} copyable />
              ) : (
                <button
                  type="button"
                  onClick={copyId}
                  aria-label="Copy trace id"
                  title="Copy the full trace id"
                  className="loom-press flex items-center transition-colors [color:var(--text-faint)] hover:[color:var(--text-subtle)]"
                  style={{
                    gap: "6px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    background: "transparent",
                    border: "none",
                    padding: "3px 2px",
                    cursor: "pointer",
                  }}
                >
                  {PREFIX[detail.kind]}·{traceRef(detail.id)}
                  <Copy className="h-3 w-3" />
                </button>
              )
            }
          />

          {/* Recommendation band: calm neutral surface (never amber), the system's
              read on what the user should do first. */}
          <div
            style={{
              display: "grid",
              gap: "8px",
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-card)",
              padding: "13px 15px",
            }}
          >
            <div className="flex flex-wrap items-baseline" style={{ gap: "8px" }}>
              <MonoLabel
                style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
              >
                Recommended
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
                {band.recommended}
              </span>
            </div>
            {band.rationale ? (
              <p
                style={{
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  color: "var(--text-subtle)",
                  margin: 0,
                }}
              >
                {band.rationale}
              </p>
            ) : null}
          </div>

          {strip}
          {sections}

          {/* Actions, mirroring the card. */}
          <div
            className="flex flex-wrap items-center"
            style={{ gap: "10px", paddingTop: "15px", borderTop: "1px solid var(--hairline)" }}
          >
            <Button variant="accent" size="sm" disabled={deciding} onClick={() => act(detail.onOk)}>
              {detail.okLabel}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={deciding}
              onClick={() => act(detail.onNo)}
            >
              {detail.noLabel}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** VerdictWord -> a stat-cell tone. */
function verdictTone(v: VerdictWord): StatTone {
  if (v === "SHIP") return "moss";
  if (v === "REVISE" || v === "KILL") return "madder";
  if (v === "WATCH") return "glacier";
  return "muted";
}
