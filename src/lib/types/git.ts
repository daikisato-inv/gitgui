export interface FileStatus {
  filepath: string;
  status: "added" | "modified" | "deleted" | "untracked";
}

export interface CommitNode {
  oid: string;
  message: string;
  parents: string[];
  timestamp: number;
}

export interface BranchRef {
  name: string;
  oid: string;
}

export interface GitState {
  workingTree: FileStatus[];
  stagingArea: FileStatus[];
  commits: CommitNode[];
  branches: BranchRef[];
  remoteRefs: BranchRef[];
  head: string;
  remoteUrl?: string;
}
