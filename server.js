import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Initialize SQLite database using Node 24 native node:sqlite module
const db = new DatabaseSync(path.join(__dirname, 'brainboost.db'));

// Database setup
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL,
    streak_days INTEGER DEFAULT 1,
    last_active_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    metrics_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS brain_age_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    overall_age INTEGER NOT NULL,
    memory_age INTEGER NOT NULL,
    focus_age INTEGER NOT NULL,
    speed_age INTEGER NOT NULL,
    math_age INTEGER NOT NULL,
    verbal_age INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

console.log('✅ SQLite Database initialized via Node 24 native node:sqlite');

// Helper: Get today's date string YYYY-MM-DD
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// Helper: Cognitive Domain Mapping
const DOMAIN_MAP = {
  memoryMatch: 'memory',
  sequenceRecall: 'focus',
  reactionTime: 'speed',
  mentalMath: 'math',
  wordScramble: 'verbal',
  stroopTest: 'focus'
};

// Advanced Multi-Dimensional Brain Age Algorithm
function calculateCognitiveAges(userId) {
  const getScoresStmt = db.prepare(`
    SELECT game_id, score, difficulty, metrics_json, created_at
    FROM scores
    WHERE user_id = ?
    ORDER BY created_at ASC
  `);
  
  const allScores = getScoresStmt.all(userId);

  // Default baseline domain ages (in years)
  const domainScores = {
    memory: [],
    focus: [],
    speed: [],
    math: [],
    verbal: []
  };

  allScores.forEach(row => {
    const domain = DOMAIN_MAP[row.game_id] || 'focus';
    let normalized = row.score;

    // Adjust for difficulty multiplier
    if (row.difficulty === 'easy') normalized *= 0.85;
    else if (row.difficulty === 'hard') normalized *= 1.15;
    else if (row.difficulty === 'master') normalized *= 1.30;

    domainScores[domain].push(normalized);
  });

  // Calculate age per domain (Base 65, mapped between 18 and 85)
  const calculateDomainAge = (scoresList) => {
    if (!scoresList || scoresList.length === 0) return 65;
    // Average of top 3 scores in this domain to encourage peak performance
    const sorted = [...scoresList].sort((a, b) => b - a);
    const topScores = sorted.slice(0, 3);
    const avgScore = topScores.reduce((sum, val) => sum + val, 0) / topScores.length;

    // Linear/logarithmic mapping score (0-150+) to Age (75 down to 20)
    let age = 65 - (avgScore / 3);
    return Math.max(18, Math.min(85, Math.round(age)));
  };

  const memoryAge = calculateDomainAge(domainScores.memory);
  const focusAge = calculateDomainAge(domainScores.focus);
  const speedAge = calculateDomainAge(domainScores.speed);
  const mathAge = calculateDomainAge(domainScores.math);
  const verbalAge = calculateDomainAge(domainScores.verbal);

  // Overall Brain Age formula weighted by tested domains
  const testedAges = [memoryAge, focusAge, speedAge, mathAge, verbalAge];
  const avgDomainAge = Math.round(testedAges.reduce((a, b) => a + b, 0) / testedAges.length);

  // Check user streak & training frequency bonus
  const userStmt = db.prepare('SELECT streak_days FROM users WHERE id = ?');
  const userRow = userStmt.get(userId);
  const streakBonus = userRow ? Math.min(5, Math.floor((userRow.streak_days || 1) / 2)) : 0;

  const overallAge = Math.max(18, Math.min(85, avgDomainAge - streakBonus));

  return {
    overallAge,
    memoryAge,
    focusAge,
    speedAge,
    mathAge,
    verbalAge,
    streakBonus,
    totalGamesPlayed: allScores.length
  };
}

// Helper: Ensure User exists
function getOrCreateUser(userId, username = 'Brain Trainer') {
  const selectStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  let user = selectStmt.get(userId);

  const today = getTodayStr();

  if (!user) {
    const insertStmt = db.prepare(`
      INSERT INTO users (id, username, created_at, streak_days, last_active_date)
      VALUES (?, ?, ?, 1, ?)
    `);
    insertStmt.run(userId, username, new Date().toISOString(), today);
    user = selectStmt.get(userId);
  } else {
    // Update streak if active on consecutive days
    const lastDate = new Date(user.last_active_date);
    const currDate = new Date(today);
    const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      const updateStreak = db.prepare('UPDATE users SET streak_days = streak_days + 1, last_active_date = ? WHERE id = ?');
      updateStreak.run(today, userId);
    } else if (diffDays > 1) {
      const resetStreak = db.prepare('UPDATE users SET streak_days = 1, last_active_date = ? WHERE id = ?');
      resetStreak.run(today, userId);
    }
  }

  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health & Environment Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'BrainBoost Node 24 Server',
    nodeVersion: process.version,
    sqlite: 'Node 24 Native node:sqlite',
    timestamp: new Date().toISOString()
  });
});

// 2. Register / Fetch User Profile
app.post('/api/user', (req, res) => {
  const { userId, username } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const user = getOrCreateUser(userId, username || 'Brain Explorer');
  const cognitiveData = calculateCognitiveAges(userId);

  res.json({
    user,
    cognitiveData
  });
});

