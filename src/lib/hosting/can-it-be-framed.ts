/**
 * CAN THIS URL BE DRAWN INSIDE A FRAME ON OUR ORIGIN?
 *
 * The run screen's right pane framed the production URL of the shipped run
 * and drew a blank white rectangle: the host refuses to be framed, the browser
 * enforces that silently, and nothing inside the page can read why. So the
 * question is asked server-side, once per deployment, and the answer is kept
 * on the row (`deployments.embeddable`, migration 20260909100100).
 *
 * ── WHAT DECIDES IT ──────────────────────────────────────────────────────────
 * Two headers, in the order browsers apply them:
 *   1. `Content-Security-Policy: frame-ancestors ...` wins when present.
 *      `*` or our origin (exact, or a wildcard host that matches) allows;
 *      anything else, including `'self'` and `'none'`, refuses. A host that
 *      names only itself is refusing everyone else, which is us.
 *   2. Otherwise `X-Frame-Options`: DENY refuses; SAMEORIGIN refuses (a
 *      deployment is never on our origin); ALLOW-FROM allows only its own uri.
 *   3. Neither header: the browser will draw it.
 * A non-2xx answer, or a host that cannot be reached, is FALSE: a frame that
 * cannot be proven to draw is not offered, and the URL is drawn as a door.
 *
 * `frameVerdict` is pure and tested; `checkFrameable` is the one fetch.
 */

/** Where the pane that would draw the frame is served from. */
export const APP_ORIGIN = "https://supaprod.ai";

export type FrameVerdict = {
  embeddable: boolean;
  /** One clause a person can read beside the door: "the host refuses frames (X-Frame-Options: DENY)". */
  reason: string;
};

/** The `frame-ancestors` source list from a CSP header, or null when the directive is absent. */
export function frameAncestorsOf(csp: string | null | undefined): string[] | null {
  if (!csp) return null;
  for (const directive of csp.split(";")) {
    const parts = directive.trim().split(/\s+/);
    if (parts[0]?.toLowerCase() === "frame-ancestors") return parts.slice(1);
  }
  return null;
}

/** Does one CSP source expression admit `origin`? Handles `*`, exact origins and `https://*.example.com`. */
function sourceAdmits(source: string, origin: string): boolean {
  const s = source.trim().replace(/^'|'$/g, "").toLowerCase();
  if (s === "*") return true;
  if (s === "self" || s === "none") return false;
  let ours: URL;
  try {
    ours = new URL(origin);
  } catch {
    return false;
  }
  // A bare scheme ("https:") admits every host on it.
  if (/^[a-z][a-z0-9+.-]*:$/.test(s)) return s === ours.protocol;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(s) ? s : `${ours.protocol}//${s}`;
  const m = withScheme.match(/^([a-z][a-z0-9+.-]*):\/\/([^/:]+)(?::(\d+|\*))?/);
  if (!m) return false;
  const [, scheme, host, port] = m;
  if (scheme !== ours.protocol.replace(/:$/, "")) return false;
  if (port && port !== "*" && port !== (ours.port || (ours.protocol === "https:" ? "443" : "80"))) {
    return false;
  }
  if (host!.startsWith("*."))
    return ours.hostname.endsWith(host!.slice(1)) && ours.hostname !== host!.slice(2);
  return host === ours.hostname;
}

export function frameVerdict(
  answer: { status: number; xfo: string | null; csp: string | null },
  origin: string = APP_ORIGIN,
): FrameVerdict {
  if (answer.status < 200 || answer.status >= 400) {
    return { embeddable: false, reason: `the host answered ${answer.status}` };
  }
  const ancestors = frameAncestorsOf(answer.csp);
  if (ancestors) {
    const ok = ancestors.some((s) => sourceAdmits(s, origin));
    return ok
      ? { embeddable: true, reason: "the host allows a frame from supaprod.ai" }
      : {
          embeddable: false,
          reason: `the host refuses frames (frame-ancestors ${ancestors.join(" ")})`,
        };
  }
  const xfo = (answer.xfo ?? "").trim();
  if (xfo) {
    const upper = xfo.toUpperCase();
    if (upper === "DENY" || upper === "SAMEORIGIN") {
      return { embeddable: false, reason: `the host refuses frames (X-Frame-Options: ${upper})` };
    }
    const allowFrom = xfo.match(/^allow-from\s+(\S+)/i);
    if (allowFrom) {
      const ok = sourceAdmits(allowFrom[1]!, origin);
      return ok
        ? { embeddable: true, reason: "the host allows a frame from supaprod.ai" }
        : { embeddable: false, reason: `the host refuses frames (X-Frame-Options: ${xfo})` };
    }
    // An unknown value is ignored by browsers; the frame draws.
  }
  return { embeddable: true, reason: "the host sets no framing policy" };
}

/**
 * Ask the host. HEAD first, GET (no body read) when the host will not answer
 * a HEAD, redirects followed so the policy read is the one on the page that
 * would actually be drawn. Bounded, and a host that cannot be reached is a
 * refusal with its own reason rather than a throw.
 */
export async function checkFrameable(
  url: string,
  origin: string = APP_ORIGIN,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<FrameVerdict> {
  const ask = async (method: "HEAD" | "GET") => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { method, redirect: "follow", signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let res = await ask("HEAD");
    if (res.status === 405 || res.status === 501) res = await ask("GET");
    return frameVerdict(
      {
        status: res.status,
        xfo: res.headers.get("x-frame-options"),
        csp: res.headers.get("content-security-policy"),
      },
      origin,
    );
  } catch (e) {
    const msg =
      e instanceof Error ? (e.name === "AbortError" ? "no answer in time" : e.message) : String(e);
    return { embeddable: false, reason: `the host could not be reached (${msg})` };
  }
}
