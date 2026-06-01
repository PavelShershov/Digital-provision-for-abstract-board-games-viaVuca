
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
    const OBVIOUS_PAIRS = [[2, 7], [5, 12], [25, 32], [30, 35]];

    function posToRC(pos) {
        return { row: Math.floor((pos - 1) / 6) + 1, col: (pos - 1) % 6 + 1 };
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
        placePiece(pos, color) { this.board[pos] = color; }
        getColor(pos) { return this.board[pos]; }
        piecesOfColor(color) {
            const result = [];
            for (let pos = 1; pos <= 36; pos++) if (this.board[pos] === color) result.push(pos);
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
                    for (const target of this._iterCapturePaths(pos, opponent)) attacked.add(target);
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

    function buildExplanation(allCaptures, board) {
        if (allCaptures.length === 0) return 'Нет возможных взятий.';

        const mutualPairs = new Set();
        for (let i = 0; i < allCaptures.length; i++) {
            for (let j = i + 1; j < allCaptures.length; j++) {
                if (allCaptures[i][1] === allCaptures[j][2] && allCaptures[i][2] === allCaptures[j][1]) {
                    mutualPairs.add(Math.min(allCaptures[i][1], allCaptures[i][2]) + '-' + Math.max(allCaptures[i][1], allCaptures[i][2]));
                }
            }
        }

        const attackedMap = new Map();
        const lines = [];
        const printedMutual = new Set();

        for (const [color, start, target] of allCaptures) {
            const pairKey = Math.min(start, target) + '-' + Math.max(start, target);
            if (mutualPairs.has(pairKey) && !printedMutual.has(pairKey)) {
                printedMutual.add(pairKey);
                const c1 = board.getColor(start);
                const c2 = board.getColor(target);
                const name1 = c1 === 'P' ? 'Фиолетовая' : 'Серая';
                const name2 = c2 === 'P' ? 'фиолетовая' : 'серая';
                lines.push(`${name1} фишка с клетки ${start} и ${name2} фишка с клетки ${target} атакуют друг друга (Взаимная рубка)`);
                if (!attackedMap.has(start)) attackedMap.set(start, []);
                attackedMap.get(start).push({ attackerPos: target, attackerColor: c2 });
                if (!attackedMap.has(target)) attackedMap.set(target, []);
                attackedMap.get(target).push({ attackerPos: start, attackerColor: c1 });
            }
        }

        for (const [color, start, target] of allCaptures) {
            const pairKey = Math.min(start, target) + '-' + Math.max(start, target);
            if (mutualPairs.has(pairKey)) continue;

            const attackerColor = color;
            const attackerName = attackerColor === 'P' ? 'Фиолетовая' : 'Серая';
            const defenderColor = board.getColor(target);
            const defenderName = defenderColor === 'P' ? 'фиолетовую' : 'серую';

            const existingAttackers = attackedMap.get(target);
            if (!existingAttackers || existingAttackers.length === 0) {
                if (!attackedMap.has(target)) attackedMap.set(target, []);
                attackedMap.get(target).push({ attackerPos: start, attackerColor: attackerColor });
                lines.push(`${attackerName} фишка с клетки ${start} атакует ${defenderName} фишку на клетке ${target}`);
            } else {
                const prevAttackers = existingAttackers.map(a => {
                    const col = a.attackerColor === 'P' ? 'фиолетовой' : 'серой';
                    return `${col} фишки с клетки ${a.attackerPos}`;
                }).join(', ');
                lines.push(`${attackerName} фишка с клетки ${start} также атакует ${defenderName} фишку на клетке ${target} (уже находится под атакой ${prevAttackers})`);
                existingAttackers.push({ attackerPos: start, attackerColor: attackerColor });
            }
        }

        return lines.join('; ');
    }

    function generateRandomPosition(purpleCnt, grayCnt, targetAttacked, maxAttempts = 5000) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const board = new SurakartaBoard();
            const total = purpleCnt + grayCnt;
            const allCells = Array.from({length: 36}, (_, i) => i + 1).filter(p => !CORNER_CELLS.has(p));
            for (let i = allCells.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
            }
            const chosen = allCells.slice(0, total);
            const shuffled = [...chosen];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            for (const pos of shuffled.slice(0, purpleCnt)) board.placePiece(pos, 'P');
            for (const pos of shuffled.slice(purpleCnt)) board.placePiece(pos, 'G');

            if (board.fastTotalAttacked() !== targetAttacked) continue;

            if (targetAttacked === 1) {
                const attackedSet = new Set();
                for (const color of ['P', 'G']) {
                    const opp = color === 'P' ? 'G' : 'P';
                    for (const pos of board.piecesOfColor(color)) {
                        for (const t of board._iterCapturePaths(pos, opp)) attackedSet.add(t);
                    }
                }
                if (attackedSet.size === 1) {
                    const onlyPos = [...attackedSet][0];
                    let skip = false;
                    for (const [a, b] of OBVIOUS_PAIRS) {
                        if (a === onlyPos || b === onlyPos) {
                            const other = a === onlyPos ? b : a;
                            const myColor = board.getColor(onlyPos);
                            const oppColor = myColor === 'P' ? 'G' : 'P';
                            if (board.getColor(other) === oppColor) {
                                skip = true;
                                break;
                            }
                        }
                    }
                    if (skip) continue;
                }
            }

            const positionDict = {};
            for (const pos of board.piecesOfColor('P')) positionDict[pos] = 'purple';
            for (const pos of board.piecesOfColor('G')) positionDict[pos] = 'gray';

            const allCaptures = [];
            for (const color of ['P', 'G']) {
                for (const [col, start, target] of board.captureMovesFor(color)) {
                    allCaptures.push([col, start, target]);
                }
            }

            const explanation = buildExplanation(allCaptures, board);
            return { positionDict, attackedCount: board.fastTotalAttacked(), explanation, allCaptures, board };
        }
        return null;
    }

    function generateLightTask() {
        const targetAttacked = randomChoice([0,1,2,3,4,5], [1,1,4,5,4,2]);
        const purpleCnt = 2 + Math.floor(Math.random() * 4);
        let grayCnt = 2 + Math.floor(Math.random() * 4);
        const total = purpleCnt + grayCnt;
        return generateRandomPosition(purpleCnt, total - purpleCnt, targetAttacked, 10000);
    }

    function generateMidgameTask() {
        const targetAttacked = randomChoice([4,5,6,7,8,9,10], [5,5,5,5,4,2,1]);
        const total = 14 + Math.floor(Math.random() * 7);
        const purpleCnt = Math.floor(total / 2) + (Math.random() < 0.5 ? 1 : 0);
        return generateRandomPosition(purpleCnt, total - purpleCnt, targetAttacked, 5000);
    }

    function generateDenseTask() {
        const targetAttacked = randomChoice([2, 3]);
        for (let attempt = 0; attempt < 5000; attempt++) {
            const board = new SurakartaBoard();
            const poolP = Array.from({length: 18}, (_, i) => i + 1);
            const poolG = Array.from({length: 18}, (_, i) => i + 19);
            for (let i = poolP.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [poolP[i], poolP[j]] = [poolP[j], poolP[i]];
            }
            for (let i = poolG.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [poolG[i], poolG[j]] = [poolG[j], poolG[i]];
            }
            const purpleCells = poolP.slice(0, 12);
            const grayCells = poolG.slice(0, 12);
            if (new Set([...purpleCells, ...grayCells]).size < 24) continue;
            for (const pos of purpleCells) board.placePiece(pos, 'P');
            for (const pos of grayCells) board.placePiece(pos, 'G');

            if (board.fastTotalAttacked() !== targetAttacked) continue;

            const positionDict = {};
            for (const pos of board.piecesOfColor('P')) positionDict[pos] = 'purple';
            for (const pos of board.piecesOfColor('G')) positionDict[pos] = 'gray';

            const allCaptures = [];
            for (const color of ['P', 'G']) {
                for (const [col, start, target] of board.captureMovesFor(color)) allCaptures.push([col, start, target]);
            }

            const explanation = buildExplanation(allCaptures, board);
            return { positionDict, attackedCount: board.fastTotalAttacked(), explanation, board };
        }
        return null;
    }

    function generateOptions(correct, minVal = 0, maxVal = 10, numOpt = 4) {
        const radius = 2;
        let candidates = [];
        for (let i = Math.max(minVal, correct - radius); i <= Math.min(maxVal, correct + radius); i++) {
            if (i !== correct) candidates.push(i);
        }
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const needed = numOpt - 1;
        let distractors = candidates.slice(0, needed);
        if (distractors.length < needed) {
            const allNumbers = [];
            for (let i = minVal; i <= maxVal; i++) {
                if (i !== correct && !distractors.includes(i)) allNumbers.push(i);
            }
            for (let i = allNumbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
            }
            const extra = allNumbers.slice(0, needed - distractors.length);
            distractors.push(...extra);
        }

        const all = [correct, ...distractors];
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        return all.map(v => ({ id: v.toString(), text: v.toString() }));
    }

    function generateSurakartaTask() {
        const mode = randomChoice(['light', 'mid', 'dense'], [1.5, 1, 1]);
        let result = null;
        if (mode === 'light') {
            result = generateLightTask();
            if (!result) result = generateMidgameTask();
        } else if (mode === 'mid') {
            result = generateMidgameTask();
            if (!result) result = generateLightTask();
        } else {
            result = generateDenseTask();
            if (!result) result = generateMidgameTask();
        }
        if (!result) throw new Error('Не удалось сгенерировать задачу');

        const correct = result.attackedCount;
        const options = generateOptions(correct, 0, 10, 4);

        return {
            question: 'Сколько фишек сейчас на поле находится под потенциальной рубкой?',
            answer_type: 'single',
            options,
            correct: correct.toString(),
            position: result.positionDict,
            explanation: result.explanation,
            highlights: {},
            totalPieces: result.board.piecesOfColor('P').length + result.board.piecesOfColor('G').length,
            attackedCount: result.attackedCount
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskGenerators["1"] = generateSurakartaTask;
    window.taskTitles = window.taskTitles || {};
    window.taskTitles["1"] = "🎯 Суракарта: Подсчёт взятий";
    window.originalCenters = cellCenters;
})();
