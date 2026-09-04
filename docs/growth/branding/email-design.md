# Email design: what is decided, what is measured, what is blocked

> _Created: 2026-08-07 · Last updated: 2026-08-07_

> _Created 2026-08-07, the evening the first real email was sent and read on a phone._

**Read this before changing any email's appearance.** Three of the constraints below are measurements rather than opinions, and two of them have already been violated once each in this codebase.

The rendered comparison of both treatments is generated, not hand-made: `bun docs/growth/branding/generate-email-marks.ts` for the assets, and the preview is written to `email/_preview.html` by the script recorded in [`../../operations/session-handoff.md`](../../operations/session-handoff.md).

---

## 1. DECIDED: an ember band, not an ember email

The founder asked for the treatment on Cloudflare's conference page: saturated ember ground, white type, and it does look premium. **The band ships. The full ground does not, and he asked to be pushed back on rather than agreed with.**

### Why the band

| | |
| --- | --- |
| **Solid `bgcolor` is one of the best supported things in email** | Including Outlook, which renders through Word. A background *image* needs VML there and is blocked by default nearly everywhere else. |
| **A saturated hue survives dark-mode inversion** | Gmail on Android force-inverts, but inversion targets near-white and near-black. A mid-saturation brand colour is usually left alone. **This is why ember is a better idea than the dark ink ground proposed first**: dark is the treatment that gets flattened. |
| **Identity lands in the first moment, then gets out of the way** | Which is what the reference actually does. Cloudflare uses ember for the hero and light for the content beneath it. |

### Why NOT the whole email

1. **It costs the Primary tab.** Gmail's Promotions classifier weighs colour saturation and styling weight. Promotions is precisely where a waitlist welcome must not land, and the first real send was confirmed in Primary. That is a result worth protecting over an aesthetic preference.
2. **Nobody serious does it, and that is evidence.** Stripe, Linear, Vercel, Notion, Figma and Resend itself all use light bodies with at most a thin accent. Transactional email is read, not browsed.
3. **Over a hundred words reversed out of saturation is fatiguing on a phone.** White on colour works for an eight-word hero. It does not work for body copy.
4. **The contrast ramp collapses.** On light there is body, secondary, link, footer. On ember there is white and slightly-transparent white, and every element fights every other one.
5. **Restraint reads as more premium, not less.** A fully coloured email reads as a promotion. A precise band with good typography reads as a company that knows what it is doing.

---

## 2. MEASURED: white on the bright ember fails AA

**White on `#FF6B2C` is 2.83:1.** That fails WCAG AA for body text (4.5:1) and fails even the 3:1 large-text floor.

This is not hypothetical. Three landing CTAs shipped with exactly this defect until 2026-08-07, when `--cta-ink` (`#0a0a0b`, 6.97:1 on ember) was applied to all of them.

**The band therefore uses `#C24E1E`**, which is already in the palette as the mark's core lowlight, so it is not a new colour. **White on it measures 4.77:1 and passes AA for body text.**

| Combination | Ratio | Verdict |
| --- | --- | --- |
| White on `#FF6B2C` | 2.83:1 | **Never.** Fails AA and the large-text floor. |
| White on `#C24E1E` | 4.77:1 | Passes AA. **This is the band.** |
| `#0a0a0b` on `#FF6B2C` | 6.97:1 | Passes. **This is the button:** bright ember fill, ink label. |

**Rule: the bright ember is a fill with ink on top. It is never a ground for white prose.**

---

## 3. DECIDED: the mark answers to its ground

Founder note, 2026-08-07: the logo has to suit the background behind it, and may not need its own fill.

Every other mark in `public/` **carries its own ground**: `apple-touch-icon.png` and `icon-192.png` are a dark rounded tile, `favicon.svg` is a dark disc. That is correct for an app icon, whose background is unknown. It is **wrong** for a band whose colour we chose, because it puts a near-black square on orange.

Two generated assets, from [`generate-email-marks.ts`](./generate-email-marks.ts):

| Asset | Use |
| --- | --- |
| `mark-white.png` | White mark, transparent. The ember band, and any dark ground. |
| `mark-graphite.png` | Dark mark, transparent. White or near-white grounds, where a white mark vanishes. |

Rendered at 102px for a 34px display, because a phone is a 3x screen.

