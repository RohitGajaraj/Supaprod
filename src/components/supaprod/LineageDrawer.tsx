import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, GitBranch, Radar, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getLineage, getProvenance, type ArtifactKind } from "@/lib/lineage.functions";

/**
 * Where a lineage node's link goes, and WHETHER IT CARRIES ITS ID.
 *
 * `signal` and `theme` used to be zero-arg — `() => ({ to: "/discover" })` —
 * which dropped the id for exactly the two kinds this drawer is mostly made of.
 * Pressing a source quote under "Traces back to" landed you on bare /discover,
 * which opens on whichever cluster ranks first that day. The chain was intact
 * in the database and there was no working door from the decision back to it.
 *
 * /discover already parses the deep link: src/routes/_authenticated.discover.tsx
 * validates `?focus=` and DiscoverSurface resolves either shape — a theme id
 * matched straight against the ranking, a signal id resolved through its
 * `theme_id` — so both kinds hand it the same param and the surface decides
 * what it is holding.
 *
 * THIS IS A PARTIAL REPAIR, and the part it does not reach is this drawer's
 * commonest case. DiscoverSurface resolves `?focus=` in `focusTarget` against
 * the RANKING, and the ranking drops every cluster whose status is dismissed,
 * merged or `promoted`. This drawer's only mount is _authenticated.decide.tsx
 * with `kind="opportunity"` — and an opportunity normally exists BECAUSE its
 * theme was promoted. So from there the parent theme, and every source signal
 * underneath it, still resolves to null and the surface still opens on the top
 * of the ranking. (Cited by symbol, not by line: the earlier version of this
 * note pinned the mount at decide.tsx:1252 and that number was 177 lines stale
 * one commit later. Symbols move less than line numbers do.)
 *
 * What changes here is that the link now NAMES the signal or cluster instead of
 * discarding it: the URL is correct and shareable, it lands correctly today for
 * any cluster still in the ranking, and it is the half of the round trip that
 * lives in this file. Landing a SETTLED cluster needs DiscoverSurface to resolve
 * one, which is not this component's to change.
 *
 * ----------------------------------------------------------------------------
 * 2026-08-06, THE ZERO-ARG SWEEP. The paragraph that used to sit here read
 * "STILL ZERO-ARG, and honestly so: `opportunity`, `task`, `roadmap_item` and
 * `decision`. Their destinations (/decide, /tasks, /roadmap, /meetings) declare
 * no `validateSearch` at all". Held against the map below, it was false at both
 * ends for the first of the four: `opportunity` went to /discover, not /decide,
 * and /discover is the one route in that list that DOES declare a parser. It is
 * replaced rather than deleted, and two of the four are now closed:
 *
 * `decision` CARRIES ITS ID NOW, and it is the loudest of them. It was
 * `() => ({ to: "/meetings" })`, and /meetings is a redirect stub whose
 * beforeLoad throws `redirect({ to: "/brain", search: { tab: "calendar" } })`,
 * so a Decision node landed on Brain's CALENDAR with its id discarded twice
 * over — once by a map entry that took no argument, once by a redirect that
 * hard-codes its own search. /brain's `validateSearch` has always kept
 * `?decision=`, and its `tab === "decisions"` branch renders
 * `<DecisionDetail id={decision} />`, so the door existed and nothing pointed
 * at it. Measured 2026-08-06 against production: `decision` is the most common
 * node in this drawer's only mount — 40 of an opportunity's descendants and 19
 * of its ancestors are decisions, against 37 theme ancestors — so this was the
 * drawer's most-travelled wrong link, not a corner case.
 *
 * WHAT THIS LINK STILL CANNOT REACH, measured per CALLER rather than per
 * workspace, which is the mistake the first draft of this note made.
 * `listDecisions` reads the newest 100 rows RLS admits, and RLS admits the union
 * of every workspace the caller belongs to — not one workspace's newest 100.
 * Nine of the ten accounts that can see a lineage-linked decision are well
 * inside 100 and every one of their links resolves (7 to 18 linked decisions
 * each, 0 outside). For the tenth — three workspaces, 115 decisions, the
 * heaviest account in the database — 13 of its 18 fall past row 100, and
 * DecisionDetail then draws "That call is not on the record. It may have been
 * removed since the link was made." — which is false, because it is on the
 * record and merely outside a window. THAT IS NOT A REASON TO DROP THE ID: those
 * same 13 are unreachable through Brain's decisions tab by any path today, since
 * DecisionsPanel is fed by the identical 100-row read, so the window is the
 * defect and this link only makes it visible. The fix is one filter in another
 * file — `listDecisions` accepting an `id`, or DecisionDetail reading by id when
 * the list misses — and it is written up in the seam report, not papered over
 * here.
 *
 * `opportunity` NOW POINTS AT /decide, AND IS STILL ZERO-ARG. It pointed at
 * /discover, which stopped being the opportunity surface on 2026-07-13 — that
 * route's own beforeLoad redirects `?tab=queue` to /decide — so an Opportunity
 * node sent you to the signals desk, a different station from the one holding
 * the row. /decide lists every opportunity (`listOpportunities` applies no
 * status filter and `rankOpportunities` adds none), and it declares no
 * `validateSearch`, so the id still cannot travel. This trades the wrong
 * STATION for the right station and a row you have to find: strictly better
 * than before, and honestly short of a door. The other half is a `?focus=`
 * parser on /decide, which is not this file's to write.
 *
 * AND SAY THE AWKWARD PART, because this drawer's only mount is /decide: from
 * there the link now points at the page you are already on, so pressing it
 * moves nothing and reads as dead. That is still the better of the two
 * failures — the bet it names is in the queue behind the drawer rather than on
 * a station you would have to navigate back from — but it is a failure, and it
 * is why this is written down as half a fix rather than a fix. It becomes a
 * real navigation the moment either /decide accepts `?focus=` or this drawer is
 * mounted anywhere else. Only 7 of an opportunity's ancestors and 7 of its
 * descendants are themselves opportunities (measured 2026-08-06), so the awkward
 * case is also the rare one.
 *
 * STILL ZERO-ARG, and now honestly so: `task` and `roadmap_item`. /tasks and
 * /roadmap are redirect stubs as well (to /today, and to /plan with
 * `search: { view: "roadmap" }`), and neither /today's route nor /plan's
 * `validateSearch` accepts an id, so a param invented here would not survive
 * the redirect that discards it. `roadmap_item` is dead vocabulary besides:
 * there is no `roadmap_items` table (`@/lib/artifact-tables` documents why),
 * nothing writes an edge of that kind, and live `artifact_lineage` holds zero
 * rows of it on either side, so the entry has never once rendered.
 *
 * NINE KINDS HAVE NO ENTRY AT ALL — house_rule, design_memory, prototype,
 * capability_change, learning, deployment, changeset, prd_scaffold, prd_flow —
 * and PeerLink draws them as an unlinked label. That is deliberate and stays:
 * an unlinked label beats a link to the wrong place, which is the whole lesson
 * of the two paragraphs above. `learning` is the one worth revisiting later —
 * 11 of an opportunity's ancestors are learnings and
 * `/brain?tab=learnings&learning=<id>` is a real door — but adding it is a NEW
 * affordance rather than the repair of a broken one, so it is recorded here
 * rather than taken in a pass about wrong destinations.
 */
