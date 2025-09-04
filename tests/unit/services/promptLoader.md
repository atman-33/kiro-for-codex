# PromptLoader 单元测试用例

## 测试文件

`promptLoader.test.ts`

## 测试目的

确保 PromptLoader 服务在代码更新后仍然正常工作，包括单例模式、初始化、加载、渲染和错误处理等核心功能。

## 测试用例概览

| 用例 ID | 功能描述                   | 测试类型 |
| ------- | -------------------------- | -------- |
| PL-01   | 获取单例实例               | 正向测试 |
| PL-02   | 初始化加载所有 prompts     | 正向测试 |
| PL-03   | 通过 ID 加载 prompt        | 正向测试 |
| PL-04   | 加载不存在的 prompt        | 异常测试 |
| PL-05   | 渲染包含所有变量的 prompt  | 正向测试 |
| PL-06   | 渲染缺少可选变量的 prompt  | 正向测试 |
| PL-07   | 渲染缺少必需变量的 prompt  | 异常测试 |
| PL-08   | 渲染无变量的简单 prompt    | 正向测试 |
| PL-09   | 获取所有 prompts 列表      | 正向测试 |
| PL-10   | 处理无效的 Handlebars 语法 | 异常测试 |
| PL-11   | 处理无效的 prompt 模块     | 异常测试 |

## 详细测试步骤

### PL-01: 获取单例实例

**测试目的**: 验证 PromptLoader 实现了正确的单例模式

**准备数据**:

- 清理可能存在的实例状态

**测试步骤**:

1. 第一次调用 `PromptLoader.getInstance()`，获取实例 1
2. 第二次调用 `PromptLoader.getInstance()`，获取实例 2
3. 比较两个实例是否为同一对象

**预期结果**:

- instance1 === instance2 返回 true
- 两次调用返回相同的对象引用

### PL-02: 初始化加载所有 prompts

**测试目的**: 验证 PromptLoader 能够成功初始化并加载所有配置的 prompt 模板

**准备数据**:

- Mock prompts/target 模块，提供测试 prompts：

  ```typescript
  {
    testPrompt: { frontmatter: {...}, content: '...' },
    simplePrompt: { frontmatter: {...}, content: '...' }
  }
  ```

**测试步骤**:

1. 创建 PromptLoader 实例
2. 调用 `promptLoader.initialize()` 方法
3. 尝试加载已注册的 prompts
4. 验证加载过程没有抛出异常

**预期结果**:

- initialize() 执行成功，不抛出异常
- 内部 prompts Map 包含所有 mock 的 prompts
- 能够通过 loadPrompt() 访问已加载的 prompts

### PL-03: 通过 ID 加载 prompt

**测试目的**: 验证能够通过 prompt ID 正确加载对应的 prompt 对象

**准备数据**:

- 确保 PromptLoader 已初始化
- 存在 ID 为 'test-prompt' 的 prompt

**测试步骤**:

1. 调用 `promptLoader.loadPrompt('test-prompt')`
2. 检查返回的 prompt 对象
3. 验证 frontmatter 和 content 属性

**预期结果**:

- 返回正确的 prompt 对象
- frontmatter.id === 'test-prompt'
- frontmatter.name === 'Test Prompt'
- content 包含预期的模板内容

### PL-04: 加载不存在的 prompt

**测试目的**: 验证系统能正确处理加载不存在的 prompt 的情况

**准备数据**:

- 确保 PromptLoader 已初始化
- 使用不存在的 prompt ID：'non-existent'

**测试步骤**:

1. 调用 `promptLoader.loadPrompt('non-existent')`
2. 捕获抛出的错误
3. 验证错误信息

**预期结果**:

- 抛出错误
- 错误信息：`Prompt not found: non-existent. Available prompts: test-prompt, simple-prompt`
- 错误信息包含可用的 prompt 列表

### PL-05: 渲染包含所有变量的 prompt

**测试目的**: 验证 Handlebars 模板引擎能正确渲染包含所有变量的 prompt

**准备数据**:

