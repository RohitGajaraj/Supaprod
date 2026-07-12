/**
 * BYO-P1d — Engine Room Disclosure for the Build surface.
 *
 * Engine-Room doctrine: name the outcome, not the mechanism. PR numbers, CI
 * check lists, branch names, and merge controls are real — they belong behind
 * ONE recessed toggle, not at the same visual level as the changes.
 *
 * Outside (always visible):
 *  - A single "Quality checks" verdict badge (pass / checking / fail)
 *  - Shipped outcome line when the changeset is merged
 *
 * Inside (expanded on demand):
 *  - The full CiPanel (PR link, per-check rows, refresh, merge gate pointer)
 *
 * Engine-Room: yes — CI machinery behind one door.
 *
 * LOOM v4 (W2-BUILD): the last parchment-era styling on the Build spine —
 * emerald/amber Tailwind tints read as light-theme islands on the Obsidian
 * canvas. Ported to role tokens: outcomes wear moss/madder (VerdictChip law),
 * a live check wears the machine's glacier, chrome is hairline + recessed
 * surface + top-light, and the toggle presses (§5).
 */
import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Rocket } from "lucide-react";
import { CiPanel } from "./CiPanel";
import { MonoLabel, VerdictChip } from "@/components/cadence/Primitives";
import type { StudioChangesetSummary, StudioCi } from "@/lib/studio.functions";
import type { Inspection } from "@/lib/ai/studio-inspection";

type Props = {
  missionId: string;
  changeset: StudioChangesetSummary | null;
  ci: StudioCi;
  inspection: Inspection | null;
  mergeGatePending: boolean;
  onRefreshed: () => void;
};

function QualityBadge({ ci }: { ci: StudioCi }) {
  if (!ci) return null;
  if (ci.overall === "success")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--moss)",
        }}
      >
        <CheckCircle2 size={12} />
        Quality checks passed
      </span>
    );
  if (ci.overall === "failure")
    return (
      <VerdictChip tone="madder">
        <XCircle size={10} style={{ marginRight: 2 }} />
        Checks failed
      </VerdictChip>
    );
  if (ci.overall === "pending")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--glacier)",
        }}
      >
        <span className="spinner" style={{ width: 11, height: 11 }} />
        Checking quality…
      </span>
    );
  return null;
}

function ShippedLine({ changeset }: { changeset: StudioChangesetSummary | null }) {
  if (changeset?.status !== "merged") return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        padding: "8px 12px",
        borderRadius: "var(--radius-control)",
        background: "color-mix(in oklab, var(--moss) 10%, transparent)",
        border: "1px solid color-mix(in oklab, var(--moss) 30%, transparent)",
        fontSize: 13,
        color: "var(--moss)",
      }}
    >
      <Rocket size={13} style={{ flexShrink: 0 }} />
      <span>
        Shipped
        {changeset.pr_number != null ? ` via PR #${changeset.pr_number}` : ""}.
        {changeset.branch ? (
          <span
            className="tabular-nums"
            style={{
              marginLeft: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "color-mix(in oklab, var(--moss) 75%, var(--text-muted))",
            }}
          >
            {changeset.branch}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function EngineRoomDisclosure({
  missionId,
  changeset,
  ci,
  inspection,
  mergeGatePending,
  onRefreshed,
}: Props) {
  const [open, setOpen] = useState(false);

  const showBadge = ci && ci.overall !== "neutral";
  const isShipped = changeset?.status === "merged";

  if (!showBadge && !isShipped) {
    return (
      <div
        style={{
          border: "1px dashed var(--hairline)",
          borderRadius: 12,
          padding: "24px 0",
          marginTop: 12,
          textAlign: "center",
          fontSize: 12.5,
          color: "var(--text-subtle)",
        }}
      >
        No PR yet. The session opens one after the changeset commits.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <ShippedLine changeset={changeset} />

      {showBadge && !isShipped && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          // Hover lives in the class (never inline) so it can resolve; the
          // Tailwind preflight already gives the button a transparent base.
          className="loom-press outline-none rounded-[var(--radius-control)] transition-colors hover:[background:var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            textAlign: "left",
            padding: "6px 8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {open ? (
            <ChevronDown size={12} style={{ color: "var(--text-subtle)", flexShrink: 0 }} />
          ) : (
            <ChevronRight size={12} style={{ color: "var(--text-subtle)", flexShrink: 0 }} />
          )}
          <QualityBadge ci={ci} />
          {!open && (
            <span
              className="mono-label"
              style={{
                marginLeft: "auto",
                fontSize: "var(--text-mono-floor)",
                color: "var(--text-faint)",
              }}
            >
              details
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          className="fade-up"
          style={{
            marginTop: 8,
            borderRadius: "var(--radius-panel)",
            overflow: "hidden",
            background: "var(--surface-recessed)",
            boxShadow: "var(--top-light)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <MonoLabel>Engine Room</MonoLabel>
            <span
              className="mono-label"
              style={{
                fontSize: "var(--text-mono-floor)",
                color: "var(--text-faint)",
                whiteSpace: "normal",
              }}
            >
              PR, checks, and merge controls
            </span>
          </div>
          <div style={{ padding: 12 }}>
            <CiPanel
              missionId={missionId}
              changeset={changeset}
              ci={ci}
              inspection={inspection}
              mergeGatePending={mergeGatePending}
              onRefreshed={onRefreshed}
            />
          </div>
        </div>
      )}
    </div>
  );
}
