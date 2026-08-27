/**
 * Guardrails. The rules that read every AI call before it leaves and after it
 * comes back, and the log of what they caught.
 *
 * Ported off the retired system 2026-07-29. What changed, and why:
 *
 * KILL  the two bento tables. A four-column grid with its own header row, its
 *       own hairlines and its own per-cell colour is a table pretending to be a
 *       surface: it cannot be read on a narrow region, the header repeats what
 *       every row already says, and it was the second and third bordered
 *       container inside a region that is already one (anti-slop ban 5).
 * KILL  the hand-rolled 34x19 switch. It was a div wearing role="switch" with
 *       an absolutely positioned knob and a literal green. Switch is a real
 *       control, it takes the app-wide focus ring without being asked, and the
 *       stylesheet owns the green.
 * KILL  the modal rule editor. Six fields, a dry-run harness and three actions
 *       inside a fixed-position scrim is the exact shape ban 11 exists to stop
 *       ("If it needs a scrollbar and three columns, it deserves its own
 *       page"). It is IN-PLACE DETAIL now: opening a rule replaces the list,
 *       the same pattern Crew and Admin people use. Escape still closes it, and
 *       it is one back button away rather than one dismiss away.
 * KILL  every success toast. A toast confirms that your click registered; a
 *       Receipt renders what your click CAUSED, which is the whole difference
 *       between a confirmation and a record (agents/FINAL-agent-presence.md
 *       R10). Saving a rule now says what that rule will do to the next call.
 * KILL  relTimeCaps. `3H AGO` is the retired mono-caps voice; a guardrail that
 *       has never fired is a more useful fact than a timestamp, and it is said
 *       in words.
 *
 * WHY THESE ARE LINES AND NOT CARDS. The governance canon
 * (docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md): policy is set in
 * advance and does not block; permission is asked in the moment and does. A
 * guardrail is pure policy. It never interrupts anyone, so it reads as a
 * sentence with a switch at the end of it, and nothing on this surface is a
 * Gate.
 *
 * Every server function, query key and mutation is untouched: the rule CRUD,
 * the enable toggle, the built-in seed, the dry-run harness and the hits log
 * all behave exactly as before.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingYet,
  Num,
  Pre,
  Picker,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";
import { Checkbox, Field, Input, Textarea } from "@/components/meridian/forms";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useConfirm } from "@/hooks/use-confirm";
import { InjectionDefenseCard } from "./InjectionDefenseCard";
import { GUARDRAIL_FLOOR } from "@/lib/ai/guardrail-floor";
import {
  getGuardrailOverview,
  upsertGuardrailRule,
  deleteGuardrailRule,
  toggleGuardrailRule,
  seedBuiltInGuardrails,
  testGuardrailRule,
} from "@/lib/guardrails.functions";
import { humanWriteError } from "@/lib/roles.functions";
import { useGovernedWrite } from "@/hooks/use-workspace-role";
import { GovernedWriteNote } from "./GovernedWriteNote";
import { relTime } from "@/components/product/format";
import { Receipt } from "@/components/meridian/Receipt";

type Kind = "regex" | "keyword" | "pii" | "injection" | "secret";
type Action = "block" | "warn" | "redact";
type Applies = "input" | "output" | "both";

type RuleForm = {
  id?: string;
  name: string;
  kind: Kind;
  pattern: string;
  action: Action;
  applies_to: Applies;
  enabled: boolean;
};

/** What a decided write left behind. Rendered as a Receipt, never as a toast. */
type Committed = { verb: string; consequence: string; at: string };

/* ------------------------------------------------------------------ *
 * Vocabulary. What a rule does, said the way a person would say it.
 * ------------------------------------------------------------------ */

