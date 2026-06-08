/* ===== HITBOX / CLICKBOX EDITOR (Phase 3D) ===== */
const Hitbox = {
  overlay: null,
  drawBtn: null,
  clearBtn: null,
  toggleCheckbox: null,
  hitboxList: null,
  drawState: null,

  // Action type metadata: icon, label, color
  ACTION_TYPES: {
    'none':           { icon: '◯', label: 'No Action',         color: '#9ca3af' },
    'scene-change':   { icon: '🚪', label: 'Scene Transition',  color: '#7c5cfc' },
    'start-dialogue': { icon: '💬', label: 'Start Dialogue',    color: '#d4a843' },
    'toggle-object':  { icon: '👁', label: 'Toggle Object',     color: '#5ca0fc' },
    'add-item':       { icon: '🎁', label: 'Add Item',          color: '#4caf50' },
    'remove-item':    { icon: '🗑', label: 'Remove Item',       color: '#e85454' },
    'set-flag':       { icon: '🚩', label: 'Set Flag/Variable', color: '#ff8c00' },
    'play-sound':     { icon: '🔊', label: 'Play Sound',        color: '#ff69b4' },
    'multiple':       { icon: '✨', label: 'Multiple Actions',  color: '#a855f7' },
  },

  CURSOR_OPTIONS: [
    { value: 'default',     label: 'Default',     css: 'default' },
    { value: 'pointer',     label: 'Pointer',     css: 'pointer' },
    { value: 'help',        label: 'Help (?)',    css: 'help' },
    { value: 'crosshair',   label: 'Crosshair',   css: 'crosshair' },
    { value: 'grab',        label: 'Grab',        css: 'grab' },
    { value: 'not-allowed', label: 'Blocked',     css: 'not-allowed' },
    { value: 'wait',        label: 'Wait',        css: 'wait' },
    { value: 'zoom-in',     label: 'Zoom In',     css: 'zoom-in' },
    { value: 'text',        label: 'Text',        css: 'text' },
  ],

  HOVER_EFFECTS: [
    { value: 'none',      label: 'None' },
    { value: 'highlight', label: 'Highlight (lighten)' },
    { value: 'glow',      label: 'Glow (outer halo)' },
    { value: 'outline',   label: 'Bright Outline' },
    { value: 'pulse',     label: 'Pulse' },
  ],

  init() {
    this.overlay = document.getElementById('hitbox-overlay');
    this.drawBtn = document.getElementById('btn-draw-hitbox');
    this.clearBtn = document.getElementById('btn-clear-hitbox');
    this.toggleCheckbox = document.getElementById('toggle-hitboxes');
    this.hitboxList = document.getElementById('hitbox-list');

    // Ensure overlay matches canvas size
    this.syncOverlaySize();

    this.drawBtn.addEventListener('click', () => this.startDraw());
    this.clearBtn.addEventListener('click', () => this.clearHitboxes());
    this.toggleCheckbox.addEventListener('change', () => {
      State.showHitboxes = this.toggleCheckbox.checked;
      this.render();
    });

    this.overlay.addEventListener('mousedown', (e) => this.onDrawStart(e));
    // Use document-level listeners so drawing continues when cursor leaves the overlay
    document.addEventListener('mousemove', (e) => this.onDrawMove(e));
    document.addEventListener('mouseup', (e) => this.onDrawEnd(e));
  },

  syncOverlaySize() {
    const w = State.project.canvasWidth || 800;
    const h = State.project.canvasHeight || 600;
    this.overlay.setAttribute('width', w);
    this.overlay.setAttribute('height', h);
    this.overlay.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.overlay.style.width = w + 'px';
    this.overlay.style.height = h + 'px';
  },

  startDraw() {
    if (State.isDrawingHitbox) {
      this.cancelDraw();
      return;
    }
    State.isDrawingHitbox = true;
    this.overlay.classList.add('drawing');
    this.drawBtn.textContent = '✕ Cancel Area Drawing';
    this.drawBtn.style.background = 'var(--red)';
    this.drawBtn.style.color = 'white';
  },

  cancelDraw() {
    State.isDrawingHitbox = false;
    this.overlay.classList.remove('drawing');
    this.drawBtn.textContent = '✏ Draw Clickable Area';
    this.drawBtn.style.background = '';
    this.drawBtn.style.color = '';
    this.drawState = null;
    // Remove temp rect
    const temp = this.overlay.querySelector('.hitbox-temp');
    if (temp) temp.remove();
  },

  /** Clamp a coordinate to the canvas (stage) bounds */
  _clampToCanvas(rawX, rawY) {
    const cw = State.project.canvasWidth || 800;
    const ch = State.project.canvasHeight || 600;
    return {
      x: Math.max(0, Math.min(rawX, cw)),
      y: Math.max(0, Math.min(rawY, ch)),
    };
  },

  /** Get mouse position relative to the stage element, clamped to canvas */
  _canvasCoords(e) {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return this._clampToCanvas(rawX, rawY);
  },

  onDrawStart(e) {
    if (!State.isDrawingHitbox) return;
    const pos = this._canvasCoords(e);
    this.drawState = {
      startX: pos.x,
      startY: pos.y,
    };

    // Create temp rect
    const ns = 'http://www.w3.org/2000/svg';
    const r = document.createElementNS(ns, 'rect');
    r.classList.add('hitbox-rect', 'hitbox-temp');
    r.setAttribute('x', this.drawState.startX);
    r.setAttribute('y', this.drawState.startY);
    r.setAttribute('width', 0);
    r.setAttribute('height', 0);
    this.overlay.appendChild(r);
  },

  onDrawMove(e) {
    if (!this.drawState) return;
    const pos = this._canvasCoords(e);

    const x = Math.min(this.drawState.startX, pos.x);
    const y = Math.min(this.drawState.startY, pos.y);
    const w = Math.abs(pos.x - this.drawState.startX);
    const h = Math.abs(pos.y - this.drawState.startY);

    const temp = this.overlay.querySelector('.hitbox-temp');
    if (temp) {
      temp.setAttribute('x', x);
      temp.setAttribute('y', y);
      temp.setAttribute('width', w);
      temp.setAttribute('height', h);
    }
  },

  onDrawEnd(e) {
    if (!this.drawState) return;
    const pos = this._canvasCoords(e);

    const x = Math.round(Math.min(this.drawState.startX, pos.x));
    const y = Math.round(Math.min(this.drawState.startY, pos.y));
    const w = Math.round(Math.abs(pos.x - this.drawState.startX));
    const h = Math.round(Math.abs(pos.y - this.drawState.startY));

    // Remove temp
    const temp = this.overlay.querySelector('.hitbox-temp');
    if (temp) temp.remove();
    this.drawState = null;

    if (w < 5 || h < 5) return; // too small

    const scene = State.getActiveScene();
    if (!scene) return;

    State.pushUndo();

    const colors = ['#7c5cfc', '#d4a843', '#e85454', '#4caf50', '#5ca0fc', '#ff69b4', '#ff8c00'];
    const color = colors[scene.hitboxes.length % colors.length];

    const newBox = this.createDefaultBox({
      x, y, width: w, height: h, color,
      label: `Clickable Area ${scene.hitboxes.length + 1}`,
      linkedObjectId: State.selectedObjectId || null,
    });

    scene.hitboxes.push(newBox);
    // Auto-select the new box
    State.selectedHitboxId = newBox.id;

    // Cancel draw mode
    this.cancelDraw();

    this.render();
    this.renderList();
    if (typeof ClickboxInspector !== 'undefined') ClickboxInspector.update();
    State.autoSave();
  },

  /**
   * Build a fully-formed clickbox object using Phase 3D schema.
   */
  createDefaultBox(props = {}) {
    return Object.assign({
      id: Utils.uid(),
      label: 'Clickable Area',
      x: 0, y: 0, width: 80, height: 80,
      color: '#7c5cfc',
      linkedObjectId: null,
      // Action
      actionType: 'none',       // Phase 3D unified
      action: 'none',           // Legacy compat
      targetSceneId: null,
      dialogueTreeId: '',
      toggleObjectId: '',
      toggleMode: 'toggle',     // 'show' | 'hide' | 'toggle' | 'enable' | 'disable'
      itemId: '',
      itemCount: 1,
      setFlag: null,            // { flag, operation, value }
      soundAssetId: '',
      soundVolume: 0.8,
      actionChain: [],          // [{type, ...config}]
      oneShot: false,
      // Hover / visual
      hoverEffect: 'none',
      hoverTooltip: '',
      cursor: 'pointer',
      // Conditions
      conditions: [],           // [{type, ...}]
      conditionMode: 'all',     // 'all' | 'any'
      hideWhenConditionFails: false,
    }, props);
  },

  /**
   * Migrate legacy hitbox objects to Phase 3D schema (idempotent).
   */
  migrateBox(hb) {
    if (!hb) return hb;
    // actionType from legacy action
    if (!hb.actionType) {
      if (hb.action === 'scene-change') hb.actionType = 'scene-change';
      else hb.actionType = 'none';
    }
    if (hb.cursor === undefined) hb.cursor = 'pointer';
    if (hb.hoverEffect === undefined) hb.hoverEffect = 'none';
    if (hb.hoverTooltip === undefined) hb.hoverTooltip = '';
    if (!Array.isArray(hb.conditions)) hb.conditions = [];
    if (hb.conditionMode === undefined) hb.conditionMode = 'all';
    if (hb.hideWhenConditionFails === undefined) hb.hideWhenConditionFails = false;
    if (!Array.isArray(hb.actionChain)) hb.actionChain = [];
    if (hb.dialogueTreeId === undefined) hb.dialogueTreeId = '';
    if (hb.toggleObjectId === undefined) hb.toggleObjectId = '';
    if (hb.toggleMode === undefined) hb.toggleMode = 'toggle';
    if (hb.itemId === undefined) hb.itemId = '';
    if (hb.itemCount === undefined) hb.itemCount = 1;
    if (hb.setFlag === undefined) hb.setFlag = null;
    if (hb.soundAssetId === undefined) hb.soundAssetId = '';
    if (hb.soundVolume === undefined) hb.soundVolume = 0.8;
    if (hb.oneShot === undefined) hb.oneShot = false;
    return hb;
  },

  migrateAllBoxes() {
    for (const scene of State.project.scenes) {
      if (!scene.hitboxes) scene.hitboxes = [];
      scene.hitboxes.forEach(hb => this.migrateBox(hb));
    }
  },

  clearHitboxes() {
    const scene = State.getActiveScene();
    if (!scene) return;
    State.pushUndo();
    scene.hitboxes = [];
    State.selectedHitboxId = null;
    this.render();
    this.renderList();
    if (typeof ClickboxInspector !== 'undefined') ClickboxInspector.update();
    State.autoSave();
  },

  /** Select a clickbox by id. */
  selectBox(id) {
    State.selectedHitboxId = id;
    // Deselect object when picking a clickbox (mutually exclusive)
    if (id) {
      State.selectedObjectId = null;
      if (typeof Canvas !== 'undefined' && Canvas.updateHandles) Canvas.updateHandles();
      if (typeof Properties !== 'undefined') Properties.update();
    }
    this.render();
    this.renderList();
    if (typeof ClickboxInspector !== 'undefined') {
      ClickboxInspector.update();
      if (id) ClickboxInspector.focusTab();
    }
  },

  deleteBox(id) {
    const scene = State.getActiveScene();
    if (!scene) return;
    const idx = scene.hitboxes.findIndex(h => h.id === id);
    if (idx === -1) return;
    State.pushUndo();
    scene.hitboxes.splice(idx, 1);
    if (State.selectedHitboxId === id) State.selectedHitboxId = null;
    this.render();
    this.renderList();
    if (typeof ClickboxInspector !== 'undefined') ClickboxInspector.update();
    State.autoSave();
  },

  duplicateBox(id) {
    const scene = State.getActiveScene();
    if (!scene) return;
    const src = scene.hitboxes.find(h => h.id === id);
    if (!src) return;
    State.pushUndo();
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = Utils.uid();
    copy.x += 20;
    copy.y += 20;
    copy.label = (src.label || 'Clickable Area') + ' Copy';
    scene.hitboxes.push(copy);
    State.selectedHitboxId = copy.id;
    this.render();
    this.renderList();
    if (typeof ClickboxInspector !== 'undefined') ClickboxInspector.update();
    State.autoSave();
  },

  render() {
    // Sync overlay size with canvas
    this.syncOverlaySize();
    this.migrateAllBoxes();

    // Clear everything except temp
    const temp = this.overlay.querySelector('.hitbox-temp');
    this.overlay.innerHTML = '';
    if (temp) this.overlay.appendChild(temp);

    if (!State.showHitboxes) return;

    const scene = State.getActiveScene();
    if (!scene) return;

    const ns = 'http://www.w3.org/2000/svg';
    for (const hb of scene.hitboxes) {
      this.migrateBox(hb);
      const isSelected = State.selectedHitboxId === hb.id;
      const meta = this.ACTION_TYPES[hb.actionType] || this.ACTION_TYPES.none;
      // Use action-type color when available
      const color = meta.color || hb.color || '#7c5cfc';

      // Background rect
      const r = document.createElementNS(ns, 'rect');
      r.classList.add('hitbox-rect');
      if (isSelected) r.classList.add('hitbox-selected');
      r.setAttribute('x', hb.x);
      r.setAttribute('y', hb.y);
      r.setAttribute('width', hb.width);
      r.setAttribute('height', hb.height);
      r.setAttribute('data-hitbox-id', hb.id);
      r.style.stroke = color;
      r.style.fill = color + '26';
      r.style.pointerEvents = 'all';
      r.style.cursor = 'pointer';
      r.addEventListener('mousedown', (e) => {
        if (State.isDrawingHitbox) return;
        e.stopPropagation();
        this.selectBox(hb.id);
      });
      this.overlay.appendChild(r);

      // Action icon label (top-left)
      if (hb.width >= 30 && hb.height >= 20) {
        const txt = document.createElementNS(ns, 'text');
        txt.setAttribute('x', hb.x + 4);
        txt.setAttribute('y', hb.y + 14);
        txt.setAttribute('font-size', '12');
        txt.setAttribute('fill', color);
        txt.setAttribute('font-family', 'system-ui,sans-serif');
        txt.setAttribute('font-weight', 'bold');
        txt.style.pointerEvents = 'none';
        txt.textContent = meta.icon;
        this.overlay.appendChild(txt);

        // Label text next to icon
        if (hb.width >= 80 && hb.label) {
          const lbl = document.createElementNS(ns, 'text');
          lbl.setAttribute('x', hb.x + 20);
          lbl.setAttribute('y', hb.y + 14);
          lbl.setAttribute('font-size', '10');
          lbl.setAttribute('fill', color);
          lbl.setAttribute('font-family', 'system-ui,sans-serif');
          lbl.style.pointerEvents = 'none';
          // Truncate
          const maxChars = Math.floor((hb.width - 25) / 5);
          lbl.textContent = hb.label.length > maxChars ? hb.label.slice(0, Math.max(1, maxChars - 1)) + '…' : hb.label;
          this.overlay.appendChild(lbl);
        }
      }
    }
  },

  renderList() {
    this.migrateAllBoxes();
    const scene = State.getActiveScene();
    this.hitboxList.innerHTML = '';
    if (!scene || !scene.hitboxes.length) {
      this.hitboxList.innerHTML = '<div class="hitbox-empty" style="font-size:11px;color:var(--text-dim);padding:8px;text-align:center">No clickable areas yet. Draw one above!</div>';
      return;
    }

    for (const hb of scene.hitboxes) {
      const meta = this.ACTION_TYPES[hb.actionType] || this.ACTION_TYPES.none;
      const isSelected = State.selectedHitboxId === hb.id;

      const el = document.createElement('div');
      el.className = 'hitbox-item' + (isSelected ? ' selected' : '');
      el.dataset.hitboxId = hb.id;
      el.style.borderLeft = `4px solid ${meta.color}`;

      el.innerHTML = `
        <div class="hitbox-color" style="background:${meta.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px">${meta.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="hitbox-label" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._esc(hb.label || 'Untitled')}</div>
          <div style="font-size:9px;color:var(--text-dim)">${meta.label} • ${hb.width}×${hb.height}</div>
        </div>
        <button class="hitbox-action-btn" data-act="dup" title="Duplicate">⎘</button>
        <button class="hitbox-action-btn" data-act="del" title="Delete">✕</button>
      `;

      // Click anywhere on item -> select
      el.addEventListener('click', (e) => {
        if (e.target.closest('.hitbox-action-btn')) return;
        this.selectBox(hb.id);
      });

      // Action buttons
      el.querySelector('[data-act="dup"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.duplicateBox(hb.id);
      });
      el.querySelector('[data-act="del"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this clickable area?')) this.deleteBox(hb.id);
      });

      this.hitboxList.appendChild(el);
    }
  },

  getSelectedBox() {
    const scene = State.getActiveScene();
    if (!scene || !State.selectedHitboxId) return null;
    return scene.hitboxes.find(h => h.id === State.selectedHitboxId) || null;
  },

  _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
