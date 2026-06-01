const urlParams = new URLSearchParams(window.location.search);
const testId    = urlParams.get('testId');
const studentId = urlParams.get('studentId');

if (!testId || !studentId) {
    window.location.href = 'index.html';
}

localStorage.removeItem('globalBrushColor');
localStorage.removeItem('globalBrushPosIndex');

let tasksList        = [];
let userAnswers      = [];
let taskAnswered     = [];
let currentTaskIndex = 0;
let resultsTaskIndex = -1;
let reviewMode       = false;
let showAnswerImmediately = false;
let scoreEnabled = false;
let maxScore = 10;

const gameResourcesCache = {};

function beforeUnloadHandler(e) {
    if (resultsTaskIndex === -1 && !reviewMode && taskAnswered.some(Boolean)) {
        e.preventDefault();
        e.returnValue = '';
    }
}
window.addEventListener('beforeunload', beforeUnloadHandler);

const exitModal      = document.getElementById('exitConfirmModal');
const exitToMenuBtn  = document.getElementById('exitToMenuBtn');
const stayBtn        = document.getElementById('stayBtn');
const exitToMainBtn  = document.getElementById('exitToMainMenuBtn');
const exitModalClose = document.getElementById('exitModalClose');

function openExitModal()  { exitModal.style.display = 'flex'; }
function closeExitModal() { exitModal.style.display = 'none'; }

exitToMenuBtn.addEventListener('click', () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.location.href = 'index.html';
});
stayBtn.addEventListener('click', closeExitModal);
exitToMainBtn.addEventListener('click', () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.location.href = 'index.html';
});
exitModalClose.addEventListener('click', closeExitModal);
window.addEventListener('click', e => { if (e.target === exitModal) closeExitModal(); });
document.getElementById('backButton').addEventListener('click', e => { e.preventDefault(); openExitModal(); });

async function loadGameConfig(gameId) {
    try {
        const r = await fetch(`games/${gameId}/config.json`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
    } catch(e) {
        console.error(`loadGameConfig(${gameId}):`, e);
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
        const onLoad = () => { if (++done >= total) resolve(); };

        entry.fieldImg = new Image();
        entry.fieldImg.onload  = onLoad;
        entry.fieldImg.onerror = onLoad;
        entry.fieldImg.src = `${folder}${config.images?.board || 'pole.png'}`;

        entry.pieceImages = entry.pieceImages || {};
        pieceKeys.forEach(color => {
            const img = new Image();
            img.onload  = onLoad;
            img.onerror = onLoad;
            img.src = `${folder}${piecesConfig[color]}`;
            entry.pieceImages[color] = img;
        });

        if (pieceKeys.length === 0 && total === 1) {  }
    });
}

async function loadGameDataIsolated(gameId, config) {
    const taskFiles = config.taskFiles || ['task1.js'];
    const generators = {};
    let originalCenters  = {};
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
            const result  = new Function('window', 'pieceImages', jsText + ';\nreturn window;')(sandbox, sandboxPieceImages);
            if (result.taskGenerators) Object.assign(generators, result.taskGenerators);
            if (result.originalCenters && Object.keys(result.originalCenters).length > 0)
                Object.assign(originalCenters, result.originalCenters);
            if (typeof result.drawGreenNumbers === 'function')
                drawGreenNumbers = result.drawGreenNumbers;
        } catch(e) {
            console.warn(`Sandbox ${gameId}/${file}:`, e);
        }
    }
    return { generators, originalCenters, drawGreenNumbers };
}

async function loadGameResourcesCached(gameId) {
    if (gameResourcesCache[gameId]?.loaded) return gameResourcesCache[gameId];

    const config = await loadGameConfig(gameId);
    if (!config) return null;

    gameResourcesCache[gameId] = {
        fieldImg: null,
        pieceImages: {},
        originalCenters: {},
        drawGreenNumbers: null,
        config,
        cellsCount: config.cellsCount || 25,
        loaded: false
    };

    const [data] = await Promise.all([
        loadGameDataIsolated(gameId, config),
        loadImagesForGame(gameId, config),
    ]);

    gameResourcesCache[gameId].originalCenters  = data.originalCenters;
    gameResourcesCache[gameId].drawGreenNumbers = data.drawGreenNumbers;
    gameResourcesCache[gameId].loaded = true;

    return { generators: data.generators, ...gameResourcesCache[gameId] };
}

async function generateMixedTestSet(gamesConfig, shuffleFlag) {
    const allTasks = [];

    for (const item of gamesConfig) {
        await loadGameResourcesCached(item.id);

        const config = await loadGameConfig(item.id);
        if (!config) continue;
        const data = await loadGameDataIsolated(item.id, config);

        for (const [taskType, count] of Object.entries(item.tasks)) {
            const gen = data.generators[taskType];
            if (!gen) {
                console.warn(`Нет генератора "${taskType}" для игры "${item.id}"`);
                continue;
            }
            for (let i = 0; i < count; i++) {
                const task = gen();
                task._gameId = item.id;
                allTasks.push(task);
            }
        }
    }

    if (shuffleFlag) {
        for (let i = allTasks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTasks[i], allTasks[j]] = [allTasks[j], allTasks[i]];
        }
    }

    return allTasks;
}

