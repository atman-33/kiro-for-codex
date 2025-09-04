# ConfigReader 单元测试用例

## 测试文件

`configReader.test.ts`

## 测试目的

确保 ConfigReader 服务正确读写配置文件，包括文件操作、JSON 解析、错误处理、文件监控等核心功能。该模块负责管理 `~/.claude.json` 配置文件中的权限状态。

## 测试用例概览

| 用例 ID | 功能描述                               | 测试类型 |
| ------- | -------------------------------------- | -------- |
| CR-01   | 读取存在的配置文件并返回权限状态       | 正向测试 |
| CR-02   | 配置文件不存在时返回 false             | 正向测试 |
| CR-03   | 配置文件 JSON 格式错误时返回 false     | 异常测试 |
| CR-04   | bypassPermissionsModeAccepted 字段缺失 | 正向测试 |
| CR-05   | 设置权限状态到新文件                   | 正向测试 |
| CR-06   | 更新现有配置文件保留其他字段           | 正向测试 |
| CR-07   | 配置文件解析失败重试机制               | 异常测试 |
| CR-08   | 创建目录如果不存在                     | 正向测试 |
| CR-09   | 文件监控触发回调                       | 正向测试 |
| CR-10   | dispose 清理文件监控                   | 正向测试 |

## 详细测试步骤

### CR-01: 读取存在的配置文件并返回权限状态

**测试目的**: 验证能正确读取配置文件中的权限状态

**准备数据**:

- Mock 文件存在且内容为：

  ```json
  {
    "bypassPermissionsModeAccepted": true,
    "otherField": "value"
  }
  ```

**测试步骤**:

1. 创建 ConfigReader 实例
2. Mock fs.existsSync 返回 true
3. Mock fs.promises.readFile 返回配置内容
4. 调用 `getBypassPermissionStatus()`
5. 验证返回值

**预期结果**:

- 返回 `true`
- 不输出错误日志
- fs.promises.readFile 被调用，路径为 `~/.claude.json`

### CR-02: 配置文件不存在时返回 false

**测试目的**: 验证文件不存在时的默认行为

**准备数据**:

- Mock fs.existsSync 返回 false

**测试步骤**:

1. 创建 ConfigReader 实例
2. 调用 `getBypassPermissionStatus()`
3. 验证返回值和日志

**预期结果**:

