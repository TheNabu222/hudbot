(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.NeedsEngine = {
      applyChanges: function(state, changes){
        if (!state || !changes) return;
        Object.keys(changes).forEach(function(k){
          if (state[k] === undefined) return;
          state[k] = Math.max(0, Math.min(100, Number(state[k]) + Number(changes[k] || 0)));
        });
      }
    };
  })();`;

  window.EngineModuleRegistry.needs = {
    id: 'needs',
    label: 'Needs Engine',
    featureKey: 'needs',
    description: 'Applies need decay and interaction-based need changes.',
    source,
  };
})();
