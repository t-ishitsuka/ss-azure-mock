# Azure インフラストラクチャ構成図

## 現在の構成

```mermaid
graph TB
    subgraph "GitHub"
        GH[GitHub Repository]
        GA[GitHub Actions]
    end

    subgraph "Azure リソースグループ: ss-azure-staging-rg"
        subgraph "監視"
            AI[Application Insights<br/>ss-azure-staging-insights]
            LAW[Log Analytics Workspace<br/>ss-azure-staging-logs]
        end

        subgraph "コンテナ"
            ACR[Azure Container Registry<br/>ssazurestagingacr]
            ACI[Container Instances<br/>ss-azure-staging-container]
        end
    end

    subgraph "インターネット"
        USER[ユーザー]
    end

    %% 接続
    GH -->|Push to main/develop| GA
    GA -->|Build and Push Image| ACR
    GA -->|Restart Container| ACI
    ACR -->|Pull Image| ACI
    ACI -->|Send Logs| LAW
    LAW -->|Data Source| AI
    USER -->|HTTPS Request| ACI

    %% スタイリング
    classDef github fill:#24292e,stroke:#fff,color:#fff
    classDef azure fill:#0078d4,stroke:#fff,color:#fff
    classDef container fill:#2e7d32,stroke:#fff,color:#fff
    classDef monitoring fill:#ff6f00,stroke:#fff,color:#fff
    classDef user fill:#673ab7,stroke:#fff,color:#fff

    class GH,GA github
    class ACR,ACI container
    class AI,LAW monitoring
    class USER user
```

## リソース詳細

### 1. Azure Container Registry (ACR)
- **名前**: ssazurestagingacr
- **SKU**: Basic
- **用途**: Docker イメージの保存
- **認証**: Admin ユーザー有効

### 2. Container Instances
- **名前**: ss-azure-staging-container
- **イメージ**: ssazurestagingacr.azurecr.io/ss-azure-app:latest
- **リソース**: 
  - CPU: 1.0 コア
  - メモリ: 1.5 GB
- **ポート**: 8080 (TCP)
- **DNS**: ss-azure-staging-app.japaneast.azurecontainer.io
- **ヘルスチェック**:
  - Liveness Probe: `/api/liveness`
  - Readiness Probe: `/api/ready`

### 3. Log Analytics Workspace
- **名前**: ss-azure-staging-logs
- **保持期間**: 30日
- **SKU**: PerGB2018

### 4. Application Insights
- **名前**: ss-azure-staging-insights
- **タイプ**: Web アプリケーション
- **接続**: Log Analytics Workspace と統合

## デプロイフロー

```mermaid
sequenceDiagram
    participant Dev as 開発者
    participant GH as GitHub
    participant GA as GitHub Actions
    participant ACR as Container Registry
    participant ACI as Container Instances
    participant User as エンドユーザー

    Dev->>GH: コードをプッシュ
    GH->>GA: ワークフロー起動
    GA->>GA: Docker イメージビルド
    GA->>ACR: イメージをプッシュ
    GA->>ACI: コンテナ再起動（オプション）
    ACI->>ACR: 最新イメージをプル
    ACI->>ACI: 新しいコンテナ起動
    User->>ACI: アプリケーションにアクセス
    ACI->>User: レスポンス返却
```

## ネットワーク構成

```mermaid
graph LR
    subgraph "パブリックアクセス"
        INTERNET[インターネット]
    end

    subgraph "Azure Container Instances"
        ACI_IP[パブリック IP<br/>ss-azure-staging-app.japaneast.azurecontainer.io:8080]
        CONTAINER[Remix アプリケーション<br/>ポート: 8080]
    end

    INTERNET -->|HTTP/HTTPS| ACI_IP
    ACI_IP --> CONTAINER
```

## 環境変数

Container Instances に設定されている環境変数：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| NODE_ENV | production | Node.js 実行環境 |
| PORT | 8080 | アプリケーションポート |
| APPLICATIONINSIGHTS_CONNECTION_STRING | (secure) | Application Insights 接続文字列 |

## セキュリティ設定

1. **Container Registry**
   - Admin ユーザー認証
   - GitHub Actions からのアクセスのみ許可（サービスプリンシパル経由）

2. **Container Instances**
   - パブリック IP アドレス（現在）
   - 将来的に VNet 統合予定

3. **GitHub Actions**
   - Azure サービスプリンシパルによる認証
   - シークレット管理による認証情報の保護

## 今後の拡張計画

```mermaid
graph TB
    subgraph "将来の構成"
        subgraph "Azure"
            VNET[Virtual Network]
            ACI2[Container Instances<br/>with VNet Integration]
            VPN1[VPN Gateway]
        end

        subgraph "AWS"
            VPC[VPC]
            RDS[(RDS PostgreSQL)]
            VPN2[VPN Gateway]
        end

        VPN1 -.->|Site-to-Site VPN| VPN2
        ACI2 --> VPN1
        VPN2 --> RDS
    end

    style VPN1 stroke-dasharray: 5 5
    style VPN2 stroke-dasharray: 5 5
    style RDS stroke-dasharray: 5 5
```

## リソース管理

すべてのリソースは Pulumi で管理されており、以下のコマンドで操作可能：

```bash
# リソースの作成/更新
pulumi up

# リソースの削除
pulumi destroy

# 現在の状態確認
pulumi stack
```