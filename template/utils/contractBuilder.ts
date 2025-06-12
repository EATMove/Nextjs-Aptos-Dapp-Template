import { createBetterTxFactory } from '@/contracts'

/**
 * 初始化计数器交易
 */
export const buildInitializeCounterTx = createBetterTxFactory<{}>(
    (networkVariables) => {
        const moduleAddress = networkVariables.CounterModule

        return {
            data: {
                function: `${moduleAddress}::counter::initialize`,
                functionArguments: [],
            }
        }
    }
)

/**
 * 增加计数器交易
 */
export const buildIncrementCounterTx = createBetterTxFactory<{}>(
    (networkVariables) => {
        const moduleAddress = networkVariables.CounterModule
        
        return {
            data: {
                function: `${moduleAddress}::counter::increment`,
                functionArguments: [],
            }
        }
    }
)

/**
 * 减少计数器交易
 */
export const buildDecrementCounterTx = createBetterTxFactory<{}>(
    (networkVariables) => {
        const moduleAddress = networkVariables.CounterModule
        
        return {
            data: {
                function: `${moduleAddress}::counter::decrement`,
                functionArguments: [],
            }
        }
    }
)

/**
 * 重置计数器交易
 */
export const buildResetCounterTx = createBetterTxFactory<{}>(
    (networkVariables) => {
        const moduleAddress = networkVariables.CounterModule
        
        return {
            data: {
                function: `${moduleAddress}::counter::reset`,
                functionArguments: [],
            }
        }
    }
)
