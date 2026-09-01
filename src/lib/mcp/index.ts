import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import listWorkspaces from "./tools/list_workspaces";
import listDecisions from "./tools/list_decisions";
import searchSignals from "./tools/search_signals";
import listRuns from "./tools/list_runs";
import listForecasts from "./tools/list_forecasts";

// Direct Supabase host is required for the OAuth issuer (mcp-js validates the
// discovery document per RFC 8414). Read the project ref from the Vite-inlined
// env; the sentinel fallback keeps the entry import-safe during manifest
// extraction and never verifies a real token.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "supaprod-mcp",
  title: "Supaprod",
  version: "0.1.0",
  // The instructions are the only thing a connecting agent reads before it picks
  // a tool, so a tool that is not named here is a tool that is not found. It has
  // to say what each one ANSWERS rather than what it returns: list_decisions and
  // list_forecasts both read the decisions table, and an agent asked "did that
  // call hold" will reach for the first name unless the sentence tells it that
  // the prediction and its verdict live on the second.
  instructions:
    "Tools for a connected Supaprod user's decisions, workspaces, and signals. Call whoami first to confirm the session; use list_workspaces to discover workspace_ids for the other tools. list_runs shows what work is in flight and what is waiting on a person. list_forecasts shows what was predicted before the outcome was known, when each call comes due, and whether it held -- list_decisions does not carry any of that.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listWorkspaces, listDecisions, searchSignals, listRuns, listForecasts],
});
