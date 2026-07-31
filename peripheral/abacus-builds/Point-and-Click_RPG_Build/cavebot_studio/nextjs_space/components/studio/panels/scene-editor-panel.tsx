'use client';
import React, { useState, useCallback } from 'react';
import { useStudioStore } from '@/lib/store';
import { generateId } from '@/lib/id-utils';
import type { SceneObject, Scene } from '@/lib/types';
import { Plus, Trash2, Eye, EyeOff, Lock, Unlock, ChevronRight, Layers, MousePointer, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function SceneEditorPanel() {
  const {
    project, selectedSceneId, setSelectedScene, selectedObjectId, setSelectedObject,
    updateScene, deleteScene, addObjectToScene, updateObjectInScene, deleteObjectFromScene,
  } = useStudioStore();

  const scenes = project?.scenes ?? [];
  const scene = scenes?.find?.((s: Scene) => s?.id === selectedSceneId) ?? null;

  const [editingObjId, setEditingObjId] = useState<string | null>(null);

  const handleAddObject = useCallback(() => {
    if (!scene?.id) return;
    const name = prompt('Object name:');
    if (!name?.trim?.()) return;
    const obj: SceneObject = {
      id: generateId('obj'),
      name: name.trim(),
      transform: { x: 100, y: 100, w: 100, h: 100, rotation: 0, zIndex: (scene?.objects?.length ?? 0) + 1, opacity: 1 },
      interaction: 'none',
      hidden: false,
      locked: false,
    };
    addObjectToScene(scene.id, obj);
    toast.success('Object added: ' + name.trim());
  }, [scene, addObjectToScene]);

  if (!scene) {
    return (
      <div className="h-full flex">
        {/* Scene list sidebar */}
        <div className="w-64 bg-[#111128] border-r border-[#1f1f3f] overflow-y-auto">
          <div className="p-3 border-b border-[#1f1f3f]">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Scenes</h3>
          </div>
          {scenes?.map?.((s: Scene) => (
            <button
              key={s?.id}
              onClick={() => setSelectedScene(s?.id ?? null)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#1a1a3a] border-b border-[#1a1a2e] flex items-center gap-2"
            >
              <Layers size={12} className="text-indigo-400" />
              <span className="truncate">{s?.name ?? 'Untitled'}</span>
              <span className="text-[10px] text-gray-600 ml-auto">{s?.objects?.length ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a scene to edit</p>
          </div>
        </div>
      </div>
    );
  }

  const objects = scene?.objects ?? [];
  const selectedObj = objects?.find?.((o: SceneObject) => o?.id === selectedObjectId) ?? null;

  return (
    <div className="h-full flex">
      {/* Scene list */}
      <div className="w-52 bg-[#111128] border-r border-[#1f1f3f] overflow-y-auto shrink-0">
        <div className="p-2 border-b border-[#1f1f3f]">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase">Scenes</h3>
        </div>
        {scenes?.map?.((s: Scene) => (
          <button
            key={s?.id}
            onClick={() => { setSelectedScene(s?.id ?? null); setSelectedObject(null); }}
            className={`w-full px-2 py-1.5 text-left text-xs border-b border-[#1a1a2e] flex items-center gap-1.5 ${
              s?.id === selectedSceneId ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-[#1a1a3a] text-gray-400'
            }`}
          >
            <ChevronRight size={10} />
            <span className="truncate">{s?.name ?? 'Untitled'}</span>
          </button>
        ))}
      </div>

      {/* Scene canvas / object list */}
      <div className="flex-1 flex flex-col">
        {/* Scene header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f24] border-b border-[#1f1f3f]">
          <div className="flex items-center gap-3">
            <input
              className="bg-transparent text-sm font-bold text-gray-200 border-b border-transparent hover:border-gray-600 focus:border-yellow-500 outline-none px-1"
              value={scene?.name ?? ''}
              onChange={(e: any) => updateScene(scene?.id ?? '', { name: e?.target?.value ?? '' })}
            />
            <span className="text-[10px] text-gray-600 font-mono">{scene?.size?.w ?? 800}×{scene?.size?.h ?? 600}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAddObject} className="flex items-center gap-1 px-2 py-1 bg-[#1a1a3a] hover:bg-[#252550] text-xs rounded border border-[#333366]">
              <Plus size={12} /> Object
            </button>
            <button onClick={() => { deleteScene(scene?.id ?? ''); setSelectedScene(null); }} className="p-1 hover:bg-red-500/20 rounded text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Visual canvas area */}
          <div className="flex-1 relative overflow-auto" style={{ backgroundColor: scene?.backgroundColor ?? '#1a1a2e' }}>
            <div className="relative" style={{ width: scene?.size?.w ?? 800, height: scene?.size?.h ?? 600, margin: '20px auto' }}>
              {objects?.map?.((obj: SceneObject) => {
                if (obj?.hidden) return null;
                const t = obj?.transform ?? { x: 0, y: 0, w: 100, h: 100, rotation: 0, zIndex: 0, opacity: 1 };
                const isSelected = obj?.id === selectedObjectId;
                return (
                  <div
                    key={obj?.id}
                    onClick={() => setSelectedObject(obj?.id ?? null)}
                    className={`absolute cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent' : 'hover:ring-1 hover:ring-indigo-400'
                    }`}
                    style={{
                      left: t?.x ?? 0,
                      top: t?.y ?? 0,
                      width: t?.w ?? 100,
                      height: t?.h ?? 100,
                      zIndex: t?.zIndex ?? 0,
                      opacity: t?.opacity ?? 1,
                      transform: `rotate(${t?.rotation ?? 0}deg)${t?.flipX ? ' scaleX(-1)' : ''}`,
                    }}
                  >
                    {obj?.src ? (
                      <img src={obj.src} alt={obj?.name ?? ''} className="w-full h-full object-contain" draggable={false}
                        onError={(e: any) => { if (e?.target) e.target.style.display = 'none'; }} />
                    ) : obj?.isText ? (
                      <div style={{ color: obj?.textColor ?? '#fff', fontSize: obj?.textFontSize ?? 14 }}>{obj?.textContent ?? ''}</div>
                    ) : (
                      <div className="w-full h-full bg-indigo-500/20 border border-dashed border-indigo-500/40 rounded flex items-center justify-center">
                        <span className="text-[9px] text-indigo-300 text-center px-1 truncate">{obj?.name ?? '?'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Object list + properties */}
          <div className="w-72 bg-[#111128] border-l border-[#1f1f3f] overflow-y-auto shrink-0">
            <div className="p-2 border-b border-[#1f1f3f]">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase">Objects ({objects?.length ?? 0})</h4>
            </div>
            <div className="max-h-[35vh] overflow-y-auto">
              {objects?.map?.((obj: SceneObject) => (
                <div
                  key={obj?.id}
                  onClick={() => setSelectedObject(obj?.id ?? null)}
                  className={`flex items-center justify-between px-2 py-1 text-xs cursor-pointer border-b border-[#1a1a2e] ${
                    obj?.id === selectedObjectId ? 'bg-yellow-500/10 text-yellow-300' : 'hover:bg-[#1a1a3a] text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {obj?.isText ? <span className="text-cyan-400">T</span> : obj?.isHitbox ? <MousePointer size={10} className="text-green-400" /> : <ImageIcon size={10} className="text-purple-400" />}
                    <span className="truncate">{obj?.name ?? '?'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e: any) => { e?.stopPropagation?.(); updateObjectInScene(scene?.id ?? '', obj?.id ?? '', { hidden: !obj?.hidden }); }} className="p-0.5">
                      {obj?.hidden ? <EyeOff size={10} className="text-gray-600" /> : <Eye size={10} className="text-gray-500" />}
                    </button>
                    <button onClick={(e: any) => { e?.stopPropagation?.(); updateObjectInScene(scene?.id ?? '', obj?.id ?? '', { locked: !obj?.locked }); }} className="p-0.5">
                      {obj?.locked ? <Lock size={10} className="text-orange-400" /> : <Unlock size={10} className="text-gray-600" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Properties of selected object */}
            {selectedObj && (
              <div className="border-t border-[#2a2a4a] p-3 space-y-3">
                <h4 className="text-[10px] font-bold text-yellow-400 uppercase">Properties</h4>
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-[10px] text-gray-500">Name</span>
                    <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                      value={selectedObj?.name ?? ''}
                      onChange={(e: any) => updateObjectInScene(scene?.id ?? '', selectedObj?.id ?? '', { name: e?.target?.value ?? '' })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-gray-500">Image URL</span>
                    <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                      value={selectedObj?.src ?? ''}
                      onChange={(e: any) => updateObjectInScene(scene?.id ?? '', selectedObj?.id ?? '', { src: e?.target?.value ?? '' })}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['x', 'y', 'w', 'h'].map((k: string) => (
                      <label key={k} className="block">
                        <span className="text-[10px] text-gray-500">{k?.toUpperCase?.()}</span>
                        <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                          value={(selectedObj?.transform as any)?.[k] ?? 0}
                          onChange={(e: any) => updateObjectInScene(scene?.id ?? '', selectedObj?.id ?? '', {
                            transform: { ...(selectedObj?.transform ?? { x: 0, y: 0, w: 100, h: 100, rotation: 0, zIndex: 0, opacity: 1 }), [k]: Number(e?.target?.value ?? 0) },
                          })}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block">
                    <span className="text-[10px] text-gray-500">Interaction</span>
                    <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                      value={selectedObj?.interaction ?? 'none'}
                      onChange={(e: any) => updateObjectInScene(scene?.id ?? '', selectedObj?.id ?? '', { interaction: e?.target?.value ?? 'none' })}
                    >
                      <option value="none">None</option>
                      <option value="scene_change">Scene Change</option>
                      <option value="dialogue">Dialogue</option>
                      <option value="collect">Collect Item</option>
                      <option value="set_flag">Set Flag</option>
                      <option value="toggle_flag">Toggle Flag</option>
                      <option value="sound">Play Sound</option>
                      <option value="start_quest">Start Quest</option>
                    </select>
                  </label>
                  {(selectedObj?.interaction === 'scene_change' || selectedObj?.interaction === 'dialogue') && (
                    <label className="block">
                      <span className="text-[10px] text-gray-500">
                        {selectedObj?.interaction === 'scene_change' ? 'Target Scene' : 'Dialogue Tree'}
                      </span>
                      <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                        value={selectedObj?.interaction === 'dialogue' ? (selectedObj?.dialogueTreeId ?? '') : (selectedObj?.interactionData ?? '')}
                        onChange={(e: any) => {
                          if (selectedObj?.interaction === 'dialogue') {
                            updateObjectInScene(scene?.id ?? '', selectedObj?.id ?? '', { dialogueTreeId: e?.target?.value ?? '' });
                          } else {
                            updateObjectInScene(scene?.id ?? '', selectedObj?.id ?? '', { interactionData: e?.target?.value ?? '' });
                          }
                        }}
                      >
                        <option value="">-- Select --</option>
                        {selectedObj?.interaction === 'scene_change'
                          ? scenes?.map?.((s: Scene) => <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? 'Untitled'}</option>)
                          : (project?.dialogueTrees ?? [])?.map?.((dt: any) => <option key={dt?.id} value={dt?.id ?? ''}>{dt?.name ?? 'Untitled'}</option>)
                        }
                      </select>
                    </label>
                  )}
                  <label className="block">
                    <span className="text-[10px] text-gray-500">Show if Flag</span>
                    <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                      value={selectedObj?.showIfFlag ?? ''}
                      onChange={(e: any) => updateObjectInScene(scene?.id ?? '', selectedObj?.id ?? '', { showIfFlag: e?.target?.value || null })}
                    />
                  </label>
                  <button
                    onClick={() => { deleteObjectFromScene(scene?.id ?? '', selectedObj?.id ?? ''); setSelectedObject(null); }}
                    className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded border border-red-500/20"
                  >
                    <Trash2 size={12} className="inline mr-1" /> Delete Object
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
