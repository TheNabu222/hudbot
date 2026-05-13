const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');

const scriptMatch = html.match(/<script id="__GAME_DATA__" type="application\/json">(.*?)<\/script>/s);
if (scriptMatch) {
  try {
    const data = JSON.parse(scriptMatch[1]);
    console.log("JSON is valid! Objects:", Object.keys(data));
  } catch (e) {
    console.error("JSON Error:", e.message);
  }
} else {
  console.log("No JSON script found!");
}
