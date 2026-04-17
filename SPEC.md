# SPEC.md — gitGUI 仕様書

> このファイルを読んだ Claude Code が人間の助けなしに実装できるレベルの詳細を記載する。

---

## 概要

**プロダクト名**: gitGUI  
**解決する課題**: Git を学び始めた開発者がコマンドと内部状態の対応を理解できない問題を、5つのエリア（Working Tree / Staging Area / Local Branch / Remote Tracking Branch / Remote Branch）をリアルタイムにアニメーション付きで可視化することで解決する。  
**ターゲットユーザー**: Git コマンドを打ち始めたばかりの初学者（エンジニア歴0〜1年）。「`git add` で何が起きているか」が直感的にわからない層。  
**動作環境**: Chrome / Edge のみ（File System Access API 依存）

---

## Tech Stack

- Next.js 15+ (App Router, `output: 'export'` でフル静的)
- TypeScript strict
- Tailwind CSS v4 + shadcn/ui
- `isomorphic-git` — ブラウザ内で `.git/` をパース
- `@isomorphic-git/lightning-fs` — isomorphic-git の仮想 FS（File System Access API と橋渡し）
- Framer Motion — ファイルブロックのアニメーション
- Vercel デプロイ（静的サイト）
- **Supabase / Auth なし**（完全フロントエンド）
- デザイン: @docs/DESIGN_SYSTEM.md のトークン使用
- アーキテクチャ: @docs/ARCHITECTURE.md に従う（Server Actions なし。全てクライアント）

---

## 画面一覧

| # | 画面名 | パス | 説明 |
|---|--------|------|------|
| 1 | ウェルカム | `/` | リポジトリを開くエントリポイント |
| 2 | ビジュアライザ | `/visualizer` | 5エリア可視化メイン画面（リポジトリ開いた後） |

---

## 画面仕様（詳細）

### 1. ウェルカム (`/`)

**表示要素**:
- [ ] 中央にプロダクト名「gitGUI」+ キャッチコピー（「Git の動きを、目で見て学ぶ」）
- [ ] 「リポジトリを開く」ボタン（CTA）
- [ ] Chrome / Edge 以外のブラウザでアクセスした場合は「このツールは Chrome または Edge でお使いください」バナーを表示（`window.showDirectoryPicker` の存在チェック）

**インタラクション**:
- [ ] 「リポジトリを開く」クリック → `window.showDirectoryPicker()` でフォルダ選択ダイアログを表示
  - 成功（`.git/` フォルダが存在する）: `FileSystemDirectoryHandle` をメモリ保持し `/visualizer` に遷移
  - 選択フォルダに `.git/` が存在しない: 「Git リポジトリではありません。`.git/` フォルダを含むフォルダを選択してください。」というエラートースト表示。画面遷移しない
  - ユーザーがキャンセル: 何もしない

---

### 2. ビジュアライザ (`/visualizer`)

**レイアウト**:
```
[ヘッダー: リポジトリ名 + 「別のリポジトリを開く」ボタン]
[メインエリア: 5つのエリアを左から右に横並び]
  [Working Tree] → [Staging Area] → [Local Branch] → [Remote Tracking] → [Remote Branch]
```

画面幅が 5 エリアに収まらない場合（モバイル等）: 横スクロール可能。エリアは縮小しない。

**各エリアの仕様**:

#### Working Tree (WT)
- ヘッダー: 「Working Tree」ラベル + ファイル数バッジ
- コンテンツ: 変更済みファイルを1ファイル = 1ブロックで表示
- ブロックの情報:
  - ファイル名（パス省略、ファイル名のみ）
  - ステータスバッジ: `added`（緑）/ `modified`（黄）/ `deleted`（赤）/ `untracked`（グレー）
- 空状態: 「変更なし（クリーンな状態）」テキスト

