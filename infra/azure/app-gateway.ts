import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";

// Application Gateway用のパブリックIPアドレスを作成
export function createAppGatewayPublicIP(
  name: string,
  resourceGroup: azure.resources.ResourceGroup
) {
  return new azure.network.PublicIPAddress(`${name}-appgw-pip`, {
    publicIpAddressName: `${name}-appgw-pip`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    publicIPAllocationMethod: "Static",
    sku: {
      name: "Standard",
    },
  });
}

// Application Gateway用のサブネット作成
export function createAppGatewaySubnet(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  vnet: azure.network.VirtualNetwork,
  addressPrefix: string
) {
  return new azure.network.Subnet(`${name}-appgw-subnet`, {
    subnetName: `${name}-appgw-subnet`,
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vnet.name,
    addressPrefix: addressPrefix,
  });
}

// Application Gatewayの作成
export function createApplicationGateway(
  name: string,
  resourceGroup: azure.resources.ResourceGroup,
  subnet: azure.network.Subnet,
  publicIP: azure.network.PublicIPAddress,
  backendIPAddress: pulumi.Input<string>
) {
  const appGatewayName = `${name}-appgw`;

  return new azure.network.ApplicationGateway(appGatewayName, {
    applicationGatewayName: appGatewayName,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
      name: "Standard_v2",
      tier: "Standard_v2",
      capacity: 1,
    },
    gatewayIPConfigurations: [
      {
        name: "appGatewayIPConfig",
        subnet: {
          id: subnet.id,
        },
      },
    ],
    frontendIPConfigurations: [
      {
        name: "appGatewayFrontendIP",
        publicIPAddress: {
          id: publicIP.id,
        },
      },
    ],
    frontendPorts: [
      {
        name: "appGatewayFrontendPort",
        port: 80,
      },
    ],
    backendAddressPools: [
      {
        name: "appGatewayBackendPool",
        backendAddresses: [
          {
            ipAddress: backendIPAddress,
          },
        ],
      },
    ],
    backendHttpSettingsCollection: [
      {
        name: "appGatewayBackendHttpSettings",
        port: 8080,
        protocol: "Http",
        cookieBasedAffinity: "Disabled",
        requestTimeout: 30,
        probe: {
          id: pulumi.interpolate`/subscriptions/${resourceGroup.id.apply(
            (id) => id.split("/")[2]
          )}/resourceGroups/${
            resourceGroup.name
          }/providers/Microsoft.Network/applicationGateways/${appGatewayName}/probes/appGatewayHealthProbe`,
        },
      },
    ],
    httpListeners: [
      {
        name: "appGatewayHttpListener",
        frontendIPConfiguration: {
          id: pulumi.interpolate`/subscriptions/${resourceGroup.id.apply(
            (id) => id.split("/")[2]
          )}/resourceGroups/${
            resourceGroup.name
          }/providers/Microsoft.Network/applicationGateways/${appGatewayName}/frontendIPConfigurations/appGatewayFrontendIP`,
        },
        frontendPort: {
          id: pulumi.interpolate`/subscriptions/${resourceGroup.id.apply(
            (id) => id.split("/")[2]
          )}/resourceGroups/${
            resourceGroup.name
          }/providers/Microsoft.Network/applicationGateways/${appGatewayName}/frontendPorts/appGatewayFrontendPort`,
        },
        protocol: "Http",
      },
    ],
    requestRoutingRules: [
      {
        name: "appGatewayRoutingRule",
        ruleType: "Basic",
        priority: 100,
        httpListener: {
          id: pulumi.interpolate`/subscriptions/${resourceGroup.id.apply(
            (id) => id.split("/")[2]
          )}/resourceGroups/${
            resourceGroup.name
          }/providers/Microsoft.Network/applicationGateways/${appGatewayName}/httpListeners/appGatewayHttpListener`,
        },
        backendAddressPool: {
          id: pulumi.interpolate`/subscriptions/${resourceGroup.id.apply(
            (id) => id.split("/")[2]
          )}/resourceGroups/${
            resourceGroup.name
          }/providers/Microsoft.Network/applicationGateways/${appGatewayName}/backendAddressPools/appGatewayBackendPool`,
        },
        backendHttpSettings: {
          id: pulumi.interpolate`/subscriptions/${resourceGroup.id.apply(
            (id) => id.split("/")[2]
          )}/resourceGroups/${
            resourceGroup.name
          }/providers/Microsoft.Network/applicationGateways/${appGatewayName}/backendHttpSettingsCollection/appGatewayBackendHttpSettings`,
        },
      },
    ],
    probes: [
      {
        name: "appGatewayHealthProbe",
        protocol: "Http",
        path: "/api/health",
        interval: 30,
        timeout: 30,
        unhealthyThreshold: 3,
        pickHostNameFromBackendHttpSettings: false,
        host: "localhost",
        port: 8080,
      },
    ],
  });
}

// Application Gateway構成のメイン関数
export function createAppGatewayInfrastructure(
  projectName: string,
  resourceGroup: azure.resources.ResourceGroup,
  vnet: azure.network.VirtualNetwork,
  containerPrivateIP: pulumi.Input<string>
) {
  // Application Gateway用サブネット
  const appGatewaySubnet = createAppGatewaySubnet(
    `${projectName}-${pulumi.getStack()}`,
    resourceGroup,
    vnet,
    "10.0.2.0/24"
  );

  // Application Gateway用パブリックIP
  const appGatewayPublicIP = createAppGatewayPublicIP(
    `${projectName}-${pulumi.getStack()}`,
    resourceGroup
  );

  // Application Gateway
  const applicationGateway = createApplicationGateway(
    `${projectName}-${pulumi.getStack()}`,
    resourceGroup,
    appGatewaySubnet,
    appGatewayPublicIP,
    containerPrivateIP
  );

  return {
    appGatewaySubnet,
    appGatewayPublicIP,
    applicationGateway,
  };
}
