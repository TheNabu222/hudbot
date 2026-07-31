'use client';
import React, { useState, useCallback } from 'react';
import { useStudioStore } from '@/lib/store';
import { generateId } from '@/lib/id-utils';
import type { DialogueTree, DialogueNode, DialogueChoice } from '@/lib/types';
import { Plus, Trash2, MessageSquare, ChevronRight, ArrowRight, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

export default function DialoguePanel() {
  const {
    project, selectedDialogueTreeId, setSelectedDialogueTree,
    selectedDialogueNodeId, setSelectedDialogueNode,
    addDialogueTree, updateDialogueTree, deleteDialogueTree,
    addDialogueNode, updateDialogueNode, deleteDialogueNode,
  } = useStudioStore();

  const trees = project?.dialogueTrees ?? [];
  const selectedTree = trees?.find?.((t: DialogueTree) => t?.id === selectedDialogueTreeId) ?? null;
  const selectedNode = selectedTree?.nodes?.find?.((n: DialogueNode) => n?.id === selectedDialogueNodeId) ?? null;

  const handleAddTree = useCallback(() => {
    const name = prompt('Dialogue tree name:');
    if (name?.trim?.()) {
      addDialogueTree(name.trim());
      toast.success('Dialogue tree created');
    }
  }, [addDialogueTree]);

  const handleAddNode = useCallback(() => {
    if (!selectedTree?.id) return;
    const node: DialogueNode = {
      id: generateId('dnode'),
      speaker: '',
      text: 'New dialogue line...',
      choices: [],
      portraitPosition: 'left',
    };
    addDialogueNode(selectedTree.id, node);
  }, [selectedTree, addDialogueNode]);

  const handleAddChoice = useCallback(() => {
    if (!selectedTree?.id || !selectedNode?.id) return;
    const choice: DialogueChoice = {
      id: generateId('dchoice'),
      text: 'New option...',
      nextNodeId: null,
    };
    updateDialogueNode(selectedTree.id, selectedNode.id, {
      choices: [...(selectedNode?.choices ?? []), choice],
    });
  }, [selectedTree, selectedNode, updateDialogueNode]);

  const updateChoice = useCallback((choiceId: string, patch: Partial<DialogueChoice>) => {
    if (!selectedTree?.id || !selectedNode?.id) return;
    updateDialogueNode(selectedTree.id, selectedNode.id, {
      choices: (selectedNode?.choices ?? [])?.map?.((c: DialogueChoice) =>
        c?.id === choiceId ? { ...(c ?? {}), ...(patch ?? {}) } : c
      ) ?? [],
    });
  }, [selectedTree, selectedNode, updateDialogueNode]);

  const deleteChoice = useCallback((choiceId: string) => {
    if (!selectedTree?.id || !selectedNode?.id) return;
    updateDialogueNode(selectedTree.id, selectedNode.id, {
      choices: (selectedNode?.choices ?? [])?.filter?.((c: DialogueChoice) => c?.id !== choiceId) ?? [],
    });
  }, [selectedTree, selectedNode, updateDialogueNode]);

  return (
    <div className="h-full flex">
      {/* Tree list */}
      <div className="w-56 bg-[#111128] border-r border-[#1f1f3f] overflow-y-auto shrink-0">
        <div className="p-2 border-b border-[#1f1f3f] flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase">Trees ({trees?.length ?? 0})</h3>
          <button onClick={handleAddTree} className="p-1 hover:bg-[#252550] rounded"><Plus size={12} className="text-gray-400" /></button>
        </div>
        {trees?.map?.((tree: DialogueTree) => (
          <button
            key={tree?.id}
            onClick={() => { setSelectedDialogueTree(tree?.id ?? null); setSelectedDialogueNode(null); }}
            className={`w-full px-2 py-1.5 text-left text-xs border-b border-[#1a1a2e] flex items-center gap-1.5 ${
              tree?.id === selectedDialogueTreeId ? 'bg-purple-500/20 text-purple-300' : 'hover:bg-[#1a1a3a] text-gray-400'
            }`}
          >
            <MessageSquare size={10} />
            <span className="truncate">{tree?.name ?? 'Untitled'}</span>
            <span className="text-[9px] text-gray-600 ml-auto">{tree?.nodes?.length ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Node list + editor */}
      {selectedTree ? (
        <div className="flex-1 flex">
          {/* Nodes */}
          <div className="w-60 bg-[#0f0f24] border-r border-[#1f1f3f] overflow-y-auto shrink-0">
            <div className="p-2 border-b border-[#1f1f3f] flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase">Nodes</h3>
              <div className="flex items-center gap-1">
                <button onClick={handleAddNode} className="p-1 hover:bg-[#252550] rounded"><Plus size={12} className="text-gray-400" /></button>
                <button onClick={() => { deleteDialogueTree(selectedTree?.id ?? ''); setSelectedDialogueTree(null); }} className="p-1 hover:bg-red-500/20 rounded">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>
            {(selectedTree?.nodes ?? [])?.map?.((node: DialogueNode) => {
              const isStart = node?.id === selectedTree?.startNodeId;
              return (
                <button
                  key={node?.id}
                  onClick={() => setSelectedDialogueNode(node?.id ?? null)}
                  className={`w-full px-2 py-2 text-left text-xs border-b border-[#1a1a2e] ${
                    node?.id === selectedDialogueNodeId ? 'bg-cyan-500/15 text-cyan-300' : 'hover:bg-[#1a1a3a] text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isStart && <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded">START</span>}
                    <span className="font-mono text-[10px] text-pink-400">{node?.speaker || '???'}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{node?.text ?? '...'}</p>
                  <div className="text-[9px] text-gray-600 mt-0.5">
                    <GitBranch size={8} className="inline" /> {node?.choices?.length ?? 0} choices
                  </div>
                </button>
              );
            })}
          </div>

          {/* Node editor */}
          {selectedNode ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-200">Edit Node</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateDialogueTree(selectedTree?.id ?? '', { startNodeId: selectedNode?.id ?? null })}
                    className="text-[10px] px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20 hover:bg-yellow-500/20"
                  >
                    Set as Start
                  </button>
                  <button
                    onClick={() => { deleteDialogueNode(selectedTree?.id ?? '', selectedNode?.id ?? ''); setSelectedDialogueNode(null); }}
                    className="p-1 hover:bg-red-500/20 rounded text-red-400"
                  ><Trash2 size={14} /></button>
                </div>
              </div>

              <label className="block">
                <span className="text-[10px] text-gray-500">Speaker</span>
                <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                  value={selectedNode?.speaker ?? ''}
                  onChange={(e: any) => updateDialogueNode(selectedTree?.id ?? '', selectedNode?.id ?? '', { speaker: e?.target?.value ?? '' })}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-gray-500">Text</span>
                <textarea className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-2 text-sm text-gray-200 h-24 resize-y"
                  value={selectedNode?.text ?? ''}
                  onChange={(e: any) => updateDialogueNode(selectedTree?.id ?? '', selectedNode?.id ?? '', { text: e?.target?.value ?? '' })}
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-gray-500">Portrait Position</span>
                <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-3 py-1.5 text-sm text-gray-200"
                  value={selectedNode?.portraitPosition ?? 'left'}
                  onChange={(e: any) => updateDialogueNode(selectedTree?.id ?? '', selectedNode?.id ?? '', { portraitPosition: e?.target?.value as any })}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>

              {/* Choices */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-300">Response Choices</h4>
                  <button onClick={handleAddChoice} className="flex items-center gap-1 px-2 py-1 bg-[#1a1a3a] hover:bg-[#252550] text-[10px] rounded border border-[#333366]">
                    <Plus size={10} /> Add Choice
                  </button>
                </div>
                <div className="space-y-3">
                  {(selectedNode?.choices ?? [])?.map?.((choice: DialogueChoice, ci: number) => (
                    <div key={choice?.id} className="bg-[#111128] rounded-lg p-3 border border-[#2a2a4a] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-pink-400 font-mono">Choice {ci + 1}</span>
                        <button onClick={() => deleteChoice(choice?.id ?? '')} className="p-0.5 hover:bg-red-500/20 rounded">
                          <Trash2 size={10} className="text-red-400" />
                        </button>
                      </div>
                      <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-gray-200"
                        placeholder="Choice text..."
                        value={choice?.text ?? ''}
                        onChange={(e: any) => updateChoice(choice?.id ?? '', { text: e?.target?.value ?? '' })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[9px] text-gray-500">Next Node</span>
                          <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-1 py-1 text-[10px] text-gray-200"
                            value={choice?.nextNodeId ?? ''}
                            onChange={(e: any) => updateChoice(choice?.id ?? '', { nextNodeId: e?.target?.value || null })}
                          >
                            <option value="">[End]</option>
                            {(selectedTree?.nodes ?? [])?.filter?.((n: DialogueNode) => n?.id !== selectedNode?.id)?.map?.((n: DialogueNode) => (
                              <option key={n?.id} value={n?.id ?? ''}>{n?.speaker ?? '?'}: {(n?.text ?? '').substring(0, 30)}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[9px] text-gray-500">Set Flag</span>
                          <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-1 py-1 text-[10px] text-gray-200"
                            value={choice?.setGameFlag ?? ''}
                            onChange={(e: any) => updateChoice(choice?.id ?? '', { setGameFlag: e?.target?.value || null })}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[9px] text-gray-500">Give Item</span>
                          <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-1 py-1 text-[10px] text-gray-200"
                            value={choice?.giveItemId ?? ''}
                            onChange={(e: any) => updateChoice(choice?.id ?? '', { giveItemId: e?.target?.value || null })}
                          >
                            <option value="">None</option>
                            {(project?.items ?? [])?.map?.((item: any) => (
                              <option key={item?.id} value={item?.id ?? ''}>{item?.name ?? '?'}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[9px] text-gray-500">Go to Scene</span>
                          <select className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-1 py-1 text-[10px] text-gray-200"
                            value={choice?.changeSceneId ?? ''}
                            onChange={(e: any) => updateChoice(choice?.id ?? '', { changeSceneId: e?.target?.value || null })}
                          >
                            <option value="">None</option>
                            {(project?.scenes ?? [])?.map?.((s: any) => (
                              <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? '?'}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-[9px] text-gray-500">Required Flag</span>
                        <input className="w-full bg-[#0d0d1a] border border-[#2a2a4a] rounded px-1 py-1 text-[10px] text-gray-200"
                          value={choice?.requiredGameFlag ?? ''}
                          onChange={(e: any) => updateChoice(choice?.id ?? '', { requiredGameFlag: e?.target?.value || null })}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Select a node to edit</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a dialogue tree to edit</p>
          </div>
        </div>
      )}
    </div>
  );
}
