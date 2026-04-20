# build-visualizer エージェント

## 役割

`features/visualizer/` を完成させる。モックで確認済みのUIコンポーネントを実データ対応に仕上げ、Framer Motion アニメーションを実装する。

---

## 前提

- `build-repository` + `build-git-parser` 完了済み
- モック実装（Phase 2確認済み）が以下に存在する:
  - `src/features/visualizer/components/VisualizerLayout.tsx`
  - `src/features/visualizer/components/BranchGraphArea.tsx`（レーン割り当てアルゴリズム実装済み）
  - `src/features/visualizer/components/WorkingTreeArea.tsx`
  - `src/features/visualizer/components/StagingArea.tsx`
  - `src/features/visualizer/components/FileBlock.tsx`
  - `src/lib/mock-data.ts`

---

## Phase B-3: 実データ統合（モックを外す）

### `app/visualizer/page.tsx` の更新

```tsx
'use client';
// MOCK_GIT_STATE を削除
// useRepositoryStore から gitState を取得
// handle が null なら redirect('/') する
```

### `VisualizerLayout.tsx` の更新

- `gitState` を props から受け取る（型を `GitState | null` に）
- `localAhead` をハードコードではなく commits/remoteRefs の差分から計算

---

## Phase C: アニメーション実装

### `useAnimationQueue.ts`

```typescript
// features/visualizer/hooks/useAnimationQueue.ts
export function useAnimationQueue() {
  const [queue, setQueue] = useState<AnimationEvent[]>([]);
  const isAnimating = useRef(false);

  // アニメーション中は次のポーリング結果を保留
  // キューが空になったら isAnimating = false
}
```

### FileBlock アニメーション（`FileBlock.tsx`）

Framer Motion の `motion.div` を使用:
- 出現: `initial={{ opacity: 0, y: -8 }}` → `animate={{ opacity: 1, y: 0 }}`
- 消滅: `exit={{ opacity: 0, y: 8 }}`
- duration: 200ms、easing: `easeInOut`
- `AnimatePresence` でラップ（親の WorkingTreeArea / StagingArea）

### git add アニメーション（WT → Stg）

`AnimationEvent: { type: 'file-to-staging' }` 検出時:
1. WT のファイルブロックに `layoutId={filepath}` を付与
2. Stg のファイルブロックにも同じ `layoutId` を付与
3. Framer Motion の共有レイアウトアニメーションが自動で横スライド移動を生成

```tsx
// WorkingTreeArea と StagingArea で同じ layoutId を使う
<motion.div layoutId={`file-${file.filepath}`}>
  <FileBlock file={file} />
</motion.div>
```

### git commit アニメーション（Stg → LB）

`AnimationEvent: { type: 'commit-created' }` 検出時:
- Stg のブロック全体: `exit={{ opacity: 0, scale: 0.8, y: -20 }}`
- BranchGraphArea の新ノード: `initial={{ scale: 0 }}` → `animate={{ scale: 1 }}`
- duration: 300ms

### git push アニメーション（LB → RT）

`AnimationEvent: { type: 'push' }` 検出時:
- RT の新ノードが `initial={{ x: -30, opacity: 0 }}` → `animate={{ x: 0, opacity: 1 }}`

### git fetch アニメーション（RT 更新）

`AnimationEvent: { type: 'fetch' }` 検出時:
- RT の新ノードが `initial={{ scale: 0 }}` → `animate={{ scale: 1 }}`

---

## DAG の実データ対応確認

`BranchGraphArea.tsx` はすでにレーン割り当てアルゴリズム実装済み（Phase 2）。
以下だけ確認・調整する:

- `headOid` の計算: `branches.find(b => b.name === head)?.oid`
- Remote Tracking の `headOid`: `remoteRefs.find(b => b.name === 'origin/main')?.oid`
- ブランチラベルの重複排除（同一 oid に複数ブランチが指している場合）

---

## VisualizerLayout の先行/遅延カウント計算

```typescript
// localAhead: remoteRefs に存在しないコミット数
const remoteOids = new Set(remoteRefs.map(r => r.oid));
const localAhead = commits.filter(c => !remoteOids.has(c.oid)).length;
// 厳密には graph walk が必要だが、シンプルな差分で MVP は十分
```

---

## `src/app/visualizer/page.tsx` 最終形

```tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRepositoryStore } from '@/lib/store/useRepositoryStore';
import { AppHeader } from '@/features/header/components/AppHeader';
import { VisualizerLayout } from '@/features/visualizer/components/VisualizerLayout';
import { useGitPoller } from '@/features/repository/hooks/useGitPoller';

export default function VisualizerPage() {
  const router = useRouter();
  const { handle, gitState, isLoading, isError } = useRepositoryStore();

  useGitPoller();

  useEffect(() => {
    if (!handle) router.replace('/');
  }, [handle, router]);

  if (!handle) return null;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-subtle)] overflow-hidden">
      <AppHeader repoName={handle.name} />
      <div className="flex-1 overflow-hidden">
        <VisualizerLayout gitState={gitState} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
```

---

## 完了条件

- [ ] 実際の git リポジトリを開いて 5 エリアが実データで表示される
- [ ] `git add <file>` → 1 秒以内に WT→Stg にファイルが移動（アニメーション付き）
- [ ] `git commit` → Stg が空に、LB に新ノードがスケールイン
- [ ] `git push` → RT が LB に追いつく（左スライドイン）
- [ ] コミットノードホバーでツールチップ表示
- [ ] ページリロードで `/` にリダイレクト
- [ ] `npx tsc --noEmit` エラー 0件
- [ ] `npm run build` 成功（`output: 'export'`）
