# Hudbot / Cavebot Master Feature Inventory

## What This Audit Measures

This is a **code-presence audit**, not a promise that every feature is polished or fully interoperable.

- **Implemented:** Meaningful code for the feature exists.
- **Disjointed:** It exists, but is buried, isolated, duplicated, or difficult to use in the intended workflow.
- **Fractured:** Different useful pieces exist in different prototypes.
- **Partial:** The foundation exists, but not the complete intended system.
- **MIA:** No meaningful implementation was found anywhere in the audited projects.

The intended product is a personal, no-code game workshop for assembling interactive point-and-click RPGs from reusable assets and logic, then exporting them as **Neocities-friendly modular HTML game directories**.

## Projects Audited

| Project | Role | Primary files |
| --- | --- | --- |
| Main Hudbot / Cavebot | Current primary game editor | `App.tsx`, `types.ts`, `utils/exportHtml.ts`, `components/` |
| Abacus Alt | Most complete alternate game editor/runtime | `peripheral/alt_version(abacus_pure_html)/` |
| CoAiExist Studio | Visual webpage and multipage site builder | `peripheral/coaiexist-studio-package/` |
| Stage Maker v1/v2 | Fast toy-like scene composition | `peripheral/scene/drag-n-drop-stage-maker (6).html`, `peripheral/scene/stage-maker_Version2.html` |
| Entropic Scene Maker 98 | Asset browsing and audiovisual scene composition | `peripheral/scene/entropic-scene-maker-98/` |
| Asset Codex | Asset intake, curation, notes, and AI packets | `peripheral/asset-codex-single.html` |

---

# 1. Main Hudbot / Cavebot

## Implemented

### Project and Editor

- Multi-scene project editing.
- Stage/canvas editor with selectable, movable, resizable, rotatable, layered objects.
- Grid, snapping, stage sizing, object locking/hiding, parenting, grouping affinity, and ghost controls.
- Undo/redo and project backup/version controls.
- Play/preview mode.
- Custom project themes, colors, fonts, CSS, cursor, and HUD settings.
- Dedicated workspaces for assets, stage, scenes, maps, UI, dialogue, items, and RPG systems.

### Scene Objects

- Image, audio, video, script, hitbox, text, and UI object types.
- Position, scale, rotation, opacity, z-index, visibility, locking, stretching, pinning, fit behavior, filters, blend modes, and parallax.
- Animation presets including wiggle, pulse, glow, float, spin, shake, bounce, fade, slide, and zoom.
- Hover text, flavor text, cursor states, clickable interactions, enter triggers, and one-shot triggers.
- Matter.js physics configuration.
- UI bindings and multiple UI element types.
- Custom CSS classes and script execution.

### Game Logic

- Dialogue trees, portraits, typewriter presentation, choices, conditions, consequences, and scene changes.
- Typed project flags.
- Inventory, item collection, item use, consumables, ingredients, quest items, and crafting stations.
- Item combinations and crafting recipes.
- Quests, objectives, rewards, quest log, quest start, and quest completion.
- Skill checks, custom skills, XP-related values, needs, stat changes, and reputation effects.
- Save/load, restart scene/game, fullscreen, mute, exit, and inventory/UI toggles.
- Cutscenes and scripted actions.
- Fast-travel maps and flag-gated map nodes.
- Lore, factions, companions, relationships, and prefabs.
- Day/night settings and optional survival-style needs.

### Assets and Media

- Image, audio, video, script, UI, text, and hitbox asset records.
- Upload, browse, search, categorize, tag, describe, favorite, and bulk-edit assets.
- Recent, favorite, in-canvas, folder, and all-asset picker views.
- Asset lore and “needs attention” metadata.
- Audio trimming and volume metadata.
- Image crop, brightness, contrast, saturation, sepia, hue, grayscale, invert, blur, and chroma-key editing.
- AI assistant and AI image/sprite generation hooks using Gemini.

### Runtime and Export

- Standalone playable HTML export.
- Embedded scene, dialogue, inventory, crafting, quest, skill, need, audio, flag, cutscene, and save runtime.
- LocalStorage game saves.
- Runtime scene transitions, BGM, SFX, object interactions, and visibility conditions.

## Disjointed Inside the Main App

These are not missing; the interface makes them feel missing.

