# SS Azure プロジェクト

## 必須ルール

- **すべてのやり取りは日本語で行うこと**
- コード内のコメントも日本語で記述する
- エラーメッセージやログメッセージも可能な限り日本語化する
- `pulumi up` と `pulumi destroy` で環境の構築・破棄が完結するように実装する
- **pnpm や npm を使用するコマンドは Docker コンテナ内で実行するため、作業指示として提示すること**
- **すべての npm, npx コマンドは pnpm, pnpm exec で実行すること**
- **Docker Compose の設定ファイルは `compose.yml` を使用すること（`docker-compose.yml` ではない）**

## プロジェクト概要

このプロジェクトは、Remix アプリケーションを Azure にデプロイし、データベースとして AWS RDS を使用するサンプル実装です。
すべてのページは SSR (Server-Side Rendering) で動作します。

## 技術スタック

- **フロントエンド/バックエンド**: Remix (TypeScript) - SSR のみ
- **インフラストラクチャ**: Pulumi (TypeScript)
- **ホスティング**: Azure Container Instances
- **コンテナレジストリ**: Azure Container Registry
- **データベース**: AWS RDS (PostgreSQL) ※未実装
- **Linter/Formatter**: Biome
- **CI/CD**: GitHub Actions
- **環境**: staging のみ（本番環境なし）

## ディレクトリ構成

```
ss-azure/
├── app/                 # Remix アプリケーション
│   ├── app/            # Remix ルートディレクトリ
│   ├── public/         # 静的アセット
│   ├── package.json    # アプリケーションの依存関係
│   ├── remix.config.js # Remix 設定
│   └── biome.json      # Biome 設定
├── infra/              # Pulumi インフラコード
│   ├── index.ts        # メインのインフラ定義
│   ├── azure/          # Azure リソース定義
│   ├── aws/            # AWS リソース定義
│   ├── package.json    # インフラの依存関係
│   └── biome.json      # Biome 設定
└── README.md           # プロジェクト説明とタスク一覧

```

## 開発ガイドライン

### コーディング規約

- すべてのコードは TypeScript で記述
- Biome を使用してコードフォーマットとリンティングを実行
- 型定義を明示的に行い、`any` 型の使用は避ける
- コメントは日本語で記述

### Biome 設定

```bash
# インストール
npm install --save-dev @biomejs/biome

# 初期化
npx @biomejs/biome init

# フォーマット
npx @biomejs/biome format --write ./

# リント
npx @biomejs/biome lint ./

# チェック（フォーマット + リント）
npx @biomejs/biome check --apply ./
```

### Git コミット規約

- コミットメッセージは日本語で記述
- プレフィックスを使用: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- 例: `feat: Azure App Service への Remix デプロイ設定を追加`

### 環境変数

- ローカル開発: `.env.local`
- ステージング: `.env.staging`
- 秘密情報は環境変数として管理（シンプルなサンプルのため Key Vault は使用しない）

## 重要な注意事項

### ネットワーク構成（本番想定）

このサンプルでは AWS と Azure 間の通信をセキュアに行うことが主目的のため、以下の構成を実装予定です：

- **Azure 側**: VNet 内に Container Instances を配置（VNet Integration）
- **AWS 側**: VPC 内に RDS を配置（プライベートサブネット）
- **接続方法**: Site-to-Site VPN または VNet Peering + Transit Gateway を使用
- データベース接続文字列は環境変数で管理
- 通信はすべて内部ネットワーク経由で行う

### 現在の実装状況

- **Azure Container Instances**: パブリック IP でアクセス可能
- **Azure Container Registry**: GitHub Actions からイメージをプッシュ
- **CI/CD**: GitHub Actions で自動デプロイ構築済み
- **監視**: Application Insights と Log Analytics で監視

### インフラ管理

- `pulumi up` で全リソースを一括作成
- `pulumi destroy` で全リソースを一括削除
- リソースの依存関係を適切に定義して、作成・削除順序を制御
- ステージング環境のみのシンプルな構成
- ネットワーク接続の確立を確認してからアプリケーションをデプロイ

## デプロイメントフロー

1. Pulumi でインフラストラクチャを構築（VPN/ネットワーク接続を含む）
2. ネットワーク接続の確認
3. データベースの初期化
4. Remix アプリケーションのビルドとデプロイ
5. 動作確認

## トラブルシューティング

### ネットワーク接続
- VPN 接続状態の確認方法
- セキュリティグループ/NSG の設定確認
- ルーティングテーブルの確認
- DNS 解決の確認

### アプリケーション
- Container Instances のログ確認（Application Insights）
- コンテナの状態確認（Azure Portal または Azure CLI）
- データベース接続エラーの対処
- 環境変数の設定確認

### Pulumi
- Azure/AWS の権限設定確認
- リソースの依存関係エラーの解決
- スタック状態の確認とリカバリ

### WSL2 開発環境
- 詳細なガイドは `docs/wsl2-development.md` を参照
- WSL2 の IP 確認: `ip addr show eth0 | grep -oP '(?<=inet\s)\d+\.\d+\.\d+\.\d+'`
- Prisma Studio へのアクセス: `http://<WSL2のIP>:5555`

## Docker 開発環境

### 初回セットアップ
```bash
# Docker イメージのビルド
docker compose build

# コンテナの起動
docker compose up -d

# 開発コンテナに入る
docker compose exec ss-azure-dev bash
```

### Docker 内での開発コマンド
```bash
# pnpm のセットアップ（初回のみ）
pnpm config set store-dir /home/node/.local/share/pnpm/store

# 依存関係のインストール
cd app && pnpm install
cd ../infra && pnpm install
```

## 開発時のコマンド

### アプリケーション開発
```bash
cd app

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# Biome でコードをチェック
pnpm biome:check

# Biome でコードを自動修正
pnpm biome:fix

# TypeScript の型チェック
pnpm typecheck

# すべてのチェックを実行
pnpm check
```

### インフラ管理
```bash
cd infra

# Pulumi スタックの初期化
pulumi stack init staging

# インフラのプレビュー
pulumi preview

# インフラの構築
pulumi up

# インフラの削除
pulumi destroy

# スタックの状態確認
pulumi stack
```

### ネットワーク接続確認
```bash
# Container Instances の状態確認
az container show --name ss-azure-staging-container --resource-group ss-azure-staging-rg

# コンテナのログ確認
az container logs --name ss-azure-staging-container --resource-group ss-azure-staging-rg

# VPN 接続状態の確認（Azure CLI）※将来実装時
az network vpn-connection show --name <connection-name> --resource-group <rg-name>

# RDS への接続テスト（Container から）※将来実装時
psql -h <rds-endpoint> -U <username> -d <database> -p 5432
```

## GitHub Actions デプロイ

GitHub Actions を使用した自動デプロイが設定されています：

1. `main` または `develop` ブランチへのプッシュでワークフロー起動
2. Docker イメージのビルドと Azure Container Registry へのプッシュ
3. Container Instances の自動再起動（オプション）

詳細な設定方法は `docs/github-actions-setup.md` を参照してください。
