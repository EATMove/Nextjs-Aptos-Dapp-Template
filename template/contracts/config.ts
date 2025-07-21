interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet' | 'devnet' | 'movement-testnet' | 'movement-mainnet';

const configs = {
    devnet: {
        CounterModule: process.env.NEXT_PUBLIC_DEVNET_PACKAGE_ID!,
    },
    testnet: {
        CounterModule: process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID!,
    },
    mainnet: {
        CounterModule: process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID!,
    },
    'movement-testnet': {
        CounterModule: process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID!,
    },
    'movement-mainnet': {
        CounterModule: process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID!,
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}

export type { NetworkType, ContractAddresses };
