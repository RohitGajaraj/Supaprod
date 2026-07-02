import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { VerdictChip, MonoLabel } from "@/components/obsidian";
import { listSpecs } from "@/lib/discovery.functions";
import { relTime } from "@/components/product/format";
import { stateChip, citesLabel } from "./format";

export interface SpecListProps {
  onOpen: (id: string) => void;
}

// SpecStateTone -> a VerdictChip tone resolving to the same hue (VALIDATED/CRITIC
// REVIEW/DRAFTING share the exact moss/marigold/glacier hexes stateChip names;
// there is no "APPROVED"/"SHIPPED" VerdictTone, so the chip's own `children`
// (chip.label) carries the exact word — this only picks the color family.
const TONE_TO_VERDICT = {
  moss: "VALIDATED",
  marigold: "CRITIC REVIEW",
  glacier: "DRAFTING",
} as const;

/** OBS-07 §5 step 5: the cited spec list. Shares `["prds"]` with the parchment SpecsPanel. */
export function SpecList({ onOpen }: SpecListProps) {
  const fSpecs = useServerFn(listSpecs);
  const specs = useQuery({ queryKey: ["prds"], queryFn: () => fSpecs() });

  if (specs.isLoading) {
    return (
      <div role="status" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span className="sr-only">Loading specs…</span>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{ height: 44, borderBottom: "1px solid var(--hairline)", opacity: 0.4 }}
          />
        ))}
      </div>
    );
  }

  if (specs.isError) {
    return (
      <div
        style={{
          padding: 24,
          background: "var(--surface-card-deep)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD PLAN
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          {(specs.error as Error)?.message}
        </p>
        <button
          type="button"
          onClick={() => specs.refetch()}
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--glacier)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry · reloads the surface
        </button>
      </div>
    );
  }

  const specList = specs.data?.prds ?? [];

  if (specList.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          No specs yet. Approve an opportunity and Scribe drafts the first one, cited, in about five
          minutes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-panel)" }}>
      {specList.map((spec, i) => {
        const chip = stateChip(spec.status);
        const cites = citesLabel(spec.citations);
        return (
          <button
            key={spec.id}
            type="button"
            onClick={() => onOpen(spec.id)}
            className="w-full text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "14px 18px",
              borderBottom: i < specList.length - 1 ? "1px solid var(--hairline)" : "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              transitionProperty: "background-color",
              transitionDuration: "var(--dur-control)",
              transitionTimingFunction: "var(--ease)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {spec.title}
            </span>
            <VerdictChip tone={TONE_TO_VERDICT[chip.tone]}>{chip.label}</VerdictChip>
            {cites && (
              <MonoLabel tone="blossom" style={{ fontSize: 9 }}>
                {cites}
              </MonoLabel>
            )}
            <MonoLabel tone="faint" style={{ fontSize: 9 }}>
              {relTime(spec.updated_at)}
            </MonoLabel>
          </button>
        );
      })}
    </div>
  );
}
