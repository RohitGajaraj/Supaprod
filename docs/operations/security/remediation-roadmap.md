# Security Remediation Roadmap

> _Created: 2026-08-04 · Last updated: 2026-08-04_

**Audit Date:** 2026-07-18  
**Risk Score:** 42/100 (Medium)  
**Status:** IN PROGRESS  
**Owner:** Security Team + Development

---

## Executive Summary

| Category | Finding | Severity | Status |
| --- | --- | --- | --- |
| Session Management | Weak ID generation (Date.now + Math.random) | **HIGH** | 🔧 FIXED |
| Script Injection | Token validation missing (__IMPECCABLE_TOKEN__) | **HIGH** | 🔧 IN PROGRESS |
| Data Protection | Unencrypted localStorage | **MEDIUM** | 🔧 IN PROGRESS |
| XSS Prevention | User-generated content unsanitized | **MEDIUM** | 📋 PLANNED |
| CSRF Protection | Token validation unconfirmed | **MEDIUM** | 🔍 REVIEW |
| Encryption | Sensitive data not encrypted at rest | **LOW** | 📋 PLANNED |

---

## Phase 1: Critical Fixes (This Week)

### 1.1 Session ID Generation ✅ DONE
**File:** `.kiro/skills/impeccable/scripts/live-browser-session.js` (lines 14-25)  
**Change:** Replace `Date.now() + Math.random()` with `crypto.getRandomValues()`

**Why This Matters:**  
- **Before:** Session IDs were predictable (Date.now has millisecond precision = ~3,600 guesses/hour)
- **After:** 128-bit cryptographic randomness = 2^128 combinations (~10^38)
- **Attack Prevented:** Session hijacking via ID prediction

**Verification:**
```bash
# Verify new ID generation
node -e "
const arr = new Uint8Array(16);
crypto.getRandomValues(arr);
console.log(Array.from(arr, b => b.toString(16).padStart(2, '0')).join(''));
"
```

**Status:** ✅ Implemented in edit above

---

### 1.2 Token Injection Validation 🔧 IN PROGRESS
**File:** `.kiro/skills/impeccable/scripts/live-browser.js` (lines 16-27)  
**Change:** Add `TOKEN_SIGNATURE` verification + format validation

**Why This Matters:**  
- **Before:** Server response could be modified by MITM to inject malicious token/port
- **After:** HMAC signature proves token origin from trusted server
- **Attack Prevented:** Man-in-the-middle code injection

**Implementation Status:**
- ✅ Added `TOKEN_SIGNATURE` check
- ✅ Added format validation (UUID + port)
- 📋 TODO: Server-side signature generation (see section 2.2)

---

### 1.3 Encrypt Sensitive Session Data 🔧 IN PROGRESS
**File:** New `.kiro/skills/impeccable/scripts/live-browser-crypto.js`  
**Change:** AES-256-GCM encryption for localStorage

**Why This Matters:**  
- **Before:** Session state visible in plaintext to browser extensions / DevTools
- **After:** 256-bit encryption + unique IV per session
- **Attack Prevented:** Session hijacking via localStorage access

**Implementation Status:**
- ✅ Created `live-browser-crypto.js` with PBKDF2 key derivation
- ✅ AES-GCM encryption with random IV
- 📋 TODO: Integrate with safeWrite/safeRead in session.js
- 📋 TODO: Test with browser DevTools

---

## Phase 2: Input Sanitization (Next 2-3 Days)

### 2.1 XSS Prevention Implementation
**Files:** 
- `src/lib/announcements.functions.ts` (server)
- `src/lib/briefs.functions.ts` (server)
- `src/lib/calendar.functions.ts` (server)

**Change:** Add DOMPurify sanitization in server functions

**Why This Matters:**  
- **Before:** User input stored verbatim in DB; rendered without escaping downstream
- **After:** Input sanitized before storage; whitelist-based tag filtering
- **Attack Prevented:** Stored XSS via announcements/briefs/transcripts

**Implementation Guide:** See `docs/operations/security/xss-prevention-guide.md`

**Estimated Effort:** 4-6 hours

---

### 2.2 Server-Side HMAC Signing
**File:** Live-mode server initialization code  
**Change:** Sign token with HMAC-SHA256 before injection

**Code Pattern:**
```typescript
import crypto from 'crypto';

const SERVER_SECRET = process.env.IMPECCABLE_SECRET; // 64-char random hex
const token = crypto.randomUUID();
const signature = crypto
  .createHmac('sha256', SERVER_SECRET)
  .update(token)
  .digest('base64');

// Inject into HTML:
// window.__IMPECCABLE_TOKEN__ = '${token}'
// window.__IMPECCABLE_TOKEN_SIGNATURE__ = '${signature}'
```

