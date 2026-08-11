// TRUST-VERIFY (v11 #26) — an integrity check for the Trust Ledger.
//
// This is a plain CHECKSUM, not a blockchain: no chain network, no tokens, no keys,
// no external service. It computes a single SHA-256 fingerprint of the ledger (the
// "seal") so anyone — every user, not just an enterprise tier — can confirm later
// that the record has not been altered:
//
//   h0   = SHA256(GENESIS)
//   h_i  = SHA256(h_{i-1} + canonical(record_i))     (records in a canonical order)
//   seal = h_n  (the chain head = the fingerprint)
//
// Any alteration, insertion, removal, or reorder of a record changes the fingerprint,
// so a user who SAVED an earlier fingerprint can confirm the ledger is unchanged. The
// LIVE path is head-only: save the compact fingerprint, later check "does it still
// match? yes / no". `verifyReceipts` can additionally pinpoint WHICH record changed
// when handed the full saved seal (its per-record links); getLedgerSeal now persists
// those links into `ledger_seals` at compute time, so the verify path uses them (an
// optional Ed25519 signature for non-repudiation remains a possible later add-on;
// nothing here is gated to any tier).
//
// Pure + dependency-light on purpose: it imports only the TrustReceipt TYPE and uses
// Web Crypto (crypto.subtle), present in both bun (tests) and the Cloudflare Worker
// runtime — so the fingerprinting + change-detection is unit-tested without a DB, and
// the same code runs server-side.

import type { TrustReceipt } from "@/lib/trust-ledger.functions";

export const SEAL_ALGO = "SHA-256-chain/v1";
const GENESIS = "supaprod-trust-ledger/v1";

/**
 * The integrity-relevant, canonical form of a receipt — an explicit, ordered tuple
 * of only the fields that constitute the RECORD (what changed, why, who, when, and
 * its outcome). Derived/presentation fields (`evidenceCount`, `source.label`) are
 * excluded so the seal does not flap on benign re-reads; `outcome`/`supersededBy`
 * ARE included because a decision's outcome changing is a real change worth sealing.
 * Nulls are normalised and the boolean is fixed-width so the serialisation is stable.
 */
export function canonicalizeReceipt(r: TrustReceipt): string {
  return JSON.stringify([
    r.id,
    r.kind,
    r.title,
    r.rationale ?? null,
    r.status,
    r.actor ?? null,
    r.humanDecided ? 1 : 0,
    r.occurredAt,
    r.source?.kind ?? null,
    r.source?.id ?? null,
    r.toolName ?? null,
    // 'proven' is a display state derived from recorded learnings, not a
    // record mutation: sealing it would flip every saved fingerprint the
    // moment an outcome validates a decision, and the verify UI would
    // misreport that as tampering. The seal attests the stored record;
    // proven normalizes back to standing.
    r.outcome === "proven" ? "standing" : r.outcome,
    r.supersededBy ?? null,
  ]);
}

/** SHA-256 of a UTF-8 string, lowercase hex. Web Crypto (async); no key material. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Canonical chain order: by record id ascending, tie-broken by canonical content so
 * the order is TOTAL and read-order-independent even in the impossible case of two
 * records sharing an id (ids are DB primary keys, so the tie-break is belt-and-
 * suspenders). This makes the seal a function of the record SET, not the read/sort
 * order, while a content change still moves the fingerprint (every field is chained).
 */
function orderedById(receipts: TrustReceipt[]): TrustReceipt[] {
  return [...receipts].sort((a, b) => {
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    const ca = canonicalizeReceipt(a);
    const cb = canonicalizeReceipt(b);
    return ca < cb ? -1 : ca > cb ? 1 : 0;
  });
}

export type SealLink = { id: string; hash: string };
export type TrustSeal = {
  algo: string;
  /** the chain head — the tamper-evident fingerprint of the whole record set. */
  head: string;
  count: number;
  /** per-record cumulative hashes, in chain order (lets a verifier pinpoint a change). */
  links: SealLink[];
};

/** Compute the tamper-evident seal (chain head + per-record links) over the receipts. */
export async function sealReceipts(receipts: TrustReceipt[]): Promise<TrustSeal> {
  const list = orderedById(Array.isArray(receipts) ? receipts : []);
  let prev = await sha256Hex(GENESIS);
  const links: SealLink[] = [];
  for (const r of list) {
    prev = await sha256Hex(`${prev}\n${canonicalizeReceipt(r)}`);
    links.push({ id: r.id, hash: prev });
  }
  return { algo: SEAL_ALGO, head: prev, count: list.length, links };
}

