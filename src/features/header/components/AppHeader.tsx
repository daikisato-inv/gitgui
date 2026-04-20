"use client";

import { useRouter } from "next/navigation";
import { FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRepositoryStore } from "@/lib/store/useRepositoryStore";

interface AppHeaderProps {
  repoName: string;
}

export function AppHeader({ repoName }: AppHeaderProps) {
  const router = useRouter();
  const clearHandle = useRepositoryStore((s) => s.clearHandle);

  const handleOpenOther = () => {
    clearHandle();
    router.push("/");
  };

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-bg)] shrink-0">
      <div className="flex items-center gap-2">
        <FolderGit2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">gitGUI</span>
        <span className="text-[var(--color-text-muted)]">/</span>
        <span className="text-sm text-[var(--color-text-secondary)] font-mono">{repoName}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenOther}
        className="text-xs"
      >
        別のリポジトリを開く
      </Button>
    </header>
  );
}
