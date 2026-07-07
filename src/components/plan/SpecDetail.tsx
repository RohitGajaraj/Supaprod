import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Copy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SlideOver } from "@/components/obsidian/slideover";
import { MonoLabel, VerdictChip, Citation } from "@/components/obsidian";
import type { Citation as CitationRecord } from "@/components/product/CitationsCard";
import { toast } from "@/lib/notify";
import { getPrd, type CriticReview } from "@/lib/discovery.functions";
import { DetailSection, StatCell, StatStrip, type StatTone } from "@/components/discover/DetailKit";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { relTimeCaps, traceRef, verdictFor, type VerdictWord } from "@/components/discover/format";
import { stateChip, splitCitationMarkers, specRecommendation, type SpecStateTone } from "./format";

export interface SpecDetailProps {
  id: string | null;
  onClose: () => void;
}

/** The real prds columns the detail reads (getPrd returns select("*")). */
interface SpecRecord {
  id: string;
  title: string;
  status: string;
  body_md: string | null;
  opportunity_id: string | null;
  critic_review: CriticReview | null;
  citations: CitationRecord[] | null;
  created_at: string;
  updated_at: string;
}

/** The spec's own lifecycle tone -> a stat-cell tone. */
const STATE_STAT_TONE: Record<SpecStateTone, StatTone> = {
  moss: "moss",
  marigold: "amber",
  glacier: "glacier",
};
/** The spec's own lifecycle tone -> the status pill color token. */
const STATE_PILL_COLOR: Record<SpecStateTone, string> = {
  moss: "var(--moss)",
  marigold: "var(--amber)",
  glacier: "var(--glacier)",
};

/** VerdictWord -> a stat-cell tone (shared with the Today + Decide sheets). */
function verdictTone(v: VerdictWord): StatTone {
  if (v === "SHIP") return "moss";
  if (v === "REVISE" || v === "KILL") return "madder";
  if (v === "WATCH") return "glacier";
  return "muted";
}

/** A quiet mono-caps status pill, so the spec's stage reads without a menu. */
function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color,
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

/** Replace `[n]` markers in already-rendered text children with real `Citation` chips. */
function withCitations(children: ReactNode, citations: CitationRecord[]): ReactNode {
  const byIndex = new Map(citations.map((c) => [c.n, c]));
  const toNodes = (child: ReactNode, key: number): ReactNode => {
    if (typeof child !== "string") return child;
    const segments = splitCitationMarkers(child);
    if (segments.length === 1 && segments[0].type === "text") return child;
    return segments.map((seg, i) => {
      if (seg.type === "text") return <span key={`${key}-${i}`}>{seg.value}</span>;
      const record = byIndex.get(seg.index);
      if (!record) return <span key={`${key}-${i}`}>[{seg.index}]</span>;
      return (
        <Citation
          key={`${key}-${i}`}
          index={seg.index}
          source={record.title ?? `${record.source_kind} · ${record.source_id?.slice(0, 8) ?? "-"}`}
          quote={record.snippet ?? ""}
        />
      );
    });
  };
  if (Array.isArray(children)) return children.map((c, i) => toNodes(c, i));
  return toNodes(children, 0);
}

/**
 * OBS-07 §5 step 6 + dim 17 (design-anatomy §3): the read-only spec detail,
 * rebuilt on the shared DetailKit anatomy so it reads identically to the
 * Decide opportunity sheet and the Today call sheet. The SlideOver chassis
 * carries the title; beneath it, in the DetailKit order, come the quiet meta
 * row (status + Critic chips, the copyable PRD trace ref, the present-tone
 * time), the glacier recommendation band, the stat strip (stage, Critic,
 * sources), then the supporting sections: where it came from, the Critic's
 * take, the spec itself (Newsreader serif with inline `[n]` citation chips),
 * and the activity. Editing stays in the full editor at `/plan/spec/$id`.
 * Every field maps to a real prds column; an absent value renders nothing.
 */
