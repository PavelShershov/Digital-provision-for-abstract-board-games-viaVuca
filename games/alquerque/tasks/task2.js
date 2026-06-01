
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
            if (adj[a]?.includes(b)) adj[a] = adj[a].filter(c => c !== b);
            if (adj[b]?.includes(a)) adj[b] = adj[b].filter(c => c !== a);
        }
        return adj;
    }
    const adjNum = buildAdjacency();

    function generateConnectedSet(n) {
        if (n === 0) return new Set();
        const all = Array.from({length:25}, (_,i)=>i+1);
        let start = all[Math.floor(Math.random()*all.length)];
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
                cells.add(arr[Math.floor(Math.random()*arr.length)]);
            } else {
                const remaining = all.filter(c => !cells.has(c));
                if (!remaining.length) break;
                cells.add(remaining[Math.floor(Math.random()*remaining.length)]);
            }
        }
        return cells;
    }

    function maxCaptureFromCell(cell, board, player) {
        let best = 0;
        const r = Math.floor((cell - 1) / 5) + 1;
        const c = (cell - 1) % 5 + 1;
        const opponent = (player === 'red') ? 'green' : 'red';
        for (let nb of adjNum[cell]) {
            if (board[nb] === opponent) {
                const nr = Math.floor((nb - 1) / 5) + 1;
                const nc = (nb - 1) % 5 + 1;
                const dr = nr - r;
                const dc = nc - c;
                const jump_r = nr + dr;
                const jump_c = nc + dc;
                if (jump_r >= 1 && jump_r <= 5 && jump_c >= 1 && jump_c <= 5) {
                    const jumpCell = rcToNum(jump_r, jump_c);
                    if (!(jumpCell in board)) {
                        const newBoard = { ...board };
                        delete newBoard[nb];
                        delete newBoard[cell];
                        newBoard[jumpCell] = player;
                        const next = maxCaptureFromCell(jumpCell, newBoard, player);
                        best = Math.max(best, 1 + next);
                    }
                }
            }
        }
        return best;
    }

    function maxCaptureForPlayer(board, player = 'green') {
        let best = 0;
        for (const [cell, color] of Object.entries(board)) {
            if (color === player) {
                const caps = maxCaptureFromCell(parseInt(cell), board, player);
                if (caps > best) best = caps;
            }
        }
        return best;
    }

    function findMaxCapturePath(board, player = 'green') {
        let bestPath = null;
        let bestLen = 0;
        for (const [cellStr, color] of Object.entries(board)) {
            if (color !== player) continue;
            const cell = parseInt(cellStr, 10);
            const result = dfsMaxPath(cell, board, player);
            if (result.len > bestLen) {
                bestLen = result.len;
                bestPath = { startCell: cell, capturedCells: result.path };
            }
        }
        return { len: bestLen, startCell: bestPath?.startCell, capturedCells: bestPath?.capturedCells || [] };
    }

    function dfsMaxPath(cell, board, player) {
        let bestSubLen = 0;
        let bestSubPath = [];
        const r = Math.floor((cell - 1) / 5) + 1;
        const c = (cell - 1) % 5 + 1;
        const opponent = (player === 'red') ? 'green' : 'red';
        for (let nb of adjNum[cell]) {
            if (board[nb] === opponent) {
                const nr = Math.floor((nb - 1) / 5) + 1;
                const nc = (nb - 1) % 5 + 1;
                const dr = nr - r;
                const dc = nc - c;
                const jump_r = nr + dr;
                const jump_c = nc + dc;
                if (jump_r >= 1 && jump_r <= 5 && jump_c >= 1 && jump_c <= 5) {
                    const jumpCell = rcToNum(jump_r, jump_c);
                    if (!(jumpCell in board)) {
                        const newBoard = { ...board };
                        delete newBoard[nb];
                        delete newBoard[cell];
                        newBoard[jumpCell] = player;
                        const sub = dfsMaxPath(jumpCell, newBoard, player);
                        if (1 + sub.len > bestSubLen) {
                            bestSubLen = 1 + sub.len;
                            bestSubPath = [nb, ...sub.path];
                        }
                    }
                }
            }
        }
        return { len: bestSubLen, path: bestSubPath };
    }

    function generateOptions(correct, minVal = 2, maxVal = 6, numOpt = 4) {
        const possible = [];
        for (let i = minVal; i <= maxVal; i++) if (i !== correct) possible.push(i);
        for (let i = possible.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possible[i], possible[j]] = [possible[j], possible[i]];
        }
        const distractors = possible.slice(0, numOpt - 1);
        while (distractors.length < numOpt - 1) distractors.push(minVal);
        const all = [correct, ...distractors];
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        return all.map(v => ({ id: v.toString(), text: v.toString() }));
    }

    function formatCapturedList(capturedCells) {
        if (capturedCells.length === 0) return '';
        if (capturedCells.length === 1) return capturedCells[0].toString();
        const last = capturedCells.pop();
        return capturedCells.join(', ') + ' и ' + last;
    }

    function getMaxCaptureExplanation(board, maxSeq, startCell, capturedCells) {
        if (maxSeq === 0) {
            return 'Нет зелёных фишек, которые могли бы срубить хотя бы одну красную фишку за один ход.';
        }
        const capturedFormatted = formatCapturedList([...capturedCells]);
        const verb = (maxSeq === 1) ? 'рубит' : 'рубит';
        const noun = (maxSeq === 1) ? 'фишку' : 'фишки';
        return `Зелёная фишка с клетки ${startCell} ${verb} красные на клетках ${capturedFormatted} (всего ${maxSeq} ${maxSeq === 1 ? 'взятие' : 'взятия'}).`;
    }

    function generateMaxCaptureTask() {
        const combosWithWeights = [
            [[2,5], 0.5], [[2,6], 1.0], [[3,5], 1.0],
            [[3,6], 2.0], [[4,6], 2.0], [[3,7], 0.2]
        ];
        const comboList = [];
        for (const [combo, weight] of combosWithWeights) {
            const times = Math.floor(weight * 10);
            for (let i = 0; i < times; i++) comboList.push(combo);
        }
        const probs = [0, 0, 0.05, 0.3, 0.3, 0.9, 0.9];
        const maxAttempts = 8000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const [g, r] = comboList[Math.floor(Math.random() * comboList.length)];
            const n = g + r;
            const cellsSet = generateConnectedSet(n);
            const cells = Array.from(cellsSet);
            for (let i = cells.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cells[i], cells[j]] = [cells[j], cells[i]];
            }
            const greenCells = cells.slice(0, g);
            const redCells = cells.slice(g);
            const board = {};
            for (const cell of greenCells) board[cell] = 'green';
            for (const cell of redCells) board[cell] = 'red';

            const maxSeq = maxCaptureForPlayer(board, 'green');
            if (maxSeq >= 2 && maxSeq <= 6) {
                const prob = probs[maxSeq];
                if (Math.random() < prob) {
                    const { startCell, capturedCells } = findMaxCapturePath(board, 'green');
                    const options = generateOptions(maxSeq);
                    const explanation = getMaxCaptureExplanation(board, maxSeq, startCell, capturedCells);
                    return {
                        question: "Какое максимальное количество фишек может срубить за один ход зелёный игрок?",
                        answer_type: "single",
                        options: options,
                        correct: String(maxSeq),
                        position: board,
                        highlights: {},
                        explanation: explanation
                    };
                }
            }
        }
        return {
            question: "⚠️ Задача 2: не удалось сгенерировать позицию. Попробуйте ещё раз.",
            answer_type: "single",
            options: [{ id: "0", text: "0" }],
            correct: "0",
            position: {},
            highlights: {},
            explanation: "Не удалось найти подходящую позицию."
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["2"] = generateMaxCaptureTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["2"] = "🌀 Тип 2: Максимальная серия взятий";
    window.originalCenters = originalCenters;
})();
