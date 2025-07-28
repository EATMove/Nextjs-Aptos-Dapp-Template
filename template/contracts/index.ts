import { getContractConfig, NetworkType, ContractAddresses } from "./config";
import { Aptos, AptosConfig, ClientConfig, Network } from "@aptos-labs/ts-sdk";

// 当前网络
const currentNetwork = (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || "testnet";

// 客户端配置 (可选)
const clientConfig: ClientConfig = {};
if (process.env.NEXT_PUBLIC_API_KEY) {
    clientConfig.API_KEY = process.env.NEXT_PUBLIC_API_KEY;
}

// 创建 Aptos 客户端配置
function getAptosConfig(): AptosConfig {
    // 检查是否有客户端配置
    const hasClientConfig = Object.keys(clientConfig).length > 0;

    switch (currentNetwork) {
        case "mainnet":
            return new AptosConfig({
                network: Network.MAINNET,
                ...(hasClientConfig && { clientConfig })
            });
        case "testnet":
            return new AptosConfig({
                network: Network.TESTNET,
                ...(hasClientConfig && { clientConfig })
            });
        case "devnet":
            return new AptosConfig({
                network: Network.DEVNET,
                ...(hasClientConfig && { clientConfig })
            });
        case "movement-testnet":
            return new AptosConfig({
                network: Network.CUSTOM,
                fullnode: process.env.NEXT_PUBLIC_NODE_URL || "https://testnet.bardock.movementnetwork.xyz/v1",
                faucet: process.env.NEXT_PUBLIC_FAUCET_URL || "https://faucet.testnet.bardock.movementnetwork.xyz/",
                ...(hasClientConfig && { clientConfig })
            });
        case "movement-mainnet":
            return new AptosConfig({
                network: Network.CUSTOM,
                fullnode: process.env.NEXT_PUBLIC_NODE_URL || "https://mainnet.movementnetwork.xyz/v1",
                ...(hasClientConfig && { clientConfig })
            });
        default:
            return new AptosConfig({
                network: Network.TESTNET,
                ...(hasClientConfig && { clientConfig })
            });
    }
}

// 创建 Aptos 客户端实例
const aptosClient = new Aptos(getAptosConfig());

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
    createBetterTxFactory
};

export type { ContractAddresses };
