"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRepositoryStore } from "@/lib/store/useRepositoryStore";
import { useDirectoryPickerSupported } from "@/lib/hooks/useDirectoryPickerSupported";

interface OpenRepositoryButtonProps {
  size?: "default" | "lg" | "sm";
  variant?: "default" | "outline";
  label?: string;
}

export function OpenRepositoryButton({
  size = "lg",
  variant = "default",
  label = "リポジトリを開く",
}: OpenRepositoryButtonProps) {
  const router = useRouter();
  const setHandle = useRepositoryStore((s) => s.setHandle);
  const [isPending, setIsPending] = useState(false);
  const isSupported = useDirectoryPickerSupported();

  const handleClick = async () => {
    if (!isSupported) return;
    setIsPending(true);
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: "read" });

      // .git/ の存在確認
      try {
        await dirHandle.getDirectoryHandle(".git");
      } catch {
        toast.error("Git リポジトリではありません。.git/ フォルダを含むフォルダを選択してください。");
        return;
      }

      setHandle(dirHandle);
      router.push("/visualizer");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("フォルダへのアクセスが拒否されました。");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      disabled={!isSupported || isPending}
      onClick={handleClick}
      className={
        variant === "default"
          ? "w-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white"
          : "w-full text-sm"
      }
    >
      <FolderOpen className="w-4 h-4 mr-2" />
      {isPending ? "開いています..." : label}
    </Button>
  );
}
