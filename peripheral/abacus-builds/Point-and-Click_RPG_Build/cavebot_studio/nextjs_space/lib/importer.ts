/* ============================================================
   Import v1 (hudbot) JSON into v2 Project shape
   ============================================================ */
import type { Project, Scene, SceneObject, SceneObjectTransform, Asset, Character, DialogueTree, InventoryItem, CraftingRecipe, Quest, Faction, FastTravelMap, LoreEntry, Companion, Fact, NeedDefinition, SkillDefinition } from './types';
import { generateId, slugify, flagToKey } from './id-utils';

function normalizeObject(obj: any): SceneObject {
  const transform: SceneObjectTransform = {
    x: obj?.x ?? obj?.transform?.x ?? 0,
    y: obj?.y ?? obj?.transform?.y ?? 0,
    w: obj?.width ?? obj?.transform?.w ?? 100,
    h: obj?.height ?? obj?.transform?.h ?? 100,
    rotation: obj?.rotation ?? obj?.transform?.rotation ?? 0,
    zIndex: obj?.zIndex ?? obj?.transform?.zIndex ?? 0,
    opacity: obj?.opacity ?? obj?.transform?.opacity ?? 1,
    flipX: obj?.flipX ?? obj?.transform?.flipX ?? false,
    flipY: obj?.flipY ?? obj?.transform?.flipY ?? false,
  };
  return {
    id: obj?.id ?? generateId('obj'),
    name: obj?.name ?? 'Unnamed',
    assetId: obj?._assetId ?? obj?.assetId ?? null,
    src: obj?.src ?? '',
    characterId: obj?.characterId ?? null,
    transform,
    cursor: obj?.cursor ?? 'default',
    hidden: obj?.hidden ?? false,
    locked: obj?.locked ?? false,
    isHitbox: obj?.isHitbox ?? false,
    isText: obj?.isText ?? false,
    isScript: obj?.isScript ?? false,
    isVideo: obj?.isVideo ?? false,
    isUiElement: obj?.isUiElement ?? false,
    interaction: obj?.interaction === 'start-dialogue' ? 'dialogue' : (obj?.interaction ?? 'none'),
    interactionData: obj?.interactionData ?? null,
    dialogueTreeId: obj?.dialogueTreeId ?? null,
    giveItemId: obj?.giveItemId ?? null,
    showIfFlag: obj?.showIfFlag ?? null,
    hideIfFlag: obj?.hideIfFlag ?? null,
    conditions: obj?.conditions ?? [],
    conditionMode: obj?.conditionMode ?? 'all',
    clickResponses: (obj?.clickResponses ?? [])?.map?.((cr: any) => ({
      id: cr?.id ?? generateId('cr'),
      interaction: cr?.interaction ?? 'none',
      interactionData: cr?.interactionData ?? null,
      giveItemId: cr?.giveItemId ?? null,
      dialogueTreeId: cr?.dialogueTreeId ?? null,
      conditions: cr?.conditions ?? [],
      conditionMode: cr?.conditionMode ?? 'all',
      triggerOnce: cr?.triggerOnce ?? false,
      actionIds: [],
      whenCondGroupId: null,
    })) ?? [],
    triggerOnEnter: obj?.triggerOnEnter ?? false,
    triggerOnce: obj?.triggerOnce ?? false,
    flavorText: obj?.flavorText ?? '',
    needsEffect: obj?.needsEffect ?? undefined,
    reputationEffect: obj?.reputationEffect ?? undefined,
    blendMode: obj?.blendMode ?? 'normal',
    parallaxSpeed: obj?.parallaxSpeed ?? 0,
    filters: obj?.filters ?? undefined,
    animation: obj?.animation ?? undefined,
    animationDuration: obj?.animationDuration ?? undefined,
    textContent: obj?.textContent ?? '',
    textColor: obj?.textColor ?? '',
    textFontSize: obj?.textFontSize ?? 16,
    uiElementType: obj?.uiElementType ?? undefined,
    uiBindingType: obj?.uiBindingType ?? undefined,
    uiBindingId: obj?.uiBindingId ?? undefined,
    stretchToScreen: obj?.stretchToScreen ?? false,
  };
}

