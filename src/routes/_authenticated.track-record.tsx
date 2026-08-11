import { createFileRoute, redirect } from "@tanstack/react-router";

// TRACK RECORD (2026-08-11). "Trust ledger" is retired vocabulary under the
// founder's ruling of 2026-08-11: it scores zero per million across 5.7M words
// of practitioner writing, and /trust-ledger was the last live product surface
// whose ADDRESS still carried it while its page title already read "Track
// record". "Track record" is the settled replacement noun, already shipped in
// LandingFooter.tsx and in the /proof rename, so this is a rename rather than a
// new word.
//
// IA SPINE (2026-07-11) is why this route forwards rather than renders: the
// receipts surface merged into the Engine Room's Record room (front tab
// "receipts", lifted into src/components/engine-room/rooms/ReceiptsPanel.tsx).
// This path OWNS that target now, and /trust-ledger points here rather than at
// the Engine Room, so if the Record room ever moves again only this file
// changes. Any ?view= drill param rides along; an id the Record room does not
// know falls back to the receipts front tab, where the seal and share controls
// live.
export const Route = createFileRoute("/_authenticated/track-record")({
  validateSearch: (search: Record<string, unknown>): { view?: string } => ({
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/engine-room",
      search: { room: "record", ...(search.view ? { view: search.view } : {}) },
      statusCode: 301,
    });
  },
  head: () => ({ meta: [{ title: "Track record · Supaprod" }] }),
  component: () => null,
});
