/* ===== HITBOX EDITOR ===== */
const Hitbox = {
  overlay: null,
  drawBtn: null,
  clearBtn: null,
  toggleCheckbox: null,
  hitboxList: null,
  drawState: null,

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

    const colors = ['#7c5cfc', '#d4a843', '#e85454', '#4caf50', '#5ca0fc', '#ff69b4', '#ff8c00'];
    const color = colors[scene.hitboxes.length % colors.length];

    scene.hitboxes.push({
      id: Utils.uid(),
      x, y, width: w, height: h,
      color,
      linkedObjectId: State.selectedObjectId || null,
      action: 'none',
      label: `Clickable Area ${scene.hitboxes.length + 1}`,
    });

    this.render();
    this.renderList();
    State.autoSave();
  },

  clearHitboxes() {
    const scene = State.getActiveScene();
    if (!scene) return;
    State.pushUndo();
    scene.hitboxes = [];
    this.render();
    this.renderList();
    State.autoSave();
  },

  render() {
    // Sync overlay size with canvas
    this.syncOverlaySize();

    // Clear everything except temp
    const temp = this.overlay.querySelector('.hitbox-temp');
    this.overlay.innerHTML = '';
    if (temp) this.overlay.appendChild(temp);

    if (!State.showHitboxes) return;

    const scene = State.getActiveScene();
    if (!scene) return;

    const ns = 'http://www.w3.org/2000/svg';
    for (const hb of scene.hitboxes) {
      const r = document.createElementNS(ns, 'rect');
      r.classList.add('hitbox-rect');
      r.setAttribute('x', hb.x);
      r.setAttribute('y', hb.y);
      r.setAttribute('width', hb.width);
      r.setAttribute('height', hb.height);
      r.style.stroke = hb.color;
      r.style.fill = hb.color.replace(')', ',0.15)').replace('rgb', 'rgba');
      if (hb.color.startsWith('#')) {
        r.style.fill = hb.color + '26';
      }
      this.overlay.appendChild(r);
    }
  },

  renderList() {
    const scene = State.getActiveScene();
    this.hitboxList.innerHTML = '';
    if (!scene || !scene.hitboxes.length) return;

    for (const hb of scene.hitboxes) {
      const el = document.createElement('div');
      el.className = 'hitbox-item';
      el.innerHTML = `
        <div class="hitbox-color" style="background:${hb.color}"></div>
        <span>${hb.label}</span>
        <span style="color:var(--text-muted);font-size:10px">${hb.width}×${hb.height}</span>
      `;
      this.hitboxList.appendChild(el);
    }
  },
};
