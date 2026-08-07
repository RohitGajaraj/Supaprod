/**
 * A1, the waitlist welcome (server-only).
 *
 * WHAT WAS BROKEN. `joinWaitlist` captured the row correctly and then sent
 * nothing at all. Somebody joined the waitlist and heard silence, which reads
 * as a broken form even when the row is safely stored, and on launch day that
 * is the first impression a Product Hunt visitor gets. This is tracker row A3
 * and it is the only email in docs/growth/email-sequences.md whose trigger
 * already existed in the code path.
 *
 * THE VOICE, founder ruling 2026-08-07 and then corrected the same evening. The
 * first instruction was "live, fresh", the reader should feel "something new is
 * coming up", with room for humour, and short. Explicitly NOT the formal
 * register a person gets forty of a day and reads none of. The line that had to
 * go was "Here is the short version of what you signed up for", which is not a
 * sentence one person writes to another.
 *
 * THE CORRECTION MATTERS MORE THAN THE ORIGINAL, because the first pass
 * overshot. Humour is now "as minimal as positive", used only where it earns
 * its place, and the audience is named: mostly B2B ENTERPRISE, so "little
 * having formal side would help, but I don't want it complete formal". A draft
 * of this email ended a line with "Not supper" and that is precisely the joke
 * that was cut: funny once, and worth nothing to a product leader deciding
 * whether to spend attention on us.
 *
 * WHAT CARRIES THE ENERGY INSTEAD is an industry observation the reader already
 * feels, which the founder asked for by name: engineering got real agents this
 * year and product management got a summarize button. That is substance, it is
 * current, it is defensible, and it does the job the joke was failing to do.
 * The only remaining aside is "politely", which stays because it is working:
 * it tells the reader the critique is constructive before they click.
 *
 * NO PRONUNCIATION GLOSS, and it is deliberate. "Supaprod, said with an A:
 * SOO-pa-prod" sat here as the SECOND sentence, before the reader had been told
 * what we do, and the founder called it out across every message on 2026-08-07.
 * He is right, and the reason is stronger than "unnecessary": the spelling
 * already carries it. "Superprod" would genuinely need the gloss; "Supa" can be
 * read only one way, so the A IS the pronunciation guide and the sentence
 * explains a problem the name already solved. It also fails the same test that
 * cut the jokes, which is whether a line helps the reader decide anything.
 *
 * It survives in exactly two places and both are REFERENCE fields rather than
 * lines anyone reads in sequence: press-kit.md, where a journalist may have to
 * say it on air, and trademark-brief-supaprod.md, where phonetic similarity is
 * the legal test for confusion and the field is not optional. Do not reintroduce
 * it to anything a person reads front to back.
 *
 * THE BOUNDARY THAT DID NOT MOVE. Tone got loose. Claims did not. A joke is
 * free; an invented number, a promised date we have not set, or a capability we
 * cannot demonstrate is not, and the claims law applies to this file exactly as
 * it applies to the landing page. Note in particular that the description of
 * what the product does still refuses the words "remembers", "stores" and
 * "logs", per the standing doctrine that those claim LESS than the product
 * delivers. "Learns from it and tells you what to do next time" is the sanctioned
 * phrasing and it is what this email says.
 *
 * KEEP THIS IN SYNC WITH docs/growth/email-sequences.md section 3, A1. That file
 * is the source and is downstream of brand-ops/social-accounts.md section 3,
 * which is the claims source for the whole company. Changing a claim here
 * without changing it there forks the message.
 *
 * THE DATE STAYS HIDDEN, and that is now a deliberate position rather than a
 * gap. The founder holds mid-September internally and wants the public date
 * withheld to keep the suspense (2026-08-07). LAUNCH_DATE is therefore expected
 * to be UNSET in production, and the no-date branch is the one that ships. A
 * test fails the build if any month name leaks into this email while it is
 * unset, so the date cannot escape through a later edit.
 *
 * WHAT THE EMAIL PROMISES CHANGED WITH THE ACCESS MODEL. Signup was open and
 * auto-confirming when this file was written, which made a waitlist theatre and
 * left A1 with nothing concrete to offer. The founder closed the door on
 * 2026-08-07: private beta, entry by invite code. So the promise is now a real
 * object, an invite code, arriving in one email. That is a better sentence than
 * the one it replaced precisely because it is a thing rather than a date.
 *
 * WHAT THIS EMAIL STILL CANNOT DO, both founder-blocked:
 *   - NO POSTAL ADDRESS in the footer. CAN-SPAM requires one on commercial
 *     mail and no entity is incorporated yet. A confirmation someone asked for
 *     is the most defensible send in the whole programme, but the four nurture
 *     emails behind it are not, and none of those may send until this exists.
 *   - UNSUBSCRIBE IS mailto-ONLY. RFC 8058 one-click wants an HTTPS endpoint
 *     and there is no unsubscribe route in the app. A mailto List-Unsubscribe
 *     is valid and honoured, and it is what we can truthfully offer today, but
 *     it is the weaker form and the bulk sends need the real one.
 *
 * Deliverability notes that drove the shape (section 7 of the same file):
 *   - ONE link. A second halves the first and gives a domain with no sending
 *     history a signal it cannot afford.
 *   - The text part is HAND-WRITTEN, not the HTML with tags stripped. Stripped
 *     HTML leaves orphaned link text and collapsed spacing, which filters read
 *     as machine output.
 *   - The email reads completely with images off, because it contains none.
 */
