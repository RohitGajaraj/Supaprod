/**
 * The Call card: the atomic unit of Cadence. Who asks, what they ask, verbatim
 * cited evidence, plain-words actions, consequence as helper text, expiry.
 * Renders identically on Today, inside a mission, and in the Engine Room.
 * @startingPoint section="Objects" subtitle="The atomic unit: a decision routed to the human" viewport="700x300"
 */
export interface CallCardProps {
  /** Mono-caps ask type: "SHIP IT?", "WORTH BUILDING?", "SPEND" */
  kind?: string;
  /** e.g. "Expires in 6h" */
  expiry?: string;
  /** The question, 2-6 words, Newsreader */
  title: string;
  body?: string;
  /** Verbatim evidence rows with named sources */
  evidence?: { source: string; text: string; cite?: { n: number; quote: string } }[];
  okLabel?: string;
  noLabel?: string;
  /** Plain-words consequence, e.g. "Opens the PR · nothing ships without you" */
  consequence?: string;
  onApprove?: () => void;
  onSendBack?: () => void;
}
