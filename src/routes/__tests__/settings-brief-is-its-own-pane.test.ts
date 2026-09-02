/**
 * P-23: Brief split out of the fused Workspace pane, into its own group,
 * its own door, and its own file.
 *
 * WHY THIS FILE EXISTS. Splitting a fused component is exactly the shape of
 * defect `settings-money-is-one-door.test.ts` guards against for a fold: the
 * danger is entirely in what the ROUTE does with the pieces afterward. A
 * regroup that moves `brief` to its own `SectionId` and stops there, without
 * ever wiring `{active === "brief" && ...}` to something real, would pass
 * `settings-sections.test.ts` (which knows nothing about the route) while
 * leaving the new door open onto nothing -- this repo's most common defect by
 * its own count.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { stripComments } from "@/__tests__/meridian-ratchet-scan";

const route = readFileSync(new URL("../_authenticated.settings.tsx", import.meta.url), "utf8");
const shipping = stripComments(route);
const briefSection = readFileSync(
  new URL("../../components/settings/BriefSection.tsx", import.meta.url),
  "utf8",
);

describe("Brief renders as its own pane, not folded into Workspace", () => {
  it("the route imports BriefSection from its own file under components/settings", () => {
    expect(shipping).toContain('import { BriefSection } from "@/components/settings/BriefSection"');
  });

  it('active === "brief" mounts BriefSection, and active === "workspace" no longer carries it', () => {
    expect(shipping).toContain('active === "brief" && <BriefSection />');
  });

  it("WorkspaceSection takes no scrollToBrief prop any more - brief is a real door now, nothing to scroll to", () => {
    expect(shipping).not.toContain("scrollToBrief");
    expect(shipping).not.toContain('rawSection === "brief"');
  });

  it("the extracted file actually renders the brief editor, not an empty shell", () => {
    expect(briefSection).toContain("export function BriefSection()");
    expect(briefSection).toContain('title="Brief and voice"');
    expect(briefSection).toContain('title="What the crew reads before it acts"');
    // The five fields plus the voice anchor - the whole point of the pane.
    expect(briefSection).toContain("BRIEF_FIELDS.map");
    expect(briefSection).toContain('id="voice-anchor"');
  });
});