const ROUTES: Partial<
  Record<
    ArtifactKind,
    (id: string) => {
      to: string;
      params?: Record<string, string>;
      search?: Record<string, string>;
    }
  >
> = {
  // Right station, no row: /decide is where opportunities are ranked. Zero-arg
  // until /decide declares a `?focus=` parser. See the sweep note above.
  opportunity: () => ({ to: "/decide" }),
  prd: (id) => ({ to: "/plan/spec/$id", params: { id } }),
  task: () => ({ to: "/tasks" }),
  signal: (id) => ({ to: "/discover", search: { focus: id } }),
  theme: (id) => ({ to: "/discover", search: { focus: id } }),
  meeting: (id) => ({ to: "/meetings/$id", params: { id } }),
  roadmap_item: () => ({ to: "/roadmap" }),
  // Lands on the record itself, and it is the only kind here that gets there
  // through a SEARCH param instead of a route param: /brain's validateSearch
  // keeps `decision`, and its decisions tab renders DecisionDetail for that id.
  // `signal` and `theme` also carry a search param, but theirs asks a surface to
  // focus something, which it can decline; this one selects the record.
  decision: (id) => ({ to: "/brain", search: { tab: "decisions", decision: id } }),
  mission: (id) => ({ to: "/build/$missionId", params: { missionId: id } }),
};

