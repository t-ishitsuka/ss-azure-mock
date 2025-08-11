# SS Azure - Remix on Azure with AWS RDS

Remix アプリケーションを Azure にデプロイし、AWS RDS と連携するサンプルプロジェクトです。
http://172.192.32.171/tasks

## プロジェクト概要

このプロジェクトは以下の構成で実装されています：

- **フロントエンド/バックエンド**: Remix (TypeScript)
- **ホスティング**: Azure Container Instances
- **コンテナレジストリ**: Azure Container Registry
- **データベース**: AWS RDS (PostgreSQL)
- **インフラ管理**: Pulumi (TypeScript)
- **コード品質**: Biome (Linter/Formatter)
- **CI/CD**: GitHub Actions

## 前提条件

- Docker Desktop
- Docker Compose
- Azure アカウント
- AWS アカウント

## 実装タスク

### フェーズ 1: 基本セットアップ ✅

- [x] Docker 開発環境の構築
- [x] プロジェクトガイドライン（CLAUDE.md）の作成
- [x] プロジェクトの基本ディレクトリ構成を作成

### フェーズ 2: Remix アプリケーション開発 ✅

- [x] Remix アプリケーションの初期化
- [x] Biome の設定とスクリプトの追加（ESLint から移行）
- [x] TypeScript の設定（厳格な型チェック設定）
- [x] 基本的なルーティング設定（Home、About ページ）
- [x] ヘルスチェックエンドポイントの実装（/api/health, /api/ready, /api/liveness）
- [x] Azure Container Instances 用の本番 Dockerfile 作成
- [x] データベース接続の準備（Prisma セットアップ）
  - [x] Prisma の依存関係インストール
  - [x] Prisma スキーマ定義（Task モデル）
  - [x] データベース接続設定（環境変数）
  - [x] Prisma Client シングルトンユーティリティ作成
  - [x] 初期マイグレーション実行
  - [x] Docker Compose に PostgreSQL 追加
- [x] 簡単な CRUD 操作の実装（タスク管理機能）
  - [x] タスク一覧表示ページ（`/tasks`）
  - [x] タスク作成機能
  - [x] タスク編集機能（`/tasks/:id/edit`）
  - [x] タスク削除機能
  - [x] タスク完了状態切り替え機能
  - [x] 共通レイアウトコンポーネント作成
- [x] エラーハンドリングの実装
  - [x] グローバルエラーバウンダリー
  - [x] 404 エラーページ
  - [x] API エラーハンドリング（try-catch）
  - [x] トースト通知コンポーネント
  - [x] データベースエラーの適切な処理

### フェーズ 3: ネットワークインフラ構築 ✅

- [x] Azure VNet の作成（Pulumi）
- [x] AWS VPC の作成（Pulumi）
- [x] Site-to-Site VPN の設定
- [x] ルーティングとセキュリティグループの設定
- [x] 接続テスト（VPN 接続確立済み）

### フェーズ 4: AWS RDS セットアップ ✅

- [x] Pulumi で RDS インスタンスを定義（プライベートサブネット）
- [x] セキュリティグループの設定
- [x] パラメータグループとオプショングループの設定
- [x] データベースの初期化
- [x] 接続文字列の生成と環境変数管理

### フェーズ 5: Azure Container Instances 構築 ✅

- [x] Container Registry の作成（Pulumi）
- [x] Container Instances の作成と設定（VNet 統合）
- [x] Application Insights の設定（ログ監視）
- [x] Application Gateway の設定（パブリックアクセス）
- [x] 環境変数の設定
- [x] GitHub Actions によるデプロイメント設定

### フェーズ 6: デプロイと動作確認 ✅

- [x] Remix アプリケーションのビルド
- [x] Azure Container Instances へのデプロイ
- [x] GitHub Actions セットアップドキュメントの作成
- [x] データベース接続の確認（VPN 経由で RDS 接続）
- [x] エンドツーエンドの動作テスト
- [x] トラブルシューティングドキュメントの作成

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd ss-azure
```

### 2. Docker 環境の構築

```bash
# Docker イメージのビルド
docker compose build

# コンテナの起動
docker compose up -d

# 開発コンテナに入る
docker compose exec ss-azure-dev bash
```

### 3. 依存関係のインストール（コンテナ内で実行）

```bash
# アプリケーション側
cd app
pnpm install

# インフラ側
cd ../infra
pnpm install
```

### 4. 環境変数の設定

```bash
# app/.env.local を作成
cp app/.env.example app/.env.local
# 必要な値を設定
```

### 5. 開発サーバーの起動（コンテナ内で実行）

```bash
cd app
pnpm run dev
```

## 開発コマンド

### アプリケーション開発（コンテナ内で実行）

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# プロダクションモード起動
pnpm start

# Biome でコードチェック
pnpm biome:check

# Biome で自動修正
pnpm biome:fix
```

### インフラ管理（コンテナ内で実行）

```bash
cd infra

# Azure/AWS ログイン
az login
aws configure

# スタック初期化
pulumi stack init staging

# プレビュー
pulumi preview

# デプロイ
pulumi up

# リソース削除
pulumi destroy
```

### Docker 環境の管理（ホストで実行）

```bash
# コンテナの起動
docker compose up -d

# コンテナの停止
docker compose down

# ログの確認
docker compose logs -f

# コンテナに入る
docker compose exec ss-azure-dev bash
```

## 現在の実装状況

### 実装済み機能

