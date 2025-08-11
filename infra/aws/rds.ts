import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { vpc, privateSubnet1, privateSubnet2, rdsSecurityGroup } from "./index";

// プロジェクト設定
const config = new pulumi.Config();
const projectName = config.get("projectName") || "ss-azure";
const environment = pulumi.getStack();

// RDS設定
const rdsConfig = {
  instanceClass: config.get("rdsInstanceClass") || "db.t3.micro", // 開発環境用の小さいインスタンス
  allocatedStorage: config.getNumber("rdsAllocatedStorage") || 20,
  storageType: "gp3",
  engine: "postgres",
  engineVersion: "15.7", // 利用可能な最新の15系バージョンに変更
  dbName: "ss_azure_db",
  username: "dbadmin",
  // パスワードはシークレットとして管理
  password: config.requireSecret("rdsPassword"),
};

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

// DBサブネットグループの作成
const dbSubnetGroup = new aws.rds.SubnetGroup(getResourceName("db-subnet-group"), {
  subnetIds: [privateSubnet1.id, privateSubnet2.id],
  description: `DB subnet group for ${projectName} ${environment}`,
  tags: {
    ...commonTags,
    Name: getResourceName("db-subnet-group"),
  },
});

// DBパラメータグループの作成
const dbParameterGroup = new aws.rds.ParameterGroup(getResourceName("db-params"), {
  family: "postgres15",
  description: `DB parameter group for ${projectName} ${environment}`,
  parameters: [
    {
      name: "shared_preload_libraries",
      value: "pg_stat_statements",
    },
    {
      name: "log_statement",
      value: "all",
    },
    {
      name: "log_min_duration_statement",
      value: "1000", // 1秒以上のクエリをログに記録
    },
  ],
  tags: {
    ...commonTags,
    Name: getResourceName("db-params"),
  },
});

// RDS PostgreSQLインスタンスの作成
export const rdsInstance = new aws.rds.Instance(getResourceName("rds"), {
  identifier: getResourceName("rds"),
  
  // エンジン設定
  engine: rdsConfig.engine,
  engineVersion: rdsConfig.engineVersion,
  
  // インスタンス設定
  instanceClass: rdsConfig.instanceClass,
  allocatedStorage: rdsConfig.allocatedStorage,
  storageType: rdsConfig.storageType,
  storageEncrypted: true,
  
  // データベース設定
  dbName: rdsConfig.dbName,
  username: rdsConfig.username,
  password: rdsConfig.password,
  
  // ネットワーク設定
  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [rdsSecurityGroup.id],
  publiclyAccessible: false,
  
  // パラメータグループ
  parameterGroupName: dbParameterGroup.name,
  
  // バックアップ設定
  backupRetentionPeriod: environment === "production" ? 7 : 1,
  backupWindow: "03:00-04:00",
  maintenanceWindow: "sun:04:00-sun:05:00",
  
  // 高可用性設定（本番環境のみ）
  multiAz: environment === "production",
  
  // 削除保護（本番環境のみ）
  deletionProtection: environment === "production",
  skipFinalSnapshot: environment !== "production",
  finalSnapshotIdentifier: environment === "production" 
    ? `${getResourceName("rds")}-final-snapshot-${Date.now()}`
    : undefined,
  
  // 自動マイナーバージョンアップグレード
  autoMinorVersionUpgrade: true,
  applyImmediately: environment !== "production",
  
  // CloudWatch Logs
  enabledCloudwatchLogsExports: ["postgresql"],
  
  tags: {
    ...commonTags,
    Name: getResourceName("rds"),
  },
});

// RDS接続情報の出力
export const rdsOutputs = {
  endpoint: rdsInstance.endpoint,
  address: rdsInstance.address,
  port: rdsInstance.port,
  dbName: rdsConfig.dbName,
  username: rdsConfig.username,
  // 接続文字列（Container Instancesで使用）
  connectionString: pulumi.secret(
    pulumi.interpolate`postgresql://${rdsConfig.username}:${rdsConfig.password}@${rdsInstance.endpoint}/${rdsConfig.dbName}`
  ),
};