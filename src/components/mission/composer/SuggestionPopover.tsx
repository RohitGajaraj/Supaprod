// SuggestionPopover (Mission Control composer, front-end reimagining Phase 2).
// The typed-match rows above the standing Ask row. Rows derive from the SAME
// palette data the command palette reads (palette-sections + palette-catalog),
// so the composer can never drift from the rail or grow a dead link.
//
// Ranking law (behavior contract): typed matches (Trace, then Jump, then Act,
// then Catalog, each capped) rank ABOVE the final row, and the final row is
// always Ask Supaprod: "<query>" - free text always has a door into the Thread.
// Pure builder (buildSuggestionRows) is exported for unit tests.
//
// TRACE RANKS FIRST because it is the only row that can be exactly right. A
// typed audit tag names ONE record, so nothing matched by substring deserves
// to sit above it (founder ruling 2026-07-30: "if I give the ID it should show
// me the details and the connected lineages"). Detection is
// `detectReference`, which is pure and tested separately.
//
// Craft: plain ink surfaces, token vars only, no edge strips (Addendum 1.1).

import { cn } from "@/lib/utils";
import { ACT_VERBS, JUMP_DESTINATIONS, type PaletteRun } from "@/lib/palette-sections";
import { filterCatalog } from "@/lib/palette-catalog";
import { detectReference } from "@/lib/palette-reference";
import { Kbd } from "@/components/mission/primitives";

export type SuggestionSection = "TRACE" | "JUMP" | "ACT" | "CATALOG";

export type SuggestionRow =
  | {
      kind: "run";
      id: string;
      section: SuggestionSection;
      label: string;
      /** Key hint for Jump rows (the rail position digit). */
      hint?: string;
      run: PaletteRun;
    }
  /** An id the person typed. Opens the record's lineage rather than
   *  navigating, so it carries a ref instead of a PaletteRun. */
  | { kind: "trace"; id: "trace"; section: "TRACE"; label: string; ref: string }
  | { kind: "ask"; id: "ask"; label: string; query: string };

/** Visible eyebrow per section, matching the command palette's grammar. */
const SECTION_LABEL: Record<SuggestionSection, string> = {
  TRACE: "Trace",
  JUMP: "Jump",
  ACT: "Act",
  CATALOG: "Catalog",
};

const PER_SECTION = 3;

/**
 * PURE. Build the popover rows for a draft. Empty draft returns only the Ask
 * row (journey chips carry discovery when nothing is typed). Matches are
 * case-insensitive substring, deduped by label across sections (some Act
 * verbs repeat as Catalog pitches), capped per section. The Ask row is
 * always last and always present.
 */
export function buildSuggestionRows(query: string): SuggestionRow[] {
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  const rows: SuggestionRow[] = [];
  const seenLabels = new Set<string>();

  if (q.length > 0) {
    // An exact id beats every substring match under it.
    const reference = detectReference(trimmed);
    if (reference) {
      rows.push({
        kind: "trace",
        id: "trace",
        section: "TRACE",
        // The kind is named when we know it. A bare uuid names a row and not
        // a table, so the label says what it is rather than inventing one.
        label: reference.kind
          ? `Open ${reference.ref} and what it is connected to`
          : `Open the record for ${reference.ref}`,
        ref: reference.ref,
      });
    }

    let jumpCount = 0;
    for (const d of JUMP_DESTINATIONS) {
      if (jumpCount >= PER_SECTION) break;
      if (!d.label.toLowerCase().includes(q) && !d.tagline.toLowerCase().includes(q)) continue;
      rows.push({
        kind: "run",
        id: `jump:${d.label}`,
        section: "JUMP",
        label: d.label,
        hint: d.hint,
        run: d.run,
      });
      seenLabels.add(d.label.toLowerCase());
      jumpCount += 1;
    }

    let actCount = 0;
    for (const v of ACT_VERBS) {
      if (actCount >= PER_SECTION) break;
      const key = v.label.toLowerCase();
      if (!key.includes(q) || seenLabels.has(key)) continue;
      rows.push({ kind: "run", id: `act:${v.label}`, section: "ACT", label: v.label, run: v.run });
      seenLabels.add(key);
      actCount += 1;
    }

    let catalogCount = 0;
    for (const entry of filterCatalog(trimmed)) {
      if (catalogCount >= PER_SECTION) break;
      const key = entry.pitch.toLowerCase();
      if (seenLabels.has(key)) continue;
      rows.push({
        kind: "run",
        id: `catalog:${entry.id}`,
        section: "CATALOG",
        label: entry.pitch,
        run: entry.run,
      });
      seenLabels.add(key);
      catalogCount += 1;
    }
  }

  rows.push({
    kind: "ask",
    id: "ask",
    label: trimmed.length > 0 ? `Ask Supaprod: "${trimmed}"` : "Ask Supaprod",
    query: trimmed,
  });
  return rows;
}

export interface SuggestionPopoverProps {
  rows: SuggestionRow[];
  /** The keyboard-highlighted row (the composer owns arrow-key state). */
  activeIndex: number;
  onPick: (row: SuggestionRow) => void;
  /** Hover moves the highlight so mouse and keys never fight. */
  onHighlight?: (index: number) => void;
  className?: string;
}

export function SuggestionPopover({
  rows,
  activeIndex,
  onPick,
  onHighlight,
  className,
}: SuggestionPopoverProps) {
  if (rows.length === 0) return null;
  let lastSection: SuggestionSection | null = null;

  return (
    <div
      role="listbox"
      aria-label="Suggestions"
      data-testid="suggestion-popover"
      className={cn("rounded-xl border p-1", className)}
      style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)" }}
    >
      {rows.map((row, index) => {
        const active = index === activeIndex;
        const sectioned = row.kind === "run" || row.kind === "trace";
        const eyebrow =
          sectioned && row.section !== lastSection ? SECTION_LABEL[row.section] : null;
        if (sectioned) lastSection = row.section;
        return (
          <div key={row.id}>
            {eyebrow ? (
              <div
                className="px-2.5 pb-0.5 pt-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em]"
                style={{ color: "var(--ink-faint)" }}
              >
                {eyebrow}
              </div>
            ) : null}
            {row.kind === "ask" && rows.length > 1 ? (
              <div
                aria-hidden
                className="mx-1 my-1 h-px"
                style={{ background: "var(--ink-hairline-soft)" }}
              />
            ) : null}
            <button
              type="button"
              role="option"
              aria-selected={active}
              data-suggestion-id={row.id}
              onClick={() => onPick(row)}
              onMouseEnter={() => onHighlight?.(index)}
              className={cn(
                "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[12.5px] transition-colors",
                active && "bg-[var(--ink-panel)]",
              )}
              style={{ color: active ? "var(--ink-text)" : "var(--ink-body)" }}
            >
              <span className="min-w-0 flex-1 truncate">{row.label}</span>
              {row.kind === "run" && row.hint ? <Kbd>{row.hint}</Kbd> : null}
              {row.kind === "ask" ? <Kbd>{"⏎"}</Kbd> : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}
