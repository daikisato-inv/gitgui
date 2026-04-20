import type { GitState } from "@/lib/types/git";

export type AnimationEvent =
  | { type: "file-to-staging"; filepath: string }
  | { type: "file-from-staging"; filepath: string }
  | { type: "commit-created"; oid: string }
  | { type: "push"; oids: string[] }
  | { type: "fetch"; oids: string[] };

export function diffGitState(
  prev: GitState,
  next: GitState
): AnimationEvent[] {
  const events: AnimationEvent[] = [];

  const prevWtPaths = new Set(prev.workingTree.map((f) => f.filepath));
  const prevStgPaths = new Set(prev.stagingArea.map((f) => f.filepath));
  const nextStgPaths = new Set(next.stagingArea.map((f) => f.filepath));
  const nextWtPaths = new Set(next.workingTree.map((f) => f.filepath));

  // file-to-staging: was in WT, now in staging
  for (const f of next.stagingArea) {
    if (prevWtPaths.has(f.filepath) && !prevStgPaths.has(f.filepath)) {
      events.push({ type: "file-to-staging", filepath: f.filepath });
    }
  }

  // file-from-staging: was in staging, now back in WT
  for (const f of next.workingTree) {
    if (prevStgPaths.has(f.filepath) && !nextStgPaths.has(f.filepath) && nextWtPaths.has(f.filepath)) {
      events.push({ type: "file-from-staging", filepath: f.filepath });
    }
  }

  // commit-created: HEAD moved
  const prevHead = prev.commits[0]?.oid;
  const nextHead = next.commits[0]?.oid;
  if (nextHead && nextHead !== prevHead) {
    events.push({ type: "commit-created", oid: nextHead });
  }

  // push: new oids appeared in remoteRefs
  const prevRemoteOids = new Set(prev.remoteRefs.map((r) => r.oid));
  const pushedOids = next.remoteRefs
    .map((r) => r.oid)
    .filter((oid) => !prevRemoteOids.has(oid));
  if (pushedOids.length > 0) {
    events.push({ type: "push", oids: pushedOids });
  }

  // fetch: remote oids changed (but not just push — HEAD didn't move)
  const nextRemoteOids = new Set(next.remoteRefs.map((r) => r.oid));
  const fetchedOids = [...nextRemoteOids].filter((oid) => !prevRemoteOids.has(oid));
  if (fetchedOids.length > 0 && pushedOids.length === 0) {
    events.push({ type: "fetch", oids: fetchedOids });
  }

  return events;
}
