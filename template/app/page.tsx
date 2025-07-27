'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { WalletSelector } from '@/components/WalletSelector'
import {
  getCounterValue,
  isCounterInitialized,
  getAccountAPTBalance,
  getAccountInfo,
  debugContractConfig
} from '@/contracts/query'
import { 
  buildInitializeCounterTx,
  buildIncrementCounterTx,
  buildDecrementCounterTx,
  buildResetCounterTx 
} from '@/utils/contractBuilder'
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { formatAPTBalance, truncateAddress } from '@/utils'
import { UserProfile } from '@/types/counter'
import { getNetworkVariables } from '@/contracts'
import { checkAccountExists } from '@/utils/walletHelpers'

export default function Home() {
  const { account, connected } = useWallet()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 检查合约是否已部署
  const networkVariables = getNetworkVariables()
  const isContractDeployed = networkVariables.CounterModule &&
                            networkVariables.CounterModule.trim() !== ""

  // 交易处理 hooks
  const { handleSignAndExecuteTransaction: handleInitialize, isLoading: isInitializing } = 
    useBetterSignAndExecuteTransaction({ tx: buildInitializeCounterTx })
  
  const { handleSignAndExecuteTransaction: handleIncrement, isLoading: isIncrementing } = 
    useBetterSignAndExecuteTransaction({ tx: buildIncrementCounterTx })
  
  const { handleSignAndExecuteTransaction: handleDecrement, isLoading: isDecrementing } = 
    useBetterSignAndExecuteTransaction({ tx: buildDecrementCounterTx })
  
  const { handleSignAndExecuteTransaction: handleReset, isLoading: isResetting } = 
    useBetterSignAndExecuteTransaction({ tx: buildResetCounterTx })

  // 获取用户资料
  const fetchUserProfile = async () => {
    if (!account?.address) return

    setIsRefreshing(true)
    try {
      const addressString = account.address.toString()

      // 首先检查账户是否存在
      const accountExists = await checkAccountExists(addressString)
      if (!accountExists) {
        console.warn('Account does not exist on the network')
        setUserProfile({
          address: addressString,
          aptBalance: 0,
          accountInfo: null,
          counterData: null
        })
        return
      }

      const [aptBalance, accountInfo, initialized] = await Promise.all([
        getAccountAPTBalance(addressString),
        getAccountInfo(addressString),
        isCounterInitialized(addressString)
      ])

      let counterValue = null
      if (initialized) {
        counterValue = await getCounterValue(addressString)
      }

      setUserProfile({
        address: addressString,
        aptBalance,
        accountInfo,
        counterData: initialized ? {
          value: counterValue || 0,
          isInitialized: true,
          owner: addressString
        } : null
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (connected && account) {
      fetchUserProfile()
    } else {
      setUserProfile(null)
    }
  }, [connected, account])

  // 交易成功后刷新数据
  const onTransactionSuccess = () => {
    setTimeout(fetchUserProfile, 1000) // 延迟刷新确保链上数据已更新
  }

  const executeInitialize = () => {
    handleInitialize({})
      .onSuccess(onTransactionSuccess)
      .onError((error) => console.error('Initialize failed:', error))
      .execute()
  }

  const executeIncrement = () => {
    handleIncrement({})
      .onSuccess(onTransactionSuccess)
      .onError((error) => console.error('Increment failed:', error))
      .execute()
  }

  const executeDecrement = () => {
    handleDecrement({})
      .onSuccess(onTransactionSuccess)
      .onError((error) => console.error('Decrement failed:', error))
      .execute()
  }

  const executeReset = () => {
    handleReset({})
      .onSuccess(onTransactionSuccess)
      .onError((error) => console.error('Reset failed:', error))
      .execute()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">My Aptos Dapp</h1>
        </div>
        <WalletSelector />
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center p-8">
        {!connected ? (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to Aptos Counter Dapp
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Please connect your wallet to get started
            </p>
          </div>
        ) : userProfile ? (
          <div className="w-full max-w-4xl">
            {/* User Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Address:</p>
                  <p className="font-mono text-sm">{truncateAddress(userProfile.address)}</p>
                </div>
                <div>
                  <p className="text-gray-600">APT Balance:</p>
                  <p className="font-semibold">{formatAPTBalance(userProfile.aptBalance)} APT</p>
                </div>
              </div>

              {userProfile.aptBalance === 0 && !userProfile.accountInfo && (
                <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm">
                        <strong>账户未激活:</strong> 您的账户在当前网络上还没有任何交易记录。
                        在 devnet 上，您可以通过 Aptos Faucet 获取一些测试代币来激活账户。
                      </p>
                      <p className="text-xs mt-2">
                        访问: <a href="https://aptos.dev/en/network/faucet" target="_blank" rel="noopener noreferrer" className="underline">Aptos Faucet</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Counter Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Counter</h2>
                <button
                  onClick={fetchUserProfile}
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {!isContractDeployed && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold">
                        ⚠️ 合约未部署或配置错误
                      </p>
                      <p className="text-xs mt-2">
                        请检查您的 .env 文件中的合约地址配置。
                      </p>
                      <p className="text-xs mt-1">
                        当前网络: <code className="bg-red-200 px-1 rounded">{process.env.NEXT_PUBLIC_NETWORK || 'testnet'}</code>
                      </p>
                      <p className="text-xs mt-1">
                        合约地址: <code className="bg-red-200 px-1 rounded">{networkVariables.CounterModule || '未配置'}</code>
                      </p>
                    </div>
                    <button
                      onClick={() => debugContractConfig()}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Debug
                    </button>
                  </div>
                  <div className="mt-3 text-xs">
                    <p className="font-semibold">解决步骤:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>部署合约: <code className="bg-red-200 px-1 rounded">cd contracts/counter && aptos move publish</code></li>
                      <li>复制合约地址到 .env 文件中的 <code className="bg-red-200 px-1 rounded">NEXT_PUBLIC_PACKAGE_ID</code></li>
                      <li>重启开发服务器: <code className="bg-red-200 px-1 rounded">npm run dev</code></li>
                    </ol>
                  </div>
                </div>
              )}

              {!userProfile.counterData ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Counter not initialized</p>
                  <button
                    onClick={executeInitialize}
                    disabled={isInitializing}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isInitializing ? 'Initializing...' : 'Initialize Counter'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-6">
                    {userProfile.counterData.value}
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={executeDecrement}
                      disabled={isDecrementing}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {isDecrementing ? 'Processing...' : '- Decrement'}
                    </button>
                    
                    <button
                      onClick={executeIncrement}
                      disabled={isIncrementing}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {isIncrementing ? 'Processing...' : '+ Increment'}
                    </button>
                    
                    <button
                      onClick={executeReset}
                      disabled={isResetting}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      {isResetting ? 'Processing...' : 'Reset'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl">Loading user profile...</p>
          </div>
        )}
      </main>
    </div>
  )
}
