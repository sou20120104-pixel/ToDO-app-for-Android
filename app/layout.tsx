import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-brand-700">Video Desk</Link>
            <nav className="flex gap-2 text-sm">
              <Link className="btn-secondary" href="/videos/new">新規作成</Link>
              <Link className="btn-secondary" href="/templates">テンプレート</Link>
              <Link className="btn-secondary" href="/settings">設定</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
