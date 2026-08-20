// Shared Ember Editorial primitives — ported 1:1 from
// design-reference/supaprod/icons.jsx (the design of record). Values are the
// reference's; do not retune here — change the reference first.
import type { CSSProperties, ReactNode } from "react";
import { FlashlightTabs } from "@/components/obsidian/flashlight-tabs";
import { Button } from "@/components/ui/button";

/* MonoLabel — uppercase mono metadata row, optional leading icon. The icon
   prop takes a lucide component (production icon set, 1.75 stroke). */
export function MonoLabel({
  icon: Icon,
  children,
  style,
  className,
}: {
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`mono-label ${className ?? ""}`}
      style={{ display: "flex", alignItems: "center", gap: 6, ...style }}
    >
      {Icon ? <Icon size={16} strokeWidth={1.5} /> : null}
      <span>{children}</span>
    </div>
  );
}

export type StepStatus = "running" | "completed" | "planned" | "failed" | "gate";

/* StepDot — 7px status dot; color roles per the design contract. */
export function StepDot({ status }: { status: StepStatus | string }) {
  const cls =
    (
      {
        running: "dot-running",
        completed: "dot-completed",
        planned: "dot-planned",
        failed: "dot-failed",
        gate: "dot-gate",
      } as Record<string, string>
    )[status] || "dot-planned";
  return <span className={`dot ${cls}`} />;
}

/* StatusBadge — mono pill + dot. Status vocabulary from the reference. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; fg: string; pulse?: boolean }> = {
    running: { label: "running", fg: "var(--action-blue)", pulse: true },
    queued: { label: "queued", fg: "var(--ink-subtle)" },
    awaiting_review: { label: "needs you", fg: "var(--coral)", pulse: true },
    gate: { label: "at gate", fg: "var(--coral)", pulse: true },
    completed: { label: "completed", fg: "var(--emerald)" },
    failed: { label: "failed", fg: "var(--rose)" },
    cancelled: { label: "cancelled", fg: "var(--ink-subtle)" },
    planned: { label: "planned", fg: "var(--ink-faint)" },
    waiting: { label: "waiting", fg: "var(--coral)" },
    idle: { label: "idle", fg: "var(--ink-faint)" },
  };
  const v = map[status] || map.planned;
  // Migrate Loom tokens to Tempo
  const colorMap: Record<string, string> = {
    "var(--ink-subtle)": "var(--ds-gray-900)",
    "var(--action-blue)": "var(--ds-blue-600)",
    "var(--coral)": "var(--ds-red-600)",
    "var(--emerald)": "var(--ds-green-600)",
    "var(--rose)": "var(--ds-red-600)",
    "var(--ink-faint)": "var(--ds-gray-700)",
  };
  const mappedColor = colorMap[v.fg] || v.fg;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontWeight: 600,
        color: mappedColor,
        border: `1px solid color-mix(in oklab, ${mappedColor} 35%, transparent)`,
        borderRadius: 99,
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className={`dot ${v.pulse ? "dot-gate" : ""}`}
        style={{ width: 5, height: 5, background: mappedColor }}
      />
      {v.label}
    </span>
  );
}

/* VerdictChip — founder ruling 2026-06-12: the inline annotation pattern
   (KEEP / CORRECT / ADD NEXT). A mono-caps OUTLINE pill that classifies the
   content it precedes — a rendered judgment, not live state (live state with
   a pulse dot is StatusBadge). No fill, no dot, no icon; the role color IS
   the meaning:
     moss    confirmed / keep / validated / ship
     ember   needs correction / the human's call
     indigo  next action / do this now
     machine agent-performed (machine blue; the "orchid" violet is retired, 2026-07-11)
     saffron highlight / celebrate
     madder  failed / missed / kill
   Full usage rules: DESIGN.md "Inline verdict chips". */
export type VerdictTone = "moss" | "ember" | "indigo" | "machine" | "saffron" | "madder";

