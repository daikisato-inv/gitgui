# build-repository エージェント

## 役割

`features/repository/` を実装する。File System Access API でリポジトリを開き、Zustand store に保持し、1秒ポーリングで GitState を更新し続ける機能。

---

## 前提

- scaffolder が完了済み（Next.js・Tailwind・shadcn/ui セットアップ済み）
- `build-git-parser` はまだ動いていない（`parseGitState` はスタブで OK）

---

## 実装対象ファイル

```
src/
├── lib/
│   ├── types/
│   │   └── git.ts              # GitState / FileStatus / CommitNode / BranchRef 型定義
│   └── store/
│       └── useRepositoryStore.ts  # Zustand store
└── features/
    ├── repository/
    │   ├── components/
    │   │   └── OpenRepositoryButton.tsx   # File System Access API ボタン
    │   ├── hooks/
    │   │   ├── useRepositoryHandle.ts     # handle 取得ロジック
    │   │   └── useGitPoller.ts            # 1秒ポーリング
    │   └── types.ts
    └── header/
        └── components/
            └── AppHeader.tsx              # 「別のリポジトリを開く」ボタン統合
```

---

## 型定義（`src/lib/types/git.ts`）

```typescript
export interface FileStatus {
  filepath: string;
  status: 'added' | 'modified' | 'deleted' | 'untracked';
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
```

---

## Zustand store（`useRepositoryStore.ts`）

```typescript
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
```

---

## OpenRepositoryButton 仕様

1. `window.showDirectoryPicker()` を呼び出す
2. 取得した `FileSystemDirectoryHandle` で `.git/` エントリの存在チェック
   - 存在する → `setHandle()` して `router.push('/visualizer')`
   - 存在しない → `toast.error('Git リポジトリではありません...')`
   - ユーザーキャンセル（AbortError）→ 何もしない
3. `window.showDirectoryPicker` が undefined → ボタンを disabled にしてバナー表示

---

## useGitPoller 仕様

- `handle` が null なら何もしない
- `setInterval(1000)` で `parseGitState(handle)` を呼び出す
- `document.visibilityState === 'hidden'` なら実行スキップ
- パース失敗時: エラーを無視して次のサイクルで再試行（`setError(false)` は呼ばない）
- ポーリング中はエラーが3回連続したら `setError(true)`
- cleanup で `clearInterval`

**スタブ実装（build-git-parser 完了前）**:
```typescript
// parseGitState.ts のスタブ
export async function parseGitState(_handle: FileSystemDirectoryHandle): Promise<GitState> {
  return { workingTree: [], stagingArea: [], commits: [], branches: [], remoteRefs: [], head: '' };
}
```

---

## ウェルカム画面（`app/page.tsx`）との統合

- `OpenRepositoryButton` を中央に配置
- ブラウザ非対応時のバナー（`window.showDirectoryPicker` チェック）
- デザイン: @docs/DESIGN_SYSTEM.md のトークンを使用

---

## 完了条件

- [ ] `npm run build` が成功する
- [ ] `/` で「リポジトリを開く」ボタンが表示される
- [ ] Chrome でクリックするとフォルダ選択ダイアログが開く
- [ ] git リポジトリでないフォルダ選択でエラートーストが出る
- [ ] 有効なリポジトリ選択で `/visualizer` に遷移する
- [ ] `npx tsc --noEmit` エラー 0件
