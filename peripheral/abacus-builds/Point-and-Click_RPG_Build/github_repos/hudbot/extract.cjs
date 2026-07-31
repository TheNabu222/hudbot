const fs = require('fs');
const html = fs.readFileSync('components/game (29).html', 'utf8');

const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
if (scriptMatch) {
  fs.writeFileSync('test_script.js', scriptMatch[1]);
  console.log("Script extracted to test_script.js");
} else {
  console.log("No script found!");
}
