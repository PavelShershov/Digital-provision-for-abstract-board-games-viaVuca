ViaVucaParticles.create({ count: 42, maxOpacity: 0.38 });

const USE_DEMO_DATA_UNTIL_CLOUD_INTEGRATION = false;

    const demoTournamentLinks = [
        {
            id: 'test_alq_8f31',
            organizerName: sessionStorage.getItem('organizerName') || 'Анна Сергеева',
            organizerLogin: sessionStorage.getItem('organizerLogin') || 'anna@school.ru',
            createdAt: '2026-05-08T10:30:00',
            url: `${window.location.origin}${window.location.pathname.replace('organizer_links.html', '')}test_auth.html?testId=test_alq_8f31`,
            games: ['Алькерк'],
            gameTitle: 'Алькерк',
            mode: 'single',
            title: 'Турнир Алькерк',
            tasksCount: 12,
            settings: 'Захваты, лучший ход, оценка позиции'
        },
        {
            id: 'test_mix_27d4',
            organizerName: 'Иван Петров',
            organizerLogin: 'ivan@school.ru',
            createdAt: '2026-05-07T16:45:00',
            url: `${window.location.origin}${window.location.pathname.replace('organizer_links.html', '')}test_auth.html?testId=test_mix_27d4`,
            games: ['Алькерк', 'Фанорона', 'Реверси'],
            gameTitle: 'Алькерк, Фанорона, Реверси',
            mode: 'mixed',
            title: 'Сборный тест: Алькерк, Фанорона, Реверси',
            tasksCount: 18,
            settings: 'Сборный тест, случайный порядок задач'
        },
        {
            id: 'test_rev_91ac',
            organizerName: 'Мария Волкова',
            organizerLogin: 'maria@school.ru',
            createdAt: '2026-05-06T12:10:00',
            url: `${window.location.origin}${window.location.pathname.replace('organizer_links.html', '')}test_auth.html?testId=test_rev_91ac`,
            games: ['Реверси'],
            gameTitle: 'Реверси',
            mode: 'single',
            title: 'Турнир Реверси',
            tasksCount: 10,
            settings: 'Поиск лучшего хода, оценка переворотов'
        }
    ];

    let tournamentLinks = [];

    const linksList = document.getElementById('linksList');
    const refreshBtn = document.getElementById('refreshBtn');
    const linksTitle = document.getElementById('linksTitle');
    const linksSubtitle = document.getElementById('linksSubtitle');
    const totalCount = document.getElementById('totalCount');
    const toast = document.getElementById('toast');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteConfirmCheckbox = document.getElementById('deleteConfirmCheckbox');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
    const deleteCancelBtn = document.getElementById('deleteCancelBtn');
    const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');
    let pendingDeleteTestId = '';

    function getCurrentOrganizer() {
        return {
            name: sessionStorage.getItem('organizerName') || '',
            login: sessionStorage.getItem('organizerLogin') || ''
        };
    }

    function normalizeText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function isMine(link) {
        const organizer = getCurrentOrganizer();
        const currentLogin = normalizeText(organizer.login);
        const currentName = normalizeText(organizer.name);
        const linkLogin = normalizeText(link.organizerLogin);
        const linkName = normalizeText(link.organizerName);

        if (currentLogin && linkLogin) return currentLogin === linkLogin;
        if (currentName && linkName) return currentName === linkName;

        return false;
    }

    function formatDate(value) {
        if (!value) return 'Дата не указана';

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function shortenUrl(url) {
        const text = String(url || '');

        if (text.length <= 42) return text;

        return text.slice(0, 22) + '…' + text.slice(-16);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function buildTournamentTitle(link) {
        if (link && link.title) {
            return String(link.title);
        }

        const mode = String((link && link.mode) || '').trim().toLowerCase();
        const games = Array.isArray(link && link.games)
            ? link.games.map(item => String(item || '').trim()).filter(Boolean)
            : [];
        const gameTitle = String((link && link.gameTitle) || '').trim();

        if (mode === 'mixed' || games.length > 1) {
            if (gameTitle) return `Сборный тест: ${gameTitle}`;
            if (games.length) return `Сборный тест: ${games.join(', ')}`;
            return 'Сборный тест';
        }

        const singleTitle = gameTitle || games[0] || '';
        return singleTitle ? `Турнир ${singleTitle}` : 'Турнир';
    }

    function parseSettingsDetails(details) {
        if (!details) return null;

        if (typeof details === 'object') return details;

        const text = String(details || '').trim();

        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch (error) {
            return null;
        }
    }

    function renderSettingsDetailsReport(link, fallback) {
        const details = parseSettingsDetails(link.settingsDetails || link.settingsDetailsJson || null);

        if (!details) {
            return `
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-title">Выбранные игры</div>
                        <div class="detail-value">${escapeHtml(fallback.gamesText)}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-title">Количество задач</div>
                        <div class="detail-value">${escapeHtml(fallback.tasksText)}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-title">Настройки ссылки</div>
                        <div class="detail-value">${escapeHtml(fallback.settingsText)}</div>
                    </div>
                </div>
            `;
        }

        const mode = String(details.mode || link.mode || '').trim().toLowerCase();
        const gameName = details.gameName || (mode === 'mixed' ? 'Сборный тест' : (link.gameTitle || 'Игра'));
        const totalTasks = details.totalTasks !== undefined && details.totalTasks !== null && String(details.totalTasks) !== ''
            ? details.totalTasks
            : (link.tasksCount || 'Не указано');
        const orderText = details.order || (link.shuffle ? 'В случайном порядке' : 'По порядку');

        if (mode === 'mixed') {
            const games = Array.isArray(details.games) ? details.games : [];
            const gamesHtml = games.length
                ? games.map(game => {
                    const tasks = Array.isArray(game.tasks) ? game.tasks : [];
                    const tasksText = tasks.length
                        ? tasks.map(task => `${escapeHtml(task.title || task.name || 'Задача')}: ${escapeHtml(task.count ?? '')}`).join(', ')
                        : 'Задачи не указаны';

                    return `
                        <div class="settings-game-block">
                            <div class="settings-game-name">${escapeHtml(game.name || 'Игра')}</div>
                            <div class="settings-inline-tasks">${tasksText}</div>
                        </div>
                    `;
                }).join('')
                : `<div class="settings-game-block"><div class="settings-inline-tasks">Выбранные игры не указаны</div></div>`;

            return `
                <div class="settings-report">
                    <div class="settings-report-row">
                        <span class="settings-report-label">Игра:</span>
                        <span class="settings-report-value">${escapeHtml(gameName)}</span>
                    </div>

                    <div class="settings-report-section-title">Выбранные игры и типы:</div>
                    <div class="settings-task-list">${gamesHtml}</div>

                    <div class="settings-report-row">
                        <span class="settings-report-label">Всего задач:</span>
                        <span class="settings-report-value">${escapeHtml(totalTasks)}</span>
                    </div>

                    <div class="settings-report-row">
                        <span class="settings-report-label">Порядок:</span>
                        <span class="settings-report-value">${escapeHtml(orderText)}</span>
                    </div>
                </div>
            `;
        }

        const tasks = Array.isArray(details.tasks) ? details.tasks : [];
        const tasksHtml = tasks.length
            ? tasks.map(task => `
                <div class="settings-task-item">
                    <div class="settings-task-name">${escapeHtml(task.title || task.name || 'Задача')}</div>
                    <div class="settings-task-count">${escapeHtml(task.count ?? '')}</div>
                </div>
            `).join('')
            : `<div class="settings-task-item"><div class="settings-task-name">Типы задач не указаны</div></div>`;

        return `
            <div class="settings-report">
                <div class="settings-report-row">
                    <span class="settings-report-label">Игра:</span>
                    <span class="settings-report-value">${escapeHtml(gameName)}</span>
                </div>

                <div class="settings-report-section-title">Выбранные типы задач:</div>
                <div class="settings-task-list">${tasksHtml}</div>

                <div class="settings-report-row">
                    <span class="settings-report-label">Всего задач:</span>
                    <span class="settings-report-value">${escapeHtml(totalTasks)}</span>
                </div>

                <div class="settings-report-row">
                    <span class="settings-report-label">Порядок:</span>
                    <span class="settings-report-value">${escapeHtml(orderText)}</span>
                </div>
            </div>
        `;
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 1800);
    }

    function getCurrentOrganizerLoginForReport() {
        return (
            sessionStorage.getItem('organizerLogin') ||
            localStorage.getItem('organizerLogin') ||
            ''
        );
    }

    function getReportExportUrl() {
        return 'http://n98344ew.beget.tech/export_results_xlsx_vendor.php/';
    }

    function getDownloadFrame() {
        let frame = document.getElementById('xlsxDownloadFrame');

        if (!frame) {
            frame = document.createElement('iframe');
            frame.id = 'xlsxDownloadFrame';
            frame.name = 'xlsxDownloadFrame';
            frame.style.display = 'none';
            document.body.appendChild(frame);
        }

        return frame;
    }

    function setDownloadButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.dataset.originalHtml = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<span class="download-table-spinner"></span> Скачивание...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalHtml || '📥 Скачать таблицу';
            delete button.dataset.originalHtml;
        }
    }

    function downloadTestTable(testId, button) {
        testId = String(testId || '').trim();

        if (!testId) {
            showToast('Не найден testId для отчёта');
            return;
        }

        const organizerLogin = getCurrentOrganizerLoginForReport();

        if (!organizerLogin) {
            showToast('Выполните вход заново');
            window.location.href = 'organizer_login.html';
            return;
        }

        const url =
            getReportExportUrl() +
            '?testId=' + encodeURIComponent(testId) +
            '&organizerLogin=' + encodeURIComponent(organizerLogin);

        setDownloadButtonLoading(button, true);

        const frame = getDownloadFrame();
        frame.src = url;

        setTimeout(() => {
            setDownloadButtonLoading(button, false);
        }, 2500);
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

    async function loadTournamentLinksFromCloud() {
        if (typeof window.loadOrganizerTournamentLinks !== 'function') {
            throw new Error('Функция загрузки турнирных ссылок не подключена');
        }

        return await window.loadOrganizerTournamentLinks();
    }

    async function saveTournamentTitleToCloud(testId, title) {
        if (typeof window.updateTournamentTitle === 'function') {
            return await window.updateTournamentTitle(testId, title);
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
                action: 'updateTournamentTitle',
                testId,
                title,
                organizerLogin
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось обновить название');
        }

        return data;
    }


    async function deleteTournamentFromCloud(testId) {
        if (!testId) {
            throw new Error('testId не передан');
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

        return data;
    }

    function openDeleteConfirmModal(testId) {
        const link = tournamentLinks.find(item => String(item.testId || item.id || '') === String(testId));

        if (!link) {
            showToast('Ссылка не найдена');
            return;
        }

        pendingDeleteTestId = String(testId || '');
        deleteConfirmCheckbox.checked = false;
        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = 'Удалить турнир';
        deleteConfirmModal.classList.add('open');
        deleteConfirmModal.setAttribute('aria-hidden', 'false');
    }

    function closeDeleteConfirmModal() {
        pendingDeleteTestId = '';
        deleteConfirmCheckbox.checked = false;
        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = 'Удалить турнир';
        deleteConfirmModal.classList.remove('open');
        deleteConfirmModal.setAttribute('aria-hidden', 'true');
    }

    async function confirmDeleteTournament() {
        if (!pendingDeleteTestId || !deleteConfirmCheckbox.checked) {
            return;
        }

        const testId = pendingDeleteTestId;

        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = 'Удаление...';

        try {
            await deleteTournamentFromCloud(testId);

            tournamentLinks = tournamentLinks.filter(item => String(item.testId || item.id || '') !== String(testId));
            closeDeleteConfirmModal();
            renderLinks();
            showToast('Турнир удалён');
        } catch (error) {
            console.error('Не удалось удалить турнир:', error);
            deleteConfirmBtn.disabled = false;
            deleteConfirmBtn.textContent = 'Удалить турнир';
            showToast(error.message || 'Не удалось удалить турнир');
        }
    }

    function updateSummary(visibleLinks) {
        totalCount.textContent = visibleLinks.length;
    }

    function getVisibleLinks() {
        return tournamentLinks;
    }

    function renderEmptyState() {
        linksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-title">У вас пока нет созданных ссылок</div>
                <div class="empty-text">Когда Вы создадите турнирную ссылку, она появится здесь.</div>
            </div>
        `;
    }

    function renderLoadingState() {
        linksList.innerHTML = `
            <div class="loading-state">
                <div class="loading-refresh-icon">↻</div>
                <div class="loading-title">Загружаем данные</div>
                <div class="loading-text">Пожалуйста, подождите. Список турнирных ссылок обновляется.</div>
            </div>
        `;
    }

    function renderLinks() {
        const visibleLinks = getVisibleLinks().sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        linksTitle.textContent = 'Список ссылок';
        linksSubtitle.textContent = 'Отображаются Ваши созданные турнирные ссылки.';

        updateSummary(visibleLinks);

        if (!visibleLinks.length) {
            renderEmptyState();
            return;
        }

        linksList.innerHTML = visibleLinks.map(link => {
            const games = Array.isArray(link.games) ? link.games : [];
            const gamesText = games.length ? games.join(', ') : (link.gameTitle || 'Не указано');
            const settingsText = link.settings || link.settingsSummary || 'Параметры будут подтягиваться из таблицы позже';
            const tasksText = link.tasksCount ? `${link.tasksCount} заданий` : 'Не указано';
            const tournamentTitle = buildTournamentTitle(link);
            const safeUrl = escapeHtml(link.url || '');

            return `
                <article class="link-card" data-link-id="${escapeHtml(link.id)}">
                    <div class="link-card-main">
                        <div>
                            <div class="tournament-title-row">
                                <div class="tournament-card-title">${escapeHtml(tournamentTitle)}</div>
                                <button class="title-edit-btn" type="button" data-edit-title-id="${escapeHtml(link.testId || link.id)}" title="Изменить название" aria-label="Изменить название">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 20h9"></path>
                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="created-by-label">Организатор</div>
                            <div class="organizer-name">${escapeHtml(link.organizerName || 'Организатор не указан')}</div>
                        </div>

                        <div>
                            <div class="link-label">Турнирная ссылка</div>
                            <div class="link-copy-row">
                                <div class="short-link" title="${safeUrl}">${escapeHtml(shortenUrl(link.url))}</div>
                                <button class="copy-btn" type="button" data-copy-url="${safeUrl}" title="Скопировать ссылку" aria-label="Скопировать ссылку">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div>
                            <div class="created-date-label">Дата создания</div>
                            <div class="created-date">${escapeHtml(formatDate(link.createdAt))}</div>
                        </div>
                    </div>

                    <div class="details-panel">
                        ${renderSettingsDetailsReport(link, { gamesText, tasksText, settingsText })}
                    </div>

                    <div class="card-actions-row">
                        <button class="details-btn" type="button">
                            Параметры ссылки <span class="details-arrow">▼</span>
                        </button>

                        <button class="details-btn download-table-btn" type="button" data-download-id="${escapeHtml(link.testId || link.id)}">
                            📥 Скачать таблицу
                        </button>

                        <button class="delete-btn" type="button" data-delete-id="${escapeHtml(link.testId || link.id)}" title="Удалить турнир" aria-label="Удалить турнир">
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                <path d="M10 11v6"></path>
                                <path d="M14 11v6"></path>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                            </svg>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function editTournamentTitle(testId) {
        const link = tournamentLinks.find(item => String(item.testId || item.id || '') === String(testId));

        if (!link) {
            showToast('Ссылка не найдена');
            return;
        }

        const currentTitle = buildTournamentTitle(link);
        const newTitle = prompt('Введите новое название турнира:', currentTitle);

        if (newTitle === null) return;

        const cleanTitle = String(newTitle || '').trim();

        if (!cleanTitle) {
            showToast('Название не может быть пустым');
            return;
        }

        if (cleanTitle.length > 120) {
            showToast('Название слишком длинное');
            return;
        }

        try {
            await saveTournamentTitleToCloud(testId, cleanTitle);

            link.title = cleanTitle;
            renderLinks();
            showToast('Название обновлено');
        } catch (error) {
            console.error('Не удалось обновить название:', error);
            showToast(error.message || 'Не удалось обновить название');
        }
    }

    async function refreshLinks() {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Загрузка...';
        renderLoadingState();

        try {
            const links = await loadTournamentLinksFromCloud();
            tournamentLinks = Array.isArray(links) ? links : [];
            renderLinks();
        } catch (error) {
            console.error('Ошибка загрузки турнирных ссылок:', error);
            tournamentLinks = [];
            renderLinks();
            showToast('Не удалось загрузить ссылки');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '↻ Обновить';
        }
    }


    function getInitials(nameOrLogin) {
        const raw = String(nameOrLogin || '').trim();

        if (!raw) return '👤';

        const parts = raw.split(/\s+/).filter(Boolean);

        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }

        if (raw.includes('@')) {
            return raw[0].toUpperCase();
        }

        return raw.slice(0, 2).toUpperCase();
    }

    function restoreOrganizerAuthFromLocalStorage() {
        const sessionAuth = sessionStorage.getItem('organizerAuth') === 'true';
        const sessionLogin = sessionStorage.getItem('organizerLogin');

        if (sessionAuth && sessionLogin) {
            return;
        }

        const rememberedAuth = localStorage.getItem('organizerAuth') === 'true';
        const rememberedLogin = localStorage.getItem('organizerLogin') || '';

        if (rememberedAuth && rememberedLogin) {
            sessionStorage.setItem('organizerAuth', 'true');
            sessionStorage.setItem('organizerLogin', rememberedLogin);
        }
    }

    function setupProfileMenu() {
        const profileMenu = document.getElementById('profileMenu');
        const profileButton = document.getElementById('profileButton');
        const profileDropdown = document.getElementById('profileDropdown');
        const organizerPanelBtn = document.getElementById('organizerPanelBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!profileMenu || !profileButton || !profileDropdown) return;

        profileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            profileDropdown.classList.toggle('open');
        });

        document.addEventListener('click', (event) => {
            if (!profileMenu.contains(event.target)) {
                profileDropdown.classList.remove('open');
            }
        });

        const organizerPanelPill = document.getElementById('organizerPanelPill');

        if (organizerPanelPill) {
            organizerPanelPill.addEventListener('click', () => {
                window.location.href = 'organizer.html';
            });
        }

        organizerPanelBtn.addEventListener('click', () => {
            window.location.href = 'organizer.html';
        });

        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('organizerAuth');
            sessionStorage.removeItem('organizerLogin');
            sessionStorage.removeItem('organizerName');
            sessionStorage.removeItem('organizerEmail');
            sessionStorage.removeItem('organizerRole');
            sessionStorage.removeItem('organizerId');

            localStorage.removeItem('organizerRemember');
            localStorage.removeItem('organizerAuth');
            localStorage.removeItem('organizerLogin');
            localStorage.removeItem('rememberOrganizerLogin');
            localStorage.removeItem('rememberOrganizerLoginValue');

            window.location.href = 'organizer_login.html';
        });
    }

    async function loadOrganizerProfileToMenu() {
        restoreOrganizerAuthFromLocalStorage();

        const login = sessionStorage.getItem('organizerLogin') || localStorage.getItem('organizerLogin') || '';
        const cachedName = sessionStorage.getItem('organizerName') || '';
        const cachedEmail = sessionStorage.getItem('organizerEmail') || '';

        const nameEl = document.getElementById('profileName');
        const loginEl = document.getElementById('profileLogin');
        const avatarEl = document.getElementById('profileAvatar');

        if (!nameEl || !loginEl || !avatarEl) return;

        if (!login) {
            nameEl.textContent = 'Организатор';
            loginEl.textContent = 'Вход не определён';
            avatarEl.textContent = '👤';
            return;
        }

        if (cachedName || cachedEmail) {
            const displayName = cachedName || login;
            const displayEmail = cachedEmail || login;

            nameEl.textContent = displayName;
            loginEl.textContent = displayEmail;
            avatarEl.textContent = getInitials(displayName);
            return;
        }

        nameEl.textContent = 'Загрузка профиля...';
        loginEl.textContent = login;
        avatarEl.textContent = getInitials(login);

        if (typeof getOrganizerProfile !== 'function') {
            nameEl.textContent = login;
            loginEl.textContent = 'Функция профиля не подключена';
            avatarEl.textContent = getInitials(login);
            return;
        }

        try {
            const profile = await getOrganizerProfile(login);

            const fullName = profile && profile.name
                ? profile.name
                : login;

            const profileLogin = profile && profile.login
                ? profile.login
                : login;

            const profileEmail = profile && profile.email
                ? profile.email
                : profileLogin;

            nameEl.textContent = fullName;
            loginEl.textContent = profileEmail;
            avatarEl.textContent = getInitials(fullName);

            sessionStorage.setItem('organizerAuth', 'true');
            sessionStorage.setItem('organizerLogin', profileLogin);
            sessionStorage.setItem('organizerName', fullName);
            sessionStorage.setItem('organizerEmail', profileEmail);

            if (profile && profile.role) {
                sessionStorage.setItem('organizerRole', profile.role);
            }

            if (profile && profile.organizerId) {
                sessionStorage.setItem('organizerId', profile.organizerId);
            }
        } catch (error) {
            console.warn('Не удалось загрузить профиль организатора:', error);

            nameEl.textContent = login;
            loginEl.textContent = 'Данные профиля не загружены';
            avatarEl.textContent = getInitials(login);
        }
    }

    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'organizer.html';
    });

    refreshBtn.addEventListener('click', refreshLinks);

    linksList.addEventListener('click', async (event) => {
        const copyBtn = event.target.closest('.copy-btn');
        const downloadBtn = event.target.closest('.download-table-btn');
        const detailsBtn = event.target.closest('.details-btn');
        const titleEditBtn = event.target.closest('.title-edit-btn');
        const deleteBtn = event.target.closest('.delete-btn');

        if (deleteBtn) {
            openDeleteConfirmModal(deleteBtn.dataset.deleteId || '');
            return;
        }

        if (downloadBtn) {
            downloadTestTable(downloadBtn.dataset.downloadId || '', downloadBtn);
            return;
        }

        if (titleEditBtn) {
            await editTournamentTitle(titleEditBtn.dataset.editTitleId || '');
            return;
        }

        if (copyBtn) {
            await copyText(copyBtn.dataset.copyUrl || '');
            copyBtn.classList.add('copied');
            setTimeout(() => copyBtn.classList.remove('copied'), 900);
            return;
        }

        if (detailsBtn) {
            const card = detailsBtn.closest('.link-card');
            card.classList.toggle('open');
        }
    });


    deleteConfirmCheckbox.addEventListener('change', () => {
        deleteConfirmBtn.disabled = !deleteConfirmCheckbox.checked;
    });

    deleteConfirmBtn.addEventListener('click', confirmDeleteTournament);
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

    setupProfileMenu();
    loadOrganizerProfileToMenu();
    refreshLinks();
