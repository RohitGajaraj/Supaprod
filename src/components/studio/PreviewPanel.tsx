import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MonitorPlay } from "lucide-react";
import { getStudioPreview, type StudioChangesetSummary } from "@/lib/studio.functions";
import { resolveBuildPreview } from "@/lib/exec/provider";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { LOOM_CARD } from "./studio-ui";
import { NothingHere, ReadFailed, Reading } from "@/components/meridian/surface-parts";

/**
 * SANDBOX — the Build "Preview" tab. Renders the best standalone HTML the
 * changeset produced inside a SANDBOXED IFRAME (same isolation the public
 * prototype share uses: a null-origin frame that cannot reach the app's cookies
 * or APIs). This is the $0 floor: it previews self-contained output for free.
 *
 * A LIVE preview of a full repo build needs a sandbox backend — the founder-gated
 * Cloudflare Sandbox SDK adapter behind the `ExecProvider` seam. The pane reads
 * that capability from `resolveBuildPreview()`, so when the adapter is wired the
 * empty state and (later) the live mode update with no change here.
 *
 * THE COPY DEFECT FIXED HERE, 2026-08-10. This pane's own header comment said no
 * live-preview backend is wired, and eight lines below it the empty state said
 * "Live preview coming — a live preview of this build will appear here shortly."
 * That is a TIMELINE promised on behalf of a capability nobody has built: a
 * person waits, reloads, and learns that the product's statements about itself
 * cannot be trusted. The second half was the same lie in the passive voice ("a
 * live preview appears here when it does").
 *
 * What replaces it says only what is true right now — this pane renders a
 * self-contained page the changeset produced, this changeset produced none, and
 * running the whole repo needs a backend that is or is not connected. No
 * "shortly", no "coming", no verb in the future tense anywhere on the surface.
 */

export function PreviewPanel({
  missionId,
  changeset,
  isLive = false,
}: {
  missionId: string;
  changeset: StudioChangesetSummary | null;
  /** While the session is live, poll so the preview fills in as the build runs. */
  isLive?: boolean;
}) {
  const fPreview = useServerFn(getStudioPreview);
  const preview = useQuery({
    // Key on the changeset id so a freshly-staged changeset refetches the preview
    // (rather than showing a stale empty state from before the file landed).
    queryKey: ["studio-preview", missionId, changeset?.id ?? null],
    queryFn: () => fPreview({ data: { missionId } }),
    enabled: Boolean(changeset),
    // While the session is live, poll every 4s so the preview updates in real
    // time as the agent stages/edits the page — the "watch it build" moment.
    // Stops when the session goes idle (no needless polling on a finished build).
    refetchInterval: isLive ? 4000 : false,
  });

  // Today no live-preview backend is wired (the $0 check floor does not preview),
  // so this drives the honest empty-state copy and is the seam hook a future
  // Cloudflare Sandbox adapter flips on with no edit here.
  const live = resolveBuildPreview();

  // THE THREE STATES, EACH IN ITS OWN CLOTHES. Empty is "nothing here", Failed
  // is "we could not find out", Loading is "we do not know yet", and this pane
  // used to render all three out of hand-rolled divs on the legacy token set.
  // They are the shell's primitives now, so the run surface reads as one page
  // whichever tab is open.
  if (!changeset) {
    return <NothingHere>Nothing is staged yet, so there is no page to render.</NothingHere>;
  }

  if (preview.isPending) return <Reading>Reading the staged page.</Reading>;

  // An error never wears the empty state's clothes: name the cause, offer retry.
  if (preview.isError) {
    return (
      <ReadFailed onRetry={() => void preview.refetch()}>
        {(preview.error as Error)?.message?.slice(0, 160)}
      </ReadFailed>
    );
  }

  const data = preview.data ?? null;

  if (!data) {
    return (
      <NothingHere>
        Nothing in this changeset renders on its own. This pane shows a self-contained page the run
        produced, and this one produced none.{" "}
        {live.live
          ? `Running the whole repo goes through ${live.providerLabel}, which this pane does not read.`
          : "Running the whole repo needs an execution backend, and none is connected."}
      </NothingHere>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* "Standalone page", not "Live preview". What is in the frame is one
              self-contained file the run wrote, rendered safely — calling it a
              live preview would claim the running repo is behind it. */}
          <MonoLabel icon={MonitorPlay}>Standalone page</MonoLabel>
          <span
            className="truncate"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-body)",
              minWidth: 0,
              flex: 1,
            }}
          >
            {data.path}
          </span>
          {/* While the session is live, signal that the page is being built in
              real time — the breathing glow below echoes the same "AI at work". */}
          {isLive ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontWeight: 600,
                color: "var(--glacier)",
                background: "color-mix(in oklab, var(--glacier) 10%, transparent)",
                padding: "2px 8px",
                borderRadius: 999,
                flex: "none",
              }}
            >
              <span
                className="pulse-dot"
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--glacier)" }}
              />
              {/* "The run is alive", not "building live". The run really is
                  running — that is read from the session — but nothing here
                  knows the agent is working on THIS file, and a badge that
                  implies it would be narrating a build it cannot see. */}
              The run is alive
            </span>
          ) : null}
        </div>
        <p
          style={{
            margin: "8px 0 0",
            color: "var(--text-subtle)",
            lineHeight: 1.4,
          }}
        >
          {isLive
            ? "Re-read every four seconds while the run is alive, so an edit to this file lands here."
            : "Rendered in a frame that cannot reach the app."}
        </p>
      </div>
      <iframe
        title={`Preview of ${data.path}`}
        className={isLive ? "ai-glow" : undefined}
        sandbox="allow-scripts allow-forms allow-modals"
        srcDoc={data.html}
        style={{
          width: "100%",
          height: 520,
          border: "1px solid var(--hairline)",
          borderRadius: 12,
          background: "#fff",
        }}
      />
    </div>
  );
}