const canvas      = document.getElementById('boardCanvas');
const ctx         = canvas.getContext('2d');
const questionDiv = document.getElementById('question');
const boardWrapper      = document.getElementById('boardWrapper');
const toggleBtn         = document.getElementById('toggleNumbersBtn');
const resultDiv         = document.getElementById('result');
const resultMessageSpan = document.getElementById('resultMessage');
const resultArrow       = document.getElementById('resultArrow');
const resultExpandPanel = document.getElementById('resultExpandPanel');
const optionsContainer  = document.getElementById('optionsContainer');
const actionBtn         = document.getElementById('actionBtn');
const prevTaskBtn       = document.getElementById('prevTaskBtn');
const nextTaskBtn       = document.getElementById('nextTaskBtn');
const taskNavPanel      = document.getElementById('taskNavPanel');

let currentTask         = null;
let selectedValues      = [];
let selectedValueSingle = null;
let warningTimer        = null;
let resultExpanded      = false;
let numbersVisible      = false;

function getResources(task) {
    if (task?._gameId && gameResourcesCache[task._gameId]?.loaded)
        return gameResourcesCache[task._gameId];
    return null;
}

function drawNative(task, position, highlights, greenNumbers, showCellNumbers, highlightedCell, targets) {
    const res = getResources(task);
    if (!res?.fieldImg?.complete || !res.fieldImg.naturalWidth) return;
    const oc = res.originalCenters;
    if (!oc || !Object.keys(oc).length) return;

	canvas.width  = res.fieldImg.width;
	canvas.height = res.fieldImg.height;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	ctx.drawImage(res.fieldImg, 0, 0);

    const pieceSize = 72.2835 * 4, half = pieceSize / 2;

    for (const cs in position) {
        const orig = oc[parseInt(cs, 10)]; if (!orig) continue;
        const img  = res.pieceImages[position[cs]];
        if (!img?.complete) continue;
        ctx.drawImage(img, orig.x - half, orig.y - half, pieceSize, pieceSize);
    }

    if (highlightedCell && oc[highlightedCell]) {
        const orig = oc[highlightedCell];
        ctx.beginPath(); ctx.arc(orig.x, orig.y, pieceSize/2+6, 0, 2*Math.PI);
        ctx.fillStyle = 'rgba(255,255,0,0.45)'; ctx.fill();
        ctx.strokeStyle = 'gold'; ctx.lineWidth = 3; ctx.stroke();
    }

    if (highlights) {
        for (const cn in highlights) {
            ctx.fillStyle = cn === 'red' ? 'rgba(255,80,80,0.45)' : 'rgba(80,255,80,0.45)';
            for (const cs of highlights[cn]) {
                const orig = oc[parseInt(cs, 10)]; if (!orig) continue;
                ctx.beginPath(); ctx.arc(orig.x, orig.y, pieceSize/2+4, 0, 2*Math.PI); ctx.fill();
            }
        }
    }

    if (greenNumbers && res.drawGreenNumbers)
        res.drawGreenNumbers(ctx, oc, greenNumbers, pieceSize);

    if (targets) {
        ctx.font = `bold ${Math.floor(pieceSize*0.35)}px "Inter",system-ui`;
        ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const cs in targets) {
            const orig = oc[parseInt(cs, 10)]; if (!orig) continue;
            ctx.fillStyle = 'white'; ctx.fillRect(orig.x-12, orig.y-12, 24, 24);
            ctx.fillStyle = 'black'; ctx.fillText(targets[cs], orig.x, orig.y);
        }
    }

    if (showCellNumbers) {
        const cell1 = oc[1];
        const cell2 = oc[2];
        const maxCell = Number(res.cellsCount) || Math.max(...Object.keys(oc).map(Number));
        const isDablotGame = task?._gameId === 'dablot' || res.config?.gameId === 'dablot';
        const drawSettings = {
            ...(res.config?.drawSettings || {}),
            ...(task?.drawSettings || {})
        };

        let fontSize = isDablotGame ? 70 : Math.floor(pieceSize * 0.3);

        if (cell1 && cell2) {
            const dx = cell2.x - cell1.x;
            const dy = cell2.y - cell1.y;
            const cellDist = Math.hypot(dx, dy);

            if (!isDablotGame) {
                fontSize = Math.floor(cellDist * 0.3);
            }
        }

        fontSize = Number(drawSettings.numberFontSize) || fontSize;

        ctx.font = `bold ${fontSize}px "Inter",system-ui`;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const skipPositionNumbers = new Set(
            (task?.skipPositionNumbers || []).map(Number)
        );

        for (let i = 1; i <= maxCell; i++) {
            if (skipPositionNumbers.has(i)) continue;

            const orig = oc[i];

            if (!orig) continue;

            ctx.fillText(i.toString(), orig.x, orig.y);
        }

        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

function isNumbersToggleAllowed() {
    return !!(
        currentTask &&
        currentTaskIndex !== resultsTaskIndex &&
        taskAnswered[currentTaskIndex] &&
        (reviewMode || showAnswerImmediately)
    );
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

function updateNumbersToggleButton() {
    if (!toggleBtn) return;

    if (!isNumbersToggleAllowed()) {
        toggleBtn.style.display = 'none';
        return;
    }

    toggleBtn.style.display = 'flex';
    toggleBtn.innerHTML = numbersVisible ? '🚫' : '👁️';

    requestAnimationFrame(positionToggleNumbersBtn);
}

function redrawCurrent() {
    if (!currentTask) {
        updateNumbersToggleButton();
        return;
    }

    drawNative(
        currentTask,
        currentTask.position        || {},
        currentTask.highlights      || {},
        currentTask.green_numbers   || null,
        isNumbersToggleAllowed() && numbersVisible,
        currentTask.highlighted_cell|| null,
        currentTask.targets         || null
    );
    if ((reviewMode || showAnswerImmediately) && taskAnswered[currentTaskIndex]) {
        const ok = checkTaskCorrectness(currentTaskIndex);
        canvas.classList.toggle('correct', !!ok);
        canvas.classList.toggle('wrong',   !ok);
    }

    updateNumbersToggleButton();
}

function toggleNumbers() {
    if (!isNumbersToggleAllowed()) return;

    numbersVisible = !numbersVisible;
    redrawCurrent();
}

const modal         = document.getElementById('imageModal');
const modalImg      = document.getElementById('modalImage');
const zoomContainer = document.getElementById('zoomContainer');
const imageStage    = document.getElementById('imageStage');
const closeBtn      = document.getElementById('closeModalBtn');
const zoomInBtn     = document.getElementById('zoomInBtn');
const zoomOutBtn    = document.getElementById('zoomOutBtn');
const clearDrawBtn  = document.getElementById('clearDrawBtn');
const drawCanvasEl  = document.getElementById('drawCanvas');
const drawCtx       = drawCanvasEl.getContext('2d');
const isDesktopLike = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let currentScale = 1, MIN_SCALE = 0.6, MAX_SCALE = isDesktopLike ? 1 : 3;
let strokes = [], currentStroke = null, isDrawing = false, drawingPointerId = null;
let isPinching = false, initialDistance = 0, initialScale = 1;
let currentDrawColor = '#ffffff', currentBrushSize = 8, isDraggingThumb = false;

const sliderTrack = document.getElementById('sliderTrack');
const sliderThumb = document.getElementById('sliderThumb');
const positions   = [0, 25, 50, 75, 100];
let brushSizes    = [4, 10, 18, 28, 40], currentPosIndex = 1;

function setBrushByIndex(idx) {
    idx = Math.max(0, Math.min(positions.length - 1, idx));
    currentPosIndex = idx;
    sliderThumb.style.left = `${positions[idx]}%`;
    currentBrushSize = brushSizes[idx];
    const sz = Math.min(32, 20 * (0.5 + currentBrushSize / 80));
    sliderThumb.style.width = sliderThumb.style.height = `${sz}px`;
}
function updateBrushSizes() {
    const base = Math.max(6, drawCanvasEl.width * 0.007);
    brushSizes = [0.4, 1.0, 1.8, 2.8, 4.0].map(m => Math.min(80, Math.max(4, Math.round(base * m))));
    setBrushByIndex(currentPosIndex);
}
function snapToNearest(pct) {
    let n = 0, md = Math.abs(pct - positions[0]);
    for (let i = 1; i < positions.length; i++) {
        const d = Math.abs(pct - positions[i]);
        if (d < md) { md = d; n = i; }
    }
    setBrushByIndex(n);
}
function handleSlider(cx) {
    const r = sliderTrack.getBoundingClientRect();
    snapToNearest(Math.min(100, Math.max(0, (cx - r.left) / r.width * 100)));
}

sliderTrack.addEventListener('click', e => { e.stopPropagation(); handleSlider(e.clientX); });
document.querySelectorAll('.slider-mark').forEach(m => {
    m.addEventListener('click', e => { e.stopPropagation(); snapToNearest(parseFloat(m.style.left)); });
});

function onTMove(e) {
    if (!isDraggingThumb) return;
    e.preventDefault();
    handleSlider(e.touches ? e.touches[0].clientX : e.clientX);
}
function onTEnd() {
    if (!isDraggingThumb) return;
    isDraggingThumb = false;
    document.removeEventListener('mousemove', onTMove);
    document.removeEventListener('mouseup',   onTEnd);
    document.removeEventListener('touchmove', onTMove);
    document.removeEventListener('touchend',  onTEnd);
}
sliderThumb.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation(); isDraggingThumb = true;
    document.addEventListener('mousemove', onTMove);
    document.addEventListener('mouseup',   onTEnd);
});
sliderThumb.addEventListener('touchstart', e => {
    e.preventDefault(); e.stopPropagation(); isDraggingThumb = true;
    document.addEventListener('touchmove', onTMove, { passive: false });
    document.addEventListener('touchend',  onTEnd);
});

