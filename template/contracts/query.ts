import { aptosClient, getNetworkVariables } from './index'

/**
 * 获取用户的计数器值
 */
export async function getCounterValue(accountAddress: string): Promise<number | null> {
    try {
        const networkVariables = getNetworkVariables()
        const moduleAddress = networkVariables.CounterModule

        // 如果合约地址是默认的 0x1 或者为空，说明还没有部署合约
        if (moduleAddress === "0x1" || !moduleAddress || moduleAddress.trim() === "") {
            console.warn('Counter contract not deployed yet. Please deploy the contract first.')
            return null
        }

        const result = await aptosClient.view({
            payload: {
                function: `${moduleAddress}::counter::get_counter`,
                functionArguments: [accountAddress],
            },
        })

        return result[0] as number
    } catch (error) {
        console.error('Error fetching counter value:', error)
        return null
    }
}

/**
 * 检查是否已初始化计数器
 */
export async function isCounterInitialized(accountAddress: string): Promise<boolean> {
    try {
        const networkVariables = getNetworkVariables()
        const moduleAddress = networkVariables.CounterModule

        // 如果合约地址是默认的 0x1 或者为空，说明还没有部署合约
        if (moduleAddress === "0x1" || !moduleAddress || moduleAddress.trim() === "") {
            console.warn('Counter contract not deployed yet. Please deploy the contract first.')
            return false
        }

        const result = await aptosClient.view({
            payload: {
                function: `${moduleAddress}::counter::is_initialized`,
                functionArguments: [accountAddress],
            },
        })

        return result[0] as boolean
    } catch (error) {
        console.error('Error checking counter initialization:', error)
        return false
    }
}

/**
 * 获取用户账户信息
 */
export async function getAccountInfo(accountAddress: string) {
    try {
        const account = await aptosClient.getAccountInfo({
            accountAddress: accountAddress
        })
        return account
    } catch (error) {
        console.error('Error fetching account info:', error)
        // 如果账户不存在，返回 null
        if (error instanceof Error && error.message.includes('not found')) {
            return null
        }
        return null
    }
}

/**
 * 获取用户的 APT 余额
 */
export async function getAccountAPTBalance(accountAddress: string): Promise<number> {
    try {
        // 使用官方 SDK 的 getAccountAPTAmount 方法
        const balance = await aptosClient.getAccountAPTAmount({
            accountAddress: accountAddress
        })
        return balance
    } catch (error) {
        console.error('Error fetching APT balance:', error)
        // 如果账户不存在，返回 0
        if (error instanceof Error && error.message.includes('not found')) {
            return 0
        }
        return 0
    }
}

/**
 * Debug工具：检查合约配置
 */
export function debugContractConfig() {
    const networkVariables = getNetworkVariables()
    const currentNet = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

    console.log('🔍 Contract Configuration Debug:')
    console.log('Current Network:', currentNet)
    console.log('Environment Variables:')
    console.log('  NEXT_PUBLIC_DEVNET_PACKAGE_ID:', process.env.NEXT_PUBLIC_DEVNET_PACKAGE_ID)
    console.log('  NEXT_PUBLIC_TESTNET_PACKAGE_ID:', process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID)
    console.log('  NEXT_PUBLIC_MAINNET_PACKAGE_ID:', process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID)
    console.log('Network Variables:', networkVariables)
    console.log('Counter Module Address:', networkVariables.CounterModule)

    const isValidAddress = networkVariables.CounterModule &&
                          networkVariables.CounterModule !== "0x1" &&
                          networkVariables.CounterModule.trim() !== ""

    console.log('Is Valid Contract Address:', isValidAddress)

    if (!isValidAddress) {
        console.warn('⚠️  Contract not configured! Please update your .env file with the correct contract address.')
        console.log('💡 Example:')
        console.log(`   NEXT_PUBLIC_${currentNet.toUpperCase()}_PACKAGE_ID="0xYOUR_CONTRACT_ADDRESS_HERE"`)
    }

    return {
        network: currentNet,
        contractAddress: networkVariables.CounterModule,
        isValid: isValidAddress
    }
}