- **Stage versus Scenes:** Scene management and scene composition are separated despite being one continuous task.
- **UI Maker versus UI Stage:** UI construction is split across two concepts with unclear boundaries.
- **Asset surfaces:** Asset manager, asset picker, object inspector, and AI asset tools overlap without one canonical asset workflow.
- **RPG systems:** Quests, skills, needs, lore, factions, companions, and related settings are nested into a dense systems area instead of appearing contextually.
- **Logic authoring:** Interactions, conditions, flags, quests, items, dialogue, and scene changes are connected by IDs but lack one readable visual logic surface.
- **World structure:** Maps, scenes, quests, and unlock flags exist independently rather than as one world/progression view.
- **Authoring versus runtime:** Important behavior is visible only after previewing; there is little immediate explanation of what an object will do.
- **Inspector density:** A single object can expose transforms, effects, interactions, RPG consequences, scripts, physics, responsive rules, and UI properties in one long control stack.
- **Project operations:** Save, backups, import/export, and project settings are distributed rather than presented as one project hub.
- **Prefabs:** Reusable objects exist, but they are not yet the obvious foundation of a reusable game-component library.

## Main App Gaps

- Export is currently a monolithic standalone HTML file, not a modular game directory.
- No built-in Neocities deployment flow.
- No integrated GitHub/local-folder asset indexing workflow.
- No MCP server or provider-neutral AI tool layer.
- No dedicated dress-up/doll system.
- No visual dependency validator or unified progression graph.
- No dedicated economy, currency, store, or trading system.

---

# 2. Abacus Alt

## Implemented

### Core Editor

- Pure HTML/CSS/JavaScript editor.
- Three-column scene editor with asset browser, canvas, properties, layers, and hitbox tools.
- Drag, resize with eight handles, rotate, snap, grid, keyboard nudging, context menu, duplicate, delete, lock, visibility, and z-order controls.
- Scene create, rename, duplicate, and delete.
- Undo/redo, autosave, project save, and project reopen through `.anzu` data.
- Preview and standalone HTML export.

### Asset System

- GitHub repository and folder browser.
- Import from repository paths with source metadata.
- Search, categories, tags, lore, attention status, metadata, and usage-oriented tools.
- Palette extraction, type/name/tag/vibe suggestions, heuristic analysis, and visual search concepts.
- WebP conversion, batch resize, icon sizing, transparency trimming, duplicate detection, sprite-sheet slicing, and placeholder generation.
- Catalog and manifest generation.

### Logic and RPG Systems

- Dialogue tree CRUD, node flow view, node conditions, consequences, flags, quests, social effects, and JSON export.
- Inventory items, stacking, use-on-object rules, combinations, and JSON export.
- Boolean, number, and string flags.
- Separately drawn hitboxes with cursor, tooltip, all/any conditions, chained actions, one-shot behavior, and object linkage.
- Object interactions for scenes, dialogue, scripts, items, flags, skills, quests, reputation, effects, needs, and NPC behavior.
- Needs and decay.
- NPC stats, moods, schedules, waypoints, relationships, friendship, romance, rivalry, and gates.
- Quest milestones, branches, and social changes.
- Skills, dice, and XP.
- Day/night, real-time/manual time, status effects, and NPC movement behaviors.
- Multiple runtime save slots and autosave.

### Runtime and Export

- Standalone playable HTML with scenes, objects, hitboxes, dialogue, inventory, flags, quests, needs, NPC systems, and save state.
- Runtime selected-item interactions, item combinations, dialogue, flavor variants, transitions, and RPG HUD.

## Best Features to Donate

- Visual hitbox editor.
- Conditions plus chained actions.
- Typed flag editor.
- NPC schedules, waypoints, moods, and relationship gates.
- Multiple game save slots.
- Advanced local asset processing.
- GitHub asset import.

## Weaknesses

- Large quantities of functionality are compressed into narrow side panels.
- The editor still feels like several utilities sharing one screen rather than one guided workflow.
- Export is still one standalone HTML file.
- API credentials are stored locally in browser settings.
- Asset-heavy projects rely heavily on embedded/base64 data.

---

# 3. CoAiExist Studio

## Implemented

### Visual Webpage Building

- Multipage projects with create, switch, rename, duplicate, and delete.
- Per-page history and undo/redo.
- Iframe-based direct webpage editing.
- Element selection, movement, reordering, layers, resize handles, and content editing.
- Mobile, tablet, desktop, and full-width viewport presets.
- Preview mode.
- Direct HTML, CSS, and JavaScript source editing.

### Design System

- Visual CSS controls for spacing, sizing, typography, borders, shadows, filters, and effects.
- Rich text controls.
- Themes, fonts, button styles, animation presets, cursor effects, scrollbars, and style chips.
- Theme extraction from pages or URLs.
- Reusable component saving and component-library JSON export.
- Large component/template/preset library.

### Assets and Deployment

