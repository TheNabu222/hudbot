import React, { useState } from 'react';
import { generateImage } from '../services/gemini';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface AISpriteModalProps {
  onClose: () => void;
  onSave: (base64Image: string, name: string) => void;
}

export const AISpriteModal: React.FC<AISpriteModalProps> = ({ onClose, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResultImage(null);

    try {
      const base64 = await generateImage(`game asset, isolated on a solid dark green background, high quality, 2d game sprite, ${prompt}`, '1:1', false);
      setResultImage(base64);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (resultImage) {
      onSave(resultImage, prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') + "_AI");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-xl w-full flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <Sparkles size={18} /> AI Sprite Generator
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-2 block">Prompt</label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. A rusty iron sword, fantasy RPG style"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none text-white resize-none"
              rows={3}
            />
            <p className="text-[10px] text-neutral-500 mt-2">
              Note: The AI will try to generate it on a solid dark green background. You can use the Image Editor's "Remove Background Color" tool afterwards to make it transparent!
            </p>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> Generate</>}
          </button>

          {error && <div className="text-red-400 text-xs p-3 bg-red-500/10 rounded border border-red-500/20">{error}</div>}

          {resultImage && (
            <div className="mt-4 flex flex-col gap-4">
              <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">Result</label>
              <div className="w-full aspect-square bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                <img src={resultImage} alt="Generated Sprite" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
              </div>
              <button 
                onClick={handleSave}
                className="w-full py-2 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-lg transition-colors"
              >
                Save to Library
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
