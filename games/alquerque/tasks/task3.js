(() => {
    const SCALE = 4;
    const x_coords = [127.0461 * SCALE, 269.023 * SCALE, 411.0001 * SCALE, 552.9772 * SCALE, 694.9543 * SCALE];
    const y_coords = [127.5458 * SCALE, 269.5228 * SCALE, 411.4999 * SCALE, 553.4769 * SCALE, 695.4539 * SCALE];
    const SHIFT_X = 0.2 * SCALE;
    const SHIFT_Y = 0;

    const originalCenters = {};
    let idx = 1;
    for (let row = 1; row <= 5; row++) {
        const y = y_coords[row - 1] + SHIFT_Y;
        for (let col = 1; col <= 5; col++) {
            const x = x_coords[col - 1] + SHIFT_X;
            originalCenters[idx] = { x, y };
            idx++;
        }
    }

    function numToRC(num) {
        const row = Math.floor((num - 1) / 5) + 1;
        const col = (num - 1) % 5 + 1;
        return { row, col };
    }
    function rcToNum(row, col) { return (row - 1) * 5 + col; }

    function buildAdjacency() {
        const adj = {};
        for (let r = 1; r <= 5; r++) {
            for (let c = 1; c <= 5; c++) {
                const neighbors = [];
                if (c > 1) neighbors.push(rcToNum(r, c-1));
                if (c < 5) neighbors.push(rcToNum(r, c+1));
                if (r > 1) neighbors.push(rcToNum(r-1, c));
                if (r < 5) neighbors.push(rcToNum(r+1, c));
                if (r < 5 && c < 5) neighbors.push(rcToNum(r+1, c+1));
                if (r < 5 && c > 1) neighbors.push(rcToNum(r+1, c-1));
                if (r > 1 && c < 5) neighbors.push(rcToNum(r-1, c+1));
                if (r > 1 && c > 1) neighbors.push(rcToNum(r-1, c-1));
                adj[rcToNum(r,c)] = neighbors;
            }
        }
        const forbidden = [
            [2,6], [2,8], [4,8], [4,10],
            [6,12], [8,12], [8,14], [10,14],
            [12,16], [12,18], [14,18], [14,20],
            [16,22], [18,22], [18,24], [20,24]
        ];
        for (const [a,b] of forbidden) {
            if (adj[a] && adj[a].includes(b)) adj[a] = adj[a].filter(v => v !== b);
            if (adj[b] && adj[b].includes(a)) adj[b] = adj[b].filter(v => v !== a);
        }
        return adj;
    }
    const adjNum = buildAdjacency();

    const cellWeights = {};
    for (let cell = 1; cell <= 25; cell++) {
        const { row, col } = numToRC(cell);
        if (row === 1 || row === 5 || col === 1 || col === 5) {
            if ((row === 1 || row === 5) && (col === 1 || col === 5)) cellWeights[cell] = 1;
            else cellWeights[cell] = 2;
        } else {
            cellWeights[cell] = 5;
        }
    }

    function generateConnectedSet(n) {
        if (n === 0) return new Set();
        const all = Array.from({length:25}, (_,i)=>i+1);
        let start = all[Math.floor(Math.random() * all.length)];
        let cells = new Set([start]);
        while (cells.size < n) {
            const candidates = new Set();
            for (let c of cells) {
                for (let nb of adjNum[c]) {
                    if (!cells.has(nb)) candidates.add(nb);
                }
            }
            if (candidates.size) {
                const arr = Array.from(candidates);
                cells.add(arr[Math.floor(Math.random() * arr.length)]);
            } else {
                const remaining = all.filter(c => !cells.has(c));
                if (!remaining.length) break;
                cells.add(remaining[Math.floor(Math.random() * remaining.length)]);
            }
        }
        return cells;
    }

    function randomPositionWithCounts(redCount, greenCount) {
        const total = redCount + greenCount;
        const allCells = Array.from({length:25}, (_,i)=>i+1);
        const weights = allCells.map(c => cellWeights[c]);
        const selected = [];
        while (selected.length < total) {
            let sum = 0;
            for (let i = 0; i < allCells.length; i++) {
                if (!selected.includes(allCells[i])) sum += weights[i];
            }
            let r = Math.random() * sum;
            let accum = 0;
            for (let i = 0; i < allCells.length; i++) {
                const cell = allCells[i];
                if (!selected.includes(cell)) {
                    accum += weights[i];
                    if (r <= accum) {
                        selected.push(cell);
                        break;
                    }
                }
            }
        }
        const colors = [];
        for (let i = 0; i < redCount; i++) colors.push('red');
        for (let i = 0; i < greenCount; i++) colors.push('green');
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        const pos = {};
        for (let i = 0; i < selected.length; i++) pos[selected[i]] = colors[i];
        return pos;
    }

    function getAllCapturesFromCell(cell, pos, player, path = []) {
        const { row, col } = numToRC(cell);
        const opponent = player === 'red' ? 'green' : 'red';
        let results = [];
        for (let nb of adjNum[cell]) {
            if (pos[nb] === opponent) {
                const nr = Math.floor((nb - 1) / 5) + 1;
                const nc = (nb - 1) % 5 + 1;
                const dr = nr - row;
                const dc = nc - col;
                const jumpR = nr + dr;
                const jumpC = nc + dc;
                if (jumpR >= 1 && jumpR <= 5 && jumpC >= 1 && jumpC <= 5) {
                    const jumpCell = rcToNum(jumpR, jumpC);
                    if (pos[jumpCell] === undefined) {
                        const newPath = [...path, { from: cell, to: jumpCell, captured: nb }];
                        const newPos = { ...pos };
                        delete newPos[nb];
                        delete newPos[cell];
                        newPos[jumpCell] = player;
                        const subResults = getAllCapturesFromCell(jumpCell, newPos, player, newPath);
                        if (subResults.length) {
                            results.push(...subResults);
                        } else {
                            results.push(newPath);
                        }
                    }
                }
            }
        }
        return results;
    }

    function hasAnyCapture(pos, player) {
        const opponent = player === 'red' ? 'green' : 'red';
        for (let cell in pos) {
            cell = Number(cell);
            if (pos[cell] === player) {
                for (let nb of adjNum[cell]) {
                    if (pos[nb] === opponent) {
                        const { row, col } = numToRC(cell);
                        const nr = Math.floor((nb - 1) / 5) + 1;
                        const nc = (nb - 1) % 5 + 1;
                        const dr = nr - row;
                        const dc = nc - col;
                        const jumpR = nr + dr;
                        const jumpC = nc + dc;
                        if (jumpR >= 1 && jumpR <= 5 && jumpC >= 1 && jumpC <= 5) {
                            const jumpCell = rcToNum(jumpR, jumpC);
                            if (pos[jumpCell] === undefined) return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function getAllMoves(pos, player) {
        const moves = [];
        for (let cell in pos) {
            cell = Number(cell);
            if (pos[cell] === player) {
                const sequences = getAllCapturesFromCell(cell, pos, player);
                for (let seq of sequences) {
                    let newPos = { ...pos };
                    for (let step of seq) {
                        delete newPos[step.captured];
                        delete newPos[step.from];
                        newPos[step.to] = player;
                    }
                    moves.push({ newPos, seq });
                }
            }
        }
        return moves;
    }

    const evalCache = new Map();

    function evaluate(pos, player, depth = 0, maxDepth = 8, alpha = -Infinity, beta = Infinity) {
        const key = JSON.stringify({ pos, player, depth });
        if (evalCache.has(key)) return evalCache.get(key);

        if (depth >= maxDepth) {
            return { winner: null, movesLeft: 0, sequence: [] };
        }

        let redCount = 0, greenCount = 0;
        for (let c in pos) {
            if (pos[c] === 'red') redCount++;
            else if (pos[c] === 'green') greenCount++;
        }
        if (redCount === 0) return { winner: 'green', movesLeft: 0, sequence: [] };
        if (greenCount === 0) return { winner: 'red', movesLeft: 0, sequence: [] };

        const moves = getAllMoves(pos, player);
        if (moves.length === 0) {
            const winner = player === 'red' ? 'green' : 'red';
            return { winner, movesLeft: 0, sequence: [] };
        }

        moves.sort((a,b) => b.seq.length - a.seq.length);

        let best = null;
        let bestScore = -Infinity;

        for (let move of moves) {
            const nextPlayer = player === 'red' ? 'green' : 'red';
            const res = evaluate(move.newPos, nextPlayer, depth + 1, maxDepth, alpha, beta);
            let score;
            if (res.winner === player) score = 1;
            else if (res.winner === null) score = 0;
            else score = -1;

            const totalMoves = 1 + (res.movesLeft || 0);
            const sequence = [move.seq, ...res.sequence];

            if (best === null || score > bestScore) {
                best = { winner: res.winner, movesLeft: totalMoves, sequence };
                bestScore = score;
            } else if (score === bestScore) {
                if (score === 1 && totalMoves < best.movesLeft) {
                    best = { winner: res.winner, movesLeft: totalMoves, sequence };
                } else if (score === -1 && totalMoves > best.movesLeft) {
                    best = { winner: res.winner, movesLeft: totalMoves, sequence };
                }
            }

            if (player === 'red') {
                alpha = Math.max(alpha, bestScore);
            } else {
                beta = Math.min(beta, bestScore);
            }
            if (alpha >= beta) break;
        }

        evalCache.set(key, best);
        return best;
    }

    function allStepsAreCaptures(seq) {
        for (let move of seq) {
            for (let step of move) {
                if (!step.captured) return false;
            }
        }
        return true;
    }

    function generateWinningTask(minMoves = 2, maxMoves = 4, maxAttempts = 100, moveWeights = null) {
        if (!moveWeights) {
            moveWeights = { 2:1, 3:1, 4:1 };
        }
        const comboWeights = [
            { combo: [2,2], weight: 2 },
            { combo: [2,3], weight: 2 }, { combo: [3,2], weight: 2 },
            { combo: [2,4], weight: 3 }, { combo: [4,2], weight: 3 },
            { combo: [3,4], weight: 3 }, { combo: [4,3], weight: 3 },
            { combo: [3,5], weight: 2 }, { combo: [5,3], weight: 2 },
            { combo: [4,4], weight: 2 },
            { combo: [5,5], weight: 1 }
        ];
        const combos = [];
        for (let cw of comboWeights) {
            for (let i = 0; i < cw.weight; i++) combos.push(cw.combo);
        }

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const [redCount, greenCount] = combos[Math.floor(Math.random() * combos.length)];
            const pos = randomPositionWithCounts(redCount, greenCount);

            if (!hasAnyCapture(pos, 'red')) continue;

            let hasAdjacent = false;
            for (let cell in pos) {
                cell = Number(cell);
                const color = pos[cell];
                const opponent = color === 'red' ? 'green' : 'red';
                for (let nb of adjNum[cell]) {
                    if (pos[nb] === opponent) {
                        hasAdjacent = true;
                        break;
                    }
                }
                if (hasAdjacent) break;
            }
            if (!hasAdjacent) continue;

            evalCache.clear();
            const result = evaluate(pos, 'red', 0, 8);
            if (!result || !result.winner) continue;
            const winner = result.winner;
            const moves = result.movesLeft;
            const seq = result.sequence;
            if ((winner === 'red' || winner === 'green') && moves >= minMoves && moves <= maxMoves) {
                const weight = moveWeights[moves] || 1;
                const totalWeight = Object.values(moveWeights).reduce((a,b)=>a+b,0);
                if (Math.random() * totalWeight > weight) continue;

                if (!seq.length || !seq[0].some(step => step.captured)) continue;
                if (!allStepsAreCaptures(seq)) continue;

                const options = [
                    { id: 'red', text: 'Красные' },
                    { id: 'green', text: 'Зеленые' }
                ];
                return {
                    question: "Ход красного игрока. Если игроки играют без ошибок, кто выиграет?",
                    answer_type: "single",
                    options: options,
                    correct: winner,
                    position: pos,
                    sequence: seq,
                    moves: moves,
                    highlights: {}
                };
            }
        }
        return {
            question: "Не удалось сгенерировать задачу. Попробуйте ещё раз.",
            answer_type: "single",
            options: [{ id: "red", text: "Красные" }, { id: "green", text: "Зеленые" }],
            correct: "red",
            position: {},
            highlights: {}
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["3"] = generateWinningTask;
	window.taskTitles = window.taskTitles || {};
	window.taskTitles["3"] = "🏆 Тип 3: Безошибочная победа";
	window.originalCenters = originalCenters;
})();