function normalizeScene(s: any): Scene {
  return {
    id: s?.id ?? generateId('scene'),
    name: s?.name ?? 'Untitled Scene',
    slug: slugify(s?.name ?? 'untitled'),
    size: { w: s?.width ?? 800, h: s?.height ?? 600 },
    backgroundColor: s?.backgroundColor ?? '#000000',
    bgmAssetId: s?.bgmAssetId ?? null,
    objects: (s?.objects ?? [])?.map?.(normalizeObject) ?? [],
    variants: [],
    isOpenByDefault: s?.isOpenByDefault,
    blocksClicks: s?.blocksClicks,
    closeOnClickOutside: s?.closeOnClickOutside,
  };
}

function normalizeAsset(a: any): Asset {
  return {
    id: a?.id ?? generateId('asset'),
    kind: a?.type ?? 'image',
    name: a?.name ?? 'unnamed',
    source: {
      mode: a?.exportSource === 'linked' ? 'linked' : a?.exportSource === 'github_inferred' ? 'repo' : 'embedded',
      url: a?.src ?? '',
      repoPath: a?.id?.startsWith?.('github:') ? a.id.replace('github:', '') : undefined,
    },
    dims: { w: a?.width ?? 0, h: a?.height ?? 0 },
    tags: a?.tags ?? [],
    category: a?.category ?? '',
  };
}

function extractFacts(gameFlags: string[]): Fact[] {
  return (gameFlags ?? [])?.map?.((flag: string, i: number) => ({
    id: generateId('fact'),
    key: flagToKey(flag),
    label: flag,
    type: 'bool' as const,
    default: false,
  })) ?? [];
}

function normalizeNeeds(settings: any): NeedDefinition[] {
  const defs = settings?.customNeedDefinitions ?? {};
  const needs = settings?.customNeeds ?? [];
  return needs?.map?.((n: any, i: number) => {
    const def = defs?.[n] ?? {};
    return {
      id: generateId('need'),
      key: slugify(n ?? `need_${i}`),
      label: n ?? `Need ${i + 1}`,
      min: def?.min ?? 0,
      max: def?.max ?? 100,
      default: def?.defaultValue ?? 100,
      decayPerTick: def?.decayRate ?? 1,
      showInHud: true,
    };
  }) ?? [];
}

function normalizeSkills(settings: any): SkillDefinition[] {
  const defs = settings?.customSkillDefinitions ?? {};
  const skills = settings?.customSkills ?? [];
  return skills?.map?.((s: any, i: number) => {
    const def = defs?.[s] ?? {};
    return {
      id: generateId('skill'),
      key: slugify(s ?? `skill_${i}`),
      label: s ?? `Skill ${i + 1}`,
      min: def?.min ?? 0,
      max: def?.max ?? 100,
      default: def?.defaultValue ?? 0,
      showInHud: false,
    };
  }) ?? [];
}