// "indigo" resolves to a neutral gray, not action-blue (Tempo v5
// DESIGN-TEMPO.md §2 glacier/machine-voice narrowing, 2026-07-11):
// action-blue's sanctioned scope is literal live/running status + links, and
// a "next action" verdict is neither, it is a rendered judgment (see the
// doc comment above), so it defaults to neutral like any other decoration.
// Uses --text-subtle (not --ink/--text-primary) so the tone stays visually
// distinct from surrounding body text - "the role color IS the meaning"
// only holds if the color actually reads as different from plain copy.
const VERDICT_TONES: Record<VerdictTone, string> = {
  moss: "var(--emerald)",
  ember: "var(--ember)",
  indigo: "var(--text-subtle)",
  machine: "var(--agent)",
  saffron: "var(--saffron)",
  madder: "var(--rose)",
};

export function VerdictChip({
  tone,
  children,
  selected = false,
  style,
}: {
  tone: VerdictTone;
  children: ReactNode;
  /** Picker/selected state — gains a quiet fill of the same role color. */
  selected?: boolean;
  style?: CSSProperties;
}) {
  const fg = VERDICT_TONES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontWeight: 600,
        color: fg,
        border: `1px solid color-mix(in oklab, ${fg} 40%, transparent)`,
        background: selected ? `color-mix(in oklab, ${fg} 10%, transparent)` : "transparent",
        borderRadius: 99,
        padding: "2px 9px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* SurfaceHeader — the loop-screen header: mono kicker, Geist Sans h1, one-line
   sub. Tempo weight (600, tight tracking); the old editorial 430 weight is
   retired. */
export function SurfaceHeader({
  kicker,
  icon,
  title,
  sub,
}: {
  kicker: ReactNode;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  title: ReactNode;
  sub: ReactNode;
}) {
  return (
    <header style={{ marginBottom: 26 }}>
      <MonoLabel icon={icon}>{kicker}</MonoLabel>
      <h1 className="text-heading-24" style={{ marginTop: 7 }}>
        {title}
      </h1>
      <p style={{ color: "var(--ds-gray-900)", marginTop: 3, maxWidth: 520 }}>{sub}</p>
    </header>
  );
}

/* TabRow — hairline tab bar with ember underline + per-tab description line.
   Ported 1:1 from design-reference/supaprod/loop.jsx (TabRow). Production
   addition: tabs may be { id, label, badge } so search-param ids and live
   counts (a production affordance the reference lacks) ride the reference
   visuals — the badge renders as a quiet mono tabular count. */
export type TabRowItem = { id: string; label: string; badge?: number };

export function TabRow({
  tabs,
  active,
  onSet,
  desc,
}: {
  tabs: (string | TabRowItem)[];
  active: string;
  onSet: (id: string) => void;
  desc?: Record<string, ReactNode>;
}) {
  const items: TabRowItem[] = tabs.map((t) => (typeof t === "string" ? { id: t, label: t } : t));
  return (
    <div style={{ marginBottom: 20 }}>
      <FlashlightTabs
        tabs={items.map((t) => ({
          id: t.id,
          label: t.label,
          badge: t.badge ?? undefined,
        }))}
        active={active}
        onSelect={onSet}
      />
      {desc && desc[active] ? (
        <p style={{ color: "var(--ds-gray-700)", marginTop: 8 }}>{desc[active]}</p>
      ) : null}
    </div>
  );
}

/* EmptyState — bento empty slate with icon tile, pixel title, single CTA.
   Ported from design-reference/supaprod/loop.jsx (EmptyState); title face
   moved to Geist Pixel per DESIGN-TEMPO §3 (empty-state headlines are a
   sanctioned brand moment). U7 (2026-07-11): the Pixel headline is a
   VARIANT, on by default because an empty screen is usually the surface's
   only brand moment, but a surface that already renders another Pixel
   element (a hero numeral, a stat trio, a shimmer working word) MUST pass
   pixel={false} to stay inside the one-Pixel-per-screen budget. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
  onCta,
  pixel = true,
}: {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  title: ReactNode;
  body: ReactNode;
  cta: ReactNode;
  onCta: () => void;
  /** Geist Pixel headline (the brand-moment variant). Pass false when the
   *  host screen already carries a Pixel element. */
  pixel?: boolean;
}) {
  return (
    <div className="bento" style={{ padding: 48, textAlign: "center" }}>
      <span
        style={{
          display: "inline-flex",
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "var(--ds-gray-100)",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ds-gray-900)",
          marginBottom: 14,
        }}
      >
        <Icon size={16} />
      </span>
      {/* Titles stay a few words: Pixel is display-only, never multi-line copy.
          A surface showing EmptyState must not simultaneously render another
          Pixel flourish (max 1 per screen); opt out via pixel={false} if it
          does. Body and CTA stay Geist Sans in both variants. */}
      <h3
        style={
          pixel
            ? { fontFamily: "var(--font-pixel)", fontWeight: 400 }
            : { fontWeight: 600, letterSpacing: "-0.01em" }
        }
      >
        {title}
      </h3>
      <p
        style={{
          color: "var(--ds-gray-900)",
          margin: "6px auto 16px",
          maxWidth: 360,
        }}
      >
        {body}
      </p>
      <Button variant="accent" onClick={onCta}>
        {cta}
      </Button>
    </div>
  );
}

