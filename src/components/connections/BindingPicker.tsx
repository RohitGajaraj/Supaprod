import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import { toast } from "@/lib/notify";
/* THE TWO SHADCN IMPORTS STAY UNTIL MERIDIAN HAS A COMBOBOX (named 2026-09-10).
   The read states inside this panel are already Meridian's -- `Reading` and
   `ReadFailedLine` below, and the trigger is drawn in `--mrd-*` -- so what is
   left is the COMBOBOX ITSELF and not its contents.

   Meridian has the PANEL: `results-popover.tsx` is a floating listbox that is as
   wide as its content needs. It does not have the CONTROL. `Picker` is a native
   select element, which cannot search or hold server-filtered rows; `Search` is
   an inline field that narrows a list it is already holding, and its own header
   says so.

   THE REASON NOT TO PORT IT ANYWAY IS THE KEYBOARD CONTRACT. `FindAnything` is
   the one place that composes `ResultsPopover` into an async listbox, and it
   hand-rolls that contract itself: arrow keys, Enter, `role="option"` rows,
   `aria-activedescendant` wired to generated ids. Rebuilding it here would be
   the SECOND hand-rolled copy of a combobox in this product, and the two would
   drift, because nothing tests that they agree. `cmdk` brings that contract
   already built.

   So the honest gap is a Meridian combobox -- `ResultsPopover` plus the keyboard
   contract `FindAnything` already proved, extracted once so both callers share
   it. That is a design-system addition and it wants its own pass. */
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ReadFailedLine, Reading } from "@/components/meridian/surface-parts";
import { listBindableResources, upsertBinding } from "@/lib/connections.functions";
import { humanWriteError } from "@/lib/roles.functions";

/**
 * Combobox that binds one provider resource (repo, team, database, …) to the
 * current workspace. Opens → searches the connection's bindable resources
 * (300ms debounce, server-side filter) → pick → upsertBinding → toast.
 *
 * NO PROVIDER MARK HERE, and that is a decision. The Line this trigger sits in
 * already names the provider two inches to the left, with its mark; an icon
 * beside a word that already says the same thing is the noise anti-slop.md §6
 * explicitly rules out. The chevron on the trigger is not identity, it is the
 * disclosure cue, and it stays.
 */

/** "Search repositorys" was live on this surface. The resource labels come from
 *  the registry as singulars, so the plural is made here rather than by
 *  appending an s and hoping. */
function plural(word: string): string {
  if (/[sxz]$/.test(word) || /(ch|sh)$/.test(word)) return `${word}es`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}
export function BindingPicker({
  connectionId,
  resourceKind,
  kindLabel,
}: {
  connectionId: string;
  resourceKind: string;
  kindLabel: string;
}) {
  const qc = useQueryClient();
  const fList = useServerFn(listBindableResources);
  const fUpsert = useServerFn(upsertBinding);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const q = useQuery({
    queryKey: ["bindable-resources", connectionId, resourceKind, debounced],
    queryFn: () =>
      fList({
        data: { connectionId, resourceKind, q: debounced.trim() || undefined },
      }),
    enabled: open,
  });
  const items = (q.data?.items ?? []) as { id: string; label: string }[];

  const mBind = useMutation({
    mutationFn: (item: { id: string; label: string }) =>
      fUpsert({
        data: { connectionId, resourceKind, resourceId: item.id, resourceLabel: item.label },
      }),
    onSuccess: (_d, item) => {
      toast.success(`Bound ${resourceKind} ${item.label} to this workspace`);
      setOpen(false);
      setQuery("");
      qc.invalidateQueries({ queryKey: ["workspace-bindings"] });
    },
    onError: (e: unknown) => toast.error(humanWriteError(e, "Binding failed")),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* The system's own button, so a picker trigger and a Save button are
            the same object. It used to carry its own tailwind geometry and a
            token (`hairline`) that no longer exists. */}
        <button
          type="button"
          className="rounded-mrd-chip border border-mrd-line bg-mrd-lift px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-lift-hover hover:text-mrd-ink disabled:cursor-default disabled:opacity-45"
          /* THE BIND IS ANNOUNCED, NOT SPUN. A spinner swapped in for the
             disclosure chevron said "something is happening" to a sighted
             reader and nothing at all to anyone else, and it took away the one
             mark that tells you this control opens a list. `aria-busy` beside
             `disabled` is the same fact Meridian's `Action` tells with `busy`:
             the control is not unavailable, it is working. */
          disabled={mBind.isPending}
          aria-busy={mBind.isPending || undefined}
        >
          <ChevronsUpDown size={15} />
          Point it at a {kindLabel.toLowerCase()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={`Search ${plural(kindLabel.toLowerCase())}`}
          />
          <CommandList>
            {/* THE THREE READ STATES, IN MERIDIAN'S OWN REGISTER. A spinner and
                the word "Loading…" said that the machine was busy; `Reading`
                says what is being read, which is the only version of the fact a
                person can do anything with. */}
            {q.isFetching && (
              <div className="px-mrd-3 py-mrd-2">
                <Reading>Reading what this can point at.</Reading>
              </div>
            )}
            {q.isError && (
              <div className="px-mrd-3 py-mrd-2">
                {/* The sentence names the read that failed AND the fact that
                    matters most here: opening a picker changes nothing, so a
                    person who was mid-choice has not lost the choice. The
                    colour is `ReadFailedLine`'s own; this wrapper only pads. */}
                <ReadFailedLine onRetry={() => void q.refetch()} error={q.error}>
                  The list did not load. Nothing you chose has changed.
                </ReadFailedLine>
              </div>
            )}
            {!q.isFetching && !q.isError && (
              <CommandEmpty>
                Nothing to point at yet. {plural(kindLabel)} appear here once the source has them.
              </CommandEmpty>
            )}
            <CommandGroup>
              {items.map((it) => (
                <CommandItem
                  key={it.id}
                  value={it.id}
                  disabled={mBind.isPending}
                  onSelect={() => mBind.mutate(it)}
                >
                  {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
