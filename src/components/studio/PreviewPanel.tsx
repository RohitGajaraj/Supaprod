import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MonitorPlay } from "lucide-react";
import { getStudioPreview, type StudioChangesetSummary } from "@/lib/studio.functions";
import { resolveBuildPreview } from "@/lib/exec/provider";
import { MonoLabel } from "@/components/cadence/Primitives";
import { LOOM_CARD } from "./studio-ui";
import { EmptyState } from "@/components/cadence/EmptyState";

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

  if (!changeset) {
    return (
      <EmptyState
        headline="No changes to preview yet"
        body="The session drafts changes as it works."
      />
    );
  }

  if (preview.isPending) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "48px 0",
          color: "var(--text-subtle)",
        }}
      >
        <span className="spinner" style={{ width: 12, height: 12 }} />
        <span className="mono-label">Loading preview…</span>
      </div>
    );
  }

  // An error never wears the empty state's clothes: name the cause, offer retry.
  if (preview.isError) {
    return (
      <div style={{ ...LOOM_CARD, padding: 24 }}>
        <MonoLabel style={{ color: "var(--madder)" }}>Couldn't load the preview</MonoLabel>
        <p style={{ marginTop: 6, fontSize: 12.5, color: "var(--text-subtle)" }}>
          {(preview.error as Error)?.message?.slice(0, 160)}
        </p>
        <button
          type="button"
          onClick={() => preview.refetch()}
          className="btn btn-ghost btn-sm loom-press"
          style={{ marginTop: 12 }}
        >
          Retry · reloads the preview
        </button>
      </div>
    );
  }

  const data = preview.data ?? null;

  if (!data) {
    return (
      <EmptyState
        headline={
          live.live
            ? "Live preview coming"
            : "No standalone output"
        }
        body={
          live.live
            ? "A live preview of this build will appear here shortly."
            : "This build doesn't produce a standalone page. A live preview appears here when it does."
        }
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <MonoLabel icon={MonitorPlay}>Live preview</MonoLabel>
          <span
            className="truncate"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
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
                fontSize: "var(--text-label-12)",
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
              Building live
            </span>
          ) : null}
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 11.5,
            color: "var(--text-subtle)",
            lineHeight: 1.4,
          }}
        >
          {isLive
            ? "Updating live as the build works on the page."
            : "A live preview of this page, rendered safely."}
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
