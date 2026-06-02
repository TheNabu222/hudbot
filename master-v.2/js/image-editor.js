/* ===== IMAGE EDITOR ===== */
const ImageEditor = {
  _assetId: null,
  _isDragging: false,
  _cropStart: null,
  _cropRect: null, // { left, top, width, height } in overlay-relative px

  // Filter state – reset fresh on each show()
  _s: null,

  _defaults() {
    return {
      brightness: 100, contrast: 100, saturate: 100, sepia: 0,
      hue: 0, grayscale: 0, invert: 0, blur: 0,
      chromaKey: '', chromaTolerance: 30
    };
  },

  init() {
    // No persistent DOM; modal is injected on show()
  },

  show(assetId) {
    const asset = State.project.assets.find(a => a.id === assetId);
    if (!asset) return;

    // Remove stale modal if present
    const existing = document.getElementById('ie-modal');
    if (existing) existing.remove();

    this._assetId = assetId;
    this._s = this._defaults();
    this._cropRect = null;
    this._isDragging = false;
    this._cropStart = null;

    document.body.insertAdjacentHTML('beforeend', this._buildHTML(asset));
    this._bindEvents();
  },

  hide() {
    const modal = document.getElementById('ie-modal');
    if (modal) modal.remove();
  },

  // ---- HTML builders ----

  _buildHTML(asset) {
    return `
<div id="ie-modal" class="ie-modal">
  <div class="ie-backdrop" id="ie-backdrop"></div>
  <div class="ie-container">
    <div class="ie-image-area">
      <div class="ie-image-wrapper" id="ie-image-wrapper">
        <img id="ie-img" src="${asset.dataURL}" alt="Edit" crossorigin="anonymous" />
        <div class="ie-crop-overlay" id="ie-crop-overlay">
          <div class="ie-selection" id="ie-selection"></div>
        </div>
      </div>
    </div>
    <div class="ie-sidebar">
      <div class="ie-header">
        <h2>Edit Image</h2>
        <p class="ie-hint">Click and drag on the image to crop. Extract individual sprites from sheets this way!</p>
      </div>
      <div class="ie-sliders">
        ${this._slider('brightness', 'Brightness', 0, 200, 100, '%')}
        ${this._slider('contrast',   'Contrast',   0, 200, 100, '%')}
        ${this._slider('saturate',   'Saturation', 0, 200, 100, '%')}
        ${this._slider('sepia',      'Sepia',      0, 100,   0, '%')}
        ${this._slider('hue',        'Hue Rotate', 0, 360,   0, 'deg')}
        ${this._slider('grayscale',  'Grayscale',  0, 100,   0, '%')}
        ${this._slider('invert',     'Invert',     0, 100,   0, '%')}
        ${this._slider('blur',       'Blur',       0,  20,   0, 'px')}
      </div>

      <div class="ie-section">
        <h3 class="ie-section-title">Remove Background Color</h3>
        <div class="ie-chroma-row">
          <input type="color" id="ie-chroma-color" value="#000000" title="Pick key color" />
          <input type="text"  id="ie-chroma-hex"   placeholder="#HexColor" value="" />
          <button id="ie-chroma-clear" class="ie-small-btn" style="display:none">Clear</button>
        </div>
        <div id="ie-chroma-extra" style="display:none">
          <div class="ie-label-row">
            <label>Tolerance (Color Match)</label>
            <span id="ie-val-tolerance">30</span>
          </div>
          <input type="range" id="ie-tolerance" min="0" max="255" value="30" class="ie-range" />
          <p class="ie-hint ie-amber">Transparency isn't previewed here, but applies when you save!</p>
        </div>
      </div>

      <div class="ie-section">
        <button id="ie-reset" class="ie-reset-btn">Reset Adjustments</button>
      </div>

      <div class="ie-actions">
        <button id="ie-save-new" class="ie-btn ie-btn-indigo">Save as New Asset</button>
        <div class="ie-action-row">
          <button id="ie-cancel" class="ie-btn ie-btn-neutral">Cancel</button>
          <button id="ie-save"   class="ie-btn ie-btn-green">Overwrite</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
  },

  _slider(key, label, min, max, def, unit) {
    return `
      <div class="ie-slider-row">
        <div class="ie-label-row">
          <label>${label}</label>
          <span id="ie-val-${key}">${def}${unit}</span>
        </div>
        <input type="range" id="ie-${key}" class="ie-range"
          min="${min}" max="${max}" value="${def}"
          data-key="${key}" data-unit="${unit}" />
      </div>`;
  },

  // ---- Event binding ----

  _bindEvents() {
    const img     = document.getElementById('ie-img');
    const overlay = document.getElementById('ie-crop-overlay');
    const sel     = document.getElementById('ie-selection');

    // Backdrop closes modal
    document.getElementById('ie-backdrop').addEventListener('click', () => this.hide());

    // Sliders → live filter preview
    document.querySelectorAll('#ie-modal .ie-range[data-key]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.key;
        this._s[key] = Number(input.value);
        document.getElementById(`ie-val-${key}`).textContent = input.value + input.dataset.unit;
        img.style.filter = this._getFilter();
      });
    });

    // Chroma key
    const chromaColor = document.getElementById('ie-chroma-color');
    const chromaHex   = document.getElementById('ie-chroma-hex');

    chromaColor.addEventListener('input', () => {
      this._s.chromaKey = chromaColor.value;
      chromaHex.value = chromaColor.value;
      this._syncChromaUI();
    });
    chromaHex.addEventListener('input', () => {
      const v = chromaHex.value.trim();
      if (/^#[0-9a-f]{6}$/i.test(v)) {
        this._s.chromaKey = v;
        chromaColor.value = v;
      } else if (!v) {
        this._s.chromaKey = '';
      }
      this._syncChromaUI();
    });
    document.getElementById('ie-chroma-clear').addEventListener('click', () => {
      this._s.chromaKey = '';
      chromaHex.value = '';
      this._syncChromaUI();
    });
    document.getElementById('ie-tolerance').addEventListener('input', e => {
      this._s.chromaTolerance = Number(e.target.value);
      document.getElementById('ie-val-tolerance').textContent = e.target.value;
    });

    // Buttons
    document.getElementById('ie-reset').addEventListener('click', () => this._reset());
    document.getElementById('ie-cancel').addEventListener('click', () => this.hide());
    document.getElementById('ie-save').addEventListener('click', () => this._save(false));
    document.getElementById('ie-save-new').addEventListener('click', () => this._save(true));

    // Crop drag on overlay
    overlay.addEventListener('mousedown', e => this._cropStart_(e, overlay, sel));
    overlay.addEventListener('mousemove', e => this._cropMove_(e, overlay, sel));
    overlay.addEventListener('mouseup',   e => this._cropEnd_(e, sel));
    overlay.addEventListener('mouseleave',e => this._cropEnd_(e, sel));
  },

  _syncChromaUI() {
    const has = !!this._s.chromaKey;
    document.getElementById('ie-chroma-clear').style.display = has ? '' : 'none';
    document.getElementById('ie-chroma-extra').style.display = has ? '' : 'none';
  },

  // ---- Crop interaction ----

  _cropStart_(e, overlay, sel) {
    e.preventDefault();
    const r = overlay.getBoundingClientRect();
    this._isDragging = true;
    this._cropStart = { x: e.clientX - r.left, y: e.clientY - r.top };
    sel.style.display = 'block';
  },

  _cropMove_(e, overlay, sel) {
    if (!this._isDragging || !this._cropStart) return;
    e.preventDefault();
    const r  = overlay.getBoundingClientRect();
    const cx = Utils.clamp(e.clientX - r.left, 0, r.width);
    const cy = Utils.clamp(e.clientY - r.top,  0, r.height);
    const x  = this._cropStart.x;
    const y  = this._cropStart.y;

    const left   = Math.min(cx, x);
    const top    = Math.min(cy, y);
    const width  = Math.abs(cx - x);
    const height = Math.abs(cy - y);

    sel.style.left   = left   + 'px';
    sel.style.top    = top    + 'px';
    sel.style.width  = width  + 'px';
    sel.style.height = height + 'px';

    this._cropRect = { left, top, width, height };
  },

  _cropEnd_(e, sel) {
    if (!this._isDragging) return;
    this._isDragging = false;
    if (!this._cropRect || this._cropRect.width < 5 || this._cropRect.height < 5) {
      sel.style.display = 'none';
      this._cropRect = null;
    }
  },

  // ---- Filters ----

  _getFilter() {
    const s = this._s;
    return `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturate}%) sepia(${s.sepia}%) hue-rotate(${s.hue}deg) grayscale(${s.grayscale}%) invert(${s.invert}%) blur(${s.blur}px)`;
  },

  // ---- Reset ----

  _reset() {
    const d = this._defaults();
    const units = { brightness:'%', contrast:'%', saturate:'%', sepia:'%', hue:'deg', grayscale:'%', invert:'%', blur:'px' };
    for (const key of Object.keys(units)) {
      this._s[key] = d[key];
      const input = document.getElementById(`ie-${key}`);
      if (input) {
        input.value = d[key];
        document.getElementById(`ie-val-${key}`).textContent = d[key] + units[key];
      }
    }
    this._s.chromaKey = '';
    document.getElementById('ie-chroma-hex').value = '';
    this._syncChromaUI();
    this._cropRect = null;
    const sel = document.getElementById('ie-selection');
    if (sel) sel.style.display = 'none';
    const img = document.getElementById('ie-img');
    if (img) img.style.filter = this._getFilter();
  },

  // ---- Save / export ----

  async _save(isNew) {
    const img     = document.getElementById('ie-img');
    const wrapper = document.getElementById('ie-image-wrapper');
    if (!img) return;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    // Convert display-space crop rect → natural-image source rect
    let sx = 0, sy = 0, sw = nw, sh = nh;

    if (this._cropRect && this._cropRect.width >= 5 && this._cropRect.height >= 5) {
      const dispW = img.offsetWidth;
      const dispH = img.offsetHeight;

      // img may not fill the entire overlay — account for centering offset
      const imgBCR     = img.getBoundingClientRect();
      const wrapBCR    = wrapper.getBoundingClientRect();
      const offX       = imgBCR.left - wrapBCR.left;
      const offY       = imgBCR.top  - wrapBCR.top;

      const scaleX = nw / dispW;
      const scaleY = nh / dispH;

      sx = (this._cropRect.left - offX) * scaleX;
      sy = (this._cropRect.top  - offY) * scaleY;
      sw = this._cropRect.width  * scaleX;
      sh = this._cropRect.height * scaleY;

      // Clamp to image bounds
      sx = Math.max(0, sx);
      sy = Math.max(0, sy);
      sw = Math.min(sw, nw - sx);
      sh = Math.min(sh, nh - sy);
    }

    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d');

    ctx.filter = this._getFilter();
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    this._applyChromaKey(ctx, canvas.width, canvas.height);

    let dataURL;
    try {
      dataURL = canvas.toDataURL('image/png');
    } catch (e) {
      Toast.show('CORS error: re-upload the image directly to edit it.', 'error');
      return;
    }

    if (isNew) {
      const asset    = State.project.assets.find(a => a.id === this._assetId);
      const baseName = asset ? asset.name : 'image';
      const newAsset = {
        id: Utils.uid(),
        name: baseName + '-edited',
        dataURL,
        width:  canvas.width,
        height: canvas.height,
      };
      State.project.assets.push(newAsset);
      Assets.render();
      State.autoSave();
      Toast.show('Saved as new asset: ' + newAsset.name, 'success');
    } else {
      const asset = State.project.assets.find(a => a.id === this._assetId);
      if (asset) {
        asset.dataURL = dataURL;
        asset.width   = canvas.width;
        asset.height  = canvas.height;
        Assets.render();
        State.autoSave();
        Toast.show('Asset overwritten', 'success');
      }
    }
    this.hide();
  },

  _applyChromaKey(ctx, width, height) {
    if (!this._s.chromaKey) return;
    const hex = this._s.chromaKey.replace('#', '');
    const tr  = parseInt(hex.substring(0, 2), 16);
    const tg  = parseInt(hex.substring(2, 4), 16);
    const tb  = parseInt(hex.substring(4, 6), 16);
    const tol = this._s.chromaTolerance;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data    = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i]   - tr;
      const dg = data[i+1] - tg;
      const db = data[i+2] - tb;
      if (Math.sqrt(dr*dr + dg*dg + db*db) <= tol) data[i+3] = 0;
    }
    ctx.putImageData(imgData, 0, 0);
  },
};