#### Staging Area (Stg)
- ヘッダー: 「Staging Area」ラベル + ファイル数バッジ
- コンテンツ: `git add` されたファイルを1ファイル = 1ブロックで表示
- ブロックの情報: ファイル名 + ステータスバッジ（WT と同様）
- 空状態: 「ステージングなし」テキスト

#### Local Branch (LB)
- ヘッダー: 「Local Branch」ラベル
- コンテンツ: 全ローカルブランチを含む DAG（縦方向、上が最新）
  - ノード: コミットを表す円（現在の HEAD は強調表示、色を変える）
  - リンク: ノード間を結ぶ縦線（マージコミットは2本線からつながる）
  - ブランチラベル: ブランチ名を最新コミットノードの横に表示
  - ホバー時: コミットメッセージ + コミットハッシュ（短縮7文字）のツールチップを表示
- 空状態（コミットなし）: 「コミットがありません」テキスト

#### Remote Tracking Branch (RT)
- ヘッダー: 「Remote Tracking」ラベル
- コンテンツ: `refs/remotes/origin/*` に対応する DAG（LB と同様の描画）
  - LB と RT で同一コミットハッシュのノードは同じ高さに描画（視覚的な対応関係を明示）
  - `origin/main` が LB の `main` より後ろにある場合: 「ローカルが N コミット先行」インジケーター表示
  - LB が RT より後ろにある場合: 「リモートが N コミット先行（要 pull）」インジケーター表示（赤バッジ）
- remote がない場合: 「リモートが設定されていません」テキスト

#### Remote Branch (R)
- ヘッダー: 「Remote Branch」ラベル
- コンテンツ: RT と同様の DAG。ただし `git fetch` / `git pull` / `git push` のタイミングでのみ更新される
- RT との差分がある場合: 「fetch で更新できます」インジケーター表示
- **注意**: このエリアは `git fetch` 後の `refs/remotes/origin/` の状態を表示する。GitHub API は使用しない

**ポーリング**:
- 1000ms ごとに `.git/HEAD`, `.git/refs/`, `.git/index`, `.git/packed-refs` を再読み込み
- 前回の状態と diff を取り、変化があった場合のみ再描画 + アニメーション発火
- ポーリングはページがアクティブな場合のみ実行（`document.visibilityState`）

---

## アニメーション仕様

Framer Motion を使用。全アニメーション 300ms、`easeInOut`。

| トリガー（検出方法） | アニメーション |
|---|---|
| WT → Stg にファイルが移動（`git add`） | ファイルブロックが WT から Stg へ横スライド移動 |
| Stg → LB にファイルが消え新コミット出現（`git commit`） | Stg のブロックが上方向にフェードアウト、LB の最上部に新ノードがスケールインで出現 |
| LB → RT が追いつく（`git push`） | LB の最新ノードと同一ハッシュのノードが RT にコピーアニメーション（左→右スライド） |
| RT が更新（`git fetch` / `git pull`） | RT の新ノードがスケールイン |
| WT のファイルが消える（`git checkout -- <file>`） | ブロックがフェードアウト |

アニメーション中は次のポーリング結果を保留し、アニメーション完了後に反映する。

---

## データ取得・パース仕様

`isomorphic-git` を使用してブラウザ内で `.git/` を解析する。

```typescript
// 取得する情報
interface GitState {
  workingTree: FileStatus[];     // WT の変更ファイル
  stagingArea: FileStatus[];     // Stg の変更ファイル
  commits: CommitNode[];         // 全コミット（全ブランチ）
  branches: BranchRef[];         // ローカルブランチ + HEAD 位置
  remoteRefs: BranchRef[];       // refs/remotes/origin/*
  head: string;                  // 現在の HEAD（ブランチ名 or コミットハッシュ）
}

interface FileStatus {
  filepath: string;
  status: 'added' | 'modified' | 'deleted' | 'untracked';
}

interface CommitNode {
  oid: string;          // コミットハッシュ（full）
  message: string;      // コミットメッセージ（1行目のみ）
  parents: string[];    // 親コミットのハッシュ
  timestamp: number;
}

interface BranchRef {
  name: string;    // ブランチ名（例: main, origin/main）
  oid: string;     // 指しているコミットハッシュ
}
```

