    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    const resetParam = urlParams.get('reset') === '1';
    if (!gameId) window.location.href = 'organizer.html';
    localStorage.setItem('lastTestGame', gameId);
    localStorage.setItem('lastOrganizerGame', gameId);

    const ALL_GAME_IDS = ['alquerque','surakarta','fanorona','hnefatafl','sidja','reversi','dablot','stolbovye'];

    let currentGeneratedTestId = '';
    let currentGeneratedConfig = null;

    const toast = document.getElementById('toast');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteConfirmCheckbox = document.getElementById('deleteConfirmCheckbox');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
    const deleteCancelBtn = document.getElementById('deleteCancelBtn');
    const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');

    function clearAllOrganizerStorage() {
        for (const gid of ALL_GAME_IDS) localStorage.removeItem(`testSetup_${gid}`);
        localStorage.removeItem('mixedTestSetup');
        localStorage.removeItem('lastOrganizerGame');
        window._customCounts = null;
        window._savedCustomCounts = null;
        window._savedCustomShuffle = null;
        window._savedShowAnswerImmediately = null;
    }

    document.getElementById('toMenuBtn').addEventListener('click', () => {
        clearAllOrganizerStorage();
        window.location.href = 'organizer.html';
    });

    document.getElementById('toLinksListBtn').addEventListener('click', () => {
        window.location.href = 'organizer_links.html';
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 1800);
    }

    async function copyText(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const temp = document.createElement('textarea');
                temp.value = text;
                temp.style.position = 'fixed';
                temp.style.left = '-9999px';
                document.body.appendChild(temp);
                temp.focus();
                temp.select();
                document.execCommand('copy');
                temp.remove();
            }

            showToast('Ссылка скопирована');
        } catch (error) {
            console.error('Не удалось скопировать ссылку:', error);
            showToast('Не удалось скопировать ссылку');
        }
    }

    document.getElementById('copyLinkBtn').addEventListener('click', async () => {
        const input = document.getElementById('generatedLink');
        const btn = document.getElementById('copyLinkBtn');

        if (!input || !input.value) return;

        await copyText(input.value);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 900);
    });

    function showSetupMessage(message) {
        const modalToast = document.getElementById('modalToast');
        const mixedToast = document.getElementById('mixedToast');

        if (modalToast) {
            showModalToast(message, 'modalToast');
            return;
        }

        if (mixedToast) {
            mixedToast.textContent = message;
            mixedToast.classList.add('show');
            setTimeout(() => mixedToast.classList.remove('show'), 2500);
            return;
        }

        showToast(message);
    }

    async function deleteGeneratedTestFromCloud(testId) {
        if (!testId) {
            return null;
        }

        if (typeof SCRIPT_URL === 'undefined') {
            throw new Error('SCRIPT_URL не подключён');
        }

        const organizerLogin =
            sessionStorage.getItem('organizerLogin') ||
            localStorage.getItem('organizerLogin') ||
            '';

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteTournamentFully',
                testId,
                organizerLogin
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось удалить турнир');
        }

        currentGeneratedTestId = '';
        currentGeneratedConfig = null;

        return data;
    }

    async function deleteCurrentGeneratedTestBeforeReset(button, loadingText) {
        if (!currentGeneratedTestId) {
            return true;
        }

        const editBtn = document.getElementById('editLinkBtn');
        const deleteBtn = document.getElementById('deleteLinkBtn');
        const linksBtn = document.getElementById('toLinksListBtn');
        const menuBtn = document.getElementById('toMenuBtn');

        const originalHtml = button ? button.innerHTML : '';

        if (button) {
            button.innerHTML = loadingText || 'Удаление...';
        }

        [editBtn, deleteBtn, linksBtn, menuBtn].forEach(btn => {
            if (btn) btn.disabled = true;
        });

        try {
            await deleteGeneratedTestFromCloud(currentGeneratedTestId);
            return true;
        } catch (error) {
            console.error('Не удалось удалить созданный тест:', error);
            showSetupMessage(error.message || 'Не удалось удалить созданный тест');
            return false;
        } finally {
            if (button) {
                button.innerHTML = originalHtml;
            }

            [editBtn, deleteBtn, linksBtn, menuBtn].forEach(btn => {
                if (btn) btn.disabled = false;
            });
        }
    }

    function openDeleteConfirmModal() {
        if (!currentGeneratedTestId) {
            showSetupMessage('Ссылка не найдена');
            return;
        }

        deleteConfirmCheckbox.checked = false;
        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = 'Удалить турнир';
        deleteConfirmModal.classList.add('open');
        deleteConfirmModal.setAttribute('aria-hidden', 'false');
    }

    function closeDeleteConfirmModal() {
        deleteConfirmCheckbox.checked = false;
        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = 'Удалить турнир';
        deleteConfirmModal.classList.remove('open');
        deleteConfirmModal.setAttribute('aria-hidden', 'true');
    }

    async function confirmDeleteCurrentTournament() {
        if (!currentGeneratedTestId || !deleteConfirmCheckbox.checked) {
            return;
        }

        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = 'Удаление...';

        try {
            await deleteGeneratedTestFromCloud(currentGeneratedTestId);
            closeDeleteConfirmModal();
            closeResultPanel();
            resetCurrentSetupFormAfterDelete();
            disableControls(document.getElementById('setupCard'), false);
            showSetupMessage('Тест и ссылка удалены.');
        } catch (error) {
            console.error('Не удалось удалить турнир:', error);
            deleteConfirmBtn.disabled = false;
            deleteConfirmBtn.textContent = 'Удалить турнир';
            showSetupMessage(error.message || 'Не удалось удалить турнир');
        }
    }

    deleteConfirmCheckbox.addEventListener('change', () => {
        deleteConfirmBtn.disabled = !deleteConfirmCheckbox.checked;
    });

    deleteConfirmBtn.addEventListener('click', confirmDeleteCurrentTournament);
    deleteCancelBtn.addEventListener('click', closeDeleteConfirmModal);
    deleteModalCloseBtn.addEventListener('click', closeDeleteConfirmModal);

    deleteConfirmModal.addEventListener('click', (event) => {
        if (event.target === deleteConfirmModal) {
            closeDeleteConfirmModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && deleteConfirmModal.classList.contains('open')) {
            closeDeleteConfirmModal();
        }
    });

    function closeResultPanel() {
        document.getElementById('resultContainer').style.display = 'none';
        document.getElementById('setupCard').classList.remove('result-open');
    }

    function resetCurrentSetupFormAfterDelete() {
        if (gameId !== 'mixed') {
            const clearBtn = document.getElementById('clearAllBtn');
            if (clearBtn) clearBtn.click();

            const shuffleChk = document.getElementById('shuffleCheckbox');
            if (shuffleChk) {
                shuffleChk.checked = false;
                window._savedCustomShuffle = false;
            }
        } else {
            const clearMixBtn = document.getElementById('mixedClearAllBtn');
            if (clearMixBtn) clearMixBtn.click();

            const mixedShuffleChk = document.getElementById('mixedShuffleCheckbox');
            if (mixedShuffleChk) {
                mixedShuffleChk.checked = false;
            }

            const mixedShowAnswerToggle = document.getElementById('mixedShowAnswerImmediatelyToggle');
            if (mixedShowAnswerToggle) {
                mixedShowAnswerToggle.checked = false;
            }

            localStorage.setItem('mixedTestSetup', JSON.stringify({
                games: {},
                shuffle: false,
                showAnswerImmediately: false,
                scoreEnabled: false,
                maxScore: 10
            }));
        }
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
        } catch(e) { return null; }
    }

    function showModalToast(message, toastId = 'modalToast') {
        const toastEl = document.getElementById(toastId);
        if (toastEl) {
            toastEl.textContent = message;
            toastEl.classList.add('show');
            setTimeout(() => toastEl.classList.remove('show'), 2500);
        }
    }

    function showGenerationStatus(statusId) {
        const status = document.getElementById(statusId);
        if (status) status.classList.add('show');
    }

    function hideGenerationStatus(statusId) {
        const status = document.getElementById(statusId);
        if (status) status.classList.remove('show');
    }

    function normalizeScoreValue(value, fallback = 10) {
        const raw = String(value ?? '').replace(/[^0-9]/g, '');
        let numericValue = raw === '' ? fallback : parseInt(raw, 10);

        if (isNaN(numericValue)) numericValue = fallback;
        if (numericValue < 0) numericValue = 0;
        if (numericValue > 100) numericValue = 100;

        return numericValue;
    }

    function setupScoreCounter(options) {
        const toggle = document.getElementById(options.toggleId);
        const toggleUi = document.getElementById(options.toggleUiId);
        const counter = document.getElementById(options.counterId);
        const input = document.getElementById(options.inputId);
        const minusBtn = document.getElementById(options.minusId);
        const plusBtn = document.getElementById(options.plusId);

        if (!toggle || !input || !minusBtn || !plusBtn) return;

        function setEnabledState() {
            const enabled = toggle.checked;

            input.disabled = !enabled;
            minusBtn.disabled = !enabled;
            plusBtn.disabled = !enabled;

            if (counter) counter.classList.toggle('disabled', !enabled);
        }

        function setValue(value) {
            const normalizedValue = normalizeScoreValue(value, 10);
            input.value = normalizedValue.toString();

            if (typeof options.onValueChange === 'function') {
                options.onValueChange(normalizedValue, toggle.checked);
            }
        }

        if (toggleUi) {
            toggleUi.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                toggle.checked = !toggle.checked;
                setEnabledState();

                if (typeof options.onToggleChange === 'function') {
                    options.onToggleChange(toggle.checked, normalizeScoreValue(input.value, 10));
                }
            });
        }

        minusBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            setValue(normalizeScoreValue(input.value, 10) - 1);
        });

        plusBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            setValue(normalizeScoreValue(input.value, 10) + 1);
        });

        input.addEventListener('input', () => {
            setValue(input.value);
        });

        input.addEventListener('paste', (event) => {
            event.preventDefault();

            const pasted = (event.clipboardData || window.clipboardData)
                .getData('text')
                .replace(/[^0-9]/g, '');

            setValue(pasted);
        });

        input.value = normalizeScoreValue(input.value, 10).toString();
        setEnabledState();
    }


    function setupExtraSettingsPopover(buttonId, popoverId) {
        const button = document.getElementById(buttonId);
        const popover = document.getElementById(popoverId);

        if (!button || !popover) return;

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            popover.classList.toggle('open');
        });

        popover.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.extra-settings-popover.open').forEach(popover => {
            popover.classList.remove('open');
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.extra-settings-popover.open').forEach(popover => {
                popover.classList.remove('open');
            });
        }
    });

    function getOrderText(shuffleFlag) {
        return shuffleFlag ? 'В случайном порядке' : 'По порядку';
    }

    function buildSingleSettingsDetails(gameName, taskTitlesArg, selectedTasks, totalTasks, shuffleFlag, showAnswerImmediatelyFlag, scoreEnabledFlag, maxScoreValue) {
        const tasks = Object.entries(selectedTasks || {}).map(([typeKey, count]) => {
            return {
                type: String(typeKey),
                title: (taskTitlesArg && taskTitlesArg[typeKey]) ? String(taskTitlesArg[typeKey]) : `Тип ${typeKey}`,
                count: Number(count) || 0
            };
        });

        return {
            version: 1,
            mode: 'single',
            gameName: gameName || 'Игра',
            heading: 'Выбранные типы задач',
            tasks,
            totalTasks: Number(totalTasks) || 0,
            order: getOrderText(shuffleFlag),
            showAnswerImmediately: !!showAnswerImmediatelyFlag,
            answerDisplay: showAnswerImmediatelyFlag ? 'Сразу после ответа' : 'После завершения теста',
            scoreEnabled: !!scoreEnabledFlag,
            maxScore: normalizeScoreValue(maxScoreValue, 10),
            scoreDisplay: scoreEnabledFlag ? `${normalizeScoreValue(maxScoreValue, 10)} баллов максимум` : 'Не используется'
        };
    }

    function buildMixedSettingsDetails(selectedGamesData, mixedGamesDataMap, totalTasks, shuffleFlag, showAnswerImmediatelyFlag, scoreEnabledFlag, maxScoreValue) {
        const games = (selectedGamesData || []).map(game => {
            const titlesForGame = (mixedGamesDataMap && mixedGamesDataMap[game.id]) ? mixedGamesDataMap[game.id] : {};
            const tasks = Object.entries(game.tasks || {}).map(([typeKey, count]) => {
                return {
                    type: String(typeKey),
                    title: titlesForGame[typeKey] ? String(titlesForGame[typeKey]) : String(typeKey),
                    count: Number(count) || 0
                };
            });

            return {
                id: game.id,
                name: game.name,
                tasks
            };
        });

        return {
            version: 1,
            mode: 'mixed',
            gameName: 'Сборный тест',
            heading: 'Выбранные игры и типы',
            games,
            totalTasks: Number(totalTasks) || 0,
            order: getOrderText(shuffleFlag),
            showAnswerImmediately: !!showAnswerImmediatelyFlag,
            answerDisplay: showAnswerImmediatelyFlag ? 'Сразу после ответа' : 'После завершения теста',
            scoreEnabled: !!scoreEnabledFlag,
            maxScore: normalizeScoreValue(maxScoreValue, 10),
            scoreDisplay: scoreEnabledFlag ? `${normalizeScoreValue(maxScoreValue, 10)} баллов максимум` : 'Не используется'
        };
    }

    function disableControls(container, disable) {
        const elements = container.querySelectorAll(
            'button:not(.back-button), input, select, .counter-btn, .counter-btn-mixed, .game-checkbox, .clickable-link'
        );

        elements.forEach(el => {
            const keepActiveAfterGenerate =
                el.classList && el.classList.contains('generate-new-active');

            if (disable && keepActiveAfterGenerate) {
                el.disabled = false;
                el.style.pointerEvents = 'auto';
                el.classList.remove('generation-locked-control');
                delete el.dataset.generationLocked;
                return;
            }

            if (disable) {
                el.disabled = true;
                el.style.pointerEvents = 'none';
                el.dataset.generationLocked = '1';
                el.classList.add('generation-locked-control');
            } else {
                el.disabled = false;
                el.style.pointerEvents = '';
                el.classList.remove('generation-locked-control');
                delete el.dataset.generationLocked;
            }
        });

        if (disable) container.classList.add('disabled-overlay');
        else container.classList.remove('disabled-overlay');
    }

    function setGenerationControlsLocked(locked, activeGenerateBtnId) {
        const container = document.getElementById('setupCard');

        if (!container) return;

        const elements = container.querySelectorAll(
            'button, input, select, .counter-btn, .counter-btn-mixed, .game-checkbox, .clickable-link'
        );

        elements.forEach(el => {
            const isBackButton =
                el.id === 'backButton' ||
                (el.classList && el.classList.contains('back-button'));

            const isActiveGenerateButton = el.id === activeGenerateBtnId;

            if (isBackButton || isActiveGenerateButton) {
                return;
            }

            if (locked) {
                el.dataset.generationLocked = '1';
                el.classList.add('generation-locked-control');
                el.style.pointerEvents = 'none';

                if (
                    el.tagName === 'BUTTON' ||
                    el.tagName === 'INPUT' ||
                    el.tagName === 'SELECT'
                ) {
                    el.disabled = true;
                }
            } else if (el.dataset.generationLocked === '1') {
                delete el.dataset.generationLocked;
                el.classList.remove('generation-locked-control');
                el.style.pointerEvents = '';

                if (!container.classList.contains('disabled-overlay')) {
                    if (
                        el.tagName === 'BUTTON' ||
                        el.tagName === 'INPUT' ||
                        el.tagName === 'SELECT'
                    ) {
                        el.disabled = false;
                    }
                }
            }
        });
    }

    function resetPageToInitialStateForNewGeneration() {
        if (gameId !== 'mixed') {
            localStorage.removeItem(`testSetup_${gameId}`);
            window._customCounts = null;
            window._savedCustomCounts = null;
            window._savedCustomShuffle = null;
        } else {
            localStorage.removeItem('mixedTestSetup');
        }

        const params = new URLSearchParams();
        params.set('game', gameId);
        params.set('reset', '1');

        window.location.href = `${window.location.pathname}?${params.toString()}`;
    }

    function activateGenerateNewButtonAfterResult() {
        const generateBtn = document.getElementById(
            gameId === 'mixed' ? 'mixedGenerateBtn' : 'generateCustomBtn'
        );

        if (!generateBtn) return;

        delete generateBtn.dataset.generationLocked;
        generateBtn.classList.remove('generation-locked-control');
        generateBtn.disabled = false;
        generateBtn.style.pointerEvents = 'auto';
        generateBtn.innerHTML = 'Сгенерировать новый';
        generateBtn.dataset.mode = 'generateNew';
        generateBtn.classList.add('generate-new-active');
    }

    function prepareGenerateButtonForNormalMode(generateBtn, normalText) {
        if (!generateBtn) return;

        generateBtn.dataset.mode = 'generate';
        generateBtn.classList.remove('generate-new-active');
        generateBtn.style.pointerEvents = '';
        generateBtn.innerHTML = normalText || 'Сгенерировать тест';
    }

    function showResult(testId, config, gameName, taskTitlesArg, totalTasks, shuffleFlag) {
        const resultContainer = document.getElementById('resultContainer');
        const reportBlock = document.getElementById('reportBlock');
        const linkInput = document.getElementById('generatedLink');
        const baseUrl = window.location.origin + window.location.pathname.replace(/organizer_setup\.html.*$/, '') + 'test_auth.html';
        const fullLink = `${baseUrl}?testId=${testId}`;
        currentGeneratedTestId = testId;
        currentGeneratedConfig = config || null;
        linkInput.value = fullLink;

        let reportHtml = `<strong>Игра:</strong> ${gameName}<br>`;
        if (config.tasks && typeof config.tasks === 'object') {
            reportHtml += `<strong>Выбранные типы задач:</strong><ul>`;
            for (const [typeKey, count] of Object.entries(config.tasks)) {
                const title = taskTitlesArg[typeKey] || `Тип ${typeKey}`;
                reportHtml += `<li>${title}: ${count}</li>`;
            }
            reportHtml += `</ul>`;
        } else if (config.games) {
            reportHtml += `<strong>Выбранные игры и типы:</strong><ul>`;
            for (const [gid, tasks] of Object.entries(config.games)) {
                const gameDisplayName = (taskTitlesArg.__gameNames && taskTitlesArg.__gameNames[gid]) || gid;
                reportHtml += `<li><strong>${gameDisplayName}</strong>: `;
                const titlesForGame = taskTitlesArg[gid] || {};
                const taskEntries = Object.entries(tasks).map(([t, cnt]) => `${titlesForGame[t] || t}: ${cnt}`).join(', ');
                reportHtml += `${taskEntries}</li>`;
            }
            reportHtml += `</ul>`;
        }
        reportHtml += `<strong>Всего задач:</strong> ${totalTasks}<br>`;
        reportHtml += `<strong>Порядок:</strong> ${shuffleFlag ? 'В случайном порядке' : 'По порядку'}<br>`;
        reportHtml += `<strong>Показ ответа:</strong> ${config.showAnswerImmediately ? 'Сразу после ответа' : 'После завершения теста'}`;
        reportHtml += `<br><strong>Баллы:</strong> ${config.scoreEnabled ? `${normalizeScoreValue(config.maxScore, 10)} максимум` : 'Не используются'}`;
        reportBlock.innerHTML = reportHtml;

        resultContainer.style.display = 'block';

        const setupCard = document.getElementById('setupCard');
        setupCard.classList.add('result-open');

        setGenerationControlsLocked(false, gameId === 'mixed' ? 'mixedGenerateBtn' : 'generateCustomBtn');
        disableControls(setupCard, true);
        activateGenerateNewButtonAfterResult();

        setTimeout(() => resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }

    document.getElementById('editLinkBtn').addEventListener('click', async () => {
        const editBtn = document.getElementById('editLinkBtn');
        const deleted = await deleteCurrentGeneratedTestBeforeReset(editBtn, 'Удаление...');

        if (!deleted) return;

        closeResultPanel();
        disableControls(document.getElementById('setupCard'), false);
        showSetupMessage('Созданная ссылка удалена. Можно изменить настройки и создать тест заново.');
    });

    document.getElementById('deleteLinkBtn').addEventListener('click', () => {
        openDeleteConfirmModal();
    });

    async function generateUniqueTestId() {
        const maxAttempts = 5;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const testId = 'test_' + Math.random().toString(36).substr(2, 8);
            try {
                const response = await fetch(`${SCRIPT_URL}?testId=${testId}`);
                const data = await response.json();
                if (!data.success && data.error === 'Тест не найден') {
                    console.log(`✅ Уникальный testId сгенерирован: ${testId}`);
                    return testId;
                }
                console.warn(`⚠️ testId ${testId} уже существует, генерируем новый...`);
            } catch (error) {
                console.warn('Ошибка при проверке testId, используем сгенерированный:', error);
                return testId;
            }
        }
        const fallbackId = 'test_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
        console.warn(`⚠️ Использован fallback ID: ${fallbackId}`);
        return fallbackId;
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
            if (saved) try { return JSON.parse(saved); } catch(e) { return null; }
            return null;
        }
        function saveSettings(settings) { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
        function applySavedSettings(settings) {
            if (!settings) return;
            if (settings.customCounts) window._savedCustomCounts = settings.customCounts;
            if (settings.customShuffle !== undefined) window._savedCustomShuffle = settings.customShuffle;
            if (settings.showAnswerImmediately !== undefined) window._savedShowAnswerImmediately = settings.showAnswerImmediately;
            if (settings.scoreEnabled !== undefined) window._savedScoreEnabled = settings.scoreEnabled;
            if (settings.maxScore !== undefined) window._savedMaxScore = settings.maxScore;
        }
        function saveCurrentSettings() {
            const settings = {};
            if (window._customCounts) settings.customCounts = window._customCounts;
            const shuffleCheckbox = document.getElementById('shuffleCheckbox');
            if (shuffleCheckbox) settings.customShuffle = shuffleCheckbox.checked;
            const showAnswerImmediatelyToggle = document.getElementById('singleShowAnswerImmediatelyToggle');
            if (showAnswerImmediatelyToggle) settings.showAnswerImmediately = showAnswerImmediatelyToggle.checked;
            const scoreEnabledToggle = document.getElementById('singleScoreEnabledToggle');
            if (scoreEnabledToggle) settings.scoreEnabled = scoreEnabledToggle.checked;
            const maxScoreInput = document.getElementById('singleMaxScoreInput');
            if (maxScoreInput) settings.maxScore = normalizeScoreValue(maxScoreInput.value, 10);
            saveSettings(settings);
        }

        async function loadTasksAndTitles() {
            if (!gameConfig || !gameConfig.taskFiles) return;
            await Promise.allSettled(gameConfig.taskFiles.map(file => loadScript(`games/${gameId}/${file}`)));
            if (window.taskTitles && typeof window.taskTitles === 'object') taskTitles = { ...window.taskTitles };
            else taskTitles = {};
            if (window.taskGenerators) taskGenerators = window.taskGenerators;
        }

        let warnedAbout30 = false;
        function setupHoldCounter(btn, delta, numInput, changeCallback) {
            let timeoutId = null, intervalId = null;
            const startHold = (e) => {
                e.preventDefault(); e.stopPropagation();
                if (timeoutId) clearTimeout(timeoutId);
                if (intervalId) clearInterval(intervalId);
                changeCallback(delta);
                timeoutId = setTimeout(() => { intervalId = setInterval(() => changeCallback(delta), 200); }, 700);
            };
            const stopHold = () => {
                if (timeoutId) clearTimeout(timeoutId);
                if (intervalId) clearInterval(intervalId);
            };
            btn.addEventListener('mousedown', startHold);
            btn.addEventListener('mouseup', stopHold);
            btn.addEventListener('mouseleave', stopHold);
            btn.addEventListener('touchstart', startHold, { passive: false });
            btn.addEventListener('touchend', stopHold);
            btn.addEventListener('touchcancel', stopHold);
        }

        function renderOrganizerCustom() {
            const container = document.getElementById('setupCard');
            const gameName = gameConfig?.gameName || gameId;
            document.getElementById('resultContainer').style.display = 'none';
            container.innerHTML = `
                <div class="back-button" id="backButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Назад</span>
                </div>
                <h1>${gameName} · турнир</h1>
                <div style="text-align: center;"><div class="sub">Выберите типы задач и их количество</div></div>
                <div id="customTaskListContainer"></div>
                <div class="bottom-links">
                    <div>
                        <label class="checkbox-label"><input type="checkbox" id="shuffleCheckbox"> В случайном порядке</label>

                        <div class="extra-settings-wrapper">
                            <button type="button" class="extra-settings-btn" id="singleExtraSettingsBtn">⚙️ Доп. настройки</button>

                            <div class="extra-settings-popover" id="singleExtraSettingsPopover">
                                <div class="extra-settings-title">Дополнительные настройки</div>

                                <label class="settings-toggle-row">
                                    <input type="checkbox" id="singleShowAnswerImmediatelyToggle">
                                    <span class="settings-toggle-ui"></span>
                                    <span class="settings-toggle-text">Показывать ответ задачи сразу</span>
                                </label>

                                <div class="settings-toggle-row settings-score-row">
                                    <input type="checkbox" id="singleScoreEnabledToggle">
                                    <span class="settings-toggle-ui" id="singleScoreToggleUi"></span>
                                    <span class="settings-score-control">
                                        <span class="settings-score-label">Баллы за тест</span>
                                        <span class="settings-score-counter" id="singleScoreCounter">
                                            <button type="button" class="score-counter-btn" id="singleMaxScoreMinusBtn">−</button>
                                            <input type="text" id="singleMaxScoreInput" class="settings-score-input" value="10" inputmode="numeric" maxlength="3">
                                            <button type="button" class="score-counter-btn" id="singleMaxScorePlusBtn">+</button>
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <span id="clearAllBtn" class="clickable-link">✗ Убрать все</span>
                </div>
                <div class="total-wrapper">
                    <div class="total-tasks-control">
                        <div class="total-tasks-label">ВСЕГО ЗАДАЧ</div>
                        <div class="total-tasks-counter">
                            <button class="counter-btn" id="totalMinusBtn">−</button>
                            <input type="text" id="totalTasksInput" class="counter-input" value="0" inputmode="numeric">
                            <button class="counter-btn" id="totalPlusBtn">+</button>
                        </div>
                    </div>
                </div>
                <div class="modal-actions" style="margin-top: 0.5rem;">
                    <button id="generateCustomBtn" class="custom-generate-btn">Сгенерировать тест</button>
                    <div id="generationStatus" class="generation-status">
                        Генерируем ссылку на тест. Не закрывайте страницу.
                    </div>
                </div>
                <div id="modalToast" class="modal-toast" style="margin-top: 0.8rem;"></div>
            `;

            document.getElementById('backButton').addEventListener('click', () => {
                clearAllOrganizerStorage();
                window.location.href = 'organizer.html';
            });

            const keys = Object.keys(taskTitles).sort((a,b)=>Number(a)-Number(b));
            const saved = loadSavedSettings();
            applySavedSettings(saved);

            let counts = {};
            if (window._savedCustomCounts) {
                for (const key of keys) counts[key] = window._savedCustomCounts[key] || 0;
            } else {
                for (const key of keys) counts[key] = 0;
            }

            const shuffleCheckbox = document.getElementById('shuffleCheckbox');
            shuffleCheckbox.checked = window._savedCustomShuffle === undefined ? false : window._savedCustomShuffle;

            const showAnswerImmediatelyToggle = document.getElementById('singleShowAnswerImmediatelyToggle');
            if (showAnswerImmediatelyToggle) {
                showAnswerImmediatelyToggle.checked = window._savedShowAnswerImmediately === undefined ? false : window._savedShowAnswerImmediately;
                showAnswerImmediatelyToggle.addEventListener('change', () => {
                    window._savedShowAnswerImmediately = showAnswerImmediatelyToggle.checked;
                    saveCurrentSettings();
                });
            }

            const scoreEnabledToggle = document.getElementById('singleScoreEnabledToggle');
            const maxScoreInput = document.getElementById('singleMaxScoreInput');
            if (scoreEnabledToggle && maxScoreInput) {
                scoreEnabledToggle.checked = window._savedScoreEnabled === undefined ? false : window._savedScoreEnabled;
                maxScoreInput.value = window._savedMaxScore === undefined ? 10 : normalizeScoreValue(window._savedMaxScore, 10);

                setupScoreCounter({
                    toggleId: 'singleScoreEnabledToggle',
                    toggleUiId: 'singleScoreToggleUi',
                    counterId: 'singleScoreCounter',
                    inputId: 'singleMaxScoreInput',
                    minusId: 'singleMaxScoreMinusBtn',
                    plusId: 'singleMaxScorePlusBtn',
                    onToggleChange: (enabled, value) => {
                        window._savedScoreEnabled = enabled;
                        window._savedMaxScore = value;
                        saveCurrentSettings();
                    },
                    onValueChange: (value) => {
                        window._savedMaxScore = value;
                        saveCurrentSettings();
                    }
                });
            }

            setupExtraSettingsPopover('singleExtraSettingsBtn', 'singleExtraSettingsPopover');

            const containerList = document.getElementById('customTaskListContainer');
            containerList.innerHTML = '';

            function getTotalCount() {
                let total = 0;
                for (const k of keys) total += counts[k];
                return total;
            }

            function updateTotalDisplay() {
                const totalInput = document.getElementById('totalTasksInput');
                if (totalInput) totalInput.value = getTotalCount();
            }

            function checkAndWarnTotal(total) {
                if (total > 30 && !warnedAbout30) {
                    showModalToast('⚠️ При генерации больше 30 задач, возможны задержки', 'modalToast');
                    warnedAbout30 = true;
                } else if (total <= 30) {
                    warnedAbout30 = false;
                }
            }

            function distributeTotal(totalVal) {
                if (totalVal < 0) totalVal = 0;
                if (totalVal > 50) totalVal = 50;
                let remaining = totalVal;
                const perType = Math.floor(totalVal / keys.length);
                const extra = totalVal % keys.length;
                const newCounts = {};
                for (let idx = 0; idx < keys.length; idx++) {
                    let val = perType;
                    if (idx < extra) val++;
                    newCounts[keys[idx]] = val;
                }
                for (const key of keys) {
                    setCount(key, newCounts[key], 'total');
                }
                updateTotalDisplay();
                checkAndWarnTotal(getTotalCount());
            }

            function adjustTotalByOne(delta) {
                let currentTotal = getTotalCount();
                let newTotal = currentTotal + delta;

                if (newTotal < 0) {
                    showModalToast('Общее количество задач не может быть отрицательным', 'modalToast');
                    return;
                }

                if (newTotal > 50) {
                    showModalToast('Суммарное количество задач не может превышать 50', 'modalToast');
                    return;
                }

                if (delta > 0) {
                    let minKey = keys[0];
                    for (const key of keys) {
                        if (counts[key] < counts[minKey]) {
                            minKey = key;
                        }
                    }
                    setCount(minKey, counts[minKey] + 1, 'user');

                } else {
                    let maxKey = null;

                    for (const key of keys) {
                        if (counts[key] > 0 && (maxKey === null || counts[key] > counts[maxKey])) {
                            maxKey = key;
                        }
                    }

                    if (maxKey !== null) {
                        setCount(maxKey, counts[maxKey] - 1, 'user');
                    }
                }

                updateTotalDisplay();
                checkAndWarnTotal(getTotalCount());
            }

            function handleTotalManualInput(totalVal) {
                distributeTotal(totalVal);
            }

            function setCount(key, newVal, source = 'user') {
                let oldVal = counts[key];
                if (oldVal === newVal) return false;
                let total = getTotalCount();
                let delta = newVal - oldVal;
                if (total + delta > 50) {
                    let allowed = oldVal + (50 - total);
                    if (allowed < 0) allowed = 0;
                    if (allowed === oldVal) {
                        if (source === 'user') showModalToast('Суммарное количество задач не может превышать 50', 'modalToast');
                        return false;
                    }
                    newVal = allowed;
                    if (source === 'user') showModalToast('Суммарное количество задач не может превышать 50. Значение скорректировано.', 'modalToast');
                }
                if (newVal < 0) newVal = 0;
                if (newVal > 50) newVal = 50;
                if (newVal === oldVal) return false;
                counts[key] = newVal;
                const inputEl = document.getElementById(`input_${key}`);
                if (inputEl && inputEl.value != newVal) inputEl.value = newVal;
                updateTotalDisplay();
                checkAndWarnTotal(getTotalCount());
                window._customCounts = { ...counts };
                window._savedCustomCounts = window._customCounts;
                window._savedCustomShuffle = shuffleCheckbox.checked;
                saveCurrentSettings();
                return true;
            }

            for (const key of keys) {
                const row = document.createElement('div'); row.className = 'task-row';
                const nameSpan = document.createElement('span'); nameSpan.className = 'task-name'; nameSpan.textContent = taskTitles[key];
                const counterDiv = document.createElement('div'); counterDiv.className = 'task-counter';
                const minusBtn = document.createElement('button'); minusBtn.textContent = '−'; minusBtn.className = 'counter-btn';
                const numInput = document.createElement('input'); numInput.type = 'text'; numInput.id = `input_${key}`;
                numInput.value = counts[key] === 0 ? '0' : counts[key].toString(); numInput.className = 'counter-input';
                const plusBtn = document.createElement('button'); plusBtn.textContent = '+'; plusBtn.className = 'counter-btn';

                numInput.addEventListener('input', (e) => {
                    let raw = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                    let val = raw === '' ? 0 : parseInt(raw, 10);
                    if (isNaN(val)) val = 0;
                    if (val > 50) { showModalToast('Набрано максимально доступное число задач — 50', 'modalToast'); val = 50; }
                    numInput.value = val === 0 ? '0' : val.toString();
                    setCount(key, val, 'user');
                });
                numInput.addEventListener('paste', (e) => {
                    e.preventDefault();
                    let pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').replace(/^0+/, '');
                    let val = pasted === '' ? 0 : parseInt(pasted, 10);
                    if (isNaN(val)) val = 0;
                    if (val > 50) { showModalToast('Набрано максимально доступное число задач — 50', 'modalToast'); val = 50; }
                    numInput.value = val === 0 ? '0' : val.toString();
                    setCount(key, val, 'user');
                });
                function changeBy(delta) {
                    let newVal = counts[key] + delta;
                    if (newVal < 0) newVal = 0;
                    if (newVal > 50) { if (delta > 0) showModalToast('Набрано максимально доступное число задач — 50', 'modalToast'); newVal = 50; }
                    setCount(key, newVal, 'user');
                }
                setupHoldCounter(minusBtn, -1, numInput, changeBy);
                setupHoldCounter(plusBtn, +1, numInput, changeBy);

                counterDiv.appendChild(minusBtn); counterDiv.appendChild(numInput); counterDiv.appendChild(plusBtn);
                row.appendChild(nameSpan); row.appendChild(counterDiv);
                containerList.appendChild(row);
            }

            document.getElementById('clearAllBtn').addEventListener('click', () => {
                for (const key of keys) setCount(key, 0, 'user');
                warnedAbout30 = false;
                showModalToast('Все счётчики сброшены', 'modalToast');
                updateTotalDisplay();
            });
            shuffleCheckbox.addEventListener('change', () => {
                window._savedCustomShuffle = shuffleCheckbox.checked;
                saveCurrentSettings();
            });

            const totalMinusBtn = document.getElementById('totalMinusBtn');
            const totalPlusBtn = document.getElementById('totalPlusBtn');
            const totalTasksInput = document.getElementById('totalTasksInput');

            if (totalMinusBtn) {
                setupHoldCounter(totalMinusBtn, -1, totalTasksInput, () => adjustTotalByOne(-1));
            }
            if (totalPlusBtn) {
                setupHoldCounter(totalPlusBtn, +1, totalTasksInput, () => adjustTotalByOne(+1));
            }
            if (totalTasksInput) {
                totalTasksInput.addEventListener('input', (e) => {
                    let raw = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                    let val = raw === '' ? 0 : parseInt(raw, 10);
                    if (isNaN(val)) val = 0;
                    if (val > 50) { showModalToast('Суммарное количество задач не может превышать 50', 'modalToast'); val = 50; }
                    totalTasksInput.value = val === 0 ? '0' : val.toString();
                    handleTotalManualInput(val);
                });
                totalTasksInput.addEventListener('paste', (e) => {
                    e.preventDefault();
                    let pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').replace(/^0+/, '');
                    let val = pasted === '' ? 0 : parseInt(pasted, 10);
                    if (isNaN(val)) val = 0;
                    if (val > 50) { showModalToast('Суммарное количество задач не может превышать 50', 'modalToast'); val = 50; }
                    totalTasksInput.value = val === 0 ? '0' : val.toString();
                    handleTotalManualInput(val);
                });
            }

            updateTotalDisplay();
            checkAndWarnTotal(getTotalCount());

            document.getElementById('generateCustomBtn').addEventListener('click', async () => {
                const generateBtn = document.getElementById('generateCustomBtn');

                if (generateBtn.dataset.mode === 'generateNew') {
                    resetPageToInitialStateForNewGeneration();
                    return;
                }

                const selected = {};
                let total = 0;
                for (const key of keys) if (counts[key] > 0) { selected[key] = counts[key]; total += counts[key]; }
                if (total === 0) { showModalToast('Выберите хотя бы одну задачу', 'modalToast'); return; }
                const shuffleOn = shuffleCheckbox.checked;
                const showAnswerImmediately = document.getElementById('singleShowAnswerImmediatelyToggle')?.checked === true;
                const scoreEnabled = document.getElementById('singleScoreEnabledToggle')?.checked === true;
                const maxScore = normalizeScoreValue(document.getElementById('singleMaxScoreInput')?.value, 10);

                const originalText = generateBtn.innerText;
                prepareGenerateButtonForNormalMode(generateBtn, originalText);
                generateBtn.innerHTML = '<span class="loading-spinner"></span> Генерация...';
                generateBtn.disabled = true;

                setGenerationControlsLocked(true, 'generateCustomBtn');

                showGenerationStatus('generationStatus');

                const testId = await generateUniqueTestId();
                const shuffleText = shuffleOn ? 'случайный порядок' : 'по порядку';
                const config = {
                    gameId,
                    gameTitle: gameName,
                    mode: 'single',
                    title: `Турнир ${gameName}`,
                    originalTitle: `Турнир ${gameName}`,
                    tasksCount: total,
                    settingsSummary: `${gameName} · ${total} заданий · ${shuffleText}`,
                    settingsDetails: buildSingleSettingsDetails(gameName, taskTitles, selected, total, shuffleOn, showAnswerImmediately, scoreEnabled, maxScore),
                    tasks: selected,
                    shuffle: shuffleOn,
                    showAnswerImmediately: showAnswerImmediately,
                    scoreEnabled: scoreEnabled,
                    maxScore: maxScore,
                    createdAt: new Date().toISOString()
                };

                try {
                    await saveTestToCloud(testId, config);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    generateBtn.innerHTML = originalText;
                    generateBtn.disabled = false;
                    hideGenerationStatus('generationStatus');
                    showResult(testId, config, gameName, taskTitles, total, shuffleOn);
                } catch (error) {
                    generateBtn.innerHTML = originalText;
                    generateBtn.disabled = false;

                    setGenerationControlsLocked(false, 'generateCustomBtn');

                    hideGenerationStatus('generationStatus');
                    showModalToast('Ошибка при создании теста. Попробуйте ещё раз.', 'modalToast');
                    console.error(error);
                }
            });
        }

        (async () => {
            gameConfig = await loadGameConfig(gameId);
            if (!gameConfig) {
                document.getElementById('setupCard').innerHTML = `
                    <div class="back-button" id="backButton">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        <span>Назад</span>
                    </div>
                    <h1>Ошибка</h1>
                    <p>Не удалось загрузить конфигурацию игры</p>
                `;
                document.getElementById('backButton').addEventListener('click', () => {
                    clearAllOrganizerStorage();
                    window.location.href = 'organizer.html';
                });
                return;
            }
            await loadTasksAndTitles();
            renderOrganizerCustom();
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
        let mixedShowAnswerImmediately = false;
        let mixedScoreEnabled = false;
        let mixedMaxScore = 10;
        const MIXED_STORAGE_KEY = 'mixedTestSetup';

        if (resetParam) localStorage.removeItem(MIXED_STORAGE_KEY);
        else {
            const saved = localStorage.getItem(MIXED_STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.games) mixedCounts = parsed.games;
                    if (parsed.shuffle !== undefined) mixedShuffle = parsed.shuffle;
                    if (parsed.showAnswerImmediately !== undefined) mixedShowAnswerImmediately = parsed.showAnswerImmediately;
                    if (parsed.scoreEnabled !== undefined) mixedScoreEnabled = parsed.scoreEnabled;
                    if (parsed.maxScore !== undefined) mixedMaxScore = parsed.maxScore;
                } catch(e) {}
            }
        }

        async function loadGameTitlesIsolated(gid) {
            try {
                const configRes = await fetch(`games/${gid}/config.json`);
                if (!configRes.ok) throw new Error(`config.json для ${gid} не найден`);
                const config = await configRes.json();
                const taskFiles = config.taskFiles || [];
                if (taskFiles.length === 0) return null;
                const titles = {};
                for (const file of taskFiles) {
                    const url = `games/${gid}/${file}`;
                    const jsText = await fetch(url).then(r => r.text());
                    const sandbox = {};
                    const func = new Function('window', jsText + '; return window.taskTitles;');
                    const taskTitles = func(sandbox);
                    if (taskTitles && typeof taskTitles === 'object') Object.assign(titles, taskTitles);
                }
                if (Object.keys(titles).length === 0) return null;
                return titles;
            } catch(e) {
                console.error(`Ошибка загрузки для ${gid}:`, e);
                return null;
            }
        }

        async function loadAllMixedGamesData() {
            for (const game of availableGames) mixedGamesData[game.id] = await loadGameTitlesIsolated(game.id);
        }

        function saveMixedSettings() {
            localStorage.setItem(MIXED_STORAGE_KEY, JSON.stringify({
                games: mixedCounts,
                shuffle: mixedShuffle,
                showAnswerImmediately: mixedShowAnswerImmediately,
                scoreEnabled: mixedScoreEnabled,
                maxScore: mixedMaxScore
            }));
        }

        function showMixedToast(message) {
            const mixedToast = document.getElementById('mixedToast');
            if (mixedToast) {
                mixedToast.textContent = message;
                mixedToast.classList.add('show');
                setTimeout(() => mixedToast.classList.remove('show'), 2500);
            }
        }

        function updateSelectedGamesInfo() {
            const infoDiv = document.getElementById('selectedGamesInfo');
            if (!infoDiv) return;
            const selected = [];
            for (const game of availableGames) {
                if (mixedCounts[game.id] && Object.keys(mixedCounts[game.id]).length > 0) selected.push(game.name);
            }
            infoDiv.innerText = selected.length === 0 ? 'Выбраны игры: (ни одна не выбрана)' : `Выбраны игры: ${selected.join(', ')}`;
        }

        function updateMixedButtonText() {
            let total = 0;
            for (const game of availableGames) {
                if (mixedCounts[game.id]) for (const cnt of Object.values(mixedCounts[game.id])) total += cnt;
            }
            const btn = document.getElementById('mixedGenerateBtn');
            if (!btn) return;
            if (total === 0) btn.innerText = 'Сгенерировать тест';
            else {
                const wf = (total % 10 === 1 && total % 100 !== 11) ? 'задача' : ((total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20)) ? 'задачи' : 'задач');
                btn.innerText = `Сгенерировать тест\nиз ${total} ${wf}`;
            }
        }

        function setMixedCount(gid, taskType, newVal) {
            if (!mixedCounts[gid]) mixedCounts[gid] = {};
            let oldVal = mixedCounts[gid][taskType] || 0;
            if (oldVal === newVal) return;
            let total = 0;
            for (const g of availableGames) if (mixedCounts[g.id]) for (const cnt of Object.values(mixedCounts[g.id])) total += cnt;
            let delta = newVal - oldVal;
            if (total + delta > 50) {
                let allowed = oldVal + (50 - total);
                if (allowed < 0) allowed = 0;
                if (allowed === oldVal) { showMixedToast('Суммарное количество задач не может превышать 50'); return; }
                newVal = allowed;
                showMixedToast('Суммарное количество задач не может превышать 50. Значение скорректировано.');
            }
            if (newVal < 0) newVal = 0;
            if (newVal > 50) newVal = 50;
            if (newVal === oldVal) return;
            if (newVal === 0) {
                delete mixedCounts[gid][taskType];
                if (Object.keys(mixedCounts[gid]).length === 0) delete mixedCounts[gid];
            } else mixedCounts[gid][taskType] = newVal;
            const inputEl = document.querySelector(`#tasks_${gid} .task-row-mixed[data-type="${taskType}"] .counter-input-mixed`);
            if (inputEl) inputEl.value = newVal;
            updateSelectedGamesInfo();
            updateMixedButtonText();
            saveMixedSettings();
            const chk = document.getElementById(`chk_${gid}`);
            const hasTasks = mixedCounts[gid] && Object.keys(mixedCounts[gid]).length > 0;
            if (chk) chk.checked = hasTasks;
            const tasksDiv = document.getElementById(`tasks_${gid}`);
            if (tasksDiv) tasksDiv.style.display = hasTasks ? 'block' : 'none';
        }

        function renderMixedSetup() {
            const container = document.getElementById('setupCard');
            document.getElementById('resultContainer').style.display = 'none';
            let html = `
                <div class="back-button" id="backButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Назад</span>
                </div>
                <h1>Сборный тест · турнир</h1>
                <div style="text-align: center;"><div class="sub">Выберите игры и типы задач</div></div>
            `;
            for (const game of availableGames) {
                const titlesObj = mixedGamesData[game.id];
                if (!titlesObj) {
                    html += `<div class="game-block" style="opacity:0.7; background:#ffe0e0;">
                        <div class="game-header"><span class="game-title">${game.name}</span><span class="game-error">⚠️ Типы задач не загружены</span></div></div>`;
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
                    <div>
                        <label class="checkbox-label"><input type="checkbox" id="mixedShuffleCheckbox" ${mixedShuffle ? 'checked' : ''}> В случайном порядке</label>

                        <div class="extra-settings-wrapper">
                            <button type="button" class="extra-settings-btn" id="mixedExtraSettingsBtn">⚙️ Доп. настройки</button>

                            <div class="extra-settings-popover" id="mixedExtraSettingsPopover">
                                <div class="extra-settings-title">Дополнительные настройки</div>

                                <label class="settings-toggle-row">
                                    <input type="checkbox" id="mixedShowAnswerImmediatelyToggle" ${mixedShowAnswerImmediately ? 'checked' : ''}>
                                    <span class="settings-toggle-ui"></span>
                                    <span class="settings-toggle-text">Показывать ответ задачи сразу</span>
                                </label>

                                <div class="settings-toggle-row settings-score-row">
                                    <input type="checkbox" id="mixedScoreEnabledToggle" ${mixedScoreEnabled ? 'checked' : ''}>
                                    <span class="settings-toggle-ui" id="mixedScoreToggleUi"></span>
                                    <span class="settings-score-control">
                                        <span class="settings-score-label">Баллы за тест</span>
                                        <span class="settings-score-counter" id="mixedScoreCounter">
                                            <button type="button" class="score-counter-btn" id="mixedMaxScoreMinusBtn">−</button>
                                            <input type="text" id="mixedMaxScoreInput" class="settings-score-input" value="${mixedMaxScore ?? 10}" inputmode="numeric" maxlength="3" ${mixedScoreEnabled ? '' : 'disabled'}>
                                            <button type="button" class="score-counter-btn" id="mixedMaxScorePlusBtn">+</button>
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <span id="mixedClearAllBtn" class="clickable-link">✗ Убрать все</span>
                </div>
                <div style="text-align: center;">
                    <button id="mixedGenerateBtn" class="custom-generate-btn">Сгенерировать тест</button>
                    <div id="mixedGenerationStatus" class="generation-status">
                        Генерируем ссылку на тест. Не закрывайте страницу.
                    </div>
                </div>
                <div id="selectedGamesInfo" class="selected-games-info"></div>
                <div id="mixedToast" class="mixed-toast"></div>
            `;
            container.innerHTML = html;
            setupExtraSettingsPopover('mixedExtraSettingsBtn', 'mixedExtraSettingsPopover');

            const mixedShowAnswerImmediatelyToggle = document.getElementById('mixedShowAnswerImmediatelyToggle');
            if (mixedShowAnswerImmediatelyToggle) {
                mixedShowAnswerImmediatelyToggle.addEventListener('change', (e) => {
                    mixedShowAnswerImmediately = e.target.checked;
                    saveMixedSettings();
                });
            }

            const mixedScoreEnabledToggle = document.getElementById('mixedScoreEnabledToggle');
            const mixedMaxScoreInput = document.getElementById('mixedMaxScoreInput');
            if (mixedScoreEnabledToggle && mixedMaxScoreInput) {
                setupScoreCounter({
                    toggleId: 'mixedScoreEnabledToggle',
                    toggleUiId: 'mixedScoreToggleUi',
                    counterId: 'mixedScoreCounter',
                    inputId: 'mixedMaxScoreInput',
                    minusId: 'mixedMaxScoreMinusBtn',
                    plusId: 'mixedMaxScorePlusBtn',
                    onToggleChange: (enabled, value) => {
                        mixedScoreEnabled = enabled;
                        mixedMaxScore = value;
                        saveMixedSettings();
                    },
                    onValueChange: (value) => {
                        mixedMaxScore = value;
                        saveMixedSettings();
                    }
                });
            }

            document.getElementById('backButton').addEventListener('click', () => {
                clearAllOrganizerStorage();
                window.location.href = 'organizer.html';
            });

            for (const game of availableGames) {
                const titlesObj = mixedGamesData[game.id];
                if (!titlesObj) continue;
                const tasksDiv = document.getElementById(`tasks_${game.id}`);
                if (!tasksDiv) continue;
                const keys = Object.keys(titlesObj).sort((a,b)=>Number(a)-Number(b));
                const savedCounts = mixedCounts[game.id] || {};
                let tasksHtml = '';
                for (const key of keys) {
                    const countVal = savedCounts[key] || 0;
                    tasksHtml += `
                        <div class="task-row-mixed" data-type="${key}">
                            <span class="task-name-mixed">${titlesObj[key]}</span>
                            <div class="task-counter-mixed">
                                <button class="counter-btn-mixed" data-delta="-1">−</button>
                                <input type="text" class="counter-input-mixed" value="${countVal}">
                                <button class="counter-btn-mixed" data-delta="+1">+</button>
                            </div>
                        </div>`;
                }
                tasksDiv.innerHTML = tasksHtml;
            }

            for (const game of availableGames) {
                if (!mixedGamesData[game.id]) continue;
                const tasksDiv = document.getElementById(`tasks_${game.id}`);
                if (!tasksDiv) continue;
                for (const row of tasksDiv.querySelectorAll('.task-row-mixed')) {
                    const taskType = row.dataset.type;
                    const minusBtn = row.querySelector('.counter-btn-mixed[data-delta="-1"]');
                    const plusBtn = row.querySelector('.counter-btn-mixed[data-delta="+1"]');
                    const inp = row.querySelector('.counter-input-mixed');
                    if (minusBtn) minusBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        setMixedCount(game.id, taskType, (mixedCounts[game.id]?.[taskType] || 0) - 1);
                    });
                    if (plusBtn) plusBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        setMixedCount(game.id, taskType, (mixedCounts[game.id]?.[taskType] || 0) + 1);
                    });
                    if (inp) {
                        inp.addEventListener('input', (e) => {
                            let raw = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                            let val = raw === '' ? 0 : parseInt(raw, 10);
                            if (isNaN(val)) val = 0;
                            if (val > 50) val = 50;
                            setMixedCount(game.id, taskType, val);
                        });
                        inp.addEventListener('paste', (e) => {
                            e.preventDefault();
                            let pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').replace(/^0+/, '');
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
                            delete mixedCounts[game.id];
                            saveMixedSettings();
                            updateSelectedGamesInfo();
                            updateMixedButtonText();
                            if (tDiv) tDiv.querySelectorAll('.counter-input-mixed').forEach(i => i.value = '0');
                        } else {
                            if (!mixedCounts[game.id]) mixedCounts[game.id] = {};
                            saveMixedSettings();
                            updateSelectedGamesInfo();
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
                        tDiv.querySelectorAll('.counter-input-mixed').forEach(i => i.value = '0');
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

            document.getElementById('mixedGenerateBtn').addEventListener('click', async () => {
                const generateBtn = document.getElementById('mixedGenerateBtn');

                if (generateBtn.dataset.mode === 'generateNew') {
                    resetPageToInitialStateForNewGeneration();
                    return;
                }

                const selectedGamesData = [];
                let totalTasks = 0;
                for (const game of availableGames) {
                    if (!mixedCounts[game.id]) continue;
                    const gameTasks = {};
                    for (const [type, count] of Object.entries(mixedCounts[game.id])) {
                        if (count > 0) { gameTasks[type] = count; totalTasks += count; }
                    }
                    if (Object.keys(gameTasks).length > 0) selectedGamesData.push({ id: game.id, name: game.name, tasks: gameTasks });
                }
                if (selectedGamesData.length === 0) { showMixedToast('Выберите хотя бы одну задачу'); return; }
                const shuffleOn = document.getElementById('mixedShuffleCheckbox').checked;
                const showAnswerImmediately = document.getElementById('mixedShowAnswerImmediatelyToggle')?.checked === true;
                const scoreEnabled = document.getElementById('mixedScoreEnabledToggle')?.checked === true;
                const maxScore = normalizeScoreValue(document.getElementById('mixedMaxScoreInput')?.value, 10);

                const originalText = generateBtn.innerText;
                prepareGenerateButtonForNormalMode(generateBtn, originalText);
                generateBtn.innerHTML = '<span class="loading-spinner"></span> Генерация...';
                generateBtn.disabled = true;

                setGenerationControlsLocked(true, 'mixedGenerateBtn');

                showGenerationStatus('mixedGenerationStatus');

                const testId = await generateUniqueTestId();
                const selectedGameNames = selectedGamesData.map(game => game.name);
                const mixedGameTitle = selectedGameNames.join(', ');
                const mixedTitle = mixedGameTitle ? `Сборный тест: ${mixedGameTitle}` : 'Сборный тест';
                const mixedShuffleText = shuffleOn ? 'случайный порядок' : 'по порядку';
                const config = {
                    gameId: 'mixed',
                    gameTitle: mixedGameTitle,
                    mode: 'mixed',
                    title: mixedTitle,
                    originalTitle: mixedTitle,
                    tasksCount: totalTasks,
                    settingsSummary: `${mixedTitle} · ${totalTasks} заданий · ${mixedShuffleText}`,
                    settingsDetails: buildMixedSettingsDetails(selectedGamesData, mixedGamesData, totalTasks, shuffleOn, showAnswerImmediately, scoreEnabled, maxScore),
                    games: {},
                    shuffle: shuffleOn,
                    showAnswerImmediately: showAnswerImmediately,
                    scoreEnabled: scoreEnabled,
                    maxScore: maxScore,
                    createdAt: new Date().toISOString()
                };
                for (const gd of selectedGamesData) config.games[gd.id] = gd.tasks;

                try {
                    await saveTestToCloud(testId, config);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    generateBtn.innerHTML = originalText;
                    generateBtn.disabled = false;
                    hideGenerationStatus('mixedGenerationStatus');
                    const titlesArg = { __gameNames: {} };
                    for (const game of availableGames) {
                        titlesArg.__gameNames[game.id] = game.name;
                        titlesArg[game.id] = mixedGamesData[game.id] || {};
                    }
                    showResult(testId, config, 'Сборный тест', titlesArg, totalTasks, shuffleOn);
                } catch (error) {
                    generateBtn.innerHTML = originalText;
                    generateBtn.disabled = false;

                    setGenerationControlsLocked(false, 'mixedGenerateBtn');

                    hideGenerationStatus('mixedGenerationStatus');
                    showMixedToast('Ошибка при создании теста. Попробуйте ещё раз.');
                    console.error(error);
                }
            });

            updateSelectedGamesInfo();
            updateMixedButtonText();
        }

        (async () => {
            await loadAllMixedGamesData();
            renderMixedSetup();
        })();
    }
