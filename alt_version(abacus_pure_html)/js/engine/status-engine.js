(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.StatusEngine = {
      apply: function(effects, effectId, duration){
        if (!effects || !effectId) return;
        const found = effects.find(e => e.effectId === effectId);
        if (found) found.remaining = Number(duration || found.remaining || 0);
        else effects.push({ effectId: effectId, remaining: Number(duration || 0) });
      }
    };
  })();`;

  window.EngineModuleRegistry.status = {
    id: 'status',
    label: 'Status Engine',
    featureKey: 'status',
    description: 'Applies and ticks temporary status effects.',
    source,
  };
})();