**isomorphic-git API 使用箇所**:
- `git.statusMatrix()` → WT / Stg の状態取得
- `git.log({ depth: 200 })` + 全ブランチ → CommitNode 構築
- `git.listBranches()` + `git.listBranches({ remote: 'origin' })` → ブランチ一覧
- `git.resolveRef()` → HEAD 解決

---

## フィーチャー構成

Supabase なし・Server Actions なしのため、全て `features/` 内のクライアントロジックで構成する。

```
features/
├── repository/
│   ├── components/
│   │   └── OpenRepositoryButton.tsx  # File System Access API 呼び出し
│   ├── hooks/
│   │   ├── useRepositoryHandle.ts    # DirectoryHandle をメモリ保持
│   │   └── useGitPoller.ts           # 1秒ポーリング + 状態管理
│   └── types.ts
├── git-parser/
│   ├── parseGitState.ts              # isomorphic-git 呼び出し → GitState 返す
│   └── diffGitState.ts               # 前後の GitState を比較 → アニメーション指示生成
├── visualizer/
│   ├── components/
│   │   ├── VisualizerLayout.tsx      # 5エリアの横並びレイアウト
│   │   ├── WorkingTreeArea.tsx       # WT エリア
│   │   ├── StagingArea.tsx           # Stg エリア
│   │   ├── BranchGraphArea.tsx       # LB / RT / R 共通 DAG コンポーネント
│   │   ├── FileBlock.tsx             # ファイル1個のブロック（アニメーション対応）
│   │   └── CommitNode.tsx            # コミットノード + ホバーツールチップ
│   └── hooks/
│       └── useAnimationQueue.ts      # アニメーションキュー管理
└── header/
    └── components/
        └── AppHeader.tsx             # リポジトリ名 + 別リポジトリを開くボタン
```

---

## DAG 描画アルゴリズム

- 全ブランチのコミットを `git log --all` 相当で取得
- コミットを timestamp 降順でソート
- 各コミットに列（lane）を割り当て（並列ブランチを横に展開）
- SVG で描画: ノードは `<circle>`、リンクは `<path>`（曲線でマージを表現）
- ブランチラベルは `<foreignObject>` または `<text>` でノード横に配置
- HEAD を指すノードは fill color を `--color-brand` に変更

使用ライブラリ候補: カスタム実装（依存を増やさない）。座標計算は `features/visualizer/utils/dagLayout.ts` に隔離する。

---

## 画面遷移・状態管理

- リポジトリの `FileSystemDirectoryHandle` はメモリ（Zustand store）で保持
- ページリロード時は Handle が失われるため `/` に戻る（`visualizer` ページで handle が null なら `/` へリダイレクト）
- Zustand store: `useRepositoryStore`（handle + 最新 GitState + アニメーションキュー）

```typescript
// store の型
interface RepositoryStore {
  handle: FileSystemDirectoryHandle | null;
  gitState: GitState | null;
  setHandle: (handle: FileSystemDirectoryHandle) => void;
  setGitState: (state: GitState) => void;
}
```

---

## エラーハンドリング

| ケース | 対応 |
|--------|------|
| File System Access API 非対応ブラウザ | ウェルカム画面でバナー表示、ボタン無効化 |
| 選択フォルダが git リポジトリでない | エラートースト + 画面遷移しない |
| `.git/` パース失敗（壊れたリポジトリ等） | 「リポジトリの読み取りに失敗しました」トースト + ポーリング停止 |
| ポーリング中にパース失敗 | エラーを無視して次のポーリングで再試行（一時的なロック状態に対応） |
| ユーザーがブラウザの権限を拒否 | トースト「フォルダへのアクセスが拒否されました」 |

---

## 実装優先順位

