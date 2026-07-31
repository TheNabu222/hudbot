'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useStudioStore } from '@/lib/store';
import { importV1Project } from '@/lib/importer';
import { exportStandaloneHTML } from '@/lib/html-exporter';
import type { EditorTab } from '@/lib/types';
import {
  Map, Edit3, MessageSquare, Users, Target, Package, Activity, Settings, Play, Save, Upload, Download, FileDown, Sparkles,
} from 'lucide-react';
import SceneGraphPanel from './panels/scene-graph-panel';
import SceneEditorPanel from './panels/scene-editor-panel';
import DialoguePanel from './panels/dialogue-panel';
import CharacterPanel from './panels/character-panel';
import QuestPanel from './panels/quest-panel';
import ItemPanel from './panels/item-panel';
import NeedsPanel from './panels/needs-panel';
import SettingsPanel from './panels/settings-panel';
import PreviewPanel from './panels/preview-panel';
import { toast } from 'sonner';

const TABS: { key: EditorTab; label: string; icon: React.ReactNode }[] = [
  { key: 'scenes', label: 'Scene Graph', icon: <Map size={16} /> },
  { key: 'scene-editor', label: 'Scene Editor', icon: <Edit3 size={16} /> },
  { key: 'dialogue', label: 'Dialogue', icon: <MessageSquare size={16} /> },
  { key: 'characters', label: 'Characters', icon: <Users size={16} /> },
  { key: 'quests', label: 'Quests', icon: <Target size={16} /> },
  { key: 'items', label: 'Items', icon: <Package size={16} /> },
  { key: 'needs', label: 'Needs/Stats', icon: <Activity size={16} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  { key: 'preview', label: 'Preview', icon: <Play size={16} /> },
];

export default function StudioApp() {
  const { project, activeTab, setActiveTab, setProject, saveToLocalStorage, loadFromLocalStorage, dirty } = useStudioStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Try loading from localStorage first
    const didLoad = loadFromLocalStorage();
    if (!didLoad) {
      // Load sample data
      fetch('/sample-game.json')
        .then((r) => r?.json?.())
        .then((data: any) => {
          if (data) {
            const imported = importV1Project(data);
            setProject(imported);
            saveToLocalStorage();
            toast.success('Sample game loaded — ' + (imported?.scenes?.length ?? 0) + ' scenes, ' + (imported?.characters?.length ?? 0) + ' characters');
          }
        })
        .catch((e: any) => console.error('Failed to load sample:', e));
    }
    setLoaded(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    saveToLocalStorage();
    toast.success('Project saved!');
  }, [saveToLocalStorage]);

  const handleExportJSON = useCallback(() => {
    const json = useStudioStore.getState()?.exportJSON?.() ?? '{}';
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (project?.name ?? 'project')?.replace?.(/\s+/g, '_') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported!');
  }, [project?.name]);

  const handleExportHTML = useCallback(() => {
    const proj = useStudioStore.getState()?.project;
    if (!proj) return;
    const html = exportStandaloneHTML(proj);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (proj?.name ?? 'game')?.replace?.(/\s+/g, '_') + '.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Standalone HTML exported!');
  }, []);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e?.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        try {
          const raw = JSON.parse(ev?.target?.result ?? '{}');
          const imported = raw?.schemaVersion === 2 ? raw : importV1Project(raw);
          setProject(imported);
          saveToLocalStorage();
          toast.success('Imported: ' + (imported?.scenes?.length ?? 0) + ' scenes');
        } catch (err: any) {
          toast.error('Import failed: ' + (err?.message ?? 'unknown error'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setProject, saveToLocalStorage]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d1a]">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400 font-mono">Loading Cavebot Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d0d1a]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#111128] border-b border-[#2a2a4a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="font-display font-bold text-sm tracking-tight bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              CAVEBOT STUDIO
            </span>
          </div>
          <span className="text-xs text-gray-500 font-mono">v2.0</span>
          <span className="text-xs text-gray-500 px-2">|</span>
          <span className="text-xs text-gray-300 truncate max-w-[200px]">{project?.name ?? 'Untitled'}</span>
          {dirty && <span className="text-xs text-yellow-500">●</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a3a] hover:bg-[#252550] text-sm rounded-md border border-[#333366] transition-colors" title="Save">
            <Save size={14} /> Save
          </button>
          <button onClick={handleImportJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a3a] hover:bg-[#252550] text-sm rounded-md border border-[#333366] transition-colors" title="Import JSON">
            <Upload size={14} /> Import
          </button>
          <button onClick={handleExportJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a3a] hover:bg-[#252550] text-sm rounded-md border border-[#333366] transition-colors" title="Export JSON">
            <Download size={14} /> JSON
          </button>
          <button onClick={handleExportHTML} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm rounded-md transition-all shadow-lg" title="Export Standalone HTML">
            <FileDown size={14} /> Export Game
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="flex items-center gap-1 px-4 py-1.5 bg-[#0f0f24] border-b border-[#1f1f3f] overflow-x-auto shrink-0">
        {TABS?.map?.((tab: any) => (
          <button
            key={tab?.key}
            onClick={() => setActiveTab(tab?.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === tab?.key
                ? 'bg-gradient-to-r from-yellow-500/20 to-pink-500/20 text-yellow-300 border border-yellow-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a3a]'
            }`}
          >
            {tab?.icon}
            {tab?.label}
          </button>
        ))}
      </nav>

      {/* Panel Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'scenes' && <SceneGraphPanel />}
        {activeTab === 'scene-editor' && <SceneEditorPanel />}
        {activeTab === 'dialogue' && <DialoguePanel />}
        {activeTab === 'characters' && <CharacterPanel />}
        {activeTab === 'quests' && <QuestPanel />}
        {activeTab === 'items' && <ItemPanel />}
        {activeTab === 'needs' && <NeedsPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'preview' && <PreviewPanel />}
      </main>
    </div>
  );
}
