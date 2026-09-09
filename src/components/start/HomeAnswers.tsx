/**
 * The three answers above the run list (P-62).
 *
 * ── WHY THIS IS NOT A CARD, A STAT ROW, OR THREE TILES ───────────────────
 *
 * Each answer is one SENTENCE with one door, because that is what a person
 * arriving actually needs: not a dashboard to interpret, but three things read
 * in three seconds. Tiles would put the numbers in the biggest type on the page
 * and make the reader do the reading; a card each would give three regions the
 * weight the composer has to keep.
 *
 * The composer stays first. This sits between it and the run list, so the
 * order is: hand work over, then what needs you, then what happened.
 */
import * as React from "react";
import { Link } from "@tanstack/react-router";
import type { Answer } from "@/components/start/three-answers-above-your-runs";

/**
 * AN UNREAD ANSWER RENDERS NOTHING, and it is dropped here rather than in the
 * shape functions so a test can still see which read failed. Three unread
 * answers means the whole region is absent, which is the correct reading: a
 * home that could not look must not reassure.
 */
export function HomeAnswers({
  answers,
  className = "",
}: {
  answers: readonly Answer[];
  /** The caller's own outer spacing (craft pass, 2026-09-09). */
  className?: string;
}) {
  const shown = answers.filter((a) => a.read !== "unread");
  if (shown.length === 0) return null;

  return (
    <section
      data-mrd=""
      /*
       * ── THE REGION'S NAME HAD STOPPED DESCRIBING ITS CONTENTS ────────────
       *
       * It was "What needs you", and on 2026-09-10 it began leading with
       * *"Warn a homeowner before an installer visit is cancelled reached
       * Build."* — which needs nobody.
       *
       * The name was already loose before that: what ARRIVED, what SHIPPED and
       * what was LEARNED need nobody either. Only the waiting line ever did.
       * Adding a fourth kind made a loose name plainly wrong, and a screen
       * reader announces this one before anything inside it.
       *
       * **What every line here actually shares is the clock**, not an
       * obligation: each is true only relative to the last time this person
       * looked. So that is the name. The one line that DOES need somebody says
       * so in its own words and carries its own door.
       */
      aria-label="Since you last looked"
      className={`flex flex-col gap-mrd-2 ${className}`}
    >
      {shown.map((a, i) => (
        <div key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {/*
           * The empty answer is quieter than the one with something in it, and
           * that is the whole visual system here: no icons, no counts in large
           * type, no colour. An all-clear should be legible and forgettable.
           */}
          <span
            className={
              a.read === "answered" ? "text-mrd-base text-mrd-ink" : "text-mrd-base text-mrd-mute"
            }
          >
            {a.line}
          </span>
          {a.read === "answered" && "href" in a.door ? (
            /* THE ADDRESS ITSELF (P-126): a production deploy is not a route
               this app's own router has, so it is a plain anchor rather than
               `<Link>`'s client-side navigation. */
            <a
              href={a.door.href}
              target="_blank"
              rel="noreferrer"
              className="text-mrd-label text-mrd-mute underline decoration-mrd-line underline-offset-2 transition-colors duration-(--mrd-d-press) ease-(--mrd-ease) hover:text-mrd-ink"
            >
              {a.door.label}
            </a>
          ) : null}
          {a.read === "answered" && "to" in a.door ? (
            /* ONE DOOR PER SENTENCE, and it is a link rather than a button:
               it navigates, and a button here would promise an action that
               happens on this page. */
            <Link
              to={a.door.to}
              className="text-mrd-label text-mrd-mute underline decoration-mrd-line underline-offset-2 transition-colors duration-(--mrd-d-press) ease-(--mrd-ease) hover:text-mrd-ink"
            >
              {a.door.label}
            </Link>
          ) : null}
        </div>
      ))}
    </section>
  );
}

export default HomeAnswers;
