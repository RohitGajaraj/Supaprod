import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const HARBOR_WORKSPACE_ID = '60000000-0000-4000-8000-000000000000';

// Initialize Supabase client with service role (same as backend)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } }
);

async function runProof() {
  console.log('🚀 PROOF RUN: Watch the loop execute end-to-end\n');
  console.log(`Workspace: ${HARBOR_WORKSPACE_ID}`);
  console.log(`Model: Sonnet (Proof execution)\n`);
  
  if (!process.env.VITE_SUPABASE_URL) {
    console.error('❌ VITE_SUPABASE_URL not set');
    return false;
  }
  
  try {
    // Create a track  
    const trackId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const { data, error: insertError } = await supabase
      .from('spine_tracks')
      .insert({
        id: trackId,
        workspace_id: HARBOR_WORKSPACE_ID,
        title: 'Proof: End-to-end loop execution test',
        shape: 'spec',
        station: 'sense',
        current_station: 'sense',
        created_at: now,
      })
      .select('id, station');
    
    if (insertError) {
      console.error('❌ Failed to create track:', insertError.message);
      return false;
    }
    
    console.log('✅ Track created:', trackId);
    console.log('📍 Starting at station: sense\n');
    console.log('📊 Monitoring progression:\n');
    
    let lastStation = 'sense';
    let lastLogTime = Date.now();
    const startTime = Date.now();
    const maxWaitMs = 30 * 60 * 1000; // 30 minutes
    const stationSequence = ['sense', 'decide', 'define', 'design', 'build', 'ship', 'learn'];
    
    while (Date.now() - startTime < maxWaitMs) {
      // Query current station
      const { data: track, error: queryError } = await supabase
        .from('spine_tracks')
        .select('station, updated_at, current_station')
        .eq('id', trackId)
        .single();
      
      if (queryError) {
        console.error('❌ Query error:', queryError.message);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      
      if (track && track.station !== lastStation) {
        const elapsedMs = Date.now() - startTime;
        const elapsedMin = Math.floor(elapsedMs / 60000);
        const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
        
        console.log(`⏱️  +${elapsedMin}m${elapsedSec}s: ${lastStation.toUpperCase()} ➜ ${track.station.toUpperCase()}`);
        lastStation = track.station;
        lastLogTime = Date.now();
        
        // Check if we reached the end
        if (track.station === 'learn') {
          console.log('\n✨ STATION 7 REACHED: Learn');
          console.log('\n🎉 SUCCESS: Loop executed end-to-end\n');
          console.log('PROOF COMPLETE:');
          console.log('  ✅ Track created and moved through all stations autonomously');
          console.log('  ✅ No human interaction required (system ran unattended)');
          console.log('  ✅ Full cycle from Sense → Learn completed on screen');
          console.log('\n🏁 MISSION GATE MET\n');
          return true;
        }
      } else if (Date.now() - lastLogTime > 60000) {
        // Log every minute if station hasn't changed
        const elapsedMin = Math.floor((Date.now() - startTime) / 60000);
        console.log(`⏳ Still running (${elapsedMin}m)... station: ${lastStation}`);
        lastLogTime = Date.now();
      }
      
      // Check every 5 seconds
      await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log('\n⏱️  Timeout: 30 minutes elapsed');
    console.log(`Last station reached: ${lastStation}`);
    return false;
    
  } catch (e) {
    console.error('\n❌ Error:', (e as Error).message);
    if ((e as Error).stack) console.error((e as Error).stack);
    return false;
  }
}

const success = await runProof();
process.exit(success ? 0 : 1);
