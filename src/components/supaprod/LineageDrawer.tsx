/**
 * THE LINEAGE DRAWER, ported to Meridian 2026-08-18.
 *
 * ── THE OVERLAY STAYS, AND IT IS A DECISION ─────────────────────────────
 * `shell/primitives.tsx` and `governance/CriticBadge.tsx` both record the
 * standing ruling: this system has NO pane, slide-over or drawer primitive and
 * the absence is deliberate. Meridian has none either. So this file had two
 * honest answers -- rebuild the chain IN PLACE on the surface that opens it, or
 * keep the overlay and port what is inside it. This is the second, for the
 * reason the ruling itself gives as its THIRD point:
 *
 *   "A pane is not a stylesheet. It is a focus trap, a scroll lock, Escape,
 *    focus returned to whatever opened it, and the page behind it made inert.
 *    Half of that is an accessibility regression wearing a primitive's name."
 *
 * That is an argument against BUILDING one out of utilities, and `ui/sheet` is
 * a Radix Dialog, which already supplies every item on that list. Hand-rolling
 * a replacement to get off the import would trade working focus management for
 * a `div`, which is the exact regression the ruling names. What was retired is
 * the PAINT, and the paint is what this port removes: every `hairline`,
 * `text-muted-foreground`, `bg-secondary`, `text-foreground` and `text-violet-300`
 * inside the overlay is gone. The container's mechanics are not a design layer.
 *
 * Rebuilding in place was the other real option and it loses more than it
 * gains here: this drawer's only mount is /decide, whose own header is built
 * around "one question in front of you, right now", and a 40-row provenance
 * chain unrolled into that column pushes the Gate off the screen to show a
 * reference the reader asked for once.
 *
 * ── AND THE VIOLET WENT ─────────────────────────────────────────────────
 * The `GitBranch` glyph was `text-violet-300`, a raw Tailwind hue on the one
 * mark that identifies this surface. Law 4: identity is shape, status is hue,
 * and violet is not a status this system has. The glyph carries the identity on
 * its own and now takes the quiet ink like every other mark in here.
 */

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
import { Action, Num, Reading } from "@/components/meridian/surface-parts";
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
 * replaced rather than deleted, and two of the four have changed, one of them
 * only halfway:
 *
 * `decision` CARRIES ITS ID NOW, and it is the loudest of them. It was
 * `() => ({ to: "/meetings" })`, and /meetings is a redirect stub whose
 * beforeLoad throws `redirect({ to: "/brain", search: { tab: "calendar" } })`.
 *
 * THE DESTINATION WAS NEVER THE WRONG PAGE, and the first draft of this
 * paragraph said it was. It read "so a Decision node landed on Brain's CALENDAR
 * with its id discarded twice over", and Brain has no calendar tab: `TABS` is
 * decisions / learnings / artifacts / docs / graph, `LEGACY_TABS` maps the
 * retired token `calendar` onto `decisions`, and `validateSearch` resolves the
 * raw token through that map before the page ever sees it. So the redirect
 * landed you on the decision LEDGER, the right tab with every call listed and
 * no row selected. What was lost was the id alone, and it was lost twice: once
 * by a map entry that took no argument, once by a redirect that hard-codes its
 * own search. This repo already had the fact written down correctly in
 * _authenticated.brain.tsx, in the substrate note on the retired meetings
 * surface, which is where I checked it. The repair below is therefore "the id
 * now reaches the row", not "the destination was wrong", and the smaller claim
 * is the true one. /brain's `validateSearch` has always kept
 * `?decision=`, and its `tab === "decisions"` branch renders
 * `<DecisionDetail id={decision} />`, so the door existed and nothing pointed
 * at it. Measured 2026-08-06 against production: `decision` is the most common
 * node in this drawer's only mount — 40 of an opportunity's descendants and 19
 * of its ancestors are decisions, against 37 theme ancestors — so this was the
 * drawer's most-travelled id-dropping link, not a corner case.
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
 * record and merely outside a window.
 *
 * THAT IS STILL NOT A REASON TO DROP THE ID, but the reason has to be stated
 * accurately, and the first draft of it was not. It claimed "those same 13 are
 * unreachable through Brain's decisions tab by any path today, since
 * DecisionsPanel is fed by the identical 100-row read". The read is not
 * identical and they are not unreachable. DecisionsPanel passes `source`,
 * `status` and its search box's `q` into `listDecisions`, which applies all
 * three BEFORE `.limit(100)`, and PostgREST filters before it limits, so typing
 * a title into that box narrows the window and surfaces a decision sitting past
 * global row 100. What is true, and what still supports keeping the id: those
 * 13 are invisible in the DEFAULT list, reachable only through a search or
 * filter that narrows the window, and that path already ends in the same false
 * sentence, because the panel's row navigates to
 * `{ tab: "decisions", decision: d.id }`, byte for byte the destination this
 * link now produces, and DecisionDetail then resolves the id against its OWN
 * unfiltered newest-100 read. So this link exposes a defect that is already
 * live rather than inventing one. The fix is one filter in another file,
 * `listDecisions` accepting an `id` or DecisionDetail reading by id when the
 * list misses, and it is written up in the seam report rather than papered over
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
 * CARRIES AN ID AND STILL LANDS SHORT: `meeting`, and this sweep's first pass
 * missed it, which is worth saying because a reader takes a sweep for a full
 * pass over the map. /meetings/$id is a redirect stub too, but unlike /tasks
 * and /roadmap it PRESERVES the id, throwing
 * `redirect({ to: "/brain", search: { tab: "calendar", meeting: params.id } })`.
 * `calendar` resolves to the decisions tab, /brain's `validateSearch` keeps
 * `?meeting=` for exactly that reason, and then nothing on that tab reads it:
 * the branch renders DecisionDetail for `?decision=` or the ledger, and the
 * meetings surface itself is gone. brain.tsx says the same thing in its own
 * words, that the count is real and there is nothing behind it. It is named
 * here rather than repaired, because the repair is a meeting surface or a Today
 * deep link and neither is this file's to write, and because it has never
 * rendered: live `artifact_lineage` holds zero `meeting` rows on either side
 * (measured 2026-08-06), the same census that retired `roadmap_item`.
 *
 * WORKING AND DELIBERATELY UNTOUCHED, so that the list above is a full pass
 * over the map rather than a partial one: `prd` to /plan/spec/$id and `mission`
 * to /build/$missionId both carry their id into a route param the destination
 * declares, and both land on the record itself.
 *
 * NINE KINDS HAVE NO ENTRY AT ALL — house_rule, design_memory, prototype,
 * capability_change, learning, deployment, changeset, prd_scaffold, prd_flow —
 * and PeerLink draws them as an unlinked label. That is deliberate and stays:
 * an unlinked label beats a link to the wrong place, which is the whole lesson
 * of the sweep above. `learning` is the one worth revisiting later —
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
  // Right station, no row, and NOT `/tasks`: that route is a bare redirect to
  // /today (_authenticated.tasks.tsx), and Today has no task list -- it imports
  // `taskStatus` for a mission dot and nothing else. The surface that actually
  // renders tasks is /plan/spec/$id (it calls `listTasks`), reached from /plan.
  // Zero-arg because a task id does not resolve to a spec id here, same shape
  // as the `opportunity` row above.
  task: () => ({ to: "/plan" }),
  signal: (id) => ({ to: "/discover", search: { focus: id } }),
  theme: (id) => ({ to: "/discover", search: { focus: id } }),
  // Carries the id and still lands short: /meetings/$id forwards it to
  // /brain?tab=calendar&meeting=, `calendar` resolves to the decisions tab, and
  // nothing there reads `?meeting=`. Zero live rows of this kind, so it has
  // never rendered. See the sweep note above.
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
  signal: "What we found",
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

