import * as React from "react";
import { Link } from "@tanstack/react-router";
import type { AnswerBlock, TimelineEvent } from "@/lib/ask-blocks";
import { MonoLabel } from "./primitives";
import { runStatusLabel } from "./ask-canvas";
import { AuditTag } from "@/components/supaprod/AuditTag";

// PC-36 workstream C - receipts-first typed answer cards for the 420px Ask
// panel. Each card is a sibling of ProgressBlock/MemoryBlock/CriticBlock in
// ask-canvas.tsx: the same recessed block anatomy, the same compact mono
// register. Every entity card carries its clickable AuditTag - the tag IS the
// receipt. Pure presentational (props in, JSX out): no queries, no hooks, so
// entity pages can reuse any card later. Statuses render as muted mono words,
// never color-coded (status color belongs to status dots, not answer cards).

type DecisionBlock = Extract<AnswerBlock, { kind: "decision" }>;
type OpportunityBlock = Extract<AnswerBlock, { kind: "opportunity" }>;
type MissionBlock = Extract<AnswerBlock, { kind: "mission" }>;
type StatusBlock = Extract<AnswerBlock, { kind: "status" }>;
type TimelineBlockData = Extract<AnswerBlock, { kind: "timeline" }>;

// Mirrors BLOCK_STYLE in ask-canvas.tsx (not exported there); kept verbatim
// so these cards read as siblings of the existing Ask blocks.
const BLOCK_STYLE: React.CSSProperties = {
  background: "var(--surface-recessed)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "10px 12px",
};

const TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginTop: 6,
};

// Quiet right-aligned footer metadata (decidedBy, dates, ICE score).
const FOOTER_META_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.05em",
  color: "var(--text-faint)",
  whiteSpace: "nowrap",
};

/** Body copy clamped to a fixed line budget: present, never a wall of prose. */
function clampStyle(lines: number): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    lineHeight: 1.5,
    color: "var(--text-muted)",
    marginTop: 4,
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

