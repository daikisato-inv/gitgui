"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRepositoryStore } from "@/lib/store/useRepositoryStore";
import { useGitPoller } from "@/features/repository/hooks/useGitPoller";
import { AppHeader } from "@/features/header/components/AppHeader";
import { VisualizerLayout } from "@/features/visualizer/components/VisualizerLayout";
import { useAnimationQueue } from "@/features/visualizer/hooks/useAnimationQueue";
import type { AnimationEvent } from "@/features/git-parser/diffGitState";

export default function VisualizerPage() {
  const router = useRouter();
  const handle = useRepositoryStore((s) => s.handle);
  const gitState = useRepositoryStore((s) => s.gitState);
  const isLoading = useRepositoryStore((s) => s.isLoading);
  const isError = useRepositoryStore((s) => s.isError);

  const { enqueue } = useAnimationQueue();

  const handleAnimationEvents = useCallback(
    (events: AnimationEvent[]) => {
      enqueue(events);
    },
    [enqueue]
  );

  useGitPoller({ onAnimationEvents: handleAnimationEvents });

  useEffect(() => {
    if (!handle) router.replace("/");
  }, [handle, router]);

  if (!handle) return null;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-subtle)] overflow-hidden">
      <AppHeader repoName={handle.name} />
      <div className="flex-1 overflow-hidden">
        <VisualizerLayout
          gitState={gitState}
          isLoading={isLoading && !gitState}
          isError={isError}
        />
      </div>
    </div>
  );
}
