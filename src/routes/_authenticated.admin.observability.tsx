/**
 * ADMIN / HEALTH. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The person who suspects the machine quietly stopped doing something. They
 *    did not come to read a ledger; they came to find out what stopped, when it
 *    last worked, and whether anyone is watching.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Catching a SILENT failure. Loud failures announce themselves in an error;
 *    the ones that cost this product real time were jobs that simply stopped
 *    ticking and told nobody. Anything on this page that does not help spot a
 *    silence is furniture.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    ADD   the cron watchdog, and this is the whole point of the pass. The
 *          server function has computed `cronHealth` (expected-vs-actual per
 *          scheduled job, stale first) since SW-6, and NO SURFACE RENDERED IT.
 *          The one read that answers "is it still running" was being fetched on
 *          every page load and thrown away, which is why it now leads.
 *    ADD   the error message on a failed job. `error_message` was selected by
 *          the server function and never displayed, so a failed job showed a
 *          type name with no cause. Half a report is not a report.
 *    KEEP  the master gate, as one Line with a switch. It is a boundary you set
 *          in advance, and the governance canon is explicit that a boundary is a
 *          sentence with a control at the end of it, not a card demanding
 *          attention.
 *    KEEP  the three vendor rows and the agent failure breakdown.
 *    KILL  the fifty-row, five-column job ledger inside `overflow-x: auto`. A
 *          list of jobs that succeeded is not information, and horizontal
 *          scrolling was named as a pain point twice. What remains is the runs
 *          that FAILED, plus the watchdog, which answers "did it run at all"
 *          better than any ledger of what did.
 *    KILL  the verdict card and its mono strip. The strip restated the sentence
 *          above it in a second register ("GATE ON, SOURCES 2/3, FAILURES 4"),
 *          which is hard ban 10 exactly. Each block now states its own verdict
 *          as its title, so the page reads as three answers rather than a
 *          headline and three tables.
 *    KILL  five bordered cards (one bordered container per region, ban 5) and
 *          the local Card / CardTitle / CardDescription / Th components, which
 *          were a private copy of a system that now exists.
 *    KILL  "Set by an engineer in the app's hosting settings. The engineering
 *          runbook covers the details." It described where to go and then did
 *          not go there.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    The twenty-odd jobs that are running fine. They collapse to one count, and
 *    the block opens the full list on demand. A surface that only grows is not
 *    designed, and twenty-six healthy rows is growth with no information in it.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The moment is the first line: "Every scheduled job is running", earned from
 *    twenty-six real reads rather than asserted. Its opposite is the same line
 *    naming the three that stopped and how long ago, which is a real incident
 *    caught by a page rather than by a customer.
 *    The confusion this surface must keep refusing: a failed read wearing a
 *    healthy verdict's clothes. A read that did not complete renders Failed with
 *    a retry and never an empty state, because "nothing failed" and "we could
 *    not find out" are different facts and you act differently on each.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    As the thing that failed, and only there. The agent-failure breakdown is
 *    the crew's own record of where it broke, which is the most honest form of
 *    presence a health page can offer: the labour was real enough to fail.
 *    NO MARKS ARE DRAWN, and that is a limitation stated rather than papered
 *    over: getObservabilityStatus selects only `failure_kind` from agent_runs,
 *    so this read genuinely does not know WHICH agent failed. Drawing a mark
 *    would be inventing an attribution, and the block says the count is by kind
 *    for that reason. Attribution needs a column this lane must not add.
 *
 * 7. FEATURE LIVENESS, ADDED 2026-08-02, AND WHY IT LEADS THE PAGE.
 *    In one session five separately shipped features were found to be doing
 *    nothing in production. A column read by a search and written by nothing. A
 *    theme matcher that could never match. A graph that could not open the
 *    second commonest thing in it. Human-curated memories that recall could not
 *    reach. A feedback widget whose every insert failed a CHECK constraint. All
 *    five passed typecheck and tests. All five had a plausible commit message.
 *
 *    This page already answered "is the machine ticking". It could not answer
 *    "is the machine ticking over anything", and that is the question that cost
 *    the day. So liveness goes ABOVE the cron watchdog rather than below it: a
 *    job that runs every fifteen minutes and achieves nothing is a worse
 *    finding than a job that stopped, because the stopped one at least looks
 *    wrong. Two blocks, both silent when there is nothing to say.
 *
 *    The page is now composed rather than written straight through, so a failed
 *    health read no longer takes liveness down with it. They are two reads and
 *    two verdicts, and one failing must not blank the other.
 *
 * 8. GATE PRESSURE, ADDED 2026-08-02 WITH AFD-04.
 *    Liveness answers "is this executing". The block below answers the next
 *    question, and it is the one the governance canon needs an answer to before
 *    it can offer to remove a gate: when the machine DOES execute, what stops
 *    it. Every refusal at the AI chokepoint already wrote a row; the reason was
 *    prose in error_message and the typed column beside it (error_code, in the
 *    schema since the first migration) was blank on every row ever written.
 *    It is filled now, so this is a GROUP BY and not a text search.
 *    It sits BELOW what failed, not above it, on purpose. A gate firing is the
 *    product working: a cap held, a kill switch held, a guardrail held. It is
 *    only news in aggregate, when one gate is doing all the stopping, which is
 *    a policy set wrong rather than a thing that broke.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import {
  getObservabilityStatus,
  adminSetObservabilityEnabled,
} from "@/lib/observability.functions";
import { getLivenessReport } from "@/lib/liveness.functions";
import { getEmailHealth, sendTestEmail } from "@/lib/email-health.functions";
import type { CapabilityReport, IntegrityReport, VocabularyReport } from "@/lib/liveness/report";
import {
  Action,
  NothingHere,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";

export const Route = createFileRoute("/_authenticated/admin/observability")({
  component: AdminObservability,
});

/**
 * Two reads, two verdicts, neither able to blank the other. Liveness first,
 * because "this feature has never executed" outranks "this job is late".
 */
