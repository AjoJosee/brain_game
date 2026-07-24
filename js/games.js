const Games = {
    // -------------------------------------------------------------------
    // 1. MEMORY MATCH
    // -------------------------------------------------------------------
    memoryMatch: {
        title: "Memory Match",
        category: "Memory",
        icon: "🧠",
        description: "Train your visual working memory by pairing matching cards.",
        init: (container, difficulty = 'medium') => {
            const themeSets = {
                fruits: ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍐', '🍊', '🫐', '🍉', '🥑'],
                animals: ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐯', '🐰', '🐸', '🐵', '🦉', '🦋'],
                space: ['🚀', '🛸', '🪐', '🌙', '⭐', '☄️', '🌌', '👽', '☀️', '🌍', '📡', '✨']
            };

            const gridConfigs = {
                easy: { rows: 3, cols: 4, pairs: 6 },
                medium: { rows: 4, cols: 4, pairs: 8 },
                hard: { rows: 4, cols: 5, pairs: 10 },
                master: { rows: 4, cols: 6, pairs: 12 }
            };

            const config = gridConfigs[difficulty] || gridConfigs.medium;
            const symbols = themeSets.fruits.slice(0, config.pairs);
            let cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);

            let flipped = [];
            let matchedCount = 0;
            let moves = 0;
            let startTime = null;
            let timerInterval = null;
            let elapsedSec = 0;

            container.innerHTML = `
                <div class="game-header">
                    <div class="game-title-badge">
                        <span class="game-icon">🧠</span>
                        <div>
                            <h2>Memory Match</h2>
                            <span class="badge badge-${difficulty}">${difficulty.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="game-stats-bar">
                        <div class="stat-pill"><span class="stat-label">Moves</span><span id="mem-moves" class="stat-val">0</span></div>
                        <div class="stat-pill"><span class="stat-label">Pairs</span><span id="mem-pairs" class="stat-val">0 / ${config.pairs}</span></div>
                        <div class="stat-pill"><span class="stat-label">Time</span><span id="mem-time" class="stat-val">0s</span></div>
                    </div>
                </div>

                <div class="memory-grid-container" style="grid-template-columns: repeat(${config.cols}, 1fr);">
                    ${cards.map((sym, idx) => `
                        <div class="mem-card-wrapper" data-index="${idx}" data-symbol="${sym}">
                            <div class="mem-card">
                                <div class="mem-card-face mem-card-front">❓</div>
                                <div class="mem-card-face mem-card-back">${sym}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Start Timer
            timerInterval = setInterval(() => {
                if (startTime) {
                    elapsedSec = Math.floor((Date.now() - startTime) / 1000);
                    const timeEl = container.querySelector('#mem-time');
                    if (timeEl) timeEl.textContent = `${elapsedSec}s`;
                }
            }, 1000);

            const cardEls = container.querySelectorAll('.mem-card-wrapper');
            cardEls.forEach(card => {
                card.onclick = () => {
                    if (!startTime) startTime = Date.now();
                    AudioEngine.playFlip();

                    if (flipped.length < 2 && !card.classList.contains('flipped') && !card.classList.contains('matched')) {
                        card.classList.add('flipped');
                        flipped.push(card);

                        if (flipped.length === 2) {
                            moves++;
                            container.querySelector('#mem-moves').textContent = moves;

                            const [c1, c2] = flipped;
                            if (c1.dataset.symbol === c2.dataset.symbol) {
                                AudioEngine.playMatch();
                                c1.classList.add('matched');
                                c2.classList.add('matched');
                                matchedCount++;
                                container.querySelector('#mem-pairs').textContent = `${matchedCount} / ${config.pairs}`;
                                flipped = [];

                                if (matchedCount === config.pairs) {
                                    clearInterval(timerInterval);
                                    AudioEngine.playFanfare();

                                    // Score calculation based on efficiency
                                    const minMoves = config.pairs;
                                    const movePenalty = Math.max(0, moves - minMoves) * 5;
                                    const timePenalty = Math.floor(elapsedSec * 1.5);
                                    const baseScore = config.pairs * 20;
                                    const finalScore = Math.max(20, baseScore - movePenalty - timePenalty + 50);

                                    setTimeout(() => {
                                        showGameOverModal({
                                            gameId: 'memoryMatch',
                                            score: finalScore,
                                            difficulty,
                                            metrics: { moves, timeSec: elapsedSec, pairs: config.pairs }
                                        });
                                    }, 600);
                                }
                            } else {
                                AudioEngine.playWrong();
                                setTimeout(() => {
                                    c1.classList.remove('flipped');
                                    c2.classList.remove('flipped');
                                    flipped = [];
                                }, 800);
                            }
                        }
                    }
                };
            });
        }
    },

    // -------------------------------------------------------------------
    // 2. SEQUENCE RECALL (Simon Says with Synth Audio)
    // -------------------------------------------------------------------
    sequenceRecall: {
        title: "Sequence Recall",
        category: "Focus",
        icon: "⚡",
        description: "Memorize and repeat the glowing sound sequence as it expands.",
        init: (container, difficulty = 'medium') => {
            let sequence = [];
            let userPos = 0;
            let level = 1;
            let isPlaying = false;
            const padColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // Red, Blue, Green, Yellow

            container.innerHTML = `
                <div class="game-header">
                    <div class="game-title-badge">
                        <span class="game-icon">⚡</span>
                        <div>
                            <h2>Sequence Recall</h2>
                            <span class="badge badge-${difficulty}">${difficulty.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="game-stats-bar">
                        <div class="stat-pill"><span class="stat-label">Level</span><span id="seq-level" class="stat-val">1</span></div>
                        <div class="stat-pill"><span class="stat-label">Score</span><span id="seq-score" class="stat-val">0</span></div>
                    </div>
                </div>

                <div class="sequence-pad-container">
                    ${padColors.map((color, i) => `
                        <button class="seq-pad" id="seq-pad-${i}" style="--pad-color: ${color};"></button>
                    `).join('')}
                </div>

                <div class="game-controls">
                    <button id="start-seq-btn" class="btn btn-primary btn-lg">Start Sequence</button>
                    <p id="seq-status-text" class="status-subtitle">Click Start to watch the pattern!</p>
                </div>
            `;

            const pads = padColors.map((_, i) => container.querySelector(`#seq-pad-${i}`));
            const startBtn = container.querySelector('#start-seq-btn');
            const statusText = container.querySelector('#seq-status-text');

            const speedMs = { easy: 750, medium: 550, hard: 400, master: 300 }[difficulty] || 550;

            const flashPad = (index) => {
                return new Promise(resolve => {
                    const pad = pads[index];
                    pad.classList.add('active');
                    AudioEngine.playSequenceBeep(index);
                    setTimeout(() => {
                        pad.classList.remove('active');
                        setTimeout(resolve, 150);
                    }, speedMs);
                });
            };

            const playSequence = async () => {
                isPlaying = true;
                statusText.textContent = "Observe the pattern...";
                startBtn.disabled = true;

                for (const idx of sequence) {
                    await flashPad(idx);
                }

                isPlaying = false;
                userPos = 0;
                statusText.textContent = "Your Turn! Repeat the pattern.";
            };

            const nextRound = async () => {
                sequence.push(Math.floor(Math.random() * 4));
                container.querySelector('#seq-level').textContent = level;
                container.querySelector('#seq-score').textContent = (level - 1) * 15;
                await playSequence();
            };

            startBtn.onclick = () => {
                level = 1;
                sequence = [];
                startBtn.style.display = 'none';
                nextRound();
            };

            pads.forEach((pad, index) => {
                pad.onclick = () => {
                    if (isPlaying || sequence.length === 0) return;

                    flashPad(index);

                    if (index === sequence[userPos]) {
                        userPos++;
                        if (userPos === sequence.length) {
                            level++;
                            statusText.textContent = "Correct! Get ready for next round...";
                            setTimeout(nextRound, 1000);
                        }
                    } else {
                        AudioEngine.playWrong();
                        statusText.textContent = "Wrong sequence!";
                        const finalScore = (level - 1) * 20;

                        setTimeout(() => {
                            showGameOverModal({
                                gameId: 'sequenceRecall',
                                score: finalScore,
                                difficulty,
                                metrics: { levelReached: level, totalSequence: sequence.length }
                            });
                        }, 800);
                    }
                };
            });
        }
    },

    // -------------------------------------------------------------------
    // 3. MENTAL MATH (Quick Calculation under Time Pressure)
    // -------------------------------------------------------------------
    mentalMath: {
        title: "Mental Math",
        category: "Math",
        icon: "🔢",
        description: "Solve arithmetic equations quickly to sharpen numerical reasoning.",
        init: (container, difficulty = 'medium') => {
            let score = 0;
            let currentQ = 0;
            const totalQuestions = 8;
            let currentAnswer = 0;
            let streak = 0;
            let timer;
            let timeLeft = 10; // seconds per question

            container.innerHTML = `
                <div class="game-header">
                    <div class="game-title-badge">
                        <span class="game-icon">🔢</span>
                        <div>
                            <h2>Mental Math</h2>
                            <span class="badge badge-${difficulty}">${difficulty.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="game-stats-bar">
                        <div class="stat-pill"><span class="stat-label">Question</span><span id="math-progress" class="stat-val">1 / 8</span></div>
                        <div class="stat-pill"><span class="stat-label">Streak</span><span id="math-streak" class="stat-val">🔥 0</span></div>
                        <div class="stat-pill"><span class="stat-label">Score</span><span id="math-score" class="stat-val">0</span></div>
                    </div>
                </div>

                <div class="timer-bar-wrapper">
                    <div id="timer-bar-fill" class="timer-bar-fill"></div>
                </div>

                <div class="math-card">
                    <div id="math-expression" class="math-expr-display">12 + 15</div>
                    <div class="math-input-group">
                        <input type="number" id="math-input" class="math-input-field" placeholder="Answer" autofocus autocomplete="off">
                        <button id="math-submit-btn" class="btn btn-primary">Submit</button>
                    </div>
                </div>
            `;

            const exprEl = container.querySelector('#math-expression');
            const inputEl = container.querySelector('#math-input');
            const submitBtn = container.querySelector('#math-submit-btn');
            const timerBar = container.querySelector('#timer-bar-fill');

            const generateEquation = () => {
                let a, b, op, ans;
                const timeLimits = { easy: 12, medium: 9, hard: 6, master: 4 };
                timeLeft = timeLimits[difficulty] || 9;

                if (difficulty === 'easy') {
                    a = Math.floor(Math.random() * 20) + 1;
                    b = Math.floor(Math.random() * 20) + 1;
                    op = Math.random() > 0.5 ? '+' : '-';
                    ans = op === '+' ? a + b : a - b;
                } else if (difficulty === 'medium') {
                    a = Math.floor(Math.random() * 35) + 5;
                    b = Math.floor(Math.random() * 25) + 5;
                    const ops = ['+', '-', '*'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    if (op === '*') {
                        a = Math.floor(Math.random() * 12) + 2;
                        b = Math.floor(Math.random() * 12) + 2;
                        ans = a * b;
                    } else {
                        ans = op === '+' ? a + b : a - b;
                    }
                } else { // hard or master
                    const ops = ['+', '-', '*', '/'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    if (op === '/') {
                        b = Math.floor(Math.random() * 10) + 2;
                        ans = Math.floor(Math.random() * 15) + 2;
                        a = b * ans;
                    } else if (op === '*') {
                        a = Math.floor(Math.random() * 15) + 3;
                        b = Math.floor(Math.random() * 15) + 3;
                        ans = a * b;
                    } else {
                        a = Math.floor(Math.random() * 90) + 10;
                        b = Math.floor(Math.random() * 90) + 10;
                        ans = op === '+' ? a + b : a - b;
                    }
                }

                currentAnswer = ans;
                exprEl.textContent = `${a} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${b} = ?`;
                inputEl.value = '';
                inputEl.focus();

                startQuestionTimer(timeLimits[difficulty] || 9);
            };

            const startQuestionTimer = (maxSec) => {
                clearInterval(timer);
                let currentSec = maxSec;
                timerBar.style.width = '100%';

                timer = setInterval(() => {
                    currentSec -= 0.1;
                    const percent = Math.max(0, (currentSec / maxSec) * 100);
                    timerBar.style.width = `${percent}%`;

                    if (currentSec <= 0) {
                        clearInterval(timer);
                        AudioEngine.playWrong();
                        handleAnswer(false);
                    }
                }, 100);
            };

            const handleAnswer = (isManual = true) => {
                clearInterval(timer);
                const userVal = parseInt(inputEl.value);
                const correct = isManual && userVal === currentAnswer;

                if (correct) {
                    AudioEngine.playMatch();
                    streak++;
                    const streakBonus = Math.min( streak * 5, 25);
                    score += (20 + streakBonus);
                } else {
                    if (isManual) AudioEngine.playWrong();
                    streak = 0;
                }

                currentQ++;
                container.querySelector('#math-progress').textContent = `${currentQ + 1} / ${totalQuestions}`;
                container.querySelector('#math-streak').textContent = `🔥 ${streak}`;
                container.querySelector('#math-score').textContent = score;

                if (currentQ < totalQuestions) {
                    generateEquation();
                } else {
                    AudioEngine.playFanfare();
                    showGameOverModal({
                        gameId: 'mentalMath',
                        score,
                        difficulty,
                        metrics: { questionsAsked: totalQuestions, maxStreak: streak }
                    });
                }
            };

            submitBtn.onclick = () => handleAnswer(true);
            inputEl.onkeydown = (e) => {
                if (e.key === 'Enter') handleAnswer(true);
            };

            generateEquation();
        }
    },

    // -------------------------------------------------------------------
    // 4. WORD SCRAMBLE (Verbal Memory & Anagram Solving)
    // -------------------------------------------------------------------
    wordScramble: {
        title: "Word Scramble",
        category: "Verbal",
        icon: "🔤",
        description: "Unscramble letters to reveal vocabulary words.",
        init: (container, difficulty = 'medium') => {
            const wordListByDifficulty = {
                easy: ['APPLE', 'HAPPY', 'BEACH', 'FLower', 'SMART', 'CLOUD', 'MUSIC', 'WATER'],
                medium: ['GARDEN', 'HEALTH', 'MEMORY', 'PUZZLE', 'SILVER', 'WISDOM', 'ENERGY', 'FLIGHT'],
                hard: ['COGNITIVE', 'BRILLIANT', 'KNOWLEDGE', 'CREATIVE', 'FOCUS', 'REASONING', 'SERENITY'],
                master: ['EXCELLENCE', 'NEUROLOGY', 'PERCEPTION', 'METACUITIVE', 'SYNAPSE']
            };

            const words = wordListByDifficulty[difficulty] || wordListByDifficulty.medium;
            let score = 0;
            let currentWordIdx = 0;
            let targetWord = '';
            let scrambledStr = '';
            let userGuessedLetters = [];

            container.innerHTML = `
                <div class="game-header">
                    <div class="game-title-badge">
                        <span class="game-icon">🔤</span>
                        <div>
                            <h2>Word Scramble</h2>
                            <span class="badge badge-${difficulty}">${difficulty.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="game-stats-bar">
                        <div class="stat-pill"><span class="stat-label">Word</span><span id="word-count" class="stat-val">1 / 4</span></div>
                        <div class="stat-pill"><span class="stat-label">Score</span><span id="word-score" class="stat-val">0</span></div>
                    </div>
                </div>

                <div class="word-card">
                    <div id="scrambled-tiles-container" class="letter-tiles-row"></div>

                    <div class="answer-slots-container" id="answer-slots-row"></div>

                    <div class="word-action-buttons">
                        <button id="word-clear-btn" class="btn btn-secondary">Clear</button>
                        <button id="word-hint-btn" class="btn btn-outline">💡 Hint</button>
                        <button id="word-submit-btn" class="btn btn-primary">Check Answer</button>
                    </div>
                </div>
            `;

            const tilesRow = container.querySelector('#scrambled-tiles-container');
            const slotsRow = container.querySelector('#answer-slots-row');

            const setupWord = () => {
                targetWord = words[currentWordIdx % words.length].toUpperCase();
                // Scramble ensuring it's not identical to original
                let arr = targetWord.split('');
                do {
                    arr.sort(() => Math.random() - 0.5);
                } while (arr.join('') === targetWord && arr.length > 3);

                scrambledStr = arr.join('');
                userGuessedLetters = [];

                renderTiles();
            };

            const renderTiles = () => {
                tilesRow.innerHTML = '';
                slotsRow.innerHTML = '';

                // Scrambled tiles
                scrambledStr.split('').forEach((char, idx) => {
                    const isUsed = userGuessedLetters.includes(idx);
                    const tile = document.createElement('div');
                    tile.className = `letter-tile ${isUsed ? 'used' : ''}`;
                    tile.textContent = char;
                    tile.onclick = () => {
                        if (!isUsed) {
                            AudioEngine.playClick();
                            userGuessedLetters.push(idx);
                            renderTiles();
                        }
                    };
                    tilesRow.appendChild(tile);
                });

                // Answer slots
                targetWord.split('').forEach((_, idx) => {
                    const slot = document.createElement('div');
                    slot.className = 'answer-slot';
                    if (userGuessedLetters[idx] !== undefined) {
                        const originalCharIndex = userGuessedLetters[idx];
                        slot.textContent = scrambledStr[originalCharIndex];
                        slot.onclick = () => {
                            AudioEngine.playClick();
                            userGuessedLetters.splice(idx, 1);
                            renderTiles();
                        };
                    }
                    slotsRow.appendChild(slot);
                });
            };

            container.querySelector('#word-clear-btn').onclick = () => {
                AudioEngine.playClick();
                userGuessedLetters = [];
                renderTiles();
            };

            container.querySelector('#word-hint-btn').onclick = () => {
                AudioEngine.playClick();
                alert(`Hint: The word starts with "${targetWord[0]}" and has ${targetWord.length} letters.`);
            };

            container.querySelector('#word-submit-btn').onclick = () => {
                const guessedWord = userGuessedLetters.map(i => scrambledStr[i]).join('');
                if (guessedWord === targetWord) {
                    AudioEngine.playMatch();
                    score += 35;
                    currentWordIdx++;
                    container.querySelector('#word-score').textContent = score;
                    container.querySelector('#word-count').textContent = `${currentWordIdx + 1} / 4`;

                    if (currentWordIdx < 4) {
                        setupWord();
                    } else {
                        AudioEngine.playFanfare();
                        showGameOverModal({
                            gameId: 'wordScramble',
                            score,
                            difficulty,
                            metrics: { wordsSolved: 4 }
                        });
                    }
                } else {
                    AudioEngine.playWrong();
                    slotsRow.classList.add('shake');
                    setTimeout(() => slotsRow.classList.remove('shake'), 500);
                }
            };

            setupWord();
        }
    },

    // -------------------------------------------------------------------
    // 5. REACTION TIME (Processing Speed & Neuromotor Reflex)
    // -------------------------------------------------------------------
    reactionTime: {
        title: "Reaction Time",
        category: "Speed",
        icon: "⚡",
        description: "Test how quickly your brain responds to a visual stimulus.",
        init: (container, difficulty = 'medium') => {
            let trials = [];
            const maxTrials = 3;
            let state = 'idle'; // idle, waiting, ready, finished
            let startTime = 0;
            let timeoutId = null;

            container.innerHTML = `
                <div class="game-header">
                    <div class="game-title-badge">
                        <span class="game-icon">⚡</span>
                        <div>
                            <h2>Reaction Time</h2>
                            <span class="badge badge-${difficulty}">${difficulty.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="game-stats-bar">
                        <div class="stat-pill"><span class="stat-label">Trial</span><span id="react-trial" class="stat-val">1 / 3</span></div>
                        <div class="stat-pill"><span class="stat-label">Avg Time</span><span id="react-avg" class="stat-val">-- ms</span></div>
                    </div>
                </div>

                <div id="reaction-box-card" class="reaction-box state-idle">
                    <div id="reaction-prompt-text" class="reaction-prompt-title">Click Anywhere To Start</div>
                    <p id="reaction-prompt-sub" class="reaction-prompt-subtitle">When the red box turns GREEN, click immediately!</p>
                </div>

                <div id="trial-history-list" class="trial-history-container"></div>
            `;

            const box = container.querySelector('#reaction-box-card');
            const titleText = container.querySelector('#reaction-prompt-text');
            const subText = container.querySelector('#reaction-prompt-sub');
            const historyList = container.querySelector('#trial-history-list');

            const startTrial = () => {
                state = 'waiting';
                box.className = 'reaction-box state-waiting';
                titleText.textContent = 'Wait for Green...';
                subText.textContent = 'Hold on... do not click yet!';

                const delay = Math.random() * 2500 + 1500;
                timeoutId = setTimeout(() => {
                    state = 'ready';
                    box.className = 'reaction-box state-ready';
                    titleText.textContent = 'CLICK NOW!';
                    subText.textContent = 'Tap as fast as you can!';
                    startTime = performance.now();
                }, delay);
            };

            box.onclick = () => {
                if (state === 'idle') {
                    AudioEngine.playClick();
                    startTrial();
                } else if (state === 'waiting') {
                    clearTimeout(timeoutId);
                    AudioEngine.playWrong();
                    state = 'idle';
                    box.className = 'reaction-box state-early';
                    titleText.textContent = 'Too Early!';
                    subText.textContent = 'You clicked before green. Click to try again.';
                } else if (state === 'ready') {
                    const elapsed = Math.round(performance.now() - startTime);
                    AudioEngine.playMatch();
                    trials.push(elapsed);

                    const avgMs = Math.round(trials.reduce((a, b) => a + b, 0) / trials.length);
                    container.querySelector('#react-avg').textContent = `${avgMs} ms`;
                    container.querySelector('#react-trial').textContent = `${trials.length + 1} / ${maxTrials}`;

                    historyList.innerHTML += `<span class="trial-badge">Trial ${trials.length}: ${elapsed}ms</span>`;

                    if (trials.length < maxTrials) {
                        state = 'idle';
                        box.className = 'reaction-box state-idle';
                        titleText.textContent = `${elapsed} ms!`;
                        subText.textContent = 'Click to proceed to next trial.';
                    } else {
                        state = 'finished';
                        AudioEngine.playFanfare();
                        // Higher score for lower reaction time (benchmark ~250ms = 100 points)
                        const score = Math.max(10, Math.min(150, Math.round(100000 / avgMs)));
                        showGameOverModal({
                            gameId: 'reactionTime',
                            score,
                            difficulty,
                            metrics: { avgReactionMs: avgMs, trials }
                        });
                    }
                }
            };
        }
    },

    // -------------------------------------------------------------------
    // 6. STROOP FOCUS TEST (NEW 6th Game! Selective Attention & Inhibition)
    // -------------------------------------------------------------------
    stroopTest: {
        title: "Stroop Focus Test",
        category: "Focus",
        icon: "🎯",
        description: "Identify the INK COLOR of the word, ignoring what the text actually spells out!",
        init: (container, difficulty = 'medium') => {
            const colorOptions = [
                { name: 'RED', hex: '#ef4444' },
                { name: 'BLUE', hex: '#3b82f6' },
                { name: 'GREEN', hex: '#10b981' },
                { name: 'YELLOW', hex: '#eab308' },
                { name: 'PURPLE', hex: '#a855f7' }
            ];

            let score = 0;
            let currentRound = 0;
            const totalRounds = 8;
            let correctInkHex = '';
            let roundStartTime = 0;
            let totalReactionTimeMs = 0;

            container.innerHTML = `
                <div class="game-header">
                    <div class="game-title-badge">
                        <span class="game-icon">🎯</span>
                        <div>
                            <h2>Stroop Focus Test</h2>
                            <span class="badge badge-${difficulty}">${difficulty.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="game-stats-bar">
                        <div class="stat-pill"><span class="stat-label">Round</span><span id="stroop-round" class="stat-val">1 / 8</span></div>
                        <div class="stat-pill"><span class="stat-label">Score</span><span id="stroop-score" class="stat-val">0</span></div>
                    </div>
                </div>

                <div class="stroop-card">
                    <p class="stroop-instruction">Select the <strong>INK COLOR</strong>, NOT the text word!</p>
                    <div id="stroop-target-word" class="stroop-word-display">COLOR</div>

                    <div class="stroop-buttons-grid">
                        ${colorOptions.map(c => `
                            <button class="btn stroop-choice-btn" data-hex="${c.hex}" style="border-color: ${c.hex}; color: ${c.hex};">
                                ${c.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;

            const wordDisplay = container.querySelector('#stroop-target-word');
            const btns = container.querySelectorAll('.stroop-choice-btn');

            const nextRound = () => {
                const textObj = colorOptions[Math.floor(Math.random() * colorOptions.length)];
                let inkObj;
                // Create Stroop conflict (ink color differs from word text)
                do {
                    inkObj = colorOptions[Math.floor(Math.random() * colorOptions.length)];
                } while (inkObj.hex === textObj.hex);

                wordDisplay.textContent = textObj.name;
                wordDisplay.style.color = inkObj.hex;
                correctInkHex = inkObj.hex;
                roundStartTime = performance.now();
            };

            btns.forEach(btn => {
                btn.onclick = () => {
                    const elapsed = performance.now() - roundStartTime;
                    totalReactionTimeMs += elapsed;
                    const chosenHex = btn.dataset.hex;

                    if (chosenHex === correctInkHex) {
                        AudioEngine.playMatch();
                        const speedBonus = Math.max(5, Math.floor((2000 - elapsed) / 100));
                        score += (20 + speedBonus);
                    } else {
                        AudioEngine.playWrong();
                    }

                    currentRound++;
                    container.querySelector('#stroop-score').textContent = score;
                    container.querySelector('#stroop-round').textContent = `${currentRound + 1} / ${totalRounds}`;

                    if (currentRound < totalRounds) {
                        nextRound();
                    } else {
                        AudioEngine.playFanfare();
                        const avgMs = Math.round(totalReactionTimeMs / totalRounds);
                        showGameOverModal({
                            gameId: 'stroopTest',
                            score,
                            difficulty,
                            metrics: { avgMs, accuracyRounds: currentRound }
                        });
                    }
                };
            });

            nextRound();
        }
    }
};

window.Games = Games;
