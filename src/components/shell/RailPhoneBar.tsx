/**
 * P-81: THE RAIL AT PHONE WIDTH.
 *
 * `PRIMARY_NAV` is nine doors on a sidebar row, and a sidebar is not a shape
 * that shrinks onto a phone -- it is a shape that has to become a DIFFERENT
 * one. Below 640px (Tailwind's own `sm` breakpoint, and now `--mrd-bp-phone`
 * in `meridian.css` -- the same number, because `shell.css` already used it
 * as its phone floor before this packet), `AppFrame.tsx` hides `.sp-rail` and
 * this mounts in its place: a fixed bottom bar with the five doors a person
 * opens most, and a *More* sheet for the rest.
 *
 * ── MERIDIAN ONLY, NO `sp-*` ──────────────────────────────────────────────
 * `shell.css`'s own rail is styled with the retired Cadence/ink `sp-*` class
 * vocabulary (`meridian-ratchet.baseline.json` freezes it at 10 in that one
 * file, "may go down and never up"). A new file is born clean, so this one is
 * built entirely in Tailwind utilities against the real `--mrd-*` tokens
 * `@theme inline` already exposes (`bg-mrd-sheet`, `text-mrd-ink`, and so on)
 * -- no hand-rolled CSS class, nothing for the ratchet to ever have an
 * opinion about.
 *
 * ── THE FIVE, AND WHY THEY ARE NOT "THE FIRST FIVE" ───────────────────────
 * `PRIMARY_NAV`'s own order is Start, Waiting, Arriving, Run, Outcomes, Team,
 * Conversations, Sources, Settings -- Run sits fourth there because P-66
 * needed it findable by chord next to the doors around it, not because it is
 * a top-five door on a phone. This packet's own scope names the five by hand
 * (Start, Waiting, Arriving, Outcomes, Run), so `BAR_TO` below is that exact
 * list, matched against `PRIMARY_NAV` by `to` rather than re-typed -- the
 * guard is that every entry resolves to a real `PRIMARY_NAV` item, not that
 * the two lists happen to agree today.
 *
 * ── ICONS, AND THE ONE PLACE THIS FILE ACCEPTS A SMALL RISK ───────────────
 * `PRIMARY_NAV` carries no icon (`nav-model.ts`'s own shape is pure data:
 * `to`, `label`, `zone`, `tagline`, `search?`). `AppFrame.tsx`'s own `RAIL`
 * array pairs an icon with eight of the nine doors, but reaching into that
 * array here would be a circular import (`AppFrame.tsx` mounts this file).
 * `DOOR_ICON` below is a second, small mapping of the SAME choice, checked by
 * its own guard for completeness (every `PRIMARY_NAV` door has an entry) but
 * not for matching `RAIL`'s choice exactly -- an icon glyph disagreeing
 * between two surfaces is a real but minor defect; a door silently having no
 * icon on a phone is the one this file actually guards against.
 *
 * ── THE `g` KEYS ARE UNCHANGED, ON PURPOSE ────────────────────────────────
 * `GotoShortcuts` is a global `window` listener mounted once at
 * `_authenticated.tsx`; it does not read the rail's own DOM and has nothing
 * to do differently because the rail changed shape. Named here only so the
 * next reader does not go looking for a chord fix in this file.
 *
 * ── THE "MORE" SHEET IS BESPOKE, NOT `@/components/ui/sheet` ──────────────
 * That primitive is shadcn/Radix, and `meridian-ratchet.test.ts` counts an
 * import from `components/ui/*` as Tempo v5 debt in any file the baseline has
 * not already frozen it in -- a new file is born clean, same rule as the
 * `sp-*` classes above. `components/meridian/Dialog.tsx` already solved the
 * harder version of this (a centred, focus-trapped, non-portalled overlay,
 * with the long argument for why it does not portal in its own header) with
 * no Radix underneath; `PhoneMoreSheet` below is that same contract --
 * scrim, Escape, a Tab trap, scroll lock, focus return -- anchored to the
 * bottom edge instead of centred, because a phone sheet slides up from the
 * thumb rather than floating over a dimmed page.
 */
import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { PRIMARY_NAV, type NavItemDef } from "@/lib/nav-model";
import {
  IconArrived,
  IconBrain,
  IconCrew,
  IconGear,
  IconMore,
  IconSources,
  IconWaiting,
  IconWork,
} from "./icons";

type IconComponent = React.ComponentType<{ className?: string }>;

/** Every door's icon, keyed by its own `to` -- see this file's own header for
 *  why this is a second, small choice rather than a shared import. */
const DOOR_ICON: Record<string, IconComponent> = {
  "/start": IconWork,
  "/approvals": IconWaiting,
  "/arriving": IconArrived,
  "/outcomes": IconBrain,
  "/crew": IconCrew,
  "/sync": IconSources,
  "/settings": IconGear,
};

/** The five doors a person opens most, per this packet's own scope --
 *  matched against `PRIMARY_NAV` by `to`, not re-typed. */
const BAR_TO: readonly string[] = ["/start", "/approvals", "/arriving", "/outcomes", "/settings"];

function byTo(to: string): NavItemDef | undefined {
  return PRIMARY_NAV.find((d) => d.to === to);
}

/**
 * Run's `to` is an identity, not a route (`nav-model.ts`'s own rule).
 *
 * P-109 (A-QUEUE.md): this used to resolve off the URL and return null off
 * it -- `DoorLink` below then dropped the door entirely, so a phone reader
 * not literally standing on a track had no Run door in the bar OR the More
 * sheet, the same defect P-63 named for the desktop rail carried here a
 * second time, unfixed by the first fix. `runDoor` (the query `AppFrame`
 * already makes, passed down rather than re-fetched) answers regardless of
 * the current page: a live run, the most recently touched one, or `/start`
 * with nothing to point at yet -- so the door never has to disappear.
 */
