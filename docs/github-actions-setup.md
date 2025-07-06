# GitHub Actions セットアップガイド

このドキュメントでは、GitHub Actions を使用して Azure Container Registry にイメージをプッシュする方法を説明します。

## 前提条件

- Azure サブスクリプション
- Azure Container Registry（ACR）が作成済み(pulumi に記載ずみ)
- GitHub リポジトリ

## セットアップ手順

### 1. Azure サービスプリンシパルの作成

Azure CLI を使用してサービスプリンシパルを作成します：

```bash
# Azure にログイン
az login

# サブスクリプション ID を確認
az account show --query id -o tsv

# サービスプリンシパルを作成（<subscription-id> を実際の ID に置き換え）
az ad sp create-for-rbac \
  --name "github-actions-ss-azure" \
  --role contributor \
  --scopes /subscriptions/<subscription-id> \
  --sdk-auth
```

このコマンドは以下のような JSON を出力します：

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### 2. Container Registry の認証情報を取得

```bash
# ACR の認証情報を取得
az acr credential show --name ssazurestagingacr
```

このコマンドは以下のような出力を返します：

```json
{
  "passwords": [
    {
      "name": "password",
      "value": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    },
    {
      "name": "password2",
      "value": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  ],
  "username": "ssazurestagingacr"
}
```

### 3. GitHub Secrets の設定

GitHub リポジトリで以下の Secrets を設定します：

1. リポジトリページで `Settings` タブをクリック
2. 左メニューから `Secrets and variables` → `Actions` を選択
3. `New repository secret` をクリックして以下の 3 つのシークレットを追加：

#### AZURE_CREDENTIALS

- **Name**: `AZURE_CREDENTIALS`
- **Value**: ステップ 1 で取得した JSON 全体をコピー＆ペースト

#### REGISTRY_USERNAME

- **Name**: `REGISTRY_USERNAME`
- **Value**: `ssazurestagingacr`（ACR の名前）

#### REGISTRY_PASSWORD

- **Name**: `REGISTRY_PASSWORD`
- **Value**: ステップ 2 で取得した `password` の値

### 4. ワークフローの動作確認

すべての設定が完了したら：

1. `main` または `develop` ブランチにコードをプッシュ
2. GitHub の `Actions` タブでワークフローの実行状況を確認
3. 成功したら Azure Portal でイメージを確認：
   - Azure Portal にログイン
   - Container Registry を選択
   - `ssazurestagingacr` をクリック
   - 左メニューの「サービス -> リポジトリ」でイメージを確認

### コンテナの自動再起動

デプロイ後にコンテナを自動的に再起動する場合は、ワークフローの最後のステップがエラーを無視するように設定されています（`continue-on-error: true`）。これは初回デプロイ時にコンテナがまだ存在しない可能性があるためです。

## 関連ファイル

- `.github/workflows/deploy.yml`: GitHub Actions ワークフロー定義
- `app/Dockerfile.production`: 本番用 Docker イメージの定義
- `infra/azure/index.ts`: Container Instance の設定（イメージ URL など）
