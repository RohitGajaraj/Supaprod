// Design (PC-28): completes the D-family (Discover · Decide · Define ·
// Design) between Define and Build. This is a placeholder - PC-31 builds the
// real station (Prototype + Brand Kit) on this same route; the nav entry
// ships now rather than pointing nowhere (LOOM law 5: no feature has no
// home, and no rail item may be a dead link).
import { createFileRoute } from "@tanstack/react-router";
import { MonoLabel } from "@/components/obsidian";

function DesignSurface() {
  return (
    <div
      style={{
        maxWidth: "var(--container-work, 1520px)",
        width: "100%",
        margin: "0 auto",
        padding: "36px 32px 64px",
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.14em",
            color: "var(--text-subtle)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Loop · Design
        </div>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 430,
            fontSize: "var(--text-hero)",
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
            color: "var(--text-primary)",
            margin: "0 0 8px",
          }}
        >
          Your <em style={{ fontStyle: "italic", color: "var(--ember)" }}>brand</em>, in every
          build.
        </h1>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-body)", margin: "0 0 18px" }}>
          A clickable prototype for every spec, always on-brand. Landing soon.
        </p>
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px dashed var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <MonoLabel style={{ display: "block", marginBottom: 8 }}>Not built yet</MonoLabel>
        <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 440, margin: "0 auto" }}>
          Design is the next station to ship: import your brand once, then every prototype and
          scaffold renders through it. Nothing here today; the Brief and your design language
          already live in Brain in the meantime.
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/design")({
  component: DesignSurface,
  head: () => ({ meta: [{ title: "Design · Cadence" }] }),
  errorComponent: ({ error }) => {
    console.error("[Design] route crashed:", error);
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
          Could not load Design
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          Reload the page. Nothing here is lost.
        </p>
      </div>
    );
  },
});
