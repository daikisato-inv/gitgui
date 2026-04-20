"use client";

import { motion } from "framer-motion";
import type { FileStatus } from "@/lib/types/git";

const statusConfig = {
  added: { label: "added", style: "bg-[var(--color-success-bg)] text-[var(--color-success)]" },
  modified: { label: "modified", style: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]" },
  deleted: { label: "deleted", style: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]" },
  untracked: { label: "untracked", style: "bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]" },
} as const;

interface FileBlockProps {
  file: FileStatus;
  layoutId?: string;
}

export function FileBlock({ file, layoutId }: FileBlockProps) {
  const config = statusConfig[file.status];
  const filename = file.filepath.split("/").pop() ?? file.filepath;

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-subtle)] transition-colors duration-150"
    >
      <span
        className="text-sm text-[var(--color-text-primary)] font-mono truncate"
        title={file.filepath}
      >
        {filename}
      </span>
      <span
        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium ${config.style}`}
      >
        {config.label}
      </span>
    </motion.div>
  );
}
