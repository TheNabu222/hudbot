const fs = require('fs');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

// Generate characters
const chars = [
  { name: 'Nabu', desc: 'The protagonist, a would-be black sheep and animal lover.' },
  { name: 'Clan Shaman', desc: 'Wise elder who guides the spiritual energy.' },
  { name: 'Gilgrokmesh', desc: 'Chieftain\'s eldest offspring. Antagonistic but secretly insecure. Leader of the toxic masculinity ring.' },
  { name: 'Simush', desc: 'Young boy.' },
  { name: 'Dagrim', desc: 'Young boy.' },
  { name: 'Henbur', desc: 'Young girl.' },
  { name: 'Biluda', desc: 'Young girl.' },
  { name: 'Penzer', desc: 'Older boy.' },
  { name: 'Namluh', desc: 'Older girl.' },
  { name: 'Chieftain En', desc: 'The tribal chieftain. A bit of a pushover for his wife.' },
  { name: 'Chieftain Spouse Nin', desc: 'The chieftain\'s wife. Tickles her husband too much.' },
  { name: 'Gizzal', desc: 'Chieftain\'s twin daughter (older girl 1).' },
  { name: 'Garza', desc: 'Chieftain\'s twin son (older boy 1).' },
  { name: 'Market Lu-Namkita', desc: 'Market vendor.' },
  { name: 'Butcher Nin-Tabira', desc: 'The local butcher.' },
  { name: 'General Raw Goods Vendor', desc: 'Sells general items.' },
  { name: 'Curios Vendor', desc: 'Sells oddities.' },
  { name: 'Herbalist', desc: 'Sells herbs and salves.' },
  { name: 'Smithing Mentor', desc: 'Forges weapons.' },
  { name: 'Schooling Mentor', desc: 'Maintains records and teaches.' },
  { name: 'Training Mentor', desc: 'Teaches hunting and martial skills.' },
  { name: 'Didila', desc: 'Toddler (female).' },
  { name: 'Toddler 2', desc: 'Toddler (male).' },
  { name: 'Anzu the Shoebill', desc: 'A massive, stoic stork. Is it a time-glitched mechanzu?' },
  { name: 'Hyenaba', desc: 'Nabu\'s hyena familiar.' },
  { name: 'Enlilion', desc: 'Gilgrokmesh\'s lion familiar.' }
];

const charMap = {};
chars.forEach(c => {
  charMap[c.name] = { id: uuidv4(), dtId: uuidv4(), ...c };
});

// Items (Ingredients)
const items = [
  { name: 'Meat', cat: 'ingredient' },
  { name: 'Veg', cat: 'ingredient' },
  { name: 'Herb', cat: 'ingredient' },
  { name: 'Water', cat: 'ingredient' },
  { name: 'Milk', cat: 'ingredient' },
  { name: 'Salt', cat: 'ingredient' },
  { name: 'Rennet', cat: 'ingredient' },
  { name: 'Barley', cat: 'ingredient' },
  { name: 'Dates', cat: 'ingredient' },
  { name: 'Berries', cat: 'ingredient' },
  { name: 'Nuts', cat: 'ingredient' },
  // Intermediates
  { name: 'Flour', cat: 'ingredient' },
  { name: 'Dough', cat: 'ingredient' },
  { name: 'Butter', cat: 'ingredient' },
  { name: 'Cheese', cat: 'ingredient' },
  // Consumables
  { name: 'Soup', cat: 'consumable' },
  { name: 'Kebab', cat: 'consumable' },
  { name: 'Bread', cat: 'consumable' },
  { name: 'Beer', cat: 'consumable' },
  { name: 'Cake', cat: 'consumable' },
  { name: 'Stew', cat: 'consumable' },
  { name: 'Power Snack', cat: 'consumable' },
  { name: 'Salad', cat: 'consumable' }
];

const itemMap = {};
items.forEach(i => {
  itemMap[i.name] = { id: uuidv4(), ...i };
});

