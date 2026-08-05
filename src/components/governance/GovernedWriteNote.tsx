/**
 * WHY A CONTROL ON THIS SURFACE IS NOT YOURS TO USE.
 *
 * One sentence, said once per surface, above the controls it explains. Not once
 * per control: four Blocks of Lines each repeating "Your role here is viewer"
 * is nagging, and the sentence is about the person, not about the switch.
 *
 * It says the OUTCOME and never the mechanism. Nobody pressing a switch needs
 * to hear the words "row level security", and the table name is ours, not
 * theirs. The wording itself is written once, in writeDeniedReason
 * (src/lib/roles.functions.ts), so every surface refuses in the same voice.
 *
 * Renders nothing when the write is allowed, so a caller can drop it in
 * unconditionally and an owner's surface is byte-identical to what it was.
 */
export function GovernedWriteNote({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return (
    <p className="sp-subtitle" data-governed-write="denied">
      {reason}
    </p>
  );
}
