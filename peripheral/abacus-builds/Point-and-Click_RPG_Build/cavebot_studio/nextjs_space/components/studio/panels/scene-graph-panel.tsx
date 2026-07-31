'use client';
import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStudioStore } from '@/lib/store';
import { Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

function SceneNode({ data }: { data: any }) {
  const objCount = data?.objectCount ?? 0;
  const hasBroken = data?.brokenLinks ?? 0;
  return (
    <div className={`px-3 py-2 rounded-lg border-2 min-w-[140px] text-center shadow-lg ${
      hasBroken > 0
        ? 'bg-red-900/40 border-red-500/60'
        : data?.isStart
          ? 'bg-yellow-900/30 border-yellow-500/50'
          : 'bg-[#1a1a3a] border-[#3a3a6a]'
    }`}>
      <div className="text-xs font-bold text-gray-200 truncate">{data?.label ?? 'Scene'}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{objCount} object{objCount !== 1 ? 's' : ''}</div>
      {hasBroken > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1 justify-center">
          <AlertTriangle size={10} /> {hasBroken} broken link{hasBroken !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { sceneNode: SceneNode };

export default function SceneGraphPanel() {
  const { project, setActiveTab, setSelectedScene, addScene } = useStudioStore();
  const scenes = project?.scenes ?? [];
  const sceneIds = new Set(scenes?.map?.((s: any) => s?.id) ?? []);

  const { initialNodes, initialEdges } = useMemo(() => {
    const cols = Math.max(4, Math.ceil(Math.sqrt(scenes?.length ?? 0)));
    const nodes: Node[] = (scenes ?? [])?.map?.((scene: any, i: number) => {
      // Count broken links
      let brokenLinks = 0;
      (scene?.objects ?? [])?.forEach?.((obj: any) => {
        if (obj?.interaction === 'scene_change' && obj?.interactionData && !sceneIds.has(obj.interactionData)) {
          brokenLinks++;
        }
        (obj?.clickResponses ?? [])?.forEach?.((cr: any) => {
          if (cr?.interaction === 'scene_change' && cr?.interactionData && !sceneIds.has(cr.interactionData)) {
            brokenLinks++;
          }
        });
      });
      return {
        id: scene?.id ?? `node_${i}`,
        type: 'sceneNode',
        position: { x: (i % cols) * 220, y: Math.floor(i / cols) * 120 },
        data: {
          label: scene?.name ?? 'Untitled',
          objectCount: scene?.objects?.length ?? 0,
          brokenLinks,
          isStart: scene?.id === project?.meta?.startSceneId,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    }) ?? [];

    const edges: Edge[] = [];
    const edgeSet = new Set<string>();
    (scenes ?? [])?.forEach?.((scene: any) => {
      (scene?.objects ?? [])?.forEach?.((obj: any) => {
        const addEdge = (targetId: string, broken: boolean) => {
          const key = `${scene?.id}->${targetId}`;
          if (edgeSet.has(key)) return;
          edgeSet.add(key);
          edges.push({
            id: key,
            source: scene?.id ?? '',
            target: targetId,
            animated: !broken,
            style: { stroke: broken ? '#ef4444' : '#6366f1', strokeWidth: 2 },
            label: broken ? '✖' : undefined,
          });
        };
        if (obj?.interaction === 'scene_change' && obj?.interactionData) {
          addEdge(obj.interactionData, !sceneIds.has(obj.interactionData));
        }
        (obj?.clickResponses ?? [])?.forEach?.((cr: any) => {
          if (cr?.interaction === 'scene_change' && cr?.interactionData) {
            addEdge(cr.interactionData, !sceneIds.has(cr.interactionData));
          }
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [scenes, project?.meta?.startSceneId, sceneIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedScene(node?.id ?? null);
    setActiveTab('scene-editor');
  }, [setSelectedScene, setActiveTab]);

  const handleAddScene = useCallback(() => {
    const name = prompt('Scene name:');
    if (name?.trim?.()) {
      addScene(name.trim());
      toast.success('Scene added: ' + name.trim());
    }
  }, [addScene]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111128] border-b border-[#1f1f3f]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-200">Scene Graph</h2>
          <span className="text-xs text-gray-500">{scenes?.length ?? 0} scenes</span>
        </div>
        <button onClick={handleAddScene} className="flex items-center gap-1 px-2 py-1 bg-[#1a1a3a] hover:bg-[#252550] text-xs rounded border border-[#333366]">
          <Plus size={12} /> Add Scene
        </button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1a1a3a" gap={20} />
          <Controls position="bottom-right" />
          <MiniMap
            nodeColor={(n: any) => n?.data?.brokenLinks > 0 ? '#ef4444' : n?.data?.isStart ? '#eab308' : '#6366f1'}
            maskColor="rgba(0,0,0,0.7)"
            style={{ background: '#0d0d1a' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
