export function createTask({
    question,
    position = {},
    options = [],
    correctAnswer,
    answerType = 'single',
    explanation = '',
    highlights = {}
}) {
    return {
        question,
        position,
        options,
        correctAnswer,
        answer_type: answerType,
        explanation,
        highlights
    };
}
