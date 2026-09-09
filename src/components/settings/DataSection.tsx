/**
 * YOUR DATA. Rebuilt on the primitives 2026-07-29, replacing five stacked
 * cards (DataSubstrateCard, ValueReceiptsCard, DataExportCard,
 * SkillsFileExportCard, SubprocessorsCard) that between them drew five bordered
 * containers, twelve headings and roughly 900px of scroll to answer three
 * questions. All five were also still written against `material-medium`,
 * `mono-label`, `text-copy-13` and `--hairline`, none of which survive in the
 * rebuilt stylesheets, so they were rendering as unstyled text.
 *
 * The three questions, which are now the three Blocks:
 *   1. Where does my data live, and what happens when I delete something.
 *   2. How do I take it out.
 *   3. Who else touches it, and under what terms.
 *
 * KILLED, and what each cost:
 *   - The seven-checkbox "pick what to include" picker on the workspace export.
 *     It called `exportWorkspace({ sections })` and the handler IGNORES the
 *     `sections` argument entirely (projects.functions.ts:408 onward exports
 *     every table unconditionally). It was a control that could not do the
 *     thing it drew, which is the same defect the per-agent on/off switch was
 *     killed for. The export now says plainly that it takes everything.
 *   - Four of the five card shells and their headings. One bordered container
 *     per region; a rule divides sections.
 *   - The "Ownership" paragraph that followed a paragraph already saying the
 *     data is yours. Ban 10: say it once.
 *   - The value-receipts stat pair as its own card. Two counts do not need a
 *     panel; they say what is IN the export, so they say it on the export's own
 *     line, which is also the only reason they belong on this surface at all.
 *   - The Database and FileCode icons. Ban 8, and neither told you anything the
 *     label did not.
 *
 * MOUNTED BY _authenticated.settings.tsx ONLY (the data section at :683). An
 * older revision of this header claimed a second mount in Engine Room Quality;
 * R015 measured it and the second mount exists in no file. Owned by LANE 1
 * since R015.
 */
