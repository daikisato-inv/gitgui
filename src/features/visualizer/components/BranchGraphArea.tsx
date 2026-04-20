"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import type { CommitNode, BranchRef } from "@/lib/types/git";

interface BranchGraphAreaProps {
  title: string;
  commits: CommitNode[];
  branches: BranchRef[];
  headOid?: string;
  headBranchName?: string;
  indicator?: { label: string; variant: "info" | "warning" };
  isLoading?: boolean;
  isError?: boolean;
  noRemote?: boolean;
}

const NODE_RADIUS = 7;
const NODE_SPACING = 52;
const LANE_WIDTH = 22;
const FIRST_LANE_X = 14;
const LABEL_GAP = 12;

const LANE_COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

function getLaneColor(lane: number): string {
  return LANE_COLORS[lane % LANE_COLORS.length] ?? LANE_COLORS[0]!;
}

// Topological lane assignment (children before parents)
function assignLanes(commits: CommitNode[]): Map<string, number> {
  const laneMap = new Map<string, number>();
  // activeLanes[i] = oid that lane i is currently tracking toward
  const activeLanes: (string | null)[] = [];

  for (const commit of commits) {
    let lane = activeLanes.indexOf(commit.oid);

    if (lane === -1) {
      lane = activeLanes.indexOf(null);
      if (lane === -1) {
        lane = activeLanes.length;
        activeLanes.push(null);
      }
    }

    laneMap.set(commit.oid, lane);

    // Clear every lane that was waiting for this commit (convergence)
    for (let i = 0; i < activeLanes.length; i++) {
      if (activeLanes[i] === commit.oid) activeLanes[i] = null;
    }

    if (commit.parents.length > 0) {
      // First parent continues in this lane
      activeLanes[lane] = commit.parents[0]!;

      // Extra parents (merge) claim a free lane if not yet tracked
      for (let i = 1; i < commit.parents.length; i++) {
        const p = commit.parents[i]!;
        if (!activeLanes.includes(p)) {
          const free = activeLanes.indexOf(null);
          if (free !== -1) {
            activeLanes[free] = p;
          } else {
            activeLanes.push(p);
          }
        }
      }
    }
  }

  return laneMap;
}

function buildLayout(
  commits: CommitNode[],
  branches: BranchRef[],
  headBranchName?: string
) {
  const oidToIndex = new Map<string, number>();
  commits.forEach((c, i) => oidToIndex.set(c.oid, i));

  const laneMap = assignLanes(commits);
  const maxLane = commits.length > 0 ? Math.max(...laneMap.values()) : 0;

  const nodes = commits.map((c, i) => {
    const lane = laneMap.get(c.oid) ?? 0;
    return {
      ...c,
      x: FIRST_LANE_X + lane * LANE_WIDTH,
      y: NODE_SPACING / 2 + i * NODE_SPACING,
      lane,
    };
  });

  const labelX = FIRST_LANE_X + (maxLane + 1) * LANE_WIDTH + LABEL_GAP;

  const edges = nodes.flatMap((node) =>
    node.parents
      .map((parentOid) => {
        const parentIdx = oidToIndex.get(parentOid);
        if (parentIdx === undefined) return null;
        return {
          x1: node.x,
          y1: node.y,
          x2: nodes[parentIdx]!.x,
          y2: nodes[parentIdx]!.y,
          lane: node.lane,
        };
      })
      .filter((e) => e !== null)
  ) as { x1: number; y1: number; x2: number; y2: number; lane: number }[];

  // Count how many branches point to each oid (excluding origin/HEAD)
  const oidCount = new Map<string, number>();
  for (const b of branches) {
    if (b.name === "origin/HEAD") continue;
    oidCount.set(b.oid, (oidCount.get(b.oid) ?? 0) + 1);
  }

  const branchLabels = branches
    .filter((b) => b.name !== "origin/HEAD")
    .map((b) => {
      const idx = oidToIndex.get(b.oid);
      if (idx === undefined) return null;
      // Hide branches that share a commit with another branch,
      // unless this branch is the currently checked-out branch.
      const isUnique = (oidCount.get(b.oid) ?? 0) <= 1;
      const isHeadBranch = !!headBranchName && b.name === headBranchName;
      if (!isUnique && !isHeadBranch) return null;
      return { name: b.name, y: nodes[idx]!.y };
    })
    .filter((b): b is { name: string; y: number } => b !== null);

  const svgHeight = commits.length * NODE_SPACING + NODE_SPACING / 2;
  const svgWidth = labelX + 130;

  return { nodes, edges, branchLabels, svgHeight, svgWidth, labelX };
}

