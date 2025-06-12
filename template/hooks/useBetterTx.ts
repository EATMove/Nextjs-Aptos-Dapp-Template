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
                    await successCallback?.(transaction)
                } catch (error) {
                    const typedError = error instanceof Error ? error : new Error(String(error))
                    errorCallback?.(typedError)
                } finally {
                    await settledCallback?.(result)
                    setIsLoading(false)
                }
            }
        }

        return chain
    }

    return { handleSignAndExecuteTransaction, isLoading }
}
