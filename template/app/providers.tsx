'use client'

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { currentNetwork } from "@/contracts";

const queryClient = new QueryClient();

// 网络映射，支持 Movement 网络
function getWalletNetwork() {
  // 对于 Movement 网络使用自定义配置，钱包适配器会使用 TESTNET 作为基础
  if (currentNetwork.includes('movement')) {
    return currentNetwork.includes('mainnet') ? Network.MAINNET : Network.TESTNET;
  }

  // 标准 Aptos 网络
  switch (currentNetwork) {
    case 'devnet':
      return Network.DEVNET;
    case 'testnet':
      return Network.TESTNET;
    case 'mainnet':
      return Network.MAINNET;
    default:
      return Network.DEVNET;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const dappConfig = {
    network: getWalletNetwork(),
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={true}
        optInWallets={["Petra"]}
        dappConfig={dappConfig}
        onError={(error: any) => {
          console.error("Wallet connection error:", error);
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
