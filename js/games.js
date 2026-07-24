const Games = {
    // 1. Memory Match
    memoryMatch: {
        init: (container) => {
            const symbols = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍐'];
            let cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
            let flipped = [];
            let matched = 0;
            let attempts = 0;

            container.innerHTML = `
                <h3>Match the Pairs</h3>
                <p>Find all pairs to win!</p>
                <div class="memory-grid" id="mem-grid"></div>
            `;

            const grid = container.querySelector('#mem-grid');
            cards.forEach((symbol, index) => {
                const card = document.createElement('div');
                card.className = 'memory-card hidden';
                card.dataset.symbol = symbol;
                card.dataset.index = index;
                card.textContent = symbol;
                card.onclick = () => {
                    if (flipped.length < 2 && card.classList.contains('hidden')) {
                        card.classList.remove('hidden');
                        flipped.push(card);

                        if (flipped.length === 2) {
                            attempts++;
                            if (flipped[0].dataset.symbol === flipped[1].dataset.symbol) {
                                matched++;
                                flipped = [];
                                if (matched === symbols.length) {
                                    const score = 100 - attempts;
                                    Storage.saveScore('memoryMatch', score);
                                    setTimeout(() => showView('dashboard'), 1000);
                                    alert(`Game Over! Score: ${score}`);
                                }
                            } else {
                                setTimeout(() => {
                                    flipped.forEach(c => c.classList.add('hidden'));
                                    flipped = [];
                                }, 700);
                            }
                        }
                    }
                };
                grid.appendChild(card);
            });
        }
    },

    // 2. Sequence Recall
    sequenceRecall: {
        init: (container) => {
            let sequence = [];
            let userSequence = [];
            let level = 1;
            const colors = ['red', 'blue', 'green', 'yellow'];
            const btnIds = ['seq-0', 'seq-1', 'seq-2', 'seq-3'];

            container.innerHTML = `
                <h3>Sequence Recall</h3>
                <p>Watch and repeat the sequence!</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${colors.map((c, i) => `<button id="${btnIds[i]}" class="btn-action" style="background:${c}; width:100px; height:100px;"></button>`).join('')}
                </div>
                <button id="start-seq" class="btn-action">Start Game</button>
            `;

            const startBtn = container.querySelector('#start-seq');
            
            const playSequence = async () => {
                startBtn.style.display = 'none';
                userSequence = [];
                for (const index of sequence) {
                    const btn = document.getElementById(btnIds[index]);
                    btn.style.opacity = '0.5';
                    await new Promise(r => setTimeout(r, 600));
                    btn.style.opacity = '1';
                    await new Promise(r => setTimeout(r, 200));
                }
            };

            const nextLevel = async () => {
                sequence.push(Math.floor(Math.random() * 4));
                await playSequence();
            };

            startBtn.onclick = async () => {
                level = 1;
                sequence = [];
                await nextLevel();
            };

            btnIds.forEach((id, index) => {
                const btn = document.getElementById(id);
                btn.onclick = () => {
                    userSequence.push(index);
                    const currentIdx = userSequence.length - 1;
                    if (userSequence[currentIdx] !== sequence[currentIdx]) {
                        const score = level * 10;
                        Storage.saveScore('sequenceRecall', score);
                        alert(`Wrong! Game Over. Level: ${level}. Score: ${score}`);
                        showView('home');
                        return;
                    }
                    if (userSequence.length === sequence.length) {
                        level++;
                        setTimeout(nextLevel, 1000);
                    }
                };
            });
        }
    },

    // 3. Mental Math
    mentalMath: {
        init: (container) => {
            let score = 0;
            let questionsAsked = 0;
            const maxQuestions = 5;

            const generateQuestion = () => {
                const a = Math.floor(Math.random() * 20) + 1;
                const b = Math.floor(Math.random() * 20) + 1;
                const op = Math.random() > 0.5 ? '+' : '-';
                const answer = op === '+' ? a + b : a - b;
                return { q: `${a} ${op} ${b}`, a: answer };
            };

            let current = generateQuestion();

            container.innerHTML = `
                <h3>Mental Math</h3>
                <p>Solve 5 problems as quickly as you can!</p>
                <div class="game-screen">
                    <div id="math-q" style="font-size: 3rem; margin-bottom: 20px;">${current.q}</div>
                    <input type="number" id="math-ans" class="input-field">
                    <button id="math-submit" class="btn-action">Submit</button>
                </div>
            `;

            const input = container.querySelector('#math-ans');
            const submit = container.querySelector('#math-submit');
            const qDiv = container.querySelector('#math-q');

            const checkAnswer = () => {
                if (parseInt(input.value) === current.a) {
                    score += 20;
                }
                questionsAsked++;
                input.value = '';
                if (questionsAsked < maxQuestions) {
                    current = generateQuestion();
                    qDiv.textContent = current.q;
                } else {
                    Storage.saveScore('mentalMath', score);
                    alert(`Finished! Your score: ${score}`);
                    showView('dashboard');
                }
            };

            submit.onclick = checkAnswer;
            input.onkeypress = (e) => { if (e.key === 'Enter') checkAnswer(); };
        }
    },

    // 4. Word Scramble
    wordScramble: {
        init: (container) => {
            const words = ['APPLE', 'GARDEN', 'HEALTH', 'MEMORY', 'SMILE', 'BRIGHT', 'NATURE', 'FAMILY'];
            let currentWord = words[Math.floor(Math.random() * words.length)];
            let scrambled = currentWord.split('').sort(() => Math.random() - 0.5).join('');
            let score = 0;
            let solved = 0;
            const goal = 3;

            container.innerHTML = `
                <h3>Word Scramble</h3>
                <p>Unscramble the word!</p>
                <div class="game-screen">
                    <div id="word-q" style="font-size: 3rem; letter-spacing: 5px; margin-bottom: 20px;">${scrambled}</div>
                    <input type="text" id="word-ans" class="input-field" style="text-transform: uppercase;">
                    <button id="word-submit" class="btn-action">Submit</button>
                </div>
            `;

            const input = container.querySelector('#word-ans');
            const submit = container.querySelector('#word-submit');
            const qDiv = container.querySelector('#word-q');

            const nextWord = () => {
                currentWord = words[Math.floor(Math.random() * words.length)];
                scrambled = currentWord.split('').sort(() => Math.random() - 0.5).join('');
                qDiv.textContent = scrambled;
                input.value = '';
            };

            const check = () => {
                if (input.value.toUpperCase() === currentWord) {
                    score += 30;
                    solved++;
                    if (solved < goal) {
                        nextWord();
                    } else {
                        Storage.saveScore('wordScramble', score);
                        alert(`Great! You solved ${goal} words. Score: ${score}`);
                        showView('dashboard');
                    }
                } else {
                    alert('Try again!');
                }
            };

            submit.onclick = check;
            input.onkeypress = (e) => { if (e.key === 'Enter') check(); };
        }
    },

    // 5. Reaction Time
    reactionTime: {
        init: (container) => {
            container.innerHTML = `
                <h3>Reaction Time</h3>
                <p>Click the button as soon as it turns GREEN!</p>
                <div id="reaction-box" class="game-screen" style="cursor: pointer; background: #333;">
                    <div id="reaction-text" style="font-size: 2rem;">Wait for Green...</div>
                </div>
            `;

            const box = container.querySelector('#reaction-box');
            const text = container.querySelector('#reaction-text');
            let startTime, timeout;
            let gameState = 'waiting'; // waiting, ready, finished

            const startTest = () => {
                gameState = 'waiting';
                box.style.background = '#333';
                text.textContent = 'Wait for Green...';
                
                const delay = Math.random() * 3000 + 2000;
                timeout = setTimeout(() => {
                    gameState = 'ready';
                    box.style.background = 'var(--primary-color)';
                    text.textContent = 'CLICK NOW!';
                    startTime = Date.now();
                }, delay);
            };

            box.onclick = () => {
                if (gameState === 'waiting') {
                    clearTimeout(timeout);
                    alert('Too early! Try again.');
                    startTest();
                } else if (gameState === 'ready') {
                    const endTime = Date.now();
                    const reaction = endTime - startTime;
                    const score = Math.max(0, 1000 - reaction);
                    Storage.saveScore('reactionTime', score);
                    alert(`Reaction time: ${reaction}ms. Score: ${score}`);
                    showView('dashboard');
                    gameState = 'finished';
                } else if (gameState === 'finished') {
                    startTest();
                }
            };

            startTest();
        }
    }
};
