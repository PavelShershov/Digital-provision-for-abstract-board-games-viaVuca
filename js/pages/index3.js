ViaVucaPageScroll.disableScrollRestoration();
ViaVucaParticles.create({ count: (window.matchMedia && window.matchMedia('(max-width: 860px)').matches) ? 0 : 45, maxOpacity: 0.38 });

const GAMES = [
    {
      id: 'fan',
      title: 'Фанорона',
      subtitle: 'Тактическая игра с захватом линий',
      desc: 'Анимированная партия показывает развитие позиции, атаки и захваты фигур по линиям.',
      file: 'assets/models/fan.glb',
      image: 'assets/img/fan.png',
      duration: 45,
      chapters: [
        { time: 0, label: 'Начальная позиция', desc: 'Положение фигур перед началом демонстрации.' },
        { time: 7, label: 'Первые ходы', desc: 'Фигуры начинают занимать активные линии.' },
        { time: 15, label: 'Первый захват', desc: 'Показан базовый принцип рубки.' },
        { time: 26, label: 'Серия взятий', desc: 'Один ход приводит к нескольким тактическим последствиям.' },
        { time: 38, label: 'Финальный момент', desc: 'Позиция после ключевой атаки.' }
      ]
    },
    {
      id: 'siga',
      title: 'Сиджа',
      subtitle: 'Львы против собак на поле 7×7',
      desc: 'Короткая партия демонстрирует движение, окружение и типовые игровые угрозы.',
      file: 'assets/models/siga.glb',
      image: 'assets/img/sig.png',
      duration: 42,
      chapters: [
        { time: 0, label: 'Расстановка', desc: 'Начальная конфигурация сил на доске.' },
        { time: 8, label: 'Выход фигур', desc: 'Первые перемещения и подготовка атаки.' },
        { time: 16, label: 'Окружение', desc: 'Показана идея захвата через контроль соседних клеток.' },
        { time: 28, label: 'Ответный манёвр', desc: 'Защитная перестройка позиции.' },
        { time: 36, label: 'Итог позиции', desc: 'Финальное положение после серии ходов.' }
      ]
    },
    {
      id: 'hnef',
      title: 'Хнефатафл',
      subtitle: 'Побег короля и блокировка проходов',
      desc: 'Демонстрация партии с атакующими, защитниками и задачей вывести короля к краю.',
      file: 'assets/models/hnef.glb',
      image: 'assets/img/hnef.png',
      duration: 50,
      chapters: [
        { time: 0, label: 'Стартовая позиция', desc: 'Король находится в центре, атакующие окружают поле.' },
        { time: 9, label: 'Создание коридора', desc: 'Защитники открывают направление для выхода.' },
        { time: 20, label: 'Блокировка', desc: 'Атакующие перекрывают ключевые линии.' },
        { time: 32, label: 'Рубка фигуры', desc: 'Показан принцип захвата зажатой фигуры.' },
        { time: 43, label: 'Попытка побега', desc: 'Король приближается к спасительной зоне.' }
      ]
    },
    {
      id: 'dabl',
      title: 'Даблот',
      subtitle: 'Прыжки, продвижение и борьба за центр',
      desc: 'Модель показывает динамику перемещений и ключевые моменты партии на доске.',
      file: 'assets/models/dabl.glb',
      image: 'assets/img/dabl.png',
      duration: 40,
      chapters: [
        { time: 0, label: 'Начало', desc: 'Положение фигур перед первым ходом.' },
        { time: 6, label: 'Продвижение', desc: 'Фигуры начинают занимать центральные линии.' },
        { time: 14, label: 'Прыжок', desc: 'Показана механика перескока.' },
        { time: 25, label: 'Центральная борьба', desc: 'Ключевой тактический момент партии.' },
        { time: 34, label: 'Завершение сцены', desc: 'Финальная демонстрационная позиция.' }
      ]
    },
    {
      id: 'akl',
      title: 'Алькерк',
      subtitle: 'Древние шашки на поле 5×5',
      desc: 'Партия показывает обычные ходы, рубку прыжком и развитие позиции.',
      file: 'assets/models/alk.glb',
      image: 'assets/img/alk.png',
      duration: 38,
      chapters: [
        { time: 0, label: 'Расстановка', desc: 'Фигуры стоят на пересечениях поля 5×5.' },
        { time: 6, label: 'Первый ход', desc: 'Показано базовое перемещение фигуры.' },
        { time: 13, label: 'Рубка прыжком', desc: 'Фигура перепрыгивает через противника.' },
        { time: 24, label: 'Тактический обмен', desc: 'Последовательность ходов меняет баланс сил.' },
        { time: 32, label: 'Финальная позиция', desc: 'Итоговый учебный момент.' }
      ]
    },
    {
      id: 'surk',
      title: 'Суракарта',
      subtitle: 'Захват через дугу и круговые линии',
      desc: 'Демонстрация показывает необычную механику захвата через внешние дуги доски.',
      file: 'assets/models/surk.glb',
      image: 'assets/img/sura.png',
      duration: 44,
      chapters: [
        { time: 0, label: 'Начальное положение', desc: 'Фигуры расположены перед началом партии.' },
        { time: 7, label: 'Обычный ход', desc: 'Фигура перемещается по линиям доски.' },
        { time: 16, label: 'Выход на дугу', desc: 'Показана подготовка к захвату через круговую линию.' },
        { time: 27, label: 'Захват через дугу', desc: 'Главный отличительный приём Суракарты.' },
        { time: 37, label: 'Итог', desc: 'Позиция после ключевого захвата.' }
      ]
    }
  ];

  const selectScreen = document.getElementById('selectScreen');
  const playerScreen = document.getElementById('playerScreen');
  const selectorGrid = document.getElementById('selectorGrid');
  const gamesCarouselControls = document.getElementById('gamesCarouselControls');
  const gamesCarouselDots = document.getElementById('gamesCarouselDots');
  const gamesCarouselPrevBtn = document.getElementById('gamesCarouselPrevBtn');
  const gamesCarouselNextBtn = document.getElementById('gamesCarouselNextBtn');
  const mobileCameraBtn = document.getElementById('mobileCameraBtn');
  const CAMERA_MODE_URL = 'ar-camera.html';
  function getQrModalElements() {
    return {
      desktopQrModal: document.getElementById('desktopQrModal'),
      qrCloseBtn: document.getElementById('qrCloseBtn'),
      qrCodeImg: document.getElementById('qrCodeImg'),
      qrDirectLink: document.getElementById('qrDirectLink'),
      qrUrlText: document.getElementById('qrUrlText')
    };
  }
  const backToGamesBtn = document.getElementById('backToGamesBtn');
  const chooseAnotherBtn = document.getElementById('chooseAnotherBtn');
  const mainBackBtn = document.getElementById('mainBackBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const mobileBurgerMenu = document.getElementById('mobileBurgerMenu');
  const burgerMenuBtn = document.getElementById('burgerMenuBtn');
  const mobileTrainerBtn = document.getElementById('mobileTrainerBtn');
  const mobilePublisherSiteBtn = document.getElementById('mobilePublisherSiteBtn');
  const mobileThemeBtn = document.getElementById('mobileThemeBtn');
  const mobileThemeIcon = document.getElementById('mobileThemeIcon');
  const mobileThemeLabel = document.getElementById('mobileThemeLabel');
  const pageTitle = document.getElementById('pageTitle');
  const pageLead = document.getElementById('pageLead');
  const activeGameTitle = document.getElementById('activeGameTitle');
  const activeGameDesc = document.getElementById('activeGameDesc');
  const viewer = document.getElementById('mainViewer');
  const viewerBox = document.getElementById('viewerBox');
  const playerPanel = document.getElementById('playerPanel');
  const viewerPlaceholder = document.getElementById('viewerPlaceholder');
  const viewerError = document.getElementById('viewerError');
  const viewerWatermark = document.getElementById('viewerWatermark');
  const arBtn = document.getElementById('arBtn');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const rewindBtn = document.getElementById('rewindBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const resetViewBtn = document.getElementById('resetViewBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const speedSelect = document.getElementById('speedSelect');
  const loopToggleBtn = document.getElementById('loopToggleBtn');
  const timelineInput = document.getElementById('timelineInput');
  const currentTimeLabel = document.getElementById('currentTimeLabel');
  const durationLabel = document.getElementById('durationLabel');
  const chaptersList = document.getElementById('chaptersList');
  const viewerChaptersToggle = document.getElementById('viewerChaptersToggle');
  const viewerChaptersPanel = document.getElementById('viewerChaptersPanel');
  const viewerChaptersMiniList = document.getElementById('viewerChaptersMiniList');
  const toast = document.getElementById('toast');

  let activeGame = null;
  let activeDuration = 0;
  let isPlaying = true;
  let isUserScrubbing = false;
  let toastTimer = null;
  let isAnimationLoopEnabled = true;
  let gamesCarouselPage = 0;
  let gamesCarouselAnimationDirection = 0;
  let gamesTouchStartX = 0;
  let gamesTouchStartY = 0;

  function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';

    if (toastTimer) clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  }

  function setViewerChaptersMenuOpen(isOpen) {
    if (!viewerChaptersToggle || !viewerChaptersPanel) return;

    viewerChaptersToggle.classList.toggle('open', !!isOpen);
    viewerChaptersPanel.classList.toggle('open', !!isOpen);
    viewerChaptersToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    viewerChaptersPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  function closeViewerChaptersMenu() {
    setViewerChaptersMenuOpen(false);
  }

  function toggleViewerChaptersMenu() {
    const isOpen = !!(viewerChaptersPanel && viewerChaptersPanel.classList.contains('open'));
    setViewerChaptersMenuOpen(!isOpen);
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function isPlayerFullscreenActive() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    return !!(
      fullscreenElement &&
      playerPanel &&
      (fullscreenElement === playerPanel || playerPanel.contains(fullscreenElement))
    );
  }

  function isCompactControlsMode() {
    if (isPlayerFullscreenActive()) return false;

    return window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
  }

  const ICON_REWIND = `
    <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M11 7L4 12l7 5V7Z"></path>
      <path d="M20 7l-7 5 7 5V7Z"></path>
    </svg>
  `;

  const ICON_FORWARD = `
    <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7l7 5-7 5V7Z"></path>
      <path d="M13 7l7 5-7 5V7Z"></path>
    </svg>
  `;

  const ICON_LOOP_ON = `
    <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17 2l4 4-4 4"></path>
      <path d="M3 11V8a2 2 0 0 1 2-2h16"></path>
      <path d="M7 22l-4-4 4-4"></path>
      <path d="M21 13v3a2 2 0 0 1-2 2H3"></path>
    </svg>
  `;

  const ICON_LOOP_OFF = `
    <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12h13"></path>
      <path d="M13 8l4 4-4 4"></path>
      <path d="M5 5l14 14"></path>
    </svg>
  `;

  function renderControlIconButton(button, icon, label, compact, iconAfter = false) {
    if (!button) return;

    if (compact || !label) {
      button.innerHTML = icon;
      return;
    }

    const labelHtml = `<span class="control-label">${label}</span>`;
    button.innerHTML = iconAfter ? `${labelHtml}${icon}` : `${icon}${labelHtml}`;
  }

  function setPlayPauseButtonLabel(playing) {
    if (!playPauseBtn) return;

    playPauseBtn.textContent = isCompactControlsMode()
      ? (playing ? '⏸' : '▶')
      : (playing ? '⏸ Пауза' : '▶ Играть');
  }

  function syncCompactControlLabels() {
    const compact = isCompactControlsMode();

    renderControlIconButton(rewindBtn, ICON_REWIND, '-5 c', compact);
    renderControlIconButton(forwardBtn, ICON_FORWARD, '+5 c', compact, true);
    setPlayPauseButtonLabel(isPlaying);
    updateLoopToggleButton();
  }

  function updateLoopToggleButton() {
    if (!loopToggleBtn) return;

    loopToggleBtn.innerHTML = isAnimationLoopEnabled ? ICON_LOOP_ON : ICON_LOOP_OFF;
    loopToggleBtn.classList.toggle('active-loop', isAnimationLoopEnabled);
    loopToggleBtn.setAttribute('aria-label', isAnimationLoopEnabled ? 'Зацикливание включено' : 'Зацикливание выключено');
    loopToggleBtn.setAttribute('title', isAnimationLoopEnabled ? 'Зацикливание включено' : 'Зацикливание выключено');
  }

  function toggleAnimationLoop() {
    isAnimationLoopEnabled = !isAnimationLoopEnabled;
    updateLoopToggleButton();
  }

  function handleAnimationLoopState() {
    if (!activeGame || isUserScrubbing) return;

    const duration = getViewerDuration();
    const currentTime = Number(viewer.currentTime) || 0;

    if (!duration || currentTime < duration - 0.08) return;

    if (isAnimationLoopEnabled) {
      viewer.currentTime = 0;
      updateTimeline(true);

      if (isPlaying) {
        playAnimation();
      }
    } else if (isPlaying) {
      viewer.currentTime = duration;
      updateTimeline(true);
      pauseAnimation();
    }
  }

  function getViewerDuration() {
    const viewerDuration = Number(viewer.duration);

    if (Number.isFinite(viewerDuration) && viewerDuration > 0) {
      return viewerDuration;
    }

    return activeGame ? Number(activeGame.duration || 0) : 0;
  }

  function resolveModelSrc(file) {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      return new URL(file, location.href).href;
    }

    return file;
  }


  const MODEL_CACHE_NAME = 'viavuca-3d-models-v1';
  const preloadedModels = new Map();
  let backgroundPreloadController = null;
  let backgroundPreloadPaused = false;
  let backgroundPreloadRunning = false;
  let backgroundPreloadTimer = null;

  function canUsePersistentCache() {
    return 'caches' in window && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }

  async function registerModelCacheWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;

    try {
      await navigator.serviceWorker.register('viavuca-3d-sw.js');
      console.log('[3D cache] service worker registered');
    } catch (error) {
      console.warn('[3D cache] service worker registration failed:', error);
    }
  }

  function getCacheStatusEl(gameId) {
    return document.querySelector(`[data-cache-status="${gameId}"]`);
  }

  function setCacheStatus(gameId, status, label) {
    const el = getCacheStatusEl(gameId);
    if (!el) return;

    el.classList.remove('is-loading', 'is-cached', 'is-error');

    if (status === 'loading') el.classList.add('is-loading');
    if (status === 'cached') el.classList.add('is-cached');
    if (status === 'error') el.classList.add('is-error');

    el.textContent = label;
  }

  function getCachedModelUrl(game) {
    return preloadedModels.get(game.id) || null;
  }

  async function isModelCached(game) {
    if (!canUsePersistentCache()) return false;

    try {
      const cache = await caches.open(MODEL_CACHE_NAME);
      const cached = await cache.match(resolveModelSrc(game.file));
      return !!cached;
    } catch (error) {
      console.warn('[3D cache] cache check failed:', error);
      return false;
    }
  }

  async function refreshCacheStatuses() {
    for (const game of GAMES) {
      if (preloadedModels.has(game.id) || await isModelCached(game)) {
        setCacheStatus(game.id, 'cached', 'кэш: готово');
      } else {
        setCacheStatus(game.id, 'idle', 'кэш: ожидание');
      }
    }
  }

  async function fetchAndCacheModel(game, { signal, priority = false } = {}) {
    const src = resolveModelSrc(game.file);

    if (preloadedModels.has(game.id)) {
      setCacheStatus(game.id, 'cached', 'кэш: готово');
      return preloadedModels.get(game.id);
    }

    if (canUsePersistentCache()) {
      try {
        const cache = await caches.open(MODEL_CACHE_NAME);
        const cached = await cache.match(src);

        if (cached) {
          setCacheStatus(game.id, 'cached', 'кэш: готово');
          return src;
        }
      } catch (error) {
        console.warn('[3D cache] cache read failed:', error);
      }
    }

    setCacheStatus(game.id, 'loading', priority ? 'кэш: приоритет' : 'кэш: загрузка');

    const response = await fetch(src, {
      signal,
      cache: 'force-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${src}`);
    }

    if (canUsePersistentCache()) {
      try {
        const cache = await caches.open(MODEL_CACHE_NAME);
        await cache.put(src, response.clone());
      } catch (error) {
        console.warn('[3D cache] cache put failed:', error);
      }
    }

    preloadedModels.set(game.id, src);
    setCacheStatus(game.id, 'cached', 'кэш: готово');
    return src;
  }

  function stopBackgroundPreload() {
    backgroundPreloadPaused = true;

    if (backgroundPreloadTimer) {
      clearTimeout(backgroundPreloadTimer);
      backgroundPreloadTimer = null;
    }

    if (backgroundPreloadController) {
      backgroundPreloadController.abort();
      backgroundPreloadController = null;
    }
  }

  function resumeBackgroundPreload(delay = 900) {
    backgroundPreloadPaused = false;

    if (backgroundPreloadTimer) {
      clearTimeout(backgroundPreloadTimer);
    }

    backgroundPreloadTimer = setTimeout(() => {
      backgroundPreloadTimer = null;
      startBackgroundPreload();
    }, delay);
  }

  async function startBackgroundPreload() {
    if (backgroundPreloadRunning || backgroundPreloadPaused) return;

    backgroundPreloadRunning = true;

    try {
      for (const game of GAMES) {
        if (backgroundPreloadPaused) break;
        if (activeGame && game.id === activeGame.id) continue;
        if (await isModelCached(game)) {
          setCacheStatus(game.id, 'cached', 'кэш: готово');
          continue;
        }

        backgroundPreloadController = new AbortController();

        try {
          await fetchAndCacheModel(game, {
            signal: backgroundPreloadController.signal,
            priority: false
          });
        } catch (error) {
          if (error && error.name === 'AbortError') {
            break;
          }

          console.warn('[3D cache] background preload failed:', game.file, error);
          setCacheStatus(game.id, 'error', 'кэш: ошибка');
        } finally {
          backgroundPreloadController = null;
        }

        await new Promise(resolve => setTimeout(resolve, 750));
      }
    } finally {
      backgroundPreloadRunning = false;
    }
  }

  async function ensurePriorityModelLoaded(game) {
    stopBackgroundPreload();
    viewerPlaceholder.textContent = `Приоритетная загрузка: ${game.title}…`;

    const priorityController = new AbortController();

    try {
      await fetchAndCacheModel(game, {
        signal: priorityController.signal,
        priority: true
      });
    } catch (error) {
      if (error && error.name !== 'AbortError') {
        console.warn('[3D cache] priority preload failed:', game.file, error);
        setCacheStatus(game.id, 'error', 'кэш: ошибка');
      }
    }

    return getCachedModelUrl(game) || resolveModelSrc(game.file);
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);

    if (themeToggleBtn) {
      themeToggleBtn.textContent = isDark ? '☀️ Светлая тема' : '🌙 Тёмная тема';
    }

    if (mobileThemeIcon) {
      mobileThemeIcon.textContent = isDark ? '☀️' : '🌙';
    }

    if (mobileThemeLabel) {
      mobileThemeLabel.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    }

    localStorage.setItem('viavuca3dTheme', isDark ? 'dark' : 'light');
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

  function toggleThemeFromMenu() {
    const isDark = document.body.classList.contains('dark-theme');
    applyTheme(isDark ? 'light' : 'dark');
  }

  function isGamesCarouselViewport() {
    if (!window.matchMedia) return false;

    const isNarrow = window.matchMedia('(max-width: 1080px)').matches;
    const isMobileWidth = window.matchMedia('(max-width: 760px)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    return isNarrow && (isMobileWidth || isTouchDevice);
  }

  function getGamesCarouselPageCount(totalGames) {
    return Math.max(1, Math.ceil(totalGames / 3));
  }

  function getDisplayedGamesForCurrentView(allGames) {
    if (!isGamesCarouselViewport()) return allGames;

    const pageCount = getGamesCarouselPageCount(allGames.length);
    gamesCarouselPage = Math.max(0, Math.min(gamesCarouselPage, pageCount - 1));

    const start = gamesCarouselPage * 3;
    return allGames.slice(start, start + 3);
  }

  function updateGamesViewControls(totalGames) {
    const isCarousel = isGamesCarouselViewport();
    const pageCount = getGamesCarouselPageCount(totalGames);
    const shouldShowControls = isCarousel && pageCount > 1;

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
    const pageCount = getGamesCarouselPageCount(GAMES.length);
    const targetPage = Math.max(0, Math.min(Number(page) || 0, pageCount - 1));

    if (targetPage === gamesCarouselPage) return;

    gamesCarouselAnimationDirection = targetPage > gamesCarouselPage ? 1 : -1;
    gamesCarouselPage = targetPage;
    renderGameSelector();
  }

  function moveGamesCarouselPage(direction) {
    const pageCount = getGamesCarouselPageCount(GAMES.length);
    if (pageCount <= 1) return;

    const nextPage = Math.max(0, Math.min(gamesCarouselPage + direction, pageCount - 1));

    if (nextPage !== gamesCarouselPage) {
      gamesCarouselAnimationDirection = direction > 0 ? 1 : -1;
      gamesCarouselPage = nextPage;
      renderGameSelector();
    }
  }

  function renderGameSelector() {
    selectorGrid.innerHTML = '';

    const displayedGames = getDisplayedGamesForCurrentView(GAMES);
    const isCarousel = isGamesCarouselViewport();

    selectorGrid.classList.toggle('carousel-active', isCarousel);
    selectorGrid.classList.remove('carousel-animate-next', 'carousel-animate-prev', 'carousel-animate-fade');

    if (isCarousel && gamesCarouselAnimationDirection) {
      const animationClass = gamesCarouselAnimationDirection > 1
        ? 'carousel-animate-fade'
        : gamesCarouselAnimationDirection > 0
          ? 'carousel-animate-next'
          : 'carousel-animate-prev';

      selectorGrid.classList.add(animationClass);

      window.setTimeout(() => {
        selectorGrid.classList.remove('carousel-animate-next', 'carousel-animate-prev', 'carousel-animate-fade');
      }, 430);

      gamesCarouselAnimationDirection = 0;
    }

    displayedGames.forEach(game => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'game-card has-image';
      card.style.setProperty('--game-bg-image', `url("${game.image}")`);
      card.innerHTML = `
        <div class="game-card-content">
          <div class="game-top">
            <div class="game-title">${game.title}</div>
            <div class="game-badge">3D</div>
          </div>
          <div class="game-desc">${game.subtitle}</div>
          <div class="game-meta">
            <span class="meta-pill">▶ партия</span>
            <span class="meta-pill">▣ AR</span>
            <span class="meta-pill">⏱ тайм-коды</span>
          </div>
          <div class="game-action">Открыть плеер →</div>
        </div>
      `;

      card.addEventListener('click', () => {
        openGame(game.id, true);
      });

      selectorGrid.appendChild(card);
    });

    updateGamesViewControls(GAMES.length);
    refreshCacheStatuses();
  }

  function renderChapters(game) {
    chaptersList.innerHTML = '';

    if (viewerChaptersMiniList) {
      viewerChaptersMiniList.innerHTML = '';
    }

    game.chapters.forEach((chapter, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chapter-btn';
      btn.dataset.time = String(chapter.time);
      btn.dataset.index = String(index);
      btn.innerHTML = `
        <span class="chapter-time">${formatTime(chapter.time)}</span>
        <span class="chapter-label">${chapter.label}</span>
        <span class="chapter-desc">${chapter.desc || ''}</span>
      `;

      btn.addEventListener('click', () => {
        jumpToTime(chapter.time, false);
      });

      chaptersList.appendChild(btn);

      if (viewerChaptersMiniList) {
        const miniBtn = document.createElement('button');
        miniBtn.type = 'button';
        miniBtn.className = 'viewer-mini-chapter-btn';
        miniBtn.dataset.time = String(chapter.time);
        miniBtn.dataset.index = String(index);
        miniBtn.title = chapter.desc || chapter.label;
        miniBtn.innerHTML = `
          <span class="viewer-mini-chapter-time">${formatTime(chapter.time)}</span>
          <span class="viewer-mini-chapter-label">${chapter.label}</span>
        `;

        miniBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          jumpToTime(chapter.time, false);
          closeViewerChaptersMenu();
        });

        viewerChaptersMiniList.appendChild(miniBtn);
      }
    });
  }

  function showSelectScreen(updateUrl = true) {
    pauseAnimation();
    activeGame = null;
    closeViewerChaptersMenu();
    resumeBackgroundPreload(600);

    selectScreen.classList.add('active');
    playerScreen.classList.remove('active');
    document.body.classList.remove('player-mode');
    mainBackBtn.textContent = '← На главную';
    mainBackBtn.setAttribute('aria-label', 'На главную');
    backToGamesBtn.classList.add('is-hidden');

    pageTitle.textContent = 'Выберите игру';
    pageLead.textContent = 'Сначала выберите настольную игру, а затем откройте большой 3D-плеер с анимацией партии, тайм-кодами, перемоткой и AR-просмотром.';

    viewer.removeAttribute('src');
    viewerError.classList.remove('visible');
    viewerPlaceholder.textContent = 'Выбранная 3D-модель загружается…';
    viewerPlaceholder.style.display = 'flex';
    currentTimeLabel.textContent = '00:00';
    durationLabel.textContent = '00:00';
    timelineInput.value = '0';

    if (updateUrl) {
      history.replaceState(null, '', location.pathname);
    }
  }

  async function openGame(gameId, updateUrl = true) {
    const game = GAMES.find(item => item.id === gameId) || GAMES[0];
    activeGame = game;
    closeViewerChaptersMenu();
    activeDuration = Number(game.duration || 0);
    isPlaying = true;

    stopBackgroundPreload();

    selectScreen.classList.remove('active');
    playerScreen.classList.add('active');
    document.body.classList.add('player-mode');
    mainBackBtn.textContent = '← К выбору игр';
    mainBackBtn.setAttribute('aria-label', 'К выбору игр');
    backToGamesBtn.classList.add('is-hidden');

    pageTitle.textContent = game.title;
    pageLead.textContent = game.subtitle;
    activeGameTitle.textContent = game.title;
    activeGameDesc.textContent = game.desc;
    viewerWatermark.textContent = `viaVUCA · ${game.title}`;

    viewerError.classList.remove('visible');
    viewerPlaceholder.textContent = `Приоритетная загрузка: ${game.title}…`;
    viewerPlaceholder.style.display = 'flex';

    renderChapters(game);

    viewer.removeAttribute('src');
    viewer.setAttribute('alt', game.title);
    viewer.setAttribute('camera-orbit', '0deg 65deg auto');
    viewer.setAttribute('min-camera-orbit', 'auto 0deg auto');
    viewer.setAttribute('max-camera-orbit', 'auto 88deg auto');
    viewer.setAttribute('field-of-view', '30deg');

    speedSelect.value = '1';
    setSpeed(1);
    setPlayPauseButtonLabel(true);
    currentTimeLabel.textContent = '00:00';
    durationLabel.textContent = formatTime(activeDuration);
    timelineInput.value = '0';

    if (updateUrl) {
      history.replaceState(null, '', `${location.pathname}?game=${encodeURIComponent(game.id)}`);
    }

    setTimeout(() => {
      document.querySelector('.main-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    const modelSrc = await ensurePriorityModelLoaded(game);

    if (!activeGame || activeGame.id !== game.id) {
      return;
    }

    viewerPlaceholder.textContent = 'Модель подготовлена. Открываем плеер…';
    viewer.setAttribute('src', modelSrc);
  }

  async function playAnimation() {
    try {
      const duration = getViewerDuration();
      const currentTime = Number(viewer.currentTime) || 0;

      if (duration > 0 && currentTime >= duration - 0.08) {
        viewer.currentTime = 0;
        updateTimeline(true);
      }

      await viewer.play();
      isPlaying = true;
      setPlayPauseButtonLabel(true);
    } catch (error) {
      console.warn('Не удалось запустить анимацию:', error);
    }
  }

  function pauseAnimation() {
    try {
      viewer.pause();
    } catch (error) {
      console.warn('Не удалось поставить анимацию на паузу:', error);
    }

    isPlaying = false;
    setPlayPauseButtonLabel(false);
  }

  function togglePlayPause() {
    if (isPlaying) {
      pauseAnimation();
    } else {
      playAnimation();
    }
  }

  function setSpeed(speed) {
    const value = Number(speed) || 1;
    viewer.timeScale = value;
  }

  function jumpToTime(seconds, keepPlaying = isPlaying) {
    const duration = getViewerDuration();
    const nextTime = Math.max(0, Math.min(Number(seconds) || 0, duration || Number(seconds) || 0));

    viewer.currentTime = nextTime;
    updateTimeline(true);

    if (keepPlaying) {
      playAnimation();
    } else {
      pauseAnimation();
    }
  }

  function shiftTime(delta) {
    jumpToTime((Number(viewer.currentTime) || 0) + delta, isPlaying);
  }

  function resetView() {
    viewer.setAttribute('camera-orbit', '0deg 65deg auto');
    viewer.setAttribute('min-camera-orbit', 'auto 0deg auto');
    viewer.setAttribute('max-camera-orbit', 'auto 88deg auto');
    viewer.setAttribute('field-of-view', '30deg');

    if (typeof viewer.jumpCameraToGoal === 'function') {
      viewer.jumpCameraToGoal();
    }
  }

  function toggleFullscreen() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
      const target = playerPanel;

      if (target.requestFullscreen) target.requestFullscreen();
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }

  async function activateAR() {
    if (!activeGame) return;

    try {
      if (!viewer.activateAR) {
        showToast('AR не поддерживается этим браузером. Проверьте устройство и HTTPS.');
        return;
      }

      await viewer.activateAR();
    } catch (error) {
      console.error('Ошибка запуска AR:', error);
      showToast('AR не запустился. Проверьте HTTPS, поддержку ARCore и доступность модели.');
    }
  }

  function updateActiveChapter(currentTime) {
    if (!activeGame) return;

    const chapters = activeGame.chapters || [];
    let activeIndex = -1;

    chapters.forEach((chapter, index) => {
      const next = chapters[index + 1];

      if (currentTime >= chapter.time && (!next || currentTime < next.time)) {
        activeIndex = index;
      }
    });

    chaptersList.querySelectorAll('.chapter-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.index) === activeIndex);
    });

    if (viewerChaptersMiniList) {
      viewerChaptersMiniList.querySelectorAll('.viewer-mini-chapter-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.index) === activeIndex);
      });
    }
  }

  function updateTimeline(force = false) {
    if (!activeGame) return;

    const duration = getViewerDuration();
    const currentTime = Number(viewer.currentTime) || 0;

    if (duration > 0) {
      activeDuration = duration;
      durationLabel.textContent = formatTime(duration);

      if (!isUserScrubbing || force) {
        timelineInput.value = String(Math.max(0, Math.min(1000, Math.round((currentTime / duration) * 1000))));
      }
    }

    currentTimeLabel.textContent = formatTime(currentTime);
    updateActiveChapter(currentTime);
  }

  function animationLoop() {
    updateTimeline(false);
    handleAnimationLoopState();
    requestAnimationFrame(animationLoop);
  }

  function getCameraModeUrl() {
    return new URL(CAMERA_MODE_URL, window.location.href).href;
  }

  function isLikelySmartphoneOrTablet() {
    const ua = navigator.userAgent || '';
    const mobileUa = /Android|iPhone|iPad|iPod|Mobile|Tablet|Windows Phone/i.test(ua);
    const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const anyCoarsePointer = window.matchMedia('(any-pointer: coarse)').matches;
    const tabletOrMobileWidth = window.matchMedia('(max-width: 1080px)').matches;

    return mobileUa || iPadOS || ((coarsePointer || anyCoarsePointer) && tabletOrMobileWidth);
  }

  function openDesktopQrModal() {
    const { desktopQrModal, qrCloseBtn, qrCodeImg, qrDirectLink, qrUrlText } = getQrModalElements();

    if (!desktopQrModal) {
      showToast('Не удалось открыть QR-окно: блок подсказки не найден на странице.');
      return;
    }

    const cameraUrl = getCameraModeUrl();
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=16&data=' + encodeURIComponent(cameraUrl);

    if (qrCodeImg) qrCodeImg.src = qrUrl;
    if (qrDirectLink) qrDirectLink.href = cameraUrl;
    if (qrUrlText) qrUrlText.textContent = cameraUrl;

    desktopQrModal.classList.add('is-visible');
    desktopQrModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('qr-modal-open');

    if (qrCloseBtn) {
      setTimeout(() => qrCloseBtn.focus(), 0);
    }
  }

  function closeDesktopQrModal() {
    const { desktopQrModal } = getQrModalElements();
    if (!desktopQrModal) return;

    desktopQrModal.classList.remove('is-visible');
    desktopQrModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('qr-modal-open');
  }

  function handleCameraModeClick() {
    if (isLikelySmartphoneOrTablet()) {
      window.location.href = getCameraModeUrl();
      return;
    }

    openDesktopQrModal();
  }

  mainBackBtn.addEventListener('click', () => {
    if (playerScreen.classList.contains('active')) {
      showSelectScreen(true);
      return;
    }

    window.location.href = 'welcome.html';
  });

  if (mobileCameraBtn) {
    mobileCameraBtn.addEventListener('click', handleCameraModeClick);
  }

  if (viewerChaptersToggle) {
    viewerChaptersToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleViewerChaptersMenu();
    });
  }

  if (viewerChaptersPanel) {
    viewerChaptersPanel.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  document.addEventListener('click', (event) => {
    if (viewerChaptersPanel && viewerChaptersPanel.classList.contains('open') && !event.target.closest('#viewerChaptersToggle, #viewerChaptersPanel')) {
      closeViewerChaptersMenu();
    }

    if (event.target.closest('[data-qr-close], #qrCloseBtn')) {
      closeDesktopQrModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    const { desktopQrModal } = getQrModalElements();

    if (event.key === 'Escape') {
      closeMobileMenu();
      closeViewerChaptersMenu();

      if (desktopQrModal && desktopQrModal.classList.contains('is-visible')) {
        closeDesktopQrModal();
      }
    }
  });

  backToGamesBtn.addEventListener('click', () => showSelectScreen(true));
  chooseAnotherBtn.addEventListener('click', () => showSelectScreen(true));
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    applyTheme(isDark ? 'light' : 'dark');
  });

  window.addEventListener('resize', syncCompactControlLabels);

  if (burgerMenuBtn) {
    burgerMenuBtn.addEventListener('click', event => {
      event.stopPropagation();
      toggleMobileMenu();
    });
  }

  if (mobileBurgerMenu) {
    mobileBurgerMenu.addEventListener('click', event => {
      event.stopPropagation();
    });
  }

  if (mobileTrainerBtn) {
    mobileTrainerBtn.addEventListener('click', () => {
      closeMobileMenu();
      window.location.href = 'index.html?mode=train';
    });
  }

  if (mobilePublisherSiteBtn) {
    mobilePublisherSiteBtn.addEventListener('click', () => {
      closeMobileMenu();
      window.open('https://viavuca.com/', '_blank', 'noopener');
    });
  }

  if (mobileThemeBtn) {
    mobileThemeBtn.addEventListener('click', () => {
      toggleThemeFromMenu();
      closeMobileMenu();
    });
  }

  document.addEventListener('click', closeMobileMenu);

  if (gamesCarouselDots) {
    gamesCarouselDots.addEventListener('click', event => {
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

  if (selectorGrid) {
    selectorGrid.addEventListener('touchstart', event => {
      if (!isGamesCarouselViewport()) return;
      const touch = event.touches[0];
      gamesTouchStartX = touch.clientX;
      gamesTouchStartY = touch.clientY;
    }, { passive: true });

    selectorGrid.addEventListener('touchend', event => {
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

  window.addEventListener('resize', () => {
    if (!window.matchMedia || !window.matchMedia('(max-width: 760px)').matches) {
      closeMobileMenu();
    }

    renderGameSelector();
  });

  playPauseBtn.addEventListener('click', togglePlayPause);
  rewindBtn.addEventListener('click', () => shiftTime(-5));
  forwardBtn.addEventListener('click', () => shiftTime(5));
  resetViewBtn.addEventListener('click', resetView);
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  arBtn.addEventListener('click', activateAR);

  speedSelect.addEventListener('change', () => {
    setSpeed(speedSelect.value);
  });

  if (loopToggleBtn) {
    loopToggleBtn.addEventListener('click', toggleAnimationLoop);
  }

  timelineInput.addEventListener('input', () => {
    if (!activeGame) return;
    isUserScrubbing = true;
    const duration = getViewerDuration();
    const time = (Number(timelineInput.value) / 1000) * duration;
    viewer.currentTime = time;
    currentTimeLabel.textContent = formatTime(time);
    updateActiveChapter(time);
  });

  timelineInput.addEventListener('change', () => {
    isUserScrubbing = false;
    if (isPlaying) {
      playAnimation();
    } else {
      pauseAnimation();
    }
  });

  viewer.addEventListener('load', () => {
    viewerPlaceholder.style.display = 'none';
    viewerError.classList.remove('visible');
    activeDuration = getViewerDuration();
    durationLabel.textContent = formatTime(activeDuration);
    timelineInput.value = '0';
    setSpeed(speedSelect.value);

    if (activeGame) {
      setCacheStatus(activeGame.id, 'cached', 'кэш: готово');
    }

    playAnimation();
    resumeBackgroundPreload(1200);
  });

  viewer.addEventListener('error', event => {
    console.error('Ошибка загрузки модели:', activeGame ? activeGame.file : null, event);
    viewerPlaceholder.style.display = 'none';
    viewerError.textContent = activeGame
      ? `Не удалось загрузить модель. Проверьте файл: ${activeGame.file}`
      : 'Не удалось загрузить модель.';
    viewerError.classList.add('visible');

    if (activeGame) {
      setCacheStatus(activeGame.id, 'error', 'кэш: ошибка');
    }

    resumeBackgroundPreload(1800);
  });

  viewer.addEventListener('ar-status', event => {
    console.log('AR status:', event.detail.status);

    if (event.detail.status === 'failed') {
      showToast('AR не запустился. Проверьте поддержку AR на устройстве.');
    }
  });

  function syncFullscreenButtonState() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    fullscreenBtn.textContent = '⛶';
    fullscreenBtn.setAttribute('aria-label', fullscreenElement ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим');
    fullscreenBtn.setAttribute('title', fullscreenElement ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим');

    requestAnimationFrame(syncCompactControlLabels);
  }

  document.addEventListener('fullscreenchange', syncFullscreenButtonState);
  document.addEventListener('webkitfullscreenchange', syncFullscreenButtonState);

  renderGameSelector();
  applyTheme(localStorage.getItem('viavuca3dTheme') === 'dark' ? 'dark' : 'light');
  syncCompactControlLabels();
  updateLoopToggleButton();
  registerModelCacheWorker();
  resumeBackgroundPreload(800);

  const params = new URLSearchParams(location.search);
  const initialGame = params.get('game');

  if (initialGame && GAMES.some(game => game.id === initialGame)) {
    openGame(initialGame, false);
  }

  requestAnimationFrame(animationLoop);
