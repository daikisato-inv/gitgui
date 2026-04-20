import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "gitGUI — Git の動きを、目で見て学ぶ",
  description: "Git のコマンド操作をリアルタイムに可視化する初学者向け学習ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
