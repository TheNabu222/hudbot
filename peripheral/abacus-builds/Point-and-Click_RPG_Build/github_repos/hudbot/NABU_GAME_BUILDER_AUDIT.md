# Nabu Game Builder Audit

## Purpose

This audit treats the Nabu / Shoebill demo as Cavebot’s concrete acceptance test.

The question is not merely whether related code exists. The question is:

> Can the Nabu demo be authored, understood, tested, and exported through Cavebot without writing code or manually coordinating dozens of invisible flags?

Statuses:

- **Ready:** The builder and exported runtime can support the mechanic now.
- **Buried:** The mechanic exists, but authoring it is unnecessarily difficult or disconnected.
- **Partial:** Some required data or runtime behavior exists, but the full mechanic is not dependable.
- **Missing:** No usable no-code implementation exists.
- **Needs redesign:** An implementation exists, but its current model will not scale to the game.

---

# 1. Nabu Demo Gameplay Requirements

## Core Loop

1. Wake after a dream cutscene.
2. Make an early personality or skill-shaping choice.
3. Receive Gilgrokmesh’s shoddy spear.
4. Explore the settlement freely.
5. Meet NPCs and discover several overlapping questlines.
6. Click scenery for jokes, animations, sounds, lore, and occasional rewards.
7. Forage, hunt, collect, barter, craft, and improve skills.
8. Build clan, faction, animal, and individual relationships.
9. Follow the shoebill’s clacking through several locations.
10. Court the shoebill through repeated visits, gifts, trust, and boundaries.
11. Repair and practice the bone flute over time.
12. Advance through repeatable day/night cycles without forced urgency.
13. Accumulate subtle historical and environmental anomalies.
14. Trigger the song, MechAnzu transformation, and Backrooms transition only after several soft conditions converge.

## Demo Questlines

- N and Ninn’s anniversary and consent/boundary problem.
- Farmer/fisher game-of-telephone trade swap.
- Gilgrokmesh’s schoolyard toxic-masculinity cult and snack distribution.
- Lunamkita’s broken bone flute and trading tutorial.
- Hyenaba and the settlement’s conditional tolerance of local hyenas.
- Shoebill courtship, gifts, trust, flute song, and transformation.
- Ambient settlement exploration, skill discovery, hunting, and foraging.

## Required Persistent State

- Current day and time.
- Player inventory and item quantities.
- Skills and progression.
- Needs.
- Quest stages and objectives.
- Dialogue choices and remembered facts.
- NPC, faction, clan, animal, and companion reputation.
- Individual relationship tracks.
- Rumors and information known by the player.
- Shoebill trust, gift history, scritch permission, and courtship stage.
- Flute repair and practice progress.
- Scene anomaly level and global story phase.
- Which ambient interactions have fired, exhausted, or changed.

---

# 2. Current Capability Matrix

