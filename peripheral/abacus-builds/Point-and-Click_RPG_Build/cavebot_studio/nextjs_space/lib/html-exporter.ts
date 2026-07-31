/* ============================================================
   Standalone HTML Game Exporter
   Generates a single self-contained HTML file with embedded
   game engine that plays the project data.
   ============================================================ */
import type { Project } from './types';

export function exportStandaloneHTML(project: Project): string {
  const gameData = JSON.stringify(project ?? {});

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${project?.name ?? 'Cavebot Game'}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a1a; font-family: 'Courier New', monospace; color: #e0e0e0; }
#game-container { position: relative; width: 100vw; height: 100vh; display: flex; flex-direction: column; }
#scene-viewport { position: relative; flex: 1; overflow: hidden; background: #111; }
#scene-viewport img, #scene-viewport .scene-obj { position: absolute; cursor: pointer; image-rendering: auto; }
#scene-viewport .scene-obj.bg { width: 100%; height: 100%; object-fit: cover; cursor: default; }
#scene-viewport .scene-obj:hover { filter: brightness(1.2); }
#hud-bar { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 4px; z-index: 100; }
.need-meter { background: rgba(0,0,0,0.7); border: 1px solid #444; border-radius: 4px; padding: 2px 6px; font-size: 10px; }
.need-meter .bar { height: 6px; border-radius: 2px; margin-top: 2px; transition: width 0.3s; }
#dialogue-box { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.92); border-top: 2px solid #fbff00; padding: 16px 20px; min-height: 120px; display: none; z-index: 200; }
#dialogue-box .speaker { color: #fbff00; font-size: 12px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
#dialogue-box .text { color: #e0e0e0; font-size: 13px; line-height: 1.6; margin-bottom: 10px; }
#dialogue-box .choices { display: flex; flex-direction: column; gap: 4px; }
#dialogue-box .choice-btn { background: rgba(255,255,255,0.08); border: 1px solid #555; color: #e0e0e0; padding: 6px 12px; text-align: left; cursor: pointer; font-size: 12px; border-radius: 4px; transition: background 0.15s; }
#dialogue-box .choice-btn:hover { background: rgba(251,255,0,0.15); border-color: #fbff00; }
#inventory-bar { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); display: flex; gap: 2px; background: rgba(0,0,0,0.8); border-top: 1px solid #444; padding: 4px; z-index: 150; border-radius: 4px 4px 0 0; }
.inv-slot { width: 40px; height: 40px; border: 1px solid #555; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; text-align: center; color: #aaa; background: rgba(0,0,0,0.5); cursor: pointer; overflow: hidden; }
.inv-slot img { width: 100%; height: 100%; object-fit: contain; }
.inv-slot:hover { border-color: #fbff00; }
#portrait-box { position: absolute; bottom: 130px; left: 16px; width: 80px; height: 80px; border: 2px solid #fbff00; border-radius: 8px; overflow: hidden; display: none; z-index: 201; background: #111; }
#portrait-box img { width: 100%; height: 100%; object-fit: cover; }
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(251,255,0,0.9); color: #000; padding: 8px 20px; border-radius: 6px; font-size: 12px; z-index: 999; animation: fadeOut 2s forwards; }
@keyframes fadeOut { 0%,70% { opacity: 1; } 100% { opacity: 0; } }
</style>
</head>
<body>
<div id="game-container">
  <div id="scene-viewport"></div>
  <div id="hud-bar"></div>
  <div id="portrait-box"><img id="portrait-img" src="" alt="portrait" /></div>
  <div id="dialogue-box">
    <div class="speaker" id="dlg-speaker"></div>
    <div class="text" id="dlg-text"></div>
    <div class="choices" id="dlg-choices"></div>
  </div>
  <div id="inventory-bar"></div>
</div>
<script>
(function(){
  const PROJECT = ${gameData};
  const RT = {
    currentSceneId: PROJECT.meta?.startSceneId || (PROJECT.scenes?.[0]?.id) || null,
    facts: {},
    inventory: [],
    skills: {},
    needs: {},
    relationships: {},
    questProgress: {},
    day: 1,
    time: 8,
    firedOnceIds: new Set(),
  };

  // Init needs
  (PROJECT.settings?.customNeeds || []).forEach(function(n){ RT.needs[n.key] = n.default ?? n.max ?? 100; });
  // Init facts
  (PROJECT.facts || []).forEach(function(f){ RT.facts[f.key] = f.default ?? false; });
  // Legacy flags
  (PROJECT.gameFlags || []).forEach(function(f){ RT.facts[f] = false; });

  function findScene(id){ return (PROJECT.scenes||[]).find(function(s){return s.id===id;}); }
  function findAsset(id){ return (PROJECT.assets||[]).find(function(a){return a.id===id;}); }
  function findItem(id){ return (PROJECT.items||[]).find(function(i){return i.id===id;}); }
  function findChar(id){ return (PROJECT.characters||[]).find(function(c){return c.id===id;}); }
  function findTree(id){ return (PROJECT.dialogueTrees||[]).find(function(d){return d.id===id;}); }

  function getAssetUrl(assetId){
    if(!assetId) return '';
    var a = findAsset(assetId);
    if(!a) return '';
    if(a.source?.url) return a.source.url;
    if(a.source?.repoPath) return 'https://raw.githubusercontent.com/thenabu222/entropic-ai/main/' + a.source.repoPath;
    return '';
  }

  function toast(msg){
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 2500);
  }

  function renderScene(){
    var scene = findScene(RT.currentSceneId);
    if(!scene) return;
    var vp = document.getElementById('scene-viewport');
    vp.innerHTML = '';
    vp.style.backgroundColor = scene.backgroundColor || '#111';

    // Sort objects by z-index
    var objs = (scene.objects||[]).slice().sort(function(a,b){
      return (a.transform?.zIndex||a.zIndex||0) - (b.transform?.zIndex||b.zIndex||0);
    });

    objs.forEach(function(obj){
      if(obj.hidden) return;
      // Check show/hide flags
      if(obj.showIfFlag && !RT.facts[obj.showIfFlag]) return;
      if(obj.hideIfFlag && RT.facts[obj.hideIfFlag]) return;

      var src = obj.src || getAssetUrl(obj.assetId || obj._assetId);
      if(obj.isHitbox || obj.isScript) return;

      var el;
      if(obj.isText){
        el = document.createElement('div');
        el.textContent = obj.textContent || '';
        el.style.color = obj.textColor || '#fff';
        el.style.fontSize = (obj.textFontSize||14)+'px';
        el.style.fontFamily = obj.textFontFamily || 'inherit';
      } else if(src) {
        el = document.createElement('img');
        el.src = src;
        el.alt = obj.name || '';
        el.draggable = false;
        el.onerror = function(){ this.style.display='none'; };
      } else {
        el = document.createElement('div');
        el.style.background = 'rgba(100,100,100,0.3)';
      }

      el.className = 'scene-obj';
      var t = obj.transform || obj;
      el.style.left = (t.x||0)+'px';
      el.style.top = (t.y||0)+'px';
      el.style.width = (t.w||t.width||100)+'px';
      el.style.height = (t.h||t.height||100)+'px';
      el.style.zIndex = (t.zIndex||0);
      el.style.opacity = (t.opacity ?? 1);
      if(t.rotation) el.style.transform = 'rotate('+t.rotation+'deg)';
      if(t.flipX) el.style.transform = (el.style.transform||'')+' scaleX(-1)';
      if(obj.stretchToScreen){
        el.style.left='0'; el.style.top='0'; el.style.width='100%'; el.style.height='100%';
        el.className += ' bg';
        el.style.objectFit = obj.objectFit || 'cover';
      }

      var interaction = obj.interaction || 'none';
      if(interaction === 'start-dialogue') interaction = 'dialogue';

      if(interaction !== 'none'){
        el.style.cursor = obj.cursor || 'pointer';
        el.addEventListener('click', function(){
          handleInteraction(obj, interaction);
        });
      }

      // Click responses
      if(obj.clickResponses && obj.clickResponses.length > 0){
        el.style.cursor = 'pointer';
        el.addEventListener('click', function(){
          (obj.clickResponses||[]).forEach(function(cr){
            if(cr.triggerOnce && RT.firedOnceIds.has(cr.id)) return;
            handleInteraction(cr, cr.interaction || 'none');
            if(cr.triggerOnce) RT.firedOnceIds.add(cr.id);
          });
        });
      }

      vp.appendChild(el);
    });

    renderHud();
    renderInventory();
  }

  function handleInteraction(obj, interaction){
    switch(interaction){
      case 'scene_change':
        if(obj.interactionData){
          RT.currentSceneId = obj.interactionData;
          renderScene();
        }
        break;
      case 'dialogue': case 'start-dialogue':
        var treeId = obj.dialogueTreeId || obj.interactionData;
        if(treeId) startDialogue(treeId);
        break;
      case 'collect': case 'give_item': case 'give-item':
        var itemId = obj.giveItemId || obj.interactionData;
        if(itemId){
          var item = findItem(itemId);
          RT.inventory.push(itemId);
          toast('Acquired: ' + (item?.name || 'item'));
          renderInventory();
        }
        break;
      case 'set_flag': case 'toggle_flag':
        var flag = obj.interactionData;
        if(flag){
          RT.facts[flag] = interaction==='toggle_flag' ? !RT.facts[flag] : true;
        }
        break;
      case 'sound':
        // Audio play stub
        break;
      case 'start_quest':
        if(obj.interactionData){
          RT.questProgress[obj.interactionData] = { active: true, completed: false };
          var q = (PROJECT.quests||[]).find(function(qq){return qq.id===obj.interactionData;});
          toast('Quest started: ' + (q?.name || ''));
        }
        break;
    }
    // Needs effects
    if(obj.needsEffect){
      Object.keys(obj.needsEffect||{}).forEach(function(k){
        RT.needs[k] = Math.max(0, Math.min(100, (RT.needs[k]||0) + (obj.needsEffect[k]||0)));
      });
      renderHud();
    }
  }

  function startDialogue(treeId){
    var tree = findTree(treeId);
    if(!tree || !tree.startNodeId) return;
    showDialogueNode(tree, tree.startNodeId);
  }

  function showDialogueNode(tree, nodeId){
    var node = (tree.nodes||[]).find(function(n){return n.id===nodeId;});
    if(!node){ hideDialogue(); return; }

    var box = document.getElementById('dialogue-box');
    box.style.display = 'block';
    document.getElementById('dlg-speaker').textContent = node.speaker || '';
    document.getElementById('dlg-text').textContent = node.text || '';

    // Portrait
    var portrait = document.getElementById('portrait-box');
    if(node.speakerAssetId){
      var url = getAssetUrl(node.speakerAssetId);
      if(url){
        document.getElementById('portrait-img').src = url;
        portrait.style.display = 'block';
      }
    } else { portrait.style.display = 'none'; }

    var choicesEl = document.getElementById('dlg-choices');
    choicesEl.innerHTML = '';
    var choices = (node.choices||[]).filter(function(c){
      if(c.requiredGameFlag && !RT.facts[c.requiredGameFlag]) return false;
      return true;
    });

    if(choices.length === 0){
      // Auto-close on click
      var closeBtn = document.createElement('button');
      closeBtn.className = 'choice-btn';
      closeBtn.textContent = '[Continue]';
      closeBtn.addEventListener('click', function(){ hideDialogue(); });
      choicesEl.appendChild(closeBtn);
    } else {
      choices.forEach(function(ch){
        var btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = ch.text || '...';
        btn.addEventListener('click', function(){
          // Apply choice effects
          if(ch.setGameFlag) RT.facts[ch.setGameFlag] = true;
          if(ch.giveItemId){ RT.inventory.push(ch.giveItemId); toast('Acquired item!'); renderInventory(); }
          if(ch.startQuestId){ RT.questProgress[ch.startQuestId] = { active:true, completed:false }; }
          if(ch.completeQuestId && RT.questProgress[ch.completeQuestId]){ RT.questProgress[ch.completeQuestId].completed = true; }
          if(ch.needsEffect) Object.keys(ch.needsEffect||{}).forEach(function(k){ RT.needs[k] = Math.max(0,Math.min(100,(RT.needs[k]||0)+(ch.needsEffect[k]||0))); });
          if(ch.reputationEffect){
            var charId = ch.reputationEffect.characterId;
            if(charId){ RT.relationships[charId] = (RT.relationships[charId]||50) + (ch.reputationEffect.value||0); }
          }
          if(ch.changeSceneId){
            hideDialogue();
            RT.currentSceneId = ch.changeSceneId;
            renderScene();
            return;
          }
          if(ch.nextNodeId){
            showDialogueNode(tree, ch.nextNodeId);
          } else {
            hideDialogue();
          }
        });
        choicesEl.appendChild(btn);
      });
    }
  }

  function hideDialogue(){
    document.getElementById('dialogue-box').style.display = 'none';
    document.getElementById('portrait-box').style.display = 'none';
  }

  function renderHud(){
    var bar = document.getElementById('hud-bar');
    bar.innerHTML = '';
    var needs = PROJECT.settings?.customNeeds || [];
    needs.forEach(function(n){
      var val = RT.needs[n.key] ?? n.default ?? 100;
      var pct = Math.round((val / (n.max||100)) * 100);
      var color = pct > 60 ? '#22c55e' : pct > 30 ? '#eab308' : '#ef4444';
      var el = document.createElement('div');
      el.className = 'need-meter';
      el.innerHTML = '<div style="font-size:9px;color:#aaa;">'+(n.label||n.key)+'</div><div class="bar" style="width:'+pct+'%;background:'+color+';"></div>';
      bar.appendChild(el);
    });
  }

  function renderInventory(){
    var bar = document.getElementById('inventory-bar');
    bar.innerHTML = '';
    var items = RT.inventory.slice(0, 10);
    for(var i=0; i<Math.max(items.length,6); i++){
      var slot = document.createElement('div');
      slot.className = 'inv-slot';
      if(items[i]){
        var item = findItem(items[i]);
        if(item){
          var url = getAssetUrl(item.iconAssetId);
          if(url){
            var img = document.createElement('img');
            img.src = url; img.alt = item.name || '';
            slot.appendChild(img);
          } else {
            slot.textContent = (item.name||'?').substring(0,6);
          }
          slot.title = item.name || '';
        }
      }
      bar.appendChild(slot);
    }
  }

  // Boot
  renderScene();
})();
</script>
</body>
</html>`;
}
