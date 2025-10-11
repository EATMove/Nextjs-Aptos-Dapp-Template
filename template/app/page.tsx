'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
import { cn, formatAPTBalance, truncateAddress } from '@/utils'
import { UserProfile } from '@/types/counter'
import { getNetworkVariables } from '@/contracts'
import { checkAccountExists } from '@/utils/walletHelpers'

type TransactionAlertType = 'info' | 'success' | 'error'

type TransactionAlert = {
  type: TransactionAlertType
  title: string
  message: string
}

const ALERT_THEME: Record<
  TransactionAlertType,
  {
    container: string
    icon: string
    message: string
  }
> = {
  info: {
    container: 'border-indigo-400/40 bg-indigo-500/15',
    icon: 'bg-indigo-500 text-white',
    message: 'text-indigo-100',
  },
  success: {
    container: 'border-emerald-400/40 bg-emerald-500/15',
    icon: 'bg-emerald-500 text-white',
    message: 'text-emerald-100',
  },
  error: {
    container: 'border-rose-400/40 bg-rose-500/15',
    icon: 'bg-rose-500 text-white',
    message: 'text-rose-100',
  },
}

const ALERT_ICON: Record<TransactionAlertType, string> = {
  info: '✦',
  success: '✓',
  error: '!',
}

const shortenAlertMessage = (value: string, maxLength = 120) => {
  if (!value) return ''
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`
}

  const formatAlertError = (error: Error | null) => {
  if (!error || !error.message) {
    return 'An unknown error occurred. Check the developer console for details.'
  }
  return shortenAlertMessage(error.message)
}

  const alertMessageByAction = {
  initialize: {
    pending: 'Please confirm the counter initialization in your wallet.',
    success: 'Counter initialized successfully. Status will refresh shortly.',
  },
  increment: {
    pending: 'Please confirm the increment transaction in your wallet.',
    success: 'Increment transaction submitted and confirmed.',
  },
  decrement: {
    pending: 'Please confirm the decrement transaction in your wallet.',
    success: 'Decrement transaction submitted and confirmed.',
  },
  reset: {
    pending: 'Please confirm the reset transaction in your wallet.',
    success: 'Counter has been reset to 0.',
  },
} as const

type TransactionActionKey = keyof typeof alertMessageByAction
type TransactionChainLike = {
  beforeExecute: (callback: () => Promise<boolean | void>) => TransactionChainLike
  onSuccess: (callback: (result: unknown) => void | Promise<void>) => TransactionChainLike
  onError: (callback: (error: Error) => void) => TransactionChainLike
  onSettled: (callback: (result: unknown) => void | Promise<void>) => TransactionChainLike
  execute: () => Promise<void>
}

type TransactionHook<Args extends unknown[] = []> = {
  handleSignAndExecuteTransaction: (...args: Args) => TransactionChainLike
  isLoading: boolean
  lastError: Error | null
  lastSuccess: boolean
  clearTransactionState: () => void
}

export default function Home() {
  const { account, connected } = useWallet()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [transactionAlert, setTransactionAlert] = useState<TransactionAlert | null>(null)
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearAlertTimeout = useCallback(() => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current)
      alertTimeoutRef.current = null
    }
  }, [])

  const dismissTransactionAlert = useCallback(() => {
    clearAlertTimeout()
    setTransactionAlert(null)
  }, [clearAlertTimeout])

  const showTransactionAlert = useCallback(
    (alert: TransactionAlert) => {
      clearAlertTimeout()
      setTransactionAlert(alert)
      alertTimeoutRef.current = setTimeout(() => {
        setTransactionAlert(null)
        alertTimeoutRef.current = null
      }, 4000)
    },
    [clearAlertTimeout]
  )

  // 检查合约是否已部署
  const networkVariables = getNetworkVariables()
  const isContractDeployed = networkVariables.CounterModule &&
                            networkVariables.CounterModule.trim() !== ""

  // 交易处理 hooks - 使用新的完整状态管理
  const initializeHook = useBetterSignAndExecuteTransaction({ tx: buildInitializeCounterTx })
  const incrementHook = useBetterSignAndExecuteTransaction({ tx: buildIncrementCounterTx })
  const decrementHook = useBetterSignAndExecuteTransaction({ tx: buildDecrementCounterTx })
  const resetHook = useBetterSignAndExecuteTransaction({ tx: buildResetCounterTx })

  // 监听钱包连接状态变化，清除交易状态
  useEffect(() => {
    if (connected && account?.address) {
      // 钱包重新连接时，清除所有交易状态
      initializeHook.clearTransactionState()
      incrementHook.clearTransactionState()
      decrementHook.clearTransactionState()
      resetHook.clearTransactionState()
    }
  }, [connected, account?.address, initializeHook, incrementHook, decrementHook, resetHook])

  // 自动清除成功状态（3秒后）
  useEffect(() => {
    if (initializeHook.lastSuccess) {
      const timer = setTimeout(() => {
        initializeHook.clearTransactionState()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [initializeHook.lastSuccess, initializeHook])

  useEffect(() => {
    if (incrementHook.lastSuccess || decrementHook.lastSuccess || resetHook.lastSuccess) {
      const timer = setTimeout(() => {
        incrementHook.clearTransactionState()
        decrementHook.clearTransactionState()
        resetHook.clearTransactionState()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [
    incrementHook.lastSuccess,
    decrementHook.lastSuccess,
    resetHook.lastSuccess,
    incrementHook,
    decrementHook,
    resetHook,
  ])

  useEffect(() => {
    return () => {
      clearAlertTimeout()
    }
  }, [clearAlertTimeout])

  useEffect(() => {
    if (!connected) {
      dismissTransactionAlert()
    }
  }, [connected, dismissTransactionAlert])

  // 获取用户资料
  const fetchUserProfile = useCallback(async () => {
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
  }, [account?.address])

  useEffect(() => {
    if (connected && account) {
      fetchUserProfile()
    } else {
      setUserProfile(null)
    }
  }, [connected, account, fetchUserProfile])

  // 交易成功后刷新数据
  const onTransactionSuccess = () => {
    setTimeout(fetchUserProfile, 1000) // 延迟刷新确保链上数据已更新
  }

  const executeTransaction = <Args extends unknown[]>(
    hook: TransactionHook<Args>,
    actionKey: TransactionActionKey,
    ...args: Args
  ) => {
    hook.clearTransactionState()
    showTransactionAlert({
      type: 'info',
      title: 'Waiting for wallet confirmation',
      message: alertMessageByAction[actionKey].pending,
    })

    hook
      .handleSignAndExecuteTransaction(...args)
      .onSuccess(() => {
        showTransactionAlert({
          type: 'success',
          title: 'Signed',
          message: alertMessageByAction[actionKey].success,
        })
        onTransactionSuccess()
        setTimeout(() => hook.clearTransactionState(), 4000)
      })
      .onError((error) => {
        console.error(`${actionKey} failed:`, error)
        showTransactionAlert({
          type: 'error',
          title: 'Transaction failed',
          message: formatAlertError(error),
        })
        setTimeout(() => hook.clearTransactionState(), 4000)
      })
      .execute()
  }

  const executeInitialize = () => executeTransaction(initializeHook, 'initialize', {})
  const executeIncrement = () => executeTransaction(incrementHook, 'increment', {})
  const executeDecrement = () => executeTransaction(decrementHook, 'decrement', {})
  const executeReset = () => executeTransaction(resetHook, 'reset', {})

  const addressDisplay = account?.address
    ? truncateAddress(account.address.toString())
    : 'Not connected'
  const networkName = process.env.NEXT_PUBLIC_NETWORK || 'testnet'
  const isMovementNetwork = networkName.toLowerCase().includes('movement')
  const coinSymbol = isMovementNetwork ? 'MOVE' : 'APT'
  const contractAddress = networkVariables.CounterModule?.trim()
    ? networkVariables.CounterModule
    : 'Not configured'
  const contractAddressDisplay =
    contractAddress === '未配置'
      ? contractAddress
      : truncateAddress(contractAddress, 10, 6)
  const counterInitialized = Boolean(userProfile?.counterData?.isInitialized)
  const counterValue = userProfile?.counterData?.value ?? 0
  const aptBalanceDisplay = userProfile
    ? `${formatAPTBalance(userProfile.aptBalance)} ${coinSymbol}`
    : connected && isRefreshing
      ? 'Refreshing...'
      : connected
        ? 'Loading...'
        : 'Not connected'
  const showLoadingState = connected && !userProfile

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/25 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.35),rgba(15,23,42,0))]" />
        <div className="absolute inset-0 bg-grid-slate opacity-40" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-10 sm:px-8 lg:px-12">
        <header className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-card backdrop-blur">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70">
                Aptos Dapp Template
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                EATmove
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
                {connected
                  ? 'View contract deployment status, account balance and counter interactions in real-time.'
                  : 'Connect an Aptos wallet to start interacting with the counter contract.'}
              </p>
            </div>
            <WalletSelector />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Connection
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {connected ? 'Wallet connected' : 'Not connected'}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {connected ? addressDisplay : 'Use the button at the top-right to connect your wallet.'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {coinSymbol} Balance
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {aptBalanceDisplay}
              </p>
              <p className="mt-1 text-xs text-slate-300">Real-time query results on the chain</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Counter Status
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {counterInitialized ? 'Initialized' : 'Not initialized'}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {counterInitialized ? `Current value: ${counterValue}` : 'Click initialize to start using the counter.'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Network
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {networkName}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Contract Address:{' '}
                <span
                  className="font-mono text-xs text-slate-200"
                  title={contractAddress}
                >
                  {contractAddressDisplay}
                </span>
              </p>
            </div>
          </div>
        </header>

        <main className="mt-10 flex flex-1 flex-col gap-8 pb-10">
          {!connected ? (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-12 text-center shadow-card">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/20 to-transparent" />
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Welcome to the Aptos Counter Dapp
              </h2>
              <p className="mt-4 text-sm text-slate-300 sm:text-base">
                Connect your wallet to view account info and counter status, and try the full on-chain interaction flow.
              </p>
            </div>
          ) : showLoadingState ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-card">
                <div className="h-48 animate-pulse rounded-2xl bg-white/10" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-card">
                <div className="h-48 animate-pulse rounded-2xl bg-white/10" />
              </div>
            </div>
          ) : (
            userProfile && (
              <div className="grid gap-8 lg:grid-cols-2">
                <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-card">
                  <div>
                      <h2 className="text-xl font-semibold text-white">
                        Account Information
                      </h2>
                      <p className="mt-2 text-sm text-slate-300">
                        Syncs on-chain account data in real-time to help debug contract interactions.
                      </p>
                  </div>

                  <dl className="mt-6 space-y-4 text-sm">
                    <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">
                          Address
                        </dt>
                        <dd className="mt-1 font-mono text-sm text-indigo-200">
                          {addressDisplay}
                        </dd>
                      </div>
                      <span className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-100">
                        {networkName}
                      </span>
                    </div>

                    <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">
                          {coinSymbol} Balance
                        </dt>
                        <dd className="mt-1 font-semibold text-white">
                          {formatAPTBalance(userProfile.aptBalance)} {coinSymbol}
                        </dd>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                        On-chain
                      </span>
                    </div>

                    {userProfile.accountInfo?.sequence_number && (
                      <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">
                            Sequence Number
                          </dt>
                          <dd className="mt-1 font-mono text-sm text-slate-200">
                            {userProfile.accountInfo.sequence_number}
                          </dd>
                        </div>
                        <span className="rounded-full bg-slate-500/20 px-3 py-1 text-xs font-medium text-slate-200">
                          Account Info
                        </span>
                      </div>
                    )}
                  </dl>

                    {userProfile.aptBalance === 0 && !userProfile.accountInfo && (
                    <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-left text-sm text-amber-100">
                      <p className="font-semibold">Account not activated</p>
                      <p className="mt-2 text-xs text-amber-200">
                        This account has no transaction history on the current network. Use the Aptos Faucet to receive test tokens and activate the account.
                      </p>
                      <a
                        href="https://aptos.dev/en/network/faucet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-1 text-xs font-medium text-amber-100 hover:border-amber-300/60 hover:bg-amber-400/20"
                      >
                        Open Aptos Faucet
                      </a>
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-card">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Counter Control Panel
                      </h2>
                      <p className="mt-2 text-sm text-slate-300">
                        After initialization you can increment, decrement or reset the counter. All transactions provide live feedback.
                      </p>
                    </div>
                    <button
                      onClick={fetchUserProfile}
                      disabled={isRefreshing}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:border-white/40 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>

                  {transactionAlert && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className={cn(
                        'mt-6 flex items-start gap-4 rounded-2xl border px-5 py-4 shadow-inner transition-all',
                        ALERT_THEME[transactionAlert.type].container
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0 h-10 w-10 shrink-0 rounded-full text-base font-semibold leading-none',
                          'flex items-center justify-center',
                          ALERT_THEME[transactionAlert.type].icon
                        )}
                      >
                        {ALERT_ICON[transactionAlert.type]}
                      </span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-white">{transactionAlert.title}</p>
                        <p
                          className={cn(
                            'mt-1 text-xs leading-5',
                            ALERT_THEME[transactionAlert.type].message
                          )}
                        >
                          {transactionAlert.message}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissTransactionAlert}
                        className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
                        aria-label="Dismiss alert"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {!isContractDeployed && (
                    <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-100">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <p className="font-semibold">⚠️ 合约未部署或配置错误</p>
                          <p className="text-xs text-amber-200">
                            请检查 .env 中的合约地址配置并确保已经部署 Counter 模块。
                          </p>
                          <div className="text-xs text-amber-200/80">
                            <p>
                              当前网络：{' '}
                              <code className="rounded bg-black/40 px-2 py-0.5 font-mono">
                                {networkName}
                              </code>
                            </p>
                            <p className="mt-1 break-all">
                              合约地址：{' '}
                              <code
                                className="rounded bg-black/40 px-2 py-0.5 font-mono"
                                title={contractAddress}
                              >
                                {contractAddressDisplay}
                              </code>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => debugContractConfig()}
                          className="inline-flex h-9 items-center rounded-full border border-amber-400/50 bg-amber-500/20 px-4 text-xs font-medium transition hover:border-amber-300/60 hover:bg-amber-400/30"
                        >
                          Debug
                        </button>
                      </div>
                      <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs text-amber-200">
                        <li>
                          部署合约：<code>cd contracts/counter && aptos move publish</code>
                        </li>
                        <li>
                          将合约地址写入 <code>.env</code> 中的{' '}
                          <code>NEXT_PUBLIC_PACKAGE_ID</code>
                        </li>
                        <li>重启开发服务器：<code>npm run dev</code></li>
                      </ol>
                    </div>
                  )}

                  {!counterInitialized ? (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                        <p className="text-sm text-slate-200">
                        The counter is not initialized. Click the button below to initialize and start interacting.
                      </p>

                      <button
                        onClick={executeInitialize}
                        disabled={initializeHook.isLoading}
                        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {initializeHook.isLoading ? 'Initializing...' : 'Initialize counter'}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-8 space-y-6">
                      <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-500/30 via-indigo-400/10 to-indigo-500/5 p-6 text-center shadow-inner">
                        <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/80">
                          Current Value
                        </p>
                        <p className="mt-4 text-6xl font-semibold text-white">
                          {counterValue}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          onClick={executeDecrement}
                          disabled={decrementHook.isLoading}
                          className="inline-flex items-center justify-center rounded-full border border-red-400/30 bg-red-500/20 px-6 py-3 text-sm font-semibold text-red-100 transition hover:border-red-300/50 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {decrementHook.isLoading ? 'Processing...' : '− Decrement'}
                        </button>

                        <button
                          onClick={executeIncrement}
                          disabled={incrementHook.isLoading}
                          className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/50 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {incrementHook.isLoading ? 'Processing...' : '+ Increment'}
                        </button>

                        <button
                          onClick={executeReset}
                          disabled={resetHook.isLoading}
                          className="sm:col-span-2 inline-flex items-center justify-center rounded-full border border-slate-400/30 bg-slate-500/20 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-300/50 hover:bg-slate-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {resetHook.isLoading ? 'Processing...' : 'Reset'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  )
}
