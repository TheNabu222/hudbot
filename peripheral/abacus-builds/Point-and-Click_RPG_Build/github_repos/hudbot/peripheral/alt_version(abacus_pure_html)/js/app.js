/* ===== APP INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Init all Phase 1 modules
  Assets.init();
  Canvas.init();
  Layers.init();
  Properties.init();
  Hitbox.init();
  if (typeof ClickboxInspector !== 'undefined') ClickboxInspector.init();
  Scenes.init();
  Project.init();
  Preview.init();
  GameExport.init();
  Shortcuts.init();

  // Init Phase 2 modules
  Toast.init();
  if (typeof EngineLoader !== 'undefined') EngineLoader.ensureProjectFeatures();
  ThemeSystem.init();
  SettingsPanel.init();
  AIAnalysis.init();
  AssetManager.init();
  GitHubBridge.init();
  HelpSystem.init();

  // Init Phase 3B modules
  RPGSystems.init();

  // Init Phase 3A modules
  GameFlags.init();
  Dialogue.init();
  Inventory.init();
  SaveLoad.init();
  Transitions.init();

  // Panel tab switching (both left and right panels)
  document.querySelectorAll('.panel-tabs').forEach(tabs => {
    tabs.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const panel = tabs.closest('.panel') || tabs.parentElement;
        const tabName = tab.dataset.tab;

        tabs.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        panel.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        const target = panel.querySelector(`#tab-${tabName}`);
        if (target) target.classList.add('active');

        // Render Asset Manager when switching to Manager tab
        if (tabName === 'manager') {
          AssetManager.render();
        }
        if (tabName === 'settings') {
          SettingsPanel.render(document.getElementById('settings-panel-container'));
        }

        // Phase 3A: Render tabs
        if (tabName === 'dialogue') {
          Dialogue.render(document.getElementById('dialogue-editor-container'));
        }
        if (tabName === 'inventory') {
          Inventory.render(document.getElementById('inventory-editor-container'));
        }
        if (tabName === 'flags') {
          GameFlags.render(document.getElementById('flags-editor-container'));
        }
        if (tabName === 'clickbox-inspector') {
          if (typeof ClickboxInspector !== 'undefined') ClickboxInspector.update();
        }
        if (tabName === 'hitbox') {
          if (typeof Hitbox !== 'undefined') Hitbox.renderList();
        }
        if (tabName === 'saveload') {
          SaveLoad.renderSettings(document.getElementById('saveload-settings-container'));
        }
        if (tabName === 'npcs') {
          const npcContainer = document.getElementById('npcs-editor-container');
          RPGSystems.renderFocused(npcContainer, 'npcs');
          // Fallback: if focused renderer returns blank, call module directly.
          if (npcContainer && !npcContainer.innerHTML.trim() && typeof Reputation !== 'undefined' && typeof Reputation.render === 'function') {
            Reputation.render(npcContainer);
          }
        }
        if (tabName === 'quests') {
          const questContainer = document.getElementById('quests-editor-container');
          RPGSystems.renderFocused(questContainer, 'quests');
          // Fallback: if focused renderer returns blank, call module directly.
          if (questContainer && !questContainer.innerHTML.trim() && typeof QuestTracker !== 'undefined' && typeof QuestTracker.render === 'function') {
            QuestTracker.render(questContainer);
          }
        }
        if (tabName === 'systems') {
          RPGSystems.renderFocused(document.getElementById('systems-editor-container'), 'systems');
        }
        if (tabName === 'scenes') {
          // Render transition settings for active scene
          if (State.project.activeSceneId) {
            Transitions.renderSceneSettings(
              document.getElementById('scene-transition-settings'),
              State.project.activeSceneId
            );
          }
        }
        HelpSystem.attachContextualHelp();
      });
    });
  });

  // Undo/Redo buttons
  document.getElementById('btn-undo').addEventListener('click', () => {
    if (State.undo()) Project.refreshAll();
  });
  document.getElementById('btn-redo').addEventListener('click', () => {
    if (State.redo()) Project.refreshAll();
  });

  // Grid/Snap buttons
  document.getElementById('btn-grid-toggle').addEventListener('click', () => Canvas.toggleGrid());
  document.getElementById('btn-snap-toggle').addEventListener('click', () => Canvas.toggleSnap());

  // Top-right utility buttons
  document.getElementById('btn-github').addEventListener('click', () => GitHubBridge.show());
  document.getElementById('btn-help').addEventListener('click', () => HelpSystem.showHelpPanel());
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => ThemeSystem.toggleTheme());
  document.getElementById('btn-settings').addEventListener('click', () => {
    const leftPanel = document.getElementById('left-panel');
    leftPanel.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    leftPanel.querySelector('.panel-tab[data-tab="settings"]').classList.add('active');
    leftPanel.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById('tab-settings').classList.add('active');
    SettingsPanel.render(document.getElementById('settings-panel-container'));
    HelpSystem.attachContextualHelp();
  });

  // Asset Manager button (gear icon in Assets tab)
  document.getElementById('btn-asset-manager').addEventListener('click', () => {
    // Switch to Manager tab
    const leftPanel = document.getElementById('left-panel');
    leftPanel.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    leftPanel.querySelector('.panel-tab[data-tab="manager"]').classList.add('active');
    leftPanel.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById('tab-manager').classList.add('active');
    AssetManager.render();
  });

  // Try to load autosave, else create fresh project
  if (!State.loadAutoSave() || !State.project.scenes.length) {
    const scene = State.createScene('Scene 1');
    State.project.activeSceneId = scene.id;
  }
  if (!State.project.activeSceneId && State.project.scenes.length) {
    State.project.activeSceneId = State.project.scenes[0].id;
  }

  // Ensure Phase 3B data structures exist on loaded projects
  RPGSystems.ensureData();

  // Ensure Phase 3A data structures exist on loaded projects
  if (!State.project.dialogueTrees) State.project.dialogueTrees = [];
  if (!State.project.inventoryItems) State.project.inventoryItems = [];
  if (!State.project.flags) State.project.flags = [];
  if (!State.project.saveLoadSettings) {
    State.project.saveLoadSettings = { autoSave: true, autoSaveOnTransition: true, maxSlots: 5, showSaveLoadUI: true };
  }
  if (!State.project.inventoryUI) State.project.inventoryUI = { style: 'bar', slotSize: 40, position: 'bottom' };
  if (!State.project.questUI) State.project.questUI = { showPanel: true, pinTracked: true, accent: '#7c5cfc' };
  if (!State.project.theme) State.project.theme = localStorage.getItem('anzu_theme') || 'dark';
  if (typeof EngineLoader !== 'undefined') EngineLoader.ensureProjectFeatures();
  if (typeof ThemeSystem !== 'undefined') ThemeSystem.applyTheme(localStorage.getItem('anzu_theme') || State.project.theme);

  // Ensure scenes have transition data
  Transitions.ensureSceneTransitions();

  Project.refreshAll();
  SettingsPanel.render(document.getElementById('settings-panel-container'));
  HelpSystem.attachContextualHelp();

  // Auto-save every 30 seconds
  setInterval(() => State.autoSave(), 30000);

  console.log('⚔ Anzu Game Studio loaded. Phase 1 + Phase 2 + Phase 3A + Phase 3B ready.');
});
