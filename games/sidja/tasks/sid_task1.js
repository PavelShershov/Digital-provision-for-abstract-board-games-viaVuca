(() => {
	const BOARD_SIZE = 3426;
	const GRID_SIZE = 2486;
	const GRID_OFFSET_X = (BOARD_SIZE - GRID_SIZE) / 2;
	const GRID_OFFSET_Y = (BOARD_SIZE - GRID_SIZE) / 2;

	const CELL_SIZE = GRID_SIZE / 7;

	const start_x = GRID_OFFSET_X + CELL_SIZE / 2;
	const start_y = GRID_OFFSET_Y + CELL_SIZE / 2;

	const dx = CELL_SIZE;
	const dy = CELL_SIZE;

	const SHIFT_X = 0;
	const SHIFT_Y = 0;

	const originalCenters = {};
	for (let row = 1; row <= 7; row++) {
		for (let col = 1; col <= 7; col++) {
			const cell = (row - 1) * 7 + col;
			const x = start_x + (col - 1) * dx + SHIFT_X;
			const y = start_y + (row - 1) * dy + SHIFT_Y;
			originalCenters[cell] = { x, y };
		}
	}

    const ADJ = {};
    for (let r = 1; r <= 7; r++) {
        for (let c = 1; c <= 7; c++) {
            const cell = (r - 1) * 7 + c;
            ADJ[cell] = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                        const nb = (nr - 1) * 7 + nc;
                        ADJ[cell].push(nb);
                    }
                }
            }
        }
    }

    function rcToNum(r, c) {
        return (r - 1) * 7 + c;
    }

    function numToRc(num) {
        const row = Math.floor((num - 1) / 7) + 1;
        const col = (num - 1) % 7 + 1;
        return { row, col };
    }

    function countCapturesForMove(pos, fromCell, toCell, player) {
        if (toCell in pos) return { count: 0, captured: [] };

        const newPos = { ...pos };
        const color = newPos[fromCell];

        delete newPos[fromCell];
        newPos[toCell] = color;

        const { row: r, col: c } = numToRc(toCell);
        const capturedSet = new Set();

        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

        for (const [dr, dc] of dirs) {
            let step = 1;

            while (true) {
                const nr = r + dr * step;
                const nc = c + dc * step;

                if (nr < 1 || nr > 7 || nc < 1 || nc > 7) break;

                const ncell = rcToNum(nr, nc);

                if (ncell in newPos) {
                    if (newPos[ncell] === color) {
                        let allOpponent = true;

                        for (let k = 1; k < step; k++) {
                            const kr = r + dr * k;
                            const kc = c + dc * k;
                            const kcell = rcToNum(kr, kc);

                            if (kcell === 25) continue;

                            const piece = newPos[kcell];

                            if (piece !== (color === 'red' ? 'yellow' : 'red')) {
                                allOpponent = false;
                                break;
                            }
                        }

                        if (allOpponent) {
                            for (let k = 1; k < step; k++) {
                                const kr = r + dr * k;
                                const kc = c + dc * k;
                                const kcell = rcToNum(kr, kc);

                                if (kcell !== 25) capturedSet.add(kcell);
                            }
                        }

                        break;
                    } else {
                        step++;
                        continue;
                    }
                } else {
                    break;
                }

                step++;
            }
        }

        return {
            count: capturedSet.size,
            captured: Array.from(capturedSet)
        };
    }

    function maxCapturesForRed(pos) {
        let best = 0;
        const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

        for (const fromCell of redCells) {
            const { row: r, col: c } = numToRc(fromCell);

            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                    const toCell = rcToNum(nr, nc);

                    if (!(toCell in pos)) {
                        const { count } = countCapturesForMove(pos, fromCell, toCell, 'red');

                        if (count > best) best = count;
                    }
                }
            }
        }

        return best;
    }

    function getMaxCapturesForRedDetails(pos) {
        let best = 0;
        let bestMoves = [];

        const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

        for (const fromCell of redCells) {
            const { row: r, col: c } = numToRc(fromCell);

            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                    const toCell = rcToNum(nr, nc);

                    if (!(toCell in pos)) {
                        const result = countCapturesForMove(pos, fromCell, toCell, 'red');
                        const count = result.count;
                        const captured = result.captured.slice().sort((a, b) => a - b);

                        if (count > best) {
                            best = count;
                            bestMoves = [{
                                from: fromCell,
                                to: toCell,
                                captured: captured
                            }];
                        } else if (count === best && best > 0) {
                            bestMoves.push({
                                from: fromCell,
                                to: toCell,
                                captured: captured
                            });
                        }
                    }
                }
            }
        }

        bestMoves = bestMoves.filter(move => move.captured.length === best);

        return {
            maxCap: best,
            bestMoves: bestMoves
        };
    }

    function randomPosition(total) {
        const allCells = [...Array(49).keys()].map(i => i + 1);

        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }

        const selected = allCells.slice(0, total);
        const redCount = Math.floor(total / 2);
        const yellowCount = total - redCount;
        const colors = [...Array(redCount).fill('red'), ...Array(yellowCount).fill('yellow')];

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

    function generateRichPosition() {
        const total = Math.floor(Math.random() * 5) + 20;
        let pos = randomPosition(total);

        for (let attempt = 0; attempt < 5; attempt++) {
            const redCells = Object.keys(pos).filter(cell => pos[cell] === 'red').map(Number);

            if (redCells.length === 0) break;

            const r1Idx = Math.floor(Math.random() * redCells.length);
            const fromCell = redCells[r1Idx];
            const { row: r1, col: c1 } = numToRc(fromCell);
            const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

            for (const [dr, dc] of dirs) {
                for (let step = 3; step <= 6; step++) {
                    const r2 = r1 + dr * step;
                    const c2 = c1 + dc * step;

                    if (r2 < 1 || r2 > 7 || c2 < 1 || c2 > 7) continue;

                    const toCell = rcToNum(r2, c2);

                    if (pos[toCell] === 'red') {
                        for (let k = 1; k < step; k++) {
                            const kr = r1 + dr * k;
                            const kc = c1 + dc * k;
                            const kcell = rcToNum(kr, kc);

                            if (kcell !== 25) pos[kcell] = 'yellow';
                        }

                        break;
                    }
                }
            }
        }

        return pos;
    }

    function generatePositionByTarget(target, maxAttempts = 300) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos;

            if (Math.random() < 0.8) {
                pos = generateRichPosition();
            } else {
                pos = randomPosition(Math.floor(Math.random() * 5) + 20);
            }

            const maxCap = maxCapturesForRed(pos);

            if (maxCap === target) return pos;
        }

        return randomPosition(22);
    }

    function formatCellList(cells) {
        return cells.slice().sort((a, b) => a - b).join(', ');
    }

    function getCaptureWord(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;

        if (mod10 === 1 && mod100 !== 11) {
            return 'взятие';
        }

        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
            return 'взятия';
        }

        return 'взятий';
    }

    function formatBestMoveLine(move) {
        const count = move.captured.length;
        const cellsText = formatCellList(move.captured);

        if (count === 1) {
            return `Красная фишка с клетки ${move.from} делает ход на клетку ${move.to} и зажимает жёлтую фишку ${cellsText} (всего ${count} ${getCaptureWord(count)})`;
        }

        return `Красная фишка с клетки ${move.from} делает ход на клетку ${move.to} и зажимает жёлтые фишки ${cellsText} (всего ${count} ${getCaptureWord(count)})`;
    }

    function formatBestMovesExplanation(maxCap, bestMoves) {
        if (!bestMoves || !bestMoves.length || maxCap <= 0) {
            return ['У красного игрока нет хода с рубкой.'];
        }

        const realBestMoves = bestMoves.filter(move => move.captured.length === maxCap);
        const lines = realBestMoves.map(formatBestMoveLine);

        if (lines.length === 1) {
            return lines;
        }

        return [
            'Есть несколько вариантов с одинаковым максимумом:',
            ...lines
        ];
    }

    function makeExplanation(lines) {
        return lines && lines.length
            ? lines.join('; ')
            : 'У красного игрока нет хода с рубкой.';
    }

    function generateMaxCaptureTask() {
        const targets = [1,2,3,4,5,6,7,8];
        const weights = [1,1,3,5,20,20,20,1];

        let r = Math.random() * weights.reduce((a, b) => a + b, 0);
        let cum = 0;
        let target = 3;

        for (let i = 0; i < targets.length; i++) {
            cum += weights[i];

            if (r < cum) {
                target = targets[i];
                break;
            }
        }

        const pos = generatePositionByTarget(target);
        const details = getMaxCapturesForRedDetails(pos);
        const correct = details.maxCap;

        const answers = new Set([correct, correct + 1, correct - 1, correct + 2, correct - 2]);

        for (let v of [...answers]) {
            if (v < 0) answers.delete(v);
        }

        let answersArr = Array.from(answers).slice(0, 4);

        while (answersArr.length < 4) {
            answersArr.push(correct + answersArr.length);
        }

        for (let i = answersArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answersArr[i], answersArr[j]] = [answersArr[j], answersArr[i]];
        }

        const options = answersArr.map(v => ({
            id: String(v),
            text: String(v)
        }));

        const bestMovesDesc = formatBestMovesExplanation(correct, details.bestMoves);

        return {
            question: "Какое максимальное количество фишек может срубить за один ход красный игрок? (без дополнительного хода)",
            answer_type: "single",
            options: options,
            correct: String(correct),
            position: pos,
            best_moves: bestMovesDesc,
            explanation: makeExplanation(bestMovesDesc),
            highlights: {}
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["4"] = generateMaxCaptureTask;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["4"] = "🔥 Максимальная рубка красных (Сиджа)";

    window.originalCenters = originalCenters;
})();
