import { createFileRoute, redirect } from "@tanstack/react-router";

// /investors is an ALIAS. The deck itself lives at /brief and stays there.
//
// The 2026-07-24 ruling in brief.tsx still holds and this does not reverse it:
// the deck is a full company narrative that reads for investors, partners,
// press and candidates alike, so the canonical URL is deliberately not
// pigeonholed to one audience. What changed (founder 2026-07-25) is that
// "supaprod.ai/investors" is the address a person expects to be able to type
// after being told there is an investor brief, and a 404 at that moment is an
// expensive thing to be right about.
//
// A redirect rather than a second copy of the page, for three reasons: /brief
// links are already out with investors and must keep resolving, one canonical
// URL keeps the deck's SEO undivided instead of splitting it across two
// indexable pages, and there is exactly one artifact to keep current.
//
// The footer points straight at /brief rather than here, so the common path
// costs no hop; this route exists for the URL someone types or is handed.
export const Route = createFileRoute("/investors")({
  beforeLoad: () => {
    throw redirect({ to: "/brief" });
  },
});