- 返回 `false`
- 日志包含: `[ConfigReader] Config file not found: /Users/.../`.claude.json`
- 不调用 fs.promises.readFile

### CR-03: 配置文件 JSON 格式错误时返回 false

**测试目的**: 验证 JSON 解析错误时的错误处理

**准备数据**:

- Mock 文件内容为无效 JSON: `{ invalid json }`

**测试步骤**:

1. Mock fs.existsSync 返回 true
2. Mock fs.promises.readFile 返回无效 JSON
3. 调用 `getBypassPermissionStatus()`
4. 验证错误处理

**预期结果**:

- 返回 `false`
- 日志包含: `[ConfigReader] Error reading config:`
- 不抛出未捕获的异常

### CR-04: bypassPermissionsModeAccepted 字段缺失

**测试目的**: 验证字段缺失时返回 false

**准备数据**:

- Mock 文件内容为：

  ```json
  {
    "otherField": "value"
  }
  ```

**测试步骤**:

1. Mock 文件存在并返回上述内容
2. 调用 `getBypassPermissionStatus()`
3. 验证返回值

**预期结果**:

- 返回 `false`（字段缺失或非 true 都返回 false）
- 正常完成，不报错

### CR-05: 设置权限状态到新文件

**测试目的**: 验证创建新配置文件并设置权限

**准备数据**:

- Mock 文件不存在
- 设置权限值为 true

**测试步骤**:

1. Mock fs.existsSync 返回 false
2. Mock fs.promises.mkdir 和 fs.promises.writeFile
3. 调用 `setBypassPermission(true)`
4. 验证文件操作

**预期结果**:

- fs.promises.mkdir 被调用（创建目录）
- fs.promises.writeFile 被调用，内容为：

  ```json
  {
    "bypassPermissionsModeAccepted": true
  }
  ```

- 使用 2 空格缩进
- 日志包含: `[ConfigReader] Set bypassPermissionsModeAccepted to true`

### CR-06: 更新现有配置文件保留其他字段

**测试目的**: 验证更新配置时保留原有字段

**准备数据**:

- Mock 现有文件内容：

  ```json
  {
    "bypassPermissionsModeAccepted": false,
    "apiKey": "secret",
    "theme": "dark"
  }
  ```

**测试步骤**:

1. Mock 文件存在并返回上述内容
2. 调用 `setBypassPermission(true)`
3. 验证写入的内容

**预期结果**:

- fs.promises.writeFile 被调用，内容包含所有原有字段
- `bypassPermissionsModeAccepted` 更新为 true
- 其他字段保持不变
- 保持正确的 JSON 格式

### CR-07: 配置文件解析失败重试机制

**测试目的**: 验证 JSON 解析失败时的重试逻辑

**准备数据**:

- Mock 文件内容为无效 JSON
- 重试仍然失败

**测试步骤**:

1. Mock 文件存在但内容无效
2. 调用 `setBypassPermission(true)`
3. 验证重试行为

**预期结果**:

- JSON.parse 被调用 3 次（初始 + 2 次重试）
- 日志包含重试信息
- 最终使用空对象作为配置
- 成功写入新配置

### CR-08: 创建目录如果不存在

**测试目的**: 验证自动创建配置目录

**准备数据**:

- Mock 目录不存在
- Mock fs.promises.mkdir

**测试步骤**:

1. Mock 目录检查返回 false
2. 调用 `setBypassPermission(true)`
3. 验证目录创建

**预期结果**:

- fs.promises.mkdir 被调用
- 使用 `{ recursive: true }` 选项
- 目录路径正确（用户主目录）

### CR-09: 文件监控触发回调

**测试目的**: 验证文件变化时触发回调

**准备数据**:

- Mock fs.watchFile
- 模拟文件变化事件

**测试步骤**:

1. 创建 ConfigReader 实例
2. 注册监控回调
3. 调用 `watchConfigFile(callback)`
4. 模拟文件变化
5. 验证回调被调用

**预期结果**:

- fs.watchFile 被调用，监控间隔为 2000ms
- 文件变化时回调被触发
- 日志包含: `[ConfigReader] Started watching config file`

### CR-10: dispose 清理文件监控

**测试目的**: 验证资源清理正确执行

**准备数据**:

- 已设置文件监控

**测试步骤**:

1. 创建 ConfigReader 并设置监控
2. 调用 `dispose()`
3. 验证清理操作

**预期结果**:

- fs.unwatchFile 被调用
- 日志包含: `[ConfigReader] Stopped watching config file`
- 不会再触发回调

## 测试注意事项

### Mock 策略

- Mock fs 模块的所有方法（existsSync, promises.readFile, promises.writeFile, promises.mkdir）
- Mock fs.watchFile 和 fs.unwatchFile
- Mock os.homedir() 返回固定路径
- Mock OutputChannel 的 appendLine 方法

### 文件路径处理

- 配置文件路径：`~/.claude.json`
- 需要正确处理路径拼接
- 测试时使用固定的 home 目录路径

### JSON 处理

- 写入时使用 2 空格缩进
- 保持字段顺序（虽然 JSON 不保证顺序）
- 处理各种无效 JSON 情况

### 错误处理

- 文件读写错误需要被捕获
- JSON 解析错误有重试机制
- 所有错误都记录到 OutputChannel

### 异步操作

- 所有文件操作都是异步的
- 使用 async/await 处理 Promise
- 测试需要正确处理异步

### 文件监控

- 使用 fs.watchFile 而非 fs.watch
- 监控间隔 2000ms
- 只在文件修改时间变化时触发回调
