import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CATALOG, filterCatalog, type CatalogEntry } from "@/lib/palette-catalog";
import {
  ACT_VERBS,
  JUMP_DESTINATIONS,
  type ActVerb,
  type JumpDestination,
} from "@/lib/palette-sections";
import { getRecents, type RecentObject } from "@/lib/palette-recents";
import { PRIMARY_NAV, FOOTER_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";
import { DESK_COMPOSE_EVENTS, fireDeskCompose } from "@/lib/desk-compose";
import { EmptyState } from "@/components/supaprod/EmptyState";

// OBS-11 - the glass ⌘K palette + capability catalog, superseding the
// parchment cmdk palette. Sections (JUMP · SETTINGS · ACT · ASK · CATALOG), a
// flat keyboard-navigable row list, and a static searchable catalog that runs
// capabilities on the user's own workspace via navigate/client-event, never
// a server call. Built on Radix Dialog (already vendored for the mission
// slide-over) for the focus-trap contract rather than a hand-rolled trap.
// IA SPINE (2026-07-11): JUMP is DERIVED from PRIMARY_NAV (all seven
// destinations, hints = keys 1-7); the separate ENGINE section is gone.

type PaletteRow =
  | {
      section: "JUMP";
      label: string;
      hint: string;
      sub?: string;
      to: string;
      search?: Record<string, string>;
    }
  | {
      section: "SETTINGS";
      label: string;
      hint: string;
      to: string;
      search?: Record<string, string>;
    }
  | { section: "RECENT"; label: string; kind: string; to: string; search?: Record<string, string> }
  | { section: "ACT"; label: string; to: string; search?: Record<string, string>; event?: string }
  | { section: "ASK"; label: string; intent: string }
  | {
      section: "CATALOG";
      label: string;
      kind?: string;
      to: string;
      search?: Record<string, string>;
    };

function jumpToRow(d: JumpDestination): PaletteRow {
  return {
    section: "JUMP",
    label: d.label,
    hint: d.hint,
    sub: d.tagline,
    to: d.run.to,
    search: d.run.search,
  };
}

const SETTINGS_ROWS: PaletteRow[] = FOOTER_NAV.map((d) => ({
  section: "SETTINGS" as const,
  label: d.label,
  hint: "",
  to: d.to,
  search: d.search,
}));

function actToRow(v: ActVerb): PaletteRow {
  return { section: "ACT", label: v.label, to: v.run.to, search: v.run.search, event: v.run.event };
}

function recentToRow(r: RecentObject): PaletteRow {
  return { section: "RECENT", label: r.label, kind: r.kind, to: r.to, search: r.search };
}

function catalogToRow(c: CatalogEntry): PaletteRow {
  return { section: "CATALOG", label: c.pitch, kind: c.kind, to: c.run.to, search: c.run.search };
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("supaprod:open-cmdk", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("supaprod:open-cmdk", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const rows: PaletteRow[] = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return [
        ...JUMP_DESTINATIONS.map(jumpToRow),
        ...SETTINGS_ROWS,
        ...ACT_VERBS.map(actToRow),
        ...getRecents().map(recentToRow),
      ];
    }
    const ql = q.toLowerCase();
    const jump = JUMP_DESTINATIONS.filter((d) => d.label.toLowerCase().includes(ql)).map(jumpToRow);
    const settings = SETTINGS_ROWS.filter((r) => r.label.toLowerCase().includes(ql));
    const act = ACT_VERBS.filter((v) => v.label.toLowerCase().includes(ql)).map(actToRow);
    const catalog = filterCatalog(q).map(catalogToRow);
    const matched = [...jump, ...settings, ...act, ...catalog];
    const ask: PaletteRow[] =
      matched.length === 0 ? [{ section: "ASK", label: `Ask Supaprod: "${q}"`, intent: q }] : [];
    return [...matched, ...ask];
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [rows.length]);

  // Keyboard nav must keep the active row in view inside the scrolling list
  // (block: "nearest" jumps without smooth-scroll, so no reduced-motion leak).
  useEffect(() => {
    if (!open) return;
    document.getElementById(`supaprod-cmdk-row-${activeIndex}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, open]);

  const runRow = (row: PaletteRow) => {
    setOpen(false);
    if (row.section === "ASK") {
      window.dispatchEvent(
        new CustomEvent("supaprod:open-ask", { detail: { intent: row.intent } }),
      );
      return;
    }
    if (row.section === "ACT" && row.event) {
      // Desk composers (add a task, capture a signal, share status): fire the
      // scoped intent so an already-mounted card opens its composer NOW, and
      // hold it pending so the card consumes it right after the /today landing.
      if (DESK_COMPOSE_EVENTS.includes(row.event)) {
        fireDeskCompose(row.event);
        navigate({ to: row.to, search: row.search as never });
        return;
      }
      window.dispatchEvent(new CustomEvent(row.event, { detail: {} }));
      if (row.event === "supaprod:open-ask") return;
      // PM Desk: the focus composer opens in place on any page — the dock
      // listens for this event; navigating away would defeat it.
      if (row.event === "supaprod:focus-compose") return;
    }
    navigate({ to: row.to, search: row.search as never });
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[activeIndex];
      if (row) runRow(row);
    }
  };

  let renderIndex = 0;
  const sectioned: { label: string; items: { row: PaletteRow; i: number }[] }[] = [];
  const bySection = new Map<string, { row: PaletteRow; i: number }[]>();
  for (const row of rows) {
    const key = row.section;
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key)!.push({ row, i: renderIndex++ });
  }
  // Header text per section: the default view reads like the rail (the seven
  // destinations, settings), not like an internal enum.
  const SECTION_HEADING: Record<string, string> = {
    JUMP: "Jump",
    SETTINGS: "Settings",
    ACT: "Act",
    RECENT: "Recent",
    ASK: "Ask",
    CATALOG: "Catalog",
  };
  for (const label of ["JUMP", "SETTINGS", "ACT", "RECENT", "ASK", "CATALOG"]) {
    const items = bySection.get(label);
    if (items?.length) sectioned.push({ label, items });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0"
          style={{
            zIndex: 80,
            backgroundColor: "var(--ds-overlay-backdrop-color)",
            backdropFilter: "blur(3px)",
          }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="material-menu fixed left-1/2 outline-none"
          style={{
            zIndex: 81,
            top: "18vh",
            transform: "translateX(-50%)",
            width: "560px",
            maxWidth: "92vw",
            animation: "cadRise 200ms var(--ds-motion-timing-swift)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <div
            className="flex items-center gap-3"
            style={{ padding: "14px 16px", borderBottom: "1px solid var(--hairline)" }}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search, act, or ask what it can do"
              role="combobox"
              aria-expanded={rows.length > 0}
              aria-controls="supaprod-cmdk-listbox"
              aria-activedescendant={rows.length ? `supaprod-cmdk-row-${activeIndex}` : undefined}
              aria-label="Search, act, or ask what it can do"
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: "var(--font-sans)",
                color: "var(--text-primary)",
                caretColor: "var(--ember)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                color: "var(--text-subtle)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-control)",
                padding: "2px 7px",
              }}
            >
              ESC
            </span>
          </div>
          <div
            id="supaprod-cmdk-listbox"
            role="listbox"
            aria-label="Results"
            // Menu anatomy (patterns/command-palette.md): 6px interior
            // padding around 36px rows with 6px row radius.
            style={{ maxHeight: 420, overflowY: "auto", padding: 6 }}
          >
            {sectioned.length === 0 ? (
              <EmptyState
                headline="Nothing by that name"
                body="Try a verb, like challenge or connect."
              />
            ) : (
              sectioned.map((group) => (
                <div
                  key={group.label}
                  role="group"
                  aria-label={SECTION_HEADING[group.label] ?? group.label}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.11em",
                      textTransform: "uppercase",
                      color: "var(--text-subtle)",
                      padding: "12px 10px 6px",
                    }}
                  >
                    {SECTION_HEADING[group.label] ?? group.label}
                  </div>
                  {group.items.map(({ row, i }) => {
                    const active = i === activeIndex;
                    const isCatalog = row.section === "CATALOG";
                    const rightHint =
                      row.section === "JUMP" || row.section === "SETTINGS"
                        ? // The prefix is part of the shortcut, so the palette
                          // shows it too. A bare "d" here would teach a key
                          // that does nothing on its own.
                          row.hint
                          ? `${NAV_CHORD_PREFIX} ${row.hint}`
                          : ""
                        : row.section === "ASK" ||
                            (row.section === "ACT" && row.event === "supaprod:open-ask")
                          ? "⌘J"
                          : row.section === "RECENT"
                            ? row.kind
                            : row.section === "CATALOG"
                              ? row.kind
                              : undefined;
                    const index = String(i + 1).padStart(2, "0");
                    return (
                      <div
                        key={`${row.section}-${row.label}-${i}`}
                        id={`supaprod-cmdk-row-${i}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => runRow(row)}
                        role="option"
                        aria-selected={active}
                        className="cursor-pointer outline-none"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 1fr auto",
                          alignItems: "center",
                          gap: 10,
                          minHeight: 36,
                          padding: "0 10px",
                          borderRadius: 6,
                          background: active ? "var(--surface-active)" : "transparent",
                          outline: active ? "2px solid var(--ember)" : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: active ? "var(--ember)" : "var(--text-faint)",
                          }}
                        >
                          {index}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-sans)",
                              color: active ? "var(--text-primary)" : "var(--text-body)",
                            }}
                          >
                            {row.label}
                          </span>
                          {row.section === "JUMP" && row.sub ? (
                            <span
                              className="truncate"
                              style={{
                                fontFamily: "var(--font-sans)",
                                lineHeight: 1.3,
                                color: "var(--text-subtle)",
                              }}
                            >
                              {row.sub}
                            </span>
                          ) : null}
                        </span>
                        {isCatalog ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              runRow(row);
                            }}
                            className="loom-press rounded-[var(--radius-control)] border border-[var(--hairline)] bg-transparent text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--hairline-strong)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)]"
                            style={{
                              fontFamily: "var(--font-sans)",
                              padding: "3px 9px",
                            }}
                          >
                            Try it
                          </button>
                        ) : rightHint ? (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-subtle)",
                            }}
                          >
                            {rightHint}
                          </span>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * GO, THEN THE LETTER. The one way a key reaches a destination.
 *
 * DERIVED from PRIMARY_NAV + FOOTER_NAV via `navKeyHint`, never hand-copied,
 * so the keycap the rail draws and the key this binds cannot drift.
 *
 * WHY A CHORD AND NOT A BARE KEY (founder ruling 2026-08-05, full reasoning on
 * NAV_CHORD_PREFIX in nav-model.ts). A bare navigation key is a WINDOW
 * listener, so it fires on every surface at once and competes with whatever
 * that surface bound. Navigation kept losing that contest: `a` was surrendered
 * to Approve, `r` to Reject, `c` to Challenge, leaving Runs on `u` and Crew on
 * `e`, which nobody can guess. Requiring `g` first puts navigation in its own
 * namespace, so `r` alone still rejects and `g` then `r` goes to Runs.
 *
 * THE WINDOW IS DELIBERATE. `g` arms the chord for two seconds and then
 * disarms. Without a timeout a stray `g` would silently swallow the next
 * keystroke minutes later, turning an Approve into a navigation. Any key that
 * is not a bound letter also disarms immediately, so a mistyped chord costs
 * nothing and never leaves the keyboard in a state the person cannot see.
 *
 * Mount once at app root.
 */
