import { aptosClient } from '@/contracts'

/**
 * 检查账户是否存在并有足够的余额
 */
export async function checkAccountExists(accountAddress: string): Promise<boolean> {
    try {
        await aptosClient.getAccountInfo({
            accountAddress: accountAddress
        })
        return true
    } catch (error) {
        console.log('Account does not exist:', accountAddress)
        return false
    }
}