/** The pinpointed record ids that changed between a saved seal and the current set. */
export type SealDiff = {
  /** record ids present now but absent from the saved seal. Exact (set membership). */
  added: string[];
  /** record ids in the saved seal but gone from the current set. Exact (set membership). */
  removed: string[];
  /** the FIRST provably-altered record id. Cumulative hashes cannot isolate later
   * alterations (everything downstream of the first divergence inherits it), and a
   * mutation is only attributable at all when the id sets are identical. */
  mutated: string[];
};

/**
 * PURE. Diff the current per-record links against a SAVED seal's links. Added and
 * removed ids are exact set differences; `mutated` names the first altered record and
 * only when no records were added or removed (see SealDiff). Both lists arrive in the
 * canonical chain order (id ascending) because both come from `sealReceipts`.
 */
export function diffSealLinks(current: SealLink[], saved: SealLink[]): SealDiff {
  const savedIds = new Set(saved.map((l) => l.id));
  const curIds = new Set(current.map((l) => l.id));
  const added = current.filter((l) => !savedIds.has(l.id)).map((l) => l.id);
  const removed = saved.filter((l) => !curIds.has(l.id)).map((l) => l.id);
  const mutated: string[] = [];
  if (added.length === 0 && removed.length === 0) {
    for (let i = 0; i < current.length; i++) {
      const rec = saved[i];
      if (rec && current[i].hash !== rec.hash) {
        mutated.push(current[i].id);
        break;
      }
    }
  }
  return { added, removed, mutated };
}

export type VerifyResult = {
  /** true when the current records reproduce the recorded seal head exactly. */
  ok: boolean;
  recomputedHead: string;
  expectedHead: string;
  count: number;
  expectedCount: number;
  /** the id of the first record that diverges from the recorded seal, when known. */
  brokenAt: string | null;
  /** a plain-language explanation of the divergence, or null when ok. */
  reason: string | null;
  /** the pinpointed changed ids, only when the recorded seal carried its links. */
  changed: SealDiff | null;
};

/**
 * Verify the CURRENT receipts against a previously-recorded seal. When the recorded
 * seal carries its `links`, the first divergent record is pinpointed and classified
 * (altered / added / removed / reordered); otherwise only head + count are compared.
 */
export async function verifyReceipts(
  receipts: TrustReceipt[],
  seal: { head: string; count?: number; links?: SealLink[] },
): Promise<VerifyResult> {
  const recomputed = await sealReceipts(receipts);
  const ok = recomputed.head === seal.head;
  let brokenAt: string | null = null;
  let reason: string | null = null;
  const changed =
    !ok && Array.isArray(seal.links) ? diffSealLinks(recomputed.links, seal.links) : null;

  if (!ok) {
    if (Array.isArray(seal.links)) {
      const max = Math.max(recomputed.links.length, seal.links.length);
      for (let i = 0; i < max; i++) {
        const cur = recomputed.links[i];
        const rec = seal.links[i];
        if (!cur) {
          brokenAt = rec?.id ?? null;
          reason = "a record was removed since the saved fingerprint";
          break;
        }
        if (!rec) {
          brokenAt = cur.id;
          reason = "a record was added since the saved fingerprint";
          break;
        }
        if (cur.id !== rec.id) {
          brokenAt = rec.id;
          reason =
            "the record set changed (a record was inserted, removed, or reordered) since the saved fingerprint";
          break;
        }
        if (cur.hash !== rec.hash) {
          brokenAt = cur.id;
          reason = "a record was altered since the saved fingerprint";
          break;
        }
      }
    } else {
      reason =
        typeof seal.count === "number" && seal.count !== recomputed.count
          ? "the number of records changed since the seal"
          : "the record content changed since the saved fingerprint";
    }
  }

  return {
    ok,
    recomputedHead: recomputed.head,
    expectedHead: seal.head,
    count: recomputed.count,
    expectedCount: typeof seal.count === "number" ? seal.count : recomputed.count,
    brokenAt,
    reason,
    changed,
  };
}

/** A short, human-facing fingerprint of a chain head (first 12 hex chars, grouped). */
export function shortHead(head: string): string {
  const h = (head ?? "").slice(0, 12);
  return h.replace(/(.{4})(.{4})(.{4})/, "$1 $2 $3").trim();
}
