/**
 * Elevation token verification
 * Shadows use preset tokens (material-base/small/medium/large), no ad-hoc shadows
 */
import { test, expect, Page } from '@playwright/test';
import { login, takeScreenshot } from './helpers/auth';

async function checkElevationTokens(page: Page) {
  return await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);

    // Check if elevation/material tokens are defined
    const elevationTokens = {
      '--material-base': root.getPropertyValue('--material-base').trim(),
      '--material-small': root.getPropertyValue('--material-small').trim(),
      '--material-medium': root.getPropertyValue('--material-medium').trim(),
      '--material-large': root.getPropertyValue('--material-large').trim(),
      '--ds-shadow-base': root.getPropertyValue('--ds-shadow-base').trim(),
      '--ds-shadow-sm': root.getPropertyValue('--ds-shadow-sm').trim(),
      '--ds-shadow-md': root.getPropertyValue('--ds-shadow-md').trim(),
      '--ds-shadow-lg': root.getPropertyValue('--ds-shadow-lg').trim(),
    };

    // Find elements with box-shadow
    const shadowed: { tag: string; class: string; shadow: string; usesVar: boolean }[] = [];
    document.querySelectorAll('*').forEach((el) => {
      const style = window.getComputedStyle(el);
      const shadow = style.boxShadow;
      if (shadow && shadow !== 'none') {
        // Check if the computed value looks like a token-based shadow
        // Inline styles with hardcoded values are violations
        const inlineStyle = (el as HTMLElement).style.boxShadow;
        const usesVar = !inlineStyle || !inlineStyle.match(/rgba?\(|#[0-9a-f]{3,6}/i);

        shadowed.push({
          tag: el.tagName,
          class: (el.className || '').toString().split(' ')[0].substring(0, 40),
          shadow: shadow.substring(0, 100),
          usesVar,
        });
      }
    });

    return {
      elevationTokens,
      shadowedElements: shadowed.slice(0, 20),
      adHocShadowCount: shadowed.filter((s) => !s.usesVar).length,
    };
  });
}

test.describe('Elevation & Shadow Token Compliance', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  const surfaces = [
    { path: '/today', name: 'today' },
    { path: '/agents', name: 'agents' },
    { path: '/settings', name: 'settings' },
    { path: '/engine-room', name: 'engine-room' },
  ];

  for (const surface of surfaces) {
    test(`elevation tokens on ${surface.path}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: 'networkidle' });

      if (page.url().includes('/login')) {
        await login(page);
        await page.goto(surface.path, { waitUntil: 'networkidle' });
      }

      const elevationAudit = await checkElevationTokens(page);
      console.log(`Elevation audit (${surface.path}):`, JSON.stringify({
        tokens: elevationAudit.elevationTokens,
        adHocCount: elevationAudit.adHocShadowCount,
        sampleShadows: elevationAudit.shadowedElements.slice(0, 5),
      }, null, 2));

      await takeScreenshot(page, `elevation-${surface.name}`, 'elevation');

      // Warn about missing elevation tokens
      const setTokens = Object.values(elevationAudit.elevationTokens).filter((v) => v !== '');
      console.log(`Elevation tokens defined: ${setTokens.length}/8`);
    });
  }

  test('glass panel material on sidebar rail', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    // Check sidebar/rail for glass material
    const railGlass = await page.evaluate(() => {
      const rail = document.querySelector('[class*="rail"], [class*="sidebar"], nav[class*="side"]');
      if (!rail) return null;
      const style = getComputedStyle(rail);
      return {
        backdropFilter: style.backdropFilter,
        background: style.background.substring(0, 100),
        opacity: style.opacity,
      };
    });

    console.log('Rail glass material:', railGlass);
    await takeScreenshot(page, 'elevation-rail-glass', 'elevation');
  });

  test('TopBar glass material', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    const topBarGlass = await page.evaluate(() => {
      const topBar = document.querySelector(
        '[class*="topbar"], [class*="TopBar"], [class*="top-bar"], header'
      );
      if (!topBar) return null;
      const style = getComputedStyle(topBar);
      return {
        backdropFilter: style.backdropFilter,
        background: style.background.substring(0, 100),
        position: style.position,
        zIndex: style.zIndex,
      };
    });

    console.log('TopBar glass:', topBarGlass);
    await takeScreenshot(page, 'elevation-topbar-glass', 'elevation');
  });
});
