/**
 * /film - the product film, on its own page.
 *
 * WHY THIS ROUTE EXISTS WHEN THE FILM IS ALREADY ON TWO PAGES. A link you send
 * somebody has to land on the thing itself. Sending an investor to "/ and
 * scroll to the fourth section" is not a link, and the alternative people
 * reach for is worse: mailing the 93MB master, which bounces on most mail
 * hosts and is stale the moment the film is recut. This URL is the shareable
 * form of the film, and it is the same file the site serves everywhere else,
 * so it can never drift from what the landing page shows.
 *
 * The page is deliberately thin. It carries the film, one line saying what it
 * is, and the two doors a person who just watched it might want. It does not
 * restate the landing page: somebody who arrived here followed a link about a
 * film, and burying the film under a pitch would be answering a question they
 * did not ask.
 */
import { PUBLIC_FOOTER_LINKS } from "@/components/supaprod/site-links";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { FILM_DURATION_LABEL, FilmPlayer } from "@/components/landing/FilmPlayer";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";

const SITE = "https://supaprod.ai";
const TITLE = "The Supaprod film. See the whole thing work, in 2:22.";
const DESC =
  "A 2:22 film: one signal, all seven stations, and an outcome scored against the call that caused it.";
const POSTER = `${SITE}/film/supaprod-film-poster.jpg`;

export const Route = createFileRoute("/film")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      // video.other, not website: this page IS the film, and the richer type
      // is what lets a share unfurl with a play affordance instead of a card.
      { property: "og:type", content: "video.other" },
      { property: "og:url", content: `${SITE}/film` },
      { property: "og:image", content: POSTER },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1080" },
      {
        property: "og:image:alt",
        content:
          "The Supaprod Build station: an agent run writing a retry handler beside a live diff, under a boundary that blocks a schema drop.",
      },
      { property: "og:video", content: `${SITE}/film/supaprod-film-1080.mp4` },
      { property: "og:video:secure_url", content: `${SITE}/film/supaprod-film-1080.mp4` },
      { property: "og:video:type", content: "video/mp4" },
      { property: "og:video:width", content: "1920" },
      { property: "og:video:height", content: "1080" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: POSTER },
    ],
    links: [{ rel: "canonical", href: `${SITE}/film` }],
  }),
  component: FilmPage,
});

function FilmPage() {
  return (
    <div
      className="public-ink flex min-h-screen flex-col bg-[#0a0a0a] text-zinc-100"
      /* See index.tsx: the light theme re-declares --mrd-faint darker, and this
         ground does not invert with it. */
      data-mrd-pinned-dark
      style={{ ...PUBLIC_INK_THEME, isolation: "isolate" }}
    >
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} aria-hidden>
        <LandingBackdrop />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="inline-flex items-center text-white no-underline">
            <SupaprodWordmark tier="public" />
          </Link>
          <a
            href="/#join"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
          >
            Request access
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 pt-16 pb-16">
          <div className="mx-auto max-w-5xl">
            <p
              className="mb-4 font-mono text-mrd-nano uppercase text-zinc-600"
              style={{ letterSpacing: "0.18em" }}
            >
              The film &middot; {FILM_DURATION_LABEL} &middot; sound on
            </p>
            <h1
              className="m-0 text-3xl text-white md:text-4xl"
              style={{ fontFamily: "var(--font-pixel)", fontWeight: 400, maxWidth: "24ch" }}
            >
              See the whole thing work.
            </h1>
            <p
              className="mt-5 mb-10 text-lg leading-mrd-prose text-zinc-400"
              style={{ maxWidth: "58ch" }}
            >
              One signal, all seven stations, and an outcome scored against the call that caused it.
            </p>
            <FilmPlayer surface="film" />

            {/* The two doors somebody who just watched it might want, in the
                order they want them: the live thing first, the ask second. */}
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a
                href="/demo"
                className="group inline-flex items-baseline gap-2 text-sm text-zinc-400 no-underline transition-colors hover:text-white"
              >
                <span>Look inside a real workspace, no signup</span>
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  &rarr;
                </span>
              </a>
              <a
                href="/#join"
                className="group inline-flex items-baseline gap-2 text-sm text-zinc-400 no-underline transition-colors hover:text-white"
              >
                <span>The beta is invite only, ask for a code</span>
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  &rarr;
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-xs text-zinc-600">&copy; 2026 Supaprod</p>
          <div className="flex flex-wrap gap-5">
            {PUBLIC_FOOTER_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs text-zinc-600 no-underline transition-colors hover:text-zinc-300"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