// 3. Get User Stats & Brain Age Breakdown
app.get('/api/user/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const user = getOrCreateUser(userId);

  const cognitiveData = calculateCognitiveAges(userId);

  // Get high scores per game
  const highScoresStmt = db.prepare(`
    SELECT game_id, MAX(score) as high_score, COUNT(*) as play_count, MAX(created_at) as last_played
    FROM scores
    WHERE user_id = ?
    GROUP BY game_id
  `);
  const gameStats = highScoresStmt.all(userId);

  // Get recent 10 score history
  const recentScoresStmt = db.prepare(`
    SELECT game_id, score, difficulty, created_at
    FROM scores
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `);
  const recentScores = recentScoresStmt.all(userId);

  res.json({
    user,
    cognitiveData,
    gameStats,
    recentScores
  });
});

// 4. Submit Game Score
app.post('/api/scores', (req, res) => {
  const { userId, gameId, score, difficulty = 'medium', metrics = {} } = req.body;

  if (!userId || !gameId || score === undefined) {
    return res.status(400).json({ error: 'userId, gameId, and score are required' });
  }

  getOrCreateUser(userId);

  const insertScoreStmt = db.prepare(`
    INSERT INTO scores (user_id, game_id, score, difficulty, metrics_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  insertScoreStmt.run(userId, gameId, score, difficulty, JSON.stringify(metrics), now);

  // Calculate updated mental ages
  const cognitiveData = calculateCognitiveAges(userId);

  // Save to brain_age_history
  const insertHistoryStmt = db.prepare(`
    INSERT INTO brain_age_history (user_id, overall_age, memory_age, focus_age, speed_age, math_age, verbal_age, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertHistoryStmt.run(
    userId,
    cognitiveData.overallAge,
    cognitiveData.memoryAge,
    cognitiveData.focusAge,
    cognitiveData.speedAge,
    cognitiveData.mathAge,
    cognitiveData.verbalAge,
    now
  );

  // Check achievements/badges earned
  const badges = [];
  if (cognitiveData.totalGamesPlayed === 1) badges.push({ id: 'first_game', title: 'First Step', desc: 'Completed your first brain game!' });
  if (cognitiveData.totalGamesPlayed >= 10) badges.push({ id: 'workout_master', title: 'Brain Gymnast', desc: 'Played 10+ brain training sessions!' });
  if (score >= 100) badges.push({ id: 'high_scorer', title: 'Century Club', desc: 'Scored 100+ points in a game!' });
  if (cognitiveData.overallAge <= 30) badges.push({ id: 'youthful_mind', title: 'Agile Mind', desc: 'Achieved a Mental Age under 30!' });

  res.json({
    success: true,
    scoreSubmitted: { gameId, score, difficulty, created_at: now },
    cognitiveData,
    badges
  });
});

// 5. Global Leaderboard
app.get('/api/leaderboard', (req, res) => {
  // Top 10 lowest Brain Age players with at least 3 games played
  const topBrainAgeStmt = db.prepare(`
    SELECT u.username, u.streak_days, MIN(b.overall_age) as best_age, COUNT(s.id) as games_played
    FROM users u
    JOIN brain_age_history b ON u.id = b.user_id
    JOIN scores s ON u.id = s.user_id
    GROUP BY u.id
    HAVING games_played >= 2
    ORDER BY best_age ASC
    LIMIT 10
  `);
  const topBrainAges = topBrainAgeStmt.all();

  // Top score per game
  const games = ['memoryMatch', 'sequenceRecall', 'reactionTime', 'mentalMath', 'wordScramble', 'stroopTest'];
  const gameLeaderboards = {};

  games.forEach(gameId => {
    const stmt = db.prepare(`
      SELECT u.username, s.score, s.difficulty, s.created_at
      FROM scores s
      JOIN users u ON s.user_id = u.id
      WHERE s.game_id = ?
      ORDER BY s.score DESC
      LIMIT 5
    `);
    gameLeaderboards[gameId] = stmt.all(gameId);
  });

  res.json({
    topBrainAges,
    gameLeaderboards
  });
});

// 6. Daily Challenge Recommendation
app.get('/api/daily-challenge', (req, res) => {
  const games = [
    { id: 'memoryMatch', name: 'Memory Match', category: 'Memory', bonus: '2x XP' },
    { id: 'sequenceRecall', name: 'Sequence Recall', category: 'Focus', bonus: '1.5x XP' },
    { id: 'reactionTime', name: 'Reaction Speed', category: 'Speed', bonus: '2x XP' },
    { id: 'mentalMath', name: 'Mental Math', category: 'Reasoning', bonus: '1.5x XP' },
    { id: 'wordScramble', name: 'Word Scramble', category: 'Verbal', bonus: '2x XP' },
    { id: 'stroopTest', name: 'Stroop Focus', category: 'Attention', bonus: '2.5x XP' }
  ];

  // Daily seed selection based on date string hash
  const today = getTodayStr();
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);

  const mainGame = games[seed % games.length];
  const secondaryGame = games[(seed + 2) % games.length];

  res.json({
    date: today,
    featuredGames: [mainGame, secondaryGame],
    targetGoal: 'Complete 3 games today to keep your Mental Fitness Streak!'
  });
});

// Start Node 24 Express Server
app.listen(PORT, () => {
  console.log(`🚀 BrainBoost Node 24 Server running on http://localhost:${PORT}`);
  console.log(`⚡ Node.js version: ${process.version}`);
  console.log(`💾 Native SQLite engine powered by node:sqlite DatabaseSync`);
});
