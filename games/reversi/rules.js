export const gameRulesMeta = {
    "gameId": "reversi",
    "gameName": "Реверси",
    "cellsCount": 64,
    "boardSize": {
        "rows": 8,
        "cols": 8
    }
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
