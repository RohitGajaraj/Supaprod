import { useCallback, useEffect, useRef, useState } from "react";

// PC-36 voice phase 1: mic dictation into the Ask composer plus optional
// read-aloud on answers, via the browser Web Speech API only. No server
// calls, no MediaRecorder, no audio upload; the upload-transcription path
// in src/lib/audio.functions.ts is a separate feature and stays untouched.
// Both hooks must be SSR-safe: this app renders on Cloudflare Workers where
// window does not exist, so `supported` is false and every action is a
// no-op on the server.

// lib.dom in this tsconfig does not ship SpeechRecognition types, so the
// minimal shapes this file touches are declared privately here.
interface MinimalSpeechRecognitionAlternative {
  transcript: string;
}
interface MinimalSpeechRecognitionResult {
  isFinal: boolean;
  readonly length: number;
  [index: number]: MinimalSpeechRecognitionAlternative;
}
interface MinimalSpeechRecognitionResultList {
  readonly length: number;
  [index: number]: MinimalSpeechRecognitionResult;
}
interface MinimalSpeechRecognitionEvent {
  resultIndex: number;
  results: MinimalSpeechRecognitionResultList;
}
interface MinimalSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort?: () => void;
}
type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type DictationState = {
  supported: boolean;
  listening: boolean;
  /** Interim (not yet final) transcript for live preview; "" when idle. */
  interim: string;
  start: () => void;
  stop: () => void;
};

export function useDictation(onFinalText: (text: string) => void): DictationState {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const mountedRef = useRef(true);
  // Latest callback lives in a ref so consumers do not need useCallback.
  const onFinalTextRef = useRef(onFinalText);
  onFinalTextRef.current = onFinalText;

  const supported = getRecognitionCtor() !== null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      // Detach handlers before killing the engine so nothing (including
      // onFinalText via onresult) can fire after unmount.
      mountedRef.current = false;
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        if (recognition.abort) recognition.abort();
        else recognition.stop();
      }
    };
  }, []);

  const start = useCallback(() => {
    // No-op on the server, in unsupported browsers, and while listening.
    const Recognition = getRecognitionCtor();
    if (!Recognition || recognitionRef.current) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";

    recognition.onresult = (event) => {
      if (!mountedRef.current) return;
      // Walk only from resultIndex: earlier entries were already delivered
      // as final on a previous event and must not repeat.
      let finalChunk = "";
      let interimTail = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalChunk += transcript;
        else interimTail += transcript;
      }
      const finalText = finalChunk.trim();
      if (finalText) onFinalTextRef.current(finalText);
      setInterim(interimTail);
    };

    const reset = () => {
      recognitionRef.current = null;
      if (!mountedRef.current) return;
      setListening(false);
      setInterim("");
    };
    recognition.onend = reset;
    recognition.onerror = reset;

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    // The engine fires onend after stop; state resets there so a final
    // trailing result can still land first.
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, interim, start, stop };
}

export type ReadAloudState = {
  supported: boolean;
  /** The id currently being spoken, or null. */
  speakingId: string | null;
  /** Toggle: same id stops; new id stops the old and speaks the new. */
  toggle: (id: string, text: string) => void;
  stop: () => void;
};

/**
 * Strips markdown and citation noise so speechSynthesis reads clean prose.
 * Exported for tests.
 */
export function stripForSpeech(text: string): string {
  return (
    text
      // Fenced code blocks are noise when spoken; drop them whole.
      .replace(/```[\s\S]*?```/g, " ")
      // Inline code: keep the content, drop the backticks.
      .replace(/`([^`]*)`/g, "$1")
      // Images keep their alt text. Must run before the link rule.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Links keep the label, drop the URL.
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Heading markers at line start.
      .replace(/^#{1,6}\s+/gm, "")
      // Bold, italic, strikethrough wrappers.
      .replace(/(\*\*|__)([\s\S]*?)\1/g, "$2")
      .replace(/([*_])([^*_\n]+)\1/g, "$2")
      .replace(/~~([\s\S]*?)~~/g, "$1")
      // Citation markers like [1] or [12]; runs after links so labels survive.
      .replace(/\[\d+\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

export function useReadAloud(): ReadAloudState {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  // Mirror of speakingId for reads inside stable callbacks and utterance
  // handlers, which would otherwise close over a stale value.
  const speakingIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const supported = getSynth() !== null;

  const setSpeaking = useCallback((id: string | null) => {
    speakingIdRef.current = id;
    setSpeakingId(id);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      getSynth()?.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    const synth = getSynth();
    if (!synth) return;
    synth.cancel();
    setSpeaking(null);
  }, [setSpeaking]);

  const toggle = useCallback(
    (id: string, text: string) => {
      const synth = getSynth();
      if (!synth) return;
      // Whatever is playing stops first; toggling the same id ends there.
      synth.cancel();
      if (speakingIdRef.current === id) {
        setSpeaking(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
      const clear = () => {
        // Guard both unmount and the stale case where a newer utterance
        // already replaced this one.
        if (mountedRef.current && speakingIdRef.current === id) setSpeaking(null);
      };
      utterance.onend = clear;
      utterance.onerror = clear;
      synth.speak(utterance);
      setSpeaking(id);
    },
    [setSpeaking],
  );

  return { supported, speakingId, toggle, stop };
}
