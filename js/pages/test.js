const urlParams = new URLSearchParams(window.location.search);

const testId = urlParams.get('testId');
const studentId = urlParams.get('studentId');

const gameParam = urlParams.get('game');
const modeParam = urlParams.get('mode');
const countParam = urlParams.get('count');
const typeParam = urlParams.get('type');
const customParam = urlParams.get('custom');
const shuffleParam = urlParams.get('shuffle');
const gamesParam = urlParams.get('games');

const isTournamentMode = !!(testId && studentId);
const isGeneratedTestMode = !!gameParam || modeParam === 'mixed' || !!gamesParam;

let tasksList = [];
let userAnswers = [];
let taskAnswered = [];
let currentTaskIndex = 0;
let resultsTaskIndex = -1;
let reviewMode = false;

localStorage.removeItem('globalBrushColor');
localStorage.removeItem('globalBrushPosIndex');

const gameResourcesCache = {};

function beforeUnloadHandler(e) {
    if (resultsTaskIndex === -1 && !reviewMode && taskAnswered.some(Boolean)) {
        e.preventDefault();
        e.returnValue = '';
    }
}

window.addEventListener('beforeunload', beforeUnloadHandler);

const exitModal = document.getElementById('exitConfirmModal');
const exitToMenuBtn = document.getElementById('exitToMenuBtn');
const stayBtn = document.getElementById('stayBtn');
const exitToMainBtn = document.getElementById('exitToMainMenuBtn');
const exitModalClose = document.getElementById('exitModalClose');

function openExitModal() {
    exitModal.style.display = 'flex';
}

function closeExitModal() {
    exitModal.style.display = 'none';
}

exitToMenuBtn.addEventListener('click', () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);

    if (isGeneratedTestMode && gameParam) {
        window.location.href = `test_setup.html?game=${encodeURIComponent(gameParam)}`;
    } else {
        window.location.href = 'index.html?mode=test';
    }
});

stayBtn.addEventListener('click', closeExitModal);

exitToMainBtn.addEventListener('click', () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.location.href = 'index.html?mode=test';
});

exitModalClose.addEventListener('click', closeExitModal);

window.addEventListener('click', e => {
    if (e.target === exitModal) closeExitModal();
});

document.getElementById('backButton').addEventListener('click', e => {
    e.preventDefault();
    openExitModal();
});