function AdminObservability() {
  /* THE RHYTHM MOVED HERE WITH THE PORT, and it is not decoration. `.sp-block`
     baked in a 36px top margin and a hairline rule, so nine sections spaced
     themselves. `Region` sets no outer margin on purpose, which means a straight
     swap would have stacked all nine flush against each other. `gap-mrd-6` is
     the step every ported surface uses between regions. */
  return (
    <div data-mrd="" className="flex flex-col gap-mrd-6">
      <EmailHealth />
      <FeatureLiveness />
      <MachineHealth />
    </div>
  );
}

/** How long since it last ran, in the coarsest unit that is still true. */
function ago(minutes: number | null): string {
  if (minutes === null) return "never";
  if (minutes < 2) return "just now";
  if (minutes < 90) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function whenText(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 16).replace("T", " ") : d.toLocaleString();
}

/**
 * The stored code, said the way the person who set the boundary would say it.
 * Anything unmapped falls back to the code with its underscores opened out, so
 * a new code added at the chokepoint shows up here readable on the first run
 * rather than waiting for somebody to remember this list.
 */
const GATE_WORD: Record<string, string> = {
  gate_kill_switch: "The kill switch",
  gate_mission_token_cap: "The mission token ceiling",
  gate_mission_spend_cap: "The mission spend ceiling",
  gate_credit_exhausted: "An empty credit pool",
  gate_credit_cap: "A credit cap for this cycle",
  gate_ambient_downgrade: "Background work dropped to the free model",
  gate_guardrail_block: "A guardrail rule",
};

function gateName(code: string): string {
  return GATE_WORD[code] ?? code.replace(/^gate_/, "").replaceAll("_", " ");
}

