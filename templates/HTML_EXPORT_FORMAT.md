# HTML Export Formats Template

When writing custom export formats or embedding the game's data within static HTML templates for external consumption, use the following structure. 

This enables headless execution and portability to environments like itch.io or raw web hosting without requiring the full React framework.

## Playable Game HTML Export Template

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Game Export Template</title>
  <style>
    /* Add basic styling to mimic engine appearance */
    body { background: #111; color: #fff; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; margin: 0; }
    #game-container { position: relative; width: 800px; height: 600px; background: #222; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  
  <!-- Embed game data directly into the HTML to avoid CORS issues -->
  <script type="application/json" id="game-data">
    {
       "scenes": [],
       "assets": [],
       "globalSettings": {},
       "dialogueTrees": []
    }
  </script>

  <!-- Lightweight Vanilla JS Runtime (Example Stub) -->
  <script>
    document.addEventListener("DOMContentLoaded", () => {
       const rawData = document.getElementById("game-data").textContent;
       const project = JSON.parse(rawData);
       const container = document.getElementById("game-container");
       container.innerHTML = "<h1>" + (project.name || "My Game") + "</h1><p>Running Vanilla JS Headless Mode...</p>";
       // initializeGame(project, container);
    });
  </script>
</body>
</html>
\`\`\`
