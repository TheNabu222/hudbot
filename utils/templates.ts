import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { DEFAULT_ASSETS } from '../App';

export const TEMPLATES: Record<string, () => Project> = {
  empty: () => ({
    id: uuidv4(),
    name: 'Empty Project',
    currentSceneId: 'scene-1',
    currentUiMenuId: null,
    uiMenus: [],
    quests: [],
    gameFlags: [],
    assets: DEFAULT_ASSETS,
    dialogueTrees: [],
    inventoryItems: [],
    globalSettings: {
      useDayNightCycle: false,
      enableNeeds: false,
      enableTTRPGStats: false,
      stageWidth: 800,
      stageHeight: 600,
      snapToGrid: false,
      gridSize: 32,
      showGhostOutlines: true
    },
    scenes: [
      {
        id: 'scene-1',
        name: 'Empty Scene',
        width: 800,
        height: 600,
        backgroundColor: '#111111',
        objects: []
      }
    ]
  }),
  rpgRoom: () => {
    const sceneId = 'scene-rpg';
    const inventoryId = uuidv4();
    return {
      id: uuidv4(),
      name: 'RPG Room Template',
      currentSceneId: sceneId,
      currentUiMenuId: null,
      uiMenus: [],
      quests: [],
      gameFlags: [],
      assets: DEFAULT_ASSETS,
      dialogueTrees: [
        {
          id: 'dt-rpg-1',
          name: 'Mysterious Chest',
          startNodeId: 'node-1',
          nodes: [
            {
              id: 'node-1',
              speaker: 'System',
              text: 'You find a mysterious chest. Open it?',
              choices: [
                { id: 'c1', text: 'Yes', nextNodeId: 'node-2' },
                { id: 'c2', text: 'Leave it', nextNodeId: null }
              ]
            },
            {
              id: 'node-2',
              speaker: 'System',
              text: 'It is locked tight. Maybe you need a key.',
              choices: []
            }
          ]
        }
      ],
      inventoryItems: [
        {
          id: inventoryId,
          name: 'Golden Key',
          description: 'A rusty golden key that looks important.',
          iconAssetId: null
        }
      ],
      globalSettings: {
        useDayNightCycle: false,
        enableNeeds: false,
        enableTTRPGStats: true,
        stageWidth: 800,
        stageHeight: 600,
        snapToGrid: true,
        gridSize: 32,
        showGhostOutlines: true
      },
      scenes: [
        {
          id: sceneId,
          name: 'Starting Room',
          width: 800,
          height: 600,
          backgroundColor: '#3b2f2f',
          objects: [
            {
              id: uuidv4(),
              name: 'Chest',
              src: 'https://picsum.photos/seed/chest/100/100',
              x: 350,
              y: 250,
              width: 100,
              height: 100,
              rotation: 0,
              zIndex: 10,
              opacity: 1,
              locked: false,
              cursor: 'pointer',
              animation: 'glow',
              interaction: 'start-dialogue',
              dialogueTreeId: 'dt-rpg-1',
              blendMode: 'normal',
              parallaxSpeed: 1,
              hasPhysics: true
            },
            {
              id: uuidv4(),
              name: 'Floor Key',
              src: 'https://picsum.photos/seed/key/40/40',
              x: 150,
              y: 400,
              width: 40,
              height: 40,
              rotation: 15,
              zIndex: 5,
              opacity: 1,
              locked: false,
              cursor: 'pointer',
              animation: 'pulse',
              animationDuration: 1.5,
              interaction: 'collect',
              giveItemId: inventoryId,
              blendMode: 'normal',
              parallaxSpeed: 1,
              hasPhysics: false
            }
          ]
        }
      ]
    };
  }
};
