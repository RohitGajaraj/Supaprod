import type { ThreadSummary } from "@/lib/threads.functions";

/**
 * ONE MOCK OF `threads.functions`, SHARED, BECAUSE BUN'S MODULE MOCKS ARE
 * GLOBAL AND THE FIRST FILE TO LOAD A COMPONENT WINS FOREVER.
 *
 * THE DEFECT THIS ENDS, and it is the third time this exact trap has been paid
 * for in one night. `mock.module` is not scoped to the file that calls it: it
 * swaps the entry in a process-wide registry. Worse, the swap is only observed
 * at the moment a consumer is first imported. So when
 * `components/__tests__/escape-layers.test.tsx` mounted `AskPane` to test
 * Escape ordering, `AskPane.tsx` was resolved and cached bound to THAT file's
 * `listThreads: async () => ({ threads: [] })`. `AskPane.test.tsx` ran later,
 * registered its own richer mock, and the component never saw it -- the module
 * was already built. Two tests failed, both of them about the conversation
 * switcher listing threads that the switcher was now structurally unable to
 * receive.
 *
 * The failures were ORDER DEPENDENT, which is what made them expensive: running
 * `bun test src/components/ask` passed, running the full suite failed, and the
 * file that broke it does not import the file that failed. A test that only
 * fails in company is a test nobody can debug from its own output.
 *
 * THE FIX IS A LIVE STORE RATHER THAN A LITERAL. Both files register a factory
 * that closes over this object and reads it AT CALL TIME. Whichever file loads
 * the component first no longer decides what the component sees, because what
 * it sees is a getter into state either file can set. Ordering stops mattering,
 * which is the only durable answer while `mock.module` is global.
 *
 * Anything else mocking `threads.functions` must come through here. A second
 * literal anywhere reintroduces the bug in the same shape.
 */
export const threadsMock: {
  rows: ThreadSummary[];
  throws: boolean;
} = {
  rows: [],
  throws: false,
};

/** Back to a workspace with no conversations and a read that works. Call in
 *  `beforeEach`: state that survives a test is state the next test inherits. */
export function resetThreadsMock(): void {
  threadsMock.rows = [];
  threadsMock.throws = false;
}

/** The module shape `mock.module("@/lib/threads.functions", …)` installs. */
export function threadsModuleMock() {
  return {
    listThreads: async () => {
      if (threadsMock.throws) throw new Error("no");
      return { threads: threadsMock.rows };
    },
  };
}
