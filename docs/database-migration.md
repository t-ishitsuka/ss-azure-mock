# データベースマイグレーションガイド

このドキュメントでは、AWS RDS PostgreSQLへのマイグレーション実行方法を説明します。

## 前提条件

- AWS RDS PostgreSQLインスタンスが作成済み
- VPN接続が確立済み
- DATABASE_URLが環境変数として設定済み
- Container InstancesがVNet内に配置済み

## 重要な注意事項

**AWS RDSはプライベートサブネットに配置されているため、GitHub Actionsランナーから直接アクセスできません。**
マイグレーションは以下のいずれかの方法で実行する必要があります：

1. Container Instances起動時の自動実行（推奨）
2. Container Instances内での手動実行
3. VPN接続済みの環境からの実行

## マイグレーション方法

### 1. 自動実行（Container起動時）- 推奨

Dockerコンテナ起動時に自動的にマイグレーションが実行されます。
`docker-entrypoint.sh`スクリプトが以下の処理を行います：

1. データベース接続の確認
2. 未適用のマイグレーションを適用
3. アプリケーションの起動

この方法では、デプロイのたびに自動的にマイグレーションが実行されるため、手動操作は不要です。

### 2. GitHub Actions経由（Container Instance内実行）

#### 手動実行
1. GitHubリポジトリの「Actions」タブを開く
2. 「Run Database Migrations via Container」ワークフローを選択
3. 「Run workflow」をクリック
4. 環境を選択（staging/production）
5. 「Run workflow」を実行

このワークフローは、Azure Container Instance内でマイグレーションコマンドを実行します。

### 2. ローカル環境から実行

#### Docker環境での実行
```bash
# Docker コンテナに入る
docker compose exec ss-azure-dev bash

# アプリケーションディレクトリに移動
cd /workspace/app

# 環境変数を設定（.env.stagingファイルを使用）
export DATABASE_URL="postgresql://dbadmin:iuCBkQQxggEWCD5pEENY@ss-azure-staging-rds.crbtndyup0lg.ap-northeast-1.rds.amazonaws.com:5432/ss_azure_db"

# マイグレーションのステータス確認
pnpm exec prisma migrate status

# マイグレーションを実行
pnpm exec prisma migrate deploy

# 開発環境での新しいマイグレーション作成
pnpm exec prisma migrate dev --name <migration-name>
```

#### 直接実行（WSL2環境）
```bash
cd ~/Projects/SmartSlide/ss-azure/app

# 環境変数を設定
export DATABASE_URL="postgresql://dbadmin:iuCBkQQxggEWCD5pEENY@ss-azure-staging-rds.crbtndyup0lg.ap-northeast-1.rds.amazonaws.com:5432/ss_azure_db"

# マイグレーションを実行
pnpm exec prisma migrate deploy
```

### 3. Container Instances内から実行

```bash
# Container Instancesに接続
az container exec \
  --name ss-azure-staging-container-vnet \
  --resource-group ss-azure-staging-rg \
  --container-name ss-azure-staging-container-vnet \
  --exec-command "/bin/sh"

# マイグレーションを実行
cd /app
npx prisma migrate deploy
```

## マイグレーションの管理

### 新しいマイグレーションの作成
```bash
# 開発環境で実行
cd app
pnpm exec prisma migrate dev --name <migration-name>
```

### マイグレーションのリセット（開発環境のみ）
```bash
# 警告：データベースの全データが削除されます
pnpm exec prisma migrate reset
```

### マイグレーション履歴の確認
```bash
# 適用済みマイグレーションの一覧
pnpm exec prisma migrate status
```

## Prisma Studioでのデータ確認

### ローカル環境から
```bash
cd app

# VPN経由でRDSに接続している場合
export DATABASE_URL="postgresql://dbadmin:iuCBkQQxggEWCD5pEENY@ss-azure-staging-rds.crbtndyup0lg.ap-northeast-1.rds.amazonaws.com:5432/ss_azure_db"

# Prisma Studioを起動
pnpm exec prisma studio --port 5555 --browser none --hostname 0.0.0.0

# ブラウザでアクセス
# WSL2の場合: http://<WSL2のIP>:5555
# 通常: http://localhost:5555
```

## トラブルシューティング

### マイグレーションが失敗する場合

1. **接続エラー**
   - VPN接続が確立されているか確認
   - DATABASE_URLが正しいか確認
   - RDSのセキュリティグループがAzure VNetからのアクセスを許可しているか確認

2. **権限エラー**
   - データベースユーザーにCREATE/ALTER権限があるか確認
   - スキーマへのアクセス権限があるか確認

3. **マイグレーション競合**
   - 複数の環境で同時にマイグレーションを実行していないか確認
   - `_prisma_migrations`テーブルの状態を確認

### ロールバック方法

Prismaは自動ロールバック機能を提供していないため、手動でのロールバックが必要です：

1. 前のマイグレーションファイルを確認
2. 逆の操作を行うSQLを作成
3. 手動でSQLを実行

```sql
-- 例：カラムを削除する場合
ALTER TABLE "Task" DROP COLUMN "new_column";

-- _prisma_migrationsテーブルから該当レコードを削除
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20240101000000_add_new_column';
```

## CI/CDパイプラインでの自動化

GitHub Actionsワークフローでは、以下の順序で処理が実行されます：

1. **migrate-database**ジョブ
   - Prisma CLIのインストール
   - マイグレーションの実行
   - シードデータの投入（存在する場合）

2. **build-and-push**ジョブ
   - Dockerイメージのビルド
   - Azure Container Registryへのプッシュ
   - Container Instancesの更新

この順序により、新しいコードがデプロイされる前にデータベーススキーマが更新されます。

## セキュリティ上の注意

- DATABASE_URLには本番環境の認証情報が含まれるため、GitHub Secretsで管理
- ローカル環境では`.env.local`や`.env.staging`ファイルに保存（Gitにはコミットしない）
- VPN接続を使用してセキュアな通信を確保
- 本番環境へのマイグレーションは必ず検証環境でテスト後に実行