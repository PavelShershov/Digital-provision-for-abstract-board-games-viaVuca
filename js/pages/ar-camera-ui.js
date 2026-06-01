(function () {
  const scene = document.querySelector('a-scene');
  const assetsEl = document.querySelector('a-assets');

  const progressContainer = document.getElementById('progress-container');
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');

  const resetBtn = document.getElementById('resetBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const rewindBtn = document.getElementById('rewindBtn');
  const controlBtn = document.getElementById('controlBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const allButtons = document.querySelectorAll('.control-btn');

  const loadState = {};
  const modelEls = [];

  let orientationResetTimer = null;
  let lastLayoutMode = null;

  function getMindARSystem() {
    return scene.systems['mindar-image-system'] || null;
  }

  async function tryLockPortrait() {
    if (!screen.orientation || !screen.orientation.lock) return;

    try {
      await screen.orientation.lock('portrait');
      console.log('[UI] portrait lock success');
    } catch (e) {
      console.log('[UI] portrait lock not available', e);
    }
  }

  function getActiveModel() {
    return window.activeModel || null;
  }

  function getActiveController() {
    const modelEl = getActiveModel();
    if (!modelEl || !modelEl.parentEl) return null;
    return modelEl.parentEl.components['ar-animation-controller'] || null;
  }

  function setButtonsDisabled(disabled) {
    controlBtn.disabled = disabled;
    rewindBtn.disabled = disabled;
    forwardBtn.disabled = disabled;

    if (disabled) {
      controlBtn.textContent = '▶';
    }
  }

  function setPlayingUI() {
    controlBtn.disabled = false;
    rewindBtn.disabled = false;
    forwardBtn.disabled = false;
    controlBtn.textContent = '⏸';
  }

  function setPausedUI() {
    controlBtn.disabled = false;
    rewindBtn.disabled = false;
    forwardBtn.disabled = false;
    controlBtn.textContent = '▶';
  }

  function setReplayUI() {
    controlBtn.disabled = false;
    rewindBtn.disabled = false;
    forwardBtn.disabled = false;
    controlBtn.textContent = '↻';
  }

  setButtonsDisabled(true);

  function refreshControlButtonState() {
    const controller = getActiveController();
    const modelEl = getActiveModel();

    if (!controller || !modelEl) {
      setButtonsDisabled(true);
      return;
    }

    if (controller.isFinished()) {
      setReplayUI();
      return;
    }

    if (controller.isPaused()) {
      setPausedUI();
      return;
    }

    setPlayingUI();
  }

  function updateProgress() {
    let totalLoaded = 0;
    let totalSize = 0;
    let hasTotal = false;

    Object.values(loadState).forEach(s => {
      totalLoaded += s.loaded;
      if (s.total) {
        totalSize += s.total;
        hasTotal = true;
      }
    });

    let percent;

    if (hasTotal && totalSize > 0) {
      percent = Math.min(Math.round((totalLoaded / totalSize) * 100), 99);
    } else {
      progressText.innerText = 'Загрузка модели…';
      return;
    }

    progressText.innerText = `Загрузка модели ${percent}%`;
    progressBar.style.width = percent + '%';
  }

  function onAllLoaded() {
    progressText.innerText = 'Загрузка модели 100%';
    progressBar.style.width = '100%';

    setTimeout(() => {
      progressContainer.style.opacity = '0';

      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 500);
    }, 1000);
  }

  const MODEL_CACHE_NAME = 'viavuca-3d-models-v1';

  const modelElsByTargetIndex = new Map();
  const modelConfigsByTargetIndex = new Map();
  const modelLoadPromises = new Map();
  const preparedModelSrcByFile = new Map();
  const loadedTargetIndexes = new Set();

  let loadedCount = 0;
  let backgroundPreloadController = null;
  let backgroundPreloadRunning = false;
  let backgroundPreloadPaused = false;
  let backgroundPreloadTimer = null;

  function canUsePersistentCache() {
    return 'caches' in window &&
      (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }

  function canUseFetchBlobLoading() {
    return typeof fetch === 'function' && location.protocol !== 'file:';
  }

  function resolveModelSrc(src) {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      return new URL(src, location.href).href;
    }

    return src;
  }

  async function registerModelCacheWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;

    try {
      await navigator.serviceWorker.register('viavuca-3d-sw.js');
      console.log('[AR cache] service worker registered');
    } catch (error) {
      console.warn('[AR cache] service worker registration failed:', error);
    }
  }

  async function getPreparedModelSrc(cfg, signal) {
    const absoluteSrc = resolveModelSrc(cfg.modelSrc);

    if (preparedModelSrcByFile.has(absoluteSrc)) {
      return preparedModelSrcByFile.get(absoluteSrc);
    }

    if (canUsePersistentCache()) {
      try {
        const cache = await caches.open(MODEL_CACHE_NAME);
        const cachedResponse = await cache.match(absoluteSrc);

        if (cachedResponse) {
          const cachedBlob = await cachedResponse.blob();
          const cachedBlobUrl = URL.createObjectURL(cachedBlob);
          preparedModelSrcByFile.set(absoluteSrc, cachedBlobUrl);
          console.log('[AR cache] model from cache:', cfg.modelSrc);
          return cachedBlobUrl;
        }
      } catch (error) {
        console.warn('[AR cache] cache read failed:', cfg.modelSrc, error);
      }
    }

    if (!canUseFetchBlobLoading()) {
      return cfg.modelSrc;
    }

    const response = await fetch(absoluteSrc, {
      signal,
      cache: 'force-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${absoluteSrc}`);
    }

    if (canUsePersistentCache()) {
      try {
        const cache = await caches.open(MODEL_CACHE_NAME);
        await cache.put(absoluteSrc, response.clone());
        console.log('[AR cache] model saved to cache:', cfg.modelSrc);
      } catch (error) {
        console.warn('[AR cache] cache put failed:', cfg.modelSrc, error);
      }
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    preparedModelSrcByFile.set(absoluteSrc, blobUrl);
    return blobUrl;
  }

  function markModelLoaded(cfg) {
    if (!loadedTargetIndexes.has(cfg.targetIndex)) {
      loadedTargetIndexes.add(cfg.targetIndex);
      loadedCount++;
    }

    loadState[cfg.modelId].loaded = loadState[cfg.modelId].total || 1;

    if (loadedCount === AR_CONFIG.length) {
      onAllLoaded();
    } else {
      updateProgress();
    }
  }

  function loadModelForConfig(cfg, options = {}) {
    const priority = !!options.priority;
    const signal = options.signal;

    if (loadedTargetIndexes.has(cfg.targetIndex)) {
      return Promise.resolve();
    }

    if (modelLoadPromises.has(cfg.targetIndex)) {
      return modelLoadPromises.get(cfg.targetIndex);
    }

    const model = modelElsByTargetIndex.get(cfg.targetIndex);

    const loadPromise = (async () => {
      if (!model) return;

      progressContainer.style.display = 'block';
      progressContainer.style.opacity = '1';
      progressText.innerText = priority
        ? 'Приоритетная загрузка модели…'
        : 'Загрузка модели…';
      updateProgress();

      const modelSrc = await getPreparedModelSrc(cfg, signal);

      if (signal && signal.aborted) {
        throw new DOMException('Загрузка отменена', 'AbortError');
      }

      await new Promise((resolve, reject) => {
        let settled = false;

        function cleanup() {
          model.removeEventListener('model-loaded', onLoaded);
          model.removeEventListener('model-error', onError);
        }

        function onLoaded() {
          if (settled) return;
          settled = true;
          cleanup();
          markModelLoaded(cfg);
          resolve();
        }

        function onError(event) {
          if (settled) return;
          settled = true;
          cleanup();
          reject(event);
        }

        model.addEventListener('model-loaded', onLoaded);
        model.addEventListener('model-error', onError);
        model.setAttribute('src', modelSrc);
      });
    })()
      .catch(error => {
        if (error && error.name === 'AbortError') {
          console.log('[AR cache] model preload aborted:', cfg.modelSrc);
          return;
        }

        console.warn('[AR cache] model preload failed:', cfg.modelSrc, error);
        progressText.innerText = `Ошибка загрузки: ${cfg.modelSrc}`;
      })
      .finally(() => {
        modelLoadPromises.delete(cfg.targetIndex);
      });

    modelLoadPromises.set(cfg.targetIndex, loadPromise);
    return loadPromise;
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

  function resumeBackgroundPreload(delay = 700) {
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
      for (const cfg of AR_CONFIG) {
        if (backgroundPreloadPaused) break;
        if (loadedTargetIndexes.has(cfg.targetIndex)) continue;

        backgroundPreloadController = new AbortController();

        try {
          await loadModelForConfig(cfg, {
            priority: false,
            signal: backgroundPreloadController.signal
          });
        } catch (error) {
          if (error && error.name === 'AbortError') {
            break;
          }
        } finally {
          backgroundPreloadController = null;
        }

        await new Promise(resolve => setTimeout(resolve, 400));
      }
    } finally {
      backgroundPreloadRunning = false;
    }
  }

  window.requestPriorityModelLoad = async function (targetIndex) {
    const cfg = modelConfigsByTargetIndex.get(targetIndex);
    if (!cfg) return;

    stopBackgroundPreload();

    const priorityController = new AbortController();

    try {
      await loadModelForConfig(cfg, {
        priority: true,
        signal: priorityController.signal
      });
    } finally {
      resumeBackgroundPreload(900);
    }
  };

  AR_CONFIG.forEach(cfg => {
    loadState[cfg.modelId] = { loaded: 0, total: 1 };
    modelConfigsByTargetIndex.set(cfg.targetIndex, cfg);

    const targetEntity = document.createElement('a-entity');
    targetEntity.setAttribute('mindar-image-target', `targetIndex:${cfg.targetIndex}`);

    const wrapper = document.createElement('a-entity');
    wrapper.setAttribute(
      'ar-animation-controller',
      `clip:${cfg.animationClip}; targetIndex:${cfg.targetIndex}`
    );

    const model = document.createElement('a-gltf-model');
    model.setAttribute('id', cfg.modelId);
    model.setAttribute('position', cfg.position);
    model.setAttribute('rotation', cfg.rotation);
    model.setAttribute('scale', cfg.scale);
    model.dataset.minScale = String(cfg.minScale);
    model.dataset.maxScale = String(cfg.maxScale);

    wrapper.appendChild(model);
    targetEntity.appendChild(wrapper);
    scene.appendChild(targetEntity);

    modelEls.push(model);
    modelElsByTargetIndex.set(cfg.targetIndex, model);

    wrapper.addEventListener('model-activated', () => {
      if (getActiveModel() === model) {
        setPlayingUI();
      }
    });

    wrapper.addEventListener('animation-finished', () => {
      if (getActiveModel() === model) {
        setReplayUI();
      }
    });

    wrapper.addEventListener('model-reset', () => {
      setButtonsDisabled(true);
    });
  });

  registerModelCacheWorker();
  resumeBackgroundPreload(600);

  function toggleFullscreen() {
    const elem = document.documentElement;

    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }

  fullscreenBtn.addEventListener('click', async () => {
    toggleFullscreen();
    setTimeout(() => {
      tryLockPortrait();
    }, 300);
  });

  document.addEventListener('fullscreenchange', () => {
    tryLockPortrait();
  });

  let pinchStartDistance = null;
  let pinchStartScale = null;

  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function setUniformScale(modelEl, value) {
    const minScale = parseFloat(modelEl.dataset.minScale || '0.1');
    const maxScale = parseFloat(modelEl.dataset.maxScale || '1');
    const clamped = Math.max(minScale, Math.min(maxScale, value));
    modelEl.setAttribute('scale', `${clamped} ${clamped} ${clamped}`);
  }

  scene.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 2) return;

    const modelEl = getActiveModel();
    if (!modelEl) return;

    e.preventDefault();

    pinchStartDistance = getDistance(e.touches);

    const currentScale = modelEl.getAttribute('scale');
    pinchStartScale = currentScale.x;
  }, { passive: false });

  scene.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 2) return;
    if (pinchStartDistance === null || pinchStartScale === null) return;

    const modelEl = getActiveModel();
    if (!modelEl) return;

    e.preventDefault();

    const currentDistance = getDistance(e.touches);
    const ratio = currentDistance / pinchStartDistance;
    const newScale = pinchStartScale * ratio;

    setUniformScale(modelEl, newScale);
  }, { passive: false });

  scene.addEventListener('touchend', function (e) {
    if (e.touches.length < 2) {
      pinchStartDistance = null;
      pinchStartScale = null;
    }
  }, { passive: false });

  scene.addEventListener('touchcancel', function () {
    pinchStartDistance = null;
    pinchStartScale = null;
  }, { passive: false });

  controlBtn.addEventListener('click', () => {
    const controller = getActiveController();
    const modelEl = getActiveModel();
    if (!controller || !modelEl) return;

    if (controlBtn.textContent === '⏸') {
      controller.pause();
      setPausedUI();
    } else if (controlBtn.textContent === '▶') {
      controller.play();
      setPlayingUI();
    } else if (controlBtn.textContent === '↻') {
      controller.replay();
      setPlayingUI();
    }
  });

  function setSpeed(speed) {
    const controller = getActiveController();
    if (!controller) return;

    controller.setSpeed(speed);
    refreshControlButtonState();
  }

  forwardBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setSpeed(2);
  });

  forwardBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setSpeed(1);
  });

  forwardBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setSpeed(2);
  });

  forwardBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    setSpeed(1);
  });

  forwardBtn.addEventListener('mouseleave', () => {
    setSpeed(1);
  });

  rewindBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setSpeed(-2);
  });

  rewindBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    setSpeed(1);
  });

  rewindBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setSpeed(-2);
  });

  rewindBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    setSpeed(1);
  });

  rewindBtn.addEventListener('mouseleave', () => {
    setSpeed(1);
  });

  window.addEventListener('blur', () => {
    setSpeed(1);
  });

  resetBtn.addEventListener('click', () => {
    modelEls.forEach(modelEl => {
      const wrapper = modelEl.parentEl;
      const comp = wrapper && wrapper.components['ar-animation-controller'];
      if (comp) comp.reset();
    });

    setButtonsDisabled(true);
  });

  let tapCount = 0;
  let tapTimer = null;
  const HIDE_DELAY = 500;

  function resetTapCount() {
    tapCount = 0;
    if (tapTimer) {
      clearTimeout(tapTimer);
      tapTimer = null;
    }
  }

  function toggleInterface() {
    const anyVisible = allButtons[0]?.style.display !== 'none';
    const newDisplay = anyVisible ? 'none' : 'flex';
    allButtons.forEach(btn => btn.style.display = newDisplay);
  }

  scene.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      resetTapCount();
      return;
    }

    tapCount++;
    if (tapTimer) clearTimeout(tapTimer);
    tapTimer = setTimeout(resetTapCount, HIDE_DELAY);

    if (tapCount === 2) {
      e.preventDefault();
      tapCount = 0;
      clearTimeout(tapTimer);
      tapTimer = null;
      toggleInterface();
    }
  }, { passive: false });

  let swipeStartY = null;
  let swipeStartTime = null;
  const SWIPE_THRESHOLD = 50;
  const SWIPE_TIME_LIMIT = 500;

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  }

  function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }

  scene.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) {
      swipeStartY = null;
      return;
    }
    swipeStartY = e.touches[0].clientY;
    swipeStartTime = Date.now();
  });

  scene.addEventListener('touchmove', (e) => {
    if (swipeStartY === null || e.touches.length !== 1) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - swipeStartY;
    const deltaTime = Date.now() - swipeStartTime;

    if (Math.abs(deltaY) > SWIPE_THRESHOLD && deltaTime < SWIPE_TIME_LIMIT) {
      const fullscreen = isFullscreen();

      if (fullscreen) {
        e.preventDefault();
        exitFullscreen();
        swipeStartY = null;
      } else {
        if (deltaY > 0) {
          e.preventDefault();
          enterFullscreen();
          swipeStartY = null;
        }
      }
    }
  });

  scene.addEventListener('touchend', () => {
    swipeStartY = null;
  });

  function updateOrientationUI() {
    const mode = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

    document.body.classList.remove('landscape', 'portrait');
    document.body.classList.add(mode);

    return mode;
  }

  function restartMindARAfterOrientation() {
    const arSystem = getMindARSystem();
    if (!arSystem) return;

    window.isOrientationChanging = true;

    if (orientationResetTimer) {
      clearTimeout(orientationResetTimer);
      orientationResetTimer = null;
    }

    try {
      arSystem.stop();
    } catch (e) {
      console.warn('[AR] stop error after orientation', e);
    }

    orientationResetTimer = setTimeout(async () => {
      try {
        if (scene.renderer) {
          scene.renderer.setSize(window.innerWidth, window.innerHeight);
        }

        if (scene.camera) {
          scene.camera.aspect = window.innerWidth / window.innerHeight;
          scene.camera.updateProjectionMatrix();
        }

        await arSystem.start();

        setTimeout(() => {
          window.isOrientationChanging = false;
        }, 500);
      } catch (e) {
        console.warn('[AR] restart error after orientation', e);
        window.isOrientationChanging = false;
      }
    }, 500);
  }

  function handleBrowserOrientationChange() {
    const newMode = updateOrientationUI();

    if (newMode !== lastLayoutMode) {
      lastLayoutMode = newMode;
      restartMindARAfterOrientation();
    }
  }

  window.addEventListener('resize', handleBrowserOrientationChange);
  window.addEventListener('orientationchange', handleBrowserOrientationChange);

  document.addEventListener('DOMContentLoaded', () => {
    tryLockPortrait();
  });

  window.addEventListener('load', () => {
    tryLockPortrait();
  });

  lastLayoutMode = updateOrientationUI();

})();
