"use client";

import { useEffect, useRef } from "react";
import { useRepositoryStore } from "@/lib/store/useRepositoryStore";
import { parseGitState } from "@/features/git-parser/parseGitState";
import { diffGitState } from "@/features/git-parser/diffGitState";
import type { AnimationEvent } from "@/features/git-parser/diffGitState";

const POLL_INTERVAL = 1000;
const ERROR_THRESHOLD = 3;

interface UseGitPollerOptions {
  onAnimationEvents?: (events: AnimationEvent[]) => void;
}

export function useGitPoller({ onAnimationEvents }: UseGitPollerOptions = {}) {
  const handle = useRepositoryStore((s) => s.handle);
  const setGitState = useRepositoryStore((s) => s.setGitState);
  const setLoading = useRepositoryStore((s) => s.setLoading);
  const setError = useRepositoryStore((s) => s.setError);
  const prevStateRef = useRef(useRepositoryStore.getState().gitState);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!handle) return;

    setLoading(true);

    const poll = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        const next = await parseGitState(handle);
        const prev = prevStateRef.current;

        if (prev && onAnimationEvents) {
          const events = diffGitState(prev, next);
          if (events.length > 0) onAnimationEvents(events);
        }

        prevStateRef.current = next;
        setGitState(next);
        errorCountRef.current = 0;
      } catch {
        errorCountRef.current += 1;
        if (errorCountRef.current >= ERROR_THRESHOLD) {
          setError(true);
        }
        // silently retry on transient failures
      }
    };

    // initial fetch
    poll();

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [handle, setGitState, setLoading, setError, onAnimationEvents]);
}
