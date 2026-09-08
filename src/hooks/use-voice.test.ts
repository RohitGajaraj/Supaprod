import { describe, it, expect, afterEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useDictation, useReadAloud, stripForSpeech } from "./use-voice";

// happy-dom (the preloaded test DOM) implements neither SpeechRecognition
// nor speechSynthesis, which makes the unsupported paths directly testable.
// Supported paths inject fakes onto window/globalThis before rendering.

type FakeResultEntry = { isFinal: boolean; 0: { transcript: string }; length: number };
type FakeResultEvent = { resultIndex: number; results: FakeResultEntry[] };

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: (() => void) | null = null;
  onresult: ((event: FakeResultEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  startCalls = 0;
  stopCalls = 0;
  abortCalls = 0;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.startCalls += 1;
    // Real engines fire onstart once capture actually begins; the hook now
    // lights `listening` there (not in start()) so the permission-prompt
    // window never shows a false "Listening".
    this.onstart?.();
  }
  stop() {
    this.stopCalls += 1;
  }
  abort() {
    this.abortCalls += 1;
  }
}

function speechEvent(
  resultIndex: number,
  entries: Array<[transcript: string, isFinal: boolean]>,
): FakeResultEvent {
  return {
    resultIndex,
    results: entries.map(([transcript, isFinal]) => ({
      isFinal,
      0: { transcript },
      length: 1,
    })),
  };
}

