
(() => {
    const ROWS = 11;
    const COLS = 11;
    const THRONE = 61;
    const FORTRESSES = new Set([1, 11, 111, 121]);

	const REAL_SIZE = 3426;
	const PLAY_SIZE = 3189;

	const PLAY_OFFSET_X = (REAL_SIZE - PLAY_SIZE) / 2;
	const PLAY_OFFSET_Y = (REAL_SIZE - PLAY_SIZE) / 2;

	const CELL_SIZE = PLAY_SIZE / 11;

	const START_X = PLAY_OFFSET_X + CELL_SIZE / 2;
	const START_Y = PLAY_OFFSET_Y + CELL_SIZE / 2;

	const STEP_X = CELL_SIZE;
	const STEP_Y = CELL_SIZE;

	const SHIFT_X = 0;
	const SHIFT_Y = 0;

	const originalCenters = {};
	let cellId = 1;

	for (let row = 1; row <= ROWS; row++) {
		for (let col = 1; col <= COLS; col++) {
			const x = START_X + (col - 1) * STEP_X + SHIFT_X;
			const y = START_Y + (row - 1) * STEP_Y + SHIFT_Y;

			originalCenters[cellId++] = { x, y };
		}
	}
    function initialPosition() {
        const pos = {};
        pos[THRONE] = 'king';
        const defenders = [39, 49, 50, 51, 59, 60, 62, 63, 71, 72, 73, 83];
        defenders.forEach(c => pos[c] = 'green');
        const vikings = [
            4,5,6,7,8,17, 34,45,56,57,67,78,
            44,55,66,77,88,65, 105,114,115,116,117,118
        ];
        vikings.forEach(c => pos[c] = 'red');
        return pos;
    }

    function numToRc(num) {
        const row = Math.floor((num - 1) / COLS);
        const col = (num - 1) % COLS;
        return { row, col };
    }

    function rcToNum(row, col) {
        return row * COLS + col + 1;
    }

    function getMoves(pos, cell) {
        if (!pos.hasOwnProperty(cell)) return [];
        const piece = pos[cell];
        const { row: r, col: c } = numToRc(cell);
        const moves = [];
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

        for (const [dr, dc] of dirs) {
            if (piece === 'king') {
                let nr1 = r + dr, nc1 = c + dc;

                if (nr1 >= 0 && nr1 < ROWS && nc1 >= 0 && nc1 < COLS) {
                    const ncell1 = rcToNum(nr1, nc1);

                    if (ncell1 === THRONE) {
                        let nr2 = nr1 + dr, nc2 = nc1 + dc;

                        if (nr2 >= 0 && nr2 < ROWS && nc2 >= 0 && nc2 < COLS) {
                            const ncell2 = rcToNum(nr2, nc2);

                            if (!pos.hasOwnProperty(ncell2)) moves.push(ncell2);
                        }
                    } else if (!pos.hasOwnProperty(ncell1)) {
                        moves.push(ncell1);

                        let nr2 = nr1 + dr, nc2 = nc1 + dc;

                        if (nr2 >= 0 && nr2 < ROWS && nc2 >= 0 && nc2 < COLS) {
                            const ncell2 = rcToNum(nr2, nc2);

                            if (ncell2 !== THRONE && !pos.hasOwnProperty(ncell2)) moves.push(ncell2);
                        }
                    }
                }
            } else {
                for (let step = 1; step <= 100; step++) {
                    const nr = r + dr * step, nc = c + dc * step;

                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;

                    const ncell = rcToNum(nr, nc);

                    if (ncell === THRONE || FORTRESSES.has(ncell)) break;
                    if (pos.hasOwnProperty(ncell)) break;

                    moves.push(ncell);
                }
            }
        }

        return moves;
    }

    function isEnemyOrFortress(cell, attackerColor, pos) {
        if (cell === undefined) return false;
        if (FORTRESSES.has(cell)) return true;
        if (cell === THRONE) return !pos.hasOwnProperty(cell);

        return pos[cell] === attackerColor;
    }

    function isCapturedOrdinary(cell, pos, attackerColor) {
        if (!pos.hasOwnProperty(cell) || pos[cell] === 'king') return false;

        const { row: r, col: c } = numToRc(cell);

        const left = c > 0 ? rcToNum(r, c - 1) : undefined;
        const right = c < COLS - 1 ? rcToNum(r, c + 1) : undefined;
        const leftOk = isEnemyOrFortress(left, attackerColor, pos);
        const rightOk = isEnemyOrFortress(right, attackerColor, pos);

        if (leftOk && rightOk) return true;

        const up = r > 0 ? rcToNum(r - 1, c) : undefined;
        const down = r < ROWS - 1 ? rcToNum(r + 1, c) : undefined;
        const upOk = isEnemyOrFortress(up, attackerColor, pos);
        const downOk = isEnemyOrFortress(down, attackerColor, pos);

        if (upOk && downOk) return true;

        return false;
    }

    function isCapturedKing(cell, pos, attackerColor) {
        if (pos[cell] !== 'king') return false;
        if (cell === THRONE) return false;

        const { row: r, col: c } = numToRc(cell);
        let enemyCount = 0;
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;

            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
                enemyCount++;
            } else {
                const ncell = rcToNum(nr, nc);

                if (isEnemyOrFortress(ncell, attackerColor, pos)) enemyCount++;
            }
        }

        return enemyCount >= 4;
    }

    function wouldBeCapturedAfterMove(pos, fromCell, toCell, playerColor) {
        if (pos.hasOwnProperty(toCell)) return new Set();

        const newPos = { ...pos };
        const piece = newPos[fromCell];

        delete newPos[fromCell];

        newPos[toCell] = piece;

        const opponentColor = playerColor === 'green' ? 'red' : 'green';
        const captured = new Set();
        const cellsToCheck = new Set();

        for (const cell of [toCell, fromCell]) {
            const { row: r, col: c } = numToRc(cell);

            for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nr = r + dr, nc = c + dc;

                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    cellsToCheck.add(rcToNum(nr, nc));
                }
            }

            cellsToCheck.add(cell);
        }

        for (const cell of cellsToCheck) {
            if (!newPos.hasOwnProperty(cell)) continue;

            const col = newPos[cell];

            if (col === opponentColor) {
                if (isCapturedOrdinary(cell, newPos, playerColor)) captured.add(cell);
            } else if (col === 'king' && playerColor === opponentColor) {
                if (isCapturedKing(cell, newPos, playerColor)) captured.add(cell);
            }
        }

        return captured;
    }

    function randomizePosition(basePos, steps = 15) {
        const pos = { ...basePos };

        if (!Object.values(pos).includes('king')) return null;

        for (let s = 0; s < steps; s++) {
            const cells = Object.keys(pos).map(Number);

            for (let i = cells.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));

                [cells[i], cells[j]] = [cells[j], cells[i]];
            }

            let moved = false;

            for (const cell of cells) {
                const moves = getMoves(pos, cell);

                if (moves.length) {
                    const toCell = moves[Math.floor(Math.random() * moves.length)];
                    const piece = pos[cell];

                    delete pos[cell];

                    pos[toCell] = piece;
                    moved = true;

                    break;
                }
            }

            if (!moved) break;
        }

        if (!Object.values(pos).includes('king')) return null;

        return pos;
    }

    function generateSparsePosition() {
        const total = Math.floor(Math.random() * (24 - 12 + 1)) + 12;
        const base = initialPosition();
        const pieces = Object.entries(base);

        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }

        const newPos = {};
        let kingPlaced = false;

        for (const [cell, color] of pieces) {
            if (color === 'king') {
                newPos[cell] = color;
                kingPlaced = true;
                continue;
            }

            if (Object.keys(newPos).length < total) {
                newPos[cell] = color;
            } else {
                break;
            }
        }

        if (!kingPlaced) {
            const kingCell = Object.keys(base).find(c => base[c] === 'king');

            if (kingCell) newPos[kingCell] = 'king';
        }

        if (Object.keys(newPos).length < total) {
            for (const [cell, color] of pieces) {
                if (!newPos.hasOwnProperty(cell) && Object.keys(newPos).length < total) {
                    newPos[cell] = color;
                }
            }
        }

        if (!Object.values(newPos).includes('king')) return null;

        return randomizePosition(newPos, 8);
    }

    function getAllThreatenedWithMoves(pos) {
        const movesInfo = new Map();

        for (const [cellStr, color] of Object.entries(pos)) {
            const cell = Number(cellStr);
            const moves = getMoves(pos, cell);

            for (const toCell of moves) {
                const captured = wouldBeCapturedAfterMove(pos, cell, toCell, color);

                if (captured.size) {
                    movesInfo.set(`${cell}->${toCell}`, captured);
                }
            }
        }

        return movesInfo;
    }

    function formatCellList(cells) {
        return cells.join(', ');
    }

    function getPieceWord(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;

        if (mod10 === 1 && mod100 !== 11) {
            return 'фишка';
        }

        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
            return 'фишки';
        }

        return 'фишек';
    }

    function getAttackerName(piece) {
        if (piece === 'red') return 'Красная фишка';
        if (piece === 'green') return 'Зелёная фишка';
        if (piece === 'king') return 'Король';

        return 'Фишка';
    }

    function getCapturedName(piece, count) {
        if (piece === 'red') {
            return count === 1 ? 'красную фишку' : 'красные фишки';
        }

        if (piece === 'green') {
            return count === 1 ? 'зелёную фишку' : 'зелёные фишки';
        }

        if (piece === 'king') {
            return 'короля';
        }

        return count === 1 ? 'фишку' : 'фишки';
    }

    function getAlreadyThreatenedSuffix(firstAttackers) {
        const uniqueAttackers = Array.from(new Set(firstAttackers)).sort((a, b) => a - b);

        if (uniqueAttackers.length === 1) {
            return `(уже находится под рубкой фишки ${uniqueAttackers[0]})`;
        }

        return `(уже находятся под рубкой фишек ${formatCellList(uniqueAttackers)})`;
    }

    function formatCaptureExplanation(pos, fromCell, capturedSet, firstThreatByCell) {
        const attackerPiece = pos[fromCell];
        const attackerName = getAttackerName(attackerPiece);
        const capturedList = Array.from(capturedSet).sort((a, b) => a - b);

        if (!capturedList.length) return '';

        const alreadyCaptured = capturedList.filter(cell => firstThreatByCell.has(cell));
        const newCaptured = capturedList.filter(cell => !firstThreatByCell.has(cell));

        let listForText = newCaptured.length ? newCaptured : capturedList;
        const count = listForText.length;

        const firstCapturedPiece = pos[listForText[0]];
        const sameCapturedColor = listForText.every(cell => pos[cell] === firstCapturedPiece);
        const capturedName = sameCapturedColor
            ? getCapturedName(firstCapturedPiece, count)
            : (count === 1 ? 'фишку' : 'фишки');

        let suffix;

        if (newCaptured.length === 0) {
            const firstAttackers = alreadyCaptured.map(cell => firstThreatByCell.get(cell));
            suffix = getAlreadyThreatenedSuffix(firstAttackers);
        } else {
            suffix = `(всего ${count} ${getPieceWord(count)})`;
        }

        newCaptured.forEach(cell => {
            firstThreatByCell.set(cell, fromCell);
        });

        return `${attackerName} с клетки ${fromCell} зажимает ${capturedName} ${formatCellList(listForText)} ${suffix}`;
    }

    function makeExplanationFromMoves(pos, movesInfo) {
        const lines = [];
        const firstThreatByCell = new Map();

        for (const [moveKey, capturedSet] of movesInfo.entries()) {
            const [fromCell] = moveKey.split('->').map(Number);
            const line = formatCaptureExplanation(pos, fromCell, capturedSet, firstThreatByCell);

            if (line) lines.push(line);
        }

        return lines;
    }

    function makeExplanation(lines) {
        return lines && lines.length
            ? lines.join('; ')
            : 'Нет фишек под потенциальной рубкой.';
    }

    let lastAnswers = [];

    function generateTask() {
        const freq = {2:1, 3:2, 4:6, 5:6, 6:6, 7:3, 8:1};
        const maxAttempts = 300;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos;

            if (Math.random() < 0.5) {
                pos = randomizePosition(initialPosition(), Math.floor(Math.random() * 20) + 10);
            } else {
                pos = generateSparsePosition();
            }

            if (!pos) continue;
            if (!Object.values(pos).includes('king')) continue;

            const movesInfo = getAllThreatenedWithMoves(pos);
            const threatenedSet = new Set();

            for (const capturedSet of movesInfo.values()) {
                capturedSet.forEach(c => threatenedSet.add(c));
            }

            const count = threatenedSet.size;

            if (count < 2 || count > 8) continue;
            if (lastAnswers.length >= 2 && lastAnswers[lastAnswers.length - 1] === count && lastAnswers[lastAnswers.length - 2] === count) continue;

            const maxProb = Math.max(...Object.values(freq));
            const prob = (freq[count] || 1) / maxProb;

            if (Math.random() > prob) continue;

            lastAnswers.push(count);

            if (lastAnswers.length > 5) lastAnswers.shift();

            const answerSet = new Set([count, count + 1, count - 1, count + 2, count - 2]);
            let answers = Array.from(answerSet).filter(v => v >= 1 && v <= 8).slice(0, 4);

            while (answers.length < 4) answers.push(count + answers.length);

            for (let i = answers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));

                [answers[i], answers[j]] = [answers[j], answers[i]];
            }

            const options = answers.map(v => ({ id: String(v), text: String(v) }));
            const movesDesc = makeExplanationFromMoves(pos, movesInfo);

            return {
                question: "Какое количество фишек находится под потенциальной рубкой на доске?",
                answer_type: "single",
                options: options,
                correct: String(count),
                position: pos,
                moves_desc: movesDesc,
                explanation: makeExplanation(movesDesc),
                highlights: {}
            };
        }

        let pos = randomizePosition(initialPosition(), 10);

        if (!pos) pos = initialPosition();

        const movesInfo = getAllThreatenedWithMoves(pos);
        const threatenedSet = new Set();

        for (const caps of movesInfo.values()) caps.forEach(c => threatenedSet.add(c));

        const count = Math.min(7, Math.max(2, threatenedSet.size));
        const movesDesc = makeExplanationFromMoves(pos, movesInfo);

        return {
            question: "Какое количество фишек находится под потенциальной рубкой на доске?",
            answer_type: "single",
            options: [{id:"4",text:"4"},{id:"5",text:"5"},{id:"6",text:"6"},{id:"7",text:"7"}],
            correct: String(count),
            position: pos,
            moves_desc: movesDesc,
            explanation: makeExplanation(movesDesc),
            highlights: {}
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["1"] = generateTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["1"] = "🎯 Тип 1: Подсчёт фишек под рубкой (Хнефатафл)";
    window.originalCenters = originalCenters;
})();
