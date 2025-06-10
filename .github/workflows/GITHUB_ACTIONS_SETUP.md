### GitHub Actions 工作流
- `.github/workflows/auto-publish.yml` - 自动发布工作流
- `.github/workflows/pr-review.yml` - PR 审核和测试工作流  
- `.github/workflows/manual-publish.yml` - 手动发布工作流

### 发布脚本
- `scripts/publish-check.js` - 发布前检查脚本

## 功能

### 1. 自动发布 (auto-publish.yml)
**触发条件**: PR 合并到 main 分支或手动触发

**功能**:
- ✅ 自动检查代码
- ✅ 运行测试
- ✅ 根据提交信息自动确定版本类型
- ✅ 发布到 NPM
- ✅ 创建 GitHub Release
- ✅ 在 PR 中添加成功评论

### 2. PR 审核 (pr-review.yml)
**触发条件**: 创建或更新 PR

**功能**:
- ✅ 运行所有测试
- ✅ 安全检查
- ✅ 版本预览
- ✅ 贡献者欢迎
- ✅ 包生成测试

### 3. 手动发布 (manual-publish.yml)
**触发条件**: 手动触发

**功能**:
- ✅ 自定义版本类型
- ✅ 预发布支持 (alpha, beta, rc)
- ✅ Dry run 测试
- ✅ 完整的发布流程

## 📊 工作流程图

```
新 PR 创建
    ↓
PR 审核工作流运行
    ├── 运行测试
    ├── 安全检查  
    ├── 版本预览
    └── 贡献者欢迎
    ↓
维护者审核 PR
    ↓
PR 合并到 main
    ↓
自动发布工作流运行
    ├── 测试
    ├── 版本升级
    ├── NPM 发布
    ├── GitHub Release
    └── PR 评论通知
    ↓
✅ 发布完成
```

## 🎯 使用场景

### 场景 1: 新贡献者提交 PR
1. 🎉 收到欢迎信息
2. 🧪 自动运行测试
3. 📊 显示版本预览
4. 👀 等待Reviewer审核
5. ✅ 合并后自动发布

### 场景 2: Bug 修复
1. 🐛 创建 bug fix PR
2. 🧪 自动测试通过
3. ⚡ 快速审核合并
4. 📦 自动发布 patch 版本

### 场景 3: 新功能发布
1. ✨ 创建 feature PR
2. 📋 显示 minor 版本预览
3. 👀 详细审核
4. 🚀 合并后自动发布 minor 版本

### 场景 4: 预发布测试
1. 🔧 使用手动发布工作流
2. 📦 发布 alpha/beta 版本
3. 🧪 社区测试
4. ✅ 稳定后发布正式版本

### 权限控制
- 维护者可以合并 PR
- NPM Token 安全存储在 GitHub Secrets
- 自动安全审计

### GitHub
- PR 状态检查
- Release 自动创建
- 详细的工作流日志

### NPM
- 自动发布到 NPM
- 版本标签管理
- 下载统计

### 常见问题

1. **NPM 发布失败**
   - 检查 NPM_TOKEN 是否正确
   - 确认 token 权限足够
   - 验证包名是否可用

2. **版本冲突**
   - 检查是否有未推送的版本标签
   - 手动解决版本冲突
   - 重新运行工作流

3. **测试失败**
   - 检查代码质量
   - 修复测试问题
   - 重新提交 PR
---