/** A section heading in the drawer: the same micro-label every context column
 *  in the product uses, so the drawer reads as part of the system rather than
 *  as a page of its own. `tracking-mrd-label` rather than a hand-written em. */
const SECTION_HEAD =
  "mb-2 flex items-center gap-1.5 text-mrd-nano font-[650] uppercase tracking-mrd-label text-mrd-mute";

/** The eyebrow over the subject card. Same register, no leading glyph. */
const KIND_EYEBROW = "text-mrd-nano font-[650] uppercase tracking-mrd-label text-mrd-mute";

/** What KIND a node is. A kind is CATEGORICAL, so it takes no status hue and
 *  no tint: the recessed fill and the word are the whole chip. `rounded-mrd-xs`
 *  rather than a pill, because a full round on a two-word label is the shape
 *  this system reserves for a count. */
const KIND_CHIP =
  "shrink-0 rounded-mrd-xs bg-mrd-sink px-2 py-0.5 text-mrd-nano uppercase tracking-mrd-label text-mrd-body";

function PeerLink({ kind, id, title }: { kind: ArtifactKind; id: string; title: string | null }) {
  const route = ROUTES[kind]?.(id);
  const label = title || "(untitled)";
  if (!route) {
    return <span className="text-mrd-ink">{label}</span>;
  }
  return (
    <Link
      to={route.to as never}
      params={(route.params ?? {}) as never}
      // Spread, not `search={route.search ?? {}}`: only the two kinds that name
      // a search param get one, so every other link navigates exactly as it did
      // before rather than being handed an explicit empty search object.
      {...(route.search ? { search: route.search as never } : {})}
      /* The `Door` treatment, written out rather than borrowed: `Door` renders
         a <button> or an <a href>, and a TanStack `Link` is neither. Dotted
         underline going solid on hover is the one thing that changes, which is
         what every other door in this product does. */
      className="text-mrd-ink underline decoration-dotted underline-offset-2 transition-colors hover:decoration-solid"
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
      {/* `data-mrd` on the overlay's own root, not on the route that opens it.
          Meridian's focus treatment and its neutralisation of the legacy
          app-wide ring are both scoped to that attribute, and a Radix sheet
          portals OUT of the surface's DOM -- so without this the one thing in
          here a keyboard can reach fell back to the retired ring. */}
      <SheetContent
        side="right"
        data-mrd=""
        className="sm:max-w-md overflow-y-auto bg-mrd-sheet font-mrd text-mrd-prose text-mrd-body"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-mrd-prose font-medium text-mrd-ink">
            <GitBranch className="h-4 w-4 text-mrd-mute" /> Lineage
          </SheetTitle>
          <SheetDescription className="text-mrd-label leading-mrd-prose text-mrd-mute">
            How this {KIND_LABEL[kind].toLowerCase()} connects across the product lifecycle.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {title && (
            <div className="rounded-mrd-card border border-mrd-line bg-mrd-sink p-mrd-4">
              <div className={KIND_EYEBROW}>{KIND_LABEL[kind]}</div>
              <div className="mt-1 text-mrd-base font-medium text-mrd-ink">{title}</div>
            </div>
          )}

          <section>
            <h4 className={SECTION_HEAD}>
              <ArrowUp className="h-3 w-3" /> Came from
            </h4>
            {q.isLoading && <Reading>Reading the chain.</Reading>}
            {/* Not italic, and not "artifacts". Italic is emphasis spent on an
                absence, and the word is the table's, not the reader's. */}
            {!q.isLoading && ancestors.length === 0 && (
              <p className="text-mrd-label text-mrd-mute">Nothing upstream of this.</p>
            )}
            <ul className="space-y-2">
              {ancestors.map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-mrd-label">
                  <span className={KIND_CHIP}>{KIND_LABEL[e.parent_kind as ArtifactKind]}</span>
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
              <h4 className={SECTION_HEAD}>
                <Radar className="h-3 w-3" /> Traces back to
              </h4>
              <p className="mb-2 leading-mrd-prose text-mrd-prose text-mrd-body">
                <Num>{prov!.signal_count}</Num> source signal
                {prov!.signal_count === 1 ? "" : "s"} through <Num>{prov!.node_count}</Num> step
                {prov!.node_count === 1 ? "" : "s"} of the discovery chain.
              </p>
              <ul className="space-y-2">
                {prov!.source_signals.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-start gap-2 text-mrd-label">
                    <span className={KIND_CHIP}>{s.source ?? "signal"}</span>
                    <PeerLink
                      kind="signal"
                      id={s.id}
                      title={(s.title ?? s.content ?? "signal").slice(0, 80)}
                    />
                  </li>
                ))}
              </ul>
              {prov!.source_signals.length > 8 && (
                <p className="mt-1.5 text-mrd-small text-mrd-faint">
                  <Num>+{prov!.source_signals.length - 8}</Num> more source signal
                  {prov!.source_signals.length - 8 === 1 ? "" : "s"}
                </p>
              )}
              {prov!.truncated && (
                <p className="mt-1 text-mrd-small text-mrd-faint">
                  The chain stops here, at the depth cap. There is more of it.
                </p>
              )}
            </section>
          )}

          <section>
            <h4 className={SECTION_HEAD}>
              <ArrowDown className="h-3 w-3" /> Became
            </h4>
            {q.isLoading && <Reading>Reading the chain.</Reading>}
            {!q.isLoading && descendants.length === 0 && (
              <p className="text-mrd-label text-mrd-mute">Nothing promoted from this yet.</p>
            )}
            <ul className="space-y-2">
              {descendants.map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-mrd-label">
                  <span className={KIND_CHIP}>{KIND_LABEL[e.child_kind as ArtifactKind]}</span>
                  <PeerLink
                    kind={e.child_kind as ArtifactKind}
                    id={e.child_id}
                    title={e.peer_title ?? null}
                  />
                </li>
              ))}
            </ul>
          </section>

          {/* `Action`, so the one control in here wears the same shape as every
              other control in the product rather than a hand-rolled full-width
              slab. Left-aligned in its own row: a button stretched to the width
              of a column reads as a banner, not a control. */}
          <Action onClick={() => onOpenChange(false)}>
            <X className="h-3 w-3" /> Close
          </Action>
        </div>
      </SheetContent>
    </Sheet>
  );
}
