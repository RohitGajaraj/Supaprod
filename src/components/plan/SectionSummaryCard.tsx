import { ChevronRight } from "lucide-react";

/**
 * IA SPINE (2026-07-11): the collapsed face of a Plan section. One quiet
 * summary card (count + last activity) that expands the full panel on demand.
 * Tempo: material-base, text-label-14 + 12.5 detail, 16px/1.5px lucide,
 * focus ring never removed, transform/color-only hover so reduced motion and
 * the grayscale test both pass.
 */
export function SectionSummaryCard({
  label,
  primary,
  detail,
  loading = false,
  onExpand,
}: {
  /** Accessible action name, e.g. "Show goals". */
  label: string;
  /** The count line, e.g. "3 goals". */
  primary: string;
  /** The last-activity line, e.g. "Last worked Jul 10, 2:14 PM". */
  detail?: string | null;
  loading?: boolean;
  onExpand?: () => void;
}) {
  if (loading) {
    return (
      <div role="status" className="material-base" style={{ height: 56, opacity: 0.4 }}>
        <span className="sr-only">{primary}</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={label}
      className="material-base loom-press group w-full text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          className="text-label-14 transition-colors group-hover:[color:var(--text-primary)]"
          style={{ display: "block", color: "var(--text-primary)" }}
        >
          <strong>{primary}</strong>
        </span>
        {detail ? (
          <span
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 12.5,
              color: "var(--text-subtle)",
            }}
          >
            {detail}
          </span>
        ) : null}
      </span>
      <ChevronRight
        size={16}
        strokeWidth={1.5}
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-0.5 group-hover:[color:var(--text-primary)]"
        style={{ flexShrink: 0, color: "var(--text-subtle)" }}
      />
    </button>
  );
}