const colorIndicatorBtn = document.getElementById('colorIndicator');
const drawToolsPanel    = document.getElementById('drawToolsPanel');
colorIndicatorBtn.addEventListener('click', e => { e.stopPropagation(); drawToolsPanel.classList.toggle('show'); });
document.addEventListener('click', e => {
    if (!drawToolsPanel.contains(e.target) && e.target !== colorIndicatorBtn)
        drawToolsPanel.classList.remove('show');
});
document.querySelectorAll('#colorPalette .color-circle').forEach(c => {
    c.addEventListener('click', e => {
        e.stopPropagation();
        currentDrawColor = c.dataset.color;
        colorIndicatorBtn.style.backgroundColor = currentDrawColor;
        drawToolsPanel.classList.remove('show');
    });
});
colorIndicatorBtn.style.backgroundColor = currentDrawColor;
setBrushByIndex(currentPosIndex);

function updateZoom() {
    zoomOutBtn.disabled = currentScale <= MIN_SCALE + 0.001;
    zoomInBtn.disabled  = currentScale >= MAX_SCALE - 0.001;
}
function updateScale(s) {
    currentScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
    zoomContainer.style.transform = `scale(${currentScale})`;
    updateZoom();
}
function preventScroll(e) { e.preventDefault(); }
function handleWheel(e) {
    if (modal.style.display !== 'flex') return;
    e.preventDefault();
    updateScale(currentScale + (e.deltaY < 0 ? 0.12 : -0.12));
}
function getTDist(e) {
    return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
    );
}
function onTS(e) {
    if (modal.style.display !== 'flex' || e.touches.length !== 2) return;
    e.preventDefault(); isPinching = true; cancelDraw();
    initialDistance = getTDist(e); initialScale = currentScale;
}
function onTM(e) {
    if (modal.style.display !== 'flex' || e.touches.length !== 2) return;
    e.preventDefault();
    if (initialDistance > 0) updateScale(initialScale * (getTDist(e) / initialDistance));
}
function onTE(e) {
    if (e.touches.length < 2) { initialDistance = 0; initialScale = currentScale; isPinching = false; }
}

