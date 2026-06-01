export function clonePosition(position = {}) {
    return JSON.parse(JSON.stringify(position || {}));
}

export function countPieces(position = {}, pieceName = null) {
    return Object.values(position || {}).filter(piece => {
        return pieceName ? piece === pieceName : Boolean(piece);
    }).length;
}

export function positionToEntries(position = {}) {
    return Object.entries(position || {}).map(([cell, piece]) => ({ cell: Number(cell), piece }));
}
