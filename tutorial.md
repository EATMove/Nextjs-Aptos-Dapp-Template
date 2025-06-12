# 交易处理系统: BetterTx

BetterTx 是这个模板中的核心交易处理系统，它通过类型安全的方式处理各种复杂度的交易参数。

## 计数器的 BetterTx 实践

### 1. 无参数交易（计数器示例）

计数器合约的函数都是无参数的，这是最简单的使用场景：

```typescript
// 定义交易构建器 (utils/contractBuilder.ts)
export const buildIncrementCounterTx = createBetterTxFactory<{}>(
    (networkVariables) => {
        const moduleAddress = networkVariables.CounterModule
        
        return {
            data: {
                function: `${moduleAddress}::counter::increment`,
                functionArguments: [], // 无参数
            }
        }
    }
)

// 在组件中使用 (pages/index.tsx)
const { handleSignAndExecuteTransaction: handleIncrement, isLoading } = 
  useBetterSignAndExecuteTransaction({ tx: buildIncrementCounterTx })

// 执行交易 (app/page.tsx)
const executeIncrement = () => {
  handleIncrement({}) // 传入空对象
    .onSuccess(() => console.log('成功'))
    .onError((error) => console.error('失败:', error))
    .execute()
}
```

### 2. 计数器的完整流程

```typescript
// 1. 初始化
const executeInitialize = () => {
  handleInitialize({})
    .onSuccess(onTransactionSuccess)
    .onError((error) => console.error('Initialize failed:', error))
    .execute()
}

// 2. 增加
const executeIncrement = () => {
  handleIncrement({})
    .onSuccess(onTransactionSuccess)
    .onError((error) => console.error('Increment failed:', error))
    .execute()
}

// 3. 减少
const executeDecrement = () => {
  handleDecrement({})
    .onSuccess(onTransactionSuccess)
    .onError((error) => console.error('Decrement failed:', error))
    .execute()
}

// 4. 重置
const executeReset = () => {
  handleReset({})
    .onSuccess(onTransactionSuccess)
    .onError((error) => console.error('Reset failed:', error))
    .execute()
}
```

## 多参数交易处理

### 1. 单参数交易

```typescript
// 定义参数类型
export const buildSetCounterTx = createBetterTxFactory<{ value: number }>(
    (networkVariables, params) => {
        const moduleAddress = networkVariables.CounterModule
        
        return {
            data: {
                function: `${moduleAddress}::counter::set_value`,
                functionArguments: [params.value], // 使用参数
            }
        }
    }
)

// 使用
const { handleSignAndExecuteTransaction: handleSetCounter } = 
  useBetterSignAndExecuteTransaction({ tx: buildSetCounterTx })

handleSetCounter({ value: 42 })
  .beforeExecute(async () => {
    if (value < 0) {
      alert('值不能为负数')
      return false // 阻止执行
    }
    return true
  })
  .onSuccess((result) => console.log('设置成功:', result))
  .execute()
```

### 2. 多参数交易

```typescript
// 转账示例
export const buildTransferTokenTx = createBetterTxFactory<{ 
    recipient: string
    amount: number
    tokenType?: string 
}>(
    (networkVariables, params) => {
        const moduleAddress = networkVariables.CounterModule
        
        return {
            data: {
                function: `${moduleAddress}::token::transfer`,
                functionArguments: [
                    params.recipient,
                    params.amount,
                    params.tokenType || "0x1::aptos_coin::AptosCoin"
                ],
                typeArguments: params.tokenType ? [params.tokenType] : ["0x1::aptos_coin::AptosCoin"]
            }
        }
    }
)

// 使用
handleTransfer({ 
  recipient: "0x1234...",
  amount: 100,
  tokenType: "0x1::aptos_coin::AptosCoin" // 可选
})
  .beforeExecute(async () => {
    // 验证地址格式
    if (!recipient || recipient.length !== 66) {
      alert('请输入有效的接收地址')
      return false
    }
    return true
  })
  .onSuccess((result) => {
    console.log('转账成功:', result)
    // 刷新余额等
  })
  .execute()
```

