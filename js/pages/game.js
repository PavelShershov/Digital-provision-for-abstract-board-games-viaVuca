ViaVucaParticles.create({ count: 45, maxOpacity: 0.38 });

    const urlParams = new URLSearchParams(window.location.search);
    const game = urlParams.get('game') || 'alquerque';
    const testMode = urlParams.get('mode') === 'test';

    const lastGame = localStorage.getItem('lastGame');
    if (lastGame && lastGame !== game) {
        localStorage.removeItem(`selected_task_${lastGame}`);
    }
    localStorage.setItem('lastGame', game);

    function saveBrushSettings(color, posIndex) {
        if (!testMode) {
            localStorage.setItem('globalBrushColor', color);
            localStorage.setItem('globalBrushPosIndex', posIndex);
        }
    }

    function loadBrushSettings() {
        const color = localStorage.getItem('globalBrushColor');
        const posIndex = localStorage.getItem('globalBrushPosIndex');
        return {
            color: color || '#ffffff',
            posIndex: posIndex !== null ? parseInt(posIndex) : 1
        };
    }

    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    let gameConfig = null;

    async function loadGameConfig(gameId) {
        try {
            const response = await fetch(`games/${gameId}/config.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
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

    const canvas = document.getElementById('boardCanvas');
    const ctx = canvas.getContext('2d');
    const questionDiv = document.getElementById('question');
    const boardWrapper = document.getElementById('boardWrapper');
    const toggleBtn = document.getElementById('toggleNumbersBtn');
    const resultDiv = document.getElementById('result');
    const resultMessageSpan = document.getElementById('resultMessage');
    const resultArrow = document.getElementById('resultArrow');
    const resultExpandPanel = document.getElementById('resultExpandPanel');
    const desktopExplanationPanel = document.getElementById('desktopExplanationPanel');
    const desktopExplanationConnector = document.getElementById('desktopExplanationConnector');
    const desktopExplanationQuery = window.matchMedia('(min-width: 1180px)');

    let cellsCountGlobal = 25;
    let pieceImages = {};
    let fieldImg = new Image();
    let imagesLoaded = false;
    let loadCounter = 0;
    let totalImagesToLoad = 1;

    function checkImages() {
        loadCounter++;
        if (loadCounter === totalImagesToLoad) {
            imagesLoaded = true;
            if (typeof startGameAfterImages === 'function') startGameAfterImages();
        }
    }

    function resetImages() {
        imagesLoaded = false;
        loadCounter = 0;
        fieldImg = new Image();
        fieldImg.onload = checkImages;
        pieceImages = {};
    }

    let currentTask = null,
        selectedValues = [],
        selectedValueSingle = null,
        answerGiven = false,
        numbersVisible = false,
        resultExpanded = false,
        warningTimer = null;

    function drawNative(position, highlights, greenNumbers = null, showCellNumbers = false, highlightedCell = null, targets = null) {
        if (!imagesLoaded) return;

        const originalCenters = window.originalCenters || {};
        if (Object.keys(originalCenters).length === 0) return;

        canvas.width = fieldImg.width;
        canvas.height = fieldImg.height;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		ctx.drawImage(fieldImg, 0, 0);

        const isDablotGame = game === 'dablot' || gameConfig?.gameId === 'dablot';
        const drawSettings = {
            ...(gameConfig?.drawSettings || {}),
            ...(currentTask?.drawSettings || {})
        };

        const pieceSize = Number(drawSettings.pieceSize) || (isDablotGame ? 180 : 72.2835 * 4);
        const kingPieceSize = Number(drawSettings.kingPieceSize) || (isDablotGame ? 245 : pieceSize);
        const kingWidth = drawSettings.kingWidth || kingPieceSize;
        const kingHeight = drawSettings.kingHeight || kingPieceSize;

        for (const cellStr in position) {
            const cell = parseInt(cellStr, 10);
            const color = position[cell];
            const orig = originalCenters[cell];

            if (!orig) continue;

            const img = pieceImages[color];
            if (!img) continue;

            const isKingPiece =
                color === 'red_king' ||
                color === 'blue_king' ||
                color === 'kingr' ||
                color === 'kingbl' ||
                color === 'white_damka' ||
                color === 'black_damka';

            let drawWidth, drawHeight;
            if (isKingPiece && drawSettings.kingWidth && drawSettings.kingHeight) {
                drawWidth = kingWidth;
                drawHeight = kingHeight;
            } else if (isKingPiece) {
                drawWidth = kingPieceSize;
                drawHeight = kingPieceSize;
            } else {
                drawWidth = pieceSize;
                drawHeight = pieceSize;
            }

            ctx.drawImage(
                img,
                orig.x - drawWidth / 2,
                orig.y - drawHeight / 2,
                drawWidth,
                drawHeight
            );
        }

        if (highlightedCell && originalCenters[highlightedCell]) {
            const orig = originalCenters[highlightedCell];
            ctx.beginPath();
            ctx.arc(orig.x, orig.y, pieceSize / 2 + 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 0, 0.45)';
            ctx.fill();
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        if (highlights) {
            for (const colorName in highlights) {
                ctx.fillStyle = colorName === 'red'
                    ? 'rgba(255, 80, 80, 0.45)'
                    : 'rgba(80, 255, 80, 0.45)';

                for (const cellStr of highlights[colorName]) {
                    const cell = parseInt(cellStr, 10);
                    const orig = originalCenters[cell];
                    if (!orig) continue;
                    const r = pieceSize / 2 + 4;
                    ctx.beginPath();
                    ctx.arc(orig.x, orig.y, r, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }

        if (greenNumbers && typeof window.drawGreenNumbers === 'function') {
            window.drawGreenNumbers(ctx, originalCenters, greenNumbers, pieceSize);
        }

        if (targets) {
            ctx.font = `bold ${Math.floor(pieceSize * 0.35)}px "Inter", system-ui`;
            ctx.fillStyle = 'black';
            ctx.shadowBlur = 0;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (const cellStr in targets) {
                const cell = parseInt(cellStr, 10);
                const num = targets[cell];
                const orig = originalCenters[cell];
                if (!orig) continue;
                ctx.fillStyle = 'white';
                ctx.fillRect(orig.x - 12, orig.y - 12, 24, 24);
                ctx.fillStyle = 'black';
                ctx.fillText(num, orig.x, orig.y);
            }
        }

        if (showCellNumbers) {
            const cell1 = originalCenters[1];
            const cell2 = originalCenters[2];
            if (cell1 && cell2) {
                const dx = cell2.x - cell1.x;
                const dy = cell2.y - cell1.y;
                const cellDist = Math.hypot(dx, dy);
                const calculatedFontSize = Math.floor(cellDist * 0.3);
                const fontSize = Number(drawSettings.numberFontSize) || (isDablotGame ? 70 : calculatedFontSize);

                ctx.font = `bold ${fontSize}px "Inter", system-ui`;
                ctx.fillStyle = 'white';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 3;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const maxCell = cellsCountGlobal || 25;
                const skipPositionNumbers = new Set(
                    (currentTask?.skipPositionNumbers || []).map(Number)
                );

                for (let i = 1; i <= maxCell; i++) {
                    if (skipPositionNumbers.has(i)) continue;
                    const center = originalCenters[i];
                    if (!center) continue;
                    ctx.fillText(i.toString(), center.x, center.y);
                }

                ctx.shadowBlur = 0;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
            }
        }
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

    function redrawCurrent() {
        const greenNumbers = currentTask?.green_numbers || null;
        const highlightedCell = currentTask?.highlighted_cell || null;
        const targets = currentTask?.targets || null;

        drawNative(
            currentTask?.position || {},
            currentTask?.highlights || {},
            greenNumbers,
            numbersVisible,
            highlightedCell,
            targets
        );

        if (answerGiven) {
            toggleBtn.innerHTML = numbersVisible ? '🚫' : '👁️';
            requestAnimationFrame(positionToggleNumbersBtn);
        }
    }

    function toggleNumbers() {
        if (!answerGiven) return;
        numbersVisible = !numbersVisible;
        redrawCurrent();
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
        let percent = positions[currentPosIndex];
        sliderThumb.style.left = `${percent}%`;
        currentBrushSize = brushSizes[currentPosIndex];

        let thumbScale = 0.5 + currentBrushSize / 80;
        let thumbSize = 20 * thumbScale;
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
        let nearest = 0, minDiff = Math.abs(percent - positions[0]);
        for (let i = 1; i < positions.length; i++) {
            let diff = Math.abs(percent - positions[i]);
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
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
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

    if (testMode) {
        localStorage.removeItem('globalBrushColor');
        localStorage.removeItem('globalBrushPosIndex');
        currentDrawColor = '#ffffff';
        currentPosIndex = 1;
    } else {
        const saved = loadBrushSettings();
        currentDrawColor = saved.color;
        currentPosIndex = saved.posIndex;
    }

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

    function preventScroll(e) { e.preventDefault(); }

    function handleWheel(e) {
        if (modal.style.display !== 'flex') return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.12 : -0.12;
        updateScale(currentScale + delta);
    }

    function getTouchDistance(e) {
        return Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
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
            if (initialDistance > 0) updateScale(initialScale * (newDistance / initialDistance));
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
            for (let i = 1; i < stroke.points.length; i++) drawCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
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
        if (drawCanvasElem.setPointerCapture) drawCanvasElem.setPointerCapture(e.pointerId);
        const p = getCanvasPointFromEvent(e);
        currentStroke = { color: currentDrawColor, width: currentBrushSize, points: [p] };
        strokes.push(currentStroke);
        redrawAllStrokes();
    }

    function moveDrawing(e) {
        if (!isDrawing || e.pointerId !== drawingPointerId) return;
        e.preventDefault();
        const p = getCanvasPointFromEvent(e);
        const last = currentStroke.points[currentStroke.points.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
        const smooth = { x: last.x + (p.x - last.x) * 0.55, y: last.y + (p.y - last.y) * 0.55 };
        currentStroke.points.push(smooth);
        redrawAllStrokes();
    }

    function stopDrawing(e) {
        if (e.pointerId !== drawingPointerId) return;
        if (drawCanvasElem.releasePointerCapture) drawCanvasElem.releasePointerCapture(e.pointerId);
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
        if (e.target === modal || e.target === modalImg || e.target === zoomContainer || e.target === imageStage) {
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

    const taskSelect = document.getElementById('taskSelect');
    const optionsContainer = document.getElementById('optionsContainer');
    const checkBtn = document.getElementById('checkBtn');
    const newBtn = document.getElementById('newBtn');

    function isDesktopExplanationMode() {
        return desktopExplanationQuery.matches;
    }

    function buildExplanationHtml(explanation) {
        return explanation ? explanation.split('; ').map(line => `<div class="result-line">${line}</div>`).join('') : '';
    }

    function updateResultToggleIcon() {
        if (!resultDiv.classList.contains('expandable')) {
            resultArrow.innerText = '▼';
            return;
        }
        resultArrow.innerText = isDesktopExplanationMode() ? 'i' : '▼';
    }

    function closeDesktopExplanationPanel() {
        resultDiv.classList.remove('desktop-popover-open');
        desktopExplanationPanel.classList.remove('expanded');
        desktopExplanationConnector.classList.remove('expanded');
    }

    function syncDesktopExplanationVariant() {
        desktopExplanationPanel.classList.remove('correct', 'wrong', 'info');
        desktopExplanationConnector.classList.remove('correct', 'wrong', 'info');
        let variant = null;
        if (resultDiv.classList.contains('correct')) variant = 'correct';
        else if (resultDiv.classList.contains('wrong')) variant = 'wrong';
        else if (resultDiv.classList.contains('info')) variant = 'info';
        if (variant) {
            desktopExplanationPanel.classList.add(variant);
            desktopExplanationConnector.classList.add(variant);
        }
    }

    function positionDesktopExplanationPanel() {
        if (!isDesktopExplanationMode()) return;
        if (!desktopExplanationPanel.classList.contains('expanded')) return;
        if (!resultDiv.classList.contains('show')) return;

        syncDesktopExplanationVariant();

        const card = document.querySelector('.game-card');
        const cardRect = card.getBoundingClientRect();
        const resultRect = resultDiv.getBoundingClientRect();
        const gap = 6;
        const viewportPadding = 10;
        const minPanelWidth = 300;
        const preferredPanelWidth = 410;

        const availableRight = window.innerWidth - cardRect.right - gap - viewportPadding;
        if (availableRight < minPanelWidth) {
            closeDesktopExplanationPanel();
            resultExpandPanel.classList.add('expanded');
            resultExpanded = true;
            return;
        }

        const panelWidth = Math.min(preferredPanelWidth, availableRight);
        const panelLeft = card.offsetWidth + gap;
        desktopExplanationPanel.style.width = `${panelWidth}px`;
        desktopExplanationPanel.style.maxWidth = `${panelWidth}px`;
        desktopExplanationPanel.style.left = `${panelLeft}px`;

        const panelHeight = desktopExplanationPanel.offsetHeight;
        let panelTop = resultRect.bottom - cardRect.top - panelHeight;
        if (panelTop < viewportPadding) panelTop = viewportPadding;
        desktopExplanationPanel.style.top = `${panelTop}px`;

        const connectorTop = resultRect.top - cardRect.top + resultRect.height / 2;
        const connectorLeft = Math.max(0, resultRect.right - cardRect.left);
        const connectorWidth = Math.max(0, panelLeft - connectorLeft);
        desktopExplanationConnector.style.left = `${connectorLeft}px`;
        desktopExplanationConnector.style.top = `${connectorTop}px`;
        desktopExplanationConnector.style.width = `${connectorWidth}px`;
    }

    function syncExplanationModeAfterResize() {
        updateResultToggleIcon();
        if (!resultDiv.classList.contains('expandable') || !resultExpanded) {
            closeDesktopExplanationPanel();
            return;
        }
        if (isDesktopExplanationMode()) {
            resultExpandPanel.classList.remove('expanded');
            syncDesktopExplanationVariant();
            desktopExplanationPanel.classList.add('expanded');
            desktopExplanationConnector.classList.add('expanded');
            resultDiv.classList.add('desktop-popover-open');
            requestAnimationFrame(positionDesktopExplanationPanel);
        } else {
            closeDesktopExplanationPanel();
            resultExpandPanel.classList.add('expanded');
        }
    }

    function clearBoardState() {
        canvas.classList.remove('correct', 'wrong');
    }

    function hideResult() {
        if (warningTimer) clearTimeout(warningTimer);
        resultDiv.classList.remove('show', 'correct', 'wrong', 'info', 'expandable', 'desktop-popover-open');
        resultArrow.classList.remove('rotated');
        resultExpandPanel.classList.remove('expanded');
        desktopExplanationPanel.classList.remove('expanded', 'correct', 'wrong', 'info');
        desktopExplanationConnector.classList.remove('expanded', 'correct', 'wrong', 'info');
        resultMessageSpan.innerText = '';
        resultArrow.innerText = '▼';
        resultExpandPanel.innerHTML = '';
        desktopExplanationPanel.innerHTML = '';
        boardWrapper.classList.remove('show-result');
        clearBoardState();
        resultExpanded = false;
    }

    function showResult(message, type, explanation, autoHide = false) {
        if (warningTimer) clearTimeout(warningTimer);
        boardWrapper.classList.add('show-result');
        resultMessageSpan.innerText = message;
        resultDiv.classList.remove('correct', 'wrong', 'info', 'expandable');
        resultDiv.classList.add('show', type);
        syncDesktopExplanationVariant();
        const explanationHtml = buildExplanationHtml(explanation);
        resultExpandPanel.innerHTML = explanationHtml;
        desktopExplanationPanel.innerHTML = explanationHtml;
        const canExpand = !!(explanation && explanation.trim());
        if (canExpand) resultDiv.classList.add('expandable');
        resultArrow.classList.remove('rotated');
        resultExpandPanel.classList.remove('expanded');
        closeDesktopExplanationPanel();
        updateResultToggleIcon();
        resultExpanded = false;
        if (autoHide) warningTimer = setTimeout(() => hideResult(), 3000);
    }

    function lockAnswerOptions() {
        if (!currentTask) return;
        if (currentTask.answer_type === 'multiple') {
            document.querySelectorAll('.opt-checkbox').forEach(wrapper => {
                const cb = wrapper.querySelector('input[type="checkbox"]');
                const isSelected = !!(cb && cb.checked);
                wrapper.classList.add('locked');
                wrapper.classList.toggle('locked-selected', isSelected);
                wrapper.classList.toggle('locked-unselected', !isSelected);
                if (cb) cb.disabled = true;
            });
        } else {
            document.querySelectorAll('.opt-btn').forEach(btn => {
                const isSelected = btn.classList.contains('selected');
                btn.classList.add('locked');
                btn.classList.toggle('locked-selected', isSelected);
                btn.classList.toggle('locked-unselected', !isSelected);
                btn.disabled = true;
            });
        }
    }

    function renderOptions(task) {
        optionsContainer.innerHTML = '';
        selectedValues = [];
        selectedValueSingle = null;

        if (task.answer_type === 'multiple') {
            task.options.forEach(opt => {
                const wrapper = document.createElement('label');
                wrapper.className = 'opt-checkbox';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = opt.id;
                cb.addEventListener('change', e => {
                    if (e.target.checked) {
                        if (!selectedValues.includes(opt.id)) selectedValues.push(opt.id);
                    } else {
                        selectedValues = selectedValues.filter(v => v !== opt.id);
                    }
                    wrapper.classList.toggle('selected', e.target.checked);
                });
                const span = document.createElement('span');
                span.innerText = opt.text;
                wrapper.appendChild(cb);
                wrapper.appendChild(span);
                optionsContainer.appendChild(wrapper);
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
                });
                optionsContainer.appendChild(btn);
            });
        }
    }

    const RANDOM_TASK_VALUE = '__random_task__';

    function getAvailableTaskKeys() {
        if (!window.taskTitles) return [];
        return Object.keys(window.taskTitles).filter(key => key !== RANDOM_TASK_VALUE).sort((a, b) => Number(a) - Number(b));
    }

    function getRandomAvailableTaskType() {
        const keys = getAvailableTaskKeys().filter(key => typeof window.taskGenerators?.[key] === 'function');
        if (!keys.length) return null;
        return keys[Math.floor(Math.random() * keys.length)];
    }

    function buildTaskSelect() {
        if (!window.taskTitles) return;
        taskSelect.innerHTML = '';
        const keys = getAvailableTaskKeys();
        if (keys.length > 0) {
            const randomOption = document.createElement('option');
            randomOption.value = RANDOM_TASK_VALUE;
            randomOption.textContent = '🎲 Случайная задача';
            taskSelect.appendChild(randomOption);
        }
        for (const key of keys) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = window.taskTitles[key];
            taskSelect.appendChild(option);
        }
        if (taskSelect.options.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = 'Нет доступных задач';
            opt.disabled = true;
            taskSelect.appendChild(opt);
        }
    }

    function refreshTask() {
        const selectedType = taskSelect.value;
        const taskTypeToGenerate = selectedType === RANDOM_TASK_VALUE ? getRandomAvailableTaskType() : selectedType;
        const generator = taskTypeToGenerate ? window.taskGenerators?.[taskTypeToGenerate] : null;

        clearDrawing();
        if (modal.style.display === 'flex') closeModal();
        hideResult();
        canvas.classList.remove('correct', 'wrong');

        if (!generator) {
            currentTask = null;
            questionDiv.innerText = '⚠️ Генератор задачи не найден';
            optionsContainer.innerHTML = '';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            showResult('⚠️ Генератор задачи не найден', 'info', '');
            return;
        }

        const task = generator();
        if (task && selectedType === RANDOM_TASK_VALUE) {
            task.random_source_task_type = taskTypeToGenerate;
            task.random_source_task_title = window.taskTitles?.[taskTypeToGenerate] || '';
        }

        currentTask = task;
        answerGiven = false;
        numbersVisible = false;
        toggleBtn.style.display = 'none';
        questionDiv.innerText = task.question || 'Задача без текста';
        renderOptions(currentTask);
        redrawCurrent();
        selectedValues = [];
        selectedValueSingle = null;
    }

    function checkAnswer() {
        if (!currentTask) {
            showResult('⚠️ Задача не загружена', 'info', '');
            return;
        }

        let isCorrect = false;
        if (currentTask.answer_type === 'multiple') {
            if (!selectedValues.length) {
                showResult('⚠️ Выберите хотя бы один вариант', 'info', '', true);
                return;
            }
            const correctSet = new Set(currentTask.correct);
            const selectedSet = new Set(selectedValues);
            if (selectedSet.size === correctSet.size && [...selectedSet].every(v => correctSet.has(v))) isCorrect = true;
        } else {
            if (!selectedValueSingle) {
                showResult('⚠️ Выберите вариант ответа', 'info', '', true);
                return;
            }
            isCorrect = selectedValueSingle === currentTask.correct;
        }

        clearBoardState();
        if (isCorrect) {
            canvas.classList.add('correct');
            showResult('✅ Верно! Отличная работа.', 'correct', currentTask.explanation || '');
        } else {
            canvas.classList.add('wrong');
            const correctStr = currentTask.answer_type === 'multiple' ? currentTask.correct.join(', ') : currentTask.correct;
            showResult(`❌ Неверно. Правильный ответ: ${correctStr}`, 'wrong', currentTask.explanation || '');
        }

        lockAnswerOptions();
        clearDrawing();
        answerGiven = true;
        numbersVisible = true;
        toggleBtn.style.display = 'flex';
        redrawCurrent();
    }

    const resultSummary = resultDiv.querySelector('.result-summary');
    resultSummary.addEventListener('click', e => {
        e.stopPropagation();
        if (!resultDiv.classList.contains('expandable')) return;
        resultExpanded = !resultExpanded;
        if (isDesktopExplanationMode()) {
            resultArrow.classList.remove('rotated');
            resultExpandPanel.classList.remove('expanded');
            if (resultExpanded) {
                syncDesktopExplanationVariant();
                resultDiv.classList.add('desktop-popover-open');
                desktopExplanationPanel.classList.add('expanded');
                desktopExplanationConnector.classList.add('expanded');
                requestAnimationFrame(positionDesktopExplanationPanel);
            } else {
                resultDiv.classList.remove('desktop-popover-open');
                desktopExplanationPanel.classList.remove('expanded');
                desktopExplanationConnector.classList.remove('expanded');
            }
            return;
        }
        closeDesktopExplanationPanel();
        resultArrow.classList.toggle('rotated', resultExpanded);
        resultExpandPanel.classList.toggle('expanded', resultExpanded);
        if (resultExpandPanel.classList.contains('expanded') && window.innerWidth <= 550) {
            setTimeout(() => resultExpandPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    });

    toggleBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (answerGiven) toggleNumbers();
    });

    window.addEventListener('resize', () => {
        requestAnimationFrame(positionToggleNumbersBtn);
        requestAnimationFrame(syncExplanationModeAfterResize);
    });

    newBtn.addEventListener('click', refreshTask);
    checkBtn.addEventListener('click', checkAnswer);

    taskSelect.addEventListener('change', () => {
        localStorage.setItem(`selected_task_${game}`, taskSelect.value);
        refreshTask();
    });

    let startGameAfterImages = null;

    async function startGame() {
        gameConfig = await loadGameConfig(game);
        if (!gameConfig) {
            document.getElementById('gameTitle').innerText = 'Ошибка загрузки игры';
            document.title = 'Ошибка';
            questionDiv.innerText = 'Не удалось загрузить конфигурацию игры. Проверьте наличие папки и файла config.json.';
            return;
        }

        document.getElementById('gameTitle').innerText = gameConfig.gameName + ' тренажёр';
        document.title = gameConfig.gameName;

        cellsCountGlobal = gameConfig.cellsCount || 25;

        resetImages();

        const gameFolder = `games/${game}/`;
        const boardPath = gameConfig.images?.board || 'pole.png';
        fieldImg.src = `${gameFolder}${boardPath}`;
        fieldImg.onload = checkImages;

        const piecesConfig = gameConfig.images?.pieces;
        if (!piecesConfig) {
            console.error('В config.json отсутствует images.pieces');
            return;
        }

        const pieceKeys = Object.keys(piecesConfig);
        totalImagesToLoad = 1 + pieceKeys.length;

        for (const color of pieceKeys) {
            const img = new Image();
            img.src = `${gameFolder}${piecesConfig[color]}`;
            img.onload = checkImages;
            pieceImages[color] = img;
        }

        const taskFiles = gameConfig.taskFiles || ['task1.js'];
        try {
            await Promise.allSettled(taskFiles.map(file => loadScript(`${gameFolder}${file}`)));
        } catch (error) {
            console.warn('Некоторые задачи не загрузились:', error);
        }

        startGameAfterImages = () => {
            buildTaskSelect();
            const savedType = localStorage.getItem(`selected_task_${game}`);
            if (savedType && Array.from(taskSelect.options).some(opt => opt.value === savedType)) {
                taskSelect.value = savedType;
            } else {
                taskSelect.selectedIndex = 0;
            }
            refreshTask();
        };

        if (imagesLoaded) startGameAfterImages();
    }

    startGame();