async function loadGameConfig(gameId) {
    try {
        const r = await fetch(`games/${gameId}/config.json`);

        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        return await r.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

function loadImagesForGame(gameId, config) {
    return new Promise(resolve => {
        const entry = gameResourcesCache[gameId];
        const folder = `games/${gameId}/`;
        const piecesConfig = config.images?.pieces || {};
        const pieceKeys = Object.keys(piecesConfig);
        const total = 1 + pieceKeys.length;

        let done = 0;

        const onLoad = () => {
            if (++done >= total) resolve();
        };

        entry.fieldImg = new Image();
        entry.fieldImg.onload = onLoad;
        entry.fieldImg.onerror = onLoad;
        entry.fieldImg.src = `${folder}${config.images?.board || 'pole.png'}`;

        entry.pieceImages = entry.pieceImages || {};

        pieceKeys.forEach(color => {
            const img = new Image();

            img.onload = onLoad;
            img.onerror = onLoad;
            img.src = `${folder}${piecesConfig[color]}`;

            entry.pieceImages[color] = img;
        });

        if (total === 0) resolve();
    });
}

async function loadGameDataIsolated(gameId, config) {
    const taskFiles = config.taskFiles || ['task1.js'];
    const generators = {};

    let originalCenters = {};
    let drawGreenNumbers = null;

    for (const file of taskFiles) {
        try {
            const jsText = await fetch(`games/${gameId}/${file}`).then(r => r.text());

            const sandboxPieceImages = gameResourcesCache[gameId]?.pieceImages || {};

            const sandbox = {
                originalCenters: {},
                drawGreenNumbers: null,
                taskGenerators: {},
                taskTitles: {},
                pieceImages: sandboxPieceImages
            };

            const fn = new Function('window', 'pieceImages', jsText + ';\nreturn window;');
            const result = fn(sandbox, sandboxPieceImages);

            if (result.taskGenerators) {
                Object.assign(generators, result.taskGenerators);
            }

            if (result.originalCenters && Object.keys(result.originalCenters).length > 0) {
                Object.assign(originalCenters, result.originalCenters);
            }

            if (typeof result.drawGreenNumbers === 'function') {
                drawGreenNumbers = result.drawGreenNumbers;
            }
        } catch (e) {
            console.warn(`Sandbox ошибка ${gameId}/${file}:`, e);
        }
    }

    return {
        generators,
        originalCenters,
        drawGreenNumbers
    };
}

async function loadGameResourcesCached(gameId) {
    if (gameResourcesCache[gameId]?.loaded) return gameResourcesCache[gameId];

    const config = await loadGameConfig(gameId);

    if (!config) {
        console.error(`Не удалось загрузить config для ${gameId}`);
        return null;
    }

    gameResourcesCache[gameId] = {
        fieldImg: null,
        pieceImages: {},
        originalCenters: {},
        drawGreenNumbers: null,
        loaded: false,
        generators: {},
        config
    };

    const [data] = await Promise.all([
        loadGameDataIsolated(gameId, config),
        loadImagesForGame(gameId, config),
    ]);

    gameResourcesCache[gameId].originalCenters = data.originalCenters;
    gameResourcesCache[gameId].drawGreenNumbers = data.drawGreenNumbers;
    gameResourcesCache[gameId].generators = data.generators;
    gameResourcesCache[gameId].loaded = true;

    return gameResourcesCache[gameId];
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

async function generateMixedTestSet(gamesConfig, shuffleFlag) {
    const allTasks = [];

    for (const item of gamesConfig) {
        const res = await loadGameResourcesCached(item.id);

        if (!res) continue;

        const generators = res.generators || {};

        for (const [taskType, count] of Object.entries(item.tasks || {})) {
            const gen = generators[taskType];

            if (!gen) {
                console.warn(`Нет генератора ${taskType} для ${item.id}`);
                continue;
            }

            for (let i = 0; i < Number(count); i++) {
                const task = gen();

                task._gameId = item.id;

                allTasks.push(task);
            }
        }
    }

    if (shuffleFlag) {
        shuffleArray(allTasks);
    }

    return allTasks;
}

function parseCustomTasks(customString) {
    const result = {};

    if (!customString) return result;

    customString.split(',').forEach(part => {
        const [type, count] = part.split(':');

        const cleanType = String(type || '').trim();
        const cleanCount = Number(count || 0);

        if (cleanType && cleanCount > 0) {
            result[cleanType] = cleanCount;
        }
    });

    return result;
}

async function generateSingleGameTestSet(gameId, mode, count, type, customString, shuffleFlag) {
    const res = await loadGameResourcesCached(gameId);

    if (!res) return [];

    const generators = res.generators || {};
    const generatorKeys = Object.keys(generators).sort((a, b) => Number(a) - Number(b));
    const tasks = [];

    if (mode === 'random') {
        const total = Number(count || 10);

        if (!generatorKeys.length) return [];

        for (let i = 0; i < total; i++) {
            const randomType = generatorKeys[Math.floor(Math.random() * generatorKeys.length)];
            const gen = generators[randomType];

            if (!gen) continue;

            const task = gen();

            task._gameId = gameId;

            tasks.push(task);
        }

        return tasks;
    }

    if (mode === 'type') {
        const total = Number(count || 10);
        const gen = generators[type];

        if (!gen) return [];

        for (let i = 0; i < total; i++) {
            const task = gen();

            task._gameId = gameId;

            tasks.push(task);
        }

        return tasks;
    }

    if (mode === 'custom') {
        const customTasks = parseCustomTasks(customString);

        for (const [taskType, taskCount] of Object.entries(customTasks)) {
            const gen = generators[taskType];

            if (!gen) continue;

            for (let i = 0; i < Number(taskCount); i++) {
                const task = gen();

                task._gameId = gameId;

                tasks.push(task);
            }
        }

        if (shuffleFlag) shuffleArray(tasks);

        return tasks;
    }

    return [];
}

const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');
const questionDiv = document.getElementById('question');
const boardWrapper = document.getElementById('boardWrapper');
const toggleBtn = document.getElementById('toggleNumbersBtn');
const taskLoadingOverlay = document.getElementById('taskLoadingOverlay');
const taskLoadingText = document.getElementById('taskLoadingText');
const resultDiv = document.getElementById('result');
const resultMessageSpan = document.getElementById('resultMessage');
const resultArrow = document.getElementById('resultArrow');
const resultExpandPanel = document.getElementById('resultExpandPanel');
const optionsContainer = document.getElementById('optionsContainer');
const actionBtn = document.getElementById('actionBtn');
const prevTaskBtn = document.getElementById('prevTaskBtn');
const nextTaskBtn = document.getElementById('nextTaskBtn');
const taskNavPanel = document.getElementById('taskNavPanel');

let currentTask = null;
let selectedValues = [];
let selectedValueSingle = null;
let warningTimer = null;
let resultExpanded = false;
let numbersVisible = false;

function showTaskLoading(message = 'Загружаем задачу…') {
    if (taskLoadingText) {
        taskLoadingText.textContent = message;
    }

    if (boardWrapper) {
        boardWrapper.classList.add('task-loading');
    }
}

function hideTaskLoading() {
    if (boardWrapper) {
        boardWrapper.classList.remove('task-loading');
    }
}

function getResources(task) {
    if (task && task._gameId && gameResourcesCache[task._gameId]) {
        return gameResourcesCache[task._gameId];
    }

    return null;
}

function drawNative(task, position, highlights, greenNumbers, highlightedCell, targets, showCellNumbers = false) {
    const res = getResources(task);

    if (!res || !res.fieldImg || !res.fieldImg.complete || !res.fieldImg.naturalWidth) return;

    const oc = res.originalCenters;

    if (!oc || Object.keys(oc).length === 0) return;

    canvas.width = res.fieldImg.width;
    canvas.height = res.fieldImg.height;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	ctx.drawImage(res.fieldImg, 0, 0);

    const pieceSize = 72.2835 * 4;
    const half = pieceSize / 2;

    for (const cs in position) {
        const orig = oc[parseInt(cs, 10)];

        if (!orig) continue;

        const img = res.pieceImages[position[cs]];

        if (!img || !img.complete) continue;

        ctx.drawImage(img, orig.x - half, orig.y - half, pieceSize, pieceSize);
    }

    if (highlightedCell && oc[highlightedCell]) {
        const orig = oc[highlightedCell];

        ctx.beginPath();
        ctx.arc(orig.x, orig.y, pieceSize / 2 + 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,0,0.45)';
        ctx.fill();
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    if (highlights) {
        for (const cn in highlights) {
            ctx.fillStyle = cn === 'red'
                ? 'rgba(255,80,80,0.45)'
                : 'rgba(80,255,80,0.45)';

            for (const cs of highlights[cn]) {
                const orig = oc[parseInt(cs, 10)];

                if (!orig) continue;

                ctx.beginPath();
                ctx.arc(orig.x, orig.y, pieceSize / 2 + 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    if (greenNumbers && res.drawGreenNumbers) {
        res.drawGreenNumbers(ctx, oc, greenNumbers, pieceSize);
    }

    if (targets) {
        ctx.font = `bold ${Math.floor(pieceSize * 0.35)}px "Inter",system-ui`;
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const cs in targets) {
            const orig = oc[parseInt(cs, 10)];

            if (!orig) continue;

            ctx.fillStyle = 'white';
            ctx.fillRect(orig.x - 12, orig.y - 12, 24, 24);
            ctx.fillStyle = 'black';
            ctx.fillText(targets[cs], orig.x, orig.y);
        }
    }

    if (showCellNumbers) {
        const cell1 = oc[1];
        const cell2 = oc[2];
        const drawSettings = {
            ...(res.config?.drawSettings || {}),
            ...(task?.drawSettings || {})
        };
        const isDablotGame = task?._gameId === 'dablot' || res.config?.gameId === 'dablot';
        let calculatedFontSize = Math.floor(pieceSize * 0.28);

        if (cell1 && cell2) {
            const dx = cell2.x - cell1.x;
            const dy = cell2.y - cell1.y;
            const cellDist = Math.hypot(dx, dy);
            calculatedFontSize = Math.floor(cellDist * 0.3);
        }

        const fontSize = Number(drawSettings.numberFontSize) || (isDablotGame ? 70 : calculatedFontSize);
        const cellsCount = Number(res.config?.cellsCount) || Math.max(...Object.keys(oc).map(Number));
        const skipPositionNumbers = new Set(
            (task?.skipPositionNumbers || []).map(Number)
        );

        ctx.font = `bold ${fontSize}px "Inter", system-ui`;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 1; i <= cellsCount; i++) {
            if (skipPositionNumbers.has(i)) continue;

            const center = oc[i];

            if (!center) continue;

            ctx.fillText(i.toString(), center.x, center.y);
        }

        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

function isToggleNumbersAvailable() {
    return !!(reviewMode && currentTask && currentTaskIndex !== resultsTaskIndex);
}

function positionToggleNumbersBtn() {
    if (!toggleBtn || !canvas || !boardWrapper) return;
    if (toggleBtn.style.display === 'none') return;

    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    if (!canvasWidth || !canvasHeight) return;

    const isSmallScreen = window.innerWidth <= 550;
    const size = isSmallScreen ? 28 : 34;
    const gap = isSmallScreen ? 8 : 10;

    const resultScale = boardWrapper.classList.contains('show-result')
        ? (isSmallScreen ? 0.92 : 0.9)
        : 1;

    const scaledCanvasWidth = canvasWidth * resultScale;
    const scaledCanvasHeight = canvasHeight * resultScale;
    const scaledCanvasLeft = canvas.offsetLeft + (canvasWidth - scaledCanvasWidth) / 2;
    const scaledCanvasTop = canvas.offsetTop;

    const left = scaledCanvasLeft + scaledCanvasWidth - size - gap;
    const top = scaledCanvasTop + scaledCanvasHeight - size - gap;

    toggleBtn.style.width = `${size}px`;
    toggleBtn.style.height = `${size}px`;
    toggleBtn.style.left = `${Math.max(scaledCanvasLeft + gap, left)}px`;
    toggleBtn.style.top = `${Math.max(scaledCanvasTop + gap, top)}px`;
}

function updateToggleNumbersButton() {
    if (!toggleBtn) return;

    if (!isToggleNumbersAvailable()) {
        toggleBtn.style.display = 'none';
        return;
    }

    toggleBtn.innerHTML = numbersVisible ? '🚫' : '👁️';
    toggleBtn.style.display = 'flex';
    requestAnimationFrame(positionToggleNumbersBtn);
}

function hideToggleNumbersButton() {
    if (!toggleBtn) return;

    toggleBtn.style.display = 'none';
}

function toggleNumbers() {
    if (!isToggleNumbersAvailable()) return;

    numbersVisible = !numbersVisible;
    redrawCurrent();
}

function redrawCurrent() {
    if (!currentTask) return;

    drawNative(
        currentTask,
        currentTask.position || {},
        currentTask.highlights || {},
        currentTask.green_numbers || null,
        currentTask.highlighted_cell || null,
        currentTask.targets || null,
        isToggleNumbersAvailable() && numbersVisible
    );

    if (reviewMode) {
        const ok = checkTaskCorrectness(currentTaskIndex);

        canvas.classList.toggle('correct', !!ok);
        canvas.classList.toggle('wrong', !ok);
    }

    updateToggleNumbersButton();
}

function saveBrushSettings(color, posIndex) {}

function loadBrushSettings() {
    return {
        color: '#ffffff',
        posIndex: 1
    };
}

const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const zoomContainer = document.getElementById('zoomContainer');
const imageStage = document.getElementById('imageStage');
const closeBtn = document.getElementById('closeModalBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const clearDrawBtn = document.getElementById('clearDrawBtn');
const drawCanvasElem = document.getElementById('drawCanvas');
const drawCtx = drawCanvasElem.getContext('2d');
const isDesktopLike = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let currentScale = 1,
    MIN_SCALE = 0.6,
    MAX_SCALE = isDesktopLike ? 1 : 3;

let strokes = [],
    currentStroke = null,
    isDrawing = false,
    drawingPointerId = null,
    isPinching = false,
    initialDistance = 0,
    initialScale = 1;

let currentDrawColor = '#ffffff',
    currentBrushSize = 8;

let isDraggingThumb = false;

const sliderTrack = document.getElementById('sliderTrack');
const sliderThumb = document.getElementById('sliderThumb');
const positions = [0, 25, 50, 75, 100];

let brushSizes = [4, 10, 18, 28, 40];
let currentPosIndex = 1;

function setBrushByIndex(index) {
    if (index < 0) index = 0;
    if (index >= positions.length) index = positions.length - 1;

    currentPosIndex = index;

    const percent = positions[currentPosIndex];

    sliderThumb.style.left = `${percent}%`;

    currentBrushSize = brushSizes[currentPosIndex];

    const thumbScale = 0.5 + currentBrushSize / 80;
    const thumbSize = 20 * thumbScale;

    sliderThumb.style.width = `${Math.min(32, thumbSize)}px`;
    sliderThumb.style.height = `${Math.min(32, thumbSize)}px`;

    saveBrushSettings(currentDrawColor, currentPosIndex);
}

function updateBrushSizes() {
    const standardWidth = Math.max(6, drawCanvasElem.width * 0.007);
    const multipliers = [0.4, 1.0, 1.8, 2.8, 4.0];

    brushSizes = multipliers.map(m => Math.round(standardWidth * m));
    brushSizes = brushSizes.map(s => Math.min(80, Math.max(4, s)));

    setBrushByIndex(currentPosIndex);
}

function snapToNearestPosition(percent) {
    let nearest = 0;
    let minDiff = Math.abs(percent - positions[0]);

    for (let i = 1; i < positions.length; i++) {
        const diff = Math.abs(percent - positions[i]);

        if (diff < minDiff) {
            minDiff = diff;
            nearest = i;
        }
    }

    setBrushByIndex(nearest);
}

function handleSliderInteraction(clientX) {
    const rect = sliderTrack.getBoundingClientRect();

    let relX = clientX - rect.left;
    let percent = (relX / rect.width) * 100;

    percent = Math.min(100, Math.max(0, percent));

    snapToNearestPosition(percent);
}

sliderTrack.addEventListener('click', e => {
    e.stopPropagation();
    handleSliderInteraction(e.clientX);
});

document.querySelectorAll('.slider-mark').forEach(mark => {
    mark.addEventListener('click', e => {
        e.stopPropagation();

        const percent = parseFloat(mark.style.left);

        snapToNearestPosition(percent);
    });
});

function onMove(e) {
    if (!isDraggingThumb) return;

    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    handleSliderInteraction(clientX);
}

function onEnd() {
    if (isDraggingThumb) {
        isDraggingThumb = false;

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    }
}

sliderThumb.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingThumb = true;

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
});

sliderThumb.addEventListener('touchstart', e => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingThumb = true;

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
});

const colorIndicatorBtn = document.getElementById('colorIndicator');
const drawToolsPanel = document.getElementById('drawToolsPanel');

colorIndicatorBtn.addEventListener('click', e => {
    e.stopPropagation();
    drawToolsPanel.classList.toggle('show');
});

document.addEventListener('click', e => {
    if (!drawToolsPanel.contains(e.target) && e.target !== colorIndicatorBtn) {
        drawToolsPanel.classList.remove('show');
    }
});

document.querySelectorAll('#colorPalette .color-circle').forEach(circle => {
    circle.addEventListener('click', e => {
        e.stopPropagation();

        currentDrawColor = circle.dataset.color;
        colorIndicatorBtn.style.backgroundColor = currentDrawColor;

        drawToolsPanel.classList.remove('show');

        saveBrushSettings(currentDrawColor, currentPosIndex);
    });
});

const savedBrushSettings = loadBrushSettings();
currentDrawColor = savedBrushSettings.color;
currentPosIndex = savedBrushSettings.posIndex;

colorIndicatorBtn.style.backgroundColor = currentDrawColor;
setBrushByIndex(currentPosIndex);

function updateZoomButtons() {
    const atMin = currentScale <= MIN_SCALE + 0.001;
    const atMax = currentScale >= MAX_SCALE - 0.001;

    zoomOutBtn.disabled = atMin;
    zoomInBtn.disabled = atMax;

    zoomOutBtn.classList.toggle('disabled', atMin);
    zoomInBtn.classList.toggle('disabled', atMax);
}

function updateScale(newScale) {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

    currentScale = clamped;
    zoomContainer.style.transform = `scale(${currentScale})`;

    updateZoomButtons();
}

function preventScroll(e) {
    e.preventDefault();
}

function handleWheel(e) {
    if (modal.style.display !== 'flex') return;

    e.preventDefault();

    const delta = e.deltaY < 0 ? 0.12 : -0.12;

    updateScale(currentScale + delta);
}

function getTouchDistance(e) {
    return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
    );
}

function onTouchStart(e) {
    if (modal.style.display !== 'flex') return;

    if (e.touches.length === 2) {
        e.preventDefault();

        isPinching = true;

        cancelDrawing();

        initialDistance = getTouchDistance(e);
        initialScale = currentScale;
    }
}

function onTouchMove(e) {
    if (modal.style.display !== 'flex') return;

    if (e.touches.length === 2) {
        e.preventDefault();

        const newDistance = getTouchDistance(e);

        if (initialDistance > 0) {
            updateScale(initialScale * (newDistance / initialDistance));
        }
    }
}

function onTouchEnd(e) {
    if (e.touches.length < 2) {
        initialDistance = 0;
        initialScale = currentScale;
        isPinching = false;
    }
}

function syncDrawCanvasToImage() {
    if (!modalImg.naturalWidth || !modalImg.naturalHeight) return;

    drawCanvasElem.width = modalImg.naturalWidth;
    drawCanvasElem.height = modalImg.naturalHeight;

    redrawAllStrokes();
    updateBrushSizes();
}

function redrawAllStrokes() {
    drawCtx.clearRect(0, 0, drawCanvasElem.width, drawCanvasElem.height);
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';

    for (const stroke of strokes) {
        if (!stroke.points.length) continue;

        drawCtx.beginPath();
        drawCtx.strokeStyle = stroke.color;
        drawCtx.lineWidth = stroke.width;
        drawCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
            drawCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }

        drawCtx.stroke();
    }
}

function getCanvasPointFromEvent(e) {
    const rect = drawCanvasElem.getBoundingClientRect();

    return {
        x: (e.clientX - rect.left) * (drawCanvasElem.width / rect.width),
        y: (e.clientY - rect.top) * (drawCanvasElem.height / rect.height)
    };
}

function startDrawing(e) {
    if (modal.style.display !== 'flex') return;
    if (isPinching) return;

    e.preventDefault();

    isDrawing = true;
    drawingPointerId = e.pointerId;

    if (drawCanvasElem.setPointerCapture) {
        drawCanvasElem.setPointerCapture(e.pointerId);
    }

    const p = getCanvasPointFromEvent(e);

    currentStroke = {
        color: currentDrawColor,
        width: currentBrushSize,
        points: [p]
    };

    strokes.push(currentStroke);

    redrawAllStrokes();
}

function moveDrawing(e) {
    if (!isDrawing || e.pointerId !== drawingPointerId) return;

    e.preventDefault();

    const p = getCanvasPointFromEvent(e);
    const last = currentStroke.points[currentStroke.points.length - 1];

    if (Math.hypot(p.x - last.x, p.y - last.y) < 2) return;

    const smooth = {
        x: last.x + (p.x - last.x) * 0.55,
        y: last.y + (p.y - last.y) * 0.55
    };

    currentStroke.points.push(smooth);

    redrawAllStrokes();
}

function stopDrawing(e) {
    if (e.pointerId !== drawingPointerId) return;

    if (drawCanvasElem.releasePointerCapture && drawCanvasElem.hasPointerCapture(e.pointerId)) {
        drawCanvasElem.releasePointerCapture(e.pointerId);
    }

    isDrawing = false;
    drawingPointerId = null;
    currentStroke = null;
}

function cancelDrawing() {
    isDrawing = false;
    drawingPointerId = null;
    currentStroke = null;
}

function clearDrawing() {
    strokes = [];
    redrawAllStrokes();
}

function openModal() {
    if (!canvas.width || !canvas.height) return;

    const dataUrl = canvas.toDataURL('image/png');

    modalImg.onload = () => syncDrawCanvasToImage();
    modalImg.src = dataUrl;

    updateScale(1);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    document.body.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';

    document.body.removeEventListener('touchmove', preventScroll);
    window.removeEventListener('wheel', handleWheel);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);

    cancelDrawing();

    modalImg.src = '';
}

drawCanvasElem.addEventListener('pointerdown', startDrawing);
drawCanvasElem.addEventListener('pointermove', moveDrawing);
drawCanvasElem.addEventListener('pointerup', stopDrawing);
drawCanvasElem.addEventListener('pointercancel', stopDrawing);

modal.addEventListener('click', e => {
    if (isDraggingThumb) return;

    if (
        e.target === modal ||
        e.target === modalImg ||
        e.target === zoomContainer ||
        e.target === imageStage
    ) {
        closeModal();
    }
});

closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    closeModal();
});

zoomInBtn.addEventListener('click', e => {
    e.stopPropagation();

    if (!zoomInBtn.disabled) updateScale(currentScale + 0.15);
});

zoomOutBtn.addEventListener('click', e => {
    e.stopPropagation();

    if (!zoomOutBtn.disabled) updateScale(currentScale - 0.15);
});

clearDrawBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearDrawing();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
});

