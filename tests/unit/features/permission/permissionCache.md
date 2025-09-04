# PermissionCache 单元测试用例

## 测试文件

`permissionCache.test.ts`

## 测试目的

确保 PermissionCache 服务正确管理权限状态缓存，包括缓存读取、刷新、事件触发等核心功能。该模块是权限验证系统的核心组件，负责缓存权限状态并在权限变化时通知其他组件。

## 测试用例概览

| 用例 ID | 功能描述                          | 测试类型 |
| ------- | --------------------------------- | -------- |
| PC-01   | 首次获取权限状态（无缓存）        | 正向测试 |
| PC-02   | 从缓存获取权限状态                | 正向测试 |
| PC-03   | 刷新缓存（不返回值）              | 正向测试 |
| PC-04   | 刷新并获取最新状态                | 正向测试 |
| PC-05   | 权限从 false 变为 true 触发事件   | 正向测试 |
| PC-06   | 权限从 true 变为 false 触发事件   | 正向测试 |
| PC-07   | 权限状态不变时不触发事件          | 正向测试 |
| PC-08   | 多次连续调用 get 使用缓存         | 性能测试 |
| PC-09   | ConfigReader 读取失败时返回 false | 异常测试 |
| PC-10   | 事件监听器正确接收权限变化        | 正向测试 |

## 详细测试步骤

### PC-01: 首次获取权限状态（无缓存）

**测试目的**: 验证首次调用 `get()` 时会从 ConfigReader 读取状态并缓存

**准备数据**:

- Mock ConfigReader 返回 true
- 确保缓存为空（首次调用）

**测试步骤**:

1. 创建 PermissionCache 实例
2. 调用 `get()` 方法
3. 验证 ConfigReader.getBypassPermissionStatus 被调用
4. 验证返回值正确

**预期结果**:

- ConfigReader.getBypassPermissionStatus 被调用一次
- 返回值为 true
- 缓存被设置

### PC-02: 从缓存获取权限状态

**测试目的**: 验证后续调用 `get()` 时直接从缓存返回，不再调用 ConfigReader

**准备数据**:

- 先调用一次 `get()` 建立缓存
- Mock ConfigReader 返回 true

**测试步骤**:

1. 创建 PermissionCache 实例
2. 第一次调用 `get()` 建立缓存
3. 第二次调用 `get()`
4. 验证 ConfigReader 调用次数

**预期结果**:

- ConfigReader.getBypassPermissionStatus 只被调用一次
- 第二次调用直接返回缓存值
- 两次返回值相同

### PC-03: 刷新缓存（不返回值）

**测试目的**: 验证 `refresh()` 方法更新缓存但不返回值

**准备数据**:

- Mock ConfigReader 初始返回 false
- 刷新后返回 true

**测试步骤**:

1. 创建 PermissionCache 实例
2. 调用 `get()` 缓存 false
3. 修改 Mock 返回值为 true
4. 调用 `refresh()`
5. 再次调用 `get()` 验证新值

**预期结果**:

- `refresh()` 返回 Promise<void>
- 缓存被更新为新值
- 后续 `get()` 返回新值

### PC-04: 刷新并获取最新状态

**测试目的**: 验证 `refreshAndGet()` 方法更新缓存并返回最新值

**准备数据**:

- Mock ConfigReader 返回 true
- 初始缓存为 false

**测试步骤**:

1. 创建 PermissionCache 实例
2. 设置初始缓存为 false
3. 调用 `refreshAndGet()`
4. 验证返回值和缓存状态

**预期结果**:

- 返回最新值 true
- 缓存被更新为 true
- ConfigReader 被调用一次

### PC-05: 权限从 false 变为 true 触发事件

**测试目的**: 验证权限授予时触发事件并记录日志

**准备数据**:

- Mock ConfigReader 初始返回 false
- 刷新后返回 true
- 设置事件监听器

**测试步骤**:

1. 创建 PermissionCache 实例
2. 注册事件监听器
3. 调用 `get()` 缓存 false
4. 修改 Mock 返回 true
5. 调用 `refreshAndGet()`
6. 验证事件触发

**预期结果**:

- 事件监听器被调用，参数为 true
- 日志包含: `[PermissionCache] Permission changed: false -> true`
- 日志包含: `[PermissionCache] Permission granted! Firing event.`

