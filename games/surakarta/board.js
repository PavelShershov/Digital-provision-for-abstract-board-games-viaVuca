export const cellsCount = 36;
export const boardSize = {};

export function cellToRowCol(cell, cols = boardSize.cols) {
    if (!cols) return null;
    const index = Number(cell) - 1;
    return { row: Math.floor(index / cols), col: index % cols };
}

export function rowColToCell(row, col, cols = boardSize.cols) {
    if (!cols) return null;
    return row * cols + col + 1;
}
