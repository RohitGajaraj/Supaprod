/**
 * The door, tested at the seam that matters: the verdict a stranger receives.
 *
 * THE FAKE DATABASE BELOW IS NOT A CONVENIENCE, it is the test's argument. Its
 * `redeem_invite_code` mirrors the migration's single guarded UPDATE exactly:
 * the ceiling check and the increment are one indivisible step, reached after an
 * await, so two callers are genuinely in flight together before either mutates.
 * That is what lets the last-use test mean something.
 *
 * The `splitGuard` option is the negative control, and without it a green
 * concurrency test would prove only that JavaScript runs one statement at a
 * time. It moves the ceiling check out of the write, which is what the SQL
 * degrades into if anybody rewrites the redeem as a SELECT then an UPDATE, and
 * the last test drives the SAME implementation against it to watch a one-use
 * code get spent twice.
 *
 * The fake's contract is pinned to the real SQL by the parity block at the end,
 * which reads the migration and fails if the guard ever leaves the UPDATE.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  checkInviteCodeImpl,
  redeemInviteCodeImpl,
  normalizeInviteCode,
  INVITE_ATTEMPT_CEILING,
} from "./invites.functions";

type FakeCode = {
  code: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked: boolean;
};

function code(over: Partial<FakeCode> = {}): FakeCode {
  return {
    code: "YC-COMPOUND-K7QR4V",
    max_uses: null,
    uses: 0,
    expires_at: null,
    revoked: false,
    ...over,
  };
}

function thenable<T>(value: T) {
  return {
    then: (res: (v: T) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(value).then(res, rej),
  };
}

type Fake = {
  client: SupabaseClient;
  rows: FakeCode[];
  attempts: string[];
};

function fakeDb(
  rows: FakeCode[],
  opts: { attemptsLastMinute?: number; splitGuard?: boolean } = {},
): Fake {
  const attempts: string[] = [];
  const find = (c: string) => rows.find((r) => r.code.toLowerCase() === c.toLowerCase());

  const statusOf = (c: string): string => {
    const row = find(c);
    if (!row) return "unknown";
    if (row.revoked) return "revoked";
    if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return "expired";
    if (row.max_uses !== null && row.uses >= row.max_uses) return "exhausted";
    return "ok";
  };

  const live = (row: FakeCode | undefined): row is FakeCode =>
    !!row &&
    !row.revoked &&
    (!row.expires_at || Date.parse(row.expires_at) > Date.now()) &&
    (row.max_uses === null || row.uses < row.max_uses);

  /**
   * The migration's single guarded UPDATE, in JS. Everything from the ceiling
   * check to the increment is synchronous, which is exactly what the row lock
   * buys in Postgres: a second caller cannot observe the row between the two.
   *
   * `splitGuard` is the same function with the guard moved OUT of the write and
   * a suspension point between them, which is what the SQL would degrade into
   * if somebody rewrote it as a SELECT followed by an UPDATE. It exists so the
   * concurrency tests below can be shown to fail when atomicity is lost, rather
   * than passing because JavaScript happens to run one statement at a time.
   */
  const redeem = async (c: string): Promise<string> => {
    const row = find(c);
    const admissible = live(row);
    if (opts.splitGuard) await Promise.resolve();
    if (admissible && row) {
      row.uses += 1;
      return "ok";
    }
    const reason = statusOf(c);
    return reason === "ok" ? "exhausted" : reason;
  };

  const client = {
    from: (_table: string) => ({
      select: (_cols: string, _opts?: unknown) => ({
        gte: (_col: string, _v: string) =>
          thenable({ count: opts.attemptsLastMinute ?? 0, error: null }),
      }),
      insert: (row: { outcome: string }) => {
        attempts.push(row.outcome);
        return thenable({ data: null, error: null });
      },
    }),
    rpc: async (name: string, args: { _code: string }) => {
      // The await that puts concurrent callers genuinely in flight together:
      // every one of them reaches this line before any of them mutates.
      await Promise.resolve();
      if (name === "invite_code_status") return { data: statusOf(args._code), error: null };
      if (name === "redeem_invite_code") return { data: await redeem(args._code), error: null };
      return { data: null, error: { message: `no such function ${name}` } };
    },
  } as unknown as SupabaseClient;

  return { client, rows, attempts };
}

