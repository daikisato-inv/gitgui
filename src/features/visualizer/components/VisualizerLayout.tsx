import { ChevronRight, ChevronLeft, ChevronUp } from "lucide-react";
import type { GitState } from "@/lib/types/git";
import { WorkingTreeArea } from "./WorkingTreeArea";
import { StagingArea } from "./StagingArea";
import { BranchGraphArea } from "./BranchGraphArea";
import { RemoteBranchArea } from "./RemoteBranchArea";

interface VisualizerLayoutProps {
  gitState: GitState | null;
  isLoading?: boolean;
  isError?: boolean;
}

function Arrow({ rightLabel, leftLabel }: { rightLabel?: string; leftLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-center gap-1">
      {rightLabel && (
        <div className="flex items-center gap-0.5">
          <span className="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
            {rightLabel}
          </span>
          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
        </div>
      )}
      {leftLabel && (
        <div className="flex items-center gap-0.5">
          <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
            {leftLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export function VisualizerLayout({ gitState, isLoading, isError }: VisualizerLayoutProps) {
  const headBranch = gitState?.head ?? "";
  const headOid = gitState?.branches.find((b) => b.name === headBranch)?.oid
    ?? gitState?.commits[0]?.oid;
  const remoteHeadOid = gitState?.remoteRefs.find((r) => r.name === `origin/${headBranch}`)?.oid
    ?? gitState?.remoteRefs[0]?.oid;

  return (
    <div className="flex flex-row gap-2 h-full overflow-x-auto px-6 py-6 min-w-0">
      <WorkingTreeArea
        files={gitState?.workingTree ?? []}
        isLoading={isLoading}
        isError={isError}
      />
      <Arrow rightLabel="git add" />
      <StagingArea
        files={gitState?.stagingArea ?? []}
        isLoading={isLoading}
        isError={isError}
      />
      <Arrow rightLabel="git commit" />

      {/*
       * 5列×2行グリッド
       * 列: [LB] [push→/←merge] [RT] [push→/←fetch] [R]
       * 行1: パネル本体
       * 行2: git pull ブラケット（全5列 subgrid でパネル中央にスタブ）
       *
       * subgrid: 親グリッドの列幅を継承し、各パネル列の中央にスタブを配置
       * min-h-0 + minmax(0,1fr): flex/grid の min-height:auto を解除して高さを統一
       */}
      <div className="grid gap-x-2 min-h-0 grid-cols-[auto_auto_auto_auto_auto] grid-rows-[minmax(0,1fr)_auto]">

        {/* 行1: パネルと矢印 */}
        <div className="col-start-1 row-start-1">
          <BranchGraphArea
            title="Local Branch"
            commits={gitState?.commits ?? []}
            branches={gitState?.branches ?? []}
            headOid={headOid}
            headBranchName={headBranch}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
        <div className="col-start-2 row-start-1 flex items-center justify-center">
          <Arrow rightLabel="git push" leftLabel="git merge" />
        </div>
        <div className="col-start-3 row-start-1">
          <BranchGraphArea
            title="Remote Tracking"
            commits={gitState?.commits ?? []}
            branches={gitState?.remoteRefs ?? []}
            headOid={remoteHeadOid}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
        <div className="col-start-4 row-start-1 flex items-center justify-center">
          <Arrow rightLabel="git push" leftLabel="git fetch" />
        </div>
        <div className="col-start-5 row-start-1">
          <RemoteBranchArea
            remoteRefs={gitState?.remoteRefs ?? []}
            remoteUrl={gitState?.remoteUrl}
          />
        </div>

        {/*
         * 行2: git pull ブラケット
         * subgrid で親グリッドの列幅を継承 → LB(col1)・RT(col3)・R(col5) の
         * 中央に ^ スタブを配置し、横線は列1・列5の中央（スタブ位置）で始終する
         */}
        <div
          className="col-start-1 col-span-5 row-start-2 pt-2"
          style={{
            display: "grid",
            gridTemplateColumns: "subgrid",
            gridTemplateRows: "auto auto",
          }}
        >
          {/* スタブ行: パネル列(1,3,5)の中央に ^ + | */}
          <div className="col-start-1 row-start-1 flex flex-col items-center">
            <ChevronUp className="w-3 h-3 text-[var(--color-text-muted)]" />
            <div className="w-px h-4 bg-[var(--color-border)]" />
          </div>
          <div className="col-start-2 row-start-1" />
          <div className="col-start-3 row-start-1 flex flex-col items-center">
            <ChevronUp className="w-3 h-3 text-[var(--color-text-muted)]" />
            <div className="w-px h-4 bg-[var(--color-border)]" />
          </div>
          <div className="col-start-4 row-start-1" />
          <div className="col-start-5 row-start-1 flex flex-col items-center">
            <div className="w-px h-7 bg-[var(--color-border)]" />
          </div>

          {/* 横線 + ラベル: subgrid の列境界に沿い、両端は列1・列5の中央（スタブ） */}
          <div className="col-start-1 row-start-2 flex items-center justify-end">
            <div className="h-px w-1/2 bg-[var(--color-border)]" />
          </div>
          <div className="col-start-2 row-start-2 flex items-center">
            <div className="h-px w-full min-h-px bg-[var(--color-border)]" />
          </div>
          <div className="col-start-3 row-start-2 flex items-center justify-center px-2">
            <span className="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
              git pull
            </span>
          </div>
          <div className="col-start-4 row-start-2 flex items-center">
            <div className="h-px w-full min-h-px bg-[var(--color-border)]" />
          </div>
          <div className="col-start-5 row-start-2 flex items-center justify-start">
            <div className="h-px w-1/2 bg-[var(--color-border)]" />
          </div>
        </div>

      </div>
    </div>
  );
}
