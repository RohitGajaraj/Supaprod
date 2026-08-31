import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { agentDisplayName } from "@/lib/agent-vocabulary";
import { verbForTool } from "@/lib/presence/character";
import type { Anchor } from "@/lib/presence/collision";
import { getWorkspaceAnchors } from "@/lib/approvals-queue.functions";
import { pollMs } from "@/components/shell/poll";
import { anchorKeyOf, anchoredElements } from "@/components/shell/presence-anchor";
import { teammateColour } from "@/components/shell/teammate-colour";

/**
 * NAMED, COLOURED TEAMMATES AT THE OBJECT THEY ARE ACTUALLY TOUCHING.
 *
 * `SPEC-MULTIPLAYER-PRESENCE` §3.1, §3.2 and §3.3, mounted ONCE in the shell
 * because §4 says so: "Cross-surface, so it lives with the shell. One
 * implementation, never per-route."
 *
 * ── EVERY POSITION IS DERIVED, AND THERE IS NO CODE PATH THAT INVENTS ONE ──
 * §2 is the law this feature is most able to break, and the penalty is stated:
 * "any cursor on screen whose position cannot be traced to a specific row" gets
 * the layer removed rather than patched. Three things make that structural here
 * rather than careful:
 *
 *   1. The input is `getWorkspaceAnchors`, which filters `agent_runs` to
 *      `status IN ('running','in_progress')` and joins `tool_calls` only to
 *      those runs' traces. An `Anchor` IS a live run and the newest action it
 *      actually took. There is no input carrying a teammate without a row.
 *   2. The position is `getBoundingClientRect()` of an element a SURFACE
 *      stamped with that object's identity. Not a guess about where the object
 *      probably is - the box the browser says it drew.
 *   3. If no element carries that identity, nothing is drawn. Not a fallback
 *      position, not the corner, not the last place it was. **An anchor whose
 *      object is not on this screen is silent**, and that is most of them.
 *
 * There is deliberately no interpolation and no idle drift. §2: "It does not
 * travel a path between them; it arrives, the way a real cursor does when
 * someone jumps."
 *
 * ── IT COSTS THE AGENTS NOTHING, WHICH IS §2.5's WHOLE ANSWER ──────────────
 * The strongest published objection to this feature is that an agent will burn
 * more tokens watching other agents than working. It is right about agents and
 * wrong about people. This is a READ OF STATE FOR A HUMAN, rendered from rows
 * that already exist; no teammate is fed another teammate's transcript to make
 * it work, and the agents are not participants in it.
 *
 * ── IT SAYS NOTHING WHEN THE READ FAILS, AND THAT IS NOT THE CALM ROOM ─────
 * §2 says the layer must report being out of touch rather than showing a calm
 * room on a dead feed. It is reported - by `RailCrew`, which shares this exact
 * query key and therefore this exact failure, and which draws "Cannot see who
 * is working" in the rail. AppFrame's own standing rule is that the shell says
 * a thing ONCE above everything; two failure sentences from one fetch is the
 * duplication this lane has spent the week removing. **So the honesty lives in
 * the rail and the cursors stay silent, because they are the same read.**
 */

/** One object on screen, its box, and every teammate anchored on it. */
interface Placed {
  key: string;
  /** Viewport coordinates. The layer is `position: fixed`, so these are direct. */
  x: number;
  y: number;
  w: number;
  h: number;
  on: Array<{ slug: string; name: string; verb: string; colour: string }>;
}

/**
 * Where each anchored object is, right now.
 *
 * Exported for its test: this is the whole of the "derived, never invented"
 * claim, and a test that could only reach it through a rendered component
 * would be testing React.
 */
export function placeAnchors(anchors: readonly Anchor[], elements: Map<string, Element>): Placed[] {
  /* Group by object first, because two teammates on ONE thing is a collision
     (§3.3) and must be drawn once with both of them - not twice, stacked, so
     that the second silently covers the first. */
  const byKey = new Map<string, Anchor[]>();
  for (const a of anchors) {
    if (!a.agentSlug) continue; // A mark with no identity is furniture.
    const key = anchorKeyOf(a);
    const held = byKey.get(key);
    if (held) held.push(a);
    else byKey.set(key, [a]);
  }

  /* The palette is assigned across every teammate DRAWN ANYWHERE on screen,
     not per object, or two teammates on two different objects could both be
     handed the first colour and the layer would assert they are the same
     worker. */
  const active = [...new Set(anchors.map((a) => a.agentSlug).filter((s): s is string => !!s))];

  const out: Placed[] = [];
  for (const [key, group] of byKey) {
    const el = elements.get(key);
    if (!el) continue; // Not on this screen. No position, so no cursor.
    const box = el.getBoundingClientRect();
    /* A zero-size box is an element that is present and not laid out - a
       collapsed panel, a row inside a closed disclosure. Drawing on it would
       put a chip at the top-left of the page, which is exactly the invented
       position §2 forbids, arrived at honestly. */
    if (box.width === 0 && box.height === 0) continue;

    /* Distinct by RUN would double-count one teammate holding two runs; the
       rail already dedupes by teammate and these two must not disagree about
       how many faces there are. */
    const seen = new Set<string>();
    const on: Placed["on"] = [];
    for (const a of group) {
      const slug = a.agentSlug as string;
      if (seen.has(slug)) continue;
      seen.add(slug);
      on.push({
        slug,
        name: agentDisplayName(slug),
        verb: verbForTool(a.toolName),
        colour: teammateColour(slug, active),
      });
    }
    out.push({ key, x: box.x, y: box.y, w: box.width, h: box.height, on });
  }
  /* Contested objects last, so their marks paint over the single ones rather
     than under them. The thing worth interrupting somebody about should not be
     the thing another chip covers. */
  return out.sort((p, q) => p.on.length - q.on.length);
}

