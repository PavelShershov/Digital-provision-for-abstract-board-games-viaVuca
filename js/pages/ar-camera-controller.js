const AR_CONFIG = [
  {
    targetIndex: 0,
    modelId: 'siga',
    modelSrc: 'assets/models/surk.glb',
    position: '0 0 0',
    rotation: '90 0 0',
    scale: '0.3 0.3 0.3',
    animationClip: '*',
    minScale: 0.1,
    maxScale: 1
  },
  {
    targetIndex: 1,
    modelId: 'fan',
    modelSrc: 'assets/models/fan.glb',
    position: '0 0 0',
    rotation: '90 0 0',
    scale: '0.3 0.3 0.3',
    animationClip: '*',
    minScale: 0.1,
    maxScale: 1
  },
  {
    targetIndex: 2,
    modelId: 'hnef',
    modelSrc: 'assets/models/hnef.glb',
    position: '0 0 0',
    rotation: '90 0 0',
    scale: '0.3 0.3 0.3',
    animationClip: '*',
    minScale: 0.1,
    maxScale: 1
  },
  {
    targetIndex: 3,
    modelId: 'dabl',
    modelSrc: 'assets/models/dabl.glb',
    position: '0 0 0',
    rotation: '90 0 0',
    scale: '0.3 0.3 0.3',
    animationClip: '*',
    minScale: 0.1,
    maxScale: 1
  },
  {
    targetIndex: 4,
    modelId: 'akl',
    modelSrc: 'assets/models/surk.glb',
    position: '0 0 0',
    rotation: '90 0 0',
    scale: '0.3 0.3 0.3',
    animationClip: '*',
    minScale: 0.1,
    maxScale: 1
  },
  {
    targetIndex: 5,
    modelId: 'surk',
    modelSrc: 'assets/models/alk.glb',
    position: '0 0 0',
    rotation: '90 0 0',
    scale: '0.3 0.3 0.3',
    animationClip: '*',
    minScale: 0.1,
    maxScale: 1
  }
];

window.activeModel = null;
window.activeTargetIndex = null;
window.isOrientationChanging = false;

