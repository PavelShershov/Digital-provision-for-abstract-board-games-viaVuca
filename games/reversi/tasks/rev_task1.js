
(() => {
    const centers = {
        1: [473, 479], 2: [834, 480], 3: [1184, 479], 4: [1540, 476],
        5: [1898, 481], 6: [2251, 481], 7: [2603, 483], 8: [2971, 475],
        9: [475, 830], 10: [825, 830], 11: [1199, 828], 12: [1538, 827],
        13: [1891, 824], 14: [2244, 826], 15: [2607, 823], 16: [2941, 826],
        17: [476, 1174], 18: [830, 1177], 19: [1182, 1178], 20: [1533, 1178],
        21: [1891, 1175], 22: [2242, 1185], 23: [2597, 1181], 24: [2958, 1176],
        25: [476, 1540], 26: [825, 1541], 27: [1179, 1544], 28: [1540, 1537],
        29: [1904, 1540], 30: [2246, 1537], 31: [2600, 1543], 32: [2954, 1543],
        33: [474, 1893], 34: [818, 1888], 35: [1177, 1890], 36: [1541, 1890],
        37: [1881, 1887], 38: [2236, 1884], 39: [2592, 1886], 40: [2950, 1888],
        41: [481, 2249], 42: [824, 2242], 43: [1187, 2252], 44: [1542, 2258],
        45: [1898, 2244], 46: [2247, 2242], 47: [2602, 2242], 48: [2958, 2253],
        49: [473, 2608], 50: [829, 2595], 51: [1181, 2602], 52: [1527, 2605],
        53: [1891, 2604], 54: [2246, 2608], 55: [2596, 2604], 56: [2961, 2606],
        57: [478, 2956], 58: [826, 2956], 59: [1185, 2956], 60: [1531, 2959],
        61: [1894, 2949], 62: [2240, 2954], 63: [2599, 2956], 64: [2948, 2955]
    };

    const DIRS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    const MAX_FAST_ATTEMPTS = 28;

    function getFlips(board, cell, color) {
        const opponent = color === 'green' ? 'purple' : 'green';

        if (board.hasOwnProperty(cell)) return [];

        const row = Math.floor((cell - 1) / 8);
        const col = (cell - 1) % 8;
        const flips = [];

        for (const [dr, dc] of DIRS) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;
            const temp = [];

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const cur = r * 8 + c + 1;

                if (!board.hasOwnProperty(cur)) break;

                if (board[cur] === opponent) {
                    temp.push(cur);
                    foundOpponent = true;
                } else {
                    if (foundOpponent) flips.push(...temp);
                    break;
                }

                r += dr;
                c += dc;
            }
        }

        return flips;
    }

    function getCapturingMoves(board, color) {
        const moves = [];

        for (let cell = 1; cell <= 64; cell++) {
            const flips = getFlips(board, cell, color);

            if (flips.length > 0) {
                moves.push({
                    cell,
                    flips
                });
            }
        }

        return moves;
    }

    function randomOpenPosition(minPieces = 25, maxPieces = 40) {
        const total = Math.floor(Math.random() * (maxPieces - minPieces + 1)) + minPieces;

        let board = {
            28: 'green',
            29: 'purple',
            36: 'purple',
            37: 'green'
        };

        const allCells = [];

        for (let i = 1; i <= 64; i++) {
            allCells.push(i);
        }

        const available = allCells.filter(c => !board.hasOwnProperty(c));

        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [available[i], available[j]] = [available[j], available[i]];
        }

        let greenCnt = Object.values(board).filter(v => v === 'green').length;
        let purpleCnt = Object.values(board).filter(v => v === 'purple').length;
        const need = total - (greenCnt + purpleCnt);

        for (let i = 0; i < need; i++) {
            const cell = available[i];

            if (greenCnt < purpleCnt) {
                board[cell] = 'green';
                greenCnt++;
            } else if (purpleCnt < greenCnt) {
                board[cell] = 'purple';
                purpleCnt++;
            } else {
                const color = Math.random() < 0.5 ? 'green' : 'purple';

                board[cell] = color;

                if (color === 'green') greenCnt++;
                else purpleCnt++;
            }
        }

        return board;
    }

    function initialReversiPosition() {
        return {
            28: 'green',
            29: 'purple',
            36: 'purple',
            37: 'green'
        };
    }

    function applyMove(board, cell, color) {
        const flips = getFlips(board, cell, color);

        if (!flips.length) return null;

        const newBoard = { ...board };

        newBoard[cell] = color;

        for (const flippedCell of flips) {
            newBoard[flippedCell] = color;
        }

        return newBoard;
    }

    function chooseSimulationMove(board, color) {
        const moves = getCapturingMoves(board, color);

        if (!moves.length) return null;

        if (Math.random() < 0.28) {
            const sorted = moves.slice().sort((a, b) => b.flips.length - a.flips.length);
            const limit = Math.min(4, sorted.length);

            return sorted[Math.floor(Math.random() * limit)];
        }

        return moves[Math.floor(Math.random() * moves.length)];
    }

    function simulateRealisticPosition(minMoves = 18, maxMoves = 42) {
        let board = initialReversiPosition();
        let color = 'purple';
        let passes = 0;

        const totalMoves = Math.floor(Math.random() * (maxMoves - minMoves + 1)) + minMoves;

        for (let moveIndex = 0; moveIndex < totalMoves; moveIndex++) {
            const chosenMove = chooseSimulationMove(board, color);

            if (!chosenMove) {
                passes++;
                color = color === 'green' ? 'purple' : 'green';

                if (passes >= 2) break;

                continue;
            }

            passes = 0;

            const nextBoard = applyMove(board, chosenMove.cell, color);

            if (!nextBoard) {
                color = color === 'green' ? 'purple' : 'green';
                continue;
            }

            board = nextBoard;
            color = color === 'green' ? 'purple' : 'green';

            if (Object.keys(board).length >= 64) break;
        }

        return board;
    }

    function generateRealisticCandidatePosition() {
        const r = Math.random();

        if (r < 0.2) {
            return simulateRealisticPosition(12, 22);
        }

        if (r < 0.8) {
            return simulateRealisticPosition(23, 36);
        }

        return simulateRealisticPosition(37, 50);
    }

    function makeOptions(count) {
        const minAnswer = count >= 2 && count <= 11 ? 2 : 0;
        const maxAnswer = count >= 2 && count <= 11 ? 11 : Math.max(8, count + 3);

        const candidates = new Set([
            count,
            count + 1,
            count - 1,
            count + 2,
            count - 2
        ]);

        let optionsArray = Array.from(candidates)
            .filter(v => v >= minAnswer && v <= maxAnswer)
            .sort((a, b) => a - b)
            .slice(0, 4);

        while (optionsArray.length < 4) {
            const randomValue = Math.floor(Math.random() * (maxAnswer - minAnswer + 1)) + minAnswer;

            if (!optionsArray.includes(randomValue)) {
                optionsArray.push(randomValue);
            }
        }

        if (!optionsArray.includes(count)) {
            optionsArray[0] = count;
        }

        for (let i = optionsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
        }

        return optionsArray.map(v => ({
            id: v.toString(),
            text: v.toString()
        }));
    }

    function formatCellList(cells) {
        const unique = Array.from(new Set(cells));

        return unique
            .sort((a, b) => a - b)
            .join(', ');
    }

    function formatMoveExplanation(move) {
        const flipsText = formatCellList(move.flips);

        if (move.flips.length === 1) {
            return `Зелёная фишка ставится на клетку ${move.cell} и переворачивает фишку на ${flipsText}`;
        }

        return `Зелёная фишка ставится на клетку ${move.cell} и переворачивает фишки на ${flipsText}`;
    }

    function makeExplanation(moves, count) {
        if (!moves || !moves.length) {
            return 'У зелёного игрока нет допустимых ходов.';
        }

        const lines = moves
            .slice()
            .sort((a, b) => a.cell - b.cell)
            .map(formatMoveExplanation);

        return `${lines.join('; ')}; Всего ${count} ходов.`;
    }

    function getCandidateScore(count) {
        if (count >= 4 && count <= 7) return 100;
        if (count === 3 || count === 8 || count === 9) return 70;
        if (count === 2 || count === 10 || count === 11) return 50;
        if (count > 0) return 10;

        return 0;
    }

    function generateCapturingMovesTask(maxAttempts = MAX_FAST_ATTEMPTS) {
        const freqWeights = {
            2: 1,
            3: 1.5,
            4: 2,
            5: 2,
            6: 2,
            7: 2,
            8: 1.5,
            9: 1.5,
            10: 1,
            11: 1
        };

        const maxWeight = Math.max(...Object.values(freqWeights));
        let bestFallback = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const board = generateRealisticCandidatePosition();
            const moves = getCapturingMoves(board, 'green');
            const count = moves.length;

            const score = getCandidateScore(count);

            if (!bestFallback || score > bestFallback.score) {
                bestFallback = {
                    score,
                    board,
                    moves,
                    count
                };
            }

            if (count < 2 || count > 11) continue;

            const weight = freqWeights[count];

            if (Math.random() > weight / maxWeight) continue;

            const options = makeOptions(count);
            const explanation = makeExplanation(moves, count);

            return {
                question: "Сколько допустимых ходов есть у зелёного игрока?",
                answer_type: "single",
                options: options,
                correct: count.toString(),
                position: board,
                highlights: {},
                explanation: explanation
            };
        }

        if (bestFallback) {
            const options = makeOptions(bestFallback.count);
            const explanation = makeExplanation(bestFallback.moves, bestFallback.count);

            return {
                question: "Сколько допустимых ходов есть у зелёного игрока?",
                answer_type: "single",
                options: options,
                correct: bestFallback.count.toString(),
                position: bestFallback.board,
                highlights: {},
                explanation: explanation
            };
        }

        const fallbackBoard = initialReversiPosition();
        const fallbackMoves = getCapturingMoves(fallbackBoard, 'green');
        const fallbackCount = fallbackMoves.length;

        return {
            question: "Сколько допустимых ходов есть у зелёного игрока?",
            answer_type: "single",
            options: makeOptions(fallbackCount),
            correct: fallbackCount.toString(),
            position: fallbackBoard,
            highlights: {},
            explanation: makeExplanation(fallbackMoves, fallbackCount)
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["1"] = generateCapturingMovesTask;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["1"] = "🎯 Сколько допустимых ходов у зелёного? (Реверси)";

    window.reversiCenters = centers;
})();
