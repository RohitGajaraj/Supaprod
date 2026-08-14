import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * SEARCH, a field that narrows a list as it is typed.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Search"
 *                 (their file: components/SearchList.tsx), MIT licensed,
 *                 read on 2026-08-14 from the exact string that page's own
 *                 "View code" panel renders.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * Three shipped surfaces list workspace-wide items with no way to find one.
 * The spec list, Design and Ship all render everything and stop. Search is
 * half the fix for that hole; `FilterTable` is the other half. They are not
 * the same tool: a filter answers "show me the ones like this", search answers
 * "show me the one I already have in mind".
 *
 * ── TWO BUGS IN THE REFERENCE THAT ARE NOT COPIED ───────────────────────
 * 1. It shows its "no results" panel only once the query passes two
 *    characters. Type "zx" and match nothing and you get a blank panel with no
 *    explanation at all, which reads as a broken component rather than as an
 *    answer. Here, any query that matches nothing says so.
 * 2. With an empty query it renders `items.slice(0, 5)` and says nothing about
 *    the rest. That is a silent truncation, and silent truncation is the exact
 *    failure this product has already shipped once. Here the cap states both
 *    real numbers and offers the way past it.
 *
 * ── AND ONE STATE IT NEVER HAD ──────────────────────────────────────────
 * A search over a list that failed to load is not a search over an empty list.
 * It must not wear the empty state's clothes, and it must offer a retry.
 */

export type SearchProps<Item> = {
  items: Item[];
  itemKey: (item: Item) => string;
  /** The text a query is matched against. Keep it to what a person would type. */
  itemText: (item: Item) => string;
  /** A richer row. Defaults to the matched text with the hit picked out. */
  renderItem?: (item: Item) => ReactNode;
  onSelect?: (item: Item) => void;
  /** Names the field for assistive tech. Required; a bare magnifier says nothing. */
  label: string;
  placeholder?: string;
  /** Results before the cap notice. Applies to the resting list too. */
  maxResults?: number;
  /** Shown when the list itself is empty, before anything is typed. */
  emptyTitle?: string;
  emptyDetail?: string;
  /** A read that did not come back. Never an empty state. */
  failure?: { message: string; onRetry?: () => void };
};

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-edge-focus)]";

function MagnifierIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

/**
 * The hit is raised, not tinted. Colour in this system means status, and a
 * matched substring is not a status; brightness is the neutral way to say
 * "this is the part you typed".
 */
function Hit({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-medium text-mrd-ink">{text.slice(at, at + query.length)}</span>
      {text.slice(at + query.length)}
    </>
  );
}

