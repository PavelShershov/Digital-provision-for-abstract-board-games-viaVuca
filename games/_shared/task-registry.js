export function createTaskRegistry() {
    return {
        generators: {},
        titles: {},
        register(id, generator, title = '') {
            this.generators[String(id)] = generator;
            if (title) this.titles[String(id)] = title;
        }
    };
}

export function registerLegacyTasks(registry) {
    window.taskGenerators = window.taskGenerators || {};
    window.taskTitles = window.taskTitles || {};
    Object.assign(window.taskGenerators, registry.generators || {});
    Object.assign(window.taskTitles, registry.titles || {});
}
