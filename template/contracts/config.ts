interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet' | 'devnet';

const configs = {
    devnet: {
        CounterModule: process.env.NEXT_PUBLIC_DEVNET_PACKAGE_ID || "0x1",
    },
    testnet: {
        CounterModule: process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID || "0x1",
    },
    mainnet: {
        CounterModule: process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID || "0x1",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}

export type { NetworkType, ContractAddresses };
