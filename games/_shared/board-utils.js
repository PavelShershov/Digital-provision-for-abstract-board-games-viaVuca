export function cellToRowCol(cell, cols) {
    const index = Number(cell) - 1;
    return { row: Math.floor(index / cols), col: index % cols };
}

export function rowColToCell(row, col, cols) {
    return row * cols + col + 1;
}

export function isInsideBoard(row, col, rows, cols) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}
