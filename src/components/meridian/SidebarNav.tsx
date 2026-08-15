import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StationGlyph, type StationGlyphKind } from "./station-glyphs";
import type { ReactNode } from "react";

/*
 * SIDEBAR NAV, the application rail.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Sidebar Nav"
 *                 (their file: components/SidebarNav.tsx), MIT licensed,
 *                 read on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * How this copy was taken, stated exactly, because the method is the warranty.
 * Six agent tabs were open on that page at once and it never reached document
 * idle, so the "View code" panel could not be clicked. The panel is fed by the
 * page's own inlined source payload, and that payload declares each blob's byte
 * length ahead of it. This blob declared 0x2272 and arrived at 8818 bytes, so
 * what follows is the whole file, not a truncated or inferred read. Anyone
 * re-checking should still use the panel; it is the same bytes, less arithmetic.
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * This is the rail, and it carries founder backlog item 6: the rail should
 * collapse to icons once the seven-station spine is familiar, expand to one
 * line of label, and show hover tooltips instantly rather than after the
 * browser's own delay.
 *
 * ── WHAT IS A PROP, AND WHY IT IS A PROP ────────────────────────────────
 * "Auto-collapse once the spine is familiar" is the request, and it is NOT
 * implemented here, deliberately. Familiarity is a fact about a person's
 * history with the product, and this component cannot see that history. A
 * visit counter baked in here would collapse the rail under someone who is
 * still learning the loop and would keep it open for someone who learnt it
 * last month on another machine. So `defaultCollapsed` and `collapsed` are
 * props, the caller decides from whatever it actually measures, and the wrong
 * heuristic is a one-line change at the call site rather than a rewrite here.
 *
 * `tooltipDelayMs` defaults to 0 for the same reason the request exists: the
 * complaint is about delay, and the browser's native `title` tooltip waits
 * roughly a second and cannot be tuned. That is why these are drawn rather
 * than delegated to `title`. The prop exists because a rail that is already
 * expanded does not need an instant second copy of a label the reader can see.
 *
 * ── ACCESSIBILITY, WHICH THE COLLAPSE PUTS AT RISK ──────────────────────
 * A collapsed rail is an icon strip, and an icon has no accessible name. Every
 * row therefore carries `aria-label` when collapsed and drops it when the
 * label is visible, so a screen reader is never handed the name twice. The
 * drawn tooltip is `aria-hidden` for the same reason: it repeats the label,
 * and repeating it is noise, not help. Counts fold into that name, because an
 * orchid dot in a corner says nothing out loud.
 */

/* One vocabulary for the seven marks, defined beside the drawings themselves so
 * a station cannot be added to the type without a glyph existing for it. */
export type RailIconKind = StationGlyphKind;

export type RailItem = {
  key: string;
  label: string;
  /** Groups rows under a heading. Rows with no section render ungrouped, first. */
  section?: string;
  /**
   * Renders the row as a real link. Prefer it: middle click, copy link address
   * and open in a new tab all work, and none of them work on a button.
   */
  href?: string;
  icon?: RailIconKind;
  /**
   * How many things on this station are waiting on a PERSON. Orchid, because
   * that is the one thing orchid means in this system. Do not put a run count
   * here; a machine being busy is not a call for you and must not look like one.
   */
  waiting?: number;
  /**
   * A quick "add one of these" that lives on the row itself. The reference has
   * this and the port had dropped it, which cost the rail its only way to start
   * work at a station without first navigating to it.
   *
   * It is a REAL button here, where the reference draws a hover-revealed span
   * with no handler on it — an affordance that looks pressable, is not, and
   * cannot be reached from the keyboard at all. That is why the row is wrapped
   * rather than the control nested: a button inside a button is invalid markup
   * and browsers resolve it by dropping the inner one.
   */
  onAdd?: () => void;
  /** Names that button out loud. Defaults to "New <label>". */
  addLabel?: string;
};

/*
 * The default is the loop itself. A surface that must not name the stations
 * (board item 102 keeps the seven-station vocabulary in the engine room) passes
 * its own `items` instead of editing this list.
 */
const STATIONS: RailItem[] = [
  { key: "discover", label: "Discover", section: "Loop", icon: "discover" },
  { key: "decide", label: "Decide", section: "Loop", icon: "decide" },
  { key: "plan", label: "Plan", section: "Loop", icon: "plan" },
  { key: "design", label: "Design", section: "Loop", icon: "design" },
  { key: "build", label: "Build", section: "Loop", icon: "build" },
  { key: "ship", label: "Ship", section: "Loop", icon: "ship" },
  { key: "learn", label: "Learn", section: "Loop", icon: "learn" },
];

