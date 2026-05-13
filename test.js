const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM(`
  <!DOCTYPE html>
  <body>
    <div id="parent" style="pointer-events: auto;">
      <div id="child1" style="width: 100px; height: 100px; position: absolute; background-color: transparent;"></div>
      <div id="child2" style="width: 100px; height: 100px; position: absolute; background-color: transparent; pointer-events: auto;"></div>
    </div>
  </body>
`);
