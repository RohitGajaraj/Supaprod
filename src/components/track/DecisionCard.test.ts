import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { DecisionCard } from './DecisionCard';
import type { Database } from '@/integrations/supabase/types';

type Decision = Database['public']['Tables']['decisions']['Row'];
type Learning = Database['public']['Tables']['learnings']['Row'];

describe('DecisionCard', () => {
  const mockDecision: Decision = {
    id: '1',
    track_id: 'track-1',
    mission_id: 'mission-1',
    forecast_claim: 'Market will adopt this feature within Q4 2026',
    forecast_horizon_date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockLearning: Learning = {
    id: '1',
    track_id: 'track-1',
    decision_id: '1',
    verdict: 'correct - feature adoption exceeded 40% in Q4',
    metadata: {
      confidence: 0.85,
      sampleSize: 150,
      resolvedBy: 'agent',
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders no decision state when no decision provided', () => {
    render(DecisionCard, { props: {} });
    expect(screen.getByText(/No decision recorded yet/i)).toBeTruthy();
  });

  it('displays pending state when decision has no learning yet', () => {
    render(DecisionCard, { props: { decision: mockDecision } });

    expect(screen.getByText(/PENDING/)).toBeTruthy();
    expect(screen.getByText(/Waiting for the horizon date/i)).toBeTruthy();
  });

  it('displays predicted forecast claim and date', () => {
    render(DecisionCard, { props: { decision: mockDecision } });

    expect(screen.getByText(/Market will adopt this feature/)).toBeTruthy();
    expect(screen.getByText(/PREDICTED/)).toBeTruthy();
  });

  it('displays verdict as RIGHT when learning contains correct', () => {
    render(DecisionCard, {
      props: { decision: mockDecision, learning: mockLearning },
    });

    expect(screen.getByText(/RIGHT/)).toBeTruthy();
  });

  it('displays verdict as WRONG when learning indicates incorrect', () => {
    const wrongLearning: Learning = {
      ...mockLearning,
      verdict: 'wrong - adoption only reached 12%',
    };

    render(DecisionCard, {
      props: { decision: mockDecision, learning: wrongLearning },
    });

    expect(screen.getByText(/WRONG/)).toBeTruthy();
  });

  it('displays verdict as INCONCLUSIVE when learning is unclear', () => {
    const inconclusiveLearning: Learning = {
      ...mockLearning,
      verdict: 'inconclusive - data inconsistent across regions',
    };

    render(DecisionCard, {
      props: { decision: mockDecision, learning: inconclusiveLearning },
    });

    expect(screen.getByText(/INCONCLUSIVE/)).toBeTruthy();
  });

  it('displays actual outcome text from learning verdict', () => {
    render(DecisionCard, {
      props: { decision: mockDecision, learning: mockLearning },
    });

    expect(screen.getByText(/feature adoption exceeded/i)).toBeTruthy();
    expect(screen.getByText(/ACTUAL/)).toBeTruthy();
  });

  it('displays confidence percentage when present in metadata', () => {
    render(DecisionCard, {
      props: { decision: mockDecision, learning: mockLearning },
    });

    expect(screen.getByText(/85%/)).toBeTruthy();
    expect(screen.getByText(/Confidence/)).toBeTruthy();
  });

  it('displays sample size when present in metadata', () => {
    render(DecisionCard, {
      props: { decision: mockDecision, learning: mockLearning },
    });

    expect(screen.getByText(/150/)).toBeTruthy();
    expect(screen.getByText(/Sample size/)).toBeTruthy();
  });

  it('shows auto-graded indicator when resolvedBy is agent', () => {
    render(DecisionCard, {
      props: { decision: mockDecision, learning: mockLearning },
    });

    expect(screen.getByText(/auto-graded/i)).toBeTruthy();
  });

  it('shows human resolution indicator when resolvedBy is human', () => {
    const humanLearning: Learning = {
      ...mockLearning,
      metadata: {
        ...mockLearning.metadata,
        resolvedBy: 'human',
      },
    };

    render(DecisionCard, {
      props: { decision: mockDecision, learning: humanLearning },
    });

    // Should not show auto-graded, but the component handles this gracefully
    expect(screen.queryByText(/auto-graded/i)).toBeFalsy();
  });

  it('hides verdict badge when showResolution is false', () => {
    render(DecisionCard, {
      props: {
        decision: mockDecision,
        learning: mockLearning,
        showResolution: false,
      },
    });

    expect(screen.queryByText(/RIGHT/)).toBeFalsy();
  });

  it('displays learning message when resolution is complete', () => {
    render(DecisionCard, {
      props: { decision: mockDecision, learning: mockLearning },
    });

    expect(screen.getByText(/This is how you learn/i)).toBeTruthy();
  });

  it('handles decision with no confidence gracefully', () => {
    const minimumLearning: Learning = {
      ...mockLearning,
      metadata: {},
    };

    render(DecisionCard, {
      props: { decision: mockDecision, learning: minimumLearning },
    });

    // Should still render without confidence display
    expect(screen.getByText(/RIGHT/)).toBeTruthy();
    expect(screen.queryByText(/Confidence/)).toBeFalsy();
  });

  it('handles learning with null metadata gracefully', () => {
    const nullMetadataLearning: Learning = {
      ...mockLearning,
      metadata: null,
    };

    render(DecisionCard, {
      props: { decision: mockDecision, learning: nullMetadataLearning },
    });

    expect(screen.getByText(/RIGHT/)).toBeTruthy();
  });

  it('displays verdict when forecast claim is missing', () => {
    const minimalDecision: Decision = {
      ...mockDecision,
      forecast_claim: null,
    };

    render(DecisionCard, {
      props: { decision: minimalDecision, learning: mockLearning },
    });

    expect(screen.getByText(/No forecast recorded/i)).toBeTruthy();
  });

  it('displays horizon date when set', () => {
    const horizonDate = new Date(2026, 11, 31).toISOString(); // Dec 31, 2026
    const decisionWithHorizon: Decision = {
      ...mockDecision,
      forecast_horizon_date: horizonDate,
    };

    render(DecisionCard, {
      props: { decision: decisionWithHorizon },
    });

    // Should display some date format
    expect(screen.getByText(/By:/)).toBeTruthy();
  });

  it('shows default text when horizon date is missing', () => {
    const noHorizonDecision: Decision = {
      ...mockDecision,
      forecast_horizon_date: null,
    };

    render(DecisionCard, {
      props: { decision: noHorizonDecision },
    });

    expect(screen.getByText(/No horizon set/)).toBeTruthy();
  });
});
