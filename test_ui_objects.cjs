const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');
const scriptMatch = html.match(/<script id="__GAME_DATA__" type="application\/json">(.*?)<\/script>/s);
if (scriptMatch) {
  const data = JSON.parse(scriptMatch[1]);
  if (data.uiMenus && data.uiMenus[0]) {
    const menu = data.uiMenus[0];
    console.log("Menu objects:", menu.objects.length);
    menu.objects.forEach(o => {
      console.log(`- Obj ${o.name}: w=${o.width}, h=${o.height}, x=${o.x}, y=${o.y}, ignoreClicks=${o.ignoreClicks}`);
    });
  }
}
