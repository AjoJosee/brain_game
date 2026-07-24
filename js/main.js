const views = {
    home: () => {
        return `
            <div class="view">
                <div class="game-grid">
                    <div class="game-card" onclick="startGame('memoryMatch')">
                        <h3>Memory Match</h3>
                        <p>Train your visual memory by finding pairs.</p>
                    </div>
                    <div class="game-card" onclick="startGame('sequenceRecall')">
                        <h3>Sequence Recall</h3>
                        <p>Repeat the patterns to boost focus.</p>
                    </div>
                    <div class="game-card" onclick="startGame('mentalMath')">
                        <h3>Mental Math</h3>
                        <p>Keep your mind sharp with quick math.</p>
                    </div>
                    <div class="game-card" onclick="startGame('wordScramble')">
                        <h3>Word Scramble</h3>
                        <p>Challenge your vocabulary and logic.</p>
                    </div>
                    <div class="game-card" onclick="startGame('reactionTime')">
                        <h3>Reaction Time</h3>
                        <p>Test your brain's processing speed.</p>
                    </div>
                </div>
            </div>
        `;
    },
    dashboard: () => {
        const data = Storage.getData();
        const brainAge = Storage.calculateBrainAge();
        
        let scoresHtml = '';
        for (const gameId in data.scores) {
            const latest = data.scores[gameId].slice(-1)[0];
            scoresHtml += `<li>${gameId}: ${latest ? latest.score : 0}</li>`;
        }

        return `
            <div class="view">
                <div class="stats-container">
                    <h2>Your Brain Health</h2>
                    <div class="brain-age-display">${brainAge} <span style="font-size: 1.5rem;">years old</span></div>
                    <p>Based on your recent performance</p>
                </div>
                <div class="stats-container" style="margin-top: 20px;">
                    <h3>Last Scores</h3>
                    <ul style="list-style: none; padding: 0; font-size: 1.2rem;">
                        ${scoresHtml || '<li>No games played yet</li>'}
                    </ul>
                </div>
            </div>
        `;
    },
    game: (gameId) => {
        return `
            <div class="view">
                <div class="game-area">
                    <div id="game-container" class="game-screen"></div>
                </div>
            </div>
        `;
    }
};

function showView(viewName, param = null) {
    const content = document.getElementById('main-content');
    if (viewName === 'game') {
        content.innerHTML = views.game(param);
        const container = document.getElementById('game-container');
        Games[param].init(container);
    } else {
        content.innerHTML = views[viewName]();
    }
}

function startGame(gameId) {
    showView('game', gameId);
}

// Initialize app
window.onload = () => {
    showView('home');
};
