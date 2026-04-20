# SCRATCHPAD — gitGUI Phase 4 自律実装

## 進捗

### Phase A: 基盤 ✅
- [x] output: 'export' + webpack fallback
- [x] ブランドカラー #6366f1 更新
- [x] src/lib/types/git.ts 作成
- [x] src/types/global.d.ts（showDirectoryPicker / FileSystemDirectoryHandle.keys）
- [x] Google Fonts → system-ui フォールバック（SSL 証明書エラー回避）
- [x] lightningcss-darwin-arm64 インストール（ネイティブバイナリ欠損修正）

### Phase B-1: build-repository ✅
- [x] src/lib/store/useRepositoryStore.ts
- [x] src/features/repository/components/OpenRepositoryButton.tsx
- [x] src/features/repository/hooks/useGitPoller.ts
- [x] app/page.tsx 更新（OpenRepositoryButton 統合、ブラウザ非対応バナー）
- [x] AppHeader 更新（'use client' + clearHandle + router.push('/')）

### Phase B-2: build-git-parser ✅
- [x] src/features/git-parser/lib/BrowserFsAdapter.ts
- [x] src/features/git-parser/parseGitState.ts
- [x] src/features/git-parser/diffGitState.ts

### Phase B-3: build-visualizer（実データ統合）✅
- [x] app/visualizer/page.tsx → store から取得 + useGitPoller 呼び出し
- [x] VisualizerLayout.tsx → localAhead 計算
- [x] 全コンポーネントの import を @/lib/types/git に更新

### Phase C: アニメーション ✅
- [x] src/features/visualizer/hooks/useAnimationQueue.ts
- [x] FileBlock.tsx に motion.div + AnimatePresence
- [x] WorkingTreeArea / StagingArea に AnimatePresence + layoutId
- [x] BranchGraphArea に motion.circle（新ノードスケールイン）

## 品質確認
- [x] npx tsc --noEmit → 0 エラー
- [x] npm run lint → 0 エラー
- [x] npm run build → 成功（output: 'export'）

## 次: QA
実際の git リポジトリを Chrome で開いて全機能を検証する。
