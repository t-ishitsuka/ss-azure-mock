import * as pulumi from "@pulumi/pulumi";

// Azure インフラストラクチャのインポート
import { outputs as azureOutputs } from "./azure";

// AWS インフラストラクチャのインポート（将来的に追加）
// import { outputs as awsOutputs } from "./aws";

// プロジェクト全体の設定
const config = new pulumi.Config();
const projectName = config.get("projectName") || "ss-azure";
const environment = pulumi.getStack();

// 出力
// Azure 関連の出力
export const azure = {
  resourceGroupName: azureOutputs.resourceGroupName,
  containerGroupName: azureOutputs.containerGroupName,
  containerUrl: azureOutputs.containerUrl,
  containerRegistryLoginServer: azureOutputs.containerRegistryLoginServer,
  appInsightsInstrumentationKey: azureOutputs.appInsightsInstrumentationKey,
  appInsightsConnectionString: azureOutputs.appInsightsConnectionString,
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