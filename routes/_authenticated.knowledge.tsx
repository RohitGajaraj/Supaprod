import { createFileRoute, redirect } from "@tanstack/react-router";

// /knowledge renamed to /brain per LOOM W1 (2026-07-04): the rail said
// "Brain" while the URL said /knowledge; label and URL now agree. Permanent
// redirect, forwarding the tab (and sibling params) so every bookmark and
// deep link keeps its intent. The cast mirrors the other param-forwarding
// stubs: /brain's validateSearch normalizes whatever arrives.
export const Route = createFileRoute("/_authenticated/knowledge")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/brain",
      search: search as never,
    });
  },
});
