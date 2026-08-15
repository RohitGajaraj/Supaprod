# CF Accelerator Batch #9 — how to apply

> _Created: 2026-08-16 · Last updated: 2026-08-16_
>
> The mechanics, the gate, and the handoff. The answers are in [`APPLICATION-FINAL.md`](./APPLICATION-FINAL.md)._

## The form

| | |
| --- | --- |
| **Apply URL** | https://campusfounders.acceleratorapp.co/apply/program/cf-accelerator-batch-9 |
| **Platform** | AcceleratorApp (`acceleratorapp.co`), not F6S. The F6S traps in the craft log do not apply here |
| **Deadline the form itself states** | **"Please apply before Aug 17, 2026"** |
| **Deadline the programme page states** | "Deadline: 16.08.2026" |
| **Contact** | lisa@campusfounders.de |

> ### ⚠️ The two published deadlines disagree, and the form is the one that governs
>
> Screening ruling 1 says **a deadline is a rumour until the form contradicts it**. Here the form contradicts the marketing page in **our favour** by one day. Do not spend the extra day: file on the 16th and treat the 17th as slack, because a form that says "before Aug 17" may close at 00:00 on the 17th in CET.

## The account gate

**Nothing on the form is visible until an account exists.** The first screen asks only for: Startup, First Name, Last Name, Email, Create a password, a terms checkbox, and Next. There is also a **"Sign Up with Google to fill the form"** button.

**The founder signed up with Google on 2026-08-16.** That has one consequence worth recording:

> **A Google-OAuth signup leaves no password, so no other browser session can sign into that account.** Claude Code drives its own isolated Chrome profile and cannot attach to a normally-launched Chrome, so **whoever holds the browser session is the only one who can fill this form.** If a future application needs to be filled by an agent from Claude Code, **sign up with email and password**, not with Google.

### The three ways past this, in order of preference

1. **Claude-in-Chrome fills it from the handoff brief below.** It already has the signed-in session and can read the live form. This is the working path and it is what we used.
2. **Sign up with email and password instead of Google**, and share the password. Then Claude Code signs into the same account from its own browser and fills the form directly.
3. **Relaunch Chrome with a debug port** so Claude Code can attach. Quit Chrome fully first, then:
   ```bash
   osascript -e 'quit app "Google Chrome"' && sleep 3 && \
     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --remote-debugging-port=9223 --restore-last-session >/dev/null 2>&1 &
   ```
   This still needs an MCP that accepts an arbitrary `--browser-url`, so treat it as a last resort rather than a routine.

---

## The handoff brief for Claude-in-Chrome

**Paste this into the Claude sidebar in the tab that has the form open.**

```
You are filling an accelerator application for Campus Founders, CF Accelerator
Batch #9, on behalf of Rohit Gajaraj, solo founder of Supaprod.

FIRST, before filling anything: read every question, every field label, every
character limit and every dropdown option off the page and list them back to me
verbatim. Do not fill anything until I have seen that list.

THEN fill the form using ONLY the answers in the document I give you next. Rules
that are not negotiable:

1. Do not invent, embellish or extrapolate any fact, number, user count, revenue
   figure or customer. If an answer for a field is not in the document, stop and
   ask me rather than composing one.
2. Do not use em dashes or en dashes anywhere. Plain commas and full stops.
3. Scroll every dropdown to the bottom before choosing. A visible option is not
   the best option.
4. Leave optional fields blank if the document has no answer for them. A blank
   says less than a number we cannot support.
5. If a field is shorter than the answer, cut from the END and keep the first
   sentence intact. The first sentence carries the whole answer.
6. After filling, reload the page and read each field back to me by name to
   confirm it saved.
7. DO NOT SUBMIT. Stop before the submit button and tell me the form is ready.
```

Then paste [`APPLICATION-FINAL.md`](./APPLICATION-FINAL.md).

---

## After it is filed

- [ ] Record the filed text of every answer back into [`APPLICATION-FINAL.md`](./APPLICATION-FINAL.md), replacing the draft blocks. The filed text is the record, not the draft.
- [ ] Log the submission in [`../README.md`](../README.md) and [`../what-to-apply-for-next.md`](../what-to-apply-for-next.md).
- [ ] Mark `lantern@supaprod.ai` as **allocated to Campus Founders** in the demo-login table in [`../answer-bank.md`](../answer-bank.md).
- [ ] Update [`../../founder-answer-playbook.md`](../../founder-answer-playbook.md) in the same session, per the standing rule.
- [ ] **Diary the dates.** Pitch invitations 24 to 26 August. Acceptances 28 August. If a pitch invitation lands, the demo queue must be re-armed before it.