- ✅ Docker 開発環境（Node.js 22 + pnpm）
- ✅ Remix SSR アプリケーション
- ✅ TypeScript + Biome によるコード品質管理
- ✅ 基本ルーティング（Home、About ページ）
- ✅ ヘルスチェック API エンドポイント
  - `/api/health` - アプリケーション健全性の詳細情報
  - `/api/ready` - 準備状態チェック（Container Instances readiness probe 用）
  - `/api/liveness` - 生存確認（Container Instances liveness probe 用）
- ✅ Azure Container Registry へのイメージプッシュ（GitHub Actions）
- ✅ Azure Container Instances へのデプロイ（Pulumi）
- ✅ Application Insights によるモニタリング
- ✅ Prisma ORM セットアップ
  - PostgreSQL データベース（Docker Compose）
  - Task モデル定義
  - マイグレーション実行
  - Prisma Studio でのデータ管理
- ✅ タスク管理 CRUD 機能
  - タスクの作成・読み取り・更新・削除
  - タスク完了状態の管理
  - レスポンシブな UI
- ✅ エラーハンドリング
  - グローバルエラーバウンダリー
  - カスタムエラーページ（404、500）
  - エラー時のトースト通知
  - データベースエラーの適切な処理

### API エンドポイント

| エンドポイント  | 説明             | レスポンス例                                                             |
| --------------- | ---------------- | ------------------------------------------------------------------------ |
| `/api/health`   | 詳細な健全性情報 | `{ status: "healthy", timestamp: "...", uptime: 123.45, memory: {...} }` |
| `/api/ready`    | 準備状態チェック | `{ ready: true, timestamp: "...", checks: {...} }`                       |
| `/api/liveness` | 生存確認         | `{ status: "alive", timestamp: "..." }`                                  |

### ページルート

| ルート            | 説明                                         |
| ----------------- | -------------------------------------------- |
| `/`               | ホームページ                                 |
| `/about`          | プロジェクト詳細情報                         |
| `/tasks`          | タスク管理（一覧・作成・削除・完了切り替え） |
| `/tasks/:id/edit` | タスク編集ページ                             |

## プロジェクト構成

```
ss-azure/
├── app/                    # Remix アプリケーション
│   ├── app/               # Remix アプリケーションコード
│   │   ├── routes/        # ルート定義
│   │   │   ├── _index.tsx     # ホームページ
│   │   │   ├── about.tsx      # About ページ
│   │   │   ├── api.health.ts  # ヘルスチェック API
│   │   │   ├── api.ready.ts   # 準備状態 API
│   │   │   ├── api.liveness.ts # 生存確認 API
│   │   │   ├── tasks._index.tsx # タスク一覧ページ
│   │   │   ├── tasks.$taskId.edit.tsx # タスク編集ページ
│   │   │   └── $.tsx          # 404エラーページ
│   │   ├── components/    # React コンポーネント
│   │   │   ├── layout.tsx    # 共通レイアウト
│   │   │   ├── error-boundary.tsx # エラーバウンダリー
│   │   │   └── toast.tsx     # トースト通知
│   │   ├── lib/           # ユーティリティ関数
│   │   ├── utils/         # ユーティリティ
│   │   │   └── db.server.ts  # Prisma Client シングルトン
│   │   └── styles/        # スタイルシート
│   ├── public/            # 静的アセット
│   ├── prisma/            # Prisma スキーマとマイグレーション
│   │   ├── schema.prisma  # データベーススキーマ定義
│   │   └── migrations/    # マイグレーションファイル
│   ├── generated/         # 自動生成ファイル
│   │   └── prisma/        # Prisma Client
│   ├── package.json       # 依存関係
│   ├── vite.config.ts     # Vite 設定
│   ├── biome.json         # Biome 設定
│   ├── tsconfig.json      # TypeScript 設定
│   └── Dockerfile.production # 本番用 Docker イメージ
│
├── infra/                 # Pulumi インフラコード
│   ├── azure/             # Azure リソース定義
│   │   ├── index.ts       # Azure リソース（ACR、Container Instances など）
│   │   └── config.ts      # Azure 設定
│   ├── aws/               # AWS リソース定義（未実装）
│   └── index.ts           # メインエントリポイント
│
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions デプロイワークフロー
│
├── docs/
│   ├── github-actions-setup.md  # GitHub Actions セットアップガイド
│   └── azure-infrastructure.md  # Azure インフラ構成図
│
├── Dockerfile             # 開発環境用 Docker イメージ
├── compose.yml            # Docker Compose 設定
├── CLAUDE.md              # Claude 用プロジェクトコンテキスト
├── README.md              # このファイル
└── .gitignore             # Git 除外設定
```

## プロジェクト完了状況

### 達成した主要機能

- ✅ **Azure Container Instances** - VNet 内に配置、Application Gateway 経由でパブリックアクセス
- ✅ **AWS RDS PostgreSQL** - プライベートサブネットに配置
- ✅ **Site-to-Site VPN** - Azure VNet と AWS VPC 間の接続確立
- ✅ **GitHub Actions CI/CD** - 自動ビルド・デプロイパイプライン
- ✅ **Prisma マイグレーション** - 手動実行でデータベーススキーマ適用
- ✅ **タスク管理 CRUD** - 完全動作するサンプルアプリケーション

### 完了したタスク

全フェーズ（1〜6）のタスクが完了しました：

- フェーズ 1: 基本セットアップ ✅
- フェーズ 2: Remix アプリケーション開発 ✅
- フェーズ 3: ネットワークインフラ構築 ✅
- フェーズ 4: AWS RDS セットアップ ✅
- フェーズ 5: Azure Container Instances 構築 ✅
- フェーズ 6: デプロイと動作確認 ✅

## ライセンス

MIT License
