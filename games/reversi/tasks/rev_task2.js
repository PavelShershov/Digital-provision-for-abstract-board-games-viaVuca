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

    const cellCenters = {};
    for (let [k, v] of Object.entries(centers)) {
        cellCenters[parseInt(k)] = { x: v[0], y: v[1] };
    }

    const DIRS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1],  [1, 0], [1, 1]
    ];

    const MAX_FAST_ATTEMPTS = 32;

    function getFlips(board, cell, color) {
        const opponent = (color === 'green') ? 'purple' : 'green';

        if (board[cell] !== undefined) return [];

        const row = Math.floor((cell - 1) / 8);
        const col = (cell - 1) % 8;
        let flips = [];

        for (let [dr, dc] of DIRS) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;
            let temp = [];

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const cur = r * 8 + c + 1;

                if (!(cur in board)) break;

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

        return Array.from(new Set(flips));
    }

    function getLegalMoves(board, color) {
        const moves = [];

        for (let cell = 1; cell <= 64; cell++) {
            const flips = getFlips(board, cell, color);

            if (flips.length > 0) {
                moves.push({ cell, flips });
            }
        }

        return moves;
    }

    function randomBalancedPosition(minPieces = 35, maxPieces = 60) {
        const total = minPieces + Math.floor(Math.random() * (maxPieces - minPieces + 1));

        let board = {
            28: 'green',
            29: 'purple',
            36: 'purple',
            37: 'green'
        };

        const allCells = [];

        for (let i = 1; i <= 64; i++) {
            if (!(i in board)) allCells.push(i);
        }

        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }

        let greenCount = Object.values(board).filter(c => c === 'green').length;
        let purpleCount = Object.values(board).filter(c => c === 'purple').length;
        const need = total - (greenCount + purpleCount);

        for (let i = 0; i < need; i++) {
            const cell = allCells[i];

            if (greenCount < purpleCount) {
                board[cell] = 'green';
                greenCount++;
            } else if (purpleCount < greenCount) {
                board[cell] = 'purple';
                purpleCount++;
            } else {
                const col = Math.random() < 0.5 ? 'green' : 'purple';

                board[cell] = col;

                if (col === 'green') greenCount++;
                else purpleCount++;
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
        const moves = getLegalMoves(board, color);

        if (!moves.length) return null;

        if (Math.random() < 0.28) {
            const sorted = moves.slice().sort((a, b) => b.flips.length - a.flips.length);
            const limit = Math.min(4, sorted.length);

            return sorted[Math.floor(Math.random() * limit)];
        }

        return moves[Math.floor(Math.random() * moves.length)];
    }

    function simulateRealisticPosition(minMoves = 18, maxMoves = 48) {
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

        if (r < 0.15) {
            return simulateRealisticPosition(12, 22);
        }

        if (r < 0.75) {
            return simulateRealisticPosition(23, 40);
        }

        return simulateRealisticPosition(41, 56);
    }

    function getMaxFlipDetailsForGreen(board) {
        const legalMoves = getLegalMoves(board, 'green');

        let maxFlips = 0;
        let bestMoves = [];

        for (const move of legalMoves) {
            const flipCount = move.flips.length;

            if (flipCount > maxFlips) {
                maxFlips = flipCount;
                bestMoves = [move];
            } else if (flipCount === maxFlips && flipCount > 0) {
                bestMoves.push(move);
            }
        }

        bestMoves = bestMoves.filter(move => move.flips.length === maxFlips);

        return {
            maxFlips,
            bestMoves,
            legalMoves
        };
    }

    function makeOptions(correct) {
        const answersSet = new Set([
            correct,
            correct + 1,
            correct - 1,
            correct + 2,
            correct - 2
        ]);

        let answers = Array.from(answersSet)
            .filter(a => a >= 0)
            .sort((a, b) => a - b)
            .slice(0, 4);

        while (answers.length < 4) {
            const next = correct + answers.length;

            if (next >= 0 && !answers.includes(next)) {
                answers.push(next);
            } else {
                for (let v = 0; v <= Math.max(20, correct + 4) && answers.length < 4; v++) {
                    if (!answers.includes(v)) answers.push(v);
                }
            }
        }

        if (!answers.includes(correct)) {
            answers[0] = correct;
        }

        for (let i = answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [answers[i], answers[j]] = [answers[j], answers[i]];
        }

        return answers.map(v => ({
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

    function formatBestMoveLine(move) {
        const count = move.flips.length;
        const flipsText = formatCellList(move.flips);

        if (count === 1) {
            return `Зелёная фишка ставится на клетку ${move.cell} и переворачивает синюю фишку на ${flipsText} (всего ${count} ${getPieceWord(count)})`;
        }

        return `Зелёная фишка ставится на клетку ${move.cell} и переворачивает синие фишки на ${flipsText} (всего ${count} ${getPieceWord(count)})`;
    }

    function makeExplanation(maxFlips, bestMoves) {
        if (!bestMoves || !bestMoves.length || maxFlips <= 0) {
            return 'У зелёного игрока нет допустимых ходов.';
        }

        const lines = bestMoves
            .slice()
            .sort((a, b) => a.cell - b.cell)
            .map(formatBestMoveLine);

        if (lines.length === 1) {
            return lines.join('; ');
        }

        return [
            'Есть несколько вариантов с максимумом:',
            ...lines
        ].join('; ');
    }

    function answerAcceptanceWeight(value) {
        const freqWeights = {
            1: 1,
            2: 1,
            3: 2,
            4: 6,
            5: 9,
            6: 9,
            7: 9,
            8: 9,
            9: 9,
            10: 4,
            11: 4,
            12: 4,
            13: 2,
            14: 2,
            15: 2,
            16: 1,
            17: 1,
            18: 1,
            19: 1,
            20: 1
        };

        return freqWeights[value] || 1;
    }

    function candidateScore(value) {
        if (value >= 5 && value <= 9) return 100;
        if (value === 4 || value === 10 || value === 11 || value === 12) return 75;
        if (value === 3 || value === 13 || value === 14 || value === 15) return 55;
        if (value > 0) return 25;

        return 0;
    }

    function generateMaxCaptureTask() {
        const maxWeight = 9;
        let bestFallback = null;

        for (let attempt = 0; attempt < MAX_FAST_ATTEMPTS; attempt++) {
            const board = generateRealisticCandidatePosition();
            const details = getMaxFlipDetailsForGreen(board);
            const correct = details.maxFlips;

            if (!details.bestMoves.length || correct <= 0) continue;

            const score = candidateScore(correct);

            if (!bestFallback || score > bestFallback.score) {
                bestFallback = {
                    score,
                    board,
                    correct,
                    bestMoves: details.bestMoves
                };
            }

            if (correct < 1 || correct > 20) continue;

            const weight = answerAcceptanceWeight(correct);

            if (Math.random() > weight / maxWeight) continue;

            const options = makeOptions(correct);
            const explanation = makeExplanation(correct, details.bestMoves);

            return {
                question: "Какое максимальное количество фишек может перевернуть за один ход зелёный игрок?",
                answer_type: "single",
                options: options,
                correct: correct.toString(),
                position: board,
                highlights: {},

                best_move: details.bestMoves[0].cell,
                captured: details.bestMoves[0].flips,
                best_moves: details.bestMoves,
                explanation: explanation
            };
        }

        if (bestFallback) {
            const options = makeOptions(bestFallback.correct);
            const explanation = makeExplanation(bestFallback.correct, bestFallback.bestMoves);

            return {
                question: "Какое максимальное количество фишек может перевернуть за один ход зелёный игрок?",
                answer_type: "single",
                options: options,
                correct: bestFallback.correct.toString(),
                position: bestFallback.board,
                highlights: {},

                best_move: bestFallback.bestMoves[0].cell,
                captured: bestFallback.bestMoves[0].flips,
                best_moves: bestFallback.bestMoves,
                explanation: explanation
            };
        }

        const fallbackBoard = initialReversiPosition();
        const fallbackDetails = getMaxFlipDetailsForGreen(fallbackBoard);
        const fallbackCorrect = fallbackDetails.maxFlips;

        return {
            question: "Какое максимальное количество фишек может перевернуть за один ход зелёный игрок?",
            answer_type: "single",
            options: makeOptions(fallbackCorrect),
            correct: fallbackCorrect.toString(),
            position: fallbackBoard,
            highlights: {},

            best_move: fallbackDetails.bestMoves[0]?.cell || null,
            captured: fallbackDetails.bestMoves[0]?.flips || [],
            best_moves: fallbackDetails.bestMoves,
            explanation: makeExplanation(fallbackCorrect, fallbackDetails.bestMoves)
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["2"] = generateMaxCaptureTask;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["2"] = "🎯 Реверси: Максимальный переворот зелёным";

    window.originalCenters = cellCenters;
})();
