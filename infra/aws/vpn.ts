import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { vpc, publicSubnet, vpnSecurityGroup } from "./index";

// プロジェクト設定
const config = new pulumi.Config();
const projectName = config.get("projectName") || "ss-azure";
const environment = pulumi.getStack();

// タグの共通定義
const commonTags = {
  Project: projectName,
  Environment: environment,
  ManagedBy: "Pulumi",
};

// リソース名の生成
function getResourceName(resourceType: string): string {
  return `${projectName}-${environment}-${resourceType}`;
}

// Azure VPN GatewayのパブリックIPを取得（後で実際のIPに更新される）
const azureVpnPublicIp = config.get("azureVpnPublicIp") || "20.0.0.1"; // 仮のIP、後で更新

// カスタマーゲートウェイの作成（Azure VPN Gatewayのパブリック IP が必要）
export const customerGateway = new aws.ec2.CustomerGateway(getResourceName("cgw"), {
  bgpAsn: "65000",
  ipAddress: azureVpnPublicIp, // Azure VPN GatewayのパブリックIP
  type: "ipsec.1",
  tags: {
    ...commonTags,
    Name: getResourceName("cgw-azure"),
  },
});

// VPNゲートウェイの作成
export const vpnGateway = new aws.ec2.VpnGateway(getResourceName("vgw"), {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: getResourceName("vgw"),
  },
});

// VPNゲートウェイのルート伝播を有効化
const vgwRoutePropagation = new aws.ec2.VpnGatewayRoutePropagation(
  getResourceName("vgw-route-propagation"),
  {
    vpnGatewayId: vpnGateway.id,
    routeTableId: vpc.mainRouteTableId,
  }
);

// Site-to-Site VPN接続の作成
export const vpnConnection = new aws.ec2.VpnConnection(getResourceName("vpn"), {
  customerGatewayId: customerGateway.id,
  vpnGatewayId: vpnGateway.id,
  type: "ipsec.1",
  staticRoutesOnly: true,
  tags: {
    ...commonTags,
    Name: getResourceName("vpn-azure"),
  },
});

// Azure VNetへの静的ルート
const vpnConnectionRoute = new aws.ec2.VpnConnectionRoute(
  getResourceName("vpn-route-azure"),
  {
    destinationCidrBlock: "10.0.0.0/16", // Azure VNetのCIDR
    vpnConnectionId: vpnConnection.id,
  }
);

// プライベートサブネット用のルートテーブル
const privateRouteTable = new aws.ec2.RouteTable(getResourceName("private-rt"), {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: getResourceName("private-rt"),
  },
});

// Azure VNetへのルート（プライベートサブネット用）
const azureRoute = new aws.ec2.Route(getResourceName("route-to-azure"), {
  routeTableId: privateRouteTable.id,
  destinationCidrBlock: "10.0.0.0/16",
  gatewayId: vpnGateway.id, // vpnGatewayId → gatewayId に修正
});

// VPN接続情報の出力
export const vpnOutputs = {
  vpnConnectionId: vpnConnection.id,
  vpnGatewayId: vpnGateway.id,
  customerGatewayId: customerGateway.id,
  // VPN接続の設定情報（Azure側の設定に必要）
  tunnel1Address: vpnConnection.tunnel1Address,
  tunnel1PresharedKey: pulumi.secret(vpnConnection.tunnel1PresharedKey),
  tunnel2Address: vpnConnection.tunnel2Address,
  tunnel2PresharedKey: pulumi.secret(vpnConnection.tunnel2PresharedKey),
  // VPN接続の詳細はAWS CLIで確認（stateプロパティは直接取得できない）
};