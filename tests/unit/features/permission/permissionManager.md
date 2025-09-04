# PermissionManager 单元测试用例

## 测试文件

`permissionManager.test.ts`

## 测试目的

确保 PermissionManager 服务正确管理权限系统的整体流程，包括权限初始化、权限检查、权限授予、UI 管理、事件处理等核心功能。该模块是权限系统的核心管理器，协调其他组件完成权限验证流程。

## 测试用例概览

| 用例 ID | 功能描述                                    | 测试类型 |
| ------- | ------------------------------------------- | -------- |
| PM-01   | 初始化权限系统并启动监控                    | 正向测试 |
| PM-02   | 有权限时初始化直接返回 true                 | 正向测试 |
| PM-03   | 无权限时显示权限设置界面                    | 正向测试 |
| PM-04   | 权限从 false 变为 true 时关闭 UI 并显示通知 | 正向测试 |
| PM-05   | 权限从 true 变为 false 时显示警告和设置界面 | 正向测试 |
| PM-06   | 检查权限使用缓存                            | 正向测试 |
| PM-07   | 授予权限更新配置和缓存                      | 正向测试 |
| PM-08   | 重试机制处理权限拒绝                        | 正向测试 |
| PM-09   | 用户选择卸载扩展                            | 正向测试 |
| PM-10   | 重置权限触发事件并显示设置界面              | 正向测试 |

## 详细测试步骤

### PM-01: 初始化权限系统并启动监控

**测试目的**: 验证权限系统初始化时启动文件监控

**准备数据**:

- Mock PermissionCache 返回 false
- Mock ConfigReader.watchConfigFile

**测试步骤**:

1. 创建 PermissionManager 实例
2. 调用 `initializePermissions()`
3. 验证监控启动
4. 验证缓存刷新被调用

**预期结果**:

- `startMonitoring()` 被调用
- ConfigReader.watchConfigFile 被调用
- 日志包含: `[PermissionManager] Initializing permissions...`
- 日志包含: `[PermissionManager] Starting file monitoring...`

### PM-02: 有权限时初始化直接返回 true

**测试目的**: 验证已有权限时快速返回

**准备数据**:

- Mock cache.refreshAndGet 返回 true

**测试步骤**:

1. 创建 PermissionManager 实例
2. 调用 `initializePermissions()`
3. 验证返回值和流程

**预期结果**:

- 返回 `true`
- 不显示权限设置界面
- 日志包含: `[PermissionManager] Permissions already granted`
- 仍然启动文件监控

### PM-03: 无权限时显示权限设置界面

**测试目的**: 验证无权限时的完整设置流程

**准备数据**:

- Mock cache.refreshAndGet 返回 false
- Mock showPermissionSetup 返回 true

**测试步骤**:

1. 创建 PermissionManager 实例
2. 调用 `initializePermissions()`
3. 验证权限设置流程

**预期结果**:

- `showPermissionSetup()` 被调用
- 创建权限终端
- 创建权限 WebView
- 最终返回 `true`

### PM-04: 权限从 false 变为 true 时关闭 UI 并显示通知

**测试目的**: 验证权限授予时的事件处理

**准备数据**:

- 设置事件监听器
- 模拟权限变化事件

**测试步骤**:

1. 创建 PermissionManager 实例
2. 触发缓存事件，参数为 true
3. 验证 UI 关闭和通知

**预期结果**:

- `closeUIElements()` 被调用
- WebView 被关闭
- 终端被关闭
- 显示成功通知: `✅ Claude Code permissions detected and verified!`

### PM-05: 权限从 true 变为 false 时显示警告和设置界面

**测试目的**: 验证权限撤销时的事件处理

**准备数据**:

- 设置事件监听器
- 模拟权限撤销事件

**测试步骤**:

1. 创建 PermissionManager 实例
2. 触发缓存事件，参数为 false
3. 验证警告和设置界面

**预期结果**:

- 显示警告消息: `Claude Code permissions have been revoked...`
- `showPermissionSetup()` 被调用
- 日志包含: `[PermissionManager] Permission revoked detected`

### PM-06: 检查权限使用缓存

**测试目的**: 验证权限检查直接使用缓存

**准备数据**:

- Mock cache.get 返回 true

**测试步骤**:

1. 创建 PermissionManager 实例
2. 调用 `checkPermission()`
3. 验证缓存调用

**预期结果**:

- cache.get() 被调用
- 返回缓存的值
- 不触发文件读取

### PM-07: 授予权限更新配置和缓存

**测试目的**: 验证权限授予的完整流程

**准备数据**:

- Mock ConfigReader.setBypassPermission
- Mock cache.refresh

**测试步骤**:

1. 创建 PermissionManager 实例
2. 调用 `grantPermission()`
3. 验证配置更新和缓存刷新

**预期结果**:

- ConfigReader.setBypassPermission(true) 被调用
- cache.refresh() 被调用
- 返回 `true`
- 日志包含: `[PermissionManager] Permission granted via WebView`

### PM-08: 重试机制处理权限拒绝

**测试目的**: 验证用户拒绝权限后的重试流程

**准备数据**:

- Mock 初始权限为 false
- Mock showPermissionSetup 第一次返回 false
- Mock 用户选择 "Try Again"
- Mock 第二次返回 true

**测试步骤**:

1. 创建 PermissionManager 实例
2. 调用 `initializePermissions()`
3. 模拟用户拒绝然后重试
4. 验证重试流程

**预期结果**:

- 显示警告消息
- 提供 "Try Again" 和 "Uninstall" 选项
- 第二次调用 showPermissionSetup
- 最终返回 `true`

### PM-09: 用户选择卸载扩展

**测试目的**: 验证用户选择卸载的流程

**准备数据**:

- Mock 用户选择 "Uninstall"
- Mock 确认对话框

**测试步骤**:

1. 创建 PermissionManager 实例
2. 模拟无权限状态
3. 用户选择卸载
4. 确认卸载

**预期结果**:

- 显示确认对话框
- 执行卸载命令: `workbench.extensions.uninstallExtension`
- 日志包含: `[PermissionManager] User chose to uninstall`

### PM-10: 重置权限触发事件并显示设置界面

**测试目的**: 验证权限重置功能

**准备数据**:

- Mock ConfigReader.setBypassPermission
- Mock cache.refresh

**测试步骤**:

1. 创建 PermissionManager 实例
2. 调用 `resetPermission()`
3. 验证重置流程

**预期结果**:

- ConfigReader.setBypassPermission(false) 被调用
- cache.refresh() 被调用
- 返回 `true`
- 触发权限变化事件（自动显示设置界面）

## 测试注意事项

### Mock 策略

- Mock ConfigReader 和 PermissionCache
- Mock PermissionWebview.createOrShow 静态方法
- Mock ClaudeCodeProvider.createPermissionTerminal 静态方法
- Mock vscode.window 的各种消息方法
- Mock vscode.commands.executeCommand

### 事件处理

- PermissionManager 监听 cache 的事件
- 测试需要模拟事件触发
- 验证事件处理的副作用

### UI 管理

- WebView 和终端的创建和销毁
- 确保 UI 元素正确关闭
- 处理 WebView 的回调（onAccept, onCancel, onDispose）

### 异步流程

- showPermissionSetup 返回 Promise
- 需要正确处理 Promise 链
- 重试循环是异步的

### 错误处理

- 权限授予失败的处理
- 卸载命令失败的处理
- WebView 创建失败的处理

### 资源清理

- dispose 方法清理所有资源
- 包括事件监听器、WebView、终端
- 调用子组件的 dispose 方法
