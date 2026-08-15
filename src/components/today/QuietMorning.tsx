import { Num } from "@/components/meridian/surface-parts";

/**
 * THE EMPTY MORNING, WHICH IS THE MAJORITY MORNING.
 *
 * Checked against production: real accounts hold almost nothing. A morning with
 * no decision waiting is not this product failing, it is this product working —
 * the boundaries held, the crew got on with it, and nothing needed a human. So
 * it gets a considered screen rather than the leftover one.
 *
 * A WORKED EXAMPLE, BECAUSE THAT IS HOW OPERATORS REASON. "Example" is the
 * single highest-frequency term in 5.72M words of real product-operator
 * conversation — 711.9 per million, ahead of every framework word in the
 * corpus. People do not learn a taxonomy from a paragraph describing it; they
 * learn it from one instance of it. The four zero lanes above this teach the
 * names; this teaches the shape.
 *
 * AND IT IS NOT A MOCK, WHICH IS A DIFFERENT THING AND IS BANNED. A mock
 * pretends to be your data and is discovered to be false. This declares itself
 * in the first two lines, is drawn on a dashed edge no real object on this
 * surface wears, and carries NO working control: the three letters are printed
 * as keycaps in a sentence, not as buttons, because a button that does nothing
 * is a promise this system does not break. Nothing here can be mistaken for the
 * workspace's own record, and nothing here can be pressed.
 */
export function QuietMorning() {
  return (
    <section className="today-example" aria-labelledby="today-example-title">
      <div className="today-example-head">
        <span className="today-example-tag">Example</span>
        <span className="today-example-note">Nothing below is from your workspace.</span>
      </div>
      <h2 id="today-example-title" className="today-example-title">
        This is what one decision looks like when it arrives.
      </h2>

      <div className="today-example-call">
        <p className="today-example-q">Merge the checkout copy change into main?</p>
        <div className="today-example-why">
          <p className="today-example-label">Why this needs your call</p>
          <p>
            Conversion fell <Num>4%</Num> on the current copy over two weeks.
          </p>
          <p>Irreversible · already merged. Undoing it means a revert pull request.</p>
          <p>Approve · merges the pull request</p>
        </div>
      </div>

      <p className="today-example-keys">
        <kbd>a</kbd> approves it, <kbd>d</kbd> declines it, <kbd>z</kbd> puts it in tomorrow&rsquo;s
        brief. You will not have to hunt for it: it opens here, first thing.
      </p>
    </section>
  );
}
