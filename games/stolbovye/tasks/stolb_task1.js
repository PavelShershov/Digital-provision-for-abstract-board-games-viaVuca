
(() => {

    const centers = {
        1: { x: 473, y: 479 }, 2: { x: 834, y: 480 }, 3: { x: 1184, y: 479 }, 4: { x: 1540, y: 476 },
        5: { x: 1898, y: 481 }, 6: { x: 2251, y: 481 }, 7: { x: 2603, y: 483 }, 8: { x: 2971, y: 475 },

        9: { x: 475, y: 830 }, 10: { x: 825, y: 830 }, 11: { x: 1199, y: 828 }, 12: { x: 1538, y: 827 },
        13: { x: 1891, y: 824 }, 14: { x: 2244, y: 826 }, 15: { x: 2607, y: 823 }, 16: { x: 2941, y: 826 },

        17: { x: 476, y: 1174 }, 18: { x: 830, y: 1177 }, 19: { x: 1182, y: 1178 }, 20: { x: 1533, y: 1178 },
        21: { x: 1891, y: 1175 }, 22: { x: 2242, y: 1185 }, 23: { x: 2597, y: 1181 }, 24: { x: 2958, y: 1176 },

        25: { x: 476, y: 1540 }, 26: { x: 825, y: 1541 }, 27: { x: 1179, y: 1544 }, 28: { x: 1540, y: 1537 },
        29: { x: 1904, y: 1540 }, 30: { x: 2246, y: 1537 }, 31: { x: 2600, y: 1543 }, 32: { x: 2954, y: 1543 },

        33: { x: 474, y: 1893 }, 34: { x: 818, y: 1888 }, 35: { x: 1177, y: 1890 }, 36: { x: 1541, y: 1890 },
        37: { x: 1881, y: 1887 }, 38: { x: 2236, y: 1884 }, 39: { x: 2592, y: 1886 }, 40: { x: 2950, y: 1888 },

        41: { x: 481, y: 2249 }, 42: { x: 824, y: 2242 }, 43: { x: 1187, y: 2252 }, 44: { x: 1542, y: 2258 },
        45: { x: 1898, y: 2244 }, 46: { x: 2247, y: 2242 }, 47: { x: 2602, y: 2242 }, 48: { x: 2958, y: 2253 },

        49: { x: 473, y: 2608 }, 50: { x: 829, y: 2595 }, 51: { x: 1181, y: 2602 }, 52: { x: 1527, y: 2605 },
        53: { x: 1891, y: 2604 }, 54: { x: 2246, y: 2608 }, 55: { x: 2596, y: 2604 }, 56: { x: 2961, y: 2606 },

        57: { x: 478, y: 2956 }, 58: { x: 826, y: 2956 }, 59: { x: 1185, y: 2956 }, 60: { x: 1531, y: 2959 },
        61: { x: 1894, y: 2949 }, 62: { x: 2240, y: 2954 }, 63: { x: 2599, y: 2956 }, 64: { x: 2948, y: 2955 }
    };


    const TASK_ID = "1";

    const SETTINGS = {
        pieceSizeFactor: 0.70,
        stackOffsetX: 0.03,
        stackOffsetY: 0.20,

        kingGenerationProbability: 0.35,

        generationTimeBudgetMs: 650,

        simulationMoveLimit: 36,
        simulationSequencesPerPiece: 32,
        simulationMaxCaptureDepth: 7,

        taskMoveLimit: 80,
        maxSequencesPerPiece: 70,
        maxCaptureDepth: 9,

        maxAttempts: 180
    };

    const WHITE_START = [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 22, 24];
    const BLACK_START = [41, 43, 45, 47, 50, 52, 54, 56, 57, 59, 61, 63];

    const DIAG_DIRS = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
    ];


    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function choice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function shuffled(arr) {
        const result = arr.slice();

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    }

    function weightedChoice(weightMap) {
        const entries = Object.entries(weightMap).map(([value, weight]) => ({
            value: Number(value),
            weight
        }));

        const total = entries.reduce((sum, item) => sum + item.weight, 0);
        let r = Math.random() * total;

        for (const item of entries) {
            r -= item.weight;

            if (r <= 0) {
                return item.value;
            }
        }

        return entries[entries.length - 1].value;
    }

    function sortedBoardCells(board) {
        return Object.keys(board).map(Number).sort((a, b) => a - b);
    }

    function topPieceFast(stack) {
        if (!stack || !stack.length) {
            return null;
        }

        return stack[stack.length - 1];
    }


    function makePiece(color, king = false) {
        return {
            color,
            king: !!king
        };
    }

    function clonePiece(piece) {
        return {
            color: piece.color,
            king: !!piece.king
        };
    }

    function cloneStack(stack) {
        return stack.map(clonePiece);
    }

    function cloneBoard(board) {
        const result = {};

        for (const cell in board) {
            result[cell] = cloneStack(board[cell]);
        }

        return result;
    }

    function rc(cell) {
        const n = Number(cell);
        return [
            Math.floor((n - 1) / 8) + 1,
            ((n - 1) % 8) + 1
        ];
    }

    function cellNum(row, col) {
        if (row >= 1 && row <= 8 && col >= 1 && col <= 8) {
            return (row - 1) * 8 + col;
        }

        return null;
    }

    function topPiece(board, cell) {
        const stack = board[cell];

        if (!stack || !stack.length) {
            return null;
        }

        return stack[stack.length - 1];
    }

    function owner(board, cell) {
        const piece = topPiece(board, cell);

        return piece ? piece.color : null;
    }

    function opponent(color) {
        return color === "white" ? "black" : "white";
    }

    function promotionRow(color) {
        return color === "white" ? 8 : 1;
    }

    function promoteTopIfNeeded(stack, landingCell) {
        if (!stack || !stack.length) return;

        const top = stack[stack.length - 1];
        const [row] = rc(landingCell);

        if (!top.king && row === promotionRow(top.color)) {
            top.king = true;
        }
    }

    function initialBoard() {
        const board = {};

        for (const cell of WHITE_START) {
            board[cell] = [makePiece("white")];
        }

        for (const cell of BLACK_START) {
            board[cell] = [makePiece("black")];
        }

        return board;
    }


    function getSimpleMovesForPiece(board, fromCell) {
        const piece = topPiece(board, fromCell);

        if (!piece) return [];

        const color = piece.color;
        const isKing = !!piece.king;
        const [row, col] = rc(fromCell);

        const moves = [];

        if (isKing) {
            for (const [dr, dc] of DIAG_DIRS) {
                let step = 1;

                while (true) {
                    const toCell = cellNum(row + dr * step, col + dc * step);

                    if (toCell === null) break;
                    if (board[toCell]) break;

                    moves.push({
                        kind: "quiet",
                        from: fromCell,
                        to: toCell,
                        path: [toCell],
                        captures: 0
                    });

                    step++;
                }
            }

            return moves;
        }

        const forward = color === "white" ? 1 : -1;

        for (const dc of [-1, 1]) {
            const toCell = cellNum(row + forward, col + dc);

            if (toCell !== null && !board[toCell]) {
                moves.push({
                    kind: "quiet",
                    from: fromCell,
                    to: toCell,
                    path: [toCell],
                    captures: 0
                });
            }
        }

        return moves;
    }

    function getQuietMovesForPlayer(board, player, moveLimit = SETTINGS.taskMoveLimit) {
        const moves = [];

        for (const fromCell of sortedBoardCells(board)) {
            if (owner(board, fromCell) === player) {
                moves.push(...getSimpleMovesForPiece(board, fromCell));

                if (moves.length >= moveLimit) {
                    return {
                        moves: moves.slice(0, moveLimit),
                        truncated: true
                    };
                }
            }
        }

        return {
            moves,
            truncated: false
        };
    }


    function getSingleCaptureSteps(board, fromCell, usedVictimCells) {
        const piece = topPiece(board, fromCell);

        if (!piece) return [];

        const color = piece.color;
        const enemy = opponent(color);
        const isKing = !!piece.king;
        const [row, col] = rc(fromCell);

        const steps = [];

        if (!isKing) {
            for (const [dr, dc] of DIAG_DIRS) {
                const victim = cellNum(row + dr, col + dc);
                const landing = cellNum(row + 2 * dr, col + 2 * dc);

                if (victim === null || landing === null) continue;
                if (usedVictimCells.has(victim)) continue;

                if (owner(board, victim) === enemy && !board[landing]) {
                    steps.push({
                        from: fromCell,
                        to: landing,
                        victim
                    });
                }
            }

            return steps;
        }

        for (const [dr, dc] of DIAG_DIRS) {
            let step = 1;
            let victim = null;

            while (true) {
                const current = cellNum(row + dr * step, col + dc * step);

                if (current === null) break;

                if (board[current]) {
                    const currentOwner = owner(board, current);

                    if (currentOwner === color) break;

                    if (currentOwner === enemy && !usedVictimCells.has(current)) {
                        victim = current;
                        step++;
                        break;
                    }

                    break;
                }

                step++;
            }

            if (victim === null) continue;

            while (true) {
                const landing = cellNum(row + dr * step, col + dc * step);

                if (landing === null) break;
                if (board[landing]) break;

                steps.push({
                    from: fromCell,
                    to: landing,
                    victim
                });

                step++;
            }
        }

        return steps;
    }

    function applyCaptureStep(board, step) {
        const newBoard = cloneBoard(board);

        const fromCell = step.from;
        const toCell = step.to;
        const victimCell = step.victim;

        const movingStack = newBoard[fromCell];
        delete newBoard[fromCell];

        const victimStack = newBoard[victimCell];

        const capturedTop = victimStack.pop();

        if (!victimStack.length) {
            delete newBoard[victimCell];
        }

        const newStack = [capturedTop].concat(movingStack);

        promoteTopIfNeeded(newStack, toCell);

        newBoard[toCell] = newStack;

        return newBoard;
    }

    function collectCaptureSequencesFrom(
        board,
        fromCell,
        results,
        prefix = [],
        usedVictimCells = new Set(),
        depth = 0,
        limit = SETTINGS.maxSequencesPerPiece,
        maxDepth = SETTINGS.maxCaptureDepth
    ) {
        if (results.length >= limit) return true;

        if (depth >= maxDepth) {
            if (prefix.length) {
                results.push(prefix);
            }

            return results.length >= limit;
        }

        const steps = shuffled(getSingleCaptureSteps(board, fromCell, usedVictimCells));

        if (!steps.length) {
            if (prefix.length) {
                results.push(prefix);
            }

            return results.length >= limit;
        }

        for (const step of steps) {
            const nextBoard = applyCaptureStep(board, step);
            const nextUsed = new Set(usedVictimCells);

            nextUsed.add(step.victim);

            const truncated = collectCaptureSequencesFrom(
                nextBoard,
                step.to,
                results,
                prefix.concat([step]),
                nextUsed,
                depth + 1,
                limit,
                maxDepth
            );

            if (truncated) return true;
        }

        return false;
    }

    function getCaptureMovesForPlayer(board, player, moveLimit = SETTINGS.taskMoveLimit, sequenceLimit = SETTINGS.maxSequencesPerPiece, maxDepth = SETTINGS.maxCaptureDepth) {
        const moves = [];
        let truncated = false;

        for (const fromCell of sortedBoardCells(board)) {
            if (owner(board, fromCell) !== player) continue;

            const remaining = Math.max(1, moveLimit - moves.length);
            const sequences = [];

            const pieceTruncated = collectCaptureSequencesFrom(
                board,
                fromCell,
                sequences,
                [],
                new Set(),
                0,
                Math.min(sequenceLimit, remaining),
                maxDepth
            );

            for (const seq of sequences) {
                if (!seq.length) continue;

                const path = seq.map(step => step.to);
                const victims = seq.map(step => step.victim);

                moves.push({
                    kind: "capture",
                    from: fromCell,
                    to: path[path.length - 1],
                    path,
                    victims,
                    captures: victims.length,
                    steps: seq
                });

                if (moves.length >= moveLimit) {
                    truncated = true;

                    return {
                        moves: moves.slice(0, moveLimit),
                        truncated
                    };
                }
            }

            if (pieceTruncated) {
                truncated = true;

                return {
                    moves: moves.slice(0, moveLimit),
                    truncated
                };
            }
        }

        return {
            moves,
            truncated
        };
    }

    function getLegalMovesForPlayer(board, player, moveLimit = SETTINGS.taskMoveLimit, sequenceLimit = SETTINGS.maxSequencesPerPiece, maxDepth = SETTINGS.maxCaptureDepth) {
        const captureResult = getCaptureMovesForPlayer(board, player, moveLimit, sequenceLimit, maxDepth);

        if (captureResult.moves.length) {
            return {
                mode: "capture",
                moves: captureResult.moves,
                truncated: captureResult.truncated
            };
        }

        const quietResult = getQuietMovesForPlayer(board, player, moveLimit);

        return {
            mode: "quiet",
            moves: quietResult.moves,
            truncated: quietResult.truncated
        };
    }


    function applyQuietMove(board, move) {
        const newBoard = cloneBoard(board);
        const stack = newBoard[move.from];

        delete newBoard[move.from];

        promoteTopIfNeeded(stack, move.to);

        newBoard[move.to] = stack;

        return newBoard;
    }

    function applyCaptureSequence(board, move) {
        let newBoard = cloneBoard(board);

        for (const step of move.steps) {
            newBoard = applyCaptureStep(newBoard, step);
        }

        return newBoard;
    }

    function applyMove(board, move) {
        if (move.kind === "capture") {
            return applyCaptureSequence(board, move);
        }

        return applyQuietMove(board, move);
    }


    function countOwnedStacks(board, player) {
        let total = 0;

        for (const cell in board) {
            if (owner(board, cell) === player) {
                total++;
            }
        }

        return total;
    }

    function countTotalPieces(board) {
        let total = 0;

        for (const cell in board) {
            total += board[cell].length;
        }

        return total;
    }

    function countKings(board) {
        let total = 0;

        for (const cell in board) {
            for (const piece of board[cell]) {
                if (piece.king) total++;
            }
        }

        return total;
    }

    function getWhiteKingCells(board) {
        const cells = [];

        for (const cell of sortedBoardCells(board)) {
            const piece = topPiece(board, cell);

            if (piece && piece.color === "white" && piece.king) {
                cells.push(cell);
            }
        }

        return cells;
    }

    function getBlackKingCells(board) {
        const cells = [];

        for (const cell of sortedBoardCells(board)) {
            const piece = topPiece(board, cell);

            if (piece && piece.color === "black" && piece.king) {
                cells.push(cell);
            }
        }

        return cells;
    }

    function moveEndsOnPromotionRow(move, player) {
        const targetRow = promotionRow(player);

        if (move.kind === "capture") {
            return move.steps.some(step => rc(step.to)[0] === targetRow);
        }

        return rc(move.to)[0] === targetRow;
    }

    function whiteKingCaptureMoves(board) {
        const result = getCaptureMovesForPlayer(board, "white", SETTINGS.taskMoveLimit);
        const moves = [];

        for (const move of result.moves) {
            const piece = topPiece(board, move.from);

            if (piece && piece.color === "white" && piece.king) {
                moves.push(move);
            }
        }

        return moves;
    }

    function isRealisticStage(board, kingMode) {
        const occupied = Object.keys(board).length;
        const whiteOwned = countOwnedStacks(board, "white");
        const blackOwned = countOwnedStacks(board, "black");
        const kingCount = countKings(board);

        if (countTotalPieces(board) !== 24) return false;
        if (occupied < 10 || occupied > 24) return false;
        if (whiteOwned < 3 || blackOwned < 3) return false;
        if (kingCount > 1) return false;

        if (kingMode) {
            if (kingCount !== 1) return false;
            if (getWhiteKingCells(board).length !== 1) return false;
            if (getBlackKingCells(board).length !== 0) return false;
        } else {
            if (kingCount !== 0) return false;
        }

        return true;
    }

    function analyzeWhiteTask(board) {
        const legal = getLegalMovesForPlayer(board, "white", SETTINGS.taskMoveLimit);

        let damkaCaptureMoves = [];

        if (legal.mode === "capture") {
            damkaCaptureMoves = legal.moves.filter(move => {
                const piece = topPiece(board, move.from);

                return !!(
                    piece &&
                    piece.color === "white" &&
                    piece.king
                );
            });
        }

        return {
            mode: legal.mode,
            moves: legal.moves,
            answer: legal.moves.length,
            truncated: legal.truncated,
            white_king_cells: getWhiteKingCells(board),
            black_king_cells: getBlackKingCells(board),
            white_king_has_capture: damkaCaptureMoves.length > 0,
            white_king_capture_moves: damkaCaptureMoves
        };
    }


    function scoreSimulationMove(board, move, player, mode, preferWhiteKing) {
        let score = Math.random();

        const fromPiece = topPiece(board, move.from);
        const finalCell = move.to;
        const [finalRow] = rc(finalCell);

        if (mode === "capture") {
            score += (move.captures || 0) * 5;
        }

        if (fromPiece && fromPiece.king) {
            score += 6;
        }

        if (player === "white") {
            score += finalRow * 1.05;

            if (preferWhiteKing && moveEndsOnPromotionRow(move, "white")) {
                score += 95;
            }

            if (preferWhiteKing && fromPiece && fromPiece.king) {
                score += 35;
            }

            if (preferWhiteKing && mode === "capture" && fromPiece && fromPiece.king) {
                score += 45;
            }
        } else {
            score += (9 - finalRow) * 0.55;

            if (moveEndsOnPromotionRow(move, "black")) {
                score -= 80;
            }
        }

        return score;
    }

    function chooseSimulationMove(board, moves, mode, player, preferWhiteKing) {
        if (!moves.length) {
            throw new Error("Нельзя выбрать ход из пустого списка.");
        }

        const scoredMoves = moves.map(move => ({
            move,
            score: scoreSimulationMove(board, move, player, mode, preferWhiteKing)
        }));

        if (preferWhiteKing && player === "white" && Math.random() < 0.82) {
            scoredMoves.sort((a, b) => b.score - a.score);

            return choice(
                scoredMoves
                    .slice(0, Math.min(3, scoredMoves.length))
                    .map(item => item.move)
            );
        }

        if (mode === "capture") {
            const roll = Math.random();

            if (roll < 0.22) {
                const sortedMoves = moves
                    .slice()
                    .sort((a, b) => (b.captures || 0) - (a.captures || 0));

                return choice(sortedMoves.slice(0, Math.min(3, sortedMoves.length)));
            }

            if (roll < 0.48) {
                const sortedMoves = moves
                    .slice()
                    .sort((a, b) => (a.captures || 0) - (b.captures || 0));

                return choice(sortedMoves.slice(0, Math.min(4, sortedMoves.length)));
            }
        }

        return choice(moves);
    }

    function simulateGame(minPlies, maxPlies, preferWhiteKing, stopAfterWhiteKing = false) {
        let board = initialBoard();

        let player = Math.random() < 0.57 ? "white" : "black";
        const plies = randInt(minPlies, maxPlies);
        let noMovePasses = 0;
        let extraAfterKing = null;

        for (let i = 0; i < plies; i++) {
            const legal = getLegalMovesForPlayer(
                board,
                player,
                SETTINGS.simulationMoveLimit,
                SETTINGS.simulationSequencesPerPiece,
                SETTINGS.simulationMaxCaptureDepth
            );

            if (!legal.moves.length) {
                noMovePasses++;
                player = opponent(player);

                if (noMovePasses >= 2) break;

                continue;
            }

            noMovePasses = 0;

            const move = chooseSimulationMove(
                board,
                legal.moves,
                legal.mode,
                player,
                preferWhiteKing
            );

            board = applyMove(board, move);

            if (countOwnedStacks(board, "white") === 0 || countOwnedStacks(board, "black") === 0) {
                break;
            }

            if (stopAfterWhiteKing) {
                const whiteKings = getWhiteKingCells(board);

                if (whiteKings.length === 1 && countKings(board) === 1) {
                    if (extraAfterKing === null) {
                        extraAfterKing = randInt(2, 7);
                    } else if (extraAfterKing <= 0) {
                        break;
                    } else {
                        extraAfterKing--;
                    }
                }

                if (countKings(board) > 1 || getBlackKingCells(board).length) {
                    break;
                }
            }

            player = opponent(player);
        }

        return board;
    }


    function chooseGenerationPlan() {
        const kingMode = Math.random() < SETTINGS.kingGenerationProbability;

        if (kingMode) {
            if (Math.random() < 0.72) {
                const target = weightedChoice({
                    2: 18,
                    3: 30,
                    4: 30,
                    5: 22,
                    6: 10
                });

                return {
                    desiredMode: "white_king_capture",
                    targetAnswer: target,
                    kingMode: true
                };
            }

            const target = weightedChoice({
                3: 18,
                4: 24,
                5: 24,
                6: 20,
                7: 16,
                8: 10,
                9: 4,
                10: 3
            });

            return {
                desiredMode: "white_king_quiet",
                targetAnswer: target,
                kingMode: true
            };
        }

        if (Math.random() < 0.78) {
            const target = weightedChoice({
                2: 18,
                3: 28,
                4: 28,
                5: 18
            });

            return {
                desiredMode: "capture",
                targetAnswer: target,
                kingMode: false
            };
        }

        const target = weightedChoice({
            2: 4,
            3: 14,
            4: 20,
            5: 22,
            6: 22,
            7: 18,
            8: 14,
            9: 6,
            10: 4
        });

        return {
            desiredMode: "quiet",
            targetAnswer: target,
            kingMode: false
        };
    }

    function simulateCandidateForPlan(desiredMode, kingMode) {
        if (kingMode) {
            if (desiredMode === "white_king_capture") {
                const roll = Math.random();

                if (roll < 0.30) {
                    return simulateGame(20, 36, true, true);
                }

                if (roll < 0.80) {
                    return simulateGame(30, 52, true, true);
                }

                return simulateGame(40, 64, true, true);
            }

            const roll = Math.random();

            if (roll < 0.45) {
                return simulateGame(20, 38, true, true);
            }

            if (roll < 0.86) {
                return simulateGame(28, 50, true, true);
            }

            return simulateGame(38, 62, true, true);
        }

        if (desiredMode === "capture") {
            const roll = Math.random();

            if (roll < 0.42) {
                return simulateGame(8, 16, false, false);
            }

            if (roll < 0.88) {
                return simulateGame(12, 26, false, false);
            }

            return simulateGame(18, 30, false, false);
        }

        const roll = Math.random();

        if (roll < 0.58) {
            return simulateGame(4, 12, false, false);
        }

        if (roll < 0.90) {
            return simulateGame(8, 22, false, false);
        }

        return simulateGame(16, 28, false, false);
    }

    function candidateScore(board, analysis, desiredMode, targetAnswer, kingMode) {
        const mode = analysis.mode;
        const answer = analysis.answer;
        const hasWhiteKing = analysis.white_king_cells.length > 0;
        const whiteKingCapture = analysis.white_king_has_capture;

        if (analysis.truncated) return -10000;
        if (answer <= 0) return -10000;
        if (countKings(board) > 1) return -10000;

        if (kingMode) {
            if (countKings(board) !== 1 || !hasWhiteKing) return -10000;
        } else {
            if (countKings(board) !== 0) return -10000;
        }

        let score = 0;

        if (desiredMode === "white_king_capture") {
            if (mode === "capture" && whiteKingCapture) {
                score += 650;
            } else if (mode === "capture") {
                score += 220;
            } else {
                score -= 250;
            }

            if (answer >= 2 && answer <= 6) {
                score += 220;
            } else if (answer === 1) {
                score -= 350;
            } else if (answer >= 7 && answer <= 10) {
                score += 40;
            } else {
                score -= 120;
            }
        } else if (desiredMode === "white_king_quiet") {
            if (mode === "quiet") {
                score += 420;
            } else {
                score -= 150;
            }

            if (answer >= 3 && answer <= 8) {
                score += 180;
            } else if (answer === 2 || answer === 9 || answer === 10) {
                score += 90;
            } else {
                score -= 100;
            }
        } else if (desiredMode === "capture") {
            if (mode === "capture") {
                score += 500;
            } else {
                score -= 160;
            }

            if (answer >= 2 && answer <= 5) {
                score += 240;
            } else if (answer === 1) {
                score -= 450;
            } else if (answer >= 6 && answer <= 8) {
                score += 70;
            } else {
                score -= 130;
            }
        } else {
            if (mode === "quiet") {
                score += 420;
            } else {
                score -= 140;
            }

            if (answer >= 3 && answer <= 8) {
                score += 190;
            } else if (answer === 2 || answer === 9 || answer === 10) {
                score += 90;
            } else if (answer === 1) {
                score -= 260;
            } else {
                score -= 100;
            }
        }

        score -= Math.abs(answer - targetAnswer) * 35;

        if (answer === targetAnswer) {
            score += 260;
        }

        const occupied = Object.keys(board).length;

        if (occupied >= 14 && occupied <= 22) {
            score += 70;
        } else if (occupied >= 10 && occupied <= 13) {
            score += 20;
        }

        return score;
    }

    function isGoodForPlan(analysis, desiredMode) {
        const answer = analysis.answer;

        if (analysis.truncated) return false;

        if (desiredMode === "white_king_capture") {
            return (
                analysis.mode === "capture" &&
                analysis.white_king_has_capture &&
                answer >= 2 &&
                answer <= 10
            );
        }

        if (desiredMode === "white_king_quiet") {
            return analysis.mode === "quiet" && answer >= 2 && answer <= 10;
        }

        if (desiredMode === "capture") {
            return analysis.mode === "capture" && answer >= 2 && answer <= 5;
        }

        return analysis.mode === "quiet" && answer >= 2 && answer <= 10;
    }


    function fallbackNoKingBoard() {
        return initialBoard();
    }

    function fallbackWhiteKingCaptureBoard() {
        return {
            2: [makePiece("white")],
            4: [makePiece("white")],
            10: [makePiece("white", true)],
            13: [makePiece("white")],
            22: [makePiece("white")],
            31: [makePiece("white")],
            40: [makePiece("white")],

            19: [makePiece("black")],
            24: [makePiece("black")],
            33: [makePiece("black")],
            42: [makePiece("black")],
            50: [makePiece("black")],
            52: [makePiece("black")],
            54: [makePiece("black")],
            56: [makePiece("black")],

            36: [makePiece("black"), makePiece("white")],
            45: [makePiece("white"), makePiece("black")]
        };
    }


    function generateTaskInternal() {
        const plan = chooseGenerationPlan();

        const desiredMode = plan.desiredMode;
        const targetAnswer = plan.targetAnswer;
        const kingMode = plan.kingMode;

        const startTime = Date.now();

        let bestExact = null;
        let bestGood = null;
        let bestAny = null;
        let attemptsDone = 0;

        for (let attempt = 0; attempt < SETTINGS.maxAttempts; attempt++) {
            attemptsDone = attempt + 1;

            if (Date.now() - startTime > SETTINGS.generationTimeBudgetMs) {
                break;
            }

            const board = simulateCandidateForPlan(desiredMode, kingMode);

            if (!isRealisticStage(board, kingMode)) {
                continue;
            }

            const analysis = analyzeWhiteTask(board);

            if (analysis.answer <= 0) {
                continue;
            }

            const score = candidateScore(
                board,
                analysis,
                desiredMode,
                targetAnswer,
                kingMode
            );

            if (score <= -9000) {
                continue;
            }

            const candidate = {
                score,
                board,
                analysis
            };

            if (!bestAny || score > bestAny.score) {
                bestAny = candidate;
            }

            if (isGoodForPlan(analysis, desiredMode)) {
                if (!bestGood || score > bestGood.score) {
                    bestGood = candidate;
                }

                if (analysis.answer === targetAnswer) {
                    bestExact = candidate;
                    break;
                }
            }
        }

        let chosen;
        let source;

        if (bestExact) {
            chosen = bestExact;
            source = "точное совпадение";
        } else if (bestGood) {
            chosen = bestGood;
            source = "лучший подходящий вариант";
        } else if (bestAny) {
            chosen = bestAny;
            source = "лучший найденный вариант";
        } else {
            const fallback = kingMode
                ? fallbackWhiteKingCaptureBoard()
                : fallbackNoKingBoard();

            chosen = {
                score: 0,
                board: fallback,
                analysis: analyzeWhiteTask(fallback)
            };

            source = "страховочная позиция";
        }

        return {
            board: chosen.board,
            analysis: chosen.analysis,
            meta: {
                desired_mode: desiredMode,
                target_answer: targetAnswer,
                king_mode: kingMode,
                score: chosen.score,
                attempts_done: attemptsDone,
                generation_ms: Date.now() - startTime,
                source
            }
        };
    }


    function makeAnswerOptions(correct) {
        const candidates = [
            correct,
            correct + 1,
            correct - 1,
            correct + 2,
            correct - 2
        ];

        const options = [];

        for (const value of candidates) {
            if (value >= 1 && !options.includes(value)) {
                options.push(value);
            }

            if (options.length === 4) break;
        }

        while (options.length < 4) {
            const low = Math.max(1, correct - 4);
            const high = Math.max(correct + 4, 10);
            const value = randInt(low, high);

            if (!options.includes(value)) {
                options.push(value);
            }
        }

        return shuffled(options).map(value => ({
            id: String(value),
            text: String(value)
        }));
    }


    function colorRu(color) {
        return color === "white" ? "белая" : "чёрная";
    }

    function pieceRu(piece) {
        const base = colorRu(piece.color);

        if (piece.king) {
            return `${base} дамка`;
        }

        return `${base} шашка`;
    }

    function movingName(board, cell) {
        const stack = board[cell];
        const top = topPiece(board, cell);

        if (!top) return "Белая шашка";

        if (top.king) {
            return top.color === "white" ? "Белая дамка" : "Чёрная дамка";
        }

        if (stack && stack.length > 1) {
            return top.color === "white" ? "Белая башня" : "Чёрная башня";
        }

        return top.color === "white" ? "Белая шашка" : "Чёрная шашка";
    }

    function describeMove(board, move) {
        const name = movingName(board, move.from);

        if (move.kind === "quiet") {
            return `${name} с клетки ${move.from} ходит на клетку ${move.to}`;
        }

        const parts = [];
        let current = move.from;

        for (const step of move.steps) {
            const victimPiece = topPiece(board, step.victim);
            let victimText = "верхнюю фишку";

            if (victimPiece) {
                victimText = `верхнюю ${pieceRu(victimPiece)}`;
            }

            parts.push(
                `с ${current} рубит ${victimText} на клетке ${step.victim} и переходит на клетку ${step.to}`
            );

            current = step.to;
        }

        return `${name} ${parts.join("; затем ")}`;
    }

    function buildExplanation(board, analysis) {
        const lines = [];

        if (analysis.mode === "capture") {
            lines.push("У белых есть обязательная рубка, поэтому считаются только варианты хода с рубкой");

            for (const move of analysis.moves) {
                lines.push(describeMove(board, move));
            }

            lines.push(`Всего вариантов хода с рубкой: ${analysis.answer}`);

            return lines.join("; ");
        }

        lines.push("Рубки у белых нет, поэтому считаются все обычные допустимые ходы");

        for (const move of analysis.moves) {
            lines.push(describeMove(board, move));
        }

        lines.push(`Всего обычных ходов: ${analysis.answer}`);

        return lines.join("; ");
    }


    function serializeBoard(board) {
        const result = {};

        for (const cell of sortedBoardCells(board)) {
            result[cell] = board[cell].map(piece => ({
                color: piece.color,
                king: !!piece.king
            }));
        }

        return result;
    }

    function pieceImageKey(piece) {
        if (piece.king) {
            return piece.color === "white" ? "white_damka" : "black_damka";
        }

        return piece.color;
    }

    function getPieceImagesObject() {
        if (typeof pieceImages !== "undefined") {
            return pieceImages;
        }

        if (window.pieceImages) {
            return window.pieceImages;
        }

        return {};
    }


    window.drawGreenNumbers = function drawStolbStacks(ctx, originalCenters, data, pieceSizeFromGame) {
        if (!data || data.type !== "stolb_stacks") return;

        const board = data.board || {};
        const images = getPieceImagesObject();

        const c1 = originalCenters[1];
        const c2 = originalCenters[2];

        const cellSize = c1 && c2
            ? Math.hypot(c2.x - c1.x, c2.y - c1.y)
            : pieceSizeFromGame;

        const drawSize = cellSize * SETTINGS.pieceSizeFactor;
        const half = drawSize / 2;

        const offsetX = drawSize * SETTINGS.stackOffsetX;
        const offsetY = drawSize * SETTINGS.stackOffsetY;

        for (const cellStr of Object.keys(board).sort((a, b) => Number(a) - Number(b))) {
            const cell = Number(cellStr);
            const center = originalCenters[cell];
            const stack = board[cellStr];

            if (!center || !Array.isArray(stack)) continue;

            for (let i = 0; i < stack.length; i++) {
                const piece = stack[i];
                const key = pieceImageKey(piece);
                const img = images[key];

                if (!img) continue;

                const x = center.x - half - i * offsetX;
                const y = center.y - half - i * offsetY;

                ctx.drawImage(img, x, y, drawSize, drawSize);
            }
        }
    };


    function generateStolbTask1() {
        const generated = generateTaskInternal();

        const board = generated.board;
        const analysis = generated.analysis;
        const answer = analysis.answer;

        return {
            question: "Ход белых. Сколько вариантов хода есть у игрока?",
            answer_type: "single",
            options: makeAnswerOptions(answer),
            correct: String(answer),

            position: {},

            highlights: {},
            targets: null,
            highlighted_cell: null,

            green_numbers: {
                type: "stolb_stacks",
                board: serializeBoard(board)
            },

            explanation: buildExplanation(board, analysis),

            skipPositionNumbers: [],

            _stolb_board: serializeBoard(board),
            _stolb_answer: answer,
            _stolb_mode: analysis.mode,
            _stolb_moves: analysis.moves,
            _stolb_meta: generated.meta
        };
    }


    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["1"] = generateStolbTask1;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["1"] = "Ход белых. Сколько вариантов хода есть у игрока?";

    window.originalCenters = centers;
})();
