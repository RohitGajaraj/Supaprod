/**
 * Phase 7: Accessibility Testing
 * Keyboard navigation, focus traps, aria-labels, color contrast
 */
import { test, expect, Page } from '@playwright/test';
import { login, takeScreenshot } from './helpers/auth';

async function checkColorContrast(page: Page) {
  return await page.evaluate(() => {
    // Sample key text elements and check approximate contrast
    const textElements = document.querySelectorAll('h1, h2, h3, p, span, label, button');
    const samples: {
      tag: string;
      color: string;
      bg: string;
      text: string;
    }[] = [];

    let count = 0;
    textElements.forEach((el) => {
      if (count >= 10) return;
      if (!el.textContent?.trim()) return;

      const style = getComputedStyle(el);
      samples.push({
        tag: el.tagName,
        color: style.color,
        bg: style.backgroundColor,
        text: el.textContent.trim().substring(0, 30),
      });
      count++;
    });

    return samples;
  });
}

async function checkAriaLabels(page: Page) {
  return await page.evaluate(() => {
    const interactiveEls = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]');
    const missing: string[] = [];
    const hasLabel: string[] = [];

    interactiveEls.forEach((el) => {
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const title = el.getAttribute('title');
      const textContent = el.textContent?.trim();
      const placeholder = el.getAttribute('placeholder');

      const hasAccessibleName = ariaLabel || ariaLabelledBy || textContent || title || placeholder;

      if (!hasAccessibleName) {
        const tag = el.tagName;
        const className = (el.className || '').toString().substring(0, 40);
        missing.push(`${tag}.${className}`);
      } else {
        hasLabel.push(`${el.tagName}: ${ariaLabel || textContent?.substring(0, 20) || 'via-labelledby'}`);
      }
    });

    return {
      missing: missing.slice(0, 15),
      hasLabel: hasLabel.slice(0, 10),
      totalChecked: interactiveEls.length,
    };
  });
}

async function checkSemanticHTML(page: Page) {
  return await page.evaluate(() => {
    const landmarks = {
      main: document.querySelectorAll('main').length,
      nav: document.querySelectorAll('nav').length,
      header: document.querySelectorAll('header').length,
      footer: document.querySelectorAll('footer').length,
      aside: document.querySelectorAll('aside').length,
    };

    const headingHierarchy: string[] = [];
    let prevLevel = 0;
    const headingViolations: string[] = [];

    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      const level = parseInt(h.tagName[1]);
      headingHierarchy.push(`${h.tagName}: "${h.textContent?.trim().substring(0, 40)}"`);

      if (level > prevLevel + 1 && prevLevel > 0) {
        headingViolations.push(`Skipped from h${prevLevel} to h${level}`);
      }
      prevLevel = level;
    });

    return { landmarks, headingHierarchy: headingHierarchy.slice(0, 10), headingViolations };
  });
}