// Q-curve for cross-lane edges, straight line for same-lane
function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  if (x1 === x2) return `M${x1},${y1} L${x2},${y2}`;
  return `M${x1},${y1} Q${x1},${y2} ${x2},${y2}`;
}

interface TooltipState {
  x: number;
  y: number;
  message: string;
  oid: string;
}

export function BranchGraphArea({
  title,
  commits,
  branches,
  headOid,
  headBranchName,
  indicator,
  isLoading,
  isError,
  noRemote,
}: BranchGraphAreaProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const { nodes, edges, branchLabels, svgHeight, svgWidth, labelX } =
    buildLayout(commits, branches, headBranchName);

  // track previously seen oids to detect newly added nodes
  const seenOidsRef = useRef(new Set<string>());
  const newOids = new Set<string>();
  for (const node of nodes) {
    if (!seenOidsRef.current.has(node.oid)) newOids.add(node.oid);
  }
  for (const node of nodes) seenOidsRef.current.add(node.oid);

  return (
    <div className="flex flex-col h-full min-w-[220px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </span>
        {indicator && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium ${
              indicator.variant === "info"
                ? "bg-[var(--color-info-bg)] text-[var(--color-info)]"
                : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
            }`}
          >
            {indicator.label}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 relative">
        {isLoading && (
          <div className="flex flex-col gap-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[var(--color-bg-muted)] animate-pulse" />
                <div className="h-3 flex-1 rounded bg-[var(--color-bg-muted)] animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-full p-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-3 text-center">
              <p className="text-sm text-[var(--color-danger)]">
                読み取りに失敗しました
              </p>
            </div>
          </div>
        )}

        {noRemote && !isLoading && !isError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--color-text-muted)] text-center">
              リモートが設定されていません
            </p>
          </div>
        )}

        {!isLoading && !isError && !noRemote && commits.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--color-text-muted)]">
              コミットがありません
            </p>
          </div>
        )}

        {!isLoading && !isError && !noRemote && commits.length > 0 && (
          <div className="relative">
            <svg
              width={svgWidth}
              height={svgHeight}
              className="overflow-visible"
              onMouseLeave={() => setTooltip(null)}
            >
              {edges.map((e, i) => (
                <path
                  key={i}
                  d={edgePath(e.x1, e.y1, e.x2, e.y2)}
                  fill="none"
                  stroke={getLaneColor(e.lane)}
                  strokeWidth={2}
                  opacity={0.75}
                />
              ))}

              {nodes.map((node) => {
                const isHead = node.oid === headOid;
                const color = getLaneColor(node.lane);
                const isNew = newOids.has(node.oid);
                return (
                  <g key={node.oid}>
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_RADIUS}
                      fill={isHead ? color : "var(--color-bg)"}
                      stroke={color}
                      strokeWidth={2}
                      className="cursor-pointer"
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                      initial={isNew ? { scale: 0, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      onMouseEnter={() =>
                        setTooltip({
                          x: node.x + NODE_RADIUS + 4,
                          y: node.y - 12,
                          message: node.message,
                          oid: node.oid.slice(0, 7),
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {branchLabels
                      .filter((b) => Math.abs(b.y - node.y) < 1)
                      .map((b) => (
                        <text
                          key={b.name}
                          x={labelX}
                          y={node.y + 4}
                          fontSize={11}
                          fill="var(--color-text-secondary)"
                          className="font-mono"
                        >
                          {b.name}
                        </text>
                      ))}
                  </g>
                );
              })}
            </svg>

            {tooltip && (
              <div
                className="absolute z-10 pointer-events-none px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-md text-xs"
                style={{ left: tooltip.x + 16, top: tooltip.y }}
              >
                <p className="font-medium text-[var(--color-text-primary)] max-w-[180px] break-words">
                  {tooltip.message}
                </p>
                <p className="text-[var(--color-text-muted)] font-mono mt-0.5">
                  {tooltip.oid}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