canvas.addEventListener('click', openModal);

if (toggleBtn) {
    toggleBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleNumbers();
    });
}

window.addEventListener('resize', () => {
    requestAnimationFrame(positionToggleNumbersBtn);
});

const NO_TR = [
    () => document.querySelector('.game-card'),
    () => boardWrapper,
    () => resultDiv,
    () => resultExpandPanel,
];

function instantHideResult() {
    const els = NO_TR.map(f => f()).filter(Boolean);

    els.forEach(el => el.classList.add('no-transition'));

    hideResult();

    requestAnimationFrame(() => requestAnimationFrame(() => {
        els.forEach(el => el.classList.remove('no-transition'));
    }));
}

function disableAnimationTemporarily(cb) {
    NO_TR.forEach(f => {
        const el = f();

        if (el) el.classList.add('no-transition');
    });

    cb();

    updateNavButtons();

    requestAnimationFrame(() => requestAnimationFrame(() => {
        NO_TR.forEach(f => {
            const el = f();

            if (el) el.classList.remove('no-transition');
        });

        updateNavButtons();
    }));
}

function setAnswerAcceptedVisualState(isAccepted) {
    if (!optionsContainer) return;

    optionsContainer.classList.toggle('answer-accepted', !!isAccepted);
}

function hideResult() {
    if (warningTimer) clearTimeout(warningTimer);

    setAnswerAcceptedVisualState(false);

    resultDiv.classList.remove('show', 'correct', 'wrong', 'info', 'accept', 'expandable');
    resultArrow.classList.remove('rotated');
    resultExpandPanel.classList.remove('expanded');

    resultMessageSpan.innerText = '';
    resultExpandPanel.innerHTML = '';

    boardWrapper.classList.remove('show-result');

    if (!isToggleNumbersAvailable()) {
        hideToggleNumbersButton();
    }

    resultExpanded = false;
}