export function TeammateCursors({ workspaceId }: { workspaceId: string | null }) {
  const fAnchors = useServerFn(getWorkspaceAnchors);

  /* THE SAME KEY `RailCrew` AND `OverlapNote` READ. Three renderings of one
     fact share one fetch and therefore cannot disagree about who is working,
     which is the defect this lane has spent the week removing everywhere else. */
  const anchors = useQuery({
    queryKey: ["presence", "anchors", workspaceId],
    queryFn: () => fAnchors({ data: { workspaceId: workspaceId as string } }),
    enabled: Boolean(workspaceId),
    staleTime: 10_000,
    refetchInterval: (q) => pollMs(10_000, q.state.fetchFailureCount),
  });

  const rows = React.useMemo(() => anchors.data?.anchors ?? [], [anchors.data]);
  const [placed, setPlaced] = React.useState<Placed[]>([]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (rows.length === 0) {
      setPlaced([]);
      return;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      setPlaced(placeAnchors(rows, anchoredElements(document)));
    };
    /* Coalesced into one frame. Every trigger below can fire in bursts - a
       scroll is dozens of events - and measuring per event would read layout
       dozens of times a frame. This is a frame scheduler, NOT a ticker: with
       nothing happening, nothing is scheduled and nothing runs. A repeating
       timer here would be the animation §2 forbids, wearing a performance
       optimisation's clothes. */
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();

    /* Capture, because the thing that scrolled is usually an inner region and
       scroll does not bubble. Passive, because this never prevents one. */
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    /* THE OBJECTS ARRIVE AFTER THE ANCHORS DO, and without this the layer would
       measure an empty board once and stay empty. Every surface here loads its
       rows asynchronously, so at the moment the anchors land the element
       carrying the matching id very often does not exist yet. */
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      mo.disconnect();
    };
  }, [rows]);

  if (placed.length === 0) return null;

  return (
    /* NEVER BLOCKS A CLICK (§3.1: "It rides above the surface and never blocks
       a click"). `pointer-events: none` on the layer and never re-enabled on a
       child: a teammate's chip is information, and a person reaching for the
       button underneath it must reach the button.

       `--shell-z-tip` is REUSED rather than a new level invented. That token is
       "the rail's label, over the row it names", and a teammate's chip over the
       object it names is the same altitude. It also keeps the layer BELOW
       summon, sheet and menu, which is right: a cursor drawn over an open menu
       would be pointing at an object the menu is covering. `src/styles/**` is
       S3's, so a new token here would be a reach into another prefix as well as
       an invention. */
    /* `aria-hidden`, and R-19 says accessibility is never deferred, so this is
       a decision rather than an omission. Every fact on this layer - which
       teammate, what verb - is ALREADY announced by `RailCrew`, from the same
       fetch, as a real list of buttons with accessible names ("Engineer,
       writing the change"). Announcing it twice would read the crew out again
       on every poll, and the positions themselves are the one thing a screen
       reader cannot use. So the information is reachable and this drawing of it
       is not announced. If that judgement is wrong it is S3's to overrule -
       4 gives them the layer's reduced-motion, contrast and focus behaviour. */
    <div
      aria-hidden
      data-presence-layer
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: "var(--shell-z-tip)" }}
    >
      {placed.map((p) => {
        const contested = p.on.length > 1;
        return (
          <div
            key={p.key}
            className="absolute"
            style={{ transform: `translate(${p.x}px, ${p.y}px)`, width: p.w, height: p.h }}
          >
            {/* WHO HAS THIS (§3.2). A ring in the holder's colour, on the object
                itself, so "what is being edited can be seen" without reading a
                chip. Contested objects get a dashed ring, which says "more than
                one" before any text is read. */}
            <span
              className="absolute inset-0 rounded-mrd-ctl"
              style={{
                outline: `1px ${contested ? "dashed" : "solid"} var(${p.on[0]!.colour})`,
                outlineOffset: "2px",
              }}
            />
            {/* The chips sit ABOVE the object rather than below it, so a row at
                the bottom of a scrolling list is still legible, and so the chip
                never covers the object it is naming. */}
            <span className="absolute bottom-full left-0 mb-mrd-1 flex flex-col items-start gap-mrd-1">
              {p.on.map((t) => (
                <span
                  key={t.slug}
                  className="flex items-center gap-mrd-2 rounded-mrd-ctl px-mrd-2 py-mrd-1 text-mrd-nano whitespace-nowrap"
                  style={{ background: `var(${t.colour})`, color: "var(--mrd-on-solid)" }}
                >
                  {/* THE NAME IS NEVER THE THING THAT TRUNCATES. §3.1: "The name
                      is the teammate's name, not its seat slug", and with a
                      palette this narrow the name is what actually carries the
                      identity. */}
                  <span className="font-[650]">{t.name}</span>
                  <span className="opacity-80">{t.verb}</span>
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
