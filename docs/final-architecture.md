# 最終アーキテクチャ構成

## 概要

このドキュメントでは、プロジェクト完了時点での最終的なリソース構成を記載します。

## リソース管理の分担

### Pulumi管理リソース（インフラ基盤）

Pulumiで以下のリソースを管理します：

#### Azure リソース
- **Resource Group**: `ss-azure-staging-rg`
- **Virtual Network (VNet)**: `ss-azure-staging-vnet`
  - アドレス空間: `10.0.0.0/16`
  - サブネット:
    - Container Instances用: `10.0.1.0/24`
    - Application Gateway用: `10.0.2.0/24`
    - VPN Gateway用: `10.0.254.0/24`
- **Network Security Groups (NSG)**:
  - `ss-azure-staging-container-nsg`: Container Instances用
  - `ss-azure-staging-vpn-nsg`: VPN Gateway用
- **Application Gateway**: `ss-azure-staging-appgw`
  - パブリックIP: `ss-azure-staging-appgw-pip`
  - バックエンドプール: Container Instances (10.0.1.5)
- **VPN Gateway**: `ss-azure-vpn-gateway`
  - パブリックIP: `ss-azure-vpn-pip-v2`
  - 接続: AWS VPCへのSite-to-Site VPN
- **Container Registry**: `ssazurestagingacr`
- **Log Analytics Workspace**: `ss-azure-staging-logs`
- **Application Insights**: `ss-azure-staging-insights`

#### AWS リソース
- **VPC**: `ss-azure-vpc`
  - CIDR: `10.1.0.0/16`
  - パブリックサブネット: `10.1.1.0/24`
  - プライベートサブネット: `10.1.2.0/24`, `10.1.3.0/24`
- **RDS PostgreSQL**: `ss-azure-staging-rds`
  - エンジン: PostgreSQL 15.7
  - インスタンスクラス: db.t4g.micro
  - ストレージ: 20GB
  - プライベートサブネットに配置
- **VPN Connection**: AWS側のVPN設定
- **セキュリティグループ**: RDS用、VPN用

### GitHub Actions管理リソース（アプリケーション）

GitHub Actionsで以下のリソースを管理します：

- **Container Instances**: `ss-azure-staging-container-vnet`
  - VNet内にプライベートIPで配置（10.0.1.5）
  - GitHub Actionsのワークフローでデプロイ・更新
  - Dockerイメージは Container Registry から取得

## ネットワークアーキテクチャ

```
インターネット
    ↓
[Application Gateway]
    パブリックIP: 172.192.32.171
    ↓
[Azure VNet: 10.0.0.0/16]
    ├── Container Instances Subnet (10.0.1.0/24)
    │   └── Container Instance (10.0.1.5)
    │
    └── VPN Gateway Subnet (10.0.254.0/24)
        └── Site-to-Site VPN
            ↓
[AWS VPC: 10.1.0.0/16]
    └── Private Subnet (10.1.2.0/24, 10.1.3.0/24)
        └── RDS PostgreSQL
```

## デプロイフロー

1. **インフラストラクチャの構築**（Pulumi）
   ```bash
   cd infra
   pulumi up
   ```
   - VNet、VPN、Application Gateway等の基盤リソースを作成

2. **アプリケーションのデプロイ**（GitHub Actions）
   - mainブランチへのプッシュで自動実行
   - Dockerイメージのビルド
   - Container Registryへのプッシュ
   - Container Instancesの更新

3. **データベースマイグレーション**
   - Container Instances内で手動実行
   ```bash
   az container exec \
     --name ss-azure-staging-container-vnet \
     --resource-group ss-azure-staging-rg \
     --container-name ss-azure-staging-container-vnet \
     --exec-command "sh -c 'cd /app && pnpm exec prisma migrate deploy'"
   ```

## アクセス情報

### パブリックアクセス
- **アプリケーション URL**: `http://<Application Gateway Public IP>`
- Application Gateway経由でContainer Instancesにルーティング

### プライベートアクセス
- **RDS PostgreSQL**: VPN経由でのみアクセス可能
- エンドポイント: `ss-azure-staging-rds.crbtndyup0lg.ap-northeast-1.rds.amazonaws.com`

### 監視
- **Application Insights**: Azure Portalから確認
- **Container Logs**: 
  ```bash
  az container logs \
    --name ss-azure-staging-container-vnet \
    --resource-group ss-azure-staging-rg
  ```

## コスト最適化

### 削除された不要リソース
- `ss-azure-staging-container`: 旧パブリックIP版Container Instances
- `ss-azure-staging-aci-vnet`: Pulumi管理の重複Container Instances

### 残存リソース
必要最小限のリソースのみを維持：
- ネットワーク基盤（VNet、VPN）
- アプリケーション実行環境（Container Instances）
- データベース（RDS）
- 監視（Application Insights）

## セキュリティ

### ネットワークセキュリティ
- Container InstancesはVNet内のプライベートIPのみ
- RDSはプライベートサブネット内に配置
- VPN経由でのみデータベースアクセス可能
- NSGによるトラフィック制御

### アクセス制御
- Container Registry: 管理者認証有効
- RDS: VPCセキュリティグループで制限
- Application Gateway: HTTPSへの移行推奨（現在HTTP）

## メンテナンス

### リソースの更新
- **インフラ更新**: Pulumiで管理
  ```bash
  cd infra
  pulumi up
  ```

- **アプリ更新**: GitHub Actionsで自動化
  - mainブランチへのプッシュで自動デプロイ

### リソースの削除
完全にリソースを削除する場合：
```bash
# Pulumi管理リソースの削除
cd infra
pulumi destroy

# GitHub Actions管理のContainer Instancesの削除
az container delete \
  --name ss-azure-staging-container-vnet \
  --resource-group ss-azure-staging-rg \
  --yes
```

## 今後の推奨事項

1. **HTTPS化**: Application GatewayにSSL証明書を設定
2. **自動スケーリング**: Container Instancesのスケーリング設定
3. **バックアップ**: RDSの自動バックアップ設定
4. **監視強化**: アラート設定の追加
5. **本番環境**: production環境の構築（現在stagingのみ）