function syncCanvas() {
    if (!modalImg.naturalWidth) return;
    drawCanvasEl.width  = modalImg.naturalWidth;
    drawCanvasEl.height = modalImg.naturalHeight;
    redrawStrokes(); updateBrushSizes();
}
function redrawStrokes() {
    drawCtx.clearRect(0, 0, drawCanvasEl.width, drawCanvasEl.height);
    drawCtx.lineCap = 'round'; drawCtx.lineJoin = 'round';
    for (const st of strokes) {
        if (!st.points.length) continue;
        drawCtx.beginPath();
        drawCtx.strokeStyle = st.color; drawCtx.lineWidth = st.width;
        drawCtx.moveTo(st.points[0].x, st.points[0].y);
        for (let i = 1; i < st.points.length; i++) drawCtx.lineTo(st.points[i].x, st.points[i].y);
        drawCtx.stroke();
    }
}
function getCP(e) {
    const r = drawCanvasEl.getBoundingClientRect();
    return {
        x: (e.clientX - r.left) * (drawCanvasEl.width  / r.width),
        y: (e.clientY - r.top)  * (drawCanvasEl.height / r.height)
    };
}
function startDraw(e) {
    if (modal.style.display !== 'flex' || isPinching) return;
    e.preventDefault(); isDrawing = true; drawingPointerId = e.pointerId;
    if (drawCanvasEl.setPointerCapture) drawCanvasEl.setPointerCapture(e.pointerId);
    const p = getCP(e);
    currentStroke = { color: currentDrawColor, width: currentBrushSize, points: [p] };
    strokes.push(currentStroke); redrawStrokes();
}
function moveDraw(e) {
    if (!isDrawing || e.pointerId !== drawingPointerId) return;
    e.preventDefault();
    const p = getCP(e), last = currentStroke.points[currentStroke.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
    currentStroke.points.push({ x: last.x + (p.x - last.x) * 0.55, y: last.y + (p.y - last.y) * 0.55 });
    redrawStrokes();
}
function stopDraw(e) {
    if (e.pointerId !== drawingPointerId) return;
    if (drawCanvasEl.releasePointerCapture && drawCanvasEl.hasPointerCapture(e.pointerId))
        drawCanvasEl.releasePointerCapture(e.pointerId);
    isDrawing = false; drawingPointerId = null; currentStroke = null;
}
function cancelDraw() { isDrawing = false; drawingPointerId = null; currentStroke = null; }
function clearDrawing() { strokes = []; redrawStrokes(); }

function openModal() {
    modalImg.onload = () => syncCanvas();
    modalImg.src = canvas.toDataURL('image/png');
    updateScale(1); modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', onTS, { passive: false });
    document.addEventListener('touchmove',  onTM, { passive: false });
    document.addEventListener('touchend',   onTE);
    document.addEventListener('touchcancel',onTE);
}
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.body.removeEventListener('touchmove', preventScroll);
    window.removeEventListener('wheel', handleWheel);
    document.removeEventListener('touchstart', onTS);
    document.removeEventListener('touchmove',  onTM);
    document.removeEventListener('touchend',   onTE);
    document.removeEventListener('touchcancel',onTE);
    cancelDraw(); modalImg.src = '';
}

