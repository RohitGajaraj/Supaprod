import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/*
 * PROMPT BAR, the Ask composer.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Prompt Bar"
 *                 (their file: components/PromptBar.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * Asking a question about this workspace usually means naming what to look at.
 * A plain text field makes the person describe the thing; @ lets them point at
 * it. That is the whole reason to carry a composer this heavy rather than an
 * input and a button.
 *
 * ── IT LIVES IN A PANE, NOT ALONG THE FOOT OF THE PAGE ──────────────────
 * A standing ruling: Ask lives top right and opens a pane, and the bottom
 * composer strip is rejected. The reference is built as a page-width composer
 * and hard-codes its own frame (`max-w-105`, a 384px min height, `justify-end`
 * and a bottom pad) because it is posing for a demo page. All of that is
 * removed. This component fills the width it is given and nothing else, and
 * `maxWidth` is a prop for the caller that needs to cap it. A pane is narrow,
 * which makes the wrap behaviour below load-bearing rather than a nicety: the
 * input moves onto its own line as soon as the text outgrows the inline slot,
 * instead of squeezing into a few characters between the controls.
 *
 * ── WHAT THE COLOUR IS DOING ────────────────────────────────────────────
 * Three states earn a hue and every other pixel is neutral.
 *   Connect       A person is required. A source is not linked and no machine
 *                 can fix that; someone has to go and authorise it. That is
 *                 the literal definition of `--mrd-you`, used literally.
 *   Connected     An outcome, stating what happened and asking for nothing,
 *                 so it hands off to `--mrd-pass`.
 *   Dictating     A machine is working: `--mrd-agent`, while the mic is live.
 * The send button stays neutral on purpose. See the note beside it.
 *
 * ── WHAT WAS DROPPED FROM THE SOURCE, AND WHY ───────────────────────────
 *   The `glimm` rainbow shader. It is not a dependency here, and a seven-hue
 *   sweep celebrating a model change is decoration made of colour. Meridian's
 *   one rule is that colour carries status and never decorates, so this is not
 *   a thing to reimplement later with different libraries.
 *   The autoplay demo loop. It types into the field by itself to show the
 *   menus off on a marketing page. In a product it would fight the person.
 *   The Figma, Slack and Gmail brand marks. They hard-code brand hex, which no
 *   token can resolve, and they are not this product's sources anyway. Callers
 *   pass their own `icon` node instead.
 *   The faked dictation transcript and the faked file attach. Both invent data
 *   on a timer. They are props now, and the controls are absent unless a real
 *   handler is supplied, because a mic that returns a canned sentence is worse
 *   than no mic.
 */

export type PromptSource = {
  key: string;
  /** What a reader would call it. */
  name: string;
  desc?: string;
  icon?: ReactNode;
  /** Present only on sources that need linking before they can be read. */
  connect?: "needed" | "done";
  /** The row that opens the file picker rather than inserting a mention. */
  attach?: boolean;
};

export type PromptCommand = { key: string; name: string; desc?: string };
export type PromptModel = { key: string; name: string; tag?: string };