- Public GitHub repository browser.
- Neocities asset browser.
- URL and local uploads for images, audio, video, iframe content, HTML, CSS, JavaScript, fonts, 3D models, and PDFs.
- Current-page HTML export.
- Neocities deployment tooling and auto-deploy concepts.
- Page/world graph that links regions and pages.
- LocalStorage project persistence.
- Gemini-oriented AI manifest support.

## Best Features to Donate

- Multipage tab model.
- Visual CSS inspector.
- Responsive viewport preview.
- Reusable component library.
- Source-code escape hatch.
- Theme extraction and style chips.
- Neocities browsing and deployment.
- Page/world graph.

## Weaknesses

- It builds web pages, not game states and game logic.
- Page links and world graph are not integrated with quests, flags, dialogue, inventory, or NPC state.
- Credential handling should be replaced before public release.
- Internal framework choices are heavier than necessary, although exported pages can remain static HTML.

---

# 4. Scene Makers

## Stage Maker v1

### Implemented

- Single-file, pure HTML scene composer.
- Remote categorized asset list, search, subcategories, and pagination.
- Background picker.
- Fast drag-and-drop prop placement.
- Responsive percentage-based positioning.
- Inspector for size, rotation, opacity, blur, hue, saturation, brightness, shadow, and animation.
- Nudge, center, flip, duplicate, front/back, reset effects, and delete.
- Clear scene, random scatter, grid toggle, and backdrop reset.
- Scene JSON save/load and clipboard-oriented scene sharing.

### Best Feature to Donate

- The immediate “open it and play” toy feeling.
- Compact effect controls.
- Responsive percentage positioning.
- Random scatter and playful composition actions.

## Stage Maker v2

- Simpler drag/drop scene composition.
- Background and prop browsing.
- Search, clear, scatter, and JSON save/load.
- Useful as evidence that the core scene workflow can remain extremely small.

## Entropic Scene Maker 98

### Implemented

- GitHub image/audio explorer with folder grouping, search, list/grid views, and collapsible folders.
- Drag assets to a canvas.
- Layers, z-order reordering, transform, flip, opacity, animations, and hover effects.
- Sound emitters, autoplay, volume, linked sounds, and click behaviors.
- Simple click actions such as play sound, hide, alert, and stat change.
- Variables/stats.
- Snap, grid, and zoom.
- LocalStorage scene snapshots.
- Gemini-based image, edit, video, and chat experiments.
- JSON scene export.
- Draggable Win98-style windows.

### Best Features to Donate

- Folder-oriented GitHub browsing.
- Sound-emitter object concept.
- Hover behavior controls.
- Simple “when clicked, do this” behavior menu.
- Playful draggable-window presentation.

### Weaknesses

- No playable HTML game export.
- Logic is shallow compared with the main and Abacus editors.
- AI functionality is provider-specific.

---

# 5. Asset Codex

## Implemented

- Image, audio, and video intake.
- Asset type and workflow status.
- Search, filter, and sorting.
- Collections, tags, bulk tagging, bulk typing, and bulk status changes.
- Asset notes and lore.
- Lore bible.
- Browser speech recognition for dictated notes.
- Review mode.
- JSON import/export.
- AI work-packet export/import.
- Suggested metadata review with accept, reject, and history.
- Local heuristic metadata drafting.
- LocalStorage persistence.

## Best Features to Donate

- Inbox/review workflow.
- Speech-to-text notes.
- AI packets that work without a live paid API.
- Human approval of AI suggestions.
- Lore-aware asset metadata.

## Weaknesses

- Base64 assets in LocalStorage will not scale to a large archive.
- No durable local-folder index or relative-path asset catalog.
- No GitHub sync.
- “MCP ready” is descriptive metadata only; there is no MCP server.
- The current standalone page needs runtime repair before adoption.

---

# 6. Cross-Project Feature Matrix

