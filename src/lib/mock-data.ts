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
}

export const MOCK_WORKING_TREE: FileStatus[] = [
  { filepath: "src/index.ts", status: "modified" },
  { filepath: "README.md", status: "modified" },
  { filepath: "src/utils/helper.ts", status: "added" },
  { filepath: "src/old-file.ts", status: "deleted" },
];

export const MOCK_STAGING: FileStatus[] = [
  { filepath: "src/components/Button.tsx", status: "added" },
  { filepath: "src/styles/main.css", status: "modified" },
];

// Branching history:
//   G (merge) ─── E (main hotfix)
//   │              │
//   └── F ── D ───┘ (feat/login branches from C)
//              C
//              B
//              A
export const MOCK_COMMITS: CommitNode[] = [
  {
    oid: "g7a8b9c0d1e2f34",
    message: "Merge: feat/login を main にマージ",
    parents: ["e5a6b7c8d9e0f12", "f6b7c8d9e0a1b23"],
    timestamp: 1700100000,
  },
  {
    oid: "f6b7c8d9e0a1b23",
    message: "feat: ログインUI完成",
    parents: ["d4e5f6a7b8c9d01"],
    timestamp: 1700080000,
  },
  {
    oid: "e5a6b7c8d9e0f12",
    message: "fix: セキュリティパッチ適用",
    parents: ["c3d4e5f6a7b8c90"],
    timestamp: 1700060000,
  },
  {
    oid: "d4e5f6a7b8c9d01",
    message: "feat: ログインフォーム実装",
    parents: ["c3d4e5f6a7b8c90"],
    timestamp: 1700040000,
  },
  {
    oid: "c3d4e5f6a7b8c90",
    message: "feat: 認証基盤セットアップ",
    parents: ["b2c3d4e5f6a7b89"],
    timestamp: 1700020000,
  },
  {
    oid: "b2c3d4e5f6a7b89",
    message: "chore: 依存関係更新",
    parents: ["a1b2c3d4e5f6789"],
    timestamp: 1700000000,
  },
  {
    oid: "a1b2c3d4e5f6789",
    message: "feat: 初期コミット",
    parents: [],
    timestamp: 1699900000,
  },
];

export const MOCK_BRANCHES: BranchRef[] = [
  { name: "main", oid: "g7a8b9c0d1e2f34" },
  { name: "feat/login", oid: "f6b7c8d9e0a1b23" },
];

export const MOCK_REMOTE_REFS: BranchRef[] = [
  { name: "origin/main", oid: "e5a6b7c8d9e0f12" },
];

export const MOCK_REMOTE_BRANCH: BranchRef[] = [
  { name: "main", oid: "e5a6b7c8d9e0f12" },
];

export const MOCK_HEAD = "main";

export const MOCK_GIT_STATE: GitState = {
  workingTree: MOCK_WORKING_TREE,
  stagingArea: MOCK_STAGING,
  commits: MOCK_COMMITS,
  branches: MOCK_BRANCHES,
  remoteRefs: MOCK_REMOTE_REFS,
  head: MOCK_HEAD,
};
