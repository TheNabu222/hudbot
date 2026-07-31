/* ===== ENGINE MODULE LOADER ===== */
const EngineLoader = {
  orderedKeys: ['core','dialogue','inventory','needs','reputation','quests','stats','time','status','npc','saveload'],

  defaultFeatures() {
    return {
      core: true,
      dialogue: true,
      inventory: true,
      needs: true,
      reputation: true,
      quests: true,
      stats: true,
      time: true,
      status: true,
      npc: true,
      saveload: true,
      debug: false,
    };
  },

  ensureProjectFeatures() {
    if (!State.project.engineFeatures) State.project.engineFeatures = this.defaultFeatures();
    const defs = this.defaultFeatures();
    Object.keys(defs).forEach((k) => {
      if (typeof State.project.engineFeatures[k] === 'undefined') State.project.engineFeatures[k] = defs[k];
    });
  },

  listModules() {
    const registry = window.EngineModuleRegistry || {};
    return this.orderedKeys
      .map((k) => registry[k])
      .filter(Boolean);
  },

  getEnabledModules(featureConfig) {
    const cfg = featureConfig || State.project.engineFeatures || this.defaultFeatures();
    return this.listModules().filter((m) => cfg[m.featureKey] !== false);
  },

  generateInlineScripts(featureConfig) {
    const cfg = featureConfig || State.project.engineFeatures || this.defaultFeatures();
    const scripts = [];
    this.getEnabledModules(cfg).forEach((m) => {
      scripts.push(`<script data-engine-module="${m.id}">\n${m.source}\n<\/script>`);
    });
    return scripts.join('\n');
  },
};