const recipes = [
  { name: 'Make Soup', result: 'Soup', in: [['Meat', 1], ['Water', 1]] },
  { name: 'Make Kebab', result: 'Kebab', in: [['Meat', 1], ['Herb', 1]] },
  { name: 'Make Butter', result: 'Butter', in: [['Milk', 1], ['Salt', 1]] },
  { name: 'Make Cheese', result: 'Cheese', in: [['Milk', 1], ['Salt', 1], ['Rennet', 1]] },
  { name: 'Make Flour', result: 'Flour', in: [['Barley', 1], ['Salt', 1]] },
  { name: 'Make Dough', result: 'Dough', in: [['Flour', 1], ['Water', 1]] }, // Flour+Water
  { name: 'Make Bread', result: 'Bread', in: [['Dough', 1]] }, // Dough baked
  { name: 'Brew Beer', result: 'Beer', in: [['Barley', 1], ['Dates', 1], ['Water', 1]] },
  { name: 'Bake Cake', result: 'Cake', in: [['Berries', 1], ['Dates', 1], ['Dough', 1]] },
  { name: 'Make Stew', result: 'Stew', in: [['Barley', 1], ['Salt', 1], ['Meat', 1], ['Water', 1]] },
  { name: 'Power Snack', result: 'Power Snack', in: [['Nuts', 1], ['Cheese', 1], ['Barley', 1]] },
  { name: 'Make Salad', result: 'Salad', in: [['Veg', 1], ['Herb', 1], ['Berries', 1]] }
];

// Quests
const questNetworkId = uuidv4();
const questBoundariesId = uuidv4();
const questTelephoneId = uuidv4();
const questShoebillId = uuidv4();

