'use client'

import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { truncateAddress } from '@/utils'
import Image from 'next/image'

export function WalletSelector() {
  const { account, connected, disconnect, wallets, connect } = useWallet()

  if (connected && account) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm shadow-lg shadow-indigo-900/30 backdrop-blur">
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
          Connected
        </span>
        <span className="font-mono text-xs text-indigo-100">
          {truncateAddress(account.address.toString())}
        </span>
        <button
          onClick={disconnect}
          className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/50 hover:bg-white/20"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => connect(wallet.name)}
          className="flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/30 px-4 py-2 text-sm font-medium text-white transition hover:border-indigo-300/60 hover:bg-indigo-500/40"
        >
          {wallet.icon && (
            <Image
              src={wallet.icon}
              alt={wallet.name}
              width={20}
              height={20}
              className="h-5 w-5 rounded-full"
            />
          )}
          <span>Connect {wallet.name}</span>
        </button>
      ))}
    </div>
  )
}
