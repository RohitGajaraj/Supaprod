/**
 * P-25 (A-QUEUE.md, founder 2026-09-02 23:38: "should we have some home or
 * entry point for artifacts?"). Replaces `RailFind`, this rail's own former
 * search: that one searched two things the shell already held in memory (the
 * live runs list, the rail's own destinations); this one searches everything
 * a track can hold, off the server, because a person who does not remember
 * which run something is in cannot be expected to remember which run list
 * held it either.
 *
 * WHAT I CHECKED FIRST, per this packet's own Files line ("name what you
 * checked first"). Settings' own search (`_authenticated.settings.tsx`,
 * `SidebarNav`'s `onSearch`) is a live-filtered rail, not a floating result
 * list -- it narrows a fixed set of doors in place and has no ARIA listbox at
 * all, so its SHAPE does not fit a grouped, categorised set of results a
 * person picks from. `RailFind`, the thing this file replaces, already had
 * the right shape (`role="listbox"`, `role="option"` rows, arrow keys, Enter,
 * Esc) and is not a Meridian component, so it is kept rather than reinvented:
 * this file's own keyboard model is `RailFind`'s, carried over verbatim.
 * `Row` (`meridian/rows.tsx`) is composed for each result's content -- lead,
 * sub, layout -- but never with its own `onClick`: `Row` renders an inner
 * `<button>` when given one, and this listbox uses VIRTUAL focus (the input
 * keeps real DOM focus throughout; `cursor` marks the current option and
 * `aria-selected` states it), the same model `RailFind` used. A nested button
 * would pull Tab focus onto individual options and break that model, so the
 * click and hover handlers sit on this file's own `role="option"` wrapper
 * instead, and `Row` is called with no `onClick`.
 */
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Row } from "@/components/meridian/rows";
import { findAnything } from "@/lib/spine/track.functions";
import {
  GROUP_LABEL,
  type FindAnythingResult,
  type FoundArtifact,
  type FoundRun,
} from "@/lib/spine/find-anything";
import { joinPlainly } from "@/lib/spine/attach";
import { ResultsPopover } from "@/components/meridian/results-popover";
import { IconFind } from "./icons";

/** One flattened, navigable row -- a run or an artifact -- carrying enough to
 *  render itself and to say where Enter or a click sends the reader. */
type Option =
  | { key: string; group: "runs"; run: FoundRun }
  | { key: string; group: Exclude<keyof FindAnythingResult, "runs">; artifact: FoundArtifact };

const GROUP_ORDER: ReadonlyArray<keyof FindAnythingResult> = [
  "runs",
  "prd",
  "decision",
  "prototype",
  "changeset",
  "findings",
];

/**
 * "Runs, specs, decisions, prototypes, pull requests and findings and themes
 * are searched." -- built from `GROUP_LABEL`, not written as a string.
 *
 * A1, live on `supaprod.ai`: the packet's own quoted acceptance text named
 * five kinds and this searches six; a hand-written sentence and the group
 * list can drift the moment a group is added or renamed, exactly as the
 * quoted text already had. Read once at module load, not on every render:
 * `GROUP_LABEL` cannot change between them.
 */
