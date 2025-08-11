import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

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

// VPCの作成
export const vpc = new aws.ec2.Vpc(getResourceName("vpc"), {
  cidrBlock: "10.1.0.0/16", // Azureの10.0.0.0/16と重複しないように
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: getResourceName("vpc"),
  },
});

// インターネットゲートウェイの作成
const igw = new aws.ec2.InternetGateway(getResourceName("igw"), {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: getResourceName("igw"),
  },
});

// パブリックサブネット（VPNゲートウェイ用）
export const publicSubnet = new aws.ec2.Subnet(getResourceName("public-subnet"), {
  vpcId: vpc.id,
  cidrBlock: "10.1.1.0/24",
  availabilityZone: "ap-northeast-1a",
  mapPublicIpOnLaunch: true,
  tags: {
    ...commonTags,
    Name: getResourceName("public-subnet"),
    Type: "Public",
  },
});

// プライベートサブネット1（RDS用）
export const privateSubnet1 = new aws.ec2.Subnet(getResourceName("private-subnet-1"), {
  vpcId: vpc.id,
  cidrBlock: "10.1.10.0/24",
  availabilityZone: "ap-northeast-1a",
  tags: {
    ...commonTags,
    Name: getResourceName("private-subnet-1"),
    Type: "Private",
  },
});

// プライベートサブネット2（RDS用 - Multi-AZ対応）
export const privateSubnet2 = new aws.ec2.Subnet(getResourceName("private-subnet-2"), {
  vpcId: vpc.id,
  cidrBlock: "10.1.11.0/24",
  availabilityZone: "ap-northeast-1c",
  tags: {
    ...commonTags,
    Name: getResourceName("private-subnet-2"),
    Type: "Private",
  },
});

// パブリックルートテーブル
const publicRouteTable = new aws.ec2.RouteTable(getResourceName("public-rt"), {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: getResourceName("public-rt"),
  },
});

// インターネットへのルート
new aws.ec2.Route(getResourceName("public-route"), {
  routeTableId: publicRouteTable.id,
  destinationCidrBlock: "0.0.0.0/0",
  gatewayId: igw.id,
});

// パブリックサブネットとルートテーブルの関連付け
new aws.ec2.RouteTableAssociation(getResourceName("public-rta"), {
  subnetId: publicSubnet.id,
  routeTableId: publicRouteTable.id,
});

// RDS用セキュリティグループ
export const rdsSecurityGroup = new aws.ec2.SecurityGroup(getResourceName("rds-sg"), {
  vpcId: vpc.id,
  description: "Security group for RDS PostgreSQL",
  ingress: [
    {
      protocol: "tcp",
      fromPort: 5432,
      toPort: 5432,
      cidrBlocks: ["10.0.0.0/16"], // Azure VNetからのアクセスを許可
      description: "PostgreSQL from Azure VNet",
    },
    {
      protocol: "tcp",
      fromPort: 5432,
      toPort: 5432,
      cidrBlocks: ["10.1.0.0/16"], // 同一VPC内からのアクセスを許可
      description: "PostgreSQL from same VPC",
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow all outbound",
    },
  ],
  tags: {
    ...commonTags,
    Name: getResourceName("rds-sg"),
  },
});

// VPN用セキュリティグループ
export const vpnSecurityGroup = new aws.ec2.SecurityGroup(getResourceName("vpn-sg"), {
  vpcId: vpc.id,
  description: "Security group for VPN connections",
  ingress: [
    {
      protocol: "udp",
      fromPort: 500,
      toPort: 500,
      cidrBlocks: ["0.0.0.0/0"],
      description: "IPSec IKE",
    },
    {
      protocol: "udp",
      fromPort: 4500,
      toPort: 4500,
      cidrBlocks: ["0.0.0.0/0"],
      description: "IPSec NAT-T",
    },
    {
      protocol: "50",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
      description: "ESP",
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow all outbound",
    },
  ],
  tags: {
    ...commonTags,
    Name: getResourceName("vpn-sg"),
  },
});

// 出力
export const outputs = {
  vpcId: vpc.id,
  vpcCidr: vpc.cidrBlock,
  publicSubnetId: publicSubnet.id,
  privateSubnet1Id: privateSubnet1.id,
  privateSubnet2Id: privateSubnet2.id,
  rdsSecurityGroupId: rdsSecurityGroup.id,
  vpnSecurityGroupId: vpnSecurityGroup.id,
};