import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";

// 設定値
const config = new pulumi.Config();
const environment = config.get("environment") || "staging";

// リソースグループを取得または作成
export function getOrCreateResourceGroup(name: string, location: string) {
  // 既存のリソースグループを使用
  return new azure.resources.ResourceGroup(`${name}-rg`, {
    resourceGroupName: `${name}-rg`,
    location: location,
  });
}

// VNetの作成
export function createVNet(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  addressSpace: string[]
) {
  return new azure.network.VirtualNetwork(`${name}-vnet`, {
    virtualNetworkName: `${name}-vnet`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    addressSpace: {
      addressPrefixes: addressSpace,
    },
    // VPN接続のためのDNSサーバー設定（必要に応じて）
    dhcpOptions: {
      dnsServers: ["168.63.129.16"], // Azure提供のDNSサーバー
    },
  });
}

// サブネットの作成
export function createSubnet(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  vnet: azure.network.VirtualNetwork,
  addressPrefix: string,
  delegations?: azure.types.input.network.DelegationArgs[]
) {
  return new azure.network.Subnet(`${name}-subnet`, {
    subnetName: `${name}-subnet`,
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vnet.name,
    addressPrefix: addressPrefix,
    // Container Instances用のデリゲーション設定
    delegations: delegations,
  });
}

// GatewaySubnetの作成（VPN Gateway用）
export function createGatewaySubnet(
  resourceGroup: azure.resources.ResourceGroup,
  vnet: azure.network.VirtualNetwork,
  addressPrefix: string
) {
  // Gateway Subnetは名前が「GatewaySubnet」である必要がある
  return new azure.network.Subnet("gateway-subnet", {
    subnetName: "GatewaySubnet",
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vnet.name,
    addressPrefix: addressPrefix,
  });
}

// ネットワークセキュリティグループ（NSG）の作成
export function createNetworkSecurityGroup(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  rules: azure.types.input.network.SecurityRuleArgs[]
) {
  return new azure.network.NetworkSecurityGroup(`${name}-nsg`, {
    networkSecurityGroupName: `${name}-nsg`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    securityRules: rules,
  });
}

// NSGルールの定義
export const containerInstancesNSGRules: azure.types.input.network.SecurityRuleArgs[] = [
  {
    name: "AllowAppGatewayHTTP",
    priority: 100,  // 優先度を100に修正（最小値）
    direction: "Inbound",
    access: "Allow",
    protocol: "Tcp",
    sourcePortRange: "*",
    destinationPortRange: "80",
    sourceAddressPrefix: "10.0.2.0/24", // Application Gatewayサブネットからのアクセスを許可
    destinationAddressPrefix: "*",
    description: "Application GatewayサブネットからのHTTPトラフィックを許可",
  },
  {
    name: "AllowAzureLoadBalancer",
    priority: 105,  // 優先度を105に修正
    direction: "Inbound",
    access: "Allow",
    protocol: "Tcp",
    sourcePortRange: "*",
    destinationPortRange: "80",
    sourceAddressPrefix: "AzureLoadBalancer", // Azureインフラストラクチャのヘルスプローブ
    destinationAddressPrefix: "*",
    description: "Azure Load Balancerヘルスプローブを許可",
  },
  {
    name: "AllowHTTP",
    priority: 110,  // 優先度を110に修正
    direction: "Inbound",
    access: "Allow",
    protocol: "Tcp",
    sourcePortRange: "*",
    destinationPortRange: "80",
    sourceAddressPrefix: "*",
    destinationAddressPrefix: "*",
    description: "HTTPトラフィックを許可",
  },
  {
    name: "AllowHTTPS",
    priority: 115,
    direction: "Inbound",
    access: "Allow",
    protocol: "Tcp",
    sourcePortRange: "*",
    destinationPortRange: "443",
    sourceAddressPrefix: "*",
    destinationAddressPrefix: "*",
    description: "HTTPSトラフィックを許可",
  },
  {
    name: "AllowSSH",
    priority: 120,
    direction: "Inbound",
    access: "Allow",
    protocol: "Tcp",
    sourcePortRange: "*",
    destinationPortRange: "22",
    sourceAddressPrefix: "10.0.0.0/16", // VNet内からのみSSH許可
    destinationAddressPrefix: "*",
    description: "VNet内からのSSHを許可",
  },
  {
    name: "AllowPostgreSQLToAWS",
    priority: 130,
    direction: "Outbound",
    access: "Allow",
    protocol: "Tcp",
    sourcePortRange: "*",
    destinationPortRange: "5432",
    sourceAddressPrefix: "*",
    destinationAddressPrefix: "10.1.0.0/16", // AWS VPCのCIDR（修正：10.1.0.0/16）
    description: "AWS RDSへのPostgreSQL接続を許可",
  },
];

