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
import { PRIMARY_NAV, ENGINE_GROUP } from "@/lib/nav-model";

// OBS-11 - the glass ⌘K palette + capability catalog, superseding the
// parchment cmdk palette. Four sections (JUMP · ACT · ASK · CATALOG), a flat
// keyboard-navigable row list, and a static searchable catalog that runs
// capabilities on the user's own workspace via navigate/client-event, never
// a server call. Built on Radix Dialog (already vendored for the mission
// slide-over) for the focus-trap contract rather than a hand-rolled trap.

type PaletteRow =
  | { section: "JUMP"; label: string; hint: string; to: string; search?: Record<string, string> }
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
  return { section: "JUMP", label: d.label, hint: d.hint, to: d.run.to, search: d.run.search };
}

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
    window.addEventListener("cadence:open-cmdk", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cadence:open-cmdk", onOpenEvent);
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
      return [...JUMP_DESTINATIONS.map(jumpToRow), ...getRecents().map(recentToRow)];
    }
    const ql = q.toLowerCase();
    const jump = JUMP_DESTINATIONS.filter((d) => d.label.toLowerCase().includes(ql)).map(jumpToRow);
    const act = ACT_VERBS.filter((v) => v.label.toLowerCase().includes(ql)).map(actToRow);
    const catalog = filterCatalog(q).map(catalogToRow);
    const matched = [...jump, ...act, ...catalog];
    const ask: PaletteRow[] =
      matched.length === 0 ? [{ section: "ASK", label: `Ask Cadence: "${q}"`, intent: q }] : [];
    return [...matched, ...ask];
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [rows.length]);

  const runRow = (row: PaletteRow) => {
    setOpen(false);
    if (row.section === "ASK") {
      window.dispatchEvent(new CustomEvent("cadence:open-ask", { detail: { intent: row.intent } }));
      return;
    }
    if (row.section === "ACT" && row.event) {
      window.dispatchEvent(new CustomEvent(row.event, { detail: {} }));
      if (row.event === "cadence:open-ask") return;
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
    const key = row.section === "RECENT" ? "JUMP" : row.section;
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key)!.push({ row, i: renderIndex++ });
  }
  for (const label of ["JUMP", "ACT", "ASK", "CATALOG"]) {
    const items = bySection.get(label);
    if (items?.length) sectioned.push({ label, items });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0"
          style={{ zIndex: 80, backgroundColor: "rgba(4,4,5,0.6)", backdropFilter: "blur(3px)" }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 outline-none"
          style={{
            zIndex: 81,
            top: "18vh",
            transform: "translateX(-50%)",
            width: "560px",
            maxWidth: "92vw",
            background: "var(--raised)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-panel)",
            animation: "cadRise 200ms var(--ease)",
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
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 15,
                color: "var(--text-primary)",
                caretColor: "var(--ember)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
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
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {sectioned.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: "24px 16px",
                }}
              >
                Nothing by that name. Try a verb, like challenge or connect.
              </p>
            ) : (
              sectioned.map((group) => (
                <div key={group.label}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      letterSpacing: "0.11em",
                      textTransform: "uppercase",
                      color: "var(--text-subtle)",
                      padding: "12px 16px 6px",
                    }}
                  >
                    {group.label}
                  </div>
                  {group.items.map(({ row, i }) => {
                    const active = i === activeIndex;
                    const isCatalog = row.section === "CATALOG";
                    const rightHint =
                      row.section === "JUMP"
                        ? row.hint
                        : row.section === "ASK" ||
                            (row.section === "ACT" && row.event === "cadence:open-ask")
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
                          padding: "9px 16px",
                          background: active ? "#1A1A1E" : "transparent",
                          outline: active ? "2px solid var(--glacier)" : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9.5,
                            color: active ? "var(--ember)" : "var(--text-faint)",
                          }}
                        >
                          {index}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-ui)",
                            fontSize: 13,
                            color: active ? "var(--text-primary)" : "var(--text-body)",
                          }}
                        >
                          {row.label}
                        </span>
                        {isCatalog ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              runRow(row);
                            }}
                            style={{
                              fontFamily: "var(--font-ui)",
                              fontSize: 12,
                              color: "var(--text-muted)",
                              border: "1px solid var(--hairline)",
                              borderRadius: "var(--radius-control)",
                              padding: "3px 9px",
                              background: "transparent",
                            }}
                          >
                            Try it
                          </button>
                        ) : rightHint ? (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 9.5,
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

// OBS-02 - the Obsidian keyboard map: `1`-`5` switch the five rail
// destinations (single press, no chord), `g` opens the Engine Room. OBS-11:
// route map refreshed to the canonical five post-OBS-10 (was /product-era
// targets). Mount once at app root.
export function GotoShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (key >= "1" && key <= "5") {
        const item = PRIMARY_NAV[Number(key) - 1];
        if (item) {
          e.preventDefault();
          navigate({ to: item.to, search: item.search as never });
        }
        return;
      }
      if (key.toLowerCase() === "g") {
        e.preventDefault();
        navigate({ to: ENGINE_GROUP[0].to });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
  return null;
}
