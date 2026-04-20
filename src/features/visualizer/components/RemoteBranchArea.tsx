"use client";

import { Globe } from "lucide-react";
import type { BranchRef } from "@/lib/types/git";

interface RemoteBranchAreaProps {
  remoteRefs: BranchRef[];
  remoteUrl?: string;
}

function displayHost(url: string): string {
  try {
    const normalized = url.replace(/^git@([^:]+):/, "https://$1/").replace(/\.git$/, "");
    return new URL(normalized).hostname;
  } catch {
    return url;
  }
}

export function RemoteBranchArea({ remoteRefs, remoteUrl }: RemoteBranchAreaProps) {
  const hasRemote = !!remoteUrl || remoteRefs.length > 0;
  const host = remoteUrl ? displayHost(remoteUrl) : null;

  return (
    <div className="flex flex-col h-full min-w-[220px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          Remote Branch
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        {hasRemote ? (
          <>
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Globe className="w-4 h-4 shrink-0 text-[var(--color-brand)]" />
              <span className="text-xs font-mono truncate" title={remoteUrl}>
                {host ?? "origin"}
              </span>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              リモートサーバー上の実際のブランチ状態です。他の開発者が
              <code className="mx-1 px-1 rounded bg-[var(--color-bg-muted)] font-mono text-[var(--color-text-primary)]">
                push
              </code>
              するとサーバー側で即時更新されます。
            </p>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                ローカルから確認するには
              </p>
              <code className="block text-xs font-mono text-[var(--color-brand)]">
                git fetch
              </code>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                → Remote Tracking が最新化されます
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--color-text-muted)] text-center">
              リモートが設定されていません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
