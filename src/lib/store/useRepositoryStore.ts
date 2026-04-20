"use client";

import { create } from "zustand";
import type { GitState } from "@/lib/types/git";

interface RepositoryStore {
  handle: FileSystemDirectoryHandle | null;
  gitState: GitState | null;
  isLoading: boolean;
  isError: boolean;
  setHandle: (handle: FileSystemDirectoryHandle) => void;
  setGitState: (state: GitState) => void;
  setLoading: (v: boolean) => void;
  setError: (v: boolean) => void;
  clearHandle: () => void;
}

export const useRepositoryStore = create<RepositoryStore>((set) => ({
  handle: null,
  gitState: null,
  isLoading: false,
  isError: false,
  setHandle: (handle) => set({ handle, isError: false }),
  setGitState: (gitState) => set({ gitState, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (isError) => set({ isError }),
  clearHandle: () => set({ handle: null, gitState: null, isLoading: false, isError: false }),
}));
