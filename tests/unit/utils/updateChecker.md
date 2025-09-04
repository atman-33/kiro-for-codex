# UpdateChecker 单元测试用例

## 测试文件

`updateChecker.test.ts`

## 测试目的

确保 UpdateChecker 服务在代码更新后仍然正常工作，包括版本检查、通知显示、用户交互和速率限制等核心功能。

## 测试用例概览

| 用例 ID | 功能描述                   | 测试类型 |
| ------- | -------------------------- | -------- |
| UC-01   | 从 GitHub API 获取最新版本 | 正向测试 |
| UC-02   | 处理 API 网络错误          | 异常测试 |
| UC-03   | 处理非 200 响应            | 异常测试 |
| UC-04   | 比较语义版本号             | 正向测试 |
| UC-05   | 显示更新通知               | 正向测试 |
| UC-06   | 点击查看更新日志           | 正向测试 |
| UC-07   | 点击跳过版本               | 正向测试 |
| UC-08   | 跳过版本后不再提示         | 正向测试 |
| UC-09   | 24 小时内不重复检查        | 正向测试 |
| UC-10   | 强制检查无视速率限制       | 正向测试 |

## 详细测试步骤

### UC-01: 从 GitHub API 获取最新版本

**测试目的**: 验证 UpdateChecker 能够成功从 GitHub API 获取最新版本信息

**准备数据**:

- Mock fetch 返回成功响应
- 模拟 GitHub Release API 响应格式：

  ```json
  {
    "tag_name": "v0.1.8",
    "name": "Release v0.1.8",
    "html_url": "https://github.com/notdp/kiro-for-cc/releases/tag/v0.1.8",
    "body": "Release notes"
  }
  ```

**测试步骤**:

1. 创建 UpdateChecker 实例
2. 调用 `checkForUpdates()` 方法
3. 验证 fetch 被正确调用
4. 检查日志输出

**预期结果**:

- fetch 调用 URL: `https://api.github.com/repos/notdp/kiro-for-cc/releases/latest`
- 日志包含: `[UpdateChecker] Fetching latest release from GitHub...`
- 日志包含: `[UpdateChecker] Latest release: v0.1.8`

### UC-02: 处理 API 网络错误

**测试目的**: 验证系统能优雅地处理网络错误

**准备数据**:

- Mock fetch 抛出网络错误
- 错误信息：`Network error`

**测试步骤**:

1. 配置 fetch mock 抛出错误
2. 调用 `checkForUpdates()`
3. 验证错误被捕获
4. 检查错误日志

**预期结果**:

- 不会抛出未捕获的异常
- 日志包含: `[UpdateChecker] ERROR: Failed to fetch latest release: Error: Network error`
- 系统继续正常运行

### UC-03: 处理非 200 响应

**测试目的**: 验证系统能正确处理 HTTP 错误状态码

**准备数据**:

- Mock fetch 返回 404 响应
- 状态文本：`Not Found`

**测试步骤**:

1. 配置 fetch 返回非 OK 响应
2. 调用 `checkForUpdates()`
3. 验证响应处理逻辑
4. 检查日志输出

**预期结果**:

- 不显示更新通知
- 日志包含: `[UpdateChecker] GitHub API returned 404: Not Found`
- 方法正常返回

### UC-04: 比较语义版本号

**测试目的**: 验证版本比较逻辑的正确性

**准备数据**:

- 测试用例矩阵：

  | 当前版本 | 最新版本 | 应该更新 |
  | -------- | -------- | -------- |
  | 0.1.8    | v0.1.9   | 是       |
  | 0.1.8    | v0.2.0   | 是       |
  | 0.1.8    | v1.0.0   | 是       |
  | 0.1.8    | v0.1.8   | 否       |
  | 0.1.9    | v0.1.8   | 否       |
  | 1.0.0    | v0.9.9   | 否       |

**测试步骤**:

1. 对每个测试用例：
   - 设置当前版本
   - Mock API 返回最新版本
   - 调用 `checkForUpdates()`
   - 验证是否显示通知

