import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  Home,
  Bot,
  Brain,
  MessageCircle,
  Hammer,
  ListTodo,
  Settings,
  Sparkles,
  Search,
  Telescope,
  ShieldAlert,
  Activity,
  Calendar as CalIcon,
} from "lucide-react";
import { PRIMARY_NAV, ENGINE_ROOM_DOOR } from "@/lib/nav-model";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    // Sidebar "Jump to…" button opens the palette without simulating keys.
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("cadence:open-cmdk", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cadence:open-cmdk", onOpenEvent);
    };
  }, []);

  const go = (to: string, search?: Record<string, string>) => {
    setOpen(false);
    navigate({ to, search: search as never });
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[80] grid place-items-start pt-[14vh] bg-background/70 backdrop-blur-md animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <Command
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border hairline bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
            label="Command palette"
          >
            <div className="flex items-center gap-2 px-4 border-b hairline">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Command.Input
                autoFocus
                placeholder="Search Cadence: navigate, ask AI, run agents..."
                className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] text-muted-foreground border hairline rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>
            <Command.List className="max-h-[360px] overflow-y-auto p-2 scrollbar-thin">
              <Command.Empty className="px-3 py-6 text-center text-xs text-muted-foreground">
                No matches. Try "today", "tasks", "brain"…
              </Command.Empty>
              <Command.Group
                heading="Navigate"
                className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground px-2 py-1.5"
              >
                <Item
                  icon={Home}
                  label="Today · Mission Control"
                  hint="1"
                  onSelect={() => go("/today")}
                />
                <Item
                  icon={Telescope}
                  label="Discover · signals, opportunities, specs"
                  hint="2"
                  onSelect={() => go("/discover")}
                />
                <Item
                  icon={Hammer}
                  label="Plan · roadmaps and execution"
                  hint="3"
                  onSelect={() => go("/plan")}
                />
                <Item
                  icon={Hammer}
                  label="Build · sessions, changesets, gates"
                  hint="4"
                  onSelect={() => go("/build")}
                />
                <Item
                  icon={Brain}
                  label="Brain · memory, learnings, decisions, docs"
                  hint="5"
                  onSelect={() => go("/knowledge")}
                />
                <Item
                  icon={CalIcon}
                  label="Calendar · events & meetings"
                  onSelect={() => go("/knowledge", { tab: "calendar" })}
                />
                <Item icon={MessageCircle} label="Ask AI anything…" onSelect={() => go("/chat")} />
              </Command.Group>
              <Command.Group
                heading="Quick actions"
                className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground px-2 py-1.5"
              >
                <Item icon={Sparkles} label="Ask AI anything…" onSelect={() => go("/chat")} />
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      )}
    </>
  );
}

function Item({
  icon: Icon,
  label,
  hint,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-secondary aria-selected:text-foreground text-muted-foreground"
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {hint && (
        <kbd className="text-[10px] text-muted-foreground border hairline rounded px-1.5 py-0.5">
          {hint}
        </kbd>
      )}
    </Command.Item>
  );
}

// OBS-02 — the Obsidian keyboard map: `1`-`5` switch the five rail
// destinations (single press, no chord), `g` opens the Engine Room. This
// supersedes the legacy `g`-then-letter chord (its discovery role moves to
// the ⌘K palette, OBS-11). Esc-closes-overlay stays where it already lives
// (CommandPalette's own Escape handler above). Mount once at app root.
export function GotoShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (key >= "1" && key <= "5") {
        const item = PRIMARY_NAV[Number(key) - 1];
        if (item) {
          e.preventDefault();
          navigate({ to: item.to, search: item.search as never });
        }
        return;
      }
      if (key.toLowerCase() === "g") {
        e.preventDefault();
        navigate({ to: ENGINE_ROOM_DOOR.to });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
  return null;
}