const CHORD_WINDOW_MS = 2000;

export function GotoShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    let armedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const disarm = () => {
      armedAt = 0;
      if (timer) clearTimeout(timer);
      timer = undefined;
    };

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // LOOM W4: never fire surface switches under an open dialog/overlay - a
      // keystroke into a focused-but-non-input dialog must not yank the user
      // to another station and drop their in-flight decision.
      if (
        document.querySelector(
          '[role="dialog"][data-state="open"], [role="dialog"][aria-modal="true"]',
        )
      )
        return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const armed = armedAt !== 0 && Date.now() - armedAt < CHORD_WINDOW_MS;

      if (!armed) {
        if (key === NAV_CHORD_PREFIX) {
          // Arm, and do NOT preventDefault: `g` on its own belongs to whatever
          // surface is open until the second key proves this was navigation.
          armedAt = Date.now();
          timer = setTimeout(disarm, CHORD_WINDOW_MS);
        }
        return;
      }

      disarm();

      const target = [...PRIMARY_NAV, ...FOOTER_NAV].find((item) => {
        const hint = navKeyHint(item);
        return hint !== "" && hint === key;
      });
      if (target) {
        e.preventDefault();
        navigate({ to: target.to, search: target.search as never });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      disarm();
    };
  }, [navigate]);
  return null;
}