export function Search<Item>({
  items,
  itemKey,
  itemText,
  renderItem,
  onSelect,
  label,
  placeholder = "Search",
  maxResults = 8,
  emptyTitle = "Nothing to search yet",
  emptyDetail,
  failure,
}: SearchProps<Item>) {
  const [query, setQuery] = useState("");
  const [capLifted, setCapLifted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => itemText(item).toLowerCase().includes(q));
  }, [items, itemText, query]);

  const shown = capLifted ? matched : matched.slice(0, maxResults);
  const withheld = matched.length - shown.length;

  /*
   * Roving focus rather than a virtual cursor. The rows are real buttons, so
   * moving DOM focus is what a screen reader is already following; an
   * aria-activedescendant cursor would have to be narrated separately and
   * would drift out of step with the visible highlight the first time the list
   * re-sorted underneath it.
   */
  const focusRow = (index: number) => {
    const clamped = Math.max(0, Math.min(index, shown.length - 1));
    rowRefs.current[clamped]?.focus();
  };

  const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && shown.length > 0) {
      event.preventDefault();
      focusRow(0);
    } else if (event.key === "Escape" && query) {
      event.preventDefault();
      setQuery("");
    }
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else focusRow(index - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      inputRef.current?.focus();
    }
  };

  const panel = failure ? (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="text-[13px] font-medium" style={{ color: "var(--mrd-fail)" }}>
        {failure.message}
      </span>
      <span className="text-[12px] text-mrd-mute">
        Nothing was searched. This is a read that did not come back.
      </span>
      {failure.onRetry && (
        <button
          type="button"
          onClick={failure.onRetry}
          className={`mt-1 rounded-mrd-ctl bg-mrd-solid px-2.5 py-1 text-[12.5px] font-medium text-mrd-ink transition-opacity hover:opacity-90 ${FOCUS}`}
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          Try again
        </button>
      )}
    </div>
  ) : items.length === 0 ? (
    <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
      <span
        aria-hidden
        className="mb-1 flex size-8 items-center justify-center rounded-mrd-ctl border border-mrd-line bg-mrd-sink text-mrd-mute"
      >
        <MagnifierIcon size={15} />
      </span>
      <span className="text-[13px] font-medium text-mrd-ink">{emptyTitle}</span>
      {emptyDetail && <span className="text-[12px] text-mrd-mute">{emptyDetail}</span>}
    </div>
  ) : matched.length === 0 ? (
    /*
     * Distinct from the state above on purpose. "There is nothing" and "your
     * query excluded everything" are different facts and only the second one
     * has a way back, so only the second one offers a button.
     */
    <div
      className="flex flex-col items-center gap-1.5 px-4 py-8 text-center"
      style={{ animation: "mrd-fade-in var(--mrd-d-enter) var(--mrd-ease) both" }}
    >
      <span className="text-[13px] font-medium text-mrd-ink">No matches</span>
      <span className="text-[12px] text-mrd-mute">
        None of the {items.length} items contain that.
      </span>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          inputRef.current?.focus();
        }}
        className={`mt-1 rounded-mrd-ctl border border-mrd-edge px-2.5 py-1 text-[12.5px] font-medium text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        Clear the search
      </button>
    </div>
  ) : (
    <ul className="max-h-72 overflow-y-auto p-1">
      {shown.map((item, index) => (
        <li key={itemKey(item)}>
          <button
            ref={(node) => {
              rowRefs.current[index] = node;
            }}
            type="button"
            onClick={() => onSelect?.(item)}
            onKeyDown={(event) => onRowKeyDown(event, index)}
            className={`flex min-h-8 w-full items-center rounded-mrd-xs px-2 py-1.5 text-left text-[13px] text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {renderItem ? renderItem(item) : <Hit text={itemText(item)} query={query.trim()} />}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-full overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet">
      <div className="flex h-10 items-center gap-2 border-b border-mrd-line px-3">
        <span className="text-mrd-mute">
          <MagnifierIcon />
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCapLifted(false);
          }}
          onKeyDown={onFieldKeyDown}
          placeholder={placeholder}
          aria-label={label}
          disabled={Boolean(failure)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-mrd-ink outline-none placeholder:text-mrd-faint disabled:cursor-not-allowed"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className={`flex size-5.5 items-center justify-center rounded-full text-mrd-mute transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
            style={{
              transitionDuration: "var(--mrd-d-press)",
              animation: "mrd-fade-in var(--mrd-d-press) var(--mrd-ease) both",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/*
       * Politely announced, not assertively. The count changing on every
       * keystroke is worth knowing and not worth interrupting for, and an
       * assertive region here talks over the letters being typed.
       */}
      <div role="status" aria-live="polite" className="sr-only">
        {failure ? failure.message : `${matched.length} of ${items.length} items match`}
      </div>

      {panel}

      {withheld > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-mrd-line bg-mrd-sink px-3 py-2">
          <span className="font-mrd-mono text-[12px] text-mrd-mute tabular-nums">
            Showing {shown.length} of {matched.length}. {withheld} not shown.
          </span>
          <button
            type="button"
            onClick={() => setCapLifted(true)}
            className={`rounded-mrd-ctl border border-mrd-edge px-2 py-0.5 text-[12px] font-medium text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            Show all {matched.length}
          </button>
        </div>
      )}
    </div>
  );
}

export default Search;
