"use client";

import { AnimatePresence } from "framer-motion";
import type { FileStatus } from "@/lib/types/git";
import { FileBlock } from "./FileBlock";

interface StagingAreaProps {
  files: FileStatus[];
  isLoading?: boolean;
  isError?: boolean;
}

export function StagingArea({ files, isLoading, isError }: StagingAreaProps) {
  return (
    <div className="flex flex-col h-full min-w-[220px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">Staging Area</span>
        {!isLoading && !isError && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]">
            {files.length}
          </span>
        )}
      </div>

      <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto">
        {isLoading && (
          <>
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] animate-pulse" />
            ))}
          </>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-3 text-center">
              <p className="text-sm text-[var(--color-danger)]">リポジトリの読み取りに失敗しました</p>
            </div>
          </div>
        )}

        {!isLoading && !isError && files.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--color-text-muted)]">ステージングなし</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {!isLoading && !isError && files.map((file) => (
            <FileBlock
              key={file.filepath}
              file={file}
              layoutId={`file-${file.filepath}`}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
