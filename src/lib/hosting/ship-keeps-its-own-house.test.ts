/**
 * TEN OF TEN SLOTS, EVERY ONE A JULY SHELL NOBODY DELETED.
 *
 * A product that creates a hosted app per changeset and reclaims none has a
 * countdown on it, and on 2026-09-04 the countdown reached zero on a merged
 * release. These hold the rule that decides which slots were never in use --
 * and, as importantly, every rule that refuses.
 */
import { describe, expect, it } from "bun:test";
import {
  houseLine,
  KEEP_CLOSED_PREVIEW_DAYS,
  mayReclaim,
  OUR_APP_PREFIX,
  type HostedApp,
} from "@/lib/hosting/ship-keeps-its-own-house";

const NOW = new Date("2026-09-04T06:24:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const app = (over: Partial<HostedApp> = {}): HostedApp => ({
  slug: `${OUR_APP_PREFIX}60000000-ae547426aa32`,
  changesetId: "ae547426-aa32-4bcc-a9fc-86fa360211de",
  changesetStatus: "merged",
  servesProduction: false,
  createdAt: daysAgo(45),
  ...over,
});

describe("what may be reclaimed", () => {
  it("a July shell for a merged change, past the keep window", () => {
    const v = mayReclaim(app(), NOW);
    expect(v.reclaim).toBe(true);
    expect(v.because).toContain("45 days old");
  });

  it("abandoned counts as closed", () => {
    expect(mayReclaim(app({ changesetStatus: "abandoned" }), NOW).reclaim).toBe(true);
  });
});

describe("what is refused, and every refusal says what holds the slot", () => {
  const cases: Array<[string, Partial<HostedApp>, string]> = [
    [
      "an app this product did not create",
      { slug: "someones-own-app" },
      "Not created by this product",
    ],
    ["a live production address", { servesProduction: true }, "in production"],
    ["a slug we cannot resolve to a change", { changesetId: null }, "No change on the record"],
    ["a change that could not be read", { changesetStatus: null }, "could not be read"],
    ["a change still open", { changesetStatus: "pr_open" }, "still open (pr_open)"],
    ["an app of unknown age", { createdAt: null }, "age is unknown"],
    ["an unparseable date", { createdAt: "not a date" }, "could not be read"],
    ["a change closed yesterday", { createdAt: daysAgo(1) }, "kept for 7 days"],
  ];

  for (const [name, over, said] of cases) {
    it(name, () => {
      const v = mayReclaim(app(over), NOW);
      expect(v.reclaim).toBe(false);
      expect(v.because).toContain(said);
    });
  }

  it("production beats every other consideration", () => {
    /*
     * The one that must never be reachable by accident: an ancient, merged,
     * ours-by-slug app that is nonetheless the live product.
     */
    const v = mayReclaim(
      app({ servesProduction: true, changesetStatus: "merged", createdAt: daysAgo(400) }),
      NOW,
    );
    expect(v.reclaim).toBe(false);
  });

  it("the keep window is a real boundary, not a rounding", () => {
    expect(
      mayReclaim(app({ createdAt: daysAgo(KEEP_CLOSED_PREVIEW_DAYS - 0.1) }), NOW).reclaim,
    ).toBe(false);
    expect(
      mayReclaim(app({ createdAt: daysAgo(KEEP_CLOSED_PREVIEW_DAYS + 0.1) }), NOW).reclaim,
    ).toBe(true);
  });
});

describe("the sentence a person reads about their own account", () => {
  it("says nothing is there when nothing is", () => {
    expect(houseLine([], NOW)).toContain("No hosted previews");
  });

  it("counts what can be reclaimed against what cannot", () => {
    const said = houseLine([app(), app(), app({ servesProduction: true })], NOW);
    expect(said).toContain("3 hosted previews");
    expect(said).toContain("2 can be reclaimed");
    expect(said).toContain("1 still in use");
  });

  it("does not offer a reclaim when there is nothing to reclaim", () => {
    /*
     * "10 apps, all still in use" is the honest answer when the account is full
     * of live work, and it is a different problem from a full account of
     * rubbish. Saying the same thing about both is how the July shells went
     * unnoticed for six weeks.
     */
    const said = houseLine([app({ servesProduction: true })], NOW);
    expect(said).toContain("all still in use");
    expect(said).not.toContain("reclaimed");
  });
});
