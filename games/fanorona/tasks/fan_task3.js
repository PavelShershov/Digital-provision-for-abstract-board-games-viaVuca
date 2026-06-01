
(() => {
    const SCALE = 3289 / 822.25;
    const startX = 49.4629;
    const startY = 230.6296;
    const dx = 90.2038;
    const dy = 90.1482;
    const SHIFT_X = 0.2;
    const SHIFT_Y = 0;

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

            captures.push({ from: cell, to: nb, captured });
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

            captures.push({ from: cell, to: toCell, captured });
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
                    moves.push({ from: cell, to: nb, captured: [] });
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

    function isDirectlyThreatened(pos, cell, player) {
        const opp = player === 'yellow' ? 'red' : 'yellow';
        const captures = getAllCaptures(pos, opp);

        return captures.some(cap => cap.captured.includes(cell));
    }

    function isThreatenedInOneMove(pos, cell, player) {
        const opp = player === 'yellow' ? 'red' : 'yellow';
        const moves = getAllSimpleMoves(pos, opp);

        for (const move of moves) {
            const newPos = applyMove(pos, move);

            if (isDirectlyThreatened(newPos, cell, player)) return true;
        }

        return false;
    }

    function getThreatLevel(pos, cell, player) {
        if (isDirectlyThreatened(pos, cell, player)) return 0;
        if (isThreatenedInOneMove(pos, cell, player)) return 1;

        return 2;
    }

    function generateRandomPosition(redCount, yellowCount) {
        const allCells = Array.from({ length: 45 }, (_, i) => i + 1);

        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }

        const selected = allCells.slice(0, redCount + yellowCount);
        const colors = [];

        for (let i = 0; i < redCount; i++) {
            colors.push('red');
        }

        for (let i = 0; i < yellowCount; i++) {
            colors.push('yellow');
        }

        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [colors[i], colors[j]] = [colors[j], colors[i]];
        }

        const pos = {};

        for (let i = 0; i < selected.length; i++) {
            pos[selected[i]] = colors[i];
        }

        return pos;
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

    function generateVulnerabilityTask(maxAttempts = 500) {
        const ratiosWithWeights = [
            { red: 3, yellow: 3, weight: 1 },
            { red: 3, yellow: 4, weight: 3 },
            { red: 4, yellow: 3, weight: 3 },
            { red: 4, yellow: 4, weight: 3 },
            { red: 3, yellow: 5, weight: 2 },
            { red: 4, yellow: 5, weight: 1 }
        ];

        let ratios = [];

        for (const rw of ratiosWithWeights) {
            for (let i = 0; i < rw.weight; i++) {
                ratios.push({ red: rw.red, yellow: rw.yellow });
            }
        }

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const ratio = ratios[Math.floor(Math.random() * ratios.length)];
            const redCount = ratio.red;
            const yellowCount = ratio.yellow;
            const pos = generateRandomPosition(redCount, yellowCount);

            const threats = {};

            for (const cellStr in pos) {
                const cell = parseInt(cellStr, 10);

                threats[cell] = getThreatLevel(pos, cell, pos[cell]);
            }

            const cells = Object.keys(threats).map(Number);
            const level0 = cells.filter(c => threats[c] === 0);
            const level1 = cells.filter(c => threats[c] === 1);
            const level2 = cells.filter(c => threats[c] === 2);

            let top3 = null;
            let eligible = false;

            if (level0.length === 3) {
                top3 = level0;
                eligible = true;
            } else if (level0.length === 2 && level1.length >= 1) {
                top3 = [...level0, level1[Math.floor(Math.random() * level1.length)]];

                const remaining = cells.filter(c => !top3.includes(c));

                if (remaining.every(c => threats[c] >= 2)) eligible = true;
            } else if (level0.length === 1 && level1.length >= 2) {
                const shuffled = [...level1];

                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));

                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }

                top3 = [...level0, ...shuffled.slice(0, 2)];

                const remaining = cells.filter(c => !top3.includes(c));

                if (remaining.every(c => threats[c] >= 2)) eligible = true;
            } else if (level0.length === 0 && level1.length >= 3) {
                const shuffled = [...level1];

                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));

                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }

                top3 = shuffled.slice(0, 3);

                const remaining = cells.filter(c => !top3.includes(c));

                if (remaining.every(c => threats[c] >= 2)) eligible = true;
            }

            if (!eligible) continue;

            const sortedCells = [...cells].sort((a, b) => a - b);
            const numbers = {};

            for (let i = 0; i < sortedCells.length; i++) {
                numbers[sortedCells[i]] = i + 1;
            }

            const correctNums = top3.map(c => numbers[c]).sort((a, b) => a - b);
            const correctIds = correctNums.map(num => String(num));

            const allNums = sortedCells.map(c => numbers[c]);
            const options = allNums.map(num => ({
                id: String(num),
                text: String(num)
            }));

            return {
                question: "Выберите три фишки, которые находятся под ближайшей угрозой рубки",
                answer_type: "multiple",
                options: options,
                correct: correctIds,
                position: pos,

                numbers: numbers,

                green_numbers: numbers,

                skipPositionNumbers: Object.keys(numbers).map(Number),

                requiredSelections: 3,

                highlights: {},

                explanation: `Самые уязвимые фишки: №${correctNums.join(', №')}.`
            };
        }

        const fallbackPos = {
            1: 'yellow',
            2: 'red',
            3: 'yellow',
            4: 'red',
            5: 'yellow',
            6: 'red'
        };

        const fallbackNumbers = {
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6
        };

        return {
            question: "Выберите три фишки, которые находятся под ближайшей угрозой рубки",
            answer_type: "multiple",
            options: [
                { id: "1", text: "1" },
                { id: "2", text: "2" },
                { id: "3", text: "3" },
                { id: "4", text: "4" },
                { id: "5", text: "5" },
                { id: "6", text: "6" }
            ],
            correct: ["1", "2", "3"],
            position: fallbackPos,

            numbers: fallbackNumbers,

            green_numbers: fallbackNumbers,

            skipPositionNumbers: Object.keys(fallbackNumbers).map(Number),

            requiredSelections: 3,

            highlights: {},

            explanation: "Самые уязвимые фишки: №1, №2, №3."
        };
    }

    window.taskGenerators = window.taskGenerators || {};
    window.taskTitles = window.taskTitles || {};

    window.taskGenerators["6"] = generateVulnerabilityTask;
    window.taskTitles["6"] = "🎯 Уязвимые фишки (выберите три)";
    window.originalCenters = originalCenters;
    window.drawGreenNumbers = drawGreenNumbers;
})();
