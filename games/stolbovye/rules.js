export const gameRulesMeta = {
    "gameId": "stolbovye",
    "gameName": "Столбовые шашки",
    "cellsCount": 64,
    "boardSize": {}
};

export function isValidCell(cell) {
    const value = Number(cell);
    return Number.isInteger(value) && value >= 1 && value <= gameRulesMeta.cellsCount;
}

export function normalizeCell(cell) {
    const value = Number(cell);
    return isValidCell(value) ? value : null;
}

export function normalizePosition(position = {}) {
    const result = {};
    Object.entries(position || {}).forEach(([cell, piece]) => {
        const normalized = normalizeCell(cell);
        if (normalized !== null && piece) {
            result[normalized] = piece;
        }
    });
    return result;
}
