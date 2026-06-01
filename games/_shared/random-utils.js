export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(items) {
    if (!Array.isArray(items) || items.length === 0) return undefined;
    return items[randomInt(0, items.length - 1)];
}

export function shuffle(items) {
    const copy = Array.from(items || []);
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
