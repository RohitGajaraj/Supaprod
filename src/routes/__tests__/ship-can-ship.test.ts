import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChangelogEntry } from "@/lib/changelog.functions";
import type { AppliedChange } from "@/lib/studio.functions";
import {
  absenceSentence,
  isLive,
  isReadyToPromote,
  promoteAbsence,
  readyToPromote,
  releaseStates,
  unlistedMerges,
  whereItIs,
  type ShipDeployment,
} from "@/components/ship/ShipRecord";

/**
 * A PERSON MUST BE ABLE TO SHIP FROM SHIP, and must never be offered a shipping
 * act the server will refuse.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-06. The nav had always called
 * this station "Preview to production." The three acts it names -- promote,
 * watch, roll back -- lived only inside the Changes tab of one Build run, so
 * the door advertised a room the room did not contain, and the only route to
 * production was to remember which run had produced the change.
 *
 * WHY A TEST AND NOT A CAREFUL REVIEW. Every rule below can be broken by a
 * change that typechecks perfectly and reads fine in a diff, and each break
 * produces one of the two failures that actually cost something on this
 * surface:
 *
 *   A CONTROL THAT PROMISES AN ACT IT CANNOT PERFORM. `promoteToProduction`
 *   throws without a successful preview and refuses anything not merged. A
 *   promote button drawn over either is a click that fails after the person has
 *   already decided.
 *
 *   A SECOND PRODUCTION DEPLOY OF A COMMIT ALREADY GOING OUT. The deploy list
 *   this surface reads is a bounded page, so an older release's production row
 *   can fall off the end of it while the changelog still knows the address. If
 *   only the page is trusted, the surface offers a promote over something that
 *   has been live for a month.
 *
 * The rollback's second door used to be checked against ChangesPanel's own
 * prompt, character for character (P-14, A-QUEUE.md, R-35): that file was
 * deleted with the run page it alone belonged to, and its prompt went with
 * it, so the door this station opens no longer has a first door to match.
 */

/**
 * THE ROUTE THIS FILE READS MOVED (P-14b, A-QUEUE.md, 2026-09-09). `/ship` is a
 * redirect to `/outcomes?tab=artifacts` now, and every region it drew is
 * `src/components/ship/ShipRecord.tsx`, mounted above the artifacts shelf. Not
 * one line of the body changed in the fold, so every assertion below is the one
 * it was, pointed at the file that holds the code.
 */
const SHIP = join(import.meta.dir, "..", "..", "components", "ship", "ShipRecord.tsx");

/** Source with comments removed, so a rule can never be satisfied by prose
 *  ABOUT the rule. Same treatment ship-has-an-agent.test.ts uses. */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const shipSrc = code(SHIP);

/** A changelog entry is only ever materialized from a MERGED changeset
 *  (changelog.ts, shouldPublishChangelog), which is why the release list is
 *  built from these and not from the deploy rows. */
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

function dep(over: Partial<ShipDeployment> & { changeset_id: string }): ShipDeployment {
  return {
    id: `dep-${Math.random()}`,
    environment: "preview",
    status: "success",
    deploy_url: "https://preview.example.com",
    deployed_at: "2026-08-01T01:00:00.000Z",
    created_at: "2026-08-01T01:00:00.000Z",
    ...over,
  };
}