function showResult(msg, type, explanation, autoHide = false) {
    if (warningTimer) clearTimeout(warningTimer);

    boardWrapper.classList.add('show-result');

    resultMessageSpan.innerText = msg;

    resultDiv.classList.remove('correct', 'wrong', 'info', 'accept', 'expandable');
    resultDiv.classList.add('show', type);

    resultExpandPanel.innerHTML = explanation
        ? explanation.split('; ').map(l => `<div class="result-line">${l}</div>`).join('')
        : '';

    if (explanation && explanation.trim()) resultDiv.classList.add('expandable');

    resultArrow.classList.remove('rotated');
    resultExpandPanel.classList.remove('expanded');

    resultExpanded = false;

    if (autoHide) warningTimer = setTimeout(() => hideResult(), 3000);
}

function showAcceptMessage() {
    showResult('Ответ принят', 'accept', '', false);
    setAnswerAcceptedVisualState(true);
}

function showWarningMessage(m) {
    showResult(m, 'info', '', true);
}

resultDiv.querySelector('.result-summary').addEventListener('click', e => {
    e.stopPropagation();

    if (!resultDiv.classList.contains('expandable')) return;

    resultExpanded = !resultExpanded;

    resultArrow.classList.toggle('rotated', resultExpanded);
    resultExpandPanel.classList.toggle('expanded', resultExpanded);

    if (resultExpandPanel.classList.contains('expanded') && window.innerWidth <= 550) {
        setTimeout(() => {
            resultExpandPanel.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
});

function checkTaskCorrectness(idx) {
    const task = tasksList[idx];
    const ans = userAnswers[idx];

    if (ans === null || ans === undefined) return false;

    if (task.answer_type === 'multiple') {
        const cs = new Set(task.correct);
        const as = new Set(ans);

        return as.size === cs.size && [...as].every(v => cs.has(v));
    }

    return ans === task.correct;
}

function renderOptions(task, idx) {
    optionsContainer.innerHTML = '';
    setAnswerAcceptedVisualState(false);

    if (reviewMode) {
        const ua = userAnswers[idx];
        const ok = checkTaskCorrectness(idx);

        if (task.answer_type === 'multiple') {
            task.options.forEach(opt => {
                const wrap = document.createElement('div');

                wrap.className = 'opt-checkbox';

                const cb = document.createElement('input');

                cb.type = 'checkbox';
                cb.disabled = true;
                cb.checked = !!(ua && ua.includes(opt.id));

                if (cb.checked) {
                    wrap.classList.add('selected');
                }

                const sp = document.createElement('span');

                sp.innerText = opt.text;

                wrap.appendChild(cb);
                wrap.appendChild(sp);
                optionsContainer.appendChild(wrap);
            });
        } else {
            task.options.forEach(opt => {
                const btn = document.createElement('button');

                btn.className = 'opt-btn';
                btn.innerText = opt.text;
                btn.disabled = true;

                if (ua === opt.id) btn.classList.add('selected');

                optionsContainer.appendChild(btn);
            });
        }

        if (ok) {
            showResult('✅ Верно! Отличная работа.', 'correct', task.explanation || '');
        } else {
            const cs = task.answer_type === 'multiple'
                ? task.correct.join(', ')
                : task.correct;

            showResult(`❌ Неверно. Правильный ответ: ${cs}`, 'wrong', task.explanation || '');
        }

        return;
    }

    selectedValues = [];
    selectedValueSingle = null;

    if (task.answer_type === 'multiple') {
        task.options.forEach(opt => {
            const label = document.createElement('label');

            label.className = 'opt-checkbox';

            const cb = document.createElement('input');

            cb.type = 'checkbox';
            cb.value = opt.id;

            cb.addEventListener('change', () => {
                updateFromUI();
                label.classList.toggle('selected', cb.checked);

                if (taskAnswered[currentTaskIndex]) {
                    taskAnswered[currentTaskIndex] = false;
                    userAnswers[currentTaskIndex] = null;

                    renderTaskNav();
                    updateActionBtn();
                    hideResult();

                    actionBtn.disabled = false;
                }
            });

            const sp = document.createElement('span');

            sp.innerText = opt.text;

            label.appendChild(cb);
            label.appendChild(sp);
            optionsContainer.appendChild(label);
        });
    } else {
        task.options.forEach(opt => {
            const btn = document.createElement('button');

            btn.className = 'opt-btn';
            btn.innerText = opt.text;
            btn.dataset.id = opt.id;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));

                btn.classList.add('selected');

                selectedValueSingle = opt.id;

                if (taskAnswered[currentTaskIndex]) {
                    taskAnswered[currentTaskIndex] = false;
                    userAnswers[currentTaskIndex] = null;

                    renderTaskNav();
                    updateActionBtn();
                    hideResult();

                    actionBtn.disabled = false;
                }
            });

            optionsContainer.appendChild(btn);
        });
    }
}

