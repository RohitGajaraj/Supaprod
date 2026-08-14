import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveProviderCall, type ProviderCall } from "@/lib/connectors/gateway-era.server";

/**
 * WHO THIS AUTHENTICATES AS, and why it changed.
 *
 * `fetchGDoc` read `LOVABLE_API_KEY` + `GOOGLE_DOCS_API_KEY` from the
 * environment and nothing else, so the per-user token the Google OAuth callback
 * writes to the vault was never read by anything, and a person who had completed
 * the flow was told the key was not configured. The credential chain now answers:
 * their own connection first, the admin key on the gateway second. Full
 * reasoning is on `resolveProviderCall`.
 */
const NOT_CONNECTED = "Google Docs is not connected. Connect it in Settings, Connections.";

function extractDocId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
  return null;
}

type TTMark = { type: string };
type TTNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TTNode[];
  marks?: TTMark[];
  text?: string;
};

type GTextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: { url?: string };
};
type GTextRun = { content?: string; textStyle?: GTextStyle };
type GParagraphElement = {
  textRun?: GTextRun;
  inlineObjectElement?: { inlineObjectId?: string };
};
type GParagraph = {
  elements?: GParagraphElement[];
  paragraphStyle?: { namedStyleType?: string };
  bullet?: unknown;
};
type GStructuralElement = { paragraph?: GParagraph };
type GInlineObject = {
  inlineObjectProperties?: {
    embeddedObject?: { imageProperties?: { contentUri?: string } };
  };
};
type GDocument = {
  title?: string;
  body?: { content?: GStructuralElement[] };
  inlineObjects?: Record<string, GInlineObject>;
};

function marksFromStyle(s?: GTextStyle): TTMark[] {
  if (!s) return [];
  const marks: TTMark[] = [];
  if (s.bold) marks.push({ type: "bold" });
  if (s.italic) marks.push({ type: "italic" });
  if (s.underline) marks.push({ type: "underline" });
  if (s.strikethrough) marks.push({ type: "strike" });
  if (s.link?.url) {
    (marks as Array<TTMark & { attrs?: Record<string, unknown> }>).push({
      type: "link",
      attrs: { href: s.link.url },
    });
  }
  return marks;
}

function gdocsToTiptap(doc: GDocument): TTNode {
  const out: TTNode[] = [];
  const elements = doc.body?.content ?? [];
  const inlineObjects = doc.inlineObjects ?? {};
  for (const el of elements) {
    const p = el.paragraph;
    if (!p) continue;
    const style = p.paragraphStyle?.namedStyleType ?? "NORMAL_TEXT";
    const children: TTNode[] = [];
    for (const e of p.elements ?? []) {
      if (e.textRun) {
        const raw = e.textRun.content ?? "";
        const text = raw.replace(/\n+$/, "");
        if (!text) continue;
        const marks = marksFromStyle(e.textRun.textStyle);
        children.push({ type: "text", text, ...(marks.length ? { marks } : {}) });
      } else if (e.inlineObjectElement?.inlineObjectId) {
        const obj = inlineObjects[e.inlineObjectElement.inlineObjectId];
        const src = obj?.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri;
        if (src) out.push({ type: "image", attrs: { src } });
      }
    }
    const headingMatch = /^HEADING_([1-6])$/.exec(style);
    if (headingMatch) {
      out.push({
        type: "heading",
        attrs: { level: Number(headingMatch[1]) },
        content: children.length ? children : [{ type: "text", text: " " }],
      });
    } else if (children.length) {
      out.push({ type: "paragraph", content: children });
    } else {
      out.push({ type: "paragraph" });
    }
  }
  return { type: "doc", content: out.length ? out : [{ type: "paragraph" }] };
}

function extractText(node: TTNode): string {
  if (node.text) return node.text;
  if (node.content) return node.content.map(extractText).join(" ");
  return "";
}

async function fetchGDoc(call: ProviderCall, documentId: string): Promise<GDocument> {
  const res = await fetch(`${call.baseUrl}/documents/${encodeURIComponent(documentId)}`, {
    headers: call.headers,
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Google Docs API failed [${res.status}]: ${body.slice(0, 500)}`);
  }
  return JSON.parse(body) as GDocument;
}

export const importGoogleDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        urlOrId: z.string().min(8).max(500),
        parent_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const documentId = extractDocId(data.urlOrId);
    if (!documentId) throw new Error("Could not parse a Google Docs ID from input");

    const call = await resolveProviderCall({
      provider: "google_docs",
      userClient: supabase,
      userId,
    });
    if (!call) throw new Error(NOT_CONNECTED);
    const gdoc = await fetchGDoc(call, documentId);
    const tiptap = gdocsToTiptap(gdoc);
    const title = (gdoc.title ?? "Untitled").slice(0, 200);
    const text = extractText(tiptap).slice(0, 50000);

    const { data: row, error } = await supabase
      .from("docs")
      .insert({
        user_id: userId,
        title,
        parent_id: data.parent_id ?? null,
        icon: "📄",
        content_json: tiptap as never,
        content_text: text,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("sync_mappings").insert({
      user_id: userId,
      provider: "google_docs",
      local_kind: "doc",
      local_id: row.id,
      external_id: documentId,
      external_url: `https://docs.google.com/document/d/${documentId}/edit`,
      last_pulled_at: new Date().toISOString(),
      version_remote: 1,
    } as never);

    return { doc: row };
  });
