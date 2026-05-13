const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');
code = code.replace(/setTimeout\(\(\) => setPreviewDialogue\(null\), \d+\);/g, '');
code = code.replace(/const \[previewDialogue, setPreviewDialogue\] = useState<string \| null>\(null\);/g, `const [previewDialogueText, _setPreviewDialogue] = useState<string | null>(null);
  const previewDialogueRef = useRef<number | NodeJS.Timeout | null>(null);
  const setPreviewDialogue = (text: string | null) => {
    _setPreviewDialogue(text);
    if (previewDialogueRef.current) clearTimeout(previewDialogueRef.current);
    if (text) {
      const len = text.length;
      const speed = project?.globalSettings?.typewriterSpeed ?? 15;
      const readTime = Math.max(3000, (len * speed) + 2500);
      previewDialogueRef.current = setTimeout(() => {
        _setPreviewDialogue(null);
      }, readTime);
    }
  };
  const previewDialogue = previewDialogueText;`);
fs.writeFileSync('App.tsx', code);
