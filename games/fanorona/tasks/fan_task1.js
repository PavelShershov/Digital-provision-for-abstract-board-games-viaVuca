
(() => {
    const SCALE = 3289 / 822.25;
    const startX = 49.4629;
    const startY = 230.6296;
    const dx = 90.2038;
    const dy = 90.1482;
    const SHIFT_X = 0.2;
    const SHIFT_Y = 0;

    const STATIC_QUESTION = "Сколько всего вариантов хода с рубкой есть у красного игрока?";

    const originalCenters = {};
    let idx = 1;
    for (let row = 1; row <= 5; row++) {
        const y = (startY + (row - 1) * dy + SHIFT_Y) * SCALE;
        for (let col = 1; col <= 9; col++) {
            const x = (startX + (col - 1) * dx + SHIFT_X) * SCALE;
            originalCenters[idx] = { x, y };
            idx++;
        }
    }

    const ADJ = {
        1: [2, 10, 11], 2: [1, 3, 11], 3: [2, 4, 11, 12, 13], 4: [3, 5, 13],
        5: [4, 6, 13, 14, 15], 6: [5, 7, 15], 7: [6, 8, 15, 16, 17],
        8: [7, 9, 17], 9: [8, 17, 18],
        10: [1, 11, 19], 11: [1, 2, 3, 10, 12, 19, 20, 21], 12: [3, 11, 13, 21],
        13: [3, 4, 5, 12, 14, 21, 22, 23], 14: [5, 13, 15, 23], 15: [5, 6, 7, 14, 16, 23, 24, 25],
        16: [7, 15, 17, 25], 17: [7, 8, 9, 16, 18, 25, 26, 27], 18: [9, 17, 27],
        19: [10, 11, 20, 28, 29], 20: [11, 19, 21, 29], 21: [11, 12, 13, 20, 22, 29, 30, 31],
        22: [13, 21, 23, 31], 23: [13, 14, 15, 22, 24, 31, 32, 33], 24: [15, 23, 25, 33],
        25: [15, 16, 17, 24, 26, 33, 34, 35], 26: [17, 25, 27, 35], 27: [17, 18, 26, 35, 36],
        28: [19, 29, 37], 29: [19, 20, 21, 28, 30, 37, 38, 39], 30: [21, 29, 31, 39],
        31: [21, 22, 23, 30, 32, 39, 40, 41], 32: [23, 31, 33, 41], 33: [23, 24, 25, 32, 34, 41, 42, 43],
        34: [25, 33, 35, 43], 35: [25, 26, 27, 34, 36, 43, 44, 45], 36: [27, 35, 45],
        37: [28, 29, 38], 38: [29, 37, 39], 39: [29, 30, 31, 38, 40, 41], 40: [31, 39, 41],
        41: [31, 32, 33, 39, 40, 42], 42: [33, 41, 43], 43: [33, 34, 35, 42, 44], 44: [35, 43, 45],
        45: [35, 36, 44]
    };

    for (let k in ADJ) {
        const kNum = parseInt(k, 10);
        for (let nb of ADJ[k]) {
            if (!ADJ[nb] || !ADJ[nb].includes(kNum)) {
                if (!ADJ[nb]) ADJ[nb] = [];
                ADJ[nb].push(kNum);
            }
        }
    }

    function numToRC(num) {
        const row = Math.floor((num - 1) / 9) + 1;
        const col = (num - 1) % 9 + 1;
        return { row, col };
    }

    function rcToNum(row, col) {
        return (row - 1) * 9 + col;
    }

    function initialPosition() {
        const pos = {};

        for (let row = 1; row <= 2; row++) {
            for (let col = 1; col <= 9; col++) {
                const n = rcToNum(row, col);
                pos[n] = 'yellow';
            }
        }

        pos[19] = 'yellow';
        pos[21] = 'yellow';
        pos[24] = 'yellow';
        pos[26] = 'yellow';

        pos[20] = 'red';
        pos[22] = 'red';
        pos[25] = 'red';
        pos[27] = 'red';

        for (let n = 28; n <= 45; n++) {
            pos[n] = 'red';
        }

        delete pos[23];

        return pos;
    }

    function getNextInLine(prev, cur) {
        const { row: r1, col: c1 } = numToRC(prev);
        const { row: r2, col: c2 } = numToRC(cur);

        const dr = r2 - r1;
        const dc = c2 - c1;

        const r3 = r2 + dr;
        const c3 = c2 + dc;

        if (r3 < 1 || r3 > 5 || c3 < 1 || c3 > 9) return null;

        const nxt = rcToNum(r3, c3);

        return ADJ[cur] && ADJ[cur].includes(nxt) ? nxt : null;
    }

    function getAttackCaptures(pos, cell, player) {
        if (pos[cell] !== player) return [];

        const opp = player === 'yellow' ? 'red' : 'yellow';
        const captures = [];

        for (const nb of ADJ[cell] || []) {
            if (pos[nb] !== undefined) continue;

            let firstOpp = null;
            let cur = nb;
            let prev = cell;

            while (true) {
                const nxt = getNextInLine(prev, cur);

                if (nxt === null) break;

                const col = pos[nxt];

                if (col === undefined) break;

                if (col === opp) {
                    firstOpp = nxt;
                    break;
                } else {
                    break;
                }

                prev = cur;
                cur = nxt;
            }

            if (firstOpp === null) continue;

            const captured = [];

            cur = firstOpp;
            prev = nb;

            while (true) {
                captured.push(cur);

                const nxt = getNextInLine(prev, cur);

                if (nxt === null) break;

                if (pos[nxt] === opp) {
                    prev = cur;
                    cur = nxt;
                    continue;
                } else {
                    break;
                }
            }

            captures.push({
                from: cell,
                to: nb,
                captured,
                capture_type: 'attack'
            });
        }

        return captures;
    }

    function getRetreatCaptures(pos, cell, player) {
        if (pos[cell] !== player) return [];

        const opp = player === 'yellow' ? 'red' : 'yellow';
        const captures = [];

        for (const nb of ADJ[cell] || []) {
            if (pos[nb] !== opp) continue;

            const dr = numToRC(cell).row - numToRC(nb).row;
            const dc = numToRC(cell).col - numToRC(nb).col;

            const toRow = numToRC(cell).row + dr;
            const toCol = numToRC(cell).col + dc;

            if (toRow < 1 || toRow > 5 || toCol < 1 || toCol > 9) continue;

            const toCell = rcToNum(toRow, toCol);

            if (pos[toCell] !== undefined) continue;

            const captured = [];
            let cur = nb;
            let prev = cell;

            while (true) {
                captured.push(cur);

                const nxt = getNextInLine(prev, cur);

                if (nxt === null) break;

                if (pos[nxt] === opp) {
                    prev = cur;
                    cur = nxt;
                    continue;
                } else {
                    break;
                }
            }

            captures.push({
                from: cell,
                to: toCell,
                captured,
                capture_type: 'retreat'
            });
        }

        return captures;
    }

    function getAllCaptures(pos, player) {
        let moves = [];

        for (const cellStr in pos) {
            const cell = parseInt(cellStr, 10);

            if (pos[cell] !== player) continue;

            moves.push(...getAttackCaptures(pos, cell, player));
            moves.push(...getRetreatCaptures(pos, cell, player));
        }

        return moves;
    }

    function getAllSimpleMoves(pos, player) {
        const moves = [];

        for (const cellStr in pos) {
            const cell = parseInt(cellStr, 10);

            if (pos[cell] !== player) continue;

            for (const nb of ADJ[cell] || []) {
                if (pos[nb] === undefined) {
                    moves.push({
                        from: cell,
                        to: nb,
                        captured: []
                    });
                }
            }
        }

        return moves;
    }

    function getAllPossibleMoves(pos, player) {
        const caps = getAllCaptures(pos, player);

        if (caps.length) return caps;

        return getAllSimpleMoves(pos, player);
    }

    function applyMove(pos, move) {
        const newPos = { ...pos };
        const color = newPos[move.from];

        delete newPos[move.from];

        newPos[move.to] = color;

        for (const c of move.captured) {
            delete newPos[c];
        }

        return newPos;
    }

    function formatCaptureList(captured) {
        if (!captured || captured.length === 0) {
            return '';
        }

        if (captured.length === 1) {
            return String(captured[0]);
        }

        if (captured.length === 2) {
            return `${captured[0]} и ${captured[1]}`;
        }

        return `${captured.slice(0, -1).join(', ')} и ${captured[captured.length - 1]}`;
    }

    function formatRedCaptureExplanations(redCaps) {
        const lines = [];

        redCaps.forEach(move => {
            if (!move.captured || move.captured.length === 0) return;

            const captureTypeText = move.capture_type === 'retreat'
                ? 'ОТСТУПЛЕНИЕМ'
                : 'АТАКОЙ';

            const firstCapturedCell = move.captured[0];

            if (move.captured.length === 1) {
                lines.push(
                    `Красная фишка с клетки ${move.from} атакует жёлтую на клетке ${firstCapturedCell} ${captureTypeText}`
                );
            } else {
                lines.push(
                    `Красная фишка с клетки ${move.from} атакует жёлтую на клетке ${firstCapturedCell} ${captureTypeText} (рубит фишки ${formatCaptureList(move.captured)})`
                );
            }
        });

        return lines;
    }

    function makeExplanation(redMoves) {
        return redMoves.length > 0
            ? redMoves.join('; ')
            : 'У красного игрока нет ходов с рубкой.';
    }

    const yellow_FIRST_MOVES = [
        { from: 13, to: 23, captured: [33, 43] },
        { from: 14, to: 23, captured: [32, 41] },
        { from: 15, to: 23, captured: [31, 39] },
        { from: 24, to: 23, captured: [22] }
    ];

    const RED_FIRST_MOVES = [
        { from: 22, to: 23, captured: [24] },
        { from: 31, to: 23, captured: [15, 7] },
        { from: 32, to: 23, captured: [14, 5] },
        { from: 33, to: 23, captured: [13, 3] }
    ];

    function getFirstMove(pos, playerColor, movesList) {
        const available = movesList.filter(m => pos[m.from] === playerColor && !pos[m.to] && m.captured.every(c => pos[c]));

        if (!available.length) return null;

        return available[Math.floor(Math.random() * available.length)];
    }

    function simulateMidgame(maxAttempts = 300, maxMoves = 70) {
        const targetTotal = [18, 22];
        const targetRatios = new Set(['10,12', '9,11', '9,13', '8,10']);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos = initialPosition();
            let movesCnt = 0;
            let total = Object.keys(pos).length;

            while (total > targetTotal[1] && movesCnt < maxMoves) {
                const player = movesCnt % 2 === 0 ? 'yellow' : 'red';
                const moves = getAllPossibleMoves(pos, player);

                if (!moves.length) break;

                pos = applyMove(pos, moves[Math.floor(Math.random() * moves.length)]);

                total = Object.keys(pos).length;
                movesCnt++;

                if (total >= targetTotal[0] && total <= targetTotal[1]) {
                    const redCount = Object.values(pos).filter(v => v === 'red').length;
                    const yellowCount = total - redCount;

                    if (targetRatios.has(`${redCount},${yellowCount}`)) {
                        return pos;
                    }
                }
            }
        }

        return null;
    }

    function generateMidgameTask() {
        const pos = simulateMidgame();

        if (!pos) return null;

        const redCaps = getAllCaptures(pos, 'red');
        const correct = redCaps.length;

        const redMoves = formatRedCaptureExplanations(redCaps);

        const answersSet = new Set([correct, correct + 1, correct - 1, correct + 2, correct - 2].filter(v => v >= 0));
        const answers = Array.from(answersSet).slice(0, 4);
        const options = answers.map(v => ({
            id: v.toString(),
            text: v.toString()
        }));

        while (options.length < 4) {
            options.push({
                id: "0",
                text: "0"
            });
        }

        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [options[i], options[j]] = [options[j], options[i]];
        }

        return {
            question: STATIC_QUESTION,
            options: options,
            correct: correct.toString(),
            move_description: [],
            red_captures: redMoves,
            explanation: makeExplanation(redMoves),
            position: pos
        };
    }

    function generateFanoronaTask() {
        const r = Math.random();

        let type;

        if (r < 0.4) {
            type = 'after_yellow_first';
        } else if (r < 0.7) {
            type = 'after_red_then_yellow';
        } else {
            type = 'midgame';
        }

        if (type === 'midgame') {
            const task = generateMidgameTask();

            if (task) return task;

            return generateFanoronaTask();
        }

        const maxAttempts = 50;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let pos = initialPosition();

            if (type === 'after_yellow_first') {
                const firstMove = getFirstMove(pos, 'yellow', yellow_FIRST_MOVES);

                if (!firstMove) continue;

                pos = applyMove(pos, firstMove);

                const firstDesc = `Зелёный: фишка с ${firstMove.from} атакует на ${firstMove.to}, срублены: [${firstMove.captured.join(', ')}]`;

                const redCaps = getAllCaptures(pos, 'red');
                const correct = redCaps.length;

                const redMoves = formatRedCaptureExplanations(redCaps);

                const answersSet = new Set([correct, correct + 1, correct - 1, correct + 2, correct - 2].filter(v => v >= 0));
                const answers = Array.from(answersSet).slice(0, 4);
                const options = answers.map(v => ({
                    id: v.toString(),
                    text: v.toString()
                }));

                while (options.length < 4) {
                    options.push({
                        id: "0",
                        text: "0"
                    });
                }

                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));

                    [options[i], options[j]] = [options[j], options[i]];
                }

                return {
                    question: STATIC_QUESTION,
                    options: options,
                    correct: correct.toString(),
                    move_description: [firstDesc],
                    red_captures: redMoves,
                    explanation: makeExplanation(redMoves),
                    position: pos
                };
            } else {
                const redFirst = getFirstMove(pos, 'red', RED_FIRST_MOVES);

                if (!redFirst) continue;

                pos = applyMove(pos, redFirst);

                const redDesc = `Красный: фишка с ${redFirst.from} атакует на ${redFirst.to}, срублены: [${redFirst.captured.join(', ')}]`;

                const yellowCaps = getAllCaptures(pos, 'yellow');

                if (!yellowCaps.length) continue;

                const yellowMove = yellowCaps[Math.floor(Math.random() * yellowCaps.length)];

                pos = applyMove(pos, yellowMove);

                const yellowDesc = `Зелёный: фишка с ${yellowMove.from} на ${yellowMove.to}, срублены: [${yellowMove.captured.join(', ')}]`;

                const finalRedCaps = getAllCaptures(pos, 'red');
                const correct = finalRedCaps.length;

                const redMoves = formatRedCaptureExplanations(finalRedCaps);

                const answersSet = new Set([correct, correct + 1, correct - 1, correct + 2, correct - 2].filter(v => v >= 0));
                const answers = Array.from(answersSet).slice(0, 4);
                const options = answers.map(v => ({
                    id: v.toString(),
                    text: v.toString()
                }));

                while (options.length < 4) {
                    options.push({
                        id: "0",
                        text: "0"
                    });
                }

                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));

                    [options[i], options[j]] = [options[j], options[i]];
                }

                return {
                    question: STATIC_QUESTION,
                    options: options,
                    correct: correct.toString(),
                    move_description: [redDesc, yellowDesc],
                    red_captures: redMoves,
                    explanation: makeExplanation(redMoves),
                    position: pos
                };
            }
        }

        return {
            question: STATIC_QUESTION,
            options: [
                { id: "0", text: "0" },
                { id: "1", text: "1" },
                { id: "2", text: "2" },
                { id: "3", text: "3" }
            ],
            correct: "0",
            position: initialPosition(),
            move_description: [],
            red_captures: [],
            explanation: 'У красного игрока нет ходов с рубкой.'
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskTitles = window.taskTitles || {};
    window.taskGenerators["1"] = generateFanoronaTask;
    window.taskTitles["1"] = "🎲 Фанорона: Ходы с рубкой!!";
    window.originalCenters = originalCenters;
})();