AFRAME.registerComponent('ar-animation-controller', {
  schema: {
    clip: { type: 'string', default: '*' },
    targetIndex: { type: 'int', default: -1 }
  },

  init: function () {
    this._modelLoaded = false;
    this._animationStarted = false;
    this._detached = false;
    this._ignoreActivation = false;
    this._targetVisible = false;

    this._isPaused = false;
    this._isFinished = false;
    this._hasStartedPlayback = false;
    this._currentSpeed = 1;

    this._targetEntity = this.el.parentEl;
    this._modelEl = this.el.querySelector('a-gltf-model');

    this._onTargetFound = this._onTargetFound.bind(this);
    this._onTargetLost = this._onTargetLost.bind(this);
    this._onModelLoaded = this._onModelLoaded.bind(this);

    this._targetEntity.addEventListener('targetFound', this._onTargetFound);
    this._targetEntity.addEventListener('targetLost', this._onTargetLost);

    if (this._modelEl) {
      this._modelEl.addEventListener('model-loaded', this._onModelLoaded);
    }

    this.el.object3D.visible = false;
  },

  _onModelLoaded: function () {
    this._modelLoaded = true;

    const mesh = this._modelEl.getObject3D('mesh');
    if (mesh && mesh.animations) {
      console.log('[AR] клипы модели:', this._modelEl.id);
      mesh.animations.forEach((clip, index) => {
        console.log(index, clip.name, 'duration:', clip.duration);
      });
    }

    console.log('[AR] модель загружена:', this._modelEl.id);

    if (this._targetVisible) {
      requestAnimationFrame(() => this._onTargetFound());
    }
  },

  _getAnimComponent: function () {
    if (!this._modelEl) return null;
    return this._modelEl.components['animation-mixer'] || null;
  },

  _getActions: function () {
    const anim = this._getAnimComponent();
    if (!anim || !anim.mixer) return [];
    return anim.mixer._actions || [];
  },

  _resetAllActions: function () {
    const actions = this._getActions();

    actions.forEach(action => {
      action.reset();
      action.enabled = true;
      action.paused = false;
      action.clampWhenFinished = true;
      action.setLoop(THREE.LoopOnce, 1);
    });
  },

  _playFromStart: function () {
    const anim = this._getAnimComponent();
    if (!anim || !anim.mixer) return;

    anim.mixer.timeScale = 1;
    this._currentSpeed = 1;
    this._isPaused = false;
    this._isFinished = false;
    this._hasStartedPlayback = true;

    this._resetAllActions();

    const actions = this._getActions();
    if (actions.length > 0) {
      actions.forEach(action => {
        action.reset();
        action.play();
      });
    } else {
      anim.mixer.setTime(0);
      if (typeof anim.play === 'function') {
        anim.play();
      }
    }
  },

  _ensureAnimationStarted: function () {
    if (!this._modelEl) return;

    if (!this._animationStarted) {
      this._modelEl.setAttribute('animation-mixer', {
        clip: this.data.clip,
        loop: 'once',
        clampWhenFinished: true,
        timeScale: 1
      });

      this._animationStarted = true;

      requestAnimationFrame(() => {
        this._playFromStart();
        this.el.emit('model-activated', { modelEl: this._modelEl });
      });
    }
  },

  _allActionsFinished: function () {
    const actions = this._getActions();
    if (!actions.length) return false;

    const epsilon = 0.03;

    const relevantActions = actions.filter(action => {
      const clip = typeof action.getClip === 'function' ? action.getClip() : null;
      return clip && clip.duration > 0;
    });

    if (!relevantActions.length) return false;

    return relevantActions.every(action => {
      const clip = action.getClip();
      return action.time >= (clip.duration - epsilon);
    });
  },

  tick: function () {
    if (!this._animationStarted) return;
    if (this._isPaused) return;
    if (this._isFinished) return;
    if (!this._hasStartedPlayback) return;
    if (window.activeModel !== this._modelEl) return;
    if (this._currentSpeed <= 0) return;

    if (this._allActionsFinished()) {
      this._isFinished = true;
      this.el.emit('animation-finished', { modelEl: this._modelEl });
    }
  },

  _onTargetFound: function () {
    this._targetVisible = true;

    if (typeof window.requestPriorityModelLoad === 'function') {
      window.requestPriorityModelLoad(this.data.targetIndex);
    }

    if (!this._modelLoaded) return;
    if (this._ignoreActivation) return;
    if (window.isOrientationChanging) return;

    console.log('[AR] маркер найден:', this._modelEl.id);

    requestAnimationFrame(() => {
      const wrapperObj = this.el.object3D;

      if (window.activeModel && window.activeModel !== this._modelEl) {
        return;
      }

      if (
        window.activeTargetIndex !== null &&
        window.activeTargetIndex !== this.data.targetIndex
      ) {
        return;
      }

      if (this._detached) {
        this._targetEntity.object3D.attach(wrapperObj);
        wrapperObj.position.set(0, 0, 0);
        wrapperObj.rotation.set(0, 0, 0);
        wrapperObj.scale.set(1, 1, 1);
        this._detached = false;
        console.log('[AR] контейнер примагнитился обратно:', this._modelEl.id);
      }

      this.el.object3D.visible = true;

      if (!window.activeModel) {
        window.activeModel = this._modelEl;
        window.activeTargetIndex = this.data.targetIndex;
        this._ensureAnimationStarted();
        this.el.emit('model-activated', { modelEl: this._modelEl });
      }
    });
  },

  _onTargetLost: function () {
    if (!this._modelLoaded) return;
    if (window.isOrientationChanging) return;
    if (window.activeModel && window.activeModel !== this._modelEl) return;

    this._targetVisible = false;
    console.log('[AR] маркер потерян:', this._modelEl.id);

    const wrapperObj = this.el.object3D;
    const scene = this.el.sceneEl;

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    wrapperObj.getWorldPosition(worldPos);
    wrapperObj.getWorldQuaternion(worldQuat);
    wrapperObj.getWorldScale(worldScale);

    scene.object3D.attach(wrapperObj);

    wrapperObj.position.copy(worldPos);
    wrapperObj.quaternion.copy(worldQuat);

    if (
      isFinite(worldScale.x) && isFinite(worldScale.y) && isFinite(worldScale.z) &&
      worldScale.x !== 0 && worldScale.y !== 0 && worldScale.z !== 0
    ) {
      wrapperObj.scale.copy(worldScale);
    } else {
      wrapperObj.scale.set(1, 1, 1);
    }

    this._detached = true;

    if (this._ignoreActivation) {
      this._ignoreActivation = false;
    }

    console.log('[AR] контейнер остался в мире:', this._modelEl.id);
  },

  play: function () {
    const anim = this._getAnimComponent();
    if (!anim) return;

    this._isPaused = false;

    if (anim.mixer) {
      anim.mixer.timeScale = 1;
      this._currentSpeed = 1;
      const actions = this._getActions();
      actions.forEach(action => {
        action.paused = false;
      });
    }

    if (typeof anim.play === 'function') {
      anim.play();
    }
  },

  pause: function () {
    const anim = this._getAnimComponent();
    if (!anim) return;

    this._isPaused = true;

    if (anim.mixer) {
      const actions = this._getActions();
      actions.forEach(action => {
        action.paused = true;
      });
    }

    if (typeof anim.pause === 'function') {
      anim.pause();
    }
  },

  replay: function () {
    this._playFromStart();
  },

  setSpeed: function (speed) {
    const anim = this._getAnimComponent();
    if (!anim || !anim.mixer) return;

    this._isPaused = false;
    this._currentSpeed = speed;

    if (speed !== 0) {
      this._isFinished = false;
    }

    anim.mixer.timeScale = speed;

    const actions = this._getActions();
    actions.forEach(action => {
      action.paused = false;
    });
  },

  isFinished: function () {
    return this._isFinished;
  },

  isPaused: function () {
    return this._isPaused;
  },

  reset: function () {
    console.log('[AR] reset:', this._modelEl.id);

    if (window.activeModel === this._modelEl) {
      window.activeModel = null;
    }

    if (window.activeTargetIndex === this.data.targetIndex) {
      window.activeTargetIndex = null;
    }

    const anim = this._getAnimComponent();

    if (anim) {
      if (anim.mixer) {
        anim.mixer.timeScale = 1;
        const actions = this._getActions();
        actions.forEach(action => {
          action.stop();
          action.reset();
        });
        anim.mixer.setTime(0);
      }

      if (typeof anim.stop === 'function') {
        anim.stop();
      } else if (typeof anim.pause === 'function') {
        anim.pause();
      }
    }

    if (this._modelEl) {
      this._modelEl.removeAttribute('animation-mixer');
    }

    this._animationStarted = false;
    this._detached = false;
    this._isPaused = false;
    this._isFinished = false;
    this._hasStartedPlayback = false;
    this._currentSpeed = 1;

    this.el.object3D.visible = false;

    this._targetEntity.object3D.attach(this.el.object3D);
    this.el.object3D.position.set(0, 0, 0);
    this.el.object3D.rotation.set(0, 0, 0);
    this.el.object3D.scale.set(1, 1, 1);

    this._ignoreActivation = this._targetVisible;

    this.el.emit('model-reset', { modelEl: this._modelEl });
  },

  remove: function () {
    if (this._targetEntity) {
      this._targetEntity.removeEventListener('targetFound', this._onTargetFound);
      this._targetEntity.removeEventListener('targetLost', this._onTargetLost);
    }

    if (this._modelEl) {
      this._modelEl.removeEventListener('model-loaded', this._onModelLoaded);
    }
  }
});