const KIND_LABEL: Record<ArtifactKind, string> = {
  signal: "Signal",
  theme: "Theme",
  opportunity: "Opportunity",
  // LOOM W2: the IA word is "spec" on every user-facing surface; the
  // ArtifactKind stays `prd` (internal identifier, CLAUDE.md disclaimer).
  prd: "Spec",
  roadmap_item: "Roadmap item",
  task: "Task",
  meeting: "Meeting",
  decision: "Decision",
  mission: "Build session",
  house_rule: "House rule",
  design_memory: "Design memory",
  // "Mockup", not "Prototype": the generator forbids <script> and produces one
  // static screen, so the word promised interactivity the artifact does not
  // have. The DB kind is unchanged; this is the reader's word for it.
  prototype: "Mockup",
  capability_change: "Capability change",
  // Added 2026-08-02 with the four kinds a live census found stored but declared
  // nowhere. Plain words, per the voice convention: what the thing IS to a
  // product manager, not the table it came from. "Outcome" rather than
  // "learning", because that is the word every other surface uses for the
  // verdict on a shipped spec.
  learning: "Outcome",
  deployment: "Deployment",
  changeset: "Code change",
  prd_scaffold: "Drawing",
  prd_flow: "Flow",
};

function PeerLink({ kind, id, title }: { kind: ArtifactKind; id: string; title: string | null }) {
  const route = ROUTES[kind]?.(id);
  const label = title || "(untitled)";
  if (!route) {
    return <span className="text-foreground">{label}</span>;
  }
  return (
    <Link
      to={route.to as never}
      params={(route.params ?? {}) as never}
      // Spread, not `search={route.search ?? {}}`: only the two kinds that name
      // a search param get one, so every other link navigates exactly as it did
      // before rather than being handed an explicit empty search object.
      {...(route.search ? { search: route.search as never } : {})}
      className="text-foreground hover:underline underline-offset-2"
    >
      {label}
    </Link>
  );
}

