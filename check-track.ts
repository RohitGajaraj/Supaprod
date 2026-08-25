import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function main() {
  try {
    // Query the track that was stuck
    const { data: track, error: trackErr } = await supabase
      .from('spine_tracks')
      .select('id, station, last_hold, attempts')
      .eq('workspace_id', '60000000-0000-4000-8000-000000000000')
      .eq('station', 'define')
      .eq('last_hold', 'produced-nothing')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (trackErr && trackErr.code !== 'PGRST116') {
      console.error('Error querying track:', trackErr.message);
      process.exit(1);
    }

    if (!track) {
      console.log('No stuck track found');
      process.exit(0);
    }

    console.log('Found stuck track:', track.id);
    console.log('Station:', track.station, 'Hold:', track.last_hold, 'Attempts:', track.attempts);

    // Check for track members (artifacts)
    const { data: members } = await supabase
      .from('spine_track_members')
      .select('artifact_kind, station')
      .eq('track_id', track.id)
      .eq('station', 'define');

    console.log('\nArtifacts at define station:', members?.length ?? 0);
    if (members?.length) {
      members.forEach(m => console.log(`  - ${m.artifact_kind}`));
    }

    // Check for agent runs at define
    const { data: runs } = await supabase
      .from('agent_runs')
      .select('agent_slug, status, step_count, halt_reason, created_at')
      .eq('track_id', track.id)
      .order('created_at', { ascending: false });

    console.log('\nAgent runs for this track:');
    runs?.forEach(r => {
      console.log(`  ${r.agent_slug}: ${r.status} (${r.step_count} steps)${r.halt_reason ? ' - ' + r.halt_reason : ''}`);
    });

  } catch (err) {
    console.error('Exception:', err);
    process.exit(1);
  }
}

await main();
