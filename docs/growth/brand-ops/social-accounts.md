# Social accounts — the claim runbook and the live ledger

> _Created: 2026-08-05 · Last updated: 2026-08-05_

The **operations** half of [`brand-supaprod.md`](./brand-supaprod.md) §6. That section decided the handle convention and why; this file is what you execute and what you record afterward. Open it when you are about to claim an account, or when you need to know what state an account is actually in.

**Why this exists.** The playbook said *"same hour as purchase, claim the social handles."* The domains were bought 2026-07-16 and the handles were still unclaimed 20 days later, because the decision lived in a strategy document and nobody could act from it. This file is actionable, so that cannot repeat.

---

## 0. Before you claim anything

Three prerequisites, in this order. Skipping any of them makes an account you cannot hand to anyone else later.

### 0.1 Create the owner address

Every account is created against **`social@supaprod.ai`**, never a personal Gmail. Ownership is then transferable and recoverable.

The Cloudflare catch-all already routes that address, so it works today. **Create it explicitly anyway**, so it survives the catch-all ever being switched off:

> Cloudflare → `supaprod.ai` zone → Email → Email Routing → Create custom address → `social` → destination = your verified inbox

### 0.2 Set up the vault

**Proton Pass Free**, and the vault account is created under **`founder@supaprod.ai`** — not your personal Apple ID.

The reason is not that iCloud Keychain is insecure. It is that it is *personal*: it cannot be handed to a first hire, cannot be audited, and dies with the Apple ID. These are company assets.

Why Proton over Bitwarden, which is the better general manager: **Bitwarden moved integrated TOTP behind Premium ($19.80/yr) in January 2026.** Every account below needs 2FA, so free plus TOTP now points at Proton Pass. It also gives 10 hide-my-email aliases, which are useful for signups. Free sharing is limited to one other person, so a second hire is the upgrade trigger.

Keep Apple Passwords as the autofill convenience layer if you like it. The Proton vault is the system of record.

> **⚠️ Standing debt, opened 2026-08-05.** The vault does not exist yet. The founder claimed the GitHub organisation before setting one up, using his existing personal GitHub login, and later accounts may follow the same pattern.
>
> This was the right call in the moment. A handle someone else takes while you are learning a new password manager is not recoverable; a vault migration is an afternoon. But it is a real debt and it has a specific shape:
>
> - **The `supaprod` GitHub org is controlled entirely by one personal account** whose password and recovery codes are not held anywhere the company can reach.
> - Losing that personal account loses the organisation with it.
>
> **The minimum that closes the worst of it, whatever tool you end up using:** confirm 2FA is on for that personal account, generate its recovery codes at `github.com/settings/auth/recovery-codes`, and store them somewhere you would still have after losing your phone. Do the same for every account claimed before the vault exists, then migrate the lot in one pass.
>
> Update this block when the vault is live and fill in every `Vault entry` cell in §8.

### 0.3 Know what goes where

| Goes in the vault | Goes in Notion and this file |
| --- | --- |
| Password | Platform, handle, profile URL |
| TOTP seed | Status, date claimed |
| **2FA recovery / backup codes** | Which role email owns it |
| Security questions | Which 2FA method |
| | The *name* of the vault entry |

**Recovery codes are the most valuable secret here.** They bypass 2FA entirely. They live in the vault entry's notes and nowhere else, ever.

### 0.4 Re-verify availability first

Run this immediately before you start. A table from three weeks ago is a guess.

```bash
bash scripts/check-handles.sh
```

Treat `200` on a bot-walled platform as **unknown**, never as taken.

---

## 1. Verified state, 2026-08-05

Checked live this session. GitHub and Bluesky signals are reliable; the rest are best-effort against bot walls.

