"use client";

import { useCallback, useRef, useState } from "react";
import type { AnimationEvent } from "@/features/git-parser/diffGitState";

export interface AnimationState {
  activeEvents: AnimationEvent[];
}

export function useAnimationQueue() {
  const [activeEvents, setActiveEvents] = useState<AnimationEvent[]>([]);
  const queueRef = useRef<AnimationEvent[][]>([]);
  const isRunningRef = useRef(false);

  const runNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      isRunningRef.current = false;
      setActiveEvents([]);
      return;
    }
    setActiveEvents(next);
    // each batch plays for 350ms then clears
    setTimeout(() => {
      setActiveEvents([]);
      setTimeout(runNext, 50);
    }, 350);
  }, []);

  const enqueue = useCallback(
    (events: AnimationEvent[]) => {
      queueRef.current.push(events);
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        runNext();
      }
    },
    [runNext]
  );

  return { activeEvents, enqueue };
}
