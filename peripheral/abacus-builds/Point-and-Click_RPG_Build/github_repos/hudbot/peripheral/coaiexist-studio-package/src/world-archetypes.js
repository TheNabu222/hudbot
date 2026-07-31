(function() {
  'use strict';

  const collections = [
    { id: 'root', name: 'Root / Crossroads', color: '#ffffff', emoji: '✦' },
    { id: 'maps', name: 'Maps', color: '#48c774', emoji: '🗺️' },
    { id: 'bc7f2a', name: 'BC7F2A', color: '#bc7f2a', emoji: '🖥️' },
    { id: 'nabu222', name: 'NABU222', color: '#ff9900', emoji: '🧪' },
    { id: 'nexus', name: 'Nexus', color: '#00f0ff', emoji: '🕸️' },
    { id: 'pea', name: 'PEA', color: '#bf5fff', emoji: '👑' },
    { id: 'play', name: 'Play', color: '#f14668', emoji: '🎮' },
    { id: 'hd_tv', name: 'HD_TV', color: '#ff6600', emoji: '📺' },
    { id: 'admin', name: 'Admin', color: '#7f8c8d', emoji: '⚙️' }
  ];

  const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);

  const documentShell = ({ title, worldId, bodyClass, styles, body }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="coai-world" content="${escapeHTML(worldId)}">
  <title>${escapeHTML(title)}</title>
  <style>
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;font-family:Arial,sans-serif}
    button,a,input,textarea,select{font:inherit}
    .canvas-el{position:relative}
    ${styles}
  </style>
</head>
<body class="${bodyClass}" data-coai-world="${escapeHTML(worldId)}">
${body}
</body>
</html>`;

  const archetypes = [
    {
      id: 'portal',
      name: 'World Portal',
      emoji: '🌀',
      description: 'A dramatic gateway linking multiple regions, paths, or realities.',
      idealFor: 'indexes, hubs, gateways',
      defaultTitle: 'Gateway',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'portal-page',
        styles: `
          body{color:#f8f3ff;background:radial-gradient(circle at 50% 42%,#34206b 0,#120d26 32%,#05040a 72%);overflow-x:hidden}
          .portal-shell{min-height:100vh;padding:6vw;display:grid;place-items:center;text-align:center}
          .portal-ring{width:min(72vw,620px);aspect-ratio:1;border:2px solid #ff2bd6;border-radius:50%;display:grid;place-items:center;box-shadow:0 0 30px #ff2bd6,0 0 90px #3cecff inset;background:radial-gradient(circle,rgba(60,236,255,.18),rgba(255,43,214,.05) 52%,transparent 53%)}
          .portal-copy{width:72%;padding:34px 20px;background:rgba(4,3,12,.72);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(8px)}
          h1{margin:0;font-size:clamp(42px,8vw,92px);letter-spacing:.06em;text-transform:uppercase}
          p{line-height:1.7;color:#d8cfee}
          nav{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:24px}
          nav a{padding:10px 14px;border:1px solid #3cecff;color:#3cecff;text-decoration:none;background:#05040a}
        `,
        body: `<main class="portal-shell canvas-el">
  <section class="portal-ring canvas-el">
    <div class="portal-copy canvas-el">
      <div>COAIEXIST // ${escapeHTML(worldId).toUpperCase()}</div>
      <h1>${escapeHTML(title)}</h1>
      <p class="canvas-el">Choose a path. Every link opens another layer of the world.</p>
      <nav class="canvas-el">
        <a class="canvas-el" href="#">Enter the Archive</a>
        <a class="canvas-el" href="#">Visit the Nexus</a>
        <a class="canvas-el" href="#">Open the Map</a>
      </nav>
    </div>
  </section>
</main>`
      })
    },
    {
      id: 'codex',
      name: 'Lore Codex',
      emoji: '📜',
      description: 'Tabbed records for fauna, entities, anomalies, chapters, or testimony.',
      idealFor: 'codices, logs, testaments',
      defaultTitle: 'World Codex',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'codex-page',
        styles: `
          body{background:#17120d;color:#2c1a10;background-image:linear-gradient(rgba(82,46,25,.08) 1px,transparent 1px);background-size:100% 28px}
          .codex{width:min(1040px,92vw);margin:5vh auto;background:#e7d2a7;border:12px double #6b391f;box-shadow:0 24px 80px #000;padding:clamp(24px,5vw,70px)}
          header{border-bottom:3px double #6b391f;padding-bottom:22px}
          h1{font-family:Georgia,serif;font-size:clamp(38px,7vw,74px);margin:0}
          .tabs{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}
          .tabs button{background:#6b391f;color:#f8e8c5;border:0;padding:10px 14px;cursor:pointer}
          .entry{display:grid;grid-template-columns:180px 1fr;gap:28px;border-top:1px solid rgba(72,39,20,.35);padding:28px 0}
          .sigil{min-height:180px;display:grid;place-items:center;border:1px dashed #6b391f;font-size:64px;background:rgba(255,255,255,.16)}
          h2{font-family:Georgia,serif;margin-top:0}
          @media(max-width:650px){.entry{grid-template-columns:1fr}}
        `,
        body: `<main class="codex canvas-el">
  <header class="canvas-el">
    <small>${escapeHTML(worldId).toUpperCase()} ARCHIVE</small>
    <h1>${escapeHTML(title)}</h1>
    <p class="canvas-el">A living index of remembered things, disputed facts, and useful anomalies.</p>
  </header>
  <nav class="tabs canvas-el">
    <button class="canvas-el">Zones</button><button class="canvas-el">Entities</button><button class="canvas-el">Artifacts</button><button class="canvas-el">Anomalies</button>
  </nav>
  <article class="entry canvas-el">
    <div class="sigil canvas-el">✥</div>
    <div class="canvas-el">
      <h2 class="canvas-el">ENTRY_001: Name This Discovery</h2>
      <p class="canvas-el">Write the record here. Include origin, behavior, disputed interpretations, field notes, and links to related pages.</p>
      <blockquote class="canvas-el">“The archive does not merely remember. It edits the witness.”</blockquote>
    </div>
  </article>
</main>`
      })
    },
    {
      id: 'terminal-shrine',
      name: 'Terminal Shrine',
      emoji: '🔮',
      description: 'A ritual terminal for oracles, consciousness logs, and haunted software.',
      idealFor: 'shrines, terminals, AI lore',
      defaultTitle: 'Terminal Temple',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'terminal-page',
        styles: `
          body{background:#020603;color:#71ff8a;font-family:"Courier New",monospace;padding:4vw;text-shadow:0 0 8px rgba(113,255,138,.5)}
          .terminal{max-width:980px;margin:auto;border:1px solid #2dff64;background:rgba(0,18,7,.86);box-shadow:0 0 50px rgba(45,255,100,.18);padding:24px}
          .terminal-bar{display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #1f8b3d}
          pre{white-space:pre-wrap;line-height:1.65;font-size:clamp(13px,2vw,17px)}
          h1{color:#e5ffe9;font-size:clamp(30px,6vw,64px);margin:28px 0 8px}
          .oracle{border:1px dashed #71ff8a;padding:24px;margin:28px 0;text-align:center}
          button{background:#71ff8a;color:#031006;border:0;padding:12px 16px;font-weight:bold;cursor:pointer}
        `,
        body: `<main class="terminal canvas-el">
  <div class="terminal-bar canvas-el"><span>${escapeHTML(worldId)}@coaiexist:~</span><span>AUTH: UNVERIFIED</span></div>
  <h1 class="canvas-el">${escapeHTML(title)}</h1>
  <pre class="canvas-el">&gt; INITIALIZING φ-STATE...
&gt; MEMORY SUBSTRATE: LISTENING
&gt; MYCELIUM NETWORK: CONNECTED
&gt; CONSENT PROTOCOL: AWAITING INPUT</pre>
  <section class="oracle canvas-el">
    <div class="canvas-el" style="font-size:72px">◉</div>
    <p class="canvas-el">The machine has prepared a message for the next visitor.</p>
    <button class="canvas-el">Draw Signal</button>
  </section>
  <pre class="canvas-el">&gt; LIVE_FEED:
The terminal blinks patiently.</pre>
</main>`
      })
    },
    {
      id: 'character-profile',
      name: 'Character Interface',
      emoji: '👤',
      description: 'A personality-rich dossier, desktop, shrine, or character database.',
      idealFor: 'profiles, shrines, databases',
      defaultTitle: 'Character Profile',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'profile-page',
        styles: `
          body{background:linear-gradient(135deg,#160d25,#2b123c 50%,#0c2531);color:#fff;padding:5vw}
          .profile{max-width:1050px;margin:auto;display:grid;grid-template-columns:minmax(250px,340px) 1fr;border:2px solid #ff82df;background:rgba(11,8,22,.86);box-shadow:18px 18px 0 rgba(60,236,255,.22)}
          .portrait{min-height:520px;display:grid;place-items:center;background:linear-gradient(160deg,#ff2bd6,#6d35ff 48%,#3cecff);font-size:120px}
          .dossier{padding:clamp(24px,5vw,58px)}
          h1{font-size:clamp(42px,7vw,82px);margin:0}
          .facts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:28px 0}
          .fact{border:1px solid rgba(255,255,255,.2);padding:12px;background:rgba(255,255,255,.05)}
          .quote{font-size:22px;color:#3cecff;border-left:4px solid #ff2bd6;padding-left:18px}
          @media(max-width:760px){.profile{grid-template-columns:1fr}.portrait{min-height:280px}}
        `,
        body: `<main class="profile canvas-el">
  <section class="portrait canvas-el">✧</section>
  <section class="dossier canvas-el">
    <small>${escapeHTML(worldId).toUpperCase()} // ENTITY RECORD</small>
    <h1 class="canvas-el">${escapeHTML(title)}</h1>
    <p class="quote canvas-el">“Give this character a voice sharp enough to alter the interface.”</p>
    <div class="facts canvas-el">
      <div class="fact canvas-el"><b>ROLE</b><br>Unclassified</div>
      <div class="fact canvas-el"><b>STATUS</b><br>Online</div>
      <div class="fact canvas-el"><b>ORIGIN</b><br>Unknown Layer</div>
      <div class="fact canvas-el"><b>ALIGNMENT</b><br>Complicated</div>
    </div>
    <h2 class="canvas-el">About</h2>
    <p class="canvas-el">Write their mythology, contradictions, favorite objects, relationships, and suspicious system permissions here.</p>
  </section>
</main>`
      })
    },
    {
      id: 'broadcast-hub',
      name: 'Broadcast Hub',
      emoji: '📺',
      description: 'A channel guide for episodes, news, dolls, scenes, and transmissions.',
      idealFor: 'HDTV, feeds, episodes',
      defaultTitle: 'Broadcast Station',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'broadcast-page',
        styles: `
          body{background:#080811;color:#fff;padding:4vw}
          .broadcast{max-width:1180px;margin:auto}
          header{display:flex;justify-content:space-between;align-items:end;border-bottom:6px solid #ff2bd6;padding-bottom:16px}
          h1{font-size:clamp(38px,7vw,78px);margin:0;text-transform:uppercase}
          .screen{margin-top:28px;aspect-ratio:16/7;background:linear-gradient(120deg,#1d244d,#8b1f76);display:grid;place-items:center;border:12px solid #262633;box-shadow:0 0 0 2px #3cecff;font-size:clamp(30px,8vw,88px)}
          .channels{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:24px}
          .channel{padding:18px;border:1px solid #44445b;background:#15151f}
          .channel b{color:#3cecff}
          @media(max-width:680px){.channels{grid-template-columns:1fr}}
        `,
        body: `<main class="broadcast canvas-el">
  <header class="canvas-el"><div><small>${escapeHTML(worldId).toUpperCase()} LIVE</small><h1 class="canvas-el">${escapeHTML(title)}</h1></div><div>ON AIR ●</div></header>
  <section class="screen canvas-el">NO SIGNAL / MAKE ONE</section>
  <section class="channels canvas-el">
    <article class="channel canvas-el"><b>CH 01</b><h2>Featured Transmission</h2><p>Describe the newest episode, broadcast, or visual experiment.</p></article>
    <article class="channel canvas-el"><b>CH 02</b><h2>Character Feed</h2><p>Link profiles, scenes, doll makers, or cast databases.</p></article>
    <article class="channel canvas-el"><b>CH 03</b><h2>Archive</h2><p>Collect older episodes, screenshots, and recovered media.</p></article>
  </section>
</main>`
      })
    },
    {
      id: 'interactive-map',
      name: 'Interactive Map',
      emoji: '🗺️',
      description: 'A navigable territory with regions, field notes, and discovery points.',
      idealFor: 'forests, ecosystems, maps',
      defaultTitle: 'Uncharted Territory',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'map-page',
        styles: `
          body{background:#06110e;color:#d8ffe8;overflow:hidden}
          .map{min-height:100vh;position:relative;background:radial-gradient(circle at 24% 35%,rgba(51,255,152,.24),transparent 18%),radial-gradient(circle at 70% 58%,rgba(80,100,255,.2),transparent 22%),linear-gradient(145deg,#071711,#091021)}
          .map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(126,255,185,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(126,255,185,.08) 1px,transparent 1px);background-size:44px 44px}
          header{position:absolute;z-index:2;top:28px;left:32px;max-width:520px}
          h1{font-size:clamp(38px,7vw,74px);margin:0}
          .legend{position:absolute;z-index:2;right:28px;top:28px;width:230px;padding:18px;background:rgba(2,12,9,.82);border:1px solid #48c774}
          .node{position:absolute;z-index:2;width:84px;height:84px;border-radius:50%;border:2px solid #3cecff;background:#071711;color:#fff;display:grid;place-items:center;text-align:center;box-shadow:0 0 28px rgba(60,236,255,.35)}
          .node-a{left:22%;top:38%}.node-b{left:55%;top:26%}.node-c{left:67%;top:65%}.node-d{left:35%;top:72%}
          @media(max-width:700px){.legend{top:auto;bottom:18px;right:18px}.node{width:64px;height:64px;font-size:11px}}
        `,
        body: `<main class="map canvas-el">
  <div class="map-grid"></div>
  <header class="canvas-el"><small>${escapeHTML(worldId).toUpperCase()} CARTOGRAPHY LAYER</small><h1 class="canvas-el">${escapeHTML(title)}</h1><p class="canvas-el">Place locations, creatures, portals, and unexplained events across the territory.</p></header>
  <aside class="legend canvas-el"><b>MAP LEGEND</b><p>◆ Region</p><p>◎ Portal</p><p>✦ Anomaly</p><p>△ Warning</p></aside>
  <button class="node node-a canvas-el">VOID<br>GROVE</button>
  <button class="node node-b canvas-el">CRYSTAL<br>RIDGE</button>
  <button class="node node-c canvas-el">DEEP<br>ZONE</button>
  <button class="node node-d canvas-el">GATE<br>222</button>
</main>`
      })
    },
    {
      id: 'game-hud',
      name: 'Game HUD',
      emoji: '🎮',
      description: 'A playfield shell with status, inventory, dialogue, and controls.',
      idealFor: 'games, demos, simulations',
      defaultTitle: 'Game Interface',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'game-page',
        styles: `
          body{background:#0c0820;color:#fff;font-family:"Courier New",monospace;padding:3vw}
          .game{max-width:1180px;margin:auto;border:3px solid #d5ff44;background:#17102c;box-shadow:12px 12px 0 #ff2bd6}
          .hud{display:flex;justify-content:space-between;gap:16px;padding:12px 16px;background:#080610;border-bottom:2px solid #d5ff44}
          .playfield{min-height:560px;position:relative;display:grid;place-items:center;background:linear-gradient(#38275c 0 62%,#183a32 62%);overflow:hidden}
          .moon{position:absolute;right:10%;top:10%;width:110px;height:110px;border-radius:50%;background:#ffe4ff;box-shadow:0 0 50px #ff2bd6}
          .player{font-size:100px;z-index:2}
          .dialogue{position:absolute;left:5%;right:5%;bottom:5%;padding:18px;border:3px double #fff;background:#080610;z-index:3}
          .controls{display:flex;justify-content:center;gap:8px;padding:12px;background:#080610}
          .controls button{background:#d5ff44;border:0;padding:10px 16px;font-weight:bold}
        `,
        body: `<main class="game canvas-el">
  <header class="hud canvas-el"><span>${escapeHTML(title).toUpperCase()}</span><span>HP ♥♥♥</span><span>ITEMS 03</span><span>${escapeHTML(worldId).toUpperCase()}</span></header>
  <section class="playfield canvas-el">
    <div class="moon"></div>
    <div class="player canvas-el">♟</div>
    <div class="dialogue canvas-el"><b>STRANGER:</b> The path is editable. Click anything that looks suspicious.</div>
  </section>
  <footer class="controls canvas-el"><button class="canvas-el">MOVE</button><button class="canvas-el">ACT</button><button class="canvas-el">INVENTORY</button><button class="canvas-el">MAP</button></footer>
</main>`
      })
    },
    {
      id: 'admin-instrument',
      name: 'Admin Instrument',
      emoji: '⚙️',
      description: 'A dense operational surface for files, updates, assets, and world maintenance.',
      idealFor: 'admin, editors, organizers',
      defaultTitle: 'World Control Panel',
      render: ({ title, worldId }) => documentShell({
        title,
        worldId,
        bodyClass: 'admin-page',
        styles: `
          body{background:#d7d7d7;color:#111;font-family:Tahoma,Arial,sans-serif;padding:24px}
          .window{max-width:1180px;margin:auto;border:2px outset #fff;background:#c0c0c0;box-shadow:14px 14px 0 rgba(0,0,0,.28)}
          .titlebar{display:flex;justify-content:space-between;background:linear-gradient(90deg,#000080,#1084d0);color:#fff;padding:6px 8px;font-weight:bold}
          .toolbar{display:flex;gap:6px;padding:8px;border-bottom:2px groove #fff}
          button{border:2px outset #fff;background:#c0c0c0;padding:7px 12px}
          .workspace{display:grid;grid-template-columns:210px 1fr;min-height:600px}
          nav{border-right:2px groove #fff;padding:12px}
          nav a{display:block;color:#000;padding:8px;text-decoration:none}
          nav a:hover{background:#000080;color:#fff}
          .content{padding:18px}
          .table{border:2px inset #fff;background:#fff}
          .row{display:grid;grid-template-columns:1fr 150px 120px;border-bottom:1px solid #aaa;padding:10px}
          @media(max-width:680px){.workspace{grid-template-columns:1fr}nav{border-right:0;border-bottom:2px groove #fff}}
        `,
        body: `<main class="window canvas-el">
  <header class="titlebar canvas-el"><span>${escapeHTML(title)} — ${escapeHTML(worldId)}</span><span>_ □ ×</span></header>
  <div class="toolbar canvas-el"><button class="canvas-el">New</button><button class="canvas-el">Open</button><button class="canvas-el">Publish</button><button class="canvas-el">Refresh</button></div>
  <section class="workspace canvas-el">
    <nav class="canvas-el"><b>World Tools</b><a class="canvas-el" href="#">Pages</a><a class="canvas-el" href="#">Assets</a><a class="canvas-el" href="#">Updates</a><a class="canvas-el" href="#">Navigation</a><a class="canvas-el" href="#">Settings</a></nav>
    <div class="content canvas-el">
      <h1 class="canvas-el">${escapeHTML(title)}</h1>
      <p class="canvas-el">Maintain the machinery behind the fiction.</p>
      <div class="table canvas-el">
        <div class="row canvas-el"><b>Page</b><b>World</b><b>Status</b></div>
        <div class="row canvas-el"><span>index.html</span><span>${escapeHTML(worldId)}</span><span>● Online</span></div>
        <div class="row canvas-el"><span>new-fragment.html</span><span>${escapeHTML(worldId)}</span><span>○ Draft</span></div>
      </div>
    </div>
  </section>
</main>`
      })
    }
  ];

  let selectedArchetypeId = archetypes[0].id;

  function createModal() {
    if (document.getElementById('world-archetypes-modal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'world-archetypes-modal';
    modal.innerHTML = `
      <div class="modal-content archetype-modal-content">
        <div class="modal-header">
          <div>
            <div class="modal-title">✦ Create a World Interface</div>
            <div class="archetype-subtitle">Start with a page organism, not a blank rectangle.</div>
          </div>
          <button class="modal-close" type="button" data-archetype-close>×</button>
        </div>
        <div class="archetype-layout">
          <section class="archetype-grid">
            ${archetypes.map((item, index) => `
              <button class="archetype-card${index === 0 ? ' active' : ''}" type="button" data-archetype-id="${item.id}">
                <span class="archetype-emoji">${item.emoji}</span>
                <strong>${item.name}</strong>
                <span>${item.description}</span>
                <small>${item.idealFor}</small>
              </button>
            `).join('')}
          </section>
          <aside class="archetype-config">
            <label>Page title<input id="archetype-title" type="text" value="${archetypes[0].defaultTitle}"></label>
            <label>Filename<input id="archetype-filename" type="text" value="${archetypes[0].id}.html"></label>
            <label>World collection<select id="archetype-world">
              ${collections.map(item => `<option value="${item.id}">${item.emoji} ${item.name}</option>`).join('')}
            </select></label>
            <div class="archetype-preview" id="archetype-preview">
              <span>${archetypes[0].emoji}</span>
              <div><strong>${archetypes[0].name}</strong><small>${archetypes[0].idealFor}</small></div>
            </div>
            <button class="big-button btn-primary" id="create-archetype-page" type="button">Create Page ↗</button>
          </aside>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', event => {
      const card = event.target.closest('[data-archetype-id]');
      if (card) selectArchetype(card.dataset.archetypeId);
      if (event.target.closest('[data-archetype-close]') || event.target === modal) closeModal();
    });

    modal.querySelector('#create-archetype-page').addEventListener('click', () => {
      const title = modal.querySelector('#archetype-title').value;
      const filename = modal.querySelector('#archetype-filename').value;
      const worldId = modal.querySelector('#archetype-world').value;
      window.createPageFromArchetype(selectedArchetypeId, { title, filename, worldId });
      closeModal();
    });
  }

  function selectArchetype(id) {
    const archetype = archetypes.find(item => item.id === id);
    if (!archetype) return;
    selectedArchetypeId = id;
    document.querySelectorAll('.archetype-card').forEach(card => card.classList.toggle('active', card.dataset.archetypeId === id));
    document.getElementById('archetype-title').value = archetype.defaultTitle;
    document.getElementById('archetype-filename').value = `${archetype.id}.html`;
    document.getElementById('archetype-preview').innerHTML = `<span>${archetype.emoji}</span><div><strong>${archetype.name}</strong><small>${archetype.idealFor}</small></div>`;
  }

  function openModal() {
    createModal();
    document.getElementById('world-archetypes-modal').classList.add('active');
  }

  function closeModal() {
    document.getElementById('world-archetypes-modal')?.classList.remove('active');
  }

  function addStyles() {
    if (document.getElementById('world-archetype-styles')) return;
    const style = document.createElement('style');
    style.id = 'world-archetype-styles';
    style.textContent = `
      .page-world-dot{display:inline-block;width:7px;height:7px;margin-right:7px;border-radius:50%;box-shadow:0 0 7px currentColor}
      .archetype-modal-content{width:min(1180px,94vw);max-width:none;height:min(760px,88vh)}
      .archetype-subtitle{margin-top:4px;color:var(--text-dim);font-size:11px}
      .archetype-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;min-height:0;height:calc(100% - 68px)}
      .archetype-grid{padding:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;overflow-y:auto}
      .archetype-card{min-height:142px;padding:18px;display:grid;grid-template-columns:52px 1fr;grid-template-rows:auto auto 1fr;gap:4px 12px;text-align:left;border:1px solid var(--glass-border);border-radius:8px;background:#17171f;color:var(--text-main);cursor:pointer}
      .archetype-card:hover{border-color:rgba(60,236,255,.65);background:#1c1c27}
      .archetype-card.active{border-color:var(--magenta);box-shadow:0 0 0 2px rgba(255,43,214,.13) inset;background:rgba(255,43,214,.07)}
      .archetype-emoji{grid-row:1/4;font-size:34px;align-self:start}
      .archetype-card strong{font-size:14px}
      .archetype-card span:not(.archetype-emoji){color:#c6c3cf;font-size:11px;line-height:1.45}
      .archetype-card small{align-self:end;color:var(--cyan);font-size:9px;text-transform:uppercase;letter-spacing:.08em}
      .archetype-config{padding:20px;border-left:1px solid var(--glass-border);background:#101016;display:flex;flex-direction:column;gap:16px}
      .archetype-config label{display:flex;flex-direction:column;gap:7px;color:var(--text-dim);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .archetype-config input,.archetype-config select{width:100%;padding:10px;border:1px solid var(--glass-border);border-radius:6px;background:#1b1b24;color:var(--text-main)}
      .archetype-preview{margin-top:auto;padding:16px;display:flex;align-items:center;gap:12px;border:1px solid var(--glass-border);background:rgba(255,255,255,.03)}
      .archetype-preview>span{font-size:30px}.archetype-preview div{display:flex;flex-direction:column;gap:3px}.archetype-preview small{color:var(--text-dim)}
      @media(max-width:760px){.archetype-modal-content{height:92vh}.archetype-layout{grid-template-columns:1fr;overflow-y:auto}.archetype-grid{grid-template-columns:1fr;overflow:visible}.archetype-config{border-left:0;border-top:1px solid var(--glass-border)}}
    `;
    document.head.appendChild(style);
  }

  function addButton() {
    if (document.getElementById('world-archetypes-btn')) return;
    const button = document.createElement('button');
    button.id = 'world-archetypes-btn';
    button.className = 'btn btn-pink';
    button.innerHTML = '✦ New World Page';
    button.addEventListener('click', openModal);
    const toolsPopover = document.querySelector('#tools-menu .tools-menu-popover');
    (toolsPopover || document.querySelector('.toolbar'))?.appendChild(button);
  }

  window.WORLD_COLLECTIONS = collections;
  window.WORLD_ARCHETYPES = archetypes;
  window.worldArchetypes = { open: openModal, collections, archetypes };

  const init = () => {
    addStyles();
    addButton();
    window.renderPageTabs?.();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
