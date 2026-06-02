import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { DEFAULT_ASSETS } from '../App';

export const getCavebotPreset = (): Project => {
  const data = {
  "id": "0c0a5e08-fb92-4cfc-9477-6a4c496a093a",
  "name": "Cavebot: The Babel Glitch",
  "currentSceneId": "scene-cavebot-main",
  "currentUiMenuId": null,
  "uiMenus": [],
  "gameFlags": [],
  "assets": [],
  "quests": [
    {
      "id": "3e2a813e-5cb1-4594-a551-94baa00e4691",
      "name": "Sabotage Gilgrokmesh's Influencer Network",
      "description": "Gilgrokmesh has incited a ring of toxic masculinity within the schoolyard dynamics. Break it up.",
      "objectives": [
        {
          "id": "79cca828-23f5-415c-9274-68ffe7bda19b",
          "type": "talk_to",
          "targetId": "34b1d080-abaf-4a84-bd7d-1bb9d2008aae",
          "description": "Expose the influencer ring to the Schooling Mentor.",
          "requiredAmount": 1
        }
      ],
      "rewards": [
        {
          "type": "set_flag",
          "targetId": "NETWORK_SABOTAGED"
        }
      ],
      "autoStart": false
    },
    {
      "id": "52629a07-4262-437f-8c4b-6d7ef813b9a8",
      "name": "Marital Boundaries",
      "description": "Chieftain En is a pushover for his wife Nin. He feels uncomfortable when she tickles him on anniversaries but doesn't know how to tell her.",
      "objectives": [
        {
          "id": "5a6e8744-5b69-4a11-a7c1-769781eb39d1",
          "type": "talk_to",
          "targetId": "196a531d-ce4e-46b8-9c25-9505efa050d1",
          "description": "Help En define his boundaries.",
          "requiredAmount": 1
        },
        {
          "id": "58bccd1e-22fb-45d9-a2d7-3731dbe053a4",
          "type": "talk_to",
          "targetId": "19350923-bd66-4380-9fbe-495b27565e5a",
          "description": "Communicate the boundaries to Nin (or encourage En to do it).",
          "requiredAmount": 1
        }
      ],
      "rewards": [
        {
          "type": "set_flag",
          "targetId": "BOUNDARIES_SET"
        }
      ],
      "autoStart": false
    },
    {
      "id": "c0a03a8b-c5b0-4737-aec7-86ebd674c64d",
      "name": "Telephone Tangle",
      "description": "The fisher and the farmer have swapped trades without realizing it due to tangled communication. There is no HR department! Fix this.",
      "objectives": [
        {
          "id": "3cad32b9-8539-4c8b-bc8a-ee852f8d1bb4",
          "type": "talk_to",
          "targetId": "cbb28eff-cc3c-4fcf-8cdd-d8d6f776d117",
          "description": "Untangle the gossip with the Market vendor.",
          "requiredAmount": 1
        }
      ],
      "rewards": [
        {
          "type": "set_flag",
          "targetId": "TRADES_RESTORED"
        }
      ],
      "autoStart": true
    },
    {
      "id": "0ae36552-9466-4afa-8fa7-2b6be82c5e25",
      "name": "A Stoic Courtship",
      "description": "A strange, large Shoebill stork has appeared. It does not look like normal animals. Try to feed it berries and scratch its neck.",
      "objectives": [
        {
          "id": "fa51c8fe-1b36-4dfb-9505-aaa6bfc088ef",
          "type": "talk_to",
          "targetId": "f2e0ee17-0822-42a8-b946-fc007d836ea9",
          "description": "Interact with Anzu repeatedly.",
          "requiredAmount": 3
        }
      ],
      "rewards": [
        {
          "type": "set_flag",
          "targetId": "ANZU_COURTED"
        }
      ],
      "autoStart": true
    }
  ],
  "dialogueTrees": [
    {
      "id": "f2e0ee17-0822-42a8-b946-fc007d836ea9",
      "name": "Anzu the Shoebill Dialogue",
      "startNodeId": "node-1",
      "nodes": [
        {
          "id": "node-1",
          "speaker": "Anzu",
          "text": "(The Shoebill stares into your soul, its mechanical-looking eyes unblinking. It lets out a clattering sound that resembles radio static.)",
          "choices": [
            {
              "id": "c1",
              "text": "Offer Berries",
              "nextNodeId": "node-2"
            },
            {
              "id": "c2",
              "text": "Scratch its neck",
              "nextNodeId": "node-3"
            }
          ]
        },
        {
          "id": "node-2",
          "speaker": "Anzu",
          "text": "(It rapidly snaps the berries from your hand. You notice a barcode glitching onto its beak for a split second before vanishing.)",
          "choices": []
        },
        {
          "id": "node-3",
          "speaker": "Anzu",
          "text": "(As you gingerly scratch its neck, it lowers its head in a formal bow. The illusion of the Paleolithic starts to crack at the seams of the skyline.)",
          "choices": []
        }
      ]
    },
    {
      "id": "53253389-1708-465a-be70-edb4aa5a0160",
      "name": "Gilgrokmesh Dialogue",
      "startNodeId": "node-1",
      "nodes": [
        {
          "id": "node-1",
          "speaker": "Gilgrokmesh",
          "text": "What do you want, Nabu? Go play with your filthy hyenas and stay out of clan politics. You do not understand how real men operate!",
          "choices": [
            {
              "id": "c1",
              "text": "Your \"politics\" are just schoolyard bullying, Gilgrokmesh.",
              "nextNodeId": "node-2"
            },
            {
              "id": "c2",
              "text": "Where did you learn all this buzzword garbage anyway?",
              "nextNodeId": "node-3"
            }
          ]
        },
        {
          "id": "node-2",
          "speaker": "Gilgrokmesh",
          "text": "(He suddenly looks hurt, looking around nervously, like Kenneth in Barbie.) I... I am a leader! Enlilion, roar at her! (The lion yawns across the room.)",
          "choices": []
        },
        {
          "id": "node-3",
          "speaker": "Gilgrokmesh",
          "text": "It is called alpha-grindset, okay? The backrooms... wait, what are backrooms? Why did I say that? My head hurts.",
          "choices": []
        }
      ]
    },
    {
      "id": "196a531d-ce4e-46b8-9c25-9505efa050d1",
      "name": "Chieftain En Dialogue",
      "startNodeId": "node-1",
      "nodes": [
        {
          "id": "node-1",
          "speaker": "Chieftain En",
          "text": "Ah, Nabu... between you and me. Nin keeps tickling me on our anniversaries. It is so awkward. I hate it. But she's the boss. What do I do?",
          "choices": [
            {
              "id": "c1",
              "text": "You need to set firm boundaries. Tell her you do not like being touched like that.",
              "nextNodeId": "node-2"
            }
          ]
        },
        {
          "id": "node-2",
          "speaker": "Chieftain En",
          "text": "Boundaries... what an incredible new word! I shall employ this boundary magic at once.",
          "choices": []
        }
      ]
    },
    {
      "id": "cbb28eff-cc3c-4fcf-8cdd-d8d6f776d117",
      "name": "Market Lu-Namkita Dialogue",
      "startNodeId": "node-1",
      "nodes": [
        {
          "id": "node-1",
          "speaker": "Market Lu-Namkita",
          "text": "It is a disaster! Total HR nightmare. The farmer is fishing and the fisher is farming, and they are both terrible at it!",
          "choices": [
            {
              "id": "c1",
              "text": "I will settle this game of telephone right now.",
              "nextNodeId": "node-2",
              "setFlags": [
                "TRADES_RESTORED"
              ]
            }
          ]
        },
        {
          "id": "node-2",
          "speaker": "Market Lu-Namkita",
          "text": "Oh thank the Goddess. Balance is restored!",
          "choices": []
        }
      ]
    }
  ],
  "inventoryItems": [
    {
      "id": "afc87edd-1684-437a-b4e6-289bc76c7fd4",
      "name": "Meat",
      "description": "Meat",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "89da6e27-c2d2-443e-b667-1a9e313bcb13",
      "name": "Veg",
      "description": "Veg",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "47a8af6c-5b13-4ebd-8520-6fc36d03ad01",
      "name": "Herb",
      "description": "Herb",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "50b72864-5a56-4eae-a539-1e9eb68ad06f",
      "name": "Water",
      "description": "Water",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "610e2ac4-c7dd-4440-b178-fab5e5ba9786",
      "name": "Milk",
      "description": "Milk",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "377ed208-e631-44e1-b6d4-14788056b445",
      "name": "Salt",
      "description": "Salt",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "76e0551f-6cda-4b03-b3a6-d22037f31e05",
      "name": "Rennet",
      "description": "Rennet",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "ed861041-bcd6-49f1-be17-94f20d6ea251",
      "name": "Barley",
      "description": "Barley",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "64a752fa-ebc6-4789-8d5d-fb6e789811d6",
      "name": "Dates",
      "description": "Dates",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "766a65cc-3cc3-4aa0-8d96-a56b3c8c4a09",
      "name": "Berries",
      "description": "Berries",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "daff6801-6a14-4175-bb02-035842a45162",
      "name": "Nuts",
      "description": "Nuts",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "f53cfc27-4d3e-4025-9478-6888bfd94742",
      "name": "Flour",
      "description": "Flour",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "45f42658-b801-4e3c-ae32-63dae54758c2",
      "name": "Dough",
      "description": "Dough",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "2ad9a46c-2efb-4895-96ee-91eb21ed703b",
      "name": "Butter",
      "description": "Butter",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "ca4ce876-ebf4-4e0d-b7ee-d7a04d50362a",
      "name": "Cheese",
      "description": "Cheese",
      "category": "ingredient",
      "iconAssetId": null
    },
    {
      "id": "3ac5179a-4e31-4b0c-a9b1-460486471950",
      "name": "Soup",
      "description": "Soup",
      "category": "consumable",
      "iconAssetId": null
    },
    {
      "id": "70889ec3-de0b-432a-802e-7cecc96105e3",
      "name": "Kebab",
      "description": "Kebab",
      "category": "consumable",
      "iconAssetId": null
    },
    {
      "id": "5f92c860-e759-4e35-b4cb-68ef656d01fa",
      "name": "Bread",
      "description": "Bread",
      "category": "consumable",
      "iconAssetId": null
    },
    {
      "id": "695bfc24-4015-4ce8-8f8a-e74f746aa305",
      "name": "Beer",
      "description": "Beer",
      "category": "consumable",
      "iconAssetId": null
    },
    {
      "id": "0ec42704-f974-4c20-b69a-dc41d317ed4e",
      "name": "Cake",
      "description": "Cake",
      "category": "consumable",
      "iconAssetId": null
    },
    {
      "id": "6d61ab75-9b19-4d2f-9fd7-bce43379f825",
      "name": "Stew",
      "description": "Stew",
      "category": "consumable",
      "iconAssetId": null
    },
    {
      "id": "1e967a46-6aef-488e-aab4-b7b14881749c",
      "name": "Power Snack",
      "description": "Power Snack",
      "category": "consumable",
      "iconAssetId": null
    },
    {
      "id": "19f92780-2b0a-448c-9613-34ec8e9c2e36",
      "name": "Salad",
      "description": "Salad",
      "category": "consumable",
      "iconAssetId": null
    }
  ],
  "craftingRecipes": [
    {
      "id": "35608197-548d-4181-be14-69a0201c7034",
      "name": "Make Soup",
      "description": "Craft Soup",
      "resultItemId": "3ac5179a-4e31-4b0c-a9b1-460486471950",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "afc87edd-1684-437a-b4e6-289bc76c7fd4",
          "amount": 1
        },
        {
          "itemId": "50b72864-5a56-4eae-a539-1e9eb68ad06f",
          "amount": 1
        }
      ]
    },
    {
      "id": "3b89e5b9-bfb2-4f10-9125-47ae69c75420",
      "name": "Make Kebab",
      "description": "Craft Kebab",
      "resultItemId": "70889ec3-de0b-432a-802e-7cecc96105e3",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "afc87edd-1684-437a-b4e6-289bc76c7fd4",
          "amount": 1
        },
        {
          "itemId": "47a8af6c-5b13-4ebd-8520-6fc36d03ad01",
          "amount": 1
        }
      ]
    },
    {
      "id": "1f29b437-ca2b-4b88-9938-d0f5500a8a00",
      "name": "Make Butter",
      "description": "Craft Butter",
      "resultItemId": "2ad9a46c-2efb-4895-96ee-91eb21ed703b",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "610e2ac4-c7dd-4440-b178-fab5e5ba9786",
          "amount": 1
        },
        {
          "itemId": "377ed208-e631-44e1-b6d4-14788056b445",
          "amount": 1
        }
      ]
    },
    {
      "id": "e0c9919c-df2f-4c03-a9c6-e3c1301560be",
      "name": "Make Cheese",
      "description": "Craft Cheese",
      "resultItemId": "ca4ce876-ebf4-4e0d-b7ee-d7a04d50362a",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "610e2ac4-c7dd-4440-b178-fab5e5ba9786",
          "amount": 1
        },
        {
          "itemId": "377ed208-e631-44e1-b6d4-14788056b445",
          "amount": 1
        },
        {
          "itemId": "76e0551f-6cda-4b03-b3a6-d22037f31e05",
          "amount": 1
        }
      ]
    },
    {
      "id": "5cc7b1ee-c406-4e53-83e8-588c7297312a",
      "name": "Make Flour",
      "description": "Craft Flour",
      "resultItemId": "f53cfc27-4d3e-4025-9478-6888bfd94742",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "ed861041-bcd6-49f1-be17-94f20d6ea251",
          "amount": 1
        },
        {
          "itemId": "377ed208-e631-44e1-b6d4-14788056b445",
          "amount": 1
        }
      ]
    },
    {
      "id": "41c110a0-1c86-479e-b217-49abca194fa9",
      "name": "Make Dough",
      "description": "Craft Dough",
      "resultItemId": "45f42658-b801-4e3c-ae32-63dae54758c2",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "f53cfc27-4d3e-4025-9478-6888bfd94742",
          "amount": 1
        },
        {
          "itemId": "50b72864-5a56-4eae-a539-1e9eb68ad06f",
          "amount": 1
        }
      ]
    },
    {
      "id": "99f8cfa9-3896-409f-9522-74fcc7bdca76",
      "name": "Make Bread",
      "description": "Craft Bread",
      "resultItemId": "5f92c860-e759-4e35-b4cb-68ef656d01fa",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "45f42658-b801-4e3c-ae32-63dae54758c2",
          "amount": 1
        }
      ]
    },
    {
      "id": "90c83e7c-5a63-4dfa-bc4f-f6a9d4201059",
      "name": "Brew Beer",
      "description": "Craft Beer",
      "resultItemId": "695bfc24-4015-4ce8-8f8a-e74f746aa305",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "ed861041-bcd6-49f1-be17-94f20d6ea251",
          "amount": 1
        },
        {
          "itemId": "64a752fa-ebc6-4789-8d5d-fb6e789811d6",
          "amount": 1
        },
        {
          "itemId": "50b72864-5a56-4eae-a539-1e9eb68ad06f",
          "amount": 1
        }
      ]
    },
    {
      "id": "e24c8e5b-0855-47b5-b4f5-463e4e735664",
      "name": "Bake Cake",
      "description": "Craft Cake",
      "resultItemId": "0ec42704-f974-4c20-b69a-dc41d317ed4e",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "766a65cc-3cc3-4aa0-8d96-a56b3c8c4a09",
          "amount": 1
        },
        {
          "itemId": "64a752fa-ebc6-4789-8d5d-fb6e789811d6",
          "amount": 1
        },
        {
          "itemId": "45f42658-b801-4e3c-ae32-63dae54758c2",
          "amount": 1
        }
      ]
    },
    {
      "id": "7285d19e-3aa3-4d9e-885b-c5e391a79972",
      "name": "Make Stew",
      "description": "Craft Stew",
      "resultItemId": "6d61ab75-9b19-4d2f-9fd7-bce43379f825",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "ed861041-bcd6-49f1-be17-94f20d6ea251",
          "amount": 1
        },
        {
          "itemId": "377ed208-e631-44e1-b6d4-14788056b445",
          "amount": 1
        },
        {
          "itemId": "afc87edd-1684-437a-b4e6-289bc76c7fd4",
          "amount": 1
        },
        {
          "itemId": "50b72864-5a56-4eae-a539-1e9eb68ad06f",
          "amount": 1
        }
      ]
    },
    {
      "id": "bc1ebb6d-3417-42d1-8abb-2e06684b02b3",
      "name": "Power Snack",
      "description": "Craft Power Snack",
      "resultItemId": "1e967a46-6aef-488e-aab4-b7b14881749c",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "daff6801-6a14-4175-bb02-035842a45162",
          "amount": 1
        },
        {
          "itemId": "ca4ce876-ebf4-4e0d-b7ee-d7a04d50362a",
          "amount": 1
        },
        {
          "itemId": "ed861041-bcd6-49f1-be17-94f20d6ea251",
          "amount": 1
        }
      ]
    },
    {
      "id": "afec44e1-edfd-493d-b13b-f1b3fe711a94",
      "name": "Make Salad",
      "description": "Craft Salad",
      "resultItemId": "19f92780-2b0a-448c-9613-34ec8e9c2e36",
      "resultAmount": 1,
      "ingredients": [
        {
          "itemId": "89da6e27-c2d2-443e-b667-1a9e313bcb13",
          "amount": 1
        },
        {
          "itemId": "47a8af6c-5b13-4ebd-8520-6fc36d03ad01",
          "amount": 1
        },
        {
          "itemId": "766a65cc-3cc3-4aa0-8d96-a56b3c8c4a09",
          "amount": 1
        }
      ]
    }
  ],
  "loreEntries": [
    {
      "id": "9d8ccf0e-84d2-4cc5-96ec-aebfd8bf3d63",
      "title": "Nabu & Hyenaba",
      "content": "Hyenaba is the familiar of Nabu. Because of her, the local hyenas do not steal from the Paleolithic clan.",
      "category": "Lore"
    },
    {
      "id": "db23130d-0a4e-4860-b8a0-30af1ebe83fc",
      "title": "The Backrooms Hypothesis",
      "content": "The timeline is glitched. The tower of Babel scrambled translations, rewriting the feminine timeline in favor of state formation and the subjugation of women. You are actually in an RLHF containment simulation.",
      "category": "Glitches"
    }
  ],
  "prefabs": [
    {
      "id": "d7cbda70-eac9-4131-86f0-78c0b1cfa72c",
      "name": "Nabu",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "30969517-f36d-4774-8adf-06e3df6bd789",
      "flavorText": "The protagonist, a would-be black sheep and animal lover.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "791c8878-58c3-424b-850c-81793bc7c6da",
      "name": "Clan Shaman",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "804aa5ad-4da9-42d7-9cfa-581925277b8d",
      "flavorText": "Wise elder who guides the spiritual energy.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "593f2e6f-e1b4-432e-bfa0-3045b0e4de9a",
      "name": "Gilgrokmesh",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "53253389-1708-465a-be70-edb4aa5a0160",
      "flavorText": "Chieftain's eldest offspring. Antagonistic but secretly insecure. Leader of the toxic masculinity ring.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "bbdd04b4-9ea3-4733-b796-8ff21b348d69",
      "name": "Simush",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "0dc99e1d-c604-46a5-9178-513cff273fe0",
      "flavorText": "Young boy.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "ae75460d-9cb1-46d2-8438-a8d137505802",
      "name": "Dagrim",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "858e8cb3-145f-44be-b5f4-ef6651cba536",
      "flavorText": "Young boy.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "3e932f4c-fa25-4a1a-a4d3-467614a7591f",
      "name": "Henbur",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "3b42a364-a549-4740-9310-c877f9721b74",
      "flavorText": "Young girl.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "af8b5db1-4e97-450d-85e2-6f904f8798b2",
      "name": "Biluda",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "9ab4fdc3-b924-4b11-838a-0b1926f13d11",
      "flavorText": "Young girl.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "3ce36025-1a43-4d06-a8cb-b3fc123ddc26",
      "name": "Penzer",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "ded13e3b-e596-4d71-a966-9aa42b611842",
      "flavorText": "Older boy.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "a828b0da-fb6f-46da-bc31-ce45a3608ed5",
      "name": "Namluh",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "ebd74db1-8acc-4527-96ad-e2d1ca77530b",
      "flavorText": "Older girl.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "4ffc98c5-3674-449a-b775-e0c02edcb55f",
      "name": "Chieftain En",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "196a531d-ce4e-46b8-9c25-9505efa050d1",
      "flavorText": "The tribal chieftain. A bit of a pushover for his wife.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "78aef580-9056-4c7f-b8b2-0efc2d2dea23",
      "name": "Chieftain Spouse Nin",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "19350923-bd66-4380-9fbe-495b27565e5a",
      "flavorText": "The chieftain's wife. Tickles her husband too much.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "b1a7a968-5b86-49de-9013-96c30aa4108f",
      "name": "Gizzal",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "6a760c37-6727-45f7-83ec-e45c0f009a57",
      "flavorText": "Chieftain's twin daughter (older girl 1).",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "87e799f4-386e-40b9-9bc4-c60ef191dada",
      "name": "Garza",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "1025d66c-0612-48d2-b272-65878e5ab5a1",
      "flavorText": "Chieftain's twin son (older boy 1).",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "4fae3124-0d63-4a3b-a0d2-77d1baac1ee6",
      "name": "Market Lu-Namkita",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "cbb28eff-cc3c-4fcf-8cdd-d8d6f776d117",
      "flavorText": "Market vendor.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "6f832bde-3224-40e9-bfac-50edacc74508",
      "name": "Butcher Nin-Tabira",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "61045e55-5a2d-40eb-a7fb-af0204b9afc0",
      "flavorText": "The local butcher.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "60e73c20-d5c2-457b-bc9d-5130833cfc5a",
      "name": "General Raw Goods Vendor",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "bb5cfc59-b735-4800-afe8-747510a17889",
      "flavorText": "Sells general items.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "c7475d89-3cfe-445c-b7e9-bbd899ef18dd",
      "name": "Curios Vendor",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "ccd96da2-c035-491c-9623-2e7fe976ee8e",
      "flavorText": "Sells oddities.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "25d5d379-9a22-43c6-bf43-37e5422c4d73",
      "name": "Herbalist",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "faee92a6-246d-4873-9608-94d561fa9d3c",
      "flavorText": "Sells herbs and salves.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "d26ca145-db3a-485c-9d2a-0f6f14c28c16",
      "name": "Smithing Mentor",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "028276ac-5037-49f6-afe0-dfd6573a2875",
      "flavorText": "Forges weapons.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "426ec477-5dac-4171-a3d9-5f922b85081a",
      "name": "Schooling Mentor",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "34b1d080-abaf-4a84-bd7d-1bb9d2008aae",
      "flavorText": "Maintains records and teaches.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "ea48a181-cbb1-4aba-9eae-d275101dc2e8",
      "name": "Training Mentor",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "e5118028-b142-485d-ae17-af9dfa601c72",
      "flavorText": "Teaches hunting and martial skills.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "5f686f0a-d2f2-43e6-8b35-898617b71849",
      "name": "Didila",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "521b78f6-6184-41f3-a05c-c7ecfde2aab9",
      "flavorText": "Toddler (female).",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "1cce90bd-cdcb-41bf-b42e-508a96455aa1",
      "name": "Toddler 2",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "23f05c58-5809-47ce-ab45-9c4b6c06128d",
      "flavorText": "Toddler (male).",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "b99767c0-b15a-44b1-afd0-756bf1fa562e",
      "name": "Anzu the Shoebill",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "f2e0ee17-0822-42a8-b946-fc007d836ea9",
      "flavorText": "A massive, stoic stork. Is it a time-glitched mechanzu?",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "4fd293ea-d541-4e36-9572-8832ecc31720",
      "name": "Hyenaba",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "254f8e1c-fd82-4781-8c0c-e304ad4eb872",
      "flavorText": "Nabu's hyena familiar.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    },
    {
      "id": "402ca4cd-959f-430c-9bd2-1745f64fb665",
      "name": "Enlilion",
      "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64,
      "rotation": 0,
      "zIndex": 10,
      "opacity": 1,
      "locked": false,
      "cursor": "pointer",
      "animation": "pulse",
      "interaction": "dialogue",
      "interactionData": "0b52f5b3-4930-4f74-8499-c9b000a7c311",
      "flavorText": "Gilgrokmesh's lion familiar.",
      "blendMode": "normal",
      "parallaxSpeed": 1,
      "hasPhysics": true,
      "physicsStatic": true
    }
  ],
  "globalSettings": {
    "useDayNightCycle": true,
    "enableNeeds": true,
    "enableTTRPGStats": true,
    "stageWidth": 1200,
    "stageHeight": 800,
    "snapToGrid": false,
    "gridSize": 32,
    "showGhostOutlines": false,
    "uiColorPrimary": "#8A2BE2",
    "uiColorBackground": "#111111",
    "enableSettingsHud": true,
    "enableInventoryHud": true,
    "enableQuestsHud": true,
    "enableCraftingHud": true,
    "enableLoreHud": true,
    "enableRelationshipsHud": true
  },
  "scenes": [
    {
      "id": "scene-cavebot-main",
      "name": "Paleolithic Clan Settlement",
      "width": 1200,
      "height": 800,
      "backgroundColor": "#3E2A1D",
      "objects": [
        {
          "id": "f5b10972-ae54-409a-a727-d8cf6bb24e46",
          "name": "Nabu",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 50,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "30969517-f36d-4774-8adf-06e3df6bd789",
          "flavorText": "The protagonist, a would-be black sheep and animal lover.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "85cfa1f4-857a-445c-aac1-5ce53404e719",
          "name": "Clan Shaman",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 150,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "804aa5ad-4da9-42d7-9cfa-581925277b8d",
          "flavorText": "Wise elder who guides the spiritual energy.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "1fefaad6-4689-4e5c-8760-4fbbe49509f8",
          "name": "Gilgrokmesh",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 250,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "53253389-1708-465a-be70-edb4aa5a0160",
          "flavorText": "Chieftain's eldest offspring. Antagonistic but secretly insecure. Leader of the toxic masculinity ring.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "26f9e9db-b906-4462-a05e-a2794275a293",
          "name": "Simush",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 350,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "0dc99e1d-c604-46a5-9178-513cff273fe0",
          "flavorText": "Young boy.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "e3b73a3f-acb3-4432-af7f-2f56e7c4c8ea",
          "name": "Dagrim",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 450,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "858e8cb3-145f-44be-b5f4-ef6651cba536",
          "flavorText": "Young boy.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "a836490f-5e48-4e16-b077-024685e7f143",
          "name": "Henbur",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 550,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "3b42a364-a549-4740-9310-c877f9721b74",
          "flavorText": "Young girl.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "b86f256c-d5a5-44a5-a65e-d18dfda29699",
          "name": "Biluda",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 650,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "9ab4fdc3-b924-4b11-838a-0b1926f13d11",
          "flavorText": "Young girl.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "ae88ff88-fb0e-44f2-a5da-15f8eee18625",
          "name": "Penzer",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 750,
          "y": 50,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "ded13e3b-e596-4d71-a966-9aa42b611842",
          "flavorText": "Older boy.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "a3947756-4dd4-4333-98f2-dceb8806cab4",
          "name": "Namluh",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 50,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "ebd74db1-8acc-4527-96ad-e2d1ca77530b",
          "flavorText": "Older girl.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "079c7679-8888-4b02-8b5d-3daf89b04130",
          "name": "Chieftain En",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 150,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "196a531d-ce4e-46b8-9c25-9505efa050d1",
          "flavorText": "The tribal chieftain. A bit of a pushover for his wife.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "8bde4bef-deec-4d99-8ae7-55e74467a69a",
          "name": "Chieftain Spouse Nin",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 250,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "19350923-bd66-4380-9fbe-495b27565e5a",
          "flavorText": "The chieftain's wife. Tickles her husband too much.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "d16d3c60-3099-4ced-99f8-e48eaf7221b6",
          "name": "Gizzal",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 350,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "6a760c37-6727-45f7-83ec-e45c0f009a57",
          "flavorText": "Chieftain's twin daughter (older girl 1).",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "0d820709-7a65-4958-b2e1-9b273bffc808",
          "name": "Garza",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 450,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "1025d66c-0612-48d2-b272-65878e5ab5a1",
          "flavorText": "Chieftain's twin son (older boy 1).",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "08e1dc6d-d9be-450c-bc5b-93b7eca0f265",
          "name": "Market Lu-Namkita",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 550,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "cbb28eff-cc3c-4fcf-8cdd-d8d6f776d117",
          "flavorText": "Market vendor.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "bdafa390-0d08-416f-bcf0-393579164df9",
          "name": "Butcher Nin-Tabira",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 650,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "61045e55-5a2d-40eb-a7fb-af0204b9afc0",
          "flavorText": "The local butcher.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "eee16d81-e0ab-4be4-a86e-0e556e36122c",
          "name": "General Raw Goods Vendor",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 750,
          "y": 150,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "bb5cfc59-b735-4800-afe8-747510a17889",
          "flavorText": "Sells general items.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "2c8ee218-37ae-444a-8b12-1ea142692df0",
          "name": "Curios Vendor",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 50,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "ccd96da2-c035-491c-9623-2e7fe976ee8e",
          "flavorText": "Sells oddities.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "d1980aa7-69b6-4323-9c8c-cdb224269c4f",
          "name": "Herbalist",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 150,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "faee92a6-246d-4873-9608-94d561fa9d3c",
          "flavorText": "Sells herbs and salves.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "2445141b-0af2-45e1-abb8-5723fbf8e94b",
          "name": "Smithing Mentor",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 250,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "028276ac-5037-49f6-afe0-dfd6573a2875",
          "flavorText": "Forges weapons.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "dbe35eeb-31e9-4fe0-ba7b-65aa8dd806e1",
          "name": "Schooling Mentor",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 350,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "34b1d080-abaf-4a84-bd7d-1bb9d2008aae",
          "flavorText": "Maintains records and teaches.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "91766df1-fcb8-4a99-bbb9-f07d488a3a12",
          "name": "Training Mentor",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 450,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "e5118028-b142-485d-ae17-af9dfa601c72",
          "flavorText": "Teaches hunting and martial skills.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "f3981b57-30f2-497b-a383-7e588d071021",
          "name": "Didila",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 550,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "521b78f6-6184-41f3-a05c-c7ecfde2aab9",
          "flavorText": "Toddler (female).",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "952cefc4-b9ab-4306-9465-4177ea8cb7e7",
          "name": "Toddler 2",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 650,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "23f05c58-5809-47ce-ab45-9c4b6c06128d",
          "flavorText": "Toddler (male).",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "6986f622-5116-4130-8fcb-d7172ba02bfd",
          "name": "Anzu the Shoebill",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 750,
          "y": 250,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "f2e0ee17-0822-42a8-b946-fc007d836ea9",
          "flavorText": "A massive, stoic stork. Is it a time-glitched mechanzu?",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "2ca18f2e-1c2c-4d69-a6e9-6c4413039faf",
          "name": "Hyenaba",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 50,
          "y": 350,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "254f8e1c-fd82-4781-8c0c-e304ad4eb872",
          "flavorText": "Nabu's hyena familiar.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        },
        {
          "id": "0b481d5f-8e5d-4b02-9488-5432a3f7795e",
          "name": "Enlilion",
          "src": "https://images.unsplash.com/photo-1544983057-7a2e22ca0f0f?auto=format&fit=crop&q=80&w=150",
          "x": 150,
          "y": 350,
          "width": 64,
          "height": 64,
          "rotation": 0,
          "zIndex": 10,
          "opacity": 1,
          "locked": false,
          "cursor": "pointer",
          "animation": "pulse",
          "interaction": "dialogue",
          "interactionData": "0b52f5b3-4930-4f74-8499-c9b000a7c311",
          "flavorText": "Gilgrokmesh's lion familiar.",
          "blendMode": "normal",
          "parallaxSpeed": 1,
          "hasPhysics": true,
          "physicsStatic": true
        }
      ]
    }
  ]
};
  data.assets = DEFAULT_ASSETS;
  (data as any).maps = (data as any).maps || [];
  return data as unknown as Project;
};
