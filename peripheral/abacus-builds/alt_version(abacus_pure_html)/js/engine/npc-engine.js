(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.NPCEngine = {
      ensureState: function(state, id){
        if (!state[id]) state[id] = { waypointIdx: 0, wait: 0, wanderTarget: null };
        return state[id];
      }
    };
  })();`;

  window.EngineModuleRegistry.npc = {
    id: 'npc',
    label: 'NPC Engine',
    featureKey: 'npc',
    description: 'NPC movement and lightweight behavior state helpers.',
    source,
  };
})();
