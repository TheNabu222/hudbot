const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');
const scriptMatch = html.match(/<script id="__GAME_DATA__" type="application\/json">(.*?)<\/script>/s);
if (scriptMatch) {
  const data = JSON.parse(scriptMatch[1]);
  console.log("uiMenus count:", data.uiMenus ? data.uiMenus.length : 0);
  if (data.uiMenus) {
    data.uiMenus.forEach(m => console.log(`Menu ${m.id}: isOpenByDefault=${m.isOpenByDefault}, blocksClicks=${m.blocksClicks}, w=${m.width}, h=${m.height}`));
  }
}
