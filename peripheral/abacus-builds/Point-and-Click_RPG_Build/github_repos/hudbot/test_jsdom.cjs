const { JSDOM } = require("jsdom");

JSDOM.fromFile("components/game (29).html", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  const window = dom.window;
  
  setTimeout(() => {
    const objects = window.document.querySelectorAll('.scene-object');
    objects.forEach(target => {
       if (target.getAttribute('data-interaction') === 'scene_change' && target.getAttribute('data-interaction-data') !== 'scene-1') {
          console.log("Clicking target that goes to:", target.getAttribute('data-interaction-data'));
          const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
          target.dispatchEvent(event);
          const activeScenesAfter = Array.from(window.document.querySelectorAll('.game-scene')).filter(s => s.style.display === 'block').map(s => s.id);
          console.log("Active scenes after:", activeScenesAfter);
       }
    });
  }, 1000);
}).catch(err => {
  console.error("DOM error:", err);
});
