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
export function HomeAnswers({ answers }: { answers: readonly Answer[] }) {
  const shown = answers.filter((a) => a.read !== "unread");
  if (shown.length === 0) return null;

  return (
    <section data-mrd="" aria-label="What needs you" className="flex flex-col gap-mrd-2">
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