import { sendEmail, absoluteUrl } from "@/lib/email.server";

/** Lifecycle mail signs as a person. `rohit@supaprod.ai` is not an explicit
 *  Cloudflare route, but the domain's catch-all is active, so replies land in
 *  the founder inbox rather than bouncing. The copy asks for a reply, so this
 *  mattered enough to check. */
const FROM = "Rohit at Supaprod <rohit@supaprod.ai>";
const REPLY_TO = "founder@supaprod.ai";
const UNSUB = "hello@supaprod.ai";

/** The ratified subject. Two alternates exist in the sequence file if this one
 *  underperforms; they are alternates, not a rotation, so pick deliberately. */
export const A1_SUBJECT = "You are on the list";

/**
 * The launch-date sentence, in its two legitimate forms.
 *
 * LAUNCH_DATE is a free-text string, not a parsed date, on purpose: it renders
 * verbatim into a sentence, so the founder controls the exact wording ("16
 * September", "mid-September", "Tuesday") without a formatter guessing a locale
 * or a timezone shifting it by a day.
 */
function launchSentence(): string {
  const when = process.env.LAUNCH_DATE?.trim();
  return when
    ? `We open ${when}. You get an invite code that morning. One email, no countdown.`
    : `The moment a slot opens, you get an invite code. One email, no countdown.`;
}

/** Greeting that survives an empty name. We only ever collect an email address
 *  at the waitlist, so in practice this is always the bare form; the parameter
 *  exists because the sequence file's token table specifies it and later
 *  sequences do have a name to use. */
function greeting(firstName?: string): string {
  const n = firstName?.trim();
  return n ? `Hey ${n},` : "Hey,";
}

export function a1Text(firstName?: string): string {
  const teardown = absoluteUrl("/p/teardown");
  return [
    greeting(firstName),
    ``,
    `Engineering got real agents this year. Product management got a summarize button.`,
    ``,
    `That gap is what you just joined the list for. Supaprod is a product team of agents: they work out what to build, build it, ship it, then check whether it actually worked. The next call arrives already knowing what went wrong last time, so you do not pay for the same mistake twice.`,
    ``,
    launchSentence(),
    ``,
    `Meanwhile, give the Critic a bet you actually believe in. It red-teams it in about twenty seconds and shows its evidence. No account.`,
    ``,
    teardown,
    ``,
    `If it comes back useless, tell me. That is the more useful reply.`,
    ``,
    `Rohit`,
    ``,
    `--`,
    `You are receiving this because you joined the Supaprod waitlist at supaprod.ai.`,
    `To come off the list, reply with "unsubscribe" or write to ${UNSUB}.`,
  ].join("\n");
}

