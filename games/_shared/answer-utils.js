export function normalizeAnswer(value) {
    if (Array.isArray(value)) return value.map(String).sort();
    if (value === null || value === undefined) return '';
    return String(value);
}

export function isSameAnswer(userAnswer, correctAnswer) {
    const user = normalizeAnswer(userAnswer);
    const correct = normalizeAnswer(correctAnswer);
    return JSON.stringify(user) === JSON.stringify(correct);
}
