
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


    const TASK_ID = "2";

    const SETTINGS = {
        pieceSizeFactor: 0.70,
        stackOffsetX: 0.03,
        stackOffsetY: 0.20,

        totalMass: 24,

        targetValues: [3, 4, 5, 6, 7, 8],

        taskMoveLimit: 160,
        maxSequencesPerPiece: 160,
        maxCaptureDepth: 12,

        whiteKingGenerationProbability: 0.25
    };

    const BLACK_SIMPLE_FORBIDDEN_CELLS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
    const WHITE_SIMPLE_FORBIDDEN_CELLS = new Set([57, 58, 59, 60, 61, 62, 63, 64]);

    const DIAG_DIRS = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
    ];


    const TARGET_ROUTES = {
        3: {
            king: false,
            start: 10,
            victims: [19, 37, 55]
        },
        4: {
            king: false,
            start: 27,
            victims: [20, 22, 38, 52]
        },
        5: {
            king: false,
            start: 25,
            victims: [18, 20, 38, 54, 52]
        },
        6: {
            king: false,
            start: 54,
            victims: [47, 31, 13, 11, 27, 43]
        },
        7: {
            king: true,
            start: 6,
            victims: [11, 13, 18, 31, 45, 47, 52]
        },
        8: {
            king: true,
            start: 11,
            victims: [13, 15, 18, 20, 34, 38, 50, 54]
        }
    };


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

    function isPlayableCell(cell) {
        const [row, col] = rc(cell);

        return (row + col) % 2 === 1;
    }

    function playableCells() {
        const cells = [];

        for (let cell = 1; cell <= 64; cell++) {
            if (isPlayableCell(cell)) {
                cells.push(cell);
            }
        }

        return cells;
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

    function isForbiddenSimplePlacement(cell, piece) {
        if (!piece || piece.king) {
            return false;
        }

        const n = Number(cell);

        if (piece.color === "black" && BLACK_SIMPLE_FORBIDDEN_CELLS.has(n)) {
            return true;
        }

        if (piece.color === "white" && WHITE_SIMPLE_FORBIDDEN_CELLS.has(n)) {
            return true;
        }

        return false;
    }

    function hasForbiddenSimplePlacement(board) {
        for (const cellStr in board) {
            const cell = Number(cellStr);
            const stack = board[cellStr];

            if (!Array.isArray(stack)) {
                continue;
            }

            for (const piece of stack) {
                if (isForbiddenSimplePlacement(cell, piece)) {
                    return true;
                }
            }
        }

        return false;
    }

    function safeSimpleColorsForCell(cell) {
        const n = Number(cell);
        const colors = [];

        if (!WHITE_SIMPLE_FORBIDDEN_CELLS.has(n)) {
            colors.push("white");
        }

        if (!BLACK_SIMPLE_FORBIDDEN_CELLS.has(n)) {
            colors.push("black");
        }

        return colors;
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
                if (piece.king) {
                    total++;
                }
            }
        }

        return total;
    }

    function getWhiteKingCells(board) {
        const cells = [];

        for (const cell of Object.keys(board).map(Number).sort((a, b) => a - b)) {
            const piece = topPiece(board, cell);

            if (piece && piece.color === "white" && piece.king) {
                cells.push(cell);
            }
        }

        return cells;
    }

    function getBlackKingCells(board) {
        const cells = [];

        for (const cell of Object.keys(board).map(Number).sort((a, b) => a - b)) {
            const piece = topPiece(board, cell);

            if (piece && piece.color === "black" && piece.king) {
                cells.push(cell);
            }
        }

        return cells;
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
        limit = SETTINGS.maxSequencesPerPiece
    ) {
        if (results.length >= limit) return true;

        if (depth >= SETTINGS.maxCaptureDepth) {
            if (prefix.length) {
                results.push(prefix);
            }

            return results.length >= limit;
        }

        const steps = getSingleCaptureSteps(board, fromCell, usedVictimCells);

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
                limit
            );

            if (truncated) return true;
        }

        return false;
    }

    function getCaptureMovesForPlayer(board, player, moveLimit = SETTINGS.taskMoveLimit) {
        const moves = [];
        let truncated = false;

        for (const fromCell of Object.keys(board).map(Number).sort((a, b) => a - b)) {
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
                Math.min(SETTINGS.maxSequencesPerPiece, remaining)
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

    function moveStartsWithWhiteKing(board, move) {
        const piece = topPiece(board, move.from);

        return !!(
            piece &&
            piece.color === "white" &&
            piece.king
        );
    }

    function analyzeMaxWhiteCaptureTask(board) {
        const result = getCaptureMovesForPlayer(board, "white", SETTINGS.taskMoveLimit);
        const moves = result.moves;
        const truncated = result.truncated;

        if (!moves.length) {
            return {
                has_capture: false,
                capture_moves: [],
                max_capture: 0,
                best_moves: [],
                truncated,
                white_king_cells: getWhiteKingCells(board),
                black_king_cells: getBlackKingCells(board),
                best_has_white_king: false
            };
        }

        const maxCapture = Math.max(...moves.map(move => move.captures));
        const bestMoves = moves.filter(move => move.captures === maxCapture);

        return {
            has_capture: true,
            capture_moves: moves,
            max_capture: maxCapture,
            best_moves: bestMoves,
            truncated,
            white_king_cells: getWhiteKingCells(board),
            black_king_cells: getBlackKingCells(board),
            best_has_white_king: bestMoves.some(move => moveStartsWithWhiteKing(board, move))
        };
    }


    function isExactTargetBoard(board, target) {
        if (hasForbiddenSimplePlacement(board)) {
            return false;
        }

        if (countKings(board) > 1) {
            return false;
        }

        const analysis = analyzeMaxWhiteCaptureTask(board);

        return (
            !analysis.truncated &&
            analysis.has_capture &&
            analysis.max_capture === target
        );
    }

    function makeBaseTargetBoard(target, wantWhiteKing) {
        const route = TARGET_ROUTES[target];

        const useKing = !!route.king;

        const board = {};

        board[route.start] = [makePiece("white", useKing)];

        for (const victimCell of route.victims) {
            board[victimCell] = [makePiece("black")];
        }

        return board;
    }

    function addBottomPiece(board, cell, color = null) {
        const availableColors = safeSimpleColorsForCell(cell);

        if (!availableColors.length) {
            return false;
        }

        const pieceColor = color && availableColors.includes(color)
            ? color
            : choice(availableColors);

        board[cell].unshift(makePiece(pieceColor, false));

        return true;
    }

    function tryAddExtraOccupiedCells(board, target, maxExtraCells = 10) {
        let result = cloneBoard(board);

        const cells = playableCells()
            .filter(cell => !result[cell])
            .sort(() => Math.random() - 0.5);

        let added = 0;

        for (const cell of cells) {
            if (added >= maxExtraCells) break;
            if (countTotalPieces(result) >= SETTINGS.totalMass) break;

            const availableColors = safeSimpleColorsForCell(cell);

            if (!availableColors.length) {
                continue;
            }

            const trial = cloneBoard(result);
            const color = choice(availableColors);

            trial[cell] = [makePiece(color, false)];

            if (isExactTargetBoard(trial, target)) {
                result = trial;
                added++;
            }
        }

        return result;
    }

    function findSafeTowerCells(board, target) {
        const safe = [];

        for (const cell of Object.keys(board).map(Number).sort((a, b) => a - b)) {
            const trial = cloneBoard(board);

            if (!addBottomPiece(trial, cell)) {
                continue;
            }

            if (isExactTargetBoard(trial, target)) {
                safe.push(cell);
            }
        }

        if (!safe.length) {
            const keys = Object.keys(board).map(Number).sort((a, b) => a - b);
            return [keys[0]];
        }

        return safe;
    }

    function fillMassTo24(board, target) {
        let result = cloneBoard(board);
        let guard = 0;

        while (countTotalPieces(result) < SETTINGS.totalMass && guard < 120) {
            guard++;

            let safeCells = findSafeTowerCells(result, target);
            safeCells = shuffled(safeCells);

            let changed = false;

            for (const cell of safeCells) {
                if (countTotalPieces(result) >= SETTINGS.totalMass) break;

                const trial = cloneBoard(result);

                if (!addBottomPiece(trial, cell)) {
                    continue;
                }

                if (isExactTargetBoard(trial, target)) {
                    result = trial;
                    changed = true;
                }
            }

            if (!changed) {
                const ownedWhite = Object.keys(result)
                    .map(Number)
                    .filter(cell => owner(result, cell) === "white")
                    .sort((a, b) => a - b);

                const startCell = ownedWhite.length
                    ? ownedWhite[0]
                    : Number(Object.keys(result)[0]);

                const trial = cloneBoard(result);

                if (!addBottomPiece(trial, startCell)) {
                    break;
                }

                if (isExactTargetBoard(trial, target)) {
                    result = trial;
                } else {
                    break;
                }
            }
        }

        return result;
    }

    function buildControlledPosition(target, wantWhiteKing) {
        let board = makeBaseTargetBoard(target, wantWhiteKing);

        if (!isExactTargetBoard(board, target)) {
            return board;
        }

        board = tryAddExtraOccupiedCells(
            board,
            target,
            randInt(5, 12)
        );

        board = fillMassTo24(board, target);

        return board;
    }

    function chooseGenerationPlan() {
        const target = choice(SETTINGS.targetValues);

        const wantWhiteKing = target === 7 || target === 8;

        return {
            target_max: target,
            want_white_king: wantWhiteKing
        };
    }

    function generateTaskInternal() {
        const startTime = Date.now();

        const plan = chooseGenerationPlan();
        const target = plan.target_max;
        const wantWhiteKing = plan.want_white_king;

        let board = buildControlledPosition(target, wantWhiteKing);
        let analysis = analyzeMaxWhiteCaptureTask(board);

        if (
            hasForbiddenSimplePlacement(board) ||
            countKings(board) > 1 ||
            analysis.truncated ||
            !analysis.has_capture ||
            analysis.max_capture !== target
        ) {
            board = makeBaseTargetBoard(target, wantWhiteKing);
            board = fillMassTo24(board, target);
            analysis = analyzeMaxWhiteCaptureTask(board);
        }

        return {
            board,
            analysis,
            meta: {
                target_max: target,
                want_white_king: wantWhiteKing,
                generation_ms: Date.now() - startTime,
                source: "быстрая целевая генерация без долгой разыгровки партии"
            }
        };
    }


    function makeAnswerOptions(correct) {
        const candidates = [
            correct,
            correct + 1,
            correct - 1,
            correct + 2,
            correct - 2,
            correct + 3,
            correct - 3
        ];

        const options = [];

        for (const value of candidates) {
            if (value >= 1 && value <= 12 && !options.includes(value)) {
                options.push(value);
            }

            if (options.length === 4) break;
        }

        while (options.length < 4) {
            const value = randInt(1, 12);

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

    function captureWord(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;

        if (mod10 === 1 && mod100 !== 11) {
            return "взятие";
        }

        if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
            return "взятия";
        }

        return "взятий";
    }

    function describeCaptureSequence(board, move) {
        const name = movingName(board, move.from);
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

        return (
            `${name} ` +
            parts.join("; затем ") +
            ` (всего ${move.captures} ${captureWord(move.captures)})`
        );
    }

    function buildExplanation(board, analysis) {
        if (!analysis.best_moves.length) {
            return "У белых нет ходов с рубкой";
        }

        const lines = [];

        if (analysis.best_moves.length > 1) {
            lines.push("Есть несколько вариантов с одинаковым максимумом:");
        }

        for (const move of analysis.best_moves) {
            lines.push(describeCaptureSequence(board, move));
        }

        lines.push(`Максимальное количество взятий: ${analysis.max_capture}`);

        return lines.join("; ");
    }


    function serializeBoard(board) {
        const result = {};

        for (const cell of Object.keys(board).map(Number).sort((a, b) => a - b)) {
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


    function generateStolbMaxCaptureTask() {
        const generated = generateTaskInternal();

        const board = generated.board;
        const analysis = generated.analysis;
        const answer = analysis.max_capture;

        return {
            question: "Какое максимальное количество фишек может срубить за один ход белый игрок?",
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
            _stolb_best_moves: analysis.best_moves,
            _stolb_all_capture_moves: analysis.capture_moves,
            _stolb_meta: generated.meta
        };
    }


    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators[TASK_ID] = generateStolbMaxCaptureTask;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles[TASK_ID] = "Какое максимальное количество фишек может срубить за один ход белый игрок?";

    window.originalCenters = centers;
})();
