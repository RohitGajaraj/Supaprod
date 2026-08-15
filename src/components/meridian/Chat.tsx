import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/*
 * CHAT, the body of the Ask pane.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Chat"
 *                 (their file: components/ChatComposer.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * Ask lives top right and opens a pane. That is a standing ruling, and this is
 * what fills the pane. The thing it adds over a plain transcript is that the
 * agent's reply is not one blob: each step states what it read and how long it
 * took, so a person can see WHERE an answer came from before deciding whether
 * to believe it. A reply that arrives as a single paragraph is unauditable.
 *
 * ── WHAT THE COLOUR IS DOING ────────────────────────────────────────────
 * One hue appears in this file and only one: the agent hue, on a step that is
 * still running, because a machine is working. Nothing here asks for a person,
 * so the hue that means that never appears: a chat message does not block
 * anyone, and the moment something genuinely needs a decision it belongs in the
 * approval queue rather than buried in a transcript. Settled steps are pure
 * neutral, which is what makes the running one findable in a long thread
 * without reading a word.
 *
 * ── THE CASES THAT DECIDED THE LAYOUT ───────────────────────────────────
 * Empty is the real case here, not the dense one: this pane opens on a thread
 * with nothing in it every single time it is opened fresh. So the zero case is
 * a first-class branch rather than an afterthought, and the one-turn case (your
 * question sent, no steps back yet) renders a working line rather than a void,
 * because a void reads as a failure that never happened.
 */

export type ChatStep = {
  /** What the step did, in the reader's language. Never a mechanism name. */
  title: string;
  /** Which body of material it drew on. Optional. */
  source?: string;
  /** How long it took. Shown monospaced so a column of them lines up. */
  duration?: string;
  body: string;
  /** True while this step is still going. Drives the only hue in the file. */
  running?: boolean;
};

export type ChatTurn = {
  id: string;
  /** What the person asked. */
  you: string;
  /** What came back, step by step. Empty while the first step is pending. */
  steps?: ChatStep[];
};

