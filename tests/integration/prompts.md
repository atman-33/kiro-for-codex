# Prompts 集成测试用例

## 测试文件

`prompts.test.ts`

## 测试目的

确保 Prompt 系统的端到端功能在代码更新后仍然正常工作，包括真实 prompt 文件的加载、渲染、内容验证等完整流程。

## 测试用例概览

| 用例 ID | 功能描述                               | 测试类型 |
| ------- | -------------------------------------- | -------- |
| INT-01  | 生成正确的 spec 创建 prompt            | 正向测试 |
| INT-02  | 验证 spec prompt 包含目录创建指令      | 正向测试 |
| INT-03  | 生成 steering 初始化 prompt            | 正向测试 |
| INT-04  | 验证 steering prompt 包含分析指令      | 正向测试 |
| INT-05  | 验证 steering prompt 包含文件指令      | 正向测试 |
| INT-06  | 生成自定义 steering 创建 prompt        | 正向测试 |
| INT-07  | 验证自定义 steering 文件命名指令       | 正向测试 |
| INT-08  | 生成 steering 精炼 prompt              | 正向测试 |
| INT-09  | 验证精炼 prompt 改进指南               | 正向测试 |
| INT-10  | 生成 steering 删除 prompt              | 正向测试 |
| INT-11  | 验证所有 prompts 的 frontmatter        | 正向测试 |
| INT-12  | 验证所有 prompts 可成功渲染            | 正向测试 |
| INT-13  | 验证渲染内容不含模板错误               | 正向测试 |
| INT-14  | 验证 prompts 的结构一致性              | 正向测试 |
| INT-15  | create spec prompt 快照测试            | 回归测试 |
| INT-16  | init steering prompt 快照测试          | 回归测试 |
| INT-17  | create custom steering prompt 快照测试 | 回归测试 |
| INT-18  | refine steering prompt 快照测试        | 回归测试 |
| INT-19  | delete steering prompt 快照测试        | 回归测试 |

## 详细测试步骤

### INT-01: 生成正确的 spec 创建 prompt

**测试目的**: 验证 create-spec prompt 能够正确渲染并包含所有必需元素

**准备数据**:

- 初始化 PromptLoader 并加载真实 prompts
- 变量数据：

  ```typescript
  {
    description: 'A user authentication system with OAuth support',
    workspacePath: '/Users/test/my-project',
    specBasePath: '.claude/specs'
  }
  ```

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('create-spec', variables)`
2. 检查返回的字符串内容
3. 验证包含所有提供的变量值
4. 验证包含系统指令和工作流说明

**预期结果**:

- 包含 'A user authentication system with OAuth support'
- 包含 '/Users/test/my-project'
- 包含 '.claude/specs'
- 包含 '<system>' 标签
- 包含 'spec workflow' 说明
- 包含 'Requirements'、'Design'、'Tasks' 阶段

### INT-02: 验证 spec prompt 包含目录创建指令

**测试目的**: 验证 spec 创建 prompt 包含正确的目录创建指令

**准备数据**:

- 使用与 INT-01 相同的变量

**测试步骤**:

1. 渲染 create-spec prompt
2. 搜索目录创建相关的关键词
3. 验证路径引用

**预期结果**:

- 包含 'mkdir' 或 'create.*directory' 模式
- 包含 '.claude/specs' 路径引用

### INT-03: 生成 steering 初始化 prompt

**测试目的**: 验证 init-steering prompt 能够正确生成初始化指令

**准备数据**:

- 变量数据：

  ```typescript
  {
    steeringPath: '/Users/test/project/.claude/steering'
  }
  ```

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('init-steering', variables)`
2. 验证返回内容的关键元素
3. 检查路径正确替换

**预期结果**:

- 包含 'steering documents'
- 包含 '/Users/test/project/.claude/steering'
- 包含 'codebase' 关键词

### INT-04: 验证 steering prompt 包含分析指令

**测试目的**: 验证初始化 prompt 包含代码库分析的相关指令

**准备数据**:

- 使用与 INT-03 相同的变量

**测试步骤**:

1. 渲染 init-steering prompt
2. 搜索分析相关的关键词
3. 验证包含模式和约定说明

**预期结果**:

- 包含 'analyzing' 关键词
- 包含 'patterns'
- 包含 'conventions'

