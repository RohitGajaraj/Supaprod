/**
 * Design. REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the five answers. The
 * first pass ported it onto the primitives, which was real work and is kept.
 * This pass answers what belongs here at all.
 *
 * 1. WHO IS HERE, AND WHY. A product lead whose design crew has stopped and
 *    asked. It proposed a rule it wants to follow from now on, and until that
 *    is settled every mockup it draws is drawn on unsettled ground. They came
 *    to say yes or no, not to read a brand library.
 *
 * 2. THE ONE THING IT EXISTS FOR. To settle a proposed brand rule. It is the
 *    only irreversible, judgment-requiring call on this surface: approve it
 *    and it binds into every mockup the crew draws after this, and nowhere
 *    else in the product is it a first-class decision (the approvals queue
 *    carries design_gate, never design memory). The prototype list below is
 *    what settled rules produced, and the one other action here, handing a
 *    mockup to someone as a link, hangs off that.
 *
 * 3. KEEP / MOVE / KILL, on what was here before:
 *    KEEP  the Gate. It is the decision and it is the biggest thing on the
 *          page, which is the whole point of the shape.
 *    KEEP  provenance and "behind this one" in the context column. Depth about
 *          the ONE item in focus is exactly what that column is for.
 *    KEEP  the prototype list and the share and copy actions. Nothing else in
 *          the product lists prototypes or hands one out as a link.
 *    KILL  <DesignMemoryPanel />, the entire "Your brand" block. Three
 *          reasons, any one sufficient. It duplicates something one click
 *          away: Settings -> Brand renders the identical panel under an
 *          identical heading. It half-did the job the Gate does completely,
 *          because its expanded rows carry their own approve and reject pair,
 *          so a single pending rule had two approve buttons on one page and
 *          the second was three clicks down. And it is built entirely from the
 *          retired system: --card, --hairline, --moss, --madder,
 *          --geist-space-*, uppercase mono used as chrome, a card nested
 *          inside the Block, and a fixed 1fr/110/110/90 grid that overflows
 *          sideways on a laptop, which is the pain point named twice.
 *    KILL  the "Who works this stage" context block and the agent-fleet query
 *          behind it. It spent a network round trip to print one agent's name
 *          and blurb. Nothing depends on it, it is not the rule's author (a
 *          rule's provenance is its source_kind, not an agent), and the crew
 *          roster owns agent identity completely, one click away.
 *    KILL  the composed "N rules in force, M prototypes published" headline.
 *          It reported two subjects at once and neither was the call in front
 *          of you. The headline now says what needs you. The standing count
 *          moved to the context column, where a standing fact belongs.
 *    MOVE  the spec picker and the "Publish prototype" button. DESTINATION:
 *          src/routes/_authenticated.plan.spec.$id.tsx, beside
 *          <DesignScaffoldPanel>, which already generated the very mockup
 *          being published. It needed a picker here only because the spec is
 *          not in focus here; there it is one button with nothing to choose.
 *          Going with it: the listPrds query, the triple-duty placeholder
 *          string, and its own error and retry line, which existed only to
 *          feed it. Also gone with it: a hand-rolled <select> carrying
 *          thirteen inline style properties.
 *
 * 4. ONE CLICK AWAY. The brand ledger itself, every rule with its category and
 *    source plus the import, paste and defaults machinery, lives in
 *    Settings -> Brand and is linked from the context column. A prototype row
 *    is one line plus a second line carrying a different fact, and its
 *    address, its share switch and its copy action appear only for the one you
 *    put in focus.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is approving a rule and
 *    watching the surface go quiet: the crew now has one more thing it never
 *    has to ask about again. The confusion this surface used to invite was two
 *    approve buttons for the same rule, one loud and one buried, which is why
 *    the panel is gone rather than restyled.
 */

import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { toast } from "@/lib/notify";
import {
  decideDesignMemory,
  listDesignMemory,
  type DesignMemoryRow,
} from "@/lib/design-memory.functions";
import { listPrototypes, togglePrototypeShare } from "@/lib/prototypes.functions";
import { CATEGORY_LABEL, SOURCE_LABEL } from "@/components/knowledge/design-memory-shared";
import {
  Block,
  Button,
  Empty,
  Failed,
  Gate,
  Num,
  PageHead,
  Row,
  Surface,
  Who,
} from "@/components/shell/primitives";

/** One fetch, unfiltered: this surface needs the pending queue and the
 *  in-force count, and both come off the same list. */
const ALL_RULES = { category: undefined, status: undefined };