/** Short en-US date ("Jul 14"); empty string for an unparseable timestamp. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CardHeader({ kind, status }: { kind: string; status?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <MonoLabel tone="muted">{kind}</MonoLabel>
      {status ? <MonoLabel tone="muted">{status}</MonoLabel> : null}
    </div>
  );
}

function CardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 8, marginTop: 8 }}>
      {children}
    </div>
  );
}

export function DecisionBlockCard({ block }: { block: DecisionBlock }) {
  const decided = [
    block.decidedBy ? `by ${block.decidedBy}` : null,
    shortDate(block.createdAt) || null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div style={BLOCK_STYLE}>
      <CardHeader kind="DECISION" status={block.status} />
      <div style={TITLE_STYLE}>{block.title}</div>
      {block.rationale ? <div style={clampStyle(3)}>{block.rationale}</div> : null}
      <CardFooter>
        <AuditTag kind="decision" id={block.id} />
        {decided ? <span style={FOOTER_META_STYLE}>{decided}</span> : null}
      </CardFooter>
    </div>
  );
}

export function OpportunityBlockCard({ block }: { block: OpportunityBlock }) {
  return (
    <div style={BLOCK_STYLE}>
      <CardHeader kind="OPPORTUNITY" status={block.status} />
      <div style={TITLE_STYLE}>{block.title}</div>
      <CardFooter>
        <AuditTag kind="opportunity" id={block.id} />
        {block.iceScore != null ? (
          <span style={FOOTER_META_STYLE}>ICE {block.iceScore}</span>
        ) : null}
      </CardFooter>
    </div>
  );
}

export function MissionBlockCard({ block }: { block: MissionBlock }) {
  return (
    <div style={BLOCK_STYLE}>
      <CardHeader kind="MISSION" status={runStatusLabel(block.status)} />
      <div style={TITLE_STYLE}>{block.title}</div>
      {block.goal ? <div style={clampStyle(2)}>{block.goal}</div> : null}
      <CardFooter>
        <AuditTag kind="mission" id={block.id} />
        <Link
          to="/build/$missionId"
          params={{ missionId: block.id }}
          style={{
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.11em",
            color: "var(--glacier)",
            whiteSpace: "nowrap",
          }}
        >
          Open in Build →
        </Link>
      </CardFooter>
    </div>
  );
}

const COUNT_WORDS = ["RUNNING", "WAITING", "DONE", "FAILED"] as const;

export function StatusDigestBlock({ block }: { block: StatusBlock }) {
  const counts = [
    block.counts.running,
    block.counts.waiting,
    block.counts.done,
    block.counts.failed,
  ];
  return (
    <div style={BLOCK_STYLE}>
      <MonoLabel tone="muted">{block.scopeLabel.toUpperCase()}</MonoLabel>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
          color: "var(--text-subtle)",
          marginTop: 8,
        }}
      >
        {COUNT_WORDS.map((word, i) => (
          <React.Fragment key={word}>
            {i > 0 ? " · " : ""}
            <span style={{ color: "var(--text-primary)" }}>{counts[i]}</span> {word}
          </React.Fragment>
        ))}
      </div>
      {block.running.length > 0 ? (
        <div className="flex flex-col" style={{ gap: 5, marginTop: 8 }}>
          {block.running.slice(0, 4).map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              {/* Not the obsidian StatusDot: its API requires a paired mono
                  status word per row and a typed StatusState; this row wants
                  a bare presence dot + title, so a plain glacier dot. */}
              <span
                aria-hidden="true"
                className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ backgroundColor: "var(--glacier)" }}
              />
              <span
                className="min-w-0 flex-1 truncate"
                style={{ fontFamily: "var(--font-sans)", color: "var(--text-body)" }}
              >
                {r.title}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  return (
    <div className="flex items-baseline" style={{ gap: 8 }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--text-faint)",
          width: 52,
          flexShrink: 0,
        }}
      >
        {shortDate(event.at)}
      </span>
      <span
        className="min-w-0 truncate"
        style={{ fontFamily: "var(--font-sans)", color: "var(--text-body)" }}
      >
        {event.label}
      </span>
      {event.ref ? (
        // The ref arrives pre-formatted ("DEC·A1B2C3") without the raw uuid a
        // clickable AuditTag needs, so it renders as a static receipt marker
        // (honest: no dead click affordance in v1).
        <span
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.06em",
            color: "var(--text-subtle)",
            flexShrink: 0,
          }}
        >
          {event.ref}
        </span>
      ) : null}
      {event.detail ? (
        <span
          className="min-w-0 truncate"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-subtle)" }}
        >
          {event.detail}
        </span>
      ) : null}
    </div>
  );
}

export function TimelineBlock({ block }: { block: TimelineBlockData }) {
  return (
    <div style={BLOCK_STYLE}>
      <CardHeader kind="TIMELINE" status={block.label} />
      <div className="flex flex-col" style={{ gap: 5, marginTop: 8 }}>
        {block.events.map((event, i) => (
          <TimelineRow key={`${event.at}-${i}`} event={event} />
        ))}
      </div>
    </div>
  );
}

export function AnswerBlocks({ blocks }: { blocks: AnswerBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <div className="flex w-full flex-col" style={{ gap: 8 }}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "decision":
            return <DecisionBlockCard key={`decision-${block.id}`} block={block} />;
          case "opportunity":
            return <OpportunityBlockCard key={`opportunity-${block.id}`} block={block} />;
          case "mission":
            return <MissionBlockCard key={`mission-${block.id}`} block={block} />;
          case "status":
            return <StatusDigestBlock key={`status-${i}`} block={block} />;
          case "timeline":
            return <TimelineBlock key={`timeline-${i}`} block={block} />;
        }
      })}
    </div>
  );
}
