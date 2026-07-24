const Storage = {
    saveScore: (gameId, score) => {
        const data = Storage.getData();
        if (!data.scores) data.scores = {};
        if (!data.scores[gameId]) data.scores[gameId] = [];
        data.scores[gameId].push({
            score: score,
            date: new Date().toISOString()
        });
        localStorage.setItem('brainboost_data', JSON.stringify(data));
    },

    getData: () => {
        const data = localStorage.getItem('brainboost_data');
        return data ? JSON.parse(data) : { scores: {}, brainAge: 65 };
    },

    calculateBrainAge: () => {
        const data = Storage.getData();
        const scores = data.scores;
        let totalImprovement = 0;
        let gamesCount = 0;

        for (const gameId in scores) {
            const gameScores = scores[gameId];
            if (gameScores.length > 1) {
                const first = gameScores[0].score;
                const last = gameScores[gameScores.length - 1].score;
                totalImprovement += (last - first);
                gamesCount++;
            }
        }

        let baseAge = 65;
        if (gamesCount > 0) {
            const avgImprovement = totalImprovement / gamesCount;
            baseAge -= Math.floor(avgImprovement / 2);
        }
        
        // Keep age within reasonable bounds
        const finalAge = Math.max(20, Math.min(90, baseAge));
        
        // Save updated brain age
        const currentData = Storage.getData();
        currentData.brainAge = finalAge;
        localStorage.setItem('brainboost_data', JSON.stringify(currentData));
        
        return finalAge;
    }
};
