import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Asset } from '../types';

interface ImageEditorModalProps {
  asset: Asset;
  onSave: (newSrc: string, isNew: boolean) => void;
  onClose: () => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ asset, onSave, onClose }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [sepia, setSepia] = useState(0);

  const [chromaKeyColor, setChromaKeyColor] = useState<string>('');
  const [chromaTolerance, setChromaTolerance] = useState<number>(30);

  const [isPickingColor, setIsPickingColor] = useState(false);

  const getFilterString = () => {
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%)`;
  };

  const applyChromaKey = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!chromaKeyColor) return;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : {r:0,g:0,b:0};
    };
    
    const target = hexToRgb(chromaKeyColor);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const distance = Math.sqrt(
        Math.pow(r - target.r, 2) + Math.pow(g - target.g, 2) + Math.pow(b - target.b, 2)
      );
      
      if (distance <= chromaTolerance) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const handleSave = async () => {
    if (!imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cropX = 0, cropY = 0, cropWidth = image.naturalWidth, cropHeight = image.naturalHeight;
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      cropX = completedCrop.x * scaleX;
      cropY = completedCrop.y * scaleY;
      cropWidth = completedCrop.width * scaleX;
      cropHeight = completedCrop.height * scaleY;
    }

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.filter = getFilterString();

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    
    applyChromaKey(ctx, cropWidth, cropHeight);

    try {
      const base64Image = canvas.toDataURL('image/png');
      onSave(base64Image, false);
    } catch (e) {
      alert("Error saving image. If it's an external URL, it might have CORS restrictions that prevent editing. Try re-uploading the image directly.");
      console.error(e);
    }
  };

  const handleSaveAsNew = async () => {
    if (!imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cropX = 0, cropY = 0, cropWidth = image.naturalWidth, cropHeight = image.naturalHeight;
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      cropX = completedCrop.x * scaleX;
      cropY = completedCrop.y * scaleY;
      cropWidth = completedCrop.width * scaleX;
      cropHeight = completedCrop.height * scaleY;
    }

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.filter = getFilterString();

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    
    applyChromaKey(ctx, cropWidth, cropHeight);

    try {
      const base64Image = canvas.toDataURL('image/png');
      onSave(base64Image, true);
    } catch (e) {
      alert("Error saving image. If it's an external URL, it might have CORS restrictions that prevent editing. Try re-uploading the image directly.");
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-5xl w-full h-[90vh] flex shadow-2xl overflow-hidden">
        
        {/* Editor Area */}
        <div className="flex-1 bg-neutral-950 flex flex-col relative overflow-hidden">
          <div className="flex-1 p-4 flex items-center justify-center overflow-auto custom-scrollbar">
            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}>
              <img 
                ref={imgRef}
                src={asset.src} 
                alt="Edit" 
                crossOrigin="anonymous"
                style={{ filter: getFilterString(), maxHeight: '70vh' }}
                className="max-w-full select-none"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-80 bg-neutral-900 border-l border-neutral-700 p-6 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Edit Image</h2>
            <p className="text-[10px] text-neutral-400">Click and drag on the image to crop it. You can extract individual sprites from sheets this way!</p>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-neutral-400">Brightness</label>
                <span className="text-xs text-neutral-500">{brightness}%</span>
              </div>
              <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-neutral-400">Contrast</label>
                <span className="text-xs text-neutral-500">{contrast}%</span>
              </div>
              <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-neutral-400">Saturation</label>
                <span className="text-xs text-neutral-500">{saturate}%</span>
              </div>
              <input type="range" min="0" max="200" value={saturate} onChange={e => setSaturate(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-neutral-400">Sepia</label>
                <span className="text-xs text-neutral-500">{sepia}%</span>
              </div>
              <input type="range" min="0" max="100" value={sepia} onChange={e => setSepia(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-300 mb-2">Remove Background Color</h3>
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="color" 
                  value={chromaKeyColor || '#000000'} 
                  onChange={e => setChromaKeyColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-neutral-800 border-none"
                />
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={chromaKeyColor} 
                    onChange={e => setChromaKeyColor(e.target.value)}
                    placeholder="#HexColor"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white"
                  />
                </div>
                {chromaKeyColor && (
                  <button onClick={() => setChromaKeyColor('')} className="p-1 rounded bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400">
                    <span className="text-xs">Clear</span>
                  </button>
                )}
              </div>
              
              {chromaKeyColor && (
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-neutral-400">Tolerance (Color Match)</label>
                    <span className="text-xs text-neutral-500">{chromaTolerance}</span>
                  </div>
                  <input type="range" min="0" max="255" value={chromaTolerance} onChange={e => setChromaTolerance(Number(e.target.value))} className="w-full accent-emerald-500" />
                  <p className="text-[10px] text-amber-500 mt-1">Note: Transparency isn't previewed here, but will apply when you save!</p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-800">
              <button 
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturate(100);
                  setSepia(0);
                  setCrop(undefined);
                  setChromaKeyColor('');
                }} 
                className="w-full text-xs text-neutral-400 hover:text-white"
              >
                Reset Adjustments
              </button>
            </div>
          </div>

          <div className="pt-6 mt-auto border-t border-neutral-800 flex flex-col gap-2">
            <button onClick={handleSaveAsNew} className="w-full py-2 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors text-sm font-bold border border-indigo-500/50">Save as New Asset</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-colors text-sm">Overwrite</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