| Nabu requirement | Status | Current support | Main problem |
| --- | --- | --- | --- |
| Illustrated point-and-click rooms | **Ready** | Multi-scene canvas, objects, hitboxes, text, layers, transforms, cursors | Scene composition is functional |
| GIF, image, audio, and video assets | **Ready** | Asset library, picker, Finder drop, image editor, audio metadata, video cutscenes | Large-library storage still needs future work |
| Ambient clickable jokes | **Buried** | Objects can show text, play sound, animate, set flags, or chain responses | Every prop must be configured individually |
| Multiple effects from one click | **Ready / Buried** | Ordered `clickResponses` stack | Secondary responses cannot carry most conditions or RPG effects |
| Branching dialogue | **Ready** | Trees, nodes, choices, portraits, conditions, consequences | Visual authoring is dense and choice conditions are limited |
| Remembered dialogue choices | **Buried** | Choices can set flags | Requires manual flag naming and wiring |
| Early choice shaping skills/personality | **Partial** | Choices can affect needs, reputation, quests, items, scenes, and flags | Dialogue choices cannot directly grant skill values |
| Inventory and quest items | **Ready** | Items, collection, consumption, item requirements, combinations | Inventory is ID-based and lacks quantities/stacks |
| Give gifts to NPCs or animals | **Partial** | Item-required objects and consume-item behavior | No gift preference, reaction, history, or relationship reward model |
| Foraging | **Partial** | Collectible objects can grant items and skills | No respawn, depletion, rarity, season, day reset, or loot-table recipe |
| Hunting | **Partial** | Skill checks, collectables, items, time and needs effects | No reusable encounter, prey, success/failure, or loot system |
| Crafting recipes | **Ready** | Three-ingredient recipes and item combinations | No recipe discovery, categories, skill gates, quality, or batch quantities |
| Bartering and shops | **Missing** | Items and reputation exist independently | No offers, prices, exchange rules, stock, seller inventory, or trade UI |
| Currency-optional economy | **Missing** | No economy schema | Needs barter-first offers with optional currencies |
| Player skills | **Partial** | Custom skills, gains, checks, HUD | One skill-check path uses a hardcoded modifier; dialogue cannot grant skills directly |
| Player needs | **Ready / Buried** | Custom needs, decay, effects, HUD | Needs effects sometimes require raw JSON authoring |
| Day/night cycle | **Partial** | Time value, visual filtering, time costs, continuous runtime clock | No day counter, sleep, scheduled events, daily resets, or configurable clock mode |
| Repeatable unlimited days | **Missing** | Time wraps from 24 back to 0 | Day number and per-day state do not exist |
| NPC reputation | **Partial** | Numeric faction/relationship state and dialogue/object effects | `npcId` and `factionId` models are inconsistent and weakly surfaced |
| Individual relationships | **Partial** | Relationships menu displays faction-style values | No dedicated NPC relationship schema, thresholds, labels, or histories |
| Courtship progression | **Missing** | Could be manually approximated with flags and numbers | No visual relationship stages, gift preferences, consent/boundary state, or threshold events |
| Clan and animal reputation | **Partial** | Factions can represent groups | No consequence rules such as “low clan reputation threatens hyenas” |
| Companions/familiars | **Partial** | Companion image, dialogue, required flag, random interjections | No following by scene, schedules, abilities, affinity, or companion state |
| NPC schedules and routines | **Missing** | None in the main schema/runtime | Essential for village life across day cycles |
| NPC family/social graph | **Missing** | Lore and factions only | No relationships such as parent, sibling, spouse, rival, friend |
| Parallel optional quests | **Partial** | Multiple active quests and quest log | Stage progression, branching, and automatic completion are weak |
| `talk_to` quest objectives | **Broken / Partial** | Objective type exists in schema | Runtime completion display does not evaluate it |
| `skill_check` quest objectives | **Broken / Partial** | Objective type exists in schema | Runtime completion display does not evaluate it |
| Quest rewards | **Partial** | Reward schema exists | Completion does not consistently apply rewards automatically |
| Multi-stage questlines | **Missing** | Start and complete only | Nabu quests require stages, updates, branches, and alternative outcomes |
| Soft unlocks | **Missing** | Single flags, item requirements, and skill requirements exist | No visual “any/all of these conditions” rule builder |
| Alternate valid progression routes | **Missing** | Manual flags could simulate them | Would become brittle and unreadable |
| Rumors and gossip | **Missing** | Can be simulated with flags/lore | No information object that can be learned, checked, repeated, contradicted, or passed onward |
| Game-of-telephone quest | **Missing** | Could be hardcoded through dialogue flags | No reusable rumor-chain or testimony comparison mechanic |
| Linguistic puzzles | **Missing** | Text display and dialogue exist | No text entry, keyword matching, translation, clue, phrase, or symbol puzzle tools |
| Location maps and travel | **Partial** | Maps, nodes, scene destinations, one required flag | No route edges, multiple unlock conditions, travel time, or map progression view |
| Scene/location unlocking | **Partial** | Map node flag gates and scene-change actions | Only one required flag and no readable unlock recipe |
| Cutscenes | **Ready** | Fullscreen video and optional target scene | No timeline/sequenced in-engine cutscene builder |
| Dream opening | **Ready** | Video cutscene can precede scene transition | Requires manual setup but is achievable |
| Gradual scene anomalies | **Missing** | Show/hide by one flag and scene duplication can approximate it | No scene variants, anomaly layers, progressive substitutions, or day-based mutations |
| Global story phases | **Missing** | Could be represented by flags | No first-class `Paleo → Glitching → Backrooms` phase system |
| Subtle randomized weirdness | **Missing** | Static objects and animations exist | No weighted random ambient response or variant pool |
| Hidden background Easter eggs | **Ready / Buried** | Clickable or non-clickable layered GIF objects | Authoring many variants is repetitive |
| Repeated shoebill visits | **Partial** | Scenes, dialogue, flags, items, and time exist | No visit counter, cooldown, relationship event, or daily interaction rule |
| Gift history | **Missing** | Consumed inventory can set flags manually | No record of what was gifted, how often, or diminishing/repeated reactions |
| Flute repair and practice | **Partial** | Items, skills, flags, clicks, and time costs can simulate it | No progress-track component or reusable practice activity |
| Background trigger after conditions converge | **Missing** | Manual scripts could do it | No project-level event rule engine |
| Automatic next-visit event | **Missing** | Manual flags and duplicated dialogue could approximate it | Needs persistent queued events and trigger timing |
| Player save/load | **Partial** | Local save/load exists | Current save omits quests, relationships, current scene, day count, and several runtime systems |
| Neocities-friendly playable export | **Ready** | Standalone HTML export | Modular directory export remains missing |

