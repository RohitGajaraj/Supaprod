import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { AgentPresenceCard } from './AgentPresenceCard';
import type { Database } from '@/integrations/supabase/types';

type AgentRun = Database['public']['Tables']['agent_runs']['Row'];

describe('AgentPresenceCard', () => {
  const mockAgentRun: AgentRun = {
    id: '1',
    track_id: 'track-1',
    mission_id: 'mission-1',
    agent_name: 'Claude',
    model: 'claude-opus-4',
    status: 'in_progress',
    metadata: {
      confidence: 'high',
      action: 'planning',
      reasoning: 'user specified high priority',
    },
    result: {
      decision: 'Break down the task into three phases with clear acceptance criteria',
    },
    created_at: new Date(Date.now() - 5000).toISOString(),
    updated_at: new Date().toISOString(),
    tool_name: null,
    tool_result: null,
  };

  it('renders no activity state when no agent run', () => {
    render(AgentPresenceCard, { props: {} });
    expect(screen.getByText(/No agent activity yet/i)).toBeTruthy();
  });

  it('displays agent name and model', () => {
    render(AgentPresenceCard, {
      props: { agentRun: mockAgentRun, station: 'Decide' },
    });

    expect(screen.getByText('Claude')).toBeTruthy();
    expect(screen.getByText('claude-opus-4')).toBeTruthy();
  });

  it('displays station name', () => {
    render(AgentPresenceCard, {
      props: { agentRun: mockAgentRun, station: 'Design' },
    });

    expect(screen.getByText('Design')).toBeTruthy();
  });

  it('displays decision text from result', () => {
    render(AgentPresenceCard, {
      props: { agentRun: mockAgentRun, station: 'Decide' },
    });

    expect(screen.getByText(/Break down the task/i)).toBeTruthy();
  });

  it('truncates long decisions to 150 chars', () => {
    const longDecision = 'a'.repeat(200);
    const runWithLongDecision: AgentRun = {
      ...mockAgentRun,
      result: { decision: longDecision },
    };

    render(AgentPresenceCard, {
      props: { agentRun: runWithLongDecision, station: 'Decide' },
    });

    const text = screen.getByText(/^a+…$/);
    expect(text.textContent?.length).toBeLessThanOrEqual(152);
  });

  it('displays confidence tier', () => {
    render(AgentPresenceCard, {
      props: { agentRun: mockAgentRun, station: 'Decide' },
    });

    expect(screen.getByText(/High confidence/i)).toBeTruthy();
  });

  it('shows working indicator when isWorking is true', () => {
    render(AgentPresenceCard, {
      props: { agentRun: mockAgentRun, station: 'Decide', isWorking: true },
    });

    expect(screen.getByText(/Deciding…/i)).toBeTruthy();
  });

  it('displays readable time ago format', () => {
    render(AgentPresenceCard, {
      props: { agentRun: mockAgentRun, station: 'Decide' },
    });

    const timeElements = screen.getAllByText(/ago/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('handles different confidence levels', () => {
    const confidenceLevels = ['low', 'medium', 'high'];

    for (const level of confidenceLevels) {
      const run: AgentRun = {
        ...mockAgentRun,
        metadata: { confidence: level },
      };

      render(AgentPresenceCard, {
        props: { agentRun: run, station: 'Decide' },
      });

      const expectedLabel = `${level.charAt(0).toUpperCase()}${level.slice(1)} confidence`;
      expect(screen.getByText(new RegExp(expectedLabel, 'i'))).toBeTruthy();
    }
  });

  it('defaults to medium confidence if not specified', () => {
    const run: AgentRun = {
      ...mockAgentRun,
      metadata: {},
    };

    render(AgentPresenceCard, {
      props: { agentRun: run, station: 'Decide' },
    });

    expect(screen.getByText(/Medium confidence/i)).toBeTruthy();
  });

  it('uses provided agent name', () => {
    const runWithCustomName: AgentRun = {
      ...mockAgentRun,
      agent_name: 'Research Agent',
    };

    render(AgentPresenceCard, {
      props: { agentRun: runWithCustomName, station: 'Discover' },
    });

    expect(screen.getByText('Research Agent')).toBeTruthy();
  });

  it('shows default agent name if not provided', () => {
    const runNoName: AgentRun = {
      ...mockAgentRun,
      agent_name: null,
    };

    render(AgentPresenceCard, {
      props: { agentRun: runNoName, station: 'Discover' },
    });

    expect(screen.getByText('Agent')).toBeTruthy();
  });
});
