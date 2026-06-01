    const game = new URLSearchParams(window.location.search).get('game');
    if (!game) window.location.href = 'index.html';

    let resultsData = null;
    try {
        const stored = localStorage.getItem('testResults');
        if (!stored) throw new Error('No results');
        resultsData = JSON.parse(stored);
        if (resultsData.game !== game) throw new Error('Game mismatch');
    } catch(e) {
        alert('Результаты не найдены. Пожалуйста, пройдите тест заново.');
        window.location.href = 'index.html';
    }

    const tasksList = resultsData.tasks;
    const userAnswers = resultsData.userAnswers;
    const resultsArray = resultsData.results;
    const gameConfig = resultsData.config;

    let currentTaskIndex = 0;
    let resultExpanded = false;
    let warningTimer = null;

    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    document.getElementById('menuBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    const canvas = document.getElementById('boardCanvas');
    const ctx = canvas.getContext('2d');
    const questionDiv = document.getElementById('question');
    const boardWrapper = document.getElementById('boardWrapper');
    const resultDiv = document.getElementById('result');
    const resultMessageSpan = document.getElementById('resultMessage');
    const resultArrow = document.getElementById('resultArrow');
    const resultExpandPanel = document.getElementById('resultExpandPanel');
    const optionsContainer = document.getElementById('optionsContainer');
    const taskNavPanel = document.getElementById('taskNavPanel');

    let cellsCountGlobal = gameConfig.cellsCount || 25;
    let pieceImages = {};
    let fieldImg = new Image();
    let imagesLoaded = false;
    let loadCounter = 0;
    let totalImagesToLoad = 1;

    function checkImages() {
        loadCounter++;
        if (loadCounter === totalImagesToLoad) {
            imagesLoaded = true;
            startRendering();
        }
    }

    function resetImages() {
        imagesLoaded = false;
        loadCounter = 0;
        fieldImg = new Image();
        fieldImg.onload = checkImages;
        pieceImages = {};
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

    async function loadGameAssets() {
        resetImages();
        const gameFolder = `games/${game}/`;
        const boardPath = gameConfig.images?.board || 'pole.png';
        fieldImg.src = `${gameFolder}${boardPath}`;
        fieldImg.onload = checkImages;
        const piecesConfig = gameConfig.images?.pieces;
        if (!piecesConfig) return;
        const pieceKeys = Object.keys(piecesConfig);
        totalImagesToLoad = 1 + pieceKeys.length;
        for (const color of pieceKeys) {
            const img = new Image();
            img.src = `${gameFolder}${piecesConfig[color]}`;
            img.onload = checkImages;
            pieceImages[color] = img;
        }
        if (gameConfig.boardDataFile) {
            await loadScript(`${gameFolder}${gameConfig.boardDataFile}`);
        } else {
            try {
                await loadScript(`${gameFolder}boardData.js`);
            } catch(e) { console.warn('boardData.js не загружен'); }
        }
    }

    function drawNative(position, highlights, greenNumbers = null, highlightedCell = null, targets = null) {
        if (!imagesLoaded) return;
        const originalCenters = window.originalCenters || {};
        if (Object.keys(originalCenters).length === 0) return;

        canvas.width = fieldImg.width;
        canvas.height = fieldImg.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(fieldImg, 0, 0);

        const pieceSize = 72.2835 * 4;
        const half = pieceSize / 2;
        for (const cellStr in position) {
            const cell = parseInt(cellStr, 10);
            const color = position[cell];
            const orig = originalCenters[cell];
            if (!orig) continue;
            const img = pieceImages[color];
            if (!img) continue;
            ctx.drawImage(img, orig.x - half, orig.y - half, pieceSize, pieceSize);
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
                ctx.fillStyle = colorName === 'red' ? 'rgba(255, 80, 80, 0.45)' : 'rgba(80, 255, 80, 0.45)';
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
    }

    function redrawCurrent() {
        const task = tasksList[currentTaskIndex];
        if (!task) return;
        const greenNumbers = task.green_numbers || null;
        const highlightedCell = task.highlighted_cell || null;
        const targets = task.targets || null;
        drawNative(task.position || {}, task.highlights || {}, greenNumbers, highlightedCell, targets);
        const isCorrect = resultsArray[currentTaskIndex];
        if (isCorrect) {
            canvas.classList.add('correct');
            canvas.classList.remove('wrong');
        } else {
            canvas.classList.add('wrong');
            canvas.classList.remove('correct');
        }
    }

    function hideResult() {
        if (warningTimer) clearTimeout(warningTimer);
        resultDiv.classList.remove('show', 'correct', 'wrong', 'info', 'accept', 'expandable');
        resultArrow.classList.remove('rotated');
        resultExpandPanel.classList.remove('expanded');
        resultMessageSpan.innerText = '';
        resultExpandPanel.innerHTML = '';
        boardWrapper.classList.remove('show-result');
        resultExpanded = false;
    }

    function showResult(message, type, explanation) {
        if (warningTimer) clearTimeout(warningTimer);
        boardWrapper.classList.add('show-result');
        resultMessageSpan.innerText = message;
        resultDiv.classList.remove('correct', 'wrong', 'info', 'accept', 'expandable');
        resultDiv.classList.add('show', type);
        resultExpandPanel.innerHTML = explanation
            ? explanation.split('; ').map(line => `<div class="result-line">${line}</div>`).join('')
            : '';
        const canExpand = !!(explanation && explanation.trim());
        if (canExpand) resultDiv.classList.add('expandable');
        resultArrow.classList.remove('rotated');
        resultExpandPanel.classList.remove('expanded');
        resultExpanded = false;
    }

    function renderOptions(task) {
        optionsContainer.innerHTML = '';
        const userAnswer = userAnswers[currentTaskIndex];
        if (task.answer_type === 'multiple') {
            task.options.forEach(opt => {
                const wrapper = document.createElement('div');
                wrapper.className = 'opt-checkbox';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.disabled = true;
                cb.checked = userAnswer && userAnswer.includes(opt.id);
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
                btn.disabled = true;
                if (userAnswer === opt.id) btn.classList.add('selected');
                optionsContainer.appendChild(btn);
            });
        }
        const isCorrect = resultsArray[currentTaskIndex];
        if (isCorrect) {
            showResult('✅ Верно! Отличная работа.', 'correct', task.explanation || '');
        } else {
            const correctStr = task.answer_type === 'multiple' ? task.correct.join(', ') : task.correct;
            showResult(`❌ Неверно. Правильный ответ: ${correctStr}`, 'wrong', task.explanation || '');
        }
    }

    function renderTaskNav() {
        taskNavPanel.innerHTML = '';
        for (let i = 0; i < tasksList.length; i++) {
            const btn = document.createElement('div');
            btn.className = 'task-nav-item';
            if (i === currentTaskIndex) btn.classList.add('current');
            if (resultsArray[i]) btn.classList.add('correct');
            else btn.classList.add('wrong');
            btn.innerText = (i + 1).toString();
            btn.addEventListener('click', () => {
                if (i === currentTaskIndex) return;
                currentTaskIndex = i;
                loadTaskByIndex();
                renderTaskNav();
            });
            taskNavPanel.appendChild(btn);
        }
    }

    function loadTaskByIndex() {
        const task = tasksList[currentTaskIndex];
        if (!task) return;
        document.getElementById('question').innerText = task.question;
        renderOptions(task);
        redrawCurrent();
    }

    function initStats() {
        const correctCount = resultsArray.filter(v => v === true).length;
        const total = tasksList.length;
        const percent = (correctCount / total) * 100;
        let message = '';
        if (correctCount === total) message = '🎉 Идеально! Поздравляем!';
        else if (correctCount >= total * 0.8) message = '👍 Хороший результат!';
        else if (correctCount >= total * 0.5) message = '💪 Неплохо, но можно лучше!';
        else message = '📚 Повтори правила и возвращайся!';
        document.getElementById('scoreText').innerHTML = `Вы ответили на ${correctCount} из ${total} вопросов верно (${Math.round(percent)}%).`;
        document.getElementById('messageText').innerHTML = message;
    }

    function startRendering() {
        document.getElementById('gameTitle').innerText = gameConfig.gameName + ' · результаты';
        initStats();
        renderTaskNav();
        loadTaskByIndex();
    }

    const resultSummary = resultDiv.querySelector('.result-summary');
    resultSummary.addEventListener('click', e => {
        e.stopPropagation();
        if (!resultDiv.classList.contains('expandable')) return;
        resultExpanded = !resultExpanded;
        resultArrow.classList.toggle('rotated', resultExpanded);
        resultExpandPanel.classList.toggle('expanded', resultExpanded);
        if (resultExpandPanel.classList.contains('expanded') && window.innerWidth <= 550) {
            setTimeout(() => resultExpandPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    });

    loadGameAssets();
