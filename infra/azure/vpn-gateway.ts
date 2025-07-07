import * as azure from "@pulumi/azure-native";
import type * as pulumi from "@pulumi/pulumi";

// VPN Gateway用のパブリックIPアドレスを作成
export function createVPNPublicIP(name: string, resourceGroup: azure.resources.ResourceGroup) {
  return new azure.network.PublicIPAddress(`${name}-vpn-pip`, {
    publicIpAddressName: `${name}-vpn-pip`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    publicIPAllocationMethod: "Static",
    sku: {
      name: "Standard",
      tier: "Regional",
    },
    zones: ["1"], // 可用性ゾーン
  });
}

// VPN Gatewayの作成
export function createVPNGateway(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  gatewaySubnet: azure.network.Subnet,
  publicIP: azure.network.PublicIPAddress
) {
  return new azure.network.VirtualNetworkGateway(`${name}-vpn-gateway`, {
    virtualNetworkGatewayName: `${name}-vpn-gateway`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    gatewayType: "Vpn",
    vpnType: "RouteBased",
    sku: {
      name: "VpnGw1",
      tier: "VpnGw1",
    },
    ipConfigurations: [
      {
        name: "vnetGatewayConfig",
        publicIPAddress: {
          id: publicIP.id,
        },
        subnet: {
          id: gatewaySubnet.id,
        },
      },
    ],
    // BGP設定（AWS側との動的ルーティング用）
    bgpSettings: {
      asn: 65000, // Azure側のASN
      bgpPeeringAddress: "10.0.254.4", // Gateway Subnet内のアドレス
    },
    activeActive: false,
    enableBgp: true,
  });
}

// ローカルネットワークゲートウェイ（AWS側のVPNエンドポイント）
export function createLocalNetworkGateway(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  awsVpnEndpoint: pulumi.Input<string>,
  awsVpcCidr: string[]
) {
  return new azure.network.LocalNetworkGateway(`${name}-local-gateway`, {
    localNetworkGatewayName: `${name}-local-gateway`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    gatewayIpAddress: awsVpnEndpoint,
    localNetworkAddressSpace: {
      addressPrefixes: awsVpcCidr,
    },
    // AWS側のBGP設定
    bgpSettings: {
      asn: 65001, // AWS側のASN
      bgpPeeringAddress: "172.31.254.4", // AWS VPC内のアドレス
    },
  });
}

// VPN接続の作成
export function createVPNConnection(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  vpnGateway: azure.network.VirtualNetworkGateway,
  localGateway: azure.network.LocalNetworkGateway,
  sharedKey: pulumi.Input<string>
) {
  return new azure.network.VirtualNetworkGatewayConnection(`${name}-vpn-connection`, {
    virtualNetworkGatewayConnectionName: `${name}-vpn-connection`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    virtualNetworkGateway1: {
      id: vpnGateway.id,
    },
    localNetworkGateway2: {
      id: localGateway.id,
    },
    connectionType: "IPsec",
    connectionProtocol: "IKEv2",
    sharedKey: sharedKey,
    enableBgp: true,
    usePolicyBasedTrafficSelectors: false,
    // IPSec/IKEポリシー
    ipsecPolicies: [
      {
        saLifeTimeSeconds: 3600,
        saDataSizeKilobytes: 102400000,
        ipsecEncryption: "AES256",
        ipsecIntegrity: "SHA256",
        ikeEncryption: "AES256",
        ikeIntegrity: "SHA256",
        dhGroup: "DHGroup14",
        pfsGroup: "PFS2048",
      },
    ],
  });
}

// VPN構成のメイン関数
export function createVPNInfrastructure(
  projectName: string,
  resourceGroup: azure.resources.ResourceGroup,
  gatewaySubnet: azure.network.Subnet,
  awsVpnEndpoint: pulumi.Input<string>,
  sharedKey: pulumi.Input<string>
) {
  // VPN Gateway用のパブリックIP
  const vpnPublicIP = createVPNPublicIP(projectName, resourceGroup);

  // VPN Gateway
  const vpnGateway = createVPNGateway(projectName, resourceGroup, gatewaySubnet, vpnPublicIP);

  // ローカルネットワークゲートウェイ（AWS側）
  const localGateway = createLocalNetworkGateway(
    projectName,
    resourceGroup,
    awsVpnEndpoint,
    ["172.31.0.0/16"] // AWS VPCのCIDR
  );

  // VPN接続
  const vpnConnection = createVPNConnection(
    projectName,
    resourceGroup,
    vpnGateway,
    localGateway,
    sharedKey
  );

  return {
    vpnPublicIP,
    vpnGateway,
    localGateway,
    vpnConnection,
  };
}

// VPN構成のインターフェース
export interface VPNInfrastructure {
  vpnPublicIP: azure.network.PublicIPAddress;
  vpnGateway: azure.network.VirtualNetworkGateway;
  localGateway: azure.network.LocalNetworkGateway;
  vpnConnection: azure.network.VirtualNetworkGatewayConnection;
}
