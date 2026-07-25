import { createFileRoute, redirect } from "@tanstack/react-router";

// IA SPINE (2026-07-11): Ledger left the rail. The receipts surface merged
// into the Engine Room's Record room (front tab "receipts", lifted into
// src/components/engine-room/rooms/ReceiptsPanel.tsx); /trust-ledger
// 301-redirects there so every old deep link keeps landing. Any ?view= drill
// param rides along; an id the Record room does not know falls back to the
// receipts front tab, where the seal and share controls live.
export const Route = createFileRoute("/_authenticated/trust-ledger")({
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
  head: () => ({ meta: [{ title: "Ledger · Supaprod" }] }),
  component: () => null,
});
