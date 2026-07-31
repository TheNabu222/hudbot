(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.RelationshipEngine = {
      applyDelta: function(rep, npcId, type, delta){
        if (!rep || !npcId || !rep[npcId]) return;
        const stat = type || 'Friendship';
        rep[npcId][stat] = Math.max(0, Math.min(100, Number(rep[npcId][stat] || 0) + Number(delta || 0)));
      }
    };
  })();`;

  window.EngineModuleRegistry.reputation = {
    id: 'reputation',
    label: 'Reputation Engine',
    featureKey: 'reputation',
    description: 'Tracks social reputation and relationship deltas.',
    source,
  };
})();
