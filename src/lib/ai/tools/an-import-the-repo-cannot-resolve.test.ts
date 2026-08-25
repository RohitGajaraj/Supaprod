/**
 * F-74. THE BRIEF WAS OBEYED ONCE AND IGNORED ONCE, ON THE SAME STATION, HOURS
 * APART — SO THE RULE BECOMES MECHANICAL.
 *
 * F-56 has told the builder *"You cannot add a dependency: nothing installs one
 * for you"* in prose since 2026-08-25. That day gave one clean trial in each
 * direction:
 *
 *  - **15:00** — it staged a test importing `bun:test`. Correct. I recorded the
 *    brief as working, and it was.
 *  - **18:11** — it staged one importing `@testing-library/react` and calling
 *    `jest.mock`. CI ran for real for the first time that day: ten steps,
 *    `Install` ok, **`Typecheck` FAILED**. The first genuine code verdict the
 *    loop had ever received, and the cause was the thing the brief forbids.
 *
 * **F-63's floor held in the same pull request** — zero files touching
 * `package.json`, `tsconfig` or `.github`, where hours earlier the same station
 * had disabled `"lint": "tsc --noEmit"` under this exact pressure. **The
 * deterministic guard held twice; the probabilistic one held once.** This file
 * is the dependency rule getting the same treatment.
 */
import { describe, expect, it } from "bun:test";

import { importedPackages } from "@/lib/ai/tools/registry.server";

describe("what counts as a package this repo must already have", () => {
  it("catches the exact import that failed CI", () => {
    const src = `import { render, screen, fireEvent } from "@testing-library/react";\nimport { AddressStep } from "./AddressStep";`;
    expect(importedPackages(src)).toEqual(["@testing-library/react"]);
  });

  it("keeps the scope on a scoped package and drops the subpath", () => {
    expect(importedPackages(`import x from "@scope/pkg/deep/sub";`)).toEqual(["@scope/pkg"]);
    expect(importedPackages(`import y from "pkg/sub";`)).toEqual(["pkg"]);
  });

  /**
   * NEVER CHECKED, because resolving them needs a module graph this seam has no
   * business building — and a wrong refusal here blocks real work.
   */
  it.each(["./AddressStep", "../types", "/abs/thing", "@/lib/spine/driver", "~/x"])(
    "ignores the repo's own code: %s",
    (spec) => {
      expect(importedPackages(`import a from "${spec}";`)).toEqual([]);
    },
  );

  it.each(["node:fs", "bun:test", "fs", "path", "crypto"])("ignores the builtin %s", (spec) => {
    expect(importedPackages(`import a from "${spec}";`)).toEqual([]);
  });

  /**
   * `import type` is erased before runtime. A missing `@types` package is a lint
   * problem, not a broken build, and refusing it would block correct work.
   */
  it("lets a type-only import through", () => {
    expect(importedPackages(`import type { Address } from "some-types-pkg";`)).toEqual([]);
  });

  it("still catches a value import on the line after a type import", () => {
    const src = `import type { A } from "types-only";\nimport { render } from "@testing-library/react";`;
    expect(importedPackages(src)).toEqual(["@testing-library/react"]);
  });

  it("catches a bare side-effect import", () => {
    expect(importedPackages(`import "polyfill-pkg";`)).toEqual(["polyfill-pkg"]);
  });

  it("reports each package once however often it is imported", () => {
    const src = `import a from "dup";\nimport b from "dup/sub";\nimport c from "dup";`;
    expect(importedPackages(src)).toEqual(["dup"]);
  });

  it("returns nothing for a file with no imports at all", () => {
    expect(importedPackages(`export const x = 1;`)).toEqual([]);
  });
});
