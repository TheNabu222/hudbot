/* ===== HUDBOT DEVICE FRAME / GUI SHELL ===== */
const DeviceFrame = {
  editorLayer: null,

  init() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    this.editorLayer = document.createElement('div');
    this.editorLayer.className = 'device-frame-editor-layer';
    this.editorLayer.hidden = true;
    container.appendChild(this.editorLayer);
  },

  getConfig() {
    return State.project.globalSettings?.deviceFrame || State.project.deviceFrame || null;
  },

  assetSource(assetId) {
    if (!assetId) return '';
    const asset = (State.project.assets || []).find(candidate => candidate.id === assetId);
    if (asset?.dataURL || asset?.src) return asset.dataURL || asset.src;
    if (typeof ProjectCompatibility !== 'undefined') return ProjectCompatibility._githubAssetSource(assetId);
    return '';
  },

  renderEditor() {
    if (!this.editorLayer) return;
    const config = this.getConfig();
    const source = this.assetSource(config?.assetId);
    if (!config || !source) {
      this.editorLayer.hidden = true;
      this.editorLayer.innerHTML = '';
      return;
    }

    const outerWidth = Number(config.outerWidth) || 608;
    const outerHeight = Number(config.outerHeight) || 522;
    const canvasWidth = Number(State.project.canvasWidth) || 800;
    const canvasHeight = Number(State.project.canvasHeight) || 600;
    const scale = Math.min(canvasWidth / outerWidth, canvasHeight / outerHeight);
    const left = (canvasWidth - outerWidth * scale) / 2;
    const top = (canvasHeight - outerHeight * scale) / 2;
    const screen = config.screen || { x: 0, y: 0, width: outerWidth, height: outerHeight };

    this.editorLayer.hidden = false;
    this.editorLayer.innerHTML = '';
    const shell = document.createElement('div');
    shell.className = 'device-frame-editor-shell';
    shell.style.cssText = `left:${left}px;top:${top}px;width:${outerWidth}px;height:${outerHeight}px;transform:scale(${scale});`;

    const screenGuide = document.createElement('div');
    screenGuide.className = 'device-frame-editor-screen';
    screenGuide.style.cssText = `left:${screen.x}px;top:${screen.y}px;width:${screen.width}px;height:${screen.height}px;`;
    shell.appendChild(screenGuide);

    const image = document.createElement('img');
    image.className = 'device-frame-image';
    image.src = source;
    image.alt = '';
    shell.appendChild(image);

    (config.controls || []).forEach(control => {
      const guide = document.createElement('div');
      guide.className = 'device-frame-editor-control';
      guide.title = control.name || 'Shell control';
      guide.style.cssText = `left:${control.x}px;top:${control.y}px;width:${control.width}px;height:${control.height}px;`;
      shell.appendChild(guide);
    });
    this.editorLayer.appendChild(shell);
  },

  wrapPreview(canvas, preview) {
    const config = this.getConfig();
    const source = this.assetSource(config?.assetId);
    if (!config || !source) return canvas;

    const outerWidth = Number(config.outerWidth) || 608;
    const outerHeight = Number(config.outerHeight) || 522;
    const screen = config.screen || { x: 0, y: 0, width: outerWidth, height: outerHeight };
    const shell = document.createElement('div');
    shell.className = 'preview-device-frame';
    shell.style.width = `${outerWidth}px`;
    shell.style.height = `${outerHeight}px`;

    const screenWindow = document.createElement('div');
    screenWindow.className = 'preview-device-frame-screen';
    screenWindow.style.cssText = `left:${screen.x}px;top:${screen.y}px;width:${screen.width}px;height:${screen.height}px;`;
    canvas.style.transform = `scale(${screen.width / (Number(State.project.canvasWidth) || 800)}, ${screen.height / (Number(State.project.canvasHeight) || 600)})`;
    screenWindow.appendChild(canvas);
    shell.appendChild(screenWindow);

    const overlayConfig = State.project.globalSettings?.hudOverlay;
    const overlaySource = this.assetSource(overlayConfig?.assetId);
    if (overlaySource) {
      const overlay = document.createElement('img');
      overlay.className = 'device-frame-hud-overlay';
      overlay.src = overlaySource;
      overlay.alt = '';
      overlay.style.opacity = overlayConfig.opacity ?? 1;
      screenWindow.appendChild(overlay);
    }

    const image = document.createElement('img');
    image.className = 'device-frame-image';
    image.src = source;
    image.alt = '';
    shell.appendChild(image);

    (config.controls || []).forEach(control => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'device-frame-runtime-control';
      button.title = control.name || 'Shell control';
      button.setAttribute('aria-label', control.name || 'Shell control');
      button.style.cssText = `left:${control.x}px;top:${control.y}px;width:${control.width}px;height:${control.height}px;`;
      button.addEventListener('click', () => this.runControl(control, preview));
      shell.appendChild(button);
    });
    return shell;
  },

  runControl(control, preview) {
    const response = control?.clickResponses?.[0];
    if (!response) return;
    const interaction = response.interaction;
    if (interaction === 'open_ui') {
      const menuId = response.targetUiId || response.interactionData;
      if (typeof HudRuntime !== 'undefined') HudRuntime.openMenu(menuId, preview);
      else this.showUiMenu(menuId, preview);
      return;
    }
    if (interaction === 'open_map') {
      this.showListPanel('Map', (State.project.scenes || []).filter(scene => !scene.isUiMenu).map(scene => ({
        label: scene.name,
        action: () => preview.transitionTo(scene.id),
      })), preview);
      return;
    }
    if (interaction === 'toggle_inventory') {
      const rows = (preview.playerInventory || []).map(entry => {
        const item = (State.project.inventoryItems || []).find(candidate => candidate.id === entry.itemId);
        return { label: `${item?.name || entry.itemId} × ${entry.count || 1}` };
      });
      this.showListPanel('Inventory', rows, preview, 'No items collected yet.');
      return;
    }
    if (interaction === 'open_quest_log') {
      const rows = (State.project.rpgQuests || []).map(quest => ({ label: quest.name }));
      this.showListPanel('Quests', rows, preview, 'No quests yet.');
      return;
    }
    if (interaction === 'open_skills') {
      const skills = State.project.rpgSkills?.skills || [];
      const rows = skills.map(skill => ({ label: `${skill.label}: ${preview.rpgState?.skills?.skills?.[skill.key] ?? skill.defaultLevel ?? 0}` }));
      this.showListPanel('Skills', rows, preview, 'No skills configured.');
      return;
    }
    if (interaction === 'open_relationships') {
      const rows = (State.project.rpgNPCs || []).map(npc => ({ label: npc.name }));
      this.showListPanel('Relationships', rows, preview, 'No characters configured.');
    }
  },

  createPanel(title, preview) {
    const canvas = preview.previewStage?.querySelector('.preview-canvas');
    if (!canvas) return null;
    canvas.querySelector('.device-shell-panel')?.remove();
    const panel = document.createElement('section');
    panel.className = 'device-shell-panel';
    const header = document.createElement('div');
    header.className = 'device-shell-panel-header';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'device-shell-panel-close';
    close.textContent = '×';
    close.setAttribute('aria-label', `Close ${title}`);
    close.addEventListener('click', () => panel.remove());
    header.append(heading, close);
    panel.appendChild(header);
    canvas.appendChild(panel);
    return panel;
  },

  showListPanel(title, rows, preview, emptyText) {
    const panel = this.createPanel(title, preview);
    if (!panel) return;
    const list = document.createElement('div');
    list.className = 'device-shell-list';
    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'device-shell-row';
      empty.textContent = emptyText || 'Nothing here yet.';
      list.appendChild(empty);
    }
    rows.forEach(row => {
      const element = document.createElement(row.action ? 'button' : 'div');
      element.className = row.action ? 'device-shell-link' : 'device-shell-row';
      element.textContent = row.label;
      if (row.action) element.addEventListener('click', row.action);
      list.appendChild(element);
    });
    panel.appendChild(list);
  },

  showUiMenu(menuId, preview) {
    const menu = (State.project.uiMenus || []).find(candidate => candidate.id === menuId);
    const panel = this.createPanel(menu?.name || 'Interface', preview);
    if (!panel) return;
    if (!menu) {
      const missing = document.createElement('div');
      missing.className = 'device-shell-row';
      missing.textContent = 'This interface screen was referenced but is missing from the save.';
      panel.appendChild(missing);
      return;
    }

    const stage = document.createElement('div');
    stage.className = 'device-ui-menu-stage';
    const width = Number(menu.width) || 800;
    const height = Number(menu.height) || 600;
    const availableWidth = 690;
    const scale = Math.min(1, availableWidth / width);
    stage.style.height = `${height * scale}px`;

    (menu.objects || []).forEach((rawObject, index) => {
      const object = typeof UnifiedProject !== 'undefined' ? UnifiedProject.normalizeObject(rawObject, index) : rawObject;
      const element = document.createElement('div');
      element.className = 'device-ui-object';
      element.style.cssText = `left:${object.x * scale}px;top:${object.y * scale}px;width:${object.width * scale}px;height:${object.height * scale}px;z-index:${object.zIndex || index};`;
      const source = this.assetSource(object.assetId || object._assetId);
      if (source) {
        const img = document.createElement('img');
        img.src = source;
        img.alt = object.name || '';
        element.appendChild(img);
      } else if (object.isText) {
        element.classList.add('is-text');
        element.textContent = object.textContent || object.name || '';
      } else if (object.uiElementType === 'button') {
        element.classList.add('is-button');
        element.textContent = object.textContent || object.name || 'Button';
      } else if (object.uiElementType === 'inventory_grid') {
        element.classList.add('is-grid');
        element.textContent = 'Inventory items';
      } else {
        element.classList.add('is-panel');
        element.textContent = object.name || 'UI element';
      }
      stage.appendChild(element);
    });
    panel.appendChild(stage);
  },
};

globalThis.DeviceFrame = DeviceFrame;
