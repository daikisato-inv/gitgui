"use client";

import { useEffect, useState } from "react";

/** SSR/初回クライアント描画では false。マウント後に File System Access API の可否を返す（ハイドレーションずれ防止） */
export function useDirectoryPickerSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("showDirectoryPicker" in window);
  }, []);

  return supported;
}
