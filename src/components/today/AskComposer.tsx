import * as React from "react";
import { Input } from "@/components/meridian/forms";
import { openAsk } from "@/lib/ask-open";

/**
 * THE FRONT DOOR'S COMPOSER, AND IT WAS A BUTTON WEARING A TEXT FIELD.
 *
 * WHAT IT WAS. `_authenticated.today.tsx` rendered a card holding a label
 * ("What should we build?"), a `<Button variant="primary">` styled to look like
 * an input -- left-aligned placeholder text, a monospace kbd on the right -- and
 * a two-line paragraph explaining what to type into it. Clicking anywhere on the
 * field opened the Ask pane, empty.
 *
 * WHY THAT IS A DEFECT AND NOT A SHORTCUT. This repo's own rule, stated at
 * AppFrame.tsx:505, is that "a control's label is a promise about the click".
 * Here the promise was made by the control's SHAPE, which is the louder signal:
 * a bordered box with a placeholder and a cursor affordance says "type here",
 * and typing was the one thing it could not do. A person aiming at the field
 * either clicked and was moved somewhere else to start over, or pressed a key
 * and watched it go nowhere. On the surface whose whole argument is that
 * prompting is the primary interaction, the primary interaction was a decoy.
 *
 * It also read as the loudest object on the page, because `variant="primary"`
 * was a raw ink inversion and rendered a white slab on the dark canvas. That
 * half is fixed one level down, in `.sp-btn[data-variant="primary"]`; a real
 * field makes the question moot here, since a field is not a button at all.
 *
 * WHAT IT IS NOW. A real `<form>` around the system's own `Input`. You type in
 * the thing that looks like you can type in it, and Enter opens Ask with what
 * you wrote as the conversation's first turn -- `openAsk(intent)` has always
 * accepted that argument (ask-open.ts:53) and no caller on this surface used it.
 * So the field is not merely honest now, it does strictly more than the button
 * did: the old one could only ever open an empty pane.
 *
 * THE EXPLANATORY PARAGRAPH IS GONE AND THAT IS THE RATCHET, NOT A BREACH OF IT.
 * "Describe a feature, ask a question, or submit an idea. AI agents will analyze
 * it, suggest next steps, and build what you approve" existed to explain a
 * control that could not be understood by looking at it. A field with a
 * placeholder is understood by looking at it. The ratchet protects states,
 * messages and affordances; the affordance is stronger and the message it
 * replaces was a workaround for the affordance being wrong.
 *
 * WHY IT IS SMALL. It sits under the spine on the product's front door, and
 * everything below it is what the brain has to say. `today.tsx`'s own comment
 * twenty lines on reads "THE BRAIN LEADS ... A director that speaks only after
 * you have cleared your inbox is not directing." A composer that occupied ~180px
 * ABOVE that made the first thing on the front door an empty box asking the user
 * to think, on a product whose claim is that it thinks first.
 *
 * `data-page-composer` stays on the WRAPPER in today.tsx rather than moving in
 * here. The global dock yields to it via `body:has([data-page-composer])` in
 * shell.css, and one-prompt-per-screen.test.ts asserts the marker is in the
 * route file. The surface owns the claim "I have a composer"; this component
 * only owns what the composer does.
 */
export function AskComposer() {
  const [intent, setIntent] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = intent.trim();
    // An empty submit still opens the pane. That is the old button's behaviour
    // and someone who presses Enter on an empty field means "open the thing",
    // not "do nothing". `openAsk` already treats a blank intent as no intent.
    openAsk(trimmed || undefined);
    setIntent("");
  }

  return (
    <form className="today-ask-form" onSubmit={submit}>
      <Input
        value={intent}
        onChange={(e) => setIntent(e.currentTarget.value)}
        placeholder="Tell Supaprod what to build..."
        // The accessible name is the invitation, matching AskDock's own choice:
        // a screen reader hears what the field is FOR, not what widget it is.
        aria-label="Tell Supaprod what to build"
      />
      <kbd
        // Decoration for the mouse, noise for a screen reader: the shortcut is
        // bound globally in AskProvider and announcing it on a field that is
        // already focused would describe a way to reach where you already are.
        aria-hidden="true"
        className="today-ask-shortcut"
      >
        ⌘K
      </kbd>
    </form>
  );
}
