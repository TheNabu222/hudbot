'use client';
import React from 'react';
import { useStudioStore } from '@/lib/store';
import { Settings, Palette, Monitor, Clock } from 'lucide-react';

export default function SettingsPanel() {
  const { project, updateSettings, updateProjectMeta } = useStudioStore();
  const s = project?.settings ?? {};

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-8">
      <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
        <Settings size={16} className="text-gray-400" /> Project Settings
      </h2>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Monitor size={12} /> General
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] text-gray-500">Project Name</span>
            <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
              value={project?.name ?? ''}
              onChange={(e: any) => updateProjectMeta({ name: e?.target?.value ?? '' })}
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Author</span>
            <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
              value={project?.meta?.author ?? ''}
              onChange={(e: any) => updateProjectMeta({ author: e?.target?.value ?? '' })}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-[10px] text-gray-500">Start Scene</span>
          <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
            value={project?.meta?.startSceneId ?? ''}
            onChange={(e: any) => updateProjectMeta({ startSceneId: e?.target?.value || null })}
          >
            <option value="">None</option>
            {(project?.scenes ?? [])?.map?.((sc: any) => (
              <option key={sc?.id} value={sc?.id ?? ''}>{sc?.name ?? 'Untitled'}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Monitor size={12} /> Stage
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="text-[10px] text-gray-500">Width</span>
            <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
              value={s?.stageWidth ?? 800}
              onChange={(e: any) => updateSettings({ stageWidth: Number(e?.target?.value ?? 800) })}
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Height</span>
            <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
              value={s?.stageHeight ?? 600}
              onChange={(e: any) => updateSettings({ stageHeight: Number(e?.target?.value ?? 600) })}
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Grid Size</span>
            <input type="number" className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
              value={s?.gridSize ?? 32}
              onChange={(e: any) => updateSettings({ gridSize: Number(e?.target?.value ?? 32) })}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Palette size={12} /> Theme
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="text-[10px] text-gray-500">Primary Color</span>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded cursor-pointer bg-transparent"
                value={s?.uiColorPrimary ?? '#fbff00'}
                onChange={(e: any) => updateSettings({ uiColorPrimary: e?.target?.value ?? '#fbff00' })}
              />
              <input className="flex-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200 font-mono"
                value={s?.uiColorPrimary ?? '#fbff00'}
                onChange={(e: any) => updateSettings({ uiColorPrimary: e?.target?.value ?? '#fbff00' })}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Secondary Color</span>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded cursor-pointer bg-transparent"
                value={s?.uiColorSecondary ?? '#bc7f2a'}
                onChange={(e: any) => updateSettings({ uiColorSecondary: e?.target?.value ?? '#bc7f2a' })}
              />
              <input className="flex-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200 font-mono"
                value={s?.uiColorSecondary ?? '#bc7f2a'}
                onChange={(e: any) => updateSettings({ uiColorSecondary: e?.target?.value ?? '#bc7f2a' })}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Background</span>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded cursor-pointer bg-transparent"
                value={s?.uiColorBackground ?? '#6b6bff'}
                onChange={(e: any) => updateSettings({ uiColorBackground: e?.target?.value ?? '#6b6bff' })}
              />
              <input className="flex-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200 font-mono"
                value={s?.uiColorBackground ?? '#6b6bff'}
                onChange={(e: any) => updateSettings({ uiColorBackground: e?.target?.value ?? '#6b6bff' })}
              />
            </div>
          </label>
        </div>
        <label className="block">
          <span className="text-[10px] text-gray-500">Font Family</span>
          <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200 font-mono"
            value={s?.uiFontFamily ?? "'Press Start 2P', monospace"}
            onChange={(e: any) => updateSettings({ uiFontFamily: e?.target?.value ?? '' })}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Clock size={12} /> Systems
        </h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" className="rounded" checked={s?.useDayNightCycle ?? false}
              onChange={(e: any) => updateSettings({ useDayNightCycle: e?.target?.checked ?? false })} />
            Enable Day/Night Cycle
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" className="rounded" checked={s?.enableNeeds ?? true}
              onChange={(e: any) => updateSettings({ enableNeeds: e?.target?.checked ?? true })} />
            Enable Needs System
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" className="rounded" checked={s?.enableTTRPGStats ?? false}
              onChange={(e: any) => updateSettings({ enableTTRPGStats: e?.target?.checked ?? false })} />
            Enable TTRPG Stats
          </label>
        </div>
      </section>

      <section className="text-[10px] text-gray-600 pt-4 border-t border-[#1f1f3f]">
        <p>Schema Version: {project?.schemaVersion ?? 'unknown'}</p>
        <p>Project ID: {project?.id ?? 'unknown'}</p>
        <p>Last Updated: {project?.meta?.updatedAt ?? 'never'}</p>
      </section>
    </div>
  );
}
