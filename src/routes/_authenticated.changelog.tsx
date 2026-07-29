import { createFileRoute, redirect } from "@tanstack/react-router";

// /changelog used to fold into Brain (?tab=docs), where ChangelogPanel rendered
// the same listChangelog entries.
//
// RE-POINTED 2026-07-29 (rebuild step 4). Brain's justification pass moved the
// changelog to /ship: publishing what changed is an act, not a record, and Ship
// is where a change is taken to the world. The old target still resolved to a
// real tab that no longer holds it, which is a worse failure than a broken link
// because nothing tells you it went wrong. Verified: /ship renders the release
// notes.
export const Route = createFileRoute("/_authenticated/changelog")({
  beforeLoad: () => {
    throw redirect({ to: "/ship" });
  },
});
