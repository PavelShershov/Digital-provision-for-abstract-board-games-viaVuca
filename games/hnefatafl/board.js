export const cellsCount = 121;
export const boardSize = {"rows": 11, "cols": 11};

export function cellToRowCol(cell, cols = boardSize.cols) {
    if (!cols) return null;
    const index = Number(cell) - 1;
    return { row: Math.floor(index / cols), col: index % cols };
}

export function rowColToCell(row, col, cols = boardSize.cols) {
    if (!cols) return null;
    return row * cols + col + 1;
}