| Platform | Handle | Checked | Status |
| --- | --- | --- | --- |
| GitHub org | `supaprod` | 404, reliable | ✅ **CLAIMED 2026-08-05** |
| LinkedIn | `company/supaprod` | 404 | Available |
| Bluesky | `supaprod` | API cannot resolve | **Available, the exact name** |
| X | `@supaprodhq` | 404 | ✅ **CLAIMED 2026-08-05** |
| YouTube | `@supaprodhq` | 404 | Available (`@supaprod` taken) |
| npm | `supaprod` | 404 | Available |
| PyPI | `supaprod` | 404 | Available |
| Instagram | `@supaprodhq` | bot-walled | Unknown, check at signup |
| TikTok | `@supaprodhq` | blocked | Unknown, check at signup |
| Reddit | `u/supaprodhq` | bot-walled | Unknown, check at signup |
| Product Hunt | `supaprod` | 403 | Unknown, check at signup |
| Threads · Mastodon · Discord · Crunchbase | see below | not checked | Claim in pass 3 |

The `@supaprodhq` convention holds: exact `supaprod` where it is free, `@supaprodhq` everywhere it is not. **The same variant everywhere** matters more than the suffix itself.

---

## 2. Claim order

Not alphabetical. Contested and reliable-signal platforms go first, because those are the ones that can be taken from under you.

**Pass 1, contested.** GitHub org · X · YouTube · Instagram · LinkedIn
**Pass 2, high value.** Bluesky (exact name) · Product Hunt · TikTok
**Pass 3, defensive.** Threads · Mastodon · Discord · Reddit · npm · PyPI · Crunchbase

**One hard dependency: Instagram before Threads.** A Threads profile is created *from* an Instagram account. It is not a parallel task, and doing it out of order means redoing it.

---

## 3. The copy pack

Every line below is cut from ratified canon, aimed at whoever actually walks in that particular door. Paste them exactly. Character counts are measured, not estimated.

> ### ⛔ THE STATION-NAME RULE, founder ruling 2026-08-05
>
> **Never list the seven station names in a bio.** "Discover, decide, plan, design, build, ship, learn" is *internal vocabulary*. To a stranger it is seven words that explain nothing: it describes our architecture, not their benefit. The GitHub org description shipped with exactly that list and the founder rejected it on sight.
>
> **Every bio states the category, then what the product DOES, in plain verbs:**
>
> > The agentic-first operating system for product teams. Tells you what to build, builds and ships it, then learns what actually worked.
>
> That is the same three layers — director, operating system, company brain — but as things that happen *for the reader* rather than labels on our own map. The station names belong in product surfaces and in the diagram on the banners, where they are drawn and therefore self-explaining. They never appear as a bare list in prose.

> **Corrected 2026-08-05: it is "agentic-first", not "agent-first".** The live `/brief` and `/investors` heroes both run `THE AI-NATIVE, AGENTIC-FIRST OPERATING SYSTEM FOR PRODUCT TEAMS`, and `agentic-first` is the phrase used in eight places across `src/`.
>
> **Where it had actually leaked, checked live 2026-08-05.** This note previously said `README.md` line 8 was "the last holdout". That was stale: `README.md` has zero occurrences of the old form. The two places still carrying it were both on GitHub itself, where nobody thinks to grep:
>
> - the **org description** (`github.com/organizations/Supaprod/settings/profile`) — founder-editable only
> - the **repo description** on `RohitGajaraj/Supaprod` — fixed via the API this session
>
> The lesson worth keeping: a phrase can be clean in every file in the repo and still be wrong on the surfaces a stranger actually reads first. Grep the repo, then check the platform fields.

**Shared facts for every profile**

| Field | Value |
| --- | --- |
| Display name | `Supaprod` |
| Link | `https://supaprod.ai` |
| Contact | `hello@supaprod.ai` |
| Location | Remote |
| Pronunciation, for any bio with room | SOO-pa-prod. Say it with an A. |

### X, `@supaprodhq` — aimed at the user, the developer, the press

> The agentic-first operating system for product teams. It tells you what to build, ships it, then learns what actually worked. Say it with an A: SOO-pa-prod.

### LinkedIn, `company/supaprod` — aimed at the investor, the candidate, procurement

Tagline:

> The agentic-first operating system for product teams

About:

> Engineers got agents. Product people got chatbots.
>
> Supaprod is the operating system that closes that gap. It tells you what to build, builds and ships it, then learns what actually worked. Agents do the product work end to end. You make the calls, and every call is on the record with the evidence behind it.
>
> The part that compounds is the last step. Supaprod joins the decisions you made to the outcomes you actually got, labelled over time. So the next call is not a blank page: it tells you what is right, and warns you before you repeat what went wrong.
>
> That is the difference between a tool that files your history and one that improves your judgement.
>
> Built for the product leader who is tired of deciding twice.
>
> Pronounced SOO-pa-prod. Say it with an A.
>
> supaprod.ai

### GitHub org, `supaprod` — aimed at the developer and the candidate

> The agentic-first operating system for product teams. Tells you what to build, builds and ships it, then learns what actually worked.

132 characters. **Corrected 2026-08-05** from a version that ended "Discover, decide, plan, design, build, ship, learn" — see the station-name rule above.

**GitHub has no organisation banner.** Verified live against `api.github.com/orgs/supaprod`: the only image field is `avatar_url`, a square profile picture. There is no banner, cover or header field anywhere on an org. Three separate things are easy to confuse:

| What | Where | Image |
| --- | --- | --- |
| Org profile picture | Org → Settings → Profile | square avatar only |
| **Repo** social preview | `Repo → Settings → General → Social preview → Edit` | 1280x640, **under 1MB** — use the 1x file, the @2x is 1.15MB and will be rejected. This is the card shown when the repo LINK is shared; it does not appear on the org page. |
| Org profile README | a **public** repo named `.github`, file `profile/README.md` | the only way to put a banner image on `github.com/supaprod` |

### YouTube, `@supaprodhq` — aimed at the user

Channel description:

> Supaprod is the agentic-first operating system for product teams.
>
> It tells you what to build, builds it, ships it, checks what actually happened, and learns from it, so the next call comes with evidence instead of a blank page.
>
> Here you will find product walkthroughs, teardowns of real product bets, and the whole loop running in practice, from the first signal to what the outcome taught us.
>
> Pronounced SOO-pa-prod. Say it with an A.
>
> supaprod.ai

### Instagram, `@supaprodhq` — aimed at the broad first impression

> The agentic-first operating system for product teams. Tells you what to build, ships it, learns what worked.

### Threads — created from the Instagram account

Same bio as Instagram. Same avatar. Nothing new to write.

### TikTok, `@supaprodhq`

> Agents that own outcomes, not just output. The agentic-first OS for product teams.

### Bluesky, `supaprod.bsky.social` — the exact name is free here

> The agentic-first operating system for product teams. It tells you what to build, ships it, then learns what actually worked, so the next call arrives with evidence. SOO-pa-prod, with an A.

### Mastodon, `@supaprodhq`

> The agentic-first operating system for product teams.
>
> It tells you what to build, builds and ships it, then learns what actually worked. Agents do the product work end to end, you make the calls, and the next call is not a blank page.
>
> Pronounced SOO-pa-prod. Say it with an A.

### Product Hunt

Tagline:

> The product team that learns what actually worked

Description:

> Supaprod runs the whole product lifecycle across seven stations. Agents do the product work end to end and you make the calls. Then it joins those calls to the outcomes you actually got, so the next decision starts with evidence rather than a blank page.

### Discord

> Agents that own outcomes, not just output. The agentic-first OS for product teams.

### Crunchbase — aimed at the investor and procurement

> Supaprod is the agentic-first operating system for product teams. It tells you what to build, builds and ships it, then learns what actually worked, with agents doing the product work end to end and the human making every call. Its compounding asset is the join between a team's own decisions and its own outcomes, labelled over time, which turns past judgement into forward guidance.

### npm and PyPI

> The agentic-first operating system for product teams.

---

## 4. What must never appear in any of this

Standing constraints, all pre-existing canon. The audit in §7 checks them mechanically.