drawCanvasEl.addEventListener('pointerdown',  startDraw);
drawCanvasEl.addEventListener('pointermove',  moveDraw);
drawCanvasEl.addEventListener('pointerup',    stopDraw);
drawCanvasEl.addEventListener('pointercancel',stopDraw);

modal.addEventListener('click', e => {
    if (isDraggingThumb) return;
    if (e.target === modal || e.target === modalImg || e.target === zoomContainer || e.target === imageStage)
        closeModal();
});
closeBtn.addEventListener('click',    e => { e.stopPropagation(); closeModal(); });
zoomInBtn.addEventListener('click',   e => { e.stopPropagation(); if (!zoomInBtn.disabled)  updateScale(currentScale + 0.15); });
zoomOutBtn.addEventListener('click',  e => { e.stopPropagation(); if (!zoomOutBtn.disabled) updateScale(currentScale - 0.15); });
clearDrawBtn.addEventListener('click',e => { e.stopPropagation(); clearDrawing(); });
document.addEventListener('keydown',  e => { if (e.key === 'Escape' && modal.style.display === 'flex') closeModal(); });
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
    NO_TR.forEach(f => { const el = f(); if (el) el.classList.add('no-transition'); });
    cb();
    updateNavButtons();
    requestAnimationFrame(() => requestAnimationFrame(() => {
        NO_TR.forEach(f => { const el = f(); if (el) el.classList.remove('no-transition'); });
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
    if (explanation?.trim()) resultDiv.classList.add('expandable');
    resultArrow.classList.remove('rotated');
    resultExpandPanel.classList.remove('expanded');
    resultExpanded = false;
    if (autoHide) warningTimer = setTimeout(() => hideResult(), 3000);
}
function showAcceptMessage() {
    showResult('Ответ принят', 'accept', '', false);
    setAnswerAcceptedVisualState(true);
}
function showWarningMessage(m) { showResult(m, 'info', '', true); }

resultDiv.querySelector('.result-summary').addEventListener('click', e => {
    e.stopPropagation();
    if (!resultDiv.classList.contains('expandable')) return;
    resultExpanded = !resultExpanded;
    resultArrow.classList.toggle('rotated', resultExpanded);
    resultExpandPanel.classList.toggle('expanded', resultExpanded);
    if (resultExpandPanel.classList.contains('expanded') && window.innerWidth <= 550)
        setTimeout(() => resultExpandPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
});

function checkTaskCorrectness(idx) {
    const task = tasksList[idx], ans = userAnswers[idx];
    if (ans === null || ans === undefined) return false;
    if (task.answer_type === 'multiple') {
        const cs = new Set(task.correct), as = new Set(ans);
        return as.size === cs.size && [...as].every(v => cs.has(v));
    }
    return ans === task.correct;
}

function getCorrectAnswerText(task) {
    if (!task) return '';
    return task.answer_type === 'multiple' ? task.correct.join(', ') : task.correct;
}

function normalizeScoreValue(value, fallback = 10) {
    const num = Number(value);

    if (!Number.isFinite(num)) return fallback;

    return Math.max(0, Math.min(100, Math.round(num)));
}

function formatScoreValue(value) {
    const num = Number(value) || 0;

    if (Number.isInteger(num)) return String(num);

    return String(Math.round(num * 10) / 10).replace('.', ',');
}

function buildFinalResultSummary() {
    let correctCount = 0;

    for (let i = 0; i < tasksList.length; i++) {
        if (checkTaskCorrectness(i)) correctCount++;
    }

    const totalTasks = tasksList.length;
    const percent = totalTasks > 0 ? Math.round(correctCount / totalTasks * 100) : 0;
    const normalizedMaxScore = normalizeScoreValue(maxScore, 10);
    const score = scoreEnabled && totalTasks > 0
        ? Math.round((correctCount / totalTasks) * normalizedMaxScore * 10) / 10
        : 0;

    return {
        correctCount,
        totalTasks,
        percent,
        scoreEnabled: !!scoreEnabled,
        score,
        maxScore: normalizedMaxScore
    };
}

function buildSessionPayload() {
    return {
        tasks: tasksList,
        userAnswers: userAnswers,
        taskAnswered: taskAnswered,
        finalResult: tasksList.length ? buildFinalResultSummary() : null
    };
}

async function saveFinalResultToCloud(summary) {
    if (!summary || !testId || !studentId) return null;

    if (typeof saveStudentFinalResult === 'function') {
        return saveStudentFinalResult(testId, studentId, summary);
    }

    if (typeof SCRIPT_URL === 'undefined') {
        return null;
    }

    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'saveFinalResult',
            testId,
            studentId,
            correctCount: summary.correctCount,
            totalTasks: summary.totalTasks,
            percent: summary.percent,
            scoreEnabled: summary.scoreEnabled,
            score: summary.score,
            maxScore: summary.maxScore,
            finalResult: summary
        })
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Не удалось сохранить итоговый результат');
    }

    return data;
}

async function saveFinalResultIfNeeded() {
    if (!tasksList.length) return null;

    const summary = buildFinalResultSummary();

    try {
        return await saveFinalResultToCloud(summary);
    } catch (error) {
        console.warn('Итоговый результат не сохранён отдельным действием:', error);
        return null;
    }
}

