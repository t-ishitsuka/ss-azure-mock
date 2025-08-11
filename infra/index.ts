import * as pulumi from "@pulumi/pulumi";

// Azure インフラストラクチャのインポート
import { createAzureInfrastructure } from "./azure";
import { createAppGatewayInfrastructure } from "./azure/app-gateway";

// AWS インフラストラクチャのインポート
import { outputs as awsOutputs } from "./aws";
import { rdsOutputs } from "./aws/rds";
import { vpnOutputs } from "./aws/vpn"; // VPN設定を有効化

// ネットワークインフラストラクチャのインポート
import { createNetworkInfrastructure } from "./azure/vnet";

import { createVPNInfrastructure } from "./azure/vpn-gateway";

// プロジェクト全体の設定
const config = new pulumi.Config();
const projectName = config.get("projectName") || "ss-azure";
const environment = pulumi.getStack();
const location = config.get("location") || "japaneast";

// ネットワークインフラストラクチャの作成
const networkInfra = createNetworkInfrastructure(projectName, location);

// Azureインフラストラクチャの作成（VNet内にContainer Instancesを配置）
const azureInfra = createAzureInfrastructure(networkInfra);

// Container InstanceのプライベートIPアドレス（GitHub Actionsでデプロイされる）
// 固定IPを使用（GitHub Actionsで作成されるContainer Instancesが使用）
const containerPrivateIP = pulumi.interpolate`10.0.1.5`;

// Application Gatewayの作成（パブリックアクセス用）
const appGatewayInfra = createAppGatewayInfrastructure(
  projectName,
  networkInfra.resourceGroup,
  networkInfra.vnet,
  containerPrivateIP
);

// VPN設定（一時的にダミー値で設定、後でAWS VPN作成後に更新）
const awsVpnEndpoint = config.get("awsVpnEndpoint") || "1.1.1.1"; // 後でAWS VPNのパブリックIPに更新
const vpnSharedKey = config.getSecret("vpnSharedKey") || pulumi.secret("TempSharedKey123!@#");
const vpnInfra = createVPNInfrastructure(
  projectName,
  networkInfra.resourceGroup,
  networkInfra.gatewaySubnet,
  awsVpnEndpoint,
  vpnSharedKey
);

// 出力
// Azure 関連の出力
export const azure = {
  resourceGroupName: azureInfra.resourceGroupName,
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
  // VPN関連
  vpnPublicIP: vpnInfra.vpnPublicIP.ipAddress,
  vpnGatewayId: vpnInfra.vpnGateway.id,
};

// AWS 関連の出力
export const aws = {
  vpcId: awsOutputs.vpcId,
  vpcCidr: awsOutputs.vpcCidr,
  rdsEndpoint: rdsOutputs.endpoint,
  rdsConnectionString: rdsOutputs.connectionString,
  // VPN設定
  vpnConnectionId: vpnOutputs.vpnConnectionId,
  tunnel1Address: vpnOutputs.tunnel1Address,
  tunnel1PresharedKey: vpnOutputs.tunnel1PresharedKey,
};

// 共通情報の出力
export const projectInfo = {
  projectName: projectName,
  environment: environment,
  timestamp: new Date().toISOString(),
};
