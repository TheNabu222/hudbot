/* ===== HUDBOT HUD + SCREEN UI RUNTIME ===== */
const HudRuntime = {
  settings() {
    return State.project.globalSettings || {};
  },

  assetSource(assetId) {
    if (!assetId) return '';
    if (typeof DeviceFrame !== 'undefined') return DeviceFrame.assetSource(assetId);
    const asset = (State.project.assets || []).find(item => item.id === assetId);
    return asset?.dataURL || asset?.src || '';
  },

  applyTheme(element) {
    const settings = this.settings();
    element.dataset.hudTheme = settings.uiTheme || 'default';
    element.style.setProperty('--hud-primary', settings.uiColorPrimary || '#00ffcc');
    element.style.setProperty('--hud-secondary', settings.uiColorSecondary || '#94a3b8');
    element.style.setProperty('--hud-background', settings.uiColorBackground || '#08060d');
    element.style.setProperty('--hud-radius', `${settings.uiBorderRadius ?? 8}px`);
    element.style.setProperty('--hud-font', settings.uiFontFamily || 'system-ui, sans-serif');
  },

  renderOpenMenus(canvas, preview) {
    canvas.querySelectorAll('.hud-runtime-menu.is-default').forEach(menu => menu.remove());
    (State.project.uiMenus || [])
      .filter(menu => menu.isOpenByDefault === true)
      .forEach(menu => this.renderMenu(menu, canvas, preview, true));
  },

  openMenu(menuId, preview) {
    const menu = (State.project.uiMenus || []).find(item => item.id === menuId);
    const canvas = preview?.previewStage?.querySelector('.preview-canvas');
    if (!menu || !canvas) return null;
    canvas.querySelectorAll('[data-hud-menu-id]').forEach(existing => {
      if (existing.dataset.hudMenuId === menu.id) existing.remove();
    });
    return this.renderMenu(menu, canvas, preview, false);
  },

  renderMenu(menu, canvas, preview, isDefault) {
    const layer = document.createElement('section');
    layer.className = `hud-runtime-menu${isDefault ? ' is-default' : ' is-open'}`;
    layer.dataset.hudMenuId = menu.id;
    layer.setAttribute('aria-label', menu.name || 'Screen UI');
    layer.style.pointerEvents = menu.blocksClicks ? 'auto' : 'none';
    this.applyTheme(layer);

    if (menu.blocksClicks) {
      layer.classList.add('blocks-clicks');
      if (menu.closeOnClickOutside) {
        layer.addEventListener('click', event => {
          if (event.target === layer) layer.remove();
        });
      }
    }

    const menuWidth = Number(menu.width) || Number(State.project.canvasWidth) || 800;
    const menuHeight = Number(menu.height) || Number(State.project.canvasHeight) || 600;
    const scaleX = (Number(State.project.canvasWidth) || 800) / menuWidth;
    const scaleY = (Number(State.project.canvasHeight) || 600) / menuHeight;
    const surface = document.createElement('div');
    surface.className = 'hud-runtime-surface';
    surface.style.width = `${menuWidth}px`;
    surface.style.height = `${menuHeight}px`;
    surface.style.transform = `scale(${scaleX}, ${scaleY})`;
    surface.style.pointerEvents = 'none';

    [...(menu.objects || [])]
      .sort((a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0))
      .forEach((object, index) => surface.appendChild(this.renderObject(object, index, layer, preview)));

    layer.appendChild(surface);
    canvas.appendChild(layer);
    return layer;
  },

  renderObject(rawObject, index, layer, preview) {
    const object = typeof UnifiedProject !== 'undefined'
      ? UnifiedProject.normalizeObject(rawObject, index)
      : rawObject;
    const type = object.uiElementType || '';
    const interactive = type === 'button' || object.interaction && object.interaction !== 'none';
    const element = document.createElement(interactive ? 'button' : 'div');
    if (interactive) element.type = 'button';
    element.className = `hud-runtime-object${type ? ` is-${type.replace(/_/g, '-')}` : ''}`;
    element.style.cssText = [
      `left:${Number(object.x) || 0}px`,
      `top:${Number(object.y) || 0}px`,
      `width:${Number(object.width) || 100}px`,
      `height:${Number(object.height) || 100}px`,
      `z-index:${Number(object.zIndex) || index}`,
      `opacity:${object.opacity == null ? 1 : Number(object.opacity)}`,
      `transform:rotate(${Number(object.rotation) || 0}deg) scaleX(${object.flipX ? -1 : 1}) scaleY(${object.flipY ? -1 : 1})`,
      `border-radius:${Number(object.uiBorderRadius ?? this.settings().uiBorderRadius ?? 8)}px`,
    ].join(';');
    element.style.pointerEvents = interactive ? 'auto' : 'none';

    const source = this.assetSource(object.assetId || object._assetId);
    if (source) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = object.name || '';
      image.draggable = false;
      element.appendChild(image);
    } else if (object.isText) {
      element.classList.add('is-text');
      element.textContent = object.textContent || object.name || '';
      element.style.color = object.textColor || 'var(--hud-primary)';
      element.style.fontSize = `${Number(object.textFontSize) || 14}px`;
      element.style.fontWeight = object.textWeight || 'normal';
      element.style.textAlign = object.textAlign || 'left';
    } else if (type === 'panel') {
      element.style.background = object.uiColorSecondary || 'color-mix(in srgb, var(--hud-background) 90%, transparent)';
      element.style.borderColor = object.uiColorPrimary || 'var(--hud-primary)';
    } else if (type === 'button') {
      element.textContent = object.textContent || object.name || 'Button';
      element.style.background = object.uiColorSecondary || 'var(--hud-background)';
      element.style.borderColor = object.uiColorPrimary || 'var(--hud-primary)';
      element.style.color = object.textColor || object.uiColorPrimary || 'var(--hud-primary)';
      element.style.fontSize = `${Number(object.textFontSize) || 13}px`;
    } else if (type === 'inventory_grid') {
      this.renderInventoryGrid(element, object, preview);
    } else if (type === 'quest_list') {
      this.renderQuestList(element, object, preview);
    } else if (type === 'stat_list') {
      this.renderStatList(element, object, preview);
    } else if (type === 'journal_text') {
      this.renderJournal(element, object);
    } else if (type === 'progress') {
      this.renderProgress(element, object, preview);
    } else {
      element.textContent = object.textContent || object.name || '';
    }

    if (interactive) {
      element.setAttribute('aria-label', object.name || object.textContent || 'UI control');
      element.addEventListener('click', event => {
        event.stopPropagation();
        this.runInteraction(object, layer, preview);
      });
    }
    return element;
  },

  renderInventoryGrid(element, object, preview) {
    element.classList.add('is-smart-region');
    element.style.gridTemplateColumns = `repeat(${Number(object.uiGridColumns) || 4}, minmax(0, 1fr))`;
    element.style.gap = `${Number(object.uiGridGap) || 6}px`;
    element.style.padding = `${Number(object.uiPadding) || 10}px`;
    const inventory = preview?.playerInventory || [];
    if (!inventory.length) {
      element.textContent = object.uiEmptyText || 'No items collected yet';
      return;
    }
    inventory.forEach(entry => {
      const item = (State.project.inventoryItems || []).find(candidate => candidate.id === entry.itemId);
      const slot = document.createElement('div');
      slot.className = 'hud-runtime-slot';
      const assetId = item?.icon || item?.assetId || item?.iconAssetId;
      const source = this.assetSource(assetId);
      if (source) {
        const image = document.createElement('img');
        image.src = source;
        image.alt = item?.name || entry.itemId;
        slot.appendChild(image);
      } else {
        slot.textContent = item?.name || entry.itemId;
      }
      if (entry.count > 1) {
        const count = document.createElement('span');
        count.textContent = entry.count;
        slot.appendChild(count);
      }
      element.appendChild(slot);
    });
  },

  renderQuestList(element, object, preview) {
    element.classList.add('is-smart-region', 'is-list');
    const quests = (State.project.rpgQuests || State.project.quests || []).filter(quest => {
      const runtime = preview?.rpgState?.quests?.[quest.id];
      return !runtime || runtime.active || quest.autoStart;
    });
    if (!quests.length) element.textContent = object.uiEmptyText || 'No active quests';
    quests.slice(0, 6).forEach(quest => {
      const row = document.createElement('div');
      row.textContent = quest.name || quest.title || 'Quest';
      element.appendChild(row);
    });
  },

  renderStatList(element, object, preview) {
    element.classList.add('is-smart-region', 'is-list');
    const needs = preview?.rpgState?.needs || {};
    const skills = preview?.rpgState?.skills?.skills || {};
    const entries = [...Object.entries(needs), ...Object.entries(skills)].slice(0, 8);
    if (!entries.length) element.textContent = object.uiEmptyText || 'No meters configured';
    entries.forEach(([key, value]) => {
      const row = document.createElement('div');
      row.textContent = `${key}: ${Math.round(Number(value) || 0)}`;
      element.appendChild(row);
    });
  },

  renderJournal(element, object) {
    element.classList.add('is-smart-region', 'is-list');
    const entries = State.project.loreEntries || [];
    if (!entries.length) element.textContent = object.uiEmptyText || 'No entries unlocked yet';
    entries.slice(0, 6).forEach(entry => {
      const row = document.createElement('div');
      row.textContent = entry.title || entry.name || 'Entry';
      element.appendChild(row);
    });
  },

  renderProgress(element, object, preview) {
    const values = object.uiBindingType === 'skill'
      ? preview?.rpgState?.skills?.skills
      : preview?.rpgState?.needs;
    const value = Number(values?.[object.uiBindingId] ?? object.uiValue ?? 0);
    const fill = document.createElement('div');
    fill.className = 'hud-runtime-progress-fill';
    fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
    element.appendChild(fill);
  },

  runInteraction(object, layer, preview) {
    const response = object.clickResponses?.[0] || object.onClick?.responses?.[0];
    const interaction = response?.interaction || object.interaction || 'none';
    const targetUiId = response?.targetUiId || object.targetUiId || response?.interactionData || object.interactionData;
    if (interaction === 'close_ui') {
      layer.remove();
      return;
    }
    if (interaction === 'open_ui') {
      this.openMenu(targetUiId, preview);
      return;
    }
    if (interaction === 'save_game') {
      preview?._showSaveLoadModal('save');
      return;
    }
    if (interaction === 'load_game') {
      preview?._showSaveLoadModal('load');
      return;
    }
    if (typeof DeviceFrame !== 'undefined') {
      DeviceFrame.runControl({ clickResponses: [{ interaction, targetUiId, interactionData: targetUiId }] }, preview);
    }
  },

  renderBuiltInHud(canvas, preview) {
    canvas.querySelectorAll('.hud-runtime-builtins').forEach(item => item.remove());
    const settings = this.settings();
    if (!State.project.globalSettings || settings.hideAllDefaultHud) return;

    const root = document.createElement('div');
    root.className = 'hud-runtime-builtins';
    this.applyTheme(root);

    if (settings.enableNeeds !== false && preview?.rpgState?.needs) {
      root.appendChild(this.renderMeterCluster(
        'Needs',
        preview.rpgState.needs,
        settings.hudNeedsPosition || { x: 18, y: 18 },
        settings.hudNeedsScaleX ?? settings.hudNeedsScale ?? settings.hudScale ?? 1,
        settings.hudNeedsScaleY ?? settings.hudNeedsScale ?? settings.hudScale ?? 1
      ));
    }

    if (settings.enableSkillsHud && preview?.rpgState?.skills?.skills) {
      root.appendChild(this.renderMeterCluster(
        'Skills',
        preview.rpgState.skills.skills,
        settings.hudSkillsPosition || { x: 560, y: 18 },
        settings.hudSkillsScaleX ?? settings.hudSkillsScale ?? settings.hudScale ?? 1,
        settings.hudSkillsScaleY ?? settings.hudSkillsScale ?? settings.hudScale ?? 1
      ));
    }

    const buttons = [
      ['Inventory', 'hideDefaultInventoryBtn', 'toggle_inventory'],
      ['Craft', 'hideDefaultCraftingBtn', 'open_crafting'],
      ['Quests', 'hideDefaultQuestLogBtn', 'open_quest_log'],
      ['Skills', 'hideDefaultSkillsBtn', 'open_skills'],
      ['Almanac', 'hideDefaultAlmanacBtn', 'open_almanac'],
      ['Map', 'hideDefaultMapBtn', 'open_map'],
      ['People', 'hideDefaultRelationshipsBtn', 'open_relationships'],
      ['Settings', 'hideDefaultSettingsBtn', 'open_settings'],
    ].filter(([, hideKey]) => !settings[hideKey]);
    if (buttons.length) {
      const cluster = document.createElement('div');
      cluster.className = 'hud-runtime-buttons';
      const position = settings.hudButtonsPosition || { x: 18, y: (Number(State.project.canvasHeight) || 600) - 52 };
      cluster.style.left = `${position.x}px`;
      cluster.style.top = `${position.y}px`;
      cluster.style.transform = `scale(${settings.hudButtonsScaleX ?? settings.hudButtonsScale ?? settings.hudScale ?? 1}, ${settings.hudButtonsScaleY ?? settings.hudButtonsScale ?? settings.hudScale ?? 1})`;
      buttons.forEach(([label, , interaction]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', event => {
          event.stopPropagation();
          this.runInteraction({ interaction }, root, preview);
        });
        cluster.appendChild(button);
      });
      root.appendChild(cluster);
    }

    canvas.appendChild(root);
  },

  renderMeterCluster(title, values, position, scaleX, scaleY) {
    const cluster = document.createElement('section');
    cluster.className = 'hud-runtime-meters';
    cluster.style.left = `${Number(position.x) || 0}px`;
    cluster.style.top = `${Number(position.y) || 0}px`;
    cluster.style.transform = `scale(${Number(scaleX) || 1}, ${Number(scaleY) || 1})`;
    const heading = document.createElement('strong');
    heading.textContent = title;
    cluster.appendChild(heading);
    Object.entries(values).slice(0, 6).forEach(([key, rawValue]) => {
      const value = Math.max(0, Math.min(100, Number(rawValue) || 0));
      const row = document.createElement('div');
      row.className = 'hud-runtime-meter-row';
      const label = document.createElement('span');
      label.textContent = key;
      const track = document.createElement('div');
      const fill = document.createElement('i');
      fill.style.width = `${value}%`;
      track.appendChild(fill);
      row.append(label, track);
      cluster.appendChild(row);
    });
    return cluster;
  },
};

globalThis.HudRuntime = HudRuntime;
