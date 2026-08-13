(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.StatsEngine = {
      roll: function(sides){
        const s = Math.max(2, Number(sides || 20));
        return Math.floor(Math.random() * s) + 1;
      }
    };
  })();`;

  window.EngineModuleRegistry.stats = {
    id: 'stats',
    label: 'Stats & Skill Engine',
    featureKey: 'stats',
    description: 'Dice rolls and skill checks for gated interactions.',
    source,
  };
})();
