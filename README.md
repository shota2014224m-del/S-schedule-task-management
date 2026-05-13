# S Schedule

個人専用のタスク・スケジュール管理 PWA。
iPhone / iPad / MacBook いずれのブラウザからも同じ URL でアクセスでき、
ホーム画面に追加すればネイティブアプリのように使えます。

## 機能 (MVP骨格)

- [x] 思いついたタスクをワンタップで追加 (Quick Add)
- [x] Claude による優先度 (高/中/低) ・カテゴリ・所要時間の自動判定
- [x] 優先度ごとの色分け表示 (赤 / 黄 / 緑)
- [x] 優先度順 → 期限順のタスク表示アルゴリズム
- [x] 「できなかった」ボタンで AI が次の空き時間にリスケジュール
- [x] Google カレンダー連携 (OAuth + Calendar API)
- [x] PWA (manifest + apple-web-app メタタグ)

## 技術スタック

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma + SQLite** (ローカル開発用 / 本番は Postgres などに切替可能)
- **NextAuth + Google Provider** (Calendar OAuth)
- **@anthropic-ai/sdk** — Claude Haiku 4.5 で優先度/見積もり/リスケ提案
- **googleapis** — Google Calendar API

## セットアップ

```bash
# 1. 依存をインストール
npm install

# 2. .env を作成
cp .env.example .env
# ANTHROPIC_API_KEY, GOOGLE_CLIENT_ID/SECRET, NEXTAUTH_SECRET を埋める
#   NEXTAUTH_SECRET の生成: openssl rand -base64 32

# 3. DB を作成
npx prisma db push

# 4. 開発サーバ起動
npm run dev
# http://localhost:3000 を iPhone/iPad/MacBook のブラウザで開く
```

### Google OAuth の設定

1. https://console.cloud.google.com/apis/credentials で OAuth 2.0 クライアント ID を作成
2. 種類: ウェブアプリケーション
3. 承認済みリダイレクト URI に `http://localhost:3000/api/auth/callback/google` を追加
   (本番は `https://<your-domain>/api/auth/callback/google`)
4. 「Google Calendar API」を有効化
5. 発行されたクライアント ID / シークレットを `.env` にセット

### Claude API キー

https://console.anthropic.com/ で API キーを発行し、`ANTHROPIC_API_KEY` にセット。
未設定でも UI と DB は動きますが、AI 判定はフォールバック値になります。

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx              # Today (本日のタスク)
│   ├── tasks/page.tsx        # 全タスク一覧
│   ├── settings/page.tsx     # Google連携・APIキー状態
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── tasks/route.ts                  # GET一覧 / POST作成
│       ├── tasks/[id]/route.ts             # PATCH / DELETE
│       ├── tasks/[id]/reschedule/route.ts  # AIリスケ + GCal反映
│       └── ai/estimate/route.ts            # 単体の見積もりAPI
├── components/
│   ├── QuickAdd.tsx
│   ├── TaskCard.tsx
│   └── TaskList.tsx
└── lib/
    ├── auth.ts        # NextAuth設定
    ├── claude.ts      # Claude呼び出し (estimateTask / suggestReschedule)
    ├── db.ts          # Prismaクライアント
    ├── google.ts      # Google Calendar wrapper
    └── priority.ts    # 優先度→色/ラベル/順序
```

## デプロイ

Vercel を推奨。`DATABASE_URL` は Vercel Postgres / Neon などに切り替え、
`prisma/schema.prisma` の provider を `postgresql` に変更してください。
`NEXTAUTH_URL` を本番ドメインに、Google OAuth のリダイレクト URI も追加。

## 今後の拡張余地

- 週/月カレンダービュー (FullCalendar など)
- リマインダー通知 (Web Push)
- 複数カレンダー対応・タイムゾーン処理の強化
- iOS Shortcuts から直接 `/api/tasks` を叩いて Siri 追加
- 完了履歴を学習させて見積もり精度を上げる
