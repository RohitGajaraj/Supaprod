# XSS Prevention Implementation Guide

> _Created: 2026-08-04 · Last updated: 2026-08-04_

## Status: OPEN
**Risk:** Medium | **Effort:** Medium | **Priority:** P1

---

## Vulnerabilities Requiring XSS Prevention

### 1. AnnouncementsPanel (`.output/public/assets/AnnouncementsPanel-DKtlZtub.js`)
- **User Input:** Announcement `title` and `body`
- **Risk:** Stored XSS if content rendered without sanitization downstream
- **Storage:** Saved to DB via `se` (server mutation)
- **Display:** Rendered in public page `/p/<slug>`

### 2. BriefPanel (`.output/public/assets/BriefPanel-pdwsfiC5.js`)
- **User Input:** Strategic brief fields (vision, ICP, positioning, top_bets)
- **Risk:** Stored XSS when brief is displayed in decision panels or exported
- **Storage:** Saved via `u` (server mutation)
- **Display:** Rendered in authenticated app UI

### 3. CalendarPanel (`.output/public/assets/CalendarPanel-fF39bluy.js`)
- **User Input:** Meeting transcript, extracted summary, action items, decisions
- **Risk:** Sensitive meeting content could be XSS-injected
- **Storage:** Saved via `s` (server mutation)
- **Display:** Rendered in calendar/meeting detail views

---

## Implementation Plan

### Step 1: Install DOMPurify (Already Available)
Already included per security audit notes. Verify version and update if needed:

```bash
npm list dompurify
# Should be 3.0.6+ to address CVE-2024-XXXXX (monaco integration)
```

### Step 2: Create Input Sanitization Layer

Add this utility in `src/lib/security/sanitize.ts`:

```typescript
import DOMPurify from 'dompurify';

// Whitelist allowed tags and attributes for announcements
const ANNOUNCEMENT_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
  FORCE_BODY: false,
  RETURN_TRUSTED_TYPE: false,
};

const BRIEF_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  ALLOWED_ATTR: [],
  FORCE_BODY: false,
};

export function sanitizeAnnouncement(input: string): string {
  return DOMPurify.sanitize(input, ANNOUNCEMENT_CONFIG);
}

export function sanitizeBrief(input: string): string {
  return DOMPurify.sanitize(input, BRIEF_CONFIG);
}

export function sanitizeTranscript(input: string): string {
  // Transcripts should allow minimal formatting only
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}
```

### Step 3: Apply Sanitization in Server Functions

**File:** `src/lib/announcements.functions.ts`

```typescript
export const createAnnouncement = serverFn(
  { data: z.object({ 
    workspaceId: z.string(), 
    title: z.string().min(1).max(200),
    body: z.string().max(10000),
  }) },
  async (data) => {
    // SANITIZE INPUT before storing
    const sanitized = {
      title: sanitizeAnnouncement(data.title),
      body: sanitizeAnnouncement(data.body),
    };

    // Verify sanitization didn't strip everything critical
    if (!sanitized.title.trim()) {
      throw new Error('Title cannot be empty after sanitization');
    }

    // Store sanitized content
    return await db
      .from('announcements')
      .insert({ ...sanitized, workspace_id: data.workspaceId })
      .select()
      .single();
  }
);
```

### Step 4: Verify Output Encoding (React)

React JSX automatically HTML-escapes text nodes. Verify for dynamic content:

```tsx
// SAFE - React auto-escapes
<p>{userInput}</p>

// UNSAFE - dangerouslySetInnerHTML bypasses escaping
<p dangerouslySetInnerHTML={{ __html: userInput }} /> // ❌ Never do this

// SAFE - Use sanitized content if HTML formatting needed
<p dangerouslySetInnerHTML={{ __html: sanitizeAnnouncement(userInput) }} /> // ✅
```

### Step 5: Content Security Policy (CSP) Headers

Add to `src/server.ts` (if CSP not already configured):

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const response = new Response(...);
    
    // Strict CSP to prevent inline script execution
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' https://cdn.example.com", // Only safe sources
      "style-src 'self' 'nonce-{random}'", // Nonce for inline styles if needed
      "img-src 'self' data: https:", // Allow images
      "connect-src 'self' wss: https:", // API endpoints only
      "frame-ancestors 'none'", // Block embedding in iframes
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '));
    
    return response;
  }
};
```

---

## Testing Checklist

- [ ] Test with `<script>alert('xss')</script>` in title → should be stripped
- [ ] Test with `<img src=x onerror=alert('xss')>` in body → should be stripped
- [ ] Test with allowed tags `**bold**` → should render as `<b>bold</b>`
- [ ] Test Unicode escaping `"<script>"` → should be decoded and stripped
- [ ] Test DOM-based XSS in client-side components (React devtools)
- [ ] Test stored XSS by creating announcement, reloading page, verifying no JS execution

---

## Verification

### Before Shipping
1. Run `npm audit` - verify no DOMPurify vulnerabilities
2. Manual testing with OWASP XSS test cases
3. Browser DevTools - confirm no inline `<script>` in sanitized output
4. CSP report-uri check - verify no CSP violations in production

### Ongoing
- Monitor DOMPurify security advisories
- Audit announcement/brief DB for suspicious content (quarterly)
- Log all sanitization failures for detection of attack patterns

---

## References
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Config Docs](https://github.com/cure53/DOMPurify)
- [React Security Best Practices](https://react.dev/reference/react-dom/dangerouslySetInnerHTML)
