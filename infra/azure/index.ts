import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";
import { containerRegistryConfig, environment, getResourceName } from "./config";
import type { NetworkInfrastructure } from "./vnet";

// ネットワークインフラストラクチャを受け取る
export function createAzureInfrastructure(networkInfra: NetworkInfrastructure) {
  const resourceGroup = networkInfra.resourceGroup;

  // Container Registry の作成
  const containerRegistry = new azure.containerregistry.Registry("ssazureacr", {
    registryName: `ssazure${environment}acr`.replace(/-/g, ""),
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
      name: containerRegistryConfig.sku,
    },
    adminUserEnabled: true,
  });

  // Log Analytics Workspace の作成（モニタリング用）
  const logAnalyticsWorkspace = new azure.operationalinsights.Workspace("ss-azure-logs", {
    workspaceName: getResourceName("logs"),
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
      name: "PerGB2018",
    },
    retentionInDays: 30,
  });

  // Application Insights の作成
  const appInsights = new azure.insights.Component("ss-azure-insights", {
    resourceName: getResourceName("insights"),
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    applicationType: "web",
    kind: "web",
    workspaceResourceId: logAnalyticsWorkspace.id,
  });

  // コンテナレジストリの認証情報を取得
  const registryCredentials = pulumi
    .all([containerRegistry.name, resourceGroup.name])
    .apply(([registryName, rgName]) =>
      azure.containerregistry.listRegistryCredentials({
        registryName: registryName,
        resourceGroupName: rgName,
      })
    );

  // Azure リソースの出力を返す
  return {
    resourceGroupName: resourceGroup.name,
    containerRegistryLoginServer: containerRegistry.loginServer,
    appInsightsInstrumentationKey: appInsights.instrumentationKey,
    appInsightsConnectionString: appInsights.connectionString,
  };
}
