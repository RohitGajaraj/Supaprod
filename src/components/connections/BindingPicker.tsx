import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "@/lib/notify";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { listBindableResources, upsertBinding } from "@/lib/connections.functions";

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
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Binding failed"),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* The system's own button, so a picker trigger and a Save button are
            the same object. It used to carry its own tailwind geometry and a
            token (`hairline`) that no longer exists. */}
        <button type="button" className="rounded-mrd-chip border border-mrd-line bg-mrd-lift px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-lift-hover hover:text-mrd-ink" disabled={mBind.isPending}>
          {mBind.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ChevronsUpDown size={15} />
          )}
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
            {q.isFetching && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </div>
            )}
            {q.isError && (
              <div className="px-3 py-2 text-xs text-[color:var(--mrd-fail)]">
                {q.error instanceof Error ? q.error.message : "Could not list resources"}
              </div>
            )}
            {!q.isFetching && !q.isError && (
              <CommandEmpty>No {plural(kindLabel.toLowerCase())} found.</CommandEmpty>
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
