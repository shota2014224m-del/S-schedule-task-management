import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "S Schedule",
  description: "個人タスク・スケジュール管理 (AI連携)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "S Schedule",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <header className="px-4 py-3 border-b border-white/10 flex items-center gap-4">
          <Link href="/" className="font-semibold">
            S Schedule
          </Link>
          <nav className="flex gap-4 text-sm text-white/70">
            <Link href="/">Today</Link>
            <Link href="/tasks">Tasks</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        <main className="flex-1 px-4 py-4 max-w-3xl w-full mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
