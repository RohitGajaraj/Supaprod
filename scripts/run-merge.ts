import "dotenv/config";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

const USER_ID = "9e7958c5-3560-4133-ad83-0f8c42f1b33d";
const WORKSPACE_ID = "b90da531-34aa-4009-bcce-2162b87f50ac";
const MISSION_ID = "a7adb7a0-04bf-4aed-bfc9-c39d56d91cca";

async function main() {
  const def = TOOL_REGISTRY["studio.pr.merge"];
  if (!def) throw new Error("tool not found");
  const ctx = {
    supabase: supabaseAdmin as any,
    userId: USER_ID,
    workspaceId: WORKSPACE_ID,
    missionId: MISSION_ID,
    runId: null,
    traceId: null,
    stepIndex: null,
    agentSlug: "builder",
    agentId: null,
  };
  const result = await def.run({ method: "squash" }, ctx as any);
  console.log("RESULT:", JSON.stringify(result, null, 2));

  const { data } = await supabaseAdmin
    .from("studio_changesets")
    .select("id,status,pr_number,updated_at")
    .eq("id", "939e8fa0-050c-42ec-936a-ba5cb838a763")
    .maybeSingle();
  console.log("CHANGESET:", JSON.stringify(data, null, 2));
}
main().catch((e) => { console.error("ERR:", e); process.exit(1); });
