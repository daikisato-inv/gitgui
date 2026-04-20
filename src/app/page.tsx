"use client";

import { GitBranch } from "lucide-react";
import { OpenRepositoryButton } from "@/features/repository/components/OpenRepositoryButton";
import { useDirectoryPickerSupported } from "@/lib/hooks/useDirectoryPickerSupported";

export default function WelcomePage() {
  const isSupported = useDirectoryPickerSupported();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] px-4">
      {!isSupported && (
        <div className="absolute top-4 left-0 right-0 mx-auto max-w-md px-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
            このツールは Chrome または Edge でお使いください
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
          <GitBranch className="w-8 h-8 text-[var(--color-brand)]" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            gitGUI
          </h1>
          <p className="text-base text-[var(--color-text-secondary)]">
            Git の動きを、目で見て学ぶ
          </p>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          ローカルのリポジトリを開くと、Working Tree・Staging
          Area・ブランチ構造をリアルタイムに可視化します。
          ターミナルでコマンドを打ちながら、Git
          の内部状態の変化を確認できます。
        </p>

        <div className="flex flex-col gap-3 w-full">
          <OpenRepositoryButton />
        </div>
      </div>
    </main>
  );
}
