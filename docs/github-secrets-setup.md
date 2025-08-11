# GitHub Secrets設定ガイド

このドキュメントでは、GitHub ActionsでVNet内Container Instancesをデプロイするために必要なSecretsの設定方法を説明します。

## 必要なGitHub Secrets

### 1. AZURE_CREDENTIALS
Azure サービスプリンシパルの認証情報（JSON形式）

取得方法：
```bash
az ad sp create-for-rbac --name "github-actions-ss-azure" \
  --role contributor \
  --scopes /subscriptions/c811845f-bbb4-428d-8a6f-8cbf25905155/resourceGroups/ss-azure-staging-rg \
  --sdk-auth
```

### 2. REGISTRY_USERNAME / REGISTRY_PASSWORD
Azure Container Registryの認証情報

取得方法：
```bash
# ユーザー名
az acr credential show --name ssazurestagingacr --query username -o tsv

# パスワード
az acr credential show --name ssazurestagingacr --query "passwords[0].value" -o tsv
```

### 3. VNET_SUBNET_ID
Container Instances用のVNetサブネットID

取得方法：
```bash
az network vnet subnet show \
  --resource-group ss-azure-staging-rg \
  --vnet-name ss-azure-staging-vnet \
  --name ss-azure-staging-container \
  --query id -o tsv
```

期待値：
```
/subscriptions/c811845f-bbb4-428d-8a6f-8cbf25905155/resourceGroups/ss-azure-staging-rg/providers/Microsoft.Network/virtualNetworks/ss-azure-staging-vnet/subnets/ss-azure-staging-container
```

### 4. DATABASE_URL
AWS RDS PostgreSQLの接続文字列

形式：
```
postgresql://dbadmin:<パスワード>@ss-azure-staging-rds.crbtndyup0lg.ap-northeast-1.rds.amazonaws.com:5432/ss_azure_db
```

現在の値：
```
postgresql://dbadmin:iuCBkQQxggEWCD5pEENY@ss-azure-staging-rds.crbtndyup0lg.ap-northeast-1.rds.amazonaws.com:5432/ss_azure_db
```

### 5. APP_INSIGHTS_CONNECTION_STRING（オプション）
Application Insightsの接続文字列

取得方法：
```bash
az monitor app-insights component show \
  --app ss-azure-staging-insights \
  --resource-group ss-azure-staging-rg \
  --query connectionString -o tsv
```

## GitHub Secretsの設定方法

1. GitHubリポジトリにアクセス
2. Settings → Secrets and variables → Actions を選択
3. 「New repository secret」をクリック
4. 各Secretを追加：
   - Name: Secret名（例：VNET_SUBNET_ID）
   - Value: 上記で取得した値

## 設定確認

すべてのSecretsが正しく設定されているか確認：

1. GitHub Actionsのワークフローを手動実行
2. Actions タブ → workflow_dispatch で実行
3. ログを確認してエラーがないことを確認

## トラブルシューティング

### Container Instancesが作成されない
- VNET_SUBNET_IDが正しく設定されているか確認
- サービスプリンシパルに必要な権限があるか確認

### RDSに接続できない
- DATABASE_URLが正しいか確認
- VPN接続が確立されているか確認
- RDSのセキュリティグループがAzure VNetからのアクセスを許可しているか確認

### Application Gatewayでアクセスできない
- Container InstancesのプライベートIPが正しくバックエンドプールに設定されているか確認
- ヘルスプローブが成功しているか確認