/** What a gate firing means, so a count is never left to be guessed at. */
const GATE_MEANING: Record<string, string> = {
  gate_kill_switch: "Someone paused the system or a workspace, and calls stopped there",
  gate_mission_token_cap: "A mission reached the token ceiling it was given",
  gate_mission_spend_cap: "A mission reached the spend ceiling it was given",
  gate_credit_exhausted: "The account had no credits left to cover the call",
  gate_credit_cap: "A per-product or per-user cap for this cycle was already used up",
  gate_ambient_downgrade: "Self-started background work ran on the free model instead of stopping",
  gate_guardrail_block: "A safety rule blocked what the model produced",
};

/* ------------------------------------------------------------------ *
 * Feature liveness
 * ------------------------------------------------------------------ */

/** The word a verdict wears in a row. Plain, and never a colour on its own. */
const CAPABILITY_WORD: Record<CapabilityReport["verdict"], string | null> = {
  dead: "doing nothing",
  quiet: "quiet",
  unknown: "could not check",
  healthy: null,
};

const INTEGRITY_WORD: Record<IntegrityReport["verdict"], string | null> = {
  broken: "never written",
  degraded: "incomplete",
  unknown: "could not check",
  clean: null,
};

const VOCABULARY_WORD: Record<VocabularyReport["verdict"], string | null> = {
  drifted: "disagrees with the database",
  unknown: "could not check",
  aligned: null,
};

/** How often it is meant to run, said the way an operator would say it. */
const CADENCE_WORD: Record<CapabilityReport["cadence"], string> = {
  continuous: "Runs continuously",
  daily: "Runs daily",
  weekly: "Runs weekly",
  on_demand: "Runs when someone uses it",
};

