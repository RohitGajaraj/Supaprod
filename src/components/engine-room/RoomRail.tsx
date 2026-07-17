import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOM_NAMES, ROOM_TAB_META, type RoomKey } from "@/lib/engine-room-glance";
import type { RoomStatus } from "./EngineRoomSurface";

const ROOM_ORDER: RoomKey[] = ["spend", "quality", "safety", "record"];

/** One rail item's shared interactive chrome: 32px control, quiet hover,
 * focus ring never removed. Active state carries the raised fill; the ember
 * accent is reserved for the active marker line (selection, per contract). */
function railItemClass(active: boolean): string {
  return cn(
    "relative flex w-full items-center gap-2 text-left cursor-pointer rounded-md outline-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]",
    active ? "[background-color:var(--raised)]" : "hover:[background-color:var(--raised)]",
  );
}

const railItemStyle: React.CSSProperties = {
  height: 32,
  padding: "0 10px",
  border: "none",
  background: "transparent",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-base)",
  transitionProperty: "background-color, color",
  transitionDuration: "var(--dur-control)",
  transitionTimingFunction: "var(--ease)",
};

/** The watch dot beside a room name: marigold on watch, madder when the
 * room's reads failed, invisible (layout-stable) when healthy/loading. */
function StateDot({ status }: { status?: RoomStatus }) {
  const failed = status?.error != null;
  const watch = status?.glance?.state === "watch";
  const label = failed ? "did not load" : watch ? "needs a look" : null;
  return (
    <span
      aria-hidden={label ? undefined : "true"}
      aria-label={label ?? undefined}
      role={label ? "img" : undefined}
      className="ml-auto shrink-0 rounded-full"
      style={{
        width: 6,
        height: 6,
        background: failed ? "var(--madder)" : watch ? "var(--marigold)" : "transparent",
      }}
    />
  );
}

export interface RoomRailProps {
  /** The active room, or none on the glance overview. */
  room?: RoomKey;
  /** The active (already normalized) view within the active room. */
  view?: string;
  rooms: RoomStatus[];
  onOverview: () => void;
  onSelect: (room: RoomKey, view: string) => void;
}

/**
 * IA 2026-07-11: the persistent vertical room switcher. Rooms as a left tab
 * rail with their view sub-tabs nested underneath (the Vercel
 * project-settings pattern), visible from the glance and from any room depth,
 * so switching rooms or views never requires backing out. Desktop renders the
 * vertical rail; under 768px the same model collapses to a horizontal room
 * strip (the active room's sub-tabs stay reachable through RoomDetail's
 * mobile tab bar).
 */
export function RoomRail({ room, view, rooms, onOverview, onSelect }: RoomRailProps) {
  const statusOf = (key: RoomKey) => rooms.find((r) => r.key === key);

  return (
    <>
      {/* Desktop: the vertical rail, sticky so it holds through long views. */}
      <nav
        aria-label="Engine Room rooms"
        className="hidden md:block"
        style={{
          position: "sticky",
          top: 24,
          alignSelf: "start",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          paddingRight: 8,
        }}
      >
        <button
          type="button"
          onClick={onOverview}
          aria-current={!room ? "page" : undefined}
          className={railItemClass(!room)}
          style={{
            ...railItemStyle,
            fontWeight: !room ? 600 : 500,
            color: !room ? "var(--text-primary)" : "var(--text-body)",
            marginBottom: 14,
          }}
        >
          Overview
        </button>

        <div className="flex flex-col" style={{ gap: 4 }}>
          {ROOM_ORDER.map((key) => {
            const status = statusOf(key);
            const tabs = ROOM_TAB_META[key];
            const isActiveRoom = room === key;
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(key, tabs[0]!.id)}
                  aria-expanded={isActiveRoom}
                  className={railItemClass(isActiveRoom)}
                  style={{
                    ...railItemStyle,
                    height: 30,
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-mono-floor)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isActiveRoom ? "var(--text-primary)" : "var(--text-subtle)",
                    marginBottom: isActiveRoom ? 2 : 0,
                  }}
                >
                  <ChevronRight
                    size={12}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0"
                    style={{
                      color: "var(--text-faint)",
                      transform: isActiveRoom ? "rotate(90deg)" : "none",
                      transitionProperty: "transform",
                      transitionDuration: "var(--dur-control)",
                      transitionTimingFunction: "var(--ease)",
                    }}
                  />
                  {ROOM_NAMES[key]}
                  <StateDot status={status} />
                </button>
                {/* Accordion (founder ruling 2026-07-13): only the OPEN room
                    shows its view sub-tabs; the other rooms collapse to their
                    header, so the rail never grows long enough to scroll. */}
                {isActiveRoom ? (
                  <div className="flex flex-col" style={{ gap: 1, marginBottom: 6 }}>
                    {tabs.map((t) => {
                      const active = view === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelect(key, t.id)}
                          aria-current={active ? "page" : undefined}
                          className={railItemClass(active)}
                          style={{
                            ...railItemStyle,
                            paddingLeft: 22,
                            color: active ? "var(--text-primary)" : "var(--text-muted)",
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          {/* Selection marker: the one ember touch on the rail. */}
                          <span
                            aria-hidden="true"
                            className="shrink-0 rounded-full"
                            style={{
                              width: 2,
                              height: 14,
                              background: active ? "var(--ember)" : "transparent",
                            }}
                          />
                          <span className="min-w-0 truncate">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile (<768): the same switcher as a horizontal room strip. View
          sub-tabs render inside RoomDetail's mobile tab bar. */}
      <nav
        aria-label="Engine Room rooms"
        className="flex flex-wrap md:hidden"
        style={{ gap: 6, marginBottom: 18 }}
      >
        {[
          { key: null as RoomKey | null, label: "Overview" },
          ...ROOM_ORDER.map((key) => ({ key: key as RoomKey | null, label: ROOM_NAMES[key] })),
        ].map(({ key, label }) => {
          const active = key === null ? !room : room === key;
          return (
            <button
              key={label}
              type="button"
              onClick={() =>
                key === null ? onOverview() : onSelect(key, ROOM_TAB_META[key][0]!.id)
              }
              aria-current={active ? "page" : undefined}
              className={cn(
                "cursor-pointer rounded-full outline-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]",
                // Pointer answer parity with the desktop rail: inactive pills
                // lift one surface step on hover; press dims (checklist 1/3).
                !active && "hover:[background-color:var(--raised)]",
                "active:opacity-80",
              )}
              style={{
                height: 32,
                padding: "0 12px",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-floor)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                background: active ? "var(--raised)" : "transparent",
                border: "1px solid var(--hairline)",
                transitionProperty: "background-color, color",
                transitionDuration: "var(--dur-control)",
                transitionTimingFunction: "var(--ease)",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
