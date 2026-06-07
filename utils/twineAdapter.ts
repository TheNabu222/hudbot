export const exportToTwee = (tree: any): string => {
  let output = `:: StoryTitle\n${tree.name}\n\n:: StoryData\n{\n  "ifid": "${tree.id}",\n  "format": "Harlowe",\n  "format-version": "3.3.0",\n  "start": "${tree.startNodeId}"\n}\n\n`;

  if (tree.nodes) {
    tree.nodes.forEach((node: any) => {
      let nodeText = "";
      // Twee 3 Passage Header
      output += `:: ${node.id} {"position":"0,0","size":"100,100"}\n`;
      if (node.speaker) {
        output += `Speaker: ${node.speaker}\n\n`;
      }
      
      output += `${node.text}\n\n`;
      
      if (node.choices) {
        node.choices.forEach((choice: any) => {
          output += `[[${choice.text}|${choice.nextNodeId}]]\n`;
        });
      }
      output += `\n`;
    });
  }

  return output;
};

export const importFromTwee = (tweeContent: string): any => {
  // Simple regex-based twee 3 parser
  const passages = tweeContent.split(/^::\s+/gm).slice(1); // ignore anything before first ::
  
  let treeName = "Imported Twine Story";
  let ifid = "twine-" + Date.now();
  let startNodeId = null;
  const nodes: any[] = [];

  passages.forEach((passageText) => {
    const lines = passageText.split('\n');
    const header = lines[0].trim();
    // Parse passage name e.g., "PassageName [tags] {"coords":"0,0"}"
    const match = header.match(/^([^\[\{]+)/);
    const title = match ? match[1].trim() : "Unknown";

    const contentLines = lines.slice(1);
    const content = contentLines.join('\n');

    if (title === "StoryTitle") {
      treeName = content.trim();
    } else if (title === "StoryData") {
      try {
        const data = JSON.parse(content);
        if (data.ifid) ifid = data.ifid;
        if (data.start) startNodeId = data.start;
      } catch (e) {
        console.warn("Could not parse StoryData", e);
      }
    } else if (!title.startsWith("Story")) {
      // Normal passage
      let text = content;
      let speaker = "";
      const speakerMatch = content.match(/^Speaker:\s*(.*)\n/);
      if (speakerMatch) {
         speaker = speakerMatch[1].trim();
         text = text.replace(/^Speaker:\s*(.*)\n/, '');
      }

      const choices: any[] = [];
      // Parse [[Text|Link]] or [[Link]]
      const linkRegex = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(text)) !== null) {
        const choiceText = linkMatch[2] ? linkMatch[1].trim() : linkMatch[1].trim();
        const nextNodeId = linkMatch[2] ? linkMatch[2].trim() : linkMatch[1].trim();
        choices.push({ id: crypto.randomUUID(), text: choiceText, nextNodeId });
      }

      // Remove the links from the text body to keep it clean (optional, but standard for visual novels)
      text = text.replace(/\[\[.*?\]\]/g, '').trim();

      nodes.push({
        id: title,
        speaker,
        text,
        choices
      });
    }
  });

  if (!startNodeId && nodes.length > 0) {
    startNodeId = nodes[0].id;
  }

  return {
    id: ifid,
    name: treeName,
    startNodeId,
    nodes
  };
};