### INT-05: 验证 steering prompt 包含文件指令

**测试目的**: 验证初始化 prompt 包含创建必需文件的指令

**准备数据**:

- 使用与 INT-03 相同的变量

**测试步骤**:

1. 渲染 init-steering prompt
2. 检查文件创建相关内容
3. 验证三个核心文件的说明

**预期结果**:

- 包含 'file' 关键词
- 包含 '.md' 扩展名
- 包含 'product.md'、'tech.md'、'structure.md' 文件名

### INT-06: 生成自定义 steering 创建 prompt

**测试目的**: 验证 create-custom-steering prompt 的正确渲染

**准备数据**:

- 变量数据：

  ```typescript
  {
    description: 'Security best practices for API development',
    steeringPath: '/test/project/.claude/steering'
  }
  ```

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('create-custom-steering', variables)`
2. 验证描述正确插入
3. 验证路径正确替换

**预期结果**:

- 包含 'Security best practices for API development'
- 包含 'steering document'
- 包含 '/test/project/.claude/steering'

### INT-07: 验证自定义 steering 文件命名指令

**测试目的**: 验证 prompt 包含正确的文件命名指导

**准备数据**:

- 使用与 INT-06 相同的变量

**测试步骤**:

1. 渲染 create-custom-steering prompt
2. 搜索文件命名相关指令
3. 验证命名格式说明

**预期结果**:

- 包含 'Choose an appropriate kebab-case filename'
- 包含 '.md' 扩展名说明

### INT-08: 生成 steering 精炼 prompt

**测试目的**: 验证 refine-steering prompt 的功能

**准备数据**:

- 变量数据：

  ```typescript
  {
    filePath: '/test/project/.claude/steering/security.md'
  }
  ```

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('refine-steering', variables)`
2. 验证文件路径正确插入
3. 验证包含精炼指令

**预期结果**:

- 包含 '/test/project/.claude/steering/security.md'
- 包含 'refine' 关键词
- 包含 'Review and refine'

### INT-09: 验证精炼 prompt 改进指南

**测试目的**: 验证精炼 prompt 包含具体的改进指导原则

**准备数据**:

- 使用与 INT-08 相同的变量

**测试步骤**:

1. 渲染 refine-steering prompt
2. 检查改进指南内容
3. 验证具体的指导原则

**预期结果**:

- 包含 'clear and direct'
- 包含 'specific to this project'
- 包含 'concrete examples'

### INT-10: 生成 steering 删除 prompt

**测试目的**: 验证 delete-steering prompt 的正确生成

**准备数据**:

- 变量数据：

  ```typescript
  {
    documentName: 'security-practices.md',
    steeringPath: '/test/.claude/steering'
  }
  ```

**测试步骤**:

1. 调用 `promptLoader.renderPrompt('delete-steering', variables)`
2. 验证文档名称正确插入
3. 验证路径和删除说明

**预期结果**:

- 包含 'security-practices.md'
- 包含 'delete' 关键词
- 包含 '/test/.claude/steering'

### INT-11: 验证所有 prompts 的 frontmatter

**测试目的**: 验证所有加载的 prompts 都有有效的元数据

**准备数据**:

- 初始化的 PromptLoader 实例

**测试步骤**:

1. 调用 `promptLoader.listPrompts()`
2. 遍历所有 prompt 元数据
3. 验证每个 prompt 的必需字段

**预期结果**:

- 每个 prompt 都有非空的 id
- 每个 prompt 都有非空的 name
- 每个 prompt 的 version 符合语义化版本格式（\d+\.\d+\.\d+）

### INT-12: 验证所有 prompts 可成功渲染

**测试目的**: 验证所有 prompts 在提供必需变量时都能成功渲染

**准备数据**:

- 每个 prompt 的测试变量集：

  ```typescript
  [
    { id: 'create-spec', variables: { description: 'test', workspacePath: '/test', specBasePath: '.claude/specs' } },
    { id: 'init-steering', variables: { steeringPath: '/test/.claude/steering' } },
    // ... 其他 prompts
  ]
  ```

**测试步骤**:

1. 遍历所有测试用例
2. 为每个 prompt 调用 renderPrompt
3. 验证不抛出异常

**预期结果**:

- 所有 prompts 都能成功渲染
- 不抛出任何异常

