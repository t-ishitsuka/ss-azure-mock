import * as pulumi from "@pulumi/pulumi";

// Azure インフラストラクチャのインポート
import { createAzureInfrastructure } from "./azure";
import { createAppGatewayInfrastructure } from "./azure/app-gateway";

// AWS インフラストラクチャのインポート（将来的に追加）
// import { outputs as awsOutputs } from "./aws";

// ネットワークインフラストラクチャのインポート
import { createNetworkInfrastructure } from "./azure/vnet";

// import { createVPNInfrastructure } from "./azure/vpn-gateway";

// プロジェクト全体の設定
const config = new pulumi.Config();
const projectName = config.get("projectName") || "ss-azure";
const environment = pulumi.getStack();
const location = config.get("location") || "japaneast";

// ネットワークインフラストラクチャの作成
const networkInfra = createNetworkInfrastructure(projectName, location);

// Azureインフラストラクチャの作成（VNet内にContainer Instancesを配置）
const azureInfra = createAzureInfrastructure(networkInfra);

// Container InstanceのプライベートIPアドレスを取得（Application Gateway用）
const containerPrivateIP = pulumi.interpolate`10.0.1.4`; // Container InstancesのIPは通常動的に割り当てられる

// Application Gatewayの作成（パブリックアクセス用）
const appGatewayInfra = createAppGatewayInfrastructure(
  projectName,
  networkInfra.resourceGroup,
  networkInfra.vnet,
  containerPrivateIP
);

// VPN設定（AWS側の設定が完了したら有効化）
// const awsVpnEndpoint = config.require("awsVpnEndpoint");
// const vpnSharedKey = config.requireSecret("vpnSharedKey");
// const vpnInfra = createVPNInfrastructure(
//   projectName,
//   networkInfra.resourceGroup,
//   networkInfra.gatewaySubnet,
//   awsVpnEndpoint,
//   vpnSharedKey
// );

// 出力
// Azure 関連の出力
export const azure = {
  resourceGroupName: azureInfra.resourceGroupName,
  containerGroupName: azureInfra.containerGroupName,
  containerUrl: pulumi.interpolate`http://${appGatewayInfra.appGatewayPublicIP.ipAddress}`,
  containerRegistryLoginServer: azureInfra.containerRegistryLoginServer,
  appInsightsInstrumentationKey: azureInfra.appInsightsInstrumentationKey,
  appInsightsConnectionString: azureInfra.appInsightsConnectionString,
  applicationGatewayUrl: pulumi.interpolate`http://${appGatewayInfra.appGatewayPublicIP.ipAddress}`,
};

// ネットワーク関連の出力
export const network = {
  vnetId: networkInfra.vnet.id,
  vnetName: networkInfra.vnet.name,
  vnetAddressSpace: networkInfra.vnet.addressSpace.apply((as) => as?.addressPrefixes || []),
  containerSubnetId: networkInfra.containerSubnet.id,
  containerSubnetAddressPrefix: networkInfra.containerSubnet.addressPrefix,
  gatewaySubnetId: networkInfra.gatewaySubnet.id,
  appGatewaySubnetId: appGatewayInfra.appGatewaySubnet.id,
  appGatewayPublicIP: appGatewayInfra.appGatewayPublicIP.ipAddress,
  // VPN関連（有効化後）
  // vpnPublicIP: vpnInfra.vpnPublicIP.ipAddress,
  // vpnConnectionStatus: vpnInfra.vpnConnection.connectionStatus,
};

// AWS 関連の出力（将来的に追加）
// export const aws = {
//   vpcId: awsOutputs.vpcId,
//   rdsEndpoint: awsOutputs.rdsEndpoint,
//   // ...
// };

// 共通情報の出力
export const projectInfo = {
  projectName: projectName,
  environment: environment,
  timestamp: new Date().toISOString(),
};
