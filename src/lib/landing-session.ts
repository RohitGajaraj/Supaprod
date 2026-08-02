/**
 * The anonymous landing session key.
 *
 * WHAT IT IS. A random 32 hex character value, minted in the browser the first
 * time a landing event needs one and held for the life of this browser tab. It
 * exists for exactly one join: the rows an anonymous visitor writes to
 * landing_events, and the account that visitor may create at the end of the
 * same visit. Without it you can see that somebody visited, and you can see
 * that somebody signed up, and you can never learn that they were the same
 * person. That join is the whole reason the session_key column exists.
 *
 * WHAT IT IS NOT. It is not a fingerprint. Nothing about the device, the
 * browser, the screen, the clock, the network or the person goes into it: it is
 * random bytes and nothing else, so two visitors can never derive the same key
 * and the key tells you nothing at all about who is holding it. It is not a
 * cross-visit identifier, it is not a cookie, and it is never handed to a third
 * party. The only thing it can do is match rows this browser wrote to each
 * other.
 *
 * WHY sessionStorage AND NOT A COOKIE OR localStorage. sessionStorage is the
 * shortest-lived store that still covers the job, so it is the one we take. The
 * job is one visit that ends in one signup, and that always happens inside a
 * single tab session. A cookie would be attached to every request to the server
 * for as long as it lived, which turns a join key into ambient tracking data
 * and pulls in a consent conversation we have no reason to have. localStorage
 * would survive for months and quietly become a returning-visitor identifier,
 * which is precisely the thing this is not. The cost of the short store is real
 * and it is accepted: somebody who reads the page today and signs up tomorrow
 * arrives as a fresh session, and their earlier visit stays anonymous forever.
 * For a key whose only purpose is one join, that is the right trade.
 *
 * SSR. This module touches window, sessionStorage and crypto only inside the
 * exported functions, never at import time, so importing it during a server
 * render is inert. Every entry point returns undefined on the server, and also
 * on any browser that blocks storage or has no crypto. Every call site treats
 * undefined as "send the event with no session key", which is exactly the
 * behaviour that shipped before this file existed. A missing analytics row is a
 * cheap loss; a landing page that throws is not. Telemetry never blocks, never
 * retries and never fails a user action.
 */

/** Namespaced so it cannot collide with the other sessionStorage keys in use. */
export const LANDING_SESSION_STORAGE_KEY = "supaprod:landing-session";

/** 16 bytes of randomness, 32 hex characters, well inside the column's 64. */
const KEY_BYTES = 16;

/** What a valid key looks like. Used on the server to reject anything else. */
export const LANDING_SESSION_KEY_RE = /^[0-9a-f]{32}$/;

/**
 * Held in memory as well as in storage for two reasons: it saves a storage read
 * on every event, and it is the fallback when sessionStorage is blocked (Safari
 * private mode and locked-down enterprise profiles both throw on access). An
 * in-memory key is strictly shorter lived than a stored one, so falling back to
 * it never widens the privacy footprint.
 */
let inMemoryKey: string | undefined;

function mint(): string | undefined {
  // crypto.getRandomValues rather than crypto.randomUUID: randomUUID needs a
  // secure context and is missing on plain http, which is where local previews
  // and some staging hosts live. getRandomValues is available in both.
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") return undefined;
  const bytes = new Uint8Array(KEY_BYTES);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The key for this browser session, minting one on first use.
 *
 * Call this from anything that records a landing event. Returns undefined
 * during SSR, and whenever the browser will not give us randomness. Never
 * throws.
 */
export function getLandingSessionKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (inMemoryKey) return inMemoryKey;

  try {
    const stored = window.sessionStorage.getItem(LANDING_SESSION_STORAGE_KEY);
    if (stored && LANDING_SESSION_KEY_RE.test(stored)) {
      inMemoryKey = stored;
      return stored;
    }
  } catch {
    // Storage blocked. Fall through and keep the key in memory for this page.
  }

  const minted = mint();
  if (!minted) return undefined;
  inMemoryKey = minted;
  try {
    window.sessionStorage.setItem(LANDING_SESSION_STORAGE_KEY, minted);
  } catch {
    // Storage blocked or full. The in-memory key still joins the events this
    // page fires, which is better than nothing and no worse than the old null.
  }
  return minted;
}

/**
 * Read the key without minting one.
 *
 * This is what the signup boundary uses. Somebody who opens /signup directly,
 * from an email link or a bookmark, never walked the landing page, so minting a
 * key for them would record a claim on a session that has no events behind it.
 * A claim that joins nothing is noise, so we would rather have no claim.
 */
export function peekLandingSessionKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (inMemoryKey) return inMemoryKey;
  try {
    const stored = window.sessionStorage.getItem(LANDING_SESSION_STORAGE_KEY);
    if (stored && LANDING_SESSION_KEY_RE.test(stored)) {
      inMemoryKey = stored;
      return stored;
    }
  } catch {
    // Storage blocked. There is nothing to read and nothing to report.
  }
  return undefined;
}

/**
 * Forget the key.
 *
 * Called once the session has been claimed by an account. At that point the key
 * has done the entire job it was minted for, and leaving it in the browser
 * would mean carrying a value around that is now, by construction, linkable to
 * a known person. Dropping it is the cheapest privacy win available here.
 */
export function clearLandingSessionKey(): void {
  inMemoryKey = undefined;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LANDING_SESSION_STORAGE_KEY);
  } catch {
    // Nothing to do. The in-memory copy is already gone.
  }
}
