/**
 * HOUSE RULES. Ported onto the primitives, 2026-07-29.
 *
 * WHAT CHANGED, AND WHY. Every rule, whatever its state, was the same bordered
 * card carrying a StepDot, the rule, its rationale, a learnings count and two
 * equally-weighted buttons. So a rule already in force and a rule asking for a
 * decision looked identical, and a queue of five drafts was five primary
 * actions with nothing to look at first.
 *
 * The governance canon (docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md)
 * gives the shape, because the two things are genuinely different acts:
 *
 *   Policy is set in advance and does not block. Permission is asked in the
 *   moment and does.
 *
 * So a rule ALREADY IN FORCE is a boundary, and a boundary is a Line: the rule
 * on the left, what changes it on the right, and a second line saying who it
 * covers rather than restating the rule. A rule the steward has DRAFTED is a
 * genuine human call, so exactly one at a time is a Gate, the biggest thing on
 * the surface, with the rest as one-line rows behind it. That is the same shape
 * the Crew surface uses for an agent proposing its own promotion, and it is the
 * same act: the machine proposing, the human ruling on the boundary.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Adopting a rule used to fire
 * a toast and the card vanished. A toast confirms that your click registered; a
 * Receipt renders what your click CAUSED, which here is a real, specific thing:
 * this sentence now rides every model call that agent makes. No arrow is drawn,
 * because nothing picks a house rule up. It is a standing rule from now on, and
 * an arrow to nowhere is worse than no arrow.
 *
 * `agent_slug` is on the row and was never drawn. A rule that binds one named
 * worker and a rule that binds all of them are different boundaries, and the
 * panel used to show them as the same one.
 */
import { useState } from "react";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  Approve,
  NothingHere,
  NothingYet,
  Num,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Textarea } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  listHouseRules,
  decideHouseRule,
  supersedeHouseRule,
  type HouseRule,
} from "@/lib/house-rules.functions";
import { humanWriteError } from "@/lib/roles.functions";
import { useGovernedWrite } from "@/hooks/use-workspace-role";
import { GovernedWriteNote } from "./GovernedWriteNote";
import { Receipt } from "@/components/meridian/Receipt";
import { Gate } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";

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

/** Who the boundary binds. A rule with no agent binds all of them, and that is
 *  a different boundary from one that binds a named worker. */
function whoItBinds(slug: string | null): string {
  return slug ? agentDisplayName(slug) : "every agent";
}

/** What is behind it. Second-line information on a boundary, never a
 *  restatement of the rule the label already carries. */
function provenance(r: HouseRule): string {
  const n = r.source_learning_ids.length;
  const who = whoItBinds(r.agent_slug);
  const from =
    n === 0 ? "written straight in" : `distilled from ${n} ${n === 1 ? "learning" : "learnings"}`;
  return `Rides every ${who} call, ${from}.`;
}

/** What a judgment on this surface left behind. `adopted: null` is the third
 *  act: you drafted a replacement, which decides nothing yet and changes
 *  nothing yet, and saying otherwise would be the surface overclaiming. */
type Settled = {
  at: string;
  adopted: boolean | null;
  who: string;
};

