const { JSDOM } = require('jsdom');
const html = require('fs').readFileSync('exported.html', 'utf8');
const dom = new JSDOM(html);
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = { getItem: () => null, setItem: () => null };

// We need to trigger load event
dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

const scriptContent = dom.window.document.querySelector('script:not([type])').textContent;
dom.window.eval(scriptContent);

console.log('Script evaluated!');
// simulate click on hitbox
const hitbox = dom.window.document.getElementById('hitbox1');
console.log('Hitbox found?', !!hitbox);
if (hitbox) {
  const event = new dom.window.Event('pointerdown', { bubbles: true });
  hitbox.dispatchEvent(event);
}
