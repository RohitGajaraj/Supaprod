# CLI Antipattern Detection

> 83 nodes · cohesion 0.07

## Key Concepts

- **detect-antipatterns.mjs** (60 connections) — `.kiro/skills/impeccable/scripts/detector/detect-antipatterns.mjs`
- **detect-html.mjs** (52 connections) — `.kiro/skills/impeccable/scripts/detector/engines/static-html/detect-html.mjs`
- **detect-text.mjs** (37 connections) — `.kiro/skills/impeccable/scripts/detector/engines/regex/detect-text.mjs`
- **detectHtml()** (28 connections) — `.kiro/skills/impeccable/scripts/detector/engines/static-html/detect-html.mjs`
- **main.mjs** (26 connections) — `.kiro/skills/impeccable/scripts/detector/cli/main.mjs`
- **detectCli()** (20 connections) — `.kiro/skills/impeccable/scripts/detector/cli/main.mjs`
- **detectText()** (17 connections) — `.kiro/skills/impeccable/scripts/detector/engines/regex/detect-text.mjs`
- **detect-url.mjs** (16 connections) — `.kiro/skills/impeccable/scripts/detector/engines/browser/detect-url.mjs`
- **profiler.mjs** (15 connections) — `.kiro/skills/impeccable/scripts/detector/profile/profiler.mjs`
- **profileStep()** (12 connections) — `.kiro/skills/impeccable/scripts/detector/profile/profiler.mjs`
- **antipatterns.mjs** (12 connections) — `.kiro/skills/impeccable/scripts/detector/registry/antipatterns.mjs`
- **detectUrl()** (11 connections) — `.kiro/skills/impeccable/scripts/detector/engines/browser/detect-url.mjs`
- **finding()** (11 connections) — `.kiro/skills/impeccable/scripts/detector/findings.mjs`
- **file-system.mjs** (11 connections) — `.kiro/skills/impeccable/scripts/detector/node/file-system.mjs`
- **profileFindings()** (10 connections) — `.kiro/skills/impeccable/scripts/detector/profile/profiler.mjs`
- **findings.mjs** (8 connections) — `.kiro/skills/impeccable/scripts/detector/findings.mjs`
- **profileStepAsync()** (8 connections) — `.kiro/skills/impeccable/scripts/detector/profile/profiler.mjs`
- **filterByProviders()** (8 connections) — `.kiro/skills/impeccable/scripts/detector/registry/antipatterns.mjs`
- **profileFindingsAsync()** (7 connections) — `.kiro/skills/impeccable/scripts/detector/profile/profiler.mjs`
- **recordProfileEvent()** (7 connections) — `.kiro/skills/impeccable/scripts/detector/profile/profiler.mjs`
- **runVisualContrastFallback()** (6 connections) — `.kiro/skills/impeccable/scripts/detector/engines/browser/detect-url.mjs`
- **shouldRunPageAnalyzers()** (6 connections) — `.kiro/skills/impeccable/scripts/detector/engines/regex/detect-text.mjs`
- **getAntipattern()** (6 connections) — `.kiro/skills/impeccable/scripts/detector/registry/antipatterns.mjs`
- **checkPageLayout()** (6 connections) — `.kiro/skills/impeccable/scripts/detector/rules/checks.mjs`
- **checkRepeatedSectionKickersFromDoc()** (6 connections) — `.kiro/skills/impeccable/scripts/detector/rules/checks.mjs`
- *... and 58 more nodes in this community*

## Relationships

- [DOM Accessibility Checks](DOM_Accessibility_Checks.md) (37 shared connections)
- [Design System Tokens](Design_System_Tokens.md) (22 shared connections)
- [Typography and Border Audits](Typography_and_Border_Audits.md) (16 shared connections)
- [CSS Cascade Utilities](CSS_Cascade_Utilities.md) (13 shared connections)
- [Inline Ignore Utilities](Inline_Ignore_Utilities.md) (6 shared connections)
- [Detection Configuration Management](Detection_Configuration_Management.md) (5 shared connections)
- [Visual Contrast Analysis](Visual_Contrast_Analysis.md) (4 shared connections)
- [Git Detection Config](Git_Detection_Config.md) (2 shared connections)
- [Element Motion Detection](Element_Motion_Detection.md) (2 shared connections)
- [Configure Bar Controls](Configure_Bar_Controls.md) (2 shared connections)
- [DOM Element Helpers](DOM_Element_Helpers.md) (1 shared connections)
- [Budget Hook Library](Budget_Hook_Library.md) (1 shared connections)

## Source Files

- `.kiro/skills/impeccable/scripts/detector/cli/main.mjs`
- `.kiro/skills/impeccable/scripts/detector/design-system.mjs`
- `.kiro/skills/impeccable/scripts/detector/detect-antipatterns.mjs`
- `.kiro/skills/impeccable/scripts/detector/engines/browser/detect-url.mjs`
- `.kiro/skills/impeccable/scripts/detector/engines/regex/detect-text.mjs`
- `.kiro/skills/impeccable/scripts/detector/engines/static-html/css-cascade.mjs`
- `.kiro/skills/impeccable/scripts/detector/engines/static-html/detect-html.mjs`
- `.kiro/skills/impeccable/scripts/detector/engines/visual/screenshot-contrast.mjs`
- `.kiro/skills/impeccable/scripts/detector/findings.mjs`
- `.kiro/skills/impeccable/scripts/detector/node/file-system.mjs`
- `.kiro/skills/impeccable/scripts/detector/profile/profiler.mjs`
- `.kiro/skills/impeccable/scripts/detector/registry/antipatterns.mjs`
- `.kiro/skills/impeccable/scripts/detector/rules/checks.mjs`
- `.kiro/skills/impeccable/scripts/detector/shared/color.mjs`
- `.kiro/skills/impeccable/scripts/detector/shared/page.mjs`
- `.kiro/skills/impeccable/scripts/lib/impeccable-config.mjs`

## Audit Trail

- EXTRACTED: 577 (99%)
- INFERRED: 4 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*