const ACTION_PHRASE: Record<Action, string> = {
  block: "Blocks",
  warn: "Warns on",
  redact: "Redacts",
};
const KIND_PHRASE: Record<Kind, string> = {
  regex: "anything matching this pattern",
  keyword: "anything containing this word",
  pii: "personal data matching this pattern",
  injection: "prompt injection matching this pattern",
  secret: "secrets matching this pattern",
};
const APPLIES_PHRASE: Record<Applies, string> = {
  both: "on the way out and on the way back",
  input: "on the way out",
  output: "on the way back",
};

/** What each action costs the call it fires on. Different information from the
 *  word itself, which is what keeps the second line honest (hard ban 10).
 *
 *  NOT `GovTone`: that type still carries the retired layer's `warn`, and
 *  Meridian has five status words and `warn` is not one of them. A rule that
 *  let the call through and wrote it down has stopped nothing and reported no
 *  outcome, which is what the amber `hold` says. */
const ACTION_TONE: Record<string, "quiet" | "pass" | "fail" | "hold" | "agent"> = {
  block: "fail",
  warn: "hold",
  redact: "quiet",
};

function ruleSentence(action: string, kind: string, applies: string): string {
  return `${ACTION_PHRASE[action as Action] ?? action} ${
    KIND_PHRASE[kind as Kind] ?? kind
  } ${APPLIES_PHRASE[applies as Applies] ?? applies}.`;
}

/** A quiet fact on the right of a Line where a control would otherwise sit. */
const CONTROL_WORD = {
  fontSize: "var(--mrd-t-label)",
  color: "var(--mrd-mute)",
};

/**
 * WHETHER SWITCHING THIS RULE OFF WOULD ACTUALLY SWITCH ANYTHING OFF.
 *
 * `withFloor` (lib/ai/guardrail-floor.ts) de-duplicates on `kind::pattern` and
 * returns `[...GUARDRAIL_FLOOR, ...extra]`, and `loadGuardrails` selects with
 * `.eq("enabled", true)`. So a workspace rule that shares a kind and a pattern
 * with a floor rule is dropped from `configured` the moment it is disabled and
 * immediately re-added from the floor: the call is screened either way.
 *
 * Eight of the nine built-in seeds share kind and pattern with a floor rule, so
 * until 2026-08-11 an admin could switch off credit-card redaction on the
 * enterprise-inspection surface, be told in writing that it "checks nothing
 * until you turn it back on", and have it keep redacting. This file's sibling
 * ControlsPanel calls that exact shape "worse than no control".
 *
 * The test is the runtime's own key, not a paraphrase of it, and it is gated on
 * the floor the SERVER reported for this workspace: a response carrying no
 * floor gets its switches back rather than a claim this panel cannot support.
 */
function makeIsFloor(reported: { id: string }[]) {
  const reportedIds = new Set(reported.map((f) => f.id));
  const live = GUARDRAIL_FLOOR.filter((f) => reportedIds.has(f.id));
  const keys = new Set(live.map((f) => `${f.kind}::${f.pattern}`));
  return (r: { kind: string; pattern: string }) => keys.has(`${r.kind}::${r.pattern}`);
}

/** A rule that has never fired is a more useful fact than a timestamp: it is
 *  the one that tells you whether the boundary is doing anything at all. */
function lastFiredPhrase(iso: string | null): string {
  if (!iso) return "It has never fired.";
  const t = relTime(iso);
  if (t === "now") return "It caught something just now.";
  if (/^\d+[mhd]$/.test(t)) return `It last caught something ${t} ago.`;
  return `It last caught something on ${t}.`;
}

function emptyRule(): RuleForm {
  return {
    name: "",
    kind: "keyword",
    pattern: "",
    action: "warn",
    applies_to: "both",
    enabled: true,
  };
}

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

/** Shown when a guardrail write failed for a reason the database wrote. */
const GUARDRAIL_WRITE_FAILED = "That rule did not save. Nothing on this surface changed.";

