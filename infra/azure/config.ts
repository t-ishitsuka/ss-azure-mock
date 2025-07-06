import * as pulumi from "@pulumi/pulumi";

// Pulumi 設定の読み込み
const config = new pulumi.Config();

// Azure リージョン
export const location = config.get("location") || "Japan East";

// 環境名（staging, production など）
export const environment = pulumi.getStack();

// リソース名のプレフィックス
export const projectName = "ss-azure";

// タグ
export const defaultTags = {
  Project: projectName,
  Environment: environment,
  ManagedBy: "Pulumi",
};

// App Service の設定
export const appServiceConfig = {
  // SKU の設定（無料プラン）
  sku: {
    name: config.get("appServiceSkuName") || "F1",
    tier: config.get("appServiceSkuTier") || "Free",
    size: config.get("appServiceSkuSize") || "F1",
    family: config.get("appServiceSkuFamily") || "F",
    capacity: config.getNumber("appServiceSkuCapacity") || 0,
  },
  // ヘルスチェックの設定
  healthCheck: {
    path: "/api/health",
    interval: 30, // 秒
    timeout: 10, // 秒
    unhealthyThreshold: 3,
  },
};

// Container Registry の設定
export const containerRegistryConfig = {
  sku: config.get("containerRegistrySku") || "Basic",
};

// ネットワーク名の生成
export function getResourceName(resourceType: string): string {
  return `${projectName}-${environment}-${resourceType}`;
}