function updateFromUI() {
    if (!currentTask || currentTask.answer_type !== 'multiple') return;

    selectedValues = [];

    document.querySelectorAll('.opt-checkbox input').forEach(cb => {
        if (cb.checked) selectedValues.push(cb.value);
    });
}

function renderTaskNav() {
    taskNavPanel.innerHTML = '';

    for (let i = 0; i < tasksList.length; i++) {
        const btn = document.createElement('div');

        btn.className = 'task-nav-item';

        if (i === currentTaskIndex) btn.classList.add('current');

        if (reviewMode) {
            btn.classList.add(checkTaskCorrectness(i) ? 'correct' : 'wrong');
        } else if (taskAnswered[i]) {
            btn.classList.add('done');
        }

        btn.innerText = (i + 1).toString();

        btn.addEventListener('click', () => {
            if (i === currentTaskIndex) return;

            disableAnimationTemporarily(() => {
                currentTaskIndex = i;

                loadTaskByIndex();
                renderTaskNav();
                clearDrawing();
            });
        });

        taskNavPanel.appendChild(btn);
    }

    if (resultsTaskIndex !== -1) {
        const rb = document.createElement('div');

        rb.className = 'task-nav-item results';

        if (currentTaskIndex === resultsTaskIndex) rb.classList.add('current');

        rb.innerText = '📊';
        rb.title = 'Результаты';

        rb.addEventListener('click', () => {
            if (currentTaskIndex === resultsTaskIndex) return;

            disableAnimationTemporarily(() => {
                currentTaskIndex = resultsTaskIndex;

                loadTaskByIndex();
                renderTaskNav();
                clearDrawing();
            });
        });

        taskNavPanel.appendChild(rb);
    }
}