function Icon({
  children,
  size = 15,
  strokeWidth = 1.8,
}: {
  children: ReactNode;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** The last @word or /word being typed, if the caret is sitting in one. */
function parseToken(draft: string): { kind: "at" | "slash"; query: string; start: number } | null {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!match) return null;
  return {
    kind: match[2] === "@" ? "at" : "slash",
    query: match[3].toLowerCase(),
    start: match.index + match[1].length,
  };
}

const CONTROL_GAP = 4;
const INPUT_MIN_H = 28;
const INPUT_MAX_H = 100;

/*
 * The composer clips itself — it has to, because it carries a full radius in
 * the pill variant and its controls sit six pixels from that curve. An outset
 * focus ring on a control that close to a clipping rounded edge comes back with
 * its outer half sheared off, which reads as a broken border rather than as
 * focus. `mrd-focus-inset` draws the ring inside the control instead, which is
 * exactly what that class is for.
 */
const FOCUS_INSET =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

export function PromptBar({
  sources = [],
  commands = [],
  models = [],
  modelKey,
  onModelChange,
  attachments = [],
  onAttach,
  onRemoveAttachment,
  onSend,
  onDictate,
  listening = false,
  onConnect,
  placeholder = "Ask about this workspace",
  variant = "rounded",
  maxWidth,
  menuPlacement = "above",
}: {
  sources?: PromptSource[];
  commands?: PromptCommand[];
  /** With none, the model picker is not rendered at all. */
  models?: PromptModel[];
  modelKey?: string;
  onModelChange?: (model: PromptModel) => void;
  attachments?: string[];
  /** Omitted, the attach row and the plus button are absent. */
  onAttach?: () => void;
  onRemoveAttachment?: (index: number) => void;
  onSend?: (text: string) => void;
  /** Omitted, the mic is absent. Dictation state is owned by the caller. */
  onDictate?: () => void;
  listening?: boolean;
  onConnect?: (source: PromptSource) => void;
  placeholder?: string;
  variant?: "rounded" | "pill";
  /** Cap the composer inside a wide container. Unset, it fills its parent. */
  maxWidth?: number | string;
  /** In a pane the composer sits at the foot, so menus open upward by default. */
  menuPlacement?: "above" | "below";
}) {
  const pill = variant === "pill";
  const [draft, setDraft] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rowBox, setRowBox] = useState<{ top: number; height: number } | null>(null);
  const [modelBox, setModelBox] = useState<{ top: number; height: number } | null>(null);
  const [modelHovered, setModelHovered] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modelRowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const model = models.find((m) => m.key === modelKey) ?? models[0];
  const modelIndex = models.findIndex((m) => m.key === model?.key);

  /*
   * The menu is a listbox the textarea drives, so the two need to be joined by
   * id: without `aria-activedescendant` a screen reader hears nothing at all as
   * the arrow keys walk the rows, and the field is announced as a plain
   * multi-line text box with a menu nobody mentioned. `useId` rather than a
   * counter, because two composers on one page must not collide.
   */
  const listId = useId();
  const rowId = (index: number) => `${listId}-row-${index}`;

  const token = dismissed ? null : parseToken(draft);
  const menu: "at" | "slash" | null = plusOpen ? "at" : (token?.kind ?? null);
  const query = plusOpen ? "" : (token?.query ?? "");

  const atRows: PromptSource[] = sources.filter((s) => s.name.toLowerCase().includes(query));
  const slashRows: PromptCommand[] = commands.filter((c) =>
    c.name.replace(/^\//, "").toLowerCase().startsWith(query),
  );
  const rows: { key: string; name: string; desc?: string }[] =
    menu === "at" ? atRows : menu === "slash" ? slashRows : [];

  useEffect(() => {
    setActive(0);
    setEngaged(false);
  }, [menu, query]);

  /*
   * ONE highlight glides to the active row rather than every row toggling its
   * own background. With a keyboard it reads as a single object being moved,
   * which is what arrow keys actually do, and it survives the list refiltering
   * under the caret as the query narrows.
   */
  useLayoutEffect(() => {
    const target = rowRefs.current[active];
    if (target) setRowBox({ top: target.offsetTop, height: target.offsetHeight });
  }, [menu, query, active, rows.length]);

  useLayoutEffect(() => {
    if (!modelOpen) return;
    const target = modelRowRefs.current[modelHovered ?? Math.max(modelIndex, 0)];
    if (target) setModelBox({ top: target.offsetTop, height: target.offsetHeight });
  }, [modelOpen, modelHovered, modelIndex]);

  useEffect(() => {
    if (!modelOpen) setModelHovered(null);
  }, [modelOpen]);

  /*
   * ── A MENU CLOSES WHEN YOU LOOK AWAY FROM IT ────────────────────────────
   * Neither menu had any way out except picking a row or pressing the control
   * that opened it. The reference can live with that because it is a demo on a
   * page with nothing else on it; in a pane, a menu that survives a click on
   * the document behind it is a panel of stray buttons floating over whatever
   * the reader moved on to.
   *
   * Escape is handled here as well as in the textarea's own key handler, and
   * that is not a duplicate: the textarea's copy only fires while the caret is
   * in it, and once someone has tabbed into the menu itself there is nothing
   * listening. Focus returns to the field rather than being dropped on the
   * body, because a keyboard user who loses the ring loses their place.
   */
  useEffect(() => {
    if (!menu && !modelOpen) return;
    const dismiss = () => {
      setDismissed(true);
      setPlusOpen(false);
      setModelOpen(false);
    };
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      dismiss();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      dismiss();
      inputRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, modelOpen]);

  /*
   * Move the text onto its own line once it outgrows the inline slot, then let
   * the field grow to a compact maximum. The measurement is against a hidden
   * span holding the same text at the same metrics, because a textarea cannot
   * report the width its content wants.
   *
   * The reference drives this through a five-column grid with hard-coded column
   * starts. That breaks the moment a control is absent, and here three of them
   * are optional. Rebuilt as flex: one row inline, and a stacked pair when the
   * text takes the top line. Same behaviour, and it survives a missing mic.
   */
  useLayoutEffect(() => {
    const input = inputRef.current;
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!input || !row || !measure) return;

    const lead = leadRef.current?.offsetWidth ?? 0;
    const trail = trailRef.current?.offsetWidth ?? 0;
    const inline = row.clientWidth - lead - trail - CONTROL_GAP * 3;
    const needsFullWidth = draft.includes("\n") || measure.offsetWidth + 8 > inline;
    if (needsFullWidth !== expanded) setExpanded(needsFullWidth);

    input.style.height = "0px";
    const content = input.scrollHeight;
    input.style.height = `${Math.min(Math.max(content, INPUT_MIN_H), INPUT_MAX_H)}px`;
    input.style.overflowY = content > INPUT_MAX_H ? "auto" : "hidden";
  }, [draft, expanded, attachments.length]);

  const closeMenus = () => {
    setPlusOpen(false);
    setModelOpen(false);
  };

  const pick = (row: { key: string; name: string }) => {
    const source = menu === "at" ? sources.find((s) => s.key === row.key) : undefined;
    if (source?.attach) {
      onAttach?.();
      if (token) setDraft(draft.slice(0, token.start));
    } else {
      const head = token ? draft.slice(0, token.start) : draft;
      setDraft(menu === "at" ? `${head}@${row.name} ` : `${head}${row.name} `);
    }
    setPlusOpen(false);
    setDismissed(false);
    inputRef.current?.focus();
  };

  const canSend = draft.trim().length > 0 || attachments.length > 0;
  const send = () => {
    if (!canSend) return;
    onSend?.(draft.trim());
    setDraft("");
    closeMenus();
  };

  const menuPos = menuPlacement === "above" ? "bottom-full mb-2" : "top-full mt-2";
  const menuOrigin = menuPlacement === "above" ? "bottom center" : "top center";
  const radius = pill
    ? attachments.length > 0 || expanded
      ? "rounded-mrd-pane"
      : "rounded-full"
    : "rounded-mrd-card";
  const btnRadius = pill ? "rounded-full" : "rounded-mrd-ctl";

  const leading = onAttach ? (
    <div ref={leadRef} className="flex shrink-0 items-center">
      <button
        type="button"
        aria-label="Add attachments and sources"
        aria-expanded={plusOpen}
        onClick={() => {
          setModelOpen(false);
          setPlusOpen((open) => !open);
          inputRef.current?.focus();
        }}
        /*
         * HELD OPEN IS NOT HOVER. This wore `--mrd-hover` while its menu was
         * open — a 4.5% wash tuned to be almost imperceptible under a pointer —
         * so the one control holding a panel open looked exactly like the one
         * the mouse happened to be resting on. `--mrd-select` is the token for
         * a held-open toggle, and it is the difference between a button that
         * looks pressed and a button that looks brushed.
         */
        className={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${btnRadius} ${FOCUS_INSET} ${
          plusOpen
            ? "bg-mrd-select text-mrd-ink"
            : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-ink"
        }`}
      >
        <Icon size={16} strokeWidth={2}>
          <path d="M12 5v14M5 12h14" />
        </Icon>
      </button>
    </div>
  ) : null;

  const trailing = (
    <div ref={trailRef} className="flex shrink-0 items-center gap-1">
      {model && (
        <button
          type="button"
          aria-expanded={modelOpen}
          aria-label="Choose model"
          onClick={() => {
            setPlusOpen(false);
            setModelOpen((open) => !open);
          }}
          /* Open is a held state here too, and it takes the same stop the plus
             button takes, so the two never disagree about what "open" looks
             like inside one composer. */
          className={`flex h-7 shrink-0 items-center gap-1 px-1.5 text-[12px] font-medium transition-colors duration-150 ${btnRadius} ${FOCUS_INSET} ${
            modelOpen
              ? "bg-mrd-select text-mrd-ink"
              : "text-mrd-prose text-mrd-body hover:bg-mrd-hover hover:text-mrd-ink"
          }`}
        >
          {model.name}
          <span className="text-mrd-mute">
            <Icon size={11} strokeWidth={2.4}>
              <path d="M6 9l6 6 6-6" />
            </Icon>
          </span>
        </button>
      )}

      {onDictate && (
        <button
          type="button"
          aria-label={listening ? "Stop dictation" : "Start dictation"}
          aria-pressed={listening}
          onClick={onDictate}
          /*
           * A LIVE MIC IS A MACHINE WORKING, AND IT HAS TO LOOK LIKE ONE. The
           * pressed state was `--mrd-hover`, which is the wash a pointer leaves
           * behind: the single loudest state this control has was drawn at 4.5%
           * and vanished on the dark ground. It now takes a tint of the agent
           * hue, which is the meaning it already carries in its glyph colour —
           * something is listening, and no person is being asked for anything.
           */
          className={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${btnRadius} ${FOCUS_INSET} ${
            listening
              ? "bg-mrd-agent/15 text-mrd-agent"
              : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-ink"
          }`}
        >
          {listening ? (
            <span className="flex h-3.5 items-center gap-[2.5px]" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[2.5px] rounded-full bg-current"
                  style={{
                    height: "100%",
                    animation: `mrd-pixel-on 900ms ease-in-out ${i * 150}ms infinite`,
                  }}
                />
              ))}
            </span>
          ) : (
            <Icon size={15} strokeWidth={2}>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
            </Icon>
          )}
        </button>
      )}

      {/*
       * Neutral, not inverted. Meridian's primary is the next stop on the same
       * ladder the surfaces climb, because a saturated or inverted primary was
       * tried twice in this product and rejected twice for spending the one
       * accent on chrome. Send is unmistakable here because nothing else in the
       * composer uses this stop, not because it shouts.
       */}
      <button
        type="button"
        aria-label="Send"
        disabled={!canSend}
        onClick={send}
        className={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.94] ${btnRadius} ${FOCUS_INSET} ${
          canSend
            ? /* The live face takes the specular top edge every filled control
                 in this system carries, which is what makes it read as a raised
                 object rather than a lighter square. The dead face deliberately
                 does not: it is not a dimmed copy of the live button, it is a
                 different object, sitting IN the composer rather than on it. */
              "bg-mrd-solid text-mrd-on-solid shadow-[inset_0_1px_0_var(--mrd-sheen)]"
            : "bg-mrd-lift text-mrd-faint"
        }`}
      >
        <Icon size={16} strokeWidth={2.4}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </Icon>
      </button>
    </div>
  );

  return (
    <div
      data-mrd=""
      ref={rootRef}
      className="w-full"
      style={maxWidth === undefined ? undefined : { maxWidth }}
    >
      {/* The composer is the anchor. Menus are measured off its edge. */}
      <div className="relative">
        {menu && (
          <div
            onMouseLeave={() => setEngaged(false)}
            className={`absolute inset-x-0 z-10 rounded-mrd-ctl bg-mrd-float p-1 ${menuPos}`}
            style={{
              boxShadow: "var(--mrd-shadow-float)",
              /*
               * `pop-in` scales from 98, so the menu grows out of the composer
               * edge it is anchored to — which is the only reason the
               * `transformOrigin` below means anything. Set against `fade-up`,
               * as this was, the origin was decorating an animation with no
               * transform in it.
               */
              animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease) both",
              transformOrigin: menuOrigin,
            }}
          >
            {/*
             * THE HIGHLIGHT IS THE CURSOR, NOT A HOVER WASH. It was painted
             * `--mrd-hover`, 4.5%, which is deliberately almost imperceptible —
             * and this bar is not reporting where the pointer is resting, it is
             * reporting the row that Enter will pick, moved by the arrow keys
             * with no pointer involved at all. `--mrd-select` is the stop for a
             * thing that has been picked, solved for both grounds. It still
             * waits for `engaged`, so nothing is preselected before the reader
             * has hovered or arrowed: the strength changed, not the timing.
             */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1 rounded-mrd-xs bg-mrd-select"
              style={{
                top: rowBox?.top ?? 0,
                height: rowBox?.height ?? 0,
                opacity: rowBox && engaged && rows.length > 0 ? 1 : 0,
                transition:
                  "top var(--mrd-d-move) var(--mrd-ease), height var(--mrd-d-move) var(--mrd-ease), opacity 150ms ease",
              }}
            />
            {/*
             * The listbox wraps the ROWS ONLY, not the whole panel. A listbox
             * may contain options and nothing else, and the panel also holds
             * the empty line and the footer hint below — put the role on the
             * panel and those two become stray text inside a list of choices,
             * which is how a screen reader ends up reading a hint as an option.
             * The wrapper adds no box of its own, so every measurement the
             * gliding highlight takes off `offsetTop` is unchanged.
             */}
            <div id={listId} role="listbox" aria-label={menu === "at" ? "Sources" : "Commands"}>
              {rows.map((row, i) => {
                const source = menu === "at" ? sources.find((s) => s.key === row.key) : undefined;
                return (
                  <button
                    key={row.key}
                    id={rowId(i)}
                    role="option"
                    aria-selected={i === active}
                    type="button"
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => {
                      setActive(i);
                      setEngaged(true);
                    }}
                    onClick={() => pick(row)}
                    className="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-mrd-xs px-2 text-left"
                  >
                    {source?.icon && (
                      <span className="flex size-5.5 shrink-0 items-center justify-center text-mrd-prose text-mrd-body">
                        {source.icon}
                      </span>
                    )}
                    <span className="shrink-0 text-[12.5px] font-medium text-mrd-ink">
                      {row.name}
                    </span>
                    {row.desc && (
                      <span className="min-w-0 flex-1 truncate mrd-meta">
                        {row.desc}
                      </span>
                    )}
                    {/*
                     * "Connect" is a job only a person can do, which is exactly
                     * what `--mrd-you` means everywhere else in this product, so
                     * it is used with no reinterpretation. "Connected" is an
                     * outcome and asks for nothing, so it hands off to the
                     * outcome hue rather than staying in the person family.
                     */}
                    {source?.connect && (
                      <span
                        role="button"
                        tabIndex={-1}
                        onClick={(event) => {
                          event.stopPropagation();
                          onConnect?.(source);
                        }}
                        className={`ml-auto shrink-0 text-[12px] font-medium transition-colors duration-100 ${
                          source.connect === "done"
                            ? "text-mrd-pass"
                            : "text-mrd-you hover:underline"
                        }`}
                      >
                        {source.connect === "done" ? "Connected" : "Connect"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/*
             * EMPTY, which on a fresh workspace is what both menus look like:
             * no sources linked and no commands defined. It has to say which
             * of the two it is, so "nothing matched" never gets mistaken for
             * "nothing exists".
             */}
            {rows.length === 0 && (
              <div className="flex h-9 items-center px-2 mrd-meta">
                {menu === "at"
                  ? sources.length === 0
                    ? "No sources linked yet"
                    : `No sources match "${query}"`
                  : commands.length === 0
                    ? "No commands set up yet"
                    : `No commands match "${query}"`}
              </div>
            )}

            <div className="mt-1 border-t border-mrd-line px-2 pt-1.5 pb-1 text-[11px] text-mrd-mute">
              {menu === "at" ? "Type to search sources and files" : "Type to search commands"}
            </div>
          </div>
        )}

        {modelOpen && models.length > 0 && (
          <div
            onMouseLeave={() => setModelHovered(null)}
            className={`absolute right-0 z-10 w-44 rounded-mrd-ctl bg-mrd-float p-1 ${menuPos}`}
            style={{
              boxShadow: "var(--mrd-shadow-float)",
              animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease) both",
              transformOrigin: menuPlacement === "above" ? "bottom right" : "top right",
            }}
          >
            {/*
             * This highlight now stands on the CURRENT model the moment the
             * menu opens, and glides to whatever is hovered. It used to be
             * invisible until a pointer arrived, which meant opening the menu
             * from the keyboard showed nothing at all about where you already
             * were — the tick on the right was the only clue, and it is nine
             * pixels wide. Same `--mrd-select` stop as the source menu, so one
             * composer has one idea of what "this row" looks like.
             */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1 rounded-mrd-xs bg-mrd-select"
              style={{
                top: modelBox?.top ?? 0,
                height: modelBox?.height ?? 0,
                opacity: modelBox ? 1 : 0,
                transition:
                  "top var(--mrd-d-move) var(--mrd-ease), height var(--mrd-d-move) var(--mrd-ease), opacity 150ms ease",
              }}
            />
            {models.map((m, i) => (
              <button
                key={m.key}
                type="button"
                ref={(el) => {
                  modelRowRefs.current[i] = el;
                }}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setModelHovered(i)}
                onClick={() => {
                  onModelChange?.(m);
                  setModelOpen(false);
                  inputRef.current?.focus();
                }}
                className="relative z-10 flex h-7.5 w-full items-center gap-2 rounded-mrd-xs px-2 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-mrd-ink">
                  {m.name}
                </span>
                {m.tag && <span className="shrink-0 text-[11px] text-mrd-mute">{m.tag}</span>}
                <span
                  className={`shrink-0 text-mrd-ink ${m.key === model?.key ? "" : "invisible"}`}
                >
                  <Icon size={13} strokeWidth={2.5}>
                    <path d="M20 6L9 17l-5-5" />
                  </Icon>
                </span>
              </button>
            ))}
          </div>
        )}

        <div
          className={`relative isolate flex flex-col gap-1.5 overflow-hidden border border-mrd-line bg-mrd-sheet p-1.5 transition-[border-color,border-radius] duration-150 focus-within:border-mrd-edge ${radius}`}
          style={{ boxShadow: "var(--mrd-shadow-card)" }}
        >
          <span
            ref={measureRef}
            aria-hidden
            className="pointer-events-none invisible absolute whitespace-pre text-[13px] leading-[18px]"
          >
            {draft}
          </span>

          {attachments.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 pt-0.5 ${pill ? "px-1" : "px-0.5"}`}>
              {attachments.map((file, i) => (
                <span
                  key={`${file}-${i}`}
                  /*
                   * The hairline is drawn as an inset shadow rather than a
                   * border so it costs no layout: the chip is 26px because the
                   * controls beside it are, and a 1px border would make it 28
                   * and break that alignment. Without an edge of some kind the
                   * chip is a fill one step off the composer's own — legible on
                   * neither ground at a glance, which is what the reference's
                   * hairline is there to prevent.
                   */
                  className={`flex h-6.5 items-center gap-1.5 bg-mrd-sink py-1 pr-1 pl-1.5 text-[11.5px] text-mrd-prose text-mrd-body shadow-[inset_0_0_0_1px_var(--mrd-line)] ${
                    pill ? "rounded-full" : "rounded-mrd-chip"
                  }`}
                  /* A file appearing on the composer is something arriving that
                     was not there, which is the case `pop-in` exists for. */
                  style={{ animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease) both" }}
                >
                  <Icon size={12}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </Icon>
                  <span className="max-w-36 truncate">{file}</span>
                  {onRemoveAttachment && (
                    <button
                      type="button"
                      aria-label={`Remove ${file}`}
                      onClick={() => onRemoveAttachment(i)}
                      /*
                       * A 16px target needs a hover it can actually show. At
                       * `--mrd-hover`'s 4.5% over an already recessed chip
                       * there was nothing to see, and this is the control that
                       * throws a file away — it has to acknowledge the pointer
                       * before the click. `--mrd-line` is the weakest stop that
                       * reads at this size, and the reference reaches for its
                       * own line colour here for the same reason.
                       */
                      className={`flex size-4 items-center justify-center text-mrd-mute transition-colors duration-100 hover:bg-mrd-line hover:text-mrd-ink ${FOCUS_INSET} ${
                        pill ? "rounded-full" : "rounded-mrd-xs"
                      }`}
                    >
                      <Icon size={10} strokeWidth={2.5}>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </Icon>
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/*
           * ONE textarea, reordered by CSS rather than two branches swapping
           * places. Rendering a second textarea in an `expanded` branch reads
           * fine and is a real bug: React unmounts the first one the instant
           * the text wraps, so focus and caret position are lost in the middle
           * of a sentence, at exactly the keystroke that triggered the wrap.
           * `flex-wrap` plus `order` moves it without remounting it.
           */}
          <div ref={rowRef} className="flex flex-wrap items-end gap-1">
            <div className={`flex shrink-0 items-center ${expanded ? "order-2" : "order-1"}`}>
              {leading}
            </div>

            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setDismissed(false);
                setPlusOpen(false);
              }}
              onKeyDown={(event) => {
                if (menu && rows.length > 0) {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setEngaged(true);
                    setActive(
                      (c) => (c + (event.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length,
                    );
                    return;
                  }
                  if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
                    event.preventDefault();
                    pick(rows[active]);
                    return;
                  }
                }
                if (event.key === "Escape") {
                  setDismissed(true);
                  closeMenus();
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={listening ? "Listening" : placeholder}
              aria-label="Prompt"
              /*
               * The field is the menu's keyboard: the arrow keys move a
               * selection it owns and never leaves. That is a combobox, and
               * saying so is what makes the row under the cursor audible —
               * `aria-activedescendant` is the only mechanism that announces a
               * selection which lives somewhere other than the focused element.
               * Without these four attributes the menu is, to a screen reader,
               * a panel of buttons that nobody mentioned appearing.
               */
              role="combobox"
              aria-expanded={menu !== null}
              aria-controls={menu ? listId : undefined}
              aria-activedescendant={menu && rows.length > 0 ? rowId(active) : undefined}
              aria-autocomplete="list"
              className={`min-h-7 min-w-0 resize-none bg-transparent px-1 py-[5px] text-[13px] leading-[18px] text-mrd-ink outline-none [overflow-wrap:anywhere] placeholder:text-mrd-mute ${
                expanded ? "order-1 w-full" : "order-2 w-full flex-1"
              }`}
            />

            <div
              className={`flex shrink-0 items-center ${expanded ? "order-3 ml-auto" : "order-3"}`}
            >
              {trailing}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromptBar;