export function importV1Project(raw: any): Project {
  const gs = raw?.globalSettings ?? {};
  const facts = extractFacts(raw?.gameFlags ?? []);
  const needs = normalizeNeeds(gs);
  const skills = normalizeSkills(gs);

  const project: Project = {
    schemaVersion: 2,
    id: raw?.id ?? generateId('proj'),
    name: raw?.name ?? 'Imported Project',
    meta: {
      author: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startSceneId: raw?.currentSceneId ?? null,
    },
    scenes: (raw?.scenes ?? [])?.map?.(normalizeScene) ?? [],
    uiMenus: (raw?.uiMenus ?? [])?.map?.(normalizeScene) ?? [],
    assets: (raw?.assets ?? [])?.map?.(normalizeAsset) ?? [],
    characters: (raw?.characters ?? [])?.map?.((c: any) => ({
      id: c?.id ?? generateId('char'),
      name: c?.name ?? 'Unknown',
      slug: slugify(c?.name ?? 'unknown'),
      portraitAssetId: c?.portraitAssetId ?? null,
      factionId: c?.factionId ?? null,
      description: c?.description ?? '',
      relationshipTrackName: c?.relationshipTrackName ?? 'Affinity',
      defaultAffinity: c?.defaultAffinity ?? 50,
      thresholds: c?.thresholds ?? [],
      giftPreferences: c?.giftPreferences ?? [],
      relationships: c?.relationships ?? [],
    })) ?? [],
    factions: (raw?.factions ?? [])?.map?.((f: any) => ({
      id: f?.id ?? generateId('fac'),
      name: f?.name ?? 'Unnamed',
      description: f?.description ?? '',
      defaultAffinity: f?.defaultAffinity ?? 50,
      role: f?.role ?? '',
      reputationLabel: f?.reputationLabel ?? '',
      joinFlagId: f?.joinFlagId ?? null,
      allyFactionId: f?.allyFactionId ?? null,
      rivalFactionId: f?.rivalFactionId ?? null,
    })) ?? [],
    companions: (raw?.companions ?? [])?.map?.((c: any) => ({
      id: c?.id ?? generateId('comp'),
      name: c?.name ?? '',
      characterId: c?.characterId ?? null,
      assetId: c?.assetId ?? null,
      dialogueTreeId: c?.dialogueTreeId ?? null,
      requiredFlagId: c?.requiredFlagId ?? null,
      interjections: c?.interjections ?? [],
    })) ?? [],
    items: (raw?.inventoryItems ?? raw?.items ?? [])?.map?.((item: any) => ({
      id: item?.id ?? generateId('item'),
      name: item?.name ?? 'Unknown Item',
      description: item?.description ?? '',
      iconAssetId: item?.iconAssetId ?? null,
      category: item?.category ?? 'normal',
      stackable: item?.stackable ?? false,
      maxStack: item?.maxStack ?? 99,
      isUsable: item?.isUsable ?? false,
      consumeOnUse: item?.consumeOnUse ?? false,
      useMessage: item?.useMessage ?? '',
      statRestores: item?.statRestores ?? [],
      combinations: item?.combinations ?? [],
    })) ?? [],
    recipes: (raw?.craftingRecipes ?? raw?.recipes ?? [])?.map?.((r: any) => ({
      id: r?.id ?? generateId('recipe'),
      name: r?.name ?? 'Recipe',
      ingredient1Id: r?.ingredient1Id ?? null,
      ingredient2Id: r?.ingredient2Id ?? null,
      ingredient3Id: r?.ingredient3Id ?? null,
      resultItemId: r?.resultItemId ?? '',
      destroyIngredient1: r?.destroyIngredient1 ?? true,
      destroyIngredient2: r?.destroyIngredient2 ?? true,
      destroyIngredient3: r?.destroyIngredient3 ?? true,
      successMessage: r?.successMessage ?? '',
      requirements: r?.requirements ?? [],
      outcomes: r?.outcomes ?? [],
    })) ?? [],
    dialogueTrees: (raw?.dialogueTrees ?? [])?.map?.((dt: any) => ({
      id: dt?.id ?? generateId('dtree'),
      name: dt?.name ?? 'Untitled',
      startNodeId: dt?.startNodeId ?? null,
      nodes: (dt?.nodes ?? [])?.map?.((n: any) => ({
        id: n?.id ?? generateId('dnode'),
        speaker: n?.speaker ?? '',
        text: n?.text ?? '',
        choices: (n?.choices ?? [])?.map?.((ch: any) => ({
          id: ch?.id ?? generateId('dchoice'),
          text: ch?.text ?? '',
          nextNodeId: ch?.nextNodeId ?? null,
          requiredGameFlag: ch?.requiredGameFlag ?? null,
          setGameFlag: ch?.setGameFlag ?? null,
          startQuestId: ch?.startQuestId ?? null,
          completeQuestId: ch?.completeQuestId ?? null,
          giveItemId: ch?.giveItemId ?? null,
          consumeItemId: ch?.consumeItemId ?? null,
          changeSceneId: ch?.changeSceneId ?? null,
          grantSkillId: ch?.grantSkillId ?? null,
          grantSkillAmount: ch?.grantSkillAmount ?? 0,
          reputationEffect: ch?.reputationEffect ?? undefined,
          needsEffect: ch?.needsEffect ?? undefined,
          timeCost: ch?.timeCost ?? undefined,
          playSoundAssetId: ch?.playSoundAssetId ?? null,
        })) ?? [],
        speakerAssetId: n?.speakerAssetId ?? null,
        portraitPosition: n?.portraitPosition ?? 'left',
      })) ?? [],
    })) ?? [],
    quests: (raw?.quests ?? [])?.map?.((q: any) => ({
      id: q?.id ?? generateId('quest'),
      name: q?.name ?? 'Untitled Quest',
      description: q?.description ?? '',
      objectives: (q?.objectives ?? [])?.map?.((o: any) => ({
        id: o?.id ?? generateId('qobj'),
        type: o?.type ?? 'custom',
        targetId: o?.targetId ?? '',
        description: o?.description ?? '',
        requiredAmount: o?.requiredAmount ?? 1,
      })) ?? [],
      rewards: (q?.rewards ?? [])?.map?.((r: any) => ({
        type: r?.type ?? 'set_flag',
        targetId: r?.targetId ?? '',
        amount: r?.amount ?? 0,
      })) ?? [],
      autoStart: q?.autoStart ?? false,
    })) ?? [],
    maps: (raw?.maps ?? [])?.map?.((m: any) => ({
      id: m?.id ?? generateId('map'),
      name: m?.name ?? 'Map',
      backgroundSrc: m?.backgroundSrc ?? null,
      nodes: (m?.nodes ?? [])?.map?.((n: any) => ({
        id: n?.id ?? generateId('mnode'),
        name: n?.name ?? '',
        x: n?.x ?? 0,
        y: n?.y ?? 0,
        targetSceneId: n?.targetSceneId ?? null,
        iconSrc: n?.iconSrc ?? '',
        unlockedByDefault: n?.unlockedByDefault ?? true,
        requiredFlagId: n?.requiredFlagId ?? null,
      })) ?? [],
    })) ?? [],
    lore: (raw?.loreEntries ?? raw?.lore ?? [])?.map?.((l: any) => ({
      id: l?.id ?? generateId('lore'),
      title: l?.title ?? '',
      content: l?.content ?? '',
      category: l?.category ?? '',
      entryType: l?.entryType ?? 'lore',
      questId: l?.questId ?? null,
      requiredFlagId: l?.requiredFlagId ?? null,
    })) ?? [],
    facts,
    conditionGroups: [],
    actions: [],
    eventRules: [],
    storyPhases: [],
    settings: {
      stageWidth: gs?.stageWidth ?? 800,
      stageHeight: gs?.stageHeight ?? 600,
      gridSize: gs?.gridSize ?? 32,
      useDayNightCycle: gs?.useDayNightCycle ?? false,
      enableNeeds: gs?.enableNeeds ?? true,
      enableTTRPGStats: gs?.enableTTRPGStats ?? false,
      uiTheme: gs?.uiTheme ?? 'retro',
      uiColorPrimary: gs?.uiColorPrimary ?? '#fbff00',
      uiColorSecondary: gs?.uiColorSecondary ?? '#bc7f2a',
      uiColorBackground: gs?.uiColorBackground ?? '#6b6bff',
      uiFontFamily: gs?.uiFontFamily ?? "'Press Start 2P', monospace",
      uiBorderRadius: gs?.uiBorderRadius ?? 4,
      dialoguePosition: gs?.dialoguePosition ?? 'below',
      dialogueWidthPercent: gs?.dialogueWidthPercent ?? gs?.dialogueWidth ?? 86,
      dialogueTextSizePx: gs?.dialogueTextSizePx ?? gs?.dialogueTextSize ?? 8,
      typewriterSpeed: gs?.typewriterSpeed ?? 0,
      customNeeds: needs,
      customSkills: skills,
    },
    gameFlags: raw?.gameFlags ?? [],
    prefabs: raw?.prefabs ?? [],
  };
  return project;
}