export function LineageDrawer({
  open,
  onOpenChange,
  kind,
  id,
  title,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  kind: ArtifactKind;
  id: string | null;
  title?: string;
}) {
  const fLineage = useServerFn(getLineage);
  const q = useQuery({
    queryKey: ["lineage", kind, id],
    queryFn: () => fLineage({ data: { kind, id: id as string } }),
    enabled: open && Boolean(id),
  });

  // O1 provenance: the deep root of the chain (the source signals this artifact
  // ultimately rests on), beyond the immediate "Came from" parents. Reuses
  // getProvenance; shown only when the chain is deeper than one hop (so it never
  // just duplicates "Came from" for a theme, whose immediate parents are signals).
  const fProvenance = useServerFn(getProvenance);
  const provQ = useQuery({
    queryKey: ["provenance", kind, id],
    queryFn: () => fProvenance({ data: { kind, id: id as string } }),
    enabled: open && Boolean(id),
  });

  const ancestors = q.data?.ancestors ?? [];
  const descendants = q.data?.descendants ?? [];
  const prov = provQ.data;
  // `depth > 1` used to gate this too, and it hid the evidence in exactly the
  // cases where the chain is shortest and the evidence is most direct: an
  // opportunity promoted straight from a signal is one hop, and since
  // 2026-08-01 `promoteThemeToOpportunity` also writes a direct
  // signal -> opportunity edge per member, so the strongest provenance in the
  // product resolves at depth 1. If there are source signals, there is
  // provenance to show; how many hops it took to find them is our business.
  const showProvenance = Boolean(prov && prov.signal_count > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-violet-300" /> Lineage
          </SheetTitle>
          <SheetDescription className="text-xs">
            How this {KIND_LABEL[kind].toLowerCase()} connects across the product lifecycle.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {title && (
            <div className="rounded-xl border hairline p-3 bg-secondary/30">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {KIND_LABEL[kind]}
              </div>
              <div className="text-sm font-medium mt-1">{title}</div>
            </div>
          )}

          <section>
            <h4 className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5 mb-2">
              <ArrowUp className="h-3 w-3" /> Came from
            </h4>
            {q.isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
            {!q.isLoading && ancestors.length === 0 && (
              <div className="text-xs text-muted-foreground italic">No upstream artifacts.</div>
            )}
            <ul className="space-y-2">
              {ancestors.map((e) => (
                <li key={e.id} className="text-xs flex items-start gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider shrink-0">
                    {KIND_LABEL[e.parent_kind as ArtifactKind]}
                  </span>
                  <PeerLink
                    kind={e.parent_kind as ArtifactKind}
                    id={e.parent_id}
                    title={e.peer_title ?? null}
                  />
                </li>
              ))}
            </ul>
          </section>

          {showProvenance && (
            <section>
              <h4 className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5 mb-2">
                <Radar className="h-3 w-3" /> Traces back to
              </h4>
              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                {prov!.signal_count} source signal{prov!.signal_count === 1 ? "" : "s"} through{" "}
                {prov!.node_count} step{prov!.node_count === 1 ? "" : "s"} of the discovery chain.
              </p>
              <ul className="space-y-2">
                {prov!.source_signals.slice(0, 8).map((s) => (
                  <li key={s.id} className="text-xs flex items-start gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider shrink-0">
                      {s.source ?? "signal"}
                    </span>
                    <PeerLink
                      kind="signal"
                      id={s.id}
                      title={(s.title ?? s.content ?? "signal").slice(0, 80)}
                    />
                  </li>
                ))}
              </ul>
              {prov!.source_signals.length > 8 && (
                <div className="text-[10px] text-muted-foreground mt-1.5">
                  +{prov!.source_signals.length - 8} more source signal
                  {prov!.source_signals.length - 8 === 1 ? "" : "s"}
                </div>
              )}
              {prov!.truncated && (
                <div className="text-[10px] text-muted-foreground italic mt-1">
                  chain truncated at the depth cap
                </div>
              )}
            </section>
          )}

          <section>
            <h4 className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5 mb-2">
              <ArrowDown className="h-3 w-3" /> Became
            </h4>
            {q.isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
            {!q.isLoading && descendants.length === 0 && (
              <div className="text-xs text-muted-foreground italic">
                Nothing promoted from this yet.
              </div>
            )}
            <ul className="space-y-2">
              {descendants.map((e) => (
                <li key={e.id} className="text-xs flex items-start gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider shrink-0">
                    {KIND_LABEL[e.child_kind as ArtifactKind]}
                  </span>
                  <PeerLink
                    kind={e.child_kind as ArtifactKind}
                    id={e.child_id}
                    title={e.peer_title ?? null}
                  />
                </li>
              ))}
            </ul>
          </section>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-lg border hairline px-3 py-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5"
          >
            <X className="h-3 w-3" /> Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