function Icon({ children, size = 15 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/*
 * One agent step.
 *
 * The reference blurs and shrinks a step while it resolves. That is kept: it
 * reads as "not settled yet" without spending a colour, which leaves the agent
 * marker free to mean the one thing it means.
 */
function Step({ step }: { step: ChatStep }) {
  return (
    <div
      className="flex w-full flex-col gap-1.5 transition-[opacity,filter,transform] duration-300"
      style={{
        opacity: step.running ? 0.55 : 1,
        filter: step.running ? "blur(0.5px)" : "blur(0)",
        transform: step.running ? "scale(0.985)" : "scale(1)",
        transformOrigin: "top left",
        transitionTimingFunction: "var(--mrd-ease)",
        animation: "mrd-fade-up var(--mrd-d-move) var(--mrd-ease) both",
      }}
    >
      <div className="flex items-center gap-1.5 text-[12px] leading-[1.4]">
        {step.running && (
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-mrd-agent"
            style={{ animation: "mrd-pixel-on 1.1s ease-in-out infinite" }}
          />
        )}
        <span className="font-medium text-mrd-ink">{step.title}</span>
        {step.source && <span className="text-mrd-body">{step.source}</span>}
        {step.duration && (
          <span className="font-mrd-mono text-[11px] text-mrd-mute tabular-nums">
            {step.duration}
          </span>
        )}
      </div>
      <p className="text-[13px] leading-[1.4] text-mrd-ink">{step.body}</p>
    </div>
  );
}

/*
 * How tall the composer may grow before it scrolls internally. Five lines
 * at the composer's 19.5px leading: enough that a real question is visible
 * in full, bounded so a pasted block cannot push the send button out of the
 * panel it lives in.
 */
const COMPOSER_MAX_H = 98;

export function Chat({
  turns = [],
  tabs = [],
  activeTab,
  onTabChange,
  onSend,
  onNewThread,
  placeholder = "Ask about this workspace",
  busy = false,
  emptyLabel = "Nothing asked yet",
  emptyHint = "Ask a question about a spec, a run or a decision, and each step of the answer is shown with what it drew on.",
}: {
  turns?: ChatTurn[];
  /** Optional scopes for the thread. With none, the strip is not rendered. */
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSend?: (text: string) => void;
  /** Renders the only header action. Omitted, the header carries no controls. */
  onNewThread?: () => void;
  placeholder?: string;
  /** True between sending and the first step arriving. */
  busy?: boolean;
  emptyLabel?: string;
  emptyHint?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  /** The scrolling box itself, so following the thread cannot move the page. */
  const streamRef = useRef<HTMLDivElement>(null);

  const canSend = draft.trim().length > 0;
  const showHeader = tabs.length > 0 || Boolean(onNewThread);

  /*
   * Follow the newest turn. Instant rather than smooth, because a long thread
   * scrolling past on every step is motion sickness, not feedback.
   *
   * TWO THINGS THIS DELIBERATELY DOES NOT DO, both of which it used to.
   *
   * It does not run on mount. Effects fire on the first render too, so a pane
   * that opens with zero turns still scrolled. On the real Ask pane, which
   * opens over a page the reader has already scrolled somewhere on purpose,
   * that is a yank with no cause.
   *
   * It does not use scrollIntoView. That method walks EVERY ancestor scroll
   * container until the element is visible, so it moves the host page rather
   * than this thread. Setting scrollTop on the box itself cannot escape the
   * box, which is the actual requirement. Found by putting six of these on one
   * page: the page loaded scrolled to the last one.
   */
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const box = streamRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [turns, busy]);

  const send = () => {
    if (!canSend) return;
    onSend?.(draft.trim());
    setDraft("");
  };

  return (
    <div data-mrd="" className="flex h-full min-h-0 w-full flex-col bg-mrd-sheet">
      {showHeader && (
        <div className="flex shrink-0 items-center justify-between border-b border-mrd-line p-1.5">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const on = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onTabChange?.(tab)}
                  className={`rounded-mrd-xs px-2 py-[3px] text-[13px] text-mrd-ink transition-[background-color,opacity] duration-100 ${
                    on ? "bg-mrd-lift" : "opacity-50 hover:opacity-75"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          {/*
           * One header control, and only when it does something. The reference
           * carries three icon buttons wired to nothing. A control that looks
           * live and is not costs more trust than the space it saves.
           */}
          {onNewThread && (
            <button
              type="button"
              aria-label="New thread"
              onClick={onNewThread}
              className="flex size-6 items-center justify-center rounded-mrd-xs text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
            >
              <Icon>
                <path d="M12 5v14M5 12h14" />
              </Icon>
            </button>
          )}
        </div>
      )}

      <div
        ref={streamRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pt-3 pb-1"
      >
        {/*
         * EMPTY, the case this pane opens in most often. It says what can be
         * asked rather than sitting blank, because a blank pane with a composer
         * under it is a question nobody knows how to answer.
         */}
        {turns.length === 0 && !busy && (
          <div className="my-auto py-6">
            <p className="text-[13px] font-medium text-mrd-body">{emptyLabel}</p>
            <p className="mt-1 text-[13px] leading-[1.65] text-mrd-mute">{emptyHint}</p>
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="flex flex-col gap-2.5">
            <div className="flex justify-end pl-10">
              <div
                className="rounded-mrd-card bg-mrd-lift px-3 py-1.5 text-[13px] leading-[1.4] text-mrd-ink"
                style={{ animation: "mrd-fade-up var(--mrd-d-move) var(--mrd-ease) both" }}
              >
                {turn.you}
              </div>
            </div>
            {(turn.steps ?? []).map((step, i) => (
              <Step key={`${turn.id}-${i}`} step={step} />
            ))}
            {/*
             * ONE ROW, the case right after send. The question is up, nothing
             * has come back, and the pane must not look like it swallowed it.
             */}
            {(turn.steps ?? []).length === 0 && (
              <div className="flex items-center gap-1.5 text-[12px] text-mrd-mute">
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full bg-mrd-agent"
                  style={{ animation: "mrd-pixel-on 1.1s ease-in-out infinite" }}
                />
                Working on it
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-auto shrink-0 p-1.5">
        <div
          role="presentation"
          onClick={() => inputRef.current?.focus()}
          className="flex cursor-text flex-col gap-2 rounded-mrd-ctl border border-mrd-line bg-mrd-sink p-2.5 transition-[border-color] duration-150 focus-within:border-mrd-edge"
        >
          {/*
           * ── A TEXTAREA, NOT AN INPUT ──────────────────────────────────
           *
           * This was `<input>`, and a single-line input does not wrap: it
           * scrolls sideways, so a long question walks off the left edge and
           * the reader can no longer see what they typed. The founder reported
           * exactly that on 2026-08-15 — "if I keep on typing it just gets
           * extended in the same row". A composer is prose; prose wraps.
           *
           * It grows to fit and then stops, which is the standard behaviour
           * and what the reference's own composer does: `rows={1}` so it
           * starts at one line, `resize-none` so the drag handle never
           * appears, height driven off `scrollHeight` so it tracks the
           * content, and a max height so a pasted essay scrolls INSIDE the
           * field instead of pushing the send button off the panel.
           *
           * `[overflow-wrap:anywhere]` is what stops an unbroken token — a
           * URL, an id — reintroducing the sideways scroll this replaces.
           *
           * Enter still sends; Shift+Enter now makes a newline, which a
           * textarea affords and an input never could.
           */}
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onInput={(event) => {
              const el = event.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_H)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send();
              }
            }}
            placeholder={placeholder}
            aria-label="Ask a question"
            className="min-h-[18px] w-full resize-none bg-transparent text-[13px] leading-[1.5] text-mrd-ink outline-none [overflow-wrap:anywhere] placeholder:text-mrd-mute"
            style={{ maxHeight: COMPOSER_MAX_H }}
          />
          <div className="flex items-center justify-end">
            {/*
             * The primary is the next stop on the neutral ladder, not an
             * inverted ink block. Meridian rejected a saturated or inverted
             * primary twice on the same grounds: it spends the product's one
             * accent on chrome, and this product needs that accent to mean
             * "a person is required". The reference inverts; we do not.
             */}
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={send}
              className={`flex size-7 items-center justify-center rounded-mrd-ctl transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.96] ${
                canSend ? "bg-mrd-solid text-mrd-on-solid" : "bg-mrd-lift text-mrd-faint"
              }`}
            >
              <Icon size={16}>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </Icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
