/* ===== HUDBOT HUD + SCREEN UI WORKSPACE ===== */
const HudStudio = {
  container: null,

  init() {
    this.container = document.getElementById('hud-studio-container');
    if (!this.container) return;
    this.container.addEventListener('change', event => this.handleChange(event));
    this.container.addEventListener('click', event => this.handleClick(event));
    this.render();
  },

  settings() {
    return State.project.globalSettings || {};
  },

  changeSettings(mutator) {
    State.pushUndo();
    State.project.globalSettings = { ...(State.project.globalSettings || {}) };
    mutator(State.project.globalSettings);
    State.autoSave();
    if (typeof DeviceFrame !== 'undefined') DeviceFrame.renderEditor();
    this.render();
  },

  handleChange(event) {
    const control = event.target;
    if (control.matches('[data-hud-setting]')) {
      const key = control.dataset.hudSetting;
      const invert = control.dataset.invert === 'true';
      const numeric = control.dataset.numeric === 'true';
      let value = control.type === 'checkbox' ? control.checked : control.value;
      if (invert) value = !value;
      if (numeric) value = Number(value);
      this.changeSettings(settings => { settings[key] = value; });
      return;
    }

    if (control.matches('[data-ui-menu-open]')) {
      const menu = (State.project.uiMenus || []).find(item => item.id === control.dataset.uiMenuOpen);
      if (!menu) return;
      State.pushUndo();
      menu.isOpenByDefault = control.checked;
      State.autoSave();
      this.render();
    }
  },

  handleClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.hudPreview === 'all') {
      Preview.enter();
      return;
    }
    if (button.dataset.previewMenu) {
      Preview.enter();
      if (typeof HudRuntime !== 'undefined') HudRuntime.openMenu(button.dataset.previewMenu, Preview);
    }
  },

  make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  },

  section(title) {
    const section = this.make('section', 'hud-studio-section');
    section.appendChild(this.make('h4', '', title));
    return section;
  },

  toggle(labelText, key, checked, options = {}) {
    const label = this.make('label', 'hud-toggle-row');
    const text = this.make('span', '', labelText);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(checked);
    input.dataset.hudSetting = key;
    if (options.invert) input.dataset.invert = 'true';
    label.append(text, input);
    return label;
  },

  field(labelText, control) {
    const label = this.make('label', 'hud-field-row');
    label.append(this.make('span', '', labelText), control);
    return label;
  },

  select(key, value, options, numeric = false) {
    const select = document.createElement('select');
    select.dataset.hudSetting = key;
    if (numeric) select.dataset.numeric = 'true';
    options.forEach(option => {
      const node = document.createElement('option');
      node.value = option.value;
      node.textContent = option.label;
      node.selected = String(option.value) === String(value);
      select.appendChild(node);
    });
    return select;
  },

  color(key, value) {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#00ffcc';
    input.dataset.hudSetting = key;
    return input;
  },

  render() {
    if (!this.container) return;
    const settings = this.settings();
    const menus = State.project.uiMenus || [];
    this.container.innerHTML = '';

    const header = this.make('div', 'hud-studio-header');
    const titleGroup = this.make('div');
    titleGroup.append(
      this.make('h3', '', 'HUD & Screen UI'),
      this.make('span', 'hud-studio-count', `${menus.length} screens`)
    );
    const preview = this.make('button', 'hud-studio-preview', 'Preview');
    preview.type = 'button';
    preview.dataset.hudPreview = 'all';
    header.append(titleGroup, preview);
    this.container.appendChild(header);

    const shellSection = this.section('Game Shell');
    const frame = settings.deviceFrame;
    const overlay = settings.hudOverlay;
    const frameAsset = (State.project.assets || []).find(asset => asset.id === frame?.assetId);
    const overlayAsset = (State.project.assets || []).find(asset => asset.id === overlay?.assetId);
    const shellGrid = this.make('div', 'hud-status-grid');
    shellGrid.append(
      this.make('div', 'hud-status-item', frameAsset?.name || 'No game shell'),
      this.make('div', 'hud-status-item', `${frame?.controls?.length || 0} shell buttons`),
      this.make('div', 'hud-status-item', overlayAsset?.name || 'No HUD artwork')
    );
    shellSection.appendChild(shellGrid);
    this.container.appendChild(shellSection);

    const builtIn = this.section('Built-in HUD');
    builtIn.append(
      this.toggle('Show built-in HUD', 'hideAllDefaultHud', !settings.hideAllDefaultHud, { invert: true }),
      this.toggle('Needs meters', 'enableNeeds', settings.enableNeeds !== false),
      this.toggle('Skills panel', 'enableSkillsHud', settings.enableSkillsHud === true)
    );
    const buttonGrid = this.make('div', 'hud-toggle-grid');
    [
      ['Inventory', 'hideDefaultInventoryBtn'],
      ['Crafting', 'hideDefaultCraftingBtn'],
      ['Quests', 'hideDefaultQuestLogBtn'],
      ['Skills', 'hideDefaultSkillsBtn'],
      ['Almanac', 'hideDefaultAlmanacBtn'],
      ['Map', 'hideDefaultMapBtn'],
      ['Relationships', 'hideDefaultRelationshipsBtn'],
      ['Settings', 'hideDefaultSettingsBtn'],
    ].forEach(([label, key]) => {
      buttonGrid.appendChild(this.toggle(label, key, !settings[key], { invert: true }));
    });
    builtIn.appendChild(buttonGrid);
    this.container.appendChild(builtIn);

    const appearance = this.section('Appearance');
    const theme = this.select('uiTheme', settings.uiTheme || 'default', [
      { value: 'default', label: 'Default' },
      { value: 'retro', label: 'Retro' },
      { value: 'terminal', label: 'Terminal' },
      { value: 'cyberpunk', label: 'Cyberpunk' },
      { value: 'fantasy', label: 'Fantasy' },
      { value: 'barbie', label: 'Barbie' },
      { value: 'minimalist', label: 'Minimalist' },
    ]);
    const corners = this.select('uiBorderRadius', settings.uiBorderRadius ?? 8, [
      { value: 0, label: 'Sharp' },
      { value: 4, label: 'Compact' },
      { value: 8, label: 'Soft' },
      { value: 14, label: 'Round' },
    ], true);
    appearance.append(
      this.field('Theme', theme),
      this.field('Primary', this.color('uiColorPrimary', settings.uiColorPrimary || '#00ffcc')),
      this.field('Background', this.color('uiColorBackground', settings.uiColorBackground || '#08060d')),
      this.field('Corners', corners)
    );
    this.container.appendChild(appearance);

    const screens = this.section('Screen UI');
    if (!menus.length) {
      screens.appendChild(this.make('div', 'hud-empty', 'No Screen UI yet'));
    }
    menus.forEach(menu => {
      const row = this.make('div', 'hud-menu-row');
      const info = this.make('div', 'hud-menu-info');
      info.append(
        this.make('strong', '', menu.name || 'Interface'),
        this.make('span', '', `${(menu.objects || []).length} pieces`)
      );
      const actions = this.make('div', 'hud-menu-actions');
      const openLabel = this.make('label', 'hud-menu-open');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = menu.isOpenByDefault === true;
      checkbox.dataset.uiMenuOpen = menu.id;
      openLabel.append(checkbox, this.make('span', '', 'HUD'));
      const test = this.make('button', '', 'View');
      test.type = 'button';
      test.dataset.previewMenu = menu.id;
      actions.append(openLabel, test);
      row.append(info, actions);
      screens.appendChild(row);
    });
    this.container.appendChild(screens);
  },
};

globalThis.HudStudio = HudStudio;
