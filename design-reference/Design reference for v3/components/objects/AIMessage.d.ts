/**
 * AI message with receipts on every utterance: sources, time, and cost in
 * quiet mono; the full trace one click deeper. Model names live in the trace,
 * never in the chrome.
 */
export interface AIMessageProps {
  /** Body text; embed <Cite> chips inline after claims */
  children: React.ReactNode;
  /** Count of cited sources */
  sources?: number;
  /** e.g. "2.1S" */
  time?: string;
  /** e.g. "$0.03" */
  cost?: string;
  /** Opens the raw trace */
  onTrace?: () => void;
}
