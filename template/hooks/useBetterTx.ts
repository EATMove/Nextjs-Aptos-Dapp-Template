'use client'

import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { aptosClient } from '@/contracts'
import {
  UserTransactionResponse
} from '@aptos-labs/ts-sdk'

export type BetterSignAndExecuteTransactionProps<TArgs extends unknown[] = unknown[]> = {
    tx: (...args: TArgs) => any
    options?: {
        checkSuccess?: boolean
        waitForIndexer?: boolean
        timeoutSecs?: number
    }
}

interface TransactionChain {
    beforeExecute: (callback: () => Promise<boolean | void>) => TransactionChain
    onSuccess: (callback: (result: UserTransactionResponse) => void | Promise<void>) => TransactionChain
    onError: (callback: (error: Error) => void) => TransactionChain
    onSettled: (callback: (result: UserTransactionResponse | undefined) => void | Promise<void>) => TransactionChain
    execute: () => Promise<void>
}

export function useBetterSignAndExecuteTransaction<TArgs extends unknown[] = unknown[]>({ 
    tx, 
    options = {} 
}: BetterSignAndExecuteTransactionProps<TArgs>) {
    const { signAndSubmitTransaction } = useWallet()
    const [isLoading, setIsLoading] = useState(false)
    const [lastError, setLastError] = useState<Error | null>(null)
    const [lastSuccess, setLastSuccess] = useState<boolean>(false)

    const { 
        checkSuccess = true, 
        waitForIndexer = true, 
        timeoutSecs = 30 
    } = options

    const handleSignAndExecuteTransaction = (...args: TArgs): TransactionChain => {
        const txInput = tx(...args)
        let successCallback: ((result: UserTransactionResponse) => void | Promise<void>) | undefined
        let errorCallback: ((error: Error) => void) | undefined
        let settledCallback: ((result: UserTransactionResponse | undefined) => void | Promise<void>) | undefined
        let beforeExecuteCallback: (() => Promise<boolean | void>) | undefined

        const chain: TransactionChain = {
            beforeExecute: (callback) => {
                beforeExecuteCallback = callback
                return chain
            },
            onSuccess: (callback) => {
                successCallback = callback
                return chain
            },
            onError: (callback) => {
                errorCallback = callback
                return chain
            },
            onSettled: (callback) => {
                settledCallback = callback
                return chain
            },
            execute: async () => {
                setIsLoading(true)
                setLastError(null)
                setLastSuccess(false)
                let result: UserTransactionResponse | undefined

                try {
                    // 执行前置验证
                    const validationResult = await beforeExecuteCallback?.()
                    if (validationResult === false) {
                        throw new Error('Validation failed in beforeExecute')
                    }

                    // 提交交易
                    const pendingTransaction = await signAndSubmitTransaction(txInput)

                    // 等待交易确认
                    const transaction = await aptosClient.waitForTransaction({
                        transactionHash: pendingTransaction.hash,
                        options: {
                            checkSuccess,
                            waitForIndexer,
                            timeoutSecs,
                        }
                    }) as UserTransactionResponse

                    result = transaction
                    setLastSuccess(true)
                    await successCallback?.(transaction)
                } catch (error) {
                    const typedError = error instanceof Error ? error : new Error(String(error))
                    setLastError(typedError)
                    errorCallback?.(typedError)
                } finally {
                    await settledCallback?.(result)
                    setIsLoading(false)
                }
            }
        }

        return chain
    }

    // 清除状态的函数
    const clearTransactionState = () => {
        setLastError(null)
        setLastSuccess(false)
        setIsLoading(false)
    }

    return {
        /**
         * 执行交易并支持链式回调
         * @param args - 传递给交易函数的参数
         * @returns 包含 beforeExecute, onSuccess, onError, onSettled, execute 方法的交易链
         */
        handleSignAndExecuteTransaction,

        /**
         * 当前交易的加载状态
         * 用于禁用按钮和显示加载指示器
         */
        isLoading,

        /**
         * 交易执行过程中发生的最后一个错误
         * 如果没有错误或调用 clearTransactionState() 后为 null
         */
        lastError,

        /**
         * 最后一次交易是否成功
         * 默认为 false，调用 clearTransactionState() 后也为 false
         */
        lastSuccess,

        /**
         * 清除所有交易状态（错误、成功、加载）
         * 在以下情况下调用：
         * - 模态窗口/组件关闭时
         * - 钱包重新连接时
         * - 需要重置交易状态时
         */
        clearTransactionState
    }
}
/*
=== clearTransactionState 函数详解 ===

## 为什么需要清除状态的函数？

该函数用于帮助组件管理交易执行的状态，特别是在以下场景中：

1. **钱包重新连接后的状态清理**：当用户钱包断开重连时，清除之前的交易状态
2. **模态窗口关闭时的状态重置**：确保下次打开模态窗口时是干净的状态
3. **避免状态残留问题**：防止上一次交易的错误或成功状态影响新的交易

## 核心功能

clearTransactionState() 会重置以下状态：
- lastError: null (清除错误信息)
- lastSuccess: false (重置成功标记)
- isLoading: false (停止loading状态)

## 使用示例

### 1. 基础用法 - 在模态窗口中使用

```typescript
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx';
import { borrowTX } from '@/contracts/pool_manager';

function BorrowModal({ onClose }) {
  const borrowHook = useBetterSignAndExecuteTransaction({ tx: borrowTX });

  const handleBorrow = (amount: bigint) => {
    borrowHook.handleSignAndExecuteTransaction({ amount })
      .onSuccess((result) => {
        console.log('Borrow successful:', result);
      })
      .onError((error) => {
        console.error('Borrow failed:', error);
      })
      .execute();
  };

  const handleModalClose = () => {
    // 关闭模态窗口时清除交易状态
    borrowHook.clearTransactionState();
    onClose();
  };

  return (
    <Modal onClose={handleModalClose}>
      <button
        onClick={() => handleBorrow(BigInt(1000))}
        disabled={borrowHook.isLoading}
      >
        {borrowHook.isLoading ? 'Processing...' : 'Borrow'}
      </button>

      {borrowHook.lastError && (
        <div className="error">
          Error: {borrowHook.lastError.message}
        </div>
      )}

      {borrowHook.lastSuccess && (
        <div className="success">
          Transaction completed successfully!
        </div>
      )}
    </Modal>
  );
}
```

### 2. 高级用法 - 钱包状态监听

```typescript
import { useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

function TransactionComponent() {
  const { connected, account } = useWallet();
  const borrowHook = useBetterSignAndExecuteTransaction({ tx: borrowTX }); //这里的写法等同为解构赋值

  // 监听钱包连接状态变化，自动清除交易状态
  useEffect(() => {
    if (connected && account?.address) {
      // 钱包重新连接时，清除之前的交易状态
      borrowHook.clearTransactionState();
    }
  }, [connected, account?.address]);

  return (
    <div>
      <button
        onClick={() => borrowHook.handleSignAndExecuteTransaction({ amount: BigInt(1000) }).execute()}
        disabled={borrowHook.isLoading}
      >
        {borrowHook.isLoading ? 'Processing...' : 'Execute Transaction'}
      </button>
    </div>
  );
}
```

### 3. 统一状态管理模式

```typescript
// 推荐的组件状态管理模式
function MyTransactionCard() {
  const transactionHook = useBetterSignAndExecuteTransaction({ tx: someTX });

  return (
    <TransactionModal
      // 直接使用 hook 的状态，避免双重状态管理
      currentAlert={{
        error: transactionHook.lastError?.message || null,
        success: transactionHook.lastSuccess ? "Transaction completed successfully" : null
      }}
      isLoading={transactionHook.isLoading}
      onClearAlert={() => transactionHook.clearTransactionState()} // 清除状态的回调
      onTransaction={(params) => {
        transactionHook.handleSignAndExecuteTransaction(params)
          .onSuccess(() => {
            // 成功处理逻辑
          })
          .execute();
      }}
    />
  );
}
```

## Best Prictices

1. **模态窗口关闭时调用**：确保每次打开都是全新状态
2. **钱包重连时调用**：避免状态不同步问题
3. **避免手动状态管理**：直接使用 hook 提供的状态，而不是组件内部维护额外状态
4. **统一错误处理**：使用 lastError 统一显示错误信息

## 注意事项

- 不要在交易执行过程中调用 clearTransactionState
- 建议在组件卸载或状态重置时调用
- 配合 useEffect 监听外部状态变化时使用

*/
