/* ===== SETTINGS PANEL (BEGINNER CREDENTIAL SETUP) ===== */
const SettingsPanel = {
  storageKey: 'anzu_platform_keys',
  data: {
    github: '',
    abacus: '',
    openai: '',
    anthropic: '',
    gemini: '',
    custom: {}
  },

  init() {
    this.load();
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      this.data = {
        github: saved.github || '',
        abacus: saved.abacus || '',
        openai: saved.openai || '',
        anthropic: saved.anthropic || '',
        gemini: saved.gemini || '',
        custom: saved.custom || {}
      };
    } catch (e) {}
  },

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  },

  getKey(platform) {
    if (platform in this.data) return this.data[platform] || '';
    return this.data.custom?.[platform] || '';
  },

  setKey(platform, value) {
    if (platform in this.data) this.data[platform] = value;
    else this.data.custom[platform] = value;
    this.save();
  },

  render(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="settings-box">
        <h4>🔐 Connect Your Accounts (Safe + Local)</h4>
        <p class="hint">Your keys stay in this browser using local storage. They are not added to your project files.</p>
      </div>

      <div class="settings-box">
        <h4>🐙 GitHub Personal Access Token</h4>
        <div class="prop-row"><label>Token</label><input type="password" id="set-github-token" placeholder="github_pat_..." value="${this._esc(this.data.github)}" /></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="small-btn" id="set-save-github">Save</button>
          <button class="small-btn" id="set-test-github">Test Connection</button>
          <a class="small-btn" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">How to create token</a>
        </div>
        <div class="settings-status" id="set-github-status">Not tested yet.</div>
      </div>

      <div class="settings-box">
        <h4>🤖 Abacus.AI API Key</h4>
        <div class="prop-row"><label>API Key</label><input type="password" id="set-abacus-key" placeholder="Paste your Abacus API key" value="${this._esc(this.data.abacus)}" /></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="small-btn" id="set-save-abacus">Save</button>
          <button class="small-btn" id="set-test-abacus">Check Format</button>
          <a class="small-btn" href="https://apps.abacus.ai/settings/api-keys" target="_blank" rel="noopener">Where to get key</a>
        </div>
        <div class="settings-status" id="set-abacus-status">Not tested yet.</div>
      </div>

      <div class="settings-box">
        <h4>🌐 Keys for Other AI Platforms</h4>
        <div class="prop-row"><label>OpenAI</label><input type="password" id="set-openai-key" placeholder="Optional" value="${this._esc(this.data.openai)}" /></div>
        <div class="prop-row"><label>Anthropic</label><input type="password" id="set-anthropic-key" placeholder="Optional" value="${this._esc(this.data.anthropic)}" /></div>
        <div class="prop-row"><label>Gemini</label><input type="password" id="set-gemini-key" placeholder="Optional" value="${this._esc(this.data.gemini)}" /></div>
        <button class="small-btn" id="set-save-all">Save all platform keys</button>
      </div>

      <div class="settings-box">
        <h4>👋 Welcome Guide</h4>
        <p class="hint">If you checked “Don't show again,” you can bring the guide back from here.</p>
        <button class="small-btn" id="set-reset-welcome">Show Welcome Guide Again</button>
      </div>
    `;

    this.bind(container);
  },

  bind(container) {
    container.querySelector('#set-save-github')?.addEventListener('click', () => {
      this.setKey('github', container.querySelector('#set-github-token').value.trim());
      this._setStatus('set-github-status', 'Saved in this browser.', 'ok');
    });

    container.querySelector('#set-test-github')?.addEventListener('click', async () => {
      const token = container.querySelector('#set-github-token').value.trim();
      if (!token) return this._setStatus('set-github-status', 'Please add a token first.', 'warn');
      this.setKey('github', token);
      this._setStatus('set-github-status', 'Testing connection...', '');
      try {
        const resp = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${token}` } });
        if (!resp.ok) throw new Error('GitHub rejected the token.');
        const data = await resp.json();
        this._setStatus('set-github-status', `Connected as @${data.login}`, 'ok');
      } catch (e) {
        this._setStatus('set-github-status', e.message, 'err');
      }
    });

    container.querySelector('#set-save-abacus')?.addEventListener('click', () => {
      this.setKey('abacus', container.querySelector('#set-abacus-key').value.trim());
      this._setStatus('set-abacus-status', 'Saved in this browser.', 'ok');
    });

    container.querySelector('#set-test-abacus')?.addEventListener('click', () => {
      const key = container.querySelector('#set-abacus-key').value.trim();
      if (!key) return this._setStatus('set-abacus-status', 'Please add an API key first.', 'warn');
      this.setKey('abacus', key);
      if (key.length >= 20) this._setStatus('set-abacus-status', 'Key format looks good. Ready to use.', 'ok');
      else this._setStatus('set-abacus-status', 'Key seems too short. Please double-check.', 'warn');
    });

    container.querySelector('#set-save-all')?.addEventListener('click', () => {
      this.setKey('openai', container.querySelector('#set-openai-key').value.trim());
      this.setKey('anthropic', container.querySelector('#set-anthropic-key').value.trim());
      this.setKey('gemini', container.querySelector('#set-gemini-key').value.trim());
      Toast.show('Saved your platform keys in local storage', 'success');
    });

    container.querySelector('#set-reset-welcome')?.addEventListener('click', () => {
      localStorage.removeItem('anzu_hide_welcome_guide');
      if (typeof HelpSystem !== 'undefined') HelpSystem.showWelcomeGuide();
      Toast.show('Welcome guide reset. It will show again.', 'success');
    });
  },

  _setStatus(id, text, cls = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'settings-status' + (cls ? ` ${cls}` : '');
  },

  _esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};