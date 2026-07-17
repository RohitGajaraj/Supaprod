// Audit-ID system — P3: the lineage viewer (founder ruling 2026-07-13).
//
// A single global sheet, opened by the `supaprod:open-lineage` event (detail
// { ref }) from any audit tag OR from Ask when a question names an id. It
// fetches getEntityLineage and walks the record: what it is, when it entered,
// its status, who acted, and the connected entities — each of which is itself
// a tag you can click to walk further. Mount once at the app root.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getEntityLineage } from "@/lib/audit-lineage.functions";
import { getMissionChain } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";

export const OPEN_LINEAGE_EVENT = "supaprod:open-lineage";

/** Open the lineage sheet for an audit id from anywhere. */
export function openLineage(ref: string) {
  window.dispatchEvent(new CustomEvent(OPEN_LINEAGE_EVENT, { detail: { ref } }));
}

const tagStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "var(--text-body)",
  border: "1px solid var(--hairline)",
  borderRadius: 6,
  padding: "2px 7px",
  background: "var(--raised)",
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AuditLineageSheet() {
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const r = (e as CustomEvent<{ ref?: string }>).detail?.ref;
      if (r) setRef(r);
    };
    window.addEventListener(OPEN_LINEAGE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LINEAGE_EVENT, onOpen);
  }, []);

  const fLineage = useServerFn(getEntityLineage);
  const q = useQuery({
    queryKey: ["audit-lineage", ref],
    queryFn: () => fLineage({ data: { ref: ref as string } }),
    enabled: ref !== null,
  });
  const d = q.data;

  // A mission's real lineage IS its trust chain (signal → … → outcome). When
  // the resolved entity is a mission, fetch and render that nine-link chain
  // inline beneath the generic record walk.
  const fChain = useServerFn(getMissionChain);
  const chainQ = useQuery({
    queryKey: ["audit-lineage-chain", d?.entityId ?? null],
    queryFn: () => fChain({ data: { missionId: d?.entityId as string } }),
    enabled: Boolean(d?.found && d?.kind === "mission" && d?.entityId),
  });

  const open = ref !== null;

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? setRef(null) : undefined)}>
      <SheetContent side="right" style={{ width: 460, maxWidth: "92vw" }}>
        <SheetHeader>
          <SheetTitle style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-pixel)",
                fontSize: 15,
                letterSpacing: "0.04em",
                color: "var(--ember)",
              }}
            >
              {(d?.ref ?? ref ?? "").replace("·", " · ")}
            </span>
            {d?.found ? (
              <span style={{ fontSize: "var(--text-label-12)", color: "var(--text-subtle)", fontWeight: 400 }}>
                {d.label} · {d.stage}
              </span>
            ) : null}
          </SheetTitle>
          <SheetDescription>The verifiable audit trail for this id.</SheetDescription>
        </SheetHeader>

        <div style={{ padding: "8px 4px 24px" }}>
          {q.isLoading ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Tracing the record…</p>
          ) : q.isError ? (
            <p style={{ fontSize: 13, color: "var(--madder)" }}>
              Could not trace this id. {(q.error as Error)?.message}
            </p>
          ) : !d || !d.found ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              No record found for <strong>{d?.ref ?? ref}</strong> in this workspace. Audit ids are
              scoped to your workspaces, so a foreign or mistyped id shows nothing.
            </p>
          ) : (
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: "4px 0 4px",
                  lineHeight: 1.3,
                }}
              >
                {d.title}
              </h3>
              <div style={{ fontSize: 12, color: "var(--text-subtle)", marginBottom: 18 }}>
                {d.status ? <span>Status: {d.status}</span> : null}
                {d.status && d.createdAt ? " · " : ""}
                {d.createdAt ? <span>Recorded {fmt(d.createdAt)}</span> : null}
              </div>

              {/* The walk: created → connections → status → last change. Each
                  connected entity is a live tag you can click to walk on. */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {d.steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 12,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          marginTop: 4,
                          background: "var(--ember)",
                          flexShrink: 0,
                        }}
                      />
                      {i < d.steps.length - 1 ? (
                        <span
                          aria-hidden="true"
                          style={{ flex: 1, width: 1, background: "var(--hairline)", marginTop: 2 }}
                        />
                      ) : null}
                    </div>
                    <div
                      style={{
                        paddingBottom: i < d.steps.length - 1 ? 16 : 0,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--text-subtle)",
                        }}
                      >
                        {s.label}
                        {s.at ? (
                          <span style={{ color: "var(--text-faint)" }}> · {fmt(s.at)}</span>
                        ) : null}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--text-body)",
                          marginTop: 3,
                        }}
                      >
                        <span>{s.detail}</span>
                        {s.ref ? (
                          <button
                            type="button"
                            onClick={() => setRef(s.ref)}
                            title={`Trace ${s.ref}`}
                            className="loom-press outline-none hover:[border-color:var(--ember-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                            style={{ ...tagStyle, cursor: "pointer" }}
                          >
                            {s.ref}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {d.kind === "mission" && chainQ.data ? (
                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-subtle)",
                      marginBottom: 10,
                    }}
                  >
                    Trust chain
                  </div>
                  <MissionChain chain={chainQ.data} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
