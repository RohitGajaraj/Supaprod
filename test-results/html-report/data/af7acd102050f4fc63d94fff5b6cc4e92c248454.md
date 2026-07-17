# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-accessibility.spec.ts >> Accessibility - Keyboard Navigation >> Escape key closes modals/dropdowns
- Location: e2e/07-accessibility.spec.ts:162:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - complementary [ref=e4]:
        - button "Workspace switcher" [ref=e6]:
          - img [ref=e8]:
            - img [ref=e9]
          - generic [ref=e15]:
            - generic [ref=e16]: Cadence
            - generic [ref=e17]: Explore workspace · Prism
        - button "Search ⌘K" [ref=e19]:
          - generic [ref=e20]: Search
          - generic [ref=e21]: ⌘K
        - generic [ref=e22]:
          - navigation "Home" [ref=e23]:
            - link "0 Today 7 What needs you now." [ref=e24] [cursor=pointer]:
              - /url: /today
              - generic [ref=e25]: "0"
              - generic [ref=e26]:
                - generic [ref=e27]:
                  - generic [ref=e28]: Today
                  - generic [ref=e29]: "7"
                - generic [ref=e30]: What needs you now.
          - generic [ref=e33]: THE LOOP
          - navigation "The loop" [ref=e34]:
            - generic [ref=e35]:
              - link "1 Discover" [ref=e36] [cursor=pointer]:
                - /url: /discover
                - generic [ref=e37]: "1"
                - generic [ref=e40]: Discover
              - link "2 Decide" [ref=e41] [cursor=pointer]:
                - /url: /decide
                - generic [ref=e42]: "2"
                - generic [ref=e45]: Decide
              - link "3 Plan" [ref=e46] [cursor=pointer]:
                - /url: /plan
                - generic [ref=e47]: "3"
                - generic [ref=e50]: Plan
              - link "4 Design" [ref=e51] [cursor=pointer]:
                - /url: /design
                - generic [ref=e52]: "4"
                - generic [ref=e55]: Design
              - link "5 Build" [ref=e56] [cursor=pointer]:
                - /url: /build
                - generic [ref=e57]: "5"
                - generic [ref=e60]: Build
              - link "6 Ship" [ref=e61] [cursor=pointer]:
                - /url: /ship
                - generic [ref=e62]: "6"
                - generic [ref=e65]: Ship
              - link "7 Learn" [ref=e66] [cursor=pointer]:
                - /url: /learn
                - generic [ref=e67]: "7"
                - generic [ref=e70]: Learn
          - generic [ref=e73]: INTELLIGENCE
          - navigation "Intelligence" [ref=e74]:
            - link "8 Brain" [ref=e75] [cursor=pointer]:
              - /url: /brain
              - generic [ref=e76]: "8"
              - generic [ref=e79]: Brain
            - link "9 Pulse" [ref=e80] [cursor=pointer]:
              - /url: /engine-room
              - generic [ref=e81]: "9"
              - generic [ref=e84]: Pulse
        - generic [ref=e85]:
          - link "Settings" [ref=e86] [cursor=pointer]:
            - /url: /settings
            - img [ref=e88]
            - generic [ref=e92]:
              - generic [ref=e93]: Settings
              - generic [ref=e94]: s
          - link "Admin console" [ref=e95] [cursor=pointer]:
            - /url: /admin
            - img [ref=e97]
            - generic [ref=e100]:
              - generic [ref=e101]: Admin console
              - generic [ref=e102]: a
          - button "Focus mode" [active] [ref=e103]:
            - img [ref=e104]
            - generic [ref=e108]: Focus
          - button "Account menu" [ref=e109]:
            - generic [ref=e110]: J
            - generic [ref=e111]: Jane
      - main [ref=e113]:
        - note "Sample workspace" [ref=e114]:
          - generic [ref=e115]: Sample data
          - generic [ref=e116]: This workspace holds example data so you can explore. Connect a real source to start your own.
        - generic [ref=e117]:
          - generic [ref=e118]:
            - navigation "Breadcrumb" [ref=e119]:
              - generic [ref=e121]: Explore workspace
              - generic [ref=e122]:
                - generic [ref=e123]: /
                - generic [ref=e124]: Today
            - generic [ref=e125]:
              - button "Ask Cadence" [ref=e126] [cursor=pointer]:
                - img [ref=e127]
                - generic [ref=e130]: Ask
                - generic [ref=e131]: ⌘J
              - generic "Showers in Bengaluru · 23°C" [ref=e132]:
                - generic [ref=e133]:
                  - img [ref=e134]
                  - generic [ref=e136]: Showers
                  - generic [ref=e137]: 23°
                - generic [ref=e139]: Bengaluru
              - link "Open Build (Waiting on you)" [ref=e140] [cursor=pointer]:
                - /url: /build
                - status [ref=e141]:
                  - img [ref=e143]:
                    - img [ref=e144]
                  - generic [ref=e151]: Waiting on you
              - 'button "Theme: dark. Switch to system." [ref=e152] [cursor=pointer]':
                - img [ref=e153]
          - generic [ref=e155]:
            - generic [ref=e156]:
              - generic:
                - img:
                  - img
              - generic [ref=e157]:
                - generic [ref=e158]: Good afternoon, Jane
                - heading "7 calls need your judgment today." [level=1] [ref=e159]
                - paragraph [ref=e160]: In the last 24 hours, Cadence framed 1 opportunity.
            - region "Today's brief" [ref=e161]:
              - generic [ref=e164]:
                - generic [ref=e165]:
                  - generic [ref=e166]: Waiting
                  - generic [ref=e167]: 4 pushed insights below need your read.
                - generic [ref=e168]:
                  - generic [ref=e169]: Proved out
                  - generic [ref=e170]: "A validated outcome moved Precision-tuned fraud scoring: priority score 3.2 to 8.6."
                - button "Read the full brief" [ref=e172] [cursor=pointer]
            - generic [ref=e173]:
              - generic [ref=e174]:
                - region "Needs your judgment" [ref=e175]:
                  - generic [ref=e176]:
                    - heading "Needs your judgment" [level=2] [ref=e177]
                    - generic [ref=e178]: "7"
                  - region "Your first teardown" [ref=e180]:
                    - generic [ref=e181]:
                      - generic [ref=e182]: Your first teardown
                      - 'generic "Verdict: Kill" [ref=e183]': Kill
                    - heading "Test - Bank-link drop-off at activation" [level=3] [ref=e185]
                    - paragraph [ref=e186]: "The proposal lacks fundamental information: problem statement, target user, and hypothesis. Without these critical components, it's impossible to evaluate, define success, or justify any effort."
                    - generic [ref=e187]:
                      - generic [ref=e188]: Risk
                      - generic [ref=e189]: Wasting resources on an undefined problem or non-problem.
                    - generic [ref=e190]:
                      - meter "Critic confidence" [ref=e191]
                      - generic [ref=e193]: Confidence 50%
                    - generic [ref=e194]:
                      - button "Keep" [ref=e195] [cursor=pointer]
                      - button "Share" [ref=e196] [cursor=pointer]:
                        - img [ref=e197]
                        - text: Share
                  - generic [ref=e203]:
                    - generic [ref=e204]:
                      - generic [ref=e205]:
                        - generic [ref=e206]:
                          - img [ref=e208]
                          - generic [ref=e213]: Prioritize
                        - generic [ref=e214]: Address critical 38% bank connection drop-off to unblock user activation.
                      - paragraph [ref=e215]: Users are abandoning activation due to inability to find their bank and unclear error messages. This is severely throttling user growth at a critical stage.
                      - button "Open in Brain" [ref=e216] [cursor=pointer]
                    - generic [ref=e217]:
                      - generic [ref=e218]:
                        - generic [ref=e219]:
                          - img [ref=e221]
                          - generic [ref=e226]: Prioritize
                        - generic [ref=e227]: Address data import and onboarding friction immediately to mitigate high churn risk.
                      - paragraph [ref=e228]: Users are experiencing significant pain with data importation during onboarding, leading to a high risk of churn. This directly impacts user retention.
                      - button "Open in Brain" [ref=e229] [cursor=pointer]
                    - generic [ref=e230]:
                      - generic [ref=e231]:
                        - generic [ref=e232]:
                          - img [ref=e234]
                          - generic [ref=e239]: Prioritize
                        - generic [ref=e240]: Investigate friction points for bank connectivity. Identify and prioritize the most impactful fixes.
                      - paragraph [ref=e241]: Nearly 40% of new users drop off during bank connection, citing unlisted banks or unclear errors. This is severely hindering user activation.
                      - button "Open in Brain" [ref=e242] [cursor=pointer]
                    - button "1 more waiting →" [ref=e243] [cursor=pointer]
                  - generic [ref=e246]: 0 answered · 7 open
                - paragraph [ref=e247]: In the last 24 hours, Cadence framed 1 opportunity.
                - region "While you slept" [ref=e248]:
                  - heading "While you slept" [level=2] [ref=e250]
                  - generic [ref=e253]:
                    - img [ref=e255]
                    - generic [ref=e258]: goal-planner
                    - generic [ref=e259]: 1 move across the workspace
                    - generic [ref=e260]: 23H AGO
                    - button "Receipt" [ref=e261] [cursor=pointer]
                - navigation "More on Today" [ref=e262]:
                  - button "Desk" [ref=e263] [cursor=pointer]:
                    - text: Desk
                    - generic [ref=e264]: →
                  - button "Activity" [ref=e265] [cursor=pointer]:
                    - text: Activity
                    - generic [ref=e266]: →
                  - button "Shipped 6" [ref=e267] [cursor=pointer]:
                    - text: Shipped
                    - generic [ref=e268]: "6"
                    - generic [ref=e269]: →
                  - button "Watch" [ref=e270] [cursor=pointer]:
                    - text: Watch
                    - generic [ref=e271]: →
              - complementary "Your desk" [ref=e272]:
                - region "Your desk" [ref=e273]:
                  - heading "Your desk" [level=2] [ref=e276]
                  - region "Focus block" [ref=e278]:
                    - heading "Focus block" [level=3] [ref=e280]
                    - generic [ref=e281]:
                      - textbox "Focus block intent" [ref=e282]:
                        - /placeholder: What are you closing in this block?
                      - generic [ref=e283]:
                        - button "25" [pressed] [ref=e284] [cursor=pointer]
                        - button "50" [ref=e285] [cursor=pointer]
                        - button "90" [ref=e286] [cursor=pointer]
                        - spinbutton "Custom focus minutes" [ref=e287]
                      - generic [ref=e288]:
                        - button "Sound · Off" [ref=e289] [cursor=pointer]
                        - button "Start the block" [ref=e290] [cursor=pointer]
                  - region "Tasks today" [ref=e291]:
                    - heading "Tasks today" [level=3] [ref=e293]
                    - paragraph [ref=e294]: Nothing due today. Add what matters.
                    - button "Backlog (17)" [ref=e296] [cursor=pointer]
                    - generic [ref=e297]:
                      - textbox "New task for today" [ref=e298]:
                        - /placeholder: Add a task for today
                      - button "Add" [disabled]
                  - region "Capture a signal" [ref=e299]:
                    - heading "Capture" [level=3] [ref=e300]
                    - generic [ref=e301]:
                      - textbox "Signal content, source optional" [ref=e302]:
                        - /placeholder: What did you hear, and from where?
                      - button "Capture" [disabled]
    - generic [ref=e303]:
      - status [ref=e304]
      - button "Start a focus block (Option F)" [ref=e305] [cursor=pointer]:
        - generic [ref=e307]: Focus · ⌥F
  - region "Notifications alt+T"
