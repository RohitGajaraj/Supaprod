import { useMachineView } from "@/hooks/use-machine-view";

// [HUMAN] [MACHINE] toggle — exact Paxel (paxel.ycombinator.com) pattern.
// Active option renders in Supaprod orange; inactive in subdued ink.
// Placed top-right on every page (landing header + authenticated TopBar).
export function MachineViewToggle() {
  const { isMachineView, toggle } = useMachineView();

  return (
    <button
      onClick={toggle}
      title={isMachineView ? "Switch to human view" : "Switch to machine-readable view"}
      aria-pressed={isMachineView}
      aria-label="Machine-readable view"
      style={{
        fontFamily: "'Geist Mono', monospace",
        letterSpacing: "0.06em",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "2px 0",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span
        style={{
          color: isMachineView ? "var(--mrd-faint, #a0998c)" : "var(--mrd-you, #e8642c)",
          fontWeight: isMachineView ? 400 : 600,
        }}
      >
        [{isMachineView ? " " : "X"}] HUMAN
      </span>
      <span
        style={{
          color: isMachineView ? "var(--mrd-you, #e8642c)" : "var(--mrd-faint, #a0998c)",
          fontWeight: isMachineView ? 600 : 400,
        }}
      >
        [{isMachineView ? "X" : " "}] MACHINE
      </span>
    </button>
  );
}