function shareUrl(slug: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`;
}

/** Plain-words relative time. Mono is applied by the row, not here. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function Design() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const fetchRules = useServerFn(listDesignMemory);
  const fetchPrototypes = useServerFn(listPrototypes);
  const decide = useServerFn(decideDesignMemory);
  const share = useServerFn(togglePrototypeShare);

  const rules = useQuery({
    queryKey: ["design-memory", ALL_RULES],
    queryFn: () => fetchRules({ data: ALL_RULES }),
  });
  const prototypes = useQuery({ queryKey: ["prototypes"], queryFn: () => fetchPrototypes() });

  const entries = rules.data?.items ?? [];
  const waiting = entries.filter((r) => r.status === "pending");
  const inForce = entries.filter((r) => r.status === "approved").length;
  const call: DesignMemoryRow | null = waiting[0] ?? null;
  const protos = prototypes.data ?? [];

  const [openId, setOpenId] = React.useState<string | null>(null);
  const selected = protos.find((p) => p.id === openId) ?? null;

  const settle = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      if (!call) return;
      await decide({ data: { id: call.id, decision } });
    },
    onSuccess: (_r, decision) => {
      toast.success(decision === "approve" ? "In force from now on." : "Declined.");
      void qc.invalidateQueries({ queryKey: ["design-memory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; isPublic: boolean }) => share({ data: v }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["prototypes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openBrandRules = () =>
    void navigate({ to: "/settings", search: { section: "brand" } as never });

  // The headline says what needs YOU. The standing counts are standing facts
  // and live in the context column.
  const headline = rules.isLoading
    ? "Reading the record."
    : waiting.length === 0
      ? "Nothing needs you."
      : waiting.length === 1
        ? "One brand rule needs you."
        : `${waiting.length} brand rules need you.`;

  // An empty aside is a column of nothing, so the surface drops it entirely
  // rather than reserving room for it. Anything narrower than this and the
  // main column gets the width back.
  const hasContext = !!call || !!selected || (rules.isSuccess && entries.length > 0);

  const context = (
    <>
      {call ? (
        <>
          <div className="sp-ctx-head">Where this rule came from</div>
          <div className="sp-ctx-body">
            {CATEGORY_LABEL[call.category]} · {SOURCE_LABEL[call.source_kind]} ·{" "}
            <Num>
              {new Date(call.created_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </Num>
          </div>
        </>
      ) : null}

      {waiting.length > 1 ? (
        <>
          <div className="sp-ctx-head">Behind this one</div>
          <div className="sp-ctx-body">
            <Num>{waiting.length - 1}</Num> more waiting. They keep their order until this one is
            settled.
          </div>
        </>
      ) : null}

      {selected ? (
        <>
          <div className="sp-ctx-head">This prototype</div>
          <div className="sp-ctx-row">
            <span>
              <span className="sp-ctx-name">{selected.name}</span>
              <span className="sp-ctx-sub">
                {selected.isPublic ? shareUrl(selected.shareSlug) : "Not shared"}
              </span>
            </span>
          </div>
          <div className="sp-acts">
            <Button
              disabled={toggle.isPending}
              onClick={() => toggle.mutate({ id: selected.id, isPublic: !selected.isPublic })}
            >
              {selected.isPublic ? "Make private" : "Share by link"}
            </Button>
            {selected.isPublic ? (
              <Button
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard?.writeText(shareUrl(selected.shareSlug));
                  toast.success("Share link copied");
                }}
              >
                Copy link
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Suppressed on day one and on a failed read: the Gate already carries
          the invitation in the first case and the count would be a lie in the
          second, and two buttons pointing at the same place is the duplication
          this pass exists to remove. */}
      {rules.isSuccess && entries.length > 0 ? (
        <>
          <div className="sp-ctx-head">The rules themselves</div>
          <div className="sp-ctx-body">
            <Num>{inForce}</Num> in force. Add, review or retire them in Settings.
          </div>
          <div className="sp-acts">
            <Button variant="ghost" onClick={openBrandRules}>
              Open brand rules
            </Button>
          </div>
        </>
      ) : null}
    </>
  );

  return (
    <Surface context={hasContext ? context : undefined}>
      <PageHead
        title={headline}
        sub={call ? "Nothing binds into a mockup until you approve it." : undefined}
      />

      {rules.isLoading ? null : rules.isError ? (
        <Gate question="The brand rules did not load.">
          <Button variant="primary" onClick={() => void rules.refetch()}>
            Try again
          </Button>
        </Gate>
      ) : call ? (
        <Gate
          question={call.title}
          lines={[
            <span key="what">{call.content}</span>,
            ...(call.rationale ? [<span key="why">{call.rationale}</span>] : []),
          ]}
        >
          <Button
            variant="primary"
            disabled={settle.isPending}
            onClick={() => settle.mutate("approve")}
          >
            Approve
          </Button>
          <Button disabled={settle.isPending} onClick={() => settle.mutate("reject")}>
            Decline
          </Button>
        </Gate>
      ) : entries.length === 0 ? (
        // Day one is the only day every user has, and it is a different fact
        // from "nothing is waiting": the crew has nothing to follow at all.
        <Gate
          question="The crew has no brand rules to follow."
          lines={[
            <span key="w">
              Until it does, it draws from generic defaults rather than from your product.
            </span>,
          ]}
        >
          <Button variant="primary" onClick={openBrandRules}>
            Add design language
          </Button>
        </Gate>
      ) : (
        <Gate question="No brand rules are waiting on you." />
      )}

      <Block title="Prototypes" more="Open specs" onMore={() => void navigate({ to: "/plan" })}>
        {prototypes.isLoading ? null : prototypes.isError ? (
          <Failed onRetry={() => void prototypes.refetch()}>
            Could not read your prototypes. {(prototypes.error as Error).message}
          </Failed>
        ) : protos.length === 0 ? (
          <Empty>
            Nothing to hand anyone yet. Generate a mockup on a spec, then publish it from that spec
            and it gets a link you can send.
          </Empty>
        ) : (
          protos.map((p) => (
            <Row
              key={p.id}
              tight
              focused={openId === p.id}
              lead={<Who>{p.name}</Who>}
              // A different fact, not the name continued: whether it is out in
              // the world, and at what address. The switch itself belongs to
              // the one in focus, in the context column.
              sub={p.isPublic ? `Shared · /p/${p.shareSlug}` : "Private"}
              time={ago(p.updatedAt)}
              onClick={() => setOpenId(openId === p.id ? null : p.id)}
            />
          ))
        )}
      </Block>
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/design")({
  component: Design,
  head: () => ({ meta: [{ title: "Design · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Design] route crashed:", error);
    return (
      <Surface>
        <PageHead title="Design did not load." sub="Reload the page. Nothing here is lost." />
      </Surface>
    );
  },
});