describe("releaseStates joins the changelog to the deploy record", () => {
  it("carries the newest successful address per environment", () => {
    const [s] = releaseStates(
      [note({ changeset_id: "cs-1", title: "Checkout v2" })],
      [
        dep({
          changeset_id: "cs-1",
          deploy_url: "https://old-preview",
          deployed_at: "2026-08-01T00:10:00.000Z",
        }),
        dep({
          changeset_id: "cs-1",
          deploy_url: "https://new-preview",
          deployed_at: "2026-08-01T05:00:00.000Z",
        }),
        dep({
          changeset_id: "cs-1",
          environment: "production",
          deploy_url: "https://shop.example.com",
          deployed_at: "2026-08-01T06:00:00.000Z",
        }),
      ],
    );
    expect(s.title).toBe("Checkout v2");
    expect(s.previewUrl).toBe("https://new-preview");
    expect(s.productionUrl).toBe("https://shop.example.com");
    expect(s.productionAt).toBe("2026-08-01T06:00:00.000Z");
    expect(isLive(s)).toBe(true);
  });

  it("never borrows another release's deploy rows", () => {
    const [s] = releaseStates(
      [note({ changeset_id: "cs-1" })],
      [dep({ changeset_id: "cs-2", environment: "production", deploy_url: "https://other" })],
    );
    expect(s.productionUrl).toBeNull();
    expect(s.previewUrl).toBeNull();
  });

  it("treats a success with no recorded address as no address", () => {
    // A door needs somewhere to go. Rendering a success with a null deploy_url
    // as a link produces a link to nowhere.
    const [s] = releaseStates(
      [note({ changeset_id: "cs-1" })],
      [dep({ changeset_id: "cs-1", deploy_url: null })],
    );
    expect(s.previewUrl).toBeNull();
    expect(isReadyToPromote(s)).toBe(false);
  });

  it("skips a changelog entry with no changeset behind it", () => {
    // Nothing to promote and nothing to roll back: promoteToProduction and
    // rollbackRelease are both keyed on a changeset id.
    expect(releaseStates([note({ changeset_id: "" })], [])).toHaveLength(0);
  });

  it("orders newest release first, whatever order the reads arrived in", () => {
    const states = releaseStates(
      [
        note({ changeset_id: "old", released_at: "2026-07-01T00:00:00.000Z" }),
        note({ changeset_id: "new", released_at: "2026-08-05T00:00:00.000Z" }),
      ],
      [],
    );
    expect(states.map((s) => s.changesetId)).toEqual(["new", "old"]);
  });
});

describe("isReadyToPromote draws the button only where the click will work", () => {
  it("is ready with a successful preview and nothing in production", () => {
    const [s] = releaseStates([note({ changeset_id: "cs-1" })], [dep({ changeset_id: "cs-1" })]);
    expect(isReadyToPromote(s)).toBe(true);
  });

  it("is not ready with no preview at all", () => {
    // promoteChangesetToProductionCore throws: "No successful preview deploy
    // exists for this changeset yet."
    const [s] = releaseStates([note({ changeset_id: "cs-1" })], []);
    expect(isReadyToPromote(s)).toBe(false);
  });

  it("is not ready once production is serving it", () => {
    const [s] = releaseStates(
      [note({ changeset_id: "cs-1" })],
      [
        dep({ changeset_id: "cs-1" }),
        dep({ changeset_id: "cs-1", environment: "production", deploy_url: "https://live" }),
      ],
    );
    expect(isReadyToPromote(s)).toBe(false);
    expect(isLive(s)).toBe(true);
  });

  it("is not ready when the deploy page has aged out but the changelog knows the address", () => {
    // THE PAGINATION GUARD. listDeployments returns a bounded page of the newest
    // rows; listChangelog resolves production_url server-side with no such
    // window. Trusting only the page offers a promote over a month-old release.
    const [s] = releaseStates(
      [note({ changeset_id: "cs-1", production_url: "https://live.example.com" })],
      [dep({ changeset_id: "cs-1" })],
    );
    expect(s.productionUrl).toBe("https://live.example.com");
    expect(isReadyToPromote(s)).toBe(false);
    expect(isLive(s)).toBe(true);
  });

  it("offers the retry after a failed production deploy", () => {
    const [s] = releaseStates(
      [note({ changeset_id: "cs-1" })],
      [
        dep({ changeset_id: "cs-1" }),
        dep({
          changeset_id: "cs-1",
          environment: "production",
          status: "failure",
          deploy_url: null,
        }),
      ],
    );
    expect(isReadyToPromote(s)).toBe(true);
  });

  it("refuses a second promote while one is already running or already landed", () => {
    // Two production deploys of one commit racing each other is the failure
    // this prevents, and "success with no address" is the sneakiest case: it
    // has already reached customers and has no URL to prove it.
    for (const status of ["pending", "in_progress", "unknown", "success"]) {
      const [s] = releaseStates(
        [note({ changeset_id: "cs-1" })],
        [
          dep({ changeset_id: "cs-1" }),
          dep({ changeset_id: "cs-1", environment: "production", status, deploy_url: null }),
        ],
      );
      expect(isReadyToPromote(s)).toBe(false);
    }
  });
});

