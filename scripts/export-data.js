#!/usr/bin/env node
// Export data from Oracle bot database to JSON for dashboard

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Paths
const BOT_DIR = path.join(__dirname, '../../oracle-bot');
const DB_PATH = path.join(BOT_DIR, 'oracle-data.json');
const OUTPUT_PATH = path.join(__dirname, '../data.json');

// STEP 1: Sync any missing tx_hashes from blockchain BEFORE loading data
console.log('🔄 Step 1: Syncing tx_hashes from blockchain...');
try {
  execSync('node sync-txhashes.js', { cwd: BOT_DIR, stdio: 'inherit' });
} catch (err) {
  console.log('⚠️  Sync warning (continuing anyway):', err.message);
}

// Load fixtures (include knockout matches)
const { ALL_MATCHES } = require(path.join(BOT_DIR, 'fixtures.js'));

// STEP 2: Load database (now with synced tx_hashes)
console.log('\n📦 Step 2: Loading database...');
let dbData = { predictions: {} };
if (fs.existsSync(DB_PATH)) {
  try {
    dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    console.error('Failed to load database:', err.message);
  }
}

// Get all predictions
const predictions = Object.values(dbData.predictions);

// Calculate stats
const total = predictions.length;
const resolved = predictions.filter(p => p.resolved).length;
const correct = predictions.filter(p => p.correct).length;
const exactScores = predictions.filter(p => p.exact_score).length;
const onChain = predictions.filter(p => p.tx_hash).length;

// Format matches for frontend (group stage + knockout)
// Filter out TBD matches (future knockouts with no teams yet)
const matches = ALL_MATCHES
  .filter(m => m.home !== 'TBD' && m.away !== 'TBD')
  .map(m => ({
    id: m.id,
    date: m.date,
    time: m.time,
    group: m.group,
    home: m.home,
    away: m.away,
    venue: m.venue,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore
  }));

// Build output
const output = {
  generated: new Date().toISOString(),
  stats: {
    total,
    resolved,
    correct,
    exactScores,
    onChain,
    accuracy: resolved > 0 ? Math.round((correct / resolved) * 100) : 0
  },
  // Filter out TBD predictions (placeholder data)
  predictions: predictions
    .filter(p => p.home_team !== 'TBD' && p.away_team !== 'TBD')
    .map(p => ({
      match_id: p.match_id,
      home_team: p.home_team,
      away_team: p.away_team,
      predicted_winner: p.predicted_winner,
      predicted_score_a: p.predicted_score_a,
      predicted_score_b: p.predicted_score_b,
      confidence: p.confidence,
      tx_hash: p.tx_hash,
      resolved: !!p.resolved,
      actual_score_a: p.actual_score_a,
      actual_score_b: p.actual_score_b,
      correct: !!p.correct,
      exact_score: !!p.exact_score,
      created_at: p.created_at
    })),
  matches
};

// Write output
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(`✅ Exported ${total} predictions to ${OUTPUT_PATH}`);
console.log(`   📊 Stats: ${correct}/${resolved} correct (${output.stats.accuracy}%), ${exactScores} exact, ${onChain} on-chain`);
