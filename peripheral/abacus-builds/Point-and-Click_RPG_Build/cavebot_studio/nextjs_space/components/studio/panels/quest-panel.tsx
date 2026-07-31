'use client';
import React, { useCallback } from 'react';
import { useStudioStore } from '@/lib/store';
import { generateId } from '@/lib/id-utils';
import type { Quest, QuestObjective, QuestReward } from '@/lib/types';
import { Plus, Trash2, Target, CheckCircle, Gift } from 'lucide-react';
import { toast } from 'sonner';

export default function QuestPanel() {
  const { project, selectedQuestId, setSelectedQuest, addQuest, updateQuest, deleteQuest } = useStudioStore();
  const quests = project?.quests ?? [];
  const selected = quests?.find?.((q: Quest) => q?.id === selectedQuestId) ?? null;

  const handleAdd = useCallback(() => {
    const name = prompt('Quest name:');
    if (name?.trim?.()) {
      addQuest(name.trim());
      toast.success('Quest created');
    }
  }, [addQuest]);

  const addObjective = useCallback(() => {
    if (!selected?.id) return;
    const obj: QuestObjective = {
      id: generateId('qobj'),
      type: 'custom',
      targetId: '',
      description: 'New objective...',
    };
    updateQuest(selected.id, { objectives: [...(selected?.objectives ?? []), obj] });
  }, [selected, updateQuest]);

  const updateObjective = useCallback((objId: string, patch: Partial<QuestObjective>) => {
    if (!selected?.id) return;
    updateQuest(selected.id, {
      objectives: (selected?.objectives ?? [])?.map?.((o: QuestObjective) =>
        o?.id === objId ? { ...(o ?? {}), ...(patch ?? {}) } : o
      ) ?? [],
    });
  }, [selected, updateQuest]);

  const deleteObjective = useCallback((objId: string) => {
    if (!selected?.id) return;
    updateQuest(selected.id, {
      objectives: (selected?.objectives ?? [])?.filter?.((o: QuestObjective) => o?.id !== objId) ?? [],
    });
  }, [selected, updateQuest]);

  const addReward = useCallback(() => {
    if (!selected?.id) return;
    const reward: QuestReward = { type: 'set_flag', targetId: '' };
    updateQuest(selected.id, { rewards: [...(selected?.rewards ?? []), reward] });
  }, [selected, updateQuest]);

  return (
    <div className="h-full flex">
      {/* List */}
      <div className="w-64 bg-[#111128] border-r border-[#1f1f3f] overflow-y-auto shrink-0">
        <div className="p-2 border-b border-[#1f1f3f] flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase">Quests ({quests?.length ?? 0})</h3>
          <button onClick={handleAdd} className="p-1 hover:bg-[#252550] rounded"><Plus size={12} className="text-gray-400" /></button>
        </div>
        {quests?.map?.((q: Quest) => (
          <button
            key={q?.id}
            onClick={() => setSelectedQuest(q?.id ?? null)}
            className={`w-full px-3 py-2 text-left text-xs border-b border-[#1a1a2e] flex items-center gap-2 ${
              q?.id === selectedQuestId ? 'bg-orange-500/15 text-orange-300' : 'hover:bg-[#1a1a3a] text-gray-400'
            }`}
          >
            <Target size={12} />
            <div className="truncate">
              <div className="truncate">{q?.name ?? 'Untitled'}</div>
              <div className="text-[9px] text-gray-600">{q?.objectives?.length ?? 0} objectives</div>
            </div>
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Target size={16} className="text-orange-400" /> {selected?.name ?? 'Quest'}
            </h3>
            <button onClick={() => { deleteQuest(selected?.id ?? ''); setSelectedQuest(null); }} className="p-1.5 hover:bg-red-500/20 rounded text-red-400">
              <Trash2 size={14} />
            </button>
          </div>

          <label className="block">
            <span className="text-[10px] text-gray-500">Name</span>
            <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
              value={selected?.name ?? ''}
              onChange={(e: any) => updateQuest(selected?.id ?? '', { name: e?.target?.value ?? '' })}
            />
          </label>

          <label className="block">
            <span className="text-[10px] text-gray-500">Description</span>
            <textarea className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-2 text-sm text-gray-200 h-20 resize-y"
              value={selected?.description ?? ''}
              onChange={(e: any) => updateQuest(selected?.id ?? '', { description: e?.target?.value ?? '' })}
            />
          </label>

          {/* Objectives */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1">
                <CheckCircle size={12} className="text-green-400" /> Objectives
              </h4>
              <button onClick={addObjective} className="flex items-center gap-1 px-2 py-1 bg-[#1a1a3a] hover:bg-[#252550] text-[10px] rounded border border-[#333366]">
                <Plus size={10} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {(selected?.objectives ?? [])?.map?.((obj: QuestObjective) => (
                <div key={obj?.id} className="bg-[#111128] rounded p-3 border border-[#2a2a4a] space-y-2">
                  <div className="flex items-center justify-between">
                    <select className="bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-[10px] text-gray-200"
                      value={obj?.type ?? 'custom'}
                      onChange={(e: any) => updateObjective(obj?.id ?? '', { type: e?.target?.value as any })}
                    >
                      <option value="talk_to">Talk To</option>
                      <option value="collect_item">Collect Item</option>
                      <option value="reach_scene">Reach Scene</option>
                      <option value="skill_check">Skill Check</option>
                      <option value="custom_flag">Custom Flag</option>
                      <option value="custom">Custom</option>
                    </select>
                    <button onClick={() => deleteObjective(obj?.id ?? '')} className="p-0.5 hover:bg-red-500/20 rounded">
                      <Trash2 size={10} className="text-red-400" />
                    </button>
                  </div>
                  <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    placeholder="Description..."
                    value={obj?.description ?? ''}
                    onChange={(e: any) => updateObjective(obj?.id ?? '', { description: e?.target?.value ?? '' })}
                  />
                  <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200 font-mono"
                    placeholder="Target ID..."
                    value={obj?.targetId ?? ''}
                    onChange={(e: any) => updateObjective(obj?.id ?? '', { targetId: e?.target?.value ?? '' })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1">
                <Gift size={12} className="text-yellow-400" /> Rewards
              </h4>
              <button onClick={addReward} className="flex items-center gap-1 px-2 py-1 bg-[#1a1a3a] hover:bg-[#252550] text-[10px] rounded border border-[#333366]">
                <Plus size={10} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {(selected?.rewards ?? [])?.map?.((reward: QuestReward, ri: number) => (
                <div key={ri} className="flex items-center gap-2 text-xs">
                  <select className="bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-gray-200"
                    value={reward?.type ?? 'set_flag'}
                    onChange={(e: any) => {
                      const newRewards = [...(selected?.rewards ?? [])];
                      newRewards[ri] = { ...(newRewards[ri] ?? {}), type: e?.target?.value as any };
                      updateQuest(selected?.id ?? '', { rewards: newRewards });
                    }}
                  >
                    <option value="give_item">Give Item</option>
                    <option value="modify_status">Modify Status</option>
                    <option value="set_flag">Set Flag</option>
                  </select>
                  <input className="flex-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-gray-200 font-mono"
                    placeholder="Target ID"
                    value={reward?.targetId ?? ''}
                    onChange={(e: any) => {
                      const newRewards = [...(selected?.rewards ?? [])];
                      newRewards[ri] = { ...(newRewards[ri] ?? {}), targetId: e?.target?.value ?? '' };
                      updateQuest(selected?.id ?? '', { rewards: newRewards });
                    }}
                  />
                  <button onClick={() => {
                    updateQuest(selected?.id ?? '', { rewards: (selected?.rewards ?? [])?.filter?.((_: any, i: number) => i !== ri) ?? [] });
                  }} className="p-0.5 hover:bg-red-500/20 rounded">
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a quest to edit</p>
          </div>
        </div>
      )}
    </div>
  );
}
