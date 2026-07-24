let currentDifficulty = 'medium';

const views = {
    // -------------------------------------------------------------
    // HOME VIEW: Game Selector & Daily Workout
    // -------------------------------------------------------------
    home: async () => {
        const dailyData = await API.getDailyChallenge();

        return `
            <div class="view animate-fade">
                <!-- Daily Challenge Banner -->
                <div class="daily-banner-card">
                    <div class="daily-banner-content">
                        <span class="daily-pill">🌟 DAILY BRAIN WORKOUT</span>
                        <h2>Keep your mind sharp today</h2>
                        <p>${dailyData.targetGoal}</p>
                        <div class="daily-games-row">
                            ${dailyData.featuredGames.map(g => `
                                <div class="daily-game-chip" onclick="startGame('${g.id}')">
                                    <span class="daily-chip-icon">🎯</span>
                                    <span>${g.name} (${g.bonus})</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Difficulty Selector Toolbar -->
                <div class="difficulty-toolbar">
                    <span class="toolbar-label">Select Difficulty:</span>
                    <div class="btn-group">
                        <button class="btn-diff ${currentDifficulty === 'easy' ? 'active' : ''}" onclick="setDifficulty('easy')">Easy</button>
                        <button class="btn-diff ${currentDifficulty === 'medium' ? 'active' : ''}" onclick="setDifficulty('medium')">Medium</button>
                        <button class="btn-diff ${currentDifficulty === 'hard' ? 'active' : ''}" onclick="setDifficulty('hard')">Hard</button>
                        <button class="btn-diff ${currentDifficulty === 'master' ? 'active' : ''}" onclick="setDifficulty('master')">Master</button>
                    </div>
                </div>

                <!-- Game Cards Grid -->
                <div class="game-grid">
                    ${Object.keys(Games).map(gameKey => {
                        const g = Games[gameKey];
                        return `
                            <div class="game-card" onclick="startGame('${gameKey}')">
                                <div class="card-top">
                                    <span class="card-icon">${g.icon}</span>
                                    <span class="category-tag">${g.category}</span>
                                </div>
                                <h3>${g.title}</h3>
                                <p>${g.description}</p>
                                <div class="card-bottom">
                                    <span class="play-btn-text">Play Now →</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------
    // DASHBOARD VIEW: Brain Health, Domain Ages & Analytics
    // -------------------------------------------------------------
    dashboard: async () => {
        const stats = await API.getUserStats();
        const cog = stats.cognitiveData || { overallAge: 65, memoryAge: 65, focusAge: 65, speedAge: 65, mathAge: 65, verbalAge: 65 };
        const user = stats.user || { username: 'Brain Explorer', streak_days: 1 };
        const recentScores = stats.recentScores || [];

        return `
            <div class="view animate-fade">
                <div class="dashboard-hero-card">
                    <div class="hero-age-container">
                        <div class="age-circle-display">
                            <span class="age-number">${cog.overallAge}</span>
                            <span class="age-label">YEARS OLD</span>
                        </div>
                        <div class="hero-text-side">
                            <h2>Overall Mental Age</h2>
                            <p>Evaluated across 5 cognitive domains powered by Node 24 Analytics.</p>
                            <div class="streak-badge-hero">
                                🔥 <strong>${user.streak_days || 1} Day Streak</strong> | ${cog.totalGamesPlayed || recentScores.length} Sessions Completed
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <!-- Domain Ages Breakdown -->
                    <div class="stats-panel">
                        <h3>Cognitive Domain Breakdown</h3>
                        <div class="domain-bars-list">
                            <div class="domain-bar-item">
                                <div class="domain-info"><span>🧠 Memory</span><span class="domain-val">${cog.memoryAge} yrs</span></div>
                                <div class="progress-track"><div class="progress-bar-fill" style="width: ${Math.max(10, 100 - cog.memoryAge)}%;"></div></div>
                            </div>
                            <div class="domain-bar-item">
                                <div class="domain-info"><span>⚡ Focus & Attention</span><span class="domain-val">${cog.focusAge} yrs</span></div>
                                <div class="progress-track"><div class="progress-bar-fill" style="width: ${Math.max(10, 100 - cog.focusAge)}%;"></div></div>
                            </div>
                            <div class="domain-bar-item">
                                <div class="domain-info"><span>💨 Processing Speed</span><span class="domain-val">${cog.speedAge} yrs</span></div>
                                <div class="progress-track"><div class="progress-bar-fill" style="width: ${Math.max(10, 100 - cog.speedAge)}%;"></div></div>
                            </div>
                            <div class="domain-bar-item">
                                <div class="domain-info"><span>🔢 Numerical Reasoning</span><span class="domain-val">${cog.mathAge} yrs</span></div>
                                <div class="progress-track"><div class="progress-bar-fill" style="width: ${Math.max(10, 100 - cog.mathAge)}%;"></div></div>
                            </div>
                            <div class="domain-bar-item">
                                <div class="domain-info"><span>🔤 Verbal & Flexibility</span><span class="domain-val">${cog.verbalAge} yrs</span></div>
                                <div class="progress-track"><div class="progress-bar-fill" style="width: ${Math.max(10, 100 - cog.verbalAge)}%;"></div></div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="stats-panel">
                        <h3>Recent Training History</h3>
                        <ul class="recent-scores-list">
                            ${recentScores.length > 0 ? recentScores.map(s => `
                                <li class="score-item">
                                    <div class="score-game-name">${Games[s.game_id || s.gameId]?.title || s.game_id || s.gameId}</div>
                                    <div class="score-details">
                                        <span class="badge badge-sm badge-${s.difficulty || 'medium'}">${(s.difficulty || 'med').toUpperCase()}</span>
                                        <span class="score-num">${s.score} pts</span>
                                    </div>
                                </li>
                            `).join('') : '<li class="empty-state">No games played yet. Try a game from the Home menu!</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------
    // LEADERBOARD VIEW
    // -------------------------------------------------------------
    leaderboard: async () => {
        const data = await API.getLeaderboard();
        const topAges = data.topBrainAges || [];

        return `
            <div class="view animate-fade">
                <div class="leaderboard-panel">
                    <h2>🏆 Global Mental Age Leaderboard</h2>
                    <p class="subtitle">Players with the lowest cognitive mental age</p>

                    <div class="leaderboard-table-container">
                        <table class="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>Best Mental Age</th>
                                    <th>Streak</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topAges.length > 0 ? topAges.map((player, idx) => `
                                    <tr>
                                        <td><span class="rank-badge rank-${idx + 1}">#${idx + 1}</span></td>
                                        <td><strong>${player.username}</strong></td>
                                        <td><span class="highlight-age">${player.best_age} yrs</span></td>
                                        <td>🔥 ${player.streak_days || 1} days</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="4" style="text-align:center; padding: 30px;">
                                            Play games to register your Mental Age on the global leaderboard!
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------
    // GAME VIEW CONTAINER
    // -------------------------------------------------------------
    game: (gameId) => {
        return `
            <div class="view animate-fade">
                <div class="game-view-wrapper">
                    <div id="game-active-container"></div>
                </div>
            </div>
        `;
    }
};

// -------------------------------------------------------------
// NAVIGATION & VIEW SWITCHING
// -------------------------------------------------------------
async function showView(viewName, param = null) {
    AudioEngine.playClick();
    const content = document.getElementById('main-content');
    
    // Update active nav button
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${viewName}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (viewName === 'game') {
        content.innerHTML = views.game(param);
        const container = document.getElementById('game-active-container');
        if (Games[param]) {
            Games[param].init(container, currentDifficulty);
        }
    } else {
        content.innerHTML = await views[viewName]();
    }
}

function startGame(gameId) {
    showView('game', gameId);
}

function setDifficulty(diff) {
    AudioEngine.playClick();
    currentDifficulty = diff;
    showView('home');
}

function toggleSound() {
    const muted = AudioEngine.toggleMute();
    const btn = document.getElementById('btn-sound');
    if (btn) {
        btn.textContent = muted ? '🔇 Muted' : '🔊 Sound On';
    }
}

// -------------------------------------------------------------
// GAME OVER MODAL & BACKEND SUBMISSION
// -------------------------------------------------------------
async function showGameOverModal({ gameId, score, difficulty, metrics }) {
    // Submit score to Node 24 backend
    const res = await API.submitScore(gameId, score, difficulty, metrics);
    const cog = res.cognitiveData || { overallAge: 65 };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay animate-fade';
    modal.innerHTML = `
        <div class="modal-card">
            <div class="modal-icon">🎉</div>
            <h2>Game Complete!</h2>
            <div class="modal-score-display">${score} <span class="pts-unit">POINTS</span></div>
            
            <div class="modal-stats-box">
                <div class="modal-stat-item">
                    <span>Current Mental Age</span>
                    <strong class="text-accent">${cog.overallAge} Years</strong>
                </div>
                <div class="modal-stat-item">
                    <span>Difficulty</span>
                    <strong class="badge badge-${difficulty}">${difficulty.toUpperCase()}</strong>
                </div>
            </div>

            ${res.badges && res.badges.length > 0 ? `
                <div class="badge-earned-alert">
                    🏆 New Achievement Unlocked: <strong>${res.badges[0].title}</strong>!
                </div>
            ` : ''}

            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModalAndGo('home')">Home Menu</button>
                <button class="btn btn-primary" onclick="closeModalAndGo('dashboard')">View Analytics</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeModalAndGo(viewName) {
    AudioEngine.playClick();
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    showView(viewName);
}

// User Profile Change
function changeUsernamePrompt() {
    const current = API.getUsername();
    const name = prompt("Enter your Brain Trainer username:", current);
    if (name && name.trim()) {
        API.setUsername(name.trim());
        API.initUser();
        showView('dashboard');
    }
}

// App Initialization
window.onload = async () => {
    await API.initUser();
    showView('home');
};