class FakeUtterance {
  text: string;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

type SynthCall = { kind: "speak"; utterance: FakeUtterance } | { kind: "cancel" };

function installFakeSynth(): SynthCall[] {
  const calls: SynthCall[] = [];
  const synth = {
    speak(utterance: FakeUtterance) {
      calls.push({ kind: "speak", utterance });
    },
    cancel() {
      calls.push({ kind: "cancel" });
    },
  };
  (window as unknown as Record<string, unknown>).speechSynthesis = synth;
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = FakeUtterance;
  (globalThis as unknown as Record<string, unknown>).SpeechSynthesisUtterance = FakeUtterance;
  return calls;
}

function spokenTexts(calls: SynthCall[]): string[] {
  return calls
    .filter((c) => c.kind === "speak")
    .map((c) => (c as { utterance: FakeUtterance }).utterance.text);
}

function lastUtterance(calls: SynthCall[]): FakeUtterance {
  const speaks = calls.filter((c) => c.kind === "speak") as Array<{ utterance: FakeUtterance }>;
  const last = speaks[speaks.length - 1];
  if (!last) throw new Error("no utterance was spoken");
  return last.utterance;
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition;
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  delete (window as unknown as Record<string, unknown>).speechSynthesis;
  delete (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance;
  delete (globalThis as unknown as Record<string, unknown>).SpeechSynthesisUtterance;
  FakeRecognition.instances = [];
});

describe("stripForSpeech", () => {
  it("strips bold and italic markers but keeps the words", () => {
    expect(stripForSpeech("**bold** and _quiet_ and *soft* words")).toBe(
      "bold and quiet and soft words",
    );
  });

  it("keeps link labels and drops URLs", () => {
    expect(stripForSpeech("see [the docs](https://example.com/x) now")).toBe("see the docs now");
  });

  it("keeps image alt text and drops the source", () => {
    expect(stripForSpeech("![roadmap chart](chart.png) explains it")).toBe(
      "roadmap chart explains it",
    );
  });

  it("drops fenced code blocks entirely", () => {
    expect(stripForSpeech("before\n```ts\nconst x = 1;\n```\nafter")).toBe("before after");
  });

  it("unwraps inline code", () => {
    expect(stripForSpeech("run `bun test` locally")).toBe("run bun test locally");
  });

  it("removes heading markers", () => {
    expect(stripForSpeech("## Findings\nAll clear")).toBe("Findings All clear");
  });

  it("removes citation markers like [1] and [12]", () => {
    expect(stripForSpeech("Latency dropped [1] and errors fell [12]")).toBe(
      "Latency dropped and errors fell",
    );
  });

  it("collapses whitespace and trims", () => {
    expect(stripForSpeech("  a\n\n   b\tc  ")).toBe("a b c");
  });

  it("handles a combined markdown answer", () => {
    const input = "# Answer\n\nThe **p95** fell 40% [2]. See [traces](/traces) and `verify()`.";
    expect(stripForSpeech(input)).toBe("Answer The p95 fell 40% . See traces and verify().");
  });
});

describe("useDictation in an unsupported environment", () => {
  it("reports unsupported and start/stop are safe no-ops", () => {
    const finals: string[] = [];
    const { result } = renderHook(() => useDictation((t) => finals.push(t)));

    expect(result.current.supported).toBe(false);
    expect(result.current.listening).toBe(false);
    expect(result.current.interim).toBe("");

    act(() => {
      result.current.start();
      result.current.stop();
    });

    expect(result.current.listening).toBe(false);
    expect(result.current.interim).toBe("");
    expect(finals).toEqual([]);
  });
});

describe("useDictation with a fake SpeechRecognition", () => {
  function mount(onFinal: (t: string) => void = () => {}) {
    (window as unknown as Record<string, unknown>).SpeechRecognition = FakeRecognition;
    return renderHook(({ cb }) => useDictation(cb), { initialProps: { cb: onFinal } });
  }

  it("start begins listening with continuous interim config", () => {
    const { result } = mount();
    expect(result.current.supported).toBe(true);

    act(() => result.current.start());

    expect(result.current.listening).toBe(true);
    const rec = FakeRecognition.instances[0]!;
    expect(rec.startCalls).toBe(1);
    expect(rec.continuous).toBe(true);
    expect(rec.interimResults).toBe(true);
    expect(rec.lang.length).toBeGreaterThan(0);
  });

  it("start while already listening is a no-op", () => {
    const { result } = mount();
    act(() => result.current.start());
    act(() => result.current.start());

    expect(FakeRecognition.instances.length).toBe(1);
    expect(FakeRecognition.instances[0]!.startCalls).toBe(1);
    expect(result.current.listening).toBe(true);
  });

  it("onresult keeps interim text as preview without calling onFinalText", () => {
    const finals: string[] = [];
    const { result } = mount((t) => finals.push(t));
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;

    act(() => rec.onresult!(speechEvent(0, [["hello wor", false]])));

    expect(result.current.interim).toBe("hello wor");
    expect(finals).toEqual([]);
  });

  it("a final result calls onFinalText with trimmed text and clears interim", () => {
    const finals: string[] = [];
    const { result } = mount((t) => finals.push(t));
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;

    act(() => rec.onresult!(speechEvent(0, [["  hello world  ", true]])));

    expect(finals).toEqual(["hello world"]);
    expect(result.current.interim).toBe("");
  });

  it("mixed events split newly-final text from the interim tail", () => {
    const finals: string[] = [];
    const { result } = mount((t) => finals.push(t));
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;

    act(() =>
      rec.onresult!(
        speechEvent(0, [
          ["ship the demo ", true],
          ["by fri", false],
        ]),
      ),
    );

    expect(finals).toEqual(["ship the demo"]);
    expect(result.current.interim).toBe("by fri");
  });

  it("walks from resultIndex so earlier finals never repeat", () => {
    const finals: string[] = [];
    const { result } = mount((t) => finals.push(t));
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;

    act(() =>
      rec.onresult!(
        speechEvent(1, [
          ["already delivered ", true],
          ["new part", true],
        ]),
      ),
    );

    expect(finals).toEqual(["new part"]);
  });

  it("ignores whitespace-only final chunks", () => {
    const finals: string[] = [];
    const { result } = mount((t) => finals.push(t));
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;

    act(() => rec.onresult!(speechEvent(0, [["   ", true]])));

    expect(finals).toEqual([]);
  });

  it("stop() calls recognition.stop and onend resets listening and interim", () => {
    const { result } = mount();
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;
    act(() => rec.onresult!(speechEvent(0, [["tail", false]])));

    act(() => result.current.stop());
    expect(rec.stopCalls).toBe(1);

    act(() => rec.onend!());
    expect(result.current.listening).toBe(false);
    expect(result.current.interim).toBe("");
  });

  it("onerror also resets listening and interim", () => {
    const { result } = mount();
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;
    act(() => rec.onresult!(speechEvent(0, [["tail", false]])));

    act(() => rec.onerror!());

    expect(result.current.listening).toBe(false);
    expect(result.current.interim).toBe("");
  });

  it("can start again after the engine ended", () => {
    const { result } = mount();
    act(() => result.current.start());
    act(() => FakeRecognition.instances[0]!.onend!());
    act(() => result.current.start());

    expect(FakeRecognition.instances.length).toBe(2);
    expect(result.current.listening).toBe(true);
  });

  it("always calls the latest onFinalText without consumer useCallback", () => {
    const first: string[] = [];
    const second: string[] = [];
    const { result, rerender } = mount((t) => first.push(t));
    act(() => result.current.start());

    rerender({ cb: (t: string) => second.push(t) });
    const rec = FakeRecognition.instances[0]!;
    act(() => rec.onresult!(speechEvent(0, [["later", true]])));

    expect(first).toEqual([]);
    expect(second).toEqual(["later"]);
  });

  it("unmount aborts recognition and detaches handlers so onFinalText cannot fire", () => {
    const finals: string[] = [];
    const { result, unmount } = mount((t) => finals.push(t));
    act(() => result.current.start());
    const rec = FakeRecognition.instances[0]!;

    unmount();

    expect(rec.abortCalls).toBe(1);
    expect(rec.onresult).toBeNull();
    expect(rec.onend).toBeNull();
    expect(rec.onerror).toBeNull();
    expect(finals).toEqual([]);
  });
});

describe("useReadAloud in an unsupported environment", () => {
  it("reports unsupported and toggle/stop are safe no-ops", () => {
    const { result } = renderHook(() => useReadAloud());

    expect(result.current.supported).toBe(false);

    act(() => {
      result.current.toggle("m1", "hello there");
      result.current.stop();
    });

    expect(result.current.speakingId).toBeNull();
  });
});

describe("useReadAloud with a fake speechSynthesis", () => {
  it("toggle speaks the stripped text and tracks the id", () => {
    const calls = installFakeSynth();
    const { result } = renderHook(() => useReadAloud());

    expect(result.current.supported).toBe(true);

    act(() => result.current.toggle("m1", "**Answer** via [a link](https://x) [1]"));

    expect(result.current.speakingId).toBe("m1");
    expect(spokenTexts(calls)).toEqual(["Answer via a link"]);
    // Any current speech is cancelled before the new utterance starts.
    expect(calls[0]).toEqual({ kind: "cancel" });
  });

  it("toggling the same id cancels and clears without speaking again", () => {
    const calls = installFakeSynth();
    const { result } = renderHook(() => useReadAloud());

    act(() => result.current.toggle("m1", "hello"));
    act(() => result.current.toggle("m1", "hello"));

    expect(result.current.speakingId).toBeNull();
    expect(spokenTexts(calls)).toEqual(["hello"]);
    expect(calls[calls.length - 1]).toEqual({ kind: "cancel" });
  });

  it("toggling a different id stops the old and speaks the new", () => {
    const calls = installFakeSynth();
    const { result } = renderHook(() => useReadAloud());

    act(() => result.current.toggle("m1", "first answer"));
    act(() => result.current.toggle("m2", "second answer"));

    expect(result.current.speakingId).toBe("m2");
    expect(spokenTexts(calls)).toEqual(["first answer", "second answer"]);
  });

  it("utterance onend clears speakingId", () => {
    const calls = installFakeSynth();
    const { result } = renderHook(() => useReadAloud());

    act(() => result.current.toggle("m1", "hello"));
    const utterance = lastUtterance(calls);

    act(() => utterance.onend!());

    expect(result.current.speakingId).toBeNull();
  });

  it("a stale utterance ending does not clear a newer speech", () => {
    const calls = installFakeSynth();
    const { result } = renderHook(() => useReadAloud());

    act(() => result.current.toggle("m1", "first"));
    const stale = lastUtterance(calls);
    act(() => result.current.toggle("m2", "second"));

    act(() => stale.onend!());

    expect(result.current.speakingId).toBe("m2");
  });

  it("stop cancels and clears", () => {
    const calls = installFakeSynth();
    const { result } = renderHook(() => useReadAloud());

    act(() => result.current.toggle("m1", "hello"));
    act(() => result.current.stop());

    expect(result.current.speakingId).toBeNull();
    expect(calls[calls.length - 1]).toEqual({ kind: "cancel" });
  });

  it("unmount cancels any in-flight speech", () => {
    const calls = installFakeSynth();
    const { result, unmount } = renderHook(() => useReadAloud());

    act(() => result.current.toggle("m1", "hello"));
    unmount();

    expect(calls[calls.length - 1]).toEqual({ kind: "cancel" });
  });
});