**The band survives the image failing**, and that is deliberate insurance rather than luck: the identity is carried by the ember and the type, so a blocked or missing image leaves white alt text on ember, which is legible.

---

## 4. BLOCKED, and it costs money: the grey sender avatar

The circle beside the sender name in Gmail is **BIMI**. No email HTML reaches it. Three prerequisites, all of which we currently fail:

| Requirement | Where we are |
| --- | --- |
| **DMARC at `p=quarantine` or `p=reject`** | We publish `p=none` ([`../../operations/domain-and-email-setup.md`](../../operations/domain-and-email-setup.md)). Tightening it is free but must follow a period of monitoring reports, or legitimate mail starts bouncing. |
| **A Verified Mark Certificate (VMC)** | None. Issued by a certificate authority, and **roughly $1,000 to $1,500 per year.** |
| **A registered trademark**, which the VMC is issued against | None. Filing strategy is in [`../brand-ops/trademark-brief-supaprod.md`](../brand-ops/trademark-brief-supaprod.md). No entity is incorporated yet. |

**Sequence, because these are strictly ordered:** incorporate, file the trademark, wait for registration, tighten DMARC to enforcement, buy the VMC, publish the BIMI record. Registration alone is typically many months.

**Until then the avatar stays grey and that is not a bug.** Do not accept a task to "fix the email logo showing as a placeholder" without reading this section first.

A cheaper partial: a **Google Workspace profile photo** on the sending address fills the avatar for Gmail recipients only. `notifications@supaprod.ai` routes through Cloudflare and is not a Workspace mailbox, so this would mean paying for one seat. Worth considering; it is not BIMI and does nothing outside Gmail.

---

## 5. The rules that are not negotiable

- **Nothing a reader NEEDS may live in an image.** A large share of recipients read with remote images blocked and Gmail proxies the rest. The test in `src/lib/waitlist-email.test.ts` enforces this: every `<img>` must carry real alt text and the CTA must be a text link, not a wrapped image. It used to assert "no images at all", which was stricter than the rule and broke the moment a header landed.
- **Set `width` AND `height` on every image**, so an unloaded one reserves its box instead of collapsing and shoving text upward when it arrives.
- **A `<table>` for the band, a `<div>` for everything else.** Outlook honours `bgcolor` on a `td` and ignores `background` on a `div`. The mark and headline share ONE cell: two stacked tables hairline-crack into a visible seam in Outlook.
- **Inline styles only.** No `<style>` block, no flexbox, no grid. Mail clients strip heads.
- **`git add -f` every asset, then `curl` it after deploy.** `.gitignore` carries a blanket `*.png`. That is how `icon-192.png` and `icon-512.png` came to return **404 in production** while sitting happily on one laptop, how `site.webmanifest` pointed at two dead files, and how the first branded email shipped a broken image into an inbox where it cannot be corrected. **A file on disk is not a file on the origin. Verify with `curl`, never with `ls public/`.**
- **One link per email.** [`../email-sequences.md`](../email-sequences.md) §7 explains why: a second halves the first and gives a domain with no sending history a signal it cannot afford.

---

## 6. Still open

- **Founder pick between A and B** is made: A, the band. If he later wants the full ground anyway, that is his call to make against §1 rather than a thing to slide in.
- **A dark variant** was proposed and set aside. If it is ever revived it must be built to survive being flattened and tested across Gmail, Outlook and Apple Mail in both light and dark. That is real work, not a colour change.
- **No email has been tested outside Gmail.** §7 of the sequences file asks for a seed inbox on Gmail, Outlook and Apple Mail, read in dark mode. Not done.

---

## Related

- [`../email-sequences.md`](../email-sequences.md), all eleven emails, the deliverability section and the two blockers on the nine that cannot send.
- [`./README.md`](./README.md), the brand kit and every other generated asset.
- [`../brand-ops/trademark-brief-supaprod.md`](../brand-ops/trademark-brief-supaprod.md), the filing that unlocks BIMI.
- [`../../operations/domain-and-email-setup.md`](../../operations/domain-and-email-setup.md), the live addresses, SPF, DKIM and the DMARC policy this depends on.
- [`../../planning/LAUNCH-EXECUTION-TRACKER.md`](../../planning/LAUNCH-EXECUTION-TRACKER.md), the single board.
- `src/lib/email.server.ts`, where `emailShell`, `emailButton` and `EMBER_DEEP` live, each carrying the short form of the reasoning above.
