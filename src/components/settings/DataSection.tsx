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
 */
import { useState } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { getLedgerSeal } from "@/lib/trust-ledger.functions";
import { shortHead } from "@/lib/trust-verify";
import { getValueReceipts } from "@/lib/value-receipts.functions";
import { exportWorkspace, listExportLog } from "@/lib/projects.functions";
import { exportSkillsFile } from "@/lib/skills-export.functions";
import { getSubprocessors, type SubProcessor } from "@/lib/compliance.functions";
import { Block, Button, Empty, Failed, Line, Loading, PageHead, Row } from "@/components/shell/primitives";

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
  const history = useQuery({ queryKey: ["export-log"], queryFn: () => fLog({ data: {} }) });
  const subs = useQuery({
    queryKey: ["subprocessors"],
    queryFn: () => fSubprocessors({ data: {} }),
  });

  const [busy, setBusy] = useState<"workspace" | "agents" | null>(null);

  async function onExportWorkspace() {
    setBusy("workspace");
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
      toast.error((e as Error)?.message ?? "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function onExportAgentContext() {
    setBusy("agents");
    try {
      const { markdown, counts } = await fSkills();
      const stamp = new Date().toISOString().slice(0, 10);
      download(`supaprod-agent-context-${stamp}.md`, markdown, "text/markdown");
      toast.success(
        `Exported ${counts.decisions} decisions, ${counts.outcomes} outcomes, ${counts.houseRules} house rules`,
      );
    } catch (e) {
      toast.error((e as Error)?.message ?? "Export failed");
    } finally {
      setBusy(null);
    }
  }

  const sealData = seal.data;
  const hasSeal = !!sealData?.available && !!sealData.head && sealData.count > 0;
  const exports = history.data?.exports ?? [];
  const items = subs.data?.subprocessors ?? [];
  const closed = receipts.data;

  return (
    <>
      <PageHead
        title="Your data"
        sub={
          hasSeal && sealData
            ? `Sealed at ${shortHead(sealData.head)}, over ${sealData.count} ${sealData.count === 1 ? "record" : "records"}.`
            : "Where it sits, who else touches it, and how to take it out."
        }
      />

      <Block title="Where it lives">
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
            <Link
              to="/engine-room"
              search={{ room: "record" }}
              className="sp-btn"
              data-variant="ghost"
            >
              Open the record
            </Link>
          </Line>
        ) : null}
      </Block>

      <Block
        title="What archive, delete and forget each mean"
        sub="They are three different things, and the difference is what happens to the brain."
      >
        {TIERS.map((t) => (
          <Line key={t.label} label={t.label} sub={t.body} />
        ))}
      </Block>

      <Block title="Take it with you">
        <Line
          label="The whole workspace, as one JSON file"
          sub={
            closed ? (
              <>
                Every product, signal, opportunity, decision, spec, task, outcome and lesson,
                including the <Num>{closed.decisionsClosed}</Num> decisions closed and{" "}
                <Num>{closed.prsShipped}</Num> pull requests shipped here. No selection, no lock-in.
              </>
            ) : (
              "Every product, signal, opportunity, decision, spec, task, outcome and lesson. No selection, no lock-in."
            )
          }
        >
          <Button disabled={busy !== null} onClick={onExportWorkspace}>
            {busy === "workspace" ? "Preparing" : "Download"}
          </Button>
        </Line>

        <Line
          label="The same record, written for another agent"
          sub="Decisions, outcomes and standing house rules as one markdown file. Mount it into Claude Code, Codex or any coding fleet and your other tools inherit what Supaprod already knows."
        >
          <Button disabled={busy !== null} onClick={onExportAgentContext}>
            {busy === "agents" ? "Preparing" : "Download"}
          </Button>
        </Line>
      </Block>

      <Block title="What you have taken out before">
        {history.isLoading ? (
          <Loading>Reading your exports.</Loading>
        ) : history.isError ? (
          <Failed onRetry={() => void history.refetch()}>
            The export history did not load.{" "}
            {(history.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : exports.length === 0 ? (
          <Empty>Nothing exported yet. The two buttons above are the whole escape hatch.</Empty>
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
      </Block>

      <Block
        title="Who else touches it"
        sub="A provider is listed only while your data actually flows to it."
      >
        {subs.isLoading ? (
          <Loading>Reading the list.</Loading>
        ) : subs.isError ? (
          <Failed onRetry={() => void subs.refetch()}>
            The list did not load. {(subs.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : items.length === 0 ? (
          <Empty>Nothing outside Supaprod processes your data right now.</Empty>
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
      </Block>

      {/* MOVED here from Profile: the trust documents belong beside the
          sub-processor list and the export, not beside your display name. */}
      <Block title="The terms this runs under">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-space-5)" }}>
          {[...TERMS, { href: "/subprocessors", label: "Public sub-processor disclosure" }].map(
            (l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}
              >
                {l.label}
              </a>
            ),
          )}
        </div>
      </Block>
    </>
  );
}