### 3. 复杂对象参数

```typescript
// NFT 创建示例
export const buildCreateNFTTx = createBetterTxFactory<{
    name: string
    description: string
    uri: string
    royalty?: {
        numerator: number
        denominator: number
        payee: string
    }
}>(
    (networkVariables, params) => {
        const moduleAddress = networkVariables.CounterModule
        
        const args = [
            params.name,
            params.description,
            params.uri
        ]
        
        // 条件性添加参数
        if (params.royalty) {
            args.push(
                params.royalty.numerator,
                params.royalty.denominator,
                params.royalty.payee
            )
        }
        
        return {
            data: {
                function: `${moduleAddress}::nft::create_nft`,
                functionArguments: args,
            }
        }
    }
)

// 使用
handleCreateNFT({
  name: "My NFT",
  description: "A beautiful NFT",
  uri: "https://example.com/nft.json",
  royalty: {
    numerator: 5,
    denominator: 100,
    payee: "0x1234..."
  }
})
  .onSuccess((result) => {
    console.log('NFT 创建成功:', result)
  })
  .execute()
```

### 4. 数组参数

```typescript
// 批量操作示例
export const buildBatchIncrementTx = createBetterTxFactory<{ 
    accounts: string[]
    amounts: number[] 
}>(
    (networkVariables, params) => {
        const moduleAddress = networkVariables.CounterModule
        
        return {
            data: {
                function: `${moduleAddress}::counter::batch_increment`,
                functionArguments: [params.accounts, params.amounts],
            }
        }
    }
)

// 使用
handleBatchIncrement({ 
  accounts: ["0x1234...", "0x5678..."],
  amounts: [5, 10]
})
  .onSuccess((result) => {
    console.log('批量操作成功:', result)
  })
  .execute()
```

## 高级特性

### 1. 前置验证

```typescript
handleTransaction(params)
  .beforeExecute(async () => {
    // 异步验证
    const isValid = await validateParams(params)
    if (!isValid) {
      return false // 阻止执行
    }
    
    // 用户确认
    const confirmed = confirm('确定要执行这个操作吗？')
    return confirmed
  })
  .execute()
```

### 2. 错误处理

```typescript
handleTransaction(params)
  .onError((error) => {
    // 根据错误类型处理
    if (error.message.includes('insufficient funds')) {
      alert('余额不足')
    } else if (error.message.includes('not found')) {
      alert('资源未找到')
    } else {
      alert('交易失败: ' + error.message)
    }
  })
  .execute()
```

### 3. 完整的生命周期

```typescript
handleTransaction(params)
  .beforeExecute(async () => {
    console.log('准备执行交易...')
    setIsLoading(true)
    return true
  })
  .onSuccess((result) => {
    console.log('交易成功:', result)
    // 刷新数据
    refreshData()
    // 显示成功消息
    toast.success('操作成功!')
  })
  .onError((error) => {
    console.error('交易失败:', error)
    // 显示错误消息
    toast.error('操作失败: ' + error.message)
  })
  .onSettled((result) => {
    console.log('交易完成，结果:', result)
    setIsLoading(false)
    // 无论成功失败都执行的清理工作
  })
  .execute()
```

## 最佳实践

1. **类型安全**: 始终为参数定义明确的 TypeScript 类型
2. **参数验证**: 在 `beforeExecute` 中进行参数验证
3. **错误处理**: 为不同类型的错误提供友好的提示
4. **状态管理**: 合理使用 `isLoading` 状态
5. **数据刷新**: 在 `onSuccess` 中刷新相关数据
6. **用户体验**: 提供清晰的加载和反馈状态

## 总结

BetterTx 系统通过以下方式简化了 Aptos 交易处理：

- **类型安全**: 编译时检查参数类型
- **链式调用**: 优雅的 API 设计
- **生命周期管理**: 完整的交易执行流程控制
- **错误处理**: 统一的错误处理机制
- **状态管理**: 自动的加载状态管理

无论是简单的无参数交易（如计数器），还是复杂的多参数交易，BetterTx 都能提供一致且类型安全的处理方式。