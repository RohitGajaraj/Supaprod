/**
 * SOMEBODY ELSE'S BUILDER MADE THE CHANGE. THIS IS HOW THE OUTCOME COMES BACK.
 *
 * ── WHY THIS IS FIRST OF THE FOUR HANDBACK MECHANISMS ──────────────────────
 * Gap #12 lists them cheapest first: **paste a PR or deploy URL**, a repository
 * app reporting four events, the customer's telemetry read one metric per
 * forecast, and the handoff out as a formatted brief. This one needs no
 * integration, no credential and no webhook — which is exactly why it goes first.
 *
 * The load-bearing fact behind the whole idea: **the verdict is measured against
 * the forecast, not against the code.** So bring-your-own-builder does not break
 * the loop. We need only that it shipped, and what happened.
 *
 * ── WHAT THIS FILE REFUSES TO DO, AND WHY THAT IS THE POINT ────────────────
 * A pasted URL is a CLAIM by a person. It is not proof that anything merged,
 * deployed or passed a check. This module's whole job is to keep those apart:
 *
 *   · It validates the SHAPE and the HOST, so a typo or a random link cannot
 *     become a deployment row.
 *   · It records `claimedByPerson: true` on everything, always. R-18 requires
 *     that a run with a human act in it is not counted as unattended, and a
 *     handback IS a human act. A paste that quietly looked like agent work would
 *     manufacture exactly the false acceptance F-79 caught.
 *   · **It never infers that CI passed.** `release.publish` proves a merged
 *     changeset and `studio.pr.merge` re-proves checks at the head sha. A pasted
 *     link proves neither, and saying otherwise would put the one claim the
 *     product exists to make — that this shipped — on the strength of a string
 *     somebody typed.
 *
 * That last rule is why `verified` is a separate field from `url` and starts
 * false. Something else may verify it later; nothing here does.
 */

/** The hosts a handback link may name. Anything else is refused, not "assumed". */
const KNOWN_HOSTS = ["github.com", "gitlab.com"] as const;

export type PasteBackKind = "pull_request" | "deployment";

export interface PasteBack {
  kind: PasteBackKind;
  url: string;
  /** `owner/repo` for a PR, the host for a deploy. What the link actually names. */
  target: string;
  /** ALWAYS true here. A handback is a person acting; see the header. */
  claimedByPerson: true;
  /**
   * Whether anything has CHECKED this, as opposed to been told it.
   *
   * Starts false and this module never sets it true. A pasted link is a claim.
   */
  verified: false;
}

export type PasteBackResult = { ok: true; value: PasteBack } | { ok: false; reason: string };

/**
 * Read a pasted link, or say plainly why it cannot be used.
 *
 * Refusals name the next action, because a person who pasted the wrong thing
 * needs to know what the right thing looks like — R-20 §5, on the smallest
 * possible surface.
 */
export function readPasteBack(raw: string | null | undefined): PasteBackResult {
  const text = (raw ?? "").trim();
  if (!text) {
    return { ok: false, reason: "Paste the link to the pull request or the deploy." };
  }

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return {
      ok: false,
      reason: "That is not a link. Paste the full address, starting with https://.",
    };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Only https links are accepted." };
  }

  const host = url.hostname.replace(/^www\./, "");

  /*
   * A PULL REQUEST, and the path has to prove it.
   *
   * `/owner/repo/pull/123` on GitHub, `/owner/repo/-/merge_requests/123` on
   * GitLab. Matching the host alone would let any repository page through and
   * file it as a change that exists.
   */
  if ((KNOWN_HOSTS as readonly string[]).includes(host)) {
    const parts = url.pathname.split("/").filter(Boolean);
    const prIndex = parts.findIndex((p) => p === "pull" || p === "merge_requests");
    if (prIndex >= 2 && parts[prIndex + 1] && /^\d+$/.test(parts[prIndex + 1]!)) {
      return {
        ok: true,
        value: {
          kind: "pull_request",
          url: url.toString(),
          target: `${parts[0]}/${parts[1]}`,
          claimedByPerson: true,
          verified: false,
        },
      };
    }
    return {
      ok: false,
      reason: "That is a repository link, not a pull request. Paste the link to the PR itself.",
    };
  }

  /*
   * ANYTHING ELSE IS TREATED AS A DEPLOY, and it is deliberately permissive.
   *
   * A deploy can live anywhere — a preview host, a customer's own domain — so
   * there is no list to check it against, and inventing one would refuse honest
   * work. What keeps this safe is not the host but the two fields below:
   * `claimedByPerson` and `verified: false` travel with it, so nothing
   * downstream can mistake a typed address for a proven release.
   */
  return {
    ok: true,
    value: {
      kind: "deployment",
      url: url.toString(),
      target: host,
      claimedByPerson: true,
      verified: false,
    },
  };
}

/**
 * The sentence a person reads back, so the record and the screen agree.
 *
 * Says who claimed it and that nothing has checked it. **A handback that reads
 * like a verified deploy is the same defect as a station reporting "committed"
 * over its own refusal** (F-68), arrived at from the other side.
 */
export function pasteBackLine(p: PasteBack): string {
  return p.kind === "pull_request"
    ? `You told us this shipped as a pull request on ${p.target}. Nothing here has checked it, so the verdict will be measured against what happens, not against the code.`
    : `You told us this went live at ${p.target}. Nothing here has checked it, so the verdict will be measured against what happens, not against the code.`;
}
