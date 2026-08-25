import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { publicAnnouncementView, type PublicAnnouncementView } from "@/lib/announcements";
import { buildSrcDoc } from "@/lib/prototype-srcdoc";

export const Route = createFileRoute("/p/$slug")({ component: PublicPage });

type FileRow = { path: string; content: string; language: string };

/** A published-date string, formatted for the public reader; "" if unparseable (never "Invalid Date"). */
function formatPublishedDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

type PublicState =
  | { kind: "prototype"; name: string; src: string }
  | { kind: "announcement"; view: PublicAnnouncementView };

function PublicPage() {
  const { slug } = Route.useParams();
  const [state, setState] = useState<PublicState | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // 1. A public prototype share?
      const { data: proto } = await supabase
        .from("prototypes")
        .select("id,name,entry_path,is_public")
        .eq("share_slug", slug)
        .maybeSingle();
      if (proto && proto.is_public) {
        const { data: files, error: e2 } = await supabase
          .from("prototype_files")
          .select("path,content,language")
          .eq("prototype_id", proto.id);
        if (e2) {
          setErr(e2.message);
          return;
        }
        setState({
          kind: "prototype",
          name: proto.name,
          src: buildSrcDoc(files ?? [], proto.entry_path),
        });
        return;
      }
      // 2. A published announcement (L2b)? The published-only RLS policy gates the
      //    anon read, the `.eq("status","published")` filter is a second guard, and
      //    publicAnnouncementView is a third — a draft/pending row can never render.
      const { data: ann } = await supabase
        .from("announcements")
        .select("title,body,status,published_at")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      const view = publicAnnouncementView(ann);
      if (view) {
        setState({ kind: "announcement", view });
        return;
      }
      // 3. Neither.
      setErr("This page is private or not found.");
    })();
  }, [slug]);

  if (err)
    return (
      <div className="min-h-screen grid place-items-center bg-mrd-bg text-mrd-body p-8 text-center">
        <div>
          <div className="font-display text-xl">Unavailable</div>
          <p className="text-sm text-mrd-mute mt-2">{err}</p>
        </div>
      </div>
    );
  if (!state)
    return (
      <div className="min-h-screen grid place-items-center bg-mrd-bg text-mrd-mute text-sm">
        Loading…
      </div>
    );

  if (state.kind === "announcement") {
    const { title, bodyLines, publishedAt } = state.view;
    const dateLabel = publishedAt ? formatPublishedDate(publishedAt) : "";
    return (
      <div className="min-h-screen flex flex-col bg-mrd-bg text-mrd-body">
        <header className="border-b hairline px-4 py-2.5 flex items-center justify-between bg-mrd-bg/60 backdrop-blur">
          <div className="font-display text-sm">{title}</div>
          <div className="text-mrd-nano uppercase tracking-[0.16em] text-mrd-mute">
            Made with Supaprod
          </div>
        </header>
        <main className="flex-1 w-full">
          <article className="mx-auto max-w-2xl px-6 py-12">
            <h1 className="font-display text-2xl">{title}</h1>
            {dateLabel && <p className="text-xs text-mrd-mute mt-1.5">{dateLabel}</p>}
            <div className="mt-6 space-y-3 text-sm leading-mrd-prose">
              {bodyLines.map((line, i) =>
                line.trim() === "" ? (
                  <div key={i} className="h-2" aria-hidden="true" />
                ) : (
                  <p key={i}>{line}</p>
                ),
              )}
            </div>
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-mrd-bg text-mrd-body">
      <header className="border-b hairline px-4 py-2.5 flex items-center justify-between bg-mrd-bg/60 backdrop-blur">
        <div className="font-display text-sm">{state.name}</div>
        <div className="text-mrd-nano uppercase tracking-[0.16em] text-mrd-mute">
          Made with Supaprod
        </div>
      </header>
      <iframe
        title={state.name}
        sandbox="allow-scripts allow-forms allow-modals"
        srcDoc={state.src}
        className="flex-1 w-full bg-canvas"
      />
    </div>
  );
}