### Phase 1（MVP必須）
- [ ] ウェルカム画面 + File System Access API でリポジトリ選択
- [ ] isomorphic-git でGitState パース
- [ ] 5エリアの静的レンダリング（アニメーションなし）
- [ ] DAG 描画（ノード・リンク・ブランチラベル・ホバーツールチップ）
- [ ] 1秒ポーリングで自動更新

### Phase 2（重要）
- [ ] WT↔Stg のファイルブロックアニメーション（`git add`, `git restore`）
- [ ] Stg→LB のコミットアニメーション（`git commit`）
- [ ] LB→RT の push アニメーション（`git push`）
- [ ] RT 更新アニメーション（`git fetch`）

### Phase 3（あると良い）
- [ ] detached HEAD 状態の表示
- [ ] stash エリアの追加
- [ ] 複数リモートのサポート

---

## 実装しないこと（スコープ外）

- [ ] git コマンドの実行（読み取り専用）
- [ ] GitHub / GitLab API 連携
- [ ] チュートリアル / ガイド付きモード
- [ ] ファイル diff の表示
- [ ] ログイン / ユーザー管理
- [ ] Safari / Firefox サポート（File System Access API 非対応）

---

## 自律実装計画

### Phase A: 基盤（推定: 1h）
- [ ] Next.js 15 セットアップ（`output: 'export'`）
- [ ] Tailwind v4 + shadcn/ui + Framer Motion + isomorphic-git インストール
- [ ] デザイントークン設定（CSS 変数）
- [ ] ルーティング（`/` と `/visualizer`）
- [ ] Zustand store（`useRepositoryStore`）
- 検証: `npm run build` 成功、`/` が表示される

### Phase B: コア機能（推定: 3h）
- [ ] File System Access API 統合（ウェルカム画面 + ディレクトリ選択）
- [ ] `parseGitState.ts` 実装（isomorphic-git で全状態取得）
- [ ] `useGitPoller.ts` 実装（1秒ポーリング）
- [ ] WT / Stg エリアのファイルブロック表示
- [ ] DAG 描画（`dagLayout.ts` + SVG レンダリング）
- [ ] CommitNode ホバーツールチップ
- [ ] RT / R エリアの先行・遅延インジケーター
- 検証: 実際の git リポジトリを開いて全エリアが表示される

### Phase C: アニメーション・品質（推定: 2h）
- [ ] `diffGitState.ts` 実装（状態差分 → アニメーション指示）
- [ ] `useAnimationQueue.ts` 実装
- [ ] 各アニメーションの Framer Motion 実装
- [ ] レスポンシブ（横スクロール）
- [ ] エラーハンドリング全件
- [ ] `npm run typecheck && npm run lint` パス
- 検証: QA Agent 実行

### エラー時
- ビルドエラー → 読んで修正。3回失敗で別アプローチ
- isomorphic-git の API が期待通り動かない → 公式ドキュメントを確認
- アニメーション位置ずれ → `layout` prop と `layoutId` を使った Framer Motion の共有レイアウトアニメーションを検討

---

## QA チェックリスト

`qa` エージェントが以下を検証する:
- [ ] Chrome で `/` が表示される
- [ ] 「リポジトリを開く」でフォルダ選択ダイアログが開く
- [ ] git リポジトリでないフォルダを選択するとエラートーストが表示される
- [ ] 有効なリポジトリを開くと `/visualizer` に遷移し 5 エリアが表示される
- [ ] `git add <file>` をターミナルで実行すると 1 秒以内に WT → Stg にファイルが移動する（アニメーションあり）
- [ ] `git commit -m "msg"` を実行すると Stg が空になり LB に新ノードが出現する
- [ ] `git push` を実行すると RT が LB に追いつく
- [ ] コミットノードにホバーするとコミットメッセージのツールチップが表示される
- [ ] ページをリロードすると `/` に戻る（handle 消失）
- [ ] TypeScript エラー 0 件
- [ ] ESLint エラー 0 件
- [ ] 横スクロールで全エリアにアクセスできる（ウィンドウ幅が狭い場合）
