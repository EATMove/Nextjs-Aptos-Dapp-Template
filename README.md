# create-nextjs-aptos-dapp-template

[English](./README.en.md) | 中文

一个基于 Next.js 和 Aptos SDK 构建的现代化 dApp 模板。

## 技术栈

- **前端框架**: Next.js 15 + React 18
- **区块链**: Aptos SDK (@aptos-labs/ts-sdk)
- **钱包适配**: @aptos-labs/wallet-adapter-react
- **样式**: Tailwind CSS
- **状态管理**: React Query
- **合约语言**: Move

## 快速开始

可以直接用npx模板生成器
```bash
npx create-nextjs-aptos-dapp-template
```
### 1. 安装依赖

推荐使用 bun.js 作为包管理工具：

```bash
bun install
```

或者使用 npm：

```bash
npm install
```

### 2. 环境配置

请注意`.env` 文件，可以根据需要进行调整：

```env
# 网络配置 - 支持 Aptos 和 Movement 网络
NEXT_PUBLIC_NETWORK=testnet

# 其他网络选项:
# NEXT_PUBLIC_NETWORK=devnet
# NEXT_PUBLIC_NETWORK=mainnet
# NEXT_PUBLIC_NETWORK=movement-testnet
# NEXT_PUBLIC_NETWORK=movement-mainnet

# 自定义节点配置 (可选 - 用于 Movement 网络或自定义 Aptos 节点)
# NEXT_PUBLIC_NODE_URL=https://testnet.bardock.movementnetwork.xyz/v1
# NEXT_PUBLIC_FAUCET_URL=https://faucet.testnet.bardock.movementnetwork.xyz/

# 合约地址配置 - 当前网络的合约部署地址
NEXT_PUBLIC_PACKAGE_ID="0xee653ff802641e554a547e5e0a460dcddd6dfbc603edcb364750f571c2459789"

# Movement 网络配置 (devnet/testnet/mainnet)
# NEXT_PUBLIC_NETWORK=testnet
# NEXT_PUBLIC_APTOS_NODE_URL=https://aptos.testnet.porto.movementlabs.xyz/v1
# NEXT_PUBLIC_APTOS_FAUCET_URL=https://faucet.testnet.porto.movementlabs.xyz

# 合约地址 (部署后填入)
NEXT_PUBLIC_DEVNET_PACKAGE_ID=""
NEXT_PUBLIC_TESTNET_PACKAGE_ID=""
NEXT_PUBLIC_MAINNET_PACKAGE_ID=""
```

### 3. 编译和部署 Move 合约

```bash
# 进入合约目录
cd contracts/counter

# 编译合约
aptos move compile --dev

# 测试合约
aptos move test --dev

# 部署合约 (需要配置 Aptos CLI)
aptos move publish --dev
```

### 4. 启动开发服务器

```bash
bun run dev
# 或
npm run dev
```

应用将在 `http://localhost:3000` 上运行。

## 项目结构

```
{YOUR_PROJECT_NAME}/
├── app/                   # Next.js App Router
│   ├── layout.tsx         # 应用布局
│   ├── page.tsx           # 主页面
│   ├── providers.tsx      # 钱包和查询提供者
│   └── globals.css        # 全局样式
├── contracts/             # 合约相关
│   ├── counter/           # 计数器合约源码
│   │   ├── sources/       # 合约源文件
│   │   └── Move.toml      # Move 项目配置
│   ├── config.ts          # 合约地址配置
│   ├── index.ts           # Aptos 客户端配置
│   └── query.ts           # 链上数据查询
├── hooks/                 # React Hooks
│   └── useBetterTx.ts     # 交易处理 Hook
├── utils/                 # 工具函数
│   ├── contractBuilder.ts # 合约交互构建器
│   └── index.ts           # 通用工具函数
├── types/                 # TypeScript 类型定义
│   └── counter.ts         # 计数器相关类型
└── components/            # 可复用组件
    └── WalletSelector.tsx # 钱包选择组件
```

## 使用指南

### 钱包连接

使用 `@aptos-labs/wallet-adapter-react` 进行钱包连接：

```tsx
import { useWallet } from '@aptos-labs/wallet-adapter-react'

const { account, connected, signAndSubmitTransaction } = useWallet()
```

### 合约交互

#### 发送交易

```tsx
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { buildIncrementCounterTx } from '@/utils/contractBuilder'

const { handleSignAndExecuteTransaction, isLoading } = 
  useBetterSignAndExecuteTransaction({ tx: buildIncrementCounterTx })

// 执行交易
handleSignAndExecuteTransaction({})
  .onSuccess((result) => console.log('Success:', result))
  .onError((error) => console.error('Error:', error))
  .execute()
```

#### 查询数据

```tsx
import { getCounterValue } from '@/contracts/query'

const counterValue = await getCounterValue(accountAddress)
```

### 合约配置管理

所有合约地址和网络配置都集中在 `contracts/config.ts` 中管理：

```tsx
const configs = {
    devnet: {
        CounterModule: process.env.NEXT_PUBLIC_DEVNET_PACKAGE_ID,
    },
    testnet: {
        CounterModule: process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID,
    },
    mainnet: {
        CounterModule: process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID,
    }
}
```

## 开发建议

1. **合约开发**: 先在 `contracts/counter` 目录下开发和测试您的 Move 合约
2. **前端集成**: 使用 `createBetterTxFactory` 创建类型安全的交易函数
3. **状态管理**: 利用 React Query 进行链上数据的缓存和同步
4. **钱包集成**: 项目已集成 Petra 钱包，可根据需要添加其他钱包

## PR 合并自动发布
- 当 PR 合并到 main 分支时，自动发布到 NPM
- 根据提交信息自动确定版本号
- 自动创建 GitHub Release

## 🤝 贡献

1. Fork 这个仓库
2. 提交你的更改
3. 创建 Pull Request
4. 等待自动测试和审核
5. 合并后自动发布

## 相关资源

- [交易处理方法](./tutorial.md)
- [Aptos 开发文档](https://aptos.dev/zh/build/sdks/ts-sdk)
- [Move 语言指南](https://aptos.dev/zh/build/smart-contracts)
- [Next.js 文档](https://nextjs.org/docs)

## 许可证

MIT