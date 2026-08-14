import { useEffect, useRef, useState } from "react";

/*
 * FINE-TUNE CARD, the Design station's property inspector.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Fine-tune Card"
 *                 (their file: components/FineTuneCard.tsx), MIT licensed,
 *                 read on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * How this copy was taken: six agent tabs were open on that page at once and it
 * never reached document idle, so the panel could not be clicked. The panel is
 * fed by the page's own inlined source payload, which declares each blob's byte
 * length ahead of it. This blob declared 0x26af and arrived at 9903 bytes, so it
 * is the whole file rather than a truncated or inferred read.
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * Design scaffolds surfaces and the agent proposes their properties. Until now
 * there is no place to disagree with a proposed value at the granularity it was
 * proposed at, so the only correction available is to reject the whole surface
 * and ask again. This card is where a person adjusts one number instead.
 *
 * ── WHERE THEIR COLOUR WENT, AND THE ONE PLACE IT WOULD HAVE LIED ───────
 * Their header shows a shimmering "Adjust" while untouched and a GREEN "Edited"
 * once anything changes. Green is ported out on purpose. In this system green
 * and red mean outcome and nothing else, and an edit is not an outcome: nothing
 * has run, nothing has passed, and painting it green would teach the reader
 * that a changed number is a settled result. What actually changed is WHO owns
 * the value, so the two states carry the two hues that mean exactly that:
 *
 *   untouched   the agent's proposal stands, so azure, a machine's work
 *   edited      a person has overridden it, so orchid
 *
 * The same rule runs down into the fields. A field whose value differs from the
 * proposal is orchid, because orchid is the mark of a person in this product,
 * and that makes the card readable in one sweep: everything orchid is yours.
 * The two never compete for one glance, because azure carries the lower chroma
 * of the pair by design: an agent working is ambient, and a value you have
 * taken ownership of is not.
 *
 * Focus is a neutral edge, never a semantic hue. Their open dropdown draws its
 * focus ring in the accent, which spends a meaning-carrying colour on the fact
 * that a menu is open.
 */

export type FineTuneField = {
  key: string;
  label: string;
  /**
   * The agent's proposed value. It is also the baseline that "edited" is
   * measured against, which is why there is no separate `initial`: a proposal
   * you have not moved away from IS the current value.
   */
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
};

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-edge-focus)]";

function ScrubField({
  field,
  value,
  onChange,
}: {
  field: FineTuneField;
  value: number;
  onChange: (next: number) => void;
}) {
  const drag = useRef<{ x: number; v: number } | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const step = field.step ?? 1;
  const edited = value !== field.value;
  const clamp = (next: number) => Math.min(field.max, Math.max(field.min, Math.round(next)));

  return (
    /*
     * A div, not their `<label>`. A label may own exactly one labelable control
     * and this row holds two: the scrub handle, which is a span carrying
     * role=slider and is not labelable at all, and the number input. Wrapping
     * both meant the label's implicit association silently landed on the input
     * and the slider had no name but the one it set on itself. Both controls
     * name themselves explicitly here and the wrapper claims nothing.
     */
    <div
      className="flex h-6.5 min-w-0 items-center gap-1 rounded-mrd-chip py-1 pr-1 pl-0.5 transition-[background-color,box-shadow] duration-200"
      style={{
        background: edited ? "var(--mrd-sheet)" : "var(--mrd-sink)",
        boxShadow: edited ? "0 0 0 1px var(--mrd-you)" : "none",
      }}
    >
      <span
        role="slider"
        aria-label={field.label}
        aria-valuenow={value}
        aria-valuemin={field.min}
        aria-valuemax={field.max}
        /* Without this a reader says "100" for a percentage and "100" for a pixel. */
        aria-valuetext={field.suffix ? `${value}${field.suffix}` : undefined}
        tabIndex={0}
        onPointerDown={(event) => {
          (event.target as HTMLElement).setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, v: value };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          onChange(clamp(drag.current.v + ((event.clientX - drag.current.x) / 2) * step));
        }}
        onPointerUp={() => (drag.current = null)}
        /* Their version leaves a drag live if the gesture is cancelled by the
         * system, which strands the value under the next pointer move. */
        onPointerCancel={() => (drag.current = null)}
        onLostPointerCapture={() => (drag.current = null)}
        onKeyDown={(event) => {
          const multiplier = event.shiftKey ? 10 : 1;
          if (event.key === "ArrowUp" || event.key === "ArrowRight") {
            event.preventDefault();
            onChange(clamp(value + step * multiplier));
          } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
            event.preventDefault();
            onChange(clamp(value - step * multiplier));
          } else if (event.key === "Home") {
            event.preventDefault();
            onChange(field.min);
          } else if (event.key === "End") {
            event.preventDefault();
            onChange(field.max);
          }
        }}
        className={`flex h-full shrink-0 cursor-ew-resize touch-none items-center rounded-mrd-xs px-0.5 text-[12px] select-none ${edited ? "text-mrd-you" : "text-mrd-mute hover:text-mrd-body"} ${FOCUS_RING}`}
      >
        {field.label}
      </span>

      {/*
       * The field keeps a draft of what was TYPED while the committed value
       * stays clamped. Their version binds the input straight to the clamped
       * number, which means the field cannot be cleared and retyped: select
       * all, press 1, and a min of 40 rewrites the box to 40 before the second
       * digit arrives, so 150 comes out as 4015. The draft is what you see
       * while editing, the clamped number is what the surface receives, and
       * blur throws the draft away so the two can never disagree at rest.
       */}
      <input
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={(event) => {
          const raw = event.target.value;
          if (!/^-?\d*$/.test(raw)) return;
          setDraft(raw);
          if (raw === "" || raw === "-") return;
          const next = Number(raw);
          if (!Number.isNaN(next)) onChange(clamp(next));
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            setDraft(null);
          }
        }}
        aria-label={`${field.label} value`}
        className="min-w-0 flex-1 bg-transparent font-mrd-mono text-[12px] text-mrd-ink outline-none tabular-nums"
      />
      {field.suffix && (
        <span aria-hidden className="shrink-0 pr-0.5 text-[11.5px] text-mrd-mute">
          {field.suffix}
        </span>
      )}
    </div>
  );
}