### INT-13: 验证渲染内容不含模板错误

**测试目的**: 验证渲染后的内容不包含未解析的模板标记

**准备数据**:

- 使用与 INT-12 相同的测试数据

**测试步骤**:

1. 渲染每个 prompt
2. 检查常见的模板错误标记
3. 验证内容完整性

**预期结果**:

- 不包含 '{{'
- 不包含 '}}'
- 不包含 'undefined'
- 不包含 '[object Object]'

### INT-14: 验证 prompts 的结构一致性

**测试目的**: 验证主要 prompts 保持一致的结构

**准备数据**:

- spec 和 steering prompts 的渲染结果

**测试步骤**:

1. 渲染 create-spec prompt
2. 渲染 init-steering prompt
3. 比较两者的结构元素

**预期结果**:

- 两者都包含 <system> 标签结构
- 都遵循相似的文档格式

### INT-15: spec 创建 prompt 快照测试

**测试目的**: 使用快照测试确保 spec 创建 prompt 输出的稳定性

**准备数据**:

- 固定的测试变量：

  ```typescript
  {
    description: 'User authentication with JWT',
    workspacePath: '/snapshot/test',
    specBasePath: '.claude/specs'
  }
  ```

**测试步骤**:

1. 渲染 create-spec prompt
2. 生成或比较快照
3. 验证输出未发生意外变化

**预期结果**:

- 输出与保存的快照匹配
- 任何变化都需要明确审查和更新

### INT-16: steering 初始化 prompt 快照测试

**测试目的**: 使用快照测试确保 steering 初始化 prompt 的稳定性

**准备数据**:

- 固定的测试变量：

  ```typescript
  {
    steeringPath: '/snapshot/test/.claude/steering'
  }
  ```

**测试步骤**:

1. 渲染 init-steering prompt
2. 生成或比较快照
3. 验证输出的一致性

**预期结果**:

- 输出与保存的快照匹配
- 保持向后兼容性

### INT-17: 创建自定义 steering prompt 快照测试

**测试目的**: 使用快照测试确保自定义 steering 创建 prompt 的稳定性

**准备数据**:

- 固定的测试变量：

  ```typescript
  {
    description: 'API design patterns and best practices',
    steeringPath: '/snapshot/test/.claude/steering'
  }
  ```

**测试步骤**:

1. 渲染 create-custom-steering prompt
2. 生成或比较快照
3. 验证输出的一致性

**预期结果**:

- 输出与保存的快照匹配
- 包含用户提供的描述信息

### INT-18: 精炼 steering prompt 快照测试

**测试目的**: 使用快照测试确保 steering 精炼 prompt 的稳定性

**准备数据**:

- 固定的测试变量：

  ```typescript
  {
    filePath: '/snapshot/test/.claude/steering/api-guidelines.md'
  }
  ```

**测试步骤**:

1. 渲染 refine-steering prompt
2. 生成或比较快照
3. 验证精炼指导内容的稳定性

**预期结果**:

- 输出与保存的快照匹配
- 包含正确的文件路径引用

### INT-19: 删除 steering prompt 快照测试

**测试目的**: 使用快照测试确保 steering 删除 prompt 的稳定性

**准备数据**:

- 固定的测试变量：

  ```typescript
  {
    documentName: 'deprecated-guidelines.md',
    steeringPath: '/snapshot/test/.claude/steering'
  }
  ```

**测试步骤**:

1. 渲染 delete-steering prompt
2. 生成或比较快照
3. 验证删除操作的提示内容

**预期结果**:

- 输出与保存的快照匹配
- 包含文档名称和路径信息

## 测试注意事项

### 真实文件依赖

- 集成测试使用真实的 prompt 文件
- 确保 prompts/target 目录已正确编译
- 测试前运行 build-prompts 脚本

### 快照测试管理

- 快照文件保存在 **snapshots** 目录
- 更新快照需要明确的意图：`npm test -- -u`
- 定期审查快照变化，避免意外回归

### 变量覆盖

- 测试应覆盖必需和可选变量的各种组合
- 边界情况：空字符串、特殊字符、长文本
- 确保错误路径也被测试

### 性能监控

- 集成测试比单元测试慢
- 监控测试执行时间
- 必要时优化或并行化测试
