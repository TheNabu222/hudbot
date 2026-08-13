/* ===== PROJECT FORMAT COMPATIBILITY ===== */
const ProjectCompatibility = {
  _githubAssetSource(assetId) {
    if (!assetId || !assetId.startsWith('github:')) return '';
    const path = assetId.slice('github:'.length)
      .split('/')
      .filter(part => part && part !== '.' && part !== '..')
      .map(encodeURIComponent)
      .join('/');
    return path
      ? `https://raw.githubusercontent.com/thenabu222/entropic-ai/main/${path}`
      : '';
  },

  _assetSource(asset) {
    return asset.dataURL || asset.src || this._githubAssetSource(asset.id) || '';
  },

  _interactionToClickAction(interaction) {
    const actions = {
      scene_change: 'scene-change',
      dialogue: 'start-dialogue',
      give_item: 'give-item',
      'give-item': 'give-item',
      custom_script: 'custom',
    };
    return actions[interaction] || (interaction === 'none' ? 'none' : null);
  },

  normalize(project) {
    if (!project || typeof project !== 'object') {
      throw new Error('Project data must be an object.');
    }

    if (typeof UnifiedProject !== 'undefined') {
      project = UnifiedProject.toAnzu(project);
    }

    const rawScenes = Array.isArray(project.scenes) ? project.scenes : [];
    const firstScene = rawScenes[0] || {};
    const stageWidth = Number(
      project.canvasWidth ||
      project.globalSettings?.stageWidth ||
      firstScene.width ||
      800
    );
    const stageHeight = Number(
      project.canvasHeight ||
      project.globalSettings?.stageHeight ||
      firstScene.height ||
      600
    );
    const assets = (Array.isArray(project.assets) ? project.assets : []).map((asset, index) => {
      const source = this._assetSource(asset);
      return {
        ...asset,
        id: asset.id || `imported-asset-${index + 1}`,
        name: asset.name || `Imported Asset ${index + 1}`,
        src: asset.src || source,
        dataURL: source,
        width: Number(asset.width) || 100,
        height: Number(asset.height) || 100,
        type: asset.type || 'image',
      };
    });
    const assetsById = new Map(assets.map(asset => [asset.id, asset]));

    const normalizeObject = (object, sceneIndex, objectIndex) => {
      const linkedAssetId = object.assetId || object._assetId || '';
      let linkedAsset = linkedAssetId ? assetsById.get(linkedAssetId) : null;
      const objectSource = object.src || '';

      if (!linkedAsset && objectSource) {
        linkedAsset = assets.find(asset =>
          asset.src === objectSource || asset.dataURL === objectSource
        );
      }

      if (!linkedAsset && objectSource && !object.isText && !object.isHitbox) {
        linkedAsset = {
          id: linkedAssetId || `imported-object-asset-${sceneIndex + 1}-${objectIndex + 1}`,
          name: object.name || `Imported Object ${objectIndex + 1}`,
          src: objectSource,
          dataURL: objectSource,
          width: Number(object.width) || 100,
          height: Number(object.height) || 100,
          type: 'image',
        };
        assets.push(linkedAsset);
        assetsById.set(linkedAsset.id, linkedAsset);
      }

      const mappedClickAction = this._interactionToClickAction(object.interaction);
      return {
        ...object,
        id: object.id || `imported-object-${sceneIndex + 1}-${objectIndex + 1}`,
        assetId: linkedAsset?.id || linkedAssetId,
        width: Number(object.width) || linkedAsset?.width || 100,
        height: Number(object.height) || linkedAsset?.height || 100,
        rotation: Number(object.rotation) || 0,
        opacity: object.opacity == null ? 1 : Number(object.opacity),
        blendMode: object.blendMode || 'normal',
        flipX: Boolean(object.flipX),
        flipY: Boolean(object.flipY),
        locked: Boolean(object.locked),
        visible: object.visible !== false,
        zIndex: Number.isFinite(Number(object.zIndex)) ? Number(object.zIndex) : objectIndex,
        clickAction: object.clickAction || mappedClickAction || 'none',
        dialogueTreeId: object.dialogueTreeId || '',
        targetSceneId: object.targetSceneId || '',
      };
    };

    const normalizeSceneRecord = (scene, sceneIndex, isUiMenu = false) => ({
      ...scene,
      id: scene.id || `imported-${isUiMenu ? 'ui' : 'scene'}-${sceneIndex + 1}`,
      name: scene.name || `${isUiMenu ? 'Interface' : 'Scene'} ${sceneIndex + 1}`,
      bgColor: scene.bgColor || scene.backgroundColor || 'transparent',
      objects: (Array.isArray(scene.objects) ? scene.objects : []).map((object, objectIndex) =>
        normalizeObject(object, sceneIndex, objectIndex)
      ),
      hitboxes: Array.isArray(scene.hitboxes) ? scene.hitboxes : [],
      isUiMenu,
    });
    const scenes = rawScenes.map((scene, sceneIndex) => normalizeSceneRecord(scene, sceneIndex));
    const uiMenus = (Array.isArray(project.uiMenus) ? project.uiMenus : []).map((menu, menuIndex) =>
      normalizeSceneRecord(menu, menuIndex, true)
    );
    const requestedSceneId = project.activeSceneId || project.currentSceneId;
    const activeSceneId = scenes.some(scene => scene.id === requestedSceneId)
      ? requestedSceneId
      : scenes[0]?.id || null;

    return {
      ...project,
      id: project.id || `anzu-${Date.now()}`,
      canvasWidth: stageWidth,
      canvasHeight: stageHeight,
      scenes,
      uiMenus,
      assets,
      activeSceneId,
    };
  },
};