| Capability | Main | Abacus | CoAiExist | Scene Makers | Asset Codex |
| --- | --- | --- | --- | --- | --- |
| Drag/drop visual canvas | Strong | Strong | DOM-oriented | Strong/easy | No |
| Multi-scene/page authoring | Scenes | Scenes | Strong pages | Single scenes | No |
| Layers and transforms | Strong | Strong | Strong | Strong | No |
| Object animations/effects | Strong | Strong | CSS-rich | Strong/easy | No |
| Responsive authoring | Pin/stretch | Weak/fixed | Strong previews | Percentage positions | No |
| Dialogue | Strong | Strong | No | No | Notes only |
| Inventory/items | Strong | Strong | No | No | Asset records only |
| Crafting/combinations | Strong | Strong | No | No | No |
| Quests/progression | Strong | Strong | Page graph only | No | No |
| Flags/conditions/actions | Strong but buried | Strongest visual pieces | JS snippets only | Simple actions | No |
| Skills/needs/reputation | Strong | Strong | No | Stats only | No |
| NPC schedules/social systems | Partial | Strong | No | No | No |
| Maps/world graph | Fast-travel maps | Scene transitions | Strong page graph | No | No |
| Hitbox drawing | Object hitboxes | Strong dedicated editor | DOM regions | Object bounds | No |
| Audio authoring | Strong | Strong | Media insertion | Sound emitters | Cataloging |
| Asset metadata | Good | Strong/tools | Basic browser | Repo browsing | Strong curation |
| Image processing | Strong editor | Strong batch tools | CSS effects | Visual effects | No |
| GitHub asset browsing | No | Strong | Public repos | Entropic | No |
| Neocities integration | No | No | Strongest | No | No |
| Reusable components/prefabs | Prefabs | Object duplication | Strong library | Scene JSON | Collections |
| Playable HTML export | Yes, monolithic | Yes, monolithic | Web pages | No/JSON | No |
| Modular directory export | No | No | Pages, not game package | No | No |
| Save-game runtime | Yes | Strong/multi-slot | No | No | No |
| Speech notes | No | No | No | No | Yes |
| Provider-neutral AI packets | No | No | No | No | Partial |
| Actual MCP server | No | No | No | No | No |

---

# 7. Fractured Features to Recombine

These systems exist, but their best pieces are distributed across projects.

## Asset Nervous System

- **Main:** Runtime-ready asset records and in-game usage.
- **Abacus:** GitHub import, batch processing, duplicate detection, sprite slicing, and manifests.
- **Entropic:** Friendly folder browsing for images and audio.
- **CoAiExist:** Neocities and web asset browsing.
- **Asset Codex:** Inbox, speech notes, lore, collections, status, review, and AI packets.

**Consolidation target:** One asset record with a durable source path, metadata, lore, usage references, processing history, and optional AI suggestions.

## Scene Composition

- **Main:** Deep game-ready objects and interactions.
- **Abacus:** Better hitboxes and condition/action chains.
- **Stage Maker:** Fastest and most joyful placement workflow.
- **Entropic:** Sound emitters, hover behavior, and repo folders.
- **CoAiExist:** Responsive preview and direct source editing.

**Consolidation target:** Stage Maker simplicity on first contact, with Main/Abacus depth revealed progressively.

## World and Progression

- **Main:** Scenes, maps, quests, flags, dialogue, inventory, and fast travel.
- **Abacus:** NPC schedules, social gates, typed flags, and branch conditions.
- **CoAiExist:** Visual world/page graph.

**Consolidation target:** One graph that can display places, scenes, dialogue, quests, NPCs, items, flags, and every route that unlocks content.

## Reusable Building Blocks

- **Main:** Prefabs.
- **CoAiExist:** Reusable component library and templates.
- **Stage Makers:** Portable scene JSON.
- **Asset Codex:** Collections.

**Consolidation target:** A unified library of props, NPCs, UI widgets, interaction recipes, rooms, dialogue patterns, minigames, and full scene templates.

## Styling

- **Main:** Themes, fonts, HUD customization, custom CSS, and UI objects.
- **CoAiExist:** Best visual CSS controls, style chips, theme extraction, and responsive previews.
- **Stage Makers:** Friendly effect sliders.

**Consolidation target:** Global game theme plus per-object overrides, presented through legible visual controls with an optional CSS escape hatch.

## Export and Publishing

- **Main/Abacus:** Playable game runtime export.
- **CoAiExist:** Multipage HTML concepts and Neocities deployment.
- **Asset tools:** Manifests and source paths.

**Consolidation target:** Export a complete directory containing modular HTML scenes, shared JavaScript/CSS runtime files, manifests, and copied/referenced assets, then optionally deploy that directory to Neocities.

## AI Assistance

- **Main/Entropic/CoAiExist:** Direct Gemini experiments.
- **Abacus:** Local heuristics and optional image analysis.
- **Asset Codex:** Provider-neutral export/import packets and approval workflow.

**Consolidation target:** Manual and local workflows first; MCP and optional provider adapters second. No paid API should be required for core operation.

---

# 8. Total MIA Features

No complete implementation of these systems was found.

## Critical Product Architecture

