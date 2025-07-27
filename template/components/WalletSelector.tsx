'use client'

import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { truncateAddress } from '@/utils'
import Image from 'next/image'

export function WalletSelector() {
  const { account, connected, disconnect, wallets, connect } = useWallet()

  if (connected && account) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <div className="font-medium">{truncateAddress(account.address.toString())}</div>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {wallets.map((wallet) => (
          <button
            key={wallet.name}
            onClick={() => connect(wallet.name)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {wallet.icon && (
              <Image src={wallet.icon} alt={wallet.name} width={20} height={20} className="w-5 h-5" />
            )}
            <span>Connect {wallet.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