| Never | Instead |
| --- | --- |
| "remembers", "stores", "logs", "archive", "searchable history" | "learns", "guides", "it tells you what is right next time" |
| "AI PM tool" | never spoken at all |
| "Cursor for PMs" | never |
| Naming Cursor, Lovable or Devin as ours | they are the era's proof, not our subcontractors |
| Commit counts, feature-register numbers | nothing quantified that flatters by volume |
| YC mentions in generic materials | keep them where they belong |
| `SupaProd` | `Supaprod` in prose, `supaprod` in handles |
| Em dashes, en dashes, AI-cliché phrasing | plain sentences |

**And nothing that claims traction we do not have.** Market contact is near zero: 8 users, all founder or internal, no revenue. Every line above describes what the product *does*, never how many people use it. A `WIRING` claim is never said publicly until it runs.

---

## 5. Which asset goes where

> **The banners were rebuilt on 2026-08-05 and the rejected set is gone.** The compositions the founder turned down twice have been deleted, not deprecated, so there is no way to upload one by mistake. The replacement is the **ORRERY** world: see [`../branding/README.md`](../branding/README.md).
>
> The avatars, icons and mark rasters were never the problem and are unchanged.

All paths under `docs/growth/branding/`. Generated by **`generate-banners.ts`** from `orrery.ts`; `generate-social.ts` still owns the avatars, icons, marks and video frames. Every filename is verified against its own pixel dimensions at build time.

**Every banner exists in two grounds.** The filename pattern is `<base>-<ground>-<W>x<H>.png`. **Dark is the default upload** — it is the premium/platinum register the founder ratified — and the light variant is held for surfaces that demand a white ground.

| Platform | Avatar | Banner or cover (dark = upload this) |
| --- | --- | --- |
| X | `avatars/avatar-dark-400.png` | `social/x-header-dark-1500x500.png` |
| LinkedIn | `avatars/avatar-dark-400.png` | `social/linkedin-cover-dark-1128x191.png` |
| YouTube | `avatars/avatar-dark-800.png` | `social/youtube-banner-dark-2560x1440.png` |
| GitHub org | `avatars/avatar-dark-500.png` | `social/github-social-preview-dark-1280x640.png` (repo Settings, by hand) |
| Instagram · Threads | `avatars/avatar-dark-320.png` | none |
| TikTok | `avatars/avatar-dark-200.png` | none |
| Bluesky | `avatars/avatar-dark-1024.png` | `social/bluesky-banner-dark-3000x1000.png` |
| Mastodon | `avatars/avatar-dark-400.png` | `social/mastodon-header-dark-1500x500.png` |
| Discord | `avatars/avatar-dark-512.png` | `social/discord-banner-dark-960x540.png` |
| Product Hunt | `avatars/avatar-dark-240.png` | `social/producthunt-gallery-dark-1270x760.png` |
| Crunchbase | `avatars/avatar-dark-400.png` | none |
| Any link preview (OG) | — | `social/og-dark-1200x630.png` |

**Use the dark avatar everywhere.** It carries its own rounded ground, so it reads identically against a light platform interface and a dark one. The light variant exists for surfaces we control, not for profile pictures.

**The GitHub social preview must be uploaded by hand.** GitHub exposes no REST field for it (verified against the repo API 2026-08-04): Repo → Settings → General → Social preview → Upload an image.

---

## 6. The walkthrough

Everything you need is here. Work top to bottom. Each platform ends with the **same close-out**, written once below so it is not repeated fifteen times.

> **A note on accuracy.** Signup flows change wording and reorder screens without notice. Field *names* below may differ slightly from what you see; the *values* and the *order of operations* are what matter. Where a step is genuinely irreversible or easy to get wrong, it is marked ⚠️.

### The close-out, done after every single account

1. **Password** into Proton Pass. Let it generate one; never reuse.
2. **Turn on 2FA**, authenticator app rather than SMS wherever offered. SMS is SIM-swappable.
3. **Save the TOTP seed** into the same Proton Pass entry, so the vault also generates the codes.
4. ⚠️ **Save the recovery / backup codes** into that entry's notes. These bypass 2FA entirely and are the single thing you cannot recover without.
5. **Fill in the ledger row** in §8: URL, status, 2FA method, vault entry name, date.

