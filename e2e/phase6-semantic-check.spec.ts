/**
 * Targeted semantic HTML check — must be authenticated to hit real app surfaces
 */
import { test, expect } from "@playwright/test";

const DEMO_EMAIL = "demo@redcadence.app";
const DEMO_PASSWORD = "Cadence!Demo2026";
const BASE_URL = "http://localhost:8080";

test.describe("Semantic HTML — Authenticated Surfaces", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("semantic landmarks and headings on /today, /build, /govern", async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
    console.log("Authenticated, current URL:", page.url());

    for (const path of ["/today", "/build", "/govern", "/discover", "/plan", "/brain"]) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const audit = await page.evaluate(() => {
        return {
          main: document.querySelectorAll("main").length,
          nav: document.querySelectorAll("nav").length,
          header: document.querySelectorAll("header").length,
          aside: document.querySelectorAll("aside").length,
          role_main: document.querySelectorAll('[role="main"]').length,
          role_navigation: document.querySelectorAll('[role="navigation"]').length,
          role_banner: document.querySelectorAll('[role="banner"]').length,
          data_obsidian: document.querySelectorAll("[data-obsidian]").length,
          h1: [...document.querySelectorAll("h1")].map((h) =>
            h.textContent?.trim().substring(0, 40),
          ),
          h2: [...document.querySelectorAll("h2")]
            .slice(0, 6)
            .map((h) => h.textContent?.trim().substring(0, 40)),
          url: window.location.href,
          buttons: document.querySelectorAll("button").length,
          inputs: document.querySelectorAll("input, textarea, select").length,
          // Check for icon-only buttons without aria-label
          iconOnlyNoLabel: [...document.querySelectorAll("button")].filter((b) => {
            const hasSvg = b.querySelector("svg") !== null;
            const text = b.textContent?.trim();
            const hasText = text && text.length > 1;
            const hasLabel =
              b.getAttribute("aria-label") ||
              b.getAttribute("aria-labelledby") ||
              b.getAttribute("title");
            return hasSvg && !hasText && !hasLabel;
          }).length,
          // Check aria-live regions
          ariaLive: document.querySelectorAll("[aria-live]").length,
          // Div-based buttons (missing <button> tag)
          divRoleButton: document.querySelectorAll('[role="button"]').length,
          spanRoleButton: document.querySelectorAll('span[role="button"]').length,
        };
      });

      console.log(`\n=== ${path} ===`);
      console.log(JSON.stringify(audit, null, 2));
      expect(audit.url).toContain(path);
    }
  });
});