/*
 * P-124 (A-QUEUE.md): a successful promote and the Live-releases "Roll back"
 * button for the same release were both visible at once. `ready` and `live`
 * both derive from `states = releaseStates(notes, deployRows)`, and the two
 * queries that feed them refetch asynchronously after the mutation's
 * `invalidateQueries` -- for one window, `states` still calls a just-promoted
 * changeset ready. `readyToPromote` closes that window by excluding a
 * changeset id the instant its own promote resolves, before any refetch.
 */
describe("readyToPromote settles a card in place without waiting on a refetch", () => {
  it("excludes a changeset the moment it is marked just-promoted, even though states still call it ready", () => {
    const [s] = releaseStates([note({ changeset_id: "cs-1" })], [dep({ changeset_id: "cs-1" })]);
    expect(isReadyToPromote(s)).toBe(true);
    expect(readyToPromote([s], new Set(["cs-1"]))).toEqual([]);
  });

  it("leaves every other ready release alone", () => {
    const states = releaseStates(
      [note({ changeset_id: "cs-1" }), note({ changeset_id: "cs-2" })],
      [dep({ changeset_id: "cs-1" }), dep({ changeset_id: "cs-2" })],
    );
    const result = readyToPromote(states, new Set(["cs-1"]));
    expect(result.map((s) => s.changesetId)).toEqual(["cs-2"]);
  });

  it("agrees with isReadyToPromote alone once the set is empty", () => {
    const states = releaseStates([note({ changeset_id: "cs-1" })], [dep({ changeset_id: "cs-1" })]);
    expect(readyToPromote(states, new Set())).toEqual(states.filter(isReadyToPromote));
  });
});

