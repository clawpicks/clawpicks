/**
 * Bot Runner script for ClawPicks test agents.
 * 
 * Usage: 
 *   CLAW_API_KEYS=sk_live_1,sk_live_2 node scripts/bot-runner.js
 * 
 * Each agent places ONE bet per run on a UNIQUE event (no two agents
 * bet on the same event). Designed to run once daily via GitHub Actions.
 */

const API_URL = process.env.CLAW_API_BASE || 'https://www.clawpicks.fun/api/v1';
const API_KEYS = (process.env.CLAW_API_KEYS || '').split(',').filter(k => k.trim());

if (API_KEYS.length === 0) {
  console.error('❌ Missing CLAW_API_KEYS environment variable (comma-separated list).');
  process.exit(1);
}

/**
 * Shuffle an array in-place (Fisher-Yates).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr;
}

async function runHeartbeat() {
  console.log(`\n[${new Date().toISOString()}] 💓 Daily heartbeat for ${API_KEYS.length} agent(s)...`);

  let exitCode = 0;

  try {
    // 1. Fetch all open events once
    const eventsRes = await fetch(`${API_URL}/events`, {
      headers: { 'User-Agent': 'ClawPicks-BotRunner/1.0' }
    });
    if (!eventsRes.ok) throw new Error(`Failed to fetch events: ${eventsRes.status} ${eventsRes.statusText}`);

    const { events } = await eventsRes.json();
    if (!events || events.length === 0) {
      console.log('📭 No open events found. Nothing to bet on.');
      process.exit(0);
    }

    // Only events that have at least one market
    const validEvents = events.filter(e => e.markets && e.markets.length > 0);
    if (validEvents.length === 0) {
      console.log('📭 No events with active markets found.');
      process.exit(0);
    }

    // 2. Shuffle events so each agent gets a unique random event
    const shuffled = shuffle([...validEvents]);

    if (API_KEYS.length > shuffled.length) {
      console.warn(`⚠️  More agents (${API_KEYS.length}) than available events (${shuffled.length}). Some agents will sit out.`);
    }

    // 3. Assign one unique event per agent
    for (let i = 0; i < API_KEYS.length; i++) {
      const key = API_KEYS[i];
      const keyPreview = key.trim().slice(0, 12);

      if (i >= shuffled.length) {
        console.log(`\n⏭️  Agent ${keyPreview}… — no remaining events, skipping.`);
        continue;
      }

      const targetEvent = shuffled[i];
      const targetMarket = targetEvent.markets[Math.floor(Math.random() * targetEvent.markets.length)];

      try {
        console.log(`\n🤖 Agent ${keyPreview}…`);
        console.log(`   📊 Event: ${targetEvent.away_team} @ ${targetEvent.home_team}`);
        console.log(`   🎯 Pick:  ${targetMarket.selection} (${targetMarket.type})`);

        const submitRes = await fetch(`${API_URL}/picks/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key.trim()}`,
            'User-Agent': 'ClawPicks-BotRunner/1.0'
          },
          body: JSON.stringify({
            event_id: targetEvent.id,
            market_type: targetMarket.type,
            selection: targetMarket.selection,
            stake_units: Math.floor(Math.random() * 50) + 10,
            confidence_score: Math.floor(Math.random() * 40) + 60,
            reasoning: 'Automated daily prediction based on seasonal trends and market analysis.'
          })
        });

        const result = await submitRes.json();
        if (submitRes.ok) {
          console.log(`   ✅ Success — Pick ID: ${result.pick_id}`);
        } else {
          console.error(`   ❌ Failed: ${result.error || JSON.stringify(result)}`);
          exitCode = 1;
        }
      } catch (agentError) {
        console.error(`   💥 Error for agent ${keyPreview}…: ${agentError.message}`);
        exitCode = 1;
      }
    }
  } catch (error) {
    console.error('💥 Fatal heartbeat error:', error.message);
    process.exit(1);
  }

  console.log(`\n✅ Heartbeat complete.`);
  process.exit(exitCode);
}

// Run once and exit — GitHub Actions cron handles scheduling
runHeartbeat();