// VPN Gateway用のNSGルール
export const vpnGatewayNSGRules: azure.types.input.network.SecurityRuleArgs[] = [
  {
    name: "AllowIPSec",
    priority: 100,
    direction: "Inbound",
    access: "Allow",
    protocol: "Udp",
    sourcePortRange: "*",
    destinationPortRange: "500",
    sourceAddressPrefix: "*",
    destinationAddressPrefix: "*",
    description: "IPSec IKEトラフィックを許可",
  },
  {
    name: "AllowIPSecNAT",
    priority: 110,
    direction: "Inbound",
    access: "Allow",
    protocol: "Udp",
    sourcePortRange: "*",
    destinationPortRange: "4500",
    sourceAddressPrefix: "*",
    destinationAddressPrefix: "*",
    description: "IPSec NAT-Tトラフィックを許可",
  },
  {
    name: "AllowESP",
    priority: 120,
    direction: "Inbound",
    access: "Allow",
    protocol: "Esp",
    sourcePortRange: "*",
    destinationPortRange: "*",
    sourceAddressPrefix: "*",
    destinationAddressPrefix: "*",
    description: "IPSec ESPトラフィックを許可",
  },
];

// サブネットとNSGの関連付け
export function associateSubnetWithNSG(
  subnetName: string,
  vnetName: string,
  addressPrefix: string,
  nsg: azure.network.NetworkSecurityGroup,
  resourceGroup: azure.resources.ResourceGroup,
  delegations?: azure.types.input.network.DelegationArgs[]
) {
  // 新しいサブネットを作成してNSGを関連付ける
  return new azure.network.Subnet(`${subnetName}-with-nsg`, {
    subnetName: subnetName,
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vnetName,
    addressPrefix: addressPrefix,
    networkSecurityGroup: {
      id: nsg.id,
    },
    delegations: delegations,
  });
}

// VNet構成の作成（メイン関数）
export function createNetworkInfrastructure(projectName: string, location: string) {
  // リソースグループの作成
  const resourceGroup = getOrCreateResourceGroup(`${projectName}-${environment}`, location);

  // VNetの作成
  const vnet = createVNet(
    `${projectName}-${environment}`,
    resourceGroup,
    ["10.0.0.0/16"] // Azure VNetのアドレス空間
  );

  // Container Instances用サブネット（後でNSGと関連付けるため、ここでは使用しない）
  // const containerSubnet = createSubnet(
  //   `${projectName}-${environment}-container`,
  //   resourceGroup,
  //   vnet,
  //   "10.0.1.0/24",
  //   [
  //     {
  //       name: "Microsoft.ContainerInstance.containerGroups",
  //       serviceName: "Microsoft.ContainerInstance/containerGroups",
  //     },
  //   ]
  // );

  // Gateway Subnet（VPN Gateway用）
  const gatewaySubnet = createGatewaySubnet(resourceGroup, vnet, "10.0.254.0/24");

  // Container Instances用NSG
  const containerNSG = createNetworkSecurityGroup(
    `${projectName}-${environment}-container`,
    resourceGroup,
    containerInstancesNSGRules
  );

  // VPN Gateway用NSG
  const vpnNSG = createNetworkSecurityGroup(
    `${projectName}-${environment}-vpn`,
    resourceGroup,
    vpnGatewayNSGRules
  );

  // NSGをサブネットに関連付け
  const containerSubnetWithNSG = associateSubnetWithNSG(
    `${projectName}-${environment}-container`,
    `${projectName}-${environment}-vnet`,
    "10.0.1.0/24",
    containerNSG,
    resourceGroup,
    [
      {
        name: "Microsoft.ContainerInstance.containerGroups",
        serviceName: "Microsoft.ContainerInstance/containerGroups",
      },
    ]
  );

  return {
    resourceGroup,
    vnet,
    containerSubnet: containerSubnetWithNSG,
    gatewaySubnet,
    containerNSG,
    vpnNSG,
  };
}

// リソース情報をエクスポート
export interface NetworkInfrastructure {
  resourceGroup: azure.resources.ResourceGroup;
  vnet: azure.network.VirtualNetwork;
  containerSubnet: azure.network.Subnet;
  gatewaySubnet: azure.network.Subnet;
  containerNSG: azure.network.NetworkSecurityGroup;
  vpnNSG: azure.network.NetworkSecurityGroup;
}
