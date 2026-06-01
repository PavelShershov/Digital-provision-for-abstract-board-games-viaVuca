
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

    const cellWeights = {};
    for (let cell = 1; cell <= 25; cell++) {
        const { row, col } = numToRC(cell);
        if (row === 1 || row === 5 || col === 1 || col === 5) {
            cellWeights[cell] = (row === 1 || row === 5) && (col === 1 || col === 5) ? 1 : 2;
        } else {
            cellWeights[cell] = 5;
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

    function randomPositionWithWeights(redCount, greenCount) {
        const total = redCount + greenCount;
        const allCells = Array.from({ length: 25 }, (_, i) => i + 1);
        const selected = [];
        const indices = [...allCells];
        while (selected.length < total) {
            let totalWeight = 0;
            for (let i = 0; i < indices.length; i++) totalWeight += cellWeights[indices[i]];
            let r = Math.random() * totalWeight;
            let chosenIdx = 0;
            for (let i = 0; i < indices.length; i++) {
                r -= cellWeights[indices[i]];
                if (r <= 0) { chosenIdx = i; break; }
            }
            selected.push(indices[chosenIdx]);
            indices.splice(chosenIdx, 1);
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

    function getAllCapturesFromCell(cell, board, player, path = []) {
        const r = Math.floor((cell - 1) / 5) + 1;
        const c = (cell - 1) % 5 + 1;
        const opponent = player === 'red' ? 'green' : 'red';
        const results = [];
        for (const nb of adjNum[cell]) {
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
                        const newPath = [...path, { from: cell, to: jumpCell, captured: nb }];
                        const newBoard = { ...board };
                        delete newBoard[nb];
                        delete newBoard[cell];
                        newBoard[jumpCell] = player;
                        const sub = getAllCapturesFromCell(jumpCell, newBoard, player, newPath);
                        if (sub.length) results.push(...sub);
                        else results.push(newPath);
                    }
                }
            }
        }
        return results;
    }

    function hasAnyCapture(board, player) {
        for (const cell in board) {
            if (board[cell] === player) {
                if (getAllCapturesFromCell(parseInt(cell), board, player).length) return true;
            }
        }
        return false;
    }

    function getAllLegalMovesForCell(cell, board, player) {
        const captures = getAllCapturesFromCell(cell, board, player);
        if (captures.length) {
            return captures.map(seq => seq.map(step => step.to));
        } else {
            const simple = [];
            for (const nb of adjNum[cell]) {
                if (!(nb in board)) simple.push([nb]);
            }
            return simple;
        }
    }

    function generateTask5() {
        const combos = [
            [5, 3], [6, 4], [6, 3], [4, 4]
        ];
        const comboWeights = [3, 3, 2, 2];
        for (let attempt = 0; attempt < 300; attempt++) {
            let r = Math.random() * comboWeights.reduce((a, b) => a + b, 0);
            let idx = 0;
            for (let i = 0; i < comboWeights.length; i++) {
                if (r < comboWeights[i]) { idx = i; break; }
                r -= comboWeights[i];
            }
            const [redCount, greenCount] = combos[idx];
            const pos = randomPositionWithWeights(redCount, greenCount);
            const redCells = Object.keys(pos).filter(c => pos[c] === 'red').map(Number);
            if (redCells.length === 0) continue;
            const shuffledRed = [...redCells];
            for (let i = shuffledRed.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledRed[i], shuffledRed[j]] = [shuffledRed[j], shuffledRed[i]];
            }
            let selectedCell = null;
            let legalMoves = [];
            for (const cell of shuffledRed) {
                const moves = getAllLegalMovesForCell(cell, pos, 'red');
                if (moves.length) {
                    selectedCell = cell;
                    legalMoves = moves;
                    break;
                }
            }
            if (!selectedCell) continue;

            const correctAnswers = [];
            for (const move of legalMoves) {
                if (move.length === 1) {
                    correctAnswers.push(move[0].toString());
                } else {
                    correctAnswers.push(move.join('-'));
                }
            }

            const wrongAnswers = new Set();
            const allCellsSet = new Set(Array.from({ length: 25 }, (_, i) => i + 1));
            const occupied = new Set(Object.keys(pos).map(Number));
            const possibleTargets = Array.from(allCellsSet).filter(c => !occupied.has(c));
            while (wrongAnswers.size < 4 && possibleTargets.length) {
                const rand = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                if (!legalMoves.some(m => m.length === 1 && m[0] === rand)) {
                    wrongAnswers.add(rand.toString());
                }
            }
            for (const good of correctAnswers) {
                if (good.includes('-')) {
                    const parts = good.split('-').map(Number);
                    for (let len = 1; len < parts.length; len++) {
                        const prefix = parts.slice(0, len).join('-');
                        if (!correctAnswers.includes(prefix) && !wrongAnswers.has(prefix)) {
                            wrongAnswers.add(prefix);
                        }
                    }
                    const last = parts[parts.length - 1];
                    const neighbors = adjNum[last] || [];
                    for (const nb of neighbors) {
                        if (!parts.includes(nb) && !(nb in pos)) {
                            const fakeSeq = [...parts, nb].join('-');
                            if (!correctAnswers.includes(fakeSeq) && !wrongAnswers.has(fakeSeq)) {
                                wrongAnswers.add(fakeSeq);
                            }
                        }
                    }
                }
            }
            let wrongArray = Array.from(wrongAnswers);
            if (wrongArray.length > 6) wrongArray = wrongArray.slice(0, 6);
            const allOptions = [...correctAnswers, ...wrongArray];
            for (let i = allOptions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
            }
            const options = allOptions.map(opt => ({ id: opt, text: opt }));

            const allTargetCells = new Set();
            for (const opt of allOptions) {
                const parts = opt.split('-').map(Number);
                parts.forEach(p => allTargetCells.add(p));
            }
            for (const good of correctAnswers) {
                good.split('-').map(Number).forEach(p => allTargetCells.add(p));
            }
            const targetArray = Array.from(allTargetCells);
            for (let i = targetArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [targetArray[i], targetArray[j]] = [targetArray[j], targetArray[i]];
            }
            const targets = {};
            for (let i = 0; i < targetArray.length; i++) {
                targets[targetArray[i]] = (i + 1).toString();
            }

            return {
                question: "На какие места на поле можно сходить красной фишкой, выделенной жёлтым? Выберите все разрешённые правилами варианты. В ответах серия обозначается через дефис.",
                answer_type: "multiple",
                options: options,
                correct: correctAnswers,
                position: pos,
                highlighted_cell: selectedCell,
                targets: targets,
                highlights: {}
            };
        }
        return {
            question: "⚠️ Задача 5: не удалось сгенерировать позицию. Попробуйте ещё раз.",
            answer_type: "multiple",
            options: [{ id: "0", text: "0" }],
            correct: [],
            position: {},
            highlighted_cell: null,
            targets: {},
            highlights: {}
        };
    }

	window.taskGenerators = window.taskGenerators || {};
	window.taskGenerators["5"] = generateTask5;
	window.taskTitles = window.taskTitles || {};
	window.taskTitles["5"] = "🎯 Тип 5: Возможные ходы (выбери все варианты)";
	window.originalCenters = originalCenters;
})();
