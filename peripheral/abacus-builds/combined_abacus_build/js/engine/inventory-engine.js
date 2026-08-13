(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.InventoryEngine = window.InventoryEngine || {
      addItem: function(inv, itemId){
        if (!inv || !itemId) return;
        const ex = inv.find(i => i.itemId === itemId);
        if (ex) ex.count = (ex.count || 0) + 1;
        else inv.push({ itemId:itemId, count:1 });
      }
    };
  })();`;

  window.EngineModuleRegistry.inventory = {
    id: 'inventory',
    label: 'Inventory Engine',
    featureKey: 'inventory',
    description: 'Handles item granting, consuming, and item checks.',
    source,
  };
})();
