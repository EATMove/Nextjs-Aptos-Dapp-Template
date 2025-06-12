import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化 APT 余额显示
 */
export function formatAPTBalance(balance: number): string {
  const aptBalance = balance / 100000000 // APT has 8 decimal places
  return aptBalance.toFixed(4)
}

/**
 * 截断地址显示
 */
export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (address.length <= startLength + endLength) {
    return address
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * 格式化交易哈希显示
 */
export function formatTransactionHash(hash: string): string {
  return truncateAddress(hash, 8, 8)
}

/**
 * 检查是否为有效的 Aptos 地址
 */
export function isValidAptosAddress(address: string): boolean {
  try {
    // Aptos 地址应该是 64 个字符的十六进制字符串（带或不带 0x 前缀）
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address
    return /^[0-9a-fA-F]{64}$/.test(cleanAddress) || /^[0-9a-fA-F]{1,64}$/.test(cleanAddress)
  } catch {
    return false
  }
}
