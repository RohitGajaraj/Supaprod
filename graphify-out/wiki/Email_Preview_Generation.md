# Email Preview Generation

> 31 nodes · cohesion 0.14

## Key Concepts

- **email.server.ts** (20 connections) — `src/lib/email.server.ts`
- **waitlist-email.server.ts** (15 connections) — `src/lib/waitlist-email.server.ts`
- **generate-email-preview.ts** (13 connections) — `docs/growth/branding/generate-email-preview.ts`
- **sendEmail()** (9 connections) — `src/lib/email.server.ts`
- **a1Html()** (9 connections) — `src/lib/waitlist-email.server.ts`
- **absoluteUrl()** (7 connections) — `src/lib/email.server.ts`
- **emailShell()** (7 connections) — `src/lib/email.server.ts`
- **a1Text()** (6 connections) — `src/lib/waitlist-email.server.ts`
- **sendWaitlistWelcome()** (6 connections) — `src/lib/waitlist-email.server.ts`
- **emailButton()** (5 connections) — `src/lib/email.server.ts`
- **sendInviteEmail()** (5 connections) — `src/lib/email.server.ts`
- **waitlist-email.test.ts** (5 connections) — `src/lib/waitlist-email.test.ts`
- **inline()** (4 connections) — `docs/growth/branding/generate-email-preview.ts`
- **readEmailConfig()** (3 connections) — `src/lib/email.server.ts`
- **A1_SUBJECT** (3 connections) — `src/lib/waitlist-email.server.ts`
- **greeting()** (3 connections) — `src/lib/waitlist-email.server.ts`
- **launchSentence()** (3 connections) — `src/lib/waitlist-email.server.ts`
- **b64()** (2 connections) — `docs/growth/branding/generate-email-preview.ts`
- **card()** (2 connections) — `docs/growth/branding/generate-email-preview.ts`
- **appOrigin()** (2 connections) — `src/lib/email.server.ts`
- **RFC-8058** (2 connections) — `src/lib/email.server.ts`
- **EMAILS** (1 connections) — `docs/growth/branding/generate-email-preview.ts`
- **OUT** (1 connections) — `docs/growth/branding/generate-email-preview.ts`
- **ROOT** (1 connections) — `docs/growth/branding/generate-email-preview.ts`
- **EmailConfig** (1 connections) — `src/lib/email.server.ts`
- *... and 6 more nodes in this community*

## Relationships

- [Email Health and Integrity](Email_Health_and_Integrity.md) (4 shared connections)
- [Slack Digest Notifications](Slack_Digest_Notifications.md) (4 shared connections)
- [Payment and Membership](Payment_and_Membership.md) (3 shared connections)
- [Design Parser Utilities](Design_Parser_Utilities.md) (2 shared connections)
- [Landing Page Components](Landing_Page_Components.md) (2 shared connections)

## Source Files

- `docs/growth/branding/generate-email-preview.ts`
- `src/lib/email.server.ts`
- `src/lib/waitlist-email.server.ts`
- `src/lib/waitlist-email.test.ts`

## Audit Trail

- EXTRACTED: 138 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*