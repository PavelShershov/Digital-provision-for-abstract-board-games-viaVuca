ViaVucaPageScroll.keepPageAtTop();
ViaVucaParticles.create({ count: 45, maxOpacity: 0.38 });

localStorage.removeItem('globalBrushColor');
    localStorage.removeItem('globalBrushPosIndex');

    let lastTestGame = localStorage.getItem('lastTestGame');
    let currentMode = "train";

    const modeDescription = document.getElementById('modeDescription');
    const stickyModeSwitch = document.getElementById('stickyModeSwitch');
    const stickyTrainModeBtn = document.getElementById('stickyTrainModeBtn');
    const stickyTestModeBtn = document.getElementById('stickyTestModeBtn');
    const modePanel = document.querySelector('.mode-panel');
    const gamesGrid = document.getElementById('gamesGrid');
    const gamesCarouselControls = document.getElementById('gamesCarouselControls');
    const gamesCarouselDots = document.getElementById('gamesCarouselDots');
    const gamesCarouselPrevBtn = document.getElementById('gamesCarouselPrevBtn');
    const gamesCarouselNextBtn = document.getElementById('gamesCarouselNextBtn');
    const mobileBurgerMenu = document.getElementById('mobileBurgerMenu');
    const burgerMenuBtn = document.getElementById('burgerMenuBtn');
    const mobileArRulesBtn = document.getElementById('mobileArRulesBtn');
    const mobilePublisherSiteBtn = document.getElementById('mobilePublisherSiteBtn');

    let gamesCarouselPage = 0;
    let gamesCarouselAnimationDirection = 0;

    function clearAllTestSettings() {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);

            if (key && key.startsWith('testSetup_')) {
                localStorage.removeItem(key);
            }
        }

        localStorage.removeItem('mixedTestSetup');
    }

    document.getElementById('backButton').addEventListener('click', () => {
        if (currentMode === 'train') {
            window.location.href = 'welcome.html?mode=train';
        } else {
            window.location.href = 'welcome.html?mode=test';
        }
    });

    if (burgerMenuBtn) {
        burgerMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleMobileMenu();
        });
    }

    if (mobileBurgerMenu) {
        mobileBurgerMenu.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    if (mobileArRulesBtn) {
        mobileArRulesBtn.addEventListener('click', () => {
            closeMobileMenu();
            window.location.href = 'index3.html';
        });
    }

    if (mobilePublisherSiteBtn) {
        mobilePublisherSiteBtn.addEventListener('click', () => {
            closeMobileMenu();
            window.open('https://viavuca.com/', '_blank');
        });
    }

    document.addEventListener('click', closeMobileMenu);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
    });

    const games = [
        {
            name: "Алькерк",
            id: "alquerque",
            desc: "Древние шашки, рубка прыжком. Поле 5×5 с пересечениями.",
            available: true,
            image: "assets/img/alk.png",
            bgClass: "game-bg-alquerque"
        },
        {
            name: "Суракарта",
            id: "surakarta",
            desc: "Круглая доска, захват через дугу. Змеиная механика.",
            available: true,
            image: "assets/img/sura.png",
            bgClass: "game-bg-surakarta"
        },
        {
            name: "Фанорона",
            id: "fanorona",
            desc: "Тактическая игра на гексах с захватом линий.",
            available: true,
            image: "assets/img/fan.png",
            bgClass: "game-bg-fanorona"
        },
        {
            name: "Даблот",
            id: "dablot",
            desc: "Прыжки через свои фишки, цель — собрать все в центре.",
            available: true,
            image: "assets/img/dabl.png",
            bgClass: "game-bg-dablot"
        },
        {
            name: "Хнефатафл",
            id: "hnefatafl",
            desc: "Скандинавские тафлы: побег короля.",
            available: true,
            image: "assets/img/hnef.png",
            bgClass: "game-bg-hnefatafl"
        },
        {
            name: "Сиджа (7x7)",
            id: "sidja",
            desc: "Львы против собак, захват окружением.",
            available: true,
            image: "assets/img/sig.png",
            bgClass: "game-bg-sidja"
        },
        {
            name: "Реверси",
            id: "reversi",
            desc: "Классические перевороты фишек.",
            available: true,
            image: "assets/img/rev.png",
            bgClass: "game-bg-reversi"
        },
        {
            name: "Столбовые шашки",
            id: "stolbovye",
            desc: "Русские шашки на колоннах.",
            available: true,
            image: "assets/img/shash.png",
            bgClass: "game-bg-stolbovye"
        },
        {
            name: "🎲 Сборный тест",
            id: "mixed",
            desc: "Задачи из разных игр в случайном порядке.",
            available: true,
            image: "assets/logo/logo.svg",
            bgClass: "game-bg-mixed"
        }
    ];

    function updateModeDescription() {
        if (currentMode === 'train') {
            modeDescription.innerHTML = '🧠 Решайте задачи в своём темпе и тренируйте навыки';
        } else {
            modeDescription.innerHTML = '📋 Настраивайте тестирование под себя и проверьте знания';
        }
    }

    function showInfoMessage(msg) {
        const msgDiv = document.getElementById('infoMessage');

        msgDiv.textContent = msg;
        msgDiv.style.display = 'block';

        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    }

    function closeMobileMenu() {
        if (!mobileBurgerMenu || !burgerMenuBtn) return;

        mobileBurgerMenu.classList.remove('open');
        burgerMenuBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleMobileMenu() {
        if (!mobileBurgerMenu || !burgerMenuBtn) return;

        const isOpen = mobileBurgerMenu.classList.toggle('open');
        burgerMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function isTabletOrMobileMode() {
        return window.matchMedia && window.matchMedia('(max-width: 1000px)').matches;
    }

    function isGamesCarouselViewport() {
        if (!window.matchMedia) return false;

        const isNarrow = window.matchMedia('(max-width: 1000px)').matches;
        const isMobileWidth = window.matchMedia('(max-width: 700px)').matches;
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

        return isNarrow && (isMobileWidth || isTouchDevice);
    }

    function getCurrentModeGames() {
        return currentMode === 'train'
            ? games.filter(game => game.id !== 'mixed')
            : games;
    }

    function getGamesCarouselPageCount(totalGames) {
        return Math.max(1, Math.ceil(totalGames / 3));
    }

    function getDisplayedGamesForCurrentView(allGames) {
        if (!isGamesCarouselViewport()) {
            return allGames;
        }

        const pageCount = getGamesCarouselPageCount(allGames.length);
        gamesCarouselPage = Math.max(0, Math.min(gamesCarouselPage, pageCount - 1));

        const start = gamesCarouselPage * 3;
        return allGames.slice(start, start + 3);
    }

    function updateGamesViewControls(totalGames) {
        const isCarousel = isGamesCarouselViewport();
        const pageCount = getGamesCarouselPageCount(totalGames);
        const shouldShowControls = isCarousel && pageCount > 1;

        document.body.classList.toggle('games-carousel-mode', isCarousel);

        if (gamesCarouselControls) {
            gamesCarouselControls.classList.toggle('visible', shouldShowControls);
        }

        if (gamesCarouselPrevBtn) {
            gamesCarouselPrevBtn.disabled = !shouldShowControls || gamesCarouselPage <= 0;
        }

        if (gamesCarouselNextBtn) {
            gamesCarouselNextBtn.disabled = !shouldShowControls || gamesCarouselPage >= pageCount - 1;
        }

        if (!gamesCarouselDots) return;

        if (!shouldShowControls) {
            gamesCarouselDots.innerHTML = '';
            return;
        }

        gamesCarouselDots.innerHTML = Array.from({ length: pageCount }, (_, index) => {
            const activeClass = index === gamesCarouselPage ? ' active' : '';
            return `<button class="games-carousel-dot${activeClass}" type="button" data-carousel-page="${index}" aria-label="Страница ${index + 1}"></button>`;
        }).join('');
    }

    function goToGamesCarouselPage(page) {
        const totalGames = getCurrentModeGames().length;
        const pageCount = getGamesCarouselPageCount(totalGames);
        const targetPage = Math.max(0, Math.min(page, pageCount - 1));

        if (targetPage === gamesCarouselPage) return;

        gamesCarouselAnimationDirection = targetPage > gamesCarouselPage ? 1 : -1;
        gamesCarouselPage = targetPage;
        renderGames();
    }

    function moveGamesCarouselPage(direction) {
        const totalGames = getCurrentModeGames().length;
        const pageCount = getGamesCarouselPageCount(totalGames);

        if (pageCount <= 1) return;

        const nextPage = Math.max(0, Math.min(gamesCarouselPage + direction, pageCount - 1));

        if (nextPage !== gamesCarouselPage) {
            gamesCarouselAnimationDirection = direction > 0 ? 1 : -1;
            gamesCarouselPage = nextPage;
            renderGames();
        }
    }

    function renderGames() {
        const grid = gamesGrid || document.getElementById('gamesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const allGames = getCurrentModeGames();
        const displayedGames = getDisplayedGamesForCurrentView(allGames);
        const isCarousel = isGamesCarouselViewport();

        grid.classList.toggle('carousel-active', isCarousel);
        grid.classList.remove('carousel-animate-next', 'carousel-animate-prev', 'carousel-animate-fade');

        if (isCarousel && gamesCarouselAnimationDirection) {
            const animationClass = gamesCarouselAnimationDirection > 1
                ? 'carousel-animate-fade'
                : gamesCarouselAnimationDirection > 0
                    ? 'carousel-animate-next'
                    : 'carousel-animate-prev';

            grid.classList.add(animationClass);

            window.setTimeout(() => {
                grid.classList.remove('carousel-animate-next', 'carousel-animate-prev', 'carousel-animate-fade');
            }, 430);

            gamesCarouselAnimationDirection = 0;
        }

        displayedGames.forEach(game => {
            const card = document.createElement('div');
            card.className = game.available ? 'game-card' : 'game-card unavailable';

            if (game.image) {
                card.classList.add('has-image');
                card.style.setProperty('--game-bg-image', `url("${game.image}")`);
            }

            if (game.bgClass) {
                card.classList.add(game.bgClass);
            }

            const badgeClass = game.available ? 'game-badge' : 'game-badge unavailable';
            const badgeText = game.available ? 'Доступно' : 'Скоро';
            const actionText = game.available
                ? (currentMode === 'train' ? 'Перейти к тренировке →' : 'Настроить тест →')
                : 'В разработке';

            card.innerHTML = `
                <div class="game-top">
                    <div class="game-title">${game.name}</div>
                    <div class="${badgeClass}">${badgeText}</div>
                </div>

                <div class="game-desc">${game.desc}</div>

                <div class="game-action">${actionText}</div>
            `;

            card.addEventListener('click', (e) => {
                e.stopPropagation();

                if (!game.available) {
                    showInfoMessage(`Игра «${game.name}» пока в разработке. Следите за обновлениями!`);
                    return;
                }

                if (currentMode === 'train') {
                    window.location.href = `game.html?game=${game.id}`;
                } else {
                    if (lastTestGame === game.id) {
                        window.location.href = `test_setup.html?game=${game.id}`;
                    } else {
                        localStorage.setItem('lastTestGame', game.id);
                        window.location.href = `test_setup.html?game=${game.id}&reset=1`;
                    }
                }
            });

            grid.appendChild(card);
        });

        updateGamesViewControls(allGames.length);
    }


    function syncStickyModeButtons() {
        if (!stickyTrainModeBtn || !stickyTestModeBtn) return;

        if (currentMode === 'train') {
            stickyTrainModeBtn.classList.add('active');
            stickyTrainModeBtn.classList.remove('test-active');

            stickyTestModeBtn.classList.remove('active');
            stickyTestModeBtn.classList.remove('test-active');
        } else {
            stickyTrainModeBtn.classList.remove('active');
            stickyTrainModeBtn.classList.remove('test-active');

            stickyTestModeBtn.classList.add('active');
            stickyTestModeBtn.classList.add('test-active');
        }
    }

    function updateStickyModeVisibility() {
        if (!stickyModeSwitch || !modePanel) return;

        if (!isTabletOrMobileMode()) {
            stickyModeSwitch.classList.remove('visible');
            stickyModeSwitch.setAttribute('aria-hidden', 'true');
            return;
        }

        const panelRect = modePanel.getBoundingClientRect();
        const shouldShow = panelRect.bottom <= 0;

        stickyModeSwitch.classList.toggle('visible', shouldShow);
        stickyModeSwitch.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }

    function setBodyMode(mode) {
        const body = document.body;

        if (mode === 'train') {
            body.classList.remove('mode-test');
            body.classList.add('mode-train');
        } else {
            body.classList.remove('mode-train');
            body.classList.add('mode-test');
        }

        updateModeDescription();
    }

    function saveCurrentModeToUrl(mode) {
        const newUrl = `${window.location.pathname}?mode=${mode}`;
        window.history.replaceState(null, '', newUrl);
    }

    function setActiveMode(mode, showMessage = true) {
        const trainBtn = document.getElementById('trainModeBtn');
        const testBtn = document.getElementById('testModeBtn');

        currentMode = mode;

        localStorage.setItem('gameSelectMode', mode);
        saveCurrentModeToUrl(mode);
        gamesCarouselPage = 0;

        if (mode === 'train') {
            trainBtn.classList.add('active');
            trainBtn.classList.remove('test-active');

            testBtn.classList.remove('active');
            testBtn.classList.remove('test-active');

            if (showMessage) {
                showInfoMessage('Вы переключились в РЕЖИМ ТРЕНИРОВКИ');
            }

            setBodyMode('train');
            clearAllTestSettings();
            localStorage.removeItem('lastTestGame');
            lastTestGame = null;

            renderGames();
        } else {
            trainBtn.classList.remove('active');
            trainBtn.classList.remove('test-active');

            testBtn.classList.add('active');
            testBtn.classList.add('test-active');

            if (showMessage) {
                showInfoMessage('Вы переключились в РЕЖИМ ТЕСТИРОВАНИЯ');
            }

            localStorage.removeItem('globalBrushColor');
            localStorage.removeItem('globalBrushPosIndex');

            setBodyMode('test');
            renderGames();
        }

        syncStickyModeButtons();
        requestAnimationFrame(updateStickyModeVisibility);
    }

    document.getElementById('trainModeBtn').addEventListener('click', () => {
        setActiveMode('train', true);
    });

    document.getElementById('testModeBtn').addEventListener('click', () => {
        setActiveMode('test', true);
    });

    if (stickyTrainModeBtn) {
        stickyTrainModeBtn.addEventListener('click', () => {
            setActiveMode('train', true);
        });
    }

    if (stickyTestModeBtn) {
        stickyTestModeBtn.addEventListener('click', () => {
            setActiveMode('test', true);
        });
    }

    if (gamesCarouselDots) {
        gamesCarouselDots.addEventListener('click', (event) => {
            const dot = event.target.closest('[data-carousel-page]');

            if (!dot) return;

            goToGamesCarouselPage(Number(dot.dataset.carouselPage || 0));
        });
    }

    if (gamesCarouselPrevBtn) {
        gamesCarouselPrevBtn.addEventListener('click', () => {
            moveGamesCarouselPage(-1);
        });
    }

    if (gamesCarouselNextBtn) {
        gamesCarouselNextBtn.addEventListener('click', () => {
            moveGamesCarouselPage(1);
        });
    }

    let gamesTouchStartX = 0;
    let gamesTouchStartY = 0;

    if (gamesGrid) {
        gamesGrid.addEventListener('touchstart', (event) => {
            if (!isGamesCarouselViewport()) return;

            const touch = event.touches[0];
            gamesTouchStartX = touch.clientX;
            gamesTouchStartY = touch.clientY;
        }, { passive: true });

        gamesGrid.addEventListener('touchend', (event) => {
            if (!isGamesCarouselViewport()) return;
            if (!event.changedTouches || !event.changedTouches.length) return;

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - gamesTouchStartX;
            const deltaY = touch.clientY - gamesTouchStartY;

            if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

            if (deltaX < 0) {
                moveGamesCarouselPage(1);
            } else {
                moveGamesCarouselPage(-1);
            }
        }, { passive: true });
    }

    window.addEventListener('scroll', updateStickyModeVisibility, { passive: true });
    window.addEventListener('resize', () => {
        updateStickyModeVisibility();
        renderGames();

        if (!isTabletOrMobileMode()) {
            closeMobileMenu();
        }
    });
    window.addEventListener('load', () => {
        updateStickyModeVisibility();
        renderGames();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const savedPageMode = localStorage.getItem('gameSelectMode');
    const savedMode = localStorage.getItem('lastMode');

    if (savedPageMode === 'train' || savedPageMode === 'test') {
        setActiveMode(savedPageMode, false);
    } else if (modeParam === 'train' || modeParam === 'test') {
        setActiveMode(modeParam, false);
    } else if (savedMode === 'train' || savedMode === 'test') {
        setActiveMode(savedMode, false);
        localStorage.removeItem('lastMode');
    } else {
        setActiveMode('train', false);
    }

    renderGames();
    updateModeDescription();
    syncStickyModeButtons();
    requestAnimationFrame(updateStickyModeVisibility);
