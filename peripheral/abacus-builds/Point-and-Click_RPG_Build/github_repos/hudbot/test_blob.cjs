const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');

const scriptMatch = html.match(/<script id="__GAME_DATA__" type="application\/json">(.*?)<\/script>/s);
if (scriptMatch) {
  const data = JSON.parse(scriptMatch[1]);
  let blobCount = 0;
  data.assets.forEach(a => {
    if (a.src && a.src.startsWith('blob:')) {
      console.log("Blob URL found:", a.name, a.src);
      blobCount++;
    }
  });
  console.log("Total blob URLs:", blobCount);
} else {
  console.log("No JSON script found!");
}
