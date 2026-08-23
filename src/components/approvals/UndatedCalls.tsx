/*
 * CALLS WHOSE AGE IS NOT KNOWN.
 *
 * ── WHY THIS EXISTS AT ALL ──────────────────────────────────────────────
 * The queue below the gate is drawn by StalledWork, which needs an epoch to
 * compute a tier from. Every gate family this queue federates carries a
 * timestamp today, so this list is expected to be empty forever.
 *
 * It exists because the alternative was worse in two different ways, and both
 * have shipped in this codebase before. Passing `Date.now()` for a missing time
 * would draw a call that has waited four days as one that arrived a moment ago,
 * which is precisely the lie this surface was rebuilt to stop telling. Dropping
 * the row would take a call that needs a person off the only screen that lists
 * them, silently, which is the worse of the two by a distance.
 *
 * So they are drawn, plainly, and the surface says which fact is missing rather
 * than inventing it. If this list is ever seen in production, the fix is
 * upstream in the queue read, not here.
 *
 * NO ACCENT. These still need a person, but they carry no age to make loud, and
 * an emphasis with nothing behind it is decoration. They read as the quietest
 * thing on the surface, which is honest: we know less about them than about
 * anything else on it.
 */

export type UndatedCall = {
  id: string;
  /** What is being asked, in the product's words. */
  asking: string;
  /** The mission or project it sits in front of, when there is one. */
  where?: string | null;
  onOpen: () => void;
};

export function UndatedCalls({ calls }: { calls: UndatedCall[] }) {
  if (calls.length === 0) return null;

  return (
    <section>
      <h2 className="text-[13px] font-medium text-mrd-mute">
        {calls.length === 1
          ? "One call, with no start time recorded"
          : `${calls.length} calls, with no start time recorded`}
      </h2>
      <p className="mt-mrd-3 max-w-[62ch] text-[12.5px] leading-mrd-prose text-mrd-faint">
        These need you like the rest. How long they have been waiting is the one thing this screen
        cannot tell you about them.
      </p>

      <ul className="mt-mrd-4 flex flex-col gap-mrd-2">
        {calls.map((call) => (
          <li
            key={call.id}
            className="flex items-start gap-mrd-4 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-4"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-medium text-mrd-ink">{call.asking}</span>
              {call.where ? (
                <p className="mt-1 text-[12.5px] leading-mrd-snug text-mrd-mute">{call.where}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={call.onOpen}
              data-mrd=""
              className="shrink-0 rounded-mrd-ctl px-2 py-1 text-[12.5px] text-mrd-mute transition-colors hover:bg-mrd-hover hover:text-mrd-ink text-mrd-body"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              Open
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default UndatedCalls;