/*
 * The seven station marks now live in `station-glyphs.tsx`, because the app
 * shell's horizontal strip draws the same seven and two copies of one drawing
 * drift. See the note in that file.
 */
function Icon({ kind }: { kind: RailIconKind }) {
  return <StationGlyph kind={kind} />;
}

/*
 * Focus is drawn, not borrowed. The neutral focus edge is the right colour for
 * it: focus is not an outcome and it is not a call to act, so spending orchid
 * or green on it would teach the reader a meaning that is not there.
 */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-focus)]";

export function SidebarNav({
  items = STATIONS,
  workspaceName = "Workspace",
  workspaceDetail,
  activeKey,
  defaultActiveKey,
  onNavigate,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  tooltips = "auto",
  tooltipDelayMs = 0,
  onSearch,
  primaryAction,
}: {
  items?: RailItem[];
  workspaceName?: string;
  /** The second line of the workspace row. Omit it and the row stays single line. */
  workspaceDetail?: string;
  /** Controlled selection. Omit to let the rail hold its own. */
  activeKey?: string;
  defaultActiveKey?: string;
  onNavigate?: (key: string) => void;
  /** Controlled collapse. Omit to let the rail hold its own. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** `auto` draws a tooltip only when the label is not on screen. */
  tooltips?: "auto" | "always" | "never";
  /** 0 means the frame the pointer arrives, which is what was asked for. */
  tooltipDelayMs?: number;
  onSearch?: (query: string) => void;
  primaryAction?: { label: string; onClick: () => void };
}) {
  const [ownActive, setOwnActive] = useState(defaultActiveKey ?? items[0]?.key ?? "");
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [selBox, setSelBox] = useState<{ top: number; height: number } | null>(null);
  const [hoverBox, setHoverBox] = useState<{ top: number; height: number } | null>(null);
  const [query, setQuery] = useState("");

  const active = activeKey ?? ownActive;
  const isCollapsed = collapsed ?? ownCollapsed;
  const showTips = tooltips === "always" || (tooltips === "auto" && isCollapsed);

  const navRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLElement | null>>({});
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * ── TWO BLOCKS, NOT ONE, AND THIS IS A CORRECTION ───────────────────────
   *
   * The reference draws a SINGLE travelling block, positioned at
   * `hovered ?? active` and painted in its hover wash. The port copied that
   * shape onto `--mrd-hover`, and on this ground it is the exact bug
   * meridian.css names by hand: hover here is a 4.5% whisper, engineered to be
   * barely perceptible under a pointer, so the rail's SELECTED station — the
   * one fact the whole control exists to report — was marked with the faintest
   * value in the system and read as unmarked.
   *
   * Raising the single block to `--mrd-select` would have swapped one lie for a
   * worse one: a 17% block that slides onto whatever the pointer touches says
   * "you just selected that", which is false, and it abandons the real
   * selection while the pointer is anywhere else in the rail.
   *
   * So the two meanings get two blocks. The SELECT block is pinned to the
   * active row at 17% and never leaves it; it animates only when the selection
   * genuinely moves, which is the one time that motion is telling the truth.
   * The HOVER wash travels at 4.5% and is the pointer's trail. Hovering the
   * active row stacks them, which is correct: a selected row under the pointer
   * should be the brightest thing in the rail.
   *
   * The travelling wash still follows keyboard focus as well as the pointer, so
   * tabbing through the rail reads the same as pointing at it.
   */
  useLayoutEffect(() => {
    const container = navRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const measure = (key: string | null) => {
      const el = key ? rowRefs.current[key] : null;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { top: rect.top - containerRect.top, height: rect.height };
    };

    setSelBox(measure(active));

    /*
     * Deliberately NOT cleared when the pointer leaves. Clearing it would reset
     * `top` to zero, and because opacity and position animate together the wash
     * would visibly fly to the top of the rail as it faded. Leaving the last
     * measurement in place lets it fade out where it stood, and slide in from
     * there when the pointer comes back.
     */
    const next = measure(hovered);
    if (next) setHoverBox(next);
  }, [hovered, active, isCollapsed, items]);

  /* A pending tooltip must not outlive the rail that scheduled it. */
  useEffect(
    () => () => {
      if (tipTimer.current) clearTimeout(tipTimer.current);
    },
    [],
  );

  function openTip(key: string) {
    if (!showTips) return;
    if (tipTimer.current) clearTimeout(tipTimer.current);
    /* At zero the timeout itself is the delay, so skip it entirely. */
    if (tooltipDelayMs <= 0) {
      setTip(key);
      return;
    }
    tipTimer.current = setTimeout(() => setTip(key), tooltipDelayMs);
  }

  function closeTip() {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    setTip(null);
  }

  function setCollapsed(next: boolean) {
    if (collapsed === undefined) setOwnCollapsed(next);
    onCollapsedChange?.(next);
    if (next) closeTip();
  }

  function select(key: string) {
    if (activeKey === undefined) setOwnActive(key);
    onNavigate?.(key);
  }

  const sections: (string | undefined)[] = [];
  for (const item of items) {
    if (!sections.includes(item.section)) sections.push(item.section);
  }

  return (
    /*
     * A real landmark. Their demo is a div, which leaves a screen reader no way
     * to jump to navigation, and a rail is the one thing on the page a reader
     * most wants to jump to.
     */
    <nav
      data-mrd=""
      aria-label="Stations"
      className="flex flex-col rounded-mrd-card border border-mrd-line bg-mrd-sheet"
      style={{
        width: isCollapsed ? "56px" : "240px",
        padding: "var(--mrd-s2)",
        boxShadow: "var(--mrd-shadow-card)",
        transition: "width var(--mrd-d-move) var(--mrd-ease)",
      }}
    >
      {/*
       * Workspace row. Collapsed it is the monogram alone, which is enough to
       * answer "am I in the right workspace" without any label.
       */}
      <div className="flex items-center gap-1" style={{ marginBottom: "var(--mrd-s2)" }}>
        <button
          type="button"
          aria-label={isCollapsed ? `${workspaceName}, switch workspace` : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-mrd-ctl p-1.5 text-left transition-[background-color,transform] duration-100 hover:bg-mrd-hover active:scale-[0.96] ${FOCUS_RING}`}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-mrd-solid text-[13px] font-semibold text-mrd-on-solid">
            {workspaceName.slice(0, 1).toUpperCase()}
          </span>
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium leading-tight text-mrd-ink">
                  {workspaceName}
                </span>
                {workspaceDetail && (
                  <span className="block truncate text-[11px] leading-tight text-mrd-mute">
                    {workspaceDetail}
                  </span>
                )}
              </span>
              <svg
                aria-hidden
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--mrd-mute)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
              </svg>
            </>
          )}
        </button>

        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse rail to icons"
            aria-expanded
            className={`flex size-7 shrink-0 items-center justify-center rounded-mrd-xs text-mrd-mute transition-[background-color,color] duration-100 hover:bg-mrd-hover hover:text-mrd-body ${FOCUS_RING}`}
          >
            <svg
              aria-hidden
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4v16M20 4v16M15 9l-3 3 3 3" />
            </svg>
          </button>
        )}
      </div>

      {/*
       * Quick search. Collapsed it becomes a button that expands the rail and
       * lands the caret in the field, because a search box narrowed to 40px is
       * a control that looks available and is not.
       */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => {
            setCollapsed(false);
            requestAnimationFrame(() => searchRef.current?.focus());
          }}
          onMouseEnter={() => openTip("__search")}
          onMouseLeave={closeTip}
          onFocus={() => openTip("__search")}
          onBlur={closeTip}
          aria-label="Search, expands the rail"
          className={`relative flex h-8 items-center justify-center rounded-mrd-ctl bg-mrd-sink text-mrd-mute transition-colors duration-100 hover:text-mrd-body ${FOCUS_RING}`}
          style={{ marginBottom: "var(--mrd-s2)" }}
        >
          <svg
            aria-hidden
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          {tip === "__search" && <Tooltip>Search</Tooltip>}
        </button>
      ) : (
        <label
          className="flex h-8 items-center gap-2 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-2.5"
          style={{ marginBottom: "var(--mrd-s2)" }}
        >
          <svg
            aria-hidden
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mrd-mute)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              onSearch?.(event.target.value);
            }}
            placeholder="Search"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-mrd-ink outline-none placeholder:text-mrd-mute"
          />
          <kbd className="flex size-4.5 items-center justify-center rounded-[5px] border border-mrd-line bg-mrd-lift text-[10px] text-mrd-mute">
            /
          </kbd>
        </label>
      )}

      {/*
       * The primary action stays a NEUTRAL. Their version paints it in the
       * accent, and meridian.css records that a saturated primary was tried
       * twice in this product and rejected twice for the same reason: it spends
       * the one accent on chrome, so when a real "your call" arrives there is
       * nothing louder left to say it with. `--mrd-solid` is the top of the
       * neutral ladder and nothing else in the product uses that stop.
       */}
      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          onMouseEnter={() => openTip("__primary")}
          onMouseLeave={closeTip}
          onFocus={() => openTip("__primary")}
          onBlur={closeTip}
          aria-label={isCollapsed ? primaryAction.label : undefined}
          className={`relative flex w-full items-center gap-2 rounded-mrd-ctl bg-mrd-solid px-2 py-1.5 text-[13px] font-medium text-mrd-on-solid transition-[filter,transform] duration-100 hover:brightness-110 active:scale-[0.96] ${isCollapsed ? "justify-center" : ""} ${FOCUS_RING}`}
          style={{
            marginBottom: "var(--mrd-s2)",
            /*
             * The specular top edge every filled control in this system carries,
             * and this one was missing it. Without the sheen `--mrd-solid` is a
             * flat slab a shade lighter than the rail, which is what the
             * reference's accent-filled action never looks like; with it the
             * button reads as a raised object, which is the whole reason the
             * primary stays a neutral rather than spending the accent.
             */
            boxShadow: "inset 0 1px 0 var(--mrd-sheen), var(--mrd-shadow-card)",
          }}
        >
          {!isCollapsed && (
            <span className="min-w-0 flex-1 truncate text-left">{primaryAction.label}</span>
          )}
          <svg
            aria-hidden
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {tip === "__primary" && <Tooltip>{primaryAction.label}</Tooltip>}
        </button>
      )}

      {/*
       * Rows. The gap BETWEEN sections is a larger token than the gap WITHIN
       * one, which is the whole reason meridian's space ramp grows instead of
       * stepping by four.
       */}
      <div
        ref={navRef}
        onMouseLeave={() => {
          setHovered(null);
          closeTip();
        }}
        className="relative flex flex-col"
        style={{ gap: "var(--mrd-s4)" }}
      >
        {/* The selection. Pinned to the active row, at the stop the system
            reserves for "a thing the reader has picked". */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 rounded-[7px] bg-mrd-select"
          style={{
            top: selBox?.top ?? 0,
            height: selBox?.height ?? 0,
            opacity: selBox ? 1 : 0,
            transition:
              "top var(--mrd-d-move) var(--mrd-ease), height var(--mrd-d-move) var(--mrd-ease), opacity var(--mrd-d-press) linear",
          }}
        />
        {/* The pointer's trail, and nothing more. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 rounded-[7px] bg-mrd-hover"
          style={{
            top: hoverBox?.top ?? 0,
            height: hoverBox?.height ?? 0,
            opacity: hovered && hoverBox ? 1 : 0,
            transition:
              "top var(--mrd-d-move) var(--mrd-ease), height var(--mrd-d-move) var(--mrd-ease), opacity var(--mrd-d-press) linear",
          }}
        />

        {sections.map((section, sectionIndex) => (
          <div key={section ?? "__ungrouped"}>
            {section &&
              (isCollapsed ? (
                /*
                 * Collapsed, the heading becomes a rule. Dropping it entirely
                 * would weld two groups into one list; keeping the word would
                 * need four characters of a 56px rail. The first group gets no
                 * rule, because a divider above the first thing divides it from
                 * nothing and just reads as a stray line.
                 */
                sectionIndex > 0 && (
                  /*
                   * `--mrd-line`, not `--mrd-line-soft`. `line-soft` is the
                   * system's rule BETWEEN SECTIONS and would be the obvious
                   * pick, but it is 5.5% and here it is doing a job it is never
                   * asked to do elsewhere: with the heading word gone, this
                   * hairline is the ONLY thing keeping two groups of stations
                   * apart in the collapsed rail. A separator that is the sole
                   * carrier of a grouping has to be a real edge.
                   */
                  <div aria-hidden className="mx-2 mb-1.5 h-px bg-mrd-line" />
                )
              ) : (
                /*
                 * 10.5px, which is `--mrd-t-micro` and is what the reference
                 * sets here. The port had drifted to 11px — `--mrd-t-tiny`, the
                 * stop reserved for mono counts and stage numerals — which put
                 * the group heading within two and a half pixels of the 13px
                 * rows it heads. Half a pixel sounds like nothing and is the
                 * difference between a heading that sits behind its rows and one
                 * that competes with them.
                 */
                <div className="px-2 pt-1 pb-1 text-[10.5px] font-medium tracking-[0.08em] text-mrd-mute uppercase">
                  {section}
                </div>
              ))}

            <div className="flex flex-col gap-px">
              {items
                .filter((item) => item.section === section)
                .map((item) => {
                  const isActive = item.key === active;
                  const waiting = item.waiting ?? 0;
                  /*
                   * Never collapsed. A 56px icon rail has no room to put a
                   * second target beside the glyph without the two overlapping,
                   * and a control the pointer cannot hit cleanly is worse than
                   * one that is honestly absent until the rail opens.
                   */
                  const showAdd = Boolean(item.onAdd) && !isCollapsed;
                  /*
                   * The count folds into the name rather than riding beside it.
                   * An orchid dot in a corner is silent, and "3" on its own is a
                   * number with no noun.
                   */
                  const accessibleName =
                    waiting > 0 ? `${item.label}, ${waiting} waiting on you` : item.label;

                  const body = (
                    <>
                      {/* The glyph transitions with the label rather than
                          snapping. Selecting a station moves the whole row up
                          one step in the text ramp, and half of it arriving a
                          frame early reads as a flicker. */}
                      <span
                        aria-hidden
                        className={`relative shrink-0 transition-colors duration-150 ${isActive ? "text-mrd-ink" : "text-mrd-mute"}`}
                      >
                        {item.icon && <Icon kind={item.icon} />}
                        {isCollapsed && waiting > 0 && (
                          <span
                            /* Keyed on the number so a CHANGE in the count
                               remounts the dot and replays its arrival. See the
                               badge below for why that matters. */
                            key={waiting}
                            className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-mrd-you ring-2 ring-mrd-sheet"
                            style={{
                              animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease) both",
                            }}
                          />
                        )}
                      </span>

                      {!isCollapsed && (
                        <>
                          <span
                            className={`min-w-0 flex-1 truncate text-[13px] whitespace-nowrap transition-colors duration-150 ${isActive ? "font-medium text-mrd-ink" : "text-mrd-body"}`}
                          >
                            {item.label}
                          </span>
                          {waiting > 0 && (
                            <span
                              /*
                               * KEYED ON THE NUMBER, which the port had missed
                               * and which the reference gets right. Without the
                               * key the badge mounts once and the animation
                               * never runs again, so the count going from two
                               * to three — a new thing arriving that is waiting
                               * on a PERSON, the single most important event
                               * this rail reports — changed one glyph silently.
                               * Remounting on the value replays the arrival.
                               */
                              key={waiting}
                              aria-hidden
                              className={`flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full px-1 text-[10.5px] font-semibold tabular-nums ${
                                isActive ? "bg-mrd-lift text-mrd-body" : "bg-mrd-you text-mrd-bg"
                              }`}
                              style={{
                                /* Scale, not slide. `mrd-pop-in` is the system's
                                   "this was not here a moment ago", and it comes
                                   from 0.98 so it lands without bouncing. */
                                animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease) both",
                              }}
                            >
                              {waiting}
                            </span>
                          )}
                        </>
                      )}
                      {tip === item.key && <Tooltip>{accessibleName}</Tooltip>}
                    </>
                  );

                  const shared = {
                    ref: (el: HTMLElement | null) => {
                      rowRefs.current[item.key] = el;
                    },
                    onMouseEnter: () => {
                      setHovered(item.key);
                      openTip(item.key);
                    },
                    onFocus: () => {
                      setHovered(item.key);
                      openTip(item.key);
                    },
                    onBlur: () => {
                      setHovered(null);
                      closeTip();
                    },
                    "aria-current": isActive ? ("page" as const) : undefined,
                    /* Only when the label is off screen, never both at once. */
                    "aria-label": isCollapsed ? accessibleName : undefined,
                    /*
                     * The reference asks for `transition-[color,transform]`
                     * here and the `color` half of that is inert: this element
                     * sets no colour of its own, the glyph and the label each
                     * set theirs, and a transition does not reach across into a
                     * child's own declaration. So the transitions live where the
                     * colours do — see both children above, the glyph having
                     * just been given one — and this stays transform only rather
                     * than carrying a property it cannot animate.
                     *
                     * The right padding opens only when the quick-add is there
                     * to occupy it, so a rail without one keeps its full label
                     * width instead of reserving space for nothing.
                     */
                    className: `relative z-10 flex w-full items-center gap-2 rounded-[7px] py-1.5 pl-2 text-left transition-transform duration-150 active:scale-[0.96] ${showAdd ? "pr-7" : "pr-2"} ${isCollapsed ? "justify-center" : ""} ${FOCUS_RING}`,
                  };

                  const row = item.href ? (
                    <a
                      href={item.href}
                      onClick={() => select(item.key)}
                      {...shared}
                      ref={shared.ref as (el: HTMLAnchorElement | null) => void}
                    >
                      {body}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => select(item.key)}
                      {...shared}
                      ref={shared.ref as (el: HTMLButtonElement | null) => void}
                    >
                      {body}
                    </button>
                  );

                  /*
                   * The wrapper exists so the quick-add can be a SIBLING of the
                   * row rather than a child of it. Nesting one inside the other
                   * is invalid markup — the parser drops the inner control — and
                   * it is almost certainly why the reference's plus is an inert
                   * span with no handler on it. It also gives the absolutely
                   * positioned control something to be positioned against that
                   * is not the row itself, which shrinks under `active:scale`
                   * and would drag the plus with it mid-press.
                   */
                  return (
                    <div key={item.key} className="relative">
                      {row}
                      {showAdd && (
                        <button
                          type="button"
                          onClick={item.onAdd}
                          onMouseEnter={() => setHovered(item.key)}
                          onFocus={() => setHovered(item.key)}
                          onBlur={() => setHovered(null)}
                          aria-label={item.addLabel ?? `New ${item.label}`}
                          className={`absolute top-1/2 right-1 z-20 flex size-4.5 -translate-y-1/2 items-center justify-center rounded-[5px] text-mrd-mute transition-[background-color,color,opacity] duration-100 hover:bg-mrd-lift hover:text-mrd-ink ${FOCUS_RING}`}
                          style={{
                            /*
                             * Revealed by the row's own hover state rather than
                             * by `group-hover`, so it also appears when the row
                             * is reached by keyboard — `onFocus` on the row sets
                             * exactly the same state. The active row keeps it
                             * open permanently, because that is the station a
                             * person is most likely to add to.
                             *
                             * Pointer events follow the opacity. An invisible
                             * button that still swallows clicks is a hole in the
                             * row's right edge that nobody can see.
                             */
                            opacity: isActive || hovered === item.key ? 1 : 0,
                            pointerEvents: isActive || hovered === item.key ? "auto" : "none",
                          }}
                        >
                          <svg
                            aria-hidden
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {isCollapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          onMouseEnter={() => openTip("__expand")}
          onMouseLeave={closeTip}
          onFocus={() => openTip("__expand")}
          onBlur={closeTip}
          aria-label="Expand rail to show labels"
          aria-expanded={false}
          className={`relative mx-auto flex size-7 items-center justify-center rounded-mrd-xs text-mrd-mute transition-[background-color,color] duration-100 hover:bg-mrd-hover hover:text-mrd-body ${FOCUS_RING}`}
          style={{ marginTop: "var(--mrd-s4)" }}
        >
          <svg
            aria-hidden
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4v16M20 4v16M9 9l3 3-3 3" />
          </svg>
          {tip === "__expand" && <Tooltip>Expand rail</Tooltip>}
        </button>
      )}
    </nav>
  );
}

/*
 * Drawn rather than delegated to `title`, which is the entire request: the
 * native tooltip waits about a second, cannot be tuned, and cannot be styled.
 * Hidden from assistive tech because the control it belongs to already carries
 * this exact string as its accessible name.
 */
function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      role="presentation"
      className="pointer-events-none absolute top-1/2 left-full z-20 ml-2 -translate-y-1/2 rounded-mrd-chip border border-mrd-line bg-mrd-float px-2 py-1 text-[12px] whitespace-nowrap text-mrd-ink"
      style={{
        boxShadow: "var(--mrd-shadow-float)",
        animation: "mrd-fade-in var(--mrd-d-press) linear both",
      }}
    >
      {children}
    </span>
  );
}

export default SidebarNav;
