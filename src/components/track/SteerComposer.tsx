/**
 * THE RUN'S OWN STEER BOX — one instruction back into work that is still moving.
 *
 * THE GAP THIS CLOSES, measured: `steerTrack` has existed in
 * `src/lib/spine/track.functions.ts` since the day it was written and had ZERO
 * callers — the loop reads unconsumed `steer` rows and injects them as operator
 * guidance mid-step (`loop.server.ts`), and nothing in the product could write
 * one. The run's only controls were Run it now and Stop-after-this-leg, which
 * is exactly the Start-and-Stop shape that makes a run a batch job.
 *
 * ONE COMPOSER, NOT TWO (SPEC-LAYOUT §1): this page hides the global dock via
 * `data-page-composer`, because on this surface the composer IS the steer box.
 * The text lands as an addressed record of work — the loop hands it to whoever
 * holds the track when it is read, which is the only correct target, since the
 * station changes under the message while it is being typed.
 *
 * @ NAMES WHO IS ACTUALLY HERE (SPEC-AGENT-COMMS §4). The roster comes from the
 * transcript's own turns — the seats that have worked this track, newest first,
 * never a browsable directory. Naming a seat inside the steer is guidance the
 * working seat can act on; it opens no second channel and invents no eighth
 * message type.
 *
 * IT NEVER CLAIMS DELIVERY IT DID NOT GET. The server answers `steered` with
 * `problems`; a refused steer renders its reason verbatim rather than a
 * cheerful confirmation. And the confirmation itself is honest about timing:
 * the loop consumes steers at the next step of a moving run, so an idle track's
 * confirmation says the words will be read when the work moves again.
 *
 * KEYBOARD CONTRACT (R-19): Enter sends; while the roster is open Enter accepts
 * the highlighted name instead — enforced inside `submit`, because the keydown
 * fires on the textarea first and no ancestor can preempt it. Arrows move the
 * highlight, Tab accepts, Escape closes, all handled on this wrapper.
 */
import * as React from "react";
import { failureLine } from "@/lib/error-copy";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Composer } from "@/components/meridian/onramp-parts";
import { getTrackActivity, steerTrack } from "@/lib/spine/track.functions";

/** How many names the autocomplete may offer. A roster, not a directory. */
export const ROSTER_MAX = 5;

/**
 * What the server accepts and what the loop injects -- kept in ONE place so a
 * change to either breaks here, loudly, instead of truncating somebody's
 * sentence quietly.
 */
export const STEER_MAX = 2000;

/**
 * Who has actually been on this work, newest first — derived from the same
 * activity read the transcript already polls, so this costs no second fetch
 * (same query key, TanStack serves both from one cache entry).
 */
export function rosterFromTurns(turns: Array<{ agentName: string }> | undefined): string[] {
  const seen = new Set<string>();
  const roster: string[] = [];
  for (const t of turns ?? []) {
    if (!t.agentName || seen.has(t.agentName)) continue;
    seen.add(t.agentName);
    roster.push(t.agentName);
    if (roster.length >= ROSTER_MAX) break;
  }
  return roster;
}

/** The `@partial` under the caret, or null when autocomplete has nothing to do. */
export function activeMention(
  value: string,
  caret: number | null,
): { query: string; start: number } | null {
  if (caret === null) return null;
  const before = value.slice(0, caret);
  const m = /@([\w-]*)$/.exec(before);
  if (!m) return null;
  return { query: m[1].toLowerCase(), start: caret - m[1].length - 1 };
}