Do the close-out *before* moving to the next platform. Batching it is how recovery codes get lost.

---

### Pass 1 — the contested five

#### 1. GitHub organisation `supaprod`

The most reliable signal on the list and the one worth doing first.

1. Sign in to GitHub as your personal account.
2. Go to **github.com/account/organizations/new**.
3. Choose the **Free** plan.
4. Organization account name: `supaprod`
5. Contact email: `social@supaprod.ai`
6. "This organization belongs to": **My personal account**.
7. Skip the invite-members step.
8. Go to the org's **Settings → Profile** and set:
   - Display name: `Supaprod`
   - Description: the GitHub line from §3
   - URL: `https://supaprod.ai`
   - Email: `hello@supaprod.ai`
   - Profile picture: `avatars/avatar-dark-500.png`
9. **Settings → Authentication security** and require 2FA for the organisation. GitHub will make you turn 2FA on for your own account first, which is the point.

⚠️ **The close-out works differently here, and it is the one exception on this list.** A GitHub organisation has **no password and no 2FA of its own**. It is owned and controlled entirely by your personal account, so that account's password, 2FA and recovery codes *are* the org's security. There is nothing new to put in the vault.

What to record instead: open the existing Proton Pass entry for your personal GitHub login and note in it that this account now owns the `supaprod` organisation. Then confirm that entry actually holds the personal account's 2FA seed **and its recovery codes**. If it does not, fix that now. Losing the personal account means losing the org, and the org is the more valuable of the two.

⚠️ Do **not** move the existing `RohitGajaraj/Supaprod` repo into the org yet. That is a separate decision with CI, links and clone-URL consequences.

The repo social preview is a different upload and is not part of the org: **repo → Settings → General → Social preview → Upload an image**, using `social/github-social-preview-1280x640.png`. GitHub exposes no API for this, so it is genuinely manual.

#### 2. X `@supaprodhq`

1. Go to **x.com/i/flow/signup**.
2. Name: `Supaprod`. Choose **Use email instead** and enter `social@supaprod.ai`.
3. Date of birth: X requires one. ⚠️ It asks for the *account holder's*, not the company's. Use yours; you can hide it later under Settings → Your account → Account information → Birth date → visibility.
4. Enter the emailed code, then set a password.
5. Skip the interests, the follow suggestions and the notification prompt.
6. X assigns a username. Change it: **Settings → Your account → Account information → Username** → `supaprodhq`.
7. **Profile → Edit profile**:
   - Bio: the X line from §3
   - Location: `Remote`
   - Website: `https://supaprod.ai`
   - Profile photo: `avatars/avatar-dark-400.png`
   - Header: `social/x-header-1500x500.png`
8. Close-out. 2FA lives at **Settings → Security and account access → Security → Two-factor authentication → Authentication app**.

Expect a phone-verification challenge at some point. That is normal for a new account and not a sign anything went wrong.

#### 3. YouTube `@supaprodhq` — ⚠️ the one that is hard to undo

⚠️ **This must be a Brand Account, not a personal channel.** A Brand Account can have multiple managers and can be transferred; a personal channel is welded to one Google login forever. Converting later is possible but messy. This is the single most common irreversible mistake on this list.

1. Sign in to the Google account that should own this. Consider creating a dedicated Google account on `social@supaprod.ai` rather than using a personal one.
2. Go to **youtube.com/channel_switcher**.
3. Click **Create a new channel**. This path creates a **Brand Account**. Going through "Create a channel" from the avatar menu on a fresh account creates a *personal* channel instead, which is the trap.
4. Brand account name: `Supaprod`.
5. Go to **youtube.com/customize**:
   - **Branding** tab: Picture `avatars/avatar-dark-800.png`, Banner `social/youtube-banner-2560x1440.png`
   - **Basic info** tab: Name `Supaprod`, Handle `@supaprodhq`, Description from §3, add a link to `https://supaprod.ai`, contact `hello@supaprod.ai`
