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

  // Container Instance の作成（VNet内に配置）
  const containerGroup = new azure.containerinstance.ContainerGroup("ss-azure-container", {
    containerGroupName: getResourceName("container"),
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    osType: "Linux",
    restartPolicy: "Always",
    // VNet統合の設定
    subnetIds: [
      {
        id: networkInfra.containerSubnet.id,
        name: "default",
      },
    ],
    ipAddress: {
      type: "Private",
      ports: [
        {
          port: 8080,
          protocol: "TCP",
        },
      ],
    },
    imageRegistryCredentials: [
      {
        server: containerRegistry.loginServer,
        username: registryCredentials.apply((creds) => creds.username || ""),
        password: registryCredentials.apply((creds) => creds.passwords?.[0]?.value || ""),
      },
    ],
    containers: [
      {
        name: "ss-azure-app",
        image: pulumi.interpolate`${containerRegistry.loginServer}/ss-azure-app:latest`,
        resources: {
          requests: {
            cpu: 1.0,
            memoryInGB: 1.5,
          },
        },
        ports: [
          {
            port: 8080,
            protocol: "TCP",
          },
        ],
        environmentVariables: [
          {
            name: "NODE_ENV",
            value: "production",
          },
          {
            name: "PORT",
            value: "8080",
          },
          {
            name: "APPLICATIONINSIGHTS_CONNECTION_STRING",
            secureValue: appInsights.connectionString,
          },
        ],
        livenessProbe: {
          httpGet: {
            path: "/api/liveness",
            port: 8080,
          },
          initialDelaySeconds: 30,
          periodSeconds: 10,
        },
        readinessProbe: {
          httpGet: {
            path: "/api/ready",
            port: 8080,
          },
          initialDelaySeconds: 5,
          periodSeconds: 5,
        },
      },
    ],
    diagnostics: {
      logAnalytics: {
        workspaceId: logAnalyticsWorkspace.customerId,
        workspaceKey: pulumi
          .all([resourceGroup.name, logAnalyticsWorkspace.name])
          .apply(([rgName, wsName]) =>
            azure.operationalinsights
              .getSharedKeys({
                resourceGroupName: rgName,
                workspaceName: wsName,
              })
              .then((keys) => keys.primarySharedKey || "")
          ),
      },
    },
  });

  // Azure リソースの出力を返す
  return {
    resourceGroupName: resourceGroup.name,
    containerGroupName: containerGroup.name,
    containerUrl: pulumi.interpolate`Private deployment in VNet - Access via Azure Application Gateway or VPN`,
    containerRegistryLoginServer: containerRegistry.loginServer,
    appInsightsInstrumentationKey: appInsights.instrumentationKey,
    appInsightsConnectionString: appInsights.connectionString,
  };
}
