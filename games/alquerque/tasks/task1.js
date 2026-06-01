
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

    function rcToNum(row, col) {
        return (row - 1) * 5 + col;
    }

    function buildAdjacency() {
        const adj = {};
        for (let r = 1; r <= 5; r++) {
            for (let c = 1; c <= 5; c++) {
                const neighbors = [];
                if (c > 1) neighbors.push(rcToNum(r, c - 1));
                if (c < 5) neighbors.push(rcToNum(r, c + 1));
                if (r > 1) neighbors.push(rcToNum(r - 1, c));
                if (r < 5) neighbors.push(rcToNum(r + 1, c));
                if (r < 5 && c < 5) neighbors.push(rcToNum(r + 1, c + 1));
                if (r < 5 && c > 1) neighbors.push(rcToNum(r + 1, c - 1));
                if (r > 1 && c < 5) neighbors.push(rcToNum(r - 1, c + 1));
                if (r > 1 && c > 1) neighbors.push(rcToNum(r - 1, c - 1));
                adj[rcToNum(r, c)] = neighbors;
            }
        }

        const forbidden = [
            [2, 6], [2, 8], [4, 8], [4, 10],
            [6, 12], [8, 12], [8, 14], [10, 14],
            [12, 16], [12, 18], [14, 18], [14, 20],
            [16, 22], [18, 22], [18, 24], [20, 24]
        ];

        for (const [a, b] of forbidden) {
            if (adj[a]?.includes(b)) adj[a] = adj[a].filter(c => c !== b);
            if (adj[b]?.includes(a)) adj[b] = adj[b].filter(c => c !== a);
        }

        return adj;
    }

    const adjNum = buildAdjacency();

    function generateConnectedSet(n) {
        if (n === 0) return new Set();

        const all = Array.from({ length: 25 }, (_, i) => i + 1);
        const start = all[Math.floor(Math.random() * all.length)];
        const cells = new Set([start]);

        while (cells.size < n) {
            const candidates = new Set();

            for (const c of cells) {
                for (const nb of adjNum[c]) {
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

    function getPossibleJumpsWithInfo(cell, board, color) {
        const { row: r, col: c } = numToRC(cell);
        const opponent = color === 'red' ? 'green' : 'red';
        const jumps = [];

        for (const nb of adjNum[cell]) {
            if (board[nb] === opponent) {
                const { row: nr, col: nc } = numToRC(nb);
                const dr = nr - r;
                const dc = nc - c;
                const jump_r = nr + dr;
                const jump_c = nc + dc;

                if (jump_r >= 1 && jump_r <= 5 && jump_c >= 1 && jump_c <= 5) {
                    const jumpCell = rcToNum(jump_r, jump_c);
                    if (!(jumpCell in board)) {
                        jumps.push({ target: jumpCell, captured: nb });
                    }
                }
            }
        }

        return jumps;
    }

    function collectMovesFrom(cell, board, color, currentPath = []) {
        const jumps = getPossibleJumpsWithInfo(cell, board, color);
        let moves = [];

        for (const { target, captured } of jumps) {
            const newPath = [...currentPath, { from: cell, captured, to: target }];
            const newBoard = { ...board };
            delete newBoard[captured];
            delete newBoard[cell];
            newBoard[target] = color;

            const subMoves = collectMovesFrom(target, newBoard, color, newPath);

            if (subMoves.length === 0) {
                moves.push({ path: newPath, isMaximal: true });
            } else {
                moves.push({ path: newPath, isMaximal: false });
                for (const subMove of subMoves) {
                    moves.push(subMove);
                }
            }
        }

        return moves;
    }

    function getAllCaptureDescriptions(board) {
        const allMoves = [];

        for (const cellStr in board) {
            const cell = parseInt(cellStr, 10);
            const color = board[cell];
            const moves = collectMovesFrom(cell, board, color);

            for (const move of moves) {
                const path = move.path;
                const total = path.length;
                const isMaximal = move.isMaximal;
                const playerName = color === 'red' ? 'Красная' : 'Зелёная';
                const opponentColor = (c) => board[c] === 'red' ? 'красную' : 'зелёную';
                const opponentColorPlural = (c) => board[c] === 'red' ? 'красные' : 'зелёные';

                let description = '';
                const startCell = path[0].from;

                if (total === 1) {
                    const step = path[0];
                    if (!isMaximal) {
                        description = `${playerName} фишка с клетки ${startCell} рубит ${opponentColor(step.captured)} только на клетке ${step.captured} (делает 1 взятие, прерванная серия)`;
                    } else {
                        description = `${playerName} фишка с клетки ${startCell} рубит ${opponentColor(step.captured)} и перемещается на ${step.to} (делает 1 взятие)`;
                    }
                } else {
                    const capturedList = path.map(step => step.captured);
                    const pluralColor = opponentColorPlural(path[0].captured);
                    if (!isMaximal) {
                        description = `${playerName} фишка с клетки ${startCell} рубит ${pluralColor} только на клетках ${capturedList.join(' и ')} (делает ${total} взятия, прерванная серия)`;
                    } else {
                        description = `${playerName} фишка с клетки ${startCell} рубит ${pluralColor} на клетках ${capturedList.join(' и ')} (делает ${total} взятия)`;
                    }
                }

                allMoves.push(description);
            }
        }

        return allMoves;
    }

    function countAllCaptureMoves(board) {
        let total = 0;
        for (const cellStr in board) {
            const cell = parseInt(cellStr, 10);
            const moves = collectMovesFrom(cell, board, board[cell]);
            total += moves.length;
        }
        return total;
    }

    function generateDensePosition(minP = 5, maxP = 9, attempts = 800, acceptProbs = null, maxCaptures = 7) {
        if (!acceptProbs) {
            acceptProbs = [0.2, 0.2, 0.4, 0.5, 0.5, 0.5, 0.1, 0.05];
        }
        while (acceptProbs.length <= maxCaptures) acceptProbs.push(0.01);

        for (let i = 0; i < attempts; i++) {
            const n = Math.floor(Math.random() * (maxP - minP + 1)) + minP;
            const cellsSet = generateConnectedSet(n);
            const cells = Array.from(cellsSet);

            let redCount = Math.floor(n / 2);
            let greenCount = n - redCount;
            if (n % 2 === 1 && Math.random() < 0.5) {
                redCount++;
                greenCount--;
            }

            const colors = [];
            for (let j = 0; j < redCount; j++) colors.push('red');
            for (let j = 0; j < greenCount; j++) colors.push('green');

            for (let j = colors.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [colors[j], colors[k]] = [colors[k], colors[j]];
            }

            const pos = {};
            for (let j = 0; j < cells.length; j++) pos[cells[j]] = colors[j];

            const caps = countAllCaptureMoves(pos);
            if (caps <= maxCaptures) {
                const prob = acceptProbs[caps];
                if (Math.random() < prob) return pos;
            }
        }

        const n = Math.floor(Math.random() * (maxP - minP + 1)) + minP;
        const cellsSet = generateConnectedSet(n);
        const cells = Array.from(cellsSet);
        let redCount = Math.floor(n / 2);
        let greenCount = n - redCount;
        if (n % 2 === 1 && Math.random() < 0.5) {
            redCount++;
            greenCount--;
        }
        const colors = [];
        for (let j = 0; j < redCount; j++) colors.push('red');
        for (let j = 0; j < greenCount; j++) colors.push('green');
        for (let j = colors.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [colors[j], colors[k]] = [colors[k], colors[j]];
        }
        const pos = {};
        for (let j = 0; j < cells.length; j++) pos[cells[j]] = colors[j];
        return pos;
    }

    function generateOptions(correct, minVal = 0, maxVal = 7, numOpt = 4) {
        const radius = 2;
        let candidates = [];
        for (let i = Math.max(minVal, correct - radius); i <= Math.min(maxVal, correct + radius); i++) {
            if (i !== correct) candidates.push(i);
        }
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const needed = numOpt - 1;
        let distractors = candidates.slice(0, needed);
        if (distractors.length < needed) {
            const allNumbers = [];
            for (let i = minVal; i <= maxVal; i++) {
                if (i !== correct && !distractors.includes(i)) allNumbers.push(i);
            }
            for (let i = allNumbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
            }
            const extra = allNumbers.slice(0, needed - distractors.length);
            distractors.push(...extra);
        }

        const all = [correct, ...distractors];
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        return all.map(v => ({ id: v.toString(), text: v.toString() }));
    }

    function generateCaptureCountTask() {
        const probs = [0.2, 0.2, 0.4, 0.5, 0.5, 0.5, 0.1, 0.05];
        const pos = generateDensePosition(5, 9, 800, probs, 7);
        let correct = countAllCaptureMoves(pos);
        if (correct > 7) correct = 7;
        const opts = generateOptions(correct, 0, 7, 4);

        const descriptions = getAllCaptureDescriptions(pos);
        let explanation = '';
        if (descriptions.length > 0) {
            explanation = descriptions.join('; ');
        } else {
            explanation = 'На поле нет возможных ходов с рубкой.';
        }

        return {
            question: 'Сколько всего возможных ходов с рубкой (взятем) есть на поле?',
            answer_type: 'single',
            options: opts,
            correct: correct.toString(),
            position: pos,
            highlights: {},
            explanation: explanation
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["1"] = generateCaptureCountTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["1"] = "📊 Тип 1: Подсчёт всех ходов с рубкой";
    window.originalCenters = originalCenters;
})();
