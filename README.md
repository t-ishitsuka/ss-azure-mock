# SS Azure - Remix on Azure with AWS RDS

Remix アプリケーションを Azure にデプロイし、AWS RDS と連携するサンプルプロジェクトです。

## プロジェクト概要

このプロジェクトは以下の構成で実装されています：
- **フロントエンド/バックエンド**: Remix (TypeScript)
- **ホスティング**: Azure App Service
- **データベース**: AWS RDS (PostgreSQL)
- **インフラ管理**: Pulumi (TypeScript)
- **コード品質**: Biome (Linter/Formatter)

## 前提条件

- Docker Desktop
- Docker Compose
- Azure アカウント
- AWS アカウント

## 実装タスク

### フェーズ1: 基本セットアップ ✅
- [x] Docker 開発環境の構築
- [x] プロジェクトガイドライン（CLAUDE.md）の作成
- [x] プロジェクトの基本ディレクトリ構成を作成

### フェーズ2: Remix アプリケーション開発
- [x] Remix アプリケーションの初期化
- [x] Biome の設定とスクリプトの追加
- [x] TypeScript の設定（厳格な型チェック設定）
- [x] 基本的なルーティング設定（Home、About ページ）
- [ ] データベース接続の準備（Prisma セットアップ）
- [ ] 簡単な CRUD 操作の実装（Todo リストなど）
- [ ] エラーハンドリングの実装
- [ ] ヘルスチェックエンドポイントの実装

### フェーズ3: ネットワークインフラ構築
- [ ] Azure VNet の作成（Pulumi）
- [ ] AWS VPC の作成（Pulumi）
- [ ] Site-to-Site VPN の設定
- [ ] ルーティングとセキュリティグループの設定
- [ ] 接続テストスクリプトの作成

### フェーズ4: AWS RDS セットアップ
- [ ] Pulumi で RDS インスタンスを定義（プライベートサブネット）
- [ ] セキュリティグループの設定
- [ ] パラメータグループとオプショングループの設定
- [ ] データベースの初期化スクリプト
- [ ] 接続文字列の生成と環境変数管理

### フェーズ5: Azure App Service 構築
- [ ] App Service Plan の作成（Pulumi）
- [ ] App Service の作成と VNet Integration 設定
- [ ] Application Insights の設定（ログ監視）
- [ ] 環境変数の設定
- [ ] デプロイメント設定

### フェーズ6: デプロイと動作確認
- [ ] Remix アプリケーションのビルド
- [ ] Azure App Service へのデプロイ
- [ ] データベース接続の確認
- [ ] エンドツーエンドの動作テスト
- [ ] トラブルシューティングドキュメントの作成

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

## プロジェクト構成

```
ss-azure/
├── app/                    # Remix アプリケーション
│   ├── app/               # Remix アプリケーションコード
│   │   ├── routes/        # ルート定義
│   │   ├── components/    # React コンポーネント
│   │   ├── lib/           # ユーティリティ関数
│   │   └── styles/        # スタイルシート
│   ├── public/            # 静的アセット
│   ├── prisma/            # Prisma スキーマとマイグレーション
│   ├── tests/             # テストファイル
│   ├── package.json       # 依存関係
│   ├── remix.config.js    # Remix 設定
│   ├── biome.json         # Biome 設定
│   └── tsconfig.json      # TypeScript 設定
│
├── infra/                 # Pulumi インフラコード
│   ├── azure/             # Azure リソース定義
│   │   ├── appService.ts  # App Service 定義
│   │   ├── cdn.ts         # CDN 設定
│   │   └── keyVault.ts    # Key Vault 設定
│   ├── aws/               # AWS リソース定義
│   │   ├── rds.ts         # RDS インスタンス
│   │   ├── vpc.ts         # VPC 設定
│   │   └── security.ts    # セキュリティグループ
│   ├── index.ts           # メインエントリポイント
│   ├── package.json       # 依存関係
│   ├── Pulumi.yaml        # Pulumi プロジェクト設定
│   ├── Pulumi.dev.yaml    # 開発環境設定
│   └── biome.json         # Biome 設定
│
├── .github/               # GitHub Actions
│   └── workflows/         # ワークフロー定義
│       ├── ci.yml         # CI パイプライン
│       └── deploy.yml     # デプロイパイプライン
│
├── docs/                  # ドキュメント
│   ├── architecture.md    # アーキテクチャ説明
│   ├── deployment.md      # デプロイ手順
│   └── troubleshooting.md # トラブルシューティング
│
├── CLAUDE.md              # Claude 用プロジェクトコンテキスト
├── README.md              # このファイル
└── .gitignore             # Git 除外設定
```

## ライセンス

MIT License