function FeatureLiveness() {
  const fLiveness = useServerFn(getLivenessReport);
  const [showEverything, setShowEverything] = useState(false);
  const liveness = useQuery({
    queryKey: ["liveness-report"],
    queryFn: () => fLiveness({ data: {} }),
  });

  if (liveness.isLoading) {
    return (
      <Region title="Checking what is actually executing">
        <Reading>Reading what each tracked feature last did.</Reading>
      </Region>
    );
  }

  if (!liveness.data || "error" in liveness.data) {
    return (
      <Region title="Feature liveness did not load">
        <ReadFailedLine onRetry={() => void liveness.refetch()}>
          Nothing here can be read as clear.{" "}
          {liveness.data && "error" in liveness.data
            ? liveness.data.error
            : liveness.error instanceof Error
              ? liveness.error.message
              : "The read failed."}
        </ReadFailedLine>
      </Region>
    );
  }

  const r = liveness.data;
  const findings = r.capabilities.filter((c) => c.verdict !== "healthy");
  const shown = showEverything ? r.capabilities : findings;

  const dataFindings = [
    ...r.integrity.filter((c) => c.verdict !== "clean"),
    ...r.vocabulary.filter((c) => c.verdict !== "aligned"),
  ];
  const dataVerdict =
    dataFindings.length === 0
      ? "Every column a feature reads is actually being written"
      : dataFindings.length === 1
        ? "One thing the code reads is not there"
        : `${dataFindings.length} things the code reads are not there`;

  return (
    <>
      <Region
        title={r.headline}
        sub={
          r.counts.dead > 0
            ? "A capability is dead when it has never executed once, or has not executed in seven of its own cycles. Every line below is a real row count, not a flag someone set."
            : `Each tracked capability names the row it writes when it works, counted over the last ${r.windowDays} days. Nothing here is a usage number: one execution a month is alive, none at all is the finding.`
        }
        toggle={
          r.capabilities.length === 0
            ? undefined
            : showEverything
              ? "Only what is wrong"
              : `Show all ${r.capabilities.length}`
        }
        onToggle={() => setShowEverything((v) => !v)}
        toggled={showEverything}
      >
        {shown.length === 0 ? (
          <NothingHere>
            All {r.capabilities.length} tracked capabilities executed inside their own window. This
            stays empty for as long as every shipped feature is doing something.
          </NothingHere>
        ) : (
          shown.map((c) => {
            const word = CAPABILITY_WORD[c.verdict];
            return (
              <Row
                key={c.id}
                tight
                lead={
                  <>
                    <span>{c.title}</span>
                    {word ? (
                      <Value tone={c.verdict === "quiet" ? "hold" : "fail"}> · {word}</Value>
                    ) : null}
                  </>
                }
                sub={
                  <>
                    {c.reason} {CADENCE_WORD[c.cadence]}. Proof: {c.proof.toLowerCase()}.
                  </>
                }
                time={c.lastAt ? c.lastAt.slice(0, 10) : "never"}
              />
            );
          })
        )}
      </Region>

      <Region
        title={dataVerdict}
        sub="A column that exists, is read by a query, and is written by nothing returns zero rows and returns it correctly, so there is no error anywhere to find. This is the check for that shape, plus the same thing one level up: a value the database holds that no vocabulary in the code declares."
      >
        {dataFindings.length === 0 ? (
          <NothingHere>
            {r.integrity.length + r.vocabulary.length} checks, and every one came back full. Every
            column a feature reads has values in it, and every value the database holds is one the
            code can name.
          </NothingHere>
        ) : (
          <>
            {r.integrity
              .filter((c) => c.verdict !== "clean")
              .map((c) => {
                const word = INTEGRITY_WORD[c.verdict];
                return (
                  <Row
                    key={c.id}
                    tight
                    lead={
                      <>
                        <span>{c.title}</span>
                        {word ? (
                          <Value tone={c.verdict === "degraded" ? "hold" : "fail"}> · {word}</Value>
                        ) : null}
                      </>
                    }
                    sub={
                      <>
                        {c.reason} Read by {c.readBy}.
                      </>
                    }
                  />
                );
              })}
            {r.vocabulary
              .filter((c) => c.verdict !== "aligned")
              .map((c) => {
                const word = VOCABULARY_WORD[c.verdict];
                return (
                  <Row
                    key={c.id}
                    tight
                    lead={
                      <>
                        <span>{c.title}</span>
                        {word ? <Value tone="fail"> · {word}</Value> : null}
                      </>
                    }
                    sub={
                      <>
                        {c.reason} Declared in {c.declaredBy}.
                      </>
                    }
                  />
                );
              })}
          </>
        )}
      </Region>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Machine health
 * ------------------------------------------------------------------ */

function MachineHealth() {
  const qc = useQueryClient();
  const fStatus = useServerFn(getObservabilityStatus);
  const fSet = useServerFn(adminSetObservabilityEnabled);
  const [showEveryJob, setShowEveryJob] = useState(false);

  const status = useQuery({ queryKey: ["observability-status"], queryFn: () => fStatus() });
  const setGate = useMutation({
    mutationFn: (enabled: boolean) => fSet({ data: { enabled } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(res.enabled ? "Health signals are being sent." : "Nothing is being sent now.");
      qc.invalidateQueries({ queryKey: ["observability-status"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. The setting did not change."),
  });

  if (status.isLoading) {
    return <Reading>Checking what is still running.</Reading>;
  }
  if (!status.data || "error" in status.data) {
    return (
      <ReadFailedLine onRetry={() => void status.refetch()}>
        Health did not load, so nothing here can be read as clear.{" "}
        {status.data && "error" in status.data
          ? status.data.error
          : status.error instanceof Error
            ? status.error.message
            : "The read failed."}
      </ReadFailedLine>
    );
  }

  const s = status.data;

  // ---- Is it still running -------------------------------------------------
  const stale = s.cronHealth.filter((c) => c.stale);
  const healthy = s.cronHealth.filter((c) => !c.stale);
  const jobsShown = showEveryJob ? s.cronHealth : stale;
  const tickVerdict =
    s.cronHealth.length === 0
      ? "No scheduled jobs are being watched"
      : stale.length === 0
        ? `Every scheduled job is running, all ${s.cronHealth.length} of them`
        : stale.length === 1
          ? "One scheduled job has stopped"
          : `${stale.length} scheduled jobs have stopped`;

  // ---- What failed ---------------------------------------------------------
  const failedJobs = s.recentJobRuns.filter((r) => r.status !== "ok" && r.status !== "running");
  const agentFailures = s.failureBreakdown.reduce((sum, f) => sum + f.count, 0);
  const failVerdict =
    failedJobs.length === 0 && agentFailures === 0
      ? "Nothing has failed"
      : [
          agentFailures > 0
            ? `${agentFailures} agent failure${agentFailures === 1 ? "" : "s"} in the last 7 days`
            : null,
          failedJobs.length > 0
            ? `${failedJobs.length} job error${failedJobs.length === 1 ? "" : "s"} in the last 50 runs`
            : null,
        ]
          .filter(Boolean)
          .join(", ");

  // ---- What stopped work ---------------------------------------------------
  // Refusals the product chose are read separately from calls that simply
  // failed, because you act differently on each: a gate firing a lot is a
  // boundary set wrong, a failure kind repeating is something broken.
  const gatesFired = s.gatePressure.filter((g) => g.isGate);
  const callFailures = s.gatePressure.filter((g) => !g.isGate);
  const gatesTotal = gatesFired.reduce((sum, g) => sum + g.count, 0);
  const topGate = gatesFired[0];
  const gateVerdict =
    s.gatePressure.length === 0
      ? "Nothing has been stopped or refused"
      : gatesTotal === 0
        ? `No work was refused, and ${callFailures.reduce((n, g) => n + g.count, 0)} calls failed on their own`
        : topGate && topGate.count >= gatesTotal * 0.6 && gatesFired.length > 1
          ? `${gateName(topGate.code)} is doing most of the stopping`
          : `${gatesTotal} call${gatesTotal === 1 ? " was" : "s were"} refused in the last 7 days`;

  // ---- Who is watching -----------------------------------------------------
  const vendors = [
    {
      label: "PostHog",
      role: "who used what",
      present: s.vendors.posthog,
      envVar: "POSTHOG_API_KEY",
    },
    { label: "Sentry", role: "crashes", present: s.vendors.sentry, envVar: "SENTRY_DSN" },
    {
      label: "Better Stack",
      role: "is the app up",
      present: s.vendors.betterStack,
      envVar: "BETTER_STACK_HEARTBEAT_URL",
    },
  ];
  const configured = vendors.filter((v) => v.present).length;
  const watchVerdict = !s.gateEnabled
    ? "Nothing is leaving this app"
    : configured === vendors.length
      ? "All three outside tools are receiving signals"
      : configured === 0
        ? "Sending is on, but no outside tool has a key"
        : `${configured} of ${vendors.length} outside tools are receiving signals`;

  return (
    <>
      <Region
        title={tickVerdict}
        sub={
          stale.length === 0
            ? "Every job below reported inside its own window. A job is late, not merely quiet, when it misses two to four of its own cycles."
            : "A late job is a real incident, not scheduler jitter: the window already allows two to four missed cycles before it says so. This is the read that catches a job which stopped without raising an error."
        }
        toggle={
          s.cronHealth.length === 0
            ? undefined
            : showEveryJob
              ? "Only what is late"
              : `Show all ${s.cronHealth.length}`
        }
        onToggle={() => setShowEveryJob((v) => !v)}
        toggled={showEveryJob}
      >
        {jobsShown.length === 0 ? (
          <NothingHere>
            {s.cronHealth.length === 0
              ? "No jobs are expected, so nothing is being watched for silence."
              : `Nothing is late. All ${healthy.length} scheduled jobs reported inside their window.`}
          </NothingHere>
        ) : (
          jobsShown.map((c) => (
            <Row
              key={c.job}
              tight
              lead={
                <>
                  <span style={{ fontFamily: "var(--mrd-mono)" }}>{c.job}</span>
                  {c.stale ? <Value tone="fail"> · late</Value> : null}
                </>
              }
              sub={
                <>
                  Runs {c.supaprod} · last ran {ago(c.ageMinutes)}
                </>
              }
              time={c.lastRunAt ? c.lastRunAt.slice(0, 10) : "never"}
            />
          ))
        )}
      </Region>

      <Region
        title={failVerdict}
        sub="Agent failures are counted by kind, not by agent: this read carries the failure kind and not who was running, so naming an agent here would be an attribution nobody recorded."
      >
        {failedJobs.length === 0 && agentFailures === 0 ? (
          <NothingHere>
            No job errors in the last 50 runs and no agent failures in the last 7 days. This stays
            empty for as long as nothing breaks.
          </NothingHere>
        ) : (
          <>
            {failedJobs.map((r) => (
              <Row
                key={r.id}
                tight
                lead={
                  <>
                    <span style={{ fontFamily: "var(--mrd-mono)" }}>{r.job_name}</span>
                    <Value tone="fail"> · {r.error_kind ?? r.status}</Value>
                  </>
                }
                sub={r.error_message ?? "The job failed without recording a reason."}
                time={whenText(r.started_at)}
              />
            ))}
            {s.failureBreakdown.map((f) => (
              <Row
                key={f.failure_kind}
                tight
                lead={f.failure_kind.replaceAll("_", " ")}
                sub="Agent runs that ended this way in the last 7 days"
                time={String(f.count)}
              />
            ))}
          </>
        )}
      </Region>

      <Region
        title={gateVerdict}
        sub="A gate firing is the product working, so this is only news in aggregate. One boundary doing all the stopping is a policy set wrong, and that is the read this block exists for."
      >
        {s.gatePressure.length === 0 ? (
          <NothingHere>
            No call was refused and none failed in the last 7 days. This stays empty for as long as
            every boundary holds without ever being reached.
          </NothingHere>
        ) : (
          <>
            {gatesFired.map((g) => (
              <Row
                key={g.code}
                tight
                lead={gateName(g.code)}
                sub={
                  <>
                    {GATE_MEANING[g.code] ?? "Work was refused with this code"}
                    {g.lastAt ? ` · last ${whenText(g.lastAt)}` : null}
                  </>
                }
                time={String(g.count)}
              />
            ))}
            {callFailures.map((g) => (
              <Row
                key={g.code}
                tight
                lead={
                  <>
                    {g.code.replaceAll("_", " ")}
                    <Value tone="fail"> · failed</Value>
                  </>
                }
                sub="An AI call that failed on its own rather than being refused"
                time={String(g.count)}
              />
            ))}
          </>
        )}
      </Region>

      <Region
        title={watchVerdict}
        sub="Keys are set once by an engineer in the app's hosting settings. A tool with no key is a blind spot, not a failure."
      >
        <Line
          label="Send health signals to outside tools"
          sub={
            s.gateEnabled
              ? "On. Errors, usage and heartbeats leave this app for the tools below."
              : "Off. Nothing is sent anywhere, even where a key is set."
          }
        >
          <Toggle
            checked={s.gateEnabled}
            disabled={setGate.isPending}
            label="Send health signals to outside tools"
            onChange={(next) => setGate.mutate(next)}
          />
        </Line>
        {vendors.map((v) => (
          <Line
            key={v.label}
            label={v.label}
            sub={
              v.present
                ? `Watching ${v.role}.`
                : `Would watch ${v.role}. Needs ${v.envVar} in the hosting settings.`
            }
          >
            <Value tone={v.present && s.gateEnabled ? "pass" : "quiet"}>
              {!v.present ? "No key" : s.gateEnabled ? "Receiving" : "Idle"}
            </Value>
          </Line>
        ))}
      </Region>
    </>
  );
}

/**
 * Can this product send an email, and if not, at which layer.
 *
 * FIRST ON THE PAGE on purpose. A send path that is silently dead outranks a
 * late background job: the waitlist welcome is the only message a stranger ever
 * gets from us, and on 2026-08-07 it failed to arrive with nothing anywhere able
 * to say why. The four candidate causes sat at four layers and only two of them
 * were visible from outside the running worker.
 *
 * The two questions this answers, which nothing else could:
 *   is RESEND_API_KEY present IN THE DEPLOYED RUNTIME (not in a secret store,
 *   not in a local .env, but in the process actually serving requests), and
 *   what exactly does the vendor say when we try.
 */
function EmailHealth() {
  const fHealth = useServerFn(getEmailHealth);
  const fTest = useServerFn(sendTestEmail);
  const [to, setTo] = useState("");

  const health = useQuery({
    queryKey: ["admin-email-health"],
    queryFn: () => fHealth(),
    staleTime: 30_000,
  });

  const test = useMutation({
    mutationFn: (addr: string) => fTest({ data: { to: addr } }),
    onSuccess: (r) => {
      if (r && "error" in r) return toast.error(r.error);
      // The vendor's own words, not a summary of them. "Resend 403: domain is
      // not verified" and "RESEND_API_KEY absent" need different fixes, and
      // collapsing both into "could not send" is what made this undebuggable.
      if (r?.sent) toast.success(`Sent to ${r.to}. Check the inbox and the spam folder.`);
      else toast.error(r?.reason ?? "Send failed.");
    },
    onError: () => toast.error("The test send did not complete."),
  });

  if (health.isLoading) return <Reading>Checking whether email can send.</Reading>;
  if (!health.data || "error" in health.data) {
    return (
      <ReadFailedLine onRetry={() => void health.refetch()}>
        Could not read the email configuration, so nothing here can be trusted either way.
      </ReadFailedLine>
    );
  }

  const h = health.data;

  return (
    <Region
      title={h.configured ? "Email can send" : "Email cannot send: no API key in this runtime"}
      sub={
        h.configured ? (
          <>
            A key is present and mail will leave as <Value>{h.from}</Value>. That does not prove
            delivery, which is what the test send below is for.
          </>
        ) : (
          <>
            <Value>{h.envVar}</Value> is not set in the deployed runtime, so every send is a silent
            no-op and always has been. A key in a secret store is not the same as a key in the
            process serving requests: it has to reach the Cloudflare Worker, and it only takes
            effect on a deploy that happens after it was added.
          </>
        )
      }
    >
      <Row
        tight
        lead={
          <>
            API key in this runtime <Value>{h.configured ? "present" : "absent"}</Value>
          </>
        }
      />
      <Row
        tight
        lead={
          <>
            From address <Value>{h.from}</Value>
          </>
        }
      />
      {/* The misconfiguration that produced this panel, called out by name.
          RESEND_FROM_EMAIL held the API key and RESEND_API_KEY held nothing,
          which is why no send was ever attempted and why the key appeared on
          this page. Saying "two variables are swapped" is the whole fix; a
          masked field alone would just look like a bug in the panel. */}
      {h.fromWithheld ? (
        <Row
          tight
          lead={
            <>
              <Value>RESEND_FROM_EMAIL</Value> contains something shaped like a credential, and{" "}
              <Value>RESEND_API_KEY</Value> is empty. That is one value in the wrong variable. Move
              it, and treat the old key as compromised: it has been rendered in a browser. Deleting{" "}
              <Value>RESEND_FROM_EMAIL</Value> entirely is safest, since the default sender is
              already correct.
            </>
          }
        />
      ) : null}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="you+test1@gmail.com"
          aria-label="Send a test email to"
          className="input"
          style={{ flex: "1 1 240px", minWidth: 0 }}
        />
        <Action
          disabled={test.isPending || !to.trim()}
          busy={test.isPending}
          onClick={() => test.mutate(to.trim())}
        >
          {test.isPending ? "Sending" : "Send test"}
        </Action>
      </div>
      <p
        className="text-mrd-tiny"
        style={{ color: "var(--mrd-mute)", margin: "8px 0 0", lineHeight: 1.5 }}
      >
        A real send, not a validation call: only a message arriving in an inbox answers the
        question. Gmail plus-addressing gives you unlimited distinct test addresses that all land in
        one inbox, so <Value>you+test1@</Value> and <Value>you+test2@</Value> both work.
      </p>
    </Region>
  );
}
