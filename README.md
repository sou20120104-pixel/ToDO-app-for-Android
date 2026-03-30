# Video Desk

YouTuber向けの制作支援Webアプリ（ローカル完結・認証なし）です。

## 機能一覧
- 動画一覧（検索 / ステータス絞り込み / 並び替え）
- 動画作成（企画・台本・サムネ情報の入力）
- 動画詳細編集
  - タイトル候補 / 文字数カウント / 禁止ワード警告
  - サムネ文言候補 / 文字数カウント / 禁止ワード警告
  - 台本構成（導入 / 問題提起 / 本編 / まとめ / CTA）
  - 撮影 / 編集 / 投稿前チェックリスト
  - ステータス管理
  - コピー / 複製
- テンプレート管理（台本・チェックリスト）
- 設定（最大文字数・禁止ワード）
- Markdown書き出し
- CSVエクスポート

## 技術スタック
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- zod

## セットアップ
```bash
cp .env.example .env
npm install
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

## 品質チェック
```bash
npm run lint
npm run build
```

## データモデル
- VideoProject
- TitleCandidate
- ThumbnailTextCandidate
- ScriptSection
- Checklist
- ChecklistItem
- Template
- Setting
