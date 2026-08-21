import * as React from "react";
import { IconMore } from "@/components/shell/icons";

/**
 * THE OVERFLOW MENU: the acts a surface offers but does not want to argue for.
 *
 * ── WHAT IS CARRIED OVER, AND WHY EACH PIECE IS LOAD-BEARING ────────────
 * The behaviour is the component here. The paint is the easy half, and porting
 * only the paint would quietly drop three things the retired version had
 * already been fixed to do:
 *
 * 1. CLICK AWAY AND ESCAPE BOTH CLOSE IT. A menu whose only exit is a second
 *    press on the same 26px target is a trap on a touch screen.
 *
 * 2. THE ESCAPE LISTENER IS IN THE CAPTURE PHASE, and that is not a detail.
 *    Ask has its own Escape handler that closes the whole pane. Without
 *    capture, opening a menu inside Ask and pressing Escape closes the pane out
 *    from under the menu, so the reader loses the thing they were working on
 *    instead of the menu they just opened. Capture means this one hears the key
 *    first and stops it.
 *
 * 3. RIGHT-ANCHORED, because the control sits at the trailing edge of a pane.
 *    A left-anchored menu opens off the edge of it.
 *
 * ── `role="group"`, NOT `role="menu"`, AND THAT IS DELIBERATE ───────────
 * `role="menu"` promises arrow-key roving focus, Home/End, and typeahead. This
 * has none of those, and a role that promises keyboard navigation which does
 * not exist is worse than no role: a screen-reader user is told to press the
 * arrow keys and nothing happens. The items are ordinary buttons in the tab
 * order, which is honest and works. If roving focus is ever built, the role can
 * change in the same commit and not before.
 *
 * ── THE STOPS ARE THE RETIRED ONES ──────────────────────────────────────
 * 26px trigger, 168px minimum, 13px items, 8px control radius, the card radius
 * on the panel. Written as explicit values where Meridian has no matching stop,
 * because the ratchet law makes today's design the floor and rounding a 168 to
 * a nearer number would make the menu worse to make the port tidier.
 */
export function MoreMenu({
  label = "More",
  children,
}: {
  /** Names the thing the menu belongs to, for anyone who cannot see it. */
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div data-mrd="" ref={box} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-[26px] place-items-center rounded-mrd-ctl text-mrd-mute transition-colors hover:text-mrd-ink"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        <IconMore />
      </button>

      {open ? (
        <div
          role="group"
          aria-label={label}
          className="absolute top-[calc(100%+4px)] right-0 z-[5] flex min-w-[168px] flex-col rounded-mrd-card border border-mrd-line bg-mrd-float p-1 shadow-mrd-float"
          style={{ animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease)" }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** One line in a MoreMenu. A word, and what it does when pressed. */
export function MoreItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-mrd-ctl px-[9px] py-[7px] text-left text-[13px] whitespace-nowrap text-mrd-prose text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink"
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </button>
  );
}
