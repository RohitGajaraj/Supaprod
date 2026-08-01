# Antipattern Detection CLI

> 80 nodes · cohesion 0.07

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
- **isNeutralColor()** (6 connections) — `.kiro/skills/impeccable/scripts/detector/shared/color.mjs`
- *... and 55 more nodes in this community*

## Relationships

- [Color Contrast Checks](Color_Contrast_Checks.md) (36 shared connections)
- [.kiro/skills - design-system.mjs](kiro-skills_-_design-system.mjs.md) (22 shared connections)
- [.kiro/skills - GENERIC_FONTS](kiro-skills_-_GENERIC_FONTS.md) (15 shared connections)
- [.kiro/skills - css-cascade.mjs](kiro-skills_-_css-cascade.mjs.md) (13 shared connections)
- [.kiro/skills - inline-ignores.mjs](kiro-skills_-_inline-ignores.mjs.md) (6 shared connections)
- [.kiro/skills - impeccable-config.mjs](kiro-skills_-_impeccable-config.mjs.md) (5 shared connections)
- [Design Antipattern Detection (Browser)](Design_Antipattern_Detection_%28Browser%29.md) (3 shared connections)
- [.kiro/skills - readDetectionConfig()](kiro-skills_-_readDetectionConfig%28%29.md) (2 shared connections)
- [.kiro/skills - SAFE_TAGS](kiro-skills_-_SAFE_TAGS.md) (2 shared connections)
- [.kiro/skills - el()](kiro-skills_-_el%28%29.md) (2 shared connections)
- [.kiro/skills - scheduleLazyVisualContrast()](kiro-skills_-_scheduleLazyVisualContrast%28%29.md) (1 shared connections)
- [.kiro/skills - StaticElement](kiro-skills_-_StaticElement.md) (1 shared connections)

## Source Files

- `.kiro/skills/impeccable/scripts/detector/cli/main.mjs`
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

- EXTRACTED: 563 (99%)
- INFERRED: 4 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*