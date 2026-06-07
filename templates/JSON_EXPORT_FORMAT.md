# JSON Export Format Template

Use this template as a reference for exporting and importing various modules from the engine.
This format ensures compatibility with external tools, and allows you to build features independently.

## Dialogue Export (.json)
\`\`\`json
{
  "type": "dialogueTree",
  "version": "1.0",
  "data": {
    "id": "tree_id",
    "name": "Tree Name",
    "startNodeId": "node_1",
    "nodes": [
      {
        "id": "node_1",
        "speaker": "NPC",
        "text": "Hello there!",
        "choices": [
          { "id": "choice_1", "text": "Hi!", "nextNodeId": "node_2" }
        ]
      }
    ]
  }
}
\`\`\`

## Item Details Export (.json)
\`\`\`json
{
  "type": "inventoryItem",
  "version": "1.0",
  "data": {
    "id": "item_1",
    "name": "Health Potion",
    "description": "Restores 50 HP.",
    "icon": "data:image/png;base64,...",
    "itemType": "consumable",
    "value": 25,
    "maxStack": 99,
    "craftable": false,
    "effects": [
      { "stat": "hp", "val": 50 }
    ]
  }
}
\`\`\`

## Quest Export (.json)
\`\`\`json
{
  "type": "quest",
  "version": "1.0",
  "data": {
    "id": "quest_1",
    "name": "Slay the Goblin",
    "description": "Find and defeat the goblin leader.",
    "rewardItems": [
      { "itemId": "item_gold", "amount": 100 }
    ],
    "objectives": [
      { "id": "obj_1", "description": "Kill 1 Goblin", "isCompleted": false, "type": "kill", "targetId": "enemy_goblin", "amount": 1 }
    ]
  }
}
\`\`\`
