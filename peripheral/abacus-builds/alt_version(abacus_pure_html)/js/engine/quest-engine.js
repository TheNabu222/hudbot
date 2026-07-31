(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.QuestEngine = {
      applyBranchMeta: function(milestone, runtime){
        if (!milestone || !runtime) return;
        if ((milestone.branchFlag === 'boundary-setting' || milestone.branchFlag === 'conflict-resolving') && milestone.socialRepDelta && milestone.npcId) {
          const target = runtime.reputation && runtime.reputation[milestone.npcId];
          if (target) target.Friendship = Math.max(0, Math.min(100, Number(target.Friendship || 0) + Number(milestone.socialRepDelta || 0)));
        }
      }
    };
  })();`;

  window.EngineModuleRegistry.quests = {
    id: 'quests',
    label: 'Quest Engine',
    featureKey: 'quests',
    description: 'Quest progression and milestone branch metadata.',
    source,
  };
})();
