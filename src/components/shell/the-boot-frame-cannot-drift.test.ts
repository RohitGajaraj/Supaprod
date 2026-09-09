/**
 * ── THE BOOT FRAME IS A SECOND COPY OF THE SHELL, SO IT IS DERIVED HERE ────
 *
 * `BootShell.tsx` paints the product's frame into the server's HTML, because
 * for an authenticated URL that HTML is otherwise empty: measured on
 * deployment 7ba7499d, 35 KB with no rail and no title, then 123 scripts and
 * 470 KB before first contentful paint. That window was the black field.
 *
 * The stylesheet is render-blocking too, so the frame cannot get its colours
 * from `meridian.css` -- it would paint unstyled for exactly the window it
 * exists to fill. Every colour is therefore `var(--token, <literal>)`, and the
 * literal is a second copy of a value this repo is right to distrust.
 *
 * These make the copy safe by DERIVATION rather than by anybody remembering:
 * the fallbacks are checked against the stylesheets that own them, and a
 * redesign that moves a token fails here instead of leaving a boot frame in
 * last season's colours. A duplicate with a guard is a cache. Without one it
 * is a bug waiting for a redesign.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  BOOT_PUBLIC_PREFIXES,
  BOOT_RAIL_KEY,
  BOOT_SHELL_ID,
  BOOT_TOKENS,
  bootFrameScript,
} from "./BootShell";

const ROOT = join(import.meta.dir, "..", "..");
const CSS = [
  readFileSync(join(ROOT, "styles", "meridian.css"), "utf8"),
  readFileSync(join(ROOT, "styles", "shell.css"), "utf8"),
].join("\n");

describe("every fallback still matches the token it stands in for", () => {
  for (const [name, { token, value }] of Object.entries(BOOT_TOKENS)) {
    it(`${name} (${token})`, () => {
      /*
       * The declaration as it is written, so this fails on a CHANGED value and
       * not merely on a missing one. If a redesign moves `--mrd-sheet`, the
       * boot frame would otherwise keep painting the old chrome for the first
       * second of every cold arrival, which is the most visible second there
       * is and the least likely to be screenshotted.
       */
      expect(CSS).toContain(`${token}: ${value}`);
    });
  }
});

describe("no public page can be given the app's dark frame", () => {
  /*
   * The marketing site is parchment and composes itself. Flashing a dark rail
   * in front of it would be a new defect rather than a fix, and the list in
   * `BootShell.tsx` is exactly the kind of hand-written enumeration this repo
   * has been bitten by before -- `DECISION_SOURCES` was four stale strings for
   * a year, so 50 decisions could not be filtered to at all.
   *
   * So the list is not trusted: the routes directory is read, and a public
   * route that nothing covers fails here.
   */
  const ROUTES = join(ROOT, "routes");
  const publicRoutes = readdirSync(ROUTES)
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => !f.startsWith("_authenticated"))
    .filter((f) => !f.startsWith("__"))
    .filter((f) => !f.includes(".test."))
    .map((f) => f.replace(/\.tsx?$/, ""));

  it("covers every public route file with a prefix", () => {
    const uncovered = publicRoutes.filter((name) => {
      // `index` is "/", which the script returns on before it reads this list.
      if (name === "index") return false;
      // `d.$slug` -> "/d/", `join.$token` -> "/join/": a param segment means
      // the prefix is everything before it. `[.]lovable.oauth.consent` is
      // TanStack's escape for a literal leading dot and routes to
      // `/.lovable/oauth/consent`, which is why the segment is unescaped
      // before the first dot is taken as a separator.
      const path =
        "/" +
        name
          .replace(/^\[\.\]/, ".")
          .split(".")
          .slice(0, name.startsWith("[.]") ? 2 : 1)
          .join(".");
      return !BOOT_PUBLIC_PREFIXES.some(
        (p) => path === p || path.startsWith(p) || p.startsWith(path + "/"),
      );
    });
    expect({ uncovered }).toEqual({ uncovered: [] });
  });

  it("claims no prefix that is actually an authenticated surface", () => {
    // The mirror. A list that simply grew to cover everything would pass the
    // test above and switch the frame off for the whole app.
    const authed = readdirSync(ROUTES)
      .filter((f) => f.startsWith("_authenticated.") && /\.tsx$/.test(f))
      .map(
        (f) =>
          "/" +
          f
            .replace(/^_authenticated\./, "")
            .replace(/\.tsx$/, "")
            .split(".")[0],
      )
      .filter((p) => p !== "/" && p !== "/index");
    const wrongly = authed.filter((p) => BOOT_PUBLIC_PREFIXES.some((pre) => p === pre));
    expect({ wrongly }).toEqual({ wrongly: [] });
  });
});