```

# Test source

```ts
  93  | 
  94  |     return { landmarks, headingHierarchy: headingHierarchy.slice(0, 10), headingViolations };
  95  |   });
  96  | }
  97  | 
  98  | test.describe('Accessibility - Keyboard Navigation', () => {
  99  |   test.use({ viewport: { width: 1280, height: 800 } });
  100 | 
  101 |   let authCookies: any;
  102 | 
  103 |   test.beforeAll(async ({ browser }) => {
  104 |     const page = await browser.newPage();
  105 |     await login(page);
  106 |     authCookies = await page.context().cookies();
  107 |     await page.close();
  108 |   });
  109 | 
  110 |   const surfaces = [
  111 |     { path: '/today', name: 'today' },
  112 |     { path: '/build', name: 'build' },
  113 |     { path: '/settings', name: 'settings' },
  114 |     { path: '/agents', name: 'agents' },
  115 |   ];
  116 | 
  117 |   for (const surface of surfaces) {
  118 |     test(`keyboard navigation on ${surface.path}`, async ({ page }) => {
  119 |       await page.context().addCookies(authCookies);
  120 |       await page.goto(surface.path, { waitUntil: 'networkidle' });
  121 | 
  122 |       if (page.url().includes('/login')) {
  123 |         await login(page);
  124 |         await page.goto(surface.path, { waitUntil: 'networkidle' });
  125 |       }
  126 | 
  127 |       // Tab through elements and track focus
  128 |       const focusPath: string[] = [];
  129 |       for (let i = 0; i < 10; i++) {
  130 |         await page.keyboard.press('Tab');
  131 |         const focused = await page.evaluate(() => {
  132 |           const el = document.activeElement;
  133 |           if (!el || el === document.body) return null;
  134 |           return {
  135 |             tag: el.tagName,
  136 |             role: el.getAttribute('role'),
  137 |             ariaLabel: el.getAttribute('aria-label'),
  138 |             text: el.textContent?.trim().substring(0, 30),
  139 |             hasOutline: getComputedStyle(el).outline !== 'none' || getComputedStyle(el).boxShadow !== 'none',
  140 |           };
  141 |         });
  142 |         if (focused) {
  143 |           focusPath.push(`${focused.tag}${focused.ariaLabel ? `[${focused.ariaLabel}]` : ''}: "${focused.text}" (ring:${focused.hasOutline})`);
  144 |         }
  145 |       }
  146 | 
  147 |       console.log(`Focus path on ${surface.path}:`, focusPath);
  148 |       await takeScreenshot(page, `a11y-keyboard-${surface.name}`, 'accessibility');
  149 | 
  150 |       // At least some focusable elements should exist
  151 |       expect(focusPath.length).toBeGreaterThan(0);
  152 |     });
  153 |   }
  154 | 
  155 |   test('Escape key closes modals/dropdowns', async ({ page }) => {
  156 |     await page.context().addCookies(authCookies);
  157 |     await page.goto('/today', { waitUntil: 'networkidle' });
  158 | 
  159 |     if (page.url().includes('/login')) {
  160 |       await login(page);
  161 |       await page.goto('/today', { waitUntil: 'networkidle' });
  162 |     }
  163 | 
  164 |     // Try to open a dialog if one exists
  165 |     const dialogTrigger = page.locator('[data-testid*="dialog"], button[aria-haspopup="dialog"], [aria-haspopup="true"]').first();
  166 |     const hasDialogTrigger = await dialogTrigger.isVisible().catch(() => false);
  167 | 
  168 |     if (hasDialogTrigger) {
  169 |       await dialogTrigger.click();
  170 |       await page.waitForTimeout(500);
  171 |       const dialogOpen = await page.locator('[role="dialog"], [aria-modal="true"]').isVisible().catch(() => false);
  172 | 
  173 |       if (dialogOpen) {
  174 |         await takeScreenshot(page, 'a11y-modal-open', 'accessibility');
  175 |         await page.keyboard.press('Escape');
  176 |         await page.waitForTimeout(300);
  177 |         const dialogClosed = !(await page.locator('[role="dialog"], [aria-modal="true"]').isVisible().catch(() => false));
  178 |         expect(dialogClosed).toBe(true);
  179 |         await takeScreenshot(page, 'a11y-modal-closed', 'accessibility');
  180 |       }
  181 |     }
  182 |   });
  183 | });
  184 | 
  185 | test.describe('Accessibility - Semantic HTML & ARIA', () => {
  186 |   test.use({ viewport: { width: 1280, height: 800 } });
  187 | 
  188 |   let authCookies: any;
  189 | 
  190 |   test.beforeAll(async ({ browser }) => {
  191 |     const page = await browser.newPage();
  192 |     await login(page);
> 193 |     authCookies = await page.context().cookies();
      |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  194 |     await page.close();
  195 |   });
  196 | 
  197 |   const surfaces = [
  198 |     { path: '/today', name: 'today' },
  199 |     { path: '/agents', name: 'agents' },
  200 |     { path: '/settings', name: 'settings' },
  201 |     { path: '/engine-room', name: 'engine-room' },
  202 |     { path: '/guardrails', name: 'guardrails' },
  203 |   ];
  204 | 
  205 |   for (const surface of surfaces) {
  206 |     test(`aria-labels audit on ${surface.path}`, async ({ page }) => {
  207 |       await page.context().addCookies(authCookies);
  208 |       await page.goto(surface.path, { waitUntil: 'networkidle' });
  209 | 
  210 |       if (page.url().includes('/login')) {
  211 |         await login(page);
  212 |         await page.goto(surface.path, { waitUntil: 'networkidle' });
  213 |       }
  214 | 
  215 |       const ariaAudit = await checkAriaLabels(page);
  216 |       console.log(`ARIA audit (${surface.path}):`, JSON.stringify(ariaAudit, null, 2));
  217 | 
  218 |       const semanticAudit = await checkSemanticHTML(page);
  219 |       console.log(`Semantic HTML (${surface.path}):`, JSON.stringify(semanticAudit, null, 2));
  220 | 
  221 |       // Warn about missing labels but don't hard-fail
  222 |       if (ariaAudit.missing.length > 0) {
  223 |         console.warn(`${ariaAudit.missing.length} elements missing accessible names on ${surface.path}`);
  224 |       }
  225 | 
  226 |       // Should have landmark regions
  227 |       expect(semanticAudit.landmarks.main + semanticAudit.landmarks.nav).toBeGreaterThan(0);
  228 |     });
  229 |   }
  230 | 
  231 |   test('color contrast sampling on Today', async ({ page }) => {
  232 |     await page.context().addCookies(authCookies);
  233 |     await page.goto('/today', { waitUntil: 'networkidle' });
  234 | 
  235 |     if (page.url().includes('/login')) {
  236 |       await login(page);
  237 |       await page.goto('/today', { waitUntil: 'networkidle' });
  238 |     }
  239 | 
  240 |     const contrastSamples = await checkColorContrast(page);
  241 |     console.log('Color contrast samples:', JSON.stringify(contrastSamples, null, 2));
  242 |     await takeScreenshot(page, 'a11y-contrast-today', 'accessibility');
  243 |   });
  244 | 
  245 |   test('heading hierarchy is logical', async ({ page }) => {
  246 |     await page.context().addCookies(authCookies);
  247 |     await page.goto('/today', { waitUntil: 'networkidle' });
  248 | 
  249 |     if (page.url().includes('/login')) {
  250 |       await login(page);
  251 |       await page.goto('/today', { waitUntil: 'networkidle' });
  252 |     }
  253 | 
  254 |     const semanticAudit = await checkSemanticHTML(page);
  255 |     console.log('Heading hierarchy:', semanticAudit.headingHierarchy);
  256 | 
  257 |     if (semanticAudit.headingViolations.length > 0) {
  258 |       console.warn('Heading hierarchy violations:', semanticAudit.headingViolations);
  259 |     }
  260 |   });
  261 | });
  262 | 
  263 | test.describe('Accessibility - Reduced Motion', () => {
  264 |   test.use({ viewport: { width: 1280, height: 800 } });
  265 | 
  266 |   let authCookies: any;
  267 | 
  268 |   test.beforeAll(async ({ browser }) => {
  269 |     const page = await browser.newPage();
  270 |     await login(page);
  271 |     authCookies = await page.context().cookies();
  272 |     await page.close();
  273 |   });
  274 | 
  275 |   test('reduced motion media query is respected', async ({ page }) => {
  276 |     await page.context().addCookies(authCookies);
  277 | 
  278 |     // Set reduced motion preference
  279 |     await page.emulateMedia({ reducedMotion: 'reduce' });
  280 |     await page.goto('/today', { waitUntil: 'networkidle' });
  281 | 
  282 |     if (page.url().includes('/login')) {
  283 |       await login(page);
  284 |       await page.goto('/today', { waitUntil: 'networkidle' });
  285 |     }
  286 | 
  287 |     const motionCheck = await page.evaluate(() => {
  288 |       const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  289 | 
  290 |       // Check for animation-duration: 0s on animated elements
  291 |       const animatedEls = document.querySelectorAll('[class*="animate"], [class*="transition"], [class*="motion"]');
  292 |       const results: { el: string; duration: string }[] = [];
  293 | 
```