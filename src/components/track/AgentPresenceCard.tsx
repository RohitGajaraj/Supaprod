/**
 * Agent Presence Card — Show who is working and what they decided
 *
 * Displays the current agent (Claude, model), what station they're at,
 * and their decision or action in readable English.
 *
 * Goal: "I know what the agent believes and why it chose this path" (transparency)
 * User value: Not a black box — see exactly what the agent decided
 */

import { useEffect, useState } from 'react';
import type { Database } from '@/integrations/supabase/types';

type AgentRun = Database['public']['Tables']['agent_runs']['Row'];

interface AgentPresence {
  agentName: string;
  model: string;
  station: string;
  decision: string;
  confidence?: 'low' | 'medium' | 'high';
  timestamp: string;
}

const CONFIDENCE_COLORS = {
  low: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
};

const CONFIDENCE_LABELS = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
};

interface AgentPresenceCardProps {
  agentRun?: AgentRun;
  station?: string;
  isWorking?: boolean;
}

export function AgentPresenceCard({
  agentRun,
  station = 'working',
  isWorking = false,
}: AgentPresenceCardProps) {
  const [presence, setPresence] = useState<AgentPresence | null>(null);

  useEffect(() => {
    if (!agentRun) {
      setPresence(null);
      return;
    }

    // Parse agent run metadata to extract decision/action
    const metadata = agentRun.metadata as Record<string, any> || {};
    const result = agentRun.result as Record<string, any> || {};

    // Human-readable decision description
    let decision = 'Working...';
    if (result.decision) {
      decision = String(result.decision).substring(0, 150);
      if (String(result.decision).length > 150) {
        decision += '…';
      }
    } else if (metadata.action) {
      decision = `${metadata.action}: ${metadata.reasoning || 'proceeding'}`;
    }

    // Extract confidence tier
    const confidence = (metadata.confidence || 'medium') as 'low' | 'medium' | 'high';

    // Model from run metadata
    const model = agentRun.model || 'Claude';
    const agentName = agentRun.agent_name || 'Agent';

    const createdAt = new Date(agentRun.created_at);
    const now = new Date();
    const elapsed = Math.max(0, (now.getTime() - createdAt.getTime()) / 1000);

    let timeString: string;
    if (elapsed < 60) {
      timeString = `${Math.round(elapsed)}s ago`;
    } else if (elapsed < 3600) {
      timeString = `${Math.round(elapsed / 60)}m ago`;
    } else {
      timeString = `${Math.round(elapsed / 3600)}h ago`;
    }

    setPresence({
      agentName,
      model,
      station,
      decision,
      confidence,
      timestamp: timeString,
    });
  }, [agentRun, station]);

  if (!presence) {
    return (
      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
        <p className="text-sm text-zinc-500">No agent activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Agent header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">{presence.agentName}</h3>
          <p className="text-xs text-zinc-400">{presence.model}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">{presence.station}</p>
          <p className="text-xs text-zinc-500">{presence.timestamp}</p>
        </div>
      </div>

      {/* Decision/action card */}
      <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/50 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isWorking && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-xs text-blue-400">Deciding…</span>
              </div>
            )}
            <p className="text-sm text-white leading-relaxed">{presence.decision}</p>
          </div>
        </div>

        {/* Confidence tier */}
        {presence.confidence && (
          <div className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${CONFIDENCE_COLORS[presence.confidence]}`}>
            {CONFIDENCE_LABELS[presence.confidence]}
          </div>
        )}
      </div>

      {/* Key message */}
      <p className="text-xs text-zinc-500 px-1">
        This is what the agent decided to do. You're watching it work in real-time.
      </p>
    </div>
  );
}
