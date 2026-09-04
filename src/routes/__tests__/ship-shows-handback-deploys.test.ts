import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChangelogEntry } from "@/lib/changelog.functions";
import { handbackDeploys, shipListItems, type ShipDeployment } from "../_authenticated.ship";

/**
 * A HANDED-BACK RELEASE REACHES THE SHIP PAGE (P-104, A-QUEUE.md).
 *
 * P-96's finding: a build handed back to a person's own builder writes
 * `pr_open`, never `merged`, on `studio_changesets`; the Ship half of the same
 * mechanism (`submitStationByHand`) writes a `deployments` row with
 * `status: 'claimed'` and NO `changeset_id` at all. `releaseStates` -- the
 * spine of every list on this station -- requires a changelog entry, and a
 * changelog entry is materialized only from a MERGED changeset
 * (`trg_studio_changeset_to_changelog`). A deploy with no changeset can never
 * earn one, by construction, so it was invisible on `/ship` for the life of
 * the account: zero `claimed` deploys and zero handback rows existed when
 * P-104 was filed, so the first customer to use their own pipeline this way
 * would have found nothing where their release should be.
 *
 * `shipListItems` widens "What shipped" to include these rows, sourced from
 * `deployRows` the page already reads (`listDeployments`, no `changesetId`
 * filter, so `changeset_id IS NULL` rows were already in hand and simply
 * dropped on the floor). Each renders `handRecordedLine()`'s own P-96 sentence
 * and is never offered the announce control -- `claimed` exists precisely so
 * a pasted address can never stand as proof that something shipped.
 */

const SHIP = join(import.meta.dir, "..", "_authenticated.ship.tsx");

function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const shipSrc = code(SHIP);

function note(over: Partial<ChangelogEntry> & { changeset_id: string }): ChangelogEntry {
  return {
    id: `cl-${over.changeset_id}`,
    product_id: null,
    prd_id: null,
    title: "A release",
    body: "",
    pr_number: null,
    pr_url: null,
    released_at: "2026-08-01T00:00:00.000Z",
    ...over,
  };
}

/** Unlike ship-can-ship.test.ts's `dep`, `changeset_id` defaults to null --
 *  this file's whole subject is the deploy that never gets one. */
function handback(over: Partial<ShipDeployment> = {}): ShipDeployment {
  return {
    id: `dep-${Math.random()}`,
    changeset_id: null,
    environment: "production",
    status: "claimed",
    deploy_url: "https://example.com/it-shipped",
    deployed_at: "2026-09-01T00:00:00.000Z",
    created_at: "2026-09-01T00:00:00.000Z",
    ...over,
  };
}

describe("handbackDeploys", () => {
  it("keeps only deployments with no changeset", () => {
    const withCs: ShipDeployment = { ...handback(), changeset_id: "cs-1" };
    const out = handbackDeploys([withCs, handback({ id: "d1" })]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("d1");
  });

  it("returns nothing when every deploy has a changeset", () => {
    expect(handbackDeploys([{ ...handback(), changeset_id: "cs-1" }])).toEqual([]);
  });

  it("returns nothing for an empty read", () => {
    expect(handbackDeploys([])).toEqual([]);
  });
});

describe("shipListItems (the guard: a fixture with one handback deploy renders one row)", () => {
  it("carries the one handback deploy as its own row when nothing has merged", () => {
    const items = shipListItems([], [handback({ id: "solo" })]);
    expect(items).toEqual([{ kind: "handback", deploy: expect.objectContaining({ id: "solo" }) }]);
  });

  it("carries a real release as its own row, unchanged, when there is no handback", () => {
    const n = note({ changeset_id: "cs-1" });
    const items = shipListItems([n], []);
    expect(items).toEqual([{ kind: "release", entry: n }]);
  });

  it("is empty when neither a release nor a handback deploy exists", () => {
    expect(shipListItems([], [])).toEqual([]);
  });

  it("orders a release and a handback deploy together, newest first", () => {
    const older = note({ changeset_id: "cs-1", released_at: "2026-08-01T00:00:00.000Z" });
    const newer = handback({ id: "newer", deployed_at: "2026-09-01T00:00:00.000Z" });
    const items = shipListItems([older], [newer]);
    expect(items.map((i) => (i.kind === "release" ? i.entry.changeset_id : i.deploy.id))).toEqual([
      "newer",
      "cs-1",
    ]);
  });

  it("does not drop a deploy with no timestamp at all; it sorts last, not invisible", () => {
    const dated = note({ changeset_id: "cs-1" });
    const undated = handback({ id: "no-time", deployed_at: null, created_at: null });
    const items = shipListItems([dated], [undated]);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.kind)).toContain("handback");
  });
});

describe("the handback row on the page (source-level, no router or query client)", () => {
  /** The handback branch of the "What shipped" map, from its own `if` to the
   *  release branch's `const e = item.entry;` that follows it. Bounded rather
   *  than trusted, the same discipline ship-has-an-agent.test.ts's slicing
   *  uses: an unfound end would silently make every assertion below read the
   *  whole file and pass for the wrong reason. */
  function handbackBranch(): string {
    const start = shipSrc.indexOf('if (item.kind === "handback")');
    expect(start, "the handback branch is gone from the What shipped map").toBeGreaterThan(-1);
    const end = shipSrc.indexOf("const e = item.entry;", start);
    expect(end, "the handback branch has no release branch after it to bound the slice").toBeGreaterThan(
      start,
    );
    return shipSrc.slice(start, end);
  }

  it("renders handRecordedLine(), the P-96 sentence, not an invented one", () => {
    expect(handbackBranch()).toMatch(/sub=\{handRecordedLine\(\)\}/);
  });

  it("never offers the announce control -- no mayAnnounce, no startFrom, on this row", () => {
    const branch = handbackBranch();
    expect(branch).not.toMatch(/mayAnnounce/);
    expect(branch).not.toMatch(/startFrom/);
  });

  it("still opens the pasted address when there is one, because a person did tell us where to look", () => {
    const branch = handbackBranch();
    expect(branch).toMatch(/d\.deploy_url/);
    expect(branch).toMatch(/window\.open/);
  });

  it("keys the row in its own namespace, so a deploy id can never collide with a changelog id", () => {
    expect(handbackBranch()).toMatch(/key=\{`deploy-\$\{d\.id\}`\}/);
  });
});

describe("What shipped reads its emptiness off the widened list, not off notes alone", () => {
  it("the empty branch and the pagination both key off shipItems, not notes", () => {
    // A workspace with a handback deploy and no merged release must not read
    // "Nothing has shipped yet." off `notes.length === 0` alone -- that was
    // exactly the shape that made these deploys invisible in the first place.
    const shipRegionStart = shipSrc.indexOf('title="What shipped"');
    expect(shipRegionStart).toBeGreaterThan(-1);
    const shipRegionEnd = shipSrc.indexOf("</Region>", shipRegionStart);
    const region = shipSrc.slice(shipRegionStart, shipRegionEnd);
    expect(region).toMatch(/shipItems\.length === 0/);
    expect(region).toMatch(/allNotes \? shipItems : shipItems\.slice\(0, VISIBLE\)/);
    expect(region).toMatch(/total=\{shipItems\.length\}/);
  });
});
