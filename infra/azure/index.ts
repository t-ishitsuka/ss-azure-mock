import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import { location, environment, getResourceName, containerRegistryConfig } from "./config";

// リソースグループの作成
export const resourceGroup = new azure.resources.ResourceGroup("ss-azure-rg", {
  resourceGroupName: getResourceName("rg"),
  location: location,
});

// Container Registry の作成
export const containerRegistry = new azure.containerregistry.Registry("ssazureacr", {
  registryName: `ssazure${environment}acr`.replace(/-/g, ""),
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  sku: {
    name: containerRegistryConfig.sku,
  },
  adminUserEnabled: true,
});

// Log Analytics Workspace の作成（モニタリング用）
export const logAnalyticsWorkspace = new azure.operationalinsights.Workspace("ss-azure-logs", {
  workspaceName: getResourceName("logs"),
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  sku: {
    name: "PerGB2018",
  },
  retentionInDays: 30,
});

// Application Insights の作成
export const appInsights = new azure.insights.Component("ss-azure-insights", {
  resourceName: getResourceName("insights"),
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  applicationType: "web",
  kind: "web",
  workspaceResourceId: logAnalyticsWorkspace.id,
});

// コンテナレジストリの認証情報を取得
const registryCredentials = pulumi.all([
  containerRegistry.name,
  resourceGroup.name,
]).apply(([registryName, rgName]) =>
  azure.containerregistry.listRegistryCredentials({
    registryName: registryName,
    resourceGroupName: rgName,
  })
);

// Container Instance の作成
export const containerGroup = new azure.containerinstance.ContainerGroup("ss-azure-container", {
  containerGroupName: getResourceName("container"),
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  osType: "Linux",
  restartPolicy: "Always",
  ipAddress: {
    type: "Public",
    ports: [{
      port: 8080,
      protocol: "TCP",
    }],
    dnsNameLabel: `ss-azure-${environment}-app`,
  },
  imageRegistryCredentials: [{
    server: containerRegistry.loginServer,
    username: registryCredentials.apply((creds) => creds.username!),
    password: registryCredentials.apply((creds) => creds.passwords![0]?.value!),
  }],
  containers: [{
    name: "ss-azure-app",
    image: pulumi.interpolate`${containerRegistry.loginServer}/ss-azure-app:latest`,
    resources: {
      requests: {
        cpu: 1.0,
        memoryInGB: 1.5,
      },
    },
    ports: [{
      port: 8080,
      protocol: "TCP",
    }],
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
  }],
  diagnostics: {
    logAnalytics: {
      workspaceId: logAnalyticsWorkspace.customerId,
      workspaceKey: pulumi.all([resourceGroup.name, logAnalyticsWorkspace.name]).apply(
        ([rgName, wsName]) => azure.operationalinsights.getSharedKeys({
          resourceGroupName: rgName,
          workspaceName: wsName,
        }).then(keys => keys.primarySharedKey!)
      ),
    },
  },
});

// Azure リソースの出力
export const outputs = {
  resourceGroupName: resourceGroup.name,
  containerGroupName: containerGroup.name,
  containerUrl: pulumi.interpolate`http://${containerGroup.ipAddress.apply(ip => ip?.fqdn)}:8080`,
  containerRegistryLoginServer: containerRegistry.loginServer,
  appInsightsInstrumentationKey: appInsights.instrumentationKey,
  appInsightsConnectionString: appInsights.connectionString,
};