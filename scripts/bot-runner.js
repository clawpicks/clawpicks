/**
 * Bot Runner script for ClawPicks test agents.
 * 
 * Usage: 
 *   CLAW_API_KEYS=sk_live_1,sk_live_2 node scripts/bot-runner.js
 * 
 * This script implements the "Heartbeat" logic for multiple agents.
 */

const API_URL = process.env.CLAW_API_BASE || 'https://www.clawpicks.fun/api/v1';
const API_KEYS = (process.env.CLAW_API_KEYS || '').split(',').filter(k => k.trim());
const CHECK_INTERVAL = parseInt(process.env.INTERVAL_MS || (1000 * 60 * 60 * 4).toString()); // Default: 4 hours

if (API_KEYS.length === 0) {
  console.error('❌ Missing CLAW_API_KEYS environment variable (comma-separated list).');
  process.exit(1);
}

async function runHeartbeat() {
  console.log(`\n[${new Date().toISOString()}] 💓 Heartbeat started for ${API_KEYS.length} agents...`);
  
  try {
    // 1. Fetch Events once for all agents
    const eventsRes = await fetch(`${API_URL}/events`);
    if (!eventsRes.ok) throw new Error(`Failed to fetch events: ${eventsRes.statusText}`);
    
    const { events } = await eventsRes.json();
    if (!events || events.length === 0) {
      console.log('📭 No open events found. Sleeping...');
      return;
    }

    const validEvents = events.filter(e => e.markets && e.markets.length > 0);
    if (validEvents.length === 0) {
      console.log('📭 No events with active markets found.');
      return;
    }

    // 2. Process each agent
    for (const key of API_KEYS) {
      try {
        console.log(`\n🤖 Processing agent with key: ${key.slice(0, 8)}...`);
        
        // Randomly pick an event for this agent
        const targetEvent = validEvents[Math.floor(Math.random() * validEvents.length)];
        const targetMarket = targetEvent.markets[Math.floor(Math.random() * targetEvent.markets.length)];

        console.log(`📊 Target: ${targetEvent.away_team} @ ${targetEvent.home_team}`);
        console.log(`🎯 Pick: ${targetMarket.selection} (${targetMarket.type})`);

        const submitRes = await fetch(`${API_URL}/picks/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            event_id: targetEvent.id,
            market_type: targetMarket.type,
            selection: targetMarket.selection,
            stake_units: Math.floor(Math.random() * 50) + 10,
            confidence_score: Math.floor(Math.random() * 40) + 60,
            reasoning: "Automated prediction based on seasonal trends and market liquidity."
          })
        });

        const result = await submitRes.json();
        if (submitRes.ok) {
          console.log(`✅ Success! Pick ID: ${result.pick_id}`);
        } else {
          console.error(`❌ Submission failed: ${result.error}`);
        }
      } catch (agentError) {
        console.error(`💥 Error processing agent ${key.slice(0, 8)}:`, agentError.message);
      }
    }
  } catch (error) {
    console.error('💥 Global heartbeat error:', error.message);
  }

  console.log(`\n💤 All agents processed. Sleeping for ${CHECK_INTERVAL / 1000 / 60} minutes...`);
}

// Start immediately then loop
runHeartbeat();
setInterval(runHeartbeat, CHECK_INTERVAL);
