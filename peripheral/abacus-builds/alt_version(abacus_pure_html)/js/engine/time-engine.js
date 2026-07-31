(function () {
  window.EngineModuleRegistry = window.EngineModuleRegistry || {};
  const source = `(function(){
    window.TimeEngine = {
      advance: function(time, minutes){
        if (!time) return;
        time.totalMinutes = Number(time.totalMinutes || 0) + Number(minutes || 0);
        time.minute = ((time.totalMinutes % 60) + 60) % 60;
        time.hour = Math.floor(time.totalMinutes / 60) % 24;
        time.day = Math.floor(time.totalMinutes / (24 * 60)) + 1;
      }
    };
  })();`;

  window.EngineModuleRegistry.time = {
    id: 'time',
    label: 'Time Engine',
    featureKey: 'time',
    description: 'Day/night and timeline progression helpers.',
    source,
  };
})();