---

# 3. What Cavebot Can Build Today

With patience and extensive manual flag wiring, the current builder can create:

- The dream cutscene and awakening scene.
- Gilgrokmesh’s opening conversation and spear reward.
- Settlement rooms and point-and-click navigation.
- N, Ninn, Abasen, the scribe, children, trader, hyena, and shoebill as clickable NPC objects.
- Branching conversations with portraits and choices.
- The spear, berries, flute, food, and crafting ingredients as inventory items.
- Collecting berries and giving/consuming specific items.
- Simple skill checks and skill gains.
- Basic needs and time costs.
- Quest records and a quest log.
- One-flag location unlocks.
- Background music, sound effects, GIFs, custom cursors, and video cutscenes.
- Shoebill encounters approximated through manually set flags and duplicated dialogue paths.
- The final MechAnzu cutscene if all prerequisite state is manually collapsed into one flag.

This is enough to prototype a narrow vertical slice. It is not yet enough to author the full demo comfortably or safely.

---

# 4. Where the Current Builder Would Hurt

## Flag Explosion

Shoebill courtship alone would require manually coordinating flags resembling:

- `shoebill_met`
- `shoebill_berries_given`
- `shoebill_spear_given`
- `shoebill_scritch_requested`
- `shoebill_scritch_allowed`
- `shoebill_visit_2`
- `shoebill_visit_3`
- `flute_received`
- `flute_repair_1`
- `flute_repair_2`
- `flute_practice_1`
- `shoebill_song_ready`
- `mechanzu_triggered`

The builder offers no unified view explaining how these facts relate, which conversations set them, or what they unlock.

## Repetitive Ambient Authoring

The game wants most scenery to respond. Cavebot currently requires selecting each object and configuring its responses independently. A room with 40 silly clickables becomes administrative labor rather than play.

## Relationship State Is Not a Real System Yet

Reputation values exist, but:

- NPCs and factions use inconsistent identifiers.
- There are no named relationship tracks.
- There are no thresholds such as wary, tolerant, friendly, bonded, or courtship-ready.
- There are no gift preferences.
- There are no automatic threshold events.
- There is no relationship history.

