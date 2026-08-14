import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

export type RailIconKind = "discover" | "decide" | "plan" | "design" | "build" | "ship" | "learn";

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

const GLYPHS: Record<RailIconKind, ReactNode> = {
  discover: (
    <g>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 15.5a5 5 0 0 0 0-7" />
      <path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 18.5a9 9 0 0 0 0-13" />
    </g>
  ),
  decide: (
    <g>
      <path d="M12 21v-9" />
      <path d="M12 12L6 4M12 12l6-8" />
    </g>
  ),
  plan: <path d="M4 6h16M4 12h10M4 18h13" />,
  design: (
    <g>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 9.5h18M9.5 21V9.5" />
    </g>
  ),
  build: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />,
  ship: (
    <g>
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      <path d="M12 3v12M8 7l4-4 4 4" />
    </g>
  ),
  learn: (
    <g>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 3.5v5h-5" />
    </g>
  ),
};

function Icon({ kind }: { kind: RailIconKind }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[kind]}
    </svg>
  );
}

/*
 * Focus is drawn, not borrowed. The neutral focus edge is the right colour for
 * it: focus is not an outcome and it is not a call to act, so spending orchid
 * or green on it would teach the reader a meaning that is not there.
 */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-edge-focus)]";

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
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  const [query, setQuery] = useState("");

  const active = activeKey ?? ownActive;
  const isCollapsed = collapsed ?? ownCollapsed;
  const showTips = tooltips === "always" || (tooltips === "auto" && isCollapsed);

  const navRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLElement | null>>({});
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * One travelling highlight rather than a background on each row. The reason
   * is not polish: with a per-row background the eye has to find which of nine
   * rectangles changed, and with one that slides the movement itself points at
   * the answer. It follows keyboard focus as well as the pointer, so tabbing
   * through the rail reads the same as pointing at it.
   */
  useLayoutEffect(() => {
    const container = navRef.current;
    const target = rowRefs.current[hovered ?? active];
    if (!container || !target) {
      setBox(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setBox({
      top: targetRect.top - containerRect.top,
      height: targetRect.height,
    });
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
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-mrd-solid text-[13px] font-semibold text-mrd-ink">
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
          className={`relative flex w-full items-center gap-2 rounded-mrd-ctl bg-mrd-solid px-2 py-1.5 text-[13px] font-medium text-mrd-ink transition-[filter,transform] duration-100 hover:brightness-110 active:scale-[0.96] ${isCollapsed ? "justify-center" : ""} ${FOCUS_RING}`}
          style={{ marginBottom: "var(--mrd-s2)" }}
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
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 rounded-[7px] bg-mrd-hover"
          style={{
            top: box?.top ?? 0,
            height: box?.height ?? 0,
            opacity: box ? 1 : 0,
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
                  <div aria-hidden className="mx-2 mb-1.5 h-px bg-mrd-line-soft" />
                )
              ) : (
                <div className="px-2 pt-1 pb-1 text-[11px] font-medium tracking-[0.08em] text-mrd-mute uppercase">
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
                   * The count folds into the name rather than riding beside it.
                   * An orchid dot in a corner is silent, and "3" on its own is a
                   * number with no noun.
                   */
                  const accessibleName =
                    waiting > 0 ? `${item.label}, ${waiting} waiting on you` : item.label;

                  const body = (
                    <>
                      <span
                        aria-hidden
                        className={`relative shrink-0 ${isActive ? "text-mrd-ink" : "text-mrd-mute"}`}
                      >
                        {item.icon && <Icon kind={item.icon} />}
                        {isCollapsed && waiting > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-mrd-you ring-2 ring-mrd-sheet" />
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
                              aria-hidden
                              className={`flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${
                                isActive ? "bg-mrd-lift text-mrd-body" : "bg-mrd-you text-mrd-bg"
                              }`}
                              style={{
                                animation: "mrd-fade-up var(--mrd-d-move) var(--mrd-ease) both",
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
                    className: `group relative z-10 flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left transition-transform duration-150 active:scale-[0.96] ${isCollapsed ? "justify-center" : ""} ${FOCUS_RING}`,
                  };

                  return item.href ? (
                    <a
                      key={item.key}
                      href={item.href}
                      onClick={() => select(item.key)}
                      {...shared}
                      ref={shared.ref as (el: HTMLAnchorElement | null) => void}
                    >
                      {body}
                    </a>
                  ) : (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => select(item.key)}
                      {...shared}
                      ref={shared.ref as (el: HTMLButtonElement | null) => void}
                    >
                      {body}
                    </button>
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