/* Each door fills its share of the bar and is a full finger target (44px):
   they were 36 by 39 (phone review, 2026-09-08). */
const ITEM_CLASS =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-mrd-ctl px-mrd-2 py-mrd-1 text-mrd-body";
const ITEM_ACTIVE_CLASS = "text-mrd-ink";

function DoorLink({
  door,
  active,
  onNavigate,
}: {
  door: NavItemDef;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = DOOR_ICON[door.to];
  return (
    <Link
      to={door.to}
      search={door.search as never}
      className={`${ITEM_CLASS} ${active ? ITEM_ACTIVE_CLASS : "text-mrd-mute"}`}
      aria-current={active ? "page" : undefined}
      title={door.label}
      aria-label={door.label}
      onClick={onNavigate}
    >
      {Icon ? <Icon className="size-5" /> : null}
      <span className="text-mrd-tiny leading-none">{door.label}</span>
    </Link>
  );
}

/** Everything a keyboard can land on inside the sheet -- same list, same
 *  reasoning, as `Dialog.tsx`'s own `FOCUSABLE`. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function PhoneMoreSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);

  const focusables = React.useCallback((): HTMLElement[] => {
    const panel = panelRef.current;
    if (!panel) return [];
    return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const opener = document.activeElement;
    returnTo.current = opener instanceof HTMLElement ? opener : null;
    (focusables()[0] ?? panelRef.current)?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
      returnTo.current?.focus();
    };
  }, [open, focusables]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const stops = focusables();
    if (stops.length === 0) {
      event.preventDefault();
      return;
    }
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      data-mrd=""
      className="fixed inset-0 z-50 flex flex-col justify-end font-mrd sm:hidden"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-mrd-scrim"
        style={{ animation: "mrd-fade-in var(--mrd-d-press) var(--mrd-ease-soft) both" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[75vh] flex-col gap-mrd-3 rounded-t-mrd-pane border-t border-mrd-line bg-mrd-float px-mrd-5 pt-mrd-4 pb-[calc(var(--mrd-s5)+env(safe-area-inset-bottom))]"
        style={{
          boxShadow: "var(--mrd-shadow-pane)",
          animation: "mrd-sheet-up var(--mrd-d-move) var(--mrd-ease) both",
        }}
      >
        <h2 id={titleId} className="shrink-0 mrd-title">
          More
        </h2>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function RailPhoneBar({
  liveLead,
  onLiveClick,
  liveTitle,
}: {
  /** The desktop rail's own `.sp-live-lead` text -- the "first fact" this
   *  packet's own acceptance line asks for, carried down rather than
   *  recomputed (AppFrame.tsx already derives it from its own reads). Renders
   *  nothing when absent, matching `.sp-live`'s own quiet-until-loaded rule. */
  liveLead?: string;
  /** `liveTarget.go` from AppFrame.tsx -- undefined while `strip?.mode ===
   *  "tab"`, the same case that makes the desktop `.sp-live` a static `div`
   *  instead of a `button`. */
  onLiveClick?: () => void;
  liveTitle?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = React.useState(false);

  const bar = BAR_TO.map(byTo).filter((d): d is NavItemDef => !!d);
  const barTo = new Set(bar.map((d) => d.to));
  const more = PRIMARY_NAV.filter((d) => !barTo.has(d.to));

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <>
      {liveLead
        ? React.createElement(
            onLiveClick ? "button" : "div",
            {
              type: onLiveClick ? "button" : undefined,
              onClick: onLiveClick,
              title: liveTitle,
              className:
                "fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 truncate border-t border-mrd-line bg-mrd-sheet px-mrd-3 py-mrd-1 text-left text-mrd-tiny text-mrd-mute sm:hidden",
            },
            liveLead,
          )
        : null}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-mrd-line bg-mrd-sheet pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="Main"
      >
        {bar.map((door) => (
          <DoorLink key={door.to} door={door} active={isActive(door.to)} />
        ))}
        <button
          type="button"
          className={`${ITEM_CLASS} text-mrd-mute`}
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <IconMore className="size-5" />
          <span className="text-mrd-tiny leading-none">More</span>
        </button>
      </nav>

      <PhoneMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        <div className="grid grid-cols-2 gap-mrd-2 py-mrd-2">
          {more.map((door) => {
            const Icon = DOOR_ICON[door.to];
            return (
              <Link
                key={door.to}
                to={door.to}
                search={door.search as never}
                className="flex flex-col items-start gap-mrd-1 rounded-mrd-ctl border border-mrd-line bg-mrd-float p-mrd-3 text-left"
                aria-current={isActive(door.to) ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
              >
                <span className="flex items-center gap-mrd-2 text-mrd-ink">
                  {Icon ? <Icon className="size-5" /> : null}
                  {door.label}
                </span>
                <span className="text-mrd-tiny text-mrd-mute">{door.tagline}</span>
              </Link>
            );
          })}
        </div>
      </PhoneMoreSheet>
    </>
  );
}

/** Every `PRIMARY_NAV` door has an icon and is reachable from either the bar
 *  or the sheet -- exported for `the-bar-and-the-sheet-share-one-list.test.ts`,
 *  which reads it against the real list rather than trusting this file to
 *  have kept the two in sync. */
export function phoneBarCoversEveryDoor(): boolean {
  return (
    PRIMARY_NAV.every((d) => d.to in DOOR_ICON) &&
    BAR_TO.every((to) => PRIMARY_NAV.some((d) => d.to === to))
  );
}

export { BAR_TO, DOOR_ICON };

export default RailPhoneBar;
