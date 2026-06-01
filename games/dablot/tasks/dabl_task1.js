
(() => {

    const TASK_ID = "1";

    window.taskGenerators = window.taskGenerators || {};
    window.taskTitles = window.taskTitles || {};

    window.taskTitles[TASK_ID] = "Максимальная рубка красных";


    const SETTINGS = {
        maxAttempts: 650,

        targetWeights: {
            2: 0.35,
            3: 1.00,
            4: 1.00,
            5: 1.00,
            6: 0.20,
            7: 0.12,
            8: 0.08
        },

        minTotalPieces: 18,
        maxTotalPieces: 31,

        maxCaptureDepth: 12,
        maxSequencesPerPiece: 220,

        minRedCapturingPieces: 2,

        maxBestStarts: 2,
        allowTiedMaxProbability: 0.16,

        excludeImmediateBlueKingCapture: false,
        excludeBlueKingFromRedCaptureSeries: false,

        allowBlueKingCaptureOnlyAsFinalBestKingMove: true
    };


    const originalCenters = {
        1: { x: 293.0, y: 298.0 },
        2: { x: 1005.0, y: 297.0 },
        3: { x: 1713.0, y: 298.0 },
        4: { x: 2422.0, y: 299.0 },
        5: { x: 3136.0, y: 302.0 },

        6: { x: 650.0, y: 655.0 },
        7: { x: 1360.0, y: 653.0 },
        8: { x: 2066.0, y: 654.0 },
        9: { x: 2780.0, y: 653.0 },

        10: { x: 297.0, y: 1008.0 },
        11: { x: 1003.0, y: 1010.0 },
        12: { x: 1712.0, y: 1010.0 },
        13: { x: 2422.0, y: 1006.0 },
        14: { x: 3133.0, y: 1009.0 },

        15: { x: 648.0, y: 1363.0 },
        16: { x: 1359.0, y: 1362.0 },
        17: { x: 2061.0, y: 1366.0 },
        18: { x: 2777.0, y: 1365.0 },

        19: { x: 294.0, y: 1715.0 },
        20: { x: 1004.0, y: 1717.0 },
        21: { x: 1711.0, y: 1719.0 },
        22: { x: 2418.0, y: 1719.0 },
        23: { x: 3132.0, y: 1720.0 },

        24: { x: 652.0, y: 2068.0 },
        25: { x: 1356.0, y: 2070.0 },
        26: { x: 2071.0, y: 2071.0 },
        27: { x: 2778.0, y: 2070.0 },

        28: { x: 296.0, y: 2425.0 },
        29: { x: 1002.0, y: 2426.0 },
        30: { x: 1711.0, y: 2423.0 },
        31: { x: 2422.0, y: 2426.0 },
        32: { x: 3131.0, y: 2424.0 },

        33: { x: 653.0, y: 2779.0 },
        34: { x: 1362.0, y: 2780.0 },
        35: { x: 2070.0, y: 2780.0 },
        36: { x: 2777.0, y: 2781.0 },

        37: { x: 297.0, y: 3132.0 },
        38: { x: 1010.0, y: 3136.0 },
        39: { x: 1710.0, y: 3138.0 },
        40: { x: 2422.0, y: 3133.0 },
        41: { x: 3133.0, y: 3133.0 }
    };

    window.originalCenters = originalCenters;


    const GRAPH = {
        1: [2, 6, 10],
        2: [1, 3, 6, 7, 11],
        3: [2, 4, 7, 8, 12],
        4: [3, 5, 8, 9, 13],
        5: [4, 9, 14],

        6: [1, 2, 10, 11],
        7: [2, 3, 11, 12],
        8: [3, 4, 12, 13],
        9: [4, 5, 13, 14],

        10: [1, 6, 11, 15, 19],
        11: [6, 7, 10, 12, 15, 16, 20],
        12: [7, 8, 11, 13, 16, 17, 21],
        13: [8, 9, 12, 14, 17, 18, 22],
        14: [5, 9, 13, 18, 23],

        15: [10, 11, 19, 20],
        16: [11, 12, 20, 21],
        17: [12, 13, 21, 22],
        18: [13, 14, 22, 23],

        19: [10, 15, 20, 24, 28],
        20: [11, 15, 16, 19, 21, 25, 29],
        21: [12, 16, 17, 20, 22, 26, 30],
        22: [13, 17, 18, 21, 23, 27, 31],
        23: [14, 18, 22, 27, 32],

        24: [19, 20, 28, 29],
        25: [20, 21, 29, 30],
        26: [21, 22, 30, 31],
        27: [22, 23, 31, 32],

        28: [19, 24, 29, 33, 37],
        29: [20, 24, 25, 28, 30, 34, 38],
        30: [21, 25, 26, 29, 31, 35, 39],
        31: [22, 26, 27, 30, 32, 36, 40],
        32: [23, 27, 31, 36, 41],

        33: [28, 29, 37, 38],
        34: [29, 30, 38, 39],
        35: [30, 31, 39, 40],
        36: [31, 32, 40, 41],

        37: [28, 33, 38],
        38: [29, 33, 34, 37, 39],
        39: [30, 34, 35, 38, 40],
        40: [31, 35, 36, 39, 41],
        41: [32, 36, 40]
    };

    for (const cellStr of Object.keys(GRAPH)) {
        const cell = Number(cellStr);

        for (const nb of GRAPH[cell]) {
            if (!GRAPH[nb]) GRAPH[nb] = [];

            if (!GRAPH[nb].includes(cell)) {
                GRAPH[nb].push(cell);
            }
        }
    }


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
        const entries = Object.keys(weightMap).map(key => ({
            value: Number(key),
            weight: weightMap[key]
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

    function clonePiece(piece) {
        return {
            color: piece.color,
            type: piece.type
        };
    }

    function clonePosition(pos) {
        const result = {};

        for (const cell in pos) {
            result[cell] = clonePiece(pos[cell]);
        }

        return result;
    }

    function opponent(color) {
        return color === "red" ? "blue" : "red";
    }

    function pieceName(color, type) {
        if (color === "red" && type === "pawn") return "красная фишка";
        if (color === "blue" && type === "pawn") return "синяя фишка";
        if (color === "red" && type === "king") return "красный король";
        if (color === "blue" && type === "king") return "синий король";

        return `${color} ${type}`;
    }

    function movingPieceName(type) {
        return type === "king" ? "красный король" : "красная фишка";
    }

    function countPieces(pos, color = null, type = null) {
        let total = 0;

        for (const cell in pos) {
            const piece = pos[cell];

            if (color !== null && piece.color !== color) continue;
            if (type !== null && piece.type !== type) continue;

            total++;
        }

        return total;
    }

    function totalPieces(pos) {
        return Object.keys(pos).length;
    }

    function findKing(pos, color) {
        for (const cell of Object.keys(pos).map(Number).sort((a, b) => a - b)) {
            const piece = pos[cell];

            if (piece.color === color && piece.type === "king") {
                return cell;
            }
        }

        return null;
    }

    function emptyCells(pos, exclude = new Set()) {
        const result = [];

        for (let cell = 1; cell <= 41; cell++) {
            if (!pos[cell] && !exclude.has(cell)) {
                result.push(cell);
            }
        }

        return result;
    }


    function pointsAreStraight(a, b, c) {
        const p1 = originalCenters[a];
        const p2 = originalCenters[b];
        const p3 = originalCenters[c];

        const dx1 = p2.x - p1.x;
        const dy1 = p2.y - p1.y;

        const dx2 = p3.x - p2.x;
        const dy2 = p3.y - p2.y;

        const len1 = Math.hypot(dx1, dy1);
        const len2 = Math.hypot(dx2, dy2);

        if (len1 === 0 || len2 === 0) return false;

        const cross = Math.abs(dx1 * dy2 - dy1 * dx2) / (len1 * len2);
        const dot = (dx1 * dx2 + dy1 * dy2) / (len1 * len2);
        const ratio = len1 / len2;

        return cross <= 0.08 && dot > 0.96 && ratio >= 0.65 && ratio <= 1.55;
    }

    function buildJumps() {
        const jumps = {};

        for (let start = 1; start <= 41; start++) {
            jumps[start] = [];

            for (const over of GRAPH[start] || []) {
                for (const landing of GRAPH[over] || []) {
                    if (landing === start) continue;

                    if (pointsAreStraight(start, over, landing)) {
                        jumps[start].push({
                            over,
                            to: landing
                        });
                    }
                }
            }
        }

        return jumps;
    }

    const JUMPS = buildJumps();


    const BLUE_START_PAWNS = [
        1, 2, 3, 4, 5,
        6, 7, 8, 9,
        10, 11, 12, 13, 14,
        15, 16, 17, 18
    ];

    const RED_START_PAWNS = [
        24, 25, 26, 27,
        28, 29, 30, 31, 32,
        33, 34, 35, 36,
        37, 38, 39, 40, 41
    ];

    function initialPosition() {
        const pos = {};

        for (const cell of BLUE_START_PAWNS) {
            pos[cell] = {
                color: "blue",
                type: "pawn"
            };
        }

        for (const cell of RED_START_PAWNS) {
            pos[cell] = {
                color: "red",
                type: "pawn"
            };
        }

        pos[19] = {
            color: "red",
            type: "king"
        };

        pos[23] = {
            color: "blue",
            type: "king"
        };

        return pos;
    }


    function isForwardMove(color, fromCell, toCell) {
        const y1 = originalCenters[fromCell].y;
        const y2 = originalCenters[toCell].y;

        if (color === "red") {
            return y2 < y1 - 5;
        }

        return y2 > y1 + 5;
    }

    function getQuietMovesForPiece(pos, cell) {
        if (!pos[cell]) return [];

        const piece = pos[cell];
        const moves = [];

        for (const to of GRAPH[cell] || []) {
            if (pos[to]) continue;

            if (piece.type === "king") {
                moves.push({
                    kind: "quiet",
                    from: Number(cell),
                    to
                });
            } else if (isForwardMove(piece.color, Number(cell), to)) {
                moves.push({
                    kind: "quiet",
                    from: Number(cell),
                    to
                });
            }
        }

        return moves;
    }

    function getQuietMovesForPlayer(pos, color) {
        const moves = [];

        for (const cell of Object.keys(pos).map(Number).sort((a, b) => a - b)) {
            if (pos[cell].color === color) {
                moves.push(...getQuietMovesForPiece(pos, cell));
            }
        }

        return moves;
    }


    function getSingleJumps(pos, cell, forbidCaptureKingColor = null) {
        if (!pos[cell]) return [];

        const piece = pos[cell];
        const enemy = opponent(piece.color);
        const result = [];

        for (const jump of JUMPS[cell] || []) {
            const over = jump.over;
            const landing = jump.to;

            if (!pos[over]) continue;
            if (pos[landing]) continue;

            const victim = pos[over];

            if (victim.color !== enemy) continue;

            if (piece.type === "pawn" && victim.type !== "pawn") continue;

            if (
                forbidCaptureKingColor !== null &&
                victim.color === forbidCaptureKingColor &&
                victim.type === "king"
            ) {
                continue;
            }

            result.push({
                from: Number(cell),
                over,
                to: landing,
                victim: {
                    color: victim.color,
                    type: victim.type
                }
            });
        }

        return result;
    }

    function applyJump(pos, jump) {
        const newPos = clonePosition(pos);

        const movingPiece = newPos[jump.from];

        delete newPos[jump.from];
        delete newPos[jump.over];

        newPos[jump.to] = movingPiece;

        return newPos;
    }

    function collectCaptureSequences(
        pos,
        cell,
        path = [],
        depth = 0,
        maxDepth = SETTINGS.maxCaptureDepth,
        limit = SETTINGS.maxSequencesPerPiece,
        forbidCaptureKingColor = null
    ) {
        if (depth >= maxDepth) {
            return path.length ? [path] : [];
        }

        const jumps = shuffled(
            getSingleJumps(
                pos,
                cell,
                forbidCaptureKingColor
            )
        );

        if (!jumps.length) {
            return path.length ? [path] : [];
        }

        const sequences = [];

        for (const jump of jumps) {
            const newPos = applyJump(pos, jump);

            const nextSequences = collectCaptureSequences(
                newPos,
                jump.to,
                path.concat([jump]),
                depth + 1,
                maxDepth,
                limit,
                forbidCaptureKingColor
            );

            for (const seq of nextSequences) {
                if (!seq.length) continue;

                sequences.push(seq);

                if (sequences.length >= limit) {
                    return sequences;
                }
            }
        }

        return sequences;
    }

    function allCaptureSequencesForPlayer(pos, color, forbidCaptureKingColor = null) {
        const records = [];

        for (const cell of Object.keys(pos).map(Number).sort((a, b) => a - b)) {
            const piece = pos[cell];

            if (piece.color !== color) continue;

            const sequences = collectCaptureSequences(
                pos,
                cell,
                [],
                0,
                SETTINGS.maxCaptureDepth,
                SETTINGS.maxSequencesPerPiece,
                forbidCaptureKingColor
            );

            for (const seq of sequences) {
                if (!seq.length) continue;

                records.push({
                    start: cell,
                    piece_type: piece.type,
                    sequence: seq,
                    count: seq.length
                });
            }
        }

        return records;
    }

    function captureProfileForRed(pos) {
        const forbidColor = SETTINGS.excludeBlueKingFromRedCaptureSeries
            ? "blue"
            : null;

        const records = allCaptureSequencesForPlayer(
            pos,
            "red",
            forbidColor
        );

        const maxByStart = {};
        const typeByStart = {};

        for (const record of records) {
            const start = record.start;

            typeByStart[start] = record.piece_type;
            maxByStart[start] = Math.max(maxByStart[start] || 0, record.count);
        }

        if (!records.length) {
            return {
                records: [],
                best: 0,
                best_records: [],
                capturing_starts: [],
                best_starts: [],
                max_by_start: {},
                type_by_start: {}
            };
        }

        const best = Math.max(...records.map(record => record.count));
        const bestRecords = records.filter(record => record.count === best);
        const capturingStarts = Object.keys(maxByStart).map(Number).sort((a, b) => a - b);
        const bestStarts = Array.from(new Set(bestRecords.map(record => record.start))).sort((a, b) => a - b);

        return {
            records,
            best,
            best_records: bestRecords,
            capturing_starts: capturingStarts,
            best_starts: bestStarts,
            max_by_start: maxByStart,
            type_by_start: typeByStart
        };
    }

    function maxCapturesForRed(pos) {
        const profile = captureProfileForRed(pos);

        return {
            best: profile.best,
            bestRecords: profile.best_records
        };
    }

    function redCanImmediatelyCaptureBlueKing(pos) {
        for (const cell of Object.keys(pos).map(Number)) {
            const piece = pos[cell];

            if (piece.color !== "red") continue;

            const jumps = getSingleJumps(pos, cell, null);

            for (const jump of jumps) {
                if (jump.victim.color === "blue" && jump.victim.type === "king") {
                    return true;
                }
            }
        }

        return false;
    }

    function recordCapturesBlueKing(record) {
        return !!(
            record &&
            record.sequence &&
            record.sequence.some(step =>
                step.victim &&
                step.victim.color === "blue" &&
                step.victim.type === "king"
            )
        );
    }

    function recordEndsWithBlueKingCapture(record) {
        if (!record || !record.sequence || !record.sequence.length) {
            return false;
        }

        const lastStep = record.sequence[record.sequence.length - 1];

        return !!(
            lastStep.victim &&
            lastStep.victim.color === "blue" &&
            lastStep.victim.type === "king"
        );
    }

    function blueKingCaptureAllowedForRecord(record, best) {
        if (!recordCapturesBlueKing(record)) {
            return true;
        }

        if (!SETTINGS.allowBlueKingCaptureOnlyAsFinalBestKingMove) {
            return true;
        }

        if (record.piece_type !== "king") {
            return false;
        }

        if (record.count !== best) {
            return false;
        }

        if (record.count < 2) {
            return false;
        }

        if (!recordEndsWithBlueKingCapture(record)) {
            return false;
        }

        return true;
    }

    function blueKingCaptureRuleOk(profile) {
        if (!SETTINGS.allowBlueKingCaptureOnlyAsFinalBestKingMove) {
            return true;
        }

        if (!profile || !Array.isArray(profile.records)) {
            return false;
        }

        const best = profile.best || 0;

        for (const record of profile.records) {
            if (!blueKingCaptureAllowedForRecord(record, best)) {
                return false;
            }
        }

        return true;
    }


    function positionIsReasonable(pos) {
        if (findKing(pos, "red") === null) return false;
        if (findKing(pos, "blue") === null) return false;

        if (countPieces(pos, "red", "king") !== 1) return false;
        if (countPieces(pos, "blue", "king") !== 1) return false;

        if (countPieces(pos, "red", "pawn") < 5) return false;
        if (countPieces(pos, "blue", "pawn") < 5) return false;

        if (totalPieces(pos) < SETTINGS.minTotalPieces) return false;
        if (totalPieces(pos) > SETTINGS.maxTotalPieces) return false;

        if (
            SETTINGS.excludeImmediateBlueKingCapture &&
            redCanImmediatelyCaptureBlueKing(pos)
        ) {
            return false;
        }

        const profile = captureProfileForRed(pos);

        if (!blueKingCaptureRuleOk(profile)) {
            return false;
        }

        return true;
    }

    function captureDistributionOk(pos, target = null, allowTiedMax = false) {
        if (
            SETTINGS.excludeImmediateBlueKingCapture &&
            redCanImmediatelyCaptureBlueKing(pos)
        ) {
            return false;
        }

        const profile = captureProfileForRed(pos);

        if (!blueKingCaptureRuleOk(profile)) {
            return false;
        }

        if (target !== null && profile.best !== target) return false;
        if (profile.best <= 0) return false;

        if (profile.capturing_starts.length < SETTINGS.minRedCapturingPieces) {
            return false;
        }

        if (profile.best_starts.length > SETTINGS.maxBestStarts) {
            return false;
        }

        if (profile.best_starts.length > 1 && !allowTiedMax) {
            return false;
        }

        return true;
    }


    function getLegalMovesForPlayer(pos, color) {
        const forbidKingColor = opponent(color);

        const allCaptures = allCaptureSequencesForPlayer(
            pos,
            color,
            forbidKingColor
        );

        const pawnCaptures = allCaptures.filter(record => record.piece_type === "pawn");
        const kingCaptures = allCaptures.filter(record => record.piece_type === "king");
        const quietMoves = getQuietMovesForPlayer(pos, color);

        if (pawnCaptures.length) {
            return pawnCaptures.map(record => ({
                kind: "capture",
                record
            }));
        }

        const moves = [];

        for (const record of kingCaptures) {
            moves.push({
                kind: "capture",
                record
            });
        }

        for (const move of quietMoves) {
            moves.push(move);
        }

        return moves;
    }

    function applyMove(pos, move) {
        if (move.kind === "quiet") {
            const newPos = clonePosition(pos);
            const piece = newPos[move.from];

            delete newPos[move.from];

            newPos[move.to] = piece;

            return newPos;
        }

        let newPos = clonePosition(pos);

        for (const jump of move.record.sequence) {
            newPos = applyJump(newPos, jump);
        }

        return newPos;
    }

    function choosePlayoutMove(pos, color, moves) {
        if (!moves.length) return null;

        const weights = moves.map(move => {
            let weight = 1.0;

            if (move.kind === "capture") {
                weight += move.record.count * 2.5;
            }

            if (move.kind === "quiet") {
                const y1 = originalCenters[move.from].y;
                const y2 = originalCenters[move.to].y;

                if (color === "red" && y2 < y1) {
                    weight += 0.6;
                }

                if (color === "blue" && y2 > y1) {
                    weight += 0.6;
                }
            }

            return weight;
        });

        const total = weights.reduce((sum, w) => sum + w, 0);
        let r = Math.random() * total;

        for (let i = 0; i < moves.length; i++) {
            r -= weights[i];

            if (r <= 0) {
                return moves[i];
            }
        }

        return moves[moves.length - 1];
    }

    function randomPlayoutPosition() {
        let pos = initialPosition();

        let color = Math.random() < 0.5 ? "red" : "blue";
        const plies = randInt(8, 32);

        for (let i = 0; i < plies; i++) {
            const moves = getLegalMovesForPlayer(pos, color);

            if (!moves.length) {
                color = opponent(color);
                continue;
            }

            const move = choosePlayoutMove(pos, color, moves);

            if (!move) {
                color = opponent(color);
                continue;
            }

            pos = applyMove(pos, move);

            if (findKing(pos, "red") === null || findKing(pos, "blue") === null) {
                break;
            }

            if (countPieces(pos, "red", "pawn") < 4 || countPieces(pos, "blue", "pawn") < 4) {
                break;
            }

            color = opponent(color);
        }

        return pos;
    }


    function weightedTarget() {
        return weightedChoice(SETTINGS.targetWeights);
    }

    function findJumpPath(length) {
        const starts = shuffled(Object.keys(originalCenters).map(Number));

        function dfs(current, pathCells, victims, usedCells) {
            if (victims.length === length) {
                return {
                    pathCells,
                    victims
                };
            }

            const possible = shuffled(JUMPS[current] || []);

            for (const jump of possible) {
                const over = jump.over;
                const to = jump.to;

                if (usedCells.has(over)) continue;
                if (usedCells.has(to)) continue;

                const nextUsed = new Set(usedCells);

                nextUsed.add(over);
                nextUsed.add(to);

                const result = dfs(
                    to,
                    pathCells.concat([to]),
                    victims.concat([over]),
                    nextUsed
                );

                if (result !== null) {
                    return result;
                }
            }

            return null;
        }

        for (const start of starts) {
            const result = dfs(start, [start], [], new Set([start]));

            if (result !== null) {
                return result;
            }
        }

        return null;
    }

    function placeRequiredKings(pos, moverType, startCell, forbiddenEmptyCells = new Set()) {
        const result = clonePosition(pos);

        if (moverType === "king") {
            result[startCell] = {
                color: "red",
                type: "king"
            };
        } else {
            result[startCell] = {
                color: "red",
                type: "pawn"
            };
        }

        if (findKing(result, "red") === null) {
            const candidates = shuffled(emptyCells(result, forbiddenEmptyCells));

            for (const cell of candidates) {
                const trial = clonePosition(result);

                trial[cell] = {
                    color: "red",
                    type: "king"
                };

                if (!redCanImmediatelyCaptureBlueKing(trial)) {
                    result[cell] = {
                        color: "red",
                        type: "king"
                    };
                    break;
                }
            }
        }

        if (findKing(result, "blue") === null) {
            const candidates = shuffled(emptyCells(result, forbiddenEmptyCells));

            for (const cell of candidates) {
                const trial = clonePosition(result);

                trial[cell] = {
                    color: "blue",
                    type: "king"
                };

                if (!redCanImmediatelyCaptureBlueKing(trial)) {
                    result[cell] = {
                        color: "blue",
                        type: "king"
                    };
                    break;
                }
            }
        }

        return result;
    }

    function addSecondaryRedCaptures(pos, target, allowTiedMax, forbiddenEmptyCells = new Set()) {
        let result = clonePosition(pos);

        for (let attempt = 0; attempt < 1800; attempt++) {
            if (captureDistributionOk(result, target, allowTiedMax)) {
                return result;
            }

            if (totalPieces(result) + 2 > SETTINGS.maxTotalPieces) {
                break;
            }

            const start = choice(Object.keys(originalCenters).map(Number));
            const jumpList = JUMPS[start] || [];

            if (!jumpList.length) continue;

            const jump = choice(jumpList);
            const over = jump.over;
            const landing = jump.to;

            if (result[start] || result[over] || result[landing]) continue;
            if (forbiddenEmptyCells.has(start) || forbiddenEmptyCells.has(over) || forbiddenEmptyCells.has(landing)) continue;

            const trial = clonePosition(result);

            trial[start] = {
                color: "red",
                type: "pawn"
            };

            trial[over] = {
                color: "blue",
                type: "pawn"
            };

            if (
                SETTINGS.excludeImmediateBlueKingCapture &&
                redCanImmediatelyCaptureBlueKing(trial)
            ) {
                continue;
            }

            const profile = captureProfileForRed(trial);

            if (profile.best !== target) continue;
            if (profile.best_starts.length > SETTINGS.maxBestStarts) continue;
            if (profile.best_starts.length > 1 && !allowTiedMax) continue;

            if (profile.capturing_starts.length >= captureProfileForRed(result).capturing_starts.length) {
                result = trial;
            }
        }

        return result;
    }

    function addSafeFiller(pos, target, allowTiedMax, forbiddenEmptyCells = new Set()) {
        let result = clonePosition(pos);
        const wantedTotal = randInt(SETTINGS.minTotalPieces, SETTINGS.maxTotalPieces);

        let attempts = 0;

        while (totalPieces(result) < wantedTotal && attempts < 1000) {
            attempts++;

            const empties = emptyCells(result, forbiddenEmptyCells);

            if (!empties.length) break;

            const cell = choice(empties);
            const color = Math.random() < 0.48 ? "red" : "blue";

            const trial = clonePosition(result);

            trial[cell] = {
                color,
                type: "pawn"
            };

            if (
                SETTINGS.excludeImmediateBlueKingCapture &&
                redCanImmediatelyCaptureBlueKing(trial)
            ) {
                continue;
            }

            if (!captureDistributionOk(trial, target, allowTiedMax)) {
                continue;
            }

            result = trial;
        }

        return result;
    }

    function controlledPosition(target, allowTiedMax) {
        for (let attempt = 0; attempt < 350; attempt++) {
            const pathData = findJumpPath(target);

            if (pathData === null) continue;

            const pathCells = pathData.pathCells;
            const victims = pathData.victims;
            const startCell = pathCells[0];

            const forbiddenEmptyCells = new Set(pathCells.slice(1));

            let moverType;

            if (target >= 5) {
                moverType = Math.random() < 0.65 ? "king" : "pawn";
            } else {
                moverType = Math.random() < 0.70 ? "pawn" : "king";
            }

            let pos = {};

            for (const victim of victims) {
                pos[victim] = {
                    color: "blue",
                    type: "pawn"
                };
            }

            pos = placeRequiredKings(
                pos,
                moverType,
                startCell,
                forbiddenEmptyCells
            );

            if (findKing(pos, "red") === null || findKing(pos, "blue") === null) {
                continue;
            }

            const maxResult = maxCapturesForRed(pos);

            if (maxResult.best !== target) continue;

            if (
                SETTINGS.excludeImmediateBlueKingCapture &&
                redCanImmediatelyCaptureBlueKing(pos)
            ) {
                continue;
            }

            pos = addSecondaryRedCaptures(
                pos,
                target,
                allowTiedMax,
                forbiddenEmptyCells
            );

            if (!captureDistributionOk(pos, target, allowTiedMax)) {
                continue;
            }

            pos = addSafeFiller(
                pos,
                target,
                allowTiedMax,
                forbiddenEmptyCells
            );

            if (!positionIsReasonable(pos)) {
                continue;
            }

            if (captureDistributionOk(pos, target, allowTiedMax)) {
                return pos;
            }
        }

        return null;
    }


    function makeAnswerOptions(correct) {
        const values = [
            correct,
            correct - 1,
            correct + 1,
            correct - 2,
            correct + 2,
            correct + 3
        ];

        const options = [];

        for (const value of values) {
            if (value >= 1 && !options.includes(value)) {
                options.push(value);
            }

            if (options.length === 4) break;
        }

        while (options.length < 4) {
            const value = randInt(1, Math.max(8, correct + 3));

            if (!options.includes(value)) {
                options.push(value);
            }
        }

        return shuffled(options).map(value => ({
            id: String(value),
            text: String(value)
        }));
    }

    function chooseBestRecord(bestRecords) {
        const recordsWithFinalBlueKingCapture = bestRecords.filter(record =>
            record.piece_type === "king" &&
            recordEndsWithBlueKingCapture(record)
        );

        if (recordsWithFinalBlueKingCapture.length) {
            return choice(recordsWithFinalBlueKingCapture);
        }

        return choice(bestRecords);
    }

    function candidateScore(pos, target, allowTiedMax) {
        if (!positionIsReasonable(pos)) {
            return -999999;
        }

        const profile = captureProfileForRed(pos);

        if (!blueKingCaptureRuleOk(profile)) {
            return -999999;
        }

        if (profile.best < 2) return -999999;

        if (profile.capturing_starts.length < SETTINGS.minRedCapturingPieces) {
            return -999999;
        }

        if (profile.best_starts.length > SETTINGS.maxBestStarts) {
            return -999999;
        }

        if (profile.best_starts.length > 1 && !allowTiedMax) {
            return -999999;
        }

        let score = 0;

        score -= Math.abs(profile.best - target) * 14;
        score += Math.min(totalPieces(pos), 30);
        score += Math.min(profile.capturing_starts.length, 5) * 15;

        if (profile.best_starts.length === 1) {
            score += 30;
        } else if (profile.best_starts.length === 2 && allowTiedMax) {
            score += 8;
        }

        if (profile.best === target) {
            score += 120;
        }

        return score;
    }

    function generateInternalTask() {
        const target = weightedTarget();
        const allowTiedMax = Math.random() < SETTINGS.allowTiedMaxProbability;

        let bestFallback = null;
        let bestFallbackScore = -999999;

        for (let attempt = 0; attempt < SETTINGS.maxAttempts; attempt++) {
            const pos = randomPlayoutPosition();
            const score = candidateScore(pos, target, allowTiedMax);

            if (score <= -9000) continue;

            const profile = captureProfileForRed(pos);

            if (score > bestFallbackScore) {
                const selected = chooseBestRecord(profile.best_records);

                bestFallback = {
                    pos,
                    best: profile.best,
                    bestRecords: profile.best_records,
                    selected,
                    profile
                };

                bestFallbackScore = score;
            }

            if (
                profile.best === target &&
                captureDistributionOk(pos, target, allowTiedMax)
            ) {
                const selected = chooseBestRecord(profile.best_records);

                return buildTaskResult(
                    pos,
                    profile.best,
                    profile.best_records,
                    selected,
                    profile,
                    "разыгровка партии",
                    allowTiedMax
                );
            }
        }

        let pos = controlledPosition(target, allowTiedMax);

        if (pos !== null) {
            const profile = captureProfileForRed(pos);

            if (profile.best_records.length) {
                const selected = chooseBestRecord(profile.best_records);

                return buildTaskResult(
                    pos,
                    profile.best,
                    profile.best_records,
                    selected,
                    profile,
                    "контролируемая генерация",
                    allowTiedMax
                );
            }
        }

        if (bestFallback !== null) {
            return buildTaskResult(
                bestFallback.pos,
                bestFallback.best,
                bestFallback.bestRecords,
                bestFallback.selected,
                bestFallback.profile,
                "лучший найденный вариант",
                allowTiedMax
            );
        }

        pos = controlledPosition(3, false);

        if (pos === null) {
            pos = initialPosition();
        }

        const profile = captureProfileForRed(pos);

        const selected = profile.best_records.length
            ? chooseBestRecord(profile.best_records)
            : null;

        return buildTaskResult(
            pos,
            profile.best,
            profile.best_records,
            selected,
            profile,
            "страховочная позиция",
            false
        );
    }

    function buildTaskResult(pos, answer, bestRecords, selectedRecord, profile, source, allowTiedMax) {
        return {
            question: "Сейчас ход красного игрока, сколько максимум фишек он может срубить?",
            options: makeAnswerOptions(answer),
            correct: String(answer),
            position: serializePosition(pos),
            answer,
            best_records: bestRecords,
            selected_record: selectedRecord,
            capture_profile: profile,
            source,
            allow_tied_max: allowTiedMax
        };
    }


    function pieceKey(piece) {
        if (piece.color === "red" && piece.type === "pawn") return "red";
        if (piece.color === "blue" && piece.type === "pawn") return "blue";
        if (piece.color === "red" && piece.type === "king") return "red_king";
        if (piece.color === "blue" && piece.type === "king") return "blue_king";

        return piece.color;
    }

    function serializePosition(pos) {
        const result = {};

        for (const cell of Object.keys(pos).map(Number).sort((a, b) => a - b)) {
            result[cell] = pieceKey(pos[cell]);
        }

        return result;
    }

    function positionListsFromSerialized(position) {
        const bluePawns = [];
        const redPawns = [];
        let blueKing = null;
        let redKing = null;

        for (const cell of Object.keys(position).map(Number).sort((a, b) => a - b)) {
            const key = position[cell];

            if (key === "blue") bluePawns.push(cell);
            if (key === "red") redPawns.push(cell);
            if (key === "blue_king") blueKing = cell;
            if (key === "red_king") redKing = cell;
        }

        return {
            bluePawns,
            redPawns,
            blueKing,
            redKing
        };
    }

    function captureWord(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;

        if (mod10 === 1 && mod100 !== 11) return "фишку";
        if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "фишки";

        return "фишек";
    }

    function sequenceToText(record) {
        if (!record) {
            return "Максимальная серия не найдена.";
        }

        const start = record.start;
        const type = record.piece_type;
        const sequence = record.sequence;

        const parts = [];

        for (const step of sequence) {
            const victim = pieceName(step.victim.color, step.victim.type);

            parts.push(
                `с ${step.from} рубит ${victim} на позиции ${step.over} и переходит на ${step.to}`
            );
        }

        return `${movingPieceName(type)} с позиции ${start}: ${parts.join("; затем ")}`;
    }

    function buildExplanation(task) {
        const lines = [];

        lines.push(`Максимальная серия срубленных фишек: ${task.answer}.`);

        if (task.selected_record) {
            lines.push(`Её делает ${sequenceToText(task.selected_record)}.`);
        }

        const profile = task.capture_profile;

        if (profile && profile.capturing_starts && profile.capturing_starts.length) {
            const summary = profile.capturing_starts.map(start => {
                const type = profile.type_by_start[start];
                const maxCount = profile.max_by_start[start];

                return `${movingPieceName(type)} на позиции ${start}: максимум ${maxCount}`;
            });

            lines.push(`Красные фигуры, у которых есть рубка: ${summary.join("; ")}.`);
        }

        if (profile && profile.best_starts && profile.best_starts.length > 1) {
            lines.push(`Есть несколько фигур с одинаковым максимумом: ${profile.best_starts.join(", ")}.`);
        }

        lines.push(`Ответ: ${task.answer} ${captureWord(task.answer)}.`);

        return lines.join(" ");
    }


    function generateDablotMaxCaptureTask() {
        const internalTask = generateInternalTask();

        const explanation = buildExplanation(internalTask);

        return {
            question: internalTask.question,
            answer_type: "single",
            options: internalTask.options,
            correct: internalTask.correct,

            position: internalTask.position,

            highlights: {},
            targets: null,
            highlighted_cell: null,

            green_numbers: null,

            explanation,

            skipPositionNumbers: [],

            _dablot_answer: internalTask.answer,
            _dablot_best_records: internalTask.best_records,
            _dablot_selected_record: internalTask.selected_record,
            _dablot_capture_profile: internalTask.capture_profile,
            _dablot_source: internalTask.source,
            _dablot_allow_tied_max: internalTask.allow_tied_max
        };
    }

	window.taskGenerators = window.taskGenerators || {};
	window.taskGenerators["1"] = generateDablotMaxCaptureTask;

	window.taskTitles = window.taskTitles || {};
	window.taskTitles["1"] = "Максимальная рубка красных";
})();
