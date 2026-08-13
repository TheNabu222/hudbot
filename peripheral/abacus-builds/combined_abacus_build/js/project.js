/* ===== PROJECT SYSTEM ===== */
const Project = {
  init() {
    document.getElementById('btn-new-project').addEventListener('click', () => this.newProject());
    document.getElementById('btn-open-project').addEventListener('click', () => this.showOpenModal());
    document.getElementById('btn-save-project').addEventListener('click', () => this.saveProject());

    document.getElementById('btn-open-file').addEventListener('click', () => this.chooseProjectFile());
    document.getElementById('project-file-input').addEventListener('change', (e) => this.openFile(e));
    document.getElementById('btn-open-included').addEventListener('click', () => this.loadIncludedSave());
    document.getElementById('btn-open-local').addEventListener('click', () => this.loadFromLocal());
    const dropZone = document.getElementById('project-drop-zone');
    ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => {
      event.preventDefault();
      dropZone.classList.add('is-dragging');
    }));
    ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => {
      event.preventDefault();
      dropZone.classList.remove('is-dragging');
    }));
    dropZone.addEventListener('drop', event => this.openDroppedFile(event));

    // Project name editing
    document.getElementById('project-name').addEventListener('dblclick', () => this.renameProject());

    // Modal close
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModals());
    });
    document.getElementById('modal-backdrop').addEventListener('click', () => this.closeModals());
  },

  newProject() {
    if (!confirm('Create a new project? Unsaved changes will be lost.')) return;
    State.project = {
      id: `anzu-${Date.now()}`,
      name: 'Untitled Project',
      canvasWidth: 800,
      canvasHeight: 600,
      scenes: [],
      assets: [],
      activeSceneId: null,
      dialogueTrees: [],
      inventoryItems: [],
      flags: [],
      saveLoadSettings: { autoSave: true, autoSaveOnTransition: true, maxSlots: 5, showSaveLoadUI: true },
      inventoryUI: { style: 'bar', slotSize: 40, position: 'bottom' },
      questUI: { showPanel: true, pinTracked: true, accent: '#7c5cfc' },
      theme: 'dark',
      engineFeatures: (typeof EngineLoader !== 'undefined' ? EngineLoader.defaultFeatures() : {
        core: true, dialogue: true, inventory: true, needs: true, reputation: true,
        quests: true, stats: true, time: true, status: true, npc: true, saveload: true, debug: false,
      }),
      startSceneId: null,
      facts: [],
      conditionGroups: [],
      actions: [],
      eventRules: [],
      storyPhases: [],
      characters: [],
      quests: [],
      items: [],
    };
    State.undoStack = [];
    State.redoStack = [];
    State.selectedObjectId = null;

    const scene = State.createScene('Scene 1');
    State.project.activeSceneId = scene.id;
    State.project.startSceneId = scene.id;

    this.refreshAll();
    State.autoSave();
  },

  saveProject() {
    const json = State.toJSON();
    const name = Utils.sanitizeName(State.project.name) || 'untitled';
    Utils.download(json, `${name}.anzu`, 'application/json');
    State.autoSave();
  },

  showOpenModal() {
    document.getElementById('modal-backdrop').hidden = false;
    document.getElementById('modal-open').hidden = false;
    this.showOpenStatus('');

    // Show autosave info
    const time = localStorage.getItem('anzu_autosave_time');
    const recent = document.getElementById('recent-projects');
    if (time) {
      recent.innerHTML = `<p style="margin-top:12px;color:var(--text-secondary);font-size:12px">
        Last autosave: ${new Date(time).toLocaleString()}</p>`;
    } else {
      recent.innerHTML = '<p style="color:var(--text-muted);font-size:12px">No autosave found.</p>';
    }
  },

  async chooseProjectFile() {
    this.showOpenStatus('');
    if ('showOpenFilePicker' in window && window.isSecureContext) {
      try {
        const [handle] = await window.showOpenFilePicker({
          id: 'anzu-project-open',
          multiple: false,
          types: [{
            description: 'Anzu and Hudbot project saves',
            accept: { 'application/json': ['.json', '.anzu'] },
          }],
        });
        const file = await handle.getFile();
        await this.openSelectedFile(file);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.warn('The permission-based file picker could not open the project:', err);
        this.showOpenStatus(
          'The browser could not access that file. Move it to Downloads, then choose Open File again.',
          'error'
        );
      }
      return;
    }

    const input = document.getElementById('project-file-input');
    input.value = '';
    input.click();
  },

  async openFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await this.openSelectedFile(file);
    } finally {
      e.target.value = '';
    }
  },

  async openDroppedFile(event) {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!/\.(json|anzu)$/i.test(file.name || '')) {
      this.showOpenStatus('Drop a .json or .anzu project save.', 'error');
      return;
    }
    await this.openSelectedFile(file);
  },

  async openSelectedFile(file) {
    try {
      this.showOpenStatus(`Opening ${file.name}...`, 'working');
      const text = await this.readFileText(file);
      let projectData;
      try {
        projectData = JSON.parse(text);
      } catch (err) {
        this.showOpenStatus('That file is not a readable Anzu or Hudbot project.', 'error');
        return;
      }
      if (State.fromJSON(projectData)) {
        this.showOpenStatus('');
        this.closeModals();
        this.refreshAll();
        State.autoSave();
      } else {
        this.showOpenStatus('That file is not a readable Anzu or Hudbot project.', 'error');
      }
    } catch (err) {
      console.warn('Could not read selected project file:', err);
      this.showOpenStatus(
        'The browser lost access to that file. Move it to Downloads or drag it onto Drop Save Here.',
        'error'
      );
    }
  },

  readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result || '')));
      reader.addEventListener('error', () => reject(reader.error || new Error('The file could not be read.')));
      reader.addEventListener('abort', () => reject(new Error('File reading was cancelled.')));
      reader.readAsText(file);
    });
  },

  showOpenStatus(message, type = '') {
    const status = document.getElementById('project-open-status');
    if (!status) return;
    status.hidden = !message;
    status.className = `project-open-status${type ? ` is-${type}` : ''}`;
    status.textContent = message;
  },

  async loadFromUrl(projectPath) {
    if (!projectPath) return false;

    try {
      const url = new URL(projectPath, window.location.href);
      if (url.origin !== window.location.origin) {
        throw new Error('Project links must come from this site.');
      }

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Project file returned ${response.status}.`);
      return State.fromJSON(await response.text());
    } catch (err) {
      console.warn('Could not load linked project:', err);
      return false;
    }
  },

  async loadIncludedSave() {
    this.showOpenStatus('Loading your Hudbot save...', 'working');
    const loaded = await this.loadFromUrl('../Point-and-Click_RPG_Build/Uploads/7262026_stripped.json');
    if (!loaded) {
      this.showOpenStatus('The included Hudbot save could not be reached from this server.', 'error');
      return false;
    }
    this.showOpenStatus('');
    this.closeModals();
    this.refreshAll();
    State.autoSave();
    return true;
  },

  loadFromLocal() {
    if (State.loadAutoSave()) {
      this.showOpenStatus('');
      this.closeModals();
      this.refreshAll();
    } else {
      this.showOpenStatus('No autosave was found in this browser.', 'error');
    }
  },

  renameProject() {
    const name = prompt('Project name:', State.project.name);
    if (name && name.trim()) {
      State.project.name = name.trim();
      document.getElementById('project-name').textContent = State.project.name;
      State.autoSave();
    }
  },

  closeModals() {
    document.getElementById('modal-backdrop').hidden = true;
    document.querySelectorAll('.modal').forEach(m => m.hidden = true);
  },

  refreshAll() {
    if (typeof UnifiedProject !== 'undefined') UnifiedProject.ensureProjectData(State.project);
    document.getElementById('project-name').textContent = State.project.name;

    // Ensure schema for older projects
    if (!State.project.dialogueTrees) State.project.dialogueTrees = [];
    if (!State.project.inventoryItems) State.project.inventoryItems = [];
    if (!State.project.flags) State.project.flags = [];
    if (!State.project.saveLoadSettings) {
      State.project.saveLoadSettings = { autoSave: true, autoSaveOnTransition: true, maxSlots: 5, showSaveLoadUI: true };
    }
    if (!State.project.inventoryUI) State.project.inventoryUI = { style: 'bar', slotSize: 40, position: 'bottom' };
    if (!State.project.questUI) State.project.questUI = { showPanel: true, pinTracked: true, accent: '#7c5cfc' };
    if (!State.project.theme) State.project.theme = 'dark';
    if (typeof EngineLoader !== 'undefined') EngineLoader.ensureProjectFeatures();
    if (typeof ThemeSystem !== 'undefined') ThemeSystem.applyTheme(State.project.theme);
    if (typeof RPGSystems !== 'undefined') RPGSystems.ensureData();
    if (typeof Transitions !== 'undefined') Transitions.ensureSceneTransitions();

    // Ensure at least one scene
    if (!State.project.scenes.length) {
      const scene = State.createScene('Scene 1');
      State.project.activeSceneId = scene.id;
    }
    if (!State.project.activeSceneId) {
      State.project.activeSceneId = State.project.scenes[0].id;
    }

    Canvas.applyCanvasSize();
    Scenes.render();
    Canvas.renderScene();
    if (typeof DeviceFrame !== 'undefined') DeviceFrame.renderEditor();
    if (typeof HudStudio !== 'undefined') HudStudio.render();
    Layers.render();
    Assets.render();
    Properties.update();
    if (typeof WorldWorkspace !== 'undefined' && !document.getElementById('world-workspace')?.hidden) {
      WorldWorkspace.render();
    }
    // Phase 3D: migrate clickboxes and refresh inspector
    if (typeof Hitbox !== 'undefined') {
      Hitbox.migrateAllBoxes();
      Hitbox.render();
      Hitbox.renderList();
    }
    if (typeof ClickboxInspector !== 'undefined') ClickboxInspector.update();
  },
};
