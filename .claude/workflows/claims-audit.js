export const meta = {
  name: 'supaprod-site-v3-research',
  description: 'Ground the website rebuild in what the product can actually claim, prove and show',
  phases: [
    { title: 'Ground', detail: 'positioning law, enterprise objections, real product surfaces, checkable proof' },
    { title: 'Challenge', detail: 'adversarially test each finding for overclaim' },
  ],
}

const ROOT = '/Users/rohitgajaraj/Projects/My Projects/My Builds/supaprod-site-v3'

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['claim', 'evidence', 'usable_on_site'],
        properties: {
          claim: { type: 'string', description: 'A specific thing the site could say or show' },
          evidence: { type: 'string', description: 'file:line or command output proving it' },
          usable_on_site: { type: 'boolean' },
          caveat: { type: 'string' },
        },
      },
    },
  },
}

const LANES = [
  {
    key: 'vocabulary-law',
    prompt: `In ${ROOT}, read CLAUDE.md, README.md, docs/strategy/positioning-locked-2026-08.md and docs/growth/vocabulary-change-list-2026-08.md.
Extract the EXACT vocabulary law for outward copy: every banned word/phrase, every mandated one, and the rules about tense (e.g. never claiming accumulated learning in the present tense).
Also extract the canonical positioning: the three layers, the moat sentence, and the audience.
Return findings where "claim" is a rule or an approved sentence, and "evidence" is file:line. Be exhaustive about BANNED terms - a website that breaks these is worse than useless.`,
  },
  {
    key: 'enterprise-proof',
    prompt: `In ${ROOT}, read src/routes/security.tsx, src/routes/trust.tsx, docs/operations/security/ (if present), and any governance/boundary code (grep for "boundary", "merge gate", "RLS", "BYO", "model key").
An enterprise buyer (CIO/CISO/technical evaluator) will ask: where does my data live, what can agents do without a human, how do you stop an agent doing damage, whose models, can I audit it, what happens when it fails.
Return findings: for each question, what the product ACTUALLY has, with file:line evidence. Mark usable_on_site false for anything aspirational. Be ruthless - do not report a feature that only exists in a doc.`,
  },
  {
    key: 'real-surfaces',
    prompt: `In ${ROOT}, inventory the REAL authenticated product surfaces in src/routes/_authenticated.*.tsx.
For each of the seven stations (Discover, Decide, Plan, Design, Build, Ship, Learn) plus the brain/today/approvals surfaces, identify: the route, what it actually renders, and whether it would make a credible product visual on a marketing site.
Return findings where "claim" names a surface worth showing and "evidence" is the route file. Flag any that are stubs or thin.`,
  },
  {
    key: 'checkable-proof',
    prompt: `In ${ROOT}, find every CHECKABLE public proof the site could point at: /proof, /updates, /p/teardown, /ard, the MCP server, the A2A agent card, /llms.txt, test counts, the public demo workspace.
For each: does it currently work and return real data, or is it empty/seeded? Read the route and its data function. Run "bun test 2>&1 | tail -5" for the real test count.
Return findings with evidence. Mark usable_on_site false for anything that shows an honest zero or seeded data, and say so in caveat.`,
  },
]

phase('Ground')
const grounded = await pipeline(
  LANES,
  (lane) => agent(lane.prompt, { label: `ground:${lane.key}`, phase: 'Ground', schema: SCHEMA }),
  (res, lane) => {
    if (!res || !res.findings || !res.findings.length) return { key: lane.key, findings: [] }
    const usable = res.findings.filter((f) => f.usable_on_site)
    return { key: lane.key, findings: res.findings, usableCount: usable.length }
  },
)

phase('Challenge')
const challenged = await parallel(
  grounded.filter(Boolean).map((g) => () =>
    agent(
      `You are an adversarial fact-checker for a B2B enterprise website. Below are claims a marketing site intends to make about the Supaprod product, each with cited evidence from ${ROOT}.

Your job is to REFUTE any claim the codebase does not actually support. A claim survives only if you can open the cited file and see the mechanism working end to end. A mechanism with no writer, a column nothing populates, a doc describing an intention, or a surface rendering seeded data all FAIL.

Claims to test:
${JSON.stringify(g.findings, null, 2)}

Return findings: keep "claim" verbatim, set usable_on_site to your verdict after checking, and put your refutation or confirmation in "caveat" with the file:line you checked.`,
      { label: `challenge:${g.key}`, phase: 'Challenge', schema: SCHEMA },
    ),
  ),
)

return {
  grounded: grounded.filter(Boolean),
  challenged: challenged.filter(Boolean),
}
