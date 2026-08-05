import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChangelogEntry } from "@/lib/changelog.functions";
import {
  absenceSentence,
  isLive,
  isReadyToPromote,
  promoteAbsence,
  releaseStates,
  whereItIs,
  type ShipDeployment,
} from "../_authenticated.ship";

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
 * The last rule is the rollback's: this station is the SECOND door onto an act
 * that already had one, and a second door confirmed more lightly than the first
 * means the safer path is the one nobody takes. So the prompt copy is asserted
 * identical to ChangesPanel's, character for character, rather than trusted to
 * whoever edits either file next.
 */

const SHIP = join(import.meta.dir, "..", "_authenticated.ship.tsx");
const PANEL = join(import.meta.dir, "..", "..", "components", "studio", "ChangesPanel.tsx");

/** Source with comments removed, so a rule can never be satisfied by prose
 *  ABOUT the rule. Same treatment ship-has-an-agent.test.ts uses. */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const shipSrc = code(SHIP);
const panelSrc = code(PANEL);

/** The string fields of the one `promptDialog({...})` call in a file. */
function promptFields(src: string): Record<string, string> {
  const call = /promptDialog\(\{([\s\S]*?)\n\s*\}\)/.exec(src);
  if (!call) return {};
  const out: Record<string, string> = {};
  for (const m of call[1].matchAll(/(\w+):\s*"((?:[^"\\]|\\.)*)"/g)) out[m[1]] = m[2];
  return out;
}

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
  it("asks the identical question ChangesPanel asks", () => {
    const ship = promptFields(shipSrc);
    const panel = promptFields(panelSrc);
    expect(Object.keys(panel).length).toBeGreaterThan(0);
    for (const field of ["title", "body", "label", "placeholder", "confirmLabel"]) {
      expect(ship[field]).toBe(panel[field]);
    }
  });

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
