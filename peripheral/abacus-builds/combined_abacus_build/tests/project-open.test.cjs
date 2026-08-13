const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!doctype html><body>
  <p id="project-open-status" class="project-open-status" hidden></p>
</body>`, { url: 'http://127.0.0.1:5180/combined_abacus_build/', runScripts: 'outside-only' });
const { window } = dom;
window.console = console;
let alertCount = 0;
window.alert = () => { alertCount += 1; };
window.State = { fromJSON: text => JSON.parse(text) && true };

const projectPath = path.join(__dirname, '..', 'js', 'project.js');
const projectSource = fs.readFileSync(projectPath, 'utf8')
  .replace('const Project =', 'globalThis.Project =');
window.eval(projectSource);

(async () => {
  const readable = new window.File(['{"name":"Readable"}'], 'readable.json', { type: 'application/json' });
  assert.equal(await window.Project.readFileText(readable), '{"name":"Readable"}');

  const status = window.document.getElementById('project-open-status');
  const originalReader = window.Project.readFileText;
  window.Project.readFileText = async () => {
    throw new window.DOMException('The requested file could not be read.', 'NotReadableError');
  };
  const target = { files: [{ name: 'moved-save.json' }], value: 'selected' };
  await window.Project.openFile({ target });
  assert.equal(target.value, '');
  assert.equal(status.hidden, false);
  assert.equal(status.classList.contains('is-error'), true);
  assert.match(status.textContent, /Downloads or drag it onto Drop Save Here/i);
  assert.equal(alertCount, 0);

  window.Project.readFileText = originalReader;
  const malformed = new window.File(['not json'], 'broken.json', { type: 'application/json' });
  await window.Project.openFile({ target: { files: [malformed], value: 'selected' } });
  assert.match(status.textContent, /not a readable Anzu or Hudbot project/i);
  assert.equal(alertCount, 0);

  console.log('Project file-open recovery tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
