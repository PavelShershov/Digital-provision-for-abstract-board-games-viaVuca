
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
            if ((row === 1 || row === 5) && (col === 1 || col === 5)) {
                cellWeights[cell] = 1;
            } else {
                cellWeights[cell] = 2;
            }
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
        const weights = allCells.map(cell => cellWeights[cell]);

        const selected = [];
        const indices = [...allCells];
        while (selected.length < total) {
            let totalWeight = 0;
            for (let i = 0; i < indices.length; i++) {
                totalWeight += cellWeights[indices[i]];
            }
            let r = Math.random() * totalWeight;
            let chosenIdx = 0;
            for (let i = 0; i < indices.length; i++) {
                r -= cellWeights[indices[i]];
                if (r <= 0) {
                    chosenIdx = i;
                    break;
                }
            }
            const chosen = indices[chosenIdx];
            selected.push(chosen);
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
        for (let i = 0; i < selected.length; i++) {
            pos[selected[i]] = colors[i];
        }
        return pos;
    }

    function maxCaptureFromCell(cell, board, player) {
        let best = 0;
        const r = Math.floor((cell - 1) / 5) + 1;
        const c = (cell - 1) % 5 + 1;
        const opponent = player === 'red' ? 'green' : 'red';
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

    function generateBestGreenTask() {
        const combos = [
            [2, 3], [2, 4], [3, 4], [3, 5], [4, 5], [2, 5], [3, 6]
        ];
        const comboWeights = [1, 2, 3, 3, 2, 1, 1];
        const captureWeights = { 2: 5, 3: 4, 4: 2, 5: 1 };
        const totalCaptureWeight = Object.values(captureWeights).reduce((a, b) => a + b, 0);

        for (let attempt = 0; attempt < 400; attempt++) {
            let r = Math.random() * comboWeights.reduce((a, b) => a + b, 0);
            let idx = 0;
            for (let i = 0; i < comboWeights.length; i++) {
                if (r < comboWeights[i]) { idx = i; break; }
                r -= comboWeights[i];
            }
            const [greenCount, redCount] = combos[idx];
            const pos = randomPositionWithWeights(redCount, greenCount);

            const greenCells = Object.keys(pos).filter(cell => pos[cell] === 'green').map(Number);
            if (greenCells.length === 0) continue;

            const caps = {};
            let allCanCapture = true;
            for (const cell of greenCells) {
                const cap = maxCaptureFromCell(cell, pos, 'green');
                caps[cell] = cap;
                if (cap === 0) {
                    allCanCapture = false;
                    break;
                }
            }
            if (!allCanCapture) continue;

            const maxCap = Math.max(...Object.values(caps));
            if (maxCap < 2) continue;

            if (greenCount > 2) {
                if (maxCap < 3) continue;
                const cellsGe2 = greenCells.filter(cell => caps[cell] >= 2);
                if (cellsGe2.length < 2) continue;
            }

            const weight = captureWeights[maxCap] || 1;
            if (Math.random() * totalCaptureWeight > weight) continue;

            const bestCells = greenCells.filter(cell => caps[cell] === maxCap);
            if (bestCells.length !== 1) continue;
            const bestCell = bestCells[0];

            const shuffled = [...greenCells];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const greenNumbers = {};
            for (let i = 0; i < shuffled.length; i++) greenNumbers[shuffled[i]] = i + 1;

            const correct = greenNumbers[bestCell].toString();
            const options = greenCells.map(cell => ({
                id: greenNumbers[cell].toString(),
                text: greenNumbers[cell].toString()
            }));
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                question: "За ход какой фишкой, зелёный игрок может срубить больше фишек соперника? (Выберите номер фишки)",
                answer_type: "single",
                options: options,
                correct: correct,
                position: pos,
                green_numbers: greenNumbers,
                highlights: {}
            };
        }
        return {
            question: "⚠️ Задача 4: не удалось сгенерировать позицию. Попробуйте ещё раз.",
            answer_type: "single",
            options: [{ id: "0", text: "0" }],
            correct: "0",
            position: {},
            highlights: {}
        };
    }

    function drawGreenNumbers(ctx, centers, greenNumbers, pieceSize) {
        if (!greenNumbers) return;
        ctx.font = `bold ${Math.floor(pieceSize * 0.4)}px "Inter", system-ui`;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const cellStr in greenNumbers) {
            const cell = parseInt(cellStr, 10);
            const num = greenNumbers[cell];
            const orig = centers[cell];
            if (!orig) continue;
            ctx.fillText(num.toString(), orig.x, orig.y);
        }
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

	window.taskGenerators = window.taskGenerators || {};
	window.taskGenerators["4"] = generateBestGreenTask;
	window.taskTitles = window.taskTitles || {};
	window.taskTitles["4"] = "🎯 Тип 4: Наиболее выгодный ход";
	window.originalCenters = originalCenters;
	window.drawGreenNumbers = drawGreenNumbers;
})();
