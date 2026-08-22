// THE PUBLIC TEARDOWN IS RETIRED (founder, 2026-08-22). This file is a
// permanent redirect and nothing else. Read
// docs/decisions/public-teardown-retired-2026-08.md before rebuilding anything
// shaped like it.
//
// It used to be RPT-03: a stranger pasted a PRD into a textarea with no signup
// and no connectors and got a Critic teardown back. The founder's call was that
// it reads as "another copilot or ChatGPT window" with nothing in it only this
// product can do, and that it was one of the weakest things on the site.
//
// WHY A REDIRECT AND NOT A DELETE. The URL shipped: it was the hero's second
// control, a footer link, a row in the Receipts beat, the closing button on
// /demo, and a link in both waitlist emails, so it is in inboxes and in
// crawlers. /trust set the precedent here on 2026-07-11 for exactly this
// reason, and its exemption line still reads "kept because URLs are forever".
//
// WHY /demo IS THE DESTINATION. Whoever follows this link came for the thing
// they could see without an account. /demo is what is left of that promise: a
// real seeded workspace, no login, nothing to set up. Sending them to the
// landing page would answer a specific question with a billboard.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/p/teardown")({
  ssr: true,
  beforeLoad: () => {
    throw redirect({ to: "/demo" });
  },
});
