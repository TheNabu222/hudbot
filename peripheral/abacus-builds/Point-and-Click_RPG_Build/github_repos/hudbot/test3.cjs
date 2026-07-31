const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');

const regex = /<div id="([^"]+)" [^>]*class="scene-object[^"]*"[^>]*style="([^"]*)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const id = match[1];
  const style = match[2];
  if (style.includes('opacity: 0')) {
    console.log(id, 'HAS OPACITY 0');
  }
}
