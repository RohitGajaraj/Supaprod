/**
 * What each agent is told, what it can reach for, and what it earned.
 *
 * Ported to the shell primitives, 2026-07-29. It carried no
 * `components/obsidian` import, which is why the first sweep missed it, and it
 * was legacy anyway: an entirely hand-rolled surface built from `--card`,
 * `--canvas`, `--hairline`, `--text-primary/secondary/muted/faint`,
 * `--glacier` and `--radius-card`, none of which resolve against this shell.
 *
 * WHAT WENT, and why:
 *   KILLED the bordered card PER AGENT, each with its own header, its own top
 *     rule, and four nested sections inside it. That is the cardocalypse
 *     (anti-slop ban 5) four levels deep. An agent is a Row, and its detail
 *     opens under it.
 *   KILLED the local `sectionActionButtonStyle` object copied onto five
 *     controls, and the one that painted itself `--glacier` with white text to
 *     mean "primary". Button owns that, and it takes the app-wide focus ring
 *     without being asked.
 *   KILLED the onMouseEnter / onMouseLeave hover set imperatively on
 *     `e.currentTarget.style`. Row's hover is CSS, and it cannot be beaten by
 *     an inline background the way that one beat the stylesheet.
 *   KILLED the UPPERCASE letterspaced section headings. Block titles them.
 *   KILLED the pulse-animated grey blocks standing in for loading, and the
 *     "Capabilities - failed to load" box. Loading and Failed are primitives,
 *     and they say different things on purpose.
 *   KILLED the raw `Tier: / Status: / Arc:` dump. Those are label and value,
 *     which is a Line, and the words are plain now: "arc: trusted (default)"
 *     tells a user nothing they can act on.
 *   KILLED the "→" glyph in the graduation history. Plain words.
 *   KILLED the skill toggle that rendered its own state as its LABEL (a button
 *     reading "Enabled"), which gives a screen reader no control and no state.
 *     A live boundary is a Switch, which is what it always was.
 *   KILLED both success toasts. Rewriting an agent's instructions changes what
 *     it is told on EVERY run, and turning a skill off takes a capability away
 *     from it. Neither is a four-second fact
 *     (agents/FINAL-agent-presence.md R10), so each leaves a Receipt.
 *
 * A REAL DEFECT, fixed rather than re-skinned: a skill with zero runs rendered
 * "0/0 (0%)", which reads as a skill that has failed every time. Never used and
 * never worked are different facts. It says which.
 *
 * UNCHANGED: getCapabilities / updateAgentInstructions / toggleAgentSkill, the
 * ["capabilities", workspaceId] key and its workspace scoping, and the fact
 * that every number here is read from the server rather than derived.
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCapabilities,
  updateAgentInstructions,
  toggleAgentSkill,
  type AgentCapability,
  type SkillInfo,
} from "@/lib/capabilities.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Line,
  Loading,
  Num,
  Prose,
  Receipt,
  Row,
  Switch,
  Textarea,
  Value,
} from "@/components/shell/primitives";

type Settled = { id: string; verb: string; consequence: string; failed?: boolean };

const CHANGE_TYPE_LABEL: Record<string, string> = {
  instructions: "Instructions rewritten",
  skill_enabled: "Skill turned on",
  skill_disabled: "Skill turned off",
  self_tuned: "Tuned itself",
};

export function CapabilitiesPanel() {
  const { activeWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  const capsFn = useServerFn(getCapabilities);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["capabilities", activeWorkspace?.id],
    queryFn: () => capsFn({ data: { workspaceId: activeWorkspace?.id ?? null } }),
    enabled: !!activeWorkspace && !isLoadingWorkspace,
  });

  const capabilities = data?.capabilities ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isPending) return <Loading>Reading what each agent is told.</Loading>;

  if (isError) {
    return (
      <Failed onRetry={() => void refetch()}>
        This did not load, so nothing here is safe to change yet.{" "}
        {error instanceof Error ? error.message : ""}
      </Failed>
    );
  }

  if (capabilities.length === 0) {
    return (
      <Empty>
        No agent is configured in this workspace yet. Once the crew runs, each one appears here with
        what it is told and what it may do alone.
      </Empty>
    );
  }

  return (
    <>
      {capabilities.map((cap) => (
        <CapabilityRow
          key={cap.slug}
          capability={cap}
          workspaceId={activeWorkspace?.id ?? null}
          isExpanded={expandedId === cap.slug}
          onToggle={() => setExpandedId(expandedId === cap.slug ? null : cap.slug)}
        />
      ))}
    </>
  );
}

function CapabilityRow({
  capability,
  workspaceId,
  isExpanded,
  onToggle,
}: {
  capability: AgentCapability;
  workspaceId: string | null;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateAgentInstructions);
  const toggleSkillFn = useServerFn(toggleAgentSkill);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(capability.baseInstructions);
  const [settled, setSettled] = useState<Settled[]>([]);

  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed },
      ...prev,
    ]);

  const saveMutation = useMutation({
    mutationFn: (instructions: string) =>
      updateFn({
        data: {
          agentSlug: capability.slug,
          workspaceId: workspaceId ?? undefined,
          instructions,
        },
      }),
    onSuccess: () => {
      commit(
        `You rewrote what ${capability.name} is told`,
        "It reads the new instructions on its next run, and on every run after that.",
      );
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ["capabilities", workspaceId] });
    },
    onError: (e: unknown) =>
      commit(
        `You tried to rewrite what ${capability.name} is told`,
        e instanceof Error ? e.message : "The write failed. Nothing changed.",
        true,
      ),
  });

  const toggleSkillMutation = useMutation({
    mutationFn: (vars: { playbookId: string; enabled: boolean; name: string }) =>
      toggleSkillFn({
        data: {
          agentSlug: capability.slug,
          workspaceId: workspaceId ?? undefined,
          playbookId: vars.playbookId,
          enabled: vars.enabled,
        },
      }),
    onSuccess: (_r, vars) => {
      commit(
        vars.enabled ? "You gave it a skill" : "You took a skill away",
        vars.enabled
          ? `${capability.name} can use "${vars.name}" from its next run.`
          : `${capability.name} stops reaching for "${vars.name}". Its record of past uses stays.`,
      );
      qc.invalidateQueries({ queryKey: ["capabilities", workspaceId] });
    },
    onError: (e: unknown, vars) =>
      commit(
        vars.enabled ? "You tried to give it a skill" : "You tried to take a skill away",
        `"${vars.name}" is unchanged. ${e instanceof Error ? e.message : "The write failed."}`,
        true,
      ),
  });

  const a = capability.autonomy;
  const arc = a.arc ?? (a.tier === "cast" ? "trusted, by default" : "not set");

  return (
    <>
      <Row
        marks={<AgentMark slug={capability.slug} name={capability.name} state="quiet" />}
        lead={capability.name}
        // The different fact, never a restatement of the name: what it is for,
        // and what it may do without asking.
        sub={`${capability.blurb} · ${arc}`}
        tight
        focused={isExpanded}
        onClick={onToggle}
      />

      {isExpanded ? (
        <>
          {settled.map((s) => (
            <Receipt key={s.id} verb={s.verb} consequence={s.consequence} failed={s.failed} />
          ))}

          <Block
            title="What it is told"
            // Different information from the title, not a restatement of it.
            sub="Its own instructions, plus the voice anchor, the Strategic Brief, and any house rules scoped to it."
            more={isEditing ? undefined : "Rewrite"}
            onMore={() => {
              setDraft(capability.baseInstructions);
              setIsEditing(true);
            }}
          >
            {isEditing ? (
              <>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={8}
                  aria-label={`Instructions for ${capability.name}`}
                />
                <Actions
                  trailing={
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      disabled={saveMutation.isPending}
                    >
                      Cancel
                    </Button>
                  }
                >
                  <Button
                    variant="primary"
                    onClick={() => saveMutation.mutate(draft)}
                    disabled={saveMutation.isPending || draft.trim().length === 0}
                  >
                    {saveMutation.isPending ? "Saving" : "Save"}
                  </Button>
                </Actions>
              </>
            ) : (
              <Prose>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {capability.instructionsPreview ||
                    "Nothing of its own. It runs on the shared prompt alone."}
                </p>
              </Prose>
            )}
          </Block>

          {capability.skills.length > 0 ? (
            <Block
              title="What it can reach for"
              sub="Turning one off takes the capability away from the next run. Its record of past uses stays."
            >
              {capability.skills.map((skill) => (
                <SkillLine
                  key={skill.id}
                  skill={skill}
                  agentName={capability.name}
                  disabled={toggleSkillMutation.isPending}
                  onToggle={(next) =>
                    toggleSkillMutation.mutate({
                      playbookId: skill.id,
                      enabled: next,
                      name: skill.name,
                    })
                  }
                />
              ))}
            </Block>
          ) : null}

          <Block
            title="What it may do alone"
            sub="Policy is set in advance and does not block. The gate is the exception, not the loop."
          >
            <Line label="Trusted to" sub="What it does without asking you first">
              <Value>{arc}</Value>
            </Line>
            <Line label="Standing" sub={`On the ${a.tier} tier`}>
              <Value>{a.status}</Value>
            </Line>
            {a.score != null ? (
              <Line label="Its record" sub="Earned from what its past runs actually did">
                <Value>
                  <Num>{Math.round(a.score)}</Num>
                </Value>
              </Line>
            ) : null}
            {a.suggestedArc && a.suggestedArc !== a.arc ? (
              <Line label="It is asking for more" sub="It proposed this itself, from its own record">
                <Value tone="warn">{a.suggestedArc}</Value>
              </Line>
            ) : null}
            {a.toolModes.map((tm) => (
              <Line key={tm.toolName} label={tm.toolName} sub={`set by ${tm.source}`}>
                <Value>{tm.mode}</Value>
              </Line>
            ))}
          </Block>

          {a.graduationHistory.length > 0 ? (
            <Block title="What it earned, and when">
              {a.graduationHistory.map((g) => (
                <Row
                  key={g.id}
                  tight
                  lead={`${g.toolName}: ${g.fromMode} became ${g.toMode}`}
                  sub={g.status}
                  time={g.decidedAt ?? undefined}
                />
              ))}
            </Block>
          ) : null}

          {capability.history.length > 0 ? (
            <Block title="What was changed here">
              {capability.history.map((change) => (
                <Row
                  key={change.id}
                  tight
                  lead={CHANGE_TYPE_LABEL[change.type] ?? change.type}
                  // The different fact: what actually changed, and who did it.
                  sub={`${change.description} · ${change.changedBy ? `by ${change.changedBy}` : "it tuned itself"}`}
                  time={change.changedAt}
                />
              ))}
            </Block>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function SkillLine({
  skill,
  agentName,
  disabled,
  onToggle,
}: {
  skill: SkillInfo;
  agentName: string;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <Line
      label={skill.name}
      // The different fact: its actual record with this skill. A skill it has
      // never run says so, rather than printing a 0% that reads as failure.
      sub={
        skill.runs === 0 ? (
          "Never used yet, so there is nothing to judge it on"
        ) : (
          <>
            Worked <Num>{skill.wins}</Num> of <Num>{skill.runs}</Num> times (
            <Num>{Math.round(skill.winRate * 100)}%</Num>)
          </>
        )
      }
    >
      <Switch
        checked={skill.enabled}
        disabled={disabled}
        onChange={onToggle}
        label={`Let ${agentName} use ${skill.name}`}
      />
    </Line>
  );
}
