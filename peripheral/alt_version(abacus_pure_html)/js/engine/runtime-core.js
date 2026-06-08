(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.AnzuRuntime = window.AnzuRuntime || {};
    window.AnzuRuntime.version = 'phase3-mvp';
    window.AnzuRuntime.featureOn = function(key){
      const f = window.ENGINE_FEATURES || {};
      return f[key] !== false;
    };
    window.AnzuRuntime.log = function(msg){
      if ((window.ENGINE_FEATURES || {}).debug) console.log('[ANZU]', msg);
    };
  })();`;

  window.EngineModuleRegistry.core = {
    id: 'core',
    label: 'Core Runtime',
    featureKey: 'core',
    description: 'Bootstraps shared runtime helpers and feature checks.',
    source,
  };
})();
