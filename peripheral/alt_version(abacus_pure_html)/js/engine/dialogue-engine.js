(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.DialogueEngine = {
      applySocialChoice(choice, runtime){
        if (!choice || !runtime) return;
        if (choice.socialTag === 'boundary-setting' || choice.socialTag === 'conflict-resolving') {
          const rep = Number(choice.socialRepDelta || 0);
          if (choice.npcId && runtime.reputation && runtime.reputation[choice.npcId]) {
            runtime.reputation[choice.npcId].Friendship = Math.max(0, Math.min(100, (runtime.reputation[choice.npcId].Friendship || 0) + rep));
          }
        }
      }
    };
  })();`;

  window.EngineModuleRegistry.dialogue = {
    id: 'dialogue',
    label: 'Dialogue Engine',
    featureKey: 'dialogue',
    description: 'Dialogue tree runtime with branch flags for social outcomes.',
    source,
  };
})();