export function HouseRulesPanel() {
  /**
   * TWO DIFFERENT ACTS, TWO DIFFERENT ROLES, and the split is not cosmetic.
   *
   * DECIDING a rule puts a sentence into every agent's system prompt, so it is
   * owner or admin. DRAFTING a replacement lands as status='pending' and
   * changes nothing until somebody decides it, so a member keeps it. That is
   * exactly the split the migration's house_rules policies enforce, and
   * collapsing the two here would either hand a viewer the approval or take
   * proposing away from members.
   */
  const decideWrite = useGovernedWrite("house_rules_decide");
  const draftWrite = useGovernedWrite("house_rules_draft");
  const fList = useServerFn(listHouseRules);
  const fDecide = useServerFn(decideHouseRule);
  const fSupersede = useServerFn(supersedeHouseRule);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["house-rules"], queryFn: () => fList({ data: {} }) });
  const inv = () => void qc.invalidateQueries({ queryKey: ["house-rules"] });

  /** What your judgment left behind, rendered on the surface instead of
   *  vanishing into a toast. */
  const [settled, setSettled] = useState<Settled[]>([]);
  const [replacing, setReplacing] = useState<HouseRule | null>(null);
  const [draft, setDraft] = useState("");

  const decide = useMutation({
    mutationFn: (v: { rule: HouseRule; decision: "approve" | "reject" }) =>
      fDecide({ data: { ruleId: v.rule.id, decision: v.decision } }),
    onSuccess: (_r, v) => {
      setSettled((s) => [
        ...s,
        {
          at: new Date().toISOString(),
          adopted: v.decision === "approve",
          who: whoItBinds(v.rule.agent_slug),
        },
      ]);
      inv();
    },
    // A failure is never silent. It is not a receipt, because nothing happened.
    // It is also never the database's own words: a person who pressed Approve
    // must not be handed a policy name and a table name.
    onError: (e: Error) =>
      toast.error(humanWriteError(e, "That decision did not save. The rule is where it was.")),
  });

  const supersede = useMutation({
    // `rationale` is optional on the schema, never nullable, so it is omitted
    // rather than passed as null. tsc would not have caught that; zod would
    // have thrown at the call.
    mutationFn: (v: { rule: HouseRule; ruleText: string }) =>
      fSupersede({ data: { oldRuleId: v.rule.id, ruleText: v.ruleText } }),
    onSuccess: (_r, v) => {
      setSettled((s) => [
        ...s,
        { at: new Date().toISOString(), adopted: null, who: whoItBinds(v.rule.agent_slug) },
      ]);
      setReplacing(null);
      setDraft("");
      inv();
    },
    onError: (e: Error) =>
      toast.error(
        humanWriteError(e, "That replacement was not drafted. The rule you have still stands."),
      ),
  });

  if (q.isLoading) return <Reading>Reading the rules in force.</Reading>;

  if (q.isError) {
    return (
      <ReadFailed onRetry={() => void q.refetch()}>
        {(q.error as Error)?.message ??
          "The rules did not load, so nothing below would be the real boundary."}
      </ReadFailed>
    );
  }

  const all = q.data?.rules ?? [];
  const pending = all.filter((r) => r.status === "pending");
  const inForce = all.filter((r) => r.status === "approved");
  const turnedDown = all.filter((r) => r.status === "rejected");

  if (all.length === 0) {
    return (
      <NothingHere>
        No standing rules yet. The steward drafts one once your validated learnings show the same
        thing happening more than once, and it lands here for you to rule on.
      </NothingHere>
    );
  }

  // Exactly one thing asks at a time, so there is one primary action on the
  // screen and the end of the queue is visible from the start.
  const [live, ...behind] = pending;
  const busyOn = (id: string) => decide.isPending && decide.variables?.rule.id === id;

  return (
    <>
      {live ? (
        <Gate
          question={`Should ${whoItBinds(live.agent_slug)} follow this from now on?`}
          lines={[
            live.rule_text,
            ...(live.rationale ? [live.rationale] : []),
            live.source_learning_ids.length > 0 ? (
              <>
                Distilled from <Num>{live.source_learning_ids.length}</Num>{" "}
                {live.source_learning_ids.length === 1 ? "learning" : "learnings"} the steward found
                repeating.
              </>
            ) : (
              "Written straight in, with no learnings behind it yet."
            ),
            // The refusal rides INSIDE the question rather than above the
            // surface, because it is this decision that is not yours to make.
            // The rule itself, and everything behind it, still reads.
            ...(decideWrite.reason ? [decideWrite.reason] : []),
          ]}
        >
          <Approve
            disabled={busyOn(live.id) || !decideWrite.allowed}
            title={decideWrite.reason ?? undefined}
            onClick={() => decide.mutate({ rule: live, decision: "approve" })}
          >
            Make it a rule
          </Approve>
          <Action
            disabled={busyOn(live.id) || !decideWrite.allowed}
            title={decideWrite.reason ?? undefined}
            onClick={() => decide.mutate({ rule: live, decision: "reject" })}
          >
            Not this one
          </Action>
        </Gate>
      ) : null}

      {behind.length > 0 ? (
        <Region title="Behind it" sub="Settle the one above and the next takes its place.">
          {behind.map((r) => (
            <Row
              key={r.id}
              marks={<AgentMark slug={r.agent_slug} state="waiting" />}
              lead={r.rule_text}
              sub={`For ${whoItBinds(r.agent_slug)}`}
              time={ago(r.created_at)}
              tight
            />
          ))}
        </Region>
      ) : null}

      {/* THE COMMIT. What your judgment caused, per rule, in your own voice. */}
      {settled.map((s, i) => (
        <Receipt
          key={`${s.at}-${i}`}
          verb={
            s.adopted === null
              ? "You drafted a replacement"
              : s.adopted
                ? "You made it a rule"
                : "You turned it down"
          }
          consequence={
            s.adopted === null ? (
              <>
                It is waiting above. The rule it replaces still rides every {s.who} call until you
                make the new one.
              </>
            ) : s.adopted ? (
              <>It rides every {s.who} call from now on.</>
            ) : (
              <>Nothing changed. {s.who} carries on as before.</>
            )
          }
          time={ago(s.at)}
        />
      ))}

      {/* Drafting a replacement is a member's to make, so this sentence appears
          only for a read-only role and says something the Gate's did not. */}
      <GovernedWriteNote reason={draftWrite.reason} />

      <Region
        title="In force"
        sub="Set once, and they hold inside every call. Nothing here asks you again in the moment."
      >
        {inForce.length === 0 ? (
          <NothingYet>
            Nothing is standing yet. A rule you make above starts riding every call the moment you
            make it.
          </NothingYet>
        ) : (
          inForce.map((r) => (
            <Line key={r.id} label={r.rule_text} sub={provenance(r)}>
              <Action
                variant="quiet"
                disabled={replacing?.id === r.id || !draftWrite.allowed}
                title={draftWrite.reason ?? undefined}
                onClick={() => {
                  setReplacing(r);
                  setDraft(r.rule_text);
                }}
              >
                Replace it
              </Action>
            </Line>
          ))
        )}
      </Region>

      {/* The editor is its own region rather than an insert between two Lines:
          `.sp-line + .sp-line` is the divider between boundaries, and dropping
          a form in the middle of that chain silently removes one. */}
      {replacing ? (
        <Region
          title="The replacement"
          sub={`The old rule keeps working until you make this one. Nothing ${whoItBinds(replacing.agent_slug)} does changes in between.`}
        >
          <Field label="What it should say instead" htmlFor="house-rule-replacement">
            <Textarea
              id="house-rule-replacement"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </Field>
          <Actions
            trailing={
              <Action
                variant="quiet"
                onClick={() => {
                  setReplacing(null);
                  setDraft("");
                }}
              >
                Leave it as it is
              </Action>
            }
          >
            <Action
              variant="primary"
              disabled={
                supersede.isPending ||
                !draft.trim() ||
                draft.trim() === replacing.rule_text ||
                !draftWrite.allowed
              }
              title={
                draftWrite.reason ??
                (!draft.trim()
                  ? "Write the replacement first"
                  : draft.trim() === replacing.rule_text
                    ? "This is the rule you already have"
                    : undefined)
              }
              onClick={() => supersede.mutate({ rule: replacing, ruleText: draft.trim() })}
            >
              Draft it
            </Action>
          </Actions>
          {supersede.isError ? (
            <ReadFailedLine>
              {humanWriteError(
                supersede.error,
                "That replacement was not drafted. The rule you have still stands.",
              )}
            </ReadFailedLine>
          ) : null}
        </Region>
      ) : null}

      {turnedDown.length > 0 ? (
        <Region title="Turned down" sub="Kept on the record. None of these is in force.">
          {turnedDown.map((r) => (
            <Row
              key={r.id}
              marks={<AgentMark slug={r.agent_slug} state="quiet" />}
              lead={r.rule_text}
              sub={<Value>Discarded, nothing changed</Value>}
              time={ago(r.decided_at ?? r.created_at)}
              tight
            />
          ))}
        </Region>
      ) : null}
    </>
  );
}