function updateNavButtons() {
    const total = tasksList.length + (resultsTaskIndex !== -1 ? 1 : 0);

    prevTaskBtn.disabled = currentTaskIndex === 0;
    nextTaskBtn.disabled = currentTaskIndex >= total - 1;
}

function updateActionBtn() {
    if (currentTaskIndex === resultsTaskIndex || reviewMode) {
        actionBtn.style.display = 'none';
        return;
    }

    actionBtn.style.display = '';

    const allDone = taskAnswered.every(Boolean);

    if (allDone && resultsTaskIndex === -1) {
        actionBtn.innerText = '🏁 Завершить тест';
        actionBtn.classList.add('finish-btn');
        actionBtn.disabled = false;
    } else {
        actionBtn.innerText = '✓ Ответить';
        actionBtn.classList.remove('finish-btn');
        actionBtn.disabled = !!taskAnswered[currentTaskIndex];
    }
}

function loadTaskByIndex() {
    showTaskLoading('Загружаем задачу…');

    requestAnimationFrame(() => {
        instantHideResult();

        if (currentTaskIndex === resultsTaskIndex) {
            numbersVisible = false;
            hideToggleNumbersButton();
            hideTaskLoading();
            showResultsScreen();
            return;
        }

        questionDiv.style.display = '';
        boardWrapper.style.display = '';
        optionsContainer.style.display = '';
        document.querySelector('.instruction-under-canvas').style.display = '';

        const old = document.querySelector('.results-container');

        if (old) old.remove();

        currentTask = tasksList[currentTaskIndex];

        canvas.classList.remove('correct', 'wrong');

        questionDiv.innerText = currentTask.question;

        renderOptions(currentTask, currentTaskIndex);

        if (!reviewMode) {
            const saved = userAnswers[currentTaskIndex];

            if (saved !== null && saved !== undefined) {
                if (currentTask.answer_type === 'multiple') {
                    document.querySelectorAll('.opt-checkbox input').forEach(cb => {
                        cb.checked = saved.includes(cb.value);

                        const label = cb.closest('.opt-checkbox');

                        if (label) {
                            label.classList.toggle('selected', cb.checked);
                        }
                    });

                    selectedValues = [...saved];
                } else {
                    document.querySelectorAll('.opt-btn').forEach(b => {
                        if (b.dataset.id === saved) {
                            b.classList.add('selected');
                            selectedValueSingle = saved;
                        } else {
                            b.classList.remove('selected');
                        }
                    });
                }

                showAcceptMessage();
            }
        }

        if (reviewMode) {
            numbersVisible = true;
        } else {
            numbersVisible = false;
            hideToggleNumbersButton();
        }

        redrawCurrent();
        updateActionBtn();
        updateNavButtons();

        requestAnimationFrame(hideTaskLoading);
    });
}