function showImmediateAnswerResult(idx) {
    if (!currentTask) return;

    const ok = checkTaskCorrectness(idx);

    canvas.classList.toggle('correct', !!ok);
    canvas.classList.toggle('wrong', !ok);

    if (ok) {
        showResult('✅ Верно! Отличная работа.', 'correct', currentTask.explanation || '');
    } else {
        showResult(`❌ Неверно. Правильный ответ: ${getCorrectAnswerText(currentTask)}`, 'wrong', currentTask.explanation || '');
    }

    setAnswerAcceptedVisualState(true);
    numbersVisible = true;
    redrawCurrent();
}

function resetCurrentAnswerForEditing() {
    if (!taskAnswered[currentTaskIndex]) return;

    taskAnswered[currentTaskIndex] = false;
    userAnswers[currentTaskIndex] = null;
    numbersVisible = false;

    canvas.classList.remove('correct', 'wrong');
    hideResult();
    updateNumbersToggleButton();
    renderTaskNav();
    updateActionBtn();
    actionBtn.disabled = false;

    saveStudentSession(testId, studentId, buildSessionPayload())
        .catch(e => console.warn('Ошибка сохранения сессии после изменения ответа:', e));
}

function saveCurrentAnswerToCloud(answer, isCorrect) {
    const ansStr = Array.isArray(answer) ? answer.join(',') : (answer || '');

    saveStudentAnswer(testId, studentId, currentTaskIndex, ansStr, isCorrect)
        .catch(e => console.warn('Ошибка сохранения ответа:', e));

    saveStudentSession(testId, studentId, buildSessionPayload())
        .catch(e => console.warn('Ошибка сохранения сессии:', e));

    if (resultsTaskIndex !== -1 || reviewMode) {
        saveFinalResultIfNeeded();
    }
}