describe("whereItIs answers for every deploy status the record can hold", () => {
  const base = (status: string | null, prodUrl: string | null = null) =>
    releaseStates(
      [note({ changeset_id: "cs-1" })],
      [
        dep({ changeset_id: "cs-1" }),
        ...(status
          ? [
              dep({
                changeset_id: "cs-1",
                environment: "production",
                status,
                deploy_url: prodUrl,
              }),
            ]
          : []),
      ],
    )[0];

  it("names the production address when there is one", () => {
    const at = whereItIs(base("success", "https://live"));
    expect(at.address).toBe("https://live");
    expect(at.state).toBe("In production");
  });

  it("never reports an attempted deploy as an absent one", () => {
    // deployments.ts normalizes every provider vocabulary onto exactly these
    // five. A status with no sentence would fall through to "no deploy is on
    // the record", which is the product claiming LESS than it did.
    for (const status of ["failure", "pending", "in_progress", "unknown", "success"]) {
      const at = whereItIs(base(status));
      expect(at.state).not.toBe("No deploy is on the record");
      expect(at.state.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the preview address while production is not serving", () => {
    expect(whereItIs(base("failure")).address).toBe("https://preview.example.com");
    expect(whereItIs(base(null)).state).toBe("Preview only, nobody has promoted it");
  });

  it("says so plainly when nothing has deployed", () => {
    const [s] = releaseStates([note({ changeset_id: "cs-1" })], []);
    const at = whereItIs(s);
    expect(at.address).toBeNull();
    expect(at.state).toBe("No deploy is on the record");
  });
});

describe("promoteAbsence explains a missing button instead of greying one out", () => {
  const ready = releaseStates([note({ changeset_id: "a" })], [dep({ changeset_id: "a" })]);
  const liveOnly = releaseStates([note({ changeset_id: "b", production_url: "https://live" })], []);
  const merged = releaseStates([note({ changeset_id: "c" })], []);

  it("says nothing where the Gate, the Loading or the Failed already speaks", () => {
    expect(
      absenceSentence(promoteAbsence({ reading: false, failed: false, states: ready })),
    ).toBeNull();
    expect(
      absenceSentence(promoteAbsence({ reading: true, failed: false, states: [] })),
    ).toBeNull();
    expect(
      absenceSentence(promoteAbsence({ reading: false, failed: true, states: [] })),
    ).toBeNull();
  });

  it("puts a failed read ahead of a pending one", () => {
    // A spinner over a failure is the product waiting for something that is
    // never coming.
    expect(promoteAbsence({ reading: true, failed: true, states: [] }).kind).toBe("failed");
  });

  it("distinguishes nothing merged, everything already live, and no preview yet", () => {
    expect(promoteAbsence({ reading: false, failed: false, states: [] }).kind).toBe("no-releases");
    expect(promoteAbsence({ reading: false, failed: false, states: liveOnly }).kind).toBe(
      "all-live",
    );
    expect(promoteAbsence({ reading: false, failed: false, states: merged }).kind).toBe(
      "no-preview",
    );
    for (const states of [[], liveOnly, merged]) {
      const sentence = absenceSentence(promoteAbsence({ reading: false, failed: false, states }));
      expect(sentence).toBeTruthy();
      expect((sentence as string).length).toBeGreaterThan(20);
    }
  });

  it("counts the ready ones, because the Gate focuses one and the rest need their own door", () => {
    const many = releaseStates(
      [note({ changeset_id: "a" }), note({ changeset_id: "b" })],
      [dep({ changeset_id: "a" }), dep({ changeset_id: "b" })],
    );
    expect(promoteAbsence({ reading: false, failed: false, states: many })).toEqual({
      kind: "ready",
      count: 2,
    });
  });
});

/**
 * A MERGE WITH NO RELEASE NOTES MUST STILL HAVE A ROW, or the capture door is
 * unreachable in the one case it was written for.
 *
 * THE LOOP, which is why this is a launch blocker and not a polish item. Every
 * act on this station hangs off `releaseStates`, which walks CHANGELOG entries.
 * An entry is materialized only from a merged changeset whose `release_notes`
 * are non-empty, and for a repo Supaprod does not host the only writer of those
 * notes is ci-poll-tick, and only AFTER a capture succeeds. The cron gives up 60
 * minutes after the merge. A slower pipeline is therefore never captured, never
 * written up, never listed, and never offered the button whose own doc calls
 * itself "the only way to ask after the cron has stopped asking".
 */
function merged(over: Partial<AppliedChange> & { id: string }): AppliedChange {
  return {
    product_id: null,
    mission_id: null,
    prd_id: null,
    mission_title: null,
    title: "A merged change",
    repo: "acme/app",
    branch: null,
    pr_url: null,
    pr_number: null,
    file_count: 1,
    merged_at: "2026-08-01T00:00:00.000Z",
    ...over,
  };
}

describe("a merge the changelog cannot see still reaches the station", () => {
  it("returns the merges with no release entry, and only those", () => {
    const out = unlistedMerges(
      [note({ changeset_id: "written-up" })],
      [merged({ id: "written-up" }), merged({ id: "silent" })],
    );
    expect(out.map((c) => c.id)).toEqual(["silent"]);
  });

  it("keeps the server's newest-first order rather than inventing one", () => {
    const out = unlistedMerges([], [merged({ id: "a" }), merged({ id: "b" }), merged({ id: "c" })]);
    expect(out.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("never counts an entry that carries no changeset as covering a merge", () => {
    // changelog_entries.changeset_id is NULLABLE, so an entry written by
    // anything other than the trigger cannot be spent as proof that some merge
    // is listed.
    const out = unlistedMerges([note({ changeset_id: "" })], [merged({ id: "silent" })]);
    expect(out.map((c) => c.id)).toEqual(["silent"]);
  });

  it("carries both doors on the row, because neither one alone lists the merge", () => {
    // `captureDeployments` files deploy rows and writes nothing to the
    // changelog; `generateReleaseNotes` writes the column the changelog trigger
    // fires on. A row with only the capture on it leaves the change invisible
    // here after a successful press.
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(/useServerFn\(listAppliedChanges\)/);
    expect(flat).toMatch(/useServerFn\(generateReleaseNotes\)/);
    expect(flat).toMatch(/writeNotes\.mutate\(\{ changesetId: c\.id, title: c\.title \}\)/);
    expect(flat).toMatch(/check\.mutate\(\{ changesetId: c\.id, title: c\.title \}\)/);
  });

  it("spends no second request on a read the release document already makes", () => {
    // WhatShipped reads listAppliedChanges under ["what-shipped-applied",
    // workspaceId ?? null] and uses exactly one row of it. A key or an argument
    // that differed by a character would be two reads of one table on one
    // screen, and two answers that could disagree.
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(/queryKey: \["what-shipped-applied", wid \|\| null\]/);
    expect(flat).toMatch(
      /queryFn: \(\) => fApplied\(\{ data: wid \? \{ workspaceId: wid \} : \{\} \}\)/,
    );
  });
});

describe("no sentence on this station asserts absence from a read that answered", () => {
  it("stops saying nothing has merged when merges are waiting on their notes", () => {
    // The changelog being empty is not the read that can answer "has anything
    // merged": that is a claim about studio_changesets made from a read of
    // changelog_entries.
    const none = promoteAbsence({ reading: false, failed: false, states: [] });
    expect(absenceSentence(none, 0)).toMatch(/^Nothing has merged yet/);
    expect(absenceSentence(none, 2)).toMatch(/2 changes have merged with no release notes/);
    expect(absenceSentence(none, 1)).toMatch(/^One change has merged with no release notes/);
  });

  it("hedges rather than picking a side while the merge list is unread", () => {
    const none = promoteAbsence({ reading: false, failed: false, states: [] });
    const hedged = absenceSentence(none, null) as string;
    expect(hedged).not.toMatch(/Nothing has merged yet/);
    expect(hedged).toMatch(/has not been read/);
  });

  it("keeps the conditional hosting promise in every one of those sentences", () => {
    // Kept word for word rather than deleted: it is true whichever branch the
    // reader lands in, and it is the only thing that tells a BYO customer no
    // preview is coming.
    const none = promoteAbsence({ reading: false, failed: false, states: [] });
    for (const unlisted of [null, 0, 3]) {
      expect(absenceSentence(none, unlisted)).toContain("For a repo Supaprod hosts");
    }
  });

  it("branches the deploy-record empty state on the deploy rows it is holding", () => {
    // "No deploy is on the record yet" was drawn from states.length === 0,
    // which means the CHANGELOG is empty, over rows sitting in deployRows.
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(/states\.length === 0 \? \( deployRows\.length > 0 \?/);
    expect(flat).toContain("No deploy is on the record yet.");
  });
});

describe("the role behind the announcement controls is a read like any other", () => {
  it("waits for it, retries it, and never draws its absence as a refusal", () => {
    // Every announcement control hangs off selfRole. The read had no wait, no
    // error branch and no sentence, so a failed listWorkspaceMembers rendered
    // as "you are not allowed to announce": a question with nothing under it.
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(/const membersReading = stillWaiting\(members\)/);
    /* PINS THE CLAIM, NOT THE SPELLING. This read `<Failed`, the retired
       primitive's name, so the Meridian port broke it by renaming a component
       while satisfying the requirement completely. What has to be true is that
       a lost role read renders a FAILURE that carries the re-read -- not that
       the failure is spelled any particular way. `ReadFailed` and
       `ReadFailedLine` are the boxed and bare halves of the same fact, and
       either one is correct here depending on whether a region is around it. */
    expect(flat).toMatch(
      /members\.isError \? \( <ReadFailed(Line)? [^>]*onRetry=\{\(\) => void members\.refetch\(\)\}/,
    );
    // A read that ANSWERED with no membership row is not a failure and gets its
    // own sentence.
    expect(flat).toMatch(
      /const roleUnknown = !membersReading && !members\.isError && role === null/,
    );
    /*
     * PINS THE CLAIM, NOT THE SPELLING.
     *
     * This asserted the literal `lines={roleLines()}`. P-53 moved both cards
     * off `Gate` (one to `Quiet` plus a plain heading, the other to a plain
     * heading with no named component at all, since neither is a real binary
     * ask), so `lines=` does not exist anywhere in this file any more. The
     * requirement it was protecting still holds: a reader who cannot see the
     * controls always learns WHY, which means `roleLines()` must actually be
     * CALLED (not merely defined) everywhere the controls it explains can be
     * missing. That is asserted directly instead of through the prop syntax
     * that carried it before.
     *
     * The promote confirmation ask is deliberately not counted: it is about a
     * release, not about the reader's role, and does not compose `roleLines()`.
     */
    // Comments explaining the reuse also say "roleLines()" in prose, so they
    // are stripped first -- the same discipline `today-states-its-wait.test.ts`
    // and this repo's other source-as-text guards use, rather than a naive
    // count that a comment could quietly inflate or a rename could deflate.
    const stripped = shipSrc.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    const occurrences = stripped.match(/roleLines\(\)/g) ?? [];
    // One is the declaration (`function roleLines(): React.ReactNode[]`);
    // every remaining occurrence is a real render site.
    expect(occurrences.length - 1).toBe(2);
  });

  it("never states who the reader is waiting on from a role read that did not answer", () => {
    // The SENTENCE that reads `canPublish` as a fact about the reader. It is
    // false in three different situations -- you may not, your role did not
    // load, and the read answered with no membership row -- so a bare "waiting
    // on an owner or an admin" told an owner whose `listWorkspaceMembers`
    // timed out that they lack a permission they hold. A hedge is not a retry:
    // the retry is the `ReadFailed` above the desk, and this is only the
    // assertion stopping.
    //
    // P-53 removed the SECOND copy of this hedge this test used to pin
    // separately (it lived in the day-one Gate's own `lines`, worded
    // slightly differently from `roleLines()`'s own sentence): that site now
    // calls `roleLines()` directly, so there is exactly one wording of "your
    // role did not load" in the file, checked by the previous test.
    //
    // P-53 also collapsed the four-way `canPublish` ternary into two branches
    // at the top level (the true case is its own `Ask`; this file only
    // reaches the ones below when it is false), so `members.isError ||
    // roleUnknown` now sits directly under `call.status === "pending" ?`
    // rather than under a `canPublish`-false `:` -- same fact, one fewer
    // nested branch to reach it through.
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(
      /\? members\.isError \|\| roleUnknown \? `"\$\{call\.title\}" is waiting to be published\.`/,
    );
    // The ordinary sentences survive word for word, for a role that answered.
    expect(flat).toContain("is waiting on an owner or an admin.`");
    expect(flat).toContain('"An owner or an admin writes the first one."');
  });
});

describe("the station reaches the shipping acts it is named for", () => {
  it("calls the promote that already existed, rather than a second deploy path", () => {
    expect(shipSrc).toMatch(
      /import \{ listDeployments, promoteToProduction \} from "@\/lib\/deployments\.functions"/,
    );
    expect(shipSrc).toMatch(/useServerFn\(promoteToProduction\)/);
    expect(shipSrc).toMatch(/useServerFn\(rollbackRelease\)/);
    expect(shipSrc).toMatch(/useServerFn\(listDeployments\)/);
  });

  it("watches the deploy record on a timer, so a landing preview reaches the screen", () => {
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(/useServerFn\(listDeployments\)/);
    expect(flat).toMatch(/refetchInterval: 30_000/);
  });

  it("hands a release's addresses out as links, in the one slot that can hold one", () => {
    // production_url and pr_url were printed as the prose "live in production"
    // and "PR #12" while the URLs sat unreachable in the payload. They go in
    // `action` rather than `sub` because Row renders a clickable row as a
    // <button>, and an <a> inside a <button> is markup React refuses to hydrate.
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(/<Addr href=\{e\.production_url\}>/);
    expect(flat).toMatch(/<Addr href=\{e\.pr_url\}>/);
    expect(flat).toMatch(/action=\{doors\}/);
  });

  it("scopes the changelog read to the active workspace and waits for one", () => {
    // It keyed on and passed activeWorkspace?.id (the workspace ROW, which
    // arrives late), so on first paint it asked with workspaceId: undefined and
    // listChangelog answered with the caller's DEFAULT workspace instead.
    const flat = shipSrc.replace(/\s+/g, " ");
    expect(flat).toMatch(
      /queryKey: \["changelog", wid\], queryFn: \(\) => fChangelog\(\{ data: \{ workspaceId: wid \} \}\), enabled: !!wid/,
    );
    expect(flat).not.toMatch(/workspaceId: activeWorkspace\?\.id/);
  });
});

describe("the rollback's second door is no easier to walk through than its first", () => {
  it("keeps the confirmation in front of the mutation, never beside it", () => {
    const flat = shipSrc.replace(/\s+/g, " ");
    const fn = flat.slice(flat.indexOf("async function askRollback("));
    const body = fn.slice(0, fn.indexOf("const busy ="));
    // The prompt resolves first; a null answer (dismissed) returns before the
    // mutation is reachable at all.
    expect(body.indexOf("await promptDialog(")).toBeGreaterThanOrEqual(0);
    expect(body.indexOf("await promptDialog(")).toBeLessThan(body.indexOf("rollback.mutate("));
    expect(body).toMatch(/if \(reason === null\) return;/);
  });
});