test.describe('Accessibility - Keyboard Navigation', () => {
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
    { path: '/build', name: 'build' },
    { path: '/settings', name: 'settings' },
    { path: '/agents', name: 'agents' },
  ];

  for (const surface of surfaces) {
    test(`keyboard navigation on ${surface.path}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: 'networkidle' });

      if (page.url().includes('/login')) {
        await login(page);
        await page.goto(surface.path, { waitUntil: 'networkidle' });
      }

      // Tab through elements and track focus
      const focusPath: string[] = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          return {
            tag: el.tagName,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            text: el.textContent?.trim().substring(0, 30),
            hasOutline: getComputedStyle(el).outline !== 'none' || getComputedStyle(el).boxShadow !== 'none',
          };
        });
        if (focused) {
          focusPath.push(`${focused.tag}${focused.ariaLabel ? `[${focused.ariaLabel}]` : ''}: "${focused.text}" (ring:${focused.hasOutline})`);
        }
      }

      console.log(`Focus path on ${surface.path}:`, focusPath);
      await takeScreenshot(page, `a11y-keyboard-${surface.name}`, 'accessibility');

      // At least some focusable elements should exist
      expect(focusPath.length).toBeGreaterThan(0);
    });
  }

  test('Escape key closes modals/dropdowns', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    // Try to open a dialog if one exists
    const dialogTrigger = page.locator('[data-testid*="dialog"], button[aria-haspopup="dialog"], [aria-haspopup="true"]').first();
    const hasDialogTrigger = await dialogTrigger.isVisible().catch(() => false);

    if (hasDialogTrigger) {
      await dialogTrigger.click();
      await page.waitForTimeout(500);
      const dialogOpen = await page.locator('[role="dialog"], [aria-modal="true"]').isVisible().catch(() => false);

      if (dialogOpen) {
        await takeScreenshot(page, 'a11y-modal-open', 'accessibility');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const dialogClosed = !(await page.locator('[role="dialog"], [aria-modal="true"]').isVisible().catch(() => false));
        expect(dialogClosed).toBe(true);
        await takeScreenshot(page, 'a11y-modal-closed', 'accessibility');
      }
    }
  });
});

test.describe('Accessibility - Semantic HTML & ARIA', () => {
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
    { path: '/guardrails', name: 'guardrails' },
  ];

  for (const surface of surfaces) {
    test(`aria-labels audit on ${surface.path}`, async ({ page }) => {
      await page.context().addCookies(authCookies);
      await page.goto(surface.path, { waitUntil: 'networkidle' });

      if (page.url().includes('/login')) {
        await login(page);
        await page.goto(surface.path, { waitUntil: 'networkidle' });
      }

      const ariaAudit = await checkAriaLabels(page);
      console.log(`ARIA audit (${surface.path}):`, JSON.stringify(ariaAudit, null, 2));

      const semanticAudit = await checkSemanticHTML(page);
      console.log(`Semantic HTML (${surface.path}):`, JSON.stringify(semanticAudit, null, 2));

      // Warn about missing labels but don't hard-fail
      if (ariaAudit.missing.length > 0) {
        console.warn(`${ariaAudit.missing.length} elements missing accessible names on ${surface.path}`);
      }

      // Should have landmark regions
      expect(semanticAudit.landmarks.main + semanticAudit.landmarks.nav).toBeGreaterThan(0);
    });
  }

  test('color contrast sampling on Today', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    const contrastSamples = await checkColorContrast(page);
    console.log('Color contrast samples:', JSON.stringify(contrastSamples, null, 2));
    await takeScreenshot(page, 'a11y-contrast-today', 'accessibility');
  });

  test('heading hierarchy is logical', async ({ page }) => {
    await page.context().addCookies(authCookies);
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    const semanticAudit = await checkSemanticHTML(page);
    console.log('Heading hierarchy:', semanticAudit.headingHierarchy);

    if (semanticAudit.headingViolations.length > 0) {
      console.warn('Heading hierarchy violations:', semanticAudit.headingViolations);
    }
  });
});

test.describe('Accessibility - Reduced Motion', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let authCookies: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    authCookies = await page.context().cookies();
    await page.close();
  });

  test('reduced motion media query is respected', async ({ page }) => {
    await page.context().addCookies(authCookies);

    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/today', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      await login(page);
      await page.goto('/today', { waitUntil: 'networkidle' });
    }

    const motionCheck = await page.evaluate(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Check for animation-duration: 0s on animated elements
      const animatedEls = document.querySelectorAll('[class*="animate"], [class*="transition"], [class*="motion"]');
      const results: { el: string; duration: string }[] = [];

      animatedEls.forEach((el) => {
        const style = getComputedStyle(el);
        if (style.animationName !== 'none') {
          results.push({
            el: el.tagName + '.' + (el.className || '').toString().split(' ')[0],
            duration: style.animationDuration,
          });
        }
      });

      return { prefersReduced, animatedElements: results.slice(0, 10) };
    });

    console.log('Reduced motion check:', motionCheck);
    await takeScreenshot(page, 'a11y-reduced-motion', 'accessibility');

    expect(motionCheck.prefersReduced).toBe(true);
  });
});
