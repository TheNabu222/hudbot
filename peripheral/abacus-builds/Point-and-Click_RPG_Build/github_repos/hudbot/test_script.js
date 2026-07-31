
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
    let state = {
      needs: { rest: 100, hunger: 100, connection: 100, spiritual: 100, novelty: 100 },
      skills: { naturalist: 5, occultist: 2, scribal: 8 },
      inventory: [],
      flags: {},
      time: 8 // 0-24
    };

    // Load from LocalStorage
    try {
      const saved = localStorage.getItem('neocities_game_save_ea476d37-1ca6-4b6f-83a1-3174a8a5a3ef');
      if (saved) {
        state = { ...state, ...JSON.parse(saved) };
      }
    } catch(e) {}

    let saveGame = () => {
      localStorage.setItem('neocities_game_save_ea476d37-1ca6-4b6f-83a1-3174a8a5a3ef', JSON.stringify(state));
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
        const gameW = 1100;
        const gameH = 925;
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
            choicesHtml += '<button onclick="chooseDialogue(' + idx + ')" style="display: block; width: 100%; text-align: left; background: transparent; color: #d4d4d8; border: none; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.2s; font-family: inherit; font-size: 16px;" onmouseover="this.style.backgroundColor=\'rgba(255,255,255,0.1)\'; this.style.color=\'var(--ui-primary)\'" onmouseout="this.style.backgroundColor=\'transparent\'; this.style.color=\'#d4d4d8\'">&#9656; ' + c.text + '</button>';
          });
          if (!hasChoices) {
              choicesHtml += '<button onclick="closeDialogue()" style="display: block; width: 100%; background: transparent; color: var(--ui-primary); border: none; padding: 16px 24px; cursor: pointer; text-align: center; font-weight: bold; font-family: inherit; font-size: 16px; border-top: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;" onmouseover="this.style.backgroundColor=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.backgroundColor=\'transparent\'">Continue...</button>';
          }
        } else {
          choicesHtml += '<button onclick="closeDialogue()" style="display: block; width: 100%; background: transparent; color: var(--ui-primary); border: none; padding: 16px 24px; cursor: pointer; text-align: center; font-weight: bold; font-family: inherit; font-size: 16px; border-top: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;" onmouseover="this.style.backgroundColor=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.backgroundColor=\'transparent\'">Continue...</button>';
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
        ['rest', 'hunger', 'connection', 'spiritual', 'novelty'].forEach(need => {
          const el = document.getElementById('need-' + need);
          if (el) el.style.width = Math.max(0, Math.min(100, state.needs[need] || 0)) + '%';
        });
      };
      updateNeedsUI();

      // Update Skills UI
      const updateSkillsUI = () => {
        ['naturalist', 'occultist', 'scribal'].forEach(skill => {
          const el = document.getElementById('skill-' + skill);
          if (el) el.style.width = Math.max(0, Math.min(100, (state.skills[skill] || 0) * 5)) + '%';
        });
      };
      updateSkillsUI();

      // Day/Night Cycle
      

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
            obj.style.transform = `translate(${-mouseX * offset}px, ${-mouseY * offset}px) rotate(${baseRot}deg)`;
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
              showSimpleDialogue(`[Skill Check Failed] ${reqSkill} roll: ${roll} vs ${diff}`, "System");
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
            showSimpleDialogue(`Gained +${amount} ${grantSkill}!`, "System");
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
          } else if (interaction === 'skill_check') {
            showSimpleDialogue("[Skill Check Success]\n" + (data || "You succeeded!"), "");
          } else if (interaction === 'toggle_inventory') {
            toggleInventory();
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
             const sourceItem = inventoryItems.find(i => i.id === selectedInventoryItemId);
             const targetItem = itemDef;
             const combinationFromSource = sourceItem?.combinations?.find(c => c.withItemId === itemId);
             const combinationFromTarget = targetItem?.combinations?.find(c => c.withItemId === selectedInventoryItemId);
             const combination = combinationFromSource || combinationFromTarget;
             if (combination) {
                 const activeSource = combinationFromSource ? sourceItem : targetItem;
                 const activeTarget = combinationFromSource ? targetItem : sourceItem;
                 if (combination.destroySelf && activeSource) {
                     const idIdx = state.inventory.indexOf(activeSource.id);
                     if (idIdx !== -1) state.inventory.splice(idIdx, 1);
                 }
                 if (combination.destroyTarget && activeTarget) {
                     const idIdx = state.inventory.indexOf(activeTarget.id);
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
            iconHtml = '<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 15; opacity: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'0\'"><div style="background: rgba(0,0,0,0.8); color: white; padding: 4px; border-radius: 4px; font-size: 10px; font-weight: bold;">Combine?</div></div>' + iconHtml;
          }

          html += '<div class="inventory-item" style="position: relative; ' + extraStyle + '" onclick="handleInventoryItemClick(\'' + itemDef.id + '\')">';
          html += '<div class="inventory-item-icon" style="position: relative; overflow: hidden;">' + iconHtml + '</div>';
          html += '<div class="inventory-item-info">';
          html += '<h3 class="inventory-item-name">' + itemDef.name + '</h3>';
          if (itemDef.description) {
            html += '<p class="inventory-item-desc">' + itemDef.description + '</p>';
          }
          
          if (isSelected && itemDef.isUsable) {
            html += '<button onclick="useInventoryItem(event, \'' + itemDef.id + '\')" style="margin-top: 8px; width: 100%; border: none; background: var(--ui-primary); color: var(--ui-bg); font-weight: bold; cursor: pointer; padding: 6px; border-radius: 4px; font-size: 12px; transition: filter 0.2s;" onmouseover="this.style.filter=\'brightness(1.2)\'" onmouseout="this.style.filter=\'none\'">USE ITEM</button>';
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
  