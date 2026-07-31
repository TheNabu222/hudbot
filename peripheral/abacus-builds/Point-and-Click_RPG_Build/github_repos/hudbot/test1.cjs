const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');

const regex = /<div id="([^"]+)" [^>]*class="scene-object[^"]*"[^>]*>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const str = match[0];
  if (str.includes('data-interaction') && !str.includes('data-interaction="none"')) {
    console.log(str.substring(0, 150));
  }
}