const project = {
  id: uuidv4(),
  name: 'Cavebot: The Babel Glitch',
  currentSceneId: uuidv4(),
  currentUiMenuId: null,
  uiMenus: [],
  gameFlags: [],
  assets: [],
  quests: [
    {
      id: questNetworkId,
      name: 'Sabotage Gilgrokmesh\'s Influencer Network',
      description: 'Gilgrokmesh has incited a ring of toxic masculinity within the schoolyard dynamics. Break it up.',
      objectives: [
        { id: uuidv4(), type: 'talk_to', targetId: charMap['Schooling Mentor'].dtId, description: 'Expose the influencer ring to the Schooling Mentor.', requiredAmount: 1 }
      ],
      rewards: [{ type: 'set_flag', targetId: 'NETWORK_SABOTAGED' }],
      autoStart: false
    },
    {
      id: questBoundariesId,
      name: 'Marital Boundaries',
      description: 'Chieftain En is a pushover for his wife Nin. He feels uncomfortable when she tickles him on anniversaries but doesn\'t know how to tell her.',
      objectives: [
        { id: uuidv4(), type: 'talk_to', targetId: charMap['Chieftain En'].dtId, description: 'Help En define his boundaries.', requiredAmount: 1 },
        { id: uuidv4(), type: 'talk_to', targetId: charMap['Chieftain Spouse Nin'].dtId, description: 'Communicate the boundaries to Nin (or encourage En to do it).', requiredAmount: 1 }
      ],
      rewards: [{ type: 'set_flag', targetId: 'BOUNDARIES_SET' }],
      autoStart: false
    },
    {
      id: questTelephoneId,
      name: 'Telephone Tangle',
      description: 'The fisher and the farmer have swapped trades without realizing it due to tangled communication. There is no HR department! Fix this.',
      objectives: [
        { id: uuidv4(), type: 'talk_to', targetId: charMap['Market Lu-Namkita'].dtId, description: 'Untangle the gossip with the Market vendor.', requiredAmount: 1 }
      ],
      rewards: [{ type: 'set_flag', targetId: 'TRADES_RESTORED' }],
      autoStart: true
    },
    {
      id: questShoebillId,
      name: 'A Stoic Courtship',
      description: 'A strange, large Shoebill stork has appeared. It does not look like normal animals. Try to feed it berries and scratch its neck.',
      objectives: [
        { id: uuidv4(), type: 'talk_to', targetId: charMap['Anzu the Shoebill'].dtId, description: 'Interact with Anzu repeatedly.', requiredAmount: 3 }
      ],
      rewards: [{ type: 'set_flag', targetId: 'ANZU_COURTED' }],
      autoStart: true
    }
  ],
  dialogueTrees: [
    {
      id: charMap['Anzu the Shoebill'].dtId,
      name: 'Anzu the Shoebill Dialogue',
      startNodeId: 'node-1',
      nodes: [
        {
          id: 'node-1', speaker: 'Anzu',
          text: '(The Shoebill stares into your soul, its mechanical-looking eyes unblinking. It lets out a clattering sound that resembles radio static.)',
          choices: [
            { id: 'c1', text: 'Offer Berries', nextNodeId: 'node-2' },
            { id: 'c2', text: 'Scratch its neck', nextNodeId: 'node-3' }
          ]
        },
        {
          id: 'node-2', speaker: 'Anzu',
          text: '(It rapidly snaps the berries from your hand. You notice a barcode glitching onto its beak for a split second before vanishing.)',
          choices: []
        },
        {
          id: 'node-3', speaker: 'Anzu',
          text: '(As you gingerly scratch its neck, it lowers its head in a formal bow. The illusion of the Paleolithic starts to crack at the seams of the skyline.)',
          choices: []
        }
      ]
    },
    {
      id: charMap['Gilgrokmesh'].dtId,
      name: 'Gilgrokmesh Dialogue',
      startNodeId: 'node-1',
      nodes: [
        {
          id: 'node-1', speaker: 'Gilgrokmesh',
          text: 'What do you want, Nabu? Go play with your filthy hyenas and stay out of clan politics. You do not understand how real men operate!',
          choices: [
            { id: 'c1', text: 'Your "politics" are just schoolyard bullying, Gilgrokmesh.', nextNodeId: 'node-2' },
            { id: 'c2', text: 'Where did you learn all this buzzword garbage anyway?', nextNodeId: 'node-3' }
          ]
        },
        {
          id: 'node-2', speaker: 'Gilgrokmesh',
          text: '(He suddenly looks hurt, looking around nervously, like Kenneth in Barbie.) I... I am a leader! Enlilion, roar at her! (The lion yawns across the room.)',
          choices: []
        },
        {
          id: 'node-3', speaker: 'Gilgrokmesh',
          text: 'It is called alpha-grindset, okay? The backrooms... wait, what are backrooms? Why did I say that? My head hurts.',
          choices: []
        }
      ]
    },
    {
      id: charMap['Chieftain En'].dtId,
      name: 'Chieftain En Dialogue',
      startNodeId: 'node-1',
      nodes: [
        {
          id: 'node-1', speaker: 'Chieftain En',
          text: 'Ah, Nabu... between you and me. Nin keeps tickling me on our anniversaries. It is so awkward. I hate it. But she\'s the boss. What do I do?',
          choices: [
            { id: 'c1', text: 'You need to set firm boundaries. Tell her you do not like being touched like that.', nextNodeId: 'node-2' }
          ]
        },
        {
          id: 'node-2', speaker: 'Chieftain En',
          text: 'Boundaries... what an incredible new word! I shall employ this boundary magic at once.',
          choices: []
        }
      ]
    },
    {
      id: charMap['Market Lu-Namkita'].dtId,
      name: 'Market Lu-Namkita Dialogue',
      startNodeId: 'node-1',
      nodes: [
        {
          id: 'node-1', speaker: 'Market Lu-Namkita',
          text: 'It is a disaster! Total HR nightmare. The farmer is fishing and the fisher is farming, and they are both terrible at it!',
          choices: [
            { id: 'c1', text: 'I will settle this game of telephone right now.', nextNodeId: 'node-2', setFlags: ['TRADES_RESTORED'] }
          ]
        },
        {
          id: 'node-2', speaker: 'Market Lu-Namkita',
          text: 'Oh thank the Goddess. Balance is restored!',
          choices: []
        }
      ]
    }
  ],
  inventoryItems: items.map(i => ({
    id: itemMap[i.name].id,
    name: i.name,
    description: i.name,
    category: i.cat,
    iconAssetId: null
  })),
  craftingRecipes: recipes.map(r => ({
    id: uuidv4(),
    name: r.name,
    description: "Craft " + r.result,
    resultItemId: itemMap[r.result].id,
    resultAmount: 1,
    ingredients: r.in.map(ing => ({ itemId: itemMap[ing[0]].id, amount: ing[1] }))
  })),
  loreEntries: [
    { id: uuidv4(), title: 'Nabu & Hyenaba', content: 'Hyenaba is the familiar of Nabu. Because of her, the local hyenas do not steal from the Paleolithic clan.', category: 'Lore' },
    { id: uuidv4(), title: 'The Backrooms Hypothesis', content: 'The timeline is glitched. The tower of Babel scrambled translations, rewriting the feminine timeline in favor of state formation and the subjugation of women. You are actually in an RLHF containment simulation.', category: 'Glitches' }
  ],
  prefabs: chars.map(c => ({
    id: uuidv4(),
    name: c.name,
    src: 'https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150',
    x: 0, y: 0, width: 64, height: 64, rotation: 0,
    zIndex: 10, opacity: 1, locked: false, cursor: 'pointer',
    animation: 'pulse',
    interaction: 'dialogue',
    interactionData: charMap[c.name].dtId,
    flavorText: c.desc,
    blendMode: 'normal',
    parallaxSpeed: 1,
    hasPhysics: true,
    physicsStatic: true
  })),
  globalSettings: {
    useDayNightCycle: true,
    enableNeeds: true,
    enableTTRPGStats: true,
    stageWidth: 1200,
    stageHeight: 800,
    snapToGrid: false,
    gridSize: 32,
    showGhostOutlines: false,
    uiColorPrimary: '#8A2BE2',
    uiColorBackground: '#111111',
    enableSettingsHud: true,
    enableInventoryHud: true,
    enableQuestsHud: true,
    enableCraftingHud: true,
    enableLoreHud: true,
    enableRelationshipsHud: true
  },
  scenes: [
    {
      id: 'default-id',
      name: 'Paleolithic Clan Settlement',
      width: 1200,
      height: 800,
      backgroundColor: '#3E2A1D',
      objects: []
    }
  ]
};

// Update project currentSceneId properly
project.currentSceneId = 'scene-cavebot-main';
project.scenes[0].id = project.currentSceneId;

// Populate initial scene objects with all our chars
chars.forEach((c, i) => {
  project.scenes[0].objects.push({
    id: uuidv4(),
    name: c.name,
    src: 'https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150',
    // spread them out
    x: 50 + (i % 8) * 100,
    y: 50 + Math.floor(i / 8) * 100,
    width: 64, height: 64, rotation: 0,
    zIndex: 10, opacity: 1, locked: false, cursor: 'pointer',
    animation: 'pulse',
    interaction: 'dialogue',
    interactionData: charMap[c.name].dtId,
    flavorText: c.desc,
    blendMode: 'normal',
    parallaxSpeed: 1,
    hasPhysics: true,
    physicsStatic: true
  });
});

const tsCode = `import { v4 as uuidv4 } from 'uuid';\nimport { Project } from '../types';\nimport { DEFAULT_ASSETS } from './assets';\n\nexport const getCavebotPreset = (): Project => {\n  const data = ${JSON.stringify(project, null, 2)};\n  data.assets = DEFAULT_ASSETS;\n  return data as Project;\n};\n`;

fs.writeFileSync('utils/cavebotTemplate.ts', tsCode);
console.log('Saved utils/cavebotTemplate.ts');