- **Modular game-package exporter:** A directory containing many standalone scene/page HTML files plus shared runtime, CSS, data manifests, and assets.
- **Round-trip modular project import:** Reopen an exported directory without flattening or losing external asset paths.
- **Canonical shared schema:** One versioned format for assets, scenes, dialogue, quests, NPCs, items, UI, flags, and runtime state across all editors.
- **Cross-prototype migration tools:** Import old Main, Abacus, Stage Maker, CoAiExist, and Asset Codex data into that canonical schema.
- **Project validator:** Find broken asset paths, missing references, duplicate IDs, unreachable scenes, impossible quests, orphan flags, and broken dialogue routes.
- **Automated packaging:** Copy/deduplicate assets, rewrite paths, generate manifests, and verify the final directory before export.

## Shared AI and Lore Infrastructure

- **Actual MCP server:** Tools for reading/writing assets, lore, scenes, metadata, manifests, and project files.
- **Provider-neutral AI adapter:** MCP, manual packet, local model, or optional API provider using the same request/approval format.
- **Project-wide lore retrieval:** Find relevant lore for an asset, NPC, scene, quest, or messy spoken note.
- **Natural-language behavior drafting:** Convert “she gives this rumor if you brought the shell” into editable conditions/actions without making prose the hidden source of truth.

## Game-Making Systems

- **Dedicated dress-up/doll builder:** Named attachment slots, layer rules, body anchors, outfit sets, variants, recoloring, and saved looks.
- **Economy system:** Currency, prices, shops, buying, selling, trading, scarcity, and reputation-based pricing.
- **Linguistic puzzle toolkit:** Text input, keywords, riddles, phrase matching, clue memory, and conversation-based puzzle states.
- **Rumor/gossip system:** Discoverable information that can be carried, traded, checked, forgotten, or used as a condition.
- **High-level alternate-route designer:** Visually express “unlock through any two of friendship, item, rumor, quest, payment, or skill” without manually wiring many flags.
- **Visual minigame builder:** Reusable rules and score/state wiring for small p5.js, SVG, or DOM minigames.
- **Game-family profiles:** Start from reusable recipes such as point-and-click RPG, dress-up toy, social sim, scene maker, or interactive webpage while sharing the same core.
- **Batch ambient interaction authoring:** Quickly assign harmless click reactions, sounds, flavor text, animations, or random responses to many props.

## Asset Scale and Portability

- **Durable local-folder asset index:** Reference local files without duplicating every asset into LocalStorage.
- **Large-library database:** IndexedDB, filesystem-backed metadata, or another scalable local catalog.
- **Phone-to-project intake workflow:** Reliable mobile upload/sync into the same asset inbox.
- **Safe file rename/move tracking:** Change organization without breaking scene references.
- **Unified usage graph:** Show every scene, NPC, item, UI element, or export that uses an asset.

---

# 9. Recommended Master Feature Structure

The final app should not expose each inherited prototype as another top-level tab. It should organize everything around the creative loop.

## 1. Collect

- Import folders, files, GitHub assets, Neocities assets, or phone uploads.
- Dictate notes.
- Tag, group, review, process, and connect lore.

## 2. Compose

- Build scenes with Stage Maker immediacy.
- Add props, NPCs, sound emitters, UI, hitboxes, and reusable prefabs.
- Switch between scene, dress-up, UI, and webpage-oriented canvases without changing the project format.

## 3. Make It Do Things

- Use plain visual recipes: “When this happens / if these are true / do these things.”
- Attach dialogue, inventory, quests, reputation, rumors, skills, needs, animations, sounds, scripts, and scene changes.
- Keep advanced scripting optional.

## 4. Connect the World

- See scenes, locations, NPCs, quests, dialogue, items, flags, and unlock routes in one filterable graph.
- Simulate a player’s possible route.
- Detect dead ends and inaccessible content.

## 5. Play and Inspect

- Preview instantly.
- Inspect live flags, inventory, quests, relationships, time, needs, and current scene.
- Jump to any state for testing.

## 6. Package and Publish

- Validate the project.
- Export a modular Neocities-ready directory.
- Download as ZIP or deploy to Neocities.
- Preserve the project manifest for later editing.

---

# 10. Bottom Line

This is not five unrelated failed apps. It is one app whose organs were prototyped in separate bodies:

- **Main Hudbot is the game-system body.**
- **Abacus is the logic, NPC, hitbox, and asset-tool donor.**
- **CoAiExist is the webpage, styling, multipage, and publishing donor.**
- **Stage Maker is the playfulness and usability donor.**
- **Entropic is the audiovisual/repository-browser donor.**
- **Asset Codex is the intake, lore, speech-note, and AI-review donor.**

The largest remaining work is not inventing more features. It is defining one shared project schema, choosing the strongest version of each duplicated mechanic, rebuilding the workflow around **collect → compose → behavior → connect → play → publish**, and producing the modular HTML package exporter that none of the prototypes currently has.
