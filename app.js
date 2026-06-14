// Oracle of BOOE - Dashboard App
// Fetches prediction data and renders the UI

// Country code mapping for flag images (using flagcdn.com)
const COUNTRY_CODES = {
  'Mexico': 'mx', 'South Africa': 'za', 'Korea Republic': 'kr', 'Czechia': 'cz',
  'Canada': 'ca', 'Bosnia and Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', "Côte d'Ivoire": 'ci', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'IR Iran': 'ir', 'New Zealand': 'nz',
  'Spain': 'es', 'Cabo Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'Congo DR': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa',
};

// Get flag image HTML for team
function getFlag(team) {
  const code = COUNTRY_CODES[team] || 'xx';
  return '<img src="https://flagcdn.com/w40/' + code + '.png" alt="' + team + '" class="flag-img">';
}

// Get flag for prediction text (smaller)
function getFlagSmall(team) {
  const code = COUNTRY_CODES[team] || 'xx';
  return '<img src="https://flagcdn.com/w20/' + code + '.png" alt="' + team + '" class="flag-img-small">';
}

let allData = null;
let currentFilter = 'all';

// Format date nicely
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Get today's date in YYYY-MM-DD format
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Shorten tx hash
function shortenHash(hash) {
  if (!hash) return '';
  return hash.slice(0, 6) + '...' + hash.slice(-4);
}

// Render hero stats
function renderHeroStats(stats) {
  document.getElementById('totalPredictions').textContent = stats.total;
  document.getElementById('accuracy').textContent = stats.resolved > 0 
    ? Math.round((stats.correct / stats.resolved) * 100) + '%' 
    : '-';
  document.getElementById('exactScores').textContent = stats.exactScores;
  document.getElementById('onChain').textContent = stats.onChain;
}

// Render a single match card
function renderMatchCard(prediction, match) {
  const isResolved = prediction.resolved;
  const isCorrect = prediction.correct;
  const isExact = prediction.exact_score;
  
  let cardClass = 'match-card';
  if (isResolved) {
    cardClass += isCorrect ? ' correct' : ' wrong';
  }
  
  const homeFlag = getFlag(match.home);
  const awayFlag = getFlag(match.away);
  
  const outcomeText = prediction.predicted_winner === match.home 
    ? homeFlag + ' ' + match.home + ' Win'
    : prediction.predicted_winner === match.away
      ? awayFlag + ' ' + match.away + ' Win'
      : '🤝 Draw';
  
  let resultHtml = '';
  if (isResolved) {
    const resultClass = isCorrect ? '' : 'wrong-result';
    const resultIcon = isExact ? '🎯 EXACT!' : (isCorrect ? '✅ Correct' : '❌ Wrong');
    resultHtml = '<div class="match-result ' + resultClass + '"><span class="result-label">Final Score</span><span class="result-value">' + prediction.actual_score_a + ' - ' + prediction.actual_score_b + ' ' + resultIcon + '</span></div>';
  }
  
  return '<div class="' + cardClass + '"><div class="match-header"><span class="match-group">Group ' + match.group + '</span><span class="match-time">' + match.time + ' UTC</span></div><div class="match-teams"><div class="team"><span class="team-flag">' + homeFlag + '</span><span class="team-name">' + match.home + '</span></div><span class="match-vs">vs</span><div class="team"><span class="team-flag">' + awayFlag + '</span><span class="team-name">' + match.away + '</span></div></div><div class="match-prediction"><span class="prediction-label">Oracle Prediction</span><span class="prediction-value">' + outcomeText + '</span><span class="prediction-score">Bonus Score: ' + prediction.predicted_score_a + '-' + prediction.predicted_score_b + '</span></div>' + resultHtml + '<div class="match-footer">' + (prediction.tx_hash ? '<a href="https://basescan.org/tx/' + prediction.tx_hash + '" target="_blank" class="proof-link">⛓️ View On-Chain Proof</a>' : '<span class="proof-link">📝 Off-chain</span>') + '</div></div>';
}

// Render today's matches
function renderTodayMatches(data) {
  const container = document.getElementById('todayMatches');
  const dateEl = document.getElementById('todayDate');
  const today = getToday();
  
  dateEl.textContent = formatDate(today);
  
  const todayPredictions = data.predictions.filter(p => {
    const match = data.matches.find(m => m.id === p.match_id);
    return match && match.date === today;
  });
  
  if (todayPredictions.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p>No predictions for today yet. Check back later!</p></div>';
    return;
  }
  
  container.innerHTML = todayPredictions.map(p => {
    const match = data.matches.find(m => m.id === p.match_id);
    return renderMatchCard(p, match);
  }).join('');
}

