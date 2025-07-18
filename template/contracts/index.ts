import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { getContractConfig, NetworkType, ContractAddresses } from "./config";

// 当前网络
const currentNetwork = (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || "devnet";

// 网络映射配置
const NETWORK_MAPPING: Record<NetworkType, Network> = {
    devnet: Network.DEVNET,
    testnet: Network.TESTNET,
    mainnet: Network.MAINNET,
    'movement-testnet': Network.TESTNET,
    'movement-mainnet': Network.MAINNET,
};

// 创建自定义的 Aptos 配置，支持 Movement 网络
function createAptosConfig(): AptosConfig {
    const nodeUrl = process.env.NEXT_PUBLIC_APTOS_NODE_URL;
    const faucetUrl = process.env.NEXT_PUBLIC_APTOS_FAUCET_URL;

    // 如果提供了自定义的节点 URL（如 Movement），则使用自定义配置
    if (nodeUrl) {
        return new AptosConfig({
            network: NETWORK_MAPPING[currentNetwork], // 必须指定网络
            fullnode: nodeUrl,
            faucet: faucetUrl,
        });
    }

    // 否则使用官方 Aptos 网络
    return new AptosConfig({
        network: NETWORK_MAPPING[currentNetwork],
    });
}

// 创建 Aptos 配置
const aptosConfig = createAptosConfig();

// 创建 Aptos 客户端实例
const aptosClient = new Aptos(aptosConfig);

// 获取当前网络的合约配置
function getNetworkVariables(): ContractAddresses {
    return getContractConfig(currentNetwork);
}

// 创建更好的交易工厂函数
function createBetterTxFactory<T extends Record<string, unknown>>(
    fn: (networkVariables: ContractAddresses, params: T) => any
) {
    return (params: T) => {
        const networkVariables = getNetworkVariables();
        return fn(networkVariables, params);
    };
}

export {
    aptosClient,
    currentNetwork,
    getNetworkVariables,
    createBetterTxFactory,
    createAptosConfig
};

export type { ContractAddresses };
