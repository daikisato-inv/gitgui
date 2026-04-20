# build-git-parser エージェント

## 役割

`features/git-parser/` を実装する。isomorphic-git を使ってブラウザ内で `.git/` をパースし、`GitState` を返す。前後の状態差分からアニメーション指示を生成する。

---

## 前提

- `build-repository` 完了済み（`GitState` 型・`useRepositoryStore` が存在する）
- isomorphic-git・lightning-fs がインストール済み

---

## 実装対象ファイル

```
src/features/git-parser/
├── parseGitState.ts      # isomorphic-git → GitState 変換
└── diffGitState.ts       # 前後 GitState 比較 → アニメーション指示
```

---

## parseGitState.ts 実装仕様

### isomorphic-git の初期化

```typescript
import git from 'isomorphic-git';
import LightningFS from '@isomorphic-git/lightning-fs';

const fs = new LightningFS('gitgui-fs');

// FileSystemDirectoryHandle → lightning-fs に mount
// lightning-fs 0.6+ は mountPoint オプションで OPFS/FSAL をサポート
```

**注意**: `LightningFS` に `FileSystemDirectoryHandle` を渡す正確な API は
`@isomorphic-git/lightning-fs` のバージョンによって異なる。
`npm show @isomorphic-git/lightning-fs` でバージョン確認し、README の `mountPoint` or `fileSystemDirectoryHandle` オプションを参照すること。

### 取得ロジック

```typescript
export async function parseGitState(handle: FileSystemDirectoryHandle): Promise<GitState>
```

**Working Tree / Staging Area**（`git.statusMatrix`）:
```typescript
const matrix = await git.statusMatrix({ fs, dir: '/' });
// 各行: [filepath, headStatus, workdirStatus, stageStatus]
// workdir: 0=absent, 1=identical, 2=modified, 3=deleted
// stage: 0=absent, 1=identical, 2=modified, 3=deleted
```

ステータスマッピング:
| `headStatus, workdirStatus, stageStatus` | 意味 |
|---|---|
| `1, 2, 1` | WT modified（unstaged） |
| `0, 2, 0` | WT untracked |
| `1, 0, 1` | WT deleted（unstaged） |
| `0, 2, 2` | Staging added |
| `1, 2, 2` | Staging modified |
| `1, 0, 0` | Staging deleted |

**Commits**（全ブランチ）:
```typescript
const branches = await git.listBranches({ fs, dir: '/' });
// 各ブランチで git.log({ depth: 200 }) → CommitNode に変換
// 重複排除（Set<oid>）してタイムスタンプ降順ソート
```

**BranchRef**:
```typescript
// ローカルブランチ
await git.listBranches({ fs, dir: '/' })
// リモートブランチ
await git.listBranches({ fs, dir: '/', remote: 'origin' })
// HEAD
await git.resolveRef({ fs, dir: '/', ref: 'HEAD' })
```

---

## diffGitState.ts 実装仕様

```typescript
export type AnimationEvent =
  | { type: 'file-to-staging'; filepath: string }    // git add
  | { type: 'file-from-staging'; filepath: string }  // git restore --staged
  | { type: 'commit-created'; oid: string }          // git commit
  | { type: 'push'; oids: string[] }                 // git push
  | { type: 'fetch'; oids: string[] }                // git fetch

export function diffGitState(prev: GitState, next: GitState): AnimationEvent[]
```

検出ロジック:
- `file-to-staging`: `prev.workingTree` にあって `next.stagingArea` に出現したファイル
- `file-from-staging`: `prev.stagingArea` にあって `next.workingTree` に戻ったファイル
- `commit-created`: `next.commits[0]?.oid` が `prev.commits[0]?.oid` と異なる
- `push`: `next.remoteRefs` に `prev.remoteRefs` になかった oid が増えた
- `fetch`: `next.remoteRefs` の oid が `prev.remoteRefs` と異なる

---

## useGitPoller への組み込み

`build-repository` で書いたスタブを本実装に差し替える:

```typescript
// features/repository/hooks/useGitPoller.ts の parseGitState import を更新
import { parseGitState } from '@/features/git-parser/parseGitState';
```

---

## 完了条件

- [ ] 実際の git リポジトリ（このプロジェクト自体でも可）を開いて全エリアにデータが表示される
- [ ] WT のファイル数が `git status` の結果と一致する
- [ ] ブランチグラフに正しいコミット数が表示される
- [ ] `npx tsc --noEmit` エラー 0件
- [ ] `npm run build` 成功

---

## トラブルシューティング

- `LightningFS` の `fileSystemDirectoryHandle` オプションが効かない場合:  
  → `@isomorphic-git/lightning-fs` の GitHub Issues / CHANGELOG を確認  
  → 代替: `BrowserFS` または isomorphic-git の `http` プラグインで回避する方法を検討
- `statusMatrix` でファイルが取れない場合:  
  → `dir` パスが正しいか確認（LightningFS の mount point と一致しているか）
- コミットが取得できない場合:  
  → `git.log` の `ref` に各ブランチ名を明示的に渡す