async function showResultsScreen() {
    hideTaskLoading();
    numbersVisible = false;
    hideToggleNumbersButton();

    questionDiv.style.display = 'none';
    boardWrapper.style.display = 'none';
    optionsContainer.style.display = 'none';
    document.querySelector('.instruction-under-canvas').style.display = 'none';

    const old = document.querySelector('.results-container');

    if (old) old.remove();

    const box = document.createElement('div');

    box.className = 'results-container';

    const sep = document.querySelector('.separator-line');

    if (sep && sep.parentNode) {
        sep.parentNode.insertBefore(box, sep);
    } else if (taskNavPanel) {
        taskNavPanel.insertAdjacentElement('afterend', box);
    }

    let ok = 0;

    for (let i = 0; i < tasksList.length; i++) {
        if (checkTaskCorrectness(i)) ok++;
    }

    const total = tasksList.length;
    const pct = Math.round(ok / total * 100);

    let msg = '';

    if (ok === total) msg = '🎉 Идеально! Поздравляем!';
    else if (ok >= total * 0.8) msg = '👍 Хороший результат!';
    else if (ok >= total * 0.5) msg = '💪 Неплохо, но можно лучше!';
    else msg = '📚 Повтори правила и возвращайся!';

    box.innerHTML = `
        <h2>📊 Результаты</h2>
        <p>Вы ответили на <strong>${ok}</strong> из <strong>${total}</strong> вопросов верно (${pct}%).</p>
        <div class="message">${msg}</div>
        <p style="font-size:0.8rem;color:#7d8f9b;margin-top:0.5rem" id="saveStatus"></p>
    `;

    currentTask = null;

    updateActionBtn();
    updateNavButtons();

    if (isTournamentMode && typeof saveStudentAnswer === 'function') {
        const statusEl = document.getElementById('saveStatus');

        if (statusEl) statusEl.innerText = 'Сохранение результатов…';

        try {
            const savePromises = tasksList.map((task, i) => {
                const ans = userAnswers[i];
                const correct = checkTaskCorrectness(i);
                const ansStr = Array.isArray(ans) ? ans.join(',') : (ans || '');

                return saveStudentAnswer(testId, studentId, i, ansStr, correct);
            });

            await Promise.allSettled(savePromises);

            if (statusEl) statusEl.innerText = '✅ Результаты сохранены.';
        } catch (e) {
            console.warn('Ошибка сохранения результатов:', e);

            if (statusEl) statusEl.innerText = '⚠️ Не удалось сохранить результаты.';
        }

        if (typeof saveStudentSession === 'function') {
            const sessionData = {
                tasks: tasksList,
                userAnswers: userAnswers,
                taskAnswered: taskAnswered,
                currentTaskIndex: currentTaskIndex
            };

            await saveStudentSession(testId, studentId, sessionData).catch(console.warn);
        }
    }
}

function createResultsTab() {
    if (resultsTaskIndex !== -1) return;

    resultsTaskIndex = tasksList.length;
    reviewMode = true;

    renderTaskNav();

    currentTaskIndex = resultsTaskIndex;

    loadTaskByIndex();
    updateNavButtons();
    renderTaskNav();

    actionBtn.style.display = 'none';
}

async function handleAction() {
    if (!currentTask) return;

    if (taskAnswered.every(Boolean) && resultsTaskIndex === -1) {
        createResultsTab();
        return;
    }

    if (currentTask.answer_type === 'multiple') {
        updateFromUI();

        if (!selectedValues.length) {
            showWarningMessage('⚠️ Выберите хотя бы один вариант');
            return;
        }
    } else {
        if (!selectedValueSingle) {
            showWarningMessage('⚠️ Выберите вариант ответа');
            return;
        }
    }

    const answer = currentTask.answer_type === 'multiple'
        ? [...selectedValues]
        : selectedValueSingle;

    const isCorrect = currentTask.answer_type === 'multiple'
        ? (
            new Set(currentTask.correct).size === new Set(answer).size &&
            [...new Set(answer)].every(v => currentTask.correct.includes(v))
        )
        : answer === currentTask.correct;

    userAnswers[currentTaskIndex] = answer;
    taskAnswered[currentTaskIndex] = true;

    renderTaskNav();
    updateActionBtn();
    showAcceptMessage();

    actionBtn.disabled = true;

    if (taskAnswered.every(Boolean)) updateActionBtn();

    if (isTournamentMode && typeof saveStudentAnswer === 'function') {
        saveStudentAnswer(testId, studentId, currentTaskIndex, JSON.stringify(answer), isCorrect).catch(console.warn);

        if (typeof saveStudentSession === 'function') {
            const sessionData = {
                tasks: tasksList,
                userAnswers: userAnswers,
                taskAnswered: taskAnswered,
                currentTaskIndex: currentTaskIndex
            };

            await saveStudentSession(testId, studentId, sessionData).catch(console.warn);
        }
    }
}

actionBtn.addEventListener('click', handleAction);

prevTaskBtn.addEventListener('click', () => {
    if (currentTaskIndex > 0) {
        disableAnimationTemporarily(() => {
            currentTaskIndex--;

            loadTaskByIndex();
            renderTaskNav();
            clearDrawing();
        });
    }
});

nextTaskBtn.addEventListener('click', () => {
    const total = tasksList.length + (resultsTaskIndex !== -1 ? 1 : 0);

    if (currentTaskIndex < total - 1) {
        disableAnimationTemporarily(() => {
            currentTaskIndex++;

            loadTaskByIndex();
            renderTaskNav();
            clearDrawing();
        });
    }
});

