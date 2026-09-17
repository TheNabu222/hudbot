'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, RefreshCcw, RadioTower, SplitSquareHorizontal } from 'lucide-react';
import { useStudioStore } from '@/lib/store';

type BridgeStatus =
  | { state: 'waiting'; label: string; projectName?: string; projectId?: string }
  | { state: 'connected'; label: string; projectName?: string; projectId?: string }
  | { state: 'blocked'; label: string; projectName?: string; projectId?: string };

const DEFAULT_HUDBOT_URL = 'http://127.0.0.1:3009';

function normalizeBuilderUrl(rawUrl: string) {
  const trimmed = rawUrl.trim() || DEFAULT_HUDBOT_URL;
  try {
    return new URL(trimmed).toString();
  } catch {
    return DEFAULT_HUDBOT_URL;
  }
}

export default function HudbotBridgePanel() {
  const { project, activeTab } = useStudioStore();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [builderUrlInput, setBuilderUrlInput] = useState(
    process.env.NEXT_PUBLIC_HUDBOT_URL || DEFAULT_HUDBOT_URL,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<BridgeStatus>({
    state: 'waiting',
    label: 'Waiting for HUDbot 3009',
  });

  const builderUrl = useMemo(() => normalizeBuilderUrl(builderUrlInput), [builderUrlInput]);

  const launchUrl = useMemo(() => {
    const url = new URL(builderUrl);
    url.searchParams.set('source', 'cavebot-studio-3010');
    url.searchParams.set('projectName', project?.name ?? 'Untitled Cavebot project');
    return url.toString();
  }, [builderUrl, project?.name]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(builderUrl).origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'hudbot:ready') return;

      setStatus({
        state: 'connected',
        label: 'HUDbot 3009 connected',
        projectName: typeof data.projectName === 'string' ? data.projectName : undefined,
        projectId: typeof data.projectId === 'string' ? data.projectId : undefined,
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [builderUrl]);

  useEffect(() => {
    if (activeTab !== 'hudbot-bridge') return;
    setStatus({ state: 'waiting', label: 'Waiting for HUDbot 3009' });
    const timeoutId = window.setTimeout(() => {
      setStatus((current) =>
        current.state === 'connected'
          ? current
          : {
              state: 'blocked',
              label: 'No handshake yet. Check that the 3009 HUDbot server is running.',
            },
      );
    }, 2500);
    return () => window.clearTimeout(timeoutId);
  }, [activeTab, launchUrl, reloadKey]);

  const sendHandshake = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'cavebot:hello',
        source: 'cavebot-studio-3010',
        projectId: project?.id,
        projectName: project?.name,
      },
      new URL(builderUrl).origin,
    );
  };

  useEffect(() => {
    if (activeTab !== 'hudbot-bridge') return;
    const intervalId = window.setInterval(sendHandshake, 900);
    return () => window.clearInterval(intervalId);
  }, [activeTab, builderUrl, project?.id, project?.name]);

  return (
    <div className="h-full flex flex-col bg-[#080810]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#111128] border-b border-[#1f1f3f] shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <SplitSquareHorizontal size={15} className="text-cyan-300" />
            HUDbot Bridge
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Run Cavebot Studio 3010 beside the HUDbot builder/runtime at 3009.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((key) => key + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a3a] hover:bg-[#252550] text-xs rounded-md border border-[#333366] transition-colors"
            aria-label="Reload embedded HUDbot builder"
          >
            <RefreshCcw size={13} /> Reload
          </button>
          <button
            onClick={() => window.open(launchUrl, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-100 text-xs rounded-md border border-cyan-400/40 transition-colors"
            aria-label="Open HUDbot builder in a new tab"
          >
            <ExternalLink size={13} /> Open 3009
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(260px,360px)_1fr] min-h-0 flex-1">
        <aside className="border-r border-[#1f1f3f] bg-[#0d0d1a] p-4 space-y-4 overflow-y-auto">
          <section className="rounded-md border border-[#2a2a4a] bg-[#111128] p-3">
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1" htmlFor="hudbot-builder-url">
              HUDbot builder URL
            </label>
            <input
              id="hudbot-builder-url"
              className="w-full rounded border border-[#333366] bg-[#080810] px-2 py-1.5 text-xs text-gray-100"
              value={builderUrlInput}
              onChange={(event) => setBuilderUrlInput(event.target.value)}
            />
          </section>

          <section className="rounded-md border border-[#2a2a4a] bg-[#111128] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-100">
              <RadioTower
                size={14}
                className={
                  status.state === 'connected'
                    ? 'text-green-300'
                    : status.state === 'blocked'
                      ? 'text-yellow-300'
                      : 'text-cyan-300'
                }
              />
              {status.label}
            </div>
            {status.projectName && (
              <p className="mt-2 text-xs text-gray-300">
                Loaded builder project: <span className="text-cyan-100">{status.projectName}</span>
              </p>
            )}
            {status.projectId && (
              <p className="mt-1 break-all font-mono text-[10px] text-gray-500">{status.projectId}</p>
            )}
          </section>

          <section className="rounded-md border border-[#2a2a4a] bg-[#111128] p-3">
            <h3 className="text-xs font-bold text-gray-200">Current 3010 project</h3>
            <p className="mt-2 text-sm text-cyan-100">{project?.name ?? 'Untitled'}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-400">
              <div>
                <dt>Scenes</dt>
                <dd className="text-gray-100">{project?.scenes?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Dialogues</dt>
                <dd className="text-gray-100">{project?.dialogueTrees?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Quests</dt>
                <dd className="text-gray-100">{project?.quests?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Interfaces</dt>
                <dd className="text-gray-100">{project?.uiMenus?.length ?? 0}</dd>
              </div>
            </dl>
          </section>
        </aside>

        <div className="min-w-0 min-h-0 p-3">
          <iframe
            ref={iframeRef}
            key={`${launchUrl}-${reloadKey}`}
            src={launchUrl}
            title="HUDbot builder running on 3009"
            className="h-full w-full rounded-md border border-[#2a2a4a] bg-black"
            onLoad={sendHandshake}
          />
        </div>
      </div>
    </div>
  );
}