function renderOptions(task, idx) {
    optionsContainer.innerHTML = '';
    setAnswerAcceptedVisualState(false);

    const savedAnswer = userAnswers[idx];
    const allowEditingInReview = reviewMode && showAnswerImmediately;

    if (reviewMode && !allowEditingInReview) {
        const ua = savedAnswer, ok = checkTaskCorrectness(idx);
        if (task.answer_type === 'multiple') {
            task.options.forEach(opt => {
                const wrap = document.createElement('div'); wrap.className = 'opt-checkbox';
                const cb   = document.createElement('input'); cb.type = 'checkbox'; cb.disabled = true;
                cb.checked = !!(ua && ua.includes(opt.id));
                if (cb.checked) wrap.classList.add('selected');
                const sp   = document.createElement('span'); sp.innerText = opt.text;
                wrap.appendChild(cb); wrap.appendChild(sp); optionsContainer.appendChild(wrap);
            });
        } else {
            task.options.forEach(opt => {
                const btn = document.createElement('button'); btn.className = 'opt-btn';
                btn.innerText = opt.text; btn.disabled = true;
                if (ua === opt.id) btn.classList.add('selected');
                optionsContainer.appendChild(btn);
            });
        }
        if (ok) showResult('✅ Верно! Отличная работа.', 'correct', task.explanation || '');
        else showResult(`❌ Неверно. Правильный ответ: ${getCorrectAnswerText(task)}`, 'wrong', task.explanation || '');
        return;
    }

    selectedValues = [];
    selectedValueSingle = null;

    if (task.answer_type === 'multiple') {
        task.options.forEach(opt => {
            const label = document.createElement('label'); label.className = 'opt-checkbox';
            const cb    = document.createElement('input'); cb.type = 'checkbox'; cb.value = opt.id;

            if (Array.isArray(savedAnswer) && savedAnswer.includes(opt.id)) {
                cb.checked = true;
                label.classList.add('selected');
                selectedValues.push(opt.id);
            }

            cb.addEventListener('change', () => {
                updateFromUI();
                label.classList.toggle('selected', cb.checked);
                resetCurrentAnswerForEditing();
            });
            const sp = document.createElement('span'); sp.innerText = opt.text;
            label.appendChild(cb); label.appendChild(sp); optionsContainer.appendChild(label);
        });
    } else {
        task.options.forEach(opt => {
            const btn = document.createElement('button'); btn.className = 'opt-btn';
            btn.innerText = opt.text; btn.dataset.id = opt.id;

            if (savedAnswer === opt.id) {
                btn.classList.add('selected');
                selectedValueSingle = opt.id;
            }

            btn.addEventListener('click', () => {
                document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedValueSingle = opt.id;
                resetCurrentAnswerForEditing();
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
        const btn = document.createElement('div'); btn.className = 'task-nav-item';
        if (i === currentTaskIndex) btn.classList.add('current');
        if ((reviewMode || showAnswerImmediately) && taskAnswered[i]) btn.classList.add(checkTaskCorrectness(i) ? 'correct' : 'wrong');
        else if (taskAnswered[i]) btn.classList.add('done');
        btn.innerText = (i + 1).toString();
        btn.addEventListener('click', () => {
            if (i === currentTaskIndex) return;
            disableAnimationTemporarily(() => {
                currentTaskIndex = i; loadTaskByIndex(); renderTaskNav(); clearDrawing();
            });
        });
        taskNavPanel.appendChild(btn);
    }
    if (resultsTaskIndex !== -1) {
        const rb = document.createElement('div'); rb.className = 'task-nav-item results';
        if (currentTaskIndex === resultsTaskIndex) rb.classList.add('current');
        rb.innerText = '📊'; rb.title = 'Результаты';
        rb.addEventListener('click', () => {
            if (currentTaskIndex === resultsTaskIndex) return;
            disableAnimationTemporarily(() => {
                currentTaskIndex = resultsTaskIndex; loadTaskByIndex(); renderTaskNav(); clearDrawing();
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
    if (currentTaskIndex === resultsTaskIndex || (reviewMode && !showAnswerImmediately)) {
        actionBtn.style.display = 'none'; return;
    }
    actionBtn.style.display = '';
    const allDone = taskAnswered.every(Boolean);
    if (!reviewMode && allDone && resultsTaskIndex === -1) {
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
    instantHideResult();

    if (currentTaskIndex === resultsTaskIndex) {
        showResultsScreen();
        return;
    }

    questionDiv.style.display    = '';
    boardWrapper.style.display   = '';
    optionsContainer.style.display = '';
    document.querySelector('.instruction-under-canvas').style.display = '';
    const old = document.querySelector('.results-container'); if (old) old.remove();

    currentTask = tasksList[currentTaskIndex];

    if (!isNumbersToggleAllowed()) {
        numbersVisible = false;
        updateNumbersToggleButton();
    }

    canvas.classList.remove('correct', 'wrong');
    questionDiv.innerText = currentTask.question;
    renderOptions(currentTask, currentTaskIndex);

    if (taskAnswered[currentTaskIndex]) {
        if (showAnswerImmediately || reviewMode) {
            showImmediateAnswerResult(currentTaskIndex);
        } else {
            showAcceptMessage();
        }
    }

    redrawCurrent();
    updateActionBtn();
    updateNavButtons();
}

async function showResultsScreen() {
    questionDiv.style.display      = 'none';
    boardWrapper.style.display     = 'none';
    optionsContainer.style.display = 'none';
    if (toggleBtn) toggleBtn.style.display = 'none';
    document.querySelector('.instruction-under-canvas').style.display = 'none';
    const old = document.querySelector('.results-container'); if (old) old.remove();

    const box = document.createElement('div'); box.className = 'results-container';
    document.querySelector('.separator-line').parentNode
        .insertBefore(box, document.querySelector('.separator-line'));

    const finalSummary = buildFinalResultSummary();
    const ok = finalSummary.correctCount;
    const total = finalSummary.totalTasks;
    const pct = finalSummary.percent;

    let msg = '';
    if (ok === total)          msg = '🎉 Идеально! Поздравляем!';
    else if (ok >= total*0.8)  msg = '👍 Хороший результат!';
    else if (ok >= total*0.5)  msg = '💪 Неплохо, но можно лучше!';
    else                       msg = '📚 Повтори правила и возвращайся!';

    const scoreHtml = finalSummary.scoreEnabled
        ? `<p>Баллы: <strong>${formatScoreValue(finalSummary.score)}</strong> из <strong>${formatScoreValue(finalSummary.maxScore)}</strong>.</p>`
        : '';

    box.innerHTML = `
        <h2>📊 Результаты</h2>
        <p>Вы ответили на <strong>${ok}</strong> из <strong>${total}</strong> верно (${pct}%).</p>
        ${scoreHtml}
        <div class="message">${msg}</div>
        <p style="font-size:0.8rem;color:#7d8f9b;margin-top:0.5rem" id="saveStatus">Сохранение результатов…</p>
    `;

    currentTask = null;
    updateActionBtn(); updateNavButtons();

    try {
        await Promise.allSettled(tasksList.map((task, i) => {
            const ans    = userAnswers[i];
            const ansStr = Array.isArray(ans) ? ans.join(',') : (ans || '');
            return saveStudentAnswer(testId, studentId, i, ansStr, checkTaskCorrectness(i));
        }));

        await saveStudentSession(testId, studentId, buildSessionPayload()).catch(e => {
            console.warn('Не удалось сохранить итог в сессии:', e);
        });

        await saveFinalResultIfNeeded();

        const el = document.getElementById('saveStatus');
        if (el) el.innerText = '✅ Результаты сохранены.';
    } catch(e) {
        console.warn('Ошибка сохранения результатов:', e);
        const el = document.getElementById('saveStatus');
        if (el) el.innerText = '⚠️ Не удалось сохранить результаты.';
    }
}

function createResultsTab() {
    if (resultsTaskIndex !== -1) return;
    resultsTaskIndex = tasksList.length;
    reviewMode = true;
    numbersVisible = true;
    renderTaskNav();
    currentTaskIndex = resultsTaskIndex;
    loadTaskByIndex();
    updateNavButtons(); renderTaskNav();
    actionBtn.style.display = 'none';
}

function handleAction() {
    if (!currentTask) return;

    if (taskAnswered.every(Boolean) && resultsTaskIndex === -1) {
        createResultsTab(); return;
    }

    if (currentTask.answer_type === 'multiple') {
        updateFromUI();
        if (!selectedValues.length) { showWarningMessage('⚠️ Выберите хотя бы один вариант'); return; }
    } else {
        if (!selectedValueSingle) { showWarningMessage('⚠️ Выберите вариант ответа'); return; }
    }

    const answer = currentTask.answer_type === 'multiple' ? [...selectedValues] : selectedValueSingle;
    userAnswers[currentTaskIndex]  = answer;
    taskAnswered[currentTaskIndex] = true;

    const isCorrect = checkTaskCorrectness(currentTaskIndex);

    if (showAnswerImmediately || reviewMode) {
        showImmediateAnswerResult(currentTaskIndex);
    } else {
        showAcceptMessage();
    }

    renderTaskNav();
    updateActionBtn();
    actionBtn.disabled = true;
    if (taskAnswered.every(Boolean)) updateActionBtn();

    saveCurrentAnswerToCloud(answer, isCorrect);
}

actionBtn.addEventListener('click', handleAction);

prevTaskBtn.addEventListener('click', () => {
    if (currentTaskIndex > 0)
        disableAnimationTemporarily(() => {
            currentTaskIndex--; loadTaskByIndex(); renderTaskNav(); clearDrawing();
        });
});
nextTaskBtn.addEventListener('click', () => {
    const total = tasksList.length + (resultsTaskIndex !== -1 ? 1 : 0);
    if (currentTaskIndex < total - 1)
        disableAnimationTemporarily(() => {
            currentTaskIndex++; loadTaskByIndex(); renderTaskNav(); clearDrawing();
        });
});
document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowLeft'  && !prevTaskBtn.disabled) { e.preventDefault(); prevTaskBtn.click(); }
    if (e.key === 'ArrowRight' && !nextTaskBtn.disabled) { e.preventDefault(); nextTaskBtn.click(); }
});

async function startGame() {
    let testConfig   = null;
    let savedSession = null;

    try {
        const result = await loadTestConfig(testId, studentId);
        testConfig   = result.config;
        savedSession = result.session;
    } catch(e) {
        console.error('Ошибка loadTestConfig:', e);
        document.getElementById('gameTitle').innerText = 'Ошибка';
        questionDiv.innerText = `⚠️ Не удалось загрузить тест: ${e.message}`;
        return;
    }

    if (!testConfig) {
        document.getElementById('gameTitle').innerText = 'Ошибка';
        questionDiv.innerText = '⚠️ Конфигурация теста пуста. Проверьте testId.';
        return;
    }

    document.getElementById('gameTitle').innerText = testConfig.title || '🎲 Турнирный тест';
    showAnswerImmediately = testConfig.showAnswerImmediately === true;
    scoreEnabled = testConfig.scoreEnabled === true;
    maxScore = normalizeScoreValue(testConfig.maxScore, 10);

    if (savedSession && Array.isArray(savedSession.tasks) && savedSession.tasks.length > 0) {
        questionDiv.innerText = 'Восстановление теста…';

        tasksList    = savedSession.tasks;
        userAnswers  = savedSession.userAnswers  || new Array(tasksList.length).fill(null);
        taskAnswered = savedSession.taskAnswered || new Array(tasksList.length).fill(false);

        const gameIds = [...new Set(tasksList.map(t => t._gameId).filter(Boolean))];
        await Promise.all(gameIds.map(gid => loadGameResourcesCached(gid)));

        resultsTaskIndex = -1;
        reviewMode       = false;
        currentTaskIndex = 0;
        renderTaskNav();
        loadTaskByIndex();
        return;
    }

    questionDiv.innerText = 'Загрузка ресурсов…';

    let gamesConfig = [];
    if (Array.isArray(testConfig.games) && testConfig.games.length) {
        gamesConfig = testConfig.games;
    } else if (testConfig.games && typeof testConfig.games === 'object') {
        gamesConfig = Object.entries(testConfig.games).map(([id, tasks]) => ({ id, tasks }));
    } else if (testConfig.gameId && testConfig.tasks) {
        gamesConfig = [{ id: testConfig.gameId, tasks: testConfig.tasks }];
    }

    if (!gamesConfig.length) {
        questionDiv.innerText = '⚠️ В конфигурации теста не указаны игры.';
        return;
    }

    tasksList = await generateMixedTestSet(gamesConfig, !!testConfig.shuffle);

    if (!tasksList.length) {
        questionDiv.innerText = '⚠️ Не удалось сгенерировать задачи. Проверьте конфигурацию.';
        return;
    }

    userAnswers      = new Array(tasksList.length).fill(null);
    taskAnswered     = new Array(tasksList.length).fill(false);
    resultsTaskIndex = -1;
    reviewMode       = false;
    currentTaskIndex = 0;

    try {
        await saveStudentSession(testId, studentId, buildSessionPayload());
    } catch(e) {
        console.warn('Не удалось сохранить начальную сессию:', e);
    }

    renderTaskNav();
    loadTaskByIndex();
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(startGame, 0);
});