6. Close-out, on the Google account that owns the Brand Account.

The banner will preview across TV, desktop and mobile crops. Everything legible sits inside the 1546x423 safe zone by construction, so all three should look right.

#### 4. Instagram `@supaprodhq` — ⚠️ do this before Threads

1. Go to **instagram.com/accounts/emailsignup**.
2. Email `social@supaprod.ai`, Full name `Supaprod`, Username `supaprodhq`, password.
3. Enter the emailed confirmation code. A birthday is required.
4. Switch to a professional account: **Settings → Account type and tools → Switch to professional account → Business**, category `Software`.
5. **Edit profile**: bio from §3, link `https://supaprod.ai`, photo `avatars/avatar-dark-320.png`.
6. Close-out. 2FA is under **Settings → Accounts Centre → Password and security → Two-factor authentication → Authentication app**.

#### 5. LinkedIn `company/supaprod` — ⚠️ the first genuinely public step

⚠️ A company page is **publicly visible and indexable the moment it exists**. There is no unlisted state. This is the step that makes the name public, which is why the trademark item in §9 is worth starting in parallel.

You need your personal LinkedIn profile to be the admin; it must meet LinkedIn's account-age and connection thresholds.

1. Go to **linkedin.com/company/setup/new**.
2. Page type: **Company**.
3. Name: `Supaprod`
4. LinkedIn public URL: `linkedin.com/company/supaprod`
5. Website: `https://supaprod.ai`
6. Industry: `Software Development`
7. Company size: `1 employee`  ⚠️ Answer honestly. This is the field investors and procurement actually read, and inflating it is the kind of thing that gets checked.
8. Company type: `Privately Held`. ⚠️ No entity is incorporated yet, so if a legal-entity field is required, leave it blank rather than inventing one.
9. Logo: `avatars/avatar-dark-400.png`. Tagline: the LinkedIn tagline from §3.
10. Tick the authorisation checkbox and create.
11. **Edit page** and add: the About text from §3, cover image `social/linkedin-cover-1128x191.png`, location `Remote`, founded year.
12. Close-out applies to your personal LinkedIn login, which is what actually controls the page.

---

### Pass 2 — high value

#### 6. Bluesky `supaprod` — the exact name, free

1. Go to **bsky.app** and choose **Create account**. Hosting provider: **Bluesky Social**.
2. Email `social@supaprod.ai`, password, birthdate.
3. Handle: `supaprod` — this becomes `supaprod.bsky.social`. ⚠️ Claim the **exact** name here, not the hq variant. This is the one platform where the exact name is available.
4. Profile: display name `Supaprod`, description from §3, avatar `avatars/avatar-dark-1024.png`, banner `social/bluesky-banner-3000x1000.png`.
5. Close-out.

**Worth doing soon after:** Bluesky lets you use a domain you own as your handle, so `@supaprod.ai` replaces `@supaprod.bsky.social`. It is free, self-verifying, and better branding. Settings → Handle → I have my own domain, then add the TXT record it gives you at `_atproto.supaprod.ai` in Cloudflare.

#### 7. Product Hunt

1. Sign up at **producthunt.com** with `social@supaprod.ai`.
2. Complete your maker profile first; a bare account cannot claim a product.
3. Create the product page with the Product Hunt tagline and description from §3, `avatars/avatar-dark-240.png` as the thumbnail, and `social/producthunt-gallery-1270x760.png` in the gallery.
4. ⚠️ Keep it **unlisted / not launched**. Launching is a card you play once, and the launch sequence says it fires after the demo is live and real beta stories exist.
5. Close-out.

#### 8. TikTok `@supaprodhq`

1. **tiktok.com/signup** → Use phone or email → **Email**.
2. Birthday, `social@supaprod.ai`, password, emailed code.
3. TikTok assigns a random username. Change it: **Profile → Edit profile → Username** → `supaprodhq`.
4. Switch to Business: **Settings and privacy → Account → Switch to Business Account**, category `Software`. This is what unlocks the website field.
5. Bio from §3, link `https://supaprod.ai`, photo `avatars/avatar-dark-200.png`.
6. Close-out.