describe("normalizeInviteCode", () => {
  it("strips whitespace anywhere in the code, because email soft-wrap puts it there", () => {
    expect(normalizeInviteCode("  YC-COMPOUND-\n K7QR4V ")).toBe("YC-COMPOUND-K7QR4V");
  });

  it("is not a code when it is not a string", () => {
    expect(normalizeInviteCode(undefined)).toBe("");
    expect(normalizeInviteCode(42)).toBe("");
  });

  it("lifts the code out of the whole invite link, which is what people paste", () => {
    expect(normalizeInviteCode("https://supaprod.ai/signup?invite=YC-COMPOUND-K7QR4V")).toBe(
      "YC-COMPOUND-K7QR4V",
    );
    expect(normalizeInviteCode("/signup?invite=SP-ABCD-EFGH")).toBe("SP-ABCD-EFGH");
    // A link that picked up other parameters on the way, and one where invite
    // is not the first of them.
    expect(
      normalizeInviteCode("https://supaprod.ai/signup?from=email&invite=SP-ABCD-EFGH#top"),
    ).toBe("SP-ABCD-EFGH");
  });

  it("survives a link whose escaping is broken rather than refusing it", () => {
    expect(normalizeInviteCode("/signup?invite=SP-100%-OFF")).toBe("SP-100%-OFF");
  });

  it("leaves a bare code exactly as typed, casing included", () => {
    expect(normalizeInviteCode("yc-Compound-K7qr4v")).toBe("yc-Compound-K7qr4v");
  });
});

describe("the door refuses", () => {
  it("an empty code, without asking the database anything", async () => {
    const db = fakeDb([code()]);
    const v = await checkInviteCodeImpl(db.client, "");
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.reason).toBe("missing");
    expect(db.attempts).toEqual([]);
  });

  it("an unknown code", async () => {
    const db = fakeDb([code()]);
    const v = await redeemInviteCodeImpl(db.client, "NOT-A-CODE");
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.reason).toBe("unknown");
  });

  it("a revoked code", async () => {
    const db = fakeDb([code({ revoked: true })]);
    const v = await redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V");
    expect(v.ok).toBe(false);
    expect(db.rows[0].uses).toBe(0);
  });

  it("an expired code", async () => {
    const db = fakeDb([code({ expires_at: new Date(Date.now() - 1000).toISOString() })]);
    const v = await redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V");
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.reason).toBe("expired");
    expect(db.rows[0].uses).toBe(0);
  });

  it("an exhausted code", async () => {
    const db = fakeDb([code({ max_uses: 3, uses: 3 })]);
    const v = await redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V");
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.reason).toBe("exhausted");
    expect(db.rows[0].uses).toBe(3);
  });

  it("every attempt once the minute's ceiling is passed, and does not log the refusal", async () => {
    const db = fakeDb([code()], { attemptsLastMinute: INVITE_ATTEMPT_CEILING + 1 });
    const v = await redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V");
    expect(v.ok === false && v.reason).toBe("busy");
    // A brake that logged its own refusals would hold itself down for as long as
    // anybody kept knocking.
    expect(db.attempts).toEqual([]);
    expect(db.rows[0].uses).toBe(0);
  });

  it("without leaking that a revoked code was ever real", async () => {
    const revoked = fakeDb([code({ code: "WAS-REAL-ONCE", revoked: true })]);
    const missing = fakeDb([]);
    const a = await checkInviteCodeImpl(revoked.client, "WAS-REAL-ONCE");
    const b = await checkInviteCodeImpl(missing.client, "WAS-REAL-ONCE");
    expect(a).toEqual(b);
    // The admin side still gets the truth, which is the whole reason the two
    // can be told apart at all.
    expect(revoked.attempts).toEqual(["revoked"]);
    expect(missing.attempts).toEqual(["unknown"]);
  });
});

describe("the door admits", () => {
  it("a valid code, and the redemption moves the counter", async () => {
    const db = fakeDb([code({ max_uses: 5, uses: 2 })]);
    const v = await redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V");
    expect(v.ok).toBe(true);
    expect(db.rows[0].uses).toBe(3);
  });

  it("without regard to casing, because the card and the keyboard disagree", async () => {
    const db = fakeDb([code({ code: "YC-Compound-K7QR4V", max_uses: 1 })]);
    const v = await redeemInviteCodeImpl(db.client, "yc-compound-k7qr4v");
    expect(v.ok).toBe(true);
    expect(db.rows[0].uses).toBe(1);
  });

  it("a check without spending a use, so a failed signup burns nothing", async () => {
    const db = fakeDb([code({ max_uses: 1 })]);
    const v = await checkInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V");
    expect(v.ok).toBe(true);
    expect(db.rows[0].uses).toBe(0);
  });
});

describe("two people, one use left", () => {
  it("admits exactly one of them", async () => {
    const db = fakeDb([code({ max_uses: 1, uses: 0 })]);
    const [a, b] = await Promise.all([
      redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V"),
      redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V"),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect(db.rows[0].uses).toBe(1);
    const refused = [a, b].find((v) => !v.ok);
    expect(refused && refused.ok === false && refused.reason).toBe("exhausted");
  });

  it("holds at the ceiling under ten simultaneous redemptions of a three-use code", async () => {
    const db = fakeDb([code({ max_uses: 3, uses: 0 })]);
    const results = await Promise.all(
      Array.from({ length: 10 }, () => redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V")),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(db.rows[0].uses).toBe(3);
  });

  /**
   * The negative control, and the reason the two tests above are worth
   * anything. Same code, same callers, one difference: the fake's redeem checks
   * the ceiling, yields, and only then writes, which is what the SQL becomes if
   * the guard is ever lifted out of the UPDATE into a preceding SELECT. Both
   * callers pass a check that was true when they took it and the one-use code is
   * spent twice.
   *
   * If this test ever starts passing its ASSERTION in the other direction, the
   * concurrency tests above have stopped measuring anything.
   */
  it("double-spends the moment the ceiling check leaves the write", async () => {
    const db = fakeDb([code({ max_uses: 1, uses: 0 })], { splitGuard: true });
    const results = await Promise.all([
      redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V"),
      redeemInviteCodeImpl(db.client, "YC-COMPOUND-K7QR4V"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(2);
    expect(db.rows[0].uses).toBe(2);
  });
});

describe("the migration keeps the guard inside the increment", () => {
  const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

  function redeemMigration(): string {
    const files = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const hits = files.filter((f) =>
      readFileSync(join(MIGRATIONS, f), "utf8").includes("function public.redeem_invite_code"),
    );
    const latest = hits[hits.length - 1];
    if (!latest) {
      throw new Error(
        "No migration defines public.redeem_invite_code. The atomic redeem moved or was removed; " +
          "point this guard at its new home rather than deleting it.",
      );
    }
    return readFileSync(join(MIGRATIONS, latest), "utf8");
  }

  it("increments in one statement whose WHERE carries the ceiling", () => {
    const sql = redeemMigration();
    const start = sql.indexOf("function public.redeem_invite_code");
    const body = sql.slice(start, sql.indexOf("$$;", start));
    const update = body.slice(
      body.indexOf("update public.invite_codes"),
      body.indexOf("returning"),
    );
    expect(update).toContain("set uses = uses + 1");
    // The whole argument in one assertion: if this guard ever moves out of the
    // UPDATE and into a preceding SELECT, two people take the same last use.
    expect(update).toContain("max_uses is null or uses < max_uses");
    expect(update).toContain("revoked = false");
    expect(update).toContain("expires_at is null or expires_at > now()");
  });

  it("seeds exactly one permanent partner code, unlimited and never expiring", () => {
    const sql = redeemMigration();
    expect(sql).toContain("'YC-COMPOUND-K7QR4V'");
    const insert = sql.slice(sql.indexOf("insert into public.invite_codes"));
    // null max_uses and null expires_at are what make it usable in the one
    // moment nobody has time to mint a replacement.
    expect(insert).toMatch(/null,\s*\n?\s*null,\s*\n?\s*false/);
  });
});