/* RiskTag — low / medium / high risk grade on approval cards. Ported 1:1
   from design-reference/supaprod/loop.jsx (RiskTag). */
export function RiskTag({ risk }: { risk: string }) {
  const map: Record<string, [string, string]> = {
    low: ["var(--emerald)", "low risk"],
    medium: ["var(--ember)", "medium risk"],
    high: ["var(--rose)", "high risk"],
  };
  const [c, label] = map[risk] || map.medium;
  return (
    <span
      className="mono-label"
      style={{
        color: c,
        border: `1px solid color-mix(in oklab, ${c} 45%, transparent)`,
        borderRadius: 99,
        padding: "1px 7px",
      }}
    >
      {label}
    </span>
  );
}

/* DrillHeader: drill-down screen header. neutral mono back link (Tempo v5
   glacier/machine-voice narrowing, 2026-07-11. this is navigation chrome,
   not a literal live/running status, so it stays gray), kicker,
   serif 21 title, optional right-slot action. Ported 1:1 from
   design-reference/supaprod/govern-detail.jsx (DrillHeader); used by BOTH the
   loop-detail and govern-detail drill-downs (screens 6 + 7). */
export function DrillHeader({
  onBack,
  backLabel,
  kicker,
  title,
  right,
}: {
  onBack: () => void;
  backLabel: ReactNode;
  kicker: ReactNode;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        className="mono-label"
        style={{ color: "var(--ds-gray-900)", marginBottom: 10 }}
        onClick={onBack}
      >
        ← {backLabel}
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--geist-space-3x)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <MonoLabel>{kicker}</MonoLabel>
          <div className="text-heading-20" style={{ marginTop: 2 }}>
            {title}
          </div>
        </div>
        {right || null}
      </div>
    </div>
  );
}

/* SubTabs — pill-row sub-navigation inside a drill-down (Runs / Failing
   cases / Config). Ported 1:1 from design-reference/supaprod/govern-detail.jsx
   (SubTabs); active pill fills primary-ink with canvas text. */
export function SubTabs({
  tabs,
  active,
  onSet,
}: {
  tabs: string[];
  active: string;
  onSet: (tab: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onSet(t)}
          className="mono-label"
          style={{
            padding: "5px 11px",
            borderRadius: 99,
            color: t === active ? "var(--ds-background-100)" : "var(--ds-gray-900)",
            background: t === active ? "var(--ds-gray-1000)" : "transparent",
            border: `1px solid ${t === active ? "transparent" : "var(--ds-gray-500)"}`,
            transition: "background var(--dur-fast), color var(--dur-fast)",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* Cite — [n] chip with hover evidence card. Production passes the evidence
   in (source name + verbatim quote) instead of the prototype's window data. */
export function Cite({ n, source, body }: { n: number | string; source?: string; body?: string }) {
  return (
    <span className="cite">
      [{n}]
      {source ? (
        <span className="cite-pop">
          <strong style={{ color: "var(--ds-gray-1000)", display: "block", marginBottom: 2 }}>
            {source}
          </strong>
          {body}
        </span>
      ) : null}
    </span>
  );
}
