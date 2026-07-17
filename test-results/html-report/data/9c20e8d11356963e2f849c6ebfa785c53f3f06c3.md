# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-icons.spec.ts >> Icon Audit >> icon audit on /agents
- Location: e2e/06-icons.spec.ts:82:5

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:8080/agents", waiting until "networkidle"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]: cadence
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * Phase 6: Icon Audit
  3   |  * Sizing consistency, stroke weight, color role compliance
  4   |  */
  5   | import { test, expect, Page } from '@playwright/test';
  6   | import { login, takeScreenshot } from './helpers/auth';
  7   | 
  8   | async function auditIcons(page: Page) {
  9   |   return await page.evaluate(() => {
  10  |     // Find all SVG icons
  11  |     const svgs = document.querySelectorAll('svg');
  12  |     const iconData: {
  13  |       size: string;
  14  |       strokeWidth: string | null;
  15  |       color: string;
  16  |       parent: string;
  17  |     }[] = [];
  18  | 
  19  |     const sizeViolations: string[] = [];
  20  | 
  21  |     svgs.forEach((svg) => {
  22  |       const rect = svg.getBoundingClientRect();
  23  |       const style = getComputedStyle(svg);
  24  |       const w = Math.round(rect.width);
  25  |       const h = Math.round(rect.height);
  26  | 
  27  |       if (w > 0 && h > 0) {
  28  |         const strokeWidth = svg.getAttribute('stroke-width') || svg.style.strokeWidth || null;
  29  |         const parent = svg.parentElement?.tagName || 'unknown';
  30  | 
  31  |         iconData.push({
  32  |           size: `${w}x${h}`,
  33  |           strokeWidth,
  34  |           color: style.color,
  35  |           parent,
  36  |         });
  37  | 
  38  |         // Flag non-standard sizes (expect 16, 20, 24, 32)
  39  |         const standardSizes = [12, 14, 16, 20, 24, 32, 40];
  40  |         if (!standardSizes.includes(w) || !standardSizes.includes(h)) {
  41  |           sizeViolations.push(`${w}x${h}px in <${parent}>`);
  42  |         }
  43  |       }
  44  |     });
  45  | 
  46  |     // Summarize sizes
  47  |     const sizeCounts: Record<string, number> = {};
  48  |     iconData.forEach((icon) => {
  49  |       sizeCounts[icon.size] = (sizeCounts[icon.size] || 0) + 1;
  50  |     });
  51  | 
  52  |     return {
  53  |       totalIcons: iconData.length,
  54  |       sizeCounts,
  55  |       sizeViolations: sizeViolations.slice(0, 15),
  56  |       sample: iconData.slice(0, 10),
  57  |     };
  58  |   });
  59  | }
  60  | 
  61  | test.describe('Icon Audit', () => {
  62  |   test.use({ viewport: { width: 1280, height: 800 } });
  63  | 
  64  |   let authCookies: any;
  65  | 
  66  |   test.beforeAll(async ({ browser }) => {
  67  |     const page = await browser.newPage();
  68  |     await login(page);
  69  |     authCookies = await page.context().cookies();
  70  |     await page.close();
  71  |   });
  72  | 
  73  |   const surfaces = [
  74  |     { path: '/today', name: 'today' },
  75  |     { path: '/engine-room', name: 'engine-room' },
  76  |     { path: '/agents', name: 'agents' },
  77  |     { path: '/settings', name: 'settings' },
  78  |     { path: '/guardrails', name: 'guardrails' },
  79  |   ];
  80  | 
  81  |   for (const surface of surfaces) {
  82  |     test(`icon audit on ${surface.path}`, async ({ page }) => {
  83  |       await page.context().addCookies(authCookies);
  84  |       await page.goto(surface.path, { waitUntil: 'networkidle' });
  85  | 
  86  |       if (page.url().includes('/login')) {
  87  |         await login(page);
> 88  |         await page.goto(surface.path, { waitUntil: 'networkidle' });
      |                    ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  89  |       }
  90  | 
  91  |       const audit = await auditIcons(page);
  92  |       console.log(`Icon audit (${surface.path}):`, JSON.stringify(audit, null, 2));
  93  | 
  94  |       await takeScreenshot(page, `icons-${surface.name}`, 'icons');
  95  | 
  96  |       // Report size violations (warn, not fail - some custom sizing OK)
  97  |       if (audit.sizeViolations.length > 0) {
  98  |         console.warn(`Icon size violations on ${surface.path}:`, audit.sizeViolations);
  99  |       }
  100 | 
  101 |       // Basic check: icons exist
  102 |       expect(audit.totalIcons).toBeGreaterThan(0);
  103 |     });
  104 |   }
  105 | 
  106 |   test('icon color compliance - check for ember vs neutral usage', async ({ page }) => {
  107 |     await page.context().addCookies(authCookies);
  108 |     await page.goto('/today', { waitUntil: 'networkidle' });
  109 | 
  110 |     if (page.url().includes('/login')) {
  111 |       await login(page);
  112 |       await page.goto('/today', { waitUntil: 'networkidle' });
  113 |     }
  114 | 
  115 |     const colorAudit = await page.evaluate(() => {
  116 |       const svgs = document.querySelectorAll('svg');
  117 |       const coloredIcons: { color: string; class: string }[] = [];
  118 | 
  119 |       svgs.forEach((svg) => {
  120 |         const style = getComputedStyle(svg);
  121 |         const color = style.color;
  122 |         // Flag explicitly colored icons (not inheriting gray)
  123 |         if (color && !color.includes('128, 128') && !color.includes('0, 0, 0') && !color.includes('255, 255, 255')) {
  124 |           coloredIcons.push({
  125 |             color,
  126 |             class: (svg.className?.toString() || '').substring(0, 50),
  127 |           });
  128 |         }
  129 |       });
  130 |       return coloredIcons.slice(0, 15);
  131 |     });
  132 | 
  133 |     console.log('Colored icons:', colorAudit);
  134 |     await takeScreenshot(page, 'icons-color-audit', 'icons');
  135 |   });
  136 | 
  137 |   test('icon alignment in buttons', async ({ page }) => {
  138 |     await page.context().addCookies(authCookies);
  139 |     await page.goto('/today', { waitUntil: 'networkidle' });
  140 | 
  141 |     if (page.url().includes('/login')) {
  142 |       await login(page);
  143 |       await page.goto('/today', { waitUntil: 'networkidle' });
  144 |     }
  145 | 
  146 |     const buttonIconAlignment = await page.evaluate(() => {
  147 |       const buttonsWithIcons = document.querySelectorAll('button svg, [role="button"] svg');
  148 |       const results: { buttonClass: string; iconSize: string; aligned: boolean }[] = [];
  149 | 
  150 |       buttonsWithIcons.forEach((svg) => {
  151 |         const button = svg.closest('button, [role="button"]');
  152 |         if (button) {
  153 |           const buttonStyle = getComputedStyle(button);
  154 |           const svgRect = svg.getBoundingClientRect();
  155 |           const buttonRect = button.getBoundingClientRect();
  156 | 
  157 |           // Check if icon is roughly centered vertically
  158 |           const iconMidY = svgRect.top + svgRect.height / 2;
  159 |           const buttonMidY = buttonRect.top + buttonRect.height / 2;
  160 |           const verticalDiff = Math.abs(iconMidY - buttonMidY);
  161 |           const aligned = verticalDiff < 3; // Within 3px
  162 | 
  163 |           results.push({
  164 |             buttonClass: (button.className || '').toString().split(' ')[0],
  165 |             iconSize: `${Math.round(svgRect.width)}x${Math.round(svgRect.height)}`,
  166 |             aligned,
  167 |           });
  168 |         }
  169 |       });
  170 |       return results.slice(0, 15);
  171 |     });
  172 | 
  173 |     console.log('Button icon alignment:', buttonIconAlignment);
  174 | 
  175 |     const misalignedIcons = buttonIconAlignment.filter((b) => !b.aligned);
  176 |     if (misalignedIcons.length > 0) {
  177 |       console.warn('Misaligned icons in buttons:', misalignedIcons);
  178 |     }
  179 |   });
  180 | });
  181 | 
```