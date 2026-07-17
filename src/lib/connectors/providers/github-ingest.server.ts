// SEN-01 / SW-5 deliverable C — GitHub signal ingest adapter (server-only).
// Pulls issues (OPEN + closed), releases, star milestones, and traffic from a
// bound GitHub repo and writes them as signals. Idempotent via external_id (the
// partial unique index on signals). Called from sense-tick for any workspace
// with a GitHub binding; rule-based only, zero AI spend. All calls use the
// already-resolved installation token (resolveGitHub); the founder-pasted
// credential is the only thing between this and a live feed.

import { resolveGitHub } from "./github.server";
import { writeSignals } from "@/lib/sources/sink.server";
import { starMilestone } from "./github-signals";
import type { SignalCandidate } from "@/lib/sources/kinds";

const GH_API = "https://api.github.com";
const GH_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "supaprod-connectors",
} as const;

const MAX_ITEMS = 30;

export type IngestResult = {
  inserted: number;
  skipped: number;
  source: string;
};

/** One normalized GitHub signal, pre-sink. */
type GhSignal = {
  externalId: string;
  title: string;
  content: string;
  url: string;
  source: string;
  tags?: string[];
};

async function ghFetch(token: string, path: string): Promise<Response> {
  return fetch(`${GH_API}${path}`, {
    headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` },
  });
}

/** Issues (OPEN + closed) as signals. A NEW open issue is the DONE-WHEN trigger,
 * so state must be `all`, not `closed`. Labels ride through as tags. */
async function fetchIssueSignals(token: string, repo: string): Promise<GhSignal[]> {
  const res = await ghFetch(
    token,
    `/repos/${repo}/issues?state=all&per_page=${MAX_ITEMS}&sort=updated&direction=desc`,
  );
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{
    number: number;
    title?: string;
    body?: string;
    html_url?: string;
    state?: string;
    labels?: Array<{ name?: string }>;
    pull_request?: unknown;
  }>;
  return items
    .filter((i) => !i.pull_request) // exclude PRs (they also appear in /issues)
    .map((i) => {
      const labels = (i.labels ?? []).map((l) => l.name).filter((n): n is string => Boolean(n));
      return {
        externalId: `github:issue:${repo}:${i.number}`,
        title: (i.title ?? "").slice(0, 300),
        content: [(i.title ?? "").slice(0, 300), (i.body ?? "").slice(0, 1200)]
          .filter(Boolean)
          .join("\n\n"),
        url: i.html_url ?? `https://github.com/${repo}/issues/${i.number}`,
        source: "github",
        tags: ["issue", `state:${i.state ?? "open"}`, ...labels],
      };
    });
}

/** Recent push events (commit messages as signals). */
async function fetchPushSignals(token: string, repo: string): Promise<GhSignal[]> {
  const res = await ghFetch(token, `/repos/${repo}/events?per_page=30`);
  if (!res.ok) return [];
  const events = (await res.json()) as Array<{
    type?: string;
    payload?: { commits?: Array<{ sha?: string; message?: string }> };
  }>;
  const signals: GhSignal[] = [];
  for (const ev of events) {
    if (ev.type !== "PushEvent") continue;
    for (const commit of ev.payload?.commits ?? []) {
      if (!commit.sha) continue;
      const msg = (commit.message ?? "").trim();
      const title = msg.split("\n")[0].slice(0, 300);
      if (!title) continue;
      signals.push({
        externalId: `github:commit:${repo}:${commit.sha}`,
        title,
        content: msg.slice(0, 1200),
        url: `https://github.com/${repo}/commit/${commit.sha}`,
        source: "github",
        tags: ["commit"],
      });
      if (signals.length >= MAX_ITEMS) break;
    }
    if (signals.length >= MAX_ITEMS) break;
  }
  return signals;
}

/** Published releases as signals (spec: "release" signals). */
async function fetchReleaseSignals(token: string, repo: string): Promise<GhSignal[]> {
  const res = await ghFetch(token, `/repos/${repo}/releases?per_page=10`);
  if (!res.ok) return [];
  const releases = (await res.json()) as Array<{
    id: number;
    name?: string;
    tag_name?: string;
    body?: string;
    html_url?: string;
    prerelease?: boolean;
    draft?: boolean;
  }>;
  return releases
    .filter((r) => !r.draft)
    .map((r) => {
      const label = r.name || r.tag_name || `release ${r.id}`;
      return {
        externalId: `github:release:${repo}:${r.id}`,
        title: `Released ${label}`.slice(0, 300),
        content: [`Release ${label} of ${repo}`, (r.body ?? "").slice(0, 1200)]
          .filter(Boolean)
          .join("\n\n"),
        url: r.html_url ?? `https://github.com/${repo}/releases`,
        source: "github",
        tags: ["release", r.prerelease ? "prerelease" : "stable"],
      };
    });
}

