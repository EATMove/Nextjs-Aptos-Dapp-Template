import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { getContractConfig, NetworkType, ContractAddresses } from "./config";

// 网络配置映射
const NETWORK_MAPPING: Record<NetworkType, Network> = {
    devnet: Network.DEVNET,
    testnet: Network.TESTNET,
    mainnet: Network.MAINNET,
};

// 当前网络
const currentNetwork = (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || "devnet";

// 创建 Aptos 配置
const aptosConfig = new AptosConfig({
    network: NETWORK_MAPPING[currentNetwork],
});

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
    NETWORK_MAPPING
};

export type { ContractAddresses };