export function a1Html(firstName?: string): string {
  const teardown = absoluteUrl("/p/teardown");
  // Deliberately plain HTML: a table-based, image-heavy template from a domain
  // with no sending history is a worse bet than something that looks like a
  // person wrote it. System font stack, one link, no images, no tracking pixel.
  const p = (s: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f1b16;">${s}</p>`;
  return [
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">`,
    p(greeting(firstName)),
    p(`Engineering got real agents this year. Product management got a summarize button.`),
    p(
      `That gap is what you just joined the list for. Supaprod is a product team of agents: they work out what to build, build it, ship it, then check whether it actually worked. The next call arrives already knowing what went wrong last time, so you do not pay for the same mistake twice.`,
    ),
    p(launchSentence()),
    p(
      `Meanwhile, give the Critic a bet you actually believe in. It red-teams it in about twenty seconds and shows its evidence. No account.`,
    ),
    p(`<a href="${teardown}" style="color:#C24E1E;font-weight:600;">Red-team one of your bets</a>`),
    p(`If it comes back useless, tell me. That is the more useful reply.`),
    p(`Rohit`),
    `<hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0 12px;">`,
    `<p style="margin:0;font-size:12px;line-height:1.5;color:#6b6457;">You are receiving this because you joined the Supaprod waitlist at supaprod.ai. To come off the list, reply with "unsubscribe" or write to <a href="mailto:${UNSUB}" style="color:#6b6457;">${UNSUB}</a>.</p>`,
    `</div>`,
  ].join("");
}

/**
 * Send A1. NEVER throws and never blocks the signup.
 *
 * A failed email must not cost us the row. The person is on the list either
 * way, and losing a genuine signup because a vendor 500'd is the one
 * unrecoverable outcome in this whole path: they do not come back and we never
 * learn we lost them. Same asymmetry the rate brake in landing.functions.ts is
 * set against.
 */
export async function sendWaitlistWelcome(to: string, firstName?: string): Promise<void> {
  try {
    const result = await sendEmail({
      to,
      subject: A1_SUBJECT,
      text: a1Text(firstName),
      html: a1Html(firstName),
      from: FROM,
      replyTo: REPLY_TO,
      headers: {
        // mailto form, not HTTPS one-click. See the header comment: there is no
        // unsubscribe route to point at yet. Valid and honoured; still the
        // weaker form, and the bulk nurture sends need the real one first.
        "List-Unsubscribe": `<mailto:${UNSUB}?subject=unsubscribe>`,
      },
    });
    // SAY SO WHEN IT DOES NOT SEND. This result was being discarded, which made
    // a failed welcome completely invisible: the row was written, the caller saw
    // success, and the only symptom was an email that never arrived with no
    // record anywhere of why. That is precisely the state the founder hit on
    // 2026-08-07 while testing, and the answer turned out to be a deploy that
    // predated this code, which a single line of output would have shown at
    // once. sendEmail already returns a reason for every failure mode it has,
    // including the honest no-op when RESEND_API_KEY is absent, so there is
    // nothing to construct here beyond printing it.
    //
    // Still not thrown, and still not surfaced to the visitor. A logged failure
    // is for us; the person is on the list either way and does not need to see
    // our vendor's status.
    if (!result.sent) {
      console.warn(`[waitlist] welcome email not sent: ${result.reason}`);
    }
  } catch (e) {
    // Unreachable in practice, sendEmail already swallows. Belt and braces:
    // this is called from inside a signup handler and must not surface.
    console.warn(
      `[waitlist] welcome email threw: ${e instanceof Error ? e.message : "unknown error"}`,
    );
  }
}
