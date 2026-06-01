
(() => {

    const TASK_ID = "2";

    window.taskGenerators = window.taskGenerators || {};
    window.taskTitles = window.taskTitles || {};

    window.taskTitles[TASK_ID] = "Сколько ходов с рубкой у красных";


    const SETTINGS = {
        maxAttempts: 700,

        targetWeights: {
            2: 0.25,
            3: 0.85,
            4: 1.00,
            5: 1.00,
            6: 0.85,
            7: 0.35,
            8: 0.20,
            9: 0.10
        },

        minTotalPieces: 17,
        maxTotalPieces: 31,

        minAnswer: 2,
        maxAnswer: 9,

        minRedCapturingPieces: 2,

        maxCaptureDepth: 12,
        maxSequencesPerPiece: 240,

        excludeImmediateBlueKingCapture: true,
        excludeBlueKingFromRedCaptureSeries: true,

        drawSettings: {
            pieceSize: 180,
			kingPieceWidth: 291,
			kingPieceHeight: 395,
            numberFontSize: 70
        }
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
            if (!GRAPH[nb]) {
                GRAPH[nb] = [];
            }

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

    function movingPieceName(color, type) {
        if (color === "red" && type === "king") return "красный король";
        if (color === "red" && type === "pawn") return "красная фишка";
        if (color === "blue" && type === "king") return "синий король";

        return "синяя фишка";
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

        if (len1 === 0 || len2 === 0) {
            return false;
        }

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

            if (piece.type === "pawn" && victim.type !== "pawn") {
                continue;
            }

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

    function collectTerminalCaptureSequences(
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

            const nextSequences = collectTerminalCaptureSequences(
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

    function allCaptureMovesForPlayer(pos, color, forbidCaptureKingColor = null) {
        const records = [];

        for (const cell of Object.keys(pos).map(Number).sort((a, b) => a - b)) {
            const piece = pos[cell];

            if (piece.color !== color) continue;

            const sequences = collectTerminalCaptureSequences(
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
                    count: seq.length,
                    end: seq[seq.length - 1].to
                });
            }
        }

        return records;
    }


    function mirrorSignature(record) {
        const victims = record.sequence
            .map(step => step.over)
            .sort((a, b) => a - b)
            .join(",");

        return [
            record.start,
            record.piece_type,
            record.end,
            victims
        ].join("|");
    }

    function deduplicateMirrorRecords(records) {
        const seen = new Map();

        const uniqueRecords = [];
        const mirrorRecords = [];
        const displayRecords = [];

        for (const record of records) {
            const signature = mirrorSignature(record);

            if (seen.has(signature)) {
                const mirrorRecord = {
                    ...record,
                    is_mirror_duplicate: true,
                    mirror_of: seen.get(signature) + 1
                };

                mirrorRecords.push(mirrorRecord);
                displayRecords.push(mirrorRecord);
            } else {
                const uniqueRecord = {
                    ...record,
                    is_mirror_duplicate: false,
                    mirror_of: null
                };

                seen.set(signature, uniqueRecords.length);
                uniqueRecords.push(uniqueRecord);
                displayRecords.push(uniqueRecord);
            }
        }

        return {
            uniqueRecords,
            mirrorRecords,
            displayRecords
        };
    }

    function redCaptureRecordsRaw(pos) {
        const forbidColor = SETTINGS.excludeBlueKingFromRedCaptureSeries
            ? "blue"
            : null;

        return allCaptureMovesForPlayer(
            pos,
            "red",
            forbidColor
        );
    }

    function analyzeRedCaptureMovesTask(pos) {
        const rawRecords = redCaptureRecordsRaw(pos);
        const deduped = deduplicateMirrorRecords(rawRecords);

        const uniqueRecords = deduped.uniqueRecords;
        const mirrorRecords = deduped.mirrorRecords;
        const displayRecords = deduped.displayRecords;

        const starts = Array.from(
            new Set(uniqueRecords.map(record => record.start))
        ).sort((a, b) => a - b);

        const countByStart = {};

        for (const record of uniqueRecords) {
            const start = record.start;

            countByStart[start] = (countByStart[start] || 0) + 1;
        }

        return {
            answer: uniqueRecords.length,
            records: uniqueRecords,
            raw_records: rawRecords,
            mirror_records: mirrorRecords,
            display_records: displayRecords,
            capturing_starts: starts,
            count_by_start: countByStart
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

        return true;
    }

    function taskPositionOk(pos, target = null) {
        if (!positionIsReasonable(pos)) return false;

        const analysis = analyzeRedCaptureMovesTask(pos);

        if (analysis.answer < SETTINGS.minAnswer) return false;
        if (analysis.answer > SETTINGS.maxAnswer) return false;

        if (analysis.capturing_starts.length < SETTINGS.minRedCapturingPieces) {
            return false;
        }

        if (target !== null && analysis.answer !== target) {
            return false;
        }

        return true;
    }


    function getLegalMovesForPlayer(pos, color) {
        const forbidKingColor = opponent(color);

        const captureRecords = allCaptureMovesForPlayer(
            pos,
            color,
            forbidKingColor
        );

        const pawnCaptures = captureRecords.filter(record => record.piece_type === "pawn");
        const kingCaptures = captureRecords.filter(record => record.piece_type === "king");

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

        for (const move of getQuietMovesForPlayer(pos, color)) {
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
        const weights = [];

        for (const move of moves) {
            let weight = 1.0;

            if (move.kind === "capture") {
                weight += move.record.count * 2.4;
            }

            if (move.kind === "quiet") {
                const y1 = originalCenters[move.from].y;
                const y2 = originalCenters[move.to].y;

                if (color === "red" && y2 < y1) {
                    weight += 0.7;
                }

                if (color === "blue" && y2 > y1) {
                    weight += 0.7;
                }
            }

            weights.push(weight);
        }

        const total = weights.reduce((sum, weight) => sum + weight, 0);

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

            pos = applyMove(pos, move);

            if (findKing(pos, "red") === null || findKing(pos, "blue") === null) {
                break;
            }

            if (countPieces(pos, "red", "pawn") < 4) {
                break;
            }

            if (countPieces(pos, "blue", "pawn") < 4) {
                break;
            }

            color = opponent(color);
        }

        return pos;
    }


    function weightedTarget() {
        return weightedChoice(SETTINGS.targetWeights);
    }

    function addCaptureMotif(pos, forbiddenEmptyCells) {
        const allStarts = shuffled(Object.keys(JUMPS).map(Number));

        for (const start of allStarts) {
            if (pos[start] || forbiddenEmptyCells.has(start)) continue;

            const jumps = shuffled(JUMPS[start] || []);

            for (const jump of jumps) {
                const over = jump.over;
                const landing = jump.to;

                if (pos[over] || pos[landing]) continue;

                if (
                    forbiddenEmptyCells.has(over) ||
                    forbiddenEmptyCells.has(landing)
                ) {
                    continue;
                }

                const trial = clonePosition(pos);

                trial[start] = {
                    color: "red",
                    type: "pawn"
                };

                trial[over] = {
                    color: "blue",
                    type: "pawn"
                };

                const newForbidden = new Set(forbiddenEmptyCells);

                newForbidden.add(landing);

                return {
                    pos: trial,
                    forbidden: newForbidden
                };
            }
        }

        return {
            pos: null,
            forbidden: forbiddenEmptyCells
        };
    }

    function placeKingSafely(pos, color, target, forbiddenEmptyCells) {
        const candidates = shuffled(emptyCells(pos, forbiddenEmptyCells));

        for (const cell of candidates) {
            const trial = clonePosition(pos);

            trial[cell] = {
                color,
                type: "king"
            };

            if (
                SETTINGS.excludeImmediateBlueKingCapture &&
                redCanImmediatelyCaptureBlueKing(trial)
            ) {
                continue;
            }

            const analysis = analyzeRedCaptureMovesTask(trial);

            if (analysis.answer === target) {
                return trial;
            }
        }

        return null;
    }

    function addSafeFiller(pos, target, forbiddenEmptyCells) {
        let result = clonePosition(pos);

        const wantedTotal = randInt(SETTINGS.minTotalPieces, SETTINGS.maxTotalPieces);

        let attempts = 0;

        while (totalPieces(result) < wantedTotal && attempts < 1200) {
            attempts++;

            const empties = emptyCells(result, forbiddenEmptyCells);

            if (!empties.length) {
                break;
            }

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

            if (!taskPositionOk(trial, target)) {
                continue;
            }

            result = trial;
        }

        return result;
    }

    function controlledPosition(target) {
        for (let attempt = 0; attempt < 500; attempt++) {
            let pos = {};
            let forbiddenEmptyCells = new Set();

            let guard = 0;

            while (guard < 900) {
                guard++;

                const analysis = analyzeRedCaptureMovesTask(pos);

                if (
                    analysis.answer === target &&
                    analysis.capturing_starts.length >= SETTINGS.minRedCapturingPieces
                ) {
                    break;
                }

                if (analysis.answer > target) {
                    break;
                }

                const motif = addCaptureMotif(pos, forbiddenEmptyCells);

                if (motif.pos === null) {
                    break;
                }

                const trialAnalysis = analyzeRedCaptureMovesTask(motif.pos);

                if (trialAnalysis.answer <= target) {
                    pos = motif.pos;
                    forbiddenEmptyCells = motif.forbidden;
                }
            }

            const analysis = analyzeRedCaptureMovesTask(pos);

            if (analysis.answer !== target) continue;

            if (analysis.capturing_starts.length < SETTINGS.minRedCapturingPieces) {
                continue;
            }

            pos = placeKingSafely(
                pos,
                "red",
                target,
                forbiddenEmptyCells
            );

            if (pos === null) continue;

            pos = placeKingSafely(
                pos,
                "blue",
                target,
                forbiddenEmptyCells
            );

            if (pos === null) continue;

            if (!taskPositionOk(pos, target)) continue;

            pos = addSafeFiller(
                pos,
                target,
                forbiddenEmptyCells
            );

            if (taskPositionOk(pos, target)) {
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
            if (value >= 0 && !options.includes(value)) {
                options.push(value);
            }

            if (options.length === 4) {
                break;
            }
        }

        while (options.length < 4) {
            const value = randInt(0, Math.max(10, correct + 3));

            if (!options.includes(value)) {
                options.push(value);
            }
        }

        return shuffled(options).map(value => ({
            id: String(value),
            text: String(value)
        }));
    }

    function candidateScore(pos, target) {
        if (!positionIsReasonable(pos)) {
            return -999999;
        }

        const analysis = analyzeRedCaptureMovesTask(pos);

        const answer = analysis.answer;
        const startsCount = analysis.capturing_starts.length;

        if (answer < SETTINGS.minAnswer || answer > SETTINGS.maxAnswer) {
            return -999999;
        }

        if (startsCount < SETTINGS.minRedCapturingPieces) {
            return -999999;
        }

        let score = 0;

        score -= Math.abs(answer - target) * 18;
        score += Math.min(totalPieces(pos), 31);
        score += startsCount * 18;

        if (analysis.mirror_records.length) {
            score += Math.min(analysis.mirror_records.length, 2) * 4;
        }

        if (answer === target) {
            score += 140;
        }

        return score;
    }

    function generateInternalTask() {
        const target = weightedTarget();

        let bestFallback = null;
        let bestFallbackScore = -999999;

        for (let attempt = 0; attempt < SETTINGS.maxAttempts; attempt++) {
            const pos = randomPlayoutPosition();
            const score = candidateScore(pos, target);

            if (score <= -9000) {
                continue;
            }

            const analysis = analyzeRedCaptureMovesTask(pos);

            if (score > bestFallbackScore) {
                bestFallback = {
                    pos,
                    analysis
                };

                bestFallbackScore = score;
            }

            if (
                analysis.answer === target &&
                taskPositionOk(pos, target)
            ) {
                return buildInternalTaskResult(
                    pos,
                    analysis,
                    "разыгровка партии"
                );
            }
        }

        let pos = controlledPosition(target);

        if (pos !== null) {
            const analysis = analyzeRedCaptureMovesTask(pos);

            return buildInternalTaskResult(
                pos,
                analysis,
                "контролируемая генерация"
            );
        }

        if (bestFallback !== null) {
            return buildInternalTaskResult(
                bestFallback.pos,
                bestFallback.analysis,
                "лучший найденный вариант"
            );
        }

        pos = controlledPosition(4);

        if (pos === null) {
            pos = initialPosition();
        }

        const analysis = analyzeRedCaptureMovesTask(pos);

        return buildInternalTaskResult(
            pos,
            analysis,
            "страховочная позиция"
        );
    }

    function buildInternalTaskResult(pos, analysis, source) {
        const answer = analysis.answer;

        return {
            question: "Сейчас ход красного игрока, сколько ходов с рубкой есть на поле?",
            options: makeAnswerOptions(answer),
            correct: String(answer),
            position: pos,
            answer,

            capture_records: analysis.records,
            display_capture_records: analysis.display_records,
            mirror_records: analysis.mirror_records,

            capturing_starts: analysis.capturing_starts,
            count_by_start: analysis.count_by_start,
            source
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

    function sequenceToText(record) {
        const start = record.start;
        const ptype = record.piece_type;
        const sequence = record.sequence;

        const title = `${movingPieceName("red", ptype)} с позиции ${start}`;

        const parts = [];

        for (const step of sequence) {
            const victim = pieceName(step.victim.color, step.victim.type);

            parts.push(
                `с ${step.from} рубит ${victim} на позиции ${step.over} и переходит на ${step.to}`
            );
        }

        let text = `${title}: ${parts.join("; затем ")}`;

        if (record.is_mirror_duplicate) {
            text += " (зеркальный ход, засчитается только один вариант)";
        }

        return text;
    }

    function buildExplanation(task) {
        const lines = [];

        lines.push(`Количество ходов с рубкой у красных: ${task.answer}`);

        if (task.capturing_starts && task.capturing_starts.length) {
            const startsText = task.capturing_starts.map(start => {
                return `позиция ${start}: ${task.count_by_start[start]} ход(ов) с рубкой`;
            });

            lines.push(`Красные фигуры, у которых есть засчитываемые ходы с рубкой: ${startsText.join(", ")}`);
        }

        if (task.mirror_records && task.mirror_records.length) {
            lines.push(`Зеркальных повторов, не добавленных к ответу: ${task.mirror_records.length}`);
        }

        if (task.display_capture_records && task.display_capture_records.length) {
            const movesText = task.display_capture_records.map((record, index) => {
                return `${index + 1}. ${sequenceToText(record)}`;
            });

            lines.push(`Полные серии рубки: ${movesText.join(" | ")}`);
        } else {
            lines.push("Полные серии рубки: нет");
        }

        lines.push(`Ответ: ${task.answer}`);

        return lines.join("; ");
    }


    function generateDablotRedCaptureMovesTask() {
        const internalTask = generateInternalTask();

        const position = serializePosition(internalTask.position);
        const explanation = buildExplanation(internalTask);

        return {
            question: internalTask.question,
            answer_type: "single",
            options: internalTask.options,
            correct: internalTask.correct,

            position,

            drawSettings: SETTINGS.drawSettings,

            highlights: {},
            targets: null,
            highlighted_cell: null,

            green_numbers: null,

            explanation,

            skipPositionNumbers: [],

            _dablot_answer: internalTask.answer,
            _dablot_capture_records: internalTask.capture_records,
            _dablot_display_capture_records: internalTask.display_capture_records,
            _dablot_mirror_records: internalTask.mirror_records,
            _dablot_capturing_starts: internalTask.capturing_starts,
            _dablot_count_by_start: internalTask.count_by_start,
            _dablot_source: internalTask.source
        };
    }

    window.taskGenerators = window.taskGenerators || {};
	window.taskGenerators["2"] = generateDablotRedCaptureMovesTask;

	window.taskTitles = window.taskTitles || {};
	window.taskTitles["2"] = "Сколько ходов с рубкой у красных";
})();