### PC-06: 权限从 true 变为 false 触发事件

**测试目的**: 验证权限撤销时触发事件并记录日志

**准备数据**:

- Mock ConfigReader 初始返回 true
- 刷新后返回 false
- 设置事件监听器

**测试步骤**:

1. 创建 PermissionCache 实例
2. 注册事件监听器
3. 调用 `get()` 缓存 true
4. 修改 Mock 返回 false
5. 调用 `refreshAndGet()`
6. 验证事件触发

**预期结果**:

- 事件监听器被调用，参数为 false
- 日志包含: `[PermissionCache] Permission changed: true -> false`
- 日志包含: `[PermissionCache] Permission revoked! Firing event.`

### PC-07: 权限状态不变时不触发事件

**测试目的**: 验证权限状态未改变时不触发事件，避免不必要的通知

**准备数据**:

- Mock ConfigReader 始终返回 true
- 设置事件监听器

**测试步骤**:

1. 创建 PermissionCache 实例
2. 注册事件监听器
3. 调用 `get()` 缓存 true
4. 调用 `refreshAndGet()`
5. 验证事件未触发

**预期结果**:

- 事件监听器不被调用
- 不输出权限变化日志
- 缓存值保持不变

### PC-08: 多次连续调用 get 使用缓存

**测试目的**: 验证缓存机制的性能优势，避免频繁文件读取

**准备数据**:

- Mock ConfigReader 返回 true
- 模拟多次连续调用

**测试步骤**:

1. 创建 PermissionCache 实例
2. 连续调用 `get()` 10 次
3. 验证 ConfigReader 调用次数
4. 验证所有返回值一致

**预期结果**:

- ConfigReader.getBypassPermissionStatus 只被调用一次
- 所有调用返回相同值
- 后续调用立即返回（无异步等待）

### PC-09: ConfigReader 读取失败时返回 false

**测试目的**: 验证错误处理机制，确保系统在读取失败时安全降级

**准备数据**:

- Mock ConfigReader 抛出错误
- 错误信息：`File read error`

**测试步骤**:

1. 创建 PermissionCache 实例
2. 配置 ConfigReader Mock 抛出错误
3. 调用 `get()`
4. 验证返回值和错误处理

**预期结果**:

- 返回 false（安全默认值）
- 不抛出未捕获的异常
- 缓存值为 false

### PC-10: 事件监听器正确接收权限变化

**测试目的**: 验证 EventEmitter 机制正确工作，支持多个监听器

**准备数据**:

- Mock ConfigReader 返回值变化序列
- 注册多个事件监听器

**测试步骤**:

1. 创建 PermissionCache 实例
2. 注册 3 个不同的事件监听器
3. 触发权限变化（false -> true）
4. 验证所有监听器被调用
5. 移除一个监听器
6. 再次触发权限变化
7. 验证剩余监听器被调用

**预期结果**:

- 所有注册的监听器都接收到事件
- 监听器接收正确的参数值
- 移除的监听器不再被调用
- 剩余监听器继续正常工作

## 测试注意事项

### Mock 策略

- Mock ConfigReader 的 `getBypassPermissionStatus` 方法
- Mock OutputChannel 的 `appendLine` 方法
- 使用 Jest 的 `jest.fn()` 跟踪调用

### 事件系统测试

- PermissionCache 继承自 vscode.EventEmitter<boolean>
- 使用 `event` 属性注册监听器
- 事件只在权限状态变化时触发
- 支持多个监听器同时工作

### 缓存机制

- 缓存使用 private 字段 `cache?: boolean`
- undefined 表示未缓存，需要读取
- 缓存后的值可能是 false（有效缓存）
- 刷新操作会更新缓存

### 日志输出

- 权限变化时输出详细日志
- 包含旧值和新值的对比
- 区分授权和撤销两种情况
- 状态不变时不输出日志

### 异步操作

- 所有方法返回 Promise
- ConfigReader 操作是异步的
- 事件触发是同步的
- 测试需要正确处理 Promise

### 边界条件

- 首次调用时缓存为 undefined
- false 是有效的缓存值
- 连续相同的刷新不触发事件
- ConfigReader 异常时返回 false