**预期结果**:

- 新版本时显示通知
- 相同或旧版本时不显示通知
- 版本号前缀 'v' 被正确处理

### UC-05: 显示更新通知

**测试目的**: 验证更新通知的显示格式和内容

**准备数据**:

- 当前版本：0.1.8
- 最新版本：v0.1.9

**测试步骤**:

1. 配置版本差异触发更新
2. 调用 `checkForUpdates()`
3. 验证通知内容
4. 检查按钮选项

**预期结果**:

- 通知消息：`🎉 Kiro for CC 0.1.9 is available! (current: 0.1.8)`
- 按钮选项：["View Changelog", "Skip"]
- 使用 showInformationMessage 方法

### UC-06: 点击查看更新日志

**测试目的**: 验证点击"查看更新日志"按钮的行为

**准备数据**:

- Mock 用户点击 "View Changelog"
- 预期 URL：`https://github.com/notdp/kiro-for-cc/releases/latest`

**测试步骤**:

1. 触发更新通知
2. 模拟用户点击 "View Changelog"
3. 等待异步操作完成
4. 验证外部链接调用

**预期结果**:

- vscode.env.openExternal 被调用
- 传入正确的 GitHub releases URL
- 使用 vscode.Uri.parse 处理 URL

### UC-07: 点击跳过版本

**测试目的**: 验证跳过版本功能的实现

**准备数据**:

- Mock 用户点击 "Skip"
- 跳过的版本：0.1.9

**测试步骤**:

1. 触发更新通知
2. 模拟用户点击 "Skip"
3. 等待异步操作完成
4. 验证状态保存

**预期结果**:

- globalState.update 被调用
- 保存键：`kfc.skipVersion`
- 保存值：`0.1.9`
- 显示 5 秒自动消失的确认通知

### UC-08: 跳过版本后不再提示

**测试目的**: 验证已跳过的版本不会再次提示

**准备数据**:

- 设置已跳过版本：0.1.9
- API 返回相同版本

**测试步骤**:

1. Mock globalState 返回跳过的版本
2. 调用 `checkForUpdates()`
3. 验证通知行为

**预期结果**:

- 不显示更新通知
- 即使版本号更新也被忽略
- 日志正常记录检查过程

### UC-09: 24 小时内不重复检查

**测试目的**: 验证速率限制功能避免频繁检查

**准备数据**:

- 设置上次检查时间：1 小时前
- 检查间隔：24 小时

**测试步骤**:

1. Mock 上次检查时间戳
2. 调用 `checkForUpdates()`
3. 验证 API 调用

**预期结果**:

- fetch 不被调用
- 直接返回，跳过检查
- 减少不必要的 API 请求

### UC-10: 强制检查无视速率限制

**测试目的**: 验证强制检查参数能绕过速率限制

**准备数据**:

- 设置上次检查时间：1 小时前
- 使用 force 参数

**测试步骤**:

1. Mock 上次检查时间戳
2. 调用 `checkForUpdates(true)`
3. 验证 API 被调用

**预期结果**:

- fetch 被正常调用
- 忽略速率限制
- 更新最后检查时间

## 测试注意事项

### Mock 策略

- 使用 Jest mock 模拟 vscode API
- Mock fetch 全局函数
- Mock NotificationUtils 避免实际通知
- 每个测试前清理所有 mock

### 异步处理

- 通知按钮回调是异步的
- 使用 `setTimeout(resolve, 0)` 等待异步操作
- 确保 Promise 链完成后再验证

### 状态管理

- globalState 用于持久化配置
- 跳过版本信息需要持久保存
- 最后检查时间用于速率限制

### 版本号处理

- GitHub tag 可能包含 'v' 前缀
- 内部比较时需要去除前缀
- 支持 major.minor.patch 格式

### 错误边界

- 网络错误不应影响扩展运行
- API 限流返回 403 需要优雅处理
- 无效的版本号格式需要容错
