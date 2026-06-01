const urlParams = new URLSearchParams(window.location.search);

    const gameId = urlParams.get('game') || localStorage.getItem('lastTestGame') || 'alquerque';
    const resetParam = urlParams.get('reset') === '1';

    localStorage.setItem('lastTestGame', gameId);

    function goTo(url) {
        window.location.assign(url);
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
            document.head.appendChild(script);
        });
    }

    async function loadGameConfig(gid) {
        try {
            const res = await fetch(`games/${gid}/config.json`);
            if (!res.ok) throw new Error();
            return await res.json();
        } catch(e) {
            return null;
        }
    }

    function showModalToast(message, toastId = 'modalToast') {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    if (gameId !== 'mixed') {
        let gameConfig = null;
        let taskTitles = {};
        let taskGenerators = {};
        const STORAGE_KEY = `testSetup_${gameId}`;

        if (resetParam) {
            localStorage.removeItem(STORAGE_KEY);
            window._customCounts = null;
            window._savedCustomCounts = null;
            window._savedCustomShuffle = null;
        }

        function loadSavedSettings() {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch(e) {
                    return null;
                }
            }

            return null;
        }

        function saveSettings(settings) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }

        function applySavedSettings(settings) {
            if (!settings) return;

            if (settings.randomCount) {
                const rs = document.getElementById('randomCountSelect');
                if (rs && rs.querySelector(`option[value="${settings.randomCount}"]`)) rs.value = settings.randomCount;
            }

            if (settings.typeType) {
                const ts = document.getElementById('taskTypeSelect');
                if (ts && ts.querySelector(`option[value="${settings.typeType}"]`)) ts.value = settings.typeType;
            }

            if (settings.typeCount) {
                const cs = document.getElementById('typeCountSelect');
                if (cs && cs.querySelector(`option[value="${settings.typeCount}"]`)) cs.value = settings.typeCount;
            }

            if (settings.customCounts) window._savedCustomCounts = settings.customCounts;
            if (settings.customShuffle !== undefined) window._savedCustomShuffle = settings.customShuffle;
        }

        function saveCurrentSettings() {
            const randomSelect = document.getElementById('randomCountSelect');
            const typeSelect = document.getElementById('taskTypeSelect');
            const typeCountSelect = document.getElementById('typeCountSelect');

            const settings = {
                randomCount: randomSelect ? randomSelect.value : null,
                typeType: typeSelect ? typeSelect.value : null,
                typeCount: typeCountSelect ? typeCountSelect.value : null,
            };

            if (window._customCounts) settings.customCounts = window._customCounts;

            const shuffleCheckbox = document.getElementById('shuffleCheckbox');
            if (shuffleCheckbox) settings.customShuffle = shuffleCheckbox.checked;

            saveSettings(settings);
        }

        async function loadTasksAndTitles() {
            if (!gameConfig || !gameConfig.taskFiles) return;

            const loadPromises = gameConfig.taskFiles.map(file => loadScript(`games/${gameId}/${file}`));
            await Promise.allSettled(loadPromises);

            if (window.taskTitles && typeof window.taskTitles === 'object') {
                taskTitles = { ...window.taskTitles };
            } else {
                taskTitles = {};
                console.warn(`Для игры ${gameId} не загружены названия задач`);
            }

            if (window.taskGenerators) taskGenerators = window.taskGenerators;
        }

        let warnedAbout30 = false;

        function setupHoldCounter(btn, delta, numInput, changeCallback) {
            let timeoutId = null;
            let intervalId = null;
            let activePointerId = null;
            let startedByPointer = false;

            btn.type = 'button';

            const clearTimers = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            };

            const startHold = (e) => {
                if (e) {
                    if (e.cancelable) e.preventDefault();
                    e.stopPropagation();
                }

                clearTimers();
                startedByPointer = true;

                if (e && e.pointerId !== undefined) {
                    activePointerId = e.pointerId;

                    if (btn.setPointerCapture) {
                        try {
                            btn.setPointerCapture(e.pointerId);
                        } catch (captureError) {}
                    }
                }

                changeCallback(delta);

                timeoutId = setTimeout(() => {
                    intervalId = setInterval(() => changeCallback(delta), 180);
                }, 520);
            };

            const stopHold = (e) => {
                if (e && activePointerId !== null && e.pointerId !== undefined && e.pointerId !== activePointerId) {
                    return;
                }

                if (e && activePointerId !== null && btn.releasePointerCapture) {
                    try {
                        btn.releasePointerCapture(activePointerId);
                    } catch (captureError) {}
                }

                activePointerId = null;
                clearTimers();
            };

            if (window.PointerEvent) {
                btn.addEventListener('pointerdown', startHold);
                btn.addEventListener('pointerup', stopHold);
                btn.addEventListener('pointercancel', stopHold);
                btn.addEventListener('lostpointercapture', stopHold);
                btn.addEventListener('pointerleave', (e) => {
                    if (e.pointerType === 'mouse') stopHold(e);
                });
            } else {
                btn.addEventListener('mousedown', startHold);
                btn.addEventListener('mouseup', stopHold);
                btn.addEventListener('mouseleave', stopHold);
                btn.addEventListener('touchstart', startHold, { passive: false });
                btn.addEventListener('touchend', stopHold);
                btn.addEventListener('touchcancel', stopHold);

                btn.addEventListener('click', (e) => {
                    if (startedByPointer) {
                        startedByPointer = false;
                        return;
                    }

                    e.preventDefault();
                    changeCallback(delta);
                });
            }

            btn.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;

                e.preventDefault();
                changeCallback(delta);
            });

            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        function renderCustomList() {
            const container = document.getElementById('customTaskList');
            const keys = Object.keys(taskTitles).sort((a,b) => Number(a) - Number(b));

            container.innerHTML = '';

            const counts = {};

            if (window._savedCustomCounts) {
                for (const key of keys) counts[key] = window._savedCustomCounts[key] || 0;
            } else {
                for (const key of keys) counts[key] = 0;
            }

            const oldBtn = document.getElementById('generateCustomBtn');
            const newBtn = oldBtn.cloneNode(true);

            oldBtn.parentNode.replaceChild(newBtn, oldBtn);

            const shuffleCheckbox = document.getElementById('shuffleCheckbox');
            shuffleCheckbox.checked = window._savedCustomShuffle === undefined ? false : window._savedCustomShuffle;

            function updateButtonText() {
                let total = 0;

                for (const k of keys) total += counts[k];

                if (total === 0) {
                    newBtn.innerText = 'Сгенерировать тест';
                } else {
                    const wordForm = (total % 10 === 1 && total % 100 !== 11)
                        ? 'задача'
                        : ((total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20)) ? 'задачи' : 'задач');

                    newBtn.innerText = `Сгенерировать тест\nиз ${total} ${wordForm}`;
                }
            }

            function getTotal() {
                let total = 0;

                for (const k of keys) total += counts[k];

                return total;
            }

            function setCount(key, newVal, source = 'user') {
                let oldVal = counts[key];

                if (oldVal === newVal) return false;

                let total = getTotal();
                let delta = newVal - oldVal;

                if (total + delta > 50) {
                    let allowed = oldVal + (50 - total);

                    if (allowed < 0) allowed = 0;

                    if (allowed === oldVal) {
                        if (source === 'user') showModalToast('Суммарное количество задач не может превышать 50');
                        return false;
                    }

                    newVal = allowed;

                    if (source === 'user') {
                        showModalToast('Суммарное количество задач не может превышать 50. Значение скорректировано.');
                    }
                }

                if (newVal < 0) newVal = 0;
                if (newVal > 50) newVal = 50;
                if (newVal === oldVal) return false;

                counts[key] = newVal;

                const inputEl = document.getElementById(`input_${key}`);
                if (inputEl && inputEl.value != newVal) inputEl.value = newVal;

                updateButtonText();

                if (getTotal() > 30 && !warnedAbout30 && source === 'user') {
                    showModalToast('⚠️ При генерации больше 30 задач, возможны задержки');
                    warnedAbout30 = true;
                }

                window._customCounts = { ...counts };
                window._savedCustomCounts = window._customCounts;
                window._savedCustomShuffle = shuffleCheckbox.checked;

                saveCurrentSettings();

                return true;
            }

            for (const key of keys) {
                const row = document.createElement('div');
                row.className = 'task-row';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'task-name';
                nameSpan.textContent = taskTitles[key];

                const counterDiv = document.createElement('div');
                counterDiv.className = 'task-counter';

                const minusBtn = document.createElement('button');
                minusBtn.textContent = '−';
                minusBtn.type = 'button';
                minusBtn.className = 'counter-btn';

                const numInput = document.createElement('input');
                numInput.type = 'text';
                numInput.inputMode = 'numeric';
                numInput.pattern = '[0-9]*';
                numInput.id = `input_${key}`;
                numInput.value = counts[key] === 0 ? '0' : counts[key].toString();
                numInput.className = 'counter-input';

                const plusBtn = document.createElement('button');
                plusBtn.textContent = '+';
                plusBtn.type = 'button';
                plusBtn.className = 'counter-btn';

                numInput.addEventListener('input', (e) => {
                    let raw = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                    let val = raw === '' ? 0 : parseInt(raw, 10);

                    if (isNaN(val)) val = 0;

                    if (val > 50) {
                        showModalToast('Набрано максимально доступное число задач — 50');
                        val = 50;
                    }

                    numInput.value = val === 0 ? '0' : val.toString();

                    setCount(key, val, 'user');
                });

                numInput.addEventListener('paste', (e) => {
                    e.preventDefault();

                    let pasted = (e.clipboardData || window.clipboardData)
                        .getData('text')
                        .replace(/[^0-9]/g, '')
                        .replace(/^0+/, '');

                    let val = pasted === '' ? 0 : parseInt(pasted, 10);

                    if (isNaN(val)) val = 0;

                    if (val > 50) {
                        showModalToast('Набрано максимально доступное число задач — 50');
                        val = 50;
                    }

                    numInput.value = val === 0 ? '0' : val.toString();

                    setCount(key, val, 'user');
                });

                function changeBy(delta) {
                    let newVal = counts[key] + delta;

                    if (newVal < 0) newVal = 0;

                    if (newVal > 50) {
                        if (delta > 0) showModalToast('Набрано максимально доступное число задач — 50');
                        newVal = 50;
                    }

                    setCount(key, newVal, 'user');
                }

                setupHoldCounter(minusBtn, -1, numInput, changeBy);
                setupHoldCounter(plusBtn, +1, numInput, changeBy);

                counterDiv.appendChild(minusBtn);
                counterDiv.appendChild(numInput);
                counterDiv.appendChild(plusBtn);

                row.appendChild(nameSpan);
                row.appendChild(counterDiv);

                container.appendChild(row);
            }

            const clearAllBtn = document.getElementById('clearAllBtn');

            if (clearAllBtn) {
                clearAllBtn.onclick = () => {
                    for (const key of keys) setCount(key, 0, 'user');

                    warnedAbout30 = false;

                    showModalToast('Все счётчики сброшены');
                };
            }

            shuffleCheckbox.addEventListener('change', () => {
                window._savedCustomShuffle = shuffleCheckbox.checked;
                saveCurrentSettings();
            });

            warnedAbout30 = false;

            updateButtonText();

            newBtn.addEventListener('click', () => {
                const selected = {};
                let total = 0;

                for (const key of keys) {
                    if (counts[key] > 0) {
                        selected[key] = counts[key];
                        total += counts[key];
                    }
                }

                if (total === 0) {
                    showModalToast('Выберите хотя бы одну задачу');
                    return;
                }

                const customParam = Object.entries(selected)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(',');

                let url = `test.html?game=${encodeURIComponent(gameId)}&mode=custom&custom=${encodeURIComponent(customParam)}`;

                if (shuffleCheckbox.checked) url += '&shuffle=1';

                goTo(url);
            });
        }

        function renderNormalSetup() {
            const container = document.getElementById('setupCard');
            const gameName = gameConfig?.gameName || gameId;

            container.innerHTML = `
                <div class="back-button" id="backButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Назад</span>
                </div>

                <h1>${gameName} · тестирование</h1>

                <div style="text-align: center;">
                    <div class="sub">Выберите формат генерации</div>
                </div>

                <div class="option-card">
                    <div class="option-left">
                        <div class="option-title">🎲 Случайный набор</div>
                        <div class="option-desc">Задачи всех типов в случайном порядке</div>
                    </div>

                    <div class="option-controls">
                        <span class="control-label">Количество задач</span>
                        <select id="randomCountSelect" class="styled-select count-select">
                            <option value="5">5</option>
                            <option value="10" selected>10</option>
                            <option value="15">15</option>
                            <option value="20">20</option>
                            <option value="25">25</option>
                            <option value="30">30</option>
                        </select>
                        <button id="startRandomBtn" class="play-btn">🎲 Сгенерировать</button>
                    </div>
                </div>

                <div class="option-card">
                    <div class="option-left">
                        <div class="option-title">📋 По типам</div>
                        <div class="option-desc">Выберите тип и количество задач</div>
                    </div>

                    <div class="option-controls">
                        <span class="control-label">Выберите тип и количество задач</span>
                        <div class="type-controls-row">
                            <select id="taskTypeSelect" class="styled-select"></select>
                            <select id="typeCountSelect" class="styled-select count-select">
                                <option value="5">5</option>
                                <option value="10" selected>10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                                <option value="25">25</option>
                                <option value="30">30</option>
                            </select>
                        </div>
                        <button id="startByTypeBtn" class="play-btn">📋 Сгенерировать</button>
                    </div>
                </div>

                <div class="option-card">
                    <div class="option-left">
                        <div class="option-title">⚙️ Индивидуальный вариант</div>
                        <div class="option-desc">Задайте количество задач каждого типа</div>
                    </div>

                    <div class="option-controls">
                        <button id="customBtn" class="play-btn" style="background: #4b6a8b;">⚙️ Настроить</button>
                    </div>
                </div>
            `;

            const backBtn = document.getElementById('backButton');

            if (backBtn) {
                backBtn.addEventListener('click', () => goTo('index.html?mode=test'));
            }

            const selectType = document.getElementById('taskTypeSelect');
            const keys = Object.keys(taskTitles).sort((a,b) => Number(a) - Number(b));

            if (keys.length === 0) {
                const opt = document.createElement('option');
                opt.textContent = '❌ Задачи не загружены';
                opt.disabled = true;
                selectType.appendChild(opt);
            } else {
                for (const key of keys) {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = taskTitles[key];
                    selectType.appendChild(opt);
                }
            }

            const saved = loadSavedSettings();

            applySavedSettings(saved);

            const randomSelect = document.getElementById('randomCountSelect');
            const typeCountSelect = document.getElementById('typeCountSelect');

            randomSelect.addEventListener('change', saveCurrentSettings);
            selectType.addEventListener('change', saveCurrentSettings);
            typeCountSelect.addEventListener('change', saveCurrentSettings);

            document.getElementById('startRandomBtn').addEventListener('click', () => {
                const url = `test.html?game=${encodeURIComponent(gameId)}&mode=random&count=${encodeURIComponent(randomSelect.value)}`;
                goTo(url);
            });

            document.getElementById('startByTypeBtn').addEventListener('click', () => {
                const type = selectType.value;

                if (!type || (selectType.selectedIndex === 0 && selectType.options[0].disabled)) {
                    alert('Нет доступных типов задач');
                    return;
                }

                const url = `test.html?game=${encodeURIComponent(gameId)}&mode=type&type=${encodeURIComponent(type)}&count=${encodeURIComponent(typeCountSelect.value)}`;
                goTo(url);
            });

            const modal = document.getElementById('customModal');
            const customBtn = document.getElementById('customBtn');
            const closeModal = modal.querySelector('.close-modal');
            const newCustomBtn = customBtn.cloneNode(true);

            customBtn.parentNode.replaceChild(newCustomBtn, customBtn);

            newCustomBtn.addEventListener('click', () => {
                renderCustomList();
                modal.style.display = 'flex';
            });

            if (closeModal) {
                const newCloseModal = closeModal.cloneNode(true);
                closeModal.parentNode.replaceChild(newCloseModal, closeModal);

                newCloseModal.addEventListener('click', () => {
                    modal.style.display = 'none';
                    warnedAbout30 = false;
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        (async () => {
            gameConfig = await loadGameConfig(gameId);

            if (!gameConfig) {
                document.getElementById('setupCard').innerHTML = `
                    <div class="back-button" id="backButton">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        <span>Назад</span>
                    </div>
                    <h1>Ошибка</h1>
                    <p style="text-align:center;color:#5a6e7c;font-weight:700;">
                        Не удалось загрузить конфигурацию игры: ${gameId}
                    </p>
                `;

                const backBtn = document.getElementById('backButton');

                if (backBtn) {
                    backBtn.addEventListener('click', () => goTo('index.html?mode=test'));
                }

                return;
            }

            await loadTasksAndTitles();

            renderNormalSetup();
        })();
    }

    if (gameId === 'mixed') {
        const availableGames = [
            { name: "Алькерк", id: "alquerque" },
            { name: "Суракарта", id: "surakarta" },
            { name: "Фанорона", id: "fanorona" },
            { name: "Хнефатафл", id: "hnefatafl" },
            { name: "Сиджа (7x7)", id: "sidja" },
            { name: "Реверси", id: "reversi" },
            { name: "Даблот", id: "dablot" },
            { name: "Столбовые шашки", id: "stolbovye" }
        ];

        let mixedGamesData = {};
        let mixedCounts = {};
        let mixedShuffle = false;
        const MIXED_STORAGE_KEY = 'mixedTestSetup';

        if (resetParam) {
            localStorage.removeItem(MIXED_STORAGE_KEY);
        } else {
            const saved = localStorage.getItem(MIXED_STORAGE_KEY);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);

                    if (parsed.games) mixedCounts = parsed.games;
                    if (parsed.shuffle !== undefined) mixedShuffle = parsed.shuffle;
                } catch(e) {}
            }
        }

        async function loadGameTitlesIsolated(gameId) {
            try {
                const configRes = await fetch(`games/${gameId}/config.json`);

                if (!configRes.ok) throw new Error(`config.json для ${gameId} не найден`);

                const config = await configRes.json();
                const taskFiles = config.taskFiles || [];

                if (taskFiles.length === 0) {
                    console.warn(`Для игры ${gameId} нет taskFiles`);
                    return null;
                }

                const titles = {};

                for (const file of taskFiles) {
                    const url = `games/${gameId}/${file}`;
                    const jsText = await fetch(url).then(r => r.text());
                    const sandbox = {};
                    const func = new Function('window', jsText + '; return window.taskTitles;');
                    const taskTitles = func(sandbox);

                    if (taskTitles && typeof taskTitles === 'object') {
                        Object.assign(titles, taskTitles);
                    }
                }

                if (Object.keys(titles).length === 0) {
                    console.warn(`Для игры ${gameId} не найдено ни одного taskTitles в загруженных файлах`);
                    return null;
                }

                console.log(`Загружены названия для ${gameId}:`, titles);

                return titles;
            } catch(e) {
                console.error(`Ошибка загрузки для ${gameId}:`, e);
                return null;
            }
        }

        async function loadAllMixedGamesData() {
            for (const game of availableGames) {
                const titles = await loadGameTitlesIsolated(game.id);
                mixedGamesData[game.id] = titles;
            }
        }

        function saveMixedSettings() {
            const settings = {
                games: mixedCounts,
                shuffle: mixedShuffle
            };

            localStorage.setItem(MIXED_STORAGE_KEY, JSON.stringify(settings));
        }

        function showMixedToast(message) {
            const toast = document.getElementById('mixedToast');

            if (toast) {
                toast.textContent = message;
                toast.classList.add('show');

                setTimeout(() => toast.classList.remove('show'), 2500);
            }
        }

        function updateSelectedGamesInfo() {
            const infoDiv = document.getElementById('selectedGamesInfo');

            if (!infoDiv) return;

            const selected = [];

            for (const game of availableGames) {
                if (mixedCounts[game.id] && Object.keys(mixedCounts[game.id]).length > 0) {
                    selected.push(game.name);
                }
            }

            infoDiv.innerText = selected.length === 0
                ? 'Выбраны игры: (ни одна не выбрана)'
                : `Выбраны игры: ${selected.join(', ')}`;
        }

        function updateMixedButtonText() {
            let total = 0;

            for (const game of availableGames) {
                if (mixedCounts[game.id]) {
                    for (const cnt of Object.values(mixedCounts[game.id])) total += cnt;
                }
            }

            const btn = document.getElementById('mixedGenerateBtn');

            if (btn) {
                if (total === 0) {
                    btn.innerText = 'Сгенерировать тест';
                } else {
                    const wordForm = (total % 10 === 1 && total % 100 !== 11)
                        ? 'задача'
                        : ((total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20)) ? 'задачи' : 'задач');

                    btn.innerText = `Сгенерировать тест\nиз ${total} ${wordForm}`;
                }
            }
        }

        function setMixedCount(gameId, taskType, newVal) {
            if (!mixedCounts[gameId]) mixedCounts[gameId] = {};

            let oldVal = mixedCounts[gameId][taskType] || 0;

            if (oldVal === newVal) return;

            let total = 0;

            for (const g of availableGames) {
                if (mixedCounts[g.id]) {
                    for (const cnt of Object.values(mixedCounts[g.id])) total += cnt;
                }
            }

            let delta = newVal - oldVal;

            if (total + delta > 50) {
                let allowed = oldVal + (50 - total);

                if (allowed < 0) allowed = 0;

                if (allowed === oldVal) {
                    showMixedToast('Суммарное количество задач не может превышать 50');
                    return;
                }

                newVal = allowed;

                showMixedToast('Суммарное количество задач не может превышать 50. Значение скорректировано.');
            }

            if (newVal < 0) newVal = 0;
            if (newVal > 50) newVal = 50;
            if (newVal === oldVal) return;

            if (newVal === 0) {
                delete mixedCounts[gameId][taskType];

                if (Object.keys(mixedCounts[gameId]).length === 0) {
                    delete mixedCounts[gameId];
                }
            } else {
                mixedCounts[gameId][taskType] = newVal;
            }

            const inputEl = document.querySelector(`#tasks_${gameId} .task-row-mixed[data-type="${taskType}"] .counter-input-mixed`);

            if (inputEl) inputEl.value = newVal;

            updateSelectedGamesInfo();
            updateMixedButtonText();
            saveMixedSettings();

            const chk = document.getElementById(`chk_${gameId}`);
            const hasTasks = mixedCounts[gameId] && Object.keys(mixedCounts[gameId]).length > 0;

            if (chk) chk.checked = hasTasks;

            const tasksDiv = document.getElementById(`tasks_${gameId}`);

            if (tasksDiv) tasksDiv.style.display = hasTasks ? 'block' : 'none';
        }

        function renderMixedSetup() {
            const container = document.getElementById('setupCard');

            let html = `
                <div class="back-button" id="backButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Назад</span>
                </div>

                <h1>Сборный тест</h1>

                <div style="text-align: center;">
                    <div class="sub">Выберите игры и типы задач</div>
                </div>
            `;

            for (const game of availableGames) {
                const titlesObj = mixedGamesData[game.id];

                if (!titlesObj) {
                    html += `
                        <div class="game-block" style="opacity:0.78;background:linear-gradient(155deg,rgba(255,235,235,0.96),rgba(255,255,255,0.92));border-color:rgba(239,83,80,0.32);">
                            <div class="game-header">
                                <span class="game-title">${game.name}</span>
                                <span class="game-error">⚠️ Типы задач не загружены</span>
                            </div>
                        </div>
                    `;
                    continue;
                }

                const hasTasks = mixedCounts[game.id] !== undefined;

                html += `
                    <div class="game-block" data-game="${game.id}">
                        <div class="game-header">
                            <input type="checkbox" class="game-checkbox" id="chk_${game.id}" ${hasTasks ? 'checked' : ''}>
                            <label for="chk_${game.id}" class="game-title">${game.name}</label>
                        </div>
                        <div id="tasks_${game.id}" class="task-list-mixed" style="display: ${hasTasks ? 'block' : 'none'};"></div>
                    </div>
                `;
            }

            html += `
                <div class="mixed-bottom-links">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mixedShuffleCheckbox" ${mixedShuffle ? 'checked' : ''}> В случайном порядке
                    </label>
                    <span id="mixedClearAllBtn" class="clickable-link">✗ Убрать все</span>
                </div>

                <div style="text-align: center;">
                    <button id="mixedGenerateBtn" class="custom-generate-btn">Сгенерировать тест</button>
                </div>

                <div id="selectedGamesInfo" class="selected-games-info"></div>
                <div id="mixedToast" class="mixed-toast"></div>
            `;

            container.innerHTML = html;

            document.getElementById('backButton').addEventListener('click', () => {
                goTo('index.html?mode=test');
            });

            for (const game of availableGames) {
                const titlesObj = mixedGamesData[game.id];

                if (!titlesObj) continue;

                const tasksDiv = document.getElementById(`tasks_${game.id}`);

                if (!tasksDiv) continue;

                const keys = Object.keys(titlesObj).sort((a,b) => Number(a) - Number(b));
                const savedCounts = mixedCounts[game.id] || {};
                let tasksHtml = '';

                for (const key of keys) {
                    const countVal = savedCounts[key] || 0;

                    tasksHtml += `
                        <div class="task-row-mixed" data-type="${key}">
                            <span class="task-name-mixed">${titlesObj[key]}</span>
                            <div class="task-counter-mixed">
                                <button type="button" class="counter-btn-mixed" data-delta="-1">−</button>
                                <input type="text" inputmode="numeric" pattern="[0-9]*" class="counter-input-mixed" value="${countVal}">
                                <button type="button" class="counter-btn-mixed" data-delta="+1">+</button>
                            </div>
                        </div>
                    `;
                }

                tasksDiv.innerHTML = tasksHtml;
            }

            for (const game of availableGames) {
                if (!mixedGamesData[game.id]) continue;

                const tasksDiv = document.getElementById(`tasks_${game.id}`);

                if (!tasksDiv) continue;

                const rows = tasksDiv.querySelectorAll('.task-row-mixed');

                for (const row of rows) {
                    const taskType = row.dataset.type;
                    const minusBtn = row.querySelector('.counter-btn-mixed[data-delta="-1"]');
                    const plusBtn = row.querySelector('.counter-btn-mixed[data-delta="+1"]');
                    const input = row.querySelector('.counter-input-mixed');

                    if (minusBtn) {
                        minusBtn.addEventListener('click', (e) => {
                            e.preventDefault();

                            let current = mixedCounts[game.id]?.[taskType] || 0;

                            setMixedCount(game.id, taskType, current - 1);
                        });
                    }

                    if (plusBtn) {
                        plusBtn.addEventListener('click', (e) => {
                            e.preventDefault();

                            let current = mixedCounts[game.id]?.[taskType] || 0;

                            setMixedCount(game.id, taskType, current + 1);
                        });
                    }

                    if (input) {
                        input.addEventListener('input', (e) => {
                            let raw = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                            let val = raw === '' ? 0 : parseInt(raw, 10);

                            if (isNaN(val)) val = 0;
                            if (val > 50) val = 50;

                            setMixedCount(game.id, taskType, val);
                        });

                        input.addEventListener('paste', (e) => {
                            e.preventDefault();

                            let pasted = (e.clipboardData || window.clipboardData)
                                .getData('text')
                                .replace(/[^0-9]/g, '')
                                .replace(/^0+/, '');

                            let val = pasted === '' ? 0 : parseInt(pasted, 10);

                            if (isNaN(val)) val = 0;
                            if (val > 50) val = 50;

                            setMixedCount(game.id, taskType, val);
                        });
                    }
                }

                const chk = document.getElementById(`chk_${game.id}`);

                if (chk) {
                    chk.addEventListener('change', (e) => {
                        const isChecked = e.target.checked;
                        const tDiv = document.getElementById(`tasks_${game.id}`);

                        if (tDiv) tDiv.style.display = isChecked ? 'block' : 'none';

                        if (!isChecked) {
                            if (mixedCounts[game.id]) delete mixedCounts[game.id];

                            saveMixedSettings();
                            updateSelectedGamesInfo();
                            updateMixedButtonText();

                            if (tDiv) {
                                const inputs = tDiv.querySelectorAll('.counter-input-mixed');
                                inputs.forEach(inp => inp.value = '0');
                            }
                        } else {
                            if (!mixedCounts[game.id]) {
                                mixedCounts[game.id] = {};
                                saveMixedSettings();
                                updateSelectedGamesInfo();
                            }
                        }
                    });
                }
            }

            document.getElementById('mixedClearAllBtn').addEventListener('click', () => {
                mixedCounts = {};

                saveMixedSettings();

                for (const game of availableGames) {
                    const chk = document.getElementById(`chk_${game.id}`);

                    if (chk) chk.checked = false;

                    const tDiv = document.getElementById(`tasks_${game.id}`);

                    if (tDiv) {
                        tDiv.style.display = 'none';

                        const inputs = tDiv.querySelectorAll('.counter-input-mixed');
                        inputs.forEach(inp => inp.value = '0');
                    }
                }

                updateSelectedGamesInfo();
                updateMixedButtonText();

                showMixedToast('Все счётчики сброшены');
            });

            document.getElementById('mixedShuffleCheckbox').addEventListener('change', (e) => {
                mixedShuffle = e.target.checked;
                saveMixedSettings();
            });

            document.getElementById('mixedGenerateBtn').addEventListener('click', () => {
                const selectedGamesData = [];
                let totalTasks = 0;

                for (const game of availableGames) {
                    if (!mixedCounts[game.id]) continue;

                    const gameTasks = {};

                    for (const [type, count] of Object.entries(mixedCounts[game.id])) {
                        if (count > 0) {
                            gameTasks[type] = count;
                            totalTasks += count;
                        }
                    }

                    if (Object.keys(gameTasks).length > 0) {
                        selectedGamesData.push({
                            id: game.id,
                            name: game.name,
                            tasks: gameTasks
                        });
                    }
                }

                if (selectedGamesData.length === 0) {
                    showMixedToast('Выберите хотя бы одну задачу');
                    return;
                }

                if (totalTasks > 100) {
                    showMixedToast('Суммарное количество задач не должно превышать 100');
                    return;
                }

                const params = new URLSearchParams();

                params.set('mode', 'mixed');
                params.set('shuffle', mixedShuffle ? '1' : '0');
                params.set('games', JSON.stringify(selectedGamesData));

                goTo(`test.html?${params.toString()}`);
            });

            updateSelectedGamesInfo();
            updateMixedButtonText();
        }

        (async () => {
            await loadAllMixedGamesData();
            renderMixedSetup();
        })();
    }