export type FineTuneLayout = "row" | "col" | "grid";

function LayoutGlyph({ kind }: { kind: FineTuneLayout }) {
  const cell = "size-1.5 rounded-[2px] border-[1.2px] border-current";
  if (kind === "row")
    return (
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cell} />
        ))}
      </span>
    );
  if (kind === "col")
    return (
      <span className="flex flex-col gap-0.5">
        {[0, 1].map((i) => (
          <span key={i} className={cell} />
        ))}
      </span>
    );
  return (
    <span className="grid grid-cols-2 gap-0.5">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cell} />
      ))}
    </span>
  );
}

const LAYOUTS: FineTuneLayout[] = ["row", "col", "grid"];

export function FineTuneCard({
  title = "Surface",
  fields,
  layout = "row",
  choices,
  choiceLabel = "Type",
  choicePlaceholder = "Select type",
  choice,
  agentLabel = "Proposed",
  onChange,
  onLayoutChange,
  onChoiceChange,
}: {
  title?: string;
  /**
   * Numeric properties the agent proposed. Their `value` is the baseline, and
   * it is read ONCE, when the card mounts. That is deliberate: a card that
   * re-seeded whenever the agent pushed a new proposal would silently discard
   * an edit someone was part way through. To show a fresh proposal, give the
   * card a new `key` at the call site, which says "this is a different card"
   * rather than pretending it is the same one.
   */
  fields: FineTuneField[];
  /** The proposed layout, and the baseline for the same reason. */
  layout?: FineTuneLayout;
  choices?: string[];
  choiceLabel?: string;
  choicePlaceholder?: string;
  choice?: string;
  /** What the header calls the agent's untouched state. */
  agentLabel?: string;
  onChange?: (key: string, value: number) => void;
  onLayoutChange?: (layout: FineTuneLayout) => void;
  onChoiceChange?: (choice: string) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.value])),
  );
  const [currentLayout, setCurrentLayout] = useState<FineTuneLayout>(layout);
  const [currentChoice, setCurrentChoice] = useState<string | undefined>(choice);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const edited =
    currentLayout !== layout ||
    currentChoice !== choice ||
    fields.some((field) => values[field.key] !== field.value);

  /*
   * A menu that only closes by clicking its own trigger is a trap on touch and
   * a nuisance with a keyboard. Escape returns focus to the trigger rather than
   * dropping it on the body, because a lost focus ring is how a keyboard user
   * loses their place entirely.
   */
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) optionRefs.current[0]?.focus();
  }, [menuOpen]);

  function setValue(key: string, next: number) {
    setValues((current) => ({ ...current, [key]: next }));
    onChange?.(key, next);
  }

  return (
    <div
      className="relative w-full max-w-60 rounded-mrd-card border border-mrd-line bg-mrd-sheet"
      style={{ boxShadow: "var(--mrd-shadow-float)" }}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2 border-b border-mrd-line px-[var(--mrd-s4)] py-[var(--mrd-s3)]">
        <span className="truncate text-[13px] font-medium text-mrd-ink">{title}</span>

        {edited ? (
          <span
            className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-mrd-you"
            style={{
              animation: "mrd-fade-up var(--mrd-d-move) var(--mrd-ease) both",
            }}
          >
            <svg
              aria-hidden
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Yours
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="flex size-4.5 items-center justify-center rounded-mrd-xs border border-mrd-agent-dim bg-mrd-agent/15">
              <svg aria-hidden width="9" height="9" viewBox="0 0 24 24" fill="var(--mrd-agent)">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
              </svg>
            </span>
            {/*
             * Shimmer rather than pulse, for the reason LoadingState gives: a
             * pulse changes the whole word's brightness and pulls the eye off
             * the numbers beside it.
             */}
            <span
              className="bg-clip-text text-[12px] font-medium text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--mrd-agent-dim) 35%, var(--mrd-agent) 50%, var(--mrd-agent-dim) 65%)",
                backgroundSize: "200% 100%",
                animation: "mrd-shimmer 1.4s linear infinite",
              }}
            >
              {agentLabel}
            </span>
          </span>
        )}
      </div>

      {/* layout */}
      <div className="flex flex-col gap-[var(--mrd-s3)] border-b border-mrd-line p-[var(--mrd-s4)]">
        <p className="text-[12.5px] font-medium text-mrd-ink">Layout</p>
        <div
          role="group"
          aria-label="Layout"
          className="relative grid grid-cols-3 rounded-mrd-ctl bg-mrd-sink p-0.5"
        >
          <span
            aria-hidden
            className="absolute inset-y-0.5 rounded-[6px] bg-mrd-lift"
            style={{
              width: "calc((100% - 4px) / 3)",
              left: 2,
              transform: `translateX(${LAYOUTS.indexOf(currentLayout) * 100}%)`,
              boxShadow: "var(--mrd-shadow-card)",
              transition: "transform var(--mrd-d-move) var(--mrd-ease)",
            }}
          />
          {LAYOUTS.map((kind) => {
            const isActive = kind === currentLayout;
            return (
              <button
                key={kind}
                type="button"
                aria-label={`${kind} layout`}
                aria-pressed={isActive}
                onClick={() => {
                  setCurrentLayout(kind);
                  onLayoutChange?.(kind);
                }}
                className={`relative z-10 flex h-6 items-center justify-center rounded-[6px] transition-colors duration-200 ${
                  isActive ? (kind === layout ? "text-mrd-ink" : "text-mrd-you") : "text-mrd-mute"
                } ${FOCUS_RING}`}
              >
                <LayoutGlyph kind={kind} />
              </button>
            );
          })}
        </div>

        {/*
         * Two per row, which is what makes W and H read as a pair rather than
         * as four unrelated numbers stacked.
         */}
        <div className="grid min-w-0 grid-cols-2 gap-2">
          {fields.map((field) => (
            <ScrubField
              key={field.key}
              field={field}
              value={values[field.key] ?? field.value}
              onChange={(next) => setValue(field.key, next)}
            />
          ))}
        </div>
      </div>

      {/* choice */}
      {choices && choices.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-[var(--mrd-s4)]">
          <span className="text-[12px] text-mrd-mute">{choiceLabel}</span>
          <div className="relative -mr-0.5 w-30">
            <button
              ref={triggerRef}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              aria-label={choiceLabel}
              onClick={() => setMenuOpen((open) => !open)}
              className={`flex h-6.5 w-full items-center justify-between rounded-mrd-chip border border-mrd-line bg-mrd-sink py-1 pr-1 pl-2 transition-[box-shadow] duration-200 ${FOCUS_RING}`}
              style={{
                boxShadow: menuOpen ? "0 0 0 1px var(--mrd-edge-focus)" : undefined,
              }}
            >
              <span
                className={`truncate text-[12px] ${currentChoice ? "text-mrd-ink" : "text-mrd-mute"}`}
              >
                {currentChoice ?? choicePlaceholder}
              </span>
              <svg
                aria-hidden
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--mrd-mute)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: menuOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform var(--mrd-d-move) var(--mrd-ease)",
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                role="listbox"
                aria-label={choiceLabel}
                className="absolute right-0 bottom-8 z-10 w-30 rounded-mrd-ctl border border-mrd-line bg-mrd-float p-1"
                style={{
                  boxShadow: "var(--mrd-shadow-float)",
                  animation: "mrd-fade-up var(--mrd-d-move) var(--mrd-ease) both",
                  transformOrigin: "bottom right",
                }}
              >
                {choices.map((option, index) => (
                  <button
                    key={option}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={option === currentChoice}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        optionRefs.current[(index + 1) % choices.length]?.focus();
                      } else if (event.key === "ArrowUp") {
                        event.preventDefault();
                        optionRefs.current[(index - 1 + choices.length) % choices.length]?.focus();
                      }
                    }}
                    onClick={() => {
                      setCurrentChoice(option);
                      onChoiceChange?.(option);
                      setMenuOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`flex h-6.5 w-full items-center rounded-mrd-xs px-2 text-left text-[12.5px] text-mrd-ink transition-colors duration-150 hover:bg-mrd-hover ${FOCUS_RING}`}
                    style={{
                      background: option === currentChoice ? "var(--mrd-hover)" : "transparent",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FineTuneCard;