/* ===== GLOBAL STATE ===== */
const State = {
  project: {
    id: `anzu-${Date.now()}`,
    name: 'Untitled Project',
    canvasWidth: 800,
    canvasHeight: 600,
    scenes: [],
    assets: [],   // { id, name, dataURL, width, height }
    activeSceneId: null,
    // Phase 3A
    dialogueTrees: [],
    inventoryItems: [],
    flags: [],
    saveLoadSettings: { autoSave: true, autoSaveOnTransition: true, maxSlots: 5, showSaveLoadUI: true },
    // Phase 3 UI customization
    inventoryUI: { style: 'bar', slotSize: 40, position: 'bottom' },
    questUI: { showPanel: true, pinTracked: true, accent: '#7c5cfc' },
    // Phase 3C engine + theme
    theme: 'dark',
    engineFeatures: {
      core: true,
      dialogue: true,
      inventory: true,
      needs: true,
      reputation: true,
      quests: true,
      stats: true,
      time: true,
      status: true,
      npc: true,
      saveload: true,
      debug: false,
    },
  },

  // UI state
  selectedObjectId: null,
  selectedHitboxId: null, // Phase 3D: selected clickbox in editor
  gridVisible: true,
  snapEnabled: false,
  snapSize: 32,
  isPreviewMode: false,
  isDragging: false,
  isResizing: false,
  isRotating: false,
  isDrawingHitbox: false,
  showHitboxes: true,

  // Undo/Redo
  undoStack: [],
  redoStack: [],
  maxUndo: 50,

  // ---- Scene helpers ----
  getActiveScene() {
    return this.project.scenes.find(s => s.id === this.project.activeSceneId) || null;
  },

  getObject(id) {
    const scene = this.getActiveScene();
    return scene ? scene.objects.find(o => o.id === id) : null;
  },

  getSelectedObject() {
    return this.selectedObjectId ? this.getObject(this.selectedObjectId) : null;
  },

  createScene(name) {
    const scene = {
      id: Utils.uid(),
      name: name || `Scene ${this.project.scenes.length + 1}`,
      objects: [],
      hitboxes: [],
      bgColor: 'transparent',
    };
    this.project.scenes.push(scene);
    return scene;
  },

  deleteScene(id) {
    const idx = this.project.scenes.findIndex(s => s.id === id);
    if (idx === -1 || this.project.scenes.length <= 1) return false;
    this.project.scenes.splice(idx, 1);
    if (this.project.activeSceneId === id) {
      this.project.activeSceneId = this.project.scenes[0].id;
    }
    return true;
  },

  createObject(assetId, x, y) {
    const scene = this.getActiveScene();
    if (!scene) return null;
    const asset = this.project.assets.find(a => a.id === assetId);
    if (!asset) return null;

    const maxZ = scene.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const obj = {
      id: Utils.uid(),
      assetId,
      name: asset.name,
      x, y,
      width: asset.width,
      height: asset.height,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      flipX: false,
      flipY: false,
      locked: false,
      visible: true,
      zIndex: maxZ + 1,
      // Interaction
      cursor: 'default',
      clickAction: 'none',
      targetSceneId: null,
      dialogueText: '',
      customJS: '',
      flavorText: '',
      // Phase 3A
      dialogueTreeId: '',      // which dialogue tree to trigger
      giveItemId: '',           // item to give player on click
      requireItemId: '',        // item required to interact
      requireItemFailText: '',  // text shown if missing item
      setFlag: null,            // { flag, operation, value }
      checkFlag: null,          // { flag, operator, value }
      flavorTexts: [],          // array of variant flavor texts
      flavorFlagConditions: [], // [{ text, flag, operator, value }] context-aware
      // Phase 3B
      skillCheck: null,         // { skill, difficulty, failText }
      questAction: null,        // { questId, milestoneId }
      repChange: null,          // { npcId, type, delta }
      applyEffectId: '',
      needChanges: {},
      npcBehavior: (typeof NPCAI !== 'undefined' ? NPCAI.createBehavior() : null),
    };
    scene.objects.push(obj);
    return obj;
  },

  deleteObject(id) {
    const scene = this.getActiveScene();
    if (!scene) return;
    const idx = scene.objects.findIndex(o => o.id === id);
    if (idx !== -1) scene.objects.splice(idx, 1);
    if (this.selectedObjectId === id) this.selectedObjectId = null;
  },

  // Undo
  pushUndo() {
    this.undoStack.push(JSON.stringify(this.project));
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
    this.redoStack = [];
  },

  undo() {
    if (!this.undoStack.length) return false;
    this.redoStack.push(JSON.stringify(this.project));
    const prev = JSON.parse(this.undoStack.pop());
    this.project = prev;
    return true;
  },

  redo() {
    if (!this.redoStack.length) return false;
    this.undoStack.push(JSON.stringify(this.project));
    const next = JSON.parse(this.redoStack.pop());
    this.project = next;
    return true;
  },

  // Serialize
  toJSON() {
    if (typeof UnifiedProject !== 'undefined') {
      return UnifiedProject.serialize(this.project);
    }
    return JSON.stringify(this.project, null, 2);
  },

  fromJSON(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      this.project = ProjectCompatibility.normalize(data);
      this.undoStack = [];
      this.redoStack = [];
      this.selectedObjectId = null;
      return true;
    } catch (e) {
      console.error('Failed to load project:', e);
      return false;
    }
  },

  // Auto-save to localStorage
  autoSave() {
    try {
      localStorage.setItem('anzu_autosave', this.toJSON());
      localStorage.setItem('anzu_autosave_time', new Date().toISOString());
    } catch (e) {
      console.warn('Autosave failed:', e);
    }
  },

  loadAutoSave() {
    try {
      const data = localStorage.getItem('anzu_autosave');
      if (data) return this.fromJSON(data);
    } catch (e) { /* ignore */ }
    return false;
  }
};
