# Social accounts — the claim runbook and the live track record

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

> **⚠️ Corrected 2026-08-07. The original reason given here was wrong.** This section used to say Proton won because "Bitwarden moved integrated TOTP behind Premium in January 2026, so free plus TOTP now points at Proton Pass." Checked against [Proton's own pricing page](https://proton.me/pass/pricing): **Proton Pass Free does not generate TOTP codes either.** Integrated 2FA is marked a paid feature there too, and Free is listed as **0 vaults**, meaning you get the one default vault and cannot create more. Both managers gate the same thing, so that comparison never distinguished them.
>
> **The choice still stands, on a different and better reason.** Proton ships [Proton Authenticator](https://proton.me/authenticator) as a separate free, open-source app for macOS, iOS, Windows, Linux and Android, and **it exports TOTP seeds**. Authy and Microsoft Authenticator do not, which is how people end up unable to leave an authenticator. So the working setup is two free apps, not one paid plan:
>
> | Holds | Tool |
> | --- | --- |
> | Passwords, notes, **2FA recovery codes** | Proton Pass Free |
> | TOTP seeds and the rotating codes | Proton Authenticator, free and exportable |
>
> **Free gives one vault, so use naming instead of folders.** Prefix every company secret `Supaprod — `, and put what the entry controls in its own title. `Supaprod — GitHub (personal login, OWNS the supaprod org)` tells a future reader that the entry is load-bearing; `GitHub` does not.

Proton also gives 10 hide-my-email aliases, useful for signups. Free sharing is limited to one other person, so a second hire is the upgrade trigger.

⚠️ **The Proton recovery phrase goes on paper, never in the vault.** Proton shows it once at signup. It is the one secret that cannot live inside the thing it recovers: lose the Proton account and an in-vault copy is gone with it. Treat it like a passport, not like a password.

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
> > For product managers who ship with agents. Tells you what to build, builds and ships it, then learns what actually worked.
>
> That is the same three layers — director, operating system, company brain — but as things that happen *for the reader* rather than labels on our own map. The station names belong in product surfaces and in the diagram on the banners, where they are drawn and therefore self-explaining. They never appear as a bare list in prose.

> **Corrected 2026-08-05: it is "agentic-first", not "agent-first".** The live `/brief` and `/investors` heroes both run `FOR PRODUCT MANAGERS WHO SHIP WITH AGENTS`, and `agentic-first` is the phrase used in eight places across `src/`.
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

> For product managers who ship with agents. It tells you what to build, ships it, then learns what actually worked. Say it with an A: SOO-pa-prod.

### LinkedIn, `company/supaprod` — aimed at the investor, the candidate, procurement

Tagline:

> For product managers who ship with agents

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

> For product managers who ship with agents. Tells you what to build, builds and ships it, then learns what actually worked.

132 characters. **Corrected 2026-08-05** from a version that ended "Discover, decide, plan, design, build, ship, learn" — see the station-name rule above.

**GitHub has no organisation banner.** Verified live against `api.github.com/orgs/supaprod`: the only image field is `avatar_url`, a square profile picture. There is no banner, cover or header field anywhere on an org. Three separate things are easy to confuse:

| What | Where | Image |
| --- | --- | --- |
| Org profile picture | Org → Settings → Profile | square avatar only |
| **Repo** social preview | `Repo → Settings → General → Social preview → Edit` | 1280x640, **under 1MB** — use the 1x file, the @2x is 1.15MB and will be rejected. This is the card shown when the repo LINK is shared; it does not appear on the org page. |
| Org profile README | a **public** repo named `.github`, file `profile/README.md` | the only way to put a banner image on `github.com/supaprod` |

### YouTube, `@supaprodhq` — aimed at the user

Channel description:

> Supaprod is where product decisions live when agents do the work.
>
> It tells you what to build, builds it, ships it, checks what actually happened, and learns from it, so the next call comes with evidence instead of a blank page.
>
> Here you will find product walkthroughs, teardowns of real product bets, and the whole loop running in practice, from the first signal to what the outcome taught us.
>
> Pronounced SOO-pa-prod. Say it with an A.
>
> supaprod.ai

### Instagram, `@supaprodhq` — aimed at the broad first impression

> For product managers who ship with agents. Tells you what to build, ships it, learns what worked.

### Threads — created from the Instagram account

Same bio as Instagram. Same avatar. Nothing new to write.

### TikTok, `@supaprodhq`

> Agents that own outcomes, not just output. The agentic-first OS for product teams.

### Bluesky, `supaprod.bsky.social` — the exact name is free here

> For product managers who ship with agents. It tells you what to build, ships it, then learns what actually worked, so the next call arrives with evidence. SOO-pa-prod, with an A.

### Mastodon, `@supaprodhq`

> For product managers who ship with agents.
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

> Supaprod is where product decisions live when agents do the work. It tells you what to build, builds and ships it, then learns what actually worked, with agents doing the product work end to end and the human making every call. Its compounding asset is the join between a team's own decisions and its own outcomes, labelled over time, which turns past judgement into forward guidance.

### npm and PyPI

> For product managers who ship with agents.

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

**Every banner exists in two grounds.** The filename pattern is `<base>-<ground>-<W>x<H>.png`, and each has an `@2x` twin. **Dark is the default upload** — the premium/platinum register the founder ratified — and light is held for surfaces that demand a white ground.

### ⚠️ Three upload rules learned the hard way

**1. Upload the `@2x` file wherever the platform allows it.** Platforms are viewed on retina hardware, so a 1x upload gets UPSCALED by the browser and looks soft. That softness is what reads as "pixelated" even when the pixels are exactly correct. A downscale is always sharper than an upscale.

**2. Two platforms cap at 1MB and will REJECT the @2x.** GitHub's social preview and Bluesky's banner both cap at 1MB; the @2x files are 1.15MB and 3.87MB. Use the 1x for those two, and only those two.

**3. The `-safe` variants exist but are NOT shipped. Founder ruling 2026-08-06.**

The problem is real and measured: **X mobile crops roughly 13% off each side** and overlays nav buttons at ~41% of banner height, so the wide composition loses its first letters ("gents that own outcomes", "lot output") and clips the wordmark. Desktop is perfect throughout, which is why it survived review.

The `-safe` files fix that by designing inside the centre 74%. **The founder tried them and reverted**: "it's looking weird again, it's not good." He is right, and the fault is in the fix rather than the diagnosis. It shrank the type *and* indented it, so the composition reads timid instead of repositioned. Shrinking was the wrong lever.

**So X ships the WIDE variant, deliberately**, accepting a clipped mobile crop in exchange for the stronger desktop asset. That is a defensible trade: press, investors and most first-impression traffic arrive on desktop, and the mobile crop still shows the instrument and the bulk of the line.

**Do not "fix" this by swapping in the safe file.** If someone revisits it, the right attempt keeps the type at full size and moves only the horizontal anchor, rather than scaling anything down. The `-safe` files stay in the repo as a starting point for that, not as an upload.

### ⚠️ The avatar column used to name a size per platform. That was wrong, and it cost quality on live accounts.

> **Corrected 2026-08-07, founder-reported.** This table used to send you to `avatar-dark-400.png` for Mastodon, `-240` for Product Hunt, `-200` for TikTok, `-512` for GitHub and `-800` for X. Those numbers are the size each platform *displays at*, and the founder found the mistake the direct way: told to upload 400 or 500 to GitHub and X, he uploaded **1024** instead and it rendered sharper on both.
>
> He is right, and the reasoning is not a matter of taste. **Platforms downscale for display but store what you gave them**, then re-derive every size they need, including the retina and future ones this table cannot know about. Handing a platform a 200px file caps it forever at 200px of real detail. Handing it 1024 costs nothing and lets it stay sharp on hardware that does not exist yet. A downscale is always sharper than an upscale, so the only way to lose is to send too little.
>
> **THE RULE, and it replaces every per-platform avatar number: try `avatars/avatar-dark-1024.png` first, everywhere.** It is 70KB, under every byte cap on this list, so there is no platform where the large file is knowably the wrong answer.
>
> **The smaller sizes are KEPT, deliberately, as the fallback ladder.** Nothing was deleted when this rule changed. A signup form can reject an upload for reasons this table cannot predict: an undocumented pixel ceiling, a stricter cap than the help page admits, a resizer that times out. When that happens, walk **down** the ladder until one is accepted, and note in §8 which size the platform actually took so the next person does not repeat the climb.
>
> `1024 → 800 → 512 → 500 → 400 → 320 → 240 → 200 → 128 → 64`
>
> All ten live in `avatars/` and all ten are generated from the same master, so any rung is correct brand, just less of it. **The only wrong move is starting low.** You can always fall back; you cannot recover detail you never uploaded.
>
> This is the same principle as upload rule 1 above, applied to avatars instead of banners. The two rules disagreed for a month and the avatar one lost.

### ⚠️ The LinkedIn cover was RECOMPOSED 2026-08-07, and the old JPEG was a trap

> **Founder-reported on upload: "it was not at all aligned good, and it was outside the preferred area."** He was right, and it was a composition fault rather than an upload fault. Re-uploading the same file would not have helped.
>
> **Measured against the live page** (signed in as page admin, `View as member`), not inferred: the cover container renders at **804x132 = 6.09:1**, so the 4200x700 file is the correct ratio and desktop applies no meaningful crop. **LinkedIn's square logo plate occupies x 3.0%–18.9% of the cover width**, which is x 126–794 on the master. The old layout started the wordmark at x=887 — **an 8px visible gap from the logo plate.** That is the whole defect, and it is why it read as misaligned.
>
> Three faults, all now closed:
>
> | Fault | Was | Now |
> | --- | --- | --- |
> | Logo collision | wordmark at x=887, 93px from the plate edge | type anchored at **x=1000**, 206px clear |
> | Instrument sliced | orrery centre pushed off-canvas to cx=4273 with a 1246px outer shell, so the right edge cut the ellipses mid-arc | **contained**, cx=3200, outer ring ends at x≈3948 — nothing is cut at any edge |
> | Dead void | left ~20% was empty black the logo plate does not fill | the left band is now deliberately sized to the plate, and the type begins where the plate ends |
>
> **The type was NOT shrunk to achieve this**, per the 2026-08-06 ruling that killed the x-header `-safe` variant. The lever was the horizontal anchor. The layout is now `linkedinCover()` in `generate-banners.ts`, replacing a 191px `strip()` design that was being stretched 3.7x.
>
> **⛔ The `.jpg` was a stale artifact and the code comment lied about it.** `generate-banners.ts` carried a comment saying the JPEG "is emitted alongside". **No code in the kit ever wrote a `.jpg`** — the shipped file was made by hand on 2026-08-06 and then never moved again. So the PNG regenerated with the new composition and **the JPEG kept serving the old broken layout, while the row below points the uploader at the JPEG by name.** That is the house hazard exactly: corrected source, stale artifact, now on its fourth appearance after the OG card, the icon set and the FAQ schema. `jpeg: true` on the spec now writes it from the PNG that was just rendered, so the two cannot disagree again. **A comment asserting an output exists is not an output.**

| Platform | Avatar | Banner or cover |
| --- | --- | --- |
| X | `avatars/avatar-dark-1024.png` | `social/x-header-dark-1500x500@2x.png` (WIDE, deliberate; see rule 3) |
| LinkedIn | `avatars/avatar-dark-1024.png` | **`social/linkedin-cover-dark-4200x700.jpg`** — 4200x700, NOT 1128x191. Recomposed 2026-08-07, 150KB. |
| YouTube | `avatars/avatar-dark-1024.png` | `social/youtube-banner-dark-2560x1440.png` (1x IS the spec size) |
| GitHub org | `avatars/avatar-dark-1024.png` | no banner exists; see the org profile README note above |
| Instagram · Threads | `avatars/avatar-dark-1024.png` | none |
| TikTok | `avatars/avatar-dark-1024.png` | none |
| Bluesky | `avatars/avatar-dark-1024.png` | `social/bluesky-banner-dark-3000x1000.png` — **1x only**, 1MB cap |
| Mastodon | `avatars/avatar-dark-1024.png` | `social/mastodon-header-dark-1500x500@2x.png` |
| Discord | `avatars/avatar-dark-1024.png` | `social/discord-banner-dark-960x540@2x.png` |
| Product Hunt | `avatars/avatar-dark-1024.png` | `social/producthunt-gallery-dark-1270x760@2x.png` |
| Crunchbase | `avatars/avatar-dark-1024.png` | none |
| Any link preview (OG) | — | `social/og-dark-1200x630@2x.png` |

**The one place a byte cap still overrides this:** Bluesky's and GitHub's *banner* uploads cap at 1MB, which is upload rule 2 above and applies to banners, not avatars. `avatar-dark-1024.png` is 70KB and clears every cap on this page.

> **⛔ Never upload an icon from `docs/growth/branding/icons/` without checking its date.** That folder was generated on 2026-07-15, three weeks BEFORE the founder's 2026-08-05 ruling that removed the ember-to-blue gradient, so every file in it carried a violet spiral until 2026-08-07. It has been rebuilt from `avatars/`, but the lesson is the general one: **`avatars/` is derived from the live `mark.ts` by `generate-social.ts` and is therefore the master.** A blue or violet mark anywhere means you are holding a pre-ruling artifact. `src/styles/__tests__/there-is-no-second-brand-colour.test.ts` now fails the build if that colour re-enters the source.

**Use the dark avatar everywhere.** It carries its own rounded ground, so it reads identically against a light platform interface and a dark one. The light variant exists for surfaces we control, not for profile pictures.

### ⏸️ The GitHub repo social preview is PARKED, and it cannot be found for a reason

Do not go hunting for it on `RohitGajaraj/Supaprod`. **The section does not render.** GitHub's own documentation says you may upload an image "to a public repository, or to a private repository **to which you have previously uploaded an image**." That repo is private and has never had one, so the control is genuinely absent from the settings page rather than hidden.

It also has **no REST field**, verified against the repo API, so an agent cannot apply it either. UI-only, and the UI hides it.

**Unblocks when the repo becomes public.** Then: Repo → Settings → General → Social preview → Edit, using `social/github-social-preview-dark-1280x640.png` — **the 1x**, because GitHub caps this upload at 1MB and the @2x is 1.15MB and will be rejected.

**Priority is low**: a social preview only renders when someone shares a link to a *public* repo, so on a private one it has no audience anyway.

### There is no organisation banner at all

Verified live: an org exposes exactly one image, `avatar_url`. The wide brand image on `github.com/Supaprod` comes from the **org profile README** — the public `.github` repo with `profile/README.md` — created 2026-08-05. That is the only mechanism GitHub offers.

---

## 6. The walkthrough

Everything you need is here. Work top to bottom. Each platform ends with the **same close-out**, written once below so it is not repeated fifteen times.

> **A note on accuracy.** Signup flows change wording and reorder screens without notice. Field *names* below may differ slightly from what you see; the *values* and the *order of operations* are what matter. Where a step is genuinely irreversible or easy to get wrong, it is marked ⚠️.

### The close-out, done after every single account

1. **Password** into Proton Pass. Let it generate one; never reuse.
2. **Turn on 2FA**, authenticator app rather than SMS wherever offered. SMS is SIM-swappable.
3. **Save the TOTP seed** into the same Proton Pass entry, so the vault also generates the codes.
4. ⚠️ **Save the recovery / backup codes** into that entry's notes. These bypass 2FA entirely and are the single thing you cannot recover without.
5. **Fill in the track record row** in §8: URL, status, 2FA method, vault entry name, date.

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

⏸️ The repo social preview is a different thing from the org, and **it is parked** — see §5. On a private repo that has never had one, GitHub does not render the control at all, so there is nothing to click. When the repo goes public: **repo → Settings → General → Social preview → Edit**, using `social/github-social-preview-dark-1280x640.png` (the **1x**; GitHub caps this at 1MB and the @2x is 1.15MB). No API exists for it either.

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
   - Profile photo: `avatars/avatar-dark-800.png` (larger than X asks for, and it renders sharper)
   - Header: `social/x-header-dark-1500x500@2x.png` — the WIDE variant. The mobile crop is a known, accepted trade; see §5 rule 3 before changing it.
8. Close-out. 2FA lives at **Settings → Security and account access → Security → Two-factor authentication → Authentication app**.

Expect a phone-verification challenge at some point. That is normal for a new account and not a sign anything went wrong.

#### 3. YouTube `@supaprodhq` — ⚠️ the one that is hard to undo

⚠️ **This must be a Brand Account, not a personal channel.** A Brand Account can have multiple managers and can be transferred; a personal channel is welded to one Google login forever. Converting later is possible but messy. This is the single most common irreversible mistake on this list.

1. Sign in to the Google account that should own this. Consider creating a dedicated Google account on `social@supaprod.ai` rather than using a personal one.
2. Go to **youtube.com/channel_switcher**.
3. Click **Create a new channel**. This path creates a **Brand Account**. Going through "Create a channel" from the avatar menu on a fresh account creates a *personal* channel instead, which is the trap.
4. Brand account name: `Supaprod`.
5. Go to **youtube.com/customize**:
   - **Branding** tab: Picture `avatars/avatar-dark-800.png`, Banner `social/youtube-banner-dark-2560x1440.png`
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
11. **Edit page** and add: the About text from §3, cover image **`social/linkedin-cover-dark-4200x700.jpg`**, location `Remote`, founded year.

> **⚠️ LinkedIn covers are 4200x700, and this file said 1128x191 for a day.** That is the OLD company-page spec. LinkedIn now slots the cover into a 4200x700 frame, so a 1128-wide upload is upscaled 3.7x in each dimension: the crop dialog letterboxes it with black bars and the result looks soft. The founder caught the quality loss before the number was checked.
>
> **Upload the `.jpg`, not the `.png`.** LinkedIn's own guidance is "choose a high-resolution JPEG instead of a PNG", because their pipeline re-encodes the upload and handing it a JPEG avoids a second lossy pass. Cap is **3MB**; the JPEG is 107KB at quality 94 with 4:4:4 chroma, so there is no visible cost. The `-legacy-1128x191` files remain only for any surface still asking for the old size.
12. Close-out applies to your personal LinkedIn login, which is what actually controls the page.

---

### Pass 2 — high value

#### 6. Bluesky `supaprod` — the exact name, free

1. Go to **bsky.app** and choose **Create account**. Hosting provider: **Bluesky Social**.
2. Email `social@supaprod.ai`, password, birthdate.
3. Handle: `supaprod` — this becomes `supaprod.bsky.social`. ⚠️ Claim the **exact** name here, not the hq variant. This is the one platform where the exact name is available.
4. Profile: display name `Supaprod`, description from §3, avatar `avatars/avatar-dark-1024.png`, banner `social/bluesky-banner-dark-3000x1000.png` at **1x**, because Bluesky caps banners at 1MB and the @2x is 3.87MB.
5. Close-out.

**Worth doing soon after:** Bluesky lets you use a domain you own as your handle, so `@supaprod.ai` replaces `@supaprod.bsky.social`. It is free, self-verifying, and better branding. Settings → Handle → I have my own domain, then add the TXT record it gives you at `_atproto.supaprod.ai` in Cloudflare.

#### 7. Product Hunt

1. Sign up at **producthunt.com** with `social@supaprod.ai`.
2. Complete your maker profile first; a bare account cannot claim a product.
3. Create the product page with the Product Hunt tagline and description from §3, `avatars/avatar-dark-240.png` as the thumbnail, and `social/producthunt-gallery-dark-1270x760@2x.png` in the gallery.
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
3. Profile: display name `Supaprod`, bio from §3, avatar `avatars/avatar-dark-400.png`, header `social/mastodon-header-dark-1500x500@2x.png`.
4. In **Edit profile → Profile metadata**, add `Website` → `https://supaprod.ai`. Mastodon will show it as verified once the site links back with `rel="me"`.
5. Close-out.

#### 11. Discord

1. Register at **discord.com/register** with `social@supaprod.ai`.
2. Create the server: **+ → Create My Own → For a club or community**. Name `Supaprod`, icon `avatars/avatar-dark-512.png`.
3. **Server Settings → Overview**: description from §3.
4. ⚠️ `social/discord-banner-dark-960x540@2x.png` cannot be applied yet. A server banner needs **Boost Level 2**. The file is ready for when that is true; do not go hunting for the setting.
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

## 8. The track record — MOVED TO NOTION 2026-08-07

> **The live state of every account now lives in [`Supaprod · Brand & Social Accounts`](https://app.notion.com/p/3b33f54c86c281b1968fdcedb5e7785d), and this file no longer keeps a second copy.**
>
> **Why the direction reversed.** This section used to say "mirrored into Notion; this file is canonical." On 2026-08-07 that was true of the intent and false of the content: Notion knew LinkedIn was claimed while this file still said `Not started`, knew X's 2FA had been *declined* rather than being pending, and knew a GitHub defect was already fixed. Three facts, all wrong here, all right there.
>
> That is not bad luck, it is the shape of the work. **An account gets claimed on a phone, at speed, in the same minute as a decision.** The nearest writable surface at that moment is Notion; a markdown file behind a git commit is not reachable. So the mirror got the fresh fact and the "canonical" file rotted, which is the exact inversion of what canonical is supposed to buy you.
>
> One source per fact. **Status lives where status is written.** This file keeps what it is actually good at and what changes rarely: the claim order, the copy pack, the asset map, and the reasoning behind each. Those belong in git, where they can be reviewed and diffed.
>
> **No secret ever appears in either place.** Passwords, TOTP seeds and recovery codes live only in a password manager. See §0.2, and note that the vault itself is still an open debt.
>
> **And check the account before trusting either.** Both are claims about the world. A `curl` against a public profile settles most rows in seconds and is cheaper than acting on a wrong one.

The table below is kept **only as the historical record of what this file asserted before the move**. Do not update it. Do not read it for current state.

| Platform | Handle | URL | Status | Owner email | 2FA | Vault entry | Claimed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GitHub org | `Supaprod` | https://github.com/Supaprod | **Verified** — avatar, description, URL, email and banner all live | `social@supaprod.ai` (org contact); login is the founder's personal GitHub account | ✅ authenticator on the personal account; org enforces 2FA for all members | ⚠️ recovery codes generated 2026-08-07, not yet in a vault, see §0.2 | 2026-08-05 |
| X | `@supaprodhq` | https://x.com/supaprodhq | **Profile complete** — banner, avatar, bio and link all live | `social@supaprod.ai` | ⚠️ **declined by the founder**, not merely pending | ⚠️ none yet, see §0.2 | 2026-08-05 |
| YouTube | `@supaprodhq` | | Not started | `social@supaprod.ai` | | | |
| Instagram | `@supaprodhq` | | Not started | `social@supaprod.ai` | | | |
| LinkedIn | `company/supaprod` | https://www.linkedin.com/company/supaprod | **Claimed** — page live, vanity slug held. Name, website, industry, size, type, logo and tagline set. Missing: cover image, About text, location, founded year, and the founder as an employee | `social@supaprod.ai`; admin is the founder's personal LinkedIn | n/a, governed by the personal login | ⚠️ none yet, see §0.2 | 2026-08-05 |
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

Status values: `Not started` → `Claimed` (handle held, profile empty) → `Profile complete` (bio, avatar, banner, link) → `Verified` (2FA on, recovery codes in the vault, track record row filled).

**Update this table in the same sitting as the account.** A track record that is occasionally right is worse than one that admits it does not know.

---

## 8a. Reconciliation 2026-08-07 — this file was the stale one

> **The header of §8 says "Mirrored into Notion; this file is canonical." On 2026-08-07 that was true of the intent and false of the content.** The Notion page `Supaprod · Brand & Social Accounts` held three facts this file did not, all confirmed live before being copied back:
>
> | What | This file said | What was actually true |
> | --- | --- | --- |
> | LinkedIn | `Not started` | **Claimed.** `linkedin.com/company/supaprod` returns 200 with title `Supaprod \| LinkedIn`, and the numeric `company/139433985` 302s to it, so the vanity slug is held. Half the profile is filled in. |
> | X 2FA | `pending` | **Declined by the founder.** Not the same thing. "Pending" reads as a chore nobody got to; "declined" is a standing decision that will not resolve itself. |
> | GitHub org description | "Fix now", still `agent-first` | **Already fixed.** The live API returns the corrected `agentic-first` line. |
>
> **Why it drifted, and the rule that follows.** Accounts get claimed on a phone, at speed, in the same sitting as a founder decision. The nearest writable surface at that moment is Notion, not a markdown file behind a git commit. So the mirror gets the fresh fact and the canonical file goes stale, which is the exact inversion of what "canonical" is supposed to guarantee.
>
> Declaring a file canonical does not make it current. **Before trusting any row in §8, check the account itself.** A `curl` against the public profile settles most rows in seconds and is cheaper than acting on a wrong one. Track record rows are claims about the world, and the world is the authority.

## 8b. Live-account defects found on inspection, 2026-08-05

Checked against the live GitHub API this session, not against this document.

> **Status 2026-08-07: the description defect below is CLOSED.** `api.github.com/orgs/supaprod` now returns "For product managers who ship with agents. Tells you what to build, builds and ships it, then learns what actually worked." The `location` field is still empty, which remains minor.

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
