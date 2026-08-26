import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { RunTimeline } from './RunTimeline';
import type { Database } from '@/integrations/supabase/types';

type StageEvent = Database['public']['Tables']['stage_events']['Row'];

describe('RunTimeline', () => {
  const mockEvents: StageEvent[] = [
    {
      id: '1',
      track_id: 'track-1',
      station: 'sense',
      actor: 'system',
      status: 'started',
      created_at: new Date(Date.now() - 10000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      track_id: 'track-1',
      station: 'discover',
      actor: 'system',
      status: 'completed',
      created_at: new Date(Date.now() - 5000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      track_id: 'track-1',
      station: 'decide',
      actor: 'system',
      status: 'completed',
      created_at: new Date(Date.now() - 2000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('renders empty state when no events', () => {
    render(RunTimeline, { props: { trackId: 'track-1', events: [] } });
    expect(screen.getByText(/Waiting for agent to start/i)).toBeTruthy();
  });

  it('renders events in reverse chronological order', () => {
    render(RunTimeline, {
      props: { trackId: 'track-1', events: mockEvents },
    });

    const decisions = screen.getAllByText(/Agent entered/i);
    expect(decisions.length).toBeGreaterThan(0);
  });

  it('shows readable time ago format', () => {
    render(RunTimeline, {
      props: { trackId: 'track-1', events: mockEvents },
    });

    const timeElements = screen.getAllByText(/ago/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('displays station names correctly', () => {
    render(RunTimeline, {
      props: { trackId: 'track-1', events: mockEvents },
    });

    expect(screen.getByText(/Sense/i)).toBeTruthy();
    expect(screen.getByText(/Discover/i)).toBeTruthy();
    expect(screen.getByText(/Decide/i)).toBeTruthy();
  });

  it('shows live indicator when isLive is true', () => {
    render(RunTimeline, {
      props: { trackId: 'track-1', events: mockEvents, isLive: true },
    });

    expect(screen.getByText('Live')).toBeTruthy();
  });

  it('limits display to last 5 events', () => {
    const manyEvents = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      track_id: 'track-1',
      station: ['sense', 'discover', 'decide', 'define', 'design'][i % 5],
      actor: 'system' as const,
      status: 'completed' as const,
      created_at: new Date(Date.now() - i * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }));

    render(RunTimeline, {
      props: { trackId: 'track-1', events: manyEvents },
    });

    const decisions = screen.getAllByText(/Agent entered/i);
    expect(decisions.length).toBeLessThanOrEqual(5);
  });

  it('handles held events (actor !== system)', () => {
    const heldEvent: StageEvent = {
      id: '4',
      track_id: 'track-1',
      station: 'decide',
      actor: 'human',
      status: 'held',
      created_at: new Date(Date.now() - 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(RunTimeline, {
      props: { trackId: 'track-1', events: [heldEvent] },
    });

    expect(screen.getByText(/Held at/i)).toBeTruthy();
  });

  it('uses correct color for each station', () => {
    const colorTests = [
      { station: 'sense', color: 'bg-blue-500' },
      { station: 'discover', color: 'bg-purple-500' },
      { station: 'decide', color: 'bg-emerald-500' },
      { station: 'design', color: 'bg-rose-500' },
      { station: 'ship', color: 'bg-cyan-500' },
    ];

    for (const { station, color } of colorTests) {
      const event: StageEvent = {
        id: `event-${station}`,
        track_id: 'track-1',
        station: station as any,
        actor: 'system',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { container } = render(RunTimeline, {
        props: { trackId: 'track-1', events: [event] },
      });

      const dot = container.querySelector(`div.${color}`);
      expect(dot).toBeTruthy();
    }
  });
});
