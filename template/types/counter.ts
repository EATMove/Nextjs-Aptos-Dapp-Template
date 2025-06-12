/**
 * 计数器相关类型定义
 */

export interface CounterData {
  value: number
  isInitialized: boolean
  owner: string
}

export interface UserProfile {
  address: string
  aptBalance: number
  counterData: CounterData | null
  accountInfo: any
}
