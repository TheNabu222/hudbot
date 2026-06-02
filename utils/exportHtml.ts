import { Project, Scene } from "../types";

export function generateExportHtml(project: Project): string {
  // Strip duplicate base64 srcs from objects since they are already stored in assets
  const strippedProject = {
    ...project,
    scenes: project.scenes.map((s) => ({
      ...s,
      objects: s.objects.map((o) => {
        if (o.src && o.src.startsWith("data:") && project.assets.some(a => a.src === o.src)) {
          return { ...o, src: "" };
        }
        return o;
      })
    })),
    uiMenus: project.uiMenus ? project.uiMenus.map((m) => ({
      ...m,
      objects: m.objects.map((o) => {
        if (o.src && o.src.startsWith("data:") && project.assets.some(a => a.src === o.src)) {
          return { ...o, src: "" };
        }
        return o;
      })
    })) : []
  };

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

  const css = `
    :root {
      --time-filter: brightness(1) sepia(0) hue-rotate(0deg);
      ${project.globalSettings?.customCursorAssetId ? `--custom-cursor: url('${project.assets.find((a) => a.id === project.globalSettings?.customCursorAssetId)?.src}'), auto;` : ""}
    }
    * {
      ${project.globalSettings?.customCursorAssetId ? `cursor: var(--custom-cursor) !important;` : ""}
    }
    body {
      margin: 0;
      padding: 0;
      background-image: 
        linear-gradient(#4d004d 1px, transparent 1px),
        linear-gradient(90deg, #4d004d 1px, transparent 1px);
      background-size: 20px 20px;
      background-color: #0d001a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      overflow: visible;
      cursor: crosshair;
      color: #ff00ff;
      background-color: #1a1a1a;
    }
    * {
      border-radius: 0 !important;
    }
    #game-container {
      position: relative;
      width: ${exportWidth}px;
      height: ${exportHeight}px;
      /* background-color handles inside scene divs */
      background-color: #000;
      overflow: hidden;
      box-shadow: 6px 6px 0px #ff00ff, 12px 12px 0px #00ffff;
      border: 4px dotted #ff00ff;
      filter: var(--time-filter);
      transition: filter 2s ease;
    }
    .scene-object {
      position: absolute;
      user-select: none;
      transform-origin: center center;
      touch-action: none;
      background-color: rgba(255, 255, 255, 0.01);
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
      --ui-primary: ${project.globalSettings?.uiColorPrimary || "#10b981"};
      --ui-font: ${project.globalSettings?.uiFontFamily || "sans-serif"};
      --ui-radius: ${project.globalSettings?.uiBorderRadius ?? 8}px;
    }

    #dialogue-box {
      display: none;
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 800px;
      background-color: color-mix(in srgb, var(--ui-bg) 95%, transparent);
      color: #e5e5e5;
      padding: 0;
      border-radius: var(--ui-radius);
      border: 2px solid color-mix(in srgb, var(--ui-primary) 50%, transparent);
      font-size: 18px;
      font-family: var(--ui-font);
      pointer-events: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px color-mix(in srgb, var(--ui-primary) 40%, transparent);
      backdrop-filter: blur(8px);
      overflow: hidden;
      z-index: 20000;
    }

    .dialogue-title {
      padding: 12px 24px;
      background-color: rgba(0,0,0,0.3);
      border-bottom: 1px solid color-mix(in srgb, var(--ui-primary) 50%, transparent);
      font-weight: bold;
      color: var(--ui-primary);
      letter-spacing: 0.025em;
    }

    .dialogue-content {
      padding: 24px;
      display: flex;
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
      align-items: center;
      justify-content: center;
      padding: 32px;
      backdrop-filter: blur(4px);
      z-index: 20001;
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
      font-size: 20px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
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
      padding: 24px;
      color: #e5e5e5;
    }
    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
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

    const peStr = obj.ignoreClicks ? "pointer-events: none;" : "";

    const style = `
      left: ${obj.x}px;
      top: ${obj.y}px;
      width: ${obj.width}px;
      height: ${obj.height}px;
      z-index: ${obj.zIndex ?? 100};
      opacity: ${obj.opacity === 0 ? 0.01 : (obj.opacity ?? 1)};
      transform: rotate(${obj.rotation || 0}deg);
      cursor: ${obj.cursor || "pointer"};
      mix-blend-mode: ${obj.blendMode || "normal"};
      ${peStr}
      ${animStyle}
    `;

    const classes = ["scene-object"];
    if (obj.isHitbox || obj.opacity === 0) classes.push("hitbox");
    if (obj.customCssClasses) classes.push(obj.customCssClasses);

    const dataAttrs = `
      data-interaction="${obj.interaction}"
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
      data-script-src="${obj.scriptAssetId ? (project.assets || []).find((a) => a.id === obj.scriptAssetId)?.src || "" : ""}"
      data-ui-binding="${obj.uiBindingType || ""}"
      data-ui-binding-id="${obj.uiBindingId || ""}"
      data-ui-element-type="${obj.uiElementType || ""}"
      data-local-checked="${!!obj.uiChecked}"
      data-ui-primary="${obj.uiColorPrimary || ""}"
      data-ui-secondary="${obj.uiColorSecondary || ""}"
      data-show-flag="${(obj.showIfFlag || "").replace(/"/g, "&quot;")}"
      data-hide-flag="${(obj.hideIfFlag || "").replace(/"/g, "&quot;")}"
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
      if (obj.uiElementType === "panel") {
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
      const imgStyle = `width: 100%; height: 100%; object-fit: fill; transform: scaleX(${obj.flipX ? -1 : 1}) scaleY(${obj.flipY ? -1 : 1}); filter: ${filters};`;
      const asset = project.assets.find(a => a.src === obj.src);
      const assetDataAttr = asset ? `data-asset-id="${asset.id}" data-runtime-src="true"` : `src="${obj.src}"`;
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
        return `
        <div id="ui-menu-${menu.id}" class="ui-menu-layer" style="display: ${menu.isOpenByDefault ? "block" : "none"}; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: ${w}px; height: ${h}px; pointer-events: ${pe}; overflow: visible; z-index: ${10000 + idx}; background-color: ${menu.backgroundColor || "transparent"}">
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
    let activeDialogue = null;

    // Game State
    let defaultNeeds = { rest: 100, hunger: 100, connection: 100, spiritual: 100, novelty: 100 };
    if (globalSettings.customNeeds && globalSettings.customNeeds.length > 0) {
      defaultNeeds = {};
      globalSettings.customNeeds.forEach(n => defaultNeeds[n] = 100);
    }
    
    let defaultSkills = { naturalist: 5, occultist: 2, scribal: 8 };
    if (globalSettings.customSkills && globalSettings.customSkills.length > 0) {
      defaultSkills = {};
      globalSettings.customSkills.forEach(s => defaultSkills[s] = 0);
    }

    let state = {
      needs: defaultNeeds,
      skills: defaultSkills,
      inventory: [],
      flags: {},
      activeQuests: gameData.quests?.filter(q => q.autoStart).map(q => q.id) || [],
      completedQuests: [],
      time: 8 // 0-24
    };

    // Load from LocalStorage
    try {
      const saved = localStorage.getItem('neocities_game_save_${project.id}');
      if (saved) {
        state = { ...state, ...JSON.parse(saved) };
      }
    } catch(e) {}

    let saveGame = () => {
      try {
        localStorage.setItem('neocities_game_save_${project.id}', JSON.stringify(state));
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
        if (asset && asset.src) {
          el.setAttribute('src', asset.src);
        }
      });
      const dialogueBox = document.getElementById('dialogue-box');
      const flavorText = document.getElementById('flavor-text');
      const container = document.getElementById('game-container');
      const gamePositioner = document.getElementById('game-positioner');
      
      // Scale game to fit screen
      const scaleWrapper = document.getElementById('scale-wrapper');
      let currentScale = 1;
      const resizeGame = () => {
        const gameW = ${boundW};
        const gameH = ${boundH};
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        currentScale = Math.min(winW / gameW, winH / gameH);
        gamePositioner.style.transform = 'scale(' + currentScale + ')';
        gamePositioner.style.transformOrigin = 'center center';
      };
      window.addEventListener('resize', resizeGame);
      resizeGame();

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
        if (bgmAsset && bgmAsset.src) {
           currentBgmAudio = new Audio(bgmAsset.src);
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
        if (tree && tree.startNodeId) {
          showDialogueNode(tree, tree.startNodeId);
        }
      };

      window.showDialogueNode = (tree, nodeId) => {
        const node = tree.nodes.find(n => n.id === nodeId);
        if (!node) {
          closeDialogue();
          return;
        }
        activeDialogue = { tree, node };
        
        const speakerAsset = node.speakerAssetId ? assets.find(a => a.id === node.speakerAssetId) : null;
        
        let html = '<div class="dialogue-title">' + (node.speaker || 'Unknown') + '</div>';
        html += '<div class="dialogue-content">';
        
        if (speakerAsset && (!node.portraitPosition || node.portraitPosition === 'left')) {
          html += '<div style="width: 96px; height: 96px; flex-shrink: 0; margin-right: 24px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><img src="' + speakerAsset.src + '" style="max-width: 100%; max-height: 100%; object-fit: contain;" /></div>';
        }
        
        html += '<div style="flex: 1; font-size: 18px; line-height: 1.6; font-weight: 500; text-shadow: 1px 1px 2px rgba(0,0,0,0.6);" id="dialogue-text"></div>';
        
        if (speakerAsset && node.portraitPosition === 'right') {
          html += '<div style="width: 96px; height: 96px; flex-shrink: 0; margin-left: 24px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><img src="' + speakerAsset.src + '" style="max-width: 100%; max-height: 100%; object-fit: contain;" /></div>';
        }
        html += '</div>';
        
        let choicesHtml = '<div class="dialogue-choices" style="display: flex; flex-direction: column; width: 100%;">';
        if (node.choices && node.choices.length > 0) {
          let hasChoices = false;
          node.choices.forEach((c, idx) => {
            if (c.requiredGameFlag && !state.flags[c.requiredGameFlag]) return;
            hasChoices = true;
            choicesHtml += '<button onclick="chooseDialogue(' + idx + ')" style="display: block; width: 100%; text-align: left; background: transparent; color: #d4d4d8; border: none; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.2s; font-family: inherit; font-size: 16px;" onmouseover="this.style.backgroundColor=\\'rgba(255,255,255,0.1)\\'; this.style.color=\\'var(--ui-primary)\\'" onmouseout="this.style.backgroundColor=\\'transparent\\'; this.style.color=\\'#d4d4d8\\'">&#9656; ' + c.text + '</button>';
          });
          if (!hasChoices) {
              choicesHtml += '<button onclick="closeDialogue()" style="display: block; width: 100%; background: transparent; color: var(--ui-primary); border: none; padding: 16px 24px; cursor: pointer; text-align: center; font-weight: bold; font-family: inherit; font-size: 16px; border-top: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;" onmouseover="this.style.backgroundColor=\\'rgba(255,255,255,0.1)\\'" onmouseout="this.style.backgroundColor=\\'transparent\\'">Continue...</button>';
          }
        } else {
          choicesHtml += '<button onclick="closeDialogue()" style="display: block; width: 100%; background: transparent; color: var(--ui-primary); border: none; padding: 16px 24px; cursor: pointer; text-align: center; font-weight: bold; font-family: inherit; font-size: 16px; border-top: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;" onmouseover="this.style.backgroundColor=\\'rgba(255,255,255,0.1)\\'" onmouseout="this.style.backgroundColor=\\'transparent\\'">Continue...</button>';
        }
        choicesHtml += '</div>';
        
        dialogueBox.innerHTML = html + choicesHtml;
        dialogueBox.style.display = 'block';
        
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

      window.chooseDialogue = (choiceIdx) => {
        if (!activeDialogue) return;
        const choice = activeDialogue.node.choices[choiceIdx];
        if (choice && choice.setGameFlag) {
          state.flags[choice.setGameFlag] = true;
          saveGame();
        }
        if (choice && choice.nextNodeId) {
          showDialogueNode(activeDialogue.tree, choice.nextNodeId);
        } else {
          closeDialogue();
        }
      };

      window.closeDialogue = () => {
        activeDialogue = null;
        dialogueBox.style.display = 'none';
        if (window.typewriterInterval) clearInterval(window.typewriterInterval);
      };
      
      // Setup Dialogue Position
      if (globalSettings.dialoguePosition === 'top') {
        dialogueBox.style.bottom = 'auto';
        dialogueBox.style.top = '20px';
      } else if (globalSettings.dialoguePosition === 'center') {
        dialogueBox.style.bottom = 'auto';
        dialogueBox.style.top = '50%';
        dialogueBox.style.transform = 'translate(-50%, -50%)';
      }

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
      };
      
      updateGameFlagsUI();

      // Update Needs UI
      const updateNeedsUI = () => {
        Object.keys(state.needs).forEach(need => {
          const el = document.getElementById('need-' + need);
          if (el) el.style.width = Math.max(0, Math.min(100, state.needs[need] || 0)) + '%';
        });
      };
      updateNeedsUI();

      // Update Skills UI
      const updateSkillsUI = () => {
        Object.keys(state.skills).forEach(skill => {
          const el = document.getElementById('skill-' + skill);
          if (el) el.style.width = Math.max(0, Math.min(100, (state.skills[skill] || 0) * 5)) + '%';
        });
      };
      updateSkillsUI();

      // Day/Night Cycle
      ${
        project.globalSettings?.useDayNightCycle
          ? `
        setInterval(() => {
          state.time += 0.1;
          if (state.time >= 24) state.time = 0;
          
          let filter = 'brightness(1)';
          if (state.time > 18 || state.time < 6) {
            // Night
            filter = 'brightness(0.5) sepia(0.3) hue-rotate(180deg)';
          } else if (state.time > 16) {
            // Sunset
            filter = 'brightness(0.8) sepia(0.5) hue-rotate(-20deg)';
          }
          document.documentElement.style.setProperty('--time-filter', filter);

          const timeDisplay = document.getElementById('time-display');
          if (timeDisplay) {
            const h = Math.floor(state.time).toString().padStart(2, "0");
            const m = Math.floor((state.time % 1) * 60).toString().padStart(2, "0");
            timeDisplay.innerText = h + ":" + m;
          }
        }, 1000);
      `
          : ""
      }

      // Inventory Deselect on Background Click/Right-Click
      container.addEventListener('pointerdown', (e) => {
         if (typeof selectedInventoryItemId !== 'undefined' && selectedInventoryItemId !== null) {
            selectedInventoryItemId = null;
            try { updateInventoryUI(); } catch(e){}
         }
      });
      container.addEventListener('contextmenu', (e) => {
         e.preventDefault();
         if (typeof selectedInventoryItemId !== 'undefined' && selectedInventoryItemId !== null) {
            selectedInventoryItemId = null;
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
        const dummyTree = {
          nodes: [{
            id: 'dummy',
            speaker: title || '',
            text: text,
            choices: []
          }]
        };
        showDialogueNode(dummyTree, 'dummy');
        setTimeout(() => closeDialogue(), Math.max(2000, text.length * 50 + 1000));
      };

      // Interactions
      document.querySelectorAll('.scene-object').forEach(obj => {
        
        // Hide if collected
        if (state['collected_' + obj.id]) {
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
          if (Date.now() - lastClickTime < 300) return;
          lastClickTime = Date.now();
          
          try {
            console.log('Object clicked:', obj.id, 'class:', obj.className);
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
            saveGame();
          }

          const interaction = obj.getAttribute('data-interaction');
          const data = obj.getAttribute('data-interaction-data');
          const giveItemId = obj.getAttribute('data-give-item');
          const audioSrc = obj.getAttribute('data-audio-src');
          
          if (audioSrc && audioSrc !== '') {
            const soundAsset = assets.find(a => a.id === audioSrc);
            if (soundAsset) {
              const audio = new Audio(soundAsset.src);
              audio.play().catch(e => console.warn("SFX play failed", e));
            }
          }
          
          if (interaction === 'give-item' || interaction === 'collect') {
            if (giveItemId && !state.inventory.includes(giveItemId)) {
              state.inventory.push(giveItemId);
              showSimpleDialogue("You obtained an item!", "System");
            }
            if (interaction === 'collect') {
              obj.style.display = 'none';
              state['collected_' + obj.id] = true;
              saveGame();
            }
          } else if (interaction === 'dialogue' || interaction === 'flavor_text') {
            showSimpleDialogue(data, "");
          } else if (interaction === 'start-dialogue') {
            const treeId = obj.getAttribute('data-dialogue-tree');
            if (treeId) startDialogue(treeId);
          } else if (interaction === 'sound') {
            const soundAsset = assets.find(a => a.id === data);
            if (soundAsset) {
              const audio = new Audio(soundAsset.src);
              audio.play().catch(e => console.warn("SFX play failed", e));
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
               saveGame();
               buildQuestLog();
            }
          } else if (interaction === 'set_flag') {
            if (data) {
              state.flags[data] = true;
              saveGame();
              console.log("Story Event Flag Set:", data);
              showSimpleDialogue("Story Event: " + data, "System");
            }
          } else if (interaction === 'scene_change') {
            document.querySelectorAll('.game-scene').forEach(el => el.style.display = 'none');
            const targetScene = document.getElementById('scene-' + data);
            if (targetScene) {
              targetScene.style.display = 'block';
              playBgm(targetScene.getAttribute('data-bgm') || null);
            } else {
              dialogueBox.innerHTML = 'Error: Cannot load scene ' + data;
              dialogueBox.style.display = 'block';
            }
          } else if (interaction === 'open_ui') {
            const targetUi = obj.getAttribute('data-target-ui');
            if (targetUi) {
              const el = document.getElementById('ui-menu-' + targetUi);
              if (el) el.style.display = 'block';
            }
          } else if (interaction === 'close_ui') {
            const targetUi = obj.getAttribute('data-target-ui');
            if (targetUi) {
              const el = document.getElementById('ui-menu-' + targetUi);
              if (el) el.style.display = 'none';
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
          } else if (interaction === 'open_quest_log') {
            toggleQuestLog();
          } else if (interaction === 'play_cutscene') {
            const videoAssetId = data;
            const scriptAssetId = obj.getAttribute('data-script-src');
            const videoAsset = assets.find(a => a.id === videoAssetId);
            if (videoAsset) {
                const cutscenePlayer = document.getElementById('cutscene-player');
                const cutsceneVideo = document.getElementById('cutscene-video');
                const skipBtn = document.getElementById('cutscene-skip-btn');
                
                cutscenePlayer.style.display = 'flex';
                cutsceneVideo.src = videoAsset.src;
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
               // updateGameFlagsUI is called inside saveGame
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
          
          if (interaction !== 'save_game') saveGame();
          } catch(err) {
            console.error(err);
            showSimpleDialogue("Error: " + err.message, "System");
          }
        };
        obj.addEventListener('click', handleClick);
      });
      
      window.toggleInventory = () => {
        const overlay = document.getElementById('inventory-overlay');
        if (overlay.style.display === 'none' || !overlay.style.display) {
          overlay.style.display = 'flex';
          updateInventoryUI();
        } else {
          overlay.style.display = 'none';
          selectedInventoryItemId = null; // deselect when closed
        }
      };

      let selectedInventoryItemId = null;
      
      window.handleInventoryItemClick = (itemId) => {
        const itemDef = inventoryItems.find(i => i.id === itemId);
        if (!itemDef) return;

        if (selectedInventoryItemId === itemId) {
          selectedInventoryItemId = null;
          toggleInventory();
          flavorText.innerText = itemDef.description ? ('(Item): ' + itemDef.description) : ('You look at: ' + itemDef.name);
          flavorText.style.display = 'block';
          setTimeout(() => flavorText.style.display = 'none', 3000);
        } else if (selectedInventoryItemId && selectedInventoryItemId !== itemId) {
             const combination = (gameData.craftingRecipes || []).find(r => 
               (r.ingredient1Id === selectedInventoryItemId && r.ingredient2Id === itemId) ||
               (r.ingredient1Id === itemId && r.ingredient2Id === selectedInventoryItemId)
             );
             if (combination) {
                 const ing1Id = combination.ingredient1Id;
                 const ing2Id = combination.ingredient2Id;
                 
                 if (combination.destroyIngredient1) {
                     const idIdx = state.inventory.indexOf(ing1Id);
                     if (idIdx !== -1) state.inventory.splice(idIdx, 1);
                 }
                 if (combination.destroyIngredient2) {
                     const idIdx = state.inventory.indexOf(ing2Id);
                     if (idIdx !== -1) state.inventory.splice(idIdx, 1);
                 }
                 if (combination.resultItemId) {
                     state.inventory.push(combination.resultItemId);
                 }
                 selectedInventoryItemId = null;
                 flavorText.innerText = combination.successMessage || 'Items combined successfully!';
                 flavorText.style.display = 'block';
                 setTimeout(() => flavorText.style.display = 'none', 3000);
                 saveGame();
             } else {
                 flavorText.innerText = 'These objects do not combine.';
                 flavorText.style.display = 'block';
                 setTimeout(() => flavorText.style.display = 'none', 3000);
                 selectedInventoryItemId = null;
             }
        } else {
          selectedInventoryItemId = itemId;
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
               new Audio(sound.src).play().catch(e => console.error(e));
           }
        }
        
        selectedInventoryItemId = null;
        toggleInventory();
        flavorText.innerText = itemDef.useMessage || 'You used ' + itemDef.name + '.';
        flavorText.style.display = 'block';
        setTimeout(() => flavorText.style.display = 'none', 3000);
        saveGame();
        updateInventoryUI();
      };

      const gameQuests = gameData.quests || [];
      window.toggleQuestLog = () => {
        const overlay = document.getElementById('quest-overlay');
        if (overlay.style.display === 'block') {
          overlay.style.display = 'none';
        } else {
          overlay.style.display = 'block';
          buildQuestLog();
        }
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
                 let isDone = false;
                 if (obj.type === 'custom_flag' && state.flags[obj.targetId]) isDone = true;
                 if (obj.type === 'collect_item' && state.inventory.includes(obj.targetId)) isDone = true;
                 
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

        if (!invList) return;
        
        if (state.inventory.length === 0) {
          invList.innerHTML = '<div class="inventory-empty"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5; margin:0 auto 16px auto; display:block;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line><line x1="9" y1="7" x2="15" y2="7"></line></svg><p style="margin:0">Your inventory is empty.</p></div>';
          return;
        }

        let html = '<div class="inventory-grid">';
        state.inventory.forEach(itemId => {
          const itemDef = inventoryItems.find(i => i.id === itemId);
          if (!itemDef) return;
          const iconAsset = itemDef.iconAssetId ? assets.find(a => a.id === itemDef.iconAssetId) : null;
          
          let iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>';
          if (iconAsset && iconAsset.src) {
            iconHtml = '<img src="' + iconAsset.src + '" alt="' + itemDef.name + '" draggable="false" />';
          }
          
          const isSelected = selectedInventoryItemId === itemId;
          const hasSelection = selectedInventoryItemId !== null;
          
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
    };
    initGame();
  `;

  let hudHtml = "";
  if (project.globalSettings?.hudOverlay) {
    const overlay = project.globalSettings.hudOverlay;
    const asset = project.assets.find((a) => a.id === overlay.assetId);
    if (asset) {
      const hudSrc = asset.dataURL || asset.src || "";
      hudHtml = `
      <div id="global-hud-overlay" style="position: absolute; left: 0px; top: 0px; width: ${exportWidth}px; height: ${exportHeight}px; background-image: url('${hudSrc}'); background-size: 100% 100%; pointer-events: none; z-index: 99999; mix-blend-mode: ${overlay.blendMode || "normal"}; opacity: ${overlay.opacity ?? 1};"></div>
      `;
    }
  }

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
  <div id="scale-wrapper" style="width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: visible; background-color: #1a1a1a;">
    <div id="game-positioner" style="position: relative; width: ${boundW}px; height: ${boundH}px;">
      <div id="game-coordinate-space" style="position: absolute; left: ${offsetX}px; top: ${offsetY}px; width: ${exportWidth}px; height: ${exportHeight}px;">
        ${hudHtml}
        <div id="game-container" style="position: absolute; inset: 0; overflow: hidden; width: 100%; height: 100%;">
          ${scenesHtml}
        </div>
        
        <div id="ui-layer" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;">
          <!-- Custom UI Menus -->
          ${uiMenusHtml}
        </div>

        <div id="cutscene-player" style="display: none; position: fixed; inset: 0; z-index: 99998; background: black; justify-content: center; align-items: center;">
            <video id="cutscene-video" class="w-full h-full object-contain" style="max-width: 100%; max-height: 100%; object-fit: contain;"></video>
            <button id="cutscene-skip-btn" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer;">Skip</button>
        </div>

        <div id="dialogue-box"></div>
        <div id="flavor-text"></div>
        <div id="game-transition" style="display: none; position: fixed; inset: 0; z-index: 99999; background: black; opacity: 0; pointer-events: none; transition: opacity 0.5s ease;"></div>
        
        ${
          project.globalSettings?.hideDefaultInventoryBtn
            ? ""
            : `
      <button id="inv-toggle-btn" onclick="toggleInventory()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ui-primary)"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>
        <div id="inv-badge" class="inv-badge">0</div>
      </button>
      `
        }

        ${
          (project.quests && project.quests.length > 0) && !project.globalSettings?.hideDefaultInventoryBtn
            ? `
      <button id="quest-toggle-btn" onclick="toggleQuestLog()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ui-primary)"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
      </button>
      `
            : ""
        }

      <div id="inventory-overlay" onclick="toggleInventory()">
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
      
      <div id="quest-overlay" onclick="toggleQuestLog()" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100000; padding: 20px;">
        <div class="inventory-box" onclick="event.stopPropagation()" style="max-height: 80%; max-width: 600px; margin: auto;">
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
      
      ${project.globalSettings?.enableNeeds ? `<div id="needs-tracker">
        ${(project.globalSettings.customNeeds?.length ? project.globalSettings.customNeeds : ['rest', 'hunger', 'connection', 'spiritual', 'novelty']).map(need => 
          `<div>${need.charAt(0).toUpperCase() + need.slice(1)} <div class="need-bar"><div id="need-${need}" class="need-fill"></div></div></div>`
        ).join('')}
      </div>` : ''}
      
      ${project.globalSettings?.enableTTRPGStats ? `<div id="skills-tracker">
        ${(project.globalSettings.customSkills?.length ? project.globalSettings.customSkills : ['naturalist', 'occultist', 'scribal']).map(skill => 
          `<div>${skill.charAt(0).toUpperCase() + skill.slice(1)} <div class="need-bar"><div id="skill-${skill}" class="need-fill"></div></div></div>`
        ).join('')}
      </div>` : ''}
      
      <div id="time-tracker">
        <div style="font-weight: bold; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 4px; margin-top: 4px;">
           TIME: <span id="time-display">08:00</span>
        </div>
      </div>
  </div> <!-- Close game-coordinate-space -->
  </div> <!-- Close game-positioner -->
  <!-- Close scale-wrapper -->
  </div>
  <script id="__GAME_DATA__" type="application/json">${JSON.stringify(strippedProject).split("</script>").join("<\\/script>").split("</SCRIPT>").join("<\\/script>")}</script>
  <script>${js}</script>
</body>
</html>`;
}
