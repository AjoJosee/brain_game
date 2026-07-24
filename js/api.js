// Client API & Data Manager for Node 24 Backend
const API = {
    baseUrl: '', // Same origin relative URL

    getUserId() {
        let id = localStorage.getItem('brainboost_user_id');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
            localStorage.setItem('brainboost_user_id', id);
        }
        return id;
    },

    getUsername() {
        return localStorage.getItem('brainboost_username') || 'Brain Explorer';
    },

    setUsername(name) {
        localStorage.setItem('brainboost_username', name);
    },

    async initUser() {
        const userId = this.getUserId();
        const username = this.getUsername();
        try {
            const res = await fetch(`${this.baseUrl}/api/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, username })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Backend unavailable, operating in offline fallback mode:', e);
        }
        return this.getOfflineUserData();
    },

    async getUserStats() {
        const userId = this.getUserId();
        try {
            const res = await fetch(`${this.baseUrl}/api/user/${userId}/stats`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('API error, falling back to local storage:', e);
        }
        return this.getOfflineUserData();
    },

    async submitScore(gameId, score, difficulty = 'medium', metrics = {}) {
        const userId = this.getUserId();
        // Save locally first for offline support
        this.saveOfflineScore(gameId, score, difficulty);

        try {
            const res = await fetch(`${this.baseUrl}/api/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    gameId,
                    score,
                    difficulty,
                    metrics
                })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Failed to post score to Node 24 backend:', e);
        }

        return {
            success: true,
            offline: true,
            cognitiveData: this.calculateOfflineCognitiveAge()
        };
    },

    async getLeaderboard() {
        try {
            const res = await fetch(`${this.baseUrl}/api/leaderboard`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Leaderboard API error:', e);
        }
        return { topBrainAges: [], gameLeaderboards: {} };
    },

    async getDailyChallenge() {
        try {
            const res = await fetch(`${this.baseUrl}/api/daily-challenge`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Daily challenge API error:', e);
        }
        return {
            date: new Date().toISOString().split('T')[0],
            featuredGames: [
                { id: 'memoryMatch', name: 'Memory Match', category: 'Memory', bonus: '2x XP' },
                { id: 'stroopTest', name: 'Stroop Focus', category: 'Attention', bonus: '2.5x XP' }
            ],
            targetGoal: 'Play 3 games today for daily mental fitness!'
        };
    },

    // Local Storage Offline Fallback implementation
    saveOfflineScore(gameId, score, difficulty) {
        const data = this.getOfflineData();
        if (!data.scores) data.scores = [];
        data.scores.push({
            gameId,
            score,
            difficulty,
            date: new Date().toISOString()
        });
        localStorage.setItem('brainboost_offline_data', JSON.stringify(data));
    },

    getOfflineData() {
        const str = localStorage.getItem('brainboost_offline_data');
        return str ? JSON.parse(str) : { scores: [] };
    },

    getOfflineUserData() {
        const data = this.getOfflineData();
        const cognitiveData = this.calculateOfflineCognitiveAge();
        return {
            user: {
                id: this.getUserId(),
                username: this.getUsername(),
                streak_days: 1
            },
            cognitiveData,
            gameStats: [],
            recentScores: data.scores.slice(-10).reverse()
        };
    },

    calculateOfflineCognitiveAge() {
        const data = this.getOfflineData();
        const scores = data.scores || [];
        if (scores.length === 0) {
            return {
                overallAge: 65,
                memoryAge: 65,
                focusAge: 65,
                speedAge: 65,
                mathAge: 65,
                verbalAge: 65,
                streakBonus: 0,
                totalGamesPlayed: 0
            };
        }

        let totalScore = 0;
        scores.forEach(s => totalScore += s.score);
        const avg = totalScore / scores.length;
        const calculatedAge = Math.max(18, Math.min(85, Math.round(65 - (avg / 3))));

        return {
            overallAge: calculatedAge,
            memoryAge: calculatedAge,
            focusAge: calculatedAge,
            speedAge: calculatedAge,
            mathAge: calculatedAge,
            verbalAge: calculatedAge,
            streakBonus: 0,
            totalGamesPlayed: scores.length
        };
    }
};

window.API = API;
