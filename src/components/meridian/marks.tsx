import * as React from "react";
import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { agentBlurb, agentDisplayName } from "@/lib/agent-vocabulary";

/*
 * THE MARK: WHO IS ON THIS, AND HOW IT IS GOING.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
 * Meridian had no mark. That is worth stating plainly, because the product's
 * stated core is that you can see agents working, and the design system meant
 * to carry that had no way to say "this agent, in this state". So all 33 files
 * that draw one still imported `AgentMark` from `components/shell/primitives`,
 * the retired Cadence/ink layer: 56 renders of a retired component, on every
 * station, for the single most load-bearing idea in the product.
 *
 * A correct Meridian mark did exist. `runs/run-parts.tsx` has carried `RunMark`
 * and `PersonMark` since the Runs port, fully reasoned, with the hues already
 * solved against the 3:1 floor a non-text object carrying meaning has to clear.
 * It was simply in a station's folder, so nothing else could reach it, which is
 * exactly the failure `surface-parts.tsx` opens by describing: a part moves
 * into Meridian the moment a second surface means the same thing by it.
 *
 * So this is a promotion, not an invention. `run-parts.tsx` keeps `RunMark` as
 * its own name for its own state union; this is the general one.
 *
 * ── IDENTITY IS THE GLYPH. STATUS IS THE HUE. ───────────────────────────
 * The retired mark set `--sp-hue` from `stageHueForSlug`, so an agent was
 * painted its STATION's colour: seven stations, seven hues, and a column of
 * runs came out a stage rainbow. That is the pattern Law 4 has now had removed
 * three separate times, and `station-glyphs.tsx` states the ruling: identity is
 * shape here, never hue.
 *
 * The glyph is reused rather than redrawn, so an agent that is a spiral on
 * Approvals is a spiral here. Two drawings of one roster is the failure
 * `agent-glyphs.tsx` exists to prevent.
 *
 * ── THE STATE NAMES ARE THE LEGACY ONES, ON PURPOSE ─────────────────────
 * `quiet | idle | running | gate | waiting | failed | verified`. Seven words
 * onto Meridian's five hues plus two neutrals. They are kept verbatim so the 56
 * call sites port by changing an import path and nothing else: a mechanical
 * migration that cannot silently change a state is worth more than a tidier
 * vocabulary. The words describe RUN state, which no design system retired.
 *
 *   gate      --mrd-you       a person is required. The one animated state.
 *   waiting   --mrd-you-dim   the same meaning at rest. See the stack rule.
 *   running   --mrd-agent     a machine is working. Ambient, not urgent.
 *   failed    --mrd-fail      an outcome, and the only thing red may mean.
 *   verified  --mrd-pass      done AND provable. Never merely "finished".
 *   idle      --mrd-mute      nothing to report.
 *   quiet     --mrd-faint     present, and not part of this sentence.
 *
 * `-dim` rather than a lower opacity for `waiting`: meridian.css re-solved the
 * dim stops against that 3:1 floor, and fading the full stop would drop under
 * it.
 *
 * ── MOTION ──────────────────────────────────────────────────────────────
 * `mrd-attention` for both animated cases, and the obvious reach is wrong.
 * `mrd-pixel-on` troughs at 0.15, so half of every cycle the glyph is GONE, and
 * the glyph is what says which agent this is. An animation that periodically
 * deletes a mark's identity in order to report its status has traded the more
 * important fact for the lesser one. `mrd-attention` inverts the envelope: full
 * at rest, a shallow dip to 0.32, legible throughout.
 *
 * Set INLINE and not as a class, because meridian.css's reduced-motion block
 * matches on the style attribute; an animation declared in a utility would keep
 * running for someone who asked it not to.
 *
 * The two cadences are the legacy ones, held still so the beat a reader already
 * knows does not move under them.
 */

export type MarkState = "quiet" | "idle" | "running" | "gate" | "waiting" | "failed" | "verified";

const HUE: Record<MarkState, string> = {
  gate: "text-mrd-you",
  waiting: "text-mrd-you-dim",
  running: "text-mrd-agent",
  failed: "text-mrd-fail",
  verified: "text-mrd-pass",
  idle: "text-mrd-mute",
  quiet: "text-mrd-faint",
};

/** Only `gate` and `running` move. An outcome has already happened, so it never
 *  animates: there is nothing left to wait for. */
const MOTION: Partial<Record<MarkState, string>> = {
  gate: "mrd-attention 1600ms var(--mrd-ease-soft) infinite",
  running: "mrd-attention 2400ms var(--mrd-ease-soft) infinite",
};

/**
 * One agent, at 22px, with its own glyph.
 *
 * The size is the legacy one and not `RunMark`'s 16px. A run row is a dense
 * list and sizes down deliberately; this mark stands in headers, context
 * columns and card leads across 33 files, and shrinking it product-wide to
 * match the densest case is the move the ratchet law forbids.
 */
export function AgentMark({
  slug,
  state = "idle",
  size = "sm",
  name,
  title,
}: {
  slug: string | null | undefined;
  state?: MarkState;
  size?: "sm" | "lg";
  /** Fallback display name when the catalog does not know the slug. */
  name?: string | null;
  title?: string;
}) {
  const Glyph = glyphForSlug(slug);
  const displayName = title ?? agentDisplayName(slug, name);
  const blurb = agentBlurb(slug);
  const label = blurb ? `${displayName} · ${blurb}` : displayName;
  const resting = state === "idle" || state === "quiet";

  return (
    <span
      data-mrd=""
      role="img"
      aria-label={state === "idle" ? label : `${label}, ${state}`}
      title={label}
      className={[
        "flex shrink-0 items-center justify-center transition-colors",
        size === "lg" ? "size-[30px] [&>svg]:size-[22px]" : "size-[22px] [&>svg]:size-4",
        HUE[state],
        // Hover lifts only the states that carry no status. Brightening a mark
        // that is reporting `failed` would say the pointer had changed the
        // outcome.
        resting ? "hover:text-mrd-ink" : "",
      ].join(" ")}
      style={{ transitionDuration: "var(--mrd-d-move)", animation: MOTION[state] }}
    >
      <Glyph />
    </span>
  );
}

/**
 * Two or more at once, reading as one crew on one job.
 *
 * THE STACK ENFORCES THE ONE BLINK, BECAUSE A CALLER CANNOT. `gate` is the only
 * animated state and exactly one mark on a screen may wear it. This component
 * takes ONE state and applied it to every agent, so a stack of four asked for
 * `gate` blinked four marks in unison: precisely the failure the rule was
 * written after, reproduced by the component meant to be governed by it.
 *
 * So a stack asked for `gate` gives it to the FIRST mark and dresses the rest
 * as `waiting`, which is the same meaning without the animation. Held here and
 * not at each call site: a rule every caller must remember is a rule that gets
 * forgotten, and this one already was.
 */
export function MarkStack({
  agents,
  state = "running",
}: {
  agents: { slug: string | null | undefined; name?: string | null }[];
  state?: MarkState;
}) {
  if (agents.length === 0) return null;
  if (agents.length === 1) {
    return <AgentMark slug={agents[0].slug} name={agents[0].name} state={state} />;
  }
  return (
    <span data-mrd="" className="flex shrink-0 items-center">
      {agents.slice(0, 4).map((a, i) => (
        <span key={`${a.slug ?? "x"}-${i}`} className={i === 0 ? "" : "-ml-[7px]"}>
          <AgentMark
            slug={a.slug}
            name={a.name}
            state={state === "gate" && i > 0 ? "waiting" : state}
          />
        </span>
      ))}
    </span>
  );
}

/**
 * YOU. A filled disc carrying your initials, so a person is a different KIND of
 * object in the record from an agent rather than a different colour of the same
 * one. The agents are outlined glyphs; you are solid.
 *
 * `mine` lights it orchid, and ONLY when the moment is genuinely yours: the
 * thing you just did, or the call now waiting on you. A steer you sent last
 * week is history, not a summons. Spending the accent on every appearance of
 * your own initials is how it stops meaning "a person is required" and starts
 * meaning "a person exists".
 */
export function YouMark({ initials, mine = false }: { initials: string; mine?: boolean }) {
  return (
    <span
      data-mrd=""
      role="img"
      aria-label="You"
      className={[
        "flex size-[22px] shrink-0 items-center justify-center rounded-full",
        "text-[9.5px] font-[650] tracking-mrd-label",
        mine ? "bg-mrd-you text-mrd-on-you" : "bg-mrd-lift text-mrd-mute",
      ].join(" ")}
    >
      {initials}
    </span>
  );
}

/** The crew drafted it and you changed it. Both marks, in that order, because
 *  that is the order it happened in. */
export function PairMark({
  slug,
  initials,
  name,
  state = "idle",
  mine = true,
}: {
  slug: string | null | undefined;
  initials: string;
  name?: string | null;
  state?: MarkState;
  mine?: boolean;
}) {
  return (
    <span data-mrd="" className="flex shrink-0 items-center gap-1">
      <AgentMark slug={slug} name={name} state={state} />
      <YouMark initials={initials} mine={mine} />
    </span>
  );
}
