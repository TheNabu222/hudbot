/* ===== ASSET MANAGER ===== */
const Assets = {
  gallery: null,
  searchInput: null,
  uploadInput: null,
  countEl: null,

  init() {
    this.gallery = document.getElementById('asset-gallery');
    this.searchInput = document.getElementById('asset-search');
    this.uploadInput = document.getElementById('asset-upload');
    this.countEl = document.getElementById('asset-count');

    this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
    this.searchInput.addEventListener('input', Utils.debounce(() => this.render(), 200));
    document.getElementById('btn-asset-view')?.addEventListener('click', () => this.toggleView());

    const viewVersion = localStorage.getItem('anzu_asset_view_version');
    if (viewVersion !== '2') {
      localStorage.setItem('anzu_asset_view', 'large');
      localStorage.setItem('anzu_asset_view_version', '2');
    }
    const compact = localStorage.getItem('anzu_asset_view') === 'compact';
    this.gallery.classList.toggle('compact', compact);
    this.updateViewButton();

    // Drag from asset gallery
    this.gallery.addEventListener('dragstart', (e) => {
      const thumb = e.target.closest('.asset-thumb');
      if (!thumb) return;
      e.dataTransfer.setData('text/plain', thumb.dataset.assetId);
      e.dataTransfer.effectAllowed = 'copy';
    });
  },

  async handleUpload(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataURL = await Utils.fileToDataURL(file);
        const img = await Utils.loadImage(dataURL);
        const asset = {
          id: Utils.uid(),
          name: file.name.replace(/\.[^.]+$/, ''),
          dataURL,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        State.project.assets.push(asset);
      } catch (err) {
        console.warn('Failed to load asset:', file.name, err);
      }
    }
    this.uploadInput.value = '';
    this.render();
    State.autoSave();
  },

  addAssetFromDataURL(name, dataURL, width, height) {
    const asset = {
      id: Utils.uid(),
      name,
      dataURL,
      width,
      height,
    };
    State.project.assets.push(asset);
    this.render();
    return asset;
  },

  deleteAsset(id) {
    const idx = State.project.assets.findIndex(a => a.id === id);
    if (idx !== -1) {
      State.project.assets.splice(idx, 1);
      this.render();
      State.autoSave();
    }
  },

  toggleView() {
    const compact = this.gallery.classList.toggle('compact');
    localStorage.setItem('anzu_asset_view', compact ? 'compact' : 'large');
    this.updateViewButton();
  },

  updateViewButton() {
    const button = document.getElementById('btn-asset-view');
    if (!button) return;
    const compact = this.gallery.classList.contains('compact');
    button.textContent = compact ? '▤' : '▦';
    button.title = compact ? 'Use large thumbnails' : 'Use compact thumbnails';
    button.setAttribute('aria-label', button.title);
  },

  sourceFor(asset) {
    if (asset.dataURL || asset.src) return asset.dataURL || asset.src;
    if (typeof ProjectCompatibility !== 'undefined') {
      return ProjectCompatibility._githubAssetSource(asset.id);
    }
    return '';
  },

  addToScene(assetId) {
    const asset = State.project.assets.find(a => a.id === assetId);
    if (!asset) return;

    const width = Number(asset.width) || 100;
    const height = Number(asset.height) || 100;
    const x = Math.round((State.project.canvasWidth - width) / 2);
    const y = Math.round((State.project.canvasHeight - height) / 2);

    State.pushUndo();
    const obj = State.createObject(assetId, x, y);
    if (!obj) return;

    State.selectedObjectId = obj.id;
    Canvas.renderScene();
    Layers.render();
    Properties.update();
    State.autoSave();
  },

  render() {
    const query = (this.searchInput?.value || '').toLowerCase();
    const filtered = State.project.assets.filter(a =>
      !query || a.name.toLowerCase().includes(query)
    );

    if (this.countEl) {
      this.countEl.textContent = query
        ? `${filtered.length} / ${State.project.assets.length}`
        : `${State.project.assets.length} assets`;
    }

    this.gallery.innerHTML = '';

    if (filtered.length === 0) {
      this.gallery.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <p>${State.project.assets.length ? 'No matches' : 'Upload images to get started'}</p>
      </div>`;
      return;
    }

    for (const asset of filtered) {
      const div = document.createElement('div');
      div.className = 'asset-thumb';
      div.draggable = true;
      div.dataset.assetId = asset.id;
      const dimensions = asset.width && asset.height ? `${asset.width}×${asset.height}` : 'size unknown';
      div.title = `${asset.name} (${dimensions})`;

      const preview = document.createElement('div');
      preview.className = 'asset-preview';
      const source = this.sourceFor(asset);
      const missing = document.createElement('div');
      missing.className = 'asset-missing';
      missing.innerHTML = '<strong>Preview unavailable</strong><span>Source was not included in this save.</span>';

      if (source) {
        const img = document.createElement('img');
        img.src = source;
        img.alt = asset.name;
        img.loading = 'lazy';
        img.decoding = 'async';
        missing.hidden = true;
        img.addEventListener('error', () => {
          img.hidden = true;
          missing.hidden = false;
          missing.querySelector('span').textContent = 'The linked file could not be loaded.';
          div.classList.add('preview-failed');
        });
        preview.appendChild(img);
      } else {
        div.classList.add('preview-missing');
      }
      preview.appendChild(missing);

      const details = document.createElement('div');
      details.className = 'asset-details';
      const label = document.createElement('span');
      label.className = 'asset-label';
      label.textContent = asset.name;
      const meta = document.createElement('span');
      meta.className = 'asset-meta';
      meta.textContent = source ? dimensions : `Missing source · ${dimensions}`;
      details.append(label, meta);

      const deleteButton = document.createElement('button');
      deleteButton.className = 'asset-delete';
      deleteButton.dataset.id = asset.id;
      deleteButton.title = 'Delete';
      deleteButton.setAttribute('aria-label', `Delete ${asset.name}`);
      deleteButton.textContent = '×';

      const addButton = document.createElement('button');
      addButton.className = 'asset-add';
      addButton.title = 'Add to current scene';
      addButton.setAttribute('aria-label', `Add ${asset.name} to current scene`);
      addButton.textContent = '+';

      div.append(preview, details, addButton, deleteButton);
      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addToScene(asset.id);
      });
      // Delete handler
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteAsset(asset.id);
      });
      this.gallery.appendChild(div);
    }
  }
};
