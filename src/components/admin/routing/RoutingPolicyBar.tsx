/**
 * The operator policy row above the routing table (architecture §10, brief
 * §11): what should happen automatically when a cheaper, equal-or-better
 * model is found for a surface. Three states, always visible, never a
 * buried setting (taste commitment 3).
 */
import type { RoutingPolicyMode } from "@/lib/routing-console.functions";

const POLICIES: Array<{ mode: RoutingPolicyMode; label: string; hint: string }> = [
  {
    mode: "auto-adopt",
    label: "Auto-adopt cheaper, equal",
    hint: "Switches a surface to the cheaper model automatically, then reports it here.",
  },
  {
    mode: "suggest",
    label: "Suggest only",
    hint: "Shows the recommendation. You apply it by hand.",
  },
  {
    mode: "hold",
    label: "Hold",
    hint: "No recommendations act on anything. Pins stay exactly as set.",
  },
];

export function RoutingPolicyBar({
  value,
  onChange,
  disabled,
}: {
  value: RoutingPolicyMode;
  onChange: (mode: RoutingPolicyMode) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="ink-panel"
      style={{ padding: "var(--space-3, 12px)", display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      {POLICIES.map((p) => {
        const active = p.mode === value;
        return (
          <button
            key={p.mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p.mode)}
            title={p.hint}
            aria-pressed={active}
            className="ink-focus"
            style={{
              fontFamily: "var(--font-sans)",
              lineHeight: 1.4,
              padding: "8px 14px",
              borderRadius: "var(--ink-radius-control)",
              border: active
                ? "1px solid var(--voice-human-border)"
                : "1px solid var(--ink-hairline)",
              background: active ? "var(--voice-human-soft)" : "transparent",
              color: active ? "var(--ink-text)" : "var(--ink-body)",
              cursor: disabled ? "default" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
