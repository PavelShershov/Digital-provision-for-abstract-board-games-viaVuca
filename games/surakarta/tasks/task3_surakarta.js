
(() => {
    const SCALE = 4;
    const x_coords = [198.5747 * SCALE, 283.5562 * SCALE, 368.5176 * SCALE,
                      453.2119 * SCALE, 538.4826 * SCALE, 623.4546 * SCALE];
    const y_coords = [199.0346 * SCALE, 284.1168 * SCALE, 369.2626 * SCALE,
                      453.9480 * SCALE, 538.8127 * SCALE, 623.8693 * SCALE];
    const SHIFT_X = 0.2 * SCALE;
    const SHIFT_Y = 0;

    const cellCenters = {};
    for (let row = 1; row <= 6; row++) {
        const y = y_coords[row - 1] + SHIFT_Y;
        for (let col = 1; col <= 6; col++) {
            const x = x_coords[col - 1] + SHIFT_X;
            const pos = (row - 1) * 6 + col;
            cellCenters[pos] = { x, y };
        }
    }

    const STRICT_ATTEMPTS = {
        light: 260,
        mid: 70,
        dense: 90
    };

    const FALLBACK_ATTEMPTS = {
        light: 260,
        dense: 120,
        mid: 40
    };

    const MIDGAME_MAX_PLIES = 18;

    const BIG_LINES = {
        'col_3': [3, 9, 15, 21, 27, 33],
        'col_4': [4, 10, 16, 22, 28, 34],
        'row_3': [13, 14, 15, 16, 17, 18],
        'row_4': [19, 20, 21, 22, 23, 24]
    };

    const SMALL_LINES = {
        'col_2': [2, 8, 14, 20, 26, 32],
        'col_5': [5, 11, 17, 23, 29, 35],
        'row_2': [7, 8, 9, 10, 11, 12],
        'row_5': [25, 26, 27, 28, 29, 30]
    };

    const BIG_TRANSITIONS = {
        'col_3,UP':    ['row_3', 13, 'RIGHT'],
        'col_3,DOWN':  ['row_4', 19, 'RIGHT'],
        'col_4,UP':    ['row_3', 18, 'LEFT'],
        'col_4,DOWN':  ['row_4', 24, 'LEFT'],
        'row_3,LEFT':  ['col_3', 3, 'DOWN'],
        'row_3,RIGHT': ['col_4', 4, 'DOWN'],
        'row_4,LEFT':  ['col_3', 33, 'UP'],
        'row_4,RIGHT': ['col_4', 34, 'UP']
    };

    const SMALL_TRANSITIONS = {
        'col_2,UP':    ['row_2', 7, 'RIGHT'],
        'col_2,DOWN':  ['row_5', 25, 'RIGHT'],
        'col_5,UP':    ['row_2', 12, 'LEFT'],
        'col_5,DOWN':  ['row_5', 30, 'LEFT'],
        'row_2,LEFT':  ['col_2', 2, 'DOWN'],
        'row_2,RIGHT': ['col_5', 5, 'DOWN'],
        'row_5,LEFT':  ['col_2', 32, 'UP'],
        'row_5,RIGHT': ['col_5', 35, 'UP']
    };

    const CORNER_CELLS = new Set([1, 6, 31, 36]);

    function posToRC(pos) {
        return {
            row: Math.floor((pos - 1) / 6) + 1,
            col: (pos - 1) % 6 + 1
        };
    }

    function rcToPos(row, col) {
        return (row - 1) * 6 + col;
    }

    function buildFullCircle(start, line, lineName, dirEnd, transitions, allLines) {
        const path = [];
        let currentLine = line;
        let currentName = lineName;
        let direction = dirEnd;
        let idx = currentLine.indexOf(start);

        for (let step = 0; step < 24; step++) {
            if (direction === 'UP' || direction === 'LEFT') {
                let nextIdx = idx - 1;

                if (nextIdx < 0) {
                    const key = currentName + ',' + direction;
                    const trans = transitions[key];

                    if (!trans) break;

                    const [newName, entry, newDir] = trans;
                    const newLine = allLines[newName];

                    path.push({ pos: entry, afterLoop: true });
                    currentLine = newLine;
                    currentName = newName;
                    direction = newDir;
                    idx = currentLine.indexOf(entry);
                } else {
                    const pos = currentLine[nextIdx];

                    path.push({ pos, afterLoop: false });
                    idx = nextIdx;
                }
            } else {
                let nextIdx = idx + 1;

                if (nextIdx >= currentLine.length) {
                    const key = currentName + ',' + direction;
                    const trans = transitions[key];

                    if (!trans) break;

                    const [newName, entry, newDir] = trans;
                    const newLine = allLines[newName];

                    path.push({ pos: entry, afterLoop: true });
                    currentLine = newLine;
                    currentName = newName;
                    direction = newDir;
                    idx = currentLine.indexOf(entry);
                } else {
                    const pos = currentLine[nextIdx];

                    path.push({ pos, afterLoop: false });
                    idx = nextIdx;
                }
            }
        }

        return path;
    }

    const PATH_CACHE = {};

    (function initPathCache() {
        const systems = [
            { lines: BIG_LINES, transitions: BIG_TRANSITIONS },
            { lines: SMALL_LINES, transitions: SMALL_TRANSITIONS }
        ];

        for (const { lines, transitions } of systems) {
            for (const [lineName, line] of Object.entries(lines)) {
                for (const start of line) {
                    if (CORNER_CELLS.has(start)) continue;

                    const dirs = lineName.startsWith('col') ? ['UP', 'DOWN'] : ['LEFT', 'RIGHT'];

                    for (const dir of dirs) {
                        const key = start + '|' + lineName + '|' + dir;
                        PATH_CACHE[key] = buildFullCircle(start, line, lineName, dir, transitions, lines);
                    }
                }
            }
        }
    })();

    class SurakartaBoard {
        constructor() {
            this.board = new Array(37).fill(null);
        }

        placePiece(pos, color) {
            this.board[pos] = color;
        }

        getColor(pos) {
            return this.board[pos];
        }

        piecesOfColor(color) {
            const result = [];

            for (let pos = 1; pos <= 36; pos++) {
                if (this.board[pos] === color) {
                    result.push(pos);
                }
            }

            return result;
        }

        *_iterCapturePaths(start, opponent) {
            const myColor = this.board[start];

            if (!myColor) return;

            const systems = [
                { lines: BIG_LINES },
                { lines: SMALL_LINES }
            ];

            for (const { lines } of systems) {
                for (const [lineName, line] of Object.entries(lines)) {
                    if (!line.includes(start)) continue;

                    const dirs = lineName.startsWith('col') ? ['UP', 'DOWN'] : ['LEFT', 'RIGHT'];

                    for (const d of dirs) {
                        const cacheKey = start + '|' + lineName + '|' + d;
                        const path = PATH_CACHE[cacheKey];

                        if (!path) continue;

                        let passedLoop = false;
                        const idx = line.indexOf(start);

                        if ((d === 'UP' || d === 'LEFT') && idx === 0) passedLoop = true;
                        if ((d === 'DOWN' || d === 'RIGHT') && idx === line.length - 1) passedLoop = true;

                        for (const { pos, afterLoop } of path) {
                            if (afterLoop) passedLoop = true;
                            if (pos === start) continue;

                            const cell = this.board[pos];

                            if (cell === myColor) break;

                            if (cell === opponent) {
                                if (passedLoop) yield pos;
                                break;
                            }
                        }
                    }
                }
            }
        }

        fastTotalAttacked() {
            const attacked = new Set();

            for (const color of ['P', 'G']) {
                const opponent = color === 'P' ? 'G' : 'P';

                for (const pos of this.piecesOfColor(color)) {
                    for (const target of this._iterCapturePaths(pos, opponent)) {
                        attacked.add(target);
                    }
                }
            }

            return attacked.size;
        }

        captureMovesFor(color) {
            const opponent = color === 'P' ? 'G' : 'P';
            const moves = [];
            const seen = new Set();

            for (const pos of this.piecesOfColor(color)) {
                for (const target of this._iterCapturePaths(pos, opponent)) {
                    const key = pos + '-' + target;

                    if (!seen.has(key)) {
                        seen.add(key);
                        moves.push([color, pos, target]);
                    }
                }
            }

            return moves;
        }

        _getRoute(attacker, target) {
            const opponent = this.board[attacker] === 'P' ? 'G' : 'P';

            for (const { lines, transitions } of [
                { lines: BIG_LINES, transitions: BIG_TRANSITIONS },
                { lines: SMALL_LINES, transitions: SMALL_TRANSITIONS }
            ]) {
                for (const [lineName, line] of Object.entries(lines)) {
                    if (!line.includes(attacker)) continue;

                    const dirs = lineName.startsWith('col') ? ['UP', 'DOWN'] : ['LEFT', 'RIGHT'];

                    for (const d of dirs) {
                        const cacheKey = attacker + '|' + lineName + '|' + d;
                        const path = PATH_CACHE[cacheKey];

                        if (!path) continue;

                        let passedLoop = false;
                        const idx = line.indexOf(attacker);

                        if ((d === 'UP' || d === 'LEFT') && idx === 0) passedLoop = true;
                        if ((d === 'DOWN' || d === 'RIGHT') && idx === line.length - 1) passedLoop = true;

                        const route = [];

                        for (const { pos, afterLoop } of path) {
                            if (afterLoop) passedLoop = true;
                            if (pos === attacker) continue;

                            route.push(pos);

                            const cell = this.board[pos];

                            if (cell === this.board[attacker]) break;

                            if (cell === opponent) {
                                if (passedLoop && pos === target) return route;
                                break;
                            }
                        }
                    }
                }
            }

            return [];
        }
    }

    class DynamicBoard extends SurakartaBoard {
        get_all_moves(color) {
            const moves = [];

            for (const pos of this.piecesOfColor(color)) {
                const { row, col } = posToRC(pos);

                for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    const nr = row + dr;
                    const nc = col + dc;

                    if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                        const target = rcToPos(nr, nc);

                        if (this.board[target] === null) {
                            moves.push([pos, target, false]);
                        }
                    }
                }
            }

            for (const [moveColor, start, target] of this.captureMovesFor(color)) {
                moves.push([start, target, true]);
            }

            return moves;
        }

        make_move(start, end) {
            const color = this.board[start];
            let captured = null;

            if (this.board[end] !== null) {
                captured = color === 'P' ? 'G' : 'P';
            }

            this.board[end] = color;
            this.board[start] = null;

            return captured;
        }

        copy() {
            const newBoard = new DynamicBoard();

            newBoard.board = [...this.board];

            return newBoard;
        }

        has_any_move(pos) {
            if (this.board[pos] === null) return false;

            const { row, col } = posToRC(pos);

            for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                const nr = row + dr;
                const nc = col + dc;

                if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                    if (this.board[rcToPos(nr, nc)] === null) return true;
                }
            }

            for (const [moveColor, start, target] of this.captureMovesFor(this.board[pos])) {
                if (start === pos) return true;
            }

            return false;
        }
    }

    const PURPLE_BACK_ZONE = new Set([31, 32, 33, 34, 35, 36]);
    const GRAY_BACK_ZONE = new Set([1, 2, 3, 4, 5, 6]);

    function isBackZoneViolation(board) {
        for (const pos of board.piecesOfColor('P')) {
            if (PURPLE_BACK_ZONE.has(pos) && !board.has_any_move(pos)) return true;
        }

        for (const pos of board.piecesOfColor('G')) {
            if (GRAY_BACK_ZONE.has(pos) && !board.has_any_move(pos)) return true;
        }

        return false;
    }

    function randomChoice(arr, weights = null) {
        if (!weights) return arr[Math.floor(Math.random() * arr.length)];

        const totalW = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalW;

        for (let i = 0; i < arr.length; i++) {
            r -= weights[i];

            if (r <= 0) return arr[i];
        }

        return arr[arr.length - 1];
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        return arr;
    }

    function drawGreenNumbers(ctx, originalCenters, numbers, pieceSize) {
        if (!ctx || !originalCenters || !numbers) return;

        ctx.save();

        ctx.font = `bold ${Math.floor(pieceSize * 0.35)}px "Inter", system-ui, sans-serif`;
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';

        for (const cs in numbers) {
            const orig = originalCenters[parseInt(cs, 10)];

            if (!orig) continue;

            ctx.fillText(numbers[cs], orig.x, orig.y);
        }

        ctx.restore();
    }

    function getSafeMovesDetails(board, pos) {
        const color = board.getColor(pos);

        if (!color) {
            return {
                safeMoves: [],
                safeCaptures: [],
                unsafeMoves: [],
                unsafeCaptures: []
            };
        }

        const opponent = color === 'P' ? 'G' : 'P';
        const { row, col } = posToRC(pos);

        const safeMoves = [];
        const unsafeMoves = [];
        const safeCaptures = [];
        const unsafeCaptures = [];

        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
            const nr = row + dr;
            const nc = col + dc;

            if (nr < 1 || nr > 6 || nc < 1 || nc > 6) continue;

            const target = rcToPos(nr, nc);

            if (board.board[target] !== null) continue;

            const bCopy = board.copy();

            bCopy.make_move(pos, target);

            let underAttack = false;
            let attacker = null;

            for (const enemyPos of bCopy.piecesOfColor(opponent)) {
                for (const attackedTarget of bCopy._iterCapturePaths(enemyPos, color)) {
                    if (attackedTarget === target) {
                        underAttack = true;
                        attacker = enemyPos;
                        break;
                    }
                }

                if (underAttack) break;
            }

            if (underAttack) {
                const route = attacker !== null ? bCopy._getRoute(attacker, target) : [];

                unsafeMoves.push({
                    pos: target,
                    attacker,
                    route
                });
            } else {
                safeMoves.push(target);
            }
        }

        const captureMoves = board.captureMovesFor(color)
            .filter(move => move[1] === pos);

        for (const move of captureMoves) {
            const start = move[1];
            const target = move[2];

            const bCopy = board.copy();

            bCopy.make_move(start, target);

            let underAttack = false;
            let attacker = null;

            for (const enemyPos of bCopy.piecesOfColor(opponent)) {
                for (const attackedTarget of bCopy._iterCapturePaths(enemyPos, color)) {
                    if (attackedTarget === target) {
                        underAttack = true;
                        attacker = enemyPos;
                        break;
                    }
                }

                if (underAttack) break;
            }

            const route = attacker !== null ? bCopy._getRoute(attacker, target) : [];

            if (underAttack) {
                unsafeCaptures.push({
                    target,
                    attacker,
                    route
                });
            } else {
                safeCaptures.push(target);
            }
        }

        return {
            safeMoves,
            safeCaptures,
            unsafeMoves,
            unsafeCaptures
        };
    }

    function choosePieceA(board) {
        const central = new Set([8, 9, 10, 11, 14, 15, 16, 17, 20, 21, 22, 23, 26, 27, 28, 29]);
        const edge = new Set([2, 3, 4, 5, 7, 13, 19, 25, 12, 18, 24, 30, 32, 33, 34, 35]);
        const candidates = [];
        const weights = [];

        const captureStarts = {
            P: new Set(board.captureMovesFor('P').map(move => move[1])),
            G: new Set(board.captureMovesFor('G').map(move => move[1]))
        };

        for (const color of ['P', 'G']) {
            for (const pos of board.piecesOfColor(color)) {
                const { row, col } = posToRC(pos);

                let hasFree = false;

                for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                    const nr = row + dr;
                    const nc = col + dc;

                    if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                        if (board.board[rcToPos(nr, nc)] === null) {
                            hasFree = true;
                            break;
                        }
                    }
                }

                const hasCapture = captureStarts[color].has(pos);

                if (!hasFree && !hasCapture) continue;

                if (CORNER_CELLS.has(pos)) {
                    candidates.push({ pos, color });
                    weights.push(1);
                } else if (edge.has(pos)) {
                    candidates.push({ pos, color });
                    weights.push(3);
                } else if (central.has(pos)) {
                    candidates.push({ pos, color });
                    weights.push(6);
                } else {
                    candidates.push({ pos, color });
                    weights.push(3);
                }
            }
        }

        if (candidates.length === 0) return null;

        return randomChoice(candidates, weights);
    }

    function generateLightPosition(purpleCnt, grayCnt, boardClass = SurakartaBoard) {
        const board = new boardClass();
        const total = purpleCnt + grayCnt;
        const allCells = Array.from({ length: 36 }, (_, i) => i + 1)
            .filter(p => !CORNER_CELLS.has(p));

        shuffleArray(allCells);

        const chosen = allCells.slice(0, total);
        const shuffled = shuffleArray([...chosen]);

        for (const pos of shuffled.slice(0, purpleCnt)) {
            board.placePiece(pos, 'P');
        }

        for (const pos of shuffled.slice(purpleCnt)) {
            board.placePiece(pos, 'G');
        }

        return board;
    }

    function generateMidgamePosition(boardClass = DynamicBoard) {
        const board = new boardClass();

        for (let pos = 1; pos <= 12; pos++) {
            board.placePiece(pos, 'P');
        }

        for (let pos = 25; pos <= 36; pos++) {
            board.placePiece(pos, 'G');
        }

        let currentColor = 'P';

        for (let i = 0; i < MIDGAME_MAX_PLIES; i++) {
            const moves = board.get_all_moves(currentColor);

            if (moves.length === 0) break;

            const move = moves[Math.floor(Math.random() * moves.length)];

            board.make_move(move[0], move[1]);

            currentColor = currentColor === 'P' ? 'G' : 'P';

            const total = board.piecesOfColor('P').length + board.piecesOfColor('G').length;

            if (total >= 14 && total <= 20 && Math.random() < 0.35) break;
        }

        return board;
    }

    function generateDensePosition(boardClass = SurakartaBoard) {
        const board = new boardClass();

        const poolP = Array.from({ length: 18 }, (_, i) => i + 1);
        const poolG = Array.from({ length: 18 }, (_, i) => i + 19);

        shuffleArray(poolP);
        shuffleArray(poolG);

        const purpleCells = poolP.slice(0, 12);
        const grayCells = poolG.slice(0, 12);

        for (const pos of purpleCells) {
            board.placePiece(pos, 'P');
        }

        for (const pos of grayCells) {
            board.placePiece(pos, 'G');
        }

        return board;
    }

    function createBoardForMode(mode) {
        if (mode === 'light') {
            const purpleCnt = 2 + Math.floor(Math.random() * 4);
            const grayCnt = 2 + Math.floor(Math.random() * 4);
            const total = purpleCnt + grayCnt;

            if (total < 6 || total > 8) return null;

            return generateLightPosition(purpleCnt, grayCnt, DynamicBoard);
        }

        if (mode === 'mid') {
            const board = generateMidgamePosition(DynamicBoard);
            const total = board.piecesOfColor('P').length + board.piecesOfColor('G').length;

            if (total < 14 || total > 20) return null;

            return board;
        }

        if (mode === 'dense') {
            return generateDensePosition(DynamicBoard);
        }

        return null;
    }

    function weightForSafeCount(safeCount, type) {
        if (type === 'corner') {
            if (safeCount === 1 || safeCount === 2) return 1;
            if (safeCount === 3) return 0.5;
            return 0;
        }

        if (type === 'edge') {
            if (safeCount === 2 || safeCount === 3) return 3;
            if (safeCount === 1 || safeCount === 4) return 2;
            if (safeCount === 5) return 1;
            return 0;
        }

        if (safeCount === 2 || safeCount === 3 || safeCount === 4 || safeCount === 5) return 3;
        if (safeCount === 1 || safeCount === 6) return 2;
        if (safeCount === 7) return 0.3;

        return 0;
    }

    function getPositionType(pos) {
        if (CORNER_CELLS.has(pos)) return 'corner';

        if ([2, 3, 4, 5, 7, 13, 19, 25, 12, 18, 24, 30, 32, 33, 34, 35].includes(pos)) {
            return 'edge';
        }

        return 'center';
    }

    function generateOptions(correct, range, numOpt = 4) {
        const candidates = range.filter(v => v !== correct);

        shuffleArray(candidates);

        const distractors = candidates.slice(0, numOpt - 1);
        const opts = [correct, ...distractors];

        shuffleArray(opts);

        return opts.map(v => ({
            id: v.toString(),
            text: v.toString()
        }));
    }

    function buildExplanation(colorA, safeMoves, safeCaptures, unsafeMoves, unsafeCaptures) {
        const enemyColorWord = colorA === 'P' ? 'серой' : 'фиолетовой';

        const safeMoveParts = [
            ...safeMoves.map(pos => String(pos)),
            ...safeCaptures.map(pos => `${pos} (после хода с рубкой)`)
        ];

        const explanationLines = [];

        explanationLines.push(
            safeMoveParts.length > 0
                ? `Безопасные ходы на клетки: ${safeMoveParts.join(', ')}`
                : 'Безопасные ходы на клетки: нет'
        );

        const unsafeLines = [];

        unsafeMoves.forEach(u => {
            if (u.attacker !== null && u.attacker !== undefined) {
                unsafeLines.push(
                    `Позиция ${u.pos} атакуется ${enemyColorWord} фишкой с позиции ${u.attacker}`
                );
            } else {
                unsafeLines.push(
                    `Позиция ${u.pos} атакуется ${enemyColorWord} фишкой`
                );
            }
        });

        unsafeCaptures.forEach(u => {
            if (u.attacker !== null && u.attacker !== undefined) {
                unsafeLines.push(
                    `Позиция ${u.target} (после хода с рубкой) атакуется ${enemyColorWord} фишкой с позиции ${u.attacker}`
                );
            } else {
                unsafeLines.push(
                    `Позиция ${u.target} (после хода с рубкой) атакуется ${enemyColorWord} фишкой`
                );
            }
        });

        if (unsafeLines.length > 0) {
            explanationLines.push('Небезопасные ходы:');
            explanationLines.push(...unsafeLines);
        } else {
            explanationLines.push('Небезопасные ходы: нет');
        }

        return explanationLines.join('; ');
    }

    function buildTaskFromBoard(board, strictMode) {
        const pieceA = choosePieceA(board);

        if (!pieceA) return null;

        const { pos: posA, color: colorA } = pieceA;

        const {
            safeMoves,
            safeCaptures,
            unsafeMoves,
            unsafeCaptures
        } = getSafeMovesDetails(board, posA);

        const safeCount = safeMoves.length + safeCaptures.length;

        if (safeCount <= 0 || safeCount > 7) return null;

        const { row, col } = posToRC(posA);
        let totalFree = 0;

        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
            const nr = row + dr;
            const nc = col + dc;

            if (nr >= 1 && nr <= 6 && nc >= 1 && nc <= 6) {
                if (board.board[rcToPos(nr, nc)] === null) {
                    totalFree++;
                }
            }
        }

        const captureMovesCount = board.captureMovesFor(colorA)
            .filter(m => m[1] === posA).length;

        const maxPossibleSafe = totalFree + captureMovesCount;

        if (maxPossibleSafe <= 0) return null;

        if (strictMode) {
            if (safeCount === maxPossibleSafe) return null;
            if (isBackZoneViolation(board)) return null;

            const type = getPositionType(posA);
            const w = weightForSafeCount(safeCount, type);

            if (w <= 0) return null;

            let maxWeight = 0;

            for (let i = 1; i <= maxPossibleSafe; i++) {
                const wi = weightForSafeCount(i, type);

                if (wi > maxWeight) {
                    maxWeight = wi;
                }
            }

            if (maxWeight <= 0) return null;
            if (Math.random() > w / maxWeight) return null;
        }

        const positionDict = {};

        for (const pos of board.piecesOfColor('P')) {
            positionDict[pos] = 'purple';
        }

        for (const pos of board.piecesOfColor('G')) {
            positionDict[pos] = 'gray';
        }

        const maxRange = Math.max(1, Math.min(Math.max(maxPossibleSafe, safeCount), 7));
        const possibleRange = [];

        for (let i = 1; i <= maxRange; i++) {
            possibleRange.push(i);
        }

        if (!possibleRange.includes(safeCount)) {
            possibleRange.push(safeCount);
        }

        possibleRange.sort((a, b) => a - b);

        const explanation = buildExplanation(
            colorA,
            safeMoves,
            safeCaptures,
            unsafeMoves,
            unsafeCaptures
        );

        return {
            question: 'Сколько безопасных ходов (не ведущих под рубку) есть у фишки А?',
            answer_type: 'single',
            options: generateOptions(safeCount, possibleRange),
            correct: safeCount.toString(),
            position: positionDict,
            explanation,
            green_numbers: {
                [posA]: 'A'
            },
            skipPositionNumbers: [posA],
            targetPos: posA,
            targetColor: colorA,
            safeCount
        };
    }

    function tryGenerateTaskForMode(mode, attempts, strictMode) {
        for (let attempt = 0; attempt < attempts; attempt++) {
            const board = createBoardForMode(mode);

            if (!board) continue;

            const task = buildTaskFromBoard(board, strictMode);

            if (task) return task;
        }

        return null;
    }

    function uniqueModePlan(preferred) {
        const result = [];
        const all = [preferred, 'light', 'dense', 'mid'];

        for (const mode of all) {
            if (!result.includes(mode)) {
                result.push(mode);
            }
        }

        return result;
    }

    function generateSafeMovesTask() {
        const preferredMode = randomChoice(['light', 'mid', 'dense'], [1.5, 1, 1]);
        const strictPlan = uniqueModePlan(preferredMode);

        for (const mode of strictPlan) {
            const task = tryGenerateTaskForMode(mode, STRICT_ATTEMPTS[mode], true);

            if (task) return task;
        }

        const fallbackPlan = ['light', 'dense', 'mid'];

        for (const mode of fallbackPlan) {
            const task = tryGenerateTaskForMode(mode, FALLBACK_ATTEMPTS[mode], false);

            if (task) return task;
        }

        throw new Error('Не удалось сгенерировать задачу');
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["3"] = generateSafeMovesTask;

    window.taskTitles = window.taskTitles || {};
    window.taskTitles["3"] = "🎯 Суракарта: Безопасные ходы фигуры";

    window.originalCenters = cellCenters;
    window.drawGreenNumbers = drawGreenNumbers;
})();