export const NOTHING_NAMED_THAT = `Nothing named that. ${(() => {
  const nouns = GROUP_ORDER.map((g) => GROUP_LABEL[g].toLowerCase());
  const sentence = joinPlainly(nouns);
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} are searched.`;
})()}`;

function flatten(result: FindAnythingResult): Option[] {
  const out: Option[] = [];
  for (const group of GROUP_ORDER) {
    if (group === "runs") {
      for (const run of result.runs) out.push({ key: `run:${run.id}`, group: "runs", run });
      continue;
    }
    for (const artifact of result[group]) {
      out.push({ key: `${group}:${artifact.id}`, group, artifact });
    }
  }
  return out;
}

/** The 300ms is `SidebarNav`'s own live-filter debounce (`shell.css`'s search
 *  goes through the same cadence); this one hits the server instead of a rail
 *  already in memory, so it earns the wait rather than borrowing it blind. */
const DEBOUNCE_MS = 300;

/** Stable ids, so `aria-activedescendant` has something to point at. One field
 *  on the page, so a constant prefix is enough and a generated one would only
 *  make the markup harder to assert on. */
const LIST_ID = "find-anything-results";
const optionId = (i: number) => `find-anything-option-${i}`;

export function FindAnything({ narrow, onExpand }: { narrow: boolean; onExpand: () => void }) {
  const navigate = useNavigate();
  const search = useServerFn(findAnything);
  const [q, setQ] = React.useState("");
  const [result, setResult] = React.useState<FindAnythingResult | null>(null);
  /* Distinct from `result === null`: that is also true for the debounce
     window and the in-flight request, and painting "Nothing named that"
     during either would be the exact defect `meridian/Search.tsx`'s own
     header names -- a read that has not answered yet wearing the empty
     state's clothes. */
  const [loading, setLoading] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const box = React.useRef<HTMLInputElement | null>(null);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResult(null);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void search({ data: { query } }).then((r) => {
        // A stale response from a shorter, already-superseded query must never
        // overwrite what a longer one already found.
        if (requestId.current === id) {
          setResult(r);
          setCursor(0);
          setLoading(false);
        }
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [q, search]);

  const options = React.useMemo(() => (result ? flatten(result) : []), [result]);
  const open = q.trim().length > 0;

  const go = React.useCallback(
    (opt: Option) => {
      setQ("");
      setResult(null);
      if (opt.group === "runs") {
        void navigate({ to: "/track/$trackId", params: { trackId: opt.run.id }, search: {} });
        return;
      }
      void navigate({
        to: "/track/$trackId",
        params: { trackId: opt.artifact.trackId },
        search: { artifact: opt.artifact.id },
      });
    },
    [navigate],
  );

  /* Meridian tokens only, no retired `sp-*` classname (`meridian-ratchet.
     test.ts`) -- the shape below is `SteerComposer.tsx`'s own floating
     listbox (`bg-mrd-float`, `shadow-mrd-float`, `border-mrd-line`) and
     `meridian/Search.tsx`'s field row (`bg-mrd-sink`, `border-mrd-line`,
     focus-within border swap), both already zero-debt patterns; nothing here
     is drawn from the rail's own retired `.sp-find*` sheet. */
  if (narrow) {
    return (
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-mrd-ctl border border-mrd-line bg-mrd-sink text-mrd-mute transition-colors hover:border-mrd-edge hover:text-mrd-ink"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
        onClick={() => {
          onExpand();
          // The rail animates its width, so the field is not in the layout the
          // frame this fires. One frame later it is.
          requestAnimationFrame(() => box.current?.focus());
        }}
        title="Find anything"
        aria-label="Find anything, opens the rail"
      >
        <IconFind />
      </button>
    );
  }

  return (
    <div className="relative flex h-[var(--shell-ctl-sm)] items-center gap-mrd-3 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-4 transition-colors focus-within:border-mrd-edge-focus hover:border-mrd-edge">
      <span className="text-mrd-mute">
        <IconFind />
      </span>
      <input
        ref={box}
        type="text"
        value={q}
        placeholder="Find anything"
        aria-label="Find anything"
        /*
         * P-25 follow-up 3. This listbox uses VIRTUAL focus -- the input keeps
         * real DOM focus and `cursor` marks the current option -- which is the
         * right model here and is invisible to a screen reader without these
         * three attributes. `aria-selected` alone says which option is chosen;
         * `aria-activedescendant` is what makes the reader ANNOUNCE it as the
         * arrow keys move, which is the whole point of the keyboard model.
         */
        role="combobox"
        aria-expanded={open}
        aria-controls={LIST_ID}
        aria-activedescendant={
          open && options.length > 0 ? optionId(Math.min(cursor, options.length - 1)) : undefined
        }
        className="min-w-0 flex-1 bg-transparent text-mrd-label text-mrd-ink outline-none placeholder:text-mrd-mute"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQ("");
            setResult(null);
            return;
          }
          if (options.length === 0) return;
          const at = Math.min(cursor, options.length - 1);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor(at === options.length - 1 ? 0 : at + 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor(at === 0 ? options.length - 1 : at - 1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(options[at]!);
          }
        }}
      />
      {open ? (
        <ResultsPopover id={LIST_ID} label="Results">
          {loading ? (
            <p className="px-mrd-3 py-mrd-2 text-mrd-base text-mrd-mute">Searching.</p>
          ) : options.length === 0 ? (
            /* A search that matched nothing says so. A blank panel reads as a
               broken component rather than as an answer. Built from
               GROUP_LABEL (A1, live 2026-09-03), not written as a string --
               see NOTHING_NAMED_THAT above. */
            <p className="px-mrd-3 py-mrd-2 text-mrd-base text-mrd-mute">{NOTHING_NAMED_THAT}</p>
          ) : (
            GROUP_ORDER.map((group) => {
              const rows = options.filter((o) => o.group === group);
              if (rows.length === 0) return null;
              return (
                <div key={group} className="flex flex-col gap-mrd-1">
                  <p className="mrd-eyebrow px-mrd-3 pt-mrd-2">{GROUP_LABEL[group]}</p>
                  {rows.map((opt) => {
                    const i = options.indexOf(opt);
                    const isRun = opt.group === "runs";
                    return (
                      <div
                        key={opt.key}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === cursor}
                        tabIndex={-1}
                        className="cursor-pointer"
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => go(opt)}
                      >
                        {/*
                         * NOT `tight`, WHICH IS THE HALF THE WIDTH ALONE DOES NOT FIX.
                         *
                         * `Row`'s `tight` applies `truncate`, so a wider panel
                         * would still have cut every title at one line -- just
                         * further along. `tight` is a caller's assertion that a
                         * row is a scan line whose full content has a detail
                         * view to open, and that is exactly wrong here: this IS
                         * the surface where a person decides which of five
                         * similar titles is theirs, so the title has to be
                         * readable HERE, not after a navigation.
                         *
                         * Two lines is the cap, set on the text rather than by
                         * truncating it: a long spec title wraps and is read, a
                         * pathological one is clamped and still shows enough to
                         * tell it from its neighbour. Without a cap one result
                         * could fill the panel.
                         */}
                        <Row
                          focused={i === cursor}
                          lead={
                            <span className="line-clamp-2">
                              {isRun ? opt.run.title : opt.artifact.title}
                            </span>
                          }
                          sub={
                            <span className="line-clamp-1">
                              {isRun ? opt.run.state : `In ${opt.artifact.trackTitle}`}
                            </span>
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </ResultsPopover>
      ) : null}
    </div>
  );
}

export default FindAnything;
