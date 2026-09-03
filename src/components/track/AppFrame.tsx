/**
 * THE THING BEING BUILT, RUNNING, IN FRONT OF THE PERSON.
 *
 * ── WHY (founder, 2026-09-02, from Lovable's Live preview setting) ────────
 * Watching the diff is watching the work. Watching the app run is watching the
 * RESULT. Gap #11 in the operating model puts it as a sentence about this
 * product: *nothing RUNS in front of the person*. Everything a run produces
 * today is a description of a change — a diff, a checklist, a verdict — and none
 * of it is the change.
 *
 * ── THE MERIDIAN PRIMITIVES CHECKED FIRST, as P-22 asks be named ──────────
 * There is no frame primitive in Meridian and this is the first surface to need
 * one, so it is built here rather than promoted: a second caller would be a
 * design review or a docs preview, and neither exists yet. What IS reused:
 *
 *   `NeedsSetup`      the no-preview state. It already carries a title, a body,
 *                     an action and a `thenWhat`, which is exactly "here is why
 *                     nothing is running and here is the door".
 *   `StatusChip`      the deploy's own state word, in the three tones the rest
 *                     of the product already reads.
 *   `useElapsed`      the clock on a build in flight, so it counts the way every
 *                     other clock in this product counts.
 *
 * The iframe's sandbox is copied from `ArtifactPane`'s prototype frame rather
 * than invented: `allow-scripts allow-forms allow-modals`, and deliberately NOT
 * `allow-top-navigation` — a preview that can navigate the page it is embedded
 * in can take a person off this product without them touching anything.
 *
 * ── NEVER A SPINNER, WHICH IS THE POINT OF THE PACKET ─────────────────────
 * A spinner over a deploy is the same lie as a spinner over an agent: it says
 * "something is happening" and answers nothing a person came to ask. While the
 * preview builds, the slot says which provider, what state it reports, and how
 * long it has been at it.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { previewForChangeset } from "@/lib/deployments.functions";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { StatusChip } from "@/components/meridian/StatusChip";
import { useElapsed } from "@/components/meridian/use-elapsed";

/** How the deploy's own word maps to the three tones this product reads. */
function toneFor(status: string | null): "pass" | "fail" | "hold" {
  if (status === "success") return "pass";
  if (status === "error" || status === "failed" || status === "canceled") return "fail";
  return "hold";
}

export function AppFrame({
  changesetId,
  /** "App" here, "Live" at Ship: the same frame, a different claim. */
  label = "App",
}: {
  changesetId: string;
  label?: string;
}) {
  const fPreview = useServerFn(previewForChangeset);
  const q = useQuery({
    queryKey: ["preview-for-changeset", changesetId],
    queryFn: () => fPreview({ data: { changesetId } }),
    /* Polled only while it is building. A running preview does not change and a
       missing one does not appear by itself, so neither earns a request every
       few seconds. */
    refetchInterval: (query) => (query.state.data?.state === "building" ? 10_000 : false),
    staleTime: 15_000,
  });

  const building = q.data?.state === "building";
  const startedMs = q.data?.startedAt ? Date.parse(q.data.startedAt) : NaN;
  /* `active` stops the interval where there is nothing to count, rather than
     ticking a hidden clock on every run screen in the product. */
  const elapsed = useElapsed(
    building && !Number.isNaN(startedMs) ? startedMs : undefined,
    building && !Number.isNaN(startedMs),
  );

  // A read that has not answered is not an absence. Nothing is drawn until it
  // has, rather than a frame that flashes "no preview" and then fills in.
  if (!q.data) return null;

  const { state, url, sha, status, provider } = q.data;

  if (state === "none") {
    return (
      <NeedsSetup
        kind="upstream"
        title={`No ${label.toLowerCase()} to show yet`}
        body="This repository has no preview deploys connected, so there is nothing running to look at."
        thenWhat="Connect one and every change opens with the app running beside its diff."
        action={
          <a
            href="/settings?tab=connections"
            className="mrd-focus rounded-mrd-ctl text-mrd-small text-mrd-ink underline decoration-mrd-line underline-offset-4 hover:decoration-mrd-edge"
          >
            Settings › Connections
          </a>
        }
      />
    );
  }

  if (state === "stale") {
    /*
     * A DIFFERENT ANSWER FROM "NONE", and worth its own sentence. The pipeline
     * is wired and this commit has not been built, so the thing to do is wait or
     * look at why, not go and connect something.
     */
    return (
      <p className="text-mrd-small text-mrd-mute">
        Nothing is running for this commit yet. This change has previews, but none at{" "}
        <span className="font-mrd-mono text-mrd-data">{sha ? sha.slice(0, 7) : "its head"}</span>.
      </p>
    );
  }

  if (state === "building") {
    return (
      <div className="flex flex-col gap-mrd-2 rounded-mrd-chip bg-mrd-sink p-mrd-4">
        <span className="flex flex-wrap items-center gap-mrd-3">
          <StatusChip status={toneFor(status)}>{status ?? "building"}</StatusChip>
          <span className="mrd-meta">
            {provider ? `${provider} is building it` : "A preview is building"}
            {sha ? ` at ${sha.slice(0, 7)}` : ""}
          </span>
          {/* The clock, because "how long" is the question a person actually has
              and a spinner refuses to answer it. */}
          {building && !Number.isNaN(startedMs) ? (
            <span className="font-mrd-mono text-mrd-data tabular-nums text-mrd-faint">
              {elapsed}
            </span>
          ) : null}
        </span>
        <p className="text-mrd-small text-mrd-mute">
          The app appears here when it finishes. Nothing is waiting on you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-mrd-2">
      <span className="flex flex-wrap items-center gap-mrd-3">
        <StatusChip status="pass">{label}</StatusChip>
        {/* The URL beside the frame, because a person who wants to poke at it
            wants it in a real tab with real devtools. */}
        <a
          href={url ?? "#"}
          target="_blank"
          rel="noreferrer noopener"
          className="mrd-focus min-w-0 truncate rounded-mrd-ctl font-mrd-mono text-mrd-data text-mrd-mute underline decoration-mrd-line underline-offset-4 hover:text-mrd-ink hover:decoration-mrd-edge"
        >
          {url}
        </a>
        {sha ? (
          <span className="font-mrd-mono text-mrd-data text-mrd-faint">{sha.slice(0, 7)}</span>
        ) : null}
      </span>
      <iframe
        title={`${label}: the change running`}
        src={url ?? undefined}
        /* Copied from the prototype frame, and NOT `allow-top-navigation`: a
           preview that can navigate the page it is embedded in can take a person
           off this product without them touching anything. */
        sandbox="allow-scripts allow-forms allow-modals"
        loading="lazy"
        className="h-[420px] w-full rounded-mrd-card border border-mrd-line bg-canvas"
      />
    </div>
  );
}

export default AppFrame;
