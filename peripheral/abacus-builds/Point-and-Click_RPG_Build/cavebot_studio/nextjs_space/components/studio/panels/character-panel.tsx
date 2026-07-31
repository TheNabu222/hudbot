'use client';
import React, { useCallback } from 'react';
import { useStudioStore } from '@/lib/store';
import type { Character } from '@/lib/types';
import { Plus, Trash2, Users, User, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function CharacterPanel() {
  const { project, selectedCharacterId, setSelectedCharacter, addCharacter, updateCharacter, deleteCharacter } = useStudioStore();
  const chars = project?.characters ?? [];
  const selected = chars?.find?.((c: Character) => c?.id === selectedCharacterId) ?? null;

  const handleAdd = useCallback(() => {
    const name = prompt('Character name:');
    if (name?.trim?.()) {
      addCharacter(name.trim());
      toast.success('Character added');
    }
  }, [addCharacter]);

  return (
    <div className="h-full flex">
      {/* List */}
      <div className="w-64 bg-[#111128] border-r border-[#1f1f3f] overflow-y-auto shrink-0">
        <div className="p-2 border-b border-[#1f1f3f] flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase">Characters ({chars?.length ?? 0})</h3>
          <button onClick={handleAdd} className="p-1 hover:bg-[#252550] rounded"><Plus size={12} className="text-gray-400" /></button>
        </div>
        {chars?.map?.((c: Character) => (
          <button
            key={c?.id}
            onClick={() => setSelectedCharacter(c?.id ?? null)}
            className={`w-full px-3 py-2 text-left text-xs border-b border-[#1a1a2e] flex items-center gap-2 ${
              c?.id === selectedCharacterId ? 'bg-emerald-500/15 text-emerald-300' : 'hover:bg-[#1a1a3a] text-gray-400'
            }`}
          >
            <User size={12} />
            <div className="truncate">
              <div className="truncate">{c?.name ?? 'Unknown'}</div>
              <div className="text-[9px] text-gray-600">{c?.slug ?? ''}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <User size={16} className="text-emerald-400" /> {selected?.name ?? 'Character'}
            </h3>
            <button onClick={() => { deleteCharacter(selected?.id ?? ''); setSelectedCharacter(null); }} className="p-1.5 hover:bg-red-500/20 rounded text-red-400">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] text-gray-500">Name</span>
              <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                value={selected?.name ?? ''}
                onChange={(e: any) => updateCharacter(selected?.id ?? '', { name: e?.target?.value ?? '' })}
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-gray-500">Slug</span>
              <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200 font-mono"
                value={selected?.slug ?? ''}
                onChange={(e: any) => updateCharacter(selected?.id ?? '', { slug: e?.target?.value ?? '' })}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] text-gray-500">Description</span>
            <textarea className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-2 text-sm text-gray-200 h-20 resize-y"
              value={selected?.description ?? ''}
              onChange={(e: any) => updateCharacter(selected?.id ?? '', { description: e?.target?.value ?? '' })}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] text-gray-500">Default Affinity (0-100)</span>
              <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                value={selected?.defaultAffinity ?? 50}
                onChange={(e: any) => updateCharacter(selected?.id ?? '', { defaultAffinity: Number(e?.target?.value ?? 50) })}
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-gray-500">Faction</span>
              <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                value={selected?.factionId ?? ''}
                onChange={(e: any) => updateCharacter(selected?.id ?? '', { factionId: e?.target?.value || null })}
              >
                <option value="">None</option>
                {(project?.factions ?? [])?.map?.((f: any) => (
                  <option key={f?.id} value={f?.id ?? ''}>{f?.name ?? '?'}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Relationship thresholds */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
              <Heart size={12} className="text-pink-400" /> Relationship Thresholds
            </h4>
            <div className="space-y-1">
              {(selected?.thresholds ?? [])?.map?.((th: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <input type="number" className="w-16 bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-gray-300"
                    value={th?.value ?? 0}
                    onChange={(e: any) => {
                      const newTh = [...(selected?.thresholds ?? [])];
                      newTh[i] = { ...(newTh[i] ?? {}), value: Number(e?.target?.value ?? 0) };
                      updateCharacter(selected?.id ?? '', { thresholds: newTh });
                    }}
                  />
                  <input className="flex-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-gray-300"
                    value={th?.label ?? ''}
                    onChange={(e: any) => {
                      const newTh = [...(selected?.thresholds ?? [])];
                      newTh[i] = { ...(newTh[i] ?? {}), label: e?.target?.value ?? '' };
                      updateCharacter(selected?.id ?? '', { thresholds: newTh });
                    }}
                  />
                  <input type="color" className="w-8 h-6 rounded cursor-pointer bg-transparent"
                    value={th?.color ?? '#888888'}
                    onChange={(e: any) => {
                      const newTh = [...(selected?.thresholds ?? [])];
                      newTh[i] = { ...(newTh[i] ?? {}), color: e?.target?.value ?? '#888888' };
                      updateCharacter(selected?.id ?? '', { thresholds: newTh });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a character to edit</p>
          </div>
        </div>
      )}
    </div>
  );
}
