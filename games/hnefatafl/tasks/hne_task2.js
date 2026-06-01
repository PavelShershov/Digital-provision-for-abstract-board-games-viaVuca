
(() => {
const ROWS = 11;
const COLS = 11;

const THRONE = 61;

const FORTRESSES = new Set([
    1, 11, 111, 121
]);

const SIMULATION_MOVE_SAMPLES = 28;
const MAX_FAST_ATTEMPTS = 220;

const real_size = 3426;
const play_size = 3189;

const play_offset_x = (real_size - play_size) / 2;
const play_offset_y = (real_size - play_size) / 2;

const cell_size = play_size / 11;

const start_x = play_offset_x + cell_size / 2;
const start_y = play_offset_y + cell_size / 2;

const step_x = cell_size;
const step_y = cell_size;

const shift_x = 0;
const shift_y = 0;

const originalCenters = {};
let cellId = 1;

for (let row = 1; row <= 11; row++) {
    for (let col = 1; col <= 11; col++) {
        const x = start_x + (col - 1) * step_x + shift_x;
        const y = start_y + (row - 1) * step_y + shift_y;

        originalCenters[cellId++] = { x, y };
    }
}

    function initialPosition() {
        const pos = {};

        pos[THRONE] = 'king';

        const defenders = [39, 49, 50, 51, 59, 60, 62, 63, 71, 72, 73, 83];

        defenders.forEach(c => {
            pos[c] = 'green';
        });

        const vikings = [
            4, 5, 6, 7, 8, 17,
            34, 45, 56, 57, 67, 78,
            44, 55, 66, 77, 88, 65,
            105, 114, 115, 116, 117, 118
        ];

        vikings.forEach(c => {
            pos[c] = 'red';
        });

        return pos;
    }

    function numToRc(num) {
        const row = Math.floor((num - 1) / 11);
        const col = (num - 1) % 11;

        return { row, col };
    }

    function rcToNum(row, col) {
        return row * 11 + col + 1;
    }

    function isInside(row, col) {
        return row >= 0 && row < ROWS && col >= 0 && col < COLS;
    }

    function isFortress(cell) {
        return FORTRESSES.has(cell);
    }

    function isRestrictedForOrdinary(cell) {
        return cell === THRONE || FORTRESSES.has(cell);
    }

    function pieceBelongsToPlayer(piece, player) {
        if (player === 'red') {
            return piece === 'red';
        }

        return piece === 'green' || piece === 'king';
    }

    function getPiecePlayer(piece) {
        return piece === 'red' ? 'red' : 'green';
    }

    function getMoves(pos, cell) {
        if (!pos.hasOwnProperty(cell)) return [];

        const piece = pos[cell];
        const { row: r, col: c } = numToRc(cell);
        const moves = [];
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        for (const [dr, dc] of dirs) {
            if (piece === 'king') {
                for (let s = 1; s <= 2; s++) {
                    const nr = r + dr * s;
                    const nc = c + dc * s;

                    if (!isInside(nr, nc)) break;

                    const ncell = rcToNum(nr, nc);

                    if (ncell === THRONE) continue;
                    if (pos.hasOwnProperty(ncell)) break;

                    moves.push(ncell);
                }
            } else {
                for (let s = 1; s <= 10; s++) {
                    const nr = r + dr * s;
                    const nc = c + dc * s;

                    if (!isInside(nr, nc)) break;

                    const ncell = rcToNum(nr, nc);

                    if (isRestrictedForOrdinary(ncell)) break;
                    if (pos.hasOwnProperty(ncell)) break;

                    moves.push(ncell);
                }
            }
        }

        return moves;
    }

    function isEnemyOrFortress(cell, attackerColor, pos) {
        if (cell === undefined) return false;

        if (isFortress(cell)) return true;

        if (cell === THRONE) {
            return !pos.hasOwnProperty(cell);
        }

        if (attackerColor === 'green') {
            return pos[cell] === 'green' || pos[cell] === 'king';
        }

        return pos[cell] === attackerColor;
    }

    function isCapturedOrdinary(cell, pos, attackerColor) {
        if (!pos.hasOwnProperty(cell) || pos[cell] === 'king') return false;

        const { row: r, col: c } = numToRc(cell);

        const left = c > 0 ? rcToNum(r, c - 1) : undefined;
        const right = c < 10 ? rcToNum(r, c + 1) : undefined;

        const leftOk = isEnemyOrFortress(left, attackerColor, pos);
        const rightOk = isEnemyOrFortress(right, attackerColor, pos);

        if (leftOk && rightOk) return true;

        const up = r > 0 ? rcToNum(r - 1, c) : undefined;
        const down = r < 10 ? rcToNum(r + 1, c) : undefined;

        const upOk = isEnemyOrFortress(up, attackerColor, pos);
        const downOk = isEnemyOrFortress(down, attackerColor, pos);

        if (upOk && downOk) return true;

        return false;
    }

    function isCapturedKing(cell, pos, attackerColor) {
        if (pos[cell] !== 'king') return false;
        if (cell === THRONE) return false;
        if (attackerColor !== 'red') return false;

        const { row: r, col: c } = numToRc(cell);
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        let enemyCount = 0;

        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;

            if (!isInside(nr, nc)) {
                enemyCount++;
            } else {
                const ncell = rcToNum(nr, nc);

                if (isEnemyOrFortress(ncell, attackerColor, pos)) {
                    enemyCount++;
                }
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

            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nr = r + dr;
                const nc = c + dc;

                if (isInside(nr, nc)) {
                    cellsToCheck.add(rcToNum(nr, nc));
                }
            }
        }

        for (const cell of cellsToCheck) {
            if (!newPos.hasOwnProperty(cell)) continue;

            const col = newPos[cell];

            if (col === opponentColor) {
                if (isCapturedOrdinary(cell, newPos, playerColor)) {
                    captured.add(cell);
                }
            } else if (col === 'king' && playerColor === 'red') {
                if (isCapturedKing(cell, newPos, playerColor)) {
                    captured.add(cell);
                }
            }
        }

        return captured;
    }

    function applyMoveWithCaptures(pos, fromCell, toCell, playerColor) {
        const captured = wouldBeCapturedAfterMove(pos, fromCell, toCell, playerColor);
        const newPos = { ...pos };
        const piece = newPos[fromCell];

        delete newPos[fromCell];

        newPos[toCell] = piece;

        for (const cell of captured) {
            delete newPos[cell];
        }

        return {
            position: newPos,
            captured
        };
    }

    function getMovableCellsForPlayer(pos, player) {
        const movable = [];

        for (const [cellStr, piece] of Object.entries(pos)) {
            if (!pieceBelongsToPlayer(piece, player)) continue;

            const cell = Number(cellStr);
            const moves = getMoves(pos, cell);

            if (moves.length) {
                movable.push({
                    cell,
                    moves
                });
            }
        }

        return movable;
    }

    function chooseSimulationMove(pos, player) {
        const movable = getMovableCellsForPlayer(pos, player);

        if (!movable.length) return null;

        let randomMove = null;
        let bestCaptureMove = null;

        for (let i = 0; i < SIMULATION_MOVE_SAMPLES; i++) {
            const pieceData = movable[Math.floor(Math.random() * movable.length)];
            const toCell = pieceData.moves[Math.floor(Math.random() * pieceData.moves.length)];
            const captured = wouldBeCapturedAfterMove(pos, pieceData.cell, toCell, player);

            const candidate = {
                from: pieceData.cell,
                to: toCell,
                player,
                captured
            };

            if (!randomMove) {
                randomMove = candidate;
            }

            if (
                captured.size > 0 &&
                (
                    !bestCaptureMove ||
                    captured.size > bestCaptureMove.captured.size
                )
            ) {
                bestCaptureMove = candidate;
            }
        }

        if (bestCaptureMove && Math.random() < 0.68) {
            return bestCaptureMove;
        }

        return randomMove;
    }

    function getMaxCaptureForBoard(pos) {
        let maxCap = 0;
        let bestMoves = [];

        for (const [cellStr, color] of Object.entries(pos)) {
            if (color === 'king') continue;

            const fromCell = Number(cellStr);
            const playerColor = getPiecePlayer(color);
            const moves = getMoves(pos, fromCell);

            for (const toCell of moves) {
                const caps = wouldBeCapturedAfterMove(pos, fromCell, toCell, playerColor);
                const capCount = caps.size;

                if (capCount > maxCap) {
                    maxCap = capCount;
                    bestMoves = [{
                        from: fromCell,
                        to: toCell,
                        captured: Array.from(caps),
                        player: playerColor
                    }];
                } else if (capCount === maxCap && maxCap > 0) {
                    bestMoves.push({
                        from: fromCell,
                        to: toCell,
                        captured: Array.from(caps),
                        player: playerColor
                    });
                }
            }
        }

        bestMoves = bestMoves.filter(move => move.captured.length === maxCap);

        return { maxCap, bestMoves };
    }

    function isValidPosition(pos) {
        if (!Object.values(pos).includes('king')) return false;

        for (const fort of FORTRESSES) {
            if (pos[fort]) return false;
        }

        let red = 0;
        let green = 0;

        for (const col of Object.values(pos)) {
            if (col === 'red') red++;
            else if (col === 'green') green++;
        }

        if (red < 5 || red > 24) return false;
        if (green < 4 || green > 14) return false;

        return true;
    }

    function simulateRealisticPosition(minMoves, maxMoves) {
        let pos = initialPosition();

        const totalMoves = Math.floor(Math.random() * (maxMoves - minMoves + 1)) + minMoves;
        let player = Math.random() < 0.65 ? 'red' : 'green';

        for (let moveIndex = 0; moveIndex < totalMoves; moveIndex++) {
            let chosenMove = chooseSimulationMove(pos, player);

            if (!chosenMove) {
                player = player === 'red' ? 'green' : 'red';
                chosenMove = chooseSimulationMove(pos, player);

                if (!chosenMove) break;
            }

            const result = applyMoveWithCaptures(pos, chosenMove.from, chosenMove.to, player);

            pos = result.position;

            if (!Object.values(pos).includes('king')) {
                return null;
            }

            player = player === 'red' ? 'green' : 'red';
        }

        return isValidPosition(pos) ? pos : null;
    }

    function generateEarlyPosition() {
        return simulateRealisticPosition(6, 12);
    }

    function generateMiddlePosition() {
        return simulateRealisticPosition(13, 24);
    }

    function generateLatePosition() {
        return simulateRealisticPosition(25, 36);
    }

    function generateRealisticCandidatePosition() {
        const r = Math.random();

        if (r < 0.2) {
            return generateEarlyPosition();
        }

        if (r < 0.8) {
            return generateMiddlePosition();
        }

        return generateLatePosition();
    }

    function formatCellList(cells) {
        if (!cells || cells.length === 0) {
            return '';
        }

        const sorted = [...cells].sort((a, b) => a - b);

        if (sorted.length === 1) {
            return String(sorted[0]);
        }

        if (sorted.length === 2) {
            return `${sorted[0]} и ${sorted[1]}`;
        }

        return `${sorted.slice(0, -1).join(', ')} и ${sorted[sorted.length - 1]}`;
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

    function getAttackerName(player) {
        if (player === 'red') return 'Красная фишка';
        if (player === 'green') return 'Зелёная фишка';

        return 'Фишка';
    }

    function getCapturedName(player, count) {
        if (player === 'red') {
            return count === 1 ? 'зелёную фишку' : 'зелёные фишки';
        }

        if (player === 'green') {
            return count === 1 ? 'красную фишку' : 'красные фишки';
        }

        return count === 1 ? 'фишку' : 'фишки';
    }

    function formatBestMoveLine(move) {
        const count = move.captured.length;
        const attackerName = getAttackerName(move.player);
        const capturedName = getCapturedName(move.player, count);
        const capturedCells = formatCellList(move.captured);

        return `${attackerName} с клетки ${move.from} зажимает ${capturedName} ${capturedCells} (всего ${count} ${getCaptureWord(count)})`;
    }

    function formatBestMovesExplanation(maxCap, bestMoves) {
        if (!bestMoves || !bestMoves.length || maxCap <= 0) {
            return ['Нет хода с рубкой.'];
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
            : 'Нет хода с рубкой.';
    }

    function makeOptions(correct) {
        const answerSet = new Set([
            correct,
            correct + 1,
            correct - 1,
            correct + 2,
            correct - 2
        ]);

        let answers = Array.from(answerSet)
            .filter(v => v >= 0 && v <= 8)
            .slice(0, 4);

        while (answers.length < 4) {
            for (let v = 0; v <= 8 && answers.length < 4; v++) {
                if (!answers.includes(v)) {
                    answers.push(v);
                }
            }
        }

        for (let i = answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [answers[i], answers[j]] = [answers[j], answers[i]];
        }

        return answers.map(v => ({
            id: String(v),
            text: String(v)
        }));
    }

    function buildTaskFromPosition(pos, maxCap, bestMoves) {
        const realBestMoves = bestMoves.filter(move => move.captured.length === maxCap);
        const bestMovesDesc = formatBestMovesExplanation(maxCap, realBestMoves);

        return {
            question: "Ход с максимальной рубкой какого количества фишек есть на поле?",
            answer_type: "single",
            options: makeOptions(maxCap),
            correct: String(maxCap),
            position: pos,
            best_moves: bestMovesDesc,
            explanation: makeExplanation(bestMovesDesc),
            highlights: {}
        };
    }

    function answerAcceptanceWeight(maxCap) {
        const weights = {
            0: 0,
            1: 1,
            2: 4,
            3: 30,
            4: 34,
            5: 26,
            6: 10,
            7: 3,
            8: 1
        };

        return weights[maxCap] || 0;
    }

    function shouldAcceptAnswer(maxCap) {
        const maxWeight = 34;
        const weight = answerAcceptanceWeight(maxCap);

        if (weight <= 0) return false;

        return Math.random() <= weight / maxWeight;
    }

    function candidateScore(maxCap) {
        if (maxCap === 4) return 100;
        if (maxCap === 3) return 95;
        if (maxCap === 5) return 90;
        if (maxCap === 6) return 60;
        if (maxCap === 2) return 35;
        if (maxCap === 7) return 25;
        if (maxCap === 1) return 10;

        return 0;
    }

    let lastAnswers = [];

    function generateMaxCaptureTask() {
        let bestFallback = null;

        for (let attempt = 0; attempt < MAX_FAST_ATTEMPTS; attempt++) {
            const pos = generateRealisticCandidatePosition();

            if (!pos || !isValidPosition(pos)) continue;

            const { maxCap, bestMoves } = getMaxCaptureForBoard(pos);

            if (maxCap < 1 || maxCap > 8) continue;
            if (!bestMoves.length) continue;
            if (bestMoves.some(move => move.captured.length !== maxCap)) continue;

            const score = candidateScore(maxCap);

            if (!bestFallback || score > bestFallback.score) {
                bestFallback = {
                    score,
                    pos,
                    maxCap,
                    bestMoves
                };
            }

            if (
                lastAnswers.length >= 2 &&
                lastAnswers[lastAnswers.length - 1] === maxCap &&
                lastAnswers[lastAnswers.length - 2] === maxCap
            ) {
                continue;
            }

            if (!shouldAcceptAnswer(maxCap)) continue;

            lastAnswers.push(maxCap);

            if (lastAnswers.length > 5) {
                lastAnswers.shift();
            }

            return buildTaskFromPosition(pos, maxCap, bestMoves);
        }

        if (bestFallback) {
            lastAnswers.push(bestFallback.maxCap);

            if (lastAnswers.length > 5) {
                lastAnswers.shift();
            }

            return buildTaskFromPosition(
                bestFallback.pos,
                bestFallback.maxCap,
                bestFallback.bestMoves
            );
        }

        const pos = initialPosition();
        const { maxCap, bestMoves } = getMaxCaptureForBoard(pos);

        if (maxCap >= 1 && bestMoves.length) {
            return buildTaskFromPosition(pos, maxCap, bestMoves);
        }

        return {
            question: "Ход с максимальной рубкой какого количества фишек есть на поле?",
            answer_type: "single",
            options: [
                { id: "0", text: "0" },
                { id: "1", text: "1" },
                { id: "2", text: "2" },
                { id: "3", text: "3" }
            ],
            correct: "0",
            position: pos,
            best_moves: ['Нет хода с рубкой.'],
            explanation: 'Нет хода с рубкой.',
            highlights: {}
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["2"] = generateMaxCaptureTask;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["2"] = "⚡ Максимальная рубка (Хнефатафл)";

    window.originalCenters = originalCenters;
})();
