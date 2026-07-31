'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStudioStore } from '@/lib/store';
import { exportStandaloneHTML } from '@/lib/html-exporter';
import { Play, RotateCcw, Maximize2 } from 'lucide-react';

export default function PreviewPanel() {
  const { project, previewSceneId, setPreviewScene } = useStudioStore();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [key, setKey] = useState(0);

  // Build a preview project with the selected start scene
  const htmlContent = useMemo(() => {
    if (!project) return '';
    const previewProject = {
      ...(project ?? {}),
      meta: {
        ...(project?.meta ?? {}),
        startSceneId: previewSceneId ?? project?.meta?.startSceneId ?? (project?.scenes?.[0]?.id ?? null),
      },
    };
    return exportStandaloneHTML(previewProject as any);
  }, [project, previewSceneId, key]);

  const blobUrl = useMemo(() => {
    if (!htmlContent) return '';
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [htmlContent]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111128] border-b border-[#1f1f3f] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Play size={14} className="text-green-400" /> Game Preview
          </h2>
          <select
            className="bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-1 text-[10px] text-gray-200"
            value={previewSceneId ?? ''}
            onChange={(e: any) => setPreviewScene(e?.target?.value || null)}
          >
            <option value="">Start Scene</option>
            {(project?.scenes ?? [])?.map?.((s: any) => (
              <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? 'Untitled'}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setKey((k) => k + 1)} className="flex items-center gap-1 px-2 py-1 bg-[#1a1a3a] hover:bg-[#252550] text-xs rounded border border-[#333366]">
            <RotateCcw size={12} /> Restart
          </button>
          <button
            onClick={() => { if (blobUrl) window.open(blobUrl, '_blank'); }}
            className="flex items-center gap-1 px-2 py-1 bg-[#1a1a3a] hover:bg-[#252550] text-xs rounded border border-[#333366]"
          >
            <Maximize2 size={12} /> Fullscreen
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-[#080810] p-4">
        <div className="w-full max-w-4xl aspect-[4/3] rounded-lg overflow-hidden border-2 border-[#2a2a4a] shadow-2xl">
          {blobUrl && (
            <iframe
              ref={iframeRef}
              key={key}
              src={blobUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Game Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}
