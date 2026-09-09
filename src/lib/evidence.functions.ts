/**
 * WHAT THIS WORKSPACE ALREADY SAYS ABOUT A SUBJECT, BEFORE THE WORK STARTS
 * (F-184's door; the probe is `src/lib/spine/what-the-evidence-already-says.ts`).
 *
 * ── WHY THIS WRAPPER EXISTS AT ALL ──────────────────────────────────────────
 * `evidenceForSubject` is a plain async helper, so a browser cannot reach it.
 * S1 measured that the module had **zero callers outside its own test** and
 * filed for exactly this. `src/lib/**` is S0's; the door at `/start` is S1's.
 *
 * ── WHAT IT IS FOR, MEASURED ────────────────────────────────────────────────
 * `060bc5ff` spent **three completed runs and three attempts** for all three
 * Discover seats to report, independently and correctly, that the workspace
 * holds no evidence about *"password-reset link 404s"*. **One query at creation
 * would have said so.** The workspace was never empty: 267 signals from 40
 * sources, none of them about password resets.
 *
 * ── IT TELLS. IT NEVER REFUSES. ─────────────────────────────────────────────
 * A subject the evidence is silent on may be exactly what somebody wants
 * investigated. This returns numbers and where they came from; it has no
 * threshold and no verdict, and **nothing built on it may become a gate.**
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { evidenceForSubject } from "@/lib/spine/what-the-evidence-already-says.server";
import { NO_EVIDENCE_READ, type SubjectEvidence } from "@/lib/spine/what-the-evidence-already-says";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

/**
 * THE WORKSPACE IS DERIVED, NEVER TAKEN FROM THE CALLER.
 *
 * S1 offered either shape. Deriving it is the one that cannot be pointed at
 * somebody else's tenant: a caller-supplied `workspaceId` would make this a
 * cross-tenant read away from a typo, and what it returns is *how much has been
 * said about a problem*, which is precisely the thing one customer must not
 * learn about another. The enterprise gate is not a formality here.
 */
export const getSubjectEvidence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ subject: z.string().trim().min(1).max(400) }).parse(d))
  .handler(async ({ data, context }): Promise<SubjectEvidence> => {
    const { data: ws } = await context.supabase.rpc("current_user_default_workspace");
    const workspaceId = defaultWorkspaceId(ws);
    // No workspace yet is not "nothing mentions this". A person who has just
    // signed up has no evidence because they have no workspace, and telling them
    // the subject is unevidenced would be a claim about their problem drawn from
    // a fact about their account. `count: null` renders as "I could not check".
    if (!workspaceId) return { ...NO_EVIDENCE_READ };
    return evidenceForSubject(
      context.supabase as unknown as SupabaseClient,
      workspaceId,
      data.subject,
    );
  });