## Time Is Cosmetic Rather Than Structural

The clock changes and needs decay, but the village cannot currently use time to:

- Move NPCs between locations.
- Open or close activities.
- Reset forage spots.
- Schedule meals.
- advance a day after sleeping.
- trigger recurring or one-time events.
- mutate scenes gradually.

## Quests Are Records, Not Robust State Machines

The game requires quest stages and conversational updates. Current quests mainly support active/completed status plus a small objective list. Several objective types are not evaluated by the runtime.

## Editor and Export Can Diverge

Some mechanics are implemented separately in `App.tsx` and `utils/exportHtml.ts`. A feature working in editor Play mode does not automatically guarantee identical behavior after export. The Nabu acceptance test needs shared behavior definitions or automated parity tests.

---

# 5. Required Builder Improvements

## Priority 0: Correctness Before New Features

These are foundational bugs or data-loss risks.

1. Make click-response execution explicitly ordered and capable of carrying conditions and effects.
2. Complete runtime handling for every declared quest objective.
3. Apply quest rewards reliably.
4. Save and restore current scene, active/completed quests, relationships, day/time, triggered events, and global phase.
5. Ensure editor Play and exported HTML use the same rules.
6. Replace inconsistent `npcId` / `factionId` reputation references with one typed relationship target.

## Priority 1: Visual Rule Builder

Add a reusable:

> When this happens → if these conditions are true → do these actions

Conditions must support:

- All / any / none groups.
- Flag present or absent.
- Item owned or quantity.
- Quest stage.
- Skill threshold.
- Need threshold.
- Relationship threshold.
- Day and time range.
- Previous interaction count.
- Current scene or story phase.

Actions must support:

- Show text or dialogue.
- Play sound or animation.
- Give, remove, or exchange items.
- Change relationships, skills, needs, and reputation.
- Start, update, branch, or complete quests.
- Set or clear remembered facts.
- Queue an event for the next visit, next day, or specific time.
- Change scene variant or global phase.

This single system unlocks a large portion of the Nabu game without specialized code.

## Priority 2: Relationship, Gift, and Courtship System

Create first-class character relationship records:

- Character identity and portrait.
- Multiple named tracks such as trust, affection, respect, fear, clan standing, and curiosity.
- Relationship stages and thresholds.
- Gift likes, loves, dislikes, and unique reactions.
- Gift history and repeat limits.
- Interaction cooldowns.
- Boundary/permission facts.
- Threshold-triggered dialogue, quests, scenes, and events.

The shoebill should be buildable through this system without dozens of loose flags.

## Priority 3: Time, Days, and NPC Schedules

Add:

- Day counter.
- Configurable clock modes: action-based, real-time, or manual.
- Sleep and next-day actions.
- Daily and scheduled event rules.
- NPC schedules by location and time.
- Shop/activity hours.
- Daily reset rules for forage spots and conversations.
- Per-day and one-time event limits.

## Priority 4: Quest State Machines

Upgrade quests to:

- Stages.
- Stage objectives.
- Stage entry and completion actions.
- Branches and alternative solutions.
- Optional objectives.
- Failure or abandonment only when explicitly desired.
- Journal updates.
- Automatic objective listening.
- Visual dependency view.

The anniversary, telephone, schoolyard, flute, and shoebill threads should each be understandable on one screen.

## Priority 5: Ambient Interaction Recipes

Add batch authoring:

- Select many props.
- Assign random flavor-text pools.
- Assign random sound pools.
- Assign harmless animation reactions.
- Set repeatable, once-per-visit, once-per-day, or one-time behavior.
- Copy/paste behavior recipes.
- Preview each response quickly.

This is essential to the Humongous Entertainment feeling.

## Priority 6: Scene Variants and Anomaly Layers

Add non-destructive variants:

- Base scene plus named variants.
- Variant overrides for visibility, source asset, position, filters, dialogue, and click behavior.
- Activate variants through rules.
- Weighted anomaly pools.
- Global story phases.
- Progressive anomaly level.

This supports the lamp-changing horror structure without duplicating entire scenes.

## Priority 7: Trading and Economy

Add:

- Trader inventories.
- Barter offers.
- Optional currencies.
- Buy, sell, trade, gift, and refuse outcomes.
- Stock quantities and refresh schedules.
- Reputation-based access or value.
- Unique conversation responses.

## Priority 8: Rumors and Linguistic Puzzles

Rumors should be collectible information records with:

- Source.
- Subject.
- Accuracy or contradiction.
- Who knows it.
- Dialogue unlocks.
- Quest relevance.
- Ability to repeat or compare testimony.

Linguistic puzzles need:

- Text entry.
- Keyword and phrase matching.
- Ordered fragments.
- Transliteration pairs.
- Symbol/logogram matching.
- Multiple valid interpretations.
- Hint and clue records.

---

# 6. Recommended Nabu-Oriented Data Model

The game should not be forced to express everything as scene-object fields.

Add project-level systems:

```text
characters
relationships
relationshipTracks
giftPreferences
facts
rumors
eventRules
scheduledEvents
days
npcSchedules
questStages
sceneVariants
storyPhases
shops
tradeOffers
activityRecipes
```

Objects should reference these systems rather than privately duplicating their logic.

Example:

```text
Shoebill object
  characterId: shoebill
  onClick: open character encounter

Shoebill relationship
  trust: 35
  curiosity: 60
  affection: 10
  boundaries.scritch: false

Event rule
  when: next_visit(shoebill)
  if:
    all:
      - trust >= 70
      - item_progress(bone_flute) >= repaired
      - flute_practice >= 3
      - story_phase == paleo_glitching
  do:
    - unlock dialogue option "Try to play a song"
```

That is dramatically safer and more understandable than assembling the same behavior through unrelated flags.

---

# 7. Recommended Development Order

## Phase A: Make Existing Systems Dependable

1. Shared condition/action schema.
2. Correct ordered response execution.
3. Quest objective and reward fixes.
4. Complete runtime save state.
5. Editor/export parity.

## Phase B: Make the Demo’s Social Core

1. Character database.
2. Relationship tracks and thresholds.
3. Gift preferences and history.
4. Quest stages.
5. Rumors/facts.

## Phase C: Make the Village Feel Alive

1. Day counter and action-based time.
2. NPC schedules.
3. Daily resets.
4. Trading/bartering.
5. Foraging and hunting activity recipes.

## Phase D: Make the Humongous-Game Magic

1. Batch ambient interactions.
2. Random response pools.
3. Once-per-visit/day behavior.
4. Scene variants and anomaly layers.

## Phase E: Make the Demo Ending

1. Flute progress activity.
2. Shoebill courtship template.
3. Soft-condition event trigger.
4. Song and MechAnzu transformation sequence.
5. Global phase transition into the Backrooms.

---

# 8. Acceptance Test

Cavebot is ready for the Nabu demo when the user can build this sequence without scripts:

1. Play a dream cutscene.
2. Present a dialogue choice that adjusts starting character traits.
3. Give the player the spear.
4. Allow free settlement exploration and dozens of ambient clicks.
5. Start several overlapping staged quests through overheard conversations.
6. Move NPCs according to time and day.
7. Forage berries that return on a later day.
8. Barter with Lunamkita and receive the flute.
9. Track several shoebill visits, gifts, boundaries, and relationship thresholds.
10. Practice and repair the flute over multiple days.
11. Gradually introduce scene anomalies without duplicating every room.
12. Unlock the song when any valid configured route satisfies the required relationship and flute conditions.
13. Play the transformation and move into the next story phase.
14. Save, reload, export, and preserve all of that state identically.