---

### Pass 3 — defensive

#### 9. Threads

1. Go to **threads.net** and sign in **with the Instagram account**.
2. Accept the import of name and photo, or set the same bio from §3.
3. No separate close-out: Instagram's credentials and 2FA govern it.

#### 10. Mastodon `@supaprodhq`

1. Pick one instance and stay on it. **fosstodon.org** suits a developer-adjacent brand; **mastodon.social** is the generic default. Migration later is possible but publicly visible.
2. Sign up with `supaprodhq` and `social@supaprod.ai`. ⚠️ Some instances are approval-gated and ask why you are joining; answer plainly.
3. Profile: display name `Supaprod`, bio from §3, avatar `avatars/avatar-dark-400.png`, header `social/mastodon-header-1500x500.png`.
4. In **Edit profile → Profile metadata**, add `Website` → `https://supaprod.ai`. Mastodon will show it as verified once the site links back with `rel="me"`.
5. Close-out.

#### 11. Discord

1. Register at **discord.com/register** with `social@supaprod.ai`.
2. Create the server: **+ → Create My Own → For a club or community**. Name `Supaprod`, icon `avatars/avatar-dark-512.png`.
3. **Server Settings → Overview**: description from §3.
4. ⚠️ `social/discord-banner-960x540.png` cannot be applied yet. A server banner needs **Boost Level 2**. The file is ready for when that is true; do not go hunting for the setting.
5. Do not create a public invite link. That is a launch-day decision.
6. Close-out.

#### 12. Reddit `u/supaprodhq`

1. **reddit.com/register**, username `supaprodhq`, `social@supaprod.ai`.
2. Set the avatar and a short bio.
3. ⚠️ Defensive only. Reddit punishes brand self-promotion hard. Read each subreddit's rules before the account ever posts, and expect to build comment karma first.
4. Close-out.

#### 13. npm organisation `supaprod`

1. Create a user account at **npmjs.com/signup** if you do not have one.
2. Then create the **organisation** at **npmjs.com/org/create** → name `supaprod` → **Free** plan.
3. Close-out. npm supports authenticator 2FA and you should enable it; the account can publish packages under your name.

#### 14. PyPI `supaprod`

1. Register at **pypi.org/account/register**.
2. ⚠️ PyPI **requires** 2FA. You will be forced through it, which is the right outcome anyway. Save the recovery codes.
3. Close-out.

#### 15. Crunchbase

1. Sign up at **crunchbase.com** and add a company profile.
2. Description from §3, logo `avatars/avatar-dark-400.png`, website `https://supaprod.ai`.
3. ⚠️ Submissions are reviewed and can take days. Investor-facing, so it is better filled in nearer to launch when there is more to say than there is today.
4. Close-out.

---

### When you are done

Run the sweep once more and confirm every handle now resolves to you:

```bash
bash scripts/check-handles.sh
```

Everything that was AVAILABLE should read TAKEN. Anything still AVAILABLE means an account did not actually save, which is worth catching the same day rather than the week of launch.

## 7. The audit

Run before publishing any of the copy above.

```bash
# banned vocabulary and the wrong capitalisation
grep -nEi 'remembers|stores|logs|archive|searchable history|AI PM tool|Cursor for PMs|SupaProd' \
  docs/growth/brand-ops/social-accounts.md

# em dashes and en dashes, which the humanized-output convention forbids
grep -n '[——]' docs/growth/brand-ops/social-accounts.md
```

Both should return only rows inside the "never" table in §4.

---

## 8. The ledger

The live state of every account. **No secret ever appears in this table.** Mirrored into Notion; this file is canonical.

