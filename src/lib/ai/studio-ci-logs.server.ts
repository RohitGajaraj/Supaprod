/**
 * SEAM-2 (mission 3.6): the diagnose half of the CI self-correction loop.
 *
 * `github.ci.read` returns 240-char check summaries, which is enough to see
 * THAT CI is red but not WHY. This helper fetches the failing check runs with
 * their full output detail plus, for GitHub-Actions-backed checks, the tail of
 * the actual job log (the failure is at the end). Consumed by the `ci.logs`
 * agent tool and the ci-poll tick's autonomous fix dispatch.
 *
 * Fail-safe by contract: log retrieval is best-effort per check; a fetch
 * failure degrades that check to its output summary, never throws the whole
 * detail read away.
 */
import { overallFromChecks, type CiOverall } from "@/lib/ai/studio-ci";

export interface FailingCheckDetail {
  name: string;
  conclusion: string;
  summary: string | null;
  logTail: string | null;
}

export interface FailingCiDetail {
  overall: CiOverall;
  headSha: string;
  failing: FailingCheckDetail[];
  /** One compact text block for prompts, hard-capped. */
  rendered: string;
}

const FAILING = new Set(["failure", "timed_out", "action_required", "cancelled"]);
const PER_CHECK_OUTPUT_CAP = 1500;
const PER_CHECK_LOG_TAIL = 3000;
const RENDER_CAP_DEFAULT = 6000;

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "supaprod-builder",
  };
}

/** Strip ANSI escapes and timestamps so log tails read clean in a prompt. */
export function cleanLogTail(raw: string, cap: number = PER_CHECK_LOG_TAIL): string {
  const noAnsi = raw.replace(/\[[0-9;]*m/g, "");
  const noStamps = noAnsi.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s?/gm, "");
  const trimmed = noStamps.trimEnd();
  return trimmed.length <= cap ? trimmed : trimmed.slice(trimmed.length - cap);
}

/** PURE. Render the failing detail as one compact prompt block. */
export function renderFailingDetail(
  failing: FailingCheckDetail[],
  cap: number = RENDER_CAP_DEFAULT,
): string {
  const parts: string[] = [];
  for (const f of failing) {
    const seg = [
      `CHECK: ${f.name} (${f.conclusion})`,
      f.summary ? `OUTPUT: ${f.summary}` : null,
      f.logTail ? `LOG TAIL:\n${f.logTail}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    parts.push(seg);
  }
  const joined = parts.join("\n\n---\n\n");
  return joined.length <= cap ? joined : joined.slice(0, cap) + "\n[truncated]";
}

export async function fetchFailingCiDetail(args: {
  token: string;
  repo: string;
  headSha: string;
  capChars?: number;
}): Promise<FailingCiDetail> {
  const headers = ghHeaders(args.token);
  const [checksRes, statusRes] = await Promise.all([
    fetch(
      `https://api.github.com/repos/${args.repo}/commits/${args.headSha}/check-runs?per_page=50`,
      { headers },
    ),
    fetch(`https://api.github.com/repos/${args.repo}/commits/${args.headSha}/status`, { headers }),
  ]);
  if (!checksRes.ok) {
    throw new Error(
      `GitHub check-runs ${checksRes.status}: ${(await checksRes.text()).slice(0, 200)}`,
    );
  }
  const checksJson = (await checksRes.json()) as {
    check_runs?: Array<{
      id: number;
      name: string;
      status: string;
      conclusion: string | null;
      output?: { title?: string | null; summary?: string | null; text?: string | null };
    }>;
  };
  const statusJson = statusRes.ok
    ? ((await statusRes.json()) as {
        statuses?: Array<{ context: string; state: string; description?: string | null }>;
      })
    : { statuses: [] };

  const checkLites = [
    ...(checksJson.check_runs ?? []).map((c) => ({
      status: c.status,
      conclusion: c.conclusion ?? null,
    })),
    ...(statusJson.statuses ?? []).map((s) => ({
      status: s.state === "pending" ? "in_progress" : "completed",
      conclusion: s.state === "pending" ? null : s.state === "success" ? "success" : "failure",
    })),
  ];
  const overall = overallFromChecks(checkLites);

  const failing: FailingCheckDetail[] = [];
  for (const c of checksJson.check_runs ?? []) {
    if (!c.conclusion || !FAILING.has(c.conclusion)) continue;
    const summaryRaw = [c.output?.title, c.output?.summary, c.output?.text]
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .join(", ");
    const summary = summaryRaw ? summaryRaw.slice(0, PER_CHECK_OUTPUT_CAP) : null;
    // Actions-backed check runs share their id with the workflow job, so the
    // job-logs endpoint usually resolves. Best-effort only.
    let logTail: string | null = null;
    try {
      const logRes = await fetch(
        `https://api.github.com/repos/${args.repo}/actions/jobs/${c.id}/logs`,
        { headers, redirect: "follow" },
      );
      if (logRes.ok) {
        const text = await logRes.text();
        if (text.trim()) logTail = cleanLogTail(text);
      }
    } catch {
      logTail = null;
    }
    failing.push({ name: c.name, conclusion: c.conclusion, summary, logTail });
  }
  for (const s of statusJson.statuses ?? []) {
    if (s.state === "pending" || s.state === "success") continue;
    failing.push({
      name: s.context,
      conclusion: s.state,
      summary: s.description ? s.description.slice(0, PER_CHECK_OUTPUT_CAP) : null,
      logTail: null,
    });
  }

  return {
    overall,
    headSha: args.headSha,
    failing,
    rendered: renderFailingDetail(failing, args.capChars ?? RENDER_CAP_DEFAULT),
  };
}