**Estimated Effort:** 1-2 hours

---

## Phase 3: Infrastructure Hardening (Week 2)

### 3.1 Content Security Policy (CSP)
**File:** `src/server.ts`  
**Change:** Add CSP headers to all responses

**Headers to Add:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'nonce-...'; img-src 'self' data: https:; connect-src 'self' wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

**Why:** Provides defense-in-depth against script injection even if sanitization fails

**Estimated Effort:** 2-3 hours

---

### 3.2 CSRF Token Validation
**File:** Review middleware in `src/lib/ai/runtime.server.ts` + `src/routes/api/*`

**Current Status:** Handlers use `.middleware([auth-middleware])` but CSRF validation not visible in minified output

**Action:**
- [ ] Verify CSRF token generated for all state-modifying requests
- [ ] Verify token validated server-side before execution
- [ ] Add rate limiting to approval/decision endpoints

**Estimated Effort:** 2-4 hours

---

### 3.3 At-Rest Encryption for Sensitive Data
**Files:** Database migrations  
**Change:** Encrypt PII + decision records in DB

**Approach:**
- Use Supabase Transparent Encryption (if available)
- Or: Client-side encryption with key rotation
- Priority fields: meeting transcripts, approvals, sensitive decisions

**Estimated Effort:** 6-8 hours

---

## Phase 4: Monitoring & Validation (Week 2-3)

### 4.1 Security Logging
**File:** `src/lib/observability/security.ts` (new)

**Log on:**
- Failed token validation attempts
- XSS sanitization events (anomalies)
- CSRF token mismatches
- Encryption/decryption errors
- Rate limit violations

**Estimated Effort:** 3-4 hours

---

### 4.2 Automated Security Tests
**File:** `tests/security/*.test.ts` (new suite)

```typescript
describe('XSS Prevention', () => {
  test('sanitizes script tags in announcements', async () => {
    const result = await sanitizeAnnouncement('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });

  test('preserves allowed tags', async () => {
    const result = await sanitizeAnnouncement('**bold** text');
    expect(result).toContain('<b>') || toContain('<strong>');
  });
});

describe('Token Validation', () => {
  test('rejects invalid token format', () => {
    const invalid = 'not-a-uuid';
    expect(() => validateToken(invalid)).toThrow();
  });
});

describe('Session Encryption', () => {
  test('encrypts/decrypts session data', async () => {
    const original = JSON.stringify({ userId: '123', role: 'admin' });
    const encrypted = await encrypt('session-id', original);
    const decrypted = await decrypt('session-id', encrypted);
    expect(decrypted).toBe(original);
  });
});
```

**Estimated Effort:** 4-5 hours

---

## Timeline & Resource Allocation

```
Phase 1 (Critical)    | Tue-Wed | 6-8 hours  | BLOCKING for launch
Phase 2 (Sanitization)| Thu-Fri | 10-12 hours| MUST complete before YC demo
Phase 3 (Hardening)   | Mon-Tue | 12-15 hours| Post-launch hardening
Phase 4 (Monitoring)  | Wed-Thu | 10-12 hours| Continuous improvement
```

**Total Effort:** ~45 hours (assumes 1 senior engineer)

---

## Success Criteria

- [ ] All `HIGH` severity vulnerabilities fixed & tested
- [ ] No secrets exposed in source/config
- [ ] XSS payloads fail to execute in announcements/briefs/transcripts
- [ ] Session IDs unpredictable (entropy test passes)
- [ ] CSRF tokens validated on all state-modifying endpoints
- [ ] No new XSS/CSRF/injection vulnerabilities in security test suite
- [ ] All findings documented in ADR-XXX (Architecture Decision Record)

---

## Risk Mitigation During Implementation

**If Phase 1 not complete by Friday:**
- Disable live-mode injection until token validation is done
- Run announcement/brief creation behind additional approval gate
- Add 24-hour content review queue for high-risk surfaces

**If Phase 2 not complete by demo:**
- Demo with sanitization enabled (show feature works)
- Flag "Content filtering enhancements in progress" to investors
- Commit timeline to follow-up PR

---

## Post-Ship Maintenance

**Monthly:**
- Run `npm audit` for dependency vulnerabilities
- Review security logs for attack patterns
- Rotate encryption keys
- Audit DB for malformed content

**Quarterly:**
- Penetration testing (self or third-party)
- Security-focused code review of auth/session/crypto code
- Update OWASP Top 10 mitigations

**Annually:**
- Full security audit by external firm
- Compliance review (GDPR, SOC 2, if applicable)
