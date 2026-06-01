
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

                    const nr = r + dr;
                    const nc = c + dc;

                    if (nr >= 1 && nr <= 7 && nc >= 1 && nc <= 7) {
                        const nb = (nr - 1) * 7 + nc;

                        ADJ[cell].push(nb);
                    }
                }
            }
        }
    }

    const DIRS = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    function rcToNum(r, c) {
        return (r - 1) * 7 + c;
    }

    function numToRc(num) {
        const row = Math.floor((num - 1) / 7) + 1;
        const col = (num - 1) % 7 + 1;

        return { row, col };
    }

    function isInside(row, col) {
        return row >= 1 && row <= 7 && col >= 1 && col <= 7;
    }

    function getOpponent(color) {
        return color === 'red' ? 'yellow' : 'red';
    }

    function countCapturesForMove(pos, fromCell, toCell, player) {
        if (!pos.hasOwnProperty(fromCell)) {
            return { count: 0, captured: [] };
        }

        if (toCell in pos) {
            return { count: 0, captured: [] };
        }

        const newPos = { ...pos };
        const color = newPos[fromCell];

        if (player && color !== player) {
            return { count: 0, captured: [] };
        }

        const opponent = getOpponent(color);

        delete newPos[fromCell];
        newPos[toCell] = color;

        const { row: r, col: c } = numToRc(toCell);
        const capturedSet = new Set();

        for (const [dr, dc] of DIRS) {
            let step = 1;

            while (true) {
                const nr = r + dr * step;
                const nc = c + dc * step;

                if (!isInside(nr, nc)) break;

                const ncell = rcToNum(nr, nc);

                if (ncell in newPos) {
                    if (newPos[ncell] === color) {
                        let allOpponent = true;
                        const capturedInLine = [];

                        for (let k = 1; k < step; k++) {
                            const kr = r + dr * k;
                            const kc = c + dc * k;
                            const kcell = rcToNum(kr, kc);

                            if (kcell === 25) continue;

                            const piece = newPos[kcell];

                            if (piece !== opponent) {
                                allOpponent = false;
                                break;
                            }

                            capturedInLine.push(kcell);
                        }

                        if (allOpponent && capturedInLine.length > 0) {
                            capturedInLine.forEach(cell => capturedSet.add(cell));
                        }

                        break;
                    }

                    step++;
                    continue;
                }

                break;
            }
        }

        const captured = Array.from(capturedSet).sort((a, b) => a - b);

        return {
            count: captured.length,
            captured: captured
        };
    }

    function applyMoveWithConvertedCaptures(pos, fromCell, toCell, player) {
        const result = countCapturesForMove(pos, fromCell, toCell, player);
        const newPos = { ...pos };
        const color = newPos[fromCell];

        delete newPos[fromCell];

        newPos[toCell] = color;

        for (const capturedCell of result.captured) {
            newPos[capturedCell] = color;
        }

        return {
            position: newPos,
            captured: result.captured
        };
    }

    function getCapturingMovesForRed(pos) {
        const moves = [];
        const redCells = Object.keys(pos)
            .filter(cell => pos[cell] === 'red')
            .map(Number);

        for (const fromCell of redCells) {
            const { row: r, col: c } = numToRc(fromCell);

            for (const [dr, dc] of DIRS) {
                const nr = r + dr;
                const nc = c + dc;

                if (!isInside(nr, nc)) continue;

                const toCell = rcToNum(nr, nc);

                if (toCell in pos) continue;

                const result = countCapturesForMove(pos, fromCell, toCell, 'red');

                if (result.count > 0) {
                    moves.push({
                        from: fromCell,
                        to: toCell,
                        captured: result.captured
                    });
                }
            }
        }

        return moves;
    }

    function getCapturingMovesForSameRedPiece(pos, fromCell) {
        const moves = [];

        if (!pos.hasOwnProperty(fromCell) || pos[fromCell] !== 'red') {
            return moves;
        }

        const { row: r, col: c } = numToRc(fromCell);

        for (const [dr, dc] of DIRS) {
            const nr = r + dr;
            const nc = c + dc;

            if (!isInside(nr, nc)) continue;

            const toCell = rcToNum(nr, nc);

            if (toCell in pos) continue;

            const result = countCapturesForMove(pos, fromCell, toCell, 'red');

            if (result.count > 0) {
                moves.push({
                    from: fromCell,
                    to: toCell,
                    captured: result.captured
                });
            }
        }

        return moves;
    }

    function getMaxCapturesForRedWithExtraMove(pos) {
        let best = 0;
        let bestSequences = [];

        const firstMoves = getCapturingMovesForRed(pos);

        for (const firstMove of firstMoves) {
            const afterFirst = applyMoveWithConvertedCaptures(
                pos,
                firstMove.from,
                firstMove.to,
                'red'
            );

            const secondMoves = getCapturingMovesForSameRedPiece(
                afterFirst.position,
                firstMove.to
            );

            if (secondMoves.length > 0) {
                for (const secondMove of secondMoves) {
                    const total = firstMove.captured.length + secondMove.captured.length;

                    const sequence = {
                        first: firstMove,
                        second: secondMove,
                        total: total
                    };

                    if (total > best) {
                        best = total;
                        bestSequences = [sequence];
                    } else if (total === best && total > 0) {
                        bestSequences.push(sequence);
                    }
                }
            } else {
                const total = firstMove.captured.length;

                const sequence = {
                    first: firstMove,
                    second: null,
                    total: total
                };

                if (total > best) {
                    best = total;
                    bestSequences = [sequence];
                } else if (total === best && total > 0) {
                    bestSequences.push(sequence);
                }
            }
        }

        bestSequences = bestSequences.filter(seq => seq.total === best);

        return {
            maxCap: best,
            bestSequences: bestSequences
        };
    }

    function maxCapturesForRedWithExtraMove(pos) {
        return getMaxCapturesForRedWithExtraMove(pos).maxCap;
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
        const colors = [
            ...Array(redCount).fill('red'),
            ...Array(yellowCount).fill('yellow')
        ];

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
            const redCells = Object.keys(pos)
                .filter(cell => pos[cell] === 'red')
                .map(Number);

            if (redCells.length === 0) break;

            const fromCell = redCells[Math.floor(Math.random() * redCells.length)];
            const { row: r1, col: c1 } = numToRc(fromCell);

            for (const [dr, dc] of DIRS) {
                for (let step = 3; step <= 6; step++) {
                    const r2 = r1 + dr * step;
                    const c2 = c1 + dc * step;

                    if (!isInside(r2, c2)) continue;

                    const toCell = rcToNum(r2, c2);

                    if (pos[toCell] === 'red') {
                        for (let k = 1; k < step; k++) {
                            const kr = r1 + dr * k;
                            const kc = c1 + dc * k;
                            const kcell = rcToNum(kr, kc);

                            if (kcell !== 25) {
                                pos[kcell] = 'yellow';
                            }
                        }

                        break;
                    }
                }
            }
        }

        return pos;
    }

    function isAcceptableGeneratedDetails(details) {
        if (!details) return false;
        if (details.maxCap < 2 || details.maxCap > 11) return false;
        if (!details.bestSequences || !details.bestSequences.length) return false;
        if (details.bestSequences.length > 2) return false;

        return true;
    }

    function getSequencePreferenceScore(details) {
        if (!details || !details.bestSequences) return 0;

        let score = 0;

        if (details.maxCap >= 4 && details.maxCap <= 8) {
            score += 100;
        } else if (details.maxCap === 3 || details.maxCap === 9) {
            score += 65;
        } else if (details.maxCap === 10 || details.maxCap === 11) {
            score += 60;
        } else if (details.maxCap === 2) {
            score += 10;
        }

        if (details.bestSequences.length === 1) {
            score += 45;
        } else if (details.bestSequences.length === 2) {
            score += 10;
        }

        return score;
    }

    function chooseTarget() {
        const targets = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

        const weights = [
            1,
            9,
            20,
            28,
            32,
            28,
            20,
            9,
            7,
            7
        ];

        let r = Math.random() * weights.reduce((a, b) => a + b, 0);
        let cum = 0;

        for (let i = 0; i < targets.length; i++) {
            cum += weights[i];

            if (r < cum) {
                return targets[i];
            }
        }

        return 6;
    }

    function generatePositionByTargetWithExtraMove(target, maxAttempts = 180) {
        let fallback = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos;

            if (Math.random() < 0.82) {
                pos = generateRichPosition();
            } else {
                pos = randomPosition(Math.floor(Math.random() * 5) + 20);
            }

            const details = getMaxCapturesForRedWithExtraMove(pos);

            if (details.maxCap !== target) continue;
            if (!isAcceptableGeneratedDetails(details)) continue;

            if (details.bestSequences.length === 1) {
                return { pos, details };
            }

            if (!fallback && details.bestSequences.length === 2) {
                fallback = { pos, details };
            }
        }

        return fallback;
    }

    function findAnyAcceptablePosition(maxAttempts = 160) {
        let bestFallback = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos;

            if (Math.random() < 0.82) {
                pos = generateRichPosition();
            } else {
                pos = randomPosition(Math.floor(Math.random() * 5) + 20);
            }

            const details = getMaxCapturesForRedWithExtraMove(pos);

            if (!isAcceptableGeneratedDetails(details)) continue;

            const score = getSequencePreferenceScore(details);

            if (!bestFallback || score > bestFallback.score) {
                bestFallback = {
                    score,
                    pos,
                    details
                };
            }

            if (
                details.maxCap >= 4 &&
                details.maxCap <= 8 &&
                details.bestSequences.length === 1
            ) {
                return { pos, details };
            }
        }

        if (bestFallback) {
            return {
                pos: bestFallback.pos,
                details: bestFallback.details
            };
        }

        return null;
    }

    function getSafeFallbackPosition() {
        return {
            11: 'red',
            18: 'yellow',
            23: 'red',
            24: 'yellow',
            26: 'red'
        };
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

    function formatYellowPieces(cells) {
        const cellsText = formatCellList(cells);

        if (cells.length === 1) {
            return `жёлтую фишку ${cellsText}`;
        }

        return `жёлтые фишки ${cellsText}`;
    }

    function formatSequenceLines(sequence) {
        const first = sequence.first;
        const second = sequence.second;
        const firstCount = first.captured.length;
        const lines = [];

        lines.push(
            `Красная фишка с клетки ${first.from} делает ход на клетку ${first.to} и зажимает ${formatYellowPieces(first.captured)} (${firstCount} ${getCaptureWord(firstCount)})`
        );

        if (second) {
            const secondCount = second.captured.length;

            lines.push(
                `В дополнительный ход фишка переходит на клетку ${second.to} и зажимает ${formatYellowPieces(second.captured)} (${secondCount} ${getCaptureWord(secondCount)})`
            );
        } else {
            lines.push('В дополнительный ход рубки нет');
        }

        lines.push(`Всего: ${sequence.total} ${getCaptureWord(sequence.total)}`);

        return lines;
    }

    function formatBestSequencesExplanation(maxCap, bestSequences) {
        if (!bestSequences || !bestSequences.length || maxCap <= 0) {
            return ['У красного игрока нет хода с рубкой.'];
        }

        const realBestSequences = bestSequences
            .filter(seq => seq.total === maxCap)
            .slice(0, 2);

        if (realBestSequences.length === 1) {
            return formatSequenceLines(realBestSequences[0]);
        }

        const lines = ['Есть несколько вариантов с одинаковым максимумом:'];

        realBestSequences.forEach((sequence, index) => {
            lines.push(`Вариант ${index + 1}:`);
            lines.push(...formatSequenceLines(sequence));
        });

        return lines;
    }

    function makeExplanation(lines) {
        return lines && lines.length
            ? lines.join('; ')
            : 'У красного игрока нет хода с рубкой.';
    }

    function makeOptions(correct) {
        const answers = new Set([
            correct,
            correct + 1,
            correct - 1,
            correct + 2,
            correct - 2
        ]);

        for (let v of [...answers]) {
            if (v < 2) {
                answers.delete(v);
            }
        }

        let answersArr = Array.from(answers).slice(0, 4);

        while (answersArr.length < 4) {
            for (let v = 2; v <= 13 && answersArr.length < 4; v++) {
                if (!answersArr.includes(v)) {
                    answersArr.push(v);
                }
            }
        }

        if (!answersArr.includes(correct)) {
            answersArr[0] = correct;
        }

        for (let i = answersArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [answersArr[i], answersArr[j]] = [answersArr[j], answersArr[i]];
        }

        return answersArr.map(v => ({
            id: String(v),
            text: String(v)
        }));
    }

    function generateMaxCaptureWithExtraMoveTask() {
        let generated = null;

        const target = chooseTarget();

        generated = generatePositionByTargetWithExtraMove(target);

        if (!generated) {
            generated = findAnyAcceptablePosition();
        }

        if (!generated) {
            const fallbackPos = getSafeFallbackPosition();
            const fallbackDetails = getMaxCapturesForRedWithExtraMove(fallbackPos);

            generated = {
                pos: fallbackPos,
                details: fallbackDetails
            };
        }

        let pos = generated.pos;
        let details = generated.details;

        if (!isAcceptableGeneratedDetails(details)) {
            const fallbackPos = getSafeFallbackPosition();
            const fallbackDetails = getMaxCapturesForRedWithExtraMove(fallbackPos);

            pos = fallbackPos;
            details = fallbackDetails;
        }

        const correct = details.maxCap;
        const options = makeOptions(correct);
        const bestSequencesDesc = formatBestSequencesExplanation(
            correct,
            details.bestSequences
        );

        return {
            question: "Какое максимальное количество фишек может срубить за один ход красный игрок? (с дополнительным ходом)",
            answer_type: "single",
            options: options,
            correct: String(correct),
            position: pos,
            best_sequences: details.bestSequences,
            best_moves: bestSequencesDesc,
            explanation: makeExplanation(bestSequencesDesc),
            highlights: {}
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["7"] = generateMaxCaptureWithExtraMoveTask;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["7"] = "🔥 Максимальная рубка красных с дополнительным ходом (Сиджа)";

    window.originalCenters = originalCenters;
})();