export function SpecDetail({ id, onClose }: SpecDetailProps) {
  const fGetPrd = useServerFn(getPrd);
  const prdQuery = useQuery({
    queryKey: ["prd", id],
    queryFn: () => fGetPrd({ data: { id: id! } }),
    enabled: !!id,
  });

  const prd = prdQuery.data?.prd as SpecRecord | undefined;
  const citations = prd?.citations ?? [];
  const chip = prd ? stateChip(prd.status) : null;
  const verdict: VerdictWord = prd
    ? verdictFor({ status: prd.status, critic_review: prd.critic_review })
    : "PENDING";

  const copyTraceId = () => {
    if (!prd) return;
    void navigator.clipboard?.writeText(prd.id);
    toast.success("Trace id copied");
  };

  return (
    <SlideOver
      open={!!id}
      onClose={onClose}
      title={prd?.title ?? "Spec"}
      footer={
        id ? (
          <div className="flex items-center justify-between">
            <Link
              to="/plan/spec/$id"
              params={{ id }}
              style={{ color: "var(--glacier)", fontFamily: "var(--font-mono)", fontSize: 11 }}
            >
              Open full spec →
            </Link>
            <span>Esc closes</span>
          </div>
        ) : undefined
      }
    >
      {prdQuery.isError ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD SPEC
        </div>
      ) : prdQuery.isLoading || !prd || !chip ? (
        <div role="status" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="sr-only">Loading the spec…</span>
          {["90%", "100%", "70%"].map((width) => (
            <div
              key={width}
              aria-hidden="true"
              style={{
                height: 14,
                borderRadius: 4,
                width,
                backgroundImage: "var(--shimmer-gradient)",
                backgroundSize: "280% 100%",
                animation: "cadShimmer 5s linear infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px", marginTop: "2px" }}>
          {/* Meta row (DetailHeader's meta, minus the title the SlideOver shows):
              the colored state chips left, the present-tone time and faint
              copyable PRD trace ref right. */}
          <div className="flex flex-wrap items-center" style={{ gap: "8px" }}>
            <StatusPill label={chip.label} color={STATE_PILL_COLOR[chip.tone]} />
            <VerdictChip tone={verdict} />
            <span className="flex items-center" style={{ marginLeft: "auto", gap: "10px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  letterSpacing: "0.06em",
                  color: "var(--text-subtle)",
                }}
              >
                UPDATED {relTimeCaps(prd.updated_at)}
              </span>
              <button
                type="button"
                onClick={copyTraceId}
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
                PRD·{traceRef(prd.id)}
                <Copy className="h-3 w-3" />
              </button>
            </span>
          </div>

          {/* Recommendation band: calm glacier tint (never amber), the system's
              read on what to do next with this spec. */}
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
                Recommended
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
                {specRecommendation(prd.status)}
              </span>
            </div>
            {prd.critic_review?.summary ? (
              <p
                style={{
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  color: "var(--text-subtle)",
                  margin: 0,
                }}
              >
                {prd.critic_review.summary}
              </p>
            ) : null}
          </div>

          {/* The glanceable summary row. */}
          <StatStrip columns={3}>
            <StatCell label="Stage" value={chip.label} tone={STATE_STAT_TONE[chip.tone]} />
            <StatCell label="Critic" value={verdict} tone={verdictTone(verdict)} />
            <StatCell
              label="Sources"
              value={String(citations.length)}
              tone={citations.length > 0 ? "moss" : "muted"}
            />
          </StatStrip>

          {/* Provenance: honest, from opportunity_id only. The full chain to the
              source signals lives one layer deeper, in the full spec editor. */}
          <DetailSection heading="Where it came from">
            <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
              {prd.opportunity_id
                ? "Promoted from a Decide opportunity. Open the full spec to trace it back to the source signals."
                : "Added directly, not promoted from a ranked opportunity."}
            </span>
          </DetailSection>

          {/* Critic: verdict + summary if present, honest empty otherwise. */}
          <DetailSection heading="Critic">
            <div style={{ display: "grid", gap: "9px" }}>
              <VerdictChip tone={verdict} style={{ justifySelf: "start" }} />
              {prd.critic_review?.summary ? (
                <p
                  style={{
                    fontSize: "12.5px",
                    lineHeight: 1.6,
                    color: "var(--text-body)",
                    margin: 0,
                  }}
                >
                  {prd.critic_review.summary}
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
                  Not yet reviewed by the Critic. Open the full spec to challenge it and get an
                  evidence-backed teardown.
                </p>
              )}
            </div>
          </DetailSection>

          {/* The spec itself: the Newsreader serif body with inline citation chips. */}
          <DetailSection heading="The spec">
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--text-body)",
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: "0 0 12px" }}>{withCitations(children, citations)}</p>
                  ),
                  li: ({ children }) => <li>{withCitations(children, citations)}</li>,
                  h1: ({ children }) => (
                    <h1 style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                      {children}
                    </h3>
                  ),
                }}
              >
                {prd.body_md || "_Empty spec_"}
              </ReactMarkdown>
            </div>
          </DetailSection>

          {/* Stage history: real per-transition rows; renders nothing until
              the first transition lands. */}
          <StageTimeline entityType="spec" entityId={prd.id} />

          {/* Activity: when it was drafted and last changed. */}
          <DetailSection heading="Activity">
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "grid", gap: "3px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Drafted</span>
                <TimeLine iso={prd.created_at} />
              </div>
              <div style={{ display: "grid", gap: "3px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Last updated</span>
                <TimeLine iso={prd.updated_at} />
              </div>
            </div>
          </DetailSection>
        </div>
      )}
    </SlideOver>
  );
}
