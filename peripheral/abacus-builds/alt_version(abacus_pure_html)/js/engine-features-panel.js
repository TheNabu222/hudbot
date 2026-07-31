/* ===== ENGINE FEATURES PANEL ===== */
const EngineFeaturesPanel = {
  featureRows() {
    const mods = (typeof EngineLoader !== 'undefined') ? EngineLoader.listModules() : [];
    return mods.filter(m => m.featureKey !== 'core');
  },

  render(container) {
    if (!container) return;
    if (typeof EngineLoader !== 'undefined') EngineLoader.ensureProjectFeatures();
    const cfg = State.project.engineFeatures || {};

    container.innerHTML = `
      <div class="dialogue-node-editor">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <h4 style="margin:0;color:var(--text-primary)">⚙ Engine Features</h4>
          <button class="p3-btn" id="engine-reset-defaults">Reset Defaults</button>
        </div>
        <p style="font-size:11px;color:var(--text-dim);margin-bottom:8px">Enable only the systems you want in preview/export. Keep it lightweight for each game.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          ${this.featureRows().map(m => `
            <label style="display:flex;gap:6px;align-items:center;font-size:11px;background:var(--bg-secondary);padding:5px;border:1px solid var(--border);border-radius:4px" title="${this._esc(m.description)}">
              <input type="checkbox" data-engine-key="${m.featureKey}" ${cfg[m.featureKey] !== false ? 'checked' : ''} />
              <span>${this._esc(m.label)}</span>
            </label>
          `).join('')}
        </div>
        <label style="display:flex;gap:6px;align-items:center;font-size:11px;margin-top:8px">
          <input type="checkbox" id="engine-debug-mode" ${cfg.debug ? 'checked' : ''} />
          Debug Logs in Export Runtime
        </label>
      </div>
    `;

    container.querySelectorAll('[data-engine-key]').forEach((el) => {
      el.addEventListener('change', () => {
        State.project.engineFeatures[el.dataset.engineKey] = !!el.checked;
        State.autoSave();
      });
    });

    container.querySelector('#engine-debug-mode')?.addEventListener('change', (e) => {
      State.project.engineFeatures.debug = !!e.target.checked;
      State.autoSave();
    });

    container.querySelector('#engine-reset-defaults')?.addEventListener('click', () => {
      State.project.engineFeatures = EngineLoader.defaultFeatures();
      State.autoSave();
      this.render(container);
    });
  },

  renderExportToggles(container) {
    if (!container) return;
    if (typeof EngineLoader !== 'undefined') EngineLoader.ensureProjectFeatures();
    const cfg = State.project.engineFeatures || {};
    container.innerHTML = this.featureRows().map((m) => `
      <label title="${this._esc(m.description)}"><input type="checkbox" class="export-engine-toggle" data-engine-key="${m.featureKey}" ${cfg[m.featureKey] !== false ? 'checked' : ''}/> ${this._esc(m.label)}</label>
    `).join('');
  },

  collectExportToggles() {
    const cfg = Object.assign({}, State.project.engineFeatures || EngineLoader.defaultFeatures());
    document.querySelectorAll('.export-engine-toggle').forEach((el) => {
      cfg[el.dataset.engineKey] = !!el.checked;
    });
    return cfg;
  },

  _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
};
