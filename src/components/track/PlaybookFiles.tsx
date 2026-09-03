/**
 * THE THREE FILES, AS THEMSELVES.
 *
 * ── WHY THEY ARE ON THE PLAN TAB AT ALL ───────────────────────────────────
 * A team on Anthropic's AI-native SDLC playbook keeps `intent.md`, `spec.md` and
 * `plan.md` committed in its repo. We hold the same facts in `decisions`, `prds`
 * and `tasks`, where nobody outside this product can read them. P-21's point is
 * that our output should drop into their repo with no adapter — and a person
 * cannot believe that until they can see the files and take one.
 *
 * ── SHOWN AS FILES, NOT AS A RENDERED DOCUMENT ────────────────────────────
 * Monospace, the raw markdown, under the filename it takes in the repo. The Plan
 * tab already renders the spec as prose directly above this, and rendering it
 * twice would be a second, prettier copy of something a person is here to COPY.
 * What they need from this block is the exact bytes.
 *
 * ── COPY AND DOWNLOAD ARE DIFFERENT ACTIONS, NOT TWO STYLES OF ONE ────────
 * Copy is for pasting one file into a chat or an editor. Download is for
 * dropping the file into a repo with its name intact, which is the whole
 * claim. Offering only copy would leave the person to name the file themselves,
 * and a file named wrongly is not the playbook's shape any more.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getPlaybookFiles } from "@/lib/spine/track.functions";
import { PLAYBOOK_FILES, playbookPath } from "@/lib/spine/playbook-files";
import { CopyButton } from "@/components/traces/TraceFacts";

/** One file: its repo path, its bytes, and the two ways to take it. */
function FileBlock({ name, body }: { name: (typeof PLAYBOOK_FILES)[number]; body: string }) {
  const download = React.useCallback(() => {
    /*
     * A blob URL rather than a data URI: a spec body can be tens of kilobytes
     * and a data URI that long is refused by some browsers with no error a page
     * can see. Revoked on the next tick, because a URL held open is a leak that
     * only shows up after a person has opened twenty of them.
     */
    const url = URL.createObjectURL(new Blob([body], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [body, name]);

  return (
    <div className="flex min-w-0 flex-col gap-mrd-2">
      <span className="flex flex-wrap items-center gap-mrd-3">
        <span className="font-mrd-mono text-mrd-data text-mrd-body">{playbookPath(name)}</span>
        <CopyButton value={body} what={name} />
        <button
          type="button"
          onClick={download}
          aria-label={`Download ${name}`}
          className="mrd-focus flex h-6 shrink-0 items-center rounded-mrd-xs px-1.5 text-mrd-tiny font-medium text-mrd-mute transition-colors duration-[var(--mrd-d-press)] hover:bg-mrd-hover hover:text-mrd-ink"
        >
          Download
        </button>
      </span>
      {/* Scrolls inside itself. A long spec must not push the tab sideways, which
          is the defect this surface has already been repaired for twice. */}
      <pre className="min-w-0 max-h-[320px] overflow-auto rounded-mrd-chip bg-mrd-sink p-mrd-3 font-mrd-mono text-mrd-data text-mrd-mute">
        {body}
      </pre>
    </div>
  );
}

export function PlaybookFilesPanel({ trackId }: { trackId: string }) {
  const fFiles = useServerFn(getPlaybookFiles);
  const q = useQuery({
    queryKey: ["playbook-files", trackId],
    queryFn: () => fFiles({ data: { trackId } }),
    staleTime: 30_000,
  });

  /*
   * Nothing at all until there is something to show. A read that has not
   * answered is not an empty result, and a track with no decision and no spec
   * would otherwise get three files of "not recorded yet" -- a form telling a
   * person the product failed, when the truth is the work has not reached Plan.
   */
  if (!q.data?.anything) return null;

  return (
    <div className="flex flex-col gap-mrd-3 rounded-mrd-chip bg-mrd-lift p-mrd-4">
      <span className="mrd-eyebrow">Take this to your repo</span>
      <p className="text-mrd-small text-mrd-mute">
        The same three files a team on the AI-native playbook already keeps. They go in at{" "}
        <span className="font-mrd-mono text-mrd-data">.supaprod/</span>, and Build puts them in the
        pull request itself.
      </p>
      {PLAYBOOK_FILES.map((name) => (
        <FileBlock key={name} name={name} body={q.data!.files[name]} />
      ))}
    </div>
  );
}

export default PlaybookFilesPanel;
