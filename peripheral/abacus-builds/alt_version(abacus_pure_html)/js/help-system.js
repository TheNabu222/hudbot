/* ===== BEGINNER FRIENDLY HELP + TOOLTIPS ===== */
const HelpSystem = {
  helpTopics: [
    { topic: 'Getting Started', title: 'Welcome flow', what: 'Start by adding art, then build scenes, then add clicks/interactions, then export your game.', why: 'This keeps your progress smooth and prevents overwhelm.', example: 'Example: Add character + room art first, then wire up door clicks.' },
    { topic: 'Building Scenes', title: 'Layer Order', what: 'Layer Order controls what appears in front or behind.', why: 'Use this when one object should overlap another.', example: 'Example: Put your character in front of the sofa, behind a foreground plant.' },
    { topic: 'Interactions', title: 'Clickable Areas', what: 'Clickable Areas are invisible zones players can click.', why: 'Great for doors, hidden clues, or large objects with tiny art details.', example: 'Example: Draw a clickable area over a doorknob so it is easy to click.' },
    { topic: 'Visuals', title: 'See-Through Amount', what: 'See-Through Amount makes an object more transparent.', why: 'Perfect for ghosts, fog, and glow effects.', example: 'Want your character to glow when you hover over them? Try the "How Colors Mix" setting plus lower See-Through Amount.' },
    { topic: 'Assets', title: 'Details & Info', what: 'Details & Info stores category, tags, lore, and source notes for each asset.', why: 'Helps you stay organized as your game grows.', example: 'Example: Tag an image as #night #city so you can find it fast later.' },
    { topic: 'Publishing', title: 'Export Game', what: 'Export packages your project into a playable HTML game.', why: 'Use this when you are ready to share or test outside the editor.', example: 'Example: Export and send the HTML file to a friend for feedback.' },
    { topic: 'GitHub + AI Setup', title: 'Account setup', what: 'Save your GitHub token and API keys in Settings.', why: 'So you can import from repositories and run AI analysis without repeating setup.', example: 'Example: Save key once, then run AI analysis in one click from Asset Hub.' }
  ],

  tooltipMap: {
    'btn-new-project': { title: 'New Project', what: 'Starts a brand-new game project.', why: 'Use this when beginning a fresh story or prototype.' },
    'btn-open-project': { title: 'Open Project', what: 'Loads a project file you saved earlier.', why: 'Use this to continue your game later.' },
    'btn-save-project': { title: 'Save Project', what: 'Saves your game progress.', why: 'Use often so your latest changes stay safe.' },
    'btn-grid-toggle': { title: 'Grid', what: 'Shows a helper grid on the canvas.', why: 'Use it to line up objects neatly.' },
    'btn-snap-toggle': { title: 'Snap', what: 'Snaps objects to grid lines while moving.', why: 'Great for clean, tidy layouts.' },
    'btn-help': { title: 'Help Center', what: 'Opens full help docs with examples.', why: 'Use it whenever you get stuck.' },
    'btn-settings': { title: 'Settings', what: 'Manage API keys and welcome guide options.', why: 'Use it for easy setup and personalization.' },
    'btn-github': { title: 'GitHub Bridge', what: 'Connect to a GitHub repo and import images.', why: 'Use this to quickly pull game art from your repo.' },
    'btn-preview': { title: 'Preview', what: 'Play your game inside the editor.', why: 'Use this to test what players will experience.' },
    'btn-export': { title: 'Export', what: 'Downloads your game as a standalone HTML file.', why: 'Use this to share your playable game.' },
    'btn-add-scene': { title: 'Add Scene', what: 'Creates a new scene/screen for your game.', why: 'Use for new rooms, maps, or story moments.' },
    'btn-asset-manager': { title: 'Asset Hub', what: 'Opens advanced tools for organizing assets.', why: 'Use this when your art library grows.' },
    'prop-opacity': { title: 'See-Through Amount', what: 'Makes an object more transparent or solid.', why: 'Use it for depth, ghost effects, and soft overlays.' },
    'prop-blend': { title: 'How Colors Mix', what: 'Changes how this object’s colors combine with what is behind it.', why: 'Use this for glow, shadow, dreamy, or dramatic effects.' },
    'btn-draw-hitbox': { title: 'Draw Clickable Area', what: 'Draws an invisible area players can click.', why: 'Use this to make interactions easier to trigger.' },
    'btn-clear-hitbox': { title: 'Clear Areas', what: 'Removes all clickable areas in the current scene.', why: 'Use this when you want to rebuild interactions cleanly.' },
    'toggle-hitboxes': { title: 'Show Clickable Areas', what: 'Shows or hides clickable area outlines while editing.', why: 'Use this to visually check where clicks are possible.' }
  },

  init() {
    this._buildHelpPanel();
    this._buildWelcomeGuide();
    this.attachContextualHelp();
    this.bindTopButtons();
    if (localStorage.getItem('anzu_hide_welcome_guide') !== 'true') {
      setTimeout(() => this.showWelcomeGuide(), 350);
    }
  },

  bindTopButtons() {
    document.getElementById('btn-help')?.addEventListener('click', () => this.showHelpPanel());
  },

  attachContextualHelp() {
    const targets = document.querySelectorAll('button, .panel-tab, .am-tab, .section-header h3, .panel-section h4, .prop-row label');
    targets.forEach((el) => {
      if (el.querySelector('.help-icon')) return;
      const id = el.id || '';
      const data = this.tooltipMap[id] || this._helpFromText(el.textContent);
      if (!data) return;
      const icon = document.createElement('span');
      icon.className = 'help-icon';
      icon.textContent = '?';
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showTooltip(icon, data);
      });
      el.appendChild(icon);
    });
  },

  _helpFromText(text) {
    const t = (text || '').trim().toLowerCase();
    if (!t) return null;
    const glossary = [
      ['layer', { title: 'Layer Order', what: 'Controls what appears in front or behind.', why: 'Use it to keep visual depth clear.' }],
      ['clickable', { title: 'Clickable Areas', what: 'Invisible click zones for interactions.', why: 'Use this to make interactions easier and friendlier.' }],
      ['scene', { title: 'Scenes', what: 'A scene is one room/screen in your game.', why: 'Use multiple scenes to build a bigger world.' }],
      ['asset', { title: 'Assets', what: 'Assets are your art files (characters, props, backgrounds).', why: 'Use them to build your visual world.' }],
      ['dialogue', { title: 'Dialogue', what: 'Lets characters talk and present text.', why: 'Use it to tell story and guide players.' }],
      ['flag', { title: 'Story Flags', what: 'Flags remember what happened in your story.', why: 'Use them for branching outcomes and progress checks.' }],
      ['save', { title: 'Save / Load', what: 'Lets players save and continue later.', why: 'Important for longer games.' }],
      ['settings', { title: 'Settings', what: 'Where you manage tokens, keys, and guide preferences.', why: 'Use once to set up integrations.' }],
      ['preview', { title: 'Preview', what: 'Runs your game immediately in the editor.', why: 'Fast testing while building.' }],
      ['export', { title: 'Export', what: 'Creates a shareable game file.', why: 'Use when your build is ready to share.' }],
    ];
    for (const [needle, data] of glossary) if (t.includes(needle)) return data;
    return { title: text.trim(), what: 'This control changes part of your game setup.', why: 'Use it when you want to customize this area.' };
  },

  showTooltip(anchor, data) {
    const old = document.querySelector('.help-tooltip');
    if (old) old.remove();

    const tip = document.createElement('div');
    tip.className = 'help-tooltip';
    tip.innerHTML = `<div class="title">${data.title}</div><div>${data.what}</div><div class="why"><strong>Why use it:</strong> ${data.why}</div>`;
    document.body.appendChild(tip);

    const r = anchor.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 340, Math.max(8, r.left - 10));
    const top = Math.min(window.innerHeight - tip.offsetHeight - 8, r.bottom + 8);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;

    setTimeout(() => {
      const close = (e) => {
        if (!tip.contains(e.target)) {
          tip.remove();
          document.removeEventListener('click', close, true);
        }
      };
      document.addEventListener('click', close, true);
    }, 0);
  },

  _buildHelpPanel() {
    const overlay = document.createElement('div');
    overlay.className = 'help-overlay';
    overlay.id = 'help-panel-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="help-card">
        <div class="help-header">
          <h3>✨ Anzu Help Center (Beginner Friendly)</h3>
          <button class="small-btn" id="help-close">Close</button>
        </div>
        <div class="help-body">
          <input class="help-search" id="help-search" placeholder="Search help (example: layers, clickable, export, GitHub)..." />
          <div id="help-topic-list"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideHelpPanel();
    });
    overlay.querySelector('#help-close').addEventListener('click', () => this.hideHelpPanel());
    overlay.querySelector('#help-search').addEventListener('input', () => this.renderHelpTopics());
    this.renderHelpTopics();
  },

  renderHelpTopics() {
    const list = document.getElementById('help-topic-list');
    const q = (document.getElementById('help-search')?.value || '').toLowerCase();
    if (!list) return;
    const rows = this.helpTopics.filter(t => `${t.topic} ${t.title} ${t.what} ${t.why} ${t.example}`.toLowerCase().includes(q));

    list.innerHTML = rows.map(t => `
      <div class="help-topic">
        <h4>${t.topic} · ${t.title}</h4>
        <div><strong>What it does:</strong> ${t.what}</div>
        <div><strong>Why you’d use it:</strong> ${t.why}</div>
        <div class="help-example"><strong>Example:</strong> ${t.example}</div>
      </div>
    `).join('') || '<div class="empty-state">No matches yet. Try another search word.</div>';
  },

  showHelpPanel() {
    document.getElementById('help-panel-overlay').hidden = false;
    this.renderHelpTopics();
  },

  hideHelpPanel() {
    document.getElementById('help-panel-overlay').hidden = true;
  },

  _buildWelcomeGuide() {
    const overlay = document.createElement('div');
    overlay.className = 'help-overlay';
    overlay.id = 'welcome-guide-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="help-card" style="max-width:760px">
        <div class="help-header">
          <h3>👋 Welcome to Anzu Game Studio</h3>
        </div>
        <div class="help-body">
          <p>You’ve got the vision — Anzu helps you turn it into a playable game, even if you’re not a coder 💜</p>
          <div class="welcome-steps">
            <div class="welcome-step"><strong>1) Upload Assets</strong><br/>Add characters, backgrounds, and props.</div>
            <div class="welcome-step"><strong>2) Build Scenes</strong><br/>Arrange your world, room by room.</div>
            <div class="welcome-step"><strong>3) Add Interactions</strong><br/>Set what happens when players click things.</div>
            <div class="welcome-step"><strong>4) Export Game</strong><br/>Download and share your playable game.</div>
          </div>
          <p class="hint">Tip: Look for <strong>?</strong> icons beside tools to get simple explanations and examples.</p>
          <div class="prop-row" style="justify-content:space-between;margin-top:10px">
            <label style="text-align:left;min-width:auto"><input type="checkbox" id="welcome-dont-show" /> Don’t show this again</label>
            <button class="accent-btn" id="welcome-start">Let’s build! 🚀</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#welcome-start').addEventListener('click', () => {
      if (overlay.querySelector('#welcome-dont-show').checked) {
        localStorage.setItem('anzu_hide_welcome_guide', 'true');
      }
      this.hideWelcomeGuide();
    });
  },

  showWelcomeGuide() {
    document.getElementById('welcome-guide-overlay').hidden = false;
  },

  hideWelcomeGuide() {
    document.getElementById('welcome-guide-overlay').hidden = true;
  }
};