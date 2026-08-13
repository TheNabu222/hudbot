/* ===== POINT-AND-CLICK WORLD WORKSPACE ===== */
const WorldWorkspace = {
  init() {
    const nav = document.getElementById('world-workspace-nav');
    if (nav) {
      nav.innerHTML = `
        <div class="world-nav-copy">
          <strong>World overview</strong><br>
          Scenes, routes, characters, quests, items, and game systems in one place.
        </div>
      `;
    }
  },

  open() {
    const workspace = document.getElementById('world-workspace');
    const wrapper = document.getElementById('canvas-wrapper');
    const status = document.getElementById('canvas-status-bar');
    const rightPanel = document.getElementById('right-panel');
    if (workspace) workspace.hidden = false;
    if (wrapper) wrapper.hidden = true;
    if (status) status.hidden = true;
    rightPanel?.classList.add('world-mode-hidden');
    this.render();
  },

  close() {
    const workspace = document.getElementById('world-workspace');
    const wrapper = document.getElementById('canvas-wrapper');
    const status = document.getElementById('canvas-status-bar');
    const rightPanel = document.getElementById('right-panel');
    if (workspace) workspace.hidden = true;
    if (wrapper) wrapper.hidden = false;
    if (status) status.hidden = false;
    rightPanel?.classList.remove('world-mode-hidden');
  },

  getRoutes(scene) {
    const routes = [];
    const add = (targetId, source) => {
      if (!targetId || routes.some(route => route.targetId === targetId)) return;
      routes.push({ targetId, source });
    };

    (scene?.objects || []).forEach(object => {
      if (object.clickAction === 'scene-change') add(object.targetSceneId, object.name);
      if (object.interaction === 'scene_change') add(object.interactionData, object.name);
      (object.clickResponses || []).forEach(response => {
        if (response.interaction === 'scene_change' || response.clickAction === 'scene-change') {
          add(response.interactionData || response.targetSceneId, object.name);
        }
      });
      (object.onClick?.responses || []).forEach(response => {
        (response.actionIds || []).forEach(actionId => {
          const action = (State.project.actions || []).find(candidate => candidate.id === actionId);
          if (action?.type === 'change_scene') {
            add(action.params?.sceneId || action.params?.targetSceneId, object.name);
          }
        });
      });
    });
    return routes;
  },

  formatLabel() {
    return 'Anzu + Cavebot + Hudbot';
  },

  render() {
    const container = document.getElementById('world-workspace');
    if (!container) return;
    UnifiedProject.ensureProjectData(State.project);

    const scenes = State.project.scenes || [];
    const sceneIds = new Set(scenes.map(scene => scene.id));
    const startSceneId = State.project.startSceneId || State.project.meta?.startSceneId || scenes[0]?.id || null;
    const sceneCards = scenes.map(scene => {
      const routes = this.getRoutes(scene);
      const broken = routes.filter(route => !sceneIds.has(route.targetId));
      return `
        <article class="world-card ${scene.id === startSceneId ? 'is-start' : ''} ${broken.length ? 'has-broken-link' : ''}" data-scene-id="${this._attr(scene.id)}">
          <div class="world-card-header">
            <h4 title="${this._attr(scene.name)}">${this._esc(scene.name)}</h4>
            ${scene.id === startSceneId ? '<span class="world-start-label">START</span>' : ''}
            ${broken.length ? `<span class="world-broken-label">${broken.length} BROKEN</span>` : ''}
          </div>
          <p class="world-card-meta">${(scene.objects || []).length} objects, ${(scene.hitboxes || []).length} clickable areas</p>
          <div class="world-routes">
            ${routes.length ? routes.map(route => {
              const target = scenes.find(candidate => candidate.id === route.targetId);
              return `<div class="world-route-row ${target ? '' : 'is-broken'}"><span aria-hidden="true">&#8594;</span><span>${target ? this._esc(target.name) : 'Missing scene'}</span></div>`;
            }).join('') : '<span class="world-empty">No outgoing routes</span>'}
          </div>
          <div class="world-card-actions">
            <button type="button" onclick="WorldWorkspace.openScene(${this._onclickArg(scene.id)})">Open scene</button>
            ${scene.id !== startSceneId ? `<button type="button" onclick="WorldWorkspace.setStartScene(${this._onclickArg(scene.id)})">Set as start</button>` : ''}
          </div>
        </article>
      `;
    }).join('');

    const counts = {
      scenes: scenes.length,
      assets: (State.project.assets || []).length,
      dialogue: (State.project.dialogueTrees || []).length,
      characters: (State.project.rpgNPCs || State.project.characters || []).length,
      quests: (State.project.rpgQuests || State.project.quests || []).length,
      items: (State.project.inventoryItems || State.project.items || []).length,
    };

    container.innerHTML = `
      <div class="world-header">
        <div>
          <h2>${this._esc(State.project.name || 'Untitled Project')}</h2>
          <p>Point-and-click world structure</p>
        </div>
        <span class="world-format-badge">${this._esc(this.formatLabel())}</span>
      </div>

      <div class="world-summary" aria-label="Project totals">
        ${Object.entries(counts).map(([label, value]) => `
          <div class="world-stat"><strong>${value}</strong><span>${this._esc(label)}</span></div>
        `).join('')}
      </div>

      <div class="world-section-header">
        <div><h3>Build</h3><p>Open the editor you need.</p></div>
      </div>
      <div class="world-tools">
        ${this.toolButton('dialogue', 'Dialogue', 'Conversations and choices')}
        ${this.toolButton('npcs', 'Characters', 'People, moods, and relationships')}
        ${this.toolButton('quests', 'Quests', 'Goals and milestones')}
        ${this.toolButton('inventory', 'Items', 'Inventory and combinations')}
        ${this.toolButton('systems', 'Needs and skills', 'Stats, time, and effects')}
        ${this.toolButton('preview', 'Preview', 'Play the current project')}
      </div>

      <div class="world-section-header">
        <div><h3>Scene graph</h3><p>${scenes.length} connected places</p></div>
        <button class="accent-btn" id="world-add-scene" type="button" onclick="WorldWorkspace.addScene()">Add scene</button>
      </div>
      <div class="world-scene-grid">
        ${sceneCards || '<div class="world-empty">No scenes yet.</div>'}
      </div>
    `;

  },

  toolButton(tab, label, detail) {
    return `<button type="button" class="world-tool-btn" onclick="WorldWorkspace.openPanel(${this._onclickArg(tab)})"><strong>${this._esc(label)}</strong><span>${this._esc(detail)}</span></button>`;
  },

  openPanel(tabName) {
    if (tabName === 'preview') {
      document.getElementById('btn-preview')?.click();
      return;
    }
    const tab = document.querySelector(`#left-panel .panel-tab[data-tab="${tabName}"]`);
    tab?.click();
  },

  openScene(sceneId) {
    if (!State.project.scenes?.some(scene => scene.id === sceneId)) return;
    State.project.activeSceneId = sceneId;
    State.selectedObjectId = null;
    State.autoSave();
    Project.refreshAll();
    this.openPanel('scenes');
  },

  setStartScene(sceneId) {
    if (!State.project.scenes?.some(scene => scene.id === sceneId)) return;
    State.project.startSceneId = sceneId;
    State.project.meta = { ...(State.project.meta || {}), startSceneId: sceneId };
    State.autoSave();
    this.render();
  },

  addScene() {
    const name = prompt('Scene name:', `Scene ${(State.project.scenes || []).length + 1}`);
    if (!name?.trim()) return;
    const scene = State.createScene(name.trim());
    State.project.activeSceneId = scene.id;
    if (!State.project.startSceneId) State.project.startSceneId = scene.id;
    State.autoSave();
    Scenes.render();
    this.render();
  },

  _esc(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _attr(value) {
    return this._esc(value).replace(/"/g, '&quot;');
  },

  _onclickArg(value) {
    return this._attr(JSON.stringify(String(value ?? '')));
  },
};

globalThis.WorldWorkspace = WorldWorkspace;