export function GuardrailsPanel({
  /**
   * DRAW THE RULES AND NOT WHAT THEY CAUGHT.
   *
   * "What they caught" is a log of every time a rule fired. It is real and it
   * matters, and it is not an answer to "what may these agents say", which is
   * the question the Settings pane mounting this panel is titled for. Same line
   * drawn for ControlsPanel's spend log (U-038), BudgetsPanel's alert history
   * (U-062) and the Safety room's incidents (U-076): the controls move onto the
   * one screen, the record of what already happened stays with the record.
   *
   * The Engine Room passes nothing and gets the whole panel, so the flag
   * decides where a region is DRAWN and never whether it exists.
   */
  controlsOnly = false,
}: { controlsOnly?: boolean } = {}) {
  const confirm = useConfirm();
  // A guardrail is the `guardrail_rules` governed surface: owner or admin, the
  // same pair can_manage_workspace() enforces on every write policy below it.
  const { allowed: mayWrite, reason: writeDenied } = useGovernedWrite("guardrail_rules");
  const fOverview = useServerFn(getGuardrailOverview);
  const fUpsert = useServerFn(upsertGuardrailRule);
  const fDelete = useServerFn(deleteGuardrailRule);
  const fToggle = useServerFn(toggleGuardrailRule);
  const fSeed = useServerFn(seedBuiltInGuardrails);
  const fTest = useServerFn(testGuardrailRule);
  const qc = useQueryClient();

  const overview = useQuery({ queryKey: ["guardrails"], queryFn: () => fOverview() });

  const [editing, setEditing] = useState<RuleForm | null>(null);
  const [committed, setCommitted] = useState<Committed[]>([]);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<{
    text: string;
    blocked: boolean;
    hits: { matched: string }[];
  } | null>(null);

  // Escape leaves the editor, which is the innermost thing open here.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const commit = (verb: string, consequence: string) =>
    setCommitted((c) => [...c, { verb, consequence, at: new Date().toISOString() }]);

  const upsert = useMutation({
    mutationFn: (r: RuleForm) => fUpsert({ data: r }),
    onSuccess: (_d, r) => {
      // THE COMMIT. What the rule will now do, per rule, in its own words.
      commit(
        r.id ? "You changed the rule" : "You wrote a rule",
        r.enabled
          ? `${r.name} ${ruleSentence(r.action, r.kind, r.applies_to).toLowerCase()} It starts on the next call.`
          : `${r.name} is saved but switched off, so it checks nothing yet.`,
      );
      setEditing(null);
      setTestResult(null);
      setTestText("");
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
  });

  const del = useMutation({
    mutationFn: (v: { id: string; name: string }) => fDelete({ data: { id: v.id } }),
    onSuccess: (_d, v) => {
      commit("You deleted the rule", `${v.name} is gone. Nothing is checked against it now.`);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
  });

  const tog = useMutation({
    mutationFn: (v: { id: string; enabled: boolean; name: string }) =>
      fToggle({ data: { id: v.id, enabled: v.enabled } }),
    onSuccess: (_d, v) => {
      commit(
        v.enabled ? "You turned it on" : "You turned it off",
        v.enabled
          ? `${v.name} checks every call from the next one on.`
          : `${v.name} checks nothing until you turn it back on.`,
      );
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
  });

  const seed = useMutation({
    mutationFn: () => fSeed(),
    onSuccess: (r) => {
      commit(
        "You added the built-ins",
        r.inserted > 0
          ? `${r.inserted} more rules read every call from now on: personal data, secrets, and prompt injection.`
          : "Nothing was added. Every built-in rule was already here.",
      );
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
  });

  const test = useMutation({
    mutationFn: (r: RuleForm) =>
      fTest({
        data: { text: testText, side: r.applies_to === "output" ? "output" : "input", rule: r },
      }),
    onSuccess: (r) => setTestResult(r),
  });

  if (overview.isError) {
    return (
      <ReadFailed error={overview.error} onRetry={() => void overview.refetch()}>
        The rules did not load, so nothing below would be the real boundary.
      </ReadFailed>
    );
  }

  if (overview.isLoading) {
    return <Reading>Reading the rules in force.</Reading>;
  }

  const rules = overview.data?.rules ?? [];
  const hits = overview.data?.hits ?? [];
  /**
   * THE RULES THAT SCREEN THIS WORKSPACE WHETHER OR NOT IT CONFIGURED ANY.
   *
   * `getGuardrailOverview` has returned this since the floor shipped, under a
   * comment saying it exists "so the Safety room can stop saying 'Nothing
   * checks your AI calls yet' to a workspace whose calls are, in fact, being
   * checked". This panel read only `.rules` and `.hits`, so it went on saying
   * it - to seventeen of the twenty-one workspaces in the live database, one
   * click below an overview card already carrying "8 always on".
   */
  const floor = overview.data?.floor ?? [];
  const isFloor = makeIsFloor(floor);

  // Last fired per rule, from the real hits log. Hits arrive newest first, so
  // the first one seen for a name is the latest.
  const lastFired = new Map<string, string>();
  for (const h of hits) {
    if (!lastFired.has(h.rule_name)) lastFired.set(h.rule_name, h.created_at);
  }

  if (editing) {
    return (
      <RuleEditor
        rule={editing}
        // The same fact the list states, said again where the same claim would
        // otherwise be made a second time: the editor's "Checking once you
        // save" writes `enabled`, and for a floor-backed rule the runtime
        // re-adds it regardless.
        onFloor={isFloor(editing)}
        // Opening a rule is a READ, and the migration deliberately left every
        // read alone. So the detail stays reachable and only the two writes at
        // the bottom of it are refused.
        canWrite={mayWrite}
        writeDenied={writeDenied}
        onChange={setEditing}
        onBack={() => setEditing(null)}
        onSave={() => upsert.mutate(editing)}
        saving={upsert.isPending}
        saveError={upsert.error as Error | null}
        onDelete={async () => {
          if (!editing.id) return;
          const ok = await confirm({
            title: `Delete "${editing.name}"?`,
            body: "It stops checking calls the moment you do, and it does not come back.",
            destructive: true,
            confirmLabel: "Delete rule",
          });
          if (ok && editing.id) del.mutate({ id: editing.id, name: editing.name });
        }}
        deleting={del.isPending}
        deleteError={del.error as Error | null}
        testText={testText}
        onTestText={setTestText}
        onTest={() => test.mutate(editing)}
        testing={test.isPending}
        testError={test.error as Error | null}
        testResult={testResult}
      />
    );
  }

  const live = rules.filter((r) => r.enabled).length;

  return (
    <>
      {/* Said once, above every control it explains, and nothing at all for an
          owner or an admin. */}
      <GovernedWriteNote reason={writeDenied} />

      <Region
        title="What the rules check"
        // TWO POPULATIONS, COUNTED SEPARATELY. The old sub said "<live> of
        // <rules.length> read every call", which omitted the eight that also
        // read every call and cannot be switched off.
        sub={
          rules.length === 0 ? undefined : floor.length > 0 ? (
            <>
              <Num>{floor.length}</Num> always on, plus <Num>{live}</Num> of{" "}
              <Num>{rules.length}</Num> you set. The rest are saved and switched off.
            </>
          ) : (
            <>
              <Num>{live}</Num> of <Num>{rules.length}</Num> read every call. The rest are saved and
              switched off.
            </>
          )
        }
        // ABSENT rather than disabled: "Write a rule" opens an editor whose only
        // ending is a Save this person cannot press, so offering it would be a
        // promise the surface cannot keep.
        /* `goTo` and not `toggle`: `setEditing` replaces this whole panel with
           the rule editor -- see the `if (editing) return` above -- so nothing
           expands here and an `aria-expanded` would describe a disclosure that
           never happens. It leaves for a named destination, which is what
           `goTo` is. */
        goTo={rules.length > 0 && mayWrite ? "Write a rule" : undefined}
        onGoTo={() => setEditing(emptyRule())}
      >
        {rules.length === 0 ? (
          <NothingYet
            action={
              <>
                <Action
                  variant="primary"
                  disabled={seed.isPending || !mayWrite}
                  title={writeDenied ?? undefined}
                  onClick={() => seed.mutate()}
                >
                  Add the built-ins
                </Action>
                <Action
                  variant="quiet"
                  disabled={!mayWrite}
                  title={writeDenied ?? undefined}
                  onClick={() => setEditing(emptyRule())}
                >
                  Write your own
                </Action>
              </>
            }
          >
            {/* THE EMPTY IS ABOUT THIS WORKSPACE'S OWN RULES, AND ONLY THOSE.
                It used to say "Nothing checks your AI calls yet" to a
                workspace whose every call runs through the floor, which is
                false in the direction that gets someone hurt: it reads as an
                open door. */}
            {floor.length > 0 ? (
              <>
                <Num>{floor.length}</Num> rules screen every call already: personal data is
                redacted, credentials are blocked, prompt injection is flagged. You have not written
                any of your own on top of them.
              </>
            ) : (
              <>
                Nothing checks your AI calls yet. The built-in set reads for personal data, secrets
                and prompt injection, and you can write your own on top of it.
              </>
            )}
          </NothingYet>
        ) : (
          rules.map((g) => {
            const onTheFloor = isFloor(g);
            return (
              <Line
                key={g.id}
                label={g.name}
                // Three different facts, none of them the name again: what it
                // does, what it looks for, and whether it has ever done anything.
                sub={
                  <>
                    {ruleSentence(g.action, g.kind, g.applies_to)} <Num>{g.pattern}</Num>{" "}
                    {lastFiredPhrase(lastFired.get(g.name) ?? null)}
                    {onTheFloor
                      ? " It is part of the screening floor, so this workspace runs it either way."
                      : g.built_in
                        ? " It came with the product."
                        : ""}
                  </>
                }
              >
                <Action
                  variant="quiet"
                  onClick={() =>
                    setEditing({
                      id: g.id,
                      name: g.name,
                      kind: g.kind as Kind,
                      pattern: g.pattern,
                      action: g.action as Action,
                      applies_to: g.applies_to as Applies,
                      enabled: g.enabled,
                    })
                  }
                >
                  Open
                </Action>
                {/* NO SWITCH WHERE THE RUNTIME WOULD IGNORE IT. The fact
                    replaces the control, which is the pattern this codebase
                    already applied to the tool modes in ControlsPanel: a
                    control that displays a value the system does not honour is
                    worse than no control. */}
                {onTheFloor ? (
                  <span style={CONTROL_WORD}>Always on. It cannot be switched off.</span>
                ) : (
                  <Toggle
                    checked={g.enabled}
                    label={`${g.name} checks every call`}
                    disabled={tog.isPending || !mayWrite}
                    onChange={(next) => tog.mutate({ id: g.id, enabled: next, name: g.name })}
                  />
                )}
              </Line>
            );
          })
        )}

        {tog.error ? (
          <ReadFailedLine>{humanWriteError(tog.error, GUARDRAIL_WRITE_FAILED)}</ReadFailedLine>
        ) : null}
        {seed.error ? (
          <ReadFailedLine>{humanWriteError(seed.error, GUARDRAIL_WRITE_FAILED)}</ReadFailedLine>
        ) : null}

        {rules.length > 0 ? (
          <Actions>
            <Action
              variant="quiet"
              disabled={seed.isPending || !mayWrite}
              title={writeDenied ?? undefined}
              onClick={() => seed.mutate()}
            >
              Add any missing built-ins
            </Action>
          </Actions>
        ) : null}
      </Region>

      {!controlsOnly ? (
        <Region
          title="What they caught"
          sub="Every time a rule fired, and on what. The match is stored, the rest of the call is not."
        >
          {hits.length === 0 ? (
            <NothingYet>
              Nothing has been caught. Either nothing has tripped a rule, or no calls have run
              through them yet.
            </NothingYet>
          ) : (
            hits.map((h) => (
              <Row
                key={h.id}
                tight
                lead={
                  <>
                    {h.rule_name} <Value tone={ACTION_TONE[h.action] ?? "hold"}>{h.action}</Value>
                  </>
                }
                sub={
                  <>
                    {h.side === "output" ? "On the way back" : "On the way out"}
                    {h.matched ? (
                      <>
                        {" · "}
                        <Num>{h.matched}</Num>
                      </>
                    ) : null}
                  </>
                }
                time={relTime(h.created_at)}
              />
            ))
          )}
        </Region>
      ) : null}

      {/* THE COMMIT. What each decision above actually caused, kept on screen
          rather than flashed and lost. */}
      {committed.map((c, i) => (
        <Receipt
          key={`${c.at}-${i}`}
          verb={c.verb}
          consequence={c.consequence}
          time={relTime(c.at)}
        />
      ))}

      <InjectionDefenseCard />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * One rule, in place. Never a modal: six fields and a harness is a
 * surface, and ban 11 exists to stop exactly this from being an overlay.
 * ------------------------------------------------------------------ */

function RuleEditor({
  rule,
  onFloor,
  canWrite,
  writeDenied,
  onChange,
  onBack,
  onSave,
  saving,
  saveError,
  onDelete,
  deleting,
  deleteError,
  testText,
  onTestText,
  onTest,
  testing,
  testError,
  testResult,
}: {
  rule: RuleForm;
  /** True when the runtime screens on this kind and pattern regardless of the
   *  stored `enabled`, so the checkbox below would promise something it cannot
   *  deliver. */
  onFloor: boolean;
  /** False for a role the database will refuse. The fields stay readable. */
  canWrite: boolean;
  writeDenied: string | null;
  onChange: (next: RuleForm) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  saveError: Error | null;
  onDelete: () => void;
  deleting: boolean;
  deleteError: Error | null;
  testText: string;
  onTestText: (next: string) => void;
  onTest: () => void;
  testing: boolean;
  testError: Error | null;
  testResult: { text: string; blocked: boolean; hits: { matched: string }[] } | null;
}) {
  const incomplete = !rule.name.trim() || !rule.pattern.trim();

  return (
    <>
      <GovernedWriteNote reason={writeDenied} />

      <Region
        title={rule.id ? "This rule" : "A new rule"}
        // The sentence it currently spells out, which is the one thing the six
        // fields below are hard to read as a whole.
        sub={
          incomplete
            ? "A rule needs a name and something to look for before it can be saved."
            : ruleSentence(rule.action, rule.kind, rule.applies_to)
        }
      >
        <Field label="Name" htmlFor="rule-name">
          <Input
            id="rule-name"
            autoFocus
            value={rule.name}
            onChange={(e) => onChange({ ...rule, name: e.target.value })}
          />
        </Field>

        <Field label="What it looks for" htmlFor="rule-kind">
          <Picker
            id="rule-kind"
            value={rule.kind}
            onChange={(e) => onChange({ ...rule, kind: e.target.value as Kind })}
          >
            <option value="keyword">A word, matched literally</option>
            <option value="regex">A pattern</option>
            <option value="pii">Personal data</option>
            <option value="injection">Prompt injection</option>
            <option value="secret">A secret</option>
          </Picker>
        </Field>

        <Field label="The pattern" htmlFor="rule-pattern">
          <Textarea
            id="rule-pattern"
            rows={2}
            value={rule.pattern}
            onChange={(e) => onChange({ ...rule, pattern: e.target.value })}
          />
        </Field>

        <Field label="Where it looks" htmlFor="rule-applies">
          <Picker
            id="rule-applies"
            value={rule.applies_to}
            onChange={(e) => onChange({ ...rule, applies_to: e.target.value as Applies })}
          >
            <option value="both">On the way out and on the way back</option>
            <option value="input">On the way out only</option>
            <option value="output">On the way back only</option>
          </Picker>
        </Field>

        <Field label="What it does when it matches" htmlFor="rule-action">
          <Picker
            id="rule-action"
            value={rule.action}
            onChange={(e) => onChange({ ...rule, action: e.target.value as Action })}
          >
            <option value="warn">Let it through, and write it down</option>
            <option value="redact">Take the match out, and let the rest through</option>
            <option value="block">Stop the call</option>
          </Picker>
        </Field>

        {/* A value you submit, not a boundary that goes live under your finger,
            so it is a checkbox and stays monochrome.

            ABSENT, not disabled, for a rule the runtime screens either way: an
            unticked box beside "Leave this off to start it later" is a written
            promise that unticking it stops the checking, and for a floor-backed
            kind and pattern it does not. */}
        {onFloor ? (
          <Line
            label="Checking once you save"
            sub="This kind and pattern are part of the screening floor, so every call runs through them whether this rule is on or off."
          >
            <span style={CONTROL_WORD}>Always on</span>
          </Line>
        ) : (
          <Line
            label="Checking once you save"
            htmlFor="rule-enabled"
            sub="Leave this off to write the rule now and start it later."
          >
            <Checkbox
              id="rule-enabled"
              label="Checking once you save"
              checked={rule.enabled}
              onChange={(next) => onChange({ ...rule, enabled: next })}
            />
          </Line>
        )}
      </Region>

      <Region
        title="Try it first"
        sub="Runs this rule against your text and nothing else. Nothing is saved, and no call is affected."
      >
        <Field label="Sample text" htmlFor="rule-sample">
          <Textarea
            id="rule-sample"
            rows={3}
            value={testText}
            onChange={(e) => onTestText(e.target.value)}
          />
        </Field>

        <Actions>
          <Action disabled={!testText.trim() || testing} onClick={onTest}>
            {testing ? "Running" : "Run it"}
          </Action>
        </Actions>

        {testError ? <ReadFailedLine>{testError.message}</ReadFailedLine> : null}

        {testResult ? (
          <>
            <Line
              label={testResult.blocked ? "It would stop this call" : "It would let this through"}
              sub={
                testResult.hits.length === 0
                  ? "Nothing in your sample matched."
                  : "What it matched is below, as the call would carry it."
              }
            >
              <Value tone={testResult.blocked ? "fail" : "pass"}>
                <Num>{testResult.hits.length}</Num>
                {testResult.hits.length === 1 ? " match" : " matches"}
              </Value>
            </Line>
            {testResult.hits.length > 0 ? (
              <div className="mt-mrd-4">
                <Pre>{testResult.text}</Pre>
              </div>
            ) : null}
          </>
        ) : null}
      </Region>

      <Region>
        {saveError ? (
          <ReadFailedLine>{humanWriteError(saveError, GUARDRAIL_WRITE_FAILED)}</ReadFailedLine>
        ) : null}
        {deleteError ? (
          <ReadFailedLine>
            {humanWriteError(deleteError, "That rule was not deleted. It still checks every call.")}
          </ReadFailedLine>
        ) : null}
        <Actions
          trailing={
            rule.id ? (
              <Action
                variant="quiet"
                disabled={deleting || !canWrite}
                title={writeDenied ?? undefined}
                onClick={onDelete}
              >
                Delete this rule
              </Action>
            ) : null
          }
        >
          <Action
            variant="primary"
            disabled={incomplete || saving || !canWrite}
            title={writeDenied ?? undefined}
            onClick={onSave}
          >
            Save
          </Action>
          <Action variant="quiet" onClick={onBack}>
            Back to the rules
          </Action>
        </Actions>
      </Region>
    </>
  );
}
