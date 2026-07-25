import { Project, Scene, StatTrackDefinition } from "../types";
import {
  inferGitHubAssetIdSrc,
  prepareProjectForExport,
} from "./projectPersistence";
import {
  compareRuleValue,
  evaluateRuleCondition,
  evaluateRuleConditions,
} from "./runtimeRules";

const DEFAULT_EXPORT_NEED_TRACKS: StatTrackDefinition[] = [
  { id: "rest", label: "Rest", defaultValue: 100, min: 0, max: 100, color: "#60a5fa", visibleInHud: true },
  { id: "hunger", label: "Hunger", defaultValue: 100, min: 0, max: 100, color: "#fb7185", visibleInHud: true },
  { id: "connection", label: "Connection", defaultValue: 100, min: 0, max: 100, color: "#facc15", visibleInHud: true },
  { id: "spiritual", label: "Spiritual", defaultValue: 100, min: 0, max: 100, color: "#a78bfa", visibleInHud: true },
  { id: "novelty", label: "Novelty", defaultValue: 100, min: 0, max: 100, color: "#34d399", visibleInHud: true },
];

const DEFAULT_EXPORT_SKILL_TRACKS: StatTrackDefinition[] = [
  { id: "naturalist", label: "Naturalist", defaultValue: 5, min: 0, max: 20, color: "#00ffcc", visibleInHud: true },
  { id: "occultist", label: "Occultist", defaultValue: 2, min: 0, max: 20, color: "#ff4fc8", visibleInHud: true },
  { id: "scribal", label: "Scribal", defaultValue: 8, min: 0, max: 20, color: "#facc15", visibleInHud: true },
];

type ExportTrackDefinition = StatTrackDefinition & { domId: string };

const trackDomId = (id: string) =>
  encodeURIComponent(id).replace(/%/g, "_").replace(/[()]/g, "_");

const normalizeExportTracks = (
  ids: string[] | undefined,
  definitions: Record<string, StatTrackDefinition> | undefined,
  fallback: StatTrackDefinition[],
  kind: "need" | "skill",
): ExportTrackDefinition[] => {
  const seen = new Set<string>();
  const sourceIds = ids?.length ? ids : Object.keys(definitions || {});
  const orderedIds = sourceIds.length ? sourceIds : fallback.map((track) => track.id);

  return orderedIds.map((id) => {
    const definition = definitions?.[id];
    const fallbackTrack = fallback.find((track) => track.id === id);
    const normalizedId = definition?.id || fallbackTrack?.id || id;
    seen.add(normalizedId);
    return {
      id: normalizedId,
      label: definition?.label || fallbackTrack?.label || normalizedId,
      defaultValue:
        definition?.defaultValue ??
        fallbackTrack?.defaultValue ??
        (kind === "need" ? 100 : 0),
      min: definition?.min ?? fallbackTrack?.min ?? 0,
      max: definition?.max ?? fallbackTrack?.max ?? (kind === "need" ? 100 : 20),
      color:
        definition?.color ||
        fallbackTrack?.color ||
        (kind === "need" ? "#4ade80" : "#00ffcc"),
      visibleInHud: definition?.visibleInHud ?? fallbackTrack?.visibleInHud ?? true,
      domId: trackDomId(normalizedId),
    };
  }).concat(
    Object.entries(definitions || {})
      .filter(([id, definition]) => !seen.has(definition.id || id))
      .map(([id, definition]) => {
        const normalizedId = definition.id || id;
        return {
          id: normalizedId,
          label: definition.label || normalizedId,
          defaultValue: definition.defaultValue ?? (kind === "need" ? 100 : 0),
          min: definition.min ?? 0,
          max: definition.max ?? (kind === "need" ? 100 : 20),
          color: definition.color || (kind === "need" ? "#4ade80" : "#00ffcc"),
          visibleInHud: definition.visibleInHud ?? true,
          domId: trackDomId(normalizedId),
        };
      }),
  );
};

