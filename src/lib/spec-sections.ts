/**
 * The one canonical section sequence every spec-writing prompt enumerates.
 * Three prompts used to disagree here (generatePrd, the prd.draft agent tool,
 * draftContractFromIntent's narrative); they now all derive their section list
 * from this constant so a spec reads the same shape no matter which door wrote
 * it. Kept in its own dependency-free module so server files that must not
 * import each other can still share it.
 */
export const SPEC_SECTION_ORDER = [
  "Problem", // why this exists, stated as the user's pain
  "Target Users", // who it serves, and who it deliberately does not
  "Hypothesis", // the bet: what we believe happens if we build this
  "User Stories", // what changes for the user, in the user's words
  "Solution Sketch", // how we intend to build it, at a level a reviewer can judge
  "Success Metrics", // falsifiable signals the bet paid off or did not
  "Scope (MVP)", // what ships first; carries size/effort where known
  "Out of Scope", // explicit non-goals, so creep has a name to be refused by
  "Risks & Open Questions", // what could break it, and what is still unresolved
  "Milestones", // sequencing and dates when there is anything to sequence
] as const;

export type SpecSection = (typeof SPEC_SECTION_ORDER)[number];
