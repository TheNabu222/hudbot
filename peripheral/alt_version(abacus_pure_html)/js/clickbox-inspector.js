/* ===== CLICKBOX INSPECTOR (Phase 3D) =====
 * Renders the right-side inspector UI when a clickbox is selected.
 *
 * Mounts into:
 *   #clickbox-inspector-empty   — shown when no clickbox selected
 *   #clickbox-inspector-panel   — shown when a clickbox is selected
 */
const ClickboxInspector = {
  emptyEl: null,
  panelEl: null,

  init() {
    this.emptyEl = document.getElementById('clickbox-inspector-empty');
    this.panelEl = document.getElementById('clickbox-inspector-panel');
    this.update();
  },

  update() {
    if (!this.emptyEl || !this.panelEl) return;
    const box = Hitbox.getSelectedBox();
    if (!box) {
      this.emptyEl.hidden = false;
      this.panelEl.hidden = true;
      this.panelEl.innerHTML = '';
      return;
    }
    Hitbox.migrateBox(box);
    this.emptyEl.hidden = true;
    this.panelEl.hidden = false;
    this.render(box);
  },

  /**
   * Switch the right panel to the Click Inspector tab.
   * Called explicitly from Hitbox.selectBox via the canvas/list click.
   */
  focusTab() {
    const tabBtn = document.querySelector('#right-panel .panel-tab[data-tab="clickbox-inspector"]');
    if (!tabBtn) return;
    if (!tabBtn.classList.contains('active')) {
      tabBtn.click();
    }
  },

  render(box) {
    const meta = Hitbox.ACTION_TYPES[box.actionType] || Hitbox.ACTION_TYPES.none;
    this.panelEl.innerHTML = `
      <div class="panel-section cbi-section cbi-header" style="border-left:4px solid ${meta.color}">
        <div class="cbi-row" style="align-items:center;gap:8px">
          <div class="cbi-action-badge" style="background:${meta.color}">${meta.icon}</div>
          <input type="text" id="cbi-label" class="cbi-label-input" value="${this._esc(box.label || '')}" placeholder="Clickable Area name" />
        </div>
        <div class="cbi-row" style="gap:6px;margin-top:6px">
          <button class="small-btn" id="cbi-duplicate" title="Duplicate">⎘ Duplicate</button>
          <button class="small-btn" id="cbi-delete" title="Delete" style="background:rgba(232,84,84,0.15);color:#e85454">✕ Delete</button>
        </div>
      </div>

      <div class="panel-section cbi-section">
        <h4>Position & Size</h4>
        <div class="cbi-row">
          <label>X</label><input type="number" id="cbi-x" value="${box.x}" />
          <label>Y</label><input type="number" id="cbi-y" value="${box.y}" />
        </div>
        <div class="cbi-row">
          <label>W</label><input type="number" id="cbi-w" min="1" value="${box.width}" />
          <label>H</label><input type="number" id="cbi-h" min="1" value="${box.height}" />
        </div>
      </div>

      <div class="panel-section cbi-section">
        <h4>👆 Click Action</h4>
        <div class="cbi-row">
          <label>What happens?</label>
          <select id="cbi-action-type">${this._actionTypeOptions(box.actionType)}</select>
        </div>
        <div id="cbi-action-params" class="cbi-action-params">
          ${this._renderActionParams(box)}
        </div>
        <div class="cbi-row" style="margin-top:4px">
          <label title="Only fire this clickbox once per playthrough"><input type="checkbox" id="cbi-one-shot" ${box.oneShot ? 'checked' : ''} /> One-shot (only fires once)</label>
        </div>
      </div>

      <div class="panel-section cbi-section">
        <h4>👁 Visibility & Conditions</h4>
        <p class="hint">Only show or allow click when these conditions are met.</p>
        <div class="cbi-row">
          <label>Match</label>
          <select id="cbi-cond-mode">
            <option value="all" ${box.conditionMode==='all'?'selected':''}>All (AND)</option>
            <option value="any" ${box.conditionMode==='any'?'selected':''}>Any (OR)</option>
          </select>
        </div>
        <div class="cbi-row">
          <label><input type="checkbox" id="cbi-hide-fail" ${box.hideWhenConditionFails?'checked':''} /> Hide entirely when conditions fail (otherwise: ignore click)</label>
        </div>
        <div id="cbi-conditions-list">
          ${(box.conditions || []).map((c, i) => this._renderConditionRow(c, i)).join('')}
        </div>
        <div class="cbi-row" style="margin-top:6px">
          <button class="small-btn" id="cbi-add-condition">+ Add Condition</button>
        </div>
      </div>

      <div class="panel-section cbi-section">
        <h4>✨ Hover Effect</h4>
        <div class="cbi-row">
          <label>Effect</label>
          <select id="cbi-hover-effect">
            ${Hitbox.HOVER_EFFECTS.map(o => `<option value="${o.value}" ${box.hoverEffect===o.value?'selected':''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="cbi-row">
          <label>Tooltip text</label>
          <input type="text" id="cbi-hover-tooltip" value="${this._esc(box.hoverTooltip || '')}" placeholder="(optional) shows on hover" />
        </div>
      </div>

      <div class="panel-section cbi-section">
        <h4>🖱 Cursor Style</h4>
        <div class="cbi-row">
          <label>Cursor</label>
          <select id="cbi-cursor">
            ${Hitbox.CURSOR_OPTIONS.map(o => `<option value="${o.value}" ${box.cursor===o.value?'selected':''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="cbi-row">
          <span class="hint">Preview: <span id="cbi-cursor-preview" style="cursor:${this._esc(box.cursor || 'pointer')};display:inline-block;padding:4px 12px;border:1px dashed var(--border);border-radius:6px;background:var(--bg-input)">hover me</span></span>
        </div>
      </div>

      <div class="panel-section cbi-section">
        <h4>🎨 Visual</h4>
        <div class="cbi-row">
          <label>Marker Color</label>
          <input type="color" id="cbi-color" value="${this._normalizeColor(box.color || meta.color)}" />
        </div>
        <div class="cbi-row">
          <label>Link to Object</label>
          <select id="cbi-link-object">${this._objectOptions(box.linkedObjectId)}</select>
        </div>
      </div>
    `;

    this._bind(box);
  },

  // ============ Render helpers ============

  _actionTypeOptions(current) {
    return Object.entries(Hitbox.ACTION_TYPES).map(([key, m]) =>
      `<option value="${key}" ${key===current?'selected':''}>${m.icon} ${m.label}</option>`
    ).join('');
  },

  _renderActionParams(box) {
    switch (box.actionType) {
      case 'scene-change':   return this._sceneActionUI(box);
      case 'start-dialogue': return this._dialogueActionUI(box);
      case 'toggle-object':  return this._toggleActionUI(box);
      case 'add-item':
      case 'remove-item':    return this._itemActionUI(box);
      case 'set-flag':       return this._flagActionUI(box);
      case 'play-sound':     return this._soundActionUI(box);
      case 'multiple':       return this._multipleActionUI(box);
      default:               return '<p class="hint">No action selected. Pick one above to make this clickbox do something.</p>';
    }
  },

  _sceneActionUI(box) {
    return `
      <div class="cbi-row">
        <label>Go to scene</label>
        <select id="cbi-target-scene">
          <option value="">-- choose --</option>
          ${State.project.scenes.map(s => `<option value="${s.id}" ${s.id===box.targetSceneId?'selected':''}>${this._esc(s.name)}</option>`).join('')}
        </select>
      </div>
    `;
  },

  _dialogueActionUI(box) {
    const trees = State.project.dialogueTrees || [];
    return `
      <div class="cbi-row">
        <label>Dialogue tree</label>
        <select id="cbi-dialogue-tree">
          <option value="">-- choose --</option>
          ${trees.map(t => `<option value="${t.id}" ${t.id===box.dialogueTreeId?'selected':''}>${this._esc(t.name)}</option>`).join('')}
        </select>
      </div>
      ${trees.length === 0 ? '<p class="hint">No dialogue trees yet. Add some in the Dialogue tab.</p>' : ''}
    `;
  },

  _toggleActionUI(box) {
    const scene = State.getActiveScene();
    const objects = scene ? scene.objects : [];
    return `
      <div class="cbi-row">
        <label>Object</label>
        <select id="cbi-toggle-object">
          <option value="">-- choose --</option>
          ${objects.map(o => `<option value="${o.id}" ${o.id===box.toggleObjectId?'selected':''}>${this._esc(o.name)}</option>`).join('')}
        </select>
      </div>
      <div class="cbi-row">
        <label>Mode</label>
        <select id="cbi-toggle-mode">
          <option value="toggle"  ${box.toggleMode==='toggle' ?'selected':''}>Toggle visibility</option>
          <option value="show"    ${box.toggleMode==='show'   ?'selected':''}>Show</option>
          <option value="hide"    ${box.toggleMode==='hide'   ?'selected':''}>Hide</option>
        </select>
      </div>
    `;
  },

  _itemActionUI(box) {
    const items = State.project.inventoryItems || [];
    return `
      <div class="cbi-row">
        <label>Item</label>
        <select id="cbi-item-id">
          <option value="">-- choose --</option>
          ${items.map(it => `<option value="${it.id}" ${it.id===box.itemId?'selected':''}>${this._esc(it.name)}</option>`).join('')}
        </select>
      </div>
      <div class="cbi-row">
        <label>Count</label>
        <input type="number" id="cbi-item-count" min="1" value="${box.itemCount || 1}" />
      </div>
      ${items.length === 0 ? '<p class="hint">No items defined. Add some in the Inventory tab.</p>' : ''}
    `;
  },

  _flagActionUI(box) {
    const flags = State.project.flags || [];
    const sf = box.setFlag || { flag: '', operation: 'set', value: '' };
    return `
      <div class="cbi-row">
        <label>Flag</label>
        <select id="cbi-flag-name">
          <option value="">-- choose --</option>
          ${flags.map(f => `<option value="${f.name}" ${f.name===sf.flag?'selected':''}>${this._esc(f.name)} <${f.type}></option>`).join('')}
        </select>
      </div>
      <div class="cbi-row">
        <label>Operation</label>
        <select id="cbi-flag-op">
          <option value="set"       ${sf.operation==='set'?'selected':''}>Set to value</option>
          <option value="toggle"    ${sf.operation==='toggle'?'selected':''}>Toggle (bool)</option>
          <option value="increment" ${sf.operation==='increment'?'selected':''}>Add (number)</option>
          <option value="decrement" ${sf.operation==='decrement'?'selected':''}>Subtract (number)</option>
        </select>
      </div>
      <div class="cbi-row">
        <label>Value</label>
        <input type="text" id="cbi-flag-value" value="${this._esc(sf.value == null ? '' : sf.value)}" placeholder="true / 1 / story_arc_2" />
      </div>
      ${flags.length === 0 ? '<p class="hint">No flags defined. Add some in the Story Flags tab.</p>' : ''}
    `;
  },

  _soundActionUI(box) {
    const audioAssets = (State.project.assets || []).filter(a =>
      a.dataURL && (a.dataURL.startsWith('data:audio') || /\.(mp3|wav|ogg|m4a)$/i.test(a.name || ''))
    );
    return `
      <div class="cbi-row">
        <label>Sound</label>
        <select id="cbi-sound-asset">
          <option value="">-- choose audio asset --</option>
          ${audioAssets.map(a => `<option value="${a.id}" ${a.id===box.soundAssetId?'selected':''}>${this._esc(a.name)}</option>`).join('')}
        </select>
      </div>
      <div class="cbi-row">
        <label>Volume</label>
        <input type="range" id="cbi-sound-volume" min="0" max="1" step="0.05" value="${box.soundVolume == null ? 0.8 : box.soundVolume}" />
        <span class="range-val" id="cbi-sound-volume-val">${Math.round((box.soundVolume == null ? 0.8 : box.soundVolume) * 100)}%</span>
      </div>
      ${audioAssets.length === 0 ? '<p class="hint">No audio assets found. Import .mp3 / .wav / .ogg files in the Assets tab.</p>' : ''}
      <div class="cbi-row">
        <button class="small-btn" id="cbi-sound-test">▶ Test Play</button>
      </div>
    `;
  },

  _multipleActionUI(box) {
    const chain = box.actionChain || [];
    const rows = chain.map((step, i) => `
      <div class="cbi-chain-row" data-idx="${i}">
        <span class="cbi-chain-num">${i + 1}.</span>
        <select class="cbi-chain-type">
          ${Object.entries(Hitbox.ACTION_TYPES).filter(([k]) => k !== 'multiple' && k !== 'none').map(([key, m]) =>
            `<option value="${key}" ${step.type===key?'selected':''}>${m.icon} ${m.label}</option>`
          ).join('')}
        </select>
        ${this._renderChainStepInputs(step, i)}
        <button class="cbi-chain-del" data-idx="${i}" title="Remove step">✕</button>
      </div>
    `).join('');
    return `
      <p class="hint">Chain multiple actions to execute in order.</p>
      <div id="cbi-chain-list">${rows || '<p class="hint" style="opacity:0.7">No actions yet — add one below.</p>'}</div>
      <div class="cbi-row" style="margin-top:6px">
        <button class="small-btn" id="cbi-add-chain-step">+ Add Action Step</button>
      </div>
    `;
  },

  _renderChainStepInputs(step, idx) {
    // For each chain step we only show the minimum field needed (single target).
    switch (step.type) {
      case 'scene-change':
        return `<select class="cbi-chain-config" data-key="targetSceneId" data-idx="${idx}">
          <option value="">scene…</option>
          ${State.project.scenes.map(s => `<option value="${s.id}" ${s.id===step.targetSceneId?'selected':''}>${this._esc(s.name)}</option>`).join('')}
        </select>`;
      case 'start-dialogue':
        return `<select class="cbi-chain-config" data-key="dialogueTreeId" data-idx="${idx}">
          <option value="">tree…</option>
          ${(State.project.dialogueTrees||[]).map(t => `<option value="${t.id}" ${t.id===step.dialogueTreeId?'selected':''}>${this._esc(t.name)}</option>`).join('')}
        </select>`;
      case 'toggle-object': {
        const objs = State.getActiveScene()?.objects || [];
        return `<select class="cbi-chain-config" data-key="toggleObjectId" data-idx="${idx}">
            <option value="">object…</option>
            ${objs.map(o => `<option value="${o.id}" ${o.id===step.toggleObjectId?'selected':''}>${this._esc(o.name)}</option>`).join('')}
          </select>
          <select class="cbi-chain-config" data-key="toggleMode" data-idx="${idx}">
            <option value="toggle" ${step.toggleMode==='toggle'?'selected':''}>toggle</option>
            <option value="show"   ${step.toggleMode==='show'  ?'selected':''}>show</option>
            <option value="hide"   ${step.toggleMode==='hide'  ?'selected':''}>hide</option>
          </select>`;
      }
      case 'add-item':
      case 'remove-item': {
        const items = State.project.inventoryItems || [];
        return `<select class="cbi-chain-config" data-key="itemId" data-idx="${idx}">
          <option value="">item…</option>
          ${items.map(it => `<option value="${it.id}" ${it.id===step.itemId?'selected':''}>${this._esc(it.name)}</option>`).join('')}
        </select>
        <input type="number" min="1" class="cbi-chain-config" data-key="itemCount" data-idx="${idx}" value="${step.itemCount || 1}" style="width:50px" />`;
      }
      case 'set-flag': {
        const flags = State.project.flags || [];
        const sf = step.setFlag || {};
        return `<select class="cbi-chain-config-flag" data-key="flag" data-idx="${idx}">
            <option value="">flag…</option>
            ${flags.map(f => `<option value="${f.name}" ${f.name===sf.flag?'selected':''}>${this._esc(f.name)}</option>`).join('')}
          </select>
          <select class="cbi-chain-config-flag" data-key="operation" data-idx="${idx}">
            <option value="set"       ${sf.operation==='set'?'selected':''}>set</option>
            <option value="toggle"    ${sf.operation==='toggle'?'selected':''}>toggle</option>
            <option value="increment" ${sf.operation==='increment'?'selected':''}>+</option>
            <option value="decrement" ${sf.operation==='decrement'?'selected':''}>-</option>
          </select>
          <input type="text" class="cbi-chain-config-flag" data-key="value" data-idx="${idx}" value="${this._esc(sf.value == null ? '' : sf.value)}" placeholder="value" style="width:70px" />`;
      }
      case 'play-sound': {
        const audioAssets = (State.project.assets || []).filter(a =>
          a.dataURL && (a.dataURL.startsWith('data:audio') || /\.(mp3|wav|ogg|m4a)$/i.test(a.name || ''))
        );
        return `<select class="cbi-chain-config" data-key="soundAssetId" data-idx="${idx}">
          <option value="">sound…</option>
          ${audioAssets.map(a => `<option value="${a.id}" ${a.id===step.soundAssetId?'selected':''}>${this._esc(a.name)}</option>`).join('')}
        </select>`;
      }
      default:
        return '';
    }
  },

  _renderConditionRow(cond, idx) {
    const t = cond.type || 'flag';
    let inner = '';
    if (t === 'flag') {
      const flags = State.project.flags || [];
      inner = `
        <select class="cbi-cond-field" data-key="flag" data-idx="${idx}">
          <option value="">flag…</option>
          ${flags.map(f => `<option value="${f.name}" ${f.name===cond.flag?'selected':''}>${this._esc(f.name)}</option>`).join('')}
        </select>
        <select class="cbi-cond-field" data-key="operator" data-idx="${idx}">
          ${['==','!=','>','<','>=','<=','truthy','falsy'].map(op => `<option value="${op}" ${cond.operator===op?'selected':''}>${op}</option>`).join('')}
        </select>
        <input type="text" class="cbi-cond-field" data-key="value" data-idx="${idx}" value="${this._esc(cond.value == null ? '' : cond.value)}" placeholder="value" style="width:60px" />
      `;
    } else if (t === 'inventory') {
      const items = State.project.inventoryItems || [];
      inner = `
        <select class="cbi-cond-field" data-key="itemId" data-idx="${idx}">
          <option value="">item…</option>
          ${items.map(it => `<option value="${it.id}" ${it.id===cond.itemId?'selected':''}>${this._esc(it.name)}</option>`).join('')}
        </select>
        <select class="cbi-cond-field" data-key="operator" data-idx="${idx}">
          <option value="has" ${(cond.operator||'has')==='has'?'selected':''}>has</option>
          <option value="not" ${cond.operator==='not'?'selected':''}>does not have</option>
        </select>
      `;
    } else if (t === 'reputation') {
      const npcs = State.project.rpgNPCs || [];
      inner = `
        <select class="cbi-cond-field" data-key="npcId" data-idx="${idx}">
          <option value="">npc…</option>
          ${npcs.map(n => `<option value="${n.id}" ${n.id===cond.npcId?'selected':''}>${this._esc(n.name)}</option>`).join('')}
        </select>
        <input type="text" class="cbi-cond-field" data-key="stat" data-idx="${idx}" value="${this._esc(cond.stat || 'Friendship')}" placeholder="stat" style="width:70px" />
        <select class="cbi-cond-field" data-key="operator" data-idx="${idx}">
          ${['>=','<=','>','<','=='].map(op => `<option value="${op}" ${cond.operator===op?'selected':''}>${op}</option>`).join('')}
        </select>
        <input type="number" class="cbi-cond-field" data-key="value" data-idx="${idx}" value="${cond.value || 0}" style="width:60px" />
      `;
    } else if (t === 'skill') {
      inner = `
        <input type="text" class="cbi-cond-field" data-key="skill" data-idx="${idx}" value="${this._esc(cond.skill || '')}" placeholder="skill key" style="width:90px" />
        <span style="font-size:11px">≥</span>
        <input type="number" class="cbi-cond-field" data-key="value" data-idx="${idx}" value="${cond.value || 0}" style="width:60px" />
      `;
    } else if (t === 'time') {
      inner = `
        <select class="cbi-cond-field" data-key="timeField" data-idx="${idx}">
          <option value="hour" ${cond.timeField==='hour'?'selected':''}>Hour</option>
          <option value="day"  ${cond.timeField==='day' ?'selected':''}>Day</option>
        </select>
        <select class="cbi-cond-field" data-key="operator" data-idx="${idx}">
          ${['>=','<=','>','<','=='].map(op => `<option value="${op}" ${cond.operator===op?'selected':''}>${op}</option>`).join('')}
        </select>
        <input type="number" class="cbi-cond-field" data-key="value" data-idx="${idx}" value="${cond.value || 0}" style="width:60px" />
      `;
    }

    return `
      <div class="cbi-cond-row" data-idx="${idx}">
        <select class="cbi-cond-type" data-idx="${idx}">
          <option value="flag"       ${t==='flag'      ?'selected':''}>🚩 Flag</option>
          <option value="inventory"  ${t==='inventory' ?'selected':''}>🎒 Inventory</option>
          <option value="reputation" ${t==='reputation'?'selected':''}>🤝 Reputation</option>
          <option value="skill"      ${t==='skill'     ?'selected':''}>📈 Skill</option>
          <option value="time"       ${t==='time'      ?'selected':''}>🕒 Time</option>
        </select>
        ${inner}
        <button class="cbi-cond-del" data-idx="${idx}" title="Remove condition">✕</button>
      </div>
    `;
  },

  _objectOptions(currentId) {
    const scene = State.getActiveScene();
    const objs = scene ? scene.objects : [];
    return `<option value="">(none)</option>` + objs.map(o =>
      `<option value="${o.id}" ${o.id===currentId?'selected':''}>${this._esc(o.name)}</option>`
    ).join('');
  },

  // ============ Bind / Apply ============

  _bind(box) {
    const $ = (id) => this.panelEl.querySelector('#' + id);

    // Label
    $('cbi-label')?.addEventListener('input', () => {
      box.label = $('cbi-label').value;
      Hitbox.render(); Hitbox.renderList();
      State.autoSave();
    });

    // Header buttons
    $('cbi-duplicate')?.addEventListener('click', () => Hitbox.duplicateBox(box.id));
    $('cbi-delete')?.addEventListener('click', () => {
      if (confirm('Delete this clickable area?')) Hitbox.deleteBox(box.id);
    });

    // Position/Size
    ['cbi-x', 'cbi-y', 'cbi-w', 'cbi-h'].forEach(id => {
      $(id)?.addEventListener('change', () => {
        State.pushUndo();
        box.x = parseInt($('cbi-x').value) || 0;
        box.y = parseInt($('cbi-y').value) || 0;
        box.width = Math.max(1, parseInt($('cbi-w').value) || 1);
        box.height = Math.max(1, parseInt($('cbi-h').value) || 1);
        Hitbox.render();
        State.autoSave();
      });
    });

    // Action type
    $('cbi-action-type')?.addEventListener('change', () => {
      State.pushUndo();
      box.actionType = $('cbi-action-type').value;
      // Update legacy action field for backward compat
      box.action = box.actionType === 'scene-change' ? 'scene-change' : box.actionType;
      // Re-render whole inspector to swap params UI
      this.render(box);
      Hitbox.render(); Hitbox.renderList();
      State.autoSave();
    });

    // One-shot
    $('cbi-one-shot')?.addEventListener('change', () => {
      box.oneShot = $('cbi-one-shot').checked;
      State.autoSave();
    });

    // Action-specific bindings
    this._bindActionParams(box);

    // Conditions
    $('cbi-cond-mode')?.addEventListener('change', () => {
      box.conditionMode = $('cbi-cond-mode').value;
      State.autoSave();
    });
    $('cbi-hide-fail')?.addEventListener('change', () => {
      box.hideWhenConditionFails = $('cbi-hide-fail').checked;
      State.autoSave();
    });
    $('cbi-add-condition')?.addEventListener('click', () => {
      State.pushUndo();
      if (!Array.isArray(box.conditions)) box.conditions = [];
      box.conditions.push({ type: 'flag', flag: '', operator: '==', value: '' });
      this.render(box);
      State.autoSave();
    });
    this._bindConditionRows(box);

    // Hover effect
    $('cbi-hover-effect')?.addEventListener('change', () => {
      box.hoverEffect = $('cbi-hover-effect').value;
      State.autoSave();
    });
    $('cbi-hover-tooltip')?.addEventListener('input', () => {
      box.hoverTooltip = $('cbi-hover-tooltip').value;
      State.autoSave();
    });

    // Cursor
    $('cbi-cursor')?.addEventListener('change', () => {
      box.cursor = $('cbi-cursor').value;
      const preview = $('cbi-cursor-preview');
      if (preview) preview.style.cursor = box.cursor;
      State.autoSave();
    });

    // Color
    $('cbi-color')?.addEventListener('change', () => {
      box.color = $('cbi-color').value;
      Hitbox.render(); Hitbox.renderList();
      State.autoSave();
    });

    // Linked object
    $('cbi-link-object')?.addEventListener('change', () => {
      box.linkedObjectId = $('cbi-link-object').value || null;
      State.autoSave();
    });
  },

  _bindActionParams(box) {
    const $ = (id) => this.panelEl.querySelector('#' + id);

    // Scene
    $('cbi-target-scene')?.addEventListener('change', () => {
      box.targetSceneId = $('cbi-target-scene').value || null;
      State.autoSave();
    });

    // Dialogue
    $('cbi-dialogue-tree')?.addEventListener('change', () => {
      box.dialogueTreeId = $('cbi-dialogue-tree').value;
      State.autoSave();
    });

    // Toggle object
    $('cbi-toggle-object')?.addEventListener('change', () => {
      box.toggleObjectId = $('cbi-toggle-object').value;
      State.autoSave();
    });
    $('cbi-toggle-mode')?.addEventListener('change', () => {
      box.toggleMode = $('cbi-toggle-mode').value;
      State.autoSave();
    });

    // Item
    $('cbi-item-id')?.addEventListener('change', () => {
      box.itemId = $('cbi-item-id').value;
      State.autoSave();
    });
    $('cbi-item-count')?.addEventListener('change', () => {
      box.itemCount = Math.max(1, parseInt($('cbi-item-count').value) || 1);
      State.autoSave();
    });

    // Flag
    const updateFlag = () => {
      const fName = $('cbi-flag-name')?.value || '';
      if (!fName) { box.setFlag = null; }
      else {
        box.setFlag = {
          flag: fName,
          operation: $('cbi-flag-op')?.value || 'set',
          value: $('cbi-flag-value')?.value || '',
        };
      }
      State.autoSave();
    };
    $('cbi-flag-name')?.addEventListener('change', updateFlag);
    $('cbi-flag-op')?.addEventListener('change', updateFlag);
    $('cbi-flag-value')?.addEventListener('input', updateFlag);

    // Sound
    $('cbi-sound-asset')?.addEventListener('change', () => {
      box.soundAssetId = $('cbi-sound-asset').value;
      State.autoSave();
    });
    $('cbi-sound-volume')?.addEventListener('input', () => {
      box.soundVolume = parseFloat($('cbi-sound-volume').value);
      const lbl = $('cbi-sound-volume-val');
      if (lbl) lbl.textContent = Math.round(box.soundVolume * 100) + '%';
      State.autoSave();
    });
    $('cbi-sound-test')?.addEventListener('click', () => {
      this._testPlaySound(box);
    });

    // Multiple actions
    $('cbi-add-chain-step')?.addEventListener('click', () => {
      State.pushUndo();
      if (!Array.isArray(box.actionChain)) box.actionChain = [];
      box.actionChain.push({ type: 'scene-change' });
      this.render(box);
      State.autoSave();
    });

    this.panelEl.querySelectorAll('.cbi-chain-row').forEach(row => {
      const idx = parseInt(row.dataset.idx);
      row.querySelector('.cbi-chain-type')?.addEventListener('change', (e) => {
        box.actionChain[idx] = { type: e.target.value };
        this.render(box);
        State.autoSave();
      });
      row.querySelector('.cbi-chain-del')?.addEventListener('click', () => {
        box.actionChain.splice(idx, 1);
        this.render(box);
        State.autoSave();
      });
      row.querySelectorAll('.cbi-chain-config').forEach(input => {
        input.addEventListener('change', () => {
          const key = input.dataset.key;
          let val = input.value;
          if (input.type === 'number') val = parseInt(val) || 0;
          box.actionChain[idx][key] = val;
          State.autoSave();
        });
      });
      row.querySelectorAll('.cbi-chain-config-flag').forEach(input => {
        input.addEventListener('change', () => {
          const key = input.dataset.key;
          if (!box.actionChain[idx].setFlag) box.actionChain[idx].setFlag = {};
          box.actionChain[idx].setFlag[key] = input.value;
          State.autoSave();
        });
      });
    });
  },

  _bindConditionRows(box) {
    this.panelEl.querySelectorAll('.cbi-cond-row').forEach(row => {
      const idx = parseInt(row.dataset.idx);
      row.querySelector('.cbi-cond-type')?.addEventListener('change', (e) => {
        box.conditions[idx] = { type: e.target.value };
        this.render(box);
        State.autoSave();
      });
      row.querySelector('.cbi-cond-del')?.addEventListener('click', () => {
        box.conditions.splice(idx, 1);
        this.render(box);
        State.autoSave();
      });
      row.querySelectorAll('.cbi-cond-field').forEach(input => {
        const handler = () => {
          const key = input.dataset.key;
          let val = input.value;
          if (input.type === 'number') val = parseFloat(val) || 0;
          box.conditions[idx][key] = val;
          State.autoSave();
        };
        input.addEventListener('change', handler);
        if (input.type === 'text') input.addEventListener('input', handler);
      });
    });
  },

  _testPlaySound(box) {
    if (!box.soundAssetId) {
      if (typeof Toast !== 'undefined') Toast.show('Select an audio asset first', 'warn');
      return;
    }
    const asset = (State.project.assets || []).find(a => a.id === box.soundAssetId);
    if (!asset) {
      if (typeof Toast !== 'undefined') Toast.show('Audio asset not found', 'error');
      return;
    }
    try {
      const audio = new Audio(asset.dataURL);
      audio.volume = box.soundVolume == null ? 0.8 : box.soundVolume;
      audio.play();
    } catch (e) {
      console.warn('Test play failed:', e);
    }
  },

  _normalizeColor(c) {
    if (!c) return '#7c5cfc';
    // Accept #rrggbb only for <input type=color>
    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
    // Try to map short hex
    if (/^#[0-9a-fA-F]{3}$/.test(c)) {
      return '#' + c.slice(1).split('').map(ch => ch + ch).join('');
    }
    return '#7c5cfc';
  },

  _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
