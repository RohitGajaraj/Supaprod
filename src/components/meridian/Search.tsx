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
 *
 * ── THE REFERENCE'S 248px FLOOR IS NOT COPIED, AND THAT IS ON PURPOSE ────
 * Their root is `min-h-[248px]`, which stops the card resizing as its panel
 * swaps between five results and the empty state. That floor is correct for a
 * component standing alone on a gallery page, and wrong for every place this
 * one is mounted: RunsGrid and DrawingsTable summon it INLINE, directly above
 * the grid it searches, so a floor would open a quarter of a screen of empty
 * card above the rows the moment anyone pressed find. Our panel's resting state
 * is a single line by design, so the floor would be visible almost all the
 * time. The jump the floor exists to prevent is real; it is paid for here with
 * an entrance on each panel instead, which is cheaper than a permanent hole.
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
  /** Results before the cap notice. Nothing is listed until a query exists. */
  maxResults?: number;
  /**
   * What these things are called on the surface that mounted this. "run",
   * "spec", "change". The finder used to print its own internals: a person
   * reading Runs was told "None of the 43 items contain that" beside a heading
   * that said "43 runs on the record", which is the component's noun reaching
   * the screen past the product's. Singular; the plural is the singular plus an
   * s unless `nounPlural` says otherwise.
   */
  noun?: string;
  /** For the nouns an s does not fix. */
  nounPlural?: string;
  /** Shown when the list itself is empty, before anything is typed. */
  emptyTitle?: string;
  emptyDetail?: string;
  /** A read that did not come back. Never an empty state. */
  failure?: { message: string; onRetry?: () => void };
};

const FOCUS =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

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
  noun = "item",
  nounPlural,
}: SearchProps<Item>) {
  const [query, setQuery] = useState("");
  const [capLifted, setCapLifted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const many = nounPlural ?? `${noun}s`;

  /*
   * NOTHING IS LISTED UNTIL SOMEBODY TYPES.
   *
   * This used to return every item for an empty query and render the first
   * `maxResults` of them as a live list, with its own cap line and its own
   * "Show all N" button. That is defensible for a command palette standing
   * alone. It is a defect everywhere this component is actually mounted, which
   * is above a grid of the same rows: opening the finder on Runs put five run
   * titles directly above the same eight run titles, two "Showing X of 43"
   * lines and two "Show all 43" buttons that did different things, before a
   * single character was typed. Design had the same pair.
   *
   * Both call sites had already written the rule and neither could keep it.
   * RunsGrid's header says the finder is summoned "because left open over the
   * grid it would render the same runs twice, a few pixels apart, which is the
   * defect this surface already removed once". Summoning changes WHEN it is on
   * screen, not WHETHER it duplicates the list once it is, so the rule has to
   * live here, in the one place both surfaces go through.
   *
   * At rest it says what it will search over instead. That is a fact the grid
   * does not carry, it is one line rather than a second list, and it answers
   * the only question a person has before typing: is the thing I want in here.
   */
  const resting = query.trim() === "";

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => itemText(item).toLowerCase().includes(q));
  }, [items, itemText, query]);

  const shown = capLifted ? matched : matched.slice(0, maxResults);
  const withheld = resting ? 0 : matched.length - shown.length;

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

  /*
   * ── WHY EVERY BRANCH BELOW CARRIES A KEY ────────────────────────────────
   *
   * These panels all land in the same slot, and four of the five are a plain
   * `div`. React reconciles by type and position, so switching from the resting
   * line to "No matches" PATCHED THE SAME ELEMENT: the `animation` declaration
   * was already on it and unchanged, so the browser had nothing to restart and
   * the entrance never played. The state that most needs to announce itself —
   * you typed something and it excluded everything — was the one that arrived
   * without a frame of motion, and it only ever looked right on first mount,
   * which is the one case nobody tests by typing.
   *
   * A distinct key per branch forces the unmount/mount, and a CSS animation on
   * a freshly mounted node runs. It costs one string per branch.
   */
  const panel = failure ? (
    <div key="failure" className="flex flex-col items-center gap-2 px-4 py-8 text-center">
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
          className={`mt-1 rounded-mrd-ctl bg-mrd-solid px-2.5 py-1 text-[12.5px] font-medium text-mrd-on-solid transition-opacity hover:opacity-90 ${FOCUS}`}
          style={{
            transitionDuration: "var(--mrd-d-press)",
            /* The specular top edge a filled control carries in this system.
               Without it the retry is a flat slab, which is the one control on
               this panel that most needs to look pressable. */
            boxShadow: "inset 0 1px 0 var(--mrd-sheen), var(--mrd-shadow-card)",
          }}
        >
          Try again
        </button>
      )}
    </div>
  ) : items.length === 0 ? (
    <div
      key="empty"
      className="flex flex-col items-center gap-1.5 px-4 py-8 text-center"
      /* The reference fades its empty panel in and the port had dropped it. */
      style={{ animation: "mrd-fade-in var(--mrd-d-enter) var(--mrd-ease) both" }}
    >
      <span
        aria-hidden
        className="mb-1 flex size-8 items-center justify-center rounded-mrd-ctl border border-mrd-line bg-mrd-sink text-mrd-mute"
      >
        <MagnifierIcon size={15} />
      </span>
      <span className="text-[13px] font-medium text-mrd-ink">{emptyTitle}</span>
      {emptyDetail && <span className="text-[12px] text-mrd-mute">{emptyDetail}</span>}
    </div>
  ) : resting ? (
    /*
     * The resting state. One line, no list, no cap, nothing to press. It names
     * the pool so a person knows whether what they want is even in scope, and
     * then gets out of the way of the grid it is sitting on top of.
     */
    <div
      key="resting"
      className="px-3 py-4 text-center"
      style={{ animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease) both" }}
    >
      <span className="text-[12.5px] text-mrd-mute">
        Type to search {items.length === 1 ? `the 1 ${noun}` : `all ${items.length} ${many}`}.
      </span>
    </div>
  ) : matched.length === 0 ? (
    /*
     * Distinct from the state above on purpose. "There is nothing" and "your
     * query excluded everything" are different facts and only the second one
     * has a way back, so only the second one offers a button.
     */
    <div
      key="no-matches"
      className="flex flex-col items-center gap-1.5 px-4 py-8 text-center"
      style={{ animation: "mrd-fade-in var(--mrd-d-enter) var(--mrd-ease) both" }}
    >
      <span className="text-[13px] font-medium text-mrd-ink">No matches</span>
      <span className="text-[12px] text-mrd-mute">
        None of the {items.length} {items.length === 1 ? noun : many} contain that.
      </span>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          inputRef.current?.focus();
        }}
        className={`mt-1 rounded-mrd-ctl border border-mrd-edge px-2.5 py-1 text-[12.5px] font-medium text-mrd-prose text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        Clear the search
      </button>
    </div>
  ) : (
    /* No inner scroll here either, same ruling as the grid's. The list is short
       by construction now: it renders only once somebody types and it stops at
       `maxResults`, which is five or six at both call sites. Lifting the cap
       grows the panel and the page scrolls, which is the one behaviour. */
    <ul key="results" className="p-1">
      {shown.map((item, index) => (
        <li key={itemKey(item)}>
          <button
            ref={(node) => {
              rowRefs.current[index] = node;
            }}
            type="button"
            onClick={() => onSelect?.(item)}
            onKeyDown={(event) => onRowKeyDown(event, index)}
            className={`flex min-h-8 w-full items-center rounded-mrd-xs px-2 py-1.5 text-left text-[13px] text-mrd-prose text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
            /*
             * Each row fades in, which the port had dropped. It matters more
             * here than it looks: results REPLACE each other as the query
             * changes, and without a fade the list swaps contents in a single
             * frame — the reader cannot tell whether it re-ranked or never
             * moved. Short and un-staggered on purpose; a stagger on a list
             * that re-renders on every keystroke reads as lag.
             */
            style={{
              transitionDuration: "var(--mrd-d-press)",
              animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease) both",
            }}
          >
            {renderItem ? renderItem(item) : <Hit text={itemText(item)} query={query.trim()} />}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      data-mrd=""
      className="w-full overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet"
    >
      {/*
       * A LABEL, not a div, and it carries the reference's row hover.
       *
       * The reference paints the whole strip on hover, which is the right
       * signal — the strip IS the field — but it draws it on an inert div, so
       * the twelve pixels of padding and the magnifier light up and then do
       * nothing when pressed. Nesting the input in a label makes that true
       * instead of decorative: clicking anywhere on the strip, magnifier
       * included, lands the caret. The input keeps its own `aria-label`, and the
       * wrapper adds no second name because it holds no text of its own.
       *
       * `cursor-text` rather than the pointer the system gives `label[for]`,
       * because what the strip does when pressed is put a caret in a field, and
       * a hand cursor over a text field promises a click target instead.
       */}
      <label
        className="flex h-10 cursor-text items-center gap-2 border-b border-mrd-line px-3 transition-colors hover:bg-mrd-hover"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
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
            /*
             * `--mrd-lift`, not `--mrd-hover`. The reference fills this on hover
             * at roughly 8% of its line colour; our hover token is 4.5% and was
             * chosen to be almost imperceptible under a pointer, which is right
             * for a full-width row and wrong for a 22px circle where it is the
             * only thing saying the target was found. `lift` is the system's
             * "this now has a control's face", and it steps clear of the sheet
             * in both grounds.
             */
            className={`flex size-5.5 items-center justify-center rounded-full text-mrd-mute transition-colors hover:bg-mrd-lift hover:text-mrd-ink ${FOCUS}`}
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
      </label>

      {/*
       * Politely announced, not assertively. The count changing on every
       * keystroke is worth knowing and not worth interrupting for, and an
       * assertive region here talks over the letters being typed.
       */}
      {/* Silent at rest. Announcing "43 of 43 match" the moment the panel opens
          reads a count nobody asked for over the top of someone starting to
          type, and it is not true that they matched: nothing was searched. */}
      <div role="status" aria-live="polite" className="sr-only">
        {failure
          ? failure.message
          : resting
            ? ""
            : `${matched.length} of ${items.length} ${items.length === 1 ? noun : many} match`}
      </div>

      {panel}

      {withheld > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-mrd-line bg-mrd-sink px-3 py-2">
          {/*
           * A SENTENCE, so the sans face with tabular figures — not mono. The
           * system's rule is that mono carries a number, a duration, an id or a
           * timestamp and nothing else; a clause that merely contains figures is
           * prose and setting it in mono makes the whole line read as machine
           * output. `tabular-nums` is what keeps the digits from jittering as
           * the count changes, and it is all that was ever needed here. This is
           * the third time this exact defect has been found in this repo.
           */}
          <span className="text-[12px] text-mrd-mute tabular-nums">
            Showing {shown.length} of {matched.length}. {withheld} not shown.
          </span>
          <button
            type="button"
            onClick={() => setCapLifted(true)}
            className={`rounded-mrd-ctl border border-mrd-edge px-2 py-0.5 text-[12px] font-medium text-mrd-prose text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
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
