'use client';
import React, { useCallback } from 'react';
import { useStudioStore } from '@/lib/store';
import { generateId, slugify } from '@/lib/id-utils';
import type { NeedDefinition, SkillDefinition } from '@/lib/types';
import { Plus, Trash2, Activity, Zap, Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function NeedsPanel() {
  const { project, updateSettings } = useStudioStore();
  const needs: NeedDefinition[] = (project?.settings?.customNeeds as NeedDefinition[]) ?? [];
  const skills: SkillDefinition[] = (project?.settings?.customSkills as SkillDefinition[]) ?? [];

  const addNeed = useCallback(() => {
    const label = prompt('Need name (e.g. Hunger):');
    if (!label?.trim?.()) return;
    const nd: NeedDefinition = {
      id: generateId('need'),
      key: slugify(label.trim()),
      label: label.trim(),
      min: 0, max: 100, default: 100,
      decayPerTick: 1,
      showInHud: true,
    };
    updateSettings({ customNeeds: [...needs, nd] });
    toast.success('Need added');
  }, [needs, updateSettings]);

  const updateNeed = useCallback((id: string, patch: Partial<NeedDefinition>) => {
    updateSettings({
      customNeeds: needs?.map?.((n: NeedDefinition) => n?.id === id ? { ...(n ?? {}), ...(patch ?? {}) } : n) ?? [],
    });
  }, [needs, updateSettings]);

  const deleteNeed = useCallback((id: string) => {
    updateSettings({ customNeeds: needs?.filter?.((n: NeedDefinition) => n?.id !== id) ?? [] });
  }, [needs, updateSettings]);

  const addSkill = useCallback(() => {
    const label = prompt('Skill name (e.g. Cooking):');
    if (!label?.trim?.()) return;
    const sd: SkillDefinition = {
      id: generateId('skill'),
      key: slugify(label.trim()),
      label: label.trim(),
      min: 0, max: 100, default: 0,
      showInHud: false,
    };
    updateSettings({ customSkills: [...skills, sd] });
    toast.success('Skill added');
  }, [skills, updateSettings]);

  const updateSkill = useCallback((id: string, patch: Partial<SkillDefinition>) => {
    updateSettings({
      customSkills: skills?.map?.((s: SkillDefinition) => s?.id === id ? { ...(s ?? {}), ...(patch ?? {}) } : s) ?? [],
    });
  }, [skills, updateSettings]);

  const deleteSkill = useCallback((id: string) => {
    updateSettings({ customSkills: skills?.filter?.((s: SkillDefinition) => s?.id !== id) ?? [] });
  }, [skills, updateSettings]);

  return (
    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-8">
      {/* Needs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Activity size={16} className="text-green-400" /> Need Meters ({needs?.length ?? 0})
          </h2>
          <button onClick={addNeed} className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a3a] hover:bg-[#252550] text-xs rounded border border-[#333366]">
            <Plus size={12} /> Add Need
          </button>
        </div>
        <div className="space-y-3">
          {needs?.map?.((need: NeedDefinition) => (
            <div key={need?.id} className="bg-[#111128] rounded-lg p-4 border border-[#2a2a4a]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-400" />
                  <span className="text-sm font-bold text-gray-200">{need?.label ?? 'Need'}</span>
                  <span className="text-[10px] font-mono text-gray-600">{need?.key ?? ''}</span>
                </div>
                <button onClick={() => deleteNeed(need?.id ?? '')} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <label className="block">
                  <span className="text-[9px] text-gray-500">Label</span>
                  <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={need?.label ?? ''}
                    onChange={(e: any) => updateNeed(need?.id ?? '', { label: e?.target?.value ?? '', key: slugify(e?.target?.value ?? '') })}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] text-gray-500">Min</span>
                  <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={need?.min ?? 0}
                    onChange={(e: any) => updateNeed(need?.id ?? '', { min: Number(e?.target?.value ?? 0) })}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] text-gray-500">Max</span>
                  <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={need?.max ?? 100}
                    onChange={(e: any) => updateNeed(need?.id ?? '', { max: Number(e?.target?.value ?? 100) })}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] text-gray-500">Default</span>
                  <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={need?.default ?? 100}
                    onChange={(e: any) => updateNeed(need?.id ?? '', { default: Number(e?.target?.value ?? 100) })}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] text-gray-500">Decay/Tick</span>
                  <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={need?.decayPerTick ?? 1}
                    onChange={(e: any) => updateNeed(need?.id ?? '', { decayPerTick: Number(e?.target?.value ?? 1) })}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Brain size={16} className="text-purple-400" /> Skills ({skills?.length ?? 0})
          </h2>
          <button onClick={addSkill} className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a3a] hover:bg-[#252550] text-xs rounded border border-[#333366]">
            <Plus size={12} /> Add Skill
          </button>
        </div>
        <div className="space-y-3">
          {skills?.map?.((skill: SkillDefinition) => (
            <div key={skill?.id} className="bg-[#111128] rounded-lg p-4 border border-[#2a2a4a]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-purple-400" />
                  <span className="text-sm font-bold text-gray-200">{skill?.label ?? 'Skill'}</span>
                  <span className="text-[10px] font-mono text-gray-600">{skill?.key ?? ''}</span>
                </div>
                <button onClick={() => deleteSkill(skill?.id ?? '')} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <label className="block">
                  <span className="text-[9px] text-gray-500">Label</span>
                  <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={skill?.label ?? ''}
                    onChange={(e: any) => updateSkill(skill?.id ?? '', { label: e?.target?.value ?? '', key: slugify(e?.target?.value ?? '') })}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] text-gray-500">Min</span>
                  <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={skill?.min ?? 0}
                    onChange={(e: any) => updateSkill(skill?.id ?? '', { min: Number(e?.target?.value ?? 0) })}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] text-gray-500">Max</span>
                  <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={skill?.max ?? 100}
                    onChange={(e: any) => updateSkill(skill?.id ?? '', { max: Number(e?.target?.value ?? 100) })}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] text-gray-500">Default</span>
                  <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                    value={skill?.default ?? 0}
                    onChange={(e: any) => updateSkill(skill?.id ?? '', { default: Number(e?.target?.value ?? 0) })}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Facts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-200">Facts / Flags ({project?.facts?.length ?? 0})</h2>
        </div>
        <div className="space-y-1">
          {(project?.facts ?? [])?.map?.((fact: any) => (
            <div key={fact?.id} className="flex items-center justify-between px-3 py-1.5 bg-[#111128] rounded border border-[#2a2a4a] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400">{fact?.key ?? '?'}</span>
                <span className="text-gray-500 truncate max-w-xs">{fact?.label ?? ''}</span>
              </div>
              <span className="text-[9px] text-gray-600">{fact?.type ?? 'bool'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
