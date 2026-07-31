(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.SaveLoadEngine = {
      key: 'anzu_game_',
      slotKey: function(slot){ return this.key + 'slot_' + slot; }
    };
  })();`;

  window.EngineModuleRegistry.saveload = {
    id: 'saveload',
    label: 'Save/Load Engine',
    featureKey: 'saveload',
    description: 'LocalStorage slot naming and persistence helpers.',
    source,
  };
})();
