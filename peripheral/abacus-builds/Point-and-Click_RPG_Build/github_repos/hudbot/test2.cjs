const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');

const regex = /<div id="e0a45fba-a423-45c2-9306-d1149d13bff4" [^>]*class="scene-object[^"]*"[^>]*>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[0]);
}