document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;

    if (e.key === 'ArrowLeft' && !prevTaskBtn.disabled) {
        e.preventDefault();
        prevTaskBtn.click();
    }

    if (e.key === 'ArrowRight' && !nextTaskBtn.disabled) {
        e.preventDefault();
        nextTaskBtn.click();
    }
});

async function startTournamentGame() {
    if (typeof loadTestConfig !== 'function') {
        document.getElementById('gameTitle').innerText = 'Ошибка';
        hideTaskLoading();
        questionDiv.innerText = '⚠️ Не найден файл js/cloud.js или функция loadTestConfig.';
        return;
    }

    let testConfig;
    let session;

    try {
        const result = await loadTestConfig(testId, studentId);

        testConfig = result.config;
        session = result.session;
    } catch (e) {
        console.error('Ошибка загрузки:', e);

        document.getElementById('gameTitle').innerText = 'Ошибка';
        hideTaskLoading();
        questionDiv.innerText = `⚠️ Не удалось загрузить тест: ${e.message}`;

        return;
    }

    if (!testConfig) {
        document.getElementById('gameTitle').innerText = 'Ошибка';
        hideTaskLoading();
        questionDiv.innerText = '⚠️ Конфигурация теста пуста. Проверьте testId.';

        return;
    }

    document.getElementById('gameTitle').innerText = testConfig.title || '🎲 Турнирный тест';
    questionDiv.innerText = 'Генерируем задачи…';
    showTaskLoading('Генерируем задачи…');

    let gamesConfig = [];

    if (Array.isArray(testConfig.games) && testConfig.games.length) {
        gamesConfig = testConfig.games;
    } else if (testConfig.games && typeof testConfig.games === 'object') {
        gamesConfig = Object.entries(testConfig.games).map(([id, tasks]) => ({
            id,
            tasks
        }));
    } else if (testConfig.gameId && testConfig.tasks) {
        gamesConfig = [{
            id: testConfig.gameId,
            tasks: testConfig.tasks
        }];
    }

    if (!gamesConfig.length) {
        hideTaskLoading();
        questionDiv.innerText = '⚠️ В конфигурации теста не указаны игры.';
        return;
    }

    if (session && session.tasks && session.tasks.length) {
        tasksList = session.tasks;
        userAnswers = session.userAnswers || new Array(tasksList.length).fill(null);
        taskAnswered = session.taskAnswered || new Array(tasksList.length).fill(false);
        currentTaskIndex = session.currentTaskIndex || 0;
        resultsTaskIndex = -1;
        reviewMode = false;
    } else {
        tasksList = await generateMixedTestSet(gamesConfig, !!testConfig.shuffle);

        if (!tasksList.length) {
            hideTaskLoading();
        questionDiv.innerText = '⚠️ Не удалось сгенерировать задачи. Проверьте конфигурацию.';
            return;
        }

        userAnswers = new Array(tasksList.length).fill(null);
        taskAnswered = new Array(tasksList.length).fill(false);
        currentTaskIndex = 0;
        resultsTaskIndex = -1;
        reviewMode = false;

        if (typeof saveStudentSession === 'function') {
            const sessionData = {
                tasks: tasksList,
                userAnswers: userAnswers,
                taskAnswered: taskAnswered,
                currentTaskIndex: currentTaskIndex
            };

            await saveStudentSession(testId, studentId, sessionData).catch(console.warn);
        }
    }

    if (taskAnswered.every(Boolean)) {
        resultsTaskIndex = tasksList.length;
        reviewMode = true;
        currentTaskIndex = resultsTaskIndex;
        renderTaskNav();

        await showResultsScreen();
        updateNavButtons();
        renderTaskNav();

        return;
    }

    renderTaskNav();
    loadTaskByIndex();
}

async function startGeneratedGame() {
    questionDiv.innerText = 'Генерируем задачи…';
    showTaskLoading('Генерируем задачи…');

    if (modeParam === 'mixed' || gamesParam) {
        let selectedGamesData = [];

        try {
            selectedGamesData = JSON.parse(gamesParam || '[]');
        } catch (e) {
            console.error(e);

            document.getElementById('gameTitle').innerText = 'Ошибка';
            hideTaskLoading();
        questionDiv.innerText = '⚠️ Не удалось прочитать параметры сборного теста.';

            return;
        }

        document.getElementById('gameTitle').innerText = 'Сборный тест';

        tasksList = await generateMixedTestSet(selectedGamesData, shuffleParam === '1');

        if (!tasksList.length) {
            hideTaskLoading();
        questionDiv.innerText = '⚠️ Не удалось сгенерировать сборный тест.';
            return;
        }
    } else {
        const gameId = gameParam;

        if (!gameId) {
            document.getElementById('gameTitle').innerText = 'Ошибка';
            hideTaskLoading();
        questionDiv.innerText = '⚠️ Не указана игра для теста.';
            return;
        }

        const config = await loadGameConfig(gameId);

        document.getElementById('gameTitle').innerText = `${config?.gameName || gameId} · тест`;

        tasksList = await generateSingleGameTestSet(
            gameId,
            modeParam || 'random',
            countParam || 10,
            typeParam,
            customParam,
            shuffleParam === '1'
        );

        if (!tasksList.length) {
            hideTaskLoading();
        questionDiv.innerText = '⚠️ Не удалось сгенерировать тест. Проверьте параметры.';
            return;
        }
    }

    userAnswers = new Array(tasksList.length).fill(null);
    taskAnswered = new Array(tasksList.length).fill(false);
    currentTaskIndex = 0;
    resultsTaskIndex = -1;
    reviewMode = false;

    renderTaskNav();
    loadTaskByIndex();
}

async function startGame() {
    if (isTournamentMode) {
        await startTournamentGame();
        return;
    }

    if (isGeneratedTestMode) {
        await startGeneratedGame();
        return;
    }

    document.getElementById('gameTitle').innerText = 'Ошибка';
    hideTaskLoading();
        questionDiv.innerText = '⚠️ Не указаны параметры теста. Откройте тест через test_setup.html.';
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(startGame, 0);
});