const jsonForInlineScript = (value: unknown) =>
  JSON.stringify(value)
    .split("</script>")
    .join("<\\/script>")
    .split("</SCRIPT>")
    .join("<\\/script>");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function generateExportHtml(sourceProject: Project): string {
  const project = prepareProjectForExport(sourceProject, {
    assetScope: "used",
    includeEmbeddedAssetData: "fallback",
  });

  const scene = project.scenes.find((s) => s.id === project.currentSceneId) ||
    project.scenes[0] || {
      id: "fallback",
      name: "Fallback",
      width: 800,
      height: 600,
      backgroundColor: "#000",
      objects: [],
    };

  const exportWidth = scene.width || project.globalSettings?.stageWidth || 800;
  const exportHeight =
    scene.height || project.globalSettings?.stageHeight || 600;
  const dialogueTextSize = project.globalSettings?.dialogueTextSizePx ?? 14;
  const dialogueChoiceTextSize =
    project.globalSettings?.dialogueChoiceTextSizePx ?? 13;
  const dialoguePortraitSize = project.globalSettings?.dialoguePortraitSizePx ?? 64;
  const exportSaveKey = `neocities_game_save_${project.id}_${Date.now().toString(36)}`;
  const dialogueTitleSize = Math.max(11, dialogueTextSize - 1);
  const needTracks = normalizeExportTracks(
    project.globalSettings?.customNeeds,
    project.globalSettings?.customNeedDefinitions,
    DEFAULT_EXPORT_NEED_TRACKS,
    "need",
  );
  const skillTracks = normalizeExportTracks(
    project.globalSettings?.customSkills,
    project.globalSettings?.customSkillDefinitions,
    DEFAULT_EXPORT_SKILL_TRACKS,
    "skill",
  );

  // Calculate the total bounding box for scaling
  let boundMinX = 0;
  let boundMinY = 0;
  let boundMaxX = exportWidth;
  let boundMaxY = exportHeight;

  if (project.uiMenus) {
    project.uiMenus.forEach((menu) => {
      if (menu.isOpenByDefault) {
        const mw = menu.width || exportWidth;
        const mh = menu.height || exportHeight;
        const mLeft = (exportWidth / 2) - (mw / 2);
        const mTop = (exportHeight / 2) - (mh / 2);
        
        if (mLeft < boundMinX) boundMinX = mLeft;
        if (mTop < boundMinY) boundMinY = mTop;
        if (mLeft + mw > boundMaxX) boundMaxX = mLeft + mw;
        if (mTop + mh > boundMaxY) boundMaxY = mTop + mh;
      }
    });
  }

  if (project.globalSettings?.hudOverlay) {
    const overlay = project.globalSettings.hudOverlay;
    if (overlay.assetId) {
      if (0 < boundMinX) boundMinX = 0;
      if (0 < boundMinY) boundMinY = 0;
      if (exportWidth > boundMaxX) boundMaxX = exportWidth;
      if (exportHeight > boundMaxY) boundMaxY = exportHeight;
    }
  }

  const boundW = boundMaxX - boundMinX;
  const boundH = boundMaxY - boundMinY;
  const offsetX = -boundMinX;
  const offsetY = -boundMinY;
  const deviceFrame = project.globalSettings?.deviceFrame;
  const deviceFrameAsset = deviceFrame
    ? project.assets.find((asset) => asset.id === deviceFrame.assetId)
    : undefined;
  const hasDeviceFrame = !!(deviceFrame && deviceFrameAsset);
  const layoutWidth = hasDeviceFrame ? deviceFrame.outerWidth : boundW;
  const layoutHeight = hasDeviceFrame ? deviceFrame.outerHeight : boundH;
  const deviceFrameScreenInset = 0;
  const deviceFrameAperture = hasDeviceFrame
    ? {
        x: deviceFrame.screen.x + deviceFrameScreenInset,
        y: deviceFrame.screen.y + deviceFrameScreenInset,
        width: Math.max(1, deviceFrame.screen.width - deviceFrameScreenInset * 2),
        height: Math.max(1, deviceFrame.screen.height - deviceFrameScreenInset * 2),
      }
    : null;
  const deviceScreenScaleX = hasDeviceFrame
    ? deviceFrameAperture!.width / exportWidth
    : 1;
  const deviceScreenScaleY = hasDeviceFrame
    ? deviceFrameAperture!.height / exportHeight
    : 1;
  const deviceScreenLeft = hasDeviceFrame
    ? deviceFrameAperture!.x
    : offsetX;
  const deviceScreenTop = hasDeviceFrame
    ? deviceFrameAperture!.y
    : offsetY;

  const css = `
    :root {
      --time-filter: brightness(1) sepia(0) hue-rotate(0deg);
    }
    .animated-cursor-active #game-positioner,
    .animated-cursor-active #game-positioner * {
      cursor: none !important;
    }
    #animated-game-cursor {
      position: fixed;
      left: 0;
      top: 0;
      width: 40px;
      height: 40px;
      object-fit: contain;
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transform: translate3d(-100px, -100px, 0);
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.65));
    }
    .map-node-icon {
      opacity: 0.45;
      transition: opacity 0.16s ease, transform 0.16s ease;
    }
    .map-node-label {
      opacity: 0;
      transition: opacity 0.16s ease;
      pointer-events: none;
    }
    .map-travel-node:hover .map-node-icon,
    .map-travel-node:focus-visible .map-node-icon {
      opacity: 0.95;
      transform: scale(1.05);
    }
    .map-travel-node:hover .map-node-label,
    .map-travel-node:focus-visible .map-node-label {
      opacity: 1;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #1a1a1a;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      min-height: 100vh;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      color: #f5f5f5;
    }
    #scale-wrapper {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: #1a1a1a;
    }
    #game-layout-resizer {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    #game-positioner {
      position: absolute;
      left: 50%;
      top: 50%;
      width: ${layoutWidth}px;
      height: ${layoutHeight}px;
      transform: translate(-50%, -50%) scale(1);
      transform-origin: center center;
      will-change: transform;
    }
    #game-container {
      position: relative;
      width: ${exportWidth}px;
      height: ${exportHeight}px;
      /* background-color handles inside scene divs */
      background-color: #000;
      overflow: hidden;
      filter: var(--time-filter);
      transition: filter 2s ease;
    }
    .scene-object {
      position: absolute;
      user-select: none;
      transform-origin: center center;
      touch-action: none;
      background-color: rgba(255, 255, 255, 0.01);
      pointer-events: auto;
    }
    .hitbox {
      /* Invisible in production, but needs slight opacity for Safari/iOS click detection */
      background-color: rgba(255, 255, 255, 0.01);
      border: none;
    }
    /* Animations */
    @keyframes wiggle {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(-5deg); }
      50% { transform: rotate(0deg); }
      75% { transform: rotate(5deg); }
      100% { transform: rotate(0deg); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    @keyframes glow {
      0%, 100% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
      50% { filter: drop-shadow(0 0 20px rgba(255,255,255,1)); }
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      60% { transform: translateY(-10px); }
    }

    @keyframes fade {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }

    @keyframes slide-in {
      0%, 100% { transform: translateX(-50px); opacity: 0; }
      20%, 80% { transform: translateX(0); opacity: 1; }
    }

    @keyframes slide-up {
      0%, 100% { transform: translateY(50px); opacity: 0; }
      20%, 80% { transform: translateY(0); opacity: 1; }
    }

    @keyframes slide-down {
      0%, 100% { transform: translateY(-50px); opacity: 0; }
      20%, 80% { transform: translateY(0); opacity: 1; }
    }

    @keyframes zoom {
      0%, 100% { transform: scale(0.5); opacity: 0; }
      50% { transform: scale(1); opacity: 1; }
    }

    /* UI Overlay */
    #ui-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10000;
      /* allow overflowing outside of game container */
      overflow: visible;
    }
    
    /* UI Variables */
    :root {
      --ui-bg: ${project.globalSettings?.uiColorBackground || "#171717"};
      --ui-bg-alpha: color-mix(in srgb, var(--ui-bg) 93%, transparent);
      --ui-primary: ${project.globalSettings?.uiColorPrimary || "#10b981"};
      --ui-primary-half: color-mix(in srgb, var(--ui-primary) 50%, transparent);
      --ui-primary-glow: color-mix(in srgb, var(--ui-primary) 40%, transparent);
      --ui-primary-border: color-mix(in srgb, var(--ui-primary) 80%, transparent);
      --ui-primary-choice: color-mix(in srgb, var(--ui-primary) 30%, transparent);
      --ui-primary-hover: color-mix(in srgb, var(--ui-primary) 20%, transparent);
      --ui-font: ${project.globalSettings?.uiFontFamily || "sans-serif"};
      --ui-radius: ${project.globalSettings?.uiBorderRadius ?? 8}px;
    }

    #dialogue-box {
      display: none;
      ${(() => {
        const dPos = project.globalSettings?.dialoguePosition || "bottom";
        const wPct = project.globalSettings?.dialogueWidthPercent ?? 91.666;
        const maxWPx = project.globalSettings?.dialogueMaxWidthPx ?? 672;
        const cappedWidth = `min(${maxWPx}px, calc(100% - 24px))`;
        if (dPos === "top") return `position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: ${wPct}%; max-width: ${cappedWidth};`;
        if (dPos === "center") return `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${wPct}%; max-width: ${cappedWidth};`;
        if (dPos === "below") return `position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: ${wPct}%; max-width: ${cappedWidth};`;
        return `position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: ${wPct}%; max-width: ${cappedWidth};`;
      })()}
      ${(() => {
        const dPos = project.globalSettings?.dialoguePosition || "bottom";
        const heightPct = project.globalSettings?.dialogueMaxHeightPercent ?? 90;
        return dPos === "top" || dPos === "bottom" || dPos === "below"
          ? `max-height: min(${heightPct}%, calc(100% - 16px));`
          : `max-height: ${heightPct}%;`;
      })()}
      background-color: var(--ui-bg-alpha);
      color: #f5f5f5;
      padding: 0;
      border-radius: var(--ui-radius);
      border: 2px solid var(--ui-primary-border);
      font-family: var(--ui-font);
      pointer-events: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px var(--ui-primary-glow);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      filter: drop-shadow(0 25px 25px rgb(0 0 0 / 0.15));
      overflow: hidden;
      z-index: 20000;
      flex-direction: column;
      flex-shrink: 0;
      min-height: 0;
    }
    
    .dialogue-title {
      padding: 10px 20px;
      border-bottom: 1px solid var(--ui-primary-half);
      font-weight: bold;
	      font-size: ${dialogueTitleSize}px;
      letter-spacing: 0.05em;
      background-color: rgba(0,0,0,0.3);
      color: var(--ui-primary);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      flex-shrink: 0;
    }
    .dialogue-content {
      display: flex;
      padding: 16px;
      overflow-y: auto;
      flex: 1 1 auto;
      min-height: 0;
    }
    .dialogue-portrait {
	      width: ${dialoguePortraitSize}px;
	      height: ${dialoguePortraitSize}px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--ui-primary-glow);
      background-color: rgba(0,0,0,0.4);
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
    }
    .dialogue-portrait.left { margin-right: 16px; }
    .dialogue-portrait.right { margin-left: 16px; }
    .dialogue-portrait img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .dialogue-text-container {
	      font-size: ${dialogueTextSize}px;
      font-weight: 500;
      line-height: 1.45;
	      flex: 1;
	      min-width: 0;
	      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
      align-self: stretch;
      overflow-y: auto;
      max-height: 100%;
	      min-height: 0;
	      overflow-wrap: anywhere;
	    }
    .dialogue-choices {
      display: flex;
      flex-direction: column;
      width: 100%;
      border-top: 1px solid var(--ui-primary-half);
      background-color: rgba(0,0,0,0.2);
      position: relative;
      flex-shrink: 0;
      max-height: 34%;
      overflow-y: auto;
    }
    .dialogue-choice {
      display: block;
      width: 100%;
      text-align: left;
      background: transparent;
      color: white;
      border: none;
	      padding: 10px 16px;
      border-bottom: 1px solid var(--ui-primary-choice);
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
      font-family: inherit;
	      font-size: ${dialogueChoiceTextSize}px;
	      font-weight: 500;
	      overflow-wrap: anywhere;
	    }
    .dialogue-choice:last-child {
      border-bottom: none;
    }
    .dialogue-choice:hover {
      background-color: var(--ui-primary-hover);
    }

    #dialogue-box.simple-dialogue {
	      width: ${project.globalSettings?.dialogueWidthPercent ?? 91.666}%;
	      max-width: min(${project.globalSettings?.dialogueMaxWidthPx ?? 672}px, calc(100% - 24px));
	      cursor: pointer;
	      transition: transform 0.2s;
    }
    #dialogue-box.simple-dialogue:hover {
      transform: translateX(-50%) scale(1.02);
    }
    .simple-dialogue-text {
      padding: 14px;
      text-align: center;
      line-height: 1.45;
	      font-weight: 500;
	      font-size: ${dialogueTextSize}px;
	      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
      overflow-y: auto;
	      min-height: 0;
	      overflow-wrap: anywhere;
	    }
    .simple-dialogue-continue {
      padding: 8px 16px;
      opacity: 0.5;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-align: center;
      border-top: 1px solid var(--ui-primary-glow);
      margin-top: 8px;
    }

    /* Inventory UI */
    #inv-toggle-btn {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      background-color: color-mix(in srgb, var(--ui-bg) 95%, transparent);
      border: 2px solid var(--ui-primary);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      transition: transform 0.1s;
      z-index: 20000;
    }
    #inv-toggle-btn:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }
    #inv-toggle-btn:active {
      transform: scale(0.95);
    }
    #quest-toggle-btn {
      position: absolute;
      bottom: 86px;
      right: 20px;
      width: 56px;
      height: 56px;
      background-color: color-mix(in srgb, var(--ui-bg) 95%, transparent);
      border: 2px solid var(--ui-primary);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      transition: transform 0.1s;
      z-index: 20000;
    }
    #quest-toggle-btn:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }
    #quest-toggle-btn:active {
      transform: scale(0.95);
    }
    .inv-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      color: white;
      font-size: 10px;
      font-weight: bold;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--ui-primary);
      border: 2px solid var(--ui-bg);
      display: none;
    }
    #inventory-overlay {
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      pointer-events: auto;
      align-items: stretch;
      justify-content: stretch;
      padding: 6%;
      backdrop-filter: blur(4px);
      z-index: 20001;
    }
    .runtime-screen-overlay {
      position: absolute;
      inset: 0;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: auto;
    }
    .runtime-screen-overlay .inventory-box {
      width: 100%;
      height: 100%;
      max-height: 100%;
      max-width: 100%;
      min-height: 0;
      min-width: 0;
    }
    .runtime-screen-overlay .inventory-content {
      min-height: 0;
    }
    .inventory-box {
      width: 100%;
      max-width: 768px;
      max-height: 80%;
      background-color: color-mix(in srgb, var(--ui-bg) 95%, transparent);
      border: 2px solid color-mix(in srgb, var(--ui-primary) 50%, transparent);
      border-radius: var(--ui-radius);
      font-family: var(--ui-font);
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .inventory-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: rgba(0,0,0,0.3);
      border-bottom: 1px solid color-mix(in srgb, var(--ui-primary) 50%, transparent);
      color: var(--ui-primary);
    }
    .inventory-header h2 {
      margin: 0;
      font-size: 17px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--ui-primary);
      cursor: pointer;
      opacity: 0.7;
      padding: 4px;
    }
    .close-btn:hover {
      opacity: 1;
    }
    .inventory-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      color: #e5e5e5;
    }
    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .inventory-item {
      border: 1px solid color-mix(in srgb, var(--ui-primary) 40%, transparent);
      background-color: rgba(0,0,0,0.2);
      border-radius: var(--ui-radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.2s;
    }
    .inventory-item:hover {
      border-color: var(--ui-primary);
      background-color: rgba(0,0,0,0.4);
    }
    .inventory-item-icon {
      aspect-ratio: 1;
      background-color: rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .inventory-item-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
      transition: transform 0.2s;
    }
    .inventory-item:hover .inventory-item-icon img {
      transform: scale(1.1);
    }
    .inventory-item-info {
      padding: 12px;
      border-top: 1px solid color-mix(in srgb, var(--ui-primary) 20%, transparent);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .inventory-item-name {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: bold;
      color: var(--ui-primary);
    }
    .inventory-item-desc {
      margin: 0;
      font-size: 10px;
      color: #a1a1aa;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .inventory-empty {
      text-align: center;
      padding: 48px 0;
      color: color-mix(in srgb, var(--ui-primary) 80%, transparent);
      opacity: 0.8;
    }

    #needs-tracker {
      display: ${project.globalSettings?.enableNeeds ? "block" : "none"};
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px;
      border: 1px solid #555;
      font-size: 12px;
      pointer-events: auto;
      z-index: 20000;
    }
    #skills-tracker {
      display: ${project.globalSettings?.enableTTRPGStats ? "block" : "none"};
      position: absolute;
      top: 10px;
      right: ${project.globalSettings?.enableNeeds ? "140px" : "10px"};
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px;
      border: 1px solid #555;
      font-size: 12px;
      pointer-events: auto;
      z-index: 20000;
    }
    #time-tracker {
      display: ${project.globalSettings?.useDayNightCycle ? "block" : "none"};
      position: absolute;
      top: ${project.globalSettings?.enableNeeds || project.globalSettings?.enableTTRPGStats ? "180px" : "10px"};
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px;
      border: 1px solid #555;
      font-size: 12px;
      pointer-events: auto;
      z-index: 20000;
    }
    .need-bar {
      width: 100px; height: 8px; background: #333; margin-top: 2px; margin-bottom: 6px;
    }
    .need-fill {
      height: 100%; background: #4ade80; transition: width 0.3s;
    }
    .ui-smart-region {
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border: 2px dashed currentColor;
      overflow: hidden;
      pointer-events: none;
    }
    .ui-smart-region--inventory {
      display: grid;
    }
    .ui-smart-region__slot {
      min-width: 0;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.32);
      overflow: hidden;
    }
    .ui-smart-region__slot img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .ui-smart-region__slot span {
      color: rgba(255,255,255,0.74);
      font-weight: 900;
      text-transform: uppercase;
    }
    .ui-smart-region__empty {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 8px;
      color: rgba(255,255,255,0.72);
      text-align: center;
      font-weight: 800;
    }
    .ui-smart-region--text {
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .ui-smart-region--text article {
      display: block;
      margin: 0 0 0.75em;
    }
    .ui-smart-region--text strong {
      display: block;
      margin-bottom: 0.2em;
      color: currentColor;
      font-weight: 900;
    }
    .ui-smart-region--text p {
      margin: 0;
      color: rgba(255,255,255,0.86);
    }
    .ui-smart-region--stats {
      display: grid;
      align-content: start;
      gap: 6px;
    }
    .ui-smart-region__meter {
      display: grid;
      grid-template-columns: minmax(4rem, max-content) minmax(4rem, 1fr);
      align-items: center;
      gap: 8px;
    }
    .ui-smart-region__meter span {
      overflow: hidden;
      color: rgba(255,255,255,0.9);
      font-weight: 850;
      text-overflow: ellipsis;
      text-transform: capitalize;
      white-space: nowrap;
    }
    .ui-smart-region__meter i {
      display: block;
      height: 7px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(0,0,0,0.4);
    }
    .ui-smart-region__meter b {
      display: block;
      height: 100%;
    }

    #flavor-text {
      position: absolute;
      pointer-events: none;
      color: white;
      background: rgba(0,0,0,0.6);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.2s;
      transform: translate(-50%, -100%);
      margin-top: -10px;
      white-space: nowrap;
      z-index: 20000;
    }
  `;

  const hasCursorAsset = (assetId?: string) =>
    Boolean(
      assetId &&
        ((project.assets || []).some(
          (asset) => asset.id === assetId && (asset.src || asset.dataURL),
        ) ||
          inferGitHubAssetIdSrc(assetId)),
    );

  const resolveAssetSrc = (
    asset: { src?: string; dataURL?: string } | undefined,
    fallback = "",
  ) => {
    if (!asset) return fallback || "";
    if (asset.src && !asset.src.startsWith("data:")) return asset.src;
    return asset.dataURL || asset.src || fallback || "";
  };

  const getObjectHtml = (obj: any) => {
    let animStyle = "";
    if (obj.animation === "glow") {
      animStyle = "filter: drop-shadow(0 0 15px rgba(255,255,255,0.8));";
    } else if (obj.animation !== "none") {
      const duration =
        obj.animationDuration ||
        (obj.animation === "pulse" ? 2 : obj.animation === "float" ? 3 : 0.5);
      const easing = obj.animationEasing || "ease-in-out";
      animStyle = `animation: ${obj.animation} ${duration}s ${easing} infinite;`;
    }

    const hasPrimaryInteraction =
      Boolean(obj.interaction) && obj.interaction !== "none";
    const hasClickResponses =
      Array.isArray(obj.clickResponses) && obj.clickResponses.length > 0;
    const hasInteractiveUiRole =
      obj.isUiElement &&
      (obj.uiElementType === "button" || obj.uiElementType === "toggle");
    const shouldReceiveClicks =
      !obj.ignoreClicks &&
      (obj.isHitbox ||
        hasPrimaryInteraction ||
        hasClickResponses ||
        hasInteractiveUiRole);
    const peStr = shouldReceiveClicks
      ? "pointer-events: auto; touch-action: manipulation;"
      : "pointer-events: none;";
    const leftValue = obj.stretchToScreen ? "0" : `${obj.x}px`;
    const topValue = obj.stretchToScreen ? "0" : `${obj.y}px`;
    const widthValue = obj.stretchToScreen ? "100%" : `${obj.width}px`;
    const heightValue = obj.stretchToScreen ? "100%" : `${obj.height}px`;

    const style = `
      left: ${leftValue};
      top: ${topValue};
      width: ${widthValue};
      height: ${heightValue};
      z-index: ${obj.zIndex ?? 100};
      opacity: ${obj.opacity === 0 ? 0.01 : (obj.opacity ?? 1)};
      transform: rotate(${obj.rotation || 0}deg);
      cursor: ${hasCursorAsset(obj.cursorAssetId) ? "none" : obj.cursor || "pointer"};
      mix-blend-mode: ${obj.blendMode || "normal"};
      ${peStr}
      ${animStyle}
    `;

    const classes = ["scene-object"];
    if (obj.isHitbox || obj.opacity === 0) classes.push("hitbox");
    if (obj.customCssClasses) classes.push(obj.customCssClasses);

    const dataAttrs = `
      data-interaction="${obj.interaction}"
      data-object-name="${(obj.name || "").replace(/"/g, "&quot;")}"
      data-object-asset-id="${obj._assetId || ""}"
      data-interaction-data="${(obj.interactionData || "").replace(/"/g, "&quot;")}"
      data-audio-src="${obj.audioSrc || ""}"
      data-give-item="${obj.giveItemId || ""}"
      data-target-ui="${obj.targetUiId || ""}"
      data-dialogue-tree="${obj.dialogueTreeId || ""}"
      data-flavor="${(obj.flavorText || "").replace(/"/g, "&quot;")}"
      data-parallax="${obj.parallaxSpeed}"
      data-rotation="${obj.rotation || 0}"
      data-needs="${JSON.stringify(obj.needsEffect || {}).replace(/"/g, "&quot;")}"
      data-skill="${obj.requiredSkill || "none"}"
      data-difficulty="${obj.skillCheckDifficulty || 0}"
      data-grant-skill="${obj.grantSkill || "none"}"
      data-grant-skill-val="${obj.grantSkillValue || 0}"
      data-time-cost="${obj.timeCost || 0}"
      data-reputation-target="${(obj.reputationEffect?.npcId || obj.characterId || obj.affinityId || "").replace(/"/g, "&quot;")}"
      data-reputation-val="${obj.reputationEffect?.value || 0}"
      data-script-src="${obj.scriptAssetId ? resolveAssetSrc((project.assets || []).find((a) => a.id === obj.scriptAssetId)) : ""}"
      data-ui-binding="${obj.uiBindingType || ""}"
      data-ui-binding-id="${obj.uiBindingId || ""}"
      data-ui-element-type="${obj.uiElementType || ""}"
      data-ui-grid-columns="${obj.uiGridColumns || ""}"
      data-ui-grid-rows="${obj.uiGridRows || ""}"
      data-ui-grid-gap="${obj.uiGridGap ?? ""}"
      data-ui-padding="${obj.uiPadding ?? ""}"
      data-ui-empty-text="${(obj.uiEmptyText || "").replace(/"/g, "&quot;")}"
      data-ui-text-source="${obj.uiTextSource || ""}"
      data-local-checked="${!!obj.uiChecked}"
      data-ui-primary="${obj.uiColorPrimary || ""}"
      data-ui-secondary="${obj.uiColorSecondary || ""}"
      data-show-flag="${(obj.showIfFlag || "").replace(/"/g, "&quot;")}"
      data-hide-flag="${(obj.hideIfFlag || "").replace(/"/g, "&quot;")}"
      data-rule-conditions="${encodeURIComponent(JSON.stringify(obj.conditions || []))}"
      data-rule-condition-mode="${obj.conditionMode || "all"}"
      data-rule-once="${!!obj.triggerOnce}"
      data-click-responses="${encodeURIComponent(JSON.stringify(obj.clickResponses || []))}"
      data-cursor-asset="${obj.cursorAssetId || ""}"
    `;

    if (obj.isHitbox) {
      return `<div id="${obj.id}" onclick="void(0)" class="${classes.join(" ")}" style="${style}" ${dataAttrs}></div>`;
    } else if (obj.isUiElement) {
      const borderStyle =
        obj.uiBorderType === "none"
          ? "none"
          : obj.uiBorderType === "double"
            ? "4px double"
            : obj.uiBorderType === "bevel"
              ? "3px outset"
              : obj.uiBorderType === "dashed"
                ? "2px dashed"
                : obj.uiBorderType === "dotted"
                  ? "2px dotted"
                  : obj.uiBorderType === "inset"
                    ? "3px inset"
                    : obj.uiBorderType === "groove"
                      ? "3px groove"
                      : obj.uiBorderType === "ridge"
                        ? "3px ridge"
                        : "2px solid";
      const br =
        obj.uiBorderRadius ?? project.globalSettings?.uiBorderRadius ?? 8;
      let innerHtml = "";
      if (obj.uiElementType === "inventory_grid") {
        const columns = Math.max(1, obj.uiGridColumns || 4);
        const rows = Math.max(1, obj.uiGridRows || 3);
        const gap = obj.uiGridGap ?? 8;
        const padding = obj.uiPadding ?? 10;
        innerHtml = `<div class="ui-smart-region ui-smart-region--inventory" style="border-color:${obj.uiColorPrimary || "var(--ui-primary)"}; background-color:${obj.uiColorSecondary || "rgba(0,0,0,0.68)"}; padding:${padding}px; grid-template-columns:repeat(${columns}, minmax(0, 1fr)); gap:${gap}px;"></div>`;
      } else if (obj.uiElementType === "journal_text" || obj.uiElementType === "quest_list") {
        const padding = obj.uiPadding ?? 14;
        innerHtml = `<div class="ui-smart-region ui-smart-region--text" style="border-color:${obj.uiColorPrimary || "var(--ui-primary)"}; background-color:${obj.uiColorSecondary || "rgba(0,0,0,0.68)"}; color:${obj.textColor || obj.uiColorPrimary || "var(--ui-primary)"}; font-family:${obj.textFontFamily || project.globalSettings?.uiFontFamily || "sans-serif"}; font-size:${obj.textFontSize || 14}px; line-height:${obj.textLineHeight || 1.35}; padding:${padding}px;"></div>`;
      } else if (obj.uiElementType === "stat_list") {
        const padding = obj.uiPadding ?? 10;
        innerHtml = `<div class="ui-smart-region ui-smart-region--stats" style="border-color:${obj.uiColorPrimary || "var(--ui-primary)"}; background-color:${obj.uiColorSecondary || "rgba(0,0,0,0.68)"}; color:${obj.textColor || obj.uiColorPrimary || "var(--ui-primary)"}; font-family:${obj.textFontFamily || project.globalSettings?.uiFontFamily || "sans-serif"}; font-size:${obj.textFontSize || 12}px; padding:${padding}px;"></div>`;
      } else if (obj.uiElementType === "panel") {
        innerHtml = `<div style="width: 100%; height: 100%; pointer-events: none; background-color: ${obj.uiColorSecondary || "#171717"}; border: ${borderStyle} ${obj.uiColorPrimary || "#10b981"}; border-radius: ${br}px;"></div>`;
      } else if (obj.uiElementType === "progress") {
        innerHtml = `<div style="width: 100%; height: 100%; pointer-events: none; overflow: hidden; background-color: ${obj.uiColorSecondary || "#171717"}; border: ${borderStyle} ${obj.uiColorPrimary || "#10b981"}; border-radius: ${br}px;">
          <div style="height: 100%; width: ${Math.max(0, Math.min(100, obj.uiValue || 0))}%; background-color: ${obj.uiColorPrimary || "#10b981"}; transition: width 0.3s ease;"></div>
        </div>`;
      } else if (obj.uiElementType === "button") {
        innerHtml = `<div style="width: 100%; height: 100%; pointer-events: none; display: flex; align-items: center; justify-content: center; background-color: ${obj.uiColorPrimary || "#10b981"}; color: ${obj.uiColorSecondary || "#ffffff"}; border: ${borderStyle} color-mix(in srgb, ${obj.uiColorPrimary || "#10b981"} 80%, black); border-radius: ${br}px; font-family: ${project.globalSettings?.uiFontFamily || "sans-serif"}; font-size: ${obj.textFontSize || 16}px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          ${obj.textContent || "Button"}
        </div>`;
      } else if (obj.uiElementType === "icon") {
        const sz = Math.min(obj.width, obj.height);
        const iconCol = obj.uiColorPrimary || "#10b981";
        let svgHtml = "";
        if (obj.uiIconType === "bag")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>`;
        else if (obj.uiIconType === "sword")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 19-3 3"/><path d="m14 4-9 9"/><path d="M18 20c-1.1-.9-2-2-2-2L14 16l-4-4 2-2 4 4c0 0 1.1.9 2 2 .4.9 1 2 2 2 0 0 .1 0 .2.1C21.7 18.2 22 17 22 16s-.3-2.2-.8-2.1c-.1-.1-.1-.2-.2-.2-2 0-3.1-.6-4-1l-3.3-1.6c-.6-.3-1.3-.4-2-.2L9 11l-3 3-1-1 3-3-2-2L4 6 5 5l2 2 2 2 3-3 1 1-3 3 1.8 3.5c.2.6.3 1.3.2 2l-1.6 3.3c-.4.9-1 2-1 4 0 .1-.1.2-.2.2-1.1.5-2.3.2-2.3-.8S2.8 21 3.5 20c.1 0 .1.1.2.2 0 0 1.1.9 2.1 2z" opacity=".2"/><path d="M20 4 11 13"/><path d="m18 20-2-2"/><path d="m4 6 2 2"/></svg>`;
        else if (obj.uiIconType === "book")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`;
        else if (obj.uiIconType === "gear")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
        else if (obj.uiIconType === "potion")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 2v6"/><path d="M6 14v-2c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/></svg>`;
        else if (obj.uiIconType === "key")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`;
        else if (obj.uiIconType === "check")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        else if (obj.uiIconType === "cancel")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        else if (obj.uiIconType === "arrow-left")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
        else if (obj.uiIconType === "arrow-right")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        else if (obj.uiIconType === "arrow-up")
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
        else
          svgHtml = `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

        innerHtml = `<div style="width: 100%; height: 100%; pointer-events: none; display: flex; align-items: center; justify-content: center; color: ${iconCol};">${svgHtml}</div>`;
      } else if (obj.uiElementType === "toggle") {
        const checked = obj.uiChecked;
        const bg = checked
          ? obj.uiColorPrimary || "#10b981"
          : obj.uiColorSecondary || "#525252";
        const slide = checked ? obj.width - obj.height : 0;
        innerHtml = `<div style="width: 100%; height: 100%; pointer-events: none; border-radius: 9999px; background-color: ${bg}; padding: 4px; box-sizing: border-box; display: flex; align-items: center;">
          <div style="background-color: white; border-radius: 50%; height: 100%; aspect-ratio: 1; transform: translateX(${slide}px); transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
        </div>`;
      } else if (obj.uiElementType === "tooltip") {
        innerHtml = `<div style="width: 100%; height: 100%; pointer-events: none; display: flex; align-items: center; justify-content: center; padding: 8px; box-sizing: border-box; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative; background-color: ${obj.uiColorSecondary || "#171717"}; color: ${obj.uiColorPrimary || "#ffffff"}; border: 1px solid ${obj.uiColorPrimary || "#10b981"}; border-radius: ${br}px; font-family: ${project.globalSettings?.uiFontFamily || "sans-serif"}; font-size: ${obj.textFontSize || 12}px;">
          ${obj.textContent || "Tooltip"}
          <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-style: solid; border-width: 8px; border-color: ${obj.uiColorPrimary || "#10b981"} transparent transparent transparent;"></div>
        </div>`;
      } else if (obj.uiElementType === "selection") {
        const sz = Math.min(obj.width, obj.height);
        innerHtml = `<div style="width: 100%; height: 100%; pointer-events: none; display: flex; align-items: center; justify-content: center; color: ${obj.uiColorPrimary || "#10b981"}; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
          <svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
        </div>`;
      }
      return `<div id="${obj.id}" onclick="void(0)" class="${classes.join(" ")}" style="${style}" ${dataAttrs}>${innerHtml}</div>`;
    } else if (obj.isText) {
      const textColor = obj.textColor || "#ffffff";
      const textFontSize = obj.textFontSize || 16;
      const textFontFamily = obj.textFontFamily || "sans-serif";
      const textOutlineStr = obj.textOutline
        ? `-webkit-text-stroke: 1px ${obj.textOutlineColor || "#000000"};`
        : "";

      const alignMap = {
        left: "flex-start",
        center: "center",
        right: "flex-end",
      };
      const justifyContent = alignMap[obj.textAlign || "center"];
      const textAlign = obj.textAlign || "center";

      const textLineHeight = obj.textLineHeight
        ? `${obj.textLineHeight}`
        : "1.2";
      let containerStyle = `width: 100%; height: 100%; display: flex; align-items: center; justify-content: ${justifyContent}; text-align: ${textAlign}; overflow: hidden; word-break: break-word; line-height: ${textLineHeight}; transform: scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1}); pointer-events: none;`;
      let innerStyle = `color: ${textColor}; font-size: ${textFontSize}px; font-family: ${textFontFamily}; font-weight: ${obj.textWeight || "normal"}; letter-spacing: ${obj.textLetterSpacing || 0}px; text-shadow: ${obj.textShadow || "none"}; ${textOutlineStr}`;

      if (obj.textStyle === "narrative") {
        containerStyle +=
          "background: rgba(0,0,0,0.8); border: 2px solid #555; padding: 8px; border-radius: 8px;";
      } else if (obj.textStyle === "speech") {
        containerStyle +=
          "background: #ffffff; border: 2px solid #000; padding: 12px; border-radius: 20px;";
        innerStyle = `color: ${obj.textColor || "#000000"}; font-size: ${textFontSize}px; font-family: ${textFontFamily}; font-weight: ${obj.textWeight || "normal"}; letter-spacing: ${obj.textLetterSpacing || 0}px; text-shadow: ${obj.textShadow || "none"}; ${textOutlineStr}`;
      } else if (obj.textStyle === "thought") {
        containerStyle +=
          "background: #f0f0f0; border: 2px dashed #aaa; padding: 10px; border-radius: 30px;";
        innerStyle = `color: ${obj.textColor || "#000000"}; font-size: ${textFontSize}px; font-family: ${textFontFamily}; font-weight: ${obj.textWeight || "normal"}; letter-spacing: ${obj.textLetterSpacing || 0}px; text-shadow: ${obj.textShadow || "none"}; ${textOutlineStr}`;
      } else if (obj.textStyle === "sign") {
        containerStyle +=
          "background: #8b5a2b; border: 3px solid #5c3a21; padding: 4px; border-radius: 2px; box-shadow: 2px 2px 5px rgba(0,0,0,0.5);";
        innerStyle = `color: ${obj.textColor || "#ffffff"}; font-size: ${textFontSize}px; font-family: ${textFontFamily}; font-weight: ${obj.textWeight || "normal"}; letter-spacing: ${obj.textLetterSpacing || 0}px; text-shadow: ${obj.textShadow || "none"}; ${textOutlineStr}`;
      }

      return `<div id="${obj.id}" onclick="void(0)" class="${classes.join(" ")}" style="${style}" ${dataAttrs}>
        <div style="${containerStyle}"><span style="${innerStyle}">${obj.textContent || ""}</span></div>
      </div>`;
    } else {
      const filters = obj.filters
        ? `brightness(${obj.filters.brightness ?? 1}) contrast(${obj.filters.contrast ?? 1}) saturate(${obj.filters.saturate ?? 1}) hue-rotate(${obj.filters.hueRotate ?? 0}deg) blur(${obj.filters.blur ?? 0}px) sepia(${obj.filters.sepia ?? 0}) invert(${obj.filters.invert ?? 0}) grayscale(${obj.filters.grayscale ?? 0})`
        : "none";
      const objectFit =
        obj.objectFit === "contain" || obj.objectFit === "cover"
          ? obj.objectFit
          : "fill";
      const imgStyle = `width: 100%; height: 100%; object-fit: ${objectFit}; transform: scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1}); filter: ${filters};`;
      const asset = obj._assetId
        ? project.assets.find((a) => a.id === obj._assetId)
        : project.assets.find((a) => a.src === obj.src || a.dataURL === obj.src);
      const assetDataAttr = asset
        ? `data-asset-id="${asset.id}" data-runtime-src="true" src="${resolveAssetSrc(asset, obj.src)}"`
        : `src="${obj.src || ""}"`;
      if (obj.isVideo) {
        return `<div id="${obj.id}" onclick="void(0)" class="${classes.join(" ")}" style="${style}" ${dataAttrs}><video ${assetDataAttr} style="${imgStyle}" autoplay loop muted playsinline></video></div>`;
      } else {
        return `<div id="${obj.id}" onclick="void(0)" class="${classes.join(" ")}" style="${style}" ${dataAttrs}><img ${assetDataAttr} style="${imgStyle}" draggable="false" /></div>`;
      }
    }
  };

  const scenesHtml = project.scenes.map(s => {
    const sHtml = s.objects.map(getObjectHtml).join("\\n");
    const display = s.id === (project.currentSceneId || project.scenes[0].id) ? "block" : "none";
    return `<div id="scene-${s.id}" class="game-scene" data-bgm="${s.bgmAssetId || ''}" style="display: ${display}; width: 100%; height: 100%; position: absolute; inset: 0; background-color: ${s.backgroundColor}; overflow: hidden;">
      ${sHtml}
    </div>`;
  }).join("\\n");

  const generateUiHtml = (uiMenus: Scene[]) => {
    if (!uiMenus || uiMenus.length === 0) return "";
    return uiMenus
      .map((menu, idx) => {
        let uiObjectsHtml = menu.objects.map(getObjectHtml).join("\n");

        const w = menu.width || project.globalSettings?.stageWidth || 800;
        const h = menu.height || project.globalSettings?.stageHeight || 600;
        const pe = menu.blocksClicks ? "auto" : "none";
        const clickOutsideAttr = menu.closeOnClickOutside ? `data-close-on-outside="true"` : "";
        return `
        <div id="ui-menu-${menu.id}" class="ui-menu-layer" ${clickOutsideAttr} style="display: ${menu.isOpenByDefault ? "block" : "none"}; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: ${w}px; height: ${h}px; pointer-events: ${pe}; overflow: visible; z-index: ${10000 + idx}; background-color: ${menu.backgroundColor || "transparent"}">
          ${uiObjectsHtml}
        </div>
      `;
      })
      .join("\n");
  };

  const uiMenusHtml = generateUiHtml(project.uiMenus || []);

  const js = `
    // Load Game Data
    let gameData = {};
    try {
      gameData = JSON.parse(document.getElementById('__GAME_DATA__').textContent);
    } catch(e) {
      console.error("Failed to parse game data");
    }

    /* Dialogue & Variables */
	    const dialogueTrees = gameData.dialogueTrees || [];
	    const assets = gameData.assets || [];
	    const inventoryItems = gameData.inventoryItems || [];
	    const globalSettings = gameData.globalSettings || {};
	    const needTrackDefinitions = ${jsonForInlineScript(needTracks)};
	    const skillTrackDefinitions = ${jsonForInlineScript(skillTracks)};
	    let activeDialogue = null;
      window.__CAVEBOT_SAVE_KEY__ = ${JSON.stringify(exportSaveKey)};
      const gameSaveKey = window.__CAVEBOT_SAVE_KEY__;

    const assetSrc = (asset, fallback = '') => {
      if (!asset) return fallback || '';
      if (asset.src && !asset.src.startsWith('data:')) return asset.src;
      return asset.dataURL || asset.src || fallback || '';
    };

    const GITHUB_RAW_ASSET_BASE = 'https://raw.githubusercontent.com/thenabu222/entropic-ai/main/';
    const REPOSITORY_MEDIA_EXTENSION = /\\.(png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|mp4|webm|js|ts)(?:[?#].*)?$/i;
    const cleanRepoPathPart = (value) => String(value || '')
      .trim()
      .replace(/^\\/+|\\/+$/g, '')
      .split('/')
      .filter(part => part && part !== '.' && part !== '..')
      .join('/');
    const normalizeRepoFileMatchName = (value) => String(value || '')
      .trim()
      .replace(/^.*[\\\\/]/, '')
      .replace(
        /^(.+?\\.(?:png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|mp4|webm|js|ts))(?:_crop.*)?$/i,
        '$1',
      )
      .replace(/(?:_crop)+$/i, '')
      .toLowerCase();
    const normalizeRepoFileMatchStem = (value) =>
      normalizeRepoFileMatchName(value).replace(REPOSITORY_MEDIA_EXTENSION, '');
    const rawGithubUrl = (repoPath) =>
      GITHUB_RAW_ASSET_BASE + String(repoPath || '')
        .split('/')
        .filter(Boolean)
        .map(part => encodeURIComponent(part))
        .join('/');
    const scoreRepoPathForAsset = (asset, filePath) => {
      const assetName = normalizeRepoFileMatchName(asset.name || asset.id);
      const assetStem = normalizeRepoFileMatchStem(asset.name || asset.id);
      const fileName = normalizeRepoFileMatchName(filePath);
      const fileStem = normalizeRepoFileMatchStem(filePath);
      if (!assetName && !assetStem) return 0;
      let score = 0;
      if (assetName && assetName === fileName) score += 120;
      if (
        assetStem &&
        assetStem === fileStem &&
        (assetStem.length >= 4 || !['root', 'finder/images', 'images'].includes(cleanRepoPathPart(asset.category || '').toLowerCase()))
      ) {
        score += 90;
      }
      if (filePath.includes('assets/_cavebot-assets/')) score += 30;
      const category = cleanRepoPathPart(asset.category || '').toLowerCase();
      if (category && !['root', 'finder/images', 'images'].includes(category)) {
        category.split('/').forEach(part => {
          if (part && filePath.toLowerCase().includes('/' + part + '/')) score += 8;
        });
      }
      return score;
    };
    let repoRelinkPromise = null;
    const shouldRelinkAssetFromRepo = (asset) => {
      if (!asset || String(asset.id || '').startsWith('github:')) return false;
      const src = assetSrc(asset);
      if (!src) return true;
      if (src.startsWith('data:')) return false;
      if (src.includes('/assets/_cavebot-assets/')) return false;
      return src.includes('raw.githubusercontent.com/thenabu222/entropic-ai/main/assets/');
    };
    const relinkMissingAssetsFromGitHub = async () => {
      const assetsNeedingRelink = assets.filter(asset => shouldRelinkAssetFromRepo(asset) && (asset.name || asset.id));
      if (!assetsNeedingRelink.length || typeof fetch !== 'function') return 0;
      if (repoRelinkPromise) return repoRelinkPromise;
      repoRelinkPromise = (async () => {
        try {
          const response = await fetch('https://api.github.com/repos/thenabu222/entropic-ai/git/trees/main?recursive=1');
          if (!response.ok) throw new Error('GitHub tree request failed: ' + response.status);
          const treeData = await response.json();
          const files = (Array.isArray(treeData.tree) ? treeData.tree : [])
            .filter(file =>
              file &&
              file.type === 'blob' &&
              typeof file.path === 'string' &&
              file.path.startsWith('assets/') &&
              REPOSITORY_MEDIA_EXTENSION.test(file.path)
          );
          let recovered = 0;
          assetsNeedingRelink.forEach(asset => {
            let bestPath = '';
            let bestScore = 0;
            files.forEach(file => {
              const score = scoreRepoPathForAsset(asset, file.path);
              if (score > bestScore) {
                bestScore = score;
                bestPath = file.path;
              }
            });
            if (bestPath && bestScore >= 90) {
              asset.src = rawGithubUrl(bestPath);
              asset.dataURL = '';
              asset.exportSource = 'github_inferred';
              recovered += 1;
            }
          });
          if (recovered) {
            document.querySelectorAll('[data-runtime-src][data-asset-id]').forEach(element => {
              const asset = assets.find(candidate => candidate.id === element.getAttribute('data-asset-id'));
              const src = assetSrc(asset);
              if (!src) return;
              if (element.getAttribute('src') !== src) {
                element.setAttribute('src', src);
                if (element.tagName === 'VIDEO' && typeof element.load === 'function') element.load();
              }
            });
            if (typeof window.__cavebotRefreshAssetLinkedViews === 'function') {
              window.__cavebotRefreshAssetLinkedViews();
            }
            if (typeof updateSmartUiRegions === 'function') updateSmartUiRegions();
            const globalCursorAssetId = globalSettings.customCursorAssetId || '';
            if (globalCursorAssetId && typeof setAnimatedCursor === 'function') setAnimatedCursor(globalCursorAssetId);
            console.info('Cavebot export relinked ' + recovered + ' missing asset URL' + (recovered === 1 ? '' : 's') + ' from GitHub.');
          }
          return recovered;
        } catch (error) {
          console.warn('Cavebot export could not relink missing GitHub assets.', error);
          return 0;
        }
      })();
      return repoRelinkPromise;
    };

    const escapeForHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const inventoryIconSrc = (itemId) => {
      const item = inventoryItems.find(candidate => candidate.id === itemId);
      if (!item || !item.iconAssetId) return '';
      return assetSrc(assets.find(asset => asset.id === item.iconAssetId));
    };

    const visibleLoreEntriesForSource = (source) => {
      const entries = gameData.loreEntries || [];
      return entries.filter(entry => {
        if (entry.requiredFlagId && !state.flags[entry.requiredFlagId] && !(state.unlockedLoreEntryIds || []).includes(entry.id)) return false;
        if (source === 'journal') return entry.entryType === 'journal';
        if (source === 'quest_note') return entry.entryType === 'quest_note';
        if (source === 'lore') return entry.entryType === 'lore';
        return true;
      });
    };

    const updateSmartUiRegions = () => {
      document.querySelectorAll('[data-ui-element-type="inventory_grid"]').forEach(obj => {
        const region = obj.querySelector('.ui-smart-region--inventory');
        if (!region) return;
        const columns = Math.max(1, Number(obj.getAttribute('data-ui-grid-columns')) || 4);
        const rows = Math.max(1, Number(obj.getAttribute('data-ui-grid-rows')) || 3);
        const total = columns * rows;
        const emptyText = obj.getAttribute('data-ui-empty-text') || 'Inventory empty';
        let html = '';
        for (let index = 0; index < total; index++) {
          const itemId = state.inventory[index] || '';
          const item = inventoryItems.find(candidate => candidate.id === itemId);
          const iconSrc = itemId ? inventoryIconSrc(itemId) : '';
          html += '<div class="ui-smart-region__slot">';
          if (iconSrc) {
            html += '<img src="' + iconSrc + '" alt="" draggable="false" />';
          } else if (item) {
            html += '<span>' + escapeForHtml((item.name || '').slice(0, 2)) + '</span>';
          }
          html += '</div>';
        }
        if (!state.inventory.length) {
          html += '<div class="ui-smart-region__empty">' + escapeForHtml(emptyText) + '</div>';
        }
        region.innerHTML = html;
      });

      document.querySelectorAll('[data-ui-element-type="journal_text"]').forEach(obj => {
        const region = obj.querySelector('.ui-smart-region--text');
        if (!region) return;
        const source = obj.getAttribute('data-ui-text-source') || 'all';
        const entries = visibleLoreEntriesForSource(source).slice(0, 6);
        const emptyText = obj.getAttribute('data-ui-empty-text') || 'No entries yet.';
        region.innerHTML = entries.length
          ? entries.map(entry => '<article><strong>' + escapeForHtml(entry.title || 'Untitled') + '</strong>' + (entry.content ? '<p>' + escapeForHtml(entry.content) + '</p>' : '') + '</article>').join('')
          : '<span>' + escapeForHtml(emptyText) + '</span>';
      });

      document.querySelectorAll('[data-ui-element-type="quest_list"]').forEach(obj => {
        const region = obj.querySelector('.ui-smart-region--text');
        if (!region) return;
        const quests = (gameData.quests || []).filter(quest => (state.activeQuests || []).includes(quest.id) || (state.completedQuests || []).includes(quest.id)).slice(0, 6);
        const emptyText = obj.getAttribute('data-ui-empty-text') || 'No active quests.';
        region.innerHTML = quests.length
          ? quests.map(quest => '<article><strong>' + escapeForHtml(quest.name || 'Untitled quest') + '</strong><p>' + escapeForHtml((state.completedQuests || []).includes(quest.id) ? 'Complete' : (quest.description || 'Active objective')) + '</p></article>').join('')
          : '<span>' + escapeForHtml(emptyText) + '</span>';
      });

      document.querySelectorAll('[data-ui-element-type="stat_list"]').forEach(obj => {
        const region = obj.querySelector('.ui-smart-region--stats');
        if (!region) return;
        const primary = obj.getAttribute('data-ui-primary') || 'var(--ui-primary)';
        const entries = Object.entries(state.needs || {});
        const fallback = [['hunger', 70], ['rest', 70], ['novelty', 70], ['connection', 70]];
        region.innerHTML = (entries.length ? entries : fallback).slice(0, 8).map(([label, value]) =>
          '<div class="ui-smart-region__meter"><span>' + escapeForHtml(label) + '</span><i><b style="width:' + Math.max(0, Math.min(100, Number(value) || 0)) + '%; background-color:' + primary + '"></b></i></div>'
        ).join('');
      });
    };

    const buildAudioSrc = (asset) => {
      const src = assetSrc(asset);
      if (!src) return "";
      return src + (asset.trimStart || asset.trimEnd
        ? '#t=' + (asset.trimStart || 0) + (asset.trimEnd ? ',' + asset.trimEnd : '')
        : '');
    };

    const applyAssetVolume = (audio, asset) => {
      audio.volume = Math.max(0, Math.min(1, asset?.volume ?? 1));
      audio.muted = !!(typeof state !== 'undefined' && state.isMuted);
      return audio;
    };

    const activeRuntimeAudio = [];

    const playAudioAsset = (asset) => {
      const src = buildAudioSrc(asset);
      if (!src || (typeof state !== 'undefined' && state.isMuted)) return null;
      const audio = applyAssetVolume(new Audio(src), asset);
      activeRuntimeAudio.splice(
        0,
        activeRuntimeAudio.length,
        ...activeRuntimeAudio.filter(candidate => !candidate.paused)
      );
      activeRuntimeAudio.push(audio);
      audio.play().catch(e => console.warn("Audio play failed", e));
      return audio;
    };

    const animatedCursor = document.getElementById('animated-game-cursor');
    const globalCursorAssetId = globalSettings.customCursorAssetId || '';
    const findCursorAsset = (assetId) => assets.find(asset => asset.id === assetId);
    const resolveCursorSrc = (assetId) => {
      const cursorAsset = findCursorAsset(assetId);
      return assetSrc(cursorAsset);
    };
    const setAnimatedCursor = (assetId) => {
      const cursorSrc = resolveCursorSrc(assetId) || resolveCursorSrc(globalCursorAssetId);
      if (!animatedCursor || !cursorSrc) {
        if (animatedCursor) animatedCursor.style.opacity = '0';
        document.body.classList.remove('animated-cursor-active');
        return;
      }
      animatedCursor.src = cursorSrc;
      document.body.classList.add('animated-cursor-active');
    };
    document.addEventListener('pointermove', (event) => {
      if (!animatedCursor || !document.body.classList.contains('animated-cursor-active')) return;
      if (!(event.target instanceof Element) || !event.target.closest('#game-positioner')) {
        animatedCursor.style.opacity = '0';
        return;
      }
      animatedCursor.style.transform = 'translate3d(' + (event.clientX - 4) + 'px,' + (event.clientY - 4) + 'px,0)';
      animatedCursor.style.opacity = '1';
    });
    document.documentElement.addEventListener('mouseleave', () => {
      if (animatedCursor) animatedCursor.style.opacity = '0';
    });
    document.querySelectorAll('.scene-object').forEach((objectElement) => {
      objectElement.addEventListener('pointerenter', () => {
        const objectCursorAssetId = objectElement.getAttribute('data-cursor-asset');
        if (objectCursorAssetId) setAnimatedCursor(objectCursorAssetId);
      });
      objectElement.addEventListener('pointerleave', () => {
        setAnimatedCursor(globalCursorAssetId);
      });
    });
    setAnimatedCursor(globalCursorAssetId);

    const compareRuleValue = ${compareRuleValue.toString()};
    const evaluateRuleCondition = ${evaluateRuleCondition.toString()};
    const evaluateRuleConditions = ${evaluateRuleConditions.toString()};

	    const clampTrackValue = (track, fallback) => {
	      const min = track.min ?? 0;
	      const max = track.max ?? 100;
	      const value = track.defaultValue ?? fallback;
	      return Math.max(min, Math.min(max, value));
	    };

	    const percentForTrack = (value, track) => {
	      const min = track.min ?? 0;
	      const max = track.max ?? 100;
	      const span = Math.max(1, max - min);
	      return Math.max(0, Math.min(100, ((value - min) / span) * 100));
	    };

	    // Game State
	    const defaultNeeds = {};
	    needTrackDefinitions.forEach(track => {
	      defaultNeeds[track.id] = clampTrackValue(track, 100);
	    });
	    
	    const defaultSkills = {};
	    skillTrackDefinitions.forEach(track => {
	      defaultSkills[track.id] = clampTrackValue(track, 0);
	    });

    let state = {
      version: 1,
      currentSceneId: '${project.currentSceneId}',
      needs: defaultNeeds,
      skills: defaultSkills,
      inventory: [],
      flags: {},
      talkCounts: {},
      relationships: {},
      activeQuests: gameData.quests?.filter(q => q.autoStart).map(q => q.id) || [],
      completedQuests: [],
      completedQuestObjectives: [],
      unlockedLoreEntryIds: [],
      collectedObjects: [],
      activeUiMenus: [],
      triggeredRuleIds: [],
      runtimePositions: {},
      isMuted: false,
      time: ${project.globalSettings?.dayNightStartHour ?? 8},
      day: 1
    };

    // Load from LocalStorage
    try {
      const saved = localStorage.getItem(gameSaveKey);
      if (saved) {
        state = { ...state, ...JSON.parse(saved) };
      }
    } catch(e) {}
    state.triggeredRuleIds = state.triggeredRuleIds || [];
    state.collectedObjects = state.collectedObjects || [];
    state.activeUiMenus = state.activeUiMenus || [];
    state.relationships = state.relationships || {};
    state.talkCounts = state.talkCounts || {};
    state.runtimePositions = state.runtimePositions || {};
    state.isMuted = !!state.isMuted;

    const normalizeRuntimeLookup = (value) => String(value || '')
      .trim()
      .replace(/^.*\\//, '')
      .replace(/\\.[a-z0-9]+$/i, '')
      .replace(/(?:_crop|_cropped|_copy|copy)+$/gi, '')
      .replace(/[^a-z0-9]+/gi, '')
      .toLowerCase();

    const addInventoryItem = (itemId) => {
      if (!itemId) return false;
      if (!state.inventory.includes(itemId)) {
        state.inventory.push(itemId);
        updateInventoryUI();
        checkQuestAutoComplete();
        saveGame();
        return true;
      }
      return false;
    };

    const relationshipBaseValue = (targetId) => {
      const character = (gameData.characters || []).find(char => char.id === targetId);
      if (character) return character.defaultAffinity || 0;
      const faction = (gameData.factions || []).find(group => group.id === targetId);
      return faction ? (faction.defaultAffinity || 0) : 0;
    };

    const resolveRelationshipTargetId = (targetId) => {
      if (!targetId) return '';
      const normalized = normalizeRuntimeLookup(targetId);
      const character = (gameData.characters || []).find(char => char.id === targetId || normalizeRuntimeLookup(char.name) === normalized);
      if (character) return character.id;
      const faction = (gameData.factions || []).find(group => group.id === targetId || normalizeRuntimeLookup(group.name) === normalized);
      return faction ? faction.id : targetId;
    };

    const changeRelationship = (targetId, amount) => {
      const resolvedTarget = resolveRelationshipTargetId(targetId);
      const numericAmount = Number(amount) || 0;
      if (!resolvedTarget || !numericAmount) return;
      state.relationships[resolvedTarget] = Math.max(-100, Math.min(100, (state.relationships[resolvedTarget] ?? relationshipBaseValue(resolvedTarget)) + numericAmount));
      if (typeof window.buildRelationshipsPanel === 'function') {
        window.buildRelationshipsPanel();
      }
      saveGame();
    };

    const inferInventoryItemForObject = (obj, explicitItemId) => {
      if (explicitItemId) return explicitItemId;
      const objectAssetId =
        obj.getAttribute('data-object-asset-id') ||
        obj.querySelector('[data-asset-id]')?.getAttribute('data-asset-id') ||
        '';
      const objectName = normalizeRuntimeLookup(obj.getAttribute('data-object-name') || '');
      const imgSrc = obj.querySelector('img')?.getAttribute('src') || '';
      const objectSrc = normalizeRuntimeLookup(imgSrc);
      const item = inventoryItems.find(candidate => {
        if (objectAssetId && candidate.iconAssetId === objectAssetId) return true;
        const itemName = normalizeRuntimeLookup(candidate.name);
        if (objectName && itemName && (itemName === objectName || objectName.includes(itemName) || itemName.includes(objectName))) return true;
        const iconAsset = candidate.iconAssetId ? assets.find(asset => asset.id === candidate.iconAssetId) : null;
        const iconSrc = normalizeRuntimeLookup(assetSrc(iconAsset));
        const iconName = normalizeRuntimeLookup(iconAsset && iconAsset.name);
        if (objectSrc && ((iconSrc && iconSrc === objectSrc) || (iconName && (iconName === objectSrc || objectSrc.includes(iconName))))) return true;
        return false;
      });
      return item ? item.id : '';
    };

    let saveGame = () => {
      try {
        localStorage.setItem(gameSaveKey, JSON.stringify(state));
      } catch(e) {
        console.warn('Failed to save game to localStorage');
      }
    };

    const initGame = () => {
      // Resolve runtime asset sources
      document.querySelectorAll('[data-runtime-src="true"]').forEach(el => {
        const assetId = el.getAttribute('data-asset-id');
        if (!assetId) return;
        const asset = assets.find(a => a.id === assetId);
        const src = assetSrc(asset);
        if (src) {
          el.setAttribute('src', src);
        }
      });
      const dialogueBox = document.getElementById('dialogue-box');
      const flavorText = document.getElementById('flavor-text');
      const container = document.getElementById('game-container');
      const gamePositioner = document.getElementById('game-positioner');

      if (state.currentSceneId) {
        state.flags['visited_scene_' + state.currentSceneId] = true;
        document.querySelectorAll('.game-scene').forEach(el => {
          el.style.display = el.id === 'scene-' + state.currentSceneId ? 'block' : 'none';
        });
      }
      state.activeUiMenus.forEach(menuId => {
        const menu = document.getElementById('ui-menu-' + menuId);
        if (menu) menu.style.display = 'block';
      });
      Object.entries(state.runtimePositions).forEach(([objectId, position]) => {
        const element = document.getElementById(objectId);
        if (!element || !position) return;
        element.style.left = Number(position.x || 0) + 'px';
        element.style.top = Number(position.y || 0) + 'px';
      });
      
      // Scale game to fit screen
      const scaleWrapper = document.getElementById('scale-wrapper');
      
      let currentScale = 1;
      const resizeGame = () => {
        const gameW = ${layoutWidth};
        let gameH = ${layoutHeight};
        
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        
        // Approximate a comfortable vertical limit if dialogue is below
        const maxGameH = globalSettings.dialoguePosition === 'below' ? Math.max(0, winH - 240) : winH;
        
        const viewportPadding = 16;
        currentScale = Math.max(
          0.05,
          Math.min(
            1,
            (winW - viewportPadding * 2) / gameW,
            (maxGameH - viewportPadding * 2) / gameH,
          ),
        );
        gamePositioner.style.transform =
          'translate(-50%, -50%) scale(' + currentScale + ')';
        gamePositioner.style.transformOrigin = 'center center';
      };
      window.addEventListener('resize', resizeGame);
      resizeGame();

      // Close-on-click-outside for UI menus
      document.addEventListener('pointerdown', (e) => {
        document.querySelectorAll('.ui-menu-layer[data-close-on-outside="true"]').forEach(menu => {
          if (menu.style.display !== 'none' && !menu.contains(e.target)) {
            menu.style.display = 'none';
            const menuId = menu.id.replace('ui-menu-', '');
            state.activeUiMenus = state.activeUiMenus.filter(id => id !== menuId);
          }
        });
      });

      // Global BGM State
      let currentBgmAudio = null;
      let currentBgmAssetId = null;

      const playBgm = (assetId) => {
        if (!assetId) {
          if (currentBgmAudio) {
            currentBgmAudio.pause();
            currentBgmAudio.currentTime = 0;
            currentBgmAudio = null;
            currentBgmAssetId = null;
          }
          return;
        }
        if (assetId === currentBgmAssetId && currentBgmAudio) return; // already playing
        
        if (currentBgmAudio) {
           currentBgmAudio.pause();
           currentBgmAudio = null;
        }

        const bgmAsset = assets.find(a => a.id === assetId);
        if (assetSrc(bgmAsset)) {
           currentBgmAudio = applyAssetVolume(new Audio(buildAudioSrc(bgmAsset)), bgmAsset);
           currentBgmAudio.loop = true;
           currentBgmAudio.play().catch(e => console.warn("BGM play failed. User interaction needed:", e));
           currentBgmAssetId = assetId;
        }
      };

      // Set initial BGM
      const initialSceneBgm = document.querySelector('.game-scene[style*="display: block"]')?.getAttribute('data-bgm');
      if (initialSceneBgm) {
        const startInitBgm = () => {
           playBgm(initialSceneBgm);
           document.removeEventListener('click', startInitBgm);
        };
        document.addEventListener('click', startInitBgm);
      }

      // Dialogue System
      const typeSpeed = globalSettings.typewriterSpeed !== undefined ? globalSettings.typewriterSpeed : 15;
      
      window.startDialogue = (treeId) => {
        const tree = dialogueTrees.find(t => t.id === treeId);
        const startNodeId = tree
          ? (tree.nodes || []).some(node => node.id === tree.startNodeId)
            ? tree.startNodeId
            : (tree.nodes || [])[0]?.id
          : null;
        if (tree && startNodeId) {
          state.talkCounts[treeId] = (state.talkCounts[treeId] || 0) + 1;
          state.flags['talked_' + treeId] = true;
          saveGame();
          checkQuestAutoComplete();
          showDialogueNode(tree, startNodeId);
        }
      };

      window.showDialogueNode = (tree, nodeId) => {
        const node = tree.nodes.find(n => n.id === nodeId) || tree.nodes[0];
        if (!node) {
          closeDialogue();
          return;
        }
        activeDialogue = { tree, node };
        
        const speakerAsset = node.speakerAssetId ? assets.find(a => a.id === node.speakerAssetId) : null;
        
        let html = '<div class="dialogue-title">' + (node.speaker || 'Unknown') + '</div>' +
                   '<div class="dialogue-content">';
        
        if (speakerAsset && (!node.portraitPosition || node.portraitPosition === 'left')) {
          html += '<div class="dialogue-portrait left">' +
                  '<img src="' + assetSrc(speakerAsset) + '" />' +
                  '</div>';
        }
        
        html += '<div class="dialogue-text-container" id="dialogue-text"></div>';
        
        if (speakerAsset && node.portraitPosition === 'right') {
          html += '<div class="dialogue-portrait right">' +
                  '<img src="' + assetSrc(speakerAsset) + '" />' +
                  '</div>';
        }
        html += '</div>';
        
        let choicesHtml = '<div class="dialogue-choices">';
        if (node.choices && node.choices.length > 0) {
          let hasChoices = false;
          node.choices.forEach((c, idx) => {
            if (c.requiredGameFlag && !state.flags[c.requiredGameFlag]) return;
            hasChoices = true;
            choicesHtml += '<button class="dialogue-choice" onclick="chooseDialogue(' + idx + ')">&#9656; ' + c.text + '</button>';
          });
          if (!hasChoices) {
              choicesHtml += '<button class="dialogue-choice" style="text-align: center;" onclick="closeDialogue()">Continue...</button>';
          }
        } else {
          choicesHtml += '<button class="dialogue-choice" style="text-align: center;" onclick="closeDialogue()">Continue...</button>';
        }
        choicesHtml += '</div>';
        
        dialogueBox.className = ''; // Make sure simple-dialogue is removed
        dialogueBox.onclick = null;
        dialogueBox.innerHTML = html + choicesHtml;
        dialogueBox.style.display = 'flex';
        
        const textEl = document.getElementById('dialogue-text');
        const text = node.text || '';
        let i = 0;
        if (window.typewriterInterval) clearInterval(window.typewriterInterval);
        
        if (typeSpeed <= 0) {
          textEl.innerText = text;
        } else {
          window.typewriterInterval = setInterval(() => {
            textEl.innerText = text.substring(0, i + 1);
            i++;
            if (i >= text.length) clearInterval(window.typewriterInterval);
          }, typeSpeed);
        }
      };

      const applyQuestRewards = (questId) => {
        const q = (gameData.quests || []).find(q => q.id === questId);
        if (!q || !q.rewards) return;
        q.rewards.forEach(reward => {
          if (reward.type === 'give_item') {
            if (reward.targetId && addInventoryItem(reward.targetId)) {
              const item = (gameData.inventoryItems || []).find(i => i.id === reward.targetId);
              showSimpleDialogue('Reward: ' + (item ? item.name : reward.targetId), 'System');
            }
          } else if (reward.type === 'set_flag') {
            if (reward.targetId) {
              state.flags[reward.targetId] = true;
              updateGameFlagsUI();
            }
          } else if (reward.type === 'modify_status') {
            if (reward.targetId) {
              if (reward.targetId in state.needs) {
                state.needs[reward.targetId] = Math.max(0, Math.min(100, (state.needs[reward.targetId] || 0) + (reward.amount || 0)));
                updateNeedsUI();
              } else {
                state.skills[reward.targetId] = Math.min(20, (state.skills[reward.targetId] || 0) + (reward.amount || 1));
                updateSkillsUI();
              }
            }
          }
        });
        saveGame();
      };

      const isQuestObjectiveDone = (obj) => {
        if (!obj) return false;
        if (state.completedQuestObjectives && state.completedQuestObjectives.includes(obj.id)) return true;
        if (obj.type === 'custom_flag') return !!state.flags[obj.targetId];
        if (obj.type === 'talk_to') return (state.talkCounts[obj.targetId] || 0) >= (obj.requiredAmount || 1);
        if (obj.type === 'collect_item') return state.inventory.includes(obj.targetId);
        if (obj.type === 'reach_scene') return state.currentSceneId === obj.targetId || !!state.flags['visited_scene_' + obj.targetId];
        if (obj.type === 'skill_check') return (state.skills[obj.targetId] || 0) >= (obj.requiredAmount || 1);
        return false;
      };

      const completeQuestObjective = (objectiveId) => {
        if (!objectiveId) return;
        state.completedQuestObjectives = state.completedQuestObjectives || [];
        if (!state.completedQuestObjectives.includes(objectiveId)) {
          state.completedQuestObjectives.push(objectiveId);
        }
        const q = (gameData.quests || []).find(q => (q.objectives || []).some(obj => obj.id === objectiveId));
        const obj = q ? (q.objectives || []).find(obj => obj.id === objectiveId) : null;
        if (q && !state.activeQuests.includes(q.id) && !state.completedQuests.includes(q.id)) {
          state.activeQuests.push(q.id);
        }
        if (q && obj) showSimpleDialogue('Quest step complete: ' + (obj.description || q.name), 'System');
        checkQuestAutoComplete();
        buildQuestLog();
        saveGame();
      };

      const unlockLoreEntry = (entryId, showNow) => {
        if (!entryId) return;
        state.unlockedLoreEntryIds = state.unlockedLoreEntryIds || [];
        if (!state.unlockedLoreEntryIds.includes(entryId)) {
          state.unlockedLoreEntryIds.push(entryId);
        }
        const entry = (gameData.loreEntries || []).find(e => e.id === entryId);
        if (showNow && entry) {
          const label = entry.entryType === 'quest_note' ? 'Quest Note' : entry.entryType === 'journal' ? 'Journal' : 'Lore';
          showSimpleDialogue(label + ': ' + entry.title + '\\n\\n' + (entry.content || 'Added to your almanac.'), 'System');
        }
        if (window.buildAlmanacPanel) window.buildAlmanacPanel();
        saveGame();
      };

      const checkQuestAutoComplete = () => {
        const toComplete = [];
        state.activeQuests.forEach(qId => {
          const q = (gameData.quests || []).find(q => q.id === qId);
          if (!q || !q.objectives || q.objectives.length === 0) return;
          const allDone = q.objectives.every(obj => isQuestObjectiveDone(obj));
          if (allDone) toComplete.push(qId);
        });
        if (toComplete.length === 0) return;
        toComplete.forEach(qId => {
          state.activeQuests = state.activeQuests.filter(id => id !== qId);
          state.completedQuests.push(qId);
          const q = (gameData.quests || []).find(q => q.id === qId);
          showSimpleDialogue('Quest Completed: ' + (q ? q.name : qId), 'System');
          applyQuestRewards(qId);
        });
        buildQuestLog();
        saveGame();
      };

      window.chooseDialogue = (choiceIdx) => {
        if (!activeDialogue) return;
        const choice = activeDialogue.node.choices[choiceIdx];
        if (!choice) return;

        if (choice.setGameFlag) {
          state.flags[choice.setGameFlag] = true;
          updateGameFlagsUI();
        }
        if (choice.startQuestId && !state.activeQuests.includes(choice.startQuestId) && !state.completedQuests.includes(choice.startQuestId)) {
          state.activeQuests.push(choice.startQuestId);
          const q = (gameData.quests || []).find(q => q.id === choice.startQuestId);
          showSimpleDialogue('Quest Started: ' + (q ? q.name : choice.startQuestId), 'System');
          buildQuestLog();
        }
        if (choice.completeQuestId && state.activeQuests.includes(choice.completeQuestId)) {
          state.activeQuests = state.activeQuests.filter(id => id !== choice.completeQuestId);
          state.completedQuests.push(choice.completeQuestId);
          const q = (gameData.quests || []).find(q => q.id === choice.completeQuestId);
          showSimpleDialogue('Quest Completed: ' + (q ? q.name : choice.completeQuestId), 'System');
          applyQuestRewards(choice.completeQuestId);
          buildQuestLog();
        }
        if (choice.completeQuestObjectiveId) {
          completeQuestObjective(choice.completeQuestObjectiveId);
        }
        if (choice.unlockLoreEntryId) {
          unlockLoreEntry(choice.unlockLoreEntryId, false);
        }
        if (choice.showLoreEntryId) {
          unlockLoreEntry(choice.showLoreEntryId, true);
        }
        if (choice.giveItemId && addInventoryItem(choice.giveItemId)) {
          const item = (gameData.inventoryItems || []).find(i => i.id === choice.giveItemId);
          showSimpleDialogue('You received: ' + (item ? item.name : 'an item'), 'System');
        }
        if (choice.consumeItemId) {
          const idx = state.inventory.indexOf(choice.consumeItemId);
          if (idx !== -1) { state.inventory.splice(idx, 1); updateInventoryUI(); }
        }
        if (choice.grantSkillId && choice.grantSkillId !== 'none') {
          const amt = choice.grantSkillAmount || 1;
          state.skills[choice.grantSkillId] = Math.min(20, (state.skills[choice.grantSkillId] || 0) + amt);
          showSimpleDialogue('+' + amt + ' ' + choice.grantSkillId + '!', 'System');
          updateSkillsUI();
          checkQuestAutoComplete();
        }
        if (choice.needsEffect) {
          for (const [key, val] of Object.entries(choice.needsEffect)) {
            state.needs[key] = Math.max(0, Math.min(100, (state.needs[key] || 0) + val));
          }
          updateNeedsUI();
        }
        if (choice.reputationEffect) {
          const fe = choice.reputationEffect;
          const relationshipTarget = fe.characterId || fe.factionId;
          if (relationshipTarget) {
            changeRelationship(relationshipTarget, fe.value);
          }
        }
        if (choice.timeCost) {
          state.time = ((state.time || 8) + choice.timeCost) % 24;
        }
        if (choice.playSoundAssetId) {
          const snd = assets.find(a => a.id === choice.playSoundAssetId);
          if (snd) { playAudioAsset(snd); }
        }
        saveGame();

        if (choice.changeSceneId) {
          closeDialogue();
          document.querySelectorAll('.game-scene').forEach(el => el.style.display = 'none');
          const targetScene = document.getElementById('scene-' + choice.changeSceneId);
          if (targetScene) {
            targetScene.style.display = 'block';
            state.currentSceneId = choice.changeSceneId;
            state.flags['visited_scene_' + choice.changeSceneId] = true;
            playBgm(targetScene.getAttribute('data-bgm') || null);
            checkQuestAutoComplete();
          }
        } else if (choice.nextNodeId) {
          showDialogueNode(activeDialogue.tree, choice.nextNodeId);
        } else {
          closeDialogue();
        }
      };

      window.closeDialogue = () => {
        activeDialogue = null;
        if (dialogueBox) dialogueBox.style.display = 'none';
        if (window.typewriterInterval) clearInterval(window.typewriterInterval);
      };
      
      // Update Game Flags UI
      const updateGameFlagsUI = () => {
        document.querySelectorAll('[data-ui-binding="flag"]').forEach((el) => {
          const flagId = el.getAttribute('data-ui-binding-id');
          const isSet = flagId && state.flags[flagId];
          const type = el.getAttribute('data-ui-element-type');
          if (type === 'toggle') {
            const w = parseFloat(el.style.width);
            const h = parseFloat(el.style.height);
            const primary = el.getAttribute('data-ui-primary') || '#10b981';
            const secondary = el.getAttribute('data-ui-secondary') || '#525252';
            const bgDiv = el.querySelector('div');
            const handle = el.querySelector('div > div');
            if (bgDiv && handle) {
              bgDiv.style.backgroundColor = isSet ? primary : secondary;
              handle.style.transform = isSet ? 'translateX(' + (w - h) + 'px)' : 'translateX(0)';
            }
          }
        });
        
        // Dynamic Object Visibility based on Flags
        document.querySelectorAll('.scene-object').forEach((el) => {
          if (state['collected_' + el.id]) {
            el.style.display = 'none';
            return;
          }
          
          const showFlag = el.getAttribute('data-show-flag');
          const hideFlag = el.getAttribute('data-hide-flag');
          
          if ((!showFlag || showFlag.trim() === "") && (!hideFlag || hideFlag.trim() === "")) {
            return; // Don't mess with visibility if no flags are assigned
          }

          let isVisible = true;
          if (hideFlag && hideFlag.trim() !== "" && state.flags[hideFlag]) isVisible = false;
          if (showFlag && showFlag.trim() !== "" && !state.flags[showFlag]) isVisible = false;
          
          // Only show what's supposed to be visible
          el.style.display = isVisible ? 'flex' : 'none';
        });
      };
      
      const _origSaveGame = saveGame;
      saveGame = () => {
         _origSaveGame();
         updateGameFlagsUI();
         updateSmartUiRegions();
      };
      
      updateGameFlagsUI();

	      // Update Needs UI
	      const updateNeedsUI = () => {
	        needTrackDefinitions.forEach(track => {
	          const el = document.getElementById('need-' + track.domId);
	          if (el) el.style.width = percentForTrack(state.needs[track.id] ?? track.defaultValue ?? 0, track) + '%';
	        });
          updateSmartUiRegions();
	      };
	      updateNeedsUI();

	      // Update Skills UI
	      const updateSkillsUI = () => {
	        skillTrackDefinitions.forEach(track => {
	          const el = document.getElementById('skill-' + track.domId);
	          if (el) el.style.width = percentForTrack(state.skills[track.id] ?? track.defaultValue ?? 0, track) + '%';
	        });
          updateSmartUiRegions();
	      };
      updateSkillsUI();

      // Day/Night Cycle
      ${
        project.globalSettings?.useDayNightCycle
          ? `
        setInterval(() => {
          state.time += ${project.globalSettings?.dayNightHoursPerTick ?? 0.1};
          if (state.time >= 24) {
            const daysElapsed = Math.max(1, Math.floor(state.time / 24));
            state.time = state.time % 24;
            state.day = (state.day || 1) + daysElapsed;
            triggerDayReset();
          }

          let filter = 'brightness(1)';
          if (state.time > 18 || state.time < 6) {
            filter = 'brightness(0.5) sepia(0.3) hue-rotate(180deg)';
          } else if (state.time > 16) {
            filter = 'brightness(0.8) sepia(0.5) hue-rotate(-20deg)';
          }
          document.documentElement.style.setProperty('--time-filter', filter);

          const timeDisplay = document.getElementById('time-display');
          if (timeDisplay) {
            const h = Math.floor(state.time).toString().padStart(2, "0");
            const m = Math.floor((state.time % 1) * 60).toString().padStart(2, "0");
            timeDisplay.innerText = 'Day ' + (state.day || 1) + ' · ' + h + ':' + m;
          }
        }, ${Math.max(100, project.globalSettings?.dayNightTickMs ?? 1000)});
      `
          : ""
      }

      // Inventory Deselect on Background Click/Right-Click
      container.addEventListener('pointerdown', (e) => {
         if (typeof selectedInventoryItemId !== 'undefined' && selectedInventoryItemId !== null) {
            clearInventorySelection();
            try { updateInventoryUI(); } catch(e){}
         }
      });
      container.addEventListener('contextmenu', (e) => {
         e.preventDefault();
         if (typeof selectedInventoryItemId !== 'undefined' && selectedInventoryItemId !== null) {
            clearInventorySelection();
            try { updateInventoryUI(); } catch(e){}
         }
      });

      // Parallax Effect
      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
        const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

        document.querySelectorAll('.scene-object').forEach(obj => {
          const speed = parseFloat(obj.getAttribute('data-parallax')) || 1;
          const baseRot = obj.getAttribute('data-rotation') || '0';
          if (speed !== 1) {
            const offset = (speed - 1) * 50; // 50px max offset
            obj.style.transform = \`translate(\${-mouseX * offset}px, \${-mouseY * offset}px) rotate(\${baseRot}deg)\`;
          }
        });
      });

      window.showSimpleDialogue = (text, title) => {
        const dBox = document.getElementById('dialogue-box');
        dBox.className = 'simple-dialogue';
        dBox.innerHTML = '<div class="simple-dialogue-text" id="dialogue-text"></div><div class="simple-dialogue-continue">Click to continue</div>';
        dBox.style.display = 'flex';
        dBox.onclick = window.closeDialogue;
        
        const textEl = document.getElementById('dialogue-text');
        let i = 0;
        if (window.typewriterInterval) clearInterval(window.typewriterInterval);
        
        if (typeSpeed <= 0) {
          textEl.innerText = text;
        } else {
          window.typewriterInterval = setInterval(() => {
            textEl.innerText = text.substring(0, i + 1);
            i++;
            if (i >= text.length) clearInterval(window.typewriterInterval);
          }, typeSpeed);
        }
      };

      // Interactions
      document.querySelectorAll('.scene-object').forEach(obj => {
        
        // Hide if collected
        if (state['collected_' + obj.id]) {
          obj.style.display = 'none';
        }
        if (state.collectedObjects.includes(obj.id)) {
          obj.style.display = 'none';
        }

        // Apply any immediate flag visibility checks to ensure objects are hidden correctly
        // before interaction events are even dispatched, but updateGameFlagsUI handles the bulk.

        // Flavor Text on Hover
        obj.addEventListener('mouseenter', (e) => {
          const flavor = obj.getAttribute('data-flavor');
          if (flavor) {
            flavorText.innerText = flavor;
            flavorText.style.opacity = 1;
            const rect = obj.getBoundingClientRect();
            const contRect = gamePositioner.getBoundingClientRect();
            flavorText.style.left = ((rect.left - contRect.left + rect.width/2) / currentScale) + 'px';
            flavorText.style.top = ((rect.top - contRect.top) / currentScale) + 'px';
          }
        });
        
        obj.addEventListener('mouseleave', () => {
          flavorText.style.opacity = 0;
        });

        let lastClickTime = 0;
        const handleClick = (e) => {
          const isChainedResponse = !!e.__chainedResponse;
          if (!isChainedResponse && Date.now() - lastClickTime < 300) return;
          if (!isChainedResponse) lastClickTime = Date.now();
          
          try {
            console.log('Object clicked:', obj.id, 'class:', obj.className);
            if (!isChainedResponse) {
              const primaryConditions = JSON.parse(
                decodeURIComponent(obj.getAttribute('data-rule-conditions') || '%5B%5D')
              );
              const primaryConditionMode = obj.getAttribute('data-rule-condition-mode') || 'all';
              const primaryRunsOnce = obj.getAttribute('data-rule-once') === 'true';
              if (!evaluateRuleConditions(primaryConditions, primaryConditionMode, state)) {
                return;
              }
              if (primaryRunsOnce && state.triggeredRuleIds.includes(obj.id)) {
                return;
              }
              if (primaryRunsOnce) {
                state.triggeredRuleIds.push(obj.id);
              }
            }
            // flavorText.innerText = "Clicked " + obj.id;
            // flavorText.style.opacity = 1;
            // setTimeout(() => flavorText.style.opacity = 0, 1000);
            
            // Skill Check
            const reqSkill = obj.getAttribute('data-skill');
          const diff = parseInt(obj.getAttribute('data-difficulty')) || 0;
          if (reqSkill && reqSkill !== 'none') {
            const roll = Math.floor(Math.random() * 20) + 1 + (state.skills[reqSkill] || 0);
            if (roll < diff) {
              showSimpleDialogue(\`[Skill Check Failed] \${reqSkill} roll: \${roll} vs \${diff}\`, "System");
              return;
            }
          }

          // Apply Needs Effect
          try {
            const needsStr = obj.getAttribute('data-needs');
            if (needsStr) {
              const effect = JSON.parse(needsStr);
              let changed = false;
              for (const [key, val] of Object.entries(effect)) {
                if (val) {
                  state.needs[key] = (state.needs[key] || 0) + val;
                  changed = true;
                }
              }
              if (changed) {
                updateNeedsUI();
                saveGame();
              }
            }
          } catch(e) {}

          const grantSkill = obj.getAttribute('data-grant-skill');
          if (grantSkill && grantSkill !== 'none') {
            const amount = parseInt(obj.getAttribute('data-grant-skill-val')) || 1;
            state.skills[grantSkill] = Math.min(20, (state.skills[grantSkill] || 0) + amount);
            showSimpleDialogue(\`Gained +\${amount} \${grantSkill}!\`, "System");
            updateSkillsUI();
            checkQuestAutoComplete();
            saveGame();
          }

          const timeCost = Number(obj.getAttribute('data-time-cost') || 0);
          if (timeCost) {
            state.time = ((state.time || ${project.globalSettings?.dayNightStartHour ?? 8}) + timeCost) % 24;
            saveGame();
          }

          const reputationTarget = obj.getAttribute('data-reputation-target') || '';
          const reputationValue = Number(obj.getAttribute('data-reputation-val') || 0);
          if (reputationTarget && reputationValue) {
            changeRelationship(reputationTarget, reputationValue);
          }

          const interaction = obj.getAttribute('data-interaction');
          const data = obj.getAttribute('data-interaction-data');
          const giveItemId = obj.getAttribute('data-give-item');
          const audioSrc = obj.getAttribute('data-audio-src');
          
          if (audioSrc && audioSrc !== '') {
            const soundAsset = assets.find(a => a.id === audioSrc);
            if (soundAsset) {
              playAudioAsset(soundAsset);
            }
          }
          
          if (interaction === 'give-item' || interaction === 'collect') {
            const itemIdToGive = inferInventoryItemForObject(obj, giveItemId);
            if (itemIdToGive && addInventoryItem(itemIdToGive)) {
              showSimpleDialogue("You obtained an item!", "System");
            }
            if (interaction === 'collect') {
              obj.style.display = 'none';
              state['collected_' + obj.id] = true;
              if (!state.collectedObjects.includes(obj.id)) {
                state.collectedObjects.push(obj.id);
              }
              saveGame();
            }
          } else if (interaction === 'dialogue' || interaction === 'flavor_text') {
            const treeId = obj.getAttribute('data-dialogue-tree');
            if (interaction === 'dialogue' && treeId) {
              startDialogue(treeId);
            } else {
              showSimpleDialogue(data, "");
            }
          } else if (interaction === 'sound') {
            const soundAsset = assets.find(a => a.id === data);
            if (soundAsset) {
              playAudioAsset(soundAsset);
            }
          } else if (interaction === 'link') {
            window.open(data, '_blank');
          } else if (interaction === 'modify_number') {
            const targetId = e.currentTarget.getAttribute('data-target-ui');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              const amount = parseFloat(data || '0');
              const innerDiv = targetEl.querySelector('div > div'); // Progress bar inner div
              if (innerDiv && innerDiv.style.width) {
                 const currentVal = parseFloat(innerDiv.style.width);
                 const newVal = Math.max(0, Math.min(100, currentVal + amount));
                 innerDiv.style.width = newVal + '%';
              } else {
                 const textSpan = targetEl.querySelector('span'); // Text element
                 if (textSpan) {
                   const currSpanText = parseFloat(textSpan.textContent || '0');
                   if (!isNaN(currSpanText)) {
                     textSpan.textContent = (currSpanText + amount).toString();
                   }
                 }
              }
            }
          } else if (interaction === 'start_quest') {
            if (data && !state.activeQuests.includes(data) && !state.completedQuests.includes(data)) {
               state.activeQuests.push(data);
               const q = (gameData.quests || []).find(q => q.id === data);
               showSimpleDialogue("Quest Started: " + (q ? q.name : data), "System");
               saveGame();
               buildQuestLog();
            }
	          } else if (interaction === 'complete_quest') {
	            if (data && state.activeQuests.includes(data)) {
	               state.activeQuests = state.activeQuests.filter(id => id !== data);
	               state.completedQuests.push(data);
               const q = (gameData.quests || []).find(q => q.id === data);
               showSimpleDialogue("Quest Completed: " + (q ? q.name : data), "System");
               applyQuestRewards(data);
               saveGame();
	               buildQuestLog();
	            }
	          } else if (interaction === 'complete_quest_objective') {
	            completeQuestObjective(data);
	          } else if (interaction === 'unlock_lore_entry') {
	            unlockLoreEntry(data, false);
	          } else if (interaction === 'show_lore_entry') {
	            unlockLoreEntry(data, true);
	          } else if (interaction === 'set_flag') {
            if (data) {
              state.flags[data] = true;
              checkQuestAutoComplete();
              saveGame();
              updateGameFlagsUI();
            }
          } else if (interaction === 'clear_flag') {
            if (data) {
              delete state.flags[data];
              saveGame();
              updateGameFlagsUI();
            }
          } else if (interaction === 'toggle_flag') {
            if (data) {
              state.flags[data] = !state.flags[data];
              saveGame();
              updateGameFlagsUI();
            }
          } else if (interaction === 'show_object') {
            if (data) {
              const targetEl = document.getElementById(data);
              if (targetEl) { targetEl.style.display = ''; targetEl.style.visibility = 'visible'; }
            }
          } else if (interaction === 'hide_object') {
            if (data) {
              const targetEl = document.getElementById(data);
              if (targetEl) targetEl.style.visibility = 'hidden';
            }
          } else if (interaction === 'toggle_object') {
            if (data) {
              const targetEl = document.getElementById(data);
              if (targetEl) {
                const isHidden = targetEl.style.visibility === 'hidden' || targetEl.style.display === 'none';
                targetEl.style.visibility = isHidden ? 'visible' : 'hidden';
              }
            }
          } else if (interaction === 'advance_day') {
            state.day = (state.day || 1) + 1;
            state.time = 8;
            triggerDayReset();
            const td = document.getElementById('time-display');
            if (td) td.innerText = 'Day ' + state.day + ' · 08:00';
            showSimpleDialogue('A new day begins. Day ' + state.day + '.', 'System');
          } else if (interaction === 'scene_change') {
            document.querySelectorAll('.game-scene').forEach(el => el.style.display = 'none');
            const targetScene = document.getElementById('scene-' + data);
            if (targetScene) {
              targetScene.style.display = 'block';
              state.currentSceneId = data;
              state.flags['visited_scene_' + data] = true;
              playBgm(targetScene.getAttribute('data-bgm') || null);
              checkQuestAutoComplete();
              saveGame();
            } else {
              dialogueBox.innerHTML = 'Error: Cannot load scene ' + data;
              dialogueBox.style.display = 'block';
            }
          } else if (interaction === 'open_ui') {
            const targetUi = obj.getAttribute('data-target-ui');
            if (targetUi) {
              const el = document.getElementById('ui-menu-' + targetUi);
              if (el) {
                el.style.display = 'block';
                if (!state.activeUiMenus.includes(targetUi)) {
                  state.activeUiMenus.push(targetUi);
                }
              }
            }
          } else if (interaction === 'close_ui') {
            const targetUi = obj.getAttribute('data-target-ui');
            if (targetUi) {
              const el = document.getElementById('ui-menu-' + targetUi);
              if (el) {
                el.style.display = 'none';
                state.activeUiMenus = state.activeUiMenus.filter(id => id !== targetUi);
              }
            } else {
              // Close highest z-index visible ui menu? It's easier just to close all, or actually, the DOM structure is flat. Let's just find the last visible one.
              const visibleMenus = Array.from(document.querySelectorAll('.ui-menu-layer')).filter(el => el.style.display !== 'none');
              if (visibleMenus.length > 0) {
                visibleMenus[visibleMenus.length - 1].style.display = 'none';
              }
            }
          } else if (interaction === 'run_script') {
            const scriptSrc = obj.getAttribute('data-script-src');
            if (scriptSrc) {
              fetch(scriptSrc)
                .then(res => res.text())
                .then(code => {
                  try {
                    const func = new Function('state', 'dialogueBox', 'obj', code);
                    func(state, dialogueBox, obj);
                  } catch (err) {
                    console.error("Script execution failed", err);
                  }
                });
            }
          } else if (interaction === 'save_game') {
            saveGame();
            flavorText.innerText = "Game Saved";
            flavorText.style.display = 'block';
            setTimeout(() => flavorText.style.display = 'none', 2000);
          } else if (interaction === 'load_game') {
            location.reload(); 
          } else if (interaction === 'open_crafting') {
            toggleInventory();
            flavorText.innerText = 'Crafting System: Select an item, then click another to combine them!';
            flavorText.style.display = 'block';
            setTimeout(() => flavorText.style.display = 'none', 4000);
          } else if (interaction === 'skill_check') {
            showSimpleDialogue("[Skill Check Success]\\n" + (data || "You succeeded!"), "");
          } else if (interaction === 'toggle_inventory') {
            toggleInventory();
          } else if (interaction === 'toggle_needs_hud') {
            const tracker = document.getElementById('needs-tracker');
            if (tracker) {
              tracker.style.display = getComputedStyle(tracker).display === 'none' ? 'block' : 'none';
            }
          } else if (interaction === 'toggle_skills_hud') {
            const tracker = document.getElementById('skills-tracker');
            if (tracker) {
              tracker.style.display = getComputedStyle(tracker).display === 'none' ? 'block' : 'none';
            }
          } else if (interaction === 'open_quest_log') {
            toggleQuestLog();
          } else if (interaction === 'open_map') {
            toggleMap();
          } else if (interaction === 'open_relationships') {
            toggleRelationships();
          } else if (interaction === 'open_skills') {
            toggleSkills();
          } else if (interaction === 'open_almanac') {
            toggleAlmanac();
          } else if (interaction === 'open_settings') {
            toggleSettings();
          } else if (interaction === 'toggle_fullscreen') {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.();
            } else {
              document.exitFullscreen?.();
            }
          } else if (interaction === 'toggle_mute') {
            state.isMuted = !state.isMuted;
            window.__cavebotMuted = state.isMuted;
            document.querySelectorAll('audio, video').forEach(media => {
              media.muted = state.isMuted;
            });
            if (currentBgmAudio) currentBgmAudio.muted = state.isMuted;
            activeRuntimeAudio.forEach(audio => {
              audio.muted = state.isMuted;
            });
            showSimpleDialogue(state.isMuted ? 'Audio muted.' : 'Audio unmuted.', 'System');
            saveGame();
          } else if (interaction === 'restart_game') {
            try { localStorage.removeItem(gameSaveKey); } catch(e) {}
            location.reload();
          } else if (interaction === 'exit_game') {
            showSimpleDialogue('Game paused.', 'System');
          } else if (interaction === 'gift_item') {
            const charId = data;
            if (!charId) { showSimpleDialogue('Nothing to gift here.', 'System'); return; }
            if (!selectedInventoryItemId) {
              showSimpleDialogue('Open your inventory and select an item to give first.', 'System');
              return;
            }
            const characters = gameData.characters || [];
            const char = characters.find(c => c.id === charId);
            if (!char) { showSimpleDialogue('No one to give it to.', 'System'); return; }
            const pref = (char.giftPreferences || []).find(p => p.itemId === selectedInventoryItemId);
            const itemDef = inventoryItems.find(i => i.id === selectedInventoryItemId);
            const itemName = itemDef ? itemDef.name : selectedInventoryItemId;
            if (pref) {
              state.relationships[charId] = Math.max(-100, Math.min(100, (state.relationships[charId] || (char.defaultAffinity || 0)) + pref.change));
              const reaction = pref.reactionText || (pref.change > 0 ? char.name + ' smiles. "Thank you."' : char.name + ' frowns. "I do not want this."');
              state.inventory = state.inventory.filter(id => id !== selectedInventoryItemId);
              clearInventorySelection();
              updateInventoryUI();
              if (typeof window.buildRelationshipsPanel === 'function') {
                window.buildRelationshipsPanel();
              }
              saveGame();
              showSimpleDialogue(reaction, char.name);
            } else {
              const msg = char.name + ' does not seem interested in ' + itemName + '.';
              showSimpleDialogue(msg, char.name);
            }
          } else if (interaction === 'play_cutscene') {
            const videoAssetId = data;
            const scriptAssetId = obj.getAttribute('data-script-src');
            const videoAsset = assets.find(a => a.id === videoAssetId);
            if (videoAsset) {
                const cutscenePlayer = document.getElementById('cutscene-player');
                const cutsceneVideo = document.getElementById('cutscene-video');
                const skipBtn = document.getElementById('cutscene-skip-btn');
                
                cutscenePlayer.style.display = 'flex';
                cutsceneVideo.src = assetSrc(videoAsset);
                cutsceneVideo.play();
                
                const endCutscene = () => {
                    cutsceneVideo.pause();
                    cutscenePlayer.style.display = 'none';
                    if (scriptAssetId) {
                        document.querySelectorAll('.game-scene').forEach(el => el.style.display = 'none');
                        const targetScene = document.getElementById('scene-' + scriptAssetId);
                        if (targetScene) {
                          targetScene.style.display = 'block';
                          playBgm(targetScene.getAttribute('data-bgm') || null);
                        }
                    }
                };

                cutsceneVideo.onended = endCutscene;
                skipBtn.onclick = endCutscene;
            }
          }
          
          const uiElementType = obj.getAttribute('data-ui-element-type');
          if (uiElementType === 'toggle') {
            const bindingType = obj.getAttribute('data-ui-binding');
            const bindingId = obj.getAttribute('data-ui-binding-id');
            if (bindingType === 'flag' && bindingId) {
               state.flags[bindingId] = !state.flags[bindingId];
               updateGameFlagsUI();
            } else {
               const isChecked = obj.getAttribute('data-local-checked') === 'true';
               const newVal = !isChecked;
               obj.setAttribute('data-local-checked', newVal.toString());
               
               const w = parseFloat(obj.style.width);
               const h = parseFloat(obj.style.height);
               const primary = obj.getAttribute('data-ui-primary') || '#10b981';
               const secondary = obj.getAttribute('data-ui-secondary') || '#525252';
               const bgDiv = obj.querySelector('div');
               const handle = obj.querySelector('div > div');
               if (bgDiv && handle) {
                 bgDiv.style.backgroundColor = newVal ? primary : secondary;
                 handle.style.transform = newVal ? 'translateX(' + (w - h) + 'px)' : 'translateX(0)';
               }
            }
          }
          
          if (!isChainedResponse) {
            try {
              const responses = JSON.parse(
                decodeURIComponent(obj.getAttribute('data-click-responses') || '%5B%5D')
              );
              const responsesToRun = responses;
              const responseAttributes = {
                interaction: 'data-interaction',
                interactionData: 'data-interaction-data',
                giveItemId: 'data-give-item',
                targetUiId: 'data-target-ui',
                dialogueTreeId: 'data-dialogue-tree',
                scriptAssetId: 'data-script-src'
              };
              const originalValues = {};
              Object.values(responseAttributes).forEach(attribute => {
                originalValues[attribute] = obj.getAttribute(attribute);
              });

              responsesToRun.forEach(response => {
                const responseKey = obj.id + '::' + response.id;
                if (response.triggerOnce && state.triggeredRuleIds.includes(responseKey)) {
                  return;
                }
                if (!evaluateRuleConditions(response.conditions || [], response.conditionMode || 'all', state)) {
                  return;
                }
                if (response.triggerOnce) {
                  state.triggeredRuleIds.push(responseKey);
                }
                Object.entries(responseAttributes).forEach(([key, attribute]) => {
                  let value = response[key] || '';
                  if (key === 'scriptAssetId' && value) {
                    const scriptAsset = assets.find(asset => asset.id === value);
                    value = scriptAsset ? assetSrc(scriptAsset, value) : value;
                  }
                  obj.setAttribute(attribute, value);
                });
                handleClick({
                  __chainedResponse: true,
                  currentTarget: obj,
                });
              });

              Object.entries(originalValues).forEach(([attribute, value]) => {
                if (value === null) obj.removeAttribute(attribute);
                else obj.setAttribute(attribute, value);
              });
            } catch (error) {
              console.warn('Could not run additional click responses', error);
            }
          }

          if (interaction !== 'save_game') saveGame();
          } catch(err) {
            console.error(err);
            showSimpleDialogue("Error: " + err.message, "System");
          }
        };
        obj.addEventListener('click', handleClick);
      });
      
      const runtimeOverlayIds = [
        'inventory-overlay',
        'map-overlay',
        'relationships-overlay',
        'skills-overlay',
        'almanac-overlay',
        'settings-overlay',
        'quest-overlay',
      ];

      const closeRuntimeOverlays = (exceptId = '') => {
        runtimeOverlayIds.forEach((id) => {
          if (id === exceptId) return;
          const overlay = document.getElementById(id);
          if (overlay) overlay.style.display = 'none';
        });
        if (exceptId !== 'inventory-overlay') clearInventorySelection();
      };

      const setRuntimeOverlayOpen = (id, onOpen, onClose) => {
        const overlay = document.getElementById(id);
        if (!overlay) return false;
        const opening = overlay.style.display === 'none' || !overlay.style.display;
        closeRuntimeOverlays(opening ? id : '');
        overlay.style.display = opening ? 'flex' : 'none';
        if (opening) onOpen?.(overlay);
        else onClose?.(overlay);
        return opening;
      };
      
      window.toggleInventory = () => {
        setRuntimeOverlayOpen(
          'inventory-overlay',
          () => updateInventoryUI(),
          () => {
            clearInventorySelection();
          },
        );
      };

      window.showMapPanel = (mapId) => {
        const overlay = document.getElementById('map-overlay');
        if (!overlay) return;
        overlay.querySelectorAll('.map-panel').forEach((panel) => {
          panel.style.display = panel.getAttribute('data-map-id') === mapId ? 'block' : 'none';
        });
        overlay.querySelectorAll('[data-map-tab]').forEach((tab) => {
          const active = tab.getAttribute('data-map-tab') === mapId;
          tab.style.borderColor = active ? 'var(--ui-primary)' : 'color-mix(in srgb, var(--ui-primary) 35%, transparent)';
          tab.style.color = active ? 'var(--ui-primary)' : '#e5e5e5';
        });
      };

      window.toggleMap = () => {
        const overlay = document.getElementById('map-overlay');
        if (!overlay) {
          showSimpleDialogue('No world map has been created yet.', 'System');
          return;
        }
        setRuntimeOverlayOpen('map-overlay', () => {
          const firstPanel = overlay.querySelector('.map-panel');
          if (firstPanel) showMapPanel(firstPanel.getAttribute('data-map-id'));
          overlay.querySelectorAll('.map-travel-node').forEach((node) => {
            const requiredFlag = node.getAttribute('data-required-flag');
            node.style.display = !requiredFlag || state.flags[requiredFlag] ? 'block' : 'none';
          });
        });
      };

      window.travelToScene = (sceneId) => {
        if (!sceneId) return;
        document.querySelectorAll('.game-scene').forEach((scene) => {
          scene.style.display = 'none';
        });
        const targetScene = document.getElementById('scene-' + sceneId);
        if (!targetScene) return;
        targetScene.style.display = 'block';
        state.currentSceneId = sceneId;
        playBgm(targetScene.getAttribute('data-bgm') || null);
        saveGame();
        toggleMap();
      };

      window.toggleRelationships = () => {
        setRuntimeOverlayOpen('relationships-overlay', () => buildRelationshipsPanel());
      };

      window.buildRelationshipsPanel = () => {
        const list = document.getElementById('relationships-list');
        if (!list) return;
        const characters = gameData.characters || [];
        const factions = gameData.factions || [];
        if (characters.length === 0 && factions.length === 0) {
          list.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.5;">No relationships recorded yet.</div>';
          return;
        }
        let html = '<div style="display:flex;flex-direction:column;gap:12px;padding:16px;">';
        characters.forEach(char => {
          const value = state.relationships[char.id] ?? (char.defaultAffinity || 0);
          const thresholds = (char.thresholds || []).slice().sort((a,b) => a.value - b.value);
          let stageLabel = 'Unknown';
          let stageColor = 'var(--ui-primary)';
          for (const t of thresholds) { if (value >= t.value) { stageLabel = t.label; stageColor = t.color || 'var(--ui-primary)'; } }
          const pct = Math.round(((value + 100) / 200) * 100);
          const portraitAsset = char.portraitAssetId ? (gameData.assets || []).find(a => a.id === char.portraitAssetId) : null;
          const portraitSrc = assetSrc(portraitAsset);
          html += \`<div style="padding:12px;border:1px solid \${stageColor}40;border-radius:8px;display:flex;gap:12px;align-items:center;">
            \${portraitSrc ? '<img src="' + portraitSrc + '" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid ' + stageColor + '40;" />' : '<div style="width:48px;height:48px;border-radius:6px;border:1px solid ' + stageColor + '40;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>'}
            <div style="flex:1;min-width:0;">
              <div style="font-weight:bold;font-size:14px;">\${char.name}</div>
              <div style="font-size:11px;color:\${stageColor};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">\${stageLabel}</div>
              <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.1);overflow:hidden;">
                <div style="height:100%;width:\${pct}%;background:\${stageColor};border-radius:3px;transition:width 0.3s;"></div>
              </div>
            </div>
          </div>\`;
        });
        const characterTies = characters.flatMap(char => (char.relationships || []).map(tie => ({ ...tie, sourceName: char.name })));
        if (characterTies.length > 0) {
          html += '<div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:var(--ui-primary);opacity:0.7;padding:8px 0 4px 0;">Character ties</div>';
	          characterTies.forEach(tie => {
	            const target = characters.find(char => char.id === tie.characterId);
	            const clr = tie.value >= 20 ? '#10b981' : tie.value <= -20 ? '#ef4444' : '#9ca3af';
	            const kindLabels = {
	              family: 'Family / kin',
	              household: 'Household',
	              rivalry: 'Rivalry',
	              ally: 'Ally / coalition',
	              mentor: 'Mentor / apprentice',
	              romance: 'Romance / longing',
	              debt: 'Debt / obligation',
	              taboo: 'Taboo / forbidden',
	              custom: 'Custom',
	            };
	            const kindLabel = kindLabels[tie.kind || 'custom'] || 'Custom';
	            html += \`<div style="padding:10px 12px;border:1px solid \${clr}40;border-radius:8px;background:rgba(0,0,0,.18);">
	              <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
	                <span style="font-weight:bold;font-size:13px;">\${tie.sourceName} -> \${target ? target.name : 'Unknown character'}</span>
	                <span style="font-size:11px;color:\${clr};font-weight:bold;">\${kindLabel} · \${tie.label || 'Knows'} \${tie.value > 0 ? '+' + tie.value : tie.value}</span>
	              </div>
	              \${(tie.isMutual || tie.isSecret) ? '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">' + (tie.isMutual ? '<span style="font-size:9px;text-transform:uppercase;letter-spacing:.05em;background:rgba(255,255,255,.08);padding:2px 6px;border-radius:999px;">Mutual</span>' : '') + (tie.isSecret ? '<span style="font-size:9px;text-transform:uppercase;letter-spacing:.05em;background:rgba(255,255,255,.08);padding:2px 6px;border-radius:999px;">Secret</span>' : '') + '</div>' : ''}
	              \${tie.notes ? '<div style="font-size:12px;opacity:.75;line-height:1.4;margin-top:6px;white-space:pre-wrap;">' + tie.notes + '</div>' : ''}
	            </div>\`;
	          });
        }
        if (factions.length > 0) {
          html += '<div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:var(--ui-primary);opacity:0.7;padding:8px 0 4px 0;">Factions</div>';
          factions.forEach(faction => {
            const value = state.relationships[faction.id] ?? (faction.defaultAffinity || 0);
            const pct = Math.round(((value + 100) / 200) * 100);
            const clr = value >= 50 ? '#00ffcc' : value >= 0 ? '#7ec8e3' : value >= -50 ? '#e3a87e' : '#e35c5c';
            const label = value >= 50 ? 'Allied' : value >= 10 ? 'Friendly' : value >= -10 ? 'Neutral' : value >= -50 ? 'Unfriendly' : 'Hostile';
            html += \`<div style="padding:10px 12px;border:1px solid \${clr}40;border-radius:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-weight:bold;font-size:14px;">\${faction.name}</span>
                <span style="font-size:12px;color:\${clr};">\${label}</span>
              </div>
              <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.1);overflow:hidden;">
                <div style="height:100%;width:\${pct}%;background:\${clr};border-radius:3px;"></div>
              </div>
            </div>\`;
          });
        }
        const knownRelationshipIds = new Set([...characters.map(char => char.id), ...factions.map(faction => faction.id)]);
        const looseRelationships = Object.entries(state.relationships || {})
          .filter(([id]) => !knownRelationshipIds.has(id))
          .sort(([a], [b]) => a.localeCompare(b));
        if (looseRelationships.length > 0) {
          html += '<div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:var(--ui-primary);opacity:0.7;padding:8px 0 4px 0;">Other live relationship tracks</div>';
          looseRelationships.forEach(([id, value]) => {
            const numericValue = Number(value) || 0;
            const clr = numericValue >= 20 ? '#10b981' : numericValue <= -20 ? '#ef4444' : '#9ca3af';
            html += \`<div style="padding:10px 12px;border:1px solid \${clr}40;border-radius:8px;background:rgba(0,0,0,.18);display:flex;justify-content:space-between;gap:10px;">
              <span style="font-family:monospace;font-size:12px;word-break:break-all;opacity:.75;">\${id}</span>
              <span style="font-size:12px;color:\${clr};font-weight:bold;">\${numericValue > 0 ? '+' + numericValue : numericValue}</span>
            </div>\`;
          });
        }
        html += '</div>';
        list.innerHTML = html;
      };

      window.toggleSkills = () => {
        setRuntimeOverlayOpen('skills-overlay', () => buildSkillsPanel());
      };

	      window.buildSkillsPanel = () => {
	        const list = document.getElementById('skills-list');
	        if (!list) return;
	        const skills = skillTrackDefinitions.length
	          ? skillTrackDefinitions
	          : Object.keys(state.skills).map(id => ({ id, label: id, min: 0, max: 20, color: 'var(--ui-primary)' }));
	        if (skills.length === 0) {
	          list.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.5;">No skills tracked yet.</div>';
	          return;
	        }
	        let html = '<div style="display:flex;flex-direction:column;gap:10px;padding:16px;">';
	        skills.forEach(skill => {
	          const level = state.skills[skill.id] ?? skill.defaultValue ?? 0;
	          const pct = Math.round(percentForTrack(level, skill));
	          html += \`<div style="padding:10px 12px;border:1px solid var(--ui-primary)30;border-radius:8px;">
	            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
	              <span style="font-size:14px;text-transform:capitalize;">\${skill.label || skill.id}</span>
	              <span style="font-size:13px;color:\${skill.color || 'var(--ui-primary)'};font-weight:bold;">\${level} / \${skill.max ?? 20}</span>
	            </div>
	            <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.1);overflow:hidden;">
	              <div style="height:100%;width:\${pct}%;background:\${skill.color || 'var(--ui-primary)'};border-radius:3px;"></div>
	            </div>
	          </div>\`;
	        });
        html += '</div>';
        list.innerHTML = html;
      };

      window.toggleAlmanac = () => {
        setRuntimeOverlayOpen('almanac-overlay', () => buildAlmanacPanel());
      };

      window.buildAlmanacPanel = () => {
        const list = document.getElementById('almanac-list');
        if (!list) return;
        const entries = (gameData.loreEntries || []).filter(e => !e.requiredFlagId || state.flags[e.requiredFlagId] || (state.unlockedLoreEntryIds || []).includes(e.id));
        if (entries.length === 0) {
          list.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.5;">Nothing recorded yet.</div>';
          return;
        }
        let html = '<div style="display:flex;flex-direction:column;gap:12px;padding:16px;">';
        const byCategory = {};
        entries.forEach(e => { const cat = e.category || 'General'; if (!byCategory[cat]) byCategory[cat] = []; byCategory[cat].push(e); });
        Object.entries(byCategory).forEach(([cat, items]) => {
          html += '<div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:var(--ui-primary);opacity:0.7;padding:4px 0;">' + cat + '</div>';
          items.forEach(entry => {
            const quest = entry.questId ? (gameData.quests || []).find(q => q.id === entry.questId) : null;
            const entryType = entry.entryType === 'quest_note' ? 'Quest note' : entry.entryType || 'Lore';
            html += \`<div style="padding:12px;border:1px solid var(--ui-primary)30;border-radius:8px;">
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
                <span style="border:1px solid var(--ui-primary)45;border-radius:999px;color:var(--ui-primary);padding:2px 7px;font-size:10px;font-weight:bold;text-transform:uppercase;">\${entryType}</span>
                \${quest ? '<span style="border:1px solid rgba(255,255,255,.16);border-radius:999px;color:rgba(255,255,255,.7);padding:2px 7px;font-size:10px;">' + quest.name + '</span>' : ''}
              </div>
              <div style="font-weight:bold;font-size:14px;margin-bottom:6px;color:var(--ui-primary);">\${entry.title}</div>
              <div style="font-size:13px;opacity:0.85;line-height:1.5;white-space:pre-wrap;">\${entry.content}</div>
            </div>\`;
          });
        });
        html += '</div>';
        list.innerHTML = html;
      };

      window.toggleSettings = () => {
        setRuntimeOverlayOpen('settings-overlay');
      };

      const getCraftingRequirements = (recipe) => {
        const modern = (recipe.requirements || []).filter(req => req && req.itemId);
        if (modern.length > 0) return modern;
        return [
          recipe.ingredient1Id ? { itemId: recipe.ingredient1Id, consume: !!recipe.destroyIngredient1 } : null,
          recipe.ingredient2Id ? { itemId: recipe.ingredient2Id, consume: !!recipe.destroyIngredient2 } : null,
          recipe.ingredient3Id ? { itemId: recipe.ingredient3Id, consume: recipe.destroyIngredient3 !== false } : null,
        ].filter(Boolean);
      };

      const craftingRecipeMatches = (recipe, selectedIds) => {
        const selected = selectedIds.filter(Boolean).slice().sort();
        const required = getCraftingRequirements(recipe).map(req => req.itemId).sort();
        if (selected.length === 0 || selected.length !== required.length) return false;
        return selected.every((itemId, index) => itemId === required[index]);
      };

      const craftingRecipeCanAccept = (recipe, selectedIds) => {
        const selected = selectedIds.filter(Boolean);
        const required = getCraftingRequirements(recipe).map(req => req.itemId);
        if (selected.length === 0 || selected.length >= required.length) return false;
        const requiredCounts = {};
        required.forEach(itemId => { requiredCounts[itemId] = (requiredCounts[itemId] || 0) + 1; });
        return selected.every(itemId => {
          if (!requiredCounts[itemId]) return false;
          requiredCounts[itemId] -= 1;
          return true;
        });
      };

      const applyCraftingRecipe = (recipe) => {
        getCraftingRequirements(recipe).forEach(req => {
          if (!req.consume) return;
          const itemIndex = state.inventory.indexOf(req.itemId);
          if (itemIndex !== -1) state.inventory.splice(itemIndex, 1);
        });
        const itemOutcomes = (recipe.outcomes || []).filter(outcome => outcome.type === 'give_item' && outcome.targetId);
        if (itemOutcomes.length > 0) {
          itemOutcomes.forEach(outcome => addInventoryItem(outcome.targetId));
        } else if (recipe.resultItemId) {
          addInventoryItem(recipe.resultItemId);
        }
        (recipe.outcomes || []).forEach(outcome => {
          if (!outcome.targetId) return;
          if (outcome.type === 'set_flag') {
            state.flags[outcome.targetId] = true;
            updateGameFlagsUI();
          } else if (outcome.type === 'clear_flag') {
            delete state.flags[outcome.targetId];
            updateGameFlagsUI();
          } else if (outcome.type === 'change_need') {
            state.needs[outcome.targetId] = Math.max(0, Math.min(100, (state.needs[outcome.targetId] || 0) + (outcome.amount || 0)));
            updateNeedsUI();
          } else if (outcome.type === 'change_skill') {
            state.skills[outcome.targetId] = Math.max(0, Math.min(20, (state.skills[outcome.targetId] || 0) + (outcome.amount || 0)));
            updateSkillsUI();
          } else if (outcome.type === 'start_quest') {
            if (!state.activeQuests.includes(outcome.targetId) && !state.completedQuests.includes(outcome.targetId)) {
              state.activeQuests.push(outcome.targetId);
              buildQuestLog();
            }
          } else if (outcome.type === 'complete_quest') {
            state.activeQuests = state.activeQuests.filter(id => id !== outcome.targetId);
            if (!state.completedQuests.includes(outcome.targetId)) state.completedQuests.push(outcome.targetId);
            buildQuestLog();
          }
        });
      };

      let selectedInventoryItemId = null;
      let selectedInventoryItemIds = [];

      const clearInventorySelection = () => {
        selectedInventoryItemId = null;
        selectedInventoryItemIds = [];
      };

      window.handleInventoryItemClick = (itemId) => {
        const itemDef = inventoryItems.find(i => i.id === itemId);
        if (!itemDef) return;

        if (selectedInventoryItemIds.includes(itemId)) {
          clearInventorySelection();
          toggleInventory();
          flavorText.innerText = itemDef.description ? ('(Item): ' + itemDef.description) : ('You look at: ' + itemDef.name);
          flavorText.style.display = 'block';
          setTimeout(() => flavorText.style.display = 'none', 3000);
        } else if (selectedInventoryItemIds.length > 0) {
             const nextSelection = [...selectedInventoryItemIds, itemId];
             const combination = (gameData.craftingRecipes || []).find(r =>
               craftingRecipeMatches(r, nextSelection)
             );
             if (combination) {
                 applyCraftingRecipe(combination);
                 clearInventorySelection();
                 flavorText.innerText = combination.successMessage || 'Items combined successfully!';
                 flavorText.style.display = 'block';
                 setTimeout(() => flavorText.style.display = 'none', 3000);
                 saveGame();
             } else if ((gameData.craftingRecipes || []).some(r => craftingRecipeCanAccept(r, nextSelection))) {
                 selectedInventoryItemIds = nextSelection;
                 selectedInventoryItemId = selectedInventoryItemIds[0] || null;
             } else {
                 flavorText.innerText = 'These objects do not combine.';
                 flavorText.style.display = 'block';
                 setTimeout(() => flavorText.style.display = 'none', 3000);
                 clearInventorySelection();
             }
        } else {
          selectedInventoryItemId = itemId;
          selectedInventoryItemIds = [itemId];
        }
        updateInventoryUI();
      };
      
      window.useInventoryItem = (event, itemId) => {
        event.stopPropagation();
        const itemDef = inventoryItems.find(i => i.id === itemId);
        if (!itemDef || !itemDef.isUsable) return;
        
        if (itemDef.consumeOnUse) {
           const idIdx = state.inventory.indexOf(itemDef.id);
           if (idIdx !== -1) state.inventory.splice(idIdx, 1);
        }
        
        if (itemDef.useSoundAssetId) {
           const sound = assets.find(a => a.id === itemDef.useSoundAssetId);
           if (sound) {
               playAudioAsset(sound);
           }
        }
        
        clearInventorySelection();
        toggleInventory();
        flavorText.innerText = itemDef.useMessage || 'You used ' + itemDef.name + '.';
        flavorText.style.display = 'block';
        setTimeout(() => flavorText.style.display = 'none', 3000);
        saveGame();
        updateInventoryUI();
      };

      const gameQuests = gameData.quests || [];
      window.toggleQuestLog = () => {
        setRuntimeOverlayOpen('quest-overlay', () => buildQuestLog());
      };

      // Called at midnight each continuous cycle, or when advance_day fires
      window.triggerDayReset = () => {
        // Clear per-day flags (flags prefixed with "daily_")
        Object.keys(state.flags).forEach(k => {
          if (k.startsWith('daily_')) delete state.flags[k];
        });
        // Re-show objects that use the daily respawn pattern (data-daily-respawn attribute)
        document.querySelectorAll('[data-daily-respawn="true"]').forEach(el => {
          el.style.visibility = 'visible';
          el.style.display = '';
        });
        saveGame();
      };

      window.buildQuestLog = () => {
        const questList = document.getElementById('quest-list');
        if (!questList) return;
        
        const visibleQuests = gameQuests.filter(q => state.activeQuests.includes(q.id) || state.completedQuests.includes(q.id));
        if (visibleQuests.length === 0) {
           questList.innerHTML = '<div style="text-align: center; padding: 40px; opacity: 0.5;">Your journal is empty.</div>';
           return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 16px; padding: 16px;">';
        visibleQuests.forEach(q => {
           const isCompleted = state.completedQuests.includes(q.id);
           const color = isCompleted ? 'var(--ui-primary)' : '#fff';
           const border = isCompleted ? 'var(--ui-primary)' : 'var(--ui-primary)';
           const opacity = isCompleted ? '1' : '0.4';
           
           html += \`<div style="padding: 16px; border: 2px solid \${border}; border-radius: 8px; border-opacity: \${opacity}">
              <h3 style="margin: 0 0 8px 0; color: \${color};">
                  \${q.name} \${isCompleted ? '✓' : ''}
              </h3>
              <p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.8; line-height: 1.4;">\${q.description}</p>
              \`
           if (q.objectives && q.objectives.length > 0) {
              html += \`<div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: var(--ui-primary); margin-bottom: 8px;">Objectives</div>\`;
              q.objectives.forEach(obj => {
	                 let isDone = isQuestObjectiveDone(obj);
                 
                 html += \`<div style="margin-bottom: 4px; display: flex; align-items: center; gap: 8px; font-size: 13px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--ui-primary); background: \${isDone ? 'var(--ui-primary)' : 'transparent'};"></div>
                    <span style="opacity: \${isDone ? 0.5 : 1}; text-decoration: \${isDone ? 'line-through' : 'none'};">\${obj.description}</span>
                 </div>\`;
              })
           }
           html += \`</div>\`;
        });
        html += '</div>';
        questList.innerHTML = html;
      };

      const updateInventoryUI = () => {
        const invList = document.getElementById('inventory-list');
        const badge = document.getElementById('inv-badge');
        
        if (badge) {
          badge.textContent = state.inventory.length;
          badge.style.display = state.inventory.length > 0 ? 'flex' : 'none';
        }

        updateSmartUiRegions();
        if (!invList) return;
        
        if (state.inventory.length === 0) {
          invList.innerHTML = '<div class="inventory-empty"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5; margin:0 auto 16px auto; display:block;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line><line x1="9" y1="7" x2="15" y2="7"></line></svg><p style="margin:0">Your inventory is empty.</p></div>';
          return;
        }

        let html = '<div class="inventory-grid">';
        state.inventory.forEach(itemId => {
          const itemDef = inventoryItems.find(i => i.id === itemId);
          if (!itemDef) {
            html += '<div class="inventory-item unknown"><div style="font-weight:bold;color:var(--ui-primary);">Unlinked item</div><div style="font-family:monospace;font-size:11px;word-break:break-all;opacity:.75;margin-top:6px;">' + itemId + '</div></div>';
            return;
          }
          const iconAsset = itemDef.iconAssetId ? assets.find(a => a.id === itemDef.iconAssetId) : null;
          
          let iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>';
          const iconSrc = assetSrc(iconAsset);
          if (iconSrc) {
            iconHtml = '<img src="' + iconSrc + '" alt="' + itemDef.name + '" draggable="false" />';
          }
          
          const isSelected = selectedInventoryItemIds.includes(itemId);
          const hasSelection = selectedInventoryItemIds.length > 0;
          
          let extraStyle = '';
          if (isSelected) {
            extraStyle = 'border-color: var(--ui-primary); background-color: rgba(0,0,0,0.6); box-shadow: 0 0 20px color-mix(in srgb, var(--ui-primary) 50%, transparent); transform: scale(1.05); z-index: 10;';
            iconHtml = '<div style="position: absolute; top: 4px; left: 4px; background-color: var(--ui-primary); color: var(--ui-bg); font-size: 8px; font-weight: bold; padding: 2px 4px; border-radius: 4px; z-index: 20;">SELECTED</div>' + iconHtml;
          } else if (hasSelection) {
            iconHtml = '<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 15; opacity: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity=\\'1\\'" onmouseout="this.style.opacity=\\'0\\'"><div style="background: rgba(0,0,0,0.8); color: white; padding: 4px; border-radius: 4px; font-size: 10px; font-weight: bold;">Combine?</div></div>' + iconHtml;
          }

          html += '<div class="inventory-item" style="position: relative; ' + extraStyle + '" onclick="handleInventoryItemClick(\\'' + itemDef.id + '\\')">';
          html += '<div class="inventory-item-icon" style="position: relative; overflow: hidden;">' + iconHtml + '</div>';
          html += '<div class="inventory-item-info">';
          html += '<h3 class="inventory-item-name">' + itemDef.name + '</h3>';
          if (itemDef.description) {
            html += '<p class="inventory-item-desc">' + itemDef.description + '</p>';
          }
          
          if (isSelected && itemDef.isUsable) {
            html += '<button onclick="useInventoryItem(event, \\'' + itemDef.id + '\\')" style="margin-top: 8px; width: 100%; border: none; background: var(--ui-primary); color: var(--ui-bg); font-weight: bold; cursor: pointer; padding: 6px; border-radius: 4px; font-size: 12px; transition: filter 0.2s;" onmouseover="this.style.filter=\\'brightness(1.2)\\'" onmouseout="this.style.filter=\\'none\\'">USE ITEM</button>';
          }
          
          html += '</div></div>';
        });
        html += '</div>';
        invList.innerHTML = html;
      };
      
      // Initial render for the badge
      updateInventoryUI();
      window.__cavebotRefreshAssetLinkedViews = () => {
        updateInventoryUI();
        if (typeof updateSmartUiRegions === 'function') updateSmartUiRegions();
        if (globalCursorAssetId && typeof setAnimatedCursor === 'function') {
          setAnimatedCursor(globalCursorAssetId);
        }
      };
    };
    initGame();
    relinkMissingAssetsFromGitHub().catch(error => {
      console.warn('Cavebot export relink failed after init.', error);
    });
  `;

  let hudHtml = "";
  if (project.globalSettings?.hudOverlay) {
    const overlay = project.globalSettings.hudOverlay;
    const asset = project.assets.find((a) => a.id === overlay.assetId);
    if (asset) {
      const hudSrc = resolveAssetSrc(asset);
      const bgSize = overlay.position === "stretch" ? "100% 100%" : (overlay.position ? "contain" : "100% 100%");
      let bgPos = "center";
      if (overlay.position === "top-left") bgPos = "top left";
      if (overlay.position === "top-right") bgPos = "top right";
      if (overlay.position === "bottom-left") bgPos = "bottom left";
      if (overlay.position === "bottom-right") bgPos = "bottom right";
      bgPos = `${bgPos}`; // Just to ensure clean bgPos
      const ptrEvents = overlay.pointerEvents === "auto" ? "auto" : "none";
      const scale = overlay.scale ?? 1;
      // Handle x/y offsets
      let tx = overlay.offsetX || 0;
      let ty = overlay.offsetY || 0;
      const tform = `scale(${scale}) translate(${tx}px, ${ty}px)`;
      
      hudHtml = `
      <div id="global-hud-overlay" style="position: absolute; left: 0px; top: 0px; width: ${exportWidth}px; height: ${exportHeight}px; background-image: url('${hudSrc}'); background-size: ${bgSize}; background-position: ${bgPos}; background-repeat: no-repeat; transform: ${tform}; pointer-events: ${ptrEvents}; z-index: 99999; mix-blend-mode: ${overlay.blendMode || "normal"}; opacity: ${overlay.opacity ?? 1};"></div>
      `;
    }
  }

  let deviceFrameHtml = "";
  let deviceControlsHtml = "";
  if (hasDeviceFrame && deviceFrame && deviceFrameAsset) {
    const frameSrc = resolveAssetSrc(deviceFrameAsset);
    const aperture = deviceFrameAperture!;
    const slices = [
      { x: 0, y: 0, width: deviceFrame.outerWidth, height: aperture.y },
      {
        x: 0,
        y: aperture.y,
        width: aperture.x,
        height: aperture.height,
      },
      {
        x: aperture.x + aperture.width,
        y: aperture.y,
        width:
          deviceFrame.outerWidth -
          aperture.x -
          aperture.width,
        height: aperture.height,
      },
      {
        x: 0,
        y: aperture.y + aperture.height,
        width: deviceFrame.outerWidth,
        height:
          deviceFrame.outerHeight -
          aperture.y -
          aperture.height,
      },
    ].filter((slice) => slice.width > 0 && slice.height > 0);
    deviceFrameHtml = `
      <div id="device-frame" style="position:absolute; inset:0; z-index:4000; pointer-events:none; user-select:none;">
        ${slices
          .map(
            (slice) => `
          <div style="position:absolute; overflow:hidden; left:${slice.x}px; top:${slice.y}px; width:${slice.width}px; height:${slice.height}px;">
            <img src="${frameSrc}" alt="" draggable="false" style="position:absolute; max-width:none; width:${deviceFrame.outerWidth}px; height:${deviceFrame.outerHeight}px; left:${-slice.x}px; top:${-slice.y}px; pointer-events:none; user-select:none;" />
          </div>`,
          )
          .join("")}
      </div>
    `;
    deviceControlsHtml = (deviceFrame.controls || [])
      .map((control) => {
        return `
        <button
          id="shell-control-${control.id}"
          class="scene-object shell-control"
          type="button"
          aria-label="${control.name.replace(/"/g, "&quot;")}"
          data-object-name="${control.name.replace(/"/g, "&quot;")}"
          data-object-asset-id=""
          data-interaction="none"
          data-interaction-data=""
          data-give-item=""
          data-target-ui=""
          data-dialogue-tree=""
          data-script-src=""
          data-click-responses="${encodeURIComponent(JSON.stringify(control.clickResponses || []))}"
          data-cursor-asset="${control.cursorAssetId || ""}"
          style="position:absolute; left:${control.x}px; top:${control.y}px; width:${control.width}px; height:${control.height}px; z-index:4500; border:0; padding:0; background:transparent; cursor:${hasCursorAsset(control.cursorAssetId) ? "none" : control.cursor || "pointer"};"
        ></button>`;
      })
      .join("");
  }

  const mapOverlayHtml = (project.maps || []).length
    ? `
      <div id="map-overlay" class="runtime-screen-overlay" onclick="toggleMap()" style="display:none; z-index:100001; align-items:stretch; justify-content:stretch; padding:0; background:#000;">
        <div onclick="event.stopPropagation()" style="position:absolute; inset:0; width:100%; height:100%; overflow:hidden; background:var(--ui-bg); color:white;">
          ${(project.maps || [])
            .map(
              (map) => `
              <section class="map-panel" data-map-id="${map.id}" style="display:none; position:absolute; inset:0; overflow:hidden; background:#000;">
                ${
                  map.backgroundSrc
                    ? `<img src="${map.backgroundSrc}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:${map.backgroundFit === "fill" ? "fill" : map.backgroundFit || "contain"}; transform:translate(${map.backgroundOffsetX ?? 0}%, ${map.backgroundOffsetY ?? 0}%) scale(${map.backgroundScale ?? 1}); transform-origin:center; pointer-events:none; user-select:none;" />`
                    : `<div style="position:absolute; inset:0; background:rgba(255,255,255,.05);"></div>`
                }
                  ${map.nodes
                    .map(
                      (node) => `
                      <button
                        class="map-travel-node"
                        data-required-flag="${node.requiredFlagId || ""}"
                        onclick="travelToScene('${node.targetSceneId || ""}')"
                        ${node.targetSceneId ? "" : "disabled"}
                        style="position:absolute; left:clamp(32px, ${node.x}%, calc(100% - 32px)); top:clamp(40px, ${node.y}%, calc(100% - 40px)); transform:translate(-50%,-50%); display:flex; max-width:92px; flex-direction:column; align-items:center; border:0; padding:0; color:white; background:transparent; cursor:${node.targetSceneId ? "pointer" : "default"};"
                      >
                        <span class="map-node-icon" style="display:flex; width:32px; height:32px; align-items:center; justify-content:center; border:2px solid var(--ui-primary); border-radius:999px; background:rgba(0,0,0,.25); box-shadow:0 6px 18px rgba(0,0,0,.55);">
                          ${
                            node.iconSrc
                              ? `<img src="${node.iconSrc}" alt="" style="width:24px; height:24px; object-fit:contain; opacity:.8; pointer-events:none;" />`
                              : `<span style="font-size:18px; line-height:1; opacity:.8;">⌖</span>`
                          }
                        </span>
                        <span class="map-node-label" style="margin-top:4px; max-width:92px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; border:1px solid color-mix(in srgb, var(--ui-primary) 40%, transparent); border-radius:4px; background:rgba(0,0,0,.78); color:var(--ui-primary); padding:2px 5px; font-size:9px; font-weight:bold; line-height:1.1;">${node.name}</span>
                      </button>`,
                    )
                    .join("")}
              </section>`,
            )
            .join("")}
          <div style="position:absolute; left:4px; right:4px; top:4px; z-index:5; display:flex; align-items:flex-start; justify-content:space-between; gap:8px; pointer-events:none;">
            <div style="display:flex; max-width:72%; flex-wrap:wrap; gap:4px; pointer-events:auto;">
              ${(project.maps || [])
                .map(
                  (map) => `
                  <button type="button" data-map-tab="${map.id}" onclick="showMapPanel('${map.id}')" style="border:1px solid color-mix(in srgb, var(--ui-primary) 35%, transparent); border-radius:4px; background:rgba(0,0,0,.72); color:#e5e5e5; padding:3px 6px; font-size:9px; font-weight:bold; line-height:1; cursor:pointer;">${map.name}</button>`,
                )
                .join("")}
            </div>
            <button type="button" onclick="toggleMap()" style="pointer-events:auto; border:1px solid color-mix(in srgb, var(--ui-primary) 55%, transparent); border-radius:4px; background:rgba(0,0,0,.72); color:var(--ui-primary); padding:3px 5px; font-size:11px; font-weight:bold; line-height:1; cursor:pointer;">×</button>
          </div>
        </div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <style>
    ${css}
    /* Custom User CSS */
    ${project.globalSettings?.customCss || ""}
  </style>
</head>
<body>
  <img id="animated-game-cursor" alt="" aria-hidden="true" />
  <div id="scale-wrapper">
    <div id="game-layout-resizer">
      <div id="game-positioner">
        ${deviceFrameHtml}
        ${deviceControlsHtml}
        <div id="game-coordinate-space" style="position: absolute; z-index: 100; overflow: hidden; left: ${deviceScreenLeft}px; top: ${deviceScreenTop}px; width: ${exportWidth}px; height: ${exportHeight}px; transform: scale(${deviceScreenScaleX}, ${deviceScreenScaleY}); transform-origin: top left;">
        ${hudHtml}
        <div id="game-container" style="position: absolute; inset: 0; overflow: hidden; width: 100%; height: 100%;">
          ${scenesHtml}
        </div>
        
        <div id="ui-layer" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;">
          <!-- Custom UI Menus -->
          ${uiMenusHtml}
        </div>

        <div id="cutscene-player" class="runtime-screen-overlay" style="display: none; z-index: 99998; background: black; justify-content: center; align-items: center;">
            <video id="cutscene-video" class="w-full h-full object-contain" style="max-width: 100%; max-height: 100%; object-fit: contain;"></video>
            <button id="cutscene-skip-btn" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer;">Skip</button>
        </div>
        ${mapOverlayHtml}

        ${project.globalSettings?.dialoguePosition !== 'below' ? '<div id="dialogue-box"></div>' : ''}
        <div id="flavor-text"></div>
        <div id="game-transition" class="runtime-screen-overlay" style="display: none; z-index: 99999; background: black; opacity: 0; pointer-events: none; transition: opacity 0.5s ease;"></div>
        
        ${
          (project.globalSettings?.hideAllDefaultHud || project.globalSettings?.hideDefaultInventoryBtn)
            ? ""
            : `
      <button id="inv-toggle-btn" onclick="toggleInventory()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ui-primary)"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>
        <div id="inv-badge" class="inv-badge">0</div>
      </button>
      `
        }

        ${
          (project.quests && project.quests.length > 0) && !project.globalSettings?.hideAllDefaultHud && !project.globalSettings?.hideDefaultQuestLogBtn
            ? `
      <button id="quest-toggle-btn" onclick="toggleQuestLog()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ui-primary)"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
      </button>
      `
            : ""
        }

      
	      ${project.globalSettings?.enableNeeds ? `<div id="needs-tracker">
	        ${needTracks
            .filter((need) => need.visibleInHud !== false)
            .map(need => 
	          `<div>${escapeHtml(need.label || need.id)} <div class="need-bar"><div id="need-${need.domId}" class="need-fill" style="background:${escapeHtml(need.color || "#4ade80")}"></div></div></div>`
	        ).join('')}
	      </div>` : ''}
	      
	      ${project.globalSettings?.enableTTRPGStats ? `<div id="skills-tracker">
	        ${skillTracks
            .filter((skill) => skill.visibleInHud !== false)
            .map(skill => 
	          `<div>${escapeHtml(skill.label || skill.id)} <div class="need-bar"><div id="skill-${skill.domId}" class="need-fill" style="background:${escapeHtml(skill.color || "#00ffcc")}"></div></div></div>`
	        ).join('')}
	      </div>` : ''}
      
      <div id="time-tracker">
        <div style="font-weight: bold; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 4px; margin-top: 4px;">
           TIME: <span id="time-display">08:00</span>
        </div>
      </div>

  <!-- Runtime screens live inside the device screen cutout so they honor frame masks. -->
  <div id="inventory-overlay" class="runtime-screen-overlay" onclick="toggleInventory()">
    <div class="inventory-box" onclick="event.stopPropagation()">
      <div class="inventory-header">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>
          Inventory
        </h2>
        <button class="close-btn" onclick="toggleInventory()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="inventory-content">
        <div id="inventory-list"></div>
      </div>
    </div>
  </div>

  <div id="quest-overlay" class="runtime-screen-overlay" onclick="toggleQuestLog()" style="display: none; align-items:stretch; justify-content:stretch; background: rgba(0,0,0,0.62); backdrop-filter:blur(4px); z-index: 100000; padding: 6%;">
    <div class="inventory-box" onclick="event.stopPropagation()">
      <div class="inventory-header">
        <h2>Quest Log</h2>
        <button class="close-btn" onclick="toggleQuestLog()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="inventory-content" style="overflow-y: auto;">
        <div id="quest-list"></div>
      </div>
    </div>
  </div>

  <!-- Relationships, Skills, Almanac overlays -->
  <div id="relationships-overlay" class="runtime-screen-overlay" onclick="toggleRelationships()" style="display:none;background:rgba(0,0,0,0.62);backdrop-filter:blur(4px);z-index:100000;align-items:stretch;justify-content:stretch;padding:6%;">
    <div class="inventory-box" onclick="event.stopPropagation()">
      <div class="inventory-header">
        <h2>Relationships</h2>
        <button class="close-btn" onclick="toggleRelationships()">✕</button>
      </div>
      <div class="inventory-content" style="overflow-y:auto;">
        <div id="relationships-list"></div>
      </div>
    </div>
  </div>

  <div id="skills-overlay" class="runtime-screen-overlay" onclick="toggleSkills()" style="display:none;background:rgba(0,0,0,0.62);backdrop-filter:blur(4px);z-index:100000;align-items:stretch;justify-content:stretch;padding:6%;">
    <div class="inventory-box" onclick="event.stopPropagation()">
      <div class="inventory-header">
        <h2>Skills</h2>
        <button class="close-btn" onclick="toggleSkills()">✕</button>
      </div>
      <div class="inventory-content" style="overflow-y:auto;">
        <div id="skills-list"></div>
      </div>
    </div>
  </div>

  <div id="almanac-overlay" class="runtime-screen-overlay" onclick="toggleAlmanac()" style="display:none;background:rgba(0,0,0,0.62);backdrop-filter:blur(4px);z-index:100000;align-items:stretch;justify-content:stretch;padding:6%;">
    <div class="inventory-box" onclick="event.stopPropagation()">
      <div class="inventory-header">
        <h2>Almanac</h2>
        <button class="close-btn" onclick="toggleAlmanac()">✕</button>
      </div>
      <div class="inventory-content" style="overflow-y:auto;">
        <div id="almanac-list"></div>
      </div>
    </div>
  </div>

  <div id="settings-overlay" class="runtime-screen-overlay" onclick="toggleSettings()" style="display:none;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:100000;align-items:stretch;justify-content:stretch;padding:8%;">
    <div class="inventory-box" onclick="event.stopPropagation()">
      <div class="inventory-header">
        <h2>Settings</h2>
        <button class="close-btn" onclick="toggleSettings()">✕</button>
      </div>
      <div class="inventory-content" style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="saveGame(); showSimpleDialogue('Game saved.', 'System'); toggleSettings();" style="border:1px solid var(--ui-primary);background:rgba(0,0,0,.28);color:var(--ui-primary);padding:10px;border-radius:var(--ui-radius);font-weight:bold;cursor:pointer;">Save Game</button>
        <button onclick="location.reload();" style="border:1px solid var(--ui-primary);background:rgba(0,0,0,.28);color:var(--ui-primary);padding:10px;border-radius:var(--ui-radius);font-weight:bold;cursor:pointer;">Load Game</button>
        <button onclick="if(!document.fullscreenElement){document.documentElement.requestFullscreen?.();}else{document.exitFullscreen?.();}" style="border:1px solid var(--ui-primary);background:rgba(0,0,0,.28);color:var(--ui-primary);padding:10px;border-radius:var(--ui-radius);font-weight:bold;cursor:pointer;">Fullscreen</button>
        <button onclick="try { localStorage.removeItem(window.__CAVEBOT_SAVE_KEY__); } catch(e) {} location.reload();" style="border:1px solid #ef4444;background:rgba(127,29,29,.35);color:#fecaca;padding:10px;border-radius:var(--ui-radius);font-weight:bold;cursor:pointer;">Restart Game</button>
      </div>
    </div>
  </div>
  </div> <!-- Close game-coordinate-space -->
  </div> <!-- Close game-positioner -->
  </div> <!-- Close game-layout-resizer -->
  ${project.globalSettings?.dialoguePosition === 'below' ? '<div id="dialogue-box"></div>' : ''}
  </div> <!-- Close scale-wrapper -->

  <script id="__GAME_DATA__" type="application/json">${JSON.stringify(project).split("</script>").join("<\\/script>").split("</SCRIPT>").join("<\\/script>")}</script>
  <script>${js}</script>
</body>
</html>`;
}
