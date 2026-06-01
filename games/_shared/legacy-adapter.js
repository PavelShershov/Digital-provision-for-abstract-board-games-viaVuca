export function registerLegacyGame({ originalCenters, taskGenerators, taskTitles }) {
    if (originalCenters) window.originalCenters = originalCenters;
    window.taskGenerators = window.taskGenerators || {};
    window.taskTitles = window.taskTitles || {};
    if (taskGenerators) Object.assign(window.taskGenerators, taskGenerators);
    if (taskTitles) Object.assign(window.taskTitles, taskTitles);
}
