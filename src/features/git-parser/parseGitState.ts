import git from "isomorphic-git";
import { BrowserFsAdapter } from "./lib/BrowserFsAdapter";
import type { GitState, FileStatus, CommitNode, BranchRef } from "@/lib/types/git";

const DIR = "/";

export async function parseGitState(
  handle: FileSystemDirectoryHandle
): Promise<GitState> {
  const fs = new BrowserFsAdapter(handle);

  const [workingTree, stagingArea] = await parseStatus(fs);
  const branches = await parseBranches(fs);
  const remoteRefs = await parseRemoteRefs(fs);
  const commits = await parseCommits(fs, branches, remoteRefs);
  const head = await parseHead(fs);
  const remoteUrl = await parseRemoteUrl(fs);

  return { workingTree, stagingArea, commits, branches, remoteRefs, head, remoteUrl };
}

async function parseStatus(
  fs: BrowserFsAdapter
): Promise<[FileStatus[], FileStatus[]]> {
  try {
    const matrix = await git.statusMatrix({ fs, dir: DIR });
    const wt: FileStatus[] = [];
    const stg: FileStatus[] = [];

    for (const [filepath, head, workdir, stage] of matrix) {
      if (typeof filepath !== "string") continue;

      // --- Staging area ---
      // stage=2: identical to workdir (staged)
      // stage=3: different from both HEAD and workdir (e.g. git add -p then re-edited)
      if (stage === 2 || stage === 3) {
        stg.push({ filepath, status: head === 0 ? "added" : "modified" });
      } else if (stage === 0 && head === 1) {
        // deleted from index (git rm)
        stg.push({ filepath, status: "deleted" });
      }

      // --- Working tree ---
      // workdir=2: file exists but differs from HEAD
      // workdir=0 && head=1 && stage=1: file deleted from disk, not yet staged
      if (workdir === 2 && stage === 1) {
        // modified, not staged
        wt.push({ filepath, status: "modified" });
      } else if (workdir === 2 && stage === 3) {
        // staged + additionally modified in workdir
        wt.push({ filepath, status: "modified" });
      } else if (workdir === 2 && head === 0 && stage === 0) {
        // new file not yet staged
        wt.push({ filepath, status: "added" });
      } else if (workdir === 0 && head === 1 && stage === 1) {
        // deleted from disk, not staged
        wt.push({ filepath, status: "deleted" });
      }
    }

    return [wt, stg];
  } catch {
    return [[], []];
  }
}

async function parseBranches(fs: BrowserFsAdapter): Promise<BranchRef[]> {
  try {
    const names = await git.listBranches({ fs, dir: DIR });
    const refs = await Promise.all(
      names.map(async (name) => {
        try {
          const oid = await git.resolveRef({ fs, dir: DIR, ref: name });
          return { name, oid };
        } catch {
          return null;
        }
      })
    );
    return refs.filter((r): r is BranchRef => r !== null);
  } catch {
    return [];
  }
}

async function parseRemoteRefs(fs: BrowserFsAdapter): Promise<BranchRef[]> {
  try {
    const names = await git.listBranches({ fs, dir: DIR, remote: "origin" });
    const refs = await Promise.all(
      names.map(async (name) => {
        try {
          const oid = await git.resolveRef({
            fs,
            dir: DIR,
            ref: `origin/${name}`,
          });
          return { name: `origin/${name}`, oid };
        } catch {
          return null;
        }
      })
    );
    return refs.filter((r): r is BranchRef => r !== null);
  } catch {
    return [];
  }
}

async function parseCommits(
  fs: BrowserFsAdapter,
  branches: BranchRef[],
  remoteRefs: BranchRef[]
): Promise<CommitNode[]> {
  const seen = new Set<string>();
  const nodes: CommitNode[] = [];
  const allRefs = [...branches, ...remoteRefs];

  await Promise.all(
    allRefs.map(async ({ oid }) => {
      try {
        const log = await git.log({ fs, dir: DIR, ref: oid, depth: 200 });
        for (const entry of log) {
          if (seen.has(entry.oid)) continue;
          seen.add(entry.oid);
          nodes.push({
            oid: entry.oid,
            message: entry.commit.message.split("\n")[0] ?? "",
            parents: entry.commit.parent,
            timestamp: entry.commit.author.timestamp,
          });
        }
      } catch {
        // branch may have no commits yet
      }
    })
  );

  nodes.sort((a, b) => b.timestamp - a.timestamp);
  return nodes;
}

async function parseHead(fs: BrowserFsAdapter): Promise<string> {
  try {
    return await git.currentBranch({ fs, dir: DIR }) ?? "HEAD";
  } catch {
    return "HEAD";
  }
}

async function parseRemoteUrl(fs: BrowserFsAdapter): Promise<string | undefined> {
  try {
    const url = await git.getConfig({ fs, dir: DIR, path: "remote.origin.url" });
    return typeof url === "string" ? url : undefined;
  } catch {
    return undefined;
  }
}