// Render predictions table
function renderPredictionsTable(data, filter) {
  filter = filter || 'all';
  const tbody = document.getElementById('predictionsBody');
  
  let predictions = data.predictions.slice();
  
  if (filter === 'correct') {
    predictions = predictions.filter(p => p.resolved && p.correct);
  } else if (filter === 'wrong') {
    predictions = predictions.filter(p => p.resolved && !p.correct);
  } else if (filter === 'pending') {
    predictions = predictions.filter(p => !p.resolved);
  }
  
  predictions.sort((a, b) => {
    const matchA = data.matches.find(m => m.id === a.match_id);
    const matchB = data.matches.find(m => m.id === b.match_id);
    return new Date(matchB?.date || 0) - new Date(matchA?.date || 0);
  });
  
  if (predictions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><div class="empty-state-icon">🔮</div><p>No predictions match this filter.</p></td></tr>';
    return;
  }
  
  tbody.innerHTML = predictions.map(p => {
    const match = data.matches.find(m => m.id === p.match_id);
    if (!match) return '';
    
    const homeFlag = getFlagSmall(match.home);
    const awayFlag = getFlagSmall(match.away);
    const winnerFlag = p.predicted_winner === match.home ? getFlagSmall(match.home) : p.predicted_winner === match.away ? getFlagSmall(match.away) : '🤝';
    
    const outcomeText = p.predicted_winner === match.home ? match.home : p.predicted_winner === match.away ? match.away : 'Draw';
    
    let resultBadge = '<span class="table-result pending">⏳ Pending</span>';
    if (p.resolved) {
      if (p.exact_score) {
        resultBadge = '<span class="table-result exact">🎯 Exact!</span>';
      } else if (p.correct) {
        resultBadge = '<span class="table-result correct">✅ Correct</span>';
      } else {
        resultBadge = '<span class="table-result wrong">❌ Wrong</span>';
      }
    }
    
    const actualScore = p.resolved ? p.actual_score_a + '-' + p.actual_score_b : '-';
    
    return '<tr><td><div class="table-match"><span class="table-flag">' + homeFlag + '</span><span class="table-teams">' + match.home + ' vs ' + match.away + '</span><span class="table-flag">' + awayFlag + '</span></div></td><td class="table-prediction">' + winnerFlag + ' ' + outcomeText + '</td><td class="table-score">' + p.predicted_score_a + '-' + p.predicted_score_b + (p.resolved ? ' (' + actualScore + ')' : '') + '</td><td>' + resultBadge + '</td><td>' + (p.tx_hash ? '<a href="https://basescan.org/tx/' + p.tx_hash + '" target="_blank" class="table-proof">' + shortenHash(p.tx_hash) + '</a>' : '-') + '</td></tr>';
  }).join('');
}

// Render stats section
function renderStats(data) {
  const stats = data.stats;
  const accuracy = stats.resolved > 0 ? Math.round((stats.correct / stats.resolved) * 100) : 0;
  
  document.getElementById('statAccuracy').textContent = accuracy + '%';
  document.getElementById('statCorrect').textContent = stats.correct + '/' + stats.resolved;
  document.getElementById('statExact').textContent = stats.exactScores;
  document.getElementById('statOnChain').textContent = stats.onChain;
  
  setTimeout(function() {
    document.getElementById('accuracyBar').style.width = accuracy + '%';
  }, 300);
  
  const homeWins = data.predictions.filter(p => p.resolved && p.predicted_winner === data.matches.find(m => m.id === p.match_id)?.home);
  const awayWins = data.predictions.filter(p => p.resolved && p.predicted_winner === data.matches.find(m => m.id === p.match_id)?.away);
  const draws = data.predictions.filter(p => p.resolved && p.predicted_winner === 'Draw');
  
  const homeCorrect = homeWins.filter(p => p.correct).length;
  const awayCorrect = awayWins.filter(p => p.correct).length;
  const drawsCorrect = draws.filter(p => p.correct).length;
  
  const homePct = homeWins.length > 0 ? Math.round((homeCorrect / homeWins.length) * 100) : 0;
  const awayPct = awayWins.length > 0 ? Math.round((awayCorrect / awayWins.length) * 100) : 0;
  const drawPct = draws.length > 0 ? Math.round((drawsCorrect / draws.length) * 100) : 0;
  
  document.getElementById('homeWinPct').textContent = homeCorrect + '/' + homeWins.length + ' (' + homePct + '%)';
  document.getElementById('awayWinPct').textContent = awayCorrect + '/' + awayWins.length + ' (' + awayPct + '%)';
  document.getElementById('drawPct').textContent = drawsCorrect + '/' + draws.length + ' (' + drawPct + '%)';
  
  setTimeout(function() {
    document.getElementById('homeWinBar').style.width = homePct + '%';
    document.getElementById('awayWinBar').style.width = awayPct + '%';
    document.getElementById('drawBar').style.width = drawPct + '%';
  }, 500);
}

// Setup filter tabs
function setupFilters() {
  var tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      if (allData) {
        renderPredictionsTable(allData, currentFilter);
      }
    });
  });
}

// Load data and render
async function loadData() {
  try {
    const response = await fetch('data.json?t=' + Date.now());
    const data = await response.json();
    allData = data;
    
    renderHeroStats(data.stats);
    renderTodayMatches(data);
    renderPredictionsTable(data, currentFilter);
    renderStats(data);
    
  } catch (error) {
    console.error('Failed to load data:', error);
    document.getElementById('todayMatches').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Failed to load predictions. Please try again later.</p></div>';
  }
}

// Mobile menu toggle
function setupMobileMenu() {
  var btn = document.querySelector('.mobile-menu-btn');
  var nav = document.querySelector('.nav');
  
  if (btn) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setupFilters();
  setupMobileMenu();
  loadData();
  
  setInterval(loadData, 5 * 60 * 1000);
});