/** Star-count milestone as a signal (spec: "star" signals). One signal per
 * crossed milestone, deduped by the milestone in external_id. */
async function fetchStarSignals(token: string, repo: string): Promise<GhSignal[]> {
  const res = await ghFetch(token, `/repos/${repo}`);
  if (!res.ok) return [];
  const r = (await res.json()) as { stargazers_count?: number };
  const count = r.stargazers_count ?? 0;
  const milestone = starMilestone(count);
  if (milestone == null) return [];
  return [
    {
      externalId: `github:star:${repo}:${milestone}`,
      title: `${repo} passed ${milestone.toLocaleString()} stars`,
      content: `${repo} now has ${count.toLocaleString()} GitHub stars (crossed the ${milestone.toLocaleString()} milestone).`,
      url: `https://github.com/${repo}/stargazers`,
      source: "github",
      tags: ["stars", "growth"],
    },
  ];
}

/** Repo traffic (views + clones) as a per-day signal (spec: "traffic" signals).
 * The /traffic endpoints require push access on the installation; a read-only
 * install returns 403, which we swallow (return []) rather than error. */
async function fetchTrafficSignals(token: string, repo: string): Promise<GhSignal[]> {
  const res = await ghFetch(token, `/repos/${repo}/traffic/views`);
  if (!res.ok) return []; // 403 for read-only installs, etc. — fail soft.
  const data = (await res.json()) as {
    count?: number;
    uniques?: number;
    views?: Array<{ timestamp?: string; count?: number; uniques?: number }>;
  };
  const latest = (data.views ?? []).at(-1);
  if (!latest?.timestamp) return [];
  const day = latest.timestamp.slice(0, 10);
  return [
    {
      externalId: `github:traffic:${repo}:${day}`,
      title: `${repo} traffic spike on ${day}`,
      content: `${repo} had ${latest.count ?? 0} views from ${latest.uniques ?? 0} unique visitors on ${day} (14-day total ${data.count ?? 0} views / ${data.uniques ?? 0} uniques).`,
      url: `https://github.com/${repo}/graphs/traffic`,
      source: "github",
      tags: ["traffic"],
    },
  ];
}

/** Pull recent GitHub signals for one workspace and upsert into signals.
 *  Returns {inserted, skipped, source} — skipped = already present rows. */
export async function ingestGithubSignals(
  userId: string,
  workspaceId: string,
): Promise<IngestResult> {
  let gh: { token: string; repo: string };
  try {
    gh = await resolveGitHub({ userId, workspaceId });
  } catch {
    // No binding or connection — workspace simply skipped.
    return { inserted: 0, skipped: 0, source: "none" };
  }

  const [issues, pushes, releases, stars, traffic] = await Promise.all([
    fetchIssueSignals(gh.token, gh.repo),
    fetchPushSignals(gh.token, gh.repo),
    fetchReleaseSignals(gh.token, gh.repo),
    fetchStarSignals(gh.token, gh.repo),
    fetchTrafficSignals(gh.token, gh.repo),
  ]);

  const raw = [...issues, ...pushes, ...releases, ...stars, ...traffic];
  if (raw.length === 0) return { inserted: 0, skipped: 0, source: gh.repo };

  // GitHub is reached via an authed API, so its payloads are trusted (no injection
  // screen). The sink handles dedup (external_id), tag/sentiment derivation (when
  // omitted), stamping source_kind, and the stage_events trail per signal.
  const candidates: SignalCandidate[] = raw.map((c) => ({
    externalId: c.externalId,
    source: c.source,
    sourceKind: "pull_connector",
    title: c.title,
    content: c.content,
    url: c.url,
    tags: c.tags,
    untrusted: false,
  }));

  const res = await writeSignals(userId, workspaceId, candidates);
  return { inserted: res.inserted, skipped: res.skipped, source: gh.repo };
}
