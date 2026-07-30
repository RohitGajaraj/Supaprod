/**
 * The lineage pane: where a thing came from, and what it caused.
 *
 * WHY IT LOOKS COMPLETELY DIFFERENT NOW. This shipped on 2026-07-13 and was
 * never mounted. `grep '<AuditLineageSheet'` returned nothing, in any file, for
 * seventeen days, which means `openLineage()` has been firing a window event
 * with no listener the entire time and `BetCard`'s audit tag has been a control
 * that does nothing when pressed. A previous session found that and recorded it
 * rather than fixing it.
 *
 * It could not simply be mounted, either. It was built in the Loom v4 system
 * the rebuild replaced: `loom-press`, the shadcn `Sheet`, Geist Pixel (retired
 * by founder ruling), and twelve legacy tokens (`--text-body`, `--hairline`,
 * `--raised`, `--ember`, `--madder`). Mounting it as it stood would have
 * dragged the old design into the new shell, which is the one thing the founder
 * has said must never happen again.
 *
 * TWO THINGS THE PORT CHANGED ON PURPOSE, beyond tokens:
 *
 * 1. NO EMBER. The original painted the ref and every timeline dot ember.
 *    Ember means "waiting on you" and nothing else in this system, and a
 *    lineage trail is not waiting on you: it is the record, already settled.
 *    The trail reads in ink and rule, which is what the record deserves.
 *
 * 2. THE PANE, NOT A MODAL SHEET. Same geometry as Ask, because it is the same
 *    kind of thing: a column you consult beside the work rather than a dialog
 *    that takes the screen. A person tracing provenance is comparing it against
 *    what they were already looking at, and a modal makes that impossible.
 *
 * WHAT IT STILL CANNOT DO, and it is the interesting half. `getEntityLineage`
 * follows FOREIGN-KEY COLUMNS on the entity's own row, so it walks one hop
 * outward and cannot answer "what did this cause". The bidirectional walk over
 * `artifact_lineage` lives in `lib/lineage-graph.ts` and a parallel lane is
 * building its server layer. This pane renders what resolves today and gains
 * the forward chain when that lands; it does not pretend to have it now.
 */

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getEntityLineage } from "@/lib/audit-lineage.functions";
import { getMissionChain } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";
import { Empty, Failed, Loading } from "@/components/shell/primitives";
import { stripAutoPrefix } from "@/components/plan/format";

export const OPEN_LINEAGE_EVENT = "supaprod:open-lineage";

/** Open the lineage pane for an audit id from anywhere. */
export function openLineage(ref: string) {
  window.dispatchEvent(new CustomEvent(OPEN_LINEAGE_EVENT, { detail: { ref } }));
}

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
  /** Where the walk started, so a person can get back after following links. */
  const [trail, setTrail] = useState<string[]>([]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const r = (e as CustomEvent<{ ref?: string }>).detail?.ref;
      if (r) {
        setRef(r);
        setTrail([]);
      }
    };
    window.addEventListener(OPEN_LINEAGE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LINEAGE_EVENT, onOpen);
  }, []);

  // Escape closes, like every other summoned surface in the shell.
  useEffect(() => {
    if (ref === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setRef(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ref]);

  const fLineage = useServerFn(getEntityLineage);
  const q = useQuery({
    queryKey: ["audit-lineage", ref],
    queryFn: () => fLineage({ data: { ref: ref as string } }),
    enabled: ref !== null,
  });
  const d = q.data;

  // A mission's real lineage IS its trust chain (signal to outcome), so when
  // the resolved entity is a mission that nine-link chain renders beneath the
  // generic walk rather than duplicating it.
  const fChain = useServerFn(getMissionChain);
  const chainQ = useQuery({
    queryKey: ["audit-lineage-chain", d?.entityId ?? null],
    queryFn: () => fChain({ data: { missionId: d?.entityId as string } }),
    enabled: Boolean(d?.found && d?.kind === "mission" && d?.entityId),
  });

  if (ref === null) return null;

  /** Follow a connected entity, remembering where we came from. */
  const follow = (next: string) => {
    setTrail((t) => [...t, ref]);
    setRef(next);
  };
  const back = () => {
    setTrail((t) => {
      const prev = t[t.length - 1];
      if (prev) setRef(prev);
      return t.slice(0, -1);
    });
  };

  return (
    <aside className="sp-lineage" role="complementary" aria-label="Lineage">
      <header className="sp-lineage-head">
        <span className="sp-lineage-ref">{(d?.ref ?? ref).replace("·", " · ")}</span>
        {d?.found ? (
          <span className="sp-lineage-kind">
            {d.label} · {d.stage}
          </span>
        ) : null}
        <span className="sp-lineage-spacer" />
        {trail.length > 0 ? (
          <button type="button" className="sp-lineage-btn" onClick={back}>
            Back
          </button>
        ) : null}
        <button type="button" className="sp-lineage-btn" onClick={() => setRef(null)}>
          Close
        </button>
      </header>

      <div className="sp-lineage-body">
        {q.isLoading ? (
          <Loading>Tracing the record.</Loading>
        ) : q.isError ? (
          <Failed onRetry={() => void q.refetch()}>
            Could not trace this id. {(q.error as Error)?.message}
          </Failed>
        ) : !d || !d.found ? (
          <Empty>
            No record for {d?.ref ?? ref} in this workspace. Audit ids are scoped to your
            workspaces, so an id from somewhere else, or a mistyped one, shows nothing.
          </Empty>
        ) : (
          <>
            <h3 className="sp-lineage-title">{stripAutoPrefix(d.title)}</h3>
            <div className="sp-lineage-meta">
              {d.status ? <span>{d.status}</span> : null}
              {d.status && d.createdAt ? <span aria-hidden="true"> · </span> : null}
              {d.createdAt ? <span>recorded {fmt(d.createdAt)}</span> : null}
            </div>

            {/* The walk. Every connected entity is itself a tag you can follow,
              which is the whole point: the record is a graph, not a row. */}
            <ol className="sp-trail">
              {d.steps.map((s, i) => (
                <li className="sp-trail-step" key={`${s.label}-${i}`}>
                  <span className="sp-trail-mark" aria-hidden="true" />
                  <div className="sp-trail-body">
                    <div className="sp-trail-label">
                      {s.label}
                      {s.at ? <span className="sp-trail-at"> · {fmt(s.at)}</span> : null}
                    </div>
                    <div className="sp-trail-detail">
                      <span>{stripAutoPrefix(s.detail)}</span>
                      {s.ref ? (
                        <button
                          type="button"
                          className="sp-trail-ref"
                          onClick={() => follow(s.ref as string)}
                          title={`Trace ${s.ref}`}
                        >
                          {s.ref}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {d.kind === "mission" && chainQ.data ? (
              <div className="sp-lineage-chain">
                <div className="sp-trail-label">Trust chain</div>
                <MissionChain chain={chainQ.data} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