export function SteerComposer({
  trackId,
  finished = false,
  fieldRef: externalFieldRef,
}: {
  trackId: string;
  /** A closed track has nothing running to steer, and saying so beats a form. */
  finished?: boolean;
  /**
   * RUN-10: lets the host focus the field from the keyboard layer (`/`). The
   * primitive already takes a ref; this is a straight passthrough.
   */
  fieldRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const fSteer = useServerFn(steerTrack);
  const fetchActivity = useServerFn(getTrackActivity);

  // The transcript's own cache entry: free, and always as fresh as the pane
  // beside this one.
  const q = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fetchActivity({ data: { trackId } }),
    refetchInterval: 10_000,
  });
  const roster = React.useMemo(() => rosterFromTurns(q.data?.turns), [q.data]);

  const [value, setValue] = React.useState("");
  const [caret, setCaret] = React.useState<number | null>(null);
  const [pick, setPick] = React.useState(0);
  /** How many characters a send just dropped, when it had to drop any. */
  const [truncated, setTruncated] = React.useState<number | null>(null);
  const ownFieldRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fieldRef = externalFieldRef ?? ownFieldRef;

  /** The textarea owns the caret; these are the moments it can have moved. */
  const syncCaret = () => setCaret(fieldRef.current?.selectionStart ?? null);

  const mention = activeMention(value, caret);
  const matches = React.useMemo(() => {
    if (!mention) return [];
    return roster.filter((n) => n.toLowerCase().startsWith(mention.query));
  }, [mention, roster]);
  const open = matches.length > 0;

  const send = useMutation({
    mutationFn: (message: string) => fSteer({ data: { trackId, message } }),
    onSuccess: () => {
      setValue("");
      setCaret(null);
      setTruncated(null);
    },
  });

  const accept = (name: string) => {
    if (!mention) return;
    const rest = value.slice(caret ?? value.length);
    const next = `${value.slice(0, mention.start)}@${name} ${rest}`;
    setValue(next);
    setPick(0);
    // The inserted name ends with a space, so the next keystroke starts fresh.
    const at = mention.start + name.length + 2;
    requestAnimationFrame(() => fieldRef.current?.setSelectionRange(at, at));
    setCaret(at);
  };

  const submit = () => {
    // An open roster turns Enter into "accept", never "send": sending a half
    // typed @name is how a person's sentence reaches nobody.
    if (open) {
      accept(matches[Math.min(pick, matches.length - 1)] ?? matches[0]);
      return;
    }
    const text = value.trim();
    if (!text || send.isPending) return;
    // THE SERVER WOULD SLICE THIS SILENTLY (steerTrack caps at 2000, and the
    // loop slices the same amount at injection). A person whose last
    // sentence vanished has been lied to by a form -- so the cut happens here,
    // where it can be SAID.
    if (text.length > STEER_MAX) {
      send.mutate(text.slice(0, STEER_MAX));
      setTruncated(text.length - STEER_MAX);
      return;
    }
    setTruncated(null);
    send.mutate(text);
  };

  const sentNote = send.data?.steered
    ? "Sent. It reaches whoever is working, at their next step."
    : null;

  if (finished) {
    return (
      <p className="mrd-meta">
        This work has finished, so there is nothing running to steer. Start something new to carry
        it further.
      </p>
    );
  }

  return (
    /*
     * A HAIRLINE ABOVE IT, BECAUSE STICKY WITHOUT AN EDGE READS AS BROKEN.
     *
     * Caught at 1024x768 on a real run: the pane is short there, so the route
     * list scrolls under this composer, and with a background matching the pane
     * and no edge the last row appeared to be cut in half by nothing. The
     * behaviour was right and the drawing was not.
     *
     * One hairline says the bar is a bar, and content passing behind it reads as
     * passing behind something rather than dissolving. Same mark the footer and
     * every other pinned edge in this system uses; nothing new is introduced.
     */
    /*
     * FLUSH WITH THE PANE, NOT SIXTEEN PIXELS ABOVE IT.
     *
     * `bottom: 0` on a sticky element resolves against its scroll container's
     * PADDING box, and `.mrd-workbench-pane` carries `padding: var(--mrd-s5)`.
     * So this bar pinned 16px short of the pane's bottom edge and a strip of
     * whatever was scrolled to that position showed underneath it. Measured in
     * a browser at 1440: the pane's content box ends at 829.5 and this ended at
     * 813, and the heading "Why it stopped" was sitting in the gap, below the
     * input, looking like a rendering fault.
     *
     * The negative offset cancels exactly that padding and the matching
     * `pb-mrd-5` puts it back inside, so the bar's own opaque background now
     * reaches the pane's edge and the input keeps the same breathing room it
     * had. Both halves name `--mrd-s5`, which is the same token the pane's
     * padding uses -- that coupling is deliberate and is the point: this bar is
     * flush with its container BECAUSE it cancels its container's inset, and if
     * one moves the other must.
     */
    <div className="sticky -bottom-mrd-5 flex flex-col gap-mrd-2 border-t border-mrd-line bg-mrd-sheet pt-mrd-3 pb-mrd-5">
      {/*
       * THE ROSTER LIST. It is a SIBLING of the textarea, not an ancestor, so
       * its own keydown never sees a keystroke -- arrows, Tab and Escape are
       * handled here on the wrapper, which they reach by bubbling. Enter alone
       * is settled inside `submit` for the same reason in reverse: the
       * textarea's handler fires first, and only it can decide what Enter means.
       */}
      <div
        className="relative"
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setPick((p) => (p + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setPick((p) => (p - 1 + matches.length) % matches.length);
          } else if (e.key === "Tab") {
            e.preventDefault();
            accept(matches[Math.min(pick, matches.length - 1)] ?? matches[0]);
          } else if (e.key === "Escape") {
            setCaret(null);
          }
        }}
      >
        <Composer
          value={value}
          fieldRef={fieldRef}
          onChange={(next) => {
            setValue(next);
            setPick(0);
            // The DOM value and selection are already updated when this runs.
            setCaret(fieldRef.current?.selectionStart ?? null);
          }}
          onSubmit={submit}
          busy={send.isPending}
          placeholder={
            roster.length ? `Say what to change, or try @${roster[0]}` : "Say what to change"
          }
          label="Steer this work without stopping it"
          hint="Enter to send · @ to name someone here"
          submitLabel="Send it"
          busyLabel="Sending"
        />
        {open ? (
          <ul
            role="listbox"
            aria-label="Who is on this work"
            className="absolute bottom-full left-0 z-10 mb-mrd-1 flex w-full flex-col overflow-hidden rounded-mrd-ctl border border-mrd-line bg-mrd-float shadow-mrd-float"
          >
            {matches.map((name, i) => (
              <li key={name} role="option" aria-selected={i === pick}>
                <button
                  type="button"
                  data-mrd=""
                  tabIndex={-1}
                  // Down, not click: pressing the button would steal focus and
                  // drop the caret before the insertion reads it.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    accept(name);
                  }}
                  className="flex w-full items-center px-mrd-4 py-mrd-2 text-left text-mrd-small text-mrd-body transition-colors hover:bg-mrd-hover"
                  style={{
                    background: i === pick ? "var(--mrd-select)" : undefined,
                    transitionDuration: "var(--mrd-d-press)",
                  }}
                >
                  @{name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {send.data && !send.data.steered && send.data.problems.length ? (
        <p role="status" aria-live="polite" className="text-mrd-small text-mrd-body">
          {send.data.problems.join(" ")}
        </p>
      ) : null}
      {sentNote ? (
        <p role="status" aria-live="polite" className="mrd-meta">
          {sentNote}
        </p>
      ) : null}
      {truncated !== null ? (
        <p role="status" aria-live="polite" className="mrd-meta">
          {`Only the first ${STEER_MAX} characters were sent; ${truncated.toLocaleString()} were left off. Send the rest as a second message if it matters.`}
        </p>
      ) : null}
      {send.isError ? (
        <p role="status" aria-live="polite" className="text-mrd-small text-mrd-body">
          {/*
           * The product's sentence first, and the server's only when the server
           * wrote one for a person. This rendered `message` raw, so a database
           * constraint reached the composer verbatim: a person steering their
           * run met `null value in column "to_agent_slug" of relation
           * "agent_messages" violates not-null constraint`. That was useful to
           * me and useless to them.
           */}
          {failureLine("That did not reach the run, so nothing was sent.", send.error)}
        </p>
      ) : null}
    </div>
  );
}

export default SteerComposer;
