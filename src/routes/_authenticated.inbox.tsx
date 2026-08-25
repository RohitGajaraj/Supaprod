import { createFileRoute } from "@tanstack/react-router";

import { PageHeading } from "@/components/meridian/surface-parts";
import { Surface } from "@/components/meridian/Surface";
import { InboxSurface } from "@/components/inbox/InboxSurface";

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxSurface,
  head: () => ({ meta: [{ title: "Inbox · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Inbox] route crashed:", error);
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading
            title="The inbox did not load."
            sub="Reload the page. Nothing here is lost."
          />
        </div>
      </Surface>
    );
  },
});