/**
 * ── THE SCRIPT IS RUN, NOT READ ───────────────────────────────────────────
 *
 * It decides before any framework exists, on a document nobody can inspect
 * afterwards, so a grep over its source would prove nothing about what it
 * does. It is executed here against a fake window.
 */
function runScript(opts: {
  path: string;
  session?: boolean;
  rail?: string | null;
  hasElement?: boolean;
}) {
  const el = {
    attrs: {} as Record<string, string>,
    hidden: true,
    setAttribute(k: string, v: string) {
      this.attrs[k] = v;
    },
    removeAttribute(k: string) {
      if (k === "hidden") this.hidden = false;
      else delete this.attrs[k];
    },
  };
  const store: Record<string, string> = {};
  if (opts.session) store["sb-abcdefgh-auth-token"] = "{}";
  if (opts.rail != null) store[BOOT_RAIL_KEY] = opts.rail;
  const keys = Object.keys(store);
  const scope = {
    location: { pathname: opts.path },
    localStorage: {
      length: keys.length,
      key: (i: number) => keys[i] ?? null,
      getItem: (k: string) => store[k] ?? null,
    },
    document: {
      getElementById: (id: string) =>
        id === BOOT_SHELL_ID && opts.hasElement !== false ? el : null,
    },
  };
  new Function("location", "localStorage", "document", bootFrameScript())(
    scope.location,
    scope.localStorage,
    scope.document,
  );
  return el;
}

describe("the frame is revealed only where it belongs", () => {
  it("shows on an authenticated path for a signed-in reader", () => {
    expect(runScript({ path: "/outcomes", session: true }).hidden).toBe(false);
  });

  it("stays hidden for a signed-OUT reader deep linking into the app", () => {
    // They are about to be redirected to sign in. A dark app frame in front of
    // the login page would be a worse first impression than the one this fixes.
    expect(runScript({ path: "/outcomes", session: false }).hidden).toBe(true);
  });

  it("stays hidden on the landing page, signed in or not", () => {
    expect(runScript({ path: "/", session: true }).hidden).toBe(true);
    expect(runScript({ path: "/", session: false }).hidden).toBe(true);
  });

  it("stays hidden on a marketing page a signed-in reader opened", () => {
    for (const p of ["/pricing", "/security", "/demo", "/d/some-slug"]) {
      expect({ p, hidden: runScript({ path: p, session: true }).hidden }).toEqual({
        p,
        hidden: true,
      });
    }
  });

  it("carries the rail the person actually chose, so it does not resize under them", () => {
    // A shell that changes width a beat after it appears is the opposite of
    // composed, and `AppFrame` persists this exact key.
    expect(runScript({ path: "/outcomes", session: true, rail: "1" }).attrs["data-rail"]).toBe(
      "narrow",
    );
    expect(
      runScript({ path: "/outcomes", session: true, rail: "0" }).attrs["data-rail"],
    ).toBeUndefined();
    // Absent means wide: the auto-collapse was retired and the default is named.
    expect(runScript({ path: "/outcomes", session: true }).attrs["data-rail"]).toBeUndefined();
  });

  it("fails closed when anything at all is unexpected", () => {
    // No element in the document: it must not throw, because it runs inline
    // and an exception here would stop the scripts after it.
    expect(() => runScript({ path: "/outcomes", session: true, hasElement: false })).not.toThrow();
  });
});