- Prompt 模板：`Hello {{name}}! {{#if age}}You are {{age}} years old.{{/if}}`
- 变量数据：`{ name: 'John', age: 30 }`

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('test-prompt', { name: 'John', age: 30 })`
2. 获取渲染结果
3. 验证输出字符串

**预期结果**:

- 返回：`Hello John! You are 30 years old.`
- 所有变量正确替换
- 条件块正确渲染

### PL-06: 渲染缺少可选变量的 prompt

**测试目的**: 验证系统能正确处理可选变量缺失的情况

**准备数据**:

- Prompt 模板：`Hello {{name}}! {{#if age}}You are {{age}} years old.{{/if}}`
- 变量数据：`{ name: 'Jane' }`（缺少 age）

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('test-prompt', { name: 'Jane' })`
2. 获取渲染结果
3. 验证输出字符串

**预期结果**:

- 返回：`Hello Jane!`
- 必需变量正确替换
- 条件块因缺少变量而不渲染

### PL-07: 渲染缺少必需变量的 prompt

**测试目的**: 验证系统能正确验证必需变量并在缺失时报错

**准备数据**:

- Prompt 定义中 name 为必需变量
- 调用时不提供 name 变量：`{}`

**测试步骤**:

1. 尝试调用 `promptLoader.renderPrompt('test-prompt', {})`
2. 捕获抛出的错误
3. 验证错误类型和信息

**预期结果**:

- 抛出验证错误
- 错误信息：`Variable validation failed: Missing required variable: name`
- 渲染前进行变量验证

### PL-08: 渲染无变量的简单 prompt

**测试目的**: 验证能够正确渲染不包含任何变量的静态 prompt

**准备数据**:

- Prompt 模板：`This is a simple prompt without any variables.`
- 无需提供变量

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('simple-prompt')`
2. 获取渲染结果
3. 验证输出与原始内容一致

**预期结果**:

- 返回：`This is a simple prompt without any variables.`
- 内容保持不变
- 不需要提供变量参数

### PL-09: 获取所有 prompts 列表

**测试目的**: 验证能够获取所有已加载的 prompts 的元数据列表

**准备数据**:

- 确保 PromptLoader 已初始化
- 至少有 2 个 prompts

**测试步骤**:

1. 调用 `promptLoader.listPrompts()`
2. 检查返回的数组
3. 验证每个元素的结构

**预期结果**:

- 返回包含 2 个元素的数组
- 每个元素包含：id、name、version、category、description
- category 从 ID 中提取（如 'test-prompt' → 'test'）

### PL-10: 处理无效的 Handlebars 语法

**测试目的**: 验证系统能优雅地处理模板语法错误

**准备数据**:

- 创建包含语法错误的 prompt：`{{#if name}}Unclosed if block`

**测试步骤**:

1. 手动添加错误的 prompt 到 loader
2. 尝试编译模板
3. 验证错误处理

**预期结果**:

- Handlebars 编译时抛出错误
- 错误被正确捕获
- 不会导致系统崩溃

### PL-11: 处理无效的 prompt 模块

**测试目的**: 验证初始化时能够跳过无效的 prompt 模块

**准备数据**:

- Mock 中添加无效模块：`{ invalidPrompt: { invalid: true } }`

**测试步骤**:

1. 调用 `promptLoader.initialize()`
2. 验证初始化过程
3. 检查有效 prompts 是否正常加载

**预期结果**:

- 初始化不会因无效模块而失败
- 有效的 prompts 正常加载
- 无效模块被静默跳过

## 测试注意事项

### Mock 策略

- 使用 Jest mock 隔离 prompts/target 模块
- 每个测试前清理单例实例状态
- Mock 数据应覆盖各种边界情况

### Handlebars 特性

- 数字 0 在条件判断中被视为 falsy
- 空字符串也是 falsy
- undefined 变量不会导致错误，只是不渲染

### 性能考虑

- 模板编译结果被缓存
- 大量 prompts 时初始化可能较慢
- 考虑懒加载优化

### 测试隔离

- 每个测试应该独立运行
- 使用 beforeEach 重置状态
- 避免测试间的依赖关系
