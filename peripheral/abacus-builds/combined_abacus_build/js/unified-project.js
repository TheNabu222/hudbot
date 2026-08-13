/* ===== UNIFIED ABACUS / CAVEBOT PROJECT BRIDGE =====
   Keeps the pure-HTML editor native while accepting Cavebot v2 and Hudbot saves. */
const UnifiedProject = {
  detectFormat(project) {
    if (!project || typeof project !== 'object') return 'unknown';
    if (project.schemaVersion === 2 || project.scenes?.some(scene => scene?.size)) return 'cavebot-v2';
    if (project.globalSettings || project.currentSceneId || project.uiMenus) return 'hudbot';
    return 'anzu';
  },

  interactionToAction(interaction) {
    const actions = {
      dialogue: 'start-dialogue',
      'start-dialogue': 'start-dialogue',
      scene_change: 'scene-change',
      'scene-change': 'scene-change',
      collect: 'give-item',
      give_item: 'give-item',
      'give-item': 'give-item',
      run_script: 'custom',
      custom_script: 'custom',
    };
    return actions[interaction] || 'none';
  },

  normalizeAsset(asset, index) {
    const source = asset?.source || {};
    const src = asset?.dataURL || asset?.src || source.url || source.dataRef || '';
    return {
      ...asset,
      id: asset?.id || `imported-asset-${index + 1}`,
      name: asset?.name || `Imported Asset ${index + 1}`,
      type: asset?.type || asset?.kind || 'image',
      src,
      dataURL: src,
      width: Number(asset?.width || asset?.dims?.w) || 100,
      height: Number(asset?.height || asset?.dims?.h) || 100,
    };
  },

  normalizeObject(object, index) {
    const transform = object?.transform || {};
    const interaction = object?.interaction || 'none';
    return {
      ...object,
      id: object?.id || `imported-object-${index + 1}`,
      name: object?.name || `Object ${index + 1}`,
      assetId: object?.assetId || object?._assetId || '',
      x: Number(object?.x ?? transform.x) || 0,
      y: Number(object?.y ?? transform.y) || 0,
      width: Number(object?.width ?? transform.w) || 100,
      height: Number(object?.height ?? transform.h) || 100,
      rotation: Number(object?.rotation ?? transform.rotation) || 0,
      zIndex: Number(object?.zIndex ?? transform.zIndex) || 0,
      opacity: object?.opacity ?? transform.opacity ?? 1,
      flipX: Boolean(object?.flipX ?? transform.flipX),
      flipY: Boolean(object?.flipY ?? transform.flipY),
      visible: object?.visible !== false && object?.hidden !== true,
      clickAction: object?.clickAction || this.interactionToAction(interaction),
      targetSceneId: object?.targetSceneId || (interaction === 'scene_change' ? object?.interactionData : '') || '',
      dialogueTreeId: object?.dialogueTreeId || (interaction === 'dialogue' ? object?.interactionData : '') || '',
      giveItemId: object?.giveItemId || (interaction === 'give_item' ? object?.interactionData : '') || '',
    };
  },

  normalizeScene(scene, index) {
    const size = scene?.size || {};
    return {
      ...scene,
      id: scene?.id || `imported-scene-${index + 1}`,
      name: scene?.name || `Scene ${index + 1}`,
      width: Number(scene?.width || size.w) || 800,
      height: Number(scene?.height || size.h) || 600,
      bgColor: scene?.bgColor || scene?.backgroundColor || 'transparent',
      objects: (scene?.objects || []).map((object, objectIndex) => this.normalizeObject(object, objectIndex)),
      hitboxes: Array.isArray(scene?.hitboxes) ? scene.hitboxes : [],
    };
  },

  factsToFlags(facts) {
    return (facts || []).map((fact, index) => ({
      ...fact,
      id: fact?.id || `imported-flag-${index + 1}`,
      name: fact?.name || fact?.key || fact?.label || `flag_${index + 1}`,
      type: fact?.type === 'bool' ? 'boolean' : fact?.type === 'enum' ? 'string' : fact?.type || 'boolean',
      defaultValue: fact?.defaultValue ?? fact?.default ?? false,
    }));
  },

  charactersToNPCs(characters) {
    return (characters || []).map(character => ({
      ...character,
      spriteAssetId: character?.spriteAssetId || character?.portraitAssetId || '',
      moodProfile: character?.moodProfile || { defaultMood: 'neutral', volatility: 0.2 },
      stats: character?.stats || { charm: 10, grit: 10, lore: 10 },
      startLocation: character?.startLocation || { sceneId: '', x: 100, y: 100 },
      schedule: character?.schedule || [],
      navWaypoints: character?.navWaypoints || [],
      relationships: character?.relationships && !Array.isArray(character.relationships)
        ? character.relationships
        : { Friendship: character?.defaultAffinity ?? 50, Romance: 0, Rivalry: 0 },
      gates: character?.gates || [],
    }));
  },

  questsToAnzu(quests) {
    return (quests || []).map(quest => ({
      ...quest,
      milestones: quest?.milestones || (quest?.objectives || []).map(objective => ({
        ...objective,
        text: objective?.text || objective?.description || 'Quest step',
        completed: false,
        branchFlag: '',
        socialRepDelta: 0,
        npcId: '',
      })),
      hidden: quest?.hidden ?? !quest?.autoStart,
      tracked: quest?.tracked !== false,
    }));
  },

  needsToAnzu(settings) {
    const needs = settings?.customNeeds;
    if (!Array.isArray(needs) || !needs.length) return null;
    return {
      enabled: settings?.enableNeeds !== false,
      decayEnabled: true,
      decayMultiplier: 1,
      warningThreshold: 25,
      needs: needs.map(need => ({
        ...need,
        key: need?.key || need?.id || 'need',
        label: need?.label || need?.key || 'Need',
        icon: need?.icon || '',
        color: need?.color || '#7c5cfc',
        defaultValue: need?.defaultValue ?? need?.default ?? 75,
        decayRate: need?.decayRate ?? need?.decayPerTick ?? 0,
        enabled: need?.enabled !== false,
      })),
    };
  },

  skillsToAnzu(settings) {
    const skills = settings?.customSkills;
    if (!Array.isArray(skills) || !skills.length) return null;
    return {
      enabled: true,
      xpPerLevel: 100,
      defaultDice: 'd20',
      skills: skills.map(skill => ({
        ...skill,
        key: skill?.key || skill?.id || 'skill',
        label: skill?.label || skill?.key || 'Skill',
        icon: skill?.icon || '',
        color: skill?.color || '#7c5cfc',
        defaultLevel: skill?.defaultLevel ?? skill?.default ?? 0,
        maxLevel: skill?.maxLevel ?? skill?.max ?? 100,
      })),
    };
  },

  toAnzu(raw) {
    const format = this.detectFormat(raw);
    if (format !== 'cavebot-v2') return this.ensureProjectData(raw, format);

    const scenes = (raw.scenes || []).map((scene, index) => this.normalizeScene(scene, index));
    const startSceneId = raw?.meta?.startSceneId || raw?.activeSceneId || scenes[0]?.id || null;
    const settings = raw.settings || {};
    const converted = {
      ...raw,
      _unifiedSourceFormat: 'cavebot-v2',
      _unifiedSourceSchemaVersion: raw.schemaVersion,
      canvasWidth: Number(raw.canvasWidth || settings.stageWidth || scenes[0]?.width) || 800,
      canvasHeight: Number(raw.canvasHeight || settings.stageHeight || scenes[0]?.height) || 600,
      scenes,
      assets: (raw.assets || []).map((asset, index) => this.normalizeAsset(asset, index)),
      activeSceneId: scenes.some(scene => scene.id === startSceneId) ? startSceneId : scenes[0]?.id || null,
      startSceneId,
      inventoryItems: raw.inventoryItems || raw.items || [],
      rpgNPCs: raw.rpgNPCs || this.charactersToNPCs(raw.characters),
      rpgQuests: raw.rpgQuests || this.questsToAnzu(raw.quests),
      flags: raw.flags || this.factsToFlags(raw.facts),
    };

    const importedNeeds = this.needsToAnzu(settings);
    const importedSkills = this.skillsToAnzu(settings);
    if (!converted.rpgNeeds && importedNeeds) converted.rpgNeeds = importedNeeds;
    if (!converted.rpgSkills && importedSkills) converted.rpgSkills = importedSkills;
    return this.ensureProjectData(converted, format);
  },

  ensureProjectData(project, format) {
    if (!project || typeof project !== 'object') return project;
    if (!project._unifiedSourceFormat) project._unifiedSourceFormat = format || this.detectFormat(project);
    if (!project.startSceneId) project.startSceneId = project.meta?.startSceneId || project.activeSceneId || project.scenes?.[0]?.id || null;
    if (!project.facts) project.facts = [];
    if (!project.conditionGroups) project.conditionGroups = [];
    if (!project.actions) project.actions = [];
    if (!project.eventRules) project.eventRules = [];
    if (!project.storyPhases) project.storyPhases = [];
    if (!project.characters) project.characters = [];
    if (!project.quests) project.quests = [];
    if (!project.items) project.items = [];
    return project;
  },

  toPortable(project) {
    const portable = JSON.parse(JSON.stringify(project));
    this.ensureProjectData(portable, portable._unifiedSourceFormat);
    portable.meta = { ...(portable.meta || {}), startSceneId: portable.startSceneId || portable.activeSceneId || null };
    portable.scenes = (portable.scenes || []).map(scene => ({
      ...scene,
      size: { w: scene.width || portable.canvasWidth || 800, h: scene.height || portable.canvasHeight || 600 },
      backgroundColor: scene.backgroundColor || scene.bgColor || 'transparent',
      objects: (scene.objects || []).map(object => ({
        ...object,
        transform: {
          x: object.x || 0,
          y: object.y || 0,
          w: object.width || 100,
          h: object.height || 100,
          rotation: object.rotation || 0,
          zIndex: object.zIndex || 0,
          opacity: object.opacity ?? 1,
          flipX: Boolean(object.flipX),
          flipY: Boolean(object.flipY),
        },
      })),
    }));
    portable.assets = (portable.assets || []).map(asset => ({
      ...asset,
      kind: asset.kind || asset.type || 'image',
      dims: { w: asset.width || 0, h: asset.height || 0 },
      source: asset.source || { mode: asset.src?.startsWith('data:') ? 'embedded' : 'linked', url: asset.src || asset.dataURL || '' },
    }));
    portable.items = portable.inventoryItems || portable.items || [];
    portable.characters = portable.rpgNPCs || portable.characters || [];
    portable.quests = portable.rpgQuests || portable.quests || [];
    portable.facts = (portable.flags || []).map(flag => ({
      ...flag,
      key: flag.key || flag.name,
      label: flag.label || flag.name,
      type: flag.type === 'boolean' ? 'bool' : flag.type,
      default: flag.defaultValue,
    }));
    return portable;
  },

  serialize(project) {
    return JSON.stringify(this.toPortable(project), null, 2);
  },
};
