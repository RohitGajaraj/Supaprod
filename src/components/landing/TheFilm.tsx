/**
 * Beat 3.5 - The film.
 *
 * Sits between ThreeLayers (the answer, asserted) and LoopWalkthrough (the
 * loop, explored at the reader's own pace). That order is deliberate: the film
 * SHOWS the whole thing in 2:22, and the walkthrough then lets anyone who
 * wants the detail drive it themselves. Putting the film after the walkthrough
 * would offer a summary to someone who had already done the work.
 *
 * NO CTA IN THIS SECTION, ON PURPOSE. The page has one ask and it lives in
 * TrustClose. A section that ends on a button here would be the page's third
 * competing door, which is the exact failure the hero's own history records
 * (see Hero.tsx on the removal of the Critic offer and the sign-in link).
 * The film is the payload; the ask comes later, once.
 *
 * The section carries no spotlight wash of its own. ThreeLayers immediately
 * above owns that device, and a second lit section directly under it would
 * flatten the one that earned it.
 */
import { FILM_DURATION_LABEL, FilmPlayer } from "./FilmPlayer";

export function TheFilm() {
  return (
    <section id="film" className="relative px-4 py-32 scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        {/* The duration is in the eyebrow because a reader deciding whether to
            press play is deciding how much of their time to spend. Naming it
            up front is the difference between an offer and a trap. */}
        <p
          className="mb-4 font-mono text-[10px] uppercase text-zinc-600"
          style={{ letterSpacing: "0.18em" }}
        >
          The film &middot; {FILM_DURATION_LABEL}
        </p>
        <h2
          className="m-0 text-3xl text-white md:text-4xl"
          style={{ fontFamily: "var(--font-pixel)", fontWeight: 400, letterSpacing: "-0.01em" }}
        >
          See the whole thing work.
        </h2>
        <p
          className="mt-5 mb-10 text-lg leading-relaxed text-zinc-400"
          style={{ maxWidth: "58ch" }}
        >
          One signal, all seven stations, and an outcome scored against the call that caused it.
        </p>
        <FilmPlayer surface="landing" />
      </div>
    </section>
  );
}
