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
        /* 164x16, under the 24px tap floor. The padding grows the hit box and
           `minHeight` guarantees it whatever the font resolves to; both are on
           the button rather than on the two spans so the [X] HUMAN / [ ] MACHINE
           pair keeps its own baseline and gap. Vertical only: the control is
           already 164px wide, and horizontal padding would push it off the
           right edge of the nav it sits in. */
        padding: "4px 0",
        /* And the layout effect taken straight back out. Measured: without
           this the footer grows 536 to 544, because this button sits in an
           `items-center` row whose height follows its tallest child. The hit
           box is 24px; the box the layout sees is the 16px it always was. */
        margin: "-4px 0",
        minHeight: 24,
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
