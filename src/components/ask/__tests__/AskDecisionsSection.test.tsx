import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { AskDecisionsSection } from '../AskDecisionsSection';
import type { Database } from '@/integrations/supabase/types';

type Decision = Database['public']['Tables']['decisions']['Row'];
type Learning = Database['public']['Tables']['learnings']['Row'];
type DecisionWithLearning = {
  decision: Decision;
  learning: Learning | null;
};

describe('AskDecisionsSection', () => {
  const mockDecision: Decision = {
    id: 'dec-1',
    track_id: 'track-1',
    mission_id: 'mission-1',
    forecast_claim: 'Feature will increase adoption by 25%',
    forecast_horizon_date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: '',
    rationale: null,
    status: 'approved',
    source_kind: 'agent',
    meeting_id: null,
    prd_id: null,
    decided_by_agent_slug: null,
    snapshot_before: null,
  };

  const mockLearning: Learning = {
    id: 'learn-1',
    decision_id: 'dec-1',
    track_id: 'track-1',
    verdict: 'correct - adoption increased 28%',
    metadata: { confidence: 0.87, sampleSize: 2000, resolvedBy: 'agent' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('returns null when decisions array is empty', () => {
    const { container } = render(AskDecisionsSection, {
      props: { decisions: [] },
    });

    expect(container.innerHTML).toBe('');
  });

  it('renders decisions section title', () => {
    const decisions: DecisionWithLearning[] = [{ decision: mockDecision, learning: mockLearning }];

    render(AskDecisionsSection, { props: { decisions } });

    expect(screen.getByText(/Decisions & Outcomes/i)).toBeTruthy();
  });

  it('displays custom title when provided', () => {
    const decisions: DecisionWithLearning[] = [{ decision: mockDecision, learning: mockLearning }];

    render(AskDecisionsSection, {
      props: { decisions, title: 'Forecast Review' },
    });

    expect(screen.getByText(/Forecast Review/i)).toBeTruthy();
  });

  it('renders multiple decision cards', () => {
    const decisions: DecisionWithLearning[] = [
      {
        decision: mockDecision,
        learning: mockLearning,
      },
      {
        decision: { ...mockDecision, id: 'dec-2', forecast_claim: 'API latency < 100ms' },
        learning: null,
      },
    ];

    render(AskDecisionsSection, { props: { decisions } });

    expect(screen.getByText(/Feature will increase adoption/)).toBeTruthy();
    expect(screen.getByText(/API latency < 100ms/)).toBeTruthy();
  });

  it('displays resolution count', () => {
    const decisions: DecisionWithLearning[] = [
      { decision: mockDecision, learning: mockLearning },
      {
        decision: { ...mockDecision, id: 'dec-2', forecast_claim: 'Second forecast' },
        learning: null,
      },
      {
        decision: { ...mockDecision, id: 'dec-3', forecast_claim: 'Third forecast' },
        learning: mockLearning,
      },
    ];

    render(AskDecisionsSection, { props: { decisions } });

    // 2 resolved out of 3 total
    expect(screen.getByText(/2 of 3 resolved/)).toBeTruthy();
  });

  it('hides resolution badge when showResolution is false', () => {
    const decisions: DecisionWithLearning[] = [{ decision: mockDecision, learning: mockLearning }];

    render(AskDecisionsSection, {
      props: { decisions, showResolution: false },
    });

    expect(screen.queryByText(/RIGHT/)).toBeFalsy();
  });

  it('shows all decisions even with no learnings', () => {
    const decisions: DecisionWithLearning[] = [
      { decision: mockDecision, learning: null },
      {
        decision: { ...mockDecision, id: 'dec-2', forecast_claim: 'Future forecast' },
        learning: null,
      },
    ];

    render(AskDecisionsSection, { props: { decisions } });

    expect(screen.getByText(/0 of 2 resolved/)).toBeTruthy();
  });
});