| Platform | Handle | URL | Status | Owner email | 2FA | Vault entry | Claimed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GitHub org | `supaprod` | https://github.com/supaprod | **Profile complete** | `social@supaprod.ai` (org contact); login is the founder's personal GitHub account | pending | ⚠️ none yet, see §0.2 | 2026-08-05 |
| X | `@supaprodhq` | https://x.com/supaprodhq | **Claimed** | `social@supaprod.ai` | pending | ⚠️ none yet, see §0.2 | 2026-08-05 |
| YouTube | `@supaprodhq` | | Not started | `social@supaprod.ai` | | | |
| Instagram | `@supaprodhq` | | Not started | `social@supaprod.ai` | | | |
| LinkedIn | `company/supaprod` | | Not started | `social@supaprod.ai` | | | |
| Bluesky | `supaprod` | | Not started | `social@supaprod.ai` | | | |
| Product Hunt | `supaprod` | | Not started | `social@supaprod.ai` | | | |
| TikTok | `@supaprodhq` | | Not started | `social@supaprod.ai` | | | |
| Threads | `@supaprodhq` | | Not started | via Instagram | | | |
| Mastodon | `@supaprodhq` | | Not started | `social@supaprod.ai` | | | |
| Discord | `supaprod` | | Not started | `social@supaprod.ai` | | | |
| Reddit | `u/supaprodhq` | | Not started | `social@supaprod.ai` | | | |
| npm | `supaprod` | | Not started | `social@supaprod.ai` | | | |
| PyPI | `supaprod` | | Not started | `social@supaprod.ai` | | | |
| Crunchbase | `supaprod` | | Not started | `social@supaprod.ai` | | | |

Status values: `Not started` → `Claimed` (handle held, profile empty) → `Profile complete` (bio, avatar, banner, link) → `Verified` (2FA on, recovery codes in the vault, ledger row filled).

**Update this table in the same sitting as the account.** A ledger that is occasionally right is worse than one that admits it does not know.

---

## 8b. Live-account defects found on inspection, 2026-08-05

Checked against the live GitHub API this session, not against this document.

| Where | What is live | What it should be | Severity |
| --- | --- | --- | --- |
| GitHub org description | "The **agent-first** operating system for product teams." | "The **agentic-first** operating system for product teams." | **Fix now.** It is public, and `agentic-first` is the phrase the live `/brief` and `/investors` heroes both run. This is the exact drift §3 warned about. |
| GitHub org `location` | empty | `Remote` | Minor |
| GitHub org avatar | set | unchanged, still correct | none |
| Both accounts | no banner uploaded yet | the ORRERY assets in §5 | expected, they were blocked on sign-off |

**Fixing the GitHub description** (30 seconds, no API field needed for this one, it is a normal profile edit):

> github.com/organizations/supaprod/settings/profile → Description → paste the GitHub line from §3 → Update profile

---

## 9. Open items this raises

| Item | Detail |
| --- | --- |
| `README.md` line 8 still says "agent-first" | It is the last holdout in the repo and it is what the GitHub org description was copied from, which is how the error reached a public surface. Fixing the org without fixing the source means it drifts back. |
| `supaprodhq.com` is still unbought | It was on the §3 BUY TODAY list at $10.46 and never purchased. It is the domain that matches the handle convention. |
| Register items #1 and #2 have fired | `superprod.ai` and `supaprod.io` both have "launch" as their trigger. Launch is mid-September. |
| Item #7 is three weeks overdue | The attorney knockout had a "this or next week" trigger dated 2026-07-16. Public bios make the name discoverable, which is what makes this worth doing now rather than after. |
| The tagline conflict | The ratified tagline ends "and remember", the one word the 2026-08-02 ruling bans. **No bio in §3 uses it**, so nothing is blocked, but it needs a founder call before it goes on the site. |

## Related

- [`brand-supaprod.md`](./brand-supaprod.md) — the handle convention and why, the domain register, the trademark strategy
- [`../branding/README.md`](../branding/README.md) — the brand kit and how the assets above are generated
- [`../../operations/domain-and-email-setup.md`](../../operations/domain-and-email-setup.md) — the live email routing these accounts depend on
