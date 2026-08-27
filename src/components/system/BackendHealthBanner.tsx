/**
 * BackendHealthBanner — startup drift indicator.
 *
 * PORTED TO MERIDIAN, 2026-08-27. It drew in `--canvas`, `--ink`, `--line` and
 * `--amber`, every one of which resolves through styles.css into the RETIRED
 * `--ds-*` family. The ratchet does not catch it because the indirection hides
 * the retired token behind a friendly name, so a global banner on every
 * authenticated page was the last thing in this prefix still drawing in the old
 * system -- directly above EverythingIsPausedBanner, which is Meridian. Two
 * global banners in two design languages, stacked.
 *
 * The accent maps by MEANING and not by hue, the same rule as the landing port:
 * `--mrd-hold` is amber and means STOPPED AND NOT ON YOU, which is exactly a
 * backend missing migrations -- a condition to wait out, not an outcome and not
 * a decision anybody can take from this banner.
 *
 * Renders only when the backend is missing migrations this build depends on.
 * Cannot auto-apply (Lovable Cloud Workers have no DDL credentials); the goal
 * is to fail loud and stop users hitting cryptic Postgres errors mid-flow
 * (notably the onboarding seed). Build-time gate: scripts/check-migrations.sh.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { checkBackendHealth } from "@/lib/health.functions";

/** Shared shell so the two states are the same object in two tones, rather
 *  than two banners that happen to look alike. `tone` drives the accent only;
 *  the text carries the meaning, so it still reads in greyscale. */
function Banner({
  tone,
  children,
  trailing,
}: {
  tone: "warn" | "unknown";
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const accent = tone === "warn" ? "var(--mrd-hold)" : "var(--mrd-faint)";
  return (
    <div
      role="alert"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        background:
          tone === "warn"
            ? "color-mix(in oklab, var(--mrd-hold) 14%, var(--mrd-sheet))"
            : "var(--mrd-sheet)",
        borderBottom:
          tone === "warn"
            ? "1px solid color-mix(in oklab, var(--mrd-hold) 40%, transparent)"
            : "1px solid var(--mrd-line)",
        color: "var(--mrd-ink)",
        lineHeight: 1.45,
      }}
    >
      <AlertTriangle size={16} style={{ color: accent, flexShrink: 0 }} />
      <span>{children}</span>
      {trailing != null && (
        <span className="mono-label" style={{ marginLeft: "auto", color: "var(--mrd-faint)" }}>
          {trailing}
        </span>
      )}
    </div>
  );
}

export function BackendHealthBanner() {
  const fCheck = useServerFn(checkBackendHealth);
  const { data, isError } = useQuery({
    queryKey: ["backend-health"],
    queryFn: () => fCheck(),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    // Was `false`. One retry, because the failure this banner exists to catch
    // is the same failure that stops the check itself from completing, and a
    // single dropped request should not be enough to put a banner on every
    // authenticated screen.
    retry: 1,
  });

  /**
   * A failed CHECK is not a healthy backend.
   *
   * The old guard was `if (!data || data.ok) return null`, and `!data` is
   * exactly the state a backend outage produces. So the one component in the
   * app whose entire job is announcing that the backend is unreachable went
   * silent precisely when the backend was unreachable, and silence on this
   * surface reads as "all clear" -- a claim we cannot make from a read that
   * never completed. This is the Empty/Failed distinction the shell primitives
   * enforce elsewhere, arriving late to the banner that needed it most.
   *
   * Deliberately quieter than the pending-migrations state: we are not
   * asserting that anything is broken, only that we could not tell.
   */
  if (isError) {
    return (
      <Banner tone="unknown">
        Could not check backend status. This is not a report that anything is wrong, only that the
        check did not complete.
      </Banner>
    );
  }

  if (!data || data.ok) return null;

  return (
    <Banner tone="warn" trailing={`${data.pending.length} pending`}>
      Backend update pending. Some actions (including onboarding setup) may fail until the operator
      applies the latest migrations.
    </Banner>
  );
}
