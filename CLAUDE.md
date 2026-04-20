# CLAUDE.md — gitGUI

> 親: @/Users/d_sato/products/CLAUDE.md
> 仕様: @SPEC.md
> デザイン: @docs/DESIGN_SYSTEM.md

---

## プロダクト固有ルール

- **完全フロントエンド**: Supabase なし。Server Actions なし。`'use server'` を書かない
- **静的エクスポート**: `next.config.ts` に `output: 'export'` が必須
- **ブランドカラー**: `#6366f1`（インジゴ）に上書き
- **対象ブラウザ**: Chrome / Edge のみ（File System Access API 依存。Safari / Firefox 非対応）

---

## ブランドカラー上書き

```css
:root {
  --color-brand:        #6366f1;
  --color-brand-hover:  #4f46e5;
  --color-brand-subtle: #eef2ff;
}
.dark {
  --color-brand:        #818cf8;
  --color-brand-hover:  #6366f1;
  --color-brand-subtle: #1e1b4b;
}
```

---

## Feature 構成と依存順序

```
scaffolder（Phase A）
  └─ build-repository（Phase B-1）
       └─ build-git-parser（Phase B-2）
            └─ build-visualizer（Phase B-3 / C）
```

| Feature | 主な責務 |
|---------|---------|
| `repository` | File System Access API・DirectoryHandle・Zustand store・ポーリング |
| `git-parser` | isomorphic-git でブラウザ内 `.git/` パース・状態差分検出 |
| `visualizer` | 5エリアUI・DAG描画・Framer Motionアニメーション |
| `header` | リポジトリ名表示・別リポジトリを開くボタン（モック実装済み） |

---

## 環境変数

なし（完全フロントエンド）。`.env` ファイル不要。

---

## 重要な依存パッケージ

```bash
npm install isomorphic-git @isomorphic-git/lightning-fs
npm install framer-motion
npm install zustand
```

`isomorphic-git` は ESM 専用。`next.config.ts` の `transpilePackages` に追加が必要な場合がある。

---

## Next.js 固有設定

```ts
// next.config.ts
const nextConfig = {
  output: 'export',
  // isomorphic-git が Node built-ins を参照する場合のフォールバック
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      buffer: false,
    };
    return config;
  },
};
```

---

## アーキテクチャ注意点

- Server Component は使わない（`'use client'` が基本）
- `parseGitState.ts` は async 関数。hooks 内で `useEffect` + `useState` で呼び出す
- アニメーション中は次のポーリング結果を保留（`useAnimationQueue.ts` で管理）
- `FileSystemDirectoryHandle` はシリアライズ不可 → localStorage 保存禁止。Zustand のメモリのみ
