# ORCHESTRATOR_PROMPT.md

> Phase 4 自律駆動開始時にこのプロンプトをそのまま貼り付ける。

---

## プロンプト

```
SPEC.md と CLAUDE.md の自律実装計画に従って gitGUI を実装してください。
SCRATCHPAD.md を作成し、各ステップ完了時に進捗を更新してください。

## Phase A: 基盤セットアップ

1. next.config.ts に `output: 'export'` と webpack fallback を追加
2. 必要パッケージをインストール:
   - isomorphic-git @isomorphic-git/lightning-fs
   - framer-motion
   - zustand
3. globals.css にブランドカラー上書き（#6366f1）を追加
4. `src/lib/types/git.ts` に GitState 型定義を作成
5. `npm run build` が通ることを確認

## Phase B: コア機能実装

エージェントを順番に実行する:

### Step 1: build-repository
.claude/agents/build-repository.md の指示に従って実装する。
完了条件を全てパスしてから次へ進む。

### Step 2: build-git-parser
.claude/agents/build-git-parser.md の指示に従って実装する。
完了条件を全てパスしてから次へ進む。

### Step 3: build-visualizer（Phase B-3 部分のみ）
.claude/agents/build-visualizer.md の「Phase B-3: 実データ統合」セクションを実装する。
実データで 5 エリアが表示されることを確認してから次へ進む。

## Phase C: アニメーション・品質

### Step 4: build-visualizer（Phase C 部分）
.claude/agents/build-visualizer.md の「Phase C: アニメーション実装」セクションを実装する。

### Step 5: 品質チェック
- npx tsc --noEmit → エラー 0件
- npm run lint → エラー 0件
- npm run build → 成功（output: 'export'）

### Step 6: QA
SPEC.md の QA チェックリスト全件をブラウザで検証する。
❌ が 0件になるまでバグ修正と再テストを繰り返す。

## 各ステップの原則

- 各ステップ完了時に SCRATCHPAD.md を更新する
- `npx tsc --noEmit` は各ステップ後に必ず実行する
- isomorphic-git の API が期待通り動かない場合は npm show で版数を確認してから対処する
- トークン消費 50% で /compact を実行する前に SCRATCHPAD.md を最新化する
```

---

## ブランチ作成（Phase 4 開始前に必ず実行）

```bash
git checkout -b feat/mvp-implementation
```