import { useState } from "react";
import { humanWriteError } from "@/lib/roles.functions";
import { Row, Line } from "@/components/meridian/rows";
import {
  Num,
  Action,
  NothingYet,
  PageHeading,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { Link } from "@tanstack/react-router";
import { ACTION_LINK_FACE } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { getLedgerSeal } from "@/lib/trust-ledger.functions";
import { shortHead } from "@/lib/trust-verify";
import { getValueReceipts } from "@/lib/value-receipts.functions";
import { exportWorkspace, listExportLog } from "@/lib/projects.functions";
import { exportSkillsFile } from "@/lib/skills-export.functions";
import { getSubprocessors, type SubProcessor } from "@/lib/compliance.functions";

const CATEGORY_LABEL: Record<SubProcessor["category"], string> = {
  ai_gateway: "AI gateway",
  ai_model_provider: "AI model provider",
  infrastructure: "Infrastructure",
};

/** What happens when you tidy up. Three tiers, and the difference between them
 *  is the whole point: deleting a build does not un-teach what it taught. */
const TIERS: { label: string; body: string }[] = [
  {
    label: "Archive",
    body: "Hides a build from your list and nothing else. Fully reversible, and it keeps everything the build taught the brain.",
  },
  {
    label: "Delete",
    body: "Removes a build's working files and its log. What it taught the brain stays, the way a decision outlives the meeting that produced it.",
  },
  {
    label: "Forget",
    body: "Removes something from the brain itself. A deliberate, warned step of its own, never a side effect of tidying up.",
  },
];

const TERMS = [
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/updates", label: "Changelog" },
];

function download(filename: string, body: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataSection({ workspaceId }: { workspaceId?: string }) {
  const qc = useQueryClient();
  const fSeal = useServerFn(getLedgerSeal);
  const fReceipts = useServerFn(getValueReceipts);
  const fExport = useServerFn(exportWorkspace);
  const fSkills = useServerFn(exportSkillsFile);
  const fLog = useServerFn(listExportLog);
  const fSubprocessors = useServerFn(getSubprocessors);

  const seal = useQuery({ queryKey: ["ledger-seal"], queryFn: () => fSeal({ data: {} }) });
  const receipts = useQuery({ queryKey: ["value-receipts"], queryFn: () => fReceipts() });
  /*
   * ── THE EXPORT WROTE SCOPED AND THE HISTORY READ UNSCOPED ────────────────
   *
   * One component, both halves. The export button below sends
   * `workspaceId ? { workspaceId } : {}` and takes rows from this workspace;
   * this list sent `{}` and `listExportLog` filters only when given one, so the
   * history under a scoped export was every workspace's.
   *
   * It is the shape S1 found on /outcomes -- a headline over one population and
   * a list over another -- and it survives review the same way: the code that
   * would be wrong is code nobody wrote. Nobody decided to show every
   * workspace's exports; the argument was simply never passed, and an omission
   * has no diff to read.
   *
   * MEASURED BEFORE FIXING, because the size of a thing decides how much of it
   * to write: `export_log` holds 2 rows across 2 workspaces and 2 users, and
   * this read runs as the person, so RLS already keeps it to their own. So the
   * live blast radius today is one row for one account. The shape is still
   * wrong and the fix is one argument.
   *
   * THE KEY CARRIES THE WORKSPACE TOO. Without it, switching workspace serves
   * the previous one's history from cache -- the same defect a beat later, and
   * the one that outlives the filter because nothing about it looks unscoped.
   */
  const history = useQuery({
    queryKey: ["export-log", workspaceId ?? null],
    queryFn: () => fLog({ data: workspaceId ? { workspaceId } : {} }),
  });
  const subs = useQuery({
    queryKey: ["subprocessors"],
    queryFn: () => fSubprocessors({ data: {} }),
  });

  /*
   * `exporting`, NOT `busy`, AND THE RENAME IS HALF THE FIX.
   *
   * This is a DISCRIMINANT naming which of the two exports is running, not a
   * boolean. Called `busy` it read as one, which is how both controls ended up
   * on `disabled={busy !== null}`: exporting the workspace disabled the agents
   * button too, for a reason that has nothing to do with it. The labels below
   * always distinguished correctly, so the agents button sat there reading
   * "Download" while being unavailable.
   *
   * It also collided with the `busy` PROP that `Action` gained on 2026-08-21,
   * where `busy` is a boolean meaning this control's own work is running. Two
   * different `busy` of two different types, one passed to the other, is a
   * lookup on every read.
   */
  const [exporting, setExporting] = useState<"workspace" | "agents" | null>(null);

  async function onExportWorkspace() {
    setExporting("workspace");
    try {
      const data = await fExport({ data: workspaceId ? { workspaceId } : {} });
      const stamp = new Date().toISOString().slice(0, 10);
      download(
        `supaprod-workspace-export-${stamp}.json`,
        JSON.stringify(data, null, 2),
        "application/json",
      );
      const total = Object.values(data.counts ?? {}).reduce((a, b) => a + b, 0);
      toast.success(`Exported ${total} records`);
      qc.invalidateQueries({ queryKey: ["export-log"] });
    } catch (e) {
      toast.error(humanWriteError(e, "Export failed."));
    } finally {
      setExporting(null);
    }
  }

  async function onExportAgentContext() {
    setExporting("agents");
    try {
      const { markdown, counts } = await fSkills();
      const stamp = new Date().toISOString().slice(0, 10);
      download(`supaprod-agent-context-${stamp}.md`, markdown, "text/markdown");
      toast.success(
        `Exported ${counts.decisions} decisions, ${counts.outcomes} outcomes, ${counts.houseRules} house rules`,
      );
    } catch (e) {
      toast.error(humanWriteError(e, "Export failed."));
    } finally {
      setExporting(null);
    }
  }

  const sealData = seal.data;
  const hasSeal = !!sealData?.available && !!sealData.head && sealData.count > 0;
  const exports = history.data?.exports ?? [];
  const items = subs.data?.subprocessors ?? [];
  const closed = receipts.data;

  return (
    <>
      <PageHeading
        title="Your data"
        sub={
          hasSeal && sealData
            ? `Sealed at ${shortHead(sealData.head)}, over ${sealData.count} ${sealData.count === 1 ? "record" : "records"}.`
            : "Where it sits, who else touches it, and how to take it out."
        }
      />

      <Region title="Where it lives">
        <Line
          label="A Postgres database of your own"
          sub="With pgvector for the brain's semantic search. Not a shared model and not a black box: it is queryable, exportable, and yours to take."
        />
        <Line
          label="Nobody trains on it"
          sub="Supaprod does not train shared models on your workspace and does not sell it."
        />
        {hasSeal && sealData ? (
          <Line
            label="Integrity seal"
            // A real fingerprint over real records, never a decorative badge.
            sub={
              <>
                A SHA-256 fingerprint over <Num>{sealData.count}</Num> decisions and outcomes, so
                you can prove later that the record was not altered. Currently{" "}
                <Num>{shortHead(sealData.head)}</Num>.
              </>
            }
          >
            <Link to="/engine-room" search={{ room: "record" }} className={ACTION_LINK_FACE.quiet}>
              Open the record
            </Link>
          </Line>
        ) : null}
      </Region>

      <Region
        title="What archive, delete and forget each mean"
        sub="They are three different things, and the difference is what happens to the brain."
      >
        {TIERS.map((t) => (
          <Line key={t.label} label={t.label} sub={t.body} />
        ))}
      </Region>

      <Region title="Take it with you">
        {/*
         * "THE WHOLE WORKSPACE" WAS A COMPLETENESS CLAIM THE FILE DOES NOT KEEP.
         *
         * `exportWorkspace` (`projects.functions.ts:415`) returns sixteen named
         * collections. The database has **174 tables in `public`**. Most of the
         * remainder is machinery nobody would expect in an export, and one part
         * of it is not: **`agent_approvals` (326 rows) and `guardrail_hits`
         * (8,535 rows) are absent**, which is every boundary call a person
         * answered and every rule that stopped an agent. That is the audit
         * trail, and it is the first thing an enterprise buyer asks to take with
         * them. Measured 2026-08-31.
         *
         * SO THE LABEL CHANGED AND THE LIST DID NOT. The enumeration underneath
         * was always accurate about what is in the file; the heading above it
         * promised totality the enumeration never claimed, which is the same
         * shape as the notifications page in U-S3-021 and the concurrency cap in
         * U-S3-026: a true detail under a false headline.
         *
         * "NO SELECTION, NO LOCK-IN" IS KEPT, because it is true and it is a
         * different claim. It means we hold nothing back to keep you here, and
         * the file is open JSON. It was only misread as completeness because it
         * sat under a heading that promised it.
         *
         * NOT WRITTEN AS A PERMANENT LIMIT. The gap is filed as
         * `coordination/requests/S3/the-export-is-not-the-audit-trail.md`; when
         * S0 widens the export this sentence comes out in that commit.
         *
         * ONE THING DELIBERATELY NOT SAID HERE. Three of the sixteen collections
         * are read `.eq("user_id", ...)` while the block's own comment says
         * workspace-scoped, so in a multi-member workspace a member's export
         * silently omits their colleagues' rows. That is a defect with a fix,
         * not a property of the product, and putting it on the surface would
         * enshrine it. It is the FIRST item in the request above, and if S0
         * rules it stays, this copy has to say so.
         */}
        {/*
          A ZERO IS NOT A RECEIPT (P-33, 2026-09-03). `getValueReceipts` answers
          a workspace that has done nothing with an object of two zeros, and an
          object of zeros is TRUTHY. So the fallback
          sentence written for exactly this case was unreachable, and a
          first-time reader was told their export includes the zero decisions
          closed and zero pull requests shipped here: two counts offered as
          evidence of value by a product that has not done anything for them yet.
          The numbers appear the moment either one is real.

          THIS COMMENT IS IN THE JSX FORM ON PURPOSE. A bare block comment
          placed just inside the sub prop breaks this surface's own guard: its
          stripper matches an opening brace, then a comment, then a closing
          brace, non-greedily. An opening brace that is not immediately closed
          lets that match run to a brace far below, silently deleting the whole
          region the assertions read. Caught by the suite; written down here so
          the next person does not have to re-find it.

          And the reason this paragraph avoids naming those characters: a
          comment that spells the JSX comment terminator ENDS ITSELF at that
          point, and everything after it becomes markup. That is a second bug
          this same edit shipped and the typechecker caught.
        */}
        <Line
          label="Your work and its record, as one JSON file"
          sub={
            closed && (closed.decisionsClosed > 0 || closed.prsShipped > 0) ? (
              <>
                Every product, signal, opportunity, decision, spec, task, outcome and lesson,
                including the <Num>{closed.decisionsClosed}</Num> decisions closed and{" "}
                <Num>{closed.prsShipped}</Num> pull requests shipped here. No selection, no lock-in.
                It does not yet carry the approvals people answered or the rules that stopped an
                agent, so it is not the full audit trail.
              </>
            ) : (
              "Every product, signal, opportunity, decision, spec, task, outcome and lesson. No selection, no lock-in. It does not yet carry the approvals people answered or the rules that stopped an agent, so it is not the full audit trail."
            )
          }
        >
          {/* TWO DIFFERENT FACTS, SAID SEPARATELY. `disabled` is "only one
              export at a time", which is true of both buttons whichever is
              running. `busy` is "this one is working", which is true of exactly
              one. Collapsing them told a screen reader the agents export was
              unavailable and never why. */}
          <Action
            disabled={exporting !== null}
            busy={exporting === "workspace"}
            onClick={onExportWorkspace}
          >
            {exporting === "workspace" ? "Preparing" : "Download"}
          </Action>
        </Line>

        <Line
          label="The same record, written for another agent"
          sub="Decisions, outcomes and standing house rules as one markdown file. Mount it into Claude Code, Codex or any coding fleet and your other tools inherit what Supaprod already knows."
        >
          <Action
            disabled={exporting !== null}
            busy={exporting === "agents"}
            onClick={onExportAgentContext}
          >
            {exporting === "agents" ? "Preparing" : "Download"}
          </Action>
        </Line>
      </Region>

      <Region title="What you have taken out before">
        {history.isLoading ? (
          <Reading>Reading your exports.</Reading>
        ) : history.isError ? (
          <ReadFailedLine error={history.error} onRetry={() => void history.refetch()}>
            The export history did not load.
          </ReadFailedLine>
        ) : exports.length === 0 ? (
          <NothingYet>
            Nothing exported yet. The two buttons above are the whole escape hatch.
          </NothingYet>
        ) : (
          exports.slice(0, 6).map((e) => (
            <Row
              key={e.id}
              tight
              lead={e.kind === "workspace" ? "Workspace export" : "Product export"}
              sub={
                <>
                  <Num>{e.row_count}</Num> records
                </>
              }
              time={new Date(e.created_at).toLocaleDateString()}
            />
          ))
        )}
      </Region>

      <Region
        title="Who else touches it"
        sub="A provider is listed only while your data actually flows to it."
      >
        {subs.isLoading ? (
          <Reading>Reading the list.</Reading>
        ) : subs.isError ? (
          <ReadFailedLine error={subs.error} onRetry={() => void subs.refetch()}>
            The list did not load.
          </ReadFailedLine>
        ) : items.length === 0 ? (
          <NothingYet>Nothing outside Supaprod processes your data right now.</NothingYet>
        ) : (
          items.map((s) => (
            <Row
              key={s.id}
              tight
              lead={s.name}
              // One second line, and it is different information from the name:
              // what this one does, and exactly what reaches it. The category
              // leads it because that is how a procurement reviewer scans.
              sub={`${CATEGORY_LABEL[s.category]} · ${s.purpose} Receives ${s.dataCategories.join(", ")}.`}
            />
          ))
        )}
      </Region>

      {/* MOVED here from Profile: the trust documents belong beside the
          sub-processor list and the export, not beside your display name.

          The row gap was `--sp-space-5`, 20px. Meridian's ramp steps 16px then
          24px, so there is no 20: taking `--mrd-s6` because the design ratchet
          forbids shrinking a surface to answer a port. */}
      <Region title="The terms this runs under">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--mrd-s6)" }}>
          {[...TERMS, { href: "/subprocessors", label: "Public sub-processor disclosure" }].map(
            (l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "var(--mrd-t-base)", color: "var(--mrd-mute)" }}
              >
                {l.label}
              </a>
            ),
          )}
        </div>
      </Region>
    </>